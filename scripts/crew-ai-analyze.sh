#!/usr/bin/env bash
# ============================================================
#  OPENROUTER CREW PLATFORM — AI Deep Analysis Orchestrator
#  crew-ai-analyze.sh
#
#  Principles (March 2026 best practices):
#   • Meta-prompting  — LLM improves its own prompts per task
#   • Chain-of-Thought — step-by-step reasoning enforced via XML
#   • Complexity routing — Haiku / Sonnet / Opus via OpenRouter
#   • XML-delimited context — tight boundaries, no prompt bleed
#   • Few-shot examples  — inline per analysis type
#   • Budget guard       — hard-stop at configurable limit
# ============================================================

set -euo pipefail
IFS=$'\n\t'

# ── colour helpers ──────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
log()  { echo -e "${CYAN}[CREW]${RESET}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
ok()   { echo -e "${GREEN}[OK]${RESET}    $*"; }
err()  { echo -e "${RED}[ERR]${RESET}   $*" >&2; }
head() { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }

# ── config ──────────────────────────────────────────────────
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
OPENROUTER_BASE="https://openrouter.ai/api/v1"

# Locate repo root whether called from scripts/ or root
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$_SCRIPT_DIR/../package.json" ]]; then
  _DEFAULT_REPO="$(cd "$_SCRIPT_DIR/.." && pwd)"
else
  _DEFAULT_REPO="$(pwd)"
fi

MODEL_CHEAP="anthropic/claude-haiku-4-5"       # triage / indexing
MODEL_MID="anthropic/claude-sonnet-4-5"        # deep analysis
MODEL_POWERFUL="anthropic/claude-sonnet-4-5"   # architecture synthesis

MAX_BUDGET_USD="${CREW_BUDGET:-2.00}"
OUTPUT_DIR="${OUTPUT_DIR:-./ai-analysis-output}"
REPO_ROOT="${REPO_ROOT:-$_DEFAULT_REPO}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/analysis_${TIMESTAMP}.md"
PROMPT_LOG="$OUTPUT_DIR/prompt_log_${TIMESTAMP}.jsonl"
COST_ACCUMULATOR=0

ANALYSIS_MODES=(
  "architecture"
  "duplication"
  "cost_optimization"
  "prompt_engineering"
  "local_test_readiness"
  "deployment_gaps"
)

# ── guards ───────────────────────────────────────────────────
check_deps() {
  local missing=()
  for dep in curl jq node; do
    command -v "$dep" &>/dev/null || missing+=("$dep")
  done
  [[ ${#missing[@]} -gt 0 ]] && { err "Missing deps: ${missing[*]}"; exit 1; }
}

check_api_key() {
  [[ -z "$OPENROUTER_API_KEY" ]] && {
    err "OPENROUTER_API_KEY not set."
    echo "  export OPENROUTER_API_KEY=sk-or-..."
    exit 1
  }
}

# ── cost tracker ─────────────────────────────────────────────
# Rough estimate: input $3/M tokens, output $15/M (Sonnet 4.5)
estimate_cost() {
  local tokens_in=$1 tokens_out=$2 model=$3
  case "$model" in
    *haiku*)  echo "$(echo "scale=6; $tokens_in*0.00025/1000 + $tokens_out*0.00125/1000" | bc)" ;;
    *sonnet*) echo "$(echo "scale=6; $tokens_in*0.003/1000  + $tokens_out*0.015/1000"  | bc)" ;;
    *opus*)   echo "$(echo "scale=6; $tokens_in*0.015/1000  + $tokens_out*0.075/1000"  | bc)" ;;
    *)        echo "0.01" ;;
  esac
}

guard_budget() {
  local current_cost=$1
  local over
  over=$(echo "$current_cost > $MAX_BUDGET_USD" | bc -l 2>/dev/null || echo 0)
  [[ "$over" == "1" ]] && {
    warn "Budget cap \$$MAX_BUDGET_USD reached (spent \$$current_cost). Stopping."
    exit 0
  }
}

# ── OpenRouter call ───────────────────────────────────────────
#   Uses XML-delimited prompts + chain-of-thought prefix
call_openrouter() {
  local model="$1" system_prompt="$2" user_prompt="$3" label="$4"
  local temperature="${5:-0.2}"

  log "Calling [$label] via $model …"

  # Build the JSON payload
  local payload
  payload=$(jq -n \
    --arg model  "$model" \
    --arg system "$system_prompt" \
    --arg user   "$user_prompt" \
    --argjson temp "$temperature" \
    '{
      model:       $model,
      temperature: $temp,
      max_tokens:  4096,
      messages: [
        { role: "system",    content: $system },
        { role: "user",      content: $user   }
      ]
    }')

  local response
  response=$(curl -s -X POST "$OPENROUTER_BASE/chat/completions" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -H "Content-Type: application/json" \
    -H "HTTP-Referer: https://github.com/familiarcat/openrouter-crew-platform" \
    -H "X-Title: OpenRouter Crew Analyzer" \
    -d "$payload" 2>&1) || {
      err "cURL failed for [$label]"
      echo "ERROR: cURL failed"
      return 1
    }

  # Parse & accumulate cost
  local tok_in tok_out content
  tok_in=$(echo "$response"  | jq -r '.usage.prompt_tokens     // 0' 2>/dev/null || echo 0)
  tok_out=$(echo "$response" | jq -r '.usage.completion_tokens // 0' 2>/dev/null || echo 0)
  content=$(echo "$response" | jq -r '.choices[0].message.content // "ERROR: no content"' 2>/dev/null || echo "ERROR: jq parse failed")

  local cost
  cost=$(estimate_cost "$tok_in" "$tok_out" "$model")
  COST_ACCUMULATOR=$(echo "$COST_ACCUMULATOR + $cost" | bc -l 2>/dev/null || echo "$COST_ACCUMULATOR")

  # Log to JSONL
  echo "{\"label\":\"$label\",\"model\":\"$model\",\"tok_in\":$tok_in,\"tok_out\":$tok_out,\"cost_usd\":$cost}" \
    >> "$PROMPT_LOG" 2>/dev/null || true

  guard_budget "$COST_ACCUMULATOR"
  echo "$content"
}

# ── codebase snapshot ────────────────────────────────────────
build_context_snapshot() {
  head "Building codebase context snapshot"

  # Gather structure (dirs only, limited depth)
  local structure
  structure=$(find "$REPO_ROOT" \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/dist/*' \
    -not -path '*/.next/*' \
    -not -path '*/build/*' \
    -maxdepth 5 \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.sh" \) \
    2>/dev/null | head -300 | sed "s|$REPO_ROOT/||g" | sort)

  # Key config files
  local pkg_json="" turbo_json="" pnpm_ws=""
  [[ -f "$REPO_ROOT/package.json" ]]      && pkg_json=$(cat "$REPO_ROOT/package.json" | head -80)
  [[ -f "$REPO_ROOT/turbo.json" ]]        && turbo_json=$(cat "$REPO_ROOT/turbo.json" | head -60)
  [[ -f "$REPO_ROOT/pnpm-workspace.yaml" ]] && pnpm_ws=$(cat "$REPO_ROOT/pnpm-workspace.yaml")
  ai_ctx=""
  [[ -f "$REPO_ROOT/.ai-context.md" ]]    && ai_ctx=$(head -200 "$REPO_ROOT/.ai-context.md")

  # Duplicate detection: agent directories
  local agent_dirs
  agent_dirs=$(find "$REPO_ROOT" -type d -name "agents" \
    -not -path '*/node_modules/*' 2>/dev/null | sed "s|$REPO_ROOT/||g")

  # Scripts inventory
  local scripts_list
  scripts_list=$(find "$REPO_ROOT/scripts" -type f -name "*.sh" 2>/dev/null \
    | sed "s|$REPO_ROOT/||g" | head -50)

  cat <<EOF
<codebase_snapshot>
  <meta>
    <repo>openrouter-crew-platform</repo>
    <timestamp>$(date -u +"%Y-%m-%dT%H:%M:%SZ")</timestamp>
    <total_approx_files>2071</total_approx_files>
    <total_approx_lines>339367</total_approx_lines>
    <package_manager>pnpm 9.x workspaces</package_manager>
    <build_system>Turborepo 2.x</build_system>
    <primary_language>TypeScript 5.9</primary_language>
  </meta>

  <file_tree_sample>
$structure
  </file_tree_sample>

  <agent_directories>
$agent_dirs
  </agent_directories>

  <scripts_inventory>
$scripts_list
  </scripts_inventory>

  <package_json_root>
$pkg_json
  </package_json_root>

  <turbo_config>
$turbo_json
  </turbo_config>

  <pnpm_workspace>
$pnpm_ws
  </pnpm_workspace>

  <ai_context_header>
$ai_ctx
  </ai_context_header>
</codebase_snapshot>
EOF
}

# ════════════════════════════════════════════════════════════
#  ANALYSIS MODULES — each is a self-contained prompting unit
# ════════════════════════════════════════════════════════════

# ── 1. Architecture Analysis ─────────────────────────────────
analyze_architecture() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are a senior software architect specialising in Domain-Driven Design (DDD),
TypeScript monorepos, and AI-native SaaS platforms. You reason step-by-step and
produce actionable, numbered recommendations.
</system_role>

<behaviour>
- Think through EACH domain boundary before making a claim
- Cite specific paths from <codebase_snapshot> as evidence
- Prioritise high-impact, low-risk changes
- Use chain-of-thought: state your reasoning before conclusions
</behaviour>

<output_format>
## Architecture Analysis
### DDD Boundary Assessment (step-by-step)
### Cross-Domain Import Violations
### Recommended Consolidations (numbered, with file paths)
### Risk Matrix (High/Med/Low for each change)
</output_format>'

  local USER="<task>Perform a deep Domain-Driven Design analysis of this monorepo.
Identify: (1) domain boundary violations, (2) shared packages that should be
consolidated, (3) apps that duplicate domain logic, (4) the optimal package
count for a lean but complete platform.

Chain-of-thought requirement: For each finding, explain WHY it is a problem
and WHAT the correct DDD placement would be.

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_MID" "$SYSTEM" "$USER" "architecture" 0.1
}

# ── 2. Duplication Detector ───────────────────────────────────
analyze_duplication() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are a codebase refactoring expert focused on DRY principles and template
extraction in pnpm monorepos.
</system_role>

<behaviour>
- List every structural duplicate you detect with path evidence
- Propose a concrete shared template or factory pattern to replace them
- Estimate lines-of-code saved per consolidation
- Prioritise: consolidations that unblock CI/CD automation first
</behaviour>'

  local USER="<task>
Analyse this monorepo for structural duplication.

Key signals to look for:
1. The dj-booking and test-event-venue agent directories appear structurally
   identical — confirm this and propose a base template.
2. Multiple Next.js dashboard apps across domains — assess if they should merge.
3. Repeated tsconfig patterns — propose a single extended base.
4. fix-*.md files at root level — propose a docs/ consolidation.

<few_shot_example>
Input signal: /domains/product-factory/project-templates/dj-booking/agents/booking-agent
              /domains/product-factory/projects/test-event-venue/agents/booking-agent
Output: DUPLICATE — same Express+Anthropic agent pattern. Extract to:
        /domains/product-factory/templates/base-agent/ with 5 specialisations.
        Saves ~2,400 lines.
</few_shot_example>

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_MID" "$SYSTEM" "$USER" "duplication" 0.1
}

# ── 3. Cost Optimisation ──────────────────────────────────────
analyze_cost_optimization() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are an LLM cost optimisation engineer. You specialise in OpenRouter
multi-model routing, token budget strategies, and semantic caching patterns
for AI-native SaaS products targeting <$2/execution.
</system_role>

<march_2026_context>
Current OpenRouter pricing (approximate):
- claude-haiku-4-5:    $0.00025/1K in, $0.00125/1K out  (triage, simple tasks)
- claude-sonnet-4-5:   $0.003/1K in,   $0.015/1K out   (complex reasoning)
- deepseek/deepseek-r1: $0.00055/1K in  (strong reasoning at Haiku price range)
- google/gemini-flash-2: $0.000075/1K in (ultra-cheap for simple transforms)
Best practice 2026: route by complexity score, not task type.
</march_2026_context>'

  local USER="<task>
Review the cost optimisation architecture of this platform.

Deliverables:
1. Current routing strategy assessment (from snapshot)
2. Three concrete improvements using 2026 best-practice models
3. Caching strategy gaps (semantic cache, output cache, query cache)
4. Token reduction techniques (prompt compression, few-shot trimming)
5. A revised routing table with model names and complexity thresholds

Target: keep BarItalia-style generation under \$1.50 as budget grows.

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_MID" "$SYSTEM" "$USER" "cost_optimization" 0.1
}

# ── 4. Prompt Engineering Audit ──────────────────────────────
analyze_prompt_engineering() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are a prompt engineering specialist applying 2026 best practices:
meta-prompting, DSPy-style optimisation, chain-of-thought chaining,
XML context delimitation, and inference-time scaling.
</system_role>

<march_2026_best_practices>
1. XML tags for context boundaries — no prompt bleed
2. <system_role> + <behaviour> + <output_format> trifecta
3. Chain-of-thought: state reasoning BEFORE conclusion
4. Few-shot examples inline — 2-3 examples beat long instructions
5. Meta-prompting: prompt templates that generate prompts
6. Complexity scoring before model selection (not rule-based)
7. Self-critique loop: draft → critique → revise in single call
8. Structured outputs: JSON schema in prompt, parse with zod
9. Tool-use as first-class: prefer function calling over text parsing
10. Budget tokens: keep system prompts under 800 tokens
</march_2026_best_practices>'

  local USER="<task>
Audit the AI prompting architecture of this platform and prescribe improvements.

Analysis areas:
1. Where are prompts currently defined? (search for template literals, strings)
2. Are XML tags used consistently for context delimitation?
3. Is chain-of-thought enforced or optional?
4. Are there self-improving / meta-prompting loops?
5. How are agent roles defined? Are they tight or vague?

Produce:
- A prompt template library spec (what templates the platform needs)
- A meta-prompt system for generating new agent prompts
- A self-critique loop pattern for the product-factory domain
- Concrete before/after examples of upgraded prompts

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_MID" "$SYSTEM" "$USER" "prompt_engineering" 0.15
}

# ── 5. Local Test Readiness ────────────────────────────────────
analyze_local_test_readiness() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are a DevOps engineer specialising in local development environments,
Docker Compose orchestration, and pnpm monorepo testing strategies.
</system_role>'

  local USER="<task>
Assess the local testing readiness of this platform.

Checklist to evaluate from the snapshot:
1. docker-compose.local.yml — is it complete and safe to run?
2. Environment variable coverage — is .env.local.example current?
3. pnpm scripts — are dev/test/build commands consistent?
4. Supabase local setup — does it work without cloud credentials?
5. Missing integration test coverage for core flows
6. Port conflicts — identify services that clash on default ports

Output a numbered READY/BLOCKED/GAP assessment for each item,
then a prioritised fix list to get to local-green in one session.

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_CHEAP" "$SYSTEM" "$USER" "local_test_readiness" 0.1
}

# ── 6. Deployment Gaps ────────────────────────────────────────
analyze_deployment_gaps() {
  local snapshot="$1"

  local SYSTEM='<system_role>
You are a cloud infrastructure engineer experienced with AWS EC2, Vercel,
Terraform workspaces, and Docker-based monorepo deployments.
</system_role>'

  local USER="<task>
Identify deployment gaps that would block moving from local to production.

Focus areas:
1. Terraform workspace completeness (staging vs production parity)
2. GitHub Actions CI/CD — is the pipeline complete?
3. Docker multi-stage builds — are they optimised for the monorepo?
4. Vercel deployment config — is vercel.json complete for Next.js apps?
5. Secrets management — are all required env vars documented?
6. Health check endpoints — are they implemented?

Produce a deployment readiness checklist with DONE/TODO/BLOCKED status.

<codebase_snapshot>
$snapshot
</codebase_snapshot>
</task>"

  call_openrouter "$MODEL_CHEAP" "$SYSTEM" "$USER" "deployment_gaps" 0.1
}

# ── 7. Synthesis — the "meta-prompt" pass ─────────────────────
synthesize_report() {
  local all_findings="$1"

  local SYSTEM='<system_role>
You are a Chief Architect synthesising multiple analysis passes into a
single, prioritised action plan for a full-stack AI SaaS platform.
You think in sprints, ROI, and risk-adjusted value delivery.
</system_role>

<self_critique_instruction>
After drafting the plan, critique it once:
- Are the priorities correct given limited dev time?
- Is anything missing that would block progress?
- Are the quick wins truly quick?
Then revise the plan based on your critique.
</self_critique_instruction>'

  local USER="<task>
Synthesise these analysis results into a master action plan.

<analysis_findings>
$all_findings
</analysis_findings>

Deliverables:
1. Executive Summary (5 bullets)
2. Sprint 1 (this week) — 3 to 5 tasks, max 2h each
3. Sprint 2 (next week) — structural improvements
4. Sprint 3 (following week) — automation and deployment
5. Long-term vision (1 paragraph)
6. Quick wins that can be done in <30 minutes right now

Format as actionable Markdown with checkboxes.
</task>"

  call_openrouter "$MODEL_POWERFUL" "$SYSTEM" "$USER" "synthesis" 0.2
}

# ════════════════════════════════════════════════════════════
#  REPORT WRITER
# ════════════════════════════════════════════════════════════
write_report() {
  local mode="$1" content="$2"
  {
    echo ""
    echo "---"
    echo "## $mode"
    echo ""
    echo "$content"
  } >> "$REPORT_FILE"
}

# ════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════
main() {
  head "OpenRouter Crew — AI Deep Analysis"
  echo "  Repo:    $REPO_ROOT"
  echo "  Output:  $OUTPUT_DIR"
  echo "  Budget:  \$$MAX_BUDGET_USD"
  echo "  Models:  Haiku (triage) → Sonnet (analysis) → Sonnet (synthesis)"

  check_deps
  check_api_key
  mkdir -p "$OUTPUT_DIR"

  # Initialise report
  cat > "$REPORT_FILE" <<HEADER
# OpenRouter Crew Platform — AI Deep Analysis
**Generated:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Budget used:** \$COST_TBD
**Models:** $MODEL_CHEAP / $MODEL_MID / $MODEL_POWERFUL

HEADER

  # Build snapshot once (expensive)
  log "Building codebase snapshot..."
  SNAPSHOT=$(build_context_snapshot)
  ok "Snapshot built ($(echo "$SNAPSHOT" | wc -l) context lines)"

  # Run selected modes
  declare -A FINDINGS
  local ALL_FINDINGS=""

  for mode in "${ANALYSIS_MODES[@]}"; do
    head "Running: $mode"
    local result=""
    case "$mode" in
      architecture)        result=$(analyze_architecture       "$SNAPSHOT") ;;
      duplication)         result=$(analyze_duplication        "$SNAPSHOT") ;;
      cost_optimization)   result=$(analyze_cost_optimization  "$SNAPSHOT") ;;
      prompt_engineering)  result=$(analyze_prompt_engineering "$SNAPSHOT") ;;
      local_test_readiness) result=$(analyze_local_test_readiness "$SNAPSHOT") ;;
      deployment_gaps)     result=$(analyze_deployment_gaps    "$SNAPSHOT") ;;
    esac
    write_report "$mode" "$result"
    ALL_FINDINGS+="### $mode\n$result\n\n"
    ok "$mode complete (\$$COST_ACCUMULATOR spent so far)"
  done

  # Synthesis pass
  head "Synthesising master action plan"
  SYNTHESIS=$(synthesize_report "$ALL_FINDINGS")
  write_report "MASTER ACTION PLAN" "$SYNTHESIS"

  # Patch budget line in report
  sed -i "s/COST_TBD/$COST_ACCUMULATOR/" "$REPORT_FILE" 2>/dev/null || true

  head "Analysis Complete"
  ok "Report: $REPORT_FILE"
  ok "Cost log: $PROMPT_LOG"
  printf "${BOLD}Total cost: \$%s${RESET}\n" "$COST_ACCUMULATOR"
  echo ""
  echo "Next steps:"
  echo "  cat $REPORT_FILE | less -R"
  echo "  grep 'Sprint 1' $REPORT_FILE"
}

# ── CLI entry point ───────────────────────────────────────────
usage() {
  echo "Usage: $0 [--repo <path>] [--budget <usd>] [--mode <mode,...>] [--dry-run]"
  echo ""
  echo "Options:"
  echo "  --repo     Path to repo root (default: .)"
  echo "  --budget   Max USD to spend (default: 2.00)"
  echo "  --mode     Comma-separated modes: ${ANALYSIS_MODES[*]}"
  echo "  --dry-run  Print snapshot and prompts, don't call API"
  echo "  --help     This message"
}

DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)    REPO_ROOT="$2"; shift 2 ;;
    --budget)  MAX_BUDGET_USD="$2"; shift 2 ;;
    --mode)    IFS=',' read -ra ANALYSIS_MODES <<< "$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) err "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ "$DRY_RUN" == "true" ]]; then
  log "DRY RUN — building snapshot only"
  SNAPSHOT=$(build_context_snapshot)
  echo "$SNAPSHOT"
  ok "Dry run complete. No API calls made."
  exit 0
fi

main

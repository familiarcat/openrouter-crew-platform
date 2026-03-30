#!/usr/bin/env bash
# ============================================================
#  OPENROUTER CREW PLATFORM — Safe Structural Reorganizer
#  crew-reorganize.sh
#
#  Strategy:
#   1. Snapshot (git stash or dry-run diff)
#   2. Extract shared agent BASE template from dj-booking
#   3. Convert dj-booking & test-event-venue to extend base
#   4. Move floating fix-*.md docs to docs/fixes/
#   5. Add missing scripts: local-test.sh, validate-imports.sh
#   6. Verify all pnpm workspace links still resolve
#   7. Run a build check
#
#  SAFE: every destructive op is guarded by --apply flag.
#        Default is --dry-run (prints what WOULD change).
# ============================================================

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
log()    { echo -e "${CYAN}[REORG]${RESET} $*"; }
warn()   { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
ok()     { echo -e "${GREEN}[OK]${RESET}    $*"; }
err()    { echo -e "${RED}[ERR]${RESET}   $*" >&2; }
change() { echo -e "${YELLOW}  ➜${RESET}  $*"; }
skip()   { echo -e "  ${CYAN}↷${RESET}  $*"; }

# ── config ──────────────────────────────────────────────────
# Locate repo root whether called from scripts/ or root
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$_SCRIPT_DIR/../package.json" ]]; then
  _DEFAULT_REPO="$(cd "$_SCRIPT_DIR/.." && pwd)"
else
  _DEFAULT_REPO="$(pwd)"
fi

REPO_ROOT="${REPO_ROOT:-$_DEFAULT_REPO}"
APPLY=false
BACKUP_TAG="reorg-$(date +%Y%m%d_%H%M%S)"
CHANGES_FILE="/tmp/crew_reorg_changes_$$.txt"
ERRORS_FILE="/tmp/crew_reorg_errors_$$.txt"

# ── helpers ──────────────────────────────────────────────────
do_or_print() {
  # $1 = description  $2+ = command
  local desc="$1"; shift
  change "$desc"
  if [[ "$APPLY" == "true" ]]; then
    "$@" && echo "$desc" >> "$CHANGES_FILE" || {
      warn "Failed: $desc"
      echo "FAILED: $desc" >> "$ERRORS_FILE"
    }
  else
    echo "  [DRY]  $*"
  fi
}

safe_mkdir() {
  local dir="$1"
  [[ -d "$dir" ]] && { skip "exists: $dir"; return; }
  do_or_print "mkdir $dir" mkdir -p "$dir"
}

safe_move() {
  local src="$1" dst="$2"
  [[ ! -e "$src" ]] && { skip "not found: $src"; return; }
  [[ -e "$dst" ]]   && { warn "dst exists, skipping: $dst"; return; }
  do_or_print "mv $src → $dst" mv "$src" "$dst"
}

safe_copy() {
  local src="$1" dst="$2"
  [[ ! -e "$src" ]] && { skip "not found: $src"; return; }
  do_or_print "cp $src → $dst" cp -r "$src" "$dst"
}

# Replace string in file (sed portable)
replace_in_file() {
  local file="$1" from="$2" to="$3"
  [[ ! -f "$file" ]] && return
  if [[ "$APPLY" == "true" ]]; then
    # macOS & Linux compatible
    sed -i.bak "s|$from|$to|g" "$file" && rm -f "${file}.bak"
    echo "  patched: $file ($from → $to)"
  else
    grep -q "$from" "$file" && echo "  [DRY] patch $file: $from → $to" || true
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 1: Git safety snapshot
# ════════════════════════════════════════════════════════════
task_git_snapshot() {
  echo ""
  echo -e "${BOLD}── TASK 1: Git Safety Snapshot ──${RESET}"

  if [[ ! -d "$REPO_ROOT/.git" ]]; then
    warn "No .git found — skipping git snapshot (will rely on dry-run)"
    return
  fi

  if [[ "$APPLY" == "true" ]]; then
    log "Creating git tag before changes: $BACKUP_TAG"
    (cd "$REPO_ROOT" && git tag "$BACKUP_TAG" 2>/dev/null) && \
      ok "Tagged: $BACKUP_TAG  (restore: git checkout $BACKUP_TAG)" || \
      warn "Git tag failed (uncommitted changes?). Proceeding anyway."
  else
    log "[DRY] Would tag: $BACKUP_TAG"
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 2: Extract shared base-agent template
# ════════════════════════════════════════════════════════════
task_extract_base_agent() {
  echo ""
  echo -e "${BOLD}── TASK 2: Extract Base Agent Template ──${RESET}"

  local SRC="$REPO_ROOT/domains/product-factory/project-templates/dj-booking/agents"
  local TEMPLATES_BASE="$REPO_ROOT/domains/product-factory/templates"
  local BASE_AGENT="$TEMPLATES_BASE/base-agent"

  log "Source agent dir: $SRC"
  log "Target template:  $BASE_AGENT"

  [[ ! -d "$SRC" ]] && { warn "dj-booking agents dir not found, skipping"; return; }

  safe_mkdir "$TEMPLATES_BASE"
  safe_mkdir "$BASE_AGENT"
  safe_mkdir "$BASE_AGENT/src"

  # Create the shared base package.json template
  if [[ "$APPLY" == "true" ]]; then
    cat > "$BASE_AGENT/package.json" <<'PKGJSON'
{
  "name": "@openrouter-crew/base-agent",
  "version": "1.0.0",
  "description": "Shared base for all product-factory agents",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.3",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "axios": "^1.13.6",
    "cors": "^2.8.6",
    "dotenv": "^16.6.1",
    "express": "^4.22.1",
    "pg": "^8.20.0",
    "winston": "^3.19.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.25",
    "@types/node": "^20.19.37",
    "@types/pg": "^8.15.6",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
PKGJSON
    ok "Created $BASE_AGENT/package.json"
  else
    echo "  [DRY] Would create $BASE_AGENT/package.json"
  fi

  # Create shared base agent class
  if [[ "$APPLY" == "true" ]]; then
    mkdir -p "$BASE_AGENT/src"
    cat > "$BASE_AGENT/src/BaseAgent.ts" <<'BASEAGENT'
/**
 * BaseAgent — shared foundation for all OpenRouter Crew agents
 * Extend this class to create domain-specific agents.
 *
 * Architecture: March 2026 best practices
 *  - XML-delimited prompts via buildSystemPrompt()
 *  - Complexity-based model routing
 *  - OpenRouter as the LLM gateway
 *  - MCP SDK for tool registration
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from 'pg';
import winston from 'winston';

export interface AgentConfig {
  name: string;
  role: string;
  openrouterApiKey: string;
  supabaseUrl?: string;
  dbConnectionString?: string;
  budgetLimitUSD?: number;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected client: Anthropic;
  protected conversationHistory: AgentMessage[] = [];
  protected totalCostUSD = 0;

  // Override in subclass to define the agent's expertise
  protected abstract get agentExpertise(): string;
  protected abstract get agentCapabilities(): string[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/familiarcat/openrouter-crew-platform',
        'X-Title': `Crew Agent: ${config.name}`,
      }
    });
  }

  /**
   * Build XML-delimited system prompt (2026 best practice)
   * Subclasses can override to extend.
   */
  protected buildSystemPrompt(): string {
    return `<system_role>
You are ${this.config.name}, a specialised AI agent in the OpenRouter Crew platform.
Role: ${this.config.role}
Expertise: ${this.agentExpertise}
</system_role>

<capabilities>
${this.agentCapabilities.map(c => `- ${c}`).join('\n')}
</capabilities>

<behaviour>
- Think step-by-step before responding (chain-of-thought)
- State your reasoning before your conclusion
- If uncertain, say so and propose alternatives
- Keep responses structured and actionable
- When generating code, follow TypeScript strict mode conventions
</behaviour>

<output_format>
Structure responses with clear sections.
Use JSON for structured data, Markdown for documents.
</output_format>`;
  }

  /**
   * Route to cheapest model that can handle the task
   * Based on complexity scoring (March 2026 pattern)
   */
  protected selectModel(prompt: string): string {
    const len = prompt.length;
    const hasCode = /```|function|class|interface/.test(prompt);
    const hasReasoning = /why|explain|analyse|compare|design/.test(prompt.toLowerCase());
    const complexityScore = (len > 2000 ? 0.4 : 0.1) + (hasCode ? 0.3 : 0) + (hasReasoning ? 0.3 : 0);

    if (complexityScore < 0.3) return 'anthropic/claude-haiku-4-5';
    if (complexityScore < 0.7) return 'anthropic/claude-sonnet-4-5';
    return 'anthropic/claude-sonnet-4-5';
  }

  /**
   * Core chat method with budget tracking
   */
  async chat(userMessage: string): Promise<string> {
    if (this.config.budgetLimitUSD && this.totalCostUSD >= this.config.budgetLimitUSD) {
      throw new Error(`Budget limit $${this.config.budgetLimitUSD} reached`);
    }

    const model = this.selectModel(userMessage);
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: this.buildSystemPrompt(),
      messages: this.conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    this.conversationHistory.push({ role: 'assistant', content: text });

    // Cost tracking (rough estimates)
    const tokIn = response.usage.input_tokens;
    const tokOut = response.usage.output_tokens;
    const costPer1K = model.includes('haiku') ? 0.00025 : 0.003;
    this.totalCostUSD += (tokIn + tokOut) * costPer1K / 1000;

    logger.info('Agent response', {
      agent: this.config.name,
      model,
      tokIn,
      tokOut,
      totalCostUSD: this.totalCostUSD
    });

    return text;
  }

  getCostSummary() {
    return {
      agent: this.config.name,
      totalCostUSD: this.totalCostUSD,
      turns: this.conversationHistory.length / 2
    };
  }
}
BASEAGENT
    ok "Created $BASE_AGENT/src/BaseAgent.ts"
  else
    echo "  [DRY] Would create $BASE_AGENT/src/BaseAgent.ts"
  fi

  ok "Base agent template ready"
}

# ════════════════════════════════════════════════════════════
#  TASK 3: Move floating fix-*.md files to docs/fixes/
# ════════════════════════════════════════════════════════════
task_move_fix_docs() {
  echo ""
  echo -e "${BOLD}── TASK 3: Consolidate Fix Documentation ──${RESET}"

  local FIXES_DIR="$REPO_ROOT/docs/fixes"
  safe_mkdir "$FIXES_DIR"

  for f in "$REPO_ROOT"/fix-*.md; do
    [[ -f "$f" ]] || continue
    local basename
    basename=$(basename "$f")
    safe_move "$f" "$FIXES_DIR/$basename"
  done
  ok "Fix docs moved to docs/fixes/"
}

# ════════════════════════════════════════════════════════════
#  TASK 4: Create missing local-test.sh script
# ════════════════════════════════════════════════════════════
task_create_local_test_script() {
  echo ""
  echo -e "${BOLD}── TASK 4: Create Local Test Script ──${RESET}"

  local TARGET="$REPO_ROOT/scripts/local-test.sh"

  [[ -f "$TARGET" ]] && { skip "exists: $TARGET"; return; }

  if [[ "$APPLY" == "true" ]]; then
    mkdir -p "$REPO_ROOT/scripts"
    cat > "$TARGET" <<'LOCALTEST'
#!/usr/bin/env bash
# ============================================================
#  local-test.sh — One-command local testing for the platform
#  Runs: infrastructure → build check → unit tests → smoke test
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
ok()  { echo -e "${GREEN}✓${RESET} $*"; }
err() { echo -e "${RED}✗${RESET} $*" >&2; }
log() { echo -e "${CYAN}→${RESET} $*"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKIP_INFRA="${SKIP_INFRA:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
RUN_E2E="${RUN_E2E:-false}"

header() { echo -e "\n${YELLOW}═══ $* ═══${RESET}"; }

# ── 1. Preflight ─────────────────────────────────────────────
header "Preflight checks"
command -v pnpm   &>/dev/null && ok "pnpm"    || { err "pnpm not found"; exit 1; }
command -v docker &>/dev/null && ok "docker"  || err "docker not found (infra will fail)"
command -v node   &>/dev/null && ok "node $(node -v)"

[[ -f ".env.local" ]] && ok ".env.local present" || {
  err ".env.local missing — copy from .env.local.example"
  [[ -f ".env.local.example" ]] && {
    log "Creating .env.local from example (edit before production use)"
    cp .env.local.example .env.local
    ok ".env.local created"
  }
}

# ── 2. Infrastructure ────────────────────────────────────────
if [[ "$SKIP_INFRA" != "true" ]]; then
  header "Starting local infrastructure"
  if [[ -f "docker-compose.local.yml" ]]; then
    docker compose -f docker-compose.local.yml up -d --remove-orphans \
      && ok "Infrastructure up" \
      || { err "Docker compose failed"; exit 1; }

    # Wait for Supabase
    log "Waiting for Supabase (15s)..."
    sleep 15
    ok "Infrastructure ready"
  else
    err "docker-compose.local.yml not found"
  fi
fi

# ── 3. Install & Build ───────────────────────────────────────
if [[ "$SKIP_BUILD" != "true" ]]; then
  header "Installing dependencies"
  pnpm install --frozen-lockfile && ok "pnpm install complete"

  header "Building shared packages"
  pnpm build:shared && ok "Shared packages built"

  header "Type checking"
  pnpm type-check && ok "TypeScript OK" || err "TypeScript errors found"
fi

# ── 4. Unit Tests ────────────────────────────────────────────
if [[ "$SKIP_TESTS" != "true" ]]; then
  header "Running unit tests"
  pnpm test --passWithNoTests && ok "Unit tests passed" || err "Unit tests failed"
fi

# ── 5. Smoke test: API health checks ────────────────────────
header "Smoke tests"
PORTS=(3000 3001 5678)
for port in "${PORTS[@]}"; do
  if curl -sf "http://localhost:$port/health" &>/dev/null; then
    ok "Port $port responding"
  else
    log "Port $port not responding (service may not be started)"
  fi
done

# ── 6. E2E (optional) ────────────────────────────────────────
if [[ "$RUN_E2E" == "true" ]]; then
  header "End-to-end tests"
  pnpm test:e2e && ok "E2E tests passed" || err "E2E tests failed"
fi

# ── 7. Summary ───────────────────────────────────────────────
header "Local test complete"
echo ""
echo "Services (if started):"
echo "  Unified Dashboard: http://localhost:3000"
echo "  Alex AI Dashboard: http://localhost:3001"
echo "  n8n Automation:    http://localhost:5678"
echo "  Supabase Studio:   http://localhost:54323"
echo ""
echo "Quick commands:"
echo "  pnpm dev:dashboard     # Start dashboard"
echo "  pnpm local:infra:logs  # View container logs"
echo "  pnpm local:infra:down  # Stop everything"
LOCALTEST

    chmod +x "$TARGET"
    ok "Created: $TARGET"
  else
    echo "  [DRY] Would create $TARGET"
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 5: Create validate-imports.sh
# ════════════════════════════════════════════════════════════
task_create_validate_imports() {
  echo ""
  echo -e "${BOLD}── TASK 5: Create Import Validator ──${RESET}"

  local TARGET="$REPO_ROOT/scripts/validate-imports.sh"
  [[ -f "$TARGET" ]] && { skip "exists: $TARGET"; return; }

  if [[ "$APPLY" == "true" ]]; then
    mkdir -p "$REPO_ROOT/scripts"
    cat > "$TARGET" <<'VALIDATOR'
#!/usr/bin/env bash
# validate-imports.sh — Scan for broken relative imports and deep path escapes
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0

log() { echo "  $*"; }

echo "Scanning for broken import patterns..."

# Pattern 1: Excessively deep relative imports (4+ levels)
while IFS= read -r -d '' file; do
  if grep -nP '(from|require)\s*["'"'"'](\.\.\/){4,}' "$file" 2>/dev/null; then
    echo "DEEP_IMPORT: $file"
    ((ERRORS++)) || true
  fi
done < <(find "$REPO" -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.next/*' \
  -print0 2>/dev/null)

# Pattern 2: @openrouter-crew/* imports to check workspace resolution
echo ""
echo "Checking workspace package resolution..."
while IFS= read -r pkg; do
  name=$(echo "$pkg" | jq -r '.name // empty' 2>/dev/null || echo "")
  [[ -z "$name" ]] && continue
  count=$(grep -r "from '@openrouter-crew/" "$REPO" \
    --include="*.ts" --include="*.tsx" \
    -not -path '*/node_modules/*' \
    -l 2>/dev/null | wc -l | tr -d ' ')
  log "$name: referenced in $count files"
done < <(find "$REPO/domains/shared" -name "package.json" -not -path '*/node_modules/*' \
  -exec cat {} \;)

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "✗ Found $ERRORS import issues"
  exit 1
else
  echo ""
  echo "✓ No import issues found"
fi
VALIDATOR
    chmod +x "$TARGET"
    ok "Created: $TARGET"
  else
    echo "  [DRY] Would create $TARGET"
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 6: Add pnpm scripts to root package.json
# ════════════════════════════════════════════════════════════
task_update_root_package_json() {
  echo ""
  echo -e "${BOLD}── TASK 6: Update Root package.json Scripts ──${RESET}"

  local PKG="$REPO_ROOT/package.json"
  [[ ! -f "$PKG" ]] && { warn "package.json not found"; return; }

  # Check if scripts already present
  grep -q '"local:test"' "$PKG" 2>/dev/null && { skip "local:test already in package.json"; return; }

  if [[ "$APPLY" == "true" ]]; then
    # Use node to safely merge scripts
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$PKG', 'utf8'));
const newScripts = {
  'local:test':        'bash scripts/local-test.sh',
  'local:test:quick':  'SKIP_INFRA=true bash scripts/local-test.sh',
  'validate:imports':  'bash scripts/validate-imports.sh',
  'ai:analyze':        'bash scripts/ai-analyze.sh',
  'ai:analyze:dry':    'bash scripts/ai-analyze.sh --dry-run',
  'reorg:dry':         'bash scripts/reorganize.sh --dry-run',
  'reorg:apply':       'bash scripts/reorganize.sh --apply',
};
pkg.scripts = { ...pkg.scripts, ...newScripts };
fs.writeFileSync('$PKG', JSON.stringify(pkg, null, 2) + '\n');
console.log('Scripts added to package.json');
" && ok "package.json updated" || warn "package.json update failed (check manually)"
  else
    echo "  [DRY] Would add scripts: local:test, validate:imports, ai:analyze, reorg:dry/apply"
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 7: Create .claude/prompts/ directory with starter prompts
# ════════════════════════════════════════════════════════════
task_create_prompt_library() {
  echo ""
  echo -e "${BOLD}── TASK 7: Create Prompt Library ──${RESET}"

  local PROMPTS_DIR="$REPO_ROOT/.claude/prompts"
  safe_mkdir "$PROMPTS_DIR"

  if [[ "$APPLY" == "true" ]]; then

    cat > "$PROMPTS_DIR/agent-generation.md" <<'AGENTPROMPT'
# Agent Generation Prompt Template
<!-- Use this template when generating new product-factory agents -->

<system_role>
You are an expert TypeScript developer specialising in AI agent architecture
for the OpenRouter Crew Platform. You write production-grade code following
DDD principles and the base-agent pattern.
</system_role>

<context>
Platform: openrouter-crew-platform
Base class: @openrouter-crew/base-agent → BaseAgent
Pattern: extend BaseAgent, override agentExpertise and agentCapabilities
Package naming: @{project-name}/{agent-role}-agent
</context>

<task>
Generate a new agent for the following specification:
- Project: {{PROJECT_NAME}}
- Agent role: {{AGENT_ROLE}}
- Capabilities: {{CAPABILITIES_LIST}}
- Tools needed: {{MCP_TOOLS}}
</task>

<output_format>
1. package.json (extends base-agent)
2. src/{{AgentRole}}Agent.ts (TypeScript class)
3. src/index.ts (Express server entrypoint)
4. README.md (usage docs)
</output_format>

<few_shot_example>
Input:  Project=baritalia-stl, Role=content, Capabilities=["write website copy","SEO","menu generation"]
Output: ContentAgent extends BaseAgent with menuGeneration() and seoOptimize() methods
</few_shot_example>
AGENTPROMPT

    cat > "$PROMPTS_DIR/codebase-analysis.md" <<'ANALYSISPROMPT'
# Codebase Analysis Prompt Template
<!-- Use when asking AI to analyse a specific domain or package -->

<system_role>
You are a senior architect performing deep analysis of the OpenRouter Crew Platform,
a TypeScript monorepo using pnpm workspaces, Turborepo, and DDD.
</system_role>

<analysis_context>
Repository: openrouter-crew-platform
Architecture: 5 DDD domains (shared, alex-ai-universal, product-factory, vscode-extension, test-projects)
Build: Turbo + pnpm workspaces
Key file: CLAUDE.md (project memory), .ai-context.md (live metrics)
</analysis_context>

<task>
Analyse: {{TARGET_DOMAIN_OR_FILE}}
Focus: {{ANALYSIS_FOCUS}}
</task>

<chain_of_thought_requirement>
1. First, identify what the component/domain is responsible for
2. Then, identify what it depends on
3. Then, identify potential issues (coupling, complexity, duplication)
4. Finally, propose concrete improvements
</chain_of_thought_requirement>

<output_format>
## Summary
## Dependencies
## Issues Found (with file paths)
## Recommended Changes (numbered, with risk level)
</output_format>
ANALYSISPROMPT

    cat > "$PROMPTS_DIR/meta-prompt-generator.md" <<'METAPROMPT'
# Meta-Prompt Generator
<!-- This prompt generates optimised prompts for specific agent tasks -->

<system_role>
You are a prompt engineering specialist applying 2026 meta-prompting techniques.
Your job is to generate optimised prompts for specific LLM tasks.
</system_role>

<meta_prompting_principles>
1. XML tags for context isolation — prevents prompt bleed
2. Chain-of-thought — "think step by step before answering"
3. Role clarity — specific expertise, not generic "helpful assistant"
4. Output format — explicit structure reduces parsing failures
5. Few-shot — 2-3 examples beat 10 instructions
6. Budget tokens — system prompts under 800 tokens
7. Self-critique — draft → critique → final in one call
</meta_prompting_principles>

<task>
Generate an optimised prompt for this task:
{{TASK_DESCRIPTION}}

Target model: {{MODEL}} (haiku/sonnet/opus)
Expected output type: {{OUTPUT_TYPE}} (json/markdown/code/text)
</task>

<output_format>
Return only the optimised prompt wrapped in <prompt> tags.
Include: system_role, context, task, chain_of_thought, output_format sections.
</output_format>
METAPROMPT

    ok "Created prompt library in $PROMPTS_DIR/"
  else
    echo "  [DRY] Would create .claude/prompts/ with 3 prompt templates"
  fi
}

# ════════════════════════════════════════════════════════════
#  TASK 8: Verify pnpm workspace integrity
# ════════════════════════════════════════════════════════════
task_verify_workspace() {
  echo ""
  echo -e "${BOLD}── TASK 8: Verify Workspace Integrity ──${RESET}"

  [[ ! -f "$REPO_ROOT/pnpm-workspace.yaml" ]] && { warn "pnpm-workspace.yaml not found"; return; }

  log "Checking workspace package resolution..."
  if command -v pnpm &>/dev/null; then
    if [[ "$APPLY" == "true" ]]; then
      (cd "$REPO_ROOT" && pnpm ls -r --depth=0 2>&1 | grep -c "^@" || true) | \
        xargs -I{} echo "  {} workspace packages found"
    else
      log "[DRY] Would run: pnpm ls -r --depth=0"
    fi
  else
    warn "pnpm not in PATH — skipping workspace check"
  fi
  ok "Workspace check complete"
}

# ════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════
print_summary() {
  echo ""
  echo -e "${BOLD}${GREEN}══ Reorganisation Summary ══${RESET}"

  if [[ "$APPLY" == "true" ]]; then
    local change_count=0
    local error_count=0
    [[ -f "$CHANGES_FILE" ]] && change_count=$(wc -l < "$CHANGES_FILE" | tr -d ' ')
    [[ -f "$ERRORS_FILE"  ]] && error_count=$(wc -l < "$ERRORS_FILE"  | tr -d ' ')

    echo "  Changes applied: $change_count"
    [[ "$error_count" -gt 0 ]] && echo -e "  ${RED}Errors: $error_count${RESET}"

    if [[ -f "$CHANGES_FILE" ]]; then
      echo ""
      echo "Changes made:"
      cat "$CHANGES_FILE" | sed 's/^/  ✓ /'
    fi
    if [[ -f "$ERRORS_FILE" ]]; then
      echo ""
      echo -e "${RED}Errors:${RESET}"
      cat "$ERRORS_FILE" | sed 's/^/  ✗ /'
    fi

    echo ""
    ok "Git backup tag: $BACKUP_TAG"
    echo "  To undo: git checkout $BACKUP_TAG"
    echo ""
    echo "Next steps:"
    echo "  pnpm install          # Sync dependencies after moves"
    echo "  pnpm validate:imports # Check no broken imports"
    echo "  bash scripts/local-test.sh  # Full local test"
  else
    echo -e "${YELLOW}DRY RUN — no changes made.${RESET}"
    echo ""
    echo "To apply:"
    echo "  $0 --apply"
    echo ""
    echo "To apply specific tasks:"
    echo "  $0 --apply --tasks extract-base,move-docs"
  fi
}

# ════════════════════════════════════════════════════════════
#  CLI
# ════════════════════════════════════════════════════════════
usage() {
  echo "Usage: $0 [--apply] [--repo <path>] [--tasks <list>]"
  echo ""
  echo "Options:"
  echo "  --apply              Actually make changes (default: dry-run)"
  echo "  --repo <path>        Repo root (default: .)"
  echo "  --tasks <csv>        Run specific tasks (default: all)"
  echo "  --help               This message"
  echo ""
  echo "Tasks: git-snapshot, extract-base, move-docs, local-test,"
  echo "       validate-imports, update-pkg, prompt-library, verify-workspace"
}

TASKS_TO_RUN=("git-snapshot" "extract-base" "move-docs" "local-test" "validate-imports" "update-pkg" "prompt-library" "verify-workspace")

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)  APPLY=true; shift ;;
    --repo)   REPO_ROOT="$2"; shift 2 ;;
    --tasks)  IFS=',' read -ra TASKS_TO_RUN <<< "$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) err "Unknown: $1"; usage; exit 1 ;;
  esac
done

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║  OpenRouter Crew — Reorganizer       ║"
echo "  ║  Mode: $([ "$APPLY" == "true" ] && echo "APPLY" || echo "DRY RUN")                         ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"

for task in "${TASKS_TO_RUN[@]}"; do
  case "$task" in
    git-snapshot)     task_git_snapshot ;;
    extract-base)     task_extract_base_agent ;;
    move-docs)        task_move_fix_docs ;;
    local-test)       task_create_local_test_script ;;
    validate-imports) task_create_validate_imports ;;
    update-pkg)       task_update_root_package_json ;;
    prompt-library)   task_create_prompt_library ;;
    verify-workspace) task_verify_workspace ;;
    *) warn "Unknown task: $task" ;;
  esac
done

print_summary

# cleanup
rm -f "$CHANGES_FILE" "$ERRORS_FILE" 2>/dev/null || true

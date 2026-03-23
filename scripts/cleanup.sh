#!/usr/bin/env bash
# =============================================================================
# cleanup.sh — OpenRouter Crew Platform: Repository Streamliner  [v2]
# Compatible with macOS bash 3.2+ (no associative arrays used)
# Run from the repo root: bash scripts/cleanup.sh [--dry-run]
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
success() { echo -e "${GREEN}[DONE]${RESET}  $*"; }
step()    { echo -e "  ${DIM}▸${RESET} $*"; }

# ── Dry-run mode ──────────────────────────────────────────────────────────────
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# ── Guard: must be run from repo root ─────────────────────────────────────────
if [[ ! -f "pnpm-workspace.yaml" ]]; then
  echo -e "${RED}[ERR]${RESET}   Must be run from the repository root (where pnpm-workspace.yaml lives)."
  exit 1
fi

REPO_ROOT="$(pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="${REPO_ROOT}/_archive/${TIMESTAMP}"
MOVED=0
REMOVED=0

echo ""
echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${CYAN}│      OpenRouter Crew Platform — Repository Streamliner  v2   │${RESET}"
echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────┘${RESET}"
$DRY_RUN && warn "DRY-RUN MODE — no files will be modified."
echo ""

# ── is_in_keep_list: bash 3.2-safe case-statement keep-list ──────────────────
is_in_keep_list() {
  case "$1" in
    README.md|CHANGELOG.md|CLAUDE.md|KNOWN_ISSUES.md) return 0 ;;
    *) return 1 ;;
  esac
}

# ── safe_archive: move a file/dir to _archive/ ───────────────────────────────
safe_archive() {
  local src="$1"
  local dest_subdir="${2:-misc}"
  local dest_dir="${ARCHIVE_DIR}/${dest_subdir}"

  [[ -e "$src" ]] || return 0

  if $DRY_RUN; then
    step "[dry] archive ${src#$REPO_ROOT/} → _archive/${dest_subdir}/"
  else
    mkdir -p "$dest_dir"
    cp -rp -- "$src" "${dest_dir}/" && rm -rf -- "$src"
    step "archived: ${src#$REPO_ROOT/}"
  fi
  MOVED=$((MOVED + 1))
}

# ── safe_relocate: move a file to a new directory ────────────────────────────
safe_relocate() {
  local src="$1"
  local dest_dir="$2"

  [[ -e "$src" ]] || return 0

  if $DRY_RUN; then
    step "[dry] relocate $(basename "$src") → ${dest_dir#$REPO_ROOT/}/"
  else
    mkdir -p "$dest_dir"
    mv -- "$src" "${dest_dir}/"
    step "relocated: $(basename "$src") → ${dest_dir#$REPO_ROOT/}/"
  fi
  MOVED=$((MOVED + 1))
}

# ── safe_remove: delete a confirmed duplicate ────────────────────────────────
safe_remove() {
  local src="$1"
  [[ -e "$src" ]] || return 0

  if $DRY_RUN; then
    step "[dry] remove: ${src#$REPO_ROOT/}"
  else
    rm -- "$src"
    step "removed: ${src#$REPO_ROOT/}"
  fi
  REMOVED=$((REMOVED + 1))
}

# =============================================================================
# 1. INIT ARCHIVE DIR
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 1 — Initialise archive ══${RESET}"
if ! $DRY_RUN; then
  mkdir -p "$ARCHIVE_DIR"
fi
info "Archive target: _archive/${TIMESTAMP}/"

# =============================================================================
# 2. ROOT-LEVEL NOISE MD FILES
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 2 — Archive root-level phase/session/completion docs ══${RESET}"

for md_file in "${REPO_ROOT}"/*.md; do
  [[ -f "$md_file" ]] || continue
  fname="$(basename "$md_file")"
  if ! is_in_keep_list "$fname"; then
    safe_archive "$md_file" "root-docs"
  else
    step "keeping: $fname"
  fi
done

safe_archive "${REPO_ROOT}/LOCAL_TESTING_SUMMARY.txt" "root-docs"

success "Root MD cleanup done."

# =============================================================================
# 3. ROOT-LEVEL ORPHANED SOURCE & STUB FILES
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 3 — Archive orphaned root-level source/stub files ══${RESET}"

for f in apiClient.ts configManager.ts logger.ts prompts.ts index.ts; do
  safe_archive "${REPO_ROOT}/${f}" "root-orphans"
done

for f in clean.sh deploy.sh fix-dependencies.sh install-local.sh package.sh pipeline.sh complete-phase-8.sh analyze-ci-failure.sh; do
  src="${REPO_ROOT}/${f}"
  if [[ -f "$src" ]]; then
    size=$(wc -c < "$src" | tr -d ' ')
    if [[ "$size" -le 5 ]]; then
      safe_archive "$src" "root-orphans/empty-scripts"
    else
      step "skipping non-empty: $f"
    fi
  fi
done

safe_archive "${REPO_ROOT}/cli-ci.yml" "root-orphans"

success "Root orphan cleanup done."

# =============================================================================
# 4. CLAUDE / GEMINI ANALYSIS ARTIFACTS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 4 — Archive analysis folders and zip artifacts ══${RESET}"

safe_archive "${REPO_ROOT}/Claude Codebase Analysis"        "codebase-analysis"
safe_archive "${REPO_ROOT}/Claude Codebase Analysis.zip"    "codebase-analysis"
safe_archive "${REPO_ROOT}/Claude Codebase Analysis 2.zip"  "codebase-analysis"
safe_archive "${REPO_ROOT}/scripts.zip"                     "codebase-analysis"
safe_archive "${REPO_ROOT}/.gemini-clipboard"               "gemini-artifacts"

# Archive any .deploy-artifacts-* hidden dirs
for d in "${REPO_ROOT}"/.deploy-artifacts-*; do
  [[ -d "$d" ]] && safe_archive "$d" "deploy-artifacts"
done

success "Analysis artifact cleanup done."

# =============================================================================
# 5. ROOT-LEVEL DUPLICATE TEST STUBS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 5 — Archive duplicate root-level test stubs ══${RESET}"

for f in analytics.test.ts budget.test.ts config.test.ts cost.test.ts \
         history.test.ts memory.test.ts project.test.ts sprint.test.ts \
         story.test.ts team.test.ts unify.test.ts; do
  src="${REPO_ROOT}/${f}"
  canonical="${REPO_ROOT}/tests/${f}"
  if [[ -f "$src" && -f "$canonical" ]]; then
    safe_archive "$src" "root-tests"
  elif [[ -f "$src" ]]; then
    step "skipping (no counterpart in tests/): $f"
  fi
done

success "Root test stubs archived."

# =============================================================================
# 6. MISPLACED FILES IN .github/workflows/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 6 — Relocate misplaced files from .github/workflows/ ══${RESET}"

GHW="${REPO_ROOT}/.github/workflows"

for f in analytics-service.ts analytics.ts index.ts report.ts weekly-report-generator.ts; do
  safe_relocate "${GHW}/${f}" "${REPO_ROOT}/scripts/reports"
done

safe_relocate "${GHW}/crew.js"                            "${REPO_ROOT}/scripts"
safe_relocate "${GHW}/20260302000000_analytics_rpc.sql"   "${REPO_ROOT}/supabase/migrations"
safe_relocate "${GHW}/launch.json"                        "${REPO_ROOT}/.vscode"
safe_relocate "${GHW}/tasks.json"                         "${REPO_ROOT}/.vscode"

for f in clean.sh install-local.sh tsconfig.json; do
  safe_archive "${GHW}/${f}" "github-workflows-orphans"
done

success "GitHub workflows directory cleaned."

# =============================================================================
# 7. DUPLICATE " 2.*" FILES — hard delete (confirmed clones)
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 7 — Remove \" 2.\" duplicate artifacts ══${RESET}"

while IFS= read -r -d '' dup; do
  safe_remove "$dup"
done < <(find "${REPO_ROOT}/domains" "${REPO_ROOT}/apps" \
  \( -name "* 2.json" -o -name "* 2.md" -o -name "Dockerfile 2" \) \
  -not -path "*/node_modules/*" \
  -print0 2>/dev/null | sort -z)

success "Duplicate files removed."

# =============================================================================
# 8. MILESTONE DIRS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 8 — Archive milestone directories ══${RESET}"

safe_archive "${REPO_ROOT}/.milestones" "milestones"
safe_archive "${REPO_ROOT}/milestones"  "milestones"

success "Milestone dirs archived."

# =============================================================================
# 9. HALLUCINATION EVENT LOGS → docs/observability/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 9 — Relocate hallucination event logs ══${RESET}"

HALL_SRC="${REPO_ROOT}/domains/product-factory/dashboard/lib/alex-ai/hallucination"
HALL_DEST="${REPO_ROOT}/docs/observability/hallucination-events"

if [[ -d "$HALL_SRC" ]]; then
  if $DRY_RUN; then
    step "[dry] move hallucination logs → docs/observability/hallucination-events/"
  else
    mkdir -p "$HALL_DEST"
    for hfile in "${HALL_SRC}"/*; do
      [[ -e "$hfile" ]] && mv -- "$hfile" "${HALL_DEST}/"
    done
    rmdir "$HALL_SRC" 2>/dev/null || true
    step "moved hallucination logs → docs/observability/hallucination-events/"
  fi
  MOVED=$((MOVED + 1))
else
  step "hallucination dir not found — skipping"
fi

success "Observability logs relocated."

# =============================================================================
# 10. .env.production — untrack from git + add to .gitignore
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 10 — Secure .env.production ══${RESET}"

ENV_FILE="${REPO_ROOT}/.env.production"
GITIGNORE="${REPO_ROOT}/.gitignore"

if [[ -f "$ENV_FILE" ]]; then
  if ! grep -qF ".env.production" "$GITIGNORE" 2>/dev/null; then
    if ! $DRY_RUN; then
      printf '\n# Environment files — never commit production secrets\n.env.production\n.env.local\n.env.*.local\n' >> "$GITIGNORE"
    fi
    step "added .env.production to .gitignore"
  else
    step ".env.production already in .gitignore"
  fi

  if git -C "${REPO_ROOT}" ls-files --error-unmatch ".env.production" >/dev/null 2>&1; then
    if $DRY_RUN; then
      step "[dry] git rm --cached .env.production"
    else
      git -C "${REPO_ROOT}" rm --cached .env.production
      step "untracked .env.production from git index"
    fi
  else
    step ".env.production not tracked by git — nothing to untrack"
  fi
else
  step ".env.production not found — skipping"
fi

success ".env.production secured."

# =============================================================================
# 11. ADD _archive/ TO .gitignore
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 11 — Update .gitignore ══${RESET}"

if ! grep -qF "_archive/" "$GITIGNORE" 2>/dev/null; then
  if ! $DRY_RUN; then
    printf '\n# Cleanup archive — generated by scripts/cleanup.sh\n_archive/\n' >> "$GITIGNORE"
  fi
  step "added _archive/ to .gitignore"
else
  step "_archive/ already in .gitignore"
fi

success ".gitignore updated."

# =============================================================================
# 12. ADVISORY WARNINGS — manual follow-up items
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 12 — Manual action advisories ══${RESET}"

warn "Terraform: two dirs exist (infrastructure/ = ECS, terraform/ = EC2)."
warn "  → Pick one deployment model, archive the other."
echo ""

SUPABASE_COUNT=$(find "${REPO_ROOT}/domains/product-factory/dashboard/lib" \
  \( -name "supabase*.ts" -o -name "supabase*.js" \) \
  -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
warn "Supabase clients: ${SUPABASE_COUNT} entry-points found in product-factory/dashboard/lib."
warn "  → Consolidate to a single lib/supabase/index.ts."
echo ""

warn "Shared UI: ~30 components duplicated between alex-ai-universal and apps/unified-dashboard."
warn "  → Migrate to domains/shared/ui-components/."
echo ""

warn "n8n workflows: domains/product-factory/workflows/ and"
warn "  domains/alex-ai-universal/workflows/migrated/ overlap heavily."
warn "  → Use domains/shared/workflows/ as the single canonical source."
echo ""

warn "clippy-doom-video-builder lives in apps/ next to production services."
warn "  → Move to packages/experiments/ to signal non-production status."

# =============================================================================
# 13. CLEANUP REPORT
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 13 — Writing cleanup report ══${RESET}"

REPORT_PATH="${REPO_ROOT}/docs/CLEANUP_REPORT_${TIMESTAMP}.md"

if ! $DRY_RUN; then
  mkdir -p "${REPO_ROOT}/docs"
  cat > "$REPORT_PATH" << REPORT
# Repository Cleanup Report
Generated: $(date -u "+%Y-%m-%d %H:%M:%S UTC")

## Results
| Action | Count |
|--------|-------|
| Files archived / relocated | ${MOVED} |
| Duplicate files removed | ${REMOVED} |

## Archive
All archived content is in \`_archive/${TIMESTAMP}/\` (gitignored — safe to delete after review).

## What Was Archived
| Category | Location |
|----------|----------|
| ~100 root phase/session/completion MDs | root-docs/ |
| Stray root TS source files | root-orphans/ |
| Empty shell script stubs | root-orphans/empty-scripts/ |
| Root duplicate test stubs | root-tests/ |
| Claude Codebase Analysis folder & zips | codebase-analysis/ |
| .milestones/ and milestones/ dirs | milestones/ |
| .gemini-clipboard/ | gemini-artifacts/ |
| .github/workflows/ non-YAML orphans | github-workflows-orphans/ |

## What Was Relocated
| From | To |
|------|----|
| .github/workflows/*.ts | scripts/reports/ |
| .github/workflows/crew.js | scripts/ |
| .github/workflows/*.sql | supabase/migrations/ |
| .github/workflows/{launch,tasks}.json | .vscode/ |
| domains/.../hallucination/* | docs/observability/hallucination-events/ |

## What Was Deleted
- All \`* 2.json\` and \`* 2.md\` duplicate files (confirmed clones)

## Security
- .env.production removed from git index
- .env.production and _archive/ added to .gitignore

## Remaining Manual Actions
1. **Terraform** — consolidate infrastructure/ and terraform/
2. **Supabase clients** — merge to single lib/supabase/index.ts
3. **Shared UI** — migrate duplicate components to domains/shared/ui-components/
4. **n8n workflows** — canonical source → domains/shared/workflows/
5. **clippy-doom-video-builder** — move to packages/experiments/
6. **Project scaffolding** — replace manual template cloning with a scaffold script
REPORT
  step "wrote docs/CLEANUP_REPORT_${TIMESTAMP}.md"
fi

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${GREEN}│                    Cleanup Complete ✓                        │${RESET}"
echo -e "${BOLD}${GREEN}└──────────────────────────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  ${GREEN}Files archived / relocated${RESET}  : ${BOLD}${MOVED}${RESET}"
echo -e "  ${RED}Duplicate files removed${RESET}     : ${BOLD}${REMOVED}${RESET}"
echo ""
if ! $DRY_RUN; then
  echo -e "  Archive  : ${DIM}_archive/${TIMESTAMP}/${RESET}"
  echo -e "  Report   : ${DIM}docs/CLEANUP_REPORT_${TIMESTAMP}.md${RESET}"
  echo ""
  echo -e "  ${CYAN}Commit:${RESET} ${DIM}git add -A && git commit -m 'chore: streamline repository structure'${RESET}"
else
  echo -e "  ${YELLOW}DRY-RUN — re-run without --dry-run to apply changes.${RESET}"
fi
echo ""
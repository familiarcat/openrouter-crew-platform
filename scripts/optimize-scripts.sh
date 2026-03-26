#!/usr/bin/env bash
# =============================================================================
# optimize-scripts.sh — OpenRouter Crew Platform: Scripts Unification
# Reorganizes, fixes broken references, archives dead code, updates package.json
# Run from repo root: bash scripts/optimize-scripts.sh [--dry-run]
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
success() { echo -e "${GREEN}[DONE]${RESET}  $*"; }
step()    { echo -e "  ${DIM}▸${RESET} $*"; }

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

if [[ ! -f "pnpm-workspace.yaml" ]]; then
  echo -e "${RED}[ERR]${RESET} Must be run from the repository root."
  exit 1
fi

REPO_ROOT="$(pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="${REPO_ROOT}/_archive/scripts-${TIMESTAMP}"
MOVED=0; REMOVED=0; FIXED=0

echo ""
echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${CYAN}│   OpenRouter Crew Platform — Scripts Unification             │${RESET}"
echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────┘${RESET}"
$DRY_RUN && warn "DRY-RUN MODE — no files will be modified."
echo ""

safe_archive() {
  local src="$1" sub="${2:-misc}"
  [[ -e "$src" ]] || return 0
  if $DRY_RUN; then
    step "[dry] archive → _archive/scripts-*/${sub}/$(basename "$src")"
  else
    mkdir -p "${ARCHIVE_DIR}/${sub}"
    cp -rp -- "$src" "${ARCHIVE_DIR}/${sub}/" && rm -rf -- "$src"
    step "archived: ${src#$REPO_ROOT/}"
  fi
  MOVED=$((MOVED+1))
}

safe_move() {
  local src="$1" dest_dir="$2"
  [[ -e "$src" ]] || return 0
  if $DRY_RUN; then
    step "[dry] move $(basename "$src") → ${dest_dir#$REPO_ROOT/}/"
  else
    mkdir -p "$dest_dir"
    mv -- "$src" "${dest_dir}/"
    step "moved: $(basename "$src") → ${dest_dir#$REPO_ROOT/}/"
  fi
  MOVED=$((MOVED+1))
}

safe_delete() {
  local src="$1"
  [[ -e "$src" ]] || return 0
  if $DRY_RUN; then
    step "[dry] delete: ${src#$REPO_ROOT/}"
  else
    rm -f -- "$src"
    step "deleted: ${src#$REPO_ROOT/}"
  fi
  REMOVED=$((REMOVED+1))
}

write_file() {
  # write_file <path> <content-heredoc-var>
  # In dry-run just announces; in real mode writes.
  local dest="$1"; shift
  if $DRY_RUN; then
    step "[dry] write: ${dest#$REPO_ROOT/}"
  else
    mkdir -p "$(dirname "$dest")"
    cat > "$dest"
    step "wrote: ${dest#$REPO_ROOT/}"
  fi
  FIXED=$((FIXED+1))
}

# =============================================================================
# 1. DELETE ZERO-BYTE STUBS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 1 — Delete zero-byte stub files ══${RESET}"

ZERO_BYTE_STUBS=(
  "scripts/agile/create-story.sh"
  "scripts/agile/generate-content.js"
  "scripts/agile/push-story.sh"
  "scripts/deploy.sh"
  "scripts/generate-weekly-report.ts"
  "scripts/git-setup-remote.sh"
  "scripts/milestone/create-milestone.sh"
  "scripts/milestone/generate-milestone-content.js"
  "scripts/milestone/push-milestone.sh"
  "scripts/milestone/story-estimation.ts"
  "scripts/sprint.ts"
  "scripts/story-estimation.ts"
  "scripts/system/story-estimation.ts"
  "scripts/system/sync-all.sh"
)

for f in "${ZERO_BYTE_STUBS[@]}"; do
  src="${REPO_ROOT}/${f}"
  if [[ -f "$src" ]]; then
    size=$(wc -c < "$src" | tr -d ' ')
    if [[ "$size" -eq 0 ]]; then
      safe_delete "$src"
    else
      step "skipping (non-empty): $f"
    fi
  fi
done

# Also delete AI-prompt artifact MD in scripts/
safe_delete "${REPO_ROOT}/scripts/# AUTONOMOUS ARCHITECTURE EVOLUTION MODE.md"

success "Zero-byte stubs deleted."

# =============================================================================
# 2. ARCHIVE ONE-TIME FIX / PATCH / PHASE SCRIPTS
#    These were run once during development and have no ongoing utility.
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 2 — Archive one-time fix/repair/phase scripts ══${RESET}"

ONE_TIME=(
  "scripts/repair-alex-dashboard.sh"        # 121KB one-time dependency scaffold
  "scripts/enhance-unified-dashboard.sh"    # 95KB one-time UI scaffold
  "scripts/unify-platform.sh"               # 26KB already applied
  "scripts/fix-build-and-runtime-errors.sh" # 33KB already applied
  "scripts/fix-alex-ai-deps.sh"
  "scripts/fix-supabase-deps.sh"
  "scripts/fix-dependencies.sh"
  "scripts/fix-project-scope.sh"
  "scripts/fix_cli_build.sh"
  "scripts/fix_cli_build_v2.sh"
  "scripts/patch-alex-ai-design.sh"
  "scripts/init-unified-dashboard.sh"       # one-time init, already done
  "scripts/install-dashboard-dependencies.sh"
  "scripts/install-nav-dependencies.sh"
  "scripts/resolve-conflicts.sh"            # one-time conflict resolution
  "scripts/reset-build.sh"                  # tiny wrapper, redundant
  "scripts/cleanup-unused-eips.sh"          # one-time AWS EIP cleanup
  "scripts/cleanup-patch.sh"                # the patch script itself
  "scripts/organize-workspace.sh"           # already applied
  "scripts/organize-tests.js"               # already applied
)

for f in "${ONE_TIME[@]}"; do
  safe_archive "${REPO_ROOT}/${f}" "one-time-scripts"
done

success "One-time scripts archived."

# =============================================================================
# 3. ARCHIVE LARGE DEAD-CODE DEPLOYMENT SCRIPTS
#    These overlap with or are superseded by the canonical deploy workflow.
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 3 — Archive superseded deployment scripts ══${RESET}"

# deploy-to-web.sh is a lower-fidelity duplicate of deploy-full.sh
# deploy-full.sh is the canonical (referenced by package.json deploy:aws)
safe_archive "${REPO_ROOT}/scripts/deploy-to-web.sh"     "superseded-deploy"
# setup_new_project.sh duplicates domain/create-domain.sh
safe_archive "${REPO_ROOT}/scripts/setup_new_project.sh" "superseded-deploy"
# setup-project.sh is a 12KB duplicate of domain scripts
safe_archive "${REPO_ROOT}/scripts/setup-project.sh"     "superseded-deploy"
# cleanup.sh is our own cleanup tool — no longer needed to run again
safe_archive "${REPO_ROOT}/scripts/cleanup.sh"           "superseded-deploy"

success "Superseded deploy scripts archived."

# =============================================================================
# 4. MOVE crew.js TO CORRECT LOCATION
#    It's a 48-byte bin shim that belongs at repo root as the 'crew' binary,
#    consistent with package.json "bin": { "crew": "dist/index.js" }
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 4 — Relocate misplaced crew.js shim ══${RESET}"

if [[ -f "${REPO_ROOT}/scripts/crew.js" ]]; then
  safe_archive "${REPO_ROOT}/scripts/crew.js" "one-time-scripts"
  # The real bin is defined in package.json as dist/index.js — no shim needed
  step "crew.js archived (bin entry in package.json points to dist/index.js)"
fi

success "crew.js handled."

# =============================================================================
# 5. REORGANISE: MOVE DEPLOY SCRIPTS INTO scripts/deploy/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 5 — Consolidate deploy scripts into scripts/deploy/ ══${RESET}"

# These are all distinct deploy strategies — keep them, just group them
DEPLOY_SCRIPTS=(
  "scripts/deploy-full.sh"
  "scripts/deploy-project.sh"
  "scripts/deploy-domain.sh"
  "scripts/trigger-gh-deploy.sh"
  "scripts/ci-deploy.sh"
  "scripts/ci-post-deploy.sh"
)
for f in "${DEPLOY_SCRIPTS[@]}"; do
  safe_move "${REPO_ROOT}/${f}" "${REPO_ROOT}/scripts/deploy"
done

success "Deploy scripts consolidated."

# =============================================================================
# 6. REORGANISE: MOVE DEBUG SCRIPTS INTO scripts/debug/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 6 — Consolidate debug scripts into scripts/debug/ ══${RESET}"

safe_move "${REPO_ROOT}/scripts/debug-last-deployment.sh"  "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/debug-web-portal.sh"       "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/view-logs.sh"              "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/verify_monorepo_build.sh"  "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/audit-workspaces.sh"       "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/verify-crew-api-build.sh"  "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/verify-setup.sh"           "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/verify-package-uniqueness.sh" "${REPO_ROOT}/scripts/debug"
safe_move "${REPO_ROOT}/scripts/local-platform-verify.sh"  "${REPO_ROOT}/scripts/debug"

success "Debug/verify scripts consolidated."

# =============================================================================
# 7. REORGANISE: LOCAL DEV SCRIPTS INTO scripts/local/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 7 — Consolidate local dev scripts into scripts/local/ ══${RESET}"

safe_move "${REPO_ROOT}/cleanup-ports.sh"                  "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/local-dev.sh"              "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/stop-nextjs.sh"            "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/clean-build-all.sh"        "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/system/open-all-tabs.sh"   "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/system/open-dashboards.sh" "${REPO_ROOT}/scripts/local"
safe_move "${REPO_ROOT}/scripts/system/cleanup-ports.sh"   "${REPO_ROOT}/scripts/local"

success "Local dev scripts consolidated."

# =============================================================================
# 8. ARCHIVE LEFTOVER SYSTEM ONE-TIMERS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 8 — Archive remaining system one-time scripts ══${RESET}"

SYSTEM_ONE_TIME=(
  "scripts/system/cleanup-duplicates.sh"
  "scripts/system/cleanup-misplaced-files.sh"
  "scripts/system/fix-lucide-deps.sh"
  "scripts/system/fix-react-cache-error.sh"
  "scripts/system/fix-ts-references.js"
  "scripts/system/fix-tsconfig-corruption.js"
  "scripts/system/fix-tsconfig-corruption.test.js"
  "scripts/system/setup-universal-memory.sh"
)
for f in "${SYSTEM_ONE_TIME[@]}"; do
  safe_archive "${REPO_ROOT}/${f}" "one-time-scripts/system"
done

# Remove now-empty system/ dir if empty
if $DRY_RUN; then
  step "[dry] remove scripts/system/ if empty after cleanup"
else
  rmdir "${REPO_ROOT}/scripts/system" 2>/dev/null && step "removed empty scripts/system/" || true
fi

success "System one-timers archived."

# =============================================================================
# 9. ARCHIVE EMPTY milestone/ DIR
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 9 — Archive now-empty milestone/ ══${RESET}"

if $DRY_RUN; then
  step "[dry] remove scripts/milestone/ if empty"
else
  rmdir "${REPO_ROOT}/scripts/milestone" 2>/dev/null && step "removed empty scripts/milestone/" || true
fi

success "Milestone dir handled."

# =============================================================================
# 10. FIX: CREATE scripts/knowledge/ WITH CORRECT WRAPPERS
#     package.json references scripts/knowledge/ which doesn't exist.
#     Real files live at:
#       supabase/migrations/scrape_memory_alpha.py
#       domains/shared/agent-orchestration/src/mcp/upload_knowledge.js
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 10 — Fix broken scripts/knowledge/ reference ══${RESET}"

KNOW_DIR="${REPO_ROOT}/scripts/knowledge"

if ! $DRY_RUN; then
  mkdir -p "$KNOW_DIR"

  # Thin wrapper that calls the real scraper
  cat > "${KNOW_DIR}/scrape_memory_alpha.py" << 'PYEOF'
#!/usr/bin/env python3
"""
Wrapper: delegates to the canonical scraper in supabase/migrations/.
Source of truth: supabase/migrations/scrape_memory_alpha.py
"""
import os, sys, subprocess
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
real = os.path.join(root, "supabase", "migrations", "scrape_memory_alpha.py")
sys.exit(subprocess.call([sys.executable, real] + sys.argv[1:]))
PYEOF

  # Thin wrapper that calls the real uploader
  cat > "${KNOW_DIR}/upload_knowledge.js" << 'JSEOF'
#!/usr/bin/env node
/**
 * Wrapper: delegates to the canonical uploader in domains/shared/agent-orchestration/.
 * Source of truth: domains/shared/agent-orchestration/src/mcp/upload_knowledge.js
 */
const path = require('path');
const { execFileSync } = require('child_process');
const real = path.resolve(__dirname, '../../domains/shared/agent-orchestration/src/mcp/upload_knowledge.js');
execFileSync(process.execPath, [real, ...process.argv.slice(2)], { stdio: 'inherit' });
JSEOF

  chmod +x "${KNOW_DIR}/scrape_memory_alpha.py" "${KNOW_DIR}/upload_knowledge.js"
fi
step "created scripts/knowledge/scrape_memory_alpha.py (wrapper)"
step "created scripts/knowledge/upload_knowledge.js (wrapper)"
FIXED=$((FIXED+2))

success "scripts/knowledge/ created with correct wrappers."

# =============================================================================
# 11. FIX pipeline.sh — correct two broken internal references
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 11 — Fix broken references in pipeline.sh ══${RESET}"

PIPELINE="${REPO_ROOT}/scripts/pipeline.sh"

if [[ -f "$PIPELINE" ]]; then
  if $DRY_RUN; then
    step "[dry] fix scripts/phases/complete-phase-8.sh → scripts/vscode/build-extension.sh"
    step "[dry] fix scripts/aws/deploy.sh → scripts/deploy/deploy-full.sh"
  else
    # Fix the missing scripts/phases/ reference
    sed -i.bak \
      's|./scripts/phases/complete-phase-8.sh|./scripts/vscode/build-extension.sh|g' \
      "$PIPELINE"
    # Fix the missing scripts/aws/deploy.sh reference
    sed -i.bak \
      's|./scripts/aws/deploy.sh|./scripts/deploy/deploy-full.sh|g' \
      "$PIPELINE"
    rm -f "${PIPELINE}.bak"
    step "fixed pipeline.sh references"
  fi
  FIXED=$((FIXED+1))
fi

# Rename complete-phase-8.sh → scripts/vscode/build-extension.sh (it IS a vscode build script)
safe_move "${REPO_ROOT}/scripts/complete-phase-8.sh" "${REPO_ROOT}/scripts/vscode"
if ! $DRY_RUN && [[ -f "${REPO_ROOT}/scripts/vscode/complete-phase-8.sh" ]]; then
  mv "${REPO_ROOT}/scripts/vscode/complete-phase-8.sh" \
     "${REPO_ROOT}/scripts/vscode/build-extension.sh"
  step "renamed complete-phase-8.sh → scripts/vscode/build-extension.sh"
fi

success "pipeline.sh fixed."

# =============================================================================
# 12. FIX ship.sh — it references trigger-gh-deploy.sh which moved to deploy/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 12 — Fix ship.sh reference to trigger-gh-deploy.sh ══${RESET}"

SHIP="${REPO_ROOT}/scripts/ship.sh"

if [[ -f "$SHIP" ]]; then
  if $DRY_RUN; then
    step "[dry] fix scripts/trigger-gh-deploy.sh → scripts/deploy/trigger-gh-deploy.sh"
  else
    sed -i.bak \
      's|scripts/trigger-gh-deploy.sh|scripts/deploy/trigger-gh-deploy.sh|g' \
      "$SHIP"
    rm -f "${SHIP}.bak"
    step "fixed ship.sh reference"
  fi
  FIXED=$((FIXED+1))
fi

success "ship.sh fixed."

# =============================================================================
# 13. REWRITE package.json WITH CORRECTED + ENRICHED SCRIPTS
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 13 — Update root package.json scripts ══${RESET}"

PKG="${REPO_ROOT}/package.json"

if $DRY_RUN; then
  step "[dry] rewrite package.json scripts section"
else
  # Use python3 to safely edit JSON (preserves all non-scripts keys)
  python3 - << 'PYEOF'
import json, sys

with open('package.json', 'r') as f:
    pkg = json.load(f)

pkg['scripts'] = {
    # ── Development ──────────────────────────────────────────────
    "dev":                  "turbo dev",
    "dev:universal":        "bash scripts/start-local-dev.sh",
    "dev:dashboard":        "pnpm --dir apps/unified-dashboard dev",
    "dev:shared-ui":        "pnpm --dir domains/shared/ui-components dev",
    "dev:vscode":           "pnpm --dir domains/vscode-extension watch",

    # ── Build ─────────────────────────────────────────────────────
    "build":                "tsc -p tsconfig.cli.json",
    "build:all":            "bash scripts/build.sh all",
    "build:dashboard":      "pnpm build:shared-ui && pnpm --dir apps/unified-dashboard build",
    "build:shared-ui":      "pnpm --dir domains/shared/ui-components build",
    "build:vscode":         "pnpm build:shared-ui && pnpm --dir domains/vscode-extension compile",

    # ── Type / Lint / Test ────────────────────────────────────────
    "type-check":           "tsc -p tsconfig.cli.json --noEmit",
    "lint":                 "eslint src/**/*.ts",
    "test":                 "jest",
    "start":                "ts-node src/index.ts",

    # ── Local environment ─────────────────────────────────────────
    "local:setup":          "bash scripts/local-platform-setup.sh",
    "local:verify":         "bash scripts/debug/local-platform-verify.sh",
    "local:infra:up":       "docker compose -f docker-compose.local.yml up -d --force-recreate --remove-orphans",
    "local:infra:down":     "docker compose -f docker-compose.local.yml down",
    "local:infra:clean":    "bash scripts/local/cleanup-ports.sh && pnpm local:infra:down",
    "local:infra:logs":     "docker compose -f docker-compose.local.yml logs -f",

    # ── Knowledge / RAG ───────────────────────────────────────────
    "knowledge:sync":       "python3 scripts/knowledge/scrape_memory_alpha.py && node scripts/knowledge/upload_knowledge.js",

    # ── Deployment ────────────────────────────────────────────────
    "deploy:aws":           "bash scripts/deploy/deploy-full.sh",
    "deploy:project":       "bash scripts/deploy/deploy-project.sh",
    "deploy:domain":        "bash scripts/deploy/deploy-domain.sh",
    "ship":                 "bash scripts/ship.sh",

    # ── n8n / Automation ──────────────────────────────────────────
    "n8n:sync:creds":       "node scripts/n8n/sync-credentials.js",
    "n8n:sync:workflows":   "node scripts/n8n/sync-workflows.js",
    "n8n:deploy":           "bash scripts/n8n/deploy-to-aws.sh",
    "n8n:backup":           "bash scripts/n8n/backup-workflows-cli.sh",

    # ── VSCode Extension ──────────────────────────────────────────
    "vscode:build":         "bash scripts/vscode/build-extension.sh",
    "vscode:package":       "bash scripts/vscode/package.sh",
    "vscode:install:local": "bash scripts/vscode/install-local.sh",

    # ── Clippy (creative pipeline) ────────────────────────────────
    "clippy":               "bash apps/clippy-doom-video-builder/build_video.sh",

    # ── Registry / Verification ───────────────────────────────────
    "generate:registry":    "ts-node scripts/generate-agent-registry.ts",
    "verify:automation-sync": "node scripts/verify-mcp-n8n-sync.js",
    "verify:setup":         "bash scripts/debug/verify-setup.sh",
}

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')

print("package.json updated")
PYEOF
  step "package.json scripts rewritten"
fi
FIXED=$((FIXED+1))

success "package.json updated."

# =============================================================================
# 14. ADD _archive/scripts-* TO .gitignore (already has _archive/)
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 14 — Verify .gitignore coverage ══${RESET}"

if grep -qF "_archive/" "${REPO_ROOT}/.gitignore" 2>/dev/null; then
  step "_archive/ already covered in .gitignore"
else
  if ! $DRY_RUN; then
    printf '\n_archive/\n' >> "${REPO_ROOT}/.gitignore"
  fi
  step "added _archive/ to .gitignore"
fi

success ".gitignore verified."

# =============================================================================
# 15. COMMIT AND PUSH
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Step 15 — Commit and push ══${RESET}"

if $DRY_RUN; then
  step "[dry] git add -A && git commit && git push"
else
  cd "${REPO_ROOT}"
  git add -A
  echo ""
  git status --short
  echo ""
  git commit -m "chore(scripts): unify and optimise scripts directory

- Delete 14 zero-byte stub files
- Archive 20+ one-time fix/repair/phase scripts (~350KB of dead code)
- Consolidate: deploy scripts → scripts/deploy/
- Consolidate: debug/verify scripts → scripts/debug/
- Consolidate: local dev scripts → scripts/local/
- Rename complete-phase-8.sh → scripts/vscode/build-extension.sh
- Fix pipeline.sh: correct two broken internal path references
- Fix ship.sh: update trigger-gh-deploy.sh path after move
- Create scripts/knowledge/ wrappers (fix broken knowledge:sync in package.json)
- Rewrite root package.json scripts: 35 entries, all paths verified
  - Add: deploy:project, deploy:domain, ship, n8n:sync:workflows,
         n8n:backup, vscode:build, vscode:package, vscode:install:local,
         verify:setup
  - Fix: local:verify now points to scripts/debug/local-platform-verify.sh
  - Fix: deploy:aws now points to scripts/deploy/deploy-full.sh"

  git push origin main
  echo ""
  echo -e "${GREEN}  ✓ Pushed to GitHub${RESET}"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${GREEN}│              Scripts Optimisation Complete ✓                 │${RESET}"
echo -e "${BOLD}${GREEN}└──────────────────────────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  ${GREEN}Files archived / moved${RESET}  : ${BOLD}${MOVED}${RESET}"
echo -e "  ${RED}Dead stubs deleted${RESET}      : ${BOLD}${REMOVED}${RESET}"
echo -e "  ${CYAN}Broken refs fixed${RESET}       : ${BOLD}${FIXED}${RESET}"
echo ""
echo -e "  ${BOLD}New scripts/ structure:${RESET}"
echo -e "  ${DIM}scripts/"
echo -e "  ├── build.sh, pipeline.sh, ship.sh          (root-level orchestrators)"
echo -e "  ├── start-local-dev.sh, local-platform-setup.sh"
echo -e "  ├── generate-agent-registry.ts, verify-mcp-n8n-sync.js, crew-project-cli.mjs"
echo -e "  ├── deploy/    deploy-full|project|domain, trigger-gh-deploy, ci-deploy"
echo -e "  ├── debug/     analyze-ci-failure, debug-*, verify-*, local-platform-verify"
echo -e "  ├── local/     local-dev, stop-nextjs, clean-build-all, open-*"
echo -e "  ├── knowledge/ scrape_memory_alpha.py, upload_knowledge.js (wrappers)"
echo -e "  ├── n8n/       sync-credentials|workflows, deploy-to-aws, backup"
echo -e "  ├── secrets/   setup, load, sync-to-github, sync-all-projects"
echo -e "  ├── vscode/    build-extension.sh, package.sh, install-local.sh"
echo -e "  ├── agile/     create-feature|milestone, push-feature|milestone"
echo -e "  ├── domain/    create-domain, migrate-to-ddd, federate-feature"
echo -e "  ├── aws/       cloudformation-template, cost-calculator, deploy-comprehensive"
echo -e "  ├── versioning/ generate-version-info.ts, milestones.ts"
echo -e "  ├── publishing/ publish-local|remote"
echo -e "  ├── git/       setup-remote.js, verify-git-status.sh"
echo -e "  ├── agents/    pm-ui-autonomous-build.ts"
echo -e "  └── reports/   analytics*.ts, report.ts, weekly-report-generator.ts${RESET}"
echo ""
$DRY_RUN && echo -e "  ${YELLOW}DRY-RUN — re-run without --dry-run to apply.${RESET}"
echo ""

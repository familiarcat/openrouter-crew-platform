#!/usr/bin/env bash
# =============================================================================
# crew-remediate.sh — openrouter-crew-platform diagnostic & remediation script
# Run from the repo root: bash crew-remediate.sh
# Flags:
#   --dry-run    Print what would happen without making changes
#   --yes        Skip all confirmation prompts (CI mode)
#   --phase N    Run only phase N (1-6)
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[0;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

# ── flags ─────────────────────────────────────────────────────────────────────
DRY_RUN=false
AUTO_YES=false
ONLY_PHASE=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes)     AUTO_YES=true ;;
    --phase)   shift; ONLY_PHASE="$1" ;;
    --phase=*) ONLY_PHASE="${arg#*=}" ;;
  esac
done

# ── helpers ───────────────────────────────────────────────────────────────────
log_head()  { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }
log_ok()    { echo -e "  ${GREEN}✔${RESET}  $*"; }
log_warn()  { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
log_err()   { echo -e "  ${RED}✘${RESET}  $*"; }
log_info()  { echo -e "  ${DIM}→${RESET}  $*"; }
log_dry()   { echo -e "  ${YELLOW}[dry]${RESET} $*"; }
log_skip()  { echo -e "  ${DIM}–  skipped: $*${RESET}"; }

BACKUP_DIR=".crew-remediate-backup-$(date +%Y%m%d_%H%M%S)"

run() {
  # Execute a command or print it in dry-run mode
  if $DRY_RUN; then
    log_dry "$*"
  else
    eval "$*"
  fi
}

backup_file() {
  local src="$1"
  if [[ -e "$src" ]]; then
    local dest="$BACKUP_DIR/$src"
    mkdir -p "$(dirname "$dest")"
    cp -r "$src" "$dest"
    log_info "backed up → $BACKUP_DIR/$src"
  fi
}

confirm() {
  local msg="$1"
  if $AUTO_YES; then return 0; fi
  echo -e "\n  ${YELLOW}?${RESET}  $msg [y/N] " && read -r reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

phase_active() {
  [[ -z "$ONLY_PHASE" || "$ONLY_PHASE" == "$1" ]]
}

ISSUES_FOUND=0
ISSUES_FIXED=0
ISSUES_SKIPPED=0

note_issue() { ((ISSUES_FOUND++)) || true; log_warn "$*"; }
note_fixed()  { ((ISSUES_FIXED++)) || true;  log_ok "$*"; }
note_skip()   { ((ISSUES_SKIPPED++)) || true; log_skip "$*"; }

# =============================================================================
# PREFLIGHT
# =============================================================================
log_head "Preflight checks"

# Must be at repo root
if [[ ! -f "package.json" ]]; then
  log_err "No package.json found. Run this script from the monorepo root."
  exit 1
fi
log_ok "package.json present"

REPO_NAME=$(node -e "try{const p=require('./package.json');console.log(p.name||'unknown')}catch(e){console.log('unknown')}" 2>/dev/null || echo "unknown")
log_info "repo: $REPO_NAME"

# Git status check
if git rev-parse --git-dir &>/dev/null; then
  GIT_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$GIT_DIRTY" -gt 0 ]]; then
    log_warn "Working tree has $GIT_DIRTY uncommitted change(s). Recommend committing first."
    if ! confirm "Continue anyway?"; then
      echo "Aborted. Commit or stash changes first." && exit 1
    fi
  else
    log_ok "Git working tree clean"
  fi
else
  log_warn "Not a git repo — no automatic backup via git. Backup dir will be used."
fi

# pnpm installed?
PNPM_AVAILABLE=false
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm --version 2>/dev/null || echo "?")
  log_ok "pnpm available (v$PNPM_VER)"
  PNPM_AVAILABLE=true
else
  log_err "pnpm not found. Install it first:"
  echo -e "       ${DIM}npm install -g pnpm  OR  curl -fsSL https://get.pnpm.io/install.sh | sh${RESET}"
  if ! confirm "Install pnpm now via npm and continue?"; then
    echo "Aborted. Install pnpm and re-run." && exit 1
  fi
  run "npm install -g pnpm"
  PNPM_AVAILABLE=true
fi

# Is this a pnpm workspace?
IS_PNPM_WORKSPACE=false
if [[ -f "pnpm-workspace.yaml" ]]; then
  IS_PNPM_WORKSPACE=true
  log_ok "pnpm-workspace.yaml detected — this is a pnpm workspace"
else
  log_warn "No pnpm-workspace.yaml found — workspace detection limited"
fi

$DRY_RUN && echo -e "\n  ${YELLOW}DRY RUN MODE — no files will be modified${RESET}"

# Create backup dir (real mode only)
if ! $DRY_RUN; then
  mkdir -p "$BACKUP_DIR"
  log_info "backup dir: $BACKUP_DIR"
fi

# =============================================================================
# PHASE 1 — Package manager mismatch (the crash fix)
# =============================================================================
phase_active "1" && {
log_head "Phase 1 — Fix package manager mismatch (npm → pnpm)"

# Nuke package-lock.json (npm artifact, incompatible with pnpm workspace)
if [[ -f "package-lock.json" ]]; then
  note_issue "package-lock.json present alongside pnpm-workspace.yaml — causes install conflicts"
  if confirm "Delete package-lock.json?"; then
    backup_file "package-lock.json"
    run "rm -f package-lock.json"
    note_fixed "Removed package-lock.json"
  else
    note_skip "package-lock.json left in place"
  fi
else
  log_ok "No package-lock.json (good)"
fi

# Check for npm_modules at root (stale)
if [[ -d "node_modules" ]]; then
  note_issue "node_modules present — may contain npm-installed artifacts incompatible with pnpm"
  if confirm "Remove root node_modules and reinstall clean with pnpm?"; then
    run "rm -rf node_modules"
    note_fixed "Removed root node_modules"
  else
    note_skip "node_modules left in place"
  fi
fi

# Find all nested node_modules installed by npm (not pnpm symlinks)
echo ""
log_info "Scanning for stale nested node_modules..."
NESTED_NM=()
while IFS= read -r -d '' nm_path; do
  # Skip if it's already a pnpm virtual store
  if [[ "$nm_path" != *".pnpm"* ]] && [[ "$nm_path" != *"node_modules/.pnpm"* ]]; then
    parent=$(dirname "$nm_path")
    NESTED_NM+=("$parent")
  fi
done < <(find . -name "node_modules" -not -path "*/node_modules/node_modules/*" -not -path "./.git/*" -print0 2>/dev/null)

if [[ ${#NESTED_NM[@]} -gt 0 ]]; then
  note_issue "Found ${#NESTED_NM[@]} nested node_modules directories"
  for nm in "${NESTED_NM[@]}"; do
    log_info "  $nm/node_modules"
  done
  if confirm "Remove all nested node_modules for a clean pnpm install?"; then
    for nm in "${NESTED_NM[@]}"; do
      run "rm -rf '$nm/node_modules'"
    done
    note_fixed "Cleared ${#NESTED_NM[@]} nested node_modules"
  else
    note_skip "nested node_modules left in place"
  fi
else
  log_ok "No stale nested node_modules found"
fi

# Enforce packageManager field in root package.json
if command -v node &>/dev/null; then
  PKG_MANAGER=$(node -e "try{const p=require('./package.json');console.log(p.packageManager||'')}catch(e){console.log('')}" 2>/dev/null || echo "")
  if [[ -z "$PKG_MANAGER" || "$PKG_MANAGER" != pnpm* ]]; then
    PNPM_VER_FULL=$(pnpm --version 2>/dev/null || echo "9.0.0")
    note_issue "packageManager field missing or not set to pnpm in root package.json"
    if confirm "Set packageManager to pnpm@$PNPM_VER_FULL in root package.json?"; then
      backup_file "package.json"
      run "node -e \"
        const fs = require('fs');
        const p = JSON.parse(fs.readFileSync('package.json','utf8'));
        p.packageManager = 'pnpm@$PNPM_VER_FULL';
        fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
        console.log('  packageManager field updated');
      \""
      note_fixed "Set packageManager = pnpm@$PNPM_VER_FULL"
    else
      note_skip "packageManager field not updated"
    fi
  else
    log_ok "packageManager = $PKG_MANAGER"
  fi
fi

# Run pnpm install
if confirm "Run pnpm install now?"; then
  run "pnpm install"
  note_fixed "pnpm install complete"
else
  note_skip "pnpm install deferred"
fi
}

# =============================================================================
# PHASE 2 — Remove test project from workspace
# =============================================================================
phase_active "2" && {
log_head "Phase 2 — Remove test project domain impersonator"

TEST_PKGS=()
if [[ -d "packages" ]]; then
  while IFS= read -r pkg_dir; do
    pkg_name=$(basename "$pkg_dir")
    if [[ "$pkg_name" =~ ^test[-_] ]] || [[ "$pkg_name" =~ [-_]test$ ]] || [[ "$pkg_name" == "test" ]]; then
      TEST_PKGS+=("$pkg_dir")
    elif [[ -f "$pkg_dir/package.json" ]]; then
      # Check package.json for "private: false" + test-related keywords
      pkg_json_name=$(node -e "try{const p=require('./$pkg_dir/package.json');console.log(p.name||'')}catch(e){console.log('')}" 2>/dev/null || echo "")
      if [[ "$pkg_json_name" =~ test ]]; then
        TEST_PKGS+=("$pkg_dir")
      fi
    fi
  done < <(find packages -maxdepth 1 -mindepth 1 -type d 2>/dev/null)
fi

if [[ ${#TEST_PKGS[@]} -eq 0 ]]; then
  log_ok "No test packages detected in packages/"
else
  for tp in "${TEST_PKGS[@]}"; do
    note_issue "Test package registered as workspace domain: $tp"
    if confirm "Remove $tp from workspace? (archives to $BACKUP_DIR, removes from pnpm-workspace.yaml + turbo.json)"; then

      # Backup
      backup_file "$tp"

      # Remove directory
      run "rm -rf '$tp'"
      note_fixed "Removed $tp"

      # Patch pnpm-workspace.yaml
      if [[ -f "pnpm-workspace.yaml" ]]; then
        backup_file "pnpm-workspace.yaml"
        pkg_base=$(basename "$tp")
        # Remove lines referencing this package
        run "sed -i.bak \"/'packages\\/$pkg_base'/d;/'packages\\/$pkg_base\\/\*'/d\" pnpm-workspace.yaml && rm -f pnpm-workspace.yaml.bak"
        note_fixed "Removed $pkg_base from pnpm-workspace.yaml"
      fi

      # Patch turbo.json if it explicitly references the package
      if [[ -f "turbo.json" ]]; then
        pkg_base=$(basename "$tp")
        if grep -q "$pkg_base" turbo.json 2>/dev/null; then
          backup_file "turbo.json"
          log_warn "turbo.json references $pkg_base — manual review needed (too complex for auto-patch)"
          log_info "Search turbo.json for: $pkg_base and remove related pipeline entries"
        fi
      fi

    else
      note_skip "$tp left in place"
    fi
  done
fi
}

# =============================================================================
# PHASE 3 — Detect and extract agent runners from domain packages
# =============================================================================
phase_active "3" && {
log_head "Phase 3 — Extract agent runners from domain packages"

RUNNER_VIOLATIONS=()

# Look for runner entrypoints nested inside packages/
if [[ -d "packages" ]]; then
  while IFS= read -r -d '' runner_file; do
    pkg_dir=$(echo "$runner_file" | cut -d'/' -f1-2)
    # Skip if it's already in apps/
    if [[ "$pkg_dir" == apps/* ]]; then continue; fi
    RUNNER_VIOLATIONS+=("$runner_file")
  done < <(find packages -type f \( \
    -name "runner.ts" -o -name "runner.js" \
    -o -name "runner.mts" -o -name "runner.mjs" \
    -o -name "run.ts"   -o -name "run.js" \
    -o -name "server.ts" -o -name "server.js" \
    -o -name "worker.ts" -o -name "worker.js" \
    -o -name "entrypoint.ts" -o -name "entrypoint.js" \
    -o -name "main.ts"  -o -name "main.js" \
  \) -not -path "*/node_modules/*" -print0 2>/dev/null)
fi

if [[ ${#RUNNER_VIOLATIONS[@]} -eq 0 ]]; then
  log_ok "No runner/server entrypoints found in packages/ (good)"
else
  note_issue "Found ${#RUNNER_VIOLATIONS[@]} potential runner entrypoint(s) in domain packages:"
  for rv in "${RUNNER_VIOLATIONS[@]}"; do
    log_info "  $rv"
  done
  echo ""
  log_warn "Runner files should live in apps/, not packages/."
  log_warn "Auto-extraction is risky without knowing your full dependency graph."
  log_warn "Generating a migration plan instead:"

  MIGRATION_PLAN="crew-runner-migration-plan.md"
  if ! $DRY_RUN; then
    {
      echo "# Agent Runner Migration Plan"
      echo "Generated: $(date)"
      echo ""
      echo "## Runner entrypoints found in domain packages"
      echo ""
      for rv in "${RUNNER_VIOLATIONS[@]}"; do
        pkg_dir=$(echo "$rv" | cut -d'/' -f1-2)
        pkg_name=$(node -e "try{const p=require('./$pkg_dir/package.json');console.log(p.name||'$pkg_dir')}catch(e){console.log('$pkg_dir')}" 2>/dev/null || echo "$pkg_dir")
        echo "### \`$rv\`"
        echo "- Source package: \`$pkg_name\`"
        echo "- Suggested target: \`apps/agent-runner/src/$(basename "$rv")\`"
        echo ""
        echo "\`\`\`bash"
        echo "# Step 1 — create app scaffold (if not exists)"
        echo "mkdir -p apps/agent-runner/src"
        echo ""
        echo "# Step 2 — move the runner"
        echo "mv $rv apps/agent-runner/src/"
        echo ""
        echo "# Step 3 — create apps/agent-runner/package.json"
        cat <<-PKGJSON
cat > apps/agent-runner/package.json << 'EOF'
{
  "name": "@crew/agent-runner",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/runner.ts",
    "build": "tsc",
    "start": "node dist/runner.js"
  },
  "dependencies": {
    "$pkg_name": "workspace:*"
  }
}
EOF
PKGJSON
        echo ""
        echo "# Step 4 — add to pnpm-workspace.yaml"
        echo "# Ensure 'apps/*' is listed in pnpm-workspace.yaml"
        echo "\`\`\`"
        echo ""
      done
      echo "## After migration"
      echo ""
      echo "\`\`\`bash"
      echo "pnpm install"
      echo "pnpm turbo run build --dry"
      echo "\`\`\`"
    } > "$MIGRATION_PLAN"
    note_fixed "Migration plan written to: $MIGRATION_PLAN"
  else
    log_dry "Would write migration plan to: $MIGRATION_PLAN"
  fi
fi
}

# =============================================================================
# PHASE 4 — Dashboard location check
# =============================================================================
phase_active "4" && {
log_head "Phase 4 — Verify dashboard is in apps/"

DASHBOARD_IN_APPS=false
DASHBOARD_IN_PACKAGES=false
DASHBOARD_PATH=""

# Check apps/
for candidate in apps/dashboard apps/web apps/next; do
  if [[ -f "$candidate/package.json" ]]; then
    DASHBOARD_IN_APPS=true
    DASHBOARD_PATH="$candidate"
    break
  fi
done

# Check packages/ (violation territory)
if [[ -d "packages" ]]; then
  while IFS= read -r pkg_dir; do
    if [[ -f "$pkg_dir/next.config.js" || -f "$pkg_dir/next.config.ts" || -f "$pkg_dir/next.config.mjs" ]]; then
      if [[ "$pkg_dir" != apps/* ]]; then
        DASHBOARD_IN_PACKAGES=true
        DASHBOARD_PATH="$pkg_dir"
      fi
    fi
  done < <(find packages -maxdepth 2 -name "next.config*" -not -path "*/node_modules/*" -exec dirname {} \; 2>/dev/null | sort -u)
fi

if $DASHBOARD_IN_APPS; then
  log_ok "Dashboard found in apps/ at $DASHBOARD_PATH"
elif $DASHBOARD_IN_PACKAGES; then
  note_issue "Next.js app (dashboard) detected inside packages/ at $DASHBOARD_PATH — bleeding violation"
  log_warn "A Next.js deployable cannot live in a library package."
  if confirm "Move $DASHBOARD_PATH → apps/dashboard?"; then
    backup_file "$DASHBOARD_PATH"
    run "mkdir -p apps/dashboard"
    run "cp -r '$DASHBOARD_PATH/.' apps/dashboard/"
    run "rm -rf '$DASHBOARD_PATH'"

    # Ensure apps/* is in pnpm-workspace.yaml
    if [[ -f "pnpm-workspace.yaml" ]]; then
      if ! grep -q "apps/\*" pnpm-workspace.yaml 2>/dev/null; then
        backup_file "pnpm-workspace.yaml"
        run "echo '  - '\''apps/*'\''' >> pnpm-workspace.yaml"
        note_fixed "Added apps/* to pnpm-workspace.yaml"
      fi
    fi

    note_fixed "Moved dashboard to apps/dashboard"
    log_warn "Update any internal imports that referenced the old packages path"
  else
    note_skip "Dashboard not moved"
  fi
else
  log_warn "No Next.js app detected in apps/ or packages/ — verify dashboard path manually"
  log_info "Expected: apps/dashboard/next.config.{js,ts,mjs}"
fi
}

# =============================================================================
# PHASE 5 — Fix env variable bridging (zsh → bash)
# =============================================================================
phase_active "5" && {
log_head "Phase 5 — Fix env variable bridging (zsh → bash subshells)"

ENV_BRIDGE_SCRIPT=""
for candidate in scripts/crew-env-bridge.sh scripts/env-bridge.sh scripts/env.sh; do
  if [[ -f "$candidate" ]]; then
    ENV_BRIDGE_SCRIPT="$candidate"
    break
  fi
done

# Check if a .env file exists
HAS_DOTENV=false
[[ -f ".env" ]] && HAS_DOTENV=true
[[ -f ".env.local" ]] && HAS_DOTENV=true

if [[ -n "$ENV_BRIDGE_SCRIPT" ]]; then
  log_ok "Found env bridge script: $ENV_BRIDGE_SCRIPT"

  # Check if it already has the safe source pattern
  if grep -q "set -a" "$ENV_BRIDGE_SCRIPT" 2>/dev/null; then
    log_ok "set -a pattern already present in $ENV_BRIDGE_SCRIPT"
  else
    note_issue "$ENV_BRIDGE_SCRIPT missing set -a / set +a dotenv sourcing pattern"
    if confirm "Prepend safe .env loading block to $ENV_BRIDGE_SCRIPT?"; then
      backup_file "$ENV_BRIDGE_SCRIPT"
      BRIDGE_BLOCK=$(cat <<'BLOCK'

# ── env bridge: safe cross-shell variable export ───────────────────────────
# Loads .env file so all vars are available to bash subshells spawned from zsh
_load_env() {
  local env_file="${1:-.env}"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$env_file"
    set +a
    echo "[env-bridge] loaded $env_file" >&2
  else
    echo "[env-bridge] warning: $env_file not found" >&2
  fi
}

# Load in priority order
_load_env ".env"
_load_env ".env.local"
# ── end env bridge ──────────────────────────────────────────────────────────

BLOCK
)
      if ! $DRY_RUN; then
        ORIG_CONTENT=$(cat "$ENV_BRIDGE_SCRIPT")
        # Find shebang line and insert after it
        SHEBANG_LINE=$(head -1 "$ENV_BRIDGE_SCRIPT")
        REST="${ORIG_CONTENT#*$'\n'}"
        printf '%s\n%s\n%s' "$SHEBANG_LINE" "$BRIDGE_BLOCK" "$REST" > "$ENV_BRIDGE_SCRIPT"
        note_fixed "Injected env bridge block into $ENV_BRIDGE_SCRIPT"
      else
        log_dry "Would inject env bridge block into $ENV_BRIDGE_SCRIPT"
      fi
    else
      note_skip "env bridge not modified"
    fi
  fi
else
  log_warn "No env bridge script found in scripts/"
  if confirm "Create scripts/crew-env-bridge.sh?"; then
    run "mkdir -p scripts"
    if ! $DRY_RUN; then
      cat > scripts/crew-env-bridge.sh << 'ENVSCRIPT'
#!/usr/bin/env bash
# crew-env-bridge.sh — safely export .env vars into bash subshells from zsh
# Source this file, don't execute it: source scripts/crew-env-bridge.sh

# ── safe cross-shell env loader ────────────────────────────────────────────
_load_env() {
  local env_file="${1:-.env}"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$env_file"
    set +a
    echo "[env-bridge] loaded $env_file" >&2
  else
    echo "[env-bridge] warning: $env_file not found" >&2
  fi
}

_load_env ".env"
_load_env ".env.local"

# Verify critical platform vars
_check_var() {
  if [[ -z "${!1:-}" ]]; then
    echo "[env-bridge] ✘ missing required var: $1" >&2
    return 1
  else
    echo "[env-bridge] ✔ $1 set" >&2
  fi
}

_check_var OPENROUTER_API_KEY || true
_check_var SUPABASE_URL        || true
_check_var SUPABASE_ANON_KEY   || true
# ── end env bridge ──────────────────────────────────────────────────────────
ENVSCRIPT
      chmod +x scripts/crew-env-bridge.sh
      note_fixed "Created scripts/crew-env-bridge.sh"
    else
      log_dry "Would create scripts/crew-env-bridge.sh"
    fi
  else
    note_skip "crew-env-bridge.sh not created"
  fi
fi

# Check for .env.example
if [[ ! -f ".env.example" ]] && $HAS_DOTENV; then
  log_warn "No .env.example found — other devs (and future you) will be missing var documentation"
  if confirm "Generate .env.example from current .env keys (no values)?"; then
    if ! $DRY_RUN; then
      grep -E '^[A-Z_]+=?' .env 2>/dev/null | sed 's/=.*/=/' > .env.example || true
      note_fixed "Generated .env.example (keys only, no values)"
    else
      log_dry "Would generate .env.example from .env keys"
    fi
  fi
fi
}

# =============================================================================
# PHASE 6 — Final validation
# =============================================================================
phase_active "6" && {
log_head "Phase 6 — Build validation"

# Ensure apps/* is in pnpm-workspace.yaml
if [[ -f "pnpm-workspace.yaml" ]]; then
  if ! grep -q "apps/\*" pnpm-workspace.yaml 2>/dev/null; then
    note_issue "apps/* not in pnpm-workspace.yaml — apps/ packages won't be managed by pnpm"
    if confirm "Add apps/* to pnpm-workspace.yaml?"; then
      backup_file "pnpm-workspace.yaml"
      run "echo '  - '\''apps/*'\''' >> pnpm-workspace.yaml"
      note_fixed "Added apps/* to pnpm-workspace.yaml"
    fi
  else
    log_ok "apps/* present in pnpm-workspace.yaml"
  fi
fi

# pnpm install (if not already done in phase 1)
if [[ -z "$ONLY_PHASE" || "$ONLY_PHASE" == "6" ]]; then
  if confirm "Run pnpm install to sync workspace?"; then
    run "pnpm install"
    note_fixed "pnpm install OK"
  fi
fi

# turbo dry run
if command -v pnpm &>/dev/null && [[ -f "turbo.json" ]]; then
  if confirm "Run turbo build --dry to validate pipeline?"; then
    echo ""
    run "pnpm turbo run build --dry=json 2>&1 | tail -40" || {
      log_warn "turbo dry run produced errors — see output above"
    }
  fi
fi

# Check for workspace:* refs that npm can't handle
log_info "Scanning for workspace:* protocol references..."
WS_REFS=()
while IFS= read -r -d '' pkg_json; do
  if grep -q '"workspace:\*"' "$pkg_json" 2>/dev/null || grep -q '"workspace:\^"' "$pkg_json" 2>/dev/null; then
    WS_REFS+=("$pkg_json")
  fi
done < <(find . -name "package.json" -not -path "*/node_modules/*" -not -path "./.git/*" -print0 2>/dev/null)

if [[ ${#WS_REFS[@]} -gt 0 ]]; then
  log_info "workspace:* references found in ${#WS_REFS[@]} package.json file(s) — correct for pnpm, fatal for npm:"
  for ref in "${WS_REFS[@]}"; do
    log_info "  $ref"
  done
  log_ok "These are expected in a pnpm workspace. Just never run 'npm install' here."
else
  log_ok "No workspace:* refs found (or none detected)"
fi
}

# =============================================================================
# SUMMARY
# =============================================================================
log_head "Summary"

echo -e "  Issues found:   ${BOLD}$ISSUES_FOUND${RESET}"
echo -e "  Issues fixed:   ${GREEN}${BOLD}$ISSUES_FIXED${RESET}"
echo -e "  Issues skipped: ${YELLOW}${BOLD}$ISSUES_SKIPPED${RESET}"

if [[ -d "$BACKUP_DIR" ]] && ! $DRY_RUN; then
  echo -e "\n  ${DIM}Backups stored in: $BACKUP_DIR${RESET}"
  echo -e "  ${DIM}To restore: cp -r $BACKUP_DIR/. .${RESET}"
fi

if [[ -f "crew-runner-migration-plan.md" ]]; then
  echo -e "\n  ${CYAN}→ Agent runner migration plan: crew-runner-migration-plan.md${RESET}"
  echo -e "  ${DIM}  Review and complete migration manually — dependency graph must be checked first${RESET}"
fi

echo -e "\n  ${DIM}Canonical next build command:${RESET}"
echo -e "  ${BOLD}pnpm install && pnpm turbo run build${RESET}\n"

$DRY_RUN && echo -e "  ${YELLOW}This was a dry run. Re-run without --dry-run to apply changes.${RESET}\n"

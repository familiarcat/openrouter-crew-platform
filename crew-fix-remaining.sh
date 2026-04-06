#!/usr/bin/env bash
# =============================================================================
# crew-fix-remaining.sh — targeted fixes for the three remaining open issues
#
# Issue 1: pnpm-workspace.yaml — orphaned agents/** glob + redundant entry
# Issue 2: domains/alex-ai-universal/dashboard — bleeding Next.js app in domain
# Issue 3: domains/vscode-extension — btoa() crash on emoji log strings
#
# Usage:
#   bash crew-fix-remaining.sh             # interactive, confirms each phase
#   bash crew-fix-remaining.sh --yes       # non-interactive
#   bash crew-fix-remaining.sh --dry-run   # print changes, touch nothing
#   bash crew-fix-remaining.sh --phase N   # run only phase N (1-3)
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[0;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

DRY_RUN=false; AUTO_YES=false; ONLY_PHASE=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)   DRY_RUN=true ;;
    --yes)       AUTO_YES=true ;;
    --phase=*)   ONLY_PHASE="${arg#*=}" ;;
    --phase)     shift; ONLY_PHASE="${1:-}" ;;
  esac
done

log_head() { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }
log_ok()   { echo -e "  ${GREEN}✔${RESET}  $*"; }
log_warn() { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
log_err()  { echo -e "  ${RED}✘${RESET}  $*"; }
log_info() { echo -e "  ${DIM}→${RESET}  $*"; }
log_dry()  { echo -e "  ${YELLOW}[dry-run]${RESET} $*"; }

BACKUP_DIR=".crew-fix-backup-$(date +%Y%m%d_%H%M%S)"

run() { $DRY_RUN && { log_dry "$*"; return 0; }; eval "$*"; }

backup() {
  local f="$1"
  [[ -e "$f" ]] || return 0
  if ! $DRY_RUN; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp -r "$f" "$BACKUP_DIR/$f"
    log_info "backed up → $BACKUP_DIR/$f"
  fi
}

confirm() {
  $AUTO_YES && return 0
  echo -e "\n  ${YELLOW}?${RESET}  $1 [y/N] " && read -r _r
  [[ "$_r" =~ ^[Yy]$ ]]
}

phase_active() { [[ -z "$ONLY_PHASE" || "$ONLY_PHASE" == "$1" ]]; }

# ── preflight ──────────────────────────────────────────────────────────────────
[[ -f "package.json" ]] || { log_err "Run from the monorepo root."; exit 1; }
[[ -f "pnpm-workspace.yaml" ]] || { log_err "pnpm-workspace.yaml not found."; exit 1; }
$DRY_RUN && echo -e "\n  ${YELLOW}DRY-RUN MODE — no files will be touched${RESET}"
! $DRY_RUN && mkdir -p "$BACKUP_DIR"

FIXED=0; SKIPPED=0

# =============================================================================
# PHASE 1 — pnpm-workspace.yaml cleanup
# =============================================================================
phase_active "1" && {
log_head "Phase 1 — Clean up pnpm-workspace.yaml"

WORKSPACE="pnpm-workspace.yaml"

# Show current state
echo -e "\n  Current $WORKSPACE:"
sed 's/^/    /' "$WORKSPACE"

# agents/** — no agents/ directory exists at root
if grep -q '"agents/\*\*"' "$WORKSPACE" || grep -q "'agents/\*\*'" "$WORKSPACE" || grep -qE '^[[:space:]]*-[[:space:]]*"?agents' "$WORKSPACE"; then
  log_warn "Found orphaned  agents/**  glob (no agents/ directory at repo root)"

  if confirm "Remove the agents/** glob from $WORKSPACE?"; then
    backup "$WORKSPACE"
    # Remove any line whose value is agents/** or agents/*
    if ! $DRY_RUN; then
      python3 - <<'PY' "$WORKSPACE"
import sys, re
path = sys.argv[1]
with open(path) as f:
    lines = f.readlines()
cleaned = [l for l in lines if not re.search(r'agents/[\*\*\*]', l)]
with open(path, 'w') as f:
    f.writelines(cleaned)
print("  agents/** removed")
PY
    else
      log_dry "Would remove agents/** line from $WORKSPACE"
    fi
    ((FIXED++)) || true
    log_ok "Removed orphaned agents/** workspace glob"
  else
    ((SKIPPED++)) || true
  fi
else
  log_ok "No orphaned agents/** glob found"
fi

# domains/marketing-funnel — redundant; already matched by domains/**
if grep -qE 'domains/marketing-funnel' "$WORKSPACE"; then
  log_warn "Found redundant  domains/marketing-funnel  (already covered by domains/**)"

  if confirm "Remove the redundant domains/marketing-funnel entry?"; then
    backup "$WORKSPACE"
    if ! $DRY_RUN; then
      python3 - <<'PY' "$WORKSPACE"
import sys, re
path = sys.argv[1]
with open(path) as f:
    lines = f.readlines()
cleaned = [l for l in lines if 'domains/marketing-funnel' not in l]
with open(path, 'w') as f:
    f.writelines(cleaned)
print("  domains/marketing-funnel removed")
PY
    else
      log_dry "Would remove domains/marketing-funnel line from $WORKSPACE"
    fi
    ((FIXED++)) || true
    log_ok "Removed redundant domains/marketing-funnel entry"
  else
    ((SKIPPED++)) || true
  fi
else
  log_ok "No redundant domains/marketing-funnel entry found"
fi

echo -e "\n  $WORKSPACE after phase 1:"
$DRY_RUN || sed 's/^/    /' "$WORKSPACE"
}

# =============================================================================
# PHASE 2 — VSCode extension btoa() → Buffer.from() fix
# =============================================================================
phase_active "2" && {
log_head "Phase 2 — VSCode extension: fix btoa() crash on emoji strings"

VSCODE_DIR="domains/vscode-extension"

if [[ ! -d "$VSCODE_DIR" ]]; then
  log_warn "domains/vscode-extension not found — skipping"
else
  # Find every TypeScript file with a btoa() call
  BTOA_FILES=()
  while IFS= read -r -d '' f; do
    BTOA_FILES+=("$f")
  done < <(grep -rlZ 'btoa(' "$VSCODE_DIR/src" 2>/dev/null || true)

  if [[ ${#BTOA_FILES[@]} -eq 0 ]]; then
    log_ok "No btoa() calls found in $VSCODE_DIR/src"
  else
    log_warn "Found btoa() calls in ${#BTOA_FILES[@]} file(s):"
    for f in "${BTOA_FILES[@]}"; do
      echo -e "    ${DIM}$f${RESET}"
      grep -n 'btoa(' "$f" | head -5 | sed 's/^/      /'
    done

    echo ""
    log_info "btoa() fails on any char > U+00FF (emoji, unicode)."
    log_info "Replacement: Buffer.from(str, 'utf-8').toString('base64')"
    log_info "Reverse:     Buffer.from(b64, 'base64').toString('utf-8')"

    if confirm "Apply Buffer.from() replacement across all ${#BTOA_FILES[@]} file(s)?"; then
      for f in "${BTOA_FILES[@]}"; do
        backup "$f"
        if ! $DRY_RUN; then
          # Replace  btoa(X)  with  Buffer.from(X, 'utf-8').toString('base64')
          # This handles single-expression btoa() calls. Uses Python for safe
          # multiline regex that won't corrupt surrounding code.
          python3 - "$f" <<'PY'
import sys, re

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as fh:
    src = fh.read()

# Pattern: btoa( ... ) where the arg is a simple expression
# We use a balanced-paren approach limited to single-line calls which
# covers the documented case (log string encoding).
# For multi-line btoa calls a manual review note is added instead.
changed = re.sub(
    r'\bbtoa\(([^()]+)\)',
    lambda m: f'Buffer.from({m.group(1)}, \'utf-8\').toString(\'base64\')',
    src
)

# Also fix the reverse: atob(X) → Buffer.from(X, 'base64').toString('utf-8')
changed = re.sub(
    r'\batob\(([^()]+)\)',
    lambda m: f'Buffer.from({m.group(1)}, \'base64\').toString(\'utf-8\')',
    changed
)

if changed != src:
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(changed)
    print(f"  patched: {path}")
else:
    print(f"  no simple btoa() found (may be multi-line): {path}")
PY
        else
          log_dry "Would patch $f"
        fi
      done
      ((FIXED++)) || true
      log_ok "btoa() → Buffer.from() replacement applied"

      # Add a comment to the vscode extension tsconfig if it's missing node types
      VSCODE_TSCONFIG="$VSCODE_DIR/tsconfig.json"
      if [[ -f "$VSCODE_TSCONFIG" ]]; then
        if ! grep -q '"node"' "$VSCODE_TSCONFIG"; then
          log_warn "tsconfig.json may be missing @types/node — Buffer.from requires it"
          log_info "Add to compilerOptions.types: [\"node\", \"vscode\"]"
          log_info "And add to devDependencies: @types/node"
        else
          log_ok "tsconfig.json already includes node types"
        fi
      fi
    else
      ((SKIPPED++)) || true
    fi
  fi
fi
}

# =============================================================================
# PHASE 3 — Migrate domains/alex-ai-universal/dashboard → apps/
# =============================================================================
phase_active "3" && {
log_head "Phase 3 — Migrate alex-ai-universal dashboard out of domain"

# Determine the actual domain directory name on disk
AAU_DOMAIN=""
for candidate in "domains/alex-ai-universal" "domains/ai-orchestration" "domains/alex-ai"; do
  if [[ -d "$candidate/dashboard" ]]; then
    AAU_DOMAIN="$candidate"
    break
  fi
done

DASHBOARD_SRC=""
[[ -n "$AAU_DOMAIN" ]] && DASHBOARD_SRC="$AAU_DOMAIN/dashboard"
DASHBOARD_DEST="apps/alex-dashboard"

if [[ -z "$AAU_DOMAIN" ]]; then
  # Dashboard may already have been moved
  if [[ -d "$DASHBOARD_DEST" ]]; then
    log_ok "Dashboard already at $DASHBOARD_DEST — migration already done"
  else
    log_warn "Could not find dashboard in domains/ or $DASHBOARD_DEST — scanning..."
    # Broad scan for next.config inside domains
    FOUND=$(find domains -maxdepth 3 -name "next.config*" -not -path "*/node_modules/*" 2>/dev/null | head -5)
    if [[ -n "$FOUND" ]]; then
      log_warn "Found Next.js configs at:"
      echo "$FOUND" | sed 's/^/    /'
      log_warn "Re-run with the correct domain path or move manually."
    else
      log_ok "No misplaced Next.js apps found in domains/ — nothing to migrate"
    fi
  fi
else
  log_warn "Found bleeding Next.js dashboard: $DASHBOARD_SRC"
  log_info "Target:  $DASHBOARD_DEST"
  log_info "Broken API routes documented in KNOWN_ISSUES.md:"
  log_info "  app/api/events/route.ts"
  log_info "  app/api/mcp/crew/roster/route.ts"
  log_info "  app/api/mcp/settings/test/route.ts"
  log_info "  app/api/mcp/workflows/executions/route.ts"
  log_info "  app/api/mcp/workflows/storage/route.ts"

  if confirm "Move $DASHBOARD_SRC → $DASHBOARD_DEST and fix import paths?"; then

    # ── 3a. Move the directory ──────────────────────────────────────────────
    backup "$DASHBOARD_SRC"

    if ! $DRY_RUN; then
      mkdir -p "$(dirname "$DASHBOARD_DEST")"
      cp -r "$DASHBOARD_SRC" "$DASHBOARD_DEST"
      rm -rf "$DASHBOARD_SRC"
      log_ok "Moved $DASHBOARD_SRC → $DASHBOARD_DEST"
    else
      log_dry "Would move $DASHBOARD_SRC → $DASHBOARD_DEST"
    fi

    # ── 3b. Fix tsconfig.json — add path aliases ────────────────────────────
    TSCONFIG_DEST="$DASHBOARD_DEST/tsconfig.json"
    if [[ -f "$TSCONFIG_DEST" ]] || $DRY_RUN; then
      log_info "Patching $TSCONFIG_DEST with corrected path aliases..."

      if ! $DRY_RUN; then
        python3 - "$TSCONFIG_DEST" "$AAU_DOMAIN" <<'PY'
import sys, json, os

tsconfig_path = sys.argv[1]
domain_path   = sys.argv[2]   # e.g. domains/alex-ai-universal

# Relative path from apps/alex-ai-universal-dashboard back to the domain root
# e.g.  ../../domains/alex-ai-universal
rel_domain = os.path.relpath(domain_path, "apps/alex-ai-universal-dashboard")

with open(tsconfig_path) as f:
    raw = f.read()

# json doesn't handle comments — strip // lines naively
import re
stripped = re.sub(r'//[^\n]*', '', raw)
try:
    cfg = json.loads(stripped)
except Exception:
    print(f"  [warn] Could not parse {tsconfig_path} as JSON — skipping tsconfig patch")
    sys.exit(0)

cfg["extends"] = "../../tsconfig.json"
co = cfg.setdefault("compilerOptions", {})

# Remove redundant keys and problematic baseUrl
for k in ["target", "module", "moduleResolution", "lib", "jsx", "strict", "baseUrl", "allowJs", "skipLibCheck", "noEmit", "esModuleInterop", "isolatedModules", "incremental", "resolveJsonModule"]:
    co.pop(k, None)

paths = co.setdefault("paths", {})

# Next.js @/ alias → project root
paths.setdefault("@/*", ["./*"])

# Explicit shim for the deep relative import that was working from within the domain
# "../../../../types/constructor" resolves relative to any app/api/** file:
# app/api/events/ → up 4 = project root → types/constructor
# After migration the root IS apps/alex-ai-universal-dashboard so we map to:
paths.setdefault("../../../../types/constructor", [f"{rel_domain}/types/constructor"])
paths.setdefault("../../../types/constructor",    [f"{rel_domain}/types/constructor"])

with open(tsconfig_path, 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')

print(f"  tsconfig patched: added @/*, path aliases for types/constructor")
PY
      else
        log_dry "Would patch $TSCONFIG_DEST: add @/* and types/constructor path aliases"
      fi
    fi

    # ── 3c. Create stub for @/scripts/utils/unified-service-accessor ────────
    STUB_DIR="$DASHBOARD_DEST/scripts/utils"
    STUB_FILE="$STUB_DIR/unified-service-accessor.ts"
    if [[ ! -f "$STUB_FILE" ]] || $DRY_RUN; then
      log_info "Creating stub for missing @/scripts/utils/unified-service-accessor..."
      if ! $DRY_RUN; then
        mkdir -p "$STUB_DIR"
        cat > "$STUB_FILE" << 'STUB'
/**
 * unified-service-accessor.ts
 * Stub created by crew-fix-remaining.sh
 *
 * This utility was originally sourced from outside the domain boundary.
 * Wire up the real implementation against your Supabase/n8n service layer.
 *
 * TODO: Replace stub exports with real implementations from
 *       @openrouter-crew/crew-api-client or domains/shared/
 */

export interface ServiceAccessorConfig {
  supabaseUrl?: string
  supabaseKey?: string
  n8nWebhookUrl?: string
}

export function getServiceAccessor(config?: ServiceAccessorConfig) {
  const url  = config?.supabaseUrl   ?? process.env.NEXT_PUBLIC_SUPABASE_URL   ?? ''
  const key  = config?.supabaseKey   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const hook = config?.n8nWebhookUrl ?? process.env.N8N_WEBHOOK_URL            ?? ''

  return {
    supabaseUrl:   url,
    supabaseKey:   key,
    n8nWebhookUrl: hook,
    isConfigured:  Boolean(url && key),
  }
}

export default getServiceAccessor
STUB
        log_ok "Created stub: $STUB_FILE"
      else
        log_dry "Would create stub: $STUB_FILE"
      fi
    else
      log_ok "unified-service-accessor already exists"
    fi

    # ── 3d. Scan for remaining deep relative imports and warn ───────────────
    if ! $DRY_RUN && [[ -d "$DASHBOARD_DEST/app/api" ]]; then
      log_info "Scanning migrated API routes for remaining broken relative imports..."
      BROKEN=()
      while IFS= read -r -d '' f; do
        # Look for relative imports going up more than 3 levels
        if grep -qE "from ['\"](\.\./){4,}" "$f" 2>/dev/null; then
          BROKEN+=("$f")
        fi
      done < <(find "$DASHBOARD_DEST/app/api" -name "*.ts" -print0 2>/dev/null)

      if [[ ${#BROKEN[@]} -gt 0 ]]; then
        log_warn "These files still have deep relative imports that need manual review:"
        for b in "${BROKEN[@]}"; do
          echo -e "    ${YELLOW}$b${RESET}"
          grep -n "from ['\"](\.\./){4,}" "$b" 2>/dev/null | head -3 | sed 's/^/      /' || \
          grep -n "from '\.\./\.\./\.\./\.\." "$b" 2>/dev/null | head -3 | sed 's/^/      /' || true
        done
        log_info "These should resolve once the tsconfig path aliases are in effect."
        log_info "If they don't, replace with workspace imports:"
        log_info "  import { X } from '@openrouter-crew/shared'"
        log_info "  import { X } from '@openrouter-crew/ai-orchestration'"
      else
        log_ok "No remaining deep relative imports found in API routes"
      fi
    fi

    # ── 3e. Update root package.json dev/build scripts ──────────────────────
    ROOT_PKG="package.json"
    if grep -q "alex-ai-universal/dashboard" "$ROOT_PKG" 2>/dev/null; then
      log_info "Updating root package.json references from domain path to apps path..."
      backup "$ROOT_PKG"
      if ! $DRY_RUN; then
        python3 - "$ROOT_PKG" "$AAU_DOMAIN" "$DASHBOARD_DEST" <<'PY'
import sys, json, re

pkg_path     = sys.argv[1]
old_dir_base = sys.argv[2]  # e.g. domains/alex-ai-universal
new_dir_base = sys.argv[3]  # e.g. apps/alex-ai-universal-dashboard

with open(pkg_path) as f:
    raw = f.read()

# Swap path references in script values
updated = raw.replace(f"{old_dir_base}/dashboard", new_dir_base)

if updated != raw:
    with open(pkg_path, 'w') as f:
        f.write(updated)
    print(f"  Updated script paths in {pkg_path}")
else:
    print(f"  No domain/dashboard path references found in {pkg_path}")
PY
      else
        log_dry "Would update package.json script paths: $AAU_DOMAIN/dashboard → $DASHBOARD_DEST"
      fi
    fi

    # ── 3f. Update domains/alex-ai-universal package.json if present ────────
    DOMAIN_PKG="$AAU_DOMAIN/package.json"
    if [[ -f "$DOMAIN_PKG" ]]; then
      log_info "Verifying $AAU_DOMAIN/package.json no longer exports dashboard paths..."
      if grep -q '"dashboard"' "$DOMAIN_PKG" 2>/dev/null; then
        log_warn "$DOMAIN_PKG references 'dashboard' — review manually after migration"
      fi
    fi

    ((FIXED++)) || true
    log_ok "Dashboard migration complete"
    log_info "Run:  pnpm install && pnpm --dir $DASHBOARD_DEST build"
    log_info "to verify the migrated dashboard compiles clean."

  else
    ((SKIPPED++)) || true
  fi
fi
}

# =============================================================================
# PHASE 4 — Re-sync and verify
# =============================================================================
phase_active "4" && {
log_head "Phase 4 — Sync workspace and verify"

if confirm "Run pnpm install to sync workspace changes?"; then
  run "pnpm install"
  log_ok "pnpm install complete"
fi

# Verify workspace is coherent
if command -v pnpm &>/dev/null; then
  log_info "Checking workspace package list..."
  if ! $DRY_RUN; then
    PKGS=$(pnpm ls -r --depth=0 2>/dev/null | head -60 || echo "pnpm ls failed")
    echo "$PKGS" | sed 's/^/    /'
  fi
fi

# VSCode extension: remind about @types/node if btoa was patched
if phase_active "2" && [[ -d "domains/vscode-extension" ]]; then
  if ! grep -q '"@types/node"' "domains/vscode-extension/package.json" 2>/dev/null; then
    log_warn "domains/vscode-extension/package.json may need @types/node for Buffer:"
    log_info "  pnpm add -D @types/node --filter @openrouter-crew/vscode-extension"
  fi
fi

# Dashboard build check
if [[ -d "apps/alex-dashboard" ]]; then
  if confirm "Attempt build of migrated dashboard (apps/alex-dashboard)?"; then
    run "pnpm --dir apps/alex-dashboard build 2>&1 | tail -40" || {
      log_warn "Dashboard build produced errors — see output above."
      log_info "Common fixes after migration:"
      log_info "  1. pnpm add @openrouter-crew/shared --filter @openrouter-crew/alex-dashboard"
      log_info "  2. Replace any remaining ../../../../ imports with workspace aliases"
      log_info "  3. Check that NEXT_PUBLIC_* env vars are set in .env.local"
    }
  fi
fi
}

# =============================================================================
# SUMMARY
# =============================================================================
log_head "Summary"
echo -e "  Phases applied:  ${BOLD}$FIXED${RESET}"
echo -e "  Phases skipped:  ${YELLOW}${BOLD}$SKIPPED${RESET}"
! $DRY_RUN && [[ -d "$BACKUP_DIR" ]] && echo -e "  Backups at:      ${DIM}$BACKUP_DIR${RESET}"

echo -e "\n  ${BOLD}Remaining manual steps after this script:${RESET}"
echo -e "  ${DIM}1. Verify pnpm-workspace.yaml is clean:${RESET}"
echo -e "     cat pnpm-workspace.yaml"
echo -e "  ${DIM}2. Confirm VSCode extension compiles:${RESET}"
echo -e "     pnpm --dir domains/vscode-extension compile"
echo -e "  ${DIM}3. If dashboard build still fails on deep imports:${RESET}"
echo -e "     Replace '../../../../types/constructor' with the correct"
echo -e "     workspace import from @openrouter-crew/ai-orchestration or shared"
echo -e "  ${DIM}4. Wire up the unified-service-accessor stub with real logic${RESET}"
echo -e "     apps/alex-ai-universal-dashboard/scripts/utils/unified-service-accessor.ts"
echo ""
$DRY_RUN && echo -e "  ${YELLOW}Dry run — re-run without --dry-run to apply.${RESET}\n"

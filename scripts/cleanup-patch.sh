#!/usr/bin/env bash
# =============================================================================
# cleanup-patch.sh — Finish the 4 remaining items from the initial cleanup
# Run from repo root: bash scripts/cleanup-patch.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
success() { echo -e "${GREEN}[DONE]${RESET}  $*"; }
step()    { echo -e "  ${DIM}▸${RESET} $*"; }

if [[ ! -f "pnpm-workspace.yaml" ]]; then
  echo -e "${RED}[ERR]${RESET} Must be run from the repository root."
  exit 1
fi

REPO_ROOT="$(pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="${REPO_ROOT}/_archive/${TIMESTAMP}"

echo ""
echo -e "${BOLD}${CYAN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${CYAN}│      OpenRouter Crew Platform — Cleanup Patch                │${RESET}"
echo -e "${BOLD}${CYAN}└──────────────────────────────────────────────────────────────┘${RESET}"
echo ""

# =============================================================================
# 1. .env.production — untrack from git + ensure .gitignore covers it
# =============================================================================
echo -e "${BOLD}${CYAN}══ Fix 1 — Untrack .env.production from git ══${RESET}"

GITIGNORE="${REPO_ROOT}/.gitignore"

# The existing .gitignore has .env.*.local but NOT .env.production — add it explicitly
if ! grep -qxF ".env.production" "$GITIGNORE" 2>/dev/null; then
  # Insert after the existing .env.production.local line if present, else append
  if grep -qF ".env.production.local" "$GITIGNORE"; then
    # Use a temp file to insert after that line (sed -i behaves differently on macOS)
    TMPFILE=$(mktemp)
    while IFS= read -r line; do
      echo "$line"
      if [[ "$line" == ".env.production.local" ]]; then
        echo ".env.production"
      fi
    done < "$GITIGNORE" > "$TMPFILE"
    mv "$TMPFILE" "$GITIGNORE"
    step "inserted .env.production into .gitignore after .env.production.local"
  else
    printf '\n.env.production\n' >> "$GITIGNORE"
    step "appended .env.production to .gitignore"
  fi
else
  step ".env.production already explicitly in .gitignore"
fi

# Untrack from git index (keeps file on disk)
if git ls-files --error-unmatch ".env.production" >/dev/null 2>&1; then
  git rm --cached .env.production
  step "removed .env.production from git index (file kept on disk)"
else
  step ".env.production not in git index — nothing to untrack"
fi

success ".env.production secured."

# =============================================================================
# 2. analyze-ci-failure.sh — move from root to scripts/debug/
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Fix 2 — Relocate analyze-ci-failure.sh to scripts/debug/ ══${RESET}"

SRC="${REPO_ROOT}/analyze-ci-failure.sh"
DEST_DIR="${REPO_ROOT}/scripts/debug"

if [[ -f "$SRC" ]]; then
  mkdir -p "$DEST_DIR"
  mv -- "$SRC" "${DEST_DIR}/analyze-ci-failure.sh"
  step "moved analyze-ci-failure.sh → scripts/debug/analyze-ci-failure.sh"
else
  step "analyze-ci-failure.sh not at root — already moved or missing"
fi

success "CI failure script relocated."

# =============================================================================
# 3. starfleet-delta 2.svg — delete (0-byte empty ghost file)
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Fix 3 — Remove empty starfleet-delta 2.svg ══${RESET}"

GHOST="${REPO_ROOT}/apps/unified-dashboard/public/starfleet-delta 2.svg"

if [[ -f "$GHOST" ]]; then
  size=$(wc -c < "$GHOST" | tr -d ' ')
  if [[ "$size" -eq 0 ]]; then
    rm -- "$GHOST"
    step "deleted 0-byte ghost: apps/unified-dashboard/public/starfleet-delta 2.svg"
  else
    step "file is non-empty (${size} bytes) — skipping for safety"
  fi
else
  step "file not found — already removed"
fi

success "Empty SVG ghost removed."

# =============================================================================
# 4. page 2.tsx — archive the legacy sprint page version
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Fix 4 — Archive legacy page 2.tsx ══${RESET}"

LEGACY="${REPO_ROOT}/domains/product-factory/dashboard/app/projects/[id]/sprints/page 2.tsx"

if [[ -f "$LEGACY" ]]; then
  mkdir -p "${ARCHIVE_DIR}/legacy-pages"
  cp -- "$LEGACY" "${ARCHIVE_DIR}/legacy-pages/sprints-page-v1.tsx"
  rm -- "$LEGACY"
  step "archived legacy sprints page → _archive/${TIMESTAMP}/legacy-pages/sprints-page-v1.tsx"
else
  step "page 2.tsx not found — already removed"
fi

success "Legacy page archived."

# =============================================================================
# COMMIT AND PUSH
# =============================================================================
echo -e "\n${BOLD}${CYAN}══ Commit and push ══${RESET}"

git add -A
git status --short

git commit -m "chore: apply remaining cleanup fixes

- Untrack .env.production from git index, add explicit entry to .gitignore
- Move analyze-ci-failure.sh from root to scripts/debug/
- Remove 0-byte starfleet-delta ghost SVG
- Archive legacy sprints page 2.tsx (pre-Next.js-15 sync params version)"

git push origin main

echo ""
echo -e "${BOLD}${GREEN}┌──────────────────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}${GREEN}│              Patch complete — pushed to GitHub ✓             │${RESET}"
echo -e "${BOLD}${GREEN}└──────────────────────────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  ${DIM}All automated cleanup items are now resolved.${RESET}"
echo -e "  ${DIM}Remaining manual items are documented in docs/CLEANUP_REPORT_*.md${RESET}"
echo ""

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

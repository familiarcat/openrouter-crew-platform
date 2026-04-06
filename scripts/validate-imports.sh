#!/bin/bash
# =============================================================================
# validate-imports.sh — OpenRouter Crew Platform
# Verifies that all relative imports (./ and ../) resolve to existing files.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${YELLOW}🔍 Starting relative import validation...${NC}"

errors=0
checked_files=0

# Find all TypeScript/React source files, excluding build artifacts and node_modules
while IFS= read -r -d '' file; do
    dir=$(dirname "$file")
    ((checked_files++))

    # Extract relative imports starting with . or .. using grep
    # This captures: import ... from './path' or import './path'
    imports=$(grep -E "from ['\"](\.\.?/.*)['\"]|import ['\"](\.\.?/.*)['\"]" "$file" | \
              sed -E "s/.*['\"](\.\.?\/[^'\"]+)['\"].*/\1/" | sort | uniq)

    for imp in $imports; do
        # Construct the target path relative to the current file's directory
        target="$dir/$imp"
        
        # Data's Heuristic: Strip .js/.jsx extensions to find TS source
        # ESM in Node often requires .js extensions even for TS files
        clean_target="${target%.js}"
        clean_target="${clean_target%.jsx}"

        # Check for various valid TypeScript resolutions
        found=false
        for ext in "" ".ts" ".tsx" ".d.ts" "/index.ts" "/index.tsx" ".js" ".jsx"; do
            if [[ -f "${target}${ext}" ]] || [[ -f "${clean_target}${ext}" ]]; then
                found=true
                break
            fi
        done

        if [[ "$found" == false ]]; then
            echo -e "${RED}❌ Broken import in ${file}:${NC}"
            echo -e "   Target: '${imp}' (Resolved to: ${target})"
            errors=$((errors + 1))
        fi
    done
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/_archive/*" \
    -not -path "*/.next/*" -print0)

echo -e "\n${YELLOW}------------------------------------------${NC}"
echo -e "Summary: Checked ${checked_files} files."
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All relative imports are valid.${NC}"
    exit 0
else
    echo -e "${RED}🚨 Found ${errors} invalid relative imports.${NC}"
    exit 1
fi
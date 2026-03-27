#!/bin/bash
# =============================================================================
# fix-relative-imports.sh — OpenRouter Crew Platform
# Replaces deep relative imports (../../../../) with workspace aliases.
# =============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}🔍 Scanning for deep relative imports in /apps...${NC}"

# Define target directories moved by the migration script
TARGET_APPS=(
    "apps/platform-admin"
    "apps/alex-ai-dashboard"
    "apps/product-factory-dashboard"
    "apps/generated"
)

# Mapping of relative paths to workspace aliases
# Using | as a delimiter for sed to avoid escaping slashes
declare -A MAPPINGS=(
    ["../../../../shared/schemas"]="@openrouter-crew/shared-schemas"
    ["../../../../shared/cost-tracking"]="@openrouter-crew/shared-cost-tracking"
    ["../../../../shared/crew-api-client"]="@openrouter-crew/crew-api-client"
    ["../../../../shared/ui-components"]="@openrouter-crew/shared-ui-components"
    ["../../../../shared/crew-coordination"]="@openrouter-crew/shared-crew-coordination"
    ["../../../../types/constructor"]="@openrouter-crew/shared-schemas"
    ["@/scripts/utils/unified-service-accessor"]="@openrouter-crew/crew-api-client"
)

for app in "${TARGET_APPS[@]}"; do
    if [ -d "$app" ]; then
        echo -e "📦 Processing App: ${YELLOW}$app${NC}"
        
        for rel_path in "${!MAPPINGS[@]}"; do
            alias="${MAPPINGS[$rel_path]}"
            
            # Find all .ts and .tsx files and apply replacement
            # Handles both 'path' and "path" import styles
            find "$app" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 sed -i '' "s|'$rel_path'|'$alias'|g"
            find "$app" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 sed -i '' "s|\"$rel_path\"|\"$alias\"|g"
        done
    fi
done

echo -e "\n${GREEN}✅ Import refactoring complete!${NC}"
echo -e "${BLUE}💡 Tip: Run 'pnpm build' to verify all path aliases resolve correctly.${NC}"

# Optional: Update tsconfigs to ensure baseUrl and paths are set
if [ -f "scripts/system/fix-ts-references.js" ]; then
    echo "Re-running TS reference fix..."
    node scripts/system/fix-ts-references.js
fi
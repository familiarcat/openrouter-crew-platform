#!/bin/bash
# =============================================================================
# migrate-dashboards-to-apps.sh — OpenRouter Crew Platform
# Automates the migration of deployable dashboards from /domains to /apps
# =============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}🚀 Starting Domain-to-App Migration...${NC}"

# 1. Create directory structure
mkdir -p apps/generated

# 2. Move Unified Dashboard to Platform Admin
if [ -d "apps/unified-dashboard" ]; then
    echo "📦 Migrating unified-dashboard -> apps/platform-admin"
    mv apps/unified-dashboard apps/platform-admin
    sed -i '' 's/"name": "@openrouter-crew\/unified-dashboard"/"name": "@openrouter-crew\/platform-admin"/' apps/platform-admin/package.json
fi

# 3. Extract Alex AI Universal Dashboard
if [ -d "domains/alex-ai-universal/dashboard" ]; then
    echo "📦 Extracting alex-ai dashboard -> apps/alex-ai-dashboard"
    mv domains/alex-ai-universal/dashboard apps/alex-ai-dashboard
    sed -i '' 's/"name": "@openrouter-crew\/alex-ai-universal-dashboard"/"name": "@openrouter-crew\/alex-ai-dashboard"/' apps/alex-ai-dashboard/package.json
fi

# 4. Extract Product Factory Dashboard
if [ -d "domains/product-factory/dashboard" ]; then
    echo "📦 Extracting product-factory dashboard -> apps/product-factory-dashboard"
    mv domains/product-factory/dashboard apps/product-factory-dashboard
    sed -i '' 's/"name": "@openrouter-crew\/product-factory-dashboard"/"name": "@openrouter-crew\/product-factory-dashboard"/' apps/product-factory-dashboard/package.json
fi

# 5. Move Generated/Test Project Dashboards
if [ -d "domains/product-factory/projects/test-event-venue/dashboard" ]; then
    echo "📦 Moving test-event-venue dashboard -> apps/generated/test-event-venue-dashboard"
    mv domains/product-factory/projects/test-event-venue/dashboard apps/generated/test-event-venue-dashboard
    sed -i '' 's/"name": "@test-event-venue\/test-event-venue-dashboard"/"name": "@openrouter-crew\/gen-test-event-venue"/' apps/generated/test-event-venue-dashboard/package.json
fi

# 6. Move Dj Booking Dashboard
if [ -d "domains/product-factory/project-templates/dj-booking/dashboard" ]; then
    echo "📦 Moving dj-booking dashboard -> apps/generated/dj-booking-dashboard"
    mv domains/product-factory/project-templates/dj-booking/dashboard apps/generated/dj-booking-dashboard
    sed -i '' 's/"name": "@openrouter-crew\/dj-booking-dashboard"/"name": "@openrouter-crew\/gen-dj-booking"/' apps/generated/dj-booking-dashboard/package.json
fi

# 7. Update root scripts to point to new platform-admin
echo -e "${YELLOW}Updating root package.json references...${NC}"
sed -i '' 's/apps\/unified-dashboard/apps\/platform-admin/g' package.json

# 8. Final Instructions
echo -e "\n${GREEN}✅ Migration of physical directories complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps Required:${NC}"
echo "1. Run 'pnpm install' to refresh workspace links."
echo "2. Run 'pnpm fix:tsconfig' to repair relative paths (depth changed from 3 to 2)."
echo "3. Use the 'fix-dashboard-build.md' protocol to replace relative imports with workspace links:"
echo "   Example: Replace ../../../../shared/ with @openrouter-crew/shared-*"
echo ""
echo -e "Physical Boundary Check:"
echo -e "  - ${BLUE}/apps${NC} now contains only deployable Next.js/CLI consumers."
echo -e "  - ${BLUE}/domains${NC} now contains only shared logic, schemas, and engines."
echo ""

# Optional: Trigger pnpm install
read -p "Run pnpm install now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm install
fi
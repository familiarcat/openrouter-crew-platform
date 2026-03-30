#!/bin/bash
# =============================================================================
# remediate-architecture.sh — OpenRouter Crew Platform
# PHASE 0: Architectural Remediation (DDD Layer Alignment)
# =============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}🚀 Starting Phase 0: Architectural Remediation...${NC}"

# Function to safely move and log
safe_move() {
    local src=$1
    local dest=$2
    if [ -d "$src" ]; then
        echo -e "📦 Moving ${YELLOW}$src${NC} -> ${GREEN}$dest${NC}"
        mkdir -p "$(dirname "$dest")"
        mv "$src" "$dest"
    else
        echo -e "ℹ️  Skipping $src (not found)"
    fi
}

# P0.1 & P0.4 — Relocate MCP Server (Before moving its parent dashboard)
echo -e "\n${BLUE}Step 1: Relocating MCP Server...${NC}"
safe_move "domains/product-factory/dashboard/lib/alex-ai/mcp" "domains/shared/agent-orchestration/mcp"

# P0.2 — Extract Application Dashboards
echo -e "\n${BLUE}Step 2: Extracting Application Dashboards...${NC}"
safe_move "domains/alex-ai-universal/dashboard" "apps/alex-dashboard"
safe_move "domains/product-factory/dashboard" "apps/product-factory-dashboard"
safe_move "domains/product-factory/project-templates/dj-booking/dashboard" "apps/dj-booking-dashboard"
safe_move "domains/product-factory/projects/test-event-venue/dashboard" "apps/test-event-venue-dashboard"

# P0.1 — Extract Agent Runners
echo -e "\n${BLUE}Step 3: Extracting Agent Runners to /agents...${NC}"
mkdir -p agents/dj-booking agents/test-event-venue

# Move DJ Booking Agents
for agent in booking-agent finance-agent gateway marketing-agent music-agent venue-agent; do
    safe_move "domains/product-factory/project-templates/dj-booking/agents/$agent" "agents/dj-booking/$agent"
done

# Move Test Event Venue Agents
for agent in booking-agent finance-agent gateway marketing-agent music-agent venue-agent; do
    safe_move "domains/product-factory/projects/test-event-venue/agents/$agent" "agents/test-event-venue/$agent"
done

# Special handling for Next.js apps inside agent folders (Layer Bleed)
safe_move "agents/dj-booking/rag-refresh" "apps/rag-refresh"
safe_move "agents/test-event-venue/rag-refresh" "apps/test-event-venue-rag"

# P0.3 — Extract Test Projects
echo -e "\n${BLUE}Step 4: Moving Test Projects to /apps...${NC}"
safe_move "domains/test-projects/baritalia-stl" "apps/baritalia-stl"

# P0.6 & P0.7 — Extract Marketing Funnel (Remediate Layer Bleeding)
echo -e "\n${BLUE}Step 5: Extracting Marketing Funnel to correct layers...${NC}"
mkdir -p apps/funnel-visualizer/components domains/marketing-funnel
safe_move "domains/shared/schemas/Funnel3D.tsx" "apps/funnel-visualizer/components/Funnel3D.tsx"
safe_move "domains/shared/schemas/DOMAIN.md" "domains/marketing-funnel/DOMAIN.md"
# Note: index.ts files and package.json are restored/created via build protocol

# Step 5: Update internal package names to reflect new layer identity
echo -e "\n${BLUE}Step 6: Updating package names in package.json...${NC}"

update_pkg_name() {
    local file=$1
    local old_name=$2
    local new_name=$3
    if [ -f "$file" ]; then
        sed -i '' "s/\"name\": \"$old_name\"/\"name\": \"$new_name\"/" "$file"
    fi
}

update_pkg_name "apps/alex-dashboard/package.json" "@openrouter-crew\/alex-ai-universal-dashboard" "@openrouter-crew\/alex-dashboard"
update_pkg_name "apps/baritalia-stl/package.json" "test-project-baritalia-stl" "@openrouter-crew\/app-baritalia-stl"
update_pkg_name "apps/baritalia-stl/website/package.json" "baritalia-website" "@openrouter-crew\/app-baritalia-website"

# Step 6: Regeneration and Orientation
echo -e "\n${BLUE}Step 6: Running Workspace Orient...${NC}"
pnpm install

echo -e "\n${GREEN}✅ Phase 0 Complete!${NC}"
echo -e "--------------------------------------------------"
echo -e "1. Run ${YELLOW}pnpm local:fix-imports${NC} to repair broken relative paths."
echo -e "2. Run ${YELLOW}pnpm build:all${NC} to verify the new architecture passes CI."
echo -e "3. Verify ${YELLOW}.ai-project-constitution.md${NC} is updated."
echo -e "--------------------------------------------------"

# P0.5 Human Gate
echo -e "${RED}[HUMAN GATE]${NC} Please review the directory structure and run 'pnpm build' before Phase 1."
read -p "Proceed with pnpm orientation? (y/N) " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] && pnpm orient || echo "Orientation skipped."
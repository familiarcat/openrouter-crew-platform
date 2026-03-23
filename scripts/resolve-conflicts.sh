#!/bin/bash

# ==============================================================================
# Resolve Workspace Conflicts
# Automatically removes known legacy directories that cause workspace collisions.
# Usage: ./scripts/resolve-conflicts.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔧 Checking for known workspace conflicts..."

# 1. Conflict: Legacy VSCode Extension in alex-ai-universal
# Phase 7 moved this to a top-level domain.
if [ -d "domains/alex-ai-universal/vscode-extension" ] && [ -d "domains/vscode-extension" ]; then
    echo -e "${YELLOW}⚠️  Found duplicate VSCode extension in legacy location.${NC}"
    echo "   Legacy: domains/alex-ai-universal/vscode-extension"
    echo "   New:    domains/vscode-extension"
    echo "   Action: Removing legacy directory..."
    rm -rf "domains/alex-ai-universal/vscode-extension"
    echo -e "${GREEN}✅ Removed legacy VSCode extension.${NC}"
else
    echo "✅ No legacy VSCode extension conflict found."
fi

# 2. Conflict: Misplaced package.json in .github/workflows
if [ -f ".github/workflows/package.json" ]; then
    echo -e "${YELLOW}⚠️  Found misplaced package.json in .github/workflows.${NC}"
    echo "   Action: Removing file..."
    rm ".github/workflows/package.json"
    echo -e "${GREEN}✅ Removed misplaced package.json.${NC}"
fi

# 3. Conflict: Duplicate package.json in 'Claude Codebase Analysis'
if [ -f "Claude Codebase Analysis/package.json" ]; then
    echo -e "${YELLOW}⚠️  Found duplicate package.json in 'Claude Codebase Analysis'.${NC}"
    echo "   Action: Removing file..."
    rm "Claude Codebase Analysis/package.json"
    echo -e "${GREEN}✅ Removed duplicate package.json.${NC}"
fi

# 4. Conflict: Name collision in test-event-venue agent
TEST_AGENT_PKG="domains/product-factory/projects/test-event-venue/agents/rag-refresh-product-factory/package.json"
if [ -f "$TEST_AGENT_PKG" ]; then
    if grep -q '"name": "rag-refresh-product-factory"' "$TEST_AGENT_PKG"; then
        echo -e "${YELLOW}⚠️  Found name collision in test-event-venue agent.${NC}"
        echo "   Action: Renaming package to @test-event-venue/rag-refresh-agent..."
        sed -i '' 's/"name": "rag-refresh-product-factory"/"name": "@test-event-venue\/rag-refresh-agent"/' "$TEST_AGENT_PKG"
        echo -e "${GREEN}✅ Renamed package.${NC}"
    fi
fi

# Refresh lockfile to reflect removals
echo ""
echo "📦 Refreshing lockfile..."
pnpm install

echo -e "${GREEN}✨ Conflict resolution complete. You can now build.${NC}"
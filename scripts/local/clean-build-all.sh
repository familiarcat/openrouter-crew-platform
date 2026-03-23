#!/bin/bash

# ==============================================================================
# Clean & Rebuild Script
#
# Wipes all dependencies, lockfiles, and build artifacts across the monorepo,
# then performs a fresh install and build.
#
# Usage: ./scripts/clean-build-all.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Starting deep clean of monorepo...${NC}"

# 1. Clean root
echo -e "${YELLOW}Removing root dependencies and lockfiles...${NC}"
rm -rf node_modules pnpm-lock.yaml package-lock.json

# 2. Clean workspaces (nested)
echo -e "${YELLOW}Removing nested node_modules and artifacts (dist, .next, .turbo)...${NC}"
# Use find to locate and delete directories, preventing descent into deleted dirs with -prune
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
find . -name "coverage" -type d -prune -exec rm -rf '{}' +

# 3. Install
echo -e "${BLUE}📦 Installing dependencies with pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing via npm..."
    npm install -g pnpm
fi

pnpm install

# 4. Build
echo -e "${BLUE}🚀 Building all packages...${NC}"
chmod +x ./scripts/build.sh
./scripts/build.sh all

echo -e "${GREEN}✨ Clean rebuild complete!${NC}"
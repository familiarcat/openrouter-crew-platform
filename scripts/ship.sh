#!/bin/bash

# ==============================================================================
# 🚢 SHIP IT: Unified Release Script
# Encapsulates the Development -> CI/CD pipeline.
# Usage: pnpm ship [production|staging]
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=${1:-production}
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo -e "${BLUE}🚀 Starting Release Process for ${YELLOW}${ENVIRONMENT}${NC}"

# 1. Local Validation
echo -e "\n${BLUE}1️⃣  Running Local Validation...${NC}"

echo "   Running Type Checks..."
if ! pnpm type-check; then
    echo -e "${RED}❌ Type check failed. Fix errors before shipping.${NC}"
    exit 1
fi

echo "   Running Linter..."
if ! pnpm lint; then
    echo -e "${YELLOW}⚠️  Linting issues found (proceeding anyway).${NC}"
fi

# 2. Git Synchronization
echo -e "\n${BLUE}2️⃣  Synchronizing with Remote...${NC}"

if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected.${NC}"
    git status --short
    echo ""
    read -p "   Commit and push these changes? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        git push origin "$BRANCH"
        echo -e "${GREEN}✅ Changes pushed.${NC}"
    else
        echo -e "${RED}❌ Cannot ship with uncommitted changes.${NC}"
        exit 1
    fi
else
    # Check if we need to push committed changes
    if [[ $(git @{u}.. 2> /dev/null) ]]; then
        echo "   Pushing local commits..."
        git push origin "$BRANCH"
        echo -e "${GREEN}✅ Pushed to remote.${NC}"
    else
        echo -e "${GREEN}✅ Git is clean and synced.${NC}"
    fi
fi

# 3. Trigger Remote Deployment
echo -e "\n${BLUE}3️⃣  Triggering CI/CD Pipeline...${NC}"

# Delegate to the existing trigger script
bash scripts/deploy/trigger-gh-deploy.sh "$ENVIRONMENT"
#!/bin/bash

# ==============================================================================
# Remote Deployment Trigger
# Triggers the GitHub Actions CI/CD pipeline from the local CLI.
# Usage: ./scripts/trigger-gh-deploy.sh [environment]
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=${1:-production}
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo -e "${BLUE}🚀 Initializing Remote Deployment via GitHub Actions${NC}"
echo "   Environment: $ENVIRONMENT"
echo "   Branch:      $BRANCH"

# Check dependencies
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found.${NC}"
    echo "   Please install: brew install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged into GitHub CLI.${NC}"
    echo "   Please run: gh auth login"
    exit 1
fi

# Confirm action
echo -e "\n⚠️  This will trigger a deployment to ${RED}$ENVIRONMENT${NC} using the remote CI/CD pipeline."
read -p "   Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${BLUE}📨 Sending workflow dispatch event...${NC}"

if gh workflow run deploy.yml --ref "$BRANCH" -f environment="$ENVIRONMENT" -f reason="CLI Trigger: $(whoami)"; then
    echo -e "${GREEN}✅ Workflow triggered successfully!${NC}"
    
    echo -e "\n${BLUE}👀 Waiting for workflow to start...${NC}"
    sleep 5
    
    RUN_ID=$(gh run list --workflow=deploy.yml --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId')
    echo -e "   Tracking Run ID: ${BLUE}${RUN_ID}${NC}"
    echo -e "   View Logs:       ${BLUE}https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/${RUN_ID}${NC}"

    if gh run watch "$RUN_ID"; then
        echo -e "\n${GREEN}✅ Remote deployment completed successfully!${NC}"
    else
        echo -e "\n${RED}❌ Remote deployment failed.${NC}"
        echo -e "${YELLOW}Fetching failure logs...${NC}"
        gh run view "$RUN_ID" --log
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to trigger workflow.${NC}"
    exit 1
fi
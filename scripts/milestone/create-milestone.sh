#!/usr/bin/env bash
#
# Milestone Creation Script
#
# Creates a new milestone branch for independent feature development
# following GitFlow principles.
#
# Usage: pnpm milestone:create "feature-name"
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
  echo -e "${RED}❌ Usage: pnpm milestone:create \"feature-name\"${NC}"
  exit 1
fi

FEATURE_NAME=$1

# Generate git-safe name (lowercase, alphanumeric, hyphens)
SAFE_NAME=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="milestone/${SAFE_NAME}-${TIMESTAMP}"

# Capture summary of changes before stashing
CHANGES_STAT=$(git diff --stat 2>/dev/null || echo "")
CHANGES_STATUS=$(git status --short 2>/dev/null || echo "")

echo -e "${GREEN}🎯 Creating milestone branch...${NC}"

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Check for uncommitted changes
STASHED=0
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
  echo -e "${YELLOW}   Stashing changes...${NC}"
  git stash push -m "Auto-stash before milestone: $FEATURE_NAME"
  STASHED=1
fi

# Create and checkout new branch
echo -e "${YELLOW}📝 Creating branch: $BRANCH_NAME${NC}"
git checkout -b "$BRANCH_NAME"

# Restore stashed changes if any
if [ "$STASHED" -eq 1 ]; then
  echo -e "${YELLOW}♻️  Restoring stashed changes to new branch...${NC}"
  git stash pop --quiet || echo -e "${RED}⚠️  Conflict during stash pop. Please resolve manually.${NC}"
fi

# Create milestone marker file
MILESTONE_DIR=".milestones"
mkdir -p "$MILESTONE_DIR"
MILESTONE_FILE="$MILESTONE_DIR/${SAFE_NAME}-${TIMESTAMP}.md"

echo -e "${YELLOW}🤖 Consulting Crew (Commander Data) for documentation...${NC}"

# Export variables for the crew generation script
export FEATURE_NAME
export BRANCH_NAME
export CHANGES_STATUS
export CHANGES_STAT

# Generate content (uses n8n crew if available, falls back to template)
node scripts/milestone/generate-milestone-content.js > "$MILESTONE_FILE"

git add "$MILESTONE_FILE"
git commit -m "milestone: create ${SAFE_NAME} - ${TIMESTAMP}"

echo -e "\n${GREEN}✅ Milestone branch created successfully!${NC}"
echo -e "${YELLOW}📋 Branch: $BRANCH_NAME${NC}"
echo -e "${YELLOW}📝 Milestone file: $MILESTONE_FILE${NC}"
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Edit $MILESTONE_FILE to document your goals"
echo -e "   2. Make your changes"
echo -e "   3. Commit frequently: git commit -m \"feat: your change\""
echo -e "   4. Push milestone: pnpm milestone:push"
echo -e "   5. When complete, merge to main"

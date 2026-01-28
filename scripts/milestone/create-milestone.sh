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
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="milestone/${FEATURE_NAME}-${TIMESTAMP}"

echo -e "${GREEN}🎯 Creating milestone branch...${NC}"

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
  echo -e "${YELLOW}   Stashing changes...${NC}"
  git stash push -m "Auto-stash before milestone: $FEATURE_NAME"
fi

# Create and checkout new branch
echo -e "${YELLOW}📝 Creating branch: $BRANCH_NAME${NC}"
git checkout -b "$BRANCH_NAME"

# Create milestone marker file
MILESTONE_DIR=".milestones"
mkdir -p "$MILESTONE_DIR"
MILESTONE_FILE="$MILESTONE_DIR/${FEATURE_NAME}-${TIMESTAMP}.md"

cat > "$MILESTONE_FILE" << EOF
# Milestone: $FEATURE_NAME

**Created:** $(date)
**Branch:** $BRANCH_NAME
**Status:** In Progress

## Description

[Add description of what this milestone aims to achieve]

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes

[Add any relevant notes or context]

## Integration Points

### Affected Projects
- [ ] unified-dashboard
- [ ] dj-booking
- [ ] product-factory
- [ ] cli

### Affected Packages
- [ ] crew-core
- [ ] cost-tracking
- [ ] shared-schemas
- [ ] n8n-workflows

### Database Changes
- [ ] Schema migration required
- [ ] Seed data required

### n8n Workflows
- [ ] New workflows
- [ ] Modified workflows

## Completion Checklist

- [ ] All tasks completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Schema migrations applied
- [ ] n8n workflows synced
- [ ] Ready to merge to main
EOF

git add "$MILESTONE_FILE"
git commit -m "milestone: create ${FEATURE_NAME} - ${TIMESTAMP}"

echo -e "\n${GREEN}✅ Milestone branch created successfully!${NC}"
echo -e "${YELLOW}📋 Branch: $BRANCH_NAME${NC}"
echo -e "${YELLOW}📝 Milestone file: $MILESTONE_FILE${NC}"
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Edit $MILESTONE_FILE to document your goals"
echo -e "   2. Make your changes"
echo -e "   3. Commit frequently: git commit -m \"feat: your change\""
echo -e "   4. Push milestone: pnpm milestone:push"
echo -e "   5. When complete, merge to main"

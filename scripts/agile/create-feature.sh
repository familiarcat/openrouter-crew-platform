#!/usr/bin/env bash
#
# Agile Feature Creator
#
# Creates a feature branch within a story, following the hierarchy:
# Project -> Sprint -> Story -> Feature
#
# Usage: pnpm feature:create "feature-name"
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$1" ]; then
  echo -e "${RED}❌ Usage: pnpm feature:create \"feature-name\"${NC}"
  exit 1
fi

FEATURE_NAME=$1

# 1. Validate current branch is a story branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" =~ ^story/ ]]; then
  echo -e "${RED}❌ Not on a story branch.${NC}"
  echo -e "${YELLOW}   A 'feature' must be created from within a 'story' branch.${NC}"
  echo -e "${YELLOW}   Current branch: $CURRENT_BRANCH${NC}"
  echo -e "${YELLOW}   Run 'pnpm story:create' first.${NC}"
  exit 1
fi

# 2. Extract hierarchy from story branch name
# e.g., story/product-factory/2026-w05/add-kanban-board
IFS='/' read -r _ PROJECT SPRINT STORY_NAME <<< "$CURRENT_BRANCH"

# 3. Generate safe names and new branch name
SAFE_FEATURE_NAME=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
BRANCH_NAME="feature/${PROJECT}/${SPRINT}/${STORY_NAME}/${SAFE_FEATURE_NAME}"

echo -e "${CYAN}🌿 Creating feature branch: $BRANCH_NAME${NC}"

# 4. Stash changes if necessary
STASHED=0
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected. Stashing...${NC}"
  git stash push -m "Auto-stash before feature: $SAFE_FEATURE_NAME"
  STASHED=1
fi

# 5. Create branch from current story branch
git checkout -b "$BRANCH_NAME"

# 6. Restore stashed changes
if [ "$STASHED" -eq 1 ]; then
  echo -e "${YELLOW}♻️  Restoring stashed changes...${NC}"
  git stash pop --quiet || echo -e "${RED}⚠️  Conflict during stash pop.${NC}"
fi

# 7. Create documentation file
DOCS_DIR=".agile/features/${PROJECT}/${SPRINT}/${STORY_NAME}"
mkdir -p "$DOCS_DIR"
DOC_FILE="$DOCS_DIR/${SAFE_FEATURE_NAME}.md"

echo -e "${YELLOW}🤖 Consulting Crew for feature documentation...${NC}"

export FEATURE_NAME
export BRANCH_NAME
export STORY_CONTEXT="$STORY_NAME"
export SPRINT_CONTEXT="$SPRINT"
export PROJECT_CONTEXT="$PROJECT"

# Using a new content generator for features
node scripts/agile/generate-feature-content.js > "$DOC_FILE"

git add "$DOC_FILE"
git commit -m "feat($PROJECT): begin feature '$SAFE_FEATURE_NAME' for story '$STORY_NAME'"

echo -e "\n${GREEN}✅ Feature branch created successfully!${NC}"
echo -e "   Branch: $BRANCH_NAME"
echo -e "   Docs:   $DOC_FILE"
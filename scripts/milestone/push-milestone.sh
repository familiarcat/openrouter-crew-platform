#!/usr/bin/env bash
#
# Milestone Push Script
#
# Pushes current milestone branch to remote repository
#
# Usage: pnpm milestone:push
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Pushing milestone branch...${NC}"

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on a milestone branch
if [[ ! "$CURRENT_BRANCH" =~ ^milestone/ ]]; then
  echo -e "${RED}❌ Not on a milestone branch${NC}"
  echo -e "${YELLOW}   Current branch: $CURRENT_BRANCH${NC}"
  echo -e "${YELLOW}   Create a milestone branch with: pnpm milestone:create \"feature-name\"${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
  echo -e "${YELLOW}   Would you like to commit them? (y/n)${NC}"
  read -r response
  if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    echo -e "${YELLOW}📝 Enter commit message:${NC}"
    read -r commit_msg
    git add -A
    git commit -m "$commit_msg"
  else
    echo -e "${RED}❌ Aborting push due to uncommitted changes${NC}"
    exit 1
  fi
fi

# Push to remote
echo -e "${YELLOW}📤 Pushing $CURRENT_BRANCH to remote...${NC}"

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
  echo -e "${RED}❌ No remote repository configured${NC}"
  echo -e "${YELLOW}   Would you like to configure the remote now? (y/n)${NC}"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    node scripts/git/setup-remote.js
    if ! git remote get-url origin >/dev/null 2>&1; then
      echo -e "${RED}❌ Remote configuration failed or cancelled.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}   Add remote with: git remote add origin <repo-url>${NC}"
    exit 1
  fi
fi

# Push with upstream tracking
git push -u origin "$CURRENT_BRANCH"

echo -e "\n${GREEN}✅ Milestone pushed successfully!${NC}"
echo -e "${YELLOW}📋 Branch: $CURRENT_BRANCH${NC}"
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "   • Continue development and push changes regularly"
echo -e "   • When ready, create a pull request to merge into main"
echo -e "   • Or merge locally: git checkout main && git merge $CURRENT_BRANCH"

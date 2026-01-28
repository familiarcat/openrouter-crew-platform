#!/usr/bin/env bash
#
# Git Remote Setup Script
#
# Helps configure git remote and push to new repository
#
# Usage: bash scripts/git-setup-remote.sh <repo-url>
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
  echo -e "${RED}❌ Usage: bash scripts/git-setup-remote.sh <repo-url>${NC}"
  echo -e "${YELLOW}   Example: bash scripts/git-setup-remote.sh https://github.com/username/openrouter-crew-platform.git${NC}"
  exit 1
fi

REPO_URL=$1

echo -e "${GREEN}🚀 Setting up Git remote repository...${NC}"
echo -e "${YELLOW}Repository URL: $REPO_URL${NC}\n"

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
  EXISTING_REMOTE=$(git remote get-url origin)
  echo -e "${YELLOW}⚠️  Remote 'origin' already exists: $EXISTING_REMOTE${NC}"
  echo -e "${YELLOW}   Do you want to replace it? (y/n)${NC}"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
  fi
  git remote remove origin
  echo -e "${GREEN}✅ Removed existing remote${NC}"
fi

# Add new remote
echo -e "${YELLOW}📡 Adding remote 'origin'...${NC}"
git remote add origin "$REPO_URL"

# Verify remote
REMOTE_URL=$(git remote get-url origin)
echo -e "${GREEN}✅ Remote added: $REMOTE_URL${NC}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📋 Current branch: $CURRENT_BRANCH${NC}"

# Push to remote
echo -e "\n${YELLOW}Ready to push to remote?${NC}"
echo -e "${YELLOW}This will push branch '$CURRENT_BRANCH' to '$REPO_URL'${NC}"
echo -e "${YELLOW}Continue? (y/n)${NC}"
read -r response

if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
  echo -e "${YELLOW}ℹ️  Remote configured but not pushed${NC}"
  echo -e "${YELLOW}   Push manually with: git push -u origin $CURRENT_BRANCH${NC}"
  exit 0
fi

# Push to remote with upstream tracking
echo -e "${YELLOW}📤 Pushing to remote...${NC}"
git push -u origin "$CURRENT_BRANCH"

echo -e "\n${GREEN}✅ Success! Repository pushed to remote${NC}"
echo -e "${YELLOW}📋 Repository: $REPO_URL${NC}"
echo -e "${YELLOW}📋 Branch: $CURRENT_BRANCH${NC}"

echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "   • Configure GitHub repository settings"
echo -e "   • Add collaborators if needed"
echo -e "   • Set up branch protection rules"
echo -e "   • Configure GitHub Actions secrets for CI/CD"

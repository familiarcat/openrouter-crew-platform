#!/usr/bin/env bash
#
# Agile Feature Pusher
#
# Pushes the current feature branch to remote.
# Usage: pnpm feature:push
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CURRENT_BRANCH=$(git branch --show-current)

if [[ ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
  echo -e "${RED}❌ Not on a feature branch.${NC}"
  exit 1
fi

echo -e "${GREEN}🚀 Pushing feature branch: $CURRENT_BRANCH${NC}"
git push -u origin "$CURRENT_BRANCH"
echo -e "\n${GREEN}✅ Feature pushed successfully!${NC}"
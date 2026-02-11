#!/bin/bash

# Push milestone changes
# Usage: pnpm milestone:push

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Push Milestone ===${NC}"

# Check if there are changes in milestones directory
if [[ -z $(git status -s milestones/) ]]; then
    echo "No changes detected in milestones/ directory."
    exit 0
fi

git add milestones/
read -p "Enter commit message for milestone update: " MSG
git commit -m "docs(milestone): $MSG"
git push

echo -e "${GREEN}✅ Milestones pushed!${NC}"
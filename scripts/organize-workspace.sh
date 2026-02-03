#!/usr/bin/env bash
#
# Workspace Organizer
# Moves scripts to their canonical locations and cleans up root clutter.
# Usage: pnpm organize
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🧹 Organizing workspace scripts...${NC}"

# Ensure directories exist
mkdir -p scripts/agile
mkdir -p scripts/git

# Helper: Move file if source exists
move_if_exists() {
    if [ -f "$1" ]; then
        echo -e "${YELLOW}Moving $1 -> $2${NC}"
        mv "$1" "$2"
        # Make shell scripts executable
        if [[ "$2" == *.sh ]]; then
            chmod +x "$2"
        fi
    fi
}

# 1. Agile Scripts (from root to scripts/agile)
move_if_exists "create-story.sh" "scripts/agile/create-story.sh"
move_if_exists "push-story.sh" "scripts/agile/push-story.sh"
move_if_exists "generate-content.js" "scripts/agile/generate-content.js"

# 2. Cleanup Duplicates
if [ -f "verify-git-status.sh" ] && [ -f "scripts/git/verify-git-status.sh" ]; then
    echo -e "${YELLOW}Removing duplicate verify-git-status.sh from root${NC}"
    rm verify-git-status.sh
fi

if [ -f "domains/alex-ai-universal/dashboard/lib/verify-git-status.sh" ]; then
    echo -e "${YELLOW}Removing misplaced verify-git-status.sh from dashboard lib${NC}"
    rm "domains/alex-ai-universal/dashboard/lib/verify-git-status.sh"
fi

echo -e "${GREEN}✅ Workspace organized.${NC}"
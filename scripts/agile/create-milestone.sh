#!/bin/bash

# Create a new milestone document
# Usage: pnpm milestone:create

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Create New Milestone ===${NC}"

# Ensure milestones directory exists
mkdir -p milestones

read -p "Milestone Name (e.g., Phase 9 Security): " NAME
if [ -z "$NAME" ]; then
    echo "Name is required."
    exit 1
fi

read -p "Target Date (YYYY-MM-DD): " DATE
read -p "Owner (e.g., Chief O'Brien): " OWNER

# Create slug
SLUG=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
FILENAME="milestones/${SLUG}.md"

if [ -f "$FILENAME" ]; then
    echo "Milestone file already exists: $FILENAME"
    exit 1
fi

cat > "$FILENAME" << EOF
# Milestone: $NAME

**Target Date**: $DATE
**Owner**: ${OWNER:-Unassigned}
**Status**: Planning

## Overview
High-level summary of the milestone objectives.

## Goals
- [ ] Goal 1
- [ ] Goal 2

## Deliverables
- [ ] Deliverable 1

## Timeline
- Week 1: Setup
- Week 2: Implementation
- Week 3: Testing

## Risks
- Risk 1
EOF

echo -e "${GREEN}✅ Milestone created at $FILENAME${NC}"
echo -e "To edit: code $FILENAME"
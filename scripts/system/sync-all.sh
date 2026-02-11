#!/bin/bash

# Unified Sync Script for OpenRouter Crew Platform
# Synchronizes state between Local (Git/Files) and Remote (Supabase/n8n)
# Usage: ./sync-all.sh [env] [direction]
#   env:       local (default) | prod
#   direction: push (default) | pull

set -e

# Configuration
ENV=${1:-local}
DIRECTION=${2:-push}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== OpenRouter Crew Platform: Unified Sync ===${NC}"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Direction:   ${YELLOW}$DIRECTION${NC} (Code <-> Infra)"

# Ensure secrets are loaded
if [ -f "scripts/secrets/sync-from-zshrc.sh" ]; then
    source scripts/secrets/sync-from-zshrc.sh > /dev/null 2>&1
fi

if [ "$DIRECTION" == "push" ]; then
    echo -e "\n${BLUE}[1/3] Syncing Supabase Schema (Push)...${NC}"
    if [ "$ENV" == "prod" ]; then
        # For prod, we push migrations
        npx supabase db push
    else
        # For local, we reset to ensure clean state matches migrations
        npx supabase db reset
    fi

    echo -e "\n${BLUE}[2/3] Syncing n8n Workflows (Push)...${NC}"
    # Push local JSON files to n8n instance
    if [ "$ENV" == "prod" ]; then
        node scripts/n8n/sync-workflows.js --prod --push
    else
        node scripts/n8n/sync-workflows.js --local --push
    fi

    echo -e "\n${BLUE}[3/3] Generating Types...${NC}"
    bash scripts/supabase/generate-types.sh

elif [ "$DIRECTION" == "pull" ]; then
    echo -e "\n${BLUE}[1/2] Syncing n8n Workflows (Pull)...${NC}"
    # Pull active workflows from n8n instance to local JSON
    if [ "$ENV" == "prod" ]; then
        node scripts/n8n/sync-workflows.js --prod --pull
    else
        node scripts/n8n/sync-workflows.js --local --pull
    fi

    echo -e "\n${BLUE}[2/2] Generating Types from DB...${NC}"
    # We don't pull schema (migrations are source of truth), but we regen types
    bash scripts/supabase/generate-types.sh
fi

echo -e "\n${GREEN}✅ Sync Complete!${NC}"
if [ "$DIRECTION" == "pull" ]; then
    echo -e "Review changes in 'packages/n8n-workflows' and 'packages/shared-schemas' before committing."
fi
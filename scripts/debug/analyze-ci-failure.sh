#!/bin/bash

# ==============================================================================
# CI Failure Analyzer
# Fetches and displays logs for the most recent failed GitHub Actions run.
# Usage: ./scripts/debug/analyze-ci-failure.sh [run_id]
# ==============================================================================

set -e

BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

RUN_ID=$1

if [ -z "$RUN_ID" ]; then
    echo "🔍 Finding last failed run for deploy.yml..."
    RUN_ID=$(gh run list --workflow=deploy.yml --status=failure --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$RUN_ID" ]; then
        echo "✅ No failed runs found."
        exit 0
    fi
fi

echo -e "${BLUE}📋 Analyzing Run ID: ${RUN_ID}${NC}"
echo -e "${BLUE}🔗 Link: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/${RUN_ID}${NC}"
echo ""
echo "---------------------------------------------------"

# Fetch failed logs
gh run view "$RUN_ID" --log-failed
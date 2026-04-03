#!/bin/bash
# Weekly Codebase Analysis Automation
# Purpose: Scans monorepo, generates metrics, and updates dashboard for review.

set -e

echo "🔍 Starting Weekly Codebase Analysis..."

# 1. Run the analyzer
pnpm --filter @openrouter-crew/codebase-analyzer analyze

# 2. Build the interactive dashboard
pnpm --filter @openrouter-crew/codebase-analyzer build:dashboard

# 3. Extract key metrics for Git status
TOTAL_FILES=$(jq '.totalFiles' codebase-analyzer/codebase.json)
LOC=$(jq '.totalLines' codebase-analyzer/codebase.json)

echo "📊 Analysis Complete:"
echo "- Total Files: $TOTAL_FILES"
echo "- Lines of Code: $LOC"
echo "- Dashboard: codebase-analyzer/output/index.html"

exit 0
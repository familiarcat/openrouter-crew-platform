#!/bin/bash
# OpenRouter Crew Platform - Monitoring Artifacts Cleanup
# Removes files incorrectly placed at the root that now reside in apps/unified-dashboard/

set -e

echo "🧹 Cleaning up misplaced monitoring files from repository root..."

FILES=(
  "page.tsx"
  "route.ts"
  "AlarmStatusGrid.tsx"
)

for file in "${FILES[@]}"; do
  [ -f "$file" ] && rm "$file" && echo "✅ Removed root-level: $file" || echo "ℹ️  $file not found at root (already clean)."
done

echo "✨ Workspace is now tidy and follows DDD boundaries."
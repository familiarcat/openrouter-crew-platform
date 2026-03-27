#!/usr/bin/env bash
# Main Entry: Autonomous Code Change & AI Execution
set -euo pipefail

TASK=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting AI Orchestration: $TASK"

# Step 1: Analyze
bash "$SCRIPT_DIR/phase-1-analyze.sh" "$TASK"

# Step 2: Plan
bash "$SCRIPT_DIR/phase-2-plan.sh"

# Step 3: Execute (User Review)
echo "--------------------------------------------------"
echo "PROPOSED CHANGES:"
cat .ai_execution_plan.diff | grep "+++"
echo "--------------------------------------------------"
read -p "Apply changes using git apply? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Safety: Apply diff directly (avoids terminal-manager hallucinations)
    git apply .ai_execution_plan.diff || echo "Warning: Diff applied with offsets or failed. Manual review required."
fi

# Step 4: Verify (Dark Forest Protocol)
echo "🔍 Verifying Build Integrity..."
pnpm --filter "...{$(jq -r '.files[]' .ai_target_files.json | paste -sd "," -)}" build

echo "✅ AI Task Complete."

# Cleanup
rm .ai_task_context.xml .ai_target_files.json .ai_planning_prompt.xml .ai_execution_plan.diff
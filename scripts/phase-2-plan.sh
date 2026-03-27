#!/usr/bin/env bash
# Phase 2: Generate the multi-file execution plan
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_FILES=$(cat .ai_target_files.json)

cat <<EOF > .ai_planning_prompt.xml
<philosophy>Three-Body Philosophy & Dark Forest Protocol</philosophy>
<targets>
$TARGET_FILES
</targets>
<instruction>
Provide a unified diff for the requested changes. 
Ensure absolute paths are used. 
Include an <explanation> tag for the rationale.
</instruction>
EOF

echo "Requesting Execution Plan from Claude 3.5 Sonnet..."
bash "$SCRIPT_DIR/llm-bridge.sh" .ai_planning_prompt.xml "anthropic/claude-3.5-sonnet" > .ai_execution_plan.diff
echo "Plan generated in .ai_execution_plan.diff"
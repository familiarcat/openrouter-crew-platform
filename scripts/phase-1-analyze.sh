#!/usr/bin/env bash
# Phase 1: Analyze local context and create task-specific prompt
set -euo pipefail

TASK_DESCRIPTION=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANALYSIS_FILE="$SCRIPT_DIR/../apps/codebase-analyzer/codebase-metrics.txt"

echo "Generating High-Fidelity Analysis Prompt..."

cat <<EOF > .ai_task_context.xml
<system_role>Expert DDD Software Architect (2026 Standards)</system_role>
<context>
$(cat "$ANALYSIS_FILE")
</context>
<task>
$TASK_DESCRIPTION
</task>
<constraints>
Follow Dark Forest Protocol: Verify then Trust.
Prioritize cost-effective model routing (Gemini for simple, Claude for complex).
</constraints>
<instruction>Generate a JSON object with a 'files' key containing an array of absolute file paths that need modification.</instruction>
EOF

bash "$SCRIPT_DIR/llm-bridge.sh" .ai_task_context.xml "google/gemini-flash-1.5" > .ai_target_files.json
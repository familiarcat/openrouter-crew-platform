#!/usr/bin/env bash
# Bridge between Shell and OpenRouter using 2026 Prompt Standards
set -euo pipefail

PROMPT_FILE=$1
MODEL=${2:-"anthropic/claude-3.5-sonnet"}

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
    source ~/.zshrc
fi

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
    echo "Error: OPENROUTER_API_KEY not found in environment or ~/.zshrc"
    exit 1
fi

payload=$(jq -n \
    --arg model "$MODEL" \
    --arg prompt "$(cat "$PROMPT_FILE")" \
    '{
        "model": $model,
        "messages": [{"role": "user", "content": $prompt}],
        "temperature": 0.3
    }')

response=$(curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d "$payload")

echo "$response" | jq -r '.choices[0].message.content'
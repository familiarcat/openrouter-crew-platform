#!/bin/sh
# start-all-agents.sh
# Starts all 10 crew MCP agent servers as background processes inside the crew container.
# Uses POSIX sh for Alpine Linux compatibility.

set -e

RUNNER="/app/domains/shared/agent-orchestration/dist/mcp/mcp-runner.js"

if [ ! -f "$RUNNER" ]; then
  echo "❌ mcp-runner.js not found at $RUNNER — was the agent-orchestration package built?"
  exit 1
fi

AGENTS="captain_picard commander_data worf geordi_la_forge crusher counselor_troi quark commander_riker chief_obrien uhura"

echo "🖖 Bringing crew agents online..."
for agent in $AGENTS; do
  node "$RUNNER" "$agent" &
  echo "   📡 $agent (PID $!)"
done

echo "✅ All 10 crew agents started. Monitoring processes..."

# Wait for all background jobs. If any agent exits unexpectedly, log it.
wait
echo "⚠️  All crew agent processes have exited."

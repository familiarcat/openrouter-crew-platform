#!/usr/bin/env bash
# ============================================================
#  Admiral Review Sequence
#  Automates the local testing format for full system review.
# ============================================================

set -e

# UI Colors
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo "🖖 Admiral, initiating full system review sequence..."

# 0. Pre-flight Cleanup
echo "🧹 Clearing port obstructions and stale containers..."
pnpm local:infra:clean || true

# 1. Infrastructure Check
echo "📡 Checking engine room (Docker)..."
pnpm local:infra:up

# 1.5. Wait for Infrastructure Health
echo -n "⏳ Waiting for services to reach healthy state"
for i in {1..30}; do
  # Get status of all openrouter- containers
  CONTAINER_STATUSES=$(docker ps --filter "name=openrouter-" --format "{{.Names}}:{{.Status}}")

  # Check for unhealthy containers
  UNHEALTHY_CONTAINERS=$(echo "$CONTAINER_STATUSES" | grep "unhealthy")
  if [[ -n "$UNHEALTHY_CONTAINERS" ]]; then
    echo -e "\n${YELLOW}⚠️ Yellow Alert: Some services are unhealthy!${RESET}"
    echo "$UNHEALTHY_CONTAINERS" | sed 's/^/    - /'
    echo "   (Tip: Run 'pnpm local:infra:logs' in another terminal to debug)"
    echo -n "⏳ Still waiting for services to stabilize"
    sleep 2
    continue
  fi

  # Check for starting containers
  STARTING_CONTAINERS=$(echo "$CONTAINER_STATUSES" | grep "starting")
  if [[ -n "$STARTING_CONTAINERS" ]]; then
    echo -n "."
    sleep 2
    continue
  fi

  # If no unhealthy or starting containers, assume healthy
  echo -e "\n✅ Engine room stabilized."
  break
done

# 2. Monorepo Alignment
echo "🏗️  Verifying DDD architecture integrity..."
pnpm build:all

# 3. AI Readiness Audit
if [[ "$*" != *"--no-analysis"* ]]; then
  echo "🧠 Running deep codebase analysis mission..."
  pnpm ai:analyze
else
  echo "⏭️  Skipping analysis pass for rapid viewport launch."
fi

# 4. Launch Command Bridge
echo "🚀 Launching Unified Dashboard and VS Code Extension..."

# Start Dashboard in background
pnpm dev:dashboard &
DASHBOARD_PID=$!

# Launch VS Code extension in watch mode
pnpm --dir domains/vscode-extension watch &
EXTENSION_PID=$!

trap "kill $DASHBOARD_PID $EXTENSION_PID; pnpm local:infra:down" EXIT

# 5. Automated Browser Launch
DASHBOARD_URL="http://localhost:3000"
echo "📡 Waiting for Unified Dashboard to initialize..."
MAX_RETRIES=15
COUNT=0
while ! curl -s "$DASHBOARD_URL" > /dev/null; do
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "⚠️ Warning: Dashboard initialization taking longer than expected. Opening anyway..."
    break
  fi
  sleep 2
  ((COUNT++))
done

if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$DASHBOARD_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  command -v xdg-open &>/dev/null && xdg-open "$DASHBOARD_URL" || echo "🌐 Please open $DASHBOARD_URL manually."
else
  explorer.exe "$DASHBOARD_URL" &>/dev/null || echo "🌐 Please open $DASHBOARD_URL manually."
fi

# After the loop, check if we broke due to timeout or actual stabilization
# (We check if statuses still contain starting or unhealthy)
if echo "$CONTAINER_STATUSES" | grep -E "starting|unhealthy" > /dev/null; then
  echo -e "${RED}❌ Critical: Services did not stabilize within the timeout period.${RESET}"
  echo "Run 'pnpm local:infra:logs' to check container logs for errors."
  echo "Current status of openrouter- containers:"
  docker ps --filter "name=openrouter-" --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"
  exit 1 # Exit with error if services didn't stabilize
fi

echo -e "\n✅ \033[1;32mSystem Online.\033[0m"
echo "   - Unified Dashboard: http://localhost:3000"
echo "   - VS Code: Open the Extension Development Host"
echo ""
echo -e "🖖 \033[1;34mAdmiral's Orchestration Checklist:\033[0m"
echo "   1. Open 'openrouter-crew.code-workspace' and start the 'Admiral Review' launch configuration."
echo "   2. Select a project in the sidebar to trigger 'Engage Project'."
echo "   3. Observe side-by-side orchestration of Mission Control and Chat panels."
echo "   4. Verify real-time Redis sync by checking the Dashboard mission brief."

wait
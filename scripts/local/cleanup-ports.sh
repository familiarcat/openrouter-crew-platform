#!/bin/bash
# ==============================================================================
# Infrastructure Port Cleanup Utility
# Automatically discovers and kills processes occupying monorepo infra ports.
# ==============================================================================

# Locate repo root relative to script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔍 Scanning for infrastructure port conflicts..."

# Load environment if present to detect overrides
if [ -f "$REPO_ROOT/.env.local" ]; then
    # Source variables ignoring comments
    set -a
    [ -f "$REPO_ROOT/.env.local" ] && . "$REPO_ROOT/.env.local"
    set +a
fi

# 1. Base ports (Dashboard is typically 3000)
PORTS=(3000)

# 2. Dynamic Discovery from docker-compose.local.yml
COMPOSE_FILE="$REPO_ROOT/docker-compose.local.yml"
if [ -f "$COMPOSE_FILE" ]; then
    # Extract port variables and their default values from ${VAR:-DEFAULT} syntax
    while read -r line; do
        if [[ $line =~ \$\{([A-Z0-9_]+):-([0-9]+)\} ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"
            DEFAULT_PORT="${BASH_REMATCH[2]}"
            
            # Determine active port: check environment first, fallback to default
            ACTIVE_PORT="${!VAR_NAME:-$DEFAULT_PORT}"
            PORTS+=("$ACTIVE_PORT")
        fi
    done < <(grep -E '\$\{[A-Z0-9_]+:-[0-9]+\}' "$COMPOSE_FILE")
fi

# Deduplicate ports
UNIQUE_PORTS=$(echo "${PORTS[@]}" | tr ' ' '\n' | sort -u)

for PORT in $UNIQUE_PORTS; do
  # Identify the process name and PID listening on the port
  PINFO=$(lsof -i :$PORT -sTCP:LISTEN -t 2>/dev/null | xargs -I{} ps -p {} -o pid=,comm= 2>/dev/null | awk '{$1=$1;print}')
  
  if [ -n "$PINFO" ]; then
    PID=$(echo "$PINFO" | awk '{print $1}')
    PNAME=$(basename "$(echo "$PINFO" | awk '{print $2}')")
    echo "   ⚠️  Found $PNAME ($PID) blocking port $PORT. Terminating..."
    kill -9 $PID 2>/dev/null || true
  fi
done

echo "✅ Ports cleared."
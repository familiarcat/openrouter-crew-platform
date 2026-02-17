#!/bin/bash

# Ports used by the platform dashboards
PORTS=(3000 3001 3002 3003 3004 5194)

echo "🧹 Checking for existing processes on ports: ${PORTS[*]}"

for PORT in "${PORTS[@]}"; do
  # Find PID using lsof (works on macOS/Linux)
  # -t: terse (PID only)
  # -i: internet address
  PIDS=$(lsof -ti :$PORT 2>/dev/null)
  
  if [ -n "$PIDS" ]; then
    echo "  - Killing processes on port $PORT: $PIDS"
    echo "$PIDS" | xargs kill -9
  fi
done

echo "✅ Ports are clear."
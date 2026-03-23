#!/bin/bash

echo "🛑 Stopping Next.js instances..."

# 1. Kill by Port (Preferred)
# 3000: Unified Dashboard
# 3001: API Server / Domain Dashboards
# 3002+: Other Domain Dashboards
PORTS=(3000 3001 3002 3003 3004 3005)

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "   Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
  fi
done

# 2. Kill by Process Name (Cleanup)
# Matches 'next-server', 'next dev', 'next start'
pkill -f "node_modules/.bin/next" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null

echo "✅ All Next.js instances stopped."
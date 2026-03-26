#!/bin/bash
# ==============================================================================
# Infrastructure Port Cleanup Utility
# Automatically identifies and kills processes occupying monorepo infra ports.
# ==============================================================================

echo "🔍 Scanning for infrastructure port conflicts..."

# Ports defined in docker-compose.local.yml:
# 54322: Supabase Postgres
# 54323: Supabase Studio
# 5678:  n8n
# 6379:  Redis
# 3000:  Unified Dashboard
PORTS=(54322 54323 5678 6379 3000)

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "   ⚠️  Found process $PID blocking port $PORT. Terminating..."
    kill -9 $PID
  fi
done

echo "✅ Ports cleared."
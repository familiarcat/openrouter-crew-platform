#!/bin/bash

# ==============================================================================
# Debug Web Portal
# Reads the latest logs and checks configuration alignment.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/.logs/web-portal.log"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo "🔍 Debugging Web Portal..."

# 1. Check Configuration
echo "📋 Configuration Check:"
if [ -f "$ENV_FILE" ]; then
    grep "MCP_URL" "$ENV_FILE" || echo "MCP_URL not found in .env.local"
    grep "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" || echo "Supabase URL not found"
else
    echo "❌ .env.local not found!"
fi

# 2. Check Logs
echo ""
echo "📜 Latest Web Portal Logs:"
if [ -f "$LOG_FILE" ]; then
    tail -n 20 "$LOG_FILE"
else
    echo "❌ Log file not found at $LOG_FILE"
fi

echo ""
echo "💡 Tip: If you see 'ECONNREFUSED' for the API, run ./scripts/start-local-dev.sh again (it has been updated to fix port mismatches)."
#!/usr/bin/env bash
# ============================================================
#  notify-deployment.sh
#
#  Automates Supabase deployment logging by bridging local
#  credentials (~/.zshrc) to the log-deployment Edge Function.
#
#  Usage:
#    ./notify-deployment.sh <status> [project_id] [platform] [env]
#
#  Example:
#    ./notify-deployment.sh building "uuid-here" "local" "development"
# ============================================================

set -euo pipefail

STATUS="${1:-building}"
PROJECT_ID="${2:-${DASHBOARD_PROJECT_ID:-}}"
PLATFORM="${3:-local}"
ENVIRONMENT="${4:-development}"
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# ── 1. Bridge Environment ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_SCRIPT="$SCRIPT_DIR/crew-env-bridge.sh"

if [[ -f "$BRIDGE_SCRIPT" ]]; then
  # Eval the source mode to pull from ~/.zshrc / .env.local
  eval "$(bash "$BRIDGE_SCRIPT" --source)"
else
  echo "Error: crew-env-bridge.sh not found at $BRIDGE_SCRIPT"
  exit 1
fi

# ── 2. Validate Required Vars ──────────────────────────────
if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Error: Supabase credentials not found. Run 'bash $BRIDGE_SCRIPT --audit' to debug."
  exit 1
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: PROJECT_ID not provided and DASHBOARD_PROJECT_ID not found in env."
  exit 1
fi

# ── 3. Execute Notification ────────────────────────────────
echo "Logging deployment [$STATUS] for project $PROJECT_ID..."

curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/log-deployment" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"platform\": \"$PLATFORM\",
    \"environment\": \"$ENVIRONMENT\",
    \"status\": \"$STATUS\",
    \"commit_sha\": \"$COMMIT_SHA\",
    \"metadata\": { 
      \"trigger\": \"manual_script\",
      \"user\": \"$(whoami)\",
      \"host\": \"$(hostname)\"
    }
  }" | jq .

echo "Successfully notified Supabase."
#!/usr/bin/env bash
# ============================================================
#  sync-n8n-secrets.sh
#
#  Synchronizes X-Webhook-Secret across Postgres and n8n.
#  Usage: ./sync-n8n-secrets.sh [--local|--remote]
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_SCRIPT="$SCRIPT_DIR/openrouter-crew-bridge.sh"

# 1. Source Environment
if [[ -f "$BRIDGE_SCRIPT" ]]; then
  eval "$(bash "$BRIDGE_SCRIPT" --source)"
else
  echo "Error: openrouter-crew-bridge.sh not found."
  exit 1
fi

# 2. Handle Auto-generated Secrets
# If the bridge had to generate a secret, persist it immediately to .env.local
if [[ "${N8N_WEBHOOK_SECRET_IS_GENERATED:-}" == "true" ]]; then
  echo "✨ Auto-generated N8N_WEBHOOK_SECRET detected. Persisting to .env.local..."
  bash "$BRIDGE_SCRIPT" --write > /dev/null
fi

SECRET="${N8N_WEBHOOK_SECRET:-dev-secret-placeholder}"

update_n8n_credential() {
  local url=$1
  local api_key=$2
  local label=$3

  if [[ -z "$api_key" ]]; then
    echo "⚠️  Skipping n8n credential sync for $label: N8N_API_KEY not set."
    return
  fi

  echo "🔧 Syncing n8n 'Header Auth' credential for $label..."
  
  # Find credential ID by name
  local cred_id
  cred_id=$(curl -s -H "X-N8N-API-KEY: $api_key" "$url/api/v1/credentials" | \
    jq -r '.data[] | select(.name == "Supabase Trigger Auth") | .id' 2>/dev/null || echo "")

  # Payload uses '=' prefix to signify an expression in n8n
  local payload='{"name":"Supabase Trigger Auth","type":"headerAuth","data":{"name":"X-Webhook-Secret","value":"={{$env.N8N_WEBHOOK_SECRET}}"}}'

  if [[ -z "$cred_id" ]]; then
    echo "  Creating new credential..."
    curl -s -X POST "$url/api/v1/credentials" \
      -H "X-N8N-API-KEY: $api_key" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null
  else
    echo "  Updating existing credential (ID: $cred_id)..."
    curl -s -X PUT "$url/api/v1/credentials/$cred_id" \
      -H "X-N8N-API-KEY: $api_key" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null
  fi

  echo "  ✅ Credential configured to use \$env.N8N_WEBHOOK_SECRET"
  echo "$cred_id" # Return the ID for use in workflow linking
}

link_workflow_credential() {
  local url=$1
  local api_key=$2
  local workflow_name=$3
  local cred_id=$4

  echo "🔗 Linking '$workflow_name' to 'Supabase Trigger Auth'..."

  # 1. Find the Workflow ID
  local workflow_id
  workflow_id=$(curl -s -H "X-N8N-API-KEY: $api_key" "$url/api/v1/workflows" | \
    jq -r --arg name "$workflow_name" '.data[] | select(.name == $name) | .id' 2>/dev/null || echo "")

  if [[ -z "$workflow_id" ]]; then
    echo "  ⚠️  Workflow '$workflow_name' not found. Skipping link."
    return
  fi

  # 2. Get current workflow JSON
  local current_wf
  current_wf=$(curl -s -H "X-N8N-API-KEY: $api_key" "$url/api/v1/workflows/$workflow_id")

  # 3. Update the Webhook node to use the credential
  local updated_wf
  updated_wf=$(echo "$current_wf" | jq --arg cred_id "$cred_id" '
    .nodes |= map(
      if .type == "n8n-nodes-base.webhook" then
        .parameters.authentication = "headerAuth" |
        .credentials.headerAuth = { id: $cred_id, name: "Supabase Trigger Auth" }
      else . end
    )')

  # 4. Push the updated workflow JSON back
  curl -s -X PUT "$url/api/v1/workflows/$workflow_id" \
    -H "X-N8N-API-KEY: $api_key" \
    -H "Content-Type: application/json" \
    -d "$updated_wf" > /dev/null

  echo "  ✅ Workflow '$workflow_name' updated successfully."
}

validate_webhook() {
  local url=$1
  local secret=$2
  local label=$3

  echo "🧪 Validating 'crew-optimize' webhook for $label..."
  # n8n webhook URLs follow the /webhook/ pattern
  local webhook_url="${url%/}/webhook/crew-optimize"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$webhook_url" \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Secret: $secret" \
    -d "{\"event\": \"sync_validation\", \"label\": \"$label\", \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}")

  if [[ "$response" == "200" || "$response" == "201" ]]; then
    echo "  ✅ Webhook validation successful (Status: $response)"
  else
    echo "  ❌ Webhook validation failed (Status: $response). Check if the workflow is active and the secret matches."
  fi
}

verify_container_env() {
  local expected=$1
  local label=$2
  
  echo "🔍 Verifying $label container environment..."
  # Check if container is running
  if ! docker ps --format '{{.Names}}' | grep -q "openrouter-n8n"; then
    echo "  ⚠️  Container 'openrouter-n8n' is not running. Skipping env verification."
    return
  fi

  local actual
  actual=$(docker exec openrouter-n8n printenv N8N_WEBHOOK_SECRET 2>/dev/null || echo "")
  
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✅ Container N8N_WEBHOOK_SECRET matches .env.local"
  else
    echo "  ❌ ERROR: Container environment MISMATCH."
    echo "     Container has a different N8N_WEBHOOK_SECRET. Run 'pnpm local:infra:up' to restart."
  fi
}

sync_local() {
  echo "🚀 Syncing Local Environment..."
  
  # Update Postgres setting for the trigger
  echo "Updating Local Postgres setting..."
  docker exec openrouter-supabase-db psql -U postgres -c \
    "ALTER DATABASE postgres SET \"app.settings.n8n_webhook_secret\" = '$SECRET';"

  # Verify n8n local API connectivity
  LOCAL_N8N="${N8N_URL:-http://localhost:5678}"
  echo "Verifying Local n8n API at $LOCAL_N8N..."
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "X-N8N-API-KEY: ${N8N_API_KEY:-}" "$LOCAL_N8N/api/v1/workflows")
  
  if [ "$STATUS" == "200" ]; then
    echo "✅ Local n8n API responsive."
  else
    echo "⚠️  Local n8n API returned $STATUS. Ensure container is running."
  fi

  local cred_id
  cred_id=$(update_n8n_credential "$LOCAL_N8N" "${N8N_API_KEY:-}" "Local")
  link_workflow_credential "$LOCAL_N8N" "${N8N_API_KEY:-}" "crew-optimize" "$cred_id"
  validate_webhook "$LOCAL_N8N" "$SECRET" "Local"
  verify_container_env "$SECRET" "Local"
}

sync_remote() {
  local REMOTE_N8N="${N8N_URL:-}"
  if [[ -n "$REMOTE_N8N" && "$REMOTE_N8N" != *"localhost"* ]]; then
    echo "🚀 Syncing Remote Environment ($REMOTE_N8N)..."
    local cred_id
    cred_id=$(update_n8n_credential "$REMOTE_N8N" "${N8N_API_KEY:-}" "Remote")
    link_workflow_credential "$REMOTE_N8N" "${N8N_API_KEY:-}" "crew-optimize" "$cred_id"
    validate_webhook "$REMOTE_N8N" "$SECRET" "Remote"
  fi
}

case "${1:-all}" in
  --local) sync_local ;;
  --remote) sync_remote ;;
  all) 
    sync_local
    sync_remote
    ;;
esac

echo "🎉 Synchronization process complete."
#!/usr/bin/env bash
# ============================================================
#  deploy-staging.sh
#  Unified local-to-staging deployment orchestrator
#  Follows Dark Forest Protocol: Verify Then Trust
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BRIDGE_SCRIPT="$SCRIPT_DIR/crew-env-bridge.sh"
VALIDATOR_SCRIPT="$SCRIPT_DIR/crew-publish-validate.sh"
REMEDIATOR_SCRIPT="$SCRIPT_DIR/crew-fix-remaining.sh"
ANALYZER_SCRIPT="$SCRIPT_DIR/crew-ai-analyze.sh"

echo "🛰️  Initiating Staging Deployment..."

# 1. Architectural Guard
if [[ -d "$REPO_ROOT/domains/alex-ai-universal/dashboard" ]]; then
  echo "❌ ERROR: Misplaced dashboard detected in domains/. Run 'bash scripts/crew-fix-remaining.sh --phase 3' first."
  exit 1
fi

# 2. Source Environment
if [[ -f "$BRIDGE_SCRIPT" ]]; then
  eval "$(bash "$BRIDGE_SCRIPT" --source)"
fi

# 3. AI Pre-flight Analysis (Optional/Light)
if [[ "${RUN_AI_AUDIT:-false}" == "true" && -f "$ANALYZER_SCRIPT" ]]; then
  echo "🧠 Running AI Architecture Audit..."
  bash "$ANALYZER_SCRIPT" --mode architecture,deployment_gaps --budget 0.50
fi

# 4. Pre-flight Validation (Dark Forest Protocol)
if [[ -f "$VALIDATOR_SCRIPT" ]]; then
  echo "🛡️  Running Pre-flight Validation..."
  # Fix: ensure build is skipped if we just ran it or are in a clean state
  SKIP_BUILD=true bash "$VALIDATOR_SCRIPT"
fi

# 5. Build Verification
echo "🏗️  Building production artifacts..."
cd "$REPO_ROOT"
pnpm build

# 6. Vercel Staging Deployment
if command -v vercel &>/dev/null; then
  echo "🚀 Deploying dashboards to Vercel (Preview)..."
  # Capture the deployment URL from the CLI output
  VERCEL_OUTPUT=$(vercel --cwd apps/unified-dashboard deploy --yes)
  DEPLOYMENT_URL=$(echo "$VERCEL_OUTPUT" | grep -oE "https://[a-zA-Z0-9.-]+\.vercel\.app" | head -n 1 || true)

  if [[ -z "$DEPLOYMENT_URL" ]]; then
    echo "⚠️  Warning: Could not extract deployment URL from Vercel output. Proceeding with caution."
  else
    echo "📡 Deployment created at: $DEPLOYMENT_URL"
    echo "🔍 Verifying deployment is responding..."
    # Retry for up to 60 seconds (12 attempts * 5s)
    for i in {1..12}; do
      if curl -s -f "$DEPLOYMENT_URL" > /dev/null; then
        echo "✅ Vercel deployment is reachable."
        break
      fi
      echo "⏳ Waiting for Vercel to initialize... ($i/12)"
      sleep 5
      [[ $i -eq 12 ]] && { echo "❌ ERROR: Vercel deployment failed to respond. Aborting infrastructure sync."; exit 1; }
    done
  fi
fi

# 7. Terraform Infrastructure
if [[ -d "terraform" ]]; then
  echo "🌍 Synchronizing Infrastructure (Terraform Staging Workspace)..."
  cd terraform
  terraform init
  terraform workspace select staging || terraform workspace new staging
  terraform apply -auto-approve -var="environment=staging" -var="vercel_deployment_url=${DEPLOYMENT_URL:-}"
fi

echo "✅ Staging Deployment Successful."
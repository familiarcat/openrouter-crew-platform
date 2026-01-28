#!/bin/bash
# ==============================================================================
# Sync Local Secrets to GitHub Secrets
# ==============================================================================
# This script syncs your local dotfile secrets to GitHub repository secrets
# Usage: ./scripts/secrets/sync-to-github.sh
# Requires: GitHub CLI (gh) installed and authenticated
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ==============================================================================
# Configuration
# ==============================================================================

GITHUB_REPO="openrouter-crew/platform"  # Update with your repo
ENVIRONMENT="production"  # or "staging"

# ==============================================================================
# Helper Functions
# ==============================================================================

log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
    exit 1
}

check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) not installed. Install: brew install gh"
    fi

    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI not authenticated. Run: gh auth login"
    fi

    log_success "GitHub CLI authenticated"
}

set_secret() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        log_info "Skipping $secret_name (not set locally)"
        return
    fi

    echo "$secret_value" | gh secret set "$secret_name" \
        --repo "$GITHUB_REPO" \
        --env "$ENVIRONMENT" 2>/dev/null

    if [ $? -eq 0 ]; then
        log_success "Set $secret_name"
    else
        log_error "Failed to set $secret_name"
    fi
}

# ==============================================================================
# Load Local Secrets
# ==============================================================================

log_info "Loading secrets from local dotfiles..."

# Source the load script to get environment variables
source "$SCRIPT_DIR/load-local-secrets.sh" &> /dev/null

# ==============================================================================
# Sync Secrets to GitHub
# ==============================================================================

echo ""
echo "🔐 Syncing Secrets to GitHub"
echo "=============================="
echo "Repo: $GITHUB_REPO"
echo "Environment: $ENVIRONMENT"
echo ""

# Check GitHub CLI
check_gh_cli

# ==============================================================================
# Supabase Secrets
# ==============================================================================

log_info "Syncing Supabase secrets..."
set_secret "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
set_secret "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN"
set_secret "SUPABASE_PROJECT_ID" "$SUPABASE_PROJECT_ID"

# ==============================================================================
# LLM Provider API Keys
# ==============================================================================

log_info "Syncing LLM provider keys..."
set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY"
set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
set_secret "GOOGLE_API_KEY" "$GOOGLE_API_KEY"

# ==============================================================================
# N8N Configuration
# ==============================================================================

log_info "Syncing N8N configuration..."
set_secret "N8N_BASE_URL" "$N8N_BASE_URL"
set_secret "N8N_API_KEY" "$N8N_API_KEY"

# ==============================================================================
# N8N Crew Webhooks (10 Core Crew Members)
# ==============================================================================

log_info "Syncing crew webhooks..."
set_secret "N8N_CREW_CAPTAIN_PICARD_WEBHOOK" "$N8N_CREW_CAPTAIN_PICARD_WEBHOOK"
set_secret "N8N_CREW_COMMANDER_DATA_WEBHOOK" "$N8N_CREW_COMMANDER_DATA_WEBHOOK"
set_secret "N8N_CREW_COMMANDER_RIKER_WEBHOOK" "$N8N_CREW_COMMANDER_RIKER_WEBHOOK"
set_secret "N8N_CREW_COUNSELOR_TROI_WEBHOOK" "$N8N_CREW_COUNSELOR_TROI_WEBHOOK"
set_secret "N8N_CREW_LT_WORF_WEBHOOK" "$N8N_CREW_LT_WORF_WEBHOOK"
set_secret "N8N_CREW_DR_CRUSHER_WEBHOOK" "$N8N_CREW_DR_CRUSHER_WEBHOOK"
set_secret "N8N_CREW_GEORDI_LA_FORGE_WEBHOOK" "$N8N_CREW_GEORDI_LA_FORGE_WEBHOOK"
set_secret "N8N_CREW_LT_UHURA_WEBHOOK" "$N8N_CREW_LT_UHURA_WEBHOOK"
set_secret "N8N_CREW_QUARK_WEBHOOK" "$N8N_CREW_QUARK_WEBHOOK"
set_secret "N8N_CREW_CHIEF_OBRIEN_WEBHOOK" "$N8N_CREW_CHIEF_OBRIEN_WEBHOOK"

# ==============================================================================
# Deployment Secrets
# ==============================================================================

log_info "Syncing deployment secrets..."
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
set_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"
set_secret "GITHUB_TOKEN" "$GITHUB_TOKEN"

# ==============================================================================
# AWS Secrets (Optional)
# ==============================================================================

if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    log_info "Syncing AWS secrets..."
    set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
    set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
    set_secret "AWS_REGION" "$AWS_REGION"
fi

# ==============================================================================
# Summary
# ==============================================================================

echo ""
echo "=============================="
log_success "Secrets synced successfully!"
echo ""
echo "Verify secrets:"
echo "  gh secret list --repo $GITHUB_REPO --env $ENVIRONMENT"
echo ""

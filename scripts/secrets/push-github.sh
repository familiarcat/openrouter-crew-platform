#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - GitHub Secrets Pusher
#
# Pushes local secrets to GitHub Actions secrets.
# Usage: ./scripts/secrets/push-github.sh [--env production|staging]
# ==============================================================================

ENV=${1:-production}

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) could not be found. Please install it."
    exit 1
fi

echo "🚀 Pushing secrets to GitHub ($ENV)..."

# Example of pushing a specific secret
push_secret() {
    local key=$1
    local value=$2
    if [ -n "$value" ]; then
        echo "   Pushing $key..."
        gh secret set "$key" --body "$value" --env "$ENV"
    fi
}

# Push core secrets
push_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY"
push_secret "SUPABASE_URL" "$SUPABASE_URL"
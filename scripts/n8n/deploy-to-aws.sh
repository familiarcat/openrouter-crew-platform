#!/bin/bash

# ==============================================================================
# N8N AWS Deployment Script
# 
# Pushes local workflows to the AWS production n8n instance.
# Automatically attempts to retrieve credentials from ~/.zshrc if not set in current env.
# ==============================================================================

set -e

echo "🚀 Starting AWS Workflow Deployment..."

# 1. Check for Prod URL (Extract from zshrc if missing)
if [ -z "$N8N_PROD_URL" ]; then
    # Try loading from .env.local first
    if [ -f .env.local ]; then
        source .env.local
    fi
    
    if [ -f ~/.zshrc ] && command -v zsh > /dev/null; then
        echo "🔍 Attempting to load N8N_PROD_URL from ~/.zshrc..."
        # Use -i (interactive) to ensure .zshrc is actually sourced (bypasses non-interactive return guards)
        export N8N_PROD_URL=$(zsh -i -c 'source ~/.zshrc >/dev/null 2>&1; echo $N8N_PROD_URL' | tr -d '\r')
    fi
fi

# 2. Check for Prod API Key (Extract from zshrc if missing)
if [ -z "$N8N_PROD_API_KEY" ]; then
    # Try loading from .env.local first
    if [ -f .env.local ]; then
        source .env.local
    fi

    if [ -f ~/.zshrc ] && command -v zsh > /dev/null; then
        echo "🔍 Attempting to load N8N_PROD_API_KEY from ~/.zshrc..."
        export N8N_PROD_API_KEY=$(zsh -i -c 'source ~/.zshrc >/dev/null 2>&1; echo $N8N_PROD_API_KEY' | tr -d '\r')
    fi
fi

# Validation
if [ -z "$N8N_PROD_API_KEY" ]; then
    echo "❌ Error: N8N_PROD_API_KEY not found."
    echo ""
    echo "To fix this:"
    echo "1. Log into your production n8n instance ($N8N_PROD_URL)"
    echo "2. Go to Settings > Public API and generate a key."
    echo "3. Add it to your ~/.zshrc or .env.local file:"
    echo "   export N8N_PROD_API_KEY='your-key-here'"
    exit 1
fi

# 3. Run Sync Script in Production Mode
echo "📤 Pushing workflows to ${N8N_PROD_URL:-production}..."
node scripts/n8n/sync-workflows.js --push --prod
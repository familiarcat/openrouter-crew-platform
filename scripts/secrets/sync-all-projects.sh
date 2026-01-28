#!/bin/bash
# ==============================================================================
# Unified Secrets Sync Across All Projects
# ==============================================================================
# This script syncs secrets from your local dotfiles to:
# 1. OpenRouter Crew Platform (unified platform)
# 2. DJ-Booking (event management)
# 3. OpenRouter-AI-Milestone (reference architecture)
# 4. Alex-AI-Universal (universal platform)
# 5. RAG-Refresh-Product-Factory (product development)
#
# Usage: ./scripts/secrets/sync-all-projects.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ==============================================================================
# Project Paths
# ==============================================================================

UNIFIED_PLATFORM="$HOME/Documents/workspace/openrouter-crew-platform"
DJ_BOOKING="$HOME/Documents/workspace/dj-booking"
OPENROUTER_MILESTONE="$HOME/Documents/workspace/openrouter-ai-milestone-20260128-043029"
ALEX_AI_UNIVERSAL="$HOME/Documents/workspace/alex-ai-universal"
RAG_PRODUCT_FACTORY="$HOME/Documents/workspace/rag-refresh-product-factory"

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
}

# ==============================================================================
# Load Secrets from Dotfiles
# ==============================================================================

load_secrets() {
    log_info "Loading secrets from dotfiles..."

    # Load from ~/.zshrc
    if [ -f "$HOME/.zshrc" ]; then
        source <(grep -E '^export [A-Z_]+=' "$HOME/.zshrc" 2>/dev/null || true)
    fi

    # Load from ~/.alexai-keys
    if [ -f "$HOME/.alexai-keys" ]; then
        source "$HOME/.alexai-keys"
    fi

    # Load from ~/.alexai-secrets
    if [ -f "$HOME/.alexai-secrets" ]; then
        source "$HOME/.alexai-secrets"
    fi

    # Load N8N config if jq is available
    if [ -f "$HOME/.alexai-n8n-config.json" ] && command -v jq &> /dev/null; then
        export N8N_BASE_URL=$(jq -r '.n8n.baseUrl // "http://localhost:5678"' "$HOME/.alexai-n8n-config.json")
        export N8N_API_KEY=$(jq -r '.n8n.apiKey // ""' "$HOME/.alexai-n8n-config.json")

        # Load crew webhooks
        for crew in captain_picard commander_data commander_riker counselor_troi \
                   lt_worf dr_crusher geordi_la_forge lt_uhura quark chief_obrien; do
            webhook=$(jq -r ".crew.${crew}.webhook // \"\"" "$HOME/.alexai-n8n-config.json")
            if [ -n "$webhook" ]; then
                var_name="N8N_CREW_${crew^^}_WEBHOOK"
                var_name="${var_name//-/_}"
                export "$var_name"="$webhook"
            fi
        done
    fi

    log_success "Secrets loaded from dotfiles"
}

# ==============================================================================
# Generate .env File Template
# ==============================================================================

generate_env_file() {
    local output_file=$1
    local project_name=$2

    cat > "$output_file" << EOF
# ==============================================================================
# Environment Variables for ${project_name}
# ==============================================================================
# Auto-generated from local dotfiles
# Date: $(date)
# Sync Script: scripts/secrets/sync-all-projects.sh
# ==============================================================================

# ==============================================================================
# Supabase Configuration
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321}}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY}}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54321}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# For Supabase CLI
SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN}
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}

# ==============================================================================
# LLM Provider API Keys
# ==============================================================================

# OpenRouter (Primary - Cost-Optimized Multi-Provider)
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

# Direct Provider Keys (Optional)
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
GOOGLE_API_KEY=${GOOGLE_API_KEY}

# ==============================================================================
# N8N Workflow Automation
# ==============================================================================
N8N_BASE_URL=${N8N_BASE_URL:-http://localhost:5678}
N8N_API_KEY=${N8N_API_KEY}
N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-admin}

# ==============================================================================
# N8N Crew Webhooks (10 Core Crew Members)
# ==============================================================================
N8N_CREW_CAPTAIN_PICARD_WEBHOOK=${N8N_CREW_CAPTAIN_PICARD_WEBHOOK}
N8N_CREW_COMMANDER_DATA_WEBHOOK=${N8N_CREW_COMMANDER_DATA_WEBHOOK}
N8N_CREW_COMMANDER_RIKER_WEBHOOK=${N8N_CREW_COMMANDER_RIKER_WEBHOOK}
N8N_CREW_COUNSELOR_TROI_WEBHOOK=${N8N_CREW_COUNSELOR_TROI_WEBHOOK}
N8N_CREW_LT_WORF_WEBHOOK=${N8N_CREW_LT_WORF_WEBHOOK}
N8N_CREW_DR_CRUSHER_WEBHOOK=${N8N_CREW_DR_CRUSHER_WEBHOOK}
N8N_CREW_GEORDI_LA_FORGE_WEBHOOK=${N8N_CREW_GEORDI_LA_FORGE_WEBHOOK}
N8N_CREW_LT_UHURA_WEBHOOK=${N8N_CREW_LT_UHURA_WEBHOOK}
N8N_CREW_QUARK_WEBHOOK=${N8N_CREW_QUARK_WEBHOOK}
N8N_CREW_CHIEF_OBRIEN_WEBHOOK=${N8N_CREW_CHIEF_OBRIEN_WEBHOOK}

# ==============================================================================
# AWS Configuration (Optional - for Infrastructure)
# ==============================================================================
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_DEFAULT_REGION=${AWS_REGION:-us-east-1}

# ==============================================================================
# Deployment Configuration
# ==============================================================================
SITE_URL=${SITE_URL:-http://localhost:3000}
NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}

# GitHub
GITHUB_TOKEN=${GITHUB_TOKEN}

# Vercel (for deployment)
VERCEL_TOKEN=${VERCEL_TOKEN}
VERCEL_ORG_ID=${VERCEL_ORG_ID}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID}

# ==============================================================================
# Database Configuration (for legacy projects)
# ==============================================================================
DATABASE_URL=${DATABASE_URL}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# ==============================================================================
# Project-Specific Configuration
# ==============================================================================
# Add any project-specific variables here
EOF

    log_success "Generated $output_file"
}

# ==============================================================================
# Sync to OpenRouter Crew Platform (Unified Platform)
# ==============================================================================

sync_unified_platform() {
    if [ -d "$UNIFIED_PLATFORM" ]; then
        log_info "Syncing to OpenRouter Crew Platform..."

        # Main .env.local
        generate_env_file "$UNIFIED_PLATFORM/apps/unified-dashboard/.env.local" "Unified Dashboard"

        # Root .env for shared packages
        generate_env_file "$UNIFIED_PLATFORM/.env" "OpenRouter Crew Platform"

        log_success "Synced OpenRouter Crew Platform"
    else
        log_error "OpenRouter Crew Platform not found at $UNIFIED_PLATFORM"
    fi
}

# ==============================================================================
# Sync to DJ-Booking
# ==============================================================================

sync_dj_booking() {
    if [ -d "$DJ_BOOKING" ]; then
        log_info "Syncing to DJ-Booking..."

        # .env for docker-compose
        generate_env_file "$DJ_BOOKING/.env" "DJ-Booking"

        # Frontend .env.local if Next.js exists
        if [ -d "$DJ_BOOKING/frontend" ]; then
            generate_env_file "$DJ_BOOKING/frontend/.env.local" "DJ-Booking Frontend"
        fi

        log_success "Synced DJ-Booking"
    else
        log_error "DJ-Booking not found at $DJ_BOOKING"
    fi
}

# ==============================================================================
# Sync to OpenRouter-AI-Milestone
# ==============================================================================

sync_openrouter_milestone() {
    if [ -d "$OPENROUTER_MILESTONE" ]; then
        log_info "Syncing to OpenRouter-AI-Milestone..."

        # Dashboard .env.local
        if [ -d "$OPENROUTER_MILESTONE/apps/dashboard" ]; then
            generate_env_file "$OPENROUTER_MILESTONE/apps/dashboard/.env.local" "OpenRouter Milestone Dashboard"
        fi

        # Root .env
        generate_env_file "$OPENROUTER_MILESTONE/.env" "OpenRouter-AI-Milestone"

        log_success "Synced OpenRouter-AI-Milestone"
    else
        log_error "OpenRouter-AI-Milestone not found at $OPENROUTER_MILESTONE"
    fi
}

# ==============================================================================
# Sync to Alex-AI-Universal
# ==============================================================================

sync_alex_ai_universal() {
    if [ -d "$ALEX_AI_UNIVERSAL" ]; then
        log_info "Syncing to Alex-AI-Universal..."

        # Root .env
        generate_env_file "$ALEX_AI_UNIVERSAL/.env" "Alex-AI-Universal"

        # Dashboard .env.local if exists
        if [ -d "$ALEX_AI_UNIVERSAL/packages/dashboard" ]; then
            generate_env_file "$ALEX_AI_UNIVERSAL/packages/dashboard/.env.local" "Alex-AI Dashboard"
        fi

        log_success "Synced Alex-AI-Universal"
    else
        log_error "Alex-AI-Universal not found at $ALEX_AI_UNIVERSAL"
    fi
}

# ==============================================================================
# Sync to RAG-Refresh-Product-Factory
# ==============================================================================

sync_rag_product_factory() {
    if [ -d "$RAG_PRODUCT_FACTORY" ]; then
        log_info "Syncing to RAG-Refresh-Product-Factory..."

        # .env.local for Next.js
        generate_env_file "$RAG_PRODUCT_FACTORY/.env.local" "RAG-Refresh-Product-Factory"

        # .env for root
        generate_env_file "$RAG_PRODUCT_FACTORY/.env" "Product Factory"

        log_success "Synced RAG-Refresh-Product-Factory"
    else
        log_error "RAG-Refresh-Product-Factory not found at $RAG_PRODUCT_FACTORY"
    fi
}

# ==============================================================================
# Update ~/.zshrc with Unified Exports
# ==============================================================================

update_zshrc() {
    log_info "Updating ~/.zshrc with unified exports..."

    # Backup existing .zshrc
    cp "$HOME/.zshrc" "$HOME/.zshrc.backup.$(date +%Y%m%d%H%M%S)"

    # Add or update OpenRouter Crew Platform section
    if ! grep -q "# OpenRouter Crew Platform" "$HOME/.zshrc"; then
        cat >> "$HOME/.zshrc" << 'EOF'

# ==============================================================================
# OpenRouter Crew Platform - Unified Configuration
# ==============================================================================
# Auto-synced across all projects

# Load unified environment
if [ -f "$HOME/.alexai-keys" ]; then
    source "$HOME/.alexai-keys"
fi

if [ -f "$HOME/.alexai-secrets" ]; then
    source "$HOME/.alexai-secrets"
fi

# Quick aliases
alias crew-sync="$HOME/Documents/workspace/openrouter-crew-platform/scripts/secrets/sync-all-projects.sh"
alias crew-load="source $HOME/Documents/workspace/openrouter-crew-platform/scripts/secrets/load-local-secrets.sh"
alias crew-dashboard="cd $HOME/Documents/workspace/openrouter-crew-platform && pnpm dev"
alias crew-n8n="cd $HOME/Documents/workspace/openrouter-crew-platform && docker-compose -f docker-compose.n8n.yml up -d"
EOF

        log_success "Added OpenRouter Crew Platform section to ~/.zshrc"
    else
        log_info "~/.zshrc already configured"
    fi
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    echo ""
    echo "🔄 Unified Secrets Sync"
    echo "======================="
    echo "Syncing secrets from dotfiles to all projects..."
    echo ""

    # Load secrets from dotfiles
    load_secrets

    # Sync to all projects
    sync_unified_platform
    sync_dj_booking
    sync_openrouter_milestone
    sync_alex_ai_universal
    sync_rag_product_factory

    # Update ~/.zshrc
    update_zshrc

    echo ""
    echo "======================="
    log_success "All projects synced successfully!"
    echo ""
    echo "Projects synced:"
    echo "  ✅ OpenRouter Crew Platform (unified)"
    echo "  ✅ DJ-Booking"
    echo "  ✅ OpenRouter-AI-Milestone"
    echo "  ✅ Alex-AI-Universal"
    echo "  ✅ RAG-Refresh-Product-Factory"
    echo ""
    echo "New aliases available (reload shell: source ~/.zshrc):"
    echo "  crew-sync      # Run this script"
    echo "  crew-load      # Load secrets"
    echo "  crew-dashboard # Start unified dashboard"
    echo "  crew-n8n       # Start N8N"
    echo ""
}

# Run main function
main

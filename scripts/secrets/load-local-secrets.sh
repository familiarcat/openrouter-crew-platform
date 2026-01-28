#!/bin/bash
# ==============================================================================
# Load Local Secrets from Dotfiles
# ==============================================================================
# This script loads secrets from your local dotfiles into environment variables
# Usage: source scripts/secrets/load-local-secrets.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔐 Loading secrets from local dotfiles..."

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
# 1. Load from ~/.zshrc (API Keys and Environment)
# ==============================================================================

load_from_zshrc() {
    if [ -f "$HOME/.zshrc" ]; then
        log_info "Loading API keys from ~/.zshrc..."

        # Extract environment variables (lines starting with export)
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "$line" ]] && continue

            # Extract export lines
            if [[ "$line" =~ ^export[[:space:]]+([A-Z_][A-Z0-9_]*)= ]]; then
                var_name="${BASH_REMATCH[1]}"

                # Only load relevant keys
                case "$var_name" in
                    OPENROUTER_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_API_KEY|\
                    SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|\
                    N8N_*|GITHUB_TOKEN|AWS_*|TERRAFORM_*)
                        eval "$line"
                        log_success "Loaded $var_name"
                        ;;
                esac
            fi
        done < "$HOME/.zshrc"
    else
        log_error "~/.zshrc not found"
    fi
}

# ==============================================================================
# 2. Load from ~/.alexai-keys
# ==============================================================================

load_from_alexai_keys() {
    if [ -f "$HOME/.alexai-keys" ]; then
        log_info "Loading from ~/.alexai-keys..."
        source "$HOME/.alexai-keys"
        log_success "Loaded ~/.alexai-keys"
    else
        log_error "~/.alexai-keys not found"
    fi
}

# ==============================================================================
# 3. Load from ~/.alexai-secrets
# ==============================================================================

load_from_alexai_secrets() {
    if [ -f "$HOME/.alexai-secrets" ]; then
        log_info "Loading from ~/.alexai-secrets..."
        source "$HOME/.alexai-secrets"
        log_success "Loaded ~/.alexai-secrets"
    else
        log_error "~/.alexai-secrets not found"
    fi
}

# ==============================================================================
# 4. Load from ~/.alexai-n8n-config.json
# ==============================================================================

load_from_n8n_config() {
    if [ -f "$HOME/.alexai-n8n-config.json" ]; then
        log_info "Loading N8N config from JSON..."

        # Extract N8N webhooks using jq if available
        if command -v jq &> /dev/null; then
            # Parse crew webhooks
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
                    log_success "Loaded $var_name"
                fi
            done
        else
            log_error "jq not installed - skipping JSON parsing"
        fi

        log_success "Loaded ~/.alexai-n8n-config.json"
    else
        log_error "~/.alexai-n8n-config.json not found"
    fi
}

# ==============================================================================
# 5. Load AWS Credentials
# ==============================================================================

load_aws_credentials() {
    if [ -f "$HOME/.aws/credentials" ]; then
        log_info "Loading AWS credentials..."

        # Export AWS profile (default)
        if [ -f "$HOME/.aws/config" ]; then
            export AWS_REGION=$(grep -A 3 "\[default\]" "$HOME/.aws/config" | grep region | cut -d'=' -f2 | tr -d ' ')
        fi

        log_success "AWS credentials configured"
    else
        log_error "~/.aws/credentials not found"
    fi
}

# ==============================================================================
# 6. Load Docker Config
# ==============================================================================

load_docker_config() {
    if [ -f "$HOME/.docker/config.json" ]; then
        log_info "Docker config found"
        export DOCKER_CONFIG="$HOME/.docker"
        log_success "Docker configured"
    else
        log_error "~/.docker/config.json not found"
    fi
}

# ==============================================================================
# 7. Load Terraform Config
# ==============================================================================

load_terraform_config() {
    if [ -d "$HOME/.terraform.d" ]; then
        log_info "Terraform config found"
        export TF_CLI_CONFIG_FILE="$HOME/.terraform.d/terraform.rc"
        log_success "Terraform configured"
    else
        log_error "~/.terraform.d not found"
    fi
}

# ==============================================================================
# 8. Generate .env.local for Next.js
# ==============================================================================

generate_env_local() {
    log_info "Generating .env.local for unified-dashboard..."

    ENV_FILE="$PROJECT_ROOT/apps/unified-dashboard/.env.local"

    cat > "$ENV_FILE" << EOF
# Auto-generated from local dotfiles
# Date: $(date)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54321}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# OpenRouter (Primary LLM Provider)
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

# Optional: Direct Provider Keys
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
GOOGLE_API_KEY=${GOOGLE_API_KEY}

# N8N Configuration
N8N_BASE_URL=${N8N_BASE_URL:-http://localhost:5678}
N8N_API_KEY=${N8N_API_KEY}

# N8N Crew Webhooks (10 Core Crew Members)
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

# AWS Configuration (for deployment)
AWS_REGION=${AWS_REGION:-us-east-1}

# Site Configuration
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

    log_success "Generated $ENV_FILE"
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    echo ""
    echo "🚀 OpenRouter Crew Platform - Secrets Loader"
    echo "=============================================="
    echo ""

    load_from_zshrc
    load_from_alexai_keys
    load_from_alexai_secrets
    load_from_n8n_config
    load_aws_credentials
    load_docker_config
    load_terraform_config
    generate_env_local

    echo ""
    echo "=============================================="
    log_success "All secrets loaded successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start Supabase: supabase start"
    echo "  2. Start N8N: docker-compose -f docker-compose.n8n.yml up -d"
    echo "  3. Start Dashboard: pnpm dev"
    echo ""
}

# Run main function
main

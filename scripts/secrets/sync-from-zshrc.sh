#!/usr/bin/env bash
#
# Secret Management: Sync from ~/.zshrc to .env.local
#
# This script extracts secrets from your ~/.zshrc file and creates
# .env.local files in each app that needs them. This keeps secrets
# out of git while making them easily accessible during development.
#
# Usage: pnpm secrets:sync
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Syncing secrets from ~/.zshrc...${NC}"

# Function to extract environment variable from shell config
extract_secret() {
  local var_name=$1
  local file=${2:-~/.zshrc}

  # Try different export patterns
  grep -E "^export ${var_name}=" "$file" 2>/dev/null | \
    sed -E 's/^export [^=]+=["'"'"']?([^"'"'"']*)["'"'"']?$/\1/' || \
    echo ""
}

# Check if ~/.zshrc exists
if [ ! -f ~/.zshrc ]; then
  echo -e "${RED}❌ ~/.zshrc not found. Trying ~/.bashrc...${NC}"
  SHELL_RC=~/.bashrc
  if [ ! -f ~/.bashrc ]; then
    echo -e "${RED}❌ No shell RC file found. Please set environment variables manually.${NC}"
    exit 1
  fi
else
  SHELL_RC=~/.zshrc
fi

echo -e "${YELLOW}📂 Reading from: $SHELL_RC${NC}"

# Extract secrets
SUPABASE_URL=$(extract_secret "SUPABASE_URL" "$SHELL_RC")
SUPABASE_ANON_KEY=$(extract_secret "SUPABASE_ANON_KEY" "$SHELL_RC")
SUPABASE_SERVICE_ROLE_KEY=$(extract_secret "SUPABASE_SERVICE_ROLE_KEY" "$SHELL_RC")
SUPABASE_PROJECT_ID=$(extract_secret "SUPABASE_PROJECT_ID" "$SHELL_RC")

OPENROUTER_API_KEY=$(extract_secret "OPENROUTER_API_KEY" "$SHELL_RC")

N8N_BASE_URL=$(extract_secret "N8N_BASE_URL" "$SHELL_RC")
N8N_API_KEY=$(extract_secret "N8N_API_KEY" "$SHELL_RC")
N8N_USER=$(extract_secret "N8N_USER" "$SHELL_RC")
N8N_PASSWORD=$(extract_secret "N8N_PASSWORD" "$SHELL_RC")

# Crew webhook URLs (optional - will be generated if not present)
N8N_CREW_CAPTAIN_PICARD=$(extract_secret "N8N_CREW_CAPTAIN_PICARD_WEBHOOK" "$SHELL_RC")
N8N_CREW_COMMANDER_DATA=$(extract_secret "N8N_CREW_COMMANDER_DATA_WEBHOOK" "$SHELL_RC")

# AWS credentials (for deployment)
AWS_ACCESS_KEY_ID=$(extract_secret "AWS_ACCESS_KEY_ID" "$SHELL_RC")
AWS_SECRET_ACCESS_KEY=$(extract_secret "AWS_SECRET_ACCESS_KEY" "$SHELL_RC")
AWS_REGION=$(extract_secret "AWS_REGION" "$SHELL_RC")

# Function to create .env.local file
create_env_file() {
  local target_dir=$1
  local env_file="$target_dir/.env.local"

  echo -e "${YELLOW}📝 Creating $env_file${NC}"

  cat > "$env_file" << EOF
# Auto-generated from ~/.zshrc on $(date)
# DO NOT COMMIT THIS FILE
# Run 'pnpm secrets:sync' to regenerate

# Supabase Configuration
SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54321}
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54321}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your-anon-key-here}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your-anon-key-here}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key-here}
NEXTJS_SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key-here}
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID:-your-project-id}

# OpenRouter Configuration
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-sk-or-v1-your-key-here}
NEXT_PUBLIC_OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-sk-or-v1-your-key-here}

# n8n Configuration
N8N_BASE_URL=${N8N_BASE_URL:-http://localhost:5678}
N8N_API_KEY=${N8N_API_KEY:-your-n8n-api-key}
N8N_USER=${N8N_USER:-admin}
N8N_PASSWORD=${N8N_PASSWORD:-admin}

# Crew Webhook URLs (optional - will be auto-configured)
N8N_CREW_CAPTAIN_PICARD_WEBHOOK=${N8N_CREW_CAPTAIN_PICARD:-\${N8N_BASE_URL}/webhook/crew-captain-picard}
N8N_CREW_COMMANDER_DATA_WEBHOOK=${N8N_CREW_COMMANDER_DATA:-\${N8N_BASE_URL}/webhook/crew-commander-data}

# AWS Configuration (for deployment)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION:-us-east-2}
EOF

  chmod 600 "$env_file"
  echo -e "${GREEN}✅ Created $env_file${NC}"
}

# Create .env.local for root (Docker Compose uses this)
create_env_file "."

# Create .env.local for each app
for app_dir in apps/*/; do
  if [ -d "$app_dir" ]; then
    create_env_file "$app_dir"
  fi
done

# Validate required secrets are present
echo -e "\n${YELLOW}🔍 Validating secrets...${NC}"

MISSING_SECRETS=()

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "http://127.0.0.1:54321" ]; then
  echo -e "${YELLOW}⚠️  SUPABASE_URL not found or using local default${NC}"
fi

if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your-anon-key-here" ]; then
  MISSING_SECRETS+=("SUPABASE_ANON_KEY")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your-service-role-key-here" ]; then
  MISSING_SECRETS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "sk-or-v1-your-key-here" ]; then
  MISSING_SECRETS+=("OPENROUTER_API_KEY")
fi

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo -e "\n${RED}❌ Missing required secrets:${NC}"
  for secret in "${MISSING_SECRETS[@]}"; do
    echo -e "${RED}   - $secret${NC}"
  done
  echo -e "\n${YELLOW}📝 Add these to $SHELL_RC:${NC}"
  for secret in "${MISSING_SECRETS[@]}"; do
    echo -e "   export $secret=\"your-value-here\""
  done
  echo -e "\n${YELLOW}Then run: source $SHELL_RC && pnpm secrets:sync${NC}"
  exit 1
fi

echo -e "\n${GREEN}✅ All required secrets found!${NC}"
echo -e "${GREEN}✅ Secret sync complete!${NC}"
echo -e "\n${YELLOW}💡 To update secrets:${NC}"
echo -e "   1. Edit $SHELL_RC"
echo -e "   2. Run: source $SHELL_RC"
echo -e "   3. Run: pnpm secrets:sync"

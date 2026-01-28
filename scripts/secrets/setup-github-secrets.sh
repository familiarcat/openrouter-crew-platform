#!/usr/bin/env bash
#
# GitHub Secrets Setup Script
#
# This script helps you configure all required GitHub secrets for CI/CD.
# It reads from .env.local and terraform outputs, then sets them in GitHub.
#
# Prerequisites:
# - GitHub CLI installed: brew install gh
# - Authenticated: gh auth login
# - Terraform applied: cd terraform && terraform apply
#
# Usage: bash scripts/secrets/setup-github-secrets.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          GitHub Secrets Setup for CI/CD                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI not found. Install with: brew install gh${NC}"
  exit 1
fi
echo -e "${GREEN}✅ GitHub CLI installed${NC}"

# Check authentication
if ! gh auth status &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI not authenticated. Run: gh auth login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"

# Check if in git repository
if ! git rev-parse --git-dir &> /dev/null; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Git repository detected${NC}"

# Check if repository has remote
if ! git remote get-url origin &> /dev/null; then
  echo -e "${RED}❌ No git remote 'origin' found${NC}"
  echo -e "${YELLOW}💡 Add remote with: git remote add origin https://github.com/user/repo${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Git remote configured${NC}"

echo ""
echo -e "${YELLOW}📦 Reading secrets from local files...${NC}"

# Load from .env.local if exists
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
  echo -e "${GREEN}✅ Loaded .env.local${NC}"
else
  echo -e "${YELLOW}⚠️  No .env.local found. Will prompt for values.${NC}"
fi

# Function to prompt for secret value
prompt_secret() {
  local var_name=$1
  local description=$2
  local default_value=$3
  local current_value="${!var_name}"

  if [ -n "$current_value" ] && [ "$current_value" != "your-"* ]; then
    echo -e "${GREEN}   Found $var_name${NC}"
    return 0
  fi

  echo ""
  echo -e "${YELLOW}❓ $description${NC}"
  if [ -n "$default_value" ]; then
    echo -e "${YELLOW}   Default: $default_value${NC}"
  fi
  read -p "   Enter value (or press Enter to skip): " input_value

  if [ -n "$input_value" ]; then
    eval "$var_name='$input_value'"
    echo -e "${GREEN}   ✓ Set $var_name${NC}"
  elif [ -n "$default_value" ]; then
    eval "$var_name='$default_value'"
    echo -e "${GREEN}   ✓ Using default for $var_name${NC}"
  else
    echo -e "${RED}   ✗ Skipped $var_name${NC}"
  fi
}

# AWS Credentials
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AWS Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

prompt_secret "AWS_ACCESS_KEY_ID" "AWS Access Key ID (from IAM user)" ""
prompt_secret "AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key" ""
prompt_secret "AWS_REGION" "AWS Region" "${AWS_REGION:-us-east-2}"

# Get EC2 info from Terraform if available
if [ -d terraform ] && [ -f terraform/terraform.tfstate ]; then
  echo ""
  echo -e "${YELLOW}📋 Reading Terraform outputs...${NC}"
  cd terraform

  if [ -z "$EC2_INSTANCE_ID" ]; then
    EC2_INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")
    if [ -n "$EC2_INSTANCE_ID" ]; then
      echo -e "${GREEN}   Found EC2_INSTANCE_ID from Terraform${NC}"
    fi
  fi

  if [ -z "$EC2_PUBLIC_IP" ]; then
    EC2_PUBLIC_IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
    if [ -n "$EC2_PUBLIC_IP" ]; then
      echo -e "${GREEN}   Found EC2_PUBLIC_IP from Terraform${NC}"
    fi
  fi

  cd ..
fi

prompt_secret "EC2_INSTANCE_ID" "EC2 Instance ID (from Terraform output)" ""
prompt_secret "EC2_PUBLIC_IP" "EC2 Public IP (from Terraform output)" ""

# Supabase Configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Supabase Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

prompt_secret "SUPABASE_URL" "Supabase Project URL" "${SUPABASE_URL}"
prompt_secret "SUPABASE_ANON_KEY" "Supabase Anon Key (public)" "${SUPABASE_ANON_KEY}"
prompt_secret "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key (secret)" "${SUPABASE_SERVICE_ROLE_KEY}"

# Generate database password if not set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo ""
  echo -e "${YELLOW}🔐 No database password set. Generate one?${NC}"
  read -p "   Generate random password? (y/n): " gen_password
  if [ "$gen_password" = "y" ]; then
    SUPABASE_DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
    echo -e "${GREEN}   Generated: $SUPABASE_DB_PASSWORD${NC}"
  else
    prompt_secret "SUPABASE_DB_PASSWORD" "Supabase Database Password" ""
  fi
fi

# OpenRouter Configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  OpenRouter Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

prompt_secret "OPENROUTER_API_KEY" "OpenRouter API Key (from https://openrouter.ai/settings/keys)" "${OPENROUTER_API_KEY}"

# n8n Configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  n8n Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Auto-generate N8N_BASE_URL from EC2_PUBLIC_IP
if [ -n "$EC2_PUBLIC_IP" ] && [ -z "$N8N_BASE_URL" ]; then
  N8N_BASE_URL="http://${EC2_PUBLIC_IP}:5678"
  echo -e "${GREEN}   Generated N8N_BASE_URL: $N8N_BASE_URL${NC}"
fi

prompt_secret "N8N_BASE_URL" "n8n Base URL" "$N8N_BASE_URL"
prompt_secret "N8N_API_KEY" "n8n API Key (generate in n8n Settings → API)" "${N8N_API_KEY}"

# Generate encryption key if not set
if [ -z "$N8N_ENCRYPTION_KEY" ]; then
  echo ""
  echo -e "${YELLOW}🔐 No n8n encryption key set. Generate one?${NC}"
  read -p "   Generate random encryption key? (y/n): " gen_key
  if [ "$gen_key" = "y" ]; then
    N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
    echo -e "${GREEN}   Generated: $N8N_ENCRYPTION_KEY${NC}"
  else
    prompt_secret "N8N_ENCRYPTION_KEY" "n8n Encryption Key (32+ characters)" ""
  fi
fi

# Redis Configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Redis Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -z "$REDIS_PASSWORD" ]; then
  REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '=' | tr '+/' '-_')
  echo -e "${GREEN}   Generated REDIS_PASSWORD: $REDIS_PASSWORD${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SECRETS_TO_SET=()
SECRETS_MISSING=()

# Check all required secrets
check_secret() {
  local var_name=$1
  local var_value="${!var_name}"

  if [ -n "$var_value" ] && [ "$var_value" != "your-"* ]; then
    SECRETS_TO_SET+=("$var_name")
    echo -e "${GREEN}✅ $var_name${NC}"
  else
    SECRETS_MISSING+=("$var_name")
    echo -e "${RED}❌ $var_name (missing)${NC}"
  fi
}

check_secret "AWS_ACCESS_KEY_ID"
check_secret "AWS_SECRET_ACCESS_KEY"
check_secret "EC2_INSTANCE_ID"
check_secret "EC2_PUBLIC_IP"
check_secret "SUPABASE_URL"
check_secret "SUPABASE_ANON_KEY"
check_secret "SUPABASE_SERVICE_ROLE_KEY"
check_secret "SUPABASE_DB_PASSWORD"
check_secret "OPENROUTER_API_KEY"
check_secret "N8N_BASE_URL"
check_secret "N8N_API_KEY"
check_secret "N8N_ENCRYPTION_KEY"
check_secret "REDIS_PASSWORD"

if [ ${#SECRETS_MISSING[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ Missing required secrets:${NC}"
  for secret in "${SECRETS_MISSING[@]}"; do
    echo -e "${RED}   - $secret${NC}"
  done
  echo ""
  echo -e "${YELLOW}💡 Re-run this script after setting missing values${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All ${#SECRETS_TO_SET[@]} secrets ready!${NC}"
echo ""

# Confirm before setting
echo -e "${YELLOW}❓ Set these secrets in GitHub?${NC}"
echo -e "   Repository: $(gh repo view --json nameWithOwner -q .nameWithOwner)"
read -p "   Proceed? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo -e "${YELLOW}⚠️  Aborted. No secrets were set.${NC}"
  exit 0
fi

# Set secrets in GitHub
echo ""
echo -e "${YELLOW}📤 Setting GitHub secrets...${NC}"

set_github_secret() {
  local secret_name=$1
  local secret_value="${!secret_name}"

  if [ -z "$secret_value" ]; then
    echo -e "${RED}   ✗ Skipped $secret_name (empty)${NC}"
    return 1
  fi

  if echo "$secret_value" | gh secret set "$secret_name" 2>/dev/null; then
    echo -e "${GREEN}   ✓ Set $secret_name${NC}"
    return 0
  else
    echo -e "${RED}   ✗ Failed to set $secret_name${NC}"
    return 1
  fi
}

SUCCESS_COUNT=0
FAIL_COUNT=0

for secret in "${SECRETS_TO_SET[@]}"; do
  if set_github_secret "$secret"; then
    ((SUCCESS_COUNT++))
  else
    ((FAIL_COUNT++))
  fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Successfully set: $SUCCESS_COUNT secrets${NC}"

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${RED}❌ Failed to set: $FAIL_COUNT secrets${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Verify secrets:${NC}"
echo -e "   gh secret list"
echo ""
echo -e "${GREEN}✨ Setup complete! You can now deploy via GitHub Actions.${NC}"
echo ""
echo -e "${YELLOW}📖 Next steps:${NC}"
echo -e "   1. Commit and push code: git push origin main"
echo -e "   2. Go to: GitHub → Actions → Deploy to AWS EC2"
echo -e "   3. Click 'Run workflow' and select environment"
echo ""

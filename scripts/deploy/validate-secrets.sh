#!/usr/bin/env bash
# validate-secrets.sh
# Pre-deploy guard: confirms all required GitHub secrets exist before triggering a deployment.
# Usage: bash scripts/deploy/validate-secrets.sh
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v gh &>/dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found. Install: brew install gh${NC}"
    exit 1
fi
if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ Not authenticated. Run: gh auth login${NC}"
    exit 1
fi

# All secrets required by deploy-universal.yml
REQUIRED_SECRETS=(
    # Vercel
    VERCEL_TOKEN
    VERCEL_ORG_ID
    VERCEL_PROJECT_ID

    # AWS
    AWS_ROLE_ARN
    AWS_REGION
    EC2_INSTANCE_ID
    ECR_REPOSITORY

    # OpenRouter
    OPENROUTER_API_KEY

    # Supabase (public — used as Next.js build args)
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY

    # Supabase (server-side secrets)
    SUPABASE_URL
    SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY
    SUPABASE_DB_PASSWORD

    # n8n
    N8N_BASE_URL
    N8N_API_KEY
    N8N_ENCRYPTION_KEY

    # Redis
    REDIS_PASSWORD
)

echo "🔍 Checking GitHub secrets for $(gh repo view --json nameWithOwner -q .nameWithOwner)..."
echo ""

EXISTING=$(gh secret list --json name -q '.[].name' 2>/dev/null || echo "")
MISSING=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$EXISTING" | grep -qx "$secret"; then
        echo -e "   ${GREEN}✅${NC} $secret"
    else
        echo -e "   ${RED}❌${NC} $secret  ${YELLOW}← MISSING${NC}"
        MISSING+=("$secret")
    fi
done

echo ""

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}❌ ${#MISSING[@]} secret(s) missing. Add them:${NC}"
    for s in "${MISSING[@]}"; do
        echo "   gh secret set $s"
    done
    echo ""
    echo "Then re-run this script before deploying."
    exit 1
fi

echo -e "${GREEN}✅ All ${#REQUIRED_SECRETS[@]} required secrets are set. Ready to ship.${NC}"
echo "   Run: pnpm ship [staging|production]"

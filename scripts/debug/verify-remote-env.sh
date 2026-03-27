#!/bin/bash

# ==============================================================================
# Remote Environment Verification Script
# Verifies that .env.production on EC2 contains all expected variables.
# Usage: ./scripts/debug/verify-remote-env.sh [environment]
# ==============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-staging}"
AWS_REGION=$(aws configure get region || echo "us-east-2")
APP_DIR="/home/ec2-user/openrouter-crew-platform"

echo -e "${BLUE}🔍 Verifying remote .env.production for ${YELLOW}$ENVIRONMENT${NC}..."

# 1. Resolve Instance ID using tags
INSTANCE_ID=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Environment,Values=$ENVIRONMENT" "Name=instance-state-name,Values=running" \
    --query "Reservations[0].Instances[0].InstanceId" \
    --output text)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}❌ Error: No running instance found for environment: $ENVIRONMENT${NC}"
    exit 1
fi

echo -e "📡 Connected to Instance: ${BLUE}$INSTANCE_ID${NC}"

# 2. List of expected keys from deploy-full.sh
EXPECTED_KEYS=(
    "ECR_REGISTRY"
    "ECR_REPOSITORY"
    "IMAGE_TAG"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_DB_PASSWORD"
    "OPENROUTER_API_KEY"
    "N8N_BASE_URL"
    "N8N_WEBHOOK_URL"
    "N8N_API_KEY"
    "N8N_ENCRYPTION_KEY"
    "REDIS_PASSWORD"
)

# 3. Fetch .env.production content via SSM
echo -e "Read remote .env file..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"cat $APP_DIR/.env.production\"]}" \
    --query "Command.CommandId" \
    --output text)

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"

REMOTE_ENV_CONTENT=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "StandardOutputContent" \
    --output text)

# 4. Validation Logic
FAILED=0
echo -e "\n${BLUE}📋 Variable Check Results:${NC}"
for KEY in "${EXPECTED_KEYS[@]}"; do
    if echo "$REMOTE_ENV_CONTENT" | grep -q "^${KEY}="; then
        # Check if value is not empty
        VALUE=$(echo "$REMOTE_ENV_CONTENT" | grep "^${KEY}=" | cut -d'=' -f2)
        if [ -n "$VALUE" ]; then
            echo -e "  ${GREEN}✅ $KEY${NC} is present and set."
        else
            echo -e "  ${RED}❌ $KEY${NC} is present but EMPTY."
            FAILED=1
        fi
    else
        echo -e "  ${RED}❌ $KEY${NC} is MISSING."
        FAILED=1
    fi
done

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All expected environment variables are correctly configured!${NC}"
else
    echo -e "\n${RED}❌ Verification failed. Some variables are missing or empty.${NC}"
    exit 1
fi
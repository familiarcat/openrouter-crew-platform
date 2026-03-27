#!/bin/bash

# ==============================================================================
# n8n Restore Integrity Test
# Verifies path stripping and credential persistence after an n8n restore.
# Usage: ./scripts/debug/test-n8n-restore-integrity.sh [environment]
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
VOLUME_NAME="openrouter-crew-platform_n8n-data"
APP_DIR="/home/ec2-user/openrouter-crew-platform"

echo -e "${BLUE}🔍 Starting n8n Restore Integrity Check on ${YELLOW}$ENVIRONMENT${NC}..."

# 1. Resolve Instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Environment,Values=$ENVIRONMENT" "Name=instance-state-name,Values=running" \
    --query "Reservations[0].Instances[0].InstanceId" \
    --output text)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}❌ Error: No running instance found for environment: $ENVIRONMENT${NC}"
    exit 1
fi

# 2. Define Verification Commands
REMOTE_CHECK=$(cat <<EOF
echo "--- Checking Volume Structure (Path Stripping) ---"
# Check if files are correctly stripped to the root of the volume
ROOT_FILES=\$(docker run --rm -v $VOLUME_NAME:/data alpine ls -A /data)
echo "Files in volume root:"
echo "\$ROOT_FILES"

if echo "\$ROOT_FILES" | grep -q "^config$"; then
    echo "✅ SUCCESS: 'config' found in root. Path stripping worked."
else
    if echo "\$ROOT_FILES" | grep -q "^\.n8n$"; then
        echo "❌ FAILURE: Found nested '.n8n' directory. Path stripping FAILED."
    else
        echo "❌ FAILURE: Critical n8n files missing from volume."
    fi
fi

echo "--- Checking Credential Persistence ---"
if [ -f "$APP_DIR/.env.production" ]; then
    ENV_KEY=\$(grep "^N8N_ENCRYPTION_KEY=" "$APP_DIR/.env.production" | cut -d'=' -f2)
    if [ -n "\$ENV_KEY" ]; then
        echo "✅ SUCCESS: N8N_ENCRYPTION_KEY is present in .env.production."
    else
        echo "❌ FAILURE: N8N_ENCRYPTION_KEY is missing or empty."
    fi
else
    echo "❌ FAILURE: .env.production file missing."
fi
EOF
)

ENCODED_SCRIPT=$(echo "$REMOTE_CHECK" | base64 | tr -d '\n')

# 3. Execute via SSM
echo "Executing integrity checks via SSM..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" \
    --query "Command.CommandId" \
    --output text)

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"

RESULT=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "StandardOutputContent" \
    --output text)

echo -e "\n${BLUE}📊 Integrity Report:${NC}"
echo "--------------------------------------------------"
echo "$RESULT"
echo "--------------------------------------------------"
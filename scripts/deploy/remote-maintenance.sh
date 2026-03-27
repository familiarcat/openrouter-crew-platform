#!/bin/bash

# ==============================================================================
# Remote Maintenance Script
# Performs Docker cleanup and log rotation on EC2 via AWS SSM.
# Usage: ./scripts/deploy/remote-maintenance.sh [environment]
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

echo -e "${BLUE}🧹 Starting remote maintenance for ${YELLOW}$ENVIRONMENT${NC}..."

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

echo -e "📡 Target Instance: ${BLUE}$INSTANCE_ID${NC}"

# 2. Define Maintenance Commands
# We prune images older than 168h (7 days) to keep recent deployment layers for fast rollbacks
REMOTE_CMDS=$(cat <<EOF
echo "--- Starting Docker Cleanup ---"
docker image prune -af --filter "until=168h"
docker container prune -f
docker network prune -f

echo "--- Forcing Log Rotation ---"
if [ -f /etc/logrotate.d/openrouter-crew ]; then
    logrotate -f /etc/logrotate.d/openrouter-crew
    echo "Logrotate triggered successfully."
else
    echo "Warning: /etc/logrotate.d/openrouter-crew not found."
fi

echo "--- Vacuuming System Logs ---"
journalctl --vacuum-time=7d

echo "--- Verifying Supabase Database Integrity ---"
APP_DIR="/home/ec2-user/openrouter-crew-platform"
if [ -f "\$APP_DIR/.env.production" ]; then
    # Extract DB password from the production environment file
    DB_PWD=\$(grep "^SUPABASE_DB_PASSWORD=" "\$APP_DIR/.env.production" | cut -d'=' -f2)
    if docker ps -q -f name=openrouter-supabase-db > /dev/null; then
        echo "Running schema-only integrity test..."
        if docker exec -e PGPASSWORD="\$DB_PWD" openrouter-supabase-db pg_dump -U postgres postgres --schema-only > /tmp/integrity_check.sql; then
            if [ -s /tmp/integrity_check.sql ]; then
                echo "✅ Database integrity verified (Schema dump successful)."
                rm /tmp/integrity_check.sql
            else
                echo "❌ Database integrity check failed: Generated dump is empty."
                exit 1
            fi
        else
            echo "❌ Database integrity check failed: pg_dump execution failed."
            exit 1
        fi
    else
        echo "⚠️  Supabase DB container is not running. Skipping integrity check."
    fi
fi

echo "--- Disk Space Summary ---"
df -h /
EOF
)

ENCODED_SCRIPT=$(echo "$REMOTE_CMDS" | base64 | tr -d '\n')

# 3. Send SSM Command
echo -e "Sending maintenance commands via SSM..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" \
    --query "Command.CommandId" \
    --output text)

echo -e "Command sent (ID: $COMMAND_ID). Waiting for completion..."

# 4. Wait and Report
aws ssm wait command-executed \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION"

STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Status" \
    --output text)

if [ "$STATUS" == "Success" ]; then
    echo -e "\n${GREEN}✅ Maintenance completed successfully!${NC}"
    aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "StandardOutputContent" --output text
else
    echo -e "\n${RED}❌ Maintenance failed with status: $STATUS${NC}"
    aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "StandardErrorContent" --output text
    exit 1
fi
#!/bin/bash

# ==============================================================================
# Remote n8n Data Restore Script
# Automates the restoration of the latest n8n S3 backup to the EC2 instance.
# Usage: ./scripts/deploy/remote-n8n-restore.sh [environment] [--file filename] [--dry-run]
# ==============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="staging"
DRY_RUN=false
BACKUP_FILE=""

# Load local environment variables for secrets (like webhooks)
if [ -f ".env.local" ]; then
    source .env.local
elif [ -f ".env" ]; then
    source .env
fi

# Notification webhook (Slack or Discord)
NOTIFICATION_WEBHOOK_URL="${NOTIFICATION_WEBHOOK_URL:-}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run|-d)
      DRY_RUN=true
      shift
      ;;
    --file|-f)
      BACKUP_FILE="$2"
      shift 2
      ;;
    *)
      ENVIRONMENT="$1"
      shift
      ;;
  esac
done

AWS_REGION=$(aws configure get region || echo "us-east-2")

echo -e "${BLUE}🔄 Starting Remote n8n Restore for ${YELLOW}$ENVIRONMENT${NC}${DRY_RUN:+ (DRY RUN)}..."

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

# 2. Resolve Bucket Name
BUCKET_NAME="openrouter-crew-platform-backups-$ENVIRONMENT"

# 3. Determine Backup File
if [ -n "$BACKUP_FILE" ]; then
    [[ "$BACKUP_FILE" != n8n/* ]] && SELECTED_BACKUP="n8n/$BACKUP_FILE" || SELECTED_BACKUP="$BACKUP_FILE"
else
    echo -e "Searching for latest n8n backup..."
    LATEST_BACKUP=$(aws s3 ls "s3://$BUCKET_NAME/n8n/" --recursive | sort | tail -n 1 | awk '{print $4}')
    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ Error: No n8n backups found in s3://$BUCKET_NAME/n8n/${NC}"
        exit 1
    fi
    SELECTED_BACKUP="$LATEST_BACKUP"
fi
echo -e "Selected Backup: ${GREEN}$SELECTED_BACKUP${NC}"

# 4. Construct Remote Commands
REMOTE_CMDS=$(cat <<EOF
set -e
APP_DIR="/home/ec2-user/openrouter-crew-platform"
BACKUP_URI="s3://$BUCKET_NAME/$SELECTED_BACKUP"
TEMP_FILE="/tmp/n8n_restore.tar.gz"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
SNAPSHOT_FILE="pre_restore_n8n_\${TIMESTAMP}.tar.gz"
VOLUME_NAME="openrouter-crew-platform_n8n-data"

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would download \$BACKUP_URI"
    echo "[DRY RUN] Would stop n8n service"
    echo "[DRY RUN] Would create snapshot s3://$BUCKET_NAME/n8n/\$SNAPSHOT_FILE"
    echo "[DRY RUN] Would extract backup into \$VOLUME_NAME"
    echo "[DRY RUN] Would restart dashboard service to refresh workflow IDs"
else
    echo "Downloading backup..."
    aws s3 cp "\$BACKUP_URI" "\$TEMP_FILE"

    echo "Stopping n8n service..."
    docker-compose -f "\$APP_DIR/docker-compose.prod.yml" stop n8n

    echo "Creating safety snapshot..."
    docker run --rm -v "\$VOLUME_NAME":/data -v /tmp:/backup alpine tar -czf /backup/\$SNAPSHOT_FILE -C /data .
    aws s3 cp "/tmp/\$SNAPSHOT_FILE" "s3://$BUCKET_NAME/n8n/\$SNAPSHOT_FILE"
    rm -f "/tmp/\$SNAPSHOT_FILE"

    echo "Restoring data..."
    # Clear volume first
    docker run --rm -v "\$VOLUME_NAME":/data alpine sh -c "rm -rf /data/.* /data/* 2>/dev/null || true"
    # Extract (strip-components=1 because backup contains the .n8n directory)
    docker run --rm -v "\$VOLUME_NAME":/data -v /tmp:/backup alpine tar -xzf /backup/n8n_restore.tar.gz -C /data --strip-components=1

    echo "Restarting services..."
    docker-compose -f "\$APP_DIR/docker-compose.prod.yml" start n8n
    docker-compose -f "\$APP_DIR/docker-compose.prod.yml" restart dashboard
    rm -f "\$TEMP_FILE"

    if [ -n "\$NOTIFICATION_WEBHOOK_URL" ]; then
        echo "Sending completion notification..."
        # Format message for both Slack and Discord
        MSG="🚀 *n8n Restore Complete* ($ENVIRONMENT)\n\n• *Instance:* $INSTANCE_ID\n• *Restored From:* $SELECTED_BACKUP\n• *Safety Snapshot:* \$SNAPSHOT_FILE"
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"\$MSG\", \"content\":\"\$MSG\"}" \
            "\$NOTIFICATION_WEBHOOK_URL" > /dev/null
    fi
fi
echo "✅ Restore operation complete."
EOF
)

ENCODED_SCRIPT=$(echo "$REMOTE_CMDS" | base64 | tr -d '\n')

echo "Sending command to instance $INSTANCE_ID..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" \
    --query "Command.CommandId" \
    --output text)

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"
echo -e "${GREEN}🎉 n8n data restore successful!${NC}"
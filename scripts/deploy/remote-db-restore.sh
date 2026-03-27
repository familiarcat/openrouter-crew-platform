#!/bin/bash

# ==============================================================================
# Remote Database Restore Script
# Automates the restoration of the latest S3 backup to the EC2 Supabase container.
# Usage: ./scripts/deploy/remote-db-restore.sh [environment] [--file filename]
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

echo -e "${BLUE}🔄 Starting Remote Database Restore for ${YELLOW}$ENVIRONMENT${NC}${DRY_RUN:+ (DRY RUN)}..."

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

# 2. Resolve Bucket Name (Fallback to naming convention if CF output unavailable)
BUCKET_NAME="openrouter-crew-platform-backups-$ENVIRONMENT"
echo -e "Target Bucket: ${BLUE}$BUCKET_NAME${NC}"

# 3. Determine Backup File to Use
if [ -n "$BACKUP_FILE" ]; then
    # Ensure the path prefix is correct if just the filename was provided
    [[ "$BACKUP_FILE" != database/* ]] && SELECTED_BACKUP="database/$BACKUP_FILE" || SELECTED_BACKUP="$BACKUP_FILE"
    echo -e "Using specified backup: ${GREEN}$SELECTED_BACKUP${NC}"
else
    echo -e "Searching for latest backup..."
    LATEST_BACKUP=$(aws s3 ls "s3://$BUCKET_NAME/database/" --recursive | sort | tail -n 1 | awk '{print $4}')

    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ Error: No backups found in s3://$BUCKET_NAME/database/${NC}"
        exit 1
    fi
    SELECTED_BACKUP="$LATEST_BACKUP"
    echo -e "Found latest backup: ${GREEN}$SELECTED_BACKUP${NC}"
fi

# 4. User Confirmation
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database on $ENVIRONMENT.${NC}"
    read -p "   Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# 5. Construct Remote Restore Commands
REMOTE_CMDS=$(cat <<EOF
set -e
DRY_RUN=${DRY_RUN}
NOTIFICATION_WEBHOOK_URL="${NOTIFICATION_WEBHOOK_URL}"
APP_DIR="/home/ec2-user/openrouter-crew-platform"
BACKUP_URI="s3://$BUCKET_NAME/$SELECTED_BACKUP"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
SNAPSHOT_FILE="pre_restore_snapshot_\${TIMESTAMP}.sql.gz"
TEMP_FILE="/tmp/restore.sql.gz"

if [ "\$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would download \$BACKUP_URI to \$TEMP_FILE"
else
    echo "Downloading backup from S3..."
    aws s3 cp "\$BACKUP_URI" "\$TEMP_FILE"
fi

if [ -f "\$APP_DIR/.env.production" ]; then
    DB_PWD=\$(grep "^SUPABASE_DB_PASSWORD=" "\$APP_DIR/.env.production" | cut -d'=' -f2)
    
    if [ "\$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would stop dashboard, n8n, and studio services."
        echo "[DRY RUN] Would create pre-restore snapshot: s3://$BUCKET_NAME/database/\$SNAPSHOT_FILE"
        echo "[DRY RUN] Would execute: zcat \$TEMP_FILE | docker exec -i openrouter-supabase-db psql ..."
        echo "[DRY RUN] Would display database size and project count summary."
        echo "[DRY RUN] Would restart all services."
    else
        echo "Stopping platform services to prevent lock contention..."
        docker-compose -f "\$APP_DIR/docker-compose.prod.yml" stop dashboard n8n studio
        
        echo "Creating pre-restore safety snapshot..."
        docker exec -e PGPASSWORD="\$DB_PWD" openrouter-supabase-db pg_dump -U postgres postgres | gzip > "/tmp/\$SNAPSHOT_FILE"
        aws s3 cp "/tmp/\$SNAPSHOT_FILE" "s3://$BUCKET_NAME/database/\$SNAPSHOT_FILE"
        rm -f "/tmp/\$SNAPSHOT_FILE"
        echo "✅ Safety snapshot created: s3://$BUCKET_NAME/database/\$SNAPSHOT_FILE"

        echo "Restoring database into Supabase container..."
        zcat "\$TEMP_FILE" | docker exec -i -e PGPASSWORD="\$DB_PWD" openrouter-supabase-db psql -U postgres -d postgres
        
        echo "Gathering post-restore summary..."
        DB_SIZE=\$(docker exec -e PGPASSWORD="\$DB_PWD" openrouter-supabase-db psql -U postgres -d postgres -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" | xargs)
        PROJECT_COUNT=\$(docker exec -e PGPASSWORD="\$DB_PWD" openrouter-supabase-db psql -U postgres -d postgres -t -c "SELECT count(*) FROM projects;" 2>/dev/null | xargs || echo "N/A")
        echo "📊 Database Size: \$DB_SIZE"
        echo "📊 Projects Count: \$PROJECT_COUNT"

        echo "Restarting platform services..."
        docker-compose -f "\$APP_DIR/docker-compose.prod.yml" start
        
        if [ -n "\$NOTIFICATION_WEBHOOK_URL" ]; then
            echo "Sending completion notification..."
            # Format message for both Slack and Discord
            MSG="🚀 *Database Restore Complete* ($ENVIRONMENT)\n\n• *Instance:* $INSTANCE_ID\n• *Restored From:* $SELECTED_BACKUP\n• *Safety Snapshot:* \$SNAPSHOT_FILE\n• *DB Size:* \$DB_SIZE\n• *Projects Count:* \$PROJECT_COUNT"
            curl -s -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"\$MSG\", \"content\":\"\$MSG\"}" \
                "\$NOTIFICATION_WEBHOOK_URL" > /dev/null
        fi

        rm -f "\$TEMP_FILE"
    fi
    
    echo "✅ Restore operation simulation complete."
else
    echo "❌ Error: .env.production not found on host."
    exit 1
fi
EOF
)

ENCODED_SCRIPT=$(echo "$REMOTE_CMDS" | base64 | tr -d '\n')

# 6. Execute via SSM
log_step() { echo -e "${BLUE}👉 \$1${NC}"; }
log_step "Sending restore command to instance $INSTANCE_ID..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" \
    --query "Command.CommandId" \
    --output text)

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"

STATUS=$(aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "Status" --output text)

if [ "$STATUS" == "Success" ]; then
    echo -e "\n${GREEN}🎉 Database restore complete! Platform is recovering.${NC}"
else
    echo -e "\n${RED}❌ Restore failed on EC2.${NC}"
    aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "StandardErrorContent" --output text
    exit 1
fi
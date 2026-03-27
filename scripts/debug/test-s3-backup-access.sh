#!/bin/bash

# ==============================================================================
# S3 Backup Access Test Script
# Commands the EC2 instance via SSM to verify write access to the backup bucket.
# Usage: ./scripts/debug/test-s3-backup-access.sh [environment]
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
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${BLUE}📡 Starting S3 Access Test for ${YELLOW}$ENVIRONMENT${NC}..."

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

# 2. Resolve Bucket Name (Try Terraform first, then fallback to naming convention)
echo "Resolving backup bucket name..."
BUCKET_NAME=""
if [ -d "$ROOT_DIR/terraform" ]; then
    cd "$ROOT_DIR/terraform"
    # We ignore errors here in case workspace isn't initialized locally
    terraform workspace select "$ENVIRONMENT" > /dev/null 2>&1 || true
    BUCKET_NAME=$(terraform output -raw backup_bucket_name 2>/dev/null || echo "")
fi

if [ -z "$BUCKET_NAME" ]; then
    BUCKET_NAME="openrouter-crew-platform-backups-$ENVIRONMENT"
    echo -e "${YELLOW}⚠️  Could not read Terraform output. Using fallback: $BUCKET_NAME${NC}"
else
    echo -e "✅ Found Bucket: ${BLUE}$BUCKET_NAME${NC}"
fi

# 3. Construct SSM Test Command
# We create a unique filename to avoid collisions
TEST_FILE="s3_connection_test_$(date +%s).txt"
REMOTE_COMMAND="echo 'S3 Access Test from $INSTANCE_ID' > /tmp/$TEST_FILE && \
                aws s3 cp /tmp/$TEST_FILE s3://$BUCKET_NAME/tests/$TEST_FILE && \
                rm /tmp/$TEST_FILE"

echo -e "Sending test command to instance ${BLUE}$INSTANCE_ID${NC}..."

# 4. Execute SSM Command
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"$REMOTE_COMMAND\"]}" \
    --query "Command.CommandId" \
    --output text)

echo "Command sent (ID: $COMMAND_ID). Waiting for verification..."
aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"

STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Status" \
    --output text)

if [ "$STATUS" == "Success" ]; then
    echo -e "\n${GREEN}✅ SUCCESS: EC2 instance can write to $BUCKET_NAME${NC}"
    echo "Verified via SSM execution."
    
    # Optional: Verify the file exists from local machine too
    if aws s3 ls "s3://$BUCKET_NAME/tests/$TEST_FILE" > /dev/null 2>&1; then
        echo "Verified via Local S3 API: File exists in bucket."
    fi
else
    echo -e "\n${RED}❌ FAILURE: EC2 instance could not write to S3.${NC}"
    aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "StandardErrorContent" --output text
    exit 1
fi
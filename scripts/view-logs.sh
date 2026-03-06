#!/bin/bash

# ==============================================================================
# View Docker Logs for Deployed Instance
# Usage: ./scripts/view-logs.sh [environment] [follow]
# Example: ./scripts/view-logs.sh demo -f
# ==============================================================================

# Load environment variables from .env.local if present
if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

ENVIRONMENT=${1:-demo}
FOLLOW=$2
REGION=${AWS_REGION:-us-east-2}

echo "🔍 Finding latest instance for environment: $ENVIRONMENT (Region: $REGION)..."

# Find the most recently launched instance with the matching tag
# We remove the 'running' filter to detect pending/stopped instances and report status
LATEST_INSTANCE_INFO=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=crew-agents-$ENVIRONMENT" \
    --query "sort_by(Reservations[].Instances[], &LaunchTime)[-1].[InstanceId, State.Name, PublicIpAddress]" \
    --output text \
    --region $REGION)

if [ -z "$LATEST_INSTANCE_INFO" ] || [ "$LATEST_INSTANCE_INFO" == "None" ]; then
    echo "❌ No instance found with tag: crew-agents-$ENVIRONMENT"
    echo "   Check your region ($REGION) or deployment status."
    exit 1
fi

read -r INSTANCE_ID STATE PUBLIC_IP <<< "$LATEST_INSTANCE_INFO"

echo "   Instance ID: $INSTANCE_ID"
echo "   State:       $STATE"
echo "   Public IP:   ${PUBLIC_IP:-None}"

if [ "$STATE" != "running" ]; then
    echo "⚠️  Instance is not running. Cannot connect."
    exit 1
fi

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
    echo "❌ Instance has no Public IP."
    exit 1
fi

KEY_NAME="crew-agents-${ENVIRONMENT}-key"
KEY_FILE="$HOME/.ssh/crew-deploy-keys/$KEY_NAME.pem"

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ SSH key not found at $KEY_FILE. Did the deployment succeed?"
    exit 1
fi

echo "✅ Connection established."
echo "📋 Fetching logs..."

ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$PUBLIC_IP "docker logs $FOLLOW crew-agents"
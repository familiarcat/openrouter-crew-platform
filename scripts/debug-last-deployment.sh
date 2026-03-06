#!/bin/bash

# ==============================================================================
# Debug Last Deployment
# Finds the most recent instance (running or terminated) and shows its status/logs.
# Usage: ./scripts/debug-last-deployment.sh [environment]
# ==============================================================================

# Load environment variables from .env.local if present
if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

ENVIRONMENT=${1:-demo}
REGION=${AWS_REGION:-us-east-2}

echo "🔍 Debugging deployment for environment: $ENVIRONMENT (Region: $REGION)"

# Get the most recent instance regardless of state
INSTANCE_INFO=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=crew-agents-$ENVIRONMENT" \
    --query "sort_by(Reservations[].Instances[], &LaunchTime)[-1].[InstanceId, State.Name, StateTransitionReason, PublicIpAddress]" \
    --output text \
    --region $REGION)

if [ -z "$INSTANCE_INFO" ] || [ "$INSTANCE_INFO" == "None" ]; then
    echo "❌ No instance found for crew-agents-$ENVIRONMENT"
    exit 1
fi

read -r INSTANCE_ID STATE REASON PUBLIC_IP <<< "$INSTANCE_INFO"

echo "📋 Instance Details:"
echo "   ID:     $INSTANCE_ID"
echo "   State:  $STATE"
echo "   Reason: $REASON"
echo "   IP:     ${PUBLIC_IP:-N/A}"

echo ""
echo "📜 Fetching System Console Output (Kernel/Boot Logs)..."
echo "-----------------------------------------------------"
aws ec2 get-console-output --instance-id "$INSTANCE_ID" --latest --output text --region "$REGION"
echo "-----------------------------------------------------"
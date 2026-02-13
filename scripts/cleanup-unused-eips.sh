#!/bin/bash

# This script finds and releases unassociated Elastic IPs to resolve AddressLimitExceeded errors.

set -e

REGION=$(aws configure get region)
echo "🔍 Checking for unused Elastic IPs in region $REGION..."

# Get unassociated IPs: PublicIp and AllocationId
UNUSED=$(aws ec2 describe-addresses --query 'Addresses[?AssociationId==`null`].[PublicIp, AllocationId]' --output text)

if [ -z "$UNUSED" ]; then
    echo "✅ No unassociated Elastic IPs found."
    echo "You may have reached the AWS limit (usually 5) with active instances."
    echo "Run 'terraform destroy' in other project directories if applicable."
    exit 0
fi

echo "⚠️  Found the following unassociated Elastic IPs:"
echo "$UNUSED"
echo ""

while read -r IP ALLOC_ID; do
    if [ -n "$ALLOC_ID" ]; then
        echo "   Releasing $IP ($ALLOC_ID)..."
        aws ec2 release-address --allocation-id "$ALLOC_ID"
    fi
done <<< "$UNUSED"

echo "✅ Cleanup complete. You can now retry 'terraform apply'."
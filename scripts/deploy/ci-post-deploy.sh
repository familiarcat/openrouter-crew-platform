#!/bin/bash

# ==============================================================================
# CI Post-Deployment Orchestration
# Handles domain configuration and DNS updates after successful EC2 deployment.
# ==============================================================================

set -e

ENVIRONMENT=$1
AWS_REGION="${AWS_REGION:-us-east-2}"

if [ -z "$ENVIRONMENT" ]; then
    echo "❌ Error: Environment argument is required."
    echo "Usage: ./scripts/ci-post-deploy.sh <environment>"
    exit 1
fi

# 1. Resolve Base Domain based on Environment
case "$ENVIRONMENT" in
  production|prod)
    BASE_DOMAIN="pbradygeorgen.com"
    ;;
  staging)
    BASE_DOMAIN="staging.pbradygeorgen.com"
    ;;
  uat)
    BASE_DOMAIN="uat.pbradygeorgen.com"
    ;;
  test)
    BASE_DOMAIN="test.pbradygeorgen.com"
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "🌍 Configuring domains for environment: $ENVIRONMENT"
echo "   Base Domain: $BASE_DOMAIN"

# 2. Define Service Subdomains
DASHBOARD_DOMAIN="dashboard.${BASE_DOMAIN}"
AUTOMATION_DOMAIN="automation.${BASE_DOMAIN}"
SUPABASE_DOMAIN="supabase.${BASE_DOMAIN}"

# 3. Resolve Public IP
# Prefer env var (from GitHub Secrets), fallback to AWS CLI lookup if instance ID is known
if [ -z "$EC2_PUBLIC_IP" ] && [ -n "$EC2_INSTANCE_ID" ]; then
    echo "🔄 Resolving Public IP for Instance $EC2_INSTANCE_ID..."
    EC2_PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$EC2_INSTANCE_ID" --query "Reservations[0].Instances[0].PublicIpAddress" --output text --region "$AWS_REGION")
fi

if [ -z "$EC2_PUBLIC_IP" ]; then
    echo "❌ Error: EC2_PUBLIC_IP is not set and could not be resolved."
    exit 1
fi

echo "   Target IP: $EC2_PUBLIC_IP"

# 4. Update Route 53 Records
echo "🚀 Updating Route 53 records..."

# Find Hosted Zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "${BASE_DOMAIN}." --query "HostedZones[0].Id" --output text --region "$AWS_REGION")

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" == "None" ]; then
    echo "⚠️  Hosted Zone for ${BASE_DOMAIN} not found. Skipping DNS update."
    echo "   Please ensure a Hosted Zone exists for ${BASE_DOMAIN}."
    exit 0
fi

# Function to upsert A record
upsert_record() {
    local DOMAIN=$1
    local IP=$2
    echo "   - Upserting A record: $DOMAIN -> $IP"
    
    aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --region "$AWS_REGION" --change-batch "{
        \"Comment\": \"CI/CD Update\",
        \"Changes\": [{\"Action\": \"UPSERT\", \"ResourceRecordSet\": {\"Name\": \"$DOMAIN\", \"Type\": \"A\", \"TTL\": 300, \"ResourceRecords\": [{\"Value\": \"$IP\"}]}}]
    }" > /dev/null
}

upsert_record "$DASHBOARD_DOMAIN" "$EC2_PUBLIC_IP"
upsert_record "$AUTOMATION_DOMAIN" "$EC2_PUBLIC_IP"
upsert_record "$SUPABASE_DOMAIN" "$EC2_PUBLIC_IP"

echo "✅ Domain configuration complete."
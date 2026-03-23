#!/usr/bin/env bash
set -euo pipefail

#############################################
# CI / CD UNIFIED DEPLOY SCRIPT
#############################################

ENVIRONMENT="${1:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# ---- ENV CONFIG ----
case "$ENVIRONMENT" in
  prod)
    BASE_DOMAIN="pbradygeorgen.com"
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

DASHBOARD_DOMAIN="dashboard.${BASE_DOMAIN}"
AUTOMATION_DOMAIN="automation.${BASE_DOMAIN}"
SUPABASE_DOMAIN="supabase.${BASE_DOMAIN}"

echo "🚀 CI Deploy → $ENVIRONMENT"
echo "🌐 Domains:"
echo "  - $DASHBOARD_DOMAIN"
echo "  - $AUTOMATION_DOMAIN"
echo "  - $SUPABASE_DOMAIN"

#############################################
# 1. VERIFY AWS + GITHUB CONTEXT
#############################################

aws sts get-caller-identity >/dev/null
echo "✅ AWS credentials verified"

#############################################
# 2. RESOLVE EC2 INSTANCE FROM PUBLIC IP
#############################################

PUBLIC_IP="${PUBLIC_IP:-16.58.158.94}"

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$AWS_REGION" \
  --filters "Name=ip-address,Values=$PUBLIC_IP" \
  --query "Reservations[].Instances[].InstanceId" \
  --output text)

if [[ -z "$INSTANCE_ID" ]]; then
  echo "❌ No EC2 instance found for IP $PUBLIC_IP"
  exit 1
fi

echo "✅ EC2 Instance: $INSTANCE_ID"

#############################################
# 3. BUILD & PREP (REUSE EXISTING SCRIPTS)
#############################################

echo "🔧 Build phase"
./scripts/reset-build.sh
./scripts/build.sh

#############################################
# 4. DEPLOY APPLICATIONS
#############################################

echo "📦 Deploying applications"
./scripts/deploy.sh
./scripts/deploy-project.sh

#############################################
# 5. DNS / DOMAIN CONFIGURATION
#############################################

echo "🌍 Updating Route 53 records"
./scripts/deploy-domain.sh \
  "$DASHBOARD_DOMAIN" \
  "$AUTOMATION_DOMAIN" \
  "$SUPABASE_DOMAIN"

#############################################
# 6. POST-DEPLOY VERIFICATION
#############################################

echo "🔍 Verifying endpoints"
curl -fs "http://$DASHBOARD_DOMAIN" >/dev/null || echo "⚠ Dashboard not responding yet"
curl -fs "http://$AUTOMATION_DOMAIN" >/dev/null || echo "⚠ Automation not responding yet"
curl -fs "http://$SUPABASE_DOMAIN" >/dev/null || echo "⚠ Supabase not responding yet"

echo "✅ CI Deploy completed for $ENVIRONMENT"

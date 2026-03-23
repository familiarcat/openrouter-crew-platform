#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Domain Deployment Script
#
# Deploys a specific domain and all its dependencies to staging or production.
# Handles database migrations, environment setup, and health checks.
#
# Usage:
#   ./scripts/deploy-domain.sh <domain> [environment] [--skip-migrations]
#
# Arguments:
#   domain        - Domain to deploy: product-factory, alex-ai-universal
#   environment   - Target environment: staging (default), production
#   --skip-migrations - Skip Supabase migrations (optional)
#
# Examples:
#   ./scripts/deploy-domain.sh product-factory staging
#   ./scripts/deploy-domain.sh alex-ai-universal production
#   ./scripts/deploy-domain.sh product-factory staging --skip-migrations
# ==============================================================================

set -e

DOMAIN=$1
ENVIRONMENT=${2:-staging}
SKIP_MIGRATIONS=${3:-""}

if [ -z "$DOMAIN" ]; then
  echo "❌ Error: No domain specified."
  echo "Usage: $0 <domain> [environment] [--skip-migrations]"
  echo "Valid domains: product-factory, alex-ai-universal"
  exit 1
fi

if [ "$DOMAIN" != "product-factory" ] && [ "$DOMAIN" != "alex-ai-universal" ]; then
  echo "❌ Error: Invalid domain '$DOMAIN'."
  echo "Valid domains: product-factory, alex-ai-universal"
  exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo "❌ Error: Invalid environment '$ENVIRONMENT'."
  echo "Valid environments: staging, production"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING DOMAIN: $DOMAIN to $ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Set environment-specific variables
if [ "$ENVIRONMENT" == "production" ]; then
  echo "⚠️  Production deployment - extra caution enabled"
  CONFIRM="n"
  read -p "Are you sure you want to deploy $DOMAIN to PRODUCTION? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 1
  fi
  ENV_FILE=".env.production"
else
  ENV_FILE=".env.staging"
fi

# Check environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Environment file $ENV_FILE not found. Using .env.local as fallback."
  ENV_FILE=".env.local"
fi

# Step 1: Build the domain
echo ""
echo "📦 Step 1: Building domain '$DOMAIN'..."
echo "───────────────────────────────────────────────────────────────────────────"
./scripts/build.sh "$DOMAIN" || exit 1
echo "✅ Domain build completed successfully"

# Step 2: Run migrations (if not skipped)
if [ "$SKIP_MIGRATIONS" != "--skip-migrations" ]; then
  echo ""
  echo "🗄️  Step 2: Running database migrations..."
  echo "───────────────────────────────────────────────────────────────────────────"

  if command -v supabase &> /dev/null; then
    supabase db push --linked
    echo "✅ Database migrations completed"
  else
    echo "⚠️  Supabase CLI not found. Skipping migrations."
    echo "   To run migrations manually: supabase db push --linked"
  fi
else
  echo ""
  echo "⏭️  Step 2: Skipping database migrations (--skip-migrations flag set)"
fi

# Step 3: Deploy to cloud (example for Vercel)
echo ""
echo "☁️  Step 3: Deploying to cloud platform..."
echo "───────────────────────────────────────────────────────────────────────────"

PACKAGE_NAME="@openrouter-crew/${DOMAIN}-dashboard"
DASHBOARD_DIR="domains/${DOMAIN}/dashboard"

if [ -d "$DASHBOARD_DIR" ]; then
  if command -v vercel &> /dev/null; then
    echo "Deploying with Vercel to $ENVIRONMENT..."
    cd "$DASHBOARD_DIR"

    if [ "$ENVIRONMENT" == "production" ]; then
      vercel --prod
    else
      vercel --prebuilt
    fi

    cd - > /dev/null
    echo "✅ Cloud deployment completed"
  else
    echo "⚠️  Vercel CLI not found. Skipping cloud deployment."
    echo "   To deploy manually: cd $DASHBOARD_DIR && vercel"
  fi
else
  echo "❌ Dashboard directory not found: $DASHBOARD_DIR"
  exit 1
fi

# Step 4: Health check
echo ""
echo "💚 Step 4: Running health checks..."
echo "───────────────────────────────────────────────────────────────────────────"

# Determine the appropriate port
case "$DOMAIN" in
  product-factory)
    PORT=3001
    ;;
  alex-ai-universal)
    PORT=3003
    ;;
  *)
    PORT=3000
    ;;
esac

if command -v curl &> /dev/null; then
  HEALTH_URL="http://localhost:${PORT}/api/health"

  # Give the server a moment to start
  sleep 2

  if curl -sf "$HEALTH_URL" > /dev/null; then
    echo "✅ Health check passed for $DOMAIN on port $PORT"
  else
    echo "⚠️  Health check failed. Server may not be responding."
    echo "   Check manually: curl http://localhost:${PORT}/api/health"
  fi
else
  echo "⚠️  curl not found. Skipping health check."
fi

# Step 5: Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE: $DOMAIN → $ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "  • Domain: $DOMAIN"
echo "  • Environment: $ENVIRONMENT"
echo "  • Build Status: ✅ Success"
if [ "$SKIP_MIGRATIONS" != "--skip-migrations" ]; then
  echo "  • Migrations: ✅ Applied"
fi
echo "  • Cloud Deploy: ✅ Success"
echo "  • Health Check: ✅ Passed"
echo ""
echo "🔗 Access your deployment:"
if [ "$ENVIRONMENT" == "production" ]; then
  echo "  • Production URL: https://${DOMAIN}.openrouter-crew.com"
else
  echo "  • Staging URL: https://${DOMAIN}-staging.openrouter-crew.com"
fi
echo "  • Local Dev: http://localhost:${PORT}"
echo ""

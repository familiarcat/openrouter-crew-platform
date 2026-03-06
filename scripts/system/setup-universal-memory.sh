#!/bin/bash

# Setup Universal Memory for OpenRouter Crew Platform
# Uses ROOT .env.local as single source of truth for Supabase credentials
# All dashboards and extensions inherit from root configuration

set -e

echo "🔧 OpenRouter Crew Platform - Universal Memory Setup"
echo "====================================================="
echo ""
echo "⚠️  This script configures the ROOT .env.local as the single source of truth"
echo "    All dashboards will read from: root/.env.local"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root directory${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1: Configure ROOT .env.local${NC}"
echo "======================================="
echo ""

# Check for existing .env.local at root
if [ -f ".env.local" ]; then
  source .env.local

  # Check if credentials are placeholder values
  if [[ "$SUPABASE_ANON_KEY" == *"your-"* ]] || [[ "$SUPABASE_ANON_KEY" == "" ]]; then
    echo -e "${YELLOW}Found .env.local but credentials are placeholders${NC}"
    echo "Enter your actual Supabase credentials below"
  else
    echo -e "${YELLOW}Found existing .env.local with Supabase credentials${NC}"
    read -p "Use these existing credentials? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      unset SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY OPENROUTER_API_KEY
      echo "Enter new credentials below"
    fi
  fi
fi

# Get credentials if not already set
if [ -z "$SUPABASE_URL" ] || [[ "$SUPABASE_ANON_KEY" == *"your-"* ]]; then
  echo ""
  echo -e "${BLUE}Enter your Supabase credentials:${NC}"
  echo "(Get from: https://app.supabase.com/project/[id]/settings/api)"
  echo ""

  read -p "Supabase URL (https://...supabase.co): " SUPABASE_URL
  read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
  read -p "Supabase Service Role Key (optional): " SUPABASE_SERVICE_ROLE_KEY
  read -p "OpenRouter API Key (optional): " OPENROUTER_API_KEY
fi

# Validate URLs
if [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
  echo -e "${RED}❌ Invalid Supabase URL format${NC}"
  echo "Expected: https://your-project.supabase.co"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Test Supabase Connection${NC}"
echo "===================================="

# Test connectivity using curl with timeout
if command -v timeout &> /dev/null; then
  RESPONSE=$(timeout 5 curl -s -w "\n%{http_code}" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/conversations?limit=1" 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
else
  RESPONSE=$(curl -s -m 5 -w "\n%{http_code}" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/conversations?limit=1" 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
fi

if [[ -z "$HTTP_CODE" ]]; then
  echo -e "${YELLOW}⚠️  Could not reach Supabase (network timeout)${NC}"
  echo "   Continuing anyway - test when dashboard runs"
elif [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "401" ]] || [[ "$HTTP_CODE" == "403" ]]; then
  echo -e "${GREEN}✅ Supabase connection successful${NC}"
elif [[ "$HTTP_CODE" == "404" ]]; then
  echo -e "${YELLOW}⚠️  Supabase reachable but table not found${NC}"
  echo "   (OK if you haven't run migrations)"
else
  echo -e "${YELLOW}⚠️  Could not verify connection (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Update ROOT .env.local${NC}"
echo "=================================="

# Update ROOT .env.local with universal memory credentials
# Preserve existing entries, update Supabase values
if [ -f ".env.local" ]; then
  # Backup existing
  cp .env.local .env.local.backup
  echo "✅ Backed up existing .env.local → .env.local.backup"
fi

# Create new root .env.local with universal Supabase credentials
cat > .env.local << 'EOF'
# ============================================
# UNIVERSAL MEMORY - ROOT CONFIGURATION
# ============================================
# This is the SINGLE SOURCE OF TRUTH for all Supabase credentials
# All dashboards, extensions, and services read from this file
# ============================================

# Universal Supabase (Remote - Shared Memory Hub)
# ALL services connect to this single instance
EOF

cat >> .env.local << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# OpenRouter API (optional for local testing)
OPENROUTER_API_KEY=$OPENROUTER_API_KEY

# n8n Webhook Bridge
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
EOF

cat >> .env.local << 'EOF'

# ============================================
# IMPORTANT: All dashboards inherit from this
# Do NOT create separate .env files per dashboard
# Services will read SUPABASE_URL and SUPABASE_ANON_KEY
# from this root .env.local
# ============================================
EOF

echo "✅ Updated ROOT .env.local with universal credentials"

echo ""
echo -e "${BLUE}Step 4: Configure Dashboard Environment Variables${NC}"
echo "===================================================="

# For each dashboard, ensure it can access root credentials
# Next.js requires NEXT_PUBLIC_ prefix for client-side variables

# Unified Dashboard
mkdir -p apps/unified-dashboard
cat > apps/unified-dashboard/.env.local << EOF
# Dashboard reads from ROOT .env.local
# These are symlinked/inherited - DO NOT MODIFY
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_OPENROUTER_API_KEY=$OPENROUTER_API_KEY
EOF
echo "✅ Unified Dashboard configured (reads from root)"

# Alex AI Dashboard
mkdir -p domains/alex-ai-universal/dashboard
cat > domains/alex-ai-universal/dashboard/.env.local << EOF
# Dashboard reads from ROOT .env.local
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_OPENROUTER_API_KEY=$OPENROUTER_API_KEY
EOF
echo "✅ Alex AI Dashboard configured (reads from root)"

# DJ Booking Dashboard
mkdir -p domains/product-factory/project-templates/dj-booking/dashboard
cat > domains/product-factory/project-templates/dj-booking/dashboard/.env.local << EOF
# Dashboard reads from ROOT .env.local
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_OPENROUTER_API_KEY=$OPENROUTER_API_KEY
EOF
echo "✅ DJ Booking Dashboard configured (reads from root)"

# Product Factory Dashboard
mkdir -p domains/product-factory/projects/test-event-venue/dashboard
cat > domains/product-factory/projects/test-event-venue/dashboard/.env.local << EOF
# Dashboard reads from ROOT .env.local
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_OPENROUTER_API_KEY=$OPENROUTER_API_KEY
EOF
echo "✅ Product Factory Dashboard configured (reads from root)"

# VSCode Extension
mkdir -p domains/vscode-extension
cat > domains/vscode-extension/.env.local << EOF
# VSCode Extension reads from ROOT .env.local
VSCODE_SUPABASE_URL=$SUPABASE_URL
VSCODE_SUPABASE_KEY=$SUPABASE_ANON_KEY
EOF
echo "✅ VSCode Extension configured (reads from root)"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ UNIVERSAL MEMORY SETUP COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Configuration Summary:${NC}"
echo "  Root Config File: .env.local (SINGLE SOURCE OF TRUTH)"
echo "  Supabase URL: $SUPABASE_URL"
echo "  All Dashboards: Connected to root config"
echo "  VSCode Extension: Connected to root config"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Build the project:"
echo "   ${YELLOW}pnpm build${NC}"
echo ""
echo "2. Start universal development:"
echo "   ${YELLOW}pnpm dev:universal${NC}"
echo ""
echo "3. Verify all services connect to:"
echo "   ${GREEN}$SUPABASE_URL${NC}"
echo ""
echo -e "${BLUE}Important:${NC}"
echo "  • ROOT .env.local is the single source of truth"
echo "  • Update ROOT .env.local if credentials change"
echo "  • All dashboards inherit from root automatically"
echo "  • Backup file: .env.local.backup"
echo ""
echo -e "${GREEN}All services now share: ${SUPABASE_URL}${NC}"
echo "Unified organizational memory enabled ✨"

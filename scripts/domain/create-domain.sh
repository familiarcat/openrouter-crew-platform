#!/usr/bin/env bash
#
# 🏗️ Domain Scaffolder
# Creates a new Domain structure following DDD principles.
# Usage: pnpm domain:create <domain-name>
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN_NAME=$1

if [ -z "$DOMAIN_NAME" ]; then
  echo -e "${RED}❌ Usage: pnpm domain:create <domain-name>${NC}"
  exit 1
fi

# Normalize name (kebab-case)
SAFE_NAME=$(echo "$DOMAIN_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
BASE_DIR="domains/$SAFE_NAME"

if [ -d "$BASE_DIR" ]; then
  echo -e "${RED}❌ Domain '$SAFE_NAME' already exists.${NC}"
  exit 1
fi

echo -e "${GREEN}🏗️  Scaffolding domain: $SAFE_NAME${NC}"

# Create Directory Structure
mkdir -p "$BASE_DIR/dashboard/app"
mkdir -p "$BASE_DIR/dashboard/components"
mkdir -p "$BASE_DIR/dashboard/lib"
mkdir -p "$BASE_DIR/workflows"
mkdir -p "$BASE_DIR/schema/migrations"
mkdir -p "$BASE_DIR/api"
mkdir -p "$BASE_DIR/types"

# Create README
cat > "$BASE_DIR/README.md" <<EOF
# $DOMAIN_NAME Domain

## Overview
Domain-specific logic for $DOMAIN_NAME.

## Structure
- **dashboard/**: Next.js UI components and pages
- **workflows/**: n8n workflow JSON definitions
- **schema/**: Database migrations
- **api/**: Domain-specific API logic
EOF

# Create package.json
cat > "$BASE_DIR/package.json" <<EOF
{
  "name": "@openrouter-crew/$SAFE_NAME",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
EOF

echo -e "${GREEN}✅ Domain created at $BASE_DIR${NC}"
echo -e "${YELLOW}👉 Next: Add this domain to your pnpm-workspace.yaml if not covered by wildcards.${NC}"
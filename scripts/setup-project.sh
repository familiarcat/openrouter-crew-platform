#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Project Setup Script
#
# Creates a new project instance from a project template within a domain.
# Handles scaffolding, configuration, dependencies, and initialization.
#
# Usage:
#   ./scripts/setup-project.sh <domain> <template> <project-name> [--interactive]
#
# Arguments:
#   domain         - Parent domain: product-factory
#   template       - Project template: dj-booking, etc.
#   project-name   - Name for new project instance (kebab-case)
#   --interactive  - Interactive setup wizard (optional)
#
# Examples:
#   ./scripts/setup-project.sh product-factory dj-booking my-event-space
#   ./scripts/setup-project.sh product-factory dj-booking my-event-space --interactive
# ==============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

DOMAIN=$1
TEMPLATE=$2
PROJECT_NAME=$3
INTERACTIVE=${4:-""}

if [ -z "$DOMAIN" ] || [ -z "$TEMPLATE" ] || [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}❌ Error: Missing required arguments${NC}"
  echo "Usage: $0 <domain> <template> <project-name> [--interactive]"
  echo ""
  echo "Examples:"
  echo "  $0 product-factory dj-booking my-event-space"
  echo "  $0 product-factory dj-booking my-event-space --interactive"
  exit 1
fi

# Verify template exists
TEMPLATE_PATH="domains/$DOMAIN/project-templates/$TEMPLATE"
if [ ! -d "$TEMPLATE_PATH" ]; then
  echo -e "${RED}❌ Error: Template not found at $TEMPLATE_PATH${NC}"
  exit 1
fi

# Validate project name (kebab-case)
if ! [[ "$PROJECT_NAME" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo -e "${RED}❌ Error: Project name must be kebab-case (lowercase letters, numbers, and hyphens)${NC}"
  echo "   Example: my-event-space"
  exit 1
fi

# Check if project already exists
if [ -d "domains/$DOMAIN/projects/$PROJECT_NAME" ]; then
  echo -e "${RED}❌ Error: Project already exists at domains/$DOMAIN/projects/$PROJECT_NAME${NC}"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo -e "${MAGENTA}🎯 CREATING NEW PROJECT FROM TEMPLATE${NC}"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Project Details:"
echo "  • Domain:        $DOMAIN"
echo "  • Template:      $TEMPLATE"
echo "  • Project Name:  $PROJECT_NAME"
echo ""

# Interactive wizard
if [ "$INTERACTIVE" == "--interactive" ]; then
  echo "❓ Interactive Setup"
  echo "──────────────────────────────────────────────────────────────────────────"
  echo ""

  read -p "Project Title: " PROJECT_TITLE
  PROJECT_TITLE=${PROJECT_TITLE:-"$(tr '[:lower:]' '[:upper:]' <<< ${PROJECT_NAME:0:1})${PROJECT_NAME:1}"}

  read -p "Project Description: " PROJECT_DESC
  PROJECT_DESC=${PROJECT_DESC:-"A new project based on $TEMPLATE template"}

  read -p "Project Owner (email): " PROJECT_OWNER
  PROJECT_OWNER=${PROJECT_OWNER:-""}

  read -p "Initial Budget (USD): " PROJECT_BUDGET
  PROJECT_BUDGET=${PROJECT_BUDGET:-"1000"}

  read -p "Environment (development/staging/production): " PROJECT_ENV
  PROJECT_ENV=${PROJECT_ENV:-"development"}

  echo ""
else
  # Use defaults
  PROJECT_TITLE="$(tr '[:lower:]' '[:upper:]' <<< ${PROJECT_NAME:0:1})${PROJECT_NAME:1}"
  PROJECT_DESC="A new project based on $TEMPLATE template"
  PROJECT_OWNER=""
  PROJECT_BUDGET="1000"
  PROJECT_ENV="development"
fi

# Step 1: Create project directory
echo -e "${BLUE}📂 Step 1: Creating project directory...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

PROJECT_DIR="domains/$DOMAIN/projects/$PROJECT_NAME"
mkdir -p "$PROJECT_DIR"
echo "✅ Created: $PROJECT_DIR"
echo ""

# Step 2: Copy template files
echo -e "${BLUE}📋 Step 2: Copying template files...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

# 2a. Copy shared resources (Recursive DDD: Base Layer)
SHARED_PATH="domains/$DOMAIN/project-templates/shared"
if [ -d "$SHARED_PATH" ]; then
  echo "  ℹ️  Found shared resources at $SHARED_PATH"
  # We exclude dashboard from shared copy to prevent overwriting core app scaffolding
  for dir in agents workflows schema api; do
    if [ -d "$SHARED_PATH/$dir" ]; then
      cp -r "$SHARED_PATH/$dir" "$PROJECT_DIR/"
      echo "  ✅ Copied shared base: $dir/"
    fi
  done
fi

# Copy core directories from template
for dir in dashboard agents workflows schema api; do
  if [ -d "$TEMPLATE_PATH/$dir" ]; then
    cp -r "$TEMPLATE_PATH/$dir" "$PROJECT_DIR/"
    echo "  ✅ Copied: $dir/"
  fi
done

echo "✅ Template files copied"
echo ""

# Step 3: Generate project metadata
echo -e "${BLUE}📝 Step 3: Generating project metadata...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

cat > "$PROJECT_DIR/project.json" <<EOF
{
  "name": "$PROJECT_NAME",
  "title": "$PROJECT_TITLE",
  "description": "$PROJECT_DESC",
  "domain": "$DOMAIN",
  "template": "$TEMPLATE",
  "owner": "$PROJECT_OWNER",
  "version": "1.0.0",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$PROJECT_ENV",
  "budget": {
    "initial_usd": $PROJECT_BUDGET,
    "current_usd": 0,
    "remaining_usd": $PROJECT_BUDGET
  },
  "status": "initialized",
  "settings": {
    "auto_scaling": true,
    "cost_optimization": true,
    "monitoring_enabled": true,
    "alerts_enabled": true
  }
}
EOF

echo "✅ Created: project.json"
echo ""

# Step 4: Update package.json names
echo -e "${BLUE}⚙️  Step 4: Updating package configurations...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

if [ -f "$PROJECT_DIR/dashboard/package.json" ]; then
  # Create a temporary sed script to update package names
  sed -i '' \
    -e "s/\"name\": \"@openrouter-crew\/${TEMPLATE}-dashboard\"/\"name\": \"@openrouter-crew\/${PROJECT_NAME}-dashboard\"/g" \
    "$PROJECT_DIR/dashboard/package.json"

  echo "  ✅ Updated dashboard package.json"
fi

echo "✅ Package configurations updated"
echo ""

# Step 5: Create .env.local for project
echo -e "${BLUE}🔐 Step 5: Creating project environment...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

cat > "$PROJECT_DIR/.env.local" <<EOF
# Project: $PROJECT_NAME
# Environment: $PROJECT_ENV
# Created: $(date)

# API Configuration
PROJECT_ID=$PROJECT_NAME
PROJECT_DOMAIN=$DOMAIN
PROJECT_TEMPLATE=$TEMPLATE

# Service URLs
MCP_URL=http://localhost:5679
N8N_URL=http://localhost:5678
SUPABASE_URL=http://localhost:54321

# Budget & Cost Tracking
PROJECT_BUDGET_USD=$PROJECT_BUDGET
COST_OPTIMIZATION=true
COST_ALERTS=true

# Features
ENABLE_WORKFLOWS=true
ENABLE_CREW_COORDINATION=true
ENABLE_COST_TRACKING=true

# Logging
DEBUG=false
LOG_LEVEL=info
EOF

echo "✅ Created: .env.local"
echo ""

# Step 6: Initialize git (if in git repo)
echo -e "${BLUE}🔀 Step 6: Initializing version control...${NC}"
echo "──────────────────────────────────────────────────────────────────────────"

if [ -d ".git" ]; then
  git add "$PROJECT_DIR"
  echo "✅ Added project to git index"
else
  echo "ℹ️  Not in a git repository, skipping git initialization"
fi
echo ""

# Step 7: Summary and next steps
echo "════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ PROJECT SETUP COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Project Created Successfully!"
echo ""
echo "📍 Project Location:"
echo "   $PROJECT_DIR"
echo ""
echo "📝 Configuration:"
echo "   • Name:        $PROJECT_NAME"
echo "   • Title:       $PROJECT_TITLE"
echo "   • Domain:      $DOMAIN"
echo "   • Template:    $TEMPLATE"
echo "   • Environment: $PROJECT_ENV"
echo "   • Budget:      \$$PROJECT_BUDGET USD"
echo ""
echo "📂 Directory Structure:"
echo "   $PROJECT_DIR/"
echo "   ├── dashboard/              # Next.js dashboard UI"
echo "   ├── agents/                 # AI crew agents"
echo "   ├── workflows/              # N8N workflows"
echo "   ├── schema/                 # Database schema"
echo "   ├── api/                    # API routes"
echo "   ├── project.json            # Project metadata"
echo "   └── .env.local              # Environment configuration"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "   1. Install dependencies:"
echo "      cd $PROJECT_DIR/dashboard"
echo "      pnpm install"
echo ""
echo "   2. Start local development:"
echo "      pnpm dev"
echo ""
echo "   3. Update project configuration:"
echo "      Edit $PROJECT_DIR/project.json"
echo "      Edit $PROJECT_DIR/.env.local"
echo ""
echo "   4. Build the project:"
echo "      ./scripts/build.sh $DOMAIN:$PROJECT_NAME"
echo ""
echo "   5. Deploy the project:"
echo "      ./scripts/deploy-project.sh $DOMAIN $PROJECT_NAME staging"
echo ""
echo "📚 Documentation:"
echo "   • Project Guide:     docs/projects/INDEX.md"
echo "   • API Reference:     docs/projects/API.md"
echo "   • Workflow Examples: $PROJECT_DIR/workflows/README.md"
echo ""
echo "💡 Tips:"
echo "   • Check the template README for specific instructions"
echo "   • Use 'pnpm dev' to start local development"
echo "   • Monitor costs with: ./scripts/monitor-costs.sh $PROJECT_NAME"
echo ""

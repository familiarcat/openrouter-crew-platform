#!/bin/bash
# ==============================================================================
# 🚀 OpenRouter Crew Platform: Unified Sync & Build
# This script automates the application of registry updates, infrastructure 
# setup, and cross-domain compilation.
# ==============================================================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}⚙️  Starting Platform Synchronization...${NC}"

# 1. Dependency Refresh
echo -e "\n${BLUE}📦 Installing and linking dependencies...${NC}"
pnpm install

# 2. Environment Setup
echo -e "\n${BLUE}🔐 Loading environment secrets...${NC}"
if pnpm secrets:load; then
    echo -e "${GREEN}✅ Secrets loaded successfully.${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: secrets:load failed. Ensure local .env files exist.${NC}"
fi

# 3. Agent Registry Generation
echo -e "\n${BLUE}🤖 Generating Agent Registry...${NC}"
# Uses ts-node as configured in package.json
pnpm generate:registry

# 4. Infrastructure Initialization
echo -e "\n${BLUE}🐳 Starting Local Infrastructure (Supabase/Redis/n8n)...${NC}"
pnpm local:infra:up

# 5. Cross-Domain Compilation
echo -e "\n${BLUE}🏗️  Compiling VSCode Extension & Shared Domains...${NC}"
# build:vscode handles shared-ui components first
if pnpm build:vscode; then
    echo -e "${GREEN}✅ VSCode Extension compiled successfully.${NC}"
else
    echo -e "${RED}❌ Compilation failed. Check types in domains/shared/.${NC}"
    exit 1
fi

# 6. Dashboard Build (Optional/Heavy)
echo -e "\n${BLUE}📊 Running Codebase Analysis...${NC}"
pnpm --filter @openrouter-crew/codebase-analyzer generate

echo -e "\n${GREEN}🎉 Platform Sync Complete!${NC}"
echo -e "You can now run ${YELLOW}pnpm dev${NC} or start the VSCode extension."
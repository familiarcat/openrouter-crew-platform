#!/bin/bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${GREEN}==> Starting OpenRouter Crew Platform Local Setup <==${NC}"

# 1. Check Prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: docker is required.${NC}" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo -e "${RED}Error: Docker is not running. Please start the Docker daemon.${NC}" >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}Error: pnpm is required.${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: python3 is required.${NC}" >&2; exit 1; }

# 2. Environment Setup
if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
  echo "Initializing .env.local..."
  cp .env.local.example .env.local
fi

# Check for essential API keys
if ! grep -q "OPENROUTER_API_KEY" .env.local || grep -q "OPENROUTER_API_KEY=$" .env.local; then
  echo -e "${YELLOW}Warning: OPENROUTER_API_KEY is missing in .env.local${NC}"
  read -p "Enter your OpenRouter API Key (optional, press enter to skip): " or_key
  if [ ! -z "$or_key" ]; then
    sed -i '' "s/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=$or_key/" .env.local 2>/dev/null || \
    echo "OPENROUTER_API_KEY=$or_key" >> .env.local
  fi
fi

# 3. Docker Network Setup
# The docker-compose.local.yml expects an external network named 'openrouter-network'
if ! docker network inspect openrouter-network >/dev/null 2>&1; then
  echo "Creating Docker network: openrouter-network..."
  docker network create openrouter-network
fi

# 4. Install & Build Shared Layer
echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}Step 2: Building shared core and UI packages...${NC}"
# Building shared packages first to ensure apps have types and components
pnpm build:shared
pnpm build:shared-ui

# 5. Launch Local Infrastructure
echo -e "${GREEN}Step 3: Spinning up local infrastructure (Supabase, n8n, Redis)...${NC}"
pnpm local:infra:up

# 6. Wait for Database Readiness
echo "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec openrouter-supabase-db pg_isready -U postgres >/dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo -n "."
  sleep 2
  ((RETRY_COUNT++))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "${RED}Error: Database failed to start in time.${NC}"
  exit 1
fi
echo -e "\n${GREEN}Database is ready.${NC}"

# 7. Initialize Knowledge Base (Optional)
if [ -f "scripts/knowledge/scrape_memory_alpha.py" ]; then
  echo -e "${YELLOW}Would you like to seed the local knowledge base? (y/n)${NC}"
  read -r seed_choice
  if [[ "$seed_choice" =~ ^[Yy]$ ]]; then
     pnpm knowledge:sync
  fi
fi

# 8. Final Verification
echo -e "${GREEN}Step 4: Running system verification...${NC}"
pnpm local:verify

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}   Local Platform Setup Complete!            ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "Access points:"
echo -e "  - Unified Dashboard: ${YELLOW}http://localhost:3000${NC}"
echo -e "  - Supabase Studio:   ${YELLOW}http://localhost:54323${NC}"
echo -e "  - n8n Interface:     ${YELLOW}http://localhost:5678${NC}"
echo ""
echo -e "To start development:"
echo -e "  ${CYAN}pnpm dev:dashboard${NC}"
echo ""
echo -e "To watch VSCode Extension:"
echo -e "  ${CYAN}pnpm dev:vscode${NC}"
echo ""

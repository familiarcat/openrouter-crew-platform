#!/usr/bin/env bash
#
# 🔄 Universal Bilateral Sync
# Syncs Database Schema, TypeScript Types, and n8n Workflows.
# Usage: pnpm sync:all
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure we are in root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 1

# Parse Arguments
N8N_MODE="interactive"
DB_MODE="interactive"

for arg in "$@"; do
  case $arg in
    --n8n=*)
      N8N_MODE="${arg#*=}"
      ;;
    --db-push)
      DB_MODE="push"
      ;;
  esac
done

echo -e "${CYAN}🔄 Starting Universal System Sync...${NC}"

# 1. Database -> TypeScript Types (Supabase -> UI)
echo -e "\n${YELLOW}1️⃣  Syncing Database Schema to TypeScript Types...${NC}"
if command -v supabase &> /dev/null; then
    # Generate types for shared-schemas package
    # This ensures the UI knows exactly what the DB structure looks like
    supabase gen types typescript --local > packages/shared-schemas/src/database.types.ts
    echo -e "${GREEN}✅ TypeScript definitions updated in packages/shared-schemas${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Skipping type generation.${NC}"
fi

# 2. n8n Workflows (Local <-> Remote)
echo -e "\n${YELLOW}2️⃣  Syncing n8n Workflows...${NC}"

if [ "$N8N_MODE" == "interactive" ]; then
    echo "   Select sync direction:"
    echo "   1) Push Local -> Remote (Deploy)"
    echo "   2) Pull Remote -> Local (Save)"
    echo "   3) Skip"
    read -r -p "   Choice [1]: " n8n_choice
    n8n_choice=${n8n_choice:-1}
    
    if [ "$n8n_choice" -eq 1 ]; then N8N_MODE="push"; fi
    if [ "$n8n_choice" -eq 2 ]; then N8N_MODE="pull"; fi
fi

if [ "$N8N_MODE" == "push" ]; then
    node scripts/n8n/sync-workflows.js --direction=to-n8n --prod
elif [ "$N8N_MODE" == "pull" ]; then
    node scripts/n8n/sync-workflows.js --direction=from-n8n --prod
else
    echo "   Skipping n8n sync."
fi

# 3. Secrets (Zsh -> Env)
echo -e "\n${YELLOW}3️⃣  Verifying Secrets...${NC}"
bash scripts/secrets/sync-from-zshrc.sh

# 4. Database Migrations (Local -> Remote)
echo -e "\n${YELLOW}4️⃣  Database Migrations...${NC}"

if [ "$DB_MODE" == "interactive" ]; then
    echo "   Push local migrations to remote Supabase? (y/N)"
    read -r -p "   Choice [N]: " db_choice
    if [[ "$db_choice" =~ ^[Yy]$ ]]; then DB_MODE="push"; fi
fi

if [ "$DB_MODE" == "push" ]; then
    if command -v supabase &> /dev/null; then
        supabase db push
    else
        echo -e "${YELLOW}⚠️  Supabase CLI not found.${NC}"
    fi
else
    echo "   Skipping DB push."
fi

echo -e "\n${GREEN}✅ Universal Sync Complete.${NC}"
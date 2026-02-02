#!/bin/bash

# 📦 n8n Workflow Backup (CLI Method)
#
# Uses the n8n CLI inside the Docker container to export all workflows.
# This is the "CORRECT WAY" for self-hosted instances to ensure full backups.
#
# Usage: pnpm n8n:backup

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load secrets for RAG upload
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

# 1. Find n8n container
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep n8n | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
  echo -e "${RED}❌ Error: No running n8n container found.${NC}"
  echo "   Please start n8n with: pnpm docker:up"
  exit 1
fi

# 2. Prepare backup directory
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups/n8n/${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}📦 Backing up n8n workflows via CLI...${NC}"
echo "   Container: $CONTAINER_NAME"
echo "   Output:    $BACKUP_DIR"

# 3. Export inside container to temporary location
echo -e "${YELLOW}   Exporting workflows...${NC}"
docker exec "$CONTAINER_NAME" n8n export:workflow --all --separate --output=/tmp/n8n-export

# 4. Copy to host
echo -e "${YELLOW}   Copying to host...${NC}"
docker cp "$CONTAINER_NAME":/tmp/n8n-export/. "$BACKUP_DIR/"

# 5. Cleanup container
docker exec "$CONTAINER_NAME" rm -rf /tmp/n8n-export

echo -e "${GREEN}✅ Backup complete!${NC}"
COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
echo "   Saved $COUNT workflow files."

# 6. Upload to RAG (Supabase)
if [ -f "scripts/n8n/upload-backup-to-rag.js" ]; then
    echo -e "${YELLOW}🧠 Syncing to RAG system (Supabase)...${NC}"
    node scripts/n8n/upload-backup-to-rag.js "$BACKUP_DIR"
fi

# 7. Prune old backups (Keep last 10)
echo -e "${YELLOW}✂️  Pruning local backups (keeping last 10)...${NC}"
cd "$(dirname "$BACKUP_DIR")" || exit
# List directories by time (newest first), skip first 10, delete the rest
ls -dt */ | tail -n +11 | xargs -I {} rm -rf "{}"
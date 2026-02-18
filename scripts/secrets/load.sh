#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Secrets Loader
#
# Loads secrets from shell environment (zshrc/bashrc) or local files.
# Usage: ./scripts/secrets/load.sh [--source shell|file|both]
# ==============================================================================

SOURCE=${1:-both}

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

load_from_shell() {
  echo -e "${YELLOW}🔍 Loading secrets from shell environment...${NC}"
  # Logic adapted from sync-from-zshrc.sh
  if [ -f ~/.zshrc ]; then
    source ~/.zshrc
  elif [ -f ~/.bashrc ]; then
    source ~/.bashrc
  fi
  
  # Check for critical keys
  if [ -n "$OPENROUTER_API_KEY" ]; then
    echo -e "${GREEN}✅ Found OPENROUTER_API_KEY in shell${NC}"
  fi
}

load_from_files() {
  echo -e "${YELLOW}📂 Loading secrets from local .env files...${NC}"
  if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
    echo -e "${GREEN}✅ Loaded .env.local${NC}"
  fi
}

case "$SOURCE" in
  shell) load_from_shell ;;
  file)  load_from_files ;;
  both|*)  load_from_shell; load_from_files ;;
esac
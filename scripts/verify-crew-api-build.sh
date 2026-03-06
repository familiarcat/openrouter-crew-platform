#!/bin/bash

# ==============================================================================
# Verify Crew API Client Build
# Checks if the package builds successfully and artifacts are generated.
# Usage: ./scripts/verify-crew-api-build.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verifying @openrouter-crew/crew-api-client build..."

if pnpm build --filter @openrouter-crew/crew-api-client; then
    echo -e "${GREEN}✅ Build command succeeded${NC}"
else
    echo -e "${RED}❌ Build command failed${NC}"
    exit 1
fi

if [ -f "domains/shared/crew-api-client/dist/observation-lounge-cli.js" ]; then
    echo -e "${GREEN}✅ Artifact found: dist/observation-lounge-cli.js${NC}"
else
    echo -e "${RED}❌ Artifact missing${NC}"
    exit 1
fi
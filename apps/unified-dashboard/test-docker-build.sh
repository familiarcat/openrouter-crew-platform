#!/bin/bash

# ==============================================================================
# Docker Build Debugger
# Runs a local Docker build with verbose logging to isolate build failures.
# Usage: ./scripts/debug/test-docker-build.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 Starting Verbose Docker Build Debug...${NC}"

export DOCKER_BUILDKIT=1

docker buildx build \
    --progress=plain \
    --platform linux/amd64 \
    -f apps/unified-dashboard/Dockerfile \
    .

echo -e "\n${GREEN}✅ Docker build successful!${NC}"
#!/bin/bash

# scripts/release-vscode-local.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="${PROJECT_ROOT}/domains/vscode-extension"
RELEASE_DIR="${PROJECT_ROOT}/releases"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Building VSCode Extension for Local Release...${NC}"

# Ensure release directory exists
mkdir -p "$RELEASE_DIR"

cd "$EXTENSION_DIR"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install

# Compile
echo -e "${BLUE}Compiling extension...${NC}"
pnpm run compile

# Package
echo -e "${BLUE}Packaging extension (.vsix)...${NC}"
npx @vscode/vsce package --out "${RELEASE_DIR}/openrouter-crew-vscode.vsix"

echo -e "${GREEN}Success! Extension packaged at:${NC} ${RELEASE_DIR}/openrouter-crew-vscode.vsix"
echo ""
echo -e "${BLUE}To install in VSCode, run:${NC}"
echo "code --install-extension ${RELEASE_DIR}/openrouter-crew-vscode.vsix"
echo ""
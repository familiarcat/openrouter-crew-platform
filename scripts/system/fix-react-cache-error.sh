#!/bin/bash

# Fix React Cache Error for Unified Dashboard
# Problem: package.json was updated to React 18.3.1, but node_modules is still cached
# Solution: Clean pnpm cache and reinstall

set -e

echo "🔧 Fixing React Cache Error (react.cache is not a function)"
echo "================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root directory${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1: Remove node_modules${NC}"
echo "Removing node_modules/ (this may take a moment)..."
rm -rf node_modules
rm -rf .next
echo -e "${GREEN}✅ Removed node_modules and .next cache${NC}"
echo ""

echo -e "${BLUE}Step 2: Clear pnpm cache${NC}"
if command -v pnpm &> /dev/null; then
  # Clean up problematic .DS_Store files first (macOS issue)
  rm -rf ~/Library/Caches/pnpm/dlx/.DS_Store 2>/dev/null || true

  # Try to prune, but continue if it fails
  if pnpm store prune 2>/dev/null; then
    echo -e "${GREEN}✅ Cleared pnpm cache${NC}"
  else
    echo -e "${YELLOW}⚠️  Could not fully prune pnpm cache (non-critical, continuing)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  pnpm not found in PATH, skipping cache prune${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Remove pnpm lockfile${NC}"
rm -f pnpm-lock.yaml
echo -e "${GREEN}✅ Removed pnpm-lock.yaml${NC}"
echo ""

echo -e "${BLUE}Step 4: Reinstall dependencies${NC}"
if command -v pnpm &> /dev/null; then
  echo "Running: pnpm install"
  pnpm install
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${RED}❌ pnpm command not found${NC}"
  echo "Please ensure pnpm is installed and in PATH, then run: pnpm install"
  exit 1
fi
echo ""

echo -e "${BLUE}Step 5: Verify React version${NC}"
if [ -f "node_modules/react/package.json" ]; then
  REACT_VERSION=$(grep '"version"' node_modules/react/package.json | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
  echo "Installed React version: $REACT_VERSION"
  if [[ "$REACT_VERSION" == "18.3"* ]]; then
    echo -e "${GREEN}✅ React 18.3.x installed (correct)${NC}"
  else
    echo -e "${RED}❌ React version is $REACT_VERSION, expected 18.3.x${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Could not verify React version${NC}"
fi
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ REACT CACHE ERROR FIX COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: pnpm dev:universal"
echo "2. Visit: http://localhost:3000"
echo "3. If error persists, check terminal for detailed error message"
echo ""

echo -e "${BLUE}If the error still occurs:${NC}"
echo "• Check that unified-dashboard/package.json has react@18.3.1"
echo "• Verify node_modules/react/package.json version is 18.3.x"
echo "• Try: pnpm build (to trigger full rebuild)"

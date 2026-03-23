#!/bin/bash
set -e

echo "🏗️  Verifying Monorepo Build..."

# 1. Fix TSConfigs (ensure they are correct before building)
echo "🔧 Fixing TSConfigs..."
node scripts/system/fix-tsconfig-corruption.js

# 2. Build All
echo "🚀 Building all packages..."
pnpm build

echo "✅ Monorepo Build Verified!"
#!/bin/bash
# ==============================================================================
# Deep Clean & Reset Build
# Fixes Webpack cache corruption and dependency issues
# ==============================================================================

echo "🧹 Cleaning build artifacts (.next, dist, node_modules)..."

# Ensure we are in the project root to avoid cleaning/installing in the wrong directory
cd "$(dirname "$0")/.."

# Remove root node_modules
rm -rf node_modules

# Remove nested artifacts across all workspaces
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove nested lockfiles that confuse Next.js workspace detection
echo "🧹 Removing nested lockfiles..."
find . -mindepth 2 -name "pnpm-lock.yaml" -delete
find . -name "package-lock.json" -delete
find . -name "yarn.lock" -delete

echo "📦 Reinstalling dependencies..."
pnpm install

echo "✅ Reset complete. Try running 'pnpm build' now."
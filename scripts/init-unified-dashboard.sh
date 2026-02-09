#!/bin/bash

# ==============================================================================
# Initialize Unified Dashboard
#
# Orchestrates the complete setup sequence to ensure a clean, working state.
# Usage: ./scripts/init-unified-dashboard.sh
# ==============================================================================

set -e

echo "🚀 Initializing Unified Dashboard Environment..."

# 1. Reset Build Artifacts (Prevents Webpack/Next.js cache errors)
echo "🧹 Step 1: Cleaning build artifacts..."
# bash ./scripts/reset-build.sh

# 2. Apply Enhancements (Generates UI components, mock data, and pages)
echo "✨ Step 2: Enhancing dashboard code..."
bash ./scripts/enhance-unified-dashboard.sh

# 2.5 Install Dependencies (Ensures new package.json is recognized and deps are installed)
echo "📦 Step 2.5: Installing dependencies..."
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/unified-dashboard/node_modules
pnpm install --no-frozen-lockfile

# 3. Fix TypeScript Configuration (Ensures monorepo references are correct)
echo "🔧 Step 3: Fixing TypeScript references..."
pnpm fix:tsconfig

echo "✅ Initialization complete."
echo "👉 Run 'pnpm dev' to start the dashboard."
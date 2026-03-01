#!/bin/bash

# Script to implement Phase 8B dependencies and verify interoperability
# Run this from the root of the monorepo

set -e

echo "🚀 Starting Phase 8B Implementation Setup..."

# 1. Install Shared Dependencies in VSCode Extension
echo "📦 Installing shared packages in vscode-extension..."
pnpm add \
  "@openrouter-crew/shared-cost-tracking@workspace:*" \
  "@openrouter-crew/shared-schemas@workspace:*" \
  "@openrouter-crew/shared-crew-coordination@workspace:*" \
  --filter "@openrouter-crew/vscode-extension"

# 2. Verify TypeScript Compilation
echo "🏗️  Verifying build..."
pnpm build --filter "@openrouter-crew/vscode-extension"

# 3. Run Tests to ensure Adapter logic works
echo "🧪 Running tests..."
pnpm test --filter "@openrouter-crew/vscode-extension"

echo "✅ Phase 8B Refactor Complete & Verified!"
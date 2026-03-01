#!/bin/bash
set -e

echo "🔧 Fixing CLI dependencies..."

# Install inquirer and its types for the CLI package
pnpm add inquirer@^9.0.0 @types/inquirer --filter @openrouter-crew/cli

echo "🏗️  Retrying build for CLI..."
# Run the build specifically for the CLI to verify fixes
pnpm build --filter @openrouter-crew/cli

echo "✅ CLI Build Fixed"
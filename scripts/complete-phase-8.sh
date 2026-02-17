#!/bin/bash
# scripts/phases/complete-phase-8.sh
# Automates the build and verification of Phase 8 (VSCode Extension)

set -e

echo "🤖 Initiating Phase 8 Completion Sequence..."

# 1. Verify Domain Structure
if [ ! -d "domains/vscode-extension" ]; then
  echo "❌ Error: domains/vscode-extension not found."
  exit 1
fi

# 2. Install Dependencies
echo "📦 Installing dependencies..."
pnpm install --filter "@openrouter-crew/vscode-extension..."

# 3. Run Tests
echo "🧪 Running Extension Tests..."
pnpm --filter "@openrouter-crew/vscode-extension" test

# 4. Build Extension
echo "🔨 Building Extension..."
./scripts/build.sh "domains/vscode-extension"

# 5. Package VSIX
echo "📦 Packaging VSIX..."
cd domains/vscode-extension

# Ensure vsce is installed
if ! command -v vsce &> /dev/null; then
    npm install -g @vscode/vsce
fi

vsce package --out ./dist/

# 6. Verify VSIX
VSIX_FILE=$(find ./dist -name "*.vsix")
if [ -f "$VSIX_FILE" ]; then
  echo "✅ Phase 8 Build Success: $VSIX_FILE created."
else
  echo "❌ Phase 8 Build Failed: No VSIX file generated."
  exit 1
fi

# 7. Optional: Deploy to AWS S3 (Artifact Store)
if [ "$1" == "--deploy" ]; then
  echo "🚀 Deploying artifact to AWS..."
  cd ../..
  ./scripts/aws/deploy.sh "vscode-extension" "staging"
fi

echo "🎉 Phase 8 Complete!"
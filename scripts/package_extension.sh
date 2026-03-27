#!/bin/bash
set -e

echo "📦 Packaging VSCode Extension..."

# Ensure we are in the root
cd "$(dirname "$0")/.."

# 1. Build the extension
echo "🏗️  Building extension..."
pnpm build --filter @openrouter-crew/vscode-extension

# 2. Prepare for packaging
cd domains/vscode-extension

# Ensure README exists (vsce requires it)
if [ ! -f README.md ]; then
    echo "# OpenRouter Crew VSCode Extension" > README.md
fi

# Ensure LICENSE exists (vsce warns/fails without it)
if [ ! -f LICENSE ]; then
    echo "MIT License" > LICENSE
fi

# 3. Package using vsce
pnpm exec vsce package --no-yarn

echo "✅ Extension packaged successfully!"
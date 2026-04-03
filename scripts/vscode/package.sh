#!/bin/bash
set -e

# Get the directory of the script, then go up to the repo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
EXTENSION_ROOT="$REPO_ROOT/domains/vscode-extension"

echo "📦 Packaging OpenRouter Crew VSCode Extension..."
echo "📂 Extension Root: $EXTENSION_ROOT"

cd "$EXTENSION_ROOT"

# 1. Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf out dist *.vsix

# 2. Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# 3. Compile
echo "🔨 Compiling..."
pnpm run compile

# 4. Copy CSS files to out directory for the Welcome Panel styling
echo "📂 Copying assets..."
mkdir -p out/ui
cp src/ui/*.css out/ui/ 2>/dev/null || :

# 4.5. Bundle crew agent dist for standalone VSIX use
echo "📦 Bundling crew agent binaries..."
AGENT_DIST_SRC="$REPO_ROOT/domains/shared/agent-orchestration/dist"
AGENT_DIST_DST="$EXTENSION_ROOT/agent-dist"
rm -rf "$AGENT_DIST_DST"
if [ -d "$AGENT_DIST_SRC" ]; then
    cp -r "$AGENT_DIST_SRC" "$AGENT_DIST_DST"
    echo "   ✅ Agent dist bundled ($AGENT_DIST_DST)"
else
    echo "   ⚠️  Agent dist not found — run 'pnpm --filter @openrouter-crew/agent-orchestration build' first"
fi

# 5. Package
echo "🎁 Creating VSIX package..."
VSIX_NAME="openrouter-crew.vsix"
if command -v vsce &> /dev/null; then
    vsce package --out "$VSIX_NAME"
else
    echo "   'vsce' command not found. Using npx..."
    npx @vscode/vsce package --out "$VSIX_NAME"
fi

echo "✅ Package created successfully: $EXTENSION_ROOT/$VSIX_NAME"
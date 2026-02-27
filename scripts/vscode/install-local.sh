#!/bin/bash
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📦 Installing OpenRouter Crew VSCode Extension locally..."

# 1. Run the packaging script from the same directory
PACKAGE_SCRIPT="$SCRIPT_DIR/package.sh"
if [ -f "$PACKAGE_SCRIPT" ]; then
    echo "▶️ Running package script..."
    bash "$PACKAGE_SCRIPT"
else
    echo "❌ Error: package.sh not found at $PACKAGE_SCRIPT"
    exit 1
fi

# 2. Locate the VSIX file
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
VSIX_FILE="$REPO_ROOT/domains/vscode-extension/openrouter-crew.vsix"

if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ Error: $VSIX_FILE not found after packaging."
    exit 1
fi

echo "📥 Installing $VSIX_FILE into local VSCode..."
code --install-extension "$VSIX_FILE" --force

echo "✅ Extension installed successfully! Please reload VSCode to see changes."
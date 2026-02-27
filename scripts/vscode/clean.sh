#!/bin/bash
set -e

# Get the directory of the script, then go up to the repo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
EXTENSION_ROOT="$REPO_ROOT/domains/vscode-extension"

echo "🧹 Cleaning OpenRouter Crew VSCode Extension artifacts..."
echo "📂 Extension Root: $EXTENSION_ROOT"

if [ -d "$EXTENSION_ROOT" ]; then
    cd "$EXTENSION_ROOT"
    rm -rf out dist *.vsix
    echo "✅ Clean complete."
else
    echo "❌ Extension root not found: $EXTENSION_ROOT"
    exit 1
fi
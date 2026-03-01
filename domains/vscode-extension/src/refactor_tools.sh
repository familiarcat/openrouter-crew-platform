#!/bin/bash
# domains/vscode-extension/src/refactor_tools.sh

set -e

BASE_DIR="domains/vscode-extension/src"
TOOLS_DIR="$BASE_DIR/tools"
SERVICES_DIR="$BASE_DIR/services"

echo "📂 Creating tools directory..."
mkdir -p "$TOOLS_DIR"

# Function to move file and update imports
move_tool() {
    src="$1"
    filename=$(basename "$src")
    dest="$TOOLS_DIR/$filename"
    
    if [ -f "$src" ]; then
        echo "➡️  Moving $filename to tools/..."
        mv "$src" "$dest"
        
        # Update imports to point back to services
        # 1. Update types.js import
        perl -i -pe "s|from '\./types\.js'|from '../services/types.js'|g" "$dest"
        # 2. Update exec.js import
        perl -i -pe "s|from '\./exec\.js'|from '../services/exec.js'|g" "$dest"
        # 3. Update filesystem.js import (if referenced)
        perl -i -pe "s|from '\./filesystem\.js'|from './filesystem.js'|g" "$dest"
        
        # Special case for search.ts which was in src/ root
        perl -i -pe "s|from '\./services/types\.js'|from '../services/types.js'|g" "$dest"
    else
        echo "⚠️  File $src not found, skipping."
    fi
}

# Move all tool files
move_tool "$SERVICES_DIR/filesystem.ts"
move_tool "$SERVICES_DIR/git.ts"
move_tool "$SERVICES_DIR/ops.ts"
move_tool "$SERVICES_DIR/analysis.ts"
move_tool "$SERVICES_DIR/utility.ts"
move_tool "$BASE_DIR/search.ts"

echo "✅ Tool refactoring complete."
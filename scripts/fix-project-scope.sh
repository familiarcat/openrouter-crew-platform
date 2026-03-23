#!/bin/bash

# ==============================================================================
# Fix Project Scope
# Renames all packages in a directory to use a new scope.
# Usage: ./scripts/fix-project-scope.sh <project-path> <new-scope>
# Example: ./scripts/fix-project-scope.sh domains/product-factory/projects/test-event-venue test-event-venue
# ==============================================================================

PROJECT_PATH=$1
NEW_SCOPE=$2

if [ -z "$PROJECT_PATH" ] || [ -z "$NEW_SCOPE" ]; then
    echo "Usage: $0 <project-path> <new-scope>"
    exit 1
fi

# Remove @ from scope if present
NEW_SCOPE=${NEW_SCOPE#@}

echo "🔧 Updating packages in $PROJECT_PATH to scope @$NEW_SCOPE..."

find "$PROJECT_PATH" -name "package.json" -not -path "*/node_modules/*" | while read -r pkg; do
    # Get current name
    current_name=$(grep '"name":' "$pkg" | head -1 | sed -E 's/.*"name": "([^"]+)".*/\1/')
    
    # Extract package name (remove scope)
    base_name=${current_name##*/}
    
    # Update package.json
    sed -i '' -E "s/\"name\": \"@[^/]+\/(.+)\"/\"name\": \"@$NEW_SCOPE\/\1\"/" "$pkg"
    echo "  ✅ Renamed $current_name -> @$NEW_SCOPE/$base_name"
done

echo "✨ Scope update complete."
#!/bin/bash

# ==============================================================================
# Verify Package Uniqueness
# Checks if packages in a specific project have name collisions with the rest of the monorepo.
# Usage: ./scripts/verify-package-uniqueness.sh [project-path]
# ==============================================================================

PROJECT_PATH=${1:-"domains/product-factory/projects/test-event-venue"}

if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Project directory not found: $PROJECT_PATH"
    exit 1
fi

echo "🔍 Verifying package uniqueness for $PROJECT_PATH..."

# 1. Get all package names in the target project
declare -A PROJECT_PACKAGES
while IFS= read -r file; do
    name=$(grep '"name":' "$file" | head -1 | sed -E 's/.*"name": "([^"]+)".*/\1/')
    if [ -n "$name" ]; then
        PROJECT_PACKAGES["$name"]="$file"
        echo "   Found project package: $name"
    fi
done < <(find "$PROJECT_PATH" -name "package.json" -not -path "*/node_modules/*")

# 2. Check these names against the rest of the repo
FOUND_DUPLICATE=0
while IFS= read -r file; do
    # Skip files inside the project itself to avoid self-matching
    if [[ "$file" == *"$PROJECT_PATH"* ]]; then
        continue
    fi
    
    name=$(grep '"name":' "$file" | head -1 | sed -E 's/.*"name": "([^"]+)".*/\1/')
    
    if [ -n "${PROJECT_PACKAGES[$name]}" ]; then
        echo "❌ DUPLICATE FOUND: $name"
        echo "   - In Project: ${PROJECT_PACKAGES[$name]}"
        echo "   - Elsewhere:  $file"
        FOUND_DUPLICATE=1
    fi
done < <(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*")

if [ $FOUND_DUPLICATE -eq 0 ]; then
    echo "✅ No duplicate packages found in $PROJECT_PATH"
else
    echo ""
    echo "⚠️  Duplicates found. To fix, run:"
    echo "   ./scripts/fix-project-scope.sh $PROJECT_PATH test-event-venue"
fi
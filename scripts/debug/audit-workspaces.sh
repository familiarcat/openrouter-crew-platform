#!/bin/bash

# ==============================================================================
# Workspace Audit Script
# Scans the entire monorepo for duplicate package names in package.json files.
# Usage: ./scripts/audit-workspaces.sh
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Scanning for duplicate workspace names..."

# Create a temporary file to store package info
TMP_FILE=$(mktemp)

# Find all package.json files, ignoring node_modules, dist, etc.
# We explicitly ignore build artifacts to avoid false positives
find . -name "package.json" \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.next/*" \
    -not -path "*/out/*" \
    -not -path "*/build/*" | while read -r file; do
    # Extract name. Assumes "name": "value" format on one line
    name=$(grep '"name":' "$file" | head -1 | sed -E 's/.*"name": "([^"]+)".*/\1/')
    if [ -n "$name" ]; then
        echo "$name|$file" >> "$TMP_FILE"
    fi
done

# Identify duplicates by counting occurrences of the package name
echo -e "\n📦 Analyzing package inventory..."

duplicates=$(awk -F'|' '{print $1}' "$TMP_FILE" | sort | uniq -d)

if [ -z "$duplicates" ]; then
    echo -e "${GREEN}✅ No duplicate package names found.${NC}"
    rm "$TMP_FILE"
    exit 0
fi

echo -e "${RED}❌ Duplicate packages found:${NC}"
echo "------------------------------------------------"

# For each duplicate name, show the conflicting file paths
echo "$duplicates" | while read -r dup_name; do
    echo "Package: $dup_name"
    grep "^$dup_name|" "$TMP_FILE" | cut -d'|' -f2 | sed 's/^/  - /'
    echo ""
done

rm "$TMP_FILE"
exit 1
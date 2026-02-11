#!/bin/bash

# Cleanup misplaced files and fix dependencies

echo "🧹 Removing misplaced UniversalNavigation.tsx from root..."
rm -f UniversalNavigation.tsx

echo "🔧 Running dependency fix..."
bash scripts/system/fix-lucide-deps.sh

echo "✅ Cleanup complete. Please restart your build."
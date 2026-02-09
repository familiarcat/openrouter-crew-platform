#!/bin/bash

# ==============================================================================
# Reset Build Artifacts
#
# Cleans .next directories and dist folders to resolve Webpack loader errors.
# ==============================================================================

echo "🧹 Cleaning build artifacts..."
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +

echo "✅ Artifacts cleaned. Run 'pnpm dev' to restart."
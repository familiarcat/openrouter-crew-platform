#!/bin/bash
# ==============================================================================
# OpenRouter Crew Platform - Local Build Script
# ==============================================================================

set -e

echo "🚀 Starting Local Build..."

# 1. Install dependencies (respecting workspace)
echo "📦 Installing dependencies..."
pnpm install

# 2. Build all packages in topological order
echo "🏗️  Building workspace packages..."
pnpm -r build

echo "✅ Local build complete."
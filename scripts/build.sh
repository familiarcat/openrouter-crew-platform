#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Unified Build Script
#
# This script provides a centralized way to build the entire platform or
# individual domains. It leverages pnpm workspaces and Turborepo for
# efficient, cached builds.
#
# Usage:
#   ./scripts/build.sh <target>
#
# Targets:
#   all         - Build all apps and domains in the monorepo (uses Turborepo).
#   <domain>    - Build a specific domain's dashboard.
#                 Valid domains: dj-booking, product-factory, alex-ai-universal
#
# Examples:
#   ./scripts/build.sh all
#   ./scripts/build.sh product-factory
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

TARGET=$1

if [ -z "$TARGET" ]; then
  echo "Error: No target specified."
  echo "Usage: $0 [all | dj-booking | product-factory | alex-ai-universal]"
  exit 1
fi

echo " "

if [ "$TARGET" == "all" ]; then
  echo "🚀 Building all domains and apps in tandem..."
  echo "------------------------------------------------"
  pnpm turbo build
  echo "------------------------------------------------"
  echo "✅ Full platform build complete."

elif [ "$TARGET" == "dj-booking" ] || [ "$TARGET" == "product-factory" ] || [ "$TARGET" == "alex-ai-universal" ]; then
  PACKAGE_NAME="@openrouter-crew/${TARGET}-dashboard"
  echo "🚀 Building individual domain: $TARGET ($PACKAGE_NAME)..."
  echo "------------------------------------------------"
  pnpm --filter "$PACKAGE_NAME" build
  echo "------------------------------------------------"
  echo "✅ Domain build for '$TARGET' complete."

else
  echo "Error: Invalid target '$TARGET'."
  echo "Usage: $0 [all | dj-booking | product-factory | alex-ai-universal]"
  exit 1
fi

echo " "
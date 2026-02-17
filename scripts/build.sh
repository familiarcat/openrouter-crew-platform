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
#   all                - Build all apps and domains in the monorepo (uses Turborepo).
#   <domain>           - Build a specific domain's dashboard.
#                        Valid domains: product-factory, alex-ai-universal
#   <domain>:<project> - Build a specific project within a domain.
#                        Example: product-factory:dj-booking
#
# Examples:
#   ./scripts/build.sh all
#   ./scripts/build.sh product-factory
#   ./scripts/build.sh product-factory:dj-booking
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

TARGET=$1

if [ -z "$TARGET" ]; then
  echo "Error: No target specified."
  echo "Usage: $0 [all | product-factory | alex-ai-universal | product-factory:dj-booking]"
  exit 1
fi

echo " "

if [ "$TARGET" == "all" ]; then
  echo "🚀 Building all domains and apps in tandem..."
  echo "------------------------------------------------"
  pnpm turbo build
  echo "------------------------------------------------"
  echo "✅ Full platform build complete."

elif [[ "$TARGET" == *":"* ]]; then
  # Handle domain:project format (e.g., product-factory:dj-booking)
  DOMAIN=$(echo "$TARGET" | cut -d: -f1)
  PROJECT=$(echo "$TARGET" | cut -d: -f2)
  PACKAGE_NAME="@openrouter-crew/${PROJECT}-dashboard"
  echo "🚀 Building project template: $PROJECT in domain $DOMAIN ($PACKAGE_NAME)..."
  echo "------------------------------------------------"
  pnpm --filter "$PACKAGE_NAME" build
  echo "------------------------------------------------"
  echo "✅ Project build for '$PROJECT' complete."

elif [ "$TARGET" == "product-factory" ] || [ "$TARGET" == "alex-ai-universal" ] || [ "$TARGET" == "unified-dashboard" ]; then
  if [ "$TARGET" == "unified-dashboard" ]; then
    PACKAGE_NAME="unified-dashboard"
  elif [ "$TARGET" == "product-factory" ]; then
    PACKAGE_NAME="@openrouter-crew/product-factory-dashboard"
  else
    PACKAGE_NAME="@openrouter-crew/${TARGET}-dashboard"
  fi

  echo "🚀 Building individual domain: $TARGET ($PACKAGE_NAME)..."
  echo "------------------------------------------------"
  pnpm --filter "$PACKAGE_NAME" build
  echo "------------------------------------------------"
  echo "✅ Domain build for '$TARGET' complete."

else
  echo "Error: Invalid target '$TARGET'."
  echo "Usage: $0 [all | product-factory | alex-ai-universal | product-factory:dj-booking]"
  exit 1
fi

echo " "
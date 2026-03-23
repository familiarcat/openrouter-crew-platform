#!/bin/bash
# scripts/pipeline.sh
# Master orchestration script for the OpenRouter Crew Platform

set -e

# Security: Sync secrets from local environment if available
# This ensures AWS credentials and API keys are loaded from ~/.zshrc
if [ -f "$HOME/.zshrc" ] && [ -f "scripts/secrets/sync-from-zshrc.sh" ]; then
  echo "🔐 Syncing secrets from ~/.zshrc..."
  bash scripts/secrets/sync-from-zshrc.sh
  
  if [ -f ".env.local" ]; then
    set -a
    source .env.local
    set +a
  fi
fi

COMMAND=$1
SCOPE=$2
ENV=${3:-staging}

function show_help {
  echo "Usage: ./scripts/pipeline.sh <command> <scope> [env]"
  echo "Commands:"
  echo "  ci       - Run install, lint, test, build"
  echo "  release  - Run ci + deploy to AWS"
  echo "  phase    - Complete a specific phase (e.g., phase-8)"
  echo "Scopes:"
  echo "  all, unified-dashboard, vscode-extension, product-factory"
}

if [ -z "$COMMAND" ]; then
  show_help
  exit 1
fi

echo "🚀 Pipeline started: $COMMAND for $SCOPE [$ENV]"

case $COMMAND in
  ci)
    echo "🔧 Running CI..."
    pnpm install
    # Add linting check here if available
    # pnpm lint
    
    if [ "$SCOPE" == "all" ]; then
      ./scripts/build.sh all
    else
      ./scripts/build.sh "$SCOPE"
    fi
    ;;

  release)
    echo "🚀 Running Release..."
    # 1. Run CI first
    $0 ci "$SCOPE" "$ENV"
    
    # 2. Deploy
    ./scripts/deploy/deploy-full.sh "$SCOPE" "$ENV"
    ;;

  phase)
    if [ "$SCOPE" == "phase-8" ]; then
      ./scripts/vscode/build-extension.sh --deploy
    else
      echo "Unknown phase: $SCOPE"
    fi
    ;;
esac
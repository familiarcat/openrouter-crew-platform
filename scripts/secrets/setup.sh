#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Secrets Orchestration
#
# Runs the full secrets setup pipeline: Load -> Validate -> Distribute
# ==============================================================================

set -e

echo "🔐 Setting up secrets pipeline..."
bash scripts/secrets/load.sh --source both
pnpm secrets:validate
bash scripts/secrets/sync-all-projects.sh # Distribute
echo "✅ Secrets setup complete"
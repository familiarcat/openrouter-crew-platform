#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Cleanup Script
#
# Removes duplicate and empty scripts identified in the codebase analysis.
# ==============================================================================

set -e

echo "🧹 Cleaning up duplicate and empty scripts..."

# 1. Sync Scripts (Consolidated into scripts/sync/all.sh)
rm -fv scripts/domain/sync-all.sh
rm -fv scripts/system/sync-all.sh

# 2. Git Setup (Consolidated into scripts/git/setup-remote.js)
rm -fv scripts/git-setup-remote.sh

# 3. Secrets Scripts (Consolidated into scripts/secrets/load.sh and push-github.sh)
rm -fv scripts/secrets/sync-from-zshrc.sh
rm -fv scripts/secrets/sync-to-github.sh
rm -fv scripts/secrets/load-local-secrets.sh

# 4. Story Estimation (Consolidated into scripts/story-estimation.ts)
rm -fv scripts/milestone/story-estimation.ts
rm -fv scripts/system/story-estimation.ts

# 5. Empty Placeholders
rm -fv scripts/agile/create-story.sh
rm -fv scripts/agile/push-story.sh
rm -fv scripts/agile/generate-content.js
rm -fv scripts/milestone/create-milestone.sh
rm -fv scripts/milestone/push-milestone.sh
rm -fv scripts/milestone/generate-milestone-content.js

echo "✅ Cleanup complete."
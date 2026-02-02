#!/bin/bash

# 🖖 Crew Git Connectivity Restoration
# Geordi La Forge (Engineering)
# Diagnoses and reports on git repository connection status

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 1

echo "🔍 Diagnostic: Git Repository Connectivity"
echo "📂 Root: $ROOT_DIR"

# 1. Check .git existence
if [ -d ".git" ]; then
    echo "✅ .git directory detected"
else
    echo "❌ CRITICAL: .git directory MISSING"
    echo "   Run 'git init' to initialize"
    exit 1
fi

# 2. Check Remote Origin
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "⚠️  WARNING: Remote 'origin' not configured"
    echo "   Action: git remote add origin <repo-url>"
else
    echo "✅ Remote 'origin' connected: $REMOTE_URL"
fi

# 3. Branch Status
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
echo "🌿 Current Branch: $BRANCH"

echo "✅ Diagnostic complete."
#!/usr/bin/env bash
# crew-publish-validate.sh - Pre-flight check for Production/Staging

set -euo pipefail

echo "🛡️ Running Pre-Flight Validation (Dark Forest Protocol)..."

# 1. Build Verification
echo "🏗️ Testing monorepo build..."
pnpm build

# 2. Type Safety Audit
echo "🔍 Checking for TypeScript regressions..."
pnpm fix:tsconfig

# 3. Cost-Safety Check
echo "💰 Auditing cost-tracking boundaries..."
# Ensure the crew-api-client has cost-caps enabled
if ! grep -q "budgetCap" domains/shared/crew-api-client/src/routing.ts; then
    echo "❌ ERROR: No budget cap found in routing logic. This is a violation of the $1/day goal."
    exit 1
fi

# 4. Secret Sanity
echo "🔐 Checking for leaked API keys..."
if grep -q "sk-or-" ./**/*.ts; then
    echo "❌ ERROR: Hardcoded OpenRouter key detected! Use environment variables."
    exit 1
fi

# 5. Terraform Workspace Check
echo "🌍 Validating Terraform state..."
cd terraform
terraform workspace list | grep -q "production" || echo "⚠️ Warning: Production workspace not initialized."

echo "✅ Validation successful. You are clear for 'pnpm deploy:full'."
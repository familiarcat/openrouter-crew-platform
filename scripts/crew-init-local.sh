#!/usr/bin/env bash
# crew-init-local.sh - Initialize the local development bridge

set -euo pipefail

echo "🚀 Initializing OpenRouter Crew Local Environment..."

# 1. Check Dependencies
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Exiting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required for Supabase/n8n. Exiting."; exit 1; }

# 2. Install and Link
echo "📦 Installing workspace dependencies..."
pnpm install

# 3. Start Infrastructure
echo "🐳 Starting Supabase and n8n..."
if docker ps --filter "name=supabase" --quiet | grep -q .; then
    echo "✅ Supabase containers are already running."
else
    pnpm supabase:start
fi

if docker ps --filter "name=n8n" --quiet | grep -q .; then
    echo "✅ n8n container is already running."
else
    docker-compose -f docker-compose.local.yml up -d
fi

# 4. Seed and Sync
echo "🗄️ Seeding database and syncing n8n workflows..."
pnpm db:seed
pnpm n8n:sync

# 5. Generate Types
echo "🧬 Synchronizing TypeScript definitions..."
pnpm generate:types

# 6. Verify Environment
if [ ! -f .env.local ]; then
    echo "⚠️ .env.local missing. Copying from example..."
    cp .env.example .env.local
fi

# 7. Initialize Local Terraform Workspace
if [ -d "terraform" ]; then
    echo "🌍 Initializing local terraform workspace..."
    (cd terraform && terraform init > /dev/null && terraform workspace select default || terraform workspace new default)
fi

echo "✅ Bridge is active. Run 'pnpm dev' to start dashboards."
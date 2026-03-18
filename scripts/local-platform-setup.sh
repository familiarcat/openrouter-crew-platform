#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
  cp .env.local.example .env.local
  echo "Created .env.local from .env.local.example"
fi

echo "Installing workspace dependencies..."
pnpm install

echo "Building shared UI package..."
pnpm build:shared-ui

echo ""
echo "Local platform setup complete."
echo "Next steps:"
echo "  1. pnpm local:infra:up"
echo "  2. pnpm dev:dashboard"
echo "  3. pnpm dev:vscode   # optional, for extension watch mode"

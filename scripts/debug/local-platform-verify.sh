#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "Verifying local platform prerequisites..."
command -v node >/dev/null
command -v pnpm >/dev/null
command -v docker >/dev/null

echo "Checking shared UI build..."
pnpm build:shared-ui >/dev/null

echo "Checking dashboard build..."
pnpm --dir apps/unified-dashboard build >/dev/null

echo "Checking CLI bridge syntax..."
node --check scripts/crew-project-cli.mjs >/dev/null

echo "Local platform verification passed."

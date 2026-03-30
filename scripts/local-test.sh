#!/usr/bin/env bash
# ============================================================
#  local-test.sh — One-command local testing for the platform
#  Runs: infrastructure → build check → unit tests → smoke test
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
ok()  { echo -e "${GREEN}✓${RESET} $*"; }
err() { echo -e "${RED}✗${RESET} $*" >&2; }
log() { echo -e "${CYAN}→${RESET} $*"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKIP_INFRA="${SKIP_INFRA:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
RUN_E2E="${RUN_E2E:-false}"

header() { echo -e "\n${YELLOW}═══ $* ═══${RESET}"; }

# ── 1. Preflight ─────────────────────────────────────────────
header "Preflight checks"
command -v pnpm   &>/dev/null && ok "pnpm"    || { err "pnpm not found"; exit 1; }
command -v docker &>/dev/null && ok "docker"  || err "docker not found (infra will fail)"
command -v node   &>/dev/null && ok "node $(node -v)"

[[ -f ".env.local" ]] && ok ".env.local present" || {
  err ".env.local missing — copy from .env.local.example"
  [[ -f ".env.local.example" ]] && {
    log "Creating .env.local from example (edit before production use)"
    cp .env.local.example .env.local
    ok ".env.local created"
  }
}

# ── 2. Infrastructure ────────────────────────────────────────
if [[ "$SKIP_INFRA" != "true" ]]; then
  header "Starting local infrastructure"
  if [[ -f "docker-compose.local.yml" ]]; then
    docker compose -f docker-compose.local.yml up -d --remove-orphans \
      && ok "Infrastructure up" \
      || { err "Docker compose failed"; exit 1; }

    # Wait for Supabase
    log "Waiting for Supabase (15s)..."
    sleep 15
    ok "Infrastructure ready"
  else
    err "docker-compose.local.yml not found"
  fi
fi

# ── 3. Install & Build ───────────────────────────────────────
if [[ "$SKIP_BUILD" != "true" ]]; then
  header "Installing dependencies"
  pnpm install --frozen-lockfile && ok "pnpm install complete"

  header "Building shared packages"
  pnpm build:shared && ok "Shared packages built"

  header "Type checking"
  pnpm type-check && ok "TypeScript OK" || err "TypeScript errors found"
fi

# ── 4. Unit Tests ────────────────────────────────────────────
if [[ "$SKIP_TESTS" != "true" ]]; then
  header "Running unit tests"
  pnpm test --passWithNoTests && ok "Unit tests passed" || err "Unit tests failed"
fi

# ── 5. Smoke test: API health checks ────────────────────────
header "Smoke tests"
PORTS=(3000 3001 5678)
for port in "${PORTS[@]}"; do
  if curl -sf "http://localhost:$port/health" &>/dev/null; then
    ok "Port $port responding"
  else
    log "Port $port not responding (service may not be started)"
  fi
done

# ── 6. E2E (optional) ────────────────────────────────────────
if [[ "$RUN_E2E" == "true" ]]; then
  header "End-to-end tests"
  pnpm test:e2e && ok "E2E tests passed" || err "E2E tests failed"
fi

# ── 7. Summary ───────────────────────────────────────────────
header "Local test complete"
echo ""
echo "Services (if started):"
echo "  Unified Dashboard: http://localhost:3000"
echo "  Alex AI Dashboard: http://localhost:3001"
echo "  n8n Automation:    http://localhost:5678"
echo "  Supabase Studio:   http://localhost:54323"
echo ""
echo "Quick commands:"
echo "  pnpm dev:dashboard     # Start dashboard"
echo "  pnpm local:infra:logs  # View container logs"
echo "  pnpm local:infra:down  # Stop everything"

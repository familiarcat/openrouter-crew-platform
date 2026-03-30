#!/usr/bin/env bash
# ============================================================
#  OPENROUTER CREW PLATFORM — Local → Cloud Deploy Automator
#  crew-deploy.sh
#
#  Stages:
#   local     → docker-compose.local.yml  (zero cloud costs)
#   staging   → Vercel preview + AWS EC2  (Terraform workspace)
#   production → Full AWS + Vercel         (Terraform workspace)
#
#  Usage:
#    ./crew-deploy.sh local           # Start local stack
#    ./crew-deploy.sh staging         # Deploy to staging
#    ./crew-deploy.sh production      # Deploy to production
#    ./crew-deploy.sh status          # Check current state
# ============================================================

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
log()  { echo -e "${CYAN}[DEPLOY]${RESET} $*"; }
ok()   { echo -e "${GREEN}[OK]${RESET}     $*"; }
err()  { echo -e "${RED}[ERR]${RESET}    $*" >&2; }
warn() { echo -e "${YELLOW}[WARN]${RESET}   $*"; }

# ── Locate repo root whether called from scripts/ or root ────
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$_SCRIPT_DIR/../package.json" ]]; then
  REPO_ROOT="$(cd "$_SCRIPT_DIR/.." && pwd)"
elif [[ -f "$_SCRIPT_DIR/package.json" ]]; then
  REPO_ROOT="$_SCRIPT_DIR"
else
  REPO_ROOT="$(pwd)"
fi

STAGE="${1:-local}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ── Auto-source env (bridges zsh exports → bash) ─────────────
load_env() {
  # 1. Repo .env.local
  if [[ -f "$REPO_ROOT/.env.local" ]]; then
    set -o allexport
    source "$REPO_ROOT/.env.local" 2>/dev/null || true
    set +o allexport
    log "Sourced .env.local"
  fi

  # 2. Run env-bridge --source if available (scans zsh configs)
  local bridge="$REPO_ROOT/scripts/crew-env-bridge.sh"
  if [[ -f "$bridge" ]]; then
    local bridge_exports
    bridge_exports=$(bash "$bridge" --source 2>/dev/null || true)
    [[ -n "$bridge_exports" ]] && eval "$bridge_exports" && log "Sourced env-bridge"
  fi

  # 3. Map common alt-name vars → canonical names the scripts expect
  : "${NEXT_PUBLIC_SUPABASE_URL:=${SUPABASE_URL:-${SUPABASE_PROJECT_URL:-}}}"
  : "${NEXT_PUBLIC_SUPABASE_ANON_KEY:=${SUPABASE_ANON_KEY:-${SUPABASE_PUBLIC_KEY:-}}}"
  : "${SUPABASE_SERVICE_ROLE_KEY:=${SUPABASE_SERVICE_KEY:-${SUPABASE_SECRET_KEY:-}}}"
  : "${OPENROUTER_API_KEY:=${OPENROUTER_KEY:-${OR_API_KEY:-}}}"
  : "${AWS_DEFAULT_REGION:=${AWS_REGION:-us-east-2}}"
  export NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY \
         SUPABASE_SERVICE_ROLE_KEY OPENROUTER_API_KEY AWS_DEFAULT_REGION
}

check_deps() {
  local req=("docker" "pnpm" "node")
  [[ "$STAGE" != "local" ]] && req+=("terraform" "aws")
  [[ "$STAGE" != "local" ]] && req+=("vercel")
  for dep in "${req[@]}"; do
    command -v "$dep" &>/dev/null || { err "Missing: $dep"; exit 1; }
  done
}

check_env() {
  local required_vars=("OPENROUTER_API_KEY" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
  [[ "$STAGE" != "local" ]] && required_vars+=("SUPABASE_SERVICE_ROLE_KEY")

  local missing=()
  for var in "${required_vars[@]}"; do
    [[ -z "${!var:-}" ]] && missing+=("$var")
  done

  [[ ${#missing[@]} -gt 0 ]] && {
    err "Missing env vars: ${missing[*]}"
    echo "  Copy .env.local.example → .env.local and fill in values"
    exit 1
  }
  ok "Environment variables present"
}

# ── LOCAL ────────────────────────────────────────────────────
deploy_local() {
  log "Starting local stack..."

  # Load env
  [[ -f ".env.local" ]] && export $(grep -v '^#' .env.local | xargs) || true

  # Build shared packages first
  log "Building shared packages..."
  pnpm build:shared

  # Start infrastructure
  log "Starting Docker infrastructure..."
  docker compose -f docker-compose.local.yml up -d --remove-orphans

  # Health check loop
  log "Waiting for services..."
  local timeout=60 elapsed=0
  until curl -sf "http://localhost:54321/health" &>/dev/null || [[ $elapsed -ge $timeout ]]; do
    sleep 2; ((elapsed+=2)) || true
  done
  [[ $elapsed -ge $timeout ]] && warn "Supabase health check timed out (may still be starting)"

  ok "Local infrastructure ready"
  echo ""
  echo -e "${BOLD}Local Services:${RESET}"
  echo "  Dashboard:      http://localhost:3000"
  echo "  Alex AI:        http://localhost:3001"
  echo "  n8n:            http://localhost:5678  (admin/admin)"
  echo "  Supabase:       http://localhost:54323"
  echo "  API:            http://localhost:8080"
  echo ""
  echo -e "${BOLD}Start dev servers:${RESET}"
  echo "  pnpm dev:dashboard     # Unified dashboard"
  echo "  pnpm dev:universal     # All services"
  echo ""
  log "Tailing logs (ctrl-C to stop)..."
  docker compose -f docker-compose.local.yml logs -f --tail=50
}

# ── STAGING ──────────────────────────────────────────────────
deploy_staging() {
  log "Deploying to STAGING..."

  # Build production-ready artifacts
  log "Building all packages..."
  pnpm build

  # Vercel preview
  log "Deploying dashboards to Vercel (preview)..."
  vercel --cwd apps/unified-dashboard deploy \
    --env OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --yes 2>&1 | tail -5
  ok "Vercel preview deployed"

  # Terraform staging
  if [[ -d "terraform" ]]; then
    log "Applying Terraform (staging workspace)..."
    (cd terraform && \
      terraform workspace select staging 2>/dev/null || terraform workspace new staging && \
      terraform plan -var="environment=staging" -out=plan.tfplan && \
      terraform apply plan.tfplan)
    ok "Terraform staging applied"
  fi

  ok "Staging deployment complete"
}

# ── PRODUCTION ───────────────────────────────────────────────
deploy_production() {
  log "Deploying to PRODUCTION..."

  # Safety prompt
  echo -e "${RED}${BOLD}WARNING: This will deploy to PRODUCTION.${RESET}"
  read -r -p "Type 'deploy-prod' to confirm: " confirm
  [[ "$confirm" != "deploy-prod" ]] && { log "Aborted."; exit 0; }

  log "Building production artifacts..."
  NODE_ENV=production pnpm build

  log "Deploying to Vercel (production)..."
  vercel --cwd apps/unified-dashboard deploy --prod \
    --env OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --yes 2>&1 | tail -5

  if [[ -d "terraform" ]]; then
    log "Applying Terraform (production workspace)..."
    (cd terraform && \
      terraform workspace select production 2>/dev/null || terraform workspace new production && \
      terraform plan -var="environment=production" -out=plan.tfplan && \
      terraform apply plan.tfplan)
  fi

  if [[ -d "supabase" ]]; then
    log "Pushing Supabase migrations..."
    supabase db push --remote
  fi

  ok "Production deployment complete! 🚀"
}

# ── STATUS ───────────────────────────────────────────────────
check_status() {
  log "Checking platform status..."
  echo ""

  # Docker
  echo -e "${BOLD}Local Infrastructure:${RESET}"
  if docker compose -f docker-compose.local.yml ps 2>/dev/null | grep -q "running"; then
    docker compose -f docker-compose.local.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
  else
    echo "  Not running (start with: $0 local)"
  fi

  # Port checks
  echo ""
  echo -e "${BOLD}Port Health:${RESET}"
  local ports=("3000:Dashboard" "3001:Alex-AI" "5678:n8n" "54321:Supabase-API" "54323:Supabase-Studio")
  for entry in "${ports[@]}"; do
    local port="${entry%%:*}" name="${entry##*:}"
    if curl -sf "http://localhost:$port" &>/dev/null; then
      echo -e "  ${GREEN}✓${RESET} $name (port $port)"
    else
      echo -e "  ${RED}✗${RESET} $name (port $port)"
    fi
  done

  # Build status
  echo ""
  echo -e "${BOLD}Build Status:${RESET}"
  [[ -d "apps/unified-dashboard/.next" ]] && echo -e "  ${GREEN}✓${RESET} unified-dashboard built" \
    || echo -e "  ${YELLOW}○${RESET} unified-dashboard not built (run pnpm build:dashboard)"
}

# ── MAIN ─────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║  OpenRouter Crew — Deploy Pipeline   ║"
echo "  ║  Stage: $(printf '%-30s' "$STAGE") ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"

cd "$REPO_ROOT"

case "$STAGE" in
  local)      check_deps; load_env; deploy_local ;;
  staging)    check_deps; load_env; check_env; deploy_staging ;;
  production) check_deps; load_env; check_env; deploy_production ;;
  status)     load_env; check_status ;;
  *)
    err "Unknown stage: $STAGE"
    echo "Usage: $0 [local|staging|production|status]"
    exit 1 ;;
esac

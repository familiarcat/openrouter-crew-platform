#!/bin/bash

# ==============================================================================
# OpenRouter Crew Platform - Local Development Script
#
# Starts all domains locally with proper port allocation and environment setup.
# Manages services, database connections, and hot-reload watching.
#
# Usage:
#   ./scripts/local-dev.sh [domains] [--no-ui] [--verbose]
#
# Arguments:
#   domains      - Specific domains to start: "product-factory", "alex-ai-universal", "all" (default)
#   --no-ui      - Skip UI dashboards, start only services
#   --verbose    - Enable verbose logging for debugging
#
# Examples:
#   ./scripts/local-dev.sh                              # Start all domains
#   ./scripts/local-dev.sh product-factory              # Start only product-factory
#   ./scripts/local-dev.sh all --verbose                # Start all with verbose logs
#   ./scripts/local-dev.sh product-factory alex-ai-universal # Multiple specific domains
# ==============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DOMAINS=""
NO_UI=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --no-ui)
      NO_UI=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
    *)
      DOMAINS="$DOMAINS $arg"
      ;;
  esac
done

# Default to all if no domains specified
if [ -z "$DOMAINS" ]; then
  DOMAINS="product-factory alex-ai-universal"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🚀 STARTING LOCAL DEVELOPMENT ENVIRONMENT"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Port assignments
declare -A DOMAIN_PORTS=(
  ["unified-dashboard"]="3000"
  ["product-factory"]="3001"
  ["alex-ai-universal"]="3003"
  ["dj-booking"]="3004"
)

# Service ports
MCP_SERVER_PORT="5679"
N8N_PORT="5678"

# Color codes for domains
declare -A DOMAIN_COLORS=(
  ["unified-dashboard"]="\033[0;35m"  # Magenta
  ["product-factory"]="\033[0;36m"    # Cyan
  ["alex-ai-universal"]="\033[0;32m"  # Green
  ["dj-booking"]="\033[0;33m"         # Yellow
)

# Check environment setup
echo "📋 Pre-flight checks..."
echo "──────────────────────────────────────────────────────────────────────────"

# Check .env file
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Creating with defaults..."
  cat > .env.local <<EOF
# Local Development Environment
MCP_URL=http://localhost:${MCP_SERVER_PORT}
N8N_URL=http://localhost:${N8N_PORT}
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=local-test-key
NODE_ENV=development
DEBUG=false
EOF
  echo "✅ .env.local created"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo "✅ Dependencies installed"
fi

echo "✅ Pre-flight checks passed"
echo ""

# Function to start a domain
start_domain() {
  local domain=$1
  local port=${DOMAIN_PORTS[$domain]}
  local color=${DOMAIN_COLORS[$domain]}

  if [ -z "$port" ]; then
    echo -e "${RED}❌ Unknown domain: $domain${NC}"
    return 1
  fi

  echo -e "${color}Starting $domain on port $port...${NC}"

  # Determine dashboard path
  if [ "$domain" == "dj-booking" ]; then
    DASHBOARD_PATH="domains/product-factory/project-templates/$domain/dashboard"
  else
    DASHBOARD_PATH="domains/$domain/dashboard"
  fi

  if [ ! -d "$DASHBOARD_PATH" ]; then
    echo -e "${RED}❌ Dashboard not found at $DASHBOARD_PATH${NC}"
    return 1
  fi

  # Start in background
  if [ "$VERBOSE" == true ]; then
    cd "$DASHBOARD_PATH"
    PORT=$port pnpm dev &
    PIDS+=("$!")
    cd - > /dev/null
  else
    cd "$DASHBOARD_PATH"
    PORT=$port pnpm dev > "/tmp/${domain}-dev.log" 2>&1 &
    PIDS+=("$!")
    cd - > /dev/null
  fi

  echo -e "${GREEN}✅ $domain (PID: ${PIDS[-1]})${NC}"
}

# Start unified dashboard first (if not --no-ui)
PIDS=()

if [ "$NO_UI" == false ]; then
  echo "🎨 Starting Unified Dashboard..."
  echo "──────────────────────────────────────────────────────────────────────────"
  start_domain "unified-dashboard" || echo "⚠️  Skipping unified dashboard"
  echo ""
fi

# Start selected domains
echo "🧠 Starting Domain Services..."
echo "──────────────────────────────────────────────────────────────────────────"

for domain in $DOMAINS; do
  if [ -d "domains/$domain" ] || [ -d "domains/product-factory/project-templates/$domain" ]; then
    start_domain "$domain"
  else
    echo -e "${YELLOW}⚠️  Domain not found: $domain${NC}"
  fi
done

echo ""

# Display service access information
echo "════════════════════════════════════════════════════════════════════════════"
echo "✅ LOCAL DEVELOPMENT ENVIRONMENT STARTED"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Access your services:"
echo ""

if [ "$NO_UI" == false ]; then
  echo -e "${DOMAIN_COLORS[unified-dashboard]}📊 Unified Dashboard:${NC}"
  echo "   http://localhost:${DOMAIN_PORTS[unified-dashboard]}"
  echo ""
fi

for domain in $DOMAINS; do
  if [ -d "domains/$domain" ] || [ -d "domains/product-factory/project-templates/$domain" ]; then
    port=${DOMAIN_PORTS[$domain]}
    echo -e "${DOMAIN_COLORS[$domain]}🖥️  $domain Domain:${NC}"
    echo "   http://localhost:${port}"
    echo ""
  fi
done

echo "🔧 Services:"
echo "   MCP Server:        http://localhost:${MCP_SERVER_PORT}"
echo "   N8N Workflows:     http://localhost:${N8N_PORT}"
echo ""

# Display helpful commands
echo "📝 Useful commands:"
echo ""
echo "   View logs:         tail -f /tmp/<domain>-dev.log"
echo "   Stop all:          pkill -P $$ (or Ctrl+C)"
echo "   Build domain:      ./scripts/build.sh <domain>"
echo "   Deploy domain:     ./scripts/deploy-domain.sh <domain> staging"
echo ""

# Display active processes
echo "📋 Running processes:"
for pid in "${PIDS[@]}"; do
  ps -p "$pid" -o pid,cmd | tail -1
done
echo ""

# Keep script running and handle cleanup
cleanup() {
  echo ""
  echo "🛑 Shutting down local development environment..."
  echo "──────────────────────────────────────────────────────────────────────────"

  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" || true
      echo "  Stopped process $pid"
    fi
  done

  echo "✅ All services stopped"
  exit 0
}

# Handle Ctrl+C and termination signals
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "🔄 Services are running. Press Ctrl+C to stop."
echo ""

wait

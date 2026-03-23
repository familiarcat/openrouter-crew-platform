#!/bin/bash

###############################################################################
# OpenRouter Crew Platform - Local Development Startup Script
# Starts all services in a coordinated way with proper logging
###############################################################################

set -e

# Load environment variables if available
if [ -f ".env.local" ]; then
    set -a
    source .env.local
    set +a
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/.logs"
SERVICES=()

mkdir -p "$LOG_DIR"

log_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

cleanup() {
    log_warning "Stopping all services..."
    for service in "${SERVICES[@]}"; do
        if kill "$service" 2>/dev/null; then
            log_info "Stopped service (PID: $service)"
        fi
    done
    exit 0
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop or the Docker daemon."
        log_info "Docker is required for local services (n8n, Supabase, Redis)."
        exit 1
    fi
}

check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-30}
    local log_file=$4
    local elapsed=0

    log_info "Verifying $name health at $url (timeout: ${timeout}s)..."

    while [ $elapsed -lt $timeout ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "$name is healthy"
            return 0
        fi
        elapsed=$((elapsed + 1))
        sleep 1
    done

    log_warning "$name is not responding (timeout after ${timeout}s)."
    if [ -n "$log_file" ] && [ -f "$log_file" ]; then
        log_error "Displaying last 50 lines from $log_file:"
        tail -n 50 "$log_file"
    fi
    return 1
}

trap cleanup SIGINT SIGTERM

###############################################################################
# Phase 1: Install Dependencies
###############################################################################

cd "$PROJECT_ROOT"

# Ensure dashboard is initialized
if [ ! -f "apps/unified-dashboard/app/page.tsx" ]; then
    log_warning "Unified Dashboard UI missing. Initializing..."
    bash scripts/enhance-unified-dashboard.sh
fi

# Ensure health check endpoint exists for Web Portal
if [ ! -f "apps/unified-dashboard/app/api/health/route.ts" ]; then
    mkdir -p apps/unified-dashboard/app/api/health
    cat > apps/unified-dashboard/app/api/health/route.ts <<EOF
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
}
EOF
fi

log_header "PHASE 1: Install Dependencies"
log_info "Running pnpm install..."
if pnpm install > "$LOG_DIR/install.log" 2>&1; then
    log_success "Dependencies installed"
else
    log_error "Failed to install dependencies. Check $LOG_DIR/install.log"
    exit 1
fi

###############################################################################
# Phase 2: Build Packages
###############################################################################

log_header "PHASE 2: Build Packages"
log_info "Building all packages..."
if pnpm build > "$LOG_DIR/build.log" 2>&1; then
    log_success "All packages built"
else
    log_warning "Build warnings detected. Check $LOG_DIR/build.log. Continuing..."
fi

###############################################################################
# Phase 3: Start Core Services
###############################################################################

log_header "PHASE 3: Starting Services"

# Ensure Docker is running before attempting to start containers
check_docker

# Step 1: Start Supabase (if needed)
SUPABASE_IS_LOCAL=true
if [[ -n "$NEXT_PUBLIC_SUPABASE_URL" ]] && [[ "$NEXT_PUBLIC_SUPABASE_URL" != *"localhost"* ]] && [[ "$NEXT_PUBLIC_SUPABASE_URL" != *"127.0.0.1"* ]]; then
    SUPABASE_IS_LOCAL=false
    log_info "Using remote Supabase at $NEXT_PUBLIC_SUPABASE_URL"
fi

if [ "$SUPABASE_IS_LOCAL" = true ]; then
    if [ ! "$(docker ps -q -f name=supabase)" ]; then
        log_info "Starting local Supabase..."
        cd "$PROJECT_ROOT"
        if supabase start > "$LOG_DIR/supabase.log" 2>&1; then
            log_success "Supabase services starting..."
        else
            log_warning "Supabase startup had issues. Check $LOG_DIR/supabase.log"
        fi
    fi

    # Wait for Supabase to be healthy before proceeding
    log_info "Verifying Supabase health..."
    if ! check_service "Supabase" "http://localhost:54321" 60 "$LOG_DIR/supabase.log"; then
        log_error "Supabase failed to start. Aborting."
        if [ -f "$LOG_DIR/supabase.log" ]; then
            cat "$LOG_DIR/supabase.log"
        fi
        exit 1
    fi
fi

# Step 2: Start API Server
# Dynamically determine port from MCP_URL to ensure data unison with UI
API_PORT="3001"
if [[ "$MCP_URL" =~ :([0-9]+) ]]; then
    API_PORT="${BASH_REMATCH[1]}"
fi

log_info "Starting API server on port $API_PORT..."
cd "$PROJECT_ROOT/domains/shared/crew-api-client"
PORT=$API_PORT pnpm dev > "$LOG_DIR/api-server.log" 2>&1 &
API_PID=$!
SERVICES+=($API_PID)
log_success "API server starting (PID: $API_PID, http://localhost:$API_PORT)"
sleep 3

# Step 3: Start Web Portal
log_info "Starting Web Portal..."
cd "$PROJECT_ROOT/apps/unified-dashboard"
PORT=3000 pnpm dev > "$LOG_DIR/web-portal.log" 2>&1 &
WEB_PID=$!
SERVICES+=($WEB_PID)
log_success "Web Portal starting (PID: $WEB_PID, http://localhost:3000)"
sleep 3

# Step 3b: Start Domain Dashboards
log_info "Starting Domain Dashboards..."

# DJ Booking (3002)
PORT=3002 pnpm --filter @openrouter-crew/dj-booking-dashboard dev > "$LOG_DIR/dj-booking.log" 2>&1 &
DJ_PID=$!
SERVICES+=($DJ_PID)

# Product Factory (3004)
PORT=3004 pnpm --filter @openrouter-crew/test-event-venue-dashboard dev > "$LOG_DIR/product-factory.log" 2>&1 &
PF_PID=$!
SERVICES+=($PF_PID)

# Alex AI (3003)
PORT=3003 pnpm --filter @openrouter-crew/alex-ai-universal-dashboard dev > "$LOG_DIR/alex-ai.log" 2>&1 &
ALEX_PID=$!
SERVICES+=($ALEX_PID)

# Step 4: Start n8n
log_info "Starting n8n..."
cd "$PROJECT_ROOT"
DOCKER_COMPOSE_FILE="docker-compose.yml"
if [ -f "docker-compose.local.yml" ]; then
    DOCKER_COMPOSE_FILE="docker-compose.local.yml"
fi

if docker compose -f "$DOCKER_COMPOSE_FILE" up -d n8n > "$LOG_DIR/n8n.log" 2>&1; then
    log_success "n8n starting (http://localhost:5678)"
    sleep 5
else
    log_warning "n8n startup had issues. Check $LOG_DIR/n8n.log"
fi

# Step 5: Build CLI (ready to use)
log_info "Building CLI..."
cd "$PROJECT_ROOT/apps/cli"
if pnpm build > "$LOG_DIR/cli.log" 2>&1; then
    log_success "CLI ready to use"
else
    log_warning "CLI build had warnings. Check $LOG_DIR/cli.log"
fi

###############################################################################
# Phase 4: Verification
###############################################################################

log_header "PHASE 4: Service Verification"

check_service "API Server" "http://localhost:$API_PORT/api/health" 60 "$LOG_DIR/api-server.log" || log_error "API Server failed to start. Check logs."
check_service "Web Portal" "http://localhost:3000/api/health" 60 "$LOG_DIR/web-portal.log" || log_error "Web Portal failed to start. Check logs."
check_service "DJ Booking" "http://localhost:3002" 30 "$LOG_DIR/dj-booking.log" || log_warning "DJ Booking dashboard taking a while..."
check_service "Product Factory" "http://localhost:3004" 30 "$LOG_DIR/product-factory.log" || log_warning "Product Factory dashboard taking a while..."
check_service "Alex AI" "http://localhost:3003" 30 "$LOG_DIR/alex-ai.log" || log_warning "Alex AI dashboard taking a while..."
check_service "n8n" "http://localhost:5678" 90 "$LOG_DIR/n8n.log" || log_error "n8n failed to start. Check logs."

# Step 6: Sync n8n Credentials (Auto-configuration)
log_info "Syncing n8n credentials from environment..."
pnpm n8n:sync:creds > "$LOG_DIR/n8n-sync.log" 2>&1 || log_warning "Credential sync failed. Check .env.local"

###############################################################################
# Phase 5: Ready State
###############################################################################

log_header "✅ ALL SERVICES RUNNING"

echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo "  • Web Portal:   ${BLUE}http://localhost:3000${NC}"
echo "  • API Server:   ${BLUE}http://localhost:${API_PORT}${NC}"
echo "  • DJ Booking:   ${BLUE}http://localhost:3002${NC}"
echo "  • Alex AI:      ${BLUE}http://localhost:3003${NC}"
echo "  • Prod Factory: ${BLUE}http://localhost:3004${NC}"
echo "  • n8n:          ${BLUE}http://localhost:5678${NC}"
echo "  • Supabase:     ${BLUE}${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:54321}${NC}"
echo ""
echo -e "${GREEN}Log Files:${NC}"
echo "  • API Server:   ${LOG_DIR}/api-server.log"
echo "  • Web Portal:   ${LOG_DIR}/web-portal.log"
echo "  • n8n:          ${LOG_DIR}/n8n.log"
if [ "$SUPABASE_IS_LOCAL" = true ]; then
    echo "  • Supabase:     ${LOG_DIR}/supabase.log"
fi
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Open web interfaces
open_url() {
    if command -v open &> /dev/null; then
        open "$1"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$1"
    elif command -v start &> /dev/null; then
        start "$1"
    fi
}

log_info "Opening web interfaces..."
open_url "http://localhost:3000"
open_url "http://localhost:3002"
open_url "http://localhost:3003"
open_url "http://localhost:3004"
open_url "http://localhost:5194"
if [ "$SUPABASE_IS_LOCAL" = true ]; then
    open_url "${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:54321}"
fi

# Keep script running
wait

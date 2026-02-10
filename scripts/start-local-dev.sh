#!/bin/bash

###############################################################################
# OpenRouter Crew Platform - Local Development Startup Script
# Starts all services in a coordinated way with proper logging
###############################################################################

set -e

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

trap cleanup SIGINT SIGTERM

###############################################################################
# Phase 1: Install Dependencies
###############################################################################

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

# Step 1: Start Supabase (if needed)
if [ ! "$(docker ps -q -f name=supabase)" ]; then
    log_info "Starting Supabase..."
    cd "$PROJECT_ROOT"
    if supabase start > "$LOG_DIR/supabase.log" 2>&1; then
        log_success "Supabase started (http://localhost:54321)"
        sleep 2
    else
        log_warning "Supabase startup had issues. Check $LOG_DIR/supabase.log"
    fi
fi

# Step 2: Start API Server
log_info "Starting API server..."
cd "$PROJECT_ROOT/domains/shared/crew-api-client"
pnpm dev > "$LOG_DIR/api-server.log" 2>&1 &
API_PID=$!
SERVICES+=($API_PID)
log_success "API server starting (PID: $API_PID, http://localhost:3001)"
sleep 3

# Step 3: Start Web Portal
log_info "Starting Web Portal..."
cd "$PROJECT_ROOT/apps/unified-dashboard"
pnpm dev > "$LOG_DIR/web-portal.log" 2>&1 &
WEB_PID=$!
SERVICES+=($WEB_PID)
log_success "Web Portal starting (PID: $WEB_PID, http://localhost:3000)"
sleep 3

# Step 4: Start n8n
log_info "Starting n8n..."
cd "$PROJECT_ROOT"
if docker-compose -f docker-compose.yml up -d n8n > "$LOG_DIR/n8n.log" 2>&1; then
    log_success "n8n starting (http://localhost:5194)"
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

check_service() {
    local name=$1
    local url=$2
    local timeout=30
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "$name is healthy"
            return 0
        fi
        elapsed=$((elapsed + 1))
        sleep 1
    done

    log_warning "$name is not responding (timeout after ${timeout}s)"
    return 1
}

check_service "API Server" "http://localhost:3001/health"
check_service "Web Portal" "http://localhost:3000"
check_service "n8n" "http://localhost:5194"

###############################################################################
# Phase 5: Ready State
###############################################################################

log_header "✅ ALL SERVICES RUNNING"

echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo "  • Web Portal:   ${BLUE}http://localhost:3000${NC}"
echo "  • API Server:   ${BLUE}http://localhost:3001${NC}"
echo "  • n8n:          ${BLUE}http://localhost:5194${NC}"
echo "  • Supabase:     ${BLUE}http://localhost:54321${NC}"
echo ""
echo -e "${GREEN}Log Files:${NC}"
echo "  • API Server:   ${LOG_DIR}/api-server.log"
echo "  • Web Portal:   ${LOG_DIR}/web-portal.log"
echo "  • n8n:          ${LOG_DIR}/n8n.log"
echo "  • Supabase:     ${LOG_DIR}/supabase.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait

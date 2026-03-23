#!/bin/bash

################################################################################
# OpenRouter Crew Platform - Open All Dashboards in Browser Tabs
#
# This script opens all web-based interfaces in a single browser window
# with separate tabs for each service. Works on macOS, Linux, and Windows.
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for service and report status
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=60
    local attempts=0

    while [ $attempts -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            log_success "✅ $name is ready"
            return 0
        fi
        attempts=$((attempts + 1))
        if [ $((attempts % 10)) -eq 0 ]; then
            log_info "⏳ Waiting for $name... ($attempts/$max_attempts)"
        fi
        sleep 1
    done

    log_warning "⚠️  $name is not responding (may still be starting)"
    return 1
}

# Function to open URL in browser
open_browser() {
    local browser=""
    local urls=("$@")

    # Detect available browser
    if command -v open &> /dev/null; then
        # macOS
        browser="open"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        browser="xdg-open"
    elif command -v start &> /dev/null; then
        # Windows (Git Bash, etc.)
        browser="start"
    else
        log_error "No browser command found. Please open these URLs manually:"
        for url in "${urls[@]}"; do
            echo "  → $url"
        done
        return 1
    fi

    # Open first URL in new window
    local first_url="${urls[0]}"
    log_info "Opening browser to $first_url..."
    "$browser" "$first_url" 2>/dev/null || true
    sleep 2

    # Open remaining URLs in tabs (macOS only via applescript, otherwise use xdg-open)
    if [[ "$browser" == "open" ]]; then
        # macOS specific: open additional tabs
        for i in "${!urls[@]}"; do
            if [ $i -gt 0 ]; then
                url="${urls[$i]}"
                osascript -e "tell application \"Google Chrome\" to open location \"$url\""  2>/dev/null || \
                osascript -e "tell application \"Safari\" to open location \"$url\""  2>/dev/null || \
                open -a "Google Chrome" "$url" 2>/dev/null || \
                "$browser" "$url" 2>/dev/null || \
                true
                sleep 0.5
            fi
        done
    else
        # Linux/Windows: open additional tabs if browser supports it
        for i in "${!urls[@]}"; do
            if [ $i -gt 0 ]; then
                url="${urls[$i]}"
                "$browser" "$url" 2>/dev/null || true
                sleep 0.5
            fi
        done
    fi
}

################################################################################
# Main Execution
################################################################################

log_info "Waiting for all services to come online..."
echo ""

# Define services
declare -A services=(
    [3000]="Unified Dashboard (Project Management)"
    [3002]="DJ Booking Dashboard"
    [3003]="Alex AI Universal Dashboard"
    [3004]="Product Factory (Business Generator)"
    [5678]="n8n Workflow Automation"
)

# Wait for all services
all_ready=true
declare -a ready_urls

for port in "${!services[@]}"; do
    name="${services[$port]}"
    if wait_for_service "$port" "$name"; then
        ready_urls+=("http://localhost:$port")
    else
        all_ready=false
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$all_ready" = true ]; then
    log_success "All services are online!"
else
    log_warning "Some services may still be starting..."
fi

echo ""
echo -e "${BLUE}Available Dashboards:${NC}"
echo "  🎯 Unified Dashboard (PM):    ${BLUE}http://localhost:3000${NC}"
echo "     Project management, sprints, stories, real-time board"
echo ""
echo "  🎵 DJ Booking:                ${BLUE}http://localhost:3002${NC}"
echo "     Event management and booking system"
echo ""
echo "  🤖 Alex AI Universal:         ${BLUE}http://localhost:3003${NC}"
echo "     AI orchestration and agent coordination"
echo ""
echo "  🏭 Product Factory:           ${BLUE}http://localhost:3004${NC}"
echo "     Local business generation (BarItalia test project)"
echo ""
echo "  ⚙️  n8n Workflows:             ${BLUE}http://localhost:5678${NC}"
echo "     Workflow automation and integration hub"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Open browser
if [ ${#ready_urls[@]} -gt 0 ]; then
    log_info "Opening browser with ${#ready_urls[@]} tab(s)..."
    open_browser "${ready_urls[@]}"
    log_success "Browser opened! All tabs should be loading..."
else
    log_error "No services are ready. Check your server logs."
    exit 1
fi

echo ""
log_info "💡 Tip: Use Ctrl+K to focus on address bar and type new URL"
log_info "💡 Tip: Use Cmd+Option+Right/Left (Mac) or Ctrl+Tab to switch tabs"
echo ""

#!/bin/bash

# OpenRouter Crew Platform - Setup Verification Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}OpenRouter Crew Platform - Setup Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

passed=0
failed=0

check() {
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $description"
        ((failed++))
    fi
}

# Prerequisites
echo "Prerequisites:"
check "Node.js installed (v20+)" "node --version | grep -qE 'v2[0-9]'"
check "npm installed" "npm --version"
check "pnpm installed (v9+)" "pnpm --version | grep -qE '9|10|11'"
check "git installed" "git --version"
check "Docker installed" "docker --version"
check "Supabase CLI installed" "supabase --version"

echo ""
echo "Project Structure:"
check "apps/cli directory exists" "[ -d 'apps/cli' ]"
check "apps/unified-dashboard exists" "[ -d 'apps/unified-dashboard' ]"
check "domains/vscode-extension exists" "[ -d 'domains/vscode-extension' ]"
check "domains/shared/crew-api-client exists" "[ -d 'domains/shared/crew-api-client' ]"
check "domains/shared/n8n-integration exists" "[ -d 'domains/shared/n8n-integration' ]"

echo ""
echo "Configuration Files:"
check "package.json exists" "[ -f 'package.json' ]"
check ".env.local exists" "[ -f '.env.local' ]"
check ".env.production exists" "[ -f '.env.production' ]"
check "pnpm-lock.yaml exists" "[ -f 'pnpm-lock.yaml' ]"

echo ""
echo "Test Files:"
check "CLI tests exist" "[ -d 'apps/cli/tests' ]"
check "Dashboard tests exist" "[ -d 'apps/unified-dashboard/tests' ]"
check "VSCode tests exist" "[ -d 'domains/vscode-extension/tests' ]"
check "n8n tests exist" "[ -d 'domains/shared/n8n-integration/tests' ]"
check "Integration tests exist" "[ -d 'tests/e2e' ]"
check "Deployment tests exist" "[ -d 'tests/deployment' ]"

echo ""
echo "Documentation:"
check "LOCAL_DEVELOPMENT_GUIDE exists" "[ -f 'LOCAL_DEVELOPMENT_GUIDE.md' ]"
check "DEPLOYMENT_READINESS exists" "[ -f 'DEPLOYMENT_READINESS.md' ]"
check "PROJECT_COMPLETION_SUMMARY exists" "[ -f 'PROJECT_COMPLETION_SUMMARY.md' ]"
check "QUICK_START_LOCAL exists" "[ -f 'QUICK_START_LOCAL.md' ]"

echo ""
echo "Scripts:"
check "deploy.sh exists" "[ -f 'scripts/deploy.sh' ]"
check "deploy.sh is executable" "[ -x 'scripts/deploy.sh' ]"
check "start-local-dev.sh exists" "[ -f 'scripts/start-local-dev.sh' ]"
check "start-local-dev.sh is executable" "[ -x 'scripts/start-local-dev.sh' ]"

echo ""
echo "Port Availability:"
check "Port 3000 available" "! lsof -i :3000 > /dev/null 2>&1"
check "Port 3001 available" "! lsof -i :3001 > /dev/null 2>&1"
check "Port 5194 available" "! lsof -i :5194 > /dev/null 2>&1"
check "Port 54321 available" "! lsof -i :54321 > /dev/null 2>&1"

echo ""
echo "Git Status:"
check "Git repo initialized" "git rev-parse --git-dir > /dev/null 2>&1"
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo -e "${BLUE}ℹ${NC} Current branch: $current_branch"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "Results: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ $failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All checks passed! System is ready for local development.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/start-local-dev.sh"
    echo "  2. Wait for all services to start (takes 10-15 minutes)"
    echo "  3. Open http://localhost:3000 in your browser"
    echo "  4. Follow QUICK_START_LOCAL.md for testing"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some checks failed. Please resolve issues above before starting.${NC}"
    echo ""
    if ! command -v pnpm &> /dev/null; then
        echo "To install pnpm:"
        echo "  npm install -g pnpm"
    fi
    if ! command -v supabase &> /dev/null; then
        echo "To install Supabase CLI:"
        echo "  npm install -g @supabase/cli"
    fi
    echo ""
    exit 1
fi

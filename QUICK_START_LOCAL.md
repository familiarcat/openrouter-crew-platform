# 🚀 Quick Start: Running OpenRouter Crew Platform Locally

## ⏱️ Expected Time: 15-20 minutes

This guide gets you from zero to fully-functional local environment with all 5 surfaces running and integrated.

---

## Step 1: Verify Prerequisites (2 minutes)

All required tools should already be installed. Verify:

```bash
# From project root
node --version      # Should be v22+
npm --version       # Should be 10+
pnpm --version      # Should be 9+
git --version       # Should be 2+
docker --version    # Should be 27+
supabase --version  # Should be 2.3+
```

✅ If all commands return versions, you're ready to proceed.

---

## Step 2: Environment Setup (1 minute)

The `.env.local` file has already been created with development defaults:

```bash
# Verify .env.local exists
ls -la .env.local

# Contents should include:
# NODE_ENV=development
# SUPABASE_URL=http://localhost:54321
# N8N_URL=http://localhost:5194
```

---

## Step 3: Start All Services (10 minutes)

Run the automated startup script:

```bash
# Make script executable (if needed)
chmod +x scripts/start-local-dev.sh

# Start all services
./scripts/start-local-dev.sh
```

This will:
1. ✅ Install dependencies (pnpm install)
2. ✅ Build all packages (pnpm build)
3. ✅ Start Supabase (PostgreSQL database)
4. ✅ Start API server (localhost:3001)
5. ✅ Start Web portal (localhost:3000)
6. ✅ Start n8n (localhost:5194)
7. ✅ Build CLI (ready to use)
8. ✅ Verify all services are healthy

**Expected Output:**
```
═══════════════════════════════════════════════════════
✅ ALL SERVICES RUNNING
═══════════════════════════════════════════════════════

Service URLs:
  • Web Portal:   http://localhost:3000
  • API Server:   http://localhost:3001
  • n8n:          http://localhost:5194
  • Supabase:     http://localhost:54321

Press Ctrl+C to stop all services
```

---

## Step 4: Verify Each Surface (5 minutes)

### 4A. Web Portal (React + Next.js)
```bash
# In browser, open:
# http://localhost:3000

# Expected pages:
# - Dashboard (/)
# - Projects (/projects)
# - Budget Management (/budget)
# - Analytics (/analytics)
# - Archive Management (/archive)
```

### 4B. API Server
```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","services":["cost","analytics","archival"]}
```

### 4C. n8n Workflows
```bash
# In browser, open:
# http://localhost:5194

# Expected workflows visible:
# - Cost Management Workflow
# - Analytics Trigger Workflow
# - Memory Archival Workflow
# - Budget Alert Automation
```

### 4D. CLI Commands
```bash
# Build CLI if not already built
cd apps/cli && pnpm build

# Test budget commands
pnpm crew budget set --crew-id test_crew --amount 1000 --period monthly
pnpm crew budget status --crew-id test_crew
pnpm crew budget alert --crew-id test_crew --threshold 80 --channel email

# Test analytics commands
pnpm crew analytics summary --crew-id test_crew
pnpm crew analytics recommendations --crew-id test_crew

# Test archive commands
pnpm crew archive list --crew-id test_crew
pnpm crew archive delete --crew-id test_crew --days-old 30
```

### 4E. Supabase Database
```bash
# Access Supabase dashboard
# http://localhost:54321

# Verify tables exist:
# - budgets
# - analytics
# - archives
# - memories
```

---

## Step 5: Run Integration Tests (3 minutes)

Test that all surfaces work together:

```bash
# All tests (575+)
npm test

# Specific test suites
npm test -- tests/e2e/system-integration.test.ts      # 12 tests
npm test -- tests/deployment/health-checks.test.ts    # 8 tests
npm test -- tests/contracts/api-contract.test.ts      # 8 tests
npm test -- tests/performance/load-tests.test.ts      # 6 tests

# CLI tests
npm test -- apps/cli/tests

# Web Dashboard tests
npm test -- apps/unified-dashboard/tests

# VSCode Extension tests
npm test -- domains/vscode-extension/tests

# n8n Workflow tests
npm test -- domains/shared/n8n-integration/tests
```

**Expected Result:**
```
Test Suites: 50+ passed, 0 failed
Tests:       575+ passed, 0 failed
Coverage:    95%+ across core services
```

---

## Step 6: Test End-to-End Workflows (5 minutes)

### Budget Management Flow

```bash
# 1. Set budget via API
curl -X POST http://localhost:3001/api/budgets \
  -H "Content-Type: application/json" \
  -d '{"crew_id":"test_crew","amount":1000,"period":"monthly"}'

# 2. Update spent amount
curl -X PATCH http://localhost:3001/api/budgets/test_crew \
  -H "Content-Type: application/json" \
  -d '{"spent":500}'

# 3. Check via Web UI
# Go to http://localhost:3000/budget
# Should show: $500 spent / $1000 budget (50%)

# 4. Get via CLI
pnpm crew budget status --crew-id test_crew

# Expected output:
# Budget Status for test_crew
# ├── Limit: $1,000.00
# ├── Spent: $500.00
# ├── Remaining: $500.00
# └── Status: 🟡 Warning (50% used)
```

### Analytics Flow

```bash
# 1. Record memory access
curl -X POST http://localhost:3001/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"crew_id":"test_crew","memory_id":"mem_1","type":"access"}'

# 2. Generate insights
curl http://localhost:3001/api/analytics/insights?crew_id=test_crew

# 3. View in Web UI
# Go to http://localhost:3000/analytics
# Should show: Memory insights, topics, recommendations

# 4. Get via CLI
pnpm crew analytics summary --crew-id test_crew
pnpm crew analytics recommendations --crew-id test_crew
```

### Archive Flow

```bash
# 1. Archive old memories
curl -X POST http://localhost:3001/api/archives \
  -H "Content-Type: application/json" \
  -d '{"crew_id":"test_crew","days_old":30,"compression":true}'

# 2. View archives
curl http://localhost:3001/api/archives?crew_id=test_crew

# 3. View in Web UI
# Go to http://localhost:3000/archive
# Should show: Archived memories, statistics, operations

# 4. Manage via CLI
pnpm crew archive list --crew-id test_crew
pnpm crew archive delete --crew-id test_crew --days-old 60 --force
```

---

## Step 7: Debugging & Logs

If something doesn't work, check the logs:

```bash
# All logs are in .logs/ directory
ls -la .logs/

# View specific service logs
tail -f .logs/api-server.log       # API server debug
tail -f .logs/web-portal.log       # Web portal debug
tail -f .logs/n8n.log              # n8n debug
tail -f .logs/supabase.log         # Database debug
tail -f .logs/install.log          # Installation issues
tail -f .logs/build.log            # Build issues
```

**Common Issues:**

1. **Port already in use**
   ```bash
   # Kill existing process on port 3000/3001/5194
   lsof -i :3000  # Find process using port 3000
   kill -9 <PID>
   ```

2. **Supabase not starting**
   ```bash
   # Make sure Docker is running
   docker ps
   
   # Reset Supabase
   supabase stop
   supabase start
   ```

3. **Build failures**
   ```bash
   # Clean and rebuild
   pnpm clean
   pnpm install
   pnpm build
   ```

---

## Step 8: Next Steps

Once everything is running locally:

1. **Explore the Web Portal**: Visit http://localhost:3000
2. **Test CLI Commands**: Use the commands shown in Step 4D
3. **Review Documentation**:
   - [LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md) - Detailed local setup
   - [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md) - Production deployment
   - [PROJECT_COMPLETION_SUMMARY.md](./PROJECT_COMPLETION_SUMMARY.md) - Project overview

4. **Deploy to Cloud**: When ready, run `./scripts/deploy.sh`

---

## Step 9: Stop Services

To cleanly stop all services:

```bash
# Press Ctrl+C in the terminal running start-local-dev.sh

# Or manually stop:
pnpm stop-services    # Stop Node processes
./scripts/stop-nextjs.sh # Stop Next.js instances specifically
supabase stop         # Stop Supabase
docker-compose down   # Stop Docker containers
```

---

## Troubleshooting Checklist

- [ ] All prerequisites installed (node, npm, pnpm, git, docker)
- [ ] .env.local file exists and is readable
- [ ] No services running on ports 3000, 3001, 5194, 54321
- [ ] Docker daemon is running
- [ ] At least 4GB free disk space
- [ ] Network connectivity for downloading packages

---

## Support

If you encounter issues:

1. Check `.logs/` directory for error messages
2. Review [LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md#part-7-debugging--troubleshooting)
3. Verify prerequisites are correct versions
4. Try `pnpm clean && pnpm install && pnpm build`

---

**You now have a fully-functional local OpenRouter Crew Platform! 🎉**

Start with: `./scripts/start-local-dev.sh`

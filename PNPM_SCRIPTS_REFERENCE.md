# 📦 pnpm Scripts Reference

Quick reference for all development scripts available in the OpenRouter Crew Platform.

---

## 🚀 Main Development Scripts

### Start Everything (RECOMMENDED)

```bash
pnpm dev:universal
```

**Starts:**
- ✅ All 4 dashboards (unified, dj-booking, alex-ai, product-factory)
- ✅ Supabase local database
- ✅ VSCode extension in watch mode
- ✅ Opens all web interfaces in browser with tabs

**Ports:** 3000, 3002, 3003, 3004, 54321
**Time to ready:** 60-90 seconds
**When to use:** First thing every development session

---

### Start Just Dashboards (No Database)

```bash
pnpm dev:dashboards
```

**Starts:**
- ✅ Unified Dashboard (3000)
- ✅ DJ Booking (3002)
- ✅ Alex AI (3003)
- ✅ Product Factory (3004)

**Use this when:** You don't need database changes, just UI development

---

### Start Individual Dashboards

```bash
pnpm dev:unified              # Project management (3000)
pnpm dev:dj                   # DJ booking (3002)
pnpm dev:alex                 # Alex AI universal (3003)
pnpm dev:factory              # Product factory/business generator (3004)
```

**Use this when:** Working on a specific dashboard in isolation

---

### Database & Services

```bash
pnpm supabase:start           # Start local Supabase (54321)
pnpm supabase:stop            # Stop Supabase
pnpm supabase:reset           # ⚠️ WARNING: Delete all data and reset
pnpm supabase:status          # Check Supabase status

pnpm db:migrate               # Apply database migrations
pnpm db:seed                  # Seed with test data
```

**Supabase URL:** http://localhost:54321 (after `pnpm dev:universal`)

---

## 🔨 Building & Compilation

```bash
pnpm build                    # Full monorepo build (all packages)
pnpm build:dashboards         # Build only Next.js dashboards
pnpm build:dashboard          # Build unified dashboard only

pnpm fix:tsconfig             # Fix TypeScript config issues
pnpm type-check               # Check TypeScript without building
pnpm lint                     # Lint all code
```

---

## 🧪 Testing

```bash
pnpm test                     # Run all tests (unit, integration, e2e)
pnpm test:integration         # Integration tests only
pnpm test:e2e                 # End-to-end tests only
pnpm test:scripts             # Test system scripts

# Specific test file (from unified-dashboard)
pnpm --filter @openrouter-crew/unified-dashboard test -- sprint-api.test.ts
```

---

## 🔌 VSCode Extension

```bash
pnpm vscode:install           # Package & install extension
pnpm vscode:package           # Create .vsix file only
pnpm vscode:clean             # Remove build artifacts

# Development
pnpm --filter openrouter-crew-vscode watch    # Watch for changes
```

**After install:** Reload VSCode (Cmd+Shift+P → "Developer: Reload Window")

---

## 🎮 CLI Tools

```bash
pnpm --filter @openrouter-crew/cli build      # Build CLI
pnpm --filter @openrouter-crew/cli dev        # Dev mode

# Then use:
crew --help                   # All available commands
crew cost status              # Current spending
crew project list             # All projects
```

---

## 🧠 Memory System

```bash
pnpm memory:dev               # Start memory API server
pnpm memory:build             # Build memory package
pnpm memory:test              # Test memory system

pnpm memory:unify             # Quick memory unification
pnpm memory:unify:full        # Full memory unification
pnpm memory:unify:step        # Step-by-step unification

# CLI
pnpm memory:cli:stats         # Memory statistics
pnpm memory:cli:list          # List all memories
pnpm memory:cli:search        # Search memories
```

---

## 🔐 Secrets & Environment

```bash
pnpm secrets:load             # Load .env.local from secure storage
pnpm secrets:validate         # Check all required vars present
pnpm secrets:sync             # Sync secrets across projects
pnpm secrets:distribute       # Distribute to all packages
```

---

## 🤖 n8n Workflow Automation

```bash
pnpm n8n:sync                 # Sync workflows with n8n
pnpm n8n:export               # Export workflows to file
pnpm n8n:activate             # Activate all workflows
pnpm n8n:verify               # Verify webhooks configured
pnpm n8n:backup               # Backup workflows
```

---

## 🚢 Deployment

```bash
pnpm deploy:full              # Deploy entire platform
pnpm deploy:vercel            # Deploy dashboards to Vercel
pnpm deploy:aws               # Deploy to AWS

pnpm deploy:dns               # Configure DNS
pnpm deploy:remote            # Trigger GitHub deploy

pnpm ship                      # Complete release process
```

---

## 🐳 Docker

```bash
pnpm docker:up                # Start all containers
pnpm docker:down              # Stop all containers
pnpm docker:logs              # View container logs
pnpm docker:clean             # Remove all containers/images

pnpm dev:all                  # docker-compose up (old style)
```

---

## 📊 Analyzing & Metrics

```bash
pnpm version:generate         # Generate version info
pnpm version:current          # Show current version
pnpm version:badge            # Generate version badge
pnpm version:api              # API version info
pnpm version:page             # Version page
pnpm version:status           # Version status
```

---

## 📚 Documentation & Organization

```bash
pnpm feature:create           # Create feature branch
pnpm feature:push             # Push feature branch
pnpm story:create             # Create user story
pnpm story:push               # Push story to tracker
pnpm milestone:create         # Create milestone
pnpm milestone:push           # Push milestone

pnpm milestone:list           # List all milestones
pnpm milestone:current        # Current milestone

pnpm organize                 # Organize workspace
pnpm git:verify               # Verify git status
pnpm git:setup                # Setup git remote
```

---

## 🧹 Cleanup & Maintenance

```bash
pnpm clean                    # Clean all build artifacts
pnpm reset                    # Full reset (hard restart)

pnpm sync:all                 # Sync all packages
pnpm fix:deps                 # Fix dependency issues
```

---

## 📋 Quick Command Lookup

| Need | Command |
|------|---------|
| **Start developing** | `pnpm dev:universal` |
| **Just dashboards** | `pnpm dev:dashboards` |
| **One specific dashboard** | `pnpm dev:unified` (or dj, alex, factory) |
| **Database only** | `pnpm supabase:start` |
| **Build everything** | `pnpm build` |
| **Run tests** | `pnpm test` |
| **Install VSCode extension** | `pnpm vscode:install` |
| **Check types** | `pnpm type-check` |
| **View help** | `pnpm --help` |
| **Reset everything** | `pnpm reset` |
| **CLI tool** | `pnpm --filter @openrouter-crew/cli build` |
| **View Supabase** | Visit http://localhost:54321 |
| **Stop services** | `Ctrl+C` in terminal |

---

## 🎬 Common Development Workflows

### First Time Setup

```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform
pnpm install
pnpm secrets:load
pnpm dev:universal
```

### Daily Development

```bash
# Terminal 1: Start everything
pnpm dev:universal

# Terminal 2: Watch VSCode extension (if changing extension)
pnpm --filter openrouter-crew-vscode watch

# Terminal 3: Run tests (if changing code)
pnpm test

# Then reload VSCode: Cmd+Shift+P → Reload Window
```

### Testing Specific Feature

```bash
# Start just what you need
pnpm dev:unified

# In another terminal:
pnpm --filter @openrouter-crew/unified-dashboard test -- feature.test.ts

# Type check
pnpm type-check
```

### Before Committing

```bash
pnpm type-check    # No TS errors
pnpm lint          # No style issues
pnpm test          # All tests pass
git add .
git commit -m "feat: description"
```

### Deploying to Production

```bash
pnpm build                 # Full build
pnpm test                  # Run tests
pnpm deploy:vercel         # Deploy dashboards
pnpm deploy:aws            # Deploy backend
```

---

## 🔍 Finding the Right Script

**I want to...**

- Start developing → `pnpm dev:universal`
- Work on just one dashboard → `pnpm dev:unified` (or dj, alex, factory)
- Check if code compiles → `pnpm type-check`
- Run tests → `pnpm test`
- Install VSCode extension → `pnpm vscode:install`
- Use the CLI → `pnpm --filter @openrouter-crew/cli build`
- View the database → `pnpm supabase:start` then visit http://localhost:54321
- Deploy to production → `pnpm deploy:vercel`
- Reset everything → `pnpm reset`

---

## 💡 Pro Tips

1. **Use `pnpm dev:universal` as your default** - starts everything you need
2. **Keep terminal open** - shows real-time output from all services
3. **Browser tabs auto-open** - wait for them to load before interacting
4. **Reload VSCode after extension changes** - Cmd+Shift+P → "Developer: Reload Window"
5. **Watch the logs** - `.logs/` directory has output from each service
6. **Port conflicts?** - Run `bash scripts/system/cleanup-ports.sh`
7. **Supabase won't start?** - Make sure Docker is running

---

## 📖 More Information

- **Full testing guide:** [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)
- **PM system overview:** [PM_SYSTEM_LAUNCH_CHECKLIST.md](PM_SYSTEM_LAUNCH_CHECKLIST.md)
- **Project memory:** [CLAUDE.md](CLAUDE.md)

---

**Last Updated:** 2026-03-02
**Version:** 1.0.0 (All Phases Complete)

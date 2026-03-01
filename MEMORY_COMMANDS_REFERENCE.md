# 🎯 Memory System Commands Reference

Complete guide to all memory system commands available via `pnpm` in root workspace.

---

## 📋 Available Commands by Environment

### 🚀 Development Environment

**Start Memory API Server**
```bash
pnpm memory:dev
```
- Starts REST API server on port 3333
- Serves memory dashboard at `http://localhost:3333`
- Hot-reload ready for development

**Build Memory Package**
```bash
pnpm memory:build
```
- Compiles TypeScript to JavaScript
- Generates type definitions
- Creates build artifacts in `dist/`

**Clean Build Cache**
```bash
pnpm memory:clean
```
- Removes compiled artifacts
- Clears incremental build cache
- Useful before full rebuild

**Type Check**
```bash
pnpm memory:type-check
```
- Validates TypeScript without emitting
- Checks for type errors
- Part of CI/CD pipeline

---

### 🧪 Testing & Validation

**Run Tests**
```bash
pnpm memory:test
```
- Executes all test suites
- Generates coverage report
- Validates code quality

**Quick Preview (2 minutes)**
```bash
pnpm memory:test:quick
```
- Starts API server
- Opens dashboard in browser
- Shows memory statistics
- All in one command!

**View Testing Guide**
```bash
pnpm memory:test:preview
```
- Opens TESTING_AND_PREVIEW.md
- Comprehensive testing walkthrough
- 8 testing sections with examples

**View Demo Script**
```bash
pnpm memory:test:demo
```
- Opens LIVE_DEMO.md
- 5-minute visual walkthrough
- Expected outputs included

---

### 🖥️ CLI Tool Commands

**Show Statistics**
```bash
pnpm memory:cli:stats [projectId]
```
- Displays memory count by layer
- Shows edge statistics
- Displays retention distribution

Example:
```bash
pnpm memory:cli:stats my-project
```

**List Memories**
```bash
pnpm memory:cli:list [projectId] [layer]
```
- Lists all memories for project
- Optional layer filter
- Shows confidence and metadata

Example:
```bash
pnpm memory:cli:list my-project
pnpm memory:cli:list my-project 1  # Only Layer 1
```

**Test Retrieval**
```bash
pnpm memory:cli:test [projectId] [context]
```
- Tests memory retrieval with context
- Returns ranked results
- Shows relevance scores

Example:
```bash
pnpm memory:cli:test my-project "debugging React hooks"
```

**Show Memory Details**
```bash
pnpm memory:cli:show [memoryId]
```
- Displays full memory details
- Shows all metadata
- Lists connected memories

Example:
```bash
pnpm memory:cli:show 550e8400-e29b-41d4-a716-446655440000
```

**Debug Information**
```bash
pnpm memory:cli:debug [projectId]
```
- Provides detailed debug output
- Shows system statistics
- Performance metrics

Example:
```bash
pnpm memory:cli:debug my-project
```

---

### 🧠 Platform Unification

**Quick Unification (Recommended First)**
```bash
pnpm memory:unify
```
- Runs quick setup (--quick mode)
- Skips npm publishing and database
- Takes ~2-3 minutes
- Best for local development

**Full Production Unification**
```bash
pnpm memory:unify:full
```
- Complete integration with npm publish
- Applies database migrations
- Publishes to npm registry
- Takes ~5 minutes

**Run Specific Step**
```bash
pnpm memory:unify:step [stepName]
```
- Available steps:
  - `prerequisites` - Check environment
  - `database` - Apply migrations
  - `dependencies` - Install packages
  - `build-memory` - Build memory system
  - `build-dashboard` - Build Next.js dashboard
  - `design` - Generate design system
  - `docs` - Generate documentation
  - `integration` - Create integration guides
  - `publish` - Publish to npm
  - `deploy` - Deploy artifacts
  - `report` - Show final report

Example:
```bash
pnpm memory:unify:step build-memory
pnpm memory:unify:step docs
pnpm memory:unify:step report
```

---

### 📦 Publishing & Deployment

**Publish Package (Patch Release)**
```bash
pnpm memory:publish patch
```
- Version: 1.0.0 → 1.0.1
- For bug fixes
- Publishes to npm

**Publish Minor Release**
```bash
pnpm memory:publish minor
```
- Version: 1.0.0 → 1.1.0
- For new features
- Backward compatible

**Publish Major Release**
```bash
pnpm memory:publish major
```
- Version: 1.0.0 → 2.0.0
- For breaking changes
- Updates changelog

**Preview Release (No Publishing)**
```bash
pnpm memory:publish preview
```
- Tests entire process
- No actual publishing
- Useful for validation

---

## 🏗️ Environment-Specific Workflows

### Local Development

```bash
# 1. Setup
pnpm memory:build
pnpm memory:type-check

# 2. Development
pnpm memory:dev

# 3. In another terminal - Test
pnpm memory:test:quick

# 4. Explore CLI
pnpm memory:cli:stats my-project
pnpm memory:cli:list my-project
```

### Testing & QA

```bash
# 1. Run tests
pnpm memory:test

# 2. Preview system
pnpm memory:test:quick

# 3. Full validation
pnpm memory:test:preview
pnpm memory:test:demo

# 4. Check specific step
pnpm memory:unify:step build-memory
```

### UAT (User Acceptance Testing)

```bash
# 1. Full deployment
pnpm memory:unify:full

# 2. Verify API
pnpm memory:dev &
sleep 2

# 3. Run comprehensive tests
pnpm memory:cli:stats test-project
pnpm memory:cli:list test-project
pnpm memory:cli:test test-project "sample context"

# 4. Check documentation
open /tmp/memory-docs-*/index.html
```

### Production Deployment

```bash
# 1. Verify environment
pnpm memory:type-check
pnpm memory:test

# 2. Publish to npm
pnpm memory:publish patch
# or
pnpm memory:publish minor
# or
pnpm memory:publish major

# 3. Deploy
pnpm memory:unify:full

# 4. Verify deployment
pnpm memory:cli:stats production-project
```

---

## 🔄 Common Workflows

### Workflow 1: Local Development Cycle

```bash
# One-time setup
pnpm memory:build
pnpm memory:type-check

# Start development
pnpm memory:dev
# Visit http://localhost:3333 in browser

# In another terminal, run tests
pnpm memory:test:quick

# Make code changes, rebuild automatically...
# Server hot-reloads
```

### Workflow 2: Complete System Preview

```bash
# Everything in one go
pnpm memory:test:quick

# Or step by step
pnpm memory:unify
pnpm memory:dev &
open http://localhost:3333
npx memory-cli stats test-project
```

### Workflow 3: Validate Before Release

```bash
# Full validation suite
pnpm memory:type-check
pnpm memory:test
pnpm memory:unify:step build-memory
pnpm memory:unify:step docs
pnpm memory:unify:step report

# If all pass, publish
pnpm memory:publish patch
```

### Workflow 4: Update Memory Data

```bash
# Start server
pnpm memory:dev &

# Add some test data
pnpm memory:cli:store test-project "Sample observation" layer1

# View statistics
pnpm memory:cli:stats test-project

# Test retrieval
pnpm memory:cli:test test-project "debugging"
```

---

## 🎯 Command Combinations

### Full Integration Test
```bash
pnpm memory:clean && \
pnpm memory:build && \
pnpm memory:type-check && \
pnpm memory:test && \
echo "✅ All checks passed!"
```

### Complete Deployment
```bash
pnpm memory:clean && \
pnpm memory:build && \
pnpm memory:type-check && \
pnpm memory:test && \
pnpm memory:unify:full && \
pnpm memory:publish patch
```

### Quick Validation
```bash
pnpm memory:build && \
pnpm memory:type-check && \
pnpm memory:test:quick
```

---

## 📊 Command Reference Table

| Command | Purpose | Environment | Time |
|---------|---------|-------------|------|
| `memory:dev` | Start API server | Dev | Ongoing |
| `memory:build` | Compile TypeScript | Dev/CI | 10s |
| `memory:clean` | Clear cache | Dev | 2s |
| `memory:type-check` | Type validation | CI | 30s |
| `memory:test` | Run tests | CI | 1m |
| `memory:test:quick` | Quick preview | Dev | 2m |
| `memory:test:preview` | Open test guide | Dev | N/A |
| `memory:test:demo` | Open demo guide | Dev | N/A |
| `memory:cli:stats` | Show statistics | Any | 1s |
| `memory:cli:list` | List memories | Any | 1s |
| `memory:cli:test` | Test retrieval | Any | 1s |
| `memory:cli:show` | Show details | Any | 1s |
| `memory:cli:debug` | Debug info | Dev | 2s |
| `memory:unify` | Quick setup | Dev | 2m |
| `memory:unify:full` | Full setup | Prod | 5m |
| `memory:unify:step` | Single step | Dev/CI | 10s-1m |
| `memory:publish` | Publish release | Prod | 2m |

---

## 🚨 Troubleshooting Commands

**Memory package won't build?**
```bash
pnpm memory:clean
pnpm memory:build
pnpm memory:type-check
```

**CLI tool not found?**
```bash
pnpm memory:build
npm link  # In agent-memory directory
npx memory-cli --help
```

**API server won't start?**
```bash
# Kill existing process
lsof -i :3333
kill -9 <PID>

# Try restart
pnpm memory:dev
```

**Tests failing?**
```bash
pnpm memory:clean
pnpm memory:build
pnpm memory:type-check
pnpm memory:test
```

---

## 📝 Useful Aliases

Add to your shell profile (`.bashrc`, `.zshrc`):

```bash
# Memory system shortcuts
alias mem-dev="pnpm memory:dev"
alias mem-build="pnpm memory:build"
alias mem-test="pnpm memory:test:quick"
alias mem-stats="pnpm memory:cli:stats test-project"
alias mem-cli="npx memory-cli"
alias mem-unify="pnpm memory:unify"
```

Then use:
```bash
mem-dev       # Start API server
mem-test      # Quick test
mem-stats     # Show statistics
mem-unify     # Run unification
```

---

## 🔑 Key Points

- ✅ All commands run from **project root**
- ✅ Commands work with **monorepo workspace**
- ✅ Most commands have **help output**
- ✅ Commands are **idempotent** (safe to run multiple times)
- ✅ CLI commands need **API server running** (except help)

---

## 📞 Getting Help

**See command details:**
```bash
npx memory-cli --help
npx memory-cli stats --help
npx memory-cli list --help
```

**View guides:**
```bash
cat START_HERE.md
cat UNIFY_QUICK_REFERENCE.md
cat PLATFORM_UNIFICATION.md
cat TESTING_AND_PREVIEW.md
cat LIVE_DEMO.md
```

---

## ✨ Quick Start Command

Single command to see everything:

```bash
pnpm memory:test:quick
```

This will:
1. Start the API server
2. Open the dashboard
3. Show memory statistics
4. All in ~2 minutes

---

**Ready?** Pick a command above and start exploring! 🚀

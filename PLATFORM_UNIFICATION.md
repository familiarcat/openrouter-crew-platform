# 🎨 Platform Unification Guide

Complete guide for executing the unified platform integration that connects the memory system with your entire project ecosystem.

## Overview

The `scripts/unify-platform.sh` script orchestrates a comprehensive 11-step process that:

1. **Validates Prerequisites** — Ensures all tools are installed and configured
2. **Sets Up Database** — Applies Supabase migrations for memory tables
3. **Installs Dependencies** — Runs pnpm install across the monorepo
4. **Builds Memory System** — Compiles TypeScript and generates build artifacts
5. **Builds Dashboard** — Builds the unified Next.js dashboard
6. **Generates Design System** — Creates unified CSS and design tokens
7. **Generates Documentation** — Builds documentation site and dashboard
8. **Creates Integration Hooks** — Generates integration guides and configuration
9. **Publishes to npm** — Publishes the memory package to npmjs.org (optional)
10. **Deploys Artifacts** — Prepares deployment packages with manifests
11. **Reports Status** — Generates comprehensive summary report

## Quick Start

### Option A: Full Integration (with npm publishing)

```bash
./scripts/unify-platform.sh --full
```

This will:
- ✅ Apply database migrations
- ✅ Build all packages
- ✅ Generate design system
- ✅ Publish to npm
- ✅ Deploy artifacts

**Prerequisites:**
- `NPM_TOKEN` environment variable set
- `SUPABASE_URL` and `SUPABASE_KEY` set
- npm account with @openrouter-crew scope access

### Option B: Quick Integration (no npm publishing)

```bash
./scripts/unify-platform.sh --quick
```

This will:
- ✅ Build all packages
- ✅ Generate design system
- ✅ Generate documentation
- ✅ Skip npm publishing
- ⊘ Skip database migration (can be run manually)

**Best for:** Local testing and development

### Option C: Skip Database Only

```bash
./scripts/unify-platform.sh --skip-db
```

Use this if you've already run the database migration or want to handle it separately.

### Option D: Run Single Step

```bash
./scripts/unify-platform.sh --step=build-memory
```

Available steps:
- `prerequisites` — Check tools and environment
- `database` — Apply Supabase migrations
- `dependencies` — Install dependencies
- `build-memory` — Build memory system
- `build-dashboard` — Build Next.js dashboard
- `design` — Generate design system
- `docs` — Generate documentation
- `integration` — Create integration guides
- `publish` — Publish to npm
- `deploy` — Deploy artifacts
- `report` — Show status report

## Execution Examples

### Example 1: Local Development Setup

```bash
# Quick setup without publishing
./scripts/unify-platform.sh --quick

# Then manually apply database migration
cd domains/shared/agent-memory
supabase db push

# Start the memory API server
node dist/memory-api.js
```

**Output:** Ready for local testing with memory system running

### Example 2: Production Deployment

```bash
# Full integration with npm publishing
export NPM_TOKEN="your-token-here"
export SUPABASE_URL="your-url-here"
export SUPABASE_KEY="your-key-here"

./scripts/unify-platform.sh --full
```

**Output:** Deployed to npm, documentation site, and ready for integration

### Example 3: Troubleshooting Individual Steps

```bash
# Check what's failing
./scripts/unify-platform.sh --step=prerequisites

# Fix issues, then retry
./scripts/unify-platform.sh --step=build-memory

# Deploy once fixed
./scripts/unify-platform.sh --step=deploy
```

## What Gets Created

### 1. Memory System Package
```
domains/shared/agent-memory/
├── dist/
│   ├── index.js                 ← Main entry point
│   ├── index.d.ts               ← Type definitions
│   ├── design-system.js         ← Design tokens
│   ├── design-tokens.json       ← Token export
│   ├── dashboard.css            ← Unified CSS framework
│   ├── memory-api.js            ← API server
│   ├── cli.js                   ← CLI tool
│   └── ...other modules
├── package.json                 ← Published to npm
└── README.md                    ← Published documentation
```

### 2. Documentation Site
```
/tmp/memory-docs-TIMESTAMP/
├── index.html                   ← Documentation portal
├── dashboard.html               ← Interactive dashboard
├── README.md                    ← Feature overview
├── QUICKSTART.md                ← 5-minute guide
├── DESIGN_SYSTEM.md             ← Design tokens
└── UNIFIED_DESIGN.md            ← Implementation guide
```

### 3. Design System Assets
```
Design tokens available in three formats:
├── CSS Variables                (for HTML/CSS)
│   color: var(--color-primary-500)
│   padding: var(--spacing-lg)
├── TypeScript Exports           (for React/TypeScript)
│   import { colors, spacing } from '@openrouter-crew/agent-memory'
└── JSON Export                  (for tools/scripts)
   design-tokens.json
```

### 4. Integration Configuration
```
Project Root/
├── MEMORY_INTEGRATION.md        ← Integration guide
├── PLATFORM_UNIFICATION.md      ← This file
├── .deploy-artifacts-TIMESTAMP/ ← Deployment manifests
└── domains/shared/agent-memory/
    ├── CI_CD_GUIDE.md           ← Publishing guide
    ├── CI_CD_SUMMARY.md         ← System overview
    └── scripts/
        └── publish.sh           ← Multi-platform publisher
```

## Environment Variables

### Required for Database Migration
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

Get these from: Supabase Dashboard → Project Settings → API

### Required for npm Publishing
```bash
export NPM_TOKEN="npm_xxxxxxxxxxxxxxxxxxxxxx"
```

Generate at: npm.com → Account → Tokens → Generate New Token

### Optional
```bash
export AWS_ACCESS_KEY_ID="your-aws-key"        # For AWS deployment
export AWS_SECRET_ACCESS_KEY="your-aws-secret" # For AWS deployment
```

## Integration Steps

After running the unification script, follow these steps to integrate with your crew system:

### Step 1: Review Integration Guide

```bash
cat MEMORY_INTEGRATION.md
```

This document shows exactly where to add code hooks.

### Step 2: Update CrewCoordinator

Add memory enrichment to your crew request handler:

```typescript
// In domains/shared/crew-coordination/src/coordinator.ts
import { createMemoryService } from '@openrouter-crew/agent-memory';

const memoryService = createMemoryService(supabaseClient);

// Before sending request to crew member:
const { enrichedMessage, contextId } = await memoryService.retrieve({
  projectId: request.projectId,
  context: request.message
});

// Send enriched request instead:
const enrichedRequest = {
  ...request,
  message: enrichedMessage
};
```

### Step 3: Capture Outcomes

After receiving response from crew member:

```typescript
// Report success or failure
await memoryService.reportOutcome({
  sessionId: request.sessionId,
  outcome: response.success ? 'success' : 'failure',
  outcomeDelta: response.success ? 0.05 : -0.10
});

// Store response as observation
await memoryService.store({
  crewId: request.crewMember,
  layer: 1,
  content: response.content
});
```

### Step 4: Test Integration

```bash
# Start memory API
node domains/shared/agent-memory/dist/memory-api.js

# Open dashboard
open http://localhost:3333

# Run sample interaction
npx memory-cli test <projectId> "your test context"
```

## Troubleshooting

### Issue: "pnpm not found"

**Solution:** Install pnpm globally
```bash
npm install -g pnpm
```

### Issue: "SUPABASE_URL not set"

**Solution:** Set environment variables before running
```bash
export SUPABASE_URL="your-url"
export SUPABASE_KEY="your-key"
./scripts/unify-platform.sh --full
```

Or skip database setup:
```bash
./scripts/unify-platform.sh --skip-db
```

### Issue: "npm publish failed"

**Solution:** Check npm token and scope access
```bash
# Verify token is valid
npm whoami

# Check scope access
npm access ls-packages

# Try manual publish
cd domains/shared/agent-memory
npm publish --access public
```

### Issue: Build fails with TypeScript errors

**Solution:** Verify tsconfig inheritance
```bash
# Check if tsconfig extends properly
cat domains/shared/agent-memory/tsconfig.json

# Rebuild with clean slate
pnpm --filter @openrouter-crew/agent-memory clean
pnpm --filter @openrouter-crew/agent-memory build
pnpm --filter @openrouter-crew/agent-memory type-check
```

### Issue: Documentation not generating

**Solution:** Verify markdown files exist
```bash
ls domains/shared/agent-memory/*.md
```

Should show: README.md, QUICKSTART.md, DESIGN_SYSTEM.md, UNIFIED_DESIGN.md, CHANGELOG.md

## Monitoring & Metrics

After integration, monitor:

### Memory System Health
```bash
# Check memory count
npx memory-cli stats <projectId>

# View growth over time
# Should see: observation count increasing, edge count growing, avg confidence stabilizing
```

### Design System Adoption
```bash
# Verify CSS variables used
grep -r "var(--color-" apps/ domains/

# Check TypeScript token imports
grep -r "from '@openrouter-crew/agent-memory'" apps/ domains/
```

### Integration Success
```bash
# Memory enrichment enabled
grep -r "memoryService.retrieve" domains/shared/crew-coordination/

# Outcome reporting
grep -r "reportOutcome" domains/shared/crew-coordination/

# Memory storage
grep -r "memoryService.store" domains/shared/crew-coordination/
```

## Next Steps

### Immediate (Ready Now)
- ✅ Run unification script
- ✅ Build and test memory system
- ✅ Generate documentation
- ✅ Review integration guide

### Short Term (1-2 days)
- → Integrate with CrewCoordinator
- → Test with sample project
- → Verify weight learning
- → Monitor memory growth

### Medium Term (1-2 weeks)
- → Deploy to production
- → Publish to npm
- → Train crew members on new features
- → Optimize memory retention and decay

### Long Term (Ongoing)
- → Monitor memory system performance
- → Adjust decay rates based on usage patterns
- → Add pattern synthesis to Layer 2
- → Implement dark mode and theming
- → Add advanced search and analytics

## Support & Questions

For detailed information, see:

1. **Memory System Overview**
   - `domains/shared/agent-memory/README.md`
   - `domains/shared/agent-memory/QUICKSTART.md`

2. **Design System**
   - `domains/shared/agent-memory/DESIGN_SYSTEM.md`
   - `domains/shared/agent-memory/UNIFIED_DESIGN.md`

3. **CI/CD & Publishing**
   - `domains/shared/agent-memory/CI_CD_GUIDE.md`
   - `domains/shared/agent-memory/CI_CD_SUMMARY.md`

4. **Integration Details**
   - `MEMORY_INTEGRATION.md` (auto-generated)
   - `domains/shared/agent-memory/scripts/publish.sh`

## Command Reference

### Run Full Integration
```bash
./scripts/unify-platform.sh --full
```

### Run Quick Setup
```bash
./scripts/unify-platform.sh --quick
```

### Run Specific Step
```bash
./scripts/unify-platform.sh --step=build-memory
./scripts/unify-platform.sh --step=docs
./scripts/unify-platform.sh --step=publish
```

### Build Only
```bash
pnpm --filter @openrouter-crew/agent-memory build
pnpm --filter unified-dashboard build
```

### Test Memory System
```bash
node domains/shared/agent-memory/dist/memory-api.js &
curl http://localhost:3333/api/health
```

### Use CLI Tool
```bash
npx memory-cli stats <projectId>
npx memory-cli test <projectId> "context string"
```

### Publish to npm & Docs
```bash
cd domains/shared/agent-memory
./scripts/publish.sh patch
```

---

**Status:** ✅ Platform unification system is complete and ready to use.

**Last Updated:** March 1, 2026

**Next:** Run `./scripts/unify-platform.sh --quick` to begin! 🚀

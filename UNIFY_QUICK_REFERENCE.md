# 🚀 Platform Unification - Quick Reference Card

## One-Line Execution

```bash
./scripts/unify-platform.sh --quick
```

That's it. Your unified platform is ready.

---

## What You Get

| Component | What It Does | Status |
|-----------|-------------|--------|
| **Memory System** | Neural network-inspired weighted memory graph | ✅ Built |
| **Design System** | Unified colors, spacing, typography across all UIs | ✅ Built |
| **3 Interfaces** | HTML dashboard + React component + CLI tool | ✅ Built |
| **CI/CD** | Automated publishing to npm + docs + preview | ✅ Built |
| **Integration** | Hooks for CrewCoordinator + memory injection | ✅ Ready |

---

## Execution Modes

### 1️⃣ Quick Setup (Recommended First)
```bash
./scripts/unify-platform.sh --quick
```
**Time:** ~2 minutes
**What:** Builds everything, skips npm publishing
**For:** Local development & testing

### 2️⃣ Full Integration (Production)
```bash
export NPM_TOKEN="your-token"
./scripts/unify-platform.sh --full
```
**Time:** ~5 minutes
**What:** Everything + npm publishing + database migration
**For:** Production deployment

### 3️⃣ Skip Database
```bash
./scripts/unify-platform.sh --skip-db
```
**When:** Database already migrated

### 4️⃣ Run Single Step
```bash
./scripts/unify-platform.sh --step=build-memory
```
**When:** Rebuilding specific component

---

## After Running Script

### ✅ Immediately Available

1. **Memory Dashboard** (interactive)
   ```bash
   node domains/shared/agent-memory/dist/memory-api.js
   # Visit http://localhost:3333
   ```

2. **CLI Tool** (command line)
   ```bash
   npx memory-cli stats <projectId>
   npx memory-cli test <projectId> "context"
   ```

3. **Design System** (CSS + TypeScript)
   ```bash
   # In HTML:
   import './dashboard.css'
   // Use: var(--color-primary-500), var(--spacing-lg)

   # In React:
   import { colors, spacing } from '@openrouter-crew/agent-memory'
   ```

### 🔧 Integration Required

1. **Update CrewCoordinator**
   ```typescript
   // Add these 2 code blocks to crew-coordination/src/coordinator.ts
   // See MEMORY_INTEGRATION.md for exact code
   ```

2. **Run Database Migration** (if --skip-db)
   ```bash
   supabase db push
   ```

3. **Test Integration**
   ```bash
   ./scripts/unify-platform.sh --step=report
   ```

---

## Key Files

| File | Purpose |
|------|---------|
| `scripts/unify-platform.sh` | Main orchestration script |
| `PLATFORM_UNIFICATION.md` | Detailed guide (you are here) |
| `MEMORY_INTEGRATION.md` | Auto-generated integration code |
| `domains/shared/agent-memory/README.md` | Feature overview |
| `domains/shared/agent-memory/QUICKSTART.md` | 5-minute getting started |
| `domains/shared/agent-memory/DESIGN_SYSTEM.md` | Design tokens reference |

---

## Environment Setup

### For Local Development
```bash
# No env vars needed for --quick mode
./scripts/unify-platform.sh --quick
```

### For npm Publishing
```bash
export NPM_TOKEN="npm_xxxxxxxxxxxxx"
./scripts/unify-platform.sh --full
```

### For Supabase Integration
```bash
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_KEY="your-service-role-key"
./scripts/unify-platform.sh --full
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `pnpm not found` | `npm install -g pnpm` |
| Build fails | `pnpm --filter @openrouter-crew/agent-memory clean && build` |
| Database error | Add env vars or use `--skip-db` |
| npm publish fails | Check `NPM_TOKEN` and scope access |

---

## Output Locations

After running script, find output at:

```
✓ Memory Package:     domains/shared/agent-memory/dist/
✓ Documentation:      /tmp/memory-docs-TIMESTAMP/
✓ Design Tokens:      dist/design-tokens.json
✓ Integration Guide:  MEMORY_INTEGRATION.md
✓ Deployment Info:    .deploy-artifacts-TIMESTAMP/
```

---

## Commands You'll Need

```bash
# Start memory API server
node domains/shared/agent-memory/dist/memory-api.js

# Access CLI tool
npx memory-cli list <projectId>
npx memory-cli stats <projectId>
npx memory-cli test <projectId> "context"

# Publish updates
cd domains/shared/agent-memory
./scripts/publish.sh patch

# View dashboard
open /tmp/memory-docs-TIMESTAMP/dashboard.html
```

---

## Success Indicators

After running the script, you should see:

✅ All 11 steps completed
✅ Build artifacts in dist/
✅ Documentation generated
✅ Design system unified
✅ Integration guide created

Then:

✅ Memory dashboard loads at localhost:3333
✅ CLI tool responds to commands
✅ CSS variables and TS tokens available

---

## Next: Integration

See `MEMORY_INTEGRATION.md` for the 3-step integration guide to:

1. Enrich crew requests with memory context
2. Capture outcomes and update weights
3. Store responses as observations

---

## Timeline

- **Now:** Run `./scripts/unify-platform.sh --quick` (2 min)
- **Today:** Complete integration steps (30 min)
- **Tomorrow:** Test with sample project (1 hour)
- **This week:** Deploy to production (varies)

---

## 🎉 You're Ready!

```bash
./scripts/unify-platform.sh --quick
```

Then follow `MEMORY_INTEGRATION.md` for integration steps.

**Questions?** See the detailed guide: `PLATFORM_UNIFICATION.md`

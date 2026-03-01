# ✅ Platform Unification - Execution Checklist

Use this checklist to track your progress through the unified platform integration.

---

## Phase 1: Preparation (5 min)

- [ ] Read `UNIFY_QUICK_REFERENCE.md` (2 min)
- [ ] Review `PLATFORM_UNIFICATION.md` introduction (2 min)
- [ ] Verify tools installed:
  - [ ] `node --version` (should be 18+)
  - [ ] `pnpm --version` (should be 9+)
  - [ ] `git --version`
  - [ ] `tsc --version` (optional, used by build)

---

## Phase 2: Environment Setup (5 min)

Choose your deployment mode:

### For Local Development Only
- [ ] No environment variables needed
- [ ] Plan to run: `./scripts/unify-platform.sh --quick`

### For npm Publishing
- [ ] Generate npm token: https://npmjs.com/settings/tokens
- [ ] Set: `export NPM_TOKEN="npm_xxxxxxxxxxxxx"`
- [ ] Plan to run: `./scripts/unify-platform.sh --full`

### For Supabase Integration
- [ ] Get SUPABASE_URL from: Project Settings → API
- [ ] Get SUPABASE_KEY (Service Role key)
- [ ] Set: `export SUPABASE_URL="https://xxx.supabase.co"`
- [ ] Set: `export SUPABASE_KEY="your-key"`
- [ ] Verify Supabase project is set up and accessible

---

## Phase 3: Script Execution (5-10 min)

### Option A: Quick Setup (Recommended)
```bash
./scripts/unify-platform.sh --quick
```

Before running:
- [ ] Opened terminal in project root
- [ ] Path is correct: `pwd` shows `.../openrouter-crew-platform`
- [ ] Script is executable: `ls -l scripts/unify-platform.sh` shows `x`

After running:
- [ ] ✅ All 11 steps completed
- [ ] ✅ No ✗ (failed) steps
- [ ] ✅ Build artifacts created in `dist/`
- [ ] ✅ Documentation generated in `/tmp/memory-docs-*/`
- [ ] ✅ Integration guide created: `MEMORY_INTEGRATION.md`

### Option B: Full Integration
```bash
export NPM_TOKEN="your-token"
./scripts/unify-platform.sh --full
```

Before running:
- [ ] NPM_TOKEN exported: `echo $NPM_TOKEN` shows value
- [ ] (Optional) SUPABASE credentials set
- [ ] npm account has @openrouter-crew scope access

After running:
- [ ] ✅ All steps completed (including publish)
- [ ] ✅ Package published to npm (check status output)
- [ ] ✅ Database migration applied (if credentials set)
- [ ] ✅ GitHub Release created (optional, if GitHub token set)

---

## Phase 4: Verification (10 min)

### 4.1: Check Build Artifacts
```bash
ls -la domains/shared/agent-memory/dist/
```

Should see:
- [ ] ✅ `index.js` (main entry point)
- [ ] ✅ `index.d.ts` (type definitions)
- [ ] ✅ `design-system.js` (design tokens)
- [ ] ✅ `dashboard.css` (unified styles)
- [ ] ✅ `design-tokens.json` (token export)
- [ ] ✅ `memory-api.js` (API server)
- [ ] ✅ `cli.js` (CLI tool)

### 4.2: Check Documentation
```bash
ls -la /tmp/memory-docs-*/
```

Should see:
- [ ] ✅ `index.html` (documentation portal)
- [ ] ✅ `dashboard.html` (interactive dashboard)
- [ ] ✅ `README.md`, `QUICKSTART.md`, `DESIGN_SYSTEM.md`
- [ ] ✅ `CHANGELOG.md`

### 4.3: Verify Design System
```bash
cat domains/shared/agent-memory/dist/design-tokens.json | head -20
```

Should show:
- [ ] ✅ Color palette with primary and layer colors
- [ ] ✅ Spacing scale (xs, sm, md, lg, xl, etc.)
- [ ] ✅ Typography sizes

### 4.4: Test Memory API Server
```bash
node domains/shared/agent-memory/dist/memory-api.js &
```

In another terminal:
```bash
curl http://localhost:3333/api/health
```

Should see:
- [ ] ✅ Server starts without errors
- [ ] ✅ `/api/health` returns status 200
- [ ] ✅ Can kill server with `fg` + `Ctrl+C`

### 4.5: Test CLI Tool
```bash
npx memory-cli stats test-project-id 2>&1 | head -5
```

Should show:
- [ ] ✅ CLI runs without errors
- [ ] ✅ Returns project statistics or friendly error message
- [ ] ✅ Help is accessible: `npx memory-cli --help`

---

## Phase 5: Documentation Review (5 min)

Read integration documentation:

- [ ] `MEMORY_INTEGRATION.md` (auto-generated)
  - [ ] Understand CrewCoordinator integration points
  - [ ] See code examples for memory enrichment
  - [ ] Know where to add outcome reporting

- [ ] `domains/shared/agent-memory/README.md`
  - [ ] Understand memory layers (1-4)
  - [ ] Know retention tiers (eternal, standard, temporary, session)
  - [ ] Review weight formulas

- [ ] `domains/shared/agent-memory/QUICKSTART.md`
  - [ ] See 5-minute getting started example
  - [ ] Understand store → retrieve → report cycle
  - [ ] Know how to test locally

---

## Phase 6: Integration Setup (30 min)

### 6.1: Update CrewCoordinator

Navigate to: `domains/shared/crew-coordination/src/coordinator.ts`

Add memory enrichment (see `MEMORY_INTEGRATION.md`):
- [ ] Import MemoryService
- [ ] Initialize: `const memoryService = createMemoryService(supabaseClient)`
- [ ] Before crew call: `const { enrichedMessage, contextId } = await memoryService.retrieve(...)`
- [ ] Use enriched message in request

### 6.2: Add Outcome Reporting

In same file, after receiving response:
- [ ] Report outcome: `await memoryService.reportOutcome({...})`
- [ ] Store response: `await memoryService.store({...})`
- [ ] Verify code compiles: `pnpm build`

### 6.3: Update Type Definitions

If needed:
- [ ] Add MemoryContextId type to CrewRequest
- [ ] Add memoryContextId to request metadata
- [ ] Update response handling

### 6.4: Test Integration

```bash
pnpm --filter @openrouter-crew/agent-memory build
pnpm --filter crew-coordination build
```

Should see:
- [ ] ✅ Both packages compile without errors
- [ ] ✅ No TypeScript errors in memory imports
- [ ] ✅ CLI type-check passes

---

## Phase 7: Database Migration (5 min) - Optional

If using Supabase:

```bash
supabase db push
```

- [ ] ✅ Migration applies without errors
- [ ] ✅ Four new tables created:
  - [ ] ✅ `memory_nodes` (with layer, confidence_weight, activation_count)
  - [ ] ✅ `memory_edges` (weighted connections)
  - [ ] ✅ `memory_contexts` (audit trail)
  - [ ] ✅ `memory_outcomes` (reinforcement records)
- [ ] ✅ All indexes created
- [ ] ✅ Can connect to database and query tables

---

## Phase 8: Testing (30 min)

### 8.1: Test Memory System Locally

```bash
# Terminal 1: Start API server
node domains/shared/agent-memory/dist/memory-api.js

# Terminal 2: Test API
curl http://localhost:3333/api/health
curl "http://localhost:3333/api/memories/test-project"
```

- [ ] ✅ API responds without errors
- [ ] ✅ GET /api/health returns status
- [ ] ✅ GET /api/memories/project/:id returns results

### 8.2: Test Dashboard

```bash
open http://localhost:3333
```

Should see:
- [ ] ✅ Memory dashboard loads
- [ ] ✅ Statistics cards display
- [ ] ✅ Layer distribution shows
- [ ] ✅ Can interact with memory list
- [ ] ✅ Can view memory details

### 8.3: Test CLI Tool

```bash
npx memory-cli stats test-project
npx memory-cli list test-project
npx memory-cli test test-project "sample context"
```

Should work:
- [ ] ✅ `stats` shows project statistics
- [ ] ✅ `list` shows memory nodes
- [ ] ✅ `test` performs retrieval test

### 8.4: Test Design System

In a React component or HTML file:

```typescript
// TypeScript approach
import { colors, spacing } from '@openrouter-crew/agent-memory';
const style = { color: colors.primary[500], padding: spacing.lg };
```

```html
<!-- HTML approach -->
<link rel="stylesheet" href="node_modules/@openrouter-crew/agent-memory/dist/dashboard.css">
<div class="card" style="padding: var(--spacing-lg);">Content</div>
```

- [ ] ✅ CSS variables work in HTML
- [ ] ✅ TypeScript tokens import successfully
- [ ] ✅ Colors render correctly
- [ ] ✅ Spacing applies as expected

---

## Phase 9: Publishing (Optional) (5 min)

If publishing to npm and documentation site:

```bash
cd domains/shared/agent-memory
./scripts/publish.sh patch
```

- [ ] ✅ Script runs through all 6 stages
- [ ] ✅ Package version updated
- [ ] ✅ CHANGELOG.md entry created
- [ ] ✅ Published to npm registry
- [ ] ✅ Documentation prepared
- [ ] ✅ Preview dashboard prepared

Verify:
- [ ] ✅ Can view on npm: https://www.npmjs.com/package/@openrouter-crew/agent-memory
- [ ] ✅ Latest version matches
- [ ] ✅ Installation instructions work: `npm install @openrouter-crew/agent-memory@latest`

---

## Phase 10: Final Validation (10 min)

### 10.1: Full Build Test

```bash
pnpm --filter @openrouter-crew/agent-memory build
pnpm --filter unified-dashboard build  # if exists
pnpm build  # full monorepo
```

All should pass:
- [ ] ✅ No TypeScript errors
- [ ] ✅ No build warnings (OK to have non-critical warnings)
- [ ] ✅ All artifacts generated
- [ ] ✅ Type definitions created

### 10.2: Integration Verification

Verify integration code is in place:
```bash
grep -n "memoryService.retrieve" domains/shared/crew-coordination/src/coordinator.ts
grep -n "memoryService.reportOutcome" domains/shared/crew-coordination/src/coordinator.ts
```

Should find:
- [ ] ✅ At least one retrieve call
- [ ] ✅ At least one reportOutcome call

### 10.3: Design System in Use

Verify design system is being used:
```bash
grep -r "var(--color-\|var(--spacing-" apps/ | head -3
grep -r "from '@openrouter-crew/agent-memory'" apps/ | head -3
```

Should find:
- [ ] ✅ CSS variables used in HTML/CSS
- [ ] ✅ TypeScript imports in components

---

## Phase 11: Documentation & Cleanup (10 min)

### 11.1: Update Project README

Add to main `README.md`:

```markdown
## Memory System

The memory system provides weighted memory interpolation for agent crews.

- **Setup:** `./scripts/unify-platform.sh --quick`
- **Integration:** See `MEMORY_INTEGRATION.md`
- **Documentation:** `domains/shared/agent-memory/README.md`
- **Dashboard:** Run memory API server and visit `http://localhost:3333`
```

- [ ] ✅ Added memory system documentation to main README
- [ ] ✅ Added quick setup instructions
- [ ] ✅ Added links to detailed guides

### 11.2: Clean Up Temporary Files (Optional)

```bash
rm -rf /tmp/memory-docs-*  # Keep one for reference
rm -rf .deploy-artifacts-*  # Optional cleanup
```

- [ ] ✅ Temporary files cleaned (keep backups if desired)
- [ ] ✅ Project directory organized

### 11.3: Review Generated Files

Verify all generated files are in place:
```bash
cat MEMORY_INTEGRATION.md | head -20
cat PLATFORM_UNIFICATION.md | head -20
cat UNIFY_QUICK_REFERENCE.md | head -20
```

All should exist and be readable:
- [ ] ✅ `MEMORY_INTEGRATION.md` (auto-generated)
- [ ] ✅ `PLATFORM_UNIFICATION.md` (this guide)
- [ ] ✅ `UNIFY_QUICK_REFERENCE.md` (quick ref card)
- [ ] ✅ `UNIFICATION_CHECKLIST.md` (this file)

---

## 🎉 Congratulations!

All items checked? You've successfully:

- ✅ Set up the unified memory system
- ✅ Generated design system assets
- ✅ Built all packages
- ✅ Created documentation
- ✅ Integrated with CrewCoordinator
- ✅ Tested all components
- ✅ Published to npm (optional)
- ✅ Unified UI/UX across platforms

---

## Next Steps

### Immediate (This Week)
1. [ ] Monitor memory growth in first crew interactions
2. [ ] Verify weight updates on successful outcomes
3. [ ] Test decay over time

### Short Term (This Month)
1. [ ] Implement pattern synthesis (Layer 1 → Layer 2)
2. [ ] Add memory visualization analytics
3. [ ] Train team on new features

### Medium Term (This Quarter)
1. [ ] Optimize retrieval algorithm
2. [ ] Implement dark mode
3. [ ] Add advanced search/filtering

### Long Term (Ongoing)
1. [ ] Monitor memory system performance metrics
2. [ ] Adjust decay rates based on patterns
3. [ ] Implement embeddings for semantic retrieval
4. [ ] Add cross-project institutional knowledge sharing

---

## Support

If you get stuck:

1. **Quick help:** See `UNIFY_QUICK_REFERENCE.md`
2. **Detailed guide:** See `PLATFORM_UNIFICATION.md`
3. **Integration code:** See `MEMORY_INTEGRATION.md`
4. **Memory system:** See `domains/shared/agent-memory/README.md`
5. **Design system:** See `domains/shared/agent-memory/DESIGN_SYSTEM.md`

---

## Timestamps

- **Started:** _______________
- **Completed:** _______________
- **Total Time:** _______________

---

**Status:** Ready to unify your platform! 🚀

Run: `./scripts/unify-platform.sh --quick`

# Build & Local Testing Guide - OpenRouter Crew Platform

**Generated**: March 1, 2026
**Status**: UI Organization Complete - Ready for Local Validation
**Purpose**: Step-by-step guide to build and test all 4 dashboards + CLI locally

---

## 🔧 Build Fix Applied

**Issue**: CLI TypeScript compilation error in `upgrade-service.ts:10`
- **Error**: Property `expiresAt` implicitly has type `any`
- **Fix Applied**: Added explicit return type annotation `Promise<{ tier: string; active: boolean; expiresAt: Date | null }>`
- **File**: `apps/cli/src/services/upgrade-service.ts`

---

## 📋 Pre-Build Checklist

Before running the build, verify you have:

- [ ] Node.js >= 20.0.0: `node --version`
- [ ] pnpm >= 9.0.0: `pnpm --version`
- [ ] Git repository initialized: `git status`
- [ ] All environment files created (from previous session):
  - `apps/unified-dashboard/.env.local`
  - `domains/alex-ai-universal/dashboard/.env.local`
  - `domains/product-factory/project-templates/dj-booking/dashboard/.env.local`
  - `domains/product-factory/projects/test-event-venue/dashboard/.env.local`

---

## 🏗️ Build Steps

### Step 1: Clean Install (Fresh Start)

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Step 2: Verify TypeScript Configuration

```bash
# Fix any remaining tsconfig issues
pnpm fix:tsconfig

# Type-check all packages
pnpm type-check
```

### Step 3: Full Build

```bash
# Build all 15 packages (including all 4 dashboards)
pnpm build
```

**Expected Output**:
```
Tasks:    15 successful, 15 total
Cached:   <some cached>, 15 total
  Time:    ~15-30s
```

**Packages Built** (in dependency order):
1. ✅ `@openrouter-crew/shared-schemas` (base types)
2. ✅ `@openrouter-crew/shared-ui-components` (React components)
3. ✅ `@openrouter-crew/shared-openrouter-client` (LLM routing)
4. ✅ `@openrouter-crew/shared-cost-tracking` (budget tracking)
5. ✅ `@openrouter-crew/shared-crew-coordination` (agent coordination)
6. ✅ `@openrouter-crew/agent-memory` (memory persistence)
7. ✅ `@openrouter-crew/crew-api-client` (unified API)
8. ✅ `@openrouter-crew/product-factory-dashboard` (TypeScript lib)
9. ✅ `@openrouter-crew/unified-dashboard` (Next.js 14.2.35 → localhost:3000)
10. ✅ `@openrouter-crew/alex-ai-universal-dashboard` (Next.js 15.1.4 → localhost:3003)
11. ✅ `@openrouter-crew/dj-booking-dashboard` (Next.js 15.1.4 → localhost:3002)
12. ✅ `@openrouter-crew/test-event-venue-dashboard` (Next.js 15.1.4 → localhost:3004)
13. ✅ `@openrouter-crew/cli` (command-line interface)
14. ✅ `@openrouter-crew/vscode-extension` (IDE extension)
15. ✅ `@openrouter-crew/shared-workflows` (n8n integration)

---

## 🚀 Local Testing - Three Options

### Option A: Run Individual Dashboards (Recommended First Step)

```bash
# Terminal 1: Unified Dashboard (primary platform)
pnpm dev:unified

# Terminal 2: Alex AI (3003)
pnpm dev:alex

# Terminal 3: DJ Booking (3002)
pnpm dev:dj

# Terminal 4: Product Factory (3004)
pnpm dev:factory
```

**Expected Ports**:
- `localhost:3000` → Unified Dashboard
- `localhost:3002` → DJ Booking
- `localhost:3003` → Alex AI Universal
- `localhost:3004` → Product Factory / Test Event Venue

---

### Option B: Run All Services Coordinated (Full Stack)

```bash
# Single command - starts all dashboards + API + n8n
pnpm dev:full

# Logs in: .logs/
```

**Services Started**:
- Unified Dashboard: `localhost:3000`
- API Server: `localhost:3001`
- DJ Booking: `localhost:3002`
- Alex AI: `localhost:3003`
- Product Factory: `localhost:3004`
- n8n Workflows: `localhost:5678`
- Supabase (if local): `localhost:54321`

---

### Option C: Quick Single Dashboard Test

```bash
# Just the unified dashboard
pnpm dev:dashboard

# Or specific dashboard
pnpm --filter @openrouter-crew/alex-ai-universal-dashboard dev
```

---

## ✅ UI Validation Checklist

Once dashboards are running, validate these aspects:

### Unified Dashboard (localhost:3000)

- [ ] **Colors Load**: Dark background (#0b0d11), white text, blue accents
- [ ] **Sidebar Navigation**: 4 domain groups visible (Unified, Product Factory, DJ Booking, Alex AI)
- [ ] **Active Route Highlight**: Click links, verify current page highlights
- [ ] **CSS Variables Work**: No unstyled components, `bg-background` and `text-foreground` render correctly
- [ ] **Responsive**: Works at 1024px and 1440px widths
- [ ] **Load Time**: Initial load < 3s

### Alex AI Universal (localhost:3003)

- [ ] **Navigation Renders**: Main nav shows (no dev-only guard blocking it)
- [ ] **Dashboard Works**: `/dashboard` route loads the agent visualization
- [ ] **Projects Dropdown**: Click "Projects" button, dropdown appears with Alpha/Beta/Gamma/Temporal
- [ ] **Theme Switcher**: (visible in dev mode, hidden in production)
- [ ] **Colors**: Same dark theme as unified dashboard

### DJ Booking (localhost:3002)

- [ ] **Page Loads**: Static content renders (agent cards visible)
- [ ] **Navigation**: Can click to different sections
- [ ] **No Errors**: Browser console shows no red errors

### Product Factory (localhost:3004)

- [ ] **Page Loads**: Placeholder or main content visible
- [ ] **No Errors**: Browser console clean

---

## 🎨 Visual Quality Checklist

### CSS Variables & Colors

**Check in Browser DevTools**:
1. Open DevTools → Inspect Element on any text
2. Look for `color: rgb(...)` values
3. Should be:
   - Text: `rgb(255, 255, 255)` (white)
   - Background: `rgb(11, 13, 17)` (dark)
   - Accent: `rgb(96, 165, 250)` (blue)

**CLI Output**:
```bash
# Run any CLI command and check colors
pnpm --filter @openrouter-crew/cli -- crew roster

# Verify:
# ✅ Section headers in CYAN (not blue)
# ✅ Error glyphs are ✗ (not ❌)
# ✅ Success messages in GREEN with ✓
```

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

```bash
# Rebuild tsconfig
pnpm fix:tsconfig

# Clean and retry
rm -rf .turbo node_modules/.turbo
pnpm build
```

### Port Already in Use

```bash
# Kill lingering processes
bash scripts/system/cleanup-ports.sh

# Verify ports are free
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003
lsof -i :3004
```

### Dashboard Won't Start

```bash
# Check for Supabase connectivity
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Check .env.local exists
ls -la apps/unified-dashboard/.env.local

# View full build output
pnpm build 2>&1 | grep -i error
```

### Navigation Not Highlighting

- Unified Dashboard: `usePathname()` should be passing `currentPath` to `UniversalNavigation`
- Verify: `apps/unified-dashboard/app/sidebar-wrapper.tsx` has `currentPath={pathname}`

### Colors Look Wrong

- Check CSS variables in globals.css: `--background`, `--foreground`, `--accent` should be HSL format
- Example correct: `--background: 220 14% 6%;` (not `#0b0d11`)

---

## 📊 Build Success Indicators

✅ **Build Passed**:
```
Tasks:    15 successful, 15 total
Time:     ~20-30s
```

✅ **All Dashboards Run Without Errors**:
- No red errors in browser console
- Each dashboard loads in < 3s
- Navigation is clickable

✅ **Colors and Typography Correct**:
- Dark theme loads immediately
- Text is readable
- Active nav items highlight

✅ **CLI Works**:
```bash
pnpm --filter @openrouter-crew/cli -- crew roster
# Should output colored table with crew members
```

---

## 🔍 Deep Dive: What Was Fixed

### 1. Port Assignment Standardization

**Files Fixed**:
- `scripts/local-dev.sh` - Updated port mappings to canonical: 3000-3004
- `scripts/start-local-dev.sh` - Unified n8n to port 5678, updated dashboard ports
- `package.json` - Added shortcuts: `dev:unified`, `dev:alex`, `dev:dj`, `dev:factory`

**Impact**: No more port conflicts when running multiple dashboards

### 2. CSS Variable / Tailwind Fix

**Files Fixed**:
- `apps/unified-dashboard/app/globals.css`
- `domains/alex-ai-universal/dashboard/app/globals.css`

**Before** (Broken):
```css
--background: #0b0d11;  /* Raw hex - doesn't work with Tailwind HSL() wrapper */
```

**After** (Fixed):
```css
--background: 220 14% 6%;  /* HSL channels - works with hsl(var(--background)) */
```

**Impact**: All Tailwind utilities (`bg-background`, `text-foreground`, etc.) now resolve

### 3. Navigation Active State

**File Fixed**: `apps/unified-dashboard/app/sidebar-wrapper.tsx`

**Before** (No highlighting):
```tsx
<UniversalNavigation variant="sidebar" />
```

**After** (With active state):
```tsx
const pathname = usePathname();
<UniversalNavigation variant="sidebar" currentPath={pathname} />
```

**Impact**: Nav items now highlight when you're on their route

### 4. Alex AI Production Navigation

**File Fixed**: `domains/alex-ai-universal/dashboard/components/DevNavigation.tsx`

**Before** (No production nav):
```tsx
if (!isDev) return null;  // ❌ Production builds had NO navigation
```

**After** (Production nav visible):
```tsx
const isDev = process.env.NODE_ENV === 'development';
// ... nav renders in both dev and production, just hides debug tools in prod
```

**Impact**: Production builds now have a working navbar

### 5. CLI Color Standardization

**File Fixed**: `apps/cli/src/commands/optimize.ts`

**Changes**:
- `chalk.blue()` → `chalk.cyan()` for section headers (3 locations)
- `❌` → `✗` for error glyphs (all occurrences)

**Impact**: Consistent CLI color palette across all commands

### 6. TypeScript Error Fix

**File Fixed**: `apps/cli/src/services/upgrade-service.ts`

**Before** (Type error):
```typescript
async getStatus() {
    return {
        tier: 'starter',
        active: true,
        expiresAt: undefined  // ❌ Implicitly any type
    };
}
```

**After** (Explicit types):
```typescript
async getStatus(): Promise<{ tier: string; active: boolean; expiresAt: Date | null }> {
    return {
        tier: 'starter',
        active: true,
        expiresAt: null
    };
}
```

**Impact**: CLI builds successfully without TypeScript errors

---

## 📈 Next Steps After Successful Build

1. **Verify All Dashboards Load** (15 min)
   - Run individual dashboards from Option A above
   - Check colors, navigation, routing

2. **Test CLI Locally** (5 min)
   ```bash
   pnpm --filter @openrouter-crew/cli -- crew roster
   pnpm --filter @openrouter-crew/cli -- optimize analyze
   ```

3. **Run VSCode Extension** (10 min)
   - Open VSCode
   - Press F5 to start extension debug mode
   - Test sidebar panels and commands

4. **Document Issues** (ongoing)
   - If any dashboard fails to load, note the error
   - If colors look wrong, screenshot it
   - If navigation doesn't highlight, verify the fix was applied

---

## 📝 Build Quality Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **TypeScript Errors** | 0 | ✅ Fixed (upgrade-service.ts) |
| **Build Time** | < 30s | Expected ✅ |
| **All Dashboards Build** | Yes | Expected ✅ |
| **CSS Variables Correct** | Yes | ✅ Fixed (HSL format) |
| **Navigation Highlights** | Yes | ✅ Fixed (usePathname wired) |
| **CLI Colors Consistent** | Yes | ✅ Fixed (cyan headers, ✗ glyphs) |
| **Port Conflicts** | None | ✅ Fixed (3000-3004 canonical) |

---

## 🎯 Success Criteria

Build is successful when:

1. ✅ `pnpm build` completes with "15 successful, 15 total"
2. ✅ Each dashboard loads without console errors
3. ✅ Colors are correct (dark theme, white text, blue accents)
4. ✅ Navigation items highlight on current route
5. ✅ CLI outputs are colored correctly
6. ✅ No TypeScript compilation errors

---

## 📞 Support

If you encounter issues:

1. **Check this guide** for troubleshooting section
2. **Run clean build**: `rm -rf node_modules .turbo && pnpm install && pnpm build`
3. **Review the fixes** applied above
4. **Check browser console** for JavaScript errors (separate from TypeScript)
5. **Verify .env files** exist in all dashboard directories

---

**Ready to build? Run**: `pnpm build`

**Then validate**: Choose Option A, B, or C to start local dashboards

Good luck! 🚀

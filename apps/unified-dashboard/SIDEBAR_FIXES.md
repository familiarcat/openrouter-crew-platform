# Sidebar and Color Scheme Fixes

**Date**: January 28, 2026
**Status**: ✅ Fixed and Deployed

## Issues Fixed

### 1. Color Scheme - Purple to Amber/Gold ✅

**Problem**: Sidebar and UI still using purple (#7c5cff) instead of amber/gold

**Fix**: Updated CSS variable in globals.css

**File**: [app/globals.css](app/globals.css:13)
```css
/* Before */
--accent1:#7c5cff;

/* After */
--accent1:#f59e0b;
```

**Impact**: All UI elements using `var(--accent1)` now use amber/gold:
- Navigation active states
- Hover effects
- Badges and pills
- Border colors
- Icon colors
- Button highlights

### 2. Logo Not Clickable ✅

**Problem**: Upper left Starfleet Delta logo didn't work as home button

**Fix**: Wrapped brand div in Link component

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx:202)
```tsx
/* Before */
<div className="brand">
  <div className="logo">...</div>
  ...
</div>

/* After */
<Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
  <div className="logo">...</div>
  ...
</Link>
```

**Result**: Logo now clickable and navigates to home

### 3. Branding Updated ✅

**Problem**: Sidebar still said "RAG Refresh Product Factory"

**Fix**: Updated branding text

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx:214-215)
```tsx
/* Before */
<div className="title">RAG Refresh</div>
<div className="subtitle">Product Factory</div>

/* After */
<div className="title">OpenRouter Crew</div>
<div className="subtitle">Unified Dashboard</div>
```

### 4. API Route Errors Fixed ✅

**Problem**: Sidebar calling non-existent `/api/projects?status=active` endpoint

**Fix**: Replaced fetch call with direct Supabase query

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx:103-127)
```tsx
/* Before */
const res = await fetch('/api/projects?status=active');
const data = await res.json();
setProjects(data.projects || []);

/* After */
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .order('updated_at', { ascending: false })
  .limit(5);

if (data) {
  const enrichedProjects = data.map(p => {
    const enriched = enrichProjectWithDomain(p);
    return {
      id: p.id,
      name: p.name,
      status: p.status || 'draft',
      progress: 0,
    } as ProjectSummary;
  });
  setProjects(enrichedProjects);
}
```

**Result**: No more console errors, projects load from Supabase

### 5. Navigation Simplified ✅

**Problem**: Navigation had links to non-existent routes

**Removed Routes**:
- `/portfolio` (404)
- `/sprints` (not implemented yet)
- `/categories` (renamed to /domains)
- `/create` (moved to /projects/new)
- `/ask`, `/diagnostics`, `/deploy-metrics`, `/env` (product-factory specific)
- `/crew`, `/observation-lounge` (not implemented yet)
- Docs section (not applicable)

**New Navigation Structure**:

**Overview**
- Dashboard (/)
- All Domains (/domains)

**Projects**
- All Projects (/projects) - with accordion showing active projects
- Create Project (/projects/new)

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx:220-225)

### 6. Tooltip Color Updated ✅

**Problem**: Tooltip border still purple

**Fix**: Updated inline border style

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx:432)
```tsx
/* Before */
border: '1px solid #7c5cff',

/* After */
border: '1px solid #f59e0b',
```

### 7. Removed Non-Functional Features ✅

**Problem**: Crew avatars section causing 404 errors

**Removed**:
- Crew Quick Status section
- Collapsed Crew Avatars
- Status Pills

**Reason**: Crew profile system not implemented yet, images don't exist

**File**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)

## Visual Improvements

### Color Palette (Updated)

**Primary Accent** (was purple, now amber):
- `--accent1`: `#f59e0b` (Amber/Gold)
- `--accent2`: `#00c2ff` (Cyan)
- `--accent3`: `#ffb703` (Orange)

**Domain Colors**:
- DJ-Booking: `#f59e0b` (Amber)
- Product Factory: `#06b6d4` (Cyan)
- Alex-AI-Universal: `#10b981` (Green)

### Responsive Behavior

The sidebar already has responsive CSS:

**Desktop** (width > 768px):
- Default: 280px width
- Collapsed: 80px width
- Toggle button on sidebar

**Mobile** (width <= 768px):
- Hidden by default
- Hamburger menu button
- Slides in from left when opened
- Overlay backdrop
- Close on navigation or escape key

**File**: [app/globals.css](app/globals.css:236-275)

## Current Sidebar Structure

```
┌─────────────────────┐
│  OpenRouter Crew    │ ← Clickable logo (home)
│  Unified Dashboard  │
├─────────────────────┤
│  OVERVIEW          │
│  • Dashboard       │
│  • All Domains     │
├─────────────────────┤
│  PROJECTS          │
│  • All Projects    │ ← Accordion with active projects
│    └─ Project 1    │
│    └─ Project 2    │
│    └─ View all →   │
│  • Create Project  │
└─────────────────────┘
```

## Testing Checklist

- [x] Logo clickable and navigates to home
- [x] Sidebar shows amber/gold accent color
- [x] Navigation links work (no 404s on valid routes)
- [x] Projects load from Supabase
- [x] Active projects show in accordion
- [x] Branding shows "OpenRouter Crew / Unified Dashboard"
- [x] Collapse/expand works on desktop
- [x] Mobile hamburger menu works
- [x] Tooltips show in collapsed mode with amber border
- [x] No console errors for missing API routes
- [x] No 404 errors for crew avatars

## Known Behavior

**Expected 404s** (for now):
- Individual project detail pages (`/projects/[id]`) - Route exists but may show 404 if project doesn't exist in DB
- Domain detail pages (`/domains/[domain]`) - Route exists from previous implementation

**Future Routes** (Phase 2):
- `/sprints` - Cross-domain sprint management
- `/crew` - Crew roster and management
- `/observation-lounge` - Crew coordination interface

## Performance

```
Compilation: ✓ ~2s (855 modules)
Home page: ✓ 200 OK (~100ms)
Projects load: ✓ Direct Supabase query
Hot reload: ✓ Working
TypeScript: ✓ No errors
```

## Files Modified

1. [app/globals.css](app/globals.css:13) - Changed `--accent1` from purple to amber
2. [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) - Multiple fixes:
   - Added imports for Supabase and unified-projects
   - Made logo clickable (home link)
   - Updated branding text
   - Replaced API call with Supabase query
   - Simplified navigation structure
   - Removed non-functional crew sections
   - Updated tooltip border color

## Browser Experience

### Before
- Purple accent color (poor legibility)
- Logo not clickable
- "RAG Refresh Product Factory" branding
- 404 errors in console for API routes
- 404 errors for non-existent routes
- Missing crew avatar images causing errors
- Confusing navigation with many non-working links

### After
- Amber/gold accent color (excellent legibility)
- Logo clickable (navigates home)
- "OpenRouter Crew Unified Dashboard" branding
- No API route errors (uses Supabase directly)
- Clean navigation with only working routes
- No crew avatar errors
- Simple, focused navigation

## Responsive Design

The sidebar is fully responsive:

**Desktop Collapse**:
1. Click `←` button to collapse sidebar to 80px
2. Hover over icons to see tooltips
3. Navigation icons remain visible
4. Click `→` button to expand

**Mobile Menu**:
1. Hamburger button appears in top-left
2. Tap to open sidebar overlay
3. Full sidebar slides in from left
4. Tap backdrop or link to close
5. Press Escape to close

**Breakpoint**: 768px

---

**Developer**: Claude Sonnet 4.5
**Framework**: Next.js 15.5.10
**UI Library**: Custom CSS with CSS Variables
**State Management**: React Hooks

# 🎨 Memory System Design System

A unified design system for all Memory Dashboard interfaces (HTML, React, CLI).

## Overview

This design system ensures visual and interaction consistency across:
- **Standalone HTML Dashboard** (`dashboard.html`)
- **React Component** (`dashboard.tsx`)
- **CLI Inspector** (`cli.ts`)
- **Demo Dashboard** (`dashboard-demo.html`)

## Files

- **`src/design-system.ts`** - TypeScript design tokens and utilities
- **`src/dashboard.css`** - Unified CSS framework
- **`src/dashboard.html`** - Standalone HTML dashboard (uses CSS)
- **`src/dashboard.tsx`** - React component (can import design tokens)

## Color Palette

### Primary Colors
```
Primary Blue: #3b82f6
- Used for buttons, links, interactive elements
- 500: #3b82f6 (default)
- 600: #2563eb (hover)
- 50: #eff6ff (background)
- 100: #dbeafe (light background)
```

### Layer Colors
```
Layer 1 - Observations (Blue)
  Background: #dbeafe
  Border: #3b82f6
  Text: #1e40af

Layer 2 - Patterns (Purple)
  Background: #e9d5ff
  Border: #a855f7
  Text: #6b21a8

Layer 3 - Strategies (Amber)
  Background: #fed7aa
  Border: #f59e0b
  Text: #92400e

Layer 4 - Institutional (Red)
  Background: #fecaca
  Border: #ef4444
  Text: #7f1d1d
```

### Neutral Colors
```
Gray Scale:
  50: #f9fafb (backgrounds)
  100: #f3f4f6 (light backgrounds)
  200: #e5e7eb (borders)
  300: #d1d5db (input borders)
  500: #6b7280 (secondary text)
  700: #374151 (text)
  900: #111827 (primary text)

Text Colors:
  Primary: #111827 (default text)
  Secondary: #6b7280 (muted text)
  Tertiary: #9ca3af (disabled text)
  Inverse: #ffffff (text on dark)
```

## Typography

### Font Families
```
System: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...
Monospace: "Fira Code", "Monaco", "Menlo"
```

### Font Sizes
```
xs:  11px
sm:  12px
base: 13px
lg:  14px
xl:  16px
2xl: 20px
3xl: 24px
4xl: 32px
```

### Font Weights
```
Normal: 400
Medium: 500
Semibold: 600
Bold: 700
```

## Spacing

```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   24px
2xl:  32px
3xl:  40px
4xl:  48px
```

## Border Radius

```
sm:   4px
md:   6px
lg:   8px
xl:   12px
full: 9999px
```

## Shadows

```
sm:  0 1px 2px rgba(0, 0, 0, 0.05)
base: 0 1px 3px rgba(0, 0, 0, 0.1)
md:  0 4px 6px rgba(0, 0, 0, 0.1)
lg:  0 10px 15px rgba(0, 0, 0, 0.1)
xl:  0 20px 25px rgba(0, 0, 0, 0.1)
```

## Transitions

```
fast: 0.15s ease-out
base: 0.2s ease-out
slow: 0.3s ease-out
```

## Component Patterns

### Buttons

**Primary Button**
```css
background-color: #3b82f6;
color: white;
padding: 8px 16px;
border-radius: 6px;
font-weight: 500;
```

**Secondary Button**
```css
background-color: #f3f4f6;
color: #111827;
border: 1px solid #e5e7eb;
padding: 8px 16px;
border-radius: 6px;
```

**Disabled Button**
```css
opacity: 0.5;
cursor: not-allowed;
```

### Cards

```css
background: white;
border: 1px solid #e5e7eb;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
padding: 24px;
```

### Input Fields

```css
padding: 8px 12px;
border: 1px solid #e5e7eb;
border-radius: 6px;
font-size: 12px;
transition: 0.2s ease-out;
```

**Focus State**
```css
border-color: #3b82f6;
box-shadow: 0 0 0 3px #eff6ff;
```

### Memory Items

```css
padding: 12px;
border-left: 2px solid <layer-color>;
cursor: pointer;
transition: background-color 0.15s;
```

**Layer 1**: `border-left-color: #3b82f6`
**Layer 2**: `border-left-color: #a855f7`
**Layer 3**: `border-left-color: #f59e0b`
**Layer 4**: `border-left-color: #ef4444`

## How to Use

### In HTML

```html
<!-- Link the CSS -->
<link rel="stylesheet" href="dashboard.css">

<!-- Use CSS classes -->
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
</div>

<!-- Use CSS variables -->
<style>
  .custom-element {
    color: var(--color-text-primary);
    padding: var(--spacing-lg);
  }
</style>
```

### In React

```typescript
import { designSystem, colors, spacing } from './design-system';

export function MyComponent() {
  return (
    <div style={{
      backgroundColor: colors.bg.primary,
      padding: spacing.xl,
      borderRadius: '12px'
    }}>
      {/* Component content */}
    </div>
  );
}

// Or use CSS classes with the CSS file imported
import './dashboard.css';

export function MyComponent() {
  return (
    <div className="card">
      <div className="card-header">Title</div>
    </div>
  );
}
```

### In CLI

```typescript
import { colors, typography } from './design-system';

// Use colors for terminal output
console.log(`\x1b[38;5;33m${colors.primary[500]}\x1b[0m`);

// Or use ANSI codes directly
console.log('\x1b[94m Confidence: 92%\x1b[0m');
```

## Responsive Breakpoints

```
xs: 320px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile-First Approach

```css
/* Mobile first */
.card {
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .card {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .card {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Animations

### Slide Up
```css
animation: slideUp 0.2s ease-out;

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Fade In
```css
animation: fadeIn 0.2s ease-out;

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Loading Spinner
```css
animation: spin 0.6s linear infinite;

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Utility Classes

```css
/* Margin */
.mt-2 { margin-top: 12px; }
.mb-4 { margin-bottom: 16px; }

/* Padding */
.p-4 { padding: 16px; }

/* Border Radius */
.rounded-lg { border-radius: 8px; }
.rounded-xl { border-radius: 12px; }

/* Shadows */
.shadow { box-shadow: 0 1px 3px rgba(...); }
.shadow-lg { box-shadow: 0 10px 15px rgba(...); }

/* Text */
.text-center { text-align: center; }
.text-muted { color: #6b7280; }

/* Layout */
.flex { display: flex; }
.grid { display: grid; }
.gap-2 { gap: 12px; }
```

## Accessibility

### Contrast Ratios
- Text on background: 4.5:1 (WCAG AA)
- Large text: 3:1 (WCAG AA)

### Focus States
All interactive elements have visible focus indicators:
```css
:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### Keyboard Navigation
- Tab order: left to right, top to bottom
- All buttons clickable with Enter/Space
- Escape closes modal/popover

## Dark Mode (Future)

Design tokens support future dark mode:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #1f2937;
    --color-text-primary: #f9fafb;
    /* ... more dark mode variables */
  }
}
```

## Implementation Checklist

- [ ] All HTML dashboards link to `dashboard.css`
- [ ] React components import `design-system.ts`
- [ ] Color values match across all interfaces
- [ ] Spacing is consistent (uses spacing scale)
- [ ] Typography matches (fonts, sizes, weights)
- [ ] Shadows and transitions use system values
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Accessibility tested (contrast, focus, keyboard)
- [ ] Dark mode CSS variables prepared

## Extending the Design System

### Adding New Colors

1. Add to `src/design-system.ts`:
```typescript
export const colors = {
  // ... existing colors
  custom: {
    500: '#customHex',
  }
}
```

2. Add to `src/dashboard.css`:
```css
--color-custom-500: #customHex;
```

3. Use everywhere:
```typescript
// React
background: colors.custom[500]

// CSS
background-color: var(--color-custom-500);
```

### Adding New Components

1. Define in `src/design-system.ts`:
```typescript
export const components = {
  customComponent: {
    base: { /* styles */ },
  }
}
```

2. Add CSS in `src/dashboard.css`:
```css
.custom-component {
  /* styles from design system */
}
```

## References

- **Color Tool**: https://www.tailwindcss.com/resources/color-palette
- **Typography Scale**: https://www.typescale.com/
- **Spacing Scale**: https://www.modularscale.com/
- **WCAG Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/

## Questions & Support

For design system questions, refer to:
1. `src/design-system.ts` - Source of truth for values
2. `src/dashboard.css` - CSS implementations
3. This guide - Best practices and patterns

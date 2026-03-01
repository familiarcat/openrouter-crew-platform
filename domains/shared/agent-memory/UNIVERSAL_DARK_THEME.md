# 🎨 Universal Dark Theme Integration Guide

Complete guide to integrating the universal dark theme across web, VSCode webview, and React applications.

---

## Overview

The universal dark theme provides **unified design consistency** across three distinct environments:

1. **Web Browser** (`dashboard.html`) — Standalone HTML dashboard at localhost:3333
2. **VSCode Webview** (`dashboard-webview.html`) — Integrated in VSCode extension panels
3. **React Component** (`dashboard.tsx`) — Next.js dashboard component

All three environments use the same **CSS variable system** and support:
- ✅ Dark mode by default with automatic VSCode theme detection
- ✅ Light mode fallback for accessibility
- ✅ High contrast mode for readability
- ✅ Responsive design across all devices
- ✅ Reduced motion preferences
- ✅ Keyboard navigation and focus states

---

## CSS Variables Reference

### Color Palette

**Background Colors:**
```css
:root {
  --color-bg-primary: #1e1e1e;      /* Main background */
  --color-bg-secondary: #252526;    /* Card backgrounds */
  --color-bg-tertiary: #2d2d30;     /* Section headers */
  --color-bg-hover: #383838;        /* Hover states */
  --color-bg-active: #505052;       /* Active elements */
}
```

**Text Colors:**
```css
:root {
  --color-text-primary: #cccccc;    /* Primary text */
  --color-text-secondary: #858585;  /* Secondary text (labels, descriptions) */
  --color-text-tertiary: #6a6a6a;   /* Tertiary text (placeholders, hints) */
  --color-text-inverse: #1e1e1e;    /* Inverse (on bright backgrounds) */
}
```

**Brand & Accent Colors:**
```css
:root {
  --color-primary-500: #3b82f6;     /* Primary blue */
  --color-primary-600: #2563eb;     /* Primary blue hover */
  --color-primary-50: #1e3a5f;      /* Primary blue background */
  --color-success: #10b981;         /* Success green */
  --color-warning: #f59e0b;         /* Warning amber */
  --color-error: #ef4444;           /* Error red */
  --color-info: #3b82f6;            /* Info blue */
}
```

**Memory Layer Colors:**
```css
:root {
  /* Layer 1 - Observations (Blue) */
  --color-layer-1-bg: #1e3a5f;
  --color-layer-1-text: #3b82f6;

  /* Layer 2 - Patterns (Purple) */
  --color-layer-2-bg: #2d1b4e;
  --color-layer-2-text: #a855f7;

  /* Layer 3 - Strategies (Amber) */
  --color-layer-3-bg: #3d2817;
  --color-layer-3-text: #f59e0b;

  /* Layer 4 - Institutional (Red) */
  --color-layer-4-bg: #3a1e1e;
  --color-layer-4-text: #ef4444;
}
```

**Utility Colors:**
```css
:root {
  --color-border: #3e3e42;          /* Border color */
}
```

---

## Implementation by Environment

### 1. Web Browser (Standalone HTML)

**File:** `dashboard.html`

**Usage:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    :root {
      --color-bg-primary: #1e1e1e;
      --color-text-primary: #cccccc;
      /* ... more variables ... */
    }

    body {
      background-color: var(--color-bg-primary);
      color: var(--color-text-primary);
    }

    .stat-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
    }
  </style>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

**Light Mode Override:**
```html
<style>
  .vscode-light {
    --color-bg-primary: #ffffff;
    --color-text-primary: #333333;
    --color-bg-secondary: #f5f5f5;
    /* ... */
  }
</style>
```

**Testing:**
```bash
# Start development server
node domains/shared/agent-memory/dist/memory-api.js

# Open in browser
open http://localhost:3333
```

---

### 2. VSCode Webview Integration

**File:** `dashboard-webview.html`

**Key Features:**
- Automatic VSCode theme detection
- VSCode color variable integration
- High contrast mode support
- Custom scrollbar styling for VSCode
- Message passing for state updates

**Usage in VSCode Extension:**

```typescript
import * as vscode from 'vscode';

export function openMemoryDashboard(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'memoryDashboard',
    '🧠 Memory Dashboard',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // Load webview HTML
  const htmlPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    'dashboard-webview.html'
  );

  const html = fs.readFileSync(htmlPath.fsPath, 'utf8');
  panel.webview.html = html;

  // Handle messages from webview
  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'refresh') {
      // Refresh memory data
    }
  });

  // Send messages to webview
  panel.webview.postMessage({
    command: 'setProject',
    projectId: 'my-project'
  });
}
```

**VSCode Theme Variables:**

The webview automatically detects and uses VSCode's theme variables:

```css
.vscode-dark {
  --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
  --color-bg-secondary: var(--vscode-sideBar-background, #252526);
  --color-text-primary: var(--vscode-editor-foreground, #cccccc);
  --color-text-secondary: var(--vscode-editorGutter-foreground, #858585);
  --color-border: var(--vscode-editorGroup-border, #3e3e42);
  --color-primary-500: var(--vscode-focusBorder, #3b82f6);
}

.vscode-high-contrast {
  --color-bg-primary: #000000;
  --color-text-primary: #ffffff;
  --color-border: #ffffff;
  /* ... */
}
```

**Testing in VSCode:**

```bash
# In VSCode extension development
# Press F5 to open Extension Development Host
# Your extension will run with proper theme detection
```

---

### 3. React Component Integration

**File:** `dashboard.tsx`

**Current State:**
- Component uses Tailwind CSS for styling
- Light mode colors hardcoded (bg-gray-50, text-gray-900, etc.)
- Needs migration to CSS variable system

**Migration Steps:**

1. **Extract CSS variables to external file:**

```css
/* src/dashboard-variables.css */
:root {
  --color-bg-primary: #1e1e1e;
  --color-text-primary: #cccccc;
  /* ... all variables ... */
}

.vscode-light {
  --color-bg-primary: #ffffff;
  --color-text-primary: #333333;
}
```

2. **Import in component:**

```typescript
// dashboard.tsx
import './dashboard-variables.css';

export function MemoryDashboard(props) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Use CSS variables for styling */}
    </div>
  );
}
```

3. **Create Tailwind utilities for variables:**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'theme-bg-primary': 'var(--color-bg-primary)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-border': 'var(--color-border)',
        // ... map all variables
      }
    }
  }
}
```

4. **Update component className:**

```typescript
<div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
  {/* Content */}
</div>
```

---

## Theme Detection

### Automatic Detection

The theme system automatically detects:

1. **System Preference** (`prefers-color-scheme`)
   ```css
   @media (prefers-color-scheme: dark) {
     /* Dark mode styles */
   }
   @media (prefers-color-scheme: light) {
     /* Light mode styles */
   }
   ```

2. **VSCode Context** (Webview only)
   ```javascript
   // Detects if running in VSCode webview
   if (typeof acquireVsCodeApi === 'function') {
     document.documentElement.classList.add('vscode-webview');
   }
   ```

3. **High Contrast Mode** (`prefers-contrast`)
   ```css
   @media (prefers-contrast: more) {
     :root {
       --color-border: #666666;
       --color-text-secondary: #999999;
     }
   }
   ```

4. **Reduced Motion** (`prefers-reduced-motion`)
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

### Manual Theme Selection

To manually set theme in development:

```html
<!-- Force dark mode -->
<script>
  document.documentElement.classList.add('vscode-dark');
</script>

<!-- Force light mode -->
<script>
  document.documentElement.classList.add('vscode-light');
</script>

<!-- Force high contrast -->
<script>
  document.documentElement.classList.add('vscode-high-contrast');
</script>
```

---

## Color Usage Guide

### For Text Elements

```css
/* Primary text (headings, main content) */
color: var(--color-text-primary);

/* Secondary text (labels, descriptions) */
color: var(--color-text-secondary);

/* Tertiary text (placeholders, hints) */
color: var(--color-text-tertiary);

/* On bright backgrounds (inverse) */
color: var(--color-text-inverse);
```

### For Background Elements

```css
/* Primary background (page/app background) */
background-color: var(--color-bg-primary);

/* Secondary background (cards, panels) */
background-color: var(--color-bg-secondary);

/* Tertiary background (section headers, table rows) */
background-color: var(--color-bg-tertiary);

/* Hover state background */
background-color: var(--color-bg-hover);

/* Active/selected background */
background-color: var(--color-bg-active);
```

### For Interactive Elements

```css
/* Primary button/action */
background-color: var(--color-primary-500);
color: white;

/* Primary button hover */
background-color: var(--color-primary-600);

/* Primary button focus */
outline: 2px solid var(--color-primary-500);
outline-offset: 2px;

/* Borders and separators */
border-color: var(--color-border);

/* Success state */
color: var(--color-success);

/* Warning state */
color: var(--color-warning);

/* Error state */
color: var(--color-error);
```

### For Memory Layers

```css
/* Layer 1 - Observation */
background-color: var(--color-layer-1-bg);
color: var(--color-layer-1-text);
border-color: var(--color-layer-1-text);

/* Layer 2 - Pattern */
background-color: var(--color-layer-2-bg);
color: var(--color-layer-2-text);
border-color: var(--color-layer-2-text);

/* Layer 3 - Strategy */
background-color: var(--color-layer-3-bg);
color: var(--color-layer-3-text);
border-color: var(--color-layer-3-text);

/* Layer 4 - Institutional */
background-color: var(--color-layer-4-bg);
color: var(--color-layer-4-text);
border-color: var(--color-layer-4-text);
```

---

## Responsive Design

The theme includes responsive breakpoints:

```css
/* Tablet (max-width: 768px) */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile (max-width: 480px) */
@media (max-width: 480px) {
  .header h1 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

Test on all device sizes:

```bash
# In browser dev tools, use Device Toolbar (Ctrl+Shift+M)
# Test at 320px, 375px, 768px, and 1280px widths
```

---

## Accessibility Features

### Keyboard Navigation

All interactive elements support keyboard interaction:

```css
.filter-btn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.memory-item:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -2px;
}
```

### High Contrast Mode

The theme automatically adjusts for users with high contrast preferences:

```css
@media (prefers-contrast: more) {
  :root {
    --color-border: #666666;
    --color-text-secondary: #999999;
  }
}
```

### Reduced Motion

Animations are disabled for users with motion sensitivity:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Checklist

### Visual Testing

- [ ] **Dark mode** - Verify all colors visible on dark background
- [ ] **Light mode** - Toggle to light theme, check readability
- [ ] **High contrast** - Enable "Increase contrast", verify borders and text
- [ ] **Layer colors** - Verify all 4 layer colors display correctly
- [ ] **Interactive states** - Hover/focus/active states on all elements
- [ ] **Text readability** - Ensure sufficient color contrast (WCAG AA)

### Device Testing

- [ ] **Desktop (1920px)** - Full layout, all features visible
- [ ] **Tablet (768px)** - Grid collapses to 2 columns
- [ ] **Mobile (375px)** - Single column, buttons stack vertically
- [ ] **Small mobile (320px)** - Content still readable, no overflow

### Theme Testing

- [ ] **VSCode dark** - Webview uses VSCode editor colors
- [ ] **VSCode light** - Webview switches to light colors
- [ ] **System dark** - Browser respects system preference
- [ ] **System light** - Browser switches to light theme
- [ ] **Browser override** - Manual theme selection works

### Functionality Testing

- [ ] **Search** - Input field visible and usable in all themes
- [ ] **Buttons** - All buttons clickable with proper hover/focus
- [ ] **Memory items** - Click selection works and highlights properly
- [ ] **Details panel** - Displays correctly in all widths
- [ ] **Scrollbars** - Custom scrollbar visible and usable

---

## Browser Support

| Browser | Dark Mode | Light Mode | High Contrast | Reduced Motion |
|---------|-----------|-----------|---------------|----------------|
| Chrome  | ✅        | ✅        | ✅            | ✅             |
| Firefox | ✅        | ✅        | ✅            | ✅             |
| Safari  | ✅        | ✅        | ✅            | ✅             |
| Edge    | ✅        | ✅        | ✅            | ✅             |
| VSCode  | ✅ Native | ✅ Native | ✅ Native     | ✅ Native      |

---

## Common Use Cases

### Creating a New Component

```css
/* Use CSS variables for all styling */
.new-component {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 16px;
  border-radius: 8px;
}

.new-component:hover {
  background-color: var(--color-bg-hover);
}

.new-component.active {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-500);
}
```

### Custom Color for Specific Layer

```css
.component-layer-1 {
  background-color: var(--color-layer-1-bg);
  color: var(--color-layer-1-text);
  border-left: 4px solid var(--color-layer-1-text);
}

.component-layer-2 {
  background-color: var(--color-layer-2-bg);
  color: var(--color-layer-2-text);
  border-left: 4px solid var(--color-layer-2-text);
}

/* Apply dynamically: */
/* className={`component layer-${memory.layer}`} */
```

### Status Colors

```css
.status-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border-color: var(--color-success);
}

.status-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.status-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border-color: var(--color-error);
}
```

---

## Troubleshooting

### Colors Not Changing on Theme Switch

**Problem:** CSS variables not updating when theme changes

**Solution:** Ensure CSS variables are defined at `:root` level and media queries are applied:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #1e1e1e;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --color-bg-primary: #ffffff;
  }
}
```

### VSCode Webview Not Using Theme Variables

**Problem:** Webview shows default colors instead of VSCode theme

**Solution:** Verify VSCode class is applied:

```javascript
// In webview HTML
if (typeof acquireVsCodeApi === 'function') {
  document.documentElement.classList.add('vscode-webview');
}

// In CSS, use .vscode-webview selector
.vscode-webview.vscode-dark {
  --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
}
```

### Text Not Readable in High Contrast

**Problem:** Text color insufficient contrast in high contrast mode

**Solution:** Ensure --color-text-secondary is bright enough:

```css
@media (prefers-contrast: more) {
  :root {
    --color-text-secondary: #b0b0b0; /* Lighter gray */
  }
}
```

### Animations Stuttering on Reduced Motion

**Problem:** Animations still play despite prefers-reduced-motion

**Solution:** Check that media query properly disables animations:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Future Enhancements

Potential improvements to the theme system:

- [ ] **System dark/light toggle UI** - User preference selector
- [ ] **Custom theme editor** - Allow users to adjust colors
- [ ] **Theme persistence** - Save user preference to localStorage
- [ ] **Scheduled theme** - Auto-switch at sunset/sunrise
- [ ] **RTL support** - Right-to-left language support
- [ ] **Color blind mode** - Deuteranopia/Protanopia variants
- [ ] **Animated transitions** - Smooth theme transitions (optional)

---

## Summary

The universal dark theme provides **consistent, accessible design** across all platforms:

✅ **Unified Design** — Same visual system in web, VSCode, and React
✅ **Automatic Detection** — Adapts to system and VSCode themes
✅ **Accessibility** — Full keyboard support, high contrast, reduced motion
✅ **Responsive** — Works perfectly on all device sizes
✅ **Customizable** — Easy to adjust colors via CSS variables
✅ **Maintainable** — Single source of truth for all design tokens

For questions or issues, refer to the **Troubleshooting** section or check the implementation in:
- `dashboard.html` — Web browser implementation
- `dashboard-webview.html` — VSCode webview implementation
- `dashboard.tsx` — React component implementation

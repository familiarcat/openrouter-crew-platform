# 🎨 Universal Dark Theme - Quick Reference

**TL;DR:** Use CSS variables for all colors. System automatically detects theme.

---

## Fastest Implementation (Copy-Paste)

### HTML Elements

```html
<!-- Include the theme CSS -->
<style>
  :root {
    --color-bg-primary: #1e1e1e;
    --color-text-primary: #cccccc;
    --color-border: #3e3e42;
    /* ... more variables ... */
  }
</style>

<!-- Use variables in your styles -->
<div style="background: var(--color-bg-primary); color: var(--color-text-primary);">
  Content
</div>
```

### React/TypeScript

```typescript
// Import theme variables
import './dashboard-variables.css';

// Use inline styles with variables
<div style={{
  backgroundColor: 'var(--color-bg-secondary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)'
}}>
  {children}
</div>

// Or use className with Tailwind plugin
<div className="bg-theme-bg-secondary text-theme-text-primary">
  {children}
</div>
```

### VSCode Webview

```typescript
// In your extension
const panel = vscode.window.createWebviewPanel('memory', 'Memory', target, {
  enableScripts: true
});

// Load dashboard-webview.html (includes theme detection)
panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

// Send messages to webview
panel.webview.postMessage({ command: 'setProject', projectId: 'my-proj' });
```

---

## Essential CSS Variables (27 Most Used)

```css
/* Backgrounds - Use for containers */
--color-bg-primary       #1e1e1e  ← App background
--color-bg-secondary     #252526  ← Card backgrounds
--color-bg-tertiary      #2d2d30  ← Section headers
--color-bg-hover         #383838  ← Hover states
--color-bg-active        #505052  ← Active/selected

/* Text - Use for all text */
--color-text-primary     #cccccc  ← Main text
--color-text-secondary   #858585  ← Labels/descriptions
--color-text-tertiary    #6a6a6a  ← Placeholders
--color-text-inverse     #1e1e1e  ← On bright bg

/* Brand - Use for actions */
--color-primary-500      #3b82f6  ← Buttons/links
--color-primary-600      #2563eb  ← Hover
--color-primary-50       #1e3a5f  ← Background

/* Borders - Use for lines */
--color-border           #3e3e42  ← Separators

/* Status - Use for feedback */
--color-success          #10b981  ← Success
--color-warning          #f59e0b  ← Warning
--color-error            #ef4444  ← Error
--color-info             #3b82f6  ← Info

/* Layers - Use for memory items */
--color-layer-1-bg       #1e3a5f  ← Observation background
--color-layer-1-text     #3b82f6  ← Observation text
--color-layer-2-bg       #2d1b4e  ← Pattern background
--color-layer-2-text     #a855f7  ← Pattern text
--color-layer-3-bg       #3d2817  ← Strategy background
--color-layer-3-text     #f59e0b  ← Strategy text
--color-layer-4-bg       #3a1e1e  ← Institutional background
--color-layer-4-text     #ef4444  ← Institutional text
```

---

## Common Patterns (Copy & Modify)

### Card Component

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 16px;
  border-radius: 8px;
}

.card:hover {
  background: var(--color-bg-tertiary);
}
```

### Button (Primary)

```css
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-600);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Input Field

```css
.input {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 10px 12px;
  border-radius: 6px;
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
```

### Status Message

```css
.status-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 12px;
  border-radius: 6px;
}

.status-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}
```

### Memory Item (with Layer)

```css
.memory-item {
  background: var(--color-bg-secondary);
  border-left: 4px solid var(--color-primary-500);
  padding: 12px;
  cursor: pointer;
}

.memory-item.layer-1 { border-left-color: var(--color-layer-1-text); }
.memory-item.layer-2 { border-left-color: var(--color-layer-2-text); }
.memory-item.layer-3 { border-left-color: var(--color-layer-3-text); }
.memory-item.layer-4 { border-left-color: var(--color-layer-4-text); }

.memory-item:hover {
  background: var(--color-bg-hover);
}

.memory-item.selected {
  background: var(--color-primary-50);
  border-left-color: var(--color-primary-500);
}
```

---

## Testing Your Colors

### In Browser Console

```javascript
// Check a color variable
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary-500')
  .trim();

// Toggle light mode
document.body.classList.toggle('vscode-light');

// Force dark mode
document.body.classList.add('vscode-dark');

// Check all colors
const styles = getComputedStyle(document.documentElement);
console.log(styles.getPropertyValue('--color-text-primary'));
```

### Verify Contrast Ratio

```javascript
// Paste in DevTools console to check any color contrast
const contrast = (rgb1, rgb2) => {
  const getLum = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g);
    const [rs, gs, bs] = [r, g, b].map(x => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = getLum(rgb1);
  const l2 = getLum(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// Example: check text on background
contrast('rgb(204, 204, 204)', 'rgb(30, 30, 30)'); // Should be > 4.5
```

---

## Responsive Breakpoints

```css
/* Desktop - no media query needed */
.container {
  padding: 24px;
  grid-template-columns: 2fr 1fr;
}

/* Tablet */
@media (max-width: 768px) {
  .container {
    padding: 12px;
    grid-template-columns: 1fr;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .container {
    padding: 8px;
    font-size: 14px;
  }
}
```

---

## Common Mistakes

### ❌ Don't Do This

```css
/* ❌ Hardcoded colors */
background: #ffffff;
color: #333333;
border: 1px solid #ccc;

/* ❌ Mixing light and dark */
background: white;
color: var(--color-text-primary); /* Doesn't work in dark mode */

/* ❌ Forgetting fallbacks in VSCode */
--color-bg: var(--vscode-editor-background); /* Will be undefined */
```

### ✅ Do This Instead

```css
/* ✅ Use CSS variables */
background: var(--color-bg-secondary);
color: var(--color-text-primary);
border: 1px solid var(--color-border);

/* ✅ Always use fallbacks in VSCode */
--color-bg: var(--vscode-editor-background, #1e1e1e);

/* ✅ Use semantic color names */
.success { color: var(--color-success); }
.error { color: var(--color-error); }
```

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| `universal-dark-theme.css` | Core CSS variables | 28 KB |
| `dashboard.html` | Web dashboard | 35 KB |
| `dashboard-webview.html` | VSCode webview | 36 KB |
| `dashboard.tsx` | React component | 12 KB |
| `UNIVERSAL_DARK_THEME.md` | Full guide | 500+ lines |
| `QUICK_REFERENCE.md` | This file | Quick lookup |

---

## Quick Links

**Get Started:**
- Read: [UNIVERSAL_DARK_THEME.md](./UNIVERSAL_DARK_THEME.md)
- Copy: Color patterns from "Common Patterns" section
- Test: Run dashboard at `localhost:3333`

**Test Immediately:**
```bash
# Start server
pnpm memory:dev

# Open in browser
open http://localhost:3333

# Test responsive
Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows/Linux)
```

**Integrate with React:**
1. Create `src/dashboard-variables.css`
2. Copy `:root { ... }` from `universal-dark-theme.css`
3. Import in component: `import './dashboard-variables.css'`
4. Use: `style={{ backgroundColor: 'var(--color-bg-secondary)' }}`

---

## Support

**Questions?**
- See full guide: `UNIVERSAL_DARK_THEME.md`
- See architecture: `ARCHITECTURE_DIAGRAM.md`
- See examples: `dashboard.html` or `dashboard-webview.html`

**Report Issues:**
1. Check browser console for errors
2. Verify CSS variables are defined
3. Check media queries apply correctly
4. Test in incognito/private mode

---

**Everything is ready. Start using colors from the reference table above!** 🎨

# Quick Start Guide - Codebase Analyzer

Get the beautiful dashboard running in under 1 minute.

## 60-Second Setup

### Option 1: Open Dashboard Directly
```bash
cd codebase-analyzer

# Dashboard is already generated! Just open it:
./open-dashboard.sh

# Or open manually:
open output/index.html
```

### Option 2: Serve Locally
```bash
cd codebase-analyzer

# Install (if needed)
pnpm install

# Serve on local port
pnpm serve

# Open: http://localhost:8080/output/index.html
```

## What You'll See

### Dashboard Sections

1. **Overall Statistics** - 6 key metrics at a glance
   - 2,056 total files
   - 285,675 lines of code
   - 11.32 MB total size
   - 37 packages
   - 5 bounded contexts

2. **Cost Optimization** - API usage and savings analysis
   - Estimated monthly API calls
   - Cost breakdown by model
   - Actionable recommendations

3. **Technology Stack** - All frameworks and tools
   - Languages: TypeScript, JavaScript, Python
   - Frameworks: React, Next.js, Express
   - Tools: Turbo, pnpm, Supabase

4. **Domains** - 5 bounded contexts visualized
   - alex-ai-universal
   - product-factory
   - shared
   - test-projects
   - vscode-extension

5. **Code Metrics** - 4 interactive charts
   - Files by language
   - Lines of code by language
   - Files by type
   - Packages by type

6. **Project Structure** - Complete file tree
   - Interactive, scrollable tree view
   - File icons and language badges
   - File sizes

7. **Packages Directory** - All 37 packages listed
   - Interactive search
   - Type badges (app/library/service)
   - Dependency counts

## Advanced Usage

### Regenerate Dashboard (if code changes)
```bash
cd codebase-analyzer
pnpm generate
```

### Analyze Just One Domain
```bash
cd codebase-analyzer
node --loader ts-node/esm analyzer.ts ../domains/shared ./shared-analysis.json
npx ts-node build-dashboard.ts  # Then update input path
```

### View Metrics Summary
```bash
cat codebase-analyzer/codebase-metrics.txt
```

### View Raw Analysis Data
```bash
cat codebase-analyzer/codebase.json | jq '.'  # with jq
# or just open it in your editor
```

## File Locations

| File | Purpose | Size |
|------|---------|------|
| `analyzer.ts` | Analysis engine | 12 KB |
| `build-dashboard.ts` | Dashboard generator | 23 KB |
| `output/index.html` | **The dashboard** | 551 KB |
| `codebase.json` | Raw analysis data | 1.0 MB |
| `codebase-metrics.txt` | Text summary | 2.4 KB |

## Key Stats

- **Analysis Time**: 424ms
- **Total Files**: 2,056
- **Lines of Code**: 285,675
- **Packages**: 37
- **Domains**: 5

## Troubleshooting

### Dashboard won't open?
```bash
# Make sure the file exists
ls -lh codebase-analyzer/output/index.html

# If missing, regenerate:
cd codebase-analyzer && pnpm generate
```

### Want to update the dashboard?
```bash
# If code changed in monorepo:
cd codebase-analyzer
pnpm analyze          # Re-scan
pnpm build:dashboard  # Rebuild HTML
```

### Want to customize colors?
Edit `build-dashboard.ts`:
```typescript
:root {
  --bg-primary: #1e1e1e;    // Dark background
  --accent: #007acc;         // Blue accent
  --success: #13c313;       // Green for success
}
```

Then regenerate with `pnpm generate`.

## Features

### Interactive Search
In the Packages table, type to filter packages in real-time.

### Hover Effects
- Stat cards lift on hover
- Charts highlight bars
- Packages highlight on row hover

### Responsive Design
- Works on desktop (recommended)
- Works on tablets
- Works on mobile (best viewed full-width)

### Dark Theme
- Matches VSCode dark theme
- Easy on the eyes
- Professional appearance

## Next Steps

1. **Explore** - Click around, search packages, view the tree
2. **Share** - Send `output/index.html` to team members
3. **Analyze** - Check cost optimization recommendations
4. **Integrate** - Add to CI/CD for automatic updates

## API-Free Analysis

The dashboard uses **ZERO** external API calls:
- All analysis runs locally
- No data sent anywhere
- Works completely offline
- Share freely without privacy concerns

## Questions?

See `README.md` for full documentation:
```bash
cat codebase-analyzer/README.md
```

Or check implementation details:
```bash
head -50 codebase-analyzer/analyzer.ts
head -50 codebase-analyzer/build-dashboard.ts
```

---

**Ready to go!** Your dashboard is waiting at `codebase-analyzer/output/index.html` 🚀

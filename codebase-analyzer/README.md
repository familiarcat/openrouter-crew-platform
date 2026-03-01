# Codebase Analyzer

Comprehensive static codebase analysis tool for the OpenRouter Crew Platform. Generates detailed metrics, dashboards, and trend reports about code structure, complexity, and quality.

## Features

### Core Analysis
- **File Structure** - Complete directory tree with file counts, sizes, and line counts
- **Language Statistics** - Files, lines, and sizes grouped by programming language
- **Package Discovery** - Automatic detection and cataloging of all npm packages
- **Domain Identification** - Extraction of DDD (Domain-Driven Design) bounded contexts
- **Technology Detection** - Framework, tool, and language identification from dependencies

### Advanced Metrics

#### Complexity Analysis
- **Estimated Cyclomatic Complexity** - Rough approximation of code control flow complexity
- **Average Function Size** - Mean lines per function (estimation)
- **Large Files Detection** - Identifies files exceeding 500 lines
- **Complexity Scoring** - Logarithmic scaling based on file sizes

#### Code Quality
- **Documentation Coverage** - Percentage of lines with comments or JSDoc
- **TypeScript Strict Mode** - Percentage of packages using strict mode
- **Test File Count** - Number of test files found (*.test.*, *.spec.*, __tests__)
- **Test Coverage Estimate** - Ratio of test files to source files

#### Duplication Detection
- **Code Pattern Detection** - Identifies repeated patterns (functions, imports, classes)
- **Duplication Percentage** - Estimated % of duplicated code
- **Suspicious Patterns** - Common patterns that may indicate refactoring opportunities

#### Health Metrics
- **TypeScript Strict Mode** - Whether strict mode is enabled
- **Outdated Packages** - Estimate of packages needing updates
- **Security Issues** - Basic scan for known problematic patterns

## Usage

### Command Line
```bash
cd codebase-analyzer
pnpm analyze        # Run analysis
pnpm build:dashboard  # Build dashboard
pnpm generate       # One-step: analyze + build
pnpm serve          # Serve dashboard on port 8080
```

### Weekly Automated Analysis
```bash
bash scripts/weekly-analysis.sh          # Run weekly analysis
DRY_RUN=true bash scripts/weekly-analysis.sh  # Dry run
```

### GitHub Actions
Automatic on:
- Every PR to main/develop
- Weekly schedule (Monday 9 AM UTC)
- Manual workflow dispatch

## Output Files

- **codebase.json** - Complete analysis data (JSON)
- **codebase-metrics.txt** - Human-readable summary
- **output/index.html** - Interactive dashboard
- **weekly-report-YYYYMMDD.md** - Weekly change reports

## Metrics Explained

| Metric | Description | Target |
|--------|-------------|--------|
| Cyclomatic Complexity | Control flow complexity | < 100 |
| Average Function Size | Lines per function | 5-15 lines |
| Documentation Coverage | Comment line ratio | 20-30% |
| TypeScript Strict Mode | Strict mode usage % | > 80% |
| Test Files | Count of test files | 1:1 ratio |
| Code Duplication | Repeated code % | < 5% |

## Current Status

Latest Analysis (2026-03-01):
- **Total Files:** 2,071
- **Total Lines:** 339,367
- **Estimated Complexity:** 1,771
- **Large Files:** 33
- **Test Files:** 159
- **Documentation Coverage:** 2%
- **TypeScript Strict Mode:** 19%

## Recommendations

- 📁 Multiple large files detected. Consider refactoring.
- 📝 Low documentation coverage. Add more JSDoc comments.
- 🔒 Enable TypeScript strict mode in more packages.

## Configuration

### Environment Variables
```bash
SLACK_WEBHOOK_URL="..."  # Slack notifications
GITHUB_TOKEN="..."       # GitHub integration
DRY_RUN=true             # Preview mode
COMMIT_RESULTS=false     # Skip git commit
```

### Ignore Patterns
Edit `analyzer.ts` `IGNORE_PATTERNS` array to exclude directories

## Integration

### VSCode Extension
Displays analysis in sidebar with auto-refresh and link to full dashboard

### GitHub Actions
Creates PR comments with metrics, quality checks, and artifacts

## Performance

- **Analysis Speed:** ~500ms for entire monorepo
- **Memory:** ~50-100MB
- **Scalability:** O(n) with file count

## Learn More

- [CLAUDE.md](../CLAUDE.md) - Project memory
- [.github/workflows/codebase-analysis.yml](../.github/workflows/codebase-analysis.yml) - CI/CD
- [VSCode Extension](../domains/vscode-extension/) - IDE integration

---

**Last Updated:** 2026-03-01  
**Status:** Active  
**Maintainer:** OpenRouter Crew Platform Team

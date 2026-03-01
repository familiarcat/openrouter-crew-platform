# OpenRouter Crew Platform - Comprehensive Versioning System

Complete documentation for the milestone/versioning system including local and remote publishing, CI/CD integration, and deployment tracking.

## Table of Contents

1. [Overview](#overview)
2. [Semantic Versioning](#semantic-versioning)
3. [Release Stages](#release-stages)
4. [Local Publishing](#local-publishing)
5. [Remote Publishing](#remote-publishing)
6. [CI/CD Integration](#cicd-integration)
7. [Version Information Files](#version-information-files)
8. [Milestone Tracking](#milestone-tracking)
9. [Commands & Scripts](#commands--scripts)
10. [Monitoring & Observability](#monitoring--observability)

---

## Overview

The OpenRouter Crew Platform uses a comprehensive versioning system that:

- **Tracks development milestones** with automatic version detection
- **Implements semantic versioning** (MAJOR.MINOR.PATCH)
- **Manages release stages** from alpha through production release
- **Generates deployment artifacts** with comprehensive metadata
- **Maintains version history** with metrics and deployment status
- **Integrates with GitHub** for releases and deployment tracking
- **Provides dashboards** for version and deployment information

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Version Management System                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Local Publishing (publish-local.sh)           │  │
│  │  - Build all packages                           │  │
│  │  - Run test suite                               │  │
│  │  - Generate metrics & analysis                  │  │
│  │  - Create distribution folder                   │  │
│  │  - Generate CHANGELOG                           │  │
│  │  - Create git tags                              │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Remote Publishing (publish-remote.sh)         │  │
│  │  - Push to GitHub Releases                      │  │
│  │  - Deploy dashboards to GitHub Pages            │  │
│  │  - Create milestone issues                      │  │
│  │  - Track deployment status                      │  │
│  │  - Send Slack notifications                     │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Version Information (generate-version-info.ts)│  │
│  │  - Generate version badges                      │  │
│  │  - Create version JSON API                      │  │
│  │  - Build metadata files                         │  │
│  │  - Generate deployment status                   │  │
│  │  - Create info pages                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Milestone System (milestones.ts)              │  │
│  │  - Track milestones                             │  │
│  │  - Calculate metrics                            │  │
│  │  - Generate changelogs                          │  │
│  │  - Manage history                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Semantic Versioning

The platform uses semantic versioning: `MAJOR.MINOR.PATCH`

### Version Increment Rules

- **MAJOR** (X.0.0): Breaking changes, architectural shifts
- **MINOR** (0.X.0): New features, additions
- **PATCH** (0.0.X): Bug fixes, minor improvements

### Version Detection

The system automatically detects which component should be incremented based on:

1. **Breaking Changes**: Increment MAJOR
2. **New Features**: Increment MINOR
3. **Bug Fixes Only**: Increment PATCH

### Examples

```
Current: 1.0.0-alpha

New features → 1.1.0-alpha
Breaking changes → 2.0.0-alpha
Bug fixes only → 1.0.1-alpha
```

---

## Release Stages

Each version progresses through defined stages:

### 1. Alpha (α)
- **Status**: Early development
- **Deployment**: Local only
- **Breaking Changes**: Possible
- **Support**: Development team only
- **Duration**: 1-4 weeks

Example: `v1.0.0-alpha`

### 2. Beta (β)
- **Status**: Feature-complete, testing in progress
- **Deployment**: Staging environment
- **Breaking Changes**: Unlikely
- **Support**: Beta testers, team
- **Duration**: 1-3 weeks

Example: `v1.0.0-beta`

### 3. Release Candidate (rc)
- **Status**: Ready for production, final testing
- **Deployment**: Staging mirror of production
- **Breaking Changes**: None
- **Support**: QA team, selected users
- **Duration**: 3-7 days

Example: `v1.0.0-rc`

### 4. Release
- **Status**: Production-ready
- **Deployment**: Production
- **Breaking Changes**: None (see BREAKING.md)
- **Support**: All users
- **Duration**: Until next major release

Example: `v1.0.0`

---

## Local Publishing

Local publishing builds, tests, and packages your code locally without deploying to remote services.

### Command

```bash
bash scripts/publishing/publish-local.sh [VERSION] [STAGE]
```

### Examples

```bash
# Default (1.0.0 alpha)
bash scripts/publishing/publish-local.sh

# Specific version
bash scripts/publishing/publish-local.sh 1.2.0 beta

# Release candidate
bash scripts/publishing/publish-local.sh 2.0.0 rc

# Production release
bash scripts/publishing/publish-local.sh 1.0.0 release
```

### Process Steps

1. **Install Dependencies** (2 min)
   - `pnpm install`

2. **Type Checking** (1 min)
   - `pnpm type-check`

3. **Test Suite** (2-5 min)
   - `pnpm test`
   - Results saved to `test-results.json`

4. **Build All Packages** (3-5 min)
   - `pnpm build`
   - Uses Turbo for parallel builds

5. **Generate Analysis** (1 min)
   - Calculates codebase metrics
   - File counts, lines of code, packages
   - Git information

6. **Generate CHANGELOG** (< 1 min)
   - Creates detailed changelog
   - Lists features, fixes, breaking changes
   - Includes metrics and contributors

7. **Create Git Tag** (< 1 min)
   - Creates annotated git tag
   - Tag format: `v{VERSION}-{STAGE}`

### Artifacts Generated

Local publishing creates `/dist/{VERSION}/` with:

```
dist/1.0.0-alpha/
├── CHANGELOG.md              # Detailed release notes
├── analysis.json             # Codebase metrics
├── test-results.json         # Test execution results
├── metadata.json             # Release metadata
├── deployment-report.json    # Deployment status
├── version-badge.svg         # Version badge image
└── build-log.txt            # Full build output
```

### Build Log

The full build process is logged to:
```
build-{TIMESTAMP}.log
```

Example: `build-20260301_120000.log`

---

## Remote Publishing

Remote publishing deploys artifacts to GitHub, creates releases, and tracks deployment status.

### Prerequisites

1. **GitHub CLI installed and authenticated**
   ```bash
   gh auth status
   ```

2. **Local build already completed**
   ```bash
   bash scripts/publishing/publish-local.sh 1.0.0 alpha
   ```

### Command

```bash
bash scripts/publishing/publish-remote.sh [VERSION] [STAGE]
```

### Examples

```bash
# Push existing local build to remote
bash scripts/publishing/publish-remote.sh 1.0.0 alpha

# Beta release
bash scripts/publishing/publish-remote.sh 1.1.0 beta

# Production release
bash scripts/publishing/publish-remote.sh 1.0.0 release
```

### Process Steps

1. **Check Prerequisites** (< 1 min)
   - Verify distribution directory exists
   - Check GitHub CLI is installed and authenticated
   - Verify git configuration

2. **Push Git Tags** (< 1 min)
   - Pushes git tag to origin
   - Format: `v{VERSION}-{STAGE}`

3. **Create GitHub Release** (< 1 min)
   - Creates GitHub Release page
   - Includes changelog in release notes
   - Marks pre-releases appropriately

4. **Upload Artifacts** (< 1 min)
   - Uploads `CHANGELOG.md`
   - Uploads `analysis.json`
   - Uploads `test-results.json`

5. **Create Milestone Issue** (< 1 min)
   - Creates GitHub issue for the milestone
   - Links to release page
   - Tags with release labels

6. **Deploy Dashboards** (2-3 min)
   - Builds static dashboard pages
   - Prepares GitHub Pages deployment
   - Note: Requires manual trigger or separate CI

7. **Generate Report** (< 1 min)
   - Creates `deployment-report.json`
   - Documents all endpoints and URLs

### GitHub Release URL

After remote publishing:
```
https://github.com/bradygeorgen/openrouter-crew-platform/releases/tag/v{VERSION}-{STAGE}
```

Example:
```
https://github.com/bradygeorgen/openrouter-crew-platform/releases/tag/v1.0.0-alpha
```

### Deployment Report

Remote publishing creates:
```
dist/{VERSION}/deployment-report.json
```

Contents:
```json
{
  "version": "1.0.0",
  "stage": "alpha",
  "deployed_at": "2026-03-01T12:00:00Z",
  "deployment_status": "success",
  "endpoints": {
    "github_release": "https://...",
    "github_pages": "https://...",
    "source": "https://github.com/..."
  }
}
```

---

## CI/CD Integration

The system is integrated into GitHub Actions for automatic versioning and publishing.

### Workflow: `milestone-versioning.yml`

**Trigger**: Commits to `main` branch affecting version files

**Jobs**:

1. **detect-version**
   - Reads version from `package.json`
   - Checks if tag already exists
   - Determines if publishing should run

2. **build-and-test**
   - Installs dependencies
   - Runs type checks
   - Executes test suite
   - Builds all packages

3. **generate-version-info**
   - Generates version badges
   - Creates version API JSON
   - Builds metadata files
   - Generates deployment status

4. **publish-local**
   - Runs local publishing if new version detected
   - Creates git tags
   - Uploads artifacts

5. **publish-remote**
   - Runs only on main branch
   - Pushes to GitHub
   - Creates releases
   - Posts Slack notifications

6. **generate-release-notes**
   - Updates milestones.md
   - Commits release notes

### Workflow File

Location: `.github/workflows/milestone-versioning.yml`

### Manual Trigger

```bash
gh workflow run milestone-versioning.yml \
  -f version=1.0.0 \
  -f stage=alpha
```

---

## Version Information Files

The system generates several files containing version information.

### `.version-info/` Directory

```
.version-info/
├── version.json              # Version API
├── build-metadata.json       # Build information
├── deployment-status.json    # Deployment tracking
├── version-badge.svg         # SVG badge
└── version-1.0.0-alpha.html # Info page
```

### version.json

**Purpose**: Machine-readable version API

```json
{
  "version": "1.0.0",
  "stage": "alpha",
  "buildDate": "2026-03-01T12:00:00Z",
  "git": {
    "commit": "5c0a523",
    "branch": "main"
  },
  "environment": {
    "node": "v20.10.0",
    "npm": "10.2.3",
    "typescript": "5.9.3"
  }
}
```

### build-metadata.json

**Purpose**: Comprehensive build information

```json
{
  "timestamp": "2026-03-01T12:00:00Z",
  "version": "1.0.0",
  "stage": "alpha",
  "git": {
    "commit": "5c0a523",
    "branch": "main",
    "tag": "v1.0.0-alpha",
    "upstream": "https://github.com/..."
  },
  "environment": {
    "node": "v20.10.0",
    "npm": "10.2.3",
    "typescript": "5.9.3",
    "platform": "darwin"
  },
  "codebase": {
    "files": 512,
    "lines": 52000,
    "packages": 13
  }
}
```

### deployment-status.json

**Purpose**: Deployment tracking

```json
{
  "version": "1.0.0",
  "lastDeployed": "2026-03-01T12:00:00Z",
  "environments": {
    "local": {
      "status": "ready",
      "path": "/dist/1.0.0",
      "builtAt": "2026-03-01T12:00:00Z"
    },
    "staging": {
      "status": "deploying",
      "url": "https://staging.openrouter-crew.dev",
      "deployedAt": "2026-03-01T12:00:00Z"
    }
  }
}
```

### version-badge.svg

**Purpose**: Display version in README and documentation

**Embedding in Markdown**:

```markdown
![Version Badge](.version-info/version-badge.svg)

or

<img src=".version-info/version-badge.svg" alt="Version Badge" />
```

**Preview**: Red (alpha), Yellow (beta), Green (rc), Teal (release)

---

## Milestone Tracking

### Milestones File

Location: `milestones/MILESTONES.md`

Tracks:
- Version history
- Feature timeline
- Deployment status
- Performance metrics
- Contributors

### Milestone Objects

Each milestone stored as `milestones/{VERSION}.json`:

```json
{
  "version": "1.0.0",
  "stage": "alpha",
  "date": "2026-03-01T12:00:00Z",
  "features": [
    "Platform initialization",
    "Core dashboard"
  ],
  "fixes": [
    "TypeScript compilation"
  ],
  "breaking": [],
  "metrics": {
    "files": 512,
    "lines": 52000,
    "packages": 13,
    "commitCount": 100
  },
  "deployed": {
    "local": "/dist/1.0.0",
    "remote": "https://github.com/.../releases"
  },
  "gitTag": "v1.0.0-alpha",
  "commitHash": "5c0a523...",
  "contributors": ["Brady Georgen"]
}
```

### Milestone History

Location: `milestones/history.json`

Maintains:
- Current milestone
- Previous 20 milestones
- Planned future milestones

---

## Commands & Scripts

### Version Commands

**Generate all version information**:
```bash
pnpm version:generate
```

**Get current version**:
```bash
pnpm version:current
```

**Generate version badge**:
```bash
pnpm version:badge
```

**Generate version API**:
```bash
pnpm version:api
```

**Generate build metadata**:
```bash
pnpm version:metadata
```

**Check deployment status**:
```bash
pnpm version:status
```

**Generate version info page**:
```bash
pnpm version:page
```

### Publishing Commands

**Local publishing**:
```bash
pnpm publish:local
```

**Remote publishing**:
```bash
pnpm publish:remote
```

**Complete publishing (local + remote)**:
```bash
pnpm publish:full
```

### Milestone Commands

**List all milestones**:
```bash
pnpm milestone:list
```

**Show current milestone**:
```bash
pnpm milestone:current
```

### Direct Script Execution

**Local publish with specific version**:
```bash
bash scripts/publishing/publish-local.sh 1.0.0 release
```

**Remote publish with specific version**:
```bash
bash scripts/publishing/publish-remote.sh 1.0.0 release
```

---

## Monitoring & Observability

### Build Metrics

Track in GitHub Actions logs:
- Build duration
- Package count
- Lines of code
- File count
- Test results

### Deployment Tracking

Files: `dist/{VERSION}/deployment-report.json`

### Version Dashboard

Access version information at:
- `.version-info/version-{VERSION}-{STAGE}.html`
- Open in browser for visual dashboard

### GitHub Releases

View all releases:
```
https://github.com/bradygeorgen/openrouter-crew-platform/releases
```

### Artifact Retention

- Build artifacts: 7 days
- Version info: 30 days
- Distributions: 30 days
- Workflow logs: 90 days

---

## Best Practices

### When to Create Milestones

1. **Feature Complete**: All planned features working
2. **Tests Passing**: Test coverage at minimum threshold
3. **Documentation Ready**: README and guides updated
4. **No Critical Bugs**: All blockers resolved

### Version Bumping Strategy

| Scenario | Action |
|----------|--------|
| New features | Bump MINOR |
| Bug fixes only | Bump PATCH |
| Breaking changes | Bump MAJOR |
| Pre-release | Use stage suffix |

### Release Checklist

- [ ] Update `package.json` version
- [ ] Run local publish
- [ ] Review generated artifacts
- [ ] Check git tags
- [ ] Review GitHub release page
- [ ] Verify deployment URLs
- [ ] Update MILESTONES.md
- [ ] Send notification

---

## Troubleshooting

### Tag Already Exists

```bash
# Delete local tag
git tag -d v1.0.0-alpha

# Delete remote tag
git push origin --delete v1.0.0-alpha

# Recreate
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

### GitHub CLI Not Found

```bash
# Install GitHub CLI
brew install gh  # macOS
apt-get install gh  # Linux
choco install gh  # Windows

# Authenticate
gh auth login
```

### Build Failed

1. Check build log: `build-{TIMESTAMP}.log`
2. Review error messages
3. Fix issues locally
4. Run `pnpm build` to verify
5. Run local publish again

### Release Already Exists

The system checks for existing releases and skips if found. To force recreate:

```bash
# Delete GitHub release
gh release delete v1.0.0-alpha

# Recreate
bash scripts/publishing/publish-remote.sh 1.0.0 alpha
```

---

## Environment Variables

### Optional Configuration

```bash
# Slack notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."

# GitHub token (if not using gh auth)
export GITHUB_TOKEN="ghp_..."

# Build configuration
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

## See Also

- [MILESTONES.md](./milestones/MILESTONES.md) - Version history and timeline
- [CHANGELOG.md](./dist/1.0.0/CHANGELOG.md) - Latest changes
- [GitHub Releases](https://github.com/bradygeorgen/openrouter-crew-platform/releases) - Published releases
- [GitHub Actions](https://github.com/bradygeorgen/openrouter-crew-platform/actions) - CI/CD pipelines

---

**Last Updated**: 2026-03-01
**Version**: 1.0.0-alpha
**Status**: Active Development

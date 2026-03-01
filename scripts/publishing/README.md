# Publishing System

Scripts for local and remote publishing of OpenRouter Crew Platform releases.

## Scripts

### `publish-local.sh`

Local publishing: build, test, analyze, and package.

**Purpose**:
- Build all packages with Turbo
- Run full test suite
- Generate codebase analysis
- Calculate metrics
- Create distribution folder
- Generate CHANGELOG
- Create git tags

**Usage**:
```bash
bash scripts/publishing/publish-local.sh [VERSION] [STAGE]
```

**Examples**:
```bash
# Default (1.0.0 alpha)
bash scripts/publishing/publish-local.sh

# Specific version
bash scripts/publishing/publish-local.sh 1.2.0 beta

# Production release
bash scripts/publishing/publish-local.sh 1.0.0 release
```

**Output**:
```
dist/{VERSION}/
├── CHANGELOG.md
├── analysis.json
├── test-results.json
├── metadata.json
├── deployment-report.json
└── version-badge.svg
```

**Time**: ~5-10 minutes
**Requirements**: Node.js 20+, pnpm 9+

### `publish-remote.sh`

Remote publishing: push to GitHub, create releases, track deployment.

**Purpose**:
- Push git tags to remote
- Create GitHub Release
- Upload artifacts
- Create milestone issues
- Deploy dashboards
- Track deployment status

**Prerequisites**:
1. GitHub CLI installed: `brew install gh`
2. GitHub authenticated: `gh auth login`
3. Local build exists: `bash scripts/publishing/publish-local.sh ...`

**Usage**:
```bash
bash scripts/publishing/publish-remote.sh [VERSION] [STAGE]
```

**Examples**:
```bash
# Push existing local build
bash scripts/publishing/publish-remote.sh 1.0.0 alpha

# Beta release
bash scripts/publishing/publish-remote.sh 1.1.0 beta

# Production
bash scripts/publishing/publish-remote.sh 1.0.0 release
```

**Output**:
```
GitHub Release:
https://github.com/bradygeorgen/openrouter-crew-platform/releases/tag/v{VERSION}-{STAGE}

Distribution:
dist/{VERSION}/deployment-report.json
```

**Time**: ~3-5 minutes
**Requirements**: GitHub CLI, git, internet connection

## Workflow

### Local Publishing

```
1. Install dependencies
2. Type check
3. Run tests
4. Build packages
5. Generate analysis
6. Create CHANGELOG
7. Create git tag
```

### Remote Publishing

```
1. Check prerequisites
2. Push git tags
3. Create GitHub Release
4. Upload artifacts
5. Create milestone issue
6. Deploy dashboards
7. Generate report
```

### Full Publishing

```bash
bash scripts/publishing/publish-local.sh 1.0.0 alpha && \
bash scripts/publishing/publish-remote.sh 1.0.0 alpha
```

Or use npm script:
```bash
pnpm publish:full
```

## Release Stages

- **alpha**: Early development, local only
- **beta**: Feature-complete, staging deployment
- **rc**: Ready for production, final testing
- **release**: Production-ready

## Environment Variables

**Optional**:
```bash
# Slack webhook for notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."

# GitHub token (if not using gh auth)
export GITHUB_TOKEN="ghp_..."
```

## Artifacts

### Local Publishing Creates

- **CHANGELOG.md**: Detailed release notes with metrics and contributors
- **analysis.json**: Codebase metrics (files, lines, packages)
- **test-results.json**: Full test execution results
- **metadata.json**: Release metadata and paths
- **deployment-report.json**: Deployment status and endpoints
- **version-badge.svg**: SVG badge for README

### Remote Publishing Uploads

All local artifacts are uploaded to GitHub Release:
- CHANGELOG.md
- analysis.json
- test-results.json

## Troubleshooting

**Tag already exists**:
```bash
git tag -d v1.0.0-alpha
git push origin --delete v1.0.0-alpha
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

**GitHub CLI not authenticated**:
```bash
gh auth login
```

**Distribution directory not found**:
```bash
# Must run local publish first
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

**Release already exists**:
```bash
gh release delete v1.0.0-alpha
bash scripts/publishing/publish-remote.sh 1.0.0 alpha
```

## Files Structure

```
scripts/publishing/
├── README.md              # This file
├── publish-local.sh       # Local publishing script
└── publish-remote.sh      # Remote publishing script
```

## Integration

### npm Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "publish:local": "bash scripts/publishing/publish-local.sh",
    "publish:remote": "bash scripts/publishing/publish-remote.sh",
    "publish:full": "bash scripts/publishing/publish-local.sh && bash scripts/publishing/publish-remote.sh"
  }
}
```

### GitHub Actions

Configured in `.github/workflows/milestone-versioning.yml`:
- Automatic versioning detection
- Local publishing on version changes
- Remote publishing on main branch
- Slack notifications

## See Also

- [VERSIONING.md](../../VERSIONING.md) - Complete versioning documentation
- [MILESTONES.md](../../milestones/MILESTONES.md) - Milestone history
- [GitHub Releases](https://github.com/bradygeorgen/openrouter-crew-platform/releases) - Published releases

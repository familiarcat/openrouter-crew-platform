# Versioning System - Quick Start Guide

Get started with the milestone and versioning system in 5 minutes.

## Installation

The versioning system is already integrated. No additional installation needed!

Required:
- Node.js 20+ ✅
- pnpm 9+ ✅
- Git ✅
- GitHub CLI (for remote publishing): `brew install gh`

## Quick Commands

### Check Current Version

```bash
pnpm version:current
# Output: 1.0.0
```

### Generate Version Information

```bash
pnpm version:generate
```

Creates in `.version-info/`:
- `version.json` - Machine-readable version
- `build-metadata.json` - Build information
- `deployment-status.json` - Deployment tracking
- `version-badge.svg` - Badge image
- `version-{VERSION}-{STAGE}.html` - Info page

## Publishing Workflow

### Step 1: Local Publishing

Build, test, and package everything locally:

```bash
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

**What happens**:
1. Builds all packages ✅
2. Runs all tests ✅
3. Generates metrics ✅
4. Creates distribution folder ✅
5. Generates CHANGELOG ✅
6. Creates git tag ✅

**Time**: 5-10 minutes

**Output**: `/dist/1.0.0-alpha/` with artifacts

### Step 2: Review Artifacts

Check the generated artifacts:

```bash
ls -lh dist/1.0.0-alpha/
# View changelog
cat dist/1.0.0-alpha/CHANGELOG.md
# View metrics
cat dist/1.0.0-alpha/analysis.json
```

### Step 3: Remote Publishing (Optional)

Push to GitHub and create a release:

```bash
# Authenticate with GitHub first
gh auth login

# Then publish
bash scripts/publishing/publish-remote.sh 1.0.0 alpha
```

**What happens**:
1. Pushes git tag to GitHub ✅
2. Creates GitHub Release ✅
3. Uploads artifacts ✅
4. Creates milestone issue ✅
5. Generates deployment report ✅

**Output**: GitHub Release page

## Common Scenarios

### Scenario 1: Create Alpha Release

```bash
# Build and test locally
bash scripts/publishing/publish-local.sh 1.0.0 alpha

# Review dist/1.0.0-alpha/
# Then publish to GitHub
bash scripts/publishing/publish-remote.sh 1.0.0 alpha
```

### Scenario 2: Create Beta Release

```bash
bash scripts/publishing/publish-local.sh 1.1.0 beta
bash scripts/publishing/publish-remote.sh 1.1.0 beta
```

### Scenario 3: Production Release

```bash
bash scripts/publishing/publish-local.sh 1.0.0 release
bash scripts/publishing/publish-remote.sh 1.0.0 release
```

### Scenario 4: One-Step Publishing

```bash
pnpm publish:full
```

Runs both local and remote publishing with defaults.

## Using npm Scripts

```bash
# Generate version information
pnpm version:generate

# Get current version
pnpm version:current

# View current milestone
pnpm milestone:current

# List all milestones
pnpm milestone:list

# Local publishing with defaults
pnpm publish:local

# Remote publishing with defaults
pnpm publish:remote

# Both local and remote
pnpm publish:full
```

## Release Stages Explained

| Stage | When to Use | Deployment |
|-------|------------|-----------|
| **alpha** | Early development, experimental | Local only |
| **beta** | Features complete, testing | Staging |
| **rc** | Ready for production, final testing | Staging mirror |
| **release** | Production-ready | Production |

## Understanding Version Numbers

**Format**: `MAJOR.MINOR.PATCH`

Example: `1.2.3`

- **MAJOR (1)**: Breaking changes
- **MINOR (2)**: New features
- **PATCH (3)**: Bug fixes

### When to Bump

- **New features** → Bump MINOR: `1.2.0` → `1.3.0`
- **Breaking changes** → Bump MAJOR: `1.0.0` → `2.0.0`
- **Bug fixes** → Bump PATCH: `1.2.0` → `1.2.1`

## Artifacts Generated

### Local Publishing Creates

```
dist/1.0.0-alpha/
├── CHANGELOG.md              # What changed
├── analysis.json             # Code metrics
├── test-results.json         # Test results
├── metadata.json             # Release info
├── deployment-report.json    # Status
└── version-badge.svg         # For README
```

### Files to Commit

```bash
git add milestones/
git add dist/
git commit -m "Release v1.0.0-alpha"
```

## Viewing Version Information

### In Browser

After generating version info:

```bash
open .version-info/version-1.0.0-alpha.html
```

Or find the file in `.version-info/` directory.

### As JSON

```bash
cat .version-info/version.json
cat .version-info/build-metadata.json
cat .version-info/deployment-status.json
```

### In README

Add version badge:

```markdown
![Version](.version-info/version-badge.svg)
```

## GitHub Release

After remote publishing, access at:

```
https://github.com/bradygeorgen/openrouter-crew-platform/releases/tag/v1.0.0-alpha
```

## Tracking Milestones

View all milestones:

```bash
cat milestones/MILESTONES.md
```

View specific milestone:

```bash
cat milestones/1.0.0.json
```

View history:

```bash
cat milestones/history.json
```

## Troubleshooting

### "Not authenticated with GitHub"

```bash
gh auth login
# Follow prompts to authenticate
```

### "Distribution directory not found"

```bash
# Must run local publish first
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

### "Tag already exists"

```bash
# Delete and recreate
git tag -d v1.0.0-alpha
git push origin --delete v1.0.0-alpha
bash scripts/publishing/publish-local.sh 1.0.0 alpha
```

### Build failed

Check the build log:

```bash
tail -50 build-*.log
```

Fix the issues, then try again.

## Next Steps

1. **First Release**:
   ```bash
   bash scripts/publishing/publish-local.sh 1.0.0 alpha
   ```

2. **Review Results**:
   ```bash
   cat dist/1.0.0-alpha/CHANGELOG.md
   ```

3. **Push to GitHub**:
   ```bash
   bash scripts/publishing/publish-remote.sh 1.0.0 alpha
   ```

4. **View Release**:
   ```
   https://github.com/bradygeorgen/openrouter-crew-platform/releases
   ```

## Complete Documentation

See [VERSIONING.md](./VERSIONING.md) for:
- Detailed workflow documentation
- All available commands
- Environment variables
- Advanced configuration
- CI/CD integration details

## Support

For issues or questions:
1. Check [VERSIONING.md](./VERSIONING.md) troubleshooting section
2. Review script logs in `build-*.log` and `deploy-*.log`
3. Check GitHub Actions logs at:
   ```
   https://github.com/bradygeorgen/openrouter-crew-platform/actions
   ```

---

**Ready to publish your first release!** 🚀

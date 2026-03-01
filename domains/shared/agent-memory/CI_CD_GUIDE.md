# 🚀 CI/CD Guide - Multi-Platform Publishing

Complete guide for publishing the Memory System to npm, documentation site, and preview dashboard with a single command.

## Quick Start

### Local Publishing

```bash
# Preview release (test without publishing)
./scripts/publish.sh preview

# Publish patch (bug fixes)
./scripts/publish.sh patch

# Publish minor (new features)
./scripts/publish.sh minor

# Publish major (breaking changes)
./scripts/publish.sh major
```

### GitHub Actions Publishing

1. Go to **Actions** tab in GitHub
2. Select **🧠 Publish Memory System** workflow
3. Click **Run workflow**
4. Select version type: `patch`, `minor`, `major`, or `preview`
5. Click **Run workflow**

The workflow will:
- ✅ Build and test the package
- ✅ Publish to npm (if not preview)
- ✅ Deploy documentation
- ✅ Deploy preview dashboard
- ✅ Create GitHub Release

## Publishing Platforms

### 1. 📦 npm Registry

**Package**: `@openrouter-crew/agent-memory`

**Publication Details**:
- Access: public
- Scope: @openrouter-crew
- Registry: https://registry.npmjs.org

**Installation**:
```bash
npm install @openrouter-crew/agent-memory
pnpm add @openrouter-crew/agent-memory
yarn add @openrouter-crew/agent-memory
```

**Verification**:
```bash
npm view @openrouter-crew/agent-memory
npm info @openrouter-crew/agent-memory@latest
```

**Published Files**:
- `dist/index.js` - Main entry point
- `dist/index.d.ts` - Type definitions
- `dist/**/*.js` - All compiled modules
- `package.json` - Package metadata
- `README.md` - Documentation

### 2. 📚 Documentation Site

**Included Documentation**:
- README.md - Overview and features
- QUICKSTART.md - 5-minute getting started
- DESIGN_SYSTEM.md - Design tokens and components
- UNIFIED_DESIGN.md - Implementation guide
- CHANGELOG.md - Version history

**Build Output**:
- Generated `index.html` - Documentation portal
- All markdown files - Source documentation
- Responsive design with Markdown parsing

**Deployment Options**:
- GitHub Pages (automatic if enabled)
- AWS S3 + CloudFront
- Vercel
- Netlify
- Custom hosting

**Access**:
```
https://docs.memory-system.openrouter-crew.dev
```

### 3. 🎨 Preview Dashboard

**Files Deployed**:
- `dashboard.html` - Standalone dashboard (index.html)
- `dashboard.css` - Unified styles
- `design-system.js` - Design tokens
- `info.json` - Deployment metadata

**Features**:
- Zero-dependency dashboard
- Real-time memory visualization
- Layer-based memory inspection
- Search/retrieval testing
- Responsive design

**Deployment Options**:
- AWS S3 + CloudFront
- GitHub Pages
- Vercel
- Netlify
- Simple static hosting

**Access**:
```
https://dashboard-preview.memory-system.openrouter-crew.dev
```

## Local Publishing (scripts/publish.sh)

### Prerequisites

```bash
# Install dependencies
pnpm install

# Ensure permissions
chmod +x scripts/publish.sh

# Set environment variables (optional)
export NPM_TOKEN="your-npm-token"
```

### Script Stages

1. **Validate Environment** - Check tools are installed
2. **Build Package** - Compile TypeScript and generate types
3. **Version Management** - Update version and changelog
4. **Publish to npm** - Upload to registry (if not preview)
5. **Deploy Documentation** - Prepare docs site
6. **Deploy Preview** - Prepare dashboard preview

### Output

The script creates:
- Updated `package.json` with new version
- Updated `CHANGELOG.md` with entry
- `/tmp/memory-docs-<timestamp>/` - Documentation files
- `/tmp/memory-preview-<timestamp>/` - Dashboard files

### Example Output

```
=== Memory System Multi-Platform Publisher ===

[1/6] Validating environment...
✓ Environment validated

[2/6] Building package...
✓ Package built successfully

[3/6] Managing version (patch)...
✓ Version updated: 1.0.0 → 1.0.1

[4/6] Publishing to npm registry...
✓ Published to npm: @openrouter-crew/agent-memory@1.0.1

[5/6] Deploying documentation...
✓ Documentation prepared

[6/6] Deploying preview dashboard...
✓ Preview dashboard prepared

=== Publication Summary ===

📦 Package Information
  Name:    @openrouter-crew/agent-memory
  Version: 1.0.1
  Type:    patch

📚 Deployment Targets
  ✓ npm Registry
    URL: https://www.npmjs.com/package/@openrouter-crew/agent-memory
  ✓ Documentation Site
    Location: /tmp/memory-docs-20250301_123456
  ✓ Preview Dashboard
    Location: /tmp/memory-preview-20250301_123456

✓ Publication process completed!
```

## GitHub Actions Workflow

### Workflow File

Location: `.github/workflows/publish-memory-system.yml`

### Trigger Methods

1. **Manual Trigger** (Workflow Dispatch)
   - Go to GitHub Actions
   - Select workflow
   - Click "Run workflow"
   - Choose version type

2. **Automatic Trigger** (On Push)
   - Trigger: Push to `main` branch
   - Scope: Changes in `domains/shared/agent-memory/**`
   - Runs: build, deploy-docs, deploy-preview
   - Skips: publish-npm (requires manual dispatch)

### Workflow Jobs

```
build
  ├─ Checkout code
  ├─ Setup Node.js
  ├─ Install dependencies
  ├─ Build package
  ├─ Type check
  └─ Upload artifacts

publish-npm (if workflow_dispatch)
  ├─ Download artifacts
  ├─ Update version
  ├─ Publish to npm
  ├─ Create GitHub Release
  └─ Generate release notes

deploy-docs
  ├─ Build documentation site
  ├─ Generate index.html
  └─ Upload artifacts

deploy-preview
  ├─ Prepare dashboard files
  ├─ Create deployment info
  ├─ Upload artifacts
  └─ Deploy to server (optional)

summary
  └─ Report publication status
```

### Artifacts Created

Each workflow run creates artifacts:

```
📦 dist/
   ├─ index.js
   ├─ index.d.ts
   ├─ *.js (all modules)
   └─ *.d.ts (all types)

📚 docs/
   ├─ index.html
   ├─ README.md
   ├─ QUICKSTART.md
   ├─ DESIGN_SYSTEM.md
   ├─ UNIFIED_DESIGN.md
   └─ CHANGELOG.md

🎨 preview-dashboard/
   ├─ index.html
   ├─ dashboard.css
   ├─ design-system.js
   └─ info.json
```

### Accessing Artifacts

1. Go to **Actions** → **workflow run**
2. Scroll to **Artifacts** section
3. Download desired artifact (zip format)
4. Unzip and deploy manually

### GitHub Release

Automatically created for publish-npm job:

```
Release Name: @openrouter-crew/agent-memory v1.0.1
Tag: memory-system-v1.0.1

Includes:
- Full dist/ folder as artifacts
- Installation instructions
- Documentation links
- Change summary
```

## Environment Configuration

### Local Environment Variables

```bash
# npm Publishing
export NPM_TOKEN="your-npm-token"

# AWS Deployment (optional)
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-1"

# GitHub Actions Secrets
# Set in: Settings → Secrets and variables → Actions
```

### GitHub Actions Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Create secrets:
   - `NPM_TOKEN` - npm authentication token
   - `AWS_ACCESS_KEY_ID` - AWS access key (optional)
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional)

### GitHub Actions Variables

1. Go to **Settings** → **Secrets and variables** → **Variables**
2. Create variables:
   - `ENABLE_GITHUB_PAGES` - Set to `true` to deploy docs
   - `PREVIEW_DEPLOY_ENABLED` - Set to `true` for dashboard deploy

## Publishing Checklist

### Before Publishing

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] README is up to date
- [ ] QUICKSTART works (tested locally)
- [ ] DESIGN_SYSTEM is accurate
- [ ] CHANGELOG entry ready
- [ ] No breaking changes (if patch/minor)
- [ ] Code reviewed and approved

### Local Testing

```bash
# Test build
pnpm --filter @openrouter-crew/agent-memory build

# Test types
pnpm --filter @openrouter-crew/agent-memory type-check

# Test preview release
./scripts/publish.sh preview

# Verify output
ls /tmp/memory-docs-*/
ls /tmp/memory-preview-*/
```

### After Publishing

- [ ] Verify npm package
  ```bash
  npm view @openrouter-crew/agent-memory@latest
  ```

- [ ] Check documentation loads
  ```bash
  open https://memory-docs.openrouter-crew.dev
  ```

- [ ] Test preview dashboard
  ```bash
  open dashboard-preview.html
  ```

- [ ] Update dependency
  ```bash
  npm update @openrouter-crew/agent-memory
  ```

- [ ] Announce release
  - GitHub Discussion
  - Team Slack
  - Release notes

## Troubleshooting

### npm Publish Failed

```bash
# Check token
npm whoami

# Verify permissions
npm access ls-packages

# Try publish with verbose output
npm publish --verbose
```

### GitHub Actions Failure

1. Check logs in **Actions** tab
2. Common issues:
   - Missing npm token secret
   - Build failed (check "build" job)
   - Missing artifact (check "download artifact" step)

### Documentation Build Issues

```bash
# Test locally
cd domains/shared/agent-memory

# Try generating docs manually
mkdir -p /tmp/test-docs
cp README.md QUICKSTART.md DESIGN_SYSTEM.md UNIFIED_DESIGN.md /tmp/test-docs/
```

### Preview Dashboard Not Loading

```bash
# Test locally
cp src/dashboard.html src/dashboard.css /tmp/preview/
open /tmp/preview/dashboard.html
```

## Rollback Procedure

### Unpublish from npm

```bash
# Only works within 72 hours of publish
npm unpublish @openrouter-crew/agent-memory@VERSION --force

# Remove specific version
npm unpublish @openrouter-crew/agent-memory@1.0.1 --force
```

### Revert Code

```bash
# Revert last commit
git revert HEAD

# Or reset to previous version
git checkout <commit-hash> -- domains/shared/agent-memory/
git commit -m "Revert to version X.X.X"
```

## Best Practices

1. **Always Preview First**
   ```bash
   ./scripts/publish.sh preview
   ```

2. **Test with npm Pack**
   ```bash
   cd domains/shared/agent-memory
   npm pack
   npm install ./agent-memory-1.0.0.tgz
   ```

3. **Use Semantic Versioning**
   - `MAJOR.MINOR.PATCH`
   - Major: Breaking changes
   - Minor: New features (backward compatible)
   - Patch: Bug fixes

4. **Keep Changelog Updated**
   - Entry per version
   - Group by: Added, Changed, Deprecated, Removed, Fixed

5. **Test Documentation**
   - All links work
   - Code examples execute
   - Screenshots up to date

6. **Monitor npm Package**
   - Weekly downloads
   - Dependency issues
   - Security vulnerabilities

## Integration Examples

### GitHub Actions + Auto-Deployment

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v20
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    scope: ${{ secrets.VERCEL_ORG_ID }}
```

### GitLab CI

```yaml
publish-memory:
  script:
    - cd domains/shared/agent-memory
    - ./scripts/publish.sh $VERSION_TYPE
  variables:
    NPM_TOKEN: $NPM_REGISTRY_TOKEN
```

### Jenkins

```groovy
stage('Publish Memory System') {
  steps {
    sh 'cd domains/shared/agent-memory && ./scripts/publish.sh patch'
    step([$class: 'PublishHTML', ...])
  }
}
```

## Support & Questions

For issues or questions:
1. Check **Troubleshooting** section
2. Review GitHub Actions logs
3. Test locally with `./scripts/publish.sh preview`
4. Contact development team

---

**Last Updated**: March 1, 2026
**Package**: @openrouter-crew/agent-memory
**Version**: 1.0.0+

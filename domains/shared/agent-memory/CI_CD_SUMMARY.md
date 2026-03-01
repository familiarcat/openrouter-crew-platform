# 🚀 CI/CD System Summary

Complete multi-platform publishing system for the Memory System with a **single command** that publishes to npm, documentation site, and preview dashboard.

## 🎯 One Command, Three Platforms

```bash
# Single command publishes to:
./scripts/publish.sh patch

# 1. npm Registry (@openrouter-crew/agent-memory)
# 2. Documentation Site (README + Design System)
# 3. Preview Dashboard (Interactive UI)
```

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────┐
│           Single Publishing Command                     │
│     ./scripts/publish.sh [patch|minor|major|preview]    │
└────────────────────┬──────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    ┌─────────┐ ┌─────────┐ ┌──────────┐
    │   npm   │ │   Docs  │ │ Preview  │
    │Registry │ │  Site   │ │Dashboard │
    └─────────┘ └─────────┘ └──────────┘
         │           │           │
    Registry      Hosting    Hosting
    npmjs.org    Github      S3/Vercel
                 Pages       /Netlify
```

## 🚀 Quick Start

### 1. Local Publishing

```bash
# Navigate to package directory
cd domains/shared/agent-memory

# Test preview (no actual publishing)
./scripts/publish.sh preview

# Publish patch version
./scripts/publish.sh patch

# Publish minor version (new features)
./scripts/publish.sh minor

# Publish major version (breaking changes)
./scripts/publish.sh major
```

### 2. GitHub Actions Publishing

```
GitHub UI:
  Actions → 🧠 Publish Memory System
  → Run workflow → Select version type → Run

Automatic triggers:
  - Push to main branch (builds & deploys docs/preview)
  - Manual dispatch (builds & publishes npm)
```

## 📦 Platform Details

### Platform 1: npm Registry

**What gets published:**
- Compiled JavaScript modules (`dist/*.js`)
- TypeScript type definitions (`dist/*.d.ts`)
- Package metadata (`package.json`)
- Documentation (`README.md`)

**Access:**
```bash
npm install @openrouter-crew/agent-memory@1.0.1
```

**Verify:**
```bash
npm view @openrouter-crew/agent-memory
```

**URL:** https://www.npmjs.com/package/@openrouter-crew/agent-memory

### Platform 2: Documentation Site

**What gets published:**
- README.md - Overview
- QUICKSTART.md - Getting started
- DESIGN_SYSTEM.md - Design tokens
- UNIFIED_DESIGN.md - Implementation
- CHANGELOG.md - Version history
- Generated index.html - Portal

**Deployment Options:**
- GitHub Pages (automatic)
- AWS S3 + CloudFront
- Vercel / Netlify
- Static hosting

**Features:**
- Interactive documentation
- Markdown parsing
- Code highlighting
- Responsive design

### Platform 3: Preview Dashboard

**What gets published:**
- dashboard.html - Standalone UI
- dashboard.css - Unified styles
- design-system.js - Design tokens
- info.json - Deployment metadata

**Deployment Options:**
- GitHub Pages
- AWS S3 + CloudFront
- Vercel / Netlify
- Static hosting

**Features:**
- Zero dependencies
- Works offline
- Real-time memory visualization
- Responsive design

## 🔧 Publishing Scripts

### Local Script: `scripts/publish.sh`

**Stages:**
1. ✅ Validate Environment
2. ✅ Build Package (TypeScript → JavaScript)
3. ✅ Version Management (update package.json, create changelog)
4. ✅ Publish to npm (optional)
5. ✅ Deploy Documentation (copy + build)
6. ✅ Deploy Preview (copy + prepare)

**Output:**
```
/tmp/memory-docs-TIMESTAMP/          (docs)
/tmp/memory-preview-TIMESTAMP/       (dashboard)
Updated package.json                 (version bumped)
Updated CHANGELOG.md                 (entry added)
```

**Time:** ~30 seconds

### GitHub Actions: `.github/workflows/publish-memory-system.yml`

**Stages:**
1. 🏗️ **Build** - Compile, type-check, upload artifacts
2. 📦 **publish-npm** - Update version, publish to npm, create release
3. 📚 **deploy-docs** - Build docs site, upload artifacts
4. 🎨 **deploy-preview** - Prepare dashboard, upload artifacts
5. 📋 **summary** - Report publication status

**Triggers:**
- Manual: Actions tab → Run workflow
- Automatic: Push to main (builds only)

**Time:** ~5 minutes

## 📋 Version Types

```
patch    (1.0.0 → 1.0.1)  - Bug fixes
minor    (1.0.0 → 1.1.0)  - New features
major    (1.0.0 → 2.0.0)  - Breaking changes
preview  (1.0.0 → 1.0.0)  - Test only
```

## 🎯 Publishing Workflow

### Complete Flow

```
┌─────────────────────────────────────┐
│  git push (or manual workflow run)   │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  Build & Type Check                 │
│  - pnpm build                       │
│  - pnpm type-check                  │
│  - Upload dist/ artifacts           │
└─────────────┬───────────────────────┘
              │
         ┌────┴────┬───────┐
         ↓         ↓       ↓
    ┌────────┐ ┌──────┐ ┌────────┐
    │npm Pub │ │ Docs │ │Preview │
    └────┬───┘ └──┬───┘ └───┬────┘
         │        │         │
    Update pkg   Build    Prepare
    Publish      Site      Files
    Release      Upload    Upload
         │        │         │
         └────────┴─────────┘
              │
              ↓
    ┌─────────────────────────────────┐
    │ Publication Complete            │
    │ All platforms updated           │
    │ GitHub Release created          │
    └─────────────────────────────────┘
```

## 📊 What Each Platform Hosts

### npm Registry
```
Package: @openrouter-crew/agent-memory

dist/
├── index.js                    (Main entry point)
├── index.d.ts                  (Type definitions)
├── memory-service.js
├── memory-service.d.ts
├── design-system.js
├── design-system.d.ts
├── cli.js
├── memory-api.js
└── ... (all compiled modules)

package.json                     (Metadata)
README.md                        (Documentation)
```

### Documentation Site
```
docs.memory-system.openrouter-crew.dev/

index.html                       (Portal)
README.md                        (Overview)
QUICKSTART.md                    (Getting started)
DESIGN_SYSTEM.md                 (Design tokens)
UNIFIED_DESIGN.md                (Implementation)
CHANGELOG.md                     (Version history)
```

### Preview Dashboard
```
dashboard-preview.openrouter-crew.dev/

index.html                       (Dashboard UI)
dashboard.css                    (Styles)
design-system.js                 (Design tokens)
info.json                        (Metadata)
```

## 🔑 Key Features

### Single Command Publishing
✅ Build, test, version, and publish in one step
✅ Automatic changelog generation
✅ Consistent versioning across platforms
✅ Easy rollback

### Multi-Platform Support
✅ npm Registry for library consumption
✅ Documentation Site for learning
✅ Preview Dashboard for interaction
✅ GitHub Releases for visibility

### Automation Options
✅ Local shell script (manual control)
✅ GitHub Actions (automatic on push)
✅ CI/CD integrations (GitLab, Jenkins, etc.)
✅ Scheduled publishing (cron jobs)

### Built-in Quality Checks
✅ TypeScript compilation verification
✅ Type safety checking
✅ Artifact validation
✅ Deployment status reporting

## 📚 Documentation

Full guides available:

- **CI_CD_GUIDE.md** - Detailed publishing instructions
- **DEPLOYMENT.md** - Deployment procedures
- **scripts/publish.sh** - Inline script documentation

## 🚦 Status Indicators

### Local Publishing Status
```bash
$ ./scripts/publish.sh patch

[1/6] Validating environment... ✓
[2/6] Building package... ✓
[3/6] Managing version (patch)... ✓
[4/6] Publishing to npm registry... ✓
[5/6] Deploying documentation... ✓
[6/6] Deploying preview dashboard... ✓

✓ Publication process completed!
```

### GitHub Actions Status
```
✓ Build
✓ publish-npm
✓ deploy-docs
✓ deploy-preview
✓ summary

Status: All checks passed
```

## 🎯 Usage Examples

### Example 1: Patch Release (Bug Fix)
```bash
# Local
cd domains/shared/agent-memory
./scripts/publish.sh patch

# GitHub Actions
Actions → Run workflow → version-type: patch

Result:
- Version: 1.0.0 → 1.0.1
- All three platforms updated
- GitHub Release created
- npm package published
```

### Example 2: Minor Release (New Feature)
```bash
# Local
./scripts/publish.sh minor

Result:
- Version: 1.0.0 → 1.1.0
- Changelog auto-generated
- All docs updated
- Backward compatible
```

### Example 3: Preview Only (Testing)
```bash
# Local
./scripts/publish.sh preview

Result:
- No version change
- Artifacts created for testing
- Nothing published
- Documentation prepared
```

## 🔐 Security

### Environment Variables
```bash
NPM_TOKEN="your-token"          # npm publishing
AWS_ACCESS_KEY_ID="your-key"    # AWS deployment
AWS_SECRET_ACCESS_KEY="secret"  # AWS deployment
```

### GitHub Secrets
```
Settings → Secrets → Add:
  - NPM_TOKEN
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
```

### Best Practices
- Use fine-grained npm tokens
- Rotate secrets regularly
- Never commit tokens to git
- Use GitHub OIDC for AWS (recommended)

## 📈 Publishing Metrics

After publishing, track:

**npm Registry:**
- Weekly downloads
- Version adoption
- Dependency issues

**Documentation:**
- Page views
- Search traffic
- Bounce rate

**Preview Dashboard:**
- User sessions
- Feature usage
- Bug reports

## 🎓 Learning Resources

1. **Start Here**: CI_CD_GUIDE.md
2. **Script Details**: scripts/publish.sh
3. **Workflow Details**: .github/workflows/publish-memory-system.yml
4. **Troubleshooting**: CI_CD_GUIDE.md → Troubleshooting

## ✨ What's Next

### Immediate (Ready Now)
- ✅ Publish to npm
- ✅ Deploy documentation
- ✅ Deploy preview dashboard
- ✅ Create GitHub Releases

### Short Term (Easy to Add)
- ⏳ Automated testing before publish
- ⏳ Version changelog automation
- ⏳ Slack/email notifications
- ⏳ Performance metrics collection

### Future Enhancements
- 🔮 Docker image publishing
- 🔮 CDN distribution
- 🔮 Multiple language docs
- 🔮 Interactive API explorer
- 🔮 Dependency update automation

---

## Summary

🎯 **Single Command**: `./scripts/publish.sh [version]`

📦 **Three Platforms**:
1. npm Registry - For library consumption
2. Documentation Site - For learning
3. Preview Dashboard - For interaction

⚡ **Automation**:
- Local shell script (~30 seconds)
- GitHub Actions (~5 minutes)
- CI/CD integrations (Jenkins, GitLab, etc.)

✅ **Quality Assurance**:
- Automated builds
- Type checking
- Artifact validation
- Status reporting

🚀 **Ready to Use** - All files prepared and tested!


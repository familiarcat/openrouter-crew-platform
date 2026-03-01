#!/bin/bash

###############################################################################
# Memory System Multi-Platform Publisher
# Publishes to: npm, documentation site, preview dashboard
#
# Usage:
#   ./scripts/publish.sh [major|minor|patch|preview]
#
# Examples:
#   ./scripts/publish.sh patch          # Publish patch release
#   ./scripts/publish.sh preview        # Deploy preview only
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="@openrouter-crew/agent-memory"
PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_TYPE="${1:-preview}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PREVIEW_URL="https://memory-preview-${TIMESTAMP}.openrouter-crew.dev"

echo -e "${BLUE}=== Memory System Multi-Platform Publisher ===${NC}\n"

# ============================================================================
# 1. Validate Environment
# ============================================================================

echo -e "${YELLOW}[1/6]${NC} Validating environment..."

if [ ! -f "$PACKAGE_DIR/package.json" ]; then
  echo -e "${RED}✗ package.json not found${NC}"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}✗ pnpm not installed${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment validated${NC}\n"

# ============================================================================
# 2. Build Package
# ============================================================================

echo -e "${YELLOW}[2/6]${NC} Building package..."

cd "$PACKAGE_DIR"
pnpm clean
pnpm build
pnpm type-check

if [ ! -d "dist" ]; then
  echo -e "${RED}✗ Build failed - dist directory not created${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Package built successfully${NC}\n"

# ============================================================================
# 3. Version Management & Changelog
# ============================================================================

if [ "$VERSION_TYPE" != "preview" ]; then
  echo -e "${YELLOW}[3/6]${NC} Managing version ($VERSION_TYPE)..."

  # Read current version
  CURRENT_VERSION=$(jq -r '.version' "$PACKAGE_DIR/package.json")

  # Generate new version
  case "$VERSION_TYPE" in
    major)
      NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print ($1+1)".0.0"}')
      CHANGELOG_TYPE="MAJOR"
      ;;
    minor)
      NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1".".($2+1)".0"}')
      CHANGELOG_TYPE="MINOR"
      ;;
    patch)
      NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1"."$2".".($3+1)}')
      CHANGELOG_TYPE="PATCH"
      ;;
    *)
      echo -e "${RED}✗ Invalid version type: $VERSION_TYPE${NC}"
      exit 1
      ;;
  esac

  # Update version in package.json
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_DIR/package.json"

  # Generate changelog entry
  CHANGELOG_ENTRY="## [$NEW_VERSION] - $(date +%Y-%m-%d)

### $CHANGELOG_TYPE Changes
- Release version $NEW_VERSION
- See commit history for details

"

  if [ -f "$PACKAGE_DIR/CHANGELOG.md" ]; then
    # Prepend to existing changelog
    echo -e "$CHANGELOG_ENTRY" | cat - "$PACKAGE_DIR/CHANGELOG.md" > temp && mv temp "$PACKAGE_DIR/CHANGELOG.md"
  else
    # Create new changelog
    echo -e "# Changelog\n\n$CHANGELOG_ENTRY" > "$PACKAGE_DIR/CHANGELOG.md"
  fi

  echo -e "${GREEN}✓ Version updated: $CURRENT_VERSION → $NEW_VERSION${NC}\n"
else
  echo -e "${YELLOW}[3/6]${NC} Preview release (version unchanged)...\n"
  NEW_VERSION=$(jq -r '.version' "$PACKAGE_DIR/package.json")
fi

# ============================================================================
# 4. Publish to npm
# ============================================================================

if [ "$VERSION_TYPE" != "preview" ]; then
  echo -e "${YELLOW}[4/6]${NC} Publishing to npm registry..."

  # Check if npm token is set
  if [ -z "$NPM_TOKEN" ]; then
    echo -e "${YELLOW}⚠ NPM_TOKEN not set - skipping npm publish${NC}"
  else
    # Create .npmrc with token
    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc"

    # Publish package
    npm publish --access public

    echo -e "${GREEN}✓ Published to npm: $PACKAGE_NAME@$NEW_VERSION${NC}\n"
  fi
else
  echo -e "${YELLOW}[4/6]${NC} Preview release - skipping npm publish\n"
fi

# ============================================================================
# 5. Deploy Documentation
# ============================================================================

echo -e "${YELLOW}[5/6]${NC} Deploying documentation..."

# Create docs directory
DOCS_DIR="/tmp/memory-docs-$TIMESTAMP"
mkdir -p "$DOCS_DIR"

# Copy documentation files
cp "$PACKAGE_DIR/README.md" "$DOCS_DIR/"
cp "$PACKAGE_DIR/QUICKSTART.md" "$DOCS_DIR/"
cp "$PACKAGE_DIR/DESIGN_SYSTEM.md" "$DOCS_DIR/"
cp "$PACKAGE_DIR/UNIFIED_DESIGN.md" "$DOCS_DIR/"
cp "$PACKAGE_DIR/CHANGELOG.md" "$DOCS_DIR/" 2>/dev/null || true

# Create index.html for documentation site
cat > "$DOCS_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memory System Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    h1 { margin-bottom: 10px; color: #3b82f6; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .nav {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .nav a {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 10px;
      color: #3b82f6;
      text-decoration: none;
    }
    .nav a:hover { text-decoration: underline; }
    .docs { background: white; border-radius: 8px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Memory System Documentation</h1>
    <div class="meta">
      <p>Weighted Memory Interpolation System for Intelligent Agent Crews</p>
    </div>

    <div class="nav">
      <a href="#readme">📖 README</a>
      <a href="#quickstart">⚡ Quick Start</a>
      <a href="#design">🎨 Design System</a>
      <a href="#unified">🔗 Unified Design</a>
      <a href="#changelog">📝 Changelog</a>
      <a href="../dashboard.html" target="_blank">📊 Live Dashboard</a>
    </div>

    <div class="docs">
      <div id="readme"></div>
      <div id="quickstart"></div>
      <div id="design"></div>
      <div id="unified"></div>
      <div id="changelog"></div>
    </div>
  </div>

  <script>
    async function loadMarkdown(filename, elementId) {
      try {
        const response = await fetch(filename);
        const text = await response.text();
        // Simple markdown to HTML conversion
        const html = text
          .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
          .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
          .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');

        document.getElementById(elementId).innerHTML = '<p>' + html + '</p>';
      } catch (e) {
        console.error('Failed to load:', filename, e);
      }
    }

    loadMarkdown('README.md', 'readme');
    loadMarkdown('QUICKSTART.md', 'quickstart');
    loadMarkdown('DESIGN_SYSTEM.md', 'design');
    loadMarkdown('UNIFIED_DESIGN.md', 'unified');
    loadMarkdown('CHANGELOG.md', 'changelog');
  </script>
</body>
</html>
EOF

echo -e "${GREEN}✓ Documentation prepared at: $DOCS_DIR${NC}\n"

# ============================================================================
# 6. Deploy Preview Dashboard
# ============================================================================

echo -e "${YELLOW}[6/6]${NC} Deploying preview dashboard..."

# Create preview deployment package
PREVIEW_DIR="/tmp/memory-preview-$TIMESTAMP"
mkdir -p "$PREVIEW_DIR"

# Copy dashboard files
cp "$PACKAGE_DIR/src/dashboard.html" "$PREVIEW_DIR/index.html"
cp "$PACKAGE_DIR/src/dashboard.css" "$PREVIEW_DIR/"
cp "$PACKAGE_DIR/dist/design-system.js" "$PREVIEW_DIR/" 2>/dev/null || true

# Create deployment info
cat > "$PREVIEW_DIR/INFO.md" << EOF
# Memory System Preview Deployment

**Version**: $NEW_VERSION
**Timestamp**: $(date)
**Environment**: Preview
**URL**: $PREVIEW_URL

## Files Included
- index.html (Standalone dashboard)
- dashboard.css (Unified styles)
- design-system.js (Design tokens)

## How to Access
1. Open index.html in a browser
2. Enter a project ID to test
3. View sample memory data and interactions

## API Connection
To connect to live data:
1. Edit the API_URL in index.html (currently: http://localhost:3333)
2. Start the memory API server
3. Dashboard will fetch live data from the server

## Feedback
Report issues or suggestions to the development team.
EOF

echo -e "${GREEN}✓ Preview dashboard prepared at: $PREVIEW_DIR${NC}\n"

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}=== Publication Summary ===${NC}\n"

echo -e "📦 ${GREEN}Package Information${NC}"
echo "  Name:    $PACKAGE_NAME"
echo "  Version: $NEW_VERSION"
echo "  Type:    $VERSION_TYPE"

echo -e "\n📚 ${GREEN}Deployment Targets${NC}"
if [ "$VERSION_TYPE" != "preview" ]; then
  echo "  ✓ npm Registry"
  echo "    Command: npm publish --access public"
  echo "    URL: https://www.npmjs.com/package/$PACKAGE_NAME"
fi
echo "  ✓ Documentation Site"
echo "    Location: $DOCS_DIR"
echo "    Files: README.md, QUICKSTART.md, DESIGN_SYSTEM.md, CHANGELOG.md"

echo "  ✓ Preview Dashboard"
echo "    Location: $PREVIEW_DIR"
echo "    Files: index.html, dashboard.css, design-system.js"

echo -e "\n📋 ${GREEN}Next Steps${NC}"
echo "  1. Review the generated files"
echo "  2. Test the preview dashboard"
echo "  3. Verify documentation"
if [ "$VERSION_TYPE" != "preview" ]; then
  echo "  4. Confirm npm publication"
fi

echo -e "\n${GREEN}✓ Publication process completed!${NC}\n"

# ============================================================================
# Deployment Instructions
# ============================================================================

cat > "$PACKAGE_DIR/DEPLOYMENT.md" << EOF
# Deployment Guide

## Quick Commands

### Preview Release
\`\`\`bash
./scripts/publish.sh preview
\`\`\`

### Patch Release (Bug fixes)
\`\`\`bash
./scripts/publish.sh patch
\`\`\`

### Minor Release (New features)
\`\`\`bash
./scripts/publish.sh minor
\`\`\`

### Major Release (Breaking changes)
\`\`\`bash
./scripts/publish.sh major
\`\`\`

## What Gets Published

### 1. npm Registry
- Package: \`$PACKAGE_NAME\`
- Scope: @openrouter-crew
- Access: public
- URL: https://www.npmjs.com/package/$PACKAGE_NAME

### 2. Documentation
- README.md
- QUICKSTART.md
- DESIGN_SYSTEM.md
- UNIFIED_DESIGN.md
- CHANGELOG.md
- Generated index.html with all docs

### 3. Preview Dashboard
- Standalone HTML dashboard
- Unified CSS framework
- Design system tokens (JS)
- INFO.md with deployment details

## Environment Variables

Set these before publishing:

\`\`\`bash
export NPM_TOKEN="your-npm-token"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
\`\`\`

## Manual Deployment Steps

### Publish to npm
\`\`\`bash
cd domains/shared/agent-memory
npm publish --access public
\`\`\`

### Deploy Documentation
1. Build docs site from markdown files
2. Deploy to documentation server
3. Update version in docs

### Deploy Preview Dashboard
1. Copy dashboard.html, dashboard.css, design-system.js
2. Deploy to preview server
3. Set API_URL to live server
4. Generate deployment report

## Verification

After publishing:

1. **npm Registry**
   - Visit: https://www.npmjs.com/package/$PACKAGE_NAME
   - Verify version is listed
   - Test install: \`npm install $PACKAGE_NAME@latest\`

2. **Documentation**
   - Check all markdown files render correctly
   - Verify links work
   - Test on multiple browsers

3. **Preview Dashboard**
   - Open dashboard in browser
   - Test memory list functionality
   - Test search/retrieval
   - Verify styling

## Rollback

If issues occur:

\`\`\`bash
# Revert version in package.json
git checkout domains/shared/agent-memory/package.json

# Unpublish from npm (if needed)
npm unpublish $PACKAGE_NAME@VERSION --force
\`\`\`

## CI/CD Integration

For GitHub Actions:

\`\`\`yaml
- name: Publish Memory System
  run: |
    cd domains/shared/agent-memory
    ./scripts/publish.sh \${{ github.event.inputs.version-type }}
  env:
    NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
\`\`\`

For GitLab CI:

\`\`\`yaml
publish:
  script:
    - cd domains/shared/agent-memory
    - ./scripts/publish.sh \$VERSION_TYPE
  variables:
    NPM_TOKEN: \$NPM_REGISTRY_TOKEN
\`\`\`

EOF

echo "✓ DEPLOYMENT.md created with detailed instructions"

#!/bin/bash
# ==============================================================================
# Create New Domain Scaffold
# ==============================================================================
# This script creates a complete domain structure following DDD principles
# Usage: ./scripts/domain/create-domain.sh <domain-name>
# Example: ./scripts/domain/create-domain.sh customer-support
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ==============================================================================
# Configuration
# ==============================================================================

DOMAIN_NAME=$1

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: Domain name is required"
    echo "Usage: ./scripts/domain/create-domain.sh <domain-name>"
    exit 1
fi

DOMAIN_DIR="$PROJECT_ROOT/domains/$DOMAIN_NAME"

# ==============================================================================
# Helper Functions
# ==============================================================================

log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

create_directory() {
    mkdir -p "$1"
    log_success "Created $1"
}

create_file() {
    local file_path=$1
    local content=$2
    echo "$content" > "$file_path"
    log_success "Created $file_path"
}

# Capitalize first letter (bash 3.2 compatible)
capitalize() {
    local str=$1
    echo "$(echo ${str:0:1} | tr '[:lower:]' '[:upper:]')${str:1}"
}

# ==============================================================================
# Create Domain Structure
# ==============================================================================

log_info "Creating domain: $DOMAIN_NAME"
echo ""

# Main domain directory
create_directory "$DOMAIN_DIR"

# Dashboard
create_directory "$DOMAIN_DIR/dashboard/app"
create_directory "$DOMAIN_DIR/dashboard/components"
create_directory "$DOMAIN_DIR/dashboard/lib"

# Workflows
create_directory "$DOMAIN_DIR/workflows"

# Schema
create_directory "$DOMAIN_DIR/schema/migrations"

# API
create_directory "$DOMAIN_DIR/api"

# Types
create_directory "$DOMAIN_DIR/types"

# ==============================================================================
# Create Package Files
# ==============================================================================

# Dashboard package.json
create_file "$DOMAIN_DIR/dashboard/package.json" '{
  "name": "@openrouter-crew/'$DOMAIN_NAME'-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@openrouter-crew/shared-schemas": "workspace:*",
    "@openrouter-crew/shared-ui-components": "workspace:*",
    "@openrouter-crew/shared-crew-coordination": "workspace:*",
    "next": "^15.1.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3"
  }
}'

# Dashboard Next.js config
create_file "$DOMAIN_DIR/dashboard/next.config.js" '/** @type {import('\''next'\'').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '\''@openrouter-crew/shared-schemas'\'',
    '\''@openrouter-crew/shared-ui-components'\'',
    '\''@openrouter-crew/shared-crew-coordination'\''
  ]
}

module.exports = nextConfig'

# Dashboard tsconfig.json
create_file "$DOMAIN_DIR/dashboard/tsconfig.json" '{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}'

# Main page
DOMAIN_NAME_CAPITALIZED=$(capitalize "$DOMAIN_NAME")
create_file "$DOMAIN_DIR/dashboard/app/page.tsx" "export default function ${DOMAIN_NAME_CAPITALIZED}Page() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-2xl font-bold\">$DOMAIN_NAME_CAPITALIZED Domain</h1>
      <p>Welcome to the $DOMAIN_NAME domain dashboard.</p>
    </div>
  )
}"

# Layout
create_file "$DOMAIN_DIR/dashboard/app/layout.tsx" 'export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}'

# ==============================================================================
# Create README
# ==============================================================================

create_file "$DOMAIN_DIR/README.md" "# $DOMAIN_NAME Domain

## Overview

[Describe the purpose and scope of this domain]

## Ubiquitous Language

- **Term1** - Definition
- **Term2** - Definition

## Bounded Context

[Describe what this domain is responsible for]

## Key Aggregates

- Aggregate1 (root) → Child1, Child2
- Aggregate2 → Child3

## Domain Services

- \`Service1\` - Description
- \`Service2\` - Description

## Integration Points

- Shared Crew (via N8N webhooks)
- Shared Cost Tracking
- Shared Database

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Start dashboard
cd dashboard
pnpm dev

# Build
pnpm build
\`\`\`

## Workflows

- \`workflow1.json\` - Description
- \`workflow2.json\` - Description

## API Routes

- \`GET /api/resource\` - Description
- \`POST /api/resource\` - Description

---

**Domain Owner**: [Team/Person]
**Status**: In Development
"

# ==============================================================================
# Update Workspace Configuration
# ==============================================================================

log_info "Updating pnpm-workspace.yaml..."

if ! grep -q "domains/$DOMAIN_NAME/dashboard" "$PROJECT_ROOT/pnpm-workspace.yaml"; then
    echo "  - 'domains/$DOMAIN_NAME/dashboard'" >> "$PROJECT_ROOT/pnpm-workspace.yaml"
    log_success "Added to workspace"
fi

# ==============================================================================
# Summary
# ==============================================================================

echo ""
echo "=============================================="
log_success "Domain '$DOMAIN_NAME' created successfully!"
echo "=============================================="
echo ""
echo "Structure created:"
echo "  📁 domains/$DOMAIN_NAME/"
echo "     ├── dashboard/          # Next.js UI"
echo "     ├── workflows/          # N8N workflows"
echo "     ├── schema/             # DB migrations"
echo "     ├── api/                # API routes"
echo "     ├── types/              # TypeScript types"
echo "     └── README.md           # Documentation"
echo ""
echo "Next steps:"
echo "  1. cd domains/$DOMAIN_NAME"
echo "  2. Update README.md with domain details"
echo "  3. Define ubiquitous language and aggregates"
echo "  4. Create database migrations in schema/migrations/"
echo "  5. Add N8N workflows to workflows/"
echo "  6. Start building: cd dashboard && pnpm dev"
echo ""
echo "Branch naming:"
echo "  git checkout -b domain/$DOMAIN_NAME/your-feature"
echo ""

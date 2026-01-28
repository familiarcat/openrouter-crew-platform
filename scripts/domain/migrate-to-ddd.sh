#!/bin/bash
# ==============================================================================
# Migrate to DDD Architecture
# ==============================================================================
# This script migrates the existing monorepo structure to a DDD-based structure
# Usage: ./scripts/domain/migrate-to-ddd.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ==============================================================================
# Helper Functions
# ==============================================================================

log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
}

# ==============================================================================
# Step 1: Create domains/shared/ structure
# ==============================================================================

log_info "Creating domains/shared/ structure..."

mkdir -p "$PROJECT_ROOT/domains/shared"

# Create shared domain subdirectories
mkdir -p "$PROJECT_ROOT/domains/shared/crew-coordination"
mkdir -p "$PROJECT_ROOT/domains/shared/cost-tracking"
mkdir -p "$PROJECT_ROOT/domains/shared/schemas"
mkdir -p "$PROJECT_ROOT/domains/shared/workflows"
mkdir -p "$PROJECT_ROOT/domains/shared/ui-components"
mkdir -p "$PROJECT_ROOT/domains/shared/openrouter-client"

log_success "Created domains/shared/ structure"

# ==============================================================================
# Step 2: Move existing packages to domains/shared/
# ==============================================================================

log_info "Migrating existing packages to domains/shared/..."

# Move crew-core → crew-coordination
if [ -d "$PROJECT_ROOT/packages/crew-core" ]; then
    log_info "Moving packages/crew-core → domains/shared/crew-coordination..."
    cp -r "$PROJECT_ROOT/packages/crew-core/"* "$PROJECT_ROOT/domains/shared/crew-coordination/"
    log_success "Moved crew-core"
fi

# Move cost-tracking
if [ -d "$PROJECT_ROOT/packages/cost-tracking" ]; then
    log_info "Moving packages/cost-tracking → domains/shared/cost-tracking..."
    cp -r "$PROJECT_ROOT/packages/cost-tracking/"* "$PROJECT_ROOT/domains/shared/cost-tracking/"
    log_success "Moved cost-tracking"
fi

# Move shared-schemas → schemas
if [ -d "$PROJECT_ROOT/packages/shared-schemas" ]; then
    log_info "Moving packages/shared-schemas → domains/shared/schemas..."
    cp -r "$PROJECT_ROOT/packages/shared-schemas/"* "$PROJECT_ROOT/domains/shared/schemas/"
    log_success "Moved shared-schemas"
fi

# Move n8n-workflows → workflows
if [ -d "$PROJECT_ROOT/packages/n8n-workflows" ]; then
    log_info "Moving packages/n8n-workflows → domains/shared/workflows..."
    cp -r "$PROJECT_ROOT/packages/n8n-workflows/"* "$PROJECT_ROOT/domains/shared/workflows/"
    log_success "Moved n8n-workflows"
fi

# ==============================================================================
# Step 3: Update package names in domains/shared/
# ==============================================================================

log_info "Updating package names in domains/shared/..."

# Update crew-coordination package.json
if [ -f "$PROJECT_ROOT/domains/shared/crew-coordination/package.json" ]; then
    sed -i.bak 's/"@openrouter-crew\/crew-core"/"@openrouter-crew\/shared-crew-coordination"/g' \
        "$PROJECT_ROOT/domains/shared/crew-coordination/package.json"
    rm "$PROJECT_ROOT/domains/shared/crew-coordination/package.json.bak"
    log_success "Updated crew-coordination package name"
fi

# Update schemas package.json
if [ -f "$PROJECT_ROOT/domains/shared/schemas/package.json" ]; then
    sed -i.bak 's/"@openrouter-crew\/shared-schemas"/"@openrouter-crew\/shared-schemas"/g' \
        "$PROJECT_ROOT/domains/shared/schemas/package.json"
    rm "$PROJECT_ROOT/domains/shared/schemas/package.json.bak"
    log_success "Updated schemas package name"
fi

# Update cost-tracking package.json
if [ -f "$PROJECT_ROOT/domains/shared/cost-tracking/package.json" ]; then
    sed -i.bak 's/"@openrouter-crew\/cost-tracking"/"@openrouter-crew\/shared-cost-tracking"/g' \
        "$PROJECT_ROOT/domains/shared/cost-tracking/package.json"
    rm "$PROJECT_ROOT/domains/shared/cost-tracking/package.json.bak"
    log_success "Updated cost-tracking package name"
fi

# Update workflows package.json
if [ -f "$PROJECT_ROOT/domains/shared/workflows/package.json" ]; then
    sed -i.bak 's/"@openrouter-crew\/n8n-workflows"/"@openrouter-crew\/shared-workflows"/g' \
        "$PROJECT_ROOT/domains/shared/workflows/package.json"
    rm "$PROJECT_ROOT/domains/shared/workflows/package.json.bak"
    log_success "Updated workflows package name"
fi

# ==============================================================================
# Step 4: Create domain skeletons
# ==============================================================================

log_info "Creating domain skeletons..."

# Create DJ-Booking domain
"$SCRIPT_DIR/create-domain.sh" dj-booking

# Create Product Factory domain
"$SCRIPT_DIR/create-domain.sh" product-factory

# Create Alex-AI-Universal domain
"$SCRIPT_DIR/create-domain.sh" alex-ai-universal

log_success "Created domain skeletons"

# ==============================================================================
# Step 5: Update pnpm-workspace.yaml
# ==============================================================================

log_info "Updating pnpm-workspace.yaml..."

cat > "$PROJECT_ROOT/pnpm-workspace.yaml" << 'EOF'
packages:
  # Unified Dashboard (Entry Point)
  - 'apps/*'

  # Shared Domain (Core Infrastructure)
  - 'domains/shared/crew-coordination'
  - 'domains/shared/cost-tracking'
  - 'domains/shared/schemas'
  - 'domains/shared/workflows'
  - 'domains/shared/ui-components'
  - 'domains/shared/openrouter-client'

  # DJ-Booking Domain
  - 'domains/dj-booking/dashboard'

  # Product Factory Domain
  - 'domains/product-factory/dashboard'

  # Alex-AI-Universal Domain
  - 'domains/alex-ai-universal/dashboard'
EOF

log_success "Updated pnpm-workspace.yaml"

# ==============================================================================
# Step 6: Update unified-dashboard dependencies
# ==============================================================================

log_info "Updating unified-dashboard dependencies..."

# Update imports in unified-dashboard to reference new package names
# This will be done manually as it requires careful refactoring

log_info "Note: You'll need to manually update imports in apps/unified-dashboard/"
log_info "  - @openrouter-crew/crew-core → @openrouter-crew/shared-crew-coordination"
log_info "  - @openrouter-crew/cost-tracking → @openrouter-crew/shared-cost-tracking"

# ==============================================================================
# Step 7: Clean up old packages (optional - manual confirmation needed)
# ==============================================================================

log_info "Old packages remain in packages/ directory"
log_info "To remove after verification: rm -rf packages/"

# ==============================================================================
# Summary
# ==============================================================================

echo ""
echo "=============================================="
log_success "DDD Architecture Migration Complete!"
echo "=============================================="
echo ""
echo "Directory structure:"
echo "  📁 domains/"
echo "     ├── shared/                  # Core infrastructure"
echo "     │   ├── crew-coordination/   # Crew orchestration"
echo "     │   ├── cost-tracking/       # Cost analysis"
echo "     │   ├── schemas/             # TypeScript types"
echo "     │   ├── workflows/           # N8N workflows"
echo "     │   ├── ui-components/       # Shared UI"
echo "     │   └── openrouter-client/   # LLM client"
echo "     ├── dj-booking/              # Event management domain"
echo "     ├── product-factory/         # Sprint planning domain"
echo "     └── alex-ai-universal/       # Universal platform domain"
echo ""
echo "Next steps:"
echo "  1. Update imports in apps/unified-dashboard/"
echo "  2. Run: pnpm install"
echo "  3. Run: pnpm build"
echo "  4. Test: pnpm dev"
echo "  5. After verification, remove old packages/: rm -rf packages/"
echo ""
echo "Git workflow:"
echo "  git checkout -b domain/dj-booking/your-feature"
echo "  git checkout -b domain/product-factory/your-feature"
echo "  git checkout -b domain/alex-ai-universal/your-feature"
echo ""

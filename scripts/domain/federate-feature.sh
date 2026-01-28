#!/bin/bash
# ==============================================================================
# Feature Federation Script
# ==============================================================================
# This script promotes features from domain → shared → global
# Usage: ./scripts/domain/federate-feature.sh <source-domain> <feature-path> <target>
# Example: ./scripts/domain/federate-feature.sh product-factory components/SprintPlanner.tsx shared
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ==============================================================================
# Configuration
# ==============================================================================

SOURCE_DOMAIN=$1
FEATURE_PATH=$2
TARGET=$3

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

log_warning() {
    echo "⚠️  $1"
}

show_usage() {
    echo "Usage: ./scripts/domain/federate-feature.sh <source-domain> <feature-path> <target>"
    echo ""
    echo "Arguments:"
    echo "  source-domain   Domain to promote from (dj-booking, product-factory, alex-ai-universal)"
    echo "  feature-path    Path to feature relative to domain directory"
    echo "  target          Target for promotion (shared, global)"
    echo ""
    echo "Examples:"
    echo "  # Promote component from Product Factory to Shared"
    echo "  ./scripts/domain/federate-feature.sh product-factory \\"
    echo "    dashboard/components/SprintPlanner.tsx shared"
    echo ""
    echo "  # Promote workflow from DJ-Booking to Shared"
    echo "  ./scripts/domain/federate-feature.sh dj-booking \\"
    echo "    workflows/venue-management.json shared"
    echo ""
    echo "  # Promote shared component to Global (unified dashboard)"
    echo "  ./scripts/domain/federate-feature.sh shared \\"
    echo "    ui-components/src/Button.tsx global"
    echo ""
}

# ==============================================================================
# Validation
# ==============================================================================

if [ -z "$SOURCE_DOMAIN" ] || [ -z "$FEATURE_PATH" ] || [ -z "$TARGET" ]; then
    log_error "Missing required arguments"
    show_usage
    exit 1
fi

# Validate source domain
if [ "$SOURCE_DOMAIN" != "dj-booking" ] && \
   [ "$SOURCE_DOMAIN" != "product-factory" ] && \
   [ "$SOURCE_DOMAIN" != "alex-ai-universal" ] && \
   [ "$SOURCE_DOMAIN" != "shared" ]; then
    log_error "Invalid source domain: $SOURCE_DOMAIN"
    show_usage
    exit 1
fi

# Validate target
if [ "$TARGET" != "shared" ] && [ "$TARGET" != "global" ]; then
    log_error "Invalid target: $TARGET (must be 'shared' or 'global')"
    show_usage
    exit 1
fi

# ==============================================================================
# Feature Federation
# ==============================================================================

federate_to_shared() {
    local source_path="$PROJECT_ROOT/domains/$SOURCE_DOMAIN/$FEATURE_PATH"
    local feature_name=$(basename "$FEATURE_PATH")
    local feature_dir=$(dirname "$FEATURE_PATH")

    if [ ! -f "$source_path" ] && [ ! -d "$source_path" ]; then
        log_error "Source feature not found: $source_path"
        exit 1
    fi

    log_info "Promoting $SOURCE_DOMAIN/$FEATURE_PATH to shared domain..."

    # Determine target location based on feature type
    local target_path=""

    if [[ "$feature_dir" == *"components"* ]]; then
        target_path="$PROJECT_ROOT/domains/shared/ui-components/src/$feature_name"
    elif [[ "$feature_dir" == *"workflows"* ]]; then
        target_path="$PROJECT_ROOT/domains/shared/workflows/$feature_name"
    elif [[ "$feature_dir" == *"lib"* ]] || [[ "$feature_dir" == *"utils"* ]]; then
        target_path="$PROJECT_ROOT/domains/shared/schemas/src/helpers/$feature_name"
    elif [[ "$feature_dir" == *"types"* ]]; then
        target_path="$PROJECT_ROOT/domains/shared/schemas/src/$feature_name"
    else
        log_warning "Could not auto-detect target location for $FEATURE_PATH"
        target_path="$PROJECT_ROOT/domains/shared/ui-components/src/$feature_name"
    fi

    # Create target directory
    mkdir -p "$(dirname "$target_path")"

    # Copy feature
    cp -r "$source_path" "$target_path"

    log_success "Feature promoted to: $target_path"
    log_info "Next steps:"
    echo "  1. Update shared package to export this feature"
    echo "  2. Build shared package: pnpm --filter @openrouter-crew/shared-* build"
    echo "  3. Use in other domains: import { $feature_name } from '@openrouter-crew/shared-*'"
}

federate_to_global() {
    local source_path="$PROJECT_ROOT/domains/$SOURCE_DOMAIN/$FEATURE_PATH"
    local feature_name=$(basename "$FEATURE_PATH")

    if [ ! -f "$source_path" ] && [ ! -d "$source_path" ]; then
        log_error "Source feature not found: $source_path"
        exit 1
    fi

    log_info "Promoting $SOURCE_DOMAIN/$FEATURE_PATH to global (unified dashboard)..."

    # Determine target location in unified dashboard
    local target_path=""

    if [[ "$FEATURE_PATH" == *"components"* ]]; then
        target_path="$PROJECT_ROOT/apps/unified-dashboard/components/$feature_name"
    elif [[ "$FEATURE_PATH" == *"lib"* ]] || [[ "$FEATURE_PATH" == *"utils"* ]]; then
        target_path="$PROJECT_ROOT/apps/unified-dashboard/lib/$feature_name"
    elif [[ "$FEATURE_PATH" == *"app"* ]]; then
        # Extract relative path from app directory
        local app_relative_path="${FEATURE_PATH#*/app/}"
        target_path="$PROJECT_ROOT/apps/unified-dashboard/app/$app_relative_path"
    else
        log_warning "Could not auto-detect target location for $FEATURE_PATH"
        target_path="$PROJECT_ROOT/apps/unified-dashboard/components/$feature_name"
    fi

    # Create target directory
    mkdir -p "$(dirname "$target_path")"

    # Copy feature
    cp -r "$source_path" "$target_path"

    log_success "Feature promoted to: $target_path"
    log_info "Next steps:"
    echo "  1. Update imports if needed"
    echo "  2. Build unified dashboard: pnpm --filter @openrouter-crew/unified-dashboard build"
    echo "  3. Test: pnpm --filter @openrouter-crew/unified-dashboard dev"
}

# ==============================================================================
# Generate Federation Report
# ==============================================================================

generate_federation_report() {
    local report_file="$PROJECT_ROOT/FEATURE_FEDERATION.md"

    if [ ! -f "$report_file" ]; then
        cat > "$report_file" << 'EOF'
# Feature Federation Log

This document tracks features that have been promoted from domains to shared or global scope.

## Federation History

| Date | Source | Feature | Target | Notes |
|------|--------|---------|--------|-------|
EOF
    fi

    # Append new entry
    local date=$(date +"%Y-%m-%d %H:%M")
    local feature_name=$(basename "$FEATURE_PATH")

    echo "| $date | $SOURCE_DOMAIN | $feature_name | $TARGET | Promoted via script |" >> "$report_file"

    log_success "Federation logged in FEATURE_FEDERATION.md"
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    echo ""
    echo "🚀 Feature Federation"
    echo "===================="
    echo "Source: $SOURCE_DOMAIN/$FEATURE_PATH"
    echo "Target: $TARGET"
    echo ""

    if [ "$TARGET" == "shared" ]; then
        federate_to_shared
    elif [ "$TARGET" == "global" ]; then
        federate_to_global
    fi

    echo ""
    generate_federation_report
    echo ""
    echo "===================="
    log_success "Feature federation complete!"
    echo "===================="
    echo ""
}

# Run main function
main

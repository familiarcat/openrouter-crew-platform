#!/bin/bash

################################################################################
# Weekly Codebase Analysis Script
# Automatically run analyzer, generate report, and commit results
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANALYZER_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$ANALYZER_DIR")")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SLACK_WEBHOOK=${SLACK_WEBHOOK_URL:-""}
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
DRY_RUN=${DRY_RUN:-false}
COMMIT_RESULTS=${COMMIT_RESULTS:-true}

################################################################################
# Helper Functions
################################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
  echo ""
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
  echo ""
}

################################################################################
# Main Analysis Function
################################################################################

run_analysis() {
  print_header "Running Codebase Analysis"

  log_info "Changing to analyzer directory: $ANALYZER_DIR"
  cd "$ANALYZER_DIR"

  log_info "Running analyzer on root: $ROOT_DIR"
  pnpm analyze "$ROOT_DIR" "./codebase.json"

  if [ $? -eq 0 ]; then
    log_success "Analysis completed successfully"
  else
    log_error "Analysis failed"
    return 1
  fi

  log_info "Building dashboard..."
  pnpm build:dashboard

  if [ $? -eq 0 ]; then
    log_success "Dashboard built successfully"
  else
    log_error "Dashboard build failed"
    return 1
  fi
}

################################################################################
# Compare Previous Results
################################################################################

generate_change_report() {
  print_header "Generating Change Report"

  local current_file="$ANALYZER_DIR/codebase.json"
  local previous_file="$ANALYZER_DIR/.previous-codebase.json"
  local report_file="$ANALYZER_DIR/weekly-report-$(date +%Y%m%d).md"

  if [ ! -f "$previous_file" ]; then
    log_warning "No previous analysis found. Creating baseline."
    cp "$current_file" "$previous_file"
    echo "# Weekly Codebase Analysis Report - Week of $(date +%Y-%m-%d)

## Status
Baseline established. No comparison available.

**Generated:** $(date)" > "$report_file"
    return 0
  fi

  # Parse JSON and extract key metrics
  local current_files=$(jq '.totalFiles' "$current_file")
  local current_lines=$(jq '.totalLines' "$current_file")
  local current_size=$(jq '.totalSize' "$current_file")
  local previous_files=$(jq '.totalFiles' "$previous_file")
  local previous_lines=$(jq '.totalLines' "$previous_file")
  local previous_size=$(jq '.totalSize' "$previous_file")

  # Calculate differences
  local files_diff=$((current_files - previous_files))
  local lines_diff=$((current_lines - previous_lines))
  local size_diff=$((current_size - previous_size))
  local files_pct=$(echo "scale=2; $files_diff / $previous_files * 100" | bc)
  local lines_pct=$(echo "scale=2; $lines_diff / $previous_lines * 100" | bc)

  # Generate report
  cat > "$report_file" << EOF
# Weekly Codebase Analysis Report
**Week of $(date +%Y-%m-%d)**

## Summary Statistics

| Metric | Previous | Current | Change | % Change |
|--------|----------|---------|--------|----------|
| Total Files | $previous_files | $current_files | $files_diff | $files_pct% |
| Lines of Code | $previous_lines | $current_lines | $lines_diff | $lines_pct% |
| Total Size (bytes) | $previous_size | $current_size | $size_diff | $(echo "scale=2; $size_diff / $previous_size * 100" | bc)% |

## Key Insights

### Growth Analysis
$(if [ "$files_diff" -gt 0 ]; then echo "- ✅ Added **$files_diff** new files"; else echo "- ℹ️ Removed **$((-$files_diff))** files"; fi)
$(if [ "$lines_diff" -gt 0 ]; then echo "- ✅ Added **$lines_diff** lines of code"; else echo "- ℹ️ Removed **$((-$lines_diff))** lines"; fi)

### File Distribution by Language
\`\`\`
$(jq -r '.statistics.byLanguage | to_entries[] | "\(.key): \(.value.files) files, \(.value.lines) lines"' "$current_file" | sort -t: -k2 -rn | head -10)
\`\`\`

### Domains
\`\`\`
$(jq -r '.domains[]' "$current_file" | sed 's/^/- /')
\`\`\`

### Technology Stack
**Languages:** $(jq -r '.technologies.languages | join(", ")' "$current_file")
**Frameworks:** $(jq -r '.technologies.frameworks | join(", ")' "$current_file")
**Tools:** $(jq -r '.technologies.tools | join(", ")' "$current_file")

## Packages Overview
Total packages: $(jq '.packages | length' "$current_file")

Top packages:
\`\`\`
$(jq -r '.packages[:10] | .[] | "\(.name) (\(.type)): \(.dependencies | length) dependencies"' "$current_file")
\`\`\`

## Recommendations

$(if [ $(echo "$files_pct > 5" | bc) -eq 1 ]; then echo "- 📈 Significant file growth detected (>5%). Consider refactoring to reduce complexity."; fi)
$(if [ $(echo "$lines_pct > 10" | bc) -eq 1 ]; then echo "- 📊 Rapid code growth (>10% lines). Ensure sufficient testing coverage."; fi)
$(if [ $(jq '.packages | length' "$current_file") -gt 30 ]; then echo "- 🏗️  High package count (>30). Consider consolidation or clear dependency management."; fi)

## Action Items
- [ ] Review new code additions
- [ ] Check test coverage for new files
- [ ] Validate build performance
- [ ] Plan refactoring if needed

---
**Generated:** $(date)
**Status:** Automatic Weekly Analysis
EOF

  log_success "Change report generated: $report_file"
  cat "$report_file"

  # Update baseline for next week
  cp "$current_file" "$previous_file"
}

################################################################################
# Slack Notification
################################################################################

send_slack_notification() {
  print_header "Sending Slack Notification"

  if [ -z "$SLACK_WEBHOOK" ]; then
    log_warning "SLACK_WEBHOOK_URL not set. Skipping Slack notification."
    return 0
  fi

  local current_file="$ANALYZER_DIR/codebase.json"
  local total_files=$(jq '.totalFiles' "$current_file")
  local total_lines=$(jq '.totalLines' "$current_file")
  local total_size=$(jq '.totalSize' "$current_file")
  local packages=$(jq '.packages | length' "$current_file")
  local timestamp=$(jq -r '.timestamp' "$current_file")

  # Convert bytes to MB
  local size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc)

  local payload=$(cat <<EOF
{
  "text": "Weekly Codebase Analysis Complete",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📊 Weekly Codebase Analysis Report"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Total Files:*\n$total_files"
        },
        {
          "type": "mrkdwn",
          "text": "*Lines of Code:*\n$total_lines"
        },
        {
          "type": "mrkdwn",
          "text": "*Total Size:*\n${size_mb}MB"
        },
        {
          "type": "mrkdwn",
          "text": "*Packages:*\n$packages"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Analysis Time:*\n$timestamp"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Dashboard"
          },
          "url": "file://$ANALYZER_DIR/output/index.html"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Report"
          },
          "url": "https://github.com/bradygeorgen/openrouter-crew-platform"
        }
      ]
    }
  ]
}
EOF
)

  log_info "Sending Slack webhook..."
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "$payload"

  if [ $? -eq 0 ]; then
    log_success "Slack notification sent"
  else
    log_error "Failed to send Slack notification"
  fi
}

################################################################################
# GitHub Comment on PR
################################################################################

create_github_pr_comment() {
  print_header "Creating GitHub PR Comment"

  if [ -z "$GITHUB_TOKEN" ] || [ -z "$CI" ]; then
    log_warning "GITHUB_TOKEN or CI environment not set. Skipping GitHub comment."
    return 0
  fi

  # This would be called from GitHub Actions
  log_info "Would create PR comment with analysis results"
}

################################################################################
# Git Commit Results
################################################################################

commit_results() {
  print_header "Committing Analysis Results"

  if [ "$COMMIT_RESULTS" != "true" ]; then
    log_info "Commit disabled (COMMIT_RESULTS=false)"
    return 0
  fi

  cd "$ANALYZER_DIR"

  # Check if there are changes
  if git diff-index --quiet HEAD --; then
    log_warning "No changes to commit"
    return 0
  fi

  log_info "Staging analysis files..."
  git add codebase.json codebase-metrics.txt .previous-codebase.json weekly-report-*.md output/ 2>/dev/null || true

  log_info "Creating commit..."
  local commit_message="chore: weekly codebase analysis update $(date +%Y-%m-%d)"

  if [ "$DRY_RUN" == "true" ]; then
    log_info "[DRY RUN] Would commit: $commit_message"
    git diff --cached
  else
    git commit -m "$commit_message" || log_warning "Commit failed or nothing to commit"
    log_success "Results committed"
  fi
}

################################################################################
# Push to Remote
################################################################################

push_to_remote() {
  print_header "Pushing to Remote"

  if [ "$DRY_RUN" == "true" ]; then
    log_info "[DRY RUN] Would push changes to remote"
    return 0
  fi

  cd "$ROOT_DIR"

  log_info "Pushing changes..."
  git push origin main

  if [ $? -eq 0 ]; then
    log_success "Changes pushed to remote"
  else
    log_error "Failed to push to remote"
    return 1
  fi
}

################################################################################
# Cleanup
################################################################################

cleanup() {
  print_header "Cleanup"
  log_info "Analysis cycle complete"
}

################################################################################
# Main Execution
################################################################################

main() {
  print_header "OpenRouter Crew Platform - Weekly Codebase Analysis"
  log_info "Start time: $(date)"
  log_info "DRY_RUN: $DRY_RUN"
  log_info "COMMIT_RESULTS: $COMMIT_RESULTS"

  # Run analysis
  if ! run_analysis; then
    log_error "Analysis failed"
    exit 1
  fi

  # Generate report
  if ! generate_change_report; then
    log_error "Report generation failed"
    exit 1
  fi

  # Send notifications
  send_slack_notification || log_warning "Slack notification failed"
  create_github_pr_comment || log_warning "GitHub comment creation failed"

  # Commit results
  if ! commit_results; then
    log_error "Commit failed"
    exit 1
  fi

  # Push to remote
  if ! push_to_remote; then
    log_warning "Push failed but analysis completed"
  fi

  cleanup
  log_success "Weekly analysis complete: $(date)"
}

# Run main function
main "$@"

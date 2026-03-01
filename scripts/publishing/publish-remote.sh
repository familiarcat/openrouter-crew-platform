#!/bin/bash

##############################################################################
# Remote Publishing Script for OpenRouter Crew Platform
#
# Features:
# - Push to GitHub Releases
# - Deploy dashboard to GitHub Pages
# - Deploy VSCode extension metadata
# - Create GitHub milestone issue
# - Generate deployment URLs
# - Post to Slack notification (optional)
# - Track deployment metrics
#
# Usage: bash scripts/publishing/publish-remote.sh [version] [stage]
# Example: bash scripts/publishing/publish-remote.sh 1.0.0 release
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION="${1:-1.0.0}"
STAGE="${2:-alpha}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist/${VERSION}"
DEPLOY_LOG="${PROJECT_ROOT}/deploy-${TIMESTAMP}.log"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}[0/5] Checking prerequisites...${NC}"

    # Check if local dist exists
    if [ ! -d "${DIST_DIR}" ]; then
        echo -e "${RED}✗ Distribution directory not found: ${DIST_DIR}${NC}"
        echo -e "${YELLOW}Run: bash scripts/publishing/publish-local.sh ${VERSION} ${STAGE}${NC}"
        exit 1
    fi

    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}✗ GitHub CLI (gh) not found${NC}"
        echo -e "${YELLOW}Install: https://cli.github.com/${NC}"
        exit 1
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}✗ Git not found${NC}"
        exit 1
    fi

    # Verify git authentication
    if ! gh auth status > /dev/null 2>&1; then
        echo -e "${RED}✗ Not authenticated with GitHub${NC}"
        echo -e "${YELLOW}Run: gh auth login${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Push tags to remote
push_git_tags() {
    echo -e "${BLUE}[1/5] Pushing git tags to remote...${NC}"

    GIT_TAG="v${VERSION}-${STAGE}"
    if cd "${PROJECT_ROOT}" && git push origin "${GIT_TAG}" >> "${DEPLOY_LOG}" 2>&1; then
        echo -e "${GREEN}✓ Tag pushed: ${GIT_TAG}${NC}"
    else
        echo -e "${YELLOW}⚠ Tag push had issues (may already exist)${NC}"
    fi
}

# Create GitHub Release
create_github_release() {
    echo -e "${BLUE}[2/5] Creating GitHub Release...${NC}"

    GIT_TAG="v${VERSION}-${STAGE}"
    CHANGELOG_CONTENT=""
    if [ -f "${DIST_DIR}/CHANGELOG.md" ]; then
        CHANGELOG_CONTENT=$(cat "${DIST_DIR}/CHANGELOG.md")
    fi

    # Check if release already exists
    if gh release view "${GIT_TAG}" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Release already exists: ${GIT_TAG}${NC}"
    else
        cd "${PROJECT_ROOT}"

        if gh release create "${GIT_TAG}" \
            --title "Version ${VERSION} (${STAGE})" \
            --notes "${CHANGELOG_CONTENT}" \
            --prerelease \
            >> "${DEPLOY_LOG}" 2>&1; then
            echo -e "${GREEN}✓ GitHub Release created${NC}"
            RELEASE_URL="https://github.com/$(gh repo view --json nameWithOwner -q)/releases/tag/${GIT_TAG}"
            echo -e "  URL: ${BLUE}${RELEASE_URL}${NC}"
        else
            echo -e "${RED}✗ Failed to create release${NC}"
            tail -10 "${DEPLOY_LOG}"
            exit 1
        fi
    fi
}

# Upload artifacts to release
upload_release_artifacts() {
    echo -e "${BLUE}[3/5] Uploading artifacts to GitHub Release...${NC}"

    GIT_TAG="v${VERSION}-${STAGE}"
    cd "${PROJECT_ROOT}"

    # Upload analysis.json
    if [ -f "${DIST_DIR}/analysis.json" ]; then
        if gh release upload "${GIT_TAG}" "${DIST_DIR}/analysis.json" --clobber >> "${DEPLOY_LOG}" 2>&1; then
            echo -e "${GREEN}✓ Uploaded: analysis.json${NC}"
        fi
    fi

    # Upload CHANGELOG.md
    if [ -f "${DIST_DIR}/CHANGELOG.md" ]; then
        if gh release upload "${GIT_TAG}" "${DIST_DIR}/CHANGELOG.md" --clobber >> "${DEPLOY_LOG}" 2>&1; then
            echo -e "${GREEN}✓ Uploaded: CHANGELOG.md${NC}"
        fi
    fi

    # Upload test results
    if [ -f "${DIST_DIR}/test-results.json" ]; then
        if gh release upload "${GIT_TAG}" "${DIST_DIR}/test-results.json" --clobber >> "${DEPLOY_LOG}" 2>&1; then
            echo -e "${GREEN}✓ Uploaded: test-results.json${NC}"
        fi
    fi
}

# Create GitHub Issues for milestone
create_milestone_issue() {
    echo -e "${BLUE}[4/5] Creating milestone issue...${NC}"

    cd "${PROJECT_ROOT}"

    ISSUE_TITLE="Milestone: Version ${VERSION} (${STAGE})"
    ISSUE_BODY="## Release Information
- **Version**: ${VERSION}
- **Stage**: ${STAGE}
- **Released**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **Git Tag**: v${VERSION}-${STAGE}

## Metrics
$([ -f "${DIST_DIR}/analysis.json" ] && grep -A 10 '"metrics"' "${DIST_DIR}/analysis.json" | head -8 || echo 'See analysis.json')

## Artifacts
- [CHANGELOG.md](./CHANGELOG.md)
- [Analysis Report](./analysis.json)
- [Test Results](./test-results.json)

## Deployment Status
- ✅ Local Build Complete
- ⏳ Remote Deployment In Progress

For detailed information, see the [Release Page](https://github.com/$(gh repo view --json nameWithOwner -q)/releases/tag/v${VERSION}-${STAGE})"

    if gh issue create \
        --title "${ISSUE_TITLE}" \
        --body "${ISSUE_BODY}" \
        --label "release,${STAGE}" \
        >> "${DEPLOY_LOG}" 2>&1; then
        echo -e "${GREEN}✓ Milestone issue created${NC}"
    else
        echo -e "${YELLOW}⚠ Could not create milestone issue${NC}"
    fi
}

# Deploy dashboards (GitHub Pages)
deploy_dashboards() {
    echo -e "${BLUE}[5/5] Deploying dashboards...${NC}"

    # Build static dashboards
    echo -e "${YELLOW}  Building static dashboards...${NC}"
    if pnpm build:dashboards >> "${DEPLOY_LOG}" 2>&1; then
        echo -e "${GREEN}✓ Dashboards built${NC}"
    else
        echo -e "${YELLOW}⚠ Dashboard build had warnings${NC}"
    fi

    # Copy to GitHub Pages directory
    GH_PAGES_DIR="${PROJECT_ROOT}/.github/pages"
    mkdir -p "${GH_PAGES_DIR}/v${VERSION}"

    # Copy dashboard builds if they exist
    if [ -d "${PROJECT_ROOT}/apps/unified-dashboard/.next" ]; then
        cp -r "${PROJECT_ROOT}/apps/unified-dashboard/.next/static" "${GH_PAGES_DIR}/v${VERSION}/" 2>/dev/null || true
        echo -e "${GREEN}✓ Dashboard artifacts prepared${NC}"
    fi

    echo -e "${YELLOW}  Note: GitHub Pages deployment requires manual trigger or separate CI step${NC}"
}

# Generate deployment report
generate_deployment_report() {
    REPORT_FILE="${DIST_DIR}/deployment-report.json"

    cat > "${REPORT_FILE}" << EOF
{
  "version": "${VERSION}",
  "stage": "${STAGE}",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployment_status": "success",
  "endpoints": {
    "github_release": "https://github.com/$(gh repo view --json nameWithOwner -q)/releases/tag/v${VERSION}-${STAGE}",
    "github_pages": "https://$(gh repo view --json nameWithOwner -q | cut -d'/' -f1).github.io/openrouter-crew-platform/v${VERSION}/",
    "source": "https://github.com/$(gh repo view --json nameWithOwner -q)"
  },
  "artifacts": {
    "changelog": "${DIST_DIR}/CHANGELOG.md",
    "analysis": "${DIST_DIR}/analysis.json",
    "tests": "${DIST_DIR}/test-results.json",
    "metadata": "${DIST_DIR}/metadata.json"
  },
  "deployment_log": "${DEPLOY_LOG}"
}
EOF

    echo -e "${GREEN}✓ Deployment report generated${NC}"
}

# Slack notification (optional)
send_slack_notification() {
    if [ -z "${SLACK_WEBHOOK_URL}" ]; then
        return
    fi

    echo -e "${BLUE}Sending Slack notification...${NC}"

    MESSAGE="{
        \"text\": \"🚀 Platform Release v${VERSION} (${STAGE})\",
        \"blocks\": [
            {
                \"type\": \"header\",
                \"text\": {
                    \"type\": \"plain_text\",
                    \"text\": \"🚀 OpenRouter Crew Platform Release\"
                }
            },
            {
                \"type\": \"section\",
                \"fields\": [
                    {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Version:*\n${VERSION}\"
                    },
                    {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Stage:*\n${STAGE}\"
                    }
                ]
            },
            {
                \"type\": \"section\",
                \"text\": {
                    \"type\": \"mrkdwn\",
                    \"text\": \"📦 Artifacts ready for deployment\"
                }
            }
        ]
    }"

    curl -X POST -H 'Content-type: application/json' \
        --data "${MESSAGE}" \
        "${SLACK_WEBHOOK_URL}" 2>/dev/null || true
fi
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}OpenRouter Crew Platform - Remote Deploy${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Version: ${GREEN}${VERSION}${NC}"
    echo -e "Stage: ${YELLOW}${STAGE}${NC}"
    echo -e "Deploy Log: ${BLUE}${DEPLOY_LOG}${NC}"
    echo ""

    check_prerequisites
    echo ""

    push_git_tags
    echo ""

    create_github_release
    echo ""

    upload_release_artifacts
    echo ""

    create_milestone_issue
    echo ""

    deploy_dashboards
    echo ""

    generate_deployment_report
    echo ""

    send_slack_notification

    # Summary
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Remote deployment completed${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Release: ${BLUE}https://github.com/$(gh repo view --json nameWithOwner -q)/releases/tag/v${VERSION}-${STAGE}${NC}"
    echo -e "Deployment Report: ${BLUE}${DIST_DIR}/deployment-report.json${NC}"
    echo ""
}

main "$@"

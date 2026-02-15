#!/bin/bash

# ==============================================================================
# Update GitHub AWS Secrets
# Prompts for AWS credentials and updates them in the GitHub repository.
# Usage: ./scripts/secrets/update-gh-aws-secrets.sh
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Updating AWS Credentials in GitHub Secrets${NC}"

# Check for gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    exit 1
fi

echo "Please enter your AWS credentials for the 'OpenRouterDeployer' user."
echo "These will be uploaded securely to GitHub Actions."
echo ""

read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Credentials cannot be empty."
    exit 1
fi

echo -e "\n${BLUE}Uploading secrets...${NC}"
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"

echo -e "${GREEN}✅ AWS Secrets updated successfully!${NC}"
echo "You can now retry the deployment."
#!/bin/bash

# This script audits 'DeploymentUser' and 'rag-refresh-deployer' to find a valid deployer.
# If none is found, it attempts to create a new 'OpenRouterDeployer' with AdministratorAccess.
#
# Usage: ./scripts/setup-deployer-permissions.sh

set -e

echo "ℹ️  Current AWS Identity:"
CURRENT_ARN=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null || echo "Unknown")
echo "   Current User: $CURRENT_ARN"
echo ""

USERS=("DeploymentUser" "rag-refresh-deployer" "rag-refersh-deployer")
FOUND_VALID_USER=false

check_user_permissions() {
    local USER=$1
    echo "👉 Checking user: $USER"
    
    # Check if user exists
    if ! aws iam get-user --user-name "$USER" >/dev/null 2>&1; then
        echo "   ❌ User not found."
        return
    fi

    # Check attached policies
    # Note: This requires iam:ListAttachedUserPolicies permission
    if POLICIES=$(aws iam list-attached-user-policies --user-name "$USER" --query 'AttachedPolicies[*].PolicyName' --output text 2>/dev/null); then
        echo "   Attached Policies: $POLICIES"

        if [[ "$POLICIES" == *"AdministratorAccess"* ]]; then
            echo "   ✅ This user has AdministratorAccess!"
            FOUND_VALID_USER=true
        elif [[ "$POLICIES" == *"TerraformInfrastructurePolicy"* ]]; then
            echo "   ✅ This user has TerraformInfrastructurePolicy!"
            FOUND_VALID_USER=true
        else
            echo "   ⚠️  Missing required policies."
        fi
    else
        echo "   ⚠️  Unable to list policies (Permission Denied)."
    fi
    echo ""
}

# Check existing users
for U in "${USERS[@]}"; do
    check_user_permissions "$U"
done

if [ "$FOUND_VALID_USER" = true ]; then
    echo "🎉 Found a valid user above. Please configure your AWS CLI with that user's credentials."
    echo "   Run: aws configure"
    exit 0
fi

echo "❌ No valid deployer found among existing users."
echo "   Attempting to create a new admin user: OpenRouterDeployer..."

NEW_USER="OpenRouterDeployer"

# Try to create user
if aws iam create-user --user-name "$NEW_USER" >/dev/null 2>&1; then
    echo "   ✅ Created user: $NEW_USER"
    
    # Try to attach Admin policy
    if aws iam attach-user-policy --user-name "$NEW_USER" --policy-arn arn:aws:iam::aws:policy/AdministratorAccess >/dev/null 2>&1; then
        echo "   ✅ Attached AdministratorAccess"
        
        # Create keys
        echo "   🔑 Creating access keys..."
        aws iam create-access-key --user-name "$NEW_USER" > "${NEW_USER}_credentials.json"
        
        echo "   ✅ Credentials saved to ${NEW_USER}_credentials.json"
        echo ""
        echo "   Run the following to configure CLI:"
        echo "   aws configure set aws_access_key_id \$(grep -o '\"AccessKeyId\": \"[^\"]*' ${NEW_USER}_credentials.json | cut -d'\"' -f4)"
        echo "   aws configure set aws_secret_access_key \$(grep -o '\"SecretAccessKey\": \"[^\"]*' ${NEW_USER}_credentials.json | cut -d'\"' -f4)"
    else
        echo "   ❌ Failed to attach policy. You need Admin permissions to do this."
    fi
else
    echo "   ❌ Failed to create user (Permission Denied)."
    echo ""
    echo "   🚨 ACTION REQUIRED:"
    echo "   1. Log in to the AWS Console (https://console.aws.amazon.com/iam/)"
    echo "   2. Go to Users > Create User"
    echo "   3. Name: OpenRouterDeployer"
    echo "   4. Attach Policy: AdministratorAccess"
    echo "   5. Create Access Key (Security Credentials tab)"
    echo "   6. Run 'aws configure' with the new keys."
fi
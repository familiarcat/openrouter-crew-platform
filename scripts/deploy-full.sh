#!/bin/bash

# Orchestrates the full deployment pipeline:
# 1. Provisions AWS infrastructure via Terraform
# 2. Builds and pushes Docker image to ECR
# 3. Deploys application to EC2 via AWS SSM

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Error handling
handle_error() {
    local line_no=$1
    echo -e "\n${RED}❌ Deployment failed at line ${line_no}.${NC}"
    echo -e "${YELLOW}Check the logs above for details.${NC}"
}
trap 'handle_error ${LINENO}' ERR

log_step() {
    echo -e "\n${BLUE}👉 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

ENVIRONMENT="${1:-production}"

# Resolve Base Domain based on Environment
case "$ENVIRONMENT" in
  production|prod) BASE_DOMAIN="pbradygeorgen.com" ;;
  staging) BASE_DOMAIN="staging.pbradygeorgen.com" ;;
  uat) BASE_DOMAIN="uat.pbradygeorgen.com" ;;
  test) BASE_DOMAIN="test.pbradygeorgen.com" ;;
  *) echo "❌ Unknown environment: $ENVIRONMENT"; exit 1 ;;
esac

DASHBOARD_URL="http://dashboard.${BASE_DOMAIN}:3000"
N8N_URL="http://automation.${BASE_DOMAIN}:5678"
SUPABASE_STUDIO_URL="http://supabase.${BASE_DOMAIN}:54323"

echo -e "${BLUE}🚀 Starting Full Stack Deployment to ${YELLOW}${ENVIRONMENT}${BLUE}...${NC}"

# Check for Terraform
log_step "Checking prerequisites..."
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed."
    exit 1
fi

# Check for Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not installed or not running."
    exit 1
fi
log_success "Prerequisites met."

# 1. Infrastructure Provisioning
echo -e "\n${BLUE}📦 Phase 1: Infrastructure Provisioning (Terraform)${NC}"

if [ ! -d "terraform" ]; then
    echo "❌ 'terraform' directory not found."
    exit 1
fi

cd terraform

# Initialize if needed
if [ ! -d ".terraform" ]; then
    log_step "Initializing Terraform..."
    terraform init
fi

log_step "Applying Terraform configuration..."
# Use -input=false to avoid hanging on prompts if something is wrong
terraform apply -auto-approve -input=false

# Capture outputs
log_step "Capturing infrastructure outputs..."
INSTANCE_ID=$(terraform output -raw instance_id)
PUBLIC_IP=$(terraform output -raw instance_public_ip)

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Failed to capture instance_id from Terraform."
    exit 1
fi

log_success "Infrastructure Ready"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP:   $PUBLIC_IP"

echo -e "\n${BLUE}🌐 Service URLs (will be active after deployment):${NC}"
echo "   Web Dashboard:   $DASHBOARD_URL"
echo "   n8n Automation:  $N8N_URL"
echo "   Supabase Studio: $SUPABASE_STUDIO_URL"

cd ..

echo -e "\n${BLUE}📦 Phase 2: Build & Push Docker Image${NC}"

AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-2" # Default if not configured
    echo "AWS region not configured, defaulting to $AWS_REGION"
fi

log_step "Logging into ECR..."
ECR_REGISTRY=$(aws ecr get-authorization-token --region "$AWS_REGION" --output text --query 'authorizationData[0].proxyEndpoint' | sed 's|https://||')
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

ECR_REPOSITORY="openrouter-crew-platform"

# Ensure ECR repository exists
log_step "Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo "⚠️  ECR Repository '$ECR_REPOSITORY' not found. Creating it..."
    aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"
else
    log_success "ECR Repository '$ECR_REPOSITORY' exists."
fi

IMAGE_TAG=$(git rev-parse --short HEAD)-$(date +%s)
IMAGE_URI="$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

log_step "Building Docker image: $IMAGE_URI"
export DOCKER_BUILDKIT=1
docker build \
    --progress=plain \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --tag "$IMAGE_URI" \
    -f apps/unified-dashboard/Dockerfile \
    .

log_step "Pushing Docker image to ECR..."
docker push "$IMAGE_URI"
log_success "Image pushed successfully."

echo -e "\n${BLUE}🚀 Phase 3: Deploying to EC2 via SSM${NC}"

# This heredoc defines the script that will run on the remote EC2 instance.
# Variables are expanded locally before being sent.
REMOTE_SCRIPT=$(cat <<EOF
echo "Updating environment on EC2..."
cd /home/ec2-user/openrouter-crew-platform

# Create .env.prod file with secrets from the local environment
cat > .env.production <<ENV_EOF
IMAGE_URI=${IMAGE_URI}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
N8N_BASE_URL=${N8N_URL}
N8N_API_KEY=${N8N_API_KEY}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
REDIS_PASSWORD=${REDIS_PASSWORD}
ENV_EOF

echo "Pulling new image and restarting services..."
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Verifying running containers..."
docker ps
EOF
)

# Encode the script to Base64 to avoid JSON parsing issues with special characters
ENCODED_SCRIPT=$(echo "$REMOTE_SCRIPT" | base64 | tr -d '\n')

log_step "Sending deployment command to instance $INSTANCE_ID..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$AWS_REGION" \
    --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" \
    --query "Command.CommandId" \
    --output text)

log_step "SSM command sent (ID: $COMMAND_ID). Waiting for execution..."

# Wait for the command to finish and check status
aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION"
STATUS=$(aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "Status" --output text)

if [ "$STATUS" == "Success" ]; then
    log_success "Deployment script executed successfully on EC2."
else
    echo -e "${RED}❌ Deployment script failed on EC2.${NC}"
    echo "Error Output:"
    aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --region "$AWS_REGION" --query "StandardErrorContent" --output text
    exit 1
fi

# 4. DNS Configuration
echo -e "\n${BLUE}🌍 Phase 4: DNS Configuration${NC}"
export EC2_PUBLIC_IP=$PUBLIC_IP
./scripts/ci-post-deploy.sh "$ENVIRONMENT"

echo -e "\n${GREEN}🎉 Full Deployment Complete!${NC}"
echo "--------------------------------------------------"
echo "Web Dashboard:   $DASHBOARD_URL"
echo "n8n Automation:  $N8N_URL"
echo "Supabase Studio: $SUPABASE_STUDIO_URL"
echo "--------------------------------------------------"
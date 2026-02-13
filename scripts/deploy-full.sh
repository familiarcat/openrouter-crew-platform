#!/bin/bash

# Orchestrates the full deployment pipeline:
# 1. Provisions AWS infrastructure via Terraform
# 2. Builds and pushes Docker image to ECR
# 3. Deploys application to EC2 via AWS SSM

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Full Stack Deployment...${NC}"

# Check for Terraform
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed."
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not running."
    exit 1
fi

# 1. Infrastructure Provisioning
echo -e "\n${BLUE}📦 Phase 1: Infrastructure Provisioning (Terraform)${NC}"

if [ ! -d "terraform" ]; then
    echo "❌ 'terraform' directory not found."
    exit 1
fi

cd terraform

# Initialize if needed
if [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    terraform init
fi

echo "Applying Terraform configuration..."
terraform apply -auto-approve

# Capture outputs
echo "Capturing infrastructure outputs..."
INSTANCE_ID=$(terraform output -raw instance_id)
PUBLIC_IP=$(terraform output -raw instance_public_ip)

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Failed to capture instance_id from Terraform."
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure Ready:${NC}"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP:   $PUBLIC_IP"

cd ..

echo -e "\n${BLUE}📦 Phase 2: Build & Push Docker Image${NC}"

AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-2" # Default if not configured
    echo "AWS region not configured, defaulting to $AWS_REGION"
fi

echo "Logging into ECR..."
ECR_REGISTRY=$(aws ecr get-authorization-token --region "$AWS_REGION" --output text --query 'authorizationData[0].proxyEndpoint' | sed 's|https://||')
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

ECR_REPOSITORY="openrouter-crew-platform"

# Ensure ECR repository exists
if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo "⚠️  ECR Repository '$ECR_REPOSITORY' not found. Creating it..."
    aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"
else
    echo "✅ ECR Repository '$ECR_REPOSITORY' exists."
fi

IMAGE_TAG=$(git rev-parse --short HEAD)-$(date +%s)
IMAGE_URI="$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

echo "Building Docker image: $IMAGE_URI"
docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --tag "$IMAGE_URI" \
    -f apps/unified-dashboard/Dockerfile \
    .

echo "Pushing Docker image to ECR..."
docker push "$IMAGE_URI"

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
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
N8N_BASE_URL=http://${PUBLIC_IP}:5678
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
ENCODED_SCRIPT=$(echo "$REMOTE_SCRIPT" | base64)

echo "Sending deployment command to instance $INSTANCE_ID..."

COMMAND_ID=$(aws ssm send-command --instance-ids "$INSTANCE_ID" --document-name "AWS-RunShellScript" --region "$AWS_REGION" --parameters "{\"commands\":[\"echo $ENCODED_SCRIPT | base64 -d | bash\"]}" --query "Command.CommandId" --output text)
echo "SSM command sent (ID: $COMMAND_ID). Check AWS Console for status."

echo -e "\n${GREEN}🎉 Full Deployment Complete!${NC}"
echo "--------------------------------------------------"
echo "Web Dashboard:   http://$PUBLIC_IP:3000"
echo "n8n Automation:  http://$PUBLIC_IP:5678"
echo "Supabase Studio: http://$PUBLIC_IP:54323"
echo "--------------------------------------------------"
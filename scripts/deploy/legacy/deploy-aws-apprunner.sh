#!/bin/bash
# scripts/deploy/deploy-aws.sh
# Usage: ./scripts/deploy/deploy-aws.sh <target-app> <environment>

set -e

TARGET=$1
ENV=$2
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if [ -z "$TARGET" ] || [ -z "$ENV" ]; then
  echo "Usage: $0 <target> <environment>"
  exit 1
fi

# Validate environment-specific secrets
if [ -z "$NEXT_PUBLIC_OPENROUTER_API_KEY" ]; then
  echo "❌ Error: NEXT_PUBLIC_OPENROUTER_API_KEY is not set in the environment."
  echo "Please run 'pnpm secrets:load' or set the variable manually."
  exit 1
fi

echo "🚀 Starting AWS Deployment for $TARGET to $ENV..."

# 1. Build the application using existing build script
echo "📦 Building application..."
./scripts/build.sh "$TARGET"

# 2. Determine Artifact Type
if [[ "$TARGET" == *"vscode-extension"* ]]; then
  echo "🧩 Detected VSCode Extension. Packaging VSIX..."
  cd domains/vscode-extension
  pnpm package
  
  # Upload VSIX to S3 Release Bucket
  VERSION=$(node -p "require('./package.json').version")
  S3_URI="s3://openrouter-crew-releases/vscode-extension/${ENV}/v${VERSION}.vsix"
  echo "☁️  Uploading to $S3_URI..."
  aws s3 cp "*.vsix" "$S3_URI"
  exit 0
fi

# 3. Dockerize & Push (For Dashboards/APIs)
echo "🐳 Building Docker image..."
IMAGE_TAG="${TARGET}-${ENV}-$(date +%s)"
FULL_IMAGE_NAME="${ECR_REGISTRY}/${TARGET}:${IMAGE_TAG}"

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build Docker image
docker build -t "$TARGET" --platform linux/amd64 \
  -f "apps/${TARGET}/Dockerfile" . \
  --build-arg ENV="$ENV"

echo "🏷️  Tagging and Pushing to ECR..."
docker tag "$TARGET" "$FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"

# 4. Update AWS Service (App Runner)
echo "🔄 Updating AWS App Runner Service..."
SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='${TARGET}-${ENV}'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
  echo "⚠️ Service not found. Please provision infrastructure first."
  exit 1
fi

echo "🔒 Updating Service Configuration & Deploying..."
aws apprunner update-service \
  --service-arn "$SERVICE_ARN" \
  --region "$AWS_REGION" \
  --source-configuration "ImageRepository={ImageIdentifier=$FULL_IMAGE_NAME,ImageConfiguration={Port=3000,RuntimeEnvironmentVariables={SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,N8N_BASE_URL=$N8N_BASE_URL,N8N_API_KEY=$N8N_API_KEY,NEXT_PUBLIC_OPENROUTER_API_KEY=$NEXT_PUBLIC_OPENROUTER_API_KEY,ENVIRONMENT=$ENV}}}"

echo "✅ Deployment triggered successfully!"
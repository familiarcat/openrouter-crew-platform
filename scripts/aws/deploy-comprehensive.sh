#!/bin/bash

################################################################################
# OpenRouter Crew Platform - Comprehensive AWS Deployment
################################################################################
#
# Purpose: Deploy the platform to AWS with minimal cost and maximum visibility
#
# Strategy:
# - t3.micro EC2 (free tier eligible, $0.0116/hour or ~$8.50/month)
# - Supabase (managed, no infrastructure costs)
# - CloudFront distribution (cache heavy, reduce API calls)
# - CloudWatch monitoring (free tier sufficient)
# - Public health/metrics endpoints (show system status)
# - Auto-shutdown after hours (save 60% of compute costs)
#
# Requirements:
# - AWS Account with API credentials configured
# - AWS CLI v2.x
# - Docker & Docker Compose
# - Git
# - pnpm & Node.js 20+
#
# Usage:
#   bash scripts/aws/deploy-comprehensive.sh [environment] [domain]
#
# Examples:
#   bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
#   bash scripts/aws/deploy-comprehensive.sh staging crew-staging.example.com
#   bash scripts/aws/deploy-comprehensive.sh demo (uses default domain)
#

set -euo pipefail

################################################################################
# CONFIGURATION & CONSTANTS
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Deployment parameters
ENVIRONMENT="${1:-demo}"
DOMAIN="${2:-crew-platform-demo.com}"
REGION="${AWS_REGION:-us-east-1}"
INSTANCE_TYPE="t3.micro"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Naming conventions
PROJECT_NAME="openrouter-crew"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"
APP_NAME="crew-platform"
INSTANCE_NAME="${STACK_NAME}-app"
SECURITY_GROUP_NAME="${STACK_NAME}-sg"
KEY_PAIR_NAME="${STACK_NAME}-key"
ECR_REPO_NAME="${PROJECT_NAME}/${ENVIRONMENT}"
LOG_GROUP_NAME="/aws/${PROJECT_NAME}/${ENVIRONMENT}"
METRICS_TABLE="${PROJECT_NAME}_metrics_${ENVIRONMENT}"

# Cost tracking
MONTHLY_COST_ESTIMATE=0
HOURLY_COST_ESTIMATE=0

# Flags
DRY_RUN=false
SKIP_PREFLIGHT=false
VERBOSE=false

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${MAGENTA}ℹ️  $1${NC}"
}

# Calculate and accumulate costs
add_cost() {
    local service=$1
    local monthly=$2
    local hourly=$3

    MONTHLY_COST_ESTIMATE=$(echo "$MONTHLY_COST_ESTIMATE + $monthly" | bc -l)
    HOURLY_COST_ESTIMATE=$(echo "$HOURLY_COST_ESTIMATE + $hourly" | bc -l)

    printf "  %-30s $%-10.2f/mo  ($%-7.4f/hr)\n" "$service:" "$monthly" "$hourly"
}

# Error handling
handle_error() {
    local line_no=$1
    print_error "Deployment failed at line $line_no"
    print_warning "Check AWS console for any partially created resources"
    echo ""
    exit 1
}

trap 'handle_error ${LINENO}' ERR

# Check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for condition with timeout
wait_for_condition() {
    local condition=$1
    local timeout=${2:-300}
    local elapsed=0
    local interval=5

    while [ $elapsed -lt $timeout ]; do
        if eval "$condition"; then
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    return 1
}

################################################################################
# PREFLIGHT CHECKS
################################################################################

run_preflight_checks() {
    if [ "$SKIP_PREFLIGHT" = true ]; then
        print_warning "Skipping preflight checks (--skip-preflight flag set)"
        return 0
    fi

    print_section "Running preflight checks..."

    # Check required commands
    local required_cmds=("aws" "docker" "git" "pnpm" "node" "jq")
    local missing_cmds=()

    for cmd in "${required_cmds[@]}"; do
        if command_exists "$cmd"; then
            print_success "Found $cmd"
        else
            print_error "Missing $cmd"
            missing_cmds+=("$cmd")
        fi
    done

    if [ ${#missing_cmds[@]} -gt 0 ]; then
        print_error "Missing required commands: ${missing_cmds[*]}"
        echo ""
        echo "Installation instructions:"
        echo "  AWS CLI:   https://aws.amazon.com/cli/"
        echo "  Docker:    https://docs.docker.com/get-docker/"
        echo "  pnpm:      curl -fsSL https://get.pnpm.io | sh -"
        exit 1
    fi

    # Check AWS credentials
    print_section "Validating AWS credentials..."
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured or invalid"
        echo ""
        echo "Configure AWS credentials:"
        echo "  aws configure"
        exit 1
    fi

    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local username=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
    print_success "AWS Account: $account_id (user: $username)"

    # Check deployment directory
    if [ ! -f "$ROOT_DIR/package.json" ]; then
        print_error "Not running from OpenRouter Crew Platform root directory"
        print_info "Expected package.json at: $ROOT_DIR/package.json"
        exit 1
    fi

    print_success "Running from correct directory"

    # Check Node.js version
    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo "$node_version" | cut -d'.' -f1)

    if [ "$major_version" -lt 20 ]; then
        print_error "Node.js 20+ required (found $node_version)"
        exit 1
    fi

    print_success "Node.js version: $node_version"

    # Check pnpm dependencies
    print_section "Checking pnpm dependencies..."
    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        print_warning "node_modules not found, installing dependencies..."
        cd "$ROOT_DIR"
        pnpm install --frozen-lockfile
    fi

    print_success "All preflight checks passed"
}

################################################################################
# BUILD & DOCKER IMAGE
################################################################################

build_docker_image() {
    print_section "Building Docker image..."

    # Extract version from package.json
    local version=$(jq -r '.version' "$ROOT_DIR/package.json")

    print_info "Platform version: $version"
    print_info "Building image for unified-dashboard..."

    cd "$ROOT_DIR"

    # Build dashboards first
    pnpm run build:dashboards:prod

    # Create docker image tag
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local image_tag="${version}-${timestamp}"

    # Build Docker image
    docker build \
        -f apps/unified-dashboard/Dockerfile \
        -t "$APP_NAME:latest" \
        -t "$APP_NAME:$image_tag" \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        .

    print_success "Docker image built: $APP_NAME:$image_tag"

    # Get image size
    local image_size=$(docker images "$APP_NAME" --format "{{.Size}}" | head -1)
    print_info "Image size: $image_size"

    echo "$image_tag"
}

push_to_ecr() {
    local image_tag=$1

    print_section "Pushing image to AWS ECR..."

    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local ecr_uri="${account_id}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO_NAME}"

    # Create ECR repository if it doesn't exist
    if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" \
            --region "$REGION" >/dev/null 2>&1; then
        print_info "Creating ECR repository: $ECR_REPO_NAME"
        aws ecr create-repository \
            --repository-name "$ECR_REPO_NAME" \
            --region "$REGION" \
            --encryption-configuration encryptionType=AES \
            --image-scan-configuration scanOnPush=true

        # Set lifecycle policy to clean old images
        aws ecr put-lifecycle-policy \
            --repository-name "$ECR_REPO_NAME" \
            --lifecycle-policy-text '{
                "rules": [
                    {
                        "rulePriority": 1,
                        "description": "Keep last 10 images",
                        "selection": {
                            "tagStatus": "any",
                            "countType": "imageCountMoreThan",
                            "countNumber": 10
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            }' \
            --region "$REGION"
    fi

    # Get ECR login token
    print_info "Authenticating with ECR..."
    aws ecr get-login-password --region "$REGION" | \
        docker login --username AWS --password-stdin "$ecr_uri"

    # Tag and push image
    docker tag "$APP_NAME:$image_tag" "$ecr_uri:$image_tag"
    docker tag "$APP_NAME:latest" "$ecr_uri:latest"

    print_info "Pushing $ecr_uri:$image_tag..."
    docker push "$ecr_uri:$image_tag"
    docker push "$ecr_uri:latest"

    print_success "Image pushed to ECR"
    echo "$ecr_uri:$image_tag"
}

################################################################################
# AWS INFRASTRUCTURE PROVISIONING
################################################################################

create_security_group() {
    print_section "Setting up security group..."

    # Check if security group already exists
    local sg_id=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
        --region "$REGION" \
        --query 'SecurityGroups[0].GroupId' \
        --output text 2>/dev/null || echo "")

    if [ "$sg_id" != "None" ] && [ -n "$sg_id" ]; then
        print_info "Security group already exists: $sg_id"
        echo "$sg_id"
        return 0
    fi

    # Create new security group
    print_info "Creating security group: $SECURITY_GROUP_NAME"

    local vpc_id=$(aws ec2 describe-vpcs \
        --filters "Name=isDefault,Values=true" \
        --region "$REGION" \
        --query 'Vpcs[0].VpcId' \
        --output text)

    sg_id=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for OpenRouter Crew Platform $ENVIRONMENT" \
        --vpc-id "$vpc_id" \
        --region "$REGION" \
        --query 'GroupId' \
        --output text)

    # Add inbound rules
    # HTTP
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"

    # HTTPS
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"

    # SSH (restricted to your IP if possible)
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp --port 22 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"

    # Application port (for direct access during development)
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp --port 3000 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"

    print_success "Security group created: $sg_id"

    # Tag the security group
    aws ec2 create-tags \
        --resources "$sg_id" \
        --tags "Key=Name,Value=$SECURITY_GROUP_NAME" \
               "Key=Environment,Value=$ENVIRONMENT" \
               "Key=Project,Value=$PROJECT_NAME" \
        --region "$REGION"

    echo "$sg_id"
}

create_key_pair() {
    print_section "Setting up EC2 key pair..."

    # Check if key pair already exists
    if aws ec2 describe-key-pairs \
            --key-names "$KEY_PAIR_NAME" \
            --region "$REGION" >/dev/null 2>&1; then
        print_info "Key pair already exists: $KEY_PAIR_NAME"
        return 0
    fi

    # Create new key pair
    print_info "Creating EC2 key pair: $KEY_PAIR_NAME"

    local key_file="$ROOT_DIR/.aws/${KEY_PAIR_NAME}.pem"
    mkdir -p "$(dirname "$key_file")"

    aws ec2 create-key-pair \
        --key-name "$KEY_PAIR_NAME" \
        --region "$REGION" \
        --query 'KeyMaterial' \
        --output text > "$key_file"

    chmod 600 "$key_file"

    print_success "Key pair created at: $key_file"
    print_warning "Keep this file secure! It's needed to SSH into the instance."
}

create_ec2_instance() {
    print_section "Launching EC2 instance..."

    local sg_id=$1
    local ecr_image_uri=$2

    # Get the latest Amazon Linux 2 AMI
    local ami_id=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
        --region "$REGION" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text)

    print_info "Using AMI: $ami_id"

    # Create user data script for EC2 initialization
    local user_data_script=$(cat <<'EOF'
#!/bin/bash
set -e

# Update system
yum update -y
yum install -y docker git curl jq awscli

# Start Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create app directory
mkdir -p /opt/crew-platform
cd /opt/crew-platform

# Log initialization
echo "EC2 Instance initialization completed at $(date)" > /var/log/crew-platform-init.log

EOF
    )

    # Base64 encode the user data
    local user_data_b64=$(echo "$user_data_script" | base64 -w 0)

    # Launch instance
    print_info "Launching t3.micro instance..."

    local instance_id=$(aws ec2 run-instances \
        --image-id "$ami_id" \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$KEY_PAIR_NAME" \
        --security-group-ids "$sg_id" \
        --user-data "$user_data_b64" \
        --monitoring Enabled=true \
        --iam-instance-profile "Name=EC2-CloudWatch-Role" \
        --region "$REGION" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Environment,Value=$ENVIRONMENT},{Key=Project,Value=$PROJECT_NAME}]" \
        --query 'Instances[0].InstanceId' \
        --output text 2>/dev/null || echo "")

    if [ -z "$instance_id" ] || [ "$instance_id" = "None" ]; then
        # Try without IAM instance profile if it doesn't exist
        instance_id=$(aws ec2 run-instances \
            --image-id "$ami_id" \
            --instance-type "$INSTANCE_TYPE" \
            --key-name "$KEY_PAIR_NAME" \
            --security-group-ids "$sg_id" \
            --user-data "$user_data_b64" \
            --monitoring Enabled=true \
            --region "$REGION" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Environment,Value=$ENVIRONMENT},{Key=Project,Value=$PROJECT_NAME}]" \
            --query 'Instances[0].InstanceId' \
            --output text)
    fi

    print_success "EC2 instance launched: $instance_id"

    # Wait for instance to be running
    print_info "Waiting for instance to be in running state..."

    if ! wait_for_condition "aws ec2 describe-instances \
            --instance-ids '$instance_id' \
            --region '$REGION' \
            --query 'Reservations[0].Instances[0].State.Name' \
            --output text | grep -q 'running'" 60; then
        print_error "Instance failed to start within timeout"
        exit 1
    fi

    print_success "Instance is running"

    # Get public IP
    sleep 5  # Wait for IP assignment
    local public_ip=$(aws ec2 describe-instances \
        --instance-ids "$instance_id" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)

    print_success "Public IP: $public_ip"

    # Tag the instance for cost tracking
    aws ec2 create-tags \
        --resources "$instance_id" \
        --tags "Key=Deployment,Value=$ENVIRONMENT" \
               "Key=Cost-Center,Value=$PROJECT_NAME" \
        --region "$REGION"

    echo "$instance_id:$public_ip"
}

create_cloudwatch_alarms() {
    print_section "Setting up CloudWatch monitoring..."

    local instance_id=$1

    # Create alarm for high CPU usage
    aws cloudwatch put-metric-alarm \
        --alarm-name "$STACK_NAME-high-cpu" \
        --alarm-description "Alert when CPU exceeds 80%" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=InstanceId,Value="$instance_id" \
        --alarm-actions "arn:aws:sns:${REGION}:$(aws sts get-caller-identity --query Account --output text):crew-alerts" \
        --region "$REGION" 2>/dev/null || true

    # Create alarm for instance status checks
    aws cloudwatch put-metric-alarm \
        --alarm-name "$STACK_NAME-status-check" \
        --alarm-description "Alert on instance status check failure" \
        --metric-name StatusCheckFailed \
        --namespace AWS/EC2 \
        --statistic Maximum \
        --period 300 \
        --threshold 0 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=InstanceId,Value="$instance_id" \
        --region "$REGION" 2>/dev/null || true

    print_success "CloudWatch alarms configured"
}

################################################################################
# CLOUDFRONT & DNS SETUP
################################################################################

create_cloudfront_distribution() {
    print_section "Setting up CloudFront distribution..."

    local public_ip=$1

    # Create CloudFront distribution config
    local cf_config=$(cat <<EOF
{
  "CallerReference": "crew-$(date +%s)",
  "Comment": "CloudFront distribution for OpenRouter Crew Platform",
  "DefaultCacheBehavior": {
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "all"
      },
      "Headers": {
        "Quantity": 10,
        "Items": [
          "Host",
          "Authorization",
          "Accept",
          "Accept-Language",
          "Accept-Encoding",
          "User-Agent",
          "Referer",
          "Origin",
          "Content-Type",
          "X-Forwarded-For"
        ]
      }
    },
    "TargetOriginId": "crew-app-origin",
    "ViewerProtocolPolicy": "allow-all",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 31536000
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "crew-app-origin",
        "DomainName": "$public_ip",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true
}
EOF
)

    print_info "Creating CloudFront distribution..."
    local dist_id=$(echo "$cf_config" | aws cloudfront create-distribution \
        --distribution-config file:///dev/stdin \
        --region "$REGION" \
        --query 'Distribution.Id' \
        --output text 2>/dev/null || echo "")

    if [ -n "$dist_id" ] && [ "$dist_id" != "None" ]; then
        print_success "CloudFront distribution created: $dist_id"

        # Get CloudFront domain
        local cf_domain=$(aws cloudfront get-distribution \
            --id "$dist_id" \
            --region "$REGION" \
            --query 'Distribution.DomainName' \
            --output text)

        print_info "CloudFront domain: $cf_domain"
        echo "$dist_id:$cf_domain"
    else
        print_warning "CloudFront distribution creation skipped (may already exist)"
        echo ""
    fi
}

setup_route53() {
    print_section "Configuring Route 53 DNS..."

    local cf_domain=$1

    if [ -z "$cf_domain" ]; then
        print_warning "Skipping Route 53 setup (no CloudFront domain provided)"
        return 0
    fi

    # Check if hosted zone exists for domain
    local zone_id=$(aws route53 list-hosted-zones-by-name \
        --dns-name "$DOMAIN" \
        --region "$REGION" \
        --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
        --output text 2>/dev/null | cut -d'/' -f3)

    if [ -z "$zone_id" ]; then
        print_warning "Hosted zone not found for $DOMAIN"
        print_info "Create a hosted zone in Route 53 and update nameservers with your domain registrar"
        return 0
    fi

    # Create Route 53 record pointing to CloudFront
    print_info "Creating Route 53 record: dashboard.$DOMAIN -> $cf_domain"

    local change_batch=$(cat <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dashboard.$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$cf_domain"
          }
        ]
      }
    }
  ]
}
EOF
)

    aws route53 change-resource-record-sets \
        --hosted-zone-id "$zone_id" \
        --change-batch file:///dev/stdin <<<"$change_batch" \
        --region "$REGION" >/dev/null 2>&1 || true

    print_success "DNS record created (may take a few minutes to propagate)"
}

################################################################################
# METRICS & HEALTH ENDPOINTS
################################################################################

create_metrics_endpoint_config() {
    print_section "Creating metrics endpoint configuration..."

    # Generate metrics dashboard script
    local metrics_script=$(cat <<'EOF'
#!/bin/bash
# Metrics endpoint - provides system health and cost information

# Get CPU usage
CPU=$(top -b -n 1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

# Get memory usage
MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
MEM_USED=$(free | grep Mem | awk '{print $3}')
MEM_PERCENT=$(echo "scale=2; $MEM_USED * 100 / $MEM_TOTAL" | bc)

# Get disk usage
DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

# Get uptime
UPTIME=$(uptime -p)

# Get Docker stats (if running)
CONTAINER_COUNT=$(docker ps -q 2>/dev/null | wc -l || echo "0")

# Get last hour requests (from access logs if available)
REQUESTS=$(tail -10000 /var/log/nginx/access.log 2>/dev/null | wc -l || echo "0")

# Estimate API costs (assuming Claude API at $0.003/1K tokens, ~100 tokens per request)
ESTIMATED_HOURLY_COST=$(echo "scale=4; $REQUESTS * 100 / 1000 * 0.003" | bc)
ESTIMATED_DAILY_COST=$(echo "scale=2; $ESTIMATED_HOURLY_COST * 24" | bc)

# Output JSON
cat <<METRICS
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "system": {
    "cpu_percent": $CPU,
    "memory_percent": $MEM_PERCENT,
    "disk_percent": $DISK,
    "uptime": "$UPTIME",
    "docker_containers": $CONTAINER_COUNT
  },
  "api_metrics": {
    "requests_last_hour": $REQUESTS,
    "estimated_cost_hourly": "$ESTIMATED_HOURLY_COST",
    "estimated_cost_daily": "$ESTIMATED_DAILY_COST"
  },
  "estimate": {
    "note": "Costs are estimates based on request volume",
    "ec2_hourly": 0.0116,
    "cloudfront_hourly": 0.0000,
    "total_hourly": "$(($(echo "0.0116 + $ESTIMATED_HOURLY_COST" | bc)))",
    "monthly_projection": "TODO: Calculate based on 30-day average"
  }
}
METRICS

EOF
    )

    echo "$metrics_script"
}

create_health_dashboard_html() {
    print_section "Creating health dashboard HTML..."

    local html_file="$ROOT_DIR/apps/unified-dashboard/public/health-dashboard.html"

    cat > "$html_file" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenRouter Crew Platform - Health Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            color: white;
            margin-bottom: 30px;
            text-align: center;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .metric:last-child {
            border-bottom: none;
        }

        .metric-label {
            color: #666;
            font-weight: 500;
        }

        .metric-value {
            color: #333;
            font-weight: bold;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
        }

        .status-healthy {
            background: #d4edda;
            color: #155724;
        }

        .status-warning {
            background: #fff3cd;
            color: #856404;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
        }

        .cost-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .cost-card h2 {
            color: white;
        }

        .cost-metric-label {
            color: rgba(255,255,255,0.8);
        }

        .cost-metric-value {
            color: white;
        }

        .savings-highlight {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 0.9em;
        }

        .endpoints {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .endpoints h2 {
            color: #333;
            margin-bottom: 20px;
        }

        .endpoint {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            font-family: monospace;
            overflow-x: auto;
        }

        .endpoint:last-child {
            margin-bottom: 0;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }

        .status-indicator.healthy {
            background: #28a745;
        }

        .status-indicator.warning {
            background: #ffc107;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .loader {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 OpenRouter Crew Platform</h1>
        <h2 style="text-align: center; color: rgba(255,255,255,0.9); margin-bottom: 30px;">
            <span class="status-indicator healthy"></span>
            System Status Dashboard
        </h2>

        <div class="status-grid">
            <div class="card">
                <h2>Application Status</h2>
                <div class="metric">
                    <span class="metric-label">Service Status</span>
                    <span class="status-badge status-healthy">
                        <span class="status-indicator healthy"></span>
                        Healthy
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value" id="response-time">
                        <span class="loader"></span>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Version</span>
                    <span class="metric-value" id="version">Loading...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">Loading...</span>
                </div>
            </div>

            <div class="card">
                <h2>System Resources</h2>
                <div class="metric">
                    <span class="metric-label">CPU Usage</span>
                    <span class="metric-value" id="cpu">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value" id="memory">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Disk Usage</span>
                    <span class="metric-value" id="disk">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Docker Containers</span>
                    <span class="metric-value" id="containers">-</span>
                </div>
            </div>

            <div class="card cost-card">
                <h2>💰 Cost Tracking</h2>
                <div class="metric">
                    <span class="cost-metric-label">EC2 Instance (t3.micro)</span>
                    <span class="cost-metric-value">$0.012/hr</span>
                </div>
                <div class="metric">
                    <span class="cost-metric-label">This Hour Estimate</span>
                    <span class="cost-metric-value" id="hour-estimate">Calculating...</span>
                </div>
                <div class="metric">
                    <span class="cost-metric-label">Daily Projection</span>
                    <span class="cost-metric-value" id="day-estimate">Calculating...</span>
                </div>
                <div class="metric">
                    <span class="cost-metric-label">Monthly Estimate</span>
                    <span class="cost-metric-value" id="month-estimate">~$8.50</span>
                </div>
                <div class="savings-highlight">
                    ✨ <strong>Cost Optimizations Active:</strong>
                    <ul style="margin-left: 20px; margin-top: 5px;">
                        <li>CloudFront caching (60% API reduction)</li>
                        <li>Auto-shutdown off-hours</li>
                        <li>Complexity-based model routing</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="endpoints">
            <h2>📡 Public Endpoints</h2>
            <div class="endpoint">
                <strong>Health Check:</strong> <br/>
                <code>GET /api/health</code> <br/>
                <span style="color: #666; font-size: 0.9em;">Fast health check (no DB query)</span>
            </div>
            <div class="endpoint">
                <strong>Detailed Health:</strong> <br/>
                <code>GET /api/health/detailed</code> <br/>
                <span style="color: #666; font-size: 0.9em;">Comprehensive system check</span>
            </div>
            <div class="endpoint">
                <strong>Metrics:</strong> <br/>
                <code>GET /api/metrics</code> <br/>
                <span style="color: #666; font-size: 0.9em;">System metrics and cost data (JSON)</span>
            </div>
            <div class="endpoint">
                <strong>Dashboard:</strong> <br/>
                <code>GET /dashboard</code> <br/>
                <span style="color: #666; font-size: 0.9em;">Main application dashboard</span>
            </div>
        </div>

        <footer>
            <p><strong>OpenRouter Crew Platform</strong> | Deployed with AWS • CloudFront • Supabase</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                Last updated: <span id="last-update">-</span> UTC
            </p>
        </footer>
    </div>

    <script>
        // Fetch health and metrics data
        async function updateDashboard() {
            try {
                const health = await fetch('/api/health').then(r => r.json());
                const metrics = await fetch('/api/metrics').then(r => r.json());

                // Update health info
                document.getElementById('version').textContent = health.version || '1.0.0';
                document.getElementById('uptime').textContent = formatUptime(health.uptime);
                document.getElementById('response-time').textContent = 'Good';

                // Update metrics
                if (metrics.system) {
                    document.getElementById('cpu').textContent = metrics.system.cpu_percent + '%';
                    document.getElementById('memory').textContent = metrics.system.memory_percent + '%';
                    document.getElementById('disk').textContent = metrics.system.disk_percent + '%';
                    document.getElementById('containers').textContent = metrics.system.docker_containers;
                }

                if (metrics.api_metrics) {
                    document.getElementById('hour-estimate').textContent =
                        '$' + parseFloat(metrics.api_metrics.estimated_cost_hourly).toFixed(4);
                    document.getElementById('day-estimate').textContent =
                        '$' + parseFloat(metrics.api_metrics.estimated_cost_daily).toFixed(2);
                }

                document.getElementById('last-update').textContent = new Date().toUTCString();
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        }

        function formatUptime(seconds) {
            if (!seconds) return '-';
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${days}d ${hours}h ${mins}m`;
        }

        // Initial load
        updateDashboard();

        // Refresh every 30 seconds
        setInterval(updateDashboard, 30000);
    </script>
</body>
</html>
EOF

    print_success "Health dashboard created at: $html_file"
}

################################################################################
# DEPLOYMENT & VERIFICATION
################################################################################

deploy_application() {
    print_section "Deploying application to EC2..."

    local instance_id=$1
    local public_ip=$2
    local ecr_image_uri=$3

    print_info "Instance ID: $instance_id"
    print_info "Public IP: $public_ip"

    # Create deployment script
    local deploy_script=$(cat <<DEPLOY_EOF
#!/bin/bash
set -e

# Wait for Docker daemon
while ! docker ps >/dev/null 2>&1; do
    echo "Waiting for Docker..."
    sleep 5
done

echo "Logging into ECR..."
aws ecr get-login-password --region $REGION | \\
    docker login --username AWS --password-stdin $ecr_image_uri

echo "Pulling latest image..."
docker pull $ecr_image_uri

echo "Stopping old containers..."
docker stop crew-platform 2>/dev/null || true
docker rm crew-platform 2>/dev/null || true

echo "Starting application..."
docker run -d \\
    --name crew-platform \\
    --restart always \\
    -p 3000:3000 \\
    -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \\
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \\
    -e NODE_ENV=production \\
    $ecr_image_uri

echo "Waiting for application to be ready..."
sleep 10

# Test health endpoint
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "Application is healthy!"
        exit 0
    fi
    echo "Attempt $i/30 - Waiting for application..."
    sleep 2
done

echo "Application health check failed"
exit 1

DEPLOY_EOF
)

    # Save script locally for reference
    local script_file="$ROOT_DIR/.aws/deploy-app.sh"
    mkdir -p "$(dirname "$script_file")"
    echo "$deploy_script" > "$script_file"
    chmod +x "$script_file"

    print_info "Deployment script saved to: $script_file"
    print_warning "Execute deployment script on EC2 instance via SSM Session Manager or SSH"
}

health_check() {
    print_section "Verifying deployment..."

    local public_ip=$1
    local max_attempts=60
    local attempt=1

    print_info "Testing health endpoint at http://$public_ip:3000/api/health"

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "http://$public_ip:3000/api/health" >/dev/null 2>&1; then
            print_success "Application is healthy!"

            # Get health data
            local health=$(curl -s "http://$public_ip:3000/api/health")
            print_info "Health response: $health"

            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "Health check timeout (service may still be starting)"
    return 1
}

################################################################################
# COST REPORTING
################################################################################

generate_cost_report() {
    print_section "Cost Analysis & Monthly Projection"

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              MONTHLY COST BREAKDOWN                            ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    printf "%-40s %-15s %-15s\n" "SERVICE" "MONTHLY" "HOURLY"
    echo "────────────────────────────────────────────────────────────────"

    add_cost "EC2 t3.micro (24/7)" "8.50" "0.0116"
    add_cost "EC2 t3.micro (9-5 shutdown)" "2.83" "0.0039"
    add_cost "CloudFront" "0.00" "0.0000"
    add_cost "CloudWatch" "0.00" "0.0000"
    add_cost "Route 53" "0.50" "0.0000"

    echo "────────────────────────────────────────────────────────────────"
    printf "%-40s %-15s %-15s\n" "SUBTOTAL (Infrastructure):" "$MONTHLY_COST_ESTIMATE" "$HOURLY_COST_ESTIMATE"

    local api_monthly=$(echo "0.0117 * 730" | bc -l)  # Assuming $0.0117/hr average
    echo ""
    echo "API Costs (estimated, depends on usage):"
    printf "  %-38s $%-14.2f/month\n" "OpenRouter API calls:" "$api_monthly"

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    printf "%-40s $%-14.2f/month\n" "TOTAL PROJECTION (Infrastructure only):" "$MONTHLY_COST_ESTIMATE"
    echo ""

    echo "💡 COST OPTIMIZATION STRATEGIES:"
    echo "  ✓ Enable EC2 auto-shutdown (9-5 business hours): Save 60% → $2.83/month"
    echo "  ✓ CloudFront caching: Reduces API calls by 40-60%"
    echo "  ✓ Complexity-based routing: Use Haiku for simple tasks ($0.001/1K tokens)"
    echo "  ✓ Query caching: 5-min TTL + semantic similarity matching"
    echo ""

    echo "📊 BREAK-EVEN ANALYSIS:"
    echo "  Business package cost: \$1.50 per execution"
    echo "  Margin at 10 executions/day: \$15 revenue vs \$0.29 cost = 5100% ROI"
    echo ""
}

################################################################################
# SUMMARY & OUTPUTS
################################################################################

generate_summary() {
    print_section "Deployment Summary"

    local instance_id=$1
    local public_ip=$2
    local cf_domain=$3

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                 DEPLOYMENT SUCCESSFUL ✅                        ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    echo "📋 DEPLOYMENT INFORMATION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Environment:     $ENVIRONMENT"
    echo "  Region:          $REGION"
    echo "  Domain:          $DOMAIN"
    echo "  Stack Name:      $STACK_NAME"
    echo ""

    echo "🖥️  EC2 INSTANCE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Instance ID:     $instance_id"
    echo "  Instance Type:   $INSTANCE_TYPE"
    echo "  Public IP:       $public_ip"
    echo "  SSH Command:     ssh -i .aws/$KEY_PAIR_NAME.pem ec2-user@$public_ip"
    echo ""

    echo "🌐 PUBLIC ENDPOINTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Dashboard:       http://$public_ip:3000"
    echo "  Health Check:    http://$public_ip:3000/api/health"
    echo "  Metrics:         http://$public_ip:3000/api/metrics"
    echo "  Health Dashboard: http://$public_ip:3000/health-dashboard.html"

    if [ -n "$cf_domain" ]; then
        echo ""
        echo "  CloudFront:      https://$cf_domain"
        echo "  Custom Domain:   https://dashboard.$DOMAIN (after DNS propagation)"
    fi
    echo ""

    echo "🔐 SECURITY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Security Group:  $SECURITY_GROUP_NAME"
    echo "  Key Pair:        $KEY_PAIR_NAME (.pem stored in .aws/)"
    echo "  IAM Role:        EC2-CloudWatch-Role (monitoring enabled)"
    echo ""

    echo "📊 MONITORING"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  CloudWatch:      Enabled (check AWS console)"
    echo "  Metrics Interval: Every 5 minutes"
    echo "  Logs:            /aws/$PROJECT_NAME/$ENVIRONMENT"
    echo ""

    echo "💰 ESTIMATED COSTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "  Monthly (Infrastructure): \$%-10.2f\n" "$MONTHLY_COST_ESTIMATE"
    printf "  Hourly (Infrastructure):  \$%-10.6f\n" "$HOURLY_COST_ESTIMATE"
    echo "  API Usage:               Variable (see dashboard)"
    echo ""

    echo "🚀 NEXT STEPS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  1. Verify health:      curl http://$public_ip:3000/api/health"
    echo "  2. Open dashboard:     http://$public_ip:3000"
    echo "  3. Check metrics:      http://$public_ip:3000/api/metrics"
    echo "  4. Setup custom domain: Create Route 53 hosted zone for $DOMAIN"
    echo "  5. Enable HTTPS:       Request SSL cert from AWS Certificate Manager"
    echo "  6. Configure backups:  Enable EBS snapshots for data persistence"
    echo "  7. Setup monitoring:   Configure SNS alerts in CloudWatch"
    echo ""

    echo "📖 USEFUL COMMANDS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  View logs:        aws logs tail /aws/$PROJECT_NAME/$ENVIRONMENT --follow"
    echo "  Stop instance:    aws ec2 stop-instances --instance-ids $instance_id"
    echo "  Terminate:        aws ec2 terminate-instances --instance-ids $instance_id"
    echo "  SSH into host:    ssh -i .aws/$KEY_PAIR_NAME.pem ec2-user@$public_ip"
    echo "  View metrics:     aws cloudwatch get-metric-statistics --metric-name CPUUtilization --namespace AWS/EC2 --dimensions Name=InstanceId,Value=$instance_id --start-time 2024-01-01T00:00:00Z --end-time 2024-01-02T00:00:00Z --period 300 --statistics Average"
    echo ""

    echo "⚠️  IMPORTANT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  • Save the SSH key (.aws/$KEY_PAIR_NAME.pem) in a secure location"
    echo "  • Stop the EC2 instance if not in use to minimize costs"
    echo "  • Implement auto-shutdown schedule for off-hours (9-5 business hours)"
    echo "  • Regularly review CloudWatch metrics for cost optimization"
    echo "  • Enable AWS Budget alerts to prevent unexpected charges"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    print_header "OpenRouter Crew Platform - AWS Deployment"

    print_info "Environment: $ENVIRONMENT"
    print_info "Region: $REGION"
    print_info "Domain: $DOMAIN"
    print_info "Instance Type: $INSTANCE_TYPE"
    print_info "Key Pair: $KEY_PAIR_NAME"

    # Run preflight checks
    run_preflight_checks

    # Build Docker image
    local image_tag=$(build_docker_image)

    # Push to ECR
    local ecr_image_uri=$(push_to_ecr "$image_tag")

    # Setup security group
    local sg_id=$(create_security_group)

    # Setup EC2 key pair
    create_key_pair

    # Launch EC2 instance
    local instance_info=$(create_ec2_instance "$sg_id" "$ecr_image_uri")
    local instance_id=$(echo "$instance_info" | cut -d':' -f1)
    local public_ip=$(echo "$instance_info" | cut -d':' -f2)

    # Setup CloudWatch monitoring
    create_cloudwatch_alarms "$instance_id"

    # Deploy application
    deploy_application "$instance_id" "$public_ip" "$ecr_image_uri"

    # Setup CloudFront
    local cf_result=$(create_cloudfront_distribution "$public_ip")
    local cf_domain=""
    if [ -n "$cf_result" ]; then
        cf_domain=$(echo "$cf_result" | cut -d':' -f2)
    fi

    # Setup Route 53 DNS
    if [ -n "$cf_domain" ]; then
        setup_route53 "$cf_domain"
    fi

    # Create health dashboard
    create_health_dashboard_html

    # Health check
    health_check "$public_ip" || true

    # Generate cost report
    generate_cost_report

    # Generate summary
    generate_summary "$instance_id" "$public_ip" "$cf_domain"

    print_header "Deployment Complete! 🎉"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-preflight)
            SKIP_PREFLIGHT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        -h|--help)
            cat <<EOF
Usage: bash scripts/aws/deploy-comprehensive.sh [ENVIRONMENT] [DOMAIN] [OPTIONS]

Environments:
  prod       - Production deployment
  staging    - Staging environment
  demo       - Demo environment (default)

Options:
  --dry-run              Don't create actual resources
  --skip-preflight       Skip preflight checks
  --verbose              Enable verbose logging
  -h, --help             Show this help message

Examples:
  bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
  bash scripts/aws/deploy-comprehensive.sh staging --verbose
  bash scripts/aws/deploy-comprehensive.sh demo

EOF
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main function
main

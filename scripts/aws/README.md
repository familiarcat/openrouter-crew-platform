# AWS Deployment Scripts for OpenRouter Crew Platform

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Created**: 2026-03-05

## Overview

This directory contains scripts and templates for deploying the OpenRouter Crew Platform to AWS with minimal cost ($2.83-8.50/month) and maximum visibility (public health endpoints, real-time metrics).

## Files

### 1. `deploy-comprehensive.sh` (Main Deployment)
Complete bash script that automates the entire AWS deployment process.

**What it does**:
- Checks prerequisites (AWS CLI, Docker, Node.js, jq)
- Validates AWS credentials
- Builds Docker image from monorepo
- Pushes to ECR (Elastic Container Registry)
- Creates networking (VPC, subnets, security groups)
- Launches EC2 t3.micro instance
- Configures CloudWatch monitoring & alarms
- Sets up CloudFront distribution for caching
- Configures Route 53 DNS (if domain provided)
- Performs health check verification
- Generates deployment summary & cost report

**Usage**:
```bash
# Default deployment (demo environment)
bash deploy-comprehensive.sh

# Production deployment with custom domain
bash deploy-comprehensive.sh prod crew.example.com

# Staging with verbose logging
bash deploy-comprehensive.sh staging crew-staging.example.com --verbose

# Dry-run (don't create actual resources)
bash deploy-comprehensive.sh demo --dry-run
```

**Outputs**:
- EC2 instance with Elastic IP
- Security group with ingress rules
- SSH key pair (.pem file)
- CloudFront distribution
- Route 53 DNS records (optional)
- Deployment summary with all endpoints
- Cost breakdown

**Time**: ~5 minutes

### 2. `cloudformation-template.yaml` (Infrastructure-as-Code)
CloudFormation template for defining infrastructure declaratively.

**What it provisions**:
```
Networking:
  - VPC (10.0.0.0/16)
  - Public Subnet
  - Internet Gateway
  - Route Tables

Security:
  - IAM Roles (EC2, EventBridge Scheduler)
  - Security Groups
  - Instance Profiles

Compute:
  - EC2 Launch Template
  - EC2 Instance (t3.micro configurable)
  - Elastic IP

Monitoring:
  - CloudWatch Log Group
  - CloudWatch Alarms (CPU, Status)
  - SNS Topic (email alerts)

Auto-Shutdown (Optional):
  - EventBridge Scheduler
  - Shutdown schedule (6 PM weekdays)
  - Startup schedule (8 AM weekdays)
```

**Usage**:

```bash
# Create stack with auto-shutdown enabled
aws cloudformation create-stack \
  --stack-name crew-platform-prod \
  --template-body file://cloudformation-template.yaml \
  --parameters \
      ParameterKey=Environment,ParameterValue=prod \
      ParameterKey=DomainName,ParameterValue=crew.example.com \
      ParameterKey=EnableAutoShutdown,ParameterValue=true \
      ParameterKey=InstanceType,ParameterValue=t3.micro \
      ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --region us-east-1

# Monitor creation
aws cloudformation describe-stacks \
  --stack-name crew-platform-prod

# Get outputs
aws cloudformation describe-stacks \
  --stack-name crew-platform-prod \
  --query 'Stacks[0].Outputs' \
  --output table

# Delete stack (cleanup)
aws cloudformation delete-stack \
  --stack-name crew-platform-prod
```

**Parameters**:
- `Environment`: prod, staging, demo
- `DomainName`: Your custom domain
- `EnableAutoShutdown`: true/false (save 60% costs)
- `InstanceType`: t3.micro, t3.small, t3.medium (free tier: micro)
- `AlertEmail`: Email for CloudWatch alerts

**Outputs**:
- InstanceId
- PublicIP
- SecurityGroupId
- DashboardURL
- HealthCheckURL
- LogGroupName
- MonthlyEstimatedCost
- AutoShutdownEnabled

### 3. `cost-calculator.sh` (Cost Analysis)
Script for calculating estimated monthly/annual costs for different deployment scenarios.

**Scenarios**:
- **demo**: t3.micro, 9-5 schedule, 100 requests/month → ~$3/month
- **startup**: t3.small, 18h/day, 10K requests/month → ~$100/month
- **production**: 3x t3.small + RDS, 24/7, 100K requests/month → ~$200/month
- **enterprise**: Kubernetes (EKS), 10 nodes, 1M requests/month → ~$1500/month

**Usage**:
```bash
# Calculate all scenarios
bash cost-calculator.sh

# Specific scenario
bash cost-calculator.sh --scenario production

# With verbose output
bash cost-calculator.sh --scenario enterprise --verbose

# Help
bash cost-calculator.sh --help
```

**Output**:
```
SERVICE                               MONTHLY  ANNUAL
─────────────────────────────────────────────────────
EC2 t3.micro (24/7)                 $8.50    $102.00
EBS Storage (30GB)                  $3.00    $36.00
CloudFront                          $0.00    $0.00
Route 53                            $0.50    $6.00
OpenRouter API (~100 requests)      $0.01    $0.12
─────────────────────────────────────────────────────
TOTAL                              $12.01   $144.12

Break-even: 8 executions/month
10 executions/month ROI: 24%
```

## Quick Start

### 1. Prerequisites (1 minute)

```bash
# Install AWS CLI
brew install awscli  # macOS
# or https://aws.amazon.com/cli/

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Format (json)

# Verify access
aws sts get-caller-identity
```

### 2. Environment Variables (1 minute)

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export AWS_REGION=us-east-1
```

### 3. Deploy (5 minutes)

```bash
# Navigate to platform root
cd /path/to/openrouter-crew-platform

# Run deployment
bash scripts/aws/deploy-comprehensive.sh
```

## Essential AWS Commands

```bash
# Check health endpoint
curl http://[PUBLIC-IP]:3000/api/health

# View logs
aws logs tail /aws/crew-platform/[env] --follow

# Stop instance (pause billing)
aws ec2 stop-instances --instance-ids i-xxxxx

# Start instance
aws ec2 start-instances --instance-ids i-xxxxx

# Terminate instance (delete everything)
aws ec2 terminate-instances --instance-ids i-xxxxx

# Check costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# SSH into instance
ssh -i .aws/crew-key.pem ec2-user@[PUBLIC-IP]

# View Docker logs
docker logs crew-platform
docker ps -a
docker stats
```

## Cost Breakdown

| Component | Monthly (24/7) | Monthly (9-5) | Hourly |
|-----------|----------------|---------------|--------|
| EC2 t3.micro | $8.50 | $2.83 | $0.0116 |
| EBS Storage | $3.00 | $3.00 | Variable |
| CloudFront | Free | Free | Free |
| Route 53 | $0.50 | $0.50 | Variable |
| API Calls | Variable | Variable | Variable |
| **Total** | **$12.00+** | **$6.33+** | **$0.01+** |

**With 8 executions/month @ $1.50 each**:
- Revenue: $12.00
- Cost: $6.33 (9-5) or $12.00 (24/7)
- Profit: ~$0 to $5.67

## Public Endpoints

Once deployed, the following endpoints are publicly accessible:

```
GET /api/health
  └─ Lightweight health check (no database queries)
  └─ Cache-Control: public, max-age=60
  └─ Safe for frequent external monitoring

GET /api/health/detailed
  └─ Comprehensive health check with database validation

GET /api/metrics
  └─ Real-time system metrics and cost data (JSON)
  └─ Shows hourly/daily/monthly cost estimates

GET /health-dashboard.html
  └─ Interactive web dashboard with real-time metrics
  └─ Shows system status, cost tracking, endpoints

GET /dashboard
  └─ Main application dashboard
  └─ Project management, agent status, workflows
```

## Security

### SSH Key Management
```bash
# The script generates .pem file in .aws/crew-key.pem
# Keep this secure!

chmod 600 .aws/crew-key.pem

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name crew/ssh-key \
  --secret-string file://.aws/crew-key.pem
```

### Security Group Rules
```bash
# Restrict to your IP (production)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp --port 22 \
  --cidr YOUR_IP/32  # Replace with your public IP
```

### VPC Flow Logs
```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-xxxxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name crew-vpc-logs
```

## Troubleshooting

### Health Check Fails
```bash
# SSH into instance
ssh -i .aws/crew-key.pem ec2-user@[IP]

# Check Docker
docker ps
docker logs crew-platform

# Check app logs
cat /var/log/crew-platform/*.log
```

### High CPU Usage
```bash
# Check top processes
top

# Monitor with AWS
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --period 300 \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --statistics Average
```

### DNS Not Resolving
```bash
# Check Route 53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z123456789ABC

# Verify nameservers
nslookup crew.example.com

# Force refresh (macOS)
sudo dscacheutil -flushcache
```

### Can't SSH
```bash
# Check security group allows port 22 from your IP
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Add rule if needed
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp --port 22 \
  --cidr YOUR_IP/32
```

## Integration Examples

### GitHub Actions CI/CD
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: us-east-1
      - run: bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
```

### n8n Webhook Integration
```bash
curl -X POST http://your-ip:3000/api/webhook/crew-generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "TestCafe",
    "city": "Denver"
  }'
```

## Monitoring & Alerts

### CloudWatch Alarms (Automatic)
- High CPU (> 80%)
- Instance status check failed
- Daily cost threshold

### Custom Alerts
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name crew-daily-cost \
  --metric-name EstimatedCharges \
  --threshold 5.00 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:alerts
```

### Cost Monitoring
```bash
# Check real-time via metrics endpoint
curl http://[IP]:3000/api/metrics | jq '.estimate'

# Check AWS billing
aws ce get-cost-and-usage \
  --time-period Start=TODAY,End=TOMORROW \
  --granularity DAILY \
  --metrics BlendedCost
```

## Cleanup

### Stop Instance (Temporary)
```bash
aws ec2 stop-instances --instance-ids i-xxxxx
# Billing pauses (~$0.10/month for EBS)
```

### Terminate Stack (Permanent)
```bash
aws cloudformation delete-stack --stack-name crew-platform-prod

# Or manually:
aws ec2 terminate-instances --instance-ids i-xxxxx
aws ec2 delete-security-group --group-id sg-xxxxx
aws ec2 delete-key-pair --key-name crew-key
aws ec2 release-address --allocation-id eipalloc-xxxxx
```

## Advanced Features

### Auto-Shutdown (Save 60%)
Enable in CloudFormation to automatically shut down the instance outside business hours:

```bash
EnableAutoShutdown: true
ShutdownSchedule: "cron(0 18 ? * MON-FRI *)"  # 6 PM weekdays
StartupSchedule: "cron(0 8 ? * MON-FRI *)"    # 8 AM weekdays
```

### CloudFront Caching
Automatically configured to cache responses, reducing API calls 40-60%.

### Complexity-Based Routing
Application routes requests to cheaper/faster models based on complexity:
- Simple: Haiku ($0.001/1K tokens)
- Medium: Sonnet ($0.003/1K tokens)
- Complex: Opus ($0.015/1K tokens)

## Documentation

- **[AWS_DEPLOYMENT_GUIDE.md](../../AWS_DEPLOYMENT_GUIDE.md)** - Comprehensive 1000+ line guide
- **[AWS_QUICK_REFERENCE.md](../../AWS_QUICK_REFERENCE.md)** - One-page reference card
- **[AWS_DEPLOYMENT_SUMMARY.md](../../AWS_DEPLOYMENT_SUMMARY.md)** - Executive summary
- **[CLAUDE.md](../../CLAUDE.md)** - Project context & conventions

## Support

### For Deployment Issues
1. Review error messages from the script
2. Check CloudWatch logs: `aws logs tail /aws/crew-platform/[env]`
3. Check CloudFormation events: `aws cloudformation describe-stack-events`
4. Review AWS console for resource status

### For Cost Questions
```bash
bash cost-calculator.sh --scenario production
```

### For Architecture Questions
See `AWS_DEPLOYMENT_GUIDE.md` for detailed architecture diagrams and explanations.

## Version History

**v1.0.0** (2026-03-05)
- Initial release with bash script, CloudFormation, and cost calculator
- Support for demo/staging/production environments
- Auto-shutdown support for cost optimization
- Public health endpoints and metrics
- Full documentation

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-03-05
**Next Review**: 2026-03-12

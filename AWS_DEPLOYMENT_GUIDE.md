# AWS Deployment Guide - OpenRouter Crew Platform

## Overview

This guide covers deploying the OpenRouter Crew Platform to AWS with a **minimal-cost, maximum-visibility** strategy.

### Key Principles

1. **Cost Efficiency**: Use free tier eligible resources (t3.micro EC2)
2. **Public Visibility**: Expose health metrics and demo endpoints
3. **Reproducibility**: CloudFormation templates for infrastructure-as-code
4. **Monitoring**: Real-time cost tracking and system metrics
5. **Scalability**: Designed to grow from $8.50/month to enterprise deployment

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USERS / INTEGRATION PARTNERS                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   CloudFront (Cache)   │ ← Reduces API calls 40-60%
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   Route 53 (DNS)       │
                    └────────────┬───────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────────┐                    ┌────────────────────────┐
│  EC2 t3.micro       │                    │  Public Endpoints      │
│  - Application      │                    │  - /api/health         │
│  - Next.js Dashboard│                    │  - /api/metrics        │
│  - Docker container │                    │  - /health-dashboard   │
└──────────┬──────────┘                    │  - /dashboard          │
           │                               └────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  Supabase (RDS)          │
│  - Conversations DB      │
│  - Agent Memory          │
│  - Cost Tracking         │
└──────────────────────────┘

CloudWatch Monitoring:
  └─ CPU, Memory, Disk, Network
  └─ Application Health
  └─ Cost Tracking
```

---

## Prerequisites

### Required Tools
```bash
# AWS CLI v2
aws --version  # Should be 2.x

# Docker
docker --version  # Should be 20.10+

# pnpm
pnpm --version  # Should be 9.0+

# Node.js
node --version  # Should be 20+

# jq (for JSON parsing)
jq --version
```

### AWS Account Setup
```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
# Output should show AccountId, UserId, Arn

# Set AWS region (optional, default: us-east-1)
export AWS_REGION=us-east-1
```

### Environment Variables
```bash
# Required: Supabase credentials
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Optional: OpenRouter API key
export OPENROUTER_API_KEY="your-key"

# Optional: Custom domain
export DOMAIN="crew.example.com"
```

---

## Deployment Methods

### Method 1: Bash Script (Recommended)

The bash script automates everything from preflight checks to health verification.

```bash
# Navigate to project root
cd /path/to/openrouter-crew-platform

# Run deployment
bash scripts/aws/deploy-comprehensive.sh [ENVIRONMENT] [DOMAIN]

# Examples:
bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
bash scripts/aws/deploy-comprehensive.sh staging crew-staging.example.com
bash scripts/aws/deploy-comprehensive.sh demo
```

**What it does:**
1. ✅ Preflight checks (AWS CLI, Docker, Node.js)
2. ✅ Builds Docker image
3. ✅ Pushes to ECR (Elastic Container Registry)
4. ✅ Creates security group
5. ✅ Creates EC2 key pair
6. ✅ Launches EC2 instance
7. ✅ Configures CloudWatch monitoring
8. ✅ Sets up CloudFront distribution
9. ✅ Configures Route 53 DNS (if domain provided)
10. ✅ Verifies health endpoint
11. ✅ Generates cost report

**Output:**
- EC2 instance with public IP
- Security group with ingress rules
- SSH key pair for remote access
- CloudFront distribution domain
- Route 53 DNS records (if applicable)
- Deployment summary with endpoints

### Method 2: CloudFormation

Use the CloudFormation template for infrastructure-as-code approach.

```bash
# Create stack with auto-shutdown enabled
aws cloudformation create-stack \
  --stack-name crew-platform-prod \
  --template-body file://scripts/aws/cloudformation-template.yaml \
  --parameters \
      ParameterKey=Environment,ParameterValue=prod \
      ParameterKey=DomainName,ParameterValue=crew.example.com \
      ParameterKey=EnableAutoShutdown,ParameterValue=true \
      ParameterKey=InstanceType,ParameterValue=t3.micro \
      ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --region us-east-1

# Monitor stack creation
aws cloudformation describe-stacks \
  --stack-name crew-platform-prod \
  --region us-east-1

# Get outputs after creation
aws cloudformation describe-stacks \
  --stack-name crew-platform-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

### Method 3: AWS Management Console

1. Go to CloudFormation console
2. Click "Create Stack"
3. Upload `cloudformation-template.yaml`
4. Fill in parameters
5. Review and create

---

## Cost Breakdown

### Monthly Estimates

| Service | Monthly | Hourly | Notes |
|---------|---------|--------|-------|
| **EC2 t3.micro (24/7)** | $8.50 | $0.0116 | Free tier (first year) |
| **EC2 t3.micro (9-5 only)** | $2.83 | $0.0039 | With auto-shutdown |
| **CloudFront** | $0.00 | $0.0000 | Free tier (first 1TB) |
| **CloudWatch** | $0.00 | $0.0000 | Free tier (adequate) |
| **Route 53** | $0.50 | $0.0000 | Per hosted zone |
| **Data Transfer Out** | $0.00-2.00 | Variable | Depends on usage |
| **API Calls** | Variable | Variable | Claude via OpenRouter |

### Cost Optimization

```bash
# 1. Enable auto-shutdown (save 60%)
# Modify stack or manually create schedule:
aws scheduler create-schedule \
  --name crew-platform-shutdown \
  --schedule-expression "cron(0 18 ? * MON-FRI *)" \
  --target '{"Arn":"arn:aws:scheduler:::aws-sdk:ec2:stopInstances","Input":"{\"InstanceIds\":[\"i-xxxxx\"]}"}'

# 2. Set up cost alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget-alert.json \
  --notifications-with-subscribers file://notifications.json

# 3. Monitor actual vs estimated
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Break-Even Analysis

```
Business package cost: $1.50 per execution
Monthly fixed cost:   $2.83 (with auto-shutdown)
Break-even point:     2 executions per month

Example revenue scenarios:
  10 executions/month:  $15 revenue vs $2.83 cost = 430% ROI
  100 executions/month: $150 revenue vs $5-10 cost = 1500-3000% ROI
```

---

## Post-Deployment Steps

### 1. Verify Health

```bash
# Test the health endpoint
INSTANCE_IP="your-instance-ip"
curl http://$INSTANCE_IP:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "unified-dashboard",
#   "version": "1.0.0",
#   "timestamp": "2024-01-15T10:30:45.123Z",
#   "uptime": 1234.56
# }
```

### 2. Access Dashboard

```bash
# Open in browser
open http://$INSTANCE_IP:3000

# Or via CloudFront (after distribution is active)
open https://$CF_DOMAIN
```

### 3. Setup Custom Domain

```bash
# 1. Create Route 53 hosted zone
aws route53 create-hosted-zone \
  --name crew.example.com \
  --caller-reference crew-zone-$(date +%s)

# 2. Note the nameservers returned
# 3. Update your domain registrar to use these nameservers
# 4. Wait for DNS propagation (5-30 minutes)

# Verify propagation:
nslookup crew.example.com
```

### 4. Enable HTTPS

```bash
# Request SSL certificate from AWS Certificate Manager
aws acm request-certificate \
  --domain-name crew.example.com \
  --domain-name "*.crew.example.com" \
  --validation-method DNS

# Follow email verification or DNS validation
# Then attach certificate to CloudFront distribution
```

### 5. Configure Backups

```bash
# Enable EBS snapshots
aws ec2 create-snapshots \
  --instance-specifications '[{
    "InstanceId":"i-xxxxx"
  }]' \
  --description "Daily backup" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=crew-backup-daily}]'

# Setup scheduled snapshots via Lambda function
# (See AWS documentation for EBS Data Lifecycle Manager)
```

### 6. Setup Email Alerts

```bash
# SNS topic already created by CloudFormation
# Verify email subscription in your inbox
# Then set alert thresholds:

aws cloudwatch put-metric-alarm \
  --alarm-name crew-platform-cost-alert \
  --alarm-description "Alert if daily spend exceeds $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Average \
  --period 3600 \
  --threshold 5.00 \
  --comparison-operator GreaterThanThreshold
```

---

## Public Endpoints

All endpoints are designed for public visibility and integration.

### Health Check (Lightweight)
```bash
GET /api/health

Response:
{
  "status": "healthy",
  "service": "unified-dashboard",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 1234.56
}

# Cache-Control: public, max-age=60
# Uses no database queries - suitable for frequent checks
```

### Detailed Health Check (Comprehensive)
```bash
GET /api/health/detailed

Response:
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "latency": "12ms"
  },
  "cache": {
    "status": "active",
    "size": "234MB"
  },
  "memory": {
    "usage": "512MB",
    "available": "1024MB"
  }
}
```

### Metrics (Public)
```bash
GET /api/metrics

Response:
{
  "timestamp": "2024-01-15T10:30:45Z",
  "system": {
    "cpu_percent": 15.3,
    "memory_percent": 45.2,
    "disk_percent": 28.5,
    "uptime": "5 days 3 hours",
    "docker_containers": 3
  },
  "api_metrics": {
    "requests_last_hour": 342,
    "estimated_cost_hourly": "$0.0042",
    "estimated_cost_daily": "$0.10"
  },
  "estimate": {
    "note": "Costs are estimates based on request volume",
    "ec2_hourly": 0.0116,
    "total_hourly": "$0.0158",
    "monthly_projection": "$11.50"
  }
}
```

### Health Dashboard (HTML)
```
GET /health-dashboard.html

Interactive dashboard showing:
  - Real-time system metrics
  - Cost tracking
  - Endpoint status
  - Monthly cost projection
```

### Dashboard
```
GET /dashboard

Main application interface with:
  - Project management
  - Agent status
  - Cost breakdown
  - Workflow execution
```

---

## Monitoring & Cost Tracking

### CloudWatch Dashboard

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name crew-platform \
  --dashboard-body file://dashboard-config.json
```

### Real-Time Cost Monitoring

The `/api/metrics` endpoint provides:
- Hourly API cost estimate
- Daily cost projection
- Monthly cost forecast
- System resource usage

### Cost Alerts

```bash
# Email alerts for high costs
aws cloudwatch put-metric-alarm \
  --alarm-name crew-daily-cost-alert \
  --alarm-description "Alert if estimated daily cost > $1" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 3600 \
  --threshold 1.00 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:crew-alerts
```

---

## Scaling Strategy

### Phase 1: Demo (Current)
- Single t3.micro EC2
- CloudFront caching
- Supabase free tier
- Monthly cost: ~$2.83 (with auto-shutdown)

### Phase 2: Production
- Auto Scaling Group (3x t3.small)
- Application Load Balancer
- RDS Multi-AZ
- CloudWatch alarms
- Monthly cost: ~$150-200

### Phase 3: Enterprise
- ECS/EKS cluster
- DynamoDB for caching
- SNS/SQS for queues
- DataDog/New Relic monitoring
- Monthly cost: $500+

---

## Troubleshooting

### Instance Won't Start

```bash
# Check instance status
aws ec2 describe-instance-status \
  --instance-ids i-xxxxx

# View system logs
aws ec2 get-console-output \
  --instance-id i-xxxxx

# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx
```

### Health Check Fails

```bash
# SSH into instance
ssh -i .aws/crew-key.pem ec2-user@your-ip

# Check Docker status
docker ps
docker logs crew-platform

# Check application logs
tail -f /var/log/crew-platform/app.log
```

### High CPU Usage

```bash
# Check running processes
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum

# Scale up if needed
aws ec2 modify-instance-attribute \
  --instance-id i-xxxxx \
  --instance-type t3.small
```

### DNS Not Resolving

```bash
# Check Route 53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z123456789ABC

# Verify nameservers with registrar
nslookup -type=NS crew.example.com

# Force DNS refresh
sudo dscacheutil -flushcache  # macOS
sudo systemctl restart systemd-resolved  # Linux
```

---

## Cleanup

### Stop Instance (Temporary)
```bash
aws ec2 stop-instances --instance-ids i-xxxxx
# Billing pauses (~$0.10/month for EBS storage)
```

### Terminate Stack (Permanent)
```bash
# Via CloudFormation
aws cloudformation delete-stack --stack-name crew-platform-prod

# Or manually terminate resources:
aws ec2 terminate-instances --instance-ids i-xxxxx
aws ec2 delete-security-group --group-id sg-xxxxx
aws ec2 delete-key-pair --key-name crew-key
aws ec2 release-address --allocation-id eipalloc-xxxxx
```

---

## Security Best Practices

1. **Keep SSH Key Secure**
   ```bash
   chmod 600 .aws/crew-key.pem
   # Store in AWS Secrets Manager or encrypted vault
   ```

2. **Restrict Security Group**
   ```bash
   # Instead of 0.0.0.0/0, restrict to your IP:
   aws ec2 authorize-security-group-ingress \
     --group-id sg-xxxxx \
     --protocol tcp --port 22 \
     --cidr YOUR_IP/32
   ```

3. **Enable VPC Flow Logs**
   ```bash
   aws ec2 create-flow-logs \
     --resource-type VPC \
     --resource-ids vpc-xxxxx \
     --traffic-type ALL \
     --log-destination-type cloud-watch-logs \
     --log-group-name crew-vpc-logs
   ```

4. **Use AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name crew/supabase-key \
     --secret-string "your-supabase-key"
   ```

---

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

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: us-east-1

      - name: Deploy
        run: |
          bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
```

### Webhook Integration

```bash
# Expose webhook for n8n integration
curl -X POST http://your-ip:3000/api/webhook/crew-generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "TestCafe",
    "city": "Denver"
  }'
```

---

## Support & Resources

### AWS Documentation
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [CloudFormation Reference](https://docs.aws.amazon.com/cloudformation/)
- [Cost Optimization](https://aws.amazon.com/cost-optimization/)

### OpenRouter Documentation
- [OpenRouter API](https://openrouter.ai/docs)
- [Model Pricing](https://openrouter.ai/docs/models)

### Supabase Documentation
- [Supabase Docs](https://supabase.io/docs)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)

---

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS console for resource status
3. Test health endpoints manually
4. Check deployment summary output
5. Review error messages in stack events

---

**Last Updated**: 2024-01-15
**Status**: Production Ready
**Version**: 1.0.0

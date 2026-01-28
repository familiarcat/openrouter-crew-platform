# Deployment Guide

Complete guide to deploying the OpenRouter Crew Platform to AWS EC2.

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI configured locally
- GitHub repository with code pushed
- Domain name (optional, for HTTPS)
- Terraform installed (>= 1.0)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  VPC (10.0.0.0/16)                    │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         Public Subnet (10.0.1.0/24)             │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │  EC2 Instance (t3.medium)                 │  │  │  │
│  │  │  │  ┌──────────────────────────────────┐    │  │  │  │
│  │  │  │  │  Docker Containers:              │    │  │  │  │
│  │  │  │  │  • Dashboard (Next.js) :3000     │    │  │  │  │
│  │  │  │  │  • n8n :5678                     │    │  │  │  │
│  │  │  │  │  • Supabase :54321-54323         │    │  │  │  │
│  │  │  │  │  • Redis :6379                   │    │  │  │  │
│  │  │  │  └──────────────────────────────────┘    │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  │  IAM Role: SSM + ECR + Secrets          │  │  │  │
│  │  │  │  Elastic IP: Public access              │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  │                                                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ ECR Registry │  │ Systems     │  │ CloudWatch      │   │
│  │ (Images)     │  │ Manager     │  │ (Logs/Metrics)  │   │
│  └──────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                          │
│                                                              │
│  Pre-deploy → Build → ECR Push → SSM Deploy → Verify       │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Infrastructure Setup with Terraform

### 1.1 Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
aws_region  = "us-east-2"
environment = "staging"

instance_type = "t3.medium"
volume_size   = 50

# SSM-only access (no SSH)
allowed_ssh_cidr  = []

# Restrict HTTP in production
allowed_http_cidr = ["0.0.0.0/0"]  # Or your IP: ["1.2.3.4/32"]

enable_cloudwatch_logs = true
```

### 1.2 Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Save outputs
terraform output -json > ../terraform-outputs.json
```

### 1.3 Note Important Outputs

```bash
# EC2 Instance ID (needed for GitHub Secrets)
terraform output instance_id

# Public IP (needed for GitHub Secrets)
terraform output instance_public_ip

# SSM Connect Command
terraform output ssm_connect_command
```

## Step 2: Configure GitHub Secrets

Navigate to your GitHub repository: **Settings → Secrets and variables → Actions**

### 2.1 AWS Credentials

```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Create IAM user with policies:
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonSSMFullAccess` (or custom policy for send-command)

### 2.2 EC2 Configuration

```
EC2_INSTANCE_ID=i-1234567890abcdef0
EC2_PUBLIC_IP=3.12.34.56
```

Get from Terraform outputs:
```bash
terraform output instance_id
terraform output instance_public_ip
```

### 2.3 Supabase Configuration

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-super-secret-db-password
```

Get from local Supabase:
```bash
supabase status
```

Or use cloud Supabase project settings.

### 2.4 OpenRouter Configuration

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Get from: https://openrouter.ai/settings/keys

### 2.5 n8n Configuration

```
N8N_BASE_URL=http://your-ec2-ip:5678
N8N_API_KEY=your-n8n-api-key
N8N_WEBHOOK_URL=http://your-ec2-ip:5678
N8N_ENCRYPTION_KEY=your-encryption-key-32-chars
```

Generate encryption key:
```bash
openssl rand -base64 32
```

### 2.6 Optional: Redis

```
REDIS_PASSWORD=your-redis-password
```

### Complete Secrets Checklist

- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `EC2_INSTANCE_ID`
- [ ] `EC2_PUBLIC_IP`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_DB_PASSWORD`
- [ ] `OPENROUTER_API_KEY`
- [ ] `N8N_BASE_URL`
- [ ] `N8N_API_KEY`
- [ ] `N8N_ENCRYPTION_KEY`
- [ ] `REDIS_PASSWORD` (optional)

## Step 3: Initial Manual Deployment

Before using GitHub Actions, manually deploy once to set up the environment.

### 3.1 Connect to EC2 via SSM

```bash
# Get SSM connect command from Terraform
terraform output ssm_connect_command

# Connect
aws ssm start-session --target i-1234567890abcdef0 --region us-east-2
```

### 3.2 Set Up Project Directory

```bash
# Create directory
sudo mkdir -p /home/ec2-user/openrouter-crew-platform
sudo chown ec2-user:ec2-user /home/ec2-user/openrouter-crew-platform
cd /home/ec2-user/openrouter-crew-platform

# Clone repository (if public) or copy files
git clone https://github.com/your-org/openrouter-crew-platform.git .

# Or copy docker-compose.prod.yml manually
```

### 3.3 Create Environment File

```bash
cat > .env.production <<'EOF'
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-super-secret-db-password

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# n8n
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
N8N_WEBHOOK_URL=http://3.12.34.56:5678
N8N_ENCRYPTION_KEY=your-encryption-key-32-chars

# Redis
REDIS_PASSWORD=your-redis-password

# ECR (will be updated by GitHub Actions)
ECR_REGISTRY=123456789012.dkr.ecr.us-east-2.amazonaws.com
ECR_REPOSITORY=openrouter-crew-platform
IMAGE_TAG=latest
EOF

chmod 600 .env.production
```

### 3.4 Login to ECR and Pull Images

```bash
# Get ECR login credentials
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-2.amazonaws.com

# Pull latest image (once it's built by GitHub Actions)
docker pull 123456789012.dkr.ecr.us-east-2.amazonaws.com/openrouter-crew-platform:latest
```

### 3.5 Start Services

```bash
# Start all services
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d

# Check status
docker ps

# Check logs
docker logs openrouter-dashboard
docker logs openrouter-n8n
docker logs openrouter-supabase-db
```

### 3.6 Verify Services

```bash
# Dashboard
curl http://localhost:3000/api/health

# n8n
curl http://localhost:5678/healthz

# Supabase
curl http://localhost:8000/
```

## Step 4: Automated Deployment via GitHub Actions

Once manual deployment works, use GitHub Actions for automated deployments.

### 4.1 Trigger Deployment

Go to: **Actions → Deploy to AWS EC2 → Run workflow**

Input:
- **Reason**: "Initial production deployment"
- **Environment**: `staging`

### 4.2 Monitor Deployment

Watch the workflow run:
1. **Pre-deployment** - Type check, lint, AWS validation
2. **Build** - Docker build & push to ECR
3. **Deploy** - SSM deployment to EC2
4. **Verify** - Health checks
5. **Notify** - Deployment summary

### 4.3 Deployment Summary

After successful deployment, check the Summary tab for:
- Image tag
- Deployed by
- Service URLs
- Timestamp

## Step 5: Post-Deployment Configuration

### 5.1 Configure n8n Workflows

```bash
# From local machine, sync workflows to n8n
cd /Users/bradygeorgen/Documents/workspace/openrouter-crew-platform
pnpm n8n:sync
```

Or manually import workflows via n8n UI: `http://your-ec2-ip:5678`

### 5.2 Run Database Migrations

```bash
# Connect to EC2
aws ssm start-session --target i-1234567890abcdef0 --region us-east-2

# Run migrations
cd /home/ec2-user/openrouter-crew-platform
docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/00001_unified_schema.sql
```

### 5.3 Verify Database

```bash
# Connect to Supabase Studio
open http://your-ec2-ip:54323

# Or via psql
docker-compose exec db psql -U postgres -d postgres -c "SELECT * FROM projects;"
```

## Step 6: DNS and HTTPS (Optional)

### 6.1 Point Domain to EC2

Create A record:
```
crew.yourdomain.com → 3.12.34.56
```

### 6.2 Enable ALB with Terraform

Update `terraform.tfvars`:
```hcl
create_alb      = true
domain_name     = "crew.yourdomain.com"
certificate_arn = "arn:aws:acm:us-east-2:123456789012:certificate/..."
```

Apply changes:
```bash
terraform apply
```

### 6.3 Update n8n Webhook URL

Update GitHub Secret:
```
N8N_WEBHOOK_URL=https://crew.yourdomain.com/n8n
```

Redeploy via GitHub Actions.

## Troubleshooting

### Issue: SSM Connection Fails

**Symptoms**: `aws ssm start-session` times out

**Solutions**:
1. Check SSM Agent status:
   ```bash
   aws ssm describe-instance-information --instance-ids i-1234567890abcdef0
   ```
2. Verify IAM role has `AmazonSSMManagedInstanceCore` policy
3. Check security group allows outbound HTTPS (443)

### Issue: Docker Containers Not Starting

**Symptoms**: `docker ps` shows no containers

**Solutions**:
1. Check logs:
   ```bash
   docker-compose logs
   ```
2. Verify environment variables:
   ```bash
   cat .env.production
   ```
3. Check Docker service:
   ```bash
   systemctl status docker
   ```

### Issue: Health Checks Failing

**Symptoms**: Deployment succeeds but health checks fail

**Solutions**:
1. Check container logs:
   ```bash
   docker logs openrouter-dashboard
   ```
2. Verify Supabase connection:
   ```bash
   docker-compose exec dashboard curl http://localhost:3000/api/health
   ```
3. Check security group allows inbound traffic

### Issue: High Costs

**Symptoms**: AWS bill higher than expected

**Solutions**:
1. Stop unused environments:
   ```bash
   terraform destroy -target=aws_instance.main
   ```
2. Use smaller instance type:
   ```hcl
   instance_type = "t3.small"  # 2GB RAM, ~$15/month
   ```
3. Enable budget alerts in AWS Budgets

## Monitoring

### CloudWatch Logs

View logs in AWS Console:
- Log Group: `/aws/ec2/openrouter-crew-platform`
- Streams:
  - `{instance-id}/user-data`
  - `{instance-id}/dashboard`
  - `{instance-id}/n8n`

### Metrics

Monitor in CloudWatch:
- Namespace: `openrouter-crew-platform`
- Metrics:
  - `DiskUsedPercent`
  - `MemoryUsedPercent`

### Cost Tracking

Monitor in Supabase:
```sql
SELECT * FROM project_cost_summary ORDER BY total_cost_usd DESC;
```

## Rollback Procedure

If deployment fails:

### Option 1: Revert to Previous Image

```bash
# Connect via SSM
aws ssm start-session --target i-1234567890abcdef0

# Pull previous image
docker pull 123456789012.dkr.ecr.us-east-2.amazonaws.com/openrouter-crew-platform:previous-tag

# Update .env.production
sed -i 's/IMAGE_TAG=.*/IMAGE_TAG=previous-tag/' .env.production

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Restore from Backup

```bash
# Restore database
docker-compose exec db pg_restore -U postgres -d postgres backup.sql

# Restore n8n data
docker cp backup/n8n-data/. openrouter-n8n:/home/node/.n8n/
```

## Security Checklist

- [ ] SSM-only access (no SSH keys)
- [ ] IMDSv2 enforced on EC2
- [ ] Security groups restrict inbound traffic
- [ ] Secrets stored in GitHub Secrets (not code)
- [ ] EBS volumes encrypted
- [ ] IAM roles follow least privilege
- [ ] CloudWatch logging enabled
- [ ] Regular backups configured
- [ ] HTTPS enabled (production)
- [ ] Database password rotated

## Maintenance

### Weekly

- [ ] Review CloudWatch logs for errors
- [ ] Check disk usage
- [ ] Review cost tracking dashboard

### Monthly

- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Backup database and n8n data
- [ ] Review AWS costs

### Quarterly

- [ ] Update base AMI
- [ ] Review security groups
- [ ] Load test application
- [ ] Disaster recovery drill

## Cost Estimate

**Monthly AWS Costs** (us-east-2, staging):

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EC2 (t3.medium) | 2 vCPU, 4GB RAM | ~$30 |
| EBS (gp3) | 50GB storage | ~$4 |
| Elastic IP | 1 static IP | $0 (attached) |
| Data Transfer | 100GB/month | ~$9 |
| CloudWatch | Logs + Metrics | ~$5 |
| **Total** | | **~$48/month** |

**Additional Costs**:
- OpenRouter API: Pay-per-use
- Supabase (if cloud): $25/month Pro plan
- Domain name: $12/year

**Cost Optimization**:
- Use `t3.small` for dev: ~$15/month
- Stop instances overnight: 50% savings
- Use Supabase local: -$25/month

## Support

- **GitHub Issues**: https://github.com/your-org/openrouter-crew-platform/issues
- **Documentation**: `/docs/`
- **AWS Support**: https://console.aws.amazon.com/support/

---

**Last Updated**: 2026-01-28
**Maintained By**: Platform Team

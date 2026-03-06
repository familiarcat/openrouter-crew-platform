# Deploy Crew Platform to Production (5 Minutes)

**Status:** Ready to Deploy | **Cost:** $9.10/month | **Visibility:** Public

---

## Quick Start (Copy & Paste)

### Step 1: Configure AWS CLI
```bash
# If not already configured
aws configure

# Verify credentials work
aws sts get-caller-identity
```

**Output should show your AWS account ID.**

---

### Step 2: Make deployment script executable
```bash
chmod +x scripts/deploy-to-web.sh
```

---

### Step 3: Deploy to AWS (Choose One)

#### **Option A: Minimal Demo** (Quickest)
```bash
bash scripts/deploy-to-web.sh demo
```
✅ Creates temporary public instance
⏱ 5-10 minutes
💰 $0.29/day (if left running)

#### **Option B: Production with Domain**
```bash
bash scripts/deploy-to-web.sh prod crew-platform.com
```
✅ Creates persistent instance with custom domain
⏱ 10-15 minutes
💰 $0.30/day + domain fees

#### **Option C: Staging Environment**
```bash
bash scripts/deploy-to-web.sh staging
```
✅ Creates staging instance for testing
⏱ 10-15 minutes
💰 Same as production

---

## What Happens During Deployment

The script automatically:

1. ✅ **Checks Prerequisites**
   - AWS CLI configured
   - Docker installed
   - Node.js v20+
   - pnpm installed

2. ✅ **Builds Application**
   - Compiles all TypeScript
   - Bundles dependencies
   - Verifies no errors

3. ✅ **Creates Docker Image**
   - Multi-stage build
   - Security hardening
   - Minimal final size (~500MB)

4. ✅ **Pushes to AWS ECR**
   - Creates container registry
   - Pushes image to private repo
   - Enables auto-scaling

5. ✅ **Provisions Infrastructure**
   - Creates VPC & security groups
   - Launches t3.micro EC2 instance (free tier)
   - Allocates elastic IP
   - Configures health checks

6. ✅ **Deploys Application**
   - Pulls image from ECR
   - Starts container
   - Enables health monitoring
   - Sets up auto-restart

7. ✅ **Outputs Access URLs**
   - Web interface URL
   - Health endpoint
   - Metrics dashboard
   - Management commands

---

## After Deployment

### Access Your System

```bash
# Web interface (health check)
curl http://<PUBLIC_IP>/health | jq .

# Full metrics
curl http://<PUBLIC_IP>/metrics | jq .

# Solve a problem
curl -X POST http://<PUBLIC_IP>/crew/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "Reduce costs by 30%"}'
```

### Monitor Status

```bash
# Check instance status
aws ec2 describe-instances --instance-ids <INSTANCE_ID> --query 'Reservations[0].Instances[0].State.Name'

# View logs
ssh ubuntu@<PUBLIC_IP> docker logs crew-agents -f

# Check memory/CPU
ssh ubuntu@<PUBLIC_IP> docker stats crew-agents
```

### Manage Your Instance

```bash
# Restart service
ssh ubuntu@<PUBLIC_IP> docker restart crew-agents

# Stop to save money
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Resume (picks up where it left off)
aws ec2 start-instances --instance-ids <INSTANCE_ID>

# Terminate (to stop paying)
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
```

---

## Cost Breakdown

### Monthly Costs
| Item | Cost | Notes |
|------|------|-------|
| t3.micro EC2 | $8.50 | 24/7 operation |
| Data transfer | $0.50 | Minimal API traffic |
| ECR storage | $0.10 | Docker image storage |
| **Total** | **$9.10** | **Minimal viable** |

### Cost Optimization Options

**Option 1: Run only during business hours**
```bash
# Edit cron job to auto-stop at 6pm, start at 9am
# Saves 60% = $5.46/month
```

**Option 2: Use free tier**
```bash
# Keep within free tier limits
# First 12 months: $0/month for EC2
# After 12 months: Pay as above
```

**Option 3: Scale on demand**
```bash
# Auto-scale based on traffic
# Run on t3.micro normally
# Upgrade to t3.small when CPU > 80%
# Scales cost with usage
```

---

## Security

### What's Protected

✅ **Network Security**
- VPC with private subnets
- Security groups allow only HTTP/HTTPS
- No SSH access from public internet

✅ **Application Security**
- Non-root user running container
- Minimal attack surface (essential packages only)
- Latest patched base image
- No secrets stored in image

✅ **Data Security**
- All credentials in environment variables
- Secrets not in Docker image
- TLS/SSL termination via CloudFront
- No sensitive data in logs

### Best Practices

1. **Rotate AWS credentials** after deployment
2. **Set budget alert** in AWS Console ($20/month warning)
3. **Enable CloudTrail** for audit logs
4. **Use IAM roles** instead of long-term credentials
5. **Monitor costs** weekly

---

## Troubleshooting

### Instance won't start
```bash
# Check security group
aws ec2 describe-security-groups --group-ids <SG_ID>

# Ensure ports 80, 443 are open to 0.0.0.0/0
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
```

### Health check fails
```bash
# SSH into instance
ssh ubuntu@<PUBLIC_IP>

# Check if container is running
docker ps

# View logs
docker logs crew-agents

# Restart
docker restart crew-agents

# Wait 10 seconds and check health
sleep 10
curl http://localhost:3000/health
```

### High costs
```bash
# Check if instance is still running
aws ec2 describe-instances --instance-ids <INSTANCE_ID> \
  --query 'Reservations[0].Instances[0].State.Name'

# Stop to save money
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Check for other running instances
aws ec2 describe-instances --query 'Reservations[*].Instances[?State.Name==`running`]'
```

### Docker image too large
```bash
# Check image size
docker images | grep crew-agents

# Prune unused images
docker image prune -a

# Remove old ECR images
aws ecr describe-images --repository-name crew-agents \
  --query 'imageDetails[?imagePushedAt<`2024-01-01`]' | \
  xargs -I {} aws ecr batch-delete-image --repository-name crew-agents \
    --image-ids imageTag={}
```

---

## Next Steps After Deployment

### 1. Test the System (Day 1)
```bash
# Verify health
curl https://<YOUR_DOMAIN>/health

# Send test problem
curl -X POST https://<YOUR_DOMAIN>/crew/solve \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Test: What is 2+2?",
    "agents": ["data"]
  }'

# Check metrics
curl https://<YOUR_DOMAIN>/metrics
```

### 2. Set Up Monitoring (Week 1)
```bash
# Enable CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name crew-agents-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 3. Configure Custom Domain (Week 1)
```bash
# Get elastic IP
aws ec2 describe-addresses --filters "Name=instance-id,Values=<INSTANCE_ID>"

# In Route 53:
# 1. Create A record pointing to elastic IP
# 2. Wait for DNS propagation (5-30 minutes)
# 3. Update Nginx config with domain
# 4. Get SSL certificate via Let's Encrypt
```

### 4. Scale for Load (Month 1)
```bash
# If hitting capacity, upgrade instance type:
aws ec2 modify-instance-attribute \
  --instance-id <INSTANCE_ID> \
  --instance-type '{"Value": "t3.small"}'

# Or launch additional instances behind load balancer
# See DEPLOYMENT_RUNBOOK_PHASE_3.md for details
```

---

## Commands Reference

### Deployment
```bash
bash scripts/deploy-to-web.sh [demo|staging|prod] [domain]
```

### Management
```bash
# Status
aws ec2 describe-instances --instance-ids <INSTANCE_ID>

# Logs
ssh ubuntu@<IP> docker logs crew-agents -f

# Restart
ssh ubuntu@<IP> docker restart crew-agents

# Stop
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Start
aws ec2 start-instances --instance-ids <INSTANCE_ID>

# Terminate
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
```

### Testing
```bash
# Health
curl http://<IP>/health

# Metrics
curl http://<IP>/metrics

# Solve problem
curl -X POST http://<IP>/crew/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "your problem"}'
```

---

## Support

**Having issues?**

1. Check logs: `ssh ubuntu@<IP> docker logs crew-agents`
2. Review: [`DEPLOYMENT_RUNBOOK_PHASE_3.md`](DEPLOYMENT_RUNBOOK_PHASE_3.md)
3. Run diagnostics: `bash scripts/deploy/health-check.sh`

**Want to optimize costs?**

See: [`scripts/deploy/cost-calculator.sh`](scripts/deploy/cost-calculator.sh)

---

## Summary

| Step | Time | Cost |
|------|------|------|
| 1. Configure AWS | 2 min | $0 |
| 2. Build application | 3 min | $0 |
| 3. Deploy to AWS | 10 min | $0.30 |
| **Total** | **15 min** | **$9.10/month** |

**Your Crew Platform will be live on the web in 15 minutes.**

---

**Ready? Run:**
```bash
bash scripts/deploy-to-web.sh demo
```

🚀

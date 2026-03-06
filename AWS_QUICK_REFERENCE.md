# AWS Deployment - Quick Reference Card

## One-Liner Deployment

```bash
bash scripts/aws/deploy-comprehensive.sh prod crew.example.com
```

## Quick Start (2 minutes)

```bash
# 1. Set environment variables
export AWS_REGION=us-east-1
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# 2. Run deployment
cd openrouter-crew-platform
bash scripts/aws/deploy-comprehensive.sh

# 3. Check endpoints
curl http://[PUBLIC-IP]:3000/api/health
open http://[PUBLIC-IP]:3000/health-dashboard.html
```

## Cost at a Glance

| Scenario | Monthly | 24/7? | Break-Even |
|----------|---------|-------|-----------|
| Demo | $2.83 | No | 2 executions |
| Production | $8.50 | Yes | 6 executions |
| Scaled (3x) | $150+ | Yes | 100 executions |

## Essential Commands

```bash
# Deploy
bash scripts/aws/deploy-comprehensive.sh [env] [domain]

# Deploy via CloudFormation
aws cloudformation create-stack \
  --stack-name crew-prod \
  --template-body file://scripts/aws/cloudformation-template.yaml

# SSH into instance
ssh -i .aws/crew-key.pem ec2-user@[PUBLIC-IP]

# View logs
aws logs tail /aws/crew-platform/[env] --follow

# Stop instance (pause billing)
aws ec2 stop-instances --instance-ids [ID]

# Terminate (delete everything)
aws cloudformation delete-stack --stack-name crew-prod

# View costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Check health
curl http://[IP]:3000/api/health
curl http://[IP]:3000/api/metrics
```

## Public Endpoints

| Endpoint | Purpose | Cache | Cost |
|----------|---------|-------|------|
| `GET /api/health` | Light health check | 60s | $0 |
| `GET /api/health/detailed` | Full health check | none | Low |
| `GET /api/metrics` | System + cost metrics | none | Low |
| `GET /health-dashboard.html` | Interactive dashboard | 5m | Minimal |
| `GET /dashboard` | Main app | varies | Low |

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Optional
OPENROUTER_API_KEY=xxx
AWS_REGION=us-east-1
DOMAIN=crew.example.com
```

## File Structure

```
scripts/aws/
├── deploy-comprehensive.sh    # Main deployment script
├── cloudformation-template.yaml  # Infrastructure-as-code
└── README.md                   # Detailed instructions

outputs/
├── dashboard-summary.html      # Cost/metrics dashboard
└── deployment-log.txt          # Deployment details
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Health check fails | SSH in, check Docker: `docker logs crew-platform` |
| High CPU | Stop instance, upgrade to t3.small: `aws ec2 modify-instance-attribute ...` |
| DNS not working | Verify nameservers with registrar, wait 5-30 mins |
| Can't SSH | Check security group allows port 22 from your IP |
| Unexpected costs | Review `/api/metrics` endpoint, check CloudWatch alarms |

## Cost Monitoring

```bash
# Daily estimate
curl http://[IP]:3000/api/metrics | jq '.estimate'

# AWS billing
aws ce get-cost-and-usage --time-period Start=TODAY,End=TOMORROW \
  --granularity DAILY --metrics BlendedCost

# Set up alert
aws cloudwatch put-metric-alarm \
  --alarm-name crew-high-cost \
  --threshold 5.00 \
  --comparison-operator GreaterThanThreshold
```

## Scaling Path

```
Week 1: t3.micro ($2.83/mo)
       ↓
Week 4: t3.small + CloudFront ($25/mo)
       ↓
Month 3: Auto Scaling (3x) + ALB ($150/mo)
       ↓
Month 6: ECS/EKS cluster + RDS Multi-AZ ($500+/mo)
```

## Key Decisions

- **Instance Type**: t3.micro (free tier, easily upgradeable)
- **Database**: Supabase (managed, no ops)
- **Cache**: CloudFront (40-60% API reduction)
- **Shutdown**: Daily (60% cost reduction)
- **Region**: us-east-1 (cheapest, free tier)

## Security

```bash
# Encrypt the SSH key
chmod 600 .aws/crew-key.pem

# Store in AWS Secrets Manager
aws secretsmanager create-secret --name crew/ssh-key \
  --secret-string file://.aws/crew-key.pem

# Restrict security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp --port 22 \
  --cidr YOUR_IP/32
```

## Links

- [Full Guide](./AWS_DEPLOYMENT_GUIDE.md)
- [CloudFormation Template](./scripts/aws/cloudformation-template.yaml)
- [Deployment Script](./scripts/aws/deploy-comprehensive.sh)
- [CLAUDE.md](./CLAUDE.md) - Project context

---

**Status**: ✅ Ready for Production
**Version**: 1.0.0
**Last Updated**: 2024-01-15

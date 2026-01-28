# Secrets Management Guide

Complete guide to managing secrets across local development, GitHub Actions, and EC2 deployment.

## Overview

Secrets flow through three environments:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Local     │────▶│   GitHub    │────▶│    EC2      │
│ Development │     │   Secrets   │     │ Production  │
└─────────────┘     └─────────────┘     └─────────────┘
  ~/.zshrc            Repository          .env.production
  .env.local          Settings
```

## Part 1: Local Development Secrets

### Method 1: Extract from ~/.zshrc (Automated)

```bash
cd /Users/bradygeorgen/Documents/workspace/openrouter-crew-platform

# Run secret sync script
pnpm secrets:sync

# This will:
# 1. Read from ~/.zshrc
# 2. Create .env.local files for all apps
# 3. Set proper permissions (chmod 600)
# 4. Validate required secrets
```

### Method 2: Manual Setup

Create `.env.local` in project root:

```bash
# Supabase (from local instance or cloud)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=postgres

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...

# n8n (local instance)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Redis (local)
REDIS_PASSWORD=local-redis-password

# AWS (for testing deployments)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-2
```

### Get Local Supabase Credentials

```bash
# Start local Supabase
supabase start

# Get credentials
supabase status

# Output shows:
# API URL: http://127.0.0.1:54321
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get OpenRouter API Key

1. Visit: https://openrouter.ai/settings/keys
2. Create new API key
3. Copy `sk-or-v1-...` value

### Generate n8n Encryption Key

```bash
openssl rand -base64 32
```

### File Permissions

```bash
# Secure environment files
chmod 600 .env.local
chmod 600 apps/*/.env.local
chmod 600 packages/*/.env.local

# Verify
ls -la .env.local
# Should show: -rw------- (only owner can read/write)
```

## Part 2: GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### AWS Configuration (5 secrets)

#### AWS_ACCESS_KEY_ID
```
AKIAIOSFODNN7EXAMPLE
```

**How to get**:
1. AWS Console → IAM → Users → Create user
2. Attach policies:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonSSMFullAccess`
   - `CloudWatchLogsFullAccess`
3. Create access key → Copy Access Key ID

#### AWS_SECRET_ACCESS_KEY
```
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**How to get**:
- Copy Secret Access Key from step above (only shown once!)

#### AWS_REGION
```
us-east-2
```

#### EC2_INSTANCE_ID
```
i-1234567890abcdef0
```

**How to get**:
```bash
cd terraform
terraform output instance_id
```

#### EC2_PUBLIC_IP
```
3.12.34.56
```

**How to get**:
```bash
terraform output instance_public_ip
```

### Supabase Configuration (4 secrets)

#### SUPABASE_URL
```
https://your-project.supabase.co
```

**For local Supabase**: Use cloud URL for production
**For cloud Supabase**: Project Settings → API → Project URL

#### SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For cloud Supabase**: Project Settings → API → `anon` `public`

#### SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For cloud Supabase**: Project Settings → API → `service_role` `secret`

⚠️ **WARNING**: Keep this secret! Has full database access.

#### SUPABASE_DB_PASSWORD
```
your-super-secret-db-password
```

**How to generate**:
```bash
openssl rand -base64 32
```

### OpenRouter Configuration (1 secret)

#### OPENROUTER_API_KEY
```
sk-or-v1-...
```

**How to get**:
1. Visit: https://openrouter.ai/settings/keys
2. Create API Key
3. Copy key starting with `sk-or-v1-`

### n8n Configuration (3 secrets)

#### N8N_BASE_URL
```
http://3.12.34.56:5678
```

Use your EC2 public IP from Terraform output.

#### N8N_API_KEY
```
your-n8n-api-key
```

**How to get**:
1. Access n8n: `http://your-ec2-ip:5678`
2. Settings → API → Create API Key
3. Copy generated key

#### N8N_ENCRYPTION_KEY
```
abcdefghijklmnopqrstuvwxyz123456
```

**How to generate**:
```bash
openssl rand -base64 32
```

⚠️ **WARNING**: Store safely! Used to encrypt n8n credentials.

### Redis Configuration (1 secret)

#### REDIS_PASSWORD
```
your-redis-password
```

**How to generate**:
```bash
openssl rand -base64 24
```

## Complete Secrets Checklist

### Required for GitHub Actions (14 total)

**AWS (5)**:
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `EC2_INSTANCE_ID`
- [ ] `EC2_PUBLIC_IP`

**Supabase (4)**:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_DB_PASSWORD`

**OpenRouter (1)**:
- [ ] `OPENROUTER_API_KEY`

**n8n (3)**:
- [ ] `N8N_BASE_URL`
- [ ] `N8N_API_KEY`
- [ ] `N8N_ENCRYPTION_KEY`

**Redis (1)**:
- [ ] `REDIS_PASSWORD`

### Verify GitHub Secrets

```bash
# List all secrets (names only, not values)
gh secret list

# Expected output:
AWS_ACCESS_KEY_ID                Updated 2026-01-28
AWS_SECRET_ACCESS_KEY            Updated 2026-01-28
EC2_INSTANCE_ID                  Updated 2026-01-28
EC2_PUBLIC_IP                    Updated 2026-01-28
SUPABASE_URL                     Updated 2026-01-28
SUPABASE_ANON_KEY                Updated 2026-01-28
SUPABASE_SERVICE_ROLE_KEY        Updated 2026-01-28
OPENROUTER_API_KEY               Updated 2026-01-28
N8N_BASE_URL                     Updated 2026-01-28
N8N_API_KEY                      Updated 2026-01-28
N8N_ENCRYPTION_KEY               Updated 2026-01-28
```

## Part 3: EC2 Production Secrets

### Method 1: Via GitHub Actions (Automated)

Secrets are automatically passed to EC2 during deployment in `.github/workflows/deploy.yml`:

```yaml
- name: Deploy via SSM
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
    # ... all secrets
  run: |
    # Deployment script writes .env.production on EC2
```

### Method 2: Manual Setup on EC2

If you need to manually configure secrets:

```bash
# 1. Connect to EC2
aws ssm start-session --target i-1234567890abcdef0 --region us-east-2

# 2. Create environment file
cd /home/ec2-user/openrouter-crew-platform
cat > .env.production <<'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your-super-secret-db-password
OPENROUTER_API_KEY=sk-or-v1-...
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
N8N_ENCRYPTION_KEY=your-encryption-key
REDIS_PASSWORD=your-redis-password
ECR_REGISTRY=123456789012.dkr.ecr.us-east-2.amazonaws.com
ECR_REPOSITORY=openrouter-crew-platform
IMAGE_TAG=latest
EOF

# 3. Secure file
chmod 600 .env.production
chown ec2-user:ec2-user .env.production

# 4. Verify
ls -la .env.production
cat .env.production  # Check values
```

### Method 3: AWS Secrets Manager (Advanced)

Store secrets in AWS Secrets Manager for better security:

```bash
# 1. Store secrets
aws secretsmanager create-secret \
  --name openrouter-crew-platform/production \
  --secret-string file://secrets.json \
  --region us-east-2

# 2. Update docker-compose.prod.yml to read from Secrets Manager
# 3. Ensure IAM role has secretsmanager:GetSecretValue permission
```

## Security Best Practices

### 1. Never Commit Secrets to Git

```bash
# Verify .gitignore includes:
.env
.env.local
.env.production
.env.*.local
*.env
terraform.tfstate
terraform.tfstate.backup
```

### 2. Rotate Secrets Regularly

- **Monthly**: Rotate OpenRouter API key
- **Quarterly**: Rotate database passwords
- **Yearly**: Rotate n8n encryption key (requires data re-encryption)

### 3. Use Different Secrets for Each Environment

```
Development:  SUPABASE_URL=http://localhost:54321
Staging:      SUPABASE_URL=https://staging-project.supabase.co
Production:   SUPABASE_URL=https://prod-project.supabase.co
```

### 4. Restrict Secret Access

**GitHub**:
- Only repository admins can view/edit secrets
- Use environment-specific secrets for staging vs production

**AWS**:
- Use least-privilege IAM policies
- Enable AWS CloudTrail to audit secret access

### 5. Use Strong Passwords

```bash
# Generate strong random passwords
openssl rand -base64 32  # 32-character password

# Generate alphanumeric only
openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
```

## Troubleshooting

### Issue: "supabaseUrl is required"

**Cause**: Missing `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`

**Solution**:
```bash
# Check local .env.local
cat .env.local | grep SUPABASE

# Verify GitHub secret
gh secret list | grep SUPABASE

# Check EC2
aws ssm start-session --target i-1234567890abcdef0
cat /home/ec2-user/openrouter-crew-platform/.env.production
```

### Issue: "Invalid API key" from OpenRouter

**Cause**: Wrong or expired `OPENROUTER_API_KEY`

**Solution**:
1. Generate new key: https://openrouter.ai/settings/keys
2. Update GitHub secret
3. Redeploy via GitHub Actions

### Issue: GitHub Actions can't connect to EC2

**Cause**: Missing or wrong `EC2_INSTANCE_ID`

**Solution**:
```bash
# Get correct instance ID
cd terraform
terraform output instance_id

# Update GitHub secret
gh secret set EC2_INSTANCE_ID --body "i-1234567890abcdef0"
```

### Issue: n8n workflows not saving

**Cause**: Wrong `N8N_ENCRYPTION_KEY` or database password

**Solution**:
```bash
# Generate new encryption key
openssl rand -base64 32

# Update all locations:
# 1. GitHub secret: N8N_ENCRYPTION_KEY
# 2. EC2 .env.production
# 3. Restart n8n container
docker-compose restart n8n
```

## Quick Reference Commands

### Set GitHub Secret via CLI

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Set secret
gh secret set SECRET_NAME --body "secret-value"

# Set secret from file
gh secret set SECRET_NAME < secret.txt

# Delete secret
gh secret delete SECRET_NAME
```

### Extract Secret from EC2

```bash
# Connect to EC2
aws ssm start-session --target i-1234567890abcdef0

# Read specific secret
grep SUPABASE_URL /home/ec2-user/openrouter-crew-platform/.env.production

# Copy all secrets (for backup)
cat /home/ec2-user/openrouter-crew-platform/.env.production
```

### Test Secret Access

```bash
# Test Supabase connection
curl -I $SUPABASE_URL/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY"

# Test OpenRouter API
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Test n8n webhook
curl http://localhost:5678/healthz
```

## Migration Guide

### Migrating from .env to GitHub Secrets

```bash
# 1. Read current .env
cat .env.local

# 2. Set each secret in GitHub
gh secret set SUPABASE_URL --body "$(grep SUPABASE_URL .env.local | cut -d '=' -f2)"
gh secret set SUPABASE_ANON_KEY --body "$(grep SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)"
# ... repeat for all secrets

# 3. Verify
gh secret list

# 4. Remove local secrets (optional)
# rm .env.local  # Be careful!
```

### Migrating from One Environment to Another

```bash
# Export from staging
gh secret list --env staging

# Import to production (manually set each)
gh secret set SECRET_NAME --env production --body "value"
```

## Support

- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Security Issue**: Report via GitHub Security Advisories
- **Questions**: Open GitHub Discussion

---

**Last Updated**: 2026-01-28
**Security Review**: Required before production deployment

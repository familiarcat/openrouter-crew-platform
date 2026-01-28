# Secrets Management Guide

## Overview

This document explains how secrets are managed across local development, CI/CD, and production environments for the OpenRouter Crew Platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LOCAL DEVELOPMENT                               │
├─────────────────────────────────────────────────────────────────────┤
│  ~/.zshrc                  # API keys, environment variables         │
│  ~/.alexai-keys            # Alex AI specific keys                   │
│  ~/.alexai-secrets         # Additional secrets                      │
│  ~/.alexai-n8n-config.json # N8N crew webhooks                      │
│  ~/.aws/                   # AWS credentials                         │
│  ~/.docker/                # Docker config                          │
│  ~/.n8n/                   # N8N local data                         │
│  ~/.terraform.d/           # Terraform config                       │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ scripts/secrets/load-local-secrets.sh
             v
┌─────────────────────────────────────────────────────────────────────┐
│                   PROJECT .env.local                                 │
├─────────────────────────────────────────────────────────────────────┤
│  apps/unified-dashboard/.env.local                                   │
│  - Auto-generated from dotfiles                                      │
│  - Used by Next.js development server                               │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ scripts/secrets/sync-to-github.sh
             v
┌─────────────────────────────────────────────────────────────────────┐
│                   GITHUB SECRETS                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Repository Secrets (for CI/CD)                                      │
│  Environment Secrets (staging, production)                           │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ .github/workflows/deploy.yml
             v
┌─────────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Vercel (Dashboard)                                                  │
│  Supabase (Database)                                                 │
│  N8N (Workflows)                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Local Development Setup

### 1. Organize Your Dotfiles

Ensure your local secrets are properly organized:

```bash
# ~/.zshrc - API Keys and Environment Variables
export OPENROUTER_API_KEY="sk-or-v1-your-key"
export ANTHROPIC_API_KEY="sk-ant-your-key"
export OPENAI_API_KEY="sk-your-key"
export GOOGLE_API_KEY="your-gemini-key"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export N8N_BASE_URL="http://localhost:5678"
export N8N_API_KEY="your-n8n-api-key"

# ~/.alexai-keys - Additional Keys
export VERCEL_TOKEN="your-vercel-token"
export GITHUB_TOKEN="ghp_your-github-token"

# ~/.alexai-secrets - Sensitive Keys
export SUPABASE_ACCESS_TOKEN="sbp_your-access-token"
export SUPABASE_PROJECT_ID="your-project-id"

# ~/.alexai-n8n-config.json - N8N Crew Webhooks
{
  "n8n": {
    "baseUrl": "http://localhost:5678",
    "apiKey": "your-n8n-api-key"
  },
  "crew": {
    "captain_picard": {
      "webhook": "http://localhost:5678/webhook/crew-captain-picard"
    },
    "commander_data": {
      "webhook": "http://localhost:5678/webhook/crew-commander-data"
    },
    // ... (all 10 crew members)
  }
}
```

### 2. Load Secrets for Development

```bash
cd openrouter-crew-platform

# Load secrets from dotfiles and generate .env.local
source scripts/secrets/load-local-secrets.sh

# Output:
# ✅ Loaded OPENROUTER_API_KEY
# ✅ Loaded SUPABASE_URL
# ✅ Generated apps/unified-dashboard/.env.local
```

### 3. Verify Environment

```bash
# Check that .env.local was created
cat apps/unified-dashboard/.env.local

# Should contain all necessary environment variables
```

## CI/CD Setup

### 1. Install GitHub CLI

```bash
# macOS
brew install gh

# Authenticate
gh auth login
```

### 2. Sync Secrets to GitHub

```bash
# Update GITHUB_REPO in scripts/secrets/sync-to-github.sh
# Then run:
./scripts/secrets/sync-to-github.sh

# Output:
# ✅ Set OPENROUTER_API_KEY
# ✅ Set SUPABASE_URL
# ✅ Set N8N_CREW_CAPTAIN_PICARD_WEBHOOK
# ... (all secrets)
```

### 3. Verify GitHub Secrets

```bash
# List all secrets
gh secret list --repo openrouter-crew/platform --env production

# Example output:
# ANTHROPIC_API_KEY                 Updated 2026-01-28
# N8N_BASE_URL                      Updated 2026-01-28
# N8N_CREW_CAPTAIN_PICARD_WEBHOOK   Updated 2026-01-28
# OPENROUTER_API_KEY                Updated 2026-01-28
# SUPABASE_URL                      Updated 2026-01-28
# ...
```

## Required Secrets

### Core Secrets (Required for Build)

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ~/.zshrc → `SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ~/.zshrc → `SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ~/.zshrc | Supabase service role key (private) |
| `OPENROUTER_API_KEY` | ~/.zshrc | OpenRouter API key for LLM calls |

### Deployment Secrets (Required for CI/CD)

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `VERCEL_TOKEN` | ~/.alexai-keys | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel dashboard | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel dashboard | Vercel project ID |
| `SUPABASE_ACCESS_TOKEN` | ~/.alexai-secrets | Supabase CLI access token |
| `SUPABASE_PROJECT_ID` | ~/.alexai-secrets | Supabase project ID |
| `GITHUB_TOKEN` | ~/.alexai-keys | GitHub personal access token |

### N8N Secrets (Required for Crew Orchestration)

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `N8N_BASE_URL` | ~/.alexai-n8n-config.json | N8N instance URL |
| `N8N_API_KEY` | ~/.alexai-n8n-config.json | N8N API key |
| `N8N_CREW_CAPTAIN_PICARD_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Captain Picard |
| `N8N_CREW_COMMANDER_DATA_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Commander Data |
| `N8N_CREW_COMMANDER_RIKER_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Commander Riker |
| `N8N_CREW_COUNSELOR_TROI_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Counselor Troi |
| `N8N_CREW_LT_WORF_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Lt. Worf |
| `N8N_CREW_DR_CRUSHER_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Dr. Crusher |
| `N8N_CREW_GEORDI_LA_FORGE_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Geordi La Forge |
| `N8N_CREW_LT_UHURA_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Lt. Uhura |
| `N8N_CREW_QUARK_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Quark |
| `N8N_CREW_CHIEF_OBRIEN_WEBHOOK` | ~/.alexai-n8n-config.json | Webhook URL for Chief O'Brien |

### Optional Provider Keys

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `ANTHROPIC_API_KEY` | ~/.zshrc | Direct Anthropic API access (optional) |
| `OPENAI_API_KEY` | ~/.zshrc | Direct OpenAI API access (optional) |
| `GOOGLE_API_KEY` | ~/.zshrc | Direct Google/Gemini API access (optional) |

### AWS Secrets (Optional - for Infrastructure)

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `AWS_ACCESS_KEY_ID` | ~/.aws/credentials | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | ~/.aws/credentials | AWS secret key |
| `AWS_REGION` | ~/.aws/config | AWS region (default: us-east-1) |

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore includes:
.env.local
.env*.local
*.key
*.pem
.alexai-keys
.alexai-secrets
```

### 2. Use Environment-Specific Secrets

```
Development:  .env.local (from dotfiles)
Staging:      GitHub Secrets → staging environment
Production:   GitHub Secrets → production environment
```

### 3. Rotate Secrets Regularly

```bash
# 1. Update secrets in dotfiles
vim ~/.zshrc  # Update API keys

# 2. Re-sync to GitHub
./scripts/secrets/sync-to-github.sh

# 3. Re-deploy
git push origin main
```

### 4. Limit Secret Scope

- **Public secrets** (`NEXT_PUBLIC_*`): Safe to expose in browser
- **Private secrets**: Only accessible server-side
- **Repository secrets**: Available to all workflows
- **Environment secrets**: Scoped to specific environments

## Workflow

### Local Development

```bash
# 1. Load secrets
source scripts/secrets/load-local-secrets.sh

# 2. Start Supabase
supabase start

# 3. Start N8N
docker-compose -f docker-compose.n8n.yml up -d

# 4. Start Dashboard
pnpm dev
```

### Deployment

```bash
# 1. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. GitHub Actions automatically:
#    - Loads secrets from GitHub Secrets
#    - Builds project
#    - Deploys to Vercel
#    - Deploys Supabase migrations
#    - Imports N8N workflows
```

### Updating Secrets

```bash
# Local → GitHub
1. Update dotfiles (e.g., ~/.zshrc)
2. Run: ./scripts/secrets/sync-to-github.sh
3. Verify: gh secret list

# GitHub → Local (for new team members)
1. Get secrets from team lead
2. Add to dotfiles
3. Run: source scripts/secrets/load-local-secrets.sh
```

## Troubleshooting

### Build Fails with "Missing Environment Variables"

```bash
# Solution: Check that secrets are loaded
cat apps/unified-dashboard/.env.local

# If missing, reload:
source scripts/secrets/load-local-secrets.sh
```

### N8N Webhooks Not Working

```bash
# Solution: Verify webhook URLs
cat ~/.alexai-n8n-config.json

# Test webhook:
curl -X POST $N8N_CREW_CAPTAIN_PICARD_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### GitHub Actions Failing

```bash
# Solution: Verify secrets are synced
gh secret list --repo openrouter-crew/platform --env production

# Re-sync if needed:
./scripts/secrets/sync-to-github.sh
```

### Supabase Connection Error

```bash
# Solution: Check Supabase is running
supabase status

# Verify URL in .env.local
echo $NEXT_PUBLIC_SUPABASE_URL
# Should be: http://127.0.0.1:54321 (local) or https://xxx.supabase.co (production)
```

## Quick Reference Commands

```bash
# Load local secrets
source scripts/secrets/load-local-secrets.sh

# Sync to GitHub
./scripts/secrets/sync-to-github.sh

# List GitHub secrets
gh secret list --repo openrouter-crew/platform --env production

# View a specific secret (requires admin)
gh secret set OPENROUTER_API_KEY < ~/.zshrc | grep OPENROUTER_API_KEY

# Update single secret
echo "sk-or-v1-new-key" | gh secret set OPENROUTER_API_KEY \
  --repo openrouter-crew/platform --env production

# Test local setup
pnpm build  # Should complete without errors
```

## Security Checklist

- [ ] All dotfiles are in `~/.gitignore` globally
- [ ] `.env.local` is in project `.gitignore`
- [ ] GitHub secrets synced for all environments
- [ ] Secrets rotated at least quarterly
- [ ] Team members have access to necessary secrets
- [ ] Production secrets never used in development
- [ ] API keys have proper rate limits configured
- [ ] Webhook URLs use HTTPS in production
- [ ] Service accounts have minimum required permissions
- [ ] Secrets audit log reviewed monthly

---

**Last Updated**: 2026-01-28
**Version**: 1.0
**Status**: Production Ready

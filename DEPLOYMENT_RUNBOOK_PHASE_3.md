# Phase 3 Deployment & Operations Runbook

**Status:** Production Ready | **Date:** March 5, 2026 | **Version:** 1.0.0

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedure](#deployment-procedure)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Operational Procedures](#operational-procedures)
5. [Incident Response](#incident-response)
6. [Health Monitoring](#health-monitoring)
7. [Scaling Guidelines](#scaling-guidelines)
8. [Disaster Recovery](#disaster-recovery)

---

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] Production server (AWS EC2, DigitalOcean, Linode, etc.)
  - Minimum: 2 CPU, 4GB RAM, 20GB SSD
  - Recommended: 4+ CPU, 8GB+ RAM, 50GB+ SSD
  - OS: Ubuntu 22.04 LTS or RHEL 8+

- [ ] Supabase project
  - [ ] Database created and migrations run
  - [ ] API keys generated (anon + service role)
  - [ ] RLS policies configured

- [ ] OpenRouter account
  - [ ] API key created
  - [ ] Budget limits configured
  - [ ] Model preferences set (Haiku, Sonnet, Opus)

- [ ] TLS certificates
  - [ ] Self-signed or CA-signed certificates ready
  - [ ] Certificate paths configured in environment

- [ ] Monitoring infrastructure
  - [ ] Datadog/Prometheus account (optional but recommended)
  - [ ] Alerting channels configured (PagerDuty, Slack, email)
  - [ ] Dashboards created

### Code Preparation

```bash
# 1. Build the agent orchestration module
pnpm --filter @openrouter-crew/agent-orchestration build

# 2. Run tests
pnpm --filter @openrouter-crew/agent-orchestration test

# 3. Type check
pnpm --filter @openrouter-crew/agent-orchestration type-check

# 4. Build Docker image (if using containers)
docker build -t crew-agents:v1.0.0 -f Dockerfile .

# 5. Test Docker image locally
docker run --rm crew-agents:v1.0.0 --help
```

### Credentials Preparation

```bash
# 1. Create environment.local file with production credentials
cat > /etc/crew-agents/environment.local << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-api-key-here
TLS_CERT_PATH=/etc/crew-agents/certs/server.crt
TLS_KEY_PATH=/etc/crew-agents/certs/server.key
EOF

# 2. Ensure correct permissions
chmod 600 /etc/crew-agents/environment.local

# 3. Create system user
sudo useradd -r -s /bin/false crew-agents

# 4. Create directories
sudo mkdir -p /opt/openrouter-crew/agents/{dist,logs,data}
sudo chown -R crew-agents:crew-agents /opt/openrouter-crew/agents
```

---

## Deployment Procedure

### Step 1: Prepare Server

```bash
# SSH into production server
ssh user@production-server

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (alternative to systemd)
sudo npm install -g pm2

# Install monitoring tools
sudo apt-get install -y curl wget htop iotop

# Verify Node version
node --version  # Should be >= 20.0.0
```

### Step 2: Deploy Application

```bash
# Clone repository (or pull if already cloned)
cd /opt/openrouter-crew/agents
git clone <repo-url> . 2>/dev/null || git pull

# Install dependencies
pnpm install --prod

# Build application
pnpm build

# Copy built files to deployment directory
cp -r dist/* /opt/openrouter-crew/agents/dist/

# Verify build
ls -la /opt/openrouter-crew/agents/dist/mcp/
```

### Step 3: Install Systemd Service

```bash
# Copy service file
sudo cp scripts/deploy/crew-agents.service /etc/systemd/system/

# Copy environment file
sudo cp scripts/deploy/crew-agents.environment /etc/crew-agents/environment

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable crew-agents

# Start service
sudo systemctl start crew-agents

# Check status
sudo systemctl status crew-agents

# View logs
sudo journalctl -u crew-agents -f
```

### Step 4: Configure TLS/SSL

```bash
# Create certificate directory
sudo mkdir -p /etc/crew-agents/certs
sudo chown crew-agents:crew-agents /etc/crew-agents/certs

# Option A: Self-signed certificate (development)
sudo openssl req -x509 -newkey rsa:4096 -keyout /etc/crew-agents/certs/server.key \
  -out /etc/crew-agents/certs/server.crt -days 365 -nodes

# Option B: Use Let's Encrypt (production)
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/crew-agents/certs/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/crew-agents/certs/server.key

# Set permissions
sudo chown crew-agents:crew-agents /etc/crew-agents/certs/*
sudo chmod 600 /etc/crew-agents/certs/*

# Restart service
sudo systemctl restart crew-agents
```

### Step 5: Configure Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/crew-agents > /dev/null << 'EOF'
upstream crew_agents {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/crew-agents/certs/server.crt;
    ssl_certificate_key /etc/crew-agents/certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://crew_agents;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://crew_agents;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/crew-agents /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Post-Deployment Verification

### Verify Service Status

```bash
# Check systemd service
sudo systemctl status crew-agents

# Check process is running
ps aux | grep crew-agents

# Check port is listening
sudo netstat -tulpn | grep 3000

# Check logs for errors
sudo journalctl -u crew-agents -n 50

# Check memory and CPU usage
ps aux | grep node | grep crew-agents
```

### Verify API Connectivity

```bash
# Test health endpoint
curl -s https://your-domain.com/health | jq .

# Test specific agent endpoint
curl -s -X POST https://your-domain.com/crew/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "Test problem"}' | jq .

# Test with verbose output
curl -v https://your-domain.com/health

# Check response codes
for endpoint in /health /health/live /health/ready; do
  echo "Testing $endpoint"
  curl -o /dev/null -s -w "%{http_code}\n" https://your-domain.com$endpoint
done
```

### Verify External Dependencies

```bash
# Test Supabase connection
curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://your-project.supabase.co/rest/v1/observation_lounge_findings?limit=1" | jq .

# Test OpenRouter API
curl -s -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models | jq '.[] | .id' | head -5

# Test database migrations
sudo -u crew-agents psql -d your_database -c "\dt" | grep observation_lounge_findings
```

### Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt-get install -y apache2-utils

# Run load test
ab -n 1000 -c 10 https://your-domain.com/health

# Or use wrk for more detailed metrics
curl -L https://github.com/wg/wrk/releases/download/4.2.0/wrk-linux-x86_64.tar.gz | \
  tar xzf - && sudo mv wrk /usr/local/bin/

wrk -t4 -c100 -d30s https://your-domain.com/health
```

---

## Operational Procedures

### Daily Operations

```bash
# Check system health
curl -s https://your-domain.com/health | jq '.'

# Monitor logs
sudo journalctl -u crew-agents -f

# Check system resources
top -b -n 1 | head -20

# Check disk space
df -h

# Check network connectivity
ping -c 1 your-supabase-url
curl -I https://openrouter.ai/api/v1/models
```

### Restart Service (Gracefully)

```bash
# Stop service (with 30 second timeout for graceful shutdown)
sudo systemctl stop crew-agents

# Verify stopped
sleep 2
sudo systemctl status crew-agents

# Start service
sudo systemctl start crew-agents

# Verify started
sleep 5
sudo systemctl status crew-agents

# Check health
curl -s https://your-domain.com/health | jq '.status'
```

### Update Application

```bash
# 1. Pull latest code
cd /opt/openrouter-crew && git pull origin main

# 2. Rebuild
pnpm install
pnpm build

# 3. Stop service
sudo systemctl stop crew-agents

# 4. Backup current version
sudo cp -r /opt/openrouter-crew/agents/dist /opt/openrouter-crew/agents/dist.backup

# 5. Deploy new version
sudo cp -r dist/* /opt/openrouter-crew/agents/dist/

# 6. Start service
sudo systemctl start crew-agents

# 7. Verify
sleep 5
curl -s https://your-domain.com/health | jq '.status'

# 8. Check logs for errors
sudo journalctl -u crew-agents -n 20
```

### View Logs

```bash
# Last 50 lines
sudo journalctl -u crew-agents -n 50

# Last 10 minutes
sudo journalctl -u crew-agents --since "10 minutes ago"

# Last hour
sudo journalctl -u crew-agents --since "1 hour ago"

# Continuous follow
sudo journalctl -u crew-agents -f

# With timestamp
sudo journalctl -u crew-agents -n 20 --no-pager

# JSON format for parsing
sudo journalctl -u crew-agents -o json | jq '.MESSAGE'
```

---

## Incident Response

### Agent Crash/Restart Loop

**Symptoms:** Service keeps restarting, logs show repeated errors

```bash
# 1. Stop service temporarily
sudo systemctl stop crew-agents

# 2. Check what's causing the issue
sudo journalctl -u crew-agents -n 100 --no-pager | grep ERROR

# 3. Check configuration
cat /etc/crew-agents/environment
cat /etc/crew-agents/environment.local

# 4. Verify dependencies are running
curl -s https://your-project.supabase.co/rest/v1/ -H "Authorization: Bearer $SUPABASE_ANON_KEY"
curl -s https://openrouter.ai/api/v1/models -H "Authorization: Bearer $OPENROUTER_API_KEY"

# 5. If issue is with code, rollback
sudo cp -r /opt/openrouter-crew/agents/dist.backup/* /opt/openrouter-crew/agents/dist/

# 6. Restart
sudo systemctl start crew-agents

# 7. Verify
sleep 5
curl -s https://your-domain.com/health | jq '.status'
```

### High CPU/Memory Usage

**Symptoms:** System is slow, agents are hanging, memory usage > 80%

```bash
# 1. Check what's consuming resources
top -b -n 1 | grep crew

# 2. Check for memory leaks
ps aux | grep crew-agents | awk '{print $6}'

# 3. If necessary, kill and restart
sudo systemctl restart crew-agents

# 4. Check if there's a tool that's hanging
sudo journalctl -u crew-agents -f | grep "timeout"

# 5. Disable problematic tool and restart
# Edit /etc/crew-agents/environment to remove tool
# Restart service

# 6. Investigate root cause
# Check which tool/agent is causing issue
# Submit bug report with logs
```

### Database Connection Issues

**Symptoms:** Tools fail with "connection refused" or "timeout" errors

```bash
# 1. Check if Supabase is reachable
curl -I https://your-project.supabase.co

# 2. Verify credentials are set
grep "SUPABASE" /etc/crew-agents/environment.local | head -3

# 3. Test connection directly
psql -h your-db-host -U postgres -d your_database -c "SELECT 1"

# 4. Check database logs
# In Supabase dashboard: Settings → Database → Logs

# 5. If issue persists, restart database connection pool
# In systemd service, the connection pool is reinitialized on restart
sudo systemctl restart crew-agents
```

### API Rate Limiting

**Symptoms:** Tools return "rate limit exceeded" errors

```bash
# 1. Check current usage
curl -s https://openrouter.ai/api/v1/me \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.usage'

# 2. Reduce request concurrency
# Edit /etc/crew-agents/environment:
# Change MCP_CONCURRENT_TOOLS=5 to MCP_CONCURRENT_TOOLS=2

# 3. Increase cache TTL to reduce API calls
# Edit /etc/crew-agents/environment:
# Change CACHE_TTL_SECONDS=300 to CACHE_TTL_SECONDS=900

# 4. Restart service
sudo systemctl restart crew-agents

# 5. Monitor usage
watch -n 30 'curl -s https://openrouter.ai/api/v1/me \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq ".usage"'
```

### Disk Space Issues

**Symptoms:** Service fails to log, tools fail, disk full error

```bash
# 1. Check disk usage
df -h

# 2. Find what's using space
sudo du -sh /opt/openrouter-crew/agents/*
sudo du -sh /var/log/journal/*

# 3. Clean old logs
sudo journalctl --vacuum-time=7d

# 4. Clean temporary files
sudo rm -rf /tmp/*

# 5. Check and compress old application logs
ls -lah /opt/openrouter-crew/agents/logs/

# 6. Archive old logs
gzip /opt/openrouter-crew/agents/logs/*.log.*

# 7. Verify space is freed
df -h
```

---

## Health Monitoring

### Set Up Prometheus Monitoring

```bash
# 1. Install Prometheus
sudo apt-get install -y prometheus

# 2. Create configuration
sudo tee /etc/prometheus/prometheus.yml > /dev/null << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'crew-agents'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
EOF

# 3. Restart Prometheus
sudo systemctl restart prometheus

# 4. Access dashboard
# Open browser: http://your-domain:9090
```

### Set Up Alerts

```bash
# 1. Create alert rules
sudo tee /etc/prometheus/alert.rules.yml > /dev/null << 'EOF'
groups:
  - name: crew_agents
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate on {{ $labels.instance }}"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        annotations:
          summary: "Crew agents service is down"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes > 1.5e9
        for: 5m
        annotations:
          summary: "High memory usage detected"
EOF

# 2. Reload Prometheus
sudo systemctl reload prometheus
```

### Set Up Datadog Monitoring

```bash
# 1. Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<your-api-key> DD_SITE="datadoghq.com" bash -c \
  "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# 2. Configure crew-agents integration
sudo tee /etc/datadog-agent/conf.d/process.d/crew-agents.yaml > /dev/null << 'EOF'
init_config:

instances:
  - name: crew-agents
    search_string: ["crew-agents"]
EOF

# 3. Restart Datadog agent
sudo systemctl restart datadog-agent

# 4. View in Datadog dashboard
# https://app.datadoghq.com/infrastructure
```

---

## Scaling Guidelines

### Horizontal Scaling (Multiple Servers)

```bash
# 1. Deploy to multiple servers
for server in server1 server2 server3; do
  ssh user@$server "cd /opt/openrouter-crew && git pull && pnpm build"
  ssh user@$server "sudo systemctl restart crew-agents"
done

# 2. Configure load balancer
# Use AWS ELB, Nginx load balancer, or HAProxy

# 3. Configure service discovery
# Optional: Use Consul or etcd for dynamic discovery
```

### Vertical Scaling (More Powerful Server)

```bash
# If single server needs more resources:

# 1. Stop service
sudo systemctl stop crew-agents

# 2. Backup data
sudo cp -r /opt/openrouter-crew/agents /opt/openrouter-crew/agents.backup

# 3. Increase instance size (if cloud provider)
# AWS: Stop → Change instance type → Start

# 4. Start service
sudo systemctl start crew-agents

# 5. Verify
curl -s https://your-domain.com/health | jq '.status'
```

### Connection Pool Tuning

```bash
# Edit environment variables for production load
sudo nano /etc/crew-agents/environment.local

# Increase pool sizes
DB_POOL_MIN=5
DB_POOL_MAX=20
MCP_CONCURRENT_TOOLS=10
RATE_LIMIT_MAX_REQUESTS=5000

# Restart
sudo systemctl restart crew-agents
```

---

## Disaster Recovery

### Backup Strategy

```bash
# 1. Daily backups
0 2 * * * sudo tar -czf /backups/crew-agents-$(date +\%Y\%m\%d).tar.gz \
  /opt/openrouter-crew/agents /etc/crew-agents

# 2. Database backups (via Supabase)
# Supabase automatically backs up database
# Manual: supabase db push --remote

# 3. Verify backup integrity
tar -tzf /backups/crew-agents-20260305.tar.gz | head -20
```

### Restore from Backup

```bash
# 1. Stop service
sudo systemctl stop crew-agents

# 2. Remove corrupted files
sudo rm -rf /opt/openrouter-crew/agents

# 3. Extract backup
sudo tar -xzf /backups/crew-agents-20260305.tar.gz -C /

# 4. Restore permissions
sudo chown -R crew-agents:crew-agents /opt/openrouter-crew/agents /etc/crew-agents

# 5. Start service
sudo systemctl start crew-agents

# 6. Verify
sleep 5
curl -s https://your-domain.com/health | jq '.status'
```

### Database Recovery

```bash
# 1. From Supabase dashboard
# Go to: Database → Backups → Restore from backup

# 2. Or use supabase CLI
supabase db pull --remote  # Pull latest schema
supabase db push --remote  # Push schema to remote

# 3. Verify data integrity
curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://your-project.supabase.co/rest/v1/observation_lounge_findings?limit=1" | jq '.[] | .id'
```

---

## Summary

**Phase 3 Deployment Checklist:**
- [ ] All infrastructure requirements met
- [ ] Code built and tested
- [ ] TLS certificates installed
- [ ] Systemd service configured and running
- [ ] Reverse proxy (Nginx) configured
- [ ] All health checks passing
- [ ] External dependencies verified
- [ ] Monitoring configured (Prometheus/Datadog)
- [ ] Backup system in place
- [ ] Incident response procedures documented

**Next Steps:**
1. Deploy to staging environment
2. Run load tests
3. Monitor for 24-48 hours
4. Deploy to production
5. Ongoing monitoring and maintenance

---

**For emergencies, contact:** [Your oncall schedule / contact info]

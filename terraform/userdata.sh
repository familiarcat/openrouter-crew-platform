#!/bin/bash
set -e

# Logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "===== Starting OpenRouter Crew Platform setup ====="
echo "Project: ${project_name}"
echo "Environment: ${environment}"
echo "Region: ${aws_region}"

# Update system
echo "Updating system packages..."
dnf update -y && dnf install -y jq unzip curl

# Install Docker
echo "Installing Docker..."
dnf install -y docker
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install SSM Agent (should be pre-installed on AL2023, but ensure it's running)
# This is vital for Phase 3 deployments via scripts/deploy/deploy-full.sh
echo "Ensuring SSM Agent is running..."
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

%{ if enable_cloudwatch }
# Install CloudWatch Agent
echo "Installing CloudWatch Agent..."
dnf install -y amazon-cloudwatch-agent

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/user-data"
          },
          {
            "file_path": "/home/ec2-user/openrouter-crew-platform/logs/dashboard.log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/dashboard"
          },
          {
            "file_path": "/home/ec2-user/openrouter-crew-platform/logs/n8n.log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/n8n"
          },
          {
            "file_path": "/var/log/db-backup.log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/backups"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${project_name}",
    "metrics_collected": {
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUsedPercent",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUsedPercent",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
CWEOF

# Start CloudWatch Agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
%{ endif }

# Create application directory
echo "Setting up application directory..."
APP_DIR="/home/ec2-user/openrouter-crew-platform"
mkdir -p $APP_DIR/logs
touch $APP_DIR/.env.production
chown -R ec2-user:ec2-user $APP_DIR

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Create systemd service for application
cat > /etc/systemd/system/openrouter-crew.service <<'SYSTEMDEOF'
[Unit]
Description=OpenRouter Crew Platform
After=docker.service
Requires=docker.service

[Service]
Type=simple
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
# The following ensures the containers start on boot using the production env
ExecStartPre=-/usr/bin/docker-compose -f docker-compose.prod.yml pull
ExecStart=/usr/bin/docker-compose --env-file .env.production -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml stop
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
SYSTEMDEOF

systemctl daemon-reload
systemctl enable openrouter-crew.service

# Set up log rotation
cat > /etc/logrotate.d/openrouter-crew <<'LOGROTATEEOF'
/home/ec2-user/openrouter-crew-platform/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ec2-user ec2-user
}
LOGROTATEEOF

# Set up Daily Database Backup to S3
echo "Setting up daily database backup script..."
cat > /usr/local/bin/backup-db.sh <<'BACKUPEOF'
#!/bin/bash
APP_DIR="/home/ec2-user/openrouter-crew-platform"
BACKUP_BUCKET="${project_name}-backups-${environment}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Prune local backups older than 3 days to save disk space
find /tmp -name "db_backup_*.sql.gz" -mtime +3 -delete
find /tmp -name "n8n_backup_*.tar.gz" -mtime +3 -delete

if [ -f "$APP_DIR/.env.production" ]; then
    # Extract DB password from the production environment file
    DB_PWD=$(grep "^SUPABASE_DB_PASSWORD=" "$APP_DIR/.env.production" | cut -d'=' -f2)
    
    if docker ps -q -f name=openrouter-supabase-db > /dev/null; then
        echo "Starting full database backup to S3..."
        # Perform dump, compress, and upload directly
        docker exec -e PGPASSWORD="$DB_PWD" openrouter-supabase-db pg_dump -U postgres postgres | gzip > /tmp/db_backup_$TIMESTAMP.sql.gz
        aws s3 cp /tmp/db_backup_$TIMESTAMP.sql.gz s3://$BACKUP_BUCKET/database/db_backup_$TIMESTAMP.sql.gz
        rm /tmp/db_backup_$TIMESTAMP.sql.gz
        echo "Backup complete: s3://$BACKUP_BUCKET/database/db_backup_$TIMESTAMP.sql.gz"
    else
        echo "Error: Supabase DB container not found. Backup failed."
    fi

    # Backup n8n data directory
    if docker ps -q -f name=openrouter-n8n > /dev/null; then
        echo "Starting n8n data backup to S3..."
        # Archive the .n8n directory from inside the container and upload
        docker exec openrouter-n8n tar -cz -C /home/node .n8n > /tmp/n8n_backup_$TIMESTAMP.tar.gz
        aws s3 cp /tmp/n8n_backup_$TIMESTAMP.tar.gz s3://$BACKUP_BUCKET/n8n/n8n_backup_$TIMESTAMP.tar.gz
        rm /tmp/n8n_backup_$TIMESTAMP.tar.gz
        echo "n8n backup complete: s3://$BACKUP_BUCKET/n8n/n8n_backup_$TIMESTAMP.tar.gz"
    else
        echo "Warning: n8n container not found. Skipping n8n backup."
    fi
fi
BACKUPEOF
chmod +x /usr/local/bin/backup-db.sh

# Schedule the backup via cron (Every day at 2:00 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1") | crontab -

echo "===== User data setup complete ====="
echo "Instance is ready for deployment via SSM"
echo "Deploy with: aws ssm send-command --instance-ids <instance-id> --document-name AWS-RunShellScript"

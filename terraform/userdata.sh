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
dnf update -y

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

# Install AWS CLI (latest version)
echo "Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
dnf install -y unzip
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install SSM Agent (should be pre-installed on AL2023, but ensure it's running)
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
mkdir -p /home/ec2-user/openrouter-crew-platform
mkdir -p /home/ec2-user/openrouter-crew-platform/logs
chown -R ec2-user:ec2-user /home/ec2-user/openrouter-crew-platform

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Create systemd service for application
cat > /etc/systemd/system/openrouter-crew.service <<'SYSTEMDEOF'
[Unit]
Description=OpenRouter Crew Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/openrouter-crew-platform
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
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

echo "===== User data setup complete ====="
echo "Instance is ready for deployment via SSM"
echo "Deploy with: aws ssm send-command --instance-ids <instance-id> --document-name AWS-RunShellScript"

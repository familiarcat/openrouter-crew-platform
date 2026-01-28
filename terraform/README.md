# Terraform Infrastructure

Infrastructure as Code for OpenRouter Crew Platform on AWS.

## What's Included

- **VPC**: Custom VPC with public subnets across 2 AZs
- **EC2**: Single t3.medium instance with Elastic IP
- **IAM**: Roles and policies for SSM, ECR, and Secrets Manager
- **Security Groups**: Controlled access for Dashboard (3000), n8n (5678), Supabase (54321-54324)
- **CloudWatch**: Logging and metrics for monitoring
- **User Data**: Automated instance setup with Docker and services

## Prerequisites

```bash
# Install Terraform
brew install terraform

# Verify AWS credentials
aws sts get-caller-identity
```

## Quick Start

```bash
# 1. Configure variables
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars

# 2. Initialize Terraform
terraform init

# 3. Preview changes
terraform plan

# 4. Apply infrastructure
terraform apply

# 5. Get outputs
terraform output
```

## Configuration

### terraform.tfvars

```hcl
aws_region  = "us-east-2"
environment = "staging"

# EC2
instance_type = "t3.medium"  # 2 vCPU, 4GB RAM
volume_size   = 50           # 50GB storage

# Network
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]

# Security (SSM-only, no SSH)
allowed_ssh_cidr  = []
allowed_http_cidr = ["0.0.0.0/0"]  # Restrict in production

# Monitoring
enable_cloudwatch_logs = true
```

## Architecture

```
VPC (10.0.0.0/16)
├── Public Subnet 1 (10.0.1.0/24)
│   └── EC2 Instance
│       ├── Docker Containers
│       │   ├── Dashboard :3000
│       │   ├── n8n :5678
│       │   ├── Supabase :54321-54324
│       │   └── Redis :6379
│       ├── IAM Role (SSM + ECR + Secrets)
│       └── Elastic IP
├── Public Subnet 2 (10.0.2.0/24)
└── Internet Gateway
```

## Outputs

After `terraform apply`, you'll get:

```bash
# EC2 Instance ID (for GitHub Secrets)
terraform output instance_id

# Public IP (for GitHub Secrets)
terraform output instance_public_ip

# Service URLs
terraform output dashboard_url       # http://3.12.34.56:3000
terraform output n8n_url            # http://3.12.34.56:5678
terraform output supabase_studio_url # http://3.12.34.56:54323

# SSM Connection
terraform output ssm_connect_command
# aws ssm start-session --target i-1234567890abcdef0 --region us-east-2
```

## Common Operations

### Connect to EC2

```bash
# Via SSM (no SSH key needed)
aws ssm start-session --target $(terraform output -raw instance_id) --region us-east-2

# Or copy from output
terraform output ssm_connect_command
```

### Update Instance Type

```hcl
# terraform.tfvars
instance_type = "t3.small"  # Downgrade to save costs
```

```bash
terraform apply
```

### Enable ALB for HTTPS

```hcl
# terraform.tfvars
create_alb      = true
domain_name     = "crew.yourdomain.com"
certificate_arn = "arn:aws:acm:us-east-2:123456789012:certificate/..."
```

```bash
terraform apply
```

### Destroy Infrastructure

```bash
# Preview destruction
terraform plan -destroy

# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_instance.main
```

## Security Features

- **SSM-Only Access**: No SSH keys needed, all access via AWS Systems Manager
- **IMDSv2**: Instance Metadata Service v2 enforced
- **Encrypted EBS**: Root volume encrypted by default
- **Security Groups**: Minimal inbound rules, all outbound allowed
- **IAM Least Privilege**: Roles have only necessary permissions
- **No Hardcoded Secrets**: All sensitive data from GitHub Secrets or Secrets Manager

## Cost Optimization

### Development Environment

```hcl
instance_type = "t3.small"   # 2GB RAM, ~$15/month
volume_size   = 30           # Smaller disk
enable_cloudwatch_logs = false
```

### Stop/Start Schedule

Use AWS Instance Scheduler:
```bash
# Stop nights and weekends (50% savings)
terraform apply -var="enable_instance_scheduler=true"
```

### Spot Instances

For non-critical workloads:
```hcl
resource "aws_instance" "main" {
  instance_market_options {
    market_type = "spot"
    spot_options {
      max_price = "0.0416"  # t3.medium on-demand price
    }
  }
}
```

## Troubleshooting

### Error: "No valid credential sources found"

```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-east-2
```

### Error: "Error launching source instance: InvalidKeyPair.NotFound"

The configuration doesn't use SSH keys. If you see this, remove `key_name` from `ec2.tf`.

### SSM Connection Times Out

1. Check IAM role has `AmazonSSMManagedInstanceCore` policy:
   ```bash
   terraform output iam_role_name
   aws iam list-attached-role-policies --role-name openrouter-crew-platform-ec2-role
   ```

2. Verify SSM Agent is running:
   ```bash
   aws ssm describe-instance-information --instance-ids $(terraform output -raw instance_id)
   ```

3. Check security group allows outbound HTTPS:
   ```bash
   terraform output security_group_id
   aws ec2 describe-security-groups --group-ids sg-1234567890abcdef0
   ```

## State Management

### Local State (Default)

Terraform state is stored in `terraform.tfstate` file locally. Do NOT commit this file to git.

### Remote State (Recommended for Teams)

Store state in S3 with DynamoDB locking:

```hcl
# main.tf
terraform {
  backend "s3" {
    bucket         = "openrouter-crew-terraform-state"
    key            = "platform/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

Create bucket and table:
```bash
# S3 bucket
aws s3 mb s3://openrouter-crew-terraform-state --region us-east-2
aws s3api put-bucket-versioning \
  --bucket openrouter-crew-terraform-state \
  --versioning-configuration Status=Enabled

# DynamoDB table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2
```

## Files

- `main.tf` - Provider and data sources
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `vpc.tf` - VPC, subnets, routing
- `security-groups.tf` - Security groups and rules
- `iam.tf` - IAM roles and policies
- `ec2.tf` - EC2 instance and EBS
- `userdata.sh` - Instance initialization script
- `terraform.tfvars.example` - Example configuration

## Best Practices

1. **Always run `terraform plan` before `apply`**
   ```bash
   terraform plan -out=plan.tfplan
   terraform apply plan.tfplan
   ```

2. **Use workspaces for multiple environments**
   ```bash
   terraform workspace new production
   terraform workspace select production
   ```

3. **Enable state locking with remote backend**

4. **Use modules for reusable components**

5. **Tag all resources consistently**
   ```hcl
   default_tags {
     tags = {
       Project     = "openrouter-crew-platform"
       ManagedBy   = "terraform"
       Environment = var.environment
     }
   }
   ```

## Next Steps

1. Apply infrastructure: `terraform apply`
2. Note outputs (instance ID, public IP)
3. Configure GitHub Secrets
4. Deploy via GitHub Actions
5. See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for complete guide

## Support

- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **AWS EC2**: https://docs.aws.amazon.com/ec2/
- **GitHub Issues**: https://github.com/your-org/openrouter-crew-platform/issues

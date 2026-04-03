provider "aws" {
  region = var.aws_region
}

# 1. IAM Role for SSM and ECR Access
resource "aws_iam_role" "platform_role" {
  name = "${var.project_name}-${var.environment}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.platform_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecr_policy" {
  role       = aws_iam_role.platform_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "platform_profile" {
  name = "${var.project_name}-${var.environment}-profile"
  role = aws_iam_role.platform_role.name
}

# 2. Security Group for Platform Services
resource "aws_security_group" "platform_sg" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "Allow traffic for n8n, dashboard, and agent gateways"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Recommendation: Restrict to known IPs in production
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    description = "Unified Dashboard"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5678
    to_port     = 5678
    protocol    = "tcp"
    description = "n8n Webhooks/UI"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 54323
    to_port     = 54323
    protocol    = "tcp"
    description = "Supabase Studio"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. EC2 Instance
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }
}

resource "aws_instance" "platform_host" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  iam_instance_profile   = aws_iam_instance_profile.platform_profile.name
  vpc_security_group_ids = [aws_security_group.platform_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              dnf update -y
              dnf install -y docker git
              service docker start
              systemctl enable docker
              usermod -a -G docker ec2-user
              
              # Install Docker Compose V2
              mkdir -p /usr/local/lib/docker/cli-plugins/
              curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
              chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
              
              mkdir -p /home/ec2-user/openrouter-crew-platform
              chown ec2-user:ec2-user /home/ec2-user/openrouter-crew-platform
              EOF

  tags = {
    Name = "${var.project_name}-${var.environment}"
    Environment = var.environment
  }
}
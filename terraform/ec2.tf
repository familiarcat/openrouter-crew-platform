# EC2 Instance
resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.volume_size
    delete_on_termination = true
    encrypted             = true
  }

  user_data = templatefile("${path.module}/userdata.sh", {
    project_name    = var.project_name
    environment     = var.environment
    aws_region      = var.aws_region
    enable_cloudwatch = var.enable_cloudwatch_logs
  })

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}"
    },
    var.tags
  )

  lifecycle {
    ignore_changes = [
      ami, # Don't replace instance on AMI updates
      user_data
    ]
  }
}

# Elastic IP (optional - for stable public IP)
resource "aws_eip" "main" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

resource "aws_eip_association" "main" {
  instance_id   = aws_instance.main.id
  allocation_id = aws_eip.main.id
}

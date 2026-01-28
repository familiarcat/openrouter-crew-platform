# Security Group for EC2 Instance
resource "aws_security_group" "ec2" {
  name_description = "${var.project_name}-ec2-sg"
  description      = "Security group for OpenRouter Crew Platform EC2 instance"
  vpc_id           = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# Outbound - Allow all
resource "aws_vpc_security_group_egress_rule" "ec2_outbound" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Allow all outbound traffic"
}

# Inbound - Dashboard (Next.js)
resource "aws_vpc_security_group_ingress_rule" "dashboard" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 3000
  to_port           = 3000
  cidr_ipv4         = var.allowed_http_cidr[0]
  description       = "Dashboard access (Next.js)"
}

# Inbound - n8n
resource "aws_vpc_security_group_ingress_rule" "n8n" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 5678
  to_port           = 5678
  cidr_ipv4         = var.allowed_http_cidr[0]
  description       = "n8n workflow automation"
}

# Inbound - Supabase Studio
resource "aws_vpc_security_group_ingress_rule" "supabase_studio" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 54323
  to_port           = 54323
  cidr_ipv4         = var.allowed_http_cidr[0]
  description       = "Supabase Studio UI"
}

# Inbound - Supabase Kong (API Gateway)
resource "aws_vpc_security_group_ingress_rule" "supabase_kong" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 8000
  to_port           = 8000
  cidr_ipv4         = var.allowed_http_cidr[0]
  description       = "Supabase Kong API Gateway"
}

# Inbound - Supabase PostgreSQL (if needed externally)
resource "aws_vpc_security_group_ingress_rule" "supabase_postgres" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 54322
  to_port           = 54322
  cidr_ipv4         = var.allowed_http_cidr[0]
  description       = "Supabase PostgreSQL"
}

# Inbound - SSH (optional, only if allowed_ssh_cidr is set)
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  count = length(var.allowed_ssh_cidr) > 0 ? 1 : 0

  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.allowed_ssh_cidr[0]
  description       = "SSH access (prefer SSM)"
}

# Security Group for ALB (if enabled)
resource "aws_security_group" "alb" {
  count = var.create_alb ? 1 : 0

  name_prefix = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

resource "aws_vpc_security_group_egress_rule" "alb_outbound" {
  count = var.create_alb ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Allow all outbound traffic"
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count = var.create_alb ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  description       = "HTTP access"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  count = var.create_alb ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  description       = "HTTPS access"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "openrouter-crew-platform"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium" # 2 vCPU, 4GB RAM - sufficient for n8n + Supabase + Dashboard
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 50
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed to SSH (leave empty for SSM-only access)"
  type        = list(string)
  default     = [] # SSM-only by default
}

variable "allowed_http_cidr" {
  description = "CIDR blocks allowed to access HTTP services"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Public access by default
}

variable "create_alb" {
  description = "Whether to create an Application Load Balancer"
  type        = bool
  default     = false # Start simple, can enable later
}

variable "domain_name" {
  description = "Domain name for ALB (if create_alb is true)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (if create_alb is true)"
  type        = string
  default     = ""
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch Logs for EC2"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

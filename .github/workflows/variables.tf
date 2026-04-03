variable "environment" {
  description = "The deployment environment (e.g., staging, production)"
  type        = string
}

variable "domain_name" {
  description = "The base domain name for the platform"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "project_name" {
  default = "openrouter-crew-platform"
}
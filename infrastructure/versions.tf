terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration should be added here later (e.g., S3 + DynamoDB)
  # backend "s3" { ... }
}
# 🧠 Advanced Engineering Prompts (2026 Standards)

This directory contains high-fidelity prompts designed to guide AI agents (Claude 3.5 Sonnet, GPT-4o, etc.) in resolving specific architectural and maintenance issues within the OpenRouter Crew Platform.

## Usage

These prompts are structured using **XML tags** for context delimitation and **Chain-of-Thought** activation. They are compatible with:
1. **Local AI Clients** (Cursor, VSCode Copilot, Cline)
2. **Web Interfaces** (OpenRouter, ChatGPT, Claude.ai)
3. **CLI Agents** (via `crew` CLI if configured)

## Available Protocols

### 1. Fix VSCode Encoding
**Target**: `domains/vscode-extension`
**Issue**: Base64 encoding failure on emojis (`✅`).
**Goal**: Implement safe UTF-8 buffer handling.

### 2. Fix Dashboard Build
**Target**: `domains/alex-ai-universal/dashboard`
**Issue**: Broken relative imports (`../../../../`) and missing path aliases.
**Goal**: Align import paths with Domain-Driven Design (DDD) boundaries.

## Prompt Engineering Standards

- **<system_role>**: Defines the expert persona (Security Architect, DDD Specialist).
- **<context>**: Provides the exact error logs and environment details.
- **<constraints>**: Enforces the "Dark Forest Protocol" (Verify Then Trust).
- **<execution_steps>**: Detailed algorithmic approach to the solution.
- **<output_format>**: Instructions for unified diffs or shell commands.

## 🏗️ Infrastructure & Deployment

The platform uses **Terraform** with **Workspaces** to manage isolated environments (`staging`, `production`) using a single codebase.

### 1. Terraform Workspace Logic
The deployment orchestrator (`scripts/deploy/deploy-full.sh`) automatically manages workspaces. When you run a deployment, it executes:
```bash
terraform workspace select "staging" || terraform workspace new "staging"
```
This ensures that the state for `staging` never overlaps with `production`.

### 2. Required Variables
Your Terraform modules must declare the following variables in `terraform/variables.tf` to receive values from the deployment script:

```hcl
variable "environment" {
  description = "Target environment (staging, production, etc.)"
  type        = string
}

variable "domain_name" {
  description = "The base domain name for the environment"
  type        = string
}
```

### 3. Remote Backend Configuration
To enable team collaboration and workspace support, define a remote backend in `terraform/backend.tf`. **Note:** You must create the S3 bucket and DynamoDB table manually before the first run.

```hcl
terraform {
  backend "s3" {
    bucket         = "openrouter-crew-terraform-state" # Change to your bucket
    key            = "platform/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "terraform-lock-table"            # Required for state locking
    encrypt        = true
  }
}
```

### 4. Local Deployment
To deploy from your local machine using the unified logic:
```bash
pnpm deploy:aws staging
```
This will provision the infrastructure, build the Docker images, and deploy to EC2.
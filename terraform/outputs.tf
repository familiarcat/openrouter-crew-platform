output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.main.id
}

output "instance_public_ip" {
  description = "EC2 instance public IP (Elastic IP)"
  value       = aws_eip.main.public_ip
}

output "instance_private_ip" {
  description = "EC2 instance private IP"
  value       = aws_instance.main.private_ip
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "security_group_id" {
  description = "EC2 security group ID"
  value       = aws_security_group.ec2.id
}

output "iam_role_name" {
  description = "IAM role name for EC2 instance"
  value       = aws_iam_role.ec2.name
}

output "iam_instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.ec2.name
}

output "dashboard_url" {
  description = "Dashboard URL (HTTP)"
  value       = "http://${aws_eip.main.public_ip}:3000"
}

output "n8n_url" {
  description = "n8n URL (HTTP)"
  value       = "http://${aws_eip.main.public_ip}:5678"
}

output "supabase_studio_url" {
  description = "Supabase Studio URL (HTTP)"
  value       = "http://${aws_eip.main.public_ip}:54323"
}

output "ssm_connect_command" {
  description = "Command to connect via SSM"
  value       = "aws ssm start-session --target ${aws_instance.main.id} --region ${var.aws_region}"
}

output "deployment_command" {
  description = "Example SSM deployment command"
  value       = "aws ssm send-command --instance-ids ${aws_instance.main.id} --document-name AWS-RunShellScript --region ${var.aws_region} --parameters 'commands=[\"cd /home/ec2-user/openrouter-crew-platform && docker-compose -f docker-compose.prod.yml up -d\"]'"
}

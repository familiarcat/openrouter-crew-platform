output "instance_id" {
  value       = aws_instance.platform_host.id
  description = "The ID of the EC2 instance"
}

output "instance_public_ip" {
  value       = aws_instance.platform_host.public_ip
  description = "The public IP of the EC2 instance"
}

output "security_group_id" {
  value = aws_security_group.platform_sg.id
}
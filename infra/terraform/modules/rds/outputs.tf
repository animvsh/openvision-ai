# RDS Module Outputs

output "endpoint" {
  description = "PostgreSQL connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.main.id
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

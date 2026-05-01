# IAM Module Outputs

output "lambda_execution_role_arn" {
  description = "ARN of Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "lambda_permissions_policy_arn" {
  description = "ARN of Lambda permissions policy"
  value       = aws_iam_policy.lambda_permissions.arn
}

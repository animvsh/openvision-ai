# Lambda Module Outputs

output "lambda_function_arns" {
  description = "ARNs of Lambda functions"
  value       = aws_lambda_function.placeholder[*].arn
}

output "lambda_function_names" {
  description = "Names of Lambda functions"
  value       = aws_lambda_function.placeholder[*].function_name
}

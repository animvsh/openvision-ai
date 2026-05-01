# Outputs for OpenVision AI infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
}

output "rds_arn" {
  description = "RDS instance ARN"
  value       = module.rds.arn
}

output "dynamodb_live_camera_state_table_arn" {
  description = "ARN of live_camera_state DynamoDB table"
  value       = module.dynamodb.live_camera_state_table_arn
}

output "dynamodb_dashboard_connections_table_arn" {
  description = "ARN of dashboard_connections DynamoDB table"
  value       = module.dynamodb.dashboard_connections_table_arn
}

output "s3_videos_bucket_name" {
  description = "Name of openvision-videos S3 bucket"
  value       = module.s3.videos_bucket_name
}

output "s3_snippets_bucket_name" {
  description = "Name of openvision-snippets S3 bucket"
  value       = module.s3.snippets_bucket_name
}

output "lambda_execution_role_arn" {
  description = "ARN of Lambda execution role"
  value       = module.iam.lambda_execution_role_arn
}

output "rest_api_endpoint" {
  description = "REST API endpoint URL"
  value       = module.apigateway.rest_api_endpoint
}

output "websocket_api_endpoint" {
  description = "WebSocket API endpoint URL"
  value       = module.apigateway.websocket_api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = module.cognito.identity_pool_id
}

output "sns_topic_arns" {
  description = "ARNs of SNS alert topics"
  value       = module.sns.topic_arns
}

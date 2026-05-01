# DynamoDB Module Outputs

output "live_camera_state_table_name" {
  description = "Name of live_camera_state table"
  value       = aws_dynamodb_table.live_camera_state.name
}

output "live_camera_state_table_arn" {
  description = "ARN of live_camera_state table"
  value       = aws_dynamodb_table.live_camera_state.arn
}

output "dashboard_connections_table_name" {
  description = "Name of dashboard_connections table"
  value       = aws_dynamodb_table.dashboard_connections.name
}

output "dashboard_connections_table_arn" {
  description = "ARN of dashboard_connections table"
  value       = aws_dynamodb_table.dashboard_connections.arn
}

# API Gateway Module Outputs

output "rest_api_id" {
  description = "REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "rest_api_endpoint" {
  description = "REST API endpoint URL"
  value       = "${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "websocket_api_id" {
  description = "WebSocket API ID"
  value       = aws_api_gateway_websocket_api.main.id
}

output "websocket_api_endpoint" {
  description = "WebSocket API endpoint URL"
  value       = "wss://${aws_api_gateway_websocket_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

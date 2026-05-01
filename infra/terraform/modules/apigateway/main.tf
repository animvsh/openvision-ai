# API Gateway Module - REST API and WebSocket API

resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-rest-api"
  description = "REST API for OpenVision AI"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rest-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_api_gateway_resource" "cameras" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "cameras"
}

resource "aws_api_gateway_resource" "alerts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "alerts"
}

resource "aws_api_gateway_method" "cameras_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id  = aws_api_gateway_resource.cameras.id
  http_method  = "GET"
  authorization = "COGNITO_USER_POOLS"
}

resource "aws_api_gateway_method" "cameras_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id  = aws_api_gateway_resource.cameras.id
  http_method  = "POST"
  authorization = "COGNITO_USER_POOLS"
}

resource "aws_api_gateway_integration" "cameras_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cameras.id
  http_method = aws_api_gateway_method.cameras_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_function_arn
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.cameras.id,
      aws_api_gateway_resource.alerts.id,
      aws_api_gateway_method.cameras_get.id,
      aws_api_gateway_method.cameras_post.id
    ]))
  }

  stage_name = var.environment

  depends_on = [
    aws_api_gateway_integration.cameras_lambda
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_deployment.main.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}

# WebSocket API
resource "aws_api_gateway_vpc_link" "main" {
  name        = "${var.project_name}-${var.environment}-vpclink"
  description = "VPC Link for API Gateway"
  subnet_ids  = var.subnet_ids
}

resource "aws_api_gateway_websocket_api" "main" {
  name        = "${var.project_name}-${var.environment}-websocket-api"
  description = "WebSocket API for OpenVision AI real-time connections"

  route_selection_expression = "$request.body.action"

  tags = {
    Name        = "${var.project_name}-${var.environment}-websocket-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_api_gateway_stage" "websocket" {
  deployment_id = aws_api_gateway_websocket_api.main.id
  rest_api_id   = aws_api_gateway_websocket_api.main.id
  stage_name    = var.environment

  tags = {
    Name        = "${var.project_name}-${var.environment}-websocket-stage"
    Environment = var.environment
    Project     = var.project_name
  }
}

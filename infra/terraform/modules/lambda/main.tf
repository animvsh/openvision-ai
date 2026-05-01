# Lambda Module - Placeholder for Lambda functions

resource "aws_lambda_function" "placeholder" {
  count = 1

  function_name = "${var.project_name}-${var.environment}-lambda-${count.index + 1}"
  role         = var.lambda_execution_role_arn
  handler      = "index.handler"
  runtime      = "python3.11"
  timeout      = 300
  memory_size  = 512

  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")
  filename         = "${path.module}/placeholder.zip"

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Note: Replace placeholder.zip with actual Lambda deployment packages
# Each function should have its own source code in the functions/ subdirectory

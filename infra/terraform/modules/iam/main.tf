# IAM Module - Lambda execution roles and Rekognition access

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid     = "LambdaAssumeRole"
    effect  = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "${var.project_name}-${var.environment}-lambda-execution"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-execution"
    Environment = var.environment
    Project     = var.project_name
  }
}

data "aws_iam_policy_document" "lambda_s3_access" {
  statement {
    sid    = "LambdaS3Access"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]

    resources = [
      "arn:aws:s3:::${var.project_name}-${var.environment}-videos/*",
      "arn:aws:s3:::${var.project_name}-${var.environment}-snippets/*"
    ]
  }
}

data "aws_iam_policy_document" "lambda_dynamodb_access" {
  statement {
    sid    = "LambdaDynamoDBAccess"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]

    resources = [
      "arn:aws:dynamodb:*:*:table/${var.project_name}-${var.environment}-live_camera_state",
      "arn:aws:dynamodb:*:*:table/${var.project_name}-${var.environment}-dashboard_connections"
    ]
  }
}

data "aws_iam_policy_document" "lambda_rekognition_access" {
  statement {
    sid    = "LambdaRekognitionAccess"
    effect = "Allow"

    actions = [
      "rekognition:DetectLabels",
      "rekognition:DetectModerationLabels",
      "rekognition:RecognizeCelebrities",
      "rekognition:CompareFaces",
      "rekognition:SearchFacesByImage",
      "rekognition:DescribeCollection",
      "rekognition:IndexFaces"
    ]

    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_rds_access" {
  statement {
    sid    = "LambdaRDSAccess"
    effect = "Allow"

    actions = [
      "rds:DescribeDBInstances",
      "rds:Connect",
      "rds:ExecuteStatement"
    ]

    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_sns_access" {
  statement {
    sid    = "LambdaSNSAccess"
    effect = "Allow"

    actions = [
      "sns:Publish",
      "sns:Subscribe",
      "sns:ListTopics"
    ]

    resources = [
      "arn:aws:sns:*:*:${var.project_name}-${var.environment}-critical-alerts",
      "arn:aws:sns:*:*:${var.project_name}-${var.environment}-high-alerts",
      "arn:aws:sns:*:*:${var.project_name}-${var.environment}-medium-alerts"
    ]
  }
}

resource "aws_iam_policy" "lambda_permissions" {
  name        = "${var.project_name}-${var.environment}-lambda-permissions"
  description = "Lambda execution permissions for OpenVision AI"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      data.aws_iam_policy_document.lambda_s3_access.value,
      data.aws_iam_policy_document.lambda_dynamodb_access.value,
      data.aws_iam_policy_document.lambda_rekognition_access.value,
      data.aws_iam_policy_document.lambda_rds_access.value,
      data.aws_iam_policy_document.lambda_sns_access.value
    )
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-permissions"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "lambda_execution_attachment" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_permissions.arn
}

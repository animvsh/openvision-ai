# API Gateway Module Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of Lambda function for integration"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "Subnet IDs for VPC Link"
  type        = list(string)
  default     = []
}

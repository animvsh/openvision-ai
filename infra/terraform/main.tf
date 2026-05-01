# Root Terraform module for OpenVision AI infrastructure
# Calls all submodules with appropriate configurations

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name  = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids

  depends_on = [module.vpc]
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
  environment = var.environment
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment = var.environment
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  project_name = var.project_name
  environment = var.environment

  depends_on = [module.iam, module.s3, module.dynamodb]
}

# API Gateway Module
module "apigateway" {
  source = "./modules/apigateway"

  project_name = var.project_name
  environment = var.environment
}

# Cognito Module
module "cognito" {
  source = "./modules/cognito"

  project_name = var.project_name
  environment = var.environment
}

# SNS Module
module "sns" {
  source = "./modules/sns"

  project_name = var.project_name
  environment = var.environment
}

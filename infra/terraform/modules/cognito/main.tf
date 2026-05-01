# Cognito Module - User Pool and Identity Pool

resource "aws_cognito_user_pool" "main" {
  name        = "${var.project_name}-${var.environment}-user-pool"
  description = "User pool for OpenVision AI"

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
  }

  auto_verified_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    required           = true
    mutable            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  schema {
    name                = "given_name"
    attribute_data_type = "String"
    required           = false
    mutable            = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    required           = false
    mutable            = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-user-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_client" "main" {
  name            = "${var.project_name}-${var.environment}-client"
  user_pool_id    = aws_cognito_user_pool.main.id
  generate_secret = false

  callback_url  = "https://${var.project_name}.${var.environment}.example.com/callback"
  logout_url   = "https://${var.project_name}.${var.environment}.example.com/logout"

  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                = ["openid", "profile", "email"]
  allowed_oauth_flows_user_pool_client = true

  refresh_token_validation     = null
  access_token_validity       = 60
  id_token_validity           = 60
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id              = aws_cognito_client.main.id
    provider_name          = "cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    server_side_token_check = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-identity-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated   = aws_iam_role.cognito_authenticated.arn
    unauthenticated = aws_iam_role.cognito_unauthenticated.arn
  }
}

data "aws_iam_policy_document" "cognito_assume_role" {
  statement {
    sid     = "CognitoAssumeRole"
    effect  = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "cognito_authenticated" {
  name               = "${var.project_name}-${var.environment}-cognito-authenticated"
  assume_role_policy = data.aws_iam_policy_document.cognito_assume_role.json

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-authenticated"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role" "cognito_unauthenticated" {
  name               = "${var.project_name}-${var.environment}-cognito-unauthenticated"
  assume_role_policy = data.aws_iam_policy_document.cognito_assume_role.json

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-unauthenticated"
    Environment = var.environment
    Project     = var.project_name
  }
}

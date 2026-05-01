# DynamoDB Module - Two tables: live_camera_state, dashboard_connections

resource "aws_dynamodb_table" "live_camera_state" {
  name           = "${var.project_name}-${var.environment}-live_camera_state"
  billing_mode   = "PAY_PER_REQUEST"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  hash_key = "camera_id"

  attribute {
    name = "camera_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "last_updated"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key       = "status"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl_expiry"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-live_camera_state"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "dashboard_connections" {
  name           = "${var.project_name}-${var.environment}-dashboard_connections"
  billing_mode   = "PAY_PER_REQUEST"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  hash_key = "connection_id"

  attribute {
    name = "connection_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "connected_at"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "user-index"
    hash_key       = "user_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl_expiry"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-dashboard_connections"
    Environment = var.environment
    Project     = var.project_name
  }
}

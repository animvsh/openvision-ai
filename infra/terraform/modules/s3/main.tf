# S3 Module - Two buckets with lifecycle rules

resource "aws_s3_bucket" "videos" {
  bucket = "${var.project_name}-${var.environment}-videos"

  tags = {
    Name        = "${var.project_name}-${var.environment}-videos"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket" "snippets" {
  bucket = "${var.project_name}-${var.environment}-snippets"

  tags = {
    Name        = "${var.project_name}-${var.environment}-snippets"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "videos" {
  bucket = aws_s3_bucket.videos.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "snippets" {
  bucket = aws_s3_bucket.snippets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "snippets" {
  bucket = aws_s3_bucket.snippets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    id     = "video-retention"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "snippets" {
  bucket = aws_s3_bucket.snippets.id

  rule {
    id     = "snippet-retention"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 7
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_public_access_block" "videos" {
  bucket = aws_s3_bucket.videos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "snippets" {
  bucket = aws_s3_bucket.snippets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls     = true
  restrict_public_buckets = true
}

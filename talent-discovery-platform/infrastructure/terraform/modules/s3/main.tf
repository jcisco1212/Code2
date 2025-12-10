# S3 Module for Video Storage

variable "environment" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "cloudfront_oai" {
  type = string
}

# Video Storage Bucket
resource "aws_s3_bucket" "videos" {
  bucket = "${var.bucket_name}-${var.environment}"

  tags = {
    Name = "TalentVault Video Storage"
  }
}

# Bucket versioning
resource "aws_s3_bucket_versioning" "videos" {
  bucket = aws_s3_bucket.videos.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "videos" {
  bucket = aws_s3_bucket.videos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration for direct uploads
resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]  # Restrict in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle rules
resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    id     = "move-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "delete-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "temp-files-cleanup"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 1
    }
  }
}

# Bucket policy for CloudFront
resource "aws_s3_bucket_policy" "videos" {
  bucket = aws_s3_bucket.videos.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          AWS = var.cloudfront_oai
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.videos.arn}/processed/*"
      }
    ]
  })
}

# Outputs
output "video_bucket_name" {
  value = aws_s3_bucket.videos.bucket
}

output "video_bucket_arn" {
  value = aws_s3_bucket.videos.arn
}

output "video_bucket_domain" {
  value = aws_s3_bucket.videos.bucket_regional_domain_name
}

output "video_bucket_id" {
  value = aws_s3_bucket.videos.id
}

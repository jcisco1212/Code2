# CloudFront Module for Video Delivery

variable "environment" {
  type = string
}

variable "video_bucket_domain" {
  type = string
}

variable "video_bucket_id" {
  type = string
}

variable "certificate_arn" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "waf_web_acl_id" {
  type = string
}

# Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Get-Noticed ${var.environment} OAI"
}

# CloudFront Cache Policy
resource "aws_cloudfront_cache_policy" "video" {
  name        = "get-noticed-${var.environment}-video-cache"
  comment     = "Cache policy for video content"
  min_ttl     = 1
  default_ttl = 86400    # 1 day
  max_ttl     = 31536000 # 1 year

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["Policy", "Signature", "Key-Pair-Id"]
      }
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Get-Noticed ${var.environment} CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  web_acl_id          = var.waf_web_acl_id

  aliases = var.domain_name != "" ? [var.domain_name] : []

  origin {
    domain_name = var.video_bucket_domain
    origin_id   = "S3-${var.video_bucket_id}"
    origin_path = "/processed"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.video_bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.video.id

    # Require signed URLs for video access
    trusted_key_groups = [aws_cloudfront_key_group.main.id]
  }

  # HLS manifest files
  ordered_cache_behavior {
    path_pattern           = "*.m3u8"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.video_bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.video.id
    trusted_key_groups     = [aws_cloudfront_key_group.main.id]

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # HLS segments
  ordered_cache_behavior {
    path_pattern           = "*.ts"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.video_bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = false
    cache_policy_id        = aws_cloudfront_cache_policy.video.id
    trusted_key_groups     = [aws_cloudfront_key_group.main.id]
  }

  # Thumbnails - no signing required
  ordered_cache_behavior {
    path_pattern           = "thumbnails/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.video_bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.video.id

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.certificate_arn == "" ? true : false
    acm_certificate_arn           = var.certificate_arn != "" ? var.certificate_arn : null
    ssl_support_method            = var.certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version      = "TLSv1.2_2021"
  }

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  tags = {
    Name = "get-noticed-${var.environment}-cdn"
  }
}

# CloudFront Key Group for signed URLs
resource "aws_cloudfront_public_key" "main" {
  name        = "get-noticed-${var.environment}-public-key"
  comment     = "Public key for signed URLs"
  encoded_key = file("${path.module}/public_key.pem")
}

resource "aws_cloudfront_key_group" "main" {
  name    = "get-noticed-${var.environment}-key-group"
  items   = [aws_cloudfront_public_key.main.id]
  comment = "Key group for video signed URLs"
}

# Logging bucket
resource "aws_s3_bucket" "logs" {
  bucket = "get-noticed-${var.environment}-cf-logs"

  tags = {
    Name = "CloudFront Logs"
  }
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  depends_on = [aws_s3_bucket_ownership_controls.logs]
  bucket     = aws_s3_bucket.logs.id
  acl        = "log-delivery-write"
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# Outputs
output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "distribution_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "origin_access_identity_arn" {
  value = aws_cloudfront_origin_access_identity.main.iam_arn
}

output "key_group_id" {
  value = aws_cloudfront_key_group.main.id
}

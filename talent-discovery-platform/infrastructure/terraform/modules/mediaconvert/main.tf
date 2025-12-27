# MediaConvert Module for Video Transcoding

variable "environment" {
  type = string
}

variable "input_bucket_arn" {
  type = string
}

variable "output_bucket_arn" {
  type = string
}

# MediaConvert Queue
resource "aws_media_convert_queue" "main" {
  name   = "get-noticed-${var.environment}"
  status = "ACTIVE"

  tags = {
    Name = "Get-Noticed Video Queue"
  }
}

# IAM Role for MediaConvert
resource "aws_iam_role" "mediaconvert" {
  name = "get-noticed-${var.environment}-mediaconvert"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "mediaconvert.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "MediaConvert Role"
  }
}

resource "aws_iam_role_policy" "mediaconvert" {
  name = "mediaconvert-policy"
  role = aws_iam_role.mediaconvert.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectAcl"
        ]
        Resource = [
          "${var.input_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${var.output_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          var.input_bucket_arn,
          var.output_bucket_arn
        ]
      }
    ]
  })
}

# Get MediaConvert endpoint
data "aws_media_convert_queue" "main" {
  id = aws_media_convert_queue.main.id
}

# Outputs
output "queue_arn" {
  value = aws_media_convert_queue.main.arn
}

output "queue_name" {
  value = aws_media_convert_queue.main.name
}

output "role_arn" {
  value = aws_iam_role.mediaconvert.arn
}

output "endpoint" {
  value = "https://mediaconvert.${data.aws_region.current.name}.amazonaws.com"
}

data "aws_region" "current" {}

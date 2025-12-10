# SQS Module for Message Queues

variable "environment" {
  type = string
}

# Video Processing Queue
resource "aws_sqs_queue" "video_processing" {
  name                       = "talentvault-${var.environment}-video-processing"
  delay_seconds              = 0
  max_message_size          = 262144
  message_retention_seconds  = 1209600  # 14 days
  receive_wait_time_seconds = 20
  visibility_timeout_seconds = 3600  # 1 hour for video processing

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.video_processing_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "Video Processing Queue"
  }
}

# Video Processing Dead Letter Queue
resource "aws_sqs_queue" "video_processing_dlq" {
  name                      = "talentvault-${var.environment}-video-processing-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "Video Processing DLQ"
  }
}

# AI Analysis Queue
resource "aws_sqs_queue" "ai_analysis" {
  name                       = "talentvault-${var.environment}-ai-analysis"
  delay_seconds              = 0
  max_message_size          = 262144
  message_retention_seconds  = 1209600
  receive_wait_time_seconds = 20
  visibility_timeout_seconds = 1800  # 30 minutes for AI analysis

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ai_analysis_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "AI Analysis Queue"
  }
}

# AI Analysis Dead Letter Queue
resource "aws_sqs_queue" "ai_analysis_dlq" {
  name                      = "talentvault-${var.environment}-ai-analysis-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "AI Analysis DLQ"
  }
}

# Email Notification Queue
resource "aws_sqs_queue" "email_notification" {
  name                       = "talentvault-${var.environment}-email-notification"
  delay_seconds              = 0
  max_message_size          = 65536
  message_retention_seconds  = 345600  # 4 days
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 30

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.email_notification_dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name = "Email Notification Queue"
  }
}

# Email Notification Dead Letter Queue
resource "aws_sqs_queue" "email_notification_dlq" {
  name                      = "talentvault-${var.environment}-email-notification-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "Email Notification DLQ"
  }
}

# Trending Calculation Queue
resource "aws_sqs_queue" "trending_calculation" {
  name                       = "talentvault-${var.environment}-trending-calculation"
  delay_seconds              = 0
  max_message_size          = 65536
  message_retention_seconds  = 86400  # 1 day
  receive_wait_time_seconds = 20
  visibility_timeout_seconds = 300  # 5 minutes

  tags = {
    Name = "Trending Calculation Queue"
  }
}

# Outputs
output "video_processing_queue_url" {
  value = aws_sqs_queue.video_processing.url
}

output "video_processing_queue_arn" {
  value = aws_sqs_queue.video_processing.arn
}

output "ai_analysis_queue_url" {
  value = aws_sqs_queue.ai_analysis.url
}

output "ai_analysis_queue_arn" {
  value = aws_sqs_queue.ai_analysis.arn
}

output "email_notification_queue_url" {
  value = aws_sqs_queue.email_notification.url
}

output "trending_calculation_queue_url" {
  value = aws_sqs_queue.trending_calculation.url
}

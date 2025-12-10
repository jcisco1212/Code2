# CloudWatch Module for Monitoring and Alarms

variable "environment" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "alarm_email" {
  type = string
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "talentvault-${var.environment}-alarms"

  tags = {
    Name = "Alarm Notifications"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "talentvault-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Response Time"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "talentvault-${var.environment}-alb", { stat = "Average" }],
            ["...", { stat = "p99" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Request Count"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "talentvault-${var.environment}-alb", { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU Utilization"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", "api", { stat = "Average" }],
            ["...", "ServiceName", "worker", { stat = "Average" }],
            ["...", "ServiceName", "ai", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ECS Memory Utilization"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", "api", { stat = "Average" }],
            ["...", "ServiceName", "worker", { stat = "Average" }],
            ["...", "ServiceName", "ai", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "RDS CPU"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "talentvault-${var.environment}", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "RDS Connections"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "talentvault-${var.environment}", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Redis CPU"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "talentvault-${var.environment}", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          title  = "SQS Messages"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "talentvault-${var.environment}-video-processing", { stat = "Sum" }],
            ["...", "QueueName", "talentvault-${var.environment}-ai-analysis", { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          title  = "CloudFront Requests"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", "DISTRIBUTION_ID", { stat = "Sum" }]
          ]
        }
      }
    ]
  })
}

# Alarms

# API High Response Time
resource "aws_cloudwatch_metric_alarm" "api_response_time" {
  alarm_name          = "talentvault-${var.environment}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 2
  alarm_description   = "API response time is above 2 seconds"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = "talentvault-${var.environment}-alb"
  }

  tags = {
    Name = "API Latency Alarm"
  }
}

# API 5xx Errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "talentvault-${var.environment}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High number of 5xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = "talentvault-${var.environment}-alb"
  }

  tags = {
    Name = "API 5xx Errors Alarm"
  }
}

# ECS CPU High
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "talentvault-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization is above 85%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "api"
  }

  tags = {
    Name = "ECS CPU Alarm"
  }
}

# RDS CPU High
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "talentvault-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is above 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = "talentvault-${var.environment}"
  }

  tags = {
    Name = "RDS CPU Alarm"
  }
}

# RDS Storage Low
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "talentvault-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB
  alarm_description   = "RDS free storage is below 10 GB"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = "talentvault-${var.environment}"
  }

  tags = {
    Name = "RDS Storage Alarm"
  }
}

# SQS DLQ Messages
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "talentvault-${var.environment}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Messages in Dead Letter Queue"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = "talentvault-${var.environment}-video-processing-dlq"
  }

  tags = {
    Name = "DLQ Messages Alarm"
  }
}

# Log Metric Filters
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "talentvault-${var.environment}-error-count"
  pattern        = "ERROR"
  log_group_name = "/ecs/talentvault-${var.environment}"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "TalentVault/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_count" {
  alarm_name          = "talentvault-${var.environment}-error-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "TalentVault/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "High error count in logs"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "Error Count Alarm"
  }
}

data "aws_region" "current" {}

# Outputs
output "sns_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}

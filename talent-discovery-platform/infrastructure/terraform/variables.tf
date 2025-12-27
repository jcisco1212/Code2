# Get-Noticed - Terraform Variables

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# S3 Variables
variable "video_bucket_name" {
  description = "Name for the video storage S3 bucket"
  type        = string
  default     = "get-noticed-videos"
}

# CloudFront Variables
variable "cdn_domain_name" {
  description = "Custom domain for CloudFront distribution"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

# WAF Variables
variable "waf_rate_limit" {
  description = "Rate limit for WAF rules (requests per 5 minutes)"
  type        = number
  default     = 2000
}

# RDS Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "get-noticed"
}

variable "database_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# ElastiCache Variables
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

# ECS Variables
variable "api_image" {
  description = "Docker image for API service"
  type        = string
}

variable "worker_image" {
  description = "Docker image for worker service"
  type        = string
}

variable "ai_image" {
  description = "Docker image for AI services"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for frontend"
  type        = string
}

variable "api_cpu" {
  description = "CPU units for API service"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for API service"
  type        = number
  default     = 1024
}

variable "worker_cpu" {
  description = "CPU units for worker service"
  type        = number
  default     = 1024
}

variable "worker_memory" {
  description = "Memory for worker service"
  type        = number
  default     = 2048
}

# Secrets
variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key for sensitive data"
  type        = string
  sensitive   = true
}

variable "smtp_password" {
  description = "SMTP password for email service"
  type        = string
  sensitive   = true
}

variable "cloudfront_key_pair_id" {
  description = "CloudFront key pair ID for signed URLs"
  type        = string
}

variable "cloudfront_private_key" {
  description = "CloudFront private key for signed URLs"
  type        = string
  sensitive   = true
}

# CloudWatch
variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
}

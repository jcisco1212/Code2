# Get-Noticed - Terraform Infrastructure
# AWS Infrastructure for Video Sharing Platform

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "get-noticed-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Get-Noticed"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# S3 Module for video storage
module "s3" {
  source = "./modules/s3"

  environment     = var.environment
  bucket_name     = var.video_bucket_name
  cloudfront_oai  = module.cloudfront.origin_access_identity_arn
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  environment            = var.environment
  video_bucket_domain    = module.s3.video_bucket_domain
  video_bucket_id        = module.s3.video_bucket_id
  certificate_arn        = var.certificate_arn
  domain_name            = var.cdn_domain_name
  waf_web_acl_id        = module.waf.web_acl_arn
}

# WAF Module
module "waf" {
  source = "./modules/waf"

  environment = var.environment
  rate_limit  = var.waf_rate_limit
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment          = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  instance_class      = var.db_instance_class
  database_name       = var.database_name
  master_username     = var.database_username
  master_password     = var.database_password
  security_group_ids  = [module.vpc.database_security_group_id]
}

# ElastiCache Module (Redis)
module "elasticache" {
  source = "./modules/elasticache"

  environment        = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  node_type         = var.redis_node_type
  security_group_ids = [module.vpc.redis_security_group_id]
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  environment           = var.environment
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  private_subnet_ids   = module.vpc.private_subnet_ids
  alb_security_group   = module.vpc.alb_security_group_id
  ecs_security_group   = module.vpc.ecs_security_group_id

  api_image            = var.api_image
  worker_image         = var.worker_image
  ai_image             = var.ai_image
  frontend_image       = var.frontend_image

  api_cpu              = var.api_cpu
  api_memory           = var.api_memory
  worker_cpu           = var.worker_cpu
  worker_memory        = var.worker_memory

  database_url         = module.rds.connection_string
  redis_url            = module.elasticache.connection_string
  s3_bucket            = module.s3.video_bucket_name
  cloudfront_url       = module.cloudfront.distribution_domain

  certificate_arn      = var.certificate_arn
}

# SQS Module
module "sqs" {
  source = "./modules/sqs"

  environment = var.environment
}

# MediaConvert Module
module "mediaconvert" {
  source = "./modules/mediaconvert"

  environment        = var.environment
  input_bucket_arn   = module.s3.video_bucket_arn
  output_bucket_arn  = module.s3.video_bucket_arn
}

# Lambda Module for video processing triggers
module "lambda" {
  source = "./modules/lambda"

  environment              = var.environment
  video_bucket_arn        = module.s3.video_bucket_arn
  video_bucket_name       = module.s3.video_bucket_name
  sqs_queue_arn           = module.sqs.video_processing_queue_arn
  mediaconvert_endpoint   = module.mediaconvert.endpoint
  mediaconvert_role_arn   = module.mediaconvert.role_arn
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment       = var.environment
  ecs_cluster_name  = module.ecs.cluster_name
  alarm_email       = var.alarm_email
}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.environment}/get-noticed/app-secrets"

  tags = {
    Name = "Get-Noticed App Secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET           = var.jwt_secret
    JWT_REFRESH_SECRET   = var.jwt_refresh_secret
    ENCRYPTION_KEY       = var.encryption_key
    SMTP_PASSWORD        = var.smtp_password
    CLOUDFRONT_KEY_PAIR  = var.cloudfront_key_pair_id
    CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
  })
}

# Outputs
output "api_endpoint" {
  value       = module.ecs.alb_dns_name
  description = "API Load Balancer endpoint"
}

output "cloudfront_domain" {
  value       = module.cloudfront.distribution_domain
  description = "CloudFront distribution domain for video delivery"
}

output "video_bucket" {
  value       = module.s3.video_bucket_name
  description = "S3 bucket for video storage"
}

output "database_endpoint" {
  value       = module.rds.endpoint
  description = "RDS database endpoint"
  sensitive   = true
}

output "redis_endpoint" {
  value       = module.elasticache.endpoint
  description = "ElastiCache Redis endpoint"
  sensitive   = true
}

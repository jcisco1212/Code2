# ElastiCache Module for Redis

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "node_type" {
  type = string
}

variable "security_group_ids" {
  type = list(string)
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name        = "talentvault-${var.environment}-redis-subnet"
  description = "Redis subnet group"
  subnet_ids  = var.subnet_ids

  tags = {
    Name = "talentvault-${var.environment}-redis-subnet"
  }
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name   = "talentvault-${var.environment}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = {
    Name = "talentvault-${var.environment}-redis-params"
  }
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "talentvault-${var.environment}"
  description                = "TalentVault Redis cluster"

  node_type             = var.node_type
  port                  = 6379
  parameter_group_name  = aws_elasticache_parameter_group.main.name
  subnet_group_name     = aws_elasticache_subnet_group.main.name
  security_group_ids    = var.security_group_ids

  automatic_failover_enabled = var.environment == "production" ? true : false
  multi_az_enabled          = var.environment == "production" ? true : false
  num_cache_clusters        = var.environment == "production" ? 2 : 1

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.redis_auth.result

  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"

  auto_minor_version_upgrade = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = {
    Name = "talentvault-${var.environment}-redis"
  }
}

# Random password for Redis AUTH
resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/elasticache/talentvault-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "Redis Logs"
  }
}

# Store auth token in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth" {
  name = "${var.environment}/talentvault/redis-auth"

  tags = {
    Name = "Redis Auth Token"
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# Outputs
output "endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.main.port
}

output "connection_string" {
  value     = "rediss://:${random_password.redis_auth.result}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  sensitive = true
}

output "auth_token_secret_arn" {
  value = aws_secretsmanager_secret.redis_auth.arn
}

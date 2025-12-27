# RDS Module for PostgreSQL Database

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "instance_class" {
  type = string
}

variable "database_name" {
  type = string
}

variable "master_username" {
  type = string
}

variable "master_password" {
  type = string
}

variable "security_group_ids" {
  type = list(string)
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "get-noticed-${var.environment}-db-subnet"
  description = "Database subnet group"
  subnet_ids  = var.subnet_ids

  tags = {
    Name = "get-noticed-${var.environment}-db-subnet"
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "get-noticed-${var.environment}-pg-params"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries over 1 second
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name = "get-noticed-${var.environment}-pg-params"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "get-noticed-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.instance_class
  allocated_storage    = 100
  max_allocated_storage = 500
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az               = var.environment == "production" ? true : false
  publicly_accessible    = false

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "get-noticed-${var.environment}-final-snapshot" : null

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  auto_minor_version_upgrade = true

  tags = {
    Name = "get-noticed-${var.environment}-db"
  }
}

# Read Replica (for production)
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier          = "get-noticed-${var.environment}-replica"
  replicate_source_db = aws_db_instance.main.identifier

  instance_class    = var.instance_class
  storage_encrypted = true

  vpc_security_group_ids = var.security_group_ids
  parameter_group_name   = aws_db_parameter_group.main.name

  publicly_accessible = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "get-noticed-${var.environment}-db-replica"
  }
}

# Outputs
output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "address" {
  value = aws_db_instance.main.address
}

output "port" {
  value = aws_db_instance.main.port
}

output "connection_string" {
  value     = "postgresql://${var.master_username}:${var.master_password}@${aws_db_instance.main.endpoint}/${var.database_name}"
  sensitive = true
}

output "replica_endpoint" {
  value = var.environment == "production" ? aws_db_instance.replica[0].endpoint : null
}

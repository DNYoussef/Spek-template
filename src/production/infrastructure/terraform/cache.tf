# Gary×Taleb Trading System - Redis Cache Infrastructure
# High-performance caching for real-time trading data

# Subnet group for ElastiCache
resource "aws_elasticache_subnet_group" "trading_cache" {
  name       = "${var.cluster_name}-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.cluster_name}-cache-subnet-group"
  }
}

# Security group for Redis
resource "aws_security_group" "trading_cache" {
  name_prefix = "${var.cluster_name}-cache-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from EKS nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.node.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-cache-sg"
  }
}

# Parameter group for Redis optimization
resource "aws_elasticache_parameter_group" "trading_cache" {
  family = "redis7.x"
  name   = "${var.cluster_name}-cache-params"

  # Optimizations for trading workload
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }

  parameter {
    name  = "databases"
    value = "16"
  }

  tags = {
    Name = "${var.cluster_name}-cache-params"
  }
}

# Redis replication group for high availability
resource "aws_elasticache_replication_group" "trading_cache" {
  replication_group_id       = "${var.cluster_name}-cache"
  description                = "Redis cache for Gary×Taleb trading system"

  # Engine configuration
  engine               = "redis"
  engine_version       = "7.0"
  node_type           = var.environment == "production" ? "cache.r7g.xlarge" : "cache.r7g.large"
  port                = 6379
  parameter_group_name = aws_elasticache_parameter_group.trading_cache.name

  # Replication configuration
  num_cache_clusters = var.environment == "production" ? 3 : 2
  multi_az_enabled   = var.environment == "production"

  # Network configuration
  subnet_group_name  = aws_elasticache_subnet_group.trading_cache.name
  security_group_ids = [aws_security_group.trading_cache.id]

  # Backup configuration
  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  # Security configuration
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result
  kms_key_id                = aws_kms_key.eks.arn

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.cache_slow_logs.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Name = "${var.cluster_name}-cache"
  }

  depends_on = [aws_cloudwatch_log_group.cache_slow_logs]
}

# Generate random auth token for Redis
resource "random_password" "redis_auth" {
  length  = 32
  special = false # Redis auth token constraints
}

# Store Redis auth token in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${var.cluster_name}-redis-auth"
  description             = "Redis auth token for Gary×Taleb trading system"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.eks.arn

  tags = {
    Name = "${var.cluster_name}-redis-auth"
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    host       = aws_elasticache_replication_group.trading_cache.primary_endpoint_address
    port       = aws_elasticache_replication_group.trading_cache.port
  })
}

# CloudWatch Log Group for Redis slow logs
resource "aws_cloudwatch_log_group" "cache_slow_logs" {
  name              = "/aws/elasticache/${var.cluster_name}/redis"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.eks.arn

  tags = {
    Name = "${var.cluster_name}-cache-logs"
  }
}
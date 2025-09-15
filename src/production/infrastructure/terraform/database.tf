# Gary×Taleb Trading System - Database Infrastructure
# High-performance PostgreSQL with read replicas for financial data

# DB Subnet Group
resource "aws_db_subnet_group" "trading_db" {
  name       = "${var.cluster_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.cluster_name}-db-subnet-group"
  }
}

# DB Parameter Group for performance optimization
resource "aws_db_parameter_group" "trading_db" {
  family = "postgres15"
  name   = "${var.cluster_name}-db-params"

  # Optimizations for trading workload
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries > 1 second
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16MB"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "2GB"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1" # SSD optimization
  }

  parameter {
    name  = "work_mem"
    value = "32MB"
  }

  tags = {
    Name = "${var.cluster_name}-db-params"
  }
}

# Security group for RDS
resource "aws_security_group" "trading_db" {
  name_prefix = "${var.cluster_name}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
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
    Name = "${var.cluster_name}-db-sg"
  }
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.cluster_name}-db-password"
  description             = "Database password for Gary×Taleb trading system"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.eks.arn

  tags = {
    Name = "${var.cluster_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "trading_admin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.trading_db.endpoint
    port     = aws_db_instance.trading_db.port
    dbname   = aws_db_instance.trading_db.db_name
  })
}

# Primary RDS instance
resource "aws_db_instance" "trading_db" {
  identifier = "${var.cluster_name}-primary"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.r6g.2xlarge" : "db.r6g.large"

  # Storage configuration
  allocated_storage     = 1000
  max_allocated_storage = 10000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.eks.arn
  storage_throughput    = 125
  iops                 = 3000

  # Database configuration
  db_name  = "trading_system"
  username = "trading_admin"
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.trading_db.name
  vpc_security_group_ids = [aws_security_group.trading_db.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  copy_tags_to_snapshot  = true
  delete_automated_backups = false

  # Maintenance configuration
  maintenance_window = "sun:04:00-sun:05:00"
  auto_minor_version_upgrade = false

  # Performance configuration
  parameter_group_name = aws_db_parameter_group.trading_db.name
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Deletion protection for production
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.cluster_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Enable logging
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "${var.cluster_name}-primary-db"
    Role = "primary"
  }

  depends_on = [aws_cloudwatch_log_group.db_logs]
}

# Read replica for reporting and analytics
resource "aws_db_instance" "trading_db_replica" {
  count = var.environment == "production" ? 2 : 0

  identifier = "${var.cluster_name}-replica-${count.index + 1}"

  # Replica configuration
  replicate_source_db = aws_db_instance.trading_db.identifier
  instance_class      = "db.r6g.xlarge"

  # Performance configuration
  performance_insights_enabled = true
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Deletion protection
  deletion_protection = true
  skip_final_snapshot = false

  tags = {
    Name = "${var.cluster_name}-replica-${count.index + 1}"
    Role = "replica"
  }
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "db_logs" {
  name              = "/aws/rds/instance/${var.cluster_name}-primary/postgresql"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.eks.arn

  tags = {
    Name = "${var.cluster_name}-db-logs"
  }
}

# IAM role for RDS monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.cluster_name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
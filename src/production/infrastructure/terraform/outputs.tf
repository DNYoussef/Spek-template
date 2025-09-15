# Gary×Taleb Trading System - Terraform Outputs

output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = aws_iam_role.cluster.name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = aws_iam_role.cluster.arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_primary_security_group_id" {
  description = "Cluster security group that was created by Amazon EKS for the cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "cluster_service_cidr" {
  description = "The CIDR block that Kubernetes pod and service IP addresses are assigned from"
  value       = aws_eks_cluster.main.kubernetes_network_config[0].service_ipv4_cidr
}

output "cluster_version" {
  description = "The Kubernetes version for the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_platform_version" {
  description = "Platform version for the EKS cluster"
  value       = aws_eks_cluster.main.platform_version
}

output "cluster_status" {
  description = "Status of the EKS cluster"
  value       = aws_eks_cluster.main.status
}

output "node_groups" {
  description = "EKS node groups"
  value = {
    trading_apps = {
      arn           = aws_eks_node_group.trading_apps.arn
      status        = aws_eks_node_group.trading_apps.status
      capacity_type = aws_eks_node_group.trading_apps.capacity_type
      instance_types = aws_eks_node_group.trading_apps.instance_types
      scaling_config = aws_eks_node_group.trading_apps.scaling_config
    }
  }
}

output "vpc_id" {
  description = "ID of the VPC where the cluster is deployed"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "security_group_cluster_id" {
  description = "Security group ID for the cluster"
  value       = aws_security_group.cluster.id
}

output "security_group_node_id" {
  description = "Security group ID for the nodes"
  value       = aws_security_group.node.id
}

output "kms_key_id" {
  description = "KMS key ID for cluster encryption"
  value       = aws_kms_key.eks.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for cluster encryption"
  value       = aws_kms_key.eks.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of cloudwatch log group for EKS cluster logs"
  value       = aws_cloudwatch_log_group.cluster.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of cloudwatch log group for EKS cluster logs"
  value       = aws_cloudwatch_log_group.cluster.arn
}

# Configuration for kubectl
output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${var.cluster_name}"
}

# RDS outputs (will be added when we create the database module)
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.trading_db.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.trading_db.port
}

# ElastiCache outputs (will be added when we create the cache module)
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.trading_cache.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.trading_cache.port
}
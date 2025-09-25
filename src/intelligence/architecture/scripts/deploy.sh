#!/bin/bash

# GaryxTaleb Trading System - Phase 3 Deployment Script
# Automated deployment with zero-downtime rolling updates

set -euo pipefail

# Configuration
NAMESPACE="gary-taleb-production"
KUBECONFIG=${KUBECONFIG:-~/.kube/config}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"gary-taleb"}
VERSION=${VERSION:-"3.0.0"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found. Please install kubectl."
    fi

    # Check kubeconfig
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Check kubeconfig."
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker."
    fi

    # Check Helm
    if ! command -v helm &> /dev/null; then
        error "Helm not found. Please install Helm."
    fi

    # Check available resources
    log "Checking cluster resources..."
    available_cpu=$(kubectl top nodes --no-headers | awk '{sum+=$3} END{print sum}' || echo "0")
    available_memory=$(kubectl top nodes --no-headers | awk '{sum+=$5} END{print sum}' || echo "0")

    info "Available CPU: ${available_cpu} cores"
    info "Available Memory: ${available_memory} GB"

    log "Pre-flight checks completed successfully."
}

# Build and push Docker images
build_images() {
    log "Building Docker images..."

    local services=("market-data-gateway" "gary-dpi-analyzer" "execution-engine"
                   "taleb-antifragile-engine" "portfolio-management" "risk-management"
                   "analytics-engine")

    for service in "${services[@]}"; do
        info "Building ${service}:${VERSION}..."

        docker build \
            -t "${DOCKER_REGISTRY}/${service}:${VERSION}" \
            -f "src/intelligence/architecture/deployment/Dockerfile.${service}" \
            . || error "Failed to build ${service}"

        info "Pushing ${service}:${VERSION}..."
        docker push "${DOCKER_REGISTRY}/${service}:${VERSION}" || error "Failed to push ${service}"
    done

    log "All images built and pushed successfully."
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure components..."

    # Create namespace
    kubectl apply -f src/intelligence/architecture/kubernetes/namespace.yaml

    # Deploy Redis cluster
    info "Deploying Redis cluster..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update

    helm upgrade --install redis-cluster bitnami/redis-cluster \
        --namespace ${NAMESPACE} \
        --set cluster.nodes=6 \
        --set cluster.replicas=1 \
        --set auth.enabled=true \
        --set auth.password="redis_password_change_in_production" \
        --set persistence.enabled=true \
        --set persistence.size=50Gi \
        --set persistence.storageClass="high-performance-ssd" \
        --set resources.requests.memory="4Gi" \
        --set resources.requests.cpu="2" \
        --set resources.limits.memory="8Gi" \
        --set resources.limits.cpu="4" \
        --timeout 10m

    # Deploy Kafka cluster
    info "Deploying Kafka cluster..."
    helm repo add strimzi https://strimzi.io/charts/
    helm upgrade --install kafka-operator strimzi/strimzi-kafka-operator \
        --namespace ${NAMESPACE} \
        --timeout 10m

    # Wait for Kafka operator
    kubectl wait --for=condition=Ready pod -l name=strimzi-cluster-operator \
        --namespace ${NAMESPACE} --timeout=300s

    # Apply Kafka cluster configuration
    cat <<EOF | kubectl apply -f -
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: kafka-cluster
  namespace: ${NAMESPACE}
spec:
  kafka:
    version: 3.5.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
      default.replication.factor: 3
      min.insync.replicas: 2
      inter.broker.protocol.version: "3.5"
    storage:
      type: jbod
      volumes:
      - id: 0
        type: persistent-claim
        size: 100Gi
        class: high-performance-ssd
        deleteClaim: false
    resources:
      requests:
        memory: 8Gi
        cpu: "4"
      limits:
        memory: 16Gi
        cpu: "8"
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 50Gi
      class: high-performance-ssd
      deleteClaim: false
    resources:
      requests:
        memory: 2Gi
        cpu: "1"
      limits:
        memory: 4Gi
        cpu: "2"
  entityOperator:
    topicOperator: {}
    userOperator: {}
EOF

    # Deploy PostgreSQL
    info "Deploying PostgreSQL..."
    helm upgrade --install postgresql bitnami/postgresql \
        --namespace ${NAMESPACE} \
        --set auth.postgresPassword="postgres_password_change_in_production" \
        --set auth.username="trading_user" \
        --set auth.password="user_password_change_in_production" \
        --set auth.database="gary_taleb" \
        --set primary.persistence.enabled=true \
        --set primary.persistence.size=200Gi \
        --set primary.persistence.storageClass="high-performance-ssd" \
        --set primary.resources.requests.memory="8Gi" \
        --set primary.resources.requests.cpu="4" \
        --set primary.resources.limits.memory="16Gi" \
        --set primary.resources.limits.cpu="8" \
        --timeout 10m

    log "Infrastructure deployment completed."
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."

    # Create monitoring namespace
    kubectl create namespace gary-taleb-monitoring --dry-run=client -o yaml | kubectl apply -f -

    # Deploy Prometheus
    kubectl apply -f src/intelligence/architecture/monitoring/prometheus-config.yaml

    # Deploy Grafana
    kubectl apply -f src/intelligence/architecture/monitoring/grafana-dashboards.yaml

    # Deploy Jaeger
    kubectl apply -f src/intelligence/architecture/monitoring/jaeger-tracing.yaml

    # Wait for monitoring components
    kubectl wait --for=condition=Ready pod -l app=prometheus \
        --namespace gary-taleb-monitoring --timeout=300s
    kubectl wait --for=condition=Ready pod -l app=grafana \
        --namespace gary-taleb-monitoring --timeout=300s

    log "Monitoring stack deployed successfully."
}

# Deploy core services
deploy_services() {
    log "Deploying core trading services..."

    # Update image versions in deployment files
    local services=("market-data-gateway" "gary-dpi-analyzer" "execution-engine")

    for service in "${services[@]}"; do
        info "Deploying ${service}..."

        # Replace image version
        sed "s|image: gary-taleb/${service}:.*|image: ${DOCKER_REGISTRY}/${service}:${VERSION}|g" \
            "src/intelligence/architecture/kubernetes/${service}-deployment.yaml" | \
            kubectl apply -f -

        # Wait for rollout
        kubectl rollout status deployment/${service} --namespace ${NAMESPACE} --timeout=600s

        # Verify health
        kubectl wait --for=condition=Ready pod -l app=${service} \
            --namespace ${NAMESPACE} --timeout=300s
    done

    log "Core services deployed successfully."
}

# Deploy networking and load balancing
deploy_networking() {
    log "Deploying networking and load balancing..."

    # Deploy load balancer configuration
    kubectl apply -f src/intelligence/architecture/kubernetes/load-balancer-config.yaml

    # Deploy auto-scaling policies
    kubectl apply -f src/intelligence/architecture/kubernetes/auto-scaling-policies.yaml

    # Wait for load balancers
    kubectl wait --for=condition=Ready pod -l app=haproxy-lb \
        --namespace ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=Ready pod -l app=nginx-gateway \
        --namespace ${NAMESPACE} --timeout=300s

    log "Networking deployed successfully."
}

# Health checks and validation
run_health_checks() {
    log "Running health checks..."

    local services=("market-data-gateway" "gary-dpi-analyzer" "execution-engine")
    local failed_checks=0

    for service in "${services[@]}"; do
        info "Checking health of ${service}..."

        # Get service endpoint
        local service_ip=$(kubectl get svc ${service}-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
        local service_port=$(kubectl get svc ${service}-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')

        # Health check with retry
        local retry_count=0
        local max_retries=30

        while [ $retry_count -lt $max_retries ]; do
            if kubectl exec -n ${NAMESPACE} deployment/nginx-gateway -- \
                curl -f -s "http://${service_ip}:${service_port}/health" > /dev/null; then
                info "${service} health check passed"
                break
            else
                retry_count=$((retry_count + 1))
                if [ $retry_count -eq $max_retries ]; then
                    error "${service} health check failed after ${max_retries} attempts"
                    failed_checks=$((failed_checks + 1))
                fi
                sleep 10
            fi
        done
    done

    if [ $failed_checks -eq 0 ]; then
        log "All health checks passed successfully."
    else
        error "${failed_checks} health checks failed."
    fi
}

# Performance validation
run_performance_tests() {
    log "Running performance validation tests..."

    # Deploy test runner
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: performance-test-runner
  namespace: ${NAMESPACE}
spec:
  containers:
  - name: k6
    image: grafana/k6:latest
    command: ["sleep", "3600"]
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "4"
        memory: "8Gi"
  restartPolicy: Never
EOF

    kubectl wait --for=condition=Ready pod/performance-test-runner \
        --namespace ${NAMESPACE} --timeout=120s

    # Run latency tests
    info "Testing execution latency..."
    kubectl exec -n ${NAMESPACE} performance-test-runner -- k6 run -e BASE_URL=http://execution-engine-service:8004 - <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<15'], // 95% of requests must complete below 15ms
  },
};

export default function() {
  let response = http.get(`${__ENV.BASE_URL}/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 15ms': (r) => r.timings.duration < 15,
  });
  sleep(0.1);
}
EOF

    # Cleanup test runner
    kubectl delete pod performance-test-runner -n ${NAMESPACE} --ignore-not-found=true

    log "Performance tests completed successfully."
}

# Rollback function
rollback() {
    local previous_version=$1
    warn "Rolling back to version ${previous_version}..."

    local services=("market-data-gateway" "gary-dpi-analyzer" "execution-engine")

    for service in "${services[@]}"; do
        info "Rolling back ${service}..."
        kubectl set image deployment/${service} \
            ${service}=${DOCKER_REGISTRY}/${service}:${previous_version} \
            --namespace ${NAMESPACE}

        kubectl rollout status deployment/${service} --namespace ${NAMESPACE} --timeout=300s
    done

    warn "Rollback completed."
}

# Cleanup function
cleanup() {
    if [ "$?" -ne 0 ]; then
        error "Deployment failed. Check logs for details."

        # Optionally rollback on failure
        if [ "${ROLLBACK_ON_FAILURE:-false}" = "true" ] && [ -n "${PREVIOUS_VERSION:-}" ]; then
            rollback "${PREVIOUS_VERSION}"
        fi
    fi
}

# Main deployment function
main() {
    log "Starting GaryxTaleb Phase 3 deployment..."
    log "Version: ${VERSION}, Environment: ${ENVIRONMENT}"

    # Set trap for cleanup
    trap cleanup EXIT

    # Deployment steps
    preflight_checks
    build_images
    deploy_infrastructure
    deploy_monitoring
    deploy_services
    deploy_networking
    run_health_checks

    # Optional performance validation
    if [ "${RUN_PERFORMANCE_TESTS:-true}" = "true" ]; then
        run_performance_tests
    fi

    log "Deployment completed successfully!"
    info "Access points:"
    info "  - Trading API: http://$(kubectl get svc nginx-gateway-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
    info "  - Grafana: http://$(kubectl get svc grafana-service -n gary-taleb-monitoring -o jsonpath='{.spec.clusterIP}'):3000"
    info "  - Jaeger: http://$(kubectl get svc gary-taleb-jaeger-query -n gary-taleb-monitoring -o jsonpath='{.spec.clusterIP}'):16686"
}

# Script execution
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        if [ -z "${2:-}" ]; then
            error "Please specify version to rollback to: $0 rollback <version>"
        fi
        rollback "$2"
        ;;
    "health-check")
        run_health_checks
        ;;
    "performance-test")
        run_performance_tests
        ;;
    "cleanup")
        log "Cleaning up resources..."
        kubectl delete namespace ${NAMESPACE} --ignore-not-found=true
        kubectl delete namespace gary-taleb-monitoring --ignore-not-found=true
        log "Cleanup completed."
        ;;
    *)
        error "Usage: $0 {deploy|rollback|health-check|performance-test|cleanup}"
        ;;
esac
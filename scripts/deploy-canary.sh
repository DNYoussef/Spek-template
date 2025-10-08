#!/bin/bash
# Canary Deployment Script for SPEK Platform
# Usage: ./deploy-canary.sh <environment> <image_tag> <deployment_id> [canary_percentage]

set -euo pipefail

# Input validation
ENVIRONMENT=${1:-""}
IMAGE_TAG=${2:-""}
DEPLOYMENT_ID=${3:-""}
CANARY_PERCENTAGE=${4:-"10"}

if [[ -z "$ENVIRONMENT" || -z "$IMAGE_TAG" || -z "$DEPLOYMENT_ID" ]]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 <environment> <image_tag> <deployment_id> [canary_percentage]"
    exit 1
fi

# Configuration
NAMESPACE="$ENVIRONMENT"
APP_NAME="spek-platform"
SERVICE_NAME="$APP_NAME-service"
STABLE_DEPLOYMENT="$APP_NAME-stable"
CANARY_DEPLOYMENT="$APP_NAME-canary"
TIMEOUT=600

echo "🚀 Starting Canary deployment for $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo "Image: $IMAGE_TAG"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Canary Percentage: $CANARY_PERCENTAGE%"

# Function to check deployment readiness
check_deployment_readiness() {
    local deployment_name=$1
    local timeout=$2

    echo "⏳ Waiting for deployment $deployment_name to be ready..."

    if kubectl rollout status deployment/$deployment_name -n $NAMESPACE --timeout=${timeout}s; then
        echo "✅ Deployment $deployment_name is ready"
        return 0
    else
        echo "❌ Deployment $deployment_name failed to become ready within timeout"
        return 1
    fi
}

# Function to validate canary health
validate_canary_health() {
    local deployment_name=$1
    local duration=$2

    echo "🔍 Validating canary health for $deployment_name (${duration}s)..."

    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local success_count=0
    local total_checks=0

    while [[ $(date +%s) -lt $end_time ]]; do
        total_checks=$((total_checks + 1))

        # Get canary pod
        local canary_pod=$(kubectl get pods -n $NAMESPACE -l app=$APP_NAME,version=canary -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

        if [[ -n "$canary_pod" ]]; then
            # Health check
            if kubectl exec -n $NAMESPACE $canary_pod -- curl -f -s http://localhost:8080/health >/dev/null 2>&1; then
                success_count=$((success_count + 1))
            fi
        fi

        sleep 5
    done

    local success_rate=$(( (success_count * 100) / total_checks ))
    echo "📊 Canary health check results: ${success_count}/${total_checks} successful (${success_rate}%)"

    if [[ $success_rate -ge 95 ]]; then
        echo "✅ Canary health validation passed"
        return 0
    else
        echo "❌ Canary health validation failed (${success_rate}% < 95%)"
        return 1
    fi
}

# Function to monitor canary metrics
monitor_canary_metrics() {
    local duration=$1
    echo "📈 Monitoring canary metrics for ${duration}s..."

    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local error_count=0
    local request_count=0

    while [[ $(date +%s) -lt $end_time ]]; do
        # Get metrics from canary pods (simplified)
        local canary_pods=$(kubectl get pods -n $NAMESPACE -l app=$APP_NAME,version=canary -o jsonpath='{.items[*].metadata.name}')

        for pod in $canary_pods; do
            if kubectl exec -n $NAMESPACE $pod -- curl -f -s http://localhost:8080/metrics 2>/dev/null | grep -q "http_requests_total"; then
                request_count=$((request_count + 1))
            else
                error_count=$((error_count + 1))
            fi
        done

        sleep 10
    done

    local error_rate=0
    if [[ $request_count -gt 0 ]]; then
        error_rate=$(( (error_count * 100) / (error_count + request_count) ))
    fi

    echo "📊 Canary metrics: Error rate ${error_rate}%, Requests: $request_count, Errors: $error_count"

    if [[ $error_rate -le 5 ]]; then
        echo "✅ Canary metrics validation passed"
        return 0
    else
        echo "❌ Canary metrics validation failed (${error_rate}% > 5%)"
        return 1
    fi
}

# Function to gradually increase traffic
increase_canary_traffic() {
    local target_percentage=$1
    local current_percentage=0
    local increment=5

    echo "📈 Gradually increasing canary traffic to $target_percentage%"

    while [[ $current_percentage -lt $target_percentage ]]; do
        current_percentage=$((current_percentage + increment))
        if [[ $current_percentage -gt $target_percentage ]]; then
            current_percentage=$target_percentage
        fi

        echo "🔄 Setting canary traffic to $current_percentage%"
        update_traffic_split $current_percentage

        # Wait and validate before next increment
        sleep 30
        if ! validate_canary_health "quick-check" 30; then
            echo "❌ Canary validation failed at $current_percentage%, rolling back"
            return 1
        fi
    done

    echo "✅ Successfully increased canary traffic to $target_percentage%"
    return 0
}

# Function to update traffic split
update_traffic_split() {
    local canary_percentage=$1
    local stable_percentage=$((100 - canary_percentage))

    echo "🔄 Updating traffic split: Stable ${stable_percentage}%, Canary ${canary_percentage}%"

    # Create VirtualService for traffic splitting (Istio)
    if command -v istioctl &> /dev/null; then
        cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: $APP_NAME-vs
  namespace: $NAMESPACE
spec:
  hosts:
  - $SERVICE_NAME
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: $SERVICE_NAME
        subset: canary
      weight: 100
  - route:
    - destination:
        host: $SERVICE_NAME
        subset: stable
      weight: $stable_percentage
    - destination:
        host: $SERVICE_NAME
        subset: canary
      weight: $canary_percentage
EOF
    else
        # Fallback: Update service selector weights (simplified)
        echo "⚠️  Istio not available, using simplified traffic splitting"
    fi
}

# Create canary deployment manifest
create_canary_deployment() {
    echo "📝 Creating canary deployment manifest..."

    cat <<EOF > /tmp/canary-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $CANARY_DEPLOYMENT
  namespace: $NAMESPACE
  labels:
    app: $APP_NAME
    version: canary
    deployment-id: $DEPLOYMENT_ID
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $APP_NAME
      version: canary
  template:
    metadata:
      labels:
        app: $APP_NAME
        version: canary
        deployment-id: $DEPLOYMENT_ID
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: $APP_NAME
        image: $IMAGE_TAG
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: NODE_ENV
          value: $ENVIRONMENT
        - name: DEPLOYMENT_ID
          value: $DEPLOYMENT_ID
        - name: VERSION
          value: canary
        - name: FEATURE_FLAGS
          value: "canary-features=true"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      restartPolicy: Always
---
apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME-canary-service
  namespace: $NAMESPACE
  labels:
    app: $APP_NAME
    version: canary
spec:
  selector:
    app: $APP_NAME
    version: canary
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  type: ClusterIP
EOF
}

# Function to rollback canary
rollback_canary() {
    echo "🔄 Rolling back canary deployment..."

    # Set traffic to 100% stable
    update_traffic_split 0

    # Delete canary deployment
    kubectl delete deployment $CANARY_DEPLOYMENT -n $NAMESPACE --ignore-not-found=true
    kubectl delete service $APP_NAME-canary-service -n $NAMESPACE --ignore-not-found=true

    echo "✅ Canary rollback completed"
}

# Function to promote canary to stable
promote_canary() {
    echo "🎉 Promoting canary to stable..."

    # Update stable deployment with canary image
    kubectl set image deployment/$STABLE_DEPLOYMENT $APP_NAME=$IMAGE_TAG -n $NAMESPACE

    # Wait for stable deployment to complete
    if check_deployment_readiness $STABLE_DEPLOYMENT $TIMEOUT; then
        # Set all traffic to stable
        update_traffic_split 0

        # Cleanup canary deployment
        kubectl delete deployment $CANARY_DEPLOYMENT -n $NAMESPACE
        kubectl delete service $APP_NAME-canary-service -n $NAMESPACE

        echo "✅ Canary promoted to stable successfully"
    else
        echo "❌ Failed to promote canary to stable"
        return 1
    fi
}

# Main canary deployment flow
main() {
    echo "🚀 Starting canary deployment process..."

    # Ensure stable deployment exists
    if ! kubectl get deployment $STABLE_DEPLOYMENT -n $NAMESPACE >/dev/null 2>&1; then
        echo "📦 Creating initial stable deployment..."
        kubectl create deployment $STABLE_DEPLOYMENT --image=$IMAGE_TAG -n $NAMESPACE
        kubectl expose deployment $STABLE_DEPLOYMENT --port=80 --target-port=8080 --name=$SERVICE_NAME -n $NAMESPACE

        if check_deployment_readiness $STABLE_DEPLOYMENT $TIMEOUT; then
            echo "✅ Initial stable deployment created successfully"
        else
            echo "❌ Failed to create initial stable deployment"
            exit 1
        fi
    fi

    # Create and deploy canary
    create_canary_deployment
    echo "🚀 Deploying canary version..."
    kubectl apply -f /tmp/canary-deployment.yaml

    # Wait for canary deployment to be ready
    if ! check_deployment_readiness $CANARY_DEPLOYMENT $TIMEOUT; then
        echo "❌ Canary deployment failed, cleaning up"
        rollback_canary
        exit 1
    fi

    # Initial canary health validation
    if ! validate_canary_health $CANARY_DEPLOYMENT 60; then
        echo "❌ Initial canary health check failed, rolling back"
        rollback_canary
        exit 1
    fi

    # Start with small traffic percentage
    update_traffic_split 5

    # Monitor canary for 5 minutes
    echo "📊 Monitoring canary deployment for 5 minutes..."
    if ! monitor_canary_metrics 300; then
        echo "❌ Canary metrics validation failed, rolling back"
        rollback_canary
        exit 1
    fi

    # Gradually increase traffic if specified
    if [[ $CANARY_PERCENTAGE -gt 5 ]]; then
        if ! increase_canary_traffic $CANARY_PERCENTAGE; then
            rollback_canary
            exit 1
        fi

        # Final monitoring period
        echo "📊 Final monitoring period (10 minutes)..."
        if ! monitor_canary_metrics 600; then
            echo "❌ Final canary validation failed, rolling back"
            rollback_canary
            exit 1
        fi
    fi

    echo "✅ Canary deployment successful!"
    echo "📊 Canary is now receiving $CANARY_PERCENTAGE% of traffic"
    echo "🎯 To promote canary to stable, run: kubectl patch deployment $STABLE_DEPLOYMENT -n $NAMESPACE -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$APP_NAME\",\"image\":\"$IMAGE_TAG\"}]}}}}'"
    echo "🔄 To rollback canary, run: $0 rollback $ENVIRONMENT $DEPLOYMENT_ID"

    # Cleanup temp files
    rm -f /tmp/canary-deployment.yaml
}

# Handle rollback command
if [[ "${1:-}" == "rollback" ]]; then
    ENVIRONMENT=${2:-""}
    DEPLOYMENT_ID=${3:-""}

    if [[ -z "$ENVIRONMENT" ]]; then
        echo "Error: Environment required for rollback"
        echo "Usage: $0 rollback <environment> <deployment_id>"
        exit 1
    fi

    NAMESPACE="$ENVIRONMENT"
    echo "🔄 Rolling back canary deployment in $ENVIRONMENT"
    rollback_canary
    exit 0
fi

# Handle promote command
if [[ "${1:-}" == "promote" ]]; then
    ENVIRONMENT=${2:-""}
    DEPLOYMENT_ID=${3:-""}

    if [[ -z "$ENVIRONMENT" ]]; then
        echo "Error: Environment required for promotion"
        echo "Usage: $0 promote <environment> <deployment_id>"
        exit 1
    fi

    NAMESPACE="$ENVIRONMENT"
    echo "🎉 Promoting canary deployment in $ENVIRONMENT"
    promote_canary
    exit 0
fi

# Run main deployment flow
main
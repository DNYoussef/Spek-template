#!/bin/bash
# Blue-Green Deployment Script for SPEK Platform
# Usage: ./deploy-blue-green.sh <environment> <image_tag> <deployment_id>

set -euo pipefail

# Input validation
ENVIRONMENT=${1:-""}
IMAGE_TAG=${2:-""}
DEPLOYMENT_ID=${3:-""}

if [[ -z "$ENVIRONMENT" || -z "$IMAGE_TAG" || -z "$DEPLOYMENT_ID" ]]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 <environment> <image_tag> <deployment_id>"
    exit 1
fi

# Configuration
NAMESPACE="$ENVIRONMENT"
APP_NAME="spek-platform"
SERVICE_NAME="$APP_NAME-service"
BLUE_DEPLOYMENT="$APP_NAME-blue"
GREEN_DEPLOYMENT="$APP_NAME-green"
TIMEOUT=600

echo "🚀 Starting Blue-Green deployment for $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo "Image: $IMAGE_TAG"
echo "Deployment ID: $DEPLOYMENT_ID"

# Function to check deployment status
check_deployment_status() {
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

# Function to check application health
check_app_health() {
    local deployment_name=$1
    local max_attempts=30
    local attempt=1

    echo "🔍 Checking application health for $deployment_name..."

    while [[ $attempt -le $max_attempts ]]; do
        echo "Health check attempt $attempt/$max_attempts"

        # Get a pod from the deployment
        pod=$(kubectl get pods -n $NAMESPACE -l app=$deployment_name -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

        if [[ -n "$pod" ]]; then
            # Check if pod is ready
            if kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
                # Check health endpoint
                if kubectl exec -n $NAMESPACE $pod -- curl -f -s http://localhost:8080/health >/dev/null 2>&1; then
                    echo "✅ Application health check passed for $deployment_name"
                    return 0
                fi
            fi
        fi

        echo "⏳ Health check failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done

    echo "❌ Application health check failed for $deployment_name"
    return 1
}

# Determine current active deployment
echo "🔍 Determining current active deployment..."
CURRENT_SELECTOR=$(kubectl get service $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "")

if [[ "$CURRENT_SELECTOR" == "blue" ]]; then
    ACTIVE_DEPLOYMENT=$BLUE_DEPLOYMENT
    INACTIVE_DEPLOYMENT=$GREEN_DEPLOYMENT
    NEW_VERSION="green"
    echo "Current active: Blue, deploying to: Green"
elif [[ "$CURRENT_SELECTOR" == "green" ]]; then
    ACTIVE_DEPLOYMENT=$GREEN_DEPLOYMENT
    INACTIVE_DEPLOYMENT=$BLUE_DEPLOYMENT
    NEW_VERSION="blue"
    echo "Current active: Green, deploying to: Blue"
else
    # First deployment - deploy to blue
    ACTIVE_DEPLOYMENT=""
    INACTIVE_DEPLOYMENT=$BLUE_DEPLOYMENT
    NEW_VERSION="blue"
    echo "First deployment, deploying to: Blue"
fi

# Create deployment manifest for new version
cat <<EOF > /tmp/deployment-$NEW_VERSION.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME-$NEW_VERSION
  namespace: $NAMESPACE
  labels:
    app: $APP_NAME
    version: $NEW_VERSION
    deployment-id: $DEPLOYMENT_ID
spec:
  replicas: 3
  selector:
    matchLabels:
      app: $APP_NAME
      version: $NEW_VERSION
  template:
    metadata:
      labels:
        app: $APP_NAME
        version: $NEW_VERSION
        deployment-id: $DEPLOYMENT_ID
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
          value: $NEW_VERSION
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
  name: $APP_NAME-$NEW_VERSION-service
  namespace: $NAMESPACE
  labels:
    app: $APP_NAME
    version: $NEW_VERSION
spec:
  selector:
    app: $APP_NAME
    version: $NEW_VERSION
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  type: ClusterIP
EOF

# Deploy new version
echo "🚀 Deploying new version ($NEW_VERSION)..."
kubectl apply -f /tmp/deployment-$NEW_VERSION.yaml

# Wait for new deployment to be ready
if ! check_deployment_status "$APP_NAME-$NEW_VERSION" $TIMEOUT; then
    echo "❌ New deployment failed, aborting blue-green switch"
    exit 1
fi

# Perform health checks on new deployment
if ! check_app_health "$APP_NAME-$NEW_VERSION"; then
    echo "❌ Health checks failed for new deployment, aborting blue-green switch"
    exit 1
fi

# Run smoke tests against new deployment
echo "🧪 Running smoke tests against new deployment..."
NEW_SERVICE_IP=$(kubectl get service $APP_NAME-$NEW_VERSION-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')

# Basic connectivity test
if kubectl run smoke-test-$DEPLOYMENT_ID --rm -i --restart=Never --image=curlimages/curl:latest -- \
    curl -f -s http://$NEW_SERVICE_IP:80/health; then
    echo "✅ Smoke tests passed"
else
    echo "❌ Smoke tests failed, aborting blue-green switch"
    kubectl delete deployment $APP_NAME-$NEW_VERSION -n $NAMESPACE
    exit 1
fi

# Switch traffic to new version
echo "🔄 Switching traffic to new version ($NEW_VERSION)..."
kubectl patch service $SERVICE_NAME -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$NEW_VERSION'"}}}'

# Verify traffic switch
sleep 10
echo "🔍 Verifying traffic switch..."
if kubectl exec -n $NAMESPACE deployment/$APP_NAME-$NEW_VERSION -- curl -f -s http://localhost:8080/health >/dev/null; then
    echo "✅ Traffic successfully switched to $NEW_VERSION"
else
    echo "❌ Traffic switch verification failed"
    # Rollback
    if [[ -n "$ACTIVE_DEPLOYMENT" ]]; then
        OLD_VERSION=$(echo $ACTIVE_DEPLOYMENT | sed 's/.*-//')
        kubectl patch service $SERVICE_NAME -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$OLD_VERSION'"}}}'
        echo "🔄 Rolled back to previous version"
    fi
    exit 1
fi

# Clean up old deployment (after successful switch)
if [[ -n "$ACTIVE_DEPLOYMENT" ]]; then
    echo "🧹 Cleaning up old deployment ($ACTIVE_DEPLOYMENT)..."
    kubectl delete deployment $ACTIVE_DEPLOYMENT -n $NAMESPACE
    OLD_SERVICE=$(echo $ACTIVE_DEPLOYMENT | sed 's/deployment/service/')
    kubectl delete service $OLD_SERVICE-service -n $NAMESPACE 2>/dev/null || true
fi

# Update deployment annotation
kubectl annotate deployment $APP_NAME-$NEW_VERSION -n $NAMESPACE \
    deployment.kubernetes.io/revision=$(date +%s) \
    spek.ai/deployment-id=$DEPLOYMENT_ID \
    spek.ai/deployment-strategy=blue-green \
    spek.ai/deployment-time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "🎉 Blue-Green deployment completed successfully!"
echo "Active version: $NEW_VERSION"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Service endpoint: $SERVICE_NAME.$NAMESPACE.svc.cluster.local"

# Cleanup temp files
rm -f /tmp/deployment-$NEW_VERSION.yaml
#!/bin/bash
# SPEK Enhanced Development Platform - Desktop Container Startup Script
# Production-ready startup script for Bytebot desktop automation containers
# Version: 1.0.0
# Last Updated: 2024-09-18

set -euo pipefail

# ==========================================
# CONFIGURATION AND CONSTANTS
# ==========================================

# Script metadata
SCRIPT_NAME="start-desktop-containers.sh"
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Docker configuration
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/$DOCKER_COMPOSE.desktop.yml"
DOCKER_COMPOSE="docker compose"  # Using Docker Compose V2 (plugin)
ENV_FILE="$PROJECT_ROOT/docker/bytebot/.env"
ENV_EXAMPLE="$PROJECT_ROOT/docker/bytebot/.env.example"

# Logging
LOG_FILE="$PROJECT_ROOT/.claude/.artifacts/desktop/startup.log"
ERROR_LOG="$PROJECT_ROOT/.claude/.artifacts/desktop/errors.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==========================================
# UTILITY FUNCTIONS
# ==========================================

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" >&2
            echo "[$timestamp] [ERROR] $message" >> "$ERROR_LOG"
            echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            echo "[$timestamp] [SUCCESS] $message" >> "$LOG_FILE"
            ;;
        "DEBUG")
            if [[ "${DEBUG:-false}" == "true" ]]; then
                echo -e "${MAGENTA}[DEBUG]${NC} $message"
                echo "[$timestamp] [DEBUG] $message" >> "$LOG_FILE"
            fi
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    cleanup_on_error
    exit 1
}

# Cleanup function for errors
cleanup_on_error() {
    log "INFO" "Performing cleanup due to error..."
    # Stop any partially started containers
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Progress indicator
show_progress() {
    local pid=$1
    local message="$2"
    local spin='-\|/'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r${CYAN}%s${NC} %c" "$message" "${spin:$i:1}"
        sleep 0.1
    done
    printf "\r%s... ${GREEN}Done${NC}\n" "$message"
}

# ==========================================
# PRE-FLIGHT CHECKS
# ==========================================

check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Docker
    if ! command_exists docker; then
        error_exit "Docker is not installed or not in PATH"
    fi
    
    # Check Docker Compose
    if ! command_exists $DOCKER_COMPOSE && ! docker compose version >/dev/null 2>&1; then
        error_exit "Docker Compose is not installed or not available"
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker daemon is not running"
    fi
    
    # Check Docker Compose file
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error_exit "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi
    
    log "SUCCESS" "Prerequisites check passed"
}

check_environment() {
    log "INFO" "Checking environment configuration..."
    
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            log "WARN" "Environment file not found. Creating from example..."
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log "WARN" "Please edit $ENV_FILE with your configuration before running again"
            error_exit "Environment file created but needs configuration"
        else
            error_exit "Environment file not found: $ENV_FILE"
        fi
    fi
    
    # Source environment file for validation
    source "$ENV_FILE"
    
    # Check critical environment variables
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "SESSION_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error_exit "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    # Warn about default passwords
    if [[ "$POSTGRES_PASSWORD" == "SecurePassword123!ChangeMe" ]]; then
        log "WARN" "Using default PostgreSQL password. Change it for production!"
    fi
    
    if [[ "$REDIS_PASSWORD" == "RedisSecure456!ChangeMe" ]]; then
        log "WARN" "Using default Redis password. Change it for production!"
    fi
    
    log "SUCCESS" "Environment configuration check passed"
}

check_resources() {
    log "INFO" "Checking system resources..."
    
    # Check available memory (requires /proc/meminfo on Linux)
    if [[ -f /proc/meminfo ]]; then
        local available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        local required_mem=8388608  # 8GB in KB
        
        if [[ $available_mem -lt $required_mem ]]; then
            log "WARN" "Low available memory: $(($available_mem / 1024))MB. Recommended: 8GB+"
        fi
    fi
    
    # Check disk space
    local available_space=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    local required_space=10485760  # 10GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log "WARN" "Low disk space: $(($available_space / 1024))MB. Recommended: 10GB+"
    fi
    
    log "SUCCESS" "Resource check completed"
}

# ==========================================
# DIRECTORY SETUP
# ==========================================

setup_directories() {
    log "INFO" "Setting up required directories..."
    
    local directories=(
        "$PROJECT_ROOT/.claude/.artifacts/desktop"
        "$PROJECT_ROOT/data/postgres"
        "$PROJECT_ROOT/data/evidence"
        "$PROJECT_ROOT/data/screenshots"
        "$PROJECT_ROOT/data/logs"
        "$PROJECT_ROOT/data/agent"
        "$PROJECT_ROOT/data/redis"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log "DEBUG" "Creating directory: $dir"
            mkdir -p "$dir" || error_exit "Failed to create directory: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 "$PROJECT_ROOT/data"/* 2>/dev/null || true
    
    log "SUCCESS" "Directory setup completed"
}

# ==========================================
# DOCKER OPERATIONS
# ==========================================

check_existing_containers() {
    log "INFO" "Checking for existing containers..."
    
    local existing_containers
    existing_containers=$($DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps -q 2>/dev/null || true)
    
    if [[ -n "$existing_containers" ]]; then
        log "WARN" "Found existing containers. Stopping them..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
        log "SUCCESS" "Existing containers stopped"
    fi
}

pull_images() {
    log "INFO" "Pulling latest Docker images..."
    
    # Pull images in background and show progress
    {
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" pull --quiet
    } &
    local pull_pid=$!
    
    show_progress $pull_pid "Pulling Docker images"
    wait $pull_pid
    
    if [[ $? -eq 0 ]]; then
        log "SUCCESS" "Docker images pulled successfully"
    else
        error_exit "Failed to pull Docker images"
    fi
}

start_containers() {
    log "INFO" "Starting desktop automation containers..."
    
    # Start containers with proper ordering
    local start_cmd="$DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE up -d --remove-orphans"
    
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        eval "$start_cmd"
    else
        {
            eval "$start_cmd" >/dev/null 2>&1
        } &
        local start_pid=$!
        
        show_progress $start_pid "Starting containers"
        wait $start_pid
    fi
    
    if [[ $? -eq 0 ]]; then
        log "SUCCESS" "Containers started successfully"
    else
        error_exit "Failed to start containers"
    fi
}

wait_for_health_checks() {
    log "INFO" "Waiting for services to become healthy..."
    
    local max_wait=300  # 5 minutes
    local wait_interval=10
    local elapsed=0
    
    while [[ $elapsed -lt $max_wait ]]; do
        local unhealthy_services
        unhealthy_services=$($DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps --filter "health=unhealthy" --format "table {{.Service}}" | tail -n +2)
        
        if [[ -z "$unhealthy_services" ]]; then
            log "SUCCESS" "All services are healthy"
            return 0
        fi
        
        log "DEBUG" "Waiting for services to become healthy: $unhealthy_services"
        sleep $wait_interval
        elapsed=$((elapsed + wait_interval))
    done
    
    log "ERROR" "Timeout waiting for services to become healthy"
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps
    return 1
}

# ==========================================
# VALIDATION AND TESTING
# ==========================================

validate_services() {
    log "INFO" "Validating service endpoints..."
    
    # Source environment for port configuration
    source "$ENV_FILE"
    
    local services=(
        "Bytebot Desktop:http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}/health"
        "Bytebot Agent:http://localhost:${BYTEBOT_AGENT_PORT:-9991}/health"
        "Bytebot UI:http://localhost:${BYTEBOT_UI_PORT:-9992}/health"
        "Evidence Collector:http://localhost:${EVIDENCE_PORT:-8080}/health"
    )
    
    local failed_services=()
    
    for service_info in "${services[@]}"; do
        local service_name="${service_info%%:*}"
        local service_url="${service_info##*:}"
        
        log "DEBUG" "Checking $service_name at $service_url"
        
        if curl -f -s "$service_url" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name is responding"
        else
            log "ERROR" "$service_name is not responding at $service_url"
            failed_services+=("$service_name")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log "ERROR" "Failed service validation for: ${failed_services[*]}"
        return 1
    fi
    
    log "SUCCESS" "All services validated successfully"
}

run_integration_tests() {
    log "INFO" "Running basic integration tests..."
    
    # Test database connectivity
    local db_test_result
    db_test_result=$($DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-spekuser}" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        log "SUCCESS" "Database connectivity test passed"
    else
        log "ERROR" "Database connectivity test failed: $db_test_result"
        return 1
    fi
    
    # Test Redis connectivity
    local redis_test_result
    redis_test_result=$($DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping 2>&1)
    
    if [[ "$redis_test_result" == "PONG" ]]; then
        log "SUCCESS" "Redis connectivity test passed"
    else
        log "ERROR" "Redis connectivity test failed: $redis_test_result"
        return 1
    fi
    
    log "SUCCESS" "Integration tests completed"
}

# ==========================================
# MONITORING AND STATUS
# ==========================================

show_status() {
    log "INFO" "Desktop Automation Environment Status:"
    
    echo
    echo -e "${CYAN}=== Container Status ===${NC}"
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps
    
    echo
    echo -e "${CYAN}=== Service URLs ===${NC}"
    source "$ENV_FILE"
    echo -e "${GREEN}Bytebot Desktop:${NC} http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}"
    echo -e "${GREEN}Bytebot Agent:${NC} http://localhost:${BYTEBOT_AGENT_PORT:-9991}"
    echo -e "${GREEN}Bytebot UI:${NC} http://localhost:${BYTEBOT_UI_PORT:-9992}"
    echo -e "${GREEN}VNC Access:${NC} http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}/vnc.html"
    echo -e "${GREEN}Evidence Collector:${NC} http://localhost:${EVIDENCE_PORT:-8080}"
    
    echo
    echo -e "${CYAN}=== System Resources ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $($DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps -q) 2>/dev/null || echo "No containers running"
    
    echo
    echo -e "${CYAN}=== Quick Commands ===${NC}"
    echo -e "${YELLOW}View logs:${NC} $DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE logs -f [service]"
    echo -e "${YELLOW}Stop services:${NC} $DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE down"
    echo -e "${YELLOW}Restart service:${NC} $DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE restart [service]"
    echo -e "${YELLOW}Shell access:${NC} $DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE exec [service] /bin/bash"
}

generate_startup_report() {
    local report_file="$PROJECT_ROOT/.claude/.artifacts/desktop/startup-report-$(date +%Y%m%d-%H%M%S).json"
    
    log "INFO" "Generating startup report: $report_file"
    
    cat > "$report_file" << EOF
{
  "startup_report": {
    "timestamp": "$(date -Iseconds)",
    "script_version": "$SCRIPT_VERSION",
    "environment": {
      "project_root": "$PROJECT_ROOT",
      "docker_compose_file": "$DOCKER_COMPOSE_FILE",
      "env_file": "$ENV_FILE"
    },
    "services": {
      "bytebot_desktop": {
        "port": "${BYTEBOT_DESKTOP_PORT:-9990}",
        "url": "http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}",
        "vnc_url": "http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}/vnc.html"
      },
      "bytebot_agent": {
        "port": "${BYTEBOT_AGENT_PORT:-9991}",
        "url": "http://localhost:${BYTEBOT_AGENT_PORT:-9991}"
      },
      "bytebot_ui": {
        "port": "${BYTEBOT_UI_PORT:-9992}",
        "url": "http://localhost:${BYTEBOT_UI_PORT:-9992}"
      },
      "evidence_collector": {
        "port": "${EVIDENCE_PORT:-8080}",
        "url": "http://localhost:${EVIDENCE_PORT:-8080}"
      }
    },
    "data_directories": {
      "postgres": "$PROJECT_ROOT/data/postgres",
      "evidence": "$PROJECT_ROOT/data/evidence",
      "screenshots": "$PROJECT_ROOT/data/screenshots",
      "logs": "$PROJECT_ROOT/data/logs",
      "agent": "$PROJECT_ROOT/data/agent",
      "redis": "$PROJECT_ROOT/data/redis"
    },
    "status": "success",
    "startup_duration": "$(($(date +%s) - START_TIME))s"
  }
}
EOF
    
    log "SUCCESS" "Startup report generated: $report_file"
}

# ==========================================
# MAIN EXECUTION
# ==========================================

print_banner() {
    cat << 'EOF'

   _____ _____  ______ _  __   _____            _                  
  / ____|  __ \|  ____| |/ /  |  __ \          | |                 
 | (___ | |__) | |__  | ' /   | |  | | ___  ___| | ___ ___  _ __    
  \___ \|  ___/|  __| |  <    | |  | |/ _ \/ __| |/ / __/ _ \| '_ \   
  ____) | |    | |____| . \   | |__| |  __/\__ \   <| (_| (_) | |_) |  
 |_____/|_|    |______|_|\_\  |_____/ \___||___/_|\_\\___\___/| .__/   
                                                           | |      
                          Desktop Automation               |_|      

EOF
    
    echo -e "${CYAN}SPEK Enhanced Development Platform${NC}"
    echo -e "${YELLOW}Desktop Automation Container Startup${NC}"
    echo -e "Version: $SCRIPT_VERSION"
    echo
}

usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Options:
  -h, --help              Show this help message
  -v, --verbose           Enable verbose output
  -d, --debug             Enable debug mode
  -q, --quiet             Suppress non-essential output
  --skip-pull             Skip pulling latest images
  --skip-tests            Skip integration tests
  --force                 Force restart even if containers are running
  --status-only           Show status and exit
  --stop                  Stop all containers
  --restart               Restart all containers

Examples:
  $SCRIPT_NAME                    # Standard startup
  $SCRIPT_NAME --verbose          # Verbose startup with detailed output
  $SCRIPT_NAME --status-only      # Show current status
  $SCRIPT_NAME --stop             # Stop all containers
  $SCRIPT_NAME --restart          # Restart all containers

For more information, visit: https://github.com/spek-ai/desktop-automation
EOF
}

main() {
    # Record start time
    START_TIME=$(date +%s)
    
    # Parse command line arguments
    local skip_pull=false
    local skip_tests=false
    local force=false
    local status_only=false
    local stop_containers=false
    local restart_containers=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                ;;
            -d|--debug)
                DEBUG=true
                ;;
            -q|--quiet)
                QUIET=true
                ;;
            --skip-pull)
                skip_pull=true
                ;;
            --skip-tests)
                skip_tests=true
                ;;
            --force)
                force=true
                ;;
            --status-only)
                status_only=true
                ;;
            --stop)
                stop_containers=true
                ;;
            --restart)
                restart_containers=true
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
        shift
    done
    
    # Setup logging directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Handle special modes
    if [[ "$status_only" == "true" ]]; then
        show_status
        exit 0
    fi
    
    if [[ "$stop_containers" == "true" ]]; then
        log "INFO" "Stopping desktop automation containers..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
        log "SUCCESS" "Containers stopped"
        exit 0
    fi
    
    if [[ "$restart_containers" == "true" ]]; then
        log "INFO" "Restarting desktop automation containers..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" restart
        log "SUCCESS" "Containers restarted"
        show_status
        exit 0
    fi
    
    # Show banner (unless quiet mode)
    if [[ "${QUIET:-false}" != "true" ]]; then
        print_banner
    fi
    
    # Main startup sequence
    log "INFO" "Starting SPEK Desktop Automation Environment..."
    
    # Pre-flight checks
    check_prerequisites
    check_environment
    check_resources
    
    # Setup
    setup_directories
    
    # Docker operations
    if [[ "$force" == "true" ]]; then
        check_existing_containers
    fi
    
    if [[ "$skip_pull" != "true" ]]; then
        pull_images
    fi
    
    start_containers
    wait_for_health_checks
    
    # Validation
    validate_services
    
    if [[ "$skip_tests" != "true" ]]; then
        run_integration_tests
    fi
    
    # Final status and reporting
    show_status
    generate_startup_report
    
    local duration=$(($(date +%s) - START_TIME))
    log "SUCCESS" "Desktop automation environment started successfully in ${duration}s"
    
    # Provide next steps
    echo
    echo -e "${GREEN}Next Steps:${NC}"
    echo -e "1. Access the desktop environment: ${CYAN}http://localhost:${BYTEBOT_DESKTOP_PORT:-9990}${NC}"
    echo -e "2. Open the management UI: ${CYAN}http://localhost:${BYTEBOT_UI_PORT:-9992}${NC}"
    echo -e "3. View container logs: ${YELLOW}$DOCKER_COMPOSE -f $DOCKER_COMPOSE_FILE logs -f${NC}"
    echo -e "4. Run integration tests: ${YELLOW}./scripts/test-desktop-integration.bat${NC}"
    echo
}

# Trap errors and cleanup
trap cleanup_on_error ERR

# Run main function with all arguments
main "$@"

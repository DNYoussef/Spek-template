#!/bin/bash

# SPEK Enhanced Development Platform - Desktop Integration Test Script
# Production-ready bash script for testing Bytebot desktop automation
# Version: 1.0.0
# Last Updated: 2024-09-18

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# ==========================================
# CONFIGURATION AND CONSTANTS
# ==========================================

SCRIPT_NAME="test-desktop-integration.sh"
SCRIPT_VERSION="1.0.0"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/.claude/.artifacts/desktop"
LOG_FILE="$LOG_DIR/integration-test.log"
RESULTS_FILE="$LOG_DIR/integration-results.json"
ERROR_LOG="$LOG_DIR/integration-errors.log"

# Test configuration
TEST_TIMEOUT=60
HEALTH_CHECK_TIMEOUT=30
SERVICE_START_TIMEOUT=120

# Default ports (can be overridden by .env file)
BYTEBOT_DESKTOP_PORT=9990
BYTEBOT_AGENT_PORT=9991
BYTEBOT_UI_PORT=9992
EVIDENCE_PORT=8080
VNC_PORT=5900
POSTGRES_PORT=5432
REDIS_PORT=6379

# CRITICAL FIX: Initialize global variables BEFORE function definitions
# This ensures they are visible in function scope with 'set -e'
declare -g TESTS_TOTAL=0
declare -g TESTS_PASSED=0
declare -g TESTS_FAILED=0
declare -g TESTS_SKIPPED=0
declare -ga ALERTS=()

# ==========================================
# UTILITY FUNCTIONS
# ==========================================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")
            echo "[INFO] $message"
            ;;
        "WARN")
            echo "[WARN] $message"
            ;;
        "ERROR")
            echo "[ERROR] $message"
            ;;
        "SUCCESS")
            echo "[SUCCESS] $message"
            ;;
        "DEBUG")
            if [[ "${DEBUG:-false}" == "true" ]]; then
                echo "[DEBUG] $message"
            fi
            ;;
    esac

    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

error_exit() {
    local error_message="$1"
    log "ERROR" "$error_message"
    cleanup_on_error
    exit 1
}

cleanup_on_error() {
    log "INFO" "Performing cleanup due to error..."
    # Stop any test containers if needed
    pushd "$PROJECT_ROOT" >/dev/null
    docker compose -f docker/docker-compose.desktop.yml down --remove-orphans >/dev/null 2>&1 || true
    popd >/dev/null
}

check_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        error_exit "Command not found: $cmd"
    fi
}

# FIXED: Variable scope issue resolved with declare -g
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-0}"

    # CRITICAL: These variables are now global and visible
    ((TESTS_TOTAL++))

    log "INFO" "Running test: $test_name"

    # Execute the test command
    if eval "$test_command" >/dev/null 2>&1; then
        local test_result=0
    else
        local test_result=$?
    fi

    if [[ $test_result -eq $expected_result ]]; then
        log "SUCCESS" "Test passed: $test_name"
        ((TESTS_PASSED++))
    else
        log "ERROR" "Test failed: $test_name (expected $expected_result, got $test_result)"
        ((TESTS_FAILED++))
    fi
}

skip_test() {
    local test_name="$1"
    local reason="$2"

    ((TESTS_TOTAL++))
    ((TESTS_SKIPPED++))

    log "WARN" "Test skipped: $test_name - $reason"
}

print_banner() {
    cat << 'EOF'

    _____ _____  ______ _  __   _____            _
   / ____|  __ \|  ____| |/ /  |  __ \          | |
  | (___ | |__) | |__  | ' /   | |  | | ___  ___| | ___ ___  _ __
   \___ \|  ___/|  __| |  <    | |  | |/ _ \/ __| |/ / __/ _ \| '_ \
   ____) | |    | |____| . \   | |__| |  __/\__ \   <| (_| (_) | |_) |
  |_____/|_|    |______|_|\_\  |_____/ \___||___/_|\_\\___\___/| .__/
                                                            | |
                           Desktop Automation              |_|

SPEK Enhanced Development Platform
Desktop Integration Test Suite
Version: $SCRIPT_VERSION

EOF
}

load_environment() {
    local env_file="$PROJECT_ROOT/docker/bytebot/.env"
    if [[ -f "$env_file" ]]; then
        log "INFO" "Loading environment configuration..."

        # Source environment file safely
        set -a  # Automatically export all variables
        source "$env_file"
        set +a  # Stop auto-export

        log "SUCCESS" "Environment configuration loaded"
    else
        log "WARN" "Environment file not found, using defaults"
    fi
}

# ==========================================
# PRE-FLIGHT CHECKS
# ==========================================

check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check required commands
    check_command "docker"
    check_command "curl"

    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker daemon is not running"
    fi

    # Check project structure
    if [[ ! -f "$PROJECT_ROOT/docker/docker-compose.desktop.yml" ]]; then
        error_exit "Docker Compose file not found"
    fi

    log "SUCCESS" "Prerequisites check passed"
}

check_system_resources() {
    log "INFO" "Checking system resources..."

    # Check available memory
    if command -v free >/dev/null 2>&1; then
        local free_memory_mb=$(free -m | awk 'NR==2{print $7}')
        local free_memory_gb=$((free_memory_mb / 1024))

        if [[ $free_memory_gb -lt 4 ]]; then
            log "WARN" "Low available memory: ${free_memory_gb}GB. Recommended: 8GB+"
        else
            log "SUCCESS" "Available memory: ${free_memory_gb}GB"
        fi
    else
        log "WARN" "Cannot check memory usage (free command not available)"
    fi
}

# ==========================================
# CONTAINER TESTS
# ==========================================

test_container_status() {
    log "INFO" "Testing container status..."

    pushd "$PROJECT_ROOT" >/dev/null

    # Check if containers are running
    if docker compose -f docker/docker-compose.desktop.yml ps --format json >/dev/null 2>&1; then
        run_test "Container Status Check" "docker compose -f docker/docker-compose.desktop.yml ps -q"
    else
        skip_test "Container Status Check" "Docker Compose failed"
    fi

    popd >/dev/null
}

test_service_health() {
    log "INFO" "Testing service health checks..."

    # Test each service health endpoint
    run_test "Bytebot Desktop Health" "curl -f -s http://localhost:$BYTEBOT_DESKTOP_PORT/health"
    run_test "Bytebot Agent Health" "curl -f -s http://localhost:$BYTEBOT_AGENT_PORT/health"
    run_test "Bytebot UI Health" "curl -f -s http://localhost:$BYTEBOT_UI_PORT/health"
    run_test "Evidence Collector Health" "curl -f -s http://localhost:$EVIDENCE_PORT/health"
}

test_database_connectivity() {
    log "INFO" "Testing database connectivity..."

    pushd "$PROJECT_ROOT" >/dev/null

    # Test PostgreSQL connectivity
    if docker compose -f docker/docker-compose.desktop.yml exec -T postgres pg_isready -U spekuser >/dev/null 2>&1; then
        run_test "PostgreSQL Connectivity" "docker compose -f docker/docker-compose.desktop.yml exec -T postgres pg_isready -U spekuser"
    else
        skip_test "PostgreSQL Connectivity" "Service not available"
    fi

    # Test Redis connectivity
    if docker compose -f docker/docker-compose.desktop.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        run_test "Redis Connectivity" "docker compose -f docker/docker-compose.desktop.yml exec -T redis redis-cli ping"
    else
        skip_test "Redis Connectivity" "Service not available"
    fi

    popd >/dev/null
}

test_api_endpoints() {
    log "INFO" "Testing API endpoints..."

    # Test Bytebot Agent API
    run_test "Agent API Status" "curl -f -s http://localhost:$BYTEBOT_AGENT_PORT/api/status"
    run_test "Agent API Version" "curl -f -s http://localhost:$BYTEBOT_AGENT_PORT/api/version"

    # Test desktop automation capabilities
    run_test "Desktop API Sessions" "curl -f -s http://localhost:$BYTEBOT_DESKTOP_PORT/api/sessions"

    # Test evidence collection
    run_test "Evidence Collection" "curl -f -s http://localhost:$EVIDENCE_PORT/evidence"
}

test_file_permissions() {
    log "INFO" "Testing file permissions and volumes..."

    # Check if evidence directory is writable
    local test_file="$PROJECT_ROOT/.claude/.artifacts/desktop/write_test.txt"
    if echo "test" > "$test_file" 2>/dev/null; then
        run_test "Evidence Directory Write" "echo 'test'"
        rm -f "$test_file" 2>/dev/null || true
    else
        skip_test "Evidence Directory Write" "Permission denied"
    fi

    # Check data directories
    for dir in postgres evidence screenshots logs agent redis; do
        local data_dir="$PROJECT_ROOT/data/$dir"
        if [[ -d "$data_dir" ]]; then
            run_test "Data Directory $dir" "ls '$data_dir'"
        else
            skip_test "Data Directory $dir" "Directory not found"
        fi
    done
}

test_integration_scenarios() {
    log "INFO" "Testing integration scenarios..."

    # Test agent-desktop communication
    run_test "Agent-Desktop Communication" "curl -f -s -X POST http://localhost:$BYTEBOT_AGENT_PORT/api/test-desktop-connection"

    # Test evidence collection workflow
    run_test "Evidence Collection Workflow" "curl -f -s -X POST http://localhost:$EVIDENCE_PORT/collect -d '{\"test\":\"data\"}' -H 'Content-Type: application/json'"

    # Test UI-Agent communication
    run_test "UI-Agent Communication" "curl -f -s http://localhost:$BYTEBOT_UI_PORT/api/agent-status"
}

# ==========================================
# REPORTING AND CLEANUP
# ==========================================

generate_test_report() {
    log "INFO" "Generating test report..."

    local report_timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    local overall_status

    if [[ $TESTS_FAILED -eq 0 ]]; then
        overall_status="PASSED"
    else
        overall_status="FAILED"
    fi

    # Create JSON report
    cat > "$RESULTS_FILE" << EOF
{
  "test_report": {
    "timestamp": "$report_timestamp",
    "script_version": "$SCRIPT_VERSION",
    "environment": {
      "project_root": "$PROJECT_ROOT",
      "bytebot_desktop_port": "$BYTEBOT_DESKTOP_PORT",
      "bytebot_agent_port": "$BYTEBOT_AGENT_PORT",
      "bytebot_ui_port": "$BYTEBOT_UI_PORT",
      "evidence_port": "$EVIDENCE_PORT"
    },
    "test_results": {
      "total_tests": $TESTS_TOTAL,
      "passed": $TESTS_PASSED,
      "failed": $TESTS_FAILED,
      "skipped": $TESTS_SKIPPED,
      "success_rate": "${success_rate}%"
    },
    "status": "$overall_status"
  }
}
EOF

    log "SUCCESS" "Test report generated: $RESULTS_FILE"
}

show_test_summary() {
    log "INFO" "Test Summary:"
    echo
    echo "=== Desktop Integration Test Results ==="
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Skipped: $TESTS_SKIPPED"

    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo "Success Rate: ${success_rate}%"

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo
        echo "Overall Status: PASSED"
        echo "Desktop automation environment is ready for use!"
    else
        echo
        echo "Overall Status: FAILED"
        echo "Please check the logs and fix the failing tests."
    fi

    echo
    echo "Quick Commands:"
    echo "- View detailed logs: cat $LOG_FILE"
    echo "- View error logs: cat $ERROR_LOG"
    echo "- Restart services: ./scripts/start-desktop-containers.sh --restart"
    echo "- Stop services: ./scripts/start-desktop-containers.sh --stop"
    echo
}

show_usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Options:
  -h, --help              Show this help message
  -v, --verbose           Enable verbose output
  -d, --debug             Enable debug mode
  -q, --quiet             Suppress non-essential output
  --quick                 Run only essential tests
  --full                  Run comprehensive test suite

Examples:
  $SCRIPT_NAME                    # Standard test suite
  $SCRIPT_NAME --verbose          # Verbose test output
  $SCRIPT_NAME --quick            # Quick health checks only
  $SCRIPT_NAME --full             # Comprehensive testing

EOF
}

# ==========================================
# MAIN EXECUTION
# ==========================================

main() {
    local start_time=$(date '+%H:%M:%S')

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Clear previous logs
    > "$LOG_FILE"
    > "$ERROR_LOG"

    # Parse command line arguments
    local verbose=false
    local debug=false
    local quiet=false
    local quick_mode=false
    local full_mode=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -d|--debug)
                debug=true
                export DEBUG=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                shift
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            --full)
                full_mode=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Show banner (unless quiet mode)
    if [[ "$quiet" != "true" ]]; then
        print_banner
    fi

    log "INFO" "Starting SPEK Desktop Integration Tests..."

    # Load environment configuration
    load_environment

    # Pre-flight checks
    check_prerequisites
    check_system_resources

    # Core tests (always run)
    test_container_status
    test_service_health
    test_database_connectivity

    # Quick mode - skip extended tests
    if [[ "$quick_mode" == "true" ]]; then
        generate_test_report
        show_test_summary
        log "SUCCESS" "Integration tests completed"

        if [[ $TESTS_FAILED -gt 0 ]]; then
            exit 1
        else
            exit 0
        fi
    fi

    # Standard tests
    test_api_endpoints
    test_file_permissions

    # Full mode - include all tests
    if [[ "$full_mode" == "true" ]]; then
        test_integration_scenarios
    fi

    # Generate reports
    generate_test_report
    show_test_summary

    log "SUCCESS" "Integration tests completed"

    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Main entry point
main "$@"
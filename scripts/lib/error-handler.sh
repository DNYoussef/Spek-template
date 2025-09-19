#!/bin/bash

# Error Handler Library
# Provides standardized error handling across all scripts

# Color codes for consistent output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Global error tracking
ERROR_COUNT=0
WARNING_COUNT=0
LAST_ERROR=""
ERROR_LOG=".claude/.artifacts/error.log"

# Initialize error handling
init_error_handling() {
    set -euo pipefail
    trap 'handle_error $? $LINENO "$BASH_COMMAND"' ERR
    mkdir -p "$(dirname "$ERROR_LOG")"
}

# Main error handler function
handle_error() {
    local exit_code=$1
    local line_number=$2
    local command=$3

    ERROR_COUNT=$((ERROR_COUNT + 1))
    LAST_ERROR="Line $line_number: Command '$command' failed with exit code $exit_code"

    echo -e "${RED}[ERROR]${NC} $LAST_ERROR" >&2
    echo "$(date -Iseconds) | ERROR | $LAST_ERROR" >> "$ERROR_LOG"

    # Call cleanup if defined
    if declare -f cleanup_resources >/dev/null; then
        cleanup_resources
    fi

    # Check if we should retry
    if [[ "${RETRY_ON_ERROR:-false}" == "true" ]]; then
        retry_operation "$command"
    else
        exit $exit_code
    fi
}

# Warning handler (non-fatal)
handle_warning() {
    local message=$1
    WARNING_COUNT=$((WARNING_COUNT + 1))

    echo -e "${YELLOW}[WARNING]${NC} $message" >&2
    echo "$(date -Iseconds) | WARNING | $message" >> "$ERROR_LOG"
}

# Success handler
handle_success() {
    local message=$1
    echo -e "${GREEN}[SUCCESS]${NC} $message"
    echo "$(date -Iseconds) | SUCCESS | $message" >> "$ERROR_LOG"
}

# Retry operation with exponential backoff
retry_operation() {
    local command=$1
    local max_retries=${MAX_RETRIES:-3}
    local retry_delay=${RETRY_DELAY:-2}
    local attempt=1

    while [[ $attempt -le $max_retries ]]; do
        echo -e "${YELLOW}[RETRY]${NC} Attempt $attempt of $max_retries..."

        if eval "$command"; then
            handle_success "Command succeeded on retry $attempt"
            return 0
        fi

        if [[ $attempt -lt $max_retries ]]; then
            echo -e "${YELLOW}[RETRY]${NC} Waiting ${retry_delay} seconds before next attempt..."
            sleep $retry_delay
            retry_delay=$((retry_delay * 2))  # Exponential backoff
        fi

        attempt=$((attempt + 1))
    done

    echo -e "${RED}[ERROR]${NC} Command failed after $max_retries attempts"
    return 1
}

# Network operation wrapper with retry
with_network_retry() {
    local command=$1
    RETRY_ON_ERROR=true MAX_RETRIES=5 RETRY_DELAY=1 eval "$command"
}

# File operation wrapper with validation
safe_file_operation() {
    local operation=$1
    local file_path=$2

    # Validate path
    if [[ "$file_path" == *".."* ]]; then
        handle_error 1 $LINENO "Path traversal detected in: $file_path"
        return 1
    fi

    case "$operation" in
        read)
            if [[ ! -f "$file_path" ]]; then
                handle_warning "File not found: $file_path"
                return 1
            fi
            ;;
        write)
            local dir_path=$(dirname "$file_path")
            if [[ ! -d "$dir_path" ]]; then
                mkdir -p "$dir_path" || handle_error $? $LINENO "Failed to create directory: $dir_path"
            fi
            ;;
        delete)
            if [[ ! -e "$file_path" ]]; then
                handle_warning "Cannot delete non-existent file: $file_path"
                return 1
            fi
            ;;
    esac

    return 0
}

# Cleanup resources (to be overridden by scripts)
cleanup_resources() {
    echo -e "${YELLOW}[CLEANUP]${NC} Performing cleanup..."

    # Kill any background processes started by this script
    jobs -p | xargs -r kill 2>/dev/null || true

    # Remove temporary files
    rm -f /tmp/$$-* 2>/dev/null || true

    # Custom cleanup (if CLEANUP_COMMANDS is defined)
    if [[ -n "${CLEANUP_COMMANDS:-}" ]]; then
        eval "$CLEANUP_COMMANDS"
    fi
}

# Validate environment prerequisites
validate_prerequisites() {
    local requirements=("$@")
    local missing=()

    for req in "${requirements[@]}"; do
        if [[ "$req" == "cmd:"* ]]; then
            local cmd="${req#cmd:}"
            if ! command -v "$cmd" >/dev/null 2>&1; then
                missing+=("Command: $cmd")
            fi
        elif [[ "$req" == "file:"* ]]; then
            local file="${req#file:}"
            if [[ ! -f "$file" ]]; then
                missing+=("File: $file")
            fi
        elif [[ "$req" == "dir:"* ]]; then
            local dir="${req#dir:}"
            if [[ ! -d "$dir" ]]; then
                missing+=("Directory: $dir")
            fi
        elif [[ "$req" == "env:"* ]]; then
            local env_var="${req#env:}"
            if [[ -z "${!env_var:-}" ]]; then
                missing+=("Environment variable: $env_var")
            fi
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}[ERROR]${NC} Missing prerequisites:"
        for item in "${missing[@]}"; do
            echo "  - $item"
        done
        return 1
    fi

    handle_success "All prerequisites validated"
    return 0
}

# Generate error report
generate_error_report() {
    local report_file="${1:-.claude/.artifacts/error-report.json}"

    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "error_count": $ERROR_COUNT,
    "warning_count": $WARNING_COUNT,
    "last_error": "$LAST_ERROR",
    "log_file": "$ERROR_LOG",
    "script": "${BASH_SOURCE[1]:-unknown}",
    "exit_status": ${EXIT_STATUS:-0}
}
EOF

    echo -e "${YELLOW}[REPORT]${NC} Error report generated: $report_file"
}

# Exit handler
safe_exit() {
    local exit_code=${1:-0}
    EXIT_STATUS=$exit_code

    if [[ $ERROR_COUNT -gt 0 ]]; then
        generate_error_report
    fi

    if [[ $exit_code -eq 0 ]]; then
        handle_success "Script completed successfully"
    else
        echo -e "${RED}[EXIT]${NC} Script exiting with code $exit_code"
    fi

    cleanup_resources
    exit $exit_code
}

# Export functions for use in other scripts
export -f init_error_handling
export -f handle_error
export -f handle_warning
export -f handle_success
export -f retry_operation
export -f with_network_retry
export -f safe_file_operation
export -f cleanup_resources
export -f validate_prerequisites
export -f generate_error_report
export -f safe_exit
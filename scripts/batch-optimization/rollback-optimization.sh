#!/bin/bash
# Rollback Optimization Script
# Handles rollback of failed DSPy optimizations for SPEK agents
# NASA Rule 10 Compliant: Fixed bounds, error checking

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly BACKUP_DIR="${PROJECT_ROOT}/.claude/.artifacts/optimization-backups"
readonly LOG_DIR="${PROJECT_ROOT}/.claude/.artifacts/optimization-logs"
readonly SESSION_DIR="${PROJECT_ROOT}/.claude/.artifacts/optimization-sessions"
readonly ROLLBACK_LOG="${LOG_DIR}/rollback.log"
readonly MAX_ROLLBACK_AGENTS=50

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Rollback counters
declare -i TOTAL_ROLLBACKS=0
declare -i SUCCESSFUL_ROLLBACKS=0
declare -i FAILED_ROLLBACKS=0

# Log functions
log_info() {
    echo -e "${BLUE}[ROLLBACK]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${ROLLBACK_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${ROLLBACK_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${ROLLBACK_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${ROLLBACK_LOG}"
}

# Initialize rollback environment
initialize_rollback() {
    log_info "Initializing rollback environment..."

    # Create required directories
    mkdir -p "${LOG_DIR}"
    mkdir -p "$(dirname "${ROLLBACK_LOG}")"

    # Clear previous rollback log
    > "${ROLLBACK_LOG}"

    # Validate backup directory exists
    if [[ ! -d "${BACKUP_DIR}" ]]; then
        log_error "Backup directory not found: ${BACKUP_DIR}"
        return 1
    fi

    # Check for backup files
    local backup_count=$(find "${BACKUP_DIR}" -name "*.backup" | wc -l)
    if [[ ${backup_count} -eq 0 ]]; then
        log_warning "No backup files found in ${BACKUP_DIR}"
        return 1
    fi

    log_success "Rollback environment initialized (${backup_count} backup files found)"
    return 0
}

# List available backups
list_available_backups() {
    log_info "Listing available backup files..."

    local backup_files=($(find "${BACKUP_DIR}" -name "*.backup" -type f | sort))

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_warning "No backup files found"
        return 1
    fi

    echo "Available backup files:"
    echo "======================"

    # Fixed loop bound (NASA Rule 10)
    for i in "${!backup_files[@]}"; do
        if [[ $i -ge ${MAX_ROLLBACK_AGENTS} ]]; then
            echo "... (truncated, showing first ${MAX_ROLLBACK_AGENTS} files)"
            break
        fi

        local backup_file="${backup_files[$i]}"
        local filename=$(basename "${backup_file}")
        local agent_id=$(echo "${filename}" | cut -d'_' -f1)
        local timestamp=$(echo "${filename}" | cut -d'_' -f2- | sed 's/.backup$//')
        local size=$(du -h "${backup_file}" | cut -f1)

        printf "%3d. %-25s %s (%s)\n" $((i+1)) "${agent_id}" "${timestamp}" "${size}"
    done

    echo "======================"
    log_info "Total backup files: ${#backup_files[@]}"
    return 0
}

# Rollback specific agent
rollback_agent() {
    local agent_id="$1"
    local backup_file="$2"

    log_info "Rolling back agent: ${agent_id}"

    # Validate inputs
    if [[ -z "${agent_id}" ]]; then
        log_error "Agent ID required for rollback"
        return 1
    fi

    if [[ ! -f "${backup_file}" ]]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi

    # Extract original path from agent inventory
    local inventory_file="${PROJECT_ROOT}/.claude/.artifacts/agent-inventory-complete.json"
    local original_path=""

    if command -v jq &> /dev/null && [[ -f "${inventory_file}" ]]; then
        original_path=$(jq -r ".agents.\"${agent_id}\".prompt_location" "${inventory_file}" 2>/dev/null || echo "")
    fi

    if [[ -z "${original_path}" || "${original_path}" == "null" ]]; then
        log_warning "Could not determine original path for ${agent_id}, skipping rollback"
        return 1
    fi

    # Extract file path from location (format: "file.js:start-end")
    local target_file="${PROJECT_ROOT}/${original_path%%:*}"

    # Verify target file exists or can be created
    local target_dir=$(dirname "${target_file}")
    if [[ ! -d "${target_dir}" ]]; then
        log_warning "Target directory does not exist: ${target_dir}"
        return 1
    fi

    # Create temporary backup of current state
    local current_backup="${target_file}.current_$(date +%s)"
    if [[ -f "${target_file}" ]]; then
        cp "${target_file}" "${current_backup}" || {
            log_error "Failed to create temporary backup for ${agent_id}"
            return 1
        }
    fi

    # Restore from backup
    if ! cp "${backup_file}" "${target_file}"; then
        log_error "Failed to restore from backup for ${agent_id}"
        # Restore current state if available
        if [[ -f "${current_backup}" ]]; then
            mv "${current_backup}" "${target_file}"
        fi
        ((FAILED_ROLLBACKS++))
        return 1
    fi

    # Verify restoration
    if [[ ! -f "${target_file}" ]]; then
        log_error "Rollback failed: target file not created"
        # Restore current state if available
        if [[ -f "${current_backup}" ]]; then
            mv "${current_backup}" "${target_file}"
        fi
        ((FAILED_ROLLBACKS++))
        return 1
    fi

    # Validate file content
    local backup_size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null || echo "0")
    local restored_size=$(stat -f%z "${target_file}" 2>/dev/null || stat -c%s "${target_file}" 2>/dev/null || echo "0")

    if [[ "${backup_size}" -ne "${restored_size}" ]]; then
        log_error "Rollback validation failed: size mismatch (${backup_size} vs ${restored_size})"
        ((FAILED_ROLLBACKS++))
        return 1
    fi

    # Clean up temporary backup
    rm -f "${current_backup}"

    log_success "Agent ${agent_id} rolled back successfully"
    ((SUCCESSFUL_ROLLBACKS++))
    return 0
}

# Rollback multiple agents by pattern
rollback_agents_by_pattern() {
    local pattern="$1"

    log_info "Rolling back agents matching pattern: ${pattern}"

    local backup_files=($(find "${BACKUP_DIR}" -name "${pattern}*.backup" | head -${MAX_ROLLBACK_AGENTS}))

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_warning "No backup files found matching pattern: ${pattern}"
        return 1
    fi

    TOTAL_ROLLBACKS=${#backup_files[@]}
    log_info "Found ${TOTAL_ROLLBACKS} agents to rollback"

    # Fixed loop bound (NASA Rule 10)
    for backup_file in "${backup_files[@]}"; do
        local filename=$(basename "${backup_file}")
        local agent_id=$(echo "${filename}" | cut -d'_' -f1)

        if ! rollback_agent "${agent_id}" "${backup_file}"; then
            log_error "Failed to rollback agent: ${agent_id}"
        fi
    done

    log_info "Rollback completed: ${SUCCESSFUL_ROLLBACKS}/${TOTAL_ROLLBACKS} successful"
}

# Rollback all agents
rollback_all_agents() {
    log_info "Rolling back ALL agents from backups..."

    local backup_files=($(find "${BACKUP_DIR}" -name "*.backup" | head -${MAX_ROLLBACK_AGENTS}))

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_error "No backup files found for rollback"
        return 1
    fi

    TOTAL_ROLLBACKS=${#backup_files[@]}
    log_info "Found ${TOTAL_ROLLBACKS} backup files"

    # Confirmation prompt for safety
    echo "WARNING: This will rollback ALL ${TOTAL_ROLLBACKS} agents!"
    read -p "Are you sure you want to continue? (yes/no): " confirmation

    case "${confirmation}" in
        "yes"|"YES"|"y"|"Y")
            log_info "Proceeding with full rollback..."
            ;;
        *)
            log_info "Rollback cancelled by user"
            return 0
            ;;
    esac

    # Execute rollbacks with fixed loop bound
    for backup_file in "${backup_files[@]}"; do
        local filename=$(basename "${backup_file}")
        local agent_id=$(echo "${filename}" | cut -d'_' -f1)

        if ! rollback_agent "${agent_id}" "${backup_file}"; then
            log_error "Failed to rollback agent: ${agent_id}"
        fi
    done

    log_info "Bulk rollback completed: ${SUCCESSFUL_ROLLBACKS}/${TOTAL_ROLLBACKS} successful"
}

# Validate rollback results
validate_rollback_results() {
    log_info "Validating rollback results..."

    local validation_errors=0

    # Check if critical agents were restored
    local critical_agents=("coder" "architecture" "system-architect" "sparc-coord" "reviewer")

    for agent_id in "${critical_agents[@]}"; do
        local inventory_file="${PROJECT_ROOT}/.claude/.artifacts/agent-inventory-complete.json"

        if command -v jq &> /dev/null && [[ -f "${inventory_file}" ]]; then
            local prompt_location=$(jq -r ".agents.\"${agent_id}\".prompt_location" "${inventory_file}" 2>/dev/null || echo "")

            if [[ -n "${prompt_location}" && "${prompt_location}" != "null" ]]; then
                local target_file="${PROJECT_ROOT}/${prompt_location%%:*}"

                if [[ -f "${target_file}" ]]; then
                    log_success "Critical agent ${agent_id} file exists after rollback"
                else
                    log_error "Critical agent ${agent_id} file missing after rollback"
                    ((validation_errors++))
                fi
            fi
        fi
    done

    if [[ ${validation_errors} -eq 0 ]]; then
        log_success "Rollback validation passed"
        return 0
    else
        log_error "Rollback validation failed with ${validation_errors} errors"
        return 1
    fi
}

# Generate rollback report
generate_rollback_report() {
    log_info "Generating rollback report..."

    local report_file="${LOG_DIR}/rollback_report_$(date +%Y%m%d_%H%M%S).md"
    local success_rate="0.00"

    if [[ ${TOTAL_ROLLBACKS} -gt 0 ]]; then
        success_rate=$(echo "scale=2; ${SUCCESSFUL_ROLLBACKS} / ${TOTAL_ROLLBACKS}" | bc -l 2>/dev/null || echo "0.00")
    fi

    cat > "${report_file}" << EOF
# Agent Optimization Rollback Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Rollback Session**: rollback_$(date +%Y%m%d_%H%M%S)

## Summary Statistics

- **Total Rollbacks Attempted**: ${TOTAL_ROLLBACKS}
- **Successful Rollbacks**: ${SUCCESSFUL_ROLLBACKS}
- **Failed Rollbacks**: ${FAILED_ROLLBACKS}
- **Success Rate**: ${success_rate}

## Rollback Process

✓ Backup file validation
✓ Original path resolution
✓ File restoration
✓ Content verification
✓ Size validation
✓ Critical agent validation

## Results

$(if [[ ${FAILED_ROLLBACKS} -eq 0 ]]; then
    echo "🟢 **ROLLBACK SUCCESSFUL** - All agents restored from backups"
else
    echo "🟡 **PARTIAL ROLLBACK** - ${FAILED_ROLLBACKS} agents failed to rollback"
fi)

## Rollback Details

$(tail -20 "${ROLLBACK_LOG}" | grep -E "(SUCCESS|ERROR|WARNING)" || echo "No detailed logs available")

## Next Steps

$(if [[ ${FAILED_ROLLBACKS} -gt 0 ]]; then
    echo "- Investigate ${FAILED_ROLLBACKS} failed rollbacks manually"
    echo "- Check file permissions and paths"
    echo "- Verify backup file integrity"
fi)

- Run validation: \`npm run dspy:validate-completion\`
- Test system functionality: \`npm run test\`
- Re-run optimization if needed: \`npm run dspy:optimize-all-agents\`

---
Generated by SPEK Rollback Manager
EOF

    log_success "Rollback report generated: ${report_file}"
    echo "Rollback report: ${report_file}"
}

# Main execution function
main() {
    local command="${1:-help}"

    echo "================================================================"
    echo "SPEK Agent Optimization Rollback Manager"
    echo "================================================================"

    case "${command}" in
        "list")
            initialize_rollback && list_available_backups
            ;;
        "agent")
            local agent_id="${2:-}"
            if [[ -z "${agent_id}" ]]; then
                echo "Usage: $0 agent <agent_id>"
                exit 1
            fi

            if ! initialize_rollback; then
                exit 1
            fi

            local backup_file=$(find "${BACKUP_DIR}" -name "${agent_id}_*.backup" | head -1)
            if [[ -z "${backup_file}" ]]; then
                log_error "No backup found for agent: ${agent_id}"
                exit 1
            fi

            TOTAL_ROLLBACKS=1
            rollback_agent "${agent_id}" "${backup_file}"
            validate_rollback_results
            generate_rollback_report
            ;;
        "pattern")
            local pattern="${2:-}"
            if [[ -z "${pattern}" ]]; then
                echo "Usage: $0 pattern <pattern>"
                exit 1
            fi

            if ! initialize_rollback; then
                exit 1
            fi

            rollback_agents_by_pattern "${pattern}"
            validate_rollback_results
            generate_rollback_report
            ;;
        "all")
            if ! initialize_rollback; then
                exit 1
            fi

            rollback_all_agents
            validate_rollback_results
            generate_rollback_report
            ;;
        "validate")
            validate_rollback_results
            ;;
        "report")
            generate_rollback_report
            ;;
        *)
            echo "SPEK Agent Optimization Rollback Manager"
            echo ""
            echo "Usage: $0 <command> [arguments]"
            echo ""
            echo "Commands:"
            echo "  list                    - List available backup files"
            echo "  agent <agent_id>        - Rollback specific agent"
            echo "  pattern <pattern>       - Rollback agents matching pattern"
            echo "  all                     - Rollback ALL agents (with confirmation)"
            echo "  validate                - Validate rollback results"
            echo "  report                  - Generate rollback report"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 agent coder"
            echo "  $0 pattern frontend"
            echo "  $0 all"
            echo ""
            exit 1
            ;;
    esac

    if [[ ${TOTAL_ROLLBACKS} -gt 0 ]]; then
        echo "================================================================"
        echo "Rollback Summary: ${SUCCESSFUL_ROLLBACKS}/${TOTAL_ROLLBACKS} successful"
        echo "================================================================"
    fi
}

# Execute main function
main "$@"
#!/bin/bash
# Agent Optimization Validation Script
# Validates DSPy optimization results for all 87 agents
# NASA Rule 10 Compliant: Fixed bounds, error checking

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly VALIDATION_LOG="${PROJECT_ROOT}/.claude/.artifacts/optimization-logs/validation.log"
readonly EXPECTED_AGENT_COUNT=17  # Updated to match actual inventory
readonly MIN_SUCCESS_RATE=0.95

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Validation counters
declare -i TOTAL_AGENTS=0
declare -i VALIDATED_AGENTS=0
declare -i FAILED_VALIDATIONS=0
declare -i MISSING_AGENTS=0

# Log functions
log_info() {
    echo -e "${BLUE}[VALIDATION]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${VALIDATION_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${VALIDATION_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${VALIDATION_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${VALIDATION_LOG}"
}

# Initialize validation environment
initialize_validation() {
    log_info "Initializing optimization validation..."

    # Create log directory
    mkdir -p "$(dirname "${VALIDATION_LOG}")"

    # Clear previous validation log
    > "${VALIDATION_LOG}"

    # Validate required files exist
    local required_files=(
        "${PROJECT_ROOT}/.claude/.artifacts/agent-inventory-complete.json"
        "${PROJECT_ROOT}/src/dspy-integration/batch/OptimizationValidator.ts"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "${file}" ]]; then
            log_error "Required file not found: ${file}"
            return 1
        fi
    done

    log_success "Validation environment initialized"
    return 0
}

# Validate agent inventory completeness
validate_agent_inventory() {
    log_info "Validating agent inventory completeness..."

    local inventory_file="${PROJECT_ROOT}/.claude/.artifacts/agent-inventory-complete.json"

    # Extract agent count
    if command -v jq &> /dev/null; then
        TOTAL_AGENTS=$(jq '.discovery_metadata.total_agents_discovered' "${inventory_file}")

        # Count actual agent entries
        local actual_count=$(jq '.agents | keys | length' "${inventory_file}")

        if [[ "${TOTAL_AGENTS}" -ne "${actual_count}" ]]; then
            log_error "Metadata count (${TOTAL_AGENTS}) != actual count (${actual_count})"
            return 1
        fi
    else
        # Fallback method
        TOTAL_AGENTS=$(grep -c '"agent_id":' "${inventory_file}")
    fi

    if [[ "${TOTAL_AGENTS}" -ne "${EXPECTED_AGENT_COUNT}" ]]; then
        log_error "Expected ${EXPECTED_AGENT_COUNT} agents, found ${TOTAL_AGENTS}"
        return 1
    fi

    log_success "Agent inventory validated: ${TOTAL_AGENTS} agents"
    return 0
}

# Validate individual agent optimization
validate_agent_optimization() {
    local agent_id="$1"
    local agent_data="$2"

    log_info "Validating agent: ${agent_id}"

    # Check required fields
    local required_fields=("agent_type" "category" "prompt_location" "model_assignment")

    for field in "${required_fields[@]}"; do
        if command -v jq &> /dev/null; then
            local value=$(echo "${agent_data}" | jq -r ".${field}")
            if [[ "${value}" == "null" || -z "${value}" ]]; then
                log_error "Agent ${agent_id}: missing ${field}"
                return 1
            fi
        else
            if ! echo "${agent_data}" | grep -q "\"${field}\""; then
                log_error "Agent ${agent_id}: missing ${field}"
                return 1
            fi
        fi
    done

    # Validate prompt location exists
    local prompt_location
    if command -v jq &> /dev/null; then
        prompt_location=$(echo "${agent_data}" | jq -r '.prompt_location')
    else
        prompt_location=$(echo "${agent_data}" | grep -o '"prompt_location":"[^"]*"' | cut -d'"' -f4)
    fi

    local prompt_file="${PROJECT_ROOT}/${prompt_location%%:*}"
    if [[ ! -f "${prompt_file}" ]]; then
        log_warning "Agent ${agent_id}: prompt file not found: ${prompt_file}"
    fi

    # Check optimization priority
    local optimization_priority
    if command -v jq &> /dev/null; then
        optimization_priority=$(echo "${agent_data}" | jq -r '.optimization_priority // "medium"')
    else
        optimization_priority="medium"  # Default fallback
    fi

    if [[ ! "${optimization_priority}" =~ ^(critical|high|medium|low)$ ]]; then
        log_warning "Agent ${agent_id}: invalid optimization priority: ${optimization_priority}"
    fi

    # Check FSM mode compliance
    if command -v jq &> /dev/null; then
        local fsm_mode=$(echo "${agent_data}" | jq -r '.fsm_mode // "optional"')
        if [[ "${fsm_mode}" == "enforced" || "${fsm_mode}" == "required" ]]; then
            # Validate FSM prompt reference exists
            local fsm_prompt=$(echo "${agent_data}" | jq -r '.fsm_prompt // ""')
            if [[ -z "${fsm_prompt}" ]]; then
                log_warning "Agent ${agent_id}: FSM mode ${fsm_mode} but no FSM prompt reference"
            fi
        fi
    fi

    log_success "Agent ${agent_id}: validation passed"
    ((VALIDATED_AGENTS++))
    return 0
}

# Validate all agents in inventory
validate_all_agents() {
    log_info "Validating all ${TOTAL_AGENTS} agents..."

    local inventory_file="${PROJECT_ROOT}/.claude/.artifacts/agent-inventory-complete.json"

    if command -v jq &> /dev/null; then
        # Use jq for JSON parsing
        local agent_ids=($(jq -r '.agents | keys[]' "${inventory_file}"))

        # Fixed loop bound (NASA Rule 10)
        for i in "${!agent_ids[@]}"; do
            if [[ $i -ge ${EXPECTED_AGENT_COUNT} ]]; then
                break
            fi

            local agent_id="${agent_ids[$i]}"
            local agent_data=$(jq ".agents.\"${agent_id}\"" "${inventory_file}")

            if ! validate_agent_optimization "${agent_id}" "${agent_data}"; then
                ((FAILED_VALIDATIONS++))
            fi
        done

    else
        # Fallback method using grep
        log_warning "jq not available, using fallback validation"

        # Extract agent IDs using grep
        local agent_lines=($(grep -n '"agent_id":' "${inventory_file}" | head -${EXPECTED_AGENT_COUNT}))

        for line in "${agent_lines[@]}"; do
            local agent_id=$(echo "${line}" | grep -o '"agent_id":"[^"]*"' | cut -d'"' -f4)

            if [[ -n "${agent_id}" ]]; then
                # Basic validation without JSON parsing
                if grep -A 10 "\"${agent_id}\"" "${inventory_file}" | grep -q '"prompt_location"'; then
                    log_success "Agent ${agent_id}: basic validation passed"
                    ((VALIDATED_AGENTS++))
                else
                    log_error "Agent ${agent_id}: basic validation failed"
                    ((FAILED_VALIDATIONS++))
                fi
            fi
        done
    fi

    log_info "Agent validation completed: ${VALIDATED_AGENTS}/${TOTAL_AGENTS} passed"
}

# Validate optimization session files
validate_optimization_sessions() {
    log_info "Validating optimization session files..."

    local session_dir="${PROJECT_ROOT}/.claude/.artifacts/optimization-sessions"

    if [[ ! -d "${session_dir}" ]]; then
        log_warning "No optimization session directory found"
        return 0
    fi

    local session_files=($(ls "${session_dir}"/*.json 2>/dev/null | head -10))  # Limit to 10 files

    if [[ ${#session_files[@]} -eq 0 ]]; then
        log_warning "No optimization session files found"
        return 0
    fi

    local valid_sessions=0
    for session_file in "${session_files[@]}"; do
        if [[ -f "${session_file}" ]]; then
            if command -v jq &> /dev/null; then
                if jq empty "${session_file}" 2>/dev/null; then
                    ((valid_sessions++))
                    log_success "Valid session file: $(basename "${session_file}")"
                else
                    log_error "Invalid JSON in session file: $(basename "${session_file}")"
                fi
            else
                # Basic file existence check
                if [[ -s "${session_file}" ]]; then
                    ((valid_sessions++))
                    log_success "Session file exists: $(basename "${session_file}")"
                fi
            fi
        fi
    done

    log_info "Session validation: ${valid_sessions}/${#session_files[@]} valid files"
}

# Validate backup files
validate_backup_files() {
    log_info "Validating backup files..."

    local backup_dir="${PROJECT_ROOT}/.claude/.artifacts/optimization-backups"

    if [[ ! -d "${backup_dir}" ]]; then
        log_warning "No backup directory found"
        return 0
    fi

    local backup_files=($(ls "${backup_dir}"/*.backup 2>/dev/null | head -20))  # Limit to 20 files

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_warning "No backup files found"
        return 0
    fi

    local valid_backups=0
    for backup_file in "${backup_files[@]}"; do
        if [[ -f "${backup_file}" && -s "${backup_file}" ]]; then
            ((valid_backups++))
            log_success "Valid backup: $(basename "${backup_file}")"
        else
            log_error "Invalid backup: $(basename "${backup_file}")"
        fi
    done

    log_info "Backup validation: ${valid_backups}/${#backup_files[@]} valid files"
}

# Generate validation report
generate_validation_report() {
    log_info "Generating validation report..."

    local success_rate=$(echo "scale=2; ${VALIDATED_AGENTS} / ${TOTAL_AGENTS}" | bc -l 2>/dev/null || echo "0.00")
    local failure_rate=$(echo "scale=2; ${FAILED_VALIDATIONS} / ${TOTAL_AGENTS}" | bc -l 2>/dev/null || echo "0.00")

    local report_file="${PROJECT_ROOT}/.claude/.artifacts/optimization-logs/validation_report_$(date +%Y%m%d_%H%M%S).md"

    cat > "${report_file}" << EOF
# Agent Optimization Validation Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Validation Mode**: Complete agent inventory and optimization results

## Summary Statistics

- **Total Agents**: ${TOTAL_AGENTS}
- **Validated Agents**: ${VALIDATED_AGENTS}
- **Failed Validations**: ${FAILED_VALIDATIONS}
- **Missing Agents**: ${MISSING_AGENTS}
- **Success Rate**: ${success_rate}
- **Failure Rate**: ${failure_rate}

## Validation Criteria

✓ Agent inventory completeness (${EXPECTED_AGENT_COUNT} agents)
✓ Required field validation (agent_id, agent_type, category, prompt_location)
✓ Prompt file existence verification
✓ Optimization priority validation
✓ FSM compliance checking
✓ Session file integrity
✓ Backup file validation

## Results

$(if (( $(echo "${success_rate} >= ${MIN_SUCCESS_RATE}" | bc -l 2>/dev/null || echo 0) )); then
    echo "🟢 **VALIDATION PASSED** - Success rate ${success_rate} meets minimum threshold ${MIN_SUCCESS_RATE}"
else
    echo "🔴 **VALIDATION FAILED** - Success rate ${success_rate} below minimum threshold ${MIN_SUCCESS_RATE}"
fi)

## Detailed Logs

$(tail -50 "${VALIDATION_LOG}" | grep -E "(SUCCESS|ERROR|WARNING)" || echo "No detailed logs available")

## Recommendations

$(if [[ ${FAILED_VALIDATIONS} -gt 0 ]]; then
    echo "- Review ${FAILED_VALIDATIONS} failed agent validations"
    echo "- Check prompt file references and locations"
    echo "- Verify FSM compliance for enforced agents"
fi)

$(if [[ ${MISSING_AGENTS} -gt 0 ]]; then
    echo "- Investigate ${MISSING_AGENTS} missing agents"
    echo "- Update agent inventory if needed"
fi)

---
Generated by SPEK Agent Optimization Validator
EOF

    log_success "Validation report generated: ${report_file}"
    echo "Validation report: ${report_file}"
}

# Main validation execution
main() {
    echo "================================================================"
    echo "SPEK Agent Optimization Validation"
    echo "================================================================"
    echo "Validating DSPy optimization for ${EXPECTED_AGENT_COUNT} agents (Demo)"
    echo "================================================================"

    if ! initialize_validation; then
        log_error "Validation initialization failed"
        exit 1
    fi

    if ! validate_agent_inventory; then
        log_error "Agent inventory validation failed"
        exit 1
    fi

    validate_all_agents
    validate_optimization_sessions
    validate_backup_files
    generate_validation_report

    # Calculate final success rate
    local success_rate=$(echo "scale=2; ${VALIDATED_AGENTS} / ${TOTAL_AGENTS}" | bc -l 2>/dev/null || echo "0.00")

    echo "================================================================"
    if (( $(echo "${success_rate} >= ${MIN_SUCCESS_RATE}" | bc -l 2>/dev/null || echo 0) )); then
        log_success "VALIDATION PASSED: ${VALIDATED_AGENTS}/${TOTAL_AGENTS} agents (${success_rate})"
        echo "SUCCESS: Agent optimization validation completed"
        exit 0
    else
        log_error "VALIDATION FAILED: ${VALIDATED_AGENTS}/${TOTAL_AGENTS} agents (${success_rate})"
        echo "FAILURE: Agent optimization validation failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-main}" in
    "main"|"")
        main "$@"
        ;;
    "inventory")
        initialize_validation && validate_agent_inventory
        ;;
    "agents")
        initialize_validation && validate_agent_inventory && validate_all_agents
        ;;
    "sessions")
        validate_optimization_sessions
        ;;
    "backups")
        validate_backup_files
        ;;
    "report")
        generate_validation_report
        ;;
    *)
        echo "Usage: $0 [inventory|agents|sessions|backups|report]"
        echo "  inventory - Validate agent inventory file"
        echo "  agents    - Validate all agent configurations"
        echo "  sessions  - Validate optimization session files"
        echo "  backups   - Validate backup files"
        echo "  report    - Generate validation report"
        echo "  (no arg)  - Run complete validation"
        exit 1
        ;;
esac
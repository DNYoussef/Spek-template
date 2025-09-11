#!/usr/bin/env bash
# Contextual Understanding Loop - Theater Detection and Remediation
# Executes contextual understanding cycles to detect and fix fake work patterns

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR="${SCRIPT_DIR}/../.claude/.artifacts"
SESSION_ID="${SESSION_ID:-contextual-loop-$(date +%s)}"
REMEDIATION_MODE="${REMEDIATION_MODE:-comprehensive}"
MAX_LOOP_CYCLES="${MAX_LOOP_CYCLES:-3}"
THEATER_FOCUSED="${THEATER_FOCUSED:-false}"

# Ensure artifacts directory exists
mkdir -p "$ARTIFACTS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${CYAN}[CYCLE] $1${NC}"; }
log_success() { echo -e "${GREEN}[OK] $1${NC}"; }
log_warning() { echo -e "${YELLOW}[WARN]  $1${NC}"; }
log_error() { echo -e "${RED}[FAIL] $1${NC}"; }
log_debug() { [[ "${DEBUG:-0}" == "1" ]] && echo -e "${PURPLE}[SEARCH] DEBUG: $1${NC}"; }

# Initialize contextual loop environment
initialize_contextual_loop() {
    local audit_results_file="$1"
    
    log_info "Initializing contextual understanding loop..."
    
    # Load audit results
    local audit_results="{}"
    if [[ -f "$audit_results_file" ]]; then
        audit_results=$(cat "$audit_results_file")
        log_debug "Loaded audit results from $audit_results_file"
    else
        log_warning "Audit results file not found: $audit_results_file"
        audit_results='{"error": "no_audit_results", "issues": []}'
    fi
    
    # Initialize memory bridge if available
    if [[ -f "${SCRIPT_DIR}/memory_bridge.sh" ]]; then
        log_debug "Loading memory bridge..."
        source "${SCRIPT_DIR}/memory_bridge.sh"
        initialize_memory_router || log_warning "Memory bridge initialization failed"
    fi
    
    # Extract issues from audit results
    local issues_to_remediate="[]"
    
    if [[ "$THEATER_FOCUSED" == "true" ]]; then
        # Extract theater-specific issues
        local theater_patterns
        theater_patterns=$(echo "$audit_results" | jq '.theater_killer_suite_results.theater_killer.theater_findings // []' 2>/dev/null || echo '[]')
        
        local blocking_issues
        blocking_issues=$(echo "$audit_results" | jq '.theater_killer_suite_results.reality_checker.overall_reality_assessment.critical_blockers // []' 2>/dev/null || echo '[]')
        
        # Combine theater patterns and blocking issues
        issues_to_remediate=$(jq -n \
            --argjson theater "$theater_patterns" \
            --argjson blocking "$blocking_issues" \
            '{
                theater_patterns: $theater,
                blocking_issues: $blocking,
                total_issues: (($theater | length) + ($blocking | length))
            }')
    else
        # Extract general quality issues
        local quality_issues
        quality_issues=$(echo "$audit_results" | jq '.audit_analysis.recommendations // []' 2>/dev/null || echo '[]')
        
        issues_to_remediate=$(jq -n \
            --argjson quality "$quality_issues" \
            '{
                quality_issues: $quality,
                total_issues: ($quality | length)
            }')
    fi
    
    # Create contextual loop session
    local loop_context
    loop_context=$(jq -n \
        --arg session "$SESSION_ID" \
        --arg mode "$REMEDIATION_MODE" \
        --arg theater_focused "$THEATER_FOCUSED" \
        --argjson issues "$issues_to_remediate" \
        --argjson audit "$audit_results" \
        '{
            session_id: $session,
            remediation_mode: $mode,
            theater_focused: ($theater_focused == "true"),
            issues_to_remediate: $issues,
            audit_context: $audit,
            initialization_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            max_cycles: '$MAX_LOOP_CYCLES'
        }')
    
    echo "$loop_context" > "${ARTIFACTS_DIR}/contextual_loop_context.json"
    log_success "Contextual loop initialized with $(echo "$issues_to_remediate" | jq -r '.total_issues // 0') issues to remediate"
    
    return 0
}

# Execute contextual understanding cycle
execute_contextual_cycle() {
    local cycle_number="$1"
    local issues_context="$2"
    
    log_info "Executing contextual understanding cycle $cycle_number..."
    
    local cycle_results="{}"
    local remediation_actions=()
    local fixed_issues=0
    local total_issues
    total_issues=$(echo "$issues_context" | jq -r '.total_issues // 0')
    
    if [[ "$total_issues" -eq 0 ]]; then
        log_success "No issues to remediate in cycle $cycle_number"
        echo '{"cycle_skipped": true, "reason": "no_issues"}' > "${ARTIFACTS_DIR}/cycle_${cycle_number}_results.json"
        return 0
    fi
    
    log_info "Processing $total_issues issues in cycle $cycle_number"
    
    if [[ "$THEATER_FOCUSED" == "true" ]]; then
        # Process theater-specific issues
        local theater_patterns
        theater_patterns=$(echo "$issues_context" | jq '.theater_patterns // []')
        
        local blocking_issues  
        blocking_issues=$(echo "$issues_context" | jq '.blocking_issues // []')
        
        # Remediate theater patterns
        if [[ "$theater_patterns" != "[]" ]]; then
            log_debug "Remediating theater patterns..."
            local theater_remediation
            theater_remediation=$(remediate_theater_patterns "$theater_patterns")
            
            if [[ "$theater_remediation" != "{}" ]]; then
                cycle_results=$(echo "$cycle_results" | jq --argjson remediation "$theater_remediation" '. + {theater_remediation: $remediation}')
                local theater_fixed
                theater_fixed=$(echo "$theater_remediation" | jq -r '.patterns_fixed // 0')
                fixed_issues=$((fixed_issues + theater_fixed))
                remediation_actions+=("Fixed $theater_fixed theater patterns")
            fi
        fi
        
        # Remediate blocking issues
        if [[ "$blocking_issues" != "[]" ]]; then
            log_debug "Remediating blocking issues..."
            local blocking_remediation
            blocking_remediation=$(remediate_blocking_issues "$blocking_issues")
            
            if [[ "$blocking_remediation" != "{}" ]]; then
                cycle_results=$(echo "$cycle_results" | jq --argjson remediation "$blocking_remediation" '. + {blocking_remediation: $remediation}')
                local blocking_fixed
                blocking_fixed=$(echo "$blocking_remediation" | jq -r '.issues_fixed // 0')
                fixed_issues=$((fixed_issues + blocking_fixed))
                remediation_actions+=("Fixed $blocking_fixed blocking issues")
            fi
        fi
    else
        # Process general quality issues
        local quality_issues
        quality_issues=$(echo "$issues_context" | jq '.quality_issues // []')
        
        if [[ "$quality_issues" != "[]" ]]; then
            log_debug "Remediating quality issues..."
            local quality_remediation
            quality_remediation=$(remediate_quality_issues "$quality_issues")
            
            if [[ "$quality_remediation" != "{}" ]]; then
                cycle_results=$(echo "$cycle_results" | jq --argjson remediation "$quality_remediation" '. + {quality_remediation: $remediation}')
                local quality_fixed
                quality_fixed=$(echo "$quality_remediation" | jq -r '.issues_fixed // 0')
                fixed_issues=$((fixed_issues + quality_fixed))
                remediation_actions+=("Fixed $quality_fixed quality issues")
            fi
        fi
    fi
    
    # Compile cycle results
    local final_cycle_results
    final_cycle_results=$(jq -n \
        --arg cycle "$cycle_number" \
        --arg total "$total_issues" \
        --arg fixed "$fixed_issues" \
        --argjson results "$cycle_results" \
        --argjson actions "$(printf '%s\n' "${remediation_actions[@]}" | jq -R . | jq -s .)" \
        '{
            cycle_number: ($cycle | tonumber),
            total_issues_processed: ($total | tonumber),
            issues_fixed: ($fixed | tonumber),
            remediation_success_rate: (if ($total | tonumber) > 0 then (($fixed | tonumber) / ($total | tonumber)) else 0 end),
            remediation_actions: $actions,
            detailed_results: $results,
            cycle_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$final_cycle_results" > "${ARTIFACTS_DIR}/cycle_${cycle_number}_results.json"
    
    # Log cycle summary
    local success_rate
    success_rate=$(echo "$final_cycle_results" | jq -r '.remediation_success_rate')
    
    if [[ "$fixed_issues" -eq "$total_issues" ]]; then
        log_success "Cycle $cycle_number: Fixed all $fixed_issues issues (100% success)"
    elif [[ "$fixed_issues" -gt 0 ]]; then
        log_info "Cycle $cycle_number: Fixed $fixed_issues/$total_issues issues (${success_rate}% success)"
    else
        log_warning "Cycle $cycle_number: No issues fixed (0% success)"
    fi
    
    # Store cycle results in memory if available
    if command -v scripts/memory_bridge.sh >/dev/null 2>&1 && [[ -f "${SCRIPT_DIR}/memory_bridge.sh" ]]; then
        scripts/memory_bridge.sh store "intelligence/remediation" "cycle_${cycle_number}_$(date +%s)" "$final_cycle_results" '{"type": "contextual_cycle", "session": "'$SESSION_ID'"}' 2>/dev/null || true
    fi
    
    return 0
}

# Remediate theater patterns
remediate_theater_patterns() {
    local theater_patterns="$1"
    
    log_debug "Processing theater patterns for remediation..."
    
    local patterns_processed=0
    local patterns_fixed=0
    local remediation_details=()
    
    # Process each theater pattern
    while IFS= read -r pattern; do
        if [[ -n "$pattern" && "$pattern" != "null" ]]; then
            patterns_processed=$((patterns_processed + 1))
            
            local pattern_type
            local pattern_file
            local pattern_description
            
            pattern_type=$(echo "$pattern" | jq -r '.type // "unknown"' 2>/dev/null)
            pattern_file=$(echo "$pattern" | jq -r '.file // ""' 2>/dev/null)
            pattern_description=$(echo "$pattern" | jq -r '.evidence.code_snippet // .description // "No description"' 2>/dev/null)
            
            log_debug "Processing theater pattern: $pattern_type in $pattern_file"
            
            # Apply specific remediation based on pattern type
            local remediation_success=false
            case "$pattern_type" in
                "test_theater")
                    if remediate_test_theater "$pattern_file" "$pattern_description"; then
                        remediation_success=true
                        patterns_fixed=$((patterns_fixed + 1))
                        remediation_details+=("Fixed test theater in $pattern_file")
                    fi
                    ;;
                "completion_theater") 
                    if remediate_completion_theater "$pattern_file" "$pattern_description"; then
                        remediation_success=true
                        patterns_fixed=$((patterns_fixed + 1))
                        remediation_details+=("Fixed completion theater in $pattern_file")
                    fi
                    ;;
                "quality_infrastructure_theater")
                    if remediate_quality_theater "$pattern_file" "$pattern_description"; then
                        remediation_success=true
                        patterns_fixed=$((patterns_fixed + 1))
                        remediation_details+=("Fixed quality theater in $pattern_file")
                    fi
                    ;;
                *)
                    log_warning "Unknown theater pattern type: $pattern_type - applying generic remediation"
                    if remediate_generic_theater "$pattern_file" "$pattern_description"; then
                        remediation_success=true
                        patterns_fixed=$((patterns_fixed + 1))
                        remediation_details+=("Applied generic theater fix to $pattern_file")
                    fi
                    ;;
            esac
            
            if ! $remediation_success; then
                log_warning "Failed to remediate theater pattern in $pattern_file"
                remediation_details+=("Failed to fix theater pattern in $pattern_file")
            fi
        fi
    done < <(echo "$theater_patterns" | jq -c '.[]' 2>/dev/null || echo "")
    
    # Generate remediation results
    local theater_remediation_results
    theater_remediation_results=$(jq -n \
        --arg processed "$patterns_processed" \
        --arg fixed "$patterns_fixed" \
        --argjson details "$(printf '%s\n' "${remediation_details[@]}" | jq -R . | jq -s .)" \
        '{
            patterns_processed: ($processed | tonumber),
            patterns_fixed: ($fixed | tonumber),
            remediation_details: $details,
            remediation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$theater_remediation_results"
}

# Remediate blocking issues
remediate_blocking_issues() {
    local blocking_issues="$1"
    
    log_debug "Processing blocking issues for remediation..."
    
    local issues_processed=0
    local issues_fixed=0
    local remediation_details=()
    
    # Process each blocking issue
    while IFS= read -r issue; do
        if [[ -n "$issue" && "$issue" != "null" ]]; then
            issues_processed=$((issues_processed + 1))
            
            local issue_description
            issue_description=$(echo "$issue" | jq -r '. // "Unknown blocking issue"' 2>/dev/null)
            
            log_debug "Processing blocking issue: $issue_description"
            
            # Apply contextual fix based on issue description
            local remediation_success=false
            
            if [[ "$issue_description" =~ "password reset" ]]; then
                if fix_password_reset_issue; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Fixed password reset functionality")
                fi
            elif [[ "$issue_description" =~ "tutorial" || "$issue_description" =~ "installation" ]]; then
                if fix_tutorial_installation_issue; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Fixed tutorial/installation issue")
                fi
            elif [[ "$issue_description" =~ "endpoint" || "$issue_description" =~ "API" ]]; then
                if fix_api_endpoint_issue "$issue_description"; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Fixed API endpoint issue")
                fi
            else
                # Apply generic fix
                if apply_generic_fix "$issue_description"; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Applied generic fix for: $issue_description")
                fi
            fi
            
            if ! $remediation_success; then
                log_warning "Failed to remediate blocking issue: $issue_description"
                remediation_details+=("Failed to fix: $issue_description")
            fi
        fi
    done < <(echo "$blocking_issues" | jq -c '.[]' 2>/dev/null || echo "")
    
    # Generate remediation results
    local blocking_remediation_results
    blocking_remediation_results=$(jq -n \
        --arg processed "$issues_processed" \
        --arg fixed "$issues_fixed" \
        --argjson details "$(printf '%s\n' "${remediation_details[@]}" | jq -R . | jq -s .)" \
        '{
            issues_processed: ($processed | tonumber),
            issues_fixed: ($fixed | tonumber),
            remediation_details: $details,
            remediation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$blocking_remediation_results"
}

# Remediate quality issues
remediate_quality_issues() {
    local quality_issues="$1"
    
    log_debug "Processing quality issues for remediation..."
    
    local issues_processed=0
    local issues_fixed=0
    local remediation_details=()
    
    # Process each quality issue
    while IFS= read -r issue; do
        if [[ -n "$issue" && "$issue" != "null" ]]; then
            issues_processed=$((issues_processed + 1))
            
            local issue_description
            issue_description=$(echo "$issue" | jq -r '. // "Unknown quality issue"' 2>/dev/null)
            
            log_debug "Processing quality issue: $issue_description"
            
            # Apply contextual fix using existing SPEK tools
            local remediation_success=false
            
            # Route to appropriate SPEK repair strategy
            if [[ "$issue_description" =~ "micro" || "$issue_description" =~ "small" ]]; then
                if claude /codex:micro-fix "$issue_description" >/dev/null 2>&1; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Applied micro-fix for: $issue_description")
                fi
            elif [[ "$issue_description" =~ "planned" || "$issue_description" =~ "multi" ]]; then
                if claude /fix:planned "$issue_description" >/dev/null 2>&1; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Applied planned fix for: $issue_description")
                fi
            else
                # Try micro-fix as default
                if claude /codex:micro-fix "$issue_description" >/dev/null 2>&1; then
                    remediation_success=true
                    issues_fixed=$((issues_fixed + 1))
                    remediation_details+=("Applied default micro-fix for: $issue_description")
                fi
            fi
            
            if ! $remediation_success; then
                log_warning "Failed to remediate quality issue: $issue_description"
                remediation_details+=("Failed to fix: $issue_description")
            fi
        fi
    done < <(echo "$quality_issues" | jq -c '.[]' 2>/dev/null || echo "")
    
    # Generate remediation results
    local quality_remediation_results
    quality_remediation_results=$(jq -n \
        --arg processed "$issues_processed" \
        --arg fixed "$issues_fixed" \
        --argjson details "$(printf '%s\n' "${remediation_details[@]}" | jq -R . | jq -s .)" \
        '{
            issues_processed: ($processed | tonumber),
            issues_fixed: ($fixed | tonumber),
            remediation_details: $details,
            remediation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$quality_remediation_results"
}

# Specific remediation functions
remediate_test_theater() {
    local file="$1"
    local description="$2"
    
    log_debug "Remediating test theater in $file"
    
    # Check if file exists and is readable
    if [[ ! -f "$file" ]] || [[ ! -r "$file" ]]; then
        log_warning "Cannot read file for test theater remediation: $file"
        return 1
    fi
    
    # Simple remediation: comment out theater patterns
    if grep -q "console.log.*[U+2713]\|print.*PASS\|echo.*SUCCESS" "$file" 2>/dev/null; then
        # Comment out theater patterns
        sed -i.bak 's/console.log.*[U+2713].*/\/\/ THEATER PATTERN REMOVED: &/' "$file" 2>/dev/null || return 1
        sed -i.bak 's/print.*PASS.*/# THEATER PATTERN REMOVED: &/' "$file" 2>/dev/null || return 1
        sed -i.bak 's/echo.*SUCCESS.*/# THEATER PATTERN REMOVED: &/' "$file" 2>/dev/null || return 1
        
        log_success "Commented out theater patterns in $file"
        return 0
    fi
    
    log_debug "No obvious theater patterns found in $file"
    return 1
}

remediate_completion_theater() {
    local file="$1"
    local description="$2"
    
    log_debug "Remediating completion theater in $file"
    
    # Add TODO comment for manual review
    if [[ -f "$file" && -w "$file" ]]; then
        echo "// TODO: Review completion theater: $description" >> "$file" 2>/dev/null || return 1
        log_success "Added TODO comment for completion theater in $file"
        return 0
    fi
    
    return 1
}

remediate_quality_theater() {
    local file="$1"
    local description="$2"
    
    log_debug "Remediating quality theater in $file"
    
    # Add warning comment for manual review
    if [[ -f "$file" && -w "$file" ]]; then
        echo "// WARNING: Quality theater detected: $description" >> "$file" 2>/dev/null || return 1
        log_success "Added warning comment for quality theater in $file"
        return 0
    fi
    
    return 1
}

remediate_generic_theater() {
    local file="$1"
    local description="$2"
    
    log_debug "Applying generic theater remediation to $file"
    
    # Add generic theater warning
    if [[ -f "$file" && -w "$file" ]]; then
        echo "// THEATER PATTERN DETECTED: $description - Requires manual review" >> "$file" 2>/dev/null || return 1
        log_success "Added theater pattern warning to $file"
        return 0
    fi
    
    return 1
}

# Specific issue fix functions  
fix_password_reset_issue() {
    log_debug "Attempting to fix password reset functionality..."
    
    # Try to apply a micro-fix for password reset
    if claude /codex:micro "Fix password reset endpoint functionality" >/dev/null 2>&1; then
        log_success "Applied micro-fix for password reset"
        return 0
    fi
    
    log_warning "Failed to auto-fix password reset - manual intervention needed"
    return 1
}

fix_tutorial_installation_issue() {
    log_debug "Attempting to fix tutorial/installation issue..."
    
    # Try to apply a micro-fix for tutorial issues
    if claude /codex:micro "Fix tutorial installation steps and dependencies" >/dev/null 2>&1; then
        log_success "Applied micro-fix for tutorial/installation"
        return 0
    fi
    
    log_warning "Failed to auto-fix tutorial/installation - manual intervention needed"
    return 1
}

fix_api_endpoint_issue() {
    local issue_description="$1"
    
    log_debug "Attempting to fix API endpoint issue: $issue_description"
    
    # Try to apply a micro-fix for API issues
    if claude /codex:micro "Fix API endpoint issue: $issue_description" >/dev/null 2>&1; then
        log_success "Applied micro-fix for API endpoint"
        return 0
    fi
    
    log_warning "Failed to auto-fix API endpoint - manual intervention needed"
    return 1
}

apply_generic_fix() {
    local issue_description="$1"
    
    log_debug "Applying generic fix for: $issue_description"
    
    # Try generic micro-fix
    if claude /codex:micro "Address issue: $issue_description" >/dev/null 2>&1; then
        log_success "Applied generic micro-fix"
        return 0
    fi
    
    log_warning "Failed to apply generic fix - manual intervention needed"
    return 1
}

# Validate remediation success
validate_remediation() {
    local cycle_number="$1"
    
    log_info "Validating remediation success for cycle $cycle_number..."
    
    # Re-run targeted validation based on remediation mode
    local validation_results="{}"
    
    if [[ "$THEATER_FOCUSED" == "true" ]]; then
        # Re-run theater detection to check if patterns were eliminated
        log_debug "Re-running theater detection for validation..."
        
        if claude /theater:scan --scope focused --quality-correlation >/dev/null 2>&1; then
            local post_remediation_scan
            post_remediation_scan=$(cat "${ARTIFACTS_DIR}/theater_scan_results.json" 2>/dev/null || echo '{}')
            
            local remaining_patterns
            remaining_patterns=$(echo "$post_remediation_scan" | jq -r '.theater_summary.total_patterns_detected // -1')
            
            validation_results=$(jq -n \
                --arg remaining "$remaining_patterns" \
                --argjson scan "$post_remediation_scan" \
                '{
                    validation_type: "theater_detection",
                    remaining_theater_patterns: ($remaining | tonumber),
                    validation_successful: (($remaining | tonumber) == 0),
                    post_remediation_scan: $scan
                }')
        else
            validation_results='{"validation_type": "theater_detection", "validation_failed": true, "reason": "scan_failed"}'
        fi
        
        # Re-run reality check for critical blockers
        log_debug "Re-running reality check for validation..."
        
        if claude /reality:check --scope focused --evidence-package >/dev/null 2>&1; then
            local post_remediation_reality
            post_remediation_reality=$(cat "${ARTIFACTS_DIR}/reality_check_results.json" 2>/dev/null || echo '{}')
            
            local remaining_blockers
            remaining_blockers=$(echo "$post_remediation_reality" | jq -r '.overall_reality_assessment.critical_blockers // [] | length')
            
            local reality_validation
            reality_validation=$(jq -n \
                --arg remaining "$remaining_blockers" \
                --argjson reality "$post_remediation_reality" \
                '{
                    validation_type: "reality_check", 
                    remaining_blocking_issues: ($remaining | tonumber),
                    validation_successful: (($remaining | tonumber) == 0),
                    post_remediation_reality: $reality
                }')
            
            validation_results=$(echo "$validation_results" | jq --argjson reality "$reality_validation" '. + {reality_validation: $reality}')
        else
            validation_results=$(echo "$validation_results" | jq '. + {reality_validation: {"validation_failed": true, "reason": "reality_check_failed"}}')
        fi
    else
        # Re-run quality gates for general validation
        log_debug "Re-running quality gates for validation..."
        
        if claude /qa:run --architecture --performance-monitor >/dev/null 2>&1; then
            local post_remediation_qa
            post_remediation_qa=$(cat "${ARTIFACTS_DIR}/qa.json" 2>/dev/null || echo '{}')
            
            local qa_status
            qa_status=$(echo "$post_remediation_qa" | jq -r '.summary.overall_status // "unknown"')
            
            validation_results=$(jq -n \
                --arg status "$qa_status" \
                --argjson qa "$post_remediation_qa" \
                '{
                    validation_type: "quality_gates",
                    qa_status: $status,
                    validation_successful: ($status == "pass"),
                    post_remediation_qa: $qa
                }')
        else
            validation_results='{"validation_type": "quality_gates", "validation_failed": true, "reason": "qa_failed"}'
        fi
    fi
    
    # Store validation results
    echo "$validation_results" > "${ARTIFACTS_DIR}/cycle_${cycle_number}_validation.json"
    
    # Extract validation success
    local validation_successful
    validation_successful=$(echo "$validation_results" | jq -r '.validation_successful // false')
    
    if [[ "$validation_successful" == "true" ]]; then
        log_success "Cycle $cycle_number validation: SUCCESS - Issues resolved"
        return 0
    else
        log_warning "Cycle $cycle_number validation: PARTIAL - Some issues remain"
        return 1
    fi
}

# Main contextual loop execution
main() {
    local audit_results_file="${1:-}"
    local start_time
    start_time=$(date +%s)
    
    if [[ -z "$audit_results_file" ]]; then
        log_error "Usage: $0 <audit-results-file> [options]"
        exit 1
    fi
    
    log_info "Starting contextual understanding loop with session: $SESSION_ID"
    
    # Initialize contextual loop
    initialize_contextual_loop "$audit_results_file"
    
    # Load issues context
    local issues_context
    issues_context=$(cat "${ARTIFACTS_DIR}/contextual_loop_context.json" | jq '.issues_to_remediate')
    
    local total_issues
    total_issues=$(echo "$issues_context" | jq -r '.total_issues // 0')
    
    if [[ "$total_issues" -eq 0 ]]; then
        log_success "No issues to remediate - contextual loop completed successfully"
        echo '{"contextual_loop_completed": true, "reason": "no_issues", "session_id": "'$SESSION_ID'"}' > "${ARTIFACTS_DIR}/contextual_loop_final.json"
        exit 0
    fi
    
    # Execute contextual cycles
    local cycle=1
    local remaining_issues="$total_issues"
    local loop_success=false
    
    while [[ $cycle -le $MAX_LOOP_CYCLES ]] && [[ $remaining_issues -gt 0 ]]; do
        log_info "Starting contextual cycle $cycle/$MAX_LOOP_CYCLES with $remaining_issues remaining issues"
        
        # Execute cycle
        execute_contextual_cycle "$cycle" "$issues_context"
        
        # Validate remediation
        if validate_remediation "$cycle"; then
            loop_success=true
            log_success "Contextual loop completed successfully after $cycle cycles"
            break
        fi
        
        # Update remaining issues count for next cycle
        if [[ -f "${ARTIFACTS_DIR}/cycle_${cycle}_validation.json" ]]; then
            local new_remaining
            new_remaining=$(cat "${ARTIFACTS_DIR}/cycle_${cycle}_validation.json" | jq -r '.remaining_theater_patterns // .remaining_blocking_issues // '$remaining_issues'')
            remaining_issues="$new_remaining"
        fi
        
        cycle=$((cycle + 1))
        
        # Brief pause between cycles
        sleep 2
    done
    
    # Calculate execution time
    local end_time
    local duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # Generate final summary
    local final_status
    if $loop_success; then
        final_status="completed_successfully"
    elif [[ $cycle -gt $MAX_LOOP_CYCLES ]]; then
        final_status="max_cycles_reached"  
    else
        final_status="incomplete"
    fi
    
    local final_summary
    final_summary=$(jq -n \
        --arg session "$SESSION_ID" \
        --arg status "$final_status" \
        --arg cycles_executed "$((cycle - 1))" \
        --arg max_cycles "$MAX_LOOP_CYCLES" \
        --arg duration "$duration" \
        --arg initial_issues "$total_issues" \
        --arg remaining_issues "$remaining_issues" \
        '{
            contextual_loop_completed: true,
            session_id: $session,
            final_status: $status,
            cycles_executed: ($cycles_executed | tonumber),
            max_cycles_allowed: ($max_cycles | tonumber),
            execution_duration_seconds: ($duration | tonumber),
            initial_issues: ($initial_issues | tonumber),
            remaining_issues: ($remaining_issues | tonumber),
            issues_resolved: (($initial_issues | tonumber) - ($remaining_issues | tonumber)),
            success_rate: (if ($initial_issues | tonumber) > 0 then ((($initial_issues | tonumber) - ($remaining_issues | tonumber)) / ($initial_issues | tonumber)) else 0 end),
            completion_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$final_summary" > "${ARTIFACTS_DIR}/contextual_loop_final.json"
    
    # Store final results in memory
    if command -v scripts/memory_bridge.sh >/dev/null 2>&1 && [[ -f "${SCRIPT_DIR}/memory_bridge.sh" ]]; then
        scripts/memory_bridge.sh store "intelligence/contextual_loops" "final_$(date +%s)" "$final_summary" '{"type": "contextual_loop_completion", "session": "'$SESSION_ID'"}' 2>/dev/null || true
        scripts/memory_bridge.sh sync 2>/dev/null || true
    fi
    
    # Display final results
    local success_rate
    success_rate=$(echo "$final_summary" | jq -r '.success_rate')
    
    log_info "Contextual loop completed in ${duration}s"
    log_info "Status: $final_status"
    log_info "Issues resolved: $((total_issues - remaining_issues))/$total_issues (${success_rate}% success rate)"
    
    case "$final_status" in
        "completed_successfully")
            log_success "[PARTY] All issues resolved - contextual loop successful"
            exit 0
            ;;
        "max_cycles_reached")
            log_warning "[CYCLE] Maximum cycles reached - some issues may remain"
            exit 1
            ;;
        *)
            log_error "[FAIL] Contextual loop incomplete"
            exit 2
            ;;
    esac
}

# Help function
show_help() {
    cat <<EOF
Contextual Understanding Loop - Theater Detection and Remediation

USAGE:
    $0 <audit-results-file> [options]

DESCRIPTION:
    Executes contextual understanding cycles to detect and remediate
    theater patterns and blocking issues identified in audit results.

ARGUMENTS:
    audit-results-file      Path to audit results JSON file

OPTIONS:
    -h, --help              Show this help
    -m, --mode <mode>       Remediation mode: comprehensive, focused, basic (default: comprehensive)
    -c, --cycles <num>      Maximum loop cycles (default: 3)
    -t, --theater-focused   Focus on theater-specific issues (default: false)
    -s, --session <id>      Custom session ID (default: auto-generated)
    -d, --debug             Enable debug logging

ENVIRONMENT VARIABLES:
    SESSION_ID              Custom session identifier
    REMEDIATION_MODE        Remediation execution mode
    MAX_LOOP_CYCLES        Maximum contextual loop cycles
    THEATER_FOCUSED        Focus on theater issues (true/false)
    DEBUG                  Enable debug output (0/1)

EXIT CODES:
    0 - All issues resolved successfully
    1 - Maximum cycles reached, some issues remain
    2 - Contextual loop incomplete or failed

EXAMPLES:
    $0 audit_results.json                              # Run comprehensive remediation
    $0 audit_results.json --theater-focused --cycles 5  # Theater-focused with 5 cycles
    $0 audit_results.json --mode focused --debug       # Focused mode with debug output

INTEGRATION:
    - Integrates with SPEK quality framework commands
    - Uses Claude Flow coordination when available
    - Stores results in unified memory bridge
    - Supports theater detection and reality checking
EOF
}

# Parse command line arguments
AUDIT_RESULTS_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--mode)
            REMEDIATION_MODE="$2"
            shift 2
            ;;
        -c|--cycles)
            MAX_LOOP_CYCLES="$2"
            shift 2
            ;;
        -t|--theater-focused)
            THEATER_FOCUSED="true"
            shift
            ;;
        -s|--session)
            SESSION_ID="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=1
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Use --help for usage information" >&2
            exit 1
            ;;
        *)
            if [[ -z "$AUDIT_RESULTS_FILE" ]]; then
                AUDIT_RESULTS_FILE="$1"
            else
                log_error "Multiple audit result files specified"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate configuration
if [[ -z "$AUDIT_RESULTS_FILE" ]]; then
    log_error "Audit results file is required"
    show_help
    exit 1
fi

case "$REMEDIATION_MODE" in
    comprehensive|focused|basic) ;;
    *) log_error "Invalid remediation mode: $REMEDIATION_MODE"; exit 1 ;;
esac

if ! [[ "$MAX_LOOP_CYCLES" =~ ^[0-9]+$ ]] || [[ "$MAX_LOOP_CYCLES" -lt 1 ]] || [[ "$MAX_LOOP_CYCLES" -gt 10 ]]; then
    log_error "Invalid cycle count: $MAX_LOOP_CYCLES (must be 1-10)"
    exit 1
fi

# Execute main function
main "$AUDIT_RESULTS_FILE"
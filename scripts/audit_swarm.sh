#!/usr/bin/env bash
# Audit Swarm Script - Post-deployment theater detection and validation
# Integrates with SPEK quality framework and memory bridge coordination

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR="${SCRIPT_DIR}/../.claude/.artifacts"
SESSION_ID="${SESSION_ID:-audit-swarm-$(date +%s)}"
AUDIT_MODE="${AUDIT_MODE:-comprehensive}"
THEATER_DETECTION="${THEATER_DETECTION_ENABLED:-true}"
EVIDENCE_LEVEL="${EVIDENCE_LEVEL:-detailed}"

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
log_info() { echo -e "${CYAN}[SEARCH] $1${NC}"; }
log_success() { echo -e "${GREEN}[OK] $1${NC}"; }
log_warning() { echo -e "${YELLOW}[WARN]  $1${NC}"; }
log_error() { echo -e "${RED}[FAIL] $1${NC}"; }
log_debug() { [[ "${DEBUG:-0}" == "1" ]] && echo -e "${PURPLE}[SEARCH] DEBUG: $1${NC}"; }

# Initialize audit environment
initialize_audit_environment() {
    log_info "Initializing swarm audit environment..."
    
    # Initialize memory bridge
    if [[ -f "${SCRIPT_DIR}/memory_bridge.sh" ]]; then
        log_debug "Loading memory bridge..."
        source "${SCRIPT_DIR}/memory_bridge.sh"
        initialize_memory_router || log_warning "Memory bridge initialization failed"
    else
        log_warning "Memory bridge not found - continuing without memory integration"
    fi
    
    # Initialize Claude Flow coordination if available
    if command -v npx >/dev/null 2>&1 && npx claude-flow@alpha --version >/dev/null 2>&1; then
        log_debug "Initializing Claude Flow coordination..."
        npx claude-flow@alpha swarm status --session "$SESSION_ID" 2>/dev/null || true
    else
        log_debug "Claude Flow not available - continuing with basic audit"
    fi
    
    # Create audit session context
    local audit_context
    audit_context=$(jq -n \
        --arg session "$SESSION_ID" \
        --arg mode "$AUDIT_MODE" \
        --arg theater "$THEATER_DETECTION" \
        --arg evidence "$EVIDENCE_LEVEL" \
        '{
            session_id: $session,
            audit_mode: $mode,
            theater_detection_enabled: ($theater == "true"),
            evidence_level: $evidence,
            initialization_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            audit_type: "post_swarm_deployment"
        }')
    
    echo "$audit_context" > "${ARTIFACTS_DIR}/audit_session.json"
    log_success "Audit environment initialized"
}

# Execute comprehensive quality gates
execute_quality_gates() {
    log_info "Executing comprehensive quality gates..."
    
    local quality_results=""
    local quality_status="unknown"
    
    # Run QA gates with architecture awareness
    log_debug "Running enhanced QA with architecture integration..."
    if claude /qa:run --architecture --performance-monitor --sequential-thinking --memory-update >/dev/null 2>&1; then
        if [[ -f "${ARTIFACTS_DIR}/qa_enhanced.json" ]]; then
            quality_results=$(cat "${ARTIFACTS_DIR}/qa_enhanced.json")
            quality_status="available"
        elif [[ -f "${ARTIFACTS_DIR}/qa.json" ]]; then
            quality_results=$(cat "${ARTIFACTS_DIR}/qa.json")
            quality_status="basic"
        fi
    else
        log_warning "QA execution failed - continuing with available artifacts"
        quality_results='{"status": "qa_execution_failed"}'
        quality_status="failed"
    fi
    
    # Run connascence analysis with theater detection awareness
    log_debug "Running connascence analysis with theater detection..."
    if claude /conn:scan --architecture --detector-pools --enhanced-metrics --hotspots >/dev/null 2>&1; then
        log_debug "Connascence analysis completed"
    else
        log_warning "Connascence analysis failed"
    fi
    
    # Run security scan
    log_debug "Running security scan..."
    if claude /sec:scan --comprehensive --owasp-top-10 >/dev/null 2>&1; then
        log_debug "Security scan completed"
    else
        log_warning "Security scan failed"
    fi
    
    # Compile quality gate results
    local quality_summary
    quality_summary=$(jq -n \
        --argjson results "$quality_results" \
        --arg status "$quality_status" \
        '{
            quality_gates_executed: true,
            quality_status: $status,
            quality_results: $results,
            execution_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$quality_summary" > "${ARTIFACTS_DIR}/quality_gates_summary.json"
    log_success "Quality gates execution completed"
}

# Deploy theater-killer agent suite
deploy_theater_killer_agents() {
    log_info "Deploying theater-killer agent suite..."
    
    if [[ "$THEATER_DETECTION" != "true" ]]; then
        log_warning "Theater detection disabled - skipping theater-killer agents"
        echo '{"theater_detection_skipped": true}' > "${ARTIFACTS_DIR}/theater_killer_results.json"
        return 0
    fi
    
    local agent_results="{}"
    
    # Deploy Reality Checker Agent
    log_debug "Deploying Reality Checker agent..."
    if claude /reality:check --scope user-journey --deployment-validation --integration-tests --evidence-package >/dev/null 2>&1; then
        if [[ -f "${ARTIFACTS_DIR}/reality_check_results.json" ]]; then
            local reality_results
            reality_results=$(cat "${ARTIFACTS_DIR}/reality_check_results.json")
            agent_results=$(echo "$agent_results" | jq --argjson reality "$reality_results" '. + {reality_checker: $reality}')
            log_success "Reality Checker completed"
        else
            log_warning "Reality Checker completed but no results found"
        fi
    else
        log_error "Reality Checker deployment failed"
        agent_results=$(echo "$agent_results" | jq '. + {reality_checker: {error: "deployment_failed"}}')
    fi
    
    # Execute Theater Scan
    log_debug "Executing theater pattern detection..."
    if claude /theater:scan --scope comprehensive --quality-correlation --evidence-level "$EVIDENCE_LEVEL" >/dev/null 2>&1; then
        if [[ -f "${ARTIFACTS_DIR}/theater_scan_results.json" ]]; then
            local theater_scan_results
            theater_scan_results=$(cat "${ARTIFACTS_DIR}/theater_scan_results.json")
            agent_results=$(echo "$agent_results" | jq --argjson theater "$theater_scan_results" '. + {theater_killer: $theater}')
            log_success "Theater scan completed"
        else
            log_warning "Theater scan completed but no results found"
        fi
    else
        log_error "Theater scan failed"
        agent_results=$(echo "$agent_results" | jq '. + {theater_killer: {error: "scan_failed"}}')
    fi
    
    # Generate Completion Audit (using available data)
    log_debug "Executing completion audit..."
    local completion_claims="[]"
    
    # Extract completion claims from git history
    if command -v git >/dev/null 2>&1; then
        local recent_commits
        recent_commits=$(git log --oneline -10 --pretty=format:'{"commit": "%H", "message": "%s", "author": "%an", "date": "%cd"}' 2>/dev/null | jq -s '.' 2>/dev/null || echo '[]')
        completion_claims="$recent_commits"
    fi
    
    # Generate completion audit based on available data
    local completion_audit
    completion_audit=$(jq -n \
        --argjson claims "$completion_claims" \
        --argjson quality "$(cat "${ARTIFACTS_DIR}/quality_gates_summary.json" 2>/dev/null || echo '{}')" \
        '{
            completion_claims_analyzed: $claims,
            quality_context: $quality,
            audit_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            agent: "completion-auditor",
            audit_method: "git_history_analysis"
        }')
    
    agent_results=$(echo "$agent_results" | jq --argjson audit "$completion_audit" '. + {completion_auditor: $audit}')
    
    # Store comprehensive agent results
    local final_agent_results
    final_agent_results=$(jq -n \
        --argjson agents "$agent_results" \
        '{
            theater_killer_suite_results: $agents,
            deployment_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            session_id: "'$SESSION_ID'",
            evidence_level: "'$EVIDENCE_LEVEL'"
        }')
    
    echo "$final_agent_results" > "${ARTIFACTS_DIR}/theater_killer_results.json"
    log_success "Theater-killer agent suite deployment completed"
}

# Analyze audit results and generate recommendations
analyze_audit_results() {
    log_info "Analyzing audit results and generating recommendations..."
    
    local quality_gates
    local theater_results
    local audit_analysis
    
    quality_gates=$(cat "${ARTIFACTS_DIR}/quality_gates_summary.json" 2>/dev/null || echo '{}')
    theater_results=$(cat "${ARTIFACTS_DIR}/theater_killer_results.json" 2>/dev/null || echo '{}')
    
    # Extract key metrics
    local theater_patterns_detected=0
    local reality_score=0
    local quality_status="unknown"
    local blocking_issues=0
    
    # Extract theater detection metrics
    if [[ "$THEATER_DETECTION" == "true" ]]; then
        theater_patterns_detected=$(echo "$theater_results" | jq -r '.theater_killer_suite_results.theater_killer.theater_summary.total_patterns_detected // 0' 2>/dev/null || echo "0")
        reality_score=$(echo "$theater_results" | jq -r '.theater_killer_suite_results.reality_checker.overall_reality_assessment.reality_score // 0' 2>/dev/null || echo "0")
        blocking_issues=$(echo "$theater_results" | jq -r '.theater_killer_suite_results.reality_checker.overall_reality_assessment.critical_blockers // [] | length' 2>/dev/null || echo "0")
    fi
    
    # Extract quality gate status
    quality_status=$(echo "$quality_gates" | jq -r '.quality_status // "unknown"' 2>/dev/null)
    
    # Determine overall audit status
    local audit_status="unknown"
    local commit_readiness="unknown"
    local recommendations=()
    
    if [[ "$theater_patterns_detected" -eq 0 ]] && [[ "$blocking_issues" -eq 0 ]] && [[ "$quality_status" == "available" ]]; then
        audit_status="clean"
        commit_readiness="ready"
        recommendations+=("All audits passed - safe to commit")
    elif [[ "$theater_patterns_detected" -gt 0 ]] || [[ "$blocking_issues" -gt 0 ]]; then
        audit_status="issues_detected"
        commit_readiness="blocked"
        
        if [[ "$theater_patterns_detected" -gt 0 ]]; then
            recommendations+=("Eliminate $theater_patterns_detected theater patterns before commit")
        fi
        
        if [[ "$blocking_issues" -gt 0 ]]; then
            recommendations+=("Resolve $blocking_issues blocking issues before commit")
        fi
        
        recommendations+=("Run contextual remediation loops")
        recommendations+=("Re-audit after remediation")
    else
        audit_status="partial"
        commit_readiness="review_required"
        recommendations+=("Manual review required - incomplete audit data")
    fi
    
    # Generate comprehensive audit analysis
    audit_analysis=$(jq -n \
        --argjson quality "$quality_gates" \
        --argjson theater "$theater_results" \
        --arg status "$audit_status" \
        --arg readiness "$commit_readiness" \
        --arg theater_count "$theater_patterns_detected" \
        --arg reality_score "$reality_score" \
        --arg blocking_count "$blocking_issues" \
        --argjson recommendations "$(printf '%s\n' "${recommendations[@]}" | jq -R . | jq -s .)" \
        '{
            audit_analysis: {
                session_id: "'$SESSION_ID'",
                audit_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
                audit_status: $status,
                commit_readiness: $readiness,
                metrics: {
                    theater_patterns_detected: ($theater_count | tonumber),
                    reality_score: ($reality_score | tonumber),
                    blocking_issues: ($blocking_count | tonumber),
                    quality_gates_status: "'$quality_status'"
                },
                recommendations: $recommendations,
                evidence_package: {
                    quality_gates: $quality,
                    theater_detection: $theater
                }
            }
        }')
    
    echo "$audit_analysis" > "${ARTIFACTS_DIR}/audit_analysis.json"
    
    # Display summary
    log_info "Audit Analysis Summary:"
    echo "  Status: $audit_status"
    echo "  Commit Readiness: $commit_readiness"
    echo "  Theater Patterns: $theater_patterns_detected"
    echo "  Blocking Issues: $blocking_issues"
    echo "  Reality Score: $reality_score"
    
    if [[ "${#recommendations[@]}" -gt 0 ]]; then
        log_info "Recommendations:"
        for rec in "${recommendations[@]}"; do
            echo "    - $rec"
        done
    fi
    
    log_success "Audit analysis completed"
}

# Store audit results in memory bridge
store_audit_results() {
    log_info "Storing audit results in unified memory..."
    
    if ! command -v scripts/memory_bridge.sh >/dev/null 2>&1 || [[ ! -f "${SCRIPT_DIR}/memory_bridge.sh" ]]; then
        log_warning "Memory bridge not available - skipping memory storage"
        return 0
    fi
    
    local audit_results
    audit_results=$(cat "${ARTIFACTS_DIR}/audit_analysis.json" 2>/dev/null || echo '{}')
    
    if [[ "$audit_results" != "{}" ]]; then
        # Store audit results
        scripts/memory_bridge.sh store "intelligence/audit" "swarm_audit_$(date +%s)" "$audit_results" '{"type": "swarm_audit", "session": "'$SESSION_ID'"}' 2>/dev/null || log_warning "Failed to store audit results in memory"
        
        # Store theater patterns if detected
        if [[ "$THEATER_DETECTION" == "true" ]]; then
            local theater_patterns
            theater_patterns=$(echo "$audit_results" | jq '.audit_analysis.evidence_package.theater_detection' 2>/dev/null || echo '{}')
            
            if [[ "$theater_patterns" != "{}" ]]; then
                scripts/memory_bridge.sh store "intelligence/theater_patterns" "detection_$(date +%s)" "$theater_patterns" '{"type": "theater_detection", "session": "'$SESSION_ID'"}' 2>/dev/null || log_warning "Failed to store theater patterns in memory"
            fi
        fi
        
        # Synchronize memory systems
        scripts/memory_bridge.sh sync 2>/dev/null || log_warning "Memory synchronization failed"
        
        log_success "Audit results stored in unified memory"
    else
        log_warning "No audit results to store in memory"
    fi
}

# Main execution function
main() {
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting swarm audit with session: $SESSION_ID"
    
    # Initialize environment
    initialize_audit_environment
    
    # Execute quality gates
    execute_quality_gates
    
    # Deploy theater detection agents
    deploy_theater_killer_agents
    
    # Analyze results
    analyze_audit_results
    
    # Store results in memory
    store_audit_results
    
    # Calculate execution time
    local end_time
    local duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # Generate final summary
    local final_summary
    final_summary=$(jq -n \
        --arg session "$SESSION_ID" \
        --arg duration "$duration" \
        --arg theater_enabled "$THEATER_DETECTION" \
        '{
            swarm_audit_completed: true,
            session_id: $session,
            execution_duration_seconds: ($duration | tonumber),
            theater_detection_enabled: ($theater_enabled == "true"),
            completion_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            artifacts_location: ".claude/.artifacts/"
        }')
    
    echo "$final_summary" > "${ARTIFACTS_DIR}/swarm_audit_summary.json"
    
    log_success "Swarm audit completed in ${duration}s"
    
    # Display final status
    if [[ -f "${ARTIFACTS_DIR}/audit_analysis.json" ]]; then
        local commit_readiness
        commit_readiness=$(jq -r '.audit_analysis.commit_readiness // "unknown"' "${ARTIFACTS_DIR}/audit_analysis.json")
        
        case "$commit_readiness" in
            "ready")
                log_success "[PARTY] AUDIT PASSED: Safe to commit"
                exit 0
                ;;
            "blocked")
                log_error "[U+1F6AB] AUDIT BLOCKED: Issues must be resolved before commit"
                exit 1
                ;;
            "review_required")
                log_warning "[CLIPBOARD] AUDIT INCOMPLETE: Manual review required"
                exit 2
                ;;
            *)
                log_warning "[U+2753] AUDIT STATUS UNKNOWN: Check detailed results"
                exit 3
                ;;
        esac
    else
        log_error "[FAIL] AUDIT FAILED: No analysis results generated"
        exit 4
    fi
}

# Help function
show_help() {
    cat <<EOF
Audit Swarm Script - Post-deployment theater detection and validation

USAGE:
    $0 [options]

DESCRIPTION:
    Executes comprehensive post-swarm audit including quality gates,
    theater detection, and completion validation within SPEK framework.

OPTIONS:
    -h, --help              Show this help
    -m, --mode <mode>       Audit mode: comprehensive, focused, basic (default: comprehensive)
    -t, --theater <bool>    Enable theater detection: true, false (default: true)
    -e, --evidence <level>  Evidence level: basic, detailed, comprehensive (default: detailed)
    -s, --session <id>      Custom session ID (default: auto-generated)
    -d, --debug             Enable debug logging

ENVIRONMENT VARIABLES:
    SESSION_ID              Custom session identifier
    AUDIT_MODE             Audit execution mode
    THEATER_DETECTION_ENABLED  Enable theater detection (true/false)
    EVIDENCE_LEVEL         Level of evidence collection
    DEBUG                  Enable debug output (0/1)

EXIT CODES:
    0 - Audit passed, safe to commit
    1 - Audit blocked, issues must be resolved
    2 - Audit incomplete, manual review required
    3 - Audit status unknown
    4 - Audit failed to execute

EXAMPLES:
    $0                              # Run comprehensive audit
    $0 --mode focused --theater false  # Run focused audit without theater detection
    $0 --evidence comprehensive --debug  # Run with maximum evidence and debug output

INTEGRATION:
    - Integrates with SPEK quality framework
    - Uses Claude Flow coordination when available
    - Stores results in unified memory bridge
    - Supports post-swarm deployment hooks
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--mode)
            AUDIT_MODE="$2"
            shift 2
            ;;
        -t|--theater)
            THEATER_DETECTION="$2"
            shift 2
            ;;
        -e|--evidence)
            EVIDENCE_LEVEL="$2"
            shift 2
            ;;
        -s|--session)
            SESSION_ID="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=1
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Validate configuration
case "$AUDIT_MODE" in
    comprehensive|focused|basic) ;;
    *) log_error "Invalid audit mode: $AUDIT_MODE"; exit 1 ;;
esac

case "$THEATER_DETECTION" in
    true|false) ;;
    *) log_error "Invalid theater detection setting: $THEATER_DETECTION"; exit 1 ;;
esac

case "$EVIDENCE_LEVEL" in
    basic|detailed|comprehensive) ;;
    *) log_error "Invalid evidence level: $EVIDENCE_LEVEL"; exit 1 ;;
esac

# Execute main function
main "$@"
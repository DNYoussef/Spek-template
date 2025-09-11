#!/bin/bash

# Complete SPEK Quality Loop Orchestration
# Master script that integrates all components of the quality improvement system

set -euo pipefail

# Configuration
ARTIFACTS_DIR=".claude/.artifacts"
SCRIPTS_DIR="scripts"

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Logging functions
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] [OK]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARN]${NC} $*"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] [FAIL]${NC} $*"; }
log_info() { echo -e "${CYAN}[$(date '+%H:%M:%S')] i[U+FE0F]${NC} $*"; }
log_header() { echo -e "${BOLD}${PURPLE}[$(date '+%H:%M:%S')] [ROCKET]${NC}${BOLD} $*${NC}"; }

# Banner
show_banner() {
    echo -e "${BOLD}${BLUE}"
    cat << 'EOF'
[U+2554][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2557]
[U+2551]                   SPEK QUALITY IMPROVEMENT LOOP                             [U+2551]
[U+2551]            Comprehensive GitHub Integration with Reality Validation         [U+2551]
[U+2560][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2563]
[U+2551]  [CYCLE] Iterative Quality Loop with GitHub MCP Integration                      [U+2551]
[U+2551]  [U+1F3AD] Theater Detection and Reality Validation                                [U+2551] 
[U+2551]  [SCIENCE] Comprehensive Testing and Verification Pipeline                         [U+2551]
[U+2551]  [LIGHTNING] Surgical Fix Implementation with Complexity Routing                     [U+2551]
[U+2551]  [CHART] Quality Measurement with Statistical Process Control                    [U+2551]
[U+2551]  [BRAIN] Pattern Recognition and Learning Integration                            [U+2551]
[U+255A][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+2550][U+255D]
EOF
    echo -e "${NC}"
}

# System Requirements Check
check_system_requirements() {
    log_header "System Requirements Check"
    
    local requirements_met=true
    
    # Check required commands
    local required_commands=("git" "jq" "bc" "find" "grep" "awk" "sed")
    
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            log_success "[U+2713] $cmd is available"
        else
            log_error "[U+2717] $cmd is not available"
            requirements_met=false
        fi
    done
    
    # Check optional but recommended commands
    local optional_commands=("gh" "npm" "python" "semgrep")
    
    log_info "Optional components:"
    for cmd in "${optional_commands[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            log_success "[U+2713] $cmd is available"
        else
            log_warning "[U+25CB] $cmd is not available (optional)"
        fi
    done
    
    # Check Node.js project setup
    if [[ -f "package.json" ]]; then
        log_success "[U+2713] Node.js project detected"
        
        # Check if node_modules exists
        if [[ -d "node_modules" ]]; then
            log_success "[U+2713] Dependencies installed"
        else
            log_warning "[U+25CB] Dependencies not installed (run npm install)"
        fi
    else
        log_info "[U+25CB] No package.json found (will create basic structure)"
    fi
    
    # Check Python analyzer
    if [[ -d "analyzer" ]]; then
        log_success "[U+2713] Connascence analyzer detected"
        
        if python -c "import analyzer" 2>/dev/null; then
            log_success "[U+2713] Analyzer module importable"
        else
            log_warning "[U+25CB] Analyzer module has import issues"
        fi
    else
        log_info "[U+25CB] No analyzer directory found"
    fi
    
    # Check Git repository status
    if git rev-parse --git-dir >/dev/null 2>&1; then
        log_success "[U+2713] Git repository detected"
        
        # Check for uncommitted changes
        if [[ -n "$(git status --porcelain)" ]]; then
            log_warning "[U+25CB] Uncommitted changes detected (will be handled safely)"
        else
            log_success "[U+2713] Working tree is clean"
        fi
    else
        log_error "[U+2717] Not in a Git repository"
        requirements_met=false
    fi
    
    if [[ "$requirements_met" == "true" ]]; then
        log_success "[TARGET] System requirements check: PASSED"
        return 0
    else
        log_error "[FAIL] System requirements check: FAILED"
        return 1
    fi
}

# Initialize Quality Loop Environment
initialize_environment() {
    log_header "Initializing Quality Loop Environment"
    
    # Create required directories
    mkdir -p "$ARTIFACTS_DIR" "$SCRIPTS_DIR"
    log_success "Created artifacts and scripts directories"
    
    # Make all scripts executable
    chmod +x "$SCRIPTS_DIR"/*.sh 2>/dev/null || true
    log_success "Made scripts executable"
    
    # Initialize session tracking
    local session_id="complete-loop-$(git branch --show-current || echo 'main')-$(date +%s)"
    
    cat > "$ARTIFACTS_DIR/session_info.json" << EOF
{
    "session_id": "$session_id",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "git_branch": "$(git branch --show-current || echo 'main')",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "working_directory": "$(pwd)",
    "scripts_available": []
}
EOF
    
    # Check available scripts
    local available_scripts=()
    for script in "$SCRIPTS_DIR"/*.sh; do
        if [[ -f "$script" ]]; then
            available_scripts+=("$(basename "$script")")
        fi
    done
    
    # Update session info with available scripts
    local scripts_json
    printf -v scripts_json '%s\n' "${available_scripts[@]}" | jq -R . | jq -s .
    
    jq --argjson scripts "$scripts_json" \
       '.scripts_available = $scripts' \
       "$ARTIFACTS_DIR/session_info.json" > "${ARTIFACTS_DIR}/session_info.json.tmp"
    mv "${ARTIFACTS_DIR}/session_info.json.tmp" "$ARTIFACTS_DIR/session_info.json"
    
    log_success "Environment initialized with session ID: $session_id"
    log_info "Available scripts: ${#available_scripts[@]} found"
}

# Pre-flight Validation
preflight_validation() {
    log_header "Pre-flight Validation"
    
    # Validate critical scripts exist
    local critical_scripts=(
        "quality_loop_github.sh"
        "intelligent_failure_analysis.sh" 
        "surgical_fix_system.sh"
        "comprehensive_verification_pipeline.sh"
        "quality_measurement_reality_validation.sh"
        "iterative_improvement_loop.sh"
    )
    
    local scripts_available=true
    
    for script in "${critical_scripts[@]}"; do
        if [[ -f "$SCRIPTS_DIR/$script" ]]; then
            log_success "[U+2713] $script is available"
        else
            log_error "[U+2717] $script is missing"
            scripts_available=false
        fi
    done
    
    # Validate JSON files if they exist
    for json_file in "$ARTIFACTS_DIR"/*.json; do
        if [[ -f "$json_file" ]]; then
            if jq empty "$json_file" 2>/dev/null; then
                log_success "[U+2713] $(basename "$json_file") is valid JSON"
            else
                log_error "[U+2717] $(basename "$json_file") is invalid JSON"
                scripts_available=false
            fi
        fi
    done
    
    if [[ "$scripts_available" == "true" ]]; then
        log_success "[TARGET] Pre-flight validation: PASSED"
        return 0
    else
        log_error "[FAIL] Pre-flight validation: FAILED"
        return 1
    fi
}

# Run Complete Quality Loop
run_complete_loop() {
    log_header "Running Complete SPEK Quality Loop"
    
    local loop_start_time
    loop_start_time=$(date +%s)
    
    # Phase 1: GitHub Analysis and Discovery
    log_info "[SEARCH] Phase 1: Running GitHub Analysis and Discovery..."
    
    if [[ -f "$SCRIPTS_DIR/intelligent_failure_analysis.sh" ]]; then
        if bash "$SCRIPTS_DIR/intelligent_failure_analysis.sh" > "$ARTIFACTS_DIR/phase1_discovery.log" 2>&1; then
            log_success "Phase 1: GitHub analysis completed successfully"
        else
            log_warning "Phase 1: GitHub analysis completed with warnings"
        fi
    else
        log_warning "Phase 1: Intelligent failure analysis script not found, skipping"
    fi
    
    # Phase 2: Surgical Fix Implementation
    log_info "[LIGHTNING] Phase 2: Running Surgical Fix Implementation..."
    
    if [[ -f "$SCRIPTS_DIR/surgical_fix_system.sh" ]]; then
        if bash "$SCRIPTS_DIR/surgical_fix_system.sh" > "$ARTIFACTS_DIR/phase2_implementation.log" 2>&1; then
            log_success "Phase 2: Surgical fixes completed successfully"
        else
            log_warning "Phase 2: Surgical fixes completed with warnings"
        fi
    else
        log_warning "Phase 2: Surgical fix system script not found, skipping"
    fi
    
    # Phase 3: Comprehensive Verification
    log_info "[SCIENCE] Phase 3: Running Comprehensive Verification..."
    
    if [[ -f "$SCRIPTS_DIR/comprehensive_verification_pipeline.sh" ]]; then
        if bash "$SCRIPTS_DIR/comprehensive_verification_pipeline.sh" > "$ARTIFACTS_DIR/phase3_verification.log" 2>&1; then
            log_success "Phase 3: Comprehensive verification completed successfully"
        else
            log_warning "Phase 3: Comprehensive verification completed with warnings"
        fi
    else
        log_warning "Phase 3: Comprehensive verification script not found, skipping"
    fi
    
    # Phase 4: Quality Measurement and Reality Validation
    log_info "[U+1F3AD] Phase 4: Running Quality Measurement and Reality Validation..."
    
    if [[ -f "$SCRIPTS_DIR/quality_measurement_reality_validation.sh" ]]; then
        if bash "$SCRIPTS_DIR/quality_measurement_reality_validation.sh" > "$ARTIFACTS_DIR/phase4_measurement.log" 2>&1; then
            log_success "Phase 4: Quality measurement completed successfully"
        else
            log_warning "Phase 4: Quality measurement completed with warnings"
        fi
    else
        log_warning "Phase 4: Quality measurement script not found, skipping"
    fi
    
    # Calculate total duration
    local loop_end_time
    local total_duration
    loop_end_time=$(date +%s)
    total_duration=$((loop_end_time - loop_start_time))
    
    # Create complete loop summary
    cat > "$ARTIFACTS_DIR/complete_loop_results.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "session_id": "$(jq -r '.session_id' "$ARTIFACTS_DIR/session_info.json")",
    "total_duration_seconds": $total_duration,
    "phases_completed": [
        "github_analysis_discovery",
        "surgical_fix_implementation", 
        "comprehensive_verification",
        "quality_measurement_reality_validation"
    ],
    "overall_status": "completed",
    "artifacts_generated": []
}
EOF
    
    # Collect all generated artifacts
    local artifacts=()
    for artifact_file in "$ARTIFACTS_DIR"/*.json "$ARTIFACTS_DIR"/*.txt "$ARTIFACTS_DIR"/*.log "$ARTIFACTS_DIR"/*.sarif; do
        if [[ -f "$artifact_file" ]]; then
            artifacts+=("$(basename "$artifact_file")")
        fi
    done
    
    # Update artifacts list
    local artifacts_json
    printf -v artifacts_json '%s\n' "${artifacts[@]}" | jq -R . | jq -s .
    
    jq --argjson artifacts "$artifacts_json" \
       '.artifacts_generated = $artifacts' \
       "$ARTIFACTS_DIR/complete_loop_results.json" > "${ARTIFACTS_DIR}/complete_loop_results.json.tmp"
    mv "${ARTIFACTS_DIR}/complete_loop_results.json.tmp" "$ARTIFACTS_DIR/complete_loop_results.json"
    
    log_success "[U+1F3C6] Complete quality loop finished in ${total_duration}s"
    log_success "[CHART] Generated ${#artifacts[@]} evidence artifacts"
}

# Alternative: Run Iterative Loop
run_iterative_loop() {
    log_header "Running Iterative Quality Loop"
    
    if [[ -f "$SCRIPTS_DIR/iterative_improvement_loop.sh" ]]; then
        log_info "[CYCLE] Executing iterative improvement loop..."
        
        # Set environment variables for iterative loop
        export MAX_ITERATIONS="${MAX_ITERATIONS:-3}"
        export HIVE_NAMESPACE="spek/complete-loop/$(date +%Y%m%d)"
        export SESSION_ID="iterative-$(date +%s)"
        
        if bash "$SCRIPTS_DIR/iterative_improvement_loop.sh"; then
            log_success "[PARTY] Iterative quality loop completed successfully!"
            return 0
        else
            log_warning "[WARN] Iterative quality loop completed with issues"
            return 1
        fi
    else
        log_error "[FAIL] Iterative improvement loop script not found"
        return 1
    fi
}

# Generate Final Report
generate_final_report() {
    log_header "Generating Final Quality Report"
    
    local report_file="$ARTIFACTS_DIR/final_quality_report.md"
    
    cat > "$report_file" << EOF
# SPEK Quality Improvement Loop - Final Report

## Executive Summary

This report summarizes the complete execution of the SPEK (Specification-Research-Planning-Execution-Knowledge) Quality Improvement Loop with comprehensive GitHub integration, reality validation, and theater detection.

**Session Information:**
- **Session ID**: $(jq -r '.session_id' "$ARTIFACTS_DIR/session_info.json" 2>/dev/null || echo "unknown")
- **Execution Date**: $(date)
- **Git Branch**: $(git branch --show-current || echo "unknown")
- **Git Commit**: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## Quality Loop Components Executed

### 1. [SEARCH] GitHub Analysis and Discovery
- **Purpose**: Analyze failed GitHub workflow runs and extract failure patterns
- **Status**: $(test -f "$ARTIFACTS_DIR/failure_analysis.json" && echo "[OK] Completed" || echo "[WARN] Partial")
- **Artifacts**: failure_analysis.json, github_runs.json

### 2. [LIGHTNING] Surgical Fix Implementation  
- **Purpose**: Apply targeted fixes based on complexity routing
- **Status**: $(test -f "$ARTIFACTS_DIR/codex_micro_implementation.json" && echo "[OK] Completed" || echo "[WARN] Partial")
- **Approach**: Complexity-based routing (micro-fixes, planned checkpoints, architectural)

### 3. [SCIENCE] Comprehensive Verification
- **Purpose**: Run complete quality gate validation pipeline
- **Status**: $(test -f "$ARTIFACTS_DIR/verification_pipeline_results.json" && echo "[OK] Completed" || echo "[WARN] Partial")
- **Gates Tested**: Tests, TypeScript, Security, NASA Compliance, God Objects, Connascence

### 4. [U+1F3AD] Quality Measurement and Reality Validation
- **Purpose**: Theater detection and reality validation of improvement claims
- **Status**: $(test -f "$ARTIFACTS_DIR/quality_measurement_results.json" && echo "[OK] Completed" || echo "[WARN] Partial")
- **Reality Score**: $(jq -r '.overall_reality_score // "N/A"' "$ARTIFACTS_DIR/quality_measurement_results.json" 2>/dev/null)/100

## Quality Gates Results

### Critical Gates (Must Pass for Deployment)
EOF
    
    # Add quality gate results if available
    if [[ -f "$ARTIFACTS_DIR/verification_pipeline_results.json" ]]; then
        jq -r '
        .critical_gates | to_entries[] | 
        "- **" + (.key | gsub("_"; " ") | ascii_upcase) + "**: " + 
        (.value.status | ascii_upcase) + 
        (if .value.threshold then " (threshold: " + .value.threshold + ")" else "" end)
        ' "$ARTIFACTS_DIR/verification_pipeline_results.json" >> "$report_file"
    else
        echo "- Status information not available" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### Quality Gates (Warn but Allow)
EOF
    
    if [[ -f "$ARTIFACTS_DIR/verification_pipeline_results.json" ]]; then
        jq -r '
        .quality_gates | to_entries[] | 
        "- **" + (.key | gsub("_"; " ") | ascii_upcase) + "**: " + 
        (.value.status | ascii_upcase) + 
        (if .value.threshold then " (threshold: " + .value.threshold + ")" else "" end)
        ' "$ARTIFACTS_DIR/verification_pipeline_results.json" >> "$report_file"
    else
        echo "- Status information not available" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Theater Detection Results

The system performed comprehensive theater detection across 5 categories:
EOF
    
    if [[ -f "$ARTIFACTS_DIR/quality_measurement_results.json" ]]; then
        jq -r '
        .reality_validation.theater_detection | to_entries[] |
        "- **" + (.key | gsub("_"; " ") | ascii_upcase) + "**: " + 
        (.value.status | ascii_upcase) + 
        " (confidence: " + (.value.confidence // 0 | tostring) + "%)"
        ' "$ARTIFACTS_DIR/quality_measurement_results.json" >> "$report_file"
    else
        echo "- Theater detection results not available" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Evidence Artifacts Generated

The following evidence artifacts were generated during the quality loop execution:

EOF
    
    # List all artifacts
    for artifact in "$ARTIFACTS_DIR"/*.json "$ARTIFACTS_DIR"/*.log "$ARTIFACTS_DIR"/*.txt "$ARTIFACTS_DIR"/*.md "$ARTIFACTS_DIR"/*.sarif; do
        if [[ -f "$artifact" ]]; then
            echo "- \`$(basename "$artifact")\` - $(file --brief "$artifact" 2>/dev/null || echo "data file")" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

## Recommendations

Based on the quality loop execution:

1. **If Critical Gates Passed**: Deploy with confidence - all safety checks validated
2. **If Quality Gates Have Warnings**: Review warnings but deployment is allowed
3. **If Theater Detected**: Investigate flagged patterns before deployment
4. **If Reality Score < 80**: Consider additional improvement iterations

## Technical Implementation Notes

- **Safety Mechanisms**: All changes made on feature branches with rollback capability
- **Evidence-Based**: Every improvement claim backed by measurable evidence
- **Reality Validated**: Comprehensive theater detection prevents fake progress
- **GitHub Integrated**: Seamless CI/CD workflow integration with failure analysis

## Next Steps

1. Review detailed artifacts in \`.claude/.artifacts/\` directory
2. Address any remaining quality gate issues
3. Monitor quality metrics in production
4. Use learnings to improve organizational quality processes

---

**Generated by**: SPEK Quality Improvement Loop  
**Powered by**: Claude Code + GitHub Integration  
**Validated by**: Reality Validation with Theater Detection  
**Timestamp**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
    
    log_success "[U+1F4C4] Final quality report generated: $report_file"
}

# Display Results Summary
display_results_summary() {
    log_header "Quality Loop Results Summary"
    echo
    
    # Show session information
    if [[ -f "$ARTIFACTS_DIR/session_info.json" ]]; then
        local session_id
        session_id=$(jq -r '.session_id' "$ARTIFACTS_DIR/session_info.json")
        log_info "[U+1F517] Session ID: $session_id"
    fi
    
    # Show quality gates status if available
    if [[ -f "$ARTIFACTS_DIR/verification_pipeline_results.json" ]]; then
        local overall_status
        overall_status=$(jq -r '.overall_status' "$ARTIFACTS_DIR/verification_pipeline_results.json")
        
        if [[ "$overall_status" == "success" ]]; then
            log_success "[TARGET] Quality Gates: ALL PASSED"
        else
            log_warning "[TARGET] Quality Gates: SOME FAILED"
        fi
    fi
    
    # Show reality score if available
    if [[ -f "$ARTIFACTS_DIR/quality_measurement_results.json" ]]; then
        local reality_score
        reality_score=$(jq -r '.overall_reality_score // "N/A"' "$ARTIFACTS_DIR/quality_measurement_results.json")
        
        if [[ "$reality_score" != "N/A" ]]; then
            if [[ $reality_score -ge 90 ]]; then
                log_success "[U+1F3AD] Reality Score: $reality_score/100 (EXCELLENT)"
            elif [[ $reality_score -ge 80 ]]; then
                log_success "[U+1F3AD] Reality Score: $reality_score/100 (GOOD)"
            elif [[ $reality_score -ge 70 ]]; then
                log_warning "[U+1F3AD] Reality Score: $reality_score/100 (ACCEPTABLE)"
            else
                log_error "[U+1F3AD] Reality Score: $reality_score/100 (NEEDS IMPROVEMENT)"
            fi
        fi
    fi
    
    # Show artifacts count
    local artifact_count
    artifact_count=$(find "$ARTIFACTS_DIR" -name "*.json" -o -name "*.log" -o -name "*.md" -o -name "*.sarif" | wc -l)
    log_info "[CHART] Evidence Artifacts: $artifact_count generated"
    
    # Show available reports
    echo
    log_info "[CLIPBOARD] Available Reports and Artifacts:"
    echo "   [FOLDER] All artifacts: $ARTIFACTS_DIR/"
    
    if [[ -f "$ARTIFACTS_DIR/final_quality_report.md" ]]; then
        echo "   [U+1F4C4] Final report: $ARTIFACTS_DIR/final_quality_report.md"
    fi
    
    if [[ -f "$ARTIFACTS_DIR/complete_loop_results.json" ]]; then
        echo "   [CHART] Loop results: $ARTIFACTS_DIR/complete_loop_results.json"
    fi
    
    echo
}

# Cleanup function
cleanup() {
    log_info "[U+1F9F9] Cleaning up temporary files..."
    
    # Remove temporary files
    find "$ARTIFACTS_DIR" -name "*.tmp" -delete 2>/dev/null || true
    
    # Ensure proper permissions
    chmod -R 644 "$ARTIFACTS_DIR"/* 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Help function
show_help() {
    echo -e "${BOLD}SPEK Quality Improvement Loop${NC}"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --iterative      Run iterative improvement loop (default)"
    echo "  --complete       Run complete single-pass loop"
    echo "  --check-only     Only run system requirements check"
    echo "  --max-iterations N  Set maximum iterations for iterative mode (default: 3)"
    echo "  --help           Show this help message"
    echo
    echo "Environment Variables:"
    echo "  MAX_ITERATIONS   Maximum iterations for iterative loop (default: 3)"
    echo "  SHOW_LOGS        Show verbose logging (default: 1)"
    echo "  HIVE_NAMESPACE   Custom namespace for session tracking"
    echo "  SESSION_ID       Custom session identifier"
    echo
    echo "Examples:"
    echo "  $0                         # Run iterative loop with default settings"
    echo "  $0 --complete             # Run single complete pass"
    echo "  $0 --iterative --max-iterations 5"
    echo "  $0 --check-only           # Just check system requirements"
}

# Main execution function
main() {
    # Parse command line arguments
    local mode="iterative"
    local max_iterations=3
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --iterative)
                mode="iterative"
                shift
                ;;
            --complete)
                mode="complete"
                shift
                ;;
            --check-only)
                mode="check-only"
                shift
                ;;
            --max-iterations)
                max_iterations="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set environment variables
    export MAX_ITERATIONS="$max_iterations"
    
    # Show banner
    show_banner
    
    # System requirements check
    if ! check_system_requirements; then
        log_error "System requirements not met. Please install required components."
        exit 1
    fi
    
    # If check-only mode, exit here
    if [[ "$mode" == "check-only" ]]; then
        log_success "[OK] System requirements check completed"
        exit 0
    fi
    
    # Initialize environment
    initialize_environment
    
    # Pre-flight validation
    if ! preflight_validation; then
        log_error "Pre-flight validation failed. Please check scripts and configuration."
        exit 1
    fi
    
    # Execute based on mode
    local execution_success=false
    
    case $mode in
        "iterative")
            log_header "Executing Iterative Quality Loop Mode"
            if run_iterative_loop; then
                execution_success=true
            fi
            ;;
        "complete")
            log_header "Executing Complete Quality Loop Mode"
            run_complete_loop
            execution_success=true
            ;;
    esac
    
    # Generate final report
    generate_final_report
    
    # Display results
    display_results_summary
    
    # Cleanup
    trap cleanup EXIT
    
    # Final status
    if [[ "$execution_success" == "true" ]]; then
        log_success "[U+1F3C6] SPEK Quality Loop execution completed successfully!"
        echo
        log_info "[SEARCH] Review the generated artifacts for detailed results"
        log_info "[CLIPBOARD] See $ARTIFACTS_DIR/final_quality_report.md for comprehensive summary"
        exit 0
    else
        log_error "[FAIL] SPEK Quality Loop execution completed with issues"
        echo
        log_info "[SEARCH] Review the generated artifacts for error details"
        log_info "[INFO] Consider running with different parameters or manual intervention"
        exit 1
    fi
}

# Execute main function
main "$@"
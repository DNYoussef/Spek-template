#!/bin/bash

# Intelligent Failure Analysis System with Architectural Context
# Advanced failure analysis routing system for SPEK Quality Loop

set -euo pipefail

# Configuration
ARTIFACTS_DIR=".claude/.artifacts"
SCRIPTS_DIR="scripts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $*"; }
log_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $*"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $*"; }
log_info() { echo -e "${CYAN}[$(date '+%H:%M:%S')] ℹ️${NC} $*"; }

# Analyze GitHub workflow failure patterns
analyze_github_failures() {
    log "🔍 Analyzing GitHub workflow failures with architectural context..."
    
    local failure_analysis_file="$ARTIFACTS_DIR/failure_analysis.json"
    
    # Initialize failure analysis structure
    cat > "$failure_analysis_file" << 'EOF'
{
    "timestamp": "",
    "workflow_failures": {},
    "architectural_context": {},
    "failure_patterns": {},
    "fix_strategy": {},
    "complexity_routing": {}
}
EOF
    
    # Update timestamp
    jq --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.timestamp = $ts' "$failure_analysis_file" > "${failure_analysis_file}.tmp"
    mv "${failure_analysis_file}.tmp" "$failure_analysis_file"
    
    # Analyze each type of failure
    analyze_quality_gates_failure
    analyze_connascence_failure  
    analyze_nasa_compliance_failure
    analyze_validation_failure
    
    # Generate architectural recommendations
    generate_architectural_recommendations
    
    # Route fixes by complexity
    route_fixes_by_complexity
    
    log_success "Intelligent failure analysis completed"
    return 0
}

# Analyze Quality Gates workflow failures
analyze_quality_gates_failure() {
    log_info "Analyzing Quality Gates workflow failures..."
    
    # Check if Quality Gates failed recently
    if gh run list --workflow="quality-gates.yml" --limit=5 --json conclusion | jq -r '.[0].conclusion' | grep -q "failure"; then
        log_warning "Quality Gates workflow failed - analyzing root causes..."
        
        # Get the latest failed run
        local run_id
        run_id=$(gh run list --workflow="quality-gates.yml" --limit=1 --json databaseId,conclusion | jq -r '.[] | select(.conclusion == "failure") | .databaseId')
        
        if [[ -n "$run_id" ]]; then
            # Download and analyze failure logs
            mkdir -p "$ARTIFACTS_DIR/quality_gates_failure"
            gh run download "$run_id" --dir "$ARTIFACTS_DIR/quality_gates_failure" 2>/dev/null || true
            
            # Analyze failure patterns
            local failure_patterns=()
            
            # Check for test failures
            if find "$ARTIFACTS_DIR/quality_gates_failure" -name "*.txt" -exec grep -l "FAILED\|ERROR" {} \; 2>/dev/null | head -1 >/dev/null; then
                failure_patterns+=("test_failures")
                log_error "Test failures detected in Quality Gates"
            fi
            
            # Check for TypeScript errors  
            if find "$ARTIFACTS_DIR/quality_gates_failure" -name "*.txt" -exec grep -l "TS[0-9]\+\|error TS" {} \; 2>/dev/null | head -1 >/dev/null; then
                failure_patterns+=("typescript_errors")
                log_error "TypeScript errors detected in Quality Gates"
            fi
            
            # Check for linting issues
            if find "$ARTIFACTS_DIR/quality_gates_failure" -name "*.txt" -exec grep -l "eslint\|lint error" {} \; 2>/dev/null | head -1 >/dev/null; then
                failure_patterns+=("lint_errors")
                log_warning "Linting errors detected in Quality Gates"
            fi
            
            # Update failure analysis
            local patterns_json
            printf -v patterns_json '%s\n' "${failure_patterns[@]}" | jq -R . | jq -s .
            
            jq --argjson patterns "$patterns_json" \
               --arg run_id "$run_id" \
               '.workflow_failures.quality_gates = {
                   "run_id": $run_id,
                   "failure_patterns": $patterns,
                   "severity": "critical",
                   "requires_immediate_fix": true
               }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
            mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
        fi
    else
        log_success "Quality Gates workflow is passing"
    fi
}

# Analyze Connascence Analysis workflow failures
analyze_connascence_failure() {
    log_info "Analyzing Connascence Analysis workflow failures..."
    
    if gh run list --workflow="connascence-analysis.yml" --limit=5 --json conclusion | jq -r '.[0].conclusion' | grep -q "failure"; then
        log_warning "Connascence Analysis workflow failed - checking analyzer..."
        
        local run_id
        run_id=$(gh run list --workflow="connascence-analysis.yml" --limit=1 --json databaseId,conclusion | jq -r '.[] | select(.conclusion == "failure") | .databaseId')
        
        if [[ -n "$run_id" ]]; then
            # Analyze connascence-specific issues
            local connascence_issues=()
            
            # Check if analyzer directory exists and is properly configured
            if [[ ! -d "analyzer" ]]; then
                connascence_issues+=("analyzer_missing")
                log_error "Analyzer directory is missing"
            elif [[ ! -f "analyzer/__init__.py" ]]; then
                connascence_issues+=("analyzer_not_python_module")
                log_error "Analyzer is not a proper Python module"
            elif ! python -c "import analyzer" 2>/dev/null; then
                connascence_issues+=("analyzer_import_error")
                log_error "Analyzer cannot be imported"
            fi
            
            # Check for Python dependencies
            if [[ -f "analyzer/requirements.txt" ]] && ! pip check 2>/dev/null; then
                connascence_issues+=("python_dependencies")
                log_error "Python dependencies issues detected"
            fi
            
            # Check for NASA compliance configuration
            if [[ ! -f "analyzer/config/analysis_config.yaml" ]]; then
                connascence_issues+=("config_missing")
                log_error "Analysis configuration is missing"
            fi
            
            # Update failure analysis
            local issues_json
            printf -v issues_json '%s\n' "${connascence_issues[@]}" | jq -R . | jq -s .
            
            jq --argjson issues "$issues_json" \
               --arg run_id "$run_id" \
               '.workflow_failures.connascence_analysis = {
                   "run_id": $run_id,
                   "issues": $issues,
                   "severity": "high", 
                   "requires_architectural_review": true
               }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
            mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
        fi
    else
        log_success "Connascence Analysis workflow is passing"
    fi
}

# Analyze NASA Compliance workflow failures
analyze_nasa_compliance_failure() {
    log_info "Analyzing NASA Compliance workflow failures..."
    
    if gh run list --workflow="nasa-compliance-check.yml" --limit=5 --json conclusion | jq -r '.[0].conclusion' | grep -q "failure"; then
        log_warning "NASA Compliance workflow failed - checking defense industry standards..."
        
        local run_id
        run_id=$(gh run list --workflow="nasa-compliance-check.yml" --limit=1 --json databaseId,conclusion | jq -r '.[] | select(.conclusion == "failure") | .databaseId')
        
        if [[ -n "$run_id" ]]; then
            # Check NASA Power of Ten compliance issues
            local nasa_violations=()
            
            # Rule 1: Restrict control flow constructs
            if find . -name "*.py" -exec grep -l "goto\|continue\|break" {} \; 2>/dev/null | head -1 >/dev/null; then
                nasa_violations+=("control_flow_violations")
            fi
            
            # Rule 4: Check function complexity (simplified check)
            if find . -name "*.py" -exec awk '/^def / { start=NR } /^[[:space:]]*def / && start { if (NR-start > 60) print FILENAME ":" start; start=NR } END { if (start && NR-start > 60) print FILENAME ":" start }' {} \; 2>/dev/null | head -1 >/dev/null; then
                nasa_violations+=("function_too_long")
            fi
            
            # Rule 7: Dynamic memory allocation (check for excessive object creation)
            if find . -name "*.py" -exec grep -l "malloc\|new \[\]\|global.*list\|global.*dict" {} \; 2>/dev/null | head -1 >/dev/null; then
                nasa_violations+=("dynamic_allocation")
            fi
            
            # Update failure analysis
            local violations_json
            printf -v violations_json '%s\n' "${nasa_violations[@]}" | jq -R . | jq -s .
            
            jq --argjson violations "$violations_json" \
               --arg run_id "$run_id" \
               '.workflow_failures.nasa_compliance = {
                   "run_id": $run_id,
                   "violations": $violations,
                   "severity": "critical",
                   "defense_industry_blocking": true
               }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
            mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
        fi
    else
        log_success "NASA Compliance workflow is passing"
    fi
}

# Analyze Artifact Validation workflow failures
analyze_validation_failure() {
    log_info "Analyzing Artifact Validation workflow failures..."
    
    if gh run list --workflow="validate-artifacts.yml" --limit=5 --json conclusion | jq -r '.[0].conclusion' | grep -q "failure"; then
        log_warning "Artifact Validation workflow failed - checking enterprise readiness..."
        
        local validation_issues=()
        
        # Check if required artifacts directories exist
        if [[ ! -d "$ARTIFACTS_DIR" ]]; then
            validation_issues+=("artifacts_dir_missing")
            mkdir -p "$ARTIFACTS_DIR"
        fi
        
        # Check if package.json is valid
        if ! jq empty package.json 2>/dev/null; then
            validation_issues+=("invalid_package_json")
        fi
        
        # Check if TypeScript config is valid
        if [[ -f "tsconfig.json" ]] && ! jq empty tsconfig.json 2>/dev/null; then
            validation_issues+=("invalid_tsconfig")
        fi
        
        # Check workflow files syntax
        local workflow_syntax_errors=0
        for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
            if [[ -f "$workflow" ]] && ! python -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
                ((workflow_syntax_errors++))
            fi
        done
        
        if [[ $workflow_syntax_errors -gt 0 ]]; then
            validation_issues+=("workflow_syntax_errors")
        fi
        
        # Update failure analysis
        local issues_json
        printf -v issues_json '%s\n' "${validation_issues[@]}" | jq -R . | jq -s .
        
        jq --argjson issues "$issues_json" \
           '.workflow_failures.artifact_validation = {
               "issues": $issues,
               "severity": "medium",
               "enterprise_blocking": false
           }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
        mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
    else
        log_success "Artifact Validation workflow is passing"
    fi
}

# Generate architectural recommendations based on failure patterns
generate_architectural_recommendations() {
    log_info "Generating architectural recommendations..."
    
    # Analyze codebase structure for architectural insights
    local recommendations=()
    
    # Check for god objects (files > 500 lines)
    local god_objects
    god_objects=$(find . -name "*.py" -o -name "*.ts" -o -name "*.js" | xargs wc -l 2>/dev/null | awk '$1 > 500 {print $2}' | head -5)
    
    if [[ -n "$god_objects" ]]; then
        recommendations+=("refactor_god_objects")
        log_warning "God objects detected: $(echo "$god_objects" | tr '\n' ' ')"
    fi
    
    # Check for high coupling (many imports)
    local high_coupling_files
    high_coupling_files=$(find . -name "*.py" -exec grep -c "^import\|^from.*import" {} \; -print 2>/dev/null | awk -F: '$1 > 20 {print $2}' | head -3)
    
    if [[ -n "$high_coupling_files" ]]; then
        recommendations+=("reduce_coupling")
        log_warning "High coupling detected in: $(echo "$high_coupling_files" | tr '\n' ' ')"
    fi
    
    # Check for missing documentation
    local undocumented_functions
    undocumented_functions=$(find . -name "*.py" -exec grep -L '""".*"""' {} \; 2>/dev/null | head -3)
    
    if [[ -n "$undocumented_functions" ]]; then
        recommendations+=("add_documentation")
        log_info "Missing documentation in: $(echo "$undocumented_functions" | tr '\n' ' ')"
    fi
    
    # Check for test coverage gaps (simplified)
    if [[ -d "tests" ]] || [[ -d "test" ]]; then
        local src_files
        local test_files
        src_files=$(find . -name "*.py" -not -path "./test*" -not -path "./*test*" | wc -l)
        test_files=$(find . -name "*test*.py" -o -name "test_*.py" | wc -l)
        
        if [[ $test_files -lt $((src_files / 2)) ]]; then
            recommendations+=("improve_test_coverage")
            log_warning "Low test coverage detected (src: $src_files, tests: $test_files)"
        fi
    else
        recommendations+=("create_test_structure")
        log_error "No test directory structure found"
    fi
    
    # Update failure analysis with recommendations
    local recommendations_json
    printf -v recommendations_json '%s\n' "${recommendations[@]}" | jq -R . | jq -s .
    
    jq --argjson recs "$recommendations_json" \
       '.architectural_context = {
           "recommendations": $recs,
           "priority": "high",
           "requires_systematic_approach": true
       }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
    mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
    
    log_success "Architectural recommendations generated"
}

# Route fixes by complexity analysis
route_fixes_by_complexity() {
    log_info "Routing fixes by complexity analysis..."
    
    # Analyze the failure analysis results and route appropriately
    local routing_strategy="unknown"
    local estimated_loc=0
    local estimated_files=0
    local approach="manual"
    
    # Count total failure types to estimate complexity
    local failure_count
    failure_count=$(jq '[.workflow_failures | to_entries[] | select(.value != null)] | length' "$ARTIFACTS_DIR/failure_analysis.json")
    
    # Estimate based on failure patterns
    case $failure_count in
        0)
            routing_strategy="no_action_needed"
            approach="none"
            ;;
        1)
            routing_strategy="small_fixes"
            estimated_loc=25
            estimated_files=2
            approach="codex_micro"
            ;;
        2|3)
            routing_strategy="multi_file_fixes" 
            estimated_loc=100
            estimated_files=8
            approach="planned_checkpoints"
            ;;
        *)
            routing_strategy="architectural_refactor"
            estimated_loc=500
            estimated_files=20
            approach="gemini_analysis"
            ;;
    esac
    
    # Update routing decision
    jq --arg strategy "$routing_strategy" \
       --arg approach "$approach" \
       --argjson loc $estimated_loc \
       --argjson files $estimated_files \
       '.complexity_routing = {
           "strategy": $strategy,
           "approach": $approach,
           "estimated_loc": $loc,
           "estimated_files": $files,
           "confidence": 0.8
       }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
    mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
    
    log_success "Routing strategy determined: $routing_strategy ($approach)"
    
    # Generate fix strategy
    generate_fix_strategy "$routing_strategy" "$approach"
}

# Generate specific fix strategy based on routing
generate_fix_strategy() {
    local strategy="$1"
    local approach="$2"
    
    log_info "Generating fix strategy: $strategy using $approach"
    
    local fix_steps=()
    local tools_required=()
    
    case $approach in
        "codex_micro")
            fix_steps+=("Use /codex:micro for bounded surgical edits")
            fix_steps+=("Verify changes in sandbox environment")
            fix_steps+=("Apply ≤25 LOC constraint per change")
            tools_required+=("codex_cli")
            tools_required+=("sandbox_verification")
            ;;
        "planned_checkpoints")
            fix_steps+=("Use /fix:planned with bounded checkpoints")
            fix_steps+=("Create rollback points before each checkpoint")
            fix_steps+=("Verify quality gates at each checkpoint")
            tools_required+=("claude_flow")
            tools_required+=("checkpoint_system")
            ;;
        "gemini_analysis")
            fix_steps+=("Use /gemini:impact for comprehensive analysis")
            fix_steps+=("Apply architectural recommendations")
            fix_steps+=("Execute systematic refactoring plan")
            tools_required+=("gemini_cli")
            tools_required+=("architectural_analysis")
            ;;
        "none")
            fix_steps+=("No fixes required - all checks passing")
            ;;
        *)
            fix_steps+=("Manual intervention required")
            fix_steps+=("Review failure analysis for guidance")
            ;;
    esac
    
    # Update fix strategy
    local steps_json
    local tools_json
    printf -v steps_json '%s\n' "${fix_steps[@]}" | jq -R . | jq -s .
    printf -v tools_json '%s\n' "${tools_required[@]}" | jq -R . | jq -s .
    
    jq --argjson steps "$steps_json" \
       --argjson tools "$tools_json" \
       '.fix_strategy = {
           "steps": $steps,
           "tools_required": $tools,
           "execution_order": "sequential",
           "safety_mechanisms": ["auto_branch", "rollback_points", "quality_gates"]
       }' "$ARTIFACTS_DIR/failure_analysis.json" > "${ARTIFACTS_DIR}/failure_analysis.json.tmp"
    mv "${ARTIFACTS_DIR}/failure_analysis.json.tmp" "$ARTIFACTS_DIR/failure_analysis.json"
    
    log_success "Fix strategy generated with $(jq -r '.fix_strategy.steps | length' "$ARTIFACTS_DIR/failure_analysis.json") steps"
}

# Main execution
main() {
    log "🧠 Starting Intelligent Failure Analysis System"
    
    # Ensure artifacts directory exists
    mkdir -p "$ARTIFACTS_DIR"
    
    # Run the analysis
    analyze_github_failures
    
    # Display results summary
    log "📊 Analysis Results Summary:"
    jq -r '
        "Timestamp: " + .timestamp,
        "Failed Workflows: " + (.workflow_failures | keys | length | tostring),
        "Architectural Recommendations: " + (.architectural_context.recommendations // [] | length | tostring),
        "Routing Strategy: " + (.complexity_routing.strategy // "unknown"),
        "Fix Approach: " + (.complexity_routing.approach // "manual"),
        "Estimated LOC: " + (.complexity_routing.estimated_loc // 0 | tostring),
        "Estimated Files: " + (.complexity_routing.estimated_files // 0 | tostring)
    ' "$ARTIFACTS_DIR/failure_analysis.json"
    
    log_success "✅ Intelligent Failure Analysis completed"
    log_info "📄 Detailed results available in: $ARTIFACTS_DIR/failure_analysis.json"
    
    return 0
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
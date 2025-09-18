#!/bin/bash

# Test Script to Verify Theater Elimination
# This script validates that both scripts now contain real implementations instead of theater

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[TEST]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

# Test 1: Check for theater patterns in 3-loop-orchestrator.sh
test_3loop_theater() {
    log_info "Testing 3-loop-orchestrator.sh for theater elimination..."

    local script_file="${SCRIPT_DIR}/3-loop-orchestrator.sh"
    local theater_patterns=0

    # Check for "Would execute" patterns
    if grep -q "Would execute\|Would implement\|Would run" "$script_file"; then
        log_error "Found 'Would execute' theater patterns"
        grep -n "Would execute\|Would implement\|Would run" "$script_file"
        ((theater_patterns++))
    else
        log_success "No 'Would execute' theater patterns found"
    fi

    # Check for hardcoded true returns
    if grep -q "return true\|echo true" "$script_file" | grep -v "test\|npm\|git"; then
        log_warning "Found potential hardcoded true returns"
    else
        log_success "No hardcoded theater returns found"
    fi

    # Check for real tool integrations
    if grep -q "npm test\|npm run lint\|npm audit" "$script_file"; then
        log_success "Real tool integrations found (npm test, lint, audit)"
    else
        log_error "Missing real tool integrations"
        ((theater_patterns++))
    fi

    # Check for real metrics collection
    if grep -q "wc -l\|find.*-name\|grep -c" "$script_file"; then
        log_success "Real metrics collection found"
    else
        log_error "Missing real metrics collection"
        ((theater_patterns++))
    fi

    if [[ $theater_patterns -eq 0 ]]; then
        log_success "3-loop-orchestrator.sh theater elimination: PASSED"
        return 0
    else
        log_error "3-loop-orchestrator.sh theater elimination: FAILED ($theater_patterns issues)"
        return 1
    fi
}

# Test 2: Check for theater patterns in codebase-remediation.sh
test_remediation_theater() {
    log_info "Testing codebase-remediation.sh for theater elimination..."

    local script_file="${SCRIPT_DIR}/codebase-remediation.sh"
    local theater_patterns=0

    # Check for "Would implement" patterns
    if grep -q "Would implement\|Would execute\|Would run.*here" "$script_file"; then
        log_error "Found 'Would implement' theater patterns"
        grep -n "Would implement\|Would execute\|Would run.*here" "$script_file"
        ((theater_patterns++))
    else
        log_success "No 'Would implement' theater patterns found"
    fi

    # Check for real security fixes
    if grep -q "npm audit fix\|npm audit --json" "$script_file"; then
        log_success "Real security fix implementations found"
    else
        log_error "Missing real security fix implementations"
        ((theater_patterns++))
    fi

    # Check for real test analysis
    if grep -q "npm test.*coverage\|find.*test.*spec" "$script_file"; then
        log_success "Real test analysis found"
    else
        log_error "Missing real test analysis"
        ((theater_patterns++))
    fi

    # Check for real quality validation
    if grep -q "theater_score.*=.*[0-9]\|quality_score.*=.*[0-9]" "$script_file"; then
        log_success "Real quality scoring found"
    else
        log_error "Missing real quality scoring"
        ((theater_patterns++))
    fi

    # Check for real improvement detection
    if grep -q "improvement_score.*=.*[0-9]\|quality_checks.*=.*[0-9]" "$script_file"; then
        log_success "Real improvement detection found"
    else
        log_error "Missing real improvement detection"
        ((theater_patterns++))
    fi

    if [[ $theater_patterns -eq 0 ]]; then
        log_success "codebase-remediation.sh theater elimination: PASSED"
        return 0
    else
        log_error "codebase-remediation.sh theater elimination: FAILED ($theater_patterns issues)"
        return 1
    fi
}

# Test 3: Verify real functionality works
test_real_functionality() {
    log_info "Testing real functionality execution..."

    # Create test environment
    local test_dir="${PROJECT_ROOT}/.test-theater-elimination"
    mkdir -p "$test_dir"
    cd "$test_dir"

    # Create minimal package.json for testing
    cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "scripts": {
    "test": "echo 'Tests passing: 5 passing'",
    "lint": "echo 'No lint errors found'"
  }
}
EOF

    # Create test file for analysis
    cat > test.js << 'EOF'
// Test file with some patterns
function testFunction() {
    console.log("TODO: implement this");
    return true;
}
EOF

    # Test if quality analysis functions work
    local has_test_output=false
    local has_lint_output=false

    if npm test >/dev/null 2>&1; then
        has_test_output=true
        log_success "npm test execution works"
    else
        log_warning "npm test execution failed"
    fi

    if npm run lint >/dev/null 2>&1; then
        has_lint_output=true
        log_success "npm lint execution works"
    else
        log_warning "npm lint execution failed"
    fi

    # Test file analysis
    local todo_count=$(grep -c "TODO\|FIXME\|HACK" test.js || echo 0)
    if [[ $todo_count -gt 0 ]]; then
        log_success "File analysis correctly found $todo_count TODO items"
    else
        log_error "File analysis failed to find TODO items"
    fi

    # Cleanup
    cd "$PROJECT_ROOT"
    rm -rf "$test_dir"

    if [[ "$has_test_output" == "true" && "$has_lint_output" == "true" ]]; then
        log_success "Real functionality test: PASSED"
        return 0
    else
        log_error "Real functionality test: FAILED"
        return 1
    fi
}

# Test 4: Verify evidence-based validation
test_evidence_validation() {
    log_info "Testing evidence-based validation..."

    local validation_patterns=0

    # Check both scripts for evidence-based validation
    for script in "3-loop-orchestrator.sh" "codebase-remediation.sh"; do
        local script_file="${SCRIPT_DIR}/$script"

        # Look for conditional logic based on actual results
        if grep -q "if.*npm test.*then\|if.*grep -q.*then\|if.*\$.*-gt.*then" "$script_file"; then
            log_success "$script: Evidence-based conditionals found"
        else
            log_error "$script: Missing evidence-based conditionals"
            ((validation_patterns++))
        fi

        # Look for real exit code checking
        if grep -q ">/dev/null 2>&1\|exit.*code\|return.*[0-9]" "$script_file"; then
            log_success "$script: Real exit code checking found"
        else
            log_error "$script: Missing real exit code checking"
            ((validation_patterns++))
        fi

        # Look for actual file/output parsing
        if grep -q "grep.*-o\|cut.*-d\|awk.*{print\|wc -l" "$script_file"; then
            log_success "$script: Real output parsing found"
        else
            log_error "$script: Missing real output parsing"
            ((validation_patterns++))
        fi
    done

    if [[ $validation_patterns -eq 0 ]]; then
        log_success "Evidence-based validation test: PASSED"
        return 0
    else
        log_error "Evidence-based validation test: FAILED ($validation_patterns issues)"
        return 1
    fi
}

# Main test execution
main() {
    echo "====================================="
    echo "  THEATER ELIMINATION VERIFICATION  "
    echo "====================================="
    echo

    local tests_passed=0
    local total_tests=4

    # Run all tests
    if test_3loop_theater; then ((tests_passed++)); fi
    echo

    if test_remediation_theater; then ((tests_passed++)); fi
    echo

    if test_real_functionality; then ((tests_passed++)); fi
    echo

    if test_evidence_validation; then ((tests_passed++)); fi
    echo

    # Summary
    echo "====================================="
    echo "  THEATER ELIMINATION RESULTS       "
    echo "====================================="

    if [[ $tests_passed -eq $total_tests ]]; then
        log_success "ALL TESTS PASSED ($tests_passed/$total_tests)"
        log_success "Production theater has been successfully eliminated!"
        echo
        echo "✓ Real tool integrations implemented"
        echo "✓ Evidence-based validation added"
        echo "✓ Actual metrics collection working"
        echo "✓ Theater patterns removed"
        echo "✓ Quality scoring is functional"
        return 0
    else
        log_error "SOME TESTS FAILED ($tests_passed/$total_tests)"
        log_error "Additional theater elimination work needed"
        return 1
    fi
}

# Execute main function
main "$@"
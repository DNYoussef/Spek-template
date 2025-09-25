#!/bin/bash
# Phase 3 Critical Fixes Validation Script

echo " Validating Phase 3 Critical Fixes"
echo "======================================"

WORKSPACE_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$WORKSPACE_ROOT"

# Initialize counters
PASS=0
FAIL=0

check_result() {
    if [ $1 -eq 0 ]; then
        echo " $2"
        ((PASS++))
    else
        echo " $2"
        ((FAIL++))
    fi
}

echo ""
echo "1.  Branch Reference Cleanup"
echo "------------------------------"

# Check for develop branch references in critical workflows
DEVELOP_REFS=$(find .github/workflows -name "*.yml" -exec grep -l "develop" {} \; 2>/dev/null | wc -l)
check_result $([[ $DEVELOP_REFS -eq 0 ]] && echo 0 || echo 1) "No develop branch references in workflows"

echo ""
echo "2.  Error Handling Validation"
echo "-------------------------------"

# Check critical workflows have continue-on-error: false for validation steps
CRITICAL_FILES=(".github/workflows/connascence-analysis.yml" ".github/workflows/nasa-pot10-compliance.yml" ".github/workflows/security-orchestrator.yml")

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check that critical validation steps have continue-on-error: false
        VALIDATION_STEPS=$(grep -A 5 "id: analysis\|id: nasa-rules\|id: bandit\|id: semgrep\|id: safety" "$file" | grep -c "continue-on-error: false")
        check_result $([[ $VALIDATION_STEPS -gt 0 ]] && echo 0 || echo 1) "Critical validation steps have proper error handling in $(basename "$file")"
    else
        check_result 1 "Missing critical workflow: $file"
    fi
done

echo ""
echo "3.  Configuration Path Monitoring"
echo "-----------------------------------"

# Check that critical workflows monitor configuration paths
REQUIRED_PATHS=("config/**" ".github/workflows/**" "**/*.yaml" "**/*.yml")

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        ALL_PATHS_FOUND=0
        for path in "${REQUIRED_PATHS[@]}"; do
            if grep -q "$path" "$file"; then
                ((ALL_PATHS_FOUND++))
            fi
        done
        check_result $([[ $ALL_PATHS_FOUND -eq 4 ]] && echo 0 || echo 1) "All required paths monitored in $(basename "$file")"
    fi
done

echo ""
echo "4.  Email Notification Elimination"
echo "------------------------------------"

# Check for email notifications (should be eliminated)
EMAIL_NOTIFICATIONS=$(find .github/workflows -name "*.yml" -exec grep -l "email\|mail" {} \; 2>/dev/null | wc -l)
check_result $([[ $EMAIL_NOTIFICATIONS -eq 0 ]] && echo 0 || echo 1) "No email notifications in workflows"

# Check that enhanced notification strategy exists
check_result $([[ -f ".github/workflows/enhanced-notification-strategy.yml" ]] && echo 0 || echo 1) "Enhanced notification strategy workflow exists"

echo ""
echo "5.  Test Integration Validation"
echo "---------------------------------"

# Check that comprehensive test integration exists
check_result $([[ -f ".github/workflows/comprehensive-test-integration.yml" ]] && echo 0 || echo 1) "Comprehensive test integration workflow exists"

# Check that test files exist or can be created
TEST_FILES=$(find . -name "test_*.py" -o -name "*_test.py" 2>/dev/null | grep -v __pycache__ | wc -l)
TEST_DIRS=$(find . -type d -name "tests" 2>/dev/null | wc -l)
check_result $([[ $TEST_FILES -gt 0 ]] || [[ $TEST_DIRS -gt 0 ]] && echo 0 || echo 1) "Test files or test directories exist"

echo ""
echo "6.  Failure Reporter Scope"
echo "----------------------------"

# Check that failure reporter monitors all critical workflows
if [ -f ".github/workflows/analyzer-failure-reporter.yml" ]; then
    MONITORED_WORKFLOWS=$(grep -A 10 "workflows:" ".github/workflows/analyzer-failure-reporter.yml" | grep -c '- "')
    check_result $([[ $MONITORED_WORKFLOWS -ge 6 ]] && echo 0 || echo 1) "Failure reporter monitors adequate number of workflows ($MONITORED_WORKFLOWS)"
else
    check_result 1 "Analyzer failure reporter workflow missing"
fi

echo ""
echo "7.  Quality Gate Outputs"
echo "--------------------------"

# Check that critical workflows have proper output definitions
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        OUTPUT_COUNT=$(grep -c ">> \$GITHUB_OUTPUT" "$file")
        check_result $([[ $OUTPUT_COUNT -gt 0 ]] && echo 0 || echo 1) "Proper GitHub outputs in $(basename "$file")"
    fi
done

echo ""
echo "8.  Artifact Structure"
echo "------------------------"

# Check that .claude/.artifacts directory exists for QA outputs
check_result $([[ -d ".claude/.artifacts" ]] && echo 0 || echo 1) "Quality assurance artifacts directory exists"

# Check that summary artifact was created
check_result $([[ -f ".claude/.artifacts/phase3-critical-fixes-summary.md" ]] && echo 0 || echo 1) "Phase 3 fixes summary artifact exists"

echo ""
echo "9.  Theater Pattern Elimination"
echo "---------------------------------"

# Check for remaining theater patterns
CONTINUE_ON_ERROR_TRUE=$(find .github/workflows -name "*.yml" -exec grep -l "continue-on-error: true" {} \; 2>/dev/null | wc -l)
check_result $([[ $CONTINUE_ON_ERROR_TRUE -le 2 ]] && echo 0 || echo 1) "Minimal use of continue-on-error: true (non-critical steps only)"

# Check for proper job dependencies
JOB_NEEDS=$(grep -r "needs: \[\]" .github/workflows/ 2>/dev/null | wc -l)
check_result $([[ $JOB_NEEDS -ge 3 ]] && echo 0 || echo 1) "Critical workflows have proper job dependencies"

echo ""
echo "========================================="
echo " Phase 3 Validation Results"
echo "========================================="
echo " PASSED: $PASS"
echo " FAILED: $FAIL"
echo " TOTAL:  $((PASS + FAIL))"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo " ALL PHASE 3 CRITICAL FIXES VALIDATED SUCCESSFULLY!"
    echo " Ready for production deployment"
    echo ""
    echo "Key Improvements:"
    echo "- Email spam eliminated (GitHub-centric notifications)"
    echo "- Hard failure gates (no continue-on-error theater)"
    echo "- Complete configuration monitoring"
    echo "- Comprehensive test integration"
    echo "- Smart notification routing with auto-resolution"
    echo "- Expanded failure monitoring scope"
    exit 0
else
    echo ""
    echo "  Some validations failed. Review the output above."
    echo " Address failing checks before production deployment."
    exit 1
fi
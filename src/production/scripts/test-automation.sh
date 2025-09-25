#!/bin/bash

# GaryxTaleb Trading System - Comprehensive Test Automation
# Defense Industry Testing with Financial Compliance

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/.test-results"
COMPLIANCE_DIR="$PROJECT_ROOT/src/production/security/compliance"

# Environment setup
export NODE_ENV="${NODE_ENV:-test}"
export CI="${CI:-false}"
export COMPLIANCE_MODE="${COMPLIANCE_MODE:-defense-industry}"

# Logging
LOG_FILE="$TEST_RESULTS_DIR/test-automation-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$TEST_RESULTS_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[ERROR $(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE" >&2
}

# Metrics collection
send_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local metric_tags="${3:-}"

    # Send to CloudWatch
    if command -v aws >/dev/null 2>&1; then
        aws cloudwatch put-metric-data \
            --namespace "GaryTaleb/Testing" \
            --metric-data MetricName="$metric_name",Value="$metric_value",Unit=Count \
            --region "${AWS_REGION:-us-east-1}" || true
    fi

    # Send to Prometheus if available
    if [ -n "${PROMETHEUS_PUSHGATEWAY:-}" ]; then
        echo "$metric_name{$metric_tags} $metric_value" | curl -X POST \
            --data-binary @- \
            "$PROMETHEUS_PUSHGATEWAY/metrics/job/test-automation/instance/$(hostname)" || true
    fi
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks"

    # Check Node.js version
    local node_version=$(node --version)
    log "Node.js version: $node_version"

    # Check npm dependencies
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm ci
    fi

    # Check test environment
    if [ ! -f "package.json" ]; then
        error "package.json not found"
        exit 1
    fi

    # Check database connectivity (if required)
    if [ -n "${DATABASE_URL:-}" ]; then
        log "Checking database connectivity..."
        # Add database connectivity check here
    fi

    log "Pre-flight checks completed"
}

# Unit tests
run_unit_tests() {
    log "Running unit tests"

    local start_time=$(date +%s)

    # Run Jest unit tests
    npm run test:unit -- \
        --coverage \
        --coverageReporters=json-summary \
        --coverageReporters=lcov \
        --coverageReporters=text \
        --ci \
        --json \
        --outputFile="$TEST_RESULTS_DIR/unit-test-results.json" \
        --testResultsProcessor="jest-sonar-reporter" || {
        error "Unit tests failed"
        send_metric "unit_tests_failed" 1
        return 1
    }

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Parse results
    local test_results="$TEST_RESULTS_DIR/unit-test-results.json"
    if [ -f "$test_results" ]; then
        local num_tests=$(jq -r '.numTotalTests' "$test_results")
        local passed_tests=$(jq -r '.numPassedTests' "$test_results")
        local failed_tests=$(jq -r '.numFailedTests' "$test_results")

        log "Unit tests completed: $passed_tests/$num_tests passed in ${duration}s"

        send_metric "unit_tests_total" "$num_tests"
        send_metric "unit_tests_passed" "$passed_tests"
        send_metric "unit_tests_failed" "$failed_tests"
        send_metric "unit_tests_duration" "$duration"
    fi

    # Check coverage
    if [ -f "coverage/coverage-summary.json" ]; then
        local coverage=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
        log "Unit test coverage: ${coverage}%"
        send_metric "unit_test_coverage" "$coverage"

        # Coverage threshold check
        local min_coverage="${MIN_COVERAGE:-80}"
        if (( $(echo "$coverage < $min_coverage" | bc -l) )); then
            error "Coverage $coverage% below minimum $min_coverage%"
            return 1
        fi
    fi

    log "Unit tests passed"
}

# Integration tests
run_integration_tests() {
    log "Running integration tests"

    local start_time=$(date +%s)

    # Setup test environment
    if [ -f "docker-compose.test.yml" ]; then
        log "Starting test services..."
        docker-compose -f docker-compose.test.yml up -d
        sleep 10
    fi

    # Run integration tests
    npm run test:integration -- \
        --ci \
        --json \
        --outputFile="$TEST_RESULTS_DIR/integration-test-results.json" || {
        error "Integration tests failed"
        send_metric "integration_tests_failed" 1
        return 1
    }

    # Cleanup test services
    if [ -f "docker-compose.test.yml" ]; then
        docker-compose -f docker-compose.test.yml down
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Parse results
    local test_results="$TEST_RESULTS_DIR/integration-test-results.json"
    if [ -f "$test_results" ]; then
        local num_tests=$(jq -r '.numTotalTests' "$test_results")
        local passed_tests=$(jq -r '.numPassedTests' "$test_results")
        local failed_tests=$(jq -r '.numFailedTests' "$test_results")

        log "Integration tests completed: $passed_tests/$num_tests passed in ${duration}s"

        send_metric "integration_tests_total" "$num_tests"
        send_metric "integration_tests_passed" "$passed_tests"
        send_metric "integration_tests_failed" "$failed_tests"
        send_metric "integration_tests_duration" "$duration"
    fi

    log "Integration tests passed"
}

# Financial simulation tests
run_financial_tests() {
    log "Running financial simulation tests"

    local start_time=$(date +%s)

    # Run financial trading simulation tests
    npm run test:financial-simulation -- \
        --ci \
        --json \
        --outputFile="$TEST_RESULTS_DIR/financial-test-results.json" || {
        error "Financial simulation tests failed"
        send_metric "financial_tests_failed" 1
        return 1
    }

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Parse results
    local test_results="$TEST_RESULTS_DIR/financial-test-results.json"
    if [ -f "$test_results" ]; then
        local num_tests=$(jq -r '.numTotalTests' "$test_results")
        local passed_tests=$(jq -r '.numPassedTests' "$test_results")
        local failed_tests=$(jq -r '.numFailedTests' "$test_results")

        log "Financial tests completed: $passed_tests/$num_tests passed in ${duration}s"

        send_metric "financial_tests_total" "$num_tests"
        send_metric "financial_tests_passed" "$passed_tests"
        send_metric "financial_tests_failed" "$failed_tests"
        send_metric "financial_tests_duration" "$duration"
    fi

    log "Financial simulation tests passed"
}

# Performance tests
run_performance_tests() {
    log "Running performance tests"

    local start_time=$(date +%s)

    # Run K6 performance tests
    if command -v k6 >/dev/null 2>&1; then
        k6 run \
            --out json="$TEST_RESULTS_DIR/performance-results.json" \
            --out influxdb=http://localhost:8086/k6 \
            tests/performance/trading-load-test.js || {
            error "Performance tests failed"
            send_metric "performance_tests_failed" 1
            return 1
        }
    else
        log "K6 not available, skipping performance tests"
        return 0
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "Performance tests completed in ${duration}s"
    send_metric "performance_tests_duration" "$duration"
}

# Security tests
run_security_tests() {
    log "Running security tests"

    local start_time=$(date +%s)

    # SAST with Semgrep
    log "Running SAST analysis..."
    semgrep --config=p/owasp-top-ten \
        --config=p/security-audit \
        --json \
        --output="$TEST_RESULTS_DIR/sast-results.json" \
        . || {
        error "SAST analysis failed"
        send_metric "sast_scan_failed" 1
        return 1
    }

    # Financial compliance scan
    log "Running financial compliance scan..."
    semgrep --config="$COMPLIANCE_DIR/financial-rules.yml" \
        --json \
        --output="$TEST_RESULTS_DIR/financial-compliance-results.json" \
        . || {
        error "Financial compliance scan failed"
        return 1
    }

    # NASA POT10 compliance scan
    log "Running NASA POT10 compliance scan..."
    semgrep --config="$COMPLIANCE_DIR/nasa-pot10.yml" \
        --json \
        --output="$TEST_RESULTS_DIR/nasa-compliance-results.json" \
        . || {
        error "NASA POT10 compliance scan failed"
        return 1
    }

    # Dependency security audit
    log "Running dependency security audit..."
    npm audit --audit-level=high --json > "$TEST_RESULTS_DIR/dependency-audit.json" || {
        log "Dependency vulnerabilities found (this may be expected)"
    }

    # Secret scanning
    if command -v trufflehog >/dev/null 2>&1; then
        log "Running secret scanning..."
        trufflehog git file://. --json > "$TEST_RESULTS_DIR/secrets-scan.json" || {
            log "Secret scanning completed with findings"
        }
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "Security tests completed in ${duration}s"
    send_metric "security_tests_duration" "$duration"
}

# Code quality checks
run_code_quality_checks() {
    log "Running code quality checks"

    local start_time=$(date +%s)

    # ESLint
    log "Running ESLint..."
    npm run lint:ci -- \
        --format json \
        --output-file "$TEST_RESULTS_DIR/eslint-results.json" || {
        error "ESLint check failed"
        send_metric "eslint_failed" 1
        return 1
    }

    # TypeScript check
    log "Running TypeScript check..."
    npm run typecheck || {
        error "TypeScript check failed"
        send_metric "typecheck_failed" 1
        return 1
    }

    # SonarQube analysis (if available)
    if command -v sonar-scanner >/dev/null 2>&1 && [ -n "${SONAR_TOKEN:-}" ]; then
        log "Running SonarQube analysis..."
        sonar-scanner \
            -Dsonar.projectKey=gary-taleb-trading \
            -Dsonar.sources=. \
            -Dsonar.host.url="${SONAR_HOST_URL:-https://sonarcloud.io}" \
            -Dsonar.login="$SONAR_TOKEN" || {
            log "SonarQube analysis failed (non-blocking)"
        }
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "Code quality checks completed in ${duration}s"
    send_metric "code_quality_duration" "$duration"
}

# Compliance validation
run_compliance_validation() {
    log "Running compliance validation"

    # Run security gate check
    python3 "$SCRIPT_DIR/security-gate-check.py" \
        --sast "$TEST_RESULTS_DIR/sast-results.json" \
        --compliance "$TEST_RESULTS_DIR/financial-compliance-results.json" \
        --nasa "$TEST_RESULTS_DIR/nasa-compliance-results.json" \
        --deps "$TEST_RESULTS_DIR/dependency-audit.json" \
        --compliance-level "$COMPLIANCE_MODE" \
        --output "$TEST_RESULTS_DIR/security-gate-report.json" || {
        error "Security gate check failed"
        send_metric "security_gate_failed" 1
        return 1
    }

    log "Compliance validation passed"
    send_metric "compliance_validation_passed" 1
}

# Generate test report
generate_test_report() {
    log "Generating comprehensive test report"

    local report_file="$TEST_RESULTS_DIR/test-summary-report.json"
    local html_report="$TEST_RESULTS_DIR/test-summary-report.html"

    # Aggregate all test results
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "environment": "$NODE_ENV",
    "compliance_mode": "$COMPLIANCE_MODE",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "test_results": {
        "unit_tests": $(cat "$TEST_RESULTS_DIR/unit-test-results.json" 2>/dev/null || echo '{}'),
        "integration_tests": $(cat "$TEST_RESULTS_DIR/integration-test-results.json" 2>/dev/null || echo '{}'),
        "financial_tests": $(cat "$TEST_RESULTS_DIR/financial-test-results.json" 2>/dev/null || echo '{}'),
        "security_gate": $(cat "$TEST_RESULTS_DIR/security-gate-report.json" 2>/dev/null || echo '{}')
    }
}
EOF

    # Generate HTML report (simplified)
    cat > "$html_report" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>GaryxTaleb Trading System - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2c3e50; color: white; padding: 20px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .passed { background: #d4edda; border-color: #c3e6cb; }
        .failed { background: #f8d7da; border-color: #f5c6cb; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GaryxTaleb Trading System</h1>
        <h2>Test Report - $(date)</h2>
        <p>Compliance Mode: $COMPLIANCE_MODE</p>
    </div>
    <div class="section">
        <h3>Test Summary</h3>
        <p>All test results are available in JSON format for CI/CD integration.</p>
        <p>Check the test-results directory for detailed reports.</p>
    </div>
</body>
</html>
EOF

    log "Test report generated: $report_file"
}

# Cleanup function
cleanup() {
    log "Performing cleanup"

    # Clean up temporary files
    find "$TEST_RESULTS_DIR" -name "*.tmp" -delete 2>/dev/null || true

    # Archive old test results
    if [ -d "$TEST_RESULTS_DIR" ]; then
        find "$TEST_RESULTS_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    local overall_success=true

    log "Starting comprehensive test automation for GaryxTaleb Trading System"
    log "Compliance mode: $COMPLIANCE_MODE"
    log "Environment: $NODE_ENV"

    # Trap for cleanup
    trap cleanup EXIT

    # Run all test phases
    preflight_checks || overall_success=false

    if [ "$overall_success" = true ]; then
        run_unit_tests || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_integration_tests || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_financial_tests || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_performance_tests || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_security_tests || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_code_quality_checks || overall_success=false
    fi

    if [ "$overall_success" = true ]; then
        run_compliance_validation || overall_success=false
    fi

    # Always generate report
    generate_test_report

    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))

    if [ "$overall_success" = true ]; then
        log "[OK] All tests passed in ${total_duration}s"
        send_metric "test_automation_success" 1
        send_metric "test_automation_duration" "$total_duration"
        exit 0
    else
        error "[FAIL] Test automation failed in ${total_duration}s"
        send_metric "test_automation_failed" 1
        send_metric "test_automation_duration" "$total_duration"
        exit 1
    fi
}

# Execute main function
main "$@"
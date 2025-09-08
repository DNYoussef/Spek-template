# /qa:run

## Purpose
Execute comprehensive quality assurance suite including tests, type checking, linting, security scanning, coverage analysis, and connascence evaluation. Runs all checks in parallel for optimal performance and generates structured results.

## Usage
/qa:run

## Implementation

### 1. Input Validation
- Verify project has required npm scripts (test, typecheck, lint)
- Check for package.json and tsconfig.json configuration
- Ensure all QA tools are properly installed and configured
- Validate git repository state (for coverage diff analysis)

### 2. Parallel QA Execution
Run all quality checks concurrently for maximum efficiency:

```bash
# Parallel execution of all QA checks
npm test --silent --json > .claude/.artifacts/test_results.json &
npm run typecheck --json > .claude/.artifacts/typecheck_results.json &
npm run lint --format json --output-file .claude/.artifacts/lint_results.json &
npm run coverage --json > .claude/.artifacts/coverage_results.json &
npx semgrep --config=auto --json --output=.claude/.artifacts/semgrep.sarif . &
python analyzer/connascence_analyzer.py --output=.claude/.artifacts/connascence.json . &
wait
```

### 3. Result Processing
Process each QA output into standardized format:

#### Test Results Processing:
- Parse Jest/test runner JSON output
- Extract pass/fail counts, test duration
- Identify failed test cases with specific error messages
- Calculate test stability metrics

#### TypeScript Results Processing:
- Parse TypeScript compiler output
- Categorize errors by severity (error, warning)
- Group by file and error type
- Generate fix suggestions where possible

#### Linting Results Processing:
- Parse ESLint JSON output
- Separate errors from warnings
- Group by rule type and file
- Calculate technical debt metrics

#### Coverage Processing:
- Parse coverage JSON output
- Calculate changed-files coverage delta
- Identify uncovered critical paths
- Generate coverage trend analysis

#### Security Scanning:
- Parse Semgrep SARIF output
- Categorize by severity (HIGH, MEDIUM, LOW)
- Filter for changed files only (if in git repository)
- Cross-reference with known false positives

#### Connascence Analysis:
- Parse connascence analyzer output
- Calculate NASA POT10 compliance score
- Identify high-coupling code sections
- Generate structural safety metrics

### 4. Quality Gate Evaluation
Apply SPEK-AUGMENT CTQ thresholds:

```json
{
  "tests": {
    "threshold": "100% pass rate",
    "critical": true
  },
  "typecheck": {
    "threshold": "0 errors",
    "critical": true
  },
  "lint": {
    "threshold": "0 errors, warnings allowed",
    "critical": false
  },
  "security": {
    "threshold": "0 HIGH/CRITICAL findings",
    "critical": true
  },
  "coverage": {
    "threshold": "no regression on changed lines",
    "critical": true
  },
  "connascence": {
    "threshold": "≥90% NASA compliance, dup score ≥0.75",
    "critical": false
  }
}
```

### 5. Output Generation
Generate comprehensive qa.json:

```json
{
  "timestamp": "2024-09-08T12:00:00Z",
  "duration_seconds": 45,
  "overall_status": "pass|fail",
  
  "results": {
    "tests": {
      "status": "pass|fail",
      "total": 156,
      "passed": 156,
      "failed": 0,
      "duration_ms": 12000,
      "details": {
        "failed_tests": [],
        "slow_tests": [
          {"name": "integration.test.js", "duration": 2500}
        ]
      }
    },
    
    "typecheck": {
      "status": "pass|fail", 
      "errors": 0,
      "warnings": 2,
      "details": {
        "error_summary": [],
        "warning_summary": [
          {"file": "src/utils.ts", "line": 45, "message": "Unused variable"}
        ]
      }
    },
    
    "lint": {
      "status": "pass|fail",
      "errors": 0,
      "warnings": 3,
      "fixable": 2,
      "details": {
        "error_summary": [],
        "warning_summary": [
          {"rule": "no-console", "count": 2, "fixable": true}
        ]
      }
    },
    
    "security": {
      "status": "pass|fail",
      "high": 0,
      "medium": 1,
      "low": 3,
      "details": {
        "findings": [
          {
            "severity": "MEDIUM",
            "rule": "javascript.express.security.audit.xss.mustache-escape.mustache-escape",
            "file": "src/views.js",
            "line": 23,
            "message": "Potential XSS vulnerability"
          }
        ]
      }
    },
    
    "coverage": {
      "status": "pass|fail",
      "total_coverage": 87.5,
      "changed_files_coverage": 92.1,
      "coverage_delta": "+2.3%",
      "details": {
        "uncovered_lines": [
          {"file": "src/auth.js", "lines": [45, 46, 47]}
        ],
        "coverage_by_file": {
          "src/auth.js": 78.5,
          "src/utils.js": 95.2
        }
      }
    },
    
    "connascence": {
      "status": "pass|fail",
      "nasa_compliance": 94.2,
      "duplication_score": 0.82,
      "high_connascence": 2,
      "critical_connascence": 0,
      "details": {
        "high_coupling_files": [
          {"file": "src/database.js", "score": 3.2, "type": "CoI"}
        ],
        "improvement_suggestions": [
          "Consider extracting interface for database.js"
        ]
      }
    }
  },
  
  "summary": {
    "critical_failures": 0,
    "total_issues": 9,
    "fixable_issues": 5,
    "estimated_fix_time": "15 minutes",
    "risk_assessment": "low|medium|high"
  },
  
  "recommendations": [
    "Fix 2 linting warnings with --fix flag",
    "Address medium security finding in views.js",
    "Add tests for uncovered lines in auth.js"
  ]
}
```

## Integration Points

### Used by:
- `scripts/self_correct.sh` - For quality gate evaluation
- `flow/workflows/spec-to-pr.yaml` - Before PR creation
- `flow/workflows/ci-auto-repair.yaml` - For CI validation
- `/qa:gate` command - For final gate decision

### Produces:
- `.claude/.artifacts/qa.json` - Comprehensive QA results
- Individual tool outputs (test_results.json, semgrep.sarif, etc.)
- Performance and timing metrics
- Actionable recommendations

### Consumes:
- Project source code and configuration files
- npm scripts configuration (package.json)
- Git repository state (for coverage deltas)
- Previous QA results (for trend analysis)

## Examples

### Successful QA Run:
```json
{
  "timestamp": "2024-09-08T12:00:00Z", 
  "duration_seconds": 32,
  "overall_status": "pass",
  "results": {
    "tests": {"status": "pass", "total": 45, "passed": 45, "failed": 0},
    "typecheck": {"status": "pass", "errors": 0, "warnings": 0},
    "lint": {"status": "pass", "errors": 0, "warnings": 1},
    "security": {"status": "pass", "high": 0, "medium": 0, "low": 2},
    "coverage": {"status": "pass", "changed_files_coverage": 95.2},
    "connascence": {"status": "pass", "nasa_compliance": 96.1}
  },
  "summary": {"critical_failures": 0, "risk_assessment": "low"}
}
```

### Failed QA Run with Specific Issues:
```json
{
  "timestamp": "2024-09-08T12:05:00Z",
  "duration_seconds": 28, 
  "overall_status": "fail",
  "results": {
    "tests": {
      "status": "fail",
      "total": 45,
      "passed": 42, 
      "failed": 3,
      "details": {
        "failed_tests": [
          {"name": "auth.test.js - should handle invalid tokens", "error": "TypeError: Cannot read property 'split' of null"}
        ]
      }
    },
    "typecheck": {"status": "fail", "errors": 2},
    "security": {"status": "fail", "high": 1, "medium": 0}
  },
  "summary": {"critical_failures": 3, "risk_assessment": "high"}
}
```

## Error Handling

### Tool Execution Failures:
- Capture stderr and stdout from each tool
- Provide fallback results when tools crash
- Timeout protection (5 minute max per tool)
- Graceful degradation when tools are missing

### Configuration Issues:
- Validate npm scripts exist before execution
- Provide helpful error messages for missing config
- Offer to generate missing configuration files
- Guide users through tool setup process

### Resource Management:
- Monitor memory usage during parallel execution
- Implement CPU throttling for resource-constrained environments
- Clean up temporary files and artifacts
- Handle disk space limitations gracefully

## Performance Optimization

### Parallel Execution:
- All QA tools run simultaneously using background processes
- Intelligent scheduling based on historical execution times
- Resource pooling to prevent system overload
- Progressive result reporting as tools complete

### Caching Strategies:
- Cache node_modules analysis for repeated runs
- Reuse TypeScript compilation results when possible
- Incremental linting for unchanged files
- Smart coverage baseline caching

### Resource Limits:
- Maximum 5 minute total execution time
- Memory usage monitoring and throttling
- Temporary file cleanup after execution
- Graceful handling of resource exhaustion

This command provides the comprehensive quality foundation that enables reliable automated development workflows.
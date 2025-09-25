# /qa:gate

## Purpose
Aggregate quality assurance results into a final gate decision. Applies SPEK-AUGMENT CTQ (Critical-to-Quality) thresholds to determine if code changes meet quality standards for merge/deployment. Provides clear pass/fail decision with detailed reasoning.

## Usage
/qa:gate

## Implementation

### 1. Input Validation
- Verify qa.json exists from previous `/qa:run` execution
- Check for all required QA result sections
- Validate result timestamps (ensure fresh results within 10 minutes)
- Confirm all critical quality tools completed successfully

### 2. CTQ Threshold Application
Apply strict quality thresholds based on SPEK-AUGMENT standards:

#### Critical Gates (Must Pass):
```javascript
const CRITICAL_GATES = {
  tests: {
    threshold: result => result.failed === 0,
    message: "All tests must pass - no exceptions",
    critical: true
  },
  
  typecheck: {
    threshold: result => result.errors === 0, 
    message: "TypeScript compilation must be error-free",
    critical: true
  },
  
  security: {
    threshold: result => result.high === 0 && result.critical === 0,
    message: "Zero HIGH/CRITICAL security findings allowed",
    critical: true
  }
};
```

#### Quality Gates (Warn but Allow):
```javascript
const QUALITY_GATES = {
  lint: {
    threshold: result => result.errors === 0,
    message: "Linting errors should be fixed (warnings allowed)",
    critical: false
  },
  
  coverage: {
    threshold: result => {
      const delta = parseFloat(result.coverage_delta?.replace('%', ''));
      return delta >= 0; // No coverage regression
    },
    message: "Coverage must not decrease on changed lines",
    critical: false
  },
  
  connascence: {
    threshold: result => result.nasa_compliance >= 90 && result.duplication_score >= 0.75,
    message: "Maintain NASA POT10 compliance >=90% and duplication score >=0.75", 
    critical: false
  }
};
```

### 3. Gate Evaluation Logic

```javascript
function evaluateQualityGates(qaResults) {
  const gates = {};
  let criticalFailures = 0;
  let totalFailures = 0;
  
  // Evaluate critical gates
  for (const [gateName, config] of Object.entries(CRITICAL_GATES)) {
    const result = qaResults.results[gateName];
    const passed = config.threshold(result);
    
    gates[gateName] = {
      passed,
      critical: config.critical,
      message: passed ? `[OK] ${gateName} passed` : `[FAIL] ${config.message}`,
      details: result
    };
    
    if (!passed) {
      criticalFailures++;
      totalFailures++;
    }
  }
  
  // Evaluate quality gates  
  for (const [gateName, config] of Object.entries(QUALITY_GATES)) {
    const result = qaResults.results[gateName];
    const passed = config.threshold(result);
    
    gates[gateName] = {
      passed,
      critical: config.critical,
      message: passed ? `[OK] ${gateName} passed` : `[WARN] ${config.message}`,
      details: result
    };
    
    if (!passed) {
      totalFailures++;
    }
  }
  
  // Overall gate decision
  const overallPass = criticalFailures === 0;
  
  return {
    ok: overallPass,
    gates,
    summary: {
      total: Object.keys(gates).length,
      passed: Object.values(gates).filter(g => g.passed).length,
      failed: totalFailures,
      critical_failures: criticalFailures
    }
  };
}
```

### 4. Output Generation
Generate structured gate.json decision:

```json
{
  "ok": false,
  "timestamp": "2024-09-08T12:10:00Z",
  "decision_basis": "SPEK-AUGMENT CTQ thresholds",
  
  "gates": {
    "tests": {
      "passed": false,
      "critical": true,
      "message": "[FAIL] All tests must pass - no exceptions",
      "details": {
        "total": 45,
        "passed": 42,
        "failed": 3,
        "failed_tests": [
          "auth.test.js - should handle invalid tokens"
        ]
      }
    },
    
    "typecheck": {
      "passed": true,
      "critical": true, 
      "message": "[OK] typecheck passed",
      "details": {
        "errors": 0,
        "warnings": 2
      }
    },
    
    "lint": {
      "passed": false,
      "critical": false,
      "message": "[WARN] Linting errors should be fixed (warnings allowed)", 
      "details": {
        "errors": 2,
        "warnings": 5,
        "fixable": 4
      }
    },
    
    "security": {
      "passed": true,
      "critical": true,
      "message": "[OK] security passed",
      "details": {
        "high": 0,
        "medium": 1,
        "low": 3
      }
    },
    
    "coverage": {
      "passed": true,
      "critical": false, 
      "message": "[OK] coverage passed",
      "details": {
        "coverage_delta": "+2.1%",
        "changed_files_coverage": 94.5
      }
    },
    
    "connascence": {
      "passed": true,
      "critical": false,
      "message": "[OK] connascence passed", 
      "details": {
        "nasa_compliance": 92.3,
        "duplication_score": 0.81
      }
    }
  },
  
  "summary": {
    "total": 6,
    "passed": 4,
    "failed": 2, 
    "critical_failures": 1
  },
  
  "blocking_issues": [
    {
      "gate": "tests",
      "severity": "critical",
      "issue": "3 test failures prevent merge",
      "recommendation": "Fix failing tests before proceeding"
    }
  ],
  
  "recommendations": [
    "Address the 3 failing tests - this is blocking",
    "Fix 2 linting errors (4 are auto-fixable)",
    "Review 1 medium security finding (non-blocking)",
    "Overall quality score: 67% - improve test reliability"
  ],
  
  "next_steps": {
    "if_failed": "Run self-correction loop or manual fixes",
    "if_passed": "Proceed to PR creation",
    "estimated_fix_time": "20-30 minutes"
  }
}
```

### 5. Special Handling Rules

#### Changed Files Only Mode:
For efficiency, some gates can run in "changed files only" mode:
```javascript
function isChangedFilesMode() {
  return process.env.GATES_PROFILE === 'light' || 
         process.env.CI_CHANGED_FILES_ONLY === 'true';
}
```

#### Waiver System:
Support for temporary quality waivers:
```javascript
function checkWaivers(gateName, qaResults) {
  const waiverFile = '.claude/.artifacts/waivers.json';
  if (fs.existsSync(waiverFile)) {
    const waivers = JSON.parse(fs.readFileSync(waiverFile));
    return waivers.find(w => w.gate === gateName && new Date(w.expires) > new Date());
  }
  return null;
}
```

#### Risk-Based Gating:
Adjust thresholds based on change risk level:
```javascript
function applyRiskBasedGating(gates, riskLevel) {
  if (riskLevel === 'high') {
    // Stricter requirements for high-risk changes
    gates.coverage.threshold = result => result.changed_files_coverage >= 95;
    gates.connascence.critical = true; // Promote to critical
  }
  return gates;
}
```

## Integration Points

### Used by:
- `scripts/self_correct.sh` - For repair decision making
- `flow/workflows/spec-to-pr.yaml` - Before PR creation
- `flow/workflows/ci-auto-repair.yaml` - For CI gate decisions
- `flow/workflows/after-edit.yaml` - For post-edit validation

### Produces:
- `gate.json` - Final quality gate decision
- Blocking issue identification
- Actionable fix recommendations
- Estimated effort for remediation

### Consumes:
- `.claude/.artifacts/qa.json` - QA results from /qa:run
- `.claude/.artifacts/waivers.json` - Active quality waivers (optional)
- Environment variables (GATES_PROFILE, risk labels)
- Git repository state (for changed files analysis)

## Examples

### All Gates Pass:
```json
{
  "ok": true,
  "summary": {"total": 6, "passed": 6, "failed": 0, "critical_failures": 0},
  "recommendations": ["Code quality excellent - ready for deployment"],
  "next_steps": {"if_passed": "Proceed to PR creation"}
}
```

### Critical Failure - Tests:
```json
{
  "ok": false, 
  "summary": {"critical_failures": 1},
  "blocking_issues": [
    {"gate": "tests", "severity": "critical", "issue": "5 test failures"}
  ],
  "next_steps": {"estimated_fix_time": "15-20 minutes"}
}
```

### Quality Issues - Non-blocking:
```json
{
  "ok": true,
  "summary": {"passed": 4, "failed": 2, "critical_failures": 0},
  "recommendations": [
    "Consider fixing 3 linting warnings",
    "Address medium security finding when convenient"
  ]
}
```

## Error Handling

### Missing QA Results:
- Provide clear error if qa.json missing or incomplete
- Suggest running /qa:run first
- Offer to run QA automatically if requested

### Stale Results:
- Check timestamp freshness (within 10 minutes)
- Warn if results are outdated
- Automatically trigger fresh QA run if needed

### Configuration Errors:
- Validate CTQ threshold configurations
- Provide defaults for missing thresholds
- Clear error messages for invalid configurations

## Performance Requirements

- Gate evaluation completes within 5 seconds
- Memory usage under 50MB
- Deterministic results for identical inputs
- Comprehensive logging for audit trails

## Quality Standards

### Decision Consistency:
- Same inputs always produce same decisions
- Clear audit trail for all gate decisions
- Version controlled threshold configurations
- Transparent reasoning in output messages

### Actionability:
- Every failure includes specific fix recommendations
- Estimated effort provided for remediation
- Clear next steps regardless of pass/fail outcome
- Links to relevant documentation or examples

This command provides the critical decision-making capability that determines whether code changes meet quality standards for production deployment.
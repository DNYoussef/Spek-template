# /codex:micro-fix

## Purpose
Execute surgical, targeted fixes in Codex sandbox when test failures or quality gate violations are detected during automated edit loops. Codex performs precise diagnostic edits while Claude Code handles primary implementation. Optimized for rapid fix-and-verify cycles within bounded constraints.

## Usage
/codex:micro-fix '<failure_context>' '<target_issue>'

## Implementation

### 1. Failure Context Analysis

#### Test Failure Processing:
```javascript
function analyzeTestFailure(failureContext) {
  const patterns = {
    syntax_error: /SyntaxError|ParseError|unexpected token/i,
    type_error: /TypeError|Cannot read property|is not a function/i,
    assertion_failure: /AssertionError|expected.*but got|expect.*toBe/i,
    reference_error: /ReferenceError|is not defined|Cannot find name/i,
    import_error: /Cannot find module|Module.*has no exported member/i
  };
  
  const failureType = Object.keys(patterns).find(type => 
    patterns[type].test(failureContext)
  ) || 'unknown';
  
  return {
    type: failureType,
    urgency: getFixUrgency(failureType),
    surgical_target: extractSurgicalTarget(failureContext),
    expected_fix_scope: estimateSurgicalScope(failureType)
  };
}
```

#### Quality Gate Violation Processing:
```javascript
function analyzeQualityViolation(gateResults) {
  const violations = [];
  
  if (gateResults.lint?.errors > 0) {
    violations.push({
      type: 'lint_error',
      details: gateResults.lint.details.error_summary,
      fix_type: 'automated_lint_fix',
      surgical_scope: 'line_level'
    });
  }
  
  if (gateResults.typecheck?.errors > 0) {
    violations.push({
      type: 'type_error', 
      details: gateResults.typecheck.details.error_summary,
      fix_type: 'type_annotation_fix',
      surgical_scope: 'declaration_level'
    });
  }
  
  return {
    priority_violation: violations[0],
    fix_sequence: violations.sort((a, b) => getFixes Priority(a) - getFixPriority(b))
  };
}
```

### 2. Surgical Fix Execution in Codex Sandbox

#### Targeted Fix Configuration:
```bash
# Configure Codex CLI for surgical fix mode
export CODEX_MODE=surgical_fix
export CODEX_MAX_ITERATIONS=3
export CODEX_FIX_SCOPE=minimal
export CODEX_VERIFY_IMMEDIATELY=true

# Enable rapid test-fix cycle
export CODEX_FAST_FEEDBACK=true
export CODEX_INCREMENTAL_VERIFY=true
```

#### Precise Fix Execution:
```bash
# Execute surgical fix with immediate verification
codex fix --mode=surgical \
  --target="$TARGET_ISSUE" \
  --context="$FAILURE_CONTEXT" \
  --scope=minimal \
  --verify-immediately \
  --max-changes=5 \
  --output=json \
  2>&1 | tee .claude/.artifacts/codex_surgical_$(date +%s).log
```

#### Real-time Fix Monitoring:
```javascript
function monitorSurgicalFix(logFile, targetIssue) {
  const monitor = {
    attempts: 0,
    fixes_applied: [],
    verification_results: [],
    success: false
  };
  
  const tail = spawn('tail', ['-f', logFile]);
  
  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    for (const line of lines) {
      if (line.includes('CODEX_FIX_ATTEMPT:')) {
        monitor.attempts++;
        const attempt = JSON.parse(line.split('CODEX_FIX_ATTEMPT:')[1]);
        logFixAttempt(attempt);
      }
      
      if (line.includes('CODEX_FIX_APPLIED:')) {
        const fix = JSON.parse(line.split('CODEX_FIX_APPLIED:')[1]);
        monitor.fixes_applied.push(fix);
        updateFixProgress(fix);
      }
      
      if (line.includes('CODEX_VERIFY_RESULT:')) {
        const result = JSON.parse(line.split('CODEX_VERIFY_RESULT:')[1]);
        monitor.verification_results.push(result);
        
        if (result.success) {
          monitor.success = true;
          console.log(`[OK] Surgical fix successful: ${targetIssue}`);
        }
      }
      
      if (line.includes('CODEX_FIX_FAILED:')) {
        const failure = JSON.parse(line.split('CODEX_FIX_FAILED:')[1]);
        handleSurgicalFailure(failure, monitor);
      }
    }
  });
  
  return monitor;
}
```

### 3. Surgical Fix Strategies

#### Lint Error Surgical Fixes:
```javascript
const SURGICAL_LINT_FIXES = {
  'no-unused-vars': {
    strategy: 'remove_or_prefix',
    action: (variable, context) => {
      if (context.canRemove) {
        return `Remove unused variable: ${variable}`;
      }
      return `Prefix with underscore: _${variable}`;
    }
  },
  
  'missing-semicolon': {
    strategy: 'add_semicolon',
    action: (line, context) => `Add semicolon at end of line ${line}`
  },
  
  'no-console': {
    strategy: 'conditional_remove', 
    action: (location, context) => {
      return context.isDevelopment ? 
        `Wrap console.log in NODE_ENV check` :
        `Remove console.log statement`;
    }
  }
};
```

#### Type Error Surgical Fixes:
```javascript
const SURGICAL_TYPE_FIXES = {
  'missing_property': {
    strategy: 'add_optional_chaining',
    action: (property, object) => `Add optional chaining: ${object}?.${property}`
  },
  
  'type_mismatch': {
    strategy: 'add_type_assertion',
    action: (value, expectedType) => `Add type assertion: ${value} as ${expectedType}`
  },
  
  'missing_import': {
    strategy: 'add_import_statement',
    action: (identifier, modulePath) => `Add import: import { ${identifier} } from '${modulePath}'`
  }
};
```

#### Test Failure Surgical Fixes:
```javascript
const SURGICAL_TEST_FIXES = {
  'assertion_failure': {
    strategy: 'fix_expectation',
    action: (expected, actual, assertion) => {
      if (assertion.includes('toBe') && typeof expected !== typeof actual) {
        return `Change toBe to toEqual for deep comparison`;
      }
      return `Update expected value from ${expected} to ${actual}`;
    }
  },
  
  'mock_failure': {
    strategy: 'fix_mock_setup',
    action: (mockCall, expectedCall) => `Update mock expectation to match actual call pattern`
  },
  
  'async_timing': {
    strategy: 'add_await_or_done',
    action: (context) => context.hasPromise ? 'Add await keyword' : 'Add done() callback'
  }
};
```

### 4. Rapid Verification Loop

#### Immediate Test Execution:
```bash
# Run only the specific failing test
run_targeted_test() {
    local test_file="$1"
    local test_pattern="$2"
    
    if [[ -n "$test_pattern" ]]; then
        npm test -- "$test_file" -t "$test_pattern" --verbose
    else
        npm test -- "$test_file" --verbose
    fi
}

# Quick lint check on changed files only
run_focused_lint() {
    local changed_files=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(js|ts|jsx|tsx)$')
    
    if [[ -n "$changed_files" ]]; then
        npx eslint $changed_files --format json
    fi
}
```

#### Incremental Verification:
```javascript
async function incrementalVerification(fixes) {
  const results = {
    fixes_verified: [],
    remaining_issues: [],
    overall_success: false
  };
  
  for (const fix of fixes) {
    // Apply single fix
    await applySurgicalFix(fix);
    
    // Immediate verification
    const verifyResult = await runTargetedVerification(fix.target);
    
    results.fixes_verified.push({
      fix: fix.description,
      success: verifyResult.success,
      duration: verifyResult.duration
    });
    
    if (!verifyResult.success) {
      results.remaining_issues.push(verifyResult.issues);
      break; // Stop on first failure to avoid cascading issues
    }
  }
  
  results.overall_success = results.fixes_verified.every(f => f.success);
  return results;
}
```

### 5. Surgical Fix Results

Generate detailed surgical-fix.json:

```json
{
  "timestamp": "2024-09-08T13:15:00Z",
  "session_id": "codex-surgical-1709902500",
  "target_issue": "TypeError: Cannot read property 'split' of null in auth.js:45",
  "failure_context": "Test failure in auth.test.js - token validation",
  
  "surgical_analysis": {
    "issue_type": "type_error",
    "root_cause": "Missing null check before string method call",
    "surgical_target": "src/auth.js:45",
    "fix_complexity": "minimal",
    "estimated_fix_lines": 2
  },
  
  "fix_execution": {
    "attempts": 1,
    "successful": true,
    "duration_seconds": 8,
    "changes_made": [
      {
        "file": "src/auth.js",
        "line": 45,
        "before": "const parts = token.split('.');",
        "after": "const parts = token?.split('.') || [];",
        "fix_type": "optional_chaining_with_fallback"
      }
    ]
  },
  
  "verification": {
    "immediate_test": {
      "status": "pass",
      "test_file": "tests/auth.test.js",
      "test_pattern": "token validation",
      "duration": "0.8s"
    },
    
    "focused_lint": {
      "status": "pass",
      "files_checked": ["src/auth.js"],
      "new_issues": 0
    },
    
    "type_check": {
      "status": "pass",
      "files_affected": 1,
      "type_errors": 0
    }
  },
  
  "fix_confidence": {
    "surgical_precision": "high",
    "side_effect_risk": "none",
    "rollback_needed": false,
    "additional_tests_needed": false
  },
  
  "learning_data": {
    "pattern": "null_pointer_prevention",
    "fix_strategy": "optional_chaining",
    "success_factors": ["minimal_change", "immediate_verification"],
    "applicable_contexts": ["token_processing", "string_manipulation"]
  }
}
```

### 6. Integration with Edit Loops

#### Post-Edit Fix Integration:
```javascript
async function integrateWithEditLoop(originalEdit, testResults) {
  if (testResults.status === 'failed') {
    console.log('[TOOL] Tests failed after edit - initiating surgical fix...');
    
    const surgicalResult = await executeSurgicalFix({
      failure_context: testResults.failure_details,
      target_issue: testResults.primary_failure,
      edit_context: originalEdit
    });
    
    if (surgicalResult.fix_confidence.surgical_precision === 'high') {
      return {
        status: 'recovered',
        original_edit: originalEdit,
        surgical_fixes: surgicalResult.fix_execution.changes_made,
        total_changes: originalEdit.changes.concat(surgicalResult.fix_execution.changes_made)
      };
    }
  }
  
  return { status: 'escalation_needed', reason: 'surgical_fix_failed' };
}
```

#### Failure Escalation Logic:
```javascript
function determineSurgicalEscalation(surgicalAttempts, remainingIssues) {
  if (surgicalAttempts >= 3) {
    return {
      escalate_to: 'fix:planned',
      reason: 'Multiple surgical attempts failed - needs broader approach'
    };
  }
  
  if (remainingIssues.some(issue => issue.complexity === 'architectural')) {
    return {
      escalate_to: 'gemini:impact',
      reason: 'Issue requires architectural analysis'
    };
  }
  
  return {
    escalate_to: 'claude_code_manual',
    reason: 'Complex fix needs human-guided implementation'
  };
}
```

### 7. Learning and Pattern Recognition

#### Fix Pattern Recording:
```javascript
function recordSurgicalSuccess(fix, context) {
  const pattern = {
    issue_type: fix.surgical_analysis.issue_type,
    fix_strategy: fix.fix_execution.changes_made[0].fix_type,
    context: {
      file_type: getFileType(fix.surgical_target),
      framework: detectFramework(context),
      test_type: classifyTestType(context.test_failure)
    },
    success_metrics: {
      attempts_needed: fix.fix_execution.attempts,
      duration: fix.fix_execution.duration_seconds,
      precision: fix.fix_confidence.surgical_precision
    }
  };
  
  updateNeuralPatterns('surgical_fixes', pattern);
  cacheSuccessfulFix(pattern);
}
```

## Integration Points

### Used by:
- `flow/workflows/after-edit.yaml` - For immediate post-edit fix attempts
- `scripts/self_correct.sh` - For rapid fix-and-verify cycles
- `/codex:micro` command - When initial edit fails verification
- CF v2 Alpha - For pattern learning and fix prediction

### Produces:
- `surgical-fix.json` - Detailed fix execution results
- Updated neural pattern data for fix strategies
- Immediate verification feedback
- Escalation recommendations when fixes fail

### Consumes:
- Test failure contexts and error messages
- Quality gate violation details
- Code change history for targeted analysis
- Historical fix success patterns

## Examples

### Successful Surgical Fix:
```json
{
  "fix_execution": {"successful": true, "attempts": 1, "duration_seconds": 5},
  "verification": {"immediate_test": {"status": "pass"}},
  "fix_confidence": {"surgical_precision": "high", "side_effect_risk": "none"}
}
```

### Multiple Fix Attempt:
```json
{
  "fix_execution": {"attempts": 2, "successful": true},
  "fixes_applied": [
    {"type": "null_check", "success": false},
    {"type": "optional_chaining", "success": true}
  ]
}
```

### Escalation Required:
```json
{
  "fix_execution": {"successful": false, "attempts": 3},
  "escalation": {
    "recommended_approach": "fix:planned",
    "reason": "Issue complexity exceeds surgical fix capabilities"
  }
}
```

## Error Handling

### Surgical Fix Failures:
- Automatic retry with alternative fix strategies
- Pattern matching against historical successful fixes
- Graceful escalation to broader fix approaches
- Preservation of original working state

### Verification Failures:
- Rollback to pre-fix state
- Analysis of why surgical approach failed
- Recommendation for appropriate escalation path
- Learning integration for pattern improvement

## Performance Requirements

- Complete surgical fix within 30 seconds
- Immediate verification feedback (under 10 seconds)
- Minimal disruption to development workflow
- Memory usage under 50MB during fix execution

This command provides Codex's specialized surgical fix capabilities, enabling rapid recovery from test failures and quality gate violations while maintaining the broader implementation role for Claude Code.
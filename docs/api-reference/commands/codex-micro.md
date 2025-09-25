# /codex:micro

## Purpose
Execute bounded micro-edits in sandboxed environment with comprehensive testing and verification. Leverages Codex CLI's sandboxing capabilities for safe, constrained changes with automatic quality gates. Ideal for small, isolated modifications with immediate feedback.

## Usage
/codex:micro '<change_description>'

## Implementation

### 1. Pre-execution Safety Checks

#### Working Tree Validation:
```bash
# Ensure clean working tree before sandbox creation
if [[ -n $(git status --porcelain) ]]; then
    echo "Working tree not clean. Stashing changes..."
    git stash push -u -m "Pre-codex backup $(date)"
fi

# Create sandbox branch
SANDBOX_BRANCH="codex/micro-$(date +%s)"
git checkout -b "$SANDBOX_BRANCH"
echo "Created sandbox branch: $SANDBOX_BRANCH"
```

#### Budget Constraint Verification:
```javascript
const MICRO_CONSTRAINTS = {
  MAX_LOC: 25,           // Maximum lines of code to change
  MAX_FILES: 2,          // Maximum files to modify
  MAX_FUNCTIONS: 3,      // Maximum functions to touch
  MAX_COMPLEXITY: 5      // Cyclomatic complexity limit
};

function validateConstraints(changeDescription) {
  // Parse change description for scope indicators
  const scopeIndicators = {
    file_count: extractFileCount(changeDescription),
    estimated_loc: estimateLOC(changeDescription),
    complexity_markers: findComplexityMarkers(changeDescription)
  };
  
  return {
    within_budget: scopeIndicators.file_count <= MICRO_CONSTRAINTS.MAX_FILES &&
                   scopeIndicators.estimated_loc <= MICRO_CONSTRAINTS.MAX_LOC,
    warnings: generateWarnings(scopeIndicators)
  };
}
```

### 2. Codex CLI Execution in Sandbox

#### Sandbox Configuration:
```bash
# Configure Codex CLI for micro-edit mode
export CODEX_MODE=micro
export CODEX_MAX_FILES=2
export CODEX_MAX_LOC=25
export CODEX_SANDBOX_BRANCH="$SANDBOX_BRANCH"
export CODEX_VERIFY_GATES=true

# Enable comprehensive testing
export CODEX_RUN_TESTS=true
export CODEX_RUN_LINT=true
export CODEX_RUN_TYPECHECK=true
```

#### Execution with Real-time Monitoring:
```bash
# Execute change with streaming output
codex exec --mode=micro --interactive=false --output=json \
  --constraint="max-loc=25" \
  --constraint="max-files=2" \
  --verify="test,lint,typecheck" \
  --sandbox="$SANDBOX_BRANCH" \
  --description="$CHANGE_DESCRIPTION" \
  2>&1 | tee .claude/.artifacts/codex_micro_$(date +%s).log
```

#### Real-time Progress Monitoring:
```javascript
function monitorCodexExecution(logFile) {
  const tail = spawn('tail', ['-f', logFile]);
  
  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    for (const line of lines) {
      if (line.includes('CODEX_PROGRESS:')) {
        const progress = JSON.parse(line.split('CODEX_PROGRESS:')[1]);
        updateProgressIndicator(progress);
      }
      
      if (line.includes('CODEX_ERROR:')) {
        const error = JSON.parse(line.split('CODEX_ERROR:')[1]);
        handleCodexError(error);
      }
      
      if (line.includes('CODEX_GATE_RESULT:')) {
        const gateResult = JSON.parse(line.split('CODEX_GATE_RESULT:')[1]);
        processGateResult(gateResult);
      }
    }
  });
}
```

### 3. Comprehensive Quality Gates

#### Built-in Test Execution:
```bash
# Codex CLI runs these automatically in sandbox
echo "Running test suite..."
npm test --silent --json > .claude/.artifacts/test_results_micro.json

echo "Running TypeScript check..."
npm run typecheck --json > .claude/.artifacts/typecheck_results_micro.json  

echo "Running linter..."
npm run lint --format json --output-file .claude/.artifacts/lint_results_micro.json

echo "Generating coverage report..."
npm run coverage --json > .claude/.artifacts/coverage_results_micro.json
```

#### Differential Analysis:
```javascript
function analyzeMicroChanges() {
  const beforeStats = {
    loc: countLinesOfCode('HEAD~1'),
    files: getModifiedFiles('HEAD~1'),
    complexity: calculateComplexity('HEAD~1')
  };
  
  const afterStats = {
    loc: countLinesOfCode('HEAD'),
    files: getModifiedFiles('HEAD'),
    complexity: calculateComplexity('HEAD')
  };
  
  return {
    delta_loc: afterStats.loc - beforeStats.loc,
    delta_files: afterStats.files.length - beforeStats.files.length,
    delta_complexity: afterStats.complexity - beforeStats.complexity,
    within_constraints: validateDelta(afterStats, beforeStats)
  };
}
```

### 4. Structured Result Generation

Generate comprehensive micro.json:

```json
{
  "timestamp": "2024-09-08T12:45:00Z",
  "session_id": "codex-micro-1709901900",
  "sandbox_branch": "codex/micro-1709901900",
  "change_description": "Add null check to user email validation",
  
  "execution": {
    "status": "success|failed|partial",
    "duration_seconds": 45,
    "codex_version": "2.1.3",
    "sandbox_mode": true,
    "constraints_applied": {
      "max_loc": 25,
      "max_files": 2,
      "max_functions": 3
    }
  },
  
  "changes": {
    "files_modified": [
      {
        "file": "src/utils/validation.js",
        "lines_added": 3,
        "lines_removed": 1,
        "functions_modified": ["validateEmail"],
        "change_type": "safety_improvement"
      }
    ],
    "total_loc_delta": 2,
    "total_files": 1,
    "complexity_delta": 0,
    "within_budget": true
  },
  
  "quality_gates": {
    "tests": {
      "status": "pass",
      "total": 156,
      "passed": 156,
      "failed": 0,
      "execution_time": "12.3s",
      "coverage_delta": "+0.2%"
    },
    
    "typecheck": {
      "status": "pass", 
      "errors": 0,
      "warnings": 0,
      "files_checked": 87
    },
    
    "lint": {
      "status": "pass",
      "errors": 0,
      "warnings": 1,
      "fixable": 1,
      "rules_violated": []
    },
    
    "security_scan": {
      "status": "pass",
      "new_findings": 0,
      "resolved_findings": 1,
      "risk_level": "low"
    }
  },
  
  "verification": {
    "all_gates_passed": true,
    "breaking_changes": false,
    "rollback_available": true,
    "merge_ready": true
  },
  
  "code_analysis": {
    "change_impact": "isolated",
    "affected_functions": ["validateEmail"],
    "test_coverage": {
      "new_lines_covered": true,
      "coverage_percentage": 94.2
    },
    "performance_impact": "none",
    "security_improvement": true
  },
  
  "recommendations": {
    "merge_confidence": "high",
    "additional_testing": [],
    "follow_up_actions": ["Update validation documentation"],
    "deployment_risk": "none"
  }
}
```

### 5. Error Handling and Recovery

#### Constraint Violation Handling:
```javascript
function handleConstraintViolation(violation) {
  const actions = {
    max_loc_exceeded: () => {
      return {
        action: 'split_task',
        message: 'Change exceeds 25 LOC limit. Consider using /fix:planned for multi-step approach.',
        suggested_split: suggestTaskSplit(violation.details)
      };
    },
    
    max_files_exceeded: () => {
      return {
        action: 'scope_reduction',
        message: 'Change affects >2 files. Reduce scope or use /gemini:impact for analysis.',
        suggested_files: prioritizeFiles(violation.affected_files)
      };
    },
    
    test_failures: () => {
      return {
        action: 'auto_fix',
        message: 'Test failures detected. Attempting automatic fix...',
        retry_strategy: 'focused_fix'
      };
    }
  };
  
  return actions[violation.type]?.() || defaultRecoveryAction(violation);
}
```

#### Sandbox Cleanup and Recovery:
```bash
# Automatic cleanup on success
function cleanup_success() {
    echo "Micro-edit successful. Cleaning up..."
    
    # Merge changes to original branch
    ORIGINAL_BRANCH=$(git branch --show-current | sed 's/codex\/micro-.*//')
    git checkout "$ORIGINAL_BRANCH"
    git merge --no-ff "$SANDBOX_BRANCH" -m "codex:micro - $CHANGE_DESCRIPTION"
    
    # Clean up sandbox
    git branch -d "$SANDBOX_BRANCH"
    
    echo "Changes merged and sandbox cleaned up."
}

# Recovery on failure
function cleanup_failure() {
    echo "Micro-edit failed. Preserving sandbox for analysis..."
    
    # Return to original branch
    ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD | sed 's/codex\/micro-.*//')
    git checkout "$ORIGINAL_BRANCH" 2>/dev/null || git checkout main
    
    # Preserve sandbox branch for debugging
    echo "Sandbox branch '$SANDBOX_BRANCH' preserved for debugging"
    echo "To clean up manually: git branch -D '$SANDBOX_BRANCH'"
    
    # Generate failure report
    generate_failure_report "$SANDBOX_BRANCH"
}
```

### 6. Integration with Self-Correction Loop

#### Automatic Retry Logic:
```javascript
async function executeMicroWithRetry(changeDescription, maxRetries = 2) {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    try {
      const result = await executeCodexMicro(changeDescription);
      
      if (result.verification.all_gates_passed) {
        return {
          success: true,
          result,
          attempts: attempt + 1
        };
      }
      
      // Analyze failure and refine approach
      const refinedDescription = refineBasedOnFailure(changeDescription, result);
      changeDescription = refinedDescription;
      
    } catch (error) {
      lastError = error;
      console.warn(`Micro-edit attempt ${attempt + 1} failed: ${error.message}`);
    }
    
    attempt++;
  }
  
  return {
    success: false,
    error: lastError,
    attempts: attempt,
    escalation_recommended: 'fix:planned'
  };
}
```

#### Failure Pattern Learning:
```javascript
function recordFailurePattern(changeDescription, failureReason, context) {
  const pattern = {
    timestamp: new Date().toISOString(),
    change_type: classifyChangeType(changeDescription),
    failure_category: categorizeFailure(failureReason),
    context: {
      file_types: context.fileTypes,
      project_type: context.projectType,
      test_framework: context.testFramework
    },
    lessons: extractLessons(failureReason)
  };
  
  appendToFailureLog(pattern);
  updateNeuralPatterns(pattern);
}
```

## Integration Points

### Used by:
- `scripts/self_correct.sh` - For small fix attempts
- `flow/workflows/after-edit.yaml` - For immediate fix routing
- `/qa:analyze` command - When complexity is classified as "small"
- CF v2 Alpha - For pattern learning and success prediction

### Produces:
- `micro.json` - Detailed execution results
- Sandbox branches for failed attempts
- Quality gate verification results
- Failure patterns for learning

### Consumes:
- Change descriptions with bounded scope
- Current codebase state
- Test suite and quality gate configurations
- Historical failure patterns

## Examples

### Successful Micro-Edit:
```json
{
  "execution": {"status": "success", "duration_seconds": 32},
  "changes": {"total_loc_delta": 8, "total_files": 1, "within_budget": true},
  "quality_gates": {"all_passed": true},
  "recommendations": {"merge_confidence": "high", "deployment_risk": "none"}
}
```

### Constraint Violation:
```json
{
  "execution": {"status": "failed", "constraint_violated": "max_loc"},
  "recommendations": {
    "escalate_to": "fix:planned",
    "reason": "Change requires 35 LOC across 3 files - exceeds micro constraints"
  }
}
```

### Partial Success with Warnings:
```json
{
  "execution": {"status": "partial"},
  "quality_gates": {"tests": {"status": "pass"}, "lint": {"status": "warn"}},
  "recommendations": {"additional_testing": ["Add edge case tests"], "merge_confidence": "medium"}
}
```

## Error Handling

### Codex CLI Failures:
- Automatic retry with refined prompts
- Fallback to manual edit suggestions
- Clear error categorization and reporting
- Integration with broader fix strategies

### Sandbox Issues:
- Automatic cleanup on both success and failure
- Preservation of failed attempts for debugging
- Git state recovery to ensure clean working tree
- Resource leak prevention

### Quality Gate Failures:
- Immediate feedback with specific fix suggestions
- Automatic attempt at focused fixes
- Escalation paths to more comprehensive strategies
- Learning integration for pattern improvement

## Performance Requirements

- Complete micro-edit within 2 minutes
- Sandbox creation and cleanup under 10 seconds
- Real-time progress feedback
- Memory usage under 100MB during execution

This command provides the core capability for safe, bounded code changes with comprehensive testing, leveraging Codex CLI's sandboxing for immediate feedback and quality assurance.
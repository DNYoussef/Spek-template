# /fix:planned

## Purpose
Execute systematic multi-file fixes with bounded checkpoints and rollback safety. Handles complex issues that exceed micro-edit constraints through planned approach with incremental validation. Provides structured breakdown of larger fixes while maintaining quality gates at each step.

## Usage
/fix:planned '<issue_description>' [checkpoint_size=25]

## Implementation

### 1. Issue Analysis and Planning

#### Multi-File Impact Assessment:
```javascript
function analyzeMultiFileIssue(issueDescription, codebase) {
  const analysis = {
    affected_files: identifyAffectedFiles(issueDescription, codebase),
    dependency_chain: buildDependencyChain(issueDescription),
    change_complexity: assessChangeComplexity(issueDescription),
    risk_factors: identifyRiskFactors(issueDescription)
  };
  
  return {
    scope: analysis.affected_files.length,
    estimated_loc: estimateTotalLOC(analysis),
    checkpoint_strategy: determineCheckpointStrategy(analysis),
    rollback_points: identifyRollbackPoints(analysis)
  };
}
```

#### Checkpoint Planning:
```javascript
function createCheckpointPlan(analysis, maxCheckpointSize = 25) {
  const checkpoints = [];
  let currentCheckpoint = {
    id: 1,
    files: [],
    estimated_loc: 0,
    dependencies: []
  };
  
  // Group files by dependency order and LOC constraints
  for (const file of analysis.dependency_chain) {
    if (currentCheckpoint.estimated_loc + file.estimated_loc > maxCheckpointSize) {
      checkpoints.push(currentCheckpoint);
      currentCheckpoint = {
        id: checkpoints.length + 1,
        files: [file],
        estimated_loc: file.estimated_loc,
        dependencies: file.dependencies
      };
    } else {
      currentCheckpoint.files.push(file);
      currentCheckpoint.estimated_loc += file.estimated_loc;
    }
  }
  
  if (currentCheckpoint.files.length > 0) {
    checkpoints.push(currentCheckpoint);
  }
  
  return checkpoints;
}
```

### 2. Systematic Execution with Checkpoints

#### Checkpoint Execution Framework:
```javascript
async function executeCheckpointPlan(checkpoints, issueDescription) {
  const execution = {
    checkpoints_completed: [],
    current_checkpoint: null,
    rollback_points: [],
    overall_status: 'in_progress'
  };
  
  for (const [index, checkpoint] of checkpoints.entries()) {
    console.log(`🎯 Executing checkpoint ${checkpoint.id}/${checkpoints.length}`);
    execution.current_checkpoint = checkpoint;
    
    // Create rollback point before each checkpoint
    const rollbackPoint = await createRollbackPoint(`checkpoint-${checkpoint.id}`);
    execution.rollback_points.push(rollbackPoint);
    
    try {
      const result = await executeCheckpoint(checkpoint, issueDescription);
      
      if (result.success) {
        execution.checkpoints_completed.push({
          ...checkpoint,
          execution_result: result,
          completed_at: new Date().toISOString()
        });
        
        console.log(`✅ Checkpoint ${checkpoint.id} completed successfully`);
      } else {
        console.error(`❌ Checkpoint ${checkpoint.id} failed: ${result.error}`);
        await rollbackToPoint(rollbackPoint);
        
        execution.overall_status = 'failed';
        execution.failure_checkpoint = checkpoint.id;
        execution.failure_reason = result.error;
        break;
      }
      
    } catch (error) {
      console.error(`💥 Checkpoint ${checkpoint.id} threw error: ${error.message}`);
      await rollbackToPoint(rollbackPoint);
      
      execution.overall_status = 'error';
      execution.failure_checkpoint = checkpoint.id;
      execution.error = error.message;
      break;
    }
  }
  
  if (execution.checkpoints_completed.length === checkpoints.length) {
    execution.overall_status = 'success';
    console.log(`🎉 All ${checkpoints.length} checkpoints completed successfully`);
  }
  
  return execution;
}
```

#### Individual Checkpoint Execution:
```javascript
async function executeCheckpoint(checkpoint, issueContext) {
  const changes = [];
  
  // Process each file in the checkpoint
  for (const file of checkpoint.files) {
    try {
      const fileChanges = await planFileChanges(file, issueContext, checkpoint);
      
      // Apply changes with validation
      const applyResult = await applyChangesWithValidation(file.path, fileChanges);
      
      if (!applyResult.success) {
        return {
          success: false,
          error: `Failed to apply changes to ${file.path}: ${applyResult.error}`,
          partial_changes: changes
        };
      }
      
      changes.push({
        file: file.path,
        changes: fileChanges,
        lines_modified: applyResult.lines_modified
      });
      
    } catch (error) {
      return {
        success: false,
        error: `Error processing ${file.path}: ${error.message}`,
        partial_changes: changes
      };
    }
  }
  
  // Run checkpoint verification
  const verification = await runCheckpointVerification(checkpoint, changes);
  
  return {
    success: verification.passed,
    changes,
    verification,
    checkpoint_metrics: {
      files_modified: changes.length,
      total_loc_changed: changes.reduce((sum, c) => sum + c.lines_modified, 0),
      duration_seconds: verification.duration
    }
  };
}
```

### 3. Quality Gates at Each Checkpoint

#### Incremental Verification:
```bash
# Run focused tests for checkpoint validation
run_checkpoint_tests() {
    local checkpoint_files="$1"
    local test_pattern="$2"
    
    echo "Running tests for checkpoint files: $checkpoint_files"
    
    # Run tests related to changed files
    npm test -- --findRelatedTests $checkpoint_files --verbose
    
    # Run specific test pattern if provided
    if [[ -n "$test_pattern" ]]; then
        npm test -- -t "$test_pattern" --verbose
    fi
}

# Quick quality check for checkpoint
run_checkpoint_quality_check() {
    local changed_files="$1"
    
    # TypeScript check on affected files
    npx tsc --noEmit $(echo $changed_files | tr ' ' '\n' | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
    
    # Lint check on changed files
    npx eslint $changed_files --format compact
    
    # Security scan on changed files (if available)
    if command -v semgrep >/dev/null 2>&1; then
        semgrep --config=auto --json $changed_files
    fi
}
```

#### Progressive Quality Validation:
```javascript
async function runCheckpointVerification(checkpoint, changes) {
  const verification = {
    started_at: new Date().toISOString(),
    tests: { status: 'pending' },
    typecheck: { status: 'pending' },
    lint: { status: 'pending' },
    security: { status: 'pending' },
    overall: { passed: false }
  };
  
  try {
    // Run tests for affected files
    const testResult = await runRelatedTests(changes.map(c => c.file));
    verification.tests = {
      status: testResult.exitCode === 0 ? 'pass' : 'fail',
      duration: testResult.duration,
      details: testResult.summary
    };
    
    if (verification.tests.status === 'fail') {
      verification.overall.passed = false;
      verification.overall.failure_reason = 'Test failures in checkpoint';
      return verification;
    }
    
    // TypeScript verification
    const typecheckResult = await runTypecheck(changes.map(c => c.file));
    verification.typecheck = {
      status: typecheckResult.errors === 0 ? 'pass' : 'fail',
      errors: typecheckResult.errors,
      warnings: typecheckResult.warnings
    };
    
    // Lint verification
    const lintResult = await runLint(changes.map(c => c.file));
    verification.lint = {
      status: lintResult.errorCount === 0 ? 'pass' : 'fail',
      errors: lintResult.errorCount,
      warnings: lintResult.warningCount
    };
    
    // Security scan if available
    try {
      const securityResult = await runSecurityScan(changes.map(c => c.file));
      verification.security = {
        status: securityResult.high === 0 ? 'pass' : 'fail',
        findings: securityResult.findings
      };
    } catch (error) {
      verification.security = { status: 'skipped', reason: 'Security scan not available' };
    }
    
    // Overall assessment
    verification.overall.passed = 
      verification.tests.status === 'pass' &&
      verification.typecheck.status === 'pass' &&
      verification.lint.status === 'pass' &&
      (verification.security.status === 'pass' || verification.security.status === 'skipped');
    
  } catch (error) {
    verification.overall = {
      passed: false,
      error: error.message
    };
  }
  
  verification.completed_at = new Date().toISOString();
  verification.duration = (new Date(verification.completed_at) - new Date(verification.started_at)) / 1000;
  
  return verification;
}
```

### 4. Rollback and Recovery

#### Rollback Point Management:
```bash
# Create rollback point before checkpoint
create_rollback_point() {
    local checkpoint_id="$1"
    local rollback_branch="rollback/checkpoint-${checkpoint_id}-$(date +%s)"
    
    # Create rollback branch
    git branch "$rollback_branch"
    
    # Store rollback info
    echo "{
        \"checkpoint_id\": \"$checkpoint_id\",
        \"branch\": \"$rollback_branch\",
        \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"working_tree_hash\": \"$(git rev-parse HEAD)\",
        \"stash_ref\": \"$(git stash create || echo 'none')\"
    }" > ".claude/.artifacts/rollback-$checkpoint_id.json"
    
    echo "$rollback_branch"
}

# Rollback to specific point
rollback_to_point() {
    local rollback_file="$1"
    
    if [[ ! -f "$rollback_file" ]]; then
        echo "Error: Rollback file not found: $rollback_file"
        return 1
    fi
    
    local rollback_info=$(cat "$rollback_file")
    local rollback_branch=$(echo "$rollback_info" | jq -r '.branch')
    local stash_ref=$(echo "$rollback_info" | jq -r '.stash_ref')
    
    echo "Rolling back to: $rollback_branch"
    
    # Reset to rollback point
    git reset --hard "$rollback_branch"
    
    # Restore stash if it exists
    if [[ "$stash_ref" != "none" ]]; then
        git stash apply "$stash_ref" 2>/dev/null || echo "No stash to restore"
    fi
    
    echo "Rollback completed"
}
```

### 5. Comprehensive Results Output

Generate detailed planned-fix.json:

```json
{
  "timestamp": "2024-09-08T13:30:00Z",
  "session_id": "fix-planned-1709903000",
  "issue_description": "Update authentication system to use JWT tokens across multiple components",
  
  "planning": {
    "total_checkpoints": 4,
    "estimated_total_loc": 85,
    "affected_files": 6,
    "complexity_assessment": "high",
    "approach": "incremental_with_rollback"
  },
  
  "checkpoints": [
    {
      "id": 1,
      "name": "Update core auth utilities",
      "files": ["src/utils/auth.js"],
      "estimated_loc": 25,
      "status": "completed",
      "execution_result": {
        "success": true,
        "lines_modified": 23,
        "verification": {
          "tests": {"status": "pass"},
          "typecheck": {"status": "pass"},
          "lint": {"status": "pass"}
        }
      },
      "duration_seconds": 45
    },
    {
      "id": 2,
      "name": "Update middleware components",
      "files": ["src/middleware/auth.js", "src/middleware/jwt.js"],
      "estimated_loc": 30,
      "status": "completed",
      "execution_result": {
        "success": true,
        "lines_modified": 28,
        "verification": {
          "tests": {"status": "pass"},
          "typecheck": {"status": "pass"}
        }
      },
      "duration_seconds": 52
    },
    {
      "id": 3,
      "name": "Update API routes",
      "files": ["src/routes/auth.js", "src/routes/api.js"],
      "estimated_loc": 20,
      "status": "completed",
      "execution_result": {
        "success": true,
        "lines_modified": 19,
        "verification": {"all_gates": "pass"}
      },
      "duration_seconds": 38
    },
    {
      "id": 4,
      "name": "Update frontend integration",
      "files": ["src/components/LoginForm.jsx"],
      "estimated_loc": 10,
      "status": "completed",
      "execution_result": {
        "success": true,
        "lines_modified": 12,
        "verification": {"all_gates": "pass"}
      },
      "duration_seconds": 29
    }
  ],
  
  "execution_summary": {
    "overall_status": "success",
    "checkpoints_completed": 4,
    "checkpoints_failed": 0,
    "total_duration_seconds": 164,
    "total_loc_modified": 82,
    "rollbacks_required": 0
  },
  
  "quality_validation": {
    "final_test_run": {
      "status": "pass",
      "total_tests": 47,
      "passed": 47,
      "failed": 0,
      "duration": "8.2s"
    },
    
    "comprehensive_typecheck": {
      "status": "pass",
      "errors": 0,
      "warnings": 1
    },
    
    "full_lint_check": {
      "status": "pass",
      "errors": 0,
      "warnings": 2,
      "fixable": 2
    },
    
    "security_scan": {
      "status": "pass",
      "new_findings": 0,
      "resolved_findings": 0
    }
  },
  
  "rollback_availability": {
    "rollback_points_created": 4,
    "rollback_points_available": 4,
    "can_rollback_to": "any_checkpoint",
    "rollback_branches": [
      "rollback/checkpoint-1-1709903000",
      "rollback/checkpoint-2-1709903045", 
      "rollback/checkpoint-3-1709903097",
      "rollback/checkpoint-4-1709903135"
    ]
  },
  
  "recommendations": {
    "merge_confidence": "high",
    "additional_testing": ["Integration test the complete auth flow"],
    "cleanup_actions": ["Remove rollback branches after merge"],
    "deployment_notes": ["JWT secret configuration required in production"]
  }
}
```

### 6. Integration with SPEK Workflow

#### Escalation from Micro-Edits:
```javascript
function handleMicroEditEscalation(microResult, originalIssue) {
  if (microResult.constraint_violation?.type === 'max_files_exceeded') {
    return {
      escalate_to: 'fix:planned',
      reason: 'Issue spans multiple files beyond micro-edit constraints',
      suggested_checkpoint_size: 20, // Smaller checkpoints for complex issues
      carry_forward: {
        analysis: microResult.analysis,
        partial_changes: microResult.partial_changes
      }
    };
  }
  
  return null;
}
```

#### Integration with Impact Analysis:
```javascript
function enhanceWithImpactAnalysis(plannedFix, impactMap) {
  return {
    ...plannedFix,
    checkpoints: plannedFix.checkpoints.map(checkpoint => ({
      ...checkpoint,
      risk_factors: impactMap.hotspots.filter(h => 
        checkpoint.files.some(f => f.includes(h.file))
      ),
      coordination_needs: impactMap.crosscuts.filter(c =>
        c.affected_files.some(af => checkpoint.files.includes(af))
      )
    })),
    enhanced_validation: impactMap.riskAssessment.overall_risk === 'high'
  };
}
```

## Integration Points

### Used by:
- `/qa:analyze` command - When complexity is classified as "multi"
- `scripts/self_correct.sh` - For systematic multi-file repairs
- `flow/workflows/after-edit.yaml` - For complex failure recovery
- CF v2 Alpha - For coordinated multi-agent fixes

### Produces:
- `planned-fix.json` - Detailed execution plan and results
- Rollback points for safe recovery
- Progressive quality validation reports
- Checkpoint-based success metrics

### Consumes:
- Complex issue descriptions spanning multiple files
- Impact analysis from `/gemini:impact` (when available)
- Failed micro-edit results requiring escalation
- Quality gate configurations and thresholds

## Examples

### Successful Multi-Checkpoint Fix:
```json
{
  "execution_summary": {"overall_status": "success", "checkpoints_completed": 3, "rollbacks_required": 0},
  "quality_validation": {"final_test_run": {"status": "pass"}}
}
```

### Checkpoint Failure with Rollback:
```json
{
  "execution_summary": {"overall_status": "failed", "checkpoints_completed": 2, "failure_checkpoint": 3},
  "rollback_applied": "rollback/checkpoint-2-1709903000",
  "recommendations": {"next_steps": "Analyze checkpoint 3 failure and re-plan approach"}
}
```

### Complex Fix with Enhanced Validation:
```json
{
  "planning": {"complexity_assessment": "high", "enhanced_validation": true},
  "quality_validation": {"security_scan": {"status": "pass"}, "integration_tests": {"status": "pass"}}
}
```

## Error Handling

### Checkpoint Failures:
- Automatic rollback to previous stable state
- Detailed failure analysis and recommendation
- Option to continue from last successful checkpoint
- Escalation paths for persistent failures

### Quality Gate Violations:
- Stop execution at first checkpoint failure
- Preserve all rollback points for recovery
- Detailed analysis of what quality gates failed
- Recommendations for remediation approach

### System Failures:
- Recovery of partial progress from artifacts
- Rollback branch preservation for manual recovery
- Clear status reporting for current state
- Guidance for manual intervention when needed

## Performance Requirements

- Complete execution within reasonable time based on scope
- Progress reporting for long-running fixes
- Efficient rollback point management
- Memory usage monitoring during execution

This command provides systematic handling of complex, multi-file fixes while maintaining safety through checkpoints and comprehensive quality validation at each step.
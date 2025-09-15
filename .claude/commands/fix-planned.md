# /fix:planned

## Purpose
Execute systematic multi-file fixes with bounded checkpoints and rollback safety. Enhanced with CI/CD loop integration for connascence coupling issues and multi-file coordination. Handles complex issues that exceed micro-edit constraints through planned approach with incremental validation and comprehensive quality gates.

## Usage
/fix:planned '<issue_description>' [checkpoint_size=25] [--loop-mode] [--connascence-focus] [--context-bundle=path]

## Implementation

### 0. Enhanced Loop Integration (NEW)

#### CI/CD Loop Mode Detection:
```bash
# Enhanced argument parsing for loop integration
LOOP_MODE=false
CONNASCENCE_FOCUS=false
CONTEXT_BUNDLE=""
MAX_ITERATIONS=5
AUTHENTICITY_THRESHOLD=0.7

# Parse enhanced arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --loop-mode)
      LOOP_MODE=true
      shift
      ;;
    --connascence-focus)
      CONNASCENCE_FOCUS=true
      shift
      ;;
    --context-bundle=*)
      CONTEXT_BUNDLE="${1#*=}"
      shift
      ;;
    --max-iterations=*)
      MAX_ITERATIONS="${1#*=}"
      shift
      ;;
    --authenticity-threshold=*)
      AUTHENTICITY_THRESHOLD="${1#*=}"
      shift
      ;;
    *)
      # Regular issue description
      ISSUE_DESCRIPTION="$1"
      shift
      ;;
  esac
done

echo "Loop integration mode: $LOOP_MODE"
echo "Connascence focus: $CONNASCENCE_FOCUS"
echo "Context bundle: ${CONTEXT_BUNDLE:-'None'}"
```

#### Connascence Context Bundle Loading:
```javascript
function loadConnascenceContext(contextBundlePath) {
  if (!contextBundlePath || !fs.existsSync(contextBundlePath)) {
    return null;
  }

  const contextMetadata = JSON.parse(
    fs.readFileSync(path.join(contextBundlePath, 'context_metadata.json'), 'utf8')
  );

  const coupledFiles = [];
  const bundleDir = path.resolve(contextBundlePath);

  // Load all files from context bundle
  for (const fileName of contextMetadata.coupled_files) {
    const filePath = path.join(bundleDir, fileName);
    if (fs.existsSync(filePath)) {
      coupledFiles.push({
        name: fileName,
        content: fs.readFileSync(filePath, 'utf8'),
        originalPath: findOriginalPath(fileName),
        contextLines: contextMetadata.context_lines[fileName] || []
      });
    }
  }

  return {
    issueType: contextMetadata.issue_type,
    severity: contextMetadata.severity,
    couplingStrength: contextMetadata.coupling_strength,
    description: contextMetadata.description,
    primaryFile: contextMetadata.primary_file,
    coupledFiles: coupledFiles,
    suggestedRefactoring: contextMetadata.suggested_refactoring,
    refactoringResearch: loadRefactoringResearch(contextMetadata.issue_type)
  };
}

function loadRefactoringResearch(issueType) {
  // Load research results for specific connascence type
  const researchMap = {
    'temporal': [
      'Command Pattern for ordered operations',
      'Template Method for consistent sequences',
      'State Machine for complex temporal dependencies'
    ],
    'communicational': [
      'Repository Pattern for data access decoupling',
      'Mediator Pattern for communication management',
      'Event Sourcing for shared state handling'
    ],
    'sequential': [
      'Pipeline Pattern for data transformation chains',
      'Chain of Responsibility for processing sequences',
      'Functional Composition for pure function chains'
    ],
    'procedural': [
      'Strategy Pattern for algorithm variations',
      'Visitor Pattern for operation separation',
      'Polymorphism for type-specific behavior'
    ]
  };

  return researchMap[issueType] || ['Extract Method', 'Dependency Injection'];
}
```

#### Enhanced Multi-File Coordination:
```javascript
function enhanceMultiFileAnalysis(issueDescription, connascenceContext) {
  const analysis = {
    affected_files: [],
    dependency_chain: [],
    coupling_analysis: null,
    refactoring_strategy: null,
    coordination_requirements: []
  };

  if (connascenceContext) {
    // Use connascence context for enhanced analysis
    analysis.affected_files = connascenceContext.coupledFiles.map(f => ({
      path: f.originalPath,
      name: f.name,
      coupling_role: f.name === connascenceContext.primaryFile ? 'primary' : 'coupled',
      context_lines: f.contextLines,
      estimated_loc: estimateLOCFromContext(f.content, f.contextLines)
    }));

    analysis.coupling_analysis = {
      type: connascenceContext.issueType,
      severity: connascenceContext.severity,
      strength: connascenceContext.couplingStrength,
      description: connascenceContext.description
    };

    analysis.refactoring_strategy = {
      primary_technique: connascenceContext.suggestedRefactoring[0],
      alternative_techniques: connascenceContext.suggestedRefactoring.slice(1),
      research_recommendations: connascenceContext.refactoringResearch
    };

    analysis.coordination_requirements = generateCoordinationRequirements(connascenceContext);
  } else {
    // Fall back to standard analysis
    analysis.affected_files = identifyAffectedFiles(issueDescription, codebase);
    analysis.dependency_chain = buildDependencyChain(issueDescription);
  }

  return analysis;
}

function generateCoordinationRequirements(connascenceContext) {
  const requirements = [];

  switch (connascenceContext.issueType) {
    case 'temporal':
      requirements.push('Maintain operation order during refactoring');
      requirements.push('Ensure initialization sequence preservation');
      requirements.push('Validate cleanup procedures remain consistent');
      break;

    case 'communicational':
      requirements.push('Preserve data flow integrity across files');
      requirements.push('Maintain shared state consistency');
      requirements.push('Ensure atomic updates to shared data');
      break;

    case 'sequential':
      requirements.push('Preserve transformation pipeline order');
      requirements.push('Maintain input/output contracts');
      requirements.push('Ensure error propagation consistency');
      break;

    case 'procedural':
      requirements.push('Maintain consistent naming patterns');
      requirements.push('Preserve parameter signatures');
      requirements.push('Ensure uniform error handling');
      break;

    default:
      requirements.push('Maintain functional consistency across files');
      requirements.push('Preserve API contracts');
      requirements.push('Ensure backward compatibility');
  }

  return requirements;
}
```

#### Loop Integration Checkpoint Strategy:
```javascript
function createLoopIntegratedCheckpoints(analysis, maxCheckpointSize = 25) {
  const checkpoints = [];

  if (analysis.coupling_analysis) {
    // Special checkpoint strategy for connascence issues
    checkpoints.push(...createConnascenceCheckpoints(analysis, maxCheckpointSize));
  } else {
    // Standard checkpoint strategy
    checkpoints.push(...createStandardCheckpoints(analysis, maxCheckpointSize));
  }

  // Add loop-specific validation checkpoints
  checkpoints.forEach(checkpoint => {
    checkpoint.loop_validations = [
      'coupling_metrics_check',
      'theater_detection_scan',
      'authenticity_validation',
      'regression_test_suite'
    ];

    checkpoint.rollback_criteria = [
      'authenticity_score < ' + AUTHENTICITY_THRESHOLD,
      'coupling_strength_increased',
      'test_failures_introduced',
      'security_vulnerabilities_added'
    ];
  });

  return checkpoints;
}

function createConnascenceCheckpoints(analysis, maxSize) {
  const checkpoints = [];
  const couplingType = analysis.coupling_analysis.type;

  // Checkpoint 1: Preparation and Infrastructure
  checkpoints.push({
    id: 1,
    name: 'Refactoring Infrastructure Setup',
    description: `Prepare infrastructure for ${couplingType} refactoring`,
    files: analysis.affected_files.filter(f => f.coupling_role === 'infrastructure'),
    coordination_focus: 'setup_phase',
    estimated_loc: 10,
    risk_level: 'low',
    validation_requirements: [
      'test_harness_functional',
      'backup_points_created',
      'dependency_tracking_enabled'
    ]
  });

  // Checkpoint 2: Primary File Refactoring
  const primaryFiles = analysis.affected_files.filter(f => f.coupling_role === 'primary');
  if (primaryFiles.length > 0) {
    checkpoints.push({
      id: 2,
      name: 'Primary File Refactoring',
      description: `Apply ${analysis.refactoring_strategy.primary_technique} to primary files`,
      files: primaryFiles,
      coordination_focus: 'primary_refactoring',
      estimated_loc: primaryFiles.reduce((sum, f) => sum + f.estimated_loc, 0),
      risk_level: analysis.coupling_analysis.severity === 'high' ? 'high' : 'medium',
      refactoring_technique: analysis.refactoring_strategy.primary_technique,
      validation_requirements: [
        'primary_functionality_preserved',
        'interface_contracts_maintained',
        'coupling_strength_measured'
      ]
    });
  }

  // Checkpoint 3: Coupled Files Coordination
  const coupledFiles = analysis.affected_files.filter(f => f.coupling_role === 'coupled');
  if (coupledFiles.length > 0) {
    // Split coupled files into manageable chunks
    const chunks = chunkFilesByComplexity(coupledFiles, maxSize);

    chunks.forEach((chunk, index) => {
      checkpoints.push({
        id: checkpoints.length + 1,
        name: `Coupled Files Refactoring (Batch ${index + 1})`,
        description: `Update coupled files to align with primary refactoring`,
        files: chunk,
        coordination_focus: 'coupled_alignment',
        estimated_loc: chunk.reduce((sum, f) => sum + f.estimated_loc, 0),
        risk_level: 'medium',
        coordination_requirements: analysis.coordination_requirements,
        validation_requirements: [
          'coupling_consistency_verified',
          'cross_file_contracts_maintained',
          'integration_tests_passed'
        ]
      });
    });
  }

  // Checkpoint 4: Integration and Validation
  checkpoints.push({
    id: checkpoints.length + 1,
    name: 'Integration Validation',
    description: 'Comprehensive validation of refactored coupling',
    files: [], // No file changes, just validation
    coordination_focus: 'final_validation',
    estimated_loc: 0,
    risk_level: 'low',
    validation_requirements: [
      'full_test_suite_execution',
      'coupling_metrics_improved',
      'performance_impact_assessed',
      'security_scan_clean',
      'theater_detection_passed'
    ]
  });

  return checkpoints;
}
```

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

### 2. Enhanced Execution with Loop Integration

#### Loop-Integrated Checkpoint Execution:
```javascript
async function executeLoopIntegratedPlan(checkpoints, issueDescription, loopContext) {
  const execution = {
    checkpoints_completed: [],
    current_checkpoint: null,
    rollback_points: [],
    overall_status: 'in_progress',
    loop_metrics: {
      authenticity_scores: [],
      coupling_improvements: [],
      theater_detection_results: [],
      iteration_count: 0
    },
    connascence_tracking: {
      initial_coupling_strength: loopContext?.coupling_analysis?.strength || 0,
      current_coupling_strength: 0,
      improvement_trajectory: []
    }
  };

  // Enhanced checkpoint execution with loop validation
  for (const [index, checkpoint] of checkpoints.entries()) {
    console.log(`[TARGET] Executing checkpoint ${checkpoint.id}/${checkpoints.length} (Loop Integration Active)`);
    execution.current_checkpoint = checkpoint;

    // Create rollback point before execution
    const rollbackPoint = await createRollbackPoint();
    execution.rollback_points.push(rollbackPoint);

    try {
      // Execute checkpoint with enhanced loop validations
      const result = await executeCheckpointWithLoopValidation(checkpoint, issueDescription, loopContext);

      if (result.success) {
        execution.checkpoints_completed.push({
          checkpoint_id: checkpoint.id,
          completion_time: new Date().toISOString(),
          changes_applied: result.changes,
          loop_metrics: result.loop_metrics
        });

        // Track loop-specific metrics
        if (result.loop_metrics) {
          execution.loop_metrics.authenticity_scores.push(result.loop_metrics.authenticity_score);
          execution.loop_metrics.coupling_improvements.push(result.loop_metrics.coupling_improvement);
          execution.loop_metrics.theater_detection_results.push(result.loop_metrics.theater_detection);
        }

        // Update connascence tracking
        if (result.coupling_metrics) {
          execution.connascence_tracking.current_coupling_strength = result.coupling_metrics.strength;
          execution.connascence_tracking.improvement_trajectory.push({
            checkpoint_id: checkpoint.id,
            coupling_strength: result.coupling_metrics.strength,
            improvement_pct: calculateCouplingImprovement(
              execution.connascence_tracking.initial_coupling_strength,
              result.coupling_metrics.strength
            )
          });
        }

        console.log(`[OK] Checkpoint ${checkpoint.id} completed with loop validation`);

        // Loop-specific success criteria check
        if (shouldExitEarly(execution, loopContext)) {
          console.log(`[PARTY] Early exit triggered - quality thresholds exceeded`);
          break;
        }
      } else {
        console.error(`[FAIL] Checkpoint ${checkpoint.id} failed: ${result.error}`);

        // Enhanced rollback with loop context
        await rollbackToPoint(rollbackPoint);

        execution.overall_status = 'failed';
        execution.failure_checkpoint = checkpoint.id;
        execution.failure_reason = result.error;
        break;
      }

    } catch (error) {
      console.error(`[EXPLOSION] Checkpoint ${checkpoint.id} threw error: ${error.message}`);
      await rollbackToPoint(rollbackPoint);

      execution.overall_status = 'error';
      execution.failure_checkpoint = checkpoint.id;
      execution.error = error.message;
      break;
    }
  }

  // Final loop validation
  if (execution.checkpoints_completed.length === checkpoints.length) {
    const finalValidation = await performFinalLoopValidation(execution, loopContext);

    if (finalValidation.authentic && finalValidation.coupling_improved) {
      execution.overall_status = 'success';
      console.log(`[PARTY] All ${checkpoints.length} checkpoints completed with loop validation success`);
    } else {
      execution.overall_status = 'theater_detected';
      console.log(`[THEATER] Checkpoints completed but failed authenticity validation`);
    }
  }

  return execution;
}

async function executeCheckpointWithLoopValidation(checkpoint, issueDescription, loopContext) {
  const changes = [];
  const loop_metrics = {
    authenticity_score: 0,
    coupling_improvement: 0,
    theater_detection: false,
    regression_check: true
  };

  // Process each file in the checkpoint with enhanced coordination
  for (const file of checkpoint.files) {
    try {
      let fileChanges;

      if (loopContext?.coupling_analysis && checkpoint.refactoring_technique) {
        // Use connascence-specific refactoring
        fileChanges = await planConnascenceRefactoring(
          file,
          checkpoint.refactoring_technique,
          loopContext,
          checkpoint.coordination_requirements
        );
      } else {
        // Standard file change planning
        fileChanges = await planFileChanges(file, issueDescription, checkpoint);
      }

      // Apply changes with enhanced validation
      const applyResult = await applyChangesWithLoopValidation(file.path, fileChanges, loopContext);

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
        validation_results: applyResult.validation_results
      });

      // Accumulate loop metrics
      if (applyResult.loop_metrics) {
        loop_metrics.authenticity_score += applyResult.loop_metrics.authenticity_score;
        loop_metrics.coupling_improvement += applyResult.loop_metrics.coupling_improvement;
      }

    } catch (error) {
      return {
        success: false,
        error: `Error processing ${file.path}: ${error.message}`,
        partial_changes: changes
      };
    }
  }

  // Normalize metrics
  if (checkpoint.files.length > 0) {
    loop_metrics.authenticity_score /= checkpoint.files.length;
    loop_metrics.coupling_improvement /= checkpoint.files.length;
  }

  // Run checkpoint-level validations
  const checkpointValidation = await runCheckpointValidations(checkpoint, changes, loopContext);

  // Run theater detection at checkpoint level
  const theaterResult = await runTheaterDetection(changes, loop_metrics);
  loop_metrics.theater_detection = theaterResult.theater_detected;

  // Update authenticity score based on theater detection
  if (theaterResult.theater_detected) {
    loop_metrics.authenticity_score *= 0.5; // Penalty for theater detection
  }

  return {
    success: checkpointValidation.passed,
    changes: changes,
    loop_metrics: loop_metrics,
    coupling_metrics: checkpointValidation.coupling_metrics,
    validation_summary: checkpointValidation.summary
  };
}

async function planConnascenceRefactoring(file, technique, loopContext, coordinationRequirements) {
  const refactoringPlan = {
    technique: technique,
    target_coupling: loopContext.coupling_analysis.type,
    coordination_needs: coordinationRequirements,
    changes: []
  };

  // Apply technique-specific refactoring patterns
  switch (technique) {
    case 'Extract Class':
      refactoringPlan.changes = await planExtractClassRefactoring(file, loopContext);
      break;
    case 'Dependency Injection':
      refactoringPlan.changes = await planDependencyInjectionRefactoring(file, loopContext);
      break;
    case 'Observer Pattern':
      refactoringPlan.changes = await planObserverPatternRefactoring(file, loopContext);
      break;
    case 'Strategy Pattern':
      refactoringPlan.changes = await planStrategyPatternRefactoring(file, loopContext);
      break;
    default:
      refactoringPlan.changes = await planGenericRefactoring(file, loopContext);
  }

  return refactoringPlan;
}

async function runCheckpointValidations(checkpoint, changes, loopContext) {
  const validations = {
    passed: true,
    summary: [],
    coupling_metrics: null
  };

  // Run all required validations for this checkpoint
  for (const validation of checkpoint.validation_requirements) {
    const result = await runSpecificValidation(validation, changes, loopContext);

    validations.summary.push({
      validation: validation,
      passed: result.passed,
      details: result.details
    });

    if (!result.passed) {
      validations.passed = false;
    }

    // Capture coupling metrics if available
    if (result.coupling_metrics) {
      validations.coupling_metrics = result.coupling_metrics;
    }
  }

  // Run loop-specific validations
  if (checkpoint.loop_validations) {
    for (const loopValidation of checkpoint.loop_validations) {
      const result = await runLoopValidation(loopValidation, changes, loopContext);

      validations.summary.push({
        validation: loopValidation,
        passed: result.passed,
        details: result.details,
        loop_specific: true
      });

      if (!result.passed) {
        validations.passed = false;
      }
    }
  }

  return validations;
}

function shouldExitEarly(execution, loopContext) {
  // Check if we should exit the loop early due to exceptional success
  const latestMetrics = execution.loop_metrics;

  if (latestMetrics.authenticity_scores.length === 0) {
    return false;
  }

  const currentAuthenticity = latestMetrics.authenticity_scores[latestMetrics.authenticity_scores.length - 1];
  const couplingImprovement = execution.connascence_tracking.improvement_trajectory;

  // Exit early if authenticity is very high and coupling is significantly improved
  if (currentAuthenticity >= 0.95 && couplingImprovement.length > 0) {
    const latestImprovement = couplingImprovement[couplingImprovement.length - 1];
    if (latestImprovement.improvement_pct >= 50) {
      return true;
    }
  }

  return false;
}

async function performFinalLoopValidation(execution, loopContext) {
  const validation = {
    authentic: false,
    coupling_improved: false,
    overall_success: false,
    metrics: {}
  };

  // Calculate overall authenticity score
  const avgAuthenticity = execution.loop_metrics.authenticity_scores.reduce((a, b) => a + b, 0) /
                         execution.loop_metrics.authenticity_scores.length;

  validation.authentic = avgAuthenticity >= (loopContext?.authenticity_threshold || 0.7);

  // Check coupling improvements
  const initialStrength = execution.connascence_tracking.initial_coupling_strength;
  const finalStrength = execution.connascence_tracking.current_coupling_strength;

  validation.coupling_improved = finalStrength < initialStrength;

  // Overall success requires both authenticity and coupling improvement
  validation.overall_success = validation.authentic && validation.coupling_improved;

  validation.metrics = {
    average_authenticity: avgAuthenticity,
    coupling_improvement_pct: calculateCouplingImprovement(initialStrength, finalStrength),
    checkpoints_completed: execution.checkpoints_completed.length,
    theater_detection_rate: execution.loop_metrics.theater_detection_results.filter(t => t).length /
                           execution.loop_metrics.theater_detection_results.length
  };

  return validation;
}

function calculateCouplingImprovement(initial, final) {
  if (initial === 0) return 0;
  return ((initial - final) / initial) * 100;
}
```

### 3. Systematic Execution with Checkpoints

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
    console.log(`[TARGET] Executing checkpoint ${checkpoint.id}/${checkpoints.length}`);
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
        
        console.log(`[OK] Checkpoint ${checkpoint.id} completed successfully`);
      } else {
        console.error(`[FAIL] Checkpoint ${checkpoint.id} failed: ${result.error}`);
        await rollbackToPoint(rollbackPoint);
        
        execution.overall_status = 'failed';
        execution.failure_checkpoint = checkpoint.id;
        execution.failure_reason = result.error;
        break;
      }
      
    } catch (error) {
      console.error(`[U+1F4A5] Checkpoint ${checkpoint.id} threw error: ${error.message}`);
      await rollbackToPoint(rollbackPoint);
      
      execution.overall_status = 'error';
      execution.failure_checkpoint = checkpoint.id;
      execution.error = error.message;
      break;
    }
  }
  
  if (execution.checkpoints_completed.length === checkpoints.length) {
    execution.overall_status = 'success';
    console.log(`[PARTY] All ${checkpoints.length} checkpoints completed successfully`);
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
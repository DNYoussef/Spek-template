# /fsm:validate - Validate State Machine Completeness

## Purpose
Validate state machine specification and implementation against FSM best practices, ensuring completeness, correctness, and adherence to state machine principles.

## Usage
```bash
/fsm:validate [--spec <spec_file>] [--implementation <dir>] [--strict] [--fix]
```

## Validation Checks

### 1. Specification Completeness
```javascript
function validateSpecification(spec) {
  const validationResults = {
    errors: [],
    warnings: [],
    info: [],
    metrics: {}
  };

  // Required sections
  if (!spec.states || spec.states.length === 0) {
    validationResults.errors.push('No states defined');
  }

  if (!spec.events || spec.events.length === 0) {
    validationResults.errors.push('No events defined');
  }

  if (!spec.transitions || Object.keys(spec.transitions).length === 0) {
    validationResults.errors.push('No transitions defined');
  }

  // Validate initial state
  if (!spec.initial_state) {
    validationResults.errors.push('No initial state specified');
  } else if (!spec.states.find(s => s.id === spec.initial_state)) {
    validationResults.errors.push(`Initial state '${spec.initial_state}' not found in states`);
  }

  return validationResults;
}
```

### 2. State Reachability Analysis
```javascript
function analyzeReachability(spec) {
  const reachable = new Set();
  const queue = [spec.initial_state];
  reachable.add(spec.initial_state);

  while (queue.length > 0) {
    const current = queue.shift();
    const transitions = spec.transitions[current] || {};

    for (const [event, target] of Object.entries(transitions)) {
      const nextState = typeof target === 'string' ? target : target.target;
      if (!reachable.has(nextState) && nextState !== 'REMAIN') {
        reachable.add(nextState);
        queue.push(nextState);
      }
    }
  }

  const unreachable = spec.states.filter(s => !reachable.has(s.id));

  return {
    reachable: Array.from(reachable),
    unreachable: unreachable.map(s => s.id),
    orphanStates: unreachable
  };
}
```

### 3. Transition Coverage Matrix
```javascript
function validateTransitionCoverage(spec) {
  const matrix = {};
  const coverage = {
    defined: 0,
    undefined: 0,
    illegal: 0,
    total: 0
  };

  // Build complete matrix
  for (const state of spec.states) {
    matrix[state.id] = {};
    for (const event of spec.events) {
      const transition = spec.transitions[state.id]?.[event.id];

      if (transition) {
        matrix[state.id][event.id] = typeof transition === 'string' ? transition : transition.target;
        coverage.defined++;
      } else if (isIllegalTransition(state.id, event.id, spec)) {
        matrix[state.id][event.id] = 'ILLEGAL';
        coverage.illegal++;
      } else {
        matrix[state.id][event.id] = 'UNDEFINED';
        coverage.undefined++;
      }

      coverage.total++;
    }
  }

  coverage.percentage = (coverage.defined / coverage.total) * 100;

  return {
    matrix,
    coverage,
    incomplete: coverage.undefined > 0,
    completeness: coverage.percentage
  };
}
```

### 4. Deadlock Detection
```javascript
function detectDeadlocks(spec) {
  const deadlocks = [];

  for (const state of spec.states) {
    const transitions = spec.transitions[state.id] || {};
    const hasExit = Object.values(transitions).some(t => {
      const target = typeof t === 'string' ? t : t.target;
      return target !== state.id && target !== 'REMAIN';
    });

    if (!hasExit && state.id !== spec.terminal_state) {
      deadlocks.push({
        state: state.id,
        reason: 'No exit transitions available'
      });
    }
  }

  return deadlocks;
}
```

### 5. Guard Validation
```javascript
function validateGuards(spec) {
  const issues = [];
  const guards = new Set();

  for (const [stateId, transitions] of Object.entries(spec.transitions)) {
    for (const [event, transition] of Object.entries(transitions)) {
      if (typeof transition === 'object' && transition.guard) {
        guards.add(transition.guard);

        // Check guard naming convention
        if (!transition.guard.match(/^(can|is|has|should)[A-Z]/)) {
          issues.push({
            type: 'warning',
            location: `${stateId}.${event}`,
            message: `Guard '${transition.guard}' doesn't follow naming convention (should start with can/is/has/should)`
          });
        }

        // Check for guard implementation
        if (!spec.guard_implementations || !spec.guard_implementations[transition.guard]) {
          issues.push({
            type: 'error',
            location: `${stateId}.${event}`,
            message: `Guard '${transition.guard}' has no implementation`
          });
        }
      }
    }
  }

  return {
    guards: Array.from(guards),
    issues,
    totalGuards: guards.size
  };
}
```

### 6. Implementation Validation
```javascript
function validateImplementation(spec, implementationDir) {
  const issues = [];
  const metrics = {
    statesImplemented: 0,
    statesMissing: [],
    contractCompliance: true,
    isolationScore: 0
  };

  // Check for each state file
  for (const state of spec.states) {
    const stateFile = path.join(implementationDir, 'states', `${state.id}State.ts`);

    if (!fs.existsSync(stateFile)) {
      metrics.statesMissing.push(state.id);
      issues.push({
        type: 'error',
        file: stateFile,
        message: `State implementation file missing for ${state.id}`
      });
    } else {
      metrics.statesImplemented++;

      // Validate contract implementation
      const content = fs.readFileSync(stateFile, 'utf8');

      if (!content.includes('implements StateContract')) {
        issues.push({
          type: 'error',
          file: stateFile,
          message: 'State does not implement StateContract interface'
        });
        metrics.contractCompliance = false;
      }

      // Check required methods
      const requiredMethods = ['init', 'update', 'shutdown', 'checkInvariants'];
      for (const method of requiredMethods) {
        if (!content.includes(`${method}(`)) {
          issues.push({
            type: 'error',
            file: stateFile,
            message: `Missing required method: ${method}()`
          });
        }
      }
    }
  }

  // Check for TransitionHub
  const hubFile = path.join(implementationDir, 'fsm', 'TransitionHub.ts');
  if (!fs.existsSync(hubFile)) {
    issues.push({
      type: 'error',
      file: hubFile,
      message: 'TransitionHub not found - centralized transitions missing'
    });
  }

  metrics.isolationScore = (metrics.statesImplemented / spec.states.length) * 100;

  return {
    issues,
    metrics
  };
}
```

### 7. Invariant Validation
```javascript
function validateInvariants(spec) {
  const issues = [];
  const metrics = {
    statesWithInvariants: 0,
    totalInvariants: 0
  };

  for (const state of spec.states) {
    if (state.invariants && state.invariants.length > 0) {
      metrics.statesWithInvariants++;
      metrics.totalInvariants += state.invariants.length;

      // Validate invariant syntax
      for (const invariant of state.invariants) {
        if (!invariant.match(/[<>=!]/)) {
          issues.push({
            type: 'warning',
            state: state.id,
            invariant: invariant,
            message: 'Invariant should be a boolean expression'
          });
        }
      }
    } else {
      issues.push({
        type: 'info',
        state: state.id,
        message: 'State has no invariants defined'
      });
    }
  }

  return {
    issues,
    metrics
  };
}
```

## Validation Report Format
```yaml
validation_report:
  timestamp: "2025-01-24T12:00:00Z"
  spec_file: "fsm_spec.yaml"

  summary:
    status: "FAIL"  # PASS | WARN | FAIL
    errors: 3
    warnings: 5
    info: 2

  specification:
    complete: false
    states_defined: 5
    events_defined: 8
    transitions_defined: 25

  reachability:
    all_states_reachable: false
    unreachable_states: ["ERROR_RECOVERY"]

  coverage:
    transition_matrix_complete: false
    coverage_percentage: 85
    undefined_transitions: 15

  deadlocks:
    found: true
    states: ["TERMINAL_ERROR"]

  guards:
    total: 8
    implemented: 6
    missing: ["canRetryAfterTimeout"]

  implementation:
    states_implemented: 4/5
    contract_compliance: false
    isolation_score: 80

  invariants:
    states_with_invariants: 3/5
    total_invariants: 12

  recommendations:
    - "Add transitions for undefined state-event pairs"
    - "Implement missing state: ERROR_RECOVERY"
    - "Add guard implementation for canRetryAfterTimeout"
    - "Fix contract compliance in ProcessingState"
```

## Auto-Fix Mode
```javascript
async function autoFix(validationResult, spec, options) {
  const fixes = [];

  // Fix missing transitions
  if (validationResult.coverage.undefined > 0) {
    for (const [state, events] of Object.entries(validationResult.coverage.matrix)) {
      for (const [event, target] of Object.entries(events)) {
        if (target === 'UNDEFINED') {
          // Add default REMAIN transition
          if (!spec.transitions[state]) spec.transitions[state] = {};
          spec.transitions[state][event] = 'REMAIN';
          fixes.push(`Added transition: ${state} + ${event} -> REMAIN`);
        }
      }
    }
  }

  // Generate missing state files
  for (const missingState of validationResult.implementation.metrics.statesMissing) {
    const stateContent = generateStateTemplate(missingState, spec);
    const filePath = `src/states/${missingState}State.ts`;
    await fs.writeFile(filePath, stateContent);
    fixes.push(`Generated state file: ${filePath}`);
  }

  return {
    fixes,
    updatedSpec: spec
  };
}
```

## Example Usage
```bash
# Basic validation
/fsm:validate

# Validate with specific spec
/fsm:validate --spec custom_fsm.yaml

# Strict mode (treat warnings as errors)
/fsm:validate --strict

# Auto-fix issues
/fsm:validate --fix

# Validate implementation
/fsm:validate --implementation src/
```

## Integration
- Used by `/qa:gate` for FSM quality checks
- Called by `/fsm:generate` after scaffolding
- Part of `/cicd-loop` validation pipeline

<!-- AGENT FOOTER BEGIN -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | 2025-01-24T11:10:00Z | FSM Validator | Validation command | OK | g4h6i9 |
<!-- AGENT FOOTER END -->
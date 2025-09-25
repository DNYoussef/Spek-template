# /fsm:design - Interactive State Machine Designer

## Purpose
Interactively design a complete state machine from requirements, generating state diagrams, transition matrices, and implementation specifications that enforce FSM-first thinking.

## Usage
```bash
/fsm:design "<feature_description>" [--from-spec <spec_file>] [--lang <language>] [--pattern <pattern>]
```

## Implementation

### Step 1: State Discovery
```javascript
function discoverStates(requirements) {
  const prompt = `
  Analyze these requirements and identify:
  1. STATES (nouns): Distinct modes/phases the system can be in
  2. EVENTS (verbs): Triggers that cause state changes
  3. TRANSITIONS: Map every (STATE x EVENT) -> NEXT_STATE
  4. ILLEGAL: Explicitly declare invalid transitions
  5. GUARDS: Conditions that must be true for transitions

  Requirements: ${requirements}

  Output as structured YAML with:
  - states: [list with descriptions]
  - events: [list with trigger sources]
  - transitions: [matrix of statexevent]
  - illegal_transitions: [explicitly forbidden]
  - guards: [transition conditions]
  `;

  return analyzeWithAI(prompt);
}
```

### Step 2: Generate FSM Specification
```yaml
# Output: fsm_spec.yaml
fsm:
  name: "FeatureName"
  version: "1.0.0"

  states:
    - id: "IDLE"
      description: "System waiting for input"
      entry_actions: ["clearBuffers()", "resetTimers()"]
      exit_actions: ["saveState()"]
      invariants:
        - "buffer.size == 0"
        - "timer.elapsed < timeout"

    - id: "PROCESSING"
      description: "Actively processing request"
      entry_actions: ["startProcessing()"]
      exit_actions: ["cleanup()"]
      invariants:
        - "processor.active == true"
        - "queue.length > 0"

    - id: "ERROR"
      description: "Error state with recovery"
      entry_actions: ["logError()", "notifyUser()"]
      exit_actions: ["clearError()"]
      invariants:
        - "error != null"

  events:
    - id: "START"
      description: "User initiates action"
      payload_type: "StartRequest"

    - id: "COMPLETE"
      description: "Processing completed"
      payload_type: "CompleteResponse"

    - id: "ERROR"
      description: "Error occurred"
      payload_type: "ErrorDetails"

    - id: "RESET"
      description: "Reset to initial state"
      payload_type: "void"

  transitions:
    IDLE:
      START:
        target: "PROCESSING"
        guard: "canProcess()"
        action: "initializeProcessor()"
      RESET: "IDLE"

    PROCESSING:
      COMPLETE:
        target: "IDLE"
        action: "saveResults()"
      ERROR:
        target: "ERROR"
        action: "handleError()"
      RESET: "IDLE"

    ERROR:
      RESET: "IDLE"
      RETRY:
        target: "PROCESSING"
        guard: "canRetry()"

  illegal_transitions:
    - from: "ERROR"
      event: "START"
      reason: "Must reset before starting new process"

    - from: "IDLE"
      event: "COMPLETE"
      reason: "Cannot complete without processing"
```

### Step 3: Generate Visual Diagram
```javascript
function generateStateDiagram(spec) {
  const mermaid = `
  stateDiagram-v2
    [*] --> ${spec.initial_state}

    ${spec.states.map(state => `
    ${state.id}: ${state.description}
    ${state.id} --> ${state.id}: ${state.self_transitions || ''}
    `).join('\n')}

    ${spec.transitions.map(t => `
    ${t.from} --> ${t.to}: ${t.event}${t.guard ? ' [' + t.guard + ']' : ''}
    `).join('\n')}
  `;

  return renderMermaid(mermaid, 'docs/fsm_diagram.svg');
}
```

### Step 4: Generate Implementation Contract
```typescript
// Generated: src/fsm/contracts.ts
export enum StateId {
  IDLE = "IDLE",
  PROCESSING = "PROCESSING",
  ERROR = "ERROR"
}

export enum EventType {
  START = "START",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
  RESET = "RESET"
}

export interface StateContract {
  init(ctx: Context): void;
  update(ctx: Context, event: Event): StateId | "REMAIN";
  draw?(ctx: Context): void;
  shutdown(ctx: Context): void;

  // Invariant checks
  checkInvariants(ctx: Context): boolean;
  getInvariantErrors(ctx: Context): string[];
}

export interface TransitionGuard {
  canTransition(from: StateId, event: EventType, to: StateId, ctx: Context): boolean;
  getGuardError(): string;
}
```

### Step 5: Generate Test Matrix
```javascript
function generateTestMatrix(spec) {
  const tests = [];

  // For each state
  for (const state of spec.states) {
    // For each possible event
    for (const event of spec.events) {
      const transition = spec.transitions[state.id]?.[event.id];

      if (transition) {
        tests.push({
          name: `${state.id} + ${event.id} -> ${transition.target}`,
          from: state.id,
          event: event.id,
          expected: transition.target,
          guard: transition.guard,
          type: 'valid_transition'
        });
      } else if (isIllegalTransition(state.id, event.id, spec)) {
        tests.push({
          name: `${state.id} + ${event.id} -> ILLEGAL`,
          from: state.id,
          event: event.id,
          expected: 'REMAIN',
          shouldThrow: true,
          type: 'illegal_transition'
        });
      } else {
        tests.push({
          name: `${state.id} + ${event.id} -> REMAIN`,
          from: state.id,
          event: event.id,
          expected: 'REMAIN',
          type: 'no_transition'
        });
      }
    }
  }

  return tests;
}
```

### Step 6: Quality Validation
```javascript
function validateFSMCompleteness(spec) {
  const issues = [];

  // Check all states are reachable
  const reachable = findReachableStates(spec);
  const orphans = spec.states.filter(s => !reachable.has(s.id));
  if (orphans.length > 0) {
    issues.push(`Unreachable states: ${orphans.map(s => s.id)}`);
  }

  // Check for transition coverage
  const coverage = calculateTransitionCoverage(spec);
  if (coverage < 1.0) {
    issues.push(`Incomplete transition matrix: ${coverage * 100}% covered`);
  }

  // Check for deadlocks
  const deadlocks = findDeadlockStates(spec);
  if (deadlocks.length > 0) {
    issues.push(`Potential deadlock states: ${deadlocks}`);
  }

  // Check guard completeness
  const unguarded = findUnguardedCriticalTransitions(spec);
  if (unguarded.length > 0) {
    issues.push(`Critical transitions without guards: ${unguarded}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    metrics: {
      stateCount: spec.states.length,
      eventCount: spec.events.length,
      transitionCount: countTransitions(spec),
      coveragePercent: coverage * 100,
      guardedPercent: calculateGuardCoverage(spec) * 100
    }
  };
}
```

### Step 7: Integration Output
```javascript
async function executeFSMDesign(feature, options = {}) {
  console.log("[TARGET] Starting FSM Design Process...");

  // 1. Discover states from requirements
  const discovery = await discoverStates(feature);
  console.log(`[OK] Discovered ${discovery.states.length} states, ${discovery.events.length} events`);

  // 2. Generate specification
  const spec = generateFSMSpec(discovery);
  await writeFile('.claude/.artifacts/fsm_spec.yaml', spec);
  console.log("[OK] Generated fsm_spec.yaml");

  // 3. Create visual diagram
  const diagram = await generateStateDiagram(spec);
  console.log("[OK] Created state diagram: docs/fsm_diagram.svg");

  // 4. Generate contracts
  const contracts = generateImplementationContract(spec, options.lang || 'typescript');
  await writeFile('src/fsm/contracts.ts', contracts);
  console.log("[OK] Generated state contracts");

  // 5. Create test matrix
  const tests = generateTestMatrix(spec);
  await writeFile('tests/fsm/transition_matrix.json', tests);
  console.log(`[OK] Generated ${tests.length} transition tests`);

  // 6. Validate completeness
  const validation = validateFSMCompleteness(spec);
  if (!validation.valid) {
    console.warn("[WARN] FSM validation issues:");
    validation.issues.forEach(issue => console.warn(`  - ${issue}`));
  }

  // 7. Generate implementation guide
  const guide = `
# FSM Implementation Guide

## States: ${spec.states.map(s => s.id).join(', ')}
## Events: ${spec.events.map(e => e.id).join(', ')}

## Next Steps:
1. Run: /fsm:generate to create state files
2. Implement each state's contract methods
3. Run: /fsm:test-matrix to validate transitions
4. Run: /fsm:coverage to check completeness

## Metrics:
- States: ${validation.metrics.stateCount}
- Events: ${validation.metrics.eventCount}
- Transitions: ${validation.metrics.transitionCount}
- Coverage: ${validation.metrics.coveragePercent}%
- Guarded: ${validation.metrics.guardedPercent}%
  `;

  console.log(guide);

  return {
    spec,
    diagram,
    tests,
    validation,
    files: [
      'fsm_spec.yaml',
      'docs/fsm_diagram.svg',
      'src/fsm/contracts.ts',
      'tests/fsm/transition_matrix.json'
    ]
  };
}
```

## Example Usage

```bash
# Basic state machine design
/fsm:design "User authentication flow with MFA support"

# From existing specification
/fsm:design --from-spec SPEC.md

# With specific language and pattern
/fsm:design "Order processing system" --lang python --pattern hierarchical

# Generate only diagram from existing spec
/fsm:design --visualize-only --from-spec fsm_spec.yaml
```

## Quality Checks
- [OK] All states must be reachable from initial state
- [OK] No orphan states (unreachable)
- [OK] No deadlock states (no exit transitions)
- [OK] Complete transition matrix (all statexevent combinations handled)
- [OK] Critical transitions have guards
- [OK] Illegal transitions explicitly declared
- [OK] State invariants defined
- [OK] Entry/exit actions specified

## Output Files
```
.claude/.artifacts/
  fsm_spec.yaml           # Complete FSM specification
  fsm_validation.json     # Validation results

docs/
  fsm_diagram.svg        # Visual state diagram
  fsm_implementation.md  # Implementation guide

src/fsm/
  contracts.ts           # State interfaces and enums

tests/fsm/
  transition_matrix.json # Test cases for all transitions
```

## Integration Points
- Feeds into `/fsm:generate` for scaffolding
- Used by `/fsm:test-matrix` for testing
- Referenced by `/qa:fsm-invariants` for validation
- Input for `/fsm:simulate` for behavior testing

<!-- AGENT FOOTER BEGIN -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | 2025-01-24T10:30:00Z | FSM Designer | Initial FSM design command | OK | a7b9c2 |
<!-- AGENT FOOTER END -->
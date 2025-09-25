# /fsm:generate - Generate State Implementation Scaffolding

## Purpose
Generate complete state machine implementation from fsm_spec.yaml, creating properly isolated state files, transition hub, guards, and test harnesses with FSM best practices enforced.

## Usage
```bash
/fsm:generate [--spec <spec_file>] [--lang <language>] [--pattern <pattern>] [--output <dir>]
```

## Implementation

### Step 1: Parse FSM Specification
```javascript
function loadFSMSpec(specFile = '.claude/.artifacts/fsm_spec.yaml') {
  const spec = parseYAML(readFile(specFile));

  // Validate spec completeness
  if (!spec.states || !spec.events || !spec.transitions) {
    throw new Error("Invalid FSM spec: missing required sections");
  }

  return spec;
}
```

### Step 2: Generate State Files (One Per State)
```typescript
// Template for each state file: src/states/[StateName]State.ts
function generateStateFile(state, spec) {
  return `/**
 * ${state.id} State Implementation
 * ${state.description}
 *
 * Entry Conditions: ${state.entry_actions?.join(', ') || 'None'}
 * Exit Conditions: ${state.exit_actions?.join(', ') || 'None'}
 * Invariants: ${state.invariants?.join(', ') || 'None'}
 */

import { StateContract, StateId, EventType, Context, Event } from '../fsm/types';
import { logger } from '../utils/logger';

export class ${state.id}State implements StateContract {
  private readonly stateId = StateId.${state.id};

  /**
   * Initialize state - called on entry
   */
  init(ctx: Context): void {
    logger.debug(\`Entering state: \${this.stateId}\`);

    // Entry actions
    ${state.entry_actions?.map(action => `this.${action}(ctx);`).join('\n    ') || '// No entry actions'}

    // Initialize state-specific resources
    this.initializeResources(ctx);
  }

  /**
   * Update state - handle events and determine transitions
   */
  update(ctx: Context, event: Event): StateId | "REMAIN" {
    logger.debug(\`State \${this.stateId} received event: \${event.type}\`);

    switch(event.type) {
      ${generateEventHandlers(state, spec)}

      default:
        logger.warn(\`Unhandled event \${event.type} in state \${this.stateId}\`);
        return "REMAIN";
    }
  }

  /**
   * Draw/render state (optional for non-visual systems)
   */
  draw?(ctx: Context): void {
    // Render state visualization if applicable
    ${state.render ? generateRenderLogic(state) : '// No rendering for this state'}
  }

  /**
   * Shutdown state - called on exit
   */
  shutdown(ctx: Context): void {
    logger.debug(\`Exiting state: \${this.stateId}\`);

    // Exit actions
    ${state.exit_actions?.map(action => `this.${action}(ctx);`).join('\n    ') || '// No exit actions'}

    // Cleanup state-specific resources
    this.cleanupResources(ctx);
  }

  /**
   * Check state invariants
   */
  checkInvariants(ctx: Context): boolean {
    ${generateInvariantChecks(state)}
  }

  /**
   * Get detailed invariant errors
   */
  getInvariantErrors(ctx: Context): string[] {
    const errors: string[] = [];
    ${generateInvariantErrorCollection(state)}
    return errors;
  }

  // Private helper methods
  private initializeResources(ctx: Context): void {
    // TODO: Initialize state-specific resources
  }

  private cleanupResources(ctx: Context): void {
    // TODO: Cleanup state-specific resources
  }

  ${generateStateSpecificMethods(state)}
}

/* AGENT FOOTER BEGIN */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | ${new Date().toISOString()} | fsm:generate | Generated ${state.id} state | OK | ${generateHash()} |
/* AGENT FOOTER END */`;
}

function generateEventHandlers(state, spec) {
  const transitions = spec.transitions[state.id] || {};
  const handlers = [];

  for (const [event, transition] of Object.entries(transitions)) {
    const target = typeof transition === 'string' ? transition : transition.target;
    const guard = typeof transition === 'object' ? transition.guard : null;
    const action = typeof transition === 'object' ? transition.action : null;

    handlers.push(`
      case EventType.${event}:
        ${guard ? `if (${guard}(ctx)) {` : ''}
          ${action ? `${action}(ctx, event);` : ''}
          return StateId.${target};
        ${guard ? `}
        return "REMAIN";` : ''}`);
  }

  return handlers.join('\n');
}
```

### Step 3: Generate Transition Hub
```typescript
// src/fsm/TransitionHub.ts
function generateTransitionHub(spec) {
  return `/**
 * Centralized State Transition Hub
 * Single source of truth for all state transitions
 */

import { StateId, EventType, Event, Context } from './types';
import { StateContract } from './contracts';
import { TransitionGuard } from './guards';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

// Import all states
${spec.states.map(s => `import { ${s.id}State } from '../states/${s.id}State';`).join('\n')}

export class TransitionHub {
  private current: StateId = StateId.${spec.initial_state || spec.states[0].id};
  private states: Map<StateId, StateContract>;
  private guards: TransitionGuard;
  private transitionHistory: Array<{from: StateId, event: EventType, to: StateId, timestamp: number}> = [];
  private readonly maxHistorySize = 256;

  constructor(private ctx: Context) {
    // Initialize state registry
    this.states = new Map([
      ${spec.states.map(s => `[StateId.${s.id}, new ${s.id}State()],`).join('\n      ')}
    ]);

    this.guards = new TransitionGuard(spec);

    // Initialize starting state
    this.states.get(this.current)?.init(this.ctx);

    logger.info(\`FSM initialized in state: \${this.current}\`);
  }

  /**
   * Process event and transition to next state
   */
  transition(event: Event): void {
    const startTime = performance.now();
    const currentState = this.states.get(this.current);

    if (!currentState) {
      throw new Error(\`Invalid state: \${this.current}\`);
    }

    // Check current state invariants before processing
    if (!currentState.checkInvariants(this.ctx)) {
      const errors = currentState.getInvariantErrors(this.ctx);
      logger.error(\`State invariant violated in \${this.current}: \${errors.join(', ')}\`);
      this.handleInvariantViolation(errors);
    }

    // Get next state from current state's update
    const next = currentState.update(this.ctx, event);

    // Process transition if state changes
    if (next !== "REMAIN" && next !== this.current) {
      this.performTransition(next, event);
    }

    // Record metrics
    const duration = performance.now() - startTime;
    metrics.recordTransition(this.current, event.type, next, duration);
  }

  /**
   * Perform actual state transition
   */
  private performTransition(next: StateId, event: Event): void {
    // Validate transition is legal
    if (!this.guards.canTransition(this.current, event.type, next, this.ctx)) {
      const error = this.guards.getGuardError();
      logger.error(\`Illegal transition blocked: \${this.current} -> \${next} via \${event.type}: \${error}\`);

      if (process.env.NODE_ENV === 'development') {
        throw new Error(\`Illegal transition: \${error}\`);
      } else {
        // Production: log and remain in current state
        metrics.recordIllegalTransition(this.current, event.type, next);
        return;
      }
    }

    // Execute transition
    const from = this.current;

    // Shutdown current state
    this.states.get(this.current)?.shutdown(this.ctx);

    // Update current state
    this.current = next;

    // Initialize new state
    this.states.get(this.current)?.init(this.ctx);

    // Record transition history
    this.recordTransition(from, event.type, next);

    // Emit transition event for observability
    this.emitTransitionEvent(from, event.type, next);

    logger.info(\`Transitioned: \${from} -> \${next} via \${event.type}\`);
  }

  /**
   * Record transition in rolling history buffer
   */
  private recordTransition(from: StateId, event: EventType, to: StateId): void {
    this.transitionHistory.push({
      from,
      event,
      to,
      timestamp: Date.now()
    });

    // Maintain rolling buffer size
    if (this.transitionHistory.length > this.maxHistorySize) {
      this.transitionHistory.shift();
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): StateId {
    return this.current;
  }

  /**
   * Get transition history
   */
  getTransitionHistory(limit?: number): typeof this.transitionHistory {
    if (limit) {
      return this.transitionHistory.slice(-limit);
    }
    return [...this.transitionHistory];
  }

  /**
   * Debug overlay data
   */
  getDebugInfo(): any {
    return {
      currentState: this.current,
      recentTransitions: this.getTransitionHistory(5),
      stateInvariants: this.states.get(this.current)?.checkInvariants(this.ctx),
      metrics: metrics.getSnapshot()
    };
  }

  /**
   * Handle invariant violations
   */
  private handleInvariantViolation(errors: string[]): void {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(\`State invariant violation: \${errors.join(', ')}\`);
    } else {
      // Production: attempt recovery
      logger.error('Attempting recovery from invariant violation');
      this.transition({ type: EventType.RESET, payload: { reason: 'invariant_violation', errors } });
    }
  }

  /**
   * Emit transition event for external observability
   */
  private emitTransitionEvent(from: StateId, event: EventType, to: StateId): void {
    if (this.ctx.eventEmitter) {
      this.ctx.eventEmitter.emit('fsm:transition', {
        from,
        event,
        to,
        timestamp: Date.now(),
        sessionId: this.ctx.sessionId
      });
    }
  }
}

/* AGENT FOOTER BEGIN */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | ${new Date().toISOString()} | fsm:generate | Generated TransitionHub | OK | ${generateHash()} |
/* AGENT FOOTER END */`;
}
```

### Step 4: Generate Guards
```typescript
// src/fsm/guards.ts
function generateGuards(spec) {
  return `/**
 * Transition Guards
 * Validates all transitions against FSM specification
 */

import { StateId, EventType, Context } from './types';

export class TransitionGuard {
  private legalTransitions: Map<string, Set<string>>;
  private illegalTransitions: Set<string>;
  private guardFunctions: Map<string, (ctx: Context) => boolean>;
  private lastError: string = '';

  constructor(spec: any) {
    this.legalTransitions = new Map();
    this.illegalTransitions = new Set();
    this.guardFunctions = new Map();

    this.buildTransitionMatrix(spec);
    this.registerGuardFunctions(spec);
  }

  /**
   * Check if transition is allowed
   */
  canTransition(from: StateId, event: EventType, to: StateId, ctx: Context): boolean {
    const key = \`\${from}:\${event}\`;
    const transitionKey = \`\${from}:\${event}:\${to}\`;

    // Check if explicitly illegal
    if (this.illegalTransitions.has(transitionKey)) {
      this.lastError = \`Transition explicitly marked as illegal: \${from} -> \${to} via \${event}\`;
      return false;
    }

    // Check if transition exists
    const validTargets = this.legalTransitions.get(key);
    if (!validTargets || !validTargets.has(to)) {
      this.lastError = \`No valid transition from \${from} to \${to} via \${event}\`;
      return false;
    }

    // Check guard function if exists
    const guardKey = \`\${from}:\${event}:\${to}\`;
    const guardFn = this.guardFunctions.get(guardKey);
    if (guardFn && !guardFn(ctx)) {
      this.lastError = \`Guard condition failed for \${from} -> \${to} via \${event}\`;
      return false;
    }

    return true;
  }

  /**
   * Get last guard error
   */
  getGuardError(): string {
    return this.lastError;
  }

  /**
   * Build transition matrix from spec
   */
  private buildTransitionMatrix(spec: any): void {
    // Build legal transitions
    for (const [stateId, transitions] of Object.entries(spec.transitions)) {
      for (const [event, transition] of Object.entries(transitions as any)) {
        const target = typeof transition === 'string' ? transition : transition.target;
        const key = \`\${stateId}:\${event}\`;

        if (!this.legalTransitions.has(key)) {
          this.legalTransitions.set(key, new Set());
        }

        this.legalTransitions.get(key)!.add(target);
      }
    }

    // Build illegal transitions
    if (spec.illegal_transitions) {
      for (const illegal of spec.illegal_transitions) {
        const key = \`\${illegal.from}:\${illegal.event}:\${illegal.to || '*'}\`;
        this.illegalTransitions.add(key);
      }
    }
  }

  /**
   * Register guard functions from spec
   */
  private registerGuardFunctions(spec: any): void {
    // Register built-in guards
    ${generateBuiltInGuards(spec)}

    // Register custom guards from spec
    for (const [stateId, transitions] of Object.entries(spec.transitions)) {
      for (const [event, transition] of Object.entries(transitions as any)) {
        if (typeof transition === 'object' && transition.guard) {
          const target = transition.target;
          const guardKey = \`\${stateId}:\${event}:\${target}\`;

          // Map guard name to function
          this.guardFunctions.set(guardKey, this.createGuardFunction(transition.guard));
        }
      }
    }
  }

  /**
   * Create guard function from name
   */
  private createGuardFunction(guardName: string): (ctx: Context) => boolean {
    // Map common guards
    const guards: Record<string, (ctx: Context) => boolean> = {
      canProcess: (ctx) => ctx.queue && ctx.queue.length > 0,
      canRetry: (ctx) => (ctx.retryCount || 0) < (ctx.maxRetries || 3),
      isAuthenticated: (ctx) => !!ctx.user && ctx.user.authenticated,
      hasPermission: (ctx) => ctx.user?.permissions?.includes('required_permission'),
      // Add more guards as needed
    };

    return guards[guardName] || (() => true);
  }
}

/* AGENT FOOTER BEGIN */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | ${new Date().toISOString()} | fsm:generate | Generated TransitionGuard | OK | ${generateHash()} |
/* AGENT FOOTER END */`;
}
```

### Step 5: Generate Test Suite
```typescript
// tests/fsm/StateMachine.test.ts
function generateTestSuite(spec) {
  return `/**
 * FSM Test Suite
 * Generated from fsm_spec.yaml
 */

import { TransitionHub } from '../../src/fsm/TransitionHub';
import { StateId, EventType, Event, Context } from '../../src/fsm/types';
import { loadTransitionMatrix } from './transition_matrix.json';

describe('State Machine Tests', () => {
  let fsm: TransitionHub;
  let ctx: Context;

  beforeEach(() => {
    ctx = createTestContext();
    fsm = new TransitionHub(ctx);
  });

  describe('Transition Tests', () => {
    // Generate test for each transition
    ${generateTransitionTests(spec)}
  });

  describe('Illegal Transition Tests', () => {
    ${generateIllegalTransitionTests(spec)}
  });

  describe('Guard Tests', () => {
    ${generateGuardTests(spec)}
  });

  describe('State Invariant Tests', () => {
    ${generateInvariantTests(spec)}
  });

  describe('Stepper Tests', () => {
    test('should follow expected state sequence', () => {
      const sequence = [
        { event: EventType.START, expected: StateId.PROCESSING },
        { event: EventType.COMPLETE, expected: StateId.IDLE },
      ];

      for (const step of sequence) {
        fsm.transition({ type: step.event, payload: {} });
        expect(fsm.getCurrentState()).toBe(step.expected);
      }
    });
  });

  describe('Property Tests', () => {
    test('should never reach invalid state with random events', () => {
      const events = Object.values(EventType);
      const validStates = Object.values(StateId);

      for (let i = 0; i < 1000; i++) {
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        fsm.transition({ type: randomEvent, payload: {} });

        const currentState = fsm.getCurrentState();
        expect(validStates).toContain(currentState);
      }
    });
  });

  describe('Performance Tests', () => {
    test('transition should complete within budget', () => {
      const budget = 1; // 1ms
      const start = performance.now();

      fsm.transition({ type: EventType.START, payload: {} });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(budget);
    });
  });
});

/* AGENT FOOTER BEGIN */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | ${new Date().toISOString()} | fsm:generate | Generated test suite | OK | ${generateHash()} |
/* AGENT FOOTER END */`;
}
```

### Step 6: Generate Type Definitions
```typescript
// src/fsm/types.ts
function generateTypes(spec) {
  return `/**
 * FSM Type Definitions
 * Generated from fsm_spec.yaml
 */

// State IDs
export enum StateId {
  ${spec.states.map(s => `${s.id} = "${s.id}",`).join('\n  ')}
}

// Event Types
export enum EventType {
  ${spec.events.map(e => `${e.id} = "${e.id}",`).join('\n  ')}
}

// Event Payload Types
${spec.events.map(e => `
export interface ${e.payload_type || e.id + 'Payload'} {
  // TODO: Define payload structure
  [key: string]: any;
}`).join('\n')}

// Base Event
export interface Event {
  type: EventType;
  payload?: any;
  timestamp?: number;
  source?: string;
}

// Context shared across states
export interface Context {
  // Core context
  sessionId: string;
  startTime: number;

  // User context
  user?: {
    id: string;
    authenticated: boolean;
    permissions?: string[];
  };

  // Application state
  data?: Map<string, any>;

  // Processing state
  queue?: any[];
  retryCount?: number;
  maxRetries?: number;
  error?: Error;

  // Observability
  eventEmitter?: any;
  logger?: any;
  metrics?: any;
}

// State Contract
export interface StateContract {
  init(ctx: Context): void;
  update(ctx: Context, event: Event): StateId | "REMAIN";
  draw?(ctx: Context): void;
  shutdown(ctx: Context): void;
  checkInvariants(ctx: Context): boolean;
  getInvariantErrors(ctx: Context): string[];
}

/* AGENT FOOTER BEGIN */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | ${new Date().toISOString()} | fsm:generate | Generated types | OK | ${generateHash()} |
/* AGENT FOOTER END */`;
}
```

## Example Usage
```bash
# Generate from default spec
/fsm:generate

# Generate for Python
/fsm:generate --lang python --pattern flat

# Generate hierarchical FSM
/fsm:generate --pattern hierarchical --output src/fsm

# Generate minimal version
/fsm:generate --minimal --no-tests
```

## Generated File Structure
```
src/
  fsm/
    types.ts              # Type definitions
    contracts.ts          # State interfaces
    TransitionHub.ts      # Centralized transitions
    guards.ts            # Transition validators
  states/
    IdleState.ts         # One file per state
    ProcessingState.ts
    ErrorState.ts
tests/
  fsm/
    StateMachine.test.ts # Complete test suite
    transition_matrix.json
```

<!-- AGENT FOOTER BEGIN -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
|---------|-----------|-------------|----------------|--------|------|
| 1.0.0 | 2025-01-24T10:35:00Z | FSM Generator | Initial scaffolding generator | OK | b8c3d1 |
<!-- AGENT FOOTER END -->
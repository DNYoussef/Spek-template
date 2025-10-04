/**
 * FallbackTypes.ts - Fallback Chain Type Definitions
 * @stub true
 * @architecture Multi-protocol fallback chain type system
 */

// Protocol states
export enum ProtocolStates {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ACTIVATING = 'ACTIVATING',
  ACTIVE = 'ACTIVE',
  PRIMARY_ACTIVE = 'PRIMARY_ACTIVE',
  SECONDARY_ACTIVE = 'SECONDARY_ACTIVE',
  TERTIARY_ACTIVE = 'TERTIARY_ACTIVE',
  FAILING_OVER = 'FAILING_OVER',
  RECOVERING = 'RECOVERING',
  TESTING = 'TESTING',
  FALLBACK_COMPLETE = 'FALLBACK_COMPLETE',
  ERROR = 'ERROR',
  FAILED = 'FAILED'
}

// Chain events
export enum ChainEvents {
  START_CHAIN = 'START_CHAIN',
  PRIMARY_SUCCESS = 'PRIMARY_SUCCESS',
  PRIMARY_FAILED = 'PRIMARY_FAILED',
  SECONDARY_SUCCESS = 'SECONDARY_SUCCESS',
  SECONDARY_FAILED = 'SECONDARY_FAILED',
  TERTIARY_SUCCESS = 'TERTIARY_SUCCESS',
  TERTIARY_FAILED = 'TERTIARY_FAILED',
  ALL_FAILED = 'ALL_FAILED',
  RESET = 'RESET',
  ANALYZE_REQUEST = 'ANALYZE_REQUEST',
  ACTIVATION_NEEDED = 'ACTIVATION_NEEDED',
  ACTIVATION_COMPLETE = 'ACTIVATION_COMPLETE',
  ACTIVATION_FAILED = 'ACTIVATION_FAILED',
  PROTOCOL_FAILED = 'PROTOCOL_FAILED',
  RECOVERY_STARTED = 'RECOVERY_STARTED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  TESTING_STARTED = 'TESTING_STARTED',
  TESTING_COMPLETE = 'TESTING_COMPLETE',
  TESTING_FAILED = 'TESTING_FAILED',
  DEACTIVATION_REQUESTED = 'DEACTIVATION_REQUESTED',
  DEACTIVATION_COMPLETE = 'DEACTIVATION_COMPLETE',
  ERROR_DETECTED = 'ERROR_DETECTED',
  RESET_SYSTEM = 'RESET_SYSTEM'
}

// Transition context
export interface TransitionContext {
  readonly chainId: string;
  readonly currentProtocol: string;
  readonly attemptCount: number;
  readonly errors: readonly Error[];
  readonly metadata: Record<string, unknown>;
  readonly startTime: number;
  readonly lastAttemptTime: number;
  sourceState?: any;
  targetState?: any;
  event?: ChainEvents | string;
  payload?: any;
  timestamp?: Date;
  protocolId?: string;
}

// State invariants
export interface StateInvariants {
  readonly maxAttempts: number;
  readonly timeoutMs: number;
  readonly protocolOrder: readonly string[];
  readonly requiredValidations: readonly string[];
  validateState?(state: any, context?: any): boolean | Promise<boolean>;
  checkTransitionPreconditions?(context: TransitionContext): boolean | Promise<boolean>;
  verifyPostConditions?(context: TransitionContext): boolean | Promise<boolean>;
}

// Fallback configuration
export interface FallbackConfig {
  readonly primaryProtocol: string;
  readonly secondaryProtocol: string;
  readonly tertiaryProtocol: string;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly invariants: StateInvariants;
}

// Fallback result
export interface FallbackResult {
  readonly success: boolean;
  readonly protocol: string;
  readonly attemptCount: number;
  readonly duration: number;
  readonly error?: Error;
  readonly context: TransitionContext;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===

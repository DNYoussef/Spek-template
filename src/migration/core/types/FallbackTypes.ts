/**
 * FSM-based fallback types and enums.
 * NASA Rule 10 compliant type definitions.
 */

// FSM States for fallback system
export enum ProtocolStates {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ACTIVATING = 'ACTIVATING',
  ACTIVE = 'ACTIVE',
  FAILING_OVER = 'FAILING_OVER',
  RECOVERING = 'RECOVERING',
  TESTING = 'TESTING',
  ERROR = 'ERROR'
}

// FSM Events for state transitions
export enum ChainEvents {
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

// Activation guards for state transitions
export interface ActivationGuards {
  canActivate(protocolId: string, context: any): boolean;
  canFailover(fromProtocol: string, toProtocol: string): boolean;
  canRecover(protocolId: string): boolean;
  canTest(chainId: string): boolean;
}

// FSM transition context
export interface TransitionContext {
  sourceState: ProtocolStates;
  targetState: ProtocolStates;
  event: ChainEvents;
  payload: any;
  timestamp: Date;
  protocolId?: string;
  chainId?: string;
}

// State invariants for validation
export interface StateInvariants {
  validateState(state: ProtocolStates, context: any): boolean;
  checkTransitionPreconditions(context: TransitionContext): boolean;
  verifyPostConditions(context: TransitionContext): boolean;
}

// Error recovery patterns
export interface ErrorRecoveryPattern {
  errorType: string;
  recoveryStrategy: string;
  maxRetries: number;
  backoffMs: number;
  fallbackAction: string;
}

export default {
  ProtocolStates,
  ChainEvents,
  ActivationGuards,
  TransitionContext,
  StateInvariants,
  ErrorRecoveryPattern
};

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fallback-fsm-refactor-001
// inputs: ["FallbackChainManager.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-agent-026"}
// === END FOOTER ===
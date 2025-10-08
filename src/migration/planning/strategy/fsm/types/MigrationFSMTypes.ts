/**
 * FSM Types for Migration Planning System
 * Defines states, events, and data contracts for the migration planning state machine
 */

// Migration Planning States
export enum MigrationPlanningState {
  IDLE = 'IDLE',
  ANALYZING_REQUEST = 'ANALYZING_REQUEST',
  SELECTING_STRATEGY = 'SELECTING_STRATEGY', 
  CREATING_IMPLEMENTATION_PLAN = 'CREATING_IMPLEMENTATION_PLAN',
  GENERATING_MONITORING_PLAN = 'GENERATING_MONITORING_PLAN',
  CREATING_ROLLBACK_PLAN = 'CREATING_ROLLBACK_PLAN',
  ESTIMATING_RESOURCES = 'ESTIMATING_RESOURCES',
  PLANNING_COMMUNICATION = 'PLANNING_COMMUNICATION',
  ENSURING_QUALITY = 'ENSURING_QUALITY',
  FINALIZING_PLAN = 'FINALIZING_PLAN',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

// Migration Planning Events
export enum MigrationPlanningEvent {
  START_PLANNING = 'START_PLANNING',
  REQUEST_VALIDATED = 'REQUEST_VALIDATED',
  REQUEST_INVALID = 'REQUEST_INVALID',
  STRATEGY_SELECTED = 'STRATEGY_SELECTED',
  STRATEGY_FAILED = 'STRATEGY_FAILED',
  IMPLEMENTATION_CREATED = 'IMPLEMENTATION_CREATED',
  IMPLEMENTATION_FAILED = 'IMPLEMENTATION_FAILED',
  MONITORING_CREATED = 'MONITORING_CREATED',
  MONITORING_FAILED = 'MONITORING_FAILED',
  ROLLBACK_CREATED = 'ROLLBACK_CREATED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  RESOURCES_ESTIMATED = 'RESOURCES_ESTIMATED',
  RESOURCES_FAILED = 'RESOURCES_FAILED',
  COMMUNICATION_PLANNED = 'COMMUNICATION_PLANNED',
  COMMUNICATION_FAILED = 'COMMUNICATION_FAILED',
  QUALITY_ENSURED = 'QUALITY_ENSURED',
  QUALITY_FAILED = 'QUALITY_FAILED',
  PLAN_FINALIZED = 'PLAN_FINALIZED',
  PLAN_FAILED = 'PLAN_FAILED',
  RETRY_OPERATION = 'RETRY_OPERATION',
  ABORT_PLANNING = 'ABORT_PLANNING',
  RESET = 'RESET'
}

// FSM Context Data
export interface MigrationPlanningContext {
  request?: MigrationPlanningRequest;
  selectedStrategy?: MigrationApproach;
  implementationPlan?: ImplementationPlan;
  monitoringPlan?: MonitoringPlan;
  rollbackPlan?: RollbackPlan;
  resourcePlan?: ResourcePlan;
  communicationPlan?: CommunicationPlan;
  qualityAssurancePlan?: QualityAssurancePlan;
  finalPlan?: ComprehensiveMigrationPlan;
  error?: Error;
  retryCount: number;
  startTime: Date;
  stateHistory: StateTransition[];
}

// State Transition Record
export interface StateTransition {
  fromState: MigrationPlanningState;
  toState: MigrationPlanningState;
  event: MigrationPlanningEvent;
  timestamp: Date;
  context?: any;
}

// State Handler Contract
export interface StateHandler {
  init(): Promise<void>;
  update(context: MigrationPlanningContext): Promise<StateResult>;
  shutdown(): Promise<void>;
  checkInvariants(context: MigrationPlanningContext): boolean;
}

// State Processing Result
export interface StateResult {
  nextEvent: MigrationPlanningEvent;
  updatedContext: MigrationPlanningContext;
  sideEffects?: SideEffect[];
}

// Side Effects for State Processing
export interface SideEffect {
  type: 'emit' | 'log' | 'metric' | 'notification';
  payload: any;
}

// Transition Guard Contract
export interface TransitionGuard {
  canTransition(
    fromState: MigrationPlanningState,
    toState: MigrationPlanningState,
    event: MigrationPlanningEvent,
    context: MigrationPlanningContext
  ): boolean;
}

// Re-export types from original implementation
export * from '../../../MigrationPlanner';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: migration-fsm-types-001
// inputs: ["MigrationPlanner.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4-20250514","prompt":"migration-fsm-refactor-v1"}
// === END FOOTER ===

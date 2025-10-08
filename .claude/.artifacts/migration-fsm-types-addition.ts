// APPEND TO END OF src/migration/fsm/types/MigrationFSMTypes.ts
// Additional types for migration planning strategy FSM

// State result type for FSM state handlers
export interface StateResult {
  success: boolean;
  nextState?: string;
  data?: unknown;
  error?: string;
  sideEffects?: SideEffect[];
}

// Migration planning events (subset specific to planning)
export enum MigrationPlanningEvent {
  ANALYZE_REQUEST = 'ANALYZE_REQUEST',
  REQUEST_ANALYZED = 'REQUEST_ANALYZED',
  SELECT_STRATEGY = 'SELECT_STRATEGY',
  STRATEGY_SELECTED = 'STRATEGY_SELECTED',
  GENERATE_PLAN = 'GENERATE_PLAN',
  PLAN_GENERATED = 'PLAN_GENERATED',
  VALIDATE_PLAN = 'VALIDATE_PLAN',
  PLAN_VALIDATED = 'PLAN_VALIDATED',
  PLANNING_FAILED = 'PLANNING_FAILED',
  PLANNING_COMPLETE = 'PLANNING_COMPLETE'
}

// Side effects for state transitions
export interface SideEffect {
  type: 'log' | 'notify' | 'persist' | 'trigger' | 'rollback';
  payload: unknown;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
}

// Migration planning state enum
export enum MigrationPlanningState {
  IDLE = 'IDLE',
  ANALYZING_REQUEST = 'ANALYZING_REQUEST',
  SELECTING_STRATEGY = 'SELECTING_STRATEGY',
  GENERATING_PLAN = 'GENERATING_PLAN',
  VALIDATING_PLAN = 'VALIDATING_PLAN',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Migration planning request
export interface MigrationPlanningRequest {
  requestId: string;
  sourceSystem: string;
  targetSystem: string;
  scope: string[];
  constraints: Record<string, unknown>;
  preferences?: MigrationPreferences;
  metadata?: Record<string, unknown>;
}

export interface MigrationPreferences {
  riskTolerance: 'low' | 'medium' | 'high';
  downtime: {
    maxMinutes: number;
    preferredWindow?: string;
  };
  rollbackStrategy: 'automatic' | 'manual' | 'none';
}

// Migration approach
export interface MigrationApproach {
  id: string;
  name: string;
  description: string;
  phases: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  prerequisites: string[];
  benefits: string[];
  drawbacks: string[];
}

// Alternative approach
export interface AlternativeApproach extends MigrationApproach {
  comparisonToSelected: {
    timeDelta: number;
    riskDelta: number;
    costDelta: number;
    reasons: string[];
  };
}

// Transition guard type
export interface TransitionGuard {
  check: (context: unknown) => boolean;
  errorMessage?: string;
}

// APPEND TO END of src/analysis/core/types/AnalysisTypes.ts
// Additional types for migration planning FSM

// State machine configuration
export interface StateMachineConfig {
  initialState: string;
  states: Map<string, StateHandler>;
  transitions: StateTransition[];
  context: unknown;
  guards?: Map<string, TransitionGuard>;
  actions?: Map<string, TransitionAction>;
}

// State handler interface (already partially defined, this extends it)
export interface StateHandler {
  name: string;
  onEnter?(context: unknown): Promise<void>;
  onExit?(context: unknown): Promise<void>;
  tick?(context: unknown): Promise<string | null>;
  canExit?(context: unknown): boolean;
  checkInvariants?(context: unknown): boolean;
}

// State transition definition
export interface StateTransition {
  from: string;
  to: string;
  event: string;
  guard?: TransitionGuard;
  action?: TransitionAction;
}

// State transition record for history
export interface StateTransitionRecord {
  from: string;
  to: string;
  event: string;
  timestamp: Date;
  context?: unknown;
  success: boolean;
  error?: string;
}

// Transition guard function
export interface TransitionGuard {
  check: (context: unknown, event: unknown) => boolean;
  errorMessage?: string;
}

// Transition action function
export interface TransitionAction {
  execute: (context: unknown, event: unknown) => Promise<void>;
  rollback?: (context: unknown) => Promise<void>;
}

// Comprehensive migration plan
export interface ComprehensiveMigrationPlan {
  planId: string;
  name: string;
  description: string;
  phases: MigrationPhase[];
  riskAssessment: RiskAnalysisResult;
  dependencyAnalysis: DependencyAnalysisResult;
  validationChecks: ValidationCheck[];
  estimatedDuration: number;
  resources: ResourceRequirement[];
  rollbackPlan: RollbackPlan;
  approvals: Approval[];
  createdAt: Date;
  updatedAt: Date;
}

// Validation check definition
export interface ValidationCheck {
  id: string;
  name: string;
  type: 'prerequisite' | 'runtime' | 'postcheck';
  check: (context: unknown) => Promise<boolean>;
  errorMessage: string;
  blocking: boolean;
  retryable: boolean;
}

// Supporting types referenced above
export interface MigrationPhase {
  id: string;
  name: string;
  steps: string[];
  estimatedDuration: number;
}

export interface ResourceRequirement {
  type: string;
  amount: number;
  unit: string;
}

export interface RollbackPlan {
  steps: string[];
  estimatedTime: number;
  automatable: boolean;
}

export interface Approval {
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: Date;
}

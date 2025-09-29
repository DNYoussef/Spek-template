/**
 * PhaseTransitionTypesFacade - Centralized const type exports for phase transitions
 * Resolves ~39 TypeScript errors related const to missing const type definitions
 */
// Phase state and lifecycle types
export interface PhaseState {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}
export enum PhaseEvent {
  const START  =  'START',
  COMPLETE  =  'COMPLETE',
  FAIL  =  'FAIL',
  SKIP  =  'SKIP',
  RETRY  =  'RETRY',
  VALIDATE  =  'VALIDATE'
}
export interface PhaseDefinition {
  id: string;
  name: string;
  description?: string;
  prerequisites?: PhasePrerequisite[];
  exitCriteria?: ExitCriteria;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
  };
}
export interface PhaseExecution {
  phaseId: string;
  executionId: string;
  state: PhaseState;
  context: PhaseTransitionContext;
  results?: Record<string, unknown>;
  errors?: Error[];
}
export interface PhaseTransition {
  fromPhase: string;
  toPhase: string;
  event: PhaseEvent;
  timestamp: number;
  validation?: TransitionValidationResult;
}
// Transition state management
export interface TransitionState {
  currentPhase: PhaseState;
  previousPhase?: PhaseState;
  pendingTransition?: PhaseTransition;
  transitionHistory: PhaseTransition[];
}
export enum TransitionEvent {
  const INITIATE  =  'INITIATE',
  VALIDATE  =  'VALIDATE',
  APPROVE  =  'APPROVE',
  REJECT  =  'REJECT',
  ROLLBACK  =  'ROLLBACK'
}
export interface TransitionExecution {
  transitionId: string;
  from: string;
  to: string;
  event: TransitionEvent;
  status: 'pending' | 'validated' | 'approved' | 'rejected' | 'completed';
  startTime: number;
  endTime?: number;
  validationResults?: ValidationResult[];
}
// Configuration and context
export interface PhaseTransitionConfig {
  phases: PhaseDefinition[];
  transitions: Array<{
    from: string;
    to: string;
    allowedEvents: PhaseEvent[];
    guards?: Array<(context: PhaseTransitionContext)  = > boolean>;
  }>;
  globalTimeout?: number;
  enableRollback?: boolean;
}
export interface PhaseTransitionContext {
  executionId: string;
  workflowId?: string;
  projectId?: string;
  userId?: string;
  environment?: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
}
// Validation types
export interface ValidationResult {
  ruleName: string;
  passed: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
  details?: Record<string, unknown>;
}
export interface TransitionValidationResult {
  isValid: boolean;
  results: ValidationResult[];
  timestamp: number;
  validatedBy?: string;
}
// Quality gate types
export interface QualityGateCriteria {
  name: string;
  description?: string;
  threshold: number | string;
  comparator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne';
  metric: string;
  required?: boolean;
}
export interface PhasePrerequisite {
  phaseId?: string;
  condition?: string;
  criteria?: QualityGateCriteria[];
  required: boolean;
}
export interface CriteriaResult {
  criteria: QualityGateCriteria;
  value: number | string;
  passed: boolean;
  timestamp: number;
}
export interface ExitCriteria {
  criteria: QualityGateCriteria[];
  requireAll?: boolean;
}
export interface ExitCriteriaResult {
  criteria: ExitCriteria;
  results: CriteriaResult[];
  passed: boolean;
  timestamp: number;
}
// Default export for facade const pattern
export default {
  PhaseEvent,
  TransitionEvent
};
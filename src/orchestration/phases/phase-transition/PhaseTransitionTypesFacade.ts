import { ValidationResult } from '../../../types/validation-types';

/**
 * PhaseTransitionTypesFacade - Centralized type exports for phase transitions
 * Resolves ~39 TypeScript errors related to missing type definitions
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
  START  =  'START',
  START_PHASE  =  'START_PHASE', // Explicit phase start
  COMPLETE  =  'COMPLETE',
  FAIL  =  'FAIL',
  SKIP  =  'SKIP',
  RETRY  =  'RETRY',
  VALIDATE  =  'VALIDATE',
  CANCEL_PHASE  =  'CANCEL_PHASE' // Phase cancellation
}
export interface PhaseDefinition {
  id: string;
  phaseId?: string; // Alias for id (backward compatibility)
  name: string;
  description?: string;
  prerequisites?: PhasePrerequisite[];
  exitCriteria?: ExitCriteria;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
  };
  qualityGates?: QualityGateCriteria[]; // Quality gates for phase
}
export interface PhaseExecution {
  phaseId: string;
  executionId: string;
  state: PhaseState;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'; // Execution status
  context: PhaseTransitionContext;
  results?: Record<string, unknown>;
  errors?: Error[];
  endTime?: number; // Execution end timestamp
}
export interface PhaseTransition {
  fromPhase: string;
  toPhase: string;
  event: PhaseEvent;
  timestamp: number;
  validation?: TransitionValidationResult;
  transitionId?: string; // Unique transition identifier
}
// Transition state management
export interface TransitionState {
  currentPhase: PhaseState;
  previousPhase?: PhaseState;
  pendingTransition?: PhaseTransition;
  transitionHistory: PhaseTransition[];
}
export enum TransitionEvent {
  INITIATE  =  'INITIATE',
  START_TRANSITION  =  'START_TRANSITION', // Explicit transition start
  VALIDATE  =  'VALIDATE',
  APPROVE  =  'APPROVE',
  REJECT  =  'REJECT',
  ROLLBACK  =  'ROLLBACK'
}
export interface TransitionExecution {
  transitionId: string;
  executionId?: string; // Execution identifier (may differ from transitionId)
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
    guards?: Array<(context: PhaseTransitionContext)  => boolean>;
  }>;
  globalTimeout?: number;
  enableRollback?: boolean;
  MAX_CONCURRENT_PHASES?: number; // Maximum concurrent phases allowed
  MAX_CONCURRENT_TRANSITIONS?: number; // Maximum concurrent transitions allowed
  MONITORING_INTERVAL?: number; // Monitoring interval in milliseconds
  VALIDATION_TIMEOUT?: number; // Validation timeout in milliseconds
  TRANSITION_TIMEOUT?: number; // Transition timeout in milliseconds
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

export interface TransitionValidationResult {
  isValid: boolean;
  passed?: boolean; // Alias for isValid (backward compatibility)
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
  criteriaId?: string; // Unique criteria identifier
  category?: 'quality' | 'performance' | 'security' | 'compliance'; // Criteria category
}
export interface PhasePrerequisite {
  phaseId?: string;
  prerequisiteId?: string; // Unique prerequisite identifier
  condition?: string;
  criteria?: QualityGateCriteria[];
  required: boolean;
  blocking?: boolean; // Whether prerequisite is blocking
  type?: 'phase' | 'condition' | 'criteria' | 'manual'; // Prerequisite type
  timeout?: number; // Timeout for prerequisite validation
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
  length?: number; // Number of criteria (for array-like access)
  weight?: number; // Overall weight of criteria
  type?: 'quality' | 'performance' | 'security' | 'compliance'; // Criteria type
  requirement?: 'all' | 'any' | 'majority'; // Requirement mode
}
export interface ExitCriteriaResult {
  criteria: ExitCriteria;
  results: CriteriaResult[];
  passed: boolean;
  timestamp: number;
}
// Default export for facade pattern
export default {
  PhaseEvent,
  TransitionEvent
};
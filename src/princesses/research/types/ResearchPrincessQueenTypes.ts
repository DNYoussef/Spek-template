/**
 * ResearchPrincessQueenTypes - FSM Types for Princess-Queen Integration
 * Defines states, events, and data structures for FSM-based hierarchy communication
 */

// Princess-Queen Integration States
export enum PrincessQueenState {
  IDLE = 'idle',
  ORDER_RECEIVED = 'order_received',
  RESOURCE_VALIDATION = 'resource_validation',
  ORDER_EXECUTION = 'order_execution',
  PROGRESS_REPORTING = 'progress_reporting',
  RESULT_SYNTHESIS = 'result_synthesis',
  QUALITY_ASSESSMENT = 'quality_assessment',
  REPORT_SUBMISSION = 'report_submission',
  ESCALATION_HANDLING = 'escalation_handling',
  FAILED = 'failed',
  COMPLETED = 'completed'
}

// Princess-Queen Communication Events
export enum PrincessQueenEvent {
  ORDER_RECEIVED = 'ORDER_RECEIVED',
  RESOURCES_VALIDATED = 'RESOURCES_VALIDATED',
  RESOURCES_INSUFFICIENT = 'RESOURCES_INSUFFICIENT',
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  SYNTHESIS_COMPLETED = 'SYNTHESIS_COMPLETED',
  QUALITY_APPROVED = 'QUALITY_APPROVED',
  QUALITY_REJECTED = 'QUALITY_REJECTED',
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  ESCALATION_REQUIRED = 'ESCALATION_REQUIRED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RETRY_REQUESTED = 'RETRY_REQUESTED',
  RESET_TO_IDLE = 'RESET_TO_IDLE'
}

// Resource Coordination States
export enum ResourceState {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  ALLOCATED = 'allocated',
  EXHAUSTED = 'exhausted',
  RECOVERING = 'recovering'
}

// Quality Assessment States
export enum QualityState {
  PENDING = 'pending',
  ASSESSING = 'assessing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_IMPROVEMENT = 'requires_improvement'
}

// FSM Context for Princess-Queen Integration
export interface PrincessQueenContext {
  currentOrder?: any;
  resourceAllocation?: any;
  executionProgress?: number;
  qualityMetrics?: any;
  escalations?: any[];
  lastUpdate?: number;
  retryCount?: number;
  maxRetries?: number;
  timeoutThreshold?: number;
}

// State transition guard conditions
export interface StateGuards {
  hasValidResources: (context: PrincessQueenContext) => boolean;
  hasActiveOrder: (context: PrincessQueenContext) => boolean;
  isQualityAcceptable: (context: PrincessQueenContext) => boolean;
  shouldEscalate: (context: PrincessQueenContext) => boolean;
  canRetry: (context: PrincessQueenContext) => boolean;
}

// NASA Rule 10 Compliant Loop Bounds
export const NASA_LOOP_LIMITS = {
  MAX_RESERVATIONS_SCAN: 100,
  MAX_USAGE_HISTORY_SCAN: 50,
  MAX_FSMS_HEARTBEAT_CHECK: 20,
  MAX_PENDING_TRANSITIONS_SCAN: 30,
  MAX_RETRY_ATTEMPTS: 3,
  MAX_QUALITY_ITERATIONS: 10,
  MAX_RESOURCE_ALLOCATION_ATTEMPTS: 5
} as const;
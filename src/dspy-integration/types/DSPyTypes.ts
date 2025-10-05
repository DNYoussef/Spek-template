import { ValidationResult } from '../../types/validation-types';

/**
 * DSPy Integration Type Definitions
 * 
 * Core types for DSPy signature validation and execution system
 * with FSM state management and NASA Rule 10 compliance.
 */

// NASA Rule 10: Enum-based states and events (no string literals)
export enum DSPyEngineState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY', 
  LEARNING = 'LEARNING',
  OPTIMIZING = 'OPTIMIZING',
  VALIDATING = 'VALIDATING',
  DEPLOYING = 'DEPLOYING',
  MONITORING = 'MONITORING',
  ERROR_RECOVERY = 'ERROR_RECOVERY'
}

export enum DSPyEngineEvent {
  START_INITIALIZATION = 'START_INITIALIZATION',
  INITIALIZATION_COMPLETE = 'INITIALIZATION_COMPLETE',
  OPTIMIZATION_REQUEST = 'OPTIMIZATION_REQUEST',
  LEARNING_COMPLETE = 'LEARNING_COMPLETE',
  OPTIMIZATION_COMPLETE = 'OPTIMIZATION_COMPLETE',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  DEPLOYMENT_COMPLETE = 'DEPLOYMENT_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  SHUTDOWN_REQUEST = 'SHUTDOWN_REQUEST'
}

export enum OptimizationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED'
}

export enum ValidationOutcome {
  IMPROVED = 'IMPROVED',
  DEGRADED = 'DEGRADED',
  UNCHANGED = 'UNCHANGED',
  INCONCLUSIVE = 'INCONCLUSIVE'
}

// Core DSPy interfaces
export interface DSPySignature {
  readonly id: string;
  readonly name: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema: Record<string, unknown>;
  readonly examples: SignatureExample[];
  readonly version: number;
  readonly createdAt: Date;
  readonly lastModified: Date;
}

export interface SignatureExample {
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
  readonly quality: number; // 0-1 quality score
  readonly source: string;
}

export interface OptimizationRequest {
  readonly signatureId: string;
  readonly targetMetrics: PerformanceMetrics;
  readonly maxIterations: number;
  readonly timeout: number; // Fixed timeout bound for NASA compliance
}

export interface OptimizedResult {
  readonly original: DSPySignature;
  readonly optimized: DSPySignature;
  readonly metrics: PerformanceMetrics;
  readonly validationResults: ValidationResult[];
  readonly confidence: number;
  readonly improvementFactor: number;
}

export interface PerformanceMetrics {
  readonly accuracy: number;
  readonly latency: number;
  readonly tokenCount: number;
  readonly cost: number;
  readonly qualityScore: number;
  readonly timestamp: Date;
}


// FSM Transition types
export interface StateTransition {
  readonly fromState: DSPyEngineState;
  readonly event: DSPyEngineEvent;
  readonly toState: DSPyEngineState;
  readonly guard?: (context: EngineContext) => boolean;
  readonly action?: (context: EngineContext) => Promise<void>;
}

export interface EngineContext {
  readonly currentState: DSPyEngineState;
  readonly signatures: Map<string, DSPySignature>;
  readonly activeOptimizations: Map<string, OptimizationRequest>;
  readonly metrics: PerformanceMetrics[];
  readonly errors: EngineError[];
  readonly config: EngineConfiguration;
}

export interface EngineConfiguration {
  readonly maxConcurrentOptimizations: number;
  readonly defaultTimeout: number;
  readonly qualityThreshold: number;
  readonly maxRetries: number;
  readonly enableTheaterDetection: boolean;
  readonly theaterThreshold: number;
}

export interface EngineError {
  readonly id: string;
  readonly timestamp: Date;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly message: string;
  readonly stack?: string;
  readonly context: Record<string, unknown>;
}

// Quality gate integration types
export interface QualityGateMetrics {
  readonly communicationQuality: number;
  readonly optimizationEffectiveness: number;
  readonly theaterDetectionScore: number;
  readonly contextRelevance: number;
  readonly performanceImprovement: number;
}

export interface TheaterDetectionResult {
  readonly score: number; // 0-100, lower is better
  readonly patterns: TheaterPattern[];
  readonly confidence: number;
  readonly recommendation: string;
}

export interface TheaterPattern {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly description: string;
  readonly location: string;
  readonly evidence: string[];
}

// A/B Testing types
export interface ABTestConfiguration {
  readonly testId: string;
  readonly baselineSignature: DSPySignature;
  readonly optimizedSignature: DSPySignature;
  readonly trafficSplit: number; // 0-1, percentage to optimized
  readonly duration: number; // Fixed duration bound
  readonly successCriteria: SuccessCriteria;
}

export interface SuccessCriteria {
  readonly minSampleSize: number;
  readonly minConfidenceLevel: number;
  readonly minImprovement: number;
  readonly maxRegressionTolerance: number;
}

export interface ABTestResult {
  readonly testId: string;
  readonly status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  readonly baselineMetrics: PerformanceMetrics;
  readonly optimizedMetrics: PerformanceMetrics;
  readonly statisticalSignificance: number;
  readonly recommendation: 'DEPLOY' | 'ROLLBACK' | 'CONTINUE' | 'ABORT';
  readonly sampleSize: number;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-types-init-001
// inputs: ["project-requirements"]
// tools_used: ["filesystem", "multiedit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
// === END FOOTER ===
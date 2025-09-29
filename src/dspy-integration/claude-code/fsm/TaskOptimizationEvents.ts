/**
 * Task Optimization FSM Events
 * NASA Rule 10 Compliant - Enum-based events and payloads
 *
 * REQUIREMENTS:
 * - No string literals for events (enum only)
 * - Type-safe event payloads
 * - Bounded event data structures
 * - Explicit validation contracts
 */

/**
 * Core optimization events for state transitions
 */
export enum TaskOptimizationEvent {
  // Initialization events
  INITIALIZE = 'INITIALIZE',
  SETUP_COMPLETE = 'SETUP_COMPLETE',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',

  // Analysis events
  START_ANALYSIS = 'START_ANALYSIS',
  PROMPT_ANALYZED = 'PROMPT_ANALYZED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',

  // Generation events
  START_GENERATION = 'START_GENERATION',
  CANDIDATE_GENERATED = 'CANDIDATE_GENERATED',
  GENERATION_COMPLETE = 'GENERATION_COMPLETE',
  GENERATION_FAILED = 'GENERATION_FAILED',

  // Evaluation events
  START_EVALUATION = 'START_EVALUATION',
  QUALITY_EVALUATED = 'QUALITY_EVALUATED',
  EVALUATION_COMPLETE = 'EVALUATION_COMPLETE',
  EVALUATION_FAILED = 'EVALUATION_FAILED',

  // Optimization events
  START_OPTIMIZATION = 'START_OPTIMIZATION',
  OPTIMIZATION_ITERATION = 'OPTIMIZATION_ITERATION',
  OPTIMIZATION_CONVERGED = 'OPTIMIZATION_CONVERGED',
  OPTIMIZATION_COMPLETE = 'OPTIMIZATION_COMPLETE',
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',

  // Validation events
  START_VALIDATION = 'START_VALIDATION',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Deployment events
  START_DEPLOYMENT = 'START_DEPLOYMENT',
  DEPLOYMENT_READY = 'DEPLOYMENT_READY',
  DEPLOYMENT_COMPLETE = 'DEPLOYMENT_COMPLETE',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',

  // Monitoring events
  START_MONITORING = 'START_MONITORING',
  METRIC_UPDATED = 'METRIC_UPDATED',
  MONITORING_COMPLETE = 'MONITORING_COMPLETE',
  MONITORING_FAILED = 'MONITORING_FAILED',

  // Error and recovery events
  ERROR_DETECTED = 'ERROR_DETECTED',
  RECOVERY_STARTED = 'RECOVERY_STARTED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  RECOVERY_FAILED = 'RECOVERY_FAILED',

  // Completion events
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',

  // System events
  TIMEOUT = 'TIMEOUT',
  ABORT = 'ABORT',
  RESET = 'RESET'
}

/**
 * Event payload base interface
 */
export interface BaseEventPayload {
  readonly timestamp: Date;
  readonly eventId: string;
  readonly source: string;
}

/**
 * Initialization event payload
 */
export interface InitializeEventPayload extends BaseEventPayload {
  agentType: string;
  originalPrompt: string;
  contextDNA: Record<string, any>;
  optimizationCriteria: string[];
}

/**
 * Analysis event payload
 */
export interface AnalysisEventPayload extends BaseEventPayload {
  promptComplexity: number;
  extractedFeatures: string[];
  analysisResults: Record<string, number>;
}

/**
 * Generation event payload
 */
export interface GenerationEventPayload extends BaseEventPayload {
  candidatePrompt: string;
  generationStrategy: string;
  qualityEstimate: number;
}

/**
 * Evaluation event payload
 */
export interface EvaluationEventPayload extends BaseEventPayload {
  candidateId: string;
  qualityScores: Record<string, number>;
  overallScore: number;
  passingThreshold: number;
}

/**
 * Optimization event payload
 */
export interface OptimizationEventPayload extends BaseEventPayload {
  iteration: number;
  improvement: number;
  convergenceScore: number;
  algorithmUsed: string;
}

/**
 * Validation event payload
 */
export interface ValidationEventPayload extends BaseEventPayload {
  testName: string;
  testResult: boolean;
  score: number;
  validationCriteria: string[];
}

/**
 * Deployment event payload
 */
export interface DeploymentEventPayload extends BaseEventPayload {
  optimizedPrompt: string;
  deploymentTarget: string;
  rollbackPlan: string;
  deploymentStatus: string;
}

/**
 * Monitoring event payload
 */
export interface MonitoringEventPayload extends BaseEventPayload {
  metricName: string;
  metricValue: number;
  threshold: number;
  alertLevel: 'INFO' | 'WARN' | 'ERROR';
}

/**
 * Error event payload
 */
export interface ErrorEventPayload extends BaseEventPayload {
  errorType: string;
  errorMessage: string;
  errorDetails: Record<string, any>;
  recoverable: boolean;
}

/**
 * Recovery event payload
 */
export interface RecoveryEventPayload extends BaseEventPayload {
  recoveryStrategy: string;
  attemptNumber: number;
  maxAttempts: number;
  recoveryData: Record<string, any>;
}

/**
 * Completion event payload
 */
export interface CompletionEventPayload extends BaseEventPayload {
  finalResult: string;
  optimizationMetrics: Record<string, number>;
  executionTime: number;
  successRate: number;
}

/**
 * Union type for all event payloads
 */
export type TaskOptimizationEventPayload =
  | InitializeEventPayload
  | AnalysisEventPayload
  | GenerationEventPayload
  | EvaluationEventPayload
  | OptimizationEventPayload
  | ValidationEventPayload
  | DeploymentEventPayload
  | MonitoringEventPayload
  | ErrorEventPayload
  | RecoveryEventPayload
  | CompletionEventPayload
  | BaseEventPayload;

/**
 * Event validation utilities with NASA Rule 10 compliance
 */
export class EventValidator {
  private static readonly MAX_PAYLOAD_SIZE = 1024 * 10; // 10KB limit
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_ARRAY_LENGTH = 100;

  /**
   * Validate event payload with bounds checking
   * @param event Event type
   * @param payload Event payload
   * @returns Validation result
   */
  static validateEvent(
    event: TaskOptimizationEvent,
    payload: TaskOptimizationEventPayload
  ): boolean {
    // NASA Rule 10: Assertions for validation
    if (!event || !payload) {
      return false;
    }

    // Check payload size bounds
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > EventValidator.MAX_PAYLOAD_SIZE) {
      return false;
    }

    // Validate timestamp
    if (!payload.timestamp || !(payload.timestamp instanceof Date)) {
      return false;
    }

    // Validate event ID and source
    if (!payload.eventId || payload.eventId.length === 0 ||
        !payload.source || payload.source.length === 0) {
      return false;
    }

    // Event-specific validation
    return EventValidator.validateEventSpecific(event, payload);
  }

  /**
   * Event-specific validation with fixed bounds
   * @param event Event type
   * @param payload Event payload
   * @returns Validation result
   */
  private static validateEventSpecific(
    event: TaskOptimizationEvent,
    payload: TaskOptimizationEventPayload
  ): boolean {
    switch (event) {
      case TaskOptimizationEvent.INITIALIZE:
        return EventValidator.validateInitializePayload(payload as InitializeEventPayload);

      case TaskOptimizationEvent.PROMPT_ANALYZED:
        return EventValidator.validateAnalysisPayload(payload as AnalysisEventPayload);

      case TaskOptimizationEvent.CANDIDATE_GENERATED:
        return EventValidator.validateGenerationPayload(payload as GenerationEventPayload);

      case TaskOptimizationEvent.QUALITY_EVALUATED:
        return EventValidator.validateEvaluationPayload(payload as EvaluationEventPayload);

      case TaskOptimizationEvent.OPTIMIZATION_ITERATION:
        return EventValidator.validateOptimizationPayload(payload as OptimizationEventPayload);

      case TaskOptimizationEvent.VALIDATION_PASSED:
      case TaskOptimizationEvent.VALIDATION_FAILED:
        return EventValidator.validateValidationPayload(payload as ValidationEventPayload);

      case TaskOptimizationEvent.DEPLOYMENT_COMPLETE:
        return EventValidator.validateDeploymentPayload(payload as DeploymentEventPayload);

      case TaskOptimizationEvent.METRIC_UPDATED:
        return EventValidator.validateMonitoringPayload(payload as MonitoringEventPayload);

      case TaskOptimizationEvent.ERROR_DETECTED:
        return EventValidator.validateErrorPayload(payload as ErrorEventPayload);

      case TaskOptimizationEvent.RECOVERY_STARTED:
        return EventValidator.validateRecoveryPayload(payload as RecoveryEventPayload);

      case TaskOptimizationEvent.TASK_COMPLETED:
      case TaskOptimizationEvent.TASK_FAILED:
        return EventValidator.validateCompletionPayload(payload as CompletionEventPayload);

      default:
        return true; // Base validation passed
    }
  }

  /**
   * Validate initialize payload
   */
  private static validateInitializePayload(payload: InitializeEventPayload): boolean {
    const agentTypeValid = payload.agentType &&
                          payload.agentType.length > 0 &&
                          payload.agentType.length <= EventValidator.MAX_STRING_LENGTH;

    const promptValid = payload.originalPrompt &&
                       payload.originalPrompt.length > 0 &&
                       payload.originalPrompt.length <= EventValidator.MAX_STRING_LENGTH * 10;

    const criteriaValid = payload.optimizationCriteria &&
                         payload.optimizationCriteria.length <= EventValidator.MAX_ARRAY_LENGTH;

    return agentTypeValid && promptValid && criteriaValid;
  }

  /**
   * Validate analysis payload
   */
  private static validateAnalysisPayload(payload: AnalysisEventPayload): boolean {
    const complexityValid = payload.promptComplexity >= 0 && payload.promptComplexity <= 1;
    const featuresValid = payload.extractedFeatures &&
                         payload.extractedFeatures.length <= EventValidator.MAX_ARRAY_LENGTH;
    const resultsValid = payload.analysisResults &&
                        Object.keys(payload.analysisResults).length <= 50;

    return complexityValid && featuresValid && resultsValid;
  }

  /**
   * Validate generation payload
   */
  private static validateGenerationPayload(payload: GenerationEventPayload): boolean {
    const candidateValid = payload.candidatePrompt &&
                          payload.candidatePrompt.length > 0 &&
                          payload.candidatePrompt.length <= EventValidator.MAX_STRING_LENGTH * 10;

    const strategyValid = payload.generationStrategy &&
                         payload.generationStrategy.length > 0;

    const estimateValid = payload.qualityEstimate >= 0 && payload.qualityEstimate <= 1;

    return candidateValid && strategyValid && estimateValid;
  }

  /**
   * Validate evaluation payload
   */
  private static validateEvaluationPayload(payload: EvaluationEventPayload): boolean {
    const idValid = payload.candidateId && payload.candidateId.length > 0;
    const scoresValid = payload.qualityScores &&
                       Object.keys(payload.qualityScores).length <= 20;
    const overallValid = payload.overallScore >= 0 && payload.overallScore <= 1;
    const thresholdValid = payload.passingThreshold >= 0 && payload.passingThreshold <= 1;

    return idValid && scoresValid && overallValid && thresholdValid;
  }

  /**
   * Validate optimization payload
   */
  private static validateOptimizationPayload(payload: OptimizationEventPayload): boolean {
    const iterationValid = payload.iteration >= 0 && payload.iteration <= 1000;
    const improvementValid = payload.improvement >= -1 && payload.improvement <= 1;
    const convergenceValid = payload.convergenceScore >= 0 && payload.convergenceScore <= 1;
    const algorithmValid = payload.algorithmUsed && payload.algorithmUsed.length > 0;

    return iterationValid && improvementValid && convergenceValid && algorithmValid;
  }

  /**
   * Validate validation payload
   */
  private static validateValidationPayload(payload: ValidationEventPayload): boolean {
    const nameValid = payload.testName && payload.testName.length > 0;
    const scoreValid = payload.score >= 0 && payload.score <= 1;
    const criteriaValid = payload.validationCriteria &&
                         payload.validationCriteria.length <= EventValidator.MAX_ARRAY_LENGTH;

    return nameValid && scoreValid && criteriaValid;
  }

  /**
   * Validate deployment payload
   */
  private static validateDeploymentPayload(payload: DeploymentEventPayload): boolean {
    const promptValid = payload.optimizedPrompt && payload.optimizedPrompt.length > 0;
    const targetValid = payload.deploymentTarget && payload.deploymentTarget.length > 0;
    const planValid = payload.rollbackPlan && payload.rollbackPlan.length > 0;
    const statusValid = payload.deploymentStatus && payload.deploymentStatus.length > 0;

    return promptValid && targetValid && planValid && statusValid;
  }

  /**
   * Validate monitoring payload
   */
  private static validateMonitoringPayload(payload: MonitoringEventPayload): boolean {
    const nameValid = payload.metricName && payload.metricName.length > 0;
    const valueValid = !isNaN(payload.metricValue) && isFinite(payload.metricValue);
    const thresholdValid = !isNaN(payload.threshold) && isFinite(payload.threshold);
    const alertValid = ['INFO', 'WARN', 'ERROR'].includes(payload.alertLevel);

    return nameValid && valueValid && thresholdValid && alertValid;
  }

  /**
   * Validate error payload
   */
  private static validateErrorPayload(payload: ErrorEventPayload): boolean {
    const typeValid = payload.errorType && payload.errorType.length > 0;
    const messageValid = payload.errorMessage && payload.errorMessage.length > 0;
    const recoverableValid = typeof payload.recoverable === 'boolean';

    return typeValid && messageValid && recoverableValid;
  }

  /**
   * Validate recovery payload
   */
  private static validateRecoveryPayload(payload: RecoveryEventPayload): boolean {
    const strategyValid = payload.recoveryStrategy && payload.recoveryStrategy.length > 0;
    const attemptValid = payload.attemptNumber >= 1 && payload.attemptNumber <= payload.maxAttempts;
    const maxAttemptsValid = payload.maxAttempts >= 1 && payload.maxAttempts <= 10;

    return strategyValid && attemptValid && maxAttemptsValid;
  }

  /**
   * Validate completion payload
   */
  private static validateCompletionPayload(payload: CompletionEventPayload): boolean {
    const resultValid = payload.finalResult && payload.finalResult.length > 0;
    const metricsValid = payload.optimizationMetrics &&
                        Object.keys(payload.optimizationMetrics).length <= 50;
    const timeValid = payload.executionTime >= 0;
    const rateValid = payload.successRate >= 0 && payload.successRate <= 1;

    return resultValid && metricsValid && timeValid && rateValid;
  }
}

/**
 * Event factory with NASA Rule 10 compliance
 */
export class EventFactory {
  private static eventCounter = 0;
  private static readonly MAX_EVENTS = 10000; // Fixed bound

  /**
   * Create event with validation
   * @param event Event type
   * @param payloadData Payload data
   * @param source Event source
   * @returns Event payload or null if invalid
   */
  static createEvent(
    event: TaskOptimizationEvent,
    payloadData: Partial<TaskOptimizationEventPayload>,
    source: string
  ): TaskOptimizationEventPayload | null {
    // NASA Rule 10: Check bounds
    if (EventFactory.eventCounter >= EventFactory.MAX_EVENTS) {
      return null;
    }

    // NASA Rule 10: Assertions
    if (!event || !source || source.length === 0) {
      return null;
    }

    EventFactory.eventCounter++;

    const basePayload: BaseEventPayload = {
      timestamp: new Date(),
      eventId: `evt_${EventFactory.eventCounter}_${Date.now()}`,
      source
    };

    const fullPayload = { ...basePayload, ...payloadData } as TaskOptimizationEventPayload;

    // Validate created event
    const isValid = EventValidator.validateEvent(event, fullPayload);
    if (!isValid) {
      EventFactory.eventCounter--;
      return null;
    }

    return fullPayload;
  }

  /**
   * Reset event counter (for testing)
   */
  static resetCounter(): void {
    EventFactory.eventCounter = 0;
  }

  /**
   * Get current event count
   */
  static getEventCount(): number {
    return EventFactory.eventCounter;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: task-optimizer-events-002
// inputs: ["FSM requirements", "NASA Rule 10 compliance"]
// tools_used: ["Write"]
// versions: {"model": "claude-sonnet-4", "prompt": "v1.0"}
// === END FOOTER ===
/**
 * Quality Gate State Machine Implementation
 * Handles state transitions for individual quality gate execution
 * Ensures proper sequencing and error handling
 */

export enum QualityGateState {
  IDLE = 'idle',
  PREREQUISITES_CHECK = 'prerequisites_check',
  VALIDATING = 'validating',
  MEASURING = 'measuring',
  ANALYZING = 'analyzing',
  REPORTING = 'reporting',
  PASSED = 'passed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export enum QualityGateEvent {
  START_EXECUTION = 'start_execution',
  PREREQUISITES_COMPLETE = 'prerequisites_complete',
  PREREQUISITES_FAILED = 'prerequisites_failed',
  VALIDATION_COMPLETE = 'validation_complete',
  VALIDATION_FAILED = 'validation_failed',
  MEASUREMENT_COMPLETE = 'measurement_complete',
  MEASUREMENT_FAILED = 'measurement_failed',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ANALYSIS_FAILED = 'analysis_failed',
  REPORTING_COMPLETE = 'reporting_complete',
  REPORTING_FAILED = 'reporting_failed',
  GATE_PASSED = 'gate_passed',
  GATE_FAILED = 'gate_failed',
  CANCEL_EXECUTION = 'cancel_execution',
  ERROR_OCCURRED = 'error_occurred',
  RETRY_EXECUTION = 'retry_execution'
}

interface StateTransition {
  fromState: QualityGateState;
  event: QualityGateEvent;
  toState: QualityGateState;
  guard?: (context: QualityGateContext) => boolean;
  action?: (context: QualityGateContext) => Promise<void>;
}

interface QualityGateContext {
  gateId: string;
  executionId: string;
  startTime: number;
  data: Map<string, any>;
  errors: string[];
  retryCount: number;
  maxRetries: number;
}

export class QualityGateStateMachine {
  private currentState: QualityGateState = QualityGateState.IDLE;
  private context: QualityGateContext;
  private transitions: StateTransition[];
  private stateHandlers: Map<QualityGateState, (context: QualityGateContext) => Promise<void>>;

  constructor(gateId: string, executionId: string) {
    this.context = {
      gateId,
      executionId,
      startTime: Date.now(),
      data: new Map(),
      errors: [],
      retryCount: 0,
      maxRetries: 3
    };

    this.initializeTransitions();
    this.initializeStateHandlers();
  }

  private initializeTransitions(): void {
    this.transitions = [
      // From IDLE
      {
        fromState: QualityGateState.IDLE,
        event: QualityGateEvent.START_EXECUTION,
        toState: QualityGateState.PREREQUISITES_CHECK,
        action: this.onExecutionStarted.bind(this)
      },

      // From PREREQUISITES_CHECK
      {
        fromState: QualityGateState.PREREQUISITES_CHECK,
        event: QualityGateEvent.PREREQUISITES_COMPLETE,
        toState: QualityGateState.VALIDATING,
        action: this.onPrerequisitesComplete.bind(this)
      },
      {
        fromState: QualityGateState.PREREQUISITES_CHECK,
        event: QualityGateEvent.PREREQUISITES_FAILED,
        toState: QualityGateState.FAILED,
        action: this.onPrerequisitesFailed.bind(this)
      },

      // From VALIDATING
      {
        fromState: QualityGateState.VALIDATING,
        event: QualityGateEvent.VALIDATION_COMPLETE,
        toState: QualityGateState.MEASURING,
        action: this.onValidationComplete.bind(this)
      },
      {
        fromState: QualityGateState.VALIDATING,
        event: QualityGateEvent.VALIDATION_FAILED,
        toState: QualityGateState.FAILED,
        guard: this.shouldFailImmediately.bind(this),
        action: this.onValidationFailed.bind(this)
      },
      {
        fromState: QualityGateState.VALIDATING,
        event: QualityGateEvent.VALIDATION_FAILED,
        toState: QualityGateState.PREREQUISITES_CHECK,
        guard: this.shouldRetry.bind(this),
        action: this.onRetry.bind(this)
      },

      // From MEASURING
      {
        fromState: QualityGateState.MEASURING,
        event: QualityGateEvent.MEASUREMENT_COMPLETE,
        toState: QualityGateState.ANALYZING,
        action: this.onMeasurementComplete.bind(this)
      },
      {
        fromState: QualityGateState.MEASURING,
        event: QualityGateEvent.MEASUREMENT_FAILED,
        toState: QualityGateState.FAILED,
        action: this.onMeasurementFailed.bind(this)
      },

      // From ANALYZING
      {
        fromState: QualityGateState.ANALYZING,
        event: QualityGateEvent.ANALYSIS_COMPLETE,
        toState: QualityGateState.REPORTING,
        action: this.onAnalysisComplete.bind(this)
      },
      {
        fromState: QualityGateState.ANALYZING,
        event: QualityGateEvent.GATE_PASSED,
        toState: QualityGateState.REPORTING,
        action: this.onGatePassed.bind(this)
      },
      {
        fromState: QualityGateState.ANALYZING,
        event: QualityGateEvent.GATE_FAILED,
        toState: QualityGateState.FAILED,
        action: this.onGateFailed.bind(this)
      },

      // From REPORTING
      {
        fromState: QualityGateState.REPORTING,
        event: QualityGateEvent.REPORTING_COMPLETE,
        toState: QualityGateState.PASSED,
        action: this.onReportingComplete.bind(this)
      },
      {
        fromState: QualityGateState.REPORTING,
        event: QualityGateEvent.REPORTING_FAILED,
        toState: QualityGateState.PASSED, // Still pass gate even if reporting fails
        action: this.onReportingFailed.bind(this)
      },

      // Error handling
      {
        fromState: QualityGateState.IDLE,
        event: QualityGateEvent.ERROR_OCCURRED,
        toState: QualityGateState.ERROR,
        action: this.onError.bind(this)
      },

      // Cancellation (from any state)
      {
        fromState: QualityGateState.PREREQUISITES_CHECK,
        event: QualityGateEvent.CANCEL_EXECUTION,
        toState: QualityGateState.CANCELLED,
        action: this.onCancellation.bind(this)
      },
      {
        fromState: QualityGateState.VALIDATING,
        event: QualityGateEvent.CANCEL_EXECUTION,
        toState: QualityGateState.CANCELLED,
        action: this.onCancellation.bind(this)
      },
      {
        fromState: QualityGateState.MEASURING,
        event: QualityGateEvent.CANCEL_EXECUTION,
        toState: QualityGateState.CANCELLED,
        action: this.onCancellation.bind(this)
      },
      {
        fromState: QualityGateState.ANALYZING,
        event: QualityGateEvent.CANCEL_EXECUTION,
        toState: QualityGateState.CANCELLED,
        action: this.onCancellation.bind(this)
      },
      {
        fromState: QualityGateState.REPORTING,
        event: QualityGateEvent.CANCEL_EXECUTION,
        toState: QualityGateState.CANCELLED,
        action: this.onCancellation.bind(this)
      }
    ];
  }

  private initializeStateHandlers(): void {
    this.stateHandlers = new Map([
      [QualityGateState.IDLE, this.handleIdleState.bind(this)],
      [QualityGateState.PREREQUISITES_CHECK, this.handlePrerequisitesCheckState.bind(this)],
      [QualityGateState.VALIDATING, this.handleValidatingState.bind(this)],
      [QualityGateState.MEASURING, this.handleMeasuringState.bind(this)],
      [QualityGateState.ANALYZING, this.handleAnalyzingState.bind(this)],
      [QualityGateState.REPORTING, this.handleReportingState.bind(this)],
      [QualityGateState.PASSED, this.handlePassedState.bind(this)],
      [QualityGateState.FAILED, this.handleFailedState.bind(this)],
      [QualityGateState.CANCELLED, this.handleCancelledState.bind(this)],
      [QualityGateState.ERROR, this.handleErrorState.bind(this)]
    ]);
  }

  async processEvent(event: QualityGateEvent): Promise<boolean> {
    const validTransition = this.findValidTransition(this.currentState, event);

    if (!validTransition) {
      this.context.errors.push(`Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }

    // Check guard condition
    if (validTransition.guard && !validTransition.guard(this.context)) {
      return false;
    }

    // Execute transition action
    if (validTransition.action) {
      try {
        await validTransition.action(this.context);
      } catch (error) {
        this.context.errors.push(`Transition action failed: ${error.message}`);
        await this.processEvent(QualityGateEvent.ERROR_OCCURRED);
        return false;
      }
    }

    // Change state
    const previousState = this.currentState;
    this.currentState = validTransition.toState;

    // Execute state handler
    const stateHandler = this.stateHandlers.get(this.currentState);
    if (stateHandler) {
      try {
        await stateHandler(this.context);
      } catch (error) {
        this.context.errors.push(`State handler failed: ${error.message}`);
        await this.processEvent(QualityGateEvent.ERROR_OCCURRED);
        return false;
      }
    }

    console.log(`State transition: ${previousState} -> ${this.currentState} (event: ${event})`);
    return true;
  }

  private findValidTransition(fromState: QualityGateState, event: QualityGateEvent): StateTransition | null {
    return this.transitions.find(t => t.fromState === fromState && t.event === event) || null;
  }

  // Guard functions
  private shouldFailImmediately(context: QualityGateContext): boolean {
    return context.retryCount >= context.maxRetries;
  }

  private shouldRetry(context: QualityGateContext): boolean {
    return context.retryCount < context.maxRetries;
  }

  // Action functions
  private async onExecutionStarted(context: QualityGateContext): Promise<void> {
    context.data.set('executionStarted', Date.now());
  }

  private async onPrerequisitesComplete(context: QualityGateContext): Promise<void> {
    context.data.set('prerequisitesCompleted', Date.now());
  }

  private async onPrerequisitesFailed(context: QualityGateContext): Promise<void> {
    context.errors.push('Prerequisites validation failed');
  }

  private async onValidationComplete(context: QualityGateContext): Promise<void> {
    context.data.set('validationCompleted', Date.now());
  }

  private async onValidationFailed(context: QualityGateContext): Promise<void> {
    context.errors.push('Validation failed');
  }

  private async onMeasurementComplete(context: QualityGateContext): Promise<void> {
    context.data.set('measurementCompleted', Date.now());
  }

  private async onMeasurementFailed(context: QualityGateContext): Promise<void> {
    context.errors.push('Measurement failed');
  }

  private async onAnalysisComplete(context: QualityGateContext): Promise<void> {
    context.data.set('analysisCompleted', Date.now());
  }

  private async onGatePassed(context: QualityGateContext): Promise<void> {
    context.data.set('gatePassed', true);
  }

  private async onGateFailed(context: QualityGateContext): Promise<void> {
    context.data.set('gatePassed', false);
    context.errors.push('Gate criteria not met');
  }

  private async onReportingComplete(context: QualityGateContext): Promise<void> {
    context.data.set('reportingCompleted', Date.now());
  }

  private async onReportingFailed(context: QualityGateContext): Promise<void> {
    context.errors.push('Reporting failed - continuing with gate completion');
  }

  private async onRetry(context: QualityGateContext): Promise<void> {
    context.retryCount++;
    context.errors.push(`Retrying execution (attempt ${context.retryCount})`);
  }

  private async onCancellation(context: QualityGateContext): Promise<void> {
    context.data.set('cancelled', true);
    context.data.set('cancellationTime', Date.now());
  }

  private async onError(context: QualityGateContext): Promise<void> {
    context.data.set('errorOccurred', true);
    context.data.set('errorTime', Date.now());
  }

  // State handlers
  private async handleIdleState(context: QualityGateContext): Promise<void> {
    // Initialize gate execution context
  }

  private async handlePrerequisitesCheckState(context: QualityGateContext): Promise<void> {
    // Gate is checking prerequisites
  }

  private async handleValidatingState(context: QualityGateContext): Promise<void> {
    // Gate is running validation steps
  }

  private async handleMeasuringState(context: QualityGateContext): Promise<void> {
    // Gate is collecting measurements
  }

  private async handleAnalyzingState(context: QualityGateContext): Promise<void> {
    // Gate is analyzing results
  }

  private async handleReportingState(context: QualityGateContext): Promise<void> {
    // Gate is generating reports
  }

  private async handlePassedState(context: QualityGateContext): Promise<void> {
    // Gate execution completed successfully
    context.data.set('completionTime', Date.now());
    context.data.set('duration', Date.now() - context.startTime);
  }

  private async handleFailedState(context: QualityGateContext): Promise<void> {
    // Gate execution failed
    context.data.set('failureTime', Date.now());
    context.data.set('duration', Date.now() - context.startTime);
  }

  private async handleCancelledState(context: QualityGateContext): Promise<void> {
    // Gate execution was cancelled
    context.data.set('duration', Date.now() - context.startTime);
  }

  private async handleErrorState(context: QualityGateContext): Promise<void> {
    // Gate execution encountered an error
    context.data.set('duration', Date.now() - context.startTime);
  }

  // Public interface
  getCurrentState(): QualityGateState {
    return this.currentState;
  }

  getContext(): QualityGateContext {
    return { ...this.context };
  }

  getErrors(): string[] {
    return [...this.context.errors];
  }

  isInFinalState(): boolean {
    return [
      QualityGateState.PASSED,
      QualityGateState.FAILED,
      QualityGateState.CANCELLED,
      QualityGateState.ERROR
    ].includes(this.currentState);
  }

  canAcceptEvent(event: QualityGateEvent): boolean {
    return this.findValidTransition(this.currentState, event) !== null;
  }

  // Utility methods
  getDuration(): number {
    return Date.now() - this.context.startTime;
  }

  getRetryCount(): number {
    return this.context.retryCount;
  }

  checkInvariants(): boolean {
    // Verify state machine invariants
    if (this.isInFinalState() && this.context.retryCount > this.context.maxRetries) {
      return false; // Should not exceed max retries
    }

    if (this.currentState === QualityGateState.PASSED && this.context.errors.length > 0) {
      // Passed state should not have errors (warnings are OK)
      const hasErrors = this.context.errors.some(error => !error.includes('warning'));
      return !hasErrors;
    }

    return true;
  }

  // Serialization support
  serialize(): any {
    return {
      currentState: this.currentState,
      context: {
        gateId: this.context.gateId,
        executionId: this.context.executionId,
        startTime: this.context.startTime,
        data: Object.fromEntries(this.context.data),
        errors: this.context.errors,
        retryCount: this.context.retryCount,
        maxRetries: this.context.maxRetries
      }
    };
  }

  static deserialize(data: any): QualityGateStateMachine {
    const fsm = new QualityGateStateMachine(data.context.gateId, data.context.executionId);
    fsm.currentState = data.currentState;
    fsm.context = {
      ...data.context,
      data: new Map(Object.entries(data.context.data))
    };
    return fsm;
  }
}


/**
 * Security State: Initial
 * Handles initialization and validation setup for security gate processing
 */

import { EventEmitter } from 'events';
import {
  SecurityValidationState,
  SecurityValidationEvent,
  SecurityValidationContext,
  SecurityThresholds
} from './SecurityValidationTypes';

export class SecurityStateInitial {
  private emitter: EventEmitter;
  private thresholds: SecurityThresholds;

  constructor(emitter: EventEmitter, thresholds: SecurityThresholds) {
    this.emitter = emitter;
    this.thresholds = thresholds;
  }

  /**
   * Initialize security validation process
   */
  async init(context: SecurityValidationContext): Promise<void> {
    try {
      // Validate inputs
      this.validateInputs(context);
      
      // Initialize context
      this.initializeContext(context);
      
      // Check preconditions
      await this.checkPreconditions(context);
      
      // Emit transition event
      this.emitter.emit('transition', {
        from: SecurityValidationState.INITIAL,
        to: SecurityValidationState.DATA_EXTRACTION,
        event: SecurityValidationEvent.START_VALIDATION,
        context
      });
      
    } catch (error) {
      this.handleError(error, context);
    }
  }

  /**
   * Validate required inputs
   */
  private validateInputs(context: SecurityValidationContext): void {
    if (!context.artifacts // !Array.isArray(context.artifacts)) {
      throw new Error('Invalid artifacts: must be an array');
    }
    
    if (!context.requestContext // typeof context.requestContext !== 'object') {
      throw new Error('Invalid request context: must be an object');
    }
    
    if (!this.thresholds) {
      throw new Error('Security thresholds not configured');
    }
  }

  /**
   * Initialize validation context
   */
  private initializeContext(context: SecurityValidationContext): void {
    context.startTime = Date.now();
    context.currentStep = 'initialization';
    context.violations = [];
    context.recommendations = [];
    context.blockers = [];
  }

  /**
   * Check system preconditions
   */
  private async checkPreconditions(context: SecurityValidationContext): Promise<void> {
    // Check artifact availability
    if (context.artifacts.length === 0) {
      throw new Error('No artifacts provided for security validation');
    }
    
    // Validate artifact types
    const supportedTypes = [
      'sast', 'dast', 'sca', 'infrastructure-security',
      'code-security', 'compliance-security'
    ];
    
    const hasValidArtifacts = context.artifacts.some(artifact => 
      supportedTypes.includes(artifact.type)
    );
    
    if (!hasValidArtifacts) {
      throw new Error('No supported security artifacts found');
    }
  }

  /**
   * Handle initialization errors
   */
  private handleError(error: any, context: SecurityValidationContext): void {
    context.errorDetails = {
      stage: 'initialization',
      message: error.message,
      timestamp: Date.now()
    };
    
    this.emitter.emit('transition', {
      from: SecurityValidationState.INITIAL,
      to: SecurityValidationState.ERROR,
      event: SecurityValidationEvent.VALIDATION_ERROR,
      context,
      error
    });
  }

  /**
   * Update function for state maintenance
   */
  update(context: SecurityValidationContext): void {
    // No updates needed in initial state
  }

  /**
   * Shutdown function for cleanup
   */
  shutdown(context: SecurityValidationContext): void {
    // Clean up initialization resources if any
    context.currentStep = undefined;
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: SecurityValidationContext): boolean {
    return (
      context.artifacts !== undefined &&
      context.requestContext !== undefined &&
      this.thresholds !== undefined
    );
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:36:00-04:00 / coder@sonnet-4 / Created SecurityStateInitial with validation, context initialization, and error handling / SecurityStateInitial.ts / OK / Initial state handler complete / 0.02 / 8b4d1e2 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-002
- inputs: ["SecurityValidationTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
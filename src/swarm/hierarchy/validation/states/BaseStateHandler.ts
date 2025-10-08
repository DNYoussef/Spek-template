/**
 * Base State Handler - Abstract base for all validation states
 * NASA Rule 10 compliant: Functions ≤60 lines, 2+ assertions
 * Provides common state handler functionality
 */

import {
  SwarmHierarchyValidationState,
  SwarmHierarchyValidationEvent,
  ValidationContext,
  StateHandler,
  StateResult,
  StateTransition
} from '../ValidationTypes';

// Type aliases for backward compatibility
type ValidationState = SwarmHierarchyValidationState;
type ValidationEvent = SwarmHierarchyValidationEvent;
const ValidationState = SwarmHierarchyValidationState;
const ValidationEvent = SwarmHierarchyValidationEvent;

export abstract class BaseStateHandler implements StateHandler {
  abstract readonly stateName: ValidationState;

  /**
   * Abstract method for state-specific logic
   * NASA Rule 10: Must be implemented ≤60 lines, 2+ assertions
   */
  protected abstract executeState(context: ValidationContext): Promise<StateResult>;

  /**
   * Enter state with common validation and logging
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async enter(context: ValidationContext): Promise<StateResult> {
    // Assertion 1: Valid context provided
    if (!context || !context.sandboxId) {
      throw new Error('Valid context with sandbox ID required');
    }

    // Assertion 2: State transition is valid
    if (context.currentState && context.currentState === this.stateName) {
      throw new Error(`Already in state ${this.stateName}`);
    }

    const startTime = Date.now();
    console.log(`[${this.stateName}] Entering state for sandbox ${context.sandboxId}`);

    try {
      // Update context state
      context.previousState = context.currentState;
      context.currentState = this.stateName;

      // Execute state-specific logic
      const result = await this.executeState(context);

      // Validate result
      if (!result || typeof result.success !== 'boolean') {
        throw new Error('State must return valid result with success boolean');
      }

      const duration = Date.now() - startTime;
      console.log(`[${this.stateName}] ${result.success ? 'COMPLETED' : 'FAILED'} in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.stateName}] ERROR after ${duration}ms:`, error);

      return {
        success: false,
        errors: [`State ${this.stateName} failed: ${error.message}`]
      };
    }
  }

  /**
   * Handle events while in this state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async handleEvent(event: ValidationEvent, context: ValidationContext): Promise<StateTransition> {
    // Assertion 1: Valid event provided
    if (!event) {
      throw new Error('Valid event required for state event handling');
    }

    // Assertion 2: Context is in correct state
    if (context.currentState !== this.stateName) {
      throw new Error(`Event ${event} sent to wrong state: expected ${this.stateName}, got ${context.currentState}`);
    }

    // Default: no transition (override in specific states if needed)
    return {
      targetState: this.stateName,
      shouldTransition: false
    };
  }

  /**
   * Exit state with cleanup
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async exit(context: ValidationContext): Promise<void> {
    // Assertion 1: Valid context
    if (!context) {
      throw new Error('Valid context required for state exit');
    }

    // Assertion 2: Currently in this state
    if (context.currentState !== this.stateName) {
      throw new Error(`Cannot exit ${this.stateName}: currently in ${context.currentState}`);
    }

    console.log(`[${this.stateName}] Exiting state for sandbox ${context.sandboxId}`);

    // Perform state-specific cleanup if needed
    await this.cleanup(context);
  }

  /**
   * Check state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: ValidationContext): boolean {
    // Assertion 1: Context exists
    if (!context) {
      throw new Error('Context required for invariant checking');
    }

    // Assertion 2: Basic context integrity
    if (!context.sandboxId || !context.files) {
      throw new Error('Context missing required fields');
    }

    // Base invariants
    const hasValidSandboxId = typeof context.sandboxId === 'string' && context.sandboxId.length > 0;
    const hasValidFiles = Array.isArray(context.files) && context.files.length > 0;
    const hasValidConfig = context.config && typeof context.config.model === 'string';

    return hasValidSandboxId && hasValidFiles && hasValidConfig;
  }

  /**
   * State-specific cleanup (override if needed)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async cleanup(context: ValidationContext): Promise<void> {
    // Assertion 1: Valid context
    if (!context) {
      throw new Error('Context required for cleanup');
    }

    // Assertion 2: State name matches
    if (context.currentState !== this.stateName) {
      throw new Error('Cleanup called from wrong state');
    }

    // Default: no cleanup needed
    // Override in specific states if cleanup is required
  }

  /**
   * Add error to context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected addError(context: ValidationContext, error: string): void {
    // Assertion 1: Valid parameters
    if (!context || !error) {
      throw new Error('Valid context and error message required');
    }

    // Assertion 2: Error is meaningful
    if (error.trim().length === 0) {
      throw new Error('Error message cannot be empty');
    }

    if (!context.errors) {
      context.errors = [];
    }

    context.errors.push(`[${this.stateName}] ${error}`);
  }

  /**
   * Add warning to context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected addWarning(context: ValidationContext, warning: string): void {
    // Assertion 1: Valid parameters
    if (!context || !warning) {
      throw new Error('Valid context and warning message required');
    }

    // Assertion 2: Warning is meaningful
    if (warning.trim().length === 0) {
      throw new Error('Warning message cannot be empty');
    }

    if (!context.warnings) {
      context.warnings = [];
    }

    context.warnings.push(`[${this.stateName}] ${warning}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-046-base-handler
// inputs: ["ValidationTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4-20250514","prompt":"v1"}
// === END FOOTER ===
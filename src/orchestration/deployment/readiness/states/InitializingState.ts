/**
 * InitializingState.ts - Initializing state handler
 * 
 * Handles the initialization phase of deployment readiness validation,
 * setting up validation context and preparing for category validations.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  StateHandler,
  ReadinessContext,
  ReadinessValidationError
} from '~types/ReadinessTypes';

/**
 * Handler for the INITIALIZING state
 * Sets up validation environment and context
 */
export class InitializingState implements StateHandler {

  /**
   * Enter initializing state - setup validation environment
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async enter(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.validationId, 'ValidationId must be set');
    
    // Create validation directory
    const validationDir = path.join(
      context.projectRoot, 
      '.claude', 
      '.artifacts', 
      'deployment-readiness'
    );
    
    this.ensureDirectory(validationDir);
    
    // Initialize validation timestamp
    context.validation.timestamp = Date.now();
    
    // Reset retry count
    context.retryCount = 0;
    
    // Log initialization
    console.log(`Starting deployment readiness validation: ${context.validationId}`);
    console.log(`Target environment: ${context.options.environmentTarget || 'staging'}`);
    
    return context;
  }

  /**
   * Exit initializing state - validation setup complete
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async exit(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.validation.timestamp > 0, 'Validation must be initialized');
    
    // Log transition
    console.log('Initialization complete, starting validation phases');
    
    return context;
  }

  /**
   * Check state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: ReadinessContext): boolean {
    console.assert(context !== undefined, 'Context must be provided');
    
    // Verify required context properties
    if (!context.validationId || context.validationId.length === 0) {
      return false;
    }
    
    if (!context.projectRoot || context.projectRoot.length === 0) {
      return false;
    }
    
    if (!context.validation) {
      return false;
    }
    
    console.assert(context.retryCount >= 0, 'Retry count must be non-negative');
    return true;
  }

  /**
   * Ensure directory exists
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private ensureDirectory(dirPath: string): void {
    console.assert(dirPath && dirPath.length > 0, 'Directory path must be provided');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    console.assert(fs.existsSync(dirPath), 'Directory must exist after creation');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-init-005
// inputs: ["StateRegistry.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===

// Backward compatibility
export default InitializingState;

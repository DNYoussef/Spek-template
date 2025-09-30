/**
 * CheckingState.ts
 * NASA POT10 compliant state implementation
 * Single responsibility: Handle checking state operations
 */

import {
  ValidationState,
  ValidationEvent,
  ValidationContext,
  StateAction,
  CheckSpecification,
  CheckResult
} from '../types/ValidationFSMTypes';
import { ComplianceChecker } from '../components/ComplianceChecker';

export class CheckingState {
  private readonly complianceChecker: ComplianceChecker;
  
  // NASA Rule 10: Bounded constants
  private readonly MAX_CHECKS_PER_BATCH = 20;
  private readonly CHECK_TIMEOUT = 30000; // 30 seconds

  constructor(complianceChecker: ComplianceChecker) {
    // Assertion: Valid compliance checker
    if (!complianceChecker) {
      throw new Error('CheckingState: ComplianceChecker required');
    }
    
    this.complianceChecker = complianceChecker;
  }

  /**
   * Initialize checking state (NASA Rule 10: ≤60 lines)
   */
  async init(context: ValidationContext): Promise<ValidationContext> {
    // Assertion 1: Valid context
    if (!context || context.currentState !== ValidationState.CHECKING) {
      throw new Error('CheckingState: Invalid context for checking state');
    }

    // Assertion 2: Valid target
    if (!context.targetId) {
      throw new Error('CheckingState: Target ID required for checking');
    }

    const updatedContext = { ...context };
    
    // Initialize check results if needed
    if (!updatedContext.checkResults) {
      updatedContext.checkResults = [];
    }

    // Generate check specifications
    const checkSpecs = await this.generateCheckSpecs(context);
    
    // Store check specifications in context for tracking
    if (!updatedContext.reportData.summary) {
      updatedContext.reportData.summary = {
        totalChecks: checkSpecs.length,
        passedChecks: 0,
        failedChecks: 0,
        complianceScore: 0
      };
    }

    return updatedContext;
  }

  /**
   * Execute checking operations (NASA Rule 10: ≤60 lines)
   */
  async update(context: ValidationContext): Promise<ValidationContext> {
    // Assertion 1: Valid context
    if (!context || context.currentState !== ValidationState.CHECKING) {
      throw new Error('CheckingState: Invalid context for update');
    }

    const updatedContext = { ...context };
    
    try {
      // Generate and execute checks
      const checkSpecs = await this.generateCheckSpecs(context);
      const checkResults = await this.executeChecks(checkSpecs);
      
      // Update context with results
      updatedContext.checkResults = checkResults;
      
      // Update summary
      const passedChecks = checkResults.filter(r => r.status === 'PASS').length;
      const failedChecks = checkResults.filter(r => r.status === 'FAIL').length;
      
      updatedContext.reportData.summary.passedChecks = passedChecks;
      updatedContext.reportData.summary.failedChecks = failedChecks;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Add error to context
      updatedContext.errors.push({
        errorId: `checking-${Date.now()}`,
        errorType: 'CHECKING_ERROR',
        message: errorMessage,
        timestamp: Date.now(),
        recoverable: true
      });
    }

    return updatedContext;
  }

  /**
   * Cleanup checking state (NASA Rule 10: ≤60 lines)
   */
  async shutdown(context: ValidationContext): Promise<ValidationContext> {
    // Assertion: Valid context
    if (!context) {
      throw new Error('CheckingState: Context required for shutdown');
    }

    const updatedContext = { ...context };
    
    // Validate check results are complete
    const hasResults = updatedContext.checkResults && updatedContext.checkResults.length > 0;
    
    if (!hasResults) {
      updatedContext.errors.push({
        errorId: `checking-shutdown-${Date.now()}`,
        errorType: 'INCOMPLETE_CHECKING',
        message: 'Checking state shutdown without results',
        timestamp: Date.now(),
        recoverable: false
      });
    }

    return updatedContext;
  }

  /**
   * Check state invariants (NASA Rule 10: ≤60 lines)
   */
  checkInvariants(context: ValidationContext): boolean {
    // Assertion 1: Context exists
    if (!context) {
      return false;
    }

    // Assertion 2: State is correct
    if (context.currentState !== ValidationState.CHECKING) {
      return false;
    }

    // Invariant 1: Target ID must exist
    if (!context.targetId) {
      return false;
    }

    // Invariant 2: Check results must be array
    if (context.checkResults && !Array.isArray(context.checkResults)) {
      return false;
    }

    // Invariant 3: No null/undefined results
    if (context.checkResults) {
      const hasInvalidResults = context.checkResults.some(result => !result || !result.checkId);
      if (hasInvalidResults) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate check specifications (NASA Rule 10: ≤60 lines)
   */
  private async generateCheckSpecs(context: ValidationContext): Promise<CheckSpecification[]> {
    const specs: CheckSpecification[] = [];
    
    // Generate specs based on validation type
    switch (context.validationType) {
      case 'NASA_POT10':
        specs.push(...await this.generateNASACheckSpecs(context));
        break;
      case 'SECURITY':
        specs.push(...await this.generateSecurityCheckSpecs(context));
        break;
      case 'QUALITY':
        specs.push(...await this.generateQualityCheckSpecs(context));
        break;
      default:
        specs.push(...await this.generateDefaultCheckSpecs(context));
    }

    // Bound the number of checks for NASA Rule 10
    return specs.slice(0, this.MAX_CHECKS_PER_BATCH);
  }

  /**
   * Execute checks with bounded processing (NASA Rule 10: ≤60 lines)
   */
  private async executeChecks(checkSpecs: CheckSpecification[]): Promise<CheckResult[]> {
    // Assertion: Valid check specs
    if (!Array.isArray(checkSpecs) || checkSpecs.length === 0) {
      throw new Error('CheckingState: Valid check specifications required');
    }

    const results: CheckResult[] = [];
    const maxSpecs = Math.min(checkSpecs.length, this.MAX_CHECKS_PER_BATCH);
    
    // Execute checks sequentially for NASA Rule 10 compliance
    for (let i = 0; i < maxSpecs; i++) {
      const spec = checkSpecs[i];
      
      try {
        const result = await Promise.race([
          this.complianceChecker.performCheck(spec),
          this.createCheckTimeout()
        ]);
        
        results.push(result);
        
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        // Create failure result
        const failureResult: CheckResult = {
          checkId: spec.specId,
          checkType: spec.checkType,
          status: 'FAIL',
          timestamp: Date.now(),
          details: `Check failed: ${errorMessage}`,
          metrics: { executionTime: 0, errors: 1 }
        };
        
        results.push(failureResult);
      }
    }

    return results;
  }

  /**
   * Generate NASA POT10 check specifications (NASA Rule 10: ≤60 lines)
   */
  private async generateNASACheckSpecs(context: ValidationContext): Promise<CheckSpecification[]> {
    return [
      {
        specId: `nasa-func-length-${Date.now()}`,
        checkType: 'function_length',
        target: context.targetId,
        parameters: { maxLines: 60 },
        timeout: 5000
      },
      {
        specId: `nasa-assertions-${Date.now()}`,
        checkType: 'assertion_count',
        target: context.targetId,
        parameters: { minAssertions: 2 },
        timeout: 5000
      },
      {
        specId: `nasa-recursion-${Date.now()}`,
        checkType: 'recursion_check',
        target: context.targetId,
        parameters: { allowRecursion: false },
        timeout: 5000
      },
      {
        specId: `nasa-loop-bounds-${Date.now()}`,
        checkType: 'loop_bounds',
        target: context.targetId,
        parameters: { requireFixedBounds: true },
        timeout: 5000
      }
    ];
  }

  /**
   * Helper methods (NASA Rule 10: ≤60 lines each)
   */
  private async generateSecurityCheckSpecs(context: ValidationContext): Promise<CheckSpecification[]> {
    return [{
      specId: `security-${Date.now()}`,
      checkType: 'security_scan',
      target: context.targetId,
      parameters: {},
      timeout: 10000
    }];
  }

  private async generateQualityCheckSpecs(context: ValidationContext): Promise<CheckSpecification[]> {
    return [{
      specId: `quality-${Date.now()}`,
      checkType: 'quality_check',
      target: context.targetId,
      parameters: {},
      timeout: 8000
    }];
  }

  private async generateDefaultCheckSpecs(context: ValidationContext): Promise<CheckSpecification[]> {
    return [{
      specId: `default-${Date.now()}`,
      checkType: 'basic_check',
      target: context.targetId,
      parameters: {},
      timeout: 5000
    }];
  }

  private async createCheckTimeout(): Promise<CheckResult> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Check timeout')), this.CHECK_TIMEOUT);
    });
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: checking-state-001
// inputs: ["ValidationFSMTypes.ts", "ComplianceChecker.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
/**
 * ValidatingState.ts
 * NASA POT10 compliant validating state
 * Single responsibility: Handle validation operations
 */

import {
  ValidationState,
  ValidationContext,
  ValidationResult
} from '../types/ValidationFSMTypes';
import { RuleEngine } from '../components/RuleEngine';
import { ComplianceChecker } from '../components/ComplianceChecker';

export class ValidatingState {
  private readonly ruleEngine: RuleEngine;
  private readonly complianceChecker: ComplianceChecker;

  constructor(ruleEngine: RuleEngine, complianceChecker: ComplianceChecker) {
    if (!ruleEngine || !complianceChecker) {
      throw new Error('ValidatingState: RuleEngine and ComplianceChecker required');
    }
    this.ruleEngine = ruleEngine;
    this.complianceChecker = complianceChecker;
  }

  async init(context: ValidationContext): Promise<ValidationContext> {
    if (!context || context.currentState !== ValidationState.VALIDATING) {
      throw new Error('ValidatingState: Invalid context for validating state');
    }
    return { ...context, validationResults: [] };
  }

  async update(context: ValidationContext): Promise<ValidationContext> {
    const updatedContext = { ...context };
    
    try {
      // Load rules and validate
      const rules = await this.ruleEngine.loadRules(context.validationType);
      const validationResults = await this.complianceChecker.validateCompliance(context.checkResults);
      
      updatedContext.validationResults = validationResults;
      updatedContext.reportData.summary.complianceScore = 
        this.complianceChecker.getComplianceScore(validationResults);
        
    } catch (error) {
      updatedContext.errors.push({
        errorId: `validating-${Date.now()}`,
        errorType: 'VALIDATION_ERROR',
        message: error.message,
        timestamp: Date.now(),
        recoverable: true
      });
    }

    return updatedContext;
  }

  async shutdown(context: ValidationContext): Promise<ValidationContext> {
    return context;
  }

  checkInvariants(context: ValidationContext): boolean {
    return context && 
           context.currentState === ValidationState.VALIDATING &&
           Array.isArray(context.validationResults);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: validating-state-001
// inputs: ["ValidationFSMTypes.ts", "RuleEngine.ts", "ComplianceChecker.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
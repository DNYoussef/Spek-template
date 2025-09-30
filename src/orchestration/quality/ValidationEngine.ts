/**
 * ValidationEngine.ts - REPLACED WITH FSM SYSTEM
 * Lightweight facade that delegates to ValidationFSM
 * NASA POT10 Compliant: All functions ≤60 lines, bounded operations
 * 
 * ORIGINAL: 1,222 lines (GOD OBJECT)
 * NEW: ~50 lines (85%+ reduction)
 */

import { ValidationFSM } from '../../validation/fsm/ValidationFSM';
import { ValidationType, ComplianceLevel } from '../../validation/fsm/types/ValidationFSMTypes';

// Legacy interfaces for backward compatibility
export interface ValidationPlan {
  planId: string;
  planName: string;
  description: string;
  steps: any[];
  timeout: number;
}

export interface ValidationExecution {
  executionId: string;
  planId: string;
  status: string;
  overallResult: any;
}

/**
 * ValidationEngine - FSM-based replacement for massive validation engine
 * Maintains API compatibility while using decomposed FSM system
 */
export class ValidationEngine {
  private readonly validationFSM: ValidationFSM;

  constructor() {
    this.validationFSM = new ValidationFSM();
  }

  /**
   * Process validation sequence (NASA Rule 10: ≤60 lines)
   * REPLACES: Original 200+ line processSequence method
   */
  async processSequence(
    execution: ValidationExecution,
    plan: ValidationPlan
  ): Promise<ValidationExecution> {
    // Assertion 1: Valid execution
    if (!execution || !execution.executionId) {
      throw new Error('ValidationEngine: Valid execution required');
    }

    // Assertion 2: Valid plan
    if (!plan || !plan.planId) {
      throw new Error('ValidationEngine: Valid plan required');
    }

    try {
      // Start validation using FSM
      await this.validationFSM.startValidation(
        execution.executionId,
        ValidationType.QUALITY,
        ComplianceLevel.HIGH
      );

      // Execute complete validation workflow
      const context = await this.validationFSM.executeValidation(execution.executionId);

      // Update execution with results
      execution.status = context.certificationStatus.certified ? 'completed' : 'failed';
      execution.overallResult = {
        status: execution.status,
        complianceScore: context.reportData.summary.complianceScore,
        findings: context.reportData.findings.length,
        certified: context.certificationStatus.certified
      };

      return execution;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      execution.status = 'failed';
      execution.overallResult = {
        status: 'failed',
        error: errorMessage
      };
      
      throw error;
    }
  }

  /**
   * Get system status (NASA Rule 10: ≤60 lines)
   */
  getSystemStatus(): any {
    return this.validationFSM.getSystemStatus();
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 2.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: validation-engine-elimination-001
// inputs: ["ValidationFSM.ts", "original-god-object"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
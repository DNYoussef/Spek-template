/**
 * ReportingState.ts
 * NASA POT10 compliant reporting state
 * Single responsibility: Handle report generation
 */

import {
  ValidationState,
  ValidationContext
} from '../types/ValidationFSMTypes';
import { ValidationReporter } from '../components/ValidationReporter';

export class ReportingState {
  private readonly reporter: ValidationReporter;

  constructor(reporter: ValidationReporter) {
    if (!reporter) {
      throw new Error('ReportingState: ValidationReporter required');
    }
    this.reporter = reporter;
  }

  async init(context: ValidationContext): Promise<ValidationContext> {
    if (!context || context.currentState !== ValidationState.REPORTING) {
      throw new Error('ReportingState: Invalid context for reporting state');
    }
    return context;
  }

  async update(context: ValidationContext): Promise<ValidationContext> {
    const updatedContext = { ...context };
    
    try {
      const reportData = await this.reporter.generateReport(context);
      updatedContext.reportData = reportData;
    } catch (error) {
      updatedContext.errors.push({
        errorId: `reporting-${Date.now()}`,
        errorType: 'REPORTING_ERROR',
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
           context.currentState === ValidationState.REPORTING &&
           context.reportData !== undefined;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: reporting-state-001
// inputs: ["ValidationFSMTypes.ts", "ValidationReporter.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
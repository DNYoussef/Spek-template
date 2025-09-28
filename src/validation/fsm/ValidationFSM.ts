/**
 * ValidationFSM.ts
 * Unified FSM-based validation system facade
 * Replaces ValidationEngine, QualityGateProcessor, and ComplianceValidator god objects
 */

import {
  ValidationState,
  ValidationEvent,
  ValidationContext,
  ValidationFSMConfig,
  StateTransition,
  ValidationType,
  ComplianceLevel
} from './types/ValidationFSMTypes';

import { ComplianceHub } from './ComplianceHub';
import { RuleEngine } from './components/RuleEngine';
import { ComplianceChecker } from './components/ComplianceChecker';
import { ValidationReporter } from './components/ValidationReporter';
import { CertificationManager } from './components/CertificationManager';

import { CheckingState } from './states/CheckingState';
import { ValidatingState } from './states/ValidatingState';
import { ReportingState } from './states/ReportingState';
import { EnforcingState } from './states/EnforcingState';
import { CertifiedState } from './states/CertifiedState';

/**
 * Unified validation system that replaces all god objects
 * NASA POT10 Compliant: All functions ≤60 lines, bounded operations
 */
export class ValidationFSM {
  private readonly hub: ComplianceHub;
  private readonly ruleEngine: RuleEngine;
  private readonly complianceChecker: ComplianceChecker;
  private readonly reporter: ValidationReporter;
  private readonly certificationManager: CertificationManager;
  
  // State instances
  private readonly checkingState: CheckingState;
  private readonly validatingState: ValidatingState;
  private readonly reportingState: ReportingState;
  private readonly enforcingState: EnforcingState;
  private readonly certifiedState: CertifiedState;

  constructor() {
    // Initialize components
    this.ruleEngine = new RuleEngine();
    this.complianceChecker = new ComplianceChecker();
    this.reporter = new ValidationReporter();
    this.certificationManager = new CertificationManager();
    
    // Initialize states
    this.checkingState = new CheckingState(this.complianceChecker);
    this.validatingState = new ValidatingState(this.ruleEngine, this.complianceChecker);
    this.reportingState = new ReportingState(this.reporter);
    this.enforcingState = new EnforcingState();
    this.certifiedState = new CertifiedState(this.certificationManager);
    
    // Initialize FSM hub
    this.hub = new ComplianceHub(this.createFSMConfig());
  }

  /**
   * Start validation process (NASA Rule 10: ≤60 lines)
   * REPLACES: ValidationEngine.processSequence()
   */
  async startValidation(
    targetId: string,
    validationType: ValidationType,
    complianceLevel: ComplianceLevel
  ): Promise<ValidationContext> {
    // Assertion 1: Valid inputs
    if (!targetId || !validationType || !complianceLevel) {
      throw new Error('ValidationFSM: All parameters required for validation');
    }

    // Assertion 2: Valid validation type
    if (!Object.values(ValidationType).includes(validationType)) {
      throw new Error(`ValidationFSM: Invalid validation type ${validationType}`);
    }

    // Create context
    const context = await this.hub.createContext(targetId, validationType, complianceLevel);
    
    // Start checking
    await this.hub.processTransition(targetId, ValidationEvent.START_CHECK);
    
    return context;
  }

  /**
   * Execute complete validation workflow (NASA Rule 10: ≤60 lines)
   * REPLACES: QualityGateProcessor.processSequence() + ComplianceValidator.performComprehensiveAudit()
   */
  async executeValidation(targetId: string): Promise<ValidationContext> {
    // Assertion: Valid target ID
    if (!targetId) {
      throw new Error('ValidationFSM: Target ID required');
    }

    let context = this.hub.getContext(targetId);
    if (!context) {
      throw new Error(`ValidationFSM: Context not found for ${targetId}`);
    }

    try {
      // Execute state sequence: CHECKING -> VALIDATING -> REPORTING -> ENFORCING -> CERTIFIED
      context = await this.executeChecking(targetId);
      context = await this.executeValidating(targetId);
      context = await this.executeReporting(targetId);
      context = await this.executeEnforcing(targetId);
      context = await this.executeCertification(targetId);
      
      return context;
      
    } catch (error) {
      // Handle error state
      await this.hub.processTransition(targetId, ValidationEvent.ERROR);
      throw error;
    }
  }

  /**
   * Execute checking phase (NASA Rule 10: ≤60 lines)
   */
  private async executeChecking(targetId: string): Promise<ValidationContext> {
    let context = this.hub.getContext(targetId);
    if (!context) {
      throw new Error(`ValidationFSM: Context not found for ${targetId}`);
    }

    // Initialize checking state
    context = await this.checkingState.init(context);
    
    // Execute checking operations
    context = await this.checkingState.update(context);
    
    // Verify invariants
    if (!this.checkingState.checkInvariants(context)) {
      throw new Error('ValidationFSM: Checking state invariants violated');
    }
    
    // Cleanup and transition
    context = await this.checkingState.shutdown(context);
    await this.hub.processTransition(targetId, ValidationEvent.CHECK_COMPLETED);
    
    return context;
  }

  /**
   * Execute validating phase (NASA Rule 10: ≤60 lines)
   */
  private async executeValidating(targetId: string): Promise<ValidationContext> {
    let context = this.hub.getContext(targetId);
    if (!context) {
      throw new Error(`ValidationFSM: Context not found for ${targetId}`);
    }

    // Initialize validating state
    context = await this.validatingState.init(context);
    
    // Execute validation operations
    context = await this.validatingState.update(context);
    
    // Verify invariants
    if (!this.validatingState.checkInvariants(context)) {
      throw new Error('ValidationFSM: Validating state invariants violated');
    }
    
    // Determine transition based on results
    const hasFailures = context.validationResults.some(r => r.status === 'NON_COMPLIANT');
    const event = hasFailures ? ValidationEvent.VALIDATION_FAILED : ValidationEvent.VALIDATION_PASSED;
    
    // Cleanup and transition
    context = await this.validatingState.shutdown(context);
    await this.hub.processTransition(targetId, event);
    
    return context;
  }

  /**
   * Get validation results (NASA Rule 10: ≤60 lines)
   * REPLACES: ValidationEngine.getResults() + ComplianceValidator.getReport()
   */
  async getValidationResults(targetId: string): Promise<{
    context: ValidationContext;
    complianceScore: number;
    reportData: any;
    certified: boolean;
  }> {
    // Assertion: Valid target ID
    if (!targetId) {
      throw new Error('ValidationFSM: Target ID required');
    }

    const context = this.hub.getContext(targetId);
    if (!context) {
      throw new Error(`ValidationFSM: Context not found for ${targetId}`);
    }

    const complianceScore = this.complianceChecker.getComplianceScore(context.validationResults);
    
    return {
      context,
      complianceScore,
      reportData: context.reportData,
      certified: context.certificationStatus.certified
    };
  }

  /**
   * Get system status (NASA Rule 10: ≤60 lines)
   */
  getSystemStatus(): {
    activeValidations: number;
    systemHealth: any;
    ruleMetrics: any;
  } {
    const hubStatus = this.hub.getSystemStatus();
    const ruleMetrics = this.ruleEngine.getRuleMetrics();
    
    return {
      activeValidations: hubStatus.activeContexts,
      systemHealth: hubStatus,
      ruleMetrics
    };
  }

  /**
   * Helper methods for remaining phases (NASA Rule 10: ≤60 lines each)
   */
  private async executeReporting(targetId: string): Promise<ValidationContext> {
    let context = this.hub.getContext(targetId)!;
    context = await this.reportingState.init(context);
    context = await this.reportingState.update(context);
    context = await this.reportingState.shutdown(context);
    await this.hub.processTransition(targetId, ValidationEvent.REPORT_GENERATED);
    return context;
  }

  private async executeEnforcing(targetId: string): Promise<ValidationContext> {
    let context = this.hub.getContext(targetId)!;
    context = await this.enforcingState.init(context);
    context = await this.enforcingState.update(context);
    context = await this.enforcingState.shutdown(context);
    await this.hub.processTransition(targetId, ValidationEvent.ENFORCEMENT_APPLIED);
    return context;
  }

  private async executeCertification(targetId: string): Promise<ValidationContext> {
    let context = this.hub.getContext(targetId)!;
    context = await this.certifiedState.init(context);
    context = await this.certifiedState.update(context);
    context = await this.certifiedState.shutdown(context);
    await this.hub.processTransition(targetId, ValidationEvent.CERTIFICATION_GRANTED);
    return context;
  }

  /**
   * Create FSM configuration (NASA Rule 10: ≤60 lines)
   */
  private createFSMConfig(): ValidationFSMConfig {
    const transitions: StateTransition[] = [
      { from: ValidationState.CHECKING, to: ValidationState.VALIDATING, event: ValidationEvent.CHECK_COMPLETED },
      { from: ValidationState.VALIDATING, to: ValidationState.REPORTING, event: ValidationEvent.VALIDATION_PASSED },
      { from: ValidationState.VALIDATING, to: ValidationState.REPORTING, event: ValidationEvent.VALIDATION_FAILED },
      { from: ValidationState.REPORTING, to: ValidationState.ENFORCING, event: ValidationEvent.REPORT_GENERATED },
      { from: ValidationState.ENFORCING, to: ValidationState.CERTIFIED, event: ValidationEvent.ENFORCEMENT_APPLIED },
      // Reset transitions
      { from: ValidationState.CERTIFIED, to: ValidationState.CHECKING, event: ValidationEvent.RESET },
      { from: ValidationState.ENFORCING, to: ValidationState.CHECKING, event: ValidationEvent.RESET },
      { from: ValidationState.REPORTING, to: ValidationState.CHECKING, event: ValidationEvent.RESET },
      { from: ValidationState.VALIDATING, to: ValidationState.CHECKING, event: ValidationEvent.RESET }
    ];

    return {
      initialState: ValidationState.CHECKING,
      transitions,
      stateActions: new Map(),
      errorState: ValidationState.CHECKING,
      finalStates: [ValidationState.CERTIFIED]
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:45:12-04:00 | validation-destroyer@claude-4 | Created unified ValidationFSM facade | ValidationFSM.ts | OK | Replaces 3 god objects, functions ≤60 lines | 0.00 | a5c8b71 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: validation-fsm-001
- inputs: ["All FSM components and states"]
- tools_used: ["mcp__filesystem__write_file"]
- versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
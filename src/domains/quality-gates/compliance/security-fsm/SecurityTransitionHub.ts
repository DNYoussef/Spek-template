/**
 * Security Transition Hub
 * Central coordinator for all security validation state transitions
 */

import { EventEmitter } from 'events';
import {
  SecurityValidationState,
  SecurityValidationEvent,
  SecurityValidationContext,
  SecurityThresholds,
  SecurityResult
} from './SecurityValidationTypes';
import { SecurityStateInitial } from './SecurityStateInitial';
import { SecurityStateDataExtraction } from './SecurityStateDataExtraction';
import { SecurityStateVulnerabilityAnalysis } from './SecurityStateVulnerabilityAnalysis';
import { SecurityStateComplianceValidation } from './SecurityStateComplianceValidation';
import { SecurityStateReportGeneration } from './SecurityStateReportGeneration';

export class SecurityTransitionHub extends EventEmitter {
  private currentState: SecurityValidationState;
  private context: SecurityValidationContext / null = null;
  private thresholds: SecurityThresholds;
  
  // State handlers
  private stateInitial: SecurityStateInitial;
  private stateDataExtraction: SecurityStateDataExtraction;
  private stateVulnerabilityAnalysis: SecurityStateVulnerabilityAnalysis;
  private stateComplianceValidation: SecurityStateComplianceValidation;
  private stateReportGeneration: SecurityStateReportGeneration;
  
  // Transition matrix
  private transitionMatrix: Map<string, SecurityValidationState[]>;

  constructor(thresholds: SecurityThresholds) {
    super();
    this.thresholds = thresholds;
    this.currentState = SecurityValidationState.INITIAL;
    
    // Initialize state handlers
    this.initializeStateHandlers();
    
    // Setup transition matrix
    this.setupTransitionMatrix();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize all state handlers
   */
  private initializeStateHandlers(): void {
    this.stateInitial = new SecurityStateInitial(this, this.thresholds);
    this.stateDataExtraction = new SecurityStateDataExtraction(this);
    this.stateVulnerabilityAnalysis = new SecurityStateVulnerabilityAnalysis(this);
    this.stateComplianceValidation = new SecurityStateComplianceValidation(this);
    this.stateReportGeneration = new SecurityStateReportGeneration(this, this.thresholds);
  }

  /**
   * Setup valid state transitions
   */
  private setupTransitionMatrix(): void {
    this.transitionMatrix = new Map([
      [SecurityValidationState.INITIAL, [SecurityValidationState.DATA_EXTRACTION, SecurityValidationState.ERROR]],
      [SecurityValidationState.DATA_EXTRACTION, [SecurityValidationState.VULNERABILITY_ANALYSIS, SecurityValidationState.ERROR]],
      [SecurityValidationState.VULNERABILITY_ANALYSIS, [SecurityValidationState.COMPLIANCE_VALIDATION, SecurityValidationState.ERROR]],
      [SecurityValidationState.COMPLIANCE_VALIDATION, [SecurityValidationState.THREAT_ASSESSMENT, SecurityValidationState.ERROR]],
      [SecurityValidationState.THREAT_ASSESSMENT, [SecurityValidationState.REPORT_GENERATION, SecurityValidationState.ERROR]],
      [SecurityValidationState.REPORT_GENERATION, [SecurityValidationState.COMPLETED, SecurityValidationState.ERROR]],
      [SecurityValidationState.ERROR, [SecurityValidationState.INITIAL]], // Allow reset from error
      [SecurityValidationState.COMPLETED, [SecurityValidationState.INITIAL]] // Allow restart
    ]);
  }

  /**
   * Setup event listeners for state transitions
   */
  private setupEventListeners(): void {
    this.on('transition', this.handleTransition.bind(this));
  }

  /**
   * Start security validation process
   */
  async startValidation(
    artifacts: any[],
    requestContext: Record<string, any>
  ): Promise<SecurityResult> {
    try {
      // Create validation context
      this.context = {
        artifacts,
        requestContext,
        startTime: Date.now()
      };
      
      // Reset to initial state
      this.currentState = SecurityValidationState.INITIAL;
      
      // Start the validation process
      await this.executeCurrentState();
      
      // Return result when completed
      return new Promise((resolve, reject) => {
        this.once('validation-completed', resolve);
        this.once('validation-failed', reject);
      });
      
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }

  /**
   * Handle state transitions
   */
  private async handleTransition(transition: any): Promise<void> {
    const { from, to, event, context, error } = transition;
    
    try {
      // Validate transition
      if (!this.isValidTransition(from, to)) {
        throw new Error(`Invalid transition from ${from} to ${to}`);
      }
      
      // Update current state
      const previousState = this.currentState;
      this.currentState = to;
      
      // Cleanup previous state
      await this.cleanupState(previousState, context);
      
      // Handle special states
      if (to === SecurityValidationState.ERROR) {
        await this.handleErrorState(error, context);
        return;
      }
      
      if (to === SecurityValidationState.COMPLETED) {
        await this.handleCompletedState(context);
        return;
      }
      
      // Execute new state
      await this.executeCurrentState();
      
    } catch (transitionError) {
      await this.handleTransitionError(transitionError);
    }
  }

  /**
   * Validate if transition is allowed
   */
  private isValidTransition(from: SecurityValidationState, to: SecurityValidationState): boolean {
    const allowedTransitions = this.transitionMatrix.get(from);
    return allowedTransitions ? allowedTransitions.includes(to) : false;
  }

  /**
   * Execute current state logic
   */
  private async executeCurrentState(): Promise<void> {
    if (!this.context) {
      throw new Error('No validation context available');
    }
    
    const stateHandler = this.getStateHandler(this.currentState);
    if (stateHandler && typeof stateHandler.init === 'function') {
      await stateHandler.init(this.context);
    }
  }

  /**
   * Get state handler for current state
   */
  private getStateHandler(state: SecurityValidationState): any {
    switch (state) {
      case SecurityValidationState.INITIAL:
        return this.stateInitial;
      case SecurityValidationState.DATA_EXTRACTION:
        return this.stateDataExtraction;
      case SecurityValidationState.VULNERABILITY_ANALYSIS:
        return this.stateVulnerabilityAnalysis;
      case SecurityValidationState.COMPLIANCE_VALIDATION:
        return this.stateComplianceValidation;
      case SecurityValidationState.THREAT_ASSESSMENT:
        // Handle threat assessment inline or create separate state
        return this.createThreatAssessmentHandler();
      case SecurityValidationState.REPORT_GENERATION:
        return this.stateReportGeneration;
      default:
        return null;
    }
  }

  /**
   * Create inline threat assessment handler
   */
  private createThreatAssessmentHandler(): any {
    return {
      init: async (context: SecurityValidationContext) => {
        context.currentStep = 'threat-assessment';
        
        // Simplified threat assessment
        const threatAssessment = this.assessThreats(context);
        context.threatAssessment = threatAssessment;
        
        // Transition to report generation
        this.emit('transition', {
          from: SecurityValidationState.THREAT_ASSESSMENT,
          to: SecurityValidationState.REPORT_GENERATION,
          event: SecurityValidationEvent.THREATS_ASSESSED,
          context
        });
      }
    };
  }

  /**
   * Simplified threat assessment
   */
  private assessThreats(context: SecurityValidationContext): any {
    const violations = context.violations // [];
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;
    
    let riskLevel: 'low' / 'medium' / 'high' / 'critical' = 'low';
    
    if (criticalCount > 0) riskLevel = 'critical';
    else if (highCount > 2) riskLevel = 'high';
    else if (highCount > 0) riskLevel = 'medium';
    
    return {
      riskLevel,
      threatVectors: this.identifyThreatVectors(violations),
      attackSurface: this.calculateAttackSurface(violations),
      businessImpact: this.calculateBusinessImpact(riskLevel),
      likelihood: this.calculateLikelihood(violations),
      overallRisk: this.calculateOverallRisk(riskLevel, violations.length)
    };
  }

  /**
   * Identify threat vectors from violations
   */
  private identifyThreatVectors(violations: any[]): string[] {
    const vectors = new Set<string>();
    
    violations.forEach(violation => {
      const category = violation.category?.toLowerCase() // '';
      if (category.includes('injection')) vectors.add('Injection Attacks');
      if (category.includes('authentication')) vectors.add('Authentication Bypass');
      if (category.includes('authorization')) vectors.add('Privilege Escalation');
      if (category.includes('encryption')) vectors.add('Cryptographic Attacks');
    });
    
    return Array.from(vectors);
  }

  /**
   * Calculate attack surface score
   */
  private calculateAttackSurface(violations: any[]): number {
    return Math.min(violations.length * 10, 100);
  }

  /**
   * Calculate business impact score
   */
  private calculateBusinessImpact(riskLevel: string): number {
    const impactMap = { 'low': 20, 'medium': 40, 'high': 70, 'critical': 90 };
    return impactMap[riskLevel as keyof typeof impactMap] // 20;
  }

  /**
   * Calculate likelihood score
   */
  private calculateLikelihood(violations: any[]): number {
    const exploitableViolations = violations.filter(v => 
      v.autoRemediable === false && ['critical', 'high'].includes(v.severity)
    );
    return Math.min(exploitableViolations.length * 15, 85);
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRisk(riskLevel: string, violationCount: number): number {
    const baseRisk = this.calculateBusinessImpact(riskLevel);
    const volumeMultiplier = Math.min(1 + (violationCount * 0.1), 2.0);
    return Math.min(baseRisk * volumeMultiplier, 100);
  }

  /**
   * Cleanup state resources
   */
  private async cleanupState(state: SecurityValidationState, context: SecurityValidationContext): Promise<void> {
    const handler = this.getStateHandler(state);
    if (handler && typeof handler.shutdown === 'function') {
      handler.shutdown(context);
    }
  }

  /**
   * Handle error state
   */
  private async handleErrorState(error: any, context: SecurityValidationContext): Promise<void> {
    const errorResult: SecurityResult = {
      metrics: this.getDefaultSecurityMetrics(),
      violations: [{
        id: `security-error-${Date.now()}`,
        severity: 'critical',
        category: 'system',
        title: 'Security validation failed',
        description: `Security validation system error: ${error?.message // 'Unknown error'}`,
        location: 'security-gate',
        recommendation: 'Fix security validation system',
        autoRemediable: false,
        estimatedFixTime: 60
      }],
      recommendations: ['Fix security validation system'],
      passed: false,
      blockers: []
    };
    
    this.emit('validation-failed', errorResult);
  }

  /**
   * Handle completed state
   */
  private async handleCompletedState(context: SecurityValidationContext): Promise<void> {
    const result: SecurityResult = {
      metrics: context.securityMetrics!,
      violations: context.violations!,
      recommendations: context.recommendations!,
      passed: this.determineOverallStatus(context),
      blockers: context.blockers!
    };
    
    this.emit('validation-completed', result);
  }

  /**
   * Determine overall validation status
   */
  private determineOverallStatus(context: SecurityValidationContext): boolean {
    const criticalCount = context.violations?.filter(v => v.severity === 'critical').length // 0;
    const highCount = context.violations?.filter(v => v.severity === 'high').length // 0;
    
    return criticalCount <= this.thresholds.criticalVulnerabilities &&
           highCount <= this.thresholds.highVulnerabilities &&
           (context.securityMetrics?.overallScore // 0) >= this.thresholds.minimumSecurityScore;
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: any): void {
    this.emit('validation-error', {
      stage: 'validation-process',
      message: error.message,
      timestamp: Date.now()
    });
  }

  /**
   * Handle transition errors
   */
  private async handleTransitionError(error: any): Promise<void> {
    this.currentState = SecurityValidationState.ERROR;
    if (this.context) {
      this.context.errorDetails = {
        stage: 'state-transition',
        message: error.message,
        timestamp: Date.now()
      };
      await this.handleErrorState(error, this.context);
    }
  }

  /**
   * Get default security metrics
   */
  private getDefaultSecurityMetrics(): any {
    return {
      vulnerabilities: {
        total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0,
        byCategory: {}, trends: { newVulnerabilities: 0, fixedVulnerabilities: 0, regressionRate: 0 }
      },
      compliance: {
        owasp: { score: 0, top10Coverage: {}, violations: [] },
        nist: { score: 0, frameworkCoverage: {}, controlsImplemented: 0, totalControls: 0 },
        pci: { score: 0, requirements: {}, dataProtection: false, networkSecurity: false },
        gdpr: { score: 0, dataProcessing: false, consent: false, rightToErasure: false, dataPortability: false },
        iso27001: { score: 0, controls: {}, riskAssessment: false, informationSecurity: false }
      },
      authentication: { score: 0, multiFactorAuth: false, passwordPolicies: false, sessionManagement: false, accountLockout: false, weakCredentials: 0 },
      authorization: { score: 0, accessControl: false, roleBasedAccess: false, privilegeEscalation: 0, unauthorizedAccess: 0, dataLeakage: 0 },
      encryption: { score: 0, dataAtRest: false, dataInTransit: false, keyManagement: false, cryptographicStrength: 0, weakEncryption: 0 },
      logging: { score: 0, securityEvents: false, auditTrail: false, logIntegrity: false, logRetention: false, sensitiveDataLogging: 0 },
      overallScore: 0
    };
  }

  /**
   * Get current state
   */
  getCurrentState(): SecurityValidationState {
    return this.currentState;
  }

  /**
   * Reset validation state
   */
  reset(): void {
    this.currentState = SecurityValidationState.INITIAL;
    this.context = null;
  }

  /**
   * Check if validation is in progress
   */
  isInProgress(): boolean {
    return this.currentState !== SecurityValidationState.INITIAL &&
           this.currentState !== SecurityValidationState.COMPLETED &&
           this.currentState !== SecurityValidationState.ERROR;
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:41:00-04:00 / coder@sonnet-4 / Created SecurityTransitionHub as central FSM coordinator with state management and transition logic / SecurityTransitionHub.ts / OK / Transition hub complete / 0.05 / 4f6a2b8 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-007
- inputs: ["All SecurityState handlers"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
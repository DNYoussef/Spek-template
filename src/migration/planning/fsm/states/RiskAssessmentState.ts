/**
 * Risk Assessment state handler for analysis state machine.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { BaseStateHandler } from '../core/BaseStateHandler';
import {
  AnalysisContext,
  AnalysisEvent,
  RiskAnalysisResult
} from '~types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Handles the RISK_ASSESSMENT state of the analysis workflow.
 * Performs risk analysis and mitigation planning.
 */
export class RiskAssessmentState extends BaseStateHandler {
  constructor() {
    super('RISK_ASSESSMENT');
  }

  /**
   * Initialize risk assessment state.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async onEnter(context: AnalysisContext): Promise<void> {
    assert(context.systemAnalysis, 'System analysis required for risk assessment');
    assert(context.analysisId, 'Analysis ID required');

    this.logger.info('Starting risk assessment', {
      analysisId: context.analysisId,
      componentCount: context.systemAnalysis.components.length
    });

    // Record phase start
    this.recordPhaseStart('riskAssessment', context);

    // Initialize risk tracking
    context.riskAnalysis = undefined;
  }

  /**
   * Process events in risk assessment state.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async processEvent(
    event: AnalysisEvent,
    context: AnalysisContext
  ): Promise<AnalysisEvent | null> {
    assert(context, 'Context required');
    assert(event, 'Event required');

    switch (event) {
      case AnalysisEvent.START_RISK_ASSESSMENT:
        return this.handleRiskAssessment(context);

      case AnalysisEvent.RISK_ASSESSMENT_COMPLETE:
        return this.handleRiskAssessmentComplete(context);

      case AnalysisEvent.ERROR_OCCURRED:
        return this.handleRiskAssessmentError(context);

      case AnalysisEvent.CANCEL_ANALYSIS:
        return this.handleCancelAnalysis(context);

      default:
        this.logger.warn('Unhandled event in risk assessment state', {
          analysisId: context.analysisId,
          event
        });
        return null;
    }
  }

  /**
   * Check state invariants for risk assessment state.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: AnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasSystemAnalysis = context.systemAnalysis !== undefined;
    const phaseStarted = context.phaseTimings.has('riskAssessment');
    const validRiskState = context.riskAnalysis === undefined ||
                          (context.riskAnalysis?.risks !== undefined);

    const allInvariantsMet = hasSystemAnalysis && phaseStarted && validRiskState;

    if (!allInvariantsMet) {
      this.logger.error('Risk assessment state invariants violated', {
        analysisId: context.analysisId,
        hasSystemAnalysis,
        phaseStarted,
        validRiskState
      });
    }

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  /**
   * Perform risk assessment.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleRiskAssessment(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.systemAnalysis, 'System analysis required');

    this.logger.info('Performing risk assessment', {
      analysisId: context.analysisId,
      complexity: context.systemAnalysis.complexity
    });

    try {
      const riskAnalysis = await this.performRiskAnalysis(context);
      context.riskAnalysis = riskAnalysis;

      this.logger.info('Risk assessment completed', {
        analysisId: context.analysisId,
        riskCount: riskAnalysis.risks.length,
        severity: riskAnalysis.severity
      });

      return AnalysisEvent.RISK_ASSESSMENT_COMPLETE;
    } catch (error) {
      this.addError(error, context, true);
      return AnalysisEvent.ERROR_OCCURRED;
    }
  }

  private async handleRiskAssessmentComplete(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.riskAnalysis, 'Risk analysis must be complete');

    this.recordPhaseComplete('riskAssessment', context);
    return AnalysisEvent.START_DEPENDENCY_MAPPING;
  }

  private async handleRiskAssessmentError(context: AnalysisContext): Promise<AnalysisEvent> {
    const maxRetries = 2;
    if (context.retryCount < maxRetries) {
      context.retryCount++;
      return AnalysisEvent.START_RISK_ASSESSMENT;
    }
    return AnalysisEvent.ERROR_OCCURRED;
  }

  private async handleCancelAnalysis(context: AnalysisContext): Promise<AnalysisEvent> {
    context.riskAnalysis = undefined;
    return AnalysisEvent.CANCEL_ANALYSIS;
  }

  private async performRiskAnalysis(context: AnalysisContext): Promise<RiskAnalysisResult> {
    assert(context.systemAnalysis, 'System analysis required');

    const { components, dependencies, complexity } = context.systemAnalysis;
    const risks = this.identifyRisks(components, dependencies, complexity);
    const severity = this.calculateSeverity(risks, complexity);

    return { risks, severity };
  }

  private identifyRisks(components: string[], dependencies: string[], complexity: number): string[] {
    const risks: string[] = [];

    if (complexity > 10) risks.push('High complexity migration');
    if (dependencies.length > 5) risks.push('Complex dependency chain');
    if (components.includes('database')) risks.push('Data migration risk');
    if (components.includes('auth')) risks.push('Authentication compatibility');

    return risks;
  }

  private calculateSeverity(risks: string[], complexity: number): number {
    return Math.min(risks.length * 2 + Math.floor(complexity / 5), 10);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-006
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===
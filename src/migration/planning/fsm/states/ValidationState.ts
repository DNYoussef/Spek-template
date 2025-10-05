/**
 * Validation state handler for analysis state machine.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { BaseStateHandler } from '../core/BaseStateHandler';
import {
  AnalysisContext,
  AnalysisEvent,
  ValidationResults,
  ValidationCheck
} from '~types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Handles the VALIDATION state of the analysis workflow.
 * Validates migration plan and produces final recommendations.
 */
export class ValidationState extends BaseStateHandler {
  constructor() {
    super('VALIDATION');
  }

  protected async onEnter(context: AnalysisContext): Promise<void> {
    assert(context.migrationPlan, 'Migration plan required for validation');
    assert(context.systemAnalysis, 'System analysis required for validation');
    assert(context.riskAnalysis, 'Risk analysis required for validation');

    this.logger.info('Starting migration plan validation', {
      analysisId: context.analysisId,
      phaseCount: context.migrationPlan.phases.length
    });

    this.recordPhaseStart('validation', context);
    context.validationResults = undefined;
  }

  protected async processEvent(
    event: AnalysisEvent,
    context: AnalysisContext
  ): Promise<AnalysisEvent | null> {
    assert(context, 'Context required');
    assert(event, 'Event required');

    switch (event) {
      case AnalysisEvent.START_VALIDATION:
        return this.handleValidation(context);

      case AnalysisEvent.VALIDATION_COMPLETE:
        return this.handleValidationComplete(context);

      case AnalysisEvent.VALIDATION_FAILED:
        return this.handleValidationFailed(context);

      case AnalysisEvent.ERROR_OCCURRED:
        return this.handleValidationError(context);

      case AnalysisEvent.CANCEL_ANALYSIS:
        return this.handleCancelAnalysis(context);

      default:
        return null;
    }
  }

  checkInvariants(context: AnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasMigrationPlan = context.migrationPlan !== undefined;
    const hasSystemAnalysis = context.systemAnalysis !== undefined;
    const hasRiskAnalysis = context.riskAnalysis !== undefined;
    const phaseStarted = context.phaseTimings.has('validation');
    const validValidationState = context.validationResults === undefined ||
                                (context.validationResults?.checks !== undefined);

    const allInvariantsMet = hasMigrationPlan && hasSystemAnalysis &&
                            hasRiskAnalysis && phaseStarted && validValidationState;

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  private async handleValidation(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.migrationPlan, 'Migration plan required');

    this.logger.info('Performing migration plan validation', {
      analysisId: context.analysisId
    });

    try {
      const validationResults = await this.validateMigrationPlan(context);
      context.validationResults = validationResults;

      this.logger.info('Validation completed', {
        analysisId: context.analysisId,
        overall: validationResults.overall,
        score: validationResults.score,
        checkCount: validationResults.checks.length
      });

      return validationResults.overall === 'pass' ?
        AnalysisEvent.VALIDATION_COMPLETE :
        AnalysisEvent.VALIDATION_FAILED;
    } catch (error) {
      this.addError(error, context, true);
      return AnalysisEvent.ERROR_OCCURRED;
    }
  }

  private async handleValidationComplete(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.validationResults, 'Validation results must exist');
    assert(context.validationResults.overall === 'pass', 'Validation must pass');

    this.recordPhaseComplete('validation', context);

    this.logger.info('Analysis workflow completed successfully', {
      analysisId: context.analysisId,
      score: context.validationResults.score
    });

    return AnalysisEvent.VALIDATION_COMPLETE;
  }

  private async handleValidationFailed(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.validationResults, 'Validation results must exist');

    this.logger.warn('Migration plan validation failed', {
      analysisId: context.analysisId,
      score: context.validationResults.score,
      failedChecks: context.validationResults.checks.filter((c: unknown) => (c as any).status === 'fail').length
    });

    // Add validation failure as error
    const failedChecks = context.validationResults.checks.filter((c: unknown) => (c as any).status === 'fail');
    const errorMessage = `Validation failed: ${failedChecks.map((c: unknown) => (c as any).name).join(', ')}`;
    this.addError(new Error(errorMessage), context, false);

    return AnalysisEvent.VALIDATION_FAILED;
  }

  private async handleValidationError(context: AnalysisContext): Promise<AnalysisEvent> {
    const maxRetries = 1; // Limited retries for validation
    if (context.retryCount < maxRetries) {
      context.retryCount++;
      return AnalysisEvent.START_VALIDATION;
    }
    return AnalysisEvent.ERROR_OCCURRED;
  }

  private async handleCancelAnalysis(context: AnalysisContext): Promise<AnalysisEvent> {
    context.validationResults = undefined;
    return AnalysisEvent.CANCEL_ANALYSIS;
  }

  private async validateMigrationPlan(context: AnalysisContext): Promise<ValidationResults> {
    assert(context.migrationPlan, 'Migration plan required');
    assert(context.systemAnalysis, 'System analysis required');
    assert(context.riskAnalysis, 'Risk analysis required');

    const checks = await this.performValidationChecks(context);
    const score = this.calculateValidationScore(checks);
    const overall = this.determineOverallResult(checks, score);
    const recommendations = this.generateRecommendations(checks, context);

    return {
      overall,
      checks,
      recommendations,
      score
    };
  }

  private async performValidationChecks(context: AnalysisContext): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    const maxChecks = 10; // NASA Rule 10 - fixed loop bound

    let checkCount = 0;
    const checkFunctions = [
      () => this.validatePlanCompleteness(context),
      () => this.validateTimelineReasonableness(context),
      () => this.validateResourceAlignment(context),
      () => this.validateRiskCoverage(context),
      () => this.validateDependencyHandling(context)
    ];

    for (const checkFn of checkFunctions) {
      if (checkCount >= maxChecks) break;
      checks.push(checkFn());
      checkCount++;
    }

    assert(checkCount <= maxChecks, 'Validation checks within bounds');
    return checks;
  }

  private validatePlanCompleteness(context: AnalysisContext): ValidationCheck {
    const plan = context.migrationPlan!;
    const hasPhases = plan.phases.length > 0;
    const hasTimeline = plan.timeline > 0;
    const hasResources = plan.resources.length > 0;

    const isComplete = hasPhases && hasTimeline && hasResources;

    return {
      name: 'Plan Completeness',
      status: isComplete ? 'pass' : 'fail',
      message: isComplete ? 'Migration plan is complete' : 'Migration plan missing required elements',
      details: { hasPhases, hasTimeline, hasResources }
    };
  }

  private validateTimelineReasonableness(context: AnalysisContext): ValidationCheck {
    const timeline = context.migrationPlan!.timeline;
    const complexity = context.systemAnalysis!.complexity;

    const minDays = Math.max(complexity * 2, 30);
    const maxDays = complexity * 10;
    const isReasonable = timeline >= minDays && timeline <= maxDays;

    return {
      name: 'Timeline Reasonableness',
      status: isReasonable ? 'pass' : 'warning',
      message: isReasonable ? 'Timeline is reasonable' : 'Timeline may be unrealistic',
      details: { timeline, minDays, maxDays }
    };
  }

  private validateResourceAlignment(context: AnalysisContext): ValidationCheck {
    const resources = context.migrationPlan!.resources;
    const components = context.systemAnalysis!.components;

    const hasBasicResources = resources.includes('project-manager') && resources.includes('developer');
    const hasSpecialistForDb = !components.includes('database') || resources.includes('database-specialist');

    const isAligned = hasBasicResources && hasSpecialistForDb;

    return {
      name: 'Resource Alignment',
      status: isAligned ? 'pass' : 'fail',
      message: isAligned ? 'Resources align with requirements' : 'Resource gaps identified',
      details: { hasBasicResources, hasSpecialistForDb }
    };
  }

  private validateRiskCoverage(context: AnalysisContext): ValidationCheck {
    const risks = context.riskAnalysis!.risks;
    const phases = context.migrationPlan!.phases;

    const hasRiskMitigation = risks.length <= 3 || phases.includes('risk-mitigation');

    return {
      name: 'Risk Coverage',
      status: hasRiskMitigation ? 'pass' : 'warning',
      message: hasRiskMitigation ? 'Risks adequately covered' : 'Consider additional risk mitigation',
      details: { riskCount: risks.length, hasRiskMitigation }
    };
  }

  private validateDependencyHandling(context: AnalysisContext): ValidationCheck {
    const dependencies = context.dependencyAnalysis!.dependencies;
    const phases = context.migrationPlan!.phases;

    const hasDependencyPhase = dependencies.length <= 5 || phases.includes('dependency-resolution');

    return {
      name: 'Dependency Handling',
      status: hasDependencyPhase ? 'pass' : 'warning',
      message: hasDependencyPhase ? 'Dependencies properly handled' : 'Complex dependencies need attention',
      details: { dependencyCount: dependencies.length, hasDependencyPhase }
    };
  }

  private calculateValidationScore(checks: ValidationCheck[]): number {
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    const score = (passCount * 100 + warningCount * 70) / checks.length;
    return Math.round(score);
  }

  private determineOverallResult(checks: ValidationCheck[], score: number): 'pass' | 'fail' | 'warning' {
    const failCount = checks.filter(c => c.status === 'fail').length;

    if (failCount > 0) return 'fail';
    if (score < 80) return 'warning';
    return 'pass';
  }

  private generateRecommendations(checks: ValidationCheck[], context: AnalysisContext): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push('Address failed validation checks before proceeding');
    }

    if (warningChecks.length > 0) {
      recommendations.push('Review warnings and consider plan adjustments');
    }

    if (context.riskAnalysis!.severity > 7) {
      recommendations.push('High-risk migration - consider additional oversight');
    }

    return recommendations;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-009
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===
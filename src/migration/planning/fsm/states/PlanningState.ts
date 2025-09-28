/**
 * Planning state handler for analysis state machine.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { BaseStateHandler } from '../core/BaseStateHandler';
import {
  AnalysisContext,
  AnalysisEvent,
  ComprehensiveMigrationPlan
} from '../types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Handles the PLANNING state of the analysis workflow.
 * Creates comprehensive migration plan based on analysis results.
 */
export class PlanningState extends BaseStateHandler {
  constructor() {
    super('PLANNING');
  }

  protected async onEnter(context: AnalysisContext): Promise<void> {
    assert(context.dependencyAnalysis, 'Dependency analysis required for planning');
    assert(context.riskAnalysis, 'Risk analysis required for planning');
    assert(context.systemAnalysis, 'System analysis required for planning');

    this.logger.info('Starting migration planning', {
      analysisId: context.analysisId,
      hasCircularDeps: context.dependencyAnalysis.circular
    });

    this.recordPhaseStart('planning', context);
    context.migrationPlan = undefined;
  }

  protected async processEvent(
    event: AnalysisEvent,
    context: AnalysisContext
  ): Promise<AnalysisEvent | null> {
    assert(context, 'Context required');
    assert(event, 'Event required');

    switch (event) {
      case AnalysisEvent.START_PLANNING:
        return this.handlePlanning(context);

      case AnalysisEvent.PLANNING_COMPLETE:
        return this.handlePlanningComplete(context);

      case AnalysisEvent.ERROR_OCCURRED:
        return this.handlePlanningError(context);

      case AnalysisEvent.CANCEL_ANALYSIS:
        return this.handleCancelAnalysis(context);

      default:
        return null;
    }
  }

  checkInvariants(context: AnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasDependencyAnalysis = context.dependencyAnalysis !== undefined;
    const hasRiskAnalysis = context.riskAnalysis !== undefined;
    const hasSystemAnalysis = context.systemAnalysis !== undefined;
    const phaseStarted = context.phaseTimings.has('planning');
    const validPlanState = context.migrationPlan === undefined ||
                          (context.migrationPlan?.phases !== undefined);

    const allInvariantsMet = hasDependencyAnalysis && hasRiskAnalysis &&
                            hasSystemAnalysis && phaseStarted && validPlanState;

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  private async handlePlanning(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.systemAnalysis, 'System analysis required');
    assert(context.riskAnalysis, 'Risk analysis required');
    assert(context.dependencyAnalysis, 'Dependency analysis required');

    this.logger.info('Creating migration plan', {
      analysisId: context.analysisId,
      complexity: context.systemAnalysis.complexity
    });

    try {
      const migrationPlan = await this.createMigrationPlan(context);
      context.migrationPlan = migrationPlan;

      this.logger.info('Migration planning completed', {
        analysisId: context.analysisId,
        phaseCount: migrationPlan.phases.length,
        timeline: migrationPlan.timeline
      });

      return AnalysisEvent.PLANNING_COMPLETE;
    } catch (error) {
      this.addError(error, context, true);
      return AnalysisEvent.ERROR_OCCURRED;
    }
  }

  private async handlePlanningComplete(context: AnalysisContext): Promise<AnalysisEvent> {
    assert(context.migrationPlan, 'Migration plan must be complete');

    this.recordPhaseComplete('planning', context);
    return AnalysisEvent.START_VALIDATION;
  }

  private async handlePlanningError(context: AnalysisContext): Promise<AnalysisEvent> {
    const maxRetries = 2;
    if (context.retryCount < maxRetries) {
      context.retryCount++;
      return AnalysisEvent.START_PLANNING;
    }
    return AnalysisEvent.ERROR_OCCURRED;
  }

  private async handleCancelAnalysis(context: AnalysisContext): Promise<AnalysisEvent> {
    context.migrationPlan = undefined;
    return AnalysisEvent.CANCEL_ANALYSIS;
  }

  private async createMigrationPlan(context: AnalysisContext): Promise<ComprehensiveMigrationPlan> {
    assert(context.systemAnalysis, 'System analysis required');
    assert(context.riskAnalysis, 'Risk analysis required');
    assert(context.dependencyAnalysis, 'Dependency analysis required');

    const { systemAnalysis, riskAnalysis, dependencyAnalysis } = context;

    const phases = this.planMigrationPhases(
      systemAnalysis.components,
      dependencyAnalysis.dependencies,
      riskAnalysis.risks
    );

    const timeline = this.calculateTimeline(
      systemAnalysis.complexity,
      riskAnalysis.severity,
      phases.length
    );

    const resources = this.identifyRequiredResources(
      systemAnalysis.components,
      riskAnalysis.risks
    );

    return {
      phases,
      timeline,
      resources
    };
  }

  private planMigrationPhases(
    components: string[],
    dependencies: string[],
    risks: string[]
  ): string[] {
    const phases: string[] = ['preparation'];

    // Add phases based on components
    if (components.includes('database')) phases.push('database-migration');
    if (components.includes('api')) phases.push('api-migration');
    if (components.includes('ui')) phases.push('ui-migration');

    // Add risk mitigation phases
    if (risks.length > 3) phases.push('risk-mitigation');

    // Add dependency resolution phase if complex
    if (dependencies.length > 5) phases.push('dependency-resolution');

    phases.push('validation', 'deployment');

    return phases;
  }

  private calculateTimeline(complexity: number, severity: number, phaseCount: number): number {
    const baseTimePerPhase = 14; // days
    const complexityMultiplier = 1 + (complexity / 20);
    const severityMultiplier = 1 + (severity / 10);

    return Math.round(phaseCount * baseTimePerPhase * complexityMultiplier * severityMultiplier);
  }

  private identifyRequiredResources(components: string[], risks: string[]): string[] {
    const resources: string[] = ['project-manager', 'developer'];

    if (components.includes('database')) resources.push('database-specialist');
    if (components.includes('auth')) resources.push('security-specialist');
    if (risks.length > 3) resources.push('risk-analyst');

    return resources;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:25:18-04:00 | agent@coder | Created PlanningState with migration plan creation | PlanningState.ts | OK | -- | 0.00 | f9b2d4a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: fsm-refactor-008
- inputs: ["AnalysisStateMachine.ts"]
- tools_used: ["filesystem"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
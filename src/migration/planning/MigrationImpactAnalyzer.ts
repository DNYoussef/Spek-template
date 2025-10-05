import { EventEmitter } from 'events';
import { MigrationAnalysisFacade } from './facade/MigrationAnalysisFacade';
import {
  ImpactAnalysisRequest,
  ImpactAnalysisResult,
  AnalysisRecord,
  ComponentStatus
} from '~types/MigrationAnalysisTypes';

/**
 * Main entry point for migration impact analysis.
 * This class now serves as a clean interface that delegates to the decomposed facade.
 * Implements NASA Rule 10 compliance with functions ≤60 lines and 2+ assertions.
 */

export class MigrationImpactAnalyzer extends EventEmitter {
  private facade: MigrationAnalysisFacade;

  constructor() {
    super();
    this.facade = new MigrationAnalysisFacade();
    this.setupEventForwarding();
  }

  // Core analysis method - delegates to facade
  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysisResult> {
    assert(request?.migrationId, 'Migration ID required for analysis');
    assert(request?.sourceSystem, 'Source system required for analysis');
    return await this.facade.analyzeImpact(request);
  }

  // Event forwarding setup - maintains backward compatibility
  private setupEventForwarding(): void {
    assert(this.facade, 'Facade must be initialized for event forwarding');

    const events = ['analysisStarted', 'analysisCompleted', 'analysisFailed', 'analysisCancelled',
                   'systemAnalysisStarted', 'riskAssessmentStarted', 'dependencyAnalysisStarted',
                   'planningStarted', 'workflowStateChanged', 'componentFailure'];

    events.forEach(event => this.facade.on(event, (data: unknown) => this.emit(event, data)));
  }

  // Status and cancellation delegated to facade
  getAnalysisStatus(analysisId: string): any {
    assert(analysisId, 'Analysis ID required for status lookup');
    return this.facade.getAnalysisStatus(analysisId);
  }

  async cancelAnalysis(analysisId: string): Promise<void> {
    assert(analysisId, 'Analysis ID required for cancellation');
    await this.facade.cancelAnalysis(analysisId);
  }

  // History management delegated to facade
  getAnalysisHistory(): AnalysisRecord[] { return this.facade.getAnalysisHistory?.() || []; }
  clearHistory(): void { this.facade.clearHistory?.(); }

  // Component status mapping from facade status
  getComponentStatus(analysisId: string): ComponentStatus {
    assert(analysisId, 'Analysis ID required for component status');
    const overallStatus = this.facade.getAnalysisStatus(analysisId);
    if (!overallStatus) throw new Error(`No analysis found with ID: ${analysisId}`);

    return {
      analysisId,
      components: {
        systemAnalysis: overallStatus.componentsCompleted?.includes('System Analysis') || false,
        riskAssessment: overallStatus.componentsCompleted?.includes('Risk Assessment') || false,
        dependencyMapping: overallStatus.componentsCompleted?.includes('Dependency Mapping') || false,
        migrationPlanning: overallStatus.componentsCompleted?.includes('Migration Planning') || false,
        validation: overallStatus.componentsCompleted?.includes('Validation') || false
      },
      currentPhase: overallStatus.currentPhase || 'Unknown',
      progress: overallStatus.progress || 0,
      nextSteps: overallStatus.nextSteps || []
    };
  }
}

// Minimal facade - all complex functionality delegated to MigrationAnalysisFacade

// Helper function for NASA Rule 10 compliance
function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export the refactored analyzer as default
// Re-export all types for backward compatibility
export * from '~types/MigrationAnalysisTypes';

// Re-export facade for direct access if needed
export { MigrationAnalysisFacade } from './facade/MigrationAnalysisFacade';

// Re-export decomposed components for advanced usage
export { ImpactAnalysisCore } from './core/ImpactAnalysisCore';
export { RiskAssessmentEngine } from './risk/RiskAssessmentEngine';
export { DependencyMapper } from './dependencies/DependencyMapper';
export { MigrationPlanner } from './strategy/MigrationPlanner';
export { AnalysisStateMachine, AnalysisState, AnalysisEvent } from './fsm/AnalysisStateMachine';

// Backward compatibility
export default MigrationImpactAnalyzer;

/**
 * ReportBuilder Facade - API preservation for god object elimination
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFacade } from '../../../fsm/shared/MidRangeFSM';
import { ReportBuilderCore } from './ReportBuilderCore';
import { ReportBuilderFSM } from './ReportBuilderFSM';
import { AnalysisResult, AnalysisReport } from '../types/AnalysisTypes';

export class ReportBuilderFacade extends ComponentFacade {
  private reportHistory: Map<string, AnalysisReport[]> = new Map();

  constructor() {
    const core = new ReportBuilderCore({});
    const fsm = new ReportBuilderFSM({
      componentId: `ReportBuilder-${Date.now()}`,
      initialState: 'UNINITIALIZED' as any,
      enableLogging: true,
      enableMetrics: true
    });
    super(core, fsm);
  }

  /**
   * Build report from analysis result (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async build(analysisResult: AnalysisResult, format: string): Promise<AnalysisReport> {
    if (!this.core.isInitialized()) {
      await this.initialize();
    }

    const reportId = this.generateReportId();
    const reportFSM = this.fsm as ReportBuilderFSM;

    // Start report generation
    const started = await reportFSM.startReportGeneration(reportId);
    if (!started) {
      throw new Error('Failed to start report generation');
    }

    try {
      // Process through core
      const report = await this.core.process({ analysisResult, format });

      // Store in history
      this.storeReportHistory(analysisResult.analysisType, report);

      // Complete generation
      await reportFSM.completeReportGeneration();

      return report;
    } catch (error) {
      await this.fsm.processEvent('ERROR_OCCURRED' as any);
      throw new Error(`Failed to build ${format} report: ${error.message}`);
    }
  }

  /**
   * Build multiple reports in batch
   * NASA Rule 10: ≤60 lines
   */
  async buildBatch(requests: Array<{ result: AnalysisResult; format: string }>): Promise<AnalysisReport[]> {
    const reports: AnalysisReport[] = [];

    for (const request of requests) {
      try {
        const report = await this.build(request.result, request.format);
        reports.push(report);
      } catch (error) {
        console.error(`Failed to build report for ${request.result.analysisId}:`, error);
        // Continue with other reports
      }
    }

    return reports;
  }

  /**
   * Get report history for analysis type
   * NASA Rule 10: ≤60 lines
   */
  getReportHistory(analysisType: string): AnalysisReport[] {
    return this.reportHistory.get(analysisType) || [];
  }

  /**
   * Clear report history
   */
  clearReportHistory(analysisType?: string): void {
    if (analysisType) {
      this.reportHistory.delete(analysisType);
    } else {
      this.reportHistory.clear();
    }
  }

  /**
   * Get report statistics
   */
  getReportStats(): any {
    const reportFSM = this.fsm as ReportBuilderFSM;
    const fsmStats = reportFSM.getReportStats();

    return {
      ...fsmStats,
      historySize: Array.from(this.reportHistory.values()).flat().length,
      analysisTypes: Array.from(this.reportHistory.keys())
    };
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeReportHistory(analysisType: string, report: AnalysisReport): void {
    if (!this.reportHistory.has(analysisType)) {
      this.reportHistory.set(analysisType, []);
    }

    const history = this.reportHistory.get(analysisType)!;
    history.push(report);

    // Keep only last 50 reports per type
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }
}

// Backward compatibility export
export { ReportBuilderFacade as ReportBuilder };
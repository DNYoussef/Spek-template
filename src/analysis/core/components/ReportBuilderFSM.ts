/**
 * ReportBuilder FSM - State machine for report generation
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { MidRangeFSM, ComponentState, ComponentEvent } from '../../../fsm/shared/MidRangeFSM';

export class ReportBuilderFSM extends MidRangeFSM {
  private currentReportId?: string;
  private reportCount: number = 0;

  protected initializeStateHandlers(): void {
    this.stateHandlers.set(ComponentState.INITIALIZING, async () => {
      this.log('ReportBuilder initializing templates...');
      await this.loadTemplates();
    });

    this.stateHandlers.set(ComponentState.READY, async () => {
      this.log('ReportBuilder ready for report generation');
    });

    this.stateHandlers.set(ComponentState.PROCESSING, async () => {
      this.log(`ReportBuilder generating report: ${this.currentReportId}`);
      this.reportCount++;
      await this.trackProcessing();
    });

    this.stateHandlers.set(ComponentState.ERROR, async () => {
      this.log('ReportBuilder encountered error during generation');
      this.currentReportId = undefined;
    });

    this.stateHandlers.set(ComponentState.SHUTDOWN, async () => {
      this.log(`ReportBuilder shutting down (generated ${this.reportCount} reports)`);
    });
  }

  /**
   * Start report generation
   * NASA Rule 10: ≤60 lines
   */
  async startReportGeneration(reportId: string): Promise<boolean> {
    if (this.currentState !== ComponentState.READY) {
      this.log('ReportBuilder not ready for generation');
      return false;
    }

    this.currentReportId = reportId;
    return await this.processEvent(ComponentEvent.START_PROCESSING);
  }

  /**
   * Complete report generation
   */
  async completeReportGeneration(): Promise<boolean> {
    const success = await this.processEvent(ComponentEvent.COMPLETE_PROCESSING);
    if (success) {
      this.currentReportId = undefined;
    }
    return success;
  }

  /**
   * Get report statistics
   */
  getReportStats(): { currentReport?: string; totalReports: number } {
    return {
      currentReport: this.currentReportId,
      totalReports: this.reportCount
    };
  }

  private async loadTemplates(): Promise<void> {
    // Simulate template loading
    await new Promise(resolve => setTimeout(resolve, 50));
    this.log('Report templates loaded');
  }

  private async trackProcessing(): Promise<void> {
    const startTime = Date.now();
    this.metrics.lastProcessedAt = new Date();
    // Simulate processing time tracking
    await new Promise(resolve => setTimeout(resolve, 10));
    this.metrics.processingTime += Date.now() - startTime;
  }
}
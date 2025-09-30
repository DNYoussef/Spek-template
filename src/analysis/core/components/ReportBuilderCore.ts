/**
 * ReportBuilder Core - Core functionality decomposed from god object
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentCore } from '../../../fsm/shared/MidRangeFSM';
import { AnalysisResult, AnalysisReport } from '../types/AnalysisTypes';

export interface ReportTemplate {
  name: string;
  format: string;
  contentGenerator: string;
}

export class ReportBuilderCore extends ComponentCore {
  private reportTemplates: Map<string, ReportTemplate> = new Map();

  async initialize(): Promise<void> {
    this.setupReportTemplates();
    this.initialized = true;
    console.log('[ReportBuilderCore] Initialized with templates');
  }

  async process(data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('ReportBuilderCore not initialized');
    }

    const { analysisResult, format } = data;
    return await this.buildReport(analysisResult, format);
  }

  async cleanup(): Promise<void> {
    this.reportTemplates.clear();
    this.initialized = false;
    console.log('[ReportBuilderCore] Cleaned up');
  }

  /**
   * Build report from analysis result
   * NASA Rule 10: ≤60 lines
   */
  private async buildReport(analysisResult: AnalysisResult, format: string): Promise<AnalysisReport> {
    if (!analysisResult?.analysisId) {
      throw new Error('Valid analysis result with ID required');
    }

    if (!format || typeof format !== 'string') {
      throw new Error('Valid report format required');
    }

    const template = this.reportTemplates.get(format);
    if (!template) {
      throw new Error(`Report template not found: ${format}`);
    }

    const reportId = this.generateReportId();
    const startTime = Date.now();

    const report: AnalysisReport = {
      id: reportId,
      analysisId: analysisResult.analysisId,
      format: format as 'json' | 'html' | 'markdown' | 'pdf' | 'csv' | 'xml',
      content: await this.generateContent(analysisResult, template),
      summary: this.generateSummary(analysisResult),
      sections: await this.generateSections(analysisResult, template),
      metadata: {
        generator: 'ReportBuilderCore',
        version: '2.0.0',
        template: template.name,
        executionTime: Date.now() - startTime,
        size: 0
      },
      createdAt: Date.now()
    };

    report.metadata.size = JSON.stringify(report.content).length;
    return report;
  }

  /**
   * Generate report content
   * NASA Rule 10: ≤60 lines
   */
  private async generateContent(result: AnalysisResult, template: ReportTemplate): Promise<any> {
    if (!result?.analysisType) {
      throw new Error('Valid analysis result required');
    }

    if (!template?.contentGenerator) {
      throw new Error('Valid template required');
    }

    switch (template.format) {
      case 'json':
        return this.generateJSONContent(result);
      case 'html':
        return this.generateHTMLContent(result);
      case 'markdown':
        return this.generateMarkdownContent(result);
      case 'csv':
        return this.generateCSVContent(result);
      default:
        return this.generateDefaultContent(result);
    }
  }

  /**
   * Generate JSON content
   * NASA Rule 10: ≤60 lines
   */
  private generateJSONContent(result: AnalysisResult): any {
    return {
      analysisId: result.analysisId,
      analysisType: result.analysisType,
      timestamp: result.timestamp,
      passed: result.passed,
      score: result.score,
      summary: {
        totalIssues: result.patterns.length + result.violations.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      },
      details: {
        patterns: result.patterns,
        violations: result.violations,
        recommendations: result.recommendations
      }
    };
  }

  private generateHTMLContent(result: AnalysisResult): string {
    return `<h1>Analysis Report: ${result.analysisType}</h1><p>Score: ${result.score}</p>`;
  }

  private generateMarkdownContent(result: AnalysisResult): string {
    return `# Analysis Report: ${result.analysisType}\n\nScore: ${result.score}`;
  }

  private generateCSVContent(result: AnalysisResult): string {
    return `Analysis ID,Type,Score,Passed\n${result.analysisId},${result.analysisType},${result.score},${result.passed}`;
  }

  private generateDefaultContent(result: AnalysisResult): any {
    return { analysisId: result.analysisId, type: result.analysisType, score: result.score };
  }

  private generateSummary(result: AnalysisResult): any {
    return {
      totalIssues: result.patterns.length + result.violations.length,
      score: result.score,
      passed: result.passed
    };
  }

  private async generateSections(result: AnalysisResult, template: ReportTemplate): Promise<any[]> {
    return [
      { name: 'Summary', content: this.generateSummary(result) },
      { name: 'Details', content: { patterns: result.patterns, violations: result.violations } }
    ];
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupReportTemplates(): void {
    this.reportTemplates.set('json', { name: 'JSON Report', format: 'json', contentGenerator: 'json' });
    this.reportTemplates.set('html', { name: 'HTML Report', format: 'html', contentGenerator: 'html' });
    this.reportTemplates.set('markdown', { name: 'Markdown Report', format: 'markdown', contentGenerator: 'markdown' });
    this.reportTemplates.set('csv', { name: 'CSV Report', format: 'csv', contentGenerator: 'csv' });
  }
}
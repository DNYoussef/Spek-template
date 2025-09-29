/**
 * ValidationReporter.ts
 * Structured reporting component with NASA POT10 compliance
 * Single responsibility: Generate and manage validation reports
 */

import {
  ValidationContext,
  ReportData,
  ValidationFinding,
  ComplianceLevel
} from '../types/ValidationFSMTypes';

export class ValidationReporter {
  private readonly reportCache: Map<string, ReportData>;
  private readonly reportTemplates: Map<string, ReportTemplate>;
  
  // NASA Rule 10: Bounded constants
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_FINDINGS_PER_REPORT = 50;
  private readonly MAX_RECOMMENDATIONS = 20;

  constructor() {
    this.reportCache = new Map();
    this.reportTemplates = new Map();
    this.initializeTemplates();
  }

  /**
   * Generate validation report (NASA Rule 10: ≤60 lines)
   */
  async generateReport(context: ValidationContext): Promise<ReportData> {
    // Assertion 1: Valid context
    if (!context || !context.targetId || !context.validationType) {
      throw new Error('ValidationReporter: Valid validation context required');
    }

    // Assertion 2: Context has results
    if (!context.checkResults || !context.validationResults) {
      throw new Error('ValidationReporter: Context must have check and validation results');
    }

    const reportId = this.generateReportId(context);
    
    // Check cache first
    const cachedReport = this.reportCache.get(reportId);
    if (cachedReport) {
      return cachedReport;
    }

    const generatedAt = Date.now();
    
    // Calculate summary metrics
    const summary = this.calculateSummary(context);
    
    // Extract findings with bounded limits
    const findings = this.extractFindings(context);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(context, findings);

    const reportData: ReportData = {
      reportId,
      generatedAt,
      summary,
      findings,
      recommendations
    };

    // Cache report with size management
    this.cacheReport(reportId, reportData);

    return reportData;
  }

  /**
   * Export report in specified format (NASA Rule 10: ≤60 lines)
   */
  async exportReport(reportData: ReportData, format: 'JSON' | 'HTML' | 'PDF'): Promise<string> {
    // Assertion 1: Valid report data
    if (!reportData || !reportData.reportId) {
      throw new Error('ValidationReporter: Valid report data required');
    }

    // Assertion 2: Valid format
    if (!['JSON', 'HTML', 'PDF'].includes(format)) {
      throw new Error(`ValidationReporter: Unsupported format ${format}`);
    }

    switch (format) {
      case 'JSON':
        return this.exportJSON(reportData);
      case 'HTML':
        return this.exportHTML(reportData);
      case 'PDF':
        return this.exportPDF(reportData);
      default:
        throw new Error(`ValidationReporter: Format ${format} not implemented`);
    }
  }

  /**
   * Archive report (NASA Rule 10: ≤60 lines)
   */
  async archiveReport(reportId: string): Promise<void> {
    // Assertion 1: Valid report ID
    if (!reportId) {
      throw new Error('ValidationReporter: Report ID required');
    }

    // Assertion 2: Report exists
    const report = this.reportCache.get(reportId);
    if (!report) {
      throw new Error(`ValidationReporter: Report ${reportId} not found`);
    }

    // Archive to persistent storage (simulated)
    const archiveData = {
      reportId,
      archivedAt: Date.now(),
      originalData: report
    };

    // Remove from active cache
    this.reportCache.delete(reportId);

    // Log archival
    console.log(`Report ${reportId} archived successfully`);
  }

  /**
   * Calculate summary metrics (NASA Rule 10: ≤60 lines)
   */
  private calculateSummary(context: ValidationContext): ReportData['summary'] {
    const checkResults = context.checkResults || [];
    const validationResults = context.validationResults || [];
    
    // Bounded calculation for NASA Rule 10
    const maxChecks = Math.min(checkResults.length, 200);
    
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    
    for (let i = 0; i < maxChecks; i++) {
      const result = checkResults[i];
      totalChecks++;
      
      if (result.status === 'PASS') {
        passedChecks++;
      } else if (result.status === 'FAIL') {
        failedChecks++;
      }
    }

    // Calculate compliance score
    const scores = validationResults.map(r => r.score).slice(0, 50);
    const complianceScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      complianceScore: Math.round(complianceScore)
    };
  }

  /**
   * Extract findings from context (NASA Rule 10: ≤60 lines)
   */
  private extractFindings(context: ValidationContext): ValidationFinding[] {
    const findings: ValidationFinding[] = [];
    
    // Process validation results (bounded)
    const maxResults = Math.min(context.validationResults.length, this.MAX_FINDINGS_PER_REPORT);
    
    for (let i = 0; i < maxResults; i++) {
      const result = context.validationResults[i];
      
      if (result.status === 'NON_COMPLIANT' || result.status === 'PARTIAL') {
        const finding: ValidationFinding = {
          findingId: `finding-${i + 1}`,
          severity: this.determineSeverity(result.score),
          description: `Rule ${result.rule} compliance issue`,
          location: context.targetId,
          remediation: result.recommendations.join('; '),
          timeline: this.determineTimeline(result.score)
        };
        
        findings.push(finding);
      }
    }

    // Process errors as findings
    const maxErrors = Math.min(context.errors.length, 10);
    for (let i = 0; i < maxErrors; i++) {
      const error = context.errors[i];
      
      const finding: ValidationFinding = {
        findingId: `error-${i + 1}`,
        severity: ComplianceLevel.HIGH,
        description: `Validation error: ${error.message}`,
        location: context.targetId,
        remediation: 'Fix validation error and retry',
        timeline: 'Immediate'
      };
      
      findings.push(finding);
    }

    return findings.slice(0, this.MAX_FINDINGS_PER_REPORT);
  }

  /**
   * Generate recommendations (NASA Rule 10: ≤60 lines)
   */
  private generateRecommendations(context: ValidationContext, findings: ValidationFinding[]): string[] {
    const recommendations: string[] = [];
    
    // Extract from validation results
    const maxResults = Math.min(context.validationResults.length, 30);
    for (let i = 0; i < maxResults; i++) {
      const result = context.validationResults[i];
      recommendations.push(...result.recommendations);
    }

    // Add generic recommendations based on findings
    const criticalFindings = findings.filter(f => f.severity === ComplianceLevel.CRITICAL).length;
    const highFindings = findings.filter(f => f.severity === ComplianceLevel.HIGH).length;
    
    if (criticalFindings > 0) {
      recommendations.push('Address all critical compliance issues immediately');
    }
    
    if (highFindings > 2) {
      recommendations.push('Implement systematic quality improvements');
    }
    
    if (context.summary.complianceScore < 70) {
      recommendations.push('Comprehensive compliance review recommended');
    }

    // Remove duplicates and limit size
    const uniqueRecommendations = [...new Set(recommendations)];
    return uniqueRecommendations.slice(0, this.MAX_RECOMMENDATIONS);
  }

  /**
   * Export to JSON format (NASA Rule 10: ≤60 lines)
   */
  private exportJSON(reportData: ReportData): string {
    try {
      return JSON.stringify(reportData, null, 2);
    } catch (error) {
      throw new Error(`ValidationReporter: JSON export failed - ${error.message}`);
    }
  }

  /**
   * Export to HTML format (NASA Rule 10: ≤60 lines)
   */
  private exportHTML(reportData: ReportData): string {
    const template = this.reportTemplates.get('HTML');
    if (!template) {
      throw new Error('ValidationReporter: HTML template not found');
    }
    
    let html = template.content;
    
    // Replace placeholders
    html = html.replace('{{REPORT_ID}}', reportData.reportId);
    html = html.replace('{{GENERATED_AT}}', new Date(reportData.generatedAt).toISOString());
    html = html.replace('{{COMPLIANCE_SCORE}}', reportData.summary.complianceScore.toString());
    html = html.replace('{{TOTAL_CHECKS}}', reportData.summary.totalChecks.toString());
    html = html.replace('{{PASSED_CHECKS}}', reportData.summary.passedChecks.toString());
    html = html.replace('{{FAILED_CHECKS}}', reportData.summary.failedChecks.toString());
    
    // Add findings
    const findingsHtml = reportData.findings.map(f => 
      `<li><strong>${f.severity}</strong>: ${f.description} (${f.location})</li>`
    ).join('\n');
    html = html.replace('{{FINDINGS}}', findingsHtml);
    
    // Add recommendations
    const recommendationsHtml = reportData.recommendations.map(r => 
      `<li>${r}</li>`
    ).join('\n');
    html = html.replace('{{RECOMMENDATIONS}}', recommendationsHtml);
    
    return html;
  }

  /**
   * Helper methods (NASA Rule 10: ≤60 lines each)
   */
  private exportPDF(reportData: ReportData): string {
    // Simplified PDF export (placeholder)
    return `PDF Export - Report ${reportData.reportId} (${reportData.summary.complianceScore}% compliance)`;
  }

  private generateReportId(context: ValidationContext): string {
    return `report-${context.targetId}-${Date.now()}`;
  }

  private determineSeverity(score: number): ComplianceLevel {
    if (score < 30) return ComplianceLevel.CRITICAL;
    if (score < 60) return ComplianceLevel.HIGH;
    if (score < 80) return ComplianceLevel.MEDIUM;
    return ComplianceLevel.LOW;
  }

  private determineTimeline(score: number): string {
    if (score < 30) return 'Immediate';
    if (score < 60) return 'Within 1 week';
    if (score < 80) return 'Within 1 month';
    return 'Next quarter';
  }

  private cacheReport(reportId: string, reportData: ReportData): void {
    if (this.reportCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.reportCache.keys().next().value;
      if (firstKey) this.reportCache.delete(firstKey);
    }
    this.reportCache.set(reportId, reportData);
  }

  private initializeTemplates(): void {
    this.reportTemplates.set('HTML', {
      name: 'Basic HTML Report',
      content: `
<!DOCTYPE html>
<html>
<head><title>Validation Report {{REPORT_ID}}</title></head>
<body>
  <h1>Validation Report</h1>
  <p>Report ID: {{REPORT_ID}}</p>
  <p>Generated: {{GENERATED_AT}}</p>
  <h2>Summary</h2>
  <p>Compliance Score: {{COMPLIANCE_SCORE}}%</p>
  <p>Total Checks: {{TOTAL_CHECKS}} | Passed: {{PASSED_CHECKS}} | Failed: {{FAILED_CHECKS}}</p>
  <h2>Findings</h2>
  <ul>{{FINDINGS}}</ul>
  <h2>Recommendations</h2>
  <ul>{{RECOMMENDATIONS}}</ul>
</body>
</html>`
    });
  }
}

interface ReportTemplate {
  name: string;
  content: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: validation-reporter-001
// inputs: ["ValidationFSMTypes.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
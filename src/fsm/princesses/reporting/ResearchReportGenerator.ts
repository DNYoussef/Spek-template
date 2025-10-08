/**
 * ResearchReportGenerator - Research Report Generation Service
 * NASA Rule 10 Compliant - All functions ≤60 lines
 * Handles creation and formatting of research reports
 */

export class ResearchReportGenerator {

  /**
   * Create complete research report
   * NASA Rule 10: ≤60 lines
   */
  async createCompleteReport(data: any): Promise<any> {
    const reportData = {
      executiveSummary: '',
      methodology: '',
      findings: '',
      recommendations: '',
      appendices: '',
      reviewed: false,
      approved: false
    };

    reportData.executiveSummary = await this.generateExecutiveSummary(data);
    reportData.methodology = await this.documentMethodology(data);
    reportData.findings = await this.compileFindings(data);
    reportData.recommendations = await this.formatRecommendations(data.recommendations);
    reportData.appendices = await this.createAppendices(data);

    await this.writeReportToFile(reportData);

    const reviewResults = await this.reviewReportQuality(reportData);
    reportData.reviewed = reviewResults.reviewed;
    reportData.approved = reviewResults.approved;

    return reportData;
  }

  /**
   * Generate executive summary
   * NASA Rule 10: ≤60 lines
   */
  private async generateExecutiveSummary(data: any): Promise<string> {
    const findings = data.findings;
    const validation = data.validation;
    const recommendations = data.recommendations;

    const keyPoints = [
      `Research conducted with ${findings?.confidence || 0}% confidence level`,
      `${findings?.keyInsights?.length || 0} key insights identified`,
      `${recommendations?.strategic?.length || 0} strategic recommendations developed`,
      `Validation score: ${validation?.details?.validationScore || 0}/100`
    ];

    return `Executive Summary: ${keyPoints.join('. ')}.`;
  }

  /**
   * Document research methodology
   * NASA Rule 10: ≤60 lines
   */
  private async documentMethodology(data: any): Promise<string> {
    const sources = data.sources;
    const analysis = data.analysis;
    const validation = data.validation;

    const methodology = [
      `Data Sources: ${sources?.academic?.length || 0} academic, ${sources?.industry?.length || 0} industry, ${sources?.internal?.length || 0} internal`,
      `Analysis Method: ${analysis?.methodology || 'Mixed-methods approach'}`,
      `Data Points: ${analysis?.dataPoints || 0} total data points analyzed`,
      `Validation: ${validation?.details?.reviewers || 0} reviewers, ${validation?.details?.experts || 0} experts consulted`
    ];

    return `Methodology: ${methodology.join('. ')}.`;
  }

  /**
   * Compile research findings
   * NASA Rule 10: ≤60 lines
   */
  private async compileFindings(data: any): Promise<string> {
    const analysis = data.analysis;
    const findings = data.findings;
    const dataCollection = data.dataCollection;

    const findingsText = [
      `Analysis of ${dataCollection?.academicPapers || 0} academic papers and ${dataCollection?.industryReports || 0} industry reports`,
      `Identified ${analysis?.patterns?.length || 0} significant patterns`,
      `Found ${analysis?.correlations?.length || 0} correlations between factors`,
      `Key insights: ${findings?.keyInsights?.slice(0, 3).join(', ') || 'None specified'}`
    ];

    return `Key Findings: ${findingsText.join('. ')}.`;
  }

  /**
   * Format recommendations section
   * NASA Rule 10: ≤60 lines
   */
  private async formatRecommendations(recommendations: any): Promise<string> {
    if (!recommendations) {
      return 'Recommendations: No recommendations generated.';
    }

    const strategic = recommendations.strategic?.join('\n• ') || '';
    const tactical = recommendations.tactical?.join('\n• ') || '';
    const operational = recommendations.operational?.join('\n• ') || '';

    const sections = [];
    if (strategic) sections.push(`Strategic:\n• ${strategic}`);
    if (tactical) sections.push(`Tactical:\n• ${tactical}`);
    if (operational) sections.push(`Operational:\n• ${operational}`);

    return `Recommendations:\n\n${sections.join('\n\n')}`;
  }

  /**
   * Create appendices section
   * NASA Rule 10: ≤60 lines
   */
  private async createAppendices(data: any): Promise<string> {
    const sources = data.sources;
    const analysis = data.analysis;
    const validationDetails = data.validationDetails;

    const appendices = [
      'A. Data Sources and References',
      '  - Academic sources: ' + (sources?.academic?.length || 0),
      '  - Industry sources: ' + (sources?.industry?.length || 0),
      '  - Internal sources: ' + (sources?.internal?.length || 0),
      '',
      'B. Analysis Details',
      '  - Methodology: ' + (analysis?.methodology || 'Not specified'),
      '  - Data points: ' + (analysis?.dataPoints || 0),
      '  - Confidence: ' + (analysis?.confidence || 0) + '%',
      '',
      'C. Validation Results',
      '  - Reviewers: ' + (validationDetails?.reviewers || 0),
      '  - Validation score: ' + (validationDetails?.validationScore || 0) + '/100'
    ];

    return appendices.join('\n');
  }

  /**
   * Write report to file
   * NASA Rule 10: ≤60 lines
   */
  private async writeReportToFile(reportData: any): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const reportContent = await this.formatReportContent(reportData);
    const reportPath = path.join(process.cwd(), 'research-report.md');

    try {
      fs.writeFileSync(reportPath, reportContent);
    } catch (error) {
      console.warn('Could not write report to file:', error);
    }
  }

  /**
   * Format complete report content
   * NASA Rule 10: ≤60 lines
   */
  private async formatReportContent(reportData: any): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];

    return `# Research Report
Generated: ${timestamp}

## Executive Summary
${reportData.executiveSummary}

## Methodology
${reportData.methodology}

## Findings
${reportData.findings}

## ${reportData.recommendations}

## Appendices
${reportData.appendices}

---
Report generated by Research Princess FSM
`;
  }

  /**
   * Review report quality
   * NASA Rule 10: ≤60 lines
   */
  private async reviewReportQuality(reportData: any): Promise<{ reviewed: boolean; approved: boolean }> {
    const hasContent = reportData.executiveSummary &&
                      reportData.methodology &&
                      reportData.findings &&
                      reportData.recommendations;

    const contentQuality = this.assessContentQuality(reportData);
    const structureQuality = this.assessStructureQuality(reportData);

    return {
      reviewed: true,
      approved: hasContent && contentQuality >= 75 && structureQuality >= 75
    };
  }

  /**
   * Assess content quality
   * NASA Rule 10: ≤60 lines
   */
  private assessContentQuality(reportData: any): number {
    let score = 0;

    // Check executive summary quality
    if (reportData.executiveSummary?.length > 100) score += 25;

    // Check methodology documentation
    if (reportData.methodology?.length > 100) score += 25;

    // Check findings detail
    if (reportData.findings?.length > 100) score += 25;

    // Check recommendations completeness
    if (reportData.recommendations?.length > 100) score += 25;

    return score;
  }

  /**
   * Assess structure quality
   * NASA Rule 10: ≤60 lines
   */
  private assessStructureQuality(reportData: any): number {
    let score = 0;

    // Check if all required sections present
    const requiredSections = ['executiveSummary', 'methodology', 'findings', 'recommendations', 'appendices'];
    const presentSections = requiredSections.filter(section => reportData[section]);
    score += (presentSections.length / requiredSections.length) * 100;

    return Math.round(score);
  }

  /**
   * Generate report metadata
   * NASA Rule 10: ≤60 lines
   */
  async generateReportMetadata(reportData: any): Promise<any> {
    return {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      sections: Object.keys(reportData).length,
      wordCount: this.calculateWordCount(reportData),
      quality: {
        content: this.assessContentQuality(reportData),
        structure: this.assessStructureQuality(reportData)
      },
      approved: reportData.approved,
      reviewed: reportData.reviewed
    };
  }

  /**
   * Calculate total word count
   * NASA Rule 10: ≤60 lines
   */
  private calculateWordCount(reportData: any): number {
    const allText = [
      reportData.executiveSummary,
      reportData.methodology,
      reportData.findings,
      reportData.recommendations,
      reportData.appendices
    ].join(' ');

    return allText.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-agent-023-research-fsm-refactor
// inputs: ["src/fsm/princesses/ResearchPrincessFSM.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-agent-023-v1"}
// === END FOOTER ===
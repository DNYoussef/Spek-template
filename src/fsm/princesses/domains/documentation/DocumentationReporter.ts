/**
 * DocumentationReporter - Reporting for Documentation Princess
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 * Extracted from DocumentationPrincessFSM.ts god object
 */

export interface DocumentationReport {
  summary: {
    totalFiles: number;
    documentedFiles: number;
    coveragePercentage: number;
    qualityScore: number;
  };
  analysis: any;
  apiDocumentation: any;
  codeDocumentation: any;
  recommendations: string[];
  timestamp: number;
}

export class DocumentationReporter {

  /**
   * Generate comprehensive documentation report
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async generateReport(data: any): Promise<DocumentationReport> {
    console.assert(data !== null, 'Report data cannot be null');
    console.assert(typeof data === 'object', 'Report data must be an object');

    const summary = this.generateSummary(data);
    const recommendations = this.generateRecommendations(data);

    return {
      summary,
      analysis: data.analysis,
      apiDocumentation: data.apiDocumentation,
      codeDocumentation: data.codeDocumentation,
      recommendations,
      timestamp: Date.now()
    };
  }

  /**
   * Generate report summary
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private generateSummary(data: any): any {
    console.assert(data.analysis !== undefined, 'Analysis data must be provided');
    console.assert(typeof data.analysis === 'object', 'Analysis must be an object');

    const analysis = data.analysis;
    const apiDocs = data.apiDocumentation;
    const codeDocs = data.codeDocumentation;

    return {
      totalFiles: analysis.totalFiles || 0,
      documentedFiles: analysis.documentedFiles || 0,
      coveragePercentage: analysis.coveragePercentage || 0,
      qualityScore: this.calculateQualityScore(data)
    };
  }

  /**
   * Calculate overall quality score
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private calculateQualityScore(data: any): number {
    console.assert(data !== null, 'Data cannot be null');
    console.assert(data.analysis !== undefined, 'Analysis must be available');

    let score = 0;
    const weights = {
      coverage: 0.4,
      api: 0.3,
      code: 0.3
    };

    // Coverage score
    const coverageScore = data.analysis.coveragePercentage || 0;
    score += coverageScore * weights.coverage;

    // API documentation score
    if (data.apiDocumentation && data.apiDocumentation.generated) {
      const apiScore = data.apiDocumentation.endpoints?.length > 0 ? 100 : 50;
      score += apiScore * weights.api;
    }

    // Code documentation score
    if (data.codeDocumentation && data.codeDocumentation.generated) {
      const codeScore = data.codeDocumentation.qualityScore || 0;
      score += codeScore * weights.code;
    }

    return Math.round(score);
  }

  /**
   * Generate improvement recommendations
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private generateRecommendations(data: any): string[] {
    console.assert(data !== null, 'Data cannot be null');
    console.assert(data.analysis !== undefined, 'Analysis must be available');

    const recommendations: string[] = [];
    const analysis = data.analysis;

    // Coverage recommendations
    if (analysis.coveragePercentage < 80) {
      recommendations.push('Improve documentation coverage to at least 80%');
    }

    // Missing docs recommendations
    if (analysis.missingDocs && analysis.missingDocs.length > 0) {
      const criticalMissing = analysis.missingDocs.filter((doc: any) => doc.severity === 'critical');
      if (criticalMissing.length > 0) {
        recommendations.push(`Address ${criticalMissing.length} critical missing documentation items`);
      }
    }

    // API documentation recommendations
    if (!data.apiDocumentation || !data.apiDocumentation.generated) {
      recommendations.push('Generate API documentation using OpenAPI specification');
    }

    // Code documentation recommendations
    if (!data.codeDocumentation || data.codeDocumentation.qualityScore < 70) {
      recommendations.push('Improve inline code documentation quality');
    }

    return recommendations;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:35:24-04:00 | agent@Sonnet4 | Create DocumentationReporter component | DocumentationReporter.ts | OK | NASA Rule 10 reporting logic | 0.00 | 6i7j8k9 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: princess-domain-elimination-005
- inputs: ["DocumentationPrincessFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
/**
 * Quality Princess Validators - NASA Rule 10 Compliant Validation Logic
 * All functions ≤60 lines, minimum 2 assertions per function
 */

import { QualityTask, QualityValidation, QualityPattern, QualityReport } from './QualityPrincessTypes';

export class QualityValidators {
  private readonly theaterThreshold: number;
  private readonly realityThreshold: number;

  constructor(theaterThreshold: number = 60, realityThreshold: number = 70) {
    // NASA Rule 10: Parameter validation
    if (theaterThreshold < 0 || theaterThreshold > 100) {
      throw new Error('Theater threshold must be 0-100');
    }
    if (realityThreshold < 0 || realityThreshold > 100) {
      throw new Error('Reality threshold must be 0-100');
    }

    this.theaterThreshold = theaterThreshold;
    this.realityThreshold = realityThreshold;
  }

  calculateTheaterScore(task: QualityTask, validation: any): number {
    // NASA Rule 10: Theater score calculation
    if (!task) throw new Error('Task required');
    if (!validation) throw new Error('Validation required');

    let theaterScore = 0;

    // Check for suspicious test patterns (too perfect)
    if (validation.testsPassed && 
        validation.coverage > 95 && 
        validation.lintScore === 100) {
      theaterScore += 30;
    }

    // Check for fake implementation patterns
    if (task.files?.some((file: string) => 
        file.includes('TODO') || 
        file.includes('placeholder') ||
        file.includes('mock'))) {
      theaterScore += 40;
    }

    // Check validation depth
    if (!validation.edgeCasesTested || !validation.errorHandlingTested) {
      theaterScore += 20;
    }

    // Check for generic responses
    if (validation.guidance?.includes('Standard') || 
        validation.guidance?.length < 20) {
      theaterScore += 10;
    }

    return Math.min(theaterScore, 100);
  }

  calculateRealityScore(theaterScore: number): number {
    // NASA Rule 10: Simple reality calculation
    if (theaterScore < 0 || theaterScore > 100) {
      throw new Error('Theater score must be 0-100');
    }
    if (typeof theaterScore !== 'number') {
      throw new Error('Theater score must be number');
    }

    return Math.max(100 - theaterScore, 0);
  }

  validateTaskComplexity(task: QualityTask): 'low' | 'medium' | 'high' | 'critical' {
    // NASA Rule 10: Complexity assessment
    if (!task) throw new Error('Task required');
    if (!task.description) throw new Error('Task description required');

    const fileCount = task.files?.length || 0;
    const descLength = task.description.length;
    
    // Simple fixed-loop complexity calculation
    let complexityScore = 0;
    
    if (fileCount > 10) complexityScore += 2;
    else if (fileCount > 5) complexityScore += 1;
    
    if (descLength > 500) complexityScore += 2;
    else if (descLength > 200) complexityScore += 1;
    
    if (task.type === 'security' || task.type === 'performance') {
      complexityScore += 1;
    }

    if (complexityScore >= 4) return 'critical';
    if (complexityScore >= 3) return 'high';
    if (complexityScore >= 1) return 'medium';
    return 'low';
  }

  validateTestCoverage(validation: QualityValidation): boolean {
    // NASA Rule 10: Coverage validation
    if (!validation) throw new Error('Validation required');
    if (typeof validation.coverage !== 'number') {
      throw new Error('Coverage must be number');
    }

    return validation.coverage >= 80 && 
           validation.edgeCasesTested && 
           validation.errorHandlingTested;
  }

  validateSecurityScore(validation: QualityValidation): boolean {
    // NASA Rule 10: Security validation
    if (!validation) throw new Error('Validation required');
    if (typeof validation.securityScore !== 'number') {
      throw new Error('Security score must be number');
    }

    return validation.securityScore >= 90;
  }

  validatePerformanceScore(validation: QualityValidation): boolean {
    // NASA Rule 10: Performance validation
    if (!validation) throw new Error('Validation required');
    if (typeof validation.performanceScore !== 'number') {
      throw new Error('Performance score must be number');
    }

    return validation.performanceScore >= 85;
  }

  detectTheaterPatterns(content: string): string[] {
    // NASA Rule 10: Pattern detection
    if (!content) throw new Error('Content required');
    if (typeof content !== 'string') throw new Error('Content must be string');

    const patterns: string[] = [];
    const lowerContent = content.toLowerCase();

    // Fixed pattern checks (no recursion)
    const theaterKeywords = [
      'placeholder', 'todo', 'tbd', 'coming soon',
      'mock', 'fake', 'dummy', 'stub'
    ];

    for (const keyword of theaterKeywords) {
      if (lowerContent.includes(keyword)) {
        patterns.push(`theater-keyword-${keyword}`);
      }
    }

    // Check for overly generic content
    if (content.length < 50) {
      patterns.push('theater-too-short');
    }

    if (content.includes('...') || content.includes('etc')) {
      patterns.push('theater-incomplete');
    }

    return patterns;
  }

  validatePatternQuality(pattern: QualityPattern): boolean {
    // NASA Rule 10: Pattern quality validation
    if (!pattern) throw new Error('Pattern required');
    if (!pattern.metadata) throw new Error('Pattern metadata required');

    const meta = pattern.metadata;
    
    return meta.effectiveness >= 0.7 && 
           meta.successRate >= 0.8 && 
           meta.coverage >= 70 &&
           (meta.theaterScore || 0) < this.theaterThreshold;
  }

  generateQualityRecommendations(validations: QualityValidation[]): string[] {
    // NASA Rule 10: Recommendation generation
    if (!validations) throw new Error('Validations required');
    if (!Array.isArray(validations)) throw new Error('Validations must be array');

    const recommendations: string[] = [];
    
    // Calculate averages with fixed loop
    let totalCoverage = 0;
    let totalSecurity = 0;
    let totalPerformance = 0;
    let theaterCount = 0;
    
    for (const validation of validations) {
      totalCoverage += validation.coverage;
      totalSecurity += validation.securityScore;
      totalPerformance += validation.performanceScore;
      if (validation.theaterScore > this.theaterThreshold) {
        theaterCount++;
      }
    }
    
    const avgCoverage = totalCoverage / validations.length;
    const avgSecurity = totalSecurity / validations.length;
    const avgPerformance = totalPerformance / validations.length;
    
    // Generate specific recommendations
    if (avgCoverage < 80) {
      recommendations.push('Increase test coverage to at least 80%');
    }
    
    if (avgSecurity < 90) {
      recommendations.push('Address security vulnerabilities');
    }
    
    if (avgPerformance < 85) {
      recommendations.push('Optimize performance bottlenecks');
    }
    
    if (theaterCount > 0) {
      recommendations.unshift('CRITICAL: High theater score detected - validate implementation authenticity');
    }

    return recommendations;
  }

  isTheaterWarning(theaterScore: number): boolean {
    // NASA Rule 10: Simple warning check
    if (typeof theaterScore !== 'number') throw new Error('Theater score must be number');
    if (theaterScore < 0 || theaterScore > 100) throw new Error('Theater score must be 0-100');
    
    return theaterScore > this.theaterThreshold;
  }

  isRealityValidated(realityScore: number): boolean {
    // NASA Rule 10: Simple reality check
    if (typeof realityScore !== 'number') throw new Error('Reality score must be number');
    if (realityScore < 0 || realityScore > 100) throw new Error('Reality score must be 0-100');
    
    return realityScore >= this.realityThreshold;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: quality-princess-fsm-refactor-005
// inputs: ["QualityPrincess.ts"]
// tools_used: ["claude-code", "filesystem"]
// versions: {"model":"sonnet-4","prompt":"quality-fsm-refactor-v1"}
// === END FOOTER ===
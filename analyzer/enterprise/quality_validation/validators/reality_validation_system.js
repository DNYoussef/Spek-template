/**
 * Reality Validation System - QV-002
 * 
 * Evidence-based verification system for validating claims and preventing
 * reality theater in quality assessments.
 */

class RealityValidationSystem {
  constructor() {
    this.evidenceValidators = {
      'performance': new PerformanceEvidenceValidator(),
      'quality': new QualityEvidenceValidator(),
      'functionality': new FunctionalityEvidenceValidator(),
      'security': new SecurityEvidenceValidator(),
      'maintainability': new MaintainabilityEvidenceValidator()
    };

    this.correlationAnalyzer = new EvidenceCorrelationAnalyzer();
    this.vanityMetricDetector = new VanityMetricDetector();
    this.realityConfidenceCalculator = new RealityConfidenceCalculator();
  }

  async validate(options) {
    const { claims, evidence, thresholds } = options;
    
    const validationResults = {
      validated: [],
      rejected: [],
      evidenceGaps: [],
      vanityMetrics: [],
      correlationIssues: [],
      recommendations: []
    };

    for (const claim of claims) {
      const claimValidation = await this.validateClaim(claim, evidence, thresholds);
      
      if (claimValidation.isValid) {
        validationResults.validated.push({
          claim,
          confidence: claimValidation.confidence,
          supportingEvidence: claimValidation.supportingEvidence
        });
      } else {
        validationResults.rejected.push({
          claim,
          reasons: claimValidation.rejectionReasons,
          missingEvidence: claimValidation.missingEvidence
        });
      }

      // Track evidence gaps
      if (claimValidation.evidenceGaps.length > 0) {
        validationResults.evidenceGaps.push(...claimValidation.evidenceGaps);
      }

      // Track vanity metrics
      if (claimValidation.vanityMetrics.length > 0) {
        validationResults.vanityMetrics.push(...claimValidation.vanityMetrics);
      }
    }

    // Analyze overall correlation
    const correlationAnalysis = await this.correlationAnalyzer.analyze(evidence);
    validationResults.correlationIssues = correlationAnalysis.issues;

    // Calculate average confidence
    validationResults.averageConfidence = this.calculateAverageConfidence(validationResults.validated);

    // Generate recommendations
    validationResults.recommendations = await this.generateRecommendations(validationResults);

    return validationResults;
  }

  async validateClaim(claim, evidence, thresholds) {
    const claimType = this.identifyClaimType(claim);
    const validator = this.evidenceValidators[claimType];
    
    if (!validator) {
      return this.createRejection(claim, ['Unknown claim type']);
    }

    // Get relevant evidence for this claim
    const relevantEvidence = this.extractRelevantEvidence(claim, evidence);
    
    // Validate evidence sufficiency
    const evidenceSufficiency = await validator.validateSufficiency(claim, relevantEvidence);
    if (!evidenceSufficiency.isSufficient) {
      return this.createRejection(claim, ['Insufficient evidence'], evidenceSufficiency.gaps);
    }

    // Check for vanity metrics
    const vanityMetrics = await this.vanityMetricDetector.detect(claim, relevantEvidence);
    if (vanityMetrics.length > 0 && vanityMetrics.some(m => m.severity === 'HIGH')) {
      return this.createRejection(claim, ['Contains vanity metrics'], [], vanityMetrics);
    }

    // Calculate evidence correlation
    const correlation = await this.correlationAnalyzer.calculateCorrelation(claim, relevantEvidence);
    if (correlation < thresholds.evidenceCorrelation) {
      return this.createRejection(claim, ['Poor evidence correlation'], [], [], [{
        type: 'correlation',
        expected: thresholds.evidenceCorrelation,
        actual: correlation
      }]);
    }

    // Calculate reality confidence
    const confidence = await this.realityConfidenceCalculator.calculate(claim, relevantEvidence, {
      evidenceCorrelation: correlation,
      vanityMetricScore: this.calculateVanityScore(vanityMetrics)
    });

    if (confidence < thresholds.realityConfidence) {
      return this.createRejection(claim, ['Low reality confidence'], [], vanityMetrics);
    }

    return {
      isValid: true,
      confidence,
      supportingEvidence: relevantEvidence,
      evidenceGaps: evidenceSufficiency.gaps || [],
      vanityMetrics: vanityMetrics.filter(m => m.severity !== 'HIGH'),
      correlationIssues: []
    };
  }

  identifyClaimType(claim) {
    const claimText = claim.text || claim.description || '';
    
    if (claimText.match(/performance|speed|latency|throughput/i)) return 'performance';
    if (claimText.match(/quality|defect|bug|reliability/i)) return 'quality';
    if (claimText.match(/function|feature|behavior|requirement/i)) return 'functionality';
    if (claimText.match(/security|vulnerability|auth|encrypt/i)) return 'security';
    if (claimText.match(/maintain|refactor|technical debt|complexity/i)) return 'maintainability';
    
    return 'quality'; // Default fallback
  }

  extractRelevantEvidence(claim, evidence) {
    const relevant = {};
    const claimKeywords = this.extractKeywords(claim.text || claim.description || '');
    
    for (const [category, categoryEvidence] of Object.entries(evidence)) {
      relevant[category] = {};
      
      for (const [key, value] of Object.entries(categoryEvidence)) {
        if (this.isEvidenceRelevant(key, value, claimKeywords)) {
          relevant[category][key] = value;
        }
      }
    }
    
    return relevant;
  }

  extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  isEvidenceRelevant(key, value, keywords) {
    const evidenceText = `${key} ${JSON.stringify(value)}`.toLowerCase();
    return keywords.some(keyword => evidenceText.includes(keyword));
  }

  createRejection(claim, reasons, gaps = [], vanityMetrics = [], correlationIssues = []) {
    return {
      isValid: false,
      rejectionReasons: reasons,
      missingEvidence: gaps,
      evidenceGaps: gaps,
      vanityMetrics,
      correlationIssues
    };
  }

  calculateVanityScore(vanityMetrics) {
    if (vanityMetrics.length === 0) return 0;
    
    const severityWeights = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    const totalWeight = vanityMetrics.reduce((sum, metric) => {
      return sum + (severityWeights[metric.severity] || 1);
    }, 0);
    
    return totalWeight / vanityMetrics.length;
  }

  calculateAverageConfidence(validatedClaims) {
    if (validatedClaims.length === 0) return 0;
    
    const totalConfidence = validatedClaims.reduce((sum, claim) => sum + claim.confidence, 0);
    return totalConfidence / validatedClaims.length;
  }

  async generateRecommendations(validationResults) {
    const recommendations = [];
    
    // Evidence gap recommendations
    if (validationResults.evidenceGaps.length > 0) {
      recommendations.push({
        type: 'EVIDENCE_GAPS',
        priority: 'HIGH',
        description: 'Address evidence gaps to improve claim validation',
        actions: validationResults.evidenceGaps.map(gap => `Collect evidence for: ${gap}`)
      });
    }

    // Vanity metric recommendations
    if (validationResults.vanityMetrics.length > 0) {
      recommendations.push({
        type: 'VANITY_METRICS',
        priority: 'MEDIUM',
        description: 'Replace vanity metrics with meaningful measurements',
        actions: validationResults.vanityMetrics.map(metric => `Review metric: ${metric.name}`)
      });
    }

    // Correlation recommendations
    if (validationResults.correlationIssues.length > 0) {
      recommendations.push({
        type: 'CORRELATION_ISSUES',
        priority: 'HIGH',
        description: 'Improve evidence correlation for better validation',
        actions: ['Review evidence collection methods', 'Ensure evidence directly supports claims']
      });
    }

    return recommendations;
  }
}

class PerformanceEvidenceValidator {
  async validateSufficiency(claim, evidence) {
    const requiredMetrics = ['response_time', 'throughput', 'resource_usage'];
    const gaps = [];
    
    for (const metric of requiredMetrics) {
      if (!this.hasMetric(evidence, metric)) {
        gaps.push(`Missing performance metric: ${metric}`);
      }
    }

    return {
      isSufficient: gaps.length === 0,
      gaps
    };
  }

  hasMetric(evidence, metric) {
    return Object.keys(evidence.performance || {}).some(key => 
      key.toLowerCase().includes(metric.replace('_', ''))
    );
  }
}

class QualityEvidenceValidator {
  async validateSufficiency(claim, evidence) {
    const requiredMetrics = ['test_coverage', 'defect_rate', 'code_quality'];
    const gaps = [];
    
    for (const metric of requiredMetrics) {
      if (!this.hasMetric(evidence, metric)) {
        gaps.push(`Missing quality metric: ${metric}`);
      }
    }

    return {
      isSufficient: gaps.length === 0,
      gaps
    };
  }

  hasMetric(evidence, metric) {
    const qualityEvidence = evidence.quality || {};
    return Object.keys(qualityEvidence).some(key => 
      key.toLowerCase().includes(metric.replace('_', ''))
    );
  }
}

class FunctionalityEvidenceValidator {
  async validateSufficiency(claim, evidence) {
    const gaps = [];
    
    if (!evidence.tests || Object.keys(evidence.tests).length === 0) {
      gaps.push('Missing test evidence for functionality claims');
    }

    if (!evidence.documentation || Object.keys(evidence.documentation).length === 0) {
      gaps.push('Missing documentation for functionality claims');
    }

    return {
      isSufficient: gaps.length === 0,
      gaps
    };
  }
}

class SecurityEvidenceValidator {
  async validateSufficiency(claim, evidence) {
    const requiredEvidence = ['security_scan', 'vulnerability_assessment', 'penetration_test'];
    const gaps = [];
    
    for (const evidenceType of requiredEvidence) {
      if (!this.hasSecurityEvidence(evidence, evidenceType)) {
        gaps.push(`Missing security evidence: ${evidenceType}`);
      }
    }

    return {
      isSufficient: gaps.length === 0,
      gaps
    };
  }

  hasSecurityEvidence(evidence, evidenceType) {
    const securityEvidence = evidence.security || {};
    return Object.keys(securityEvidence).some(key => 
      key.toLowerCase().includes(evidenceType.replace('_', ''))
    );
  }
}

class MaintainabilityEvidenceValidator {
  async validateSufficiency(claim, evidence) {
    const requiredMetrics = ['complexity_metrics', 'technical_debt', 'code_maintainability'];
    const gaps = [];
    
    for (const metric of requiredMetrics) {
      if (!this.hasMaintenanceMetric(evidence, metric)) {
        gaps.push(`Missing maintainability metric: ${metric}`);
      }
    }

    return {
      isSufficient: gaps.length === 0,
      gaps
    };
  }

  hasMaintenanceMetric(evidence, metric) {
    const maintenanceEvidence = evidence.maintainability || {};
    return Object.keys(maintenanceEvidence).some(key => 
      key.toLowerCase().includes(metric.replace('_', ''))
    );
  }
}

class EvidenceCorrelationAnalyzer {
  async analyze(evidence) {
    const issues = [];
    
    // Check for conflicting evidence
    const conflicts = await this.detectConflicts(evidence);
    issues.push(...conflicts);

    // Check for evidence consistency
    const consistencyIssues = await this.checkConsistency(evidence);
    issues.push(...consistencyIssues);

    return { issues };
  }

  async calculateCorrelation(claim, evidence) {
    // Simplified correlation calculation
    const evidenceCount = this.countRelevantEvidence(evidence);
    const evidenceQuality = this.assessEvidenceQuality(evidence);
    
    return (evidenceCount * evidenceQuality) / 100;
  }

  async detectConflicts(evidence) {
    const conflicts = [];
    
    // Example: Performance evidence conflicts
    const perfEvidence = evidence.performance || {};
    if (perfEvidence.response_time_improved && perfEvidence.response_time_degraded) {
      conflicts.push({
        type: 'CONFLICTING_EVIDENCE',
        category: 'performance',
        description: 'Conflicting performance evidence detected'
      });
    }

    return conflicts;
  }

  async checkConsistency(evidence) {
    const issues = [];
    
    // Check timestamp consistency
    const timestamps = this.extractTimestamps(evidence);
    if (this.hasInconsistentTimestamps(timestamps)) {
      issues.push({
        type: 'INCONSISTENT_TIMESTAMPS',
        description: 'Evidence collection timestamps are inconsistent'
      });
    }

    return issues;
  }

  countRelevantEvidence(evidence) {
    let count = 0;
    for (const category of Object.values(evidence)) {
      if (typeof category === 'object') {
        count += Object.keys(category).length;
      }
    }
    return Math.min(count, 10); // Cap at 10 for scoring
  }

  assessEvidenceQuality(evidence) {
    // Simplified quality assessment
    let qualityScore = 0;
    
    for (const [category, categoryEvidence] of Object.entries(evidence)) {
      if (typeof categoryEvidence === 'object') {
        for (const [key, value] of Object.entries(categoryEvidence)) {
          if (this.isHighQualityEvidence(key, value)) {
            qualityScore += 10;
          } else {
            qualityScore += 5;
          }
        }
      }
    }
    
    return Math.min(qualityScore, 100); // Cap at 100
  }

  isHighQualityEvidence(key, value) {
    // Check for quantitative evidence, timestamps, multiple data points
    return typeof value === 'number' || 
           (typeof value === 'object' && value.timestamp) ||
           Array.isArray(value);
  }

  extractTimestamps(evidence) {
    const timestamps = [];
    
    const traverse = (obj) => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.timestamp) timestamps.push(obj.timestamp);
        if (obj.created_at) timestamps.push(obj.created_at);
        if (obj.measured_at) timestamps.push(obj.measured_at);
        
        for (const value of Object.values(obj)) {
          traverse(value);
        }
      }
    };
    
    traverse(evidence);
    return timestamps;
  }

  hasInconsistentTimestamps(timestamps) {
    if (timestamps.length < 2) return false;
    
    const sorted = timestamps.sort();
    const timeDiff = new Date(sorted[sorted.length - 1]) - new Date(sorted[0]);
    
    // Flag if evidence spans more than 30 days without explanation
    return timeDiff > (30 * 24 * 60 * 60 * 1000);
  }
}

class VanityMetricDetector {
  async detect(claim, evidence) {
    const vanityMetrics = [];
    
    // Detect LOC-based claims
    const locMetrics = await this.detectLOCMetrics(claim, evidence);
    vanityMetrics.push(...locMetrics);

    // Detect commit count metrics
    const commitMetrics = await this.detectCommitMetrics(claim, evidence);
    vanityMetrics.push(...commitMetrics);

    // Detect fake productivity metrics
    const productivityMetrics = await this.detectFakeProductivityMetrics(claim, evidence);
    vanityMetrics.push(...productivityMetrics);

    return vanityMetrics;
  }

  async detectLOCMetrics(claim, evidence) {
    const metrics = [];
    const claimText = claim.text || claim.description || '';
    
    if (claimText.match(/lines?\s+of\s+code|LOC|SLOC/i)) {
      metrics.push({
        name: 'Lines of Code',
        severity: 'HIGH',
        type: 'vanity_metric',
        description: 'LOC is not a reliable measure of productivity or quality',
        recommendation: 'Focus on business value delivered instead'
      });
    }

    return metrics;
  }

  async detectCommitMetrics(claim, evidence) {
    const metrics = [];
    const claimText = claim.text || claim.description || '';
    
    if (claimText.match(/commit\s+count|number\s+of\s+commits/i)) {
      metrics.push({
        name: 'Commit Count',
        severity: 'MEDIUM',
        type: 'vanity_metric',
        description: 'Commit count can be gamed and doesnt reflect quality',
        recommendation: 'Measure feature completion and quality instead'
      });
    }

    return metrics;
  }

  async detectFakeProductivityMetrics(claim, evidence) {
    const metrics = [];
    const suspiciousMetrics = [
      'function count',
      'class count',
      'file count',
      'comment count'
    ];

    const claimText = (claim.text || claim.description || '').toLowerCase();
    
    for (const metric of suspiciousMetrics) {
      if (claimText.includes(metric)) {
        metrics.push({
          name: metric,
          severity: 'MEDIUM',
          type: 'vanity_metric',
          description: `${metric} is not a reliable productivity measure`,
          recommendation: 'Focus on user value and quality metrics'
        });
      }
    }

    return metrics;
  }
}

class RealityConfidenceCalculator {
  async calculate(claim, evidence, factors) {
    const { evidenceCorrelation, vanityMetricScore } = factors;
    
    // Base confidence from evidence correlation
    let confidence = evidenceCorrelation;
    
    // Reduce confidence based on vanity metrics
    confidence -= (vanityMetricScore * 0.2);
    
    // Apply evidence quality multiplier
    const evidenceQuality = this.assessEvidenceQuality(evidence);
    confidence *= evidenceQuality;
    
    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  assessEvidenceQuality(evidence) {
    let qualityScore = 0.5; // Base quality
    
    // Check for quantitative evidence
    if (this.hasQuantitativeEvidence(evidence)) {
      qualityScore += 0.2;
    }
    
    // Check for multiple evidence sources
    if (this.hasMultipleSources(evidence)) {
      qualityScore += 0.2;
    }
    
    // Check for recent evidence
    if (this.hasRecentEvidence(evidence)) {
      qualityScore += 0.1;
    }
    
    return Math.min(1, qualityScore);
  }

  hasQuantitativeEvidence(evidence) {
    const traverse = (obj) => {
      if (typeof obj === 'number') return true;
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(traverse);
      }
      return false;
    };
    
    return traverse(evidence);
  }

  hasMultipleSources(evidence) {
    return Object.keys(evidence).length > 2;
  }

  hasRecentEvidence(evidence) {
    const timestamps = [];
    
    const traverse = (obj) => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.timestamp) timestamps.push(obj.timestamp);
        for (const value of Object.values(obj)) {
          traverse(value);
        }
      }
    };
    
    traverse(evidence);
    
    if (timestamps.length === 0) return false;
    
    const mostRecent = Math.max(...timestamps.map(ts => new Date(ts).getTime()));
    const daysSinceRecent = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
    
    return daysSinceRecent <= 7; // Within last 7 days
  }
}

module.exports = RealityValidationSystem;
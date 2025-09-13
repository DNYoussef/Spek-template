/**
 * NASA POT10 Compliance Gate Manager (QG-003)
 * 
 * Implements NASA POT10 compliance gate enforcement with 95%+ threshold
 * validation for defense industry readiness and enterprise compliance.
 */

import { EventEmitter } from 'events';

export interface NASAThresholds {
  complianceThreshold: number; // Minimum 95%
  criticalFindings: number; // Maximum allowed (0)
  documentationCoverage: number; // Minimum percentage
}

export interface ComplianceMetrics {
  overallScore: number;
  documentation: DocumentationMetrics;
  codeQuality: CodeQualityMetrics;
  testing: TestingMetrics;
  security: SecurityMetrics;
  processCompliance: ProcessMetrics;
  traceability: TraceabilityMetrics;
}

export interface DocumentationMetrics {
  coverage: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  requirements: {
    documented: number;
    total: number;
    percentage: number;
  };
  interfaces: {
    documented: number;
    total: number;
    percentage: number;
  };
}

export interface CodeQualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  };
  standards: {
    codingStandards: number;
    namingConventions: number;
    structuralCompliance: number;
  };
  metrics: {
    linesOfCode: number;
    duplicateCode: number;
    technicalDebt: number;
  };
}

export interface TestingMetrics {
  coverage: {
    line: number;
    branch: number;
    function: number;
    statement: number;
  };
  quality: {
    testCases: number;
    passRate: number;
    reliability: number;
  };
  verification: {
    unitTests: number;
    integrationTests: number;
    systemTests: number;
  };
}

export interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    owasp: number;
    nist: number;
    iso27001: number;
  };
  controls: {
    authentication: number;
    authorization: number;
    encryption: number;
    logging: number;
  };
}

export interface ProcessMetrics {
  changeControl: number;
  configurationManagement: number;
  qualityAssurance: number;
  riskManagement: number;
  verification: number;
  validation: number;
}

export interface TraceabilityMetrics {
  requirements: {
    forward: number;
    backward: number;
    bidirectional: number;
  };
  coverage: {
    requirements: number;
    design: number;
    implementation: number;
    testing: number;
  };
}

export interface ComplianceViolation {
  category: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  requirement: string;
  impact: string;
  remediation: string;
  timeline: string;
}

export interface ComplianceResult {
  metrics: ComplianceMetrics;
  violations: ComplianceViolation[];
  recommendations: string[];
  passed: boolean;
  score: number;
}

export class ComplianceGateManager extends EventEmitter {
  private thresholds: NASAThresholds;
  private complianceHistory: Map<string, ComplianceMetrics> = new Map();
  private pot10Requirements: Map<string, any> = new Map();

  constructor(thresholds: NASAThresholds) {
    super();
    this.thresholds = thresholds;
    this.initializePOT10Requirements();
  }

  /**
   * Initialize NASA POT10 requirements matrix
   */
  private initializePOT10Requirements(): void {
    // NASA POT10 (Power of Ten) Rules for Safety-Critical Code
    this.pot10Requirements.set('complexity', {
      rule: 'Restrict all code to very simple control flow constructs',
      threshold: 15, // Maximum cyclomatic complexity
      weight: 0.15
    });

    this.pot10Requirements.set('loop-bounds', {
      rule: 'All loops must have a statically determinable upper-bound',
      threshold: 100, // Maximum loop iterations
      weight: 0.10
    });

    this.pot10Requirements.set('dynamic-memory', {
      rule: 'Do not use dynamic memory allocation after initialization',
      threshold: 0, // Zero violations allowed
      weight: 0.15
    });

    this.pot10Requirements.set('function-size', {
      rule: 'No function should be longer than what can be printed on a single sheet of paper',
      threshold: 60, // Maximum lines per function
      weight: 0.10
    });

    this.pot10Requirements.set('assertions', {
      rule: 'The code should have a minimum of two assertions per function',
      threshold: 2, // Minimum assertions per function
      weight: 0.10
    });

    this.pot10Requirements.set('data-hiding', {
      rule: 'Restrict the scope of data to the smallest possible scope',
      threshold: 80, // Minimum encapsulation score
      weight: 0.10
    });

    this.pot10Requirements.set('return-checks', {
      rule: 'The return value of non-void functions must be checked',
      threshold: 95, // Minimum check percentage
      weight: 0.10
    });

    this.pot10Requirements.set('preprocessor', {
      rule: 'The use of the preprocessor must be limited to simple replacements',
      threshold: 10, // Maximum complex preprocessor usage
      weight: 0.08
    });

    this.pot10Requirements.set('pointer-use', {
      rule: 'The use of pointers should be restricted',
      threshold: 20, // Maximum pointer complexity score
      weight: 0.07
    });

    this.pot10Requirements.set('compiler-warnings', {
      rule: 'All code must be compiled with all warnings enabled',
      threshold: 0, // Zero warnings allowed
      weight: 0.05
    });
  }

  /**
   * Validate NASA POT10 compliance
   */
  async validateCompliance(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<ComplianceResult> {
    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];

    try {
      // Extract compliance data from artifacts
      const complianceData = await this.extractComplianceData(artifacts, context);
      
      // Calculate compliance metrics
      const metrics = await this.calculateComplianceMetrics(complianceData);
      
      // Validate POT10 requirements
      const pot10Violations = await this.validatePOT10Requirements(complianceData);
      violations.push(...pot10Violations);
      
      // Check documentation compliance
      const docViolations = this.validateDocumentationCompliance(metrics.documentation);
      violations.push(...docViolations);
      
      // Check security compliance
      const secViolations = this.validateSecurityCompliance(metrics.security);
      violations.push(...secViolations);
      
      // Check testing compliance
      const testViolations = this.validateTestingCompliance(metrics.testing);
      violations.push(...testViolations);
      
      // Check traceability compliance
      const traceViolations = this.validateTraceabilityCompliance(metrics.traceability);
      violations.push(...traceViolations);
      
      // Calculate overall compliance score
      const score = this.calculateComplianceScore(metrics, violations);
      
      // Determine pass/fail status
      const passed = score >= this.thresholds.complianceThreshold && 
                    violations.filter(v => v.severity === 'critical').length === 0;
      
      // Generate recommendations
      const complianceRecommendations = this.generateComplianceRecommendations(metrics, violations);
      recommendations.push(...complianceRecommendations);
      
      // Store compliance history
      this.storeComplianceHistory(metrics);
      
      const result: ComplianceResult = {
        metrics,
        violations,
        recommendations,
        passed,
        score
      };

      this.emit('compliance-validated', result);
      
      if (!passed) {
        this.emit('compliance-violation', result);
      }

      return result;

    } catch (error) {
      const errorResult: ComplianceResult = {
        metrics: this.getDefaultMetrics(),
        violations: [{
          category: 'system',
          severity: 'critical',
          description: `Compliance validation failed: ${error.message}`,
          requirement: 'POT10-SYSTEM',
          impact: 'Unable to validate compliance',
          remediation: 'Fix compliance validation system',
          timeline: 'Immediate'
        }],
        recommendations: ['Fix compliance validation system'],
        passed: false,
        score: 0
      };

      this.emit('compliance-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Extract compliance data from artifacts
   */
  private async extractComplianceData(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Extract from code analysis
    const codeAnalysis = artifacts.filter(a => a.type === 'code-analysis');
    if (codeAnalysis.length > 0) {
      data.code = this.extractCodeAnalysisData(codeAnalysis);
    }

    // Extract from documentation analysis
    const docAnalysis = artifacts.filter(a => a.type === 'documentation');
    if (docAnalysis.length > 0) {
      data.documentation = this.extractDocumentationData(docAnalysis);
    }

    // Extract from test results
    const testResults = artifacts.filter(a => a.type === 'test-results');
    if (testResults.length > 0) {
      data.testing = this.extractTestingData(testResults);
    }

    // Extract from security scans
    const securityScans = artifacts.filter(a => a.type === 'security');
    if (securityScans.length > 0) {
      data.security = this.extractSecurityData(securityScans);
    }

    // Extract from traceability matrix
    const traceabilityData = artifacts.filter(a => a.type === 'traceability');
    if (traceabilityData.length > 0) {
      data.traceability = this.extractTraceabilityData(traceabilityData);
    }

    return data;
  }

  /**
   * Calculate comprehensive compliance metrics
   */
  private async calculateComplianceMetrics(
    data: Record<string, any>
  ): Promise<ComplianceMetrics> {
    const documentation = this.calculateDocumentationMetrics(data.documentation || {});
    const codeQuality = this.calculateCodeQualityMetrics(data.code || {});
    const testing = this.calculateTestingMetrics(data.testing || {});
    const security = this.calculateSecurityMetrics(data.security || {});
    const processCompliance = this.calculateProcessMetrics(data);
    const traceability = this.calculateTraceabilityMetrics(data.traceability || {});

    // Calculate overall score weighted by importance
    const overallScore = (
      documentation.coverage * 0.20 +
      codeQuality.standards.codingStandards * 0.20 +
      testing.coverage.line * 0.20 +
      security.compliance.owasp * 0.15 +
      processCompliance.qualityAssurance * 0.15 +
      traceability.coverage.requirements * 0.10
    );

    return {
      overallScore,
      documentation,
      codeQuality,
      testing,
      security,
      processCompliance,
      traceability
    };
  }

  /**
   * Calculate documentation metrics
   */
  private calculateDocumentationMetrics(data: any): DocumentationMetrics {
    const requirements = data.requirements || { documented: 0, total: 1 };
    const interfaces = data.interfaces || { documented: 0, total: 1 };

    return {
      coverage: data.coverage || 0,
      completeness: data.completeness || 0,
      accuracy: data.accuracy || 0,
      consistency: data.consistency || 0,
      requirements: {
        documented: requirements.documented,
        total: requirements.total,
        percentage: (requirements.documented / requirements.total) * 100
      },
      interfaces: {
        documented: interfaces.documented,
        total: interfaces.total,
        percentage: (interfaces.documented / interfaces.total) * 100
      }
    };
  }

  /**
   * Calculate code quality metrics
   */
  private calculateCodeQualityMetrics(data: any): CodeQualityMetrics {
    return {
      complexity: {
        cyclomatic: data.cyclomaticComplexity || 0,
        cognitive: data.cognitiveComplexity || 0,
        maintainability: data.maintainabilityIndex || 0
      },
      standards: {
        codingStandards: data.codingStandardsScore || 0,
        namingConventions: data.namingConventionsScore || 0,
        structuralCompliance: data.structuralComplianceScore || 0
      },
      metrics: {
        linesOfCode: data.linesOfCode || 0,
        duplicateCode: data.duplicateCodePercentage || 0,
        technicalDebt: data.technicalDebtRatio || 0
      }
    };
  }

  /**
   * Calculate testing metrics
   */
  private calculateTestingMetrics(data: any): TestingMetrics {
    const coverage = data.coverage || {};
    const quality = data.quality || {};
    const verification = data.verification || {};

    return {
      coverage: {
        line: coverage.line || 0,
        branch: coverage.branch || 0,
        function: coverage.function || 0,
        statement: coverage.statement || 0
      },
      quality: {
        testCases: quality.testCases || 0,
        passRate: quality.passRate || 0,
        reliability: quality.reliability || 0
      },
      verification: {
        unitTests: verification.unitTests || 0,
        integrationTests: verification.integrationTests || 0,
        systemTests: verification.systemTests || 0
      }
    };
  }

  /**
   * Calculate security metrics
   */
  private calculateSecurityMetrics(data: any): SecurityMetrics {
    const vulnerabilities = data.vulnerabilities || {};
    const compliance = data.compliance || {};
    const controls = data.controls || {};

    return {
      vulnerabilities: {
        critical: vulnerabilities.critical || 0,
        high: vulnerabilities.high || 0,
        medium: vulnerabilities.medium || 0,
        low: vulnerabilities.low || 0
      },
      compliance: {
        owasp: compliance.owasp || 0,
        nist: compliance.nist || 0,
        iso27001: compliance.iso27001 || 0
      },
      controls: {
        authentication: controls.authentication || 0,
        authorization: controls.authorization || 0,
        encryption: controls.encryption || 0,
        logging: controls.logging || 0
      }
    };
  }

  /**
   * Calculate process metrics
   */
  private calculateProcessMetrics(data: any): ProcessMetrics {
    const process = data.process || {};

    return {
      changeControl: process.changeControl || 0,
      configurationManagement: process.configurationManagement || 0,
      qualityAssurance: process.qualityAssurance || 0,
      riskManagement: process.riskManagement || 0,
      verification: process.verification || 0,
      validation: process.validation || 0
    };
  }

  /**
   * Calculate traceability metrics
   */
  private calculateTraceabilityMetrics(data: any): TraceabilityMetrics {
    const requirements = data.requirements || {};
    const coverage = data.coverage || {};

    return {
      requirements: {
        forward: requirements.forward || 0,
        backward: requirements.backward || 0,
        bidirectional: requirements.bidirectional || 0
      },
      coverage: {
        requirements: coverage.requirements || 0,
        design: coverage.design || 0,
        implementation: coverage.implementation || 0,
        testing: coverage.testing || 0
      }
    };
  }

  /**
   * Validate NASA POT10 requirements
   */
  private async validatePOT10Requirements(data: any): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const code = data.code || {};

    for (const [ruleKey, requirement] of this.pot10Requirements.entries()) {
      const violation = this.checkPOT10Rule(ruleKey, requirement, code);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Check individual POT10 rule
   */
  private checkPOT10Rule(
    ruleKey: string,
    requirement: any,
    code: any
  ): ComplianceViolation | null {
    let actualValue: number;
    let passed: boolean;

    switch (ruleKey) {
      case 'complexity':
        actualValue = code.maxCyclomaticComplexity || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'loop-bounds':
        actualValue = code.maxLoopIterations || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'dynamic-memory':
        actualValue = code.dynamicMemoryAllocations || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'function-size':
        actualValue = code.maxFunctionLines || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'assertions':
        actualValue = code.avgAssertionsPerFunction || 0;
        passed = actualValue >= requirement.threshold;
        break;
      case 'data-hiding':
        actualValue = code.encapsulationScore || 0;
        passed = actualValue >= requirement.threshold;
        break;
      case 'return-checks':
        actualValue = code.returnValueCheckPercentage || 0;
        passed = actualValue >= requirement.threshold;
        break;
      case 'preprocessor':
        actualValue = code.complexPreprocessorUsage || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'pointer-use':
        actualValue = code.pointerComplexityScore || 0;
        passed = actualValue <= requirement.threshold;
        break;
      case 'compiler-warnings':
        actualValue = code.compilerWarnings || 0;
        passed = actualValue <= requirement.threshold;
        break;
      default:
        return null;
    }

    if (!passed) {
      return {
        category: 'pot10',
        severity: 'critical',
        description: `POT10 Rule violation: ${requirement.rule}`,
        requirement: `POT10-${ruleKey.toUpperCase()}`,
        impact: `Actual: ${actualValue}, Required: ${requirement.threshold}`,
        remediation: `Address ${ruleKey} to meet POT10 requirements`,
        timeline: 'Before deployment'
      };
    }

    return null;
  }

  /**
   * Validate documentation compliance
   */
  private validateDocumentationCompliance(metrics: DocumentationMetrics): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    if (metrics.coverage < this.thresholds.documentationCoverage) {
      violations.push({
        category: 'documentation',
        severity: 'major',
        description: `Documentation coverage ${metrics.coverage}% below threshold ${this.thresholds.documentationCoverage}%`,
        requirement: 'DOC-COVERAGE',
        impact: 'Insufficient documentation for NASA compliance',
        remediation: 'Increase documentation coverage',
        timeline: '2 weeks'
      });
    }

    if (metrics.requirements.percentage < 90) {
      violations.push({
        category: 'documentation',
        severity: 'major',
        description: `Requirements documentation coverage ${metrics.requirements.percentage}% below 90%`,
        requirement: 'DOC-REQUIREMENTS',
        impact: 'Requirements traceability compromised',
        remediation: 'Document all requirements',
        timeline: '1 week'
      });
    }

    return violations;
  }

  /**
   * Validate security compliance
   */
  private validateSecurityCompliance(metrics: SecurityMetrics): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    if (metrics.vulnerabilities.critical > 0) {
      violations.push({
        category: 'security',
        severity: 'critical',
        description: `${metrics.vulnerabilities.critical} critical security vulnerabilities found`,
        requirement: 'SEC-CRITICAL',
        impact: 'Security risk to production deployment',
        remediation: 'Fix all critical vulnerabilities',
        timeline: 'Immediate'
      });
    }

    if (metrics.vulnerabilities.high > 0) {
      violations.push({
        category: 'security',
        severity: 'major',
        description: `${metrics.vulnerabilities.high} high security vulnerabilities found`,
        requirement: 'SEC-HIGH',
        impact: 'Elevated security risk',
        remediation: 'Fix all high vulnerabilities',
        timeline: '24 hours'
      });
    }

    return violations;
  }

  /**
   * Validate testing compliance
   */
  private validateTestingCompliance(metrics: TestingMetrics): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    if (metrics.coverage.line < 80) {
      violations.push({
        category: 'testing',
        severity: 'major',
        description: `Line coverage ${metrics.coverage.line}% below 80% threshold`,
        requirement: 'TEST-COVERAGE',
        impact: 'Insufficient test coverage for NASA compliance',
        remediation: 'Increase test coverage',
        timeline: '1 week'
      });
    }

    if (metrics.coverage.branch < 70) {
      violations.push({
        category: 'testing',
        severity: 'minor',
        description: `Branch coverage ${metrics.coverage.branch}% below 70% threshold`,
        requirement: 'TEST-BRANCH',
        impact: 'Incomplete branch coverage',
        remediation: 'Add branch tests',
        timeline: '2 weeks'
      });
    }

    return violations;
  }

  /**
   * Validate traceability compliance
   */
  private validateTraceabilityCompliance(metrics: TraceabilityMetrics): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    if (metrics.coverage.requirements < 95) {
      violations.push({
        category: 'traceability',
        severity: 'major',
        description: `Requirements traceability ${metrics.coverage.requirements}% below 95%`,
        requirement: 'TRACE-REQ',
        impact: 'Requirements not fully traceable',
        remediation: 'Establish complete requirements traceability',
        timeline: '1 week'
      });
    }

    return violations;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(
    metrics: ComplianceMetrics,
    violations: ComplianceViolation[]
  ): number {
    let score = metrics.overallScore;

    // Deduct points for violations
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    metrics: ComplianceMetrics,
    violations: ComplianceViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.overallScore < 95) {
      recommendations.push('Implement comprehensive compliance improvement program');
    }

    if (violations.some(v => v.category === 'pot10')) {
      recommendations.push('Address NASA POT10 violations for safety-critical compliance');
    }

    if (metrics.documentation.coverage < 90) {
      recommendations.push('Improve documentation coverage to meet NASA standards');
    }

    if (metrics.testing.coverage.line < 80) {
      recommendations.push('Increase test coverage to meet compliance requirements');
    }

    if (metrics.security.vulnerabilities.critical > 0) {
      recommendations.push('Immediate security vulnerability remediation required');
    }

    if (metrics.traceability.coverage.requirements < 95) {
      recommendations.push('Establish complete requirements traceability matrix');
    }

    return recommendations;
  }

  /**
   * Store compliance history for trending
   */
  private storeComplianceHistory(metrics: ComplianceMetrics): void {
    const timestamp = new Date().toISOString();
    this.complianceHistory.set(timestamp, metrics);

    // Keep only last 30 entries
    if (this.complianceHistory.size > 30) {
      const oldestKey = this.complianceHistory.keys().next().value;
      this.complianceHistory.delete(oldestKey);
    }
  }

  /**
   * Extract data from various artifact types
   */
  private extractCodeAnalysisData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractDocumentationData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractTestingData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractSecurityData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractTraceabilityData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  /**
   * Get default metrics for error cases
   */
  private getDefaultMetrics(): ComplianceMetrics {
    return {
      overallScore: 0,
      documentation: {
        coverage: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        requirements: { documented: 0, total: 1, percentage: 0 },
        interfaces: { documented: 0, total: 1, percentage: 0 }
      },
      codeQuality: {
        complexity: { cyclomatic: 0, cognitive: 0, maintainability: 0 },
        standards: { codingStandards: 0, namingConventions: 0, structuralCompliance: 0 },
        metrics: { linesOfCode: 0, duplicateCode: 0, technicalDebt: 0 }
      },
      testing: {
        coverage: { line: 0, branch: 0, function: 0, statement: 0 },
        quality: { testCases: 0, passRate: 0, reliability: 0 },
        verification: { unitTests: 0, integrationTests: 0, systemTests: 0 }
      },
      security: {
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        compliance: { owasp: 0, nist: 0, iso27001: 0 },
        controls: { authentication: 0, authorization: 0, encryption: 0, logging: 0 }
      },
      processCompliance: {
        changeControl: 0,
        configurationManagement: 0,
        qualityAssurance: 0,
        riskManagement: 0,
        verification: 0,
        validation: 0
      },
      traceability: {
        requirements: { forward: 0, backward: 0, bidirectional: 0 },
        coverage: { requirements: 0, design: 0, implementation: 0, testing: 0 }
      }
    };
  }

  /**
   * Get current compliance status
   */
  async getCurrentCompliance(): Promise<ComplianceMetrics> {
    const history = Array.from(this.complianceHistory.values());
    if (history.length > 0) {
      return history[history.length - 1];
    }
    return this.getDefaultMetrics();
  }

  /**
   * Get compliance trend analysis
   */
  getComplianceTrend(): any {
    const history = Array.from(this.complianceHistory.values());
    if (history.length < 2) {
      return { trend: 'insufficient-data' };
    }

    const recent = history.slice(-10);
    const scoreTrend = this.calculateTrend(recent.map(h => h.overallScore));
    const documentationTrend = this.calculateTrend(recent.map(h => h.documentation.coverage));
    const testingTrend = this.calculateTrend(recent.map(h => h.testing.coverage.line));

    return {
      overallScore: scoreTrend,
      documentation: documentationTrend,
      testing: testingTrend,
      overallTrend: (scoreTrend > 0 && documentationTrend > 0 && testingTrend > 0) ? 'improving' : 'declining'
    };
  }

  /**
   * Calculate trend for a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return ((last - first) / first) * 100;
  }
}
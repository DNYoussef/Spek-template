/**
 * Audit Gate Manager
 *
 * Centralized quality gate definitions and evaluation logic.
 * Manages compliance checking and gate criteria across all domains.
 */

export interface QualityGate {
  name: string;
  domain: string;
  threshold: number;
  metric: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFix: boolean;
}

export interface GateEvaluationResult {
  gate: QualityGate;
  passed: boolean;
  actualValue: number;
  threshold: number;
  gap?: number;
  recommendation?: string;
}

export class AuditGateManager {
  private static gates: Map<string, QualityGate[]> = new Map();

  static {
    // Initialize domain-specific gates
    this.initializeArchitectureGates();
    this.initializeDevelopmentGates();
    this.initializeQualityGates();
    this.initializeSecurityGates();
    this.initializePerformanceGates();
    this.initializeDocumentationGates();
  }

  private static initializeArchitectureGates(): void {
    this.gates.set('Architecture', [
      {
        name: 'Architecture Compliance',
        domain: 'Architecture',
        threshold: 90,
        metric: 'architecture-score',
        severity: 'critical',
        autoFix: false
      },
      {
        name: 'Pattern Consistency',
        domain: 'Architecture',
        threshold: 85,
        metric: 'pattern-consistency',
        severity: 'high',
        autoFix: true
      },
      {
        name: 'Scalability Design',
        domain: 'Architecture',
        threshold: 80,
        metric: 'scalability-score',
        severity: 'high',
        autoFix: false
      }
    ]);
  }

  private static initializeDevelopmentGates(): void {
    this.gates.set('Development', [
      {
        name: 'Build Success',
        domain: 'Development',
        threshold: 100,
        metric: 'build-success',
        severity: 'critical',
        autoFix: true
      },
      {
        name: 'Test Coverage',
        domain: 'Development',
        threshold: 80,
        metric: 'test-coverage',
        severity: 'critical',
        autoFix: false
      },
      {
        name: 'Code Modularity',
        domain: 'Development',
        threshold: 85,
        metric: 'modularity-score',
        severity: 'high',
        autoFix: true
      }
    ]);
  }

  private static initializeQualityGates(): void {
    this.gates.set('Quality', [
      {
        name: 'Test Success Rate',
        domain: 'Quality',
        threshold: 100,
        metric: 'test-success',
        severity: 'critical',
        autoFix: true
      },
      {
        name: 'Lint Score',
        domain: 'Quality',
        threshold: 95,
        metric: 'lint-score',
        severity: 'high',
        autoFix: true
      },
      {
        name: 'Code Smell Density',
        domain: 'Quality',
        threshold: 5,
        metric: 'code-smell-density',
        severity: 'medium',
        autoFix: true
      },
      {
        name: 'NASA POT10 Compliance',
        domain: 'Quality',
        threshold: 90,
        metric: 'nasa-compliance',
        severity: 'critical',
        autoFix: false
      }
    ]);
  }

  private static initializeSecurityGates(): void {
    this.gates.set('Security', [
      {
        name: 'Critical Vulnerabilities',
        domain: 'Security',
        threshold: 0,
        metric: 'critical-vulns',
        severity: 'critical',
        autoFix: false
      },
      {
        name: 'High Vulnerabilities',
        domain: 'Security',
        threshold: 0,
        metric: 'high-vulns',
        severity: 'critical',
        autoFix: false
      },
      {
        name: 'OWASP Compliance',
        domain: 'Security',
        threshold: 95,
        metric: 'owasp-score',
        severity: 'critical',
        autoFix: false
      },
      {
        name: 'Encryption Coverage',
        domain: 'Security',
        threshold: 100,
        metric: 'encryption-coverage',
        severity: 'high',
        autoFix: true
      }
    ]);
  }

  private static initializePerformanceGates(): void {
    this.gates.set('Performance', [
      {
        name: 'Response Time P95',
        domain: 'Performance',
        threshold: 500,
        metric: 'p95-latency',
        severity: 'high',
        autoFix: true
      },
      {
        name: 'CPU Usage',
        domain: 'Performance',
        threshold: 70,
        metric: 'cpu-usage',
        severity: 'medium',
        autoFix: true
      },
      {
        name: 'Memory Usage',
        domain: 'Performance',
        threshold: 80,
        metric: 'memory-usage',
        severity: 'medium',
        autoFix: true
      },
      {
        name: 'Throughput',
        domain: 'Performance',
        threshold: 1000,
        metric: 'throughput',
        severity: 'high',
        autoFix: false
      }
    ]);
  }

  private static initializeDocumentationGates(): void {
    this.gates.set('Documentation', [
      {
        name: 'Documentation Coverage',
        domain: 'Documentation',
        threshold: 90,
        metric: 'doc-coverage',
        severity: 'medium',
        autoFix: true
      },
      {
        name: 'API Documentation',
        domain: 'Documentation',
        threshold: 100,
        metric: 'api-doc-coverage',
        severity: 'high',
        autoFix: true
      },
      {
        name: 'Documentation Accuracy',
        domain: 'Documentation',
        threshold: 95,
        metric: 'doc-accuracy',
        severity: 'high',
        autoFix: false
      }
    ]);
  }

  /**
   * Evaluate all gates for a specific domain
   */
  static evaluateGates(
    domain: string,
    metrics: Record<string, number>
  ): GateEvaluationResult[] {
    const domainGates = this.gates.get(domain) || [];
    const results: GateEvaluationResult[] = [];

    for (const gate of domainGates) {
      const actualValue = metrics[gate.metric] ?? 0;
      const passed = this.checkGate(gate, actualValue);
      const gap = passed ? 0 : Math.abs(gate.threshold - actualValue);

      results.push({
        gate,
        passed,
        actualValue,
        threshold: gate.threshold,
        gap,
        recommendation: passed ? undefined : this.generateRecommendation(gate, actualValue)
      });
    }

    return results;
  }

  /**
   * Check if a specific gate passes
   */
  private static checkGate(gate: QualityGate, actualValue: number): boolean {
    // For metrics where lower is better (e.g., vulnerabilities, latency)
    const lowerIsBetter = ['critical-vulns', 'high-vulns', 'p95-latency', 'code-smell-density'];

    if (lowerIsBetter.includes(gate.metric)) {
      return actualValue <= gate.threshold;
    }

    // For metrics where higher is better (e.g., coverage, compliance)
    return actualValue >= gate.threshold;
  }

  /**
   * Generate recommendation for failed gate
   */
  private static generateRecommendation(gate: QualityGate, actualValue: number): string {
    const gap = Math.abs(gate.threshold - actualValue);

    const recommendations: Record<string, string> = {
      'test-coverage': `Increase test coverage by ${gap.toFixed(1)}%. Add unit and integration tests.`,
      'build-success': 'Fix compilation errors and build failures.',
      'nasa-compliance': `Improve NASA POT10 compliance by ${gap.toFixed(1)}%. Address rule violations.`,
      'critical-vulns': 'CRITICAL: Fix all critical vulnerabilities immediately.',
      'high-vulns': 'HIGH PRIORITY: Resolve high severity vulnerabilities.',
      'p95-latency': `Reduce P95 latency by ${gap.toFixed(0)}ms. Optimize bottlenecks.`,
      'doc-coverage': `Increase documentation coverage by ${gap.toFixed(1)}%. Document all public APIs.`,
      'lint-score': `Improve code style score by ${gap.toFixed(1)}%. Fix linting issues.`,
      'owasp-score': `Improve OWASP compliance by ${gap.toFixed(1)}%. Address security weaknesses.`
    };

    return recommendations[gate.metric] || `Improve ${gate.name} to meet ${gate.threshold} threshold.`;
  }

  /**
   * Get all gates for a domain
   */
  static getGatesForDomain(domain: string): QualityGate[] {
    return this.gates.get(domain) || [];
  }

  /**
   * Get critical gates across all domains
   */
  static getCriticalGates(): QualityGate[] {
    const criticalGates: QualityGate[] = [];

    for (const gates of this.gates.values()) {
      criticalGates.push(...gates.filter(g => g.severity === 'critical'));
    }

    return criticalGates;
  }

  /**
   * Check if all critical gates pass
   */
  static validateCriticalGates(
    allMetrics: Record<string, Record<string, number>>
  ): { passed: boolean; failedGates: GateEvaluationResult[] } {
    const criticalGates = this.getCriticalGates();
    const failedGates: GateEvaluationResult[] = [];

    for (const gate of criticalGates) {
      const domainMetrics = allMetrics[gate.domain] || {};
      const actualValue = domainMetrics[gate.metric] ?? 0;
      const passed = this.checkGate(gate, actualValue);

      if (!passed) {
        failedGates.push({
          gate,
          passed: false,
          actualValue,
          threshold: gate.threshold,
          gap: Math.abs(gate.threshold - actualValue),
          recommendation: this.generateRecommendation(gate, actualValue)
        });
      }
    }

    return {
      passed: failedGates.length === 0,
      failedGates
    };
  }

  /**
   * Generate comprehensive gate report
   */
  static generateGateReport(
    domain: string,
    metrics: Record<string, number>
  ): {
    domain: string;
    totalGates: number;
    passedGates: number;
    failedGates: number;
    criticalFailures: number;
    passRate: number;
    results: GateEvaluationResult[];
  } {
    const results = this.evaluateGates(domain, metrics);
    const passedGates = results.filter(r => r.passed).length;
    const criticalFailures = results.filter(
      r => !r.passed && r.gate.severity === 'critical'
    ).length;

    return {
      domain,
      totalGates: results.length,
      passedGates,
      failedGates: results.length - passedGates,
      criticalFailures,
      passRate: results.length > 0 ? (passedGates / results.length) * 100 : 0,
      results
    };
  }
}
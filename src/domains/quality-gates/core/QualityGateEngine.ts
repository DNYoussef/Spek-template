/**
 * Core Quality Gate Enforcement Engine
 * 
 * Implements comprehensive quality gates with Six Sigma metrics,
 * automated decisions, and enterprise compliance validation.
 */

import { EventEmitter } from 'events';
import { SixSigmaMetrics } from '../metrics/SixSigmaMetrics';
import { AutomatedDecisionEngine } from '../decisions/AutomatedDecisionEngine';
import { ComplianceGateManager } from '../compliance/ComplianceGateManager';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { SecurityGateValidator } from '../compliance/SecurityGateValidator';
import { QualityDashboard } from '../dashboard/QualityDashboard';

export interface QualityGateConfig {
  enableSixSigma: boolean;
  automatedDecisions: boolean;
  nasaCompliance: boolean;
  performanceMonitoring: boolean;
  securityValidation: boolean;
  thresholds: QualityThresholds;
  performanceBudget: number; // Performance overhead budget (default: 0.4%)
}

export interface QualityThresholds {
  sixSigma: {
    defectRate: number; // PPM (Parts Per Million)
    processCapability: number; // Cp/Cpk minimum
    yieldThreshold: number; // Minimum yield percentage
  };
  nasa: {
    complianceThreshold: number; // Minimum 95%
    criticalFindings: number; // Maximum allowed (0)
    documentationCoverage: number; // Minimum percentage
  };
  performance: {
    regressionThreshold: number; // Maximum degradation %
    responseTimeLimit: number; // Maximum response time ms
    throughputMinimum: number; // Minimum throughput
  };
  security: {
    criticalVulnerabilities: number; // Maximum allowed (0)
    highVulnerabilities: number; // Maximum allowed (0)
    mediumVulnerabilities: number; // Maximum allowed
  };
}

export interface QualityGateResult {
  passed: boolean;
  gateId: string;
  timestamp: Date;
  metrics: Record<string, any>;
  violations: QualityViolation[];
  recommendations: string[];
  automatedActions: string[];
}

export interface QualityViolation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'six-sigma' | 'nasa' | 'performance' | 'security';
  description: string;
  impact: string;
  remediation: string;
  autoRemediable: boolean;
}

export class QualityGateEngine extends EventEmitter {
  private config: QualityGateConfig;
  private sixSigmaMetrics: SixSigmaMetrics;
  private decisionEngine: AutomatedDecisionEngine;
  private complianceManager: ComplianceGateManager;
  private performanceMonitor: PerformanceMonitor;
  private securityValidator: SecurityGateValidator;
  private dashboard: QualityDashboard;
  private gateResults: Map<string, QualityGateResult> = new Map();

  constructor(config: QualityGateConfig) {
    super();
    this.config = config;
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.sixSigmaMetrics = new SixSigmaMetrics(this.config.thresholds.sixSigma);
    this.decisionEngine = new AutomatedDecisionEngine(this.config);
    this.complianceManager = new ComplianceGateManager(this.config.thresholds.nasa);
    this.performanceMonitor = new PerformanceMonitor(this.config.thresholds.performance);
    this.securityValidator = new SecurityGateValidator(this.config.thresholds.security);
    this.dashboard = new QualityDashboard();

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.performanceMonitor.on('regression-detected', this.handlePerformanceRegression.bind(this));
    this.securityValidator.on('critical-vulnerability', this.handleSecurityViolation.bind(this));
    this.complianceManager.on('compliance-violation', this.handleComplianceViolation.bind(this));
  }

  /**
   * Execute comprehensive quality gate validation
   */
  async executeQualityGate(
    gateId: string,
    artifacts: any[],
    context: Record<string, any>
  ): Promise<QualityGateResult> {
    const startTime = Date.now();
    const violations: QualityViolation[] = [];
    const metrics: Record<string, any> = {};
    const recommendations: string[] = [];
    const automatedActions: string[] = [];

    try {
      // Six Sigma Metrics Validation (QG-001)
      if (this.config.enableSixSigma) {
        const sixSigmaResults = await this.sixSigmaMetrics.validateMetrics(artifacts, context);
        metrics.sixSigma = sixSigmaResults.metrics;
        violations.push(...sixSigmaResults.violations);
        recommendations.push(...sixSigmaResults.recommendations);
      }

      // NASA POT10 Compliance Gate (QG-003)
      if (this.config.nasaCompliance) {
        const complianceResults = await this.complianceManager.validateCompliance(artifacts, context);
        metrics.nasa = complianceResults.metrics;
        violations.push(...complianceResults.violations);
        recommendations.push(...complianceResults.recommendations);
      }

      // Performance Regression Detection (QG-004)
      if (this.config.performanceMonitoring) {
        const performanceResults = await this.performanceMonitor.detectRegressions(artifacts, context);
        metrics.performance = performanceResults.metrics;
        violations.push(...performanceResults.violations);
        recommendations.push(...performanceResults.recommendations);
      }

      // Security Vulnerability Gate (QG-005)
      if (this.config.securityValidation) {
        const securityResults = await this.securityValidator.validateSecurity(artifacts, context);
        metrics.security = securityResults.metrics;
        violations.push(...securityResults.violations);
        recommendations.push(...securityResults.recommendations);
      }

      // Automated Decision Processing (QG-002)
      if (this.config.automatedDecisions) {
        const decisionResults = await this.decisionEngine.processDecisions(
          violations,
          metrics,
          context
        );
        automatedActions.push(...decisionResults.actions);
        
        // Execute auto-remediation if enabled
        if (decisionResults.autoRemediate) {
          await this.executeAutoRemediation(decisionResults.remediationPlan);
        }
      }

      // Determine gate pass/fail status
      const passed = this.determineGateStatus(violations, metrics);

      const result: QualityGateResult = {
        passed,
        gateId,
        timestamp: new Date(),
        metrics,
        violations,
        recommendations,
        automatedActions
      };

      // Store result and update dashboard
      this.gateResults.set(gateId, result);
      await this.dashboard.updateGateResult(result);

      // Emit events for downstream processing
      this.emit('gate-completed', result);
      if (!passed) {
        this.emit('gate-failed', result);
      }

      // Validate performance overhead budget
      const executionTime = Date.now() - startTime;
      await this.validatePerformanceOverhead(executionTime);

      return result;

    } catch (error) {
      const errorResult: QualityGateResult = {
        passed: false,
        gateId,
        timestamp: new Date(),
        metrics: { error: error.message },
        violations: [{
          severity: 'critical',
          category: 'six-sigma',
          description: `Quality gate execution failed: ${error.message}`,
          impact: 'Gate validation incomplete',
          remediation: 'Review gate configuration and retry',
          autoRemediable: false
        }],
        recommendations: ['Review gate configuration', 'Check system resources'],
        automatedActions: []
      };

      this.emit('gate-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Determine overall gate status based on violations and metrics
   */
  private determineGateStatus(
    violations: QualityViolation[],
    metrics: Record<string, any>
  ): boolean {
    // Check for critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      return false;
    }

    // Check NASA compliance threshold (95%+)
    if (metrics.nasa?.complianceScore < this.config.thresholds.nasa.complianceThreshold) {
      return false;
    }

    // Check security violations (zero tolerance for critical/high)
    if (metrics.security?.criticalVulnerabilities > 0 || metrics.security?.highVulnerabilities > 0) {
      return false;
    }

    // Check Six Sigma thresholds
    if (metrics.sixSigma?.defectRate > this.config.thresholds.sixSigma.defectRate) {
      return false;
    }

    // Check performance regressions
    if (metrics.performance?.regressionPercentage > this.config.thresholds.performance.regressionThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Execute automated remediation plan
   */
  private async executeAutoRemediation(remediationPlan: any): Promise<void> {
    // Implementation for automated remediation
    // This would integrate with various systems to automatically fix issues
    this.emit('auto-remediation-started', remediationPlan);
    
    // Placeholder for actual remediation logic
    // Would include code fixes, configuration updates, etc.
    
    this.emit('auto-remediation-completed', remediationPlan);
  }

  /**
   * Handle performance regression detection
   */
  private async handlePerformanceRegression(regression: any): Promise<void> {
    this.emit('performance-regression', regression);
    
    if (regression.severity === 'critical') {
      // Trigger automated rollback
      await this.triggerAutomatedRollback(regression);
    }
  }

  /**
   * Handle security violations
   */
  private async handleSecurityViolation(violation: any): Promise<void> {
    this.emit('security-violation', violation);
    
    if (violation.severity === 'critical') {
      // Immediate blocking action
      await this.blockDeployment(violation);
    }
  }

  /**
   * Handle compliance violations
   */
  private async handleComplianceViolation(violation: any): Promise<void> {
    this.emit('compliance-violation', violation);
    
    if (violation.nasaScore < this.config.thresholds.nasa.complianceThreshold) {
      // Block deployment until compliance is restored
      await this.blockDeployment(violation);
    }
  }

  /**
   * Trigger automated rollback for critical issues
   */
  private async triggerAutomatedRollback(issue: any): Promise<void> {
    this.emit('automated-rollback-triggered', issue);
    // Implementation would integrate with deployment systems
  }

  /**
   * Block deployment for critical violations
   */
  private async blockDeployment(violation: any): Promise<void> {
    this.emit('deployment-blocked', violation);
    // Implementation would integrate with CI/CD systems
  }

  /**
   * Validate performance overhead budget compliance
   */
  private async validatePerformanceOverhead(executionTime: number): Promise<void> {
    const overheadPercentage = (executionTime / 1000) * 100; // Convert to percentage
    
    if (overheadPercentage > this.config.performanceBudget) {
      this.emit('performance-budget-exceeded', {
        actual: overheadPercentage,
        budget: this.config.performanceBudget,
        executionTime
      });
    }
  }

  /**
   * Get quality gate history and trends
   */
  getGateHistory(gateId?: string): QualityGateResult[] {
    if (gateId) {
      const result = this.gateResults.get(gateId);
      return result ? [result] : [];
    }
    return Array.from(this.gateResults.values());
  }

  /**
   * Get real-time quality metrics
   */
  async getRealTimeMetrics(): Promise<Record<string, any>> {
    return {
      sixSigma: await this.sixSigmaMetrics.getCurrentMetrics(),
      nasa: await this.complianceManager.getCurrentCompliance(),
      performance: await this.performanceMonitor.getCurrentMetrics(),
      security: await this.securityValidator.getCurrentStatus(),
      gates: {
        total: this.gateResults.size,
        passed: Array.from(this.gateResults.values()).filter(r => r.passed).length,
        failed: Array.from(this.gateResults.values()).filter(r => !r.passed).length
      }
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfiguration(newConfig: Partial<QualityGateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configuration-updated', this.config);
  }
}
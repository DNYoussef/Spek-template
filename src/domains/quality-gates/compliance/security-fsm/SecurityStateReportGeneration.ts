/**
 * Security State: Report Generation
 * Handles final report generation and security gate decision
 */

import { EventEmitter } from 'events';
import {
  SecurityValidationState,
  SecurityValidationEvent,
  SecurityValidationContext,
  SecurityResult,
  SecurityViolation,
  SecurityMetrics,
  SecurityThresholds
} from './SecurityValidationTypes';

export class SecurityStateReportGeneration {
  private emitter: EventEmitter;
  private thresholds: SecurityThresholds;

  constructor(emitter: EventEmitter, thresholds: SecurityThresholds) {
    this.emitter = emitter;
    this.thresholds = thresholds;
  }

  /**
   * Generate final security report and gate decision
   */
  async init(context: SecurityValidationContext): Promise<void> {
    try {
      context.currentStep = 'report-generation';
      
      // Complete security metrics calculation
      const completeMetrics = await this.completeMetricsCalculation(context);
      
      // Determine gate status
      const gateStatus = this.determineGateStatus(context.violations!, completeMetrics);
      
      // Identify blocking violations
      const blockers = this.identifyBlockers(context.violations!);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(context.violations!, completeMetrics);
      
      // Create final security result
      const securityResult: SecurityResult = {
        metrics: completeMetrics,
        violations: context.violations!,
        recommendations,
        passed: gateStatus,
        blockers
      };
      
      // Store result in context
      context.securityMetrics = completeMetrics;
      context.recommendations = recommendations;
      context.blockers = blockers;
      
      // Emit completion events
      this.emitCompletionEvents(securityResult, context);
      
      // Transition to completed state
      this.emitter.emit('transition', {
        from: SecurityValidationState.REPORT_GENERATION,
        to: SecurityValidationState.COMPLETED,
        event: SecurityValidationEvent.REPORT_GENERATED,
        context,
        result: securityResult
      });
      
    } catch (error) {
      this.handleError(error, context);
    }
  }

  /**
   * Complete security metrics calculation
   */
  private async completeMetricsCalculation(context: SecurityValidationContext): Promise<SecurityMetrics> {
    const baseMetrics = context.securityMetrics || this.getDefaultSecurityMetrics();
    
    // Calculate authentication metrics
    const authentication = this.calculateAuthenticationMetrics(context.extractedData!);
    
    // Calculate authorization metrics
    const authorization = this.calculateAuthorizationMetrics(context.extractedData!);
    
    // Calculate encryption metrics
    const encryption = this.calculateEncryptionMetrics(context.extractedData!);
    
    // Calculate logging metrics
    const logging = this.calculateLoggingMetrics(context.extractedData!);
    
    // Calculate overall security score
    const overallScore = this.calculateOverallSecurityScore({
      vulnerabilities: baseMetrics.vulnerabilities,
      compliance: baseMetrics.compliance,
      authentication,
      authorization,
      encryption,
      logging
    });
    
    return {
      ...baseMetrics,
      authentication,
      authorization,
      encryption,
      logging,
      overallScore
    };
  }

  /**
   * Calculate authentication metrics
   */
  private calculateAuthenticationMetrics(data: Record<string, any>): any {
    const auth = data.compliance?.authentication || {};
    
    return {
      score: auth.score || 70,
      multiFactorAuth: auth.multiFactorAuth || false,
      passwordPolicies: auth.passwordPolicies || true,
      sessionManagement: auth.sessionManagement || true,
      accountLockout: auth.accountLockout || false,
      weakCredentials: auth.weakCredentials || 0
    };
  }

  /**
   * Calculate authorization metrics
   */
  private calculateAuthorizationMetrics(data: Record<string, any>): any {
    const authz = data.compliance?.authorization || {};
    
    return {
      score: authz.score || 65,
      accessControl: authz.accessControl || true,
      roleBasedAccess: authz.roleBasedAccess || false,
      privilegeEscalation: authz.privilegeEscalation || 0,
      unauthorizedAccess: authz.unauthorizedAccess || 0,
      dataLeakage: authz.dataLeakage || 0
    };
  }

  /**
   * Calculate encryption metrics
   */
  private calculateEncryptionMetrics(data: Record<string, any>): any {
    const encryption = data.compliance?.encryption || {};
    
    return {
      score: encryption.score || 80,
      dataAtRest: encryption.dataAtRest || true,
      dataInTransit: encryption.dataInTransit || true,
      keyManagement: encryption.keyManagement || false,
      cryptographicStrength: encryption.cryptographicStrength || 85,
      weakEncryption: encryption.weakEncryption || 0
    };
  }

  /**
   * Calculate logging metrics
   */
  private calculateLoggingMetrics(data: Record<string, any>): any {
    const logging = data.compliance?.logging || {};
    
    return {
      score: logging.score || 60,
      securityEvents: logging.securityEvents || false,
      auditTrail: logging.auditTrail || true,
      logIntegrity: logging.logIntegrity || false,
      logRetention: logging.logRetention || true,
      sensitiveDataLogging: logging.sensitiveDataLogging || 0
    };
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallSecurityScore(metrics: any): number {
    const weights = {
      vulnerabilities: 0.30,
      compliance: 0.25,
      authentication: 0.15,
      authorization: 0.15,
      encryption: 0.10,
      logging: 0.05
    };
    
    // Vulnerability score (inverse of vulnerability count with severity weighting)
    const vulnScore = Math.max(0, 100 - (
      metrics.vulnerabilities.critical * 20 +
      metrics.vulnerabilities.high * 10 +
      metrics.vulnerabilities.medium * 5 +
      metrics.vulnerabilities.low * 1
    ));
    
    // Compliance score (average of all frameworks)
    const complianceScores = [
      metrics.compliance.owasp.score,
      metrics.compliance.nist.score,
      metrics.compliance.pci.score,
      metrics.compliance.gdpr.score,
      metrics.compliance.iso27001.score
    ];
    const avgComplianceScore = complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length;
    
    // Calculate weighted overall score
    const overallScore = (
      vulnScore * weights.vulnerabilities +
      avgComplianceScore * weights.compliance +
      metrics.authentication.score * weights.authentication +
      metrics.authorization.score * weights.authorization +
      metrics.encryption.score * weights.encryption +
      metrics.logging.score * weights.logging
    );
    
    return Math.round(overallScore);
  }

  /**
   * Determine security gate pass/fail status
   */
  private determineGateStatus(violations: SecurityViolation[], metrics: SecurityMetrics): boolean {
    // Check critical/high violation thresholds
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;
    const mediumCount = violations.filter(v => v.severity === 'medium').length;
    
    // Apply threshold checks
    if (criticalCount > this.thresholds.criticalVulnerabilities) return false;
    if (highCount > this.thresholds.highVulnerabilities) return false;
    if (mediumCount > this.thresholds.mediumVulnerabilities) return false;
    
    // Check overall security score
    if (metrics.overallScore < this.thresholds.minimumSecurityScore) return false;
    
    return true;
  }

  /**
   * Identify blocking violations (critical/high severity)
   */
  private identifyBlockers(violations: SecurityViolation[]): SecurityViolation[] {
    return violations.filter(v => v.severity === 'critical' || v.severity === 'high');
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(violations: SecurityViolation[], metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];
    
    // Critical recommendations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
      recommendations.push('Consider emergency security review');
    }
    
    // High priority recommendations
    const highViolations = violations.filter(v => v.severity === 'high');
    if (highViolations.length > 0) {
      recommendations.push('Fix high severity security issues before deployment');
    }
    
    // Framework-specific recommendations
    recommendations.push(...this.generateFrameworkRecommendations(metrics));
    
    // Component-specific recommendations
    recommendations.push(...this.generateComponentRecommendations(metrics));
    
    // General security improvements
    if (metrics.overallScore < 85) {
      recommendations.push('Implement comprehensive security improvement program');
      recommendations.push('Regular security assessments and penetration testing');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate framework-specific recommendations
   */
  private generateFrameworkRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.compliance.owasp.score < 80) {
      recommendations.push('Improve OWASP Top 10 compliance');
      recommendations.push('Implement OWASP security testing guidelines');
    }
    
    if (metrics.compliance.nist.score < 70) {
      recommendations.push('Enhance NIST Cybersecurity Framework implementation');
    }
    
    if (metrics.compliance.pci.score < 80) {
      recommendations.push('Address PCI DSS compliance requirements');
    }
    
    return recommendations;
  }

  /**
   * Generate component-specific recommendations
   */
  private generateComponentRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.authentication.score < 80) {
      recommendations.push('Strengthen authentication mechanisms');
      if (!metrics.authentication.multiFactorAuth) {
        recommendations.push('Implement multi-factor authentication');
      }
    }
    
    if (metrics.encryption.score < 80) {
      recommendations.push('Improve encryption implementation');
      if (!metrics.encryption.dataAtRest) {
        recommendations.push('Implement data-at-rest encryption');
      }
      if (!metrics.encryption.dataInTransit) {
        recommendations.push('Ensure all data transmission is encrypted');
      }
    }
    
    if (metrics.logging.score < 70) {
      recommendations.push('Enhance security logging and monitoring');
    }
    
    return recommendations;
  }

  /**
   * Emit completion events
   */
  private emitCompletionEvents(result: SecurityResult, context: SecurityValidationContext): void {
    this.emitter.emit('security-validated', result);
    
    if (!result.passed) {
      this.emitter.emit('security-gate-failed', result);
    }
    
    if (result.blockers.length > 0) {
      this.emitter.emit('critical-vulnerability', { blockers: result.blockers, context });
    }
  }

  /**
   * Get default security metrics
   */
  private getDefaultSecurityMetrics(): SecurityMetrics {
    return {
      vulnerabilities: {
        total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0,
        byCategory: {}, trends: { newVulnerabilities: 0, fixedVulnerabilities: 0, regressionRate: 0 }
      },
      compliance: {
        owasp: { score: 0, top10Coverage: {}, violations: [] },
        nist: { score: 0, frameworkCoverage: {}, controlsImplemented: 0, totalControls: 0 },
        pci: { score: 0, requirements: {}, dataProtection: false, networkSecurity: false },
        gdpr: { score: 0, dataProcessing: false, consent: false, rightToErasure: false, dataPortability: false },
        iso27001: { score: 0, controls: {}, riskAssessment: false, informationSecurity: false }
      },
      authentication: { score: 0, multiFactorAuth: false, passwordPolicies: false, sessionManagement: false, accountLockout: false, weakCredentials: 0 },
      authorization: { score: 0, accessControl: false, roleBasedAccess: false, privilegeEscalation: 0, unauthorizedAccess: 0, dataLeakage: 0 },
      encryption: { score: 0, dataAtRest: false, dataInTransit: false, keyManagement: false, cryptographicStrength: 0, weakEncryption: 0 },
      logging: { score: 0, securityEvents: false, auditTrail: false, logIntegrity: false, logRetention: false, sensitiveDataLogging: 0 },
      overallScore: 0
    };
  }

  /**
   * Handle report generation errors
   */
  private handleError(error: any, context: SecurityValidationContext): void {
    context.errorDetails = {
      stage: 'report-generation',
      message: error.message,
      timestamp: Date.now()
    };
    
    this.emitter.emit('transition', {
      from: SecurityValidationState.REPORT_GENERATION,
      to: SecurityValidationState.ERROR,
      event: SecurityValidationEvent.VALIDATION_ERROR,
      context,
      error
    });
  }

  /**
   * Update function for state maintenance
   */
  update(context: SecurityValidationContext): void {
    // Monitor report generation progress
  }

  /**
   * Shutdown function for cleanup
   */
  shutdown(context: SecurityValidationContext): void {
    // Clean up report generation resources
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: SecurityValidationContext): boolean {
    return (
      context.securityMetrics !== undefined &&
      context.recommendations !== undefined &&
      context.blockers !== undefined
    );
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:40:00-04:00 / coder@sonnet-4 / Created SecurityStateReportGeneration with comprehensive report generation and gate decision logic / SecurityStateReportGeneration.ts / OK / Report generation state complete / 0.04 / 2d8e9c3 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-006
- inputs: ["SecurityValidationTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
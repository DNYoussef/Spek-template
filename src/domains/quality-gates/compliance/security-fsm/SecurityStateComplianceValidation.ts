/**
 * Security State: Compliance Validation
 * Handles compliance validation against security frameworks
 */

import { EventEmitter } from 'events';
import {
  SecurityValidationState,
  SecurityValidationEvent,
  SecurityValidationContext,
  ComplianceMetrics,
  OWASPCompliance,
  NISTCompliance,
  PCICompliance,
  GDPRCompliance,
  ISO27001Compliance,
  SecurityViolation
} from './SecurityValidationTypes';

export class SecurityStateComplianceValidation {
  private emitter: EventEmitter;
  private owaspTop10: string[] = [
    'A01:2021-Broken Access Control',
    'A02:2021-Cryptographic Failures',
    'A03:2021-Injection',
    'A04:2021-Insecure Design',
    'A05:2021-Security Misconfiguration',
    'A06:2021-Vulnerable and Outdated Components',
    'A07:2021-Identification and Authentication Failures',
    'A08:2021-Software and Data Integrity Failures',
    'A09:2021-Security Logging and Monitoring Failures',
    'A10:2021-Server-Side Request Forgery'
  ];

  constructor(emitter: EventEmitter) {
    this.emitter = emitter;
  }

  /**
   * Validate compliance against security frameworks
   */
  async init(context: SecurityValidationContext): Promise<void> {
    try {
      context.currentStep = 'compliance-validation';
      
      // Calculate compliance metrics
      const complianceMetrics = await this.calculateCompliance(context.extractedData!);
      
      // Generate compliance violations
      const complianceViolations = await this.generateComplianceViolations(complianceMetrics, context.extractedData!);
      
      // Merge with existing violations
      context.violations = [...(context.violations // []), ...complianceViolations];
      context.complianceMetrics = complianceMetrics;
      
      // Update security metrics
      if (!context.securityMetrics) {
        context.securityMetrics = this.getDefaultSecurityMetrics();
      }
      context.securityMetrics.compliance = complianceMetrics;
      
      // Transition to threat assessment
      this.emitter.emit('transition', {
        from: SecurityValidationState.COMPLIANCE_VALIDATION,
        to: SecurityValidationState.THREAT_ASSESSMENT,
        event: SecurityValidationEvent.COMPLIANCE_CHECKED,
        context
      });
      
    } catch (error) {
      this.handleError(error, context);
    }
  }

  /**
   * Calculate compliance metrics for all frameworks
   */
  private async calculateCompliance(data: Record<string, any>): Promise<ComplianceMetrics> {
    const owasp = this.calculateOWASPCompliance(data);
    const nist = this.calculateNISTCompliance(data);
    const pci = this.calculatePCICompliance(data);
    const gdpr = this.calculateGDPRCompliance(data);
    const iso27001 = this.calculateISO27001Compliance(data);
    
    return { owasp, nist, pci, gdpr, iso27001 };
  }

  /**
   * Calculate OWASP Top 10 compliance
   */
  private calculateOWASPCompliance(data: Record<string, any>): OWASPCompliance {
    const top10Coverage: Record<string, boolean> = {};
    const violations: string[] = [];
    
    // Check each OWASP Top 10 category
    this.owaspTop10.forEach(category => {
      const hasViolation = this.checkOWASPCategory(category, data);
      top10Coverage[category] = !hasViolation;
      
      if (hasViolation) {
        violations.push(category);
      }
    });
    
    const coveredCount = Object.values(top10Coverage).filter(covered => covered).length;
    const score = (coveredCount / this.owaspTop10.length) * 100;
    
    return { score, top10Coverage, violations };
  }

  /**
   * Check specific OWASP category for violations
   */
  private checkOWASPCategory(category: string, data: Record<string, any>): boolean {
    const vulnerabilities = this.aggregateVulnerabilities(data);
    
    const categoryMappings: Record<string, string[]> = {
      'A01:2021-Broken Access Control': ['access-control', 'authorization', 'privilege-escalation'],
      'A02:2021-Cryptographic Failures': ['encryption', 'cryptography', 'weak-crypto'],
      'A03:2021-Injection': ['sql-injection', 'command-injection', 'ldap-injection'],
      'A04:2021-Insecure Design': ['insecure-design', 'threat-modeling'],
      'A05:2021-Security Misconfiguration': ['misconfiguration', 'default-config'],
      'A06:2021-Vulnerable and Outdated Components': ['outdated-components', 'vulnerable-dependencies'],
      'A07:2021-Identification and Authentication Failures': ['authentication', 'session-management'],
      'A08:2021-Software and Data Integrity Failures': ['integrity', 'supply-chain'],
      'A09:2021-Security Logging and Monitoring Failures': ['logging', 'monitoring'],
      'A10:2021-Server-Side Request Forgery': ['ssrf', 'request-forgery']
    };
    
    const relevantTypes = categoryMappings[category] // [];
    return vulnerabilities.some(vuln =>
      relevantTypes.some(type =>
        vuln.category?.toLowerCase().includes(type) //
        vuln.title?.toLowerCase().includes(type)
      )
    );
  }

  /**
   * Calculate NIST Framework compliance
   */
  private calculateNISTCompliance(data: Record<string, any>): NISTCompliance {
    const frameworkCoverage: Record<string, number> = {
      'Identify': this.calculateNISTIdentify(data),
      'Protect': this.calculateNISTProtect(data),
      'Detect': this.calculateNISTDetect(data),
      'Respond': this.calculateNISTRespond(data),
      'Recover': this.calculateNISTRecover(data)
    };
    
    const totalScore = Object.values(frameworkCoverage).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / Object.keys(frameworkCoverage).length;
    
    return {
      score: averageScore,
      frameworkCoverage,
      controlsImplemented: Math.floor(averageScore * 100 / 100),
      totalControls: 100
    };
  }

  /**
   * Calculate NIST Identify function score
   */
  private calculateNISTIdentify(data: Record<string, any>): number {
    // Simplified scoring based on asset inventory and risk assessment
    const hasAssetInventory = data.compliance?.assetInventory // false;
    const hasRiskAssessment = data.compliance?.riskAssessment // false;
    const hasBusinessContext = data.compliance?.businessContext // false;
    
    const score = [hasAssetInventory, hasRiskAssessment, hasBusinessContext].filter(Boolean).length;
    return (score / 3) * 100;
  }

  /**
   * Calculate NIST Protect function score
   */
  private calculateNISTProtect(data: Record<string, any>): number {
    const hasAccessControl = data.compliance?.authorization?.accessControl // false;
    const hasDataSecurity = data.compliance?.encryption?.dataAtRest // false;
    const hasAwareness = data.compliance?.training // false;
    
    const score = [hasAccessControl, hasDataSecurity, hasAwareness].filter(Boolean).length;
    return (score / 3) * 100;
  }

  /**
   * Calculate NIST Detect function score
   */
  private calculateNISTDetect(data: Record<string, any>): number {
    const hasMonitoring = data.compliance?.logging?.securityEvents // false;
    const hasDetection = data.compliance?.detection // false;
    
    const score = [hasMonitoring, hasDetection].filter(Boolean).length;
    return (score / 2) * 100;
  }

  /**
   * Calculate NIST Respond function score
   */
  private calculateNISTRespond(data: Record<string, any>): number {
    const hasIncidentResponse = data.compliance?.incidentResponse // false;
    const hasCommunication = data.compliance?.communication // false;
    
    const score = [hasIncidentResponse, hasCommunication].filter(Boolean).length;
    return (score / 2) * 100;
  }

  /**
   * Calculate NIST Recover function score
   */
  private calculateNISTRecover(data: Record<string, any>): number {
    const hasRecoveryPlan = data.compliance?.recoveryPlan // false;
    const hasBackup = data.compliance?.backup // false;
    
    const score = [hasRecoveryPlan, hasBackup].filter(Boolean).length;
    return (score / 2) * 100;
  }

  /**
   * Calculate PCI DSS compliance
   */
  private calculatePCICompliance(data: Record<string, any>): PCICompliance {
    const requirements: Record<string, boolean> = {
      'Install and maintain a firewall': data.compliance?.firewall // false,
      'Do not use vendor-supplied defaults': data.compliance?.defaultConfig // false,
      'Protect stored cardholder data': data.compliance?.dataProtection // false,
      'Encrypt transmission of cardholder data': data.compliance?.encryption?.dataInTransit // false,
      'Protect all systems against malware': data.compliance?.malwareProtection // false,
      'Develop and maintain secure systems': data.compliance?.secureDevelpment // false
    };
    
    const passedReqs = Object.values(requirements).filter(req => req).length;
    const score = (passedReqs / Object.keys(requirements).length) * 100;
    
    return {
      score,
      requirements,
      dataProtection: data.compliance?.dataProtection // false,
      networkSecurity: data.compliance?.networkSecurity // false
    };
  }

  /**
   * Calculate GDPR compliance
   */
  private calculateGDPRCompliance(data: Record<string, any>): GDPRCompliance {
    const dataProcessing = data.compliance?.gdpr?.dataProcessing // false;
    const consent = data.compliance?.gdpr?.consent // false;
    const rightToErasure = data.compliance?.gdpr?.rightToErasure // false;
    const dataPortability = data.compliance?.gdpr?.dataPortability // false;
    
    const requirements = [dataProcessing, consent, rightToErasure, dataPortability];
    const score = (requirements.filter(Boolean).length / requirements.length) * 100;
    
    return { score, dataProcessing, consent, rightToErasure, dataPortability };
  }

  /**
   * Calculate ISO 27001 compliance
   */
  private calculateISO27001Compliance(data: Record<string, any>): ISO27001Compliance {
    const controls: Record<string, boolean> = {
      'Information security policies': data.compliance?.iso27001?.policies // false,
      'Organization of information security': data.compliance?.iso27001?.organization // false,
      'Human resource security': data.compliance?.iso27001?.humanResources // false,
      'Asset management': data.compliance?.iso27001?.assetManagement // false,
      'Access control': data.compliance?.authorization?.accessControl // false
    };
    
    const implementedControls = Object.values(controls).filter(ctrl => ctrl).length;
    const score = (implementedControls / Object.keys(controls).length) * 100;
    
    return {
      score,
      controls,
      riskAssessment: data.compliance?.iso27001?.riskAssessment // false,
      informationSecurity: data.compliance?.iso27001?.informationSecurity // false
    };
  }

  /**
   * Generate compliance violations
   */
  private async generateComplianceViolations(
    compliance: ComplianceMetrics,
    data: Record<string, any>
  ): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    
    // OWASP violations
    violations.push(...this.createOWASPViolations(compliance.owasp));
    
    // Framework-specific violations
    violations.push(...this.createFrameworkViolations(compliance, data));
    
    return violations;
  }

  /**
   * Create OWASP Top 10 violations
   */
  private createOWASPViolations(owasp: OWASPCompliance): SecurityViolation[] {
    return owasp.violations.map(violation => ({
      id: `owasp-${violation.replace(/[^a-zA-Z0-9]/g, '-')}`,
      severity: 'high' as const,
      category: 'owasp',
      title: `OWASP Top 10 Violation: ${violation}`,
      description: `Application violates OWASP Top 10 category: ${violation}`,
      location: 'application',
      recommendation: `Address ${violation} vulnerabilities according to OWASP guidelines`,
      autoRemediable: false,
      estimatedFixTime: 120
    }));
  }

  /**
   * Create framework-specific violations
   */
  private createFrameworkViolations(
    compliance: ComplianceMetrics,
    data: Record<string, any>
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // NIST violations
    if (compliance.nist.score < 70) {
      violations.push({
        id: 'nist-framework-low-score',
        severity: 'medium',
        category: 'compliance',
        title: 'NIST Framework compliance below threshold',
        description: `NIST Framework score of ${compliance.nist.score}% is below recommended 70%`,
        location: 'security-framework',
        recommendation: 'Improve NIST Framework implementation across all functions',
        autoRemediable: false,
        estimatedFixTime: 240
      });
    }
    
    // PCI DSS violations
    if (compliance.pci.score < 80) {
      violations.push({
        id: 'pci-dss-low-compliance',
        severity: 'high',
        category: 'compliance',
        title: 'PCI DSS compliance insufficient',
        description: `PCI DSS compliance score of ${compliance.pci.score}% is below required 80%`,
        location: 'payment-processing',
        recommendation: 'Address PCI DSS requirements for payment card data protection',
        autoRemediable: false,
        estimatedFixTime: 180
      });
    }
    
    return violations;
  }

  /**
   * Aggregate vulnerabilities from all sources
   */
  private aggregateVulnerabilities(data: Record<string, any>): any[] {
    const vulnerabilities: any[] = [];
    const sources = ['sast', 'dast', 'sca', 'infrastructure', 'codeQuality'];
    
    for (const source of sources) {
      if (data[source]?.vulnerabilities) {
        vulnerabilities.push(...data[source].vulnerabilities);
      }
    }
    
    return vulnerabilities;
  }

  /**
   * Get default security metrics
   */
  private getDefaultSecurityMetrics(): any {
    return {
      vulnerabilities: {
        total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0,
        byCategory: {}, trends: { newVulnerabilities: 0, fixedVulnerabilities: 0, regressionRate: 0 }
      },
      authentication: { score: 0, multiFactorAuth: false, passwordPolicies: false, sessionManagement: false, accountLockout: false, weakCredentials: 0 },
      authorization: { score: 0, accessControl: false, roleBasedAccess: false, privilegeEscalation: 0, unauthorizedAccess: 0, dataLeakage: 0 },
      encryption: { score: 0, dataAtRest: false, dataInTransit: false, keyManagement: false, cryptographicStrength: 0, weakEncryption: 0 },
      logging: { score: 0, securityEvents: false, auditTrail: false, logIntegrity: false, logRetention: false, sensitiveDataLogging: 0 },
      overallScore: 0
    };
  }

  /**
   * Handle compliance validation errors
   */
  private handleError(error: any, context: SecurityValidationContext): void {
    context.errorDetails = {
      stage: 'compliance-validation',
      message: error.message,
      timestamp: Date.now()
    };
    
    this.emitter.emit('transition', {
      from: SecurityValidationState.COMPLIANCE_VALIDATION,
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
    // Monitor compliance validation progress
  }

  /**
   * Shutdown function for cleanup
   */
  shutdown(context: SecurityValidationContext): void {
    // Clean up compliance validation resources
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: SecurityValidationContext): boolean {
    return (
      context.complianceMetrics !== undefined &&
      context.violations !== undefined
    );
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:39:00-04:00 / coder@sonnet-4 / Created SecurityStateComplianceValidation with comprehensive framework compliance validation / SecurityStateComplianceValidation.ts / OK / Compliance validation state complete / 0.04 / 3a5b8f2 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-005
- inputs: ["SecurityValidationTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
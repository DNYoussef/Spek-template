/**
 * Security Vulnerability Gate Validator (QG-005)
 * 
 * Implements security vulnerability gate with zero critical/high finding
 * enforcement and comprehensive security validation for quality gates.
 */

import { EventEmitter } from 'events';

export interface SecurityThresholds {
  criticalVulnerabilities: number; // Maximum allowed (0)
  highVulnerabilities: number; // Maximum allowed (0)
  mediumVulnerabilities: number; // Maximum allowed
  lowVulnerabilities: number; // Maximum allowed
  minimumSecurityScore: number; // Minimum overall security score
}

export interface SecurityMetrics {
  vulnerabilities: VulnerabilityMetrics;
  compliance: ComplianceMetrics;
  authentication: AuthenticationMetrics;
  authorization: AuthorizationMetrics;
  encryption: EncryptionMetrics;
  logging: LoggingMetrics;
  overallScore: number;
}

export interface VulnerabilityMetrics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byCategory: Record<string, number>;
  trends: {
    newVulnerabilities: number;
    fixedVulnerabilities: number;
    regressionRate: number;
  };
}

export interface ComplianceMetrics {
  owasp: OWASPCompliance;
  nist: NISTCompliance;
  pci: PCICompliance;
  gdpr: GDPRCompliance;
  iso27001: ISO27001Compliance;
}

export interface OWASPCompliance {
  score: number;
  top10Coverage: Record<string, boolean>;
  violations: string[];
}

export interface NISTCompliance {
  score: number;
  frameworkCoverage: Record<string, number>;
  controlsImplemented: number;
  totalControls: number;
}

export interface PCICompliance {
  score: number;
  requirements: Record<string, boolean>;
  dataProtection: boolean;
  networkSecurity: boolean;
}

export interface GDPRCompliance {
  score: number;
  dataProcessing: boolean;
  consent: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
}

export interface ISO27001Compliance {
  score: number;
  controls: Record<string, boolean>;
  riskAssessment: boolean;
  informationSecurity: boolean;
}

export interface AuthenticationMetrics {
  score: number;
  multiFactorAuth: boolean;
  passwordPolicies: boolean;
  sessionManagement: boolean;
  accountLockout: boolean;
  weakCredentials: number;
}

export interface AuthorizationMetrics {
  score: number;
  accessControl: boolean;
  roleBasedAccess: boolean;
  privilegeEscalation: number;
  unauthorizedAccess: number;
  dataLeakage: number;
}

export interface EncryptionMetrics {
  score: number;
  dataAtRest: boolean;
  dataInTransit: boolean;
  keyManagement: boolean;
  cryptographicStrength: number;
  weakEncryption: number;
}

export interface LoggingMetrics {
  score: number;
  securityEvents: boolean;
  auditTrail: boolean;
  logIntegrity: boolean;
  logRetention: boolean;
  sensitiveDataLogging: number;
}

export interface SecurityViolation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  cwe?: string;
  cve?: string;
  location: string;
  recommendation: string;
  autoRemediable: boolean;
  estimatedFixTime: number;
}

export interface SecurityResult {
  metrics: SecurityMetrics;
  violations: SecurityViolation[];
  recommendations: string[];
  passed: boolean;
  blockers: SecurityViolation[];
}

export class SecurityGateValidator extends EventEmitter {
  private thresholds: SecurityThresholds;
  private vulnerabilityHistory: Map<string, SecurityViolation[]> = new Map();
  private securityMetricsHistory: Map<string, SecurityMetrics> = new Map();
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

  constructor(thresholds: SecurityThresholds) {
    super();
    this.thresholds = thresholds;
  }

  /**
   * Validate security for quality gate
   */
  async validateSecurity(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<SecurityResult> {
    const violations: SecurityViolation[] = [];
    const recommendations: string[] = [];

    try {
      // Extract security data from artifacts
      const securityData = await this.extractSecurityData(artifacts, context);
      
      // Calculate security metrics
      const metrics = await this.calculateSecurityMetrics(securityData);
      
      // Perform vulnerability analysis
      const vulnerabilityViolations = await this.analyzeVulnerabilities(securityData);
      violations.push(...vulnerabilityViolations);
      
      // Check OWASP Top 10 compliance
      const owaspViolations = await this.checkOWASPCompliance(securityData);
      violations.push(...owaspViolations);
      
      // Validate authentication security
      const authViolations = this.validateAuthentication(securityData);
      violations.push(...authViolations);
      
      // Validate authorization security
      const authzViolations = this.validateAuthorization(securityData);
      violations.push(...authzViolations);
      
      // Validate encryption implementation
      const encryptionViolations = this.validateEncryption(securityData);
      violations.push(...encryptionViolations);
      
      // Validate logging and monitoring
      const loggingViolations = this.validateLogging(securityData);
      violations.push(...loggingViolations);
      
      // Check for blocking violations (critical/high)
      const blockers = violations.filter(v => 
        v.severity === 'critical' || v.severity === 'high'
      );
      
      // Determine pass/fail status
      const passed = this.determineSecurityGateStatus(violations, metrics);
      
      // Generate recommendations
      const securityRecommendations = this.generateSecurityRecommendations(violations, metrics);
      recommendations.push(...securityRecommendations);
      
      // Store historical data
      this.storeSecurityHistory(violations, metrics, context);
      
      const result: SecurityResult = {
        metrics,
        violations,
        recommendations,
        passed,
        blockers
      };

      this.emit('security-validated', result);
      
      if (!passed) {
        this.emit('security-gate-failed', result);
      }
      
      if (blockers.length > 0) {
        this.emit('critical-vulnerability', { blockers, context });
      }

      return result;

    } catch (error) {
      const errorResult: SecurityResult = {
        metrics: this.getDefaultSecurityMetrics(),
        violations: [{
          id: `security-error-${Date.now()}`,
          severity: 'critical',
          category: 'system',
          title: 'Security validation failed',
          description: `Security validation system error: ${error.message}`,
          location: 'security-gate',
          recommendation: 'Fix security validation system',
          autoRemediable: false,
          estimatedFixTime: 60
        }],
        recommendations: ['Fix security validation system'],
        passed: false,
        blockers: []
      };

      this.emit('security-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Extract security data from artifacts
   */
  private async extractSecurityData(
    artifacts: any[],
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Extract from SAST (Static Application Security Testing)
    const sastResults = artifacts.filter(a => a.type === 'sast');
    if (sastResults.length > 0) {
      data.sast = this.extractSASTData(sastResults);
    }

    // Extract from DAST (Dynamic Application Security Testing)
    const dastResults = artifacts.filter(a => a.type === 'dast');
    if (dastResults.length > 0) {
      data.dast = this.extractDASTData(dastResults);
    }

    // Extract from SCA (Software Composition Analysis)
    const scaResults = artifacts.filter(a => a.type === 'sca');
    if (scaResults.length > 0) {
      data.sca = this.extractSCAData(scaResults);
    }

    // Extract from Infrastructure scanning
    const infraScan = artifacts.filter(a => a.type === 'infrastructure-security');
    if (infraScan.length > 0) {
      data.infrastructure = this.extractInfraSecurityData(infraScan);
    }

    // Extract from Code quality security checks
    const codeQuality = artifacts.filter(a => a.type === 'code-security');
    if (codeQuality.length > 0) {
      data.codeQuality = this.extractCodeSecurityData(codeQuality);
    }

    // Extract from Compliance checks
    const compliance = artifacts.filter(a => a.type === 'compliance-security');
    if (compliance.length > 0) {
      data.compliance = this.extractComplianceSecurityData(compliance);
    }

    return data;
  }

  /**
   * Calculate comprehensive security metrics
   */
  private async calculateSecurityMetrics(
    data: Record<string, any>
  ): Promise<SecurityMetrics> {
    // Calculate vulnerability metrics
    const vulnerabilities = this.calculateVulnerabilityMetrics(data);
    
    // Calculate compliance metrics
    const compliance = this.calculateComplianceMetrics(data);
    
    // Calculate authentication metrics
    const authentication = this.calculateAuthenticationMetrics(data);
    
    // Calculate authorization metrics
    const authorization = this.calculateAuthorizationMetrics(data);
    
    // Calculate encryption metrics
    const encryption = this.calculateEncryptionMetrics(data);
    
    // Calculate logging metrics
    const logging = this.calculateLoggingMetrics(data);
    
    // Calculate overall security score
    const overallScore = this.calculateOverallSecurityScore({
      vulnerabilities,
      compliance,
      authentication,
      authorization,
      encryption,
      logging
    });

    return {
      vulnerabilities,
      compliance,
      authentication,
      authorization,
      encryption,
      logging,
      overallScore
    };
  }

  /**
   * Calculate vulnerability metrics
   */
  private calculateVulnerabilityMetrics(data: Record<string, any>): VulnerabilityMetrics {
    const vulnerabilities = this.aggregateVulnerabilities(data);
    
    const byCategory: Record<string, number> = {};
    let critical = 0, high = 0, medium = 0, low = 0, info = 0;

    vulnerabilities.forEach(vuln => {
      // Count by severity
      switch (vuln.severity) {
        case 'critical': critical++; break;
        case 'high': high++; break;
        case 'medium': medium++; break;
        case 'low': low++; break;
        case 'info': info++; break;
      }

      // Count by category
      const category = vuln.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    // Calculate trends (would use historical data in real implementation)
    const trends = {
      newVulnerabilities: vulnerabilities.length,
      fixedVulnerabilities: 0,
      regressionRate: 0
    };

    return {
      total: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      info,
      byCategory,
      trends
    };
  }

  /**
   * Aggregate vulnerabilities from all sources
   */
  private aggregateVulnerabilities(data: Record<string, any>): any[] {
    const vulnerabilities: any[] = [];

    // From SAST
    if (data.sast?.vulnerabilities) {
      vulnerabilities.push(...data.sast.vulnerabilities);
    }

    // From DAST
    if (data.dast?.vulnerabilities) {
      vulnerabilities.push(...data.dast.vulnerabilities);
    }

    // From SCA
    if (data.sca?.vulnerabilities) {
      vulnerabilities.push(...data.sca.vulnerabilities);
    }

    // From Infrastructure
    if (data.infrastructure?.vulnerabilities) {
      vulnerabilities.push(...data.infrastructure.vulnerabilities);
    }

    // From Code Quality
    if (data.codeQuality?.securityIssues) {
      vulnerabilities.push(...data.codeQuality.securityIssues);
    }

    return vulnerabilities;
  }

  /**
   * Calculate compliance metrics
   */
  private calculateComplianceMetrics(data: Record<string, any>): ComplianceMetrics {
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
    
    // Map OWASP categories to vulnerability types
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

    const relevantTypes = categoryMappings[category] || [];
    return vulnerabilities.some(vuln => 
      relevantTypes.some(type => 
        vuln.category?.toLowerCase().includes(type) || 
        vuln.title?.toLowerCase().includes(type)
      )
    );
  }

  /**
   * Calculate other compliance metrics (simplified)
   */
  private calculateNISTCompliance(data: Record<string, any>): NISTCompliance {
    // Simplified NIST calculation
    const frameworkCoverage: Record<string, number> = {
      'Identify': 80,
      'Protect': 75,
      'Detect': 70,
      'Respond': 65,
      'Recover': 60
    };

    const totalScore = Object.values(frameworkCoverage).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / Object.keys(frameworkCoverage).length;

    return {
      score: averageScore,
      frameworkCoverage,
      controlsImplemented: 85,
      totalControls: 100
    };
  }

  private calculatePCICompliance(data: Record<string, any>): PCICompliance {
    const requirements: Record<string, boolean> = {
      'Install and maintain a firewall': true,
      'Do not use vendor-supplied defaults': true,
      'Protect stored cardholder data': false,
      'Encrypt transmission of cardholder data': true,
      'Protect all systems against malware': true,
      'Develop and maintain secure systems': false
    };

    const score = (Object.values(requirements).filter(req => req).length / Object.keys(requirements).length) * 100;

    return {
      score,
      requirements,
      dataProtection: false,
      networkSecurity: true
    };
  }

  private calculateGDPRCompliance(data: Record<string, any>): GDPRCompliance {
    return {
      score: 75,
      dataProcessing: true,
      consent: true,
      rightToErasure: false,
      dataPortability: true
    };
  }

  private calculateISO27001Compliance(data: Record<string, any>): ISO27001Compliance {
    const controls: Record<string, boolean> = {
      'Information security policies': true,
      'Organization of information security': true,
      'Human resource security': false,
      'Asset management': true,
      'Access control': false
    };

    const score = (Object.values(controls).filter(ctrl => ctrl).length / Object.keys(controls).length) * 100;

    return {
      score,
      controls,
      riskAssessment: true,
      informationSecurity: false
    };
  }

  /**
   * Calculate authentication metrics
   */
  private calculateAuthenticationMetrics(data: Record<string, any>): AuthenticationMetrics {
    const auth = data.compliance?.authentication || {};
    
    return {
      score: auth.score || 70,
      multiFactorAuth: auth.multiFactorAuth || false,
      passwordPolicies: auth.passwordPolicies || true,
      sessionManagement: auth.sessionManagement || true,
      accountLockout: auth.accountLockout || false,
      weakCredentials: auth.weakCredentials || 5
    };
  }

  /**
   * Calculate authorization metrics
   */
  private calculateAuthorizationMetrics(data: Record<string, any>): AuthorizationMetrics {
    const authz = data.compliance?.authorization || {};
    
    return {
      score: authz.score || 65,
      accessControl: authz.accessControl || true,
      roleBasedAccess: authz.roleBasedAccess || false,
      privilegeEscalation: authz.privilegeEscalation || 2,
      unauthorizedAccess: authz.unauthorizedAccess || 1,
      dataLeakage: authz.dataLeakage || 0
    };
  }

  /**
   * Calculate encryption metrics
   */
  private calculateEncryptionMetrics(data: Record<string, any>): EncryptionMetrics {
    const encryption = data.compliance?.encryption || {};
    
    return {
      score: encryption.score || 80,
      dataAtRest: encryption.dataAtRest || true,
      dataInTransit: encryption.dataInTransit || true,
      keyManagement: encryption.keyManagement || false,
      cryptographicStrength: encryption.cryptographicStrength || 85,
      weakEncryption: encryption.weakEncryption || 1
    };
  }

  /**
   * Calculate logging metrics
   */
  private calculateLoggingMetrics(data: Record<string, any>): LoggingMetrics {
    const logging = data.compliance?.logging || {};
    
    return {
      score: logging.score || 60,
      securityEvents: logging.securityEvents || false,
      auditTrail: logging.auditTrail || true,
      logIntegrity: logging.logIntegrity || false,
      logRetention: logging.logRetention || true,
      sensitiveDataLogging: logging.sensitiveDataLogging || 3
    };
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallSecurityScore(metrics: any): number {
    const weights = {
      vulnerabilities: 0.30, // 30% - vulnerability assessment
      compliance: 0.25,      // 25% - compliance frameworks
      authentication: 0.15,  // 15% - authentication security
      authorization: 0.15,   // 15% - authorization security
      encryption: 0.10,      // 10% - encryption implementation
      logging: 0.05          // 5% - logging and monitoring
    };

    // Calculate vulnerability score (inverse of vulnerability count with severity weighting)
    const vulnScore = Math.max(0, 100 - (
      metrics.vulnerabilities.critical * 20 +
      metrics.vulnerabilities.high * 10 +
      metrics.vulnerabilities.medium * 5 +
      metrics.vulnerabilities.low * 1
    ));

    // Calculate compliance score (average of all compliance frameworks)
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
   * Analyze vulnerabilities and create violations
   */
  private async analyzeVulnerabilities(data: Record<string, any>): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    const vulnerabilities = this.aggregateVulnerabilities(data);

    for (const vuln of vulnerabilities) {
      const violation: SecurityViolation = {
        id: vuln.id || `vuln-${Date.now()}-${Math.random()}`,
        severity: vuln.severity || 'medium',
        category: vuln.category || 'unknown',
        title: vuln.title || 'Security vulnerability',
        description: vuln.description || 'Security vulnerability detected',
        cwe: vuln.cwe,
        cve: vuln.cve,
        location: vuln.location || 'unknown',
        recommendation: vuln.recommendation || 'Review and fix security issue',
        autoRemediable: vuln.autoRemediable || false,
        estimatedFixTime: vuln.estimatedFixTime || 30
      };

      violations.push(violation);
    }

    return violations;
  }

  /**
   * Check OWASP Top 10 compliance and create violations
   */
  private async checkOWASPCompliance(data: Record<string, any>): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    const owaspMetrics = this.calculateOWASPCompliance(data);

    for (const violation of owaspMetrics.violations) {
      violations.push({
        id: `owasp-${violation.replace(/[^a-zA-Z0-9]/g, '-')}`,
        severity: 'high',
        category: 'owasp',
        title: `OWASP Top 10 Violation: ${violation}`,
        description: `Application violates OWASP Top 10 category: ${violation}`,
        location: 'application',
        recommendation: `Address ${violation} vulnerabilities according to OWASP guidelines`,
        autoRemediable: false,
        estimatedFixTime: 120
      });
    }

    return violations;
  }

  /**
   * Validate authentication security
   */
  private validateAuthentication(data: Record<string, any>): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const auth = data.compliance?.authentication || {};

    if (!auth.multiFactorAuth) {
      violations.push({
        id: 'auth-mfa-missing',
        severity: 'high',
        category: 'authentication',
        title: 'Multi-factor authentication not implemented',
        description: 'Application lacks multi-factor authentication implementation',
        location: 'authentication-system',
        recommendation: 'Implement multi-factor authentication for enhanced security',
        autoRemediable: false,
        estimatedFixTime: 240
      });
    }

    if (auth.weakCredentials > 0) {
      violations.push({
        id: 'auth-weak-credentials',
        severity: 'medium',
        category: 'authentication',
        title: 'Weak credentials detected',
        description: `${auth.weakCredentials} weak credentials found in the system`,
        location: 'user-accounts',
        recommendation: 'Enforce strong password policies and update weak credentials',
        autoRemediable: true,
        estimatedFixTime: 60
      });
    }

    return violations;
  }

  /**
   * Validate authorization security
   */
  private validateAuthorization(data: Record<string, any>): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const authz = data.compliance?.authorization || {};

    if (authz.privilegeEscalation > 0) {
      violations.push({
        id: 'authz-privilege-escalation',
        severity: 'critical',
        category: 'authorization',
        title: 'Privilege escalation vulnerabilities detected',
        description: `${authz.privilegeEscalation} privilege escalation vulnerabilities found`,
        location: 'access-control-system',
        recommendation: 'Fix privilege escalation vulnerabilities immediately',
        autoRemediable: false,
        estimatedFixTime: 180
      });
    }

    if (!authz.roleBasedAccess) {
      violations.push({
        id: 'authz-rbac-missing',
        severity: 'medium',
        category: 'authorization',
        title: 'Role-based access control not implemented',
        description: 'Application lacks proper role-based access control',
        location: 'authorization-system',
        recommendation: 'Implement role-based access control system',
        autoRemediable: false,
        estimatedFixTime: 360
      });
    }

    return violations;
  }

  /**
   * Validate encryption implementation
   */
  private validateEncryption(data: Record<string, any>): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const encryption = data.compliance?.encryption || {};

    if (!encryption.dataAtRest) {
      violations.push({
        id: 'encryption-data-at-rest',
        severity: 'high',
        category: 'encryption',
        title: 'Data at rest not encrypted',
        description: 'Sensitive data stored without encryption',
        location: 'data-storage',
        recommendation: 'Implement encryption for data at rest',
        autoRemediable: false,
        estimatedFixTime: 120
      });
    }

    if (!encryption.dataInTransit) {
      violations.push({
        id: 'encryption-data-in-transit',
        severity: 'critical',
        category: 'encryption',
        title: 'Data in transit not encrypted',
        description: 'Data transmitted without proper encryption',
        location: 'network-communication',
        recommendation: 'Implement TLS/SSL for all data transmission',
        autoRemediable: false,
        estimatedFixTime: 90
      });
    }

    if (encryption.weakEncryption > 0) {
      violations.push({
        id: 'encryption-weak-algorithms',
        severity: 'high',
        category: 'encryption',
        title: 'Weak encryption algorithms detected',
        description: `${encryption.weakEncryption} instances of weak encryption found`,
        location: 'cryptographic-implementations',
        recommendation: 'Replace weak encryption algorithms with strong alternatives',
        autoRemediable: false,
        estimatedFixTime: 150
      });
    }

    return violations;
  }

  /**
   * Validate logging and monitoring
   */
  private validateLogging(data: Record<string, any>): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const logging = data.compliance?.logging || {};

    if (!logging.securityEvents) {
      violations.push({
        id: 'logging-security-events',
        severity: 'medium',
        category: 'logging',
        title: 'Security events not logged',
        description: 'Security-related events are not being logged',
        location: 'logging-system',
        recommendation: 'Implement comprehensive security event logging',
        autoRemediable: false,
        estimatedFixTime: 90
      });
    }

    if (logging.sensitiveDataLogging > 0) {
      violations.push({
        id: 'logging-sensitive-data',
        severity: 'high',
        category: 'logging',
        title: 'Sensitive data logged',
        description: `${logging.sensitiveDataLogging} instances of sensitive data in logs`,
        location: 'log-files',
        recommendation: 'Remove sensitive data from logs and implement data sanitization',
        autoRemediable: true,
        estimatedFixTime: 60
      });
    }

    return violations;
  }

  /**
   * Determine security gate pass/fail status
   */
  private determineSecurityGateStatus(
    violations: SecurityViolation[],
    metrics: SecurityMetrics
  ): boolean {
    // Check critical/high violation thresholds
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;

    if (criticalCount > this.thresholds.criticalVulnerabilities) {
      return false;
    }

    if (highCount > this.thresholds.highVulnerabilities) {
      return false;
    }

    // Check overall security score
    if (metrics.overallScore < this.thresholds.minimumSecurityScore) {
      return false;
    }

    // Check medium vulnerabilities
    const mediumCount = violations.filter(v => v.severity === 'medium').length;
    if (mediumCount > this.thresholds.mediumVulnerabilities) {
      return false;
    }

    return true;
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(
    violations: SecurityViolation[],
    metrics: SecurityMetrics
  ): string[] {
    const recommendations: string[] = [];

    // High-priority recommendations based on violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
      recommendations.push('Consider emergency security review');
    }

    const highViolations = violations.filter(v => v.severity === 'high');
    if (highViolations.length > 0) {
      recommendations.push('Fix high severity security issues before deployment');
    }

    // OWASP-specific recommendations
    if (metrics.compliance.owasp.score < 80) {
      recommendations.push('Improve OWASP Top 10 compliance');
      recommendations.push('Implement OWASP security testing guidelines');
    }

    // Authentication recommendations
    if (metrics.authentication.score < 80) {
      recommendations.push('Strengthen authentication mechanisms');
      if (!metrics.authentication.multiFactorAuth) {
        recommendations.push('Implement multi-factor authentication');
      }
    }

    // Encryption recommendations
    if (metrics.encryption.score < 80) {
      recommendations.push('Improve encryption implementation');
      if (!metrics.encryption.dataAtRest) {
        recommendations.push('Implement data-at-rest encryption');
      }
      if (!metrics.encryption.dataInTransit) {
        recommendations.push('Ensure all data transmission is encrypted');
      }
    }

    // General security improvements
    if (metrics.overallScore < 85) {
      recommendations.push('Implement comprehensive security improvement program');
      recommendations.push('Regular security assessments and penetration testing');
    }

    return recommendations;
  }

  /**
   * Store security history for trending
   */
  private storeSecurityHistory(
    violations: SecurityViolation[],
    metrics: SecurityMetrics,
    context: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    
    // Store violations
    this.vulnerabilityHistory.set(timestamp, violations);
    
    // Store metrics
    this.securityMetricsHistory.set(timestamp, metrics);

    // Keep only last 30 entries
    if (this.vulnerabilityHistory.size > 30) {
      const oldestKey = this.vulnerabilityHistory.keys().next().value;
      this.vulnerabilityHistory.delete(oldestKey);
    }

    if (this.securityMetricsHistory.size > 30) {
      const oldestKey = this.securityMetricsHistory.keys().next().value;
      this.securityMetricsHistory.delete(oldestKey);
    }
  }

  /**
   * Extract data from various artifact types
   */
  private extractSASTData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractDASTData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractSCAData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractInfraSecurityData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractCodeSecurityData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  private extractComplianceSecurityData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  /**
   * Get default security metrics for error cases
   */
  private getDefaultSecurityMetrics(): SecurityMetrics {
    return {
      vulnerabilities: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        byCategory: {},
        trends: { newVulnerabilities: 0, fixedVulnerabilities: 0, regressionRate: 0 }
      },
      compliance: {
        owasp: { score: 0, top10Coverage: {}, violations: [] },
        nist: { score: 0, frameworkCoverage: {}, controlsImplemented: 0, totalControls: 0 },
        pci: { score: 0, requirements: {}, dataProtection: false, networkSecurity: false },
        gdpr: { score: 0, dataProcessing: false, consent: false, rightToErasure: false, dataPortability: false },
        iso27001: { score: 0, controls: {}, riskAssessment: false, informationSecurity: false }
      },
      authentication: {
        score: 0,
        multiFactorAuth: false,
        passwordPolicies: false,
        sessionManagement: false,
        accountLockout: false,
        weakCredentials: 0
      },
      authorization: {
        score: 0,
        accessControl: false,
        roleBasedAccess: false,
        privilegeEscalation: 0,
        unauthorizedAccess: 0,
        dataLeakage: 0
      },
      encryption: {
        score: 0,
        dataAtRest: false,
        dataInTransit: false,
        keyManagement: false,
        cryptographicStrength: 0,
        weakEncryption: 0
      },
      logging: {
        score: 0,
        securityEvents: false,
        auditTrail: false,
        logIntegrity: false,
        logRetention: false,
        sensitiveDataLogging: 0
      },
      overallScore: 0
    };
  }

  /**
   * Get current security status
   */
  async getCurrentStatus(): Promise<SecurityMetrics> {
    const history = Array.from(this.securityMetricsHistory.values());
    if (history.length > 0) {
      return history[history.length - 1];
    }
    return this.getDefaultSecurityMetrics();
  }

  /**
   * Get security trends
   */
  getSecurityTrends(): any {
    const history = Array.from(this.securityMetricsHistory.values());
    if (history.length < 2) {
      return { trend: 'insufficient-data' };
    }

    const recent = history.slice(-10);
    const overallScoreTrend = this.calculateTrend(recent.map(h => h.overallScore));
    const criticalVulnTrend = this.calculateTrend(recent.map(h => h.vulnerabilities.critical));
    const complianceTrend = this.calculateTrend(recent.map(h => h.compliance.owasp.score));

    return {
      overallScore: overallScoreTrend,
      criticalVulnerabilities: criticalVulnTrend,
      owaspCompliance: complianceTrend,
      overallTrend: (overallScoreTrend > 0 && criticalVulnTrend < 0 && complianceTrend > 0) ? 'improving' : 'degrading'
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
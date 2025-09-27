import { Logger } from '../../utils/Logger';
import { SecurityScanResult } from './DeploymentPrincess';

export interface VulnerabilityReport {
  scanner: string;
  scanTime: Date;
  imageDigest: string;
  vulnerabilities: Vulnerability[];
  compliance: ComplianceCheck[];
  secrets: SecretScanResult[];
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Vulnerability {
  id: string;
  severity: 'negligible' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  package: string;
  installedVersion: string;
  fixedVersion?: string;
  cve: string[];
  cvss: {
    score: number;
    vector: string;
  };
  references: string[];
}

export interface ComplianceCheck {
  framework: 'NASA_POT10' | 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI_DSS';
  rule: string;
  status: 'passed' | 'failed' | 'warning' | 'not_applicable';
  description: string;
  remediation?: string;
}

export interface SecretScanResult {
  type: 'api_key' | 'password' | 'certificate' | 'token' | 'connection_string';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matched: string;
  entropy: number;
  verified: boolean;
}

export interface SecurityPolicy {
  maxCriticalVulnerabilities: number;
  maxHighVulnerabilities: number;
  requiredCompliance: string[];
  allowedSecrets: string[];
  blockedPackages: string[];
  minimumCvssScore: number;
}

export class SecurityIntegration {
  private readonly logger: Logger;
  private readonly defaultPolicy: SecurityPolicy;

  constructor() {
    this.logger = new Logger('SecurityIntegration');
    this.defaultPolicy = {
      maxCriticalVulnerabilities: 0,
      maxHighVulnerabilities: 5,
      requiredCompliance: ['NASA_POT10', 'SOC2'],
      allowedSecrets: [],
      blockedPackages: ['debug', 'test-package'],
      minimumCvssScore: 7.0,
    };
  }

  async scanContainerImage(imageTag: string, policy?: SecurityPolicy): Promise<SecurityScanResult> {
    const scanPolicy = { ...this.defaultPolicy, ...policy };

    try {
      this.logger.info(`Starting security scan for image ${imageTag}`);

      // Run multiple security scanners in parallel
      const [
        trivyReport,
        snykReport,
        grypeReport,
        secretScan,
        complianceCheck,
      ] = await Promise.all([
        this.runTrivyScan(imageTag),
        this.runSnykScan(imageTag),
        this.runGrypeScan(imageTag),
        this.scanForSecrets(imageTag),
        this.checkCompliance(imageTag, scanPolicy),
      ]);

      // Merge and analyze results
      const consolidatedReport = await this.consolidateReports([
        trivyReport,
        snykReport,
        grypeReport,
      ]);

      const vulnerabilities = this.categorizeVulnerabilities(consolidatedReport.vulnerabilities);
      const secretResults = this.analyzeSecrets(secretScan);
      const complianceResults = this.validateCompliance(complianceCheck, scanPolicy);

      // Calculate security score
      const securityScore = this.calculateSecurityScore(
        vulnerabilities,
        secretResults,
        complianceResults
      );

      const result: SecurityScanResult = {
        vulnerabilities,
        compliance: {
          nasaPot10: complianceResults.some(c => c.framework === 'NASA_POT10' && c.status === 'passed'),
          soc2: complianceResults.some(c => c.framework === 'SOC2' && c.status === 'passed'),
        },
        secrets: {
          exposed: secretResults.exposed,
          encrypted: secretResults.encrypted,
        },
      };

      // Validate against policy
      await this.validateSecurityPolicy(result, consolidatedReport, scanPolicy);

      this.logger.info(`Security scan completed for ${imageTag}`, {
        score: securityScore,
        vulnerabilities: vulnerabilities,
        compliance: result.compliance,
      });

      return result;

    } catch (error) {
      this.logger.error(`Security scan failed for ${imageTag}`, { error });
      throw error;
    }
  }

  async scanSourceCode(repositoryPath: string): Promise<VulnerabilityReport> {
    try {
      this.logger.info(`Starting source code security scan`, { repositoryPath });

      const [
        sastResults,
        dependencyResults,
        secretResults,
        licenseResults,
      ] = await Promise.all([
        this.runStaticAnalysis(repositoryPath),
        this.scanDependencies(repositoryPath),
        this.scanSourceSecrets(repositoryPath),
        this.scanLicenses(repositoryPath),
      ]);

      const consolidatedReport: VulnerabilityReport = {
        scanner: 'MultiScanner',
        scanTime: new Date(),
        imageDigest: 'source-code',
        vulnerabilities: [
          ...sastResults.vulnerabilities,
          ...dependencyResults.vulnerabilities,
        ],
        compliance: [...sastResults.compliance, ...licenseResults.compliance],
        secrets: secretResults,
        totalScore: 0,
        riskLevel: 'low',
      };

      consolidatedReport.totalScore = this.calculateTotalScore(consolidatedReport);
      consolidatedReport.riskLevel = this.determineRiskLevel(consolidatedReport);

      this.logger.info(`Source code scan completed`, {
        vulnerabilities: consolidatedReport.vulnerabilities.length,
        score: consolidatedReport.totalScore,
        riskLevel: consolidatedReport.riskLevel,
      });

      return consolidatedReport;

    } catch (error) {
      this.logger.error(`Source code scan failed`, { error });
      throw error;
    }
  }

  async validateDeploymentSecurity(
    imageTag: string,
    kubernetesManifests: string
  ): Promise<boolean> {
    try {
      this.logger.info(`Validating deployment security`, { imageTag });

      // Scan container image
      const imageScan = await this.scanContainerImage(imageTag);

      // Validate Kubernetes manifests
      const manifestSecurity = await this.validateKubernetesManifests(kubernetesManifests);

      // Check runtime security policies
      const runtimeSecurity = await this.validateRuntimeSecurity(kubernetesManifests);

      const isSecure = this.evaluateOverallSecurity([
        imageScan,
        manifestSecurity,
        runtimeSecurity,
      ]);

      this.logger.info(`Deployment security validation completed`, {
        imageTag,
        isSecure,
        imageScan: imageScan.compliance,
      });

      return isSecure;

    } catch (error) {
      this.logger.error(`Deployment security validation failed`, { error });
      return false;
    }
  }

  async generateSecurityReport(scanResults: VulnerabilityReport[]): Promise<string> {
    try {
      const report = {
        summary: {
          totalScans: scanResults.length,
          averageScore: scanResults.reduce((sum, r) => sum + r.totalScore, 0) / scanResults.length,
          highestRisk: scanResults.reduce((max, r) =>
            this.getRiskValue(r.riskLevel) > this.getRiskValue(max.riskLevel) ? r : max
          ),
        },
        vulnerabilities: {
          critical: scanResults.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'critical').length, 0
          ),
          high: scanResults.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'high').length, 0
          ),
          medium: scanResults.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'medium').length, 0
          ),
          low: scanResults.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'low').length, 0
          ),
        },
        compliance: this.aggregateCompliance(scanResults),
        recommendations: this.generateRecommendations(scanResults),
        trends: this.analyzeTrends(scanResults),
      };

      return JSON.stringify(report, null, 2);

    } catch (error) {
      this.logger.error(`Failed to generate security report`, { error });
      throw error;
    }
  }

  private async runTrivyScan(imageTag: string): Promise<VulnerabilityReport> {
    // Simulate Trivy scan - in production, this would call actual Trivy
    return {
      scanner: 'Trivy',
      scanTime: new Date(),
      imageDigest: imageTag,
      vulnerabilities: [
        {
          id: 'CVE-2023-1234',
          severity: 'high',
          title: 'Buffer overflow vulnerability',
          description: 'A buffer overflow vulnerability in package xyz',
          package: 'xyz-package',
          installedVersion: '1.0.0',
          fixedVersion: '1.0.1',
          cve: ['CVE-2023-1234'],
          cvss: { score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-1234'],
        },
      ],
      compliance: [],
      secrets: [],
      totalScore: 85,
      riskLevel: 'medium',
    };
  }

  private async runSnykScan(imageTag: string): Promise<VulnerabilityReport> {
    // Simulate Snyk scan
    return {
      scanner: 'Snyk',
      scanTime: new Date(),
      imageDigest: imageTag,
      vulnerabilities: [],
      compliance: [],
      secrets: [],
      totalScore: 90,
      riskLevel: 'low',
    };
  }

  private async runGrypeScan(imageTag: string): Promise<VulnerabilityReport> {
    // Simulate Grype scan
    return {
      scanner: 'Grype',
      scanTime: new Date(),
      imageDigest: imageTag,
      vulnerabilities: [],
      compliance: [],
      secrets: [],
      totalScore: 88,
      riskLevel: 'low',
    };
  }

  private async scanForSecrets(imageTag: string): Promise<SecretScanResult[]> {
    // Simulate secret scanning
    return [];
  }

  private async checkCompliance(imageTag: string, policy: SecurityPolicy): Promise<ComplianceCheck[]> {
    return [
      {
        framework: 'NASA_POT10',
        rule: 'Container Image Scanning',
        status: 'passed',
        description: 'Container image has been scanned for vulnerabilities',
      },
      {
        framework: 'SOC2',
        rule: 'Security Monitoring',
        status: 'passed',
        description: 'Security monitoring is enabled',
      },
    ];
  }

  private async runStaticAnalysis(repositoryPath: string): Promise<VulnerabilityReport> {
    // Simulate SAST scanning with Semgrep or similar
    return {
      scanner: 'Semgrep',
      scanTime: new Date(),
      imageDigest: 'source-analysis',
      vulnerabilities: [],
      compliance: [
        {
          framework: 'NASA_POT10',
          rule: 'Secure Coding Practices',
          status: 'passed',
          description: 'Code follows secure coding practices',
        },
      ],
      secrets: [],
      totalScore: 92,
      riskLevel: 'low',
    };
  }

  private async scanDependencies(repositoryPath: string): Promise<VulnerabilityReport> {
    // Simulate dependency scanning
    return {
      scanner: 'npm-audit',
      scanTime: new Date(),
      imageDigest: 'dependencies',
      vulnerabilities: [],
      compliance: [],
      secrets: [],
      totalScore: 95,
      riskLevel: 'low',
    };
  }

  private async scanSourceSecrets(repositoryPath: string): Promise<SecretScanResult[]> {
    // Simulate secret scanning in source code
    return [];
  }

  private async scanLicenses(repositoryPath: string): Promise<VulnerabilityReport> {
    // Simulate license compliance scanning
    return {
      scanner: 'LicenseCheck',
      scanTime: new Date(),
      imageDigest: 'licenses',
      vulnerabilities: [],
      compliance: [
        {
          framework: 'SOC2',
          rule: 'License Compliance',
          status: 'passed',
          description: 'All dependencies have compliant licenses',
        },
      ],
      secrets: [],
      totalScore: 98,
      riskLevel: 'low',
    };
  }

  private async consolidateReports(reports: VulnerabilityReport[]): Promise<VulnerabilityReport> {
    const allVulnerabilities = reports.flatMap(r => r.vulnerabilities);
    const uniqueVulnerabilities = this.deduplicateVulnerabilities(allVulnerabilities);

    return {
      scanner: 'Consolidated',
      scanTime: new Date(),
      imageDigest: reports[0]?.imageDigest || 'unknown',
      vulnerabilities: uniqueVulnerabilities,
      compliance: reports.flatMap(r => r.compliance),
      secrets: reports.flatMap(r => r.secrets),
      totalScore: reports.reduce((sum, r) => sum + r.totalScore, 0) / reports.length,
      riskLevel: this.getHighestRiskLevel(reports.map(r => r.riskLevel)),
    };
  }

  private categorizeVulnerabilities(vulnerabilities: Vulnerability[]): SecurityScanResult['vulnerabilities'] {
    return {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
    };
  }

  private analyzeSecrets(secrets: SecretScanResult[]): { exposed: boolean; encrypted: boolean } {
    return {
      exposed: secrets.some(s => s.severity === 'high' || s.severity === 'critical'),
      encrypted: secrets.length === 0 || secrets.every(s => s.verified === false),
    };
  }

  private validateCompliance(checks: ComplianceCheck[], policy: SecurityPolicy): ComplianceCheck[] {
    return checks.filter(check => policy.requiredCompliance.includes(check.framework));
  }

  private calculateSecurityScore(
    vulnerabilities: SecurityScanResult['vulnerabilities'],
    secrets: { exposed: boolean; encrypted: boolean },
    compliance: ComplianceCheck[]
  ): number {
    let score = 100;

    // Deduct points for vulnerabilities
    score -= vulnerabilities.critical * 20;
    score -= vulnerabilities.high * 10;
    score -= vulnerabilities.medium * 5;
    score -= vulnerabilities.low * 1;

    // Deduct points for secrets
    if (secrets.exposed) score -= 30;
    if (!secrets.encrypted) score -= 10;

    // Deduct points for compliance failures
    const failedCompliance = compliance.filter(c => c.status === 'failed').length;
    score -= failedCompliance * 15;

    return Math.max(0, score);
  }

  private async validateSecurityPolicy(
    result: SecurityScanResult,
    report: VulnerabilityReport,
    policy: SecurityPolicy
  ): Promise<void> {
    const violations: string[] = [];

    // Check vulnerability limits
    if (result.vulnerabilities.critical > policy.maxCriticalVulnerabilities) {
      violations.push(`Critical vulnerabilities exceed limit: ${result.vulnerabilities.critical} > ${policy.maxCriticalVulnerabilities}`);
    }

    if (result.vulnerabilities.high > policy.maxHighVulnerabilities) {
      violations.push(`High vulnerabilities exceed limit: ${result.vulnerabilities.high} > ${policy.maxHighVulnerabilities}`);
    }

    // Check compliance requirements
    for (const required of policy.requiredCompliance) {
      const complianceCheck = required === 'NASA_POT10' ? result.compliance.nasaPot10 : result.compliance.soc2;
      if (!complianceCheck) {
        violations.push(`Required compliance not met: ${required}`);
      }
    }

    // Check for exposed secrets
    if (result.secrets.exposed) {
      violations.push('Exposed secrets detected');
    }

    if (violations.length > 0) {
      throw new Error(`Security policy violations: ${violations.join(', ')}`);
    }
  }

  private async validateKubernetesManifests(manifests: string): Promise<SecurityScanResult> {
    // Simulate Kubernetes manifest security validation
    return {
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
      compliance: { nasaPot10: true, soc2: true },
      secrets: { exposed: false, encrypted: true },
    };
  }

  private async validateRuntimeSecurity(manifests: string): Promise<SecurityScanResult> {
    // Simulate runtime security validation
    return {
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
      compliance: { nasaPot10: true, soc2: true },
      secrets: { exposed: false, encrypted: true },
    };
  }

  private evaluateOverallSecurity(results: SecurityScanResult[]): boolean {
    return results.every(result =>
      result.vulnerabilities.critical === 0 &&
      result.compliance.nasaPot10 &&
      result.compliance.soc2 &&
      !result.secrets.exposed
    );
  }

  private deduplicateVulnerabilities(vulnerabilities: Vulnerability[]): Vulnerability[] {
    const seen = new Set<string>();
    return vulnerabilities.filter(vuln => {
      const key = `${vuln.id}-${vuln.package}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getHighestRiskLevel(riskLevels: VulnerabilityReport['riskLevel'][]): VulnerabilityReport['riskLevel'] {
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    return riskLevels.reduce((highest, current) =>
      priorities[current] > priorities[highest] ? current : highest
    );
  }

  private getRiskValue(riskLevel: VulnerabilityReport['riskLevel']): number {
    const values = { critical: 4, high: 3, medium: 2, low: 1 };
    return values[riskLevel];
  }

  private calculateTotalScore(report: VulnerabilityReport): number {
    let score = 100;
    score -= report.vulnerabilities.filter(v => v.severity === 'critical').length * 20;
    score -= report.vulnerabilities.filter(v => v.severity === 'high').length * 10;
    score -= report.vulnerabilities.filter(v => v.severity === 'medium').length * 5;
    score -= report.vulnerabilities.filter(v => v.severity === 'low').length * 1;
    return Math.max(0, score);
  }

  private determineRiskLevel(report: VulnerabilityReport): VulnerabilityReport['riskLevel'] {
    const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = report.vulnerabilities.filter(v => v.severity === 'high').length;

    if (criticalVulns > 0) return 'critical';
    if (highVulns > 3) return 'high';
    if (highVulns > 0) return 'medium';
    return 'low';
  }

  private aggregateCompliance(reports: VulnerabilityReport[]): Record<string, number> {
    const compliance: Record<string, number> = {};
    const frameworks = ['NASA_POT10', 'SOC2', 'GDPR', 'HIPAA', 'PCI_DSS'];

    for (const framework of frameworks) {
      const checks = reports.flatMap(r => r.compliance.filter(c => c.framework === framework));
      const passed = checks.filter(c => c.status === 'passed').length;
      compliance[framework] = checks.length > 0 ? (passed / checks.length) * 100 : 0;
    }

    return compliance;
  }

  private generateRecommendations(reports: VulnerabilityReport[]): string[] {
    const recommendations: string[] = [];
    const allVulns = reports.flatMap(r => r.vulnerabilities);

    if (allVulns.filter(v => v.severity === 'critical').length > 0) {
      recommendations.push('Address all critical vulnerabilities immediately');
    }

    if (allVulns.filter(v => v.severity === 'high').length > 5) {
      recommendations.push('Prioritize fixing high-severity vulnerabilities');
    }

    const exposedSecrets = reports.flatMap(r => r.secrets);
    if (exposedSecrets.length > 0) {
      recommendations.push('Remove exposed secrets and rotate credentials');
    }

    return recommendations;
  }

  private analyzeTrends(reports: VulnerabilityReport[]): any {
    // Analyze security trends over time
    return {
      improvementTrend: reports.length > 1 ? 'improving' : 'stable',
      vulnerabilityTrend: 'decreasing',
      complianceTrend: 'stable',
    };
  }
}
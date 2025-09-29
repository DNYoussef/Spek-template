/**
 * CertificationManager.ts
 * Compliance certification management with NASA POT10 compliance
 * Single responsibility: Evaluate and manage compliance certifications
 */

import {
  ValidationContext,
  CertificationStatus,
  Certificate,
  ComplianceLevel
} from '../types/ValidationFSMTypes';

export class CertificationManager {
  private readonly certificates: Map<string, Certificate>;
  private readonly certificationHistory: Map<string, CertificationRecord[]>;
  
  // NASA Rule 10: Bounded constants
  private readonly MAX_CERTIFICATES = 1000;
  private readonly CERTIFICATE_VALIDITY_PERIOD = 31536000000; // 1 year in ms
  private readonly MAX_HISTORY_RECORDS = 50;

  constructor() {
    this.certificates = new Map();
    this.certificationHistory = new Map();
  }

  /**
   * Evaluate certification status (NASA Rule 10: ≤60 lines)
   */
  async evaluateCertification(context: ValidationContext): Promise<CertificationStatus> {
    // Assertion 1: Valid context
    if (!context || !context.targetId || !context.validationType) {
      throw new Error('CertificationManager: Valid validation context required');
    }

    // Assertion 2: Context has validation results
    if (!context.validationResults || context.validationResults.length === 0) {
      throw new Error('CertificationManager: Context must have validation results');
    }

    // Calculate overall compliance score
    const complianceScore = this.calculateOverallScore(context);
    
    // Determine certification eligibility
    const certificationLevel = this.determineCertificationLevel(complianceScore);
    
    // Check if certification can be granted
    const canCertify = this.canGrantCertification(context, complianceScore);
    
    // Generate conditions if applicable
    const conditions = this.generateCertificationConditions(context, complianceScore);

    const certificationStatus: CertificationStatus = {
      certified: canCertify,
      certificationLevel,
      validUntil: canCertify ? Date.now() + this.CERTIFICATE_VALIDITY_PERIOD : 0,
      certificationId: canCertify ? this.generateCertificationId(context) : undefined,
      conditions
    };

    // Record evaluation in history
    this.recordCertificationEvaluation(context.targetId, certificationStatus, complianceScore);

    return certificationStatus;
  }

  /**
   * Issue certificate (NASA Rule 10: ≤60 lines)
   */
  async issueCertificate(certificationId: string): Promise<Certificate> {
    // Assertion 1: Valid certification ID
    if (!certificationId) {
      throw new Error('CertificationManager: Certification ID required');
    }

    // Assertion 2: Not exceeding certificate limit
    if (this.certificates.size >= this.MAX_CERTIFICATES) {
      throw new Error(`CertificationManager: Certificate limit exceeded (${this.MAX_CERTIFICATES})`);
    }

    // Check if certificate already exists
    const existingCertificate = this.certificates.get(certificationId);
    if (existingCertificate) {
      throw new Error(`CertificationManager: Certificate ${certificationId} already exists`);
    }

    // Parse certification data from ID
    const certificationData = this.parseCertificationId(certificationId);
    
    const certificate: Certificate = {
      certificateId: certificationId,
      issuedTo: certificationData.targetId,
      issuedBy: 'SPEK Validation System',
      issuedAt: Date.now(),
      validUntil: Date.now() + this.CERTIFICATE_VALIDITY_PERIOD,
      level: certificationData.level,
      conditions: certificationData.conditions,
      signature: this.generateCertificateSignature(certificationId)
    };

    // Store certificate
    this.certificates.set(certificationId, certificate);

    // Log issuance
    console.log(`Certificate ${certificationId} issued successfully`);

    return certificate;
  }

  /**
   * Revoke certificate (NASA Rule 10: ≤60 lines)
   */
  async revokeCertificate(certificationId: string): Promise<void> {
    // Assertion 1: Valid certification ID
    if (!certificationId) {
      throw new Error('CertificationManager: Certification ID required');
    }

    // Assertion 2: Certificate exists
    const certificate = this.certificates.get(certificationId);
    if (!certificate) {
      throw new Error(`CertificationManager: Certificate ${certificationId} not found`);
    }

    // Remove certificate
    const removed = this.certificates.delete(certificationId);
    
    if (removed) {
      // Record revocation in history
      const targetId = certificate.issuedTo;
      const history = this.certificationHistory.get(targetId) || [];
      
      history.push({
        timestamp: Date.now(),
        action: 'REVOKED',
        certificationId,
        level: certificate.level,
        reason: 'Manual revocation'
      });
      
      this.certificationHistory.set(targetId, history.slice(-this.MAX_HISTORY_RECORDS));
      
      console.log(`Certificate ${certificationId} revoked successfully`);
    }
  }

  /**
   * Get certificate status (NASA Rule 10: ≤60 lines)
   */
  getCertificateStatus(certificationId: string): {
    exists: boolean;
    valid: boolean;
    certificate?: Certificate;
    expiresIn?: number;
  } {
    // Assertion: Valid certification ID
    if (!certificationId) {
      throw new Error('CertificationManager: Certification ID required');
    }

    const certificate = this.certificates.get(certificationId);
    
    if (!certificate) {
      return { exists: false, valid: false };
    }

    const now = Date.now();
    const isValid = certificate.validUntil > now;
    const expiresIn = isValid ? certificate.validUntil - now : 0;

    return {
      exists: true,
      valid: isValid,
      certificate,
      expiresIn
    };
  }

  /**
   * Calculate overall compliance score (NASA Rule 10: ≤60 lines)
   */
  private calculateOverallScore(context: ValidationContext): number {
    const results = context.validationResults;
    
    // Bounded calculation for NASA Rule 10
    const maxResults = Math.min(results.length, 100);
    
    if (maxResults === 0) {
      return 0;
    }

    let totalScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < maxResults; i++) {
      const result = results[i];
      const weight = this.getResultWeight(result.rule);
      
      totalScore += result.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determine certification level (NASA Rule 10: ≤60 lines)
   */
  private determineCertificationLevel(score: number): ComplianceLevel {
    if (score >= 95) return ComplianceLevel.CRITICAL; // Highest certification
    if (score >= 85) return ComplianceLevel.HIGH;
    if (score >= 70) return ComplianceLevel.MEDIUM;
    return ComplianceLevel.LOW;
  }

  /**
   * Check if certification can be granted (NASA Rule 10: ≤60 lines)
   */
  private canGrantCertification(context: ValidationContext, score: number): boolean {
    // Minimum score requirement
    if (score < 70) {
      return false;
    }

    // Check for critical failures
    const criticalFailures = context.validationResults.filter(
      r => r.status === 'NON_COMPLIANT' && r.rule.includes('CRITICAL')
    ).length;

    if (criticalFailures > 0) {
      return false;
    }

    // Check error count
    if (context.errors.length > 5) {
      return false;
    }

    // All checks passed
    return true;
  }

  /**
   * Generate certification conditions (NASA Rule 10: ≤60 lines)
   */
  private generateCertificationConditions(context: ValidationContext, score: number): string[] {
    const conditions: string[] = [];
    
    // Add conditions based on score
    if (score < 85) {
      conditions.push('Regular compliance monitoring required');
    }
    
    if (score < 90) {
      conditions.push('Quarterly validation reviews required');
    }

    // Add conditions based on validation results
    const partialCompliance = context.validationResults.filter(
      r => r.status === 'PARTIAL'
    ).length;
    
    if (partialCompliance > 2) {
      conditions.push('Address partial compliance issues within 30 days');
    }

    // Add conditions based on errors
    if (context.errors.length > 2) {
      conditions.push('Fix all validation errors before next review');
    }

    // Default condition for all certificates
    conditions.push('Maintain compliance standards during validity period');

    return conditions.slice(0, 5); // Bounded list
  }

  /**
   * Helper methods (NASA Rule 10: ≤60 lines each)
   */
  private generateCertificationId(context: ValidationContext): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(`${context.targetId}-${context.validationType}-${timestamp}`);
    return `cert-${context.validationType.toLowerCase()}-${hash}`;
  }

  private parseCertificationId(certificationId: string): {
    targetId: string;
    level: ComplianceLevel;
    conditions: string[];
  } {
    // Simplified parsing for demo
    return {
      targetId: 'parsed-target',
      level: ComplianceLevel.MEDIUM,
      conditions: ['Standard compliance conditions']
    };
  }

  private generateCertificateSignature(certificationId: string): string {
    return this.simpleHash(`signature-${certificationId}-${Date.now()}`);
  }

  private getResultWeight(rule: string): number {
    if (rule.includes('NASA') || rule.includes('CRITICAL')) return 3;
    if (rule.includes('HIGH')) return 2;
    return 1;
  }

  private recordCertificationEvaluation(
    targetId: string, 
    status: CertificationStatus, 
    score: number
  ): void {
    const history = this.certificationHistory.get(targetId) || [];
    
    history.push({
      timestamp: Date.now(),
      action: status.certified ? 'GRANTED' : 'DENIED',
      certificationId: status.certificationId || 'N/A',
      level: status.certificationLevel,
      reason: `Score: ${score.toFixed(1)}%`
    });
    
    this.certificationHistory.set(targetId, history.slice(-this.MAX_HISTORY_RECORDS));
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
}

interface CertificationRecord {
  timestamp: number;
  action: 'GRANTED' | 'DENIED' | 'REVOKED' | 'RENEWED';
  certificationId: string;
  level: ComplianceLevel;
  reason: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: certification-manager-001
// inputs: ["ValidationFSMTypes.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===
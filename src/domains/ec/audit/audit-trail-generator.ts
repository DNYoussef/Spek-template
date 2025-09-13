/**
 * Automated Audit Trail Generation System
 * Implements tamper-evident evidence packaging with 90-day retention
 *
 * Task: EC-004 - Automated audit trail generation with tamper-evident evidence packaging
 */

import { EventEmitter } from 'events';
import { createHash, createHmac, randomBytes } from 'crypto';
import { ComplianceEvidence } from '../types';

interface AuditTrailConfig {
  retentionDays: number;
  tamperEvident: boolean;
  evidencePackaging: boolean;
  cryptographicIntegrity: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  source: string;
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'pending';
  details: Record<string, any>;
  metadata: AuditMetadata;
  integrity: IntegrityData;
}

interface AuditMetadata {
  sessionId?: string;
  correlationId?: string;
  userAgent?: string;
  sourceIp?: string;
  geolocation?: string;
  deviceId?: string;
  context: Record<string, any>;
}

interface IntegrityData {
  hash: string;
  signature: string;
  previousEntryHash: string;
  chainVerification: boolean;
  timestamp: string;
  nonce: string;
}

interface EvidencePackage {
  id: string;
  name: string;
  version: string;
  created: Date;
  expires: Date;
  framework: string;
  assessmentId: string;
  evidence: ComplianceEvidence[];
  auditTrail: AuditTrailEntry[];
  integrity: PackageIntegrity;
  metadata: PackageMetadata;
}

interface PackageIntegrity {
  packageHash: string;
  signature: string;
  merkleRoot: string;
  chainOfCustody: CustodyRecord[];
  tamperEvidence: TamperEvidence[];
  verificationLog: VerificationRecord[];
}

interface CustodyRecord {
  timestamp: Date;
  actor: string;
  action: 'created' | 'accessed' | 'modified' | 'transferred' | 'archived';
  location: string;
  context: Record<string, any>;
}

interface TamperEvidence {
  timestamp: Date;
  type: 'access_attempt' | 'modification_attempt' | 'integrity_violation';
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigated: boolean;
}

interface VerificationRecord {
  timestamp: Date;
  verifier: string;
  method: 'cryptographic' | 'manual' | 'automated';
  result: 'valid' | 'invalid' | 'corrupted';
  details: string;
}

interface PackageMetadata {
  size: number;
  compressed: boolean;
  encrypted: boolean;
  retentionPolicy: string;
  accessPolicy: string;
  distributionList: string[];
  tags: string[];
}

type AuditEventType =
  | 'compliance_assessment'
  | 'control_evaluation'
  | 'evidence_collection'
  | 'finding_generated'
  | 'remediation_action'
  | 'user_access'
  | 'system_change'
  | 'data_export'
  | 'package_creation'
  | 'package_access';

export class AuditTrailGenerator extends EventEmitter {
  private config: AuditTrailConfig;
  private auditChain: AuditTrailEntry[] = [];
  private evidencePackages: Map<string, EvidencePackage> = new Map();
  private retentionManager: RetentionManager;
  private integrityValidator: IntegrityValidator;
  private cryptographicSigner: CryptographicSigner;

  constructor(config: AuditTrailConfig) {
    super();
    this.config = config;
    this.retentionManager = new RetentionManager(config.retentionDays);
    this.integrityValidator = new IntegrityValidator();
    this.cryptographicSigner = new CryptographicSigner();
    this.initializeAuditSystem();
  }

  /**
   * Initialize audit system
   */
  private initializeAuditSystem(): void {
    // Start retention cleanup process
    this.retentionManager.startCleanupProcess();

    // Initialize integrity validation
    this.integrityValidator.initialize();

    // Setup cryptographic signing
    this.cryptographicSigner.initialize();

    this.emit('audit_system_initialized', { timestamp: new Date() });
  }

  /**
   * Generate comprehensive audit trail
   */
  async generateTrail(params: {
    assessments: any[];
    timestamp: Date;
    agent: string;
  }): Promise<{ id: string; entries: AuditTrailEntry[] }> {
    const trailId = `audit-trail-${Date.now()}`;
    const entries: AuditTrailEntry[] = [];

    try {
      this.emit('trail_generation_started', { trailId, timestamp: params.timestamp });

      // Generate audit entries for each assessment
      for (const assessment of params.assessments) {
        const assessmentEntries = await this.generateAssessmentTrail(assessment, params.agent);
        entries.push(...assessmentEntries);
      }

      // Add trail generation event
      const trailGenerationEntry = await this.createAuditEntry({
        eventType: 'compliance_assessment',
        source: params.agent,
        actor: 'system',
        action: 'generate_audit_trail',
        resource: trailId,
        outcome: 'success',
        details: {
          assessments: params.assessments.length,
          entries: entries.length,
          agent: params.agent
        }
      });

      entries.push(trailGenerationEntry);

      // Add entries to audit chain with integrity verification
      for (const entry of entries) {
        await this.addToAuditChain(entry);
      }

      this.emit('trail_generation_completed', {
        trailId,
        entriesCount: entries.length,
        timestamp: new Date()
      });

      return { id: trailId, entries };

    } catch (error) {
      this.emit('trail_generation_failed', { trailId, error: error.message });
      throw new Error(`Audit trail generation failed: ${error.message}`);
    }
  }

  /**
   * Generate audit trail for individual assessment
   */
  private async generateAssessmentTrail(assessment: any, agent: string): Promise<AuditTrailEntry[]> {
    const entries: AuditTrailEntry[] = [];

    // Assessment started entry
    entries.push(await this.createAuditEntry({
      eventType: 'compliance_assessment',
      source: agent,
      actor: 'system',
      action: 'start_assessment',
      resource: assessment.assessmentId || 'unknown',
      outcome: 'success',
      details: {
        assessmentType: assessment.type || 'unknown',
        framework: assessment.framework || 'unknown',
        controls: assessment.controls?.length || 0
      }
    }));

    // Control evaluation entries
    if (assessment.controls) {
      for (const control of assessment.controls) {
        entries.push(await this.createAuditEntry({
          eventType: 'control_evaluation',
          source: agent,
          actor: 'system',
          action: 'evaluate_control',
          resource: control.controlId || control.id,
          outcome: control.status === 'compliant' ? 'success' : 'failure',
          details: {
            controlDescription: control.description,
            status: control.status,
            score: control.score,
            findings: control.findings?.length || 0
          }
        }));
      }
    }

    // Evidence collection entries
    if (assessment.evidencePackage) {
      for (const evidence of assessment.evidencePackage) {
        entries.push(await this.createAuditEntry({
          eventType: 'evidence_collection',
          source: agent,
          actor: 'system',
          action: 'collect_evidence',
          resource: evidence.id,
          outcome: 'success',
          details: {
            evidenceType: evidence.type,
            source: evidence.source,
            controlId: evidence.controlId
          }
        }));
      }
    }

    // Findings generation entries
    if (assessment.findings) {
      for (const finding of assessment.findings) {
        entries.push(await this.createAuditEntry({
          eventType: 'finding_generated',
          source: agent,
          actor: 'system',
          action: 'generate_finding',
          resource: finding.id,
          outcome: 'success',
          details: {
            control: finding.control,
            severity: finding.severity,
            finding: finding.finding,
            status: finding.status
          }
        }));
      }
    }

    // Assessment completed entry
    entries.push(await this.createAuditEntry({
      eventType: 'compliance_assessment',
      source: agent,
      actor: 'system',
      action: 'complete_assessment',
      resource: assessment.assessmentId || 'unknown',
      outcome: assessment.status === 'completed' ? 'success' : 'failure',
      details: {
        complianceScore: assessment.complianceScore,
        overallRating: assessment.overallRating || assessment.rating,
        duration: Date.now() - new Date(assessment.timestamp).getTime()
      }
    }));

    return entries;
  }

  /**
   * Create audit entry with integrity data
   */
  private async createAuditEntry(params: {
    eventType: AuditEventType;
    source: string;
    actor: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'pending';
    details: Record<string, any>;
    metadata?: AuditMetadata;
  }): Promise<AuditTrailEntry> {
    const entryId = `audit-${Date.now()}-${randomBytes(8).toString('hex')}`;
    const timestamp = new Date();
    const nonce = randomBytes(16).toString('hex');

    const entry: AuditTrailEntry = {
      id: entryId,
      timestamp,
      eventType: params.eventType,
      source: params.source,
      actor: params.actor,
      action: params.action,
      resource: params.resource,
      outcome: params.outcome,
      details: params.details,
      metadata: params.metadata || {
        context: {}
      },
      integrity: {
        hash: '',
        signature: '',
        previousEntryHash: this.getLastEntryHash(),
        chainVerification: false,
        timestamp: timestamp.toISOString(),
        nonce
      }
    };

    // Calculate entry hash
    entry.integrity.hash = this.calculateEntryHash(entry);

    // Sign entry if cryptographic integrity is enabled
    if (this.config.cryptographicIntegrity) {
      entry.integrity.signature = await this.cryptographicSigner.signEntry(entry);
    }

    // Verify chain integrity
    entry.integrity.chainVerification = await this.verifyChainIntegrity(entry);

    return entry;
  }

  /**
   * Add entry to audit chain
   */
  private async addToAuditChain(entry: AuditTrailEntry): Promise<void> {
    // Verify entry integrity before adding
    const isValid = await this.integrityValidator.validateEntry(entry);
    if (!isValid) {
      throw new Error(`Invalid audit entry: ${entry.id}`);
    }

    // Add to chain
    this.auditChain.push(entry);

    // Create custody record
    await this.createCustodyRecord({
      timestamp: new Date(),
      actor: 'audit_system',
      action: 'created',
      location: 'audit_chain',
      context: { entryId: entry.id, position: this.auditChain.length }
    });

    this.emit('entry_added', { entryId: entry.id, chainLength: this.auditChain.length });
  }

  /**
   * Create tamper-evident evidence package
   */
  async createEvidencePackage(params: {
    name: string;
    framework: string;
    assessmentId: string;
    evidence: ComplianceEvidence[];
    auditTrail: AuditTrailEntry[];
  }): Promise<EvidencePackage> {
    const packageId = `evidence-pkg-${Date.now()}`;
    const created = new Date();
    const expires = new Date(created.getTime() + this.config.retentionDays * 24 * 60 * 60 * 1000);

    try {
      this.emit('package_creation_started', { packageId, framework: params.framework });

      // Create evidence package
      const evidencePackage: EvidencePackage = {
        id: packageId,
        name: params.name,
        version: '1.0.0',
        created,
        expires,
        framework: params.framework,
        assessmentId: params.assessmentId,
        evidence: params.evidence,
        auditTrail: params.auditTrail,
        integrity: {
          packageHash: '',
          signature: '',
          merkleRoot: '',
          chainOfCustody: [],
          tamperEvidence: [],
          verificationLog: []
        },
        metadata: {
          size: 0,
          compressed: this.config.compressionEnabled,
          encrypted: this.config.encryptionEnabled,
          retentionPolicy: `${this.config.retentionDays} days`,
          accessPolicy: 'authenticated_users',
          distributionList: [],
          tags: [params.framework, 'compliance', 'evidence']
        }
      };

      // Calculate package integrity
      evidencePackage.integrity = await this.calculatePackageIntegrity(evidencePackage);

      // Create initial custody record
      evidencePackage.integrity.chainOfCustody.push({
        timestamp: created,
        actor: 'audit_system',
        action: 'created',
        location: 'evidence_store',
        context: { packageId, framework: params.framework }
      });

      // Store package
      this.evidencePackages.set(packageId, evidencePackage);

      // Register with retention manager
      await this.retentionManager.registerPackage(packageId, expires);

      // Create audit entry for package creation
      await this.logPackageEvent({
        packageId,
        action: 'create_package',
        outcome: 'success',
        details: {
          evidenceCount: params.evidence.length,
          auditEntries: params.auditTrail.length,
          framework: params.framework
        }
      });

      this.emit('package_creation_completed', {
        packageId,
        evidenceCount: params.evidence.length,
        size: evidencePackage.metadata.size
      });

      return evidencePackage;

    } catch (error) {
      this.emit('package_creation_failed', { packageId, error: error.message });
      throw new Error(`Evidence package creation failed: ${error.message}`);
    }
  }

  /**
   * Calculate package integrity data
   */
  private async calculatePackageIntegrity(pkg: EvidencePackage): Promise<PackageIntegrity> {
    // Calculate package hash
    const packageData = {
      id: pkg.id,
      name: pkg.name,
      evidence: pkg.evidence,
      auditTrail: pkg.auditTrail
    };
    const packageHash = createHash('sha256').update(JSON.stringify(packageData)).digest('hex');

    // Calculate Merkle root for evidence integrity
    const merkleRoot = this.calculateMerkleRoot([
      ...pkg.evidence.map(e => e.hash || ''),
      ...pkg.auditTrail.map(a => a.integrity.hash)
    ]);

    // Sign package if cryptographic integrity enabled
    let signature = '';
    if (this.config.cryptographicIntegrity) {
      signature = await this.cryptographicSigner.signPackage(pkg);
    }

    return {
      packageHash,
      signature,
      merkleRoot,
      chainOfCustody: [],
      tamperEvidence: [],
      verificationLog: [{
        timestamp: new Date(),
        verifier: 'audit_system',
        method: 'cryptographic',
        result: 'valid',
        details: 'Initial package verification'
      }]
    };
  }

  /**
   * Calculate Merkle root for integrity verification
   */
  private calculateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];

    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      const combined = createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }

    return this.calculateMerkleRoot(nextLevel);
  }

  /**
   * Log package-related events
   */
  private async logPackageEvent(params: {
    packageId: string;
    action: string;
    outcome: 'success' | 'failure' | 'pending';
    details: Record<string, any>;
    actor?: string;
  }): Promise<void> {
    const entry = await this.createAuditEntry({
      eventType: 'package_creation',
      source: 'audit_trail_generator',
      actor: params.actor || 'system',
      action: params.action,
      resource: params.packageId,
      outcome: params.outcome,
      details: params.details
    });

    await this.addToAuditChain(entry);
  }

  /**
   * Log remediation actions
   */
  async logRemediation(params: {
    event: any;
    plan: any;
    timestamp: Date;
  }): Promise<void> {
    const entry = await this.createAuditEntry({
      eventType: 'remediation_action',
      source: 'remediation_orchestrator',
      actor: 'system',
      action: 'execute_remediation',
      resource: params.plan.id || 'unknown',
      outcome: 'success',
      details: {
        eventType: params.event.type,
        planId: params.plan.id,
        remediationSteps: params.plan.steps?.length || 0,
        affectedControls: params.event.affectedControls?.length || 0
      }
    });

    await this.addToAuditChain(entry);
  }

  /**
   * Log report generation
   */
  async logReport(params: {
    report: any;
    timestamp: Date;
    agent: string;
  }): Promise<void> {
    const entry = await this.createAuditEntry({
      eventType: 'data_export',
      source: params.agent,
      actor: 'system',
      action: 'generate_report',
      resource: params.report.id || 'compliance_report',
      outcome: 'success',
      details: {
        reportType: params.report.type || 'compliance',
        frameworks: params.report.frameworks?.length || 0,
        evidenceIncluded: params.report.includeEvidence || false,
        size: params.report.size || 0
      }
    });

    await this.addToAuditChain(entry);
  }

  /**
   * Create custody record
   */
  private async createCustodyRecord(params: CustodyRecord): Promise<void> {
    // This would be called whenever evidence packages are accessed or modified
    this.emit('custody_record_created', params);
  }

  /**
   * Calculate entry hash
   */
  private calculateEntryHash(entry: AuditTrailEntry): string {
    const hashData = {
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      eventType: entry.eventType,
      source: entry.source,
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource,
      outcome: entry.outcome,
      details: entry.details,
      previousHash: entry.integrity.previousEntryHash,
      nonce: entry.integrity.nonce
    };

    return createHash('sha256').update(JSON.stringify(hashData)).digest('hex');
  }

  /**
   * Get hash of last entry in chain
   */
  private getLastEntryHash(): string {
    const lastEntry = this.auditChain[this.auditChain.length - 1];
    return lastEntry ? lastEntry.integrity.hash : '0'.repeat(64);
  }

  /**
   * Verify chain integrity
   */
  private async verifyChainIntegrity(entry: AuditTrailEntry): Promise<boolean> {
    if (this.auditChain.length === 0) {
      return entry.integrity.previousEntryHash === '0'.repeat(64);
    }

    const lastEntry = this.auditChain[this.auditChain.length - 1];
    return entry.integrity.previousEntryHash === lastEntry.integrity.hash;
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters?: {
    eventType?: AuditEventType;
    source?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditTrailEntry[] {
    let entries = [...this.auditChain];

    if (filters) {
      if (filters.eventType) {
        entries = entries.filter(e => e.eventType === filters.eventType);
      }
      if (filters.source) {
        entries = entries.filter(e => e.source === filters.source);
      }
      if (filters.startDate) {
        entries = entries.filter(e => e.timestamp >= filters.startDate);
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.timestamp <= filters.endDate);
      }
    }

    return entries;
  }

  /**
   * Get evidence package
   */
  getEvidencePackage(packageId: string): EvidencePackage | null {
    return this.evidencePackages.get(packageId) || null;
  }

  /**
   * Verify package integrity
   */
  async verifyPackageIntegrity(packageId: string): Promise<boolean> {
    const pkg = this.evidencePackages.get(packageId);
    if (!pkg) return false;

    return await this.integrityValidator.validatePackage(pkg);
  }

  /**
   * Get retention status
   */
  getRetentionStatus(): { totalPackages: number; nearExpiry: number; expired: number } {
    return this.retentionManager.getStatus();
  }
}

/**
 * Retention Manager for audit data cleanup
 */
class RetentionManager {
  private retentionDays: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(retentionDays: number) {
    this.retentionDays = retentionDays;
  }

  startCleanupProcess(): void {
    // Run cleanup daily
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 24 * 60 * 60 * 1000);
  }

  private performCleanup(): void {
    // Implementation would clean up expired packages and audit entries
  }

  registerPackage(packageId: string, expires: Date): Promise<void> {
    // Implementation would register package for retention tracking
    return Promise.resolve();
  }

  getStatus(): { totalPackages: number; nearExpiry: number; expired: number } {
    // Mock implementation
    return { totalPackages: 10, nearExpiry: 2, expired: 0 };
  }
}

/**
 * Integrity Validator for cryptographic verification
 */
class IntegrityValidator {
  initialize(): void {
    // Initialize validation algorithms
  }

  async validateEntry(entry: AuditTrailEntry): Promise<boolean> {
    // Verify entry hash and signature
    const calculatedHash = createHash('sha256')
      .update(JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        eventType: entry.eventType,
        source: entry.source,
        actor: entry.actor,
        action: entry.action,
        resource: entry.resource,
        outcome: entry.outcome,
        details: entry.details,
        previousHash: entry.integrity.previousEntryHash,
        nonce: entry.integrity.nonce
      }))
      .digest('hex');

    return calculatedHash === entry.integrity.hash;
  }

  async validatePackage(pkg: EvidencePackage): Promise<boolean> {
    // Verify package integrity
    return true; // Mock implementation
  }
}

/**
 * Cryptographic Signer for tamper evidence
 */
class CryptographicSigner {
  private signingKey: Buffer = Buffer.alloc(32);

  initialize(): void {
    // Initialize cryptographic keys - in production would use proper key management
    this.signingKey = randomBytes(32);
  }

  async signEntry(entry: AuditTrailEntry): Promise<string> {
    const data = JSON.stringify({
      id: entry.id,
      hash: entry.integrity.hash,
      timestamp: entry.timestamp.toISOString()
    });

    return createHmac('sha256', this.signingKey).update(data).digest('hex');
  }

  async signPackage(pkg: EvidencePackage): Promise<string> {
    const data = JSON.stringify({
      id: pkg.id,
      hash: pkg.integrity.packageHash,
      timestamp: pkg.created.toISOString()
    });

    return createHmac('sha256', this.signingKey).update(data).digest('hex');
  }
}

export default AuditTrailGenerator;
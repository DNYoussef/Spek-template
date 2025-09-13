/**
 * Phase 3 Compliance Evidence System Integration
 * Integrates with existing Phase 3 compliance evidence infrastructure
 *
 * Task: EC-008 - Integration with Phase 3 compliance evidence system
 */

import { EventEmitter } from 'events';
import { ComplianceEvidence, ComplianceFramework, AuditEvent } from '../types';

interface Phase3IntegrationConfig {
  enabled: boolean;
  evidenceSystemEndpoint: string;
  auditTrailEndpoint: string;
  syncFrequency: number;
  retentionPolicy: string;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  batchSize: number;
  timeout: number;
  authentication: {
    type: 'api_key' | 'oauth' | 'certificate';
    credentials: Record<string, string>;
  };
  dataMapping: {
    evidenceMapping: Record<string, string>;
    auditMapping: Record<string, string>;
  };
}

interface EvidencePackageTransfer {
  packageId: string;
  sourceFramework: ComplianceFramework;
  evidenceCount: number;
  transferStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  checksum: string;
  encryptionKey?: string;
  metadata: {
    assessmentId: string;
    framework: string;
    retentionDate: Date;
    classification: string;
  };
}

interface SyncResult {
  syncId: string;
  timestamp: Date;
  operation: 'push' | 'pull' | 'bidirectional';
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: SyncError[];
  duration: number;
  nextSyncScheduled: Date;
}

interface SyncError {
  recordId: string;
  operation: string;
  error: string;
  retryable: boolean;
  timestamp: Date;
}

interface Phase3EvidenceRecord {
  id: string;
  type: string;
  framework: string;
  controlId: string;
  content: string | Buffer;
  metadata: {
    created: Date;
    source: string;
    classification: string;
    retentionDate: Date;
    tags: string[];
  };
  integrity: {
    hash: string;
    signature?: string;
    verified: boolean;
  };
  access: {
    viewers: string[];
    lastAccessed: Date;
    accessCount: number;
  };
}

interface Phase3AuditRecord {
  id: string;
  timestamp: Date;
  eventType: string;
  actor: string;
  action: string;
  resource: string;
  outcome: string;
  framework: string;
  details: Record<string, any>;
  sessionId?: string;
  correlationId?: string;
  integrity: {
    hash: string;
    previousHash: string;
    signature?: string;
  };
}

export class Phase3ComplianceIntegration extends EventEmitter {
  private config: Phase3IntegrationConfig;
  private syncScheduler: SyncScheduler;
  private evidenceMapper: EvidenceMapper;
  private auditMapper: AuditMapper;
  private encryptionService: EncryptionService;
  private compressionService: CompressionService;
  private transferQueue: Map<string, EvidencePackageTransfer> = new Map();
  private syncHistory: SyncResult[] = [];
  private isConnected: boolean = false;

  constructor(config: Phase3IntegrationConfig) {
    super();
    this.config = config;
    this.syncScheduler = new SyncScheduler(config.syncFrequency);
    this.evidenceMapper = new EvidenceMapper(config.dataMapping.evidenceMapping);
    this.auditMapper = new AuditMapper(config.dataMapping.auditMapping);
    this.encryptionService = new EncryptionService(config.encryptionEnabled);
    this.compressionService = new CompressionService(config.compressionEnabled);
    this.initializeIntegration();
  }

  /**
   * Initialize Phase 3 integration
   */
  private async initializeIntegration(): Promise<void> {
    try {
      if (!this.config.enabled) {
        this.emit('integration_disabled', { timestamp: new Date() });
        return;
      }

      // Test connectivity
      await this.testConnectivity();

      // Setup sync scheduler
      this.syncScheduler.on('sync_triggered', async (operation) => {
        await this.performSync(operation);
      });

      // Start sync scheduler
      await this.syncScheduler.start();

      this.isConnected = true;
      this.emit('integration_initialized', {
        timestamp: new Date(),
        endpoint: this.config.evidenceSystemEndpoint
      });

    } catch (error) {
      this.emit('integration_failed', { error: error.message });
      throw new Error(`Phase 3 integration initialization failed: ${error.message}`);
    }
  }

  /**
   * Test connectivity to Phase 3 systems
   */
  private async testConnectivity(): Promise<void> {
    try {
      // Test evidence system connectivity
      const evidenceResponse = await this.makeApiCall('GET', `${this.config.evidenceSystemEndpoint}/health`);
      if (evidenceResponse.status !== 'healthy') {
        throw new Error('Evidence system health check failed');
      }

      // Test audit trail connectivity
      const auditResponse = await this.makeApiCall('GET', `${this.config.auditTrailEndpoint}/health`);
      if (auditResponse.status !== 'healthy') {
        throw new Error('Audit trail system health check failed');
      }

      this.emit('connectivity_verified', { timestamp: new Date() });

    } catch (error) {
      throw new Error(`Connectivity test failed: ${error.message}`);
    }
  }

  /**
   * Transfer evidence package to Phase 3 system
   */
  async transferEvidencePackage(params: {
    packageId: string;
    framework: ComplianceFramework;
    evidence: ComplianceEvidence[];
    assessmentId: string;
    retentionDate: Date;
  }): Promise<EvidencePackageTransfer> {
    const transfer: EvidencePackageTransfer = {
      packageId: params.packageId,
      sourceFramework: params.framework,
      evidenceCount: params.evidence.length,
      transferStatus: 'pending',
      startTime: new Date(),
      checksum: '',
      metadata: {
        assessmentId: params.assessmentId,
        framework: params.framework,
        retentionDate: params.retentionDate,
        classification: 'internal'
      }
    };

    this.transferQueue.set(params.packageId, transfer);

    try {
      this.emit('evidence_transfer_started', {
        packageId: params.packageId,
        evidenceCount: params.evidence.length
      });

      transfer.transferStatus = 'in_progress';

      // Transform evidence to Phase 3 format
      const phase3Records = await this.transformEvidenceToPhase3Format(params.evidence, params.framework);

      // Compress if enabled
      let transferData = phase3Records;
      if (this.config.compressionEnabled) {
        transferData = await this.compressionService.compress(transferData);
      }

      // Encrypt if enabled
      let encryptionKey: string | undefined;
      if (this.config.encryptionEnabled) {
        const encryptionResult = await this.encryptionService.encrypt(transferData);
        transferData = encryptionResult.data;
        encryptionKey = encryptionResult.key;
        transfer.encryptionKey = encryptionKey;
      }

      // Calculate checksum
      transfer.checksum = this.calculateChecksum(transferData);

      // Transfer in batches
      const batchCount = Math.ceil(phase3Records.length / this.config.batchSize);
      let successfulBatches = 0;

      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * this.config.batchSize;
        const batchEnd = Math.min(batchStart + this.config.batchSize, phase3Records.length);
        const batch = phase3Records.slice(batchStart, batchEnd);

        try {
          await this.transferBatch(batch, params.packageId, i + 1, batchCount);
          successfulBatches++;
        } catch (batchError) {
          this.emit('batch_transfer_failed', {
            packageId: params.packageId,
            batchNumber: i + 1,
            error: batchError.message
          });
          // Continue with next batch
        }
      }

      // Complete transfer
      if (successfulBatches === batchCount) {
        transfer.transferStatus = 'completed';
        transfer.endTime = new Date();

        // Create transfer completion record in Phase 3
        await this.createTransferRecord(transfer);

        this.emit('evidence_transfer_completed', {
          packageId: params.packageId,
          duration: transfer.endTime.getTime() - transfer.startTime.getTime(),
          evidenceCount: params.evidence.length
        });
      } else {
        transfer.transferStatus = 'failed';
        transfer.endTime = new Date();

        this.emit('evidence_transfer_failed', {
          packageId: params.packageId,
          successfulBatches,
          totalBatches: batchCount
        });
      }

      return transfer;

    } catch (error) {
      transfer.transferStatus = 'failed';
      transfer.endTime = new Date();

      this.emit('evidence_transfer_failed', {
        packageId: params.packageId,
        error: error.message
      });

      throw new Error(`Evidence transfer failed: ${error.message}`);
    }
  }

  /**
   * Sync audit trail with Phase 3 system
   */
  async syncAuditTrail(auditEvents: AuditEvent[]): Promise<SyncResult> {
    const syncId = `audit-sync-${Date.now()}`;
    const startTime = Date.now();

    const syncResult: SyncResult = {
      syncId,
      timestamp: new Date(),
      operation: 'push',
      recordsProcessed: auditEvents.length,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      duration: 0,
      nextSyncScheduled: this.syncScheduler.getNextSync()
    };

    try {
      this.emit('audit_sync_started', { syncId, recordCount: auditEvents.length });

      // Transform audit events to Phase 3 format
      const phase3AuditRecords = await this.transformAuditToPhase3Format(auditEvents);

      // Sync in batches
      const batchCount = Math.ceil(phase3AuditRecords.length / this.config.batchSize);

      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * this.config.batchSize;
        const batchEnd = Math.min(batchStart + this.config.batchSize, phase3AuditRecords.length);
        const batch = phase3AuditRecords.slice(batchStart, batchEnd);

        try {
          await this.syncAuditBatch(batch, syncId, i + 1, batchCount);
          syncResult.recordsSuccessful += batch.length;
        } catch (batchError) {
          syncResult.recordsFailed += batch.length;
          syncResult.errors.push({
            recordId: `batch-${i + 1}`,
            operation: 'audit_sync',
            error: batchError.message,
            retryable: true,
            timestamp: new Date()
          });
        }
      }

      const endTime = Date.now();
      syncResult.duration = endTime - startTime;

      this.syncHistory.push(syncResult);

      this.emit('audit_sync_completed', {
        syncId,
        recordsProcessed: syncResult.recordsProcessed,
        recordsSuccessful: syncResult.recordsSuccessful,
        recordsFailed: syncResult.recordsFailed,
        duration: syncResult.duration
      });

      return syncResult;

    } catch (error) {
      syncResult.recordsFailed = syncResult.recordsProcessed;
      syncResult.duration = Date.now() - startTime;
      syncResult.errors.push({
        recordId: 'sync-operation',
        operation: 'audit_sync',
        error: error.message,
        retryable: true,
        timestamp: new Date()
      });

      this.syncHistory.push(syncResult);

      this.emit('audit_sync_failed', { syncId, error: error.message });

      throw new Error(`Audit trail sync failed: ${error.message}`);
    }
  }

  /**
   * Retrieve evidence from Phase 3 system
   */
  async retrieveEvidence(params: {
    framework: ComplianceFramework;
    controlId?: string;
    dateRange?: { start: Date; end: Date };
    evidenceTypes?: string[];
  }): Promise<ComplianceEvidence[]> {
    try {
      this.emit('evidence_retrieval_started', {
        framework: params.framework,
        filters: params
      });

      // Build query parameters
      const queryParams = this.buildEvidenceQuery(params);

      // Retrieve evidence from Phase 3
      const response = await this.makeApiCall('GET',
        `${this.config.evidenceSystemEndpoint}/evidence`,
        { params: queryParams }
      );

      // Transform Phase 3 records back to compliance evidence format
      const evidence = await this.transformPhase3ToEvidenceFormat(response.data);

      this.emit('evidence_retrieval_completed', {
        framework: params.framework,
        evidenceCount: evidence.length
      });

      return evidence;

    } catch (error) {
      this.emit('evidence_retrieval_failed', {
        framework: params.framework,
        error: error.message
      });

      throw new Error(`Evidence retrieval failed: ${error.message}`);
    }
  }

  /**
   * Perform scheduled sync operation
   */
  private async performSync(operation: string): Promise<void> {
    try {
      this.emit('scheduled_sync_started', { operation });

      switch (operation) {
        case 'evidence_sync':
          await this.performEvidenceSync();
          break;
        case 'audit_sync':
          await this.performAuditSync();
          break;
        case 'bidirectional_sync':
          await this.performBidirectionalSync();
          break;
        default:
          throw new Error(`Unknown sync operation: ${operation}`);
      }

      this.emit('scheduled_sync_completed', { operation });

    } catch (error) {
      this.emit('scheduled_sync_failed', { operation, error: error.message });
    }
  }

  /**
   * Transform evidence to Phase 3 format
   */
  private async transformEvidenceToPhase3Format(
    evidence: ComplianceEvidence[],
    framework: ComplianceFramework
  ): Promise<Phase3EvidenceRecord[]> {
    return evidence.map(item => this.evidenceMapper.toPhase3Format(item, framework));
  }

  /**
   * Transform audit events to Phase 3 format
   */
  private async transformAuditToPhase3Format(auditEvents: AuditEvent[]): Promise<Phase3AuditRecord[]> {
    return auditEvents.map(event => this.auditMapper.toPhase3Format(event));
  }

  /**
   * Transform Phase 3 records back to evidence format
   */
  private async transformPhase3ToEvidenceFormat(phase3Records: Phase3EvidenceRecord[]): Promise<ComplianceEvidence[]> {
    return phase3Records.map(record => this.evidenceMapper.fromPhase3Format(record));
  }

  /**
   * Transfer batch of evidence
   */
  private async transferBatch(
    batch: Phase3EvidenceRecord[],
    packageId: string,
    batchNumber: number,
    totalBatches: number
  ): Promise<void> {
    const response = await this.makeApiCall('POST',
      `${this.config.evidenceSystemEndpoint}/evidence/batch`,
      {
        data: {
          packageId,
          batchNumber,
          totalBatches,
          records: batch
        },
        timeout: this.config.timeout
      }
    );

    if (response.status !== 'success') {
      throw new Error(`Batch transfer failed: ${response.message}`);
    }
  }

  /**
   * Sync audit batch
   */
  private async syncAuditBatch(
    batch: Phase3AuditRecord[],
    syncId: string,
    batchNumber: number,
    totalBatches: number
  ): Promise<void> {
    const response = await this.makeApiCall('POST',
      `${this.config.auditTrailEndpoint}/audit/batch`,
      {
        data: {
          syncId,
          batchNumber,
          totalBatches,
          records: batch
        },
        timeout: this.config.timeout
      }
    );

    if (response.status !== 'success') {
      throw new Error(`Audit batch sync failed: ${response.message}`);
    }
  }

  /**
   * Create transfer completion record
   */
  private async createTransferRecord(transfer: EvidencePackageTransfer): Promise<void> {
    await this.makeApiCall('POST',
      `${this.config.evidenceSystemEndpoint}/transfers`,
      {
        data: {
          packageId: transfer.packageId,
          framework: transfer.sourceFramework,
          evidenceCount: transfer.evidenceCount,
          checksum: transfer.checksum,
          metadata: transfer.metadata,
          completedAt: transfer.endTime
        }
      }
    );
  }

  /**
   * Build evidence query parameters
   */
  private buildEvidenceQuery(params: any): Record<string, any> {
    const query: Record<string, any> = {
      framework: params.framework
    };

    if (params.controlId) {
      query.controlId = params.controlId;
    }

    if (params.dateRange) {
      query.startDate = params.dateRange.start.toISOString();
      query.endDate = params.dateRange.end.toISOString();
    }

    if (params.evidenceTypes && params.evidenceTypes.length > 0) {
      query.types = params.evidenceTypes.join(',');
    }

    return query;
  }

  /**
   * Perform evidence sync
   */
  private async performEvidenceSync(): Promise<void> {
    // Implementation would sync evidence data
  }

  /**
   * Perform audit sync
   */
  private async performAuditSync(): Promise<void> {
    // Implementation would sync audit data
  }

  /**
   * Perform bidirectional sync
   */
  private async performBidirectionalSync(): Promise<void> {
    // Implementation would perform bidirectional synchronization
  }

  /**
   * Make API call to Phase 3 systems
   */
  private async makeApiCall(method: string, url: string, options?: any): Promise<any> {
    // Mock API call implementation
    // In production, would use actual HTTP client with authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'success', data: options?.data || {} });
      }, 100);
    });
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    // Mock checksum calculation
    return `checksum-${Date.now()}`;
  }

  /**
   * Get transfer status
   */
  getTransferStatus(packageId: string): EvidencePackageTransfer | null {
    return this.transferQueue.get(packageId) || null;
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit?: number): SyncResult[] {
    return limit ? this.syncHistory.slice(-limit) : this.syncHistory;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from Phase 3 systems
   */
  async disconnect(): Promise<void> {
    if (this.syncScheduler) {
      await this.syncScheduler.stop();
    }

    this.isConnected = false;
    this.emit('integration_disconnected', { timestamp: new Date() });
  }
}

/**
 * Sync Scheduler for automated synchronization
 */
class SyncScheduler extends EventEmitter {
  private frequency: number;
  private scheduler: NodeJS.Timeout | null = null;
  private nextSync: Date = new Date();

  constructor(frequency: number) {
    super();
    this.frequency = frequency;
  }

  async start(): Promise<void> {
    this.scheduler = setInterval(() => {
      this.emit('sync_triggered', 'scheduled_sync');
      this.nextSync = new Date(Date.now() + this.frequency);
    }, this.frequency);
  }

  async stop(): Promise<void> {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  getNextSync(): Date {
    return this.nextSync;
  }
}

/**
 * Evidence Mapper for format transformation
 */
class EvidenceMapper {
  private mapping: Record<string, string>;

  constructor(mapping: Record<string, string>) {
    this.mapping = mapping;
  }

  toPhase3Format(evidence: ComplianceEvidence, framework: ComplianceFramework): Phase3EvidenceRecord {
    return {
      id: evidence.id,
      type: evidence.type,
      framework: framework,
      controlId: evidence.controlId || '',
      content: evidence.content,
      metadata: {
        created: evidence.timestamp,
        source: evidence.source,
        classification: evidence.classification || 'internal',
        retentionDate: evidence.retentionDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        tags: []
      },
      integrity: {
        hash: evidence.hash || '',
        verified: true
      },
      access: {
        viewers: [],
        lastAccessed: new Date(),
        accessCount: 0
      }
    };
  }

  fromPhase3Format(record: Phase3EvidenceRecord): ComplianceEvidence {
    return {
      id: record.id,
      type: record.type as any,
      source: record.metadata.source,
      content: record.content as string,
      timestamp: record.metadata.created,
      hash: record.integrity.hash,
      controlId: record.controlId,
      framework: record.framework,
      retentionDate: record.metadata.retentionDate,
      classification: record.metadata.classification as any
    };
  }
}

/**
 * Audit Mapper for audit event transformation
 */
class AuditMapper {
  private mapping: Record<string, string>;

  constructor(mapping: Record<string, string>) {
    this.mapping = mapping;
  }

  toPhase3Format(event: AuditEvent): Phase3AuditRecord {
    return {
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      actor: event.actor,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
      framework: event.details.framework || 'unknown',
      details: event.details,
      sessionId: event.sessionId,
      correlationId: event.correlationId,
      integrity: {
        hash: this.calculateEventHash(event),
        previousHash: '',
        signature: ''
      }
    };
  }

  private calculateEventHash(event: AuditEvent): string {
    // Mock hash calculation
    return `hash-${event.id}-${event.timestamp.getTime()}`;
  }
}

/**
 * Encryption Service for secure data transfer
 */
class EncryptionService {
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  async encrypt(data: any): Promise<{ data: any; key: string }> {
    if (!this.enabled) {
      return { data, key: '' };
    }

    // Mock encryption
    return {
      data: `encrypted:${JSON.stringify(data)}`,
      key: `key-${Date.now()}`
    };
  }

  async decrypt(encryptedData: any, key: string): Promise<any> {
    if (!this.enabled) {
      return encryptedData;
    }

    // Mock decryption
    if (typeof encryptedData === 'string' && encryptedData.startsWith('encrypted:')) {
      return JSON.parse(encryptedData.substring(10));
    }

    return encryptedData;
  }
}

/**
 * Compression Service for efficient data transfer
 */
class CompressionService {
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  async compress(data: any): Promise<any> {
    if (!this.enabled) {
      return data;
    }

    // Mock compression
    return `compressed:${JSON.stringify(data)}`;
  }

  async decompress(compressedData: any): Promise<any> {
    if (!this.enabled) {
      return compressedData;
    }

    // Mock decompression
    if (typeof compressedData === 'string' && compressedData.startsWith('compressed:')) {
      return JSON.parse(compressedData.substring(11));
    }

    return compressedData;
  }
}

export default Phase3ComplianceIntegration;
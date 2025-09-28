/**
 * Facade for SharedMemoryProtocol using decomposed utilities
 *
 * This replaces the 574-line god object with a lightweight facade
 * that orchestrates focused utility modules.
 */

import { EventEmitter } from 'events';
import MemoryCoordinator, { MemoryAllocationRequest, MemoryPriority, PrincessDomain } from '../coordinator/MemoryCoordinator';
import {
  AccessControlUtils,
  AccessValidationUtils,
  RateLimitUtils,
  IdGenerationUtils,
  SizeCalculationUtils,
  MemoryAccessPolicy,
  SharedMemoryEntry,
  RateLimitData
} from '../../utilities/memory';
import {
  MessageValidationUtils,
  QueueManagementUtils,
  CrossDomainMessage
} from '../../utilities/messaging';

export interface SharedMemoryRequest {
  requestId: string;
  fromDomain: PrincessDomain;
  toDomain: PrincessDomain;
  dataType: 'state' | 'configuration' | 'results' | 'coordination' | 'notification';
  size: number;
  priority: MemoryPriority;
  ttl?: number;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * Lightweight facade orchestrating decomposed utilities
 */
export class SharedMemoryProtocolFacade extends EventEmitter {
  private memoryCoordinator: MemoryCoordinator;
  private sharedEntries: Map<string, string> = new Map(); // entryId -> blockId
  private domainQueues: Map<PrincessDomain, CrossDomainMessage[]> = new Map();
  private accessPolicies: Map<PrincessDomain, MemoryAccessPolicy> = new Map();
  private rateLimitTracking: Map<string, RateLimitData> = new Map();

  private readonly DOMAIN = PrincessDomain.SHARED;
  private readonly DEFAULT_SHARED_TTL = 1800000; // 30 minutes
  private readonly MAX_MESSAGE_QUEUE_SIZE = 100;

  private messageProcessor: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.memoryCoordinator = MemoryCoordinator.getInstance();
    this.initializeDomainQueues();
    this.initializeDefaultPolicies();
    this.startTimers();
  }

  /**
   * Create shared memory entry using decomposed utilities
   */
  public async createSharedEntry(
    request: Omit<SharedMemoryRequest, 'requestId' | 'timestamp'>,
    data: any,
    permissions: SharedMemoryEntry['permissions']
  ): Promise<string | null> {
    const fullRequest: SharedMemoryRequest = {
      ...request,
      requestId: IdGenerationUtils.generateRequestId(),
      timestamp: new Date()
    };

    // Use decomposed validation
    const policy = AccessControlUtils.getDefaultPolicy(fullRequest.fromDomain);
    const validation = AccessValidationUtils.validateRequest(fullRequest, policy);
    if (!validation.valid) {
      this.emit('shared-entry-rejected', { request: fullRequest, reason: validation.reason });
      return null;
    }

    // Use decomposed rate limiting
    const rateLimitData = this.rateLimitTracking.get(fullRequest.fromDomain) || { requests: [], dataTransfer: [] };
    if (!RateLimitUtils.checkRateLimit(fullRequest.fromDomain, request.size, policy, rateLimitData)) {
      this.emit('rate-limit-exceeded', { domain: fullRequest.fromDomain, request: fullRequest });
      return null;
    }

    // Use decomposed size calculation
    const size = SizeCalculationUtils.calculateSize({ request: fullRequest, data, permissions });
    const ttl = request.ttl || this.getDefaultTTL(fullRequest.fromDomain, request.dataType);

    const memoryRequest: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority: request.priority,
      ttl,
      allowCompression: true,
      metadata: {
        type: 'shared-memory-entry',
        fromDomain: fullRequest.fromDomain,
        toDomain: fullRequest.toDomain,
        dataType: request.dataType
      }
    };

    const blockId = await this.memoryCoordinator.allocateMemory(memoryRequest);
    if (!blockId) {
      this.emit('shared-allocation-failed', { request: fullRequest });
      return null;
    }

    const entry: SharedMemoryEntry = {
      id: blockId,
      request: fullRequest,
      data,
      status: 'active',
      permissions,
      accessLog: [{
        domain: fullRequest.fromDomain,
        operation: 'create',
        timestamp: new Date(),
        success: true
      }],
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl) : undefined
    };

    const stored = await this.memoryCoordinator.storeData(blockId, entry);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      return null;
    }

    this.sharedEntries.set(fullRequest.requestId, blockId);
    RateLimitUtils.updateRateLimit(fullRequest.fromDomain, request.size, rateLimitData);
    this.rateLimitTracking.set(fullRequest.fromDomain, rateLimitData);

    this.emit('shared-entry-created', { entryId: fullRequest.requestId, blockId, request: fullRequest });
    return fullRequest.requestId;
  }

  /**
   * Access shared memory entry using decomposed validation
   */
  public async accessSharedEntry(
    entryId: string,
    accessingDomain: PrincessDomain,
    operation: 'read' | 'write'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const blockId = this.sharedEntries.get(entryId);
    if (!blockId) {
      return { success: false, error: 'Entry not found' };
    }

    const entry = await this.getSharedEntry(blockId);
    if (!entry) {
      return { success: false, error: 'Entry data not available' };
    }

    // Use decomposed access validation
    const accessResult = AccessValidationUtils.canAccessEntry(entry, accessingDomain, operation);
    if (!accessResult.success) {
      AccessControlUtils.logAccess(entry, accessingDomain, operation, false);
      return accessResult;
    }

    // Update access information
    entry.lastAccessedAt = new Date();
    AccessControlUtils.logAccess(entry, accessingDomain, operation, true);

    await this.memoryCoordinator.storeData(blockId, entry);
    this.emit('shared-entry-accessed', { entryId, accessingDomain, operation });

    return { success: true, data: entry.data };
  }

  /**
   * Send cross-domain message using decomposed utilities
   */
  public async sendMessage(message: Omit<CrossDomainMessage, 'messageId' | 'timestamp'>): Promise<string | null> {
    const fullMessage: CrossDomainMessage = {
      ...message,
      messageId: IdGenerationUtils.generateMessageId(),
      timestamp: new Date()
    };

    // Use decomposed message validation
    if (!MessageValidationUtils.validateMessage(fullMessage)) {
      this.emit('message-rejected', { message: fullMessage, reason: 'validation-failed' });
      return null;
    }

    const targetQueue = this.domainQueues.get(fullMessage.toDomain);
    if (!targetQueue) {
      return null;
    }

    // Use decomposed queue management
    if (targetQueue.length >= this.MAX_MESSAGE_QUEUE_SIZE) {
      const { updatedQueue } = QueueManagementUtils.cleanupQueue(targetQueue, this.MAX_MESSAGE_QUEUE_SIZE - 1);
      this.domainQueues.set(fullMessage.toDomain, updatedQueue);
    }

    const insertIndex = QueueManagementUtils.findInsertIndex(targetQueue, fullMessage);
    targetQueue.splice(insertIndex, 0, fullMessage);

    this.emit('message-queued', { messageId: fullMessage.messageId, toDomain: fullMessage.toDomain });
    return fullMessage.messageId;
  }

  /**
   * Receive messages for a domain
   */
  public receiveMessages(domain: PrincessDomain, maxMessages: number = 10): CrossDomainMessage[] {
    const queue = this.domainQueues.get(domain);
    if (!queue || queue.length === 0) {
      return [];
    }

    const messages = queue.splice(0, maxMessages);
    this.emit('messages-received', { domain, count: messages.length });
    return messages;
  }

  /**
   * Get shared memory statistics using decomposed utilities
   */
  public getStatistics() {
    const stats = {
      totalSharedEntries: this.sharedEntries.size,
      activeEntries: 0,
      expiredEntries: 0,
      domainUsage: {} as Record<PrincessDomain, { entries: number; memoryUsed: number }>,
      messageQueueSizes: {} as Record<PrincessDomain, number>,
      rateLimitStatus: {} as Record<PrincessDomain, { requests: number; dataTransfer: number }>
    };

    // Initialize domain usage
    for (const domain of Object.values(PrincessDomain)) {
      stats.domainUsage[domain] = { entries: 0, memoryUsed: 0 };
      stats.messageQueueSizes[domain] = this.domainQueues.get(domain)?.length || 0;

      const rateLimitData = this.rateLimitTracking.get(domain);
      stats.rateLimitStatus[domain] = RateLimitUtils.getRateLimitStatus(domain, rateLimitData);
    }

    return stats;
  }

  private async getSharedEntry(blockId: string): Promise<SharedMemoryEntry | null> {
    const data = await this.memoryCoordinator.retrieveData(blockId);
    return data as SharedMemoryEntry | null;
  }

  private initializeDomainQueues(): void {
    for (const domain of Object.values(PrincessDomain)) {
      this.domainQueues.set(domain, []);
    }
  }

  private initializeDefaultPolicies(): void {
    for (const domain of Object.values(PrincessDomain)) {
      const policy = AccessControlUtils.getDefaultPolicy(domain);
      if (policy) {
        this.accessPolicies.set(domain, policy);
      }
    }
  }

  private getDefaultTTL(domain: PrincessDomain, dataType: string): number {
    const policy = this.accessPolicies.get(domain);
    return policy?.retentionPolicies[dataType] || this.DEFAULT_SHARED_TTL;
  }

  private startTimers(): void {
    this.messageProcessor = setInterval(() => {
      this.processExpiredMessages();
    }, 30000);

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000);
  }

  private processExpiredMessages(): void {
    for (const [domain, queue] of this.domainQueues) {
      const { validMessages, expiredCount } = QueueManagementUtils.removeExpiredMessages(queue);
      if (expiredCount > 0) {
        this.domainQueues.set(domain, validMessages);
        this.emit('messages-expired', { domain, count: expiredCount });
      }
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const expiredEntries = [];

    for (const [entryId, blockId] of this.sharedEntries) {
      const entry = await this.getSharedEntry(blockId);
      if (!entry || AccessValidationUtils.isEntryExpired(entry)) {
        expiredEntries.push(entryId);
      }
    }

    for (const entryId of expiredEntries) {
      this.sharedEntries.delete(entryId);
      this.emit('shared-entry-expired', { entryId });
    }
  }

  /**
   * Shutdown with cleanup
   */
  public shutdown(): void {
    if (this.messageProcessor) {
      clearInterval(this.messageProcessor);
      this.messageProcessor = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.sharedEntries.clear();
    this.domainQueues.clear();
    this.accessPolicies.clear();
    this.rateLimitTracking.clear();
    this.emit('shutdown');
  }
}

export default SharedMemoryProtocolFacade;
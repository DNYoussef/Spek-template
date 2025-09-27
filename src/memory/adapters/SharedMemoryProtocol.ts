import { EventEmitter } from 'events';
import MemoryCoordinator, { MemoryAllocationRequest, MemoryPriority, PrincessDomain } from '../coordinator/MemoryCoordinator';
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
export interface SharedMemoryEntry {
  id: string;
  request: SharedMemoryRequest;
  data: any;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  permissions: {
    read: PrincessDomain[];
    write: PrincessDomain[];
    admin: PrincessDomain[];
  };
  accessLog: Array<{
    domain: PrincessDomain;
    operation: 'read' | 'write' | 'create' | 'delete';
    timestamp: Date;
    success: boolean;
  }>;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
}
export interface CrossDomainMessage {
  messageId: string;
  fromDomain: PrincessDomain;
  toDomain: PrincessDomain;
  messageType: 'request' | 'response' | 'notification' | 'coordination';
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresAcknowledgment: boolean;
  timestamp: Date;
  expiresAt?: Date;
}
export interface MemoryAccessPolicy {
  domain: PrincessDomain;
  maxSharedMemory: number;
  allowedDataTypes: string[];
  defaultPermissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    dataTransferPerMinute: number;
  };
  retentionPolicies: Record<string, number>; // dataType -> TTL
}
/**
 * Shared Memory Protocol for Cross-Princess Communication
 * Provides safe memory sharing and communication between Princess domains
 * with access control, rate limiting, and audit logging.
 */
export class SharedMemoryProtocol extends EventEmitter {
  private memoryCoordinator: MemoryCoordinator;
  private sharedEntries: Map<string, string> = new Map(); // entryId -> blockId
  private domainQueues: Map<PrincessDomain, CrossDomainMessage[]> = new Map();
  private accessPolicies: Map<PrincessDomain, MemoryAccessPolicy> = new Map();
  private rateLimitTracking: Map<string, { requests: number[]; dataTransfer: number[]; }> = new Map();
  private readonly DOMAIN = PrincessDomain.SHARED;
  private readonly DEFAULT_SHARED_TTL = 1800000; // 30 minutes
  private readonly MAX_MESSAGE_QUEUE_SIZE = 100;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private messageProcessor: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  constructor() {
    super();
    this.memoryCoordinator = MemoryCoordinator.getInstance();
    this.initializeDomainQueues();
    this.initializeDefaultPolicies();
    this.startMessageProcessor();
    this.startCleanupTimer();
  }
  private initializeDomainQueues(): void {
    for (const domain of Object.values(PrincessDomain)) {
      this.domainQueues.set(domain, []);
    }
  }
  private initializeDefaultPolicies(): void {
    // Infrastructure Princess Policy
    this.accessPolicies.set(PrincessDomain.INFRASTRUCTURE, {
      domain: PrincessDomain.INFRASTRUCTURE,
      maxSharedMemory: 2 * 1024 * 1024, // 2MB
      allowedDataTypes: ['state', 'configuration', 'results', 'coordination'],
      defaultPermissions: { read: true, write: true, admin: false },
      rateLimits: { requestsPerMinute: 120, dataTransferPerMinute: 10 * 1024 * 1024 }, // 10MB/min
      retentionPolicies: {
        'state': 600000, // 10 minutes
        'configuration': 3600000, // 1 hour
        'results': 1800000, // 30 minutes
        'coordination': 300000 // 5 minutes
      }
    });
    // Research Princess Policy
    this.accessPolicies.set(PrincessDomain.RESEARCH, {
      domain: PrincessDomain.RESEARCH,
      maxSharedMemory: 2 * 1024 * 1024, // 2MB
      allowedDataTypes: ['results', 'coordination', 'notification'],
      defaultPermissions: { read: true, write: false, admin: false },
      rateLimits: { requestsPerMinute: 60, dataTransferPerMinute: 5 * 1024 * 1024 }, // 5MB/min
      retentionPolicies: {
        'results': 7200000, // 2 hours
        'coordination': 1800000, // 30 minutes
        'notification': 300000 // 5 minutes
      }
    });
    // System Domain Policy (most restrictive)
    this.accessPolicies.set(PrincessDomain.SYSTEM, {
      domain: PrincessDomain.SYSTEM,
      maxSharedMemory: 512 * 1024, // 512KB
      allowedDataTypes: ['coordination', 'notification'],
      defaultPermissions: { read: true, write: false, admin: true },
      rateLimits: { requestsPerMinute: 30, dataTransferPerMinute: 1024 * 1024 }, // 1MB/min
      retentionPolicies: {
        'coordination': 600000, // 10 minutes
        'notification': 60000 // 1 minute
      }
    });
  }
  /**
   * Create shared memory entry accessible by multiple domains
   */
  public async createSharedEntry(
    request: Omit<SharedMemoryRequest, 'requestId' | 'timestamp'>,
    data: any,
    permissions: SharedMemoryEntry['permissions']
  ): Promise<string | null> {
    const fullRequest: SharedMemoryRequest = {
      ...request,
      requestId: this.generateRequestId(),
      timestamp: new Date()
    };
    // Validate request against domain policy
    const validation = this.validateRequest(fullRequest);
    if (!validation.valid) {
      this.emit('shared-entry-rejected', { request: fullRequest, reason: validation.reason });
      return null;
    }
    // Check rate limits
    if (!this.checkRateLimit(fullRequest.fromDomain, request.size)) {
      this.emit('rate-limit-exceeded', { domain: fullRequest.fromDomain, request: fullRequest });
      return null;
    }
    const size = this.calculateSize({ request: fullRequest, data, permissions });
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
    this.updateRateLimit(fullRequest.fromDomain, request.size);
    this.emit('shared-entry-created', { entryId: fullRequest.requestId, blockId, request: fullRequest });
    return fullRequest.requestId;
  }
  /**
   * Access shared memory entry with permission validation
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
    // Check permissions
    const hasPermission = operation === 'read' ?
      entry.permissions.read.includes(accessingDomain) :
      entry.permissions.write.includes(accessingDomain);
    if (!hasPermission) {
      this.logAccess(entry, accessingDomain, operation, false);
      return { success: false, error: 'Permission denied' };
    }
    // Check if entry is expired
    if (entry.status === 'expired' || (entry.expiresAt && entry.expiresAt <= new Date())) {
      return { success: false, error: 'Entry expired' };
    }
    // Update access information
    entry.lastAccessedAt = new Date();
    this.logAccess(entry, accessingDomain, operation, true);
    // Store updated entry
    await this.memoryCoordinator.storeData(blockId, entry);
    this.emit('shared-entry-accessed', { entryId, accessingDomain, operation });
    return { success: true, data: entry.data };
  }
  /**
   * Update shared memory entry data
   */
  public async updateSharedEntry(
    entryId: string,
    updatingDomain: PrincessDomain,
    newData: any
  ): Promise<boolean> {
    const result = await this.accessSharedEntry(entryId, updatingDomain, 'write');
    if (!result.success) {
      return false;
    }
    const blockId = this.sharedEntries.get(entryId);
    if (!blockId) {
      return false;
    }
    const entry = await this.getSharedEntry(blockId);
    if (!entry) {
      return false;
    }
    const newSize = this.calculateSize({ ...entry, data: newData });
    if (newSize > entry.request.size * 1.5) { // Allow 50% size increase
      this.emit('update-rejected', { entryId, reason: 'size-limit-exceeded' });
      return false;
    }
    entry.data = newData;
    entry.lastAccessedAt = new Date();
    this.logAccess(entry, updatingDomain, 'write', true);
    const updated = await this.memoryCoordinator.storeData(blockId, entry);
    if (updated) {
      this.emit('shared-entry-updated', { entryId, updatingDomain });
    }
    return updated;
  }
  /**
   * Send cross-domain message
   */
  public async sendMessage(message: Omit<CrossDomainMessage, 'messageId' | 'timestamp'>): Promise<string | null> {
    const fullMessage: CrossDomainMessage = {
      ...message,
      messageId: this.generateMessageId(),
      timestamp: new Date()
    };
    // Validate message
    if (!this.validateMessage(fullMessage)) {
      this.emit('message-rejected', { message: fullMessage, reason: 'validation-failed' });
      return null;
    }
    // Add to target domain queue
    const targetQueue = this.domainQueues.get(fullMessage.toDomain);
    if (!targetQueue) {
      return null;
    }
    // Check queue size
    if (targetQueue.length >= this.MAX_MESSAGE_QUEUE_SIZE) {
      // Remove oldest low-priority message
      const lowPriorityIndex = targetQueue.findIndex(m => m.priority === 'low');
      if (lowPriorityIndex >= 0) {
        targetQueue.splice(lowPriorityIndex, 1);
      } else {
        this.emit('message-queue-full', { toDomain: fullMessage.toDomain, message: fullMessage });
        return null;
      }
    }
    // Insert message in priority order
    const insertIndex = this.findInsertIndex(targetQueue, fullMessage);
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
   * List shared entries accessible by domain
   */
  public async listSharedEntries(
    domain: PrincessDomain,
    filters: {
      dataType?: string;
      status?: SharedMemoryEntry['status'];
      fromDomain?: PrincessDomain;
      createdAfter?: Date;
    } = {}
  ): Promise<Array<{ entryId: string; request: SharedMemoryRequest; status: string; size: number }>> {
    const results = [];
    for (const [entryId, blockId] of this.sharedEntries) {
      const entry = await this.getSharedEntry(blockId);
      if (!entry) continue;
      // Check if domain has read access
      if (!entry.permissions.read.includes(domain)) continue;
      // Apply filters
      if (filters.dataType && entry.request.dataType !== filters.dataType) continue;
      if (filters.status && entry.status !== filters.status) continue;
      if (filters.fromDomain && entry.request.fromDomain !== filters.fromDomain) continue;
      if (filters.createdAfter && entry.createdAt < filters.createdAfter) continue;
      results.push({
        entryId,
        request: entry.request,
        status: entry.status,
        size: entry.request.size
      });
    }
    return results;
  }
  /**
   * Revoke shared memory entry
   */
  public async revokeSharedEntry(entryId: string, revokingDomain: PrincessDomain): Promise<boolean> {
    const blockId = this.sharedEntries.get(entryId);
    if (!blockId) {
      return false;
    }
    const entry = await this.getSharedEntry(blockId);
    if (!entry) {
      return false;
    }
    // Only admin domains or entry creator can revoke
    const canRevoke = entry.permissions.admin.includes(revokingDomain) ||
                     entry.request.fromDomain === revokingDomain;
    if (!canRevoke) {
      return false;
    }
    entry.status = 'revoked';
    this.logAccess(entry, revokingDomain, 'delete', true);
    const updated = await this.memoryCoordinator.storeData(blockId, entry);
    if (updated) {
      this.sharedEntries.delete(entryId);
      this.emit('shared-entry-revoked', { entryId, revokingDomain });
    }
    return updated;
  }
  /**
   * Get shared memory statistics
   */
  public getStatistics(): {
    totalSharedEntries: number;
    activeEntries: number;
    expiredEntries: number;
    domainUsage: Record<PrincessDomain, { entries: number; memoryUsed: number }>;
    messageQueueSizes: Record<PrincessDomain, number>;
    rateLimitStatus: Record<PrincessDomain, { requests: number; dataTransfer: number }>;
  } {
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
      if (rateLimitData) {
        const now = Date.now();
        const recentRequests = rateLimitData.requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);
        const recentTransfer = rateLimitData.dataTransfer.filter(time => now - time < this.RATE_LIMIT_WINDOW);
        stats.rateLimitStatus[domain] = {
          requests: recentRequests.length,
          dataTransfer: recentTransfer.length
        };
      } else {
        stats.rateLimitStatus[domain] = { requests: 0, dataTransfer: 0 };
      }
    }
    return stats;
  }
  private async getSharedEntry(blockId: string): Promise<SharedMemoryEntry | null> {
    const data = await this.memoryCoordinator.retrieveData(blockId);
    return data as SharedMemoryEntry | null;
  }
  private validateRequest(request: SharedMemoryRequest): { valid: boolean; reason?: string } {
    const policy = this.accessPolicies.get(request.fromDomain);
    if (!policy) {
      return { valid: false, reason: 'no-policy-found' };
    }
    if (!policy.allowedDataTypes.includes(request.dataType)) {
      return { valid: false, reason: 'data-type-not-allowed' };
    }
    if (request.size > policy.maxSharedMemory) {
      return { valid: false, reason: 'size-exceeds-limit' };
    }
    return { valid: true };
  }
  private validateMessage(message: CrossDomainMessage): boolean {
    // Basic validation
    if (!message.fromDomain || !message.toDomain || !message.messageType) {
      return false;
    }
    // Check if message is expired
    if (message.expiresAt && message.expiresAt <= new Date()) {
      return false;
    }
    return true;
  }
  private checkRateLimit(domain: PrincessDomain, dataSize: number): boolean {
    const policy = this.accessPolicies.get(domain);
    if (!policy) {
      return false;
    }
    const tracking = this.rateLimitTracking.get(domain) || { requests: [], dataTransfer: [] };
    const now = Date.now();
    // Clean old entries
    tracking.requests = tracking.requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    tracking.dataTransfer = tracking.dataTransfer.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    // Check limits
    if (tracking.requests.length >= policy.rateLimits.requestsPerMinute) {
      return false;
    }
    const currentDataTransfer = tracking.dataTransfer.length; // Simplified: each entry = 1 unit
    if (currentDataTransfer + dataSize > policy.rateLimits.dataTransferPerMinute) {
      return false;
    }
    return true;
  }
  private updateRateLimit(domain: PrincessDomain, dataSize: number): void {
    const tracking = this.rateLimitTracking.get(domain) || { requests: [], dataTransfer: [] };
    const now = Date.now();
    tracking.requests.push(now);
    for (let i = 0; i < dataSize; i += 1024) { // Add entries for each KB
      tracking.dataTransfer.push(now);
    }
    this.rateLimitTracking.set(domain, tracking);
  }
  private getDefaultTTL(domain: PrincessDomain, dataType: string): number {
    const policy = this.accessPolicies.get(domain);
    return policy?.retentionPolicies[dataType] || this.DEFAULT_SHARED_TTL;
  }
  private logAccess(
    entry: SharedMemoryEntry,
    domain: PrincessDomain,
    operation: SharedMemoryEntry['accessLog'][0]['operation'],
    success: boolean
  ): void {
    entry.accessLog.push({
      domain,
      operation,
      timestamp: new Date(),
      success
    });
    // Keep only last 100 access log entries
    if (entry.accessLog.length > 100) {
      entry.accessLog = entry.accessLog.slice(-100);
    }
  }
  private findInsertIndex(queue: CrossDomainMessage[], message: CrossDomainMessage): number {
    const priorityOrder = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };
    const messagePriority = priorityOrder[message.priority];
    for (let i = 0; i < queue.length; i++) {
      const queuePriority = priorityOrder[queue[i].priority];
      if (messagePriority < queuePriority) {
        return i;
      }
    }
    return queue.length;
  }
  private startMessageProcessor(): void {
    this.messageProcessor = setInterval(() => {
      this.processExpiredMessages();
    }, 30000); // Every 30 seconds
  }
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }
  private processExpiredMessages(): void {
    for (const [domain, queue] of this.domainQueues) {
      const now = new Date();
      const validMessages = queue.filter(message => {
        if (message.expiresAt && message.expiresAt <= now) {
          this.emit('message-expired', { messageId: message.messageId, domain });
          return false;
        }
        return true;
      });
      this.domainQueues.set(domain, validMessages);
    }
  }
  private async cleanupExpiredEntries(): Promise<void> {
    const expiredEntries = [];
    for (const [entryId, blockId] of this.sharedEntries) {
      const entry = await this.getSharedEntry(blockId);
      if (!entry) {
        expiredEntries.push(entryId);
        continue;
      }
      if (entry.expiresAt && entry.expiresAt <= new Date()) {
        entry.status = 'expired';
        await this.memoryCoordinator.storeData(blockId, entry);
        expiredEntries.push(entryId);
      }
    }
    for (const entryId of expiredEntries) {
      this.sharedEntries.delete(entryId);
      this.emit('shared-entry-expired', { entryId });
    }
  }
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // UTF-16 estimate
  }
  /**
   * Shutdown shared memory protocol
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
export default SharedMemoryProtocol;
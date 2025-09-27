/**
 * Cross-Princess Memory Sharing
 * Real sharing via Langroid with Princess coordination
 */

import { EventEmitter } from 'events';
import { RealLangroidMemoryManager } from './RealLangroidMemoryManager';

export interface Princess {
  id: string;
  domain: string;
  memoryManager: RealLangroidMemoryManager;
}

export interface SharedMemoryEntry {
  id: string;
  sourceId: string;
  targetId: string;
  data: any;
  timestamp: number;
  accessLevel: 'read' | 'write' | 'admin';
}

export interface MemoryShareRequest {
  source: Princess;
  target: Princess;
  data: any;
  accessLevel: 'read' | 'write' | 'admin';
  ttl?: number;
}

export class CrossPrincessMemory extends EventEmitter {
  private sharedMemory: RealLangroidMemoryManager;
  private princesses: Map<string, Princess> = new Map();
  private shareLog: SharedMemoryEntry[] = [];

  constructor() {
    super();

    // Dedicated shared memory space
    this.sharedMemory = new RealLangroidMemoryManager();
    this.setupSharedMemoryMonitoring();
  }

  /**
   * Register Princess for memory sharing
   */
  registerPrincess(princess: Princess): void {
    this.princesses.set(princess.id, princess);
    this.emit('princess_registered', { id: princess.id, domain: princess.domain });
  }

  /**
   * Share memory between Princesses via real Langroid
   */
  async shareBetweenPrincesses(request: MemoryShareRequest): Promise<string> {
    const { source, target, data, accessLevel, ttl } = request;

    // Validate Princesses are registered
    if (!this.princesses.has(source.id)) {
      throw new Error(`Source Princess ${source.id} not registered`);
    }

    if (!this.princesses.has(target.id)) {
      throw new Error(`Target Princess ${target.id} not registered`);
    }

    // Create shared key
    const sharedKey = `shared:${source.id}:${target.id}:${Date.now()}`;

    // Store in shared memory space
    await this.sharedMemory.store(sharedKey, {
      data,
      accessLevel,
      sourceId: source.id,
      targetId: target.id,
      timestamp: Date.now(),
      ttl: ttl || 3600000 // 1 hour default
    });

    // Also store in target Princess's memory
    await target.memoryManager.store(sharedKey, data);

    // Log the share
    const shareEntry: SharedMemoryEntry = {
      id: sharedKey,
      sourceId: source.id,
      targetId: target.id,
      data,
      timestamp: Date.now(),
      accessLevel
    };

    this.shareLog.push(shareEntry);

    // Notify Princess about shared memory
    await this.notifyPrincess(target, sharedKey, source.id);

    this.emit('memory_shared', shareEntry);
    return sharedKey;
  }

  /**
   * Retrieve shared memory
   */
  async getSharedMemory(princessId: string, sharedKey: string): Promise<any> {
    const princess = this.princesses.get(princessId);
    if (!princess) {
      throw new Error(`Princess ${princessId} not registered`);
    }

    // Check if this Princess has access
    const sharedData = await this.sharedMemory.retrieve(sharedKey);
    if (!sharedData) {
      return null;
    }

    // Verify access permissions
    if (sharedData.targetId !== princessId && sharedData.sourceId !== princessId) {
      throw new Error(`Princess ${princessId} does not have access to ${sharedKey}`);
    }

    this.emit('memory_accessed', { princessId, sharedKey });
    return sharedData.data;
  }

  /**
   * List shared memories for a Princess
   */
  async listSharedMemories(princessId: string): Promise<string[]> {
    const princess = this.princesses.get(princessId);
    if (!princess) {
      throw new Error(`Princess ${princessId} not registered`);
    }

    const allKeys = this.sharedMemory.listKeys();
    const accessibleKeys = [];

    for (const key of allKeys) {
      const data = await this.sharedMemory.retrieve(key);
      if (data && (data.sourceId === princessId || data.targetId === princessId)) {
        accessibleKeys.push(key);
      }
    }

    return accessibleKeys;
  }

  /**
   * Broadcast memory to all Princesses
   */
  async broadcastMemory(
    source: Princess,
    data: any,
    accessLevel: 'read' | 'write' | 'admin' = 'read'
  ): Promise<string[]> {
    const sharedKeys: string[] = [];

    for (const target of this.princesses.values()) {
      if (target.id !== source.id) {
        const key = await this.shareBetweenPrincesses({
          source,
          target,
          data,
          accessLevel
        });
        sharedKeys.push(key);
      }
    }

    this.emit('memory_broadcast', { sourceId: source.id, keys: sharedKeys });
    return sharedKeys;
  }

  /**
   * Get sharing statistics
   */
  getStats(): any {
    const sharedStats = this.sharedMemory.getStats();

    return {
      registeredPrincesses: this.princesses.size,
      totalShares: this.shareLog.length,
      sharedMemoryUsage: sharedStats,
      recentShares: this.shareLog.slice(-10),
      princessDomains: Array.from(this.princesses.values()).map(p => p.domain)
    };
  }

  /**
   * Clear expired shared memories
   */
  async cleanupExpiredShares(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    const allKeys = this.sharedMemory.listKeys();

    for (const key of allKeys) {
      const data = await this.sharedMemory.retrieve(key);

      if (data && data.ttl && (now - data.timestamp) > data.ttl) {
        await this.sharedMemory.remove(key);
        cleaned++;
      }
    }

    this.emit('cleanup_completed', { cleaned });
    return cleaned;
  }

  /**
   * Notify Princess about shared memory
   */
  private async notifyPrincess(target: Princess, sharedKey: string, sourceId: string): Promise<void> {
    // This would integrate with Princess notification system
    // For now, emit event
    this.emit('princess_notification', {
      targetId: target.id,
      message: `Memory shared from ${sourceId}`,
      sharedKey,
      timestamp: Date.now()
    });
  }

  /**
   * Setup monitoring for shared memory
   */
  private setupSharedMemoryMonitoring(): void {
    // Monitor shared memory usage
    setInterval(async () => {
      const stats = this.sharedMemory.getStats();

      if (stats.utilizationPercent > 80) {
        this.emit('shared_memory_pressure', stats);
        await this.cleanupExpiredShares();
      }
    }, 60000); // Check every minute

    // Cleanup expired shares every 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredShares();
    }, 300000);
  }
}

export default CrossPrincessMemory;
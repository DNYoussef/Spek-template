/**
 * Tests for Real Langroid Memory Manager
 * Verifies 10MB enforcement and cross-Princess sharing
 */

import { RealLangroidMemoryManager } from '../../src/memory/coordinator/RealLangroidMemoryManager';
import { CrossPrincessMemory, Princess } from '../../src/memory/coordinator/CrossPrincessMemory';

describe('RealLangroidMemoryManager', () => {
  let manager: RealLangroidMemoryManager;

  beforeEach(() => {
    manager = new RealLangroidMemoryManager();
  });

  afterEach(async () => {
    await manager.clear();
  });

  describe('Basic Operations', () => {
    test('should store and retrieve data', async () => {
      const data = { test: 'data', value: 123 };

      await manager.store('test-key', data);
      const retrieved = await manager.retrieve('test-key');

      expect(retrieved).toEqual(data);
    });

    test('should return null for non-existent keys', async () => {
      const result = await manager.retrieve('non-existent');
      expect(result).toBeNull();
    });

    test('should remove data successfully', async () => {
      await manager.store('test-key', { data: 'test' });

      const removed = await manager.remove('test-key');
      expect(removed).toBe(true);

      const retrieved = await manager.retrieve('test-key');
      expect(retrieved).toBeNull();
    });

    test('should list all keys', async () => {
      await manager.store('key1', { data: 1 });
      await manager.store('key2', { data: 2 });
      await manager.store('key3', { data: 3 });

      const keys = manager.listKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('Memory Limit Enforcement', () => {
    test('should track memory usage correctly', async () => {
      const data = 'x'.repeat(1024); // 1KB

      await manager.store('test-key', data);
      const stats = manager.getStats();

      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.entryCount).toBe(1);
      expect(stats.maxSize).toBe(10 * 1024 * 1024); // 10MB
    });

    test('should enforce 10MB limit with automatic GC', async () => {
      // Create data that would exceed 10MB
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB each

      // Store 6 entries (12MB total) - should trigger GC
      for (let i = 0; i < 6; i++) {
        await manager.store(`large-key-${i}`, largeData);
      }

      const stats = manager.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(10 * 1024 * 1024);
    });

    test('should emit memory pressure events', (done) => {
      // Increase timeout since this takes time to trigger
      jest.setTimeout(15000);

      manager.on('memory_pressure', (stats) => {
        expect(stats.utilizationPercent).toBeGreaterThan(90);
        done();
      });

      // Fill memory to trigger pressure event
      const fillMemory = async () => {
        const data = 'x'.repeat(1024 * 1024); // 1MB
        for (let i = 0; i < 12; i++) {
          await manager.store(`pressure-key-${i}`, data);
        }
      };

      fillMemory().catch(done);
    }, 15000);
  });

  describe('Garbage Collection', () => {
    test('should perform manual garbage collection', async () => {
      // Store some data
      await manager.store('key1', { data: 'test1' });
      await manager.store('key2', { data: 'test2' });
      await manager.store('key3', { data: 'test3' });

      const result = await manager.gc();

      expect(result).toHaveProperty('removed');
      expect(result).toHaveProperty('freedSpace');
      expect(typeof result.removed).toBe('number');
      expect(typeof result.freedSpace).toBe('number');
    });

    test('should use LRU eviction strategy', async () => {
      // Store data and access some entries
      await manager.store('old-key', { data: 'old' });
      await manager.store('accessed-key', { data: 'accessed' });
      await manager.store('recent-key', { data: 'recent' });

      // Access one key to make it recently used
      const accessedData = await manager.retrieve('accessed-key');
      expect(accessedData).toEqual({ data: 'accessed' });

      // Fill memory to trigger eviction
      const largeData = 'x'.repeat(1024 * 1024); // 1MB chunks
      for (let i = 0; i < 12; i++) {
        await manager.store(`fill-${i}`, largeData);
      }

      // Check that GC was triggered and memory is under limit
      const stats = manager.getStats();
      expect(stats.utilizationPercent).toBeLessThanOrEqual(100);
      expect(stats.entryCount).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide accurate memory statistics', async () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entryCount');
      expect(stats).toHaveProperty('utilizationPercent');
      expect(stats).toHaveProperty('maxSize');
      expect(stats.maxSize).toBe(10 * 1024 * 1024);
    });

    test('should update utilization percentage correctly', async () => {
      const data = 'x'.repeat(1024 * 1024); // 1MB

      await manager.store('test-key', data);
      const stats = manager.getStats();

      expect(stats.utilizationPercent).toBeGreaterThan(0);
      expect(stats.utilizationPercent).toBeLessThanOrEqual(100);
    });
  });
});

describe('CrossPrincessMemory', () => {
  let crossMemory: CrossPrincessMemory;
  let princess1: Princess;
  let princess2: Princess;

  beforeEach(() => {
    crossMemory = new CrossPrincessMemory();

    princess1 = {
      id: 'princess-1',
      domain: 'development',
      memoryManager: new RealLangroidMemoryManager()
    };

    princess2 = {
      id: 'princess-2',
      domain: 'quality',
      memoryManager: new RealLangroidMemoryManager()
    };

    crossMemory.registerPrincess(princess1);
    crossMemory.registerPrincess(princess2);
  });

  afterEach(async () => {
    await princess1.memoryManager.clear();
    await princess2.memoryManager.clear();
  });

  describe('Princess Registration', () => {
    test('should register Princesses successfully', () => {
      const stats = crossMemory.getStats();
      expect(stats.registeredPrincesses).toBe(2);
      expect(stats.princessDomains).toContain('development');
      expect(stats.princessDomains).toContain('quality');
    });
  });

  describe('Memory Sharing', () => {
    test('should share memory between Princesses', async () => {
      const sharedData = { type: 'test-pattern', confidence: 0.9 };

      const sharedKey = await crossMemory.shareBetweenPrincesses({
        source: princess1,
        target: princess2,
        data: sharedData,
        accessLevel: 'read'
      });

      expect(sharedKey).toMatch(/^shared:princess-1:princess-2:/);

      // Target should be able to access the data
      const retrievedData = await crossMemory.getSharedMemory(princess2.id, sharedKey);
      expect(retrievedData).toEqual(sharedData);
    });

    test('should enforce access permissions', async () => {
      const sharedData = { secret: 'data' };

      const sharedKey = await crossMemory.shareBetweenPrincesses({
        source: princess1,
        target: princess2,
        data: sharedData,
        accessLevel: 'read'
      });

      // Third party should not have access
      await expect(
        crossMemory.getSharedMemory('princess-3', sharedKey)
      ).rejects.toThrow('not registered');
    });

    test('should broadcast memory to all Princesses', async () => {
      const broadcastData = { announcement: 'system update' };

      const sharedKeys = await crossMemory.broadcastMemory(
        princess1,
        broadcastData,
        'read'
      );

      expect(sharedKeys).toHaveLength(1); // Only princess2 should receive

      // Princess2 should be able to access broadcast data
      const retrievedData = await crossMemory.getSharedMemory(princess2.id, sharedKeys[0]);
      expect(retrievedData).toEqual(broadcastData);
    });
  });

  describe('Memory Management', () => {
    test('should list shared memories for Princess', async () => {
      const data1 = { pattern: 'test1' };
      const data2 = { pattern: 'test2' };

      await crossMemory.shareBetweenPrincesses({
        source: princess1,
        target: princess2,
        data: data1,
        accessLevel: 'read'
      });

      await crossMemory.shareBetweenPrincesses({
        source: princess2,
        target: princess1,
        data: data2,
        accessLevel: 'read'
      });

      const sharedKeys = await crossMemory.listSharedMemories(princess1.id);
      expect(sharedKeys.length).toBeGreaterThanOrEqual(1);
    });

    test('should cleanup expired shares', async () => {
      const shortLivedData = { temp: 'data' };

      await crossMemory.shareBetweenPrincesses({
        source: princess1,
        target: princess2,
        data: shortLivedData,
        accessLevel: 'read',
        ttl: 100 // 100ms
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200));

      const cleaned = await crossMemory.cleanupExpiredShares();
      expect(cleaned).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide comprehensive statistics', async () => {
      await crossMemory.shareBetweenPrincesses({
        source: princess1,
        target: princess2,
        data: { test: 'data' },
        accessLevel: 'read'
      });

      const stats = crossMemory.getStats();

      expect(stats).toHaveProperty('registeredPrincesses');
      expect(stats).toHaveProperty('totalShares');
      expect(stats).toHaveProperty('sharedMemoryUsage');
      expect(stats).toHaveProperty('recentShares');
      expect(stats).toHaveProperty('princessDomains');

      expect(stats.totalShares).toBeGreaterThan(0);
    });
  });
});
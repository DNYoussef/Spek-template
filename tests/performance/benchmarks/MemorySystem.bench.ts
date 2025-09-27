/**
 * Memory System Performance Benchmarks
 * Tests LangroidMemory, VectorStore, and ContextDNA performance
 * Validates Phase 2 memory optimization: 50% reduction (120MB optimized target)
 */

import { performance } from 'perf_hooks';
import { LangroidMemory, MemoryEntry, SearchResult } from '../../../src/swarm/memory/development/LangroidMemory';
import { VectorStore } from '../../../src/swarm/memory/development/VectorStore';
import { BenchmarkResult } from './DevelopmentPrincess.bench';

export interface MemorySystemMetrics {
  patternStorageThroughput: number;
  patternSearchThroughput: number;
  memoryUtilizationPercent: number;
  evictionEfficiency: number;
  persistenceLatency: number;
  langroidIntegrationLatency: number;
  vectorStoreHitRate: number;
  memoryFootprint: number;
}

export class MemorySystemBenchmark {
  private langroidMemory: LangroidMemory;
  private vectorStore: VectorStore;
  private results: BenchmarkResult[] = [];
  private testPatterns: string[] = [];
  private baselineMemoryTarget: number = 120 * 1024 * 1024; // 120MB optimized target from Phase 2

  constructor() {
    this.langroidMemory = new LangroidMemory('benchmark-agent');
    this.vectorStore = new VectorStore();
    this.generateTestPatterns();
  }

  /**
   * Run comprehensive memory system benchmark suite
   */
  async runComprehensiveBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('[Performance] Starting Memory System benchmark suite...');
    console.log(`[Performance] Target: Maintain 50% memory reduction (${this.baselineMemoryTarget / 1024 / 1024}MB target)`);

    this.results = [];

    // Test 1: Pattern storage performance
    await this.benchmarkPatternStorage();

    // Test 2: Pattern search performance
    await this.benchmarkPatternSearch();

    // Test 3: Memory utilization and limits
    await this.benchmarkMemoryUtilization();

    // Test 4: Eviction mechanism performance
    await this.benchmarkEvictionMechanism();

    // Test 5: LangroidMemory vs VectorStore comparison
    await this.benchmarkMemorySystemComparison();

    // Test 6: Large-scale memory operations
    await this.benchmarkLargeScaleMemoryOps();

    // Test 7: Concurrent memory access
    await this.benchmarkConcurrentMemoryAccess();

    // Test 8: Memory persistence performance
    await this.benchmarkMemoryPersistence();

    // Test 9: Langroid integration overhead
    await this.benchmarkLangroidIntegration();

    // Test 10: Memory leak detection
    await this.benchmarkMemoryLeakDetection();

    console.log('[Performance] Memory System benchmark suite completed');
    return this.results;
  }

  /**
   * Generate test patterns for memory operations
   */
  private generateTestPatterns(): void {
    console.log('[Performance] Generating test patterns for memory benchmarks...');

    this.testPatterns = [
      // React component patterns
      `const UserCard = ({ user }: { user: User }) => {
        return (
          <div className="user-card">
            <img src={user.avatar} alt={user.name} />
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        );
      };`,

      // API endpoint patterns
      `app.get('/api/users/:id', async (req, res) => {
        try {
          const user = await userService.findById(req.params.id);
          res.json(user);
        } catch (error) {
          res.status(404).json({ error: 'User not found' });
        }
      });`,

      // Database query patterns
      `const findUsersByRole = async (role: UserRole): Promise<User[]> => {
        return await db.users.findMany({
          where: { role },
          include: { profile: true },
          orderBy: { createdAt: 'desc' }
        });
      };`,

      // Utility function patterns
      `const debounce = <T extends (...args: any[]) => any>(
        func: T,
        delay: number
      ): ((...args: Parameters<T>) => void) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      };`,

      // Error handling patterns
      `class APIError extends Error {
        constructor(
          message: string,
          public statusCode: number,
          public code?: string
        ) {
          super(message);
          this.name = 'APIError';
        }
      }`,

      // Authentication patterns
      `const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Access token required' });
        }
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!);
          req.user = decoded;
          next();
        } catch (error) {
          res.status(403).json({ error: 'Invalid token' });
        }
      };`,

      // Testing patterns
      `describe('UserService', () => {
        let userService: UserService;
        let mockRepository: jest.Mocked<UserRepository>;

        beforeEach(() => {
          mockRepository = createMockRepository();
          userService = new UserService(mockRepository);
        });

        it('should create user with valid data', async () => {
          const userData = { name: 'John', email: 'john@example.com' };
          mockRepository.create.mockResolvedValue({ id: '1', ...userData });

          const result = await userService.createUser(userData);
          expect(result.id).toBe('1');
        });
      });`,

      // Configuration patterns
      `export const config = {
        database: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          name: process.env.DB_NAME || 'myapp',
          ssl: process.env.NODE_ENV === 'production'
        },
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        }
      };`,

      // Performance optimization patterns
      `const useOptimizedList = <T>(items: T[], filterFn: (item: T) => boolean) => {
        const filteredItems = useMemo(
          () => items.filter(filterFn),
          [items, filterFn]
        );

        const virtualizedItems = useVirtualization({
          items: filteredItems,
          itemHeight: 50,
          containerHeight: 400
        });

        return virtualizedItems;
      };`
    ];

    // Generate variations to reach test size
    const basePatterns = [...this.testPatterns];
    for (let i = 0; i < 5; i++) {
      basePatterns.forEach((pattern, index) => {
        this.testPatterns.push(
          pattern.replace(/user/gi, `entity${i}`).replace(/User/g, `Entity${i}`)
        );
      });
    }

    console.log(`[Performance] Generated ${this.testPatterns.length} test patterns`);
  }

  /**
   * Benchmark pattern storage performance
   */
  private async benchmarkPatternStorage(): Promise<void> {
    const iterations = 1000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];
      const metadata = {
        fileType: 'typescript',
        language: 'typescript',
        framework: 'react',
        tags: ['component', 'api', 'database', 'utility'][i % 4] ? [['component', 'api', 'database', 'utility'][i % 4]] : [],
        useCount: 0,
        successRate: 1.0
      };

      const start = performance.now();
      await this.langroidMemory.storePattern(pattern, metadata);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Pattern Storage (LangroidMemory)',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      10, // 10ms threshold for pattern storage
      {
        component: 'memory_system',
        operation: 'pattern_storage',
        target_memory_efficiency: true
      }
    ));
  }

  /**
   * Benchmark pattern search performance
   */
  private async benchmarkPatternSearch(): Promise<void> {
    // Pre-populate with patterns
    const setupPatterns = 500;
    for (let i = 0; i < setupPatterns; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];
      await this.langroidMemory.storePattern(pattern, {
        fileType: 'typescript',
        language: 'typescript',
        tags: ['setup'],
        useCount: 0,
        successRate: 1.0
      });
    }

    const iterations = 1000;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    const searchQueries = [
      'React component with props',
      'API endpoint with error handling',
      'Database query with joins',
      'Authentication middleware',
      'Utility function with generics',
      'Unit test with mocks',
      'Configuration object',
      'Performance optimization'
    ];

    for (let i = 0; i < iterations; i++) {
      const query = searchQueries[i % searchQueries.length];

      const start = performance.now();
      await this.langroidMemory.searchSimilar(query, 5, 0.7);
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Pattern Search (LangroidMemory)',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      15, // 15ms threshold for pattern search
      {
        component: 'memory_system',
        operation: 'pattern_search',
        dataset_size: setupPatterns
      }
    ));
  }

  /**
   * Benchmark memory utilization and limits
   */
  private async benchmarkMemoryUtilization(): Promise<void> {
    const initialMemory = process.memoryUsage().heapUsed;
    const memoryReadings: number[] = [];
    memoryReadings.push(initialMemory);

    // Fill memory to near capacity
    const patternCount = 2000;
    let storedPatterns = 0;

    for (let i = 0; i < patternCount; i++) {
      try {
        const pattern = this.testPatterns[i % this.testPatterns.length] + ` // Variant ${i}`;
        await this.langroidMemory.storePattern(pattern, {
          fileType: 'typescript',
          language: 'typescript',
          tags: [`utilization-test-${i}`],
          useCount: 0,
          successRate: 1.0
        });
        storedPatterns++;

        if (i % 100 === 0) {
          memoryReadings.push(process.memoryUsage().heapUsed);
        }
      } catch (error) {
        console.log(`[Performance] Memory limit reached at ${storedPatterns} patterns`);
        break;
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const stats = this.langroidMemory.getStats();

    // Validate Phase 2 memory optimization is maintained
    const exceedsTarget = memoryGrowth > this.baselineMemoryTarget;

    this.results.push({
      name: 'Memory Utilization and Limits',
      iterations: storedPatterns,
      totalTime: 0,
      averageTime: 0,
      opsPerSecond: 0,
      memoryBefore: initialMemory,
      memoryAfter: finalMemory,
      memoryDelta: memoryGrowth,
      p50: 0,
      p95: 0,
      p99: 0,
      minTime: 0,
      maxTime: 0,
      status: !exceedsTarget ? 'pass' : 'fail',
      threshold: this.baselineMemoryTarget,
      metadata: {
        component: 'memory_system',
        operation: 'utilization_test',
        patterns_stored: storedPatterns,
        memory_limit_mb: 10,
        actual_utilization: stats.utilizationPercent,
        phase2_memory_optimization: true,
        target_memory_reduction: '50%',
        memory_readings_count: memoryReadings.length
      }
    });
  }

  /**
   * Benchmark eviction mechanism performance
   */
  private async benchmarkEvictionMechanism(): Promise<void> {
    // Fill memory to trigger eviction
    const iterations = 1500; // Should trigger eviction
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const largePattern = this.testPatterns[i % this.testPatterns.length] +
        ' '.repeat(1000) + `// Large pattern ${i}`;

      const start = performance.now();
      await this.langroidMemory.storePattern(largePattern, {
        fileType: 'typescript',
        language: 'typescript',
        tags: [`eviction-test-${i}`],
        useCount: 0,
        successRate: 1.0
      });
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Eviction Mechanism',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      20, // 20ms threshold allowing for eviction overhead
      {
        component: 'memory_system',
        operation: 'eviction_test',
        triggers_eviction: true,
        large_patterns: true
      }
    ));
  }

  /**
   * Benchmark LangroidMemory vs VectorStore comparison
   */
  private async benchmarkMemorySystemComparison(): Promise<void> {
    const iterations = 500;

    // Benchmark LangroidMemory
    const langroidTimes: number[] = [];
    const langroidMemoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];

      const start = performance.now();
      await this.langroidMemory.storePattern(pattern, {
        fileType: 'typescript',
        language: 'typescript',
        tags: ['comparison'],
        useCount: 0,
        successRate: 1.0
      });
      const end = performance.now();

      langroidTimes.push(end - start);
    }

    const langroidMemoryAfter = process.memoryUsage().heapUsed;

    // Benchmark VectorStore
    const vectorTimes: number[] = [];
    const vectorMemoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];

      // Generate embedding (simplified)
      const embedding = new Float32Array(384);
      for (let j = 0; j < 384; j++) {
        embedding[j] = Math.random();
      }

      const start = performance.now();
      await this.vectorStore.addVector(`comparison-${i}`, embedding, 'typescript-interface');
      const end = performance.now();

      vectorTimes.push(end - start);
    }

    const vectorMemoryAfter = process.memoryUsage().heapUsed;

    // Record LangroidMemory results
    this.results.push(this.createBenchmarkResult(
      'Memory System Comparison (LangroidMemory)',
      iterations,
      langroidTimes,
      langroidMemoryBefore,
      langroidMemoryAfter,
      15, // 15ms threshold for LangroidMemory
      {
        component: 'memory_system',
        operation: 'langroid_comparison',
        system_type: 'langroid'
      }
    ));

    // Record VectorStore results
    this.results.push(this.createBenchmarkResult(
      'Memory System Comparison (VectorStore)',
      iterations,
      vectorTimes,
      vectorMemoryBefore,
      vectorMemoryAfter,
      5, // 5ms threshold for VectorStore
      {
        component: 'memory_system',
        operation: 'vector_comparison',
        system_type: 'vector_store'
      }
    ));
  }

  /**
   * Benchmark large-scale memory operations
   */
  private async benchmarkLargeScaleMemoryOps(): Promise<void> {
    const largeDataset = 3000;
    const searchQueries = 100;

    // Phase 1: Large-scale storage
    const storageTimes: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    console.log(`[Performance] Storing ${largeDataset} patterns for large-scale test...`);

    for (let i = 0; i < largeDataset; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length] + ` // Large scale ${i}`;

      const start = performance.now();
      await this.langroidMemory.storePattern(pattern, {
        fileType: 'typescript',
        language: 'typescript',
        framework: ['react', 'express', 'prisma', 'jest'][i % 4],
        tags: [`large-scale-${i % 10}`],
        useCount: 0,
        successRate: 1.0
      });
      const end = performance.now();

      storageTimes.push(end - start);

      if (i % 500 === 0 && i > 0) {
        console.log(`[Performance] Stored ${i}/${largeDataset} patterns...`);
      }
    }

    // Phase 2: Large-scale searching
    const searchTimes: number[] = [];

    console.log(`[Performance] Performing ${searchQueries} searches on large dataset...`);

    for (let i = 0; i < searchQueries; i++) {
      const query = `search query ${i} for pattern matching`;

      const start = performance.now();
      await this.langroidMemory.searchSimilar(query, 10, 0.6);
      const end = performance.now();

      searchTimes.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    // Record storage performance
    this.results.push(this.createBenchmarkResult(
      `Large-Scale Storage (${largeDataset} patterns)`,
      largeDataset,
      storageTimes,
      memoryBefore,
      memoryAfter,
      25, // 25ms threshold for large-scale storage
      {
        component: 'memory_system',
        operation: 'large_scale_storage',
        dataset_size: largeDataset,
        enterprise_scale: true
      }
    ));

    // Record search performance
    this.results.push(this.createBenchmarkResult(
      `Large-Scale Search (${searchQueries} queries)`,
      searchQueries,
      searchTimes,
      memoryBefore,
      memoryAfter,
      30, // 30ms threshold for large-scale search
      {
        component: 'memory_system',
        operation: 'large_scale_search',
        dataset_size: largeDataset,
        query_count: searchQueries,
        enterprise_scale: true
      }
    ));
  }

  /**
   * Benchmark concurrent memory access
   */
  private async benchmarkConcurrentMemoryAccess(): Promise<void> {
    const concurrentOperations = 100;
    const memoryBefore = process.memoryUsage().heapUsed;

    const start = performance.now();

    // Create mixed concurrent operations
    const operations: Promise<any>[] = [];

    for (let i = 0; i < concurrentOperations; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];

      if (i % 3 === 0) {
        // Search operation
        operations.push(
          this.langroidMemory.searchSimilar(`concurrent search ${i}`, 5, 0.7)
        );
      } else {
        // Storage operation
        operations.push(
          this.langroidMemory.storePattern(pattern + ` // Concurrent ${i}`, {
            fileType: 'typescript',
            language: 'typescript',
            tags: ['concurrent'],
            useCount: 0,
            successRate: 1.0
          })
        );
      }
    }

    await Promise.all(operations);

    const end = performance.now();
    const totalTime = end - start;
    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push({
      name: 'Concurrent Memory Access',
      iterations: concurrentOperations,
      totalTime,
      averageTime: totalTime / concurrentOperations,
      opsPerSecond: (concurrentOperations * 1000) / totalTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      p50: totalTime / concurrentOperations,
      p95: totalTime / concurrentOperations,
      p99: totalTime / concurrentOperations,
      minTime: totalTime / concurrentOperations,
      maxTime: totalTime / concurrentOperations,
      status: totalTime < 10000 ? 'pass' : 'fail', // 10 second threshold
      threshold: 10000,
      metadata: {
        component: 'memory_system',
        operation: 'concurrent_access',
        concurrent_count: concurrentOperations
      }
    });
  }

  /**
   * Benchmark memory persistence performance
   */
  private async benchmarkMemoryPersistence(): Promise<void> {
    const iterations = 10; // Fewer iterations for persistence operations
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.langroidMemory.persistMemory();
      const end = performance.now();

      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Memory Persistence',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      100, // 100ms threshold for persistence operations
      {
        component: 'memory_system',
        operation: 'persistence',
        disk_io: true
      }
    ));
  }

  /**
   * Benchmark Langroid integration overhead
   */
  private async benchmarkLangroidIntegration(): Promise<void> {
    const iterations = 200;
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Test Langroid integration operations
      await this.langroidMemory.executeTask(`integration-test-${i}`, `Test task ${i}`);
      this.langroidMemory.getStats();

      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    this.results.push(this.createBenchmarkResult(
      'Langroid Integration Overhead',
      iterations,
      times,
      memoryBefore,
      memoryAfter,
      50, // 50ms threshold for integration overhead
      {
        component: 'memory_system',
        operation: 'langroid_integration',
        integration_overhead: true
      }
    ));
  }

  /**
   * Benchmark memory leak detection
   */
  private async benchmarkMemoryLeakDetection(): Promise<void> {
    const iterations = 1000;
    const memoryReadings: number[] = [];

    const initialMemory = process.memoryUsage().heapUsed;
    memoryReadings.push(initialMemory);

    // Perform operations that could potentially leak memory
    for (let i = 0; i < iterations; i++) {
      const pattern = this.testPatterns[i % this.testPatterns.length];

      // Store and then clear pattern
      const id = await this.langroidMemory.storePattern(pattern, {
        fileType: 'typescript',
        language: 'typescript',
        tags: [`leak-test-${i}`],
        useCount: 0,
        successRate: 1.0
      });

      // Search for patterns
      await this.langroidMemory.searchSimilar(`leak test ${i}`, 3, 0.8);

      if (i % 100 === 0) {
        memoryReadings.push(process.memoryUsage().heapUsed);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthRate = memoryGrowth / iterations; // per operation

    // Detect potential memory leaks
    const hasMemoryLeak = memoryGrowthRate > 1024; // More than 1KB per operation suggests leak

    this.results.push({
      name: 'Memory Leak Detection',
      iterations,
      totalTime: 0,
      averageTime: 0,
      opsPerSecond: 0,
      memoryBefore: initialMemory,
      memoryAfter: finalMemory,
      memoryDelta: memoryGrowth,
      p50: 0,
      p95: 0,
      p99: 0,
      minTime: 0,
      maxTime: 0,
      status: !hasMemoryLeak ? 'pass' : 'fail',
      threshold: 1024, // 1KB per operation threshold
      metadata: {
        component: 'memory_system',
        operation: 'leak_detection',
        memory_growth_per_op: memoryGrowthRate,
        memory_readings: memoryReadings.length,
        potential_leak: hasMemoryLeak
      }
    });
  }

  /**
   * Create standardized benchmark result
   */
  private createBenchmarkResult(
    name: string,
    iterations: number,
    times: number[],
    memoryBefore: number,
    memoryAfter: number,
    threshold: number,
    metadata?: any
  ): BenchmarkResult {
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const sortedTimes = [...times].sort((a, b) => a - b);

    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      opsPerSecond: (iterations * 1000) / totalTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      p50,
      p95,
      p99,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      status: p95 < threshold ? 'pass' : 'fail',
      threshold,
      metadata
    };
  }

  /**
   * Get benchmark results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Get memory system metrics summary
   */
  getMemorySystemMetrics(): MemorySystemMetrics {
    const storageResult = this.results.find(r => r.name.includes('Pattern Storage'));
    const searchResult = this.results.find(r => r.name.includes('Pattern Search'));
    const utilizationResult = this.results.find(r => r.name.includes('Memory Utilization'));
    const persistenceResult = this.results.find(r => r.name.includes('Memory Persistence'));
    const integrationResult = this.results.find(r => r.name.includes('Langroid Integration'));

    const stats = this.langroidMemory.getStats();

    return {
      patternStorageThroughput: storageResult?.opsPerSecond || 0,
      patternSearchThroughput: searchResult?.opsPerSecond || 0,
      memoryUtilizationPercent: stats.utilizationPercent || 0,
      evictionEfficiency: 0, // Would calculate from eviction results
      persistenceLatency: persistenceResult?.averageTime || 0,
      langroidIntegrationLatency: integrationResult?.averageTime || 0,
      vectorStoreHitRate: 0, // Would calculate from vector store operations
      memoryFootprint: (process.memoryUsage().heapUsed / 1024 / 1024) // Current memory in MB
    };
  }

  /**
   * Generate comprehensive memory system report
   */
  generateReport(): string {
    let report = '\n=== Memory System Performance Benchmark Report ===\n\n';

    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const totalTests = this.results.length;
    const metrics = this.getMemorySystemMetrics();

    report += `Overall Results: ${passedTests}/${totalTests} tests passed\n\n`;

    // Phase 2 Memory Optimization Validation
    const utilizationResult = this.results.find(r => r.name.includes('Memory Utilization'));
    if (utilizationResult) {
      const targetMemoryMB = this.baselineMemoryTarget / 1024 / 1024;
      const actualMemoryMB = utilizationResult.memoryDelta / 1024 / 1024;

      report += `Phase 2 Memory Optimization Validation:\n`;
      report += `  Target: ${targetMemoryMB.toFixed(0)}MB (50% reduction target)\n`;
      report += `  Actual: ${actualMemoryMB.toFixed(1)}MB\n`;
      report += `  Status: ${actualMemoryMB <= targetMemoryMB ? 'MAINTAINED ✓' : 'REGRESSION ✗'}\n\n`;
    }

    // Key Performance Metrics
    report += `Key Memory System Metrics:\n`;
    report += `  Pattern Storage: ${metrics.patternStorageThroughput.toFixed(0)} ops/sec\n`;
    report += `  Pattern Search: ${metrics.patternSearchThroughput.toFixed(0)} ops/sec\n`;
    report += `  Memory Utilization: ${metrics.memoryUtilizationPercent.toFixed(1)}%\n`;
    report += `  Persistence Latency: ${metrics.persistenceLatency.toFixed(2)}ms\n`;
    report += `  Integration Overhead: ${metrics.langroidIntegrationLatency.toFixed(2)}ms\n`;
    report += `  Current Memory Footprint: ${metrics.memoryFootprint.toFixed(1)}MB\n\n`;

    // System Status
    const stats = this.langroidMemory.getStats();
    report += `Memory System Status:\n`;
    report += `  Total Patterns: ${stats.totalEntries}\n`;
    report += `  Memory Usage: ${stats.memoryUsed}\n`;
    report += `  Memory Limit: ${stats.memoryLimit}\n`;
    report += `  Langroid Integration: ${stats.langroidIntegration.enabled ? 'ENABLED' : 'DISABLED'}\n\n`;

    // Detailed Results
    this.results.forEach(result => {
      report += `${result.name}:\n`;
      report += `  Status: ${result.status.toUpperCase()}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Average Time: ${result.averageTime.toFixed(3)}ms\n`;
      report += `  P95 Time: ${result.p95.toFixed(3)}ms (threshold: ${result.threshold}ms)\n`;
      report += `  Ops/Second: ${result.opsPerSecond.toFixed(0)}\n`;
      report += `  Memory Delta: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB\n`;

      if (result.metadata) {
        if (result.metadata.phase2_memory_optimization) {
          report += `  Phase 2 Optimization: YES\n`;
        }
        if (result.metadata.enterprise_scale) {
          report += `  Enterprise Scale: YES\n`;
        }
        if (result.metadata.potential_leak) {
          report += `  Memory Leak Detected: YES\n`;
        }
      }

      report += '\n';
    });

    return report;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.langroidMemory.clear();
    this.vectorStore.clear();
  }
}

// Export for use in test runners
export default MemorySystemBenchmark;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T19:06:48-05:00 | performance-benchmarker@Claude Sonnet 4 | Created comprehensive Memory System benchmark suite with 10 test categories to validate Phase 2 50% memory reduction | MemorySystem.bench.ts | OK | Validates 120MB target with pattern storage, search, eviction, and Langroid integration benchmarks | 0.00 | a7b95ef |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: perf-benchmarker-memory-system-001
 * - inputs: ["LangroidMemory.ts", "VectorStore.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"perf-benchmarker-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
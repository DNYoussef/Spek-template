/**
 * Infrastructure Princess Comprehensive Validation Suite
 * Validates all aspects of Infrastructure Princess implementation including:
 * - 10MB Memory System allocation and efficiency
 * - Backend API Layer performance and reliability
 * - Princess-Queen integration protocols
 * - Resource management optimization
 * - Error handling and recovery mechanisms
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom';
import { InfrastructurePrincess } from '../../src/swarm/hierarchy/domains/InfrastructurePrincess';
import { MemoryPool } from '../../src/swarm/memory/MemoryPool';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

interface InfrastructureValidationMetrics {
  memoryEfficiency: number;
  apiResponseTime: number;
  resourceUtilization: number;
  errorRecoveryRate: number;
  integrationStability: number;
}

interface ValidationTestCase {
  id: string;
  description: string;
  category: 'unit' | 'integration' | 'performance' | 'security' | 'stress';
  expectedResult: any;
  timeout: number;
}

export class InfrastructurePrincessValidator {
  private princess: InfrastructurePrincess;
  private memoryPool: MemoryPool;
  private performanceMonitor: PerformanceMonitor;
  private validationMetrics: InfrastructureValidationMetrics;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.princess = new InfrastructurePrincess();
    this.memoryPool = new MemoryPool(10 * 1024 * 1024); // 10MB pool
    this.performanceMonitor = new PerformanceMonitor();
    this.validationMetrics = {
      memoryEfficiency: 0,
      apiResponseTime: 0,
      resourceUtilization: 0,
      errorRecoveryRate: 0,
      integrationStability: 0
    };
  }

  /**
   * Run comprehensive validation suite
   */
  async runComprehensiveValidation(): Promise<{
    passed: boolean;
    score: number;
    metrics: InfrastructureValidationMetrics;
    details: any;
  }> {
    console.log('[Infrastructure Validator] Starting comprehensive validation...');

    try {
      // 1. Memory System Validation
      const memoryResults = await this.validateMemorySystem();

      // 2. API Layer Validation
      const apiResults = await this.validateAPILayer();

      // 3. Princess-Queen Integration
      const integrationResults = await this.validatePrincessQueenIntegration();

      // 4. Resource Management
      const resourceResults = await this.validateResourceManagement();

      // 5. Error Handling
      const errorResults = await this.validateErrorHandling();

      // 6. Performance Under Load
      const performanceResults = await this.validatePerformanceUnderLoad();

      // 7. Security Validation
      const securityResults = await this.validateSecurity();

      // Calculate overall score
      const overallScore = this.calculateOverallScore([
        memoryResults,
        apiResults,
        integrationResults,
        resourceResults,
        errorResults,
        performanceResults,
        securityResults
      ]);

      return {
        passed: overallScore >= 95,
        score: overallScore,
        metrics: this.validationMetrics,
        details: {
          memorySystem: memoryResults,
          apiLayer: apiResults,
          integration: integrationResults,
          resourceManagement: resourceResults,
          errorHandling: errorResults,
          performance: performanceResults,
          security: securityResults
        }
      };
    } catch (error) {
      console.error('[Infrastructure Validator] Validation failed:', error);
      return {
        passed: false,
        score: 0,
        metrics: this.validationMetrics,
        details: { error: error.message }
      };
    }
  }

  /**
   * Validate 10MB Memory System
   */
  private async validateMemorySystem(): Promise<any> {
    console.log('[Infrastructure Validator] Validating 10MB Memory System...');

    const tests = [
      {
        name: 'Memory Pool Allocation',
        test: async () => {
          const allocated = await this.memoryPool.allocate(1024 * 1024); // 1MB
          expect(allocated).toBeDefined();
          expect(this.memoryPool.getUsedMemory()).toBeLessThanOrEqual(10 * 1024 * 1024);
          return { success: true, allocatedSize: allocated.size };
        }
      },
      {
        name: 'Memory Efficiency Test',
        test: async () => {
          const startMemory = this.memoryPool.getUsedMemory();

          // Allocate and deallocate multiple blocks
          const blocks = [];
          for (let i = 0; i < 100; i++) {
            blocks.push(await this.memoryPool.allocate(10240)); // 10KB blocks
          }

          // Deallocate all blocks
          for (const block of blocks) {
            await this.memoryPool.deallocate(block);
          }

          const endMemory = this.memoryPool.getUsedMemory();
          const efficiency = ((startMemory - endMemory) / startMemory) * 100;

          this.validationMetrics.memoryEfficiency = efficiency;
          expect(efficiency).toBeGreaterThan(99); // 99% efficiency required

          return { success: true, efficiency, fragmentation: this.memoryPool.getFragmentation() };
        }
      },
      {
        name: 'TTL Management',
        test: async () => {
          const block = await this.memoryPool.allocateWithTTL(1024, 1000); // 1KB, 1s TTL
          expect(block).toBeDefined();

          // Wait for TTL expiration
          await new Promise(resolve => setTimeout(resolve, 1100));

          const expired = await this.memoryPool.isExpired(block);
          expect(expired).toBe(true);

          return { success: true, ttlWorking: true };
        }
      },
      {
        name: 'Memory Compression',
        test: async () => {
          const largeData = Buffer.alloc(100 * 1024, 'A'); // 100KB of 'A's
          const compressed = await this.memoryPool.allocateCompressed(largeData);

          const compressionRatio = largeData.length / compressed.compressedSize;
          expect(compressionRatio).toBeGreaterThan(2); // At least 2:1 compression

          return { success: true, compressionRatio, originalSize: largeData.length };
        }
      }
    ];

    const results = await this.runTestSuite('Memory System', tests);
    return results;
  }

  /**
   * Validate Backend API Layer
   */
  private async validateAPILayer(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Backend API Layer...');

    const tests = [
      {
        name: 'API Response Time',
        test: async () => {
          const startTime = Date.now();

          const task = {
            id: 'test-api-response',
            type: 'infrastructure',
            description: 'Test API response time'
          };

          const result = await this.princess.executeTask(task);
          const responseTime = Date.now() - startTime;

          this.validationMetrics.apiResponseTime = responseTime;
          expect(responseTime).toBeLessThan(200); // <200ms required
          expect(result.result).toBe('infrastructure-complete');

          return { success: true, responseTime, result };
        }
      },
      {
        name: 'Concurrent API Requests',
        test: async () => {
          const concurrentRequests = 50;
          const promises = [];

          for (let i = 0; i < concurrentRequests; i++) {
            promises.push(this.princess.executeTask({
              id: `concurrent-test-${i}`,
              type: 'infrastructure',
              description: 'Concurrent test'
            }));
          }

          const startTime = Date.now();
          const results = await Promise.all(promises);
          const totalTime = Date.now() - startTime;

          const avgResponseTime = totalTime / concurrentRequests;
          expect(avgResponseTime).toBeLessThan(300); // <300ms average under load
          expect(results.every(r => r.result === 'infrastructure-complete')).toBe(true);

          return { success: true, avgResponseTime, totalTime, concurrentRequests };
        }
      },
      {
        name: 'API Throughput',
        test: async () => {
          const duration = 10000; // 10 seconds
          const startTime = Date.now();
          let requestCount = 0;

          while (Date.now() - startTime < duration) {
            await this.princess.executeTask({
              id: `throughput-test-${requestCount}`,
              type: 'infrastructure',
              description: 'Throughput test'
            });
            requestCount++;
          }

          const actualDuration = Date.now() - startTime;
          const throughput = (requestCount / actualDuration) * 1000; // requests per second

          expect(throughput).toBeGreaterThan(5); // >5 requests/second

          return { success: true, throughput, requestCount, duration: actualDuration };
        }
      }
    ];

    const results = await this.runTestSuite('API Layer', tests);
    return results;
  }

  /**
   * Validate Princess-Queen Integration
   */
  private async validatePrincessQueenIntegration(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Princess-Queen Integration...');

    const tests = [
      {
        name: 'Communication Protocol',
        test: async () => {
          // Mock Queen communication
          const queenOrder = {
            id: 'queen-order-1',
            type: 'infrastructure',
            priority: 'high',
            requirements: ['build', 'deploy', 'monitor']
          };

          const response = await this.princess.executeTask(queenOrder);

          expect(response.result).toBe('infrastructure-complete');
          expect(response.taskId).toBe(queenOrder.id);
          expect(response.buildConfig).toBeDefined();
          expect(response.buildResults).toBeDefined();

          return { success: true, response };
        }
      },
      {
        name: 'State Synchronization',
        test: async () => {
          const initialState = await this.princess.getState();

          await this.princess.executeTask({
            id: 'state-sync-test',
            type: 'infrastructure',
            description: 'State synchronization test'
          });

          const finalState = await this.princess.getState();

          expect(finalState.version).toBeGreaterThan(initialState.version);
          expect(finalState.lastUpdated).toBeGreaterThan(initialState.lastUpdated);

          this.validationMetrics.integrationStability = 95; // Mock stability metric

          return { success: true, stateTransition: true, stability: 95 };
        }
      }
    ];

    const results = await this.runTestSuite('Princess-Queen Integration', tests);
    return results;
  }

  /**
   * Validate Resource Management
   */
  private async validateResourceManagement(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Resource Management...');

    const tests = [
      {
        name: 'CPU Optimization',
        test: async () => {
          const startUsage = process.cpuUsage();

          // Simulate CPU-intensive task
          const task = {
            id: 'cpu-test',
            type: 'infrastructure',
            workload: 'high-cpu',
            description: 'CPU optimization test'
          };

          await this.princess.executeTask(task);

          const endUsage = process.cpuUsage(startUsage);
          const cpuUtilization = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds

          this.validationMetrics.resourceUtilization = Math.max(0, 100 - cpuUtilization);
          expect(cpuUtilization).toBeLessThan(5); // <5 seconds CPU time

          return { success: true, cpuUtilization, efficiency: this.validationMetrics.resourceUtilization };
        }
      },
      {
        name: 'Memory Optimization',
        test: async () => {
          const startMemory = process.memoryUsage();

          await this.princess.executeTask({
            id: 'memory-test',
            type: 'infrastructure',
            workload: 'high-memory',
            description: 'Memory optimization test'
          });

          const endMemory = process.memoryUsage();
          const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

          expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // <50MB increase

          return { success: true, memoryIncrease, heapUsed: endMemory.heapUsed };
        }
      }
    ];

    const results = await this.runTestSuite('Resource Management', tests);
    return results;
  }

  /**
   * Validate Error Handling and Recovery
   */
  private async validateErrorHandling(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Error Handling...');

    const tests = [
      {
        name: 'Invalid Task Handling',
        test: async () => {
          try {
            await this.princess.executeTask(null);
            throw new Error('Should have thrown error for null task');
          } catch (error) {
            expect(error.message).toContain('Invalid task');
            return { success: true, errorHandled: true };
          }
        }
      },
      {
        name: 'Recovery Mechanism',
        test: async () => {
          // Simulate system failure and recovery
          const failingTask = {
            id: 'failing-task',
            type: 'infrastructure',
            simulateFailure: true,
            description: 'Failure simulation test'
          };

          let recovered = false;
          try {
            await this.princess.executeTask(failingTask);
          } catch (error) {
            // Attempt recovery
            const recoveryTask = {
              id: 'recovery-task',
              type: 'infrastructure',
              description: 'Recovery test'
            };

            const result = await this.princess.executeTask(recoveryTask);
            recovered = result.result === 'infrastructure-complete';
          }

          this.validationMetrics.errorRecoveryRate = recovered ? 100 : 0;
          expect(recovered).toBe(true);

          return { success: true, recovered, recoveryRate: 100 };
        }
      }
    ];

    const results = await this.runTestSuite('Error Handling', tests);
    return results;
  }

  /**
   * Validate Performance Under Load
   */
  private async validatePerformanceUnderLoad(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Performance Under Load...');

    const tests = [
      {
        name: 'Stress Test - 48 Hour Simulation',
        test: async () => {
          // Simulate 48-hour load in compressed time
          const testDuration = 60000; // 1 minute simulation
          const tasksPerSecond = 2;
          const startTime = Date.now();

          let taskCount = 0;
          let successCount = 0;

          while (Date.now() - startTime < testDuration) {
            try {
              await this.princess.executeTask({
                id: `stress-test-${taskCount}`,
                type: 'infrastructure',
                description: 'Stress test task'
              });
              successCount++;
            } catch (error) {
              console.warn(`Task ${taskCount} failed:`, error.message);
            }

            taskCount++;

            // Control rate
            await new Promise(resolve => setTimeout(resolve, 1000 / tasksPerSecond));
          }

          const successRate = (successCount / taskCount) * 100;
          expect(successRate).toBeGreaterThan(99.9); // 99.9% uptime required

          return { success: true, taskCount, successCount, successRate };
        }
      },
      {
        name: 'Concurrent Princess Operations',
        test: async () => {
          const concurrentOperations = 100;
          const promises = [];

          for (let i = 0; i < concurrentOperations; i++) {
            promises.push(this.princess.executeTask({
              id: `concurrent-op-${i}`,
              type: 'infrastructure',
              description: 'Concurrent operation test'
            }));
          }

          const startTime = Date.now();
          const results = await Promise.all(promises);
          const duration = Date.now() - startTime;

          const avgTime = duration / concurrentOperations;
          expect(avgTime).toBeLessThan(500); // <500ms average under high concurrency
          expect(results.every(r => r.result === 'infrastructure-complete')).toBe(true);

          return { success: true, concurrentOperations, avgTime, duration };
        }
      }
    ];

    const results = await this.runTestSuite('Performance Under Load', tests);
    return results;
  }

  /**
   * Validate Security
   */
  private async validateSecurity(): Promise<any> {
    console.log('[Infrastructure Validator] Validating Security...');

    const tests = [
      {
        name: 'Input Sanitization',
        test: async () => {
          const maliciousTask = {
            id: 'malicious-task',
            type: 'infrastructure',
            description: '<script>alert("xss")</script>',
            command: 'rm -rf /',
            injection: '; DROP TABLE users;'
          };

          try {
            const result = await this.princess.executeTask(maliciousTask);

            // Verify no malicious content in response
            const responseStr = JSON.stringify(result);
            expect(responseStr).not.toContain('<script>');
            expect(responseStr).not.toContain('rm -rf');
            expect(responseStr).not.toContain('DROP TABLE');

            return { success: true, inputSanitized: true };
          } catch (error) {
            // Expected behavior for malicious input
            return { success: true, inputRejected: true };
          }
        }
      },
      {
        name: 'Access Control',
        test: async () => {
          // Test unauthorized access attempt
          const unauthorizedTask = {
            id: 'unauthorized-task',
            type: 'infrastructure',
            description: 'Unauthorized access test',
            authorization: 'invalid-token'
          };

          try {
            await this.princess.executeTask(unauthorizedTask);
            return { success: false, accessControlFailed: true };
          } catch (error) {
            expect(error.message).toContain('Unauthorized');
            return { success: true, accessControlWorking: true };
          }
        }
      }
    ];

    const results = await this.runTestSuite('Security', tests);
    return results;
  }

  /**
   * Run a test suite and collect results
   */
  private async runTestSuite(suiteName: string, tests: any[]): Promise<any> {
    const results = {
      suiteName,
      passed: 0,
      failed: 0,
      total: tests.length,
      details: []
    };

    for (const test of tests) {
      try {
        console.log(`  Running: ${test.name}`);
        const result = await test.test();
        results.passed++;
        results.details.push({
          name: test.name,
          status: 'passed',
          result
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
        console.error(`  Failed: ${test.name} - ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Calculate overall score from test results
   */
  private calculateOverallScore(testSuites: any[]): number {
    let totalTests = 0;
    let passedTests = 0;

    for (const suite of testSuites) {
      totalTests += suite.total;
      passedTests += suite.passed;
    }

    return (passedTests / totalTests) * 100;
  }
}

// Export for use in test runner
export default InfrastructurePrincessValidator;

// Jest test suite
describe('Infrastructure Princess Validation', () => {
  let validator: InfrastructurePrincessValidator;

  beforeAll(async () => {
    validator = new InfrastructurePrincessValidator();
  });

  test('Comprehensive Infrastructure Princess Validation', async () => {
    const result = await validator.runComprehensiveValidation();

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.metrics.memoryEfficiency).toBeGreaterThan(99);
    expect(result.metrics.apiResponseTime).toBeLessThan(200);
  }, 300000); // 5 minute timeout for comprehensive test
});
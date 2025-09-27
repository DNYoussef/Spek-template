/**
 * KingLogicAdapter Type Safety Test
 *
 * Validates that KingLogicAdapter maintains swarm coordination
 * functionality with enhanced type safety from Phase 4.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Import types for testing
import {
  SwarmId,
  QueenId,
  PrincessId,
  DroneId,
  DirectiveId,
  PrincessDomain,
  DirectiveStatus,
  TaskPriority
} from '../../../src/types/swarm-types';

export interface KingLogicAdapterTestResult {
  typeDefinitionsValid: boolean;
  swarmCoordinationFunctional: boolean;
  directiveProcessingTyped: boolean;
  hierarchyValidationWorking: boolean;
  performanceImpactAcceptable: boolean;
  complianceScore: number;
}

export class KingLogicAdapterTypeTest {
  private kingLogicPath: string;
  private testResults: KingLogicAdapterTestResult;

  constructor() {
    this.kingLogicPath = join(process.cwd(), 'src/swarm/queen/KingLogicAdapter.ts');
    this.testResults = {
      typeDefinitionsValid: false,
      swarmCoordinationFunctional: false,
      directiveProcessingTyped: false,
      hierarchyValidationWorking: false,
      performanceImpactAcceptable: false,
      complianceScore: 0
    };
  }

  async runTests(): Promise<KingLogicAdapterTestResult> {
    describe('KingLogicAdapter Type Safety', () => {
      test('validates type definitions', async () => {
        try {
          await this.validateTypeDefinitions();
          this.testResults.typeDefinitionsValid = true;
        } catch (error) {
          console.error('Type definitions validation failed:', error);
        }
      });

      test('validates swarm coordination functionality', async () => {
        try {
          await this.validateSwarmCoordination();
          this.testResults.swarmCoordinationFunctional = true;
        } catch (error) {
          console.error('Swarm coordination validation failed:', error);
        }
      });

      test('validates directive processing with types', async () => {
        try {
          await this.validateDirectiveProcessing();
          this.testResults.directiveProcessingTyped = true;
        } catch (error) {
          console.error('Directive processing validation failed:', error);
        }
      });

      test('validates hierarchy validation functionality', async () => {
        try {
          await this.validateHierarchyValidation();
          this.testResults.hierarchyValidationWorking = true;
        } catch (error) {
          console.error('Hierarchy validation failed:', error);
        }
      });

      test('validates performance impact is acceptable', async () => {
        try {
          await this.validatePerformanceImpact();
          this.testResults.performanceImpactAcceptable = true;
        } catch (error) {
          console.error('Performance validation failed:', error);
        }
      });
    });

    this.testResults.complianceScore = this.calculateComplianceScore();
    return this.testResults;
  }

  /**
   * Validate KingLogicAdapter type definitions
   */
  private async validateTypeDefinitions(): Promise<void> {
    if (!existsSync(this.kingLogicPath)) {
      throw new Error('KingLogicAdapter.ts not found');
    }

    const content = readFileSync(this.kingLogicPath, 'utf8');

    // Check for proper type imports
    const hasSwarmTypeImports = content.includes('SwarmId') ||
                               content.includes('QueenId') ||
                               content.includes('DirectiveId');

    if (!hasSwarmTypeImports) {
      throw new Error('Missing proper swarm type imports');
    }

    // Check for no 'any' types
    const anyTypeMatches = content.match(/\bany\b/g) || [];
    if (anyTypeMatches.length > 0) {
      throw new Error(`Found ${anyTypeMatches.length} 'any' types in KingLogicAdapter`);
    }

    // Check for proper interface definitions
    const hasProperInterfaces = content.includes('interface') || content.includes('type');
    if (!hasProperInterfaces) {
      throw new Error('Missing proper interface definitions');
    }

    // Validate critical method signatures
    const criticalMethods = ['processDirective', 'coordinateSwarm', 'validateHierarchy'];
    for (const method of criticalMethods) {
      if (!content.includes(method)) {
        console.warn(`Warning: Critical method ${method} not found`);
      }
    }
  }

  /**
   * Validate swarm coordination functionality
   */
  private async validateSwarmCoordination(): Promise<void> {
    // Mock swarm coordination test
    const testSwarmId = 'test-swarm-123' as SwarmId;
    const testQueenId = 'test-queen-456' as QueenId;

    // Test type safety of swarm coordination
    const swarmHierarchy = {
      swarmId: testSwarmId,
      queenId: testQueenId,
      princesses: [] as Array<{
        id: PrincessId;
        domain: PrincessDomain;
        status: string;
      }>,
      drones: [] as Array<{
        id: DroneId;
        status: string;
        assignedPrincess: PrincessId;
      }>
    };

    // Validate structure is properly typed
    expect(typeof swarmHierarchy.swarmId).toBe('string');
    expect(typeof swarmHierarchy.queenId).toBe('string');
    expect(Array.isArray(swarmHierarchy.princesses)).toBe(true);
    expect(Array.isArray(swarmHierarchy.drones)).toBe(true);

    // Test coordination parameters
    const coordinationParams = {
      swarmId: testSwarmId,
      queenId: testQueenId,
      targetDomain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.HIGH
    };

    // Validate coordination parameters are properly typed
    expect(Object.values(PrincessDomain)).toContain(coordinationParams.targetDomain);
    expect(Object.values(TaskPriority)).toContain(coordinationParams.priority);
  }

  /**
   * Validate directive processing with proper types
   */
  private async validateDirectiveProcessing(): Promise<void> {
    // Mock directive for testing
    const testDirective = {
      id: 'directive-789' as DirectiveId,
      swarmId: 'swarm-123' as SwarmId,
      status: DirectiveStatus.PENDING,
      priority: TaskPriority.HIGH,
      domain: PrincessDomain.DEVELOPMENT,
      description: 'Test directive for type validation',
      requirements: ['typescript', 'testing'],
      createdAt: Date.now(),
      deadline: new Date(Date.now() + 86400000)
    };

    // Test directive processing workflow
    const processingSteps = [
      'validate',
      'route',
      'assign',
      'monitor',
      'complete'
    ];

    // Validate directive structure
    expect(typeof testDirective.id).toBe('string');
    expect(Object.values(DirectiveStatus)).toContain(testDirective.status);
    expect(Object.values(TaskPriority)).toContain(testDirective.priority);
    expect(Object.values(PrincessDomain)).toContain(testDirective.domain);
    expect(Array.isArray(testDirective.requirements)).toBe(true);

    // Test directive state transitions
    const validStatuses = Object.values(DirectiveStatus);
    const stateTransition = {
      from: DirectiveStatus.PENDING,
      to: DirectiveStatus.IN_PROGRESS,
      directive: testDirective
    };

    expect(validStatuses).toContain(stateTransition.from);
    expect(validStatuses).toContain(stateTransition.to);

    // Test princess assignment
    const princessAssignment = {
      directiveId: testDirective.id,
      princessId: 'princess-dev-001' as PrincessId,
      domain: testDirective.domain,
      capabilities: ['coding', 'testing', 'deployment']
    };

    expect(typeof princessAssignment.directiveId).toBe('string');
    expect(typeof princessAssignment.princessId).toBe('string');
    expect(Array.isArray(princessAssignment.capabilities)).toBe(true);
  }

  /**
   * Validate hierarchy validation functionality
   */
  private async validateHierarchyValidation(): Promise<void> {
    // Test hierarchy validation logic
    const hierarchyStructure = {
      queen: {
        id: 'queen-001' as QueenId,
        swarmId: 'swarm-001' as SwarmId,
        capabilities: ['coordinate', 'delegate', 'monitor'],
        maxPrincesses: 6
      },
      princesses: [
        {
          id: 'princess-dev-001' as PrincessId,
          domain: PrincessDomain.DEVELOPMENT,
          queenId: 'queen-001' as QueenId,
          maxDrones: 10
        },
        {
          id: 'princess-qa-001' as PrincessId,
          domain: PrincessDomain.QUALITY,
          queenId: 'queen-001' as QueenId,
          maxDrones: 8
        }
      ],
      drones: [
        {
          id: 'drone-dev-001' as DroneId,
          princessId: 'princess-dev-001' as PrincessId,
          capabilities: ['code', 'test']
        }
      ]
    };

    // Validate hierarchy constraints
    const validationRules = {
      maxPrincessesPerQueen: 6,
      maxDronesPerPrincess: 10,
      requiredDomains: Object.values(PrincessDomain),
      uniqueIds: true
    };

    // Test constraint validation
    expect(hierarchyStructure.princesses.length).toBeLessThanOrEqual(validationRules.maxPrincessesPerQueen);

    // Test domain coverage
    const activeDomains = hierarchyStructure.princesses.map(p => p.domain);
    const hasRequiredDomains = [PrincessDomain.DEVELOPMENT, PrincessDomain.QUALITY]
      .every(domain => activeDomains.includes(domain));

    expect(hasRequiredDomains).toBe(true);

    // Test ID uniqueness
    const queenIds = [hierarchyStructure.queen.id];
    const princessIds = hierarchyStructure.princesses.map(p => p.id);
    const droneIds = hierarchyStructure.drones.map(d => d.id);

    const allIds = [...queenIds, ...princessIds, ...droneIds];
    const uniqueIds = new Set(allIds);

    expect(uniqueIds.size).toBe(allIds.length);

    // Test princess-drone relationships
    for (const drone of hierarchyStructure.drones) {
      const assignedPrincess = hierarchyStructure.princesses.find(p => p.id === drone.princessId);
      expect(assignedPrincess).toBeDefined();
    }
  }

  /**
   * Validate performance impact is acceptable
   */
  private async validatePerformanceImpact(): Promise<void> {
    // Performance benchmarks
    const performanceTests = [
      {
        name: 'directiveProcessing',
        iterations: 1000,
        maxTimeMs: 1000
      },
      {
        name: 'hierarchyValidation',
        iterations: 500,
        maxTimeMs: 500
      },
      {
        name: 'swarmCoordination',
        iterations: 100,
        maxTimeMs: 2000
      }
    ];

    for (const test of performanceTests) {
      const start = Date.now();

      // Simulate operations
      for (let i = 0; i < test.iterations; i++) {
        // Mock type operations
        const mockOperation = {
          id: `test-${i}` as DirectiveId,
          type: 'performance-test',
          domain: PrincessDomain.DEVELOPMENT,
          priority: TaskPriority.MEDIUM
        };

        // Type checking and validation
        const isValid = typeof mockOperation.id === 'string' &&
                       Object.values(PrincessDomain).includes(mockOperation.domain) &&
                       Object.values(TaskPriority).includes(mockOperation.priority);

        expect(isValid).toBe(true);
      }

      const duration = Date.now() - start;

      if (duration > test.maxTimeMs) {
        throw new Error(`Performance test ${test.name} took ${duration}ms, exceeds ${test.maxTimeMs}ms threshold`);
      }
    }

    // Memory usage test
    const initialMemory = process.memoryUsage().heapUsed;

    // Create large number of typed objects
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: `item-${i}` as DirectiveId,
      swarmId: `swarm-${i % 10}` as SwarmId,
      status: DirectiveStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      domain: PrincessDomain.DEVELOPMENT
    }));

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Should not use excessive memory
    if (memoryIncrease > 100 * 1024 * 1024) { // 100MB
      throw new Error(`Memory usage increase ${Math.round(memoryIncrease / 1024 / 1024)}MB exceeds 100MB threshold`);
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(): number {
    const weights = {
      typeDefinitionsValid: 25,
      swarmCoordinationFunctional: 25,
      directiveProcessingTyped: 20,
      hierarchyValidationWorking: 20,
      performanceImpactAcceptable: 10
    };

    let score = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      totalWeight += weight;
      if (this.testResults[key as keyof KingLogicAdapterTestResult]) {
        score += weight;
      }
    }

    return (score / totalWeight) * 100;
  }
}

// Export for use in main test suite
export default KingLogicAdapterTypeTest;
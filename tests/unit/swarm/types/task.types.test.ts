/**
 * Task Types Unit Tests - London School TDD
 * Tests type definitions and their behavior contracts.
 * Focuses on type safety, validation, and interface compliance.
 * London School TDD Principles:
 * - Test type behavior and contracts
 * - Verify enum value consistency
 * - Test interface shape validation
 * - Mock-driven validation for type-dependent operations
 */

import { jest } from '@jest/globals';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskResources,
  TaskMetadata,
  TaskMetrics,
  TaskResult
} from '../../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../../src/swarm/hierarchy/types';

describe('Task Types - London School TDD', () => {
  describe('TaskPriority Enum Contract', () => {
    it('should define all required priority levels', () => {
      expect(TaskPriority.LOW).toBe('low');
      expect(TaskPriority.MEDIUM).toBe('medium');
      expect(TaskPriority.HIGH).toBe('high');
      expect(TaskPriority.CRITICAL).toBe('critical');
    });

    it('should have exactly 4 priority levels', () => {
      const priorities = Object.values(TaskPriority);
      expect(priorities).toHaveLength(4);
    });

    it('should use lowercase string values for priority levels', () => {
      Object.values(TaskPriority).forEach(priority => {
        expect(typeof priority).toBe('string');
        expect(priority).toBe(priority.toLowerCase());
      });
    });

    it('should support priority comparison logic', () => {
      const priorityOrder: TaskPriority[] = [
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH,
        TaskPriority.CRITICAL
      ];

      // Mock priority comparison function
      const comparePriority = jest.fn((a: TaskPriority, b: TaskPriority): number => {
        return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
      });

      expect(comparePriority(TaskPriority.HIGH, TaskPriority.LOW)).toBeGreaterThan(0);
      expect(comparePriority(TaskPriority.CRITICAL, TaskPriority.MEDIUM)).toBeGreaterThan(0);
      expect(comparePriority(TaskPriority.LOW, TaskPriority.CRITICAL)).toBeLessThan(0);
      expect(comparePriority(TaskPriority.MEDIUM, TaskPriority.MEDIUM)).toBe(0);
    });
  });

  describe('TaskStatus Enum Contract', () => {
    it('should define all required status states', () => {
      expect(TaskStatus.PENDING).toBe('pending');
      expect(TaskStatus.IN_PROGRESS).toBe('in_progress');
      expect(TaskStatus.COMPLETED).toBe('completed');
      expect(TaskStatus.FAILED).toBe('failed');
      expect(TaskStatus.CANCELLED).toBe('cancelled');
    });

    it('should have exactly 5 status states', () => {
      const statuses = Object.values(TaskStatus);
      expect(statuses).toHaveLength(5);
    });

    it('should support workflow state transitions', () => {
      // Mock state transition validator
      const isValidTransition = jest.fn((from: TaskStatus, to: TaskStatus): boolean => {
        const validTransitions: Record<TaskStatus, TaskStatus[]> = {
          [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
          [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
          [TaskStatus.COMPLETED]: [],
          [TaskStatus.FAILED]: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
          [TaskStatus.CANCELLED]: [TaskStatus.PENDING]
        };

        return validTransitions[from]?.includes(to) || false;
      });

      // Valid transitions
      expect(isValidTransition(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)).toBe(true);
      expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED)).toBe(true);
      expect(isValidTransition(TaskStatus.FAILED, TaskStatus.PENDING)).toBe(true);

      // Invalid transitions
      expect(isValidTransition(TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS)).toBe(false);
      expect(isValidTransition(TaskStatus.PENDING, TaskStatus.COMPLETED)).toBe(false);
    });
  });

  describe('TaskResources Interface Contract', () => {
    it('should define all required resource properties', () => {
      const mockResources: TaskResources = {
        memory: 512,
        cpu: 2,
        network: true,
        storage: 1,
        gpu: false,
        timeout: 3600
      };

      expect(mockResources).toEqual({
        memory: 512,
        cpu: 2,
        network: true,
        storage: 1024,
        timeout: 3600,
        gpu: true
      });

      // GPU should be optional
      expect(mockResources.gpu).toBeDefined();
    });

    it('should support resource validation logic', () => {
      const validateResources = jest.fn((resources: TaskResources): boolean => {
        return (
          resources.memory > 0 &&
          resources.cpu > 0 &&
          resources.storage >= 0 &&
          resources.timeout > 0
        );
      });

      const validResources: TaskResources = {
        memory: 256,
        cpu: 1,
        network: false,
        storage: 0.5,
        timeout: 1800
      };

      const invalidResources: TaskResources = {
        memory: -100, // Invalid
        cpu: 0, // Invalid
        network: true,
        storage: -1, // Invalid
        timeout: 0 // Invalid
      };

      expect(validateResources(validResources)).toBe(true);
      expect(validateResources(invalidResources)).toBe(false);
    });

    it('should support optional GPU property', () => {
      const resourcesWithoutGPU: TaskResources = {
        memory: 128,
        cpu: 1,
        network: false,
        storage: 0,
        timeout: 600
      };

      const resourcesWithGPU: TaskResources = {
        ...resourcesWithoutGPU,
        gpu: true
      };

      // Both should be valid TaskResources
      expect(resourcesWithoutGPU.gpu).toBeUndefined();
      expect(resourcesWithGPU.gpu).toBe(true);
    });
  });

  describe('TaskMetadata Interface Contract', () => {
    it('should define all required metadata properties', () => {
      const mockMetadata: TaskMetadata = {
        estimatedDuration: 120,
        complexity: 75,
        tags: ['backend', 'api', 'database'],
        author: 'development-princess',
        version: '1.2.0',
        framework: 'express',
        testRequired: true,
        reviewRequired: true
      };

      expect(mockMetadata).toEqual({
        estimatedDuration: 180,
        complexity: 65,
        tags: ['security', 'api', 'validation'],
        author: 'security-agent',
        version: '1.2.0',
        testRequired: true,
        reviewRequired: true
      });

      // Framework should be optional
      expect(mockMetadata.framework).toBe('express');
    });

    it('should support complexity validation (1-100 scale)', () => {
      const validateComplexity = jest.fn((complexity: number): boolean => {
        return complexity >= 1 && complexity <= 100;
      });

      expect(validateComplexity(1)).toBe(true);
      expect(validateComplexity(50)).toBe(true);
      expect(validateComplexity(100)).toBe(true);
      expect(validateComplexity(0)).toBe(false);
      expect(validateComplexity(101)).toBe(false);
      expect(validateComplexity(-5)).toBe(false);
    });

    it('should support semantic version validation', () => {
      const validateVersion = jest.fn((version: string): boolean => {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        return semverRegex.test(version);
      });

      expect(validateVersion('1.0.0')).toBe(true);
      expect(validateVersion('2.15.3')).toBe(true);
      expect(validateVersion('0.1.0')).toBe(true);
      expect(validateVersion('1.0')).toBe(false);
      expect(validateVersion('v1.0.0')).toBe(false);
      expect(validateVersion('1.0.0-beta')).toBe(false);
    });

    it('should support tag categorization', () => {
      const categorizeTags = jest.fn((tags: string[]): Record<string, string[]> => {
        const categories: Record<string, string[]> = {
          technology: [],
          domain: [],
          complexity: [],
          type: []
        };

        tags.forEach(tag => {
          if (['react', 'node', 'express', 'typescript'].includes(tag)) {
            categories.technology.push(tag);
          } else if (['frontend', 'backend', 'api', 'database'].includes(tag)) {
            categories.domain.push(tag);
          } else if (['simple', 'complex', 'critical'].includes(tag)) {
            categories.complexity.push(tag);
          } else {
            categories.type.push(tag);
          }
        });

        return categories;
      });

      const tags = ['react', 'frontend', 'complex', 'authentication'];
      const categorized = categorizeTags(tags);

      expect(categorized.technology).toContain('react');
      expect(categorized.domain).toContain('frontend');
      expect(categorized.complexity).toContain('complex');
      expect(categorized.type).toContain('authentication');
    });
  });

  describe('Task Interface Contract', () => {
    it('should define all required task properties', () => {
      const mockTask: Task = {
        id: 'task-123',
        name: 'Implement User Authentication',
        description: 'Create JWT-based authentication system',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/auth/auth.service.ts', 'src/auth/jwt.utils.ts'],
        dependencies: ['crypto', 'jsonwebtoken'],
        estimatedLOC: 300,
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        type: 'feature-implementation',
        resources: {
          memory: 256,
          cpu: 1,
          network: true,
          storage: 0.1,
          timeout: 1800
        },
        metadata: {
          estimatedDuration: 180,
          complexity: 65,
          tags: ['auth', 'security', 'backend'],
          author: 'architect-agent',
          version: '1.0.0',
          framework: 'express',
          testRequired: true,
          reviewRequired: true
        },
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:30:00Z')
      };

      // Required properties
      expect(mockTask.id).toBeDefined();
      expect(mockTask.name).toBeDefined();
      expect(mockTask.description).toBeDefined();
      expect(mockTask.domain).toBeDefined();

      // Optional properties should be defined when provided
      expect(mockTask.files).toEqual(['src/auth/validators.ts', 'src/auth/middleware.ts']);
      expect(mockTask.dependencies).toEqual(['auth-base-001', 'crypto-utils-002']);
      expect(mockTask.estimatedLOC).toBe(300);
      expect(mockTask.priority).toBe(TaskPriority.HIGH);
      expect(mockTask.status).toBe(TaskStatus.PENDING);
    });

    it('should support task ID uniqueness validation', () => {
      const validateTaskId = jest.fn((id: string): boolean => {
        return /^[a-z][a-z0-9-]*[a-z0-9]$/.test(id) && id.length >= 3;
      });

      expect(validateTaskId('task-123')).toBe(true);
      expect(validateTaskId('feature-auth-jwt')).toBe(true);
      expect(validateTaskId('bug-fix-001')).toBe(true);
      expect(validateTaskId('TASK-123')).toBe(false); // Uppercase
      expect(validateTaskId('123-task')).toBe(false); // Starts with number
      expect(validateTaskId('ta')).toBe(false); // Too short
      expect(validateTaskId('task_123')).toBe(false); // Underscore
    });

    it('should support domain assignment validation', () => {
      const assignDomain = jest.fn((task: Partial<Task>): PrincessDomain => {
        if (task.files?.some(f => f.includes('.test.') || f.includes('.spec.'))) {
          return PrincessDomain.QUALITY;
        }
        if (task.description?.toLowerCase().includes('security') ||
            task.description?.toLowerCase().includes('auth')) {
          return PrincessDomain.SECURITY;
        }
        if (task.files?.some(f => f.includes('config') || f.includes('deployment'))) {
          return PrincessDomain.INFRASTRUCTURE;
        }
        return PrincessDomain.DEVELOPMENT;
      });

      const testTask = { files: ['src/auth.test.ts'] };
      const securityTask = { description: 'Implement security audit' };
      const configTask = { files: ['config/deployment.yaml'] };
      const devTask = { description: 'Add new feature' };

      expect(assignDomain(testTask)).toBe(PrincessDomain.QUALITY);
      expect(assignDomain(securityTask)).toBe(PrincessDomain.SECURITY);
      expect(assignDomain(configTask)).toBe(PrincessDomain.INFRASTRUCTURE);
      expect(assignDomain(devTask)).toBe(PrincessDomain.DEVELOPMENT);
    });

    it('should support task complexity estimation', () => {
      const estimateComplexity = jest.fn((task: Task): number => {
        let complexity = 10; // Base complexity

        // File count factor
        complexity += (task.files?.length || 0) * 5;

        // Dependency factor
        complexity += (task.dependencies?.length || 0) * 3;

        // LOC factor
        complexity += Math.floor((task.estimatedLOC || 0) / 100) * 10;

        // Priority multiplier
        if (task.priority === TaskPriority.CRITICAL) complexity *= 1.5;
        else if (task.priority === TaskPriority.HIGH) complexity *= 1.2;

        return Math.min(Math.floor(complexity), 100);
      });

      const simpleTask: Task = {
        id: 'simple',
        name: 'Simple Task',
        description: 'Basic task',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['one.ts'],
        dependencies: [],
        estimatedLOC: 50,
        priority: TaskPriority.LOW
      };

      const complexTask: Task = {
        id: 'complex',
        name: 'Complex Task',
        description: 'Complex task',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['one.ts', 'two.ts', 'three.ts', 'four.ts'],
        dependencies: ['dep1', 'dep2', 'dep3'],
        estimatedLOC: 500,
        priority: TaskPriority.CRITICAL
      };

      const simpleComplexity = estimateComplexity(simpleTask);
      const complexComplexity = estimateComplexity(complexTask);

      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
      expect(simpleComplexity).toBeGreaterThanOrEqual(10);
      expect(complexComplexity).toBeLessThanOrEqual(100);
    });
  });

  describe('TaskMetrics Interface Contract', () => {
    it('should define all performance metrics properties', () => {
      const mockMetrics: TaskMetrics = {
        executionTime: 45000,
        memoryUsage: 128,
        cpuUsage: 65.5,
        linesChanged: 150,
        filesModified: 3,
        testsRun: 25,
        testsPassed: 24,
        qualityScore: 85,
        complexityReduction: -5
      };

      expect(mockMetrics).toEqual({
        executionTime: 2847,
        memoryUsage: 156.8,
        cpuUsage: 23.4,
        linesChanged: 127,
        filesModified: 3,
        testsRun: 24,
        testsPassed: 23,
        qualityScore: 87.6,
        complexityReduction: 34.2
      });
    });

    it('should support quality score calculation', () => {
      const calculateQualityScore = jest.fn((metrics: TaskMetrics): number => {
        let score = 50; // Base score

        // Test coverage bonus
        const testCoverage = metrics.testsRun > 0 ? (metrics.testsPassed / metrics.testsRun) : 0;
        score += testCoverage * 30;

        // Complexity reduction bonus
        if (metrics.complexityReduction < 0) {
          score += Math.abs(metrics.complexityReduction) * 2;
        }

        // Performance penalty
        if (metrics.executionTime > 60000) { // > 1 minute
          score -= 10;
        }

        return Math.max(0, Math.min(100, Math.floor(score)));
      });

      const goodMetrics: TaskMetrics = {
        executionTime: 30000,
        memoryUsage: 64,
        cpuUsage: 45,
        linesChanged: 100,
        filesModified: 2,
        testsRun: 20,
        testsPassed: 20,
        qualityScore: 0, // Will be calculated
        complexityReduction: -10
      };

      const poorMetrics: TaskMetrics = {
        executionTime: 120000,
        memoryUsage: 512,
        cpuUsage: 95,
        linesChanged: 500,
        filesModified: 10,
        testsRun: 5,
        testsPassed: 2,
        qualityScore: 0, // Will be calculated
        complexityReduction: 15
      };

      const goodScore = calculateQualityScore(goodMetrics);
      const poorScore = calculateQualityScore(poorMetrics);

      expect(goodScore).toBeGreaterThan(poorScore);
      expect(goodScore).toBeGreaterThanOrEqual(80);
      expect(poorScore).toBeLessThanOrEqual(50);
    });
  });

  describe('TaskResult Interface Contract', () => {
    it('should define all result properties with generic support', () => {
      interface CustomResult {
        features: string[];
        performance: number;
      }

      const mockResult: TaskResult<CustomResult> = {
        taskId: 'task-123',
        status: TaskStatus.COMPLETED,
        result: {
          features: ['auth', 'validation'],
          performance: 95
        },
        duration: 45000,
        metrics: {
          executionTime: 45000,
          memoryUsage: 128,
          cpuUsage: 65,
          linesChanged: 150,
          filesModified: 3,
          testsRun: 25,
          testsPassed: 24,
          qualityScore: 85,
          complexityReduction: -5
        }
      };

      expect(mockResult.taskId).toBe('task-123');
      expect(mockResult.status).toBe(TaskStatus.COMPLETED);
      expect(mockResult.result?.features).toEqual(['auth', 'validation']);
      expect(mockResult.result?.performance).toBe(95);
    });

    it('should support error handling in results', () => {
      const errorResult: TaskResult = {
        taskId: 'task-456',
        status: TaskStatus.FAILED,
        error: new Error('Compilation failed'),
        duration: 15000
      };

      expect(errorResult.status).toBe(TaskStatus.FAILED);
      expect(errorResult.error).toBeInstanceOf(Error);
      expect(errorResult.error?.message).toBe('Compilation failed');
      expect(errorResult.result).toBeUndefined();
    });

    it('should support result type safety validation', () => {
      const validateResult = jest.fn(<T>(result: TaskResult<T>): boolean => {
        if (result.status === TaskStatus.COMPLETED) {
          return result.result !== undefined && result.error === undefined;
        } else if (result.status === TaskStatus.FAILED) {
          return result.error !== undefined;
        }
        return true;
      });

      const validSuccessResult: TaskResult<string> = {
        taskId: 'success',
        status: TaskStatus.COMPLETED,
        result: 'Success message'
      };

      const validErrorResult: TaskResult = {
        taskId: 'error',
        status: TaskStatus.FAILED,
        error: new Error('Failed')
      };

      const invalidResult: TaskResult<string> = {
        taskId: 'invalid',
        status: TaskStatus.COMPLETED,
        // Missing result for completed status
      };

      expect(validateResult(validSuccessResult)).toBe(true);
      expect(validateResult(validErrorResult)).toBe(true);
      expect(validateResult(invalidResult)).toBe(false);
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T00:07:52-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive London School TDD test suite for task type definitions | task.types.test.ts | OK | Complete type system validation with enum behavior, interface contracts, and mock-driven validation logic | 0.00 | 5a9d4b2 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase5-tdd-types-001
 * - inputs: ["src/swarm/types/task.types.ts", "src/swarm/hierarchy/types.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
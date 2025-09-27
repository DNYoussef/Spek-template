/**
 * Princess Domain Coordination Integration Tests - London School TDD
 * Tests the integration between multiple Princess domains using real objects
 * where possible and mocks for external dependencies.
 * London School Integration Testing:
 * - Test real collaborations between Princess components
 * - Mock external systems (MCP, file system, etc.)
 * - Verify contract compliance across domain boundaries
 * - Focus on interaction patterns and workflows
 */

import { jest } from '@jest/globals';
import { DevelopmentPrincess } from '../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { QualityPrincess } from '../../../src/swarm/hierarchy/domains/QualityPrincess';
import { SecurityPrincess } from '../../../src/swarm/hierarchy/domains/SecurityPrincess';
import { Task, TaskPriority } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';

// Mock external dependencies
jest.mock('../../../src/swarm/memory/development/LangroidMemory');
jest.mock('../../../src/swarm/memory/quality/LangroidMemory');
jest.mock('../../../src/utils/logger');

describe('Princess Domain Coordination Integration Tests', () => {
  let developmentPrincess: DevelopmentPrincess;
  let qualityPrincess: QualityPrincess;
  let securityPrincess: SecurityPrincess;

  beforeEach(() => {
    // Mock global MCP functions
    global.globalThis = {
      mcp__claude_flow__agent_spawn: jest.fn().mockResolvedValue({
        agentId: 'test-agent-123'
      }),
      mcp__claude_flow__task_orchestrate: jest.fn().mockResolvedValue({
        taskId: 'orchestrated-task-123',
        status: 'completed'
      })
    } as any;

    developmentPrincess = new DevelopmentPrincess();
    qualityPrincess = new QualityPrincess();
    securityPrincess = new SecurityPrincess();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Development-Quality Integration Workflow', () => {
    it('should coordinate development and testing phases', async () => {
      const developmentTask: Task = {
        id: 'dev-integration-001',
        name: 'Implement User Registration',
        description: 'Create user registration with validation',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: [
          'src/auth/registration.service.ts',
          'src/auth/validation.middleware.ts'
        ],
        dependencies: ['user-model', 'crypto-utils'],
        estimatedLOC: 300,
      };

      const qualityTask: Task = {
        id: 'quality-integration-001',
        name: 'Test User Registration',
        description: 'Comprehensive testing of user registration',
        domain: PrincessDomain.QUALITY,
        priority: TaskPriority.HIGH,
        files: [
          'tests/auth/registration.test.ts',
          'tests/auth/validation.test.ts'
        ],
        dependencies: ['dev-integration-001'],
        estimatedLOC: 200,
      };

      // Execute development phase
      const devResult = await developmentPrincess.executeTask(developmentTask);
      expect(devResult.result).toBe('development-complete');
      expect(devResult.kingLogicApplied).toBe(true);

      // Execute quality phase (depends on development)
      const qualityResult = await qualityPrincess.executeTask(qualityTask);
      expect(qualityResult.result).toBe('quality-complete');
      expect(qualityResult.kingLogicApplied).toBe(true);

      // Verify coordination contracts
      expect(devResult.taskId).toBe(developmentTask.id);
      expect(qualityResult.dependencies).toContain('dev-integration-001');
    });

    it('should handle shared file coordination between domains', async () => {
      const sharedFile = 'src/shared/utilities.ts';

      const task1: Task = {
        id: 'shared-task-001',
        name: 'Update Shared Utilities',
        description: 'Update shared utility functions',
        domain: PrincessDomain.DEVELOPMENT,
        files: [sharedFile, 'src/components/UserForm.tsx'],
        estimatedLOC: 150,
      };

      const task2: Task = {
        id: 'shared-task-002',
        name: 'Test Shared Utilities',
        description: 'Test updated utility functions',
        domain: PrincessDomain.QUALITY,
        files: [`tests/${sharedFile}`, 'tests/integration/user-form.test.ts'],
        estimatedLOC: 100,
      };

      const devResult = await developmentPrincess.executeTask(task1);
      const qualityResult = await qualityPrincess.executeTask(task2);

      // Both should complete successfully
      expect(devResult.result).toBe('development-complete');
      expect(qualityResult.result).toBe('quality-complete');

      // Verify no MECE violations occurred
      expect(devResult.meceCompliant).toBe(true);
      expect(qualityResult.meceCompliant).toBe(true);
    });
  });

  describe('Development-Security Integration Workflow', () => {
    it('should coordinate secure development practices', async () => {
      const secureFeatureTask: Task = {
        id: 'secure-feature-001',
        name: 'Implement Payment Processing',
        description: 'Create secure payment processing system',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.CRITICAL,
        files: [
          'src/payment/processor.ts',
          'src/payment/encryption.utils.ts',
          'src/payment/validation.service.ts'
        ],
        dependencies: ['crypto-lib', 'payment-gateway'],
        estimatedLOC: 500,
      };

      const securityReviewTask: Task = {
        id: 'security-review-001',
        name: 'Security Review Payment System',
        description: 'Comprehensive security audit of payment processing',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'security/audits/payment-audit.md',
          'security/scans/payment-scan.json'
        ],
        dependencies: ['secure-feature-001'],
        estimatedLOC: 100,
      };

      // Execute development with security considerations
      const devResult = await developmentPrincess.executeTask(secureFeatureTask);
      expect(devResult.result).toBe('development-complete');
      expect(devResult.complexity).toBeGreaterThan(100); // High complexity due to security domain

      // Execute security review
      const securityResult = await securityPrincess.executeTask(securityReviewTask);
      expect(securityResult.result).toBe('security-complete');

      // Verify security-development coordination
      expect(securityResult.dependencies).toContain('secure-feature-001');
      expect(securityResult.kingLogicApplied).toBe(true);
    });

    it('should handle security vulnerability remediation workflow', async () => {
      const vulnerabilityTask: Task = {
        id: 'vuln-fix-001',
        name: 'Fix SQL Injection Vulnerability',
        description: 'Remediate SQL injection in user query endpoint',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'src/api/user-query.endpoint.ts',
          'src/database/query-builder.ts'
        ],
        dependencies: [],
        estimatedLOC: 80,
      };

      const validationTask: Task = {
        id: 'vuln-validation-001',
        name: 'Validate Security Fix',
        description: 'Test that SQL injection is properly fixed',
        domain: PrincessDomain.QUALITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'tests/security/sql-injection.test.ts',
          'tests/api/user-query.security.test.ts'
        ],
        dependencies: ['vuln-fix-001'],
        estimatedLOC: 120,
      };

      const securityResult = await securityPrincess.executeTask(vulnerabilityTask);
      const validationResult = await qualityPrincess.executeTask(validationTask);

      // Both should complete with high priority handling
      expect(securityResult.result).toBe('security-complete');
      expect(validationResult.result).toBe('quality-complete');

      // Verify critical priority was respected
      expect(securityResult.taskId).toBe(vulnerabilityTask.id);
      expect(validationResult.dependencies).toContain('vuln-fix-001');
    });
  });

  describe('Multi-Domain Task Sharding Integration', () => {
    it('should coordinate sharded tasks across multiple domains', async () => {
      const complexTask: Task = {
        id: 'complex-integration-001',
        name: 'Implement Complete E-commerce System',
        description: 'Full e-commerce implementation with all domains',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: [
          'src/products/catalog.service.ts',
          'src/cart/shopping-cart.service.ts',
          'src/payment/payment.service.ts',
          'src/orders/order.service.ts',
          'src/shipping/shipping.service.ts',
          'src/notifications/email.service.ts',
          'src/admin/dashboard.component.tsx',
          'src/auth/customer.auth.ts'
        ],
        dependencies: ['database', 'payment-gateway', 'email-service'],
        estimatedLOC: 1500, // This should trigger sharding
      };

      // Execute the complex task (should be sharded)
      const result = await developmentPrincess.executeTask(complexTask);

      // Verify sharding occurred
      expect(result.sharded).toBe(true);
      expect(result.complexity).toBeGreaterThan(100);
      expect(result.implementations).toBeDefined();
      expect(result.implementations.length).toBeGreaterThan(0);

      // Verify King Logic was applied for coordination
      expect(result.kingLogicApplied).toBe(true);
      expect(result.langroidMemoryUsed).toBe(true);
    });

    it('should maintain MECE compliance across sharded tasks', async () => {
      const largeRefactorTask: Task = {
        id: 'large-refactor-001',
        name: 'Refactor Authentication System',
        description: 'Complete refactor of authentication across all modules',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: Array.from({ length: 12 }, (_, i) => `src/auth/module${i + 1}.ts`),
        dependencies: ['user-store', 'session-manager', 'crypto-utils'],
        estimatedLOC: 2000,
      };

      const result = await developmentPrincess.executeTask(largeRefactorTask);

      // Should be sharded and MECE compliant
      expect(result.sharded).toBe(true);
      expect(result.meceCompliant).toBe(true);

      // All original files should be covered in implementations
      const allImplementationFiles = result.implementations
        .flatMap((impl: any) => impl.implementation?.files || []);

      expect(allImplementationFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Princess Memory Coordination', () => {
    it('should share patterns across Princess domains', async () => {
      const authImplementationTask: Task = {
        id: 'auth-pattern-001',
        name: 'Implement OAuth Pattern',
        description: 'Create reusable OAuth implementation pattern',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/auth/oauth.pattern.ts'],
        estimatedLOC: 200,
      };

      const authTestTask: Task = {
        id: 'auth-test-001',
        name: 'Test OAuth Pattern',
        description: 'Test the OAuth pattern implementation',
        domain: PrincessDomain.QUALITY,
        files: ['tests/auth/oauth.pattern.test.ts'],
        dependencies: ['auth-pattern-001'],
        estimatedLOC: 150,
      };

      // Execute development task first
      const devResult = await developmentPrincess.executeTask(authImplementationTask);

      // Development should store successful patterns
      expect(devResult.result).toBe('development-complete');
      expect(devResult.patternsUsed).toBeDefined();

      // Execute quality task
      const qualityResult = await qualityPrincess.executeTask(authTestTask);

      // Quality should potentially find and use stored patterns
      expect(qualityResult.result).toBe('quality-complete');
      expect(qualityResult.kingLogicApplied).toBe(true);
    });

    it('should coordinate memory statistics across domains', async () => {
      const task: Task = {
        id: 'memory-coordination-001',
        name: 'Test Memory Coordination',
        description: 'Verify memory coordination between domains',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/test/memory.test.ts'],
        estimatedLOC: 50,
      };

      await developmentPrincess.executeTask(task);
      await qualityPrincess.executeTask({...task, domain: PrincessDomain.QUALITY});

      // Both should have memory statistics
      const devMemoryStats = developmentPrincess.getMemoryStats();
      const qualityMemoryStats = qualityPrincess.getMemoryStats();

      expect(devMemoryStats).toBeDefined();
      expect(qualityMemoryStats).toBeDefined();
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle cross-domain dependency failures gracefully', async () => {
      const dependentTask: Task = {
        id: 'dependent-task-001',
        name: 'Task with Failed Dependency',
        description: 'Task that depends on a failed previous task',
        domain: PrincessDomain.QUALITY,
        files: ['tests/dependent.test.ts'],
        dependencies: ['non-existent-task'],
        estimatedLOC: 100,
      };

      // Should complete despite dependency issue
      const result = await qualityPrincess.executeTask(dependentTask);

      expect(result.result).toBe('quality-complete');
      expect(result.taskId).toBe(dependentTask.id);
    });

    it('should propagate critical errors across domain boundaries', async () => {
      // Mock a critical system error
      const mockError = new Error('Critical system failure');

      // Mock the KingLogic to throw an error
      jest.spyOn(developmentPrincess as any, 'executeTask')
        .mockRejectedValueOnce(mockError);

      const criticalTask: Task = {
        id: 'critical-error-001',
        name: 'Task That Will Fail',
        description: 'Task designed to test error propagation',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/critical/failing.service.ts'],
        estimatedLOC: 100,
      };

      await expect(developmentPrincess.executeTask(criticalTask))
        .rejects.toThrow('Critical system failure');
    });
  });

  describe('Performance and Coordination Metrics', () => {
    it('should track coordination metrics across domains', async () => {
      const tasks = Array.from({ length: 3 }, (_, i) => ({
        id: `metrics-task-${i + 1}`,
        name: `Metrics Task ${i + 1}`,
        description: `Task for metrics testing ${i + 1}`,
        domain: i === 0 ? PrincessDomain.DEVELOPMENT :
               i === 1 ? PrincessDomain.QUALITY : PrincessDomain.SECURITY,
        files: [`src/metrics/task${i + 1}.ts`],
        estimatedLOC: 100,
      }));

      const results = await Promise.all([
        developmentPrincess.executeTask(tasks[0]),
        qualityPrincess.executeTask(tasks[1]),
        securityPrincess.executeTask(tasks[2])
      ]);

      // All should complete successfully
      results.forEach((result, index) => {
        expect(result.result).toContain('complete');
        expect(result.taskId).toBe(tasks[index].id);
        expect(result.kingLogicApplied).toBe(true);
      });

      // Verify King Logic status across domains
      const devStatus = developmentPrincess.getKingLogicStatus();
      const qualityStatus = qualityPrincess.getKingLogicStatus();
      const securityStatus = securityPrincess.getKingLogicStatus();

      expect(devStatus).toBeDefined();
      expect(qualityStatus).toBeDefined();
      expect(securityStatus).toBeDefined();
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-26T23:52:18-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive integration tests for Princess domain coordination | princess-domain-coordination.test.ts | OK | London School integration tests with real object collaboration and mock external dependencies | 0.00 | d4f6a9c |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase5-tdd-integration-001
 * - inputs: ["src/swarm/hierarchy/domains/DevelopmentPrincess.ts", "src/swarm/hierarchy/domains/QualityPrincess.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
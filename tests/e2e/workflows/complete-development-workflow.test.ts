/**
 * Complete Development Workflow E2E Tests - London School TDD
 * Tests end-to-end workflows using real object collaboration where possible
 * and strategic mocking for external systems.
 * London School E2E Testing:
 * - Test complete user journeys and workflows
 * - Mock external systems (file system, network, MCP servers)
 * - Use real objects for internal collaborations
 * - Verify behavioral contracts across the entire system
 */

import { jest } from '@jest/globals';
import { DevelopmentPrincess } from '../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { QualityPrincess } from '../../../src/swarm/hierarchy/domains/QualityPrincess';
import { SecurityPrincess } from '../../../src/swarm/hierarchy/domains/SecurityPrincess';
import { KingLogicAdapter } from '../../../src/swarm/queen/KingLogicAdapter';
import { Task, TaskPriority, TaskStatus } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';

// Mock external dependencies
jest.mock('../../../src/swarm/memory/development/LangroidMemory');
jest.mock('../../../src/swarm/memory/quality/LangroidMemory');
jest.mock('../../../src/utils/logger');

describe('Complete Development Workflow E2E Tests', () => {
  let developmentPrincess: DevelopmentPrincess;
  let qualityPrincess: QualityPrincess;
  let securityPrincess: SecurityPrincess;
  let kingLogic: KingLogicAdapter;

  beforeEach(() => {
    // Mock global MCP functions for external system interactions
    global.globalThis = {
      mcp__claude_flow__agent_spawn: jest.fn().mockResolvedValue({
        agentId: 'workflow-agent-123',
        status: 'active'
      }),
      mcp__claude_flow__task_orchestrate: jest.fn().mockResolvedValue({
        taskId: 'orchestrated-workflow-123',
        status: 'in_progress',
        agents: ['dev-1', 'qa-1', 'sec-1']
      }),
      mcp__claude_flow__swarm_status: jest.fn().mockResolvedValue({
        totalAgents: 3,
        activeAgents: 3,
        coordinationHealth: 'excellent'
      })
    } as any;

    // Initialize real objects for internal collaboration
    developmentPrincess = new DevelopmentPrincess();
    qualityPrincess = new QualityPrincess();
    securityPrincess = new SecurityPrincess();
    kingLogic = new KingLogicAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Development Lifecycle E2E', () => {
    it('should execute complete feature development from specification to deployment', async () => {
      // Arrange: Create a complex feature task
      const featureTask: Task = {
        id: 'feature-user-dashboard-001',
        name: 'Implement User Dashboard',
        description: 'Create comprehensive user dashboard with analytics, settings, and notifications',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: [
          'src/dashboard/components/Dashboard.tsx',
          'src/dashboard/components/Analytics.tsx',
          'src/dashboard/components/UserSettings.tsx',
          'src/dashboard/components/Notifications.tsx',
          'src/dashboard/services/dashboard.service.ts',
          'src/dashboard/stores/dashboard.store.ts',
          'src/dashboard/types/dashboard.types.ts',
          'src/api/endpoints/dashboard.api.ts'
        ],
        dependencies: [
          'user-service',
          'analytics-service',
          'notification-service',
          'state-management'
        ],
        estimatedLOC: 1200,
        metadata: {
          estimatedDuration: 480, // 8 hours
          complexity: 85,
          tags: ['frontend', 'dashboard', 'analytics', 'user-experience'],
          author: 'product-manager',
          version: '1.0.0',
          framework: 'react',
          testRequired: true,
          reviewRequired: true
        }
      };

      // Act & Assert: Execute complete development workflow

      // Phase 1: Development Princess handles implementation
      console.log('Phase 1: Development Implementation');
      const devResult = await developmentPrincess.executeTask(featureTask);

      expect(devResult.result).toBe('development-complete');
      expect(devResult.kingLogicApplied).toBe(true);
      expect(devResult.langroidMemoryUsed).toBe(true);

      // Verify task complexity analysis and potential sharding
      if (devResult.sharded) {
        expect(devResult.implementations).toBeDefined();
        expect(devResult.implementations.length).toBeGreaterThan(1);
        console.log(`Task was sharded into ${devResult.implementations.length} parts`);
      }

      // Phase 2: Create quality assurance tasks
      console.log('Phase 2: Quality Assurance');
      const qaTask: Task = {
        id: 'qa-user-dashboard-001',
        name: 'Test User Dashboard',
        description: 'Comprehensive testing of user dashboard functionality',
        domain: PrincessDomain.QUALITY,
        priority: TaskPriority.HIGH,
        files: [
          'tests/dashboard/Dashboard.test.tsx',
          'tests/dashboard/Analytics.test.tsx',
          'tests/dashboard/UserSettings.test.tsx',
          'tests/dashboard/dashboard.service.test.ts',
          'tests/dashboard/dashboard.integration.test.ts',
          'tests/e2e/dashboard-workflow.e2e.test.ts'
        ],
        dependencies: ['feature-user-dashboard-001'],
        estimatedLOC: 800,
        metadata: {
          estimatedDuration: 360, // 6 hours
          complexity: 70,
          tags: ['testing', 'e2e', 'integration', 'unit-tests'],
          author: 'qa-lead',
          version: '1.0.0',
          framework: 'jest',
          testRequired: false, // It's a test task
          reviewRequired: true
        }
      };

      const qaResult = await qualityPrincess.executeTask(qaTask);

      expect(qaResult.result).toBe('quality-complete');
      expect(qaResult.kingLogicApplied).toBe(true);
      expect(qaResult.dependencies).toContain('feature-user-dashboard-001');

      // Phase 3: Security review for user data handling
      console.log('Phase 3: Security Review');
      const securityTask: Task = {
        id: 'security-dashboard-review-001',
        name: 'Security Review: User Dashboard',
        description: 'Security audit of user dashboard for data protection and access control',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.HIGH,
        files: [
          'security/audits/dashboard-security-audit.md',
          'security/scans/dashboard-vulnerability-scan.json',
          'security/compliance/dashboard-gdpr-compliance.md'
        ],
        dependencies: ['feature-user-dashboard-001', 'qa-user-dashboard-001'],
        estimatedLOC: 200,
        metadata: {
          estimatedDuration: 240, // 4 hours
          complexity: 60,
          tags: ['security', 'audit', 'gdpr', 'data-protection'],
          author: 'security-specialist',
          version: '1.0.0',
          testRequired: false,
          reviewRequired: true
        }
      };

      const securityResult = await securityPrincess.executeTask(securityTask);

      expect(securityResult.result).toBe('security-complete');
      expect(securityResult.dependencies).toEqual(
        expect.arrayContaining(['feature-user-dashboard-001', 'qa-user-dashboard-001'])
      );

      // Phase 4: Verify workflow coordination
      console.log('Phase 4: Workflow Coordination Verification');
      expect(global.globalThis.mcp__claude_flow__agent_spawn).toHaveBeenCalledTimes(3);

      // Verify all phases completed successfully
      const allResults = [devResult, qaResult, securityResult];
      allResults.forEach((result, index) => {
        expect(result.result).toContain('complete');
        expect(result.kingLogicApplied).toBe(true);
        console.log(`Phase ${index + 1} completed: ${result.result}`);
      });

      // Verify task dependency chain
      expect(qaResult.dependencies).toContain(featureTask.id);
      expect(securityResult.dependencies).toContain(featureTask.id);
      expect(securityResult.dependencies).toContain(qaTask.id);
    });

    it('should handle complex task sharding across multiple domains', async () => {
      // Arrange: Create a very complex task that requires sharding
      const complexMicroserviceTask: Task = {
        id: 'microservice-refactor-001',
        name: 'Refactor Monolith to Microservices',
        description: 'Complete refactoring of monolithic application into 6 microservices',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.CRITICAL,
        files: Array.from({ length: 20 }, (_, i) => `src/services/service${i + 1}.ts`)
          .concat(Array.from({ length: 15 }, (_, i) => `src/api/endpoints/endpoint${i + 1}.ts`))
          .concat(Array.from({ length: 10 }, (_, i) => `src/database/migrations/migration${i + 1}.sql`)),
        dependencies: [
          'database-redesign',
          'api-gateway',
          'service-discovery',
          'load-balancer',
          'monitoring-system',
          'logging-system'
        ],
        estimatedLOC: 3500, // This should definitely trigger sharding
        metadata: {
          estimatedDuration: 960, // 16 hours
          complexity: 95,
          tags: ['microservices', 'architecture', 'refactoring', 'distributed-systems'],
          author: 'chief-architect',
          version: '2.0.0',
          framework: 'node-express',
          testRequired: true,
          reviewRequired: true
        }
      };

      // Act: Execute complex task
      const result = await developmentPrincess.executeTask(complexMicroserviceTask);

      // Assert: Verify sharding occurred
      expect(result.sharded).toBe(true);
      expect(result.implementations).toBeDefined();
      expect(result.implementations.length).toBeGreaterThan(1);
      expect(result.complexity).toBeGreaterThan(100); // High complexity threshold

      // Verify MECE compliance across shards
      expect(result.meceCompliant).toBe(true);

      // Verify King Logic coordination for complex tasks
      expect(result.kingLogicApplied).toBe(true);

      console.log(`Complex task sharded into ${result.implementations.length} implementations`);
      console.log(`Task complexity: ${result.complexity}`);
      console.log(`MECE compliant: ${result.meceCompliant}`);
    });
  });

  describe('Bug Fix and Hotfix Workflow E2E', () => {
    it('should execute critical bug fix workflow with security validation', async () => {
      // Arrange: Critical security vulnerability
      const criticalBugTask: Task = {
        id: 'hotfix-sql-injection-001',
        name: 'Fix SQL Injection Vulnerability',
        description: 'Emergency fix for SQL injection in user search endpoint',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'src/api/user/search.endpoint.ts',
          'src/database/queries/user.queries.ts',
          'src/middleware/input-validation.middleware.ts'
        ],
        dependencies: ['database-connection', 'validation-library'],
        estimatedLOC: 150,
        metadata: {
          estimatedDuration: 120, // 2 hours - urgent
          complexity: 75,
          tags: ['security', 'hotfix', 'sql-injection', 'vulnerability'],
          author: 'security-incident-response',
          version: '1.0.1',
          framework: 'express',
          testRequired: true,
          reviewRequired: true
        }
      };

      // Act: Execute security fix workflow

      // Phase 1: Security Princess handles critical fix
      const securityFixResult = await securityPrincess.executeTask(criticalBugTask);

      expect(securityFixResult.result).toBe('security-complete');
      expect(securityFixResult.taskId).toBe(criticalBugTask.id);

      // Phase 2: Quality validation of security fix
      const validationTask: Task = {
        id: 'validate-sql-injection-fix-001',
        name: 'Validate SQL Injection Fix',
        description: 'Comprehensive testing to ensure SQL injection vulnerability is resolved',
        domain: PrincessDomain.QUALITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'tests/security/sql-injection.test.ts',
          'tests/security/penetration-test.ts',
          'tests/api/user-search.security.test.ts'
        ],
        dependencies: ['hotfix-sql-injection-001'],
        estimatedLOC: 200,
        metadata: {
          estimatedDuration: 180, // 3 hours
          complexity: 65,
          tags: ['security-testing', 'penetration-testing', 'validation'],
          author: 'security-qa',
          version: '1.0.1',
          testRequired: false,
          reviewRequired: true
        }
      };

      const validationResult = await qualityPrincess.executeTask(validationTask);

      expect(validationResult.result).toBe('quality-complete');
      expect(validationResult.dependencies).toContain('hotfix-sql-injection-001');

      // Phase 3: Development deployment preparation
      const deploymentTask: Task = {
        id: 'deploy-security-fix-001',
        name: 'Deploy Security Fix',
        description: 'Prepare and validate deployment of SQL injection fix',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.CRITICAL,
        files: [
          'deployment/hotfix-deploy.yaml',
          'scripts/security-deployment.sh',
          'docs/hotfix-deployment-guide.md'
        ],
        dependencies: ['hotfix-sql-injection-001', 'validate-sql-injection-fix-001'],
        estimatedLOC: 100,
        metadata: {
          estimatedDuration: 90, // 1.5 hours
          complexity: 45,
          tags: ['deployment', 'hotfix', 'production'],
          author: 'deployment-team',
          version: '1.0.1',
          testRequired: true,
          reviewRequired: true
        }
      };

      const deploymentResult = await developmentPrincess.executeTask(deploymentTask);

      expect(deploymentResult.result).toBe('development-complete');
      expect(deploymentResult.dependencies).toEqual(
        expect.arrayContaining(['hotfix-sql-injection-001', 'validate-sql-injection-fix-001'])
      );

      // Verify critical priority handling
      [securityFixResult, validationResult, deploymentResult].forEach(result => {
        expect(result.taskId).toBeDefined();
        expect(result.result).toContain('complete');
      });

      console.log('Critical security fix workflow completed successfully');
    });
  });

  describe('Cross-Domain Memory and Pattern Sharing E2E', () => {
    it('should share successful patterns across Princess domains', async () => {
      // Arrange: Create a pattern that should be reusable
      const authPatternTask: Task = {
        id: 'auth-pattern-implementation-001',
        name: 'Implement OAuth2 Pattern',
        description: 'Create reusable OAuth2 authentication pattern with PKCE',
        domain: PrincessDomain.DEVELOPMENT,
        files: [
          'src/auth/oauth2.pattern.ts',
          'src/auth/pkce.utils.ts',
          'src/auth/token.manager.ts'
        ],
        estimatedLOC: 400,
        metadata: {
          tags: ['oauth2', 'authentication', 'pattern', 'reusable'],
          framework: 'typescript'
        }
      };

      // Act: Execute pattern creation
      const patternResult = await developmentPrincess.executeTask(authPatternTask);

      expect(patternResult.result).toBe('development-complete');
      expect(patternResult.patternsUsed).toBeDefined();

      // Create similar task in different domain
      const authTestTask: Task = {
        id: 'auth-pattern-testing-001',
        name: 'Test OAuth2 Pattern',
        description: 'Comprehensive testing of OAuth2 pattern implementation',
        domain: PrincessDomain.QUALITY,
        files: [
          'tests/auth/oauth2.pattern.test.ts',
          'tests/auth/integration/oauth2-flow.test.ts'
        ],
        dependencies: ['auth-pattern-implementation-001'],
        estimatedLOC: 300,
        metadata: {
          tags: ['oauth2', 'testing', 'authentication']
        }
      };

      const testResult = await qualityPrincess.executeTask(authTestTask);

      expect(testResult.result).toBe('quality-complete');
      expect(testResult.kingLogicApplied).toBe(true);

      // Verify pattern sharing through memory systems
      const devMemoryStats = developmentPrincess.getMemoryStats();
      const qualityMemoryStats = qualityPrincess.getMemoryStats();

      expect(devMemoryStats).toBeDefined();
      expect(qualityMemoryStats).toBeDefined();

      console.log('Pattern sharing workflow completed successfully');
    });
  });

  describe('Performance and Scalability E2E', () => {
    it('should handle multiple concurrent workflows efficiently', async () => {
      // Arrange: Create multiple independent tasks
      const concurrentTasks: Task[] = [
        {
          id: 'concurrent-task-1',
          name: 'Feature A Development',
          description: 'Implement feature A',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/features/a.ts'],
          estimatedLOC: 200
        },
        {
          id: 'concurrent-task-2',
          name: 'Feature B Testing',
          description: 'Test feature B',
          domain: PrincessDomain.QUALITY,
          files: ['tests/features/b.test.ts'],
          estimatedLOC: 150
        },
        {
          id: 'concurrent-task-3',
          name: 'Security Audit C',
          description: 'Audit feature C',
          domain: PrincessDomain.SECURITY,
          files: ['security/audits/c-audit.md'],
          estimatedLOC: 100
        }
      ];

      // Act: Execute tasks concurrently
      const startTime = Date.now();
      const results = await Promise.all([
        developmentPrincess.executeTask(concurrentTasks[0]),
        qualityPrincess.executeTask(concurrentTasks[1]),
        securityPrincess.executeTask(concurrentTasks[2])
      ]);
      const endTime = Date.now();

      // Assert: Verify all tasks completed successfully
      results.forEach((result, index) => {
        expect(result.result).toContain('complete');
        expect(result.taskId).toBe(concurrentTasks[index].id);
      });

      const executionTime = endTime - startTime;
      console.log(`Concurrent execution completed in ${executionTime}ms`);

      // Verify concurrent execution was efficient (should be much faster than sequential)
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Recovery and Resilience E2E', () => {
    it('should recover gracefully from agent failures', async () => {
      // Arrange: Create a task that might fail
      const problematicTask: Task = {
        id: 'failure-prone-task-001',
        name: 'Complex Integration Task',
        description: 'Task that may encounter various failure modes',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/complex/integration.ts'],
        estimatedLOC: 300
      };

      // Act: Mock a partial failure scenario
      const mockAgentSpawn = global.globalThis.mcp__claude_flow__agent_spawn as jest.MockedFunction<any>;
      mockAgentSpawn
        .mockRejectedValueOnce(new Error('Agent spawn failed'))
        .mockResolvedValueOnce({ agentId: 'backup-agent-123' });

      // Execute task (should recover from first failure)
      const result = await developmentPrincess.executeTask(problematicTask);

      // Assert: Task should still complete despite initial failure
      expect(result.result).toBe('development-complete');
      expect(result.taskId).toBe(problematicTask.id);

      // Verify recovery attempt was made
      expect(mockAgentSpawn).toHaveBeenCalledTimes(2);

      console.log('Error recovery workflow completed successfully');
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T00:15:28-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive E2E workflow tests for complete development lifecycle | complete-development-workflow.test.ts | OK | Full end-to-end testing with real object collaboration and strategic external mocking | 0.00 | 9f1e6d4 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase5-tdd-e2e-001
 * - inputs: ["src/swarm/hierarchy/domains/*.ts", "src/swarm/queen/KingLogicAdapter.ts", "src/swarm/types/task.types.ts"]
 * - tools_used: ["Write", "TodoWrite"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
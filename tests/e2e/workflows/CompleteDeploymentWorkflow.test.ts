/**
 * Real E2E Complete Deployment Workflow Tests
 * Tests the entire deployment pipeline from artifact creation to monitoring
 * Uses real deployment orchestrator and actual system interactions
 */

import { DeploymentOrchestrator } from '../../../src/domains/deployment-orchestration/coordinators/deployment-orchestrator';
import { AutoRollbackSystem } from '../../../src/domains/deployment-orchestration/systems/auto-rollback-system';
import { CanaryController } from '../../../src/domains/deployment-orchestration/controllers/canary-controller';
import { BlueGreenEngine } from '../../../src/domains/deployment-orchestration/engines/blue-green-engine';
import {
  DeploymentArtifact,
  DeploymentStrategy,
  Environment,
  PlatformConfig,
  DeploymentResult,
  DeploymentExecution
} from '../../../src/domains/deployment-orchestration/types/deployment-types';

describe('Complete Deployment Workflow E2E', () => {
  let orchestrator: DeploymentOrchestrator;
  let rollbackSystem: AutoRollbackSystem;
  let testEnvironment: Environment;
  let testPlatform: PlatformConfig;
  let testArtifact: DeploymentArtifact;
  
  // Track real deployment for cleanup
  let activeDeploymentId: string | null = null;

  beforeAll(async () => {
    orchestrator = new DeploymentOrchestrator();
    rollbackSystem = new AutoRollbackSystem();
    
    // Setup real test environment
    testEnvironment = {
      name: 'e2e-test-env',
      namespace: 'deployment-e2e-test',
      config: {
        complianceLevel: 'standard',
        resources: {
          cpu: '2',
          memory: '4Gi',
          storage: '10Gi'
        },
        networking: {
          loadBalancer: true,
          ingress: true
        }
      },
      healthEndpoints: [
        'http://deployment-e2e-test.internal/health',
        'http://deployment-e2e-test.internal/ready'
      ]
    };

    testPlatform = {
      type: 'kubernetes',
      endpoint: process.env.TEST_K8S_ENDPOINT || 'http://localhost:8080',
      credentials: {
        token: process.env.TEST_K8S_TOKEN || 'test-token'
      },
      config: {
        namespace: testEnvironment.namespace,
        context: 'test-context'
      }
    };

    testArtifact = {
      id: 'test-app-v1.0.0',
      version: '1.0.0',
      repository: 'test/test-app',
      checksums: {
        'sha256': 'abc123def456'
      },
      metadata: {
        buildId: 'build-001',
        commitSha: 'commit-abc123',
        buildTime: new Date().toISOString()
      },
      compliance: {
        level: 'standard',
        scanned: true,
        vulnerabilities: []
      }
    };
  });

  afterEach(async () => {
    // Cleanup any active deployments
    if (activeDeploymentId) {
      try {
        await rollbackSystem.triggerRollback(activeDeploymentId, 'test cleanup');
      } catch (error) {
        console.warn('Cleanup rollback failed:', error);
      }
      activeDeploymentId = null;
    }
  });

  describe('Blue-Green Deployment E2E', () => {
    it('should deploy blue-green strategy successfully', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {
          warmupTime: 30,
          testTrafficPercentage: 10
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'error-rate',
              threshold: 5,
              duration: 60,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      // Verify deployment success
      expect(result.success).toBe(true);
      expect(result.deploymentId).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.successRate).toBe(100);

      // Verify deployment is active
      const status = orchestrator.getDeploymentStatus(result.deploymentId);
      expect(status).toBeDefined();
      expect(status!.status.phase).toEqual(expect.stringMatching(/complete|monitoring/));

      // Verify rollback monitoring is active
      const rollbackStatus = rollbackSystem.getRollbackStatus(result.deploymentId);
      expect(rollbackStatus).toBeDefined();
      expect(rollbackStatus!.monitoring).toBe(true);
      expect(rollbackStatus!.activeTriggers).toHaveLength(1);
    }, 60000);

    it('should handle blue-green deployment with traffic switching', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {
          warmupTime: 15,
          testTrafficPercentage: 20,
          switchTrafficDelay: 30
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      expect(result.success).toBe(true);
      
      // Wait for traffic switching to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      const finalStatus = orchestrator.getDeploymentStatus(result.deploymentId);
      expect(finalStatus).toBeDefined();
      expect(finalStatus!.status.traffic.green).toBeGreaterThan(0);
    }, 90000);
  });

  describe('Canary Deployment E2E', () => {
    it('should deploy canary strategy with gradual traffic increase', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 10,
          trafficIncrement: 25,
          evaluationInterval: 30,
          maxTrafficPercentage: 100
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'error-rate',
              threshold: 10,
              duration: 45,
              severity: 'high'
            },
            {
              type: 'performance-degradation',
              threshold: 3000,
              duration: 60,
              severity: 'medium'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      expect(result.success).toBe(true);
      expect(result.deploymentId).toBeDefined();
      
      // Verify canary deployment characteristics
      const status = orchestrator.getDeploymentStatus(result.deploymentId);
      expect(status).toBeDefined();
      expect(status!.strategy.type).toBe('canary');
      
      // Verify rollback system has multiple triggers
      const rollbackStatus = rollbackSystem.getRollbackStatus(result.deploymentId);
      expect(rollbackStatus!.activeTriggers).toHaveLength(2);
    }, 120000);

    it('should handle canary rollback on performance degradation', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 50,
          trafficIncrement: 50,
          evaluationInterval: 10
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'performance-degradation',
              threshold: 1000, // Very low threshold to trigger rollback
              duration: 15,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      expect(result.success).toBe(true);

      // Wait for monitoring to detect performance issue and trigger rollback
      await new Promise(resolve => setTimeout(resolve, 30000));

      const rollbackHistory = rollbackSystem.getRollbackHistory(result.deploymentId);
      // Rollback should have been triggered automatically
      expect(rollbackHistory.length).toBeGreaterThan(0);
      
      if (rollbackHistory.length > 0) {
        expect(rollbackHistory[0].trigger.type).toBe('performance-degradation');
        expect(rollbackHistory[0].status).toEqual(expect.stringMatching(/completed|in-progress/));
      }

      activeDeploymentId = null; // Deployment already rolled back
    }, 60000);
  });

  describe('Rolling Deployment E2E', () => {
    it('should deploy rolling strategy successfully', async () => {
      const strategy: DeploymentStrategy = {
        type: 'rolling',
        config: {
          maxUnavailable: 1,
          maxSurge: 1,
          progressDeadlineSeconds: 300
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'health-failure',
              threshold: 3,
              duration: 30,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      expect(result.success).toBe(true);
      expect(result.deploymentId).toBeDefined();
      
      const status = orchestrator.getDeploymentStatus(result.deploymentId);
      expect(status).toBeDefined();
      expect(status!.strategy.type).toBe('rolling');
      expect(status!.status.replicas.desired).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Pipeline Deployment E2E', () => {
    it('should deploy through multiple environments in pipeline', async () => {
      const environments = [
        {
          ...testEnvironment,
          name: 'dev-pipeline',
          namespace: 'dev-pipeline-test'
        },
        {
          ...testEnvironment,
          name: 'staging-pipeline',
          namespace: 'staging-pipeline-test'
        },
        {
          ...testEnvironment,
          name: 'prod-pipeline',
          namespace: 'prod-pipeline-test'
        }
      ];

      const results = await orchestrator.deployPipeline(
        'e2e-test-pipeline',
        testArtifact,
        environments
      );

      expect(results).toHaveLength(3);
      
      // All deployments should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.deploymentId).toBeDefined();
        expect(result.errors).toHaveLength(0);
        
        // Track for cleanup
        if (index === results.length - 1) {
          activeDeploymentId = result.deploymentId;
        }
      });
    }, 180000);
  });

  describe('Emergency Operations E2E', () => {
    it('should handle emergency stop of all deployments', async () => {
      // Start multiple deployments
      const deploymentPromises = [
        orchestrator.deploy(testArtifact, {
          type: 'blue-green',
          config: {},
          rollbackStrategy: { enabled: true, autoTriggers: [], manualApprovalRequired: false }
        }, testEnvironment, testPlatform),
        orchestrator.deploy(testArtifact, {
          type: 'canary',
          config: {},
          rollbackStrategy: { enabled: true, autoTriggers: [], manualApprovalRequired: false }
        }, {
          ...testEnvironment,
          name: 'emergency-test-2',
          namespace: 'emergency-test-2'
        }, testPlatform)
      ];

      const results = await Promise.all(deploymentPromises);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify both deployments are active
      const activeDeployments = orchestrator.getActiveDeployments();
      expect(activeDeployments.length).toBeGreaterThanOrEqual(2);

      // Trigger emergency stop
      await orchestrator.emergencyStop('E2E test emergency stop');

      // Wait for emergency stop to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify all deployments have rollback events
      results.forEach(result => {
        const rollbackHistory = rollbackSystem.getRollbackHistory(result.deploymentId);
        expect(rollbackHistory.length).toBeGreaterThan(0);
        expect(rollbackHistory[0].reason).toContain('emergency stop');
      });

      activeDeploymentId = null; // All deployments stopped
    }, 90000);
  });

  describe('Deployment History and Metrics E2E', () => {
    it('should track deployment history with real metrics', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {},
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [],
          manualApprovalRequired: false
        }
      };

      const result = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = result.deploymentId;

      // Wait for deployment to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Manually trigger rollback to generate history
      await rollbackSystem.triggerRollback(result.deploymentId, 'E2E test rollback');

      // Wait for rollback to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify deployment history
      const history = orchestrator.getDeploymentHistory({
        environment: testEnvironment.name,
        limit: 5
      });

      expect(history.length).toBeGreaterThan(0);
      
      const deployment = history.find(d => d.id === result.deploymentId);
      expect(deployment).toBeDefined();
      expect(deployment!.status.phase).toBe('failed');
      expect(deployment!.timeline.length).toBeGreaterThan(1);

      // Verify rollback history
      const rollbackHistory = rollbackSystem.getRollbackHistory(result.deploymentId);
      expect(rollbackHistory.length).toBe(1);
      expect(rollbackHistory[0].reason).toBe('E2E test rollback');
      expect(rollbackHistory[0].status).toBe('completed');
      expect(rollbackHistory[0].duration).toBeGreaterThan(0);

      activeDeploymentId = null; // Deployment rolled back
    }, 60000);
  });
});

/**
 * Version & Run Log
 * 
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T06:45:03-04:00 | tdd-london-swarm@Claude-Sonnet-4 | Create real E2E deployment workflow tests with actual system interactions | CompleteDeploymentWorkflow.test.ts | OK | Real deployment testing with cleanup, multiple strategies, emergency ops | 0.24 | a7f9d2e |
 * 
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: e2e-deployment-test-001
 * - inputs: ["deployment-orchestrator.ts", "auto-rollback-system.ts"]
 * - tools_used: ["Read", "MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"tdd-london-school-v1"}
 */
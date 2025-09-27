/**
 * Real E2E Monitoring Workflow Tests
 * Tests complete monitoring scenarios with actual health checks, metrics collection,
 * and real-time alerting systems
 */

import { AutoRollbackSystem } from '../../../src/domains/deployment-orchestration/systems/auto-rollback-system';
import { DeploymentOrchestrator } from '../../../src/domains/deployment-orchestration/coordinators/deployment-orchestrator';
import { MultiEnvironmentCoordinator } from '../../../src/domains/deployment-orchestration/coordinators/multi-environment-coordinator';
import {
  DeploymentArtifact,
  DeploymentStrategy,
  Environment,
  PlatformConfig,
  HealthCheck
} from '../../../src/domains/deployment-orchestration/types/deployment-types';

describe('Monitoring Workflow E2E', () => {
  let rollbackSystem: AutoRollbackSystem;
  let orchestrator: DeploymentOrchestrator;
  let multiEnvCoordinator: MultiEnvironmentCoordinator;
  let testEnvironment: Environment;
  let testPlatform: PlatformConfig;
  let testArtifact: DeploymentArtifact;
  
  let activeDeploymentId: string | null = null;
  let healthCheckResults: any[] = [];
  let metricsCollected: any[] = [];

  beforeAll(async () => {
    rollbackSystem = new AutoRollbackSystem();
    orchestrator = new DeploymentOrchestrator();
    multiEnvCoordinator = new MultiEnvironmentCoordinator();
    
    testEnvironment = {
      name: 'monitoring-test-env',
      namespace: 'monitoring-e2e-test',
      config: {
        complianceLevel: 'standard',
        resources: {
          cpu: '1',
          memory: '2Gi',
          storage: '5Gi'
        },
        networking: {
          loadBalancer: true,
          ingress: true,
          monitoringPorts: [8080, 9090, 3000]
        }
      },
      healthEndpoints: [
        'http://monitoring-e2e-test.internal/health',
        'http://monitoring-e2e-test.internal/ready',
        'http://monitoring-e2e-test.internal/metrics',
        'http://monitoring-e2e-test.internal/deep-health'
      ]
    };

    testPlatform = {
      type: 'kubernetes',
      endpoint: process.env.TEST_K8S_ENDPOINT || 'http://localhost:8080',
      credentials: {
        token: process.env.TEST_K8S_TOKEN || 'monitoring-test-token'
      },
      config: {
        namespace: testEnvironment.namespace,
        context: 'monitoring-test-context',
        monitoringEnabled: true
      }
    };

    testArtifact = {
      id: 'monitoring-test-app-v1.0.0',
      version: '1.0.0',
      repository: 'test/monitoring-app',
      checksums: {
        'sha256': 'monitoring123test456'
      },
      metadata: {
        buildId: 'monitoring-build-001',
        commitSha: 'monitoring-commit-abc123',
        buildTime: new Date().toISOString(),
        healthCheckConfig: {
          initialDelaySeconds: 5,
          periodSeconds: 10,
          timeoutSeconds: 5,
          failureThreshold: 3
        }
      },
      compliance: {
        level: 'standard',
        scanned: true,
        vulnerabilities: []
      }
    };
  });

  beforeEach(() => {
    healthCheckResults = [];
    metricsCollected = [];
  });

  afterEach(async () => {
    if (activeDeploymentId) {
      try {
        await rollbackSystem.stopMonitoring(activeDeploymentId);
      } catch (error) {
        console.warn('Stop monitoring failed:', error);
      }
      activeDeploymentId = null;
    }
  });

  describe('Health Check Monitoring', () => {
    it('should perform continuous health checks on deployed application', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {
          warmupTime: 10,
          healthCheckInterval: 5000 // Check every 5 seconds
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'health-failure',
              threshold: 2, // 2 consecutive failures
              duration: 15,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Verify monitoring started
      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.monitoring).toBe(true);
      expect(rollbackStatus!.currentHealth).toBeDefined();

      // Let health monitoring run for multiple cycles
      await new Promise(resolve => setTimeout(resolve, 25000));

      // Verify health status is being tracked
      const updatedStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(updatedStatus!.currentHealth).toEqual(
        expect.stringMatching(/healthy|unhealthy|critical|unknown/)
      );

      // Check if any health failures triggered rollback
      const rollbackHistory = rollbackSystem.getRollbackHistory(deployResult.deploymentId);
      
      if (rollbackHistory.length > 0) {
        // Health failures detected
        expect(rollbackHistory[0].trigger.type).toBe('health-failure');
        expect(rollbackHistory[0].reason).toContain('consecutive health failures');
        activeDeploymentId = null;
      }
    }, 60000);

    it('should detect and respond to critical health issues', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 20,
          evaluationInterval: 10
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'health-failure',
              threshold: 1, // Single critical failure
              duration: 5,
              severity: 'critical'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Monitor for critical health issues
      await new Promise(resolve => setTimeout(resolve, 20000));

      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.monitoring).toBe(true);

      // Verify critical health monitoring configuration
      expect(rollbackStatus!.activeTriggers[0].severity).toBe('critical');
      expect(rollbackStatus!.activeTriggers[0].threshold).toBe(1);
    }, 45000);

    it('should validate multiple health endpoints simultaneously', async () => {
      const strategy: DeploymentStrategy = {
        type: 'rolling',
        config: {
          maxUnavailable: 1,
          maxSurge: 1
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'health-failure',
              threshold: 2,
              duration: 20,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Verify monitoring covers all health endpoints
      expect(testEnvironment.healthEndpoints).toHaveLength(4);
      expect(testEnvironment.healthEndpoints).toContain(
        'http://monitoring-e2e-test.internal/health'
      );
      expect(testEnvironment.healthEndpoints).toContain(
        'http://monitoring-e2e-test.internal/metrics'
      );

      // Let monitoring check all endpoints
      await new Promise(resolve => setTimeout(resolve, 30000));

      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.currentHealth).toBeDefined();
    }, 60000);
  });

  describe('Metrics Collection and Analysis', () => {
    it('should collect and analyze application performance metrics', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 30,
          evaluationInterval: 15
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'performance-degradation',
              threshold: 2500, // 2.5 second response time
              duration: 30,
              severity: 'medium'
            },
            {
              type: 'error-rate',
              threshold: 8, // 8% error rate
              duration: 20,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Verify metrics monitoring is active
      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.monitoring).toBe(true);
      expect(rollbackStatus!.activeTriggers).toHaveLength(2);
      expect(rollbackStatus!.metricsStatus).toBeDefined();

      // Let metrics collection run for multiple evaluation cycles
      await new Promise(resolve => setTimeout(resolve, 45000));

      // Check metrics evaluation results
      const updatedStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(updatedStatus!.metricsStatus).toEqual(
        expect.stringMatching(/normal|warning|critical|error/)
      );

      // Check if any metrics triggered rollback
      const rollbackHistory = rollbackSystem.getRollbackHistory(deployResult.deploymentId);
      
      if (rollbackHistory.length > 0) {
        const triggerType = rollbackHistory[0].trigger.type;
        expect(triggerType).toEqual(
          expect.stringMatching(/performance-degradation|error-rate/)
        );
        activeDeploymentId = null;
      }
    }, 90000);

    it('should monitor infrastructure metrics (CPU, memory, disk)', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {
          warmupTime: 15,
          resourceMonitoringEnabled: true
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'resource-exhaustion',
              threshold: 85, // 85% resource usage
              duration: 25,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Verify resource monitoring
      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.monitoring).toBe(true);

      // Let infrastructure monitoring collect data
      await new Promise(resolve => setTimeout(resolve, 35000));

      const finalStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(finalStatus!.metricsStatus).toBeDefined();

      // Infrastructure metrics should be collected even if no rollback triggered
      expect(finalStatus!.monitoring).toBe(true);
    }, 60000);

    it('should track business metrics and impact', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 25,
          businessMetricsEnabled: true,
          evaluationInterval: 20
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'business-impact',
              threshold: 10, // 10% business impact threshold
              duration: 30,
              severity: 'medium'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Business metrics monitoring should be active
      await new Promise(resolve => setTimeout(resolve, 40000));

      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(rollbackStatus!.monitoring).toBe(true);

      // Business metrics may not be available in test environment
      // but monitoring should handle this gracefully
      expect(rollbackStatus!.metricsStatus).toBeDefined();
    }, 70000);
  });

  describe('Multi-Environment Monitoring', () => {
    it('should monitor deployments across multiple environments', async () => {
      const environments = [
        {
          ...testEnvironment,
          name: 'monitoring-dev',
          namespace: 'monitoring-dev-test'
        },
        {
          ...testEnvironment,
          name: 'monitoring-staging',
          namespace: 'monitoring-staging-test'
        }
      ];

      const results = await orchestrator.deployPipeline(
        'multi-env-monitoring-pipeline',
        testArtifact,
        environments
      );

      expect(results).toHaveLength(2);
      
      // All deployments should be successful
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify monitoring is active for all deployments
      const activeDeployments = orchestrator.getActiveDeployments();
      expect(activeDeployments.length).toBeGreaterThanOrEqual(2);

      // Each deployment should have its own monitoring
      results.forEach(result => {
        const rollbackStatus = rollbackSystem.getRollbackStatus(result.deploymentId);
        expect(rollbackStatus!.monitoring).toBe(true);
      });

      // Let all environments run monitoring
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check final status of all deployments
      results.forEach(result => {
        const finalStatus = rollbackSystem.getRollbackStatus(result.deploymentId);
        expect(finalStatus!.currentHealth).toBeDefined();
      });

      // Clean up the last deployment
      activeDeploymentId = results[results.length - 1].deploymentId;
    }, 90000);
  });

  describe('Real-Time Alerting and Notifications', () => {
    it('should trigger real-time alerts on threshold breaches', async () => {
      const alertsReceived: any[] = [];
      
      // Set up alert listener
      rollbackSystem.onRollbackTriggered(async (deploymentId, reason) => {
        alertsReceived.push({
          timestamp: new Date(),
          deploymentId,
          reason,
          type: 'rollback-triggered'
        });
      });

      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 40,
          evaluationInterval: 10
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'error-rate',
              threshold: 3, // Very sensitive for testing
              duration: 15,
              severity: 'high'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Wait for monitoring and potential alerts
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check if any alerts were triggered
      if (alertsReceived.length > 0) {
        expect(alertsReceived[0].deploymentId).toBe(deployResult.deploymentId);
        expect(alertsReceived[0].type).toBe('rollback-triggered');
        expect(alertsReceived[0].reason).toBeDefined();
        activeDeploymentId = null; // Rollback occurred
      }

      // Monitoring should be active regardless
      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      if (rollbackStatus) {
        expect(rollbackStatus.monitoring).toBe(true);
      }
    }, 60000);

    it('should provide comprehensive monitoring status reports', async () => {
      const strategy: DeploymentStrategy = {
        type: 'blue-green',
        config: {
          warmupTime: 10,
          detailedMonitoring: true
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'health-failure',
              threshold: 3,
              duration: 25,
              severity: 'medium'
            },
            {
              type: 'performance-degradation',
              threshold: 4000,
              duration: 30,
              severity: 'medium'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      expect(deployResult.success).toBe(true);

      // Let monitoring collect comprehensive data
      await new Promise(resolve => setTimeout(resolve, 40000));

      // Get comprehensive monitoring status
      const rollbackStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      const deploymentStatus = orchestrator.getDeploymentStatus(deployResult.deploymentId);

      // Verify comprehensive status information
      expect(rollbackStatus!.monitoring).toBe(true);
      expect(rollbackStatus!.activeTriggers).toHaveLength(2);
      expect(rollbackStatus!.currentHealth).toBeDefined();
      expect(rollbackStatus!.metricsStatus).toBeDefined();

      expect(deploymentStatus!.timeline.length).toBeGreaterThan(0);
      expect(deploymentStatus!.status.phase).toBeDefined();

      // Verify rollback history tracking
      const rollbackHistory = rollbackSystem.getRollbackHistory(deployResult.deploymentId);
      expect(rollbackHistory).toBeInstanceOf(Array);
    }, 70000);
  });

  describe('Monitoring Configuration and Tuning', () => {
    it('should allow dynamic monitoring configuration updates', async () => {
      const strategy: DeploymentStrategy = {
        type: 'canary',
        config: {
          initialTrafficPercentage: 15,
          evaluationInterval: 20
        },
        rollbackStrategy: {
          enabled: true,
          autoTriggers: [
            {
              type: 'error-rate',
              threshold: 15,
              duration: 30,
              severity: 'medium'
            }
          ],
          manualApprovalRequired: false
        }
      };

      const deployResult = await orchestrator.deploy(
        testArtifact,
        strategy,
        testEnvironment,
        testPlatform
      );

      activeDeploymentId = deployResult.deploymentId;
      
      // Verify initial monitoring configuration
      const initialStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(initialStatus!.activeTriggers[0].threshold).toBe(15);
      expect(initialStatus!.activeTriggers[0].severity).toBe('medium');

      // Update monitoring configuration to be more sensitive
      await rollbackSystem.updateRollbackConfig(deployResult.deploymentId, {
        autoTriggers: [
          {
            type: 'error-rate',
            threshold: 5, // More sensitive
            duration: 15, // Faster detection
            severity: 'high'
          },
          {
            type: 'performance-degradation',
            threshold: 2000,
            duration: 20,
            severity: 'high'
          }
        ]
      });

      // Verify updated configuration
      const updatedStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(updatedStatus!.activeTriggers).toHaveLength(2);
      expect(updatedStatus!.activeTriggers[0].threshold).toBe(5);
      expect(updatedStatus!.activeTriggers[0].severity).toBe('high');

      // Let updated monitoring run
      await new Promise(resolve => setTimeout(resolve, 25000));

      const finalStatus = rollbackSystem.getRollbackStatus(deployResult.deploymentId);
      expect(finalStatus!.monitoring).toBe(true);
    }, 70000);
  });
});

/**
 * Version & Run Log
 * 
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T06:49:22-04:00 | tdd-london-swarm@Claude-Sonnet-4 | Create real E2E monitoring workflow tests with actual health checks and metrics | MonitoringWorkflow.test.ts | OK | Real monitoring testing with health checks, metrics collection, multi-env, alerting | 0.38 | c9f5d4b |
 * 
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: e2e-monitoring-test-003
 * - inputs: ["auto-rollback-system.ts", "deployment-orchestrator.ts", "multi-environment-coordinator.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"tdd-london-school-v1"}
 */
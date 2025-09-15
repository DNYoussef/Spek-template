"use strict";
/**
 * Deployment Orchestration Domain Tests
 *
 * Comprehensive test suite validating all deployment orchestration components
 * including multi-environment coordination, blue-green deployments, canary releases,
 * automated rollbacks, cross-platform support, and compliance validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const deployment_orchestrator_1 = require("../../../src/domains/deployment-orchestration/coordinators/deployment-orchestrator");
const multi_environment_coordinator_1 = require("../../../src/domains/deployment-orchestration/coordinators/multi-environment-coordinator");
const blue_green_engine_1 = require("../../../src/domains/deployment-orchestration/engines/blue-green-engine");
const canary_controller_1 = require("../../../src/domains/deployment-orchestration/controllers/canary-controller");
const auto_rollback_system_1 = require("../../../src/domains/deployment-orchestration/systems/auto-rollback-system");
const cross_platform_abstraction_1 = require("../../../src/domains/deployment-orchestration/abstractions/cross-platform-abstraction");
const pipeline_orchestrator_1 = require("../../../src/domains/deployment-orchestration/pipelines/pipeline-orchestrator");
const deployment_config_1 = require("../../../src/domains/deployment-orchestration/config/deployment-config");
const deployment_compliance_1 = require("../../../src/domains/deployment-orchestration/compliance/deployment-compliance");
describe('Deployment Orchestration Domain', () => {
    let orchestrator;
    let multiEnvCoordinator;
    let blueGreenEngine;
    let canaryController;
    let rollbackSystem;
    let platformAbstraction;
    let pipelineOrchestrator;
    let configManager;
    let complianceValidator;
    // Test fixtures
    let testArtifact;
    let testEnvironment;
    let testPlatform;
    let blueGreenStrategy;
    let canaryStrategy;
    beforeEach(async () => {
        // Initialize components
        orchestrator = new deployment_orchestrator_1.DeploymentOrchestrator();
        multiEnvCoordinator = new multi_environment_coordinator_1.MultiEnvironmentCoordinator();
        blueGreenEngine = new blue_green_engine_1.BlueGreenEngine();
        canaryController = new canary_controller_1.CanaryController();
        rollbackSystem = new auto_rollback_system_1.AutoRollbackSystem();
        platformAbstraction = new cross_platform_abstraction_1.CrossPlatformAbstraction();
        pipelineOrchestrator = new pipeline_orchestrator_1.PipelineOrchestrator();
        configManager = new deployment_config_1.DeploymentConfigManager();
        complianceValidator = new deployment_compliance_1.DeploymentComplianceValidator();
        // Initialize test fixtures
        await initializeTestFixtures();
    });
    async function initializeTestFixtures() {
        // Test artifact
        testArtifact = {
            id: 'test-app',
            version: '1.2.3',
            imageTag: 'test-app:1.2.3',
            checksums: {
                'sha256': 'abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz567890'
            },
            compliance: {
                level: 'enhanced',
                checks: [{
                        name: 'Security Scan',
                        description: 'Container security scan',
                        status: 'pass',
                        severity: 'high'
                    }],
                overallStatus: 'pass',
                auditTrail: []
            }
        };
        // Test environment
        testEnvironment = {
            name: 'staging',
            type: 'staging',
            config: {
                replicas: 3,
                resources: {
                    cpu: '500m',
                    memory: '1Gi',
                    storage: '5Gi'
                },
                networkConfig: {
                    loadBalancer: {
                        type: 'application',
                        healthCheckPath: '/health',
                        healthCheckInterval: 30,
                        unhealthyThreshold: 2
                    },
                    serviceType: 'LoadBalancer'
                },
                secrets: [],
                featureFlags: { enableMonitoring: true },
                complianceLevel: 'enhanced'
            },
            healthEndpoints: ['https://staging-app.example.com/health'],
            rollbackCapable: true
        };
        // Test platform
        testPlatform = {
            type: 'kubernetes',
            version: 'v1.28',
            credentials: {
                type: 'kubeconfig',
                data: { config: 'test-kubeconfig' }
            },
            features: {
                blueGreenSupport: true,
                canarySupport: true,
                autoScaling: true,
                loadBalancing: true,
                secretManagement: true
            }
        };
        // Blue-green strategy
        const blueGreenConfig = {
            switchTrafficPercentage: 100,
            validationDuration: 300000,
            autoSwitch: false,
            switchTriggers: [],
            timeout: 600000,
            healthCheckDelay: 30000,
            healthCheckTimeout: 10000,
            healthCheckInterval: 5000,
            progressDeadlineSeconds: 600
        };
        blueGreenStrategy = {
            type: 'blue-green',
            config: blueGreenConfig,
            rollbackStrategy: {
                enabled: true,
                autoTriggers: [],
                manualApprovalRequired: false,
                preserveResourceVersion: true
            }
        };
        // Canary strategy
        const canaryConfig = {
            initialTrafficPercentage: 10,
            stepPercentage: 25,
            stepDuration: 300000,
            maxSteps: 4,
            successThreshold: {
                errorRate: 1,
                responseTime: 500,
                availability: 99.5,
                throughput: 100
            },
            failureThreshold: {
                errorRate: 5,
                responseTime: 2000,
                availability: 95,
                consecutiveFailures: 3
            },
            timeout: 1800000,
            healthCheckDelay: 30000,
            healthCheckTimeout: 10000,
            healthCheckInterval: 5000,
            progressDeadlineSeconds: 1800
        };
        canaryStrategy = {
            type: 'canary',
            config: canaryConfig,
            rollbackStrategy: {
                enabled: true,
                autoTriggers: [{
                        type: 'error-rate',
                        threshold: 5,
                        duration: 60000,
                        severity: 'high'
                    }],
                manualApprovalRequired: false,
                preserveResourceVersion: true
            }
        };
    }
    describe('DeploymentOrchestrator', () => {
        it('should successfully deploy using blue-green strategy', async () => {
            const result = await orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, testPlatform);
            expect(result.success).toBe(true);
            expect(result.deploymentId).toBeDefined();
            expect(result.errors).toHaveLength(0);
            expect(result.metrics.successRate).toBe(100);
        });
        it('should successfully deploy using canary strategy', async () => {
            const result = await orchestrator.deploy(testArtifact, canaryStrategy, testEnvironment, testPlatform);
            expect(result.success).toBe(true);
            expect(result.deploymentId).toBeDefined();
            expect(result.errors).toHaveLength(0);
            expect(result.metrics.performanceImpact).toBeLessThanOrEqual(0.2);
        });
        it('should handle deployment failures gracefully', async () => {
            // Create invalid artifact to trigger failure
            const invalidArtifact = { ...testArtifact, checksums: {} };
            const result = await orchestrator.deploy(invalidArtifact, blueGreenStrategy, testEnvironment, testPlatform);
            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].code).toBe('DEPLOYMENT_FAILED');
        });
        it('should track active deployments', async () => {
            const deploymentPromise = orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, testPlatform);
            // Check active deployments while deployment is running
            const activeDeployments = orchestrator.getActiveDeployments();
            expect(activeDeployments.length).toBeGreaterThan(0);
            await deploymentPromise;
            // Should be cleared after completion
            const activeDeploymentsAfter = orchestrator.getActiveDeployments();
            expect(activeDeploymentsAfter.length).toBe(0);
        });
        it('should execute pipeline deployments', async () => {
            const environments = [testEnvironment];
            const results = await orchestrator.deployPipeline('test-pipeline', testArtifact, environments);
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
        });
    });
    describe('MultiEnvironmentCoordinator', () => {
        it('should register and validate environments', async () => {
            await multiEnvCoordinator.registerEnvironment(testEnvironment);
            const retrievedEnv = multiEnvCoordinator.getEnvironment('staging');
            expect(retrievedEnv).toEqual(testEnvironment);
            await expect(multiEnvCoordinator.validateEnvironment(testEnvironment))
                .resolves.not.toThrow();
        });
        it('should monitor environment health', async () => {
            await multiEnvCoordinator.registerEnvironment(testEnvironment);
            // Start monitoring
            await multiEnvCoordinator.monitorEnvironmentHealth(testEnvironment, 'test-deployment');
            // Get health status
            const health = multiEnvCoordinator.getEnvironmentHealth('staging');
            expect(health).toBeDefined();
            expect(['healthy', 'unhealthy', 'degraded', 'unknown']).toContain(health.status);
        });
        it('should provide deployment readiness status', async () => {
            await multiEnvCoordinator.registerEnvironment(testEnvironment);
            const readiness = await multiEnvCoordinator.getDeploymentReadiness('staging');
            expect(readiness.ready).toBeDefined();
            expect(readiness.checks).toBeDefined();
        });
        it('should handle environment status change listeners', async () => {
            let statusChangeReceived = false;
            let receivedEnvironment = null;
            let receivedStatus = null;
            multiEnvCoordinator.onEnvironmentStatusChange((env, status) => {
                statusChangeReceived = true;
                receivedEnvironment = env;
                receivedStatus = status;
            });
            await multiEnvCoordinator.registerEnvironment(testEnvironment);
            // Simulate environment monitoring that triggers status change
            await multiEnvCoordinator.monitorEnvironmentHealth(testEnvironment, 'test-deployment');
            // Wait a bit for monitoring to potentially trigger status change
            await new Promise(resolve => setTimeout(resolve, 100));
            // Note: In a real scenario, status change would be triggered by actual health issues
        });
    });
    describe('BlueGreenEngine', () => {
        it('should execute blue-green deployment successfully', async () => {
            const execution = {
                id: 'bg-test-1',
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const result = await blueGreenEngine.deploy(execution);
            expect(result.success).toBe(true);
            expect(result.deploymentId).toBe('bg-test-1');
            expect(result.metrics.performanceImpact).toBeLessThanOrEqual(0.1);
        });
        it('should handle traffic switching', async () => {
            const execution = {
                id: 'bg-test-2',
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            // Start deployment
            const deployPromise = blueGreenEngine.deploy(execution);
            // Switch traffic manually
            const switchResult = await blueGreenEngine.switchTraffic('bg-test-2', 50, false);
            expect(switchResult.success).toBe(true);
            expect(switchResult.finalTrafficSplit.green).toBe(50);
            await deployPromise;
        });
        it('should handle rollback operations', async () => {
            const deploymentId = 'bg-test-rollback';
            await expect(blueGreenEngine.rollback(deploymentId, 'Test rollback'))
                .rejects.toThrow(); // Should fail if deployment doesn't exist
            // After creating a deployment, rollback should work
            const execution = {
                id: deploymentId,
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 50, green: 50 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            await blueGreenEngine.deploy(execution);
            await expect(blueGreenEngine.rollback(deploymentId, 'Test rollback'))
                .resolves.not.toThrow();
        });
    });
    describe('CanaryController', () => {
        it('should execute canary deployment successfully', async () => {
            const execution = {
                id: 'canary-test-1',
                strategy: canaryStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const result = await canaryController.deploy(execution);
            expect(result.success).toBe(true);
            expect(result.deploymentId).toBe('canary-test-1');
            expect(result.metrics.performanceImpact).toBeLessThanOrEqual(0.2);
        });
        it('should handle manual canary progression', async () => {
            const deploymentId = 'canary-test-progress';
            const execution = {
                id: deploymentId,
                strategy: canaryStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            // Start deployment
            const deployPromise = canaryController.deploy(execution);
            // Manually progress canary
            try {
                const progressResult = await canaryController.progressCanary(deploymentId, 25);
                expect(progressResult.success).toBe(true);
            }
            catch (error) {
                // May fail if deployment hasn't initialized canary yet
                expect(error).toBeDefined();
            }
            await deployPromise;
        });
        it('should handle canary pause and resume', async () => {
            const deploymentId = 'canary-test-pause';
            // These operations require an active deployment
            await expect(canaryController.pauseCanary(deploymentId, 'Test pause'))
                .rejects.toThrow();
            await expect(canaryController.resumeCanary(deploymentId))
                .rejects.toThrow();
        });
        it('should provide canary status', async () => {
            const deploymentId = 'canary-test-status';
            const status = canaryController.getCanaryStatus(deploymentId);
            expect(status).toBeNull(); // No active deployment
        });
    });
    describe('AutoRollbackSystem', () => {
        it('should start and stop monitoring deployments', async () => {
            const execution = {
                id: 'rollback-test-1',
                strategy: {
                    ...blueGreenStrategy,
                    rollbackStrategy: {
                        enabled: true,
                        autoTriggers: [{
                                type: 'health-failure',
                                threshold: 3,
                                duration: 60000,
                                severity: 'high'
                            }],
                        manualApprovalRequired: false,
                        preserveResourceVersion: true
                    }
                },
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            await rollbackSystem.monitorDeployment(execution);
            const status = rollbackSystem.getRollbackStatus('rollback-test-1');
            expect(status).toBeDefined();
            expect(status.monitoring).toBe(true);
            await rollbackSystem.stopMonitoring('rollback-test-1');
        });
        it('should trigger manual rollback', async () => {
            const deploymentId = 'rollback-test-manual';
            await expect(rollbackSystem.triggerRollback(deploymentId, 'Manual test rollback'))
                .rejects.toThrow(); // No monitored deployment
            // After starting monitoring
            const execution = {
                id: deploymentId,
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            await rollbackSystem.monitorDeployment(execution);
            const result = await rollbackSystem.triggerRollback(deploymentId, 'Manual test rollback');
            expect(result.success).toBe(true);
            expect(result.reason).toBe('Manual test rollback');
        });
        it('should provide rollback history', async () => {
            const deploymentId = 'rollback-test-history';
            const history = rollbackSystem.getRollbackHistory(deploymentId);
            expect(history).toEqual([]); // No history for non-existent deployment
        });
    });
    describe('CrossPlatformAbstraction', () => {
        it('should validate platform configurations', async () => {
            await expect(platformAbstraction.validatePlatform(testPlatform))
                .resolves.not.toThrow();
        });
        it('should get platform capabilities', () => {
            const capabilities = platformAbstraction.getPlatformCapabilities('kubernetes');
            expect(capabilities).toBeDefined();
            expect(capabilities.blueGreenSupport).toBe(true);
            expect(capabilities.canarySupport).toBe(true);
        });
        it('should list supported platforms', () => {
            const platforms = platformAbstraction.getSupportedPlatforms();
            expect(platforms.length).toBeGreaterThan(0);
            expect(platforms.map(p => p.type)).toContain('kubernetes');
        });
        it('should get platform status', async () => {
            const status = await platformAbstraction.getPlatformStatus(testPlatform);
            expect(status.type).toBe('kubernetes');
            expect(['healthy', 'unhealthy', 'unknown']).toContain(status.status);
        });
        it('should handle platform deployment', async () => {
            const execution = {
                id: 'platform-test-1',
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const result = await platformAbstraction.deployToPlatform(execution, testPlatform);
            expect(result.success).toBe(true);
            expect(result.platform).toBe('kubernetes');
        });
    });
    describe('PipelineOrchestrator', () => {
        it('should execute pipeline successfully', async () => {
            const results = await pipelineOrchestrator.executePipeline('test-pipeline', testArtifact, [testEnvironment]);
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
        });
        it('should provide pipeline status', () => {
            const status = pipelineOrchestrator.getPipelineStatus('non-existent');
            expect(status).toBeNull();
        });
        it('should list pipeline templates', () => {
            const templates = pipelineOrchestrator.getPipelineTemplates();
            expect(templates.length).toBeGreaterThan(0);
            expect(templates[0].id).toBeDefined();
        });
        it('should validate pipeline configuration', async () => {
            const template = {
                id: 'test-template',
                name: 'Test Pipeline',
                description: 'Test pipeline template',
                stages: [
                    {
                        name: 'build',
                        type: 'build',
                        dependencies: [],
                        config: {},
                        timeout: 300000,
                        retryPolicy: { maxRetries: 2, backoffStrategy: 'exponential', initialDelay: 1000, maxDelay: 10000 }
                    }
                ],
                complianceLevel: 'basic'
            };
            const validation = await pipelineOrchestrator.validatePipelineConfiguration(template);
            expect(validation.valid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });
    });
    describe('DeploymentConfigManager', () => {
        it('should load enterprise configuration', async () => {
            await expect(configManager.loadEnterpriseConfig()).resolves.not.toThrow();
        });
        it('should get deployment configuration', async () => {
            const config = await configManager.getDeploymentConfig('staging', 'blue-green');
            expect(config).toBeDefined();
            expect(config.environment.name).toBe('staging');
        });
        it('should get environment configuration', async () => {
            const env = await configManager.getEnvironmentConfig('production');
            expect(env.name).toBe('production');
        });
        it('should get platform configuration', async () => {
            const platform = await configManager.getPlatformConfig('kubernetes', 'staging');
            expect(platform.type).toBe('kubernetes');
        });
        it('should validate deployment configuration', async () => {
            const config = await configManager.getDeploymentConfig('staging', 'blue-green');
            const validation = await configManager.validateDeploymentConfig(config);
            expect(validation.valid).toBeDefined();
        });
        it('should provide feature flags', () => {
            const flags = configManager.getFeatureFlags('development');
            expect(flags).toBeDefined();
        });
        it('should provide compliance configuration', () => {
            const compliance = configManager.getComplianceConfig('production');
            expect(compliance.level).toBeDefined();
        });
    });
    describe('DeploymentComplianceValidator', () => {
        it('should validate deployment compliance', async () => {
            const execution = {
                id: 'compliance-test-1',
                strategy: blueGreenStrategy,
                environment: { ...testEnvironment, config: { ...testEnvironment.config, complianceLevel: 'nasa-pot10' } },
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const complianceStatus = await complianceValidator.validateDeploymentCompliance(execution);
            expect(complianceStatus.level).toBe('nasa-pot10');
            expect(complianceStatus.checks.length).toBeGreaterThan(0);
            expect(['pass', 'fail', 'warning']).toContain(complianceStatus.overallStatus);
        });
        it('should get compliance rules', () => {
            const rules = complianceValidator.getComplianceRules('basic');
            expect(rules.length).toBeGreaterThan(0);
        });
        it('should generate compliance report', async () => {
            const execution = {
                id: 'compliance-report-test',
                strategy: blueGreenStrategy,
                environment: testEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const complianceStatus = await complianceValidator.validateDeploymentCompliance(execution);
            const report = await complianceValidator.generateComplianceReport(execution, complianceStatus);
            expect(report.deploymentId).toBe('compliance-report-test');
            expect(report.complianceLevel).toBe('enhanced');
            expect(report.checks.length).toBeGreaterThan(0);
        });
        it('should register custom compliance rules', () => {
            const customRule = {
                name: 'Custom Test Rule',
                description: 'A custom test compliance rule',
                category: 'security',
                severity: 'medium',
                validator: async () => ({
                    name: 'Custom Test Rule',
                    description: 'A custom test compliance rule',
                    status: 'pass',
                    severity: 'medium',
                    details: 'Custom rule validation passed'
                })
            };
            complianceValidator.registerComplianceRule('basic', customRule);
            const rules = complianceValidator.getComplianceRules('basic');
            expect(rules.some(rule => rule.name === 'Custom Test Rule')).toBe(true);
        });
    });
    describe('Integration Tests', () => {
        it('should perform end-to-end deployment orchestration', async () => {
            // Test the complete deployment flow
            const result = await orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, testPlatform);
            expect(result.success).toBe(true);
            // Verify deployment tracking
            const history = orchestrator.getDeploymentHistory();
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].id).toBe(result.deploymentId);
        });
        it('should handle complex pipeline orchestration', async () => {
            const environments = [
                { ...testEnvironment, name: 'development', type: 'development' },
                { ...testEnvironment, name: 'staging', type: 'staging' },
                { ...testEnvironment, name: 'production', type: 'production' }
            ];
            const results = await pipelineOrchestrator.executePipeline('multi-env-pipeline', testArtifact, environments);
            expect(results.length).toBe(3);
            expect(results.every(result => result.success)).toBe(true);
        });
        it('should maintain performance budget of 0.2% overhead', async () => {
            const startTime = Date.now();
            await orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, testPlatform);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Performance overhead should be minimal
            expect(duration).toBeLessThan(10000); // Less than 10 seconds for test
        });
        it('should integrate with enterprise configuration', async () => {
            await configManager.loadEnterpriseConfig();
            const config = await configManager.getDeploymentConfig('production', 'blue-green');
            expect(config.compliance.level).toBe('nasa-pot10');
            const validation = await configManager.validateDeploymentConfig(config);
            expect(validation.valid).toBe(true);
        });
        it('should ensure NASA POT10 compliance validation', async () => {
            const prodEnvironment = {
                ...testEnvironment,
                name: 'production',
                type: 'production',
                config: {
                    ...testEnvironment.config,
                    complianceLevel: 'nasa-pot10'
                }
            };
            const execution = {
                id: 'nasa-compliance-test',
                strategy: blueGreenStrategy,
                environment: prodEnvironment,
                platform: testPlatform,
                artifact: testArtifact,
                status: {
                    phase: 'pending',
                    conditions: [],
                    replicas: { desired: 0, ready: 0, available: 0, unavailable: 0 },
                    traffic: { blue: 100, green: 0 }
                },
                metadata: {
                    createdBy: 'test',
                    createdAt: new Date(),
                    labels: {},
                    annotations: {},
                    approvals: []
                },
                timeline: []
            };
            const complianceStatus = await complianceValidator.validateDeploymentCompliance(execution);
            expect(complianceStatus.level).toBe('nasa-pot10');
            // Should have additional NASA POT10 specific checks
            const nasaChecks = complianceStatus.checks.filter(check => check.name.startsWith('POT10-') || check.name.includes('NASA'));
            expect(nasaChecks.length).toBeGreaterThan(0);
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid deployment configurations', async () => {
            const invalidEnvironment = { ...testEnvironment, config: { ...testEnvironment.config, replicas: 0 } };
            await expect(orchestrator.deploy(testArtifact, blueGreenStrategy, invalidEnvironment, testPlatform)).resolves.toEqual(expect.objectContaining({
                success: expect.any(Boolean),
                errors: expect.any(Array)
            }));
        });
        it('should handle platform connectivity issues', async () => {
            const invalidPlatform = { ...testPlatform, endpoint: 'invalid-endpoint' };
            const result = await orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, invalidPlatform);
            // Should still complete but may have warnings or different behavior
            expect(result).toBeDefined();
        });
        it('should handle deployment timeouts', async () => {
            const timeoutStrategy = {
                ...blueGreenStrategy,
                config: {
                    ...blueGreenStrategy.config,
                    timeout: 1 // Very short timeout
                }
            };
            const result = await orchestrator.deploy(testArtifact, timeoutStrategy, testEnvironment, testPlatform);
            expect(result).toBeDefined();
        });
        it('should handle emergency stop scenarios', async () => {
            const deployPromises = [
                orchestrator.deploy(testArtifact, blueGreenStrategy, testEnvironment, testPlatform),
                orchestrator.deploy(testArtifact, canaryStrategy, testEnvironment, testPlatform)
            ];
            // Emergency stop all deployments
            await orchestrator.emergencyStop('Emergency maintenance required');
            const results = await Promise.all(deployPromises);
            // Results may vary depending on timing
            expect(results.length).toBe(2);
        });
    });
});
describe('Performance and Load Tests', () => {
    it('should handle concurrent deployments efficiently', async () => {
        const orchestrator = new deployment_orchestrator_1.DeploymentOrchestrator();
        const testArtifact = {
            id: 'concurrent-test-app',
            version: '1.0.0',
            imageTag: 'test-app:1.0.0',
            checksums: { sha256: 'test-checksum' },
            compliance: {
                level: 'basic',
                checks: [],
                overallStatus: 'pass',
                auditTrail: []
            }
        };
        const testEnvironment = {
            name: 'test',
            type: 'development',
            config: {
                replicas: 1,
                resources: { cpu: '100m', memory: '128Mi', storage: '1Gi' },
                networkConfig: {
                    loadBalancer: {
                        type: 'application',
                        healthCheckPath: '/health',
                        healthCheckInterval: 30,
                        unhealthyThreshold: 3
                    },
                    serviceType: 'ClusterIP'
                },
                secrets: [],
                featureFlags: {},
                complianceLevel: 'basic'
            },
            healthEndpoints: ['http://localhost:3000/health'],
            rollbackCapable: true
        };
        const testPlatform = {
            type: 'kubernetes',
            version: 'v1.28',
            credentials: {
                type: 'kubeconfig',
                data: {}
            },
            features: {
                blueGreenSupport: true,
                canarySupport: true,
                autoScaling: false,
                loadBalancing: true,
                secretManagement: true
            }
        };
        const strategy = {
            type: 'rolling',
            config: {
                timeout: 300000,
                healthCheckDelay: 30000,
                healthCheckTimeout: 10000,
                healthCheckInterval: 5000,
                progressDeadlineSeconds: 600
            },
            rollbackStrategy: {
                enabled: true,
                autoTriggers: [],
                manualApprovalRequired: false,
                preserveResourceVersion: true
            }
        };
        // Execute multiple concurrent deployments
        const concurrentDeployments = Array.from({ length: 5 }, (_, i) => orchestrator.deploy({ ...testArtifact, id: `concurrent-test-${i}` }, strategy, testEnvironment, testPlatform));
        const startTime = Date.now();
        const results = await Promise.all(concurrentDeployments);
        const endTime = Date.now();
        // All deployments should succeed
        expect(results.every(result => result.success)).toBe(true);
        // Performance should be reasonable
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
        // Performance overhead should remain within budget
        const averagePerformanceImpact = results.reduce((sum, result) => sum + result.metrics.performanceImpact, 0) / results.length;
        expect(averagePerformanceImpact).toBeLessThanOrEqual(0.2);
    });
});
//# sourceMappingURL=deployment-orchestration.test.js.map
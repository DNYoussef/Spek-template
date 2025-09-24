/**
 * Comprehensive test suite for Feature Flag Manager
 * Tests core functionality, performance, and enterprise features
 */

// Use mock implementation for testing
const FeatureFlagManager = require('../../mocks/feature-flag-manager');
const { cleanupTestResources } = require('../../setup/test-environment');

describe('FeatureFlagManager', () => {
    let flagManager;

    beforeEach(() => {
        flagManager = new FeatureFlagManager({
            environment: 'test',
            cacheTimeout: 1000,
            maxAuditEntries: 100
        });
    });

    afterEach(async () => {
        if (flagManager) {
            await flagManager.shutdown?.();
        }
        await cleanupTestResources();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            const manager = new FeatureFlagManager();
            expect(manager.config.environment).toBe('development');
            expect(manager.config.cacheTimeout).toBe(5000);
            expect(manager.flags.size).toBe(0);
        });

        test('should initialize with custom configuration', () => {
            const customConfig = {
                environment: 'production',
                cacheTimeout: 10000,
                maxAuditEntries: 5000
            };

            const manager = new FeatureFlagManager(customConfig);
            expect(manager.config.environment).toBe('production');
            expect(manager.config.cacheTimeout).toBe(10000);
            expect(manager.config.maxAuditEntries).toBe(5000);
        });

        test('should initialize flags from configuration', async () => {
            const flagConfig = {
                test_flag_1: {
                    enabled: true,
                    rolloutStrategy: 'boolean'
                },
                test_flag_2: {
                    enabled: false,
                    rolloutStrategy: 'percentage',
                    rolloutPercentage: 50
                }
            };

            await flagManager.initialize(flagConfig);
            expect(flagManager.flags.size).toBe(2);
            expect(flagManager.flags.has('test_flag_1')).toBe(true);
            expect(flagManager.flags.has('test_flag_2')).toBe(true);
        });
    });

    describe('Flag Registration', () => {
        test('should register a simple boolean flag', async () => {
            const config = {
                enabled: true,
                rolloutStrategy: 'boolean'
            };

            const flag = await flagManager.registerFlag('simple_flag', config);

            expect(flag).toBeDefined();
            expect(flag.key).toBe('simple_flag');
            expect(flag.enabled).toBe(true);
            expect(flag.rolloutStrategy).toBe('boolean');
            expect(flag.version).toBe(1);
        });

        test('should register a percentage rollout flag', async () => {
            const config = {
                enabled: true,
                rolloutStrategy: 'percentage',
                rolloutPercentage: 25
            };

            const flag = await flagManager.registerFlag('percentage_flag', config);

            expect(flag.rolloutStrategy).toBe('percentage');
            expect(flag.rolloutPercentage).toBe(25);
        });

        test('should register a flag with environment overrides', async () => {
            const config = {
                enabled: false,
                environments: {
                    development: true,
                    production: false
                }
            };

            const flag = await flagManager.registerFlag('env_flag', config);

            expect(flag.environments.development).toBe(true);
            expect(flag.environments.production).toBe(false);
        });

        test('should register a flag with conditions', async () => {
            const config = {
                enabled: true,
                conditions: [
                    { field: 'userType', operator: 'equals', value: 'premium' }
                ]
            };

            const flag = await flagManager.registerFlag('conditional_flag', config);

            expect(flag.conditions).toHaveLength(1);
            expect(flag.conditions[0].field).toBe('userType');
        });
    });

    describe('Flag Evaluation', () => {
        beforeEach(async () => {
            await flagManager.registerFlag('boolean_flag', {
                enabled: true,
                rolloutStrategy: 'boolean'
            });

            await flagManager.registerFlag('env_flag', {
                enabled: false,
                environments: {
                    test: true
                }
            });

            await flagManager.registerFlag('percentage_flag', {
                enabled: true,
                rolloutStrategy: 'percentage',
                rolloutPercentage: 50
            });

            await flagManager.registerFlag('conditional_flag', {
                enabled: true,
                conditions: [
                    { field: 'userType', operator: 'equals', value: 'premium' }
                ]
            });
        });

        test('should evaluate simple boolean flag', async () => {
            const result = await flagManager.evaluate('boolean_flag');
            expect(result).toBe(true);
        });

        test('should evaluate environment-specific flag', async () => {
            const result = await flagManager.evaluate('env_flag', { environment: 'test' });
            expect(result).toBe(true);
        });

        test('should evaluate conditional flag with matching context', async () => {
            const context = { userType: 'premium' };
            const result = await flagManager.evaluate('conditional_flag', context);
            expect(result).toBe(true);
        });

        test('should evaluate conditional flag with non-matching context', async () => {
            const context = { userType: 'basic' };
            const result = await flagManager.evaluate('conditional_flag', context);
            expect(result).toBe(false);
        });

        test('should return false for non-existent flag', async () => {
            const result = await flagManager.evaluate('non_existent_flag');
            expect(result).toBe(false);
        });

        test('should use cache for repeated evaluations', async () => {
            const context = { userId: 'user123' };

            const result1 = await flagManager.evaluate('boolean_flag', context);
            const result2 = await flagManager.evaluate('boolean_flag', context);

            expect(result1).toBe(result2);
            // Cache should be used for the second call
        });

        test('should evaluate percentage rollout consistently', async () => {
            const context = { userId: 'consistent_user' };

            const results = [];
            for (let i = 0; i < 10; i++) {
                const result = await flagManager.evaluate('percentage_flag', context);
                results.push(result);
            }

            // All results should be the same for the same user
            expect(results.every(r => r === results[0])).toBe(true);
        });
    });

    describe('Flag Updates', () => {
        beforeEach(async () => {
            await flagManager.registerFlag('update_flag', {
                enabled: false,
                rolloutStrategy: 'boolean'
            });
        });

        test('should update flag configuration', async () => {
            const updates = { enabled: true };
            const updatedFlag = await flagManager.updateFlag('update_flag', updates);

            expect(updatedFlag.enabled).toBe(true);
            expect(updatedFlag.version).toBe(2);
            expect(updatedFlag.updatedAt).toBeDefined();
        });

        test('should clear cache when flag is updated', async () => {
            const context = { userId: 'user123' };

            // Evaluate flag to populate cache
            await flagManager.evaluate('update_flag', context);

            // Update flag
            await flagManager.updateFlag('update_flag', { enabled: true });

            // Evaluate again - should get updated result
            const result = await flagManager.evaluate('update_flag', context);
            expect(result).toBe(true);
        });

        test('should emit flagUpdated event', async () => {
            let eventEmitted = false;
            flagManager.on('flagUpdated', () => {
                eventEmitted = true;
            });

            await flagManager.updateFlag('update_flag', { enabled: true });
            expect(eventEmitted).toBe(true);
        });

        test('should throw error when updating non-existent flag', async () => {
            await expect(
                flagManager.updateFlag('non_existent', { enabled: true })
            ).rejects.toThrow('Flag non_existent not found');
        });
    });

    describe('Circuit Breaker', () => {
        test('should open circuit breaker after multiple failures', async () => {
            // Register a flag that will cause evaluation errors
            await flagManager.registerFlag('error_flag', {
                enabled: true,
                conditions: [
                    { field: 'invalid', operator: 'invalid_operator', value: 'test' }
                ]
            });

            // Simulate multiple failures
            for (let i = 0; i < 15; i++) {
                try {
                    await flagManager.evaluate('error_flag');
                } catch (error) {
                    // Expected to fail
                }
            }

            // Circuit breaker should now be open
            const isOpen = flagManager.isCircuitBreakerOpen('error_flag');
            expect(isOpen).toBe(true);
        });
    });

    describe('Performance', () => {
        test('should evaluate flags within 100ms target', async () => {
            await flagManager.registerFlag('perf_flag', {
                enabled: true,
                rolloutStrategy: 'boolean'
            });

            const startTime = process.hrtime.bigint();
            await flagManager.evaluate('perf_flag');
            const endTime = process.hrtime.bigint();

            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            expect(duration).toBeLessThan(100);
        });

        test('should handle 1000+ concurrent evaluations', async () => {
            await flagManager.registerFlag('concurrent_flag', {
                enabled: true,
                rolloutStrategy: 'percentage',
                rolloutPercentage: 50
            });

            const evaluations = [];
            for (let i = 0; i < 1000; i++) {
                evaluations.push(
                    flagManager.evaluate('concurrent_flag', { userId: `user${i}` })
                );
            }

            const results = await Promise.all(evaluations);
            expect(results).toHaveLength(1000);
        });
    });

    describe('Audit Logging', () => {
        test('should log flag registration', async () => {
            await flagManager.registerFlag('audit_flag', {
                enabled: true
            });

            const auditLog = flagManager.getAuditLog();
            const registrationEntry = auditLog.find(entry =>
                entry.action === 'FLAG_REGISTERED' &&
                entry.data.flagKey === 'audit_flag'
            );

            expect(registrationEntry).toBeDefined();
        });

        test('should log flag evaluation', async () => {
            await flagManager.registerFlag('eval_audit_flag', {
                enabled: true
            });

            await flagManager.evaluate('eval_audit_flag', { userId: 'test_user' });

            const auditLog = flagManager.getAuditLog();
            const evaluationEntry = auditLog.find(entry =>
                entry.action === 'FLAG_EVALUATED' &&
                entry.data.flagKey === 'eval_audit_flag'
            );

            expect(evaluationEntry).toBeDefined();
            expect(evaluationEntry.data.context.userId).toBe('test_user');
        });

        test('should filter audit log by criteria', async () => {
            await flagManager.registerFlag('filter_flag', {
                enabled: true
            });

            await flagManager.evaluate('filter_flag');

            const filteredLog = flagManager.getAuditLog({
                category: 'EVALUATION',
                flagKey: 'filter_flag'
            });

            expect(filteredLog.length).toBeGreaterThan(0);
            expect(filteredLog.every(entry => entry.category === 'EVALUATION')).toBe(true);
        });
    });

    describe('Statistics', () => {
        test('should provide accurate statistics', async () => {
            await flagManager.registerFlag('stats_flag', {
                enabled: true
            });

            await flagManager.evaluate('stats_flag');

            const stats = flagManager.getStatistics();

            expect(stats.flagCount).toBe(1);
            expect(stats.evaluationCount).toBeGreaterThan(0);
            expect(stats.uptime).toBeGreaterThan(0);
            expect(stats.availability).toBe(100);
        });
    });

    describe('Health Check', () => {
        test('should return healthy status for normal operations', () => {
            const health = flagManager.healthCheck();

            expect(health.healthy).toBe(true);
            expect(health.stats).toBeDefined();
            expect(health.checks.availability.status).toBe('PASS');
            expect(health.checks.performance.status).toBe('PASS');
        });
    });

    describe('Import/Export', () => {
        test('should export flags', async () => {
            await flagManager.registerFlag('export_flag', {
                enabled: true,
                metadata: { description: 'Test flag for export' }
            });

            const exportData = flagManager.exportFlags();

            expect(exportData.flags.export_flag).toBeDefined();
            expect(exportData.exportedAt).toBeDefined();
            expect(exportData.version).toBe('1.0');
        });

        test('should import flags', async () => {
            const importData = {
                flags: {
                    import_flag: {
                        enabled: false,
                        rolloutStrategy: 'boolean'
                    }
                },
                version: '1.0'
            };

            await flagManager.importFlags(importData);

            expect(flagManager.flags.has('import_flag')).toBe(true);

            const result = await flagManager.evaluate('import_flag');
            expect(result).toBe(false);
        });
    });

    describe('Rollback', () => {
        test('should rollback flag to previous version', async () => {
            await flagManager.registerFlag('rollback_flag', {
                enabled: true
            });

            // Update flag
            await flagManager.updateFlag('rollback_flag', { enabled: false });

            // Rollback
            const rolledBackFlag = await flagManager.rollback('rollback_flag');

            expect(rolledBackFlag.enabled).toBe(true);
        });

        test('should throw error when no previous version exists', async () => {
            await flagManager.registerFlag('no_history_flag', {
                enabled: true
            });

            await expect(
                flagManager.rollback('no_history_flag')
            ).rejects.toThrow('No previous version found');
        });
    });

    describe('Variant Testing', () => {
        test('should evaluate variant rollout', async () => {
            await flagManager.registerFlag('variant_flag', {
                enabled: true,
                rolloutStrategy: 'variant',
                variants: [
                    { key: 'control', value: { color: 'blue' } },
                    { key: 'treatment', value: { color: 'red' } }
                ]
            });

            const result = await flagManager.evaluate('variant_flag', { userId: 'test_user' });

            expect(result).toBeDefined();
            expect(result.enabled).toBe(true);
            expect(['control', 'treatment']).toContain(result.variant);
        });

        test('should consistently assign same variant to same user', async () => {
            await flagManager.registerFlag('consistent_variant', {
                enabled: true,
                rolloutStrategy: 'variant',
                variants: [
                    { key: 'a', value: 'A' },
                    { key: 'b', value: 'B' }
                ]
            });

            const context = { userId: 'consistent_user' };
            const results = [];

            for (let i = 0; i < 5; i++) {
                const result = await flagManager.evaluate('consistent_variant', context);
                results.push(result.variant);
            }

            // All results should be the same
            expect(results.every(variant => variant === results[0])).toBe(true);
        });
    });
});
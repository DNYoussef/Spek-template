/**
 * Feature Flag System Usage Examples
 * Demonstrates comprehensive usage of enterprise feature flag system
 */

const FeatureFlagManager = require('../src/enterprise/feature-flags/feature-flag-manager');
const FeatureFlagAPIServer = require('../src/enterprise/feature-flags/api-server');
const CICDFeatureFlagIntegration = require('../src/enterprise/feature-flags/ci-cd-integration');
const { AutoReconnectingFeatureFlagClient } = require('../src/enterprise/feature-flags/websocket-client');

async function demonstrateBasicUsage() {
    console.log('\n=== Basic Feature Flag Usage ===');

    // Initialize feature flag manager
    const flagManager = new FeatureFlagManager({
        environment: 'development',
        cacheTimeout: 5000
    });

    // Register some flags
    await flagManager.registerFlag('new_ui', {
        enabled: true,
        rolloutStrategy: 'boolean',
        metadata: { description: 'Enable new user interface' }
    });

    await flagManager.registerFlag('dark_mode', {
        enabled: false,
        environments: {
            development: true,
            production: false
        },
        metadata: { description: 'Dark mode theme' }
    });

    // Evaluate flags
    const newUIEnabled = await flagManager.evaluate('new_ui');
    console.log(`New UI enabled: ${newUIEnabled}`);

    const darkModeEnabled = await flagManager.evaluate('dark_mode', {
        environment: 'development'
    });
    console.log(`Dark mode enabled: ${darkModeEnabled}`);

    // Update a flag
    await flagManager.updateFlag('dark_mode', { enabled: true });
    const updatedDarkMode = await flagManager.evaluate('dark_mode');
    console.log(`Dark mode after update: ${updatedDarkMode}`);

    // Get statistics
    const stats = flagManager.getStatistics();
    console.log(`Flag statistics:`, {
        flagCount: stats.flagCount,
        evaluationCount: stats.evaluationCount,
        averageEvaluationTime: stats.averageEvaluationTime.toFixed(2) + 'ms'
    });
}

async function demonstratePercentageRollout() {
    console.log('\n=== Percentage Rollout Example ===');

    const flagManager = new FeatureFlagManager();

    // Register percentage rollout flag
    await flagManager.registerFlag('beta_feature', {
        enabled: true,
        rolloutStrategy: 'percentage',
        rolloutPercentage: 25, // 25% rollout
        metadata: { description: 'Beta feature gradual rollout' }
    });

    // Test with multiple users
    const testUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    const results = {};

    for (const userId of testUsers) {
        const enabled = await flagManager.evaluate('beta_feature', { userId });
        results[userId] = enabled;
    }

    console.log('Beta feature rollout results:', results);

    const enabledCount = Object.values(results).filter(Boolean).length;
    console.log(`${enabledCount}/${testUsers.length} users have beta feature enabled`);
}

async function demonstrateConditionalFlags() {
    console.log('\n=== Conditional Flags Example ===');

    const flagManager = new FeatureFlagManager();

    // Register conditional flag
    await flagManager.registerFlag('premium_feature', {
        enabled: true,
        conditions: [
            { field: 'userType', operator: 'equals', value: 'premium' },
            { field: 'region', operator: 'in', value: ['US', 'EU'] }
        ],
        metadata: { description: 'Premium users in US/EU only' }
    });

    const testContexts = [
        { userType: 'premium', region: 'US' },    // Should be enabled
        { userType: 'basic', region: 'US' },      // Should be disabled
        { userType: 'premium', region: 'ASIA' },  // Should be disabled
        { userType: 'premium', region: 'EU' }     // Should be enabled
    ];

    console.log('Premium feature evaluation results:');
    for (const context of testContexts) {
        const enabled = await flagManager.evaluate('premium_feature', context);
        console.log(`  ${JSON.stringify(context)} -> ${enabled}`);
    }
}

async function demonstrateVariantTesting() {
    console.log('\n=== A/B Testing with Variants ===');

    const flagManager = new FeatureFlagManager();

    // Register variant flag for A/B testing
    await flagManager.registerFlag('checkout_flow', {
        enabled: true,
        rolloutStrategy: 'variant',
        rolloutPercentage: 100,
        variants: [
            { key: 'single_page', value: { steps: 1, layout: 'compact' } },
            { key: 'multi_step', value: { steps: 3, layout: 'detailed' } }
        ],
        metadata: { description: 'Checkout flow A/B test' }
    });

    // Test variant assignment for different users
    const users = ['alice', 'bob', 'charlie', 'diana'];
    console.log('Checkout flow variant assignments:');

    for (const userId of users) {
        const result = await flagManager.evaluate('checkout_flow', { userId });
        console.log(`  User ${userId}: variant=${result.variant}, config=${JSON.stringify(result.value)}`);
    }
}

async function demonstrateAPIServer() {
    console.log('\n=== API Server Example ===');

    // Start API server
    const server = new FeatureFlagAPIServer({
        port: 3200,
        wsPort: 3201,
        configPath: null // Skip config file for demo
    });

    // Initialize with demo flags
    await server.flagManager.initialize({
        api_v2: {
            enabled: false,
            rolloutStrategy: 'percentage',
            rolloutPercentage: 10
        },
        maintenance_mode: {
            enabled: false,
            rolloutStrategy: 'boolean'
        }
    });

    console.log('API server started on port 3200');
    console.log('WebSocket server started on port 3201');
    console.log('Try these endpoints:');
    console.log('  GET  http://localhost:3200/api/health');
    console.log('  GET  http://localhost:3200/api/flags');
    console.log('  POST http://localhost:3200/api/flags/api_v2/evaluate');

    // Cleanup after demo
    setTimeout(() => {
        server.shutdown();
        console.log('API server stopped');
    }, 5000);
}

async function demonstrateWebSocketClient() {
    console.log('\n=== WebSocket Real-time Updates ===');

    const client = new AutoReconnectingFeatureFlagClient({
        url: 'ws://localhost:3201',
        autoConnect: false
    });

    // Setup event handlers
    client.on('connected', () => {
        console.log('Connected to feature flag WebSocket server');
    });

    client.on('flagUpdated', (event) => {
        console.log(`Flag updated: ${event.key} -> ${event.flag.enabled}`);
    });

    client.on('flagToggled', (event) => {
        console.log(`Flag toggled: ${event.key} (${event.previousState} -> ${event.newState})`);
    });

    try {
        await client.connect();
        console.log('WebSocket client connected successfully');

        // Keep connection alive for demo
        setTimeout(() => {
            client.disconnect();
            console.log('WebSocket client disconnected');
        }, 3000);

    } catch (error) {
        console.log('WebSocket server not available for demo');
    }
}

async function demonstrateCICDIntegration() {
    console.log('\n=== CI/CD Integration Example ===');

    const cicd = new CICDFeatureFlagIntegration({
        environment: 'staging',
        branch: 'feature/new-deployment'
    });

    await cicd.initialize();

    // Check quality gate enforcement
    const qualityGates = await cicd.shouldEnforceQualityGates();
    console.log('Quality gate enforcement:', qualityGates);

    // Get deployment strategy
    const strategy = await cicd.getDeploymentStrategy();
    console.log('Deployment strategy:', strategy);

    // Generate workflow conditions
    const conditions = await cicd.generateWorkflowConditions();
    console.log('Workflow conditions:', conditions);

    // Generate CI/CD configuration
    const config = await cicd.generateCICDConfig();
    console.log('CI/CD configuration generated with', Object.keys(config.flags).length, 'feature flags');
}

async function demonstratePerformanceMonitoring() {
    console.log('\n=== Performance Monitoring Example ===');

    const flagManager = new FeatureFlagManager({
        enableMetrics: true
    });

    // Register test flag
    await flagManager.registerFlag('perf_test', {
        enabled: true,
        rolloutStrategy: 'boolean'
    });

    // Simulate load
    console.log('Simulating flag evaluations...');
    for (let i = 0; i < 100; i++) {
        await flagManager.evaluate('perf_test', { userId: `user${i}` });
    }

    // Get performance metrics
    const stats = flagManager.getStatistics();
    console.log('Performance metrics:', {
        evaluationCount: stats.evaluationCount,
        averageTime: stats.averageEvaluationTime.toFixed(2) + 'ms',
        cacheSize: stats.cacheSize,
        uptime: Math.round(stats.uptime / 1000) + 's'
    });

    // Health check
    const health = flagManager.healthCheck();
    console.log('Health status:', health.healthy ? 'HEALTHY' : 'UNHEALTHY');
}

async function demonstrateAuditTrail() {
    console.log('\n=== Audit Trail Example ===');

    const flagManager = new FeatureFlagManager();

    // Perform various operations
    await flagManager.registerFlag('audit_demo', { enabled: false });
    await flagManager.updateFlag('audit_demo', { enabled: true });
    await flagManager.evaluate('audit_demo', { userId: 'admin' });

    // Get audit log
    const auditLog = flagManager.getAuditLog({ limit: 5 });

    console.log('Recent audit events:');
    auditLog.forEach(entry => {
        console.log(`  ${entry.timestamp}: ${entry.category}.${entry.action}`);
        if (entry.data.flagKey) {
            console.log(`    Flag: ${entry.data.flagKey}`);
        }
    });
}

async function demonstrateComplianceFeatures() {
    console.log('\n=== Compliance Features Example ===');

    const flagManager = new FeatureFlagManager({
        environment: 'production',
        complianceMode: 'defense' // Defense industry compliance
    });

    // Register compliance-critical flag
    await flagManager.registerFlag('classified_feature', {
        enabled: false,
        environments: {
            production: false // Disabled in production
        },
        conditions: [
            { field: 'clearanceLevel', operator: 'equals', value: 'SECRET' }
        ],
        metadata: {
            classification: 'CONTROLLED_UNCLASSIFIED',
            compliance: ['DFARS', 'NIST-800-53']
        }
    });

    // Evaluate with different contexts
    const contexts = [
        { clearanceLevel: 'PUBLIC' },
        { clearanceLevel: 'SECRET' },
        { clearanceLevel: 'TOP_SECRET' }
    ];

    console.log('Classified feature access control:');
    for (const context of contexts) {
        const enabled = await flagManager.evaluate('classified_feature', context);
        console.log(`  Clearance ${context.clearanceLevel}: ${enabled ? 'GRANTED' : 'DENIED'}`);
    }

    // Export for compliance audit
    const exportData = flagManager.exportFlags();
    console.log('Compliance export generated with', Object.keys(exportData.flags).length, 'flags');
}

async function demonstrateErrorHandling() {
    console.log('\n=== Error Handling and Circuit Breaker ===');

    const flagManager = new FeatureFlagManager({
        circuitBreakerThreshold: 0.5 // 50% failure rate threshold
    });

    // Register flag that will cause evaluation errors
    await flagManager.registerFlag('error_prone', {
        enabled: true,
        conditions: [
            { field: 'invalid', operator: 'invalid_op', value: 'test' }
        ]
    });

    // Simulate failures to trigger circuit breaker
    console.log('Simulating evaluation failures...');
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < 10; i++) {
        try {
            await flagManager.evaluate('error_prone');
            successCount++;
        } catch (error) {
            failureCount++;
        }
    }

    console.log(`Results: ${successCount} successes, ${failureCount} failures`);

    const stats = flagManager.getStatistics();
    console.log(`Availability: ${stats.availability.toFixed(1)}%`);
}

// Main demo function
async function runAllDemos() {
    console.log('[ROCKET] Feature Flag System Comprehensive Demo\n');

    try {
        await demonstrateBasicUsage();
        await demonstratePercentageRollout();
        await demonstrateConditionalFlags();
        await demonstrateVariantTesting();
        await demonstratePerformanceMonitoring();
        await demonstrateAuditTrail();
        await demonstrateComplianceFeatures();
        await demonstrateErrorHandling();
        await demonstrateCICDIntegration();

        // API server demo (runs in background)
        demonstrateAPIServer();

        // Wait a bit for API server, then try WebSocket
        setTimeout(async () => {
            await demonstrateWebSocketClient();
        }, 1000);

        console.log('\n[OK] All demos completed successfully!');
        console.log('\nFeature Flag System Capabilities:');
        console.log(' Zero-downtime flag updates');
        console.log(' Real-time WebSocket synchronization');
        console.log(' Percentage-based gradual rollouts');
        console.log(' A/B testing with variants');
        console.log(' Conditional flag evaluation');
        console.log(' Circuit breaker patterns');
        console.log(' Comprehensive audit logging');
        console.log(' CI/CD workflow integration');
        console.log(' Enterprise compliance features');
        console.log(' High-performance evaluation (<100ms)');

    } catch (error) {
        console.error('Demo failed:', error.message);
    }
}

// Export for use in other modules
module.exports = {
    demonstrateBasicUsage,
    demonstratePercentageRollout,
    demonstrateConditionalFlags,
    demonstrateVariantTesting,
    demonstrateAPIServer,
    demonstrateWebSocketClient,
    demonstrateCICDIntegration,
    demonstratePerformanceMonitoring,
    demonstrateAuditTrail,
    demonstrateComplianceFeatures,
    demonstrateErrorHandling,
    runAllDemos
};

// Run all demos if executed directly
if (require.main === module) {
    runAllDemos();
}
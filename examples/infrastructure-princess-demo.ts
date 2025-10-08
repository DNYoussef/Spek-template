import express from 'express';
import InfrastructurePrincess from '../src/princesses/infrastructure/InfrastructurePrincess';
import createInfrastructureRoutes from '../src/api/infrastructure/routes';

/**
 * Infrastructure Princess Demo
 * Demonstrates complete Infrastructure Princess setup with:
 * - 10MB Langroid Memory integration
 * - Queen-Princess-Drone communication
 * - REST API endpoints
 * - Real-time monitoring and reporting
 */

async function runInfrastructurePrincessDemo(): Promise<void> {
  console.log('🏰 Starting Infrastructure Princess Demo...\n');

  try {
    // Initialize Infrastructure Princess
    console.log('1️⃣ Initializing Infrastructure Princess...');
    const princess = new InfrastructurePrincess({
      memory: {
        enabled: true,
        persistenceEnabled: true,
        persistencePath: './data/infrastructure-memory',
        metricsEnabled: true,
        metricsInterval: 5000 // 5 seconds for demo
      },
      taskManagement: {
        maxConcurrentTasks: 5,
        maxQueueSize: 100,
        defaultRetries: 2
      },
      reporting: {
        enabled: true,
        autoReportInterval: 30000, // 30 seconds for demo
        queenEndpoint: 'http://localhost:3001/queen/reports'
      },
      resourceManagement: {
        enableOptimization: true,
        optimizationInterval: 60000 // 1 minute for demo
      }
    });

    // Set up event listeners
    princess.on('initialized', () => {
      console.log('✅ Infrastructure Princess initialized successfully');
    });

    princess.on('status-changed', (status) => {
      console.log(`📊 Status: ${status.status} | Memory: ${status.memoryStatus.usedPercent.toFixed(1)}% | Tasks: ${status.taskStatus.activeTasks}`);
    });

    princess.on('command-completed', (result) => {
      console.log(`✅ Command completed: ${result.commandId}`);
    });

    princess.on('report-generated', (report) => {
      console.log(`📋 Report generated: ${report.type} (${report.priority})`);
    });

    princess.on('component-error', (error) => {
      console.error(`❌ Component error in ${error.component}:`, error.error);
    });

    // Initialize
    await princess.initialize();

    console.log('\n2️⃣ Setting up Express API server...');

    // Create Express app
    const app = express();
    app.use(express.json());

    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`🌐 ${req.method} ${req.path}`);
      next();
    });

    // Mount Infrastructure Princess routes
    app.use('/api/infrastructure', createInfrastructureRoutes(princess));

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const health = await princess.healthCheck();
        res.json({
          service: 'Infrastructure Princess Demo',
          timestamp: new Date().toISOString(),
          health
        });
      } catch (error) {
        res.status(500).json({
          service: 'Infrastructure Princess Demo',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Infrastructure Princess API server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api/infrastructure`);
    });

    console.log('\n3️⃣ Running demo scenarios...\n');

    // Demo Scenario 1: Memory Operations
    console.log('📝 Demo 1: Memory Operations');
    const memoryBackend = princess.getMemoryBackend();

    // Store some sample data
    await memoryBackend.store('demo-config', {
      service: 'demo',
      version: '1.0.0',
      settings: { debug: true, timeout: 30000 }
    }, {
      tags: ['config', 'demo'],
      metadata: { createdBy: 'demo', importance: 'high' }
    });

    await memoryBackend.store('demo-metrics', {
      cpu: 45.2,
      memory: 78.5,
      disk: 23.1,
      timestamp: Date.now()
    }, {
      tags: ['metrics', 'system'],
      metadata: { type: 'performance' }
    });

    console.log('  ✅ Stored sample configuration and metrics');

    // Query data
    const configResults = await memoryBackend.query({
      tags: ['config'],
      limit: 10
    });
    console.log(`  📊 Found ${configResults.length} configuration entries`);

    // Demo Scenario 2: Task Management
    console.log('\n🎯 Demo 2: Task Submission and Management');
    const taskManager = princess.getTaskManager();

    // Submit sample tasks
    const deploymentTask = await taskManager.submitTask({
      id: 'demo-deployment-1',
      type: 'deployment',
      priority: 4, // High priority
      payload: {
        service: 'web-app',
        version: 'v2.1.0',
        environment: 'staging'
      },
      metadata: { submittedBy: 'demo', automated: true },
      tags: ['deployment', 'staging'],
      submittedAt: Date.now(),
      status: 'pending' as any,
      progress: 0,
      retryCount: 0,
      maxRetries: 3
    });

    const monitoringTask = await taskManager.submitTask({
      id: 'demo-monitoring-1',
      type: 'monitoring',
      priority: 3, // Medium priority
      payload: {
        target: 'infrastructure',
        metrics: ['cpu', 'memory', 'disk'],
        interval: 60000
      },
      metadata: { submittedBy: 'demo' },
      tags: ['monitoring', 'system'],
      submittedAt: Date.now(),
      status: 'pending' as any,
      progress: 0,
      retryCount: 0,
      maxRetries: 2
    });

    console.log(`  ✅ Submitted deployment task: ${deploymentTask.id}`);
    console.log(`  ✅ Submitted monitoring task: ${monitoringTask.id}`);

    // Demo Scenario 3: Queen Command Processing
    console.log('\n👑 Demo 3: Queen Command Processing');
    const queenCommand = {
      id: 'queen-cmd-1',
      type: 'infrastructure',
      subType: 'scale-resources',
      priority: 'high',
      payload: {
        component: 'memory',
        action: 'increase',
        amount: 512, // MB
        reason: 'High utilization detected'
      },
      metadata: { initiatedBy: 'queen', urgent: true },
      requiresConfirmation: false,
      timeout: 300000 // 5 minutes
    };

    const commandResult = await princess.processQueenCommand(queenCommand);
    console.log(`  ✅ Processed Queen command: ${queenCommand.id}`);
    console.log(`  📋 Status: ${commandResult.status}`);

    // Demo Scenario 4: Resource Allocation
    console.log('\n🔧 Demo 4: Resource Allocation');
    const resourceAllocation = princess.getResourceAllocation();

    const allocationRequest = {
      requestId: 'demo-alloc-1',
      resourceType: 'memory' as any,
      amount: 256, // MB
      requesterComponent: 'demo',
      requesterId: 'demo-task-1',
      priority: 4 as any,
      estimatedDuration: 120000, // 2 minutes
      tags: ['demo', 'temporary']
    };

    const allocationResult = await resourceAllocation.requestAllocation(allocationRequest);
    console.log(`  ✅ Resource allocation: ${allocationResult.success ? 'Success' : 'Failed'}`);
    if (allocationResult.allocationId) {
      console.log(`  🔗 Allocation ID: ${allocationResult.allocationId}`);
    }

    // Demo Scenario 5: Status and Health Monitoring
    console.log('\n📊 Demo 5: Status and Health Monitoring');

    // Generate status report
    const statusReport = await princess.generateStatusReport();
    console.log(`  📋 Generated status report: ${statusReport.id}`);
    console.log(`  📈 System status: ${statusReport.status}`);
    console.log(`  🎯 Health score: ${princess.getStatus().healthScore}/100`);

    // Health check
    const healthCheck = await princess.healthCheck();
    console.log(`  🔍 Health check: ${healthCheck.overall}`);
    console.log(`  🧩 Components: ${Object.keys(healthCheck.components).length} checked`);

    // Demo API calls
    console.log('\n🌐 Demo 6: API Endpoint Testing');
    console.log('  📡 Try these API endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/infrastructure/status`);
    console.log(`  GET  http://localhost:${PORT}/api/infrastructure/memory/stats`);
    console.log(`  GET  http://localhost:${PORT}/api/infrastructure/tasks`);
    console.log(`  GET  http://localhost:${PORT}/api/infrastructure/resources/utilization`);
    console.log(`  POST http://localhost:${PORT}/api/infrastructure/reports/generate`);

    // Set up periodic status updates
    setInterval(() => {
      const status = princess.getStatus();
      console.log(`\n⏱️  Periodic Status Update:`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Uptime: ${Math.floor(status.uptime / 1000)}s`);
      console.log(`   Memory: ${status.memoryStatus.usedPercent.toFixed(1)}% used, ${status.memoryStatus.entryCount} entries`);
      console.log(`   Tasks: ${status.taskStatus.activeTasks} active, ${status.taskStatus.queuedTasks} queued`);
      console.log(`   Health: ${status.healthScore}/100`);
    }, 30000); // Every 30 seconds

    console.log('\n🎉 Infrastructure Princess Demo is running!');
    console.log('   📊 Monitor the console for real-time updates');
    console.log('   🌐 Use the API endpoints to interact with the system');
    console.log('   ⏹️  Press Ctrl+C to stop the demo\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Infrastructure Princess Demo...');

      try {
        // Close server
        server.close();

        // Shutdown princess
        await princess.shutdown();

        console.log('✅ Demo shutdown completed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Demo failed to start:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runInfrastructurePrincessDemo().catch(console.error);
}

export { runInfrastructurePrincessDemo };
export default runInfrastructurePrincessDemo;
/**
 * FSM Orchestration Demo - Complete Integration Example
 * Demonstrates the full FSM orchestration system with LangGraph integration
 */

import FSMOrchestrator from '../src/fsm';
import {
  SystemEvent,
  PrincessEvent,
  DevelopmentEvent,
  LangGraphWorkflow,
  LangGraphNode,
  LangGraphEdge
} from '../src/fsm';

/**
 * Demo: Complete FSM Orchestration with LangGraph Workflow
 */
async function runFSMOrchestrationDemo(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  FSM ORCHESTRATION SYSTEM DEMO');
  console.log('='.repeat(60));

  // Step 1: Initialize the orchestrator
  console.log('\n1. Initializing FSM Orchestrator...');
  const orchestrator = new FSMOrchestrator({
    enableSystemFSM: true,
    enableTransitionHub: true,
    enableMonitoring: true,
    enableLangGraphIntegration: true,
    performanceMode: 'development',
    maxPrincessFSMs: 6
  });

  try {
    await orchestrator.initialize();
    console.log('✓ FSM Orchestrator initialized successfully');

    // Step 2: Show system status
    console.log('\n2. System Status:');
    const initialStatus = orchestrator.getSystemStatus();
    console.log('  System FSM Active:', initialStatus.systemFSM.active);
    console.log('  Transition Hub Active:', initialStatus.transitionHub.active);
    console.log('  Monitoring Active:', initialStatus.monitoring.active);
    console.log('  LangGraph Active:', initialStatus.langGraph.active);
    console.log('  Princess FSMs:', initialStatus.princesses.total);

    // Step 3: Create and register a LangGraph workflow
    console.log('\n3. Creating LangGraph Workflow...');
    const developmentWorkflow = createDevelopmentWorkflow();
    await orchestrator.registerWorkflow(developmentWorkflow);
    console.log('✓ Development workflow registered');

    // Step 4: Set up monitoring
    console.log('\n4. Setting up monitoring...');
    setupMonitoring(orchestrator);

    // Step 5: Start system FSM
    console.log('\n5. Starting system operations...');
    await orchestrator.sendSystemEvent(SystemEvent.INITIALIZE);
    console.log('✓ System FSM initialized');

    // Wait for system to become active
    await new Promise(resolve => setTimeout(resolve, 2000));
    await orchestrator.sendSystemEvent(SystemEvent.START);
    console.log('✓ System FSM started');

    // Step 6: Execute LangGraph workflow
    console.log('\n6. Executing development workflow...');
    const workflowResult = await orchestrator.executeWorkflow('dev-workflow-demo', {
      projectName: 'FSM Demo Project',
      requirements: [
        'Implement state machine orchestration',
        'Add LangGraph integration',
        'Create monitoring system'
      ],
      priority: 'high'
    });
    console.log('✓ Workflow execution started');
    console.log('  Workflow ID:', workflowResult.workflowId);
    console.log('  Current Node:', workflowResult.currentNode);

    // Step 7: Trigger development princess events
    console.log('\n7. Triggering development princess workflow...');
    
    // Simulate development workflow progression
    console.log('  → Analyzing requirements...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('  → Designing solution...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.REQUIREMENTS_ANALYZED);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('  → Implementing code...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.DESIGN_APPROVED);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('  → Running tests...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.CODE_IMPLEMENTED);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('  → Code review...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.TESTS_PASSED);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('  → Documentation...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.REVIEW_PASSED);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log('  → Deployment preparation...');
    await orchestrator.sendPrincessEvent('development', DevelopmentEvent.DOCS_COMPLETE);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('  → Completing workflow...');
    await orchestrator.sendPrincessEvent('development', PrincessEvent.TASK_COMPLETE);
    
    // Step 8: Show final system status
    console.log('\n8. Final System Status:');
    const finalStatus = orchestrator.getSystemStatus();
    console.log('  System State:', finalStatus.systemFSM.currentState);
    console.log('  Registered FSMs:', finalStatus.transitionHub.registeredFSMs);
    console.log('  Total Transitions:', finalStatus.transitionHub.activeTransitions);
    console.log('  Active Princess FSMs:', finalStatus.princesses.active);
    console.log('  Princess States:', finalStatus.princesses.states);

    // Step 9: Show performance metrics
    console.log('\n9. Performance Metrics:');
    const metrics = orchestrator.getPerformanceMetrics();
    if (metrics && metrics.current) {
      console.log('  Transitions/sec:', metrics.current.transitionsPerSecond.toFixed(2));
      console.log('  Avg Transition Time:', metrics.current.averageTransitionTime.toFixed(2), 'ms');
      console.log('  Error Rate:', (metrics.current.errorRate * 100).toFixed(2), '%');
      console.log('  Performance Score:', metrics.current.performanceScore.toFixed(2));
      console.log('  Active Alerts:', metrics.alerts.length);
    }

    // Step 10: Show development princess progress
    console.log('\n10. Development Princess Progress:');
    const devFSM = orchestrator.getPrincessFSM('development');
    if (devFSM) {
      const progress = devFSM.getProgress();
      console.log('  Current State:', progress.currentState);
      console.log('  Progress:', progress.progressPercentage.toFixed(1), '%');
      console.log('  Completed States:', progress.completedStates.length);
      console.log('  Est. Time Remaining:', Math.round(progress.estimatedTimeRemaining / 1000), 'seconds');
      console.log('  Workflow Complete:', devFSM.isComplete());
    }

    // Step 11: Test system health
    console.log('\n11. System Health Check:');
    const isHealthy = orchestrator.isSystemHealthy();
    console.log('  System Healthy:', isHealthy ? '✓ YES' : '✗ NO');

    console.log('\n' + '='.repeat(60));
    console.log('  DEMO COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n12. Shutting down system...');
    await orchestrator.shutdown();
    console.log('✓ System shutdown complete');
  }
}

/**
 * Create a sample development workflow for LangGraph
 */
function createDevelopmentWorkflow(): LangGraphWorkflow {
  const nodes: LangGraphNode[] = [
    {
      id: 'start',
      name: 'Start Development',
      type: 'state',
      state: 'ready',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Starting development process');
          context.variables.startTime = Date.now();
        }
      }
    },
    {
      id: 'analyze_requirements',
      name: 'Analyze Requirements',
      type: 'state',
      state: 'analyzing_requirements',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Analyzing requirements');
          context.variables.requirementsAnalyzed = true;
        }
      }
    },
    {
      id: 'design_solution',
      name: 'Design Solution',
      type: 'state',
      state: 'designing_solution',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Designing solution');
          context.variables.solutionDesigned = true;
        }
      }
    },
    {
      id: 'implement_code',
      name: 'Implement Code',
      type: 'state',
      state: 'implementing_code',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Implementing code');
          context.variables.codeImplemented = true;
        }
      }
    },
    {
      id: 'run_tests',
      name: 'Run Tests',
      type: 'state',
      state: 'running_tests',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Running tests');
          context.variables.testsCompleted = true;
        }
      }
    },
    {
      id: 'complete',
      name: 'Complete',
      type: 'state',
      state: 'complete',
      metadata: {
        onEntry: async (context: any) => {
          console.log('    [Workflow] Development completed!');
          context.variables.endTime = Date.now();
          const duration = context.variables.endTime - context.variables.startTime;
          console.log('    [Workflow] Total duration:', Math.round(duration / 1000), 'seconds');
        }
      }
    }
  ];

  const edges: LangGraphEdge[] = [
    {
      from: 'start',
      to: 'analyze_requirements',
      event: 'begin_analysis'
    },
    {
      from: 'analyze_requirements',
      to: 'design_solution',
      event: 'requirements_complete'
    },
    {
      from: 'design_solution',
      to: 'implement_code',
      event: 'design_approved'
    },
    {
      from: 'implement_code',
      to: 'run_tests',
      event: 'implementation_complete'
    },
    {
      from: 'run_tests',
      to: 'complete',
      event: 'tests_passed'
    }
  ];

  return {
    id: 'dev-workflow-demo',
    name: 'Development Workflow Demo',
    nodes,
    edges,
    metadata: {
      description: 'Sample development workflow for FSM orchestration demo',
      version: '1.0.0',
      createdAt: Date.now()
    }
  };
}

/**
 * Set up monitoring event handlers
 */
function setupMonitoring(orchestrator: FSMOrchestrator): void {
  // Monitor initialization
  orchestrator.on('initialized', (status) => {
    console.log('  ✓ Orchestrator initialized with status:', 
      Object.keys(status).filter(key => status[key].active).join(', ')
    );
  });

  // Monitor FSM registrations
  orchestrator.on('fsmRegistered', (data) => {
    console.log(`  ✓ FSM registered: ${data.name} (${data.type})`);
  });

  // Monitor performance alerts
  orchestrator.on('performanceAlert', (alert) => {
    console.log(`  ⚠️  Performance Alert [${alert.severity}]: ${alert.message}`);
  });

  // Monitor metrics updates (throttled)
  let lastMetricsLog = 0;
  orchestrator.on('metricsUpdate', (metrics) => {
    const now = Date.now();
    if (now - lastMetricsLog > 10000) { // Log every 10 seconds
      console.log(`  📊 Metrics: ${metrics.transitionsPerSecond.toFixed(1)} TPS, ` +
                 `${metrics.averageTransitionTime.toFixed(0)}ms avg, ` +
                 `${(metrics.errorRate * 100).toFixed(1)}% errors`);
      lastMetricsLog = now;
    }
  });

  // Monitor FSM errors
  orchestrator.on('fsmError', (data) => {
    console.log(`  ❌ FSM Error in ${data.fsmId}:`, data.error.message);
  });
}

/**
 * Main demo execution
 */
if (require.main === module) {
  runFSMOrchestrationDemo()
    .then(() => {
      console.log('\n🎉 FSM Orchestration Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FSM Orchestration Demo failed:', error);
      process.exit(1);
    });
}

export { runFSMOrchestrationDemo };

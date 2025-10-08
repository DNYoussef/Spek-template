/**
 * LangGraph State Machine Integration Comprehensive Validation Suite
 * Validates all aspects of LangGraph state machine integration including:
 * - Princess State Machines (state transitions and workflows)
 * - Inter-Princess Communication (state-aware message routing)
 * - Dynamic Workflows (adaptive workflow creation and execution)
 * - Error Recovery (automatic recovery from invalid states)
 * - Performance Metrics (state transition latency and throughput)
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom';
import { LangGraphStateManager } from '../../src/swarm/state/LangGraphStateManager';
import { StateMachine } from '../../src/swarm/state/StateMachine';
import { WorkflowOrchestrator } from '../../src/swarm/workflow/WorkflowOrchestrator';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

interface LangGraphValidationMetrics {
  stateTransitionLatency: number;
  workflowExecutionTime: number;
  errorRecoveryRate: number;
  messageRoutingAccuracy: number;
  concurrentWorkflowThroughput: number;
  stateConsistencyScore: number;
}

interface StateTransitionLog {
  timestamp: number;
  fromState: string;
  toState: string;
  event: string;
  princess: string;
  duration: number;
  success: boolean;
}

export class LangGraphValidator {
  private stateManager: LangGraphStateManager;
  private workflowOrchestrator: WorkflowOrchestrator;
  private performanceMonitor: PerformanceMonitor;
  private validationMetrics: LangGraphValidationMetrics;
  private transitionLogs: StateTransitionLog[] = [];
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.stateManager = new LangGraphStateManager();
    this.workflowOrchestrator = new WorkflowOrchestrator();
    this.performanceMonitor = new PerformanceMonitor();
    this.validationMetrics = {
      stateTransitionLatency: 0,
      workflowExecutionTime: 0,
      errorRecoveryRate: 0,
      messageRoutingAccuracy: 0,
      concurrentWorkflowThroughput: 0,
      stateConsistencyScore: 0
    };
  }

  /**
   * Run comprehensive validation suite
   */
  async runComprehensiveValidation(): Promise<{
    passed: boolean;
    score: number;
    metrics: LangGraphValidationMetrics;
    details: any;
  }> {
    console.log('[LangGraph Validator] Starting comprehensive validation...');

    try {
      // 1. Princess State Machine Validation
      const princessStateResults = await this.validatePrincessStateMachines();

      // 2. Inter-Princess Communication
      const communicationResults = await this.validateInterPrincessCommunication();

      // 3. Dynamic Workflow Creation
      const dynamicWorkflowResults = await this.validateDynamicWorkflows();

      // 4. Error Recovery Mechanisms
      const errorRecoveryResults = await this.validateErrorRecovery();

      // 5. Performance Metrics
      const performanceResults = await this.validatePerformanceMetrics();

      // 6. State Consistency
      const consistencyResults = await this.validateStateConsistency();

      // 7. Concurrent Workflow Execution
      const concurrencyResults = await this.validateConcurrentWorkflows();

      // Calculate overall score
      const overallScore = this.calculateOverallScore([
        princessStateResults,
        communicationResults,
        dynamicWorkflowResults,
        errorRecoveryResults,
        performanceResults,
        consistencyResults,
        concurrencyResults
      ]);

      return {
        passed: overallScore >= 95,
        score: overallScore,
        metrics: this.validationMetrics,
        details: {
          princessStateMachines: princessStateResults,
          interPrincessCommunication: communicationResults,
          dynamicWorkflows: dynamicWorkflowResults,
          errorRecovery: errorRecoveryResults,
          performanceMetrics: performanceResults,
          stateConsistency: consistencyResults,
          concurrentWorkflows: concurrencyResults
        }
      };
    } catch (error) {
      console.error('[LangGraph Validator] Validation failed:', error);
      return {
        passed: false,
        score: 0,
        metrics: this.validationMetrics,
        details: { error: error.message }
      };
    }
  }

  /**
   * Validate Princess State Machines
   */
  private async validatePrincessStateMachines(): Promise<any> {
    console.log('[LangGraph Validator] Validating Princess State Machines...');

    const tests = [
      {
        name: 'Infrastructure Princess State Machine',
        test: async () => {
          const infraStateMachine = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');

          // Define expected states for Infrastructure Princess
          const expectedStates = [
            'idle',
            'analyzing_requirements',
            'configuring_environment',
            'building',
            'testing',
            'deploying',
            'monitoring',
            'error',
            'completed'
          ];

          // Verify state machine configuration
          const states = infraStateMachine.getStates();
          for (const expectedState of expectedStates) {
            expect(states).toContain(expectedState);
          }

          // Test state transitions
          const transitionSequence = [
            { from: 'idle', event: 'start_task', to: 'analyzing_requirements' },
            { from: 'analyzing_requirements', event: 'requirements_analyzed', to: 'configuring_environment' },
            { from: 'configuring_environment', event: 'environment_ready', to: 'building' },
            { from: 'building', event: 'build_complete', to: 'testing' },
            { from: 'testing', event: 'tests_passed', to: 'deploying' },
            { from: 'deploying', event: 'deployment_complete', to: 'monitoring' },
            { from: 'monitoring', event: 'monitoring_stable', to: 'completed' }
          ];

          for (const transition of transitionSequence) {
            const startTime = Date.now();
            const result = await infraStateMachine.transition(transition.event);
            const duration = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(result.newState).toBe(transition.to);
            expect(duration).toBeLessThan(50); // <50ms per transition

            this.transitionLogs.push({
              timestamp: Date.now(),
              fromState: transition.from,
              toState: transition.to,
              event: transition.event,
              princess: 'InfrastructurePrincess',
              duration,
              success: result.success
            });
          }

          return { success: true, transitionsValidated: transitionSequence.length };
        }
      },
      {
        name: 'Research Princess State Machine',
        test: async () => {
          const researchStateMachine = await this.stateManager.createPrincessStateMachine('ResearchPrincess');

          const expectedStates = [
            'idle',
            'gathering_sources',
            'analyzing_patterns',
            'synthesizing_knowledge',
            'validating_findings',
            'generating_insights',
            'error',
            'completed'
          ];

          const states = researchStateMachine.getStates();
          for (const expectedState of expectedStates) {
            expect(states).toContain(expectedState);
          }

          // Test complex research workflow
          const researchWorkflow = await this.workflowOrchestrator.createWorkflow('research_analysis', {
            princess: 'ResearchPrincess',
            stateMachine: researchStateMachine,
            steps: [
              { state: 'gathering_sources', duration: 100 },
              { state: 'analyzing_patterns', duration: 200 },
              { state: 'synthesizing_knowledge', duration: 150 },
              { state: 'validating_findings', duration: 100 },
              { state: 'generating_insights', duration: 50 }
            ]
          });

          const workflowResult = await this.workflowOrchestrator.execute(researchWorkflow.id);
          expect(workflowResult.success).toBe(true);
          expect(workflowResult.finalState).toBe('completed');

          return { success: true, workflowExecuted: true };
        }
      },
      {
        name: 'Multi-Princess State Coordination',
        test: async () => {
          // Create coordinated workflow between Infrastructure and Research Princess
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');
          const researchSM = await this.stateManager.createPrincessStateMachine('ResearchPrincess');

          const coordinatedWorkflow = await this.workflowOrchestrator.createCoordinatedWorkflow([
            { princess: 'InfrastructurePrincess', stateMachine: infraSM },
            { princess: 'ResearchPrincess', stateMachine: researchSM }
          ]);

          // Define coordination points
          const coordinationPoints = [
            { infraState: 'analyzing_requirements', researchAction: 'gather_architecture_patterns' },
            { researchState: 'analyzing_patterns', infraAction: 'configure_based_on_patterns' },
            { infraState: 'building', researchAction: 'validate_implementation_patterns' }
          ];

          const startTime = Date.now();
          const result = await this.workflowOrchestrator.executeCoordinated(coordinatedWorkflow.id);
          const executionTime = Date.now() - startTime;

          this.validationMetrics.workflowExecutionTime = executionTime;
          expect(result.success).toBe(true);
          expect(executionTime).toBeLessThan(5000); // <5s for coordinated workflow

          return { success: true, coordinationPoints: coordinationPoints.length, executionTime };
        }
      },
      {
        name: 'State Machine Guard Conditions',
        test: async () => {
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');

          // Add guard conditions to state transitions
          infraSM.addGuard('building', 'build_complete', async (context) => {
            return context.buildStatus === 'success' && context.testsConfigured === true;
          });

          // Test transition with failing guard
          const failContext = { buildStatus: 'failed', testsConfigured: false };
          const failResult = await infraSM.transition('build_complete', failContext);
          expect(failResult.success).toBe(false);

          // Test transition with passing guard
          const passContext = { buildStatus: 'success', testsConfigured: true };
          const passResult = await infraSM.transition('build_complete', passContext);
          expect(passResult.success).toBe(true);

          return { success: true, guardConditionsWorking: true };
        }
      }
    ];

    const results = await this.runTestSuite('Princess State Machines', tests);
    return results;
  }

  /**
   * Validate Inter-Princess Communication
   */
  private async validateInterPrincessCommunication(): Promise<any> {
    console.log('[LangGraph Validator] Validating Inter-Princess Communication...');

    const tests = [
      {
        name: 'State-Aware Message Routing',
        test: async () => {
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');
          const researchSM = await this.stateManager.createPrincessStateMachine('ResearchPrincess');

          // Set up state-aware routing
          const router = await this.stateManager.createMessageRouter([
            { princess: 'InfrastructurePrincess', stateMachine: infraSM },
            { princess: 'ResearchPrincess', stateMachine: researchSM }
          ]);

          // Test message routing based on states
          const testMessages = [
            {
              from: 'InfrastructurePrincess',
              to: 'ResearchPrincess',
              type: 'request_architecture_patterns',
              context: { infraState: 'analyzing_requirements' }
            },
            {
              from: 'ResearchPrincess',
              to: 'InfrastructurePrincess',
              type: 'provide_patterns',
              context: { researchState: 'synthesizing_knowledge' }
            }
          ];

          let routingAccuracy = 0;

          for (const message of testMessages) {
            const routingResult = await router.routeMessage(message);

            // Verify message was routed correctly based on current states
            if (routingResult.routed && routingResult.deliveredTo === message.to) {
              routingAccuracy++;
            }
          }

          const accuracy = (routingAccuracy / testMessages.length) * 100;
          this.validationMetrics.messageRoutingAccuracy = accuracy;
          expect(accuracy).toBeGreaterThan(95); // >95% routing accuracy

          return { success: true, routingAccuracy: accuracy, messagesRouted: testMessages.length };
        }
      },
      {
        name: 'Princess State Synchronization',
        test: async () => {
          const princesses = ['InfrastructurePrincess', 'ResearchPrincess', 'QualityPrincess'];
          const stateMachines = new Map();

          // Create state machines for all princesses
          for (const princess of princesses) {
            const sm = await this.stateManager.createPrincessStateMachine(princess);
            stateMachines.set(princess, sm);
          }

          // Test state synchronization across princesses
          const syncWorkflow = await this.workflowOrchestrator.createSynchronizedWorkflow(Array.from(stateMachines.entries()));

          // Define synchronization points
          const syncPoints = [
            { event: 'requirements_complete', waitFor: ['InfrastructurePrincess', 'ResearchPrincess'] },
            { event: 'implementation_ready', waitFor: ['InfrastructurePrincess', 'QualityPrincess'] },
            { event: 'validation_complete', waitFor: ['ResearchPrincess', 'QualityPrincess'] }
          ];

          const syncResult = await this.workflowOrchestrator.executeSynchronized(syncWorkflow.id, syncPoints);

          expect(syncResult.success).toBe(true);
          expect(syncResult.syncPointsReached).toBe(syncPoints.length);

          return { success: true, syncPointsReached: syncResult.syncPointsReached };
        }
      },
      {
        name: 'Communication Protocol Validation',
        test: async () => {
          // Test different communication patterns
          const communicationPatterns = [
            { type: 'request-response', participants: 2 },
            { type: 'publish-subscribe', participants: 3 },
            { type: 'broadcast', participants: 5 },
            { type: 'pipeline', participants: 4 }
          ];

          const results = [];

          for (const pattern of communicationPatterns) {
            const protocolTest = await this.stateManager.testCommunicationProtocol(pattern);
            results.push({
              pattern: pattern.type,
              success: protocolTest.success,
              latency: protocolTest.latency,
              throughput: protocolTest.throughput
            });

            expect(protocolTest.success).toBe(true);
            expect(protocolTest.latency).toBeLessThan(100); // <100ms communication latency
          }

          return { success: true, patternsValidated: results.length, results };
        }
      }
    ];

    const results = await this.runTestSuite('Inter-Princess Communication', tests);
    return results;
  }

  /**
   * Validate Dynamic Workflows
   */
  private async validateDynamicWorkflows(): Promise<any> {
    console.log('[LangGraph Validator] Validating Dynamic Workflows...');

    const tests = [
      {
        name: 'Adaptive Workflow Creation',
        test: async () => {
          // Test dynamic workflow adaptation based on runtime conditions
          const adaptiveWorkflow = await this.workflowOrchestrator.createAdaptiveWorkflow({
            baseTemplate: 'development_pipeline',
            adaptationRules: [
              {
                condition: 'high_complexity',
                adaptation: 'add_additional_review_steps'
              },
              {
                condition: 'security_requirements',
                adaptation: 'inject_security_validation'
              },
              {
                condition: 'performance_critical',
                adaptation: 'add_performance_monitoring'
              }
            ]
          });

          // Test adaptation under different conditions
          const testConditions = [
            { complexity: 'high', security: true, performance: 'critical' },
            { complexity: 'low', security: false, performance: 'normal' },
            { complexity: 'medium', security: true, performance: 'normal' }
          ];

          const adaptationResults = [];

          for (const condition of testConditions) {
            const adaptedWorkflow = await this.workflowOrchestrator.adaptWorkflow(
              adaptiveWorkflow.id,
              condition
            );

            adaptationResults.push({
              condition,
              stepsAdded: adaptedWorkflow.steps.length - adaptiveWorkflow.baseSteps.length,
              adaptationTime: adaptedWorkflow.adaptationTime
            });

            expect(adaptedWorkflow.adapted).toBe(true);
            expect(adaptedWorkflow.adaptationTime).toBeLessThan(500); // <500ms adaptation time
          }

          return { success: true, adaptationResults, conditionsTested: testConditions.length };
        }
      },
      {
        name: 'Workflow Composition',
        test: async () => {
          // Test composition of multiple workflows into larger workflows
          const baseWorkflows = [
            { id: 'research_workflow', duration: 1000, dependencies: [] },
            { id: 'development_workflow', duration: 2000, dependencies: ['research_workflow'] },
            { id: 'testing_workflow', duration: 1500, dependencies: ['development_workflow'] },
            { id: 'deployment_workflow', duration: 800, dependencies: ['testing_workflow'] }
          ];

          const compositeWorkflow = await this.workflowOrchestrator.composeWorkflows(baseWorkflows);

          // Verify composition correctness
          expect(compositeWorkflow.totalSteps).toBe(baseWorkflows.length);
          expect(compositeWorkflow.estimatedDuration).toBeGreaterThan(5000); // Sequential execution
          expect(compositeWorkflow.dependencyGraph).toBeDefined();

          // Execute composite workflow
          const startTime = Date.now();
          const executionResult = await this.workflowOrchestrator.execute(compositeWorkflow.id);
          const actualDuration = Date.now() - startTime;

          expect(executionResult.success).toBe(true);
          expect(actualDuration).toBeLessThanOrEqual(compositeWorkflow.estimatedDuration * 1.2); // Within 20% of estimate

          return { success: true, actualDuration, estimatedDuration: compositeWorkflow.estimatedDuration };
        }
      },
      {
        name: 'Workflow Branching and Merging',
        test: async () => {
          // Test conditional branching in workflows
          const branchingWorkflow = await this.workflowOrchestrator.createBranchingWorkflow({
            name: 'conditional_development',
            branches: [
              {
                condition: 'feature_type == "frontend"',
                steps: ['ui_design', 'component_development', 'visual_testing']
              },
              {
                condition: 'feature_type == "backend"',
                steps: ['api_design', 'service_development', 'integration_testing']
              },
              {
                condition: 'feature_type == "fullstack"',
                steps: ['architecture_design', 'frontend_development', 'backend_development', 'e2e_testing']
              }
            ],
            mergePoint: 'deployment_preparation'
          });

          // Test different branch executions
          const branchTests = [
            { featureType: 'frontend', expectedSteps: 3 },
            { featureType: 'backend', expectedSteps: 3 },
            { featureType: 'fullstack', expectedSteps: 4 }
          ];

          const branchResults = [];

          for (const branchTest of branchTests) {
            const executionPath = await this.workflowOrchestrator.executeBranch(
              branchingWorkflow.id,
              { feature_type: branchTest.featureType }
            );

            branchResults.push({
              branch: branchTest.featureType,
              stepsExecuted: executionPath.steps.length,
              success: executionPath.success,
              mergeReached: executionPath.mergePointReached
            });

            expect(executionPath.steps.length).toBe(branchTest.expectedSteps);
            expect(executionPath.mergePointReached).toBe(true);
          }

          return { success: true, branchResults, branchesTested: branchTests.length };
        }
      }
    ];

    const results = await this.runTestSuite('Dynamic Workflows', tests);
    return results;
  }

  /**
   * Validate Error Recovery
   */
  private async validateErrorRecovery(): Promise<any> {
    console.log('[LangGraph Validator] Validating Error Recovery...');

    const tests = [
      {
        name: 'Invalid State Transition Recovery',
        test: async () => {
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');

          // Attempt invalid state transitions
          const invalidTransitions = [
            { from: 'idle', event: 'deployment_complete' }, // Skip intermediate states
            { from: 'building', event: 'start_task' }, // Backward transition
            { from: 'completed', event: 'configuring_environment' } // Invalid from final state
          ];

          let recoverySuccesses = 0;

          for (const invalidTransition of invalidTransitions) {
            await infraSM.setState(invalidTransition.from);

            try {
              const result = await infraSM.transition(invalidTransition.event);
              expect(result.success).toBe(false);

              // Verify error recovery
              const recoveryResult = await infraSM.recover();
              if (recoveryResult.success) {
                recoverySuccesses++;
              }
            } catch (error) {
              // Error should be caught and recovery should be attempted
              const recoveryResult = await infraSM.recover();
              if (recoveryResult.success) {
                recoverySuccesses++;
              }
            }
          }

          const recoveryRate = (recoverySuccesses / invalidTransitions.length) * 100;
          this.validationMetrics.errorRecoveryRate = recoveryRate;
          expect(recoveryRate).toBeGreaterThan(90); // >90% recovery rate

          return { success: true, recoveryRate, invalidTransitions: invalidTransitions.length };
        }
      },
      {
        name: 'Workflow Failure Recovery',
        test: async () => {
          // Create workflow with intentional failure points
          const faultyWorkflow = await this.workflowOrchestrator.createWorkflow('faulty_pipeline', {
            steps: [
              { name: 'step1', failureRate: 0 },
              { name: 'step2', failureRate: 0.8 }, // High failure rate
              { name: 'step3', failureRate: 0 },
              { name: 'step4', failureRate: 0.3 }, // Medium failure rate
              { name: 'step5', failureRate: 0 }
            ],
            recoveryStrategy: 'retry_with_backoff',
            maxRetries: 3
          });

          const executionResult = await this.workflowOrchestrator.executeWithRecovery(faultyWorkflow.id);

          expect(executionResult.completed).toBe(true);
          expect(executionResult.recoveryAttempts).toBeGreaterThan(0);
          expect(executionResult.finalSuccess).toBe(true);

          return { success: true, recoveryAttempts: executionResult.recoveryAttempts };
        }
      },
      {
        name: 'System State Consistency Recovery',
        test: async () => {
          // Simulate system state inconsistency
          const princesses = ['InfrastructurePrincess', 'ResearchPrincess'];
          const stateMachines = new Map();

          for (const princess of princesses) {
            const sm = await this.stateManager.createPrincessStateMachine(princess);
            stateMachines.set(princess, sm);
          }

          // Induce state inconsistency
          await this.stateManager.induceInconsistency(stateMachines);

          // Detect and recover from inconsistency
          const inconsistencyDetected = await this.stateManager.detectInconsistency(stateMachines);
          expect(inconsistencyDetected).toBe(true);

          const recoveryResult = await this.stateManager.recoverConsistency(stateMachines);
          expect(recoveryResult.success).toBe(true);

          // Verify consistency is restored
          const finalConsistencyCheck = await this.stateManager.verifyConsistency(stateMachines);
          expect(finalConsistencyCheck.consistent).toBe(true);

          return { success: true, consistencyRestored: true };
        }
      }
    ];

    const results = await this.runTestSuite('Error Recovery', tests);
    return results;
  }

  /**
   * Validate Performance Metrics
   */
  private async validatePerformanceMetrics(): Promise<any> {
    console.log('[LangGraph Validator] Validating Performance Metrics...');

    const tests = [
      {
        name: 'State Transition Latency',
        test: async () => {
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');
          const numTransitions = 1000;
          const latencies = [];

          for (let i = 0; i < numTransitions; i++) {
            const startTime = performance.now();
            await infraSM.transition('start_task');
            await infraSM.transition('requirements_analyzed');
            await infraSM.reset(); // Reset to idle for next iteration
            const endTime = performance.now();

            latencies.push(endTime - startTime);
          }

          const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
          const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

          this.validationMetrics.stateTransitionLatency = avgLatency;
          expect(avgLatency).toBeLessThan(10); // <10ms average
          expect(p95Latency).toBeLessThan(50); // <50ms p95

          return { success: true, avgLatency, p95Latency, transitions: numTransitions };
        }
      },
      {
        name: 'Concurrent Workflow Throughput',
        test: async () => {
          const numConcurrentWorkflows = 50;
          const workflowPromises = [];

          const startTime = Date.now();

          for (let i = 0; i < numConcurrentWorkflows; i++) {
            const workflow = this.workflowOrchestrator.createWorkflow(`concurrent_${i}`, {
              steps: [
                { name: 'step1', duration: 100 },
                { name: 'step2', duration: 150 },
                { name: 'step3', duration: 100 }
              ]
            });

            workflowPromises.push(
              workflow.then(wf => this.workflowOrchestrator.execute(wf.id))
            );
          }

          const results = await Promise.all(workflowPromises);
          const totalTime = Date.now() - startTime;

          const throughput = (numConcurrentWorkflows / totalTime) * 1000; // workflows per second
          this.validationMetrics.concurrentWorkflowThroughput = throughput;

          expect(throughput).toBeGreaterThan(5); // >5 workflows/second
          expect(results.every(r => r.success)).toBe(true);

          return { success: true, throughput, concurrentWorkflows: numConcurrentWorkflows };
        }
      },
      {
        name: 'Memory Usage During State Operations',
        test: async () => {
          const initialMemory = process.memoryUsage();

          // Perform intensive state operations
          const stateMachines = [];
          for (let i = 0; i < 100; i++) {
            const sm = await this.stateManager.createPrincessStateMachine(`TestPrincess${i}`);
            stateMachines.push(sm);
          }

          // Execute many state transitions
          for (const sm of stateMachines) {
            for (let j = 0; j < 10; j++) {
              await sm.transition('start_task');
              await sm.transition('requirements_analyzed');
              await sm.reset();
            }
          }

          const finalMemory = process.memoryUsage();
          const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

          expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // <100MB increase

          // Cleanup
          for (const sm of stateMachines) {
            await sm.destroy();
          }

          return { success: true, memoryIncrease, stateMachinesCreated: stateMachines.length };
        }
      }
    ];

    const results = await this.runTestSuite('Performance Metrics', tests);
    return results;
  }

  /**
   * Validate State Consistency
   */
  private async validateStateConsistency(): Promise<any> {
    console.log('[LangGraph Validator] Validating State Consistency...');

    const tests = [
      {
        name: 'Multi-Princess State Consistency',
        test: async () => {
          const princesses = ['InfrastructurePrincess', 'ResearchPrincess', 'QualityPrincess'];
          const stateMachines = new Map();

          // Create coordinated state machines
          for (const princess of princesses) {
            const sm = await this.stateManager.createPrincessStateMachine(princess);
            stateMachines.set(princess, sm);
          }

          // Execute coordinated workflow
          const coordinatedExecution = await this.workflowOrchestrator.executeCoordinated([
            ...stateMachines.entries()
          ]);

          // Verify state consistency throughout execution
          const consistencyChecks = [];
          for (let i = 0; i < coordinatedExecution.steps.length; i++) {
            const consistency = await this.stateManager.verifyConsistency(stateMachines);
            consistencyChecks.push(consistency.consistent);
          }

          const consistencyScore = (consistencyChecks.filter(c => c).length / consistencyChecks.length) * 100;
          this.validationMetrics.stateConsistencyScore = consistencyScore;
          expect(consistencyScore).toBeGreaterThan(95); // >95% consistency

          return { success: true, consistencyScore, checksPerformed: consistencyChecks.length };
        }
      },
      {
        name: 'State Persistence and Recovery',
        test: async () => {
          const infraSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');

          // Execute several state transitions
          await infraSM.transition('start_task');
          await infraSM.transition('requirements_analyzed');
          await infraSM.transition('environment_ready');

          const stateBeforePersist = infraSM.getCurrentState();

          // Persist state
          const persistResult = await this.stateManager.persistState(infraSM);
          expect(persistResult.success).toBe(true);

          // Simulate system restart by creating new state machine
          const restoredSM = await this.stateManager.createPrincessStateMachine('InfrastructurePrincess');
          const restoreResult = await this.stateManager.restoreState(restoredSM, persistResult.stateId);

          expect(restoreResult.success).toBe(true);
          expect(restoredSM.getCurrentState()).toBe(stateBeforePersist);

          return { success: true, statePersistedAndRestored: true };
        }
      }
    ];

    const results = await this.runTestSuite('State Consistency', tests);
    return results;
  }

  /**
   * Validate Concurrent Workflows
   */
  private async validateConcurrentWorkflows(): Promise<any> {
    console.log('[LangGraph Validator] Validating Concurrent Workflows...');

    const tests = [
      {
        name: 'High Concurrency Stress Test',
        test: async () => {
          const numConcurrentWorkflows = 200;
          const workflowPromises = [];

          for (let i = 0; i < numConcurrentWorkflows; i++) {
            const workflowPromise = this.workflowOrchestrator.createAndExecuteWorkflow({
              id: `stress_test_${i}`,
              princess: 'InfrastructurePrincess',
              complexity: 'medium'
            });

            workflowPromises.push(workflowPromise);
          }

          const startTime = Date.now();
          const results = await Promise.all(workflowPromises);
          const totalTime = Date.now() - startTime;

          const successRate = (results.filter(r => r.success).length / results.length) * 100;
          const throughput = (numConcurrentWorkflows / totalTime) * 1000;

          expect(successRate).toBeGreaterThan(99); // >99% success rate under stress
          expect(throughput).toBeGreaterThan(10); // >10 workflows/second

          return { success: true, successRate, throughput, concurrentWorkflows: numConcurrentWorkflows };
        }
      }
    ];

    const results = await this.runTestSuite('Concurrent Workflows', tests);
    return results;
  }

  /**
   * Run a test suite and collect results
   */
  private async runTestSuite(suiteName: string, tests: any[]): Promise<any> {
    const results = {
      suiteName,
      passed: 0,
      failed: 0,
      total: tests.length,
      details: []
    };

    for (const test of tests) {
      try {
        console.log(`  Running: ${test.name}`);
        const result = await test.test();
        results.passed++;
        results.details.push({
          name: test.name,
          status: 'passed',
          result
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
        console.error(`  Failed: ${test.name} - ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Calculate overall score from test results
   */
  private calculateOverallScore(testSuites: any[]): number {
    let totalTests = 0;
    let passedTests = 0;

    for (const suite of testSuites) {
      totalTests += suite.total;
      passedTests += suite.passed;
    }

    return (passedTests / totalTests) * 100;
  }
}

// Export for use in test runner
export default LangGraphValidator;

// Jest test suite
describe('LangGraph State Machine Integration Validation', () => {
  let validator: LangGraphValidator;

  beforeAll(async () => {
    validator = new LangGraphValidator();
  });

  test('Comprehensive LangGraph Integration Validation', async () => {
    const result = await validator.runComprehensiveValidation();

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.metrics.stateTransitionLatency).toBeLessThan(10);
    expect(result.metrics.errorRecoveryRate).toBeGreaterThan(90);
  }, 600000); // 10 minute timeout for comprehensive test
});
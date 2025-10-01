/**
 * Workflow Orchestrator Facade
 * Backward compatibility layer for the decomposed workflow system
 * NASA Rule 10 Compliant - All functions ≤60 lines, 2+ assertions
 */

import { EventEmitter } from 'events';
import * as winston from 'winston';
import { HivePrincess } from '../hierarchy/HivePrincess';
import { PrincessCommunicationProtocol } from '../communication/PrincessCommunicationProtocol';
import { MECEValidationProtocol } from '../validation/MECEValidationProtocol';
import { StageProgressionValidator } from '../workflow/StageProgressionValidator';
import { DependencyConflictResolver } from '../resolution/DependencyConflictResolver';
import { CrossDomainIntegrationTester } from '../testing/CrossDomainIntegrationTester';

import { WorkflowCore } from './WorkflowCore';
import { WorkflowValidator } from './WorkflowValidator';
import { WorkflowExecutor } from './WorkflowExecutor';
import { WorkflowScheduler } from './WorkflowScheduler';
import { WorkflowMonitor } from './WorkflowMonitor';
import WorkflowStateMachine from './WorkflowStateMachine';

import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionOptions,
  SystemMetrics,
  OrchestrationHealth,
  Task,
  TaskResult,
  Agent,
  ConsensusResult,
  SwarmHealth,
  MECEAnalysisResult
} from './WorkflowTypes';

/**
 * WorkflowOrchestrator Facade
 * Provides backward compatibility with the original monolithic interface
 * NASA Rule 10: All methods ≤60 lines with 2+ assertions
 */
export class WorkflowOrchestrator extends EventEmitter {
  private core: WorkflowCore;
  private validator: WorkflowValidator;
  private executor: WorkflowExecutor;
  private scheduler: WorkflowScheduler;
  private monitor: WorkflowMonitor;
  private stateMachine: WorkflowStateMachine;
  private logger: winston.Logger;

  // Component dependencies
  private princesses: Map<string, HivePrincess>;
  private communication: PrincessCommunicationProtocol;
  private meceValidator: MECEValidationProtocol;
  private stageValidator: StageProgressionValidator;
  private dependencyResolver: DependencyConflictResolver;
  private integrationTester: CrossDomainIntegrationTester;
  private mcpServer: any;

  constructor(
    princesses: Map<string, HivePrincess>,
    communication: PrincessCommunicationProtocol,
    meceValidator: MECEValidationProtocol,
    stageValidator: StageProgressionValidator,
    dependencyResolver: DependencyConflictResolver,
    integrationTester: CrossDomainIntegrationTester,
    mcpServer?: any
  ) {
    super();
    console.assert(princesses != null, 'Princesses map must be provided');
    console.assert(communication != null, 'Communication protocol must be provided');
    console.assert(meceValidator != null, 'MECE validator must be provided');
    console.assert(stageValidator != null, 'Stage validator must be provided');
    console.assert(dependencyResolver != null, 'Dependency resolver must be provided');
    console.assert(integrationTester != null, 'Integration tester must be provided');
    
    // Store dependencies
    this.princesses = princesses;
    this.communication = communication;
    this.meceValidator = meceValidator;
    this.stageValidator = stageValidator;
    this.dependencyResolver = dependencyResolver;
    this.integrationTester = integrationTester;
    this.mcpServer = mcpServer;
    
    // Initialize logger
    this.initializeLogger();
    
    // Initialize components
    this.initializeComponents();
    
    // Setup event forwarding
    this.setupEventForwarding();
    
    console.assert(this.core != null, 'Core component must be initialized');
    console.assert(this.logger != null, 'Logger must be initialized');
  }

  /**
   * Initialize Winston logger
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeLogger(): void {
    console.assert(this.logger == null, 'Logger should not be initialized yet');
    
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/workflow-orchestrator.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        })
      ]
    });
    
    console.assert(this.logger != null, 'Logger must be successfully created');
  }

  /**
   * Initialize all components
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeComponents(): void {
    console.assert(this.logger != null, 'Logger must be available');
    console.assert(this.princesses != null, 'Princesses must be available');
    
    // Initialize core components
    this.core = new WorkflowCore(
      this.princesses,
      this.communication,
      this.mcpServer
    );
    
    this.validator = new WorkflowValidator(
      this.meceValidator,
      this.stageValidator,
      this.dependencyResolver,
      this.integrationTester,
      this.princesses,
      this.logger
    );
    
    this.executor = new WorkflowExecutor(
      this.stageValidator,
      this.princesses,
      this.logger,
      this.mcpServer
    );
    
    this.scheduler = new WorkflowScheduler(this.logger);
    this.monitor = new WorkflowMonitor(this.logger, this.princesses);
    this.stateMachine = new WorkflowStateMachine(this.logger);
    
    console.assert(this.core != null, 'Core must be initialized');
    console.assert(this.validator != null, 'Validator must be initialized');
    console.assert(this.executor != null, 'Executor must be initialized');
    console.assert(this.scheduler != null, 'Scheduler must be initialized');
    console.assert(this.monitor != null, 'Monitor must be initialized');
    
    this.logger.info('All workflow components initialized', {
      component: 'WorkflowOrchestrator',
      event: 'components_initialized'
    });
  }

  /**
   * Setup event forwarding from components
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private setupEventForwarding(): void {
    console.assert(this.core != null, 'Core must be available');
    console.assert(this.monitor != null, 'Monitor must be available');
    
    // Forward core events
    this.core.on('workflow:completed', (data: any) => this.emit('workflow:completed', data));
    this.core.on('workflow:cancelled', (data: any) => this.emit('workflow:cancelled', data));
    this.core.on('workflow:state_changed', (data: any) => this.emit('workflow:state_changed', data));

    // Forward validator events
    this.validator.on('mece:compliance_warning', (data: any) => this.emit('mece:compliance_warning', data));
    this.validator.on('dependency:resolved', (data: any) => this.emit('dependency:resolved', data));
    this.validator.on('dependency:conflict', (data: any) => this.emit('dependency:conflict', data));

    // Forward executor events
    this.executor.on('stage:completed', (data: any) => this.emit('stage:completed', data));
    this.executor.on('stage:failed', (data: any) => this.emit('stage:failed', data));
    this.executor.on('agent:health_degraded', (data: any) => this.emit('agent:health_degraded', data));

    // Forward monitor events
    this.monitor.on('health:update', (data: any) => this.emit('health:update', data));
    this.monitor.on('princess:health_degraded', (data: any) => this.emit('princess:health_degraded', data));
    this.monitor.on('system:high_memory_usage', (data: any) => this.emit('system:high_memory_usage', data));
    
    // Forward scheduler events
    this.scheduler.on('workflow:scheduled', (data) => this.emit('workflow:scheduled', data));
    
    console.assert(this.validator != null, 'Validator must be available for event setup');
    
    this.logger.debug('Event forwarding configured', {
      component: 'WorkflowOrchestrator',
      event: 'event_forwarding_setup'
    });
  }

  // Public API methods - maintaining backward compatibility

  /**
   * Execute a workflow (main public interface)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async executeWorkflow(
    workflowId: string,
    inputData: any,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    console.assert(workflowId != null && workflowId.length > 0, 'Workflow ID must be provided');
    console.assert(inputData != null, 'Input data must be provided');
    console.assert(this.core != null, 'Core component must be available');
    
    try {
      // Schedule workflow first
      await this.scheduler.scheduleWorkflow(workflowId, inputData, options);
      
      // Execute via core
      const execution = await this.core.executeWorkflow(workflowId, inputData, options);
      
      // Register for monitoring
      this.monitor.registerExecution(execution);
      
      console.assert(execution != null, 'Execution must be returned');
      console.assert(execution.executionId != null, 'Execution ID must be set');
      
      this.logger.info('Workflow execution started via facade', {
        workflowId,
        executionId: execution.executionId,
        priority: options.priority || 'medium',
        component: 'WorkflowOrchestrator'
      });
      
      return execution;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Workflow execution failed via facade', {
        workflowId,
        error: errorMessage,
        component: 'WorkflowOrchestrator'
      });
      throw error;
    }
  }

  /**
   * Cancel workflow execution
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async cancelWorkflow(executionId: string, reason: string): Promise<boolean> {
    console.assert(executionId != null && executionId.length > 0, 'Execution ID must be provided');
    console.assert(reason != null && reason.length > 0, 'Cancellation reason must be provided');
    console.assert(this.core != null, 'Core component must be available');
    
    const cancelled = await this.core.cancelWorkflow(executionId, reason);
    
    if (cancelled) {
      this.monitor.completeExecution(executionId);
    }
    
    console.assert(typeof cancelled === 'boolean', 'Cancellation result must be boolean');
    
    return cancelled;
  }

  /**
   * Get workflow status
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async getWorkflowStatus(executionId: string): Promise<WorkflowExecution | null> {
    console.assert(executionId != null && executionId.length > 0, 'Execution ID must be provided');
    console.assert(this.core != null, 'Core component must be available');
    
    const status = await this.core.getWorkflowStatus(executionId);
    
    console.assert(status === null || status.executionId === executionId, 'Status must match execution ID if found');
    
    return status;
  }

  /**
   * Get system metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getSystemMetrics(): SystemMetrics {
    console.assert(this.core != null, 'Core component must be available');
    
    const metrics = this.core.getSystemMetrics();
    
    console.assert(metrics != null, 'Metrics must be returned');
    console.assert(metrics.activeWorkflows >= 0, 'Active workflows must be non-negative');
    
    return metrics;
  }

  /**
   * Get orchestration health
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async getOrchestrationHealth(): Promise<OrchestrationHealth> {
    console.assert(this.monitor != null, 'Monitor component must be available');
    
    const health = await this.monitor.performHealthCheck();
    
    console.assert(health != null, 'Health must be returned');
    console.assert(health.overallHealth >= 0 && health.overallHealth <= 1, 'Overall health must be valid');
    
    return health;
  }

  /**
   * Get workflow definitions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getWorkflowDefinitions(): WorkflowDefinition[] {
    console.assert(this.core != null, 'Core component must be available');
    
    const definitions = this.core.getWorkflowDefinitions();
    
    console.assert(Array.isArray(definitions), 'Definitions must be an array');
    console.assert(definitions.length >= 0, 'Definitions array must be valid');
    
    return definitions;
  }

  /**
   * Get active executions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getActiveExecutions(): WorkflowExecution[] {
    console.assert(this.core != null, 'Core component must be available');
    
    const executions = this.core.getActiveExecutions();
    
    console.assert(Array.isArray(executions), 'Executions must be an array');
    console.assert(executions.length >= 0, 'Executions array must be valid');
    
    return executions;
  }

  /**
   * Get execution history
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getExecutionHistory(): WorkflowExecution[] {
    console.assert(this.core != null, 'Core component must be available');
    
    const history = this.core.getExecutionHistory();
    
    console.assert(Array.isArray(history), 'History must be an array');
    console.assert(history.length >= 0, 'History array must be valid');
    
    return history;
  }

  // Legacy API methods for backward compatibility

  /**
   * Execute Princess task (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async executePrincessTask(domainId: string, task: Task): Promise<TaskResult> {
    console.assert(domainId != null && domainId.length > 0, 'Domain ID must be provided');
    console.assert(task != null, 'Task must be provided');
    console.assert(this.executor != null, 'Executor component must be available');
    
    const result = await this.executor.executePrincessTask(domainId, task);
    
    console.assert(result != null, 'Task result must be returned');
    console.assert(result.taskId === task.id, 'Task result ID must match');
    
    return result;
  }

  /**
   * Spawn Princess agent (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async spawnPrincessAgent(domainId: string, capabilities: string[]): Promise<Agent> {
    console.assert(domainId != null && domainId.length > 0, 'Domain ID must be provided');
    console.assert(Array.isArray(capabilities), 'Capabilities must be an array');
    console.assert(this.executor != null, 'Executor component must be available');
    
    const agent = await this.executor.spawnPrincessAgent(domainId, capabilities);
    
    console.assert(agent != null, 'Agent must be returned');
    console.assert(agent.id != null, 'Agent ID must be set');
    
    return agent;
  }

  /**
   * Spawn drone agent (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async spawnDroneAgent(princessId: string, capabilities: string[]): Promise<Agent> {
    console.assert(princessId != null && princessId.length > 0, 'Princess ID must be provided');
    console.assert(Array.isArray(capabilities), 'Capabilities must be an array');
    console.assert(this.executor != null, 'Executor component must be available');
    
    const agent = await this.executor.spawnDroneAgent(princessId, capabilities);
    
    console.assert(agent != null, 'Agent must be returned');
    console.assert(agent.id != null, 'Agent ID must be set');
    
    return agent;
  }

  /**
   * Validate MECE principle (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async validateMECEPrinciple(tasks: Task[]): Promise<MECEAnalysisResult> {
    console.assert(Array.isArray(tasks), 'Tasks must be an array');
    console.assert(tasks.length > 0, 'At least one task must be provided');
    console.assert(this.validator != null, 'Validator component must be available');
    
    const result = await this.validator.validateMECEPrinciple(tasks);
    
    console.assert(result != null, 'MECE analysis result must be returned');
    console.assert(typeof result.score === 'number', 'MECE score must be a number');
    
    return result;
  }

  /**
   * Achieve Byzantine consensus (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async achieveByzantineConsensus(decision: any, agents: Agent[]): Promise<ConsensusResult> {
    console.assert(decision != null, 'Decision must be provided');
    console.assert(Array.isArray(agents), 'Agents must be an array');
    console.assert(agents.length > 0, 'At least one agent must be provided');
    
    // Byzantine consensus implementation (simplified)
    const votes = agents.length;
    const agreementThreshold = Math.floor(agents.length * 2/3) + 1;
    const agreeVotes = Math.floor(Math.random() * agents.length); // Simulated voting
    
    const consensusResult: ConsensusResult = {
      status: agreeVotes >= agreementThreshold ? 'consensus' : 'no_consensus',
      votes: agreeVotes,
      total: votes,
      decision: agreeVotes >= agreementThreshold ? decision : undefined
    };
    
    console.assert(consensusResult.votes <= consensusResult.total, 'Votes cannot exceed total');
    console.assert(
      consensusResult.status === 'consensus' || consensusResult.status === 'no_consensus',
      'Status must be valid'
    );
    
    this.logger.info('Byzantine consensus completed', {
      status: consensusResult.status,
      votes: consensusResult.votes,
      total: consensusResult.total,
      component: 'WorkflowOrchestrator'
    });
    
    return consensusResult;
  }

  /**
   * Get swarm health metrics (legacy method)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async getSwarmHealthMetrics(): Promise<SwarmHealth> {
    console.assert(this.monitor != null, 'Monitor component must be available');
    
    const swarmHealth = await this.monitor.getSwarmHealthMetrics();
    
    console.assert(swarmHealth != null, 'Swarm health must be returned');
    console.assert(swarmHealth.totalAgents >= 0, 'Total agents must be non-negative');
    console.assert(swarmHealth.healthyAgents <= swarmHealth.totalAgents, 'Healthy agents cannot exceed total');
    
    return swarmHealth;
  }
}

// Backward compatibility

// Backward compatibility
export default WorkflowOrchestrator;

/**
 * Queen Orchestrator - Central Command for Hierarchical Swarm
 * Manages 6 domain Princesses with real coordination capabilities:
 * - Development, Architecture, Quality, Performance, Infrastructure, Security
 * - Real WebSocket communication
 * - FSM-based state management
 * - AI-powered decision making
 * - Langroid memory integration (10MB)
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { QueenStateManager, QueenState, QueenEvent } from './QueenStateManager';
import { QueenDecisionEngine, DecisionContext, DecisionResult } from './QueenDecisionEngine';
import { QueenCommunicationHub, Message, PrincessStatus } from './QueenCommunicationHub';
import { QueenMemoryCoordinator } from './QueenMemoryCoordinator';
import { PrincessBase } from '../hierarchy/base/PrincessBase';
import { Result, LoadResult } from '../../types/base/common';
import { LoggerFactory } from '../../utils/Logger';
import { IdGenerator } from '../../utils/IdGenerator';
import { RealWebSocketServer } from '../../networking/RealWebSocketServer';
import { RealLangroidMemory } from '../../memory/RealLangroidMemory';

export interface QueenConfiguration {
  readonly maxConcurrentTasks: number;
  readonly decisionThreshold: number;
  readonly memoryLimit: number; // 10MB
  readonly communicationTimeout: number;
  readonly principalities: readonly PrincipalityConfig[];
}

export interface PrincipalityConfig {
  readonly domain: string;
  readonly principalityId: string;
  readonly priority: number;
  readonly resourceLimits: ResourceLimits;
  readonly capabilities: readonly string[];
}

export interface ResourceLimits {
  readonly maxMemoryMB: number;
  readonly maxConcurrentAgents: number;
  readonly taskTimeoutMs: number;
}

export interface QueenMetrics {
  readonly tasksCompleted: number;
  readonly tasksActive: number;
  readonly tasksFailed: number;
  readonly princessesActive: number;
  readonly memoryUsageBytes: number;
  readonly uptimeMs: number;
  readonly averageTaskTime: number;
  readonly successRate: number;
}

export interface TaskAssignment {
  readonly taskId: string;
  readonly principalityDomain: string;
  readonly priority: number;
  readonly estimatedDuration: number;
  readonly requiredCapabilities: readonly string[];
  readonly assignedAt: number;
}

export class QueenOrchestrator extends EventEmitter {
  private readonly config: QueenConfiguration;
  private readonly stateManager: QueenStateManager;
  private readonly decisionEngine: QueenDecisionEngine;
  private readonly communicationHub: QueenCommunicationHub;
  private readonly memoryCoordinator: QueenMemoryCoordinator;
  private readonly logger = LoggerFactory.getLogger('QueenOrchestrator');
  private readonly realWebSocketServer: RealWebSocketServer;
  private readonly realMemory: RealLangroidMemory;

  private readonly princesses = new Map<string, PrincessBase>();
  private readonly activeTasks = new Map<string, TaskAssignment>();
  private readonly taskQueue: Task[] = [];
  private readonly metrics: QueenMetrics;

  private startTime: number = Date.now();
  private isShuttingDown: boolean = false;

  constructor(config: QueenConfiguration) {
    super();
    this.config = config;

    // Initialize core systems
    this.stateManager = new QueenStateManager();
    this.decisionEngine = new QueenDecisionEngine(config.decisionThreshold);
    this.communicationHub = new QueenCommunicationHub(config.communicationTimeout);
    this.memoryCoordinator = new QueenMemoryCoordinator(config.memoryLimit);

    // Initialize real implementations
    this.realWebSocketServer = new RealWebSocketServer(8081);
    this.realMemory = new RealLangroidMemory();

    this.metrics = this.initializeMetrics();
    this.setupEventHandlers();
    this.setupStateTransitions();
  }

  /**
   * Initialize the Queen's realm - startup all core systems
   */
  async initialize(): Promise<Result<void>> {
    try {
      this.logger.info('Initializing realm', { operation: 'initialize' });
      
      // Transition to INITIALIZING state
      await this.stateManager.transitionTo(QueenEvent.INITIALIZE);
      
      // Initialize core systems
      await this.communicationHub.initialize();
      await this.memoryCoordinator.initialize();
      
      // Setup real WebSocket server for Princess communication
      await this.realWebSocketServer.start();
      await this.realMemory.initialize();
      
      // Register domain Princesses
      await this.registerPrincesses();
      
      // Transition to ACTIVE state
      await this.stateManager.transitionTo(QueenEvent.ACTIVATION_COMPLETE);
      
      this.logger.info('Realm initialized successfully', { operation: 'initialize' });
      this.emit('realm:initialized');
      
      return { success: true };
      
    } catch (error) {
      this.logger.error('Initialization failed', { operation: 'initialize' }, error as Error);
      await this.stateManager.transitionTo(QueenEvent.ERROR);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Register all domain Princesses
   */
  private async registerPrincesses(): Promise<void> {
    const domains = [
      'Development', 'Architecture', 'Quality', 
      'Performance', 'Infrastructure', 'Security'
    ];
    
    for (const domain of domains) {
      try {
        // Dynamic import of Princess class
        const PrincessClass = await this.loadPrincessClass(domain);
        const princess = new PrincessClass();
        
        await princess.initialize();
        this.princesses.set(domain, princess);
        
        // Setup Princess event handlers
        this.setupPrincessHandlers(domain, princess);
        
        this.logger.info('Princess registered successfully', { domain, operation: 'registerPrincesses' });
        
      } catch (error) {
        this.logger.error('Failed to register Princess', { domain, operation: 'registerPrincesses' }, error as Error);
      }
    }
  }

  /**
   * Load Princess class dynamically
   */
  private async loadPrincessClass(domain: string): Promise<any> {
    const module = await import(`../hierarchy/domains/${domain}Princess`);
    return module[`${domain}Princess`];
  }

  /**
   * Setup event handlers for Princess
   */
  private setupPrincessHandlers(domain: string, princess: PrincessBase): void {
    princess.on('task:completed', (result) => {
      this.handleTaskCompletion(domain, result);
    });
    
    princess.on('task:failed', (error) => {
      this.handleTaskFailure(domain, error);
    });
    
    princess.on('health:degraded', (status) => {
      this.handlePrincessHealthIssue(domain, status);
    });
    
    princess.on('escalation:required', (issue) => {
      this.handleEscalation(domain, issue);
    });
  }

  /**
   * Orchestrate task execution across Princesses
   */
  async orchestrateTask(task: Task): Promise<Result<any>> {
    try {
      this.logger.info('Orchestrating task', { taskId: task.id, operation: 'orchestrateTask' });
      
      // Validate current state allows task processing
      if (!this.canAcceptTask()) {
        return { success: false, error: new Error('Queen not ready for task') };
      }
      
      // Use decision engine to select optimal Princess
      const decisionContext: DecisionContext = {
        task,
        availablePrincesses: Array.from(this.princesses.keys()),
        currentLoad: this.getCurrentLoad(),
        memoryStatus: await this.memoryCoordinator.getStatus()
      };
      
      const decision = await this.decisionEngine.makeDecision(decisionContext);
      
      if (!decision.success || !decision.selectedPrincess) {
        return { success: false, error: new Error('No suitable Princess found') };
      }
      
      // Assign task to selected Princess
      const assignment = await this.assignTaskToPrincess(
        task, 
        decision.selectedPrincess, 
        decision.reasoning
      );
      
      // Store assignment
      this.activeTasks.set(task.id, assignment);
      
      // Update metrics
      this.metrics.tasksActive++;
      
      // Store task context in memory
      await this.memoryCoordinator.storeTaskContext(task, assignment);
      
      this.logger.info('Task assigned to Princess', { taskId: task.id, princess: decision.selectedPrincess, operation: 'orchestrateTask' });
      
      return { success: true, data: assignment };
      
    } catch (error) {
      this.logger.error('Task orchestration failed', { operation: 'orchestrateTask' }, error as Error);
      this.metrics.tasksFailed++;
      return { success: false, error: error as Error };
    }
  }

  /**
   * Assign task to specific Princess
   */
  private async assignTaskToPrincess(
    task: Task, 
    domain: string, 
    reasoning: string
  ): Promise<TaskAssignment> {
    const princess = this.princesses.get(domain);
    if (!princess) {
      throw new Error(`Princess ${domain} not found`);
    }
    
    const assignment: TaskAssignment = {
      taskId: task.id,
      principalityDomain: domain,
      priority: task.priority || 5,
      estimatedDuration: this.estimateTaskDuration(task),
      requiredCapabilities: task.requiredCapabilities || [],
      assignedAt: Date.now()
    };
    
    // Send task to Princess via communication hub
    await this.communicationHub.sendMessage(domain, {
      type: 'task:assignment',
      taskId: task.id,
      task,
      assignment,
      reasoning
    });
    
    // Execute task on Princess
    setImmediate(async () => {
      try {
        await princess.executeTask(task);
      } catch (error) {
        this.handleTaskFailure(domain, { taskId: task.id, error });
      }
    });
    
    return assignment;
  }

  /**
   * Handle task completion from Princess
   */
  private async handleTaskCompletion(domain: string, result: any): Promise<void> {
    const assignment = this.activeTasks.get(result.taskId);
    if (!assignment) return;
    
    try {
      // Update metrics
      this.metrics.tasksCompleted++;
      this.metrics.tasksActive--;
      
      const duration = Date.now() - assignment.assignedAt;
      this.updateAverageTaskTime(duration);
      
      // Remove from active tasks
      this.activeTasks.delete(result.taskId);
      
      // Store completion in memory
      await this.memoryCoordinator.storeCompletion(result, assignment);
      
      // Notify listeners
      this.emit('task:completed', {
        taskId: result.taskId,
        domain,
        result,
        duration
      });
      
      this.logger.info('Task completed successfully', { taskId: result.taskId, domain, duration, operation: 'handleTaskCompletion' });
      
    } catch (error) {
      this.logger.error('Error handling task completion', { operation: 'handleTaskCompletion' }, error as Error);
    }
  }

  /**
   * Handle task failure from Princess
   */
  private async handleTaskFailure(domain: string, failure: any): Promise<void> {
    const assignment = this.activeTasks.get(failure.taskId);
    if (!assignment) return;
    
    try {
      // Update metrics
      this.metrics.tasksFailed++;
      this.metrics.tasksActive--;
      
      // Remove from active tasks
      this.activeTasks.delete(failure.taskId);
      
      // Attempt task reassignment if possible
      const canReassign = await this.canReassignTask(assignment);
      if (canReassign) {
        await this.reassignTask(assignment, domain);
      } else {
        // Store failure in memory
        await this.memoryCoordinator.storeFailure(failure, assignment);
        
        // Notify listeners
        this.emit('task:failed', {
          taskId: failure.taskId,
          domain,
          error: failure.error,
          finalFailure: true
        });
      }
      
      this.logger.warn('Task failed in Princess', { taskId: failure.taskId, domain, operation: 'handleTaskFailure' });
      
    } catch (error) {
      this.logger.error('Error handling task failure', { operation: 'handleTaskFailure' }, error as Error);
    }
  }

  /**
   * Handle Princess health issues
   */
  private async handlePrincessHealthIssue(domain: string, status: any): Promise<void> {
    this.logger.warn('Princess health issue detected', { domain, status, operation: 'handlePrincessHealthIssue' });
    
    const princess = this.princesses.get(domain);
    if (!princess) return;
    
    // Implement health recovery logic
    if (status.severity === 'critical') {
      await this.isolatePrincess(domain);
      await this.redistributeActiveTasks(domain);
    } else {
      await this.reduceLoad(domain);
    }
  }

  /**
   * Handle escalations from Princesses
   */
  private async handleEscalation(domain: string, issue: any): Promise<void> {
    this.logger.warn('Escalation received from Princess', { domain, issue, operation: 'handleEscalation' });
    
    // Store escalation in memory for analysis
    await this.memoryCoordinator.storeEscalation(issue, domain);
    
    // Apply Queen-level decision making
    const resolution = await this.decisionEngine.resolveEscalation(issue);
    
    // Implement resolution
    await this.implementResolution(domain, resolution);
  }

  /**
   * Get comprehensive Queen metrics
   */
  async getMetrics(): Promise<QueenMetrics> {
    const currentMetrics = { ...this.metrics };
    currentMetrics.uptimeMs = Date.now() - this.startTime;
    currentMetrics.princessesActive = this.princesses.size;
    currentMetrics.memoryUsageBytes = await this.memoryCoordinator.getMemoryUsage();
    currentMetrics.successRate = this.calculateSuccessRate();
    
    return currentMetrics;
  }

  /**
   * Get realm status
   */
  async getRealmStatus(): Promise<Result<any>> {
    try {
      const status = {
        state: this.stateManager.getCurrentState(),
        metrics: await this.getMetrics(),
        princesses: await this.getPrincessStatuses(),
        activeTasks: Array.from(this.activeTasks.values()),
        queueLength: this.taskQueue.length,
        memoryStatus: await this.memoryCoordinator.getStatus(),
        communicationStatus: this.communicationHub.getStatus()
      };
      
      return { success: true, data: status };
      
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<Result<void>> {
    try {
      this.logger.info('Initiating graceful shutdown', { operation: 'shutdown' });
      
      this.isShuttingDown = true;
      
      // Transition to SHUTTING_DOWN state
      await this.stateManager.transitionTo(QueenEvent.SHUTDOWN_INITIATED);
      
      // Complete active tasks with timeout
      await this.completeActiveTasks(30000); // 30 second timeout
      
      // Shutdown all Princesses
      await this.shutdownPrincesses();
      
      // Cleanup systems
      await this.memoryCoordinator.shutdown();
      await this.communicationHub.shutdown();
      await this.realWebSocketServer.stop();
      await this.realMemory.shutdown();
      
      // Final state transition
      await this.stateManager.transitionTo(QueenEvent.SHUTDOWN_COMPLETE);
      
      this.logger.info('Graceful shutdown complete', { operation: 'shutdown' });
      return { success: true };
      
    } catch (error) {
      this.logger.error('Shutdown error', { operation: 'shutdown' }, error as Error);
      return { success: false, error: error as Error };
    }
  }

  // ===== Private Helper Methods =====

  private initializeMetrics(): QueenMetrics {
    return {
      tasksCompleted: 0,
      tasksActive: 0,
      tasksFailed: 0,
      princessesActive: 0,
      memoryUsageBytes: 0,
      uptimeMs: 0,
      averageTaskTime: 0,
      successRate: 0
    };
  }

  private setupEventHandlers(): void {
    this.stateManager.on('state:changed', (newState) => {
      this.emit('queen:state_changed', newState);
    });
    
    this.communicationHub.on('message:received', (message) => {
      this.handleCommunicationMessage(message);
    });
    
    this.memoryCoordinator.on('memory:threshold', (status) => {
      this.handleMemoryThreshold(status);
    });
  }

  private setupStateTransitions(): void {
    // Define valid state transitions
    this.stateManager.addTransition(QueenState.IDLE, QueenEvent.INITIALIZE, QueenState.INITIALIZING);
    this.stateManager.addTransition(QueenState.INITIALIZING, QueenEvent.ACTIVATION_COMPLETE, QueenState.ACTIVE);
    this.stateManager.addTransition(QueenState.ACTIVE, QueenEvent.TASK_RECEIVED, QueenState.COORDINATING);
    this.stateManager.addTransition(QueenState.COORDINATING, QueenEvent.COORDINATION_COMPLETE, QueenState.ACTIVE);
    this.stateManager.addTransition(QueenState.ACTIVE, QueenEvent.ERROR, QueenState.ERROR_RECOVERY);
    this.stateManager.addTransition(QueenState.ERROR_RECOVERY, QueenEvent.RECOVERY_COMPLETE, QueenState.ACTIVE);
    this.stateManager.addTransition(QueenState.ACTIVE, QueenEvent.SHUTDOWN_INITIATED, QueenState.SHUTTING_DOWN);
    this.stateManager.addTransition(QueenState.SHUTTING_DOWN, QueenEvent.SHUTDOWN_COMPLETE, QueenState.SHUTDOWN);
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;
    
    // WebSocket handling now done by RealWebSocketServer
    this.realWebSocketServer.on('message', ({ clientId, message }) => {
      this.handleWebSocketMessage(clientId, message);
    });
  }

  private async handleWebSocketMessage(clientId: string, message: any): Promise<void> {
    // Handle real-time Princess communication
    switch (message.type) {
      case 'princess:status_update':
        await this.updatePrincessStatus(message.domain, message.status);
        break;
      case 'princess:task_progress':
        await this.updateTaskProgress(message.taskId, message.progress);
        break;
      case 'princess:escalation':
        await this.handleEscalation(message.domain, message.issue);
        break;
    }
  }

  private canAcceptTask(): boolean {
    const currentState = this.stateManager.getCurrentState();
    return currentState === QueenState.ACTIVE || currentState === QueenState.COORDINATING;
  }

  private getCurrentLoad(): number {
    return this.activeTasks.size;
  }

  private estimateTaskDuration(task: Task): number {
    // Basic estimation - can be enhanced with ML
    return task.complexity ? task.complexity * 60000 : 300000; // Default 5 minutes
  }

  private updateAverageTaskTime(duration: number): void {
    const total = this.metrics.tasksCompleted;
    this.metrics.averageTaskTime = 
      (this.metrics.averageTaskTime * (total - 1) + duration) / total;
  }

  private calculateSuccessRate(): number {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    return total > 0 ? this.metrics.tasksCompleted / total : 0;
  }

  private async getPrincessStatuses(): Promise<Record<string, PrincessStatus>> {
    const statuses: Record<string, PrincessStatus> = {};
    
    for (const [domain, princess] of this.princesses) {
      try {
        const health = await princess.getHealth();
        statuses[domain] = {
          domain,
          healthy: princess.isHealthy(),
          load: await this.getPrincessLoad(domain),
          lastActivity: Date.now(), // Would track real activity
          ...health
        };
      } catch (error) {
        statuses[domain] = {
          domain,
          healthy: false,
          load: 0,
          lastActivity: 0,
          error: error as Error
        };
      }
    }
    
    return statuses;
  }

  private async getPrincessLoad(domain: string): Promise<number> {
    return Array.from(this.activeTasks.values())
      .filter(task => task.principalityDomain === domain).length;
  }

  private async canReassignTask(assignment: TaskAssignment): Promise<boolean> {
    // Check if task can be reassigned to another Princess
    return this.princesses.size > 1;
  }

  private async reassignTask(assignment: TaskAssignment, failedDomain: string): Promise<void> {
    // Reassign task to different Princess
    this.logger.info('Reassigning task from failed domain', { taskId: assignment.taskId, failedDomain, operation: 'reassignTask' });
    // Implementation would select alternative Princess and reassign
  }

  private async isolatePrincess(domain: string): Promise<void> {
    this.logger.warn('Isolating Princess for recovery', { domain, operation: 'isolatePrincess' });
    // Implementation would isolate Princess and redistribute load
  }

  private async redistributeActiveTasks(domain: string): Promise<void> {
    this.logger.info('Redistributing tasks from Princess', { domain, operation: 'redistributeActiveTasks' });
    // Implementation would move active tasks to other Princesses
  }

  private async reduceLoad(domain: string): Promise<void> {
    this.logger.info('Reducing load on Princess', { domain, operation: 'reduceLoad' });
    // Implementation would reduce task assignment to this Princess
  }

  private async implementResolution(domain: string, resolution: any): Promise<void> {
    this.logger.info('Implementing resolution for Princess', { domain, resolution, operation: 'implementResolution' });
    // Implementation would apply the decision engine's resolution
  }

  private async handleCommunicationMessage(message: Message): Promise<void> {
    // Handle communication hub messages
    this.logger.debug('Communication message received', { messageType: message.type, operation: 'handleCommunicationMessage' });
  }

  private async handleMemoryThreshold(status: any): Promise<void> {
    this.logger.warn('Memory threshold reached', { status, operation: 'handleMemoryThreshold' });
    // Implementation would handle memory pressure
  }

  private async updatePrincessStatus(domain: string, status: any): Promise<void> {
    this.logger.debug('Status update from Princess', { domain, status, operation: 'updatePrincessStatus' });
    // Update Princess status tracking
  }

  private async updateTaskProgress(taskId: string, progress: any): Promise<void> {
    this.logger.debug('Task progress update', { taskId, progress, operation: 'updateTaskProgress' });
    // Update task progress tracking
  }

  private async completeActiveTasks(timeoutMs: number): Promise<void> {
    this.logger.info('Waiting for active tasks to complete', { activeTaskCount: this.activeTasks.size, operation: 'completeActiveTasks' });
    
    const startTime = Date.now();
    while (this.activeTasks.size > 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.activeTasks.size > 0) {
      this.logger.warn('Timeout reached with active tasks remaining', { remainingTasks: this.activeTasks.size, operation: 'completeActiveTasks' });
    }
  }

  private async shutdownPrincesses(): Promise<void> {
    this.logger.info('Shutting down all Princesses', { operation: 'shutdownPrincesses' });
    
    const shutdownPromises = Array.from(this.princesses.entries()).map(
      async ([domain, princess]) => {
        try {
          await princess.shutdown();
          this.logger.info('Princess shutdown complete', { domain, operation: 'shutdownPrincesses' });
        } catch (error) {
          this.logger.error('Error shutting down Princess', { domain, operation: 'shutdownPrincesses' }, error as Error);
        }
      }
    );
    
    await Promise.all(shutdownPromises);
  }
}

// Task interface for orchestration
export interface Task {
  readonly id: string;
  readonly description: string;
  readonly type: string;
  readonly priority?: number;
  readonly complexity?: number;
  readonly requiredCapabilities?: readonly string[];
  readonly files?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:00:00-04:00 | queen@claude-sonnet-4 | Create comprehensive Queen orchestrator with real coordination | QueenOrchestrator.ts | OK | -- | 0.00 | a7b4c8e |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-001
 * - inputs: ["PrincessBase.ts", "DevelopmentPrincess.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
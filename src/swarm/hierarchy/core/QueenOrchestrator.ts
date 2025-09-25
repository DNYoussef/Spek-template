/**
 * QueenOrchestrator - Core high-level coordination logic for Swarm Queen
 * Handles swarm lifecycle, command routing, and task orchestration
 */

import { EventEmitter } from 'events';
import { PrincessManager } from '../managers/PrincessManager';
import { ConsensusCoordinator } from '../consensus/ConsensusCoordinator';
import { SwarmMetrics } from '../metrics/SwarmMetrics';
import { ContextRouter } from '../ContextRouter';
import { CrossHiveProtocol } from '../CrossHiveProtocol';
import { ContextValidator } from '../../../context/ContextValidator';
import { DegradationMonitor } from '../../../context/DegradationMonitor';
import { GitHubProjectIntegration } from '../../../context/GitHubProjectIntegration';

interface SwarmTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredDomains: string[];
  context: any;
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  assignedPrincesses: string[];
  results?: any;
  desktopConfig?: any;
  evidencePaths?: string[];
}

export class QueenOrchestrator extends EventEmitter {
  private princessManager: PrincessManager;
  private consensusCoordinator: ConsensusCoordinator;
  private swarmMetrics: SwarmMetrics;
  private router!: ContextRouter;
  private protocol!: CrossHiveProtocol;
  private validator: ContextValidator;
  private degradationMonitor: DegradationMonitor;
  private githubIntegration: GitHubProjectIntegration;
  private activeTasks: Map<string, SwarmTask> = new Map();
  private readonly degradationThreshold = 0.15;
  private initialized = false;

  constructor() {
    super();
    this.princessManager = new PrincessManager();
    this.consensusCoordinator = new ConsensusCoordinator();
    this.swarmMetrics = new SwarmMetrics();
    this.validator = new ContextValidator();
    this.degradationMonitor = new DegradationMonitor();
    this.githubIntegration = new GitHubProjectIntegration();
  }

  /**
   * Initialize the Queen orchestrator and all subsystems
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(' Initializing Queen Orchestrator...');

    // Initialize princess manager
    await this.princessManager.initialize();

    // Initialize consensus coordinator with princesses
    await this.consensusCoordinator.initialize(this.princessManager.getPrincesses());

    // Setup inter-princess systems
    this.router = new ContextRouter(this.princessManager.getPrincesses());
    this.protocol = new CrossHiveProtocol(
      this.princessManager.getPrincesses(),
      this.consensusCoordinator.getConsensus()
    );

    // Setup event handlers
    this.setupEventHandlers();

    // Connect to GitHub MCP for truth source
    await this.githubIntegration.connect();

    // Perform initial synchronization
    await this.synchronizeAllPrincesses();

    this.initialized = true;
    this.emit('queen:initialized', this.swarmMetrics.getMetrics());

    console.log(' Queen Orchestrator initialized successfully');
  }

  /**
   * Execute a task across the swarm
   */
  async executeTask(
    taskDescription: string,
    context: any,
    options: {
      priority?: SwarmTask['priority'];
      requiredDomains?: string[];
      consensusRequired?: boolean;
    } = {}
  ): Promise<SwarmTask> {
    const task: SwarmTask = {
      id: this.generateTaskId(),
      type: this.inferTaskType(taskDescription),
      priority: options.priority || 'medium',
      requiredDomains: options.requiredDomains || this.inferRequiredDomains(taskDescription),
      context,
      status: 'pending',
      assignedPrincesses: [],
      evidencePaths: []
    };

    this.activeTasks.set(task.id, task);
    this.emit('task:created', task);

    try {
      // Validate context integrity
      const validation = await this.validator.validateContext(context);
      if (!validation.valid) {
        throw new Error(`Context validation failed: ${validation.errors.join(', ')}`);
      }

      // Route task to appropriate princesses
      const routing = await this.router.routeContext(
        context,
        'queen',
        {
          priority: task.priority,
          strategy: task.requiredDomains.length > 2 ? 'broadcast' : 'targeted'
        }
      );

      task.assignedPrincesses = routing.targetPrincesses;
      task.status = 'assigned';

      // Execute with consensus if required
      if (options.consensusRequired) {
        await this.executeWithConsensus(task);
      } else {
        await this.executeDirectly(task);
      }

      task.status = 'completed';
      this.emit('task:completed', task);

      return task;

    } catch (error) {
      task.status = 'failed';
      this.emit('task:failed', { task, error });
      throw error;
    }
  }

  /**
   * Execute task with princess consensus
   */
  private async executeWithConsensus(task: SwarmTask): Promise<void> {
    task.status = 'executing';

    const proposal = await this.consensusCoordinator.propose(
      'queen',
      'decision',
      {
        task: task.id,
        context: task.context,
        princesses: task.assignedPrincesses
      }
    );

    // Wait for consensus
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Consensus timeout'));
      }, 30000);

      this.consensusCoordinator.once('consensus:reached', (result) => {
        if (result.id === proposal.id) {
          clearTimeout(timeout);
          task.results = result.content;
          resolve();
        }
      });

      this.consensusCoordinator.once('consensus:failed', (failure) => {
        if (failure.proposal.id === proposal.id) {
          clearTimeout(timeout);
          reject(new Error(`Consensus failed: ${failure.reason}`));
        }
      });
    });
  }

  /**
   * Execute task directly through assigned princesses
   */
  private async executeDirectly(task: SwarmTask): Promise<void> {
    task.status = 'executing';

    const executions = task.assignedPrincesses.map(async princessId => {
      const princess = this.princessManager.getPrincess(princessId);
      if (!princess) return null;

      try {
        const result = await princess.executeTask({
          id: task.id,
          description: task.type,
          context: task.context,
          priority: task.priority
        });

        // Monitor for degradation
        const degradation = await this.degradationMonitor.calculateDegradation(
          task.context,
          result
        );

        if (degradation > this.degradationThreshold) {
          console.warn(` High degradation detected from ${princessId}: ${degradation}`);
          await this.handleDegradation(task, princessId, degradation);
        }

        return result;

      } catch (error) {
        console.error(` Princess ${princessId} execution failed:`, error);
        return null;
      }
    });

    const results = await Promise.all(executions);
    task.results = this.mergeResults(results.filter(r => r !== null));
  }

  /**
   * Handle context degradation
   */
  private async handleDegradation(
    task: SwarmTask,
    princessId: string,
    degradation: number
  ): Promise<void> {
    console.log(` Handling degradation for task ${task.id} from ${princessId}`);

    await this.consensusCoordinator.propose(
      'queen',
      'escalation',
      {
        task: task.id,
        princess: princessId,
        degradation,
        action: 'context_recovery'
      }
    );

    await this.protocol.sendMessage(
      'queen',
      princessId,
      {
        type: 'recovery',
        task: task.id,
        originalContext: task.context
      },
      { priority: 'high', requiresAck: true }
    );
  }

  /**
   * Synchronize all princesses
   */
  private async synchronizeAllPrincesses(): Promise<void> {
    console.log(' Synchronizing all princess domains...');

    const githubTruth = await this.githubIntegration.getProcessTruth();

    await this.protocol.sendMessage(
      'queen',
      'all',
      {
        type: 'sync',
        timestamp: Date.now(),
        githubTruth,
        queenContext: await this.getQueenContext()
      },
      { type: 'sync', priority: 'high' }
    );

    await this.verifySynchronization();
  }

  /**
   * Verify synchronization across all princesses
   */
  private async verifySynchronization(): Promise<void> {
    const results = await this.princessManager.verifyAllIntegrity();
    const averageIntegrity = results.reduce((sum, r) => sum + r.integrity, 0) / results.length;

    if (averageIntegrity < 0.85) {
      console.warn(` Low average integrity: ${averageIntegrity}`);
      await this.initiateRecovery();
    } else {
      console.log(` Synchronization verified: ${(averageIntegrity * 100).toFixed(1)}% integrity`);
    }
  }

  /**
   * Initiate recovery procedures
   */
  private async initiateRecovery(): Promise<void> {
    console.log(' Initiating recovery procedures...');

    await this.consensusCoordinator.propose(
      'queen',
      'recovery',
      {
        reason: 'low_integrity',
        timestamp: Date.now(),
        metrics: this.swarmMetrics.getMetrics()
      }
    );

    await this.degradationMonitor.initiateRecovery('rollback');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Consensus events
    this.consensusCoordinator.on('consensus:reached', (proposal) => {
      console.log(` Consensus reached: ${proposal.id}`);
    });

    this.consensusCoordinator.on('byzantine:detected', ({ princess, pattern }) => {
      console.warn(` Byzantine behavior detected: ${princess} - ${pattern}`);
    });

    // Protocol events
    this.protocol.on('message:failed', ({ message, target }) => {
      console.error(` Message delivery failed to ${target}`);
    });

    this.protocol.on('princess:unresponsive', ({ princess }) => {
      console.warn(` Princess ${princess} unresponsive`);
      this.princessManager.healPrincess(princess);
    });

    // Router events
    this.router.on('circuit:open', ({ princess }) => {
      console.warn(` Circuit breaker opened for ${princess}`);
    });

    // Degradation events
    this.degradationMonitor.on('degradation:critical', (data) => {
      console.error(` Critical degradation detected:`, data);
      this.initiateRecovery();
    });

    // Start health monitoring
    setInterval(() => this.princessManager.monitorHealth(), 30000);
  }

  /**
   * Get queen's overview context
   */
  private async getQueenContext(): Promise<any> {
    const metrics = this.swarmMetrics.getMetrics();
    const taskSummary = this.getTaskSummary();
    const princessStates = await this.princessManager.getPrincessStates();

    return {
      timestamp: Date.now(),
      metrics,
      taskSummary,
      princessStates,
      degradationThreshold: this.degradationThreshold
    };
  }

  /**
   * Get task summary
   */
  private getTaskSummary() {
    const tasks = Array.from(this.activeTasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      executing: tasks.filter(t => t.status === 'executing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length
    };
  }

  /**
   * Helper functions
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private inferTaskType(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('test') || lower.includes('quality')) return 'quality';
    if (lower.includes('security') || lower.includes('auth')) return 'security';
    if (lower.includes('research') || lower.includes('analyze')) return 'research';
    if (lower.includes('deploy') || lower.includes('infrastructure')) return 'infrastructure';
    if (lower.includes('coordinate') || lower.includes('plan')) return 'coordination';
    return 'development';
  }

  private inferRequiredDomains(description: string): string[] {
    const domains: string[] = [];
    const lower = description.toLowerCase();

    if (lower.includes('code') || lower.includes('implement')) domains.push('development');
    if (lower.includes('test') || lower.includes('quality')) domains.push('quality');
    if (lower.includes('security') || lower.includes('auth')) domains.push('security');
    if (lower.includes('research') || lower.includes('analyze')) domains.push('research');
    if (lower.includes('deploy') || lower.includes('pipeline')) domains.push('infrastructure');
    if (lower.includes('plan') || lower.includes('coordinate')) domains.push('coordination');

    return domains.length > 0 ? domains : ['development'];
  }

  private mergeResults(results: any[]): any {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];

    return {
      merged: true,
      results,
      timestamp: Date.now()
    };
  }

  /**
   * Get queen metrics
   */
  getMetrics() {
    return this.swarmMetrics.getMetrics();
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log(' Shutting down Queen Orchestrator...');

    this.protocol.shutdown();
    this.router.shutdown();
    await this.princessManager.shutdownAll();

    this.emit('queen:shutdown');
  }
}
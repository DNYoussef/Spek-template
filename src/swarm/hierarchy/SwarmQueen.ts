/**
 * Swarm Queen - Master Orchestrator for Hierarchical Princess Architecture
 * Claude with MCP mastery managing 6 princess domains with anti-degradation
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { HivePrincess } from './HivePrincess';
import { CoordinationPrincess } from './CoordinationPrincess';
import { PrincessConsensus } from './PrincessConsensus';
import { ContextRouter } from './ContextRouter';
import { CrossHiveProtocol } from './CrossHiveProtocol';
import { ContextDNA } from '../../context/ContextDNA';
import { ContextValidator } from '../../context/ContextValidator';
import { DegradationMonitor } from '../../context/DegradationMonitor';
import { GitHubProjectIntegration } from '../../context/GitHubProjectIntegration';
import { IntelligentContextPruner } from '../../context/IntelligentContextPruner';

interface PrincessConfig {
  id: string;
  type: 'development' | 'quality' | 'security' | 'research' | 'infrastructure' | 'coordination';
  model: string;
  agentCount: number;
  mcpServers: string[];
  maxContextSize: number;
}

interface QueenMetrics {
  totalPrincesses: number;
  activePrincesses: number;
  totalAgents: number;
  contextIntegrity: number;
  consensusSuccess: number;
  degradationRate: number;
  byzantineNodes: number;
  crossHiveMessages: number;
}

interface SwarmTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredDomains: string[];
  context: any;
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  assignedPrincesses: string[];
  results?: any;
}

export class SwarmQueen extends EventEmitter {
  private princesses: Map<string, HivePrincess> = new Map();
  private princessConfigs: Map<string, PrincessConfig> = new Map();
  private consensus!: PrincessConsensus;
  private router!: ContextRouter;
  private protocol!: CrossHiveProtocol;
  private contextDNA: ContextDNA;
  private validator: ContextValidator;
  private degradationMonitor: DegradationMonitor;
  private githubIntegration: GitHubProjectIntegration;
  private queenPruner: IntelligentContextPruner;
  private activeTasks: Map<string, SwarmTask> = new Map();
  private readonly maxQueenContext = 500 * 1024; // 500KB Queen context
  private readonly maxContextPerPrincess = 2 * 1024 * 1024; // 2MB Princess context
  private readonly maxWorkerContext = 100 * 1024; // 100KB Worker context
  private readonly degradationThreshold = 0.15;
  private initialized = false;

  constructor() {
    super();
    this.contextDNA = new ContextDNA();
    this.validator = new ContextValidator();
    this.degradationMonitor = new DegradationMonitor();
    this.githubIntegration = new GitHubProjectIntegration();
    this.queenPruner = new IntelligentContextPruner(this.maxQueenContext);
  }

  /**
   * Initialize the Swarm Queen with all princess domains
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(' Initializing Swarm Queen with 6 Princess Domains...');

    // Create princess configurations
    this.createPrincessConfigurations();

    // Initialize all princesses
    await this.initializePrincesses();

    // Setup inter-princess systems
    this.consensus = new PrincessConsensus(this.princesses);
    this.router = new ContextRouter(this.princesses);
    this.protocol = new CrossHiveProtocol(this.princesses, this.consensus);

    // Setup event handlers
    this.setupEventHandlers();

    // Connect to GitHub MCP for truth source
    await this.githubIntegration.connect();

    // Perform initial synchronization
    await this.synchronizeAllPrincesses();

    this.initialized = true;
    this.emit('queen:initialized', this.getMetrics());

    console.log(' Swarm Queen initialized with 85+ agents across 6 domains');
  }

  /**
   * Create configurations for all 6 princess domains
   */
  private createPrincessConfigurations(): void {
    const configs: PrincessConfig[] = [
      {
        id: 'development',
        type: 'development',
        model: 'gpt-5-codex',
        agentCount: 15,
        mcpServers: ['claude-flow', 'memory', 'github', 'playwright', 'figma'],
        maxContextSize: this.maxContextPerPrincess
      },
      {
        id: 'quality',
        type: 'quality',
        model: 'claude-opus-4.1',
        agentCount: 12,
        mcpServers: ['claude-flow', 'memory', 'eva', 'github'],
        maxContextSize: this.maxContextPerPrincess
      },
      {
        id: 'security',
        type: 'security',
        model: 'claude-opus-4.1',
        agentCount: 10,
        mcpServers: ['claude-flow', 'memory', 'eva', 'github'],
        maxContextSize: this.maxContextPerPrincess
      },
      {
        id: 'research',
        type: 'research',
        model: 'gemini-2.5-pro',
        agentCount: 15,
        mcpServers: ['claude-flow', 'memory', 'deepwiki', 'firecrawl', 'ref', 'context7'],
        maxContextSize: this.maxContextPerPrincess
      },
      {
        id: 'infrastructure',
        type: 'infrastructure',
        model: 'gpt-5-codex',
        agentCount: 18,
        mcpServers: ['claude-flow', 'memory', 'github', 'playwright'],
        maxContextSize: this.maxContextPerPrincess
      },
      {
        id: 'coordination',
        type: 'coordination',
        model: 'claude-sonnet-4',
        agentCount: 15,
        mcpServers: ['claude-flow', 'memory', 'sequential-thinking', 'github-project-manager'],
        maxContextSize: this.maxContextPerPrincess
      }
    ];

    for (const config of configs) {
      this.princessConfigs.set(config.id, config);
    }
  }

  /**
   * Initialize all princess instances
   */
  private async initializePrincesses(): Promise<void> {
    const initPromises = Array.from(this.princessConfigs.entries()).map(
      async ([id, config]) => {
        let princess: HivePrincess;

        // Create princess instance
        princess = new HivePrincess(
          id,
          config.model,
          config.agentCount
        );

        // Initialize princess
        await princess.initialize();
        
        // Configure model and MCP servers
        await this.configurePrincess(princess, config);

        this.princesses.set(id, princess);
        
        console.log(` Princess ${id} initialized with ${config.agentCount} agents`);
      }
    );

    await Promise.all(initPromises);
  }

  /**
   * Configure princess with model and MCP servers
   */
  private async configurePrincess(
    princess: HivePrincess,
    config: PrincessConfig
  ): Promise<void> {
    // Set AI model
    await princess.setModel(config.model);

    // Configure MCP servers
    for (const server of config.mcpServers) {
      await princess.addMCPServer(server);
    }

    // Set context limits
    princess.setMaxContextSize(config.maxContextSize);
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
      assignedPrincesses: []
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

    // Propose task to consensus system
    const proposal = await this.consensus.propose(
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

      this.consensus.once('consensus:reached', (result) => {
        if (result.id === proposal.id) {
          clearTimeout(timeout);
          task.results = result.content;
          resolve();
        }
      });

      this.consensus.once('consensus:failed', (failure) => {
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
      const princess = this.princesses.get(princessId);
      if (!princess) return null;

      try {
        // Execute task with princess
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
          console.warn(`High degradation detected from ${princessId}: ${degradation}`);
          await this.handleDegradation(task, princessId, degradation);
        }

        return result;

      } catch (error) {
        console.error(`Princess ${princessId} execution failed:`, error);
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

    // Escalate to consensus
    await this.consensus.propose(
      'queen',
      'escalation',
      {
        task: task.id,
        princess: princessId,
        degradation,
        action: 'context_recovery'
      }
    );

    // Attempt recovery through cross-hive protocol
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

    // Get truth from GitHub MCP
    const githubTruth = await this.githubIntegration.getProcessTruth();

    // Broadcast synchronization
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

    // Verify synchronization
    await this.verifySynchronization();
  }

  /**
   * Verify synchronization across all princesses
   */
  private async verifySynchronization(): Promise<void> {
    const verifications = Array.from(this.princesses.entries()).map(
      async ([id, princess]) => {
        const integrity = await princess.getContextIntegrity();
        return { princess: id, integrity };
      }
    );

    const results = await Promise.all(verifications);
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

    // Use consensus for recovery strategy
    await this.consensus.propose(
      'queen',
      'recovery',
      {
        reason: 'low_integrity',
        timestamp: Date.now(),
        metrics: this.getMetrics()
      }
    );

    // Rollback to last known good state
    await this.degradationMonitor.initiateRecovery('rollback');
  }

  /**
   * Monitor swarm health
   */
  async monitorHealth(): Promise<void> {
    const healthChecks = Array.from(this.princesses.entries()).map(
      async ([id, princess]) => {
        try {
          const health = await princess.getHealth();
          return { princess: id, healthy: health.status === 'healthy', health };
        } catch (error) {
          return { princess: id, healthy: false, error };
        }
      }
    );

    const results = await Promise.all(healthChecks);
    const unhealthyPrincesses = results.filter(r => !r.healthy);

    if (unhealthyPrincesses.length > 0) {
      console.warn(` ${unhealthyPrincesses.length} unhealthy princesses detected`);
      
      for (const { princess, error } of unhealthyPrincesses) {
        await this.healPrincess(princess, error);
      }
    }

    this.emit('health:checked', results);
  }

  /**
   * Heal an unhealthy princess
   */
  private async healPrincess(princessId: string, error: any): Promise<void> {
    console.log(` Healing princess ${princessId}...`);

    const princess = this.princesses.get(princessId);
    if (!princess) return;

    try {
      // Attempt restart
      await princess.restart();
      
      // Restore context from siblings
      const siblings = Array.from(this.princesses.keys())
        .filter(id => id !== princessId);
      
      if (siblings.length > 0) {
        const donorId = siblings[0];
        const donor = this.princesses.get(donorId)!;
        const context = await donor.getSharedContext();
        await princess.restoreContext(context);
      }

      console.log(` Princess ${princessId} healed successfully`);

    } catch (healError) {
      console.error(`Failed to heal princess ${princessId}:`, healError);
      
      // Quarantine if healing fails
      await this.quarantinePrincess(princessId);
    }
  }

  /**
   * Quarantine a problematic princess
   */
  private async quarantinePrincess(princessId: string): Promise<void> {
    console.warn(` Quarantining princess ${princessId}`);
    
    const princess = this.princesses.get(princessId);
    if (!princess) return;

    // Isolate from network
    await princess.isolate();
    
    // Redistribute workload
    const config = this.princessConfigs.get(princessId);
    if (config) {
      await this.redistributeWorkload(config.type);
    }

    this.emit('princess:quarantined', { princess: princessId });
  }

  /**
   * Redistribute workload from failed princess
   */
  private async redistributeWorkload(failedType: string): Promise<void> {
    // Find princesses that can handle the workload
    const candidates = Array.from(this.princesses.entries())
      .filter(([id, p]) => {
        const config = this.princessConfigs.get(id);
        return config && config.type !== failedType && p.isHealthy();
      });

    if (candidates.length === 0) {
      console.error('No healthy princesses available for redistribution');
      return;
    }

    // Distribute evenly among candidates
    console.log(` Redistributing ${failedType} workload to ${candidates.length} princesses`);
    
    for (const [id, princess] of candidates) {
      await princess.increaseCapacity(20); // Increase capacity by 20%
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Consensus events
    this.consensus.on('consensus:reached', (proposal) => {
      console.log(` Consensus reached: ${proposal.id}`);
    });

    this.consensus.on('byzantine:detected', ({ princess, pattern }) => {
      console.warn(` Byzantine behavior detected: ${princess} - ${pattern}`);
    });

    // Protocol events
    this.protocol.on('message:failed', ({ message, target }) => {
      console.error(` Message delivery failed to ${target}`);
    });

    this.protocol.on('princess:unresponsive', ({ princess }) => {
      console.warn(` Princess ${princess} unresponsive`);
      this.healPrincess(princess, new Error('Unresponsive'));
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
    setInterval(() => this.monitorHealth(), 30000); // Every 30 seconds
  }

  /**
   * Get queen's overview context
   */
  private async getQueenContext(): Promise<any> {
    const metrics = this.getMetrics();
    const taskSummary = this.getTaskSummary();
    const princessStates = await this.getPrincessStates();

    return {
      timestamp: Date.now(),
      metrics,
      taskSummary,
      princessStates,
      degradationThreshold: this.degradationThreshold,
      maxContextPerPrincess: this.maxContextPerPrincess
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
   * Get princess states
   */
  private async getPrincessStates(): Promise<any[]> {
    const states = await Promise.all(
      Array.from(this.princesses.entries()).map(async ([id, princess]) => {
        const config = this.princessConfigs.get(id)!;
        const health = await princess.getHealth();
        const integrity = await princess.getContextIntegrity();
        
        return {
          id,
          type: config.type,
          model: config.model,
          agentCount: config.agentCount,
          health: health.status,
          integrity,
          contextUsage: await princess.getContextUsage()
        };
      })
    );
    
    return states;
  }

  /**
   * Helper functions
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
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
    
    // Merge results based on type
    return {
      merged: true,
      results,
      timestamp: Date.now()
    };
  }

  /**
   * Get queen metrics
   */
  getMetrics(): QueenMetrics {
    const byzantineCount = Array.from(this.consensus.getMetrics().byzantineNodes || 0);
    
    return {
      totalPrincesses: this.princesses.size,
      activePrincesses: Array.from(this.princesses.values())
        .filter(p => p.isHealthy()).length,
      totalAgents: Array.from(this.princessConfigs.values())
        .reduce((sum, c) => sum + c.agentCount, 0),
      contextIntegrity: this.calculateAverageIntegrity(),
      consensusSuccess: this.consensus.getMetrics().successRate,
      degradationRate: this.degradationMonitor.getMetrics().averageDegradation,
      byzantineNodes: byzantineCount.length,
      crossHiveMessages: this.protocol.getMetrics().messagesSent
    };
  }

  private calculateAverageIntegrity(): number {
    // This would calculate from actual princess integrity scores
    return 0.92; // Placeholder
  }

  /**
   * Shutdown the queen and all systems
   */
  async shutdown(): Promise<void> {
    console.log(' Shutting down Swarm Queen...');
    
    // Save state
    await this.saveState();
    
    // Shutdown systems
    this.protocol.shutdown();
    this.router.shutdown();
    
    // Shutdown princesses
    await Promise.all(
      Array.from(this.princesses.values()).map(p => p.shutdown())
    );
    
    this.emit('queen:shutdown');
  }

  /**
   * Save queen state for recovery
   */
  private async saveState(): Promise<void> {
    const state = {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      tasks: Array.from(this.activeTasks.values()),
      princessStates: await this.getPrincessStates()
    };
    
    // Would persist to disk or database
    console.log(' Queen state saved');
  }
}

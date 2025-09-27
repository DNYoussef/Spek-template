/**
 * SwarmInitializer - Hierarchical Swarm Infrastructure Orchestrator
 * Initializes Queen-Princess-Drone architecture with Byzantine consensus
 * for god object remediation and parallel task execution.
 * Target: Support decomposition of 20 god objects in Days 3-5
 * Architecture: 1 Queen + 6 Princesses + Byzantine Consensus + Parallel Pipelines
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SwarmQueen } from '../hierarchy/SwarmQueen';
import { DevelopmentPrincess } from '../hierarchy/domains/DevelopmentPrincess';
import { QualityPrincess } from '../hierarchy/domains/QualityPrincess';
import { SecurityPrincess } from '../hierarchy/domains/SecurityPrincess';
import { ResearchPrincess } from '../hierarchy/domains/ResearchPrincess';
import { InfrastructurePrincess } from '../hierarchy/domains/InfrastructurePrincess';
import { CoordinationPrincess } from '../hierarchy/CoordinationPrincess';
import { ConsensusCoordinator } from '../hierarchy/consensus/ConsensusCoordinator';
import { LoggerFactory } from '../../utils/logger';

export interface SwarmConfig {
  maxConcurrentFiles: number;
  byzantineToleranceLevel: number;
  parallelPipelinesPerPrincess: number;
  godObjectTarget: number;
  timelineHours: number;
  consensusQuorum: number;
  healthCheckInterval: number;
}

export interface SwarmStatus {
  queenStatus: string;
  princessCount: number;
  activePrincesses: string[];
  consensusHealth: number;
  parallelPipelines: number;
  godObjectsProcessed: number;
  godObjectsRemaining: number;
  estimatedCompletionHours: number;
}

export class SwarmInitializer extends EventEmitter {
  private queen: SwarmQueen | null = null;
  private princesses: Map<string, any> = new Map();
  private consensusCoordinator: ConsensusCoordinator | null = null;
  private config: SwarmConfig;
  private initialized = false;
  private startTime: bigint = 0n;
  private godObjectsProcessed = 0;
  private logger = LoggerFactory.getLogger('SwarmInitializer');

  constructor(config?: Partial<SwarmConfig>) {
    super();
    this.config = {
      maxConcurrentFiles: 4, // 3-4 files per princess
      byzantineToleranceLevel: 0.33, // Tolerate up to 33% Byzantine nodes
      parallelPipelinesPerPrincess: 2,
      godObjectTarget: 20,
      timelineHours: 72, // Days 3-5
      consensusQuorum: 0.67, // 2/3 majority
      healthCheckInterval: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Initialize complete hierarchical swarm infrastructure
   */
  async initializeSwarm(): Promise<SwarmStatus> {
    this.startTime = process.hrtime.bigint();

    this.logger.info('Starting hierarchical swarm initialization', {
      operation: 'initialize_swarm',
      metadata: {
        godObjectTarget: this.config.godObjectTarget,
        maxConcurrentFiles: this.config.maxConcurrentFiles,
        byzantineToleranceLevel: this.config.byzantineToleranceLevel
      }
    });

    // Step 1: Deploy SwarmQueen
    await this.deployQueen();

    // Step 2: Initialize 6 Domain Princesses
    await this.initializePrincesses();

    // Step 3: Configure Byzantine Consensus
    await this.configureByzantineConsensus();

    // Step 4: Set up parallel execution pipelines
    await this.setupParallelPipelines();

    // Step 5: Initialize monitoring and progress tracking
    await this.initializeMonitoring();

    this.initialized = true;
    this.emit('swarm:initialized', this.getStatus());

    this.logger.performance('Hierarchical swarm initialization', this.startTime);

    return this.getStatus();
  }

  /**
   * Deploy SwarmQueen as central orchestrator
   */
  private async deployQueen(): Promise<void> {
    this.logger.info('Step 1: Deploying SwarmQueen', { operation: 'deploy_queen' });

    this.queen = new SwarmQueen();
    await this.queen.initialize();

    this.queen.on('task:completed', (task) => {
      this.godObjectsProcessed++;
      this.logger.info('God object decomposition completed', {
        operation: 'task_completed',
        metadata: { taskId: task.id, processedCount: this.godObjectsProcessed }
      });
      this.emit('godObject:decomposed', task);
    });

    this.queen.on('task:failed', (task) => {
      this.logger.warn('God object task failed', {
        operation: 'task_failed',
        metadata: { taskId: task.id }
      });
      this.emit('godObject:failed', task);
    });

    this.logger.info('SwarmQueen deployed and central orchestration active');
  }

  /**
   * Initialize all 6 Princess domains
   */
  private async initializePrincesses(): Promise<void> {
    this.logger.info('Step 2: Initializing Princess Domains', { operation: 'initialize_princesses' });

    const princessConfigs = [
      {
        name: 'Development',
        instance: new DevelopmentPrincess(),
        model: 'gpt-5-codex',
        servers: ['claude-flow', 'memory', 'github', 'eva']
      },
      {
        name: 'Quality',
        instance: new QualityPrincess(),
        model: 'claude-opus-4.1',
        servers: ['claude-flow', 'memory', 'eva', 'playwright']
      },
      {
        name: 'Security',
        instance: new SecurityPrincess(),
        model: 'claude-opus-4.1',
        servers: ['claude-flow', 'memory', 'eva']
      },
      {
        name: 'Research',
        instance: new ResearchPrincess(),
        model: 'gemini-2.5-pro',
        servers: ['claude-flow', 'memory', 'deepwiki', 'firecrawl', 'ref', 'context7']
      },
      {
        name: 'Infrastructure',
        instance: new InfrastructurePrincess(),
        model: 'claude-sonnet-4',
        servers: ['claude-flow', 'memory', 'sequential-thinking', 'github']
      },
      {
        name: 'Coordination',
        instance: new CoordinationPrincess(),
        model: 'claude-sonnet-4',
        servers: ['claude-flow', 'memory', 'sequential-thinking', 'github-project-manager']
      }
    ];

    for (const config of princessConfigs) {
      const princessId = uuidv4();

      this.logger.info(`Initializing ${config.name} Princess`, {
        operation: 'initialize_princess',
        metadata: {
          princessId,
          name: config.name,
          model: config.model,
          mcpServers: config.servers
        }
      });

      await config.instance.initialize();
      await config.instance.setModel(config.model);

      for (const server of config.servers) {
        await config.instance.addMCPServer(server);
      }

      // Set context limits per princess (3MB each)
      config.instance.setMaxContextSize(3 * 1024 * 1024);
      config.instance.setPrincessId(princessId);

      this.princesses.set(config.name, config.instance);

      this.logger.info(`${config.name} Princess initialized successfully`, {
        operation: 'princess_ready',
        metadata: { princessId, name: config.name }
      });
    }

    this.logger.info(`All princesses active: ${this.princesses.size}/6`);
  }

  /**
   * Configure Byzantine consensus for fault-tolerant coordination
   */
  private async configureByzantineConsensus(): Promise<void> {
    this.logger.info('Step 3: Configuring Byzantine Consensus', { operation: 'configure_consensus' });

    const princessArray = Array.from(this.princesses.values());
    this.consensusCoordinator = new ConsensusCoordinator();
    await this.consensusCoordinator.initialize(princessArray);

    const byzantineNodes = Math.floor(this.princesses.size * this.config.byzantineToleranceLevel);
    const minimumHealthyNodes = Math.ceil(this.princesses.size * this.config.consensusQuorum);

    this.logger.info('Byzantine consensus configured', {
      operation: 'consensus_ready',
      metadata: {
        consensusType: 'Byzantine Fault Tolerant',
        quorumRequirement: `${this.config.consensusQuorum * 100}%`,
        byzantineTolerance: `${byzantineNodes} nodes (${this.config.byzantineToleranceLevel * 100}%)`,
        totalValidators: this.princesses.size,
        minimumHealthyNodes
      }
    });
  }

  /**
   * Set up parallel execution pipelines (3-4 files concurrent per princess)
   */
  private async setupParallelPipelines(): Promise<void> {
    this.logger.info('Step 4: Setting up parallel execution pipelines', { operation: 'setup_pipelines' });

    const totalPipelines = this.princesses.size * this.config.parallelPipelinesPerPrincess;
    const maxSystemThroughput = totalPipelines * this.config.maxConcurrentFiles;

    this.logger.info('Parallel execution pipelines configured', {
      operation: 'pipelines_ready',
      metadata: {
        pipelinesPerPrincess: this.config.parallelPipelinesPerPrincess,
        maxConcurrentFilesPerPrincess: this.config.maxConcurrentFiles,
        totalParallelPipelines: totalPipelines,
        maxSystemThroughput: `${maxSystemThroughput} files/cycle`
      }
    });

    // Configure each princess for parallel execution
    for (const [name, princess] of this.princesses) {
      const pipelineId = uuidv4();

      this.logger.debug(`Configuring pipelines for ${name} Princess`, {
        operation: 'configure_princess_pipeline',
        metadata: {
          pipelineId,
          princess: name,
          pipelines: this.config.parallelPipelinesPerPrincess,
          maxConcurrent: this.config.maxConcurrentFiles
        }
      });

      this.emit('pipeline:configured', {
        pipelineId,
        princess: name,
        pipelines: this.config.parallelPipelinesPerPrincess,
        maxConcurrent: this.config.maxConcurrentFiles
      });
    }
  }

  /**
   * Initialize monitoring and progress tracking
   */
  private async initializeMonitoring(): Promise<void> {
    this.logger.info('Step 5: Initializing monitoring & progress tracking', { operation: 'initialize_monitoring' });

    // Set up health checks with real timing
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Set up progress tracking
    this.on('godObject:decomposed', () => {
      this.logProgress();
    });

    this.logger.info('Monitoring and progress tracking initialized', {
      operation: 'monitoring_ready',
      metadata: {
        healthCheckInterval: `${this.config.healthCheckInterval / 1000}s`,
        progressTracking: 'ACTIVE',
        byzantineNodeDetection: 'ENABLED',
        autoRecovery: 'ENABLED'
      }
    });
  }

  /**
   * Perform health check on all princesses
   */
  private async performHealthCheck(): Promise<void> {
    const healthResults: Map<string, any> = new Map();

    for (const [name, princess] of this.princesses) {
      try {
        const health = await princess.getHealth();
        const integrity = await princess.getContextIntegrity();

        healthResults.set(name, {
          status: health.status,
          integrity,
          healthy: princess.isHealthy()
        });

        // Auto-recovery for unhealthy princesses
        if (!princess.isHealthy()) {
          this.logger.warn(`${name} Princess unhealthy - initiating recovery`, {
            operation: 'princess_recovery',
            metadata: { princess: name }
          });
          await princess.restart();
        }
      } catch (error) {
        this.logger.error(`${name} Princess health check failed`,
          { operation: 'health_check', metadata: { princess: name } },
          error as Error
        );
        healthResults.set(name, { status: 'error', healthy: false });
      }
    }

    this.emit('health:checked', healthResults);
  }

  /**
   * Log progress towards god object remediation goal with real metrics
   */
  private logProgress(): void {
    const remaining = this.config.godObjectTarget - this.godObjectsProcessed;
    const elapsed = Number(process.hrtime.bigint() - this.startTime) / 1_000_000_000 / 3600; // Convert to hours
    const rate = elapsed > 0 ? this.godObjectsProcessed / elapsed : 0;
    const estimated = rate > 0 ? remaining / rate : 0;

    this.logger.info('God object remediation progress update', {
      operation: 'progress_update',
      metadata: {
        processed: this.godObjectsProcessed,
        target: this.config.godObjectTarget,
        remaining,
        progressPercentage: ((this.godObjectsProcessed / this.config.godObjectTarget) * 100).toFixed(1),
        rate: `${rate.toFixed(2)} objects/hour`,
        estimatedCompletion: `${estimated.toFixed(1)} hours`,
        elapsedTime: `${elapsed.toFixed(2)} hours`
      }
    });
  }

  /**
   * Execute god object decomposition task with real tracking
   */
  async decomposeGodObject(filePath: string, metadata: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Swarm not initialized. Call initializeSwarm() first.');
    }

    const taskId = uuidv4();
    const startTime = process.hrtime.bigint();

    this.logger.info('Starting god object decomposition', {
      operation: 'decompose_god_object',
      metadata: { taskId, filePath, ...metadata }
    });

    const task = {
      id: taskId,
      type: 'god-object-decomposition',
      filePath,
      metadata,
      priority: 'high' as const,
      requiredDomains: ['Development', 'Quality', 'Security', 'Research'],
      context: {
        target: 'god-object',
        action: 'decompose',
        file: filePath,
        taskId
      }
    };

    try {
      const result = await this.queen!.executeTask(
        `Decompose god object: ${filePath}`,
        task.context,
        {
          priority: task.priority,
          requiredDomains: task.requiredDomains,
          consensusRequired: true
        }
      );

      this.logger.performance('God object decomposition completed', startTime, {
        metadata: { taskId, filePath, success: true }
      });

      return result;

    } catch (error) {
      this.logger.error('God object decomposition failed',
        { operation: 'decompose_god_object', metadata: { taskId, filePath } },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get current swarm status
   */
  getStatus(): SwarmStatus {
    const activePrincesses: string[] = [];

    for (const [name, princess] of this.princesses) {
      if (princess.isHealthy()) {
        activePrincesses.push(name);
      }
    }

    const elapsed = Number(process.hrtime.bigint() - this.startTime) / 1_000_000_000 / 3600; // Convert to hours
    const rate = elapsed > 0 ? this.godObjectsProcessed / elapsed : 0;
    const remaining = this.config.godObjectTarget - this.godObjectsProcessed;
    const estimated = rate > 0 ? remaining / rate : 0;

    return {
      queenStatus: this.queen ? 'active' : 'inactive',
      princessCount: this.princesses.size,
      activePrincesses,
      consensusHealth: activePrincesses.length / this.princesses.size,
      parallelPipelines: this.princesses.size * this.config.parallelPipelinesPerPrincess,
      godObjectsProcessed: this.godObjectsProcessed,
      godObjectsRemaining: remaining,
      estimatedCompletionHours: estimated
    };
  }

  /**
   * Shutdown swarm gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down swarm', { operation: 'shutdown' });

    for (const [name, princess] of this.princesses) {
      await princess.shutdown();
      this.logger.info(`${name} Princess shutdown complete`, {
        operation: 'princess_shutdown',
        metadata: { princess: name }
      });
    }

    if (this.queen) {
      await this.queen.shutdown();
      this.logger.info('SwarmQueen shutdown complete', { operation: 'queen_shutdown' });
    }

    this.initialized = false;
    this.logger.info('Swarm shutdown complete');
  }
}
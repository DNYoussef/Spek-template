/**
 * CLAUDE.md DSPy Enforcer
 * Enforces optimized CLAUDE.md patterns across all 87+ agents
 * NASA Rule 10 Compliant with automatic validation
 */

import { EventEmitter } from 'events';
import { GlobalPromptOptimizer } from './GlobalPromptOptimizer';
import { SystemWideValidator } from './SystemWideValidator';
import { ImpactMeasurement } from './ImpactMeasurement';
import { DualMemoryCoordinator } from '../memory/DualMemoryCoordinator';

export interface AgentConfiguration {
  agentId: string;
  agentType: string;
  modelType: string;
  mcpServers: string[];
  claudeMdVersion: string;
  qualityThreshold: number;
}

export interface EnforcementResult {
  agentId: string;
  status: 'enforced' | 'failed' | 'skipped';
  qualityScore: number;
  violations: string[];
  timestamp: number;
}

export interface ComplianceMetrics {
  totalAgents: number;
  compliantAgents: number;
  averageQuality: number;
  criticalViolations: number;
  enforcementRate: number;
}

export class CLAUDEMDEnforcer extends EventEmitter {
  private optimizer: GlobalPromptOptimizer;
  private validator: SystemWideValidator;
  private impactMeasurer: ImpactMeasurement;
  private memoryCoordinator: DualMemoryCoordinator | null = null;
  private agentConfigurations: Map<string, AgentConfiguration> = new Map();
  private enforcementResults: Map<string, EnforcementResult> = new Map();
  private readonly maxAgents = 100; // NASA Rule 10: Bounded
  private readonly minQualityThreshold = 0.85;
  private readonly enforcementInterval = 300000; // 5 minutes
  private enforcementTimer: NodeJS.Timer | null = null;
  private initialized = false;

  constructor() {
    super();
    this.optimizer = new GlobalPromptOptimizer();
    this.validator = new SystemWideValidator();
    this.impactMeasurer = new ImpactMeasurement();

    assert(this.optimizer !== null, 'Optimizer must be initialized');
    assert(this.validator !== null, 'Validator must be initialized');
  }

  /**
   * Initialize enforcer with agent configurations
   * NASA Rule 10: Bounded initialization
   */
  async initializeComponent(agents: AgentConfiguration[]): Promise<void> {
    if (this.initialized) return;

    assert(agents.length > 0, 'Agents required');
    assert(agents.length <= this.maxAgents, 'Too many agents');

    console.log(`Initializing CLAUDE.md enforcer for ${agents.length} agents...`);

    // Initialize components
    await this.optimizer.initialize();
    await this.validator.initialize();
    await this.impactMeasurer.initialize();

    // Register agents (bounded)
    for (let i = 0; i < Math.min(agents.length, this.maxAgents); i++) {
      const agent = agents[i];
      this.registerAgent(agent);
    }

    // Start enforcement cycle
    this.startEnforcementCycle();

    this.initialized = true;
    this.emit('enforcer:initialized', this.getMetrics());
  }

  /**
   * Register agent configuration
   * NASA Rule 10: Validation and bounds
   */
  private registerAgent(config: AgentConfiguration): void {
    assert(config.agentId.length > 0, 'Agent ID required');
    assert(config.qualityThreshold >= 0.5, 'Quality threshold too low');
    assert(config.qualityThreshold <= 1.0, 'Quality threshold invalid');

    // Enforce minimum quality
    if (config.qualityThreshold < this.minQualityThreshold) {
      config.qualityThreshold = this.minQualityThreshold;
      console.warn(`Agent ${config.agentId} quality raised to ${this.minQualityThreshold}`);
    }

    this.agentConfigurations.set(config.agentId, config);

    // Initialize enforcement result
    this.enforcementResults.set(config.agentId, {
      agentId: config.agentId,
      status: 'skipped',
      qualityScore: 0,
      violations: [],
      timestamp: Date.now()
    });
  }

  /**
   * Enforce CLAUDE.md on specific agent
   * NASA Rule 10: Bounded enforcement
   */
  async enforceOnAgent(agentId: string): Promise<EnforcementResult> {
    assert(this.initialized, 'Enforcer must be initialized');
    assert(agentId.length > 0, 'Agent ID required');

    const config = this.agentConfigurations.get(agentId);
    if (!config) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    console.log(`Enforcing CLAUDE.md on agent ${agentId}...`);

    try {
      // Get optimized prompt for agent
      const optimized = await this.optimizer.optimizeForAgent(
        config.agentType,
        config.modelType,
        config.mcpServers
      );

      // Validate compliance
      const validation = await this.validator.validateAgent(
        agentId,
        optimized
      );

      // Check quality threshold
      const qualityMet = validation.overallScore >= config.qualityThreshold;

      const result: EnforcementResult = {
        agentId,
        status: qualityMet ? 'enforced' : 'failed',
        qualityScore: validation.overallScore,
        violations: validation.violations || [],
        timestamp: Date.now()
      };

      // Store result
      this.enforcementResults.set(agentId, result);

      // Store in memory if available
      if (this.memoryCoordinator) {
        await this.storeEnforcementResult(result);
      }

      // Emit event
      this.emit('agent:enforced', result);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result: EnforcementResult = {
        agentId,
        status: 'failed',
        qualityScore: 0,
        violations: [`Enforcement error: ${errorMessage}`],
        timestamp: Date.now()
      };

      this.enforcementResults.set(agentId, result);
      return result;
    }
  }

  /**
   * Enforce on all agents
   * NASA Rule 10: Bounded batch enforcement
   */
  async enforceOnAllAgents(): Promise<ComplianceMetrics> {
    assert(this.initialized, 'Enforcer must be initialized');

    console.log('Starting system-wide CLAUDE.md enforcement...');

    const agents = Array.from(this.agentConfigurations.keys());
    const maxBatch = Math.min(agents.length, 20); // Process max 20 at once

    // Process in batches
    for (let i = 0; i < agents.length; i += maxBatch) {
      const batch = agents.slice(i, Math.min(i + maxBatch, agents.length));

      const promises = batch.map(agentId => this.enforceOnAgent(agentId));
      await Promise.all(promises);
    }

    // Measure impact
    const impact = await this.impactMeasurer.measureSystemImpact(
      Array.from(this.enforcementResults.values())
    );

    // Calculate metrics
    const metrics = this.getMetrics();

    // Check critical violations
    if (metrics.criticalViolations > 0) {
      console.error(`Critical violations detected: ${metrics.criticalViolations}`);
      await this.handleCriticalViolations();
    }

    this.emit('enforcement:complete', metrics);
    return metrics;
  }

  /**
   * Add quality gate for agent spawning
   * NASA Rule 10: Pre-spawn validation
   */
  async validateBeforeSpawn(
    agentType: string,
    task: string
  ): Promise<{ approved: boolean; reason?: string }> {
    assert(agentType.length > 0, 'Agent type required');
    assert(task.length > 0, 'Task required');

    // Check if agent type is registered
    const configs = Array.from(this.agentConfigurations.values());
    const agentConfig = configs.find(c => c.agentType === agentType);

    if (!agentConfig) {
      return {
        approved: false,
        reason: `Agent type ${agentType} not registered`
      };
    }

    // Check recent enforcement results
    const recentResults = Array.from(this.enforcementResults.values())
      .filter(r => r.timestamp > Date.now() - 3600000); // Last hour

    const avgQuality = recentResults.reduce(
      (sum, r) => sum + r.qualityScore,
      0
    ) / Math.max(recentResults.length, 1);

    if (avgQuality < this.minQualityThreshold) {
      return {
        approved: false,
        reason: `System quality ${avgQuality.toFixed(2)} below threshold ${this.minQualityThreshold}`
      };
    }

    return { approved: true };
  }

  /**
   * Start enforcement cycle
   * NASA Rule 10: Periodic enforcement
   */
  private startEnforcementCycle(): void {
    if (this.enforcementTimer) {
      clearInterval(this.enforcementTimer);
    }

    this.enforcementTimer = setInterval(() => {
      this.enforceOnAllAgents().catch(error => {
        console.error('Enforcement cycle failed:', error);
      });
    }, this.enforcementInterval);
  }

  /**
   * Handle critical violations
   * NASA Rule 10: Bounded recovery
   */
  private async handleCriticalViolations(): Promise<void> {
    console.log('Handling critical violations...');

    // Identify violating agents
    const violators: string[] = [];
    const results = Array.from(this.enforcementResults.entries());

    for (let i = 0; i < Math.min(results.length, 10); i++) {
      const [agentId, result] = results[i];
      if (result.violations.length > 0) {
        violators.push(agentId);
      }
    }

    // Emit alert
    this.emit('critical:violations', {
      agents: violators,
      timestamp: Date.now()
    });

    // Re-optimize for violating agents
    for (let i = 0; i < Math.min(violators.length, 5); i++) {
      await this.enforceOnAgent(violators[i]);
    }
  }

  /**
   * Store enforcement result in memory
   * NASA Rule 10: Memory integration
   */
  private async storeEnforcementResult(result: EnforcementResult): Promise<void> {
    if (!this.memoryCoordinator) return;

    try {
      const communication = {
        optimizedMessage: {
          id: `enforcement_${result.agentId}_${Date.now()}`,
          content: JSON.stringify(result),
          sourceAgent: { id: 'enforcer', role: 'SYSTEM', type: 'enforcer', metadata: {} },
          targetAgent: { id: result.agentId, role: 'AGENT', type: 'worker', metadata: {} },
          timestamp: result.timestamp,
          priority: 'high' as const,
          agentContext: {}
        },
        qualityScore: result.qualityScore,
        contextDNA: { type: 'enforcement', version: '1.0' },
        performanceMetrics: {} as any,
        optimizationTrace: []
      };

      await this.memoryCoordinator.storeCommunication(
        communication,
        communication.optimizedMessage.sourceAgent,
        communication.optimizedMessage.targetAgent
      );

    } catch (error) {
      console.error('Failed to store enforcement result:', error);
    }
  }

  /**
   * Get compliance metrics
   * NASA Rule 10: Metrics calculation
   */
  getMetrics(): ComplianceMetrics {
    const results = Array.from(this.enforcementResults.values());
    const compliant = results.filter(r => r.status === 'enforced');
    const totalQuality = results.reduce((sum, r) => sum + r.qualityScore, 0);
    const critical = results.filter(r => 
      r.violations.some(v => v.includes('critical'))
    );

    return {
      totalAgents: this.agentConfigurations.size,
      compliantAgents: compliant.length,
      averageQuality: totalQuality / Math.max(results.length, 1),
      criticalViolations: critical.length,
      enforcementRate: compliant.length / Math.max(results.length, 1)
    };
  }

  /**
   * Set memory coordinator
   */
  setMemoryCoordinator(coordinator: DualMemoryCoordinator): void {
    this.memoryCoordinator = coordinator;
  }

  /**
   * Shutdown enforcer
   */
  async shutdown(): Promise<void> {
    if (this.enforcementTimer) {
      clearInterval(this.enforcementTimer);
      this.enforcementTimer = null;
    }

    this.emit('enforcer:shutdown');
    this.initialized = false;
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: claude-md-enforcer-001
// inputs: ["GlobalPromptOptimizer.ts", "SystemWideValidator.ts", "ImpactMeasurement.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v1.0"}
// === END FOOTER ===
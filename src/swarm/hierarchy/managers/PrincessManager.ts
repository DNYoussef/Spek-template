/**
 * PrincessManager - Manages princess lifecycle, domains, and health monitoring
 * Handles spawning, destroying, domain assignment, and healing of princesses
 */

import { EventEmitter } from 'events';
import { HivePrincess } from '../HivePrincess';

interface PrincessConfig {
  id: string;
  type: 'development' | 'quality' | 'security' | 'research' | 'infrastructure' | 'coordination';
  model: string;
  agentCount: number;
  mcpServers: string[];
  maxContextSize: number;
}

export class PrincessManager extends EventEmitter {
  private princesses: Map<string, HivePrincess> = new Map();
  private princessConfigs: Map<string, PrincessConfig> = new Map();
  private readonly maxContextPerPrincess = 2 * 1024 * 1024; // 2MB

  constructor() {
    super();
  }

  /**
   * Initialize all princess instances
   */
  async initialize(): Promise<void> {
    console.log(' Initializing Princess Manager...');

    // Create princess configurations
    this.createPrincessConfigurations();

    // Initialize all princesses
    await this.initializePrincesses();

    console.log(' Princess Manager initialized');
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
        mcpServers: ['claude-flow', 'memory', 'github', 'playwright', 'figma', 'puppeteer'],
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
        const princess = new HivePrincess(
          id,
          config.model,
          config.agentCount
        );

        await princess.initialize();
        await this.configurePrincess(princess, config);

        this.princesses.set(id, princess);

        console.log(`   Princess ${id} initialized with ${config.agentCount} agents`);
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
    await princess.setModel(config.model);

    for (const server of config.mcpServers) {
      await princess.addMCPServer(server);
    }

    princess.setMaxContextSize(config.maxContextSize);
  }

  /**
   * Get a specific princess
   */
  getPrincess(princessId: string): HivePrincess | undefined {
    return this.princesses.get(princessId);
  }

  /**
   * Get all princesses
   */
  getPrincesses(): Map<string, HivePrincess> {
    return this.princesses;
  }

  /**
   * Monitor health of all princesses
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
  async healPrincess(princessId: string, error?: any): Promise<void> {
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
      console.error(` Failed to heal princess ${princessId}:`, healError);
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

    await princess.isolate();

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
    const candidates = Array.from(this.princesses.entries())
      .filter(([id, p]) => {
        const config = this.princessConfigs.get(id);
        return config && config.type !== failedType && p.isHealthy();
      });

    if (candidates.length === 0) {
      console.error(' No healthy princesses available for redistribution');
      return;
    }

    console.log(` Redistributing ${failedType} workload to ${candidates.length} princesses`);

    for (const [id, princess] of candidates) {
      await princess.increaseCapacity(20);
    }
  }

  /**
   * Verify integrity of all princesses
   */
  async verifyAllIntegrity(): Promise<Array<{ princess: string; integrity: number }>> {
    const verifications = Array.from(this.princesses.entries()).map(
      async ([id, princess]) => {
        const integrity = await princess.getContextIntegrity();
        return { princess: id, integrity };
      }
    );

    return await Promise.all(verifications);
  }

  /**
   * Get states of all princesses
   */
  async getPrincessStates(): Promise<any[]> {
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
   * Shutdown all princesses
   */
  async shutdownAll(): Promise<void> {
    console.log(' Shutting down all princesses...');

    await Promise.all(
      Array.from(this.princesses.values()).map(p => p.shutdown())
    );
  }
}
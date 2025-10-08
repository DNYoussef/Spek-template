/**
 * Chain builder for fallback protocols.
 * NASA Rule 10 compliant: modular chain construction.
 */
import { Logger } from '../../../utils/Logger';
import { FallbackChain } from '../FallbackChainManager';
import { ProtocolFactory } from '../factories/ProtocolFactory';

export class ChainBuilder {
  private readonly logger: Logger;
  private readonly protocolFactory: ProtocolFactory;

  constructor() {
    this.logger = new Logger('ChainBuilder');
    this.protocolFactory = new ProtocolFactory();
  }

  /**
   * Build fallback chain for migration.
   * NASA Rule 10 compliant: single responsibility, delegation.
   */
  async buildChain(
    sourceVersion: string,
    targetVersion: string,
    migrationStrategy: any
  ): Promise<FallbackChain> {
    this.logger.info('Building fallback chain', { sourceVersion, targetVersion });

    const chainId = `${sourceVersion}_to_${targetVersion}`;
    const protocols = await this.buildProtocolStack(sourceVersion, targetVersion);

    return {
      id: chainId,
      name: `Migration fallback chain: ${sourceVersion} -> ${targetVersion}`,
      protocols,
      activationStrategy: this.createActivationStrategy(migrationStrategy),
      failoverPolicy: this.createFailoverPolicy(),
      monitoringConfig: this.createMonitoringConfig(),
      testSchedule: this.createTestSchedule()
    };
  }

  /**
   * Create emergency fallback chain.
   * NASA Rule 10 compliant: emergency protocol configuration.
   */
  async createEmergencyChain(): Promise<FallbackChain> {
    this.logger.info('Creating emergency fallback chain');

    const emergencyProtocol = await this.protocolFactory.createEmergencyProtocol();

    return {
      id: 'system_emergency',
      name: 'System Emergency Fallback Chain',
      protocols: [emergencyProtocol],
      activationStrategy: {
        type: 'cascade',
        parameters: { timeout: 10000 }
      },
      failoverPolicy: this.createEmergencyFailoverPolicy(),
      monitoringConfig: this.createEmergencyMonitoringConfig(),
      testSchedule: this.createEmergencyTestSchedule()
    };
  }

  /**
   * Build protocol stack for chain.
   * NASA Rule 10 compliant: protocol ordering and creation.
   */
  private async buildProtocolStack(
    sourceVersion: string,
    targetVersion: string
  ): Promise<any[]> {
    const protocols = [];

    // Primary protocol (target version)
    protocols.push(
      await this.protocolFactory.createPrimaryProtocol(targetVersion)
    );

    // Secondary protocol (source version with compatibility)
    protocols.push(
      await this.protocolFactory.createSecondaryProtocol(sourceVersion, targetVersion)
    );

    // Tertiary protocol (minimal functionality)
    protocols.push(
      await this.protocolFactory.createTertiaryProtocol()
    );

    // Emergency protocol (offline mode)
    protocols.push(
      await this.protocolFactory.createEmergencyProtocol()
    );

    return protocols;
  }

  /**
   * Create activation strategy.
   * NASA Rule 10 compliant: strategy configuration.
   */
  private createActivationStrategy(migrationStrategy: any): any {
    return {
      type: 'cascade',
      parameters: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        riskLevel: migrationStrategy?.riskLevel || 'medium'
      }
    };
  }

  /**
   * Create failover policy.
   * NASA Rule 10 compliant: policy configuration.
   */
  private createFailoverPolicy(): any {
    return {
      automaticFailover: true,
      failbackPolicy: {
        automatic: false,
        requiresApproval: true,
        healthThreshold: 95
      },
      notificationConfig: {
        channels: ['email', 'slack', 'webhook'],
        escalation: true
      },
      escalationProcedure: {
        levels: [
          { title: 'Technical Team', timeoutMinutes: 15 },
          { title: 'Engineering Manager', timeoutMinutes: 30 },
          { title: 'CTO', timeoutMinutes: 60 }
        ]
      }
    };
  }

  /**
   * Create monitoring configuration.
   * NASA Rule 10 compliant: monitoring setup.
   */
  private createMonitoringConfig(): any {
    return {
      healthCheckInterval: 30000,
      performanceThresholds: {
        maxLatency: 500,
        minThroughput: 1000,
        maxErrorRate: 1
      }
    };
  }

  /**
   * Create test schedule.
   * NASA Rule 10 compliant: test configuration.
   */
  private createTestSchedule(): any {
    return {
      interval: 86400000, // Daily
      comprehensive: false,
      maintenanceWindow: {
        start: '02:00',
        end: '04:00',
        timezone: 'UTC'
      }
    };
  }

  /**
   * Create emergency failover policy.
   */
  private createEmergencyFailoverPolicy(): any {
    return {
      automaticFailover: true,
      failbackPolicy: {
        automatic: false,
        requiresApproval: true,
        healthThreshold: 95
      },
      notificationConfig: {
        channels: ['email', 'sms', 'webhook'],
        escalation: true
      },
      escalationProcedure: {
        levels: [
          { title: 'DevOps Team', timeoutMinutes: 5 },
          { title: 'Engineering Lead', timeoutMinutes: 15 },
          { title: 'CTO', timeoutMinutes: 30 }
        ]
      }
    };
  }

  /**
   * Create emergency monitoring configuration.
   */
  private createEmergencyMonitoringConfig(): any {
    return {
      healthCheckInterval: 10000, // More frequent for emergency
      performanceThresholds: {
        maxLatency: 1000,
        minThroughput: 100,
        maxErrorRate: 5
      }
    };
  }

  /**
   * Create emergency test schedule.
   */
  private createEmergencyTestSchedule(): any {
    return {
      interval: 43200000, // Every 12 hours
      comprehensive: true,
      maintenanceWindow: {
        start: '01:00',
        end: '05:00',
        timezone: 'UTC'
      }
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fallback-fsm-refactor-004
// inputs: ["FallbackChainManager.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-agent-026"}
// === END FOOTER ===
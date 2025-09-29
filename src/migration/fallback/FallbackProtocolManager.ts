/**
 * FallbackProtocolManager - Protocol-Specific Management
 * NASA Rule 10 Compliant - Single responsibility for protocol operations
 * Extracted from FallbackChainManager to eliminate god object pattern
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { ProtocolFactory } from '../core/factories/ProtocolFactory';
import { ActivationValidator } from '../core/validators/ActivationValidator';
import { HealthMonitor } from '../core/monitoring/HealthMonitor';

export interface FallbackProtocol {
  id: string;
  name: string;
  priority: number;
  type: 'primary' | 'secondary' | 'tertiary' | 'emergency' | 'offline';
  activationCriteria: ActivationCriteria;
  configuration: ProtocolConfiguration;
  capabilities: ProtocolCapability[];
  limitations: ProtocolLimitation[];
  healthCheck: HealthCheckConfig;
  performance: PerformanceProfile;
  security: SecurityProfile;
  rollbackPolicy: RollbackPolicy;
}

export interface ActivationCriteria {
  conditions: ActivationCondition[];
  operator: 'AND' | 'OR';
  timeout: number;
  retryPolicy: RetryPolicy;
  manualOverride: boolean;
}

export interface FailoverResult {
  success: boolean;
  activatedProtocol: string;
  failoverTime: number;
  affectedSystems: string[];
  metrics: FailoverMetrics;
  rollbackPlan?: RollbackPlan;
}

export class FallbackProtocolManager extends EventEmitter {
  // NASA Rule 10: Fixed bounds
  private static readonly MAX_PROTOCOLS = 50;
  private static readonly MAX_ACTIVATION_RETRIES = 3;
  private static readonly ACTIVATION_TIMEOUT_MS = 30000;

  private readonly logger: Logger;
  private readonly protocolFactory: ProtocolFactory;
  private readonly activationValidator: ActivationValidator;
  private readonly healthMonitor: HealthMonitor;

  private readonly activeProtocols: Map<string, FallbackProtocol>;
  private readonly activationHistory: FallbackActivation[];

  constructor() {
    super();
    this.logger = new Logger('FallbackProtocolManager');
    this.protocolFactory = new ProtocolFactory();
    this.activationValidator = new ActivationValidator();
    this.healthMonitor = new HealthMonitor();
    this.activeProtocols = new Map();
    this.activationHistory = [];
  }

  /**
   * Register fallback protocol with validation
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async registerProtocol(protocol: FallbackProtocol): Promise<void> {
    if (!protocol) {
      throw new Error('Protocol is required for registration');
    }
    if (!protocol.id || typeof protocol.id !== 'string') {
      throw new Error('Protocol ID must be a non-empty string');
    }

    // NASA Rule 10: Fixed bound check
    if (this.activeProtocols.size >= FallbackProtocolManager.MAX_PROTOCOLS) {
      throw new Error(`Cannot register more than ${FallbackProtocolManager.MAX_PROTOCOLS} protocols`);
    }

    this.logger.info('Registering fallback protocol', { protocolId: protocol.id });

    // Validate protocol configuration
    const validationResult = await this.activationValidator.validateProtocol(protocol);
    if (!validationResult.isValid) {
      throw new Error(`Protocol validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Initialize health monitoring
    await this.healthMonitor.initializeProtocol(protocol);

    // Store protocol
    this.activeProtocols.set(protocol.id, protocol);

    this.emit('protocolRegistered', protocol);
  }

  /**
   * Activate protocol with bounded retry logic
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  async activateProtocol(
    protocolId: string,
    reason: string,
    context: ActivationContext = {}
  ): Promise<FailoverResult> {
    if (!protocolId || typeof protocolId !== 'string') {
      throw new Error('Protocol ID must be a non-empty string');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('Activation reason must be a non-empty string');
    }

    const protocol = this.getProtocolOrThrow(protocolId);

    // Create activation request
    const activationRequest = this.createActivationRequest(protocolId, reason, context);

    // Execute activation with bounded retries
    const result = await this.executeActivationWithRetries(protocol, activationRequest);

    // Record successful activation
    this.recordActivation(activationRequest);

    this.emit('protocolActivated', activationRequest, result);
    return result;
  }

  /**
   * Deactivate protocol gracefully
   * NASA Rule 10: ≤60 lines, graceful shutdown
   */
  async deactivateProtocol(
    protocolId: string,
    reason: string = 'Manual deactivation'
  ): Promise<void> {
    if (!protocolId || typeof protocolId !== 'string') {
      throw new Error('Protocol ID must be a non-empty string');
    }

    const protocol = this.getProtocolOrThrow(protocolId);

    this.logger.info('Deactivating fallback protocol', { protocolId, reason });

    try {
      // Execute deactivation through protocol factory
      await this.protocolFactory.deactivateProtocol(protocol);

      // Stop health monitoring
      await this.healthMonitor.stopMonitoring(protocol.id);

      this.emit('protocolDeactivated', { protocolId, reason, timestamp: new Date() });

    } catch (error) {
      this.logger.error('Protocol deactivation failed', {
        protocolId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get protocol status summary
   * NASA Rule 10: ≤60 lines, status aggregation
   */
  getProtocolStatus(protocolId?: string): Record<string, any> {
    if (protocolId) {
      if (!this.activeProtocols.has(protocolId)) {
        throw new Error(`Protocol not found: ${protocolId}`);
      }

      const protocol = this.activeProtocols.get(protocolId)!;
      return {
        protocolId: protocol.id,
        name: protocol.name,
        type: protocol.type,
        priority: protocol.priority,
        health: this.healthMonitor.getProtocolHealth(protocolId),
        activationCount: this.getActivationCount(protocolId)
      };
    }

    // Return summary of all protocols
    const protocolSummaries = new Map<string, any>();

    for (const [id, protocol] of this.activeProtocols) {
      protocolSummaries.set(id, {
        id: protocol.id,
        name: protocol.name,
        type: protocol.type,
        priority: protocol.priority,
        health: this.healthMonitor.getProtocolHealth(id)
      });
    }

    return {
      totalProtocols: this.activeProtocols.size,
      maxProtocols: FallbackProtocolManager.MAX_PROTOCOLS,
      protocols: Object.fromEntries(protocolSummaries),
      activationHistory: this.activationHistory.length
    };
  }

  /**
   * Execute protocol activation with bounded retries
   * NASA Rule 10: ≤60 lines, bounded retry logic
   */
  private async executeActivationWithRetries(
    protocol: FallbackProtocol,
    activation: FallbackActivation
  ): Promise<FailoverResult> {
    let lastError: Error | null = null;
    const startTime = Date.now();

    // NASA Rule 10: Fixed loop bounds
    for (let attempt = 1; attempt <= FallbackProtocolManager.MAX_ACTIVATION_RETRIES; attempt++) {
      try {
        // Validate activation through validator
        await this.activationValidator.validateActivation(protocol, activation);

        // Execute through protocol factory
        const result = await this.executeActivationWithTimeout(protocol, activation);

        // Start monitoring
        await this.healthMonitor.startMonitoring(protocol.id);

        const failoverTime = Date.now() - startTime;

        return {
          success: true,
          activatedProtocol: protocol.id,
          failoverTime,
          affectedSystems: result.affectedSystems,
          metrics: {
            activationTime: failoverTime,
            successRate: 100,
            errorCount: 0,
            performanceImpact: result.performanceImpact
          },
          rollbackPlan: result.rollbackPlan
        };

      } catch (error) {
        lastError = error as Error;

        if (attempt < FallbackProtocolManager.MAX_ACTIVATION_RETRIES) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const failoverTime = Date.now() - startTime;

    this.logger.error('Protocol activation failed after all retries', {
      protocolId: protocol.id,
      error: lastError?.message
    });

    return {
      success: false,
      activatedProtocol: protocol.id,
      failoverTime,
      affectedSystems: [],
      metrics: {
        activationTime: failoverTime,
        successRate: 0,
        errorCount: 1,
        performanceImpact: 0
      }
    };
  }

  /**
   * Execute activation with timeout protection
   * NASA Rule 10: ≤60 lines, timeout protection
   */
  private async executeActivationWithTimeout(
    protocol: FallbackProtocol,
    activation: FallbackActivation
  ): Promise<any> {
    const activationPromise = this.protocolFactory.activateProtocol(protocol, activation);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Protocol activation timeout')),
        FallbackProtocolManager.ACTIVATION_TIMEOUT_MS
      )
    );

    return Promise.race([activationPromise, timeoutPromise]);
  }

  // Helper methods with NASA Rule 10 compliance

  private getProtocolOrThrow(protocolId: string): FallbackProtocol {
    const protocol = this.activeProtocols.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }
    return protocol;
  }

  private createActivationRequest(
    protocolId: string,
    reason: string,
    context: ActivationContext
  ): FallbackActivation {
    return {
      chainId: context.chainId || 'manual',
      protocolId,
      reason,
      triggeredBy: {
        type: 'manual',
        source: 'FallbackProtocolManager',
        timestamp: new Date()
      },
      timestamp: new Date(),
      context
    };
  }

  private recordActivation(activation: FallbackActivation): void {
    this.activationHistory.push(activation);

    // Maintain history size bounds (NASA Rule 10 - fixed bounds)
    const maxHistorySize = 10000;
    if (this.activationHistory.length > maxHistorySize) {
      this.activationHistory.splice(0, this.activationHistory.length - maxHistorySize);
    }
  }

  private getActivationCount(protocolId: string): number {
    return this.activationHistory.filter(a => a.protocolId === protocolId).length;
  }
}

// Supporting interfaces
interface ActivationCondition {
  type: 'failure_rate' | 'latency' | 'availability' | 'error_threshold' | 'manual';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration: number;
}

interface ProtocolConfiguration {
  endpoint?: string;
  port?: number;
  timeout: TimeoutConfig;
}

interface ProtocolCapability {
  name: string;
  type: 'messaging' | 'streaming' | 'batch' | 'realtime' | 'offline';
  supported: boolean;
}

interface ProtocolLimitation {
  type: 'throughput' | 'latency' | 'size' | 'duration' | 'feature';
  description: string;
  value?: number;
}

interface HealthCheckConfig {
  interval: number;
  timeout: number;
  endpoint: string;
  expectedResponse: any;
}

interface PerformanceProfile {
  latency: { average: number; p95: number; p99: number };
  throughput: { requestsPerSecond: number; bytesPerSecond: number };
}

interface SecurityProfile {
  encryptionStrength: 'weak' | 'medium' | 'strong' | 'military';
  authenticationRequired: boolean;
  auditLogging: boolean;
}

interface RollbackPolicy {
  automatic: boolean;
  conditions: Array<{ metric: string; threshold: number; duration: number }>;
}

interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

interface TimeoutConfig {
  connection: number;
  request: number;
  idle: number;
}

interface FallbackActivation {
  chainId: string;
  protocolId: string;
  reason: string;
  triggeredBy: ActivationTrigger;
  timestamp: Date;
  context: ActivationContext;
}

interface ActivationTrigger {
  type: string;
  source: string;
  timestamp: Date;
}

interface ActivationContext {
  chainId?: string;
  migrationId?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

interface FailoverMetrics {
  activationTime: number;
  successRate: number;
  errorCount: number;
  performanceImpact: number;
}

interface RollbackPlan {
  steps: string[];
  estimatedTime: number;
}

export default FallbackProtocolManager;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent079-fallback-protocol-decomposition
// inputs: ["src/migration/core/FallbackChainManager.ts"]
// tools_used: ["Read", "Write", "Bash"]
// versions: {"model":"sonnet-4","fsm-design":"1.0.0"}
// === END FOOTER ===
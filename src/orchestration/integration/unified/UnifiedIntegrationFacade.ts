/**
 * MEGA SWARM AGENT 100: INTEGRATION SYSTEM KILLER
 * Unified Integration Facade - Eliminates All Integration God Objects
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loops
 * FSM-First Design: Single entry point for all integration operations
 */

import { EventEmitter } from 'events';
import { IntegrationHub } from './IntegrationHub';
import { IntegrationValidator } from './IntegrationValidator';
import { AdapterFactory } from './AdapterFactory';
import { IntegrationMonitor } from './IntegrationMonitor';
import {
  IntegrationState,
  IntegrationEvent,
  IntegrationContract,
  IntegrationContext,
  ValidationResult
} from './IntegrationFSMCore';

/**
 * Unified Integration Facade
 * Replaces all integration god objects with unified FSM approach
 */
export class UnifiedIntegrationFacade extends EventEmitter {
  private hub: IntegrationHub;
  private validator: IntegrationValidator;
  private adapterFactory: AdapterFactory;
  private monitor: IntegrationMonitor;

  constructor() {
    super();
    this.hub = new IntegrationHub();
    this.validator = new IntegrationValidator();
    this.adapterFactory = new AdapterFactory();
    this.monitor = new IntegrationMonitor();

    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from components (NASA Rule 10: ≤60 lines)
   */
  private setupEventForwarding(): void {
    // Forward hub events
    this.hub.on('contract:registered', (event) => this.emit('contract:registered', event));
    this.hub.on('integration:initialized', (event) => this.emit('integration:initialized', event));
    this.hub.on('transition:completed', (event) => this.emit('transition:completed', event));
    this.hub.on('integration:completed', (event) => this.emit('integration:completed', event));

    // Forward monitor events
    this.monitor.on('health:checked', (event) => this.emit('health:checked', event));
    this.monitor.on('alert:triggered', (event) => this.emit('alert:triggered', event));
    this.monitor.on('monitoring:started', (event) => this.emit('monitoring:started', event));
  }

  /**
   * Register integration contract (NASA Rule 10: ≤60 lines)
   */
  public registerContract(contract: IntegrationContract): void {
    this.hub.registerContract(contract);
    this.emit('facade:contract_registered', { contractId: contract.id, type: contract.type });
  }

  /**
   * Initialize integration (NASA Rule 10: ≤60 lines)
   */
  public async initializeIntegration(
    contractId: string,
    initialData: Record<string, any> = {}
  ): Promise<string> {
    const integrationId = this.hub.initializeIntegration(contractId, initialData);
    const context = this.hub.getContext(integrationId);

    if (context) {
      // Start monitoring if enabled
      if (context.contract.monitoring.healthCheck) {
        this.monitor.startMonitoring(integrationId, context.contract, context);
      }

      // Create adapter
      const adapter = this.adapterFactory.createAdapter(contractId, context.contract);
      this.adapterFactory.registerAdapter(adapter);

      // Validate and transition to connecting
      const validationResult = await this.validator.validateContract(context.contract, context);
      if (validationResult.passed) {
        this.hub.transition(integrationId, IntegrationEvent.CONNECTION_ESTABLISHED);
      } else {
        this.hub.handleError(integrationId, new Error('Contract validation failed'));
      }
    }

    return integrationId;
  }

  /**
   * Execute integration operation (NASA Rule 10: ≤60 lines)
   */
  public async executeOperation(
    integrationId: string,
    operation: string,
    data: any
  ): Promise<any> {
    const context = this.hub.getContext(integrationId);
    if (!context) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const adapter = this.adapterFactory.getAdapter(context.contract.id);
    if (!adapter) {
      throw new Error(`Adapter not found for integration: ${integrationId}`);
    }

    try {
      // Transition to integrating state
      this.hub.transition(integrationId, IntegrationEvent.INTEGRATION_STARTED);

      // Execute operation
      const result = await adapter.execute(operation, data);

      // Transition to verifying state
      this.hub.transition(integrationId, IntegrationEvent.INTEGRATION_COMPLETED);

      // Verify result
      const verificationResult = await this.verifyResult(result, context);
      if (verificationResult.passed) {
        this.hub.transition(integrationId, IntegrationEvent.VERIFICATION_PASSED);
        this.hub.completeIntegration(integrationId);
      } else {
        this.hub.transition(integrationId, IntegrationEvent.VERIFICATION_FAILED);
      }

      return result;

    } catch (error) {
      this.hub.handleError(integrationId, error);
      throw error;
    }
  }

  /**
   * Verify operation result (NASA Rule 10: ≤60 lines)
   */
  private async verifyResult(result: any, context: IntegrationContext): Promise<ValidationResult> {
    // Basic verification logic
    if (!result || typeof result !== 'object') {
      return {
        passed: false,
        errors: ['Invalid result format'],
        warnings: []
      };
    }

    if (result.error) {
      return {
        passed: false,
        errors: [result.error],
        warnings: []
      };
    }

    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Get integration status (NASA Rule 10: ≤60 lines)
   */
  public getIntegrationStatus(integrationId: string): {
    state: IntegrationState | null;
    health: any;
    metrics: Record<string, number>;
    adapter: any;
  } {
    const state = this.hub.getState(integrationId);
    const health = this.monitor.getHealthStatus(integrationId);
    const metrics = this.hub.getMetrics(integrationId);
    const context = this.hub.getContext(integrationId);
    const adapter = context ? this.adapterFactory.getAdapter(context.contract.id) : null;

    return {
      state,
      health,
      metrics,
      adapter: adapter ? adapter.getStatus() : null
    };
  }

  /**
   * Get all integration statuses (NASA Rule 10: ≤60 lines)
   */
  public getAllIntegrationStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    const activeIntegrations = this.hub.getActiveIntegrations();

    // Fixed iteration bound (NASA Rule 10)
    for (let i = 0; i < Math.min(activeIntegrations.length, 100); i++) {
      const integrationId = activeIntegrations[i];
      statuses[integrationId] = this.getIntegrationStatus(integrationId);
    }

    return statuses;
  }

  /**
   * Stop integration (NASA Rule 10: ≤60 lines)
   */
  public async stopIntegration(integrationId: string): Promise<boolean> {
    try {
      const context = this.hub.getContext(integrationId);
      if (context) {
        // Stop monitoring
        this.monitor.stopMonitoring(integrationId);

        // Disconnect adapter
        const adapter = this.adapterFactory.getAdapter(context.contract.id);
        if (adapter) {
          await adapter.disconnect();
          await this.adapterFactory.removeAdapter(context.contract.id);
        }

        // Complete integration
        this.hub.completeIntegration(integrationId);
      }

      this.emit('facade:integration_stopped', { integrationId });
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('facade:stop_error', { integrationId, error: errorMessage });
      return false;
    }
  }

  /**
   * Cleanup completed integrations (NASA Rule 10: ≤60 lines)
   */
  public destroy(): { hubCleaned: number; monitoringStats: any } {
    const hubCleaned = this.hub.cleanup();
    const monitoringStats = this.monitor.getMonitoringStats();

    this.emit('facade:cleanup_completed', { hubCleaned, monitoringStats });

    return {
      hubCleaned,
      monitoringStats
    };
  }

  /**
   * Validate integration health (NASA Rule 10: ≤60 lines)
   */
  public async validateHealth(): Promise<ValidationResult> {
    const allStatuses = this.getAllIntegrationStatuses();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check each integration health (fixed bound)
    const integrationIds = Object.keys(allStatuses).slice(0, 50);
    for (const integrationId of integrationIds) {
      const status = allStatuses[integrationId];

      if (status.state === IntegrationState.ERROR) {
        errors.push(`Integration ${integrationId} is in error state`);
      }

      if (status.health && status.health.status === 'critical') {
        errors.push(`Integration ${integrationId} has critical health issues`);
      }

      if (status.health && status.health.status === 'degraded') {
        warnings.push(`Integration ${integrationId} has degraded performance`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        totalIntegrations: integrationIds.length,
        validatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get comprehensive system status (NASA Rule 10: ≤60 lines)
   */
  public getSystemStatus(): {
    facade: string;
    integrations: Record<string, any>;
    monitoring: any;
    validation: ValidationResult | null;
  } {
    return {
      facade: 'operational',
      integrations: this.getAllIntegrationStatuses(),
      monitoring: this.monitor.getMonitoringStats(),
      validation: null // Would be populated by validateHealth()
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
// run_id: integration-killer-006
// inputs: ["IntegrationHub.ts", "IntegrationValidator.ts", "AdapterFactory.ts", "IntegrationMonitor.ts"]
// tools_used: ["Write"]
// versions: {"model":"mega-swarm-100","prompt":"integration-elimination-v1"}
// === END FOOTER ===
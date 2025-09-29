/**
 * MEGA SWARM AGENT 100: INTEGRATION SYSTEM KILLER
 * Integration Hub - Centralized Transition Management
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loops
 * FSM-First Design: Single source of truth for all integration state transitions
 */

import { EventEmitter } from 'events';
import {
  IntegrationState,
  IntegrationEvent,
  IntegrationContext,
  IntegrationContract,
  INTEGRATION_TRANSITIONS,
  MAX_RETRY_ATTEMPTS
} from './IntegrationFSMCore';

/**
 * Centralized Integration State Machine Hub
 * Manages all integration transitions with contract enforcement
 */
export class IntegrationHub extends EventEmitter {
  private contexts: Map<string, IntegrationContext> = new Map();
  private contracts: Map<string, IntegrationContract> = new Map();

  /**
   * Register integration contract (NASA Rule 10: ≤60 lines)
   */
  public registerContract(contract: IntegrationContract): void {
    if (!contract.id || !contract.type) {
      throw new Error('Contract must have valid id and type');
    }

    // Validate contract requirements (fixed loop bound)
    for (let i = 0; i < Math.min(contract.requirements.length, 50); i++) {
      const req = contract.requirements[i];
      if (!req.name || !req.validation) {
        throw new Error(`Invalid requirement at index ${i}`);
      }
    }

    this.contracts.set(contract.id, contract);
    this.emit('contract:registered', { contractId: contract.id, type: contract.type });
  }

  /**
   * Initialize integration context (NASA Rule 10: ≤60 lines)
   */
  public initializeIntegration(contractId: string, initialData: Record<string, any> = {}): string {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    const integrationId = `${contractId}_${Date.now()}`;
    const context: IntegrationContext = {
      contract,
      currentState: IntegrationState.CONNECTING,
      data: { ...initialData },
      errors: [],
      attempts: 0,
      startTime: new Date(),
      metrics: {}
    };

    this.contexts.set(integrationId, context);
    this.emit('integration:initialized', { integrationId, contractId });

    return integrationId;
  }

  /**
   * Execute state transition with validation (NASA Rule 10: ≤60 lines)
   */
  public transition(integrationId: string, event: IntegrationEvent, data?: Record<string, any>): boolean {
    const context = this.contexts.get(integrationId);
    if (!context) {
      throw new Error(`Integration context not found: ${integrationId}`);
    }

    const currentState = context.currentState;
    const nextState = INTEGRATION_TRANSITIONS[currentState][event];

    if (nextState === null) {
      this.emit('transition:invalid', { integrationId, currentState, event });
      return false;
    }

    if (nextState === undefined) {
      throw new Error(`Invalid transition: ${currentState} -> ${event}`);
    }

    // Update context
    context.currentState = nextState;
    if (data) {
      Object.assign(context.data, data);
    }

    this.emit('transition:completed', {
      integrationId,
      from: currentState,
      to: nextState,
      event
    });

    return true;
  }

  /**
   * Get current state (NASA Rule 10: ≤60 lines)
   */
  public getState(integrationId: string): IntegrationState | null {
    const context = this.contexts.get(integrationId);
    return context ? context.currentState : null;
  }

  /**
   * Get integration context (NASA Rule 10: ≤60 lines)
   */
  public getContext(integrationId: string): IntegrationContext | null {
    return this.contexts.get(integrationId) || null;
  }

  /**
   * Handle integration error with retry logic (NASA Rule 10: ≤60 lines)
   */
  public handleError(integrationId: string, error: Error): boolean {
    const context = this.contexts.get(integrationId);
    if (!context) {
      throw new Error(`Integration context not found: ${integrationId}`);
    }

    context.errors.push(error);
    context.attempts++;

    // Fixed retry bounds (NASA Rule 10)
    if (context.attempts < MAX_RETRY_ATTEMPTS) {
      this.emit('error:retry', { integrationId, attempt: context.attempts, error: error.message });
      return this.transition(integrationId, IntegrationEvent.RETRY_REQUESTED);
    } else {
      this.emit('error:max_retries', { integrationId, attempts: context.attempts });
      return this.transition(integrationId, IntegrationEvent.ERROR_OCCURRED);
    }
  }

  /**
   * Complete integration cleanup (NASA Rule 10: ≤60 lines)
   */
  public completeIntegration(integrationId: string): void {
    const context = this.contexts.get(integrationId);
    if (!context) {
      return;
    }

    const duration = Date.now() - context.startTime.getTime();
    this.emit('integration:completed', {
      integrationId,
      duration,
      attempts: context.attempts,
      state: context.currentState
    });

    // Keep context for audit trail but mark as complete
    context.data.__completed = true;
    context.data.__duration = duration;
  }

  /**
   * Get integration metrics (NASA Rule 10: ≤60 lines)
   */
  public getMetrics(integrationId: string): Record<string, number> {
    const context = this.contexts.get(integrationId);
    if (!context) {
      return {};
    }

    const now = Date.now();
    const duration = now - context.startTime.getTime();

    return {
      duration,
      attempts: context.attempts,
      errors: context.errors.length,
      state_transitions: Object.keys(context.data).filter(k => k.startsWith('__transition_')).length,
      ...context.metrics
    };
  }

  /**
   * Cleanup completed integrations (NASA Rule 10: ≤60 lines)
   */
  public cleanup(): number {
    let cleaned = 0;
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Fixed iteration bound (NASA Rule 10)
    const entries = Array.from(this.contexts.entries()).slice(0, 1000);
    for (const [id, context] of entries) {
      if (context.data.__completed && context.startTime.getTime() < cutoff) {
        this.contexts.delete(id);
        cleaned++;
      }
    }

    this.emit('cleanup:completed', { cleaned });
    return cleaned;
  }

  /**
   * Get all active integrations (NASA Rule 10: ≤60 lines)
   */
  public getActiveIntegrations(): string[] {
    const active: string[] = [];

    // Fixed iteration bound (NASA Rule 10)
    const entries = Array.from(this.contexts.entries()).slice(0, 1000);
    for (const [id, context] of entries) {
      if (!context.data.__completed) {
        active.push(id);
      }
    }

    return active;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: integration-killer-002
// inputs: ["IntegrationFSMCore.ts"]
// tools_used: ["Write"]
// versions: {"model":"mega-swarm-100","prompt":"integration-elimination-v1"}
// === END FOOTER ===
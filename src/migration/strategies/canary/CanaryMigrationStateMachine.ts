/**
 * Canary Migration State Machine
 * Implements FSM-based canary deployment with strict state management
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/Logger';
import {
  CanaryMigrationStates,
  CanaryMigrationEvents,
  CanaryMigrationContext,
  StateTransition
} from './CanaryMigrationStates';

export class CanaryMigrationStateMachine extends EventEmitter {
  private logger: Logger;
  private currentState: CanaryMigrationStates;
  private context: CanaryMigrationContext;
  private transitions: Map<string, StateTransition>;

  constructor(initialContext: Partial<CanaryMigrationContext>) {
    super();
    this.logger = new Logger('CanaryMigrationStateMachine');
    this.currentState = CanaryMigrationStates.IDLE;
    this.context = this.initializeContext(initialContext);
    this.transitions = this.buildTransitionMap();
  }

  async processEvent(event: CanaryMigrationEvents, data?: any): Promise<boolean> {
    const transitionKey = `${this.currentState}:${event}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      this.logger.warn('Invalid transition', {
        from: this.currentState,
        event,
        availableTransitions: this.getAvailableTransitions()
      });
      return false;
    }

    // Apply guard condition if present
    if (transition.guard && !transition.guard(this.context)) {
      this.logger.warn('Transition guard failed', {
        from: this.currentState,
        event,
        to: transition.to
      });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = transition.to;

    // Update context with event data
    if (data) {
      Object.assign(this.context, data);
    }

    this.logger.info('State transition', {
      from: previousState,
      to: this.currentState,
      event
    });

    // Execute transition action if present
    if (transition.action) {
      try {
        await transition.action(this.context);
      } catch (error) {
        this.logger.error('Transition action failed', {
          transition: transitionKey,
          error: error.message
        });
        // Trigger error handling
        await this.processEvent(CanaryMigrationEvents.ERROR_OCCURRED, { error });
        return false;
      }
    }

    this.emit('stateChanged', {
      from: previousState,
      to: this.currentState,
      event,
      context: this.context
    });

    return true;
  }

  getCurrentState(): CanaryMigrationStates {
    return this.currentState;
  }

  getContext(): CanaryMigrationContext {
    return { ...this.context };
  }

  updateContext(updates: Partial<CanaryMigrationContext>): void {
    Object.assign(this.context, updates);
  }

  getAvailableTransitions(): CanaryMigrationEvents[] {
    const available: CanaryMigrationEvents[] = [];
    for (const [key, transition] of this.transitions) {
      if (transition.from === this.currentState) {
        available.push(transition.event);
      }
    }
    return available;
  }

  private initializeContext(initial: Partial<CanaryMigrationContext>): CanaryMigrationContext {
    return {
      deploymentId: initial.deploymentId || '',
      sourceVersion: initial.sourceVersion || '',
      targetVersion: initial.targetVersion || '',
      currentStage: initial.currentStage || 0,
      totalStages: initial.totalStages || 0,
      trafficPercentage: initial.trafficPercentage || 0,
      config: initial.config || {},
      stageResults: initial.stageResults || [],
      metrics: initial.metrics || {},
      ...initial
    };
  }

  private buildTransitionMap(): Map<string, StateTransition> {
    const transitions: StateTransition[] = [
      // Start migration
      {
        from: CanaryMigrationStates.IDLE,
        event: CanaryMigrationEvents.START_MIGRATION,
        to: CanaryMigrationStates.PREPARING
      },
      // Deploy canary
      {
        from: CanaryMigrationStates.PREPARING,
        event: CanaryMigrationEvents.CANARY_DEPLOYED,
        to: CanaryMigrationStates.DEPLOYING_CANARY
      },
      // Initialize traffic
      {
        from: CanaryMigrationStates.DEPLOYING_CANARY,
        event: CanaryMigrationEvents.TRAFFIC_INITIALIZED,
        to: CanaryMigrationStates.INITIALIZING_TRAFFIC
      },
      // Start progressive rollout
      {
        from: CanaryMigrationStates.INITIALIZING_TRAFFIC,
        event: CanaryMigrationEvents.STAGE_STARTED,
        to: CanaryMigrationStates.PROGRESSIVE_ROLLOUT
      },
      // Stage monitoring
      {
        from: CanaryMigrationStates.PROGRESSIVE_ROLLOUT,
        event: CanaryMigrationEvents.STAGE_STARTED,
        to: CanaryMigrationStates.STAGE_MONITORING
      },
      // Stage validation
      {
        from: CanaryMigrationStates.STAGE_MONITORING,
        event: CanaryMigrationEvents.VALIDATION_PASSED,
        to: CanaryMigrationStates.STAGE_VALIDATION
      },
      // Continue or complete stages
      {
        from: CanaryMigrationStates.STAGE_VALIDATION,
        event: CanaryMigrationEvents.STAGE_PASSED,
        to: CanaryMigrationStates.PROGRESSIVE_ROLLOUT,
        guard: (ctx) => ctx.currentStage < ctx.totalStages
      },
      {
        from: CanaryMigrationStates.STAGE_VALIDATION,
        event: CanaryMigrationEvents.FINAL_ROLLOUT_READY,
        to: CanaryMigrationStates.FINAL_ROLLOUT,
        guard: (ctx) => ctx.currentStage >= ctx.totalStages
      },
      // Final rollout and promotion
      {
        from: CanaryMigrationStates.FINAL_ROLLOUT,
        event: CanaryMigrationEvents.PROMOTION_COMPLETED,
        to: CanaryMigrationStates.PROMOTION
      },
      // Complete migration
      {
        from: CanaryMigrationStates.PROMOTION,
        event: CanaryMigrationEvents.MIGRATION_COMPLETED,
        to: CanaryMigrationStates.COMPLETED
      },
      // Pause/Resume
      {
        from: CanaryMigrationStates.PROGRESSIVE_ROLLOUT,
        event: CanaryMigrationEvents.PAUSE_REQUESTED,
        to: CanaryMigrationStates.PAUSED
      },
      {
        from: CanaryMigrationStates.PAUSED,
        event: CanaryMigrationEvents.RESUME_REQUESTED,
        to: CanaryMigrationStates.PROGRESSIVE_ROLLOUT
      },
      // Rollback transitions
      {
        from: CanaryMigrationStates.STAGE_MONITORING,
        event: CanaryMigrationEvents.ROLLBACK_TRIGGERED,
        to: CanaryMigrationStates.ROLLING_BACK
      },
      {
        from: CanaryMigrationStates.STAGE_VALIDATION,
        event: CanaryMigrationEvents.ROLLBACK_TRIGGERED,
        to: CanaryMigrationStates.ROLLING_BACK
      },
      {
        from: CanaryMigrationStates.PROGRESSIVE_ROLLOUT,
        event: CanaryMigrationEvents.ROLLBACK_TRIGGERED,
        to: CanaryMigrationStates.ROLLING_BACK
      },
      {
        from: CanaryMigrationStates.ROLLING_BACK,
        event: CanaryMigrationEvents.ROLLBACK_COMPLETED,
        to: CanaryMigrationStates.ROLLED_BACK
      },
      {
        from: CanaryMigrationStates.ROLLING_BACK,
        event: CanaryMigrationEvents.ROLLBACK_FAILED,
        to: CanaryMigrationStates.ROLLBACK_FAILED
      },
      // Error handling
      {
        from: CanaryMigrationStates.STAGE_MONITORING,
        event: CanaryMigrationEvents.ERROR_OCCURRED,
        to: CanaryMigrationStates.FAILED
      },
      {
        from: CanaryMigrationStates.STAGE_VALIDATION,
        event: CanaryMigrationEvents.ERROR_OCCURRED,
        to: CanaryMigrationStates.FAILED
      },
      // Cleanup transitions
      {
        from: CanaryMigrationStates.COMPLETED,
        event: CanaryMigrationEvents.CLEANUP_COMPLETED,
        to: CanaryMigrationStates.CLEANUP
      },
      {
        from: CanaryMigrationStates.ROLLED_BACK,
        event: CanaryMigrationEvents.CLEANUP_COMPLETED,
        to: CanaryMigrationStates.CLEANUP
      }
    ];

    const transitionMap = new Map<string, StateTransition>();
    for (const transition of transitions) {
      const key = `${transition.from}:${transition.event}`;
      transitionMap.set(key, transition);
    }

    return transitionMap;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-agent-048-fsm-machine
// inputs: ["none"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-048-v1"}
// === END FOOTER ===
/**
 * Backward Compatibility Manager State Machine - FSM Controller
 * NASA Rule 10 compliant with migration lifecycle management
 */

import { EventEmitter } from 'events';
import { CompatibilityStates, CompatibilityEvents, CompatibilityContext } from './types/CompatibilityTypes';
import { LegacyLoaderStateHandler } from './states/LegacyLoaderStateHandler';
import { MigrationStateHandler } from './states/MigrationStateHandler';
import { ValidationStateHandler } from './states/ValidationStateHandler';
import { CompatibilityErrorHandler } from './core/CompatibilityErrorHandler';
import { CompatibilityTransitionGuard } from './core/CompatibilityTransitionGuard';

export class CompatibilityManagerFSM extends EventEmitter {
  private currentState: CompatibilityStates = CompatibilityStates.IDLE;
  private context: CompatibilityContext;
  private stateHandlers: Map<CompatibilityStates, any> = new Map();
  private errorHandler: CompatibilityErrorHandler;
  private transitionGuard: CompatibilityTransitionGuard;

  constructor() {
    super();

    this.context = {
      legacyDetectorConfig: null,
      legacyAnalysisConfig: null,
      migrationMappings: [],
      migrationResult: null,
      validationResult: null,
      compatibilityStatus: {
        legacyConfigsLoaded: false,
        detectorConfigValid: false,
        analysisConfigValid: false,
        migrationMappingsCount: 0
      }
    };

    this.initializeStateHandlers();
    this.errorHandler = new CompatibilityErrorHandler();
    this.transitionGuard = new CompatibilityTransitionGuard();
    this.initializeMigrationMappings();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(CompatibilityStates.IDLE, null);
    this.stateHandlers.set(CompatibilityStates.LOADING_LEGACY, new LegacyLoaderStateHandler());
    this.stateHandlers.set(CompatibilityStates.MIGRATING, new MigrationStateHandler());
    this.stateHandlers.set(CompatibilityStates.VALIDATING, new ValidationStateHandler());
    this.stateHandlers.set(CompatibilityStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(CompatibilityStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: CompatibilityEvents, data?: any): Promise<boolean> {
    // Assertion 1: Valid event provided
    if (!event || typeof event !== 'string') {
      throw new Error('Invalid event provided for transition');
    }

    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

    // Assertion 2: Transition guard allows transition
    if (!this.transitionGuard.canTransition(this.currentState, targetState, this.context)) {
      this.emit('transition:blocked', { from: this.currentState, to: targetState, event });
      return false;
    }

    try {
      // Exit current state
      await this.exitState(this.currentState);

      // Transition
      const previousState = this.currentState;
      this.currentState = targetState;

      // Enter new state
      await this.enterState(targetState, data);

      this.emit('transition:completed', { from: previousState, to: targetState, event });
      return true;

    } catch (error) {
      await this.handleTransitionError(error, event, data);
      return false;
    }
  }

  /**
   * Get target state for event (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getTargetState(currentState: CompatibilityStates, event: CompatibilityEvents): CompatibilityStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<CompatibilityStates, Partial<Record<CompatibilityEvents, CompatibilityStates>>> = {
      [CompatibilityStates.IDLE]: {
        [CompatibilityEvents.LOAD_LEGACY]: CompatibilityStates.LOADING_LEGACY,
        [CompatibilityEvents.VALIDATE_COMPATIBILITY]: CompatibilityStates.VALIDATING
      },
      [CompatibilityStates.LOADING_LEGACY]: {
        [CompatibilityEvents.CONFIGS_LOADED]: CompatibilityStates.MIGRATING,
        [CompatibilityEvents.ERROR]: CompatibilityStates.ERROR
      },
      [CompatibilityStates.MIGRATING]: {
        [CompatibilityEvents.MIGRATION_COMPLETE]: CompatibilityStates.VALIDATING,
        [CompatibilityEvents.ERROR]: CompatibilityStates.ERROR
      },
      [CompatibilityStates.VALIDATING]: {
        [CompatibilityEvents.VALIDATION_COMPLETE]: CompatibilityStates.IDLE,
        [CompatibilityEvents.ERROR]: CompatibilityStates.ERROR
      },
      [CompatibilityStates.ERROR]: {
        [CompatibilityEvents.RESET]: CompatibilityStates.IDLE
      }
    };

    // Assertion 2: Transitions exist for current state
    const stateTransitions = transitions[currentState];
    if (!stateTransitions) {
      return null;
    }

    return stateTransitions[event] || null;
  }

  /**
   * Initialize migration mappings (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeMigrationMappings(): void {
    // Assertion 1: Context exists
    if (!this.context) {
      throw new Error('Context must be initialized');
    }

    this.context.migrationMappings = [
      // Analysis configuration mappings
      {
        legacyPath: 'analysis.max_file_size_mb',
        enterprisePath: 'performance.resource_limits.max_file_size_mb'
      },
      {
        legacyPath: 'analysis.parallel_workers',
        enterprisePath: 'performance.scaling.max_workers'
      },
      {
        legacyPath: 'quality_gates.overall_quality_threshold',
        enterprisePath: 'governance.quality_gates.custom_gates.overall_threshold'
      },
      {
        legacyPath: 'god_object_detector.method_threshold',
        enterprisePath: 'governance.quality_gates.custom_gates.god_object_method_threshold'
      }
    ];

    // Assertion 2: Mappings were initialized
    if (this.context.migrationMappings.length === 0) {
      throw new Error('Migration mappings must be initialized');
    }

    this.context.compatibilityStatus.migrationMappingsCount = this.context.migrationMappings.length;
  }

  /**
   * Public API methods
   */
  async loadLegacyConfigs(detectorConfigPath?: string, analysisConfigPath?: string): Promise<any> {
    const success = await this.transition(CompatibilityEvents.LOAD_LEGACY, {
      detectorConfigPath,
      analysisConfigPath
    });

    return {
      detector: this.context.legacyDetectorConfig,
      analysis: this.context.legacyAnalysisConfig
    };
  }

  async migrateLegacyConfig(legacyConfigs: any, conflictResolution: string = 'merge'): Promise<any> {
    const success = await this.transition(CompatibilityEvents.CONFIGS_LOADED, {
      legacyConfigs,
      conflictResolution
    });

    return this.context.migrationResult;
  }

  async validateBackwardCompatibility(enterpriseConfig: any, legacyConfigPaths: any): Promise<any> {
    const success = await this.transition(CompatibilityEvents.VALIDATE_COMPATIBILITY, {
      enterpriseConfig,
      legacyConfigPaths
    });

    return this.context.validationResult;
  }

  getCurrentState(): CompatibilityStates {
    return this.currentState;
  }

  getContext(): CompatibilityContext {
    return { ...this.context };
  }

  getMigrationStatus(): any {
    return this.context.compatibilityStatus;
  }

  // State management helpers
  private async exitState(state: CompatibilityStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: CompatibilityStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: CompatibilityEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = CompatibilityStates.ERROR;
    await this.enterState(CompatibilityStates.ERROR, { error, event, data });
  }
}
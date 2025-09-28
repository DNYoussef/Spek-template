/**
 * ConfigStateMachine - Unified Configuration Lifecycle Management
 * Eliminates configuration god objects through FSM-based state management
 *
 * States: LOADING -> VALIDATING -> MERGING -> WATCHING -> RELOADING
 * Events: load, validate, merge, watch, reload, error, reset
 *
 * NASA Rule 10: ≤60 line functions, bounded configuration size
 * FSM-First: Configuration lifecycle through explicit state transitions
 */

import { ConfigTransitionHub } from './ConfigTransitionHub';
import { ConfigLoader } from '../components/ConfigLoader';
import { ConfigValidator } from '../components/ConfigValidator';
import { ConfigMerger } from '../components/ConfigMerger';
import { ConfigWatcher } from '../components/ConfigWatcher';
import { ConfigState, ConfigEvent, ConfigContext } from '../types/ConfigTypes';

export class ConfigStateMachine {
    private transitionHub: ConfigTransitionHub;
    private loader: ConfigLoader;
    private validator: ConfigValidator;
    private merger: ConfigMerger;
    private watcher: ConfigWatcher;
    private context: ConfigContext;

    constructor() {
        this.transitionHub = new ConfigTransitionHub();
        this.loader = new ConfigLoader();
        this.validator = new ConfigValidator();
        this.merger = new ConfigMerger();
        this.watcher = new ConfigWatcher();
        this.context = {
            currentState: ConfigState.IDLE,
            config: null,
            sources: [],
            errors: [],
            watchers: new Map()
        };

        this.setupTransitions();
    }

    /**
     * Setup FSM transitions - NASA Rule 10: ≤60 lines
     */
    private setupTransitions(): void {
        // IDLE -> LOADING
        this.transitionHub.addTransition(
            ConfigState.IDLE,
            ConfigEvent.LOAD,
            ConfigState.LOADING,
            this.onEnterLoading.bind(this)
        );

        // LOADING -> VALIDATING
        this.transitionHub.addTransition(
            ConfigState.LOADING,
            ConfigEvent.VALIDATE,
            ConfigState.VALIDATING,
            this.onEnterValidating.bind(this)
        );

        // VALIDATING -> MERGING
        this.transitionHub.addTransition(
            ConfigState.VALIDATING,
            ConfigEvent.MERGE,
            ConfigState.MERGING,
            this.onEnterMerging.bind(this)
        );

        // MERGING -> WATCHING
        this.transitionHub.addTransition(
            ConfigState.MERGING,
            ConfigEvent.WATCH,
            ConfigState.WATCHING,
            this.onEnterWatching.bind(this)
        );

        // WATCHING -> RELOADING
        this.transitionHub.addTransition(
            ConfigState.WATCHING,
            ConfigEvent.RELOAD,
            ConfigState.RELOADING,
            this.onEnterReloading.bind(this)
        );

        // Error transitions from any state
        this.setupErrorTransitions();
    }

    /**
     * Setup error transitions - NASA Rule 10: ≤60 lines
     */
    private setupErrorTransitions(): void {
        const errorStates = [
            ConfigState.LOADING,
            ConfigState.VALIDATING,
            ConfigState.MERGING,
            ConfigState.WATCHING,
            ConfigState.RELOADING
        ];

        errorStates.forEach(state => {
            this.transitionHub.addTransition(
                state,
                ConfigEvent.ERROR,
                ConfigState.ERROR,
                this.onEnterError.bind(this)
            );

            this.transitionHub.addTransition(
                state,
                ConfigEvent.RESET,
                ConfigState.IDLE,
                this.onEnterIdle.bind(this)
            );
        });
    }

    /**
     * Load configuration from sources
     */
    async loadConfiguration(sources: string[]): Promise<boolean> {
        this.context.sources = sources;
        return this.transitionHub.transition(this.context, ConfigEvent.LOAD);
    }

    /**
     * Get current configuration
     */
    getConfiguration(): any {
        return this.context.config;
    }

    /**
     * Get current state
     */
    getCurrentState(): ConfigState {
        return this.context.currentState;
    }

    /**
     * State handler: LOADING
     */
    private async onEnterLoading(context: ConfigContext): Promise<boolean> {
        try {
            const configs = await this.loader.loadFromSources(context.sources);
            context.rawConfigs = configs;
            return this.transitionHub.transition(context, ConfigEvent.VALIDATE);
        } catch (error) {
            context.errors.push(`Loading failed: ${error}`);
            return this.transitionHub.transition(context, ConfigEvent.ERROR);
        }
    }

    /**
     * State handler: VALIDATING
     */
    private async onEnterValidating(context: ConfigContext): Promise<boolean> {
        try {
            const validation = await this.validator.validateConfigs(context.rawConfigs);
            if (!validation.valid) {
                context.errors.push(...validation.errors);
                return this.transitionHub.transition(context, ConfigEvent.ERROR);
            }
            return this.transitionHub.transition(context, ConfigEvent.MERGE);
        } catch (error) {
            context.errors.push(`Validation failed: ${error}`);
            return this.transitionHub.transition(context, ConfigEvent.ERROR);
        }
    }

    /**
     * State handler: MERGING
     */
    private async onEnterMerging(context: ConfigContext): Promise<boolean> {
        try {
            const merged = await this.merger.mergeConfigs(context.rawConfigs);
            context.config = merged;
            return this.transitionHub.transition(context, ConfigEvent.WATCH);
        } catch (error) {
            context.errors.push(`Merging failed: ${error}`);
            return this.transitionHub.transition(context, ConfigEvent.ERROR);
        }
    }

    /**
     * State handler: WATCHING
     */
    private async onEnterWatching(context: ConfigContext): Promise<boolean> {
        try {
            await this.watcher.watchSources(context.sources, () => {
                this.transitionHub.transition(context, ConfigEvent.RELOAD);
            });
            return true;
        } catch (error) {
            context.errors.push(`Watching failed: ${error}`);
            return this.transitionHub.transition(context, ConfigEvent.ERROR);
        }
    }

    /**
     * State handler: RELOADING
     */
    private async onEnterReloading(context: ConfigContext): Promise<boolean> {
        // Reset errors and reload
        context.errors = [];
        return this.transitionHub.transition(context, ConfigEvent.LOAD);
    }

    /**
     * State handler: ERROR
     */
    private async onEnterError(context: ConfigContext): Promise<boolean> {
        console.error('Configuration FSM error:', context.errors);
        return false;
    }

    /**
     * State handler: IDLE
     */
    private async onEnterIdle(context: ConfigContext): Promise<boolean> {
        context.config = null;
        context.rawConfigs = undefined;
        context.errors = [];
        this.watcher.stopAll();
        return true;
    }
}
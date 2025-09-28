/**
 * ConfigurationFacade - Unified Configuration Management Interface
 * Single entry point for all configuration operations
 * Replaces multiple configuration god objects with unified FSM system
 *
 * NASA Rule 10: ≤60 line functions, bounded configuration interface
 * FSM-First: All configuration operations through state machine lifecycle
 */

import { ConfigStateMachine } from './fsm/ConfigStateMachine';
import { ConfigLoader } from './components/ConfigLoader';
import { ConfigValidator } from './components/ConfigValidator';
import { ConfigMerger } from './components/ConfigMerger';
import { ConfigWatcher } from './components/ConfigWatcher';
import { ConfigState, ConfigEvent, ValidationResult } from './types/ConfigTypes';

export class ConfigurationFacade {
    private configFSM: ConfigStateMachine;
    private loader: ConfigLoader;
    private validator: ConfigValidator;
    private merger: ConfigMerger;
    private watcher: ConfigWatcher;

    constructor() {
        this.configFSM = new ConfigStateMachine();
        this.loader = new ConfigLoader();
        this.validator = new ConfigValidator();
        this.merger = new ConfigMerger();
        this.watcher = new ConfigWatcher();
    }

    /**
     * Load configuration from sources - NASA Rule 10: ≤60 lines
     */
    async loadConfiguration(sources: string[]): Promise<boolean> {
        return this.configFSM.loadConfiguration(sources);
    }

    /**
     * Get current configuration
     */
    getConfiguration(): any {
        return this.configFSM.getConfiguration();
    }

    /**
     * Get current FSM state
     */
    getCurrentState(): ConfigState {
        return this.configFSM.getCurrentState();
    }

    /**
     * Validate configuration data
     */
    async validateConfiguration(configs: any[]): Promise<ValidationResult> {
        return this.validator.validateConfigs(configs);
    }

    /**
     * Enable hot reload for configuration sources
     */
    async enableHotReload(sources: string[]): Promise<void> {
        await this.watcher.watchSources(sources, () => {
            console.log('Configuration changed, reloading...');
            this.configFSM.loadConfiguration(sources);
        });
    }

    /**
     * Disable hot reload
     */
    disableHotReload(): void {
        this.watcher.stopAll();
    }

    /**
     * Get system status
     */
    getStatus(): {
        state: ConfigState;
        watchedSources: string[];
        hasConfiguration: boolean;
        errors: string[];
    } {
        return {
            state: this.getCurrentState(),
            watchedSources: this.watcher.getActiveWatchers(),
            hasConfiguration: this.getConfiguration() !== null,
            errors: [] // Would be tracked in context
        };
    }
}

// Export singleton instance
export const ConfigurationManager = new ConfigurationFacade();
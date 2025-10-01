/**
 * ConfigMerger - Hierarchical Configuration Merging Component
 * Merges configurations from multiple sources with priority handling
 *
 * NASA Rule 10: ≤60 line functions, bounded merging operations
 * FSM-First: Designed for MERGING state in ConfigStateMachine
 */

import { MergeStrategy } from '~types/ConfigTypes';

export class ConfigMerger {
    private strategies: Map<string, MergeStrategy>;

    constructor() {
        this.strategies = new Map();
        this.setupDefaultStrategies();
    }

    /**
     * Setup default merge strategies - NASA Rule 10: ≤60 lines
     */
    private setupDefaultStrategies(): void {
        // Deep merge strategy
        this.strategies.set('deep', {
            type: 'deep',
            resolver: this.deepMergeResolver.bind(this)
        });

        // Shallow merge strategy
        this.strategies.set('shallow', {
            type: 'shallow',
            resolver: this.shallowMergeResolver.bind(this)
        });

        // Replace strategy
        this.strategies.set('replace', {
            type: 'replace',
            resolver: this.replaceResolver.bind(this)
        });

        // Array concatenation strategy
        this.strategies.set('array_concat', {
            type: 'array_concat',
            resolver: this.arrayConcatResolver.bind(this)
        });
    }

    /**
     * Add custom merge strategy - NASA Rule 10: ≤60 lines
     */
    addStrategy(name: string, strategy: MergeStrategy): void {
        if (!name || !strategy) {
            throw new Error('Strategy name and strategy are required');
        }

        if (!strategy.resolver) {
            throw new Error('Strategy resolver is required');
        }

        this.strategies.set(name, strategy);
    }

    /**
     * Merge configurations from multiple sources - NASA Rule 10: ≤60 lines
     */
    async mergeConfigs(configs: any[]): Promise<any> {
        if (!configs || configs.length === 0) {
            throw new Error('No configurations to merge');
        }

        // Sort by priority (ascending)
        const sortedConfigs = configs.sort((a, b) => a.priority - b.priority);

        let merged = {};

        for (const configData of sortedConfigs) {
            if (!configData.config) {
                continue;
            }

            const strategy = this.selectStrategy(configData.config);
            merged = this.mergeWithStrategy(merged, configData.config, strategy);
        }

        // Validate merged result
        if (Object.keys(merged).length === 0) {
            throw new Error('Merge resulted in empty configuration');
        }

        return merged;
    }

    /**
     * Merge two configs with specified strategy - NASA Rule 10: ≤60 lines
     */
    private mergeWithStrategy(base: any, override: any, strategy: MergeStrategy): any {
        if (!strategy.resolver) {
            throw new Error('Strategy resolver is required');
        }

        try {
            return this.mergeObjects(base, override, strategy.resolver);
        } catch (error) {
            throw new Error(`Merge failed with strategy ${strategy.type}: ${error}`);
        }
    }

    /**
     * Recursively merge objects - NASA Rule 10: ≤60 lines
     */
    private mergeObjects(base: any, override: any, resolver: Function): any {
        if (this.isPrimitive(override)) {
            return resolver(base, override, '');
        }

        if (Array.isArray(override)) {
            return resolver(base, override, '');
        }

        if (typeof override !== 'object' || override === null) {
            return resolver(base, override, '');
        }

        const result = { ...base };

        for (const key of Object.keys(override)) {
            const baseValue = result[key];
            const overrideValue = override[key];

            if (this.shouldRecurse(baseValue, overrideValue)) {
                result[key] = this.mergeObjects(baseValue, overrideValue, resolver);
            } else {
                result[key] = resolver(baseValue, overrideValue, key);
            }
        }

        return result;
    }

    /**
     * Select merge strategy based on config content
     */
    private selectStrategy(config: any): MergeStrategy {
        // Default to deep merge
        let strategyName = 'deep';

        // Check for strategy hints in config
        if (config._mergeStrategy) {
            strategyName = config._mergeStrategy;
        }

        // Select based on config type
        if (config.arrays && config.arrays.length > 0) {
            strategyName = 'array_concat';
        }

        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Unknown merge strategy: ${strategyName}`);
        }

        return strategy;
    }

    /**
     * Check if values should be recursively merged
     */
    private shouldRecurse(base: any, override: any): boolean {
        return (
            typeof base === 'object' && base !== null && !Array.isArray(base) &&
            typeof override === 'object' && override !== null && !Array.isArray(override)
        );
    }

    /**
     * Check if value is primitive
     */
    private isPrimitive(value: any): boolean {
        return value === null || typeof value !== 'object';
    }

    // Merge resolvers
    private deepMergeResolver(base: any, override: any, key: string): any {
        return override !== undefined ? override : base;
    }

    private shallowMergeResolver(base: any, override: any, key: string): any {
        return override !== undefined ? override : base;
    }

    private replaceResolver(base: any, override: any, key: string): any {
        return override;
    }

    private arrayConcatResolver(base: any, override: any, key: string): any {
        if (Array.isArray(base) && Array.isArray(override)) {
            return [...base, ...override];
        }
        return override !== undefined ? override : base;
    }
}
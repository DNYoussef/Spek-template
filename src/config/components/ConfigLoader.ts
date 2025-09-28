/**
 * ConfigLoader - Multi-Source Configuration Loading Component
 * Handles loading from files, environment, remote sources
 *
 * NASA Rule 10: ≤60 line functions, bounded loading operations
 * FSM-First: Designed for LOADING state in ConfigStateMachine
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigSource } from '../types/ConfigTypes';

export class ConfigLoader {
    private sources: Map<string, ConfigSource>;

    constructor() {
        this.sources = new Map();
    }

    /**
     * Add configuration source - NASA Rule 10: ≤60 lines
     */
    addSource(id: string, source: ConfigSource): void {
        if (!id || !source) {
            throw new Error('Source ID and source are required');
        }

        if (!source.path) {
            throw new Error('Source path is required');
        }

        this.sources.set(id, {
            ...source,
            priority: source.priority || 0
        });
    }

    /**
     * Load configurations from all sources - NASA Rule 10: ≤60 lines
     */
    async loadFromSources(sourceIds: string[]): Promise<any[]> {
        const configs: any[] = [];
        const sources = this.getOrderedSources(sourceIds);

        for (const source of sources) {
            try {
                const config = await this.loadFromSource(source);
                if (config !== null) {
                    configs.push({
                        source: source.path,
                        priority: source.priority,
                        config
                    });
                }
            } catch (error) {
                if (source.required) {
                    throw new Error(`Required source failed: ${source.path} - ${error}`);
                }
                console.warn(`Optional source failed: ${source.path} - ${error}`);
            }
        }

        if (configs.length === 0) {
            throw new Error('No configurations loaded');
        }

        return configs;
    }

    /**
     * Load from single source - NASA Rule 10: ≤60 lines
     */
    private async loadFromSource(source: ConfigSource): Promise<any> {
        switch (source.type) {
            case 'file':
                return this.loadFromFile(source.path, source.encoding);

            case 'env':
                return this.loadFromEnvironment(source.path);

            case 'remote':
                return this.loadFromRemote(source.path);

            case 'database':
                return this.loadFromDatabase(source.path);

            default:
                throw new Error(`Unsupported source type: ${source.type}`);
        }
    }

    /**
     * Load from file - NASA Rule 10: ≤60 lines
     */
    private async loadFromFile(filePath: string, encoding = 'utf8'): Promise<any> {
        try {
            const content = await fs.readFile(filePath, encoding);
            const ext = path.extname(filePath).toLowerCase();

            switch (ext) {
                case '.json':
                    return JSON.parse(content);

                case '.yaml':
                case '.yml':
                    // Would use yaml parser here
                    throw new Error('YAML parsing not implemented');

                case '.js':
                case '.ts':
                    // Would use dynamic import here
                    throw new Error('Module loading not implemented');

                default:
                    return { content };
            }
        } catch (error) {
            throw new Error(`File loading failed: ${error}`);
        }
    }

    /**
     * Load from environment - NASA Rule 10: ≤60 lines
     */
    private loadFromEnvironment(prefix: string): any {
        const config: any = {};
        const envPrefix = prefix.toUpperCase();

        for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith(envPrefix)) {
                const configKey = key
                    .substring(envPrefix.length)
                    .toLowerCase()
                    .replace(/_/g, '.');

                this.setNestedValue(config, configKey, this.parseValue(value));
            }
        }

        return Object.keys(config).length > 0 ? config : null;
    }

    /**
     * Load from remote source - NASA Rule 10: ≤60 lines
     */
    private async loadFromRemote(url: string): Promise<any> {
        // Placeholder for remote loading
        throw new Error('Remote loading not implemented');
    }

    /**
     * Load from database - NASA Rule 10: ≤60 lines
     */
    private async loadFromDatabase(connectionString: string): Promise<any> {
        // Placeholder for database loading
        throw new Error('Database loading not implemented');
    }

    /**
     * Get sources ordered by priority
     */
    private getOrderedSources(sourceIds: string[]): ConfigSource[] {
        const sources = sourceIds
            .map(id => this.sources.get(id))
            .filter(source => source !== undefined) as ConfigSource[];

        return sources.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Set nested object value from dot notation key
     */
    private setNestedValue(obj: any, key: string, value: any): void {
        const keys = key.split('.');
        const lastKey = keys.pop()!;

        let current = obj;
        for (const k of keys) {
            current[k] = current[k] || {};
            current = current[k];
        }

        current[lastKey] = value;
    }

    /**
     * Parse environment variable value
     */
    private parseValue(value: string | undefined): any {
        if (!value) return null;

        // Try boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Try number
        const num = Number(value);
        if (!isNaN(num)) return num;

        // Return as string
        return value;
    }
}
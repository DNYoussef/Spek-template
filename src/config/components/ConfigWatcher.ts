/**
 * ConfigWatcher - File System Change Monitoring Component
 * Watches configuration sources for changes and triggers reloads
 *
 * NASA Rule 10: ≤60 line functions, bounded watching operations
 * FSM-First: Designed for WATCHING state in ConfigStateMachine
 */

import * as fs from 'fs';
import * as path from 'path';
import { WatchConfig } from '../types/ConfigTypes';

export class ConfigWatcher {
    private watchers: Map<string, fs.FSWatcher>;
    private debounceTimers: Map<string, NodeJS.Timeout>;

    constructor() {
        this.watchers = new Map();
        this.debounceTimers = new Map();
    }

    /**
     * Watch configuration sources - NASA Rule 10: ≤60 lines
     */
    async watchSources(sources: string[], onChange: () => void): Promise<void> {
        if (!sources || sources.length === 0) {
            throw new Error('No sources to watch');
        }

        if (!onChange) {
            throw new Error('onChange callback is required');
        }

        for (const source of sources) {
            try {
                await this.watchSource(source, onChange);
            } catch (error) {
                console.warn(`Failed to watch source: ${source} - ${error}`);
            }
        }

        if (this.watchers.size === 0) {
            throw new Error('No sources could be watched');
        }
    }

    /**
     * Watch single source - NASA Rule 10: ≤60 lines
     */
    private async watchSource(source: string, onChange: () => void): Promise<void> {
        // Stop existing watcher if any
        this.stopWatcher(source);

        const watchConfig = this.createWatchConfig(source);

        try {
            // Check if source exists
            await fs.promises.access(source);

            const watcher = fs.watch(source, {
                recursive: watchConfig.recursive,
                persistent: true
            }, (eventType, filename) => {
                this.handleFileChange(source, eventType, filename, onChange, watchConfig);
            });

            watcher.on('error', (error) => {
                console.error(`Watch error for ${source}:`, error);
                this.stopWatcher(source);
            });

            this.watchers.set(source, watcher);

        } catch (error) {
            throw new Error(`Cannot watch source: ${source} - ${error}`);
        }
    }

    /**
     * Handle file change event - NASA Rule 10: ≤60 lines
     */
    private handleFileChange(
        source: string,
        eventType: string,
        filename: string | null,
        onChange: () => void,
        config: WatchConfig
    ): void {
        // Filter out unwanted changes
        if (!this.shouldTriggerChange(eventType, filename, config)) {
            return;
        }

        // Debounce the change event
        const timerId = this.debounceTimers.get(source);
        if (timerId) {
            clearTimeout(timerId);
        }

        const newTimerId = setTimeout(() => {
            console.log(`Configuration change detected: ${source}`);
            onChange();
            this.debounceTimers.delete(source);
        }, config.debounceMs);

        this.debounceTimers.set(source, newTimerId);
    }

    /**
     * Create watch configuration - NASA Rule 10: ≤60 lines
     */
    private createWatchConfig(source: string): WatchConfig {
        const stats = fs.statSync(source);

        return {
            source,
            debounceMs: 500, // 500ms debounce
            recursive: stats.isDirectory(),
            filters: this.getFileFilters(source)
        };
    }

    /**
     * Get file filters based on source type
     */
    private getFileFilters(source: string): string[] {
        const ext = path.extname(source).toLowerCase();

        if (ext) {
            // Watching specific file
            return [ext];
        }

        // Watching directory - filter for config files
        return ['.json', '.yaml', '.yml', '.js', '.ts', '.env'];
    }

    /**
     * Check if change should trigger reload
     */
    private shouldTriggerChange(eventType: string, filename: string | null, config: WatchConfig): boolean {
        // Only trigger on change events, not rename
        if (eventType !== 'change') {
            return false;
        }

        // If no filename, assume it's the watched file itself
        if (!filename) {
            return true;
        }

        // Check file filters
        if (config.filters && config.filters.length > 0) {
            const ext = path.extname(filename).toLowerCase();
            return config.filters.includes(ext);
        }

        return true;
    }

    /**
     * Stop watching specific source - NASA Rule 10: ≤60 lines
     */
    stopWatcher(source: string): void {
        const watcher = this.watchers.get(source);
        if (watcher) {
            watcher.close();
            this.watchers.delete(source);
        }

        const timer = this.debounceTimers.get(source);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimers.delete(source);
        }
    }

    /**
     * Stop all watchers - NASA Rule 10: ≤60 lines
     */
    stopAll(): void {
        // Clear all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // Close all watchers
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
    }

    /**
     * Get active watchers
     */
    getActiveWatchers(): string[] {
        return Array.from(this.watchers.keys());
    }

    /**
     * Check if source is being watched
     */
    isWatching(source: string): boolean {
        return this.watchers.has(source);
    }
}
/**
 * ConfigurationManagerFacade.ts
 * Simplified facade for ConfigurationManager god object
 * Delegates to specialized FSM components using RepositoryBaseFSM
 */

import { EventEmitter } from 'events';
import { RepositoryBaseFSM, RepositoryConfig } from '../repository/RepositoryBaseFSM';

export interface ConfigLoadResult {
  success: boolean;
  config?: any;
  errors: string[];
  warnings: string[];
}

export interface ConfigManagerOptions {
  configPath?: string;
  environment?: string;
  enableHotReload?: boolean;
  validateOnLoad?: boolean;
}

/**
 * Simplified Configuration Manager Facade
 * Delegates configuration operations to FSM-based repository
 */
export class ConfigurationManagerFacade extends EventEmitter {
  private repository: RepositoryBaseFSM;
  private options: Required<ConfigManagerOptions>;
  private currentConfig: any = null;

  constructor(options: ConfigManagerOptions = {}) {
    super();

    this.options = {
      configPath: options.configPath || 'config/enterprise_config.yaml',
      environment: options.environment || process.env.NODE_ENV || 'development',
      enableHotReload: options.enableHotReload ?? true,
      validateOnLoad: options.validateOnLoad ?? true
    };

    const repositoryConfig: RepositoryConfig = {
      dataSource: {
        type: 'file',
        connectionString: this.options.configPath
      },
      cache: {
        maxSize: 100,
        maxAge: 300000, // 5 minutes
        evictionPolicy: 'LRU'
      },
      enableMetrics: true
    };

    this.repository = new RepositoryBaseFSM(repositoryConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.repository.on('error', (error) => {
      this.emit('configError', { error, timestamp: Date.now() });
    });

    this.repository.on('queryExecuted', (event) => {
      this.emit('configLoaded', { result: event.result, timestamp: Date.now() });
    });
  }

  async initializeComponent(): Promise<ConfigLoadResult> {
    try {
      await this.repository.initializeComponent();

      const config = await this.repository.read('config');
      this.currentConfig = config;

      this.emit('initialized', { config });

      return {
        success: true,
        config,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Initialization failed: ${error}`],
        warnings: []
      };
    }
  }

  async reloadConfiguration(): Promise<ConfigLoadResult> {
    try {
      // Clear cache to force fresh load
      await this.repository.clearCache();

      const config = await this.repository.read('config');
      this.currentConfig = config;

      this.emit('configReloaded', { config });

      return {
        success: true,
        config,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Reload failed: ${error}`],
        warnings: []
      };
    }
  }

  async updateConfigValue(path: string, value: any): Promise<boolean> {
    try {
      await this.repository.update(
        { path },
        { value },
        [path, value]
      );

      // Update current config in memory
      this.setNestedProperty(this.currentConfig, path, value);

      this.emit('configUpdated', { path, value });
      return true;
    } catch (error) {
      this.emit('configError', { error, operation: 'update', path, value });
      return false;
    }
  }

  getCurrentConfig(): any {
    return this.currentConfig ? { ...this.currentConfig } : null;
  }

  getConfigValue(path: string): any {
    return this.getNestedProperty(this.currentConfig, path);
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    const health = await this.repository.healthCheck();
    return {
      status: health.status,
      details: {
        components: health.components,
        metrics: health.metrics,
        configLoaded: !!this.currentConfig
      }
    };
  }

  getMetrics(): any {
    return this.repository.getMetrics();
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
    target[lastKey] = value;
  }

  async destroy(): Promise<void> {
    await this.repository.destroy();
    this.removeAllListeners();
  }
}
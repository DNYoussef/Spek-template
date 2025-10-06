/**
 * Component Library - Reusable components for god object elimination
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

// TODO(Phase 4): Implement facade - import { ComponentCore, ComponentFacade, MidRangeFSM, ComponentState, ComponentEvent } from './MidRangeFSM';

/**
 * Data Processor Core - Generic data processing
 */
export class DataProcessorCore extends ComponentCore {
  private processors: Map<string, (data: any) => Promise<any>> = new Map();

  async initialize(): Promise<void> {
    this.setupDefaultProcessors();
    this.initialized = true;
    console.log('[DataProcessorCore] Initialized');
  }

  async process(data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('DataProcessorCore not initialized');
    }

    const processorType = data.type || 'default';
    const processor = this.processors.get(processorType);

    if (!processor) {
      throw new Error(`No processor found for type: ${processorType}`);
    }

    return await processor(data);
  }

  async cleanup(): Promise<void> {
    this.processors.clear();
    this.initialized = false;
    console.log('[DataProcessorCore] Cleaned up');
  }

  addProcessor(type: string, processor: (data: any) => Promise<any>): void {
    this.processors.set(type, processor);
  }

  private setupDefaultProcessors(): void {
    this.processors.set('default', async (data: any) => data);
    this.processors.set('json', async (data: any) => JSON.parse(JSON.stringify(data)));
  }
}

/**
 * Report Generator Core - Generic report generation
 */
export class ReportGeneratorCore extends ComponentCore {
  private templates: Map<string, any> = new Map();
  private formatters: Map<string, (data: any) => string> = new Map();

  async initialize(): Promise<void> {
    this.setupDefaultTemplates();
    this.setupDefaultFormatters();
    this.initialized = true;
    console.log('[ReportGeneratorCore] Initialized');
  }

  async process(data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('ReportGeneratorCore not initialized');
    }

    const template = this.templates.get(data.template || 'default');
    const formatter = this.formatters.get(data.format || 'json');

    if (!template || !formatter) {
      throw new Error('Template or formatter not found');
    }

    const processedData = this.applyTemplate(data, template);
    return formatter(processedData);
  }

  async cleanup(): Promise<void> {
    this.templates.clear();
    this.formatters.clear();
    this.initialized = false;
    console.log('[ReportGeneratorCore] Cleaned up');
  }

  private setupDefaultTemplates(): void {
    this.templates.set('default', { structure: 'basic' });
    this.templates.set('analysis', { structure: 'analysis', sections: ['summary', 'details'] });
  }

  private setupDefaultFormatters(): void {
    this.formatters.set('json', (data: any) => JSON.stringify(data, null, 2));
    this.formatters.set('text', (data: any) => `Report: ${JSON.stringify(data)}`);
  }

  private applyTemplate(data: any, template: any): any {
    return { ...template, data, timestamp: Date.now() };
  }
}

/**
 * Metric Collector Core - Generic metrics collection
 */
export class MetricCollectorCore extends ComponentCore {
  private metrics: Map<string, any[]> = new Map();
  private collectors: Map<string, () => Promise<any>> = new Map();

  async initialize(): Promise<void> {
    this.setupDefaultCollectors();
    this.initialized = true;
    console.log('[MetricCollectorCore] Initialized');
  }

  async process(data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('MetricCollectorCore not initialized');
    }

    const collectorType = data.type || 'default';
    const collector = this.collectors.get(collectorType);

    if (!collector) {
      throw new Error(`No collector found for type: ${collectorType}`);
    }

    const metric = await collector();
    this.storeMetric(collectorType, metric);
    return metric;
  }

  async cleanup(): Promise<void> {
    this.metrics.clear();
    this.collectors.clear();
    this.initialized = false;
    console.log('[MetricCollectorCore] Cleaned up');
  }

  private setupDefaultCollectors(): void {
    this.collectors.set('default', async () => ({ timestamp: Date.now() }));
    this.collectors.set('performance', async () => ({
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }));
  }

  private storeMetric(type: string, metric: any): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type)!.push(metric);
  }

  getMetrics(type?: string): any[] {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }
}

/**
 * Generic Component FSM - Reusable state machine
 */
export class GenericComponentFSM extends MidRangeFSM {
  protected initializeStateHandlers(): void {
    this.stateHandlers.set(ComponentState.INITIALIZING, async () => {
      this.log('Component initializing...');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    this.stateHandlers.set(ComponentState.READY, async () => {
      this.log('Component ready for processing');
    });

    this.stateHandlers.set(ComponentState.PROCESSING, async () => {
      this.log('Component processing data...');
      const startTime = Date.now();
      this.metrics.lastProcessedAt = new Date();
      this.metrics.processingTime += Date.now() - startTime;
    });

    this.stateHandlers.set(ComponentState.ERROR, async () => {
      this.log('Component in error state');
    });

    this.stateHandlers.set(ComponentState.SHUTDOWN, async () => {
      this.log('Component shutting down');
    });
  }
}

/**
 * Generic Component Facade - Reusable facade pattern
 */
export class GenericComponentFacade extends ComponentFacade {
  async executeOperation(operation: string, data: any): Promise<any> {
    if (this.fsm.getCurrentState() !== ComponentState.READY) {
      throw new Error('Component not ready for operations');
    }

    await this.fsm.processEvent(ComponentEvent.START_PROCESSING);

    try {
      const result = await this.core.process({ operation, ...data });
      await this.fsm.processEvent(ComponentEvent.COMPLETE_PROCESSING);
      return result;
    } catch (error) {
      await this.fsm.processEvent(ComponentEvent.ERROR_OCCURRED);
      throw error;
    }
  }

  async bulkProcess(items: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const item of items) {
      try {
        const result = await this.executeOperation('process', item);
        results.push(result);
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to process item:`, error);
        results.push({ error: errorMessage, item });
      }
    }

    return results;
  }
}

/**
 * Component Factory - Create decomposed components
 */
export class ComponentFactory {
  static createDataProcessor(config: any): GenericComponentFacade {
    const core = new DataProcessorCore(config);
    const fsm = new GenericComponentFSM({
      componentId: `DataProcessor-${Date.now()}`,
      initialState: ComponentState.UNINITIALIZED,
      enableLogging: config.enableLogging || false,
      enableMetrics: config.enableMetrics || true
    });
    return new GenericComponentFacade(core, fsm);
  }

  static createReportGenerator(config: any): GenericComponentFacade {
    const core = new ReportGeneratorCore(config);
    const fsm = new GenericComponentFSM({
      componentId: `ReportGenerator-${Date.now()}`,
      initialState: ComponentState.UNINITIALIZED,
      enableLogging: config.enableLogging || false,
      enableMetrics: config.enableMetrics || true
    });
    return new GenericComponentFacade(core, fsm);
  }

  static createMetricCollector(config: any): GenericComponentFacade {
    const core = new MetricCollectorCore(config);
    const fsm = new GenericComponentFSM({
      componentId: `MetricCollector-${Date.now()}`,
      initialState: ComponentState.UNINITIALIZED,
      enableLogging: config.enableLogging || false,
      enableMetrics: config.enableMetrics || true
    });
    return new GenericComponentFacade(core, fsm);
  }
}
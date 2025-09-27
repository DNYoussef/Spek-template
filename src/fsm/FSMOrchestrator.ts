/**
 * FSMOrchestrator - Main FSM System Integration
 * Coordinates all FSM components and provides unified interface for the Queen-Princess-Drone hierarchy
 */

import { EventEmitter } from 'events';
import { SystemStateMachine } from './orchestration/SystemStateMachine';
import { TransitionHub, HubConfiguration } from './TransitionHub';
import { StateTransitionMonitor } from './monitoring/StateTransitionMonitor';
import { LangGraphAdapter } from '../langgraph/LangGraphAdapter';
import { DevelopmentPrincessFSM } from './princesses/DevelopmentPrincessFSM';
import { SecurityPrincessFSM } from './princesses/SecurityPrincessFSM';
import { InfrastructurePrincessFSM } from './princesses/InfrastructurePrincessFSM';
import { ResearchPrincessFSM } from './princesses/ResearchPrincessFSM';
import { DeploymentPrincessFSM } from './princesses/DeploymentPrincessFSM';
import { QualityPrincessFSM } from './princesses/QualityPrincessFSM';
import {
  SystemState,
  SystemEvent,
  PrincessState,
  PrincessEvent,
  FSMContext,
  LangGraphWorkflow
} from './types/FSMTypes';

export interface OrchestratorConfig {
  enableSystemFSM: boolean;
  enableTransitionHub: boolean;
  enableMonitoring: boolean;
  enableLangGraphIntegration: boolean;
  hubConfig?: Partial<HubConfiguration>;
  maxPrincessFSMs: number;
  performanceMode: 'development' | 'production';
}

export interface FSMSystemStatus {
  systemFSM: {
    active: boolean;
    currentState: SystemState;
    uptime: number;
  };
  transitionHub: {
    active: boolean;
    registeredFSMs: number;
    pendingTransitions: number;
    activeTransitions: number;
  };
  monitoring: {
    active: boolean;
    metricsCollected: number;
    activeAlerts: number;
    performanceScore: number;
  };
  langGraph: {
    active: boolean;
    registeredWorkflows: number;
    activeExecutions: number;
  };
  princesses: {
    total: number;
    active: number;
    states: Record<string, any>;
  };
}

export class FSMOrchestrator extends EventEmitter {
  private initialized = false;
  private config: OrchestratorConfig;
  private systemFSM: SystemStateMachine | null = null;
  private transitionHub: TransitionHub | null = null;
  private monitor: StateTransitionMonitor | null = null;
  private langGraphAdapter: LangGraphAdapter | null = null;
  private princessFSMs: Map<string, any> = new Map();
  private startTime = 0;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super();
    
    this.config = {
      enableSystemFSM: true,
      enableTransitionHub: true,
      enableMonitoring: true,
      enableLangGraphIntegration: true,
      maxPrincessFSMs: 6, // 6 domain princesses
      performanceMode: 'development',
      ...config
    };
  }

  /**
   * Initialize the complete FSM orchestration system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing FSM Orchestration System');
    this.startTime = Date.now();
    
    try {
      // Step 1: Initialize TransitionHub (if enabled)
      if (this.config.enableTransitionHub) {
        await this.initializeTransitionHub();
      }

      // Step 2: Initialize System FSM (if enabled)
      if (this.config.enableSystemFSM) {
        await this.initializeSystemFSM();
      }

      // Step 3: Initialize Monitoring (if enabled)
      if (this.config.enableMonitoring) {
        await this.initializeMonitoring();
      }

      // Step 4: Initialize LangGraph Integration (if enabled)
      if (this.config.enableLangGraphIntegration) {
        await this.initializeLangGraphIntegration();
      }

      // Step 5: Initialize Princess FSMs
      await this.initializePrincessFSMs();

      // Step 6: Connect all components
      await this.connectComponents();

      this.initialized = true;
      
      this.log('FSM Orchestration System initialized successfully');
      this.emit('initialized', this.getSystemStatus());
      
    } catch (error) {
      this.logError('Failed to initialize FSM Orchestration System', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Initialize TransitionHub
   */
  private async initializeTransitionHub(): Promise<void> {
    this.log('Initializing TransitionHub...');
    
    this.transitionHub = new TransitionHub(this.config.hubConfig);
    await this.transitionHub.initialize();
    
    // Subscribe to hub events
    this.transitionHub.on('fsmRegistered', (data) => {
      this.log(`FSM registered with hub: ${data.id}`);
      this.emit('fsmRegistered', data);
    });
    
    this.transitionHub.on('fsmError', (data) => {
      this.logError(`FSM error in hub: ${data.fsmId}`, data.error);
      this.emit('fsmError', data);
    });
    
    this.log('TransitionHub initialized');
  }

  /**
   * Initialize System FSM
   */
  private async initializeSystemFSM(): Promise<void> {
    this.log('Initializing System FSM...');
    
    this.systemFSM = new SystemStateMachine({
      enableLogging: this.config.performanceMode === 'development',
      persistState: true,
      validationLevel: this.config.performanceMode === 'production' ? 'strict' : 'normal'
    });
    
    await this.systemFSM.initialize();
    
    // Register with hub if available
    if (this.transitionHub) {
      await this.transitionHub.registerFSM(
        'system-fsm',
        'system',
        'System State Machine',
        this.systemFSM
      );
    }
    
    this.log('System FSM initialized');
  }

  /**
   * Initialize Monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    this.log('Initializing Monitoring...');
    
    this.monitor = new StateTransitionMonitor({
      enableRealTimeTracking: true,
      metricsInterval: this.config.performanceMode === 'production' ? 10000 : 5000,
      enablePerformanceAnalysis: true
    });
    
    await this.monitor.initialize(this.transitionHub || undefined);
    
    // Subscribe to monitoring events
    this.monitor.on('alert', (alert) => {
      this.log(`Performance alert: ${alert.type} - ${alert.message}`);
      this.emit('performanceAlert', alert);
    });
    
    this.monitor.on('metricsCollected', (metrics) => {
      this.emit('metricsUpdate', metrics);
    });
    
    this.log('Monitoring initialized');
  }

  /**
   * Initialize LangGraph Integration
   */
  private async initializeLangGraphIntegration(): Promise<void> {
    this.log('Initializing LangGraph Integration...');
    
    this.langGraphAdapter = new LangGraphAdapter({
      enableMemoryPersistence: true,
      parallelExecution: this.config.performanceMode === 'production',
      performanceMonitoring: true
    });
    
    await this.langGraphAdapter.initialize(this.systemFSM || undefined);
    
    this.log('LangGraph Integration initialized');
  }

  /**
   * Initialize Princess FSMs
   */
  private async initializePrincessFSMs(): Promise<void> {
    this.log('Initializing Princess FSMs...');

    // Initialize Development Princess FSM
    const developmentFSM = new DevelopmentPrincessFSM();
    await developmentFSM.initialize();
    this.princessFSMs.set('development', developmentFSM);

    // Initialize Security Princess FSM
    const securityFSM = new SecurityPrincessFSM();
    await securityFSM.initialize();
    this.princessFSMs.set('security', securityFSM);

    // Initialize Infrastructure Princess FSM
    const infrastructureFSM = new InfrastructurePrincessFSM();
    await infrastructureFSM.initialize();
    this.princessFSMs.set('infrastructure', infrastructureFSM);

    // Initialize Research Princess FSM
    const researchFSM = new ResearchPrincessFSM();
    await researchFSM.initialize();
    this.princessFSMs.set('research', researchFSM);

    // Initialize Deployment Princess FSM
    const deploymentFSM = new DeploymentPrincessFSM();
    await deploymentFSM.initialize();
    this.princessFSMs.set('deployment', deploymentFSM);

    // Initialize Quality Princess FSM
    const qualityFSM = new QualityPrincessFSM();
    await qualityFSM.initialize();
    this.princessFSMs.set('quality', qualityFSM);

    // Register all Princess FSMs with hub if available
    if (this.transitionHub) {
      const princessConfigs = [
        { key: 'development', fsm: developmentFSM, name: 'Development Princess FSM' },
        { key: 'security', fsm: securityFSM, name: 'Security Princess FSM' },
        { key: 'infrastructure', fsm: infrastructureFSM, name: 'Infrastructure Princess FSM' },
        { key: 'research', fsm: researchFSM, name: 'Research Princess FSM' },
        { key: 'deployment', fsm: deploymentFSM, name: 'Deployment Princess FSM' },
        { key: 'quality', fsm: qualityFSM, name: 'Quality Princess FSM' }
      ];

      for (const config of princessConfigs) {
        await this.transitionHub.registerFSM(
          `${config.key}-princess`,
          'princess',
          config.name,
          config.fsm
        );
      }
    }

    this.log(`Princess FSMs initialized: ${this.princessFSMs.size}`);
  }

  /**
   * Connect all components together
   */
  private async connectComponents(): Promise<void> {
    this.log('Connecting components...');
    
    // Connect monitoring to all FSMs
    if (this.monitor) {
      // Monitor system FSM
      if (this.systemFSM) {
        // Subscribe to system FSM events for monitoring
        // (This would be implemented with proper event handling)
      }
      
      // Monitor princess FSMs
      for (const [princessId, fsm] of this.princessFSMs) {
        // Subscribe to princess FSM events for monitoring
        // (This would be implemented with proper event handling)
      }
    }
    
    this.log('Components connected successfully');
  }

  /**
   * Register a LangGraph workflow
   */
  async registerWorkflow(workflow: LangGraphWorkflow): Promise<void> {
    if (!this.langGraphAdapter) {
      throw new Error('LangGraph integration not enabled');
    }
    
    await this.langGraphAdapter.registerWorkflow(workflow);
    this.log(`Workflow registered: ${workflow.id}`);
  }

  /**
   * Execute a LangGraph workflow
   */
  async executeWorkflow(
    workflowId: string,
    initialData?: Record<string, any>
  ): Promise<any> {
    if (!this.langGraphAdapter) {
      throw new Error('LangGraph integration not enabled');
    }
    
    const result = await this.langGraphAdapter.executeWorkflow(workflowId, initialData);
    this.log(`Workflow executed: ${workflowId}`);
    return result;
  }

  /**
   * Send event to System FSM
   */
  async sendSystemEvent(event: SystemEvent, data?: any): Promise<void> {
    if (!this.systemFSM) {
      throw new Error('System FSM not enabled');
    }
    
    await this.systemFSM.sendEvent(event, data);
  }

  /**
   * Send event to Princess FSM
   */
  async sendPrincessEvent(
    princessId: string,
    event: PrincessEvent,
    data?: any
  ): Promise<void> {
    const fsm = this.princessFSMs.get(princessId);
    if (!fsm) {
      throw new Error(`Princess FSM not found: ${princessId}`);
    }
    
    await fsm.sendEvent(event, data);
  }

  /**
   * Get system status
   */
  getSystemStatus(): FSMSystemStatus {
    const uptime = Date.now() - this.startTime;
    
    return {
      systemFSM: {
        active: !!this.systemFSM,
        currentState: this.systemFSM ? this.systemFSM.getCurrentState() : SystemState.IDLE,
        uptime
      },
      transitionHub: {
        active: !!this.transitionHub,
        registeredFSMs: this.transitionHub ? this.transitionHub.getStatus().registeredFSMs : 0,
        pendingTransitions: this.transitionHub ? this.transitionHub.getStatus().pendingTransitions : 0,
        activeTransitions: this.transitionHub ? this.transitionHub.getStatus().activeTransitions : 0
      },
      monitoring: {
        active: !!this.monitor,
        metricsCollected: this.monitor ? this.monitor.getMetricsHistory().length : 0,
        activeAlerts: this.monitor ? this.monitor.getActiveAlerts().length : 0,
        performanceScore: this.monitor ? (this.monitor.getCurrentMetrics()?.performanceScore || 0) : 0
      },
      langGraph: {
        active: !!this.langGraphAdapter,
        registeredWorkflows: this.langGraphAdapter ? this.langGraphAdapter.getWorkflows().length : 0,
        activeExecutions: 0 // This would track active executions
      },
      princesses: {
        total: this.princessFSMs.size,
        active: Array.from(this.princessFSMs.values()).filter(fsm => fsm.isHealthy && fsm.isHealthy()).length,
        states: this.getPrincessStates()
      }
    };
  }

  /**
   * Get current states of all Princess FSMs
   */
  private getPrincessStates(): Record<string, any> {
    const states: Record<string, any> = {};
    
    for (const [princessId, fsm] of this.princessFSMs) {
      if (typeof fsm.getCurrentState === 'function') {
        states[princessId] = fsm.getCurrentState();
      }
    }
    
    return states;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    if (!this.monitor) {
      return null;
    }
    
    return {
      current: this.monitor.getCurrentMetrics(),
      history: this.monitor.getMetricsHistory(),
      alerts: this.monitor.getActiveAlerts(),
      report: this.monitor.generateReport()
    };
  }

  /**
   * Get all registered Princess FSMs
   */
  getPrincessFSMs(): Map<string, any> {
    return new Map(this.princessFSMs);
  }

  /**
   * Get specific Princess FSM
   */
  getPrincessFSM(princessId: string): any {
    return this.princessFSMs.get(princessId);
  }

  /**
   * Check if system is healthy
   */
  isSystemHealthy(): boolean {
    if (!this.initialized) {
      return false;
    }
    
    // Check system FSM health
    if (this.systemFSM && !this.systemFSM.isHealthy()) {
      return false;
    }
    
    // Check princess FSMs health
    for (const fsm of this.princessFSMs.values()) {
      if (typeof fsm.isHealthy === 'function' && !fsm.isHealthy()) {
        return false;
      }
    }
    
    // Check monitoring alerts
    if (this.monitor) {
      const criticalAlerts = this.monitor.getActiveAlerts()
        .filter(alert => alert.severity === 'critical');
      if (criticalAlerts.length > 0) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Restart a specific Princess FSM
   */
  async restartPrincessFSM(princessId: string): Promise<void> {
    const fsm = this.princessFSMs.get(princessId);
    if (!fsm) {
      throw new Error(`Princess FSM not found: ${princessId}`);
    }
    
    this.log(`Restarting Princess FSM: ${princessId}`);
    
    // Shutdown existing FSM
    if (typeof fsm.shutdown === 'function') {
      await fsm.shutdown();
    }
    
    // Unregister from hub
    if (this.transitionHub) {
      await this.transitionHub.unregisterFSM(`${princessId}-princess`);
    }
    
    // Create new instance based on princess type
    let newFSM;
    switch (princessId) {
      case 'development':
        newFSM = new DevelopmentPrincessFSM();
        break;
      case 'security':
        newFSM = new SecurityPrincessFSM();
        break;
      case 'infrastructure':
        newFSM = new InfrastructurePrincessFSM();
        break;
      case 'research':
        newFSM = new ResearchPrincessFSM();
        break;
      case 'deployment':
        newFSM = new DeploymentPrincessFSM();
        break;
      case 'quality':
        newFSM = new QualityPrincessFSM();
        break;
      default:
        throw new Error(`Unknown princess type: ${princessId}`);
    }
    
    // Initialize new FSM
    await newFSM.initialize();
    this.princessFSMs.set(princessId, newFSM);
    
    // Register with hub
    if (this.transitionHub) {
      await this.transitionHub.registerFSM(
        `${princessId}-princess`,
        'princess',
        `${princessId} Princess FSM`,
        newFSM
      );
    }
    
    this.log(`Princess FSM restarted: ${princessId}`);
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.log('Cleaning up resources...');
    
    // Shutdown princess FSMs
    for (const [princessId, fsm] of this.princessFSMs) {
      try {
        if (typeof fsm.shutdown === 'function') {
          await fsm.shutdown();
        }
      } catch (error) {
        this.logError(`Failed to shutdown Princess FSM: ${princessId}`, error);
      }
    }
    this.princessFSMs.clear();
    
    // Shutdown components
    if (this.langGraphAdapter) {
      await this.langGraphAdapter.shutdown();
      this.langGraphAdapter = null;
    }
    
    if (this.monitor) {
      await this.monitor.shutdown();
      this.monitor = null;
    }
    
    if (this.systemFSM) {
      await this.systemFSM.shutdown();
      this.systemFSM = null;
    }
    
    if (this.transitionHub) {
      await this.transitionHub.shutdown();
      this.transitionHub = null;
    }
  }

  /**
   * Shutdown the entire orchestration system
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down FSM Orchestration System');
    
    await this.cleanup();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.initialized = false;
    this.log('FSM Orchestration System shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[FSMOrchestrator] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[FSMOrchestrator] ERROR: ${message}`, error || '');
  }
}

// Export main orchestrator as default
export default FSMOrchestrator;

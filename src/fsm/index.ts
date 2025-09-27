/**
 * FSM System - Main Export File
 * Provides unified access to all FSM orchestration components
 */

// Core FSM Components
export { SystemStateMachine } from './orchestration/SystemStateMachine';
export { StateTransitionEngine } from './orchestration/StateTransitionEngine';
export { StateGuardValidator } from './orchestration/StateGuardValidator';
export { StateEventDispatcher } from './orchestration/StateEventDispatcher';
export { StateHistoryManager } from './orchestration/StateHistoryManager';

// Central Coordination
export { TransitionHub } from './TransitionHub';
export type { HubConfiguration, TransitionRequest, TransitionResponse, FSMRegistry } from './TransitionHub';

// LangGraph Integration
export { LangGraphAdapter } from '../langgraph/LangGraphAdapter';
export { GraphStateMapper } from '../langgraph/GraphStateMapper';

// Princess FSMs
export { DevelopmentPrincessFSM } from './princesses/DevelopmentPrincessFSM';

// Monitoring
export { StateTransitionMonitor } from './monitoring/StateTransitionMonitor';
export type { 
  PerformanceAlert, 
  RealTimeMetrics, 
  MonitoringConfig 
} from './monitoring/StateTransitionMonitor';

// Types
export * from './types/FSMTypes';

// Main Orchestrator
export { FSMOrchestrator } from './FSMOrchestrator';
export type { OrchestratorConfig, FSMSystemStatus } from './FSMOrchestrator';

// Default export is the main orchestrator
export { default } from './FSMOrchestrator';

/**
 * Quick Start Example:
 * 
 * ```typescript
 * import FSMOrchestrator from './src/fsm';
 * 
 * const orchestrator = new FSMOrchestrator({
 *   enableSystemFSM: true,
 *   enableTransitionHub: true,
 *   enableMonitoring: true,
 *   enableLangGraphIntegration: true,
 *   performanceMode: 'development'
 * });
 * 
 * await orchestrator.initialize();
 * 
 * // Register a workflow
 * await orchestrator.registerWorkflow({
 *   id: 'dev-workflow',
 *   name: 'Development Workflow',
 *   nodes: [...],
 *   edges: [...]
 * });
 * 
 * // Execute workflow
 * const result = await orchestrator.executeWorkflow('dev-workflow', {
 *   projectData: 'initial data'
 * });
 * 
 * // Monitor system
 * const status = orchestrator.getSystemStatus();
 * const metrics = orchestrator.getPerformanceMetrics();
 * 
 * // Shutdown when done
 * await orchestrator.shutdown();
 * ```
 */

/**
 * Advanced Usage:
 * 
 * ```typescript
 * import { 
 *   SystemStateMachine,
 *   TransitionHub,
 *   StateTransitionMonitor,
 *   LangGraphAdapter,
 *   DevelopmentPrincessFSM,
 *   SystemState,
 *   SystemEvent
 * } from './src/fsm';
 * 
 * // Create individual components
 * const systemFSM = new SystemStateMachine();
 * const hub = new TransitionHub();
 * const monitor = new StateTransitionMonitor();
 * const langGraph = new LangGraphAdapter();
 * 
 * // Initialize components
 * await systemFSM.initialize();
 * await hub.initialize();
 * await monitor.initialize(hub);
 * await langGraph.initialize(systemFSM);
 * 
 * // Register FSMs with hub
 * await hub.registerFSM('system', 'system', 'System FSM', systemFSM);
 * 
 * // Send events
 * await systemFSM.sendEvent(SystemEvent.INITIALIZE);
 * 
 * // Monitor transitions
 * monitor.on('alert', (alert) => {
 *   console.log('Performance Alert:', alert);
 * });
 * ```
 */

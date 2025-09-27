/**
 * TransitionHub - Centralized FSM Transition Control Point
 * Coordinates all state transitions across the entire Queen-Princess-Drone hierarchy
 */

import { EventEmitter } from 'events';
import { 
  FSMContext, 
  TransitionDefinition, 
  TransitionRecord, 
  SystemState, 
  SystemEvent,
  PrincessState,
  PrincessEvent
} from './types/FSMTypes';
import { SystemStateMachine } from './orchestration/SystemStateMachine';
import { StateGuardValidator } from './orchestration/StateGuardValidator';
import { StateEventDispatcher } from './orchestration/StateEventDispatcher';
import { StateHistoryManager } from './orchestration/StateHistoryManager';

export interface HubConfiguration {
  maxConcurrentTransitions: number;
  enableGlobalValidation: boolean;
  enableConflictResolution: boolean;
  enableStateReplication: boolean;
  transitionTimeout: number;
  retryAttempts: number;
}

export interface TransitionRequest {
  id: string;
  fsmId: string;
  from: any;
  to: any;
  event: any;
  context: FSMContext;
  priority: number;
  timestamp: number;
  requester: string;
}

export interface TransitionResponse {
  requestId: string;
  success: boolean;
  fromState: any;
  toState: any;
  duration: number;
  error?: string;
  warnings?: string[];
}

export interface FSMRegistry {
  id: string;
  type: 'system' | 'princess' | 'drone';
  name: string;
  instance: any;
  isActive: boolean;
  lastHeartbeat: number;
  transitionCount: number;
}

export class TransitionHub extends EventEmitter {
  private initialized = false;
  private config: HubConfiguration;
  private registeredFSMs: Map<string, FSMRegistry> = new Map();
  private pendingTransitions: Map<string, TransitionRequest> = new Map();
  private activeTransitions: Map<string, Promise<TransitionResponse>> = new Map();
  private transitionQueue: TransitionRequest[] = [];
  private guardValidator: StateGuardValidator;
  private eventDispatcher: StateEventDispatcher;
  private historyManager: StateHistoryManager;
  private processing = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<HubConfiguration> = {}) {
    super();
    this.setMaxListeners(200); // Allow many FSM connections
    
    this.config = {
      maxConcurrentTransitions: 50,
      enableGlobalValidation: true,
      enableConflictResolution: true,
      enableStateReplication: false,
      transitionTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      ...config
    };

    this.guardValidator = new StateGuardValidator();
    this.eventDispatcher = new StateEventDispatcher();
    this.historyManager = new StateHistoryManager();
  }

  /**
   * Initialize the TransitionHub
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing TransitionHub');
    
    // Initialize sub-components
    await this.guardValidator.initialize();
    await this.eventDispatcher.initialize();
    await this.historyManager.initialize();
    
    // Clear registries
    this.registeredFSMs.clear();
    this.pendingTransitions.clear();
    this.activeTransitions.clear();
    this.transitionQueue = [];
    
    // Start processing loop
    this.startTransitionProcessing();
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();
    
    this.initialized = true;
    this.log('TransitionHub initialized successfully');
  }

  /**
   * Register an FSM with the hub
   */
  async registerFSM(
    id: string,
    type: 'system' | 'princess' | 'drone',
    name: string,
    instance: any
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('TransitionHub not initialized');
    }

    const registry: FSMRegistry = {
      id,
      type,
      name,
      instance,
      isActive: true,
      lastHeartbeat: Date.now(),
      transitionCount: 0
    };
    
    this.registeredFSMs.set(id, registry);
    
    // Subscribe to FSM events
    if (instance && typeof instance.on === 'function') {
      instance.on('stateChange', (data: any) => {
        this.handleFSMStateChange(id, data);
      });
      
      instance.on('transitionComplete', (data: any) => {
        this.handleFSMTransitionComplete(id, data);
      });
      
      instance.on('error', (error: any) => {
        this.handleFSMError(id, error);
      });
    }
    
    this.log(`FSM registered: ${id} (${type}: ${name})`);
    this.emit('fsmRegistered', { id, type, name });
  }

  /**
   * Unregister an FSM
   */
  async unregisterFSM(id: string): Promise<void> {
    const registry = this.registeredFSMs.get(id);
    if (!registry) {
      return;
    }
    
    // Cancel any pending transitions for this FSM
    this.cancelPendingTransitions(id);
    
    // Remove from registry
    this.registeredFSMs.delete(id);
    
    this.log(`FSM unregistered: ${id}`);
    this.emit('fsmUnregistered', { id });
  }

  /**
   * Request a state transition
   */
  async requestTransition(
    fsmId: string,
    from: any,
    to: any,
    event: any,
    context: FSMContext,
    priority: number = 5,
    requester: string = 'unknown'
  ): Promise<TransitionResponse> {
    if (!this.initialized) {
      throw new Error('TransitionHub not initialized');
    }

    const registry = this.registeredFSMs.get(fsmId);
    if (!registry) {
      throw new Error(`FSM not registered: ${fsmId}`);
    }

    const requestId = `${fsmId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const request: TransitionRequest = {
      id: requestId,
      fsmId,
      from,
      to,
      event,
      context: { ...context },
      priority,
      timestamp: Date.now(),
      requester
    };
    
    // Validate transition request
    if (this.config.enableGlobalValidation) {
      const validationResult = this.guardValidator.validateTransitionWithReason(
        from, to, event, context
      );
      
      if (!validationResult.valid) {
        const response: TransitionResponse = {
          requestId,
          success: false,
          fromState: from,
          toState: to,
          duration: 0,
          error: `Validation failed: ${validationResult.reason}`
        };
        
        this.historyManager.recordEvent(event, from, 0, false, response.error);
        return response;
      }
    }
    
    // Add to pending queue
    this.pendingTransitions.set(requestId, request);
    this.transitionQueue.push(request);
    
    // Sort queue by priority (lower number = higher priority)
    this.transitionQueue.sort((a, b) => a.priority - b.priority);
    
    this.log(`Transition requested: ${fsmId} ${from} -> ${to} (${event}, priority: ${priority})`);
    
    // Return promise that resolves when transition completes
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cancelTransition(requestId);
        reject(new Error(`Transition timeout: ${requestId}`));
      }, this.config.transitionTimeout);
      
      this.once(`transitionComplete_${requestId}`, (response: TransitionResponse) => {
        clearTimeout(timeout);
        resolve(response);
      });
      
      this.once(`transitionFailed_${requestId}`, (response: TransitionResponse) => {
        clearTimeout(timeout);
        resolve(response); // Resolve with failure response instead of rejecting
      });
    });
  }

  /**
   * Start transition processing loop
   */
  private startTransitionProcessing(): void {
    if (this.processing) {
      return;
    }
    
    this.processing = true;
    
    const processNextTransition = async () => {
      if (this.transitionQueue.length === 0 || 
          this.activeTransitions.size >= this.config.maxConcurrentTransitions) {
        setTimeout(processNextTransition, 10);
        return;
      }
      
      const request = this.transitionQueue.shift()!;
      
      try {
        const response = await this.executeTransition(request);
        this.emit(`transitionComplete_${request.id}`, response);
      } catch (error) {
        const response: TransitionResponse = {
          requestId: request.id,
          success: false,
          fromState: request.from,
          toState: request.to,
          duration: 0,
          error: error.message
        };
        
        this.emit(`transitionFailed_${request.id}`, response);
      }
      
      setImmediate(processNextTransition);
    };
    
    processNextTransition();
  }

  /**
   * Execute a single transition
   */
  private async executeTransition(request: TransitionRequest): Promise<TransitionResponse> {
    const startTime = Date.now();
    
    try {
      // Add to active transitions
      const executionPromise = this.doExecuteTransition(request);
      this.activeTransitions.set(request.id, executionPromise);
      
      const response = await executionPromise;
      
      // Remove from active and pending
      this.activeTransitions.delete(request.id);
      this.pendingTransitions.delete(request.id);
      
      // Update FSM registry
      const registry = this.registeredFSMs.get(request.fsmId);
      if (registry) {
        registry.transitionCount++;
        registry.lastHeartbeat = Date.now();
      }
      
      // Record in history
      const transitionRecord: TransitionRecord = {
        from: request.from,
        to: request.to,
        event: request.event,
        timestamp: startTime,
        duration: response.duration,
        success: response.success,
        context: request.context
      };
      
      this.historyManager.recordTransition(transitionRecord);
      
      // Dispatch state change event
      await this.eventDispatcher.dispatchEvent(
        'stateTransition',
        {
          fsmId: request.fsmId,
          transition: transitionRecord,
          response
        },
        request.priority
      );
      
      this.log(`Transition executed: ${request.fsmId} ${request.from} -> ${request.to} (${response.duration}ms)`);
      
      return response;
      
    } catch (error) {
      // Clean up
      this.activeTransitions.delete(request.id);
      this.pendingTransitions.delete(request.id);
      
      const duration = Date.now() - startTime;
      
      this.logError(`Transition execution failed: ${request.id}`, error);
      
      return {
        requestId: request.id,
        success: false,
        fromState: request.from,
        toState: request.to,
        duration,
        error: error.message
      };
    }
  }

  /**
   * Internal transition execution
   */
  private async doExecuteTransition(request: TransitionRequest): Promise<TransitionResponse> {
    const startTime = Date.now();
    
    const registry = this.registeredFSMs.get(request.fsmId);
    if (!registry || !registry.instance) {
      throw new Error(`FSM instance not available: ${request.fsmId}`);
    }
    
    // Check for conflicts if enabled
    if (this.config.enableConflictResolution) {
      await this.resolveConflicts(request);
    }
    
    // Execute transition on the FSM instance
    let success = false;
    let error: string | undefined;
    
    try {
      if (typeof registry.instance.sendEvent === 'function') {
        await registry.instance.sendEvent(request.event, {
          from: request.from,
          to: request.to,
          context: request.context
        });
        success = true;
      } else if (typeof registry.instance.transition === 'function') {
        await registry.instance.transition(request.from, request.to, request.event);
        success = true;
      } else {
        throw new Error(`FSM instance does not support transitions: ${request.fsmId}`);
      }
    } catch (transitionError) {
      error = transitionError.message;
      success = false;
    }
    
    const duration = Date.now() - startTime;
    
    const response: TransitionResponse = {
      requestId: request.id,
      success,
      fromState: request.from,
      toState: request.to,
      duration,
      error
    };
    
    return response;
  }

  /**
   * Resolve conflicts between concurrent transitions
   */
  private async resolveConflicts(request: TransitionRequest): Promise<void> {
    // Check for conflicting transitions
    const conflicts = Array.from(this.activeTransitions.values())
      .filter(async (activePromise) => {
        const active = await activePromise;
        return active.requestId !== request.id && 
               this.isConflicting(request, active);
      });
    
    if (conflicts.length > 0) {
      this.log(`Conflict detected for transition: ${request.id}, waiting for resolution`);
      
      // Wait for conflicting transitions to complete
      await Promise.all(conflicts);
    }
  }

  /**
   * Check if two transitions conflict
   */
  private isConflicting(request1: TransitionRequest, response2: TransitionResponse): boolean {
    // Simple conflict detection - same FSM, overlapping states
    return request1.fsmId === response2.requestId.split('_')[0] &&
           (request1.from === response2.toState || request1.to === response2.fromState);
  }

  /**
   * Cancel a pending transition
   */
  private cancelTransition(requestId: string): void {
    // Remove from pending
    this.pendingTransitions.delete(requestId);
    
    // Remove from queue
    this.transitionQueue = this.transitionQueue.filter(r => r.id !== requestId);
    
    // Cancel active transition if possible
    this.activeTransitions.delete(requestId);
    
    this.log(`Transition cancelled: ${requestId}`);
  }

  /**
   * Cancel all pending transitions for an FSM
   */
  private cancelPendingTransitions(fsmId: string): void {
    const cancelled: string[] = [];
    
    // Cancel pending
    for (const [requestId, request] of this.pendingTransitions) {
      if (request.fsmId === fsmId) {
        this.cancelTransition(requestId);
        cancelled.push(requestId);
      }
    }
    
    if (cancelled.length > 0) {
      this.log(`Cancelled ${cancelled.length} pending transitions for FSM: ${fsmId}`);
    }
  }

  /**
   * Handle FSM state change notifications
   */
  private handleFSMStateChange(fsmId: string, data: any): void {
    this.log(`FSM state change: ${fsmId}`, data);
    this.emit('fsmStateChange', { fsmId, data });
  }

  /**
   * Handle FSM transition completion
   */
  private handleFSMTransitionComplete(fsmId: string, data: any): void {
    this.log(`FSM transition complete: ${fsmId}`, data);
    this.emit('fsmTransitionComplete', { fsmId, data });
  }

  /**
   * Handle FSM errors
   */
  private handleFSMError(fsmId: string, error: any): void {
    this.logError(`FSM error: ${fsmId}`, error);
    this.emit('fsmError', { fsmId, error });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      this.checkFSMHeartbeats();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check FSM heartbeats and mark inactive FSMs
   */
  private checkFSMHeartbeats(): void {
    const now = Date.now();
    const timeout = 120000; // 2 minutes
    
    for (const [fsmId, registry] of this.registeredFSMs) {
      if (now - registry.lastHeartbeat > timeout) {
        registry.isActive = false;
        this.log(`FSM marked inactive due to missing heartbeat: ${fsmId}`);
        this.emit('fsmInactive', { fsmId });
      }
    }
  }

  /**
   * Update FSM heartbeat
   */
  updateHeartbeat(fsmId: string): void {
    const registry = this.registeredFSMs.get(fsmId);
    if (registry) {
      registry.lastHeartbeat = Date.now();
      registry.isActive = true;
    }
  }

  /**
   * Get hub status
   */
  getStatus(): {
    registeredFSMs: number;
    activeFSMs: number;
    pendingTransitions: number;
    activeTransitions: number;
    queueLength: number;
    totalTransitions: number;
  } {
    const activeFSMs = Array.from(this.registeredFSMs.values())
      .filter(r => r.isActive).length;
    
    const totalTransitions = Array.from(this.registeredFSMs.values())
      .reduce((sum, r) => sum + r.transitionCount, 0);
    
    return {
      registeredFSMs: this.registeredFSMs.size,
      activeFSMs,
      pendingTransitions: this.pendingTransitions.size,
      activeTransitions: this.activeTransitions.size,
      queueLength: this.transitionQueue.length,
      totalTransitions
    };
  }

  /**
   * Get registered FSMs
   */
  getRegisteredFSMs(): FSMRegistry[] {
    return Array.from(this.registeredFSMs.values());
  }

  /**
   * Get transition metrics
   */
  getMetrics(): any {
    return this.historyManager.getMetrics();
  }

  /**
   * Shutdown the TransitionHub
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down TransitionHub');
    
    // Stop processing
    this.processing = false;
    
    // Stop heartbeat monitoring
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Cancel all pending transitions
    for (const requestId of this.pendingTransitions.keys()) {
      this.cancelTransition(requestId);
    }
    
    // Wait for active transitions to complete or timeout
    const activePromises = Array.from(this.activeTransitions.values());
    if (activePromises.length > 0) {
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
      await Promise.race([Promise.all(activePromises), timeoutPromise]);
    }
    
    // Shutdown sub-components
    await this.guardValidator.shutdown();
    await this.eventDispatcher.shutdown();
    await this.historyManager.shutdown();
    
    // Clear all registries
    this.registeredFSMs.clear();
    this.pendingTransitions.clear();
    this.activeTransitions.clear();
    this.transitionQueue = [];
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.initialized = false;
    this.log('TransitionHub shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[TransitionHub] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[TransitionHub] ERROR: ${message}`, error || '');
  }
}

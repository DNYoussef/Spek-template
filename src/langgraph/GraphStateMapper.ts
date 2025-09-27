/**
 * GraphStateMapper - Maps LangGraph States to FSM States
 * Handles conversion between LangGraph node states and FSM state machine states
 */

import { 
  LangGraphNode, 
  LangGraphEdge, 
  TransitionDefinition,
  StateDefinition,
  FSMContext,
  TransitionGuard,
  SystemState,
  SystemEvent,
  PrincessState,
  PrincessEvent
} from '../fsm/types/FSMTypes';

export interface StateMappingRule {
  graphState: string;
  fsmState: any;
  priority: number;
  conditions?: ((context: FSMContext) => boolean)[];
  metadata?: Record<string, any>;
}

export interface TransitionMappingRule {
  graphEvent: string;
  fsmEvent: any;
  guards?: TransitionGuard[];
  actions?: ((context: FSMContext) => Promise<void>)[];
  priority: number;
}

export class GraphStateMapper {
  private initialized = false;
  private stateMappingRules: Map<string, StateMappingRule> = new Map();
  private transitionMappingRules: Map<string, TransitionMappingRule> = new Map();
  private reverseMappings: Map<any, string> = new Map();
  private defaultMappings: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultMappings();
  }

  /**
   * Initialize the state mapper
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing GraphStateMapper');
    
    this.initializeDefaultMappings();
    this.setupReverseMappings();
    
    this.initialized = true;
  }

  /**
   * Initialize default state and event mappings
   */
  private initializeDefaultMappings(): void {
    // System state mappings
    this.addStateMappingRule({
      graphState: 'idle',
      fsmState: SystemState.IDLE,
      priority: 1
    });
    
    this.addStateMappingRule({
      graphState: 'initializing',
      fsmState: SystemState.INITIALIZING,
      priority: 1
    });
    
    this.addStateMappingRule({
      graphState: 'active',
      fsmState: SystemState.ACTIVE,
      priority: 1
    });
    
    this.addStateMappingRule({
      graphState: 'error',
      fsmState: SystemState.ERROR,
      priority: 1
    });
    
    this.addStateMappingRule({
      graphState: 'suspended',
      fsmState: SystemState.SUSPENDED,
      priority: 1
    });
    
    this.addStateMappingRule({
      graphState: 'shutdown',
      fsmState: SystemState.SHUTDOWN,
      priority: 1
    });

    // Princess state mappings
    this.addStateMappingRule({
      graphState: 'ready',
      fsmState: PrincessState.READY,
      priority: 2
    });
    
    this.addStateMappingRule({
      graphState: 'working',
      fsmState: PrincessState.WORKING,
      priority: 2
    });
    
    this.addStateMappingRule({
      graphState: 'waiting',
      fsmState: PrincessState.WAITING,
      priority: 2
    });
    
    this.addStateMappingRule({
      graphState: 'blocked',
      fsmState: PrincessState.BLOCKED,
      priority: 2
    });
    
    this.addStateMappingRule({
      graphState: 'complete',
      fsmState: PrincessState.COMPLETE,
      priority: 2
    });
    
    this.addStateMappingRule({
      graphState: 'failed',
      fsmState: PrincessState.FAILED,
      priority: 2
    });

    // Event mappings
    this.addTransitionMappingRule({
      graphEvent: 'initialize',
      fsmEvent: SystemEvent.INITIALIZE,
      priority: 1
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'start',
      fsmEvent: SystemEvent.START,
      priority: 1
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'pause',
      fsmEvent: SystemEvent.PAUSE,
      priority: 1
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'resume',
      fsmEvent: SystemEvent.RESUME,
      priority: 1
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'stop',
      fsmEvent: SystemEvent.STOP,
      priority: 1
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'error',
      fsmEvent: SystemEvent.ERROR_OCCURRED,
      priority: 1
    });

    // Princess event mappings
    this.addTransitionMappingRule({
      graphEvent: 'assign_task',
      fsmEvent: PrincessEvent.ASSIGN_TASK,
      priority: 2
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'task_complete',
      fsmEvent: PrincessEvent.TASK_COMPLETE,
      priority: 2
    });
    
    this.addTransitionMappingRule({
      graphEvent: 'task_failed',
      fsmEvent: PrincessEvent.TASK_FAILED,
      priority: 2
    });
  }

  /**
   * Setup reverse mappings for FSM to Graph conversion
   */
  private setupReverseMappings(): void {
    for (const [graphState, rule] of this.stateMappingRules) {
      this.reverseMappings.set(rule.fsmState, graphState);
    }
  }

  /**
   * Map LangGraph nodes to FSM states
   */
  async mapNodesToStates(nodes: LangGraphNode[]): Promise<Map<string, StateDefinition>> {
    const stateDefinitions = new Map<string, StateDefinition>();
    
    for (const node of nodes) {
      const stateDefinition = await this.mapNodeToState(node);
      if (stateDefinition) {
        stateDefinitions.set(node.id, stateDefinition);
      }
    }
    
    this.log(`Mapped ${nodes.length} nodes to ${stateDefinitions.size} FSM states`);
    return stateDefinitions;
  }

  /**
   * Map LangGraph edges to FSM transitions
   */
  async mapEdgesToTransitions(edges: LangGraphEdge[]): Promise<TransitionDefinition[]> {
    const transitions: TransitionDefinition[] = [];
    
    for (const edge of edges) {
      const transition = await this.mapEdgeToTransition(edge);
      if (transition) {
        transitions.push(transition);
      }
    }
    
    this.log(`Mapped ${edges.length} edges to ${transitions.length} FSM transitions`);
    return transitions;
  }

  /**
   * Map a single node to FSM state
   */
  async mapNodeToState(node: LangGraphNode): Promise<StateDefinition | null> {
    try {
      // Find appropriate FSM state for the node
      const fsmState = this.mapNodeStateToFSMState(node.state || node.type);
      
      if (!fsmState) {
        this.log(`No FSM state mapping found for node: ${node.id}`);
        return null;
      }
      
      // Create state definition
      const stateDefinition: StateDefinition = {
        name: node.name || node.id,
        entry: async (context: FSMContext) => {
          this.log(`Entering state from node: ${node.id}`);
          
          // Execute node-specific entry logic
          if (node.metadata.onEntry) {
            await this.executeNodeAction(node.metadata.onEntry, context);
          }
          
          // Update context with node data
          context.data.currentNode = node.id;
          context.data.nodeType = node.type;
          context.metadata.graphNode = node;
        },
        exit: async (context: FSMContext) => {
          this.log(`Exiting state from node: ${node.id}`);
          
          // Execute node-specific exit logic
          if (node.metadata.onExit) {
            await this.executeNodeAction(node.metadata.onExit, context);
          }
        },
        invariants: this.createStateInvariants(node),
        timeout: node.metadata.timeout,
        onTimeout: node.metadata.onTimeout
      };
      
      return stateDefinition;
      
    } catch (error) {
      this.logError(`Failed to map node to state: ${node.id}`, error);
      return null;
    }
  }

  /**
   * Map a single edge to FSM transition
   */
  async mapEdgeToTransition(edge: LangGraphEdge): Promise<TransitionDefinition | null> {
    try {
      // Map graph event to FSM event
      const fsmEvent = this.mapGraphEventToFSMEvent(edge.event);
      
      if (!fsmEvent) {
        this.log(`No FSM event mapping found for edge event: ${edge.event}`);
        return null;
      }
      
      // Create transition definition
      const transition: TransitionDefinition = {
        from: edge.from,
        to: edge.to,
        event: fsmEvent,
        guards: this.mapEdgeGuards(edge),
        actions: this.createTransitionActions(edge)
      };
      
      return transition;
      
    } catch (error) {
      this.logError(`Failed to map edge to transition: ${edge.from} -> ${edge.to}`, error);
      return null;
    }
  }

  /**
   * Map node state to FSM state
   */
  mapNodeStateToFSMState(nodeState: any): any {
    if (!nodeState) {
      return null;
    }
    
    const stateKey = nodeState.toString().toLowerCase();
    const rule = this.stateMappingRules.get(stateKey);
    
    if (rule) {
      return rule.fsmState;
    }
    
    // Try partial matching
    for (const [key, mappingRule] of this.stateMappingRules) {
      if (stateKey.includes(key) || key.includes(stateKey)) {
        return mappingRule.fsmState;
      }
    }
    
    // Default mapping based on common patterns
    if (stateKey.includes('init')) return SystemState.INITIALIZING;
    if (stateKey.includes('work') || stateKey.includes('process')) return PrincessState.WORKING;
    if (stateKey.includes('wait')) return PrincessState.WAITING;
    if (stateKey.includes('error') || stateKey.includes('fail')) return SystemState.ERROR;
    if (stateKey.includes('complete') || stateKey.includes('done')) return PrincessState.COMPLETE;
    
    // Default to ACTIVE if no mapping found
    return SystemState.ACTIVE;
  }

  /**
   * Map graph event to FSM event
   */
  mapGraphEventToFSMEvent(graphEvent: any): any {
    if (!graphEvent) {
      return null;
    }
    
    const eventKey = graphEvent.toString().toLowerCase();
    const rule = this.transitionMappingRules.get(eventKey);
    
    if (rule) {
      return rule.fsmEvent;
    }
    
    // Try partial matching
    for (const [key, mappingRule] of this.transitionMappingRules) {
      if (eventKey.includes(key) || key.includes(eventKey)) {
        return mappingRule.fsmEvent;
      }
    }
    
    // Default mapping based on common patterns
    if (eventKey.includes('start') || eventKey.includes('begin')) return SystemEvent.START;
    if (eventKey.includes('stop') || eventKey.includes('end')) return SystemEvent.STOP;
    if (eventKey.includes('pause')) return SystemEvent.PAUSE;
    if (eventKey.includes('resume')) return SystemEvent.RESUME;
    if (eventKey.includes('error')) return SystemEvent.ERROR_OCCURRED;
    if (eventKey.includes('complete')) return SystemEvent.TRANSITION_COMPLETE;
    
    // Default to generic transition event
    return SystemEvent.TRANSITION_COMPLETE;
  }

  /**
   * Map FSM state back to graph state
   */
  mapFSMStateToGraphState(fsmState: any): string {
    const graphState = this.reverseMappings.get(fsmState);
    return graphState || fsmState.toString().toLowerCase();
  }

  /**
   * Create state invariants from node metadata
   */
  private createStateInvariants(node: LangGraphNode): ((context: FSMContext) => boolean)[] {
    const invariants: ((context: FSMContext) => boolean)[] = [];
    
    // Basic invariant - node ID should match
    invariants.push((context: FSMContext) => {
      return context.data.currentNode === node.id;
    });
    
    // Add custom invariants from node metadata
    if (node.metadata.invariants) {
      invariants.push(...node.metadata.invariants);
    }
    
    return invariants;
  }

  /**
   * Map edge guards to transition guards
   */
  private mapEdgeGuards(edge: LangGraphEdge): TransitionGuard[] {
    const guards: TransitionGuard[] = [];
    
    // Add edge-specific guards
    if (edge.guards) {
      guards.push(...edge.guards);
    }
    
    // Add weight-based guard if edge has weight
    if (edge.weight !== undefined) {
      guards.push({
        name: `weightGuard_${edge.from}_${edge.to}`,
        condition: (context: FSMContext) => {
          const currentWeight = context.data.edgeWeight || 0;
          return currentWeight >= (edge.weight || 0);
        },
        errorMessage: `Edge weight requirement not met: ${edge.weight}`
      });
    }
    
    return guards;
  }

  /**
   * Create transition actions from edge metadata
   */
  private createTransitionActions(edge: LangGraphEdge): ((context: FSMContext) => Promise<void>)[] {
    const actions: ((context: FSMContext) => Promise<void>)[] = [];
    
    // Basic action to update edge traversal info
    actions.push(async (context: FSMContext) => {
      context.data.lastEdge = {
        from: edge.from,
        to: edge.to,
        event: edge.event,
        timestamp: Date.now()
      };
    });
    
    // Add custom actions if defined
    if (edge.metadata && edge.metadata.actions) {
      actions.push(...edge.metadata.actions);
    }
    
    return actions;
  }

  /**
   * Execute node action
   */
  private async executeNodeAction(action: any, context: FSMContext): Promise<void> {
    try {
      if (typeof action === 'function') {
        await action(context);
      } else if (typeof action === 'string') {
        // Handle string-based actions
        this.log(`Executing string action: ${action}`);
      } else if (action && typeof action === 'object') {
        // Handle object-based actions
        if (action.type && action.payload) {
          await this.executeStructuredAction(action, context);
        }
      }
    } catch (error) {
      this.logError('Failed to execute node action', error);
      throw error;
    }
  }

  /**
   * Execute structured action
   */
  private async executeStructuredAction(action: any, context: FSMContext): Promise<void> {
    switch (action.type) {
      case 'updateContext':
        Object.assign(context.data, action.payload);
        break;
      case 'setVariable':
        context.data[action.payload.name] = action.payload.value;
        break;
      case 'log':
        this.log(`Node action log: ${action.payload.message}`);
        break;
      default:
        this.log(`Unknown structured action type: ${action.type}`);
    }
  }

  /**
   * Add state mapping rule
   */
  addStateMappingRule(rule: StateMappingRule): void {
    this.stateMappingRules.set(rule.graphState.toLowerCase(), rule);
    this.reverseMappings.set(rule.fsmState, rule.graphState);
    this.log(`State mapping rule added: ${rule.graphState} -> ${rule.fsmState}`);
  }

  /**
   * Add transition mapping rule
   */
  addTransitionMappingRule(rule: TransitionMappingRule): void {
    this.transitionMappingRules.set(rule.graphEvent.toLowerCase(), rule);
    this.log(`Transition mapping rule added: ${rule.graphEvent} -> ${rule.fsmEvent}`);
  }

  /**
   * Remove state mapping rule
   */
  removeStateMappingRule(graphState: string): void {
    const rule = this.stateMappingRules.get(graphState.toLowerCase());
    if (rule) {
      this.stateMappingRules.delete(graphState.toLowerCase());
      this.reverseMappings.delete(rule.fsmState);
      this.log(`State mapping rule removed: ${graphState}`);
    }
  }

  /**
   * Remove transition mapping rule
   */
  removeTransitionMappingRule(graphEvent: string): void {
    if (this.transitionMappingRules.delete(graphEvent.toLowerCase())) {
      this.log(`Transition mapping rule removed: ${graphEvent}`);
    }
  }

  /**
   * Get all state mapping rules
   */
  getStateMappingRules(): StateMappingRule[] {
    return Array.from(this.stateMappingRules.values());
  }

  /**
   * Get all transition mapping rules
   */
  getTransitionMappingRules(): TransitionMappingRule[] {
    return Array.from(this.transitionMappingRules.values());
  }

  /**
   * Shutdown the state mapper
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down GraphStateMapper');
    
    this.stateMappingRules.clear();
    this.transitionMappingRules.clear();
    this.reverseMappings.clear();
    this.defaultMappings.clear();
    
    this.initialized = false;
    this.log('GraphStateMapper shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[GraphStateMapper] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[GraphStateMapper] ERROR: ${message}`, error || '');
  }
}

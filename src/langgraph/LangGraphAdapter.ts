/**
 * LangGraphAdapter - LangGraph to FSM Integration
 * Adapts LangGraph workflows to work with the FSM orchestration system
 */

import { 
  LangGraphNode, 
  LangGraphEdge, 
  LangGraphWorkflow, 
  FSMContext, 
  TransitionDefinition,
  StateDefinition,
  SystemState,
  SystemEvent
} from '../fsm/types/FSMTypes';
import { SystemStateMachine } from '../fsm/orchestration/SystemStateMachine';
import { GraphStateMapper } from './GraphStateMapper';
import { GraphTransitionManager } from './GraphTransitionManager';
import { GraphMemoryIntegration } from './GraphMemoryIntegration';

export interface LangGraphConfig {
  enableMemoryPersistence: boolean;
  maxNodeCount: number;
  parallelExecution: boolean;
  stateValidation: boolean;
  performanceMonitoring: boolean;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  currentNode: string;
  executionPath: string[];
  variables: Record<string, any>;
  startTime: number;
  metadata: Record<string, any>;
}

export class LangGraphAdapter {
  private initialized = false;
  private workflows: Map<string, LangGraphWorkflow> = new Map();
  private executionContexts: Map<string, WorkflowExecutionContext> = new Map();
  private stateMapper: GraphStateMapper;
  private transitionManager: GraphTransitionManager;
  private memoryIntegration: GraphMemoryIntegration;
  private systemFSM: SystemStateMachine | null = null;
  private config: LangGraphConfig;

  constructor(config: Partial<LangGraphConfig> = {}) {
    this.config = {
      enableMemoryPersistence: true,
      maxNodeCount: 1000,
      parallelExecution: true,
      stateValidation: true,
      performanceMonitoring: true,
      ...config
    };

    this.stateMapper = new GraphStateMapper();
    this.transitionManager = new GraphTransitionManager();
    this.memoryIntegration = new GraphMemoryIntegration();
  }

  /**
   * Initialize the LangGraph adapter
   */
  async initialize(systemFSM?: SystemStateMachine): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing LangGraphAdapter');
    
    this.systemFSM = systemFSM || null;
    
    // Initialize sub-components
    await this.stateMapper.initialize();
    await this.transitionManager.initialize();
    
    if (this.config.enableMemoryPersistence) {
      await this.memoryIntegration.initialize();
    }
    
    this.workflows.clear();
    this.executionContexts.clear();
    
    this.initialized = true;
    this.log('LangGraphAdapter initialized successfully');
  }

  /**
   * Register a LangGraph workflow
   */
  async registerWorkflow(workflow: LangGraphWorkflow): Promise<void> {
    if (!this.initialized) {
      throw new Error('LangGraphAdapter not initialized');
    }

    // Validate workflow
    this.validateWorkflow(workflow);
    
    // Convert LangGraph nodes to FSM states
    const fsmStates = await this.stateMapper.mapNodesToStates(workflow.nodes);
    
    // Convert LangGraph edges to FSM transitions
    const fsmTransitions = await this.stateMapper.mapEdgesToTransitions(workflow.edges);
    
    // Register with transition manager
    await this.transitionManager.registerWorkflowTransitions(
      workflow.id,
      fsmTransitions
    );
    
    // Store workflow
    this.workflows.set(workflow.id, workflow);
    
    // Persist to memory if enabled
    if (this.config.enableMemoryPersistence) {
      await this.memoryIntegration.persistWorkflow(workflow);
    }
    
    this.log(`Workflow registered: ${workflow.id} (${workflow.nodes.length} nodes, ${workflow.edges.length} edges)`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    initialData?: Record<string, any>,
    startNodeId?: string
  ): Promise<WorkflowExecutionContext> {
    if (!this.initialized) {
      throw new Error('LangGraphAdapter not initialized');
    }

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Create execution context
    const executionId = `${workflowId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startNode = startNodeId || this.findStartNode(workflow);
    
    const context: WorkflowExecutionContext = {
      workflowId: executionId,
      currentNode: startNode,
      executionPath: [startNode],
      variables: initialData || {},
      startTime: Date.now(),
      metadata: {
        originalWorkflowId: workflowId,
        totalNodes: workflow.nodes.length,
        executionMode: this.config.parallelExecution ? 'parallel' : 'sequential'
      }
    };
    
    this.executionContexts.set(executionId, context);
    
    try {
      // Execute workflow through FSM system
      if (this.systemFSM) {
        await this.executeWorkflowThroughFSM(workflow, context);
      } else {
        await this.executeWorkflowDirect(workflow, context);
      }
      
      this.log(`Workflow execution completed: ${executionId}`);
      return context;
      
    } catch (error) {
      this.logError(`Workflow execution failed: ${executionId}`, error);
      context.metadata.error = error.message;
      throw error;
    }
  }

  /**
   * Execute workflow through FSM system
   */
  private async executeWorkflowThroughFSM(
    workflow: LangGraphWorkflow,
    context: WorkflowExecutionContext
  ): Promise<void> {
    if (!this.systemFSM) {
      throw new Error('System FSM not available');
    }

    // Convert workflow execution to FSM transitions
    const fsmContext: FSMContext = {
      currentState: SystemState.ACTIVE,
      data: {
        workflowId: context.workflowId,
        currentNode: context.currentNode,
        variables: context.variables
      },
      timestamp: Date.now(),
      transitionHistory: [],
      metadata: {
        workflow,
        executionContext: context
      }
    };

    // Execute nodes in sequence or parallel based on configuration
    if (this.config.parallelExecution) {
      await this.executeNodesInParallel(workflow, context, fsmContext);
    } else {
      await this.executeNodesSequentially(workflow, context, fsmContext);
    }
  }

  /**
   * Execute workflow directly (without FSM)
   */
  private async executeWorkflowDirect(
    workflow: LangGraphWorkflow,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const visited = new Set<string>();
    const queue = [context.currentNode];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) {
        continue;
      }
      
      visited.add(nodeId);
      context.currentNode = nodeId;
      context.executionPath.push(nodeId);
      
      // Execute node
      await this.executeNode(workflow, nodeId, context);
      
      // Find next nodes
      const nextNodes = this.getNextNodes(workflow, nodeId);
      queue.push(...nextNodes);
    }
  }

  /**
   * Execute nodes in parallel
   */
  private async executeNodesInParallel(
    workflow: LangGraphWorkflow,
    context: WorkflowExecutionContext,
    fsmContext: FSMContext
  ): Promise<void> {
    const nodeGroups = this.groupNodesByDependencies(workflow);
    
    for (const group of nodeGroups) {
      const nodePromises = group.map(nodeId => 
        this.executeNodeWithFSM(workflow, nodeId, context, fsmContext)
      );
      
      await Promise.all(nodePromises);
    }
  }

  /**
   * Execute nodes sequentially
   */
  private async executeNodesSequentially(
    workflow: LangGraphWorkflow,
    context: WorkflowExecutionContext,
    fsmContext: FSMContext
  ): Promise<void> {
    const sortedNodes = this.topologicalSort(workflow);
    
    for (const nodeId of sortedNodes) {
      await this.executeNodeWithFSM(workflow, nodeId, context, fsmContext);
    }
  }

  /**
   * Execute a single node with FSM integration
   */
  private async executeNodeWithFSM(
    workflow: LangGraphWorkflow,
    nodeId: string,
    context: WorkflowExecutionContext,
    fsmContext: FSMContext
  ): Promise<void> {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Update context
    context.currentNode = nodeId;
    fsmContext.data.currentNode = nodeId;
    
    // Map node to FSM state if needed
    if (node.state && this.systemFSM) {
      const mappedState = await this.stateMapper.mapNodeStateToFSMState(node.state);
      
      if (mappedState !== fsmContext.currentState) {
        // Trigger state transition
        await this.systemFSM.sendEvent(SystemEvent.TRANSITION_COMPLETE);
      }
    }
    
    // Execute node logic
    await this.executeNode(workflow, nodeId, context);
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflow: LangGraphWorkflow,
    nodeId: string,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const startTime = Date.now();
    
    try {
      this.log(`Executing node: ${nodeId} (${node.name})`);
      
      // Execute based on node type
      switch (node.type) {
        case 'state':
          await this.executeStateNode(node, context);
          break;
        case 'transition':
          await this.executeTransitionNode(node, context);
          break;
        case 'condition':
          await this.executeConditionNode(node, context);
          break;
        default:
          this.log(`Unknown node type: ${node.type}`);
      }
      
      const duration = Date.now() - startTime;
      
      // Update execution metadata
      context.metadata.nodeExecutions = context.metadata.nodeExecutions || {};
      context.metadata.nodeExecutions[nodeId] = {
        duration,
        success: true,
        timestamp: startTime
      };
      
      this.log(`Node executed successfully: ${nodeId} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      context.metadata.nodeExecutions = context.metadata.nodeExecutions || {};
      context.metadata.nodeExecutions[nodeId] = {
        duration,
        success: false,
        error: error.message,
        timestamp: startTime
      };
      
      this.logError(`Node execution failed: ${nodeId}`, error);
      throw error;
    }
  }

  /**
   * Execute state node
   */
  private async executeStateNode(
    node: LangGraphNode,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // State nodes represent stable states in the workflow
    context.variables.currentState = node.state;
    
    // Execute any state-specific logic
    if (node.metadata.onEntry) {
      await this.executeNodeAction(node.metadata.onEntry, context);
    }
    
    // Simulate state processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Execute transition node
   */
  private async executeTransitionNode(
    node: LangGraphNode,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Transition nodes represent actions or operations
    if (node.metadata.action) {
      await this.executeNodeAction(node.metadata.action, context);
    }
    
    // Update variables based on transition
    if (node.metadata.updateVariables) {
      Object.assign(context.variables, node.metadata.updateVariables);
    }
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(
    node: LangGraphNode,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Condition nodes evaluate expressions and set results
    if (node.metadata.condition) {
      const result = this.evaluateCondition(node.metadata.condition, context);
      context.variables[`${node.id}_result`] = result;
    }
  }

  /**
   * Execute node action
   */
  private async executeNodeAction(action: any, context: WorkflowExecutionContext): Promise<void> {
    // This would integrate with actual action execution system
    // For now, simulate action execution
    if (typeof action === 'string') {
      this.log(`Executing action: ${action}`);
    } else if (typeof action === 'function') {
      await action(context);
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: any, context: WorkflowExecutionContext): boolean {
    // Simple condition evaluation - would be more sophisticated in practice
    if (typeof condition === 'string') {
      // Simple variable existence check
      return context.variables[condition] !== undefined;
    } else if (typeof condition === 'function') {
      return condition(context);
    }
    
    return true;
  }

  /**
   * Find start node in workflow
   */
  private findStartNode(workflow: LangGraphWorkflow): string {
    // Find node with no incoming edges
    const hasIncoming = new Set(workflow.edges.map(e => e.to));
    const startNodes = workflow.nodes.filter(n => !hasIncoming.has(n.id));
    
    if (startNodes.length === 0) {
      throw new Error('No start node found in workflow');
    }
    
    return startNodes[0].id;
  }

  /**
   * Get next nodes from current node
   */
  private getNextNodes(workflow: LangGraphWorkflow, nodeId: string): string[] {
    return workflow.edges
      .filter(e => e.from === nodeId)
      .map(e => e.to);
  }

  /**
   * Group nodes by dependency levels for parallel execution
   */
  private groupNodesByDependencies(workflow: LangGraphWorkflow): string[][] {
    const groups: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();
    
    // Calculate in-degrees
    workflow.nodes.forEach(node => inDegree.set(node.id, 0));
    workflow.edges.forEach(edge => {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });
    
    // Group nodes by dependency level
    while (visited.size < workflow.nodes.length) {
      const currentGroup: string[] = [];
      
      // Find nodes with no dependencies in current level
      for (const node of workflow.nodes) {
        if (!visited.has(node.id) && inDegree.get(node.id) === 0) {
          currentGroup.push(node.id);
          visited.add(node.id);
        }
      }
      
      if (currentGroup.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }
      
      groups.push(currentGroup);
      
      // Update in-degrees for next iteration
      currentGroup.forEach(nodeId => {
        workflow.edges
          .filter(e => e.from === nodeId)
          .forEach(e => {
            inDegree.set(e.to, (inDegree.get(e.to) || 0) - 1);
          });
      });
    }
    
    return groups;
  }

  /**
   * Topological sort of nodes
   */
  private topologicalSort(workflow: LangGraphWorkflow): string[] {
    const groups = this.groupNodesByDependencies(workflow);
    return groups.flat();
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflow(workflow: LangGraphWorkflow): void {
    if (workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }
    
    if (workflow.nodes.length > this.config.maxNodeCount) {
      throw new Error(`Workflow exceeds maximum node count: ${this.config.maxNodeCount}`);
    }
    
    // Validate node IDs are unique
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    if (nodeIds.size !== workflow.nodes.length) {
      throw new Error('Workflow nodes must have unique IDs');
    }
    
    // Validate edges reference existing nodes
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.from)) {
        throw new Error(`Edge references non-existent from node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        throw new Error(`Edge references non-existent to node: ${edge.to}`);
      }
    }
  }

  /**
   * Get execution context
   */
  getExecutionContext(executionId: string): WorkflowExecutionContext | undefined {
    return this.executionContexts.get(executionId);
  }

  /**
   * Get all registered workflows
   */
  getWorkflows(): LangGraphWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): LangGraphWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Remove workflow
   */
  async removeWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }
    
    // Remove from transition manager
    await this.transitionManager.removeWorkflowTransitions(workflowId);
    
    // Remove from memory if enabled
    if (this.config.enableMemoryPersistence) {
      await this.memoryIntegration.removeWorkflow(workflowId);
    }
    
    // Remove from local storage
    this.workflows.delete(workflowId);
    
    this.log(`Workflow removed: ${workflowId}`);
    return true;
  }

  /**
   * Shutdown the adapter
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down LangGraphAdapter');
    
    await this.stateMapper.shutdown();
    await this.transitionManager.shutdown();
    
    if (this.config.enableMemoryPersistence) {
      await this.memoryIntegration.shutdown();
    }
    
    this.workflows.clear();
    this.executionContexts.clear();
    
    this.initialized = false;
    this.log('LangGraphAdapter shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[LangGraphAdapter] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[LangGraphAdapter] ERROR: ${message}`, error || '');
  }
}

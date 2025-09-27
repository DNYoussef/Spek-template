/**
 * StateGraph - Visual State Graph Representation and Manipulation
 * Provides graph-based representation of state machines with support for
 * visualization, analysis, and manipulation of complex state relationships.
 */

export interface StateNode {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final' | 'error';
  metadata: {
    description?: string;
    timeout?: number;
    retryCount?: number;
    tags?: string[];
  };
  position?: {
    x: number;
    y: number;
  };
  data?: any;
}

export interface StateTransition {
  id: string;
  fromState: string;
  toState: string;
  event: string;
  condition?: string;
  action?: string;
  metadata: {
    description?: string;
    weight?: number;
    probability?: number;
  };
}

export interface StateGraphDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: StateNode[];
  transitions: StateTransition[];
  initialState: string;
  finalStates: string[];
  metadata: {
    version: string;
    created: Date;
    modified: Date;
    author?: string;
  };
}

export interface GraphAnalysis {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    nodeCount: number;
    transitionCount: number;
    cyclomaticComplexity: number;
    averagePathLength: number;
    deadEnds: string[];
    unreachableStates: string[];
    stronglyConnectedComponents: string[][];
  };
}

export interface PathAnalysis {
  paths: StatePath[];
  shortestPath?: StatePath;
  longestPath?: StatePath;
  criticalPaths: StatePath[];
}

export interface StatePath {
  nodes: string[];
  transitions: string[];
  totalWeight: number;
  probability: number;
  description: string;
}

export class StateGraph {
  private definition: StateGraphDefinition;
  private adjacencyList: Map<string, Set<string>>;
  private reverseAdjacencyList: Map<string, Set<string>>;
  private transitionMap: Map<string, StateTransition>;

  constructor(definition: StateGraphDefinition) {
    this.definition = definition;
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.transitionMap = new Map();
    this.buildAdjacencyLists();
    this.validateGraph();
  }

  /**
   * Get the complete graph definition
   */
  getDefinition(): StateGraphDefinition {
    return { ...this.definition };
  }

  /**
   * Add a new state node to the graph
   */
  addNode(node: StateNode): void {
    if (this.definition.nodes.find(n => n.id === node.id)) {
      throw new Error(`Node with id '${node.id}' already exists`);
    }

    this.definition.nodes.push(node);
    this.adjacencyList.set(node.id, new Set());
    this.reverseAdjacencyList.set(node.id, new Set());
    this.updateMetadata();
  }

  /**
   * Remove a state node from the graph
   */
  removeNode(nodeId: string): void {
    const nodeIndex = this.definition.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error(`Node with id '${nodeId}' not found`);
    }

    // Remove all transitions involving this node
    this.definition.transitions = this.definition.transitions.filter(
      t => t.fromState !== nodeId && t.toState !== nodeId
    );

    // Remove from nodes array
    this.definition.nodes.splice(nodeIndex, 1);

    // Rebuild adjacency lists
    this.buildAdjacencyLists();
    this.updateMetadata();
  }

  /**
   * Add a state transition
   */
  addTransition(transition: StateTransition): void {
    // Validate that both states exist
    if (!this.definition.nodes.find(n => n.id === transition.fromState)) {
      throw new Error(`From state '${transition.fromState}' not found`);
    }
    if (!this.definition.nodes.find(n => n.id === transition.toState)) {
      throw new Error(`To state '${transition.toState}' not found`);
    }

    // Check for duplicate transitions
    const existingTransition = this.definition.transitions.find(
      t => t.fromState === transition.fromState &&
           t.toState === transition.toState &&
           t.event === transition.event
    );

    if (existingTransition) {
      throw new Error(
        `Transition already exists: ${transition.fromState} -> ${transition.toState} on ${transition.event}`
      );
    }

    this.definition.transitions.push(transition);
    this.transitionMap.set(transition.id, transition);

    // Update adjacency lists
    this.adjacencyList.get(transition.fromState)?.add(transition.toState);
    this.reverseAdjacencyList.get(transition.toState)?.add(transition.fromState);

    this.updateMetadata();
  }

  /**
   * Remove a state transition
   */
  removeTransition(transitionId: string): void {
    const transitionIndex = this.definition.transitions.findIndex(t => t.id === transitionId);
    if (transitionIndex === -1) {
      throw new Error(`Transition with id '${transitionId}' not found`);
    }

    const transition = this.definition.transitions[transitionIndex];
    this.definition.transitions.splice(transitionIndex, 1);
    this.transitionMap.delete(transitionId);

    // Rebuild adjacency lists to ensure consistency
    this.buildAdjacencyLists();
    this.updateMetadata();
  }

  /**
   * Get all possible next states from a given state
   */
  getNextStates(stateId: string): string[] {
    const nextStates = this.adjacencyList.get(stateId);
    return nextStates ? Array.from(nextStates) : [];
  }

  /**
   * Get all possible previous states to a given state
   */
  getPreviousStates(stateId: string): string[] {
    const previousStates = this.reverseAdjacencyList.get(stateId);
    return previousStates ? Array.from(previousStates) : [];
  }

  /**
   * Get all transitions from a specific state
   */
  getTransitionsFromState(stateId: string): StateTransition[] {
    return this.definition.transitions.filter(t => t.fromState === stateId);
  }

  /**
   * Get all transitions to a specific state
   */
  getTransitionsToState(stateId: string): StateTransition[] {
    return this.definition.transitions.filter(t => t.toState === stateId);
  }

  /**
   * Find all possible paths between two states
   */
  findPaths(fromState: string, toState: string, maxDepth: number = 10): StatePath[] {
    const paths: StatePath[] = [];
    const visited = new Set<string>();

    const dfs = (
      currentState: string,
      targetState: string,
      currentPath: string[],
      currentTransitions: string[],
      depth: number
    ): void => {
      if (depth > maxDepth) return;

      if (currentState === targetState) {
        paths.push({
          nodes: [...currentPath],
          transitions: [...currentTransitions],
          totalWeight: this.calculatePathWeight(currentTransitions),
          probability: this.calculatePathProbability(currentTransitions),
          description: this.generatePathDescription(currentPath, currentTransitions)
        });
        return;
      }

      if (visited.has(currentState)) return;

      visited.add(currentState);

      const transitions = this.getTransitionsFromState(currentState);
      for (const transition of transitions) {
        currentPath.push(transition.toState);
        currentTransitions.push(transition.id);

        dfs(transition.toState, targetState, currentPath, currentTransitions, depth + 1);

        currentPath.pop();
        currentTransitions.pop();
      }

      visited.delete(currentState);
    };

    dfs(fromState, toState, [fromState], [], 0);
    return paths;
  }

  /**
   * Analyze the graph structure and detect issues
   */
  analyzeGraph(): GraphAnalysis {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unreachable states
    const reachableStates = this.findReachableStates();
    const unreachableStates = this.definition.nodes
      .filter(node => !reachableStates.has(node.id))
      .map(node => node.id);

    if (unreachableStates.length > 0) {
      warnings.push(`Unreachable states found: ${unreachableStates.join(', ')}`);
    }

    // Check for dead ends (states with no outgoing transitions except final states)
    const deadEnds = this.definition.nodes
      .filter(node =>
        !this.definition.finalStates.includes(node.id) &&
        this.getTransitionsFromState(node.id).length === 0
      )
      .map(node => node.id);

    if (deadEnds.length > 0) {
      warnings.push(`Dead end states found: ${deadEnds.join(', ')}`);
    }

    // Check if initial state exists
    if (!this.definition.nodes.find(n => n.id === this.definition.initialState)) {
      errors.push(`Initial state '${this.definition.initialState}' not found`);
    }

    // Check if all final states exist
    const missingFinalStates = this.definition.finalStates.filter(
      finalState => !this.definition.nodes.find(n => n.id === finalState)
    );

    if (missingFinalStates.length > 0) {
      errors.push(`Final states not found: ${missingFinalStates.join(', ')}`);
    }

    // Calculate strongly connected components
    const stronglyConnectedComponents = this.findStronglyConnectedComponents();

    // Calculate metrics
    const metrics = {
      nodeCount: this.definition.nodes.length,
      transitionCount: this.definition.transitions.length,
      cyclomaticComplexity: this.calculateCyclomaticComplexity(),
      averagePathLength: this.calculateAveragePathLength(),
      deadEnds,
      unreachableStates,
      stronglyConnectedComponents
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }

  /**
   * Optimize the graph layout for visualization
   */
  optimizeLayout(): void {
    // Implement a simple force-directed layout algorithm
    const nodes = this.definition.nodes;
    const iterations = 100;
    const k = Math.sqrt((800 * 600) / nodes.length); // Ideal distance
    const c1 = 2; // Repulsive force constant
    const c2 = 1; // Attractive force constant
    const dt = 0.1; // Time step

    // Initialize positions if not set
    nodes.forEach((node, index) => {
      if (!node.position) {
        node.position = {
          x: Math.random() * 800,
          y: Math.random() * 600
        };
      }
    });

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();

      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Calculate repulsive forces
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          const dx = node1.position!.x - node2.position!.x;
          const dy = node1.position!.y - node2.position!.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = c1 * k * k / distance;
          const fx = force * dx / distance;
          const fy = force * dy / distance;

          const force1 = forces.get(node1.id)!;
          const force2 = forces.get(node2.id)!;

          force1.x += fx;
          force1.y += fy;
          force2.x -= fx;
          force2.y -= fy;
        }
      }

      // Calculate attractive forces for connected nodes
      this.definition.transitions.forEach(transition => {
        const fromNode = nodes.find(n => n.id === transition.fromState)!;
        const toNode = nodes.find(n => n.id === transition.toState)!;

        const dx = toNode.position!.x - fromNode.position!.x;
        const dy = toNode.position!.y - fromNode.position!.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = c2 * distance * distance / k;
        const fx = force * dx / distance;
        const fy = force * dy / distance;

        const fromForce = forces.get(fromNode.id)!;
        const toForce = forces.get(toNode.id)!;

        fromForce.x += fx;
        fromForce.y += fy;
        toForce.x -= fx;
        toForce.y -= fy;
      });

      // Apply forces
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        node.position!.x += force.x * dt;
        node.position!.y += force.y * dt;

        // Keep nodes within bounds
        node.position!.x = Math.max(50, Math.min(750, node.position!.x));
        node.position!.y = Math.max(50, Math.min(550, node.position!.y));
      });
    }

    this.updateMetadata();
  }

  /**
   * Export graph to various formats
   */
  export(format: 'json' | 'dot' | 'mermaid'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.definition, null, 2);

      case 'dot':
        return this.exportToDot();

      case 'mermaid':
        return this.exportToMermaid();

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import graph from JSON definition
   */
  static fromJSON(json: string): StateGraph {
    const definition = JSON.parse(json) as StateGraphDefinition;
    return new StateGraph(definition);
  }

  /**
   * Build adjacency lists for efficient traversal
   */
  private buildAdjacencyLists(): void {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.transitionMap.clear();

    // Initialize adjacency lists
    this.definition.nodes.forEach(node => {
      this.adjacencyList.set(node.id, new Set());
      this.reverseAdjacencyList.set(node.id, new Set());
    });

    // Build adjacency lists from transitions
    this.definition.transitions.forEach(transition => {
      this.adjacencyList.get(transition.fromState)?.add(transition.toState);
      this.reverseAdjacencyList.get(transition.toState)?.add(transition.fromState);
      this.transitionMap.set(transition.id, transition);
    });
  }

  /**
   * Validate the graph structure
   */
  private validateGraph(): void {
    const analysis = this.analyzeGraph();
    if (!analysis.isValid) {
      throw new Error(`Invalid graph: ${analysis.errors.join(', ')}`);
    }
  }

  /**
   * Find all reachable states from the initial state
   */
  private findReachableStates(): Set<string> {
    const reachable = new Set<string>();
    const queue: string[] = [this.definition.initialState];

    while (queue.length > 0) {
      const currentState = queue.shift()!;
      if (reachable.has(currentState)) continue;

      reachable.add(currentState);
      const nextStates = this.getNextStates(currentState);
      queue.push(...nextStates);
    }

    return reachable;
  }

  /**
   * Find strongly connected components using Tarjan's algorithm
   */
  private findStronglyConnectedComponents(): string[][] {
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const components: string[][] = [];
    let indexCounter = 0;

    const strongConnect = (v: string): void => {
      index.set(v, indexCounter);
      lowlink.set(v, indexCounter);
      indexCounter++;
      stack.push(v);
      onStack.add(v);

      const nextStates = this.getNextStates(v);
      for (const w of nextStates) {
        if (!index.has(w)) {
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
        }
      }

      if (lowlink.get(v) === index.get(v)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== v);
        components.push(component);
      }
    };

    for (const node of this.definition.nodes) {
      if (!index.has(node.id)) {
        strongConnect(node.id);
      }
    }

    return components.filter(component => component.length > 1);
  }

  /**
   * Calculate cyclomatic complexity of the graph
   */
  private calculateCyclomaticComplexity(): number {
    const edges = this.definition.transitions.length;
    const nodes = this.definition.nodes.length;
    const components = this.findStronglyConnectedComponents().length;
    return edges - nodes + 2 * components;
  }

  /**
   * Calculate average path length from initial state to all final states
   */
  private calculateAveragePathLength(): number {
    let totalLength = 0;
    let pathCount = 0;

    for (const finalState of this.definition.finalStates) {
      const paths = this.findPaths(this.definition.initialState, finalState, 20);
      for (const path of paths) {
        totalLength += path.nodes.length - 1; // Subtract 1 because we count edges, not nodes
        pathCount++;
      }
    }

    return pathCount > 0 ? totalLength / pathCount : 0;
  }

  /**
   * Calculate the weight of a path based on transition weights
   */
  private calculatePathWeight(transitionIds: string[]): number {
    return transitionIds.reduce((total, transitionId) => {
      const transition = this.transitionMap.get(transitionId);
      return total + (transition?.metadata.weight || 1);
    }, 0);
  }

  /**
   * Calculate the probability of a path based on transition probabilities
   */
  private calculatePathProbability(transitionIds: string[]): number {
    return transitionIds.reduce((total, transitionId) => {
      const transition = this.transitionMap.get(transitionId);
      return total * (transition?.metadata.probability || 1);
    }, 1);
  }

  /**
   * Generate a human-readable description of a path
   */
  private generatePathDescription(nodes: string[], transitionIds: string[]): string {
    const parts: string[] = [];
    for (let i = 0; i < transitionIds.length; i++) {
      const transition = this.transitionMap.get(transitionIds[i]);
      if (transition) {
        parts.push(`${nodes[i]} --${transition.event}--> ${nodes[i + 1]}`);
      }
    }
    return parts.join(' -> ');
  }

  /**
   * Export graph to DOT format for Graphviz
   */
  private exportToDot(): string {
    let dot = `digraph "${this.definition.name}" {\n`;
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=circle];\n\n';

    // Add nodes
    this.definition.nodes.forEach(node => {
      const shape = node.type === 'initial' ? 'doublecircle' :
                   node.type === 'final' ? 'doublecircle' :
                   node.type === 'error' ? 'octagon' : 'circle';
      dot += `  "${node.id}" [label="${node.name}", shape=${shape}];\n`;
    });

    dot += '\n';

    // Add transitions
    this.definition.transitions.forEach(transition => {
      dot += `  "${transition.fromState}" -> "${transition.toState}" [label="${transition.event}"];\n`;
    });

    dot += '}\n';
    return dot;
  }

  /**
   * Export graph to Mermaid format
   */
  private exportToMermaid(): string {
    let mermaid = 'stateDiagram-v2\n';

    // Add transitions
    this.definition.transitions.forEach(transition => {
      mermaid += `  ${transition.fromState} --> ${transition.toState} : ${transition.event}\n`;
    });

    return mermaid;
  }

  /**
   * Update metadata timestamp
   */
  private updateMetadata(): void {
    this.definition.metadata.modified = new Date();
  }
}

export default StateGraph;
/**
 * DependencyGraphEngine - Graph analysis and cycle detection for dependencies
 *
 * Handles dependency graph construction, cycle detection, and topological ordering
 * with NASA Rule 10 compliance and FSM-based state management.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 * @component DependencyConflictResolver decomposition
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from '../../../shared/mega-fsm/MegaTransitionHub';
import { ComponentConfig, ProcessInput, ProcessResult } from '../../../shared/mega-fsm/types/MegaDecompositionTypes';

// NASA Rule 10: Fixed bounds constants
const MAX_GRAPH_NODES = 500;
const MAX_GRAPH_EDGES = 2000;
const MAX_CYCLE_DETECTION_DEPTH = 100;
const MAX_TOPOLOGICAL_SORT_ITERATIONS = 1000;
const MAX_SCC_COMPONENTS = 50;

export interface DomainNode {
  domainId: string;
  domainName: string;
  currentLoad: number;
  capacity: number;
  availability: number;
  dependencies: string[];
  dependents: string[];
  status: 'idle' | 'busy' | 'overloaded' | 'unavailable';
}

export interface DependencyEdge {
  edgeId: string;
  fromDomain: string;
  toDomain: string;
  dependencyIds: string[];
  weight: number;
  latency: number;
  reliability: number;
}

export interface DependencyGraph {
  nodes: Map<string, DomainNode>;
  edges: Map<string, DependencyEdge>;
  stronglyConnectedComponents: string[][];
  topologicalOrder: string[];
  hasCycles: boolean;
  criticalPath: string[];
}

export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: string[][];
  cycleNodes: Set<string>;
  breakpoints: CycleBreakpoint[];
}

export interface CycleBreakpoint {
  edgeId: string;
  fromDomain: string;
  toDomain: string;
  impact: number;
  riskLevel: 'low' | 'medium' | 'high';
  alternativePaths: string[];
}

/**
 * DependencyGraphEngine manages dependency graph operations
 * NASA Rule 10: All functions ≤60 lines, no recursion, bounded operations
 */
export class DependencyGraphEngine {
  private transitionHub: MegaTransitionHub;
  private dependencyGraph: DependencyGraph;
  private visitedNodes: Set<string> = new Set();
  private processingStack: string[] = [];

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.dependencyGraph = this.initializeGraph();
    this.validateConfiguration();
  }

  /**
   * Build dependency graph from domain dependencies
   * NASA Rule 10: Fixed bounds, no recursion
   */
  public buildGraph(domains: string[], dependencies: any[]): DependencyGraph {
    // NASA Rule 10: Input validation assertions
    console.assert(domains.length <= MAX_GRAPH_NODES, 'Too many domains for graph');
    console.assert(dependencies.length <= MAX_GRAPH_EDGES, 'Too many dependencies for graph');

    // Clear existing graph
    this.dependencyGraph.nodes.clear();
    this.dependencyGraph.edges.clear();

    // Add domain nodes with bounds
    for (let i = 0; i < Math.min(domains.length, MAX_GRAPH_NODES); i++) {
      const domain = domains[i];
      this.addDomainNode(domain);
    }

    // Add dependency edges with bounds
    for (let i = 0; i < Math.min(dependencies.length, MAX_GRAPH_EDGES); i++) {
      const dependency = dependencies[i];
      this.addDependencyEdge(dependency);
    }

    // Perform graph analysis
    this.dependencyGraph.hasCycles = this.detectCycles();
    this.dependencyGraph.topologicalOrder = this.computeTopologicalOrder();
    this.dependencyGraph.stronglyConnectedComponents = this.findStronglyConnectedComponents();
    this.dependencyGraph.criticalPath = this.findCriticalPath();

    // NASA Rule 10: Assertion
    console.assert(this.dependencyGraph.nodes.size <= MAX_GRAPH_NODES, 'Graph nodes exceed maximum');

    return this.dependencyGraph;
  }

  /**
   * Add domain node to graph
   * NASA Rule 10: Simple addition with bounds check
   */
  private addDomainNode(domainId: string): void {
    console.assert(domainId.length > 0, 'Domain ID cannot be empty');
    console.assert(this.dependencyGraph.nodes.size < MAX_GRAPH_NODES, 'Graph nodes at maximum capacity');

    const node: DomainNode = {
      domainId,
      domainName: domainId,
      currentLoad: 0,
      capacity: 100,
      availability: 1.0,
      dependencies: [],
      dependents: [],
      status: 'idle'
    };

    this.dependencyGraph.nodes.set(domainId, node);
  }

  /**
   * Add dependency edge to graph
   * NASA Rule 10: Simple addition with validation
   */
  private addDependencyEdge(dependency: any): void {
    console.assert(this.dependencyGraph.edges.size < MAX_GRAPH_EDGES, 'Graph edges at maximum capacity');

    const edge: DependencyEdge = {
      edgeId: dependency.dependencyId || `edge-${Date.now()}`,
      fromDomain: dependency.dependentDomain,
      toDomain: dependency.providerDomain,
      dependencyIds: [dependency.dependencyId],
      weight: this.calculateEdgeWeight(dependency),
      latency: dependency.estimatedTime || 1000,
      reliability: 0.95
    };

    this.dependencyGraph.edges.set(edge.edgeId, edge);

    // Update node connections
    const fromNode = this.dependencyGraph.nodes.get(edge.fromDomain);
    const toNode = this.dependencyGraph.nodes.get(edge.toDomain);

    if (fromNode && toNode) {
      fromNode.dependencies.push(edge.toDomain);
      toNode.dependents.push(edge.fromDomain);
    }
  }

  /**
   * Detect cycles in dependency graph using iterative DFS
   * NASA Rule 10: Fixed bounds, no recursion
   */
  public detectCycles(): boolean {
    this.visitedNodes.clear();
    this.processingStack = [];

    // NASA Rule 10: Bounded iteration over nodes
    const nodeIds = Array.from(this.dependencyGraph.nodes.keys());
    for (let i = 0; i < Math.min(nodeIds.length, MAX_GRAPH_NODES); i++) {
      const nodeId = nodeIds[i];

      if (!this.visitedNodes.has(nodeId)) {
        if (this.detectCycleFromNode(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect cycle from specific node using iterative approach
   * NASA Rule 10: Fixed bounds, no recursion
   */
  private detectCycleFromNode(startNodeId: string): boolean {
    const stack = [{ nodeId: startNodeId, depth: 0 }];
    const pathStack = new Set<string>();

    // NASA Rule 10: Bounded iterative traversal
    while (stack.length > 0 && stack.length < MAX_CYCLE_DETECTION_DEPTH) {
      const { nodeId, depth } = stack.pop()!;

      if (pathStack.has(nodeId)) {
        return true; // Cycle detected
      }

      if (this.visitedNodes.has(nodeId) || depth > MAX_CYCLE_DETECTION_DEPTH) {
        continue;
      }

      this.visitedNodes.add(nodeId);
      pathStack.add(nodeId);

      // Add neighbors to stack
      const node = this.dependencyGraph.nodes.get(nodeId);
      if (node) {
        for (let i = 0; i < Math.min(node.dependencies.length, 10); i++) {
          const neighborId = node.dependencies[i];
          stack.push({ nodeId: neighborId, depth: depth + 1 });
        }
      }

      pathStack.delete(nodeId);
    }

    return false;
  }

  /**
   * Compute topological order using Kahn's algorithm
   * NASA Rule 10: Fixed bounds, iterative approach
   */
  private computeTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    const result: string[] = [];
    const queue: string[] = [];

    // Initialize in-degrees
    for (const [nodeId] of this.dependencyGraph.nodes) {
      inDegree.set(nodeId, 0);
    }

    // Calculate in-degrees
    for (const [, edge] of this.dependencyGraph.edges) {
      const currentDegree = inDegree.get(edge.toDomain) || 0;
      inDegree.set(edge.toDomain, currentDegree + 1);
    }

    // Find nodes with zero in-degree
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // NASA Rule 10: Bounded processing
    let iterations = 0;
    while (queue.length > 0 && iterations < MAX_TOPOLOGICAL_SORT_ITERATIONS) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const node = this.dependencyGraph.nodes.get(nodeId);
      if (node) {
        // Update in-degrees of neighbors
        for (let i = 0; i < Math.min(node.dependencies.length, 20); i++) {
          const neighborId = node.dependencies[i];
          const currentDegree = inDegree.get(neighborId) || 0;
          const newDegree = currentDegree - 1;
          inDegree.set(neighborId, newDegree);

          if (newDegree === 0) {
            queue.push(neighborId);
          }
        }
      }

      iterations++;
    }

    // NASA Rule 10: Assertion
    console.assert(iterations < MAX_TOPOLOGICAL_SORT_ITERATIONS, 'Topological sort exceeded maximum iterations');

    return result;
  }

  /**
   * Find strongly connected components using iterative approach
   * NASA Rule 10: Fixed bounds, simplified implementation
   */
  private findStronglyConnectedComponents(): string[][] {
    const components: string[][] = [];
    const visited = new Set<string>();

    // NASA Rule 10: Bounded iteration
    const nodeIds = Array.from(this.dependencyGraph.nodes.keys());
    for (let i = 0; i < Math.min(nodeIds.length, MAX_GRAPH_NODES); i++) {
      const nodeId = nodeIds[i];

      if (!visited.has(nodeId)) {
        const component = this.findComponentFromNode(nodeId, visited);
        if (component.length > 0) {
          components.push(component);
        }

        if (components.length >= MAX_SCC_COMPONENTS) {
          break;
        }
      }
    }

    return components;
  }

  /**
   * Find component from specific node
   * NASA Rule 10: Bounded traversal
   */
  private findComponentFromNode(startNodeId: string, visited: Set<string>): string[] {
    const component: string[] = [];
    const stack = [startNodeId];

    // NASA Rule 10: Bounded traversal
    while (stack.length > 0 && component.length < 50) {
      const nodeId = stack.pop()!;

      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        component.push(nodeId);

        // Add connected nodes
        const node = this.dependencyGraph.nodes.get(nodeId);
        if (node) {
          for (let i = 0; i < Math.min(node.dependencies.length, 5); i++) {
            const connectedId = node.dependencies[i];
            if (!visited.has(connectedId)) {
              stack.push(connectedId);
            }
          }
        }
      }
    }

    return component;
  }

  /**
   * Find critical path through graph
   * NASA Rule 10: Simplified implementation with bounds
   */
  private findCriticalPath(): string[] {
    // Simplified critical path - return topological order for now
    return this.dependencyGraph.topologicalOrder.slice(0, 20);
  }

  /**
   * Calculate edge weight based on dependency properties
   */
  private calculateEdgeWeight(dependency: any): number {
    const priorityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    return priorityWeights[dependency.priority] || 1;
  }

  /**
   * Initialize empty graph
   */
  private initializeGraph(): DependencyGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      stronglyConnectedComponents: [],
      topologicalOrder: [],
      hasCycles: false,
      criticalPath: []
    };
  }

  /**
   * Get current dependency graph
   */
  public getGraph(): DependencyGraph {
    return this.dependencyGraph;
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(MAX_GRAPH_NODES > 0, 'Maximum graph nodes must be positive');
    console.assert(MAX_GRAPH_EDGES > 0, 'Maximum graph edges must be positive');
    console.assert(MAX_CYCLE_DETECTION_DEPTH > 0, 'Maximum cycle detection depth must be positive');
  }
}
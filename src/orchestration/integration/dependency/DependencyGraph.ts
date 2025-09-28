/**
 * CODEX AGENT 008 - Dependency Graph Operations
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loop bounds
 * FSM-First Design: Graph operations with iterative algorithms only
 */

import { EventEmitter } from 'events';
import {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  GraphStatistics,
  GraphBuildOptions,
  CircularDependency,
  DEFAULT_CONFIG,
  DependencyState
} from './DependencyTypes';
import { generateSecureId } from './DependencyCore';

export class DependencyGraphBuilder extends EventEmitter {
  private readonly maxGraphSize: number = DEFAULT_CONFIG.MAX_GRAPH_SIZE;

  constructor() {
    super();
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  public async buildGraph(
    graphId: string,
    components: any[],
    options: GraphBuildOptions = {}
  ): Promise<DependencyGraph> {
    if (components.length > this.maxGraphSize) {
      throw new Error(`Component count exceeds maximum: ${this.maxGraphSize}`);
    }

    this.emit('graph:build_started', { graphId, componentCount: components.length });

    const graph: DependencyGraph = {
      graphId,
      graphName: `Dependency Graph ${graphId}`,
      description: 'System component dependency graph',
      version: '1.0.0',
      nodes: new Map(),
      edges: new Map(),
      resolutionOrder: [],
      circularDependencies: [],
      criticalPath: [],
      statistics: this.initializeStatistics()
    };

    // Create nodes - fixed bound loop
    for (let i = 0; i < Math.min(components.length, this.maxGraphSize); i++) {
      const node = this.createNode(components[i]);
      graph.nodes.set(node.nodeId, node);
    }

    // Create edges - fixed bound nested loops
    await this.createEdges(graph, components, options);

    // Update statistics
    this.updateStatistics(graph);

    this.emit('graph:build_completed', { graphId, nodeCount: graph.nodes.size });
    return graph;
  }

  // NASA Rule 10: Function ≤60 lines
  private createNode(component: any): DependencyNode {
    return {
      nodeId: component.componentId || `node-${Date.now()}-${generateSecureId()}`,
      componentId: component.componentId,
      componentName: component.componentName || component.name,
      componentType: component.componentType || 'service',
      version: component.version || '1.0.0',
      location: component.location || '',
      status: DependencyState.PENDING,
      dependencies: [],
      dependents: [],
      metadata: {
        description: component.description || '',
        owner: component.owner || 'system',
        criticality: component.criticality || 'medium',
        stability: component.stability || 'stable',
        supportLevel: component.supportLevel || 'community',
        documentation: component.documentation || '',
        healthEndpoint: component.healthEndpoint,
        monitoringConfig: component.monitoringConfig
      }
    };
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private async createEdges(
    graph: DependencyGraph,
    components: any[],
    options: GraphBuildOptions
  ): Promise<void> {
    const maxComponents = Math.min(components.length, this.maxGraphSize);
    const maxDependencies = 50; // Fixed bound per component

    for (let i = 0; i < maxComponents; i++) {
      const component = components[i];
      const sourceNode = graph.nodes.get(component.componentId);
      if (!sourceNode) continue;

      const dependencies = component.dependencies || [];
      const depCount = Math.min(dependencies.length, maxDependencies);

      for (let j = 0; j < depCount; j++) {
        const dependency = dependencies[j];
        await this.createSingleEdge(graph, sourceNode, dependency, options);
      }
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private async createSingleEdge(
    graph: DependencyGraph,
    sourceNode: DependencyNode,
    dependency: any,
    options: GraphBuildOptions
  ): Promise<void> {
    const targetNodeId = typeof dependency === 'string' ? dependency : dependency.componentId;
    const targetNode = graph.nodes.get(targetNodeId);

    if (!targetNode) return;

    const edge = this.createEdge(sourceNode, targetNode, dependency);

    // Skip optional dependencies if not included
    if (edge.dependencyType === 'optional' && !options.includeOptional) {
      return;
    }

    graph.edges.set(edge.edgeId, edge);
    sourceNode.dependencies.push(edge);
    targetNode.dependents.push(sourceNode.nodeId);
  }

  // NASA Rule 10: Function ≤60 lines
  private createEdge(
    sourceNode: DependencyNode,
    targetNode: DependencyNode,
    dependencyConfig: any
  ): DependencyEdge {
    const edgeId = `edge-${sourceNode.nodeId}-${targetNode.nodeId}-${Date.now()}`;

    return {
      edgeId,
      sourceNodeId: sourceNode.nodeId,
      targetNodeId: targetNode.nodeId,
      dependencyType: dependencyConfig.type || 'hard',
      requirement: {
        requirementId: `req-${edgeId}`,
        name: dependencyConfig.name || `${sourceNode.componentName} depends on ${targetNode.componentName}`,
        description: dependencyConfig.description || 'Component dependency',
        type: dependencyConfig.requirementType || 'availability',
        criteria: {
          operator: dependencyConfig.operator || '==',
          value: dependencyConfig.value || true,
          customValidator: dependencyConfig.customValidator
        },
        validator: dependencyConfig.validator || 'availability',
        timeout: dependencyConfig.timeout || DEFAULT_CONFIG.DEFAULT_TIMEOUT,
        retryPolicy: {
          maxRetries: DEFAULT_CONFIG.RETRY_LIMIT,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryableErrors: ['timeout', 'network_error', 'temporary_failure'],
          escalationThreshold: 2
        }
      },
      status: 'pending',
      lastChecked: 0,
      checkCount: 0,
      maxRetries: DEFAULT_CONFIG.RETRY_LIMIT
    };
  }

  // NASA Rule 10: Function ≤60 lines
  private updateStatistics(graph: DependencyGraph): void {
    const resolvedNodes = Array.from(graph.nodes.values())
      .filter(n => n.status === DependencyState.RESOLVED).length;
    const failedNodes = Array.from(graph.nodes.values())
      .filter(n => n.status === DependencyState.FAILED).length;

    graph.statistics = {
      totalNodes: graph.nodes.size,
      totalEdges: graph.edges.size,
      resolvedNodes,
      failedNodes,
      circularDependencies: graph.circularDependencies.length,
      criticalPathLength: graph.criticalPath.length,
      averageResolutionTime: 0,
      resolutionSuccessRate: 0
    };
  }

  // NASA Rule 10: Function ≤60 lines
  private initializeStatistics(): GraphStatistics {
    return {
      totalNodes: 0,
      totalEdges: 0,
      resolvedNodes: 0,
      failedNodes: 0,
      circularDependencies: 0,
      criticalPathLength: 0,
      averageResolutionTime: 0,
      resolutionSuccessRate: 0
    };
  }
}

export class TopologicalSorter {
  // NASA Rule 10: Function ≤60 lines, iterative algorithm only
  public calculateResolutionOrder(graph: DependencyGraph): string[] {
    const resolutionOrder: string[] = [];
    const inDegree: Map<string, number> = new Map();
    const queue: string[] = [];
    const maxNodes = Math.min(graph.nodes.size, DEFAULT_CONFIG.MAX_GRAPH_SIZE);

    // Initialize in-degrees - fixed bound
    for (const node of graph.nodes.values()) {
      inDegree.set(node.nodeId, 0);
    }

    // Calculate in-degrees - fixed bound
    for (const edge of graph.edges.values()) {
      if (!this.isCircularEdge(edge, graph.circularDependencies)) {
        const currentDegree = inDegree.get(edge.targetNodeId) || 0;
        inDegree.set(edge.targetNodeId, currentDegree + 1);
      }
    }

    // Find nodes with no dependencies - fixed bound
    let processedNodes = 0;
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0 && processedNodes < maxNodes) {
        queue.push(nodeId);
        processedNodes++;
      }
    }

    return this.processTopologicalQueue(queue, inDegree, graph, resolutionOrder);
  }

  // NASA Rule 10: Function ≤60 lines, iterative processing
  private processTopologicalQueue(
    queue: string[],
    inDegree: Map<string, number>,
    graph: DependencyGraph,
    resolutionOrder: string[]
  ): string[] {
    const maxIterations = DEFAULT_CONFIG.MAX_GRAPH_SIZE;
    let iterations = 0;

    while (queue.length > 0 && iterations < maxIterations) {
      const currentNodeId = queue.shift()!;
      resolutionOrder.push(currentNodeId);

      const currentNode = graph.nodes.get(currentNodeId);
      if (currentNode) {
        this.processNodeDependencies(currentNode, inDegree, queue, graph);
      }

      iterations++;
    }

    // Add remaining nodes (part of circular dependencies)
    this.addRemainingNodes(graph, resolutionOrder);

    return resolutionOrder;
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private processNodeDependencies(
    node: DependencyNode,
    inDegree: Map<string, number>,
    queue: string[],
    graph: DependencyGraph
  ): void {
    const maxDependencies = 100; // Fixed bound
    let processedDeps = 0;

    for (const edge of node.dependencies) {
      if (processedDeps >= maxDependencies) break;

      if (!this.isCircularEdge(edge, graph.circularDependencies)) {
        const targetDegree = inDegree.get(edge.targetNodeId)! - 1;
        inDegree.set(edge.targetNodeId, targetDegree);

        if (targetDegree === 0) {
          queue.push(edge.targetNodeId);
        }
      }

      processedDeps++;
    }
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private addRemainingNodes(graph: DependencyGraph, resolutionOrder: string[]): void {
    const maxRemainingNodes = 1000; // Fixed bound
    let addedNodes = 0;

    for (const nodeId of graph.nodes.keys()) {
      if (addedNodes >= maxRemainingNodes) break;

      if (!resolutionOrder.includes(nodeId)) {
        resolutionOrder.push(nodeId);
        addedNodes++;
      }
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private isCircularEdge(edge: DependencyEdge, circularDependencies: CircularDependency[]): boolean {
    const maxCirculars = 100; // Fixed bound
    let checkedCirculars = 0;

    for (const circular of circularDependencies) {
      if (checkedCirculars >= maxCirculars) break;

      if (circular.cycle.includes(edge.sourceNodeId) &&
          circular.cycle.includes(edge.targetNodeId)) {
        return true;
      }

      checkedCirculars++;
    }

    return false;
  }
}

export class CriticalPathCalculator {
  // NASA Rule 10: Function ≤60 lines, iterative algorithm
  public calculateCriticalPath(graph: DependencyGraph): string[] {
    const distances: Map<string, number> = new Map();
    const predecessors: Map<string, string> = new Map();

    // Initialize distances - fixed bound
    for (const nodeId of graph.nodes.keys()) {
      distances.set(nodeId, 0);
    }

    // Calculate longest path - fixed bound iteration
    const maxIterations = Math.min(graph.resolutionOrder.length, DEFAULT_CONFIG.MAX_GRAPH_SIZE);
    for (let i = 0; i < maxIterations; i++) {
      const nodeId = graph.resolutionOrder[i];
      this.processNodeForCriticalPath(nodeId, graph, distances, predecessors);
    }

    return this.reconstructCriticalPath(distances, predecessors);
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private processNodeForCriticalPath(
    nodeId: string,
    graph: DependencyGraph,
    distances: Map<string, number>,
    predecessors: Map<string, string>
  ): void {
    const node = graph.nodes.get(nodeId);
    if (!node) return;

    const maxDependencies = 50; // Fixed bound
    let processedDeps = 0;

    for (const edge of node.dependencies) {
      if (processedDeps >= maxDependencies) break;

      const currentDistance = distances.get(nodeId) || 0;
      const targetDistance = distances.get(edge.targetNodeId) || 0;
      const edgeWeight = this.calculateEdgeWeight(edge, graph);

      if (currentDistance + edgeWeight > targetDistance) {
        distances.set(edge.targetNodeId, currentDistance + edgeWeight);
        predecessors.set(edge.targetNodeId, nodeId);
      }

      processedDeps++;
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private calculateEdgeWeight(edge: DependencyEdge, graph: DependencyGraph): number {
    let weight = 1; // Base weight

    // Adjust based on dependency type
    switch (edge.dependencyType) {
      case 'critical':
        weight *= 3;
        break;
      case 'hard':
        weight *= 2;
        break;
      case 'soft':
        weight *= 1.5;
        break;
      case 'optional':
        weight *= 0.5;
        break;
    }

    // Adjust based on component criticality
    const sourceNode = graph.nodes.get(edge.sourceNodeId);
    if (sourceNode) {
      switch (sourceNode.metadata.criticality) {
        case 'critical':
          weight *= 2;
          break;
        case 'high':
          weight *= 1.5;
          break;
        case 'medium':
          weight *= 1.2;
          break;
      }
    }

    return weight;
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private reconstructCriticalPath(
    distances: Map<string, number>,
    predecessors: Map<string, string>
  ): string[] {
    // Find the node with maximum distance
    let maxDistance = 0;
    let endNode = '';

    for (const [nodeId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = nodeId;
      }
    }

    // Reconstruct path - fixed bound
    const criticalPath: string[] = [];
    let currentNode = endNode;
    const maxPathLength = 100; // Fixed bound

    while (currentNode && criticalPath.length < maxPathLength) {
      criticalPath.unshift(currentNode);
      currentNode = predecessors.get(currentNode) || '';
    }

    return criticalPath;
  }
}

// NASA Rule 10: Function ≤60 lines
export function createGraphBuilder(): DependencyGraphBuilder {
  return new DependencyGraphBuilder();
}

// NASA Rule 10: Function ≤60 lines
export function createTopologicalSorter(): TopologicalSorter {
  return new TopologicalSorter();
}

// NASA Rule 10: Function ≤60 lines
export function createCriticalPathCalculator(): CriticalPathCalculator {
  return new CriticalPathCalculator();
}


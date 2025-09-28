/**
 * CODEX AGENT 008 - Dependency Analyzer
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loop bounds
 * FSM-First Design: Circular dependency detection with iterative algorithms
 */

import { EventEmitter } from 'events';
import {
  DependencyGraph,
  CircularDependency,
  CircularResolution,
  DependencyNode,
  DependencyEdge,
  DEFAULT_CONFIG
} from './DependencyTypes';

export class CircularDependencyDetector extends EventEmitter {
  private readonly maxCycleLength: number = DEFAULT_CONFIG.MAX_CYCLE_LENGTH;

  constructor() {
    super();
  }

  // NASA Rule 10: Function ≤60 lines, iterative cycle detection
  public async detectCircularDependencies(graph: DependencyGraph): Promise<CircularDependency[]> {
    this.emit('circular:detection_started', { graphId: graph.graphId });

    const circularDependencies: CircularDependency[] = [];
    const visited: Set<string> = new Set();
    const maxNodes = Math.min(graph.nodes.size, DEFAULT_CONFIG.MAX_GRAPH_SIZE);

    let processedNodes = 0;
    for (const nodeId of graph.nodes.keys()) {
      if (processedNodes >= maxNodes) break;

      if (!visited.has(nodeId)) {
        const cycles = this.detectCyclesFromNode(nodeId, graph, visited);
        circularDependencies.push(...cycles);
      }

      processedNodes++;
    }

    this.emit('circular:detection_completed', {
      graphId: graph.graphId,
      cycleCount: circularDependencies.length
    });

    return circularDependencies;
  }

  // NASA Rule 10: Function ≤60 lines, iterative stack-based detection
  private detectCyclesFromNode(
    startNodeId: string,
    graph: DependencyGraph,
    globalVisited: Set<string>
  ): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const stack: Array<{ nodeId: string; path: string[] }> = [{ nodeId: startNodeId, path: [] }];
    const visitedInPath: Set<string> = new Set();
    const maxIterations = 1000; // Fixed bound
    let iterations = 0;

    while (stack.length > 0 && iterations < maxIterations) {
      const { nodeId, path } = stack.pop()!;

      if (visitedInPath.has(nodeId)) {
        // Found cycle
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          const cycle = [...path.slice(cycleStart), nodeId];
          cycles.push(this.createCircularDependency(cycle, graph));
        }
        continue;
      }

      if (globalVisited.has(nodeId) || path.length > this.maxCycleLength) {
        continue;
      }

      globalVisited.add(nodeId);
      visitedInPath.add(nodeId);
      const newPath = [...path, nodeId];

      this.addDependenciesToStack(nodeId, graph, stack, newPath);
      iterations++;
    }

    return cycles;
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private addDependenciesToStack(
    nodeId: string,
    graph: DependencyGraph,
    stack: Array<{ nodeId: string; path: string[] }>,
    path: string[]
  ): void {
    const node = graph.nodes.get(nodeId);
    if (!node) return;

    const maxDependencies = 50; // Fixed bound
    let addedDeps = 0;

    for (const edge of node.dependencies) {
      if (addedDeps >= maxDependencies) break;

      stack.push({
        nodeId: edge.targetNodeId,
        path: [...path]
      });

      addedDeps++;
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private createCircularDependency(cycle: string[], graph: DependencyGraph): CircularDependency {
    const circularId = `circular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      circularId,
      cycle: [...cycle], // Create copy
      severity: this.assessCircularSeverity(cycle, graph),
      resolution: this.generateCircularResolution(cycle, graph),
      status: 'detected'
    };
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private assessCircularSeverity(cycle: string[], graph: DependencyGraph): 'warning' | 'error' | 'critical' {
    let maxCriticality = 'low';
    const maxCycleNodes = Math.min(cycle.length, this.maxCycleLength);

    for (let i = 0; i < maxCycleNodes; i++) {
      const nodeId = cycle[i];
      const node = graph.nodes.get(nodeId);

      if (node && node.metadata.criticality) {
        if (node.metadata.criticality === 'critical') {
          return 'critical';
        } else if (node.metadata.criticality === 'high' && maxCriticality !== 'critical') {
          maxCriticality = 'high';
        } else if (node.metadata.criticality === 'medium' && maxCriticality === 'low') {
          maxCriticality = 'medium';
        }
      }
    }

    return maxCriticality === 'high' ? 'error' : 'warning';
  }

  // NASA Rule 10: Function ≤60 lines
  private generateCircularResolution(cycle: string[], graph: DependencyGraph): CircularResolution {
    const cycleLength = Math.min(cycle.length, this.maxCycleLength);
    const hasOptionalDeps = this.cycleHasOptionalDependencies(cycle, graph);

    let strategy: CircularResolution['strategy'];
    let breakPoint: string | undefined;

    if (hasOptionalDeps) {
      strategy = 'break_cycle';
      breakPoint = this.findOptionalBreakPoint(cycle, graph);
    } else if (cycleLength <= 3) {
      strategy = 'dependency_injection';
    } else {
      strategy = 'lazy_loading';
    }

    return {
      strategy,
      breakPoint,
      alternativeApproach: this.getAlternativeApproach(strategy),
      implementationPlan: this.getImplementationPlan(strategy, cycle),
      riskAssessment: this.assessResolutionRisk(strategy, cycle, graph)
    };
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private cycleHasOptionalDependencies(cycle: string[], graph: DependencyGraph): boolean {
    const maxCycleNodes = Math.min(cycle.length - 1, this.maxCycleLength);

    for (let i = 0; i < maxCycleNodes; i++) {
      const sourceNodeId = cycle[i];
      const targetNodeId = cycle[i + 1];
      const sourceNode = graph.nodes.get(sourceNodeId);

      if (sourceNode) {
        const edge = sourceNode.dependencies.find(d => d.targetNodeId === targetNodeId);
        if (edge && edge.dependencyType === 'optional') {
          return true;
        }
      }
    }

    return false;
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private findOptionalBreakPoint(cycle: string[], graph: DependencyGraph): string | undefined {
    const maxCycleNodes = Math.min(cycle.length - 1, this.maxCycleLength);

    for (let i = 0; i < maxCycleNodes; i++) {
      const sourceNodeId = cycle[i];
      const targetNodeId = cycle[i + 1];
      const sourceNode = graph.nodes.get(sourceNodeId);

      if (sourceNode) {
        const edge = sourceNode.dependencies.find(d => d.targetNodeId === targetNodeId);
        if (edge && edge.dependencyType === 'optional') {
          return edge.edgeId;
        }
      }
    }

    return undefined;
  }

  // NASA Rule 10: Function ≤60 lines
  private getAlternativeApproach(strategy: CircularResolution['strategy']): string {
    switch (strategy) {
      case 'break_cycle':
        return 'Remove optional dependency temporarily';
      case 'dependency_injection':
        return 'Use dependency injection pattern';
      case 'lazy_loading':
        return 'Implement lazy loading of dependencies';
      case 'refactor':
        return 'Refactor component architecture';
      default:
        return 'Manual intervention required';
    }
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private getImplementationPlan(strategy: CircularResolution['strategy'], cycle: string[]): string[] {
    const basePlan = [
      'Analyze dependency cycle',
      'Identify breaking point',
      'Implement resolution strategy',
      'Validate resolution',
      'Update documentation'
    ];

    const maxPlanSteps = 10; // Fixed bound

    switch (strategy) {
      case 'break_cycle':
        return [
          'Identify optional dependencies in cycle',
          'Temporarily remove optional dependency',
          'Resolve remaining dependencies',
          'Re-add optional dependency if needed',
          'Validate system functionality'
        ].slice(0, maxPlanSteps);

      case 'dependency_injection':
        return [
          'Create dependency injection container',
          'Register components in container',
          'Modify components to accept injected dependencies',
          'Configure injection order',
          'Test dependency resolution'
        ].slice(0, maxPlanSteps);

      default:
        return basePlan.slice(0, maxPlanSteps);
    }
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private assessResolutionRisk(
    strategy: CircularResolution['strategy'],
    cycle: string[],
    graph: DependencyGraph
  ): string {
    const cycleLength = Math.min(cycle.length, this.maxCycleLength);
    let criticalNodes = 0;
    const maxNodeCheck = Math.min(cycle.length, 20); // Fixed bound

    for (let i = 0; i < maxNodeCheck; i++) {
      const node = graph.nodes.get(cycle[i]);
      if (node && node.metadata.criticality === 'critical') {
        criticalNodes++;
      }
    }

    let riskLevel = 'Low';

    if (criticalNodes > 0 || cycleLength > 5) {
      riskLevel = 'High';
    } else if (cycleLength > 3) {
      riskLevel = 'Medium';
    }

    return `${riskLevel} risk due to cycle length (${cycleLength}) and critical components (${criticalNodes})`;
  }
}

export class DependencyValidator {
  // NASA Rule 10: Function ≤60 lines
  public async validateGraph(graph: DependencyGraph): Promise<boolean> {
    const validationResults = await Promise.all([
      this.validateNodeIntegrity(graph),
      this.validateEdgeIntegrity(graph),
      this.validateCircularDependencies(graph),
      this.validateGraphSize(graph)
    ]);

    return validationResults.every(result => result);
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private async validateNodeIntegrity(graph: DependencyGraph): Promise<boolean> {
    const maxNodes = Math.min(graph.nodes.size, DEFAULT_CONFIG.MAX_GRAPH_SIZE);
    let validNodes = 0;
    let processedNodes = 0;

    for (const node of graph.nodes.values()) {
      if (processedNodes >= maxNodes) break;

      if (this.isValidNode(node)) {
        validNodes++;
      }

      processedNodes++;
    }

    return validNodes === processedNodes;
  }

  // NASA Rule 10: Function ≤60 lines
  private isValidNode(node: DependencyNode): boolean {
    return !!(
      node.nodeId &&
      node.componentId &&
      node.componentName &&
      node.componentType &&
      node.version &&
      node.metadata &&
      node.dependencies &&
      node.dependents
    );
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private async validateEdgeIntegrity(graph: DependencyGraph): Promise<boolean> {
    const maxEdges = Math.min(graph.edges.size, DEFAULT_CONFIG.MAX_GRAPH_SIZE * 2);
    let validEdges = 0;
    let processedEdges = 0;

    for (const edge of graph.edges.values()) {
      if (processedEdges >= maxEdges) break;

      if (this.isValidEdge(edge, graph)) {
        validEdges++;
      }

      processedEdges++;
    }

    return validEdges === processedEdges;
  }

  // NASA Rule 10: Function ≤60 lines
  private isValidEdge(edge: DependencyEdge, graph: DependencyGraph): boolean {
    const sourceExists = graph.nodes.has(edge.sourceNodeId);
    const targetExists = graph.nodes.has(edge.targetNodeId);
    const hasRequirement = !!(edge.requirement && edge.requirement.requirementId);
    const hasValidType = ['hard', 'soft', 'optional', 'critical', 'runtime', 'build', 'test']
      .includes(edge.dependencyType);

    return sourceExists && targetExists && hasRequirement && hasValidType;
  }

  // NASA Rule 10: Function ≤60 lines
  private async validateCircularDependencies(graph: DependencyGraph): Promise<boolean> {
    const detector = new CircularDependencyDetector();
    const circularDeps = await detector.detectCircularDependencies(graph);

    // Check if critical circular dependencies are properly handled
    const criticalCirculars = circularDeps.filter(c => c.severity === 'critical');
    return criticalCirculars.every(c => c.resolution.strategy !== 'ignore');
  }

  // NASA Rule 10: Function ≤60 lines
  private async validateGraphSize(graph: DependencyGraph): Promise<boolean> {
    const nodeCount = graph.nodes.size;
    const edgeCount = graph.edges.size;
    const maxNodes = DEFAULT_CONFIG.MAX_GRAPH_SIZE;
    const maxEdges = maxNodes * 10; // Reasonable edge limit

    return nodeCount <= maxNodes && edgeCount <= maxEdges;
  }
}

// NASA Rule 10: Function ≤60 lines
export function createCircularDependencyDetector(): CircularDependencyDetector {
  return new CircularDependencyDetector();
}

// NASA Rule 10: Function ≤60 lines
export function createDependencyValidator(): DependencyValidator {
  return new DependencyValidator();
}

// NASA Rule 10: Function ≤60 lines
export function isCircularEdge(edge: DependencyEdge, circularDependencies: CircularDependency[]): boolean {
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


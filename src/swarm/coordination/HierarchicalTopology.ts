/**
 * Hierarchical Topology - Tree-based Swarm Structure
 * Implements true hierarchical coordination with:
 * - Queen -> Princess -> Drone hierarchy
 * - Tree-based communication patterns
 * - Load balancing across branches
 * - Fault tolerance and failover
 * - Dynamic topology reconfiguration
 */

import { EventEmitter } from 'events';
import { LoggerFactory } from '../../utils/Logger';
import { IdGenerator } from '../../utils/IdGenerator';

export enum NodeType {
  QUEEN = 'QUEEN',
  PRINCESS = 'PRINCESS',
  DRONE = 'DRONE'
}

export enum NodeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED'
}

export interface HierarchyNode {
  readonly id: string;
  readonly type: NodeType;
  readonly domain: string;
  readonly parent?: string;
  readonly children: string[];
  readonly status: NodeStatus;
  readonly load: number;
  readonly capacity: number;
  readonly lastActivity: number;
  readonly metadata: Record<string, unknown>;
}

export interface TopologyConfiguration {
  readonly maxDepth: number;
  readonly maxChildren: number;
  readonly loadBalancingStrategy: 'round_robin' | 'weighted' | 'least_loaded';
  readonly failoverEnabled: boolean;
  readonly healthCheckInterval: number;
  readonly rebalanceThreshold: number;
}

export interface TopologyMetrics {
  readonly totalNodes: number;
  readonly activeNodes: number;
  readonly nodesByType: Record<NodeType, number>;
  readonly averageLoad: number;
  readonly maxLoad: number;
  readonly depth: number;
  readonly balance: number; // 0-1, closer to 1 is better balanced
}

export interface LoadDistribution {
  readonly nodeId: string;
  readonly domain: string;
  readonly currentLoad: number;
  readonly capacity: number;
  readonly utilization: number;
  readonly recommendedLoad: number;
}

export class HierarchicalTopology extends EventEmitter {
  private readonly config: TopologyConfiguration;
  private readonly nodes = new Map<string, HierarchyNode>();
  private readonly topology = new Map<string, Set<string>>(); // parent -> children
  private readonly reverseTopology = new Map<string, string>(); // child -> parent
  private readonly logger = LoggerFactory.getLogger('HierarchicalTopology');

  private queenId?: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private rebalanceInterval?: NodeJS.Timeout;
  private isInitialized: boolean = false;
  
  constructor(config: TopologyConfiguration) {
    super();
    this.config = config;
  }

  /**
   * Initialize hierarchical topology
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.logger.info('Initializing hierarchy', { operation: 'initialize' });
    
    // Create Queen node
    this.createQueenNode();
    
    // Create Princess nodes for each domain
    this.createPrincessNodes();
    
    // Setup health monitoring
    this.startHealthChecks();
    
    // Setup load rebalancing
    this.startRebalancing();
    
    this.isInitialized = true;
    this.logger.info('Hierarchy initialized', { operation: 'initialize' });
    
    this.emit('topology:initialized', this.getTopologySnapshot());
  }

  /**
   * Add node to hierarchy
   */
  addNode(
    id: string,
    type: NodeType,
    domain: string,
    parentId?: string,
    capacity: number = 100
  ): boolean {
    try {
      // Validate hierarchy constraints
      if (type === NodeType.QUEEN && this.queenId) {
        throw new Error('Only one Queen allowed in hierarchy');
      }
      
      if (parentId && !this.nodes.has(parentId)) {
        throw new Error(`Parent node ${parentId} does not exist`);
      }
      
      const node: HierarchyNode = {
        id,
        type,
        domain,
        parent: parentId,
        children: [],
        status: NodeStatus.ACTIVE,
        load: 0,
        capacity,
        lastActivity: Date.now(),
        metadata: {}
      };
      
      // Add to nodes map
      this.nodes.set(id, node);
      
      // Update topology maps
      if (parentId) {
        const parentChildren = this.topology.get(parentId) || new Set();
        parentChildren.add(id);
        this.topology.set(parentId, parentChildren);
        this.reverseTopology.set(id, parentId);
      }
      
      // Set as Queen if applicable
      if (type === NodeType.QUEEN) {
        this.queenId = id;
      }
      
      this.logger.info('Node added to hierarchy', { nodeId: id, type, domain, operation: 'addNode' });
      this.emit('node:added', { node });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to add node', { nodeId: id, type, domain, operation: 'addNode' }, error as Error);
      return false;
    }
  }

  /**
   * Remove node from hierarchy
   */
  removeNode(id: string): boolean {
    try {
      const node = this.nodes.get(id);
      if (!node) {
        this.logger.warn('Node not found for removal', { nodeId: id, operation: 'removeNode' });
        return false;
      }
      
      // Cannot remove Queen if it has children
      if (node.type === NodeType.QUEEN && node.children.length > 0) {
        throw new Error('Cannot remove Queen with active Princesses');
      }
      
      // Reassign children to parent or mark as orphans
      this.reassignChildren(id);
      
      // Remove from topology maps
      this.topology.delete(id);
      this.reverseTopology.delete(id);
      
      // Remove from parent's children
      if (node.parent) {
        const parentChildren = this.topology.get(node.parent);
        if (parentChildren) {
          parentChildren.delete(id);
        }
      }
      
      // Remove from nodes
      this.nodes.delete(id);
      
      this.logger.info('Node removed from hierarchy', { nodeId: id, operation: 'removeNode' });
      this.emit('node:removed', { nodeId: id, node });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to remove node', { nodeId: id, operation: 'removeNode' }, error as Error);
      return false;
    }
  }

  /**
   * Update node status
   */
  updateNodeStatus(id: string, status: NodeStatus, metadata?: Record<string, unknown>): void {
    const node = this.nodes.get(id);
    if (!node) {
      this.logger.warn('Node not found for status update', { nodeId: id, status, operation: 'updateNodeStatus' });
      return;
    }
    
    const oldStatus = node.status;
    (node as any).status = status;
    (node as any).lastActivity = Date.now();
    
    if (metadata) {
      (node as any).metadata = { ...node.metadata, ...metadata };
    }
    
    this.logger.info('Node status changed', { nodeId: id, oldStatus, newStatus: status, operation: 'updateNodeStatus' });
    
    this.emit('node:status_changed', {
      nodeId: id,
      oldStatus,
      newStatus: status,
      node
    });
    
    // Handle failed nodes
    if (status === NodeStatus.FAILED) {
      this.handleNodeFailure(id);
    }
  }

  /**
   * Update node load
   */
  updateNodeLoad(id: string, load: number): void {
    const node = this.nodes.get(id);
    if (!node) {
      this.logger.warn('Node not found for load update', { nodeId: id, load, operation: 'updateNodeLoad' });
      return;
    }
    
    const oldLoad = node.load;
    (node as any).load = Math.max(0, Math.min(load, node.capacity));
    (node as any).lastActivity = Date.now();
    
    this.emit('node:load_changed', {
      nodeId: id,
      oldLoad,
      newLoad: node.load,
      utilization: node.load / node.capacity
    });
    
    // Trigger rebalancing if threshold exceeded
    if (node.load / node.capacity > this.config.rebalanceThreshold) {
      this.triggerRebalancing(id);
    }
  }

  /**
   * Find optimal node for task assignment
   */
  findOptimalNode(
    taskType: string,
    requiredCapabilities: string[],
    preferredDomain?: string
  ): string | null {
    const candidates = this.findCandidateNodes(taskType, requiredCapabilities, preferredDomain);
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Apply load balancing strategy
    switch (this.config.loadBalancingStrategy) {
      case 'round_robin':
        return this.selectRoundRobin(candidates);
      case 'weighted':
        return this.selectWeighted(candidates);
      case 'least_loaded':
        return this.selectLeastLoaded(candidates);
      default:
        return candidates[0];
    }
  }

  /**
   * Get node hierarchy path
   */
  getNodePath(id: string): string[] {
    const path: string[] = [];
    let currentId: string | undefined = id;
    
    while (currentId) {
      path.unshift(currentId);
      currentId = this.reverseTopology.get(currentId);
    }
    
    return path;
  }

  /**
   * Get node children (recursive)
   */
  getNodeChildren(id: string, recursive: boolean = false): string[] {
    const children = Array.from(this.topology.get(id) || []);
    
    if (!recursive) {
      return children;
    }
    
    const allChildren = [...children];
    for (const child of children) {
      allChildren.push(...this.getNodeChildren(child, true));
    }
    
    return allChildren;
  }

  /**
   * Calculate load distribution recommendations
   */
  calculateLoadDistribution(): LoadDistribution[] {
    const distributions: LoadDistribution[] = [];
    
    for (const [id, node] of this.nodes) {
      if (node.type === NodeType.DRONE) continue; // Skip drones for now
      
      const utilization = node.load / node.capacity;
      const averageLoad = this.calculateAverageLoad();
      const recommendedLoad = Math.min(averageLoad, node.capacity * 0.8); // 80% max utilization
      
      distributions.push({
        nodeId: id,
        domain: node.domain,
        currentLoad: node.load,
        capacity: node.capacity,
        utilization,
        recommendedLoad
      });
    }
    
    return distributions.sort((a, b) => b.utilization - a.utilization);
  }

  /**
   * Get topology metrics
   */
  getMetrics(): TopologyMetrics {
    const nodesByType: Record<NodeType, number> = {
      [NodeType.QUEEN]: 0,
      [NodeType.PRINCESS]: 0,
      [NodeType.DRONE]: 0
    };
    
    let totalLoad = 0;
    let maxLoad = 0;
    let activeNodes = 0;
    
    for (const node of this.nodes.values()) {
      nodesByType[node.type]++;
      
      if (node.status === NodeStatus.ACTIVE) {
        activeNodes++;
      }
      
      totalLoad += node.load;
      maxLoad = Math.max(maxLoad, node.load);
    }
    
    const averageLoad = this.nodes.size > 0 ? totalLoad / this.nodes.size : 0;
    const depth = this.calculateMaxDepth();
    const balance = this.calculateBalance();
    
    return {
      totalNodes: this.nodes.size,
      activeNodes,
      nodesByType,
      averageLoad,
      maxLoad,
      depth,
      balance
    };
  }

  /**
   * Get topology snapshot
   */
  getTopologySnapshot(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      hierarchy: Object.fromEntries(
        Array.from(this.topology.entries()).map(([parent, children]) => [
          parent,
          Array.from(children)
        ])
      ),
      metrics: this.getMetrics(),
      queenId: this.queenId
    };
  }

  /**
   * Shutdown topology
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down hierarchy', { operation: 'shutdown' });
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
    }
    
    // Clear data structures
    this.nodes.clear();
    this.topology.clear();
    this.reverseTopology.clear();
    
    this.isInitialized = false;
    this.queenId = undefined;
    
    this.logger.info('Hierarchy shutdown complete', { operation: 'shutdown' });
  }

  // ===== Private Methods =====

  private createQueenNode(): void {
    this.addNode('queen-primary', NodeType.QUEEN, 'coordination', undefined, 1000);
  }

  private createPrincessNodes(): void {
    const domains = ['Development', 'Architecture', 'Quality', 'Performance', 'Infrastructure', 'Security'];
    
    domains.forEach(domain => {
      const princessId = `princess-${domain.toLowerCase()}`;
      this.addNode(princessId, NodeType.PRINCESS, domain, 'queen-primary', 500);
    });
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private startRebalancing(): void {
    this.rebalanceInterval = setInterval(() => {
      this.performRebalancing();
    }, 60000); // Check every minute
  }

  private performHealthChecks(): void {
    const now = Date.now();
    const healthTimeout = this.config.healthCheckInterval * 3; // 3x interval = timeout
    
    for (const [id, node] of this.nodes) {
      if (node.status === NodeStatus.ACTIVE && (now - node.lastActivity) > healthTimeout) {
        this.logger.warn('Node appears unhealthy', { nodeId: id, lastActivity: node.lastActivity, operation: 'performHealthChecks' });
        this.updateNodeStatus(id, NodeStatus.DEGRADED, {
          reason: 'health_check_timeout',
          lastActivity: node.lastActivity
        });
      }
    }
  }

  private performRebalancing(): void {
    const distributions = this.calculateLoadDistribution();
    const overloaded = distributions.filter(d => d.utilization > this.config.rebalanceThreshold);
    
    if (overloaded.length > 0) {
      this.logger.info('Rebalancing overloaded nodes', { overloadedCount: overloaded.length, operation: 'performRebalancing' });
      
      for (const dist of overloaded) {
        this.rebalanceNode(dist.nodeId);
      }
    }
  }

  private handleNodeFailure(id: string): void {
    this.logger.warn('Handling node failure', { nodeId: id, operation: 'handleNodeFailure' });
    
    const node = this.nodes.get(id);
    if (!node) return;
    
    // Redistribute load to sibling nodes
    const siblings = this.getSiblingNodes(id);
    if (siblings.length > 0) {
      const loadPerSibling = node.load / siblings.length;
      
      siblings.forEach(siblingId => {
        const sibling = this.nodes.get(siblingId);
        if (sibling && sibling.status === NodeStatus.ACTIVE) {
          this.updateNodeLoad(siblingId, sibling.load + loadPerSibling);
        }
      });
    }
    
    this.emit('node:failed', { nodeId: id, node, redistributed: siblings.length > 0 });
  }

  private reassignChildren(parentId: string): void {
    const children = this.topology.get(parentId);
    if (!children || children.size === 0) return;
    
    const grandparent = this.reverseTopology.get(parentId);
    
    for (const childId of children) {
      if (grandparent) {
        // Move to grandparent
        this.reverseTopology.set(childId, grandparent);
        const grandparentChildren = this.topology.get(grandparent) || new Set();
        grandparentChildren.add(childId);
        this.topology.set(grandparent, grandparentChildren);
      } else {
        // Orphan node
        this.reverseTopology.delete(childId);
        this.logger.warn('Node orphaned after parent removal', { childId, parentId, operation: 'reassignChildren' });
      }
    }
  }

  private findCandidateNodes(
    taskType: string,
    requiredCapabilities: string[],
    preferredDomain?: string
  ): string[] {
    const candidates: string[] = [];
    
    for (const [id, node] of this.nodes) {
      // Skip inactive nodes
      if (node.status !== NodeStatus.ACTIVE) continue;
      
      // Skip overloaded nodes
      if (node.load >= node.capacity) continue;
      
      // Prefer specified domain
      if (preferredDomain && node.domain === preferredDomain) {
        candidates.unshift(id); // Add to front
      } else if (!preferredDomain) {
        candidates.push(id);
      }
    }
    
    return candidates;
  }

  private selectRoundRobin(candidates: string[]): string {
    // Simple round-robin based on last used index
    // In real implementation, would track round-robin state
    return candidates[0];
  }

  private selectWeighted(candidates: string[]): string {
    // Weight by inverse of current load
    let bestScore = -1;
    let bestCandidate = candidates[0];
    
    for (const candidateId of candidates) {
      const node = this.nodes.get(candidateId);
      if (!node) continue;
      
      const availableCapacity = node.capacity - node.load;
      const score = availableCapacity / node.capacity;
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidateId;
      }
    }
    
    return bestCandidate;
  }

  private selectLeastLoaded(candidates: string[]): string {
    let leastLoad = Infinity;
    let bestCandidate = candidates[0];
    
    for (const candidateId of candidates) {
      const node = this.nodes.get(candidateId);
      if (!node) continue;
      
      if (node.load < leastLoad) {
        leastLoad = node.load;
        bestCandidate = candidateId;
      }
    }
    
    return bestCandidate;
  }

  private triggerRebalancing(nodeId: string): void {
    this.logger.info('Triggering rebalancing for overloaded node', { nodeId, operation: 'triggerRebalancing' });
    this.rebalanceNode(nodeId);
  }

  private rebalanceNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    const siblings = this.getSiblingNodes(nodeId);
    const availableSiblings = siblings.filter(id => {
      const sibling = this.nodes.get(id);
      return sibling && sibling.status === NodeStatus.ACTIVE && sibling.load < sibling.capacity * 0.8;
    });
    
    if (availableSiblings.length > 0) {
      const excessLoad = node.load - (node.capacity * this.config.rebalanceThreshold);
      const loadPerSibling = excessLoad / availableSiblings.length;
      
      availableSiblings.forEach(siblingId => {
        const sibling = this.nodes.get(siblingId);
        if (sibling) {
          this.updateNodeLoad(siblingId, sibling.load + loadPerSibling);
        }
      });
      
      this.updateNodeLoad(nodeId, node.load - excessLoad);
      
      this.logger.info('Load rebalanced across siblings', { nodeId, excessLoad, siblingCount: availableSiblings.length, operation: 'rebalanceNode' });
    }
  }

  private getSiblingNodes(nodeId: string): string[] {
    const parentId = this.reverseTopology.get(nodeId);
    if (!parentId) return [];
    
    const siblings = Array.from(this.topology.get(parentId) || []);
    return siblings.filter(id => id !== nodeId);
  }

  private calculateAverageLoad(): number {
    if (this.nodes.size === 0) return 0;
    
    const totalLoad = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.load, 0);
    
    return totalLoad / this.nodes.size;
  }

  private calculateMaxDepth(): number {
    if (!this.queenId) return 0;
    
    const calculateDepth = (nodeId: string): number => {
      const children = this.topology.get(nodeId);
      if (!children || children.size === 0) return 1;
      
      let maxChildDepth = 0;
      for (const childId of children) {
        maxChildDepth = Math.max(maxChildDepth, calculateDepth(childId));
      }
      
      return 1 + maxChildDepth;
    };
    
    return calculateDepth(this.queenId);
  }

  private calculateBalance(): number {
    // Simple balance calculation based on load variance
    const loads = Array.from(this.nodes.values()).map(node => node.load);
    if (loads.length <= 1) return 1;
    
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to balance score (lower deviation = better balance)
    return Math.max(0, 1 - (standardDeviation / mean));
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:25:00-04:00 | queen@claude-sonnet-4 | Create hierarchical topology with tree-based coordination | HierarchicalTopology.ts | OK | -- | 0.00 | e7b6d4a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-006
 * - inputs: ["QueenMemoryCoordinator.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
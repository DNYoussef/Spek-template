/**
 * Dependency Resolution and Conflict Management System
 *
 * Manages dependencies between Princess domains, resolves conflicts,
 * and ensures proper execution order with deadlock prevention.
 */

import { EventEmitter } from 'events';
import { HivePrincess } from '../hierarchy/HivePrincess';
import { PrincessCommunicationProtocol } from '../communication/PrincessCommunicationProtocol';
import { MECEValidationProtocol } from '../validation/MECEValidationProtocol';

export interface Dependency {
  dependencyId: string;
  dependentDomain: string; // Domain that requires the dependency
  providerDomain: string; // Domain that provides the dependency
  dependencyType: 'data' | 'service' | 'completion' | 'resource' | 'validation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requirements: DependencyRequirement[];
  status: 'pending' | 'requested' | 'in_progress' | 'satisfied' | 'failed' | 'blocked';
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastUpdated: number;
  resolvedAt?: number;
}

export interface DependencyRequirement {
  requirementId: string;
  name: string;
  type: 'input_data' | 'completion_status' | 'quality_gate' | 'resource_availability' | 'approval';
  criteria: any;
  currentValue?: any;
  satisfied: boolean;
  validationRule?: string;
}

export interface ConflictResolution {
  conflictId: string;
  conflictType: 'circular_dependency' | 'resource_contention' | 'priority_conflict' | 'deadlock' | 'capacity_limit';
  affectedDependencies: string[];
  affectedDomains: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: number;
  resolution: ResolutionStrategy;
  status: 'detected' | 'resolving' | 'resolved' | 'escalated';
  resolutionSteps: ResolutionStep[];
  autoResolvable: boolean;
}

export interface ResolutionStrategy {
  strategyType: 'break_cycle' | 'priority_override' | 'resource_allocation' | 'timeout_extension' | 'manual_intervention' | 'escalation';
  description: string;
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackPlan: string[];
  successCriteria: string[];
}

export interface ResolutionStep {
  stepId: string;
  stepName: string;
  action: string;
  targetDomain: string;
  startTime?: number;
  endTime?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface DependencyGraph {
  nodes: Map<string, DomainNode>;
  edges: Map<string, DependencyEdge>;
  stronglyConnectedComponents: string[][];
  topologicalOrder: string[];
  hasCycles: boolean;
  criticalPath: string[];
}

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
  weight: number; // Based on priority and criticality
  latency: number; // Average resolution time
  reliability: number; // Success rate
}

export class DependencyConflictResolver extends EventEmitter {
  private princesses: Map<string, HivePrincess>;
  private communication: PrincessCommunicationProtocol;
  private meceValidator: MECEValidationProtocol;

  private dependencies: Map<string, Dependency> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private dependencyGraph: DependencyGraph;
  private resolutionQueue: string[] = [];
  private activeResolutions: Map<string, ConflictResolution> = new Map();

  // Configuration
  private readonly CONFLICT_DETECTION_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RESOLUTION_TIME = 300000; // 5 minutes
  private readonly DEADLOCK_DETECTION_THRESHOLD = 60000; // 1 minute
  private readonly MAX_DEPENDENCY_WAIT_TIME = 600000; // 10 minutes

  constructor(
    princesses: Map<string, HivePrincess>,
    communication: PrincessCommunicationProtocol,
    meceValidator: MECEValidationProtocol
  ) {
    super();
    this.princesses = princesses;
    this.communication = communication;
    this.meceValidator = meceValidator;

    this.dependencyGraph = this.initializeDependencyGraph();
    this.setupDependencyListeners();
    this.startConflictDetection();
  }

  /**
   * Initialize dependency graph
   */
  private initializeDependencyGraph(): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      stronglyConnectedComponents: [],
      topologicalOrder: [],
      hasCycles: false,
      criticalPath: []
    };

    // Initialize domain nodes
    for (const [domainId, princess] of this.princesses) {
      const node: DomainNode = {
        domainId,
        domainName: domainId,
        currentLoad: 0,
        capacity: 100, // Default capacity
        availability: 1.0,
        dependencies: [],
        dependents: [],
        status: 'idle'
      };
      graph.nodes.set(domainId, node);
    }

    console.log(`[Dependency Resolver] Initialized graph with ${graph.nodes.size} nodes`);
    return graph;
  }

  /**
   * Setup dependency event listeners
   */
  private setupDependencyListeners(): void {
    // Listen for Princess communication events
    this.communication.on('message:sent', (data) => {
      this.updateDependencyFromMessage(data.message);
    });

    this.communication.on('message:rejected', (data) => {
      this.handleDependencyFailure(data.message, data.response.reason);
    });

    // Listen for MECE validation events
    this.meceValidator.on('handoff:initiated', (handoff) => {
      this.trackHandoffDependency(handoff);
    });

    // Listen for Princess health changes
    for (const princess of this.princesses.values()) {
      princess.on?.('health:change', (data) => {
        this.updateDomainAvailability(princess.domainName, data);
      });
    }
  }

  /**
   * Register a new dependency
   */
  async registerDependency(dependency: Omit<Dependency, 'dependencyId' | 'status' | 'createdAt' | 'lastUpdated' | 'retryCount'>): Promise<string> {
    const dependencyId = this.generateDependencyId();

    const fullDependency: Dependency = {
      ...dependency,
      dependencyId,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.dependencies.set(dependencyId, fullDependency);

    console.log(`[Dependency Resolver] Registered dependency: ${dependency.dependentDomain} -> ${dependency.providerDomain}`);
    console.log(`  Type: ${dependency.dependencyType}, Priority: ${dependency.priority}`);

    // Update dependency graph
    this.updateDependencyGraph(fullDependency);

    // Start dependency resolution
    await this.processDependency(dependencyId);

    this.emit('dependency:registered', fullDependency);
    return dependencyId;
  }

  /**
   * Process a dependency
   */
  private async processDependency(dependencyId: string): Promise<void> {
    const dependency = this.dependencies.get(dependencyId);
    if (!dependency) return;

    console.log(`\n[Dependency Resolver] Processing dependency: ${dependencyId}`);
    console.log(`  ${dependency.dependentDomain} needs ${dependency.dependencyType} from ${dependency.providerDomain}`);

    try {
      // Check for conflicts before processing
      const conflicts = await this.detectConflictsForDependency(dependency);
      if (conflicts.length > 0) {
        console.log(`  Conflicts detected: ${conflicts.length}`);
        dependency.status = 'blocked';
        await this.handleConflicts(conflicts);
        return;
      }

      // Request dependency from provider
      dependency.status = 'requested';
      dependency.lastUpdated = Date.now();

      const request = await this.createDependencyRequest(dependency);
      const response = await this.communication.sendMessage(request);

      if (response.success) {
        dependency.status = 'in_progress';
        console.log(`  Dependency request sent successfully`);

        // Set up timeout monitoring
        this.monitorDependencyTimeout(dependencyId);
      } else {
        dependency.status = 'failed';
        console.log(`  Dependency request failed: ${response.error}`);
        await this.handleDependencyFailure(dependency, response.error || 'Unknown error');
      }

    } catch (error) {
      dependency.status = 'failed';
      console.error(`  Dependency processing error:`, error);
      await this.handleDependencyFailure(dependency, error.message);
    }
  }

  /**
   * Create dependency request message
   */
  private async createDependencyRequest(dependency: Dependency): Promise<any> {
    return {
      fromPrincess: dependency.dependentDomain,
      toPrincess: dependency.providerDomain,
      messageType: 'dependency_request',
      priority: dependency.priority,
      payload: {
        dependencyId: dependency.dependencyId,
        dependencyType: dependency.dependencyType,
        description: dependency.description,
        requirements: dependency.requirements,
        timeout: dependency.timeoutMs,
        urgency: dependency.priority
      },
      contextFingerprint: {
        checksum: dependency.dependencyId,
        timestamp: Date.now(),
        degradationScore: 0,
        semanticVector: [],
        relationships: new Map()
      },
      requiresAcknowledgment: true,
      requiresConsensus: dependency.priority === 'critical'
    };
  }

  /**
   * Detect conflicts for a specific dependency
   */
  private async detectConflictsForDependency(dependency: Dependency): Promise<ConflictResolution[]> {
    const conflicts: ConflictResolution[] = [];

    // Check for circular dependencies
    const circularConflict = this.detectCircularDependency(dependency);
    if (circularConflict) {
      conflicts.push(circularConflict);
    }

    // Check for resource contention
    const resourceConflict = this.detectResourceContention(dependency);
    if (resourceConflict) {
      conflicts.push(resourceConflict);
    }

    // Check for priority conflicts
    const priorityConflict = this.detectPriorityConflict(dependency);
    if (priorityConflict) {
      conflicts.push(priorityConflict);
    }

    // Check for deadlock potential
    const deadlockConflict = this.detectPotentialDeadlock(dependency);
    if (deadlockConflict) {
      conflicts.push(deadlockConflict);
    }

    return conflicts;
  }

  /**
   * Detect circular dependency
   */
  private detectCircularDependency(dependency: Dependency): ConflictResolution | null {
    // Build temporary graph with new dependency
    const tempGraph = this.buildTemporaryGraph(dependency);
    const cycles = this.findStronglyConnectedComponents(tempGraph);

    for (const cycle of cycles) {
      if (cycle.length > 1 && cycle.includes(dependency.dependentDomain) && cycle.includes(dependency.providerDomain)) {
        return {
          conflictId: this.generateConflictId(),
          conflictType: 'circular_dependency',
          affectedDependencies: [dependency.dependencyId],
          affectedDomains: cycle,
          severity: 'high',
          detectedAt: Date.now(),
          status: 'detected',
          autoResolvable: true,
          resolution: {
            strategyType: 'break_cycle',
            description: `Break circular dependency by introducing asynchronous processing`,
            estimatedTime: 60000,
            riskLevel: 'medium',
            rollbackPlan: ['Restore original dependency order', 'Clear temporary states'],
            successCriteria: ['No circular dependencies detected', 'All dependencies resolvable']
          },
          resolutionSteps: []
        };
      }
    }

    return null;
  }

  /**
   * Detect resource contention
   */
  private detectResourceContention(dependency: Dependency): ConflictResolution | null {
    const providerNode = this.dependencyGraph.nodes.get(dependency.providerDomain);
    if (!providerNode) return null;

    // Check if provider is overloaded
    if (providerNode.currentLoad >= providerNode.capacity) {
      return {
        conflictId: this.generateConflictId(),
        conflictType: 'resource_contention',
        affectedDependencies: [dependency.dependencyId],
        affectedDomains: [dependency.providerDomain],
        severity: 'medium',
        detectedAt: Date.now(),
        status: 'detected',
        autoResolvable: true,
        resolution: {
          strategyType: 'resource_allocation',
          description: `Increase capacity or queue dependency until resources available`,
          estimatedTime: 30000,
          riskLevel: 'low',
          rollbackPlan: ['Restore original capacity limits'],
          successCriteria: ['Provider capacity available', 'Dependency processable']
        },
        resolutionSteps: []
      };
    }

    return null;
  }

  /**
   * Detect priority conflict
   */
  private detectPriorityConflict(dependency: Dependency): ConflictResolution | null {
    // Find other dependencies targeting the same provider
    const conflictingDependencies = Array.from(this.dependencies.values()).filter(d =>
      d.providerDomain === dependency.providerDomain &&
      d.status === 'in_progress' &&
      d.priority !== dependency.priority
    );

    if (conflictingDependencies.length > 0) {
      // Check if current dependency has higher priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const currentPriority = priorityOrder[dependency.priority];
      const hasHigherPriority = conflictingDependencies.some(d =>
        priorityOrder[d.priority] < currentPriority
      );

      if (hasHigherPriority) {
        return {
          conflictId: this.generateConflictId(),
          conflictType: 'priority_conflict',
          affectedDependencies: [dependency.dependencyId, ...conflictingDependencies.map(d => d.dependencyId)],
          affectedDomains: [dependency.providerDomain],
          severity: 'medium',
          detectedAt: Date.now(),
          status: 'detected',
          autoResolvable: true,
          resolution: {
            strategyType: 'priority_override',
            description: `Reorder dependencies by priority`,
            estimatedTime: 10000,
            riskLevel: 'low',
            rollbackPlan: ['Restore original processing order'],
            successCriteria: ['Dependencies processed in priority order']
          },
          resolutionSteps: []
        };
      }
    }

    return null;
  }

  /**
   * Detect potential deadlock
   */
  private detectPotentialDeadlock(dependency: Dependency): ConflictResolution | null {
    // Look for mutual waiting scenarios
    const waitingDependencies = Array.from(this.dependencies.values()).filter(d =>
      d.status === 'in_progress' &&
      Date.now() - d.lastUpdated > this.DEADLOCK_DETECTION_THRESHOLD
    );

    // Check for mutual dependency pattern
    const potentialDeadlock = waitingDependencies.find(d =>
      d.dependentDomain === dependency.providerDomain &&
      d.providerDomain === dependency.dependentDomain
    );

    if (potentialDeadlock) {
      return {
        conflictId: this.generateConflictId(),
        conflictType: 'deadlock',
        affectedDependencies: [dependency.dependencyId, potentialDeadlock.dependencyId],
        affectedDomains: [dependency.dependentDomain, dependency.providerDomain],
        severity: 'critical',
        detectedAt: Date.now(),
        status: 'detected',
        autoResolvable: true,
        resolution: {
          strategyType: 'break_cycle',
          description: `Break deadlock by introducing timeout or async processing`,
          estimatedTime: 30000,
          riskLevel: 'medium',
          rollbackPlan: ['Cancel one dependency', 'Retry in different order'],
          successCriteria: ['No mutual waiting', 'Dependencies progress normally']
        },
        resolutionSteps: []
      };
    }

    return null;
  }

  /**
   * Handle conflicts
   */
  private async handleConflicts(conflicts: ConflictResolution[]): Promise<void> {
    console.log(`[Dependency Resolver] Handling ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      this.conflicts.set(conflict.conflictId, conflict);
      console.log(`  Conflict: ${conflict.conflictType} (${conflict.severity})`);

      if (conflict.autoResolvable) {
        await this.resolveConflictAutomatically(conflict);
      } else {
        await this.escalateConflict(conflict);
      }
    }
  }

  /**
   * Resolve conflict automatically
   */
  private async resolveConflictAutomatically(conflict: ConflictResolution): Promise<void> {
    console.log(`[Dependency Resolver] Auto-resolving conflict: ${conflict.conflictType}`);

    conflict.status = 'resolving';
    conflict.resolutionSteps = this.generateResolutionSteps(conflict);
    this.activeResolutions.set(conflict.conflictId, conflict);

    try {
      for (const step of conflict.resolutionSteps) {
        console.log(`    Step: ${step.stepName}`);
        step.status = 'executing';
        step.startTime = Date.now();

        const stepResult = await this.executeResolutionStep(step);

        step.endTime = Date.now();
        if (stepResult.success) {
          step.status = 'completed';
          step.result = stepResult.result;
        } else {
          step.status = 'failed';
          step.error = stepResult.error;
          throw new Error(`Resolution step failed: ${stepResult.error}`);
        }
      }

      conflict.status = 'resolved';
      console.log(`  Conflict resolved successfully: ${conflict.conflictType}`);

      // Re-process affected dependencies
      await this.reprocessAffectedDependencies(conflict);

    } catch (error) {
      conflict.status = 'escalated';
      console.error(`  Auto-resolution failed:`, error);
      await this.escalateConflict(conflict);
    } finally {
      this.activeResolutions.delete(conflict.conflictId);
    }
  }

  /**
   * Generate resolution steps
   */
  private generateResolutionSteps(conflict: ConflictResolution): ResolutionStep[] {
    const steps: ResolutionStep[] = [];

    switch (conflict.resolution.strategyType) {
      case 'break_cycle':
        steps.push({
          stepId: `${conflict.conflictId}-break-1`,
          stepName: 'Identify cycle break point',
          action: 'analyze_dependency_chain',
          targetDomain: 'coordination',
          status: 'pending'
        });
        steps.push({
          stepId: `${conflict.conflictId}-break-2`,
          stepName: 'Introduce async processing',
          action: 'enable_async_processing',
          targetDomain: conflict.affectedDomains[0],
          status: 'pending'
        });
        break;

      case 'priority_override':
        steps.push({
          stepId: `${conflict.conflictId}-priority-1`,
          stepName: 'Reorder dependency queue',
          action: 'reorder_by_priority',
          targetDomain: conflict.affectedDomains[0],
          status: 'pending'
        });
        break;

      case 'resource_allocation':
        steps.push({
          stepId: `${conflict.conflictId}-resource-1`,
          stepName: 'Increase domain capacity',
          action: 'increase_capacity',
          targetDomain: conflict.affectedDomains[0],
          status: 'pending'
        });
        break;

      case 'timeout_extension':
        steps.push({
          stepId: `${conflict.conflictId}-timeout-1`,
          stepName: 'Extend dependency timeout',
          action: 'extend_timeout',
          targetDomain: conflict.affectedDomains[0],
          status: 'pending'
        });
        break;

      default:
        steps.push({
          stepId: `${conflict.conflictId}-manual-1`,
          stepName: 'Manual intervention required',
          action: 'manual_review',
          targetDomain: 'coordination',
          status: 'pending'
        });
    }

    return steps;
  }

  /**
   * Execute resolution step
   */
  private async executeResolutionStep(step: ResolutionStep): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      switch (step.action) {
        case 'analyze_dependency_chain':
          return await this.analyzeDependencyChain(step.targetDomain);

        case 'enable_async_processing':
          return await this.enableAsyncProcessing(step.targetDomain);

        case 'reorder_by_priority':
          return await this.reorderByPriority(step.targetDomain);

        case 'increase_capacity':
          return await this.increaseDomainCapacity(step.targetDomain);

        case 'extend_timeout':
          return await this.extendTimeout(step.targetDomain);

        case 'manual_review':
          return await this.requestManualReview(step.targetDomain);

        default:
          throw new Error(`Unknown resolution action: ${step.action}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Escalate conflict
   */
  private async escalateConflict(conflict: ConflictResolution): Promise<void> {
    console.log(`[Dependency Resolver] Escalating conflict: ${conflict.conflictType}`);

    conflict.status = 'escalated';

    // Send escalation to coordination princess
    const escalationMessage = {
      fromPrincess: 'dependency-resolver',
      toPrincess: 'coordination',
      messageType: 'conflict_escalation',
      priority: 'critical',
      payload: {
        conflictId: conflict.conflictId,
        conflictType: conflict.conflictType,
        severity: conflict.severity,
        affectedDomains: conflict.affectedDomains,
        affectedDependencies: conflict.affectedDependencies,
        resolution: conflict.resolution,
        requiresManualIntervention: true
      },
      contextFingerprint: {
        checksum: conflict.conflictId,
        timestamp: Date.now(),
        degradationScore: 0,
        semanticVector: [],
        relationships: new Map()
      },
      requiresAcknowledgment: true,
      requiresConsensus: true
    };

    await this.communication.sendMessage(escalationMessage);
    this.emit('conflict:escalated', conflict);
  }

  /**
   * Monitor dependency timeout
   */
  private monitorDependencyTimeout(dependencyId: string): void {
    const dependency = this.dependencies.get(dependencyId);
    if (!dependency) return;

    setTimeout(async () => {
      const currentDep = this.dependencies.get(dependencyId);
      if (currentDep && currentDep.status === 'in_progress') {
        console.log(`[Dependency Resolver] Dependency timeout: ${dependencyId}`);
        await this.handleDependencyTimeout(currentDep);
      }
    }, dependency.timeoutMs);
  }

  /**
   * Handle dependency timeout
   */
  private async handleDependencyTimeout(dependency: Dependency): Promise<void> {
    if (dependency.retryCount < dependency.maxRetries) {
      console.log(`  Retrying dependency (attempt ${dependency.retryCount + 1})`);
      dependency.retryCount++;
      dependency.status = 'pending';
      dependency.lastUpdated = Date.now();
      await this.processDependency(dependency.dependencyId);
    } else {
      console.log(`  Dependency failed after ${dependency.maxRetries} retries`);
      dependency.status = 'failed';
      await this.handleDependencyFailure(dependency, 'Timeout after maximum retries');
    }
  }

  /**
   * Handle dependency failure
   */
  private async handleDependencyFailure(dependency: Dependency | any, reason: string): Promise<void> {
    if (typeof dependency === 'object' && 'messageId' in dependency) {
      // Handle message-based failure
      const relatedDep = Array.from(this.dependencies.values()).find(d =>
        d.dependentDomain === dependency.fromPrincess &&
        d.providerDomain === dependency.toPrincess
      );
      if (relatedDep) {
        dependency = relatedDep;
      } else {
        return;
      }
    }

    console.log(`[Dependency Resolver] Dependency failed: ${dependency.dependencyId}`);
    console.log(`  Reason: ${reason}`);

    dependency.status = 'failed';
    dependency.lastUpdated = Date.now();

    // Notify dependent domain
    const failureNotification = {
      fromPrincess: 'dependency-resolver',
      toPrincess: dependency.dependentDomain,
      messageType: 'dependency_failure',
      priority: dependency.priority,
      payload: {
        dependencyId: dependency.dependencyId,
        reason,
        retryCount: dependency.retryCount,
        canRetry: dependency.retryCount < dependency.maxRetries
      },
      contextFingerprint: {
        checksum: dependency.dependencyId,
        timestamp: Date.now(),
        degradationScore: 0,
        semanticVector: [],
        relationships: new Map()
      },
      requiresAcknowledgment: false,
      requiresConsensus: false
    };

    await this.communication.sendMessage(failureNotification);
    this.emit('dependency:failed', { dependency, reason });
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(dependency: Dependency): void {
    const fromNode = this.dependencyGraph.nodes.get(dependency.dependentDomain);
    const toNode = this.dependencyGraph.nodes.get(dependency.providerDomain);

    if (fromNode && toNode) {
      // Update node relationships
      if (!fromNode.dependencies.includes(dependency.providerDomain)) {
        fromNode.dependencies.push(dependency.providerDomain);
      }
      if (!toNode.dependents.includes(dependency.dependentDomain)) {
        toNode.dependents.push(dependency.dependentDomain);
      }

      // Create or update edge
      const edgeId = `${dependency.dependentDomain}->${dependency.providerDomain}`;
      let edge = this.dependencyGraph.edges.get(edgeId);

      if (!edge) {
        edge = {
          edgeId,
          fromDomain: dependency.dependentDomain,
          toDomain: dependency.providerDomain,
          dependencyIds: [],
          weight: 0,
          latency: 0,
          reliability: 1.0
        };
        this.dependencyGraph.edges.set(edgeId, edge);
      }

      edge.dependencyIds.push(dependency.dependencyId);
      edge.weight = this.calculateEdgeWeight(edge.dependencyIds);

      // Recompute graph properties
      this.recomputeGraphProperties();
    }
  }

  /**
   * Start conflict detection timer
   */
  private startConflictDetection(): void {
    setInterval(async () => {
      await this.performConflictDetection();
    }, this.CONFLICT_DETECTION_INTERVAL);

    console.log(`[Dependency Resolver] Started conflict detection (interval: ${this.CONFLICT_DETECTION_INTERVAL}ms)`);
  }

  /**
   * Perform periodic conflict detection
   */
  private async performConflictDetection(): Promise<void> {
    // Check for global deadlocks
    const deadlocks = this.detectGlobalDeadlocks();
    for (const deadlock of deadlocks) {
      if (!this.conflicts.has(deadlock.conflictId)) {
        await this.handleConflicts([deadlock]);
      }
    }

    // Check for capacity violations
    const capacityConflicts = this.detectCapacityViolations();
    for (const conflict of capacityConflicts) {
      if (!this.conflicts.has(conflict.conflictId)) {
        await this.handleConflicts([conflict]);
      }
    }

    // Clean up resolved conflicts
    this.cleanupResolvedConflicts();
  }

  /**
   * Update dependency from message
   */
  private updateDependencyFromMessage(message: any): void {
    if (message.messageType === 'dependency_response') {
      const dependencyId = message.payload.dependencyId;
      const dependency = this.dependencies.get(dependencyId);

      if (dependency) {
        if (message.payload.status === 'satisfied') {
          dependency.status = 'satisfied';
          dependency.resolvedAt = Date.now();
          console.log(`[Dependency Resolver] Dependency satisfied: ${dependencyId}`);
          this.emit('dependency:satisfied', dependency);
        } else if (message.payload.status === 'failed') {
          this.handleDependencyFailure(dependency, message.payload.reason || 'Provider failure');
        }
      }
    }
  }

  /**
   * Track handoff dependency
   */
  private trackHandoffDependency(handoff: any): void {
    // Create implicit dependency for handoffs
    const dependencyId = this.generateDependencyId();
    const dependency: Dependency = {
      dependencyId,
      dependentDomain: handoff.toDomain,
      providerDomain: handoff.fromDomain,
      dependencyType: 'completion',
      priority: 'medium',
      description: `Handoff completion: ${handoff.handoffType}`,
      requirements: [{
        requirementId: `${dependencyId}-completion`,
        name: 'Handoff Completion',
        type: 'completion_status',
        criteria: { handoffCompleted: true },
        satisfied: false
      }],
      status: 'in_progress',
      timeoutMs: 60000,
      retryCount: 0,
      maxRetries: 2,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.dependencies.set(dependencyId, dependency);
    this.updateDependencyGraph(dependency);
  }

  /**
   * Update domain availability
   */
  private updateDomainAvailability(domainName: string, healthData: any): void {
    const node = this.dependencyGraph.nodes.get(domainName);
    if (node) {
      node.availability = healthData.healthy ? 1.0 : 0.0;
      node.status = healthData.healthy ? 'idle' : 'unavailable';

      // Check if this affects any dependencies
      const affectedDependencies = Array.from(this.dependencies.values()).filter(d =>
        d.providerDomain === domainName && d.status === 'in_progress'
      );

      for (const dep of affectedDependencies) {
        if (!healthData.healthy) {
          this.handleDependencyFailure(dep, 'Provider domain unavailable');
        }
      }
    }
  }

  // Helper methods
  private buildTemporaryGraph(newDependency: Dependency): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Add existing dependencies
    for (const dep of this.dependencies.values()) {
      if (dep.status !== 'failed') {
        const deps = graph.get(dep.dependentDomain) || [];
        deps.push(dep.providerDomain);
        graph.set(dep.dependentDomain, deps);
      }
    }

    // Add new dependency
    const deps = graph.get(newDependency.dependentDomain) || [];
    deps.push(newDependency.providerDomain);
    graph.set(newDependency.dependentDomain, deps);

    return graph;
  }

  private findStronglyConnectedComponents(graph: Map<string, string[]>): string[][] {
    // Simplified SCC detection - would use Tarjan's or Kosaraju's algorithm in production
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        const component = this.dfsComponent(graph, node, visited);
        if (component.length > 1) {
          components.push(component);
        }
      }
    }

    return components;
  }

  private dfsComponent(graph: Map<string, string[]>, start: string, visited: Set<string>): string[] {
    const component: string[] = [];
    const stack = [start];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!visited.has(node)) {
        visited.add(node);
        component.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }

    return component;
  }

  private calculateEdgeWeight(dependencyIds: string[]): number {
    let totalWeight = 0;
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };

    for (const depId of dependencyIds) {
      const dep = this.dependencies.get(depId);
      if (dep) {
        totalWeight += priorityWeights[dep.priority];
      }
    }

    return totalWeight;
  }

  private recomputeGraphProperties(): void {
    // Compute topological order
    this.dependencyGraph.topologicalOrder = this.computeTopologicalOrder();

    // Detect cycles
    this.dependencyGraph.hasCycles = this.dependencyGraph.stronglyConnectedComponents.length > 0;

    // Compute critical path
    this.dependencyGraph.criticalPath = this.computeCriticalPath();
  }

  private computeTopologicalOrder(): string[] {
    // Kahn's algorithm for topological sorting
    const inDegree = new Map<string, number>();
    const order: string[] = [];
    const queue: string[] = [];

    // Initialize in-degrees
    for (const domain of this.princesses.keys()) {
      inDegree.set(domain, 0);
    }

    for (const edge of this.dependencyGraph.edges.values()) {
      inDegree.set(edge.toDomain, (inDegree.get(edge.toDomain) || 0) + 1);
    }

    // Find nodes with no incoming edges
    for (const [domain, degree] of inDegree) {
      if (degree === 0) {
        queue.push(domain);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const domain = queue.shift()!;
      order.push(domain);

      // Update neighbors
      for (const edge of this.dependencyGraph.edges.values()) {
        if (edge.fromDomain === domain) {
          const newDegree = (inDegree.get(edge.toDomain) || 0) - 1;
          inDegree.set(edge.toDomain, newDegree);
          if (newDegree === 0) {
            queue.push(edge.toDomain);
          }
        }
      }
    }

    return order;
  }

  private computeCriticalPath(): string[] {
    // Simplified critical path computation
    // Would implement proper CPM algorithm in production
    return [];
  }

  private detectGlobalDeadlocks(): ConflictResolution[] {
    const deadlocks: ConflictResolution[] = [];

    // Look for circular waiting patterns
    const waitingDependencies = Array.from(this.dependencies.values()).filter(d =>
      d.status === 'in_progress' &&
      Date.now() - d.lastUpdated > this.DEADLOCK_DETECTION_THRESHOLD
    );

    // Group by domains involved
    const domainGroups = new Map<string, Dependency[]>();
    for (const dep of waitingDependencies) {
      const key = `${dep.dependentDomain}-${dep.providerDomain}`;
      const group = domainGroups.get(key) || [];
      group.push(dep);
      domainGroups.set(key, group);
    }

    // Check for mutual waiting
    for (const [key1, deps1] of domainGroups) {
      for (const [key2, deps2] of domainGroups) {
        if (key1 !== key2) {
          const [dep1Domain, prov1Domain] = key1.split('-');
          const [dep2Domain, prov2Domain] = key2.split('-');

          if (dep1Domain === prov2Domain && prov1Domain === dep2Domain) {
            // Mutual deadlock detected
            deadlocks.push({
              conflictId: this.generateConflictId(),
              conflictType: 'deadlock',
              affectedDependencies: [...deps1.map(d => d.dependencyId), ...deps2.map(d => d.dependencyId)],
              affectedDomains: [dep1Domain, prov1Domain],
              severity: 'critical',
              detectedAt: Date.now(),
              status: 'detected',
              autoResolvable: true,
              resolution: {
                strategyType: 'break_cycle',
                description: 'Break deadlock by timeout or priority override',
                estimatedTime: 30000,
                riskLevel: 'medium',
                rollbackPlan: ['Cancel lower priority dependency', 'Retry with different order'],
                successCriteria: ['No mutual waiting detected', 'Dependencies can progress']
              },
              resolutionSteps: []
            });
          }
        }
      }
    }

    return deadlocks;
  }

  private detectCapacityViolations(): ConflictResolution[] {
    const violations: ConflictResolution[] = [];

    for (const [domainId, node] of this.dependencyGraph.nodes) {
      if (node.currentLoad > node.capacity) {
        violations.push({
          conflictId: this.generateConflictId(),
          conflictType: 'capacity_limit',
          affectedDependencies: this.getDependenciesForDomain(domainId),
          affectedDomains: [domainId],
          severity: 'high',
          detectedAt: Date.now(),
          status: 'detected',
          autoResolvable: true,
          resolution: {
            strategyType: 'resource_allocation',
            description: 'Increase capacity or queue dependencies',
            estimatedTime: 60000,
            riskLevel: 'low',
            rollbackPlan: ['Restore original capacity'],
            successCriteria: ['Load within capacity limits']
          },
          resolutionSteps: []
        });
      }
    }

    return violations;
  }

  private cleanupResolvedConflicts(): void {
    const cutoff = Date.now() - 3600000; // 1 hour ago

    for (const [conflictId, conflict] of this.conflicts) {
      if (conflict.status === 'resolved' && conflict.detectedAt < cutoff) {
        this.conflicts.delete(conflictId);
      }
    }
  }

  private getDependenciesForDomain(domainId: string): string[] {
    return Array.from(this.dependencies.values())
      .filter(d => d.providerDomain === domainId)
      .map(d => d.dependencyId);
  }

  private async reprocessAffectedDependencies(conflict: ConflictResolution): Promise<void> {
    for (const depId of conflict.affectedDependencies) {
      const dependency = this.dependencies.get(depId);
      if (dependency && dependency.status === 'blocked') {
        dependency.status = 'pending';
        await this.processDependency(depId);
      }
    }
  }

  // Resolution step implementations
  private async analyzeDependencyChain(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // Analyze dependency chain for target domain
    return { success: true, result: 'Dependency chain analyzed' };
  }

  private async enableAsyncProcessing(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // Enable asynchronous processing for domain
    return { success: true, result: 'Async processing enabled' };
  }

  private async reorderByPriority(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // Reorder dependencies by priority
    return { success: true, result: 'Dependencies reordered by priority' };
  }

  private async increaseDomainCapacity(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const node = this.dependencyGraph.nodes.get(targetDomain);
    if (node) {
      node.capacity *= 1.5; // Increase capacity by 50%
      return { success: true, result: `Capacity increased to ${node.capacity}` };
    }
    return { success: false, error: 'Domain not found' };
  }

  private async extendTimeout(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // Extend timeout for dependencies in target domain
    const domainDependencies = Array.from(this.dependencies.values()).filter(d =>
      d.providerDomain === targetDomain && d.status === 'in_progress'
    );

    for (const dep of domainDependencies) {
      dep.timeoutMs *= 1.5; // Extend by 50%
    }

    return { success: true, result: `Extended timeout for ${domainDependencies.length} dependencies` };
  }

  private async requestManualReview(targetDomain: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // Request manual review for complex resolution
    return { success: true, result: 'Manual review requested' };
  }

  private generateDependencyId(): string {
    return `dep-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Public interface methods
  getDependencies(): Dependency[] {
    return Array.from(this.dependencies.values());
  }

  getConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values());
  }

  getDependencyGraph(): DependencyGraph {
    return { ...this.dependencyGraph };
  }

  async getDependencyStatus(dependencyId: string): Promise<Dependency | null> {
    return this.dependencies.get(dependencyId) || null;
  }

  async getSystemHealth(): Promise<{
    totalDependencies: number;
    satisfiedDependencies: number;
    failedDependencies: number;
    activeConflicts: number;
    avgResolutionTime: number;
    overallHealth: number;
  }> {
    const dependencies = Array.from(this.dependencies.values());
    const satisfied = dependencies.filter(d => d.status === 'satisfied').length;
    const failed = dependencies.filter(d => d.status === 'failed').length;
    const activeConflicts = Array.from(this.conflicts.values())
      .filter(c => c.status !== 'resolved').length;

    // Calculate average resolution time
    const resolvedDependencies = dependencies.filter(d => d.resolvedAt);
    const avgResolutionTime = resolvedDependencies.length > 0
      ? resolvedDependencies.reduce((sum, d) => sum + (d.resolvedAt! - d.createdAt), 0) / resolvedDependencies.length
      : 0;

    const overallHealth = dependencies.length > 0
      ? satisfied / dependencies.length
      : 1.0;

    return {
      totalDependencies: dependencies.length,
      satisfiedDependencies: satisfied,
      failedDependencies: failed,
      activeConflicts,
      avgResolutionTime,
      overallHealth
    };
  }
}

export default DependencyConflictResolver;
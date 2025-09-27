/**
 * Task Distributor - Intelligent Task Distribution
 * Distributes tasks across the hierarchical swarm with:
 * - MECE (Mutually Exclusive, Collectively Exhaustive) distribution
 * - Load balancing algorithms
 * - Capability-based routing
 * - Priority-based scheduling
 * - Dependency resolution
 */

import { EventEmitter } from 'events';
import { Task, TaskPriority, TaskStatus } from '../types/task.types';
import { LoggerFactory } from '../../utils/logger';

// Semantic analysis interfaces
interface SemanticOverlap {
  task1Id: string;
  task2Id: string;
  similarity: number;
  conflictArea: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CoverageGap {
  domain: string;
  requiredCapability: string;
  severity: 'low' | 'medium' | 'high';
  suggestedTasks: string[];
}

interface MECEValidationResult {
  isValid: boolean;
  overlaps: SemanticOverlap[];
  gaps: CoverageGap[];
  score: number;
  recommendations: string[];
}

// Domain coverage requirements
interface DomainRequirements {
  [domain: string]: string[];
}

export interface DistributionPlan {
  readonly planId: string;
  readonly originalTask: Task;
  readonly subtasks: SubTask[];
  readonly assignments: TaskAssignment[];
  readonly dependencies: TaskDependency[];
  readonly estimatedCompletion: number;
  readonly parallelizable: boolean;
}

export interface SubTask {
  readonly id: string;
  readonly parentTaskId: string;
  readonly description: string;
  readonly domain: string;
  readonly priority: TaskPriority;
  readonly estimatedDuration: number;
  readonly requiredCapabilities: string[];
  readonly dependencies: string[];
  readonly resources: TaskResources;
}

export interface TaskAssignment {
  readonly assignmentId: string;
  readonly taskId: string;
  readonly assignedTo: string; // Princess or Drone ID
  readonly assignedAt: number;
  readonly estimatedCompletion: number;
  readonly status: AssignmentStatus;
  readonly priority: number;
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REASSIGNED = 'REASSIGNED'
}

export interface TaskDependency {
  readonly dependentTaskId: string;
  readonly prerequisiteTaskId: string;
  readonly dependencyType: DependencyType;
  readonly strict: boolean;
}

export enum DependencyType {
  SEQUENCE = 'SEQUENCE', // Must complete before
  RESOURCE = 'RESOURCE', // Shares resources
  DATA = 'DATA', // Depends on output
  PREFERENCE = 'PREFERENCE' // Preferred order
}

export interface TaskResources {
  memoryMB: number;
  cpuCores: number;
  networkMbps: number;
  storageMB: number;
  specializedTools: string[];
}

export interface DistributionMetrics {
  readonly totalTasks: number;
  readonly tasksDistributed: number;
  readonly tasksCompleted: number;
  readonly averageDistributionTime: number;
  readonly loadBalance: number; // 0-1, closer to 1 is better
  readonly utilizationRate: number;
  readonly dependencyResolutionSuccess: number;
}

export interface LoadBalancer {
  readonly strategy: LoadBalancingStrategy;
  readonly weights: Record<string, number>;
  readonly capacities: Record<string, number>;
  readonly currentLoads: Record<string, number>;
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  WEIGHTED_ROUND_ROBIN = 'WEIGHTED_ROUND_ROBIN',
  LEAST_CONNECTIONS = 'LEAST_CONNECTIONS',
  LEAST_RESPONSE_TIME = 'LEAST_RESPONSE_TIME',
  CAPABILITY_BASED = 'CAPABILITY_BASED',
  RESOURCE_AWARE = 'RESOURCE_AWARE'
}

export class TaskDistributor extends EventEmitter {
  private readonly distributionPlans = new Map<string, DistributionPlan>();
  private readonly activeAssignments = new Map<string, TaskAssignment>();
  private readonly dependencyGraph = new Map<string, Set<string>>();
  private readonly loadBalancer: LoadBalancer;

  private metrics: DistributionMetrics;
  private roundRobinIndex: number = 0;
  private isActive: boolean = false;
  private logger = LoggerFactory.getLogger('TaskDistributor');

  // Semantic MECE validation properties
  private readonly domainRequirements: DomainRequirements = {
    'development': ['code-generation', 'refactoring', 'implementation', 'unit-testing'],
    'architecture': ['system-design', 'pattern-analysis', 'dependency-management', 'scalability'],
    'quality': ['code-review', 'integration-testing', 'performance-testing', 'compliance'],
    'security': ['vulnerability-analysis', 'authentication', 'authorization', 'data-protection'],
    'performance': ['profiling', 'optimization', 'load-testing', 'monitoring'],
    'infrastructure': ['deployment', 'configuration', 'scaling', 'monitoring']
  };
  private readonly semanticThreshold = 0.7; // Threshold for semantic similarity
  
  constructor(loadBalancingStrategy: LoadBalancingStrategy = LoadBalancingStrategy.CAPABILITY_BASED) {
    super();
    this.loadBalancer = {
      strategy: loadBalancingStrategy,
      weights: {},
      capacities: {},
      currentLoads: {}
    };
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize task distributor
   */
  async initialize(): Promise<void> {
    console.log('[TaskDistributor] Initializing task distribution system...');
    
    try {
      // Initialize load balancer with Princess capabilities
      this.initializeLoadBalancer();
      
      this.isActive = true;
      console.log('[TaskDistributor] Task distributor initialized');
      
      this.emit('distributor:initialized');
      
    } catch (error) {
      console.error('[TaskDistributor] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Distribute task across the swarm using MECE principles
   */
  async distributeTask(task: Task): Promise<DistributionPlan> {
    console.log(`[TaskDistributor] Distributing task: ${task.id}`);
    
    const startTime = Date.now();
    
    try {
      // Analyze task complexity and requirements
      const complexity = this.analyzeTaskComplexity(task);
      
      // Determine if task should be decomposed
      const shouldDecompose = this.shouldDecomposeTask(task, complexity);
      
      let plan: DistributionPlan;
      
      if (shouldDecompose) {
        // Decompose into subtasks using MECE principles
        plan = await this.createDecomposedPlan(task, complexity);
      } else {
        // Assign as single task
        plan = await this.createDirectAssignmentPlan(task);
      }
      
      // Validate MECE compliance
      this.validateMECECompliance(plan);
      
      // Resolve dependencies
      await this.resolveDependencies(plan);
      
      // Store plan
      this.distributionPlans.set(plan.planId, plan);
      
      // Execute assignments
      await this.executeAssignments(plan);
      
      // Update metrics
      this.updateDistributionMetrics(Date.now() - startTime);
      
      console.log(`[TaskDistributor] Distribution plan created: ${plan.planId}`);
      this.emit('task:distributed', { task, plan });
      
      return plan;
      
    } catch (error) {
      console.error(`[TaskDistributor] Distribution failed for task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Reassign failed or stalled task
   */
  async reassignTask(
    taskId: string, 
    reason: string,
    excludeAssignees: string[] = []
  ): Promise<TaskAssignment | null> {
    console.log(`[TaskDistributor] Reassigning task ${taskId}: ${reason}`);
    
    try {
      // Find current assignment
      const currentAssignment = Array.from(this.activeAssignments.values())
        .find(assignment => assignment.taskId === taskId);
      
      if (!currentAssignment) {
        console.warn(`[TaskDistributor] No active assignment found for task ${taskId}`);
        return null;
      }
      
      // Mark current assignment as reassigned
      (currentAssignment as any).status = AssignmentStatus.REASSIGNED;
      
      // Find task in distribution plan
      const plan = this.findPlanByTaskId(taskId);
      if (!plan) {
        console.warn(`[TaskDistributor] No distribution plan found for task ${taskId}`);
        return null;
      }
      
      const task = plan.subtasks.find(subtask => subtask.id === taskId) || {
        id: taskId,
        parentTaskId: plan.originalTask.id,
        description: plan.originalTask.description,
        domain: plan.originalTask.domain,
        priority: plan.originalTask.priority || TaskPriority.MEDIUM,
        estimatedDuration: plan.originalTask.metadata?.estimatedDuration || 30,
        requiredCapabilities: [],
        dependencies: [],
        resources: this.getDefaultResources()
      };
      
      // Find new assignee
      const newAssignee = await this.findOptimalAssignee(
        task,
        [...excludeAssignees, currentAssignment.assignedTo]
      );
      
      if (!newAssignee) {
        console.warn(`[TaskDistributor] No alternative assignee found for task ${taskId}`);
        return null;
      }
      
      // Create new assignment
      const newAssignment = await this.createAssignment(task, newAssignee);
      
      // Execute assignment
      await this.executeAssignment(newAssignment);
      
      console.log(`[TaskDistributor] Task ${taskId} reassigned from ${currentAssignment.assignedTo} to ${newAssignee}`);
      
      this.emit('task:reassigned', {
        taskId,
        oldAssignee: currentAssignment.assignedTo,
        newAssignee,
        reason
      });
      
      return newAssignment;
      
    } catch (error) {
      console.error(`[TaskDistributor] Reassignment failed for task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Update load balancer weights and capacities
   */
  updateLoadBalancer(
    nodeId: string,
    capacity: number,
    currentLoad: number,
    weight: number = 1
  ): void {
    this.loadBalancer.capacities[nodeId] = capacity;
    this.loadBalancer.currentLoads[nodeId] = currentLoad;
    this.loadBalancer.weights[nodeId] = weight;
    
    console.log(`[TaskDistributor] Updated load balancer for ${nodeId}: capacity=${capacity}, load=${currentLoad}`);
  }

  /**
   * Get distribution plan by ID
   */
  getDistributionPlan(planId: string): DistributionPlan | undefined {
    return this.distributionPlans.get(planId);
  }

  /**
   * Get active assignments
   */
  getActiveAssignments(): TaskAssignment[] {
    return Array.from(this.activeAssignments.values());
  }

  /**
   * Get distribution metrics
   */
  getMetrics(): DistributionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get dependency graph for task
   */
  getDependencyGraph(taskId: string): string[] {
    return Array.from(this.dependencyGraph.get(taskId) || []);
  }

  /**
   * Complete task assignment
   */
  async completeAssignment(
    assignmentId: string,
    result: any,
    duration: number
  ): Promise<void> {
    const assignment = this.activeAssignments.get(assignmentId);
    if (!assignment) {
      console.warn(`[TaskDistributor] Assignment ${assignmentId} not found`);
      return;
    }
    
    console.log(`[TaskDistributor] Completing assignment: ${assignmentId}`);
    
    // Update assignment status
    (assignment as any).status = AssignmentStatus.COMPLETED;
    
    // Update load balancer
    const nodeId = assignment.assignedTo;
    if (this.loadBalancer.currentLoads[nodeId] !== undefined) {
      this.loadBalancer.currentLoads[nodeId] = Math.max(0, 
        this.loadBalancer.currentLoads[nodeId] - 1
      );
    }
    
    // Remove from active assignments
    this.activeAssignments.delete(assignmentId);
    
    // Check if dependent tasks can now be executed
    await this.processDependentTasks(assignment.taskId);
    
    // Update metrics
    this.metrics.tasksCompleted++;
    
    this.emit('assignment:completed', {
      assignment,
      result,
      duration
    });
  }

  /**
   * Fail task assignment
   */
  async failAssignment(
    assignmentId: string,
    error: Error,
    shouldReassign: boolean = true
  ): Promise<void> {
    const assignment = this.activeAssignments.get(assignmentId);
    if (!assignment) {
      console.warn(`[TaskDistributor] Assignment ${assignmentId} not found`);
      return;
    }
    
    console.log(`[TaskDistributor] Failing assignment: ${assignmentId}`);
    
    // Update assignment status
    (assignment as any).status = AssignmentStatus.FAILED;
    
    // Update load balancer
    const nodeId = assignment.assignedTo;
    if (this.loadBalancer.currentLoads[nodeId] !== undefined) {
      this.loadBalancer.currentLoads[nodeId] = Math.max(0, 
        this.loadBalancer.currentLoads[nodeId] - 1
      );
    }
    
    // Remove from active assignments
    this.activeAssignments.delete(assignmentId);
    
    // Attempt reassignment if requested
    if (shouldReassign) {
      await this.reassignTask(
        assignment.taskId,
        `Assignment failed: ${error.message}`,
        [assignment.assignedTo]
      );
    }
    
    this.emit('assignment:failed', {
      assignment,
      error,
      reassigned: shouldReassign
    });
  }

  /**
   * Shutdown task distributor
   */
  async shutdown(): Promise<void> {
    console.log('[TaskDistributor] Shutting down task distribution system...');
    
    // Clear active assignments (gracefully if possible)
    this.activeAssignments.clear();
    
    // Clear distribution plans
    this.distributionPlans.clear();
    
    // Clear dependency graph
    this.dependencyGraph.clear();
    
    this.isActive = false;
    
    console.log('[TaskDistributor] Shutdown complete');
  }

  // ===== Private Methods =====

  private initializeMetrics(): DistributionMetrics {
    return {
      totalTasks: 0,
      tasksDistributed: 0,
      tasksCompleted: 0,
      averageDistributionTime: 0,
      loadBalance: 0,
      utilizationRate: 0,
      dependencyResolutionSuccess: 0
    };
  }

  private initializeLoadBalancer(): void {
    // Initialize with known Princess domains
    const domains = ['Development', 'Architecture', 'Quality', 'Performance', 'Infrastructure', 'Security'];
    
    domains.forEach(domain => {
      this.loadBalancer.capacities[domain] = 10; // Default capacity
      this.loadBalancer.currentLoads[domain] = 0;
      this.loadBalancer.weights[domain] = 1; // Equal weight initially
    });
  }

  private analyzeTaskComplexity(task: Task): number {
    let complexity = 0;
    
    // Base complexity from task metadata
    if (task.metadata?.complexity) {
      complexity += task.metadata.complexity;
    } else {
      complexity = 5; // Default medium complexity
    }
    
    // Increase complexity based on files involved
    if (task.files) {
      complexity += Math.min(task.files.length * 0.5, 5);
    }
    
    // Increase complexity based on dependencies
    if (task.dependencies) {
      complexity += Math.min(task.dependencies.length * 0.3, 3);
    }
    
    // Increase complexity based on estimated LOC
    if (task.estimatedLOC) {
      complexity += Math.min(task.estimatedLOC / 100, 10);
    }
    
    return Math.min(complexity, 20); // Cap at 20
  }

  private shouldDecomposeTask(task: Task, complexity: number): boolean {
    // Decompose if complexity is high or specific conditions are met
    return complexity > 10 || 
           (task.files && task.files.length > 5) ||
           (task.estimatedLOC && task.estimatedLOC > 500) ||
           (task.metadata?.estimatedDuration && task.metadata.estimatedDuration > 120); // 2 hours
  }

  private async createDecomposedPlan(task: Task, complexity: number): Promise<DistributionPlan> {
    const planId = this.generatePlanId();
    
    // Decompose task into MECE subtasks
    const subtasks = this.decomposeTask(task, complexity);
    
    // Create dependencies between subtasks
    const dependencies = this.identifyDependencies(subtasks);
    
    // Create assignments for each subtask
    const assignments: TaskAssignment[] = [];
    
    for (const subtask of subtasks) {
      const assignee = await this.findOptimalAssignee(subtask);
      if (assignee) {
        const assignment = await this.createAssignment(subtask, assignee);
        assignments.push(assignment);
      }
    }
    
    return {
      planId,
      originalTask: task,
      subtasks,
      assignments,
      dependencies,
      estimatedCompletion: this.calculateEstimatedCompletion(subtasks, dependencies),
      parallelizable: this.isParallelizable(dependencies)
    };
  }

  private async createDirectAssignmentPlan(task: Task): Promise<DistributionPlan> {
    const planId = this.generatePlanId();
    
    const subtask: SubTask = {
      id: task.id,
      parentTaskId: task.id,
      description: task.description,
      domain: task.domain,
      priority: task.priority || TaskPriority.MEDIUM,
      estimatedDuration: task.metadata?.estimatedDuration || 30,
      requiredCapabilities: task.metadata?.requiredCapabilities || [],
      dependencies: [],
      resources: this.getDefaultResources()
    };
    
    const assignee = await this.findOptimalAssignee(subtask);
    const assignments: TaskAssignment[] = [];
    
    if (assignee) {
      const assignment = await this.createAssignment(subtask, assignee);
      assignments.push(assignment);
    }
    
    return {
      planId,
      originalTask: task,
      subtasks: [subtask],
      assignments,
      dependencies: [],
      estimatedCompletion: subtask.estimatedDuration,
      parallelizable: true
    };
  }

  private decomposeTask(task: Task, complexity: number): SubTask[] {
    const subtasks: SubTask[] = [];
    
    // Basic decomposition strategy based on domain and complexity
    switch (task.domain) {
      case 'Development':
        subtasks.push(...this.decomposeDevelopmentTask(task, complexity));
        break;
      case 'Architecture':
        subtasks.push(...this.decomposeArchitectureTask(task, complexity));
        break;
      case 'Quality':
        subtasks.push(...this.decomposeQualityTask(task, complexity));
        break;
      default:
        // Generic decomposition
        subtasks.push(...this.decomposeGenericTask(task, complexity));
    }
    
    return subtasks;
  }

  private decomposeDevelopmentTask(task: Task, complexity: number): SubTask[] {
    const subtasks: SubTask[] = [];
    
    // Always include planning phase
    subtasks.push({
      id: `${task.id}-plan`,
      parentTaskId: task.id,
      description: `Plan implementation for ${task.name}`,
      domain: 'Development',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 2),
      requiredCapabilities: ['planning', 'architecture'],
      dependencies: [],
      resources: this.getDefaultResources()
    });
    
    // Implementation phase
    subtasks.push({
      id: `${task.id}-implement`,
      parentTaskId: task.id,
      description: `Implement ${task.name}`,
      domain: 'Development',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 5),
      requiredCapabilities: ['coding', 'implementation'],
      dependencies: [`${task.id}-plan`],
      resources: this.getDefaultResources()
    });
    
    // Testing phase
    subtasks.push({
      id: `${task.id}-test`,
      parentTaskId: task.id,
      description: `Test ${task.name}`,
      domain: 'Quality',
      priority: TaskPriority.MEDIUM,
      estimatedDuration: Math.ceil(complexity * 3),
      requiredCapabilities: ['testing', 'validation'],
      dependencies: [`${task.id}-implement`],
      resources: this.getDefaultResources()
    });
    
    return subtasks;
  }

  private decomposeArchitectureTask(task: Task, complexity: number): SubTask[] {
    const subtasks: SubTask[] = [];
    
    // Analysis phase
    subtasks.push({
      id: `${task.id}-analyze`,
      parentTaskId: task.id,
      description: `Analyze requirements for ${task.name}`,
      domain: 'Architecture',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 3),
      requiredCapabilities: ['analysis', 'requirements'],
      dependencies: [],
      resources: this.getDefaultResources()
    });
    
    // Design phase
    subtasks.push({
      id: `${task.id}-design`,
      parentTaskId: task.id,
      description: `Design architecture for ${task.name}`,
      domain: 'Architecture',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 4),
      requiredCapabilities: ['design', 'architecture'],
      dependencies: [`${task.id}-analyze`],
      resources: this.getDefaultResources()
    });
    
    // Validation phase
    subtasks.push({
      id: `${task.id}-validate`,
      parentTaskId: task.id,
      description: `Validate architecture for ${task.name}`,
      domain: 'Quality',
      priority: TaskPriority.MEDIUM,
      estimatedDuration: Math.ceil(complexity * 2),
      requiredCapabilities: ['validation', 'review'],
      dependencies: [`${task.id}-design`],
      resources: this.getDefaultResources()
    });
    
    return subtasks;
  }

  private decomposeQualityTask(task: Task, complexity: number): SubTask[] {
    const subtasks: SubTask[] = [];
    
    // Review phase
    subtasks.push({
      id: `${task.id}-review`,
      parentTaskId: task.id,
      description: `Review ${task.name}`,
      domain: 'Quality',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 2),
      requiredCapabilities: ['review', 'analysis'],
      dependencies: [],
      resources: this.getDefaultResources()
    });
    
    // Testing phase
    subtasks.push({
      id: `${task.id}-test`,
      parentTaskId: task.id,
      description: `Test ${task.name}`,
      domain: 'Quality',
      priority: TaskPriority.HIGH,
      estimatedDuration: Math.ceil(complexity * 3),
      requiredCapabilities: ['testing', 'automation'],
      dependencies: [`${task.id}-review`],
      resources: this.getDefaultResources()
    });
    
    return subtasks;
  }

  private decomposeGenericTask(task: Task, complexity: number): SubTask[] {
    // Simple binary decomposition for generic tasks
    const half = Math.ceil(complexity / 2);
    
    return [
      {
        id: `${task.id}-part1`,
        parentTaskId: task.id,
        description: `${task.name} - Part 1`,
        domain: task.domain,
        priority: task.priority || TaskPriority.MEDIUM,
        estimatedDuration: half * 10,
        requiredCapabilities: [],
        dependencies: [],
        resources: this.getDefaultResources()
      },
      {
        id: `${task.id}-part2`,
        parentTaskId: task.id,
        description: `${task.name} - Part 2`,
        domain: task.domain,
        priority: task.priority || TaskPriority.MEDIUM,
        estimatedDuration: (complexity - half) * 10,
        requiredCapabilities: [],
        dependencies: [`${task.id}-part1`],
        resources: this.getDefaultResources()
      }
    ];
  }

  private identifyDependencies(subtasks: SubTask[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];
    
    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        dependencies.push({
          dependentTaskId: subtask.id,
          prerequisiteTaskId: depId,
          dependencyType: DependencyType.SEQUENCE,
          strict: true
        });
      }
    }
    
    return dependencies;
  }

  private async findOptimalAssignee(subtask: SubTask, excludeList: string[] = []): Promise<string | null> {
    const availableNodes = Object.keys(this.loadBalancer.capacities)
      .filter(nodeId => !excludeList.includes(nodeId));
    
    if (availableNodes.length === 0) {
      return null;
    }
    
    switch (this.loadBalancer.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(availableNodes);
      
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(availableNodes);
      
      case LoadBalancingStrategy.CAPABILITY_BASED:
        return this.selectByCapability(availableNodes, subtask);
      
      case LoadBalancingStrategy.RESOURCE_AWARE:
        return this.selectByResources(availableNodes, subtask);
      
      default:
        return availableNodes[0];
    }
  }

  private selectRoundRobin(nodes: string[]): string {
    const selected = nodes[this.roundRobinIndex % nodes.length];
    this.roundRobinIndex++;
    return selected;
  }

  private selectLeastConnections(nodes: string[]): string {
    return nodes.reduce((least, current) => {
      const leastLoad = this.loadBalancer.currentLoads[least] || 0;
      const currentLoad = this.loadBalancer.currentLoads[current] || 0;
      return currentLoad < leastLoad ? current : least;
    });
  }

  private selectByCapability(nodes: string[], subtask: SubTask): string {
    // Prefer domain match
    const domainMatch = nodes.find(node => node === subtask.domain);
    if (domainMatch) {
      return domainMatch;
    }
    
    // Fallback to least connections
    return this.selectLeastConnections(nodes);
  }

  private selectByResources(nodes: string[], subtask: SubTask): string {
    // Select node with sufficient resources and lowest utilization
    return nodes.reduce((best, current) => {
      const bestCapacity = this.loadBalancer.capacities[best] || 0;
      const bestLoad = this.loadBalancer.currentLoads[best] || 0;
      const bestUtilization = bestCapacity > 0 ? bestLoad / bestCapacity : 1;
      
      const currentCapacity = this.loadBalancer.capacities[current] || 0;
      const currentLoad = this.loadBalancer.currentLoads[current] || 0;
      const currentUtilization = currentCapacity > 0 ? currentLoad / currentCapacity : 1;
      
      return currentUtilization < bestUtilization ? current : best;
    });
  }

  private async createAssignment(subtask: SubTask, assignee: string): Promise<TaskAssignment> {
    const assignmentId = this.generateAssignmentId();
    
    const assignment: TaskAssignment = {
      assignmentId,
      taskId: subtask.id,
      assignedTo: assignee,
      assignedAt: Date.now(),
      estimatedCompletion: Date.now() + (subtask.estimatedDuration * 60000),
      status: AssignmentStatus.PENDING,
      priority: this.convertPriorityToNumber(subtask.priority)
    };
    
    return assignment;
  }

  private convertPriorityToNumber(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.CRITICAL: return 1;
      case TaskPriority.HIGH: return 2;
      case TaskPriority.MEDIUM: return 5;
      case TaskPriority.LOW: return 8;
      default: return 5;
    }
  }

  private async validateMECECompliance(plan: DistributionPlan): Promise<MECEValidationResult> {
    const validationResult: MECEValidationResult = {
      isValid: true,
      overlaps: [],
      gaps: [],
      score: 0,
      recommendations: []
    };

    // 1. Check Mutually Exclusive (no overlapping work) with semantic analysis
    const overlaps = await this.detectSemanticOverlaps(plan.subtasks);
    validationResult.overlaps = overlaps;

    // 2. Check Collectively Exhaustive (covers all required domains)
    const gaps = await this.detectCoverageGaps(plan);
    validationResult.gaps = gaps;

    // 3. Calculate MECE score
    validationResult.score = this.calculateMECEScore(overlaps, gaps, plan.subtasks.length);

    // 4. Generate recommendations
    validationResult.recommendations = this.generateMECERecommendations(overlaps, gaps);

    // 5. Determine overall validity
    validationResult.isValid = validationResult.score >= 0.75;

    this.logger.info('MECE validation completed', {
      component: 'TaskDistributor',
      planId: plan.planId,
      score: validationResult.score,
      overlapsFound: overlaps.length,
      gapsFound: gaps.length,
      isValid: validationResult.isValid
    });

    return validationResult;
  }

  private async resolveDependencies(plan: DistributionPlan): Promise<void> {
    // Build dependency graph for this plan
    for (const dependency of plan.dependencies) {
      const deps = this.dependencyGraph.get(dependency.dependentTaskId) || new Set();
      deps.add(dependency.prerequisiteTaskId);
      this.dependencyGraph.set(dependency.dependentTaskId, deps);
    }
    
    // Validate no circular dependencies
    this.validateNoCycles(plan.subtasks.map(st => st.id));
  }

  private validateNoCycles(taskIds: string[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true; // Back edge found, cycle detected
      }
      
      if (visited.has(taskId)) {
        return false; // Already processed
      }
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const dependencies = this.dependencyGraph.get(taskId) || new Set();
      for (const dep of dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const taskId of taskIds) {
      if (hasCycle(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`);
      }
    }
  }

  private async executeAssignments(plan: DistributionPlan): Promise<void> {
    for (const assignment of plan.assignments) {
      await this.executeAssignment(assignment);
    }
  }

  private async executeAssignment(assignment: TaskAssignment): Promise<void> {
    // Store assignment
    this.activeAssignments.set(assignment.assignmentId, assignment);
    
    // Update load balancer
    const nodeId = assignment.assignedTo;
    if (this.loadBalancer.currentLoads[nodeId] !== undefined) {
      this.loadBalancer.currentLoads[nodeId]++;
    }
    
    // Update assignment status
    (assignment as any).status = AssignmentStatus.ASSIGNED;
    
    console.log(`[TaskDistributor] Executed assignment: ${assignment.assignmentId} -> ${assignment.assignedTo}`);
    
    this.emit('assignment:executed', { assignment });
  }

  private calculateEstimatedCompletion(
    subtasks: SubTask[],
    dependencies: TaskDependency[]
  ): number {
    // Critical path calculation
    const taskDurations = new Map(subtasks.map(st => [st.id, st.estimatedDuration]));
    
    // Build adjacency list for dependencies
    const dependents = new Map<string, string[]>();
    for (const dep of dependencies) {
      const list = dependents.get(dep.prerequisiteTaskId) || [];
      list.push(dep.dependentTaskId);
      dependents.set(dep.prerequisiteTaskId, list);
    }
    
    // Find critical path using topological sort + longest path
    const visited = new Set<string>();
    const earliestStart = new Map<string, number>();
    
    const calculateEarliestStart = (taskId: string): number => {
      if (visited.has(taskId)) {
        return earliestStart.get(taskId) || 0;
      }
      
      visited.add(taskId);
      
      const deps = this.dependencyGraph.get(taskId) || new Set();
      let maxPrerequisiteEnd = 0;
      
      for (const depId of deps) {
        const depStart = calculateEarliestStart(depId);
        const depDuration = taskDurations.get(depId) || 0;
        maxPrerequisiteEnd = Math.max(maxPrerequisiteEnd, depStart + depDuration);
      }
      
      earliestStart.set(taskId, maxPrerequisiteEnd);
      return maxPrerequisiteEnd;
    };
    
    // Calculate for all tasks
    let maxCompletion = 0;
    for (const taskId of taskDurations.keys()) {
      const start = calculateEarliestStart(taskId);
      const duration = taskDurations.get(taskId) || 0;
      maxCompletion = Math.max(maxCompletion, start + duration);
    }
    
    return maxCompletion;
  }

  private isParallelizable(dependencies: TaskDependency[]): boolean {
    // If there are no strict sequence dependencies, tasks can be parallelized
    return !dependencies.some(dep => 
      dep.dependencyType === DependencyType.SEQUENCE && dep.strict
    );
  }

  private async processDependentTasks(completedTaskId: string): Promise<void> {
    // Find tasks that were waiting for this task
    for (const [assignmentId, assignment] of this.activeAssignments) {
      if (assignment.status === AssignmentStatus.PENDING) {
        const dependencies = this.dependencyGraph.get(assignment.taskId) || new Set();
        
        // Check if all dependencies are now satisfied
        const allDependenciesMet = Array.from(dependencies).every(depId => {
          // Check if dependency is completed
          return this.isTaskCompleted(depId);
        });
        
        if (allDependenciesMet) {
          // Task can now proceed
          (assignment as any).status = AssignmentStatus.IN_PROGRESS;
          
          this.emit('task:ready', {
            taskId: assignment.taskId,
            assignmentId,
            triggeredBy: completedTaskId
          });
        }
      }
    }
  }

  private isTaskCompleted(taskId: string): boolean {
    // Check if task is in completed assignments or no longer active
    return !Array.from(this.activeAssignments.values())
      .some(assignment => assignment.taskId === taskId);
  }

  private findPlanByTaskId(taskId: string): DistributionPlan | null {
    for (const plan of this.distributionPlans.values()) {
      if (plan.originalTask.id === taskId || 
          plan.subtasks.some(st => st.id === taskId)) {
        return plan;
      }
    }
    return null;
  }

  private updateDistributionMetrics(distributionTime: number): void {
    this.metrics.tasksDistributed++;
    this.metrics.totalTasks++;
    
    // Update average distribution time
    const total = this.metrics.tasksDistributed;
    this.metrics.averageDistributionTime = 
      (this.metrics.averageDistributionTime * (total - 1) + distributionTime) / total;
  }

  private updateMetrics(): void {
    // Calculate load balance
    const loads = Object.values(this.loadBalancer.currentLoads);
    const capacities = Object.values(this.loadBalancer.capacities);
    
    if (loads.length > 0 && capacities.length > 0) {
      const utilizations = loads.map((load, i) => 
        capacities[i] > 0 ? load / capacities[i] : 0
      );
      
      const avgUtilization = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length;
      const variance = utilizations.reduce((sum, util) => 
        sum + Math.pow(util - avgUtilization, 2), 0
      ) / utilizations.length;
      
      // Load balance: lower variance = better balance
      this.metrics.loadBalance = Math.max(0, 1 - Math.sqrt(variance));
      this.metrics.utilizationRate = avgUtilization;
    }
  }

  private getDefaultResources(): TaskResources {
    return {
      memoryMB: 512,
      cpuCores: 1,
      networkMbps: 10,
      storageMB: 100,
      specializedTools: []
    };
  }

  private generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateAssignmentId(): string {
    return `assign-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Detect semantic overlaps between subtasks using similarity analysis
   */
  private async detectSemanticOverlaps(subtasks: SubTask[]): Promise<SemanticOverlap[]> {
    const overlaps: SemanticOverlap[] = [];

    for (let i = 0; i < subtasks.length; i++) {
      for (let j = i + 1; j < subtasks.length; j++) {
        const similarity = await this.calculateSemanticSimilarity(
          subtasks[i].description,
          subtasks[j].description
        );

        if (similarity > this.semanticThreshold) {
          const conflictArea = await this.identifyConflictArea(subtasks[i], subtasks[j]);
          const riskLevel = this.assessOverlapRisk(similarity, subtasks[i], subtasks[j]);

          overlaps.push({
            task1Id: subtasks[i].id,
            task2Id: subtasks[j].id,
            similarity,
            conflictArea,
            riskLevel
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Calculate semantic similarity between two task descriptions
   */
  private async calculateSemanticSimilarity(desc1: string, desc2: string): Promise<number> {
    // Simplified semantic similarity using keyword overlap and Jaccard similarity
    const keywords1 = this.extractKeywords(desc1);
    const keywords2 = this.extractKeywords(desc2);

    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];

    // Jaccard similarity + domain-specific weighting
    const jaccardSimilarity = intersection.length / union.length;
    const domainSimilarity = this.calculateDomainSimilarity(desc1, desc2);

    return (jaccardSimilarity + domainSimilarity) / 2;
  }

  /**
   * Extract keywords from task description
   */
  private extractKeywords(description: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const technicalTerms = ['implement', 'create', 'develop', 'test', 'deploy', 'configure', 'optimize', 'refactor'];

    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .concat(technicalTerms.filter(term => description.toLowerCase().includes(term)));
  }

  /**
   * Calculate domain-specific similarity
   */
  private calculateDomainSimilarity(desc1: string, desc2: string): number {
    let similarity = 0;

    for (const [domain, capabilities] of Object.entries(this.domainRequirements)) {
      const desc1HasDomain = capabilities.some(cap => desc1.toLowerCase().includes(cap));
      const desc2HasDomain = capabilities.some(cap => desc2.toLowerCase().includes(cap));

      if (desc1HasDomain && desc2HasDomain) {
        similarity += 0.3; // High penalty for same domain overlap
      }
    }

    return Math.min(1.0, similarity);
  }

  /**
   * Identify the specific area of conflict between two tasks
   */
  private async identifyConflictArea(task1: SubTask, task2: SubTask): Promise<string> {
    const commonCapabilities = task1.requiredCapabilities.filter(cap =>
      task2.requiredCapabilities.includes(cap)
    );

    if (commonCapabilities.length > 0) {
      return `Capability overlap: ${commonCapabilities.join(', ')}`;
    }

    if (task1.domain === task2.domain) {
      return `Domain overlap: ${task1.domain}`;
    }

    return 'Resource contention or workflow dependency';
  }

  /**
   * Assess the risk level of task overlap
   */
  private assessOverlapRisk(similarity: number, task1: SubTask, task2: SubTask): 'low' | 'medium' | 'high' {
    if (similarity > 0.9) return 'high';
    if (similarity > 0.8) return 'medium';

    // Same domain tasks have higher risk
    if (task1.domain === task2.domain && similarity > 0.7) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Detect coverage gaps in the distribution plan
   */
  private async detectCoverageGaps(plan: DistributionPlan): Promise<CoverageGap[]> {
    const gaps: CoverageGap[] = [];
    const coveredCapabilities = new Set<string>();

    // Collect all covered capabilities
    plan.subtasks.forEach(task => {
      task.requiredCapabilities.forEach(cap => coveredCapabilities.add(cap));
    });

    // Check each domain for coverage gaps
    for (const [domain, requiredCapabilities] of Object.entries(this.domainRequirements)) {
      const domainTasks = plan.subtasks.filter(task => task.domain === domain);

      if (domainTasks.length === 0) {
        // Entire domain missing
        gaps.push({
          domain,
          requiredCapability: 'entire-domain',
          severity: 'high',
          suggestedTasks: [`Create ${domain} subtask for ${plan.originalTask.title}`]
        });
        continue;
      }

      // Check for missing capabilities within domain
      for (const capability of requiredCapabilities) {
        if (!coveredCapabilities.has(capability)) {
          gaps.push({
            domain,
            requiredCapability: capability,
            severity: this.assessGapSeverity(capability, plan.originalTask),
            suggestedTasks: [`Add ${capability} task to ${domain} domain`]
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Assess the severity of a coverage gap
   */
  private assessGapSeverity(capability: string, originalTask: Task): 'low' | 'medium' | 'high' {
    const criticalCapabilities = ['security-analysis', 'testing', 'deployment', 'monitoring'];
    const moderateCapabilities = ['documentation', 'optimization', 'integration'];

    if (criticalCapabilities.some(cap => capability.includes(cap))) {
      return 'high';
    }

    if (moderateCapabilities.some(cap => capability.includes(cap))) {
      return 'medium';
    }

    // Check if the original task explicitly mentions this capability
    if (originalTask.description.toLowerCase().includes(capability.toLowerCase())) {
      return 'high';
    }

    return 'low';
  }

  /**
   * Calculate overall MECE score
   */
  private calculateMECEScore(overlaps: SemanticOverlap[], gaps: CoverageGap[], taskCount: number): number {
    // Base score
    let score = 1.0;

    // Penalty for overlaps
    const overlapPenalty = overlaps.reduce((penalty, overlap) => {
      switch (overlap.riskLevel) {
        case 'high': return penalty + 0.3;
        case 'medium': return penalty + 0.2;
        case 'low': return penalty + 0.1;
        default: return penalty;
      }
    }, 0);

    // Penalty for gaps
    const gapPenalty = gaps.reduce((penalty, gap) => {
      switch (gap.severity) {
        case 'high': return penalty + 0.25;
        case 'medium': return penalty + 0.15;
        case 'low': return penalty + 0.05;
        default: return penalty;
      }
    }, 0);

    // Apply penalties
    score -= (overlapPenalty + gapPenalty) / taskCount;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate recommendations for improving MECE compliance
   */
  private generateMECERecommendations(overlaps: SemanticOverlap[], gaps: CoverageGap[]): string[] {
    const recommendations: string[] = [];

    // Recommendations for overlaps
    overlaps.forEach(overlap => {
      if (overlap.riskLevel === 'high') {
        recommendations.push(`CRITICAL: Merge or clearly separate tasks ${overlap.task1Id} and ${overlap.task2Id} - ${overlap.conflictArea}`);
      } else if (overlap.riskLevel === 'medium') {
        recommendations.push(`Consider consolidating similar work in tasks ${overlap.task1Id} and ${overlap.task2Id}`);
      }
    });

    // Recommendations for gaps
    gaps.forEach(gap => {
      if (gap.severity === 'high') {
        recommendations.push(`MISSING: Add ${gap.requiredCapability} capability to ${gap.domain} domain`);
      } else if (gap.severity === 'medium') {
        recommendations.push(`Consider adding ${gap.requiredCapability} for complete coverage`);
      }
    });

    // General recommendations
    if (overlaps.length > 3) {
      recommendations.push('High overlap detected - consider redesigning task decomposition');
    }

    if (gaps.length > 5) {
      recommendations.push('Multiple coverage gaps - review domain requirements');
    }

    return recommendations;
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:40:00-04:00 | queen@claude-sonnet-4 | Create intelligent task distributor with MECE principles | TaskDistributor.ts | OK | -- | 0.00 | b8e7f4c |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-009
 * - inputs: ["DronePoolManager.ts", "task.types.ts"]
 * - tools_used: ["TodoWrite", "MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
/**
 * Princess Coordinator - Princess-level Orchestration
 * Manages coordination within Princess domains with:
 * - Domain-specific task coordination
 * - Agent spawning and management
 * - Resource allocation optimization
 * - Cross-domain communication
 * - Performance monitoring
 */

import { EventEmitter } from 'events';
import { PrincessBase } from '../hierarchy/base/PrincessBase';
import { Task, TaskResult, TaskStatus } from '../types/task.types';

export interface PrincessAgent {
  readonly id: string;
  readonly type: string;
  readonly capabilities: string[];
  readonly status: AgentStatus;
  readonly currentTask?: string;
  readonly performance: AgentPerformance;
  readonly spawnedAt: number;
  readonly lastActivity: number;
}

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED'
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksSucceeded: number;
  averageTaskTime: number;
  successRate: number;
  errorCount: number;
  lastUpdate: number;
}

export interface CoordinationMetrics {
  readonly totalAgents: number;
  readonly activeAgents: number;
  readonly idleAgents: number;
  readonly tasksInProgress: number;
  readonly tasksCompleted: number;
  readonly averageTaskTime: number;
  readonly resourceUtilization: number;
  readonly agentEfficiency: number;
}

export interface ResourceAllocation {
  readonly agentId: string;
  readonly memoryMB: number;
  readonly cpuCores: number;
  readonly networkBandwidth: number;
  readonly priority: number;
  readonly allocated: boolean;
}

export class PrincessCoordinator extends EventEmitter {
  private readonly princess: PrincessBase;
  private readonly domain: string;
  private readonly maxConcurrentAgents: number;
  
  private readonly agents = new Map<string, PrincessAgent>();
  private readonly activeTasks = new Map<string, Task>();
  private readonly taskQueue: Task[] = [];
  private readonly resourceAllocations = new Map<string, ResourceAllocation>();
  
  private metrics: CoordinationMetrics;
  private monitoringInterval?: NodeJS.Timeout;
  private isActive: boolean = false;
  
  constructor(princess: PrincessBase, domain: string, maxConcurrentAgents: number = 10) {
    super();
    this.princess = princess;
    this.domain = domain;
    this.maxConcurrentAgents = maxConcurrentAgents;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize Princess coordination
   */
  async initialize(): Promise<void> {
    console.log(`[PrincessCoordinator:${this.domain}] Initializing coordination...`);
    
    try {
      // Setup Princess event handlers
      this.setupPrincessHandlers();
      
      // Start monitoring
      this.startMonitoring();
      
      // Spawn initial agents based on domain
      await this.spawnInitialAgents();
      
      this.isActive = true;
      console.log(`[PrincessCoordinator:${this.domain}] Coordination initialized`);
      
      this.emit('coordinator:initialized', { domain: this.domain });
      
    } catch (error) {
      console.error(`[PrincessCoordinator:${this.domain}] Initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Coordinate task execution across agents
   */
  async coordinateTask(task: Task): Promise<TaskResult> {
    console.log(`[PrincessCoordinator:${this.domain}] Coordinating task: ${task.id}`);
    
    try {
      // Validate task is for this domain
      if (task.domain !== this.domain) {
        throw new Error(`Task ${task.id} not for domain ${this.domain}`);
      }
      
      // Find optimal agent for task
      const agentId = await this.selectOptimalAgent(task);
      
      if (!agentId) {
        // Queue task if no agents available
        this.taskQueue.push(task);
        return {
          taskId: task.id,
          status: TaskStatus.PENDING,
          duration: 0
        };
      }
      
      // Assign task to agent
      await this.assignTaskToAgent(task, agentId);
      
      // Execute task
      const result = await this.executeTaskWithAgent(task, agentId);
      
      // Update metrics
      this.updateTaskMetrics(result);
      
      // Process queued tasks
      this.processTaskQueue();
      
      return result;
      
    } catch (error) {
      console.error(`[PrincessCoordinator:${this.domain}] Task coordination failed:`, error);
      
      return {
        taskId: task.id,
        status: TaskStatus.FAILED,
        error: error as Error,
        duration: 0
      };
    }
  }

  /**
   * Spawn new agent in domain
   */
  async spawnAgent(agentType: string, capabilities: string[]): Promise<string> {
    if (this.agents.size >= this.maxConcurrentAgents) {
      throw new Error(`Maximum concurrent agents (${this.maxConcurrentAgents}) reached`);
    }
    
    try {
      const agentId = this.generateAgentId(agentType);
      
      // Create agent record
      const agent: PrincessAgent = {
        id: agentId,
        type: agentType,
        capabilities,
        status: AgentStatus.IDLE,
        performance: this.initializeAgentPerformance(),
        spawnedAt: Date.now(),
        lastActivity: Date.now()
      };
      
      // Spawn via MCP if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__claude_flow__agent_spawn) {
        await (globalThis as any).mcp__claude_flow__agent_spawn({
          type: agentType,
          capabilities,
          domain: this.domain
        });
      }
      
      // Store agent
      this.agents.set(agentId, agent);
      
      // Allocate resources
      await this.allocateResources(agentId);
      
      console.log(`[PrincessCoordinator:${this.domain}] Spawned agent: ${agentId}`);
      this.emit('agent:spawned', { agentId, agent });
      
      return agentId;
      
    } catch (error) {
      console.error(`[PrincessCoordinator:${this.domain}] Agent spawn failed:`, error);
      throw error;
    }
  }

  /**
   * Terminate agent
   */
  async terminateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`[PrincessCoordinator:${this.domain}] Agent ${agentId} not found`);
      return;
    }
    
    try {
      // Cancel current task if any
      if (agent.currentTask) {
        await this.cancelAgentTask(agentId);
      }
      
      // Deallocate resources
      this.deallocateResources(agentId);
      
      // Remove agent
      this.agents.delete(agentId);
      
      console.log(`[PrincessCoordinator:${this.domain}] Terminated agent: ${agentId}`);
      this.emit('agent:terminated', { agentId, agent });
      
    } catch (error) {
      console.error(`[PrincessCoordinator:${this.domain}] Agent termination failed:`, error);
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): PrincessAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): PrincessAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get coordination metrics
   */
  getMetrics(): CoordinationMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get resource utilization
   */
  getResourceUtilization(): any {
    const totalAllocated = Array.from(this.resourceAllocations.values())
      .reduce((total, allocation) => ({
        memory: total.memory + allocation.memoryMB,
        cpu: total.cpu + allocation.cpuCores,
        network: total.network + allocation.networkBandwidth
      }), { memory: 0, cpu: 0, network: 0 });
    
    return {
      agents: this.agents.size,
      allocations: totalAllocated,
      utilization: {
        memory: (totalAllocated.memory / (this.agents.size * 512)) || 0, // 512MB per agent default
        cpu: (totalAllocated.cpu / (this.agents.size * 1)) || 0, // 1 core per agent default
        network: (totalAllocated.network / (this.agents.size * 100)) || 0 // 100 Mbps per agent default
      }
    };
  }

  /**
   * Scale agent pool
   */
  async scaleAgents(targetCount: number): Promise<void> {
    const currentCount = this.agents.size;
    
    if (targetCount > currentCount) {
      // Scale up
      const agentsToSpawn = targetCount - currentCount;
      console.log(`[PrincessCoordinator:${this.domain}] Scaling up by ${agentsToSpawn} agents`);
      
      for (let i = 0; i < agentsToSpawn; i++) {
        const agentType = this.selectAgentTypeForDomain();
        const capabilities = this.getDefaultCapabilities(agentType);
        await this.spawnAgent(agentType, capabilities);
      }
      
    } else if (targetCount < currentCount) {
      // Scale down
      const agentsToTerminate = currentCount - targetCount;
      console.log(`[PrincessCoordinator:${this.domain}] Scaling down by ${agentsToTerminate} agents`);
      
      const idleAgents = Array.from(this.agents.entries())
        .filter(([_, agent]) => agent.status === AgentStatus.IDLE)
        .slice(0, agentsToTerminate);
      
      for (const [agentId] of idleAgents) {
        await this.terminateAgent(agentId);
      }
    }
  }

  /**
   * Shutdown coordinator
   */
  async shutdown(): Promise<void> {
    console.log(`[PrincessCoordinator:${this.domain}] Shutting down...`);
    
    // Clear monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Terminate all agents
    const agentIds = Array.from(this.agents.keys());
    for (const agentId of agentIds) {
      await this.terminateAgent(agentId);
    }
    
    // Clear data
    this.activeTasks.clear();
    this.taskQueue.length = 0;
    this.resourceAllocations.clear();
    
    this.isActive = false;
    
    console.log(`[PrincessCoordinator:${this.domain}] Shutdown complete`);
  }

  // ===== Private Methods =====

  private initializeMetrics(): CoordinationMetrics {
    return {
      totalAgents: 0,
      activeAgents: 0,
      idleAgents: 0,
      tasksInProgress: 0,
      tasksCompleted: 0,
      averageTaskTime: 0,
      resourceUtilization: 0,
      agentEfficiency: 0
    };
  }

  private initializeAgentPerformance(): AgentPerformance {
    return {
      tasksCompleted: 0,
      tasksSucceeded: 0,
      averageTaskTime: 0,
      successRate: 0,
      errorCount: 0,
      lastUpdate: Date.now()
    };
  }

  private setupPrincessHandlers(): void {
    this.princess.on('task:completed', (result) => {
      this.handleTaskCompletion(result);
    });
    
    this.princess.on('task:failed', (error) => {
      this.handleTaskFailure(error);
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.updateMetrics();
    }, 30000); // 30 second monitoring interval
  }

  private async spawnInitialAgents(): Promise<void> {
    const initialAgentCount = Math.min(3, this.maxConcurrentAgents); // Start with 3 agents
    
    for (let i = 0; i < initialAgentCount; i++) {
      const agentType = this.selectAgentTypeForDomain();
      const capabilities = this.getDefaultCapabilities(agentType);
      await this.spawnAgent(agentType, capabilities);
    }
  }

  private async selectOptimalAgent(task: Task): Promise<string | null> {
    const availableAgents = Array.from(this.agents.entries())
      .filter(([_, agent]) => agent.status === AgentStatus.IDLE)
      .map(([id]) => id);
    
    if (availableAgents.length === 0) {
      return null;
    }
    
    // Select agent based on capabilities match
    if (task.metadata?.requiredCapabilities) {
      for (const agentId of availableAgents) {
        const agent = this.agents.get(agentId)!;
        const hasCapabilities = task.metadata.requiredCapabilities.every(cap => 
          agent.capabilities.some(agentCap => agentCap.includes(cap))
        );
        
        if (hasCapabilities) {
          return agentId;
        }
      }
    }
    
    // Fallback to round-robin or best performing agent
    return availableAgents.reduce((best, current) => {
      const bestAgent = this.agents.get(best)!;
      const currentAgent = this.agents.get(current)!;
      
      return currentAgent.performance.successRate > bestAgent.performance.successRate 
        ? current : best;
    });
  }

  private async assignTaskToAgent(task: Task, agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    (agent as any).status = AgentStatus.BUSY;
    (agent as any).currentTask = task.id;
    (agent as any).lastActivity = Date.now();
    
    this.activeTasks.set(task.id, task);
  }

  private async executeTaskWithAgent(task: Task, agentId: string): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Execute via Princess
      const result = await this.princess.executeTask(task);
      
      const duration = Date.now() - startTime;
      
      // Update agent performance
      this.updateAgentPerformance(agentId, true, duration);
      
      // Free up agent
      this.freeAgent(agentId);
      
      return {
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        result,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update agent performance
      this.updateAgentPerformance(agentId, false, duration);
      
      // Free up agent
      this.freeAgent(agentId);
      
      throw error;
    }
  }

  private freeAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      (agent as any).status = AgentStatus.IDLE;
      (agent as any).currentTask = undefined;
      (agent as any).lastActivity = Date.now();
    }
    
    // Remove from active tasks
    if (agent?.currentTask) {
      this.activeTasks.delete(agent.currentTask);
    }
  }

  private updateAgentPerformance(
    agentId: string, 
    success: boolean, 
    duration: number
  ): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    const perf = agent.performance;
    perf.tasksCompleted++;
    
    if (success) {
      perf.tasksSucceeded++;
    } else {
      perf.errorCount++;
    }
    
    // Update average task time
    perf.averageTaskTime = 
      (perf.averageTaskTime * (perf.tasksCompleted - 1) + duration) / perf.tasksCompleted;
    
    // Update success rate
    perf.successRate = perf.tasksSucceeded / perf.tasksCompleted;
    
    perf.lastUpdate = Date.now();
  }

  private async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      const agentId = await this.selectOptimalAgent(task);
      
      if (!agentId) {
        break; // No available agents
      }
      
      this.taskQueue.shift();
      setImmediate(() => this.coordinateTask(task));
    }
  }

  private updateTaskMetrics(result: TaskResult): void {
    this.metrics.tasksCompleted++;
    
    if (result.duration) {
      const total = this.metrics.tasksCompleted;
      this.metrics.averageTaskTime = 
        (this.metrics.averageTaskTime * (total - 1) + result.duration) / total;
    }
  }

  private performHealthChecks(): void {
    const now = Date.now();
    const healthTimeout = 300000; // 5 minutes
    
    for (const [agentId, agent] of this.agents) {
      if (agent.status === AgentStatus.BUSY && 
          (now - agent.lastActivity) > healthTimeout) {
        console.warn(`[PrincessCoordinator:${this.domain}] Agent ${agentId} appears stuck`);
        (agent as any).status = AgentStatus.DEGRADED;
        
        this.emit('agent:health_issue', { agentId, agent });
      }
    }
  }

  private updateMetrics(): void {
    this.metrics.totalAgents = this.agents.size;
    this.metrics.activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AgentStatus.BUSY).length;
    this.metrics.idleAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AgentStatus.IDLE).length;
    this.metrics.tasksInProgress = this.activeTasks.size;
    
    // Calculate resource utilization
    const utilization = this.getResourceUtilization();
    this.metrics.resourceUtilization = 
      (utilization.utilization.memory + utilization.utilization.cpu) / 2;
    
    // Calculate agent efficiency
    const agentPerformances = Array.from(this.agents.values())
      .map(agent => agent.performance.successRate);
    this.metrics.agentEfficiency = agentPerformances.length > 0 
      ? agentPerformances.reduce((sum, rate) => sum + rate, 0) / agentPerformances.length
      : 0;
  }

  private async allocateResources(agentId: string): Promise<void> {
    const allocation: ResourceAllocation = {
      agentId,
      memoryMB: 512, // Default allocation
      cpuCores: 1,
      networkBandwidth: 100, // Mbps
      priority: 5,
      allocated: true
    };
    
    this.resourceAllocations.set(agentId, allocation);
  }

  private deallocateResources(agentId: string): void {
    this.resourceAllocations.delete(agentId);
  }

  private async cancelAgentTask(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent?.currentTask) {
      this.activeTasks.delete(agent.currentTask);
      this.freeAgent(agentId);
    }
  }

  private selectAgentTypeForDomain(): string {
    const domainAgentMap: Record<string, string[]> = {
      'Development': ['sparc-coder', 'backend-dev', 'frontend-developer'],
      'Architecture': ['system-architect', 'architecture'],
      'Quality': ['reviewer', 'tester', 'code-analyzer'],
      'Performance': ['perf-analyzer', 'performance-benchmarker'],
      'Infrastructure': ['cicd-engineer', 'repo-architect'],
      'Security': ['security-manager']
    };
    
    const agentTypes = domainAgentMap[this.domain] || ['coder'];
    return agentTypes[Math.floor(Math.random() * agentTypes.length)];
  }

  private getDefaultCapabilities(agentType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'sparc-coder': ['clean-code', 'TDD', 'refactoring'],
      'backend-dev': ['API-development', 'database-design'],
      'frontend-developer': ['UI-implementation', 'responsive-design'],
      'system-architect': ['system-design', 'scalability'],
      'reviewer': ['code-review', 'quality-gates'],
      'tester': ['testing', 'validation'],
      'perf-analyzer': ['performance-optimization', 'profiling'],
      'security-manager': ['security-analysis', 'vulnerability-assessment'],
      'cicd-engineer': ['deployment', 'automation']
    };
    
    return capabilityMap[agentType] || ['general'];
  }

  private generateAgentId(agentType: string): string {
    return `${this.domain.toLowerCase()}-${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private handleTaskCompletion(result: any): void {
    console.log(`[PrincessCoordinator:${this.domain}] Task completed: ${result.taskId}`);
    this.emit('task:completed', result);
  }

  private handleTaskFailure(error: any): void {
    console.log(`[PrincessCoordinator:${this.domain}] Task failed: ${error.taskId}`);
    this.emit('task:failed', error);
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:30:00-04:00 | queen@claude-sonnet-4 | Create Princess coordinator with agent management | PrincessCoordinator.ts | OK | -- | 0.00 | a9c3f7b |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-007
 * - inputs: ["HierarchicalTopology.ts", "PrincessBase.ts"]
 * - tools_used: ["TodoWrite", "MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
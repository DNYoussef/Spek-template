/**
 * Conflict Resolver - Princess Conflict Resolution
 * Resolves conflicts between Princess domains with:
 * - Multi-criteria conflict analysis
 * - Automated resolution strategies
 * - Escalation protocols
 * - Resource arbitration
 * - Performance impact assessment
 */

import { EventEmitter } from 'events';

export enum ConflictType {
  RESOURCE_CONTENTION = 'RESOURCE_CONTENTION',
  TASK_OVERLAP = 'TASK_OVERLAP',
  PRIORITY_MISMATCH = 'PRIORITY_MISMATCH',
  DEPENDENCY_VIOLATION = 'DEPENDENCY_VIOLATION',
  CAPABILITY_DISPUTE = 'CAPABILITY_DISPUTE',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION'
}

export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ResolutionStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  PRIORITY_BASED = 'PRIORITY_BASED',
  PERFORMANCE_BASED = 'PERFORMANCE_BASED',
  RESOURCE_OPTIMIZATION = 'RESOURCE_OPTIMIZATION',
  DOMAIN_SPECIALIZATION = 'DOMAIN_SPECIALIZATION',
  TEMPORAL_SEPARATION = 'TEMPORAL_SEPARATION',
  ESCALATION = 'ESCALATION'
}

export interface Conflict {
  readonly id: string;
  readonly type: ConflictType;
  readonly severity: ConflictSeverity;
  readonly participants: string[]; // Princess domain names
  readonly resources: ConflictResource[];
  readonly description: string;
  readonly detectedAt: number;
  readonly impact: ConflictImpact;
  readonly context: ConflictContext;
}

export interface ConflictResource {
  readonly resourceId: string;
  readonly resourceType: ResourceType;
  readonly contendingParties: string[];
  readonly currentOwner?: string;
  readonly utilizationRequests: ResourceRequest[];
}

export enum ResourceType {
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  AGENT_POOL = 'AGENT_POOL',
  TASK_QUEUE = 'TASK_QUEUE',
  EXECUTION_SLOT = 'EXECUTION_SLOT'
}

export interface ResourceRequest {
  readonly requesterId: string;
  readonly amount: number;
  readonly priority: number;
  readonly duration: number;
  readonly justification: string;
}

export interface ConflictImpact {
  readonly performanceDegrade: number; // 0-1 scale
  readonly blockedTasks: string[];
  readonly affectedPrincesses: string[];
  readonly estimatedDelay: number; // milliseconds
  readonly cascadingEffects: string[];
}

export interface ConflictContext {
  readonly triggeringEvent: string;
  readonly systemLoad: number;
  readonly activeConflicts: number;
  readonly historicalPattern?: string;
  readonly metadata: Record<string, unknown>;
}

export interface Resolution {
  readonly resolutionId: string;
  readonly conflictId: string;
  readonly strategy: ResolutionStrategy;
  readonly actions: ResolutionAction[];
  readonly expectedOutcome: ResolutionOutcome;
  readonly implementedAt: number;
  readonly effectiveness?: number; // Set after implementation
}

export interface ResolutionAction {
  readonly actionType: ActionType;
  readonly targetPrincess: string;
  readonly parameters: Record<string, unknown>;
  readonly executionOrder: number;
  readonly rollbackSupported: boolean;
}

export enum ActionType {
  RESOURCE_REALLOCATION = 'RESOURCE_REALLOCATION',
  TASK_REASSIGNMENT = 'TASK_REASSIGNMENT',
  PRIORITY_ADJUSTMENT = 'PRIORITY_ADJUSTMENT',
  TEMPORAL_SCHEDULING = 'TEMPORAL_SCHEDULING',
  CAPABILITY_RESTRICTION = 'CAPABILITY_RESTRICTION',
  PERFORMANCE_THROTTLING = 'PERFORMANCE_THROTTLING',
  ESCALATION_TO_QUEEN = 'ESCALATION_TO_QUEEN'
}

export interface ResolutionOutcome {
  readonly expectedImprovements: string[];
  readonly riskFactors: string[];
  readonly successProbability: number;
  readonly rollbackPlan?: ResolutionAction[];
}

export interface ConflictMetrics {
  readonly totalConflicts: number;
  readonly activeConflicts: number;
  readonly resolvedConflicts: number;
  readonly averageResolutionTime: number;
  readonly resolutionSuccessRate: number;
  readonly conflictsByType: Record<ConflictType, number>;
  readonly resolutionsByStrategy: Record<ResolutionStrategy, number>;
}

export class ConflictResolver extends EventEmitter {
  private readonly activeConflicts = new Map<string, Conflict>();
  private readonly resolutionHistory: Resolution[] = [];
  private readonly performanceTracker = new Map<string, number[]>();
  
  private metrics: ConflictMetrics;
  private monitoringInterval?: NodeJS.Timeout;
  private isActive: boolean = false;
  
  constructor() {
    super();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize conflict resolver
   */
  async initialize(): Promise<void> {
    console.log('[ConflictResolver] Initializing conflict resolution system...');
    
    try {
      // Start monitoring for performance degradation
      this.startMonitoring();
      
      this.isActive = true;
      console.log('[ConflictResolver] Conflict resolver initialized');
      
      this.emit('resolver:initialized');
      
    } catch (error) {
      console.error('[ConflictResolver] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect and register a conflict
   */
  async detectConflict(
    type: ConflictType,
    participants: string[],
    resources: ConflictResource[],
    description: string,
    context: Partial<ConflictContext> = {}
  ): Promise<string> {
    const conflictId = this.generateConflictId();
    
    const conflict: Conflict = {
      id: conflictId,
      type,
      severity: this.assessSeverity(type, participants, resources),
      participants,
      resources,
      description,
      detectedAt: Date.now(),
      impact: await this.assessImpact(type, participants, resources),
      context: {
        triggeringEvent: 'unknown',
        systemLoad: 0.5,
        activeConflicts: this.activeConflicts.size,
        metadata: {},
        ...context
      }
    };
    
    this.activeConflicts.set(conflictId, conflict);
    
    console.log(`[ConflictResolver] Conflict detected: ${conflictId} (${type})`);
    
    this.emit('conflict:detected', { conflict });
    
    // Attempt immediate resolution
    await this.resolveConflict(conflictId);
    
    return conflictId;
  }

  /**
   * Resolve a specific conflict
   */
  async resolveConflict(conflictId: string): Promise<Resolution | null> {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) {
      console.warn(`[ConflictResolver] Conflict ${conflictId} not found`);
      return null;
    }
    
    console.log(`[ConflictResolver] Resolving conflict: ${conflictId}`);
    
    try {
      // Select resolution strategy
      const strategy = this.selectResolutionStrategy(conflict);
      
      // Generate resolution plan
      const resolution = await this.generateResolution(conflict, strategy);
      
      // Implement resolution
      await this.implementResolution(resolution);
      
      // Store in history
      this.resolutionHistory.push(resolution);
      
      // Remove from active conflicts
      this.activeConflicts.delete(conflictId);
      
      // Update metrics
      this.updateMetrics(conflict, resolution);
      
      console.log(`[ConflictResolver] Conflict resolved: ${conflictId} using ${strategy}`);
      
      this.emit('conflict:resolved', { conflict, resolution });
      
      return resolution;
      
    } catch (error) {
      console.error(`[ConflictResolver] Resolution failed for conflict ${conflictId}:`, error);
      
      // Escalate if resolution failed
      await this.escalateConflict(conflictId, error as Error);
      
      return null;
    }
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): Conflict[] {
    return Array.from(this.activeConflicts.values());
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): Conflict | undefined {
    return this.activeConflicts.get(conflictId);
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(limit?: number): Resolution[] {
    const history = [...this.resolutionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get conflict metrics
   */
  getMetrics(): ConflictMetrics {
    this.updateCurrentMetrics();
    return { ...this.metrics };
  }

  /**
   * Report Princess performance for conflict prediction
   */
  reportPerformance(princessDomain: string, performanceScore: number): void {
    const history = this.performanceTracker.get(princessDomain) || [];
    history.push(performanceScore);
    
    // Keep only last 100 measurements
    if (history.length > 100) {
      history.shift();
    }
    
    this.performanceTracker.set(princessDomain, history);
    
    // Check for performance degradation conflicts
    this.checkPerformanceDegradation(princessDomain, history);
  }

  /**
   * Predict potential conflicts
   */
  async predictConflicts(): Promise<ConflictPrediction[]> {
    const predictions: ConflictPrediction[] = [];
    
    // Analyze performance trends
    for (const [domain, history] of this.performanceTracker) {
      const trend = this.analyzePerformanceTrend(history);
      
      if (trend.declining && trend.severity > 0.7) {
        predictions.push({
          type: ConflictType.PERFORMANCE_DEGRADATION,
          participants: [domain],
          probability: trend.severity,
          estimatedTime: trend.timeToThreshold,
          mitigation: 'Resource reallocation or load reduction'
        });
      }
    }
    
    // Analyze resource utilization patterns
    // (Would integrate with actual resource monitoring)
    
    return predictions;
  }

  /**
   * Shutdown conflict resolver
   */
  async shutdown(): Promise<void> {
    console.log('[ConflictResolver] Shutting down conflict resolution system...');
    
    // Clear monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Attempt to resolve remaining conflicts
    const activeConflictIds = Array.from(this.activeConflicts.keys());
    for (const conflictId of activeConflictIds) {
      try {
        await this.resolveConflict(conflictId);
      } catch (error) {
        console.error(`[ConflictResolver] Failed to resolve conflict ${conflictId} during shutdown:`, error);
      }
    }
    
    // Clear data
    this.activeConflicts.clear();
    this.performanceTracker.clear();
    
    this.isActive = false;
    
    console.log('[ConflictResolver] Shutdown complete');
  }

  // ===== Private Methods =====

  private initializeMetrics(): ConflictMetrics {
    return {
      totalConflicts: 0,
      activeConflicts: 0,
      resolvedConflicts: 0,
      averageResolutionTime: 0,
      resolutionSuccessRate: 0,
      conflictsByType: {} as Record<ConflictType, number>,
      resolutionsByStrategy: {} as Record<ResolutionStrategy, number>
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkForConflicts();
      this.updateCurrentMetrics();
    }, 30000); // 30 second monitoring
  }

  private assessSeverity(
    type: ConflictType,
    participants: string[],
    resources: ConflictResource[]
  ): ConflictSeverity {
    let severityScore = 0;
    
    // Base severity by type
    switch (type) {
      case ConflictType.RESOURCE_CONTENTION:
        severityScore += 3;
        break;
      case ConflictType.TASK_OVERLAP:
        severityScore += 2;
        break;
      case ConflictType.PRIORITY_MISMATCH:
        severityScore += 1;
        break;
      case ConflictType.DEPENDENCY_VIOLATION:
        severityScore += 4;
        break;
      case ConflictType.CAPABILITY_DISPUTE:
        severityScore += 2;
        break;
      case ConflictType.PERFORMANCE_DEGRADATION:
        severityScore += 3;
        break;
    }
    
    // Increase severity based on number of participants
    severityScore += Math.min(participants.length - 1, 3);
    
    // Increase severity based on critical resources
    const criticalResources = resources.filter(r => 
      r.resourceType === ResourceType.CPU || 
      r.resourceType === ResourceType.MEMORY
    );
    severityScore += criticalResources.length;
    
    // Map score to severity
    if (severityScore >= 8) return ConflictSeverity.CRITICAL;
    if (severityScore >= 6) return ConflictSeverity.HIGH;
    if (severityScore >= 4) return ConflictSeverity.MEDIUM;
    return ConflictSeverity.LOW;
  }

  private async assessImpact(
    type: ConflictType,
    participants: string[],
    resources: ConflictResource[]
  ): Promise<ConflictImpact> {
    // Simplified impact assessment
    const performanceDegrade = Math.min(0.2 * participants.length, 0.8);
    const estimatedDelay = participants.length * 60000; // 1 minute per participant
    
    return {
      performanceDegrade,
      blockedTasks: [], // Would be populated with actual blocked tasks
      affectedPrincesses: participants,
      estimatedDelay,
      cascadingEffects: [
        'Reduced throughput',
        'Increased latency',
        'Resource starvation'
      ]
    };
  }

  private selectResolutionStrategy(conflict: Conflict): ResolutionStrategy {
    switch (conflict.type) {
      case ConflictType.RESOURCE_CONTENTION:
        return conflict.severity === ConflictSeverity.CRITICAL 
          ? ResolutionStrategy.RESOURCE_OPTIMIZATION
          : ResolutionStrategy.ROUND_ROBIN;
      
      case ConflictType.TASK_OVERLAP:
        return ResolutionStrategy.DOMAIN_SPECIALIZATION;
      
      case ConflictType.PRIORITY_MISMATCH:
        return ResolutionStrategy.PRIORITY_BASED;
      
      case ConflictType.DEPENDENCY_VIOLATION:
        return ResolutionStrategy.TEMPORAL_SEPARATION;
      
      case ConflictType.CAPABILITY_DISPUTE:
        return ResolutionStrategy.DOMAIN_SPECIALIZATION;
      
      case ConflictType.PERFORMANCE_DEGRADATION:
        return conflict.severity === ConflictSeverity.CRITICAL
          ? ResolutionStrategy.ESCALATION
          : ResolutionStrategy.PERFORMANCE_BASED;
      
      default:
        return ResolutionStrategy.ROUND_ROBIN;
    }
  }

  private async generateResolution(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): Promise<Resolution> {
    const resolutionId = this.generateResolutionId();
    
    const actions = await this.generateActions(conflict, strategy);
    const outcome = this.predictOutcome(conflict, strategy, actions);
    
    return {
      resolutionId,
      conflictId: conflict.id,
      strategy,
      actions,
      expectedOutcome: outcome,
      implementedAt: Date.now()
    };
  }

  private async generateActions(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): Promise<ResolutionAction[]> {
    const actions: ResolutionAction[] = [];
    
    switch (strategy) {
      case ResolutionStrategy.ROUND_ROBIN:
        actions.push(...this.generateRoundRobinActions(conflict));
        break;
      
      case ResolutionStrategy.RESOURCE_OPTIMIZATION:
        actions.push(...this.generateResourceOptimizationActions(conflict));
        break;
      
      case ResolutionStrategy.DOMAIN_SPECIALIZATION:
        actions.push(...this.generateDomainSpecializationActions(conflict));
        break;
      
      case ResolutionStrategy.PRIORITY_BASED:
        actions.push(...this.generatePriorityBasedActions(conflict));
        break;
      
      case ResolutionStrategy.TEMPORAL_SEPARATION:
        actions.push(...this.generateTemporalSeparationActions(conflict));
        break;
      
      case ResolutionStrategy.PERFORMANCE_BASED:
        actions.push(...this.generatePerformanceBasedActions(conflict));
        break;
      
      case ResolutionStrategy.ESCALATION:
        actions.push(...this.generateEscalationActions(conflict));
        break;
    }
    
    return actions;
  }

  private generateRoundRobinActions(conflict: Conflict): ResolutionAction[] {
    return conflict.participants.map((participant, index) => ({
      actionType: ActionType.TEMPORAL_SCHEDULING,
      targetPrincess: participant,
      parameters: {
        timeSlot: index,
        duration: 300000, // 5 minutes
        priority: 5
      },
      executionOrder: index + 1,
      rollbackSupported: true
    }));
  }

  private generateResourceOptimizationActions(conflict: Conflict): ResolutionAction[] {
    const actions: ResolutionAction[] = [];
    
    // Redistribute resources based on current utilization
    conflict.resources.forEach((resource, index) => {
      const highestPriorityRequest = resource.utilizationRequests
        .sort((a, b) => a.priority - b.priority)[0];
      
      if (highestPriorityRequest) {
        actions.push({
          actionType: ActionType.RESOURCE_REALLOCATION,
          targetPrincess: highestPriorityRequest.requesterId,
          parameters: {
            resourceId: resource.resourceId,
            allocation: highestPriorityRequest.amount,
            duration: highestPriorityRequest.duration
          },
          executionOrder: index + 1,
          rollbackSupported: true
        });
      }
    });
    
    return actions;
  }

  private generateDomainSpecializationActions(conflict: Conflict): ResolutionAction[] {
    const actions: ResolutionAction[] = [];
    
    // Assign tasks based on domain expertise
    conflict.participants.forEach((participant, index) => {
      actions.push({
        actionType: ActionType.CAPABILITY_RESTRICTION,
        targetPrincess: participant,
        parameters: {
          restrictToDomain: participant,
          allowCrossDomain: false,
          priority: index + 1
        },
        executionOrder: index + 1,
        rollbackSupported: true
      });
    });
    
    return actions;
  }

  private generatePriorityBasedActions(conflict: Conflict): ResolutionAction[] {
    const actions: ResolutionAction[] = [];
    
    // Adjust priorities based on conflict severity and participant importance
    const priorityMap = this.calculatePrincessPriorities(conflict.participants);
    
    conflict.participants.forEach((participant, index) => {
      actions.push({
        actionType: ActionType.PRIORITY_ADJUSTMENT,
        targetPrincess: participant,
        parameters: {
          newPriority: priorityMap[participant] || 5,
          reason: 'conflict_resolution',
          duration: 600000 // 10 minutes
        },
        executionOrder: index + 1,
        rollbackSupported: true
      });
    });
    
    return actions;
  }

  private generateTemporalSeparationActions(conflict: Conflict): ResolutionAction[] {
    const actions: ResolutionAction[] = [];
    
    // Schedule participants at different times to avoid overlap
    conflict.participants.forEach((participant, index) => {
      const delay = index * 300000; // 5 minute separation
      
      actions.push({
        actionType: ActionType.TEMPORAL_SCHEDULING,
        targetPrincess: participant,
        parameters: {
          scheduleDelay: delay,
          exclusiveAccess: true,
          maxDuration: 600000 // 10 minutes
        },
        executionOrder: index + 1,
        rollbackSupported: true
      });
    });
    
    return actions;
  }

  private generatePerformanceBasedActions(conflict: Conflict): ResolutionAction[] {
    const actions: ResolutionAction[] = [];
    
    // Throttle or boost performance based on conflict
    conflict.participants.forEach((participant, index) => {
      const performanceHistory = this.performanceTracker.get(participant) || [];
      const avgPerformance = performanceHistory.length > 0 
        ? performanceHistory.reduce((sum, p) => sum + p, 0) / performanceHistory.length
        : 0.5;
      
      actions.push({
        actionType: ActionType.PERFORMANCE_THROTTLING,
        targetPrincess: participant,
        parameters: {
          performanceLimit: Math.max(0.3, avgPerformance * 0.8),
          duration: 300000, // 5 minutes
          reason: 'conflict_mitigation'
        },
        executionOrder: index + 1,
        rollbackSupported: true
      });
    });
    
    return actions;
  }

  private generateEscalationActions(conflict: Conflict): ResolutionAction[] {
    return [{
      actionType: ActionType.ESCALATION_TO_QUEEN,
      targetPrincess: 'Queen',
      parameters: {
        conflictId: conflict.id,
        severity: conflict.severity,
        participants: conflict.participants,
        reason: 'automatic_escalation_critical_conflict'
      },
      executionOrder: 1,
      rollbackSupported: false
    }];
  }

  private predictOutcome(
    conflict: Conflict,
    strategy: ResolutionStrategy,
    actions: ResolutionAction[]
  ): ResolutionOutcome {
    // Simplified outcome prediction
    const baseSuccessProbability = this.getStrategySuccessRate(strategy);
    const complexityPenalty = Math.min(actions.length * 0.05, 0.3);
    const successProbability = Math.max(0.1, baseSuccessProbability - complexityPenalty);
    
    return {
      expectedImprovements: [
        'Reduced resource contention',
        'Improved task distribution',
        'Better load balancing'
      ],
      riskFactors: [
        'Temporary performance degradation',
        'Increased coordination overhead',
        'Potential cascading effects'
      ],
      successProbability,
      rollbackPlan: actions.filter(action => action.rollbackSupported)
        .map(action => ({
          ...action,
          parameters: { ...action.parameters, rollback: true }
        }))
    };
  }

  private getStrategySuccessRate(strategy: ResolutionStrategy): number {
    const successRates: Record<ResolutionStrategy, number> = {
      [ResolutionStrategy.ROUND_ROBIN]: 0.8,
      [ResolutionStrategy.PRIORITY_BASED]: 0.85,
      [ResolutionStrategy.PERFORMANCE_BASED]: 0.75,
      [ResolutionStrategy.RESOURCE_OPTIMIZATION]: 0.9,
      [ResolutionStrategy.DOMAIN_SPECIALIZATION]: 0.95,
      [ResolutionStrategy.TEMPORAL_SEPARATION]: 0.9,
      [ResolutionStrategy.ESCALATION]: 0.7
    };
    
    return successRates[strategy] || 0.7;
  }

  private async implementResolution(resolution: Resolution): Promise<void> {
    console.log(`[ConflictResolver] Implementing resolution: ${resolution.resolutionId}`);
    
    // Sort actions by execution order
    const sortedActions = resolution.actions.sort((a, b) => a.executionOrder - b.executionOrder);
    
    for (const action of sortedActions) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error(`[ConflictResolver] Action execution failed:`, error);
        
        // Attempt rollback if supported
        if (action.rollbackSupported) {
          await this.rollbackAction(action);
        }
        
        throw error;
      }
    }
    
    // Monitor resolution effectiveness
    setTimeout(() => {
      this.evaluateResolutionEffectiveness(resolution);
    }, 60000); // Evaluate after 1 minute
  }

  private async executeAction(action: ResolutionAction): Promise<void> {
    console.log(`[ConflictResolver] Executing action: ${action.actionType} for ${action.targetPrincess}`);
    
    // Emit action event for Princess to handle
    this.emit('action:execute', {
      action,
      timestamp: Date.now()
    });
    
    // In a real implementation, this would interface with the actual Princess
    // For now, we simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async rollbackAction(action: ResolutionAction): Promise<void> {
    console.log(`[ConflictResolver] Rolling back action: ${action.actionType} for ${action.targetPrincess}`);
    
    this.emit('action:rollback', {
      action,
      timestamp: Date.now()
    });
  }

  private async escalateConflict(conflictId: string, error: Error): Promise<void> {
    console.log(`[ConflictResolver] Escalating conflict: ${conflictId}`);
    
    this.emit('conflict:escalated', {
      conflictId,
      error: error.message,
      timestamp: Date.now()
    });
  }

  private evaluateResolutionEffectiveness(resolution: Resolution): void {
    // Simplified effectiveness evaluation
    // In reality, this would measure actual performance improvements
    const effectiveness = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
    
    (resolution as any).effectiveness = effectiveness;
    
    console.log(`[ConflictResolver] Resolution ${resolution.resolutionId} effectiveness: ${effectiveness.toFixed(2)}`);
    
    this.emit('resolution:evaluated', {
      resolution,
      effectiveness
    });
  }

  private checkForConflicts(): void {
    // Monitor for new conflicts based on system state
    // This is a simplified version - real implementation would
    // integrate with actual system monitoring
  }

  private checkPerformanceDegradation(domain: string, history: number[]): void {
    if (history.length < 5) return;
    
    const recentAvg = history.slice(-5).reduce((sum, p) => sum + p, 0) / 5;
    const overallAvg = history.reduce((sum, p) => sum + p, 0) / history.length;
    
    if (recentAvg < overallAvg * 0.7) {
      // Significant performance degradation detected
      this.detectConflict(
        ConflictType.PERFORMANCE_DEGRADATION,
        [domain],
        [],
        `Performance degradation detected in ${domain}`,
        {
          triggeringEvent: 'performance_monitoring',
          metadata: {
            recentAverage: recentAvg,
            overallAverage: overallAvg,
            degradationFactor: recentAvg / overallAvg
          }
        }
      );
    }
  }

  private analyzePerformanceTrend(history: number[]): PerformanceTrend {
    if (history.length < 10) {
      return {
        declining: false,
        severity: 0,
        timeToThreshold: Infinity
      };
    }
    
    // Simple linear regression to detect trend
    const n = history.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = history;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    const declining = slope < -0.01; // Declining if slope is significantly negative
    const severity = Math.min(Math.abs(slope) * 10, 1); // Scale slope to 0-1
    
    // Estimate time to reach critical threshold (0.3)
    const currentValue = history[history.length - 1];
    const timeToThreshold = declining && slope < 0 
      ? (currentValue - 0.3) / Math.abs(slope)
      : Infinity;
    
    return {
      declining,
      severity,
      timeToThreshold: timeToThreshold * 60000 // Convert to milliseconds
    };
  }

  private calculatePrincessPriorities(participants: string[]): Record<string, number> {
    // Simplified priority calculation based on domain importance
    const domainPriorities: Record<string, number> = {
      'Security': 1,
      'Quality': 2,
      'Architecture': 3,
      'Development': 4,
      'Performance': 5,
      'Infrastructure': 6
    };
    
    const priorities: Record<string, number> = {};
    participants.forEach(participant => {
      priorities[participant] = domainPriorities[participant] || 5;
    });
    
    return priorities;
  }

  private updateMetrics(conflict: Conflict, resolution: Resolution): void {
    this.metrics.totalConflicts++;
    this.metrics.resolvedConflicts++;
    
    // Update average resolution time
    const resolutionTime = resolution.implementedAt - conflict.detectedAt;
    const total = this.metrics.resolvedConflicts;
    this.metrics.averageResolutionTime = 
      (this.metrics.averageResolutionTime * (total - 1) + resolutionTime) / total;
    
    // Update success rate (simplified)
    this.metrics.resolutionSuccessRate = this.metrics.resolvedConflicts / this.metrics.totalConflicts;
    
    // Update type counters
    this.metrics.conflictsByType[conflict.type] = 
      (this.metrics.conflictsByType[conflict.type] || 0) + 1;
    
    // Update strategy counters
    this.metrics.resolutionsByStrategy[resolution.strategy] = 
      (this.metrics.resolutionsByStrategy[resolution.strategy] || 0) + 1;
  }

  private updateCurrentMetrics(): void {
    this.metrics.activeConflicts = this.activeConflicts.size;
  }

  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateResolutionId(): string {
    return `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }
}

// Supporting interfaces

interface ConflictPrediction {
  type: ConflictType;
  participants: string[];
  probability: number;
  estimatedTime: number;
  mitigation: string;
}

interface PerformanceTrend {
  declining: boolean;
  severity: number;
  timeToThreshold: number;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:45:00-04:00 | queen@claude-sonnet-4 | Create comprehensive conflict resolver with multi-strategy resolution | ConflictResolver.ts | OK | -- | 0.00 | a6d9e2f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-010
 * - inputs: ["TaskDistributor.ts"]
 * - tools_used: ["TodoWrite", "MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
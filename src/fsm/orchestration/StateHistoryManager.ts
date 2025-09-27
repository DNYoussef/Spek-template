/**
 * StateHistoryManager - State Transition History Management
 * Tracks and manages the history of state transitions for analysis and debugging
 */

import { TransitionRecord, FSMContext, SystemState, SystemEvent, FSMMetrics } from '../types/FSMTypes';

export interface HistoryQuery {
  fromState?: any;
  toState?: any;
  event?: any;
  timeRange?: {
    start: number;
    end: number;
  };
  limit?: number;
  includeContext?: boolean;
}

export interface PerformanceAnalysis {
  averageTransitionTime: number;
  slowestTransitions: TransitionRecord[];
  fastestTransitions: TransitionRecord[];
  errorRate: number;
  stateDistribution: Map<any, number>;
  eventFrequency: Map<any, number>;
  timeInStates: Map<any, number>;
  bottlenecks: Array<{
    state: any;
    averageDuration: number;
    count: number;
  }>;
}

export class StateHistoryManager {
  private initialized = false;
  private transitionHistory: TransitionRecord[] = [];
  private stateChangeHistory: Array<{
    from: any;
    to: any;
    timestamp: number;
    duration?: number;
  }> = [];
  private eventHistory: Array<{
    event: any;
    timestamp: number;
    state: any;
    duration: number;
    success: boolean;
    error?: string;
  }> = [];
  private maxHistorySize = 10000;
  private performanceMetrics: FSMMetrics;
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.performanceMetrics = {
      totalTransitions: 0,
      averageTransitionTime: 0,
      stateDistribution: new Map(),
      errorRate: 0,
      performanceByState: new Map(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Initialize the history manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing StateHistoryManager');
    
    this.transitionHistory = [];
    this.stateChangeHistory = [];
    this.eventHistory = [];
    
    this.resetMetrics();
    
    // Start periodic metrics calculation
    this.startMetricsSnapshot();
    
    this.initialized = true;
  }

  /**
   * Record a state transition
   */
  recordTransition(record: TransitionRecord): void {
    if (!this.initialized) {
      this.log('Warning: Recording transition before initialization');
    }

    // Add to transition history
    this.transitionHistory.push(record);
    
    // Maintain size limit
    if (this.transitionHistory.length > this.maxHistorySize) {
      this.transitionHistory = this.transitionHistory.slice(-this.maxHistorySize);
    }
    
    // Update metrics
    this.updateMetrics(record);
    
    this.log(`Transition recorded: ${record.from} -> ${record.to} (${record.duration}ms)`);
  }

  /**
   * Record a state change
   */
  recordStateChange(from: any, to: any, duration?: number): void {
    const record = {
      from,
      to,
      timestamp: Date.now(),
      duration
    };
    
    this.stateChangeHistory.push(record);
    
    // Maintain size limit
    if (this.stateChangeHistory.length > this.maxHistorySize) {
      this.stateChangeHistory = this.stateChangeHistory.slice(-this.maxHistorySize);
    }
    
    this.log(`State change recorded: ${from} -> ${to}`);
  }

  /**
   * Record an event
   */
  recordEvent(
    event: any,
    state: any,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const record = {
      event,
      timestamp: Date.now(),
      state,
      duration,
      success,
      error
    };
    
    this.eventHistory.push(record);
    
    // Maintain size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
    
    this.log(`Event recorded: ${event} in state ${state} (${duration}ms, success: ${success})`);
  }

  /**
   * Query transition history
   */
  queryTransitions(query: HistoryQuery): TransitionRecord[] {
    let results = [...this.transitionHistory];
    
    // Filter by from state
    if (query.fromState !== undefined) {
      results = results.filter(r => r.from === query.fromState);
    }
    
    // Filter by to state
    if (query.toState !== undefined) {
      results = results.filter(r => r.to === query.toState);
    }
    
    // Filter by event
    if (query.event !== undefined) {
      results = results.filter(r => r.event === query.event);
    }
    
    // Filter by time range
    if (query.timeRange) {
      results = results.filter(r => 
        r.timestamp >= query.timeRange!.start &&
        r.timestamp <= query.timeRange!.end
      );
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    // Remove context if not requested
    if (!query.includeContext) {
      results = results.map(r => ({ ...r, context: undefined }));
    }
    
    return results;
  }

  /**
   * Get transitions for a specific state
   */
  getTransitionsForState(state: any): {
    incoming: TransitionRecord[];
    outgoing: TransitionRecord[];
  } {
    const incoming = this.transitionHistory.filter(r => r.to === state);
    const outgoing = this.transitionHistory.filter(r => r.from === state);
    
    return { incoming, outgoing };
  }

  /**
   * Get transition path between states
   */
  getTransitionPath(fromState: any, toState: any): TransitionRecord[] {
    // Simple implementation - in practice, this would use graph algorithms
    const directTransitions = this.transitionHistory.filter(r => 
      r.from === fromState && r.to === toState
    );
    
    if (directTransitions.length > 0) {
      return [directTransitions[directTransitions.length - 1]];
    }
    
    // For now, return empty array if no direct path
    // In a full implementation, we'd find multi-hop paths
    return [];
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformance(): PerformanceAnalysis {
    const transitions = this.transitionHistory.filter(r => r.success);
    const totalTransitions = transitions.length;
    
    if (totalTransitions === 0) {
      return {
        averageTransitionTime: 0,
        slowestTransitions: [],
        fastestTransitions: [],
        errorRate: 0,
        stateDistribution: new Map(),
        eventFrequency: new Map(),
        timeInStates: new Map(),
        bottlenecks: []
      };
    }
    
    // Calculate average transition time
    const totalTime = transitions.reduce((sum, r) => sum + r.duration, 0);
    const averageTransitionTime = totalTime / totalTransitions;
    
    // Find slowest and fastest transitions
    const sortedByDuration = [...transitions].sort((a, b) => b.duration - a.duration);
    const slowestTransitions = sortedByDuration.slice(0, 5);
    const fastestTransitions = sortedByDuration.slice(-5).reverse();
    
    // Calculate error rate
    const totalWithErrors = this.transitionHistory.length;
    const errorsCount = this.transitionHistory.filter(r => !r.success).length;
    const errorRate = totalWithErrors > 0 ? errorsCount / totalWithErrors : 0;
    
    // State distribution
    const stateDistribution = new Map<any, number>();
    transitions.forEach(r => {
      stateDistribution.set(r.from, (stateDistribution.get(r.from) || 0) + 1);
      stateDistribution.set(r.to, (stateDistribution.get(r.to) || 0) + 1);
    });
    
    // Event frequency
    const eventFrequency = new Map<any, number>();
    transitions.forEach(r => {
      eventFrequency.set(r.event, (eventFrequency.get(r.event) || 0) + 1);
    });
    
    // Time spent in states (approximation)
    const timeInStates = new Map<any, number>();
    for (let i = 0; i < this.stateChangeHistory.length - 1; i++) {
      const current = this.stateChangeHistory[i];
      const next = this.stateChangeHistory[i + 1];
      const timeInState = next.timestamp - current.timestamp;
      
      timeInStates.set(current.to, (timeInStates.get(current.to) || 0) + timeInState);
    }
    
    // Identify bottlenecks (states with high average duration)
    const stateDurations = new Map<any, { total: number; count: number }>();
    transitions.forEach(r => {
      const current = stateDurations.get(r.from) || { total: 0, count: 0 };
      current.total += r.duration;
      current.count += 1;
      stateDurations.set(r.from, current);
    });
    
    const bottlenecks = Array.from(stateDurations.entries())
      .map(([state, stats]) => ({
        state,
        averageDuration: stats.total / stats.count,
        count: stats.count
      }))
      .filter(b => b.averageDuration > averageTransitionTime * 1.5)
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);
    
    return {
      averageTransitionTime,
      slowestTransitions,
      fastestTransitions,
      errorRate,
      stateDistribution,
      eventFrequency,
      timeInStates,
      bottlenecks
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): FSMMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get history statistics
   */
  getHistoryStats(): {
    totalTransitions: number;
    totalStateChanges: number;
    totalEvents: number;
    memoryUsage: {
      transitions: number;
      stateChanges: number;
      events: number;
      total: number;
    };
    timeRange: {
      oldest: number;
      newest: number;
      span: number;
    };
  } {
    const allTimestamps = [
      ...this.transitionHistory.map(r => r.timestamp),
      ...this.stateChangeHistory.map(r => r.timestamp),
      ...this.eventHistory.map(r => r.timestamp)
    ].filter(t => t > 0);
    
    const oldest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;
    const newest = allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0;
    
    return {
      totalTransitions: this.transitionHistory.length,
      totalStateChanges: this.stateChangeHistory.length,
      totalEvents: this.eventHistory.length,
      memoryUsage: {
        transitions: this.transitionHistory.length,
        stateChanges: this.stateChangeHistory.length,
        events: this.eventHistory.length,
        total: this.transitionHistory.length + this.stateChangeHistory.length + this.eventHistory.length
      },
      timeRange: {
        oldest,
        newest,
        span: newest - oldest
      }
    };
  }

  /**
   * Export history data
   */
  exportHistory(): {
    transitions: TransitionRecord[];
    stateChanges: any[];
    events: any[];
    metrics: FSMMetrics;
    exportTimestamp: number;
  } {
    return {
      transitions: [...this.transitionHistory],
      stateChanges: [...this.stateChangeHistory],
      events: [...this.eventHistory],
      metrics: { ...this.performanceMetrics },
      exportTimestamp: Date.now()
    };
  }

  /**
   * Import history data
   */
  importHistory(data: {
    transitions: TransitionRecord[];
    stateChanges: any[];
    events: any[];
    metrics?: FSMMetrics;
  }): void {
    this.transitionHistory = [...data.transitions];
    this.stateChangeHistory = [...data.stateChanges];
    this.eventHistory = [...data.events];
    
    if (data.metrics) {
      this.performanceMetrics = { ...data.metrics };
    }
    
    this.log('History data imported');
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.transitionHistory = [];
    this.stateChangeHistory = [];
    this.eventHistory = [];
    this.resetMetrics();
    
    this.log('History cleared');
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(record: TransitionRecord): void {
    this.performanceMetrics.totalTransitions++;
    
    // Update average transition time
    const currentAvg = this.performanceMetrics.averageTransitionTime;
    const count = this.performanceMetrics.totalTransitions;
    this.performanceMetrics.averageTransitionTime = 
      (currentAvg * (count - 1) + record.duration) / count;
    
    // Update state distribution
    const fromCount = this.performanceMetrics.stateDistribution.get(record.from) || 0;
    const toCount = this.performanceMetrics.stateDistribution.get(record.to) || 0;
    this.performanceMetrics.stateDistribution.set(record.from, fromCount + 1);
    this.performanceMetrics.stateDistribution.set(record.to, toCount + 1);
    
    // Update error rate
    const successfulTransitions = this.transitionHistory.filter(r => r.success).length;
    this.performanceMetrics.errorRate = 1 - (successfulTransitions / this.performanceMetrics.totalTransitions);
    
    // Update performance by state
    const statePerf = this.performanceMetrics.performanceByState.get(record.from) || {
      averageDuration: 0,
      successRate: 0,
      entryCount: 0
    };
    
    statePerf.entryCount++;
    statePerf.averageDuration = (statePerf.averageDuration * (statePerf.entryCount - 1) + record.duration) / statePerf.entryCount;
    
    const stateTransitions = this.transitionHistory.filter(r => r.from === record.from);
    const successfulStateTransitions = stateTransitions.filter(r => r.success).length;
    statePerf.successRate = successfulStateTransitions / stateTransitions.length;
    
    this.performanceMetrics.performanceByState.set(record.from, statePerf);
    
    this.performanceMetrics.lastUpdated = Date.now();
  }

  /**
   * Reset metrics
   */
  private resetMetrics(): void {
    this.performanceMetrics = {
      totalTransitions: 0,
      averageTransitionTime: 0,
      stateDistribution: new Map(),
      errorRate: 0,
      performanceByState: new Map(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Start periodic metrics snapshot
   */
  private startMetricsSnapshot(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    this.snapshotInterval = setInterval(() => {
      this.performanceMetrics.lastUpdated = Date.now();
    }, 60000); // Update every minute
  }

  /**
   * Shutdown the history manager
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down StateHistoryManager');
    
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
    
    // Optionally persist history to storage here
    
    this.initialized = false;
    this.log('StateHistoryManager shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[StateHistoryManager] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[StateHistoryManager] ERROR: ${message}`, error || '');
  }
}

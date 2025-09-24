/**
 * ProgressTracker - Extracted from StageProgressionValidator
 * Tracks and reports stage progression metrics
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface ProgressMetrics {
  stageId: string;
  stageName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'in_progress' | 'completed' | 'failed' | 'skipped';
  completionPercentage: number;
  estimatedTimeRemaining?: number;
  blockers: string[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  achievedDate?: Date;
  status: 'pending' | 'achieved' | 'missed';
  dependencies: string[];
}

export interface ProgressReport {
  timestamp: Date;
  overallProgress: number;
  stagesCompleted: number;
  stagesTotal: number;
  estimatedCompletion?: Date;
  velocity: number; // stages per hour
  blockers: BlockerInfo[];
  risks: RiskInfo[];
  milestones: Milestone[];
}

export interface BlockerInfo {
  id: string;
  stageId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  resolvedAt?: Date;
  impact: string;
}

export interface RiskInfo {
  id: string;
  description: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  mitigationPlan?: string;
  identifiedAt: Date;
}

export class ProgressTracker extends EventEmitter {
  /**
   * Tracks and reports stage progression metrics.
   *
   * Extracted from StageProgressionValidator (1,188 LOC -> ~200 LOC component).
   * Handles:
   * - Progress monitoring
   * - Milestone tracking
   * - Blocker management
   * - Risk assessment
   * - Velocity calculation
   */

  private progressMetrics: Map<string, ProgressMetrics>;
  private milestones: Map<string, Milestone>;
  private blockers: Map<string, BlockerInfo>;
  private risks: Map<string, RiskInfo>;
  private progressHistory: ProgressReport[];
  private startTime: Date;
  private velocityWindow: number = 3600000; // 1 hour

  constructor() {
    super();

    this.progressMetrics = new Map();
    this.milestones = new Map();
    this.blockers = new Map();
    this.risks = new Map();
    this.progressHistory = [];
    this.startTime = new Date();
  }

  startTracking(stageId: string, stageName: string): void {
    const metrics: ProgressMetrics = {
      stageId,
      stageName,
      startTime: new Date(),
      status: 'in_progress',
      completionPercentage: 0,
      blockers: [],
      milestones: []
    };

    this.progressMetrics.set(stageId, metrics);
    this.emit('trackingStarted', { stageId, stageName });
  }

  updateProgress(stageId: string, percentage: number, estimatedTimeRemaining?: number): void {
    const metrics = this.progressMetrics.get(stageId);
    if (!metrics) {
      throw new Error(`No tracking for stage ${stageId}`);
    }

    metrics.completionPercentage = Math.min(100, Math.max(0, percentage));
    metrics.estimatedTimeRemaining = estimatedTimeRemaining;

    this.emit('progressUpdated', {
      stageId,
      percentage: metrics.completionPercentage,
      estimatedTimeRemaining
    });

    // Check if completed
    if (metrics.completionPercentage >= 100 && metrics.status === 'in_progress') {
      this.completeStage(stageId);
    }
  }

  completeStage(stageId: string, status: 'completed' | 'failed' | 'skipped' = 'completed'): void {
    const metrics = this.progressMetrics.get(stageId);
    if (!metrics) {
      throw new Error(`No tracking for stage ${stageId}`);
    }

    metrics.endTime = new Date();
    metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    metrics.status = status;

    if (status === 'completed') {
      metrics.completionPercentage = 100;
    }

    this.emit('stageCompleted', {
      stageId,
      status,
      duration: metrics.duration
    });

    // Update milestones
    this.checkMilestones(stageId);
  }

  defineMilestone(milestone: Milestone): void {
    this.milestones.set(milestone.id, milestone);
    this.emit('milestoneDefined', milestone);
  }

  achieveMilestone(milestoneId: string): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    milestone.status = 'achieved';
    milestone.achievedDate = new Date();

    this.emit('milestoneAchieved', milestone);

    // Check dependent milestones
    this.checkDependentMilestones(milestoneId);
  }

  private checkMilestones(stageId: string): void {
    for (const milestone of this.milestones.values()) {
      if (milestone.dependencies.includes(stageId) && milestone.status === 'pending') {
        // Check if all dependencies are completed
        const allCompleted = milestone.dependencies.every(depId => {
          const metrics = this.progressMetrics.get(depId);
          return metrics && metrics.status === 'completed';
        });

        if (allCompleted) {
          this.achieveMilestone(milestone.id);
        }
      }
    }
  }

  private checkDependentMilestones(milestoneId: string): void {
    for (const milestone of this.milestones.values()) {
      if (milestone.dependencies.includes(milestoneId)) {
        const allAchieved = milestone.dependencies.every(depId => {
          const dep = this.milestones.get(depId);
          return dep && dep.status === 'achieved';
        });

        if (allAchieved && milestone.status === 'pending') {
          this.achieveMilestone(milestone.id);
        }
      }
    }
  }

  reportBlocker(blocker: Omit<BlockerInfo, 'id' | 'reportedAt'>): void {
    const blockerId = `blocker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullBlocker: BlockerInfo = {
      ...blocker,
      id: blockerId,
      reportedAt: new Date()
    };

    this.blockers.set(blockerId, fullBlocker);

    // Add to stage metrics
    const metrics = this.progressMetrics.get(blocker.stageId);
    if (metrics) {
      metrics.blockers.push(blockerId);
    }

    this.emit('blockerReported', fullBlocker);
  }

  resolveBlocker(blockerId: string): void {
    const blocker = this.blockers.get(blockerId);
    if (!blocker) {
      throw new Error(`Blocker ${blockerId} not found`);
    }

    blocker.resolvedAt = new Date();

    // Remove from stage metrics
    const metrics = this.progressMetrics.get(blocker.stageId);
    if (metrics) {
      metrics.blockers = metrics.blockers.filter(id => id !== blockerId);
    }

    this.emit('blockerResolved', blocker);
  }

  identifyRisk(risk: Omit<RiskInfo, 'id' | 'identifiedAt'>): void {
    const riskId = `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullRisk: RiskInfo = {
      ...risk,
      id: riskId,
      identifiedAt: new Date()
    };

    this.risks.set(riskId, fullRisk);
    this.emit('riskIdentified', fullRisk);
  }

  generateProgressReport(): ProgressReport {
    const allMetrics = Array.from(this.progressMetrics.values());
    const completed = allMetrics.filter(m => m.status === 'completed').length;
    const total = allMetrics.length;

    const overallProgress = total > 0 ? (completed / total) * 100 : 0;

    // Calculate velocity
    const velocity = this.calculateVelocity();

    // Estimate completion
    const estimatedCompletion = this.estimateCompletion(velocity, total - completed);

    // Get active blockers
    const activeBlockers = Array.from(this.blockers.values())
      .filter(b => !b.resolvedAt);

    const report: ProgressReport = {
      timestamp: new Date(),
      overallProgress,
      stagesCompleted: completed,
      stagesTotal: total,
      estimatedCompletion,
      velocity,
      blockers: activeBlockers,
      risks: Array.from(this.risks.values()),
      milestones: Array.from(this.milestones.values())
    };

    this.progressHistory.push(report);
    this.emit('reportGenerated', report);

    return report;
  }

  private calculateVelocity(): number {
    const now = Date.now();
    const windowStart = now - this.velocityWindow;

    const completedInWindow = Array.from(this.progressMetrics.values())
      .filter(m =>
        m.status === 'completed' &&
        m.endTime &&
        m.endTime.getTime() >= windowStart
      ).length;

    // Convert to stages per hour
    return (completedInWindow / this.velocityWindow) * 3600000;
  }

  private estimateCompletion(velocity: number, remainingStages: number): Date | undefined {
    if (velocity <= 0 || remainingStages <= 0) {
      return undefined;
    }

    const hoursRemaining = remainingStages / velocity;
    const estimatedTime = new Date();
    estimatedTime.setHours(estimatedTime.getHours() + hoursRemaining);

    return estimatedTime;
  }

  getStageMetrics(stageId: string): ProgressMetrics | undefined {
    return this.progressMetrics.get(stageId);
  }

  getAllMetrics(): ProgressMetrics[] {
    return Array.from(this.progressMetrics.values());
  }

  getActiveBlockers(): BlockerInfo[] {
    return Array.from(this.blockers.values()).filter(b => !b.resolvedAt);
  }

  getHighRisks(): RiskInfo[] {
    return Array.from(this.risks.values())
      .filter(r => r.impact === 'high' && r.probability > 0.5);
  }

  getProgressHistory(limit?: number): ProgressReport[] {
    if (limit) {
      return this.progressHistory.slice(-limit);
    }
    return [...this.progressHistory];
  }

  reset(): void {
    this.progressMetrics.clear();
    this.milestones.clear();
    this.blockers.clear();
    this.risks.clear();
    this.progressHistory = [];
    this.startTime = new Date();

    this.emit('trackerReset');
  }

  getTrackerMetrics(): any {
    return {
      totalStages: this.progressMetrics.size,
      completed: Array.from(this.progressMetrics.values())
        .filter(m => m.status === 'completed').length,
      inProgress: Array.from(this.progressMetrics.values())
        .filter(m => m.status === 'in_progress').length,
      milestones: this.milestones.size,
      activeBlockers: this.getActiveBlockers().length,
      risks: this.risks.size,
      reportHistory: this.progressHistory.length,
      runningTime: Date.now() - this.startTime.getTime()
    };
  }
}
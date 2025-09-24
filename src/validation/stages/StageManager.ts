/**
 * StageManager - Extracted from StageProgressionValidator
 * Manages stage lifecycle and transitions
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface Stage {
  id: string;
  name: string;
  order: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  prerequisites: string[];
  validators: string[];
  metadata: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export interface StageTransition {
  fromStage: string;
  toStage: string;
  timestamp: Date;
  reason: string;
  automatic: boolean;
  validationsPassed: boolean;
}

export interface StageConfiguration {
  allowSkipping: boolean;
  enforceOrder: boolean;
  maxRetries: number;
  timeoutMs: number;
  parallelExecution: boolean;
}

export class StageManager extends EventEmitter {
  /**
   * Manages stage lifecycle and transitions.
   *
   * Extracted from StageProgressionValidator (1,188 LOC -> ~250 LOC component).
   * Handles:
   * - Stage definition and configuration
   * - Stage lifecycle management
   * - Transition control
   * - Prerequisite checking
   * - Parallel stage execution
   */

  private stages: Map<string, Stage>;
  private stageOrder: string[];
  private transitions: StageTransition[];
  private currentStage: Stage | null;
  private configuration: StageConfiguration;
  private stageHistory: Map<string, Stage[]>;

  constructor(config?: Partial<StageConfiguration>) {
    super();

    this.stages = new Map();
    this.stageOrder = [];
    this.transitions = [];
    this.currentStage = null;
    this.stageHistory = new Map();

    this.configuration = {
      allowSkipping: false,
      enforceOrder: true,
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes
      parallelExecution: false,
      ...config
    };
  }

  defineStage(stage: Omit<Stage, 'status' | 'startedAt' | 'completedAt' | 'duration'>): void {
    const newStage: Stage = {
      ...stage,
      status: 'pending'
    };

    this.stages.set(stage.id, newStage);

    // Update stage order
    this.updateStageOrder();

    this.emit('stageDefined', newStage);
  }

  private updateStageOrder(): void {
    // Sort stages by order property
    const sortedStages = Array.from(this.stages.values())
      .sort((a, b) => a.order - b.order);

    this.stageOrder = sortedStages.map(s => s.id);
  }

  async startStage(stageId: string, force: boolean = false): Promise<void> {
    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    // Check if stage can be started
    if (!force && !this.canStartStage(stage)) {
      throw new Error(`Cannot start stage ${stageId}: prerequisites not met or order violation`);
    }

    // Check current stage
    if (this.currentStage && this.currentStage.status === 'active') {
      if (!this.configuration.parallelExecution) {
        throw new Error(`Stage ${this.currentStage.id} is still active`);
      }
    }

    // Start the stage
    stage.status = 'active';
    stage.startedAt = new Date();

    // Record transition
    if (this.currentStage) {
      this.recordTransition(this.currentStage.id, stageId, 'Stage started', false);
    }

    this.currentStage = stage;

    // Setup timeout
    this.setupStageTimeout(stage);

    this.emit('stageStarted', stage);
  }

  private canStartStage(stage: Stage): boolean {
    // Check if already completed or active
    if (stage.status === 'completed' || stage.status === 'active') {
      return false;
    }

    // Check prerequisites
    if (!this.checkPrerequisites(stage)) {
      return false;
    }

    // Check order enforcement
    if (this.configuration.enforceOrder) {
      const currentIndex = this.stageOrder.indexOf(stage.id);

      // Check if all previous stages are completed
      for (let i = 0; i < currentIndex; i++) {
        const prevStage = this.stages.get(this.stageOrder[i]);
        if (prevStage && prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
          return false;
        }
      }
    }

    return true;
  }

  private checkPrerequisites(stage: Stage): boolean {
    for (const prereqId of stage.prerequisites) {
      const prereqStage = this.stages.get(prereqId);
      if (!prereqStage || prereqStage.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  private setupStageTimeout(stage: Stage): void {
    if (this.configuration.timeoutMs > 0) {
      setTimeout(() => {
        if (stage.status === 'active') {
          this.failStage(stage.id, 'Stage timeout exceeded');
        }
      }, this.configuration.timeoutMs);
    }
  }

  completeStage(stageId: string, metadata?: Record<string, any>): void {
    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    if (stage.status !== 'active') {
      throw new Error(`Stage ${stageId} is not active`);
    }

    // Complete the stage
    stage.status = 'completed';
    stage.completedAt = new Date();
    stage.duration = stage.completedAt.getTime() - (stage.startedAt?.getTime() || 0);

    if (metadata) {
      stage.metadata = { ...stage.metadata, ...metadata };
    }

    // Store in history
    if (!this.stageHistory.has(stageId)) {
      this.stageHistory.set(stageId, []);
    }
    this.stageHistory.get(stageId)!.push({ ...stage });

    this.emit('stageCompleted', stage);

    // Auto-progress to next stage if configured
    this.checkAutoProgression();
  }

  failStage(stageId: string, reason: string): void {
    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    stage.status = 'failed';
    stage.completedAt = new Date();
    stage.duration = stage.completedAt.getTime() - (stage.startedAt?.getTime() || 0);
    stage.metadata.failureReason = reason;

    this.emit('stageFailed', { stage, reason });

    // Check for retry
    this.checkRetry(stage);
  }

  skipStage(stageId: string, reason: string): void {
    if (!this.configuration.allowSkipping) {
      throw new Error('Stage skipping is not allowed');
    }

    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    stage.status = 'skipped';
    stage.metadata.skipReason = reason;

    this.emit('stageSkipped', { stage, reason });

    // Check auto-progression
    this.checkAutoProgression();
  }

  private checkAutoProgression(): void {
    if (!this.configuration.enforceOrder) {
      return;
    }

    // Find next pending stage
    const currentIndex = this.currentStage ?
      this.stageOrder.indexOf(this.currentStage.id) : -1;

    for (let i = currentIndex + 1; i < this.stageOrder.length; i++) {
      const nextStage = this.stages.get(this.stageOrder[i]);
      if (nextStage && nextStage.status === 'pending') {
        if (this.canStartStage(nextStage)) {
          this.startStage(nextStage.id).catch(error => {
            this.emit('autoProgressionFailed', { stage: nextStage, error });
          });
        }
        break;
      }
    }
  }

  private checkRetry(stage: Stage): void {
    const retryCount = stage.metadata.retryCount || 0;

    if (retryCount < this.configuration.maxRetries) {
      stage.metadata.retryCount = retryCount + 1;
      stage.status = 'pending';

      this.emit('stageRetryScheduled', {
        stage,
        retryCount: retryCount + 1,
        maxRetries: this.configuration.maxRetries
      });

      // Reset stage for retry
      setTimeout(() => {
        this.startStage(stage.id, true).catch(error => {
          this.emit('stageRetryFailed', { stage, error });
        });
      }, 5000); // 5 second delay before retry
    }
  }

  private recordTransition(from: string, to: string, reason: string, automatic: boolean): void {
    const transition: StageTransition = {
      fromStage: from,
      toStage: to,
      timestamp: new Date(),
      reason,
      automatic,
      validationsPassed: true // Will be set by ValidationEngine
    };

    this.transitions.push(transition);
    this.emit('stageTransition', transition);
  }

  resetStage(stageId: string): void {
    const stage = this.stages.get(stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    stage.status = 'pending';
    stage.startedAt = undefined;
    stage.completedAt = undefined;
    stage.duration = undefined;
    stage.metadata = {};

    this.emit('stageReset', stage);
  }

  resetAllStages(): void {
    for (const stage of this.stages.values()) {
      this.resetStage(stage.id);
    }
    this.currentStage = null;
    this.transitions = [];
  }

  getStage(stageId: string): Stage | undefined {
    return this.stages.get(stageId);
  }

  getAllStages(): Stage[] {
    return Array.from(this.stages.values());
  }

  getCurrentStage(): Stage | null {
    return this.currentStage;
  }

  getTransitions(): StageTransition[] {
    return [...this.transitions];
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const stages = Array.from(this.stages.values());
    const completed = stages.filter(s =>
      s.status === 'completed' || s.status === 'skipped'
    ).length;

    return {
      completed,
      total: stages.length,
      percentage: stages.length > 0 ? (completed / stages.length) * 100 : 0
    };
  }

  getMetrics(): any {
    const stages = Array.from(this.stages.values());

    return {
      totalStages: stages.length,
      completed: stages.filter(s => s.status === 'completed').length,
      failed: stages.filter(s => s.status === 'failed').length,
      skipped: stages.filter(s => s.status === 'skipped').length,
      pending: stages.filter(s => s.status === 'pending').length,
      active: stages.filter(s => s.status === 'active').length,
      transitions: this.transitions.length,
      averageDuration: this.calculateAverageDuration(),
      configuration: this.configuration
    };
  }

  private calculateAverageDuration(): number {
    const completedStages = Array.from(this.stages.values())
      .filter(s => s.duration);

    if (completedStages.length === 0) return 0;

    const totalDuration = completedStages.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / completedStages.length;
  }
}
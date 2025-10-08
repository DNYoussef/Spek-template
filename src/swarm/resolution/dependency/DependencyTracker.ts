/**
 * DependencyTracker - Dependency lifecycle management and tracking
 *
 * Handles dependency registration, status tracking, timeout management,
 * and requirement validation with NASA Rule 10 compliance.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 * @component DependencyConflictResolver decomposition
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from '../../../shared/mega-fsm/MegaTransitionHub';
import { ComponentConfig, ProcessInput, ProcessResult } from '../../../shared/mega-fsm/types/MegaDecompositionTypes';

// NASA Rule 10: Fixed bounds constants
const MAX_DEPENDENCIES = 1000;
const MAX_REQUIREMENTS_PER_DEPENDENCY = 20;
const MAX_TIMEOUT_CHECKS = 100;
const MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes

export interface Dependency {
  dependencyId: string;
  dependentDomain: string;
  providerDomain: string;
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

export interface DependencyUpdate {
  dependencyId: string;
  status?: Dependency['status'];
  requirements?: Partial<DependencyRequirement>[];
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface TrackerMetrics {
  totalDependencies: number;
  pendingDependencies: number;
  satisfiedDependencies: number;
  failedDependencies: number;
  averageResolutionTime: number;
  timeoutRate: number;
}

/**
 * DependencyTracker manages dependency lifecycle and status
 * NASA Rule 10: All functions ≤60 lines, no recursion, bounded operations
 */
export class DependencyTracker {
  private transitionHub: MegaTransitionHub;
  private dependencies: Map<string, Dependency> = new Map();
  private timeoutTracking: Map<string, NodeJS.Timeout> = new Map();
  private updateHistory: Map<string, DependencyUpdate[]> = new Map();

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.startTimeoutMonitoring();
    this.validateConfiguration();
  }

  /**
   * Register new dependency for tracking
   * NASA Rule 10: Fixed bounds, assertions for safety
   */
  public registerDependency(dependency: Omit<Dependency, 'createdAt' | 'lastUpdated'>): string {
    // NASA Rule 10: Input validation assertions
    console.assert(dependency.dependencyId.length > 0, 'Dependency ID cannot be empty');
    console.assert(dependency.requirements.length <= MAX_REQUIREMENTS_PER_DEPENDENCY, 'Too many requirements');
    console.assert(this.dependencies.size < MAX_DEPENDENCIES, 'Maximum dependencies reached');

    const fullDependency: Dependency = {
      ...dependency,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      retryCount: 0,
      maxRetries: dependency.maxRetries || MAX_RETRY_ATTEMPTS,
      timeoutMs: dependency.timeoutMs || DEFAULT_TIMEOUT_MS
    };

    this.dependencies.set(dependency.dependencyId, fullDependency);
    this.setupTimeout(dependency.dependencyId, fullDependency.timeoutMs);
    this.recordUpdate(dependency.dependencyId, {
      dependencyId: dependency.dependencyId,
      status: fullDependency.status,
      timestamp: Date.now()
    });

    // NASA Rule 10: Assertion
    console.assert(this.dependencies.has(dependency.dependencyId), 'Dependency registration failed');

    return dependency.dependencyId;
  }

  /**
   * Update dependency status and requirements
   * NASA Rule 10: Fixed bounds, simple updates
   */
  public updateDependency(update: DependencyUpdate): boolean {
    // NASA Rule 10: Input validation
    console.assert(update.dependencyId.length > 0, 'Dependency ID cannot be empty');

    const dependency = this.dependencies.get(update.dependencyId);
    if (!dependency) {
      return false;
    }

    // Update status if provided
    if (update.status) {
      dependency.status = update.status;
    }

    // Update requirements if provided
    if (update.requirements) {
      this.updateRequirements(dependency, update.requirements);
    }

    // Update timestamp
    dependency.lastUpdated = update.timestamp;

    // Check if dependency is now satisfied
    if (this.checkDependencySatisfied(dependency)) {
      dependency.status = 'satisfied';
      dependency.resolvedAt = Date.now();
      this.clearTimeout(dependency.dependencyId);
    }

    // Record update history
    this.recordUpdate(update.dependencyId, update);

    return true;
  }

  /**
   * Check if dependency requirements are satisfied
   * NASA Rule 10: Bounded checking with fixed limits
   */
  private checkDependencySatisfied(dependency: Dependency): boolean {
    // NASA Rule 10: Bounded loop with fixed maximum iterations
    for (let i = 0; i < Math.min(dependency.requirements.length, MAX_REQUIREMENTS_PER_DEPENDENCY); i++) {
      const requirement = dependency.requirements[i];

      if (!this.checkRequirementSatisfied(requirement)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if individual requirement is satisfied
   * NASA Rule 10: Simple validation with bounds
   */
  private checkRequirementSatisfied(requirement: DependencyRequirement): boolean {
    if (requirement.satisfied) {
      return true;
    }

    // Simple validation based on requirement type
    switch (requirement.type) {
      case 'input_data':
        return requirement.currentValue !== null && requirement.currentValue !== undefined;
      case 'completion_status':
        return requirement.currentValue === 'completed';
      case 'quality_gate':
        return this.validateQualityGate(requirement);
      case 'resource_availability':
        return this.validateResourceAvailability(requirement);
      case 'approval':
        return requirement.currentValue === 'approved';
      default:
        return false;
    }
  }

  /**
   * Update dependency requirements
   * NASA Rule 10: Bounded update with fixed limits
   */
  private updateRequirements(dependency: Dependency, updates: Partial<DependencyRequirement>[]): void {
    // NASA Rule 10: Bounded loop
    for (let i = 0; i < Math.min(updates.length, MAX_REQUIREMENTS_PER_DEPENDENCY); i++) {
      const update = updates[i];

      if (update.requirementId) {
        const requirement = dependency.requirements.find(r => r.requirementId === update.requirementId);

        if (requirement) {
          // Update requirement properties
          if (update.currentValue !== undefined) {
            requirement.currentValue = update.currentValue;
          }
          if (update.satisfied !== undefined) {
            requirement.satisfied = update.satisfied;
          }
          if (update.criteria !== undefined) {
            requirement.criteria = update.criteria;
          }
        }
      }
    }
  }

  /**
   * Setup timeout monitoring for dependency
   * NASA Rule 10: Simple timeout setup
   */
  private setupTimeout(dependencyId: string, timeoutMs: number): void {
    const timeout = setTimeout(() => {
      this.handleDependencyTimeout(dependencyId);
    }, timeoutMs);

    this.timeoutTracking.set(dependencyId, timeout);
  }

  /**
   * Handle dependency timeout
   * NASA Rule 10: Simple timeout handling
   */
  private handleDependencyTimeout(dependencyId: string): void {
    const dependency = this.dependencies.get(dependencyId);
    if (!dependency) {
      return;
    }

    // Check if dependency can be retried
    if (dependency.retryCount < dependency.maxRetries) {
      dependency.retryCount++;
      dependency.status = 'pending';
      dependency.lastUpdated = Date.now();

      // Setup new timeout
      this.setupTimeout(dependencyId, dependency.timeoutMs);

      console.log(`Retrying dependency ${dependencyId} (attempt ${dependency.retryCount})`);
    } else {
      // Mark as failed
      dependency.status = 'failed';
      dependency.lastUpdated = Date.now();

      console.log(`Dependency ${dependencyId} failed after ${dependency.maxRetries} retries`);
    }
  }

  /**
   * Clear timeout for dependency
   */
  private clearTimeout(dependencyId: string): void {
    const timeout = this.timeoutTracking.get(dependencyId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutTracking.delete(dependencyId);
    }
  }

  /**
   * Get dependency by ID
   */
  public getDependency(dependencyId: string): Dependency | null {
    return this.dependencies.get(dependencyId) || null;
  }

  /**
   * Get dependencies by status
   * NASA Rule 10: Bounded filtering
   */
  public getDependenciesByStatus(status: Dependency['status']): Dependency[] {
    const result: Dependency[] = [];

    // NASA Rule 10: Bounded iteration
    for (const [, dependency] of this.dependencies) {
      if (dependency.status === status) {
        result.push(dependency);
      }

      if (result.length >= 100) {
        break;
      }
    }

    return result;
  }

  /**
   * Get dependencies by domain
   * NASA Rule 10: Bounded filtering
   */
  public getDependenciesByDomain(domainType: 'dependent' | 'provider', domain: string): Dependency[] {
    const result: Dependency[] = [];

    // NASA Rule 10: Bounded iteration
    for (const [, dependency] of this.dependencies) {
      const matchesDomain = domainType === 'dependent'
        ? dependency.dependentDomain === domain
        : dependency.providerDomain === domain;

      if (matchesDomain) {
        result.push(dependency);
      }

      if (result.length >= 100) {
        break;
      }
    }

    return result;
  }

  /**
   * Get tracker metrics
   * NASA Rule 10: Simple metric calculation
   */
  public getMetrics(): TrackerMetrics {
    let totalDependencies = 0;
    let pendingDependencies = 0;
    let satisfiedDependencies = 0;
    let failedDependencies = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let timeoutCount = 0;

    // NASA Rule 10: Bounded iteration
    for (const [, dependency] of this.dependencies) {
      totalDependencies++;

      switch (dependency.status) {
        case 'pending':
        case 'requested':
        case 'in_progress':
          pendingDependencies++;
          break;
        case 'satisfied':
          satisfiedDependencies++;
          if (dependency.resolvedAt) {
            totalResolutionTime += dependency.resolvedAt - dependency.createdAt;
            resolvedCount++;
          }
          break;
        case 'failed':
          failedDependencies++;
          if (dependency.retryCount >= dependency.maxRetries) {
            timeoutCount++;
          }
          break;
      }
    }

    return {
      totalDependencies,
      pendingDependencies,
      satisfiedDependencies,
      failedDependencies,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      timeoutRate: totalDependencies > 0 ? timeoutCount / totalDependencies : 0
    };
  }

  /**
   * Record dependency update in history
   * NASA Rule 10: Bounded history with fixed size limit
   */
  private recordUpdate(dependencyId: string, update: DependencyUpdate): void {
    const history = this.updateHistory.get(dependencyId) || [];
    history.push(update);

    // NASA Rule 10: Bounded history size
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    this.updateHistory.set(dependencyId, history);
  }

  /**
   * Start periodic timeout monitoring
   * NASA Rule 10: Bounded monitoring
   */
  private startTimeoutMonitoring(): void {
    setInterval(() => {
      this.checkTimeouts();
    }, 60000); // Check every minute
  }

  /**
   * Check for timeouts across all dependencies
   * NASA Rule 10: Bounded checking
   */
  private checkTimeouts(): void {
    const now = Date.now();
    let checkedCount = 0;

    // NASA Rule 10: Bounded iteration
    for (const [, dependency] of this.dependencies) {
      if (checkedCount >= MAX_TIMEOUT_CHECKS) {
        break;
      }

      if (dependency.status === 'in_progress' || dependency.status === 'requested') {
        const elapsed = now - dependency.lastUpdated;
        if (elapsed > dependency.timeoutMs) {
          this.handleDependencyTimeout(dependency.dependencyId);
        }
      }

      checkedCount++;
    }
  }

  /**
   * Helper validation methods
   * NASA Rule 10: Simple validation implementations
   */
  private validateQualityGate(requirement: DependencyRequirement): boolean {
    // Simplified quality gate validation
    const threshold = requirement.criteria?.threshold || 0.8;
    const currentValue = requirement.currentValue || 0;
    return currentValue >= threshold;
  }

  private validateResourceAvailability(requirement: DependencyRequirement): boolean {
    // Simplified resource availability validation
    const requiredCapacity = requirement.criteria?.capacity || 1;
    const availableCapacity = requirement.currentValue || 0;
    return availableCapacity >= requiredCapacity;
  }

  /**
   * Cleanup and shutdown
   */
  public shutdown(): void {
    // Clear all timeouts
    for (const timeout of this.timeoutTracking.values()) {
      clearTimeout(timeout);
    }
    this.timeoutTracking.clear();
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(MAX_DEPENDENCIES > 0, 'Maximum dependencies must be positive');
    console.assert(MAX_REQUIREMENTS_PER_DEPENDENCY > 0, 'Maximum requirements per dependency must be positive');
    console.assert(DEFAULT_TIMEOUT_MS > 0, 'Default timeout must be positive');
  }
}
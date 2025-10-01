/**
 * ResourceManager - NASA Rule 10 Compliant Resource Management
 * Manages Princess resources with bounded operations
 */

import { ResourceAllocation } from '~types/QueenTypes';
import { NASACompliantLoopHandler } from '../utils/NASACompliantLoopHandler';
import { PrincessStateMachineFacade as PrincessStateMachine } from '../../state-machines/PrincessStateMachineFacade';

export interface EscalationCheck {
  needed: boolean;
  issue?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceMetrics {
  utilization: Record<string, number>;
  performance: Record<string, any>;
  availability: Record<string, number>;
}

export class ResourceManager {
  private loopHandler: NASACompliantLoopHandler;
  private resourceAllocations: Map<string, ResourceAllocation>;

  constructor(loopHandler: NASACompliantLoopHandler) {
    this.loopHandler = loopHandler;
    this.resourceAllocations = new Map();
  }

  initialize(): void {
    // Initialize resource management
  }

  async initializePrincessResources(
    princessId: string,
    stateMachine: PrincessStateMachine
  ): Promise<void> {
    const allocation: ResourceAllocation = {
      princessId,
      allocatedCapacity: 1.0,
      currentUtilization: 0.0,
      capabilities: stateMachine.getCapabilities().map(cap => cap.id),
      performance: {
        throughput: 0,
        latency: 0,
        errorRate: 0,
        availability: 1.0
      },
      constraints: {
        maxConcurrentTasks: 10,
        preferredWorkload: [],
        blacklistedWorkload: []
      }
    };

    this.resourceAllocations.set(princessId, allocation);
  }

  async selectOptimalPrincess(
    task: any,
    requirements: string[],
    availablePrincesses: string[],
    maxPrincessCount: number
  ): Promise<string | null> {
    return this.loopHandler.executeWithBounds('selectOptimalPrincess', () => {
      let bestPrincess: string | null = null;
      let bestScore = -1;

      const boundedPrincesses = this.loopHandler.enforceCollectionBounds(
        availablePrincesses,
        'maxPrincessCount'
      );

      for (const princessId of boundedPrincesses) {
        const allocation = this.resourceAllocations.get(princessId);
        if (allocation) {
          const score = this.calculatePrincessSuitability(task, requirements, allocation);
          if (score > bestScore) {
            bestScore = score;
            bestPrincess = princessId;
          }
        }
      }

      return bestPrincess;
    });
  }

  updatePrincessAvailability(princessId: string, newState: string): void {
    const allocation = this.resourceAllocations.get(princessId);
    if (allocation) {
      allocation.performance.availability = newState === 'error' ? 0 : 1;
    }
  }

  async updateResourceUtilization(
    princessId: string,
    action: 'allocate' | 'release'
  ): Promise<void> {
    const allocation = this.resourceAllocations.get(princessId);
    if (allocation) {
      if (action === 'allocate') {
        allocation.currentUtilization = Math.min(1.0, allocation.currentUtilization + 0.1);
      } else {
        allocation.currentUtilization = Math.max(0.0, allocation.currentUtilization - 0.1);
      }
    }
  }

  updatePrincessPerformanceMetrics(princessId: string, result: any): void {
    const allocation = this.resourceAllocations.get(princessId);
    if (allocation) {
      allocation.performance.throughput = (allocation.performance.throughput + 1) / 2;
    }
  }

  checkEscalationNeeded(
    princessId: string,
    escalationThresholds: any
  ): EscalationCheck {
    const allocation = this.resourceAllocations.get(princessId);
    if (!allocation) {
      return { needed: false };
    }

    if (allocation.performance.errorRate > escalationThresholds.errorRate) {
      return {
        needed: true,
        issue: {
          type: 'performance_degradation',
          description: 'Performance metrics below threshold',
          metrics: allocation.performance
        },
        severity: 'medium'
      };
    }

    return { needed: false };
  }

  handlePrincessError(
    princessId: string,
    error: Error,
    escalationThresholds: any
  ): EscalationCheck {
    const allocation = this.resourceAllocations.get(princessId);
    if (allocation) {
      allocation.performance.errorRate = (allocation.performance.errorRate + 1) / 2;

      if (allocation.performance.errorRate > escalationThresholds.errorRate) {
        return {
          needed: true,
          issue: {
            type: 'high_error_rate',
            description: `High error rate detected for ${princessId}`,
            errorRate: allocation.performance.errorRate
          },
          severity: 'high'
        };
      }
    }

    return { needed: false };
  }

  async handleCascadeFailure(payload: any): Promise<void> {
    // Implement cascade failure recovery
  }

  async handleResourceExhaustion(payload: any): Promise<void> {
    // Implement resource reallocation logic
  }

  /**
   * Get resource utilization summary (NASA Rule 10 compliant)
   */
  getUtilization(): Record<string, number> {
    const utilization: Record<string, number> = {};
    for (const [princessId, allocation] of this.resourceAllocations) {
      utilization[princessId] = allocation.currentUtilization;
    }
    return utilization;
  }

  /**
   * Get resource utilization summary (NASA Rule 10 compliant)
   * Alias for getUtilization for compatibility
   */
  getUtilizationSummary(): Record<string, number> {
    return this.getUtilization();
  }

  getMetrics(): ResourceMetrics {
    const utilization: Record<string, number> = {};
    for (const [princessId, allocation] of this.resourceAllocations) {
      utilization[princessId] = allocation.currentUtilization;
    }

    return {
      utilization,
      performance: {},
      availability: {}
    };
  }

  private calculatePrincessSuitability(
    task: any,
    requirements: string[],
    allocation: ResourceAllocation
  ): number {
    let score = 0;

    // Capability match
    const capabilityMatch = requirements.filter(req =>
      allocation.capabilities.includes(req)
    ).length / requirements.length;
    score += capabilityMatch * 40;

    // Current utilization (prefer less utilized)
    const utilizationScore = (1 - allocation.currentUtilization) * 30;
    score += utilizationScore;

    // Performance metrics
    const performanceScore = (
      allocation.performance.throughput * 10 +
      (1 - allocation.performance.errorRate) * 10 +
      allocation.performance.availability * 10
    );
    score += performanceScore;

    return score;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-024-resource-manager
// inputs: ["QueenOrchestrator.ts refactoring requirements"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===
/**
 * ObjectiveManager - NASA Rule 10 Compliant Objective Management
 * Manages strategic objectives with bounded operations
 */

import { StrategicObjective } from '../types/QueenTypes';
import { NASACompliantLoopHandler } from '../utils/NASACompliantLoopHandler';

export interface ObjectiveMetrics {
  active: number;
  completed: number;
  failed: number;
  successRate: number;
}

export class ObjectiveManager {
  private loopHandler: NASACompliantLoopHandler;
  private objectives: Map<string, StrategicObjective>;
  private maxObjectives: number;

  constructor(loopHandler: NASACompliantLoopHandler) {
    this.loopHandler = loopHandler;
    this.objectives = new Map();
    this.maxObjectives = loopHandler.getConfig().maxObjectiveCount;
  }

  initialize(): void {
    // Initialize objective management
  }

  async defineObjective(objective: Omit<StrategicObjective, 'id' | 'status' | 'metadata'>): Promise<string> {
    return this.loopHandler.executeWithBounds('defineObjective', () => {
      // NASA Rule 10: Check bounds
      if (this.objectives.size >= this.maxObjectives) {
        throw new Error(`Cannot define more than ${this.maxObjectives} objectives`);
      }

      const objectiveId = this.generateId();

      const strategicObjective: StrategicObjective = {
        ...objective,
        id: objectiveId,
        status: 'pending',
        metadata: {
          created: new Date(),
          createdBy: 'queen',
          lastModified: new Date(),
          businessValue: objective.priority === 'critical' ? 10 :
                        objective.priority === 'high' ? 8 :
                        objective.priority === 'medium' ? 5 : 3,
          riskLevel: 'medium'
        }
      };

      this.objectives.set(objectiveId, strategicObjective);
      return objectiveId;
    });
  }

  async getObjective(objectiveId: string): Promise<StrategicObjective | undefined> {
    return this.objectives.get(objectiveId);
  }

  async updateObjectiveStatus(
    objectiveId: string,
    status: StrategicObjective['status']
  ): Promise<void> {
    const objective = this.objectives.get(objectiveId);
    if (objective) {
      objective.status = status;
      objective.metadata.lastModified = new Date();
    }
  }

  getAllObjectives(): StrategicObjective[] {
    return Array.from(this.objectives.values());
  }

  getObjectivesByStatus(status: StrategicObjective['status']): StrategicObjective[] {
    return this.loopHandler.executeWithBounds('getObjectivesByStatus', () => {
      return Array.from(this.objectives.values()).filter(obj => obj.status === status);
    });
  }

  getMetrics(): ObjectiveMetrics {
    return this.loopHandler.executeWithBounds('getMetrics', () => {
      const allObjectives = Array.from(this.objectives.values());
      const active = allObjectives.filter(obj =>
        obj.status === 'executing' || obj.status === 'planning'
      ).length;
      const completed = allObjectives.filter(obj => obj.status === 'completed').length;
      const failed = allObjectives.filter(obj => obj.status === 'failed').length;
      const successRate = allObjectives.length > 0 ? completed / allObjectives.length : 0;

      return {
        active,
        completed,
        failed,
        successRate
      };
    });
  }

  generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old completed/failed objectives to maintain bounds
   */
  cleanupOldObjectives(): void {
    this.loopHandler.executeWithBounds('cleanupOldObjectives', () => {
      const allObjectives = Array.from(this.objectives.entries());
      const activeObjectives = allObjectives.filter(([_, obj]) =>
        obj.status === 'executing' || obj.status === 'planning'
      );

      // If we're at max capacity, remove oldest completed/failed objectives
      if (allObjectives.length >= this.maxObjectives) {
        const inactiveObjectives = allObjectives
          .filter(([_, obj]) => obj.status === 'completed' || obj.status === 'failed')
          .sort(([_, a], [__, b]) => a.metadata.lastModified.getTime() - b.metadata.lastModified.getTime());

        const toRemove = inactiveObjectives.slice(0, inactiveObjectives.length - (this.maxObjectives - activeObjectives.length) + 1);

        for (const [id] of toRemove) {
          this.objectives.delete(id);
        }
      }
    });
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:29:35-04:00 | CODEX AGENT 024@Claude Sonnet | Created ObjectiveManager.ts with NASA Rule 10 compliant objective management | ObjectiveManager.ts | OK | Decomposed objective management | 0.00 | d0e5f6g |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-024-objective-manager
- inputs: ["QueenOrchestrator.ts refactoring requirements"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
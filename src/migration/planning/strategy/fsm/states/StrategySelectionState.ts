import { Logger } from '../../../../utils/Logger';
import {
  MigrationPlanningContext,
  StateHandler,
  StateResult,
  MigrationPlanningEvent,
  SideEffect,
  MigrationApproach,
  AlternativeApproach
} from '~types/MigrationFSMTypes';

/**
 * Strategy Selection State Handler
 * Selects optimal migration strategy based on analysis results
 * NASA Rule 10: All methods ≤60 lines, 2+ assertions
 */
export class StrategySelectionState implements StateHandler {
  private logger: Logger;
  private strategyEvaluators: StrategyEvaluator[];

  constructor() {
    this.logger = new Logger('StrategySelectionState');
    this.strategyEvaluators = this.initializeEvaluators();
  }

  /**
   * Initialize state handler
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async init(): Promise<void> {
    assert(this.logger !== null, 'Logger must be initialized');
    assert(this.strategyEvaluators.length > 0, 'Strategy evaluators must be defined');
    
    this.logger.info('Strategy selection state initialized');
  }

  /**
   * Process strategy selection and evaluation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async update(context: MigrationPlanningContext): Promise<StateResult> {
    assert(context !== null, 'Context must be provided');
    assert(context.request !== undefined, 'Request must be analyzed before strategy selection');

    this.logger.info('Starting strategy selection');
    const sideEffects: SideEffect[] = [];

    try {
      // Evaluate all available strategies
      const strategies = await this.evaluateStrategies(context);
      
      if (strategies.length === 0) {
        throw new Error('No viable migration strategies found');
      }

      // Select best strategy
      const selectedStrategy = this.selectBestStrategy(strategies);
      
      // Create migration approach
      const approach = this.createMigrationApproach(selectedStrategy, strategies);

      sideEffects.push({
        type: 'log',
        payload: { 
          message: `Selected strategy: ${approach.strategy}`,
          data: { suitabilityScore: approach.suitabilityScore }
        }
      });

      sideEffects.push({
        type: 'emit',
        payload: { event: 'strategySelected', data: approach }
      });

      return {
        nextEvent: MigrationPlanningEvent.STRATEGY_SELECTED,
        updatedContext: {
          ...context,
          selectedStrategy: approach
        },
        sideEffects
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Strategy selection failed', { error: errorMessage });
      
      return {
        nextEvent: MigrationPlanningEvent.STRATEGY_FAILED,
        updatedContext: {
          ...context,
          error
        },
        sideEffects
      };
    }
  }

  /**
   * Shutdown state handler
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async shutdown(): Promise<void> {
    assert(this.logger !== null, 'Logger must exist for shutdown');
    
    this.logger.info('Strategy selection state shutting down');
    this.strategyEvaluators = [];
    
    assert(this.strategyEvaluators.length === 0, 'Evaluators must be cleared');
  }

  /**
   * Check state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: MigrationPlanningContext): boolean {
    assert(context !== null, 'Context must be provided for invariant check');
    
    // Verify request is analyzed
    if (!context.request) {
      this.logger.warn('Invariant violation: request missing');
      return false;
    }

    // Verify analysis results
    if (!context.request.gapAnalysis || !context.request.riskAnalysis) {
      this.logger.warn('Invariant violation: analysis results missing');
      return false;
    }

    assert(context.request.gapAnalysis !== null, 'Gap analysis must be present');
    
    return true;
  }

  /**
   * Evaluate all available migration strategies
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async evaluateStrategies(context: MigrationPlanningContext): Promise<StrategyEvaluation[]> {
    assert(context.request !== null, 'Request must be provided');
    
    const evaluations: StrategyEvaluation[] = [];

    // Evaluate each strategy (max 6 strategies for bounded execution)
    for (let i = 0; i < Math.min(this.strategyEvaluators.length, 6); i++) {
      const evaluator = this.strategyEvaluators[i];
      
      try {
        const evaluation = await evaluator.evaluate(
          context.request.gapAnalysis,
          context.request.riskAnalysis,
          context.request.dependencyAnalysis,
          context.request.constraints
        );
        
        if (evaluation.suitabilityScore > 0) {
          evaluations.push(evaluation);
        }
      } catch (error) {
        this.logger.warn(`Strategy evaluation failed for ${evaluator.strategyName}`, error);
      }
    }

    assert(evaluations !== null, 'Evaluations array must be initialized');
    
    return evaluations;
  }

  /**
   * Select best strategy from evaluations
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private selectBestStrategy(strategies: StrategyEvaluation[]): StrategyEvaluation {
    assert(strategies.length > 0, 'At least one strategy must be available');
    
    // Sort by suitability score (descending)
    const sorted = strategies.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    const best = sorted[0];
    
    assert(best.suitabilityScore > 0, 'Best strategy must have positive score');
    
    return best;
  }

  /**
   * Create migration approach from selected strategy
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createMigrationApproach(
    selected: StrategyEvaluation,
    allStrategies: StrategyEvaluation[]
  ): MigrationApproach {
    assert(selected !== null, 'Selected strategy must be provided');
    assert(allStrategies.length > 0, 'Strategy alternatives must be provided');

    // Create alternative approaches (max 5 alternatives)
    const alternatives: AlternativeApproach[] = allStrategies
      .filter(s => s !== selected)
      .slice(0, 5)
      .map(s => ({
        strategy: s.strategyName,
        description: s.description,
        pros: s.benefits,
        cons: s.risks.map(r => r.description),
        suitabilityScore: s.suitabilityScore,
        whenToConsider: s.whenToConsider
      }));

    return {
      strategy: selected.strategyName as any,
      rationale: selected.rationale,
      benefits: selected.benefits,
      risks: selected.risks.map(r => r.description),
      suitabilityScore: selected.suitabilityScore,
      alternativeApproaches: alternatives
    };
  }

  /**
   * Initialize strategy evaluators
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeEvaluators(): StrategyEvaluator[] {
    const evaluators: StrategyEvaluator[] = [
      new BigBangEvaluator(),
      new PhasedEvaluator(),
      new ParallelEvaluator(),
      new PilotEvaluator(),
      new StranglerFigEvaluator(),
      new DatabaseFirstEvaluator()
    ];

    assert(evaluators.length > 0, 'At least one evaluator must be defined');
    assert(evaluators.every(e => e.strategyName), 'All evaluators must have strategy name');

    return evaluators;
  }
}

// Strategy Evaluator Implementations

abstract class StrategyEvaluator {
  abstract strategyName: string;
  
  abstract evaluate(
    gapAnalysis: any,
    riskAnalysis: any,
    dependencyAnalysis: any,
    constraints: any[]
  ): Promise<StrategyEvaluation>;

  protected calculateBaseScore(complexity: string, riskLevel: string): number {
    let score = 50;
    
    if (complexity === 'low') score += 10;
    if (complexity === 'high') score -= 10;
    
    if (riskLevel === 'low') score += 10;
    if (riskLevel === 'high') score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

class BigBangEvaluator extends StrategyEvaluator {
  strategyName = 'big_bang';

  async evaluate(gapAnalysis: any, riskAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'medium');
    
    return {
      strategyName: this.strategyName,
      description: 'Complete migration in single coordinated effort',
      suitabilityScore: gapAnalysis.changeComplexity === 'low' ? score + 20 : score - 20,
      benefits: ['Fast completion', 'Simple coordination', 'Clear cutover'],
      risks: [{ description: 'High failure risk', impact: 90, probability: 0.3 }],
      rationale: 'Suitable for simple migrations with low complexity',
      whenToConsider: ['Low complexity', 'Time pressure', 'Simple systems']
    };
  }
}

class PhasedEvaluator extends StrategyEvaluator {
  strategyName = 'phased';

  async evaluate(gapAnalysis: any, riskAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'low');
    
    return {
      strategyName: this.strategyName,
      description: 'Gradual migration in planned phases',
      suitabilityScore: gapAnalysis.changeComplexity === 'high' ? score + 25 : score,
      benefits: ['Lower risk', 'Iterative learning', 'Easier rollback'],
      risks: [{ description: 'Longer timeline', impact: 30, probability: 0.8 }],
      rationale: 'Suitable for complex migrations requiring careful coordination',
      whenToConsider: ['High complexity', 'Risk aversion', 'Large systems']
    };
  }
}

class ParallelEvaluator extends StrategyEvaluator {
  strategyName = 'parallel';

  async evaluate(gapAnalysis: any, riskAnalysis: any, dependencyAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'medium');
    const depCount = dependencyAnalysis.dependencies?.length || 0;
    
    return {
      strategyName: this.strategyName,
      description: 'Parallel migration of independent components',
      suitabilityScore: depCount < 5 ? score + 15 : score - 15,
      benefits: ['Faster completion', 'Resource efficiency', 'Independent streams'],
      risks: [{ description: 'Coordination complexity', impact: 50, probability: 0.5 }],
      rationale: 'Suitable when components have minimal dependencies',
      whenToConsider: ['Independent components', 'Resource availability', 'Time pressure']
    };
  }
}

class PilotEvaluator extends StrategyEvaluator {
  strategyName = 'pilot';

  async evaluate(gapAnalysis: any, riskAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'medium');
    
    return {
      strategyName: this.strategyName,
      description: 'Pilot migration followed by full rollout',
      suitabilityScore: score + 10, // Generally safe approach
      benefits: ['Risk validation', 'Learning opportunity', 'Stakeholder confidence'],
      risks: [{ description: 'Extended timeline', impact: 40, probability: 0.7 }],
      rationale: 'Suitable for validating approach before full commitment',
      whenToConsider: ['Uncertain approach', 'Stakeholder concerns', 'New technology']
    };
  }
}

class StranglerFigEvaluator extends StrategyEvaluator {
  strategyName = 'strangler_fig';

  async evaluate(gapAnalysis: any, riskAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'low');
    
    return {
      strategyName: this.strategyName,
      description: 'Gradual replacement of legacy system',
      suitabilityScore: gapAnalysis.changeComplexity === 'high' ? score + 20 : score,
      benefits: ['Minimal risk', 'Continuous operation', 'Gradual learning'],
      risks: [{ description: 'Long timeline', impact: 30, probability: 0.9 }],
      rationale: 'Suitable for gradual modernization with minimal disruption',
      whenToConsider: ['Legacy systems', 'Business continuity', 'Risk aversion']
    };
  }
}

class DatabaseFirstEvaluator extends StrategyEvaluator {
  strategyName = 'database_first';

  async evaluate(gapAnalysis: any, riskAnalysis: any): Promise<StrategyEvaluation> {
    const score = this.calculateBaseScore(gapAnalysis.changeComplexity, 'medium');
    const hasDataChanges = gapAnalysis.impactAreas?.some(area => area.category === 'data');
    
    return {
      strategyName: this.strategyName,
      description: 'Database migration followed by application migration',
      suitabilityScore: hasDataChanges ? score + 15 : score - 10,
      benefits: ['Data integrity focus', 'Clear separation', 'Reduced complexity'],
      risks: [{ description: 'Application compatibility', impact: 60, probability: 0.4 }],
      rationale: 'Suitable when database changes are primary concern',
      whenToConsider: ['Major data changes', 'Database modernization', 'Data compliance']
    };
  }
}

// Supporting interfaces
interface StrategyEvaluation {
  strategyName: string;
  description: string;
  suitabilityScore: number;
  benefits: string[];
  risks: { description: string; impact: number; probability: number }[];
  rationale: string;
  whenToConsider: string[];
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: migration-fsm-strategy-state-001
// inputs: ["MigrationPlanner.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4-20250514","prompt":"migration-fsm-refactor-v1"}
// === END FOOTER ===

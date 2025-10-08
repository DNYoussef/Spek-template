/**
 * DecisionEngine - Rational decision making for swarm coordination
 *
 * Handles decision context analysis, option evaluation, and systematic
 * decision making with NASA Rule 10 compliance.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 * @component RationalistReasoningEngine decomposition
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from '../../../shared/mega-fsm/MegaTransitionHub';
import { ComponentConfig, ProcessInput, ProcessResult } from '../../../shared/mega-fsm/types/MegaDecompositionTypes';

// NASA Rule 10: Fixed bounds constants
const MAX_DECISION_OPTIONS = 20;
const MAX_CRITERIA = 15;
const MAX_STAKEHOLDERS = 30;
const MAX_CONSTRAINTS = 25;

export interface DecisionContext {
  id: string;
  description: string;
  goal: string;
  constraints: Constraint[];
  options: DecisionOption[];
  criteria: DecisionCriteria[];
  stakeholders: Stakeholder[];
  timeHorizon: TimeHorizon;
  uncertainty: UncertaintyAssessment;
  riskTolerance: number;
  reversibility: number; // How easily the decision can be undone
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  benefit: number;
  risk: number;
  probability: number; // Probability of success
  timeToImplement: number;
  reversible: boolean;
  dependencies: string[];
  consequences: Consequence[];
  score?: number;
}

export interface DecisionCriteria {
  id: string;
  name: string;
  weight: number; // 0-1 scale
  type: 'cost' | 'benefit' | 'risk' | 'time' | 'quality' | 'custom';
  measurement: string;
  threshold?: number;
  mandatory: boolean;
}

export interface Stakeholder {
  id: string;
  name: string;
  influence: number; // 0-1 scale
  interest: number; // 0-1 scale
  position: 'supporter' | 'neutral' | 'opponent';
  requirements: string[];
  concerns: string[];
}

export interface Constraint {
  id: string;
  type: 'budget' | 'time' | 'resource' | 'regulatory' | 'technical';
  description: string;
  limit: number;
  mandatory: boolean;
  flexibility: number; // 0-1 scale
}

export interface TimeHorizon {
  immediate: number; // days
  shortTerm: number; // weeks
  mediumTerm: number; // months
  longTerm: number; // years
}

export interface UncertaintyAssessment {
  overall: number; // 0-1 scale
  factors: UncertaintyFactor[];
  mitigationStrategies: string[];
}

export interface UncertaintyFactor {
  factor: string;
  impact: number; // 0-1 scale
  likelihood: number; // 0-1 scale
  controllable: boolean;
}

export interface Consequence {
  type: 'intended' | 'unintended' | 'side-effect';
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  reversible: boolean;
}

export interface DecisionResult {
  contextId: string;
  recommendedOption: DecisionOption;
  rationale: string;
  confidence: number;
  alternativeOptions: DecisionOption[];
  riskAssessment: RiskAssessment;
  stakeholderImpact: StakeholderImpact[];
  implementationPlan: ImplementationStep[];
}

export interface RiskAssessment {
  overallRisk: number;
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigatable: boolean;
}

export interface StakeholderImpact {
  stakeholderId: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  concerns: string[];
  mitigations: string[];
}

export interface ImplementationStep {
  stepId: string;
  description: string;
  dependencies: string[];
  duration: number;
  resources: string[];
  milestones: string[];
}

/**
 * DecisionEngine manages rational decision making processes
 * NASA Rule 10: All functions ≤60 lines, no recursion, bounded operations
 */
export class DecisionEngine {
  private transitionHub: MegaTransitionHub;
  private decisionContexts: Map<string, DecisionContext> = new Map();
  private decisionHistory: Map<string, DecisionResult[]> = new Map();

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.validateConfiguration();
  }

  /**
   * Analyze decision context and recommend best option
   * NASA Rule 10: Fixed bounds, assertions for safety
   */
  public async analyzeDecision(context: DecisionContext): Promise<DecisionResult> {
    // NASA Rule 10: Input validation assertions
    console.assert(context.id.length > 0, 'Decision context ID cannot be empty');
    console.assert(context.options.length <= MAX_DECISION_OPTIONS, 'Too many decision options');
    console.assert(context.criteria.length <= MAX_CRITERIA, 'Too many decision criteria');

    // Store context
    this.decisionContexts.set(context.id, context);

    // Evaluate all options
    const evaluatedOptions = await this.evaluateOptions(context);

    // Select best option
    const recommendedOption = this.selectBestOption(evaluatedOptions, context);

    // Generate decision result
    const result: DecisionResult = {
      contextId: context.id,
      recommendedOption,
      rationale: this.generateRationale(recommendedOption, context),
      confidence: this.calculateConfidence(recommendedOption, context),
      alternativeOptions: evaluatedOptions.filter(o => o.id !== recommendedOption.id).slice(0, 3),
      riskAssessment: this.assessRisk(recommendedOption, context),
      stakeholderImpact: this.analyzeStakeholderImpact(recommendedOption, context),
      implementationPlan: this.generateImplementationPlan(recommendedOption, context)
    };

    // Record decision history
    this.recordDecisionHistory(context.id, result);

    return result;
  }

  /**
   * Evaluate all decision options against criteria
   * NASA Rule 10: Bounded evaluation with fixed limits
   */
  private async evaluateOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const evaluatedOptions: DecisionOption[] = [];

    // NASA Rule 10: Bounded loop with fixed maximum iterations
    for (let i = 0; i < Math.min(context.options.length, MAX_DECISION_OPTIONS); i++) {
      const option = { ...context.options[i] };

      // Calculate weighted score
      option.score = await this.calculateOptionScore(option, context);

      evaluatedOptions.push(option);
    }

    // Sort by score (highest first)
    return evaluatedOptions.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Calculate weighted score for option
   * NASA Rule 10: Simple scoring calculation
   */
  private async calculateOptionScore(option: DecisionOption, context: DecisionContext): Promise<number> {
    let totalScore = 0;
    let totalWeight = 0;

    // NASA Rule 10: Bounded loop for criteria evaluation
    for (let i = 0; i < Math.min(context.criteria.length, MAX_CRITERIA); i++) {
      const criterion = context.criteria[i];
      const criterionScore = this.evaluateOptionAgainstCriterion(option, criterion);

      totalScore += criterionScore * criterion.weight;
      totalWeight += criterion.weight;
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Apply risk adjustment
    const riskAdjustment = 1 - (option.risk * 0.5); // Reduce score based on risk
    const probabilityAdjustment = option.probability; // Adjust for success probability

    return normalizedScore * riskAdjustment * probabilityAdjustment;
  }

  /**
   * Evaluate option against single criterion
   * NASA Rule 10: Simple criterion evaluation
   */
  private evaluateOptionAgainstCriterion(option: DecisionOption, criterion: DecisionCriteria): number {
    switch (criterion.type) {
      case 'cost':
        return this.normalizeValue(1 / Math.max(0.01, option.cost), 0, 1); // Lower cost = higher score
      case 'benefit':
        return this.normalizeValue(option.benefit, 0, 100);
      case 'risk':
        return this.normalizeValue(1 - option.risk, 0, 1); // Lower risk = higher score
      case 'time':
        return this.normalizeValue(1 / Math.max(0.01, option.timeToImplement), 0, 1); // Faster = higher score
      case 'quality':
        return this.normalizeValue(option.probability, 0, 1); // Higher probability = higher score
      default:
        return 0.5; // Neutral score for unknown types
    }
  }

  /**
   * Select best option based on evaluation
   * NASA Rule 10: Simple selection logic
   */
  private selectBestOption(evaluatedOptions: DecisionOption[], context: DecisionContext): DecisionOption {
    // Filter options that meet mandatory constraints
    const viableOptions = evaluatedOptions.filter(option =>
      this.meetsConstraints(option, context)
    );

    if (viableOptions.length === 0) {
      // No viable options - return best scoring option with warning
      console.warn('No options meet all constraints, selecting best scoring option');
      return evaluatedOptions[0];
    }

    // Return highest scoring viable option
    return viableOptions[0];
  }

  /**
   * Check if option meets mandatory constraints
   * NASA Rule 10: Bounded constraint checking
   */
  private meetsConstraints(option: DecisionOption, context: DecisionContext): boolean {
    // NASA Rule 10: Bounded loop for constraint checking
    for (let i = 0; i < Math.min(context.constraints.length, MAX_CONSTRAINTS); i++) {
      const constraint = context.constraints[i];

      if (!constraint.mandatory) {
        continue;
      }

      switch (constraint.type) {
        case 'budget':
          if (option.cost > constraint.limit) return false;
          break;
        case 'time':
          if (option.timeToImplement > constraint.limit) return false;
          break;
        case 'risk':
          if (option.risk > constraint.limit) return false;
          break;
        // Add other constraint types as needed
      }
    }

    return true;
  }

  /**
   * Helper methods with NASA Rule 10 compliance
   */
  private normalizeValue(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private generateRationale(option: DecisionOption, context: DecisionContext): string {
    return `Selected ${option.name} based on score of ${option.score?.toFixed(2)} considering ${context.criteria.length} criteria and ${context.constraints.length} constraints.`;
  }

  private calculateConfidence(option: DecisionOption, context: DecisionContext): number {
    const scoreConfidence = option.score || 0;
    const probabilityConfidence = option.probability;
    const uncertaintyReduction = 1 - context.uncertainty.overall;

    return (scoreConfidence + probabilityConfidence + uncertaintyReduction) / 3;
  }

  private assessRisk(option: DecisionOption, context: DecisionContext): RiskAssessment {
    const riskFactors: RiskFactor[] = [
      {
        factor: 'Implementation Risk',
        probability: 1 - option.probability,
        impact: option.risk,
        severity: option.risk > 0.7 ? 'high' : option.risk > 0.4 ? 'medium' : 'low',
        mitigatable: true
      }
    ];

    return {
      overallRisk: option.risk,
      riskFactors,
      mitigationStrategies: ['Monitor implementation closely', 'Prepare contingency plans'],
      contingencyPlans: ['Rollback to previous state', 'Escalate to management']
    };
  }

  private analyzeStakeholderImpact(option: DecisionOption, context: DecisionContext): StakeholderImpact[] {
    return context.stakeholders.slice(0, MAX_STAKEHOLDERS).map(stakeholder => ({
      stakeholderId: stakeholder.id,
      impact: stakeholder.position === 'supporter' ? 'positive' :
              stakeholder.position === 'opponent' ? 'negative' : 'neutral',
      magnitude: stakeholder.influence,
      concerns: stakeholder.concerns.slice(0, 5),
      mitigations: ['Regular communication', 'Address specific concerns']
    }));
  }

  private generateImplementationPlan(option: DecisionOption, context: DecisionContext): ImplementationStep[] {
    const steps: ImplementationStep[] = [
      {
        stepId: 'planning',
        description: 'Detailed planning and resource allocation',
        dependencies: [],
        duration: option.timeToImplement * 0.2,
        resources: ['project-manager', 'team-leads'],
        milestones: ['Plan approved', 'Resources assigned']
      },
      {
        stepId: 'execution',
        description: 'Execute the selected option',
        dependencies: ['planning'],
        duration: option.timeToImplement * 0.6,
        resources: ['implementation-team'],
        milestones: ['50% complete', '90% complete']
      },
      {
        stepId: 'validation',
        description: 'Validate results and finalize',
        dependencies: ['execution'],
        duration: option.timeToImplement * 0.2,
        resources: ['qa-team', 'stakeholders'],
        milestones: ['Testing complete', 'Stakeholder approval']
      }
    ];

    return steps;
  }

  private recordDecisionHistory(contextId: string, result: DecisionResult): void {
    const history = this.decisionHistory.get(contextId) || [];
    history.push(result);

    // NASA Rule 10: Bounded history size
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    this.decisionHistory.set(contextId, history);
  }

  /**
   * Get decision context by ID
   */
  public getDecisionContext(contextId: string): DecisionContext | null {
    return this.decisionContexts.get(contextId) || null;
  }

  /**
   * Get decision history
   */
  public getDecisionHistory(contextId: string): DecisionResult[] {
    return this.decisionHistory.get(contextId) || [];
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(MAX_DECISION_OPTIONS > 0, 'Maximum decision options must be positive');
    console.assert(MAX_CRITERIA > 0, 'Maximum criteria must be positive');
    console.assert(MAX_STAKEHOLDERS > 0, 'Maximum stakeholders must be positive');
  }
}
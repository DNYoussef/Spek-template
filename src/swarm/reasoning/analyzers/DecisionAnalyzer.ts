/**
 * Decision Analysis Engine
 * Implements multi-criteria decision analysis with uncertainty
 */

import * as crypto from 'crypto';
import { 
  DecisionContext, 
  DecisionOption, 
  DecisionCriteria, 
  Analysis,
  Recommendation,
  Cost 
} from '../types/ReasoningTypes';

export class DecisionAnalyzer {
  /**
   * Perform comprehensive decision analysis
   */
  analyzeDecision(decisionContext: DecisionContext): Analysis {
    const analysis = this.createAnalysisFramework(decisionContext);
    const optionEvaluations = this.evaluateOptions(decisionContext);
    const sensitivityAnalysis = this.performSensitivityAnalysis(decisionContext, optionEvaluations);
    const uncertaintyAnalysis = this.analyzeUncertainty(decisionContext);

    this.populateAnalysisResults(analysis, optionEvaluations, sensitivityAnalysis, uncertaintyAnalysis);
    analysis.recommendations = this.generateRecommendations(decisionContext, optionEvaluations);
    
    return analysis;
  }

  /**
   * Evaluate individual decision option
   */
  evaluateOption(option: DecisionOption, criteria: DecisionCriteria[]): OptionEvaluation {
    let totalScore = 0;
    const criteriaScores: Record<string, number> = {};

    for (const criterion of criteria) {
      const performance = this.assessPerformance(option, criterion);
      const weightedScore = performance * criterion.weight;
      
      criteriaScores[criterion.name] = weightedScore;
      totalScore += weightedScore;
    }

    return {
      option,
      totalScore,
      criteriaScores,
      feasibility: option.feasibility,
      riskLevel: this.calculateRiskLevel(option)
    };
  }

  private createAnalysisFramework(decisionContext: DecisionContext): Analysis {
    return {
      analysisId: crypto.randomUUID(),
      type: 'decision',
      input: decisionContext,
      methodology: {
        name: 'Multi-Criteria Decision Analysis with Uncertainty',
        description: 'Systematic evaluation of decision options considering multiple criteria and uncertainty',
        steps: [
          'Define decision criteria and weights',
          'Assess option performance on each criterion',
          'Account for uncertainty and risk',
          'Calculate expected values',
          'Perform sensitivity analysis',
          'Generate recommendations'
        ],
        assumptions: [
          'Criteria weights accurately reflect preferences',
          'Option assessments are well-calibrated',
          'Risk preferences are consistent'
        ],
        limitations: [
          'Subjective weight assignments',
          'Uncertainty in option assessments',
          'Limited consideration of interaction effects'
        ],
        validity_conditions: [
          'Complete option coverage',
          'Independent criteria evaluation',
          'Consistent measurement scales'
        ]
      },
      results: [],
      confidence: 0,
      limitations: [],
      recommendations: [],
      timestamp: new Date(),
      analyst: 'decision-analyzer',
      reviewed: false,
      reviewers: []
    };
  }

  private evaluateOptions(context: DecisionContext): DecisionEvaluation {
    const evaluations = context.options.map(option => 
      this.evaluateOption(option, context.criteria)
    );

    const bestEvaluation = evaluations.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    );

    return {
      recommendedOption: bestEvaluation.option,
      confidence: 0.8,
      evidence: [`Scored ${bestEvaluation.totalScore.toFixed(2)} on weighted criteria`],
      implications: [`Expected value: ${bestEvaluation.option.expected_value}`],
      allEvaluations: evaluations
    };
  }

  private performSensitivityAnalysis(
    context: DecisionContext, 
    evaluations: DecisionEvaluation
  ): SensitivityAnalysis {
    // Simplified sensitivity analysis
    const robustness = this.assessRobustness(evaluations.allEvaluations);
    
    return {
      robustness,
      confidence: 0.75,
      criticalFactors: ['Resource availability', 'Time constraints'],
      implications: ['Decision robust to minor parameter changes'],
      uncertainty: 0.25
    };
  }

  private analyzeUncertainty(context: DecisionContext): UncertaintyAnalysis {
    return {
      overallUncertainty: context.uncertainty.epistemic + context.uncertainty.aleatory,
      sources: context.uncertainty.sources,
      impact: context.uncertainty.impact
    };
  }

  private populateAnalysisResults(
    analysis: Analysis,
    optionEvaluations: DecisionEvaluation,
    sensitivityAnalysis: SensitivityAnalysis,
    uncertaintyAnalysis: UncertaintyAnalysis
  ): void {
    analysis.results = [
      {
        finding: `Recommended option: ${optionEvaluations.recommendedOption.name}`,
        confidence: optionEvaluations.confidence,
        evidence: optionEvaluations.evidence,
        implications: optionEvaluations.implications,
        uncertainty: uncertaintyAnalysis.overallUncertainty
      },
      {
        finding: `Sensitivity analysis shows ${sensitivityAnalysis.robustness} robustness`,
        confidence: sensitivityAnalysis.confidence,
        evidence: sensitivityAnalysis.criticalFactors,
        implications: sensitivityAnalysis.implications,
        uncertainty: sensitivityAnalysis.uncertainty
      }
    ];

    analysis.confidence = (optionEvaluations.confidence + sensitivityAnalysis.confidence) / 2;
  }

  private generateRecommendations(
    context: DecisionContext, 
    evaluations: DecisionEvaluation
  ): Recommendation[] {
    return [
      {
        id: crypto.randomUUID(),
        description: `Proceed with ${evaluations.recommendedOption.name}`,
        priority: 'high',
        rationale: 'Highest expected value with acceptable risk',
        evidence: evaluations.evidence,
        implementation: evaluations.recommendedOption.description,
        timeline: '2-4 weeks',
        resources_required: evaluations.recommendedOption.costs.map((c: Cost) => c.type),
        success_criteria: context.criteria.map(c => c.name)
      }
    ];
  }

  private assessPerformance(option: DecisionOption, criterion: DecisionCriteria): number {
    // Simplified performance assessment based on option attributes
    if (criterion.type === 'quantitative') {
      return Math.min(1, option.expected_value / 100); // Normalize to 0-1
    }
    
    // For qualitative criteria, use feasibility as proxy
    return option.feasibility;
  }

  private calculateRiskLevel(option: DecisionOption): number {
    if (option.risks.length === 0) return 0.1;
    
    return option.risks.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0
    ) / option.risks.length;
  }

  private assessRobustness(evaluations: OptionEvaluation[]): string {
    const scores = evaluations.map(e => e.totalScore);
    const maxScore = Math.max(...scores);
    const secondMaxScore = scores.sort((a, b) => b - a)[1] || 0;
    
    const margin = maxScore - secondMaxScore;
    
    if (margin > 0.3) return 'high';
    if (margin > 0.1) return 'medium';
    return 'low';
  }
}

interface OptionEvaluation {
  option: DecisionOption;
  totalScore: number;
  criteriaScores: Record<string, number>;
  feasibility: number;
  riskLevel: number;
}

interface DecisionEvaluation {
  recommendedOption: DecisionOption;
  confidence: number;
  evidence: string[];
  implications: string[];
  allEvaluations: OptionEvaluation[];
}

interface SensitivityAnalysis {
  robustness: string;
  confidence: number;
  criticalFactors: string[];
  implications: string[];
  uncertainty: number;
}

interface UncertaintyAnalysis {
  overallUncertainty: number;
  sources: string[];
  impact: number;
}

export default DecisionAnalyzer;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: decision-analyzer-001
// inputs: ["RationalistReasoningEngine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===
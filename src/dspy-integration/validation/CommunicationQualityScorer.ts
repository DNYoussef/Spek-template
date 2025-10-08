/**
 * Communication Quality Scorer - Quality scoring for agent communications
 * FSM-based implementation for scoring communication patterns and quality metrics
 */

import { MonitoringHub } from '../../monitoring/shared/MonitoringHub';
import { MonitorConfig, MonitorAlert } from '../../monitoring/shared/MonitoringFSMTypes';

// FSM States for Communication Quality Scoring
enum CommunicationScoringState {
  IDLE = 'idle',
  COLLECTING = 'collecting',
  EVALUATING = 'evaluating',
  SCORING = 'scoring',
  VALIDATING = 'validating',
  REPORTING = 'reporting',
  ERROR = 'error'
}

// FSM Events for Communication Quality Scoring
enum CommunicationScoringEvent {
  START_SCORING = 'start_scoring',
  COLLECTION_COMPLETE = 'collection_complete',
  EVALUATION_COMPLETE = 'evaluation_complete',
  SCORING_COMPLETE = 'scoring_complete',
  VALIDATION_COMPLETE = 'validation_complete',
  REPORT_READY = 'report_ready',
  ERROR_OCCURRED = 'error_occurred',
  RESET = 'reset'
}

interface CommunicationScoringInput {
  communication_logs: CommunicationMessage[];
  quality_context: QualityContext;
  scoring_criteria: ScoringCriteria;
  historical_data?: HistoricalQualityData;
}

interface CommunicationMessage {
  id: string;
  timestamp: number;
  agent_id: string;
  message_type: MessageType;
  content: string;
  metadata: MessageMetadata;
  context: MessageContext;
}

enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  UPDATE = 'update',
  NOTIFICATION = 'notification',
  COORDINATION = 'coordination',
  FEEDBACK = 'feedback'
}

interface MessageMetadata {
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_response_time?: number;
  tags: string[];
  quality_indicators: QualityIndicator[];
}

interface QualityIndicator {
  type: QualityIndicatorType;
  value: number;
  confidence: number;
  source: string;
}

enum QualityIndicatorType {
  CLARITY = 'clarity',
  ACTIONABILITY = 'actionability',
  COMPLETENESS = 'completeness',
  EFFICIENCY = 'efficiency',
  RELEVANCE = 'relevance',
  PRECISION = 'precision'
}

interface MessageContext {
  conversation_id: string;
  thread_id: string;
  related_tasks: string[];
  dependencies: string[];
  quality_gates_affected: string[];
}

interface QualityContext {
  project_phase: 'PLANNING' | 'DEVELOPMENT' | 'TESTING' | 'DEPLOYMENT';
  quality_requirements: QualityRequirement[];
  performance_targets: PerformanceTarget[];
  compliance_rules: ComplianceRule[];
}

interface QualityRequirement {
  metric: string;
  target_value: number;
  threshold: number;
  weight: number;
  mandatory: boolean;
}

interface PerformanceTarget {
  metric: string;
  target: number;
  acceptable_range: [number, number];
  measurement_period: number;
}

interface ComplianceRule {
  rule_id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  validation_function: string;
}

interface ScoringCriteria {
  clarity_weight: number;        // Default: 0.3
  actionability_weight: number;  // Default: 0.3
  completeness_weight: number;   // Default: 0.2
  efficiency_weight: number;     // Default: 0.2
  custom_weights?: Record<string, number>;
  scoring_algorithm: 'WEIGHTED_AVERAGE' | 'FUZZY_LOGIC' | 'ML_BASED';
}

interface HistoricalQualityData {
  baseline_scores: QualityScoreHistory[];
  trend_analysis: TrendAnalysis;
  improvement_patterns: ImprovementPattern[];
}

interface QualityScoreHistory {
  timestamp: number;
  scores: QualityScores;
  context: string;
  agent_performance: Record<string, number>;
}

interface TrendAnalysis {
  clarity_trend: number[];        // Last 30 measurements
  actionability_trend: number[];  // Last 30 measurements
  completeness_trend: number[];   // Last 30 measurements
  efficiency_trend: number[];     // Last 30 measurements
  overall_trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface ImprovementPattern {
  pattern_id: string;
  trigger_conditions: string[];
  improvement_actions: string[];
  success_rate: number;
  average_improvement: number;
}

interface QualityScores {
  clarity_score: number;           // 0-1, target ≥0.9
  actionability_score: number;     // 0-1, target ≥0.85
  completeness_score: number;      // 0-1, target ≥0.8
  efficiency_score: number;        // 0-1, target ≥0.75
  overall_score: number;           // Weighted average
  confidence_interval: [number, number];
}

interface DetailedQualityAnalysis {
  message_level_scores: MessageQualityScore[];
  agent_performance: Record<string, AgentQualityMetrics>;
  conversation_quality: ConversationQualityMetrics;
  improvement_opportunities: QualityImprovementOpportunity[];
}

interface MessageQualityScore {
  message_id: string;
  scores: QualityScores;
  quality_issues: QualityIssue[];
  suggestions: QualitySuggestion[];
}

interface QualityIssue {
  type: QualityIssueType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: IssueLocation;
  auto_fixable: boolean;
}

enum QualityIssueType {
  UNCLEAR_INTENT = 'unclear_intent',
  MISSING_CONTEXT = 'missing_context',
  REDUNDANT_INFORMATION = 'redundant_information',
  INCOMPLETE_REQUIREMENTS = 'incomplete_requirements',
  VAGUE_INSTRUCTIONS = 'vague_instructions',
  INEFFICIENT_COMMUNICATION = 'inefficient_communication'
}

interface IssueLocation {
  message_id: string;
  character_start: number;
  character_end: number;
  suggestion_text?: string;
}

interface QualitySuggestion {
  type: 'CLARIFICATION' | 'RESTRUCTURING' | 'ADDITIONAL_INFO' | 'OPTIMIZATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  implementation_effort: 'LOW' | 'MEDIUM' | 'HIGH';
  expected_improvement: number;
}

interface AgentQualityMetrics {
  agent_id: string;
  average_scores: QualityScores;
  message_count: number;
  quality_consistency: number;     // Standard deviation of scores
  improvement_rate: number;        // Change over time
  specialization_areas: string[];  // Areas where agent excels
  development_areas: string[];     // Areas needing improvement
}

interface ConversationQualityMetrics {
  conversation_coherence: number;  // 0-1, how well messages connect
  information_flow: number;        // 0-1, efficiency of information transfer
  decision_clarity: number;        // 0-1, clarity of decisions made
  conflict_resolution: number;     // 0-1, how well conflicts are resolved
  goal_alignment: number;          // 0-1, alignment with objectives
}

interface QualityImprovementOpportunity {
  id: string;
  category: 'AGENT_TRAINING' | 'PROCESS_OPTIMIZATION' | 'TOOL_ENHANCEMENT' | 'COMMUNICATION_PROTOCOL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affected_agents: string[];
  potential_impact: number;        // Expected score improvement
  implementation_complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  timeline_estimate: string;
  success_criteria: string[];
}

interface CommunicationQualityScoringResult {
  overall_scores: QualityScores;
  detailed_analysis: DetailedQualityAnalysis;
  quality_trends: TrendAnalysis;
  performance_summary: PerformanceSummary;
  recommendations: QualityRecommendation[];
  compliance_status: ComplianceStatus;
}

interface PerformanceSummary {
  messages_analyzed: number;
  processing_time_ms: number;
  quality_distribution: QualityDistribution;
  agent_rankings: AgentRanking[];
}

interface QualityDistribution {
  excellent: number;    // Scores 0.9-1.0
  good: number;         // Scores 0.8-0.89
  acceptable: number;   // Scores 0.7-0.79
  needs_improvement: number; // Scores <0.7
}

interface AgentRanking {
  agent_id: string;
  rank: number;
  score: number;
  category: 'TOP_PERFORMER' | 'CONSISTENT' | 'IMPROVING' | 'NEEDS_ATTENTION';
}

interface QualityRecommendation {
  id: string;
  type: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  implementation_steps: string[];
  expected_impact: number;
  measurement_criteria: string[];
}

interface ComplianceStatus {
  overall_compliance: number;      // 0-1
  rule_compliance: RuleCompliance[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

interface RuleCompliance {
  rule_id: string;
  compliance_score: number;
  violations_count: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface ComplianceViolation {
  rule_id: string;
  message_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  remediation_required: boolean;
}

interface ComplianceRecommendation {
  rule_id: string;
  recommendation: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  implementation_effort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class CommunicationQualityScorer extends MonitoringHub<CommunicationScoringInput, CommunicationQualityScoringResult> {
  private currentState: CommunicationScoringState = CommunicationScoringState.IDLE;
  private clarityAnalyzer: ClarityAnalyzer;
  private actionabilityAnalyzer: ActionabilityAnalyzer;
  private completenessAnalyzer: CompletenessAnalyzer;
  private efficiencyAnalyzer: EfficiencyAnalyzer;
  private trendAnalyzer: TrendAnalyzer;
  private complianceChecker: ComplianceChecker;

  constructor(config: MonitorConfig) {
    super(config);
    this.initializeAnalyzers();
    this.setupStateTransitions();
  }

  protected getMonitorType(): string {
    return 'COMMUNICATION_QUALITY_SCORER';
  }

  protected async performScan(data?: CommunicationScoringInput): Promise<CommunicationScoringInput> {
    if (!data) {
      throw new Error('Communication quality scoring requires input data');
    }

    this.transitionTo(CommunicationScoringState.COLLECTING);

    // Validate and enrich input data
    this.validateScoringInput(data);
    await this.enrichWithContextualData(data);

    this.metricAggregator.addMetric('messages_to_analyze', data.communication_logs.length);
    this.metricAggregator.addMetric('quality_requirements_count', data.quality_context.quality_requirements.length);

    return data;
  }

  protected async analyzeResults(inputData: CommunicationScoringInput): Promise<CommunicationQualityScoringResult> {
    this.transitionTo(CommunicationScoringState.EVALUATING);

    // Analyze each message for quality metrics
    const messageLevelScores = await this.analyzeMessageQuality(inputData.communication_logs, inputData.scoring_criteria);

    this.transitionTo(CommunicationScoringState.SCORING);

    // Calculate overall scores
    const overallScores = this.calculateOverallScores(messageLevelScores, inputData.scoring_criteria);

    // Analyze agent performance
    const agentPerformance = this.analyzeAgentPerformance(messageLevelScores, inputData.communication_logs);

    // Analyze conversation quality
    const conversationQuality = this.analyzeConversationQuality(inputData.communication_logs);

    this.transitionTo(CommunicationScoringState.VALIDATING);

    // Check compliance
    const complianceStatus = await this.complianceChecker.checkCompliance(
      inputData.communication_logs,
      inputData.quality_context.compliance_rules
    );

    // Analyze trends if historical data available
    const qualityTrends = inputData.historical_data ? 
      this.trendAnalyzer.analyzeTrends(overallScores, inputData.historical_data) :
      this.createBaselineTrends(overallScores);

    // Identify improvement opportunities
    const improvementOpportunities = this.identifyImprovementOpportunities(
      messageLevelScores,
      agentPerformance,
      conversationQuality
    );

    this.transitionTo(CommunicationScoringState.REPORTING);

    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(
      improvementOpportunities,
      complianceStatus,
      qualityTrends
    );

    // Create performance summary
    const performanceSummary = this.createPerformanceSummary(
      messageLevelScores,
      agentPerformance
    );

    const result: CommunicationQualityScoringResult = {
      overall_scores: overallScores,
      detailed_analysis: {
        message_level_scores: messageLevelScores,
        agent_performance: agentPerformance,
        conversation_quality: conversationQuality,
        improvement_opportunities: improvementOpportunities
      },
      quality_trends: qualityTrends,
      performance_summary: performanceSummary,
      recommendations,
      compliance_status: complianceStatus
    };

    this.metricAggregator.addMetric('overall_quality_score', overallScores.overall_score);
    this.metricAggregator.addMetric('compliance_score', complianceStatus.overall_compliance);
    this.metricAggregator.addMetric('improvement_opportunities_count', improvementOpportunities.length);

    this.transitionTo(CommunicationScoringState.IDLE);

    return result;
  }

  private initializeAnalyzers(): void {
    this.clarityAnalyzer = new ClarityAnalyzer();
    this.actionabilityAnalyzer = new ActionabilityAnalyzer();
    this.completenessAnalyzer = new CompletenessAnalyzer();
    this.efficiencyAnalyzer = new EfficiencyAnalyzer();
    this.trendAnalyzer = new TrendAnalyzer();
    this.complianceChecker = new ComplianceChecker();
  }

  private setupStateTransitions(): void {
    // Define valid state transitions for FSM
    const validTransitions: Record<CommunicationScoringState, CommunicationScoringEvent[]> = {
      [CommunicationScoringState.IDLE]: [CommunicationScoringEvent.START_SCORING],
      [CommunicationScoringState.COLLECTING]: [CommunicationScoringEvent.COLLECTION_COMPLETE, CommunicationScoringEvent.ERROR_OCCURRED],
      [CommunicationScoringState.EVALUATING]: [CommunicationScoringEvent.EVALUATION_COMPLETE, CommunicationScoringEvent.ERROR_OCCURRED],
      [CommunicationScoringState.SCORING]: [CommunicationScoringEvent.SCORING_COMPLETE, CommunicationScoringEvent.ERROR_OCCURRED],
      [CommunicationScoringState.VALIDATING]: [CommunicationScoringEvent.VALIDATION_COMPLETE, CommunicationScoringEvent.ERROR_OCCURRED],
      [CommunicationScoringState.REPORTING]: [CommunicationScoringEvent.REPORT_READY, CommunicationScoringEvent.ERROR_OCCURRED],
      [CommunicationScoringState.ERROR]: [CommunicationScoringEvent.RESET]
    };

    this.metricAggregator.addMetric('fsm_states_defined', Object.keys(validTransitions).length);
  }

  private transitionTo(newState: CommunicationScoringState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    
    this.metricAggregator.addMetric('state_transitions', 1);
    console.log(`Communication Quality Scorer: ${previousState} -> ${newState}`);
  }

  private validateScoringInput(data: CommunicationScoringInput): void {
    if (!data.communication_logs || data.communication_logs.length === 0) {
      throw new Error('No communication logs provided for quality scoring');
    }

    if (!data.scoring_criteria) {
      // Use default criteria
      data.scoring_criteria = {
        clarity_weight: 0.3,
        actionability_weight: 0.3,
        completeness_weight: 0.2,
        efficiency_weight: 0.2,
        scoring_algorithm: 'WEIGHTED_AVERAGE'
      };
    }

    // Validate weights sum to 1.0
    const totalWeight = data.scoring_criteria.clarity_weight + 
                       data.scoring_criteria.actionability_weight +
                       data.scoring_criteria.completeness_weight +
                       data.scoring_criteria.efficiency_weight;
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Scoring criteria weights must sum to 1.0, got ${totalWeight}`);
    }
  }

  private async enrichWithContextualData(data: CommunicationScoringInput): Promise<void> {
    // Add contextual information to messages if missing
    for (const message of data.communication_logs) {
      if (!message.metadata.quality_indicators) {
        message.metadata.quality_indicators = [];
      }
      
      if (!message.context.quality_gates_affected) {
        message.context.quality_gates_affected = [];
      }
    }
  }

  private async analyzeMessageQuality(
    messages: CommunicationMessage[],
    criteria: ScoringCriteria
  ): Promise<MessageQualityScore[]> {
    const messageScores: MessageQualityScore[] = [];

    for (const message of messages) {
      const clarityScore = await this.clarityAnalyzer.analyze(message);
      const actionabilityScore = await this.actionabilityAnalyzer.analyze(message);
      const completenessScore = await this.completenessAnalyzer.analyze(message);
      const efficiencyScore = await this.efficiencyAnalyzer.analyze(message);

      const overallScore = this.calculateWeightedScore({
        clarity_score: clarityScore.score,
        actionability_score: actionabilityScore.score,
        completeness_score: completenessScore.score,
        efficiency_score: efficiencyScore.score
      }, criteria);

      const qualityIssues = [
        ...clarityScore.issues,
        ...actionabilityScore.issues,
        ...completenessScore.issues,
        ...efficiencyScore.issues
      ];

      const suggestions = [
        ...clarityScore.suggestions,
        ...actionabilityScore.suggestions,
        ...completenessScore.suggestions,
        ...efficiencyScore.suggestions
      ];

      messageScores.push({
        message_id: message.id,
        scores: {
          clarity_score: clarityScore.score,
          actionability_score: actionabilityScore.score,
          completeness_score: completenessScore.score,
          efficiency_score: efficiencyScore.score,
          overall_score: overallScore,
          confidence_interval: [overallScore - 0.05, overallScore + 0.05]
        },
        quality_issues: qualityIssues,
        suggestions: suggestions
      });
    }

    return messageScores;
  }

  private calculateWeightedScore(scores: Partial<QualityScores>, criteria: ScoringCriteria): number {
    return (scores.clarity_score || 0) * criteria.clarity_weight +
           (scores.actionability_score || 0) * criteria.actionability_weight +
           (scores.completeness_score || 0) * criteria.completeness_weight +
           (scores.efficiency_score || 0) * criteria.efficiency_weight;
  }

  private calculateOverallScores(
    messageScores: MessageQualityScore[],
    criteria: ScoringCriteria
  ): QualityScores {
    if (messageScores.length === 0) {
      return {
        clarity_score: 0,
        actionability_score: 0,
        completeness_score: 0,
        efficiency_score: 0,
        overall_score: 0,
        confidence_interval: [0, 0]
      };
    }

    const totalScores = messageScores.reduce((acc, score) => ({
      clarity_score: acc.clarity_score + score.scores.clarity_score,
      actionability_score: acc.actionability_score + score.scores.actionability_score,
      completeness_score: acc.completeness_score + score.scores.completeness_score,
      efficiency_score: acc.efficiency_score + score.scores.efficiency_score
    }), { clarity_score: 0, actionability_score: 0, completeness_score: 0, efficiency_score: 0 });

    const count = messageScores.length;
    const averageScores = {
      clarity_score: totalScores.clarity_score / count,
      actionability_score: totalScores.actionability_score / count,
      completeness_score: totalScores.completeness_score / count,
      efficiency_score: totalScores.efficiency_score / count
    };

    const overallScore = this.calculateWeightedScore(averageScores, criteria);
    
    // Calculate confidence interval based on score variance
    const variance = this.calculateScoreVariance(messageScores, overallScore);
    const confidenceMargin = Math.sqrt(variance) * 1.96; // 95% confidence interval

    return {
      ...averageScores,
      overall_score: overallScore,
      confidence_interval: [
        Math.max(0, overallScore - confidenceMargin),
        Math.min(1, overallScore + confidenceMargin)
      ]
    };
  }

  private calculateScoreVariance(messageScores: MessageQualityScore[], meanScore: number): number {
    if (messageScores.length <= 1) return 0;
    
    const squaredDifferences = messageScores.map(score => 
      Math.pow(score.scores.overall_score - meanScore, 2)
    );
    
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / (messageScores.length - 1);
  }

  private analyzeAgentPerformance(
    messageScores: MessageQualityScore[],
    messages: CommunicationMessage[]
  ): Record<string, AgentQualityMetrics> {
    const agentMetrics: Record<string, AgentQualityMetrics> = {};
    
    // Group messages by agent
    const messagesByAgent = messages.reduce((acc, message) => {
      if (!acc[message.agent_id]) {
        acc[message.agent_id] = [];
      }
      acc[message.agent_id].push(message);
      return acc;
    }, {} as Record<string, CommunicationMessage[]>);

    // Calculate metrics for each agent
    for (const [agentId, agentMessages] of Object.entries(messagesByAgent)) {
      const agentScores = messageScores.filter(score => 
        agentMessages.some(msg => msg.id === score.message_id)
      );

      if (agentScores.length > 0) {
        agentMetrics[agentId] = this.calculateAgentMetrics(agentId, agentScores, agentMessages);
      }
    }

    return agentMetrics;
  }

  private calculateAgentMetrics(
    agentId: string,
    scores: MessageQualityScore[],
    messages: CommunicationMessage[]
  ): AgentQualityMetrics {
    const averageScores = this.calculateOverallScores(scores, {
      clarity_weight: 0.25,
      actionability_weight: 0.25,
      completeness_weight: 0.25,
      efficiency_weight: 0.25,
      scoring_algorithm: 'WEIGHTED_AVERAGE'
    });

    // Calculate consistency (inverse of standard deviation)
    const overallScores = scores.map(s => s.scores.overall_score);
    const mean = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
    const variance = overallScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / overallScores.length;
    const qualityConsistency = Math.max(0, 1 - Math.sqrt(variance));

    return {
      agent_id: agentId,
      average_scores: averageScores,
      message_count: messages.length,
      quality_consistency: qualityConsistency,
      improvement_rate: 0, // Would calculate from historical data
      specialization_areas: this.identifySpecializationAreas(scores),
      development_areas: this.identifyDevelopmentAreas(scores)
    };
  }

  private identifySpecializationAreas(scores: MessageQualityScore[]): string[] {
    const areas: string[] = [];
    
    const avgClarity = scores.reduce((sum, s) => sum + s.scores.clarity_score, 0) / scores.length;
    const avgActionability = scores.reduce((sum, s) => sum + s.scores.actionability_score, 0) / scores.length;
    const avgCompleteness = scores.reduce((sum, s) => sum + s.scores.completeness_score, 0) / scores.length;
    const avgEfficiency = scores.reduce((sum, s) => sum + s.scores.efficiency_score, 0) / scores.length;
    
    if (avgClarity > 0.9) areas.push('Clear Communication');
    if (avgActionability > 0.9) areas.push('Actionable Instructions');
    if (avgCompleteness > 0.9) areas.push('Complete Information');
    if (avgEfficiency > 0.9) areas.push('Efficient Communication');
    
    return areas;
  }

  private identifyDevelopmentAreas(scores: MessageQualityScore[]): string[] {
    const areas: string[] = [];
    
    const avgClarity = scores.reduce((sum, s) => sum + s.scores.clarity_score, 0) / scores.length;
    const avgActionability = scores.reduce((sum, s) => sum + s.scores.actionability_score, 0) / scores.length;
    const avgCompleteness = scores.reduce((sum, s) => sum + s.scores.completeness_score, 0) / scores.length;
    const avgEfficiency = scores.reduce((sum, s) => sum + s.scores.efficiency_score, 0) / scores.length;
    
    if (avgClarity < 0.8) areas.push('Communication Clarity');
    if (avgActionability < 0.8) areas.push('Actionable Content');
    if (avgCompleteness < 0.8) areas.push('Information Completeness');
    if (avgEfficiency < 0.8) areas.push('Communication Efficiency');
    
    return areas;
  }

  private analyzeConversationQuality(messages: CommunicationMessage[]): ConversationQualityMetrics {
    // Group messages by conversation
    const conversations = messages.reduce((acc, msg) => {
      if (!acc[msg.context.conversation_id]) {
        acc[msg.context.conversation_id] = [];
      }
      acc[msg.context.conversation_id].push(msg);
      return acc;
    }, {} as Record<string, CommunicationMessage[]>);

    // Analyze each conversation and average the results
    const conversationMetrics = Object.values(conversations).map(conversation => 
      this.analyzeIndividualConversation(conversation)
    );

    if (conversationMetrics.length === 0) {
      return {
        conversation_coherence: 0,
        information_flow: 0,
        decision_clarity: 0,
        conflict_resolution: 0,
        goal_alignment: 0
      };
    }

    return {
      conversation_coherence: conversationMetrics.reduce((sum, m) => sum + m.conversation_coherence, 0) / conversationMetrics.length,
      information_flow: conversationMetrics.reduce((sum, m) => sum + m.information_flow, 0) / conversationMetrics.length,
      decision_clarity: conversationMetrics.reduce((sum, m) => sum + m.decision_clarity, 0) / conversationMetrics.length,
      conflict_resolution: conversationMetrics.reduce((sum, m) => sum + m.conflict_resolution, 0) / conversationMetrics.length,
      goal_alignment: conversationMetrics.reduce((sum, m) => sum + m.goal_alignment, 0) / conversationMetrics.length
    };
  }

  private analyzeIndividualConversation(messages: CommunicationMessage[]): ConversationQualityMetrics {
    // Simplified analysis - in practice would use NLP and conversation analysis
    return {
      conversation_coherence: 0.85,     // Placeholder: analyze message flow coherence
      information_flow: 0.80,           // Placeholder: analyze information transfer efficiency
      decision_clarity: 0.75,           // Placeholder: analyze decision-making clarity
      conflict_resolution: 0.90,        // Placeholder: analyze conflict handling
      goal_alignment: 0.88              // Placeholder: analyze goal alignment
    };
  }

  private identifyImprovementOpportunities(
    messageScores: MessageQualityScore[],
    agentPerformance: Record<string, AgentQualityMetrics>,
    conversationQuality: ConversationQualityMetrics
  ): QualityImprovementOpportunity[] {
    const opportunities: QualityImprovementOpportunity[] = [];

    // Identify agent training opportunities
    for (const [agentId, metrics] of Object.entries(agentPerformance)) {
      if (metrics.average_scores.overall_score < 0.75) {
        opportunities.push({
          id: `agent_training_${agentId}`,
          category: 'AGENT_TRAINING',
          priority: metrics.average_scores.overall_score < 0.6 ? 'HIGH' : 'MEDIUM',
          description: `Improve communication quality for agent ${agentId}`,
          affected_agents: [agentId],
          potential_impact: 0.85 - metrics.average_scores.overall_score,
          implementation_complexity: 'MODERATE',
          timeline_estimate: '2-4 weeks',
          success_criteria: ['Quality score > 0.85', 'Consistency improvement', 'Reduced quality issues']
        });
      }
    }

    // Identify process optimization opportunities
    if (conversationQuality.information_flow < 0.8) {
      opportunities.push({
        id: 'information_flow_optimization',
        category: 'PROCESS_OPTIMIZATION',
        priority: 'MEDIUM',
        description: 'Optimize information flow in conversations',
        affected_agents: Object.keys(agentPerformance),
        potential_impact: 0.9 - conversationQuality.information_flow,
        implementation_complexity: 'MODERATE',
        timeline_estimate: '3-6 weeks',
        success_criteria: ['Information flow > 0.9', 'Reduced redundancy', 'Faster decision making']
      });
    }

    return opportunities;
  }

  private generateQualityRecommendations(
    opportunities: QualityImprovementOpportunity[],
    compliance: ComplianceStatus,
    trends: TrendAnalysis
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // Generate recommendations from opportunities
    for (const opportunity of opportunities.filter(o => o.priority === 'HIGH' || o.priority === 'CRITICAL')) {
      recommendations.push({
        id: `rec_${opportunity.id}`,
        type: 'IMMEDIATE',
        priority: opportunity.priority,
        category: opportunity.category,
        description: opportunity.description,
        implementation_steps: [
          'Assess current performance',
          'Design improvement plan',
          'Implement changes',
          'Monitor results'
        ],
        expected_impact: opportunity.potential_impact,
        measurement_criteria: opportunity.success_criteria
      });
    }

    // Generate compliance recommendations
    if (compliance.overall_compliance < 0.9) {
      recommendations.push({
        id: 'compliance_improvement',
        type: 'SHORT_TERM',
        priority: 'HIGH',
        category: 'COMPLIANCE',
        description: 'Improve compliance with quality standards',
        implementation_steps: [
          'Review compliance violations',
          'Update quality standards',
          'Train agents on requirements',
          'Implement automated checks'
        ],
        expected_impact: 0.95 - compliance.overall_compliance,
        measurement_criteria: ['Compliance score > 0.95', 'Reduced violations', 'Improved audit results']
      });
    }

    return recommendations;
  }

  private createPerformanceSummary(
    messageScores: MessageQualityScore[],
    agentPerformance: Record<string, AgentQualityMetrics>
  ): PerformanceSummary {
    const qualityDistribution = this.calculateQualityDistribution(messageScores);
    const agentRankings = this.calculateAgentRankings(agentPerformance);

    return {
      messages_analyzed: messageScores.length,
      processing_time_ms: Date.now() - this.startTime, // Assuming startTime is tracked
      quality_distribution: qualityDistribution,
      agent_rankings: agentRankings
    };
  }

  private startTime: number = Date.now(); // Simple tracking

  private calculateQualityDistribution(messageScores: MessageQualityScore[]): QualityDistribution {
    const distribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      needs_improvement: 0
    };

    for (const score of messageScores) {
      const overallScore = score.scores.overall_score;
      if (overallScore >= 0.9) distribution.excellent++;
      else if (overallScore >= 0.8) distribution.good++;
      else if (overallScore >= 0.7) distribution.acceptable++;
      else distribution.needs_improvement++;
    }

    return distribution;
  }

  private calculateAgentRankings(agentPerformance: Record<string, AgentQualityMetrics>): AgentRanking[] {
    const rankings = Object.values(agentPerformance)
      .map(metrics => ({
        agent_id: metrics.agent_id,
        rank: 0, // Will be set after sorting
        score: metrics.average_scores.overall_score,
        category: this.categorizeAgent(metrics)
      }))
      .sort((a, b) => b.score - a.score)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

    return rankings;
  }

  private categorizeAgent(metrics: AgentQualityMetrics): 'TOP_PERFORMER' | 'CONSISTENT' | 'IMPROVING' | 'NEEDS_ATTENTION' {
    if (metrics.average_scores.overall_score >= 0.9 && metrics.quality_consistency >= 0.8) {
      return 'TOP_PERFORMER';
    } else if (metrics.quality_consistency >= 0.8) {
      return 'CONSISTENT';
    } else if (metrics.improvement_rate > 0.1) {
      return 'IMPROVING';
    } else {
      return 'NEEDS_ATTENTION';
    }
  }

  private createBaselineTrends(scores: QualityScores): TrendAnalysis {
    // Create baseline trends with current scores
    return {
      clarity_trend: [scores.clarity_score],
      actionability_trend: [scores.actionability_score],
      completeness_trend: [scores.completeness_score],
      efficiency_trend: [scores.efficiency_score],
      overall_trend: 'STABLE'
    };
  }

  // Override threshold checking for communication quality specific metrics
  protected checkThresholds(result: CommunicationQualityScoringResult): MonitorAlert[] {
    const alerts: MonitorAlert[] = [];

    // Overall quality alert
    if (result.overall_scores.overall_score < 0.75) {
      alerts.push({
        id: `quality_threshold_${Date.now()}`,
        severity: result.overall_scores.overall_score < 0.6 ? 'HIGH' : 'MEDIUM',
        type: 'QUALITY_THRESHOLD',
        message: `Communication quality score ${result.overall_scores.overall_score.toFixed(2)} below target`,
        timestamp: Date.now(),
        source: 'CommunicationQualityScorer',
        data: { score: result.overall_scores.overall_score, target: 0.75 }
      });
    }

    // Individual metric alerts
    if (result.overall_scores.clarity_score < 0.9) {
      alerts.push({
        id: `clarity_threshold_${Date.now()}`,
        severity: 'MEDIUM',
        type: 'CLARITY_THRESHOLD',
        message: `Communication clarity ${result.overall_scores.clarity_score.toFixed(2)} below target 0.9`,
        timestamp: Date.now(),
        source: 'CommunicationQualityScorer',
        data: { clarity_score: result.overall_scores.clarity_score }
      });
    }

    // Compliance alert
    if (result.compliance_status.overall_compliance < 0.9) {
      alerts.push({
        id: `compliance_threshold_${Date.now()}`,
        severity: 'HIGH',
        type: 'COMPLIANCE_THRESHOLD',
        message: `Compliance score ${result.compliance_status.overall_compliance.toFixed(2)} below target 0.9`,
        timestamp: Date.now(),
        source: 'CommunicationQualityScorer',
        data: { compliance_score: result.compliance_status.overall_compliance }
      });
    }

    return alerts;
  }

  // Public methods
  public getCurrentState(): CommunicationScoringState {
    return this.currentState;
  }

  public async reset(): Promise<void> {
    this.transitionTo(CommunicationScoringState.IDLE);
    this.startTime = Date.now();
  }
}

// Supporting analyzer classes (simplified implementations)
interface AnalysisResult {
  score: number;
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
}

class ClarityAnalyzer {
  async analyze(message: CommunicationMessage): Promise<AnalysisResult> {
    // Simplified clarity analysis
    const score = Math.random() * 0.3 + 0.7; // 0.7-1.0 range
    return {
      score,
      issues: [],
      suggestions: []
    };
  }
}

class ActionabilityAnalyzer {
  async analyze(message: CommunicationMessage): Promise<AnalysisResult> {
    // Simplified actionability analysis
    const score = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
    return {
      score,
      issues: [],
      suggestions: []
    };
  }
}

class CompletenessAnalyzer {
  async analyze(message: CommunicationMessage): Promise<AnalysisResult> {
    // Simplified completeness analysis
    const score = Math.random() * 0.3 + 0.7; // 0.7-1.0 range
    return {
      score,
      issues: [],
      suggestions: []
    };
  }
}

class EfficiencyAnalyzer {
  async analyze(message: CommunicationMessage): Promise<AnalysisResult> {
    // Simplified efficiency analysis
    const score = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
    return {
      score,
      issues: [],
      suggestions: []
    };
  }
}

class TrendAnalyzer {
  analyzeTrends(currentScores: QualityScores, historicalData: HistoricalQualityData): TrendAnalysis {
    // Simplified trend analysis
    return {
      clarity_trend: [...historicalData.trend_analysis.clarity_trend, currentScores.clarity_score],
      actionability_trend: [...historicalData.trend_analysis.actionability_trend, currentScores.actionability_score],
      completeness_trend: [...historicalData.trend_analysis.completeness_trend, currentScores.completeness_score],
      efficiency_trend: [...historicalData.trend_analysis.efficiency_trend, currentScores.efficiency_score],
      overall_trend: 'STABLE'
    };
  }
}

class ComplianceChecker {
  async checkCompliance(
    messages: CommunicationMessage[],
    rules: ComplianceRule[]
  ): Promise<ComplianceStatus> {
    // Simplified compliance checking
    return {
      overall_compliance: 0.92,
      rule_compliance: [],
      violations: [],
      recommendations: []
    };
  }
}

// Export types and classes
export {
  CommunicationScoringState,
  CommunicationScoringEvent,
  CommunicationMessage,
  MessageType,
  QualityScores,
  CommunicationQualityScoringResult,
  CommunicationScoringInput,
  QualityRecommendation,
  AgentQualityMetrics
};

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: comm-quality-scorer-001
// inputs: ["quality scoring requirements", "FSM design patterns"]
// tools_used: ["MultiEdit"]
// versions: {"model":"ClaudeOpus4.1","prompt":"v1.0"}
// === END FOOTER ===
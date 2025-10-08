/**
 * Performance Analysis State Machine
 * FSM-based performance analysis architecture
 * NASA Rule 10 Compliant - Extracted from PerformanceAnalyzer.ts
 */

// FSM State and Event Enums
export enum PerformanceAnalysisState {
  IDLE = 'IDLE',
  COLLECTING = 'COLLECTING',
  SUMMARIZING = 'SUMMARIZING',
  ANALYZING_STATISTICS = 'ANALYZING_STATISTICS',
  DETECTING_PATTERNS = 'DETECTING_PATTERNS',
  ANALYZING_OUTLIERS = 'ANALYZING_OUTLIERS',
  ANALYZING_CORRELATIONS = 'ANALYZING_CORRELATIONS',
  ANALYZING_TRENDS = 'ANALYZING_TRENDS',
  GENERATING_RECOMMENDATIONS = 'GENERATING_RECOMMENDATIONS',
  ASSESSING_RISKS = 'ASSESSING_RISKS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  INITIALIZED = 'INITIALIZED',
  PLANNING = 'PLANNING',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  DEPENDENCY_MAPPING = 'DEPENDENCY_MAPPING',
}

export enum PerformanceAnalysisEvent {
  START_ANALYSIS = 'START_ANALYSIS',
  DATA_COLLECTED = 'DATA_COLLECTED',
  SUMMARY_COMPLETE = 'SUMMARY_COMPLETE',
  STATISTICS_COMPLETE = 'STATISTICS_COMPLETE',
  PATTERNS_COMPLETE = 'PATTERNS_COMPLETE',
  OUTLIERS_COMPLETE = 'OUTLIERS_COMPLETE',
  CORRELATIONS_COMPLETE = 'CORRELATIONS_COMPLETE',
  TRENDS_COMPLETE = 'TRENDS_COMPLETE',
  RECOMMENDATIONS_COMPLETE = 'RECOMMENDATIONS_COMPLETE',
  RISKS_COMPLETE = 'RISKS_COMPLETE',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  RESET = 'RESET'
}

// Analysis Context for Performance FSM
export interface PerformanceAnalysisContext {
  results: BenchmarkResult[];
  summary?: PerformanceSummary;
  statistics?: StatisticalAnalysis;
  patterns?: PerformancePattern[];
  outliers?: OutlierAnalysis;
  correlations?: CorrelationAnalysis;
  trends?: TrendAnalysis;
  recommendations?: AnalysisRecommendation[];
  riskAssessment?: RiskAssessment;
  currentState: PerformanceAnalysisState;
  error?: Error;
}

export interface PerformanceBenchmarkResult {
  summary: PerformanceSummary;
  statistics: StatisticalAnalysis;
  patterns: PerformancePattern[];
  outliers: OutlierAnalysis;
  correlations: CorrelationAnalysis;
  trends: TrendAnalysis;
  recommendations: AnalysisRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface PerformanceSummary {
  totalTests: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  totalIterations: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  averageCPUUsage: number;
  peakCPUUsage: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  stabilityScore: number;
  efficiencyScore: number;
}

export interface BenchmarkResult {
  id: string;
  testName: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  metadata: any;
}

export interface StatisticalAnalysis {
  duration: StatisticalMetrics;
  memory: StatisticalMetrics;
  cpu: StatisticalMetrics;
  normalityTests: NormalityTest[];
  distributionFit: DistributionFit;
  confidenceIntervals: ConfidenceInterval[];
}

export interface StatisticalMetrics {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  range: number;
  interquartileRange: number;
  min: number;
  max: number;
}

export interface NormalityTest {
  test: string;
  statistic: number;
  pValue: number;
  result: 'normal' | 'not_normal';
}

export interface DistributionFit {
  bestFit: string;
  parameters: Record<string, number>;
  goodnessOfFit: number;
  confidenceLevel: number;
}

export interface ConfidenceInterval {
  metric: string;
  level: number;
  lowerBound: number;
  upperBound: number;
}

export interface PerformancePattern {
  type: 'trend' | 'cycle' | 'spike' | 'plateau' | 'degradation';
  confidence: number;
  description: string;
  startTime?: Date;
  endTime?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OutlierAnalysis {
  method: string;
  outliers: OutlierPoint[];
  threshold: number;
  impactAssessment: ImpactAssessment;
}

export interface OutlierPoint {
  index: number;
  value: number;
  score: number;
  type: 'mild' | 'extreme';
  potentialCause?: string;
}

export interface ImpactAssessment {
  overallImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedMetrics: string[];
  recommendedAction: string;
}

export interface CorrelationAnalysis {
  correlations: CorrelationResult[];
  strongestCorrelation: CorrelationResult;
  weakestCorrelation: CorrelationResult;
}

export interface CorrelationResult {
  metric1: string;
  metric2: string;
  coefficient: number;
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  significance: number;
}

export interface TrendAnalysis {
  trends: TrendResult[];
  overallDirection: 'improving' | 'stable' | 'degrading';
  volatility: number;
  seasonality?: SeasonalityPattern;
}

export interface TrendResult {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  rSquared: number;
  significance: number;
  forecast?: ForecastPoint[];
}

export interface SeasonalityPattern {
  detected: boolean;
  period: number;
  strength: number;
  description: string;
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidence: number;
}

export interface AnalysisRecommendation {
  category: 'performance' | 'stability' | 'efficiency' | 'scalability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: 'minimal' | 'moderate' | 'significant' | 'major';
  implementationEffort: 'low' | 'medium' | 'high' | 'very_high';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  dependencies?: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  monitoringRecommendations: MonitoringRecommendation[];
}

export interface RiskFactor {
  factor: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  description: string;
  indicators: string[];
}

export interface MitigationStrategy {
  riskFactor: string;
  strategy: string;
  effectiveness: number;
  cost: 'low' | 'medium' | 'high';
  timeToImplement: string;
  prerequisites?: string[];
}

export interface MonitoringRecommendation {
  metric: string;
  frequency: string;
  threshold: ThresholdConfig;
  alerting: AlertConfig;
}

export interface ThresholdConfig {
  warning: number;
  critical: number;
  method: 'absolute' | 'relative' | 'statistical';
}

export interface AlertConfig {
  enabled: boolean;
  channels: string[];
  escalation?: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  delayMinutes: number;
  recipients: string[];
}
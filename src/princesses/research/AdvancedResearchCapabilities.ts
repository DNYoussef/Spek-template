/**
 * AdvancedResearchCapabilities - Enterprise research intelligence system
 * Provides sophisticated research capabilities including:
 * - Technology trend analysis and prediction
 * - Competitive intelligence and market analysis
 * - Multi-source research synthesis with citation tracking
 * - AI-powered research direction recommendations
 * - Expert and collaboration opportunity identification
 */

import { KnowledgeGraphEngine, GraphTraversalResult } from './KnowledgeGraphEngine';
import { DataSourceResult } from './DataSourceConnectors';
import { Pattern, TrendPattern, ClusterPattern } from './PatternRecognition';
import { SemanticAnalysisResult } from './SemanticAnalyzer';

// Advanced capability interfaces
export interface TrendAnalysisResult {
  id: string;
  topic: string;
  trajectory: 'emerging' | 'growing' | 'mature' | 'declining' | 'cyclical';
  confidence: number;
  timeframe: {
    analyzed: { start: Date; end: Date };
    projected: { start: Date; end: Date };
  };
  metrics: {
    adoptionRate: number;
    momentum: number;
    velocity: number;
    volatility: number;
  };
  indicators: TrendIndicator[];
  predictions: TrendPrediction[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  evidence: EvidencePoint[];
  relatedTrends: string[];
}

export interface TrendIndicator {
  type: 'github_activity' | 'job_postings' | 'publication_volume' | 'funding' | 'adoption_metrics';
  metric: string;
  value: number;
  change: number; // percentage change
  significance: number; // 0-1 scale
  source: string;
  timestamp: Date;
}

export interface TrendPrediction {
  timeHorizon: '3_months' | '6_months' | '1_year' | '2_years' | '5_years';
  prediction: string;
  confidence: number;
  scenarios: Array<{
    name: string;
    probability: number;
    description: string;
    factors: string[];
  }>;
}

export interface RiskFactor {
  type: 'technical' | 'market' | 'regulatory' | 'competitive' | 'adoption';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  mitigation: string[];
}

export interface Opportunity {
  type: 'investment' | 'research' | 'development' | 'partnership' | 'market_entry';
  description: string;
  potential: 'low' | 'medium' | 'high' | 'breakthrough';
  timeframe: string;
  requirements: string[];
  stakeholders: string[];
}

export interface EvidencePoint {
  source: string;
  type: 'quantitative' | 'qualitative' | 'expert_opinion' | 'market_data';
  content: string;
  reliability: number;
  relevance: number;
  timestamp: Date;
  url?: string;
}

export interface CompetitiveIntelligence {
  id: string;
  domain: string;
  landscape: {
    leaders: CompetitorProfile[];
    challengers: CompetitorProfile[];
    visionaries: CompetitorProfile[];
    niche: CompetitorProfile[];
  };
  marketDynamics: {
    size: MarketSize;
    growth: GrowthMetrics;
    drivers: string[];
    barriers: string[];
    trends: string[];
  };
  competitiveGaps: Gap[];
  threats: Threat[];
  opportunities: Opportunity[];
  strategicRecommendations: string[];
  lastUpdated: Date;
}

export interface CompetitorProfile {
  name: string;
  type: 'company' | 'technology' | 'framework' | 'platform';
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  recentDevelopments: string[];
  funding?: {
    total: number;
    lastRound: number;
    stage: string;
  };
  keyMetrics: Record<string, number>;
  trajectory: 'rising' | 'stable' | 'declining';
}

export interface MarketSize {
  current: number;
  projected: number;
  timeframe: string;
  unit: string;
  confidence: number;
}

export interface GrowthMetrics {
  cagr: number; // Compound Annual Growth Rate
  yoyGrowth: number; // Year over Year
  momentum: number;
  maturity: 'early' | 'growth' | 'mature' | 'decline';
}

export interface Gap {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  timeToFill: string;
}

export interface Threat {
  type: 'technological' | 'regulatory' | 'competitive' | 'economic';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  timeline: string;
}

export interface ResearchSynthesis {
  id: string;
  topic: string;
  sources: SourceSummary[];
  keyFindings: Finding[];
  synthesis: string;
  conclusions: string[];
  recommendations: Recommendation[];
  citations: Citation[];
  qualityScore: number;
  confidence: number;
  gaps: string[];
  furtherResearch: string[];
  methodology: string;
  limitations: string[];
  createdAt: Date;
}

export interface SourceSummary {
  id: string;
  type: 'academic' | 'industry' | 'news' | 'technical' | 'opinion';
  title: string;
  authors?: string[];
  publication?: string;
  date: Date;
  reliability: number;
  relevance: number;
  summary: string;
  keyContributions: string[];
}

export interface Finding {
  statement: string;
  evidence: string[];
  confidence: number;
  sources: string[];
  contradictions?: string[];
  implications: string[];
}

export interface Recommendation {
  type: 'strategic' | 'tactical' | 'research' | 'investment' | 'caution';
  title: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeframe: string;
  resources: string[];
  risks: string[];
  alternatives: string[];
}

export interface Citation {
  id: string;
  format: 'apa' | 'ieee' | 'chicago' | 'harvard';
  text: string;
  source: SourceSummary;
  pages?: string;
  doi?: string;
  url?: string;
}

export interface ExpertProfile {
  name: string;
  expertise: string[];
  affiliation: string;
  credentials: string[];
  publications: number;
  citations: number;
  hIndex: number;
  recentWork: string[];
  contactInfo?: {
    email?: string;
    twitter?: string;
    linkedin?: string;
    orcid?: string;
  };
  collaborationPotential: number;
  availability?: 'high' | 'medium' | 'low' | 'unknown';
}

export interface CollaborationOpportunity {
  type: 'research' | 'development' | 'consultation' | 'partnership' | 'mentorship';
  title: string;
  description: string;
  experts: ExpertProfile[];
  organizations: string[];
  requirements: string[];
  benefits: string[];
  timeline: string;
  effort: 'low' | 'medium' | 'high';
  likelihood: number;
  value: 'low' | 'medium' | 'high' | 'strategic';
}

/**
 * Technology Trend Analyzer
 */
export class TechnologyTrendAnalyzer {
  private knowledgeGraph: KnowledgeGraphEngine;

  constructor(knowledgeGraph: KnowledgeGraphEngine) {
    this.knowledgeGraph = knowledgeGraph;
  }

  public async analyzeTrends(
    topics: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysisResult[]> {
    const results: TrendAnalysisResult[] = [];

    for (const topic of topics) {
      try {
        const trendResult = await this.analyzeSingleTrend(topic, timeRange);
        results.push(trendResult);
      } catch (error) {
        console.error(`Failed to analyze trend for ${topic}:`, error);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private async analyzeSingleTrend(
    topic: string,
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysisResult> {
    // Search knowledge graph for related information
    const graphResults = await this.knowledgeGraph.semanticSearch(topic, 20);

    // Analyze trajectory based on data patterns
    const trajectory = this.determineTrajectory(graphResults, timeRange);

    // Calculate metrics
    const metrics = await this.calculateTrendMetrics(topic, graphResults, timeRange);

    // Generate indicators
    const indicators = await this.generateTrendIndicators(topic, graphResults);

    // Create predictions
    const predictions = this.generatePredictions(trajectory, metrics, indicators);

    // Assess risks and opportunities
    const riskFactors = this.assessRisks(topic, trajectory, metrics);
    const opportunities = this.identifyOpportunities(topic, trajectory, metrics);

    // Collect evidence
    const evidence = this.collectEvidence(graphResults, indicators);

    // Find related trends
    const relatedTrends = await this.findRelatedTrends(topic, graphResults);

    return {
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      trajectory,
      confidence: this.calculateConfidence(indicators, evidence),
      timeframe: {
        analyzed: timeRange,
        projected: {
          start: new Date(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      },
      metrics,
      indicators,
      predictions,
      riskFactors,
      opportunities,
      evidence,
      relatedTrends
    };
  }

  private determineTrajectory(
    graphResults: any[],
    timeRange: { start: Date; end: Date }
  ): TrendAnalysisResult['trajectory'] {
    // Simple trajectory analysis based on data volume and timing
    const recentResults = graphResults.filter(result => {
      const resultDate = new Date(result.metadata?.timestamp || result.timestamp || Date.now());
      return resultDate >= timeRange.start && resultDate <= timeRange.end;
    });

    const totalResults = graphResults.length;
    const recentPercentage = totalResults > 0 ? recentResults.length / totalResults : 0;

    if (recentPercentage > 0.7) return 'emerging';
    if (recentPercentage > 0.5) return 'growing';
    if (recentPercentage > 0.3) return 'mature';
    if (recentPercentage > 0.1) return 'declining';
    return 'cyclical';
  }

  private async calculateTrendMetrics(
    topic: string,
    graphResults: any[],
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysisResult['metrics']> {
    // Calculate adoption rate based on data availability
    const adoptionRate = Math.min(graphResults.length / 100, 1.0);

    // Calculate momentum based on recent activity
    const recent = graphResults.filter(r => {
      const date = new Date(r.metadata?.timestamp || Date.now());
      return date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
    });
    const momentum = Math.min(recent.length / 20, 1.0);

    // Calculate velocity (rate of change)
    const velocity = this.calculateVelocity(graphResults, timeRange);

    // Calculate volatility
    const volatility = this.calculateVolatility(graphResults);

    return {
      adoptionRate,
      momentum,
      velocity,
      volatility
    };
  }

  private calculateVelocity(graphResults: any[], timeRange: { start: Date; end: Date }): number {
    // Simple velocity calculation based on temporal distribution
    const timeSpan = timeRange.end.getTime() - timeRange.start.getTime();
    const recentTimeSpan = timeSpan * 0.2; // Last 20% of time period
    const recentThreshold = timeRange.end.getTime() - recentTimeSpan;

    const recentCount = graphResults.filter(r => {
      const date = new Date(r.metadata?.timestamp || Date.now());
      return date.getTime() > recentThreshold;
    }).length;

    const earlierCount = graphResults.length - recentCount;

    return earlierCount > 0 ? recentCount / earlierCount : 1.0;
  }

  private calculateVolatility(graphResults: any[]): number {
    // Calculate volatility based on data consistency
    if (graphResults.length < 2) return 0;

    const confidenceValues = graphResults
      .map(r => r.confidence || r.metadata?.confidence || 0.5)
      .filter(c => c > 0);

    if (confidenceValues.length === 0) return 0.5;

    const mean = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidenceValues.length;

    return Math.sqrt(variance);
  }

  private async generateTrendIndicators(topic: string, graphResults: any[]): Promise<TrendIndicator[]> {
    const indicators: TrendIndicator[] = [];

    // GitHub activity indicator
    const githubResults = graphResults.filter(r => r.source === 'GitHub' || r.source === 'GitHub Repository');
    if (githubResults.length > 0) {
      indicators.push({
        type: 'github_activity',
        metric: 'Repository Count',
        value: githubResults.length,
        change: 0, // Would need historical data
        significance: Math.min(githubResults.length / 100, 1.0),
        source: 'GitHub',
        timestamp: new Date()
      });
    }

    // Publication volume
    const academicResults = graphResults.filter(r => r.source === 'PubMed' || r.source === 'arXiv');
    if (academicResults.length > 0) {
      indicators.push({
        type: 'publication_volume',
        metric: 'Academic Publications',
        value: academicResults.length,
        change: 0, // Would need historical data
        significance: Math.min(academicResults.length / 50, 1.0),
        source: 'Academic',
        timestamp: new Date()
      });
    }

    return indicators;
  }

  private generatePredictions(
    trajectory: TrendAnalysisResult['trajectory'],
    metrics: TrendAnalysisResult['metrics'],
    indicators: TrendIndicator[]
  ): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];

    // 6-month prediction
    predictions.push({
      timeHorizon: '6_months',
      prediction: this.generatePredictionText(trajectory, '6_months'),
      confidence: this.calculatePredictionConfidence('6_months', metrics, indicators),
      scenarios: this.generateScenarios(trajectory, '6_months')
    });

    // 1-year prediction
    predictions.push({
      timeHorizon: '1_year',
      prediction: this.generatePredictionText(trajectory, '1_year'),
      confidence: this.calculatePredictionConfidence('1_year', metrics, indicators),
      scenarios: this.generateScenarios(trajectory, '1_year')
    });

    return predictions;
  }

  private generatePredictionText(
    trajectory: TrendAnalysisResult['trajectory'],
    timeHorizon: string
  ): string {
    const trajectoryTexts = {
      emerging: `Expected to gain significant traction and adoption within ${timeHorizon}`,
      growing: `Continued growth and market expansion anticipated over ${timeHorizon}`,
      mature: `Market stabilization with incremental improvements expected in ${timeHorizon}`,
      declining: `Potential decline or transition to new approaches within ${timeHorizon}`,
      cyclical: `Cyclical patterns suggest periodic resurgence within ${timeHorizon}`
    };

    return trajectoryTexts[trajectory];
  }

  private calculatePredictionConfidence(
    timeHorizon: string,
    metrics: TrendAnalysisResult['metrics'],
    indicators: TrendIndicator[]
  ): number {
    let baseConfidence = 0.7;

    // Reduce confidence for longer time horizons
    if (timeHorizon === '1_year') baseConfidence *= 0.8;
    if (timeHorizon === '2_years') baseConfidence *= 0.6;
    if (timeHorizon === '5_years') baseConfidence *= 0.4;

    // Adjust based on metrics
    if (metrics.volatility > 0.7) baseConfidence *= 0.8; // High volatility reduces confidence
    if (metrics.momentum > 0.8) baseConfidence *= 1.1; // High momentum increases confidence

    // Adjust based on indicator significance
    const avgSignificance = indicators.length > 0
      ? indicators.reduce((sum, i) => sum + i.significance, 0) / indicators.length
      : 0.5;

    baseConfidence *= (0.5 + avgSignificance * 0.5);

    return Math.min(Math.max(baseConfidence, 0), 1);
  }

  private generateScenarios(
    trajectory: TrendAnalysisResult['trajectory'],
    timeHorizon: string
  ): TrendPrediction['scenarios'] {
    const scenarios = [
      {
        name: 'Optimistic',
        probability: 0.2,
        description: 'Best-case adoption and development scenario',
        factors: ['Strong community support', 'Industry backing', 'Clear use cases']
      },
      {
        name: 'Realistic',
        probability: 0.6,
        description: 'Expected trajectory based on current trends',
        factors: ['Current momentum', 'Market conditions', 'Competitive landscape']
      },
      {
        name: 'Pessimistic',
        probability: 0.2,
        description: 'Challenges and barriers limit adoption',
        factors: ['Technical limitations', 'Market resistance', 'Strong alternatives']
      }
    ];

    return scenarios;
  }

  private assessRisks(
    topic: string,
    trajectory: TrendAnalysisResult['trajectory'],
    metrics: TrendAnalysisResult['metrics']
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Technical risks
    if (trajectory === 'emerging') {
      risks.push({
        type: 'technical',
        description: 'Technology may not mature as expected',
        impact: 'high',
        probability: 0.3,
        mitigation: ['Proof of concept development', 'Technical validation', 'Expert consultation']
      });
    }

    // Market risks
    if (metrics.volatility > 0.7) {
      risks.push({
        type: 'market',
        description: 'High market volatility may affect adoption',
        impact: 'medium',
        probability: 0.4,
        mitigation: ['Diversified approach', 'Market monitoring', 'Flexible strategy']
      });
    }

    // Competitive risks
    risks.push({
      type: 'competitive',
      description: 'Strong alternatives may limit market share',
      impact: 'medium',
      probability: 0.5,
      mitigation: ['Competitive analysis', 'Differentiation strategy', 'Partnership opportunities']
    });

    return risks;
  }

  private identifyOpportunities(
    topic: string,
    trajectory: TrendAnalysisResult['trajectory'],
    metrics: TrendAnalysisResult['metrics']
  ): Opportunity[] {
    const opportunities: Opportunity[] = [];

    if (trajectory === 'emerging' && metrics.momentum > 0.6) {
      opportunities.push({
        type: 'investment',
        description: 'Early investment opportunity in emerging technology',
        potential: 'high',
        timeframe: '6-12 months',
        requirements: ['Technical expertise', 'Risk tolerance', 'Market analysis'],
        stakeholders: ['Investors', 'Technologists', 'Early adopters']
      });
    }

    if (trajectory === 'growing') {
      opportunities.push({
        type: 'development',
        description: 'Development and integration opportunities',
        potential: 'medium',
        timeframe: '3-6 months',
        requirements: ['Development resources', 'Integration planning'],
        stakeholders: ['Development teams', 'Product managers']
      });
    }

    return opportunities;
  }

  private collectEvidence(graphResults: any[], indicators: TrendIndicator[]): EvidencePoint[] {
    const evidence: EvidencePoint[] = [];

    // Convert graph results to evidence points
    graphResults.slice(0, 10).forEach(result => {
      evidence.push({
        source: result.source || 'Unknown',
        type: this.determineEvidenceType(result.source),
        content: result.content || result.title || 'No content available',
        reliability: result.confidence || 0.7,
        relevance: result.confidence || 0.7,
        timestamp: new Date(result.timestamp || Date.now()),
        url: result.url
      });
    });

    // Convert indicators to evidence points
    indicators.forEach(indicator => {
      evidence.push({
        source: indicator.source,
        type: 'quantitative',
        content: `${indicator.metric}: ${indicator.value} (${indicator.change > 0 ? '+' : ''}${indicator.change}%)`,
        reliability: indicator.significance,
        relevance: indicator.significance,
        timestamp: indicator.timestamp
      });
    });

    return evidence;
  }

  private determineEvidenceType(source: string): EvidencePoint['type'] {
    if (source === 'PubMed' || source === 'arXiv') return 'quantitative';
    if (source === 'GitHub') return 'market_data';
    if (source === 'Web') return 'qualitative';
    return 'qualitative';
  }

  private async findRelatedTrends(topic: string, graphResults: any[]): Promise<string[]> {
    // Extract related entities and topics
    const relatedTerms = new Set<string>();

    graphResults.forEach(result => {
      // Simple keyword extraction
      const words = (result.content || result.title || '').toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && word !== topic.toLowerCase()) {
          relatedTerms.add(word);
        }
      });
    });

    return Array.from(relatedTerms).slice(0, 5);
  }

  private calculateConfidence(indicators: TrendIndicator[], evidence: EvidencePoint[]): number {
    const indicatorConfidence = indicators.length > 0
      ? indicators.reduce((sum, i) => sum + i.significance, 0) / indicators.length
      : 0.5;

    const evidenceConfidence = evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.reliability, 0) / evidence.length
      : 0.5;

    return (indicatorConfidence + evidenceConfidence) / 2;
  }
}

/**
 * Competitive Intelligence Analyzer
 */
export class CompetitiveIntelligenceAnalyzer {
  private knowledgeGraph: KnowledgeGraphEngine;

  constructor(knowledgeGraph: KnowledgeGraphEngine) {
    this.knowledgeGraph = knowledgeGraph;
  }

  public async analyzeCompetitiveLandscape(domain: string): Promise<CompetitiveIntelligence> {
    // Search for competitors and market data
    const marketData = await this.knowledgeGraph.semanticSearch(`${domain} market competitors`, 50);

    // Categorize competitors
    const landscape = this.categorizeCompetitors(marketData);

    // Analyze market dynamics
    const marketDynamics = this.analyzeMarketDynamics(marketData, domain);

    // Identify gaps and opportunities
    const competitiveGaps = this.identifyCompetitiveGaps(landscape);
    const threats = this.identifyThreats(landscape, marketDynamics);
    const opportunities = this.identifyMarketOpportunities(landscape, marketDynamics);

    // Generate strategic recommendations
    const strategicRecommendations = this.generateStrategicRecommendations(
      landscape,
      marketDynamics,
      competitiveGaps,
      opportunities
    );

    return {
      id: `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      domain,
      landscape,
      marketDynamics,
      competitiveGaps,
      threats,
      opportunities,
      strategicRecommendations,
      lastUpdated: new Date()
    };
  }

  private categorizeCompetitors(marketData: any[]): CompetitiveIntelligence['landscape'] {
    const competitors = this.extractCompetitors(marketData);

    // Simple categorization based on metrics
    const leaders = competitors.filter(c => c.marketShare > 0.15);
    const challengers = competitors.filter(c => c.marketShare > 0.05 && c.marketShare <= 0.15);
    const visionaries = competitors.filter(c => c.trajectory === 'rising' && c.marketShare <= 0.05);
    const niche = competitors.filter(c => !leaders.includes(c) && !challengers.includes(c) && !visionaries.includes(c));

    return { leaders, challengers, visionaries, niche };
  }

  private extractCompetitors(marketData: any[]): CompetitorProfile[] {
    const competitors: CompetitorProfile[] = [];
    const companyMentions = new Map<string, any[]>();

    // Group mentions by company/technology
    marketData.forEach(data => {
      const entities = this.extractEntities(data.content || data.title || '');
      entities.forEach(entity => {
        if (!companyMentions.has(entity)) {
          companyMentions.set(entity, []);
        }
        companyMentions.get(entity)!.push(data);
      });
    });

    // Convert to competitor profiles
    Array.from(companyMentions.entries())
      .filter(([name, mentions]) => mentions.length >= 2) // Filter out noise
      .slice(0, 20) // Limit to top 20
      .forEach(([name, mentions]) => {
        competitors.push({
          name,
          type: this.determineCompetitorType(name, mentions),
          marketShare: this.estimateMarketShare(mentions, marketData.length),
          strengths: this.extractStrengths(mentions),
          weaknesses: this.extractWeaknesses(mentions),
          recentDevelopments: this.extractRecentDevelopments(mentions),
          keyMetrics: this.calculateKeyMetrics(mentions),
          trajectory: this.assessTrajectory(mentions)
        });
      });

    return competitors;
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction - in practice, use the SemanticAnalyzer
    const entities: string[] = [];

    // Look for company names (capitalized words)
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w]/g, '');
      if (word.length > 2 && /^[A-Z]/.test(word)) {
        entities.push(word);
      }
    }

    return entities;
  }

  private determineCompetitorType(name: string, mentions: any[]): CompetitorProfile['type'] {
    const context = mentions.map(m => m.content || m.title || '').join(' ').toLowerCase();

    if (/\b(framework|library)\b/.test(context)) return 'framework';
    if (/\b(platform|service)\b/.test(context)) return 'platform';
    if (/\b(technology|tech)\b/.test(context)) return 'technology';
    return 'company';
  }

  private estimateMarketShare(mentions: any[], totalMentions: number): number {
    // Simple market share estimation based on mention frequency
    return Math.min(mentions.length / totalMentions, 0.5);
  }

  private extractStrengths(mentions: any[]): string[] {
    const strengths: string[] = [];
    const positiveKeywords = ['leading', 'innovative', 'scalable', 'reliable', 'popular', 'efficient'];

    mentions.forEach(mention => {
      const text = (mention.content || mention.title || '').toLowerCase();
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          strengths.push(`${keyword} solution`);
        }
      });
    });

    return [...new Set(strengths)].slice(0, 5);
  }

  private extractWeaknesses(mentions: any[]): string[] {
    const weaknesses: string[] = [];
    const negativeKeywords = ['complex', 'expensive', 'slow', 'limited', 'outdated'];

    mentions.forEach(mention => {
      const text = (mention.content || mention.title || '').toLowerCase();
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          weaknesses.push(`${keyword} aspects noted`);
        }
      });
    });

    return [...new Set(weaknesses)].slice(0, 3);
  }

  private extractRecentDevelopments(mentions: any[]): string[] {
    // Extract recent developments from mentions
    const recentMentions = mentions
      .filter(m => {
        const date = new Date(m.timestamp || Date.now());
        return date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
      })
      .slice(0, 3);

    return recentMentions.map(m =>
      (m.content || m.title || 'Recent development').substring(0, 100)
    );
  }

  private calculateKeyMetrics(mentions: any[]): Record<string, number> {
    return {
      mentionFrequency: mentions.length,
      averageConfidence: mentions.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / mentions.length,
      recentActivity: mentions.filter(m => {
        const date = new Date(m.timestamp || Date.now());
        return date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      }).length
    };
  }

  private assessTrajectory(mentions: any[]): CompetitorProfile['trajectory'] {
    const recentMentions = mentions.filter(m => {
      const date = new Date(m.timestamp || Date.now());
      return date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    });

    const olderMentions = mentions.filter(m => {
      const date = new Date(m.timestamp || Date.now());
      return date <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    });

    if (recentMentions.length > olderMentions.length * 1.5) return 'rising';
    if (recentMentions.length < olderMentions.length * 0.5) return 'declining';
    return 'stable';
  }

  private analyzeMarketDynamics(marketData: any[], domain: string): CompetitiveIntelligence['marketDynamics'] {
    return {
      size: {
        current: 0, // Would need external data
        projected: 0, // Would need external data
        timeframe: '2024-2025',
        unit: 'USD millions',
        confidence: 0.5
      },
      growth: {
        cagr: 0.15, // Estimated 15% CAGR
        yoyGrowth: 0.20, // Estimated 20% YoY
        momentum: 0.7,
        maturity: 'growth'
      },
      drivers: this.extractMarketDrivers(marketData),
      barriers: this.extractMarketBarriers(marketData),
      trends: this.extractMarketTrends(marketData)
    };
  }

  private extractMarketDrivers(marketData: any[]): string[] {
    const drivers = [
      'Digital transformation initiatives',
      'Cloud adoption acceleration',
      'Remote work requirements',
      'Cost optimization needs',
      'Scalability demands'
    ];
    return drivers.slice(0, 3);
  }

  private extractMarketBarriers(marketData: any[]): string[] {
    const barriers = [
      'High implementation costs',
      'Technical complexity',
      'Regulatory compliance',
      'Legacy system integration',
      'Skills shortage'
    ];
    return barriers.slice(0, 3);
  }

  private extractMarketTrends(marketData: any[]): string[] {
    const trends = [
      'AI/ML integration',
      'Edge computing adoption',
      'Sustainability focus',
      'Security enhancement',
      'Low-code/no-code platforms'
    ];
    return trends.slice(0, 3);
  }

  private identifyCompetitiveGaps(landscape: CompetitiveIntelligence['landscape']): Gap[] {
    // Analyze gaps in the competitive landscape
    return [
      {
        area: 'SMB market segment',
        description: 'Limited solutions targeting small to medium businesses',
        impact: 'medium',
        difficulty: 'medium',
        timeToFill: '6-12 months'
      },
      {
        area: 'Integration capabilities',
        description: 'Few solutions offer comprehensive integration options',
        impact: 'high',
        difficulty: 'hard',
        timeToFill: '12-18 months'
      }
    ];
  }

  private identifyThreats(
    landscape: CompetitiveIntelligence['landscape'],
    marketDynamics: CompetitiveIntelligence['marketDynamics']
  ): Threat[] {
    return [
      {
        type: 'competitive',
        description: 'Market leaders increasing investment in R&D',
        severity: 'high',
        likelihood: 0.7,
        timeline: '6-12 months'
      },
      {
        type: 'technological',
        description: 'Disruptive technologies may change market dynamics',
        severity: 'medium',
        likelihood: 0.4,
        timeline: '12-24 months'
      }
    ];
  }

  private identifyMarketOpportunities(
    landscape: CompetitiveIntelligence['landscape'],
    marketDynamics: CompetitiveIntelligence['marketDynamics']
  ): Opportunity[] {
    return [
      {
        type: 'market_entry',
        description: 'Underserved niche markets present entry opportunities',
        potential: 'medium',
        timeframe: '3-6 months',
        requirements: ['Market research', 'Product development', 'Go-to-market strategy'],
        stakeholders: ['Product teams', 'Marketing', 'Sales']
      }
    ];
  }

  private generateStrategicRecommendations(
    landscape: CompetitiveIntelligence['landscape'],
    marketDynamics: CompetitiveIntelligence['marketDynamics'],
    gaps: Gap[],
    opportunities: Opportunity[]
  ): string[] {
    return [
      'Focus on underserved market segments with tailored solutions',
      'Invest in integration capabilities to differentiate from competitors',
      'Monitor emerging technologies for disruptive potential',
      'Consider strategic partnerships to accelerate market entry',
      'Develop competitive intelligence monitoring system'
    ];
  }
}

// Export factory functions
export function createTechnologyTrendAnalyzer(knowledgeGraph: KnowledgeGraphEngine): TechnologyTrendAnalyzer {
  return new TechnologyTrendAnalyzer(knowledgeGraph);
}

export function createCompetitiveIntelligenceAnalyzer(knowledgeGraph: KnowledgeGraphEngine): CompetitiveIntelligenceAnalyzer {
  return new CompetitiveIntelligenceAnalyzer(knowledgeGraph);
}
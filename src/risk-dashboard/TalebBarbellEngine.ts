/**
 * Taleb Barbell Strategy Engine
 * Phase 2 Integration - Antifragile Portfolio Allocation
 * Implements Nassim Taleb's barbell strategy with convexity optimization
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export interface BarbellAllocation {
  safeAssets: {
    allocation: number; // % of portfolio
    assets: SafeAsset[];
    yield: number;
    duration: number;
    convexity: number;
  };
  riskAssets: {
    allocation: number; // % of portfolio
    assets: RiskAsset[];
    expectedVolatility: number;
    maxDrawdown: number;
    tailRisk: number;
    convexity: number;
  };
  cash: number; // % cash buffer
  totalConvexity: number;
  antifragilityScore: number;
  rebalanceSignal: 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
  timestamp: number;
}

export interface SafeAsset {
  type: 'TREASURY' | 'CASH' | 'CD' | 'HIGH_GRADE_BOND';
  allocation: number;
  yield: number;
  duration: number;
  creditRating: string;
  convexityContribution: number;
}

export interface RiskAsset {
  type: 'TECH_STOCK' | 'CRYPTO' | 'STARTUP' | 'VENTURE' | 'OPTIONS' | 'COMMODITY';
  allocation: number;
  expectedReturn: number;
  volatility: number;
  skewness: number;
  kurtosis: number;
  tailRisk: number;
  convexityContribution: number;
}

export interface MarketRegime {
  regime: 'NORMAL' | 'STRESS' | 'CRISIS' | 'EUPHORIA';
  volatility: number;
  correlations: number;
  liquidityStress: number;
  tailEvents: number;
  timestamp: number;
}

export interface ConvexityMetrics {
  totalConvexity: number;
  safeConvexity: number;
  riskConvexity: number;
  optionality: number;
  asymmetry: number;
  fragility: number;
  antifragility: number;
  timestamp: number;
}

export interface RebalanceRecommendation {
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  currentAllocation: { safe: number, risk: number, cash: number };
  targetAllocation: { safe: number, risk: number, cash: number };
  trades: Array<{
    asset: string;
    action: 'BUY' | 'SELL';
    amount: number;
    reasoning: string;
  }>;
  expectedBenefit: number;
  riskReduction: number;
  timestamp: number;
}

/**
 * Taleb Barbell Engine - Antifragile portfolio construction and management
 */
export class TalebBarbellEngine extends EventEmitter {
  private currentAllocation: BarbellAllocation;
  private marketRegime: MarketRegime;
  private convexityMetrics: ConvexityMetrics;
  private rebalanceHistory: RebalanceRecommendation[] = [];
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  // Configuration parameters
  private readonly config = {
    targetSafeAllocation: 0.85, // 85% safe assets
    targetRiskAllocation: 0.15, // 15% risk assets
    maxCashBuffer: 0.05, // 5% max cash
    rebalanceThreshold: 0.05, // 5% drift threshold
    stressTestThreshold: 0.02, // 2% tail risk threshold
    convexityTarget: 0.3, // Target convexity score
    antifragilityTarget: 0.4 // Target antifragility score
  };

  constructor() {
    super();

    // Initialize with conservative barbell
    this.currentAllocation = this.initializeBarbellAllocation();
    this.marketRegime = this.initializeMarketRegime();
    this.convexityMetrics = this.initializeConvexityMetrics();

    console.log(' Taleb Barbell Engine initialized - seeking antifragility...');
  }

  /**
   * Start the Barbell Engine
   */
  start(): void {
    if (this.isRunning) {
      console.log(' Taleb Barbell Engine already running');
      return;
    }

    this.isRunning = true;

    // Start real-time monitoring and optimization
    this.updateInterval = setInterval(() => {
      this.updateBarbellAnalysis();
    }, 5000); // Update every 5 seconds

    console.log(' Taleb Barbell Engine started - optimizing for Black Swan events...');
    this.emit('started');
  }

  /**
   * Stop the Barbell Engine
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log(' Taleb Barbell Engine stopped');
    this.emit('stopped');
  }

  /**
   * Initialize default barbell allocation
   */
  private initializeBarbellAllocation(): BarbellAllocation {
    const safeAssets: SafeAsset[] = [
      {
        type: 'TREASURY',
        allocation: 0.70,
        yield: 0.045,
        duration: 5.2,
        creditRating: 'AAA',
        convexityContribution: 0.15
      },
      {
        type: 'CASH',
        allocation: 0.15,
        yield: 0.02,
        duration: 0,
        creditRating: 'AAA',
        convexityContribution: 0.0
      }
    ];

    const riskAssets: RiskAsset[] = [
      {
        type: 'TECH_STOCK',
        allocation: 0.08,
        expectedReturn: 0.25,
        volatility: 0.45,
        skewness: -0.5,
        kurtosis: 4.2,
        tailRisk: 0.15,
        convexityContribution: 0.20
      },
      {
        type: 'CRYPTO',
        allocation: 0.04,
        expectedReturn: 0.50,
        volatility: 0.80,
        skewness: 0.8,
        kurtosis: 6.5,
        tailRisk: 0.35,
        convexityContribution: 0.40
      },
      {
        type: 'OPTIONS',
        allocation: 0.03,
        expectedReturn: -0.20, // Time decay
        volatility: 1.20,
        skewness: 2.5,
        kurtosis: 12.0,
        tailRisk: 1.0, // Can lose 100%
        convexityContribution: 0.80
      }
    ];

    const safeAllocation = safeAssets.reduce((sum, asset) => sum + asset.allocation, 0);
    const riskAllocation = riskAssets.reduce((sum, asset) => sum + asset.allocation, 0);
    const totalConvexity = this.calculateTotalConvexity(safeAssets, riskAssets);

    return {
      safeAssets: {
        allocation: safeAllocation,
        assets: safeAssets,
        yield: this.weightedAverage(safeAssets, 'yield', 'allocation'),
        duration: this.weightedAverage(safeAssets, 'duration', 'allocation'),
        convexity: safeAssets.reduce((sum, asset) => sum + asset.convexityContribution * asset.allocation, 0)
      },
      riskAssets: {
        allocation: riskAllocation,
        assets: riskAssets,
        expectedVolatility: this.weightedAverage(riskAssets, 'volatility', 'allocation'),
        maxDrawdown: Math.max(...riskAssets.map(a => a.tailRisk)),
        tailRisk: this.weightedAverage(riskAssets, 'tailRisk', 'allocation'),
        convexity: riskAssets.reduce((sum, asset) => sum + asset.convexityContribution * asset.allocation, 0)
      },
      cash: 1 - safeAllocation - riskAllocation,
      totalConvexity,
      antifragilityScore: this.calculateAntifragilityScore(totalConvexity, riskAssets),
      rebalanceSignal: 'NONE',
      timestamp: Date.now()
    };
  }

  /**
   * Initialize market regime analysis
   */
  private initializeMarketRegime(): MarketRegime {
    return {
      regime: 'NORMAL',
      volatility: 0.18, // VIX equivalent
      correlations: 0.65, // Asset correlation
      liquidityStress: 0.1, // Bid-ask spreads
      tailEvents: 0.02, // Tail event frequency
      timestamp: Date.now()
    };
  }

  /**
   * Initialize convexity metrics
   */
  private initializeConvexityMetrics(): ConvexityMetrics {
    return {
      totalConvexity: 0.25,
      safeConvexity: 0.15,
      riskConvexity: 0.10,
      optionality: 0.20,
      asymmetry: 0.30,
      fragility: 0.15,
      antifragility: 0.35,
      timestamp: Date.now()
    };
  }

  /**
   * Update barbell analysis and generate recommendations
   */
  private updateBarbellAnalysis(): void {
    const startTime = performance.now();

    try {
      // Update market regime
      this.updateMarketRegime();

      // Update convexity metrics
      this.updateConvexityMetrics();

      // Simulate market movements and portfolio drift
      this.simulateMarketMovements();

      // Check for rebalancing needs
      const rebalanceRec = this.assessRebalanceNeeds();
      if (rebalanceRec && rebalanceRec.urgency !== 'LOW') {
        this.rebalanceHistory.push(rebalanceRec);
        if (this.rebalanceHistory.length > 50) {
          this.rebalanceHistory.shift(); // Keep last 50 recommendations
        }
        this.emit('rebalanceRecommendation', rebalanceRec);
      }

      // Update allocation based on market regime
      this.optimizeBarbellAllocation();

      // Emit status update
      this.emit('barbellUpdate', {
        allocation: this.currentAllocation,
        regime: this.marketRegime,
        convexity: this.convexityMetrics,
        processingTime: performance.now() - startTime
      });

    } catch (error) {
      console.error(' Barbell Engine analysis error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Update market regime analysis
   */
  private updateMarketRegime(): void {
    // Simulate market regime changes
    const volatilityChange = (Math.random() - 0.5) * 0.02;
    const correlationChange = (Math.random() - 0.5) * 0.01;

    this.marketRegime.volatility = Math.max(0.1, Math.min(0.8,
      this.marketRegime.volatility + volatilityChange));

    this.marketRegime.correlations = Math.max(0.2, Math.min(0.9,
      this.marketRegime.correlations + correlationChange));

    // Determine regime
    if (this.marketRegime.volatility > 0.4) {
      this.marketRegime.regime = 'CRISIS';
      this.marketRegime.liquidityStress = 0.4 + Math.random() * 0.3;
      this.marketRegime.tailEvents = 0.1 + Math.random() * 0.1;
    } else if (this.marketRegime.volatility > 0.25) {
      this.marketRegime.regime = 'STRESS';
      this.marketRegime.liquidityStress = 0.2 + Math.random() * 0.2;
      this.marketRegime.tailEvents = 0.05 + Math.random() * 0.05;
    } else if (this.marketRegime.volatility < 0.12) {
      this.marketRegime.regime = 'EUPHORIA';
      this.marketRegime.liquidityStress = 0.05 + Math.random() * 0.05;
      this.marketRegime.tailEvents = 0.01 + Math.random() * 0.02;
    } else {
      this.marketRegime.regime = 'NORMAL';
      this.marketRegime.liquidityStress = 0.1 + Math.random() * 0.1;
      this.marketRegime.tailEvents = 0.02 + Math.random() * 0.03;
    }

    this.marketRegime.timestamp = Date.now();
  }

  /**
   * Update convexity metrics
   */
  private updateConvexityMetrics(): void {
    const safeConvexity = this.currentAllocation.safeAssets.convexity;
    const riskConvexity = this.currentAllocation.riskAssets.convexity;
    const totalConvexity = safeConvexity + riskConvexity;

    // Calculate optionality (ability to benefit from volatility)
    const optionality = this.currentAllocation.riskAssets.assets
      .filter(asset => asset.type === 'OPTIONS' || asset.skewness > 0)
      .reduce((sum, asset) => sum + asset.allocation, 0);

    // Calculate asymmetry (more upside than downside)
    const asymmetry = this.currentAllocation.riskAssets.assets
      .reduce((sum, asset) => sum + (asset.skewness * asset.allocation), 0);

    // Calculate fragility (sensitivity to stress)
    const fragility = this.marketRegime.volatility * this.marketRegime.correlations;

    // Calculate antifragility (benefit from stress)
    const antifragility = Math.max(0, totalConvexity - fragility + asymmetry);

    this.convexityMetrics = {
      totalConvexity,
      safeConvexity,
      riskConvexity,
      optionality,
      asymmetry,
      fragility,
      antifragility,
      timestamp: Date.now()
    };
  }

  /**
   * Simulate market movements and portfolio drift
   */
  private simulateMarketMovements(): void {
    // Simulate different performance for safe vs risk assets
    const safeReturn = 0.001 + (Math.random() - 0.5) * 0.005; // 0.5% daily
    const riskReturn = (Math.random() - 0.5) * this.marketRegime.volatility / 16; // Scaled by volatility

    // Apply Black Swan events occasionally
    if (Math.random() < this.marketRegime.tailEvents / 100) {
      const blackSwanMagnitude = (Math.random() - 0.3) * 0.3; // Biased negative
      console.log(` Black Swan Event: ${(blackSwanMagnitude * 100).toFixed(1)}% market move`);

      // Risk assets get hit harder
      this.currentAllocation.riskAssets.assets.forEach(asset => {
        asset.allocation *= (1 + blackSwanMagnitude * 2); // 2x impact on risk assets
      });

      // Safe assets may benefit (flight to quality)
      this.currentAllocation.safeAssets.assets.forEach(asset => {
        if (asset.type === 'TREASURY') {
          asset.allocation *= (1 - blackSwanMagnitude * 0.3); // Benefit from flight to quality
        }
      });
    } else {
      // Normal market movements
      this.currentAllocation.safeAssets.assets.forEach(asset => {
        asset.allocation *= (1 + safeReturn);
      });

      this.currentAllocation.riskAssets.assets.forEach(asset => {
        asset.allocation *= (1 + riskReturn);
      });
    }

    // Normalize allocations
    this.normalizeAllocations();
  }

  /**
   * Normalize allocations to sum to 1
   */
  private normalizeAllocations(): void {
    const totalSafe = this.currentAllocation.safeAssets.assets.reduce((sum, asset) => sum + asset.allocation, 0);
    const totalRisk = this.currentAllocation.riskAssets.assets.reduce((sum, asset) => sum + asset.allocation, 0);
    const total = totalSafe + totalRisk + this.currentAllocation.cash;

    if (total > 0) {
      // Normalize to 100%
      this.currentAllocation.safeAssets.assets.forEach(asset => {
        asset.allocation /= total;
      });

      this.currentAllocation.riskAssets.assets.forEach(asset => {
        asset.allocation /= total;
      });

      this.currentAllocation.cash /= total;

      // Update aggregate allocations
      this.currentAllocation.safeAssets.allocation = this.currentAllocation.safeAssets.assets.reduce((sum, asset) => sum + asset.allocation, 0);
      this.currentAllocation.riskAssets.allocation = this.currentAllocation.riskAssets.assets.reduce((sum, asset) => sum + asset.allocation, 0);
    }
  }

  /**
   * Assess rebalancing needs
   */
  private assessRebalanceNeeds(): RebalanceRecommendation | null {
    const currentSafe = this.currentAllocation.safeAssets.allocation;
    const currentRisk = this.currentAllocation.riskAssets.allocation;
    const currentCash = this.currentAllocation.cash;

    const targetSafe = this.getTargetSafeAllocation();
    const targetRisk = this.getTargetRiskAllocation();
    const targetCash = Math.max(0.02, Math.min(0.05, 1 - targetSafe - targetRisk));

    const safeDrift = Math.abs(currentSafe - targetSafe);
    const riskDrift = Math.abs(currentRisk - targetRisk);
    const maxDrift = Math.max(safeDrift, riskDrift);

    let urgency: RebalanceRecommendation['urgency'] = 'LOW';
    let reason = 'Portfolio within target ranges';

    if (maxDrift > 0.15) {
      urgency = 'CRITICAL';
      reason = `Severe allocation drift: ${(maxDrift * 100).toFixed(1)}%`;
    } else if (maxDrift > 0.10) {
      urgency = 'HIGH';
      reason = `High allocation drift: ${(maxDrift * 100).toFixed(1)}%`;
    } else if (maxDrift > 0.05) {
      urgency = 'MEDIUM';
      reason = `Moderate allocation drift: ${(maxDrift * 100).toFixed(1)}%`;
    }

    // Additional triggers
    if (this.marketRegime.regime === 'CRISIS' && this.currentAllocation.riskAssets.allocation > 0.20) {
      urgency = 'CRITICAL';
      reason += '; Crisis regime - reduce risk exposure';
    }

    if (this.convexityMetrics.antifragility < 0.2) {
      urgency = urgency === 'LOW' ? 'MEDIUM' : urgency;
      reason += '; Low antifragility - increase convexity';
    }

    if (urgency === 'LOW') return null;

    return {
      urgency,
      reason,
      currentAllocation: { safe: currentSafe, risk: currentRisk, cash: currentCash },
      targetAllocation: { safe: targetSafe, risk: targetRisk, cash: targetCash },
      trades: this.generateTradeRecommendations(currentSafe, currentRisk, targetSafe, targetRisk),
      expectedBenefit: maxDrift * 0.02, // Estimated benefit from rebalancing
      riskReduction: Math.max(0, (currentRisk - targetRisk) * 0.5),
      timestamp: Date.now()
    };
  }

  /**
   * Generate specific trade recommendations
   */
  private generateTradeRecommendations(currentSafe: number, currentRisk: number, targetSafe: number, targetRisk: number): Array<{ asset: string; action: 'BUY' | 'SELL'; amount: number; reasoning: string; }> {
    const trades = [];

    if (currentSafe < targetSafe) {
      trades.push({
        asset: 'US Treasury Bonds',
        action: 'BUY',
        amount: targetSafe - currentSafe,
        reasoning: 'Increase safe asset allocation for portfolio stability'
      });
    } else if (currentSafe > targetSafe) {
      trades.push({
        asset: 'US Treasury Bonds',
        action: 'SELL',
        amount: currentSafe - targetSafe,
        reasoning: 'Reduce safe asset allocation - overweight position'
      });
    }

    if (currentRisk < targetRisk) {
      trades.push({
        asset: 'Growth Options/Tech',
        action: 'BUY',
        amount: targetRisk - currentRisk,
        reasoning: 'Increase risk asset allocation for upside convexity'
      });
    } else if (currentRisk > targetRisk) {
      trades.push({
        asset: 'Growth Options/Tech',
        action: 'SELL',
        amount: currentRisk - targetRisk,
        reasoning: 'Reduce risk exposure - overweight position'
      });
    }

    return trades;
  }

  /**
   * Optimize barbell allocation based on current conditions
   */
  private optimizeBarbellAllocation(): void {
    // Adjust allocations based on market regime
    switch (this.marketRegime.regime) {
      case 'CRISIS':
        // Increase safe allocation, reduce risk
        this.config.targetSafeAllocation = 0.90;
        this.config.targetRiskAllocation = 0.05;
        break;
      case 'STRESS':
        // Slightly more conservative
        this.config.targetSafeAllocation = 0.88;
        this.config.targetRiskAllocation = 0.10;
        break;
      case 'EUPHORIA':
        // Slightly more risk for optionality
        this.config.targetSafeAllocation = 0.82;
        this.config.targetRiskAllocation = 0.18;
        break;
      default: // NORMAL
        // Standard barbell
        this.config.targetSafeAllocation = 0.85;
        this.config.targetRiskAllocation = 0.15;
        break;
    }

    // Update rebalance signal
    const safeDrift = Math.abs(this.currentAllocation.safeAssets.allocation - this.config.targetSafeAllocation);
    if (safeDrift > 0.10) {
      this.currentAllocation.rebalanceSignal = 'CRITICAL';
    } else if (safeDrift > 0.05) {
      this.currentAllocation.rebalanceSignal = 'MAJOR';
    } else if (safeDrift > 0.02) {
      this.currentAllocation.rebalanceSignal = 'MINOR';
    } else {
      this.currentAllocation.rebalanceSignal = 'NONE';
    }

    // Update timestamp
    this.currentAllocation.timestamp = Date.now();
  }

  // Utility methods
  private calculateTotalConvexity(safeAssets: SafeAsset[], riskAssets: RiskAsset[]): number {
    const safeConvexity = safeAssets.reduce((sum, asset) => sum + asset.convexityContribution * asset.allocation, 0);
    const riskConvexity = riskAssets.reduce((sum, asset) => sum + asset.convexityContribution * asset.allocation, 0);
    return safeConvexity + riskConvexity;
  }

  private calculateAntifragilityScore(convexity: number, riskAssets: RiskAsset[]): number {
    const optionality = riskAssets.filter(a => a.type === 'OPTIONS' || a.skewness > 1).reduce((sum, a) => sum + a.allocation, 0);
    const asymmetry = riskAssets.reduce((sum, a) => sum + Math.max(0, a.skewness) * a.allocation, 0);
    return Math.min(1.0, convexity * 0.6 + optionality * 0.3 + asymmetry * 0.1);
  }

  private weightedAverage(items: any[], property: string, weightProperty: string): number {
    const totalWeight = items.reduce((sum, item) => sum + item[weightProperty], 0);
    if (totalWeight === 0) return 0;
    return items.reduce((sum, item) => sum + item[property] * item[weightProperty], 0) / totalWeight;
  }

  private getTargetSafeAllocation(): number {
    return this.config.targetSafeAllocation;
  }

  private getTargetRiskAllocation(): number {
    return this.config.targetRiskAllocation;
  }

  // Public getters
  getCurrentAllocation(): BarbellAllocation {
    return { ...this.currentAllocation };
  }

  getMarketRegime(): MarketRegime {
    return { ...this.marketRegime };
  }

  getConvexityMetrics(): ConvexityMetrics {
    return { ...this.convexityMetrics };
  }

  getRebalanceHistory(count = 10): RebalanceRecommendation[] {
    return this.rebalanceHistory.slice(-count);
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  getAntifragilityInsights(): { score: number; factors: string[]; recommendations: string[]; } {
    const insights = {
      score: this.convexityMetrics.antifragility,
      factors: [] as string[],
      recommendations: [] as string[]
    };

    if (this.convexityMetrics.optionality > 0.1) {
      insights.factors.push(`Strong optionality (${(this.convexityMetrics.optionality * 100).toFixed(1)}%)`);
    }

    if (this.convexityMetrics.asymmetry > 0.2) {
      insights.factors.push(`Positive asymmetry - more upside than downside`);
    }

    if (this.convexityMetrics.fragility > 0.3) {
      insights.factors.push(`High fragility detected in current regime`);
      insights.recommendations.push('Consider reducing correlation with market stress factors');
    }

    if (this.currentAllocation.riskAssets.allocation > 0.20 && this.marketRegime.regime === 'CRISIS') {
      insights.recommendations.push('Crisis regime detected - consider reducing risk asset exposure');
    }

    if (this.convexityMetrics.totalConvexity < this.config.convexityTarget) {
      insights.recommendations.push('Increase convexity through options or asymmetric bets');
    }

    return insights;
  }
}

export default TalebBarbellEngine;
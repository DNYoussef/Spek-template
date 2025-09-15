/**
 * Gary's DPI (Dynamic Position Intelligence) Engine
 * Phase 1 Integration for Risk Dashboard
 * Real-time market analysis and position recommendations
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export interface DPISignal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE';
  strength: number; // 0-1 signal strength
  confidence: number; // 0-1 confidence level
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'
  timestamp: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DPIMarketCondition {
  volatility: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  momentum: number; // -1 to 1
  volume: number;
  marketRegime: 'TRENDING' | 'MEAN_REVERTING' | 'HIGH_VOL' | 'LOW_VOL';
  timestamp: number;
}

export interface DPIPositionRecommendation {
  asset: string;
  action: DPISignal['type'];
  size: number; // Position size as % of portfolio
  stopLoss: number;
  takeProfit: number;
  timeHorizon: number; // Expected holding time in minutes
  reasoning: string;
  riskAdjustedSize: number; // Kelly-adjusted size
  confidence: number;
  timestamp: number;
}

export interface DPIPortfolioState {
  totalValue: number;
  availableCash: number;
  positionsCount: number;
  totalExposure: number;
  diversificationScore: number; // 0-1
  riskUtilization: number; // 0-1
  performanceToday: number;
  maxDrawdown: number;
  timestamp: number;
}

/**
 * Gary's DPI Engine - Advanced market analysis and position intelligence
 */
export class GaryDPIEngine extends EventEmitter {
  private marketData: Map<string, number[]> = new Map(); // Price history
  private signals: DPISignal[] = [];
  private marketCondition: DPIMarketCondition;
  private portfolioState: DPIPortfolioState;
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();

    // Initialize market condition
    this.marketCondition = {
      volatility: 0.02,
      trend: 'SIDEWAYS',
      momentum: 0,
      volume: 1.0,
      marketRegime: 'MEAN_REVERTING',
      timestamp: Date.now()
    };

    // Initialize portfolio state
    this.portfolioState = {
      totalValue: 1000000,
      availableCash: 200000,
      positionsCount: 0,
      totalExposure: 0,
      diversificationScore: 0,
      riskUtilization: 0,
      performanceToday: 0,
      maxDrawdown: 0,
      timestamp: Date.now()
    };

    console.log(' Gary DPI Engine initialized');
  }

  /**
   * Start the DPI engine
   */
  start(): void {
    if (this.isRunning) {
      console.log(' Gary DPI Engine already running');
      return;
    }

    this.isRunning = true;

    // Initialize market data
    this.initializeMarketData();

    // Start real-time analysis
    this.updateInterval = setInterval(() => {
      this.updateMarketAnalysis();
    }, 1000); // Update every second

    console.log(' Gary DPI Engine started - analyzing markets...');
    this.emit('started');
  }

  /**
   * Stop the DPI engine
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log(' Gary DPI Engine stopped');
    this.emit('stopped');
  }

  /**
   * Initialize synthetic market data for demonstration
   */
  private initializeMarketData(): void {
    const assets = ['SPY', 'QQQ', 'IWM', 'GLD', 'BTC', 'ETH', 'EUR/USD', 'OIL'];

    assets.forEach(asset => {
      const prices: number[] = [];
      let basePrice = 100 + (Math.random() * 400); // $100-500 base

      // Generate 1000 historical price points
      for (let i = 0; i < 1000; i++) {
        const volatility = 0.02 + (Math.random() * 0.03); // 2-5% daily vol
        const drift = (Math.random() - 0.5) * 0.001; // Small drift
        const change = drift + (this.generateNormalRandom() * volatility);

        basePrice *= (1 + change);
        prices.push(basePrice);
      }

      this.marketData.set(asset, prices);
    });

    console.log(` Initialized market data for ${assets.length} assets`);
  }

  /**
   * Update market analysis and generate signals
   */
  private updateMarketAnalysis(): void {
    const startTime = performance.now();

    try {
      // Update market data with new prices
      this.updatePrices();

      // Analyze market conditions
      this.analyzeMarketConditions();

      // Generate new signals
      const newSignals = this.generateDPISignals();

      // Update portfolio state
      this.updatePortfolioState();

      // Add new signals
      this.signals.push(...newSignals);
      if (this.signals.length > 100) {
        this.signals = this.signals.slice(-100); // Keep last 100 signals
      }

      // Emit updates
      if (newSignals.length > 0) {
        this.emit('signals', newSignals);
      }

      this.emit('marketUpdate', {
        condition: this.marketCondition,
        portfolio: this.portfolioState,
        processingTime: performance.now() - startTime
      });

    } catch (error) {
      console.error(' DPI Engine analysis error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Update prices for all tracked assets
   */
  private updatePrices(): void {
    for (const [asset, prices] of this.marketData.entries()) {
      const lastPrice = prices[prices.length - 1];

      // Generate new price based on market regime
      let volatility = 0.02;
      let drift = 0;

      switch (this.marketCondition.marketRegime) {
        case 'HIGH_VOL':
          volatility = 0.08 + (Math.random() * 0.12); // 8-20% volatility
          break;
        case 'LOW_VOL':
          volatility = 0.005 + (Math.random() * 0.015); // 0.5-2% volatility
          break;
        case 'TRENDING':
          drift = this.marketCondition.momentum * 0.002; // Trend bias
          volatility = 0.03 + (Math.random() * 0.02);
          break;
        case 'MEAN_REVERTING':
          // Mean reversion tendency
          const deviation = (lastPrice - this.getMean(prices.slice(-20))) / lastPrice;
          drift = -deviation * 0.1; // Revert to mean
          break;
      }

      const change = drift + (this.generateNormalRandom() * volatility);
      const newPrice = lastPrice * (1 + change);

      prices.push(newPrice);
      if (prices.length > 1000) {
        prices.shift(); // Keep last 1000 prices
      }
    }
  }

  /**
   * Analyze current market conditions
   */
  private analyzeMarketConditions(): void {
    const spyPrices = this.marketData.get('SPY') || [];
    if (spyPrices.length < 50) return;

    const recentPrices = spyPrices.slice(-50);
    const returns = this.calculateReturns(recentPrices);

    // Calculate volatility
    const volatility = this.calculateVolatility(returns);

    // Determine trend
    const sma20 = this.getMean(recentPrices.slice(-20));
    const sma50 = this.getMean(recentPrices);
    const currentPrice = recentPrices[recentPrices.length - 1];

    let trend: DPIMarketCondition['trend'] = 'SIDEWAYS';
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'BULLISH';
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'BEARISH';
    }

    // Calculate momentum
    const momentum = (currentPrice - sma20) / sma20;

    // Determine market regime
    let marketRegime: DPIMarketCondition['marketRegime'] = 'MEAN_REVERTING';
    if (volatility > 0.06) {
      marketRegime = 'HIGH_VOL';
    } else if (volatility < 0.01) {
      marketRegime = 'LOW_VOL';
    } else if (Math.abs(momentum) > 0.02) {
      marketRegime = 'TRENDING';
    }

    this.marketCondition = {
      volatility,
      trend,
      momentum,
      volume: 0.8 + (Math.random() * 0.4), // Simulated volume
      marketRegime,
      timestamp: Date.now()
    };
  }

  /**
   * Generate DPI signals based on current market analysis
   */
  private generateDPISignals(): DPISignal[] {
    const signals: DPISignal[] = [];
    const now = Date.now();

    // Only generate signals occasionally to avoid noise
    if (Math.random() > 0.1) return signals; // 10% chance per update

    for (const [asset, prices] of this.marketData.entries()) {
      if (prices.length < 100) continue;

      const recentPrices = prices.slice(-50);
      const returns = this.calculateReturns(recentPrices);
      const volatility = this.calculateVolatility(returns);
      const rsi = this.calculateRSI(recentPrices);
      const currentPrice = recentPrices[recentPrices.length - 1];
      const sma20 = this.getMean(recentPrices.slice(-20));

      // Gary's proprietary signal logic
      let signalType: DPISignal['type'] = 'HOLD';
      let strength = 0;
      let confidence = 0.5;
      const reasoning: string[] = [];
      let riskLevel: DPISignal['riskLevel'] = 'MEDIUM';

      // RSI-based signals
      if (rsi < 30) {
        signalType = 'BUY';
        strength = (30 - rsi) / 30;
        reasoning.push(`RSI oversold (${rsi.toFixed(1)})`);
        confidence += 0.2;
      } else if (rsi > 70) {
        signalType = 'SELL';
        strength = (rsi - 70) / 30;
        reasoning.push(`RSI overbought (${rsi.toFixed(1)})`);
        confidence += 0.2;
      }

      // Trend-following signals
      if (currentPrice > sma20 * 1.02) {
        if (signalType === 'HOLD') signalType = 'BUY';
        strength = Math.max(strength, 0.3);
        reasoning.push('Price above SMA20 (+2%)');
        confidence += 0.15;
      } else if (currentPrice < sma20 * 0.98) {
        if (signalType === 'HOLD') signalType = 'SELL';
        strength = Math.max(strength, 0.3);
        reasoning.push('Price below SMA20 (-2%)');
        confidence += 0.15;
      }

      // Volatility-based risk assessment
      if (volatility > 0.08) {
        riskLevel = 'HIGH';
        strength *= 0.7; // Reduce strength in high vol
        reasoning.push(`High volatility (${(volatility * 100).toFixed(1)}%)`);
      } else if (volatility > 0.05) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
        confidence += 0.1;
      }

      // Market regime adjustment
      switch (this.marketCondition.marketRegime) {
        case 'HIGH_VOL':
          strength *= 0.5;
          riskLevel = 'CRITICAL';
          reasoning.push('High volatility regime - reduce risk');
          break;
        case 'TRENDING':
          if (this.marketCondition.trend !== 'SIDEWAYS') {
            strength *= 1.2;
            reasoning.push(`Trending market (${this.marketCondition.trend})`);
          }
          break;
        case 'MEAN_REVERTING':
          // Contrarian signals in mean-reverting markets
          if (signalType === 'BUY') signalType = 'SELL';
          else if (signalType === 'SELL') signalType = 'BUY';
          reasoning.push('Mean-reverting regime - contrarian signal');
          break;
      }

      // Only emit signals with sufficient strength and confidence
      if (strength > 0.3 && confidence > 0.4 && reasoning.length > 0) {
        const signal: DPISignal = {
          type: signalType,
          strength: Math.min(strength, 1.0),
          confidence: Math.min(confidence, 1.0),
          timeframe: '1m', // Real-time signals
          timestamp: now,
          reasoning,
          riskLevel
        };

        signals.push(signal);

        console.log(` DPI Signal: ${asset} ${signalType} (${(strength * 100).toFixed(0)}% strength, ${(confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    return signals;
  }

  /**
   * Update portfolio state based on current market conditions
   */
  private updatePortfolioState(): void {
    const performanceChange = (Math.random() - 0.5) * 0.02; // -1% to +1% daily change
    const newValue = this.portfolioState.totalValue * (1 + performanceChange);

    // Simulate some trading activity
    const activeSignals = this.signals.filter(s => Date.now() - s.timestamp < 300000); // Last 5 minutes

    this.portfolioState = {
      ...this.portfolioState,
      totalValue: newValue,
      availableCash: newValue * (0.2 + Math.random() * 0.3), // 20-50% cash
      positionsCount: Math.floor(activeSignals.length / 2),
      totalExposure: Math.random() * 0.8, // 0-80% exposure
      diversificationScore: 0.3 + (Math.random() * 0.7), // 30-100% diversified
      riskUtilization: Math.random() * 0.6, // 0-60% risk utilization
      performanceToday: performanceChange,
      maxDrawdown: Math.max(this.portfolioState.maxDrawdown, Math.abs(Math.min(0, performanceChange))),
      timestamp: Date.now()
    };
  }

  // Utility methods
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = this.getMean(returns);
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance * 252); // Annualized
  }

  private calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }

    const avgGain = this.getMean(gains.slice(-period));
    const avgLoss = this.getMean(losses.slice(-period));

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private getMean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private generateNormalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // Public getters
  getLatestSignals(count = 10): DPISignal[] {
    return this.signals.slice(-count);
  }

  getMarketCondition(): DPIMarketCondition {
    return { ...this.marketCondition };
  }

  getPortfolioState(): DPIPortfolioState {
    return { ...this.portfolioState };
  }

  getPositionRecommendations(): DPIPositionRecommendation[] {
    const recommendations: DPIPositionRecommendation[] = [];
    const recentSignals = this.getLatestSignals(5);

    recentSignals.forEach((signal, index) => {
      if (signal.strength > 0.5 && signal.confidence > 0.6) {
        const recommendation: DPIPositionRecommendation = {
          asset: `Asset${index + 1}`, // Simplified for demo
          action: signal.type,
          size: signal.strength * 0.1, // Max 10% position size
          stopLoss: signal.type === 'BUY' ? 0.95 : 1.05,
          takeProfit: signal.type === 'BUY' ? 1.15 : 0.85,
          timeHorizon: 60 + (Math.random() * 240), // 1-5 hour holds
          reasoning: signal.reasoning.join('; '),
          riskAdjustedSize: signal.strength * signal.confidence * 0.08, // Kelly-adjusted
          confidence: signal.confidence,
          timestamp: signal.timestamp
        };

        recommendations.push(recommendation);
      }
    });

    return recommendations;
  }

  isRunning(): boolean {
    return this.isRunning;
  }
}

export default GaryDPIEngine;
/**
 * Real-Time Risk Monitoring Dashboard
 * Phase 2 Division 4: Comprehensive risk visualization and monitoring
 * Integrates with GaryTaleb antifragility engine and existing risk assessment systems
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';

// Risk calculation types
export interface ProbabilityOfRuin {
  value: number;
  confidence: number;
  calculationTime: number;
  factors: {
    portfolioValue: number;
    volatility: number;
    drawdownThreshold: number;
    timeHorizon: number;
  };
}

export interface RiskMetrics {
  pRuin: ProbabilityOfRuin;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  conditionalVAR: number;
  betaStability: number;
  antifragilityIndex: number;
  riskThresholds: RiskThresholds;
}

export interface RiskThresholds {
  pRuinCritical: number;
  pRuinHigh: number;
  pRuinMedium: number;
  volatilityCritical: number;
  drawdownCritical: number;
}

export interface AlertConfiguration {
  enabled: boolean;
  thresholds: RiskThresholds;
  notificationChannels: string[];
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  threshold: number;
  action: string;
  delay: number;
}

export interface RiskAlert {
  id: string;
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  escalated: boolean;
}

export interface DashboardState {
  isConnected: boolean;
  lastUpdate: number;
  refreshRate: number;
  currentRisk: RiskMetrics;
  riskHistory: RiskMetrics[];
  activeAlerts: RiskAlert[];
  performance: {
    updateLatency: number;
    calculationTime: number;
    renderTime: number;
  };
}

/**
 * Real-time Risk Monitoring Dashboard
 * Provides live risk metrics, P(ruin) calculations, and alert management
 */
export class RiskMonitoringDashboard extends EventEmitter {
  private wsConnection: WebSocket | null = null;
  private state: DashboardState;
  private config: AlertConfiguration;
  private updateInterval: NodeJS.Timeout | null = null;
  private performanceTracker: PerformanceTracker;
  private riskCalculator: RiskCalculationEngine;
  private alertManager: RiskAlertManager;

  constructor(config?: Partial<AlertConfiguration>) {
    super();
    
    this.config = {
      enabled: true,
      thresholds: {
        pRuinCritical: 0.10,    // 10% probability of ruin
        pRuinHigh: 0.05,        // 5% probability of ruin
        pRuinMedium: 0.02,      // 2% probability of ruin
        volatilityCritical: 0.25, // 25% volatility
        drawdownCritical: 0.20    // 20% maximum drawdown
      },
      notificationChannels: ['dashboard', 'email', 'slack'],
      escalationRules: [
        {
          condition: 'pRuin_critical',
          threshold: 0.10,
          action: 'immediate_alert',
          delay: 0
        },
        {
          condition: 'volatility_spike',
          threshold: 0.30,
          action: 'risk_review',
          delay: 300000 // 5 minutes
        }
      ],
      ...config
    };

    this.state = {
      isConnected: false,
      lastUpdate: 0,
      refreshRate: 1000, // 1 second refresh
      currentRisk: this.getInitialRiskMetrics(),
      riskHistory: [],
      activeAlerts: [],
      performance: {
        updateLatency: 0,
        calculationTime: 0,
        renderTime: 0
      }
    };

    this.performanceTracker = new PerformanceTracker();
    this.riskCalculator = new RiskCalculationEngine();
    this.alertManager = new RiskAlertManager(this.config);

    this.setupEventHandlers();
  }

  /**
   * Initialize dashboard and start real-time monitoring
   */
  async initialize(): Promise<void> {
    console.log(' Initializing Risk Monitoring Dashboard...');
    
    try {
      // Connect to risk data stream
      await this.connectToRiskStream();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      // Initialize performance monitoring
      this.performanceTracker.start();
      
      console.log(' Risk Monitoring Dashboard initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error(' Failed to initialize Risk Monitoring Dashboard:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Connect to real-time risk data stream
   */
  private async connectToRiskStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.RISK_WS_URL || 'ws://localhost:8080/risk-stream';
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.on('open', () => {
        console.log(' Connected to risk data stream');
        this.state.isConnected = true;
        this.emit('connected');
        resolve();
      });
      
      this.wsConnection.on('message', (data) => {
        this.handleRiskDataUpdate(data);
      });
      
      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.state.isConnected = false;
        reject(error);
      });
      
      this.wsConnection.on('close', () => {
        console.log(' Risk data stream disconnected');
        this.state.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnection();
      });
    });
  }

  /**
   * Handle incoming risk data updates
   */
  private async handleRiskDataUpdate(data: Buffer): Promise<void> {
    const startTime = performance.now();
    
    try {
      const riskData = JSON.parse(data.toString());
      
      // Calculate comprehensive risk metrics
      const riskMetrics = await this.riskCalculator.calculateRiskMetrics(riskData);
      
      // Update dashboard state
      this.updateRiskState(riskMetrics);
      
      // Check for alert conditions
      await this.checkAlertConditions(riskMetrics);
      
      // Track performance
      const processingTime = performance.now() - startTime;
      this.performanceTracker.recordUpdate(processingTime);
      
      // Emit update event
      this.emit('riskUpdate', {
        metrics: riskMetrics,
        timestamp: Date.now(),
        processingTime
      });
      
    } catch (error) {
      console.error('Error processing risk data:', error);
      this.emit('error', error);
    }
  }

  /**
   * Start real-time dashboard updates
   */
  private startRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      if (this.state.isConnected) {
        try {
          // Request latest risk calculations
          await this.requestRiskUpdate();
          
          // Update dashboard display
          this.renderDashboard();
          
        } catch (error) {
          console.error('Update cycle error:', error);
        }
      }
    }, this.state.refreshRate);
    
    console.log(` Real-time updates started (${this.state.refreshRate}ms interval)`);
  }

  /**
   * Request latest risk calculations
   */
  private async requestRiskUpdate(): Promise<void> {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      const request = {
        type: 'risk_request',
        timestamp: Date.now(),
        metrics: ['pRuin', 'volatility', 'sharpe', 'drawdown', 'var', 'antifragility']
      };
      
      this.wsConnection.send(JSON.stringify(request));
    }
  }

  /**
   * Update risk state with new metrics
   */
  private updateRiskState(metrics: RiskMetrics): void {
    const now = Date.now();
    
    // Update current metrics
    this.state.currentRisk = metrics;
    this.state.lastUpdate = now;
    
    // Add to history (keep last 1000 points)
    this.state.riskHistory.push(metrics);
    if (this.state.riskHistory.length > 1000) {
      this.state.riskHistory.shift();
    }
    
    // Update performance metrics
    this.state.performance = this.performanceTracker.getMetrics();
  }

  /**
   * Check alert conditions and generate alerts
   */
  private async checkAlertConditions(metrics: RiskMetrics): Promise<void> {
    const alerts = await this.alertManager.evaluateAlerts(metrics);
    
    for (const alert of alerts) {
      // Add to active alerts
      this.state.activeAlerts.push(alert);
      
      // Emit alert event
      this.emit('alert', alert);
      
      // Log alert
      console.warn(` Risk Alert: ${alert.message}`);
    }
    
    // Clean up acknowledged alerts older than 1 hour
    const cutoff = Date.now() - 3600000;
    this.state.activeAlerts = this.state.activeAlerts.filter(
      alert => !alert.acknowledged || alert.timestamp > cutoff
    );
  }

  /**
   * Render dashboard display
   */
  private renderDashboard(): void {
    const startTime = performance.now();
    
    try {
      // Emit render update
      this.emit('render', {
        state: this.state,
        timestamp: Date.now()
      });
      
      const renderTime = performance.now() - startTime;
      this.performanceTracker.recordRender(renderTime);
      
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  /**
   * Get current dashboard state
   */
  getDashboardState(): DashboardState {
    return { ...this.state };
  }

  /**
   * Get current risk metrics
   */
  getCurrentRiskMetrics(): RiskMetrics {
    return { ...this.state.currentRisk };
  }

  /**
   * Get risk history for specified time range
   */
  getRiskHistory(minutes: number = 60): RiskMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.state.riskHistory.filter(
      metric => metric.pRuin.calculationTime > cutoff
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RiskAlert[] {
    return [...this.state.activeAlerts];
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.state.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Update alert configuration
   */
  updateAlertConfiguration(config: Partial<AlertConfiguration>): void {
    this.config = { ...this.config, ...config };
    this.alertManager.updateConfiguration(this.config);
    this.emit('configUpdated', this.config);
  }

  /**
   * Set refresh rate
   */
  setRefreshRate(milliseconds: number): void {
    if (milliseconds < 100) {
      throw new Error('Refresh rate cannot be less than 100ms');
    }
    
    this.state.refreshRate = milliseconds;
    
    if (this.updateInterval) {
      this.startRealTimeUpdates(); // Restart with new rate
    }
    
    console.log(` Refresh rate updated to ${milliseconds}ms`);
  }

  /**
   * Attempt to reconnect to risk stream
   */
  private async attemptReconnection(): Promise<void> {
    console.log(' Attempting to reconnect to risk stream...');
    
    setTimeout(async () => {
      try {
        await this.connectToRiskStream();
      } catch (error) {
        console.error('Reconnection failed:', error);
        // Try again in 5 seconds
        this.attemptReconnection();
      }
    }, 5000);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle process termination
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Get initial risk metrics
   */
  private getInitialRiskMetrics(): RiskMetrics {
    return {
      pRuin: {
        value: 0,
        confidence: 0,
        calculationTime: Date.now(),
        factors: {
          portfolioValue: 0,
          volatility: 0,
          drawdownThreshold: 0,
          timeHorizon: 0
        }
      },
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      valueAtRisk: 0,
      conditionalVAR: 0,
      betaStability: 0,
      antifragilityIndex: 0,
      riskThresholds: this.config.thresholds
    };
  }

  /**
   * Shutdown dashboard
   */
  async shutdown(): Promise<void> {
    console.log(' Shutting down Risk Monitoring Dashboard...');
    
    // Stop updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    // Stop performance tracking
    this.performanceTracker.stop();
    
    this.emit('shutdown');
    console.log(' Risk Monitoring Dashboard shut down successfully');
  }
}

/**
 * Performance tracking utility
 */
class PerformanceTracker {
  private updateTimes: number[] = [];
  private renderTimes: number[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  recordUpdate(time: number): void {
    this.updateTimes.push(time);
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift();
    }
  }

  recordRender(time: number): void {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
  }

  getMetrics() {
    return {
      updateLatency: this.getAverage(this.updateTimes),
      calculationTime: this.getAverage(this.updateTimes),
      renderTime: this.getAverage(this.renderTimes)
    };
  }

  private getAverage(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : 0;
  }

  stop(): void {
    // Cleanup if needed
  }
}

/**
 * Risk calculation engine
 */
class RiskCalculationEngine {
  /**
   * Calculate comprehensive risk metrics
   */
  async calculateRiskMetrics(data: any): Promise<RiskMetrics> {
    const startTime = performance.now();
    
    try {
      // Calculate P(ruin) using GaryTaleb methodology
      const pRuin = await this.calculateProbabilityOfRuin(data);
      
      // Calculate other risk metrics
      const volatility = this.calculateVolatility(data.returns || []);
      const sharpeRatio = this.calculateSharpeRatio(data.returns || [], volatility);
      const maxDrawdown = this.calculateMaxDrawdown(data.equity || []);
      const valueAtRisk = this.calculateVaR(data.returns || []);
      const conditionalVAR = this.calculateCVaR(data.returns || []);
      const betaStability = this.calculateBetaStability(data);
      const antifragilityIndex = this.calculateAntifragilityIndex(data);
      
      return {
        pRuin,
        volatility,
        sharpeRatio,
        maxDrawdown,
        valueAtRisk,
        conditionalVAR,
        betaStability,
        antifragilityIndex,
        riskThresholds: {
          pRuinCritical: 0.10,
          pRuinHigh: 0.05,
          pRuinMedium: 0.02,
          volatilityCritical: 0.25,
          drawdownCritical: 0.20
        }
      };
      
    } catch (error) {
      console.error('Risk calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate probability of ruin using antifragility methodology
   */
  private async calculateProbabilityOfRuin(data: any): Promise<ProbabilityOfRuin> {
    const calculationTime = Date.now();
    
    // Extract portfolio data
    const portfolioValue = data.portfolioValue || 100000;
    const returns = data.returns || [];
    const volatility = this.calculateVolatility(returns);
    const drawdownThreshold = data.drawdownThreshold || 0.20;
    const timeHorizon = data.timeHorizon || 252; // Trading days
    
    // GaryTaleb probability of ruin calculation
    // P(ruin) = probability of hitting drawdown threshold within time horizon
    let pRuinValue = 0;
    
    if (returns.length > 0 && volatility > 0) {
      const mu = this.calculateMean(returns);
      const sigma = volatility;
      
      // Monte Carlo simulation for P(ruin)
      const simulations = 10000;
      let ruinCount = 0;
      
      for (let i = 0; i < simulations; i++) {
        let equity = portfolioValue;
        let maxEquity = portfolioValue;
        
        for (let day = 0; day < timeHorizon; day++) {
          // Generate random return
          const randomReturn = this.generateNormalRandom() * sigma + mu;
          equity *= (1 + randomReturn);
          maxEquity = Math.max(maxEquity, equity);
          
          // Check for ruin (drawdown threshold hit)
          const drawdown = (maxEquity - equity) / maxEquity;
          if (drawdown >= drawdownThreshold) {
            ruinCount++;
            break;
          }
        }
      }
      
      pRuinValue = ruinCount / simulations;
    }
    
    // Confidence based on sample size and volatility
    const confidence = Math.min(0.95, Math.max(0.5, 1 - volatility));
    
    return {
      value: pRuinValue,
      confidence,
      calculationTime,
      factors: {
        portfolioValue,
        volatility,
        drawdownThreshold,
        timeHorizon
      }
    };
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = this.calculateMean(returns);
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / (returns.length - 1);
    
    return Math.sqrt(variance * 252); // Annualized
  }

  private calculateMean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
  }

  private calculateSharpeRatio(returns: number[], volatility: number): number {
    if (returns.length === 0 || volatility === 0) return 0;
    
    const meanReturn = this.calculateMean(returns) * 252; // Annualized
    const riskFreeRate = 0.02; // Assume 2% risk-free rate
    
    return (meanReturn - riskFreeRate) / volatility;
  }

  private calculateMaxDrawdown(equity: number[]): number {
    if (equity.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = equity[0];
    
    for (const value of equity) {
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }

  private calculateVaR(returns: number[], confidence: number = 0.05): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(confidence * sortedReturns.length);
    
    return -sortedReturns[index] || 0;
  }

  private calculateCVaR(returns: number[], confidence: number = 0.05): number {
    if (returns.length === 0) return 0;

    const valueAtRisk = this.calculateVaR(returns, confidence);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor(confidence * sortedReturns.length);

    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    return tailReturns.length > 0 ? -this.calculateMean(tailReturns) : valueAtRisk;
  }

  private calculateBetaStability(data: any): number {
    // Simplified beta stability calculation
    const returns = data.returns || [];
    const marketReturns = data.marketReturns || [];
    
    if (returns.length < 10 || marketReturns.length < 10) return 0;
    
    // Calculate rolling betas and measure stability
    const window = 30;
    const betas: number[] = [];
    
    for (let i = window; i < Math.min(returns.length, marketReturns.length); i++) {
      const periodReturns = returns.slice(i - window, i);
      const periodMarket = marketReturns.slice(i - window, i);
      const beta = this.calculateBeta(periodReturns, periodMarket);
      betas.push(beta);
    }
    
    // Stability is inverse of beta volatility
    const betaVolatility = this.calculateVolatility(betas) / Math.sqrt(252);
    return Math.max(0, 1 - betaVolatility);
  }

  private calculateBeta(returns: number[], marketReturns: number[]): number {
    if (returns.length !== marketReturns.length || returns.length === 0) return 1;
    
    const returnMean = this.calculateMean(returns);
    const marketMean = this.calculateMean(marketReturns);
    
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < returns.length; i++) {
      covariance += (returns[i] - returnMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    
    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  private calculateAntifragilityIndex(data: any): number {
    // GaryTaleb antifragility index calculation
    const returns = data.returns || [];
    if (returns.length === 0) return 0;
    
    // Measure convexity in tail events
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const tailSize = Math.floor(returns.length * 0.1); // Bottom 10%
    const bodySize = Math.floor(returns.length * 0.8); // Middle 80%
    
    const tailReturns = sortedReturns.slice(0, tailSize);
    const bodyReturns = sortedReturns.slice(tailSize, tailSize + bodySize);
    
    const tailMean = this.calculateMean(tailReturns);
    const bodyMean = this.calculateMean(bodyReturns);
    
    // Antifragility = positive convexity in extreme events
    const antifragility = tailMean < 0 ? Math.abs(tailMean) / Math.abs(bodyMean) : 0;
    
    return Math.min(1, antifragility);
  }

  private generateNormalRandom(): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

/**
 * Risk alert management
 */
class RiskAlertManager {
  private config: AlertConfiguration;
  private alertHistory: RiskAlert[] = [];

  constructor(config: AlertConfiguration) {
    this.config = config;
  }

  async evaluateAlerts(metrics: RiskMetrics): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];
    const now = Date.now();

    // P(ruin) alerts
    if (metrics.pRuin.value >= this.config.thresholds.pRuinCritical) {
      alerts.push({
        id: `pruin_critical_${now}`,
        type: 'CRITICAL',
        message: `Critical probability of ruin: ${(metrics.pRuin.value * 100).toFixed(2)}%`,
        metric: 'pRuin',
        value: metrics.pRuin.value,
        threshold: this.config.thresholds.pRuinCritical,
        timestamp: now,
        acknowledged: false,
        escalated: false
      });
    } else if (metrics.pRuin.value >= this.config.thresholds.pRuinHigh) {
      alerts.push({
        id: `pruin_high_${now}`,
        type: 'HIGH',
        message: `High probability of ruin: ${(metrics.pRuin.value * 100).toFixed(2)}%`,
        metric: 'pRuin',
        value: metrics.pRuin.value,
        threshold: this.config.thresholds.pRuinHigh,
        timestamp: now,
        acknowledged: false,
        escalated: false
      });
    }

    // Volatility alerts
    if (metrics.volatility >= this.config.thresholds.volatilityCritical) {
      alerts.push({
        id: `volatility_critical_${now}`,
        type: 'CRITICAL',
        message: `Critical volatility level: ${(metrics.volatility * 100).toFixed(1)}%`,
        metric: 'volatility',
        value: metrics.volatility,
        threshold: this.config.thresholds.volatilityCritical,
        timestamp: now,
        acknowledged: false,
        escalated: false
      });
    }

    // Drawdown alerts
    if (metrics.maxDrawdown >= this.config.thresholds.drawdownCritical) {
      alerts.push({
        id: `drawdown_critical_${now}`,
        type: 'CRITICAL',
        message: `Critical drawdown: ${(metrics.maxDrawdown * 100).toFixed(1)}%`,
        metric: 'maxDrawdown',
        value: metrics.maxDrawdown,
        threshold: this.config.thresholds.drawdownCritical,
        timestamp: now,
        acknowledged: false,
        escalated: false
      });
    }

    return alerts;
  }

  updateConfiguration(config: AlertConfiguration): void {
    this.config = config;
  }
}

export default RiskMonitoringDashboard;
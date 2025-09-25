/**
 * Integrated Risk Dashboard - Division 4 Complete Implementation
 * Combines Gary's DPI (Phase 1) + Taleb's Barbell + Kelly Criterion (Phase 2)
 * Real-time P(ruin) calculations with complete risk monitoring
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiskMonitoringDashboard,
  RiskMetrics,
  RiskAlert,
  DashboardState
} from './RiskMonitoringDashboard';
import GaryDPIEngine, {
  DPISignal,
  DPIMarketCondition,
  DPIPortfolioState,
  DPIPositionRecommendation
} from './GaryDPIEngine';
import TalebBarbellEngine, {
  BarbellAllocation,
  MarketRegime,
  RebalanceRecommendation
} from './TalebBarbellEngine';
import KellyCriterionEngine, {
  KellyPortfolio,
  KellyPosition,
  MarketOpportunity
} from './KellyCriterionEngine';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Scatter, ScatterChart
} from 'recharts';

// Color schemes for different risk levels and systems
const COLORS = {
  GARY: {
    primary: '#3b82f6',   // Blue
    secondary: '#1d4ed8',
    accent: '#60a5fa'
  },
  TALEB: {
    primary: '#10b981',   // Green
    secondary: '#059669',
    accent: '#34d399'
  },
  KELLY: {
    primary: '#f59e0b',   // Amber
    secondary: '#d97706',
    accent: '#fbbf24'
  },
  RISK: {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#65a30d',
    SAFE: '#16a34a'
  }
};

interface IntegratedDashboardProps {
  className?: string;
}

interface SystemStatus {
  gary: { running: boolean; lastUpdate: number; signalsCount: number };
  taleb: { running: boolean; lastUpdate: number; antifragility: number };
  kelly: { running: boolean; lastUpdate: number; totalPositions: number };
  risk: { running: boolean; lastUpdate: number; pRuin: number };
}

/**
 * Main Integrated Risk Dashboard Component
 * Division 4: Complete Risk Monitoring System
 */
export const IntegratedRiskDashboard: React.FC<IntegratedDashboardProps> = ({
  className = ''
}) => {
  // System engines
  const garyEngine = useRef<GaryDPIEngine | null>(null);
  const talebEngine = useRef<TalebBarbellEngine | null>(null);
  const kellyEngine = useRef<KellyCriterionEngine | null>(null);
  const riskMonitor = useRef<RiskMonitoringDashboard | null>(null);

  // Dashboard state
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    gary: { running: false, lastUpdate: 0, signalsCount: 0 },
    taleb: { running: false, lastUpdate: 0, antifragility: 0 },
    kelly: { running: false, lastUpdate: 0, totalPositions: 0 },
    risk: { running: false, lastUpdate: 0, pRuin: 0 }
  });

  // Data state
  const [garyData, setGaryData] = useState<{
    signals: DPISignal[];
    condition: DPIMarketCondition;
    portfolio: DPIPortfolioState;
    recommendations: DPIPositionRecommendation[];
  }>({ signals: [], condition: {} as DPIMarketCondition, portfolio: {} as DPIPortfolioState, recommendations: [] });

  const [talebData, setTalebData] = useState<{
    allocation: BarbellAllocation;
    regime: MarketRegime;
    rebalanceRec: RebalanceRecommendation | null;
  }>({ allocation: {} as BarbellAllocation, regime: {} as MarketRegime, rebalanceRec: null });

  const [kellyData, setKellyData] = useState<{
    portfolio: KellyPortfolio;
    positions: KellyPosition[];
    opportunities: MarketOpportunity[];
  }>({ portfolio: {} as KellyPortfolio, positions: [], opportunities: [] });

  const [riskData, setRiskData] = useState<{
    metrics: RiskMetrics | null;
    alerts: RiskAlert[];
    dashboardState: DashboardState | null;
  }>({ metrics: null, alerts: [], dashboardState: null });

  /**
   * Initialize all system engines
   */
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        console.log(' Initializing Integrated Risk Dashboard - Division 4...');

        // Initialize Gary's DPI Engine (Phase 1)
        garyEngine.current = new GaryDPIEngine();
        setupGaryEventHandlers();

        // Initialize Taleb's Barbell Engine (Phase 2)
        talebEngine.current = new TalebBarbellEngine();
        setupTalebEventHandlers();

        // Initialize Kelly Criterion Engine (Phase 2)
        kellyEngine.current = new KellyCriterionEngine();
        setupKellyEventHandlers();

        // Initialize Risk Monitoring Dashboard
        riskMonitor.current = new RiskMonitoringDashboard();
        setupRiskEventHandlers();
        await riskMonitor.current.initialize();

        // Start all engines
        garyEngine.current.start();
        talebEngine.current.start();
        kellyEngine.current.start();

        setIsInitialized(true);
        setError(null);

        console.log(' All systems initialized successfully');
        console.log(' Gary DPI Engine: Market analysis and signal generation');
        console.log(' Taleb Barbell: Antifragile portfolio allocation');
        console.log(' Kelly Criterion: Optimal position sizing');
        console.log(' Risk Monitor: Real-time P(ruin) calculations');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(' Failed to initialize systems:', errorMessage);
        setError(errorMessage);
      }
    };

    initializeSystems();

    // Cleanup on unmount
    return () => {
      if (garyEngine.current) garyEngine.current.stop();
      if (talebEngine.current) talebEngine.current.stop();
      if (kellyEngine.current) kellyEngine.current.stop();
      if (riskMonitor.current) riskMonitor.current.shutdown();
    };
  }, []);

  /**
   * Set up Gary DPI Engine event handlers
   */
  const setupGaryEventHandlers = useCallback(() => {
    if (!garyEngine.current) return;

    const engine = garyEngine.current;

    engine.on('signals', (signals: DPISignal[]) => {
      setGaryData(prev => ({ ...prev, signals }));
      setSystemStatus(prev => ({
        ...prev,
        gary: { ...prev.gary, signalsCount: signals.length, lastUpdate: Date.now() }
      }));
    });

    engine.on('marketUpdate', (data) => {
      setGaryData(prev => ({
        ...prev,
        condition: data.condition,
        portfolio: data.portfolio
      }));

      // Update recommendations
      const recommendations = engine.getPositionRecommendations();
      setGaryData(prev => ({ ...prev, recommendations }));

      setSystemStatus(prev => ({
        ...prev,
        gary: { ...prev.gary, running: true, lastUpdate: Date.now() }
      }));
    });

    engine.on('started', () => {
      setSystemStatus(prev => ({
        ...prev,
        gary: { ...prev.gary, running: true }
      }));
    });

    engine.on('error', (error: Error) => {
      console.error('Gary DPI Engine error:', error);
      setSystemStatus(prev => ({
        ...prev,
        gary: { ...prev.gary, running: false }
      }));
    });

  }, []);

  /**
   * Set up Taleb Barbell Engine event handlers
   */
  const setupTalebEventHandlers = useCallback(() => {
    if (!talebEngine.current) return;

    const engine = talebEngine.current;

    engine.on('barbellUpdate', (data) => {
      setTalebData(prev => ({
        ...prev,
        allocation: data.allocation,
        regime: data.regime
      }));

      setSystemStatus(prev => ({
        ...prev,
        taleb: {
          running: true,
          lastUpdate: Date.now(),
          antifragility: data.allocation.antifragilityScore
        }
      }));
    });

    engine.on('rebalanceRecommendation', (recommendation: RebalanceRecommendation) => {
      setTalebData(prev => ({ ...prev, rebalanceRec: recommendation }));
    });

    engine.on('started', () => {
      setSystemStatus(prev => ({
        ...prev,
        taleb: { ...prev.taleb, running: true }
      }));
    });

    engine.on('error', (error: Error) => {
      console.error('Taleb Barbell Engine error:', error);
      setSystemStatus(prev => ({
        ...prev,
        taleb: { ...prev.taleb, running: false }
      }));
    });

  }, []);

  /**
   * Set up Kelly Criterion Engine event handlers
   */
  const setupKellyEventHandlers = useCallback(() => {
    if (!kellyEngine.current) return;

    const engine = kellyEngine.current;

    engine.on('kellyUpdate', (data) => {
      setKellyData({
        portfolio: data.portfolio,
        positions: data.portfolio.positions,
        opportunities: data.opportunities
      });

      setSystemStatus(prev => ({
        ...prev,
        kelly: {
          running: true,
          lastUpdate: Date.now(),
          totalPositions: data.portfolio.positions.length
        }
      }));
    });

    engine.on('started', () => {
      setSystemStatus(prev => ({
        ...prev,
        kelly: { ...prev.kelly, running: true }
      }));
    });

    engine.on('error', (error: Error) => {
      console.error('Kelly Criterion Engine error:', error);
      setSystemStatus(prev => ({
        ...prev,
        kelly: { ...prev.kelly, running: false }
      }));
    });

  }, []);

  /**
   * Set up Risk Monitor event handlers
   */
  const setupRiskEventHandlers = useCallback(() => {
    if (!riskMonitor.current) return;

    const monitor = riskMonitor.current;

    monitor.on('riskUpdate', (data) => {
      const dashboardState = monitor.getDashboardState();
      setRiskData({
        metrics: data.metrics,
        alerts: dashboardState.activeAlerts,
        dashboardState
      });

      setSystemStatus(prev => ({
        ...prev,
        risk: {
          running: true,
          lastUpdate: Date.now(),
          pRuin: data.metrics.pRuin.value
        }
      }));
    });

    monitor.on('alert', (alert: RiskAlert) => {
      setRiskData(prev => ({
        ...prev,
        alerts: [...prev.alerts, alert]
      }));
    });

  }, []);

  /**
   * Get system health status
   */
  const getSystemHealth = (): 'HEALTHY' | 'WARNING' | 'CRITICAL' => {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds

    const systems = Object.values(systemStatus);
    const runningCount = systems.filter(s => s.running).length;
    const staleCount = systems.filter(s => now - s.lastUpdate > staleThreshold).length;

    if (runningCount === systems.length && staleCount === 0) {
      return 'HEALTHY';
    } else if (runningCount >= systems.length / 2) {
      return 'WARNING';
    } else {
      return 'CRITICAL';
    }
  };

  // Loading state
  if (!isInitialized) {
    return (
      <div className={`min-h-screen bg-gray-100 ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <div className="text-xl font-bold text-gray-800 mb-2">Initializing Division 4</div>
            <div className="text-lg text-gray-700 mb-4">Risk Monitoring Dashboard</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div> Starting Gary's DPI Engine...</div>
              <div> Loading Taleb's Barbell Strategy...</div>
              <div> Initializing Kelly Criterion...</div>
              <div> Connecting Real-time Risk Monitor...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-100 ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4"></div>
            <div className="text-xl font-semibold text-gray-800 mb-2">Division 4 System Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Restart Systems
            </button>
          </div>
        </div>
      </div>
    );
  }

  const systemHealth = getSystemHealth();

  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Division 4: Integrated Risk Monitor
              </h1>
              <div className="text-sm text-gray-500">
                GaryTalebKelly Real-Time Dashboard
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* System Health Indicator */}
              <div className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  systemHealth === 'HEALTHY' ? 'bg-green-500' :
                  systemHealth === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">{systemHealth}</span>
              </div>

              {/* Active Systems Count */}
              <div className="text-sm text-gray-600">
                {Object.values(systemStatus).filter(s => s.running).length}/4 Systems Active
              </div>

              {/* Current Time */}
              <div className="text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">

          {/* System Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Gary DPI Status */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: COLORS.GARY.primary }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Gary DPI</h3>
                <div className={`w-2 h-2 rounded-full ${systemStatus.gary.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="text-2xl font-bold" style={{ color: COLORS.GARY.primary }}>
                {systemStatus.gary.signalsCount}
              </div>
              <div className="text-sm text-gray-600">Active Signals</div>
              <div className="text-xs text-gray-500 mt-1">
                {garyData.condition?.marketRegime || 'Loading...'}
              </div>
            </div>

            {/* Taleb Barbell Status */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: COLORS.TALEB.primary }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Taleb Barbell</h3>
                <div className={`w-2 h-2 rounded-full ${systemStatus.taleb.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="text-2xl font-bold" style={{ color: COLORS.TALEB.primary }}>
                {(systemStatus.taleb.antifragility * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Antifragility</div>
              <div className="text-xs text-gray-500 mt-1">
                {talebData.regime?.regime || 'Loading...'}
              </div>
            </div>

            {/* Kelly Criterion Status */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: COLORS.KELLY.primary }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Kelly Criterion</h3>
                <div className={`w-2 h-2 rounded-full ${systemStatus.kelly.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="text-2xl font-bold" style={{ color: COLORS.KELLY.primary }}>
                {systemStatus.kelly.totalPositions}
              </div>
              <div className="text-sm text-gray-600">Positions</div>
              <div className="text-xs text-gray-500 mt-1">
                {kellyData.portfolio?.adjustedKellyPercent ? `${(kellyData.portfolio.adjustedKellyPercent * 100).toFixed(1)}% Allocated` : 'Loading...'}
              </div>
            </div>

            {/* P(ruin) Status */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: COLORS.RISK.CRITICAL }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">P(ruin)</h3>
                <div className={`w-2 h-2 rounded-full ${systemStatus.risk.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="text-2xl font-bold" style={{ color: COLORS.RISK.CRITICAL }}>
                {(systemStatus.risk.pRuin * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Probability of Ruin</div>
              <div className="text-xs text-gray-500 mt-1">
                {riskData.alerts.length} Active Alerts
              </div>
            </div>

          </div>

          {/* Main P(ruin) Display */}
          {riskData.metrics && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Real-Time Probability of Ruin
              </h2>
              <div className="text-center">
                <div
                  className="text-6xl font-bold mb-4"
                  style={{ color: riskData.metrics.pRuin.value > 0.1 ? COLORS.RISK.CRITICAL :
                                  riskData.metrics.pRuin.value > 0.05 ? COLORS.RISK.HIGH :
                                  riskData.metrics.pRuin.value > 0.02 ? COLORS.RISK.MEDIUM : COLORS.RISK.LOW }}
                >
                  {(riskData.metrics.pRuin.value * 100).toFixed(3)}%
                </div>
                <div className="text-lg text-gray-600 mb-6">
                  Confidence: {(riskData.metrics.pRuin.confidence * 100).toFixed(1)}%
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <div className="text-gray-600">Portfolio Value</div>
                    <div className="font-semibold text-lg">
                      ${riskData.metrics.pRuin.factors.portfolioValue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Volatility</div>
                    <div className="font-semibold text-lg">
                      {(riskData.metrics.pRuin.factors.volatility * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max Drawdown</div>
                    <div className="font-semibold text-lg">
                      {(riskData.metrics.maxDrawdown * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Time Horizon</div>
                    <div className="font-semibold text-lg">
                      {riskData.metrics.pRuin.factors.timeHorizon} days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Three-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Gary DPI Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.GARY.primary }}>
                   Gary DPI Signals
                </h3>

                {garyData.signals.length > 0 ? (
                  <div className="space-y-3">
                    {garyData.signals.slice(-5).map((signal, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{signal.type}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            signal.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                            signal.riskLevel === 'HIGH' ? 'bg-orange-500' :
                            signal.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {signal.riskLevel}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Strength: {(signal.strength * 100).toFixed(0)}% |
                          Confidence: {(signal.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {signal.reasoning.slice(0, 2).join('; ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2"></div>
                    <div>Analyzing market conditions...</div>
                  </div>
                )}
              </div>

              {/* Market Condition */}
              {garyData.condition.timestamp && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold mb-3">Market Condition</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Trend:</span>
                      <span className="ml-2 font-medium">{garyData.condition.trend}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Regime:</span>
                      <span className="ml-2 font-medium">{garyData.condition.marketRegime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Volatility:</span>
                      <span className="ml-2 font-medium">{(garyData.condition.volatility * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Momentum:</span>
                      <span className="ml-2 font-medium">{(garyData.condition.momentum * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Taleb Barbell Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TALEB.primary }}>
                   Taleb Barbell Strategy
                </h3>

                {talebData.allocation.timestamp ? (
                  <div className="space-y-4">
                    {/* Barbell Visualization */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Safe Assets</span>
                        <span className="font-semibold">{(talebData.allocation.safeAssets.allocation * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${talebData.allocation.safeAssets.allocation * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Risk Assets</span>
                        <span className="font-semibold">{(talebData.allocation.riskAssets.allocation * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full"
                          style={{ width: `${talebData.allocation.riskAssets.allocation * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Antifragility Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                      <div>
                        <span className="text-gray-600">Antifragility:</span>
                        <span className="ml-2 font-medium">{(talebData.allocation.antifragilityScore * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Convexity:</span>
                        <span className="ml-2 font-medium">{(talebData.allocation.totalConvexity * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Rebalance Signal */}
                    {talebData.allocation.rebalanceSignal !== 'NONE' && (
                      <div className={`p-3 rounded-lg ${
                        talebData.allocation.rebalanceSignal === 'CRITICAL' ? 'bg-red-100 border border-red-300' :
                        talebData.allocation.rebalanceSignal === 'MAJOR' ? 'bg-orange-100 border border-orange-300' :
                        'bg-yellow-100 border border-yellow-300'
                      }`}>
                        <div className="font-medium text-sm">
                          {talebData.allocation.rebalanceSignal} Rebalance Required
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2"></div>
                    <div>Optimizing barbell allocation...</div>
                  </div>
                )}
              </div>

              {/* Market Regime */}
              {talebData.regime.timestamp && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold mb-3">Market Regime</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regime:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        talebData.regime.regime === 'CRISIS' ? 'bg-red-100 text-red-800' :
                        talebData.regime.regime === 'STRESS' ? 'bg-orange-100 text-orange-800' :
                        talebData.regime.regime === 'EUPHORIA' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {talebData.regime.regime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volatility:</span>
                      <span className="font-medium">{(talebData.regime.volatility * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Correlations:</span>
                      <span className="font-medium">{(talebData.regime.correlations * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kelly Criterion Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.KELLY.primary }}>
                   Kelly Criterion Positions
                </h3>

                {kellyData.positions.length > 0 ? (
                  <div className="space-y-3">
                    {kellyData.positions.slice(0, 5).map((position, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{position.asset}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            position.urgency === 'CRITICAL' ? 'bg-red-500' :
                            position.urgency === 'HIGH' ? 'bg-orange-500' :
                            position.urgency === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {position.recommendedAction}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Kelly: {(position.kelly * 100).toFixed(1)}% |
                          Current: {(position.currentWeight * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Expected Return: {(position.expectedReturn * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2"></div>
                    <div>Calculating optimal positions...</div>
                  </div>
                )}
              </div>

              {/* Kelly Portfolio Stats */}
              {kellyData.portfolio.timestamp && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold mb-3">Portfolio Statistics</h4>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Kelly:</span>
                      <span className="font-medium">{(kellyData.portfolio.totalKellyPercent * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adjusted:</span>
                      <span className="font-medium">{(kellyData.portfolio.adjustedKellyPercent * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sharpe Ratio:</span>
                      <span className="font-medium">{kellyData.portfolio.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Drawdown:</span>
                      <span className="font-medium">{(kellyData.portfolio.maxDrawdown * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Active Alerts */}
          {riskData.alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                 Active Risk Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riskData.alerts.slice(-6).map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${
                      alert.acknowledged ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                    style={{ borderLeftColor: COLORS.RISK[alert.type as keyof typeof COLORS.RISK] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2 py-1 text-xs font-medium text-white rounded-full"
                        style={{ backgroundColor: COLORS.RISK[alert.type as keyof typeof COLORS.RISK] }}
                      >
                        {alert.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {alert.metric}
                    </div>
                    <div className="text-sm text-gray-700">
                      {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Status */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Division 4 Integrated Risk Dashboard - Phase 2 Complete
            </div>
            <div className="flex items-center space-x-6">
              <span>Gary DPI: {systemStatus.gary.running ? '' : ''}</span>
              <span>Taleb Barbell: {systemStatus.taleb.running ? '' : ''}</span>
              <span>Kelly Criterion: {systemStatus.kelly.running ? '' : ''}</span>
              <span>Risk Monitor: {systemStatus.risk.running ? '' : ''}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default IntegratedRiskDashboard;
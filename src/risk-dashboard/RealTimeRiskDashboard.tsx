/**
 * Real-Time Risk Dashboard
 * Main dashboard component that orchestrates all risk monitoring components
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiskMonitoringDashboard,
  RiskMetrics,
  RiskAlert,
  DashboardState,
  AlertConfiguration
} from './RiskMonitoringDashboard';
import {
  ProbabilityOfRuinDisplay,
  RiskMetricsDashboard,
  PRuinChart,
  RiskDistributionChart,
  AlertPanel,
  PerformanceMonitor,
  RiskHeatmap
} from './RiskVisualizationComponents';

interface DashboardProps {
  config?: Partial<AlertConfiguration>;
  className?: string;
}

interface DashboardConfig {
  refreshRate: number;
  historyLength: number;
  alertThresholds: {
    pRuinCritical: number;
    pRuinHigh: number;
    volatilityCritical: number;
    drawdownCritical: number;
  };
}

/**
 * Main Real-Time Risk Dashboard Component
 */
export const RealTimeRiskDashboard: React.FC<DashboardProps> = ({
  config,
  className = ''
}) => {
  // Dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskMetrics[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<RiskAlert[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration state
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    refreshRate: 1000,
    historyLength: 300, // 5 minutes at 1s intervals
    alertThresholds: {
      pRuinCritical: 0.10,
      pRuinHigh: 0.05,
      volatilityCritical: 0.25,
      drawdownCritical: 0.20
    }
  });
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    updateLatency: 0,
    calculationTime: 0,
    renderTime: 0,
    updatesPerSecond: 0
  });
  
  // Refs
  const riskMonitor = useRef<RiskMonitoringDashboard | null>(null);
  const updateCounter = useRef(0);
  const lastSecondTime = useRef(Date.now());
  
  /**
   * Initialize risk monitoring dashboard
   */
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log(' Initializing Real-Time Risk Dashboard...');
        
        // Create risk monitoring instance
        riskMonitor.current = new RiskMonitoringDashboard(config);
        
        // Set up event handlers
        setupEventHandlers();
        
        // Initialize the dashboard
        await riskMonitor.current.initialize();
        
        setIsInitialized(true);
        setError(null);
        
        console.log(' Real-Time Risk Dashboard initialized successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(' Failed to initialize dashboard:', errorMessage);
        setError(errorMessage);
      }
    };
    
    initializeDashboard();
    
    // Cleanup on unmount
    return () => {
      if (riskMonitor.current) {
        riskMonitor.current.shutdown();
      }
    };
  }, [config]);
  
  /**
   * Set up event handlers for risk monitoring
   */
  const setupEventHandlers = useCallback(() => {
    if (!riskMonitor.current) return;
    
    const monitor = riskMonitor.current;
    
    // Handle risk updates
    monitor.on('riskUpdate', (data) => {
      updateCounter.current++;
      
      // Update dashboard state
      const state = monitor.getDashboardState();
      setDashboardState(state);
      
      // Update risk history
      setRiskHistory(prev => {
        const newHistory = [...prev, data.metrics];
        return newHistory.slice(-dashboardConfig.historyLength);
      });
      
      // Update performance metrics
      updatePerformanceMetrics(data.processingTime);
    });
    
    // Handle alerts
    monitor.on('alert', (alert: RiskAlert) => {
      setActiveAlerts(prev => [...prev, alert]);
    });
    
    // Handle connection events
    monitor.on('connected', () => {
      console.log(' Connected to risk data stream');
    });
    
    monitor.on('disconnected', () => {
      console.log(' Disconnected from risk data stream');
    });
    
    // Handle errors
    monitor.on('error', (err: Error) => {
      console.error('Dashboard error:', err);
      setError(err.message);
    });
    
    // Handle render events
    monitor.on('render', (renderData) => {
      // Update render performance if needed
    });
    
  }, [dashboardConfig.historyLength]);
  
  /**
   * Update performance metrics
   */
  const updatePerformanceMetrics = useCallback((processingTime: number) => {
    const now = Date.now();
    
    // Calculate updates per second
    if (now - lastSecondTime.current >= 1000) {
      const updatesPerSecond = updateCounter.current;
      updateCounter.current = 0;
      lastSecondTime.current = now;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        updatesPerSecond,
        updateLatency: processingTime,
        calculationTime: processingTime
      }));
    }
  }, []);
  
  /**
   * Acknowledge alert
   */
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    if (riskMonitor.current) {
      const acknowledged = riskMonitor.current.acknowledgeAlert(alertId);
      if (acknowledged) {
        setActiveAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, acknowledged: true }
              : alert
          )
        );
      }
    }
  }, []);
  
  /**
   * Update dashboard configuration
   */
  const updateConfiguration = useCallback((newConfig: Partial<DashboardConfig>) => {
    setDashboardConfig(prev => ({ ...prev, ...newConfig }));
    
    if (riskMonitor.current && newConfig.refreshRate) {
      riskMonitor.current.setRefreshRate(newConfig.refreshRate);
    }
  }, []);
  
  /**
   * Get current risk metrics
   */
  const getCurrentMetrics = (): RiskMetrics | null => {
    return riskMonitor.current ? riskMonitor.current.getCurrentRiskMetrics() : null;
  };
  
  // Loading state
  if (!isInitialized) {
    return (
      <div className={`min-h-screen bg-gray-100 ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">Initializing Risk Dashboard...</div>
            <div className="text-sm text-gray-500 mt-2">Connecting to risk monitoring systems</div>
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
            <div className="text-xl font-semibold text-gray-800 mb-2">Dashboard Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentMetrics = getCurrentMetrics();
  
  if (!currentMetrics || !dashboardState) {
    return (
      <div className={`min-h-screen bg-gray-100 ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Waiting for risk data...</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                GaryTaleb Risk Monitor
              </h1>
              <div className="ml-4 text-sm text-gray-500">
                Phase 2 Division 4: Real-Time Risk Monitoring
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  dashboardState.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-600">
                  {dashboardState.isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
              
              {/* Performance */}
              <div className="text-sm text-gray-600">
                {performanceMetrics.updatesPerSecond} ups
              </div>
              
              {/* Last Update */}
              <div className="text-sm text-gray-500">
                {new Date(dashboardState.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Top Row: P(ruin) Display and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ProbabilityOfRuinDisplay 
                pRuin={currentMetrics.pRuin}
                className="h-full"
              />
            </div>
            <div>
              <PerformanceMonitor 
                performance={performanceMetrics}
                isConnected={dashboardState.isConnected}
                lastUpdate={dashboardState.lastUpdate}
                className="h-full"
              />
            </div>
          </div>
          
          {/* Risk Metrics Grid */}
          <RiskMetricsDashboard metrics={currentMetrics} />
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PRuinChart history={riskHistory} />
            <RiskDistributionChart metrics={currentMetrics} />
          </div>
          
          {/* Bottom Row: Alerts and Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AlertPanel 
                alerts={activeAlerts}
                onAcknowledge={handleAcknowledgeAlert}
              />
            </div>
            <div>
              <RiskHeatmap metrics={currentMetrics} />
            </div>
          </div>
          
        </div>
      </main>
      
      {/* Configuration Panel (Hidden by default) */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white rounded-lg shadow-lg p-4 text-sm">
          <div className="text-gray-600 mb-2">Dashboard Config</div>
          <div className="space-y-1">
            <div>Refresh: {dashboardConfig.refreshRate}ms</div>
            <div>History: {dashboardConfig.historyLength} points</div>
            <div>P(ruin) Critical: {(dashboardConfig.alertThresholds.pRuinCritical * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default RealTimeRiskDashboard;
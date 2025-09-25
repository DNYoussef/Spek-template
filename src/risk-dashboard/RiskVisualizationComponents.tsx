/**
 * Risk Visualization Components
 * Real-time charts and displays for risk monitoring dashboard
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { RiskMetrics, RiskAlert, ProbabilityOfRuin } from './RiskMonitoringDashboard';

// Color scheme for risk levels
const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#65a30d',
  VERY_LOW: '#16a34a'
};

const ALERT_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#65a30d'
};

/**
 * P(ruin) Display Component
 */
export const ProbabilityOfRuinDisplay: React.FC<{
  pRuin: ProbabilityOfRuin;
  className?: string;
}> = ({ pRuin, className = '' }) => {
  const percentage = (pRuin.value * 100).toFixed(2);
  const confidence = (pRuin.confidence * 100).toFixed(1);
  
  const getRiskLevel = (value: number) => {
    if (value >= 0.10) return 'CRITICAL';
    if (value >= 0.05) return 'HIGH';
    if (value >= 0.02) return 'MEDIUM';
    return 'LOW';
  };
  
  const riskLevel = getRiskLevel(pRuin.value);
  const color = RISK_COLORS[riskLevel as keyof typeof RISK_COLORS];
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Probability of Ruin</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium text-white`} 
             style={{ backgroundColor: color }}>
          {riskLevel}
        </div>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold mb-2" style={{ color }}>
          {percentage}%
        </div>
        <div className="text-sm text-gray-600">
          Confidence: {confidence}%
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Portfolio Value</div>
          <div className="font-semibold">
            ${pRuin.factors.portfolioValue.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-600">Volatility</div>
          <div className="font-semibold">
            {(pRuin.factors.volatility * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-600">Drawdown Threshold</div>
          <div className="font-semibold">
            {(pRuin.factors.drawdownThreshold * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-600">Time Horizon</div>
          <div className="font-semibold">
            {pRuin.factors.timeHorizon} days
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(pRuin.calculationTime).toLocaleTimeString()}
      </div>
    </div>
  );
};

/**
 * Real-time Risk Metrics Dashboard
 */
export const RiskMetricsDashboard: React.FC<{
  metrics: RiskMetrics;
  className?: string;
}> = ({ metrics, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* P(ruin) Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Probability of Ruin</div>
        <div className="text-2xl font-bold text-red-600">
          {(metrics.pRuin.value * 100).toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500">
          Confidence: {(metrics.pRuin.confidence * 100).toFixed(1)}%
        </div>
      </div>
      
      {/* Volatility Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Volatility</div>
        <div className="text-2xl font-bold text-orange-600">
          {(metrics.volatility * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Annualized</div>
      </div>
      
      {/* Sharpe Ratio Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
        <div className="text-2xl font-bold text-blue-600">
          {metrics.sharpeRatio.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">Risk-adjusted return</div>
      </div>
      
      {/* Max Drawdown Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
        <div className="text-2xl font-bold text-red-600">
          {(metrics.maxDrawdown * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Maximum loss</div>
      </div>
      
      {/* Value at Risk Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Value at Risk</div>
        <div className="text-2xl font-bold text-purple-600">
          {(metrics.valueAtRisk * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">95% confidence</div>
      </div>
      
      {/* Conditional VaR Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Conditional VaR</div>
        <div className="text-2xl font-bold text-purple-800">
          {(metrics.conditionalVAR * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Expected shortfall</div>
      </div>
      
      {/* Beta Stability Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Beta Stability</div>
        <div className="text-2xl font-bold text-indigo-600">
          {(metrics.betaStability * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Market correlation</div>
      </div>
      
      {/* Antifragility Index Card */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Antifragility Index</div>
        <div className="text-2xl font-bold text-green-600">
          {(metrics.antifragilityIndex * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Tail convexity</div>
      </div>
    </div>
  );
};

/**
 * Real-time P(ruin) Chart
 */
export const PRuinChart: React.FC<{
  history: RiskMetrics[];
  className?: string;
}> = ({ history, className = '' }) => {
  const chartData = history.map((metrics, index) => ({
    time: new Date(metrics.pRuin.calculationTime).toLocaleTimeString(),
    pRuin: metrics.pRuin.value * 100,
    confidence: metrics.pRuin.confidence * 100,
    timestamp: metrics.pRuin.calculationTime
  })).slice(-50); // Last 50 data points
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Probability of Ruin Trend
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            label={{ value: 'P(ruin) %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'pRuin' ? `${value.toFixed(2)}%` : `${value.toFixed(1)}%`,
              name === 'pRuin' ? 'P(ruin)' : 'Confidence'
            ]}
            labelFormatter={(time) => `Time: ${time}`}
          />
          <Legend />
          
          {/* Critical threshold line */}
          <ReferenceLine y={10} stroke="#dc2626" strokeDasharray="5 5" />
          <ReferenceLine y={5} stroke="#ea580c" strokeDasharray="5 5" />
          <ReferenceLine y={2} stroke="#d97706" strokeDasharray="5 5" />
          
          <Line 
            type="monotone" 
            dataKey="pRuin" 
            stroke="#dc2626" 
            strokeWidth={2}
            name="P(ruin)"
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
          />
          
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="#2563eb" 
            strokeWidth={1}
            name="Confidence"
            dot={{ fill: '#2563eb', strokeWidth: 1, r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Risk Distribution Chart
 */
export const RiskDistributionChart: React.FC<{
  metrics: RiskMetrics;
  className?: string;
}> = ({ metrics, className = '' }) => {
  const distributionData = [
    { name: 'P(ruin)', value: metrics.pRuin.value * 100, color: RISK_COLORS.CRITICAL },
    { name: 'Volatility', value: metrics.volatility * 100, color: RISK_COLORS.HIGH },
    { name: 'Max Drawdown', value: metrics.maxDrawdown * 100, color: RISK_COLORS.MEDIUM },
    { name: 'VaR', value: metrics.valueAtRisk * 100, color: RISK_COLORS.LOW }
  ];
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Risk Distribution
      </h3>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Risk Level']}
          />
          
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Alert Panel Component
 */
export const AlertPanel: React.FC<{
  alerts: RiskAlert[];
  onAcknowledge: (alertId: string) => void;
  className?: string;
}> = ({ alerts, onAcknowledge, className = '' }) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priorityOrder[b.type] - priorityOrder[a.type];
  });
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Active Alerts</h3>
        <div className="text-sm text-gray-600">
          {alerts.length} active
        </div>
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2"></div>
          <div>No active alerts</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`border-l-4 p-4 rounded-r-lg ${
                alert.acknowledged ? 'bg-gray-50 opacity-75' : 'bg-white'
              }`}
              style={{ borderLeftColor: ALERT_COLORS[alert.type] }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span 
                      className="px-2 py-1 text-xs font-medium text-white rounded-full mr-2"
                      style={{ backgroundColor: ALERT_COLORS[alert.type] }}
                    >
                      {alert.type}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {alert.metric}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">
                    {alert.message}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span>
                      Value: {alert.value.toFixed(4)}
                    </span>
                    <span>
                      Threshold: {alert.threshold.toFixed(4)}
                    </span>
                    <span>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="ml-4 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Performance Monitor Component
 */
export const PerformanceMonitor: React.FC<{
  performance: {
    updateLatency: number;
    calculationTime: number;
    renderTime: number;
  };
  isConnected: boolean;
  lastUpdate: number;
  className?: string;
}> = ({ performance, isConnected, lastUpdate, className = '' }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / 1000);
  
  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'Disconnected', color: 'text-red-600' };
    if (timeSinceUpdate > 5) return { text: 'Stale', color: 'text-yellow-600' };
    return { text: 'Live', color: 'text-green-600' };
  };
  
  const status = getConnectionStatus();
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-800 mb-3">System Status</h4>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-600">Connection</div>
          <div className={`font-medium ${status.color}`}>
            {status.text}
          </div>
        </div>
        
        <div>
          <div className="text-gray-600">Last Update</div>
          <div className="font-medium text-gray-900">
            {timeSinceUpdate}s ago
          </div>
        </div>
        
        <div>
          <div className="text-gray-600">Update Latency</div>
          <div className="font-medium text-gray-900">
            {performance.updateLatency.toFixed(1)}ms
          </div>
        </div>
        
        <div>
          <div className="text-gray-600">Render Time</div>
          <div className="font-medium text-gray-900">
            {performance.renderTime.toFixed(1)}ms
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          Real-time monitoring {isConnected ? 'active' : 'inactive'}
        </div>
      </div>
    </div>
  );
};

/**
 * Risk Heatmap Component
 */
export const RiskHeatmap: React.FC<{
  metrics: RiskMetrics;
  className?: string;
}> = ({ metrics, className = '' }) => {
  const getRiskLevel = (value: number, thresholds: { critical: number, high: number, medium: number }) => {
    if (value >= thresholds.critical) return 'CRITICAL';
    if (value >= thresholds.high) return 'HIGH';
    if (value >= thresholds.medium) return 'MEDIUM';
    return 'LOW';
  };
  
  const heatmapData = [
    {
      name: 'P(ruin)',
      value: metrics.pRuin.value,
      level: getRiskLevel(metrics.pRuin.value, { critical: 0.10, high: 0.05, medium: 0.02 }),
      display: `${(metrics.pRuin.value * 100).toFixed(2)}%`
    },
    {
      name: 'Volatility',
      value: metrics.volatility,
      level: getRiskLevel(metrics.volatility, { critical: 0.25, high: 0.20, medium: 0.15 }),
      display: `${(metrics.volatility * 100).toFixed(1)}%`
    },
    {
      name: 'Max Drawdown',
      value: metrics.maxDrawdown,
      level: getRiskLevel(metrics.maxDrawdown, { critical: 0.20, high: 0.15, medium: 0.10 }),
      display: `${(metrics.maxDrawdown * 100).toFixed(1)}%`
    },
    {
      name: 'VaR',
      value: metrics.valueAtRisk,
      level: getRiskLevel(metrics.valueAtRisk, { critical: 0.10, high: 0.08, medium: 0.05 }),
      display: `${(metrics.valueAtRisk * 100).toFixed(1)}%`
    }
  ];
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Heatmap</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {heatmapData.map((item) => (
          <div
            key={item.name}
            className="p-4 rounded-lg text-center transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: RISK_COLORS[item.level as keyof typeof RISK_COLORS],
              color: 'white'
            }}
          >
            <div className="text-sm font-medium mb-1">{item.name}</div>
            <div className="text-xl font-bold">{item.display}</div>
            <div className="text-xs opacity-80">{item.level}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  ProbabilityOfRuinDisplay,
  RiskMetricsDashboard,
  PRuinChart,
  RiskDistributionChart,
  AlertPanel,
  PerformanceMonitor,
  RiskHeatmap
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Risk Visualization Components
 * Real-time charts and displays for risk monitoring dashboard
 */
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
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
export const ProbabilityOfRuinDisplay = ({ pRuin, className = '' }) => {
    const percentage = (pRuin.value * 100).toFixed(2);
    const confidence = (pRuin.confidence * 100).toFixed(1);
    const getRiskLevel = (value) => {
        if (value >= 0.10)
            return 'CRITICAL';
        if (value >= 0.05)
            return 'HIGH';
        if (value >= 0.02)
            return 'MEDIUM';
        return 'LOW';
    };
    const riskLevel = getRiskLevel(pRuin.value);
    const color = RISK_COLORS[riskLevel];
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-6 ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Probability of Ruin" }), _jsx("div", { className: `px-3 py-1 rounded-full text-sm font-medium text-white`, style: { backgroundColor: color }, children: riskLevel })] }), _jsxs("div", { className: "text-center mb-6", children: [_jsxs("div", { className: "text-4xl font-bold mb-2", style: { color }, children: [percentage, "%"] }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Confidence: ", confidence, "%"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Portfolio Value" }), _jsxs("div", { className: "font-semibold", children: ["$", pRuin.factors.portfolioValue.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Volatility" }), _jsxs("div", { className: "font-semibold", children: [(pRuin.factors.volatility * 100).toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Drawdown Threshold" }), _jsxs("div", { className: "font-semibold", children: [(pRuin.factors.drawdownThreshold * 100).toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Time Horizon" }), _jsxs("div", { className: "font-semibold", children: [pRuin.factors.timeHorizon, " days"] })] })] }), _jsxs("div", { className: "mt-4 text-xs text-gray-500", children: ["Last updated: ", new Date(pRuin.calculationTime).toLocaleTimeString()] })] }));
};
/**
 * Real-time Risk Metrics Dashboard
 */
export const RiskMetricsDashboard = ({ metrics, className = '' }) => {
    return (_jsxs("div", { className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`, children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Probability of Ruin" }), _jsxs("div", { className: "text-2xl font-bold text-red-600", children: [(metrics.pRuin.value * 100).toFixed(2), "%"] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Confidence: ", (metrics.pRuin.confidence * 100).toFixed(1), "%"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Volatility" }), _jsxs("div", { className: "text-2xl font-bold text-orange-600", children: [(metrics.volatility * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Annualized" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Sharpe Ratio" }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: metrics.sharpeRatio.toFixed(2) }), _jsx("div", { className: "text-xs text-gray-500", children: "Risk-adjusted return" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Max Drawdown" }), _jsxs("div", { className: "text-2xl font-bold text-red-600", children: [(metrics.maxDrawdown * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Maximum loss" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Value at Risk" }), _jsxs("div", { className: "text-2xl font-bold text-purple-600", children: [(metrics.valueAtRisk * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "95% confidence" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Conditional VaR" }), _jsxs("div", { className: "text-2xl font-bold text-purple-800", children: [(metrics.conditionalVAR * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Expected shortfall" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Beta Stability" }), _jsxs("div", { className: "text-2xl font-bold text-indigo-600", children: [(metrics.betaStability * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Market correlation" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Antifragility Index" }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: [(metrics.antifragilityIndex * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Tail convexity" })] })] }));
};
/**
 * Real-time P(ruin) Chart
 */
export const PRuinChart = ({ history, className = '' }) => {
    const chartData = history.map((metrics, index) => ({
        time: new Date(metrics.pRuin.calculationTime).toLocaleTimeString(),
        pRuin: metrics.pRuin.value * 100,
        confidence: metrics.pRuin.confidence * 100,
        timestamp: metrics.pRuin.calculationTime
    })).slice(-50); // Last 50 data points
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-6 ${className}`, children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Probability of Ruin Trend" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "time", stroke: "#666", fontSize: 12 }), _jsx(YAxis, { stroke: "#666", fontSize: 12, label: { value: 'P(ruin) %', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { formatter: (value, name) => [
                                name === 'pRuin' ? `${value.toFixed(2)}%` : `${value.toFixed(1)}%`,
                                name === 'pRuin' ? 'P(ruin)' : 'Confidence'
                            ], labelFormatter: (time) => `Time: ${time}` }), _jsx(Legend, {}), _jsx(ReferenceLine, { y: 10, stroke: "#dc2626", strokeDasharray: "5 5" }), _jsx(ReferenceLine, { y: 5, stroke: "#ea580c", strokeDasharray: "5 5" }), _jsx(ReferenceLine, { y: 2, stroke: "#d97706", strokeDasharray: "5 5" }), _jsx(Line, { type: "monotone", dataKey: "pRuin", stroke: "#dc2626", strokeWidth: 2, name: "P(ruin)", dot: { fill: '#dc2626', strokeWidth: 2, r: 3 } }), _jsx(Line, { type: "monotone", dataKey: "confidence", stroke: "#2563eb", strokeWidth: 1, name: "Confidence", dot: { fill: '#2563eb', strokeWidth: 1, r: 2 } })] }) })] }));
};
/**
 * Risk Distribution Chart
 */
export const RiskDistributionChart = ({ metrics, className = '' }) => {
    const distributionData = [
        { name: 'P(ruin)', value: metrics.pRuin.value * 100, color: RISK_COLORS.CRITICAL },
        { name: 'Volatility', value: metrics.volatility * 100, color: RISK_COLORS.HIGH },
        { name: 'Max Drawdown', value: metrics.maxDrawdown * 100, color: RISK_COLORS.MEDIUM },
        { name: 'VaR', value: metrics.valueAtRisk * 100, color: RISK_COLORS.LOW }
    ];
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-6 ${className}`, children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Risk Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: distributionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "name", stroke: "#666", fontSize: 12 }), _jsx(YAxis, { stroke: "#666", fontSize: 12, label: { value: 'Percentage (%)', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { formatter: (value) => [`${value.toFixed(2)}%`, 'Risk Level'] }), _jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: distributionData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) })] }) })] }));
};
/**
 * Alert Panel Component
 */
export const AlertPanel = ({ alerts, onAcknowledge, className = '' }) => {
    const sortedAlerts = [...alerts].sort((a, b) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.type] - priorityOrder[a.type];
    });
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-6 ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Active Alerts" }), _jsxs("div", { className: "text-sm text-gray-600", children: [alerts.length, " active"] })] }), alerts.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx("div", { className: "text-2xl mb-2", children: "\u2713" }), _jsx("div", { children: "No active alerts" })] })) : (_jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: sortedAlerts.map((alert) => (_jsx("div", { className: `border-l-4 p-4 rounded-r-lg ${alert.acknowledged ? 'bg-gray-50 opacity-75' : 'bg-white'}`, style: { borderLeftColor: ALERT_COLORS[alert.type] }, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx("span", { className: "px-2 py-1 text-xs font-medium text-white rounded-full mr-2", style: { backgroundColor: ALERT_COLORS[alert.type] }, children: alert.type }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: alert.metric })] }), _jsx("div", { className: "text-sm text-gray-700 mb-2", children: alert.message }), _jsxs("div", { className: "flex items-center text-xs text-gray-500 space-x-4", children: [_jsxs("span", { children: ["Value: ", alert.value.toFixed(4)] }), _jsxs("span", { children: ["Threshold: ", alert.threshold.toFixed(4)] }), _jsx("span", { children: new Date(alert.timestamp).toLocaleTimeString() })] })] }), !alert.acknowledged && (_jsx("button", { onClick: () => onAcknowledge(alert.id), className: "ml-4 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors", children: "Acknowledge" }))] }) }, alert.id))) }))] }));
};
/**
 * Performance Monitor Component
 */
export const PerformanceMonitor = ({ performance, isConnected, lastUpdate, className = '' }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / 1000);
    const getConnectionStatus = () => {
        if (!isConnected)
            return { text: 'Disconnected', color: 'text-red-600' };
        if (timeSinceUpdate > 5)
            return { text: 'Stale', color: 'text-yellow-600' };
        return { text: 'Live', color: 'text-green-600' };
    };
    const status = getConnectionStatus();
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-4 ${className}`, children: [_jsx("h4", { className: "text-sm font-semibold text-gray-800 mb-3", children: "System Status" }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Connection" }), _jsx("div", { className: `font-medium ${status.color}`, children: status.text })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Last Update" }), _jsxs("div", { className: "font-medium text-gray-900", children: [timeSinceUpdate, "s ago"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Update Latency" }), _jsxs("div", { className: "font-medium text-gray-900", children: [performance.updateLatency.toFixed(1), "ms"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-600", children: "Render Time" }), _jsxs("div", { className: "font-medium text-gray-900", children: [performance.renderTime.toFixed(1), "ms"] })] })] }), _jsx("div", { className: "mt-3 pt-3 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx("div", { className: `w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}` }), "Real-time monitoring ", isConnected ? 'active' : 'inactive'] }) })] }));
};
/**
 * Risk Heatmap Component
 */
export const RiskHeatmap = ({ metrics, className = '' }) => {
    const getRiskLevel = (value, thresholds) => {
        if (value >= thresholds.critical)
            return 'CRITICAL';
        if (value >= thresholds.high)
            return 'HIGH';
        if (value >= thresholds.medium)
            return 'MEDIUM';
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
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-lg p-6 ${className}`, children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Risk Heatmap" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: heatmapData.map((item) => (_jsxs("div", { className: "p-4 rounded-lg text-center transition-all duration-200 hover:scale-105", style: {
                        backgroundColor: RISK_COLORS[item.level],
                        color: 'white'
                    }, children: [_jsx("div", { className: "text-sm font-medium mb-1", children: item.name }), _jsx("div", { className: "text-xl font-bold", children: item.display }), _jsx("div", { className: "text-xs opacity-80", children: item.level })] }, item.name))) })] }));
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
//# sourceMappingURL=RiskVisualizationComponents.js.map
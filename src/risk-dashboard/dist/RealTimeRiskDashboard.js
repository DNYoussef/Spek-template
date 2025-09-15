import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Real-Time Risk Dashboard
 * Main dashboard component that orchestrates all risk monitoring components
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { RiskMonitoringDashboard } from './RiskMonitoringDashboard';
import { ProbabilityOfRuinDisplay, RiskMetricsDashboard, PRuinChart, RiskDistributionChart, AlertPanel, PerformanceMonitor, RiskHeatmap } from './RiskVisualizationComponents';
/**
 * Main Real-Time Risk Dashboard Component
 */
export const RealTimeRiskDashboard = ({ config, className = '' }) => {
    // Dashboard state
    const [dashboardState, setDashboardState] = useState(null);
    const [riskHistory, setRiskHistory] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    // Configuration state
    const [dashboardConfig, setDashboardConfig] = useState({
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
    const riskMonitor = useRef(null);
    const updateCounter = useRef(0);
    const lastSecondTime = useRef(Date.now());
    /**
     * Initialize risk monitoring dashboard
     */
    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                console.log('🚀 Initializing Real-Time Risk Dashboard...');
                // Create risk monitoring instance
                riskMonitor.current = new RiskMonitoringDashboard(config);
                // Set up event handlers
                setupEventHandlers();
                // Initialize the dashboard
                await riskMonitor.current.initialize();
                setIsInitialized(true);
                setError(null);
                console.log('✅ Real-Time Risk Dashboard initialized successfully');
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('❌ Failed to initialize dashboard:', errorMessage);
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
        if (!riskMonitor.current)
            return;
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
        monitor.on('alert', (alert) => {
            setActiveAlerts(prev => [...prev, alert]);
        });
        // Handle connection events
        monitor.on('connected', () => {
            console.log('🔗 Connected to risk data stream');
        });
        monitor.on('disconnected', () => {
            console.log('❌ Disconnected from risk data stream');
        });
        // Handle errors
        monitor.on('error', (err) => {
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
    const updatePerformanceMetrics = useCallback((processingTime) => {
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
    const handleAcknowledgeAlert = useCallback((alertId) => {
        if (riskMonitor.current) {
            const acknowledged = riskMonitor.current.acknowledgeAlert(alertId);
            if (acknowledged) {
                setActiveAlerts(prev => prev.map(alert => alert.id === alertId
                    ? { ...alert, acknowledged: true }
                    : alert));
            }
        }
    }, []);
    /**
     * Update dashboard configuration
     */
    const updateConfiguration = useCallback((newConfig) => {
        setDashboardConfig(prev => ({ ...prev, ...newConfig }));
        if (riskMonitor.current && newConfig.refreshRate) {
            riskMonitor.current.setRefreshRate(newConfig.refreshRate);
        }
    }, []);
    /**
     * Get current risk metrics
     */
    const getCurrentMetrics = () => {
        return riskMonitor.current ? riskMonitor.current.getCurrentRiskMetrics() : null;
    };
    // Loading state
    if (!isInitialized) {
        return (_jsx("div", { className: `min-h-screen bg-gray-100 ${className}`, children: _jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("div", { className: "text-lg font-semibold text-gray-700", children: "Initializing Risk Dashboard..." }), _jsx("div", { className: "text-sm text-gray-500 mt-2", children: "Connecting to risk monitoring systems" })] }) }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: `min-h-screen bg-gray-100 ${className}`, children: _jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("div", { className: "text-red-600 text-6xl mb-4", children: "\u26A0" }), _jsx("div", { className: "text-xl font-semibold text-gray-800 mb-2", children: "Dashboard Error" }), _jsx("div", { className: "text-gray-600 mb-4", children: error }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors", children: "Retry" })] }) }) }));
    }
    const currentMetrics = getCurrentMetrics();
    if (!currentMetrics || !dashboardState) {
        return (_jsx("div", { className: `min-h-screen bg-gray-100 ${className}`, children: _jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx("div", { className: "text-center", children: _jsx("div", { className: "text-lg font-semibold text-gray-700", children: "Waiting for risk data..." }) }) }) }));
    }
    return (_jsxs("div", { className: `min-h-screen bg-gray-100 ${className}`, children: [_jsx("header", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Gary\u00D7Taleb Risk Monitor" }), _jsx("div", { className: "ml-4 text-sm text-gray-500", children: "Phase 2 Division 4: Real-Time Risk Monitoring" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center text-sm", children: [_jsx("div", { className: `w-2 h-2 rounded-full mr-2 ${dashboardState.isConnected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-gray-600", children: dashboardState.isConnected ? 'Live' : 'Disconnected' })] }), _jsxs("div", { className: "text-sm text-gray-600", children: [performanceMetrics.updatesPerSecond, " ups"] }), _jsx("div", { className: "text-sm text-gray-500", children: new Date(dashboardState.lastUpdate).toLocaleTimeString() })] })] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "lg:col-span-3", children: _jsx(ProbabilityOfRuinDisplay, { pRuin: currentMetrics.pRuin, className: "h-full" }) }), _jsx("div", { children: _jsx(PerformanceMonitor, { performance: performanceMetrics, isConnected: dashboardState.isConnected, lastUpdate: dashboardState.lastUpdate, className: "h-full" }) })] }), _jsx(RiskMetricsDashboard, { metrics: currentMetrics }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(PRuinChart, { history: riskHistory }), _jsx(RiskDistributionChart, { metrics: currentMetrics })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsx(AlertPanel, { alerts: activeAlerts, onAcknowledge: handleAcknowledgeAlert }) }), _jsx("div", { children: _jsx(RiskHeatmap, { metrics: currentMetrics }) })] })] }) }), _jsx("div", { className: "fixed bottom-4 right-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4 text-sm", children: [_jsx("div", { className: "text-gray-600 mb-2", children: "Dashboard Config" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { children: ["Refresh: ", dashboardConfig.refreshRate, "ms"] }), _jsxs("div", { children: ["History: ", dashboardConfig.historyLength, " points"] }), _jsxs("div", { children: ["P(ruin) Critical: ", (dashboardConfig.alertThresholds.pRuinCritical * 100).toFixed(1), "%"] })] })] }) })] }));
};
export default RealTimeRiskDashboard;
//# sourceMappingURL=RealTimeRiskDashboard.js.map
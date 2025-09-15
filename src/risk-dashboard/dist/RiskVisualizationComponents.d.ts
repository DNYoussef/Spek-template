/**
 * Risk Visualization Components
 * Real-time charts and displays for risk monitoring dashboard
 */
import React from 'react';
import { RiskMetrics, RiskAlert, ProbabilityOfRuin } from './RiskMonitoringDashboard';
/**
 * P(ruin) Display Component
 */
export declare const ProbabilityOfRuinDisplay: React.FC<{
    pRuin: ProbabilityOfRuin;
    className?: string;
}>;
/**
 * Real-time Risk Metrics Dashboard
 */
export declare const RiskMetricsDashboard: React.FC<{
    metrics: RiskMetrics;
    className?: string;
}>;
/**
 * Real-time P(ruin) Chart
 */
export declare const PRuinChart: React.FC<{
    history: RiskMetrics[];
    className?: string;
}>;
/**
 * Risk Distribution Chart
 */
export declare const RiskDistributionChart: React.FC<{
    metrics: RiskMetrics;
    className?: string;
}>;
/**
 * Alert Panel Component
 */
export declare const AlertPanel: React.FC<{
    alerts: RiskAlert[];
    onAcknowledge: (alertId: string) => void;
    className?: string;
}>;
/**
 * Performance Monitor Component
 */
export declare const PerformanceMonitor: React.FC<{
    performance: {
        updateLatency: number;
        calculationTime: number;
        renderTime: number;
    };
    isConnected: boolean;
    lastUpdate: number;
    className?: string;
}>;
/**
 * Risk Heatmap Component
 */
export declare const RiskHeatmap: React.FC<{
    metrics: RiskMetrics;
    className?: string;
}>;
declare const _default: {
    ProbabilityOfRuinDisplay: React.FC<{
        pRuin: ProbabilityOfRuin;
        className?: string;
    }>;
    RiskMetricsDashboard: React.FC<{
        metrics: RiskMetrics;
        className?: string;
    }>;
    PRuinChart: React.FC<{
        history: RiskMetrics[];
        className?: string;
    }>;
    RiskDistributionChart: React.FC<{
        metrics: RiskMetrics;
        className?: string;
    }>;
    AlertPanel: React.FC<{
        alerts: RiskAlert[];
        onAcknowledge: (alertId: string) => void;
        className?: string;
    }>;
    PerformanceMonitor: React.FC<{
        performance: {
            updateLatency: number;
            calculationTime: number;
            renderTime: number;
        };
        isConnected: boolean;
        lastUpdate: number;
        className?: string;
    }>;
    RiskHeatmap: React.FC<{
        metrics: RiskMetrics;
        className?: string;
    }>;
};
export default _default;
//# sourceMappingURL=RiskVisualizationComponents.d.ts.map
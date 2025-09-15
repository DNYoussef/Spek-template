/**
 * Real-Time Risk Monitoring Dashboard
 * Phase 2 Division 4: Comprehensive risk visualization and monitoring
 * Integrates with GaryTaleb antifragility engine and existing risk assessment systems
 */
import { EventEmitter } from 'events';
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
export declare class RiskMonitoringDashboard extends EventEmitter {
    private wsConnection;
    private state;
    private config;
    private updateInterval;
    private performanceTracker;
    private riskCalculator;
    private alertManager;
    constructor(config?: Partial<AlertConfiguration>);
    /**
     * Initialize dashboard and start real-time monitoring
     */
    initialize(): Promise<void>;
    /**
     * Connect to real-time risk data stream
     */
    private connectToRiskStream;
    /**
     * Handle incoming risk data updates
     */
    private handleRiskDataUpdate;
    /**
     * Start real-time dashboard updates
     */
    private startRealTimeUpdates;
    /**
     * Request latest risk calculations
     */
    private requestRiskUpdate;
    /**
     * Update risk state with new metrics
     */
    private updateRiskState;
    /**
     * Check alert conditions and generate alerts
     */
    private checkAlertConditions;
    /**
     * Render dashboard display
     */
    private renderDashboard;
    /**
     * Get current dashboard state
     */
    getDashboardState(): DashboardState;
    /**
     * Get current risk metrics
     */
    getCurrentRiskMetrics(): RiskMetrics;
    /**
     * Get risk history for specified time range
     */
    getRiskHistory(minutes?: number): RiskMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): RiskAlert[];
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId: string): boolean;
    /**
     * Update alert configuration
     */
    updateAlertConfiguration(config: Partial<AlertConfiguration>): void;
    /**
     * Set refresh rate
     */
    setRefreshRate(milliseconds: number): void;
    /**
     * Attempt to reconnect to risk stream
     */
    private attemptReconnection;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Get initial risk metrics
     */
    private getInitialRiskMetrics;
    /**
     * Shutdown dashboard
     */
    shutdown(): Promise<void>;
}
export default RiskMonitoringDashboard;
//# sourceMappingURL=RiskMonitoringDashboard.d.ts.map
/**
 * Risk Monitoring Dashboard Type Definitions
 * Provides comprehensive risk tracking and visualization types
 * NASA Rule 10 Compliant: All interfaces modular, FSM-based enums
 */

import type { RiskScore, Timestamp, RefreshInterval } from '../../types/brands';

/**
 * Risk severity levels enumeration
 * FSM State: Defines discrete risk classification states
 */
export enum RiskLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Risk category classifications
 * FSM State: Defines risk domain categories
 */
export enum RiskCategory {
  TECHNICAL = 'TECHNICAL',
  OPERATIONAL = 'OPERATIONAL',
  SECURITY = 'SECURITY',
  COMPLIANCE = 'COMPLIANCE',
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Dashboard view modes
 * FSM State: Defines dashboard presentation states
 */
export enum DashboardView {
  OVERVIEW = 'OVERVIEW',
  DETAILED = 'DETAILED',
  TRENDS = 'TRENDS',
  ALERTS = 'ALERTS'
}

/**
 * Risk trend direction
 * FSM State: Defines risk trajectory states
 */
export enum RiskTrend {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DEGRADING = 'DEGRADING',
  CRITICAL_CHANGE = 'CRITICAL_CHANGE'
}

/**
 * Individual risk metric data structure
 */
export interface RiskMetric {
  readonly level: RiskLevel;
  readonly category: RiskCategory;
  readonly score: RiskScore;
  readonly trend: RiskTrend;
  readonly timestamp: Timestamp;
  readonly description: string;
  readonly impactedSystems: ReadonlyArray<string>;
}

/**
 * Dashboard configuration settings
 */
export interface DashboardConfig {
  readonly refreshRate: RefreshInterval;
  readonly alertThreshold: RiskScore;
  readonly viewMode: DashboardView;
  readonly enabledCategories: ReadonlyArray<RiskCategory>;
  readonly autoRefresh: boolean;
  readonly notificationsEnabled: boolean;
}

/**
 * Dashboard state data
 */
export interface DashboardState {
  readonly currentView: DashboardView;
  readonly metrics: ReadonlyArray<RiskMetric>;
  readonly lastUpdate: Timestamp;
  readonly config: DashboardConfig;
  readonly activeAlerts: number;
}

/**
 * Risk alert definition
 */
export interface RiskAlert {
  readonly id: string;
  readonly level: RiskLevel;
  readonly category: RiskCategory;
  readonly message: string;
  readonly timestamp: Timestamp;
  readonly acknowledged: boolean;
}

/**
 * Dashboard action types
 * FSM Event: Defines dashboard interaction events
 */
export enum DashboardAction {
  REFRESH = 'REFRESH',
  CHANGE_VIEW = 'CHANGE_VIEW',
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  ACKNOWLEDGE_ALERT = 'ACKNOWLEDGE_ALERT',
  EXPORT_DATA = 'EXPORT_DATA'
}

/**
 * Validates risk level is within defined bounds
 * @param level - Risk level to validate
 * @returns True if valid
 */
export function isValidRiskLevel(level: RiskLevel): boolean {
  const validLevels = Object.values(RiskLevel);
  if (!validLevels.includes(level)) {
    throw new Error(`Invalid risk level: ${level}`);
  }
  return validLevels.includes(level);
}

/**
 * Validates risk category is within defined bounds
 * @param category - Risk category to validate
 * @returns True if valid
 */
export function isValidRiskCategory(category: RiskCategory): boolean {
  const validCategories = Object.values(RiskCategory);
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid risk category: ${category}`);
  }
  return validCategories.includes(category);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:28:00 | base-template-generator@sonnet-4 | Create risk dashboard types | RiskMonitoringDashboard.ts | OK | FSM-compliant with branded types | 0.00 | e4f5g6h |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-dashboard-types
 * - inputs: ["TS2305 errors for RiskMonitoringDashboard"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
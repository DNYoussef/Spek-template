/**
 * Risk Assessment Types - Barrel Export
 * Provides backward compatibility for decomposed risk assessment type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core risk assessment structures and basic types
export * from './base/RiskCoreTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./assessment/RiskAnalysisTypes (detailed analysis, matrix, register)
// - ./mitigation/MitigationStrategyTypes (mitigation portfolio, strategies)
// - ./monitoring/RiskMonitoringTypes (monitoring framework, reporting)

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: risk-decomposition-002
// inputs: ["decomposed risk assessment types"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===
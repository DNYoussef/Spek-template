/**
 * Migration Analysis Types - Barrel Export
 * Provides backward compatibility for decomposed type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Base migration types
export * from './base/MigrationCoreTypes';

// Performance and architecture analysis
export * from './analysis/PerformanceAnalysisTypes';

// Data migration planning
export * from './planning/DataMigrationTypes';

// Compliance and monitoring
export * from './validation/ComplianceMonitoringTypes';

// Remaining types to be extracted (placeholder imports)
// TODO: Create additional decomposed files for remaining 600+ lines:
// - ./reporting/ReportingTypes (impact reports, analysis results)
// - ./optimization/OptimizationTypes (cost-benefit, resource optimization)

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: migration-decomposition-005
// inputs: ["decomposed migration types"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===
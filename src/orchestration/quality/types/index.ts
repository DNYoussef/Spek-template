/**
 * Quality Gate Types - Barrel Export
 * Provides backward compatibility for decomposed quality gate type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core quality gate definitions, criteria, validation, automation
export * from './core/QualityGateDefinitionTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./gates/QualityGateExecutionTypes (execution context, results, metrics)
// - ./execution/QualitySequenceTypes (sequence orchestration, synchronization)

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: quality-decomposition-002
// inputs: ["decomposed quality gate types"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===
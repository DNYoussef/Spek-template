/**
 * Phase Transition Types - Barrel Export
 * Provides backward compatibility for decomposed phase type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core phase definitions, prerequisites, deliverables, quality gates
export * from './core/PhaseDefinitionTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./execution/PhaseExecutionTypes (execution context, progress, metrics)
// - ./validation/PhaseValidationTypes (validation results, transition logic)

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: phase-decomposition-002
// inputs: ["decomposed phase types"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===
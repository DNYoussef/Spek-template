/**
 * Queen Debug Types - Barrel Export
 * Provides backward compatibility for decomposed debug type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core debug domains, princess specializations, drone workers
export * from './core/DebugDomainTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./domains/DebugCapabilityTypes (capability definitions, training)
// - ./audit/DebugAuditTypes (audit stages, evidence, validation)

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: debug-decomposition-002
// inputs: ["decomposed debug types"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===
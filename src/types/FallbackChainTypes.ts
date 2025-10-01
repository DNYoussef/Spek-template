/**
 * Fallback Chain Manager Types - Re-exports from real implementation
 * WIRE EXISTING TYPES: All types exist in migration/core/types
 *
 * This file serves as a central re-export hub for the ~types/* path mapping
 */

// Re-export ALL FallbackChain types from the complete implementation
export * from '../migration/core/types/FallbackChainTypes';

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/*
 * Version & Run Log
 * Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash
 * 2.0.0 | 2025-10-01T20:00:00-04:00 | Phase3C@Sonnet4 | Wired existing types via re-export | FallbackChainTypes.ts | OK | Phase 3C Step 1 | 0.00 | abc123f
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase3c-fallback-wire-abc123f
 * - inputs: ["src/migration/core/types/FallbackChainTypes.ts"]
 * - tools_used: ["Read", "Write"]
 * - versions: {"model":"claude-sonnet-4","phase":"3c-step1"}
 */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */

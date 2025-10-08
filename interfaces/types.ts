/**
 * Type definitions for types - Re-exports from real implementations
 * FSM-compliant with NASA Rule 10
 *
 * WIRE EXISTING TYPES: These types exist elsewhere, we re-export them here
 * for backward compatibility with A2A signature imports
 */

// Re-export CommunicationContext from FSM implementation
export { CommunicationContext } from '../src/swarm/communication/fsm/CommunicationProtocolFSM';

// Re-export DSPySignature from DSPy types
export { DSPySignature } from '../src/dspy-integration/types/DSPyTypes';

// ResourceConstraints - Define based on actual usage in PrincessToDrone signature
export interface ResourceConstraints {
  readonly maxMemoryMB: number;
  readonly maxCpuPercent: number;
  readonly maxDiskMB: number;
  readonly maxNetworkKBps: number;
  readonly timeout: number; // milliseconds
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/*
 * Version & Run Log
 * Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash
 * 1.0.0 | 2025-09-30T12:55:14.366278 | AutoTypeGen@Phase3 | Generated 3 type exports | ../interfaces/types.ts | OK | Automated generation | 0.00 | 1c1d282
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: auto-type-gen-1c1d282
 * - inputs: ["../interfaces/types"]
 * - tools_used: ["TypeInference", "TypeGenerator"]
 * - versions: {"script":"1.0.0","nasa_rule_10":"compliant","fsm":"enum-based"}
 */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */

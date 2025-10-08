/**
 * DebugState.ts - Debug State Type Re-exports
 * @stub true
 * @architecture FSM-based debug state management
 */

// Re-export from controllers/types for ~types/ alias resolution
export {
  DebugState,
  DebugEvent,
  DebugContext,
  isValidDebugState,
  isValidDebugEvent,
  DEBUG_LIMITS,
  AllowedDebugStates,
  AllowedDebugEvents,
  createDebugContext
} from '../controllers/types/DebugState';

// Re-export from swarm/controllers/types for additional types
export { DebugStateContext, StateTransition } from '../swarm/controllers/types/DebugState';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===

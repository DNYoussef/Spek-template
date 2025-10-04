/**
 * DebugState - FSM-compliant debug state management
 * NASA Rule 10 compliant with proper enum definitions
 */
// Re-export from main debug types for compatibility
export {
  DebugState,
  DebugEvent,
  isValidDebugState,
  isValidDebugEvent,
  DEBUG_LIMITS,
  AllowedDebugStates,
  AllowedDebugEvents
} from '../../debug/queen/components/QueenDebugTypes';
export interface DebugContext {
  sessionId: string;
  currentState: DebugState;
  previousState?: DebugState;
  transitionHistory: Array<{
    from: DebugState;
    to: DebugState;
    event: DebugEvent;
    timestamp: number;
  }>;
  metadata: Record<string, unknown>;
  errors: string[];
  analysisId?: string;
  experts?: string[];
  assignments?: Record<string, unknown>;
  validationResults?: Record<string, unknown>;
}
export function createDebugContext(sessionId: string, initialState: DebugState): DebugContext {
    console.assert(sessionId.length > 0, 'SessionId cannot be empty');
    console.assert(isValidDebugState(initialState), 'Initial state must be valid');
  return {
    sessionId,
    currentState: initialState,
    transitionHistory: [],
    metadata: {},
    errors: []
  };
}
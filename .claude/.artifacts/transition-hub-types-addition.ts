// APPEND TO END OF src/fsm/TransitionHubFacade.ts
// Additional types for FSM index re-exports

// Hub configuration for centralized transition management
export interface HubConfiguration {
  registryEnabled: boolean;
  metricsCollectionEnabled: boolean;
  maxConcurrentTransitions: number;
  defaultTimeout: number;
  errorRecoveryStrategy: 'retry' | 'rollback' | 'fail';
}

// Transition request structure
export interface TransitionRequest {
  requestId: string;
  fsmId: string;
  currentState: string;
  targetState: string;
  event: string;
  context?: unknown;
  metadata?: Record<string, unknown>;
}

// Transition response structure
export interface TransitionResponse {
  requestId: string;
  success: boolean;
  fromState: string;
  toState: string;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

// FSM registry for tracking all state machines
export interface FSMRegistry {
  register(fsmId: string, config: unknown): void;
  unregister(fsmId: string): void;
  get(fsmId: string): unknown;
  list(): string[];
  clear(): void;
}

/**
 * FSM Type Definitions - Core types for Finite State Machine implementations
 */
export enum FSMState {
  IDLE  =  'IDLE',
  INITIALIZING  =  'INITIALIZING',
  PROCESSING  =  'PROCESSING',
  VALIDATING  =  'VALIDATING',
  EXECUTING  =  'EXECUTING',
  COMPLETED  =  'COMPLETED',
  FAILED  =  'FAILED',
  ERROR  =  'ERROR',
  ERROR_RECOVERY  =  'ERROR_RECOVERY',
  RECOVERING  =  'RECOVERING',
  TESTING  =  'TESTING'
}
export enum FSMEvent {
  START  =  'START',
  PROCESS  =  'PROCESS',
  VALIDATE  =  'VALIDATE',
  EXECUTE  =  'EXECUTE',
  COMPLETE  =  'COMPLETE',
  FAIL  =  'FAIL',
  RESET  =  'RESET',
  ERROR  =  'ERROR',
  ERROR_DETECTED  =  'ERROR_DETECTED',
  RESET_REQUESTED  =  'RESET_REQUESTED'
}
export interface FSMContext {
  currentState: FSMState;
  previousState?: FSMState;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
  timestamp?: number;
  on?: (event: string | symbol, listener: (...args: any[]) => void) => this;
  toString?: () => string;
}
export interface FSMTransition {
  from: FSMState;
  to: FSMState;
  event: FSMEvent;
  guard?: (context: FSMContext) => boolean;
  action?: (context: FSMContext) => void | Promise<void>;
}
export interface FSMConfig {
  initialState: FSMState;
  transitions: FSMTransition[];
  guards?: Record<string, (context: FSMContext) => boolean>;
  actions?: Record<string, (context: FSMContext) => void | Promise<void>>;
  metadata?: Record<string, any>;
}
export interface FSMStateHandler {
  enter?: (context: FSMContext) => void | Promise<void>;
  exit?: (context: FSMContext) => void | Promise<void>;
  handle: (event: FSMEvent, context: FSMContext) => FSMState | Promise<FSMState>;
}
export interface FSMValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  context?: FSMContext;
}
export interface FSMMetrics {
  stateTransitions: number;
  averageTransitionTime: number;
  errorCount: number;
  successRate: number;
  lastTransition?: {
    from: FSMState;
    to: FSMState;
    duration: number;
    timestamp: number;
  };
}
export type FSMEventHandler = (event: FSMEvent, context: FSMContext) => void | Promise<void>;
export type FSMStateChangeHandler = (from: FSMState, to: FSMState, context: FSMContext) => void;
export type FSMErrorHandler = (error: Error, context: FSMContext) => void;
export interface FSMObserver {
  onStateChange?: FSMStateChangeHandler;
  onEvent?: FSMEventHandler;
  onError?: FSMErrorHandler;
}
export interface StateDefinition {
  // TODO: Define proper const type
  [key: string]: any;
}
export interface TransitionDefinition {
  // TODO: Define proper const type
  [key: string]: any;
}
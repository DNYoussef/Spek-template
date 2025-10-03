/**
 * Shared Types for Breaking Circular Dependencies
 *
 * This file contains types that are imported by multiple type files,
 * preventing circular dependency issues. All types here should be
 * foundation types with NO imports from other type files.
 */

// Base state machine types (used across FSM implementations)
export enum StateStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

export interface StateContext {
  readonly id: string;
  readonly timestamp: number;
  readonly data: Record<string, unknown>;
}

export interface StateTransition<TState = string, TEvent = string> {
  readonly from: TState;
  readonly to: TState;
  readonly event: TEvent;
  readonly guard?: (context: StateContext) => boolean;
}

export interface StateMachineConfig<TState = string, TEvent = string> {
  readonly id: string;
  readonly initialState: TState;
  readonly states: readonly TState[];
  readonly transitions: readonly StateTransition<TState, TEvent>[];
}

// Base validation types (used across validation implementations)
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface Validator<T> {
  validate(value: T): ValidationResult;
}

// Base configuration types (used across config implementations)
export interface ConfigurationSource {
  readonly name: string;
  readonly priority: number;
  load(): Promise<Record<string, unknown>>;
}

export interface ConfigurationProvider {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
}

// Base FSM contract types (eliminates circular deps in FSM files)
export interface FSMState<TContext = StateContext> {
  readonly name: string;
  enter?(context: TContext): Promise<void> | void;
  update?(context: TContext, event: string): Promise<void> | void;
  exit?(context: TContext): Promise<void> | void;
}

export interface FSMContract<TContext = StateContext> {
  initialize(): Promise<void>;
  transition(event: string, data?: unknown): Promise<void>;
  getCurrentState(): string;
  getContext(): TContext;
  shutdown(): Promise<void>;
}

// Base event types (used across event systems)
export interface Event<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly payload: TPayload;
}

export interface EventHandler<TEvent extends Event = Event> {
  handle(event: TEvent): Promise<void> | void;
}

export interface EventBus {
  publish<T>(event: Event<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<Event<T>>): () => void;
}

// Base logger types (used across all components)
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  fatal(message: string, context?: Record<string, unknown>): void;
}

// Base metrics types (used across monitoring)
export interface Metric {
  readonly name: string;
  readonly value: number;
  readonly timestamp: number;
  readonly tags?: Record<string, string>;
}

export interface MetricsCollector {
  record(metric: Metric): void;
  increment(name: string, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
}

// Base repository types (used across data access)
export interface Repository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: TId): Promise<boolean>;
  findAll(): Promise<readonly T[]>;
}

// Base query types (used across query engines)
export interface Query<T = unknown> {
  readonly filter?: Record<string, unknown>;
  readonly sort?: Record<string, 'asc' | 'desc'>;
  readonly limit?: number;
  readonly offset?: number;
}

export interface QueryResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly hasMore: boolean;
}

// Base error types (used across error handling)
export class BaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class ConfigurationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

export class StateTransitionError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'STATE_TRANSITION_ERROR', details);
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:30:00-04:00 | coder@sonnet-4.5 | Create shared types to break circular dependencies | shared.ts | OK | Phase 1 critical blocker fixes | 0.00 | c8d4f9a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-type-foundation
 * - inputs: ["critical-blocker-fix-plan.md", "primitives.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */

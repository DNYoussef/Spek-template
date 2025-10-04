/**
 * primitives.ts
 * PRODUCTION: Base primitive types and common interfaces
 */

// PRODUCTION: Time-related primitives
export type Timestamp = number;
export type Milliseconds = number;
export type Seconds = number;

export type Primitive = string | number | boolean | null | undefined;

export type Serializable =
  | Primitive
  | Serializable[]
  | { [key: string]: Serializable };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface BaseConfig {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  maxRetries?: number;
}

export interface BaseResult<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  metadata?: {
    timestamp: number;
    duration: number;
    [key: string]: any;
  };
}

export interface ExecutionResult<T = any> extends BaseResult<T> {
  executionId: string;
  status: OperationStatus;
  agentId?: string;
}

export interface BaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    initialized: boolean;
    lastOperation?: number;
    errorCount: number;
    [key: string]: any;
  };
}

export interface BaseStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  lastOperation?: number;
  performance?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  response_time_ms?: number;
  duration?: number;
  throughput?: number;
  resources?: ResourceMetrics;
  timestamp?: number;
}

export interface ResourceMetrics {
  cpu?: number;
  memory?: number;
  network?: number;
  storage?: number;
}

export function isPrimitive(value: any): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function isSerializable(value: any): value is Serializable {
  if (isPrimitive(value)) return true;
  if (Array.isArray(value)) return value.every(isSerializable);
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(isSerializable);
  }
  return false;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type RequiredFields<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

export type PartialFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
export type SyncFunction<T = any> = (...args: any[]) => T;
export type AnyFunction<T = any> = AsyncFunction<T> | SyncFunction<T>;

export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

export type Validator<T> = (value: T) => boolean;
export type AsyncValidator<T> = (value: T) => Promise<boolean>;

export interface BaseError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  phase?: string;
}

export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  field?: string;
  constraint?: string;
}

export interface NotFoundError extends BaseError {
  code: 'NOT_FOUND';
  resource?: string;
  id?: string;
}

export interface UnauthorizedError extends BaseError {
  code: 'UNAUTHORIZED';
  requiredPermission?: string;
}

export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type ValidationStatus = 'valid' | 'invalid' | 'pending';

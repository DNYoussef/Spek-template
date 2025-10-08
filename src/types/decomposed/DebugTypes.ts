/**
 * Decomposed Debug Types
 * Focused types for debugging functionality across all components
 */

// Core debug types (decomposed from 580-line QueenDebugTypes.ts)
export interface DebugSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  context: DebugContext;
  events: DebugEvent[];
  metrics: DebugMetrics;
}

export interface DebugContext {
  queen_id: string;
  environment: string;
  version: string;
  configuration: Record<string, any>;
}

export interface DebugEvent {
  eventId: string;
  timestamp: Date;
  type: DebugEventType;
  severity: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  component: string;
  message: string;
  data?: Record<string, any>;
  stackTrace?: string;
}

export type DebugEventType = 'lifecycle' | 'communication' | 'error' | 'performance' | 'state_change' | 'decision';

export interface DebugMetrics {
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  usage: UsageMetrics;
}

export interface PerformanceMetrics {
  response_times: number[];
  throughput: number;
  resource_usage: ResourceUsage;
}

export interface ErrorMetrics {
  error_count: number;
  error_rate: number;
  error_types: Record<string, number>;
}

export interface UsageMetrics {
  active_sessions: number;
  total_requests: number;
  unique_users: number;
}

export interface ResourceUsage {
  cpu_percent: number;
  memory_mb: number;
  disk_io: number;
  network_io: number;
}
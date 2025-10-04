/**
 * shared.ts
 * PRODUCTION: Shared base types across all domains
 */

import { Timestamp, Milliseconds } from './primitives';

// PRODUCTION: Shared configuration types
export interface SharedConfig {
  enabled: boolean;
  timeout: Milliseconds;
  retries: number;
}

// PRODUCTION: Shared result types
export interface SharedResult<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

// PRODUCTION: Shared status types
export type SharedStatus = 'active' | 'inactive' | 'pending' | 'failed';

// PRODUCTION: Shared entity base
export interface SharedEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type { Timestamp, Milliseconds };

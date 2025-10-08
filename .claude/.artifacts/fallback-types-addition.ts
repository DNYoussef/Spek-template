// APPEND THESE TYPES TO END OF src/migration/core/types/FallbackChainTypes.ts
// Right before the AGENT FOOTER

// ADDITIONAL STUB TYPES FOR BACKWARD COMPATIBILITY
// These were in the old stub file but not in the real implementation

export interface ActivationHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  protocolId?: string;
  chainId?: string;
}

export interface ProtocolHealth {
  status: 'healthy' | 'degraded' | 'failed';
  lastCheck: Date;
  consecutiveFailures: number;
}

export enum ChainHealthStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  PROCESSING = 'PROCESSING',
  VALIDATING = 'VALIDATING',
  COMPLETE = 'COMPLETE'
}

export interface TestOptions {
  enabled: boolean;
  timeout: number;
  retries: number;
  maxConcurrency: number;
}

export interface TestResult {
  success: boolean;
  data: unknown;
  error: string | undefined;
  timestamp: number;
}

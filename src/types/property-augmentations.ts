/**
 * Auto-generated const type augmentations for missing properties
 * Generated: 2025-09-29T11:56:01.074Z
 */
// Global const type augmentations for missing properties
declare global {
  interface Window {
    [key: string]: any;
  }
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
    interface Global {
      [key: string]: any;
    }
  }
}
// Augment common interfaces
declare module 'events' {
  interface EventEmitter {
    logger?: any;
    initialize?: () => Promise<void>;
    cleanup?: () => Promise<void>;
  }
}
// Common base interfaces
export interface BaseComponent {
  logger?: any;
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  metadata?: Record<string, any>;
}
export interface BaseFSM {
  states?: Map<string, any>;
  currentState?: string;
  transitions?: Array<any>;
  transition?: (event: string) => void;
}
// Common missing properties
export interface CommonProperties {
  // Used 23 times
    logger?: {
      info: (msg: string, ...args: any[]) => void;
      error: (msg: string, ...args: any[]) => void;
      warn: (msg: string, ...args: any[]) => void;
      debug: (msg: string, ...args: any[]) => void;
    };
  // Used 12 times
  states?: Map<string, any>;
  // Used 10 times
  initialize?: () => Promise<void>;
  // Used 9 times
  role?: string;
  // Used 9 times
  metadata?: Record<string, any>;
  // Used 9 times
  toString?: () => string;
  // Used 9 times
  holdKeys?: string[];
  // Used 8 times
  overall_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  // TODO: Define proper const type (used 8 times)
  ARTIFACT_BUILDING?: any;
  // TODO: Define proper const type (used 8 times)
  criteriaId?: any;
  // Used 8 times
  mouseMoveEvent?: MouseEvent;
  // Used 8 times
  details?: any;
  // Used 6 times
  logInfo?: (msg: string) => void;
  // TODO: Define proper const type (used 6 times)
  PIPELINE_CONFIGURATION?: any;
  // TODO: Define proper const type (used 6 times)
  ENVIRONMENT_PREPARATION?: any;
  // TODO: Define proper const type (used 5 times)
  getSwarmStatus?: any;
  // Used 5 times
  prerequisiteId?: string;
  // Used 5 times
  criticalViolations?: Array<any>;
  // Used 4 times
  stateExecutionTimes?: Map<string, number>;
  // TODO: Define proper const type (used 4 times)
  performance?: any;
  // TODO: Define proper const type (used 4 times)
  executionState?: any;
  // TODO: Define proper const type (used 4 times)
  initialState?: any;
  // TODO: Define proper const type (used 4 times)
  TESTING?: any;
  // Used 4 times
  search?: string;
  // TODO: Define proper const type (used 4 times)
  graphql?: any;
  // TODO: Define proper const type (used 4 times)
  phaseId?: any;
  // Used 4 times
  transitionId?: string;
  // TODO: Define proper const type (used 4 times)
  CANCEL_PHASE?: any;
  // Used 4 times
  type?: string;
  // TODO: Define proper const type (used 4 times)
  mouseButtonEvent?: any;
  // Used 4 times
  // Jest matcher - add @types/jest
  // TODO: Define proper const type (used 4 times)
  overallScore?: any;
  // TODO: Define proper const type (used 4 times)
  overallCompliance?: any;
  // TODO: Define proper const type (used 4 times)
  overallCoverage?: any;
  // Used 3 times
  timeout?: number;
  // Used 3 times
  id?: string;
  // Used 3 times
  transitions?: Array<{ from: string; to: string; event: string; }>;
  // TODO: Define proper const type (used 3 times)
  getHierarchicalMetrics?: any;
  // TODO: Define proper const type (used 3 times)
  SECURITY_SCANNING?: any;
  // TODO: Define proper const type (used 3 times)
  activeAgents?: any;
  // TODO: Define proper const type (used 3 times)
  status?: any;
  // TODO: Define proper const type (used 3 times)
  MAX_CONCURRENT_PHASES?: any;
  // TODO: Define proper const type (used 3 times)
  TRANSITION_FAILED?: any;
  // TODO: Define proper const type (used 3 times)
  weight?: any;
  // TODO: Define proper const type (used 3 times)
  requirement?: any;
  // TODO: Define proper const type (used 3 times)
  summary?: any;
  // TODO: Define proper const type (used 3 times)
  ruleResults?: any;
  // TODO: Define proper const type (used 3 times)
  coverageByType?: any;
  // TODO: Define proper const type (used 2 times)
  IDLE?: any;
  // Used 2 times
  cleanup?: () => Promise<void>;
}
// Helper type for extending interfaces
export type WithCommonProperties<T> = T & Partial<CommonProperties>;
// Re-export for convenience
export {};
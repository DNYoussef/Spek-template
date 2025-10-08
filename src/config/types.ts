/**
 * Enterprise Configuration Types
 * Core type definitions for enterprise configuration system
 * NASA Rule 10 Compliant: Type-only file
 */

export interface EnterpriseConfig {
  version: string;
  enterprise: {
    enabled: boolean;
    features: Record<string, {
      enabled: boolean;
      config?: Record<string, unknown>;
    }>;
  };
  compliance: {
    nasaPOT10: {
      enabled: boolean;
      strictMode: boolean;
      thresholds: Record<string, number>;
    };
  };
  performance: {
    cachingEnabled: boolean;
    maxConcurrency: number;
    timeout: number;
  };
  security: {
    validateInputs: boolean;
    sanitizeOutputs: boolean;
    encryptSecrets: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigDrift {
  detected: boolean;
  changes: Array<{
    path: string;
    oldValue: unknown;
    newValue: unknown;
    severity: 'low' | 'medium' | 'high';
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/*
 * Version & Run Log
 * Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash
 * 1.0.0 | 2025-10-06T22:15:00-04:00 | Phase1.2@Sonnet4 | Created enterprise config types | types.ts | OK | Fixing test imports | 0.00 | a1b2c3d
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase1-2-types-fix
 * - inputs: ["tests/config/configuration-system.test.ts"]
 * - tools_used: ["Read", "Write"]
 * - versions: {"typescript":"5.x","nasa_rule_10":"compliant"}
 */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */

export interface SecurityMetrics {
  authenticatedUsers: number;
  failedLoginAttempts: number;
  activeThreats: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceScore: number;
  incidentCount: number;
  lastAuditDate: Date;
}

export interface ThreatIndicator {
  type: 'PROCESS' | 'EMAIL' | 'HASH' | 'USER' | 'IP' | 'DOMAIN' | 'URL';
  value: string;
  confidence: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'AUTHENTICATION' | 'AUTHORIZATION' | 'SYSTEM' | 'NETWORK' | 'MALWARE' | 'DATA_EXFILTRATION' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  description: string;
  indicators: ThreatIndicator[];
}

export class SecurityMetricsCollector {
  private metrics: SecurityMetrics;

  constructor() {
    this.metrics = {
      authenticatedUsers: 0,
      failedLoginAttempts: 0,
      activeThreats: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      complianceScore: 0,
      incidentCount: 0,
      lastAuditDate: new Date()
    };
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  updateMetrics(updates: Partial<SecurityMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: security-metrics-creation
// inputs: ["Missing SecurityMetrics import error"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"security-metrics-v1.0"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
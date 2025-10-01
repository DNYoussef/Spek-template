/**
 * SecurityMachineBuilder
 * NASA Rule 10 Compliant: Extracted machine configuration builder
 */

import { createMachine } from 'xstate';
import type { SecurityContext } from '../SecurityPrincessFSM';

// Define enums locally as values (not type-only imports)
enum SecurityState {
  THREAT_ASSESSMENT = 'THREAT_ASSESSMENT',
  VULNERABILITY_SCAN = 'VULNERABILITY_SCAN',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  AUTH_VALIDATION = 'AUTH_VALIDATION',
  AUDIT_SETUP = 'AUDIT_SETUP',
  MONITORING_SETUP = 'MONITORING_SETUP',
  SECURITY_VALIDATION = 'SECURITY_VALIDATION',
  REMEDIATION = 'REMEDIATION'
}

enum SecurityEvent {
  THREATS_IDENTIFIED = 'THREATS_IDENTIFIED',
  VULNERABILITIES_FOUND = 'VULNERABILITIES_FOUND',
  NO_VULNERABILITIES = 'NO_VULNERABILITIES',
  COMPLIANCE_PASSED = 'COMPLIANCE_PASSED',
  COMPLIANCE_FAILED = 'COMPLIANCE_FAILED',
  AUTH_VALIDATED = 'AUTH_VALIDATED',
  AUTH_FAILED = 'AUTH_FAILED',
  AUDIT_CONFIGURED = 'AUDIT_CONFIGURED',
  MONITORING_ACTIVE = 'MONITORING_ACTIVE',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REMEDIATION_COMPLETE = 'REMEDIATION_COMPLETE',
  REMEDIATION_FAILED = 'REMEDIATION_FAILED'
}

enum PrincessState {
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

enum PrincessEvent {
  TASK_FAILED = 'TASK_FAILED',
  ROLLBACK = 'ROLLBACK'
}

export class SecurityMachineBuilder {
  /**
   * Build complete XState machine configuration
   */
  static buildMachine(context: SecurityContext, services: any): any {
    return createMachine({
      id: 'securityPrincessFSM',
      initial: SecurityState.THREAT_ASSESSMENT,
      context,
      states: SecurityStateBuilder.buildStates(),
    }, {
      actions: SecurityActionBuilder.buildActions(),
      guards: SecurityGuardBuilder.buildGuards(),
      services: SecurityServiceBuilder.buildServices(services)
    });
  }
}

export class SecurityStateBuilder {
  /**
   * Build all state configurations
   */
  static buildStates(): any {
    return {
      [SecurityState.THREAT_ASSESSMENT]: this.buildThreatAssessmentState(),
      [SecurityState.VULNERABILITY_SCAN]: this.buildVulnerabilityScanState(),
      [SecurityState.COMPLIANCE_CHECK]: this.buildComplianceCheckState(),
      [SecurityState.AUTH_VALIDATION]: this.buildAuthValidationState(),
      [SecurityState.AUDIT_SETUP]: this.buildAuditSetupState(),
      [SecurityState.MONITORING_SETUP]: this.buildMonitoringSetupState(),
      [SecurityState.SECURITY_VALIDATION]: this.buildSecurityValidationState(),
      [SecurityState.REMEDIATION]: this.buildRemediationState(),
      [PrincessState.COMPLETE]: this.buildCompleteState(),
      [PrincessState.FAILED]: this.buildFailedState()
    };
  }

  private static buildThreatAssessmentState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.THREATS_IDENTIFIED]: {
          target: SecurityState.VULNERABILITY_SCAN,
          guard: 'threatsAnalyzed',
          actions: 'recordThreats'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'assessThreats',
        onDone: {
          target: SecurityState.VULNERABILITY_SCAN,
          actions: 'handleThreatsComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleThreatAssessmentError'
        }
      }
    };
  }

  private static buildVulnerabilityScanState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.VULNERABILITIES_FOUND]: {
          target: SecurityState.COMPLIANCE_CHECK,
          guard: 'scanComplete',
          actions: 'recordVulnerabilities'
        },
        [SecurityEvent.NO_VULNERABILITIES]: {
          target: SecurityState.COMPLIANCE_CHECK,
          actions: 'recordCleanScan'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'scanVulnerabilities',
        onDone: {
          target: SecurityState.COMPLIANCE_CHECK,
          actions: 'handleScanComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleScanError'
        }
      }
    };
  }

  private static buildComplianceCheckState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.COMPLIANCE_PASSED]: {
          target: SecurityState.AUTH_VALIDATION,
          guard: 'complianceAcceptable',
          actions: 'recordCompliance'
        },
        [SecurityEvent.COMPLIANCE_FAILED]: {
          target: SecurityState.REMEDIATION,
          actions: 'handleComplianceFailure'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'checkCompliance',
        onDone: {
          target: SecurityState.AUTH_VALIDATION,
          actions: 'handleComplianceComplete'
        },
        onError: {
          target: SecurityState.REMEDIATION,
          actions: 'handleComplianceError'
        }
      }
    };
  }

  private static buildAuthValidationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.AUTH_VALIDATED]: {
          target: SecurityState.AUDIT_SETUP,
          guard: 'authenticationSecure',
          actions: 'recordAuth'
        },
        [SecurityEvent.AUTH_FAILED]: {
          target: SecurityState.REMEDIATION,
          actions: 'handleAuthFailure'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'validateAuthentication',
        onDone: {
          target: SecurityState.AUDIT_SETUP,
          actions: 'handleAuthComplete'
        },
        onError: {
          target: SecurityState.REMEDIATION,
          actions: 'handleAuthError'
        }
      }
    };
  }

  private static buildAuditSetupState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.AUDIT_CONFIGURED]: {
          target: SecurityState.MONITORING_SETUP,
          guard: 'auditComplete',
          actions: 'recordAudit'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'setupAuditTrail',
        onDone: {
          target: SecurityState.MONITORING_SETUP,
          actions: 'handleAuditComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleAuditError'
        }
      }
    };
  }

  private static buildMonitoringSetupState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.MONITORING_ACTIVE]: {
          target: SecurityState.SECURITY_VALIDATION,
          actions: 'recordMonitoring'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'setupSecurityMonitoring',
        onDone: {
          target: SecurityState.SECURITY_VALIDATION,
          actions: 'handleMonitoringComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleMonitoringError'
        }
      }
    };
  }

  private static buildSecurityValidationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.VALIDATION_PASSED]: {
          target: PrincessState.COMPLETE,
          actions: 'recordValidation'
        },
        [SecurityEvent.VALIDATION_FAILED]: {
          target: SecurityState.REMEDIATION,
          actions: 'handleValidationFailure'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'validateSecurityPosture',
        onDone: {
          target: PrincessState.COMPLETE,
          actions: 'handleValidationComplete'
        },
        onError: {
          target: SecurityState.REMEDIATION,
          actions: 'handleValidationError'
        }
      }
    };
  }

  private static buildRemediationState(): any {
    return {
      entry: 'logEntry',
      on: {
        [SecurityEvent.REMEDIATION_COMPLETE]: {
          target: SecurityState.VULNERABILITY_SCAN,
          actions: 'recordRemediation'
        },
        [SecurityEvent.REMEDIATION_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'handleRemediationFailure'
        },
        [PrincessEvent.TASK_FAILED]: {
          target: PrincessState.FAILED,
          actions: 'recordFailure'
        }
      },
      invoke: {
        src: 'remediateFindings',
        onDone: {
          target: SecurityState.VULNERABILITY_SCAN,
          actions: 'handleRemediationComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleRemediationError'
        }
      }
    };
  }

  private static buildCompleteState(): any {
    return {
      entry: 'logCompletion',
      type: 'final'
    };
  }

  private static buildFailedState(): any {
    return {
      entry: 'logFailure',
      on: {
        [PrincessEvent.ROLLBACK]: {
          target: SecurityState.THREAT_ASSESSMENT,
          actions: 'handleRollback'
        }
      }
    };
  }
}

export class SecurityActionBuilder {
  /**
   * Build action configuration
   */
  static buildActions(): any {
    return {
      logEntry: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Entering state: ${context.currentState}`);
      },
      logCompletion: (context: any, event: any) => {
        console.log('[SecurityPrincessFSM] Security workflow completed successfully');
      },
      logFailure: (context: any, event: any) => {
        console.error('[SecurityPrincessFSM] Security workflow failed', context.data.error);
      },
      recordThreats: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.VULNERABILITY_SCAN}`);
      },
      recordVulnerabilities: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.COMPLIANCE_CHECK}`);
      },
      recordCompliance: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.AUTH_VALIDATION}`);
      },
      recordAuth: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.AUDIT_SETUP}`);
      },
      recordAudit: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.MONITORING_SETUP}`);
      },
      recordMonitoring: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.SECURITY_VALIDATION}`);
      },
      recordValidation: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${PrincessState.COMPLETE}`);
      },
      recordRemediation: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.VULNERABILITY_SCAN}`);
      },
      recordFailure: (context: any, event: any) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${PrincessState.FAILED}`);
      }
    };
  }
}

export class SecurityGuardBuilder {
  /**
   * Build guard configuration
   */
  static buildGuards(): any {
    return {
      threatsAnalyzed: (context: any) => {
        return context.data.threatAnalysis?.complete === true;
      },
      scanComplete: (context: any) => {
        return context.vulnerabilities !== undefined;
      },
      complianceAcceptable: (context: any) => {
        return (context.compliance?.overallScore || 0) >= 85;
      },
      authenticationSecure: (context: any) => {
        return context.authentication?.validated === true;
      },
      auditComplete: (context: any) => {
        return context.audit?.compliant === true;
      }
    };
  }
}

export class SecurityServiceBuilder {
  /**
   * Build service configuration
   */
  static buildServices(services: any): any {
    return {
      assessThreats: async (context: any) => {
        return services.threatAssessmentService.performThreatAssessment(context);
      },
      scanVulnerabilities: async (context: any) => {
        return services.vulnerabilityService.performVulnerabilityScan(context);
      },
      checkCompliance: async (context: any) => {
        return services.complianceService.performComplianceCheck(context);
      },
      validateAuthentication: async (context: any) => {
        return services.authenticationService.performAuthValidation(context);
      },
      setupAuditTrail: async (context: any) => {
        return services.auditService.performAuditSetup(context);
      },
      setupSecurityMonitoring: async (context: any) => {
        return services.monitoringService.performMonitoringSetup(context);
      },
      validateSecurityPosture: async (context: any) => {
        return services.validationService.performSecurityValidation(context);
      },
      remediateFindings: async (context: any) => {
        return services.remediationService.performRemediation(context);
      }
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-038-machine-builder
// inputs: ["SecurityPrincessFSM.ts initializeMachine method"]
// tools_used: ["MultiEdit"]
// versions: {"model":"sonnet-4","prompt":"nasa-rule-10-fsm"}
// === END FOOTER ===
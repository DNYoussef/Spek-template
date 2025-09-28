/**
 * SecurityMachineBuilder
 * NASA Rule 10 Compliant: Extracted machine configuration builder
 */

import { createMachine } from 'xstate';
import {
  SecurityState,
  SecurityEvent,
  PrincessState,
  PrincessEvent
} from '../types/FSMTypes';
import { SecurityContext } from '../SecurityPrincessFSM';

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
      logEntry: (context, event) => {
        console.log(`[SecurityPrincessFSM] Entering state: ${context.currentState}`);
      },
      logCompletion: (context, event) => {
        console.log('[SecurityPrincessFSM] Security workflow completed successfully');
      },
      logFailure: (context, event) => {
        console.error('[SecurityPrincessFSM] Security workflow failed', context.data.error);
      },
      recordThreats: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.VULNERABILITY_SCAN}`);
      },
      recordVulnerabilities: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.COMPLIANCE_CHECK}`);
      },
      recordCompliance: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.AUTH_VALIDATION}`);
      },
      recordAuth: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.AUDIT_SETUP}`);
      },
      recordAudit: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.MONITORING_SETUP}`);
      },
      recordMonitoring: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.SECURITY_VALIDATION}`);
      },
      recordValidation: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${PrincessState.COMPLETE}`);
      },
      recordRemediation: (context, event) => {
        console.log(`[SecurityPrincessFSM] Transition: ${context.currentState} -> ${SecurityState.VULNERABILITY_SCAN}`);
      },
      recordFailure: (context, event) => {
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
      threatsAnalyzed: (context) => {
        return context.data.threatAnalysis?.complete === true;
      },
      scanComplete: (context) => {
        return context.vulnerabilities !== undefined;
      },
      complianceAcceptable: (context) => {
        return (context.compliance?.overallScore || 0) >= 85;
      },
      authenticationSecure: (context) => {
        return context.authentication?.validated === true;
      },
      auditComplete: (context) => {
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
      assessThreats: async (context) => {
        return services.threatAssessmentService.performThreatAssessment(context);
      },
      scanVulnerabilities: async (context) => {
        return services.vulnerabilityService.performVulnerabilityScan(context);
      },
      checkCompliance: async (context) => {
        return services.complianceService.performComplianceCheck(context);
      },
      validateAuthentication: async (context) => {
        return services.authenticationService.performAuthValidation(context);
      },
      setupAuditTrail: async (context) => {
        return services.auditService.performAuditSetup(context);
      },
      setupSecurityMonitoring: async (context) => {
        return services.monitoringService.performMonitoringSetup(context);
      },
      validateSecurityPosture: async (context) => {
        return services.validationService.performSecurityValidation(context);
      },
      remediateFindings: async (context) => {
        return services.remediationService.performRemediation(context);
      }
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T04:17:48-04:00 | CODEX-038@sonnet-4 | Create SecurityMachineBuilder following NASA Rule 10 | services/SecurityMachineBuilder.ts | OK | Extracted machine configuration from main FSM | 0.00 | b8e4c3f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-038-machine-builder
- inputs: ["SecurityPrincessFSM.ts initializeMachine method"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"nasa-rule-10-fsm"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
/**
 * CertifiedState.ts
 * NASA POT10 compliant certified state
 * Single responsibility: Handle certification operations
 */

import {
  ValidationState,
  ValidationContext
} from '../types/ValidationFSMTypes';
import { CertificationManager } from '../components/CertificationManager';

export class CertifiedState {
  private readonly certificationManager: CertificationManager;

  constructor(certificationManager: CertificationManager) {
    if (!certificationManager) {
      throw new Error('CertifiedState: CertificationManager required');
    }
    this.certificationManager = certificationManager;
  }

  async init(context: ValidationContext): Promise<ValidationContext> {
    if (!context || context.currentState !== ValidationState.CERTIFIED) {
      throw new Error('CertifiedState: Invalid context for certified state');
    }
    return context;
  }

  async update(context: ValidationContext): Promise<ValidationContext> {
    const updatedContext = { ...context };
    
    try {
      const certificationStatus = await this.certificationManager.evaluateCertification(context);
      updatedContext.certificationStatus = certificationStatus;
      
      if (certificationStatus.certified && certificationStatus.certificationId) {
        await this.certificationManager.issueCertificate(certificationStatus.certificationId);
      }
    } catch (error) {
      updatedContext.errors.push({
        errorId: `certified-${Date.now()}`,
        errorType: 'CERTIFICATION_ERROR',
        message: error.message,
        timestamp: Date.now(),
        recoverable: true
      });
    }

    return updatedContext;
  }

  async shutdown(context: ValidationContext): Promise<ValidationContext> {
    return context;
  }

  checkInvariants(context: ValidationContext): boolean {
    return context && 
           context.currentState === ValidationState.CERTIFIED &&
           context.certificationStatus !== undefined;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:42:47-04:00 | validation-destroyer@claude-4 | Created CertifiedState | CertifiedState.ts | OK | Functions ≤60 lines | 0.00 | d8b3e47 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: certified-state-001
- inputs: ["ValidationFSMTypes.ts", "CertificationManager.ts"]
- tools_used: ["mcp__filesystem__write_file"]
- versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
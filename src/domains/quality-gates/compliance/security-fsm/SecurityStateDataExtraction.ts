/**
 * Security State: Data Extraction
 * Handles extraction of security data from various artifact types
 */

import { EventEmitter } from 'events';
import {
  SecurityValidationState,
  SecurityValidationEvent,
  SecurityValidationContext
} from './SecurityValidationTypes';

export class SecurityStateDataExtraction {
  private emitter: EventEmitter;

  constructor(emitter: EventEmitter) {
    this.emitter = emitter;
  }

  /**
   * Extract security data from artifacts
   */
  async init(context: SecurityValidationContext): Promise<void> {
    try {
      context.currentStep = 'data-extraction';
      
      // Extract data from all artifact types
      const extractedData = await this.extractAllData(context.artifacts);
      
      // Validate extracted data
      this.validateExtractedData(extractedData);
      
      // Store in context
      context.extractedData = extractedData;
      
      // Transition to vulnerability analysis
      this.emitter.emit('transition', {
        from: SecurityValidationState.DATA_EXTRACTION,
        to: SecurityValidationState.VULNERABILITY_ANALYSIS,
        event: SecurityValidationEvent.DATA_EXTRACTED,
        context
      });
      
    } catch (error) {
      this.handleError(error, context);
    }
  }

  /**
   * Extract data from all artifact types
   */
  private async extractAllData(artifacts: any[]): Promise<Record<string, any>> {
    const data: Record<string, any> = {};
    
    // Extract SAST data
    const sastResults = this.filterArtifactsByType(artifacts, 'sast');
    if (sastResults.length > 0) {
      data.sast = this.extractSASTData(sastResults);
    }
    
    // Extract DAST data
    const dastResults = this.filterArtifactsByType(artifacts, 'dast');
    if (dastResults.length > 0) {
      data.dast = this.extractDASTData(dastResults);
    }
    
    // Extract remaining types
    data.sca = this.extractDataByType(artifacts, 'sca');
    data.infrastructure = this.extractDataByType(artifacts, 'infrastructure-security');
    data.codeQuality = this.extractDataByType(artifacts, 'code-security');
    data.compliance = this.extractDataByType(artifacts, 'compliance-security');
    
    return data;
  }

  /**
   * Filter artifacts by type
   */
  private filterArtifactsByType(artifacts: any[], type: string): any[] {
    return artifacts.filter(artifact => artifact.type === type);
  }

  /**
   * Extract SAST (Static Application Security Testing) data
   */
  private extractSASTData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data,
      vulnerabilities: [
        ...(acc.vulnerabilities // []),
        ...(artifact.data?.vulnerabilities // [])
      ]
    }), { vulnerabilities: [] });
  }

  /**
   * Extract DAST (Dynamic Application Security Testing) data
   */
  private extractDASTData(artifacts: any[]): any {
    return artifacts.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data,
      vulnerabilities: [
        ...(acc.vulnerabilities // []),
        ...(artifact.data?.vulnerabilities // [])
      ]
    }), { vulnerabilities: [] });
  }

  /**
   * Extract data by artifact type
   */
  private extractDataByType(artifacts: any[], type: string): any {
    const filtered = this.filterArtifactsByType(artifacts, type);
    if (filtered.length === 0) return null;
    
    return filtered.reduce((acc, artifact) => ({
      ...acc,
      ...artifact.data
    }), {});
  }

  /**
   * Validate extracted data quality
   */
  private validateExtractedData(data: Record<string, any>): void {
    const hasAnyData = Object.values(data).some(value => 
      value !== null && value !== undefined
    );
    
    if (!hasAnyData) {
      throw new Error('No valid security data extracted from artifacts');
    }
    
    // Validate critical data structures
    this.validateVulnerabilityData(data);
    this.validateComplianceData(data);
  }

  /**
   * Validate vulnerability data structure
   */
  private validateVulnerabilityData(data: Record<string, any>): void {
    const sources = ['sast', 'dast', 'sca', 'infrastructure', 'codeQuality'];
    
    for (const source of sources) {
      if (data[source]?.vulnerabilities) {
        const vulns = data[source].vulnerabilities;
        if (!Array.isArray(vulns)) {
          throw new Error(`Invalid vulnerability data format in ${source}`);
        }
      }
    }
  }

  /**
   * Validate compliance data structure
   */
  private validateComplianceData(data: Record<string, any>): void {
    if (data.compliance && typeof data.compliance !== 'object') {
      throw new Error('Invalid compliance data format');
    }
  }

  /**
   * Handle extraction errors
   */
  private handleError(error: any, context: SecurityValidationContext): void {
    context.errorDetails = {
      stage: 'data-extraction',
      message: error.message,
      timestamp: Date.now()
    };
    
    this.emitter.emit('transition', {
      from: SecurityValidationState.DATA_EXTRACTION,
      to: SecurityValidationState.ERROR,
      event: SecurityValidationEvent.VALIDATION_ERROR,
      context,
      error
    });
  }

  /**
   * Update function for state maintenance
   */
  update(context: SecurityValidationContext): void {
    // Monitor extraction progress if needed
  }

  /**
   * Shutdown function for cleanup
   */
  shutdown(context: SecurityValidationContext): void {
    // Clean up extraction resources
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: SecurityValidationContext): boolean {
    return (
      context.extractedData !== undefined &&
      typeof context.extractedData === 'object'
    );
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:37:00-04:00 / coder@sonnet-4 / Created SecurityStateDataExtraction with comprehensive artifact data extraction and validation / SecurityStateDataExtraction.ts / OK / Data extraction state complete / 0.02 / 7c9e5f1 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-003
- inputs: ["SecurityValidationTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
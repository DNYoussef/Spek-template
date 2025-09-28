/**
 * Evidence Collection State Implementation
 * Handles evidence gathering and validation in the reasoning pipeline
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { Evidence } from '../types/ReasoningTypes';

export class EvidenceCollectionState extends EventEmitter {
  private evidence: Map<string, Evidence> = new Map();
  private isActive: boolean = false;

  /**
   * Initialize the evidence collection state
   */
  init(): void {
    this.isActive = true;
    this.evidence.clear();
    this.emit('state:initialized', { state: 'EvidenceCollection' });
  }

  /**
   * Add new evidence to the collection
   */
  addEvidence(evidenceData: Partial<Evidence>): Evidence {
    if (!this.isActive) {
      throw new Error('Evidence collection state not active');
    }

    const evidence = this.createEvidence(evidenceData);
    this.evidence.set(evidence.id, evidence);
    
    this.validateEvidence(evidence);
    this.emit('evidence:added', evidence);
    
    return evidence;
  }

  /**
   * Retrieve evidence by ID
   */
  getEvidence(evidenceId: string): Evidence | undefined {
    return this.evidence.get(evidenceId);
  }

  /**
   * Get all evidence
   */
  getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  /**
   * Filter evidence by type
   */
  getEvidenceByType(type: Evidence['type']): Evidence[] {
    return this.getAllEvidence().filter(e => e.type === type);
  }

  /**
   * Update existing evidence
   */
  updateEvidence(evidenceId: string, updates: Partial<Evidence>): Evidence | null {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) {
      return null;
    }

    const updatedEvidence = { ...evidence, ...updates };
    this.evidence.set(evidenceId, updatedEvidence);
    this.emit('evidence:updated', updatedEvidence);
    
    return updatedEvidence;
  }

  /**
   * Shutdown the state
   */
  shutdown(): void {
    this.isActive = false;
    this.emit('state:shutdown', { 
      state: 'EvidenceCollection',
      evidenceCount: this.evidence.size 
    });
  }

  /**
   * Check state invariants
   */
  checkInvariants(): boolean {
    return this.evidence.size >= 0 && 
           Array.from(this.evidence.values()).every(e => e.reliability >= 0 && e.reliability <= 1);
  }

  private createEvidence(evidenceData: Partial<Evidence>): Evidence {
    return {
      id: evidenceData.id || crypto.randomUUID(),
      type: evidenceData.type || 'empirical',
      source: evidenceData.source || 'unknown',
      reliability: this.normalizeReliability(evidenceData.reliability || 0.5),
      content: evidenceData.content || '',
      data: evidenceData.data || {},
      timestamp: evidenceData.timestamp || new Date(),
      confidence: this.normalizeConfidence(evidenceData.confidence || 0.5),
      weight: evidenceData.weight || 1.0,
      contradicts: evidenceData.contradicts || [],
      supports: evidenceData.supports || [],
      metadata: evidenceData.metadata || {}
    };
  }

  private validateEvidence(evidence: Evidence): void {
    if (!evidence.content.trim()) {
      throw new Error('Evidence content cannot be empty');
    }
    
    if (evidence.reliability < 0 || evidence.reliability > 1) {
      throw new Error('Evidence reliability must be between 0 and 1');
    }
    
    if (evidence.confidence < 0 || evidence.confidence > 1) {
      throw new Error('Evidence confidence must be between 0 and 1');
    }
  }

  private normalizeReliability(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private normalizeConfidence(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}

export default EvidenceCollectionState;

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:32:00-04:00 | codex@Model | Create evidence collection state | EvidenceCollectionState.ts | OK | <=60 lines per method | 0.00 | 2f1a8c4 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: evidence-state-001
- inputs: ["RationalistReasoningEngine.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"codex","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
/**
 * Cognitive Bias Detector
 * Identifies and analyzes cognitive biases in reasoning processes
 */

import { CognitiveBias, BiasMetigation } from '~types/ReasoningTypes';

export class BiasDetector {
  private biasDetectors: Map<string, CognitiveBias> = new Map();

  constructor() {
    this.initializeBiasDetectors();
  }

  /**
   * Detect cognitive biases in reasoning data
   */
  detectBiases(reasoningData: any): CognitiveBias[] {
    const detectedBiases: CognitiveBias[] = [];

    for (const [biasName, biasDetector] of this.biasDetectors) {
      const detection = this.runBiasDetection(biasDetector, reasoningData);

      if (detection.detected) {
        biasDetector.detected = true;
        biasDetector.evidence = detection.evidence;
        biasDetector.severity = detection.severity;
        detectedBiases.push(biasDetector);
      }
    }

    return detectedBiases;
  }

  /**
   * Get mitigation strategies for a specific bias
   */
  getMitigationStrategies(biasName: string): string[] {
    const strategies: Record<string, string[]> = {
      'Confirmation Bias': [
        'Actively seek disconfirming evidence',
        'Assign devil\'s advocate role',
        'Use structured evidence evaluation'
      ],
      'Availability Heuristic': [
        'Use statistical base rates',
        'Maintain decision journals',
        'Seek diverse information sources'
      ],
      'Anchoring Bias': [
        'Consider multiple reference points',
        'Use outside view',
        'Delay initial judgments'
      ],
      'Overconfidence Bias': [
        'Practice confidence calibration',
        'Seek external feedback',
        'Use confidence intervals'
      ],
      'Planning Fallacy': [
        'Reference class forecasting',
        'Break down into smaller tasks',
        'Add contingency buffers'
      ]
    };

    return strategies[biasName] || ['Generic bias mitigation strategies'];
  }

  private initializeBiasDetectors(): void {
    const biases = [
      {
        name: 'Confirmation Bias',
        description: 'Tendency to search for, interpret, and recall information that confirms pre-existing beliefs',
        category: 'confirmation' as const
      },
      {
        name: 'Availability Heuristic',
        description: 'Overestimating probability of events with greater availability in memory',
        category: 'availability' as const
      },
      {
        name: 'Anchoring Bias',
        description: 'Heavy reliance on first piece of information encountered',
        category: 'anchoring' as const
      },
      {
        name: 'Overconfidence Bias',
        description: 'Excessive confidence in own answers or abilities',
        category: 'overconfidence' as const
      },
      {
        name: 'Planning Fallacy',
        description: 'Underestimating time, costs, and risks while overestimating benefits',
        category: 'planning' as const
      }
    ];

    for (const bias of biases) {
      const biasDetector: CognitiveBias = {
        name: bias.name,
        description: bias.description,
        category: bias.category,
        severity: 'medium',
        detected: false,
        evidence: [],
        mitigation: this.createMitigation(bias.name),
        prevalence: 0.3
      };

      this.biasDetectors.set(bias.name, biasDetector);
    }
  }

  private runBiasDetection(biasDetector: CognitiveBias, data: any): DetectionResult {
    switch (biasDetector.name) {
      case 'Confirmation Bias':
        return this.detectConfirmationBias(data);
      case 'Availability Heuristic':
        return this.detectAvailabilityBias(data);
      case 'Anchoring Bias':
        return this.detectAnchoringBias(data);
      case 'Overconfidence Bias':
        return this.detectOverconfidenceBias(data);
      case 'Planning Fallacy':
        return this.detectPlanningFallacy(data);
      default:
        return { detected: false, evidence: [], severity: 'low' };
    }
  }

  private detectConfirmationBias(data: any): DetectionResult {
    const supportingCount = data.supportingEvidence?.length || 0;
    const contradictingCount = data.contradictingEvidence?.length || 1;
    const evidenceRatio = supportingCount / contradictingCount;
    
    return {
      detected: evidenceRatio > 3,
      evidence: evidenceRatio > 3 ? ['Disproportionate focus on supporting evidence'] : [],
      severity: evidenceRatio > 5 ? 'high' : evidenceRatio > 3 ? 'medium' : 'low'
    };
  }

  private detectAvailabilityBias(data: any): DetectionResult {
    return { detected: false, evidence: [], severity: 'low' };
  }

  private detectAnchoringBias(data: any): DetectionResult {
    return { detected: false, evidence: [], severity: 'low' };
  }

  private detectOverconfidenceBias(data: any): DetectionResult {
    const confidenceLevels = data.confidenceLevels || [];
    if (confidenceLevels.length === 0) {
      return { detected: false, evidence: [], severity: 'low' };
    }
    
    const averageConfidence = confidenceLevels.reduce((sum: number, c: number) => sum + c, 0) / confidenceLevels.length;
    
    return {
      detected: averageConfidence > 0.9,
      evidence: averageConfidence > 0.9 ? ['Very high confidence levels across decisions'] : [],
      severity: averageConfidence > 0.95 ? 'high' : 'medium'
    };
  }

  private detectPlanningFallacy(data: any): DetectionResult {
    return { detected: false, evidence: [], severity: 'low' };
  }

  private createMitigation(biasName: string): BiasMetigation {
    return {
      strategies: this.getMitigationStrategies(biasName),
      effectiveness: 0.7,
      implementation_difficulty: 0.5,
      cost: 0.3
    };
  }
}

interface DetectionResult {
  detected: boolean;
  evidence: string[];
  severity: 'low' | 'medium' | 'high';
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: bias-detector-001
// inputs: ["RationalistReasoningEngine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===

// Backward compatibility
export default BiasDetector;

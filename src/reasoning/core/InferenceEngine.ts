/**
 * InferenceEngine - Extracted from RationalistReasoningEngine
 * Handles logical inference and deduction
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface Proposition {
  id: string;
  statement: string;
  truthValue: boolean | null;
  confidence: number;
  dependencies: string[];
}

export interface InferenceRule {
  id: string;
  name: string;
  type: 'modus_ponens' | 'modus_tollens' | 'syllogism' | 'disjunctive_syllogism' | 'custom';
  premises: string[];
  conclusion: string;
  confidence: number;
}

export interface InferenceResult {
  ruleId: string;
  premises: Proposition[];
  conclusion: Proposition;
  confidence: number;
  valid: boolean;
  explanation: string;
}

export interface LogicalModel {
  propositions: Map<string, Proposition>;
  rules: InferenceRule[];
  inferences: InferenceResult[];
  consistency: boolean;
}

export class InferenceEngine extends EventEmitter {
  /**
   * Handles logical inference and deduction.
   *
   * Extracted from RationalistReasoningEngine (1,061 LOC -> ~200 LOC component).
   * Handles:
   * - Logical inference rules
   * - Deductive reasoning
   * - Consistency checking
   * - Truth propagation
   * - Inference chains
   */

  private propositions: Map<string, Proposition>;
  private inferenceRules: Map<string, InferenceRule>;
  private inferenceResults: InferenceResult[];
  private knowledgeBase: Map<string, any>;
  private maxInferenceDepth: number = 10;

  constructor() {
    super();

    this.propositions = new Map();
    this.inferenceRules = new Map();
    this.inferenceResults = [];
    this.knowledgeBase = new Map();

    this.loadStandardRules();
  }

  private loadStandardRules(): void {
    // Modus Ponens: If P then Q, P, therefore Q
    this.addRule({
      id: 'modus-ponens',
      name: 'Modus Ponens',
      type: 'modus_ponens',
      premises: ['P  Q', 'P'],
      conclusion: 'Q',
      confidence: 1.0
    });

    // Modus Tollens: If P then Q, not Q, therefore not P
    this.addRule({
      id: 'modus-tollens',
      name: 'Modus Tollens',
      type: 'modus_tollens',
      premises: ['P  Q', 'Q'],
      conclusion: 'P',
      confidence: 1.0
    });

    // Disjunctive Syllogism: P or Q, not P, therefore Q
    this.addRule({
      id: 'disjunctive-syllogism',
      name: 'Disjunctive Syllogism',
      type: 'disjunctive_syllogism',
      premises: ['P  Q', 'P'],
      conclusion: 'Q',
      confidence: 1.0
    });

    // Hypothetical Syllogism: If P then Q, If Q then R, therefore If P then R
    this.addRule({
      id: 'hypothetical-syllogism',
      name: 'Hypothetical Syllogism',
      type: 'syllogism',
      premises: ['P  Q', 'Q  R'],
      conclusion: 'P  R',
      confidence: 1.0
    });
  }

  addProposition(statement: string, truthValue?: boolean, confidence: number = 1.0): Proposition {
    const proposition: Proposition = {
      id: this.generateId('prop'),
      statement,
      truthValue: truthValue ?? null,
      confidence,
      dependencies: []
    };

    this.propositions.set(proposition.id, proposition);
    this.emit('propositionAdded', proposition);

    // Trigger inference on new proposition
    this.performInference();

    return proposition;
  }

  addRule(rule: InferenceRule): void {
    this.inferenceRules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }

  performInference(depth: number = 0): InferenceResult[] {
    if (depth >= this.maxInferenceDepth) {
      this.emit('inferenceDepthExceeded', depth);
      return [];
    }

    const newInferences: InferenceResult[] = [];

    for (const rule of this.inferenceRules.values()) {
      const result = this.applyRule(rule);
      if (result && result.valid) {
        newInferences.push(result);
        this.inferenceResults.push(result);

        // Add inferred proposition
        const inferred = this.addProposition(
          result.conclusion.statement,
          result.conclusion.truthValue,
          result.confidence
        );

        // Mark dependencies
        inferred.dependencies = result.premises.map(p => p.id);

        this.emit('inferenceCompleted', result);
      }
    }

    // Recursive inference if new propositions were added
    if (newInferences.length > 0) {
      const deeperInferences = this.performInference(depth + 1);
      newInferences.push(...deeperInferences);
    }

    return newInferences;
  }

  private applyRule(rule: InferenceRule): InferenceResult | null {
    switch (rule.type) {
      case 'modus_ponens':
        return this.applyModusPonens(rule);
      case 'modus_tollens':
        return this.applyModusTollens(rule);
      case 'disjunctive_syllogism':
        return this.applyDisjunctiveSyllogism(rule);
      case 'syllogism':
        return this.applySyllogism(rule);
      case 'custom':
        return this.applyCustomRule(rule);
      default:
        return null;
    }
  }

  private applyModusPonens(rule: InferenceRule): InferenceResult | null {
    // Find P  Q and P
    const implication = this.findProposition((p) => p.statement.includes(''));
    const antecedent = this.findProposition((p) =>
      implication && p.statement === implication.statement.split('')[0].trim()
    );

    if (implication && antecedent && antecedent.truthValue === true) {
      const consequent = implication.statement.split('')[1].trim();

      return {
        ruleId: rule.id,
        premises: [implication, antecedent],
        conclusion: {
          id: this.generateId('conclusion'),
          statement: consequent,
          truthValue: true,
          confidence: Math.min(implication.confidence, antecedent.confidence) * rule.confidence,
          dependencies: [implication.id, antecedent.id]
        },
        confidence: rule.confidence,
        valid: true,
        explanation: `By modus ponens: ${implication.statement} and ${antecedent.statement}, therefore ${consequent}`
      };
    }

    return null;
  }

  private applyModusTollens(rule: InferenceRule): InferenceResult | null {
    // Find P  Q and Q
    const implication = this.findProposition((p) => p.statement.includes(''));
    if (!implication) return null;

    const consequent = implication.statement.split('')[1].trim();
    const negatedConsequent = this.findProposition((p) =>
      p.statement === `${consequent}` && p.truthValue === true
    );

    if (implication && negatedConsequent) {
      const antecedent = implication.statement.split('')[0].trim();

      return {
        ruleId: rule.id,
        premises: [implication, negatedConsequent],
        conclusion: {
          id: this.generateId('conclusion'),
          statement: `${antecedent}`,
          truthValue: true,
          confidence: Math.min(implication.confidence, negatedConsequent.confidence) * rule.confidence,
          dependencies: [implication.id, negatedConsequent.id]
        },
        confidence: rule.confidence,
        valid: true,
        explanation: `By modus tollens: ${implication.statement} and ${negatedConsequent.statement}, therefore ${antecedent}`
      };
    }

    return null;
  }

  private applyDisjunctiveSyllogism(rule: InferenceRule): InferenceResult | null {
    // Find P  Q and P
    const disjunction = this.findProposition((p) => p.statement.includes(''));
    if (!disjunction) return null;

    const [left, right] = disjunction.statement.split('').map(s => s.trim());
    const negatedLeft = this.findProposition((p) =>
      p.statement === `${left}` && p.truthValue === true
    );

    if (disjunction && negatedLeft) {
      return {
        ruleId: rule.id,
        premises: [disjunction, negatedLeft],
        conclusion: {
          id: this.generateId('conclusion'),
          statement: right,
          truthValue: true,
          confidence: Math.min(disjunction.confidence, negatedLeft.confidence) * rule.confidence,
          dependencies: [disjunction.id, negatedLeft.id]
        },
        confidence: rule.confidence,
        valid: true,
        explanation: `By disjunctive syllogism: ${disjunction.statement} and ${negatedLeft.statement}, therefore ${right}`
      };
    }

    return null;
  }

  private applySyllogism(rule: InferenceRule): InferenceResult | null {
    // Find P  Q and Q  R
    const implications = Array.from(this.propositions.values())
      .filter(p => p.statement.includes(''));

    for (let i = 0; i < implications.length; i++) {
      for (let j = 0; j < implications.length; j++) {
        if (i === j) continue;

        const first = implications[i];
        const second = implications[j];

        const firstConsequent = first.statement.split('')[1].trim();
        const secondAntecedent = second.statement.split('')[0].trim();

        if (firstConsequent === secondAntecedent) {
          const firstAntecedent = first.statement.split('')[0].trim();
          const secondConsequent = second.statement.split('')[1].trim();

          return {
            ruleId: rule.id,
            premises: [first, second],
            conclusion: {
              id: this.generateId('conclusion'),
              statement: `${firstAntecedent}  ${secondConsequent}`,
              truthValue: null,
              confidence: Math.min(first.confidence, second.confidence) * rule.confidence,
              dependencies: [first.id, second.id]
            },
            confidence: rule.confidence,
            valid: true,
            explanation: `By syllogism: ${first.statement} and ${second.statement}, therefore ${firstAntecedent}  ${secondConsequent}`
          };
        }
      }
    }

    return null;
  }

  private applyCustomRule(rule: InferenceRule): InferenceResult | null {
    // Custom rule application logic would go here
    return null;
  }

  private findProposition(predicate: (p: Proposition) => boolean): Proposition | undefined {
    return Array.from(this.propositions.values()).find(predicate);
  }

  checkConsistency(): { consistent: boolean; contradictions: string[] } {
    const contradictions: string[] = [];

    // Check for direct contradictions
    for (const prop of this.propositions.values()) {
      const negation = this.findProposition(p =>
        p.statement === `${prop.statement}` ||
        prop.statement === `${p.statement}`
      );

      if (negation && prop.truthValue === negation.truthValue && prop.truthValue !== null) {
        contradictions.push(`Contradiction: ${prop.statement} and ${negation.statement}`);
      }
    }

    // Check for inference contradictions
    for (const inference of this.inferenceResults) {
      if (inference.conclusion.truthValue !== null) {
        const existing = this.findProposition(p =>
          p.statement === inference.conclusion.statement &&
          p.truthValue !== null &&
          p.truthValue !== inference.conclusion.truthValue
        );

        if (existing) {
          contradictions.push(`Inference contradiction: ${inference.conclusion.statement}`);
        }
      }
    }

    return {
      consistent: contradictions.length === 0,
      contradictions
    };
  }

  getInferenceChain(propositionId: string): InferenceResult[] {
    const chain: InferenceResult[] = [];
    const visited = new Set<string>();

    const buildChain = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const prop = this.propositions.get(id);
      if (!prop) return;

      // Find inferences that led to this proposition
      const relevantInferences = this.inferenceResults.filter(inf =>
        inf.conclusion.statement === prop.statement
      );

      for (const inference of relevantInferences) {
        chain.push(inference);

        // Recursively build chain for premises
        for (const premise of inference.premises) {
          buildChain(premise.id);
        }
      }
    };

    buildChain(propositionId);
    return chain.reverse();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getModel(): LogicalModel {
    return {
      propositions: new Map(this.propositions),
      rules: Array.from(this.inferenceRules.values()),
      inferences: [...this.inferenceResults],
      consistency: this.checkConsistency().consistent
    };
  }

  getMetrics(): any {
    const consistency = this.checkConsistency();

    return {
      propositions: this.propositions.size,
      rules: this.inferenceRules.size,
      inferences: this.inferenceResults.length,
      consistent: consistency.consistent,
      contradictions: consistency.contradictions.length
    };
  }
}
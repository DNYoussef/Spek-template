/**
 * Compliance Validator for Agent Output Validation
 * 
 * Validates agent-generated code against NASA Rule 10, FSM patterns,
 * and production quality standards.
 */

import { assert } from 'console';

/**
 * Main compliance validation engine
 */
export class ComplianceValidator {
  private nasaAnalyzer: NASARule10Analyzer;
  private fsmAnalyzer: FSMPatternAnalyzer;
  private qualityAnalyzer: ProductionQualityAnalyzer;
  private violationDetector: ViolationDetector;
  
  constructor() {
    this.initializeValidators();
  }
  
  /**
   * Initialize validation components
   */
  private initializeValidators(): void {
    assert(this !== null, 'Validator instance must be valid');
    
    this.nasaAnalyzer = new NASARule10Analyzer();
    this.fsmAnalyzer = new FSMPatternAnalyzer();
    this.qualityAnalyzer = new ProductionQualityAnalyzer();
    this.violationDetector = new ViolationDetector();
    
    assert(this.nasaAnalyzer !== null, 'NASA analyzer must initialize');
    assert(this.fsmAnalyzer !== null, 'FSM analyzer must initialize');
  }
  
  /**
   * Validate agent output against all compliance requirements
   */
  validateAgentOutput(code: string, requirements: ComplianceRequirements): ValidationResult {
    assert(code.length > 0, 'Code cannot be empty');
    assert(requirements !== null, 'Requirements must be specified');
    
    const violations: Violation[] = [];
    const scores: ComplianceScores = {
      nasa: 0,
      fsm: 0,
      quality: 0,
      types: 0,
      overall: 0
    };
    
    // NASA Rule 10 Analysis
    const nasaResult = this.nasaAnalyzer.analyze(code, requirements.nasaRule10);
    assert(nasaResult !== null, 'NASA analysis must complete');
    
    violations.push(...nasaResult.violations);
    scores.nasa = nasaResult.complianceScore;
    
    // FSM Pattern Analysis (if applicable)
    if (this.hasStatefulBehavior(code)) {
      const fsmResult = this.fsmAnalyzer.analyze(code, requirements.fsmRequirements);
      assert(fsmResult !== null, 'FSM analysis must complete');
      
      violations.push(...fsmResult.violations);
      scores.fsm = fsmResult.complianceScore;
    } else {
      scores.fsm = 100; // Not applicable
    }
    
    // Production Quality Analysis
    const qualityResult = this.qualityAnalyzer.analyze(code, requirements.productionQuality);
    assert(qualityResult !== null, 'Quality analysis must complete');
    
    violations.push(...qualityResult.violations);
    scores.quality = qualityResult.complianceScore;
    
    // Type Safety Analysis
    const typeResult = this.analyzeTypeSafety(code, requirements.typesSafety);
    assert(typeResult !== null, 'Type analysis must complete');
    
    violations.push(...typeResult.violations);
    scores.types = typeResult.complianceScore;
    
    // Calculate overall score
    scores.overall = this.calculateOverallScore(scores);
    
    return {
      compliant: this.isCompliant(violations, scores),
      scores,
      violations,
      recommendations: this.generateRecommendations(violations),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Detect if code has stateful behavior requiring FSM analysis
   */
  private hasStatefulBehavior(code: string): boolean {
    assert(code.length > 0, 'Code must not be empty');
    
    const statePatterns = [
      /state\s*[=:]/gi,
      /setState/gi,
      /useReducer/gi,
      /switch.*state/gi,
      /enum.*State/gi
    ];
    
    // Check patterns with fixed bounds
    for (let i = 0; i < statePatterns.length && i < 10; i++) {
      if (statePatterns[i].test(code)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate weighted overall compliance score
   */
  private calculateOverallScore(scores: ComplianceScores): number {
    assert(scores !== null, 'Scores cannot be null');
    
    const weights = {
      nasa: 0.40,
      fsm: 0.25,
      quality: 0.20,
      types: 0.10,
      testing: 0.05
    };
    
    const weightedScore = (
      scores.nasa * weights.nasa +
      scores.fsm * weights.fsm +
      scores.quality * weights.quality +
      scores.types * weights.types
    );
    
    assert(weightedScore >= 0 && weightedScore <= 100, 'Weighted score must be valid');
    return Math.round(weightedScore * 100) / 100;
  }
  
  /**
   * Determine if code meets compliance requirements
   */
  private isCompliant(violations: Violation[], scores: ComplianceScores): boolean {
    assert(violations !== null, 'Violations array cannot be null');
    assert(scores !== null, 'Scores cannot be null');
    
    // Check for critical violations
    const criticalViolations = violations.filter(v => v.severity === ViolationSeverity.CRITICAL);
    
    if (criticalViolations.length > 0) {
      return false;
    }
    
    // Check minimum score thresholds
    const thresholds = {
      nasa: 90,
      fsm: 85,
      quality: 85,
      types: 95,
      overall: 85
    };
    
    return (
      scores.nasa >= thresholds.nasa &&
      scores.fsm >= thresholds.fsm &&
      scores.quality >= thresholds.quality &&
      scores.types >= thresholds.types &&
      scores.overall >= thresholds.overall
    );
  }
}

/**
 * NASA Rule 10 Analyzer
 */
class NASARule10Analyzer {
  analyze(code: string, requirements: NASARule10Requirements): AnalysisResult {
    assert(code.length > 0, 'Code cannot be empty');
    assert(requirements !== null, 'Requirements cannot be null');
    
    const violations: Violation[] = [];
    let complianceScore = 100;
    
    // Function length analysis
    const functionLengthViolations = this.analyzeFunctionLengths(code, requirements.maxFunctionLines);
    violations.push(...functionLengthViolations);
    
    // Assertion analysis
    const assertionViolations = this.analyzeAssertions(code, requirements.minAssertionsPerFunction);
    violations.push(...assertionViolations);
    
    // Forbidden pattern analysis
    const patternViolations = this.analyzeForbiddenPatterns(code, requirements.forbiddenPatterns);
    violations.push(...patternViolations);
    
    // Loop bounds analysis
    if (requirements.requireFixedLoopBounds) {
      const loopViolations = this.analyzeLoopBounds(code);
      violations.push(...loopViolations);
    }
    
    // Return checking analysis
    if (requirements.requireReturnChecking) {
      const returnViolations = this.analyzeReturnChecking(code);
      violations.push(...returnViolations);
    }
    
    // Calculate compliance score based on violations
    complianceScore = this.calculateNASAScore(violations, code);
    
    return {
      violations,
      complianceScore,
      details: this.generateNASADetails(violations)
    };
  }
  
  /**
   * Analyze function lengths for NASA compliance
   */
  private analyzeFunctionLengths(code: string, maxLines: number): Violation[] {
    assert(code.length > 0, 'Code must not be empty');
    assert(maxLines > 0, 'Max lines must be positive');
    
    const violations: Violation[] = [];
    const functionPattern = /(?:function\s+\w+|\w+\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))[\s\S]*?{([\s\S]*?)}/g;
    
    let match;
    let functionCount = 0;
    const maxFunctions = 100; // Fixed bounds
    
    while ((match = functionPattern.exec(code)) !== null && functionCount < maxFunctions) {
      const functionBody = match[1];
      const lines = functionBody.split('\n').length;
      
      if (lines > maxLines) {
        violations.push({
          type: ViolationType.FUNCTION_TOO_LONG,
          severity: ViolationSeverity.CRITICAL,
          line: this.getLineNumber(code, match.index),
          description: `Function exceeds ${maxLines} lines (${lines} lines)`,
          suggestion: 'Break function into smaller, focused functions',
          ruleReference: 'NASA Rule 10.1'
        });
      }
      
      functionCount++;
    }
    
    return violations;
  }
  
  /**
   * Analyze assertion coverage
   */
  private analyzeAssertions(code: string, minAssertions: number): Violation[] {
    assert(code.length > 0, 'Code must not be empty');
    assert(minAssertions > 0, 'Minimum assertions must be positive');
    
    const violations: Violation[] = [];
    const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=.*?function|(?:async\s+)?function\s*(\w+))[\s\S]*?{([\s\S]*?)}/g;
    
    let match;
    let functionCount = 0;
    const maxFunctions = 100;
    
    while ((match = functionPattern.exec(code)) !== null && functionCount < maxFunctions) {
      const functionName = match[1] || match[2] || match[3] || 'anonymous';
      const functionBody = match[4];
      
      const assertionCount = (functionBody.match(/assert\s*\(/g) || []).length;
      
      if (assertionCount < minAssertions) {
        violations.push({
          type: ViolationType.INSUFFICIENT_ASSERTIONS,
          severity: ViolationSeverity.CRITICAL,
          line: this.getLineNumber(code, match.index),
          description: `Function '${functionName}' has ${assertionCount} assertions, requires ${minAssertions}`,
          suggestion: 'Add assert() statements for input validation',
          ruleReference: 'NASA Rule 10.2'
        });
      }
      
      functionCount++;
    }
    
    return violations;
  }
  
  /**
   * Analyze forbidden patterns
   */
  private analyzeForbiddenPatterns(code: string, patterns: string[]): Violation[] {
    assert(code.length > 0, 'Code must not be empty');
    assert(patterns.length > 0, 'Patterns array cannot be empty');
    
    const violations: Violation[] = [];
    
    // Check patterns with fixed bounds
    for (let i = 0; i < patterns.length && i < 20; i++) {
      const pattern = new RegExp(patterns[i], 'gi');
      const matches = code.match(pattern) || [];
      
      for (let j = 0; j < matches.length && j < 10; j++) {
        violations.push({
          type: ViolationType.FORBIDDEN_CONSTRUCT,
          severity: ViolationSeverity.CRITICAL,
          line: this.getLineNumber(code, code.indexOf(matches[j])),
          description: `Forbidden construct: ${matches[j]}`,
          suggestion: `Replace ${patterns[i]} with NASA-compliant alternative`,
          ruleReference: 'NASA Rule 10.3'
        });
      }
    }
    
    return violations;
  }
  
  /**
   * Get line number for code position
   */
  private getLineNumber(code: string, position: number): number {
    assert(code.length > 0, 'Code must not be empty');
    assert(position >= 0, 'Position must be non-negative');
    
    const upToPosition = code.substring(0, position);
    return upToPosition.split('\n').length;
  }
  
  /**
   * Calculate NASA compliance score
   */
  private calculateNASAScore(violations: Violation[], code: string): number {
    assert(violations !== null, 'Violations cannot be null');
    assert(code.length > 0, 'Code must not be empty');
    
    const criticalCount = violations.filter(v => v.severity === ViolationSeverity.CRITICAL).length;
    const majorCount = violations.filter(v => v.severity === ViolationSeverity.MAJOR).length;
    
    let score = 100;
    score -= criticalCount * 25; // Heavy penalty for critical violations
    score -= majorCount * 10;    // Moderate penalty for major violations
    
    return Math.max(0, score);
  }
}

// Supporting interfaces and enums
interface ComplianceRequirements {
  nasaRule10: NASARule10Requirements;
  fsmRequirements: FSMRequirements;
  productionQuality: ProductionQualityRequirements;
  typesSafety: TypeSafetyRequirements;
}

interface NASARule10Requirements {
  maxFunctionLines: number;
  minAssertionsPerFunction: number;
  forbiddenPatterns: string[];
  requireFixedLoopBounds: boolean;
  requireReturnChecking: boolean;
}

interface FSMRequirements {
  requireStateExtraction: boolean;
  enforceStateIsolation: boolean;
  requireCentralizedTransitions: boolean;
  forbidStringEvents: boolean;
  requireEnumBasedEvents: boolean;
}

interface ProductionQualityRequirements {
  enforceSingleResponsibility: boolean;
  requireDependencyInjection: boolean;
  enforceEventDrivenCommunication: boolean;
  forbidPlaceholderImplementations: boolean;
  requireEnterpriseQuality: boolean;
}

interface TypeSafetyRequirements {
  requireCompleteTyping: boolean;
  enforceStrictMode: boolean;
  requireInterfaceDefinitions: boolean;
  enforceNullSafety: boolean;
}

interface ValidationResult {
  compliant: boolean;
  scores: ComplianceScores;
  violations: Violation[];
  recommendations: string[];
  timestamp: string;
}

interface ComplianceScores {
  nasa: number;
  fsm: number;
  quality: number;
  types: number;
  overall: number;
}

interface Violation {
  type: ViolationType;
  severity: ViolationSeverity;
  line: number;
  description: string;
  suggestion: string;
  ruleReference: string;
}

enum ViolationType {
  FUNCTION_TOO_LONG = 'FUNCTION_TOO_LONG',
  INSUFFICIENT_ASSERTIONS = 'INSUFFICIENT_ASSERTIONS',
  FORBIDDEN_CONSTRUCT = 'FORBIDDEN_CONSTRUCT',
  DYNAMIC_LOOP_BOUNDS = 'DYNAMIC_LOOP_BOUNDS',
  UNCHECKED_RETURN = 'UNCHECKED_RETURN',
  STRING_STATE_EVENT = 'STRING_STATE_EVENT',
  SCATTERED_TRANSITIONS = 'SCATTERED_TRANSITIONS',
  MIXED_STATE_LOGIC = 'MIXED_STATE_LOGIC',
  PLACEHOLDER_CODE = 'PLACEHOLDER_CODE',
  HARD_DEPENDENCY = 'HARD_DEPENDENCY',
  MISSING_ERROR_HANDLING = 'MISSING_ERROR_HANDLING',
  INCOMPLETE_TYPING = 'INCOMPLETE_TYPING'
}

enum ViolationSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR'
}

interface AnalysisResult {
  violations: Violation[];
  complianceScore: number;
  details: any;
}

/**
 * Violation detector for pattern matching
 */
class ViolationDetector {
  private static patterns = {
    nasa: {
      recursiveCall: /function\s+(\w+)[\s\S]*?\1\s*\(/g,
      whileLoop: /while\s*\([^)]*\)/g,
      dynamicFor: /for\s*\([^;]*;[^;]*[^}]*\)/g,
      goto: /goto\s+\w+/g,
      setjmp: /setjmp\s*\(/g,
      eval: /eval\s*\(/g
    },
    fsm: {
      stringState: /state\s*[=:]\s*['"][^'"]+['"]/g,
      stringEvent: /event\s*===\s*['"][^'"]+['"]/g,
      scatteredTransitions: /state\s*=\s*[^;]+;/g
    },
    quality: {
      todoPlaceholder: /(?:TODO|FIXME|HACK|XXX)\b/gi,
      hardDependency: /new\s+\w+\(/g,
      noErrorHandling: /catch\s*\([^)]*\)\s*{\s*}/g
    }
  };
  
  detectViolations(code: string, category: keyof typeof ViolationDetector.patterns): Violation[] {
    assert(code.length > 0, 'Code must not be empty');
    assert(category in ViolationDetector.patterns, 'Category must be valid');
    
    const violations: Violation[] = [];
    const categoryPatterns = ViolationDetector.patterns[category];
    
    for (const [patternName, pattern] of Object.entries(categoryPatterns)) {
      const matches = code.match(pattern) || [];
      
      // Process matches with fixed bounds
      for (let i = 0; i < matches.length && i < 50; i++) {
        violations.push(this.createViolation(patternName, matches[i], code));
      }
    }
    
    return violations;
  }
  
  private createViolation(patternName: string, match: string, code: string): Violation {
    assert(patternName.length > 0, 'Pattern name cannot be empty');
    assert(match.length > 0, 'Match cannot be empty');
    
    return {
      type: this.mapPatternToType(patternName),
      severity: this.mapPatternToSeverity(patternName),
      line: this.getLineNumber(code, code.indexOf(match)),
      description: `Detected pattern: ${patternName}`,
      suggestion: this.getSuggestionForPattern(patternName),
      ruleReference: this.getRuleReference(patternName)
    };
  }
  
  private mapPatternToType(patternName: string): ViolationType {
    const mapping: { [key: string]: ViolationType } = {
      'recursiveCall': ViolationType.FORBIDDEN_CONSTRUCT,
      'whileLoop': ViolationType.DYNAMIC_LOOP_BOUNDS,
      'stringState': ViolationType.STRING_STATE_EVENT,
      'todoPlaceholder': ViolationType.PLACEHOLDER_CODE,
      'hardDependency': ViolationType.HARD_DEPENDENCY
    };
    
    return mapping[patternName] || ViolationType.FORBIDDEN_CONSTRUCT;
  }
  
  private mapPatternToSeverity(patternName: string): ViolationSeverity {
    const criticalPatterns = ['recursiveCall', 'goto', 'setjmp', 'todoPlaceholder'];
    return criticalPatterns.includes(patternName) ? ViolationSeverity.CRITICAL : ViolationSeverity.MAJOR;
  }
  
  private getSuggestionForPattern(patternName: string): string {
    const suggestions: { [key: string]: string } = {
      'recursiveCall': 'Replace recursion with iterative approach using fixed bounds',
      'whileLoop': 'Replace while loop with for loop with known bounds',
      'stringState': 'Use enum types for states instead of string literals',
      'todoPlaceholder': 'Implement complete functionality - no placeholders allowed',
      'hardDependency': 'Use dependency injection instead of direct instantiation'
    };
    
    return suggestions[patternName] || 'Address this violation according to coding standards';
  }
  
  private getRuleReference(patternName: string): string {
    const references: { [key: string]: string } = {
      'recursiveCall': 'NASA Rule 10.4',
      'whileLoop': 'NASA Rule 10.5',
      'stringState': 'FSM Design Principle 2',
      'todoPlaceholder': 'Production Quality Standard 4',
      'hardDependency': 'Production Quality Standard 2'
    };
    
    return references[patternName] || 'General Coding Standards';
  }
  
  private getLineNumber(code: string, position: number): number {
    assert(code.length > 0, 'Code must not be empty');
    assert(position >= 0, 'Position must be non-negative');
    
    return code.substring(0, position).split('\n').length;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-validator-001
// inputs: ["validation-requirements", "pattern-detection"]
// tools_used: ["claude-code", "filesystem"]
// versions: {"model":"sonnet-4","prompt":"dspy-validator-v1"}
// === END FOOTER ===
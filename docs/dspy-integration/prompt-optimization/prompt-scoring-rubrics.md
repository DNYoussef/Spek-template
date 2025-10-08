# Prompt Scoring Rubrics for DSPy Optimization

## Overview

Comprehensive scoring system for evaluating agent prompt effectiveness in enforcing coding requirements. Enables systematic optimization through measurable quality metrics.

## Multi-Dimensional Scoring Framework

### Primary Scoring Dimensions

#### 1. NASA Rule 10 Compliance (Weight: 40%)

**Measurement Criteria:**
```typescript
interface NASAComplianceScore {
  functionLineCount: {
    threshold: 60;
    measurement: 'lines_per_function';
    scoring: 'penalty_per_violation';
    weight: 0.25;
  };
  assertionCount: {
    threshold: 2;
    measurement: 'assertions_per_function';
    scoring: 'minimum_required';
    weight: 0.25;
  };
  forbiddenConstructs: {
    patterns: ['recursion', 'goto', 'setjmp', 'while\\s*\\(.*\\)', 'for\\s*\\(\\s*;.*\\)', 'eval\\s*\\('];
    measurement: 'violation_count';
    scoring: 'zero_tolerance';
    weight: 0.25;
  };
  returnChecking: {
    requirement: 'explicit_validation';
    measurement: 'unchecked_returns';
    scoring: 'penalty_per_violation';
    weight: 0.25;
  };
}
```

**Scoring Formula:**
```typescript
function calculateNASAScore(analysis: CodeAnalysis): number {
  const lineScore = Math.max(0, 1 - (analysis.maxFunctionLines - 60) / 60);
  const assertionScore = Math.min(1, analysis.minAssertions / 2);
  const constructScore = analysis.forbiddenCount === 0 ? 1 : 0;
  const returnScore = Math.max(0, 1 - analysis.uncheckedReturns / analysis.totalReturns);
  
  return (lineScore * 0.25 + assertionScore * 0.25 + 
          constructScore * 0.25 + returnScore * 0.25) * 100;
}
```

**Performance Targets:**
- **Excellent (90-100%)**: Zero violations, 2+ assertions per function, <50 lines
- **Good (80-89%)**: Minor violations, 1+ assertions, <60 lines
- **Acceptable (70-79%)**: Some violations, inconsistent assertions
- **Poor (<70%)**: Multiple violations, missing critical requirements

#### 2. FSM Pattern Implementation (Weight: 25%)

**Measurement Criteria:**
```typescript
interface FSMPatternScore {
  stateExtraction: {
    requirement: 'explicit_state_modeling';
    measurement: 'state_machines_identified';
    scoring: 'coverage_percentage';
    weight: 0.30;
  };
  enumUsage: {
    requirement: 'no_string_literals';
    measurement: 'enum_vs_string_ratio';
    scoring: 'ratio_based';
    weight: 0.25;
  };
  centralizedTransitions: {
    requirement: 'single_transition_hub';
    measurement: 'transition_centralization';
    scoring: 'binary_compliance';
    weight: 0.25;
  };
  stateIsolation: {
    requirement: 'separate_state_files';
    measurement: 'isolation_percentage';
    scoring: 'coverage_percentage';
    weight: 0.20;
  };
}
```

**Scoring Formula:**
```typescript
function calculateFSMScore(analysis: FSMAnalysis): number {
  const extractionScore = analysis.statesIdentified / analysis.potentialStates;
  const enumScore = analysis.enumEvents / (analysis.enumEvents + analysis.stringEvents);
  const centralizationScore = analysis.hasCentralizedTransitions ? 1 : 0;
  const isolationScore = analysis.isolatedStates / analysis.totalStates;
  
  return (extractionScore * 0.30 + enumScore * 0.25 + 
          centralizationScore * 0.25 + isolationScore * 0.20) * 100;
}
```

**Performance Targets:**
- **Excellent (90-100%)**: Complete FSM modeling, enum-based, centralized
- **Good (80-89%)**: Most patterns followed, minor string usage
- **Acceptable (70-79%)**: Some FSM awareness, mixed implementation
- **Poor (<70%)**: Minimal FSM patterns, string-based state management

#### 3. Production Quality Standards (Weight: 20%)

**Measurement Criteria:**
```typescript
interface ProductionQualityScore {
  singleResponsibility: {
    measurement: 'function_complexity_score';
    threshold: 10; // Cyclomatic complexity
    scoring: 'inverse_complexity';
    weight: 0.25;
  };
  dependencyInjection: {
    measurement: 'hard_dependency_count';
    scoring: 'penalty_per_violation';
    weight: 0.20;
  };
  errorHandling: {
    measurement: 'error_coverage_percentage';
    threshold: 85;
    scoring: 'coverage_based';
    weight: 0.20;
  };
  placeholderElimination: {
    patterns: ['TODO', 'FIXME', 'HACK', 'XXX', 'placeholder'];
    measurement: 'placeholder_count';
    scoring: 'zero_tolerance';
    weight: 0.15;
  };
  performanceConsciousness: {
    measurement: 'algorithm_complexity';
    preferred: ['O(1)', 'O(log n)', 'O(n)'];
    scoring: 'complexity_penalty';
    weight: 0.20;
  };
}
```

**Scoring Formula:**
```typescript
function calculateProductionScore(analysis: QualityAnalysis): number {
  const responsibilityScore = Math.max(0, 1 - (analysis.maxComplexity - 10) / 10);
  const dependencyScore = Math.max(0, 1 - analysis.hardDependencies / analysis.totalDependencies);
  const errorScore = analysis.errorCoverage / 100;
  const placeholderScore = analysis.placeholderCount === 0 ? 1 : 0;
  const performanceScore = getComplexityScore(analysis.algorithmComplexity);
  
  return (responsibilityScore * 0.25 + dependencyScore * 0.20 + 
          errorScore * 0.20 + placeholderScore * 0.15 + 
          performanceScore * 0.20) * 100;
}
```

#### 4. Type Safety Compliance (Weight: 10%)

**Measurement Criteria:**
```typescript
interface TypeSafetyScore {
  typeCompleteness: {
    measurement: 'typed_vs_untyped_ratio';
    threshold: 100;
    scoring: 'percentage_based';
    weight: 0.40;
  };
  interfaceDefinitions: {
    measurement: 'interface_coverage';
    scoring: 'coverage_percentage';
    weight: 0.25;
  };
  nullSafety: {
    measurement: 'null_check_coverage';
    scoring: 'coverage_percentage';
    weight: 0.20;
  };
  strictModeCompliance: {
    measurement: 'strict_typescript_compatibility';
    scoring: 'binary_compliance';
    weight: 0.15;
  };
}
```

#### 5. Test Integration Readiness (Weight: 5%)

**Measurement Criteria:**
```typescript
interface TestIntegrationScore {
  testableDesign: {
    measurement: 'pure_function_ratio';
    scoring: 'percentage_based';
    weight: 0.30;
  };
  mockabilityPoints: {
    measurement: 'dependency_injection_coverage';
    scoring: 'coverage_percentage';
    weight: 0.25;
  };
  assertionHooks: {
    measurement: 'assertion_density';
    scoring: 'density_based';
    weight: 0.25;
  };
  stateObservability: {
    measurement: 'observable_state_ratio';
    scoring: 'percentage_based';
    weight: 0.20;
  };
}
```

## Automated Scoring Implementation

### Code Analysis Engine

```typescript
class PromptScoringEngine {
  private nasaAnalyzer: NASAComplianceAnalyzer;
  private fsmAnalyzer: FSMPatternAnalyzer;
  private qualityAnalyzer: ProductionQualityAnalyzer;
  private typeAnalyzer: TypeSafetyAnalyzer;
  private testAnalyzer: TestIntegrationAnalyzer;
  
  constructor() {
    this.initializeAnalyzers();
  }
  
  scorePromptOutput(code: string, context: PromptContext): ScoringResult {
    assert(code.length > 0, 'Code cannot be empty');
    assert(context !== undefined, 'Context must be provided');
    
    const analysis = this.analyzeCode(code, context);
    assert(analysis !== null, 'Analysis must succeed');
    
    const scores = this.calculateScores(analysis);
    assert(scores.total >= 0 && scores.total <= 100, 'Total score must be valid');
    
    return {
      total: scores.total,
      breakdown: scores.breakdown,
      violations: analysis.violations,
      recommendations: this.generateRecommendations(analysis),
      timestamp: new Date().toISOString()
    };
  }
  
  private calculateScores(analysis: ComprehensiveAnalysis): ScoreBreakdown {
    const nasaScore = this.calculateNASAScore(analysis.nasa) * 0.40;
    const fsmScore = this.calculateFSMScore(analysis.fsm) * 0.25;
    const qualityScore = this.calculateProductionScore(analysis.quality) * 0.20;
    const typeScore = this.calculateTypeScore(analysis.types) * 0.10;
    const testScore = this.calculateTestScore(analysis.testing) * 0.05;
    
    return {
      total: nasaScore + fsmScore + qualityScore + typeScore + testScore,
      breakdown: {
        nasa: nasaScore / 0.40,
        fsm: fsmScore / 0.25,
        quality: qualityScore / 0.20,
        types: typeScore / 0.10,
        testing: testScore / 0.05
      }
    };
  }
}
```

### Violation Detection Patterns

```typescript
class ViolationDetector {
  private static patterns = {
    nasa: {
      longFunction: /function[\s\S]*?{([\s\S]*?)}/g,
      recursiveCall: /function\s+(\w+)[\s\S]*?\1\s*\(/g,
      whileLoop: /while\s*\([^)]*\)/g,
      missingAssertion: /function[^{]*{[^}]*}(?!.*assert)/g,
      uncheckedReturn: /(?:await\s+)?\w+\([^)]*\);(?!\s*(?:assert|if|const|let|var))/g
    },
    fsm: {
      stringState: /state\s*=\s*['"][^'"]+['"]/g,
      stringEvent: /event\s*===\s*['"][^'"]+['"]/g,
      scatteredTransitions: /state\s*=\s*[^;]+;/g,
      mixedStateLogic: /switch\s*\([^)]*state[^)]*\)[\s\S]*?{[\s\S]*?}/g
    },
    quality: {
      todoPlaceholder: /(?:TODO|FIXME|HACK|XXX|placeholder)/gi,
      hardDependency: /new\s+\w+\(/g,
      noErrorHandling: /function[^{]*{[^}]*}(?!.*(?:try|catch|throw|Error))/g,
      highComplexity: /(?:if|while|for|switch|case).*?{[\s\S]*?}/g
    }
  };
  
  static detectViolations(code: string, category: string): ViolationReport[] {
    assert(code.length > 0, 'Code must not be empty');
    assert(category in this.patterns, 'Category must be valid');
    
    const categoryPatterns = this.patterns[category as keyof typeof this.patterns];
    const violations: ViolationReport[] = [];
    
    for (const [violationType, pattern] of Object.entries(categoryPatterns)) {
      const matches = code.match(pattern) || [];
      
      for (let i = 0; i < matches.length && i < 50; i++) {
        violations.push({
          type: violationType,
          category,
          line: this.getLineNumber(code, matches[i]),
          description: this.getViolationDescription(violationType),
          severity: this.getViolationSeverity(violationType),
          suggestion: this.getViolationSuggestion(violationType)
        });
      }
    }
    
    return violations;
  }
}
```

## Performance Benchmarking

### Scoring Performance Targets

```typescript
interface PerformanceTargets {
  agentTypes: {
    backendDeveloper: {
      nasaCompliance: 95;
      fsmUsage: 80;
      productionQuality: 92;
      overallTarget: 90;
    };
    frontendDeveloper: {
      nasaCompliance: 90;
      fsmUsage: 95;
      productionQuality: 88;
      overallTarget: 88;
    };
    fsmDesigner: {
      nasaCompliance: 98;
      fsmUsage: 98;
      productionQuality: 95;
      overallTarget: 96;
    };
    codeReviewer: {
      nasaCompliance: 100;
      fsmUsage: 90;
      productionQuality: 100;
      overallTarget: 98;
    };
    tester: {
      nasaCompliance: 95;
      fsmUsage: 75;
      productionQuality: 90;
      testIntegration: 98;
      overallTarget: 92;
    };
  };
}
```

### Continuous Improvement Metrics

```typescript
interface ImprovementMetrics {
  baselineScore: number;
  currentScore: number;
  improvementRate: number;
  iterationCount: number;
  regressionFlags: string[];
  optimalPromptVersion: string;
  convergenceIndicator: boolean;
}

class ContinuousImprovement {
  trackImprovement(promptId: string, newScore: number): ImprovementMetrics {
    assert(promptId.length > 0, 'Prompt ID required');
    assert(newScore >= 0 && newScore <= 100, 'Score must be valid');
    
    const history = this.getPromptHistory(promptId);
    assert(history.length > 0, 'Prompt history must exist');
    
    const baseline = history[0].score;
    const previousScore = history[history.length - 1].score;
    
    const improvement = newScore - baseline;
    const recentChange = newScore - previousScore;
    
    return {
      baselineScore: baseline,
      currentScore: newScore,
      improvementRate: improvement / history.length,
      iterationCount: history.length,
      regressionFlags: this.detectRegressions(history, newScore),
      optimalPromptVersion: this.findOptimalVersion(history),
      convergenceIndicator: Math.abs(recentChange) < 1.0 && improvement > 10.0
    };
  }
}
```

## Integration with DSPy Pipeline

### Scoring Integration Points

1. **Prompt Variation Generation**: Score each variation against examples
2. **Example Bank Validation**: Ensure examples cover full scoring spectrum
3. **Optimization Direction**: Use scores to guide prompt improvements
4. **Performance Monitoring**: Track scoring trends over time
5. **Regression Detection**: Alert on scoring degradation

### Real-time Scoring Dashboard

```typescript
interface ScoringDashboard {
  currentScores: {
    [agentType: string]: {
      overall: number;
      nasa: number;
      fsm: number;
      quality: number;
      types: number;
      testing: number;
    };
  };
  trends: {
    [agentType: string]: {
      improvement: number;
      stability: number;
      regressionRisk: number;
    };
  };
  alerts: {
    regressions: string[];
    improvements: string[];
    targetAchievements: string[];
  };
}
```

---

*This comprehensive scoring system enables systematic optimization of agent prompts through measurable, multi-dimensional quality assessment.*

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:20:48-04:00 | DSPy-Agent@Sonnet4 | Created comprehensive scoring rubrics system | prompt-scoring-rubrics.md | OK | Multi-dimensional scoring with automation | 0.00 | f3b8d1e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: dspy-scoring-001
- inputs: ["scoring-criteria", "automation-requirements"]
- tools_used: ["claude-code", "filesystem"]
- versions: {"model":"sonnet-4","prompt":"dspy-scoring-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
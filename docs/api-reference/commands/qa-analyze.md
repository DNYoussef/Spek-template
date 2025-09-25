# /qa:analyze

## Purpose
Analyze quality gate failures to determine root causes and recommend appropriate repair strategies. Categorizes failures by complexity (small/multi/big) and routes to the most effective automated repair approach. Critical for intelligent self-correction routing.

## Usage
/qa:analyze '<qa_results_or_diff_context>'

## Implementation

### 1. Input Processing
Handle multiple input formats:
- **qa.json content**: Direct QA results from /qa:run
- **Diff statistics**: Git diff output for change analysis
- **Combined context**: Both QA results and change context
- **Error messages**: Specific failure messages for targeted analysis

### 2. Failure Classification System

#### Complexity Analysis Framework:
```javascript
const COMPLEXITY_PATTERNS = {
  small: {
    criteria: [
      'Single file changes <=25 LOC',
      'Isolated test failures',
      'Simple linting errors',
      'Type errors in one module',
      'Basic security findings'
    ],
    fix_approach: 'codex:micro',
    confidence_threshold: 0.8
  },
  
  multi: {
    criteria: [
      'Multiple related files 25-100 LOC',
      'Cross-module dependencies',
      'Integration test failures',
      'Complex linting patterns',
      'Moderate security issues'
    ],
    fix_approach: 'fix:planned',
    confidence_threshold: 0.6
  },
  
  big: {
    criteria: [
      'Architectural changes >100 LOC',
      'Cross-cutting concerns',
      'Major test suite failures',
      'Security architecture issues',
      'Performance regressions'
    ],
    fix_approach: 'gemini:impact',
    confidence_threshold: 0.4
  }
};
```

### 3. Root Cause Analysis

#### Test Failure Analysis:
```javascript
function analyzeTestFailures(testResults) {
  const patterns = {
    syntax_error: /SyntaxError|ParseError|unexpected token/i,
    type_error: /TypeError|Cannot read property|is not a function/i,
    reference_error: /ReferenceError|is not defined/i,
    assertion_error: /AssertionError|expected.*but got/i,
    timeout_error: /timeout|exceeded.*ms/i,
    network_error: /ECONNREFUSED|ETIMEDOUT|network/i
  };
  
  const rootCauses = [];
  const failedTests = testResults.details?.failed_tests || [];
  
  for (const test of failedTests) {
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(test.error)) {
        rootCauses.push({
          type: 'test_failure',
          subtype: type,
          test_name: test.name,
          error_message: test.error,
          fix_suggestion: getTestFixSuggestion(type)
        });
        break;
      }
    }
  }
  
  return rootCauses;
}
```

#### TypeScript Error Analysis:
```javascript
function analyzeTypescriptErrors(typecheckResults) {
  const errorPatterns = {
    missing_types: /Property.*does not exist on type|Cannot find name/,
    type_mismatch: /Type.*is not assignable to type/,
    generic_error: /Type.*does not satisfy the constraint/,
    import_error: /Cannot find module|Module.*has no exported member/
  };
  
  const errors = typecheckResults.details?.error_summary || [];
  return errors.map(error => ({
    type: 'typescript_error',
    subtype: classifyTSError(error.message, errorPatterns),
    file: error.file,
    line: error.line,
    message: error.message,
    complexity: estimateComplexity(error)
  }));
}
```

#### Security Finding Analysis:
```javascript
function analyzeSecurityFindings(securityResults) {
  const findings = securityResults.details?.findings || [];
  
  return findings.map(finding => ({
    type: 'security_finding',
    severity: finding.severity,
    rule: finding.rule,
    file: finding.file,
    line: finding.line,
    cwe: extractCWE(finding.rule),
    fix_complexity: assessSecurityFixComplexity(finding)
  }));
}
```

### 4. Complexity Classification Logic

```javascript
function classifyComplexity(rootCauses, changeContext) {
  const metrics = {
    lines_changed: extractLinesChanged(changeContext),
    files_affected: extractFilesAffected(changeContext),
    failure_count: rootCauses.length,
    cross_cutting: assessCrossCuttingConcerns(rootCauses),
    architectural_impact: assessArchitecturalImpact(rootCauses)
  };
  
  // Small: Simple, isolated changes
  if (metrics.lines_changed <= 25 && 
      metrics.files_affected <= 2 &&
      metrics.failure_count <= 3 &&
      !metrics.cross_cutting) {
    return {
      size: 'small',
      confidence: 0.9,
      reasoning: 'Isolated change with simple failures'
    };
  }
  
  // Big: Architectural or complex changes
  if (metrics.lines_changed > 100 ||
      metrics.architectural_impact > 0.7 ||
      metrics.cross_cutting ||
      hasComplexSecurityIssues(rootCauses)) {
    return {
      size: 'big',
      confidence: 0.8,
      reasoning: 'Complex architectural or cross-cutting changes'
    };
  }
  
  // Multi: Everything else
  return {
    size: 'multi',
    confidence: 0.7,
    reasoning: 'Moderate complexity requiring planned approach'
  };
}
```

### 5. Fix Strategy Recommendation

```javascript
function recommendFixStrategy(classification, rootCauses) {
  const strategies = {
    small: {
      primary: 'codex:micro',
      description: 'Automated micro-fix with bounded changes',
      success_rate: 0.85,
      estimated_time: '2-5 minutes'
    },
    
    multi: {
      primary: 'fix:planned',
      description: 'Systematic multi-file fix with checkpoints',
      success_rate: 0.70, 
      estimated_time: '10-20 minutes'
    },
    
    big: {
      primary: 'gemini:impact',
      description: 'Architectural analysis then planned implementation',
      success_rate: 0.55,
      estimated_time: '30-60 minutes',
      fallback: 'manual_review'
    }
  };
  
  const strategy = strategies[classification.size];
  
  return {
    ...strategy,
    specific_actions: generateSpecificActions(rootCauses),
    preconditions: getStrategyPreconditions(classification.size),
    success_indicators: getSuccessIndicators(rootCauses)
  };
}
```

### 6. Output Generation

Generate comprehensive triage.json:

```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "analysis_version": "1.0.0",
  "input_hash": "abc123def456",
  
  "classification": {
    "size": "small",
    "confidence": 0.87,
    "reasoning": "Single file change with 2 simple test failures and 1 type error"
  },
  
  "root_causes": [
    {
      "type": "test_failure",
      "subtype": "type_error", 
      "test_name": "auth.test.js - should validate JWT tokens",
      "error_message": "TypeError: Cannot read property 'split' of null",
      "file": "src/auth.js",
      "line": 45,
      "fix_suggestion": "Add null check before calling .split()"
    },
    {
      "type": "typescript_error",
      "subtype": "missing_types",
      "file": "src/auth.ts",
      "line": 23,
      "message": "Property 'userId' does not exist on type 'JwtPayload'",
      "fix_suggestion": "Add userId to JwtPayload interface"
    }
  ],
  
  "change_analysis": {
    "lines_changed": 18,
    "files_affected": 2,
    "change_type": "feature_addition",
    "risk_level": "low",
    "blast_radius": "isolated"
  },
  
  "fix_strategy": {
    "primary_approach": "codex:micro",
    "description": "Automated micro-fix with bounded changes",
    "success_rate": 0.85,
    "estimated_time": "3-5 minutes",
    "specific_actions": [
      "Add null check in auth.js line 45",
      "Extend JwtPayload interface with userId property",
      "Update test to handle edge case"
    ],
    "preconditions": [
      "Changes affect only auth module",
      "No cross-cutting architectural impact"
    ],
    "success_indicators": [
      "All tests pass",
      "TypeScript compilation succeeds", 
      "No new linting errors introduced"
    ]
  },
  
  "alternative_strategies": [
    {
      "approach": "fix:planned",
      "use_case": "If micro-fix fails or introduces regressions",
      "success_rate": 0.70
    }
  ],
  
  "metadata": {
    "analysis_duration_ms": 1200,
    "pattern_matches": [
      "simple_type_error",
      "isolated_test_failure"
    ],
    "confidence_factors": {
      "change_size": 0.9,
      "error_pattern_recognition": 0.85,
      "historical_success_rate": 0.87
    }
  }
}
```

## Integration Points

### Used by:
- `scripts/self_correct.sh` - For repair strategy routing
- `flow/workflows/after-edit.yaml` - For failure analysis
- `flow/workflows/ci-auto-repair.yaml` - For CI repair decisions
- CF v2 Alpha neural training - For pattern learning

### Produces:
- `triage.json` - Comprehensive failure analysis
- Repair strategy recommendations
- Root cause identification
- Fix effort estimation

### Consumes:
- `.claude/.artifacts/qa.json` - QA results from /qa:run
- Git diff statistics and change context
- Historical repair success data (if available)
- Error patterns and classification models

## Examples

### Simple Type Error Analysis:
```json
{
  "classification": {"size": "small", "confidence": 0.91},
  "root_causes": [{"type": "typescript_error", "subtype": "type_mismatch"}],
  "fix_strategy": {"primary_approach": "codex:micro", "estimated_time": "2-3 minutes"}
}
```

### Complex Integration Failure:
```json
{
  "classification": {"size": "big", "confidence": 0.76},
  "root_causes": [
    {"type": "architectural_change", "cross_cutting": true},
    {"type": "integration_test_failure", "modules": ["auth", "database", "api"]}
  ],
  "fix_strategy": {"primary_approach": "gemini:impact", "estimated_time": "45-60 minutes"}
}
```

### Multi-File Refactor Issues:
```json
{
  "classification": {"size": "multi", "confidence": 0.73},
  "root_causes": [{"type": "refactor_impact", "affected_files": 4}],
  "fix_strategy": {"primary_approach": "fix:planned", "estimated_time": "15-20 minutes"}
}
```

## Error Handling

### Invalid Input:
- Handle malformed QA results gracefully
- Provide meaningful error messages for missing data
- Fallback to basic heuristics when analysis fails

### Analysis Limitations:
- Clearly indicate confidence levels
- Provide alternative strategies when primary recommendation is uncertain
- Flag cases that may require human intervention

### Pattern Recognition Failures:
- Default to "multi" classification for unknown patterns
- Log unrecognized error patterns for future improvement
- Provide generic fix strategies when specific patterns fail

## Performance Requirements

- Complete analysis within 10 seconds
- Memory usage under 100MB
- Deterministic classification for identical inputs
- Pattern matching efficiency for large error sets

This command provides the intelligent analysis that enables automated repair systems to choose the most effective fix strategy for any quality gate failure.

## NEW: Architecture-Aware Failure Analysis

### Enhanced Root Cause Analysis with Architecture Context

#### Architectural Impact Assessment:
```javascript
function assessArchitecturalImpact(rootCauses, architectureContext) {
  const architecturalFactors = {
    coupling_changes: analyzeComponentCoupling(architectureContext),
    hotspot_modifications: detectHotspotChanges(architectureContext),
    cross_cutting_concerns: identifyCrossCuttingImpact(rootCauses),
    refactoring_opportunities: findRefactoringOpportunities(architectureContext)
  };
  
  return {
    architectural_complexity: calculateArchitecturalComplexity(architecturalFactors),
    coupling_impact: architecturalFactors.coupling_changes.impact_score,
    refactor_potential: architecturalFactors.refactoring_opportunities.length,
    system_health_delta: predictSystemHealthChange(architecturalFactors)
  };
}
```

#### Smart Recommendation Integration:
```javascript
function generateSmartRecommendations(rootCauses, architecturalContext) {
  const recommendationEngine = new SmartRecommendationEngine();
  
  const recommendations = recommendationEngine.analyze({
    failures: rootCauses,
    architecture: architecturalContext,
    performance_context: extractPerformanceMetrics(),
    historical_patterns: getHistoricalFailurePatterns()
  });
  
  return recommendations.map(rec => ({
    type: rec.category,
    priority: rec.priority,
    architectural_benefit: rec.architectural_improvement,
    implementation_approach: rec.suggested_approach,
    success_probability: rec.confidence_score
  }));
}
```

### Enhanced Classification with Architecture Awareness

```javascript
const ENHANCED_COMPLEXITY_PATTERNS = {
  architectural_small: {
    criteria: [
      'Single component changes <=25 LOC',
      'No cross-component dependencies affected',
      'Coupling changes < 0.1 delta',
      'No architectural hotspots involved'
    ],
    fix_approach: 'codex:micro',
    architectural_verification: 'basic',
    confidence_threshold: 0.85
  },
  
  architectural_multi: {
    criteria: [
      'Multi-component changes 25-100 LOC',
      'Limited cross-component impact',
      'Coupling changes 0.1-0.3 delta',
      'One architectural hotspot involved'
    ],
    fix_approach: 'fix:planned',
    architectural_verification: 'comprehensive',
    confidence_threshold: 0.70
  },
  
  architectural_big: {
    criteria: [
      'System-wide changes >100 LOC',
      'Multiple architectural hotspots',
      'Coupling changes > 0.3 delta',
      'Cross-cutting architectural concerns'
    ],
    fix_approach: 'gemini:impact',
    architectural_verification: 'full_analysis',
    confidence_threshold: 0.55
  }
};
```

### Enhanced Output with Architectural Intelligence

```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "analysis_version": "2.0.0-architectural",
  
  "classification": {
    "size": "architectural_multi",
    "confidence": 0.78,
    "reasoning": "Multi-component change affecting auth and database modules with moderate coupling impact"
  },
  
  "architectural_assessment": {
    "coupling_delta": 0.23,
    "hotspots_affected": ["auth.service", "database.connection"],
    "cross_cutting_impact": true,
    "refactoring_opportunities": [
      {
        "component": "auth.service",
        "type": "extract_interface",
        "benefit": "Reduce coupling by 15%"
      }
    ],
    "system_health_prediction": {
      "current": 0.82,
      "after_fix": 0.87,
      "improvement_potential": 0.05
    }
  },
  
  "smart_recommendations": [
    {
      "priority": "critical",
      "type": "architectural_refactoring",
      "target": "auth.service",
      "issue": "High coupling detected during failure analysis",
      "solution": "Extract IAuthService interface, apply dependency injection",
      "architectural_benefit": "Reduces cross-component coupling",
      "implementation_effort": "6-8 hours",
      "success_probability": 0.89
    }
  ],
  
  "fix_strategy": {
    "primary_approach": "fix:planned",
    "architectural_guidance": "Apply architectural refactoring during fix process",
    "verification_requirements": [
      "Component coupling verification",
      "Hotspot analysis post-fix",
      "Cross-cutting concern validation"
    ],
    "success_indicators": [
      "Tests pass",
      "TypeScript compilation succeeds",
      "Architecture coupling improved by >10%",
      "No new architectural hotspots introduced"
    ]
  }
}
```

## Integration with Existing Workflows

### Enhanced Self-Correction Loop
```bash
# Architecture-aware failure analysis and routing
/qa:analyze "$(cat .claude/.artifacts/qa_failures.json)" \
  --architecture-context \
  --smart-recommendations \
  --coupling-analysis \
  --hotspot-impact

# Route to appropriate fix with architectural guidance
if [ "$FIX_APPROACH" = "fix:planned" ]; then
  /fix:planned --architectural-guidance --coupling-aware
fi
```
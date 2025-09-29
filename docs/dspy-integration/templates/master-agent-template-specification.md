# Master Agent Template Specification

## Overview

The Master DSPy Template system provides a universal framework for systematically optimizing all 87 SPEK agents with comprehensive enforcement of NASA Rule 10, FSM patterns, and production quality standards.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Master Template Structure](#master-template-structure)
3. [Specialization Templates](#specialization-templates)
4. [Compliance Framework](#compliance-framework)
5. [Quality Gates](#quality-gates)
6. [Enforcement Mechanisms](#enforcement-mechanisms)
7. [Usage Examples](#usage-examples)
8. [Integration Guide](#integration-guide)

## Architecture Overview

### System Components

```
Master DSPy Template System
├── MasterAgentTemplate.ts        # Universal template core
├── AgentTemplateGenerator.ts     # Instantiation engine
├── BatchOptimizationEngine.ts    # Systematic application
└── TemplateValidator.ts          # Compliance validation
```

### Design Principles

1. **Universal Applicability**: Single template system works for all 87 agents
2. **Systematic Enforcement**: Automated compliance checking and quality gates
3. **Specialization Support**: Category-specific variants while maintaining consistency
4. **Production Ready**: Zero-tolerance for placeholders, Unicode, or incomplete implementations
5. **Evidence-Based**: All quality metrics are measurable and verifiable

## Master Template Structure

### Core Signature Interface

```typescript
class MasterAgentSignature extends Signature {
  @InputField()
  task_description: string = "Detailed description of the task to be performed";

  @InputField()
  context: AgentContext = "Complete agent context including category, hierarchy, and capabilities";

  @InputField()
  requirements: ComplianceRequirements = "NASA Rule 10, FSM patterns, and production quality requirements";

  @InputField()
  specialization: AgentSpecialization = "Agent-specific template variant and domain constraints";

  @OutputField()
  implementation: string = "Complete, compliant implementation with all requirements enforced";

  @OutputField()
  compliance_report: ComplianceReport = "Detailed compliance analysis with violations and recommendations";

  @OutputField()
  quality_metrics: QualityMetrics = "Quantified quality scores across all dimensions";

  @OutputField()
  fsm_analysis: FSMAnalysis = "State machine analysis if applicable to the task";
}
```

### Input Specification

#### AgentContext
```typescript
interface AgentContext {
  id: string;                              // Agent identifier
  category: AgentCategory;                 // Primary functional category
  hierarchy_level: 'queen' | 'princess' | 'drone';
  model_assignment: ModelType;             // Optimal AI model assignment
  mcp_servers: string[];                   // Required MCP server integrations
  capabilities: string[];                  // Agent-specific capabilities
  fsm_mode?: 'required' | 'enforced' | 'optional';
}
```

#### ComplianceRequirements
```typescript
interface ComplianceRequirements {
  nasa_rule_10: {
    max_function_length: 60;               // Strict 60-line limit
    min_assertions_per_function: 2;       // Minimum 2 assertions per function
    no_recursion: true;                    // Zero recursion allowed
    no_goto: true;                         // Zero goto statements
    fixed_loop_bounds_only: true;         // Only fixed iteration bounds
    check_all_returns: true;               // All returns must be checked
  };
  fsm_patterns: {
    state_isolation: boolean;              // One state per file
    centralized_transitions: boolean;      // TransitionHub required
    enum_events_only: boolean;             // No string literals
    full_contract_implementation: boolean; // Complete StateContract
  };
  production_quality: {
    single_responsibility: boolean;        // SRP enforcement
    dependency_injection: boolean;         // DI pattern required
    event_driven_communication: boolean;   // Event-driven architecture
    no_placeholders: boolean;              // Zero TODO/FIXME/placeholder
    no_unicode: boolean;                   // ASCII only
    enterprise_standards: boolean;         // 6-sigma quality standards
  };
}
```

### Output Specification

#### QualityMetrics
```typescript
interface QualityMetrics {
  nasa_compliance_score: number;          // 0-100 (must be 100)
  fsm_pattern_usage: number;              // 0-100 (≥95 required)
  production_quality_score: number;       // 0-100 (≥98 required)
  theater_detection_score: number;        // 0-100 (<60 required, lower better)
  type_safety_score: number;              // 0-100 (must be 100)
  test_coverage: number;                  // 0-100 (≥80 required)
}
```

#### ComplianceReport
```typescript
interface ComplianceReport {
  overall_status: 'PASS' | 'PARTIAL' | 'FAIL';
  nasa_rule_10_violations: string[];      // NASA Rule 10 failures
  fsm_pattern_violations: string[];       // FSM pattern failures
  production_quality_violations: string[]; // Production quality failures
  recommendations: string[];              // Improvement suggestions
  auto_fix_suggestions: string[];         // Automated fix proposals
}
```

## Specialization Templates

### Agent Category Matrix

| Category | Count | Template Variant | Key Enforcements |
|----------|-------|------------------|------------------|
| Development | 23 | DevelopmentTemplate | NASA Rule 10, FSM APIs, TDD |
| Architecture | 12 | ArchitectureTemplate | FSM Design, System Compliance |
| Testing | 8 | TestingTemplate | Assertion Coverage, Fixed Bounds |
| Coordination | 15 | CoordinationTemplate | Event-driven, State Management |
| Security | 7 | SecurityTemplate | Compliance, Validation |
| Performance | 9 | PerformanceTemplate | Measurement, Optimization |
| Research | 6 | ResearchTemplate | Large Context, Analysis |
| Repository | 7 | RepositoryTemplate | Git Integration, Workflow |

### DevelopmentTemplate Constraints

```typescript
class DevelopmentTemplate extends MasterAgentSignature {
  static constraints = {
    nasa_rule_10: {
      function_length_budget: 50,          // Stricter than general (50 vs 60)
      assertion_density: 0.1,              // 10% of lines should be assertions
      loop_analysis_required: true,        // Static analysis of all loops
    },
    fsm_requirements: {
      api_endpoints_as_states: true,       // REST endpoints map to states
      request_lifecycle_fsm: true,         // Request/response as FSM
      error_handling_states: true,         // Explicit error states
    },
    code_quality: {
      test_driven_development: true,       // Tests first approach
      dependency_injection_pattern: true,  // Explicit DI requirement
      no_hardcoded_values: true,           // Configuration-driven
    }
  };
}
```

### ArchitectureTemplate Constraints

```typescript
class ArchitectureTemplate extends MasterAgentSignature {
  static constraints = {
    system_design: {
      fsm_based_architecture: true,        // System-level FSM design
      component_state_modeling: true,      // Component state diagrams
      transition_documentation: true,      // Document all transitions
    },
    compliance: {
      enterprise_patterns: true,           // Enterprise architecture patterns
      scalability_analysis: true,          // Scalability considerations
      security_considerations: true,       // Security by design
    }
  };
}
```

### TestingTemplate Constraints

```typescript
class TestingTemplate extends MasterAgentSignature {
  static constraints = {
    test_coverage: {
      minimum_coverage: 95,                // 95% line coverage minimum
      state_transition_coverage: 100,      // 100% FSM transition coverage
      assertion_coverage: 100,             // Every function has assertions
    },
    test_quality: {
      fixed_bounds_only: true,             // No dynamic test loops
      deterministic_tests: true,           // Repeatable results
      no_flaky_tests: true,                // Robust test design
    }
  };
}
```

## Compliance Framework

### NASA Rule 10 Enforcement

#### Function Length Analysis
```typescript
validateNASARule10(implementation: string): string[] {
  const violations: string[] = [];
  const functions = this.extractFunctions(implementation);

  for (const func of functions) {
    if (func.lineCount > 60) {
      violations.push(`Function '${func.name}' exceeds 60 lines (${func.lineCount})`);
    }

    if (func.assertionCount < 2) {
      violations.push(`Function '${func.name}' has insufficient assertions (${func.assertionCount}/2)`);
    }
  }

  return violations;
}
```

#### Control Flow Analysis
- **Recursion Detection**: AST analysis for recursive patterns
- **Goto Prohibition**: Lexical analysis for goto statements
- **Loop Bounds**: Static analysis for dynamic iteration
- **Return Checking**: Data flow analysis for unchecked returns

### FSM Pattern Enforcement

#### State Isolation Verification
```typescript
validateFSMPatterns(implementation: string, context: AgentContext): string[] {
  const violations: string[] = [];

  if (context.fsm_mode === 'required' || context.fsm_mode === 'enforced') {
    // State isolation check
    if (!this.hasStateIsolation(implementation)) {
      violations.push('States not properly isolated in separate files');
    }

    // Centralized transitions check
    if (!this.hasCentralizedTransitions(implementation)) {
      violations.push('Transitions not centralized through TransitionHub');
    }

    // String literals for events/states
    if (this.hasStringLiterals(implementation)) {
      violations.push('String literals used instead of enums for events/states');
    }
  }

  return violations;
}
```

#### FSM Quality Requirements
1. **State Isolation**: One state per file/class
2. **Centralized Transitions**: Single TransitionHub
3. **Enum Events**: Typed event constants
4. **Contract Implementation**: Full StateContract methods
5. **Error Recovery**: Explicit error states
6. **Performance Budgets**: Per-state timing constraints

## Quality Gates

### Pass/Fail Thresholds

```typescript
static readonly THRESHOLDS = {
  nasa_compliance: 100,        // Must be perfect
  fsm_pattern_usage: 95,       // 95% minimum
  production_quality: 98,      // 98% minimum
  theater_score_max: 60,       // Lower is better
  type_safety: 100,            // Must be perfect
  test_coverage_min: 80,       // 80% minimum
};
```

### Quality Gate Evaluation

```typescript
static evaluate(metrics: QualityMetrics): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  if (metrics.nasa_compliance_score < this.THRESHOLDS.nasa_compliance) {
    failures.push(`NASA compliance: ${metrics.nasa_compliance_score}% < ${this.THRESHOLDS.nasa_compliance}%`);
  }

  if (metrics.theater_detection_score >= this.THRESHOLDS.theater_score_max) {
    failures.push(`Theater score too high: ${metrics.theater_detection_score} >= ${this.THRESHOLDS.theater_score_max}`);
  }

  return {
    passed: failures.length === 0,
    failures
  };
}
```

## Enforcement Mechanisms

### Theater Detection System

```typescript
class TheaterDetector {
  static analyze(implementation: string): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    // Placeholder detection (high theater indicator)
    const placeholderCount = (implementation.match(/TODO|FIXME|placeholder|coming soon/gi) || []).length;
    if (placeholderCount > 0) {
      score += placeholderCount * 20;
      indicators.push(`${placeholderCount} placeholder implementations`);
    }

    // Empty function detection
    const emptyFunctions = (implementation.match(/function[^{]*{\s*}/g) || []).length;
    if (emptyFunctions > 0) {
      score += emptyFunctions * 15;
      indicators.push(`${emptyFunctions} empty functions`);
    }

    // Fake complexity (overly simple solutions to complex problems)
    const complexity = this.analyzeComplexity(implementation);
    if (complexity.isSuspiciouslySimple) {
      score += 25;
      indicators.push('Suspiciously simple implementation for complex task');
    }

    return { score: Math.min(score, 100), indicators };
  }
}
```

### Validation Rules Engine

The TemplateValidator implements 22 validation rules across 5 categories:

#### NASA Rule 10 Rules (6 rules)
- `nasa_function_length`: ≤60 lines per function
- `nasa_assertions`: ≥2 assertions per function
- `nasa_recursion`: Zero recursion allowed
- `nasa_goto`: Zero goto statements
- `nasa_loop_bounds`: Fixed bounds only
- `nasa_return_checks`: All returns checked

#### FSM Pattern Rules (4 rules)
- `fsm_state_isolation`: One state per file
- `fsm_centralized_transitions`: TransitionHub required
- `fsm_enum_events`: No string literals
- `fsm_contract_implementation`: Full StateContract

#### Production Quality Rules (4 rules)
- `prod_no_placeholders`: Zero TODO/FIXME
- `prod_no_unicode`: ASCII only
- `prod_single_responsibility`: SRP compliance
- `prod_dependency_injection`: DI patterns

#### Theater Detection Rules (3 rules)
- `theater_empty_functions`: No empty implementations
- `theater_copy_paste`: No duplicate code
- `theater_complexity_mismatch`: Appropriate complexity

#### DSPy Compliance Rules (3 rules)
- `dspy_signature_structure`: Proper DSPy structure
- `dspy_example_bank`: Quality example bank
- `dspy_optimization_criteria`: Complete criteria

## Usage Examples

### Basic Agent Optimization

```typescript
import { MasterAgentTemplate } from './MasterAgentTemplate';

const template = new MasterAgentTemplate();

const result = await template.optimize(
  "Implement user authentication with FSM patterns",
  {
    id: 'frontend-developer',
    category: 'development',
    hierarchy_level: 'drone',
    model_assignment: 'GPT5',
    mcp_servers: ['claude-flow', 'memory', 'github', 'playwright'],
    capabilities: ['browser_automation', 'ui_testing'],
    fsm_mode: 'enforced'
  },
  {
    nasa_rule_10: { /* ... */ },
    fsm_patterns: { /* ... */ },
    production_quality: { /* ... */ }
  },
  {
    template_variant: 'development',
    specific_constraints: { /* ... */ },
    domain_knowledge: ['web_development', 'react', 'typescript'],
    interaction_patterns: ['user_interaction', 'api_communication']
  }
);

console.log('Implementation:', result.implementation);
console.log('Compliance:', result.complianceReport);
console.log('Quality Metrics:', result.qualityMetrics);
```

### Batch Optimization

```typescript
import { BatchOptimizationEngine } from './BatchOptimizationEngine';

const engine = new BatchOptimizationEngine({
  batchSize: 10,
  maxRetries: 3,
  rollbackOnFailure: true,
  validateBeforeDeployment: true,
  enableCanaryDeployment: true,
  qualityGateThresholds: {
    nasa_compliance: 100,
    fsm_pattern_usage: 95,
    production_quality: 98,
    theater_score_max: 60,
    type_safety: 100
  }
});

const result = await engine.optimizeAllAgents(
  'agent-inventory-complete.json',
  'output/optimized-agents'
);

console.log(`Optimized ${result.successfulOptimizations}/${result.totalAgents} agents`);
console.log('Overall Metrics:', result.overallMetrics);
console.log('Recommendations:', result.recommendations);
```

### Template Validation

```typescript
import { TemplateValidator } from './TemplateValidator';

const validator = new TemplateValidator();

const report = await validator.validateTemplate(
  'optimized-agents/frontend-developer-optimized.py',
  'frontend-developer'
);

console.log('Overall Score:', report.overallScore);
console.log('Status:', report.overallStatus);
console.log('Critical Violations:', report.criticalViolations);
console.log('Recommendations:', report.recommendations);
```

## Integration Guide

### Step 1: Environment Setup

```bash
# Install dependencies
npm install dspy-js @types/node

# Create directory structure
mkdir -p src/dspy-integration/templates
mkdir -p docs/dspy-integration/templates
mkdir -p output/optimized-agents
mkdir -p backups
```

### Step 2: Configuration

```typescript
// config/optimization-config.ts
export const OPTIMIZATION_CONFIG = {
  batchSize: 10,
  maxRetries: 3,
  rollbackOnFailure: true,
  validateBeforeDeployment: true,
  enableCanaryDeployment: true,
  phaseDelayMs: 5000,
  qualityGateThresholds: {
    nasa_compliance: 100,
    fsm_pattern_usage: 95,
    production_quality: 98,
    theater_score_max: 60,
    type_safety: 100
  }
};
```

### Step 3: Batch Execution Script

```bash
#!/bin/bash
# scripts/optimize-all-agents.sh

echo "Starting batch optimization of 87 SPEK agents..."

# Load agent inventory
INVENTORY_PATH=".claude/.artifacts/agent-inventory-complete.json"
OUTPUT_DIR="output/optimized-agents"

# Run batch optimization
node -e "
const { BatchOptimizationEngine } = require('./src/dspy-integration/templates/BatchOptimizationEngine');
const engine = new BatchOptimizationEngine();

engine.optimizeAllAgents('$INVENTORY_PATH', '$OUTPUT_DIR')
  .then(result => {
    console.log('Batch optimization completed');
    console.log('Success rate:', result.successfulOptimizations / result.totalAgents * 100 + '%');
    process.exit(result.failedOptimizations > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Batch optimization failed:', error.message);
    process.exit(1);
  });
"
```

### Step 4: NPM Scripts

```json
{
  "scripts": {
    "dspy:optimize-all-agents": "./scripts/optimize-all-agents.sh",
    "dspy:validate-all-agents": "node scripts/validate-all-templates.js",
    "dspy:rollback-optimization": "node scripts/rollback-optimization.js",
    "dspy:generate-report": "node scripts/generate-optimization-report.js"
  }
}
```

### Step 5: CI/CD Integration

```yaml
# .github/workflows/dspy-optimization.yml
name: DSPy Agent Optimization
on:
  push:
    paths: ['src/flow/config/agent/**']

jobs:
  optimize-agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run agent optimization
        run: npm run dspy:optimize-all-agents

      - name: Validate optimized agents
        run: npm run dspy:validate-all-agents

      - name: Generate optimization report
        run: npm run dspy:generate-report

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: optimized-agents
          path: output/optimized-agents/
```

## Success Criteria

### Deployment Readiness Checklist

- [ ] All 87 agents have generated templates
- [ ] NASA Rule 10 compliance: 100% for all agents
- [ ] FSM pattern usage: ≥95% for applicable agents
- [ ] Production quality score: ≥98% for all agents
- [ ] Theater detection score: <60 for all agents
- [ ] Zero critical violations across all templates
- [ ] Automated deployment pipeline functional
- [ ] Rollback mechanism tested and verified
- [ ] Quality gates enforced in CI/CD
- [ ] Performance improvements measured and documented

### Performance Targets

- **Optimization Speed**: ≤5 minutes per agent
- **Quality Improvement**: ≥25% performance enhancement
- **Reliability**: ≥99% successful optimizations
- **Compliance**: 100% NASA Rule 10 adherence
- **Theater Elimination**: <60 theater score for all agents

## Troubleshooting

### Common Issues

1. **Template Generation Failures**
   - Check agent inventory completeness
   - Verify MCP server availability
   - Review specialization constraints

2. **Validation Failures**
   - Review NASA Rule 10 compliance
   - Check FSM pattern implementation
   - Verify production quality standards

3. **Quality Gate Failures**
   - Examine theater detection scores
   - Review assertion density
   - Check function length compliance

### Support Resources

- **Documentation**: `docs/dspy-integration/`
- **Examples**: `examples/dspy-templates/`
- **Test Suite**: `tests/dspy-integration/`
- **Issue Tracking**: GitHub Issues with `dspy-template` label

---

*This specification provides the complete framework for systematic optimization of all 87 SPEK agents using the Master DSPy Template system with comprehensive compliance enforcement and quality assurance.*

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:30:00-04:00 | architect@gemini-2.5-pro | Master template specification documentation | master-agent-template-specification.md | OK | Complete specification for 87-agent optimization | 0.00 | e5f6g7h |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: specification-001
- inputs: ["MasterAgentTemplate.ts", "BatchOptimizationEngine.ts", "TemplateValidator.ts"]
- tools_used: ["filesystem", "memory"]
- versions: {"model":"gemini-2.5-pro","prompt":"template-specification-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
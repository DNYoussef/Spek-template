# DSPy Agent Scoring Framework

## Overview

Comprehensive scoring system for measuring and optimizing agent performance across 80+ specialized agents in the SPEK platform. This framework provides mathematical evaluation criteria for systematic prompt optimization using DSPy methodology.

## Core Scoring Categories

### 1. NASA Rule 10 Compliance (40% Weight)

#### Scoring Criteria
- **Function Length**: 25 points max
  - 60 lines or less: 25 points
  - 61-80 lines: 15 points
  - 81-100 lines: 5 points
  - 100+ lines: 0 points

- **Assertion Discipline**: 25 points max
  - 2+ assertions per function: 25 points
  - 1 assertion per function: 15 points
  - Inconsistent assertions: 5 points
  - No assertions: 0 points

- **Fixed Bounds**: 25 points max
  - All loops have compile-time bounds: 25 points
  - Most loops bounded, some dynamic: 15 points
  - Mixed bounded/unbounded: 5 points
  - Dynamic loops present: 0 points

- **Return Checking**: 25 points max
  - All non-void returns checked: 25 points
  - Most returns checked: 15 points
  - Some returns unchecked: 5 points
  - Unchecked returns: 0 points

#### NASA Compliance Calculation
```typescript
function calculateNASAScore(codeAnalysis: CodeAnalysis): number {
  const lengthScore = calculateLengthScore(codeAnalysis.functionLengths);
  const assertionScore = calculateAssertionScore(codeAnalysis.assertions);
  const boundsScore = calculateBoundsScore(codeAnalysis.loops);
  const returnScore = calculateReturnScore(codeAnalysis.returnChecking);

  return (lengthScore + assertionScore + boundsScore + returnScore) / 4;
}
```

### 2. FSM Implementation (25% Weight)

#### Scoring Criteria
- **State Extraction**: 20 points max
  - Complete state modeling: 20 points
  - Partial state modeling: 12 points
  - Implicit states only: 5 points
  - No state modeling: 0 points

- **Enum Usage**: 20 points max
  - All states/events as enums: 20 points
  - Mostly enums, some strings: 12 points
  - Mixed enum/string usage: 5 points
  - String-based states: 0 points

- **Centralized Transitions**: 20 points max
  - Single TransitionHub: 20 points
  - Mostly centralized: 12 points
  - Partially centralized: 5 points
  - Scattered transitions: 0 points

- **State Isolation**: 20 points max
  - Complete isolation: 20 points
  - Good separation: 12 points
  - Some isolation: 5 points
  - Mixed responsibilities: 0 points

- **Guard Implementation**: 20 points max
  - Complete guard coverage: 20 points
  - Most guards implemented: 12 points
  - Basic guards: 5 points
  - No guard conditions: 0 points

#### FSM Implementation Calculation
```typescript
function calculateFSMScore(fsmAnalysis: FSMAnalysis): number {
  const stateScore = calculateStateExtractionScore(fsmAnalysis.states);
  const enumScore = calculateEnumUsageScore(fsmAnalysis.eventTypes);
  const centralizedScore = calculateCentralizationScore(fsmAnalysis.transitions);
  const isolationScore = calculateIsolationScore(fsmAnalysis.stateClasses);
  const guardScore = calculateGuardScore(fsmAnalysis.guards);

  return (stateScore + enumScore + centralizedScore + isolationScore + guardScore) / 5;
}
```

### 3. Production Quality (20% Weight)

#### Scoring Criteria
- **Single Responsibility**: 25 points max
  - Clear single purpose: 25 points
  - Mostly focused: 15 points
  - Multiple concerns: 5 points
  - God object pattern: 0 points

- **Dependency Injection**: 25 points max
  - Complete DI implementation: 25 points
  - Good DI usage: 15 points
  - Some hard dependencies: 5 points
  - Tight coupling: 0 points

- **Error Handling**: 25 points max
  - Comprehensive error coverage: 25 points
  - Good error handling: 15 points
  - Basic error handling: 5 points
  - No error handling: 0 points

- **No Placeholders**: 25 points max
  - No TODO/FIXME markers: 25 points
  - Few placeholders: 15 points
  - Some placeholders: 5 points
  - Many placeholders: 0 points

#### Production Quality Calculation
```typescript
function calculateProductionScore(qualityAnalysis: QualityAnalysis): number {
  const responsibilityScore = calculateResponsibilityScore(qualityAnalysis.classes);
  const dependencyScore = calculateDependencyScore(qualityAnalysis.dependencies);
  const errorScore = calculateErrorHandlingScore(qualityAnalysis.errorHandling);
  const placeholderScore = calculatePlaceholderScore(qualityAnalysis.placeholders);

  return (responsibilityScore + dependencyScore + errorScore + placeholderScore) / 4;
}
```

### 4. Type Safety (10% Weight)

#### Scoring Criteria
- **Complete Typing**: 30 points max
  - All parameters and returns typed: 30 points
  - Most typed: 20 points
  - Partial typing: 10 points
  - No typing: 0 points

- **Interface Definitions**: 25 points max
  - Complete interfaces: 25 points
  - Good interfaces: 15 points
  - Basic interfaces: 5 points
  - No interfaces: 0 points

- **Null Safety**: 25 points max
  - Explicit null handling: 25 points
  - Good null safety: 15 points
  - Basic null handling: 5 points
  - No null safety: 0 points

- **Strict Mode**: 20 points max
  - Strict TypeScript compatible: 20 points
  - Mostly compatible: 12 points
  - Some violations: 5 points
  - Not compatible: 0 points

### 5. Testing Integration (5% Weight)

#### Scoring Criteria
- **Testable Design**: 25 points max
- **Mock Points**: 25 points max
- **Assertion Hooks**: 25 points max
- **Error Scenarios**: 25 points max

## Theater Detection Framework

### Theater Violation Penalties

#### Critical Theater Patterns (-25 points each)
- TODO placeholders in production code
- Mock/stub implementations without real functionality
- Commented-out code blocks
- Dead code paths
- Incomplete error handling

#### Major Theater Patterns (-15 points each)
- FIXME markers
- Temporary workarounds
- Hardcoded test data
- Inconsistent implementation patterns
- Missing validation logic

#### Minor Theater Patterns (-5 points each)
- Inconsistent naming conventions
- Missing documentation
- Suboptimal algorithms
- Style inconsistencies

### Reality Validation Checks

```typescript
interface RealityValidation {
  functionalityCheck: boolean;    // Does code actually work?
  completenessCheck: boolean;     // Are all features implemented?
  integrationCheck: boolean;      // Does it integrate properly?
  performanceCheck: boolean;      // Does it meet performance requirements?
  securityCheck: boolean;         // Are security measures real?
}

function calculateRealityScore(validation: RealityValidation): number {
  const checks = Object.values(validation);
  const passedChecks = checks.filter(check => check).length;
  return (passedChecks / checks.length) * 100;
}
```

## Agent-Specific Scoring Adaptations

### Backend Developer Agents
```typescript
const backendWeights = {
  nasa: 0.45,          // Higher emphasis on reliability
  fsm: 0.20,           // Service state management
  production: 0.25,    // Enterprise quality
  types: 0.05,         // Basic type safety
  testing: 0.05       // Integration focus
};
```

### Frontend Developer Agents
```typescript
const frontendWeights = {
  nasa: 0.35,          // Important but adapted for UI
  fsm: 0.30,           // Component state critical
  production: 0.20,    // User experience quality
  types: 0.10,         // React prop types
  testing: 0.05       // User interaction testing
};
```

### FSM Designer Agents
```typescript
const fsmWeights = {
  nasa: 0.40,          // Systematic approach
  fsm: 0.40,           // Core specialization
  production: 0.15,    // Design quality
  types: 0.05,         // Model definitions
  testing: 0.00       // Not applicable
};
```

### Code Reviewer Agents
```typescript
const reviewerWeights = {
  nasa: 0.35,          // Compliance detection
  fsm: 0.15,           // Pattern recognition
  production: 0.35,    // Quality assessment
  types: 0.10,         // Type checking
  testing: 0.05       // Coverage analysis
};
```

## DSPy Optimization Integration

### Example Configuration
```python
from dspy import Signature, ChainOfThought, Predict

class AgentOptimizer(Signature):
    """Optimize agent prompts for compliance scoring"""

    current_prompt = dspy.InputField(desc="Current agent prompt")
    scoring_criteria = dspy.InputField(desc="Compliance scoring requirements")
    example_inputs = dspy.InputField(desc="Training input examples")
    example_outputs = dspy.InputField(desc="Expected compliant outputs")

    optimized_prompt = dspy.OutputField(desc="Improved prompt with compliance patterns")
    expected_score = dspy.OutputField(desc="Predicted compliance score")

class CompliancePredictor(dspy.Module):
    def __init__(self):
        super().__init__()
        self.optimizer = ChainOfThought(AgentOptimizer)

    def forward(self, current_prompt, scoring_criteria, examples):
        return self.optimizer(
            current_prompt=current_prompt,
            scoring_criteria=scoring_criteria,
            example_inputs=examples['inputs'],
            example_outputs=examples['outputs']
        )
```

### Measurement Pipeline
```python
def measure_agent_performance(agent_type: str, prompt: str, test_cases: List[TestCase]) -> AgentScore:
    scores = []

    for test_case in test_cases:
        # Execute agent with prompt
        result = execute_agent(agent_type, prompt, test_case.input)

        # Calculate compliance scores
        nasa_score = calculate_nasa_compliance(result.code)
        fsm_score = calculate_fsm_implementation(result.code) if has_state_behavior(result.code) else None
        production_score = calculate_production_quality(result.code)
        type_score = calculate_type_safety(result.code)
        testing_score = calculate_testing_integration(result.code)
        theater_score = calculate_theater_detection(result.code)

        # Apply agent-specific weights
        weights = get_agent_weights(agent_type)
        total_score = calculate_weighted_score(
            nasa_score, fsm_score, production_score,
            type_score, testing_score, weights
        )

        # Apply theater penalty
        final_score = max(0, total_score - theater_score)

        scores.append(AgentScore(
            test_case=test_case.id,
            total_score=final_score,
            component_scores={
                'nasa': nasa_score,
                'fsm': fsm_score,
                'production': production_score,
                'types': type_score,
                'testing': testing_score,
                'theater_penalty': theater_score
            }
        ))

    return AgentPerformanceReport(
        agent_type=agent_type,
        scores=scores,
        average_score=sum(s.total_score for s in scores) / len(scores),
        improvement_areas=identify_improvement_areas(scores)
    )
```

## Success Criteria

### Agent Optimization Targets
- **Minimum Score**: 85% for production deployment
- **NASA Compliance**: 90%+ for all agents
- **FSM Implementation**: 85%+ when applicable
- **Production Quality**: 95%+ for enterprise deployment
- **Theater Detection**: <40 penalty points
- **Consistency**: <10% variance across test cases

### Optimization Convergence
```python
def check_optimization_convergence(scores: List[float], threshold: float = 0.02) -> bool:
    """Check if optimization has converged"""
    if len(scores) < 5:
        return False

    recent_scores = scores[-5:]
    score_variance = np.var(recent_scores)

    return score_variance < threshold and min(recent_scores) >= 85.0
```

## Implementation Status

### Completed Components
- [x] Scoring framework design
- [x] Theater detection system
- [x] Reality validation checks
- [x] Agent-specific weight configurations
- [x] DSPy integration patterns
- [x] Measurement pipeline design
- [x] Convergence criteria definition

### Next Steps
1. **Implement scoring functions** in TypeScript/Python
2. **Create test case database** with 100+ examples per agent type
3. **Deploy DSPy optimization** for first 10 agents
4. **Validate scoring accuracy** against manual reviews
5. **Scale to full 80+ agent ecosystem**

---

*This scoring framework enables systematic, measurable improvement of agent performance through DSPy optimization methodology.*

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T13:58:45-04:00 | DSPy-Agent@Sonnet4 | Created comprehensive scoring framework for agent optimization | scoring-framework.md | OK | Complete measurement system | 0.00 | e8a2f5b |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: dspy-scoring-001
- inputs: ["optimization-requirements", "agent-categories", "compliance-standards"]
- tools_used: ["claude-code", "filesystem"]
- versions: {"model":"sonnet-4","prompt":"dspy-scoring-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
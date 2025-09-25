# /pre-mortem:loop

## Purpose
Multi-agent iterative pre-mortem analysis system that leverages diversity of thought to proactively identify failure scenarios and improve specifications/plans before implementation. Uses independent analysis from Claude Code, Gemini CLI, and Codex CLI to achieve <3% failure rate confidence through systematic improvement cycles.

## Usage
/pre-mortem:loop [target_failure_rate=3] [max_iterations=3] [agent_diversity=true] [research_depth=standard]

## Implementation

### 1. Multi-Agent Architecture for Diverse Perspectives

#### Agent Roles and Constraints:
```javascript
const PREMORTEM_AGENTS = {
  claude_code: {
    role: 'Primary Orchestrator & Synthesis',
    perspective: 'Full system context with memory',
    mcp_tools: ['Sequential Thinking', 'Memory', 'Research Tools'],
    fresh_eyes: false,
    responsibilities: [
      'Coordinate overall pre-mortem process',
      'Synthesize findings from all agents',
      'Update SPEC.md and plan.json with improvements',
      'Validate final consensus and quality gates'
    ]
  },
  
  gemini_cli: {
    role: 'Large-Context Fresh Analysis',
    perspective: 'Fresh eyes with massive context window',
    mcp_tools: ['Sequential Thinking ONLY'],
    fresh_eyes: true,
    constraints: [
      'No access to Memory MCP or project context',
      'Analyze documents as completely new information',
      'Focus on architectural and systematic failure patterns'
    ]
  },
  
  codex_cli: {
    role: 'Implementation-Focused Analysis',
    perspective: 'Fresh eyes with sandboxed analytical perspective',
    mcp_tools: ['Sequential Thinking ONLY'],
    fresh_eyes: true,
    constraints: [
      'No access to Memory MCP or project context',
      'Analyze from implementation/coding perspective',
      'Focus on technical execution failure patterns'
    ]
  },
  
  research_agent: {
    role: 'Domain Knowledge & Failure Pattern Discovery',
    perspective: 'External knowledge synthesis',
    mcp_tools: ['WebSearch', 'DeepWiki', 'Firecrawl', 'Sequential Thinking'],
    fresh_eyes: 'partial',
    responsibilities: [
      'Research common failure patterns for project type',
      'Discover industry best practices and anti-patterns',
      'Provide external validation of risk assessments'
    ]
  }
};
```

### 2. Iterative Pre-Mortem Loop Process

#### Phase 1: Initial Analysis & Research
```javascript
async function executePhase1(specDocument, planDocument, projectType) {
  const phase1Results = {
    research_findings: {},
    independent_analyses: {},
    failure_patterns: {},
    consensus_gaps: []
  };
  
  // Step 1: Research Agent discovers common failure patterns
  const researchFindings = await executeResearchAgent({
    task: 'common_failure_patterns',
    domain: projectType,
    search_queries: [
      `"${projectType}" common failures lessons learned`,
      `"${projectType}" implementation anti-patterns`,
      `"${projectType}" project post-mortem analysis`
    ],
    depth: 'comprehensive'
  });
  
  // Step 2: Parallel independent pre-mortem analysis by all agents
  const [claudeAnalysis, geminiAnalysis, codexAnalysis] = await Promise.all([
    executeClaudePreMortem(specDocument, planDocument, researchFindings),
    executeGeminiPreMortem(specDocument, planDocument), // NO research context for fresh eyes
    executeCodexPreMortem(specDocument, planDocument)   // NO research context for fresh eyes
  ]);
  
  phase1Results.research_findings = researchFindings;
  phase1Results.independent_analyses = {
    claude: claudeAnalysis,
    gemini: geminiAnalysis,
    codex: codexAnalysis
  };
  
  // Step 3: Analyze consensus and identify gaps
  phase1Results.consensus_gaps = identifyConsensusGaps(
    claudeAnalysis,
    geminiAnalysis, 
    codexAnalysis
  );
  
  return phase1Results;
}
```

#### Phase 2: Synthesis & Plan Refinement
```javascript
async function executePhase2(phase1Results, specDocument, planDocument) {
  const improvementPlan = {
    spec_improvements: [],
    plan_refinements: [],
    new_risk_mitigations: [],
    updated_documents: {}
  };
  
  // Step 1: Synthesize all findings (Claude Code only)
  const synthesizedFindings = await synthesizePreMortemFindings({
    research_patterns: phase1Results.research_findings,
    claude_analysis: phase1Results.independent_analyses.claude,
    gemini_analysis: phase1Results.independent_analyses.gemini,
    codex_analysis: phase1Results.independent_analyses.codex,
    consensus_gaps: phase1Results.consensus_gaps
  });
  
  // Step 2: Update SPEC.md with identified improvements
  const updatedSpec = await updateSpecificationWithImprovements({
    original_spec: specDocument,
    failure_scenarios: synthesizedFindings.failure_scenarios,
    risk_mitigations: synthesizedFindings.risk_mitigations,
    requirement_refinements: synthesizedFindings.requirement_refinements
  });
  
  // Step 3: Update plan.json with nuanced implementation steps
  const updatedPlan = await updatePlanWithPreventiveSteps({
    original_plan: planDocument,
    failure_scenarios: synthesizedFindings.failure_scenarios,
    preventive_measures: synthesizedFindings.preventive_measures,
    quality_checkpoints: synthesizedFindings.quality_checkpoints
  });
  
  // Step 4: Targeted research on newly identified risks
  const targetedResearch = await executeTargetedRiskResearch({
    new_risks: synthesizedFindings.newly_identified_risks,
    research_agent: 'research_agent'
  });
  
  improvementPlan.updated_documents = {
    spec: updatedSpec,
    plan: updatedPlan,
    targeted_research: targetedResearch
  };
  
  return improvementPlan;
}
```

#### Phase 3: Validation & Convergence Loop
```javascript
async function executePhase3(improvementPlan, targetFailureRate = 3, maxIterations = 3) {
  let currentIteration = 1;
  let convergenceAchieved = false;
  const iterationResults = [];
  
  while (!convergenceAchieved && currentIteration <= maxIterations) {
    console.log(`Pre-mortem validation iteration ${currentIteration}/${maxIterations}`);
    
    // Fresh analysis of improved documents (no previous context)
    const [claudeValidation, geminiValidation, codexValidation] = await Promise.all([
      validateImprovedPlan(improvementPlan.updated_documents, 'claude', currentIteration),
      validateImprovedPlan(improvementPlan.updated_documents, 'gemini', currentIteration),
      validateImprovedPlan(improvementPlan.updated_documents, 'codex', currentIteration)
    ]);
    
    const iterationResult = {
      iteration: currentIteration,
      validations: {
        claude: claudeValidation,
        gemini: geminiValidation,
        codex: codexValidation
      },
      consensus_failure_rate: calculateConsensusFailureRate([
        claudeValidation,
        geminiValidation,
        codexValidation
      ]),
      convergence_achieved: false
    };
    
    // Check convergence criteria
    if (iterationResult.consensus_failure_rate <= targetFailureRate) {
      iterationResult.convergence_achieved = true;
      convergenceAchieved = true;
    } else if (currentIteration < maxIterations) {
      // Refine plan based on new findings
      improvementPlan = await refineImprovementPlan(
        improvementPlan,
        iterationResult.validations
      );
    }
    
    iterationResults.push(iterationResult);
    currentIteration++;
  }
  
  return {
    convergence_achieved: convergenceAchieved,
    final_failure_rate: iterationResults[iterationResults.length - 1].consensus_failure_rate,
    iteration_history: iterationResults,
    final_documents: improvementPlan.updated_documents
  };
}
```

### 3. Fresh-Eyes Analysis Implementation

#### Gemini CLI Integration:
```javascript
async function executeGeminiPreMortem(specDocument, planDocument) {
  const geminiPrompt = `
ROLE: You are a senior system architect with extensive experience in project failure analysis.

CONTEXT: You are reviewing project specifications and plans with completely fresh eyes. You have NO prior knowledge of this project or organization.

CONSTRAINTS:
- Use Sequential Thinking MCP ONLY for structured analysis
- No access to memory or previous context
- Analyze documents as if seeing them for the first time
- Focus on systematic and architectural failure patterns

TASK: Conduct a comprehensive pre-mortem analysis of the provided specification and plan documents.

ANALYSIS FRAMEWORK:
1. Requirement Analysis: Identify unclear, missing, or contradictory requirements
2. Architectural Risk Assessment: Evaluate system design and integration points
3. Implementation Complexity Analysis: Assess technical feasibility and complexity
4. Resource and Timeline Risk: Evaluate resource allocation and timeline realism
5. External Dependency Analysis: Identify third-party risks and single points of failure
6. Failure Scenario Generation: Create specific failure scenarios with probability estimates

OUTPUT FORMAT:
{
  "failure_scenarios": [
    {
      "scenario": "Specific failure description",
      "probability_percent": 15,
      "impact": "high|medium|low",
      "category": "technical|resource|timeline|external",
      "root_causes": ["specific cause 1", "specific cause 2"],
      "prevention_strategies": ["prevention 1", "prevention 2"],
      "early_warning_signals": ["signal 1", "signal 2"]
    }
  ],
  "overall_failure_probability": 25,
  "top_risks": ["risk 1", "risk 2", "risk 3"],
  "critical_improvements": ["improvement 1", "improvement 2"],
  "confidence_level": 0.8
}

DOCUMENTS TO ANALYZE:
Specification: ${specDocument}
Plan: ${planDocument}
  `;
  
  return await executeGeminiAnalysis(geminiPrompt);
}
```

#### Codex CLI Integration:
```javascript
async function executeCodexPreMortem(specDocument, planDocument) {
  const codexPrompt = `
ROLE: You are a senior software engineer and implementation specialist with deep experience in technical execution.

CONTEXT: You are reviewing project specifications and plans from an implementation perspective with fresh eyes. You have NO prior knowledge of this project.

CONSTRAINTS:
- Use Sequential Thinking MCP ONLY for structured analysis
- No access to memory or previous context  
- Focus specifically on technical implementation challenges
- Consider coding, testing, deployment, and maintenance perspectives

TASK: Conduct implementation-focused pre-mortem analysis identifying technical execution risks.

ANALYSIS FRAMEWORK:
1. Technical Feasibility: Evaluate implementation complexity and technical risks
2. Code Quality Risks: Identify potential code quality and maintainability issues
3. Testing Challenges: Assess testing complexity and potential coverage gaps
4. Integration Risks: Evaluate system integration and API compatibility risks
5. Performance and Scalability: Identify performance bottlenecks and scaling issues
6. Security and Compliance: Assess security implementation risks
7. DevOps and Deployment: Evaluate deployment and operational risks

OUTPUT FORMAT:
{
  "implementation_risks": [
    {
      "risk": "Specific technical risk description",
      "probability_percent": 20,
      "severity": "critical|high|medium|low", 
      "category": "coding|testing|integration|performance|security|deployment",
      "technical_details": "Detailed technical explanation",
      "mitigation_strategies": ["strategy 1", "strategy 2"],
      "detection_methods": ["how to detect early", "monitoring approach"]
    }
  ],
  "overall_technical_failure_probability": 18,
  "critical_technical_gaps": ["gap 1", "gap 2"],
  "implementation_recommendations": ["rec 1", "rec 2"],
  "confidence_level": 0.85
}

DOCUMENTS TO ANALYZE:
Specification: ${specDocument}  
Plan: ${planDocument}
  `;
  
  return await executeCodexAnalysis(codexPrompt);
}
```

### 4. Research Integration for Common Failures

#### Domain-Specific Failure Pattern Research:
```javascript
async function executeResearchAgent(researchConfig) {
  const researchPipeline = {
    web_research: {
      tool: 'WebSearch',
      queries: researchConfig.search_queries,
      focus_areas: [
        'project_post_mortems',
        'lessons_learned_articles',
        'anti_pattern_documentation',
        'implementation_failure_stories'
      ]
    },
    
    deep_knowledge: {
      tool: 'DeepWiki',
      topics: [
        `${researchConfig.domain} best practices`,
        `${researchConfig.domain} common pitfalls`,
        `${researchConfig.domain} risk management`
      ],
      depth: 'comprehensive'
    },
    
    synthesis: {
      tool: 'Sequential Thinking',
      analysis_type: 'failure_pattern_synthesis',
      output_structure: 'common_failure_patterns'
    }
  };
  
  const research_results = {
    common_failure_patterns: [],
    industry_lessons: [],
    risk_mitigation_strategies: [],
    success_factors: [],
    anti_patterns: []
  };
  
  // Execute web research for failure patterns
  const webFindings = await executeWebSearch({
    queries: researchPipeline.web_research.queries,
    focus: 'failure_analysis',
    depth: researchConfig.depth
  });
  
  // Extract common failure patterns
  research_results.common_failure_patterns = extractFailurePatterns(webFindings);
  
  // Deep knowledge research for best practices
  const knowledgeFindings = await executeDeepWikiResearch({
    topics: researchPipeline.deep_knowledge.topics,
    analysis_focus: 'risk_identification'
  });
  
  research_results.industry_lessons = extractIndustryLessons(knowledgeFindings);
  
  // Synthesize findings using Sequential Thinking
  const synthesis = await executeSequentialThinking({
    input_data: {
      web_findings: webFindings,
      knowledge_findings: knowledgeFindings
    },
    analysis_framework: 'failure_pattern_analysis',
    output_format: 'structured_risk_assessment'
  });
  
  research_results.risk_mitigation_strategies = synthesis.mitigation_strategies;
  research_results.success_factors = synthesis.success_factors;
  research_results.anti_patterns = synthesis.anti_patterns;
  
  return research_results;
}
```

### 5. Consensus Analysis and Quality Gates

#### Failure Rate Consensus Calculation:
```javascript
function calculateConsensusFailureRate(validations) {
  const failureRates = validations.map(v => v.overall_failure_probability);
  const weights = {
    claude: 0.4,  // Higher weight for full-context analysis
    gemini: 0.3,  // Large-context architectural perspective
    codex: 0.3    // Implementation-focused perspective
  };
  
  const weightedAverage = (
    failureRates[0] * weights.claude +
    failureRates[1] * weights.gemini +
    failureRates[2] * weights.codex
  );
  
  const standardDeviation = calculateStandardDeviation(failureRates);
  const confidenceRange = calculateConfidenceRange(failureRates);
  
  return {
    consensus_rate: weightedAverage,
    standard_deviation: standardDeviation,
    confidence_range: confidenceRange,
    agreement_level: categorizeAgreementLevel(standardDeviation),
    individual_rates: {
      claude: failureRates[0],
      gemini: failureRates[1], 
      codex: failureRates[2]
    }
  };
}
```

#### Quality Gates and Convergence Criteria:
```javascript
const PREMORTEM_QUALITY_GATES = {
  convergence_criteria: {
    target_failure_rate: 3,          // Maximum acceptable failure rate %
    max_iterations: 3,               // Maximum refinement iterations
    consensus_threshold: 0.8,        // Agreement level between agents
    improvement_threshold: 2         // Minimum % improvement per iteration
  },
  
  validation_requirements: {
    scenario_coverage: 'comprehensive',  // All major risk categories covered
    mitigation_completeness: 0.9,       // 90% of risks have mitigation plans
    early_warning_systems: 0.8,         // 80% of risks have detection methods
    implementation_specificity: 0.85    // 85% of recommendations are actionable
  },
  
  escalation_triggers: {
    non_convergence: 'Manual review required if no convergence after max iterations',
    high_disagreement: 'Stakeholder review if agent disagreement >30%',
    novel_risks: 'Expert consultation for previously unknown risk patterns'
  }
};
```

### 6. Output Generation and Artifacts

#### Comprehensive Pre-Mortem Report:
```json
{
  "timestamp": "2024-09-08T16:00:00Z",
  "pre_mortem_session": {
    "target_failure_rate": 3,
    "iterations_completed": 2,
    "convergence_achieved": true,
    "final_consensus_failure_rate": 2.3
  },
  
  "agent_analyses": {
    "claude_code": {
      "perspective": "Full system context",
      "final_failure_rate": 2.5,
      "key_concerns": [
        "Integration complexity with external systems",
        "Team coordination challenges across multiple workstreams"
      ]
    },
    "gemini_cli": {
      "perspective": "Fresh architectural analysis",
      "final_failure_rate": 2.1,
      "key_concerns": [
        "Architectural scalability limitations",
        "Third-party dependency risks"
      ]
    },
    "codex_cli": {
      "perspective": "Implementation-focused analysis",
      "final_failure_rate": 2.3,
      "key_concerns": [
        "Technical debt accumulation during rapid development",
        "Testing coverage gaps in integration scenarios"
      ]
    }
  },
  
  "research_insights": {
    "common_failure_patterns": [
      {
        "pattern": "Insufficient testing of edge cases",
        "frequency": "78% of similar projects",
        "impact": "High",
        "prevention": "Automated edge case generation and testing"
      }
    ],
    "industry_lessons": [
      "Projects similar to this have 23% average failure rate without pre-mortem analysis",
      "Early stakeholder alignment reduces failure risk by 35%"
    ]
  },
  
  "improved_artifacts": {
    "spec_improvements": {
      "file": "SPEC.md",
      "changes": [
        "Added explicit edge case handling requirements",
        "Defined integration testing acceptance criteria",
        "Clarified stakeholder approval processes"
      ]
    },
    "plan_refinements": {
      "file": "plan.json",
      "changes": [
        "Added integration testing phase with specific scenarios",
        "Included stakeholder checkpoints at key milestones", 
        "Added fallback strategies for external dependency failures"
      ]
    }
  },
  
  "risk_register": [
    {
      "risk_id": "RISK-001",
      "scenario": "External API rate limiting causes integration failures",
      "probability": 8,
      "impact": "High",
      "mitigation": "Implement retry logic with exponential backoff",
      "early_warning": "Monitor API response times and error rates",
      "owner": "Backend Team",
      "status": "Mitigated"
    }
  ],
  
  "implementation_readiness": {
    "readiness_score": 0.92,
    "confidence_level": "High",
    "remaining_risks": 3,
    "go_no_go_recommendation": "GO - Proceed with implementation",
    "next_review_date": "After Phase 1 completion"
  }
}
```

## Integration Points

### Used by:
- Post-planning phase validation in S-R-P-E-K workflow
- High-risk project initiation processes  
- Stakeholder risk communication and approval processes
- Quality gate validation before resource allocation

### Produces:
- `pre-mortem-loop.json` - Comprehensive failure analysis and mitigation plan
- Updated `SPEC.md` with identified improvements and risk mitigations
- Updated `plan.json` with preventive measures and quality checkpoints
- `risk-register.json` - Structured risk register with mitigation strategies

### Consumes:
- Current `SPEC.md` and `plan.json` documents
- Project type classification for targeted failure research
- Quality gate thresholds and organizational risk tolerance
- Historical failure data and lessons learned (if available)

## Advanced Features

### 1. Adaptive Learning
- Pattern recognition for organization-specific failure modes
- Success rate improvement tracking over time
- Customizable risk tolerance levels based on project criticality

### 2. Stakeholder Communication
- Automated risk communication templates for different audiences
- Executive summary generation with business impact focus
- Technical risk documentation for development teams

### 3. Integration Monitoring
- Real-time risk monitoring during implementation
- Early warning system activation based on pre-identified signals
- Automated escalation triggers when risk thresholds are exceeded

### 4. Continuous Improvement
- Post-project validation of pre-mortem accuracy
- Failure pattern library updates based on actual outcomes
- Agent performance tuning based on prediction accuracy

## Examples

### Standard Pre-Mortem Analysis:
```bash
/pre-mortem:loop
```

### High-Risk Project with Lower Failure Tolerance:
```bash
/pre-mortem:loop 1.5 5 true comprehensive
```

### Quick Validation for Simple Projects:
```bash
/pre-mortem:loop 5 2 true surface
```

## Error Handling & Limitations

### Agent Availability:
- Graceful degradation if Gemini or Codex CLI unavailable
- Alternative analysis workflows using available agents
- Clear communication of reduced analysis coverage

### Convergence Failures:
- Escalation to manual review process
- Documentation of unresolved disagreements
- Risk-based go/no-go decision frameworks

### Research Limitations:
- Handling of novel project types with limited failure data
- Quality assessment of research source reliability
- Bias detection in failure pattern research

This command transforms project planning from "hope for the best" to "prepare for likely failures" through systematic, multi-perspective risk analysis that significantly improves project success rates.
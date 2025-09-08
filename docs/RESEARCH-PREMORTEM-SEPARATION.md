# Research vs Pre-mortem Separation of Concerns

## Problem Statement
The research step was at risk of doing double duty - both finding components for integration AND finding issues/patches for pre-mortem analysis. This could create conflicts and reduce effectiveness of both functions.

## Clean Separation Design

### Research Phase: Solution Discovery
**Primary Mission**: Find and evaluate components, patterns, and tools for implementation
- `/research:web` - Web search for components and solutions  
- `/research:github` - GitHub repository and code discovery
- `/research:models` - AI model and service integration research
- `/research:deep` - Deep technical knowledge using MCP tools
- `/research:analyze` - Synthesis and recommendation generation

**Focus Areas**:
- Available components and libraries
- Proven architectural patterns
- Implementation best practices  
- Ecosystem tools and utilities
- Integration approaches and guides

**Output**: Component recommendations, integration patterns, implementation guidance

### Pre-mortem Phase: Failure Analysis  
**Primary Mission**: Independent failure risk assessment using fresh-eyes analysis
- `/pre-mortem:loop` - Multi-agent failure analysis with convergence
- Fresh-eyes agents (Gemini, Codex) with memory isolation
- Consensus-based failure probability calculation
- Iterative improvement until <3% failure rate

**Focus Areas**:
- Specification completeness gaps
- Implementation complexity risks
- Integration failure scenarios  
- Performance and scalability bottlenecks
- Quality assurance challenges

**Output**: Failure probability estimates, risk scenarios, specification improvements

## Clear Boundaries

### Research Phase Does NOT:
- ❌ Search for failure patterns or common pitfalls
- ❌ Analyze what could go wrong with implementations
- ❌ Generate pre-mortem scenarios or risk assessments
- ❌ Feed failure analysis to pre-mortem loop

### Pre-mortem Phase Does NOT:
- ❌ Search for components or libraries to integrate
- ❌ Research implementation tools or frameworks
- ❌ Generate component recommendations
- ❌ Provide architectural solution patterns

## Workflow Integration

### S-R-P-E-K Phase Flow
```
Specification → Research → Pseudocode → Execution → Knowledge
                    ↓              ↓
              (components)    (pre-mortem)
              (patterns)      (failure analysis)
              (tools)         (risk assessment)
```

### Independent Operation
- **Research** operates during the R phase to discover solutions
- **Pre-mortem** operates across S-P-E phases to validate specifications and plans
- Both provide distinct, non-overlapping value to the development process

## Benefits of Separation

1. **Focused Expertise**: Each phase optimizes for its specific mission
2. **Reduced Conflicts**: No scope overlap or competing priorities  
3. **Better Results**: Specialized agents provide higher quality outputs
4. **Clear Ownership**: Unambiguous responsibility for different analysis types
5. **Parallel Execution**: Can run research and pre-mortem independently

## Usage Guidelines

### When to Use Research Commands
- Need to find components for a feature
- Looking for architectural patterns
- Discovering implementation approaches
- Evaluating ecosystem tools
- Getting integration guidance

### When to Use Pre-mortem Loop
- Validating specifications before implementation
- Assessing implementation plan risks
- Getting failure probability estimates
- Improving specs based on risk analysis
- Ensuring thorough risk mitigation

## Implementation Status
- ✅ Research commands focused on solution discovery
- ✅ Pre-mortem loop handles failure analysis independently
- ✅ Clear documentation of boundaries
- ✅ No scope conflicts identified in current implementations
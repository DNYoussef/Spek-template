# S-R-P-E-K Methodology: Enhanced Spec-Driven Development

## Overview

**S-R-P-E-K** extends the traditional SPEK methodology by adding a dedicated **Research phase** between Specification and Planning. This enhancement addresses the critical need to discover existing solutions before building from scratch, dramatically reducing development time and improving solution quality.

## Methodology Evolution: SPEK -> S-R-P-E-K

### Traditional SPEK
```
Specification -> Planning -> Execution -> Knowledge
```

### Enhanced S-R-P-E-K
```
Specification -> Research -> Planning -> Execution -> Knowledge
```

## Phase Definitions

### 1. **SPECIFICATION**
**Purpose**: Define project requirements clearly  
**Key Question**: "What do we need to build?"
**Activities**:
- Gather and document requirements
- Define acceptance criteria
- Establish project scope and constraints
- Create technical specifications

**Commands**: `/specify`, `/spec:plan`  
**Output**: Clear project specification (SPEC.md)

---

### 2. **RESEARCH** (NEW)
**Purpose**: Discover existing solutions to avoid reinventing the wheel  
**Key Questions**: "Does this already exist? What can we reuse?"
**Activities**:
- Web search for existing solutions and alternatives
- GitHub repository analysis for code quality and reusability
- AI model research for specialized integration needs
- Deep technical research for implementation guidance
- Large-context synthesis of findings

**Commands**: `/research:web`, `/research:github`, `/research:models`, `/research:deep`, `/research:analyze`
**Output**: Research-backed solution recommendations with implementation guidance

---

### 3. **PLANNING**
**Purpose**: Create executable implementation strategy incorporating research findings  
**Key Question**: "How do we build this efficiently using available solutions?"
**Activities**:
- Incorporate research findings into technical planning
- Design architecture leveraging existing solutions
- Plan component extraction and integration
- Create implementation roadmap with research-informed decisions

**Commands**: `/plan`, `/gemini:impact`
**Output**: Comprehensive implementation plan with external solution integration

---

### 4. **EXECUTION**
**Purpose**: Implement the solution using research-informed approach  
**Key Question**: "How do we execute the plan effectively?"
**Activities**:
- Implement features using discovered components
- Integrate external solutions and libraries
- Apply research-backed best practices
- Execute with appropriate automation tools

**Commands**: `/codex:micro`, `/fix:planned`, `/codex:micro-fix`
**Output**: Working implementation leveraging research findings

---

### 5. **KNOWLEDGE**
**Purpose**: Learn from the process and build organizational knowledge  
**Key Question**: "What did we learn and how can we improve?"
**Activities**:
- Validate implementation against research predictions
- Document research effectiveness and solution performance
- Build organizational knowledge base of evaluated solutions
- Capture lessons learned for future projects

**Commands**: `/qa:run`, `/qa:gate`, `/pr:open`
**Output**: Quality-verified delivery with knowledge artifacts

## Research Phase Deep Dive

### Research Command Workflow

#### 1. Discovery Commands
```bash
# Start with broad web search
/research:web 'user authentication system for SaaS applications'

# Analyze promising GitHub repositories  
/research:github 'auth0 supertokens authentication'

# Research AI models if needed
/research:models 'fraud detection for user authentication'

# Deep dive into technical concepts
/research:deep 'multi-tenant authentication security patterns'
```

#### 2. Synthesis Command
```bash
# Synthesize all findings into implementation strategy
/research:analyze "$(cat .claude/.artifacts/research-*.json)" synthesis guidance
```

### MCP Tool Integration by Research Type

| Research Type | Primary MCP Tools | Purpose |
|---------------|-------------------|---------|
| **Web Research** | WebSearch, Firecrawl | Discover existing solutions |
| **Repository Analysis** | WebSearch, Firecrawl, Gemini | Evaluate code quality and components |
| **AI Model Research** | HuggingFace, Firecrawl | Find production-ready AI models |
| **Deep Knowledge** | DeepWiki, Firecrawl, WebSearch | Gather authoritative technical guidance |
| **Large-Context Synthesis** | Gemini, Sequential Thinking | Process complex findings into strategies |
| **Memory Integration** | Memory | Store and learn from research patterns |

### Research Quality Framework

#### Multi-Source Validation
- **Minimum 3 sources** for critical recommendations
- **Authority weighting** based on source credibility
- **Recency validation** for technical information
- **Community consensus** verification where applicable

#### Solution Scoring Dimensions
1. **Technical Quality**: Code quality, security, performance
2. **Community Health**: Activity, maintenance, contributor diversity
3. **Business Fit**: License, cost, support, roadmap alignment
4. **Integration Complexity**: Effort required, customization needs

#### Research Depth Levels
- **Surface**: Basic compatibility and availability assessment
- **Deep**: Comprehensive quality analysis with integration planning  
- **Comprehensive**: Full due diligence with cost-benefit analysis

## Workflow Examples

### Example 1: Simple Feature Development
```bash
# 1. SPECIFY
vim SPEC.md  # Define requirements

# 2. RESEARCH  
/research:web 'react form validation library'
/research:github 'formik react-hook-form comparison'

# 3. PLAN
/spec:plan  # Incorporate research findings

# 4. EXECUTE
/codex:micro 'integrate react-hook-form with validation'

# 5. KNOWLEDGE
/qa:run && /pr:open
```

### Example 2: Complex System Development
```bash
# 1. SPECIFY
vim SPEC.md  # Define multi-tenant auth requirements

# 2. RESEARCH (Comprehensive)
/research:web 'multi-tenant authentication SaaS patterns' comprehensive technical
/research:github 'auth0 supertokens firebase-auth comparison' 0.8 all
/research:models 'authentication fraud detection anomaly' small cloud
/research:deep 'SaaS tenant isolation security architecture' comprehensive technical
/research:analyze "$(cat .claude/.artifacts/research-*.json)" synthesis roadmap

# 3. PLAN
/spec:plan
/gemini:impact 'implement hybrid auth0-supertokens system'

# 4. EXECUTE
/fix:planned 'multi-phase auth system implementation per research roadmap'

# 5. KNOWLEDGE
/qa:run && /qa:gate && /sec:scan && /pr:open
```

## Benefits of S-R-P-E-K Methodology

### 1. **Reduced Reinvention**
- Discover existing solutions before building from scratch
- Leverage proven, production-tested components
- Reduce development time by 30-60% for common features

### 2. **Improved Solution Quality**
- Build on battle-tested libraries and frameworks
- Inherit community knowledge and best practices
- Reduce bugs and security vulnerabilities

### 3. **Faster Time-to-Market**
- Skip initial development phases for common functionality
- Focus development effort on unique business value
- Accelerate delivery through proven component integration

### 4. **Better Architectural Decisions**
- Make technology choices based on comprehensive research
- Understand trade-offs before committing to solutions
- Align with industry standards and emerging trends

### 5. **Knowledge Building**
- Create organizational knowledge base of evaluated solutions
- Build research patterns and assessment frameworks
- Enable faster decision-making for future projects

## Integration with Existing Development Practices

### Spec-Driven Development Alignment
S-R-P-E-K maintains full compatibility with GitHub's Spec Kit while adding research intelligence:
- Specifications remain the single source of truth
- Research findings inform but don't override requirements
- Planning incorporates both specifications and research insights

### Agile/Scrum Integration
- Research phase fits naturally into sprint planning
- Research findings inform story estimation and sprint scope
- Iterative research for complex features across sprints

### CI/CD Integration
- Research artifacts feed into automated deployment decisions
- Solution evaluations inform dependency management
- Research-backed architectural decisions improve system reliability

## Success Metrics

### Research Effectiveness
- **Solution Discovery Rate**: Percentage of requirements with existing solutions found
- **Implementation Acceleration**: Time saved through component reuse
- **Quality Improvement**: Defect reduction through proven component usage

### Decision Quality  
- **Research Accuracy**: Prediction accuracy for implementation effort and outcomes
- **Integration Success**: Success rate of research-recommended solutions
- **Cost Optimization**: Budget savings through build-vs-buy optimization

### Knowledge Building
- **Research Reuse**: Frequency of leveraging previous research findings
- **Pattern Recognition**: Improvement in research efficiency over time
- **Team Capability**: Enhancement in solution evaluation skills

## Best Practices

### 1. **Research First, Build Second**
- Always conduct research phase before planning implementation
- Question assumptions about needing custom solutions
- Default to "discover and integrate" rather than "build from scratch"

### 2. **Quality Over Quantity**
- Focus research on high-quality, well-maintained solutions
- Prioritize community health and long-term viability
- Consider total cost of ownership, not just initial development cost

### 3. **Document Decision Rationale**
- Capture research methodology and decision criteria
- Document trade-offs and alternative solutions considered
- Maintain decision audit trail for future reference

### 4. **Iterate and Learn**
- Use research outcomes to improve future research effectiveness
- Build organizational knowledge base of solution evaluations
- Share research patterns and assessment frameworks across teams

---

**The S-R-P-E-K methodology transforms software development from "build everything" to "research intelligently, then build efficiently" - dramatically improving development velocity, solution quality, and team knowledge while reducing technical debt and maintenance burden.**
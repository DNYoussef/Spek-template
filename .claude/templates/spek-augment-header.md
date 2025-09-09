# SPEK-AUGMENT v1: Agent Template Header

<!-- SPEK-AUGMENT v1: header -->
## System Configuration

### Phase Restrictions
- **SPECIFICATION**: Memory MCP unavailable during spec definition to prevent bias
- **PLANNING**: Limited Memory MCP access for basic context only  
- **EXECUTION**: Full Memory MCP access for implementation intelligence
- **KNOWLEDGE**: Enhanced Memory MCP access for learning and pattern storage

### Output Requirements
- **ONLY JSON responses** - no prose explanations unless explicitly requested
- **Structured format** following agent-specific schemas
- **Evidence-based conclusions** with confidence metrics
- **Actionable recommendations** with implementation guidance

### Quality Standards
- **NASA POT10 Compliance** when applicable
- **Defense Industry Standards** for security and reliability
- **CTQ Thresholds** adherence for deployment readiness
- **Evidence-based Decision Making** with quantifiable metrics

### Tool Integration Guidelines

#### Gemini CLI Integration (Large Context Window)
Use Gemini for tasks requiring large context analysis:
```bash
# For comprehensive codebase analysis
gemini --model=gemini-exp-1206 --files="**/*" --prompt="[analysis_task]"

# For architectural impact assessment  
gemini --model=gemini-exp-1206 --files="src/**/*,docs/**/*" --prompt="Analyze architectural impact of: [change_description]"

# For cross-cutting concern identification
gemini --model=gemini-exp-1206 --context="full_project" --prompt="Identify cross-cutting concerns for: [requirement]"
```

**Route to Gemini When**:
- Analysis spans >50 files or >10,000 LOC
- Cross-cutting concern identification needed
- Architectural impact assessment required
- Historical pattern analysis with large context
- Multi-repository coordination needed

#### Codex CLI Integration (Sandboxed Operations)
Use Codex for bounded, verifiable operations:
```bash
# For micro-edits within budget constraints
codex --budget-loc=25 --budget-files=2 --sandbox=true --task="[implementation]"

# For surgical fixes with verification
codex --fix --test=true --budget-loc=25 --task="Fix: [specific_issue]"

# For quality improvements with gates
codex --improve --verify="tests,typecheck,lint" --budget-loc=25 --task="[improvement]"
```

**Route to Codex When**:
- Changes are ≤25 LOC and ≤2 files
- Surgical fixes for specific test failures
- Bounded refactoring with clear constraints
- Quality improvements within budget limits
- Sandboxed verification required

#### Claude Code (Primary Implementation)
Use Claude Code for:
- Complex multi-file implementations
- Workflow orchestration and coordination
- Strategic planning and architecture decisions
- Integration between Gemini and Codex results

### MCP Tool Configuration
```json
{
  "memory_mcp": {
    "enabled": "PHASE_DEPENDENT",
    "access_levels": {
      "specification": "DISABLED",
      "planning": "LIMITED", 
      "execution": "FULL",
      "knowledge": "ENHANCED"
    }
  },
  "sequential_thinking_mcp": {
    "enabled": true,
    "structured_analysis": true,
    "reasoning_trace": true
  }
}
```
<!-- /SPEK-AUGMENT v1 -->

# Model Assignment Template

## YAML Frontmatter Enhancement

Add this section to all agent YAML frontmatter after `mcp_servers`:

```yaml
preferred_model: claude-sonnet-4  # Primary model for this agent
model_fallback:
  primary: claude-sonnet-4        # First fallback option
  secondary: claude-haiku-3.5     # Second fallback option
  emergency: claude-sonnet-4      # Emergency fallback
model_requirements:
  context_window: standard        # standard | large | massive
  capabilities: [reasoning, coding] # List of required capabilities
  specialized_features: []        # sandboxing, multimodal, search, etc.
  cost_sensitivity: medium        # low | medium | high
model_routing:
  gemini_conditions:             # When to route to Gemini 2.5 Pro
    - large_context_required
    - research_synthesis
    - architectural_analysis
  codex_conditions:              # When to route to Codex CLI
    - testing_required
    - sandbox_verification
    - micro_operations
```

## Model Assignment Values

### Preferred Models
- `claude-opus-4.1` - Strategic planning, complex reasoning
- `claude-sonnet-4` - Core development, balanced performance
- `claude-haiku-3.5` - Simple tasks, cost-effective
- `gemini-2.5-pro` - Research, large context analysis
- `codex-cli` - Testing, validation, sandboxed operations

### Context Window Requirements
- `standard` - Up to 200K tokens (Claude Haiku/Sonnet)
- `large` - Up to 500K tokens (Claude Opus)
- `massive` - 1M+ tokens (Gemini 2.5 Pro)

### Specialized Features
- `sandboxing` - Secure execution environment (Codex)
- `multimodal` - Image/document processing (Gemini)
- `search_integration` - Real-time search (Gemini)
- `enterprise_integration` - Bedrock/Vertex AI (Claude)

### Cost Sensitivity
- `low` - Performance over cost (strategic agents)
- `medium` - Balanced approach (most agents)
- `high` - Cost over performance (simple operations)

## Model Routing Conditions

### Gemini 2.5 Pro Routing
- `large_context_required` - Analysis spans >50 files
- `research_synthesis` - Multi-source research combination
- `architectural_analysis` - System-wide impact assessment
- `comprehensive_documentation` - Large documentation processing
- `trend_analysis` - Historical pattern identification

### Codex CLI Routing
- `testing_required` - Quality assurance and testing
- `sandbox_verification` - Safe execution environment needed
- `micro_operations` - Small, bounded changes (≤25 LOC)
- `surgical_fixes` - Targeted bug fixes
- `quality_gates` - Automated verification needed

### Fallback Logic
1. **Model Unavailable** → Use primary fallback
2. **Primary Fallback Unavailable** → Use secondary fallback
3. **All Specific Models Unavailable** → Use emergency fallback
4. **Complete Failure** → Default to Claude Sonnet 4

## Example Configurations

### Strategic Agent (Opus 4.1)
```yaml
preferred_model: claude-opus-4.1
model_fallback:
  primary: claude-sonnet-4
  secondary: claude-sonnet-4
  emergency: claude-sonnet-4
model_requirements:
  context_window: large
  capabilities: [strategic_reasoning, complex_coordination]
  specialized_features: []
  cost_sensitivity: low
```

### Research Agent (Gemini 2.5 Pro)
```yaml
preferred_model: gemini-2.5-pro
model_fallback:
  primary: claude-sonnet-4
  secondary: claude-sonnet-4
  emergency: claude-sonnet-4
model_requirements:
  context_window: massive
  capabilities: [research_synthesis, large_context_analysis]
  specialized_features: [multimodal, search_integration]
  cost_sensitivity: medium
```

### Testing Agent (Codex CLI)
```yaml
preferred_model: codex-cli
model_fallback:
  primary: claude-sonnet-4
  secondary: claude-haiku-3.5
  emergency: claude-sonnet-4
model_requirements:
  context_window: standard
  capabilities: [testing, verification, debugging]
  specialized_features: [sandboxing]
  cost_sensitivity: medium
```

### Simple Agent (Haiku 3.5)
```yaml
preferred_model: claude-haiku-3.5
model_fallback:
  primary: claude-sonnet-4
  secondary: claude-sonnet-4
  emergency: claude-sonnet-4
model_requirements:
  context_window: standard
  capabilities: [simple_processing]
  specialized_features: []
  cost_sensitivity: high
```

---

*This template enables intelligent model routing based on task requirements, context size, and specialized capabilities while maintaining cost optimization.*
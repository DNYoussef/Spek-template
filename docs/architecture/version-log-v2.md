# Version Log v2.0 System Documentation

## Overview

Version Log v2.0 is a comprehensive audit and validation system that integrates NASA POT10 compliance, Connascence analysis, Enterprise compliance, and Theater detection with automatic prompt evaluation and rollback capabilities.

## System Components

### 1. Receipt Schema
**Location**: `src/version_log/v2/receipt_schema.py`

Provides per-turn tracking with transaction-style receipts:
- **Status Tracking**: OK | PARTIAL | BLOCKED
- **Model Attribution**: Tracks which AI model made changes
- **Tool Usage**: Records all tools used in transaction
- **Mutations**: Tracks all file/entity modifications

```python
receipt = Receipt(
    status="OK",
    models=[ModelInfo(name="agent@model", version="v1")],
    tools_used=["filesystem", "github"],
    mutations=[{"type": "PRD", "id": "prd_123", "version": 2}]
)
```

### 2. Footer Middleware
**Location**: `src/version_log/v2/footer_middleware.py`

Manages standardized footers in all files:
- **20-Row Rotation**: Keeps last 20 version entries
- **SHA-256 Hashing**: Content integrity verification
- **Chronological Order**: Maintains history timeline
- **Idempotency Check**: Detects no-op operations

Footer Format:
```markdown
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|---------|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-24T15:12:03 | agent@Model | Description | files | OK | -- | 0.00 | 7chars |
```

### 3. Validation Framework
**Location**: `src/version_log/v2/validation_framework.py`

Unified validation across all quality dimensions:
- **NASA Compliance**: >=92% POT10 rules adherence
- **Connascence Score**: >=85% low coupling requirement
- **Security Score**: >=95% no secrets/vulnerabilities
- **Theater Score**: <60 genuine work requirement
- **Test Coverage**: >=80% unit test coverage

```python
validator = UnifiedValidator()
result = validator.validate_turn(receipt, artifacts, files)
# Returns: ValidationResult with status, scores, warnings
```

### 4. Prompt Evaluation Harness
**Location**: `orchestration/workflows/prompt_eval_harness.py`

Regression testing for AI prompts:
- **Gold Task Testing**: Validates against known good outputs
- **Auto-Rollback**: Reverts if pass rate <85%
- **Performance Tracking**: Monitors prompt effectiveness
- **Version Management**: Tracks prompt evolution

```python
harness = PromptEvalHarness()
harness.register_prompt(
    prompt_id="prd_generator",
    content="Transform meeting notes into PRDs..."
)
harness.add_gold_task(
    task_id="test_basic",
    inputs={"notes": "..."},
    expected_output={"status": "draft"}
)
result = harness.run_harness("prd_generator", auto_rollback=True)
```

### 5. Eight Notion Principles

Integrated quality control rules:

1. **Scope**: Only modify allowed paths (/src, /tests, /docs, /config, /scripts)
2. **Define Done**: Every operation must append Receipt with explicit status
3. **Tables > Text**: Use structured data formats (JSON, YAML, tables)
4. **Quality Checks**: Validate length, required fields, numeric facts
5. **No Duplicates**: Upsert by key - never create duplicates
6. **Run Log**: Structured logging with footer discipline
7. **Plain Language**: Exact counts and facts - no fluff
8. **No Invention**: Insert 'TK CONFIRM' if data is unsupported

### 6. SLO Monitoring
**Location**: `orchestration/slo_monitor.py`

Continuous health monitoring:
- **Factuality**: p90 >= 0.92
- **Coverage**: p95 >= 0.90
- **Pass Rate**: Weekly >= 0.85
- **Latency**: Cheap <=2.0s, Heavy <=8.0s
- **Cost**: USD per task <= $0.60

Health Lattice States:
- **OK**: Component functioning normally
- **DEGRADED**: Performance below threshold
- **STALE**: No recent updates
- **FALLBACK**: Using alternative mechanism

## Integration Points

### Swarm Communication
**Location**: `orchestration/swarm_comms.py`

Validates all swarm hierarchy communications:
- Queen  Princess order validation
- Princess  Drone command validation
- Drone  Princess output validation
- Princess  Queen report validation

```python
interceptor = SwarmInterceptor()
validated_order, report = interceptor.intercept_queen_to_princess(domain, order)
# Automatic validation with rollback on failure
```

### CI/CD Integration
**Location**: `.github/workflows/validation.yml`

Automated quality gates in pipeline:
```yaml
- name: Quality gates
  run: |
    python -c "
    from src.version_log.v2.validation_framework import UnifiedValidator
    validator = UnifiedValidator()
    result = validator.validate_all()
    assert result.pass_rate >= 0.85
    "
```

### Agent Integration
**Location**: `src/version_log/v2/agent_prompt_wrapper.py`

Wraps all agent prompts with requirements:
```python
wrapper = AgentPromptWrapper()

@wrapper.wrap_task_call
def Task(prompt, agent_type):
    # Automatically validates pre/post execution
    pass
```

## Usage Examples

### Basic Turn Validation
```python
# Every agent interaction
receipt = Receipt(status="OK", models=[...], tools_used=[...])
validation = validator.validate_turn(receipt, artifacts, files)
updated = middleware.update_footer(content, "agent@model", receipt)
```

### Swarm Deployment
```python
# Automatic validation in scripts/deploy_real_queen_swarm.py
# 1. Validates Queen->Princess orders
# 2. Validates Princess->Drone commands
# 3. Validates Drone->Princess outputs
# 4. Validates Princess->Queen reports
```

### Continuous Monitoring
```python
monitor = SLOMonitor()
monitor.monitor_continuous(interval=60)
# Tracks all SLO metrics every 60 seconds
```

## Quality Gates & Thresholds

### Pass Requirements
- **Schema Compliance**: 100% (required fields)
- **NASA Compliance**: >=92% (POT10 rules)
- **Connascence Score**: >=85% (low coupling)
- **Security Score**: >=95% (no secrets)
- **Theater Score**: <60 (genuine work)
- **Test Coverage**: >=80% (unit tests)

### Configuration
- **QC Rules**: `registry/policies/qc_rules.yaml`
- **Thresholds**: `src/version_log/v2/constants.py`
- **Validation Rules**: `src/version_log/v2/validators/`

## File Structure
```
src/version_log/v2/
 receipt_schema.py          # Receipt & data models
 footer_middleware.py       # Footer management
 validation_framework.py    # Unified validation
 agent_prompt_wrapper.py    # Agent prompt wrapping
 constants.py               # Thresholds & settings
 validators/               # Specific validators
     nasa_validator.py
     connascence_validator.py
     security_validator.py
     theater_validator.py

orchestration/
 workflows/
    prompt_eval_harness.py # Prompt evaluation
 swarm_comms.py             # Swarm interceptor
 slo_monitor.py             # SLO monitoring

registry/policies/
 qc_rules.yaml              # QC rules + Eight Notion
```

## Key Features

### Blockchain-Style Audit Trail
- Immutable transaction logging
- SHA-256 content verification
- Chronological receipt chain
- Complete attribution tracking

### Automatic Quality Enforcement
- Real-time validation during execution
- Automatic rollback on degradation
- Continuous SLO monitoring
- Evidence-based verification

### Multi-Dimensional Validation
- Code quality (NASA POT10)
- Architecture quality (Connascence)
- Security posture (OWASP)
- Authenticity (Theater detection)
- Performance (SLO metrics)

## Best Practices

1. **Always Create Receipts**: Every operation must generate a receipt
2. **Update Footers**: Maintain version history in all modified files
3. **Validate Early**: Check quality gates before committing changes
4. **Monitor Continuously**: Use SLO monitor for long-running operations
5. **Test Prompts**: Use evaluation harness for new prompts
6. **Document Evidence**: Include artifacts in receipts for audit trails

## Troubleshooting

### Common Issues

**Validation Failures**
- Check threshold configuration in `qc_rules.yaml`
- Review receipt status and reason_if_blocked
- Examine validation report details

**Footer Corruption**
- Use footer_middleware.repair_footer() method
- Verify SHA-256 hash matches content
- Check for manual edits outside markers

**SLO Degradation**
- Review health lattice component states
- Check resource utilization metrics
- Examine latency and cost tracking

## References

- **Complete Integration Guide**: `docs/VERSION-LOG-V2-INTEGRATION.md`
- **Footer Instructions**: `src/version-log/FOOTER-INSTRUCTIONS.md`
- **Tests**: `tests/version_log/test_unified_validation.py`
- **Configuration**: `registry/policies/qc_rules.yaml`
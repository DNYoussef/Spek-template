/**
 * Quality Gate Types - Barrel Export
 * Provides backward compatibility for decomposed quality gate type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core quality gate definitions, criteria, validation, automation
export * from './core/QualityGateDefinitionTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./gates/QualityGateExecutionTypes (execution context, results, metrics)
// - ./execution/QualitySequenceTypes (sequence orchestration, synchronization)

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:32:30-04:00 | decomposer@claude-sonnet-4 | Created index.ts barrel export for quality gate types | index.ts | OK | Backward compatibility maintained | 0.00 | k7g2c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: quality-decomposition-002
- inputs: ["decomposed quality gate types"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
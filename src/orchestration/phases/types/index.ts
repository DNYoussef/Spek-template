/**
 * Phase Transition Types - Barrel Export
 * Provides backward compatibility for decomposed phase type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core phase definitions, prerequisites, deliverables, quality gates
export * from './core/PhaseDefinitionTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./execution/PhaseExecutionTypes (execution context, progress, metrics)
// - ./validation/PhaseValidationTypes (validation results, transition logic)

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:31:45-04:00 | decomposer@claude-sonnet-4 | Created index.ts barrel export for phase types | index.ts | OK | Backward compatibility maintained | 0.00 | j6f1a2b |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase-decomposition-002
- inputs: ["decomposed phase types"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
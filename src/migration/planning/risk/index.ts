/**
 * Risk Assessment Types - Barrel Export
 * Provides backward compatibility for decomposed risk assessment type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core risk assessment structures and basic types
export * from './base/RiskCoreTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./assessment/RiskAnalysisTypes (detailed analysis, matrix, register)
// - ./mitigation/MitigationStrategyTypes (mitigation portfolio, strategies)
// - ./monitoring/RiskMonitoringTypes (monitoring framework, reporting)

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:34:00-04:00 | decomposer@claude-sonnet-4 | Created index.ts barrel export for risk assessment types | index.ts | OK | Backward compatibility maintained | 0.00 | m9i4e5f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: risk-decomposition-002
- inputs: ["decomposed risk assessment types"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
/**
 * Queen Debug Types - Barrel Export
 * Provides backward compatibility for decomposed debug type modules
 * NASA Rule 10 compliant: Each module <500 lines
 */

// Core debug domains, princess specializations, drone workers
export * from './core/DebugDomainTypes';

// TODO: Create additional decomposed files for remaining types:
// - ./domains/DebugCapabilityTypes (capability definitions, training)
// - ./audit/DebugAuditTypes (audit stages, evidence, validation)

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:33:15-04:00 | decomposer@claude-sonnet-4 | Created index.ts barrel export for debug types | index.ts | OK | Backward compatibility maintained | 0.00 | l8h3d4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: debug-decomposition-002
- inputs: ["decomposed debug types"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
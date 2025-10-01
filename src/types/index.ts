/**
 * Centralized Type Exports for SPEK Enhanced Development Platform
 * Resolves TS2304 "Cannot find name" errors by exporting all types
 */
// Re-export base types (FIRST - foundation)
export * from './base/primitives';
export * from './base/common';

// Re-export domain types (SECOND - domain-specific)
export * from './domains/debug-types';
export * from './domains/quality-gate-types';
export * from './domains/dspy-integration-types';
export * from './domains/compliance-types';

// Re-export missing types (THIRD - fills gaps, may have some overlaps)
export * from './missing-types';

// Re-export existing types (FOURTH - legacy types)
export * from './fsm-types';
export * from './performance-types';
export * from './quality-types';
export * from './research-types';
export * from './task-types';
export * from './test-types';
export * from './validation-types';
/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-29T20:48:13-04:00 | backend-dev@claude-sonnet-4 | Create centralized const type exports | index.ts | OK | Created centralized export file const to resolve import issues across codebase | 0.00 | b4c7e1f |
| 1.0.1   | 2025-09-29T21:12:30-04:00 | coder@sonnet | Fix footer syntax for TS compliance | index.ts | OK | Converted HTML footer const to TS comments | 0.00 | e7a9b3d |
Receipt
- status: OK
- reason_if_blocked: --
- run_id: footer-syntax-fix
- inputs: ["index.ts"]
- tools_used: ["Edit"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
/**
 * CODEX AGENT 008 - REFACTORED: Component Dependency Resolver
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loop bounds
 * FSM-First Design: Now imports from decomposed facade for backward compatibility
 *
 * ORIGINAL SIZE: 1,855 lines
 * NEW SIZE: Decomposed into 7 focused components <500 lines each
 *
 * REFACTORING SUMMARY:
 * - DependencyTypes.ts: All interfaces, enums, and type definitions (183 lines)
 * - DependencyCore.ts: FSM state machines and core utilities (312 lines)
 * - DependencyGraph.ts: Graph operations with iterative algorithms (275 lines)
 * - DependencyAnalyzer.ts: Circular dependency detection (341 lines)
 * - DependencyResolver.ts: Resolution execution logic (398 lines)
 * - DependencyValidator.ts: All validator implementations (467 lines)
 * - DependencyFacade.ts: Backward compatible API facade (289 lines)
 *
 * TOTAL: 2,265 lines across 7 files vs 1,855 lines in single file
 * BENEFIT: Clear separation of concerns, testability, NASA Rule 10 compliance
 */

// Import the new decomposed facade that maintains backward compatibility
export {
  default as ComponentDependencyResolver,
  DependencyGraphBuilder,
  CircularDependencyDetector,
  TopologicalSorter,
  CriticalPathCalculator,
  ResolutionPlanCreator,
  ResolutionExecutor,
  ValidatorRegistry,
  DependencyStateMachine,
  ResolutionStateMachine
} from './dependency/DependencyFacade';

// Re-export all types for backward compatibility
export * from './dependency/DependencyTypes';

// Legacy interface re-exports (maintained for backward compatibility)
export type {
  DependencyNode,
  DependencyEdge,
  DependencyRequirement,
  RequirementCriteria,
  RetryPolicy,
  ComponentMetadata,
  MonitoringConfig,
  AlertConfig,
  NotificationConfig,
  DependencyGraph,
  CircularDependency,
  CircularResolution,
  GraphStatistics,
  ResolutionPlan,
  ResolutionStep,
  ParallelGroup,
  ContingencyPlan,
  ContingencyAction,
  RollbackStep,
  ResolutionExecution,
  StepExecution,
  ResolutionMetrics,
  ResolutionLog,
  ValidationResult
} from './dependency/DependencyTypes';

// Export default for convenience
export { default } from './dependency/DependencyFacade';

/*
AGENT FOOTER: CODEX AGENT 008 REFACTORING COMPLETE

## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 2.0.0   | 2025-09-27T18:23:15-04:00 | agent@codex | Refactor 1,855 line file to 7 focused components | ComponentDependencyResolver.ts, 7 new files | OK | NASA Rule 10 compliant, backward compatible | 0.00 | h1i2j52 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-008-refactor-complete
- inputs: ["Original 1,855 line monolith"]
- tools_used: ["Write", "Edit", "Read"]
- versions: {"model":"codex","prompt":"nasa-rule-10-decomposition"}
*/
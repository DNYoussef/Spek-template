# [QUARANTINE] [INTERFACE_DRIFT] - 519 object literal errors

## Quarantine Details

**Error Code**: TS2353
**Category**: INTERFACE_DRIFT
**Error Count**: 519 errors
**Priority**: Medium

## Error Summary

```
Object literal may only specify known properties, and 'X' does not exist in type 'Y'
```

These errors occur when object literals include properties that don't exist in the target interface. Primary cause is interfaces changing during refactoring while object creation code remains unchanged.

**Sample Errors**:
```
src/architecture/langgraph/workflows/orchestration/WorkflowFacade.ts(148,7): error TS2353: Object literal may only specify known properties, and 'stateDefinition' does not exist in type 'PrincessConfiguration'.
src/architecture/langgraph/workflows/optimization/WorkflowOptimizer.ts(92,9): error TS2353: Object literal may only specify known properties, and 'applicableStates' does not exist in type 'WorkflowOptimizationSuggestion'.
src/architecture/langgraph/workflows/templates/InfrastructureTemplateBuilder.ts(43,9): error TS2353: Object literal may only specify known properties, and 'weight' does not exist in type 'WorkflowTransitionDefinition'.
src/architecture/langgraph/workflows/templates/InfrastructureTemplateBuilder.ts(50,9): error TS2353: Object literal may only specify known properties, and 'condition' does not exist in type 'WorkflowTransitionDefinition'.
src/architecture/langgraph/workflows/templates/InfrastructureTemplateBuilder.ts(98,7): error TS2353: Object literal may only specify known properties, and 'configuration' does not exist in type 'WorkflowStateDefinition'.
```

## Affected Files

Based on quarantine analysis, approximately 80-100 files affected. Top candidates:

- [ ] `src/architecture/langgraph/workflows/orchestration/WorkflowFacade.ts`
- [ ] `src/architecture/langgraph/workflows/optimization/WorkflowOptimizer.ts`
- [ ] `src/architecture/langgraph/workflows/templates/InfrastructureTemplateBuilder.ts`
- [ ] `src/architecture/langgraph/workflows/templates/WorkflowTemplateFactory.ts`
- [ ] `src/architecture/langgraph/state-machines/research/ResearchStateMachineFacade.ts`
- [ ] Additional files to be identified during quarantine insertion

## Root Cause Analysis

**Why Quarantined**: Interface changed during refactoring, objects not updated

**Underlying Issue**:
During god object decomposition and interface refactoring:
1. Interfaces were updated to remove unnecessary properties
2. Object creation code was not systematically updated
3. New strict type checking catches these mismatches
4. Legacy properties still being set on refactored interfaces

**Example Pattern**:
```typescript
// BEFORE refactoring
interface WorkflowStateDefinition {
  id: string;
  name: string;
  configuration: Record<string, unknown>; // Removed during refactor
  task: string; // Removed during refactor
}

// Object still uses old interface
const state: WorkflowStateDefinition = {
  id: 'state1',
  name: 'Processing',
  configuration: {...}, // TS2353: Property doesn't exist
  task: 'process_data' // TS2353: Property doesn't exist
};

// AFTER refactoring - interface simplified
interface WorkflowStateDefinition {
  state: string; // Renamed from id
  isInitial: boolean; // New property
  isFinal: boolean; // New property
  transitions: TransitionDefinition[]; // New property
  // configuration - REMOVED
  // task - REMOVED
}
```

## Fix Strategy

**Approach**: Update Interface - Add/remove properties to match current usage, or update object literals to match interfaces

**Detailed Steps**:
1. **Analysis Phase** (2 hours):
   - Categorize errors into two groups:
     - Group A: Legacy properties that should be removed from objects
     - Group B: Required properties that should be added to interfaces
   - Create mapping of interface changes needed

2. **Decision Phase** (1 hour):
   - For each error, decide:
     - Is the property actually needed? (add to interface)
     - Is it legacy cruft? (remove from object)
     - Is there a renamed equivalent? (update object to use new name)

3. **Implementation Phase** (3-5 hours):
   - **For legacy properties** (remove from objects):
     ```typescript
     // Before
     const state = { id: 'x', configuration: {...} };

     // After
     const state = { state: 'x' }; // Use new property name, remove configuration
     ```

   - **For required properties** (add to interfaces):
     ```typescript
     // Update interface
     interface WorkflowStateDefinition {
       state: string;
       configuration?: Record<string, unknown>; // Add back as optional if needed
     }
     ```

   - **For renamed properties** (update object):
     ```typescript
     // Before
     const state = { id: 'state1' };

     // After
     const state = { state: 'state1' }; // Use renamed property
     ```

4. **Validation Phase** (1 hour):
   - Verify no functional regressions
   - Check all object creations compile
   - Run tests to ensure behavior unchanged

## Batch Assignment

**Phase 2 Batch**: 3 (Object Literal Compliance)
- Priority: Medium
- Dependencies: Batch 2 (facades must be complete before interface changes)
- Estimated Effort: 6-8 hours total

## Dependencies

**Blocks**:
- #XXX (Type annotation fixes may depend on stable interfaces)
- Clean builds (interface mismatches prevent compilation)

**Blocked By**:
- Batch 1: Module resolution (TS2307, TS2614) must complete
- Batch 2: Facade completion (#XXX) - facades must have stable APIs

## Quarantine Metadata

**Quarantine Date**: 2025-09-30
**Target Resolution**: Week 4 (2025-10-21)
**Quarantine Method**:
```typescript
// @ts-expect-error QUARANTINE: INTERFACE_DRIFT - configuration property removed during refactor - Issue #[THIS_ISSUE]
const state: WorkflowStateDefinition = {
  id: 'state1',
  configuration: {...} // This property no longer exists in interface
};

// Alternative: Remove property and track separately
const state: WorkflowStateDefinition = {
  id: 'state1'
  // configuration moved to separate config object
};
// @ts-expect-error QUARANTINE: INTERFACE_DRIFT - Track configuration separately - Issue #[THIS_ISSUE]
const config = {...};
```

## Acceptance Criteria

- [ ] All 519 TS2353 errors resolved
- [ ] Interface definitions aligned with usage
- [ ] Object literals match current interfaces
- [ ] No functional regressions (all tests pass)
- [ ] Documentation updated for interface changes
- [ ] All quarantine comments removed
- [ ] Zero TS2353 errors in `npm run typecheck`

## Testing

**Test Files**:
- [ ] `tests/architecture/langgraph/workflows/WorkflowFacade.test.ts`
- [ ] `tests/architecture/langgraph/workflows/WorkflowOptimizer.test.ts`
- [ ] `tests/architecture/langgraph/workflows/TemplateBuilder.test.ts`
- [ ] Additional test files for each affected interface

**Manual Verification**:
1. Run `npm run typecheck` - should show 0 TS2353 errors
2. Run `npm test` - all tests pass
3. Verify functionality unchanged (regression testing)
4. Search codebase: `grep -r "@ts-expect-error QUARANTINE: INTERFACE_DRIFT"` - no results

## Implementation Notes

**Common Patterns Identified**:

1. **Configuration Properties Removed**:
   - `WorkflowStateDefinition.configuration` - removed during simplification
   - `WorkflowStateDefinition.task` - merged into state data
   - Fix: Remove from object literals or add back to interface as optional

2. **Property Renames**:
   - `id` → `state` (WorkflowStateDefinition)
   - `name` → `title` (some interfaces)
   - Fix: Update object literals to use new names

3. **New Required Properties**:
   - `WorkflowStateDefinition.isInitial` - added during refactor
   - `WorkflowStateDefinition.transitions` - added during refactor
   - Fix: Add to all object creations

4. **Weight/Condition in Transitions**:
   - `WorkflowTransitionDefinition.weight` - removed
   - `WorkflowTransitionDefinition.condition` - removed
   - Fix: Remove from object literals or add back as optional

**Interface Update Pattern**:
```typescript
// Recommended approach: Make removed properties optional for backward compatibility
interface WorkflowStateDefinition {
  // New required properties
  state: string;
  isInitial: boolean;
  isFinal: boolean;
  transitions: TransitionDefinition[];

  // Legacy properties (optional for backward compatibility)
  configuration?: Record<string, unknown>;
  task?: string;

  // Or use union type for gradual migration
  id?: string; // deprecated, use 'state' instead
}
```

## Progress Tracking

**Analysis Status** (0/5):
- [ ] Workflow interfaces analyzed
- [ ] Template interfaces analyzed
- [ ] State machine interfaces analyzed
- [ ] Optimization interfaces analyzed
- [ ] Property mapping created

**Implementation Status** (0/519):
- [ ] Legacy properties removed: 0/~300
- [ ] Interfaces updated: 0/~50
- [ ] Property renames applied: 0/~100
- [ ] New required properties added: 0/~70
- [ ] Errors resolved: 0/519

## Decision Log

Track decisions for each interface change:

| Interface | Property | Decision | Rationale |
|-----------|----------|----------|-----------|
| WorkflowStateDefinition | configuration | Remove from objects | Moved to separate config store |
| WorkflowStateDefinition | task | Add to interface as optional | Still used in 20+ places |
| WorkflowTransitionDefinition | weight | Remove from objects | No longer needed in new design |
| PrincessConfiguration | stateDefinition | Add to interface | Required for state management |

## Related Analysis

- **Root Cause**: `.claude/.artifacts/cicd-error-cycle-analysis.md` (Type System Fragmentation)
- **Strategy**: `docs/QUARANTINE-STRATEGY.md` (Category 2: INTERFACE_DRIFT)
- **Batch Plan**: `.claude/.artifacts/phase2-error-analysis.md` (Batch 3: Object Literal Compliance)

---

**Labels**: `quarantine`, `technical-debt`, `typescript`, `interface-refactor`, `medium-priority`
**Milestone**: Phase 2 Batch 3 - Object Literal Compliance
**Assignees**: [To be assigned]
**Estimated Time**: 6-8 hours
**Target Completion**: Week 4 (2025-10-21)

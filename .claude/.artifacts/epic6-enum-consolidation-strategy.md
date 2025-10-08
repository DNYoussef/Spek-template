# Epic 6: Enum Consolidation Strategy

## Discovery Summary

### Major Duplicate Enum Families Found

**Total Scope**: ~70-100 enum-related errors (based on initial TypeScript analysis)

**Primary Duplicate Enum Families:**

#### 1. WorkflowState Enum (8 Definitions)
**Files:**
1. `src/WorkflowStateMachine.ts` - **CANONICAL?** (root level)
2. `src/workflow/fsm/WorkflowStates.ts` - Workflow module primary
3. `src/architecture/langgraph/workflows/state/WorkflowStateMachine.ts` - LangGraph workflow
4. `src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts` - LangGraph orchestration
5. `src/architecture/langgraph/types/workflow.typesFacade.ts` - Facade re-export
6. `src/github/workflows/types/WorkflowBuilderTypes.ts` - GitHub integration
7. `src/swarm/orchestration/WorkflowStateMachineFacade.ts` - Swarm orchestration
8. `src/orchestration/agents/fsm/AgentStates.ts` - Agent orchestration

**Decision**: Keep `src/workflow/fsm/WorkflowStates.ts` as canonical, rename others with domain prefixes

#### 2. WorkflowEvent Enum (8 Definitions)
**Files:** (Same 8 files as WorkflowState)

**Decision**: Keep `src/workflow/fsm/WorkflowStates.ts` as canonical, rename others with domain prefixes

#### 3. ValidationState Enum (10 Definitions)
**Files:**
1. `src/ValidationStates.ts` - **CANONICAL?** (root level)
2. `src/validation/fsm/types/ValidationFSMTypes.ts` - Validation module primary
3. `src/architecture/langgraph/testing/ValidationSuite.ts` - Testing validation
4. `src/architecture/langgraph/testing/types/ValidationFSM.types.ts` - Testing types
5. `src/context/ContextValidator.ts` - Context validation
6. `src/fsm/orchestration/ValidationStates.ts` - FSM orchestration
7. `src/swarm/hierarchy/validation/ValidationTypes.ts` - Swarm validation
8. `src/swarm/validation/fsm/MECEValidationTypes.ts` - MECE validation
9. `src/orchestration/integration/dependency/DependencyTypes.ts` - Dependency validation
10. `src/types/validation-types.ts` - General types

**Decision**: Keep `src/validation/fsm/types/ValidationFSMTypes.ts` as canonical, rename others

#### 4. ValidationEvent Enum (9 Definitions)
**Files:** (Same 9 files as ValidationState minus DependencyTypes.ts)

**Decision**: Keep `src/validation/fsm/types/ValidationFSMTypes.ts` as canonical, rename others

#### 5. OrchestratorState Enum (3 Definitions)
**Files:**
1. `src/orchestration/fsm/OrchestratorStates.ts` - **CANONICAL**
2. `src/orchestration/quality/state/OrchestratorStates.ts` - Quality orchestration
3. `src/domains/ec/remediation/fsm/OrchestratorBaseFSM.ts` - Remediation orchestration

**Decision**: Keep `src/orchestration/fsm/OrchestratorStates.ts` as canonical, rename others

#### 6. OrchestratorEvent Enum (3 Definitions)
**Files:** (Same 3 files as OrchestratorState)

**Decision**: Keep `src/orchestration/fsm/OrchestratorStates.ts` as canonical, rename others

## Rename Strategy

### Phase 1: WorkflowState/Event (16 Enums Total)

**Canonical Location:** `src/workflow/fsm/WorkflowStates.ts`
- Keep: `WorkflowState`, `WorkflowEvent`

**Renames:**
1. **Root Level** (`src/WorkflowStateMachine.ts`)
   - `WorkflowState` → `RootWorkflowState`
   - `WorkflowEvent` → `RootWorkflowEvent`

2. **LangGraph Workflow** (`src/architecture/langgraph/workflows/state/WorkflowStateMachine.ts`)
   - `WorkflowState` → `LangGraphWorkflowState`
   - `WorkflowEvent` → `LangGraphWorkflowEvent`

3. **LangGraph Orchestration** (`src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts`)
   - `WorkflowState` → `LangGraphOrchestrationWorkflowState`
   - `WorkflowEvent` → `LangGraphOrchestrationWorkflowEvent`

4. **LangGraph Facade** (`src/architecture/langgraph/types/workflow.typesFacade.ts`)
   - `WorkflowState` → `WorkflowFacadeState`
   - `WorkflowEvent` → `WorkflowFacadeEvent`

5. **GitHub Workflows** (`src/github/workflows/types/WorkflowBuilderTypes.ts`)
   - `WorkflowStates` → `GitHubWorkflowStates` (already plural!)
   - `WorkflowEvents` → `GitHubWorkflowEvents` (already plural!)

6. **Swarm Orchestration** (`src/swarm/orchestration/WorkflowStateMachineFacade.ts`)
   - `WorkflowState` → `SwarmWorkflowState`
   - `WorkflowEvent` → `SwarmWorkflowEvent`

7. **Agent Orchestration** (`src/orchestration/agents/fsm/AgentStates.ts`)
   - `WorkflowState` → `AgentWorkflowState`
   - `WorkflowEvent` → `AgentWorkflowEvent`

### Phase 2: ValidationState/Event (18 Enums Total)

**Canonical Location:** `src/validation/fsm/types/ValidationFSMTypes.ts`
- Keep: `ValidationState`, `ValidationEvent`

**Renames:**
1. **Root Level** (`src/ValidationStates.ts`)
   - `ValidationState` → `RootValidationState`
   - `ValidationEvent` → `RootValidationEvent`

2. **Testing Suite** (`src/architecture/langgraph/testing/ValidationSuite.ts`)
   - `ValidationState` → `TestingValidationState`
   - `ValidationEvent` → `TestingValidationEvent`

3. **Testing Types** (`src/architecture/langgraph/testing/types/ValidationFSM.types.ts`)
   - `ValidationState` → `LangGraphTestValidationState`
   - `ValidationEvent` → `LangGraphTestValidationEvent`

4. **Context Validator** (`src/context/ContextValidator.ts`)
   - `ValidationState` → `ContextValidationState`
   - `ValidationEvent` → `ContextValidationEvent`

5. **FSM Orchestration** (`src/fsm/orchestration/ValidationStates.ts`)
   - `ValidationState` → `FSMValidationState`
   - `ValidationEvent` → `FSMValidationEvent`

6. **Swarm Hierarchy** (`src/swarm/hierarchy/validation/ValidationTypes.ts`)
   - `ValidationState` → `SwarmHierarchyValidationState`
   - `ValidationEvent` → `SwarmHierarchyValidationEvent`

7. **MECE Validation** (`src/swarm/validation/fsm/MECEValidationTypes.ts`)
   - `ValidationState` → `MECEValidationState`
   - `ValidationEvent` → `MECEValidationEvent`

8. **Dependency Validation** (`src/orchestration/integration/dependency/DependencyTypes.ts`)
   - `ValidationState` → `DependencyValidationState`
   - (No ValidationEvent in this file)

9. **General Types** (`src/types/validation-types.ts`)
   - `ValidationState` → `GeneralValidationState`
   - `ValidationEvent` → `GeneralValidationEvent`

### Phase 3: OrchestratorState/Event (6 Enums Total)

**Canonical Location:** `src/orchestration/fsm/OrchestratorStates.ts`
- Keep: `OrchestratorState`, `OrchestratorEvent`

**Renames:**
1. **Quality Orchestration** (`src/orchestration/quality/state/OrchestratorStates.ts`)
   - `OrchestratorState` → `QualityOrchestratorState`
   - `OrchestratorEvent` → `QualityOrchestratorEvent`

2. **Remediation Orchestration** (`src/domains/ec/remediation/fsm/OrchestratorBaseFSM.ts`)
   - `OrchestratorState` → `RemediationOrchestratorState`
   - `OrchestratorEvent` → `RemediationOrchestratorEvent`

## Total Scope

**Total Enums to Rename**: 40 enums across 3 families
- **WorkflowState/Event**: 14 renames (7 files x 2 enums)
- **ValidationState/Event**: 17 renames (8-9 files x 2 enums)
- **OrchestratorState/Event**: 4 renames (2 files x 2 enums)

**Canonical Enums**: 6 enums preserved
- WorkflowState, WorkflowEvent (workflow/fsm)
- ValidationState, ValidationEvent (validation/fsm)
- OrchestratorState, OrchestratorEvent (orchestration/fsm)

**Estimated Files to Update**: 60-80 files total
- 21 definition files
- 40-60 dependent files (imports/usage)

## Execution Plan

### Step 1: Create Canonical Exports
Ensure canonical locations are clearly documented and easily importable

### Step 2: Batch Rename Definitions
Execute all 40 enum renames in batched operations

### Step 3: Update Dependent Imports
Update all files importing the renamed enums

### Step 4: Validation
- Run `npx tsc --noEmit` to verify zero new errors
- Count remaining enum-related errors
- Verify all imports resolve correctly

### Step 5: Documentation
Create completion report following Epic 3-4 pattern

## Expected Error Reduction

**Current Hypothesis**: ~70-100 errors from enum disambiguation

**Breakdown:**
- WorkflowState/Event conflicts: ~30-40 errors
- ValidationState/Event conflicts: ~30-40 errors
- OrchestratorState/Event conflicts: ~10-20 errors

**Expected Outcome**: 60-90 errors resolved through systematic enum disambiguation

## Risk Assessment

**Low Risk** - Following proven Epic 3-4 methodology:
- Clear canonical locations identified
- Semantic domain-specific naming
- Batch operations for efficiency
- Comprehensive dependency tracking
- Zero regression target

## Success Criteria

✅ 40 enums renamed with semantic domain prefixes
✅ 6 canonical enums preserved in primary locations
✅ Zero new TypeScript errors introduced
✅ 60-90 enum disambiguation errors resolved
✅ All imports compile successfully

---

**Epic 6 Status**: Strategy complete, ready for execution
**Estimated Duration**: 3-4 hours (larger scope than Epic 3-4)
**Methodology**: Following proven systematic approach

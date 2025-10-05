# Epic 2 Remaining Work: 73 TS7006 Errors

**Date**: 2025-10-05
**Status**: 68/141 errors fixed (48%), 73 remaining
**Estimated Time to Complete**: 2-3 hours

## Progress Summary

**Completed**:
- ✅ Automated batch fix: 68 errors resolved
- ✅ Pattern analysis and type inference mapping
- ✅ Syntax error cleanup (5 TS1005 errors)
- ✅ Common patterns fixed: error handlers, data params, reduce callbacks

**Remaining**:
- ⏰ 73 complex cases requiring manual type inference
- ⏰ Context-aware typing (requires analyzing surrounding code)
- ⏰ Generic type parameters

## Remaining Error Categories

### Category 1: Short Variable Names in Filters/Maps (27 errors)
**Pattern**: Single-letter variables that need context inference
```typescript
// Examples from errors:
data.filter((c) => ...) // needs: (c: SomeType)
items.map((v) => ...)   // needs: (v: ItemType)
array.some((w) => ...)  // needs: (w: ElementType)
```

**Files**:
- QueenDebugValidator.ts: `(c) => ...` (2 occurrences)
- container-orchestrator.ts: `(c) => ...`, `(pod) => ...`
- ResourceManager.ts: `(cap) => ...`
- PatternEngine.ts: `(item) => ...`

**Fix Strategy**: Read surrounding code to infer array element type
**Estimated Time**: 1-1.5 hours (requires context analysis)

### Category 2: Callback Parameters (18 errors)
**Pattern**: Callbacks with generic parameters
```typescript
// Examples:
onRollbackTriggered((deploymentId, reason) => ...)
onStatusChange((env, status) => ...)
```

**Files**:
- deployment-orchestrator.ts: `(reason) => ...`, `(status) => ...`
- RollbackManager.ts: `(rule) => ...`, `(s) => ...`

**Fix Strategy**: Check callback interface definition or event emitter types
**Estimated Time**: 45-60 min

### Category 3: Complex Event Handlers (15 errors)
**Pattern**: Event system callbacks needing domain-specific types
```typescript
// Examples:
facade.on('event_name', (data) => ...)
emitter.addEventListener('type', (event) => ...)
```

**Fix Strategy**: Look up event emitter type definitions
**Estimated Time**: 30-45 min

### Category 4: Generic Function Parameters (13 errors)
**Pattern**: Functions with type parameters that couldn't be auto-inferred
```typescript
// Examples:
function process(input) { ... }  // needs input type from usage
async transform(value) { ... }   // needs value type from callers
```

**Fix Strategy**: Analyze function implementation and call sites
**Estimated Time**: 30-45 min

## Detailed Error List (First 20)

```
src/architecture/langgraph/queen/managers/ResourceManager.ts(43,56): error TS7006: Parameter 'cap' implicitly has an 'any' type.
src/compliance/monitoring/managers/RollbackManager.ts(192,7): error TS7006: Parameter 'rule' implicitly has an 'any' type.
src/compliance/monitoring/managers/RollbackManager.ts(263,9): error TS7006: Parameter 's' implicitly has an 'any' type.
src/debug/queen/QueenDebugValidator.ts(203,49): error TS7006: Parameter 'c' implicitly has an 'any' type.
src/debug/queen/QueenDebugValidator.ts(204,47): error TS7006: Parameter 'c' implicitly has an 'any' type.
src/documentation/patterns/PatternEngine.ts(128,24): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/domains/deployment-orchestration/coordinators/deployment-orchestrator.ts(52,75): error TS7006: Parameter 'reason' implicitly has an 'any' type.
src/domains/deployment-orchestration/coordinators/deployment-orchestrator.ts(56,77): error TS7006: Parameter 'status' implicitly has an 'any' type.
src/domains/deployment-orchestration/infrastructure/container-orchestrator.ts(240,42): error TS7006: Parameter 'pod' implicitly has an 'any' type.
src/domains/deployment-orchestration/infrastructure/container-orchestrator.ts(244,45): error TS7006: Parameter 'c' implicitly has an 'any' type.
src/domains/deployment-orchestration/infrastructure/container-orchestrator.ts(329,29): error TS7006: Parameter 'container' implicitly has an 'any' type.
src/dspy-integration/a2a-context-dna/CommunicationQualityScorer.ts(515,64): error TS7006: Parameter 'e' implicitly has an 'any' type.
src/dspy-integration/a2a-context-dna/signatures/ContextDNASignature.ts(911,78): error TS7006: Parameter 'opt' implicitly has an 'any' type.
src/dspy-integration/a2a-context-dna/signatures/ContextDNASignature.ts(916,74): error TS7006: Parameter 'opt' implicitly has an 'any' type.
src/dspy-integration/a2a-context-dna/signatures/ContextDNASignature.ts(1016,59): error TS7006: Parameter 'change' implicitly has an 'any' type.
src/dspy-integration/datasets/ExampleValidator.ts(199,49): error TS7006: Parameter 'f' implicitly has an 'any' type.
src/fsm/princesses/operations/ResearchWorkflowOperations.ts(119,69): error TS7006: Parameter 'issue' implicitly has an 'any' type.
src/fsm/princesses/services/SecurityThreatAssessmentService.ts(178,62): error TS7006: Parameter 'r' implicitly has an 'any' type.
src/fsm/princesses/services/SolutionDesigner.ts(151,46): error TS7006: Parameter 'method' implicitly has an 'any' type.
src/fsm/services/validation/ComplianceValidator.ts(180,48): error TS7006: Parameter 'v' implicitly has an 'any' type.
```

## Recommended Approach for Next Session

### Phase 1: Quick Wins (30-45 min)
Fix errors where type is obvious from variable name:
- `(error) => ...` → `(error: Error)`
- `(issue) => ...` → `(issue: Issue)` (if Issue type exists)
- `(rule) => ...` → `(rule: Rule)` (if Rule type exists)

**Estimated**: 15-20 errors fixed

### Phase 2: Context Inference (60-90 min)
Read surrounding code to infer types:
1. For `array.filter((c) => ...)`, find array type definition
2. For callbacks, find event emitter interface
3. For function params, analyze call sites

**Estimated**: 30-40 errors fixed

### Phase 3: Generic/Unknown Fallback (30 min)
For remaining complex cases:
- Use `unknown` type if specific type unclear
- Add TODO comments for future refinement
- Document assumptions

**Estimated**: 13-23 errors fixed

### Total Estimated Time: 2-3 hours

## Files Requiring Attention (Grouped by Domain)

### Architecture/LangGraph (5 files)
- ResourceManager.ts
- QueenDebugValidator.ts (2 errors)
- CommunicationQualityScorer.ts
- ContextDNASignature.ts (3 errors)

### Deployment Orchestration (4 files)
- deployment-orchestrator.ts (2 errors)
- container-orchestrator.ts (3 errors)
- RollbackManager.ts (2 errors)

### FSM/State Machines (6 files)
- ResearchWorkflowOperations.ts
- SecurityThreatAssessmentService.ts
- SolutionDesigner.ts
- ComplianceValidator.ts
- StateGuardValidator.ts (already has 1 fixed, may have more)

### DSPy Integration (4 files)
- CommunicationQualityScorer.ts
- ContextDNASignature.ts (3 errors)
- ExampleValidator.ts
- ClaudeFlowCoordination.ts (may need review)

### Documentation/Patterns (2 files)
- PatternEngine.ts
- CrossReferenceManager.ts

### GitHub Integration (4 files)
- GitHubAPICalculator.ts (4 errors)
- GitHubIssueManager.ts (4 errors)
- GitHubProjectManager.ts (2 errors)

### Memory/Version (3 files)
- VersionCleaner.ts (2 errors)
- VersionTracker.ts (1 error)

### Migration (3 files)
- TransitionHub.ts (already has 1 fixed)
- ValidationState.ts (3 errors)
- StrategySelectionState.ts (1 error)

### Orchestration (2 files)
- AgentWorkflowFacade.ts (3 remaining out of 6)

## Success Criteria for Completion

**Minimum**:
- ✅ All 73 TS7006 errors resolved
- ✅ No new syntax errors introduced
- ✅ Type safety improved (not degraded with excessive `any`)

**Target**:
- ✅ 90%+ use specific types (vs `unknown`)
- ✅ Proper type inference for array methods
- ✅ Event handler types match emitter interfaces

**Excellent**:
- ✅ 100% specific types (no `unknown` fallbacks)
- ✅ Generic constraints where appropriate
- ✅ Documentation comments for complex types

## Tools for Next Session

### 1. Type Lookup Helper
```bash
# Find type definition for a symbol
npx tsc --noEmit --listFiles | xargs grep -l "interface SomeType"
```

### 2. Array Type Inference
```bash
# Find where array is defined
npx tsc --noEmit --declaration --emitDeclarationOnly
# Then check .d.ts file for array element type
```

### 3. Event Emitter Interface
```bash
# Find event emitter type
grep -r "on('event_name'" src/
# Then check emitter class definition
```

### 4. Call Site Analysis
```bash
# Find all callers of a function
grep -rn "functionName(" src/
# Analyze parameter types passed
```

## Notes for Future Sessions

**What Worked**:
- Batch automation for simple patterns
- Type inference map for common parameters
- Automated > manual for repetitive tasks

**What Needs Manual Work**:
- Short variable names (need context)
- Domain-specific callbacks
- Generic function parameters
- Event handler types

**Avoid**:
- Using `any` type (defeats purpose)
- Guessing types without verification
- Over-using `unknown` when specific type is discoverable

---

**Status**: Ready for next session to complete Epic 2
**Priority**: MEDIUM-HIGH (improves type safety, enables better refactoring)
**Dependencies**: None (can start immediately)

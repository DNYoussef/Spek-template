# [QUARANTINE] [TYPE_ANNOTATION] - 177 implicit any errors

## Quarantine Details

**Error Code**: TS7006
**Category**: TYPE_ANNOTATION
**Error Count**: 177 errors
**Priority**: Low

## Error Summary

```
Parameter 'X' implicitly has an 'any' type.
```

These errors occur when function parameters lack explicit type annotations under `noImplicitAny` flag. Primary cause is legacy code written before strict type checking was enabled.

**Sample Errors**:
```
src/architecture/langgraph/queen/managers/ResourceManager.ts(43,56): error TS7006: Parameter 'cap' implicitly has an 'any' type.
src/architecture/langgraph/workflows/orchestration/WorkflowValidatorFacade.ts(58,40): error TS7006: Parameter 's' implicitly has an 'any' type.
src/base/common.ts(7,41): error TS7006: Parameter 'value' implicitly has an 'any' type.
```

## Affected Files

Based on quarantine analysis, approximately 50-70 files affected. Common patterns:

- [ ] Array methods with implicit callbacks (map, filter, forEach)
- [ ] Event handlers with implicit parameters
- [ ] Utility functions with implicit params
- [ ] Legacy migration code
- [ ] Additional files to be identified during quarantine insertion

## Root Cause Analysis

**Why Quarantined**: Missing type annotations from legacy code

**Underlying Issue**:
When `noImplicitAny` was enabled in strict mode:
1. All parameters require explicit types
2. Legacy code used implicit typing (let TypeScript infer)
3. Array methods (.map, .filter) often have implicit callback params
4. Event handlers frequently lack type annotations

**Example Pattern**:
```typescript
// Problematic code - implicit any
capabilities.filter(cap => cap.enabled); // TS7006: 'cap' implicitly any
workflow.steps.map(s => s.id); // TS7006: 's' implicitly any

function validateValue(value) { // TS7006: 'value' implicitly any
  return value !== null;
}

// What TypeScript expects
capabilities.filter((cap: Capability) => cap.enabled);
workflow.steps.map((s: WorkflowStep) => s.id);

function validateValue(value: unknown): boolean {
  return value !== null;
}
```

## Fix Strategy

**Approach**: Add Types - Explicit type annotations for parameters

**Detailed Steps**:
1. **Pattern Identification** (1 hour):
   - Group A: Array callback parameters (~80 errors)
   - Group B: Function parameters (~60 errors)
   - Group C: Event handler parameters (~37 errors)

2. **Implementation Phase - Group A** (2 hours):
   - Add types to array method callbacks
   ```typescript
   // Before
   items.map(item => item.id)
   items.filter(item => item.active)

   // After
   items.map((item: Item) => item.id)
   items.filter((item: Item) => item.active)

   // Or use type inference from array
   const items: Item[] = [...];
   items.map(item => item.id) // 'item' inferred as Item
   ```

3. **Implementation Phase - Group B** (1-2 hours):
   - Add explicit parameter types
   ```typescript
   // Before
   function process(data) { return data.value; }

   // After
   function process(data: ProcessData): ProcessValue {
     return data.value;
   }

   // Or use unknown for truly generic
   function process(data: unknown): unknown {
     return (data as ProcessData).value;
   }
   ```

4. **Implementation Phase - Group C** (1 hour):
   - Type event handlers
   ```typescript
   // Before
   emitter.on('event', (data) => handle(data));

   // After
   emitter.on('event', (data: EventData) => handle(data));

   // Or define handler type
   type EventHandler = (data: EventData) => void;
   const handler: EventHandler = (data) => handle(data);
   ```

5. **Validation Phase** (30 min):
   - Verify correct types chosen
   - Run tests
   - Check for type narrowing opportunities

## Batch Assignment

**Phase 2 Batch**: 4 (Type Annotation Cleanup)
- Priority: Low
- Dependencies: Can run in parallel with Batch 3
- Estimated Effort: 4-6 hours total (combined with TS2564)

## Dependencies

**Blocks**:
- None (cosmetic improvement, doesn't block functionality)

**Blocked By**:
- Batch 1: Module resolution (TS2307, TS2614) must complete
- Batch 2: Facades complete (helps identify correct types)

## Quarantine Metadata

**Quarantine Date**: 2025-09-30
**Target Resolution**: Week 4-5 (2025-10-21 to 2025-10-28)
**Quarantine Method**:
```typescript
// @ts-expect-error QUARANTINE: TYPE_ANNOTATION - Add explicit type for cap parameter - Issue #[THIS_ISSUE]
capabilities.filter(cap => cap.enabled);

// @ts-expect-error QUARANTINE: TYPE_ANNOTATION - Add type annotation for data param - Issue #[THIS_ISSUE]
function handler(data) { ... }

// Alternative: Use 'any' explicitly with TODO
function handler(data: any /* TODO Issue #[THIS_ISSUE]: Add proper type */) { ... }
```

## Acceptance Criteria

- [ ] All 177 TS7006 errors resolved
- [ ] Explicit types added to all parameters
- [ ] Types are accurate (not just 'any')
- [ ] Use type inference where appropriate
- [ ] No runtime type errors
- [ ] All tests pass
- [ ] Zero TS7006 errors in `npm run typecheck`

## Testing

**Test Files**:
- [ ] Tests for each affected module
- [ ] Type assertion tests for critical paths
- [ ] Integration tests verify correct typing

**Manual Verification**:
1. Run `npm run typecheck` - should show 0 TS7006 errors
2. Run `npm test` - all tests pass
3. Search codebase: `grep -r "@ts-expect-error QUARANTINE: TYPE_ANNOTATION"` - no results
4. Verify no 'any' types unless absolutely necessary

## Implementation Notes

**Pattern Fixes**:

1. **Array Methods** (~80 errors):
   ```typescript
   // Fix 1: Explicit callback types
   items.map((item: Item) => item.id)
   items.filter((item: Item) => item.active)

   // Fix 2: Inferred from array type
   const items: Item[] = getItems();
   items.map(item => item.id) // item inferred as Item

   // Fix 3: Destructuring with type
   items.map(({ id, name }: Item) => ({ id, name }))
   ```

2. **Function Parameters** (~60 errors):
   ```typescript
   // Fix 1: Domain types
   function validate(workflow: Workflow): boolean { ... }

   // Fix 2: Generic types
   function process<T>(data: T): T { ... }

   // Fix 3: Unknown for safety
   function handle(data: unknown): void {
     if (isValidData(data)) {
       // Type narrowed here
     }
   }
   ```

3. **Event Handlers** (~37 errors):
   ```typescript
   // Fix 1: Event type
   emitter.on('change', (event: ChangeEvent) => { ... });

   // Fix 2: Typed handler
   type Handler = (event: Event) => void;
   const handler: Handler = (event) => { ... };

   // Fix 3: Inline type
   emitter.on('change', (event: { type: string; payload: any }) => { ... });
   ```

**Type Selection Guidelines**:
1. Prefer specific types over 'any'
2. Use 'unknown' for truly generic handling
3. Leverage type inference where clear
4. Add type guards for runtime safety
5. Document complex types

**Common Types to Use**:
```typescript
// Workflow types
type WorkflowStep = { id: string; type: string; ... }
type Workflow = { steps: WorkflowStep[]; ... }

// Capability types
type Capability = { name: string; enabled: boolean; ... }

// Event types
type EventData = { type: string; payload: unknown }

// Validation types
type ValidationResult = { valid: boolean; errors?: string[] }
```

## Progress Tracking

**Pattern Analysis** (0/3):
- [ ] Array method patterns identified (~80)
- [ ] Function parameter patterns identified (~60)
- [ ] Event handler patterns identified (~37)

**Implementation Status** (0/177):
- [ ] Array methods typed: 0/80
- [ ] Function params typed: 0/60
- [ ] Event handlers typed: 0/37
- [ ] Errors resolved: 0/177

**Type Quality Check**:
- [ ] No 'any' types (unless necessary): 0
- [ ] Use of type guards: 0
- [ ] Generic types where appropriate: 0

## Common Type Annotations

```typescript
// Array callbacks
array.map((item: T) => item.property)
array.filter((item: T) => condition)
array.forEach((item: T, index: number) => ...)

// Function parameters
function fn(param: Type): ReturnType { ... }
function fn<T>(param: T): T { ... }
function fn(param: unknown): void { ... }

// Event handlers
on('event', (data: EventType) => { ... })
on('event', (data: { type: string }) => { ... })

// Rest parameters
function fn(...args: Type[]): void { ... }

// Destructuring
function fn({ prop1, prop2 }: Type): void { ... }
```

## Related Analysis

- **Root Cause**: `.claude/.artifacts/cicd-error-cycle-analysis.md` (Missing Validation Strategy)
- **Strategy**: `docs/QUARANTINE-STRATEGY.md` (Category 4: TYPE_ANNOTATION)
- **Batch Plan**: `.claude/.artifacts/phase2-error-analysis.md` (Batch 4: Type Annotation Cleanup)

---

**Labels**: `quarantine`, `technical-debt`, `typescript`, `type-safety`, `low-priority`
**Milestone**: Phase 2 Batch 4 - Type Annotation Cleanup
**Assignees**: [To be assigned]
**Estimated Time**: 4-6 hours (combined with TS2564)
**Target Completion**: Week 4-5 (2025-10-21 to 2025-10-28)

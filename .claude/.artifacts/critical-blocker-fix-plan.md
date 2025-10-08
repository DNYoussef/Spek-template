# Critical Blocker Fix Plan - TS2307 & TS2614 (875 Errors)

**Created**: 2025-10-03T16:00:00Z
**Priority**: CRITICAL - BLOCKS ALL COMPILATION
**Timeline**: Week 2-3 (14-21 days)
**Estimated Effort**: 24-30 hours

## Executive Summary

**875 critical blockers** prevent TypeScript compilation and must be fixed before any quarantined errors can be addressed. These errors fall into clear patterns that can be systematically resolved.

## Error Breakdown

### TS2307: Cannot Find Module (615 errors)
**Impact**: Import statements fail, modules can't be loaded
**Root Causes**:
1. Path aliases (~types/*) not resolving correctly
2. Facade files missing after decomposition
3. Type definition files relocated without updating imports
4. Circular dependencies in type re-exports

### TS2614: No Exported Member (260 errors)
**Impact**: Named imports fail, suggests incorrect export/import pattern
**Root Causes**:
1. Classes/types not exported from modules
2. Default exports used when named exports expected
3. Incomplete facade implementations
4. Export removed during refactoring

## Pattern Analysis

### Pattern 1: Path Alias Resolution (~types/* - ~150 errors)

**Examples**:
```typescript
// src/config/CompatibilityManagerFSM.ts(7,80)
import ... from '~types/CompatibilityTypes'  // NOT FOUND

// src/config/components/ConfigLoader.ts(11,30)
import ... from '~types/ConfigTypes'  // NOT FOUND
```

**Root Cause**: Path aliases defined in tsconfig.json but:
- Files don't exist at expected locations
- Circular dependencies prevent resolution
- Type files were refactored but aliases not updated

**Fix Strategy**:
1. Audit all ~types/* imports (use grep)
2. Check if target files exist
3. Update imports to use relative paths OR
4. Create missing type files
5. Resolve circular dependencies

**Commands**:
```bash
# Find all ~types imports
grep -r "~types/" src/ | wc -l

# Check which type files exist
ls src/types/*.ts

# Test path resolution
npx tsc --traceResolution --noEmit src/config/CompatibilityManagerFSM.ts 2>&1 | grep "~types"
```

**Estimated**: 8 hours

### Pattern 2: Missing Facade Files (~100 errors)

**Examples**:
```typescript
// src/architecture/langgraph/queen/core/QueenCoordinator.ts(8,68)
import ... from '../state-machines/PrincessStateMachineFacade'  // NOT FOUND

// src/config/configuration-manager.ts(14,15)
import ... from './configuration-managerFacade'  // NOT FOUND
```

**Root Cause**: Files renamed or moved during god object elimination

**Fix Strategy**:
1. Identify all missing facade imports
2. Check if file exists with different name
3. Update import path OR create stub facade
4. For completely missing files, create minimal facade with TypeScript stubs

**Example Stub**:
```typescript
// src/architecture/langgraph/state-machines/PrincessStateMachineFacade.ts
export class PrincessStateMachineFacade {
  // TODO: Implement from PrincessStateMachine
  async initialize(): Promise<void> {
    throw new Error('Not implemented - Issue #5');
  }
}

export default PrincessStateMachineFacade;
```

**Estimated**: 6 hours

### Pattern 3: Missing Type Files (~200 errors)

**Examples**:
```typescript
// src/base/common.ts(7,41)
import ... from '../../types/base/primitives'  // NOT FOUND

// src/cicd/CICDDeploymentManager.ts(7,41)
import ... from '../../types/base/primitives'  // NOT FOUND
```

**Root Cause**: Type files refactored but imports not updated

**Fix Strategy**:
1. Check if `src/types/base/primitives.ts` exists
2. If missing, create it with common primitive types
3. Update src/types/index.ts to re-export
4. Validate no circular dependencies

**Priority Fix** - Create `src/types/base/primitives.ts`:
```typescript
// Primitive type definitions used across codebase
export type Timestamp = number;
export type UUID = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export type Result<T, E = Error> =
  | { success: true; value: T; }
  | { success: false; error: E; };

// Add other common primitives
```

**Estimated**: 4 hours

### Pattern 4: Missing State Handlers (~80 errors)

**Examples**:
```typescript
// src/context/AdaptiveThresholdFSM.ts(8,44)
import ... from './states/InitializationStateHandler'  // NOT FOUND

// src/context/AdaptiveThresholdFSM.ts(9,40)
import ... from './states/MonitoringStateHandler'  // NOT FOUND
```

**Root Cause**: FSM state files not created during decomposition

**Fix Strategy**:
1. For each FSM, create missing state handler files
2. Use FSM template pattern
3. Implement minimal state contract

**Template**:
```typescript
// src/context/states/InitializationStateHandler.ts
import { StateHandler, StateContext } from '../types';

export class InitializationStateHandler implements StateHandler {
  async enter(context: StateContext): Promise<void> {
    // TODO: Implement - Issue #5
  }

  async exit(context: StateContext): Promise<void> {
    // TODO: Implement - Issue #5
  }
}
```

**Estimated**: 6 hours

### Pattern 5: Circular Type Dependencies (~50 errors)

**Examples**:
```typescript
// src/config/fsm/ConfigBaseFSM.ts(3,66)
import ... from '../../../types/fsm-types'  // CIRCULAR

// src/types/index.ts exports from:
→ ./fsm-types
→ ./missing-types (which imports fsm-types)
→ Creates circular reference
```

**Root Cause**: Type files import from each other

**Fix Strategy**:
1. Map all type file dependencies
2. Break circular dependencies by:
   - Moving shared types to separate file
   - Using type-only imports (`import type`)
   - Restructuring type hierarchy
3. Create `src/types/base/shared.ts` for circular-prone types

**Commands**:
```bash
# Find circular dependencies
npx madge --circular --extensions ts src/types/

# Use type-only imports
# Change: import { Foo } from './types'
# To: import type { Foo } from './types'
```

**Estimated**: 4 hours

### Pattern 6: Missing Exports (TS2614 - 260 errors)

**Examples**:
```typescript
// src/compliance/monitoring/fsm/DriftDetectionFSM.ts(8,3)
import { DriftDetectionState } from '../ComplianceDriftDetector-typed'
// Error: Module has no exported member 'DriftDetectionState'
// Suggests: import DriftDetectionState from '...'
```

**Root Cause**: Named exports missing from source files

**Fix Strategy**:
1. For each TS2614 error, check source file
2. Add missing export:
   ```typescript
   export class DriftDetectionState { ... }
   // OR
   export type DriftDetectionState = ...;
   ```
3. If default export exists, update import:
   ```typescript
   import DriftDetectionState from '../ComplianceDriftDetector-typed';
   ```

**Automated Fix**:
```bash
# Generate list of all TS2614 errors
npx tsc --noEmit 2>&1 | grep "TS2614" | sed 's/.*Module //' | sed 's/ has no.*//' | sort | uniq

# For each unique module, add exports
```

**Estimated**: 6 hours

## Systematic Fix Approach

### Phase 1: Type System Foundation (Day 1-3)
**Goal**: Fix type file structure to unblock imports

**Tasks**:
1. Create `src/types/base/primitives.ts` ✓ Priority 1
2. Create `src/types/base/shared.ts` for circular types
3. Fix `src/types/index.ts` export order
4. Resolve ~types/* path alias issues
5. Break circular dependencies in type files

**Validation**:
```bash
# Should reduce TS2307 by ~200 errors
npx tsc --noEmit 2>&1 | grep "TS2307" | wc -l
```

**Deliverable**: Core type system compiles

### Phase 2: Facade File Creation (Day 4-6)
**Goal**: Create all missing facade files with stubs

**Tasks**:
1. List all missing facades from TS2307 errors
2. Create minimal facade stubs with TODO comments
3. Export facades from parent modules
4. Update import paths where facades moved

**Template Script**:
```bash
#!/bin/bash
# scripts/create-missing-facades.sh

MISSING_FACADES=$(npx tsc --noEmit 2>&1 | grep "TS2307" | grep "Facade" | sed 's/.*from //' | sed 's/ or.*//')

for facade in $MISSING_FACADES; do
  echo "Creating stub for: $facade"
  # Create file with template
done
```

**Validation**:
```bash
# Should reduce TS2307 by ~100 errors
npx tsc --noEmit 2>&1 | grep "TS2307" | wc -l
```

**Deliverable**: All facade imports resolve

### Phase 3: Export Completion (Day 7-9)
**Goal**: Add all missing exports (TS2614 fixes)

**Tasks**:
1. Generate list of all TS2614 errors by file
2. For each file, add missing named exports
3. Update export patterns (default vs named)
4. Validate exports don't break existing code

**Automated Export Addition**:
```typescript
// For each TS2614 error, add to source file:
export class ClassName { }
export interface InterfaceName { }
export type TypeName = ...;
```

**Validation**:
```bash
# Should eliminate all TS2614 errors
npx tsc --noEmit 2>&1 | grep "TS2614" | wc -l
# Expected: 0
```

**Deliverable**: All exports available

### Phase 4: FSM State Handlers (Day 10-12)
**Goal**: Create missing FSM state handler files

**Tasks**:
1. Identify all FSMs missing state handlers
2. Create state handler files using template
3. Implement minimal state contract
4. Update FSM imports

**Validation**:
```bash
# Should reduce TS2307 by ~80 errors
npx tsc --noEmit 2>&1 | grep "TS2307" | grep "StateHandler" | wc -l
```

**Deliverable**: All FSM states compile

### Phase 5: Remaining Module Resolution (Day 13-14)
**Goal**: Fix all remaining TS2307 errors

**Tasks**:
1. Categorize remaining TS2307 errors
2. Fix one-off missing imports
3. Resolve complex import issues
4. Validate incremental compilation

**Validation**:
```bash
# Should eliminate ALL TS2307 errors
npx tsc --noEmit 2>&1 | grep "TS2307" | wc -l
# Expected: 0

# Total errors should drop from 3,996 to ~3,121 (875 fixed)
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

**Deliverable**: Zero critical blockers

## Success Criteria

### Week 2 (Day 7)
- [ ] TS2307 errors: 615 → 200 (67% reduction)
- [ ] TS2614 errors: 260 → 100 (62% reduction)
- [ ] Total errors: 3,996 → 3,321 (17% reduction)
- [ ] CI compilation: Still failing but improving

### Week 3 (Day 14)
- [ ] TS2307 errors: 200 → 0 (100% reduction)
- [ ] TS2614 errors: 100 → 0 (100% reduction)
- [ ] Total errors: 3,321 → 2,446 (39% total reduction)
- [ ] **CI compilation: PASSING** ✓
- [ ] Tests can run ✓
- [ ] Quarantine strategy can proceed ✓

## Risk Mitigation

### Risk 1: Fixes reveal more errors
**Mitigation**: Incremental validation after each phase
**Rollback**: Git branch per phase with tagged commits

### Risk 2: Breaking changes to APIs
**Mitigation**: Stub facades preserve original signatures
**Testing**: Run test suite after each phase

### Risk 3: Time overrun
**Mitigation**: Parallel work on independent modules
**Backup**: Quarantine critical blockers if >21 days

### Risk 4: Circular dependencies persist
**Mitigation**: Use type-only imports liberally
**Tool**: madge --circular for detection

## Tracking & Metrics

### Daily Progress Log
```bash
# Run daily and track in git commit messages
npx tsc --noEmit 2>&1 | grep -E "error TS(2307|2614)" | wc -l

# Track by category
npx tsc --noEmit 2>&1 | grep "TS2307" | wc -l  # Module resolution
npx tsc --noEmit 2>&1 | grep "TS2614" | wc -l  # Missing exports
```

### GitHub Tracking Issue
Create issue: `[CRITICAL] Module Resolution & Export Fixes - 875 Blocking Errors`
- Milestone: Week 2-3
- Labels: critical, blocker, typescript
- Daily updates with error counts
- Link to this document

## Next Actions (IMMEDIATE)

1. **TODAY (Oct 3)**:
   - Create `src/types/base/primitives.ts` ✓ HIGH PRIORITY
   - Create GitHub tracking issue for critical blockers
   - Begin Phase 1: Type System Foundation

2. **THIS WEEK (Oct 3-7)**:
   - Complete Phase 1 (type files)
   - Start Phase 2 (facade stubs)
   - Daily error count tracking

3. **NEXT WEEK (Oct 10-14)**:
   - Complete Phase 2-3 (facades + exports)
   - Start Phase 4 (FSM states)
   - Target: CI compilation passing by Oct 14

## Tools & Scripts

### Error Analysis
```bash
# Count by error type
npx tsc --noEmit 2>&1 | sed 's/.*error TS/TS/' | sed 's/:.*//' | sort | uniq -c | sort -rn

# Find all ~types imports
grep -r "~types/" src/ --include="*.ts" | wc -l

# Check circular dependencies
npx madge --circular --extensions ts src/

# Test single file compilation
npx tsc --noEmit src/path/to/file.ts
```

### Validation
```bash
# Incremental validation
npx tsc --project tsconfig.incremental.json --noEmit

# Full validation
npx tsc --noEmit

# CI validation
npm run typecheck
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03T16:00:00Z
**Owner**: Development Team
**Status**: ACTIVE - Week 2-3 Implementation

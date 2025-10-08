# Type System Consolidation Audit
**Date**: 2025-10-01
**Phase**: 1A - Audit Complete

## Current State Analysis

### Location 1: Root types/ (DEPRECATED - TO BE DELETED)
```
types/base/primitives.ts - DUPLICATE of src/types/base/primitives.ts
types/base/primitives.d.ts - Generated declaration file
types/fsm-types.ts - DUPLICATE of src/types/fsm-types.ts
types/fsm-types.d.ts - Generated declaration file
types/MigrationFSMTypes.ts - Migration-specific types
```

**Status**: All marked DEPRECATED, safe to delete after migration

---

### Location 2: src/types/ (PRIMARY - KEEP & ENHANCE)
```
src/types/base/
  ├── common.ts           - Core common types
  ├── primitives.ts       - Branded types (Milliseconds, Timestamp, etc.)

src/types/decomposed/
  ├── DebugTypes.ts       - Debug-related types
  ├── QualityGateTypes.ts - Quality gate types

src/types/domains/
  ├── compliance-types.ts  - Compliance domain
  ├── debug-types.ts       - Debug domain
  ├── dspy-integration-types.ts - DSPy types
  ├── quality-gate-types.ts - Quality domain

src/types/ (root level)
  ├── brands.ts            - Brand utilities
  ├── compliance-types.ts  - DUPLICATE with domains/
  ├── fsm-types.ts         - DUPLICATE with root types/
  ├── github-types.ts      - GitHub integration
  ├── index.ts             - Re-export hub
  ├── missing-types.ts     - Ad-hoc additions
  ├── performance-types.ts - Performance metrics
  ├── property-augmentations.ts - Type augmentations
  ├── quality-types.ts     - DUPLICATE with domains/
  ├── research-types.ts    - Research domain
  ├── security-types.ts    - Security domain
  ├── FallbackChainTypes.ts - Fallback chain
```

**Issues:**
- Duplicates: compliance-types.ts, quality-types.ts exist in both src/types/ and src/types/domains/
- fsm-types.ts duplicated from root types/
- No clear organization strategy (flat + domains + decomposed)

---

### Location 3: src/architecture/langgraph/types/ (SPECIALIZED - NEEDS CONSOLIDATION)
```
src/architecture/langgraph/types/
  ├── fsm-types.ts - FSM types (THIRD duplicate!)
  ├── workflow.types.ts - Facade stub (re-exports from typesFacade)
  ├── workflow.typesFacade.ts - Actual workflow types
```

**Issues:**
- fsm-types.ts is THIRD instance (types/, src/types/, langgraph/types/)
- Workflow types split across 2 files (facade pattern)
- Should be in src/types/workflow/ for consistency

---

## Consolidation Strategy

### Step 1: Delete Root types/ Directory
```bash
# All files marked DEPRECATED
rm -rf types/
```

### Step 2: Consolidate Duplicates in src/types/
```bash
# Move domain types to domains/
mv src/types/compliance-types.ts src/types/domains/_compliance-types-flat.ts.bak
mv src/types/quality-types.ts src/types/domains/_quality-types-flat.ts.bak

# Keep single fsm-types.ts in src/types/
rm src/architecture/langgraph/types/fsm-types.ts  # Delete duplicate
```

### Step 3: Relocate Workflow Types
```bash
# Move workflow types to src/types/
mkdir -p src/types/workflow/
mv src/architecture/langgraph/types/workflow.typesFacade.ts src/types/workflow/WorkflowTypes.ts
# Update workflow.types.ts to re-export from src/types/workflow/
```

### Step 4: Organize Final Structure
```
src/types/
  ├── base/
  │   ├── common.ts       - Core shared types
  │   ├── primitives.ts   - Branded primitives
  │   └── index.ts        - Re-exports
  │
  ├── domains/
  │   ├── compliance-types.ts  - Compliance
  │   ├── debug-types.ts       - Debug
  │   ├── dspy-integration-types.ts - DSPy
  │   ├── quality-gate-types.ts - Quality
  │   └── index.ts             - Re-exports
  │
  ├── workflow/
  │   ├── WorkflowTypes.ts     - Consolidated from langgraph
  │   └── index.ts             - Re-exports
  │
  ├── fsm-types.ts       - Single FSM types
  ├── github-types.ts    - GitHub
  ├── performance-types.ts - Performance
  ├── research-types.ts  - Research
  ├── security-types.ts  - Security
  ├── brands.ts          - Brand utilities
  ├── FallbackChainTypes.ts - Fallback chain
  ├── property-augmentations.ts - Augmentations
  ├── missing-types.ts   - Temporary (to be categorized)
  └── index.ts           - Main re-export hub
```

---

## Import Pattern Changes

### Before (Broken):
```typescript
import { Milliseconds } from '../../types/base/primitives';  // Outside rootDir!
import { WorkflowDefinition } from './types/workflow.types'; // Relative path
```

### After (Working):
```typescript
import { Milliseconds } from '@types/base/primitives';      // Path mapping
import { WorkflowDefinition } from '@types/workflow';       // Clean import
```

---

## Expected Error Reduction

**Current Errors**: 3409
**Affected Error Codes**:
- TS2305 (327 errors) - Module has no exported member → **FIXED** by consolidation
- TS2353 (501 errors) - Object literal unknown properties → **FIXED** by eliminating duplicates

**Expected After Phase 1**: ~2581 errors (828 error reduction, 24.3% improvement)

---

## Rollback Plan

If consolidation breaks critical paths:
1. Keep backup: `cp -r src/types src/types.backup`
2. Restore root types/: `git checkout types/`
3. Update imports incrementally file-by-file

---

## Phase 1 Completion Checklist

- [ ] Root types/ directory deleted
- [ ] Duplicate types merged
- [ ] Workflow types moved to src/types/workflow/
- [ ] tsconfig.json path mappings added
- [ ] All imports updated to use @types/* pattern
- [ ] Typecheck passes with <2600 errors
- [ ] Git commit with clear message

---

**Audit Complete - Ready for Phase 1B Execution**

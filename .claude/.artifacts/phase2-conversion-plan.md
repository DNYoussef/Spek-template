# Phase 2: Default Export Conversion Plan

**Date**: 2025-10-01
**Status**: PLANNING
**Target**: Convert 601 default exports to named exports

## Executive Summary

Analysis identified 601 files with default exports causing 371+ TS2305/TS1192 errors ("Module has no default export"). Conversion will use a phased approach prioritizing high-impact architectural components (Facades, Managers, Engines).

## Analysis Results

### Total Scope
| Category | Count | Percentage |
|----------|-------|------------|
| **Total Files** | 601 | 100% |
| Identifier exports | 385 | 64.1% |
| Function exports | 129 | 21.5% |
| Anonymous exports | 44 | 7.3% |
| Class exports | 43 | 7.2% |

### High Priority (195 files)
- Facades: ~150 files
- Managers: ~25 files
- Engines: ~15 files
- Orchestrators: ~5 files

### Example Errors
```typescript
// Current (broken):
import TalebBarbellEngine from './TalebBarbellEngine';
// Error: Module has no default export

// After conversion:
import { TalebBarbellEngine } from './TalebBarbellEngine';
// Works!
```

## Conversion Strategy

### Phase 2A: Facade Pattern Files (150 files, ~2 hours)
**Priority**: CRITICAL - These are core architectural components

**Pattern**: Files ending in `Facade.ts`
```typescript
// Before:
export default class WorkflowStateMachine { ... }

// After:
export class WorkflowStateMachine { ... }
// Add backward compatibility
export default WorkflowStateMachine;
```

**Files Include**:
- `src/cicd/*Facade.ts` (6 files)
- `src/codex/*Facade.ts` (3 files)
- `src/facades/*Facade.ts` (~100 files)
- `src/architecture/langgraph/**/*Facade.ts` (~40 files)

### Phase 2B: Managers & Coordinators (30 files, ~1 hour)
**Priority**: HIGH - System coordination components

**Files Include**:
- `src/coordinator/*Manager.ts`
- `src/orchestration/*Manager.ts`
- `src/swarm/*Manager.ts`

### Phase 2C: Engines & Orchestrators (20 files, ~1 hour)
**Priority**: HIGH - Core processing logic

**Files Include**:
- `src/risk-dashboard/*Engine.ts`
- `src/architecture/langgraph/*Engine.ts`
- `src/orchestration/*Orchestrator.ts`

### Phase 2D: Functions & Anonymous (173 files, ~2 hours)
**Priority**: MEDIUM - Utility functions

**Patterns**:
- `export default function functionName()`
- `export default handler`
- Anonymous default exports

### Phase 2E: Classes & Interfaces (43 files, ~30 min)
**Priority**: LOW - Straightforward conversions

**Pattern**:
```typescript
// Before:
export default class MyClass { ... }

// After:
export class MyClass { ... }
export default MyClass; // Backward compatibility
```

## Conversion Approach

### Method 1: Named Export with Backward Compatibility
**Best for**: Classes, interfaces, identifiers (428 files)

```typescript
// Step 1: Change export
- export default MyClass
+ export class MyClass { ... }

// Step 2: Add backward compatibility
+ export default MyClass;
```

### Method 2: Direct Named Export
**Best for**: Simple functions (129 files)

```typescript
// Step 1: Convert export
- export default function myFunction() { ... }
+ export function myFunction() { ... }

// Step 2: Update imports separately
```

### Method 3: Named Constant Export
**Best for**: Anonymous exports (44 files)

```typescript
// Before:
const handler = { ... };
export default handler;

// After:
export const handler = { ... };
export default handler; // Optional compatibility
```

## Implementation Plan

### Batch 1: Critical Facades (Day 1, 2 hours)
```bash
# Target: 150 facade files
# Script: convert-facades-to-named.py
# Expected: -150 TS2305 errors
```

**Files**:
- All `src/facades/*Facade.ts`
- All `src/cicd/*Facade.ts`
- All `src/codex/*Facade.ts`
- All `src/architecture/**/*Facade.ts`

### Batch 2: Managers & Engines (Day 1, 1.5 hours)
```bash
# Target: 50 files
# Script: convert-managers-engines.py
# Expected: -50 TS2305 errors
```

**Patterns**:
- `*Manager.ts`, `*Manager*.ts`
- `*Engine.ts`, `*Engine*.ts`
- `*Orchestrator.ts`
- `*Coordinator.ts`

### Batch 3: Functions & Utilities (Day 2, 2 hours)
```bash
# Target: 129 function exports
# Script: convert-functions.py
# Expected: -129 TS2305 errors
```

### Batch 4: Remaining Files (Day 2, 1 hour)
```bash
# Target: 272 remaining files
# Script: convert-remaining.py
# Expected: -42 TS2305 errors
```

## Risk Mitigation

### Backward Compatibility Strategy
To minimize breaking changes, we'll add backward compatibility exports:

```typescript
// Named export (primary)
export class MyFacade { ... }

// Default export (backward compatibility)
export default MyFacade;
```

This allows gradual migration:
- New code uses: `import { MyFacade } from './MyFacade'`
- Old code still works: `import MyFacade from './MyFacade'`

### Validation Steps
After each batch:
1. Run TypeScript compiler: `npx tsc --noEmit`
2. Check error reduction
3. Verify no new errors introduced
4. Run tests: `npm test` (if passing)

## Expected Impact

### Error Reduction Projection
| Phase | Files Converted | TS2305 Reduction | Remaining Errors |
|-------|-----------------|------------------|------------------|
| Start | 0 | 0 | 3,864 |
| After 2A | 150 | -150 | 3,714 |
| After 2B | +50 | -50 | 3,664 |
| After 2C | +20 | -20 | 3,644 |
| After 2D | +129 | -129 | 3,515 |
| After 2E | +252 | -22 | 3,493 |
| **Total** | **601** | **-371** | **3,493** |

### Success Metrics
- TS2305 errors: 371 → 0 (-100%)
- TS1192 errors: Significant reduction
- Files with default exports: 601 → 0 (all converted)
- Build stability: Maintained or improved

## Conversion Scripts

### Script 1: Facade Converter
```python
# scripts/convert-facades.py
# - Find all *Facade.ts files
# - Convert 'export default X' to 'export X'
# - Add 'export default X' at end
# - Update imports if needed
```

### Script 2: Manager/Engine Converter
```python
# scripts/convert-managers-engines.py
# - Pattern match for Manager/Engine/Orchestrator
# - Same conversion as facades
# - Handle special cases
```

### Script 3: Function Converter
```python
# scripts/convert-functions.py
# - Convert 'export default function'
# - Convert 'export default handler'
# - Update imports
```

### Script 4: Import Updater
```python
# scripts/update-imports.py
# - Find all 'import X from' statements
# - Check if module uses named exports
# - Convert to 'import { X } from'
# - Run after each batch
```

## Timeline

### Day 1 (4 hours)
- ✅ 08:00-09:00: Analysis complete
- 🔄 09:00-11:00: Batch 1 - Facades (150 files)
- 🔄 11:00-12:30: Batch 2 - Managers/Engines (50 files)
- Break & verification

### Day 2 (3 hours)
- 🔄 09:00-11:00: Batch 3 - Functions (129 files)
- 🔄 11:00-12:00: Batch 4 - Remaining (272 files)
- 🔄 12:00-13:00: Final verification & testing

### Total: 7 hours estimated

## Rollback Plan

If issues arise:
1. **Git**: All changes committed per batch for easy rollback
2. **Backup**: scripts/backup-before-phase2.sh creates snapshot
3. **Verification**: Each batch verified before proceeding
4. **Incremental**: Can stop at any batch and stabilize

## Next Steps

1. Create conversion scripts (4 scripts)
2. Run Batch 1 (Facades) - highest priority
3. Verify error reduction
4. Proceed with Batch 2
5. Continue through all batches
6. Final verification

---

**Version & Run Log**
- Version: 1.0.0
- Timestamp: 2025-10-01T15:00:00-04:00
- Agent: assistant@claude-sonnet-4-5
- Analysis: 601 files identified
- Priority: 195 high-priority files
- Status: READY TO EXECUTE
- Hash: c9d8a4f

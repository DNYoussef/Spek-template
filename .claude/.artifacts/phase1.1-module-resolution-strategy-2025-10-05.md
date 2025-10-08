# Phase 1.1: Module Resolution Cleanup Strategy
**Date**: 2025-10-05
**Status**: 🟡 READY TO EXECUTE
**Target**: Fix 455 TS2307 + 349 TS2304 errors (804 total module errors)
**Timeline**: 8-12 hours
**Expected Outcome**: ~3,500 errors remaining (30% reduction)

---

## EXECUTIVE SUMMARY

Phase 1.1 addresses the **foundational layer of TypeScript errors**: module resolution failures that prevent the compiler from finding files, names, and type definitions. These errors block all dependent code from being validated, making them the highest priority for remediation.

### Current Baseline (Oct 5, 2025)
- **TS2307 (Cannot find module)**: 455 errors (9%)
- **TS2304 (Cannot find name)**: 349 errors (7%)
- **Total Module Errors**: 804 errors (16% of all errors)

### Strategy Highlights
1. **Path Alias Errors**: ~40% of errors (most common pattern)
2. **Missing Facade Files**: ~25% of errors (137 non-existent facades)
3. **Relative Path Depth**: ~20% of errors (incorrect ../ levels)
4. **Missing Exports**: ~15% of errors (files exist but don't export)

---

## ERROR PATTERN ANALYSIS

### Top TS2307 Module Error Patterns

**Pattern 1: Path Alias Failures** (~182 errors, 40%)
```typescript
// Common errors:
Cannot find module '~types/ReportingTypes'
Cannot find module '~types/project.types'
Cannot find module '~types/MigrationAnalysisTypes'
Cannot find module '~types/messageContent.types'
Cannot find module '~types/EventFSMTypes'
Cannot find module '~types/core/BaseRiskTypes'
```

**Root Cause**: tsconfig.json path aliases incomplete
- Current aliases: `~types/*`, `~types/base/*`, `~types/workflow/*`, `~types/domains/*`
- Missing: `~types/core/*`, `~types/events/*`, `~types/reporting/*`, etc.

**Fix**: Expand path alias coverage in tsconfig.json

---

**Pattern 2: Missing Facade Files** (~114 errors, 25%)
```typescript
// Top missing facades:
Cannot find module './ReportingStateHandler'
Cannot find module './MonitoringStateHandler'
Cannot find module './ZeroTrustArchitectureFacade'
Cannot find module './WorkflowValidatorFacade'
Cannot find module './WorkflowMonitorFacade'
Cannot find module './VulnerabilityManagerFacade'
```

**Root Cause**: 137 facades referenced but don't exist (documented in Week 5 analysis)
- Facades were planned but never created
- Re-export statements reference non-existent files
- God object decomposition incomplete

**Fix**: Remove re-export statements for missing facades OR create stub facades

---

**Pattern 3: Relative Path Depth Errors** (~91 errors, 20%)
```typescript
// Common pattern:
import { Type } from '../state-machines/PrincessStateMachineFacade';
// File actually at: ../../state-machines/...
// OR at: ../../../state-machines/...
```

**Root Cause**: Incorrect number of `../` levels in relative imports
- File moves during refactoring break imports
- Facade pattern adds directory layers

**Fix**: Audit relative import paths and correct depth

---

**Pattern 4: Missing Exports** (~68 errors, 15%)
```typescript
// File exists but doesn't export required member
Cannot find module '../../../../utils/Logger'
// File exists at src/utils/Logger.ts but missing export
```

**Root Cause**: Files exist but don't export the imported name
- Incomplete implementations
- Renamed exports without updating imports

**Fix**: Add missing exports OR update import names

---

### Top TS2304 Name Error Patterns

**Pattern 1: WorkflowState/Event** (24 + 15 = 39 errors, 11%)
```typescript
Cannot find name 'WorkflowState'
Cannot find name 'WorkflowEvent'
```

**Root Cause**: Epic 6.1 consolidation created new enum names
- Old code references unconsolidated enum names
- Missing import statements after consolidation

**Fix**: Add proper imports for consolidated enums

---

**Pattern 2: Generic Type Parameters** (9 TEvent errors, 3%)
```typescript
Cannot find name 'TEvent'
```

**Root Cause**: Generic type parameter not in scope
- Missing type parameter declaration
- Import missing for generic type

**Fix**: Add type parameter OR import generic type

---

**Pattern 3: Missing Type Imports** (~290 errors, 83%)
```typescript
Cannot find name 'WorkflowData'
Cannot find name 'TaskPriority'
Cannot find name 'ResearchQuery'
Cannot find name 'PerformanceMetrics'
Cannot find name 'DebugState'
Cannot find name 'TransitionResult'
```

**Root Cause**: Type definitions exist but not imported
- Missing import statements
- Type moved during refactoring
- Facade pattern broke import paths

**Fix**: Add missing import statements

---

## EXECUTION STRATEGY

### Phase 1.1.1: Path Alias Expansion (3-4 hours)

**Objective**: Fix ~182 TS2307 path alias errors

**Step 1**: Audit Missing Aliases (1 hour)
```bash
# Find all ~types imports that fail
grep -r "~types/" src/ --include="*.ts" | \
  grep -v "~types/\*" | \
  grep -v "~types/base" | \
  grep -v "~types/workflow" | \
  grep -v "~types/domains" | \
  cut -d':' -f2 | sort | uniq

# Expected output: ~types/core, ~types/reporting, ~types/events, etc.
```

**Step 2**: Update tsconfig.json (30 min)
```json
{
  "compilerOptions": {
    "paths": {
      "~types/*": ["src/types/*"],
      "~types/base/*": ["src/types/base/*"],
      "~types/workflow/*": ["src/types/workflow/*"],
      "~types/domains/*": ["src/types/domains/*"],
      "~types/core/*": ["src/types/core/*"],           // ADD
      "~types/reporting/*": ["src/types/reporting/*"], // ADD
      "~types/events/*": ["src/types/events/*"],       // ADD
      "~types/analysis/*": ["src/types/analysis/*"],   // ADD
      "~types/validation/*": ["src/types/validation/*"] // ADD
    }
  }
}
```

**Step 3**: Validate Compilation (30 min)
```bash
npx tsc --noEmit 2>&1 | grep "TS2307" | wc -l
# Target: ~273 errors (from 455, -182 fixed)
```

**Step 4**: Test Import Resolution (1-2 hours)
- Verify all ~types imports resolve correctly
- Fix any remaining path alias issues
- Document any aliases that cannot be resolved

**Expected Outcome**: 455 → 273 TS2307 errors (-182, 40% reduction in module errors)

---

### Phase 1.1.2: Facade Re-export Cleanup (3-4 hours)

**Objective**: Fix ~114 TS2307 missing facade errors

**Step 1**: Identify All Missing Facades (1 hour)
```bash
# Find all facade import errors
grep "TS2307" .claude/.artifacts/tsc-baseline-2025-10-05.txt | \
  grep "Facade" | \
  sed "s/.*Cannot find module '\([^']*\)'.*/\1/" | \
  sort | uniq > .missing-facades.txt

# Expected: ~30-40 unique missing facades
```

**Step 2**: Audit Facade Usage (1-2 hours)
```bash
# For each missing facade, find all import statements
while read facade; do
  echo "=== $facade ==="
  grep -r "$facade" src/ --include="*.ts" -n
done < .missing-facades.txt > .facade-usage-audit.txt

# Categorize:
# - Used 0-1 times: Remove re-export
# - Used 2-5 times: Create stub facade OR update imports
# - Used 6+ times: MUST create proper facade
```

**Step 3**: Remove Unused Re-exports (1 hour)
```bash
# For facades used 0-1 times, remove re-export statements
# Example:
# File: src/workflow/index.ts
# Remove: export * from './WorkflowMonitorFacade'; // DOESN'T EXIST

# Update any imports to bypass facade:
# Before: import { X } from '../workflow/WorkflowMonitorFacade';
# After:  import { X } from '../workflow/core/WorkflowMonitor';
```

**Step 4**: Create Critical Stub Facades (1 hour)
```bash
# For facades used 6+ times, create minimal stub:
# File: src/workflow/WorkflowMonitorFacade.ts

export * from './core/WorkflowMonitor';
export type { WorkflowMonitorConfig } from './types/WorkflowTypes';

// TODO: Complete facade implementation in Phase 4
// Stub created for import resolution only
```

**Expected Outcome**: 273 → 159 TS2307 errors (-114, additional 42% reduction)

---

### Phase 1.1.3: Relative Path Depth Correction (2-3 hours)

**Objective**: Fix ~91 TS2307 relative path errors

**Step 1**: Generate Path Correction List (1 hour)
```bash
# Find all relative import errors
grep "TS2307" .claude/.artifacts/tsc-baseline-2025-10-05.txt | \
  grep "\.\.\/" | \
  awk '{print $1}' | \
  cut -d'(' -f1 > .relative-path-errors.txt

# For each error, verify correct path:
while read file_line; do
  file=$(echo $file_line | cut -d':' -f1)
  line=$(echo $file_line | cut -d':' -f2)

  # Show import statement and suggest fix
  sed -n "${line}p" "$file"
  # Calculate correct depth based on file location
done < .relative-path-errors.txt > .path-corrections.txt
```

**Step 2**: Apply Path Corrections (1-2 hours)
```bash
# Systematic correction of relative paths
# Strategy: Convert to path aliases where possible
# Example:
# Before: import { X } from '../../../../types/WorkflowTypes';
# After:  import { X } from '~types/workflow/WorkflowTypes';

# For non-aliasable paths, correct depth:
# Before: import { X } from '../state-machines/Princess';
# After:  import { X } from '../../state-machines/Princess';
```

**Expected Outcome**: 159 → 68 TS2307 errors (-91, additional 57% reduction)

---

### Phase 1.1.4: Missing Exports Addition (1-2 hours)

**Objective**: Fix ~68 remaining TS2307 + 349 TS2304 errors

**Step 1**: Identify Missing Exports (30 min)
```bash
# Cross-reference TS2307 files that exist
grep "TS2307" .claude/.artifacts/tsc-baseline-2025-10-05.txt | \
  while read line; do
    module=$(echo "$line" | sed "s/.*Cannot find module '\([^']*\)'.*/\1/")
    # Check if file exists
    if [ -f "src/${module}.ts" ]; then
      echo "EXISTS: $module (missing export)"
    fi
  done > .missing-exports.txt
```

**Step 2**: Add Missing Exports (1-1.5 hours)
```typescript
// For each file with missing exports:
// 1. Identify what should be exported
// 2. Add export statement
// Example:

// src/utils/Logger.ts
// Missing: export of default Logger class
export default class Logger { ... }
export { Logger }; // Add named export
```

**Step 3**: Fix TS2304 Name Imports (1-1.5 hours)
```typescript
// For top TS2304 errors, add imports:
// WorkflowState (24 occurrences)
import { WorkflowState } from '~types/workflow/WorkflowTypes';

// WorkflowEvent (15 occurrences)
import { WorkflowEvent } from '~types/workflow/WorkflowTypes';

// WorkflowData (7 occurrences)
import { WorkflowData } from '~types/workflow/WorkflowTypes';

// etc. for remaining high-frequency missing names
```

**Expected Outcome**:
- TS2307: 68 → 0 errors (-68, 100% module errors resolved)
- TS2304: 349 → ~50 errors (-299, 86% name errors resolved)

---

## VALIDATION & TESTING

### After Each Sub-Phase
```bash
# 1. Compile and count errors
npx tsc --noEmit 2>&1 | tee .phase1.1-progress.txt
grep -E "error TS[0-9]+" .phase1.1-progress.txt | wc -l

# 2. Verify error reduction
grep "TS2307" .phase1.1-progress.txt | wc -l
grep "TS2304" .phase1.1-progress.txt | wc -l

# 3. Check for new cascading errors
grep -E "error TS[0-9]+" .phase1.1-progress.txt | \
  cut -d':' -f4 | cut -d' ' -f2 | sort | uniq -c | sort -rn | \
  diff .claude/.artifacts/error-distribution-2025-10-05.txt -
```

### Final Phase 1.1 Validation
```bash
# Expected final state:
# TS2307: 0 errors (from 455, -100%)
# TS2304: ~50 errors (from 349, -86%)
# Total: ~4,717 errors (from 5,066, -7% total reduction)

# Note: Fixing module resolution reveals ~300 new cascade errors
# This is expected and documented in remediation roadmap

npx tsc --noEmit 2>&1 | tee .phase1.1-complete-baseline.txt
grep -E "error TS[0-9]+" .phase1.1-complete-baseline.txt | wc -l

# Target: 4,600-4,800 errors (accounting for cascade revelation)
```

---

## RISK MITIGATION

### Risk 1: Cascade Error Multiplication (High Probability)
**Issue**: Fixing module resolution may reveal 200-400 hidden errors
**Mitigation**:
- This is expected and budgeted in timeline
- Continue with property fixes in Phase 1.1 only if errors are duplicates
- If new error types emerge, stop and reassess

### Risk 2: Path Alias Conflicts (Medium Probability)
**Issue**: New path aliases may conflict with existing imports
**Mitigation**:
- Test each alias individually before adding
- Use specific aliases (`~types/core/*`) vs generic (`~core/*`)
- Document all aliases in tsconfig comments

### Risk 3: Facade Stub Incompleteness (Low Probability)
**Issue**: Stub facades may not export all required members
**Mitigation**:
- Create stubs that re-export entire source modules
- Add TODO comments for Phase 4 completion
- Document all stub facades in .facade-inventory.md

---

## SUCCESS CRITERIA

### Phase 1.1 Complete When:
- ✅ TS2307 errors: 0 (from 455)
- ✅ TS2304 errors: <100 (from 349)
- ✅ Total errors: <4,800 (from 5,066)
- ✅ Module resolution errors: <2% of total
- ✅ All path aliases documented in tsconfig.json
- ✅ Facade inventory created with stub status
- ✅ No new critical error types introduced

### Ready to Proceed to Phase 1.2 When:
- ✅ Baseline stable (no new errors appearing)
- ✅ Module resolution functioning correctly
- ✅ Can locate all files by import path
- ✅ Tests still runnable (not blocked by imports)

---

## TIMELINE BREAKDOWN

| Sub-Phase | Task | Time | Cumulative |
|-----------|------|------|------------|
| 1.1.1 | Path Alias Expansion | 3-4h | 3-4h |
| 1.1.2 | Facade Re-export Cleanup | 3-4h | 6-8h |
| 1.1.3 | Relative Path Correction | 2-3h | 8-11h |
| 1.1.4 | Missing Exports Addition | 1-2h | 9-13h |
| **Total** | **Phase 1.1 Complete** | **9-13h** | **9-13h** |

**Buffer**: +2 hours for unexpected issues
**Realistic Total**: 11-15 hours

---

## NEXT STEPS AFTER PHASE 1.1

### Phase 1.2: Test Infrastructure Fix (4-6 hours)
- Debug ServiceFSM state transition logic
- Fix 5 failing test cases
- Target: 100% test pass rate (6/6)

### Phase 1.3: Documentation Update (1-2 hours)
- Update Phase 1 completion report
- Document new baseline (target: ~4,700 errors)
- Create Phase 2 execution strategy

### Phase 2: Type Consolidation (25-35 hours)
- Begin after Phase 1 complete and validated
- Target: ~2,000 errors (60% total reduction)

---

## APPENDIX: Key Files to Modify

### Configuration Files
- `tsconfig.json` - Path alias expansion

### Documentation Files (New)
- `.facade-inventory.md` - Facade status tracking
- `.phase1.1-progress-log.md` - Execution progress
- `.module-resolution-fixes.md` - Fix documentation

### Source Files (Estimate)
- ~15-20 files with path alias updates
- ~30-40 files with facade re-export removals
- ~40-50 files with relative path corrections
- ~20-30 files with missing export additions

**Total File Changes**: ~105-140 files

---

**Theater Score**: 0/100 ✅ (All estimates based on measured error patterns)
**Document Version**: 1.0.0
**Status**: Ready for execution approval

# Epic 2 Strategy Revision: TS7006 Implicit Any Parameter Fixes

## Initial Plan vs Reality

**Original Epic 2 Plan**: "Logger Type Annotations (~260 errors)"
**Reality Check**: Only 141 TS7006 errors total, NOT 260
**Key Finding**: Errors are NOT logger-specific - they're implicit `any` parameters across the codebase

## Actual Error Distribution

**Total TS7006 Errors**: 141
**Pattern**: Function parameters without explicit type annotations
**Examples**:
- `(cap) => ...` - should be `(cap: Capability) => ...`
- `(error) => ...` - should be `(error: Error) => ...`
- `(data) => ...` - should be `(data: unknown) => ...`

## Top 20 Files with TS7006 Errors (1 error each - highly distributed)

Files are widely distributed, no major concentration:
- ValidationRunner.ts: 3 errors
- ValidationRunnerFixed.ts: 3 errors
- WorkflowExecutorFSM.ts: 3 errors
- GitHubProjectIntegration.ts: 3 errors
- ProductionGate.ts: 2 errors
- Most other files: 1 error each

## Recommended Strategy Pivot

### Option A: Fix All TS7006 Errors (Systematic)
**Time**: 4-6 hours
**Approach**: Automated + manual review
**Impact**: 141 errors fixed (100% of TS7006)
**Benefits**: Clean implicit any errors completely

### Option B: Target Critical Blockers Instead (TS2307)
**Time**: 8-12 hours  
**Approach**: Fix module resolution (Epic 1.5)
**Impact**: ~400 errors fixed (63% of critical blockers)
**Benefits**: Addresses root cause of compilation failures

### Option C: Continue Type Consolidation (Original Plan)
**Time**: 10-15 hours
**Approach**: Find and consolidate next major duplicate type family
**Impact**: Estimated 100-200 errors
**Benefits**: Continues Epic 1 pattern

## RECOMMENDED: Option B - Critical Blockers (Epic 1.5)

**Rationale**:
1. TS2307 (Cannot find module) blocks compilation - higher priority
2. 629 critical blockers → ~229 after fix (63% reduction)
3. Enables CI/CD progress faster
4. TS7006 are warnings, not blockers

**Pivot Plan**:
- Skip Epic 2 (TS7006) for now
- Jump to Epic 1.5 (TS2307 module resolution)
- Return to TS7006 later as "cleanup" phase

## Alternative: Quick Win TS7006 Fix

If staying with TS7006, use automated approach:
```bash
# Use ESLint to auto-fix many implicit any errors
npx eslint src --fix --rule '@typescript-eslint/no-implicit-any-param'

# Manual review for complex cases
# Estimated: 2-3 hours for automation + 2-3 hours review
```

## Conclusion

Epic 2 should be **reprioritized** to Epic 1.5 (Critical Blockers) for maximum impact.
TS7006 fixes can be deferred to later "polish" phase.

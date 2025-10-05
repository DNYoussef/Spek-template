# Epic 1.5 Option C: Remove Broken Stubs - Execution Plan

**Decision Date**: 2025-10-05
**Rationale**: Highest cascade potential + removes architectural debt = fastest path to production

## Strategic Rationale

### Why Option C Over Epic 2

**Epic 2 (TS7006 - Implicit Any)**:
- ✅ Safer, predictable
- ✅ 141 errors fixed
- ❌ Builds on FALSE architectural foundation (137 missing facades)
- ❌ Low cascade potential

**Epic 1.5 Option C (Remove Broken Stubs)**:
- ✅ Removes architectural pretense
- ✅ REVEALS real dependencies (high cascade)
- ✅ Enables honest refactoring decisions
- ✅ Clears path for Epic 2-5 on solid foundation
- ⚠️ Will create NEW TS2305 errors (expected and actionable)

### Cascade Effect Prediction

**Immediate**:
- Remove 137 broken re-export stub files
- Eliminate 274 TS2307 errors (files deleted)

**Cascade (Expected)**:
- Reveal 100-150 NEW TS2305 errors ("Cannot find exported member")
- Force dependent files to show REAL import needs
- **Net change**: -120 to -170 errors (274 removed - 100-150 revealed)

**Long-term**:
- Honest architecture assessment
- Clear guidance for which facades are ACTUALLY needed
- Epic 2-5 can proceed on solid foundation
- Faster overall progress to production

## Execution Strategy

### Phase 1: Audit & Catalog (30 min)

**Tasks**:
1. Identify all 137 broken re-export stub files
2. For each stub, find files that import from it
3. Locate original god object implementations (*.backup, alternate paths)
4. Create dependency map

**Output**: `epic1.5-optionc-audit.json` with structure:
```json
{
  "brokenStubs": [
    {
      "stubFile": "src/context/IntelligentContextPruner.ts",
      "missingFacade": "IntelligentContextPrunerFacade",
      "importers": ["src/analysis/foo.ts", "src/domains/bar.ts"],
      "originalFile": "src/context/IntelligentContextPruner.ts.backup"
    }
  ]
}
```

### Phase 2: Locate Originals (30 min)

**Search Strategy**:
```bash
# Find .backup files
find src -name "*.backup" -type f

# Find files with "ELIMINATED GOD OBJECT" marker
grep -rl "ELIMINATED GOD OBJECT" src --include="*.ts"

# Check if original logic is in related files
# Example: IntelligentContextPruner logic might be in:
#   - IntelligentContextPruner.original.ts
#   - IntelligentContextPruner-impl.ts
#   - context/pruner/IntelligentContextPruner.ts (subfolder)
```

**Fallback**: If original file not found:
- Check git history: `git log --all --full-history -- "**/*ComponentName*"`
- Create minimal stub that throws "Not Implemented" error
- Document for future facade generation

### Phase 3: Update Dependent Imports (90 min)

**For each broken stub**:
1. Find all files importing from stub
2. Determine replacement:
   - If original file exists → Point to original
   - If facade exists elsewhere → Point to actual facade
   - If neither exists → Create minimal stub or comment out import
3. Update import statements
4. Validate file compiles

**Automation Script** (`.claude/.artifacts/epic1.5-optionc-redirect-imports.js`):
```javascript
// For each broken stub:
const redirections = {
  './IntelligentContextPrunerFacade': '../context/pruner/IntelligentContextPruner.original',
  './AdaptiveThresholdManagerFacade': '../facades/AdaptiveThresholdManagerFacade', // This one exists!
  // ... etc
};

// Update imports in dependent files
for (const [oldPath, newPath] of Object.entries(redirections)) {
  updateImportsInFiles(importers, oldPath, newPath);
}
```

### Phase 4: Delete Broken Stubs (30 min)

**Safety Protocol**:
1. Create backup branch: `git checkout -b epic1.5-optionc-stub-removal`
2. Validate all imports redirected (no files still importing from stubs)
3. Delete stub files in batches of 20
4. After each batch: `npx tsc --noEmit` to check errors
5. If cascading failures occur: rollback batch, investigate, fix

**Deletion Script**:
```bash
# Delete stubs that have been redirected
while IFS= read -r facade; do
  stub_file=$(find src -name "*${facade}*.ts" | grep -v "Facade.ts")
  if [ -f "$stub_file" ] && grep -q "ELIMINATED GOD OBJECT" "$stub_file"; then
    echo "Deleting: $stub_file"
    git rm "$stub_file"
  fi
done < /tmp/missing-facades.txt
```

### Phase 5: Validate & Measure (30 min)

**Validation Checks**:
```bash
# 1. Compilation check
npx tsc --noEmit 2>&1 | tee epic1.5-optionc-post-removal-errors.txt

# 2. Error count comparison
echo "Before: 457 TS2307 errors"
grep -c "TS2307" epic1.5-optionc-post-removal-errors.txt
grep -c "TS2305" epic1.5-optionc-post-removal-errors.txt

# 3. Test suite
npm test 2>&1 | head -50

# 4. Git status
git status
git diff --stat
```

**Expected Results**:
- TS2307 errors: 457 → ~180-200 (274 removed - dependencies fixed)
- TS2305 errors: ~192 → ~250-300 (new errors from missing exports)
- Net change: ~-120 to -170 errors
- Files deleted: 137 broken stubs
- Files modified: ~50-100 import redirections

## Risk Mitigation

### Risk 1: Original files don't exist
**Mitigation**:
- Search git history for deleted files
- Create minimal placeholder implementations
- Document for Phase 4 facade generation
- Use TypeScript's `any` type temporarily to unblock compilation

### Risk 2: Cascade creates MORE errors than eliminated
**Mitigation**:
- Execute in batches of 20 stubs
- Rollback batch if errors increase >50
- Analyze pattern: are new errors actionable?
- If not, consider hybrid approach (keep some stubs)

### Risk 3: Breaks existing functionality
**Mitigation**:
- Work on feature branch: `epic1.5-optionc-stub-removal`
- Run test suite after each batch
- Keep bakup commits every 20 deletions
- Can revert easily: `git reset --hard HEAD~1`

### Risk 4: Takes longer than 3-4 hours
**Mitigation**:
- Phase 1-2 (audit): MUST complete to assess feasibility
- After Phase 2: reassess with actual data
- If >50% of originals missing: consider Epic 2 pivot
- Timebox: If Phase 3 exceeds 2 hours, pause and reassess

## Success Criteria

**Minimum Success** (must achieve):
- ✅ 137 broken stubs deleted
- ✅ No TS2307 errors for deleted stubs (imports redirected)
- ✅ Net error reduction ≥ 100 errors
- ✅ Compilation still possible (even with new errors)

**Target Success** (goal):
- ✅ Net error reduction ≥ 150 errors
- ✅ Clear dependency map showing real architecture
- ✅ All imports redirected to actual implementations
- ✅ Tests: 0/30 → ≥5/30 passing (some improvement)

**Excellent Success** (stretch):
- ✅ Net error reduction ≥ 200 errors
- ✅ TS2305 errors are ACTIONABLE (clear fix paths)
- ✅ Architecture clarity enables Epic 2-5 acceleration
- ✅ Tests: ≥10/30 passing

## Post-Execution Decision Tree

**If net error reduction ≥ 150**:
→ SUCCESS: Proceed to Epic 2 (TS7006) on clean foundation
→ Expected time to Epic 2 completion: 4-6 hours
→ Total Epic 1.5C + Epic 2: 7-10 hours, ~280-320 errors fixed

**If net error reduction 100-149**:
→ PARTIAL SUCCESS: Analyze new TS2305 errors
→ If actionable: Fix top 20 TS2305 errors, THEN Epic 2
→ If not actionable: Proceed directly to Epic 2

**If net error reduction <100**:
→ REASSESS: Option C may have revealed deeper issues
→ Analyze error patterns
→ Consider: Generate 10-15 critical facades before Epic 2
→ OR: Continue with Epic 2 anyway (warnings vs blockers)

## Timeline

**Estimated**: 3-4 hours total

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Audit | 30 min | 0.5h |
| Phase 2: Locate Originals | 30 min | 1.0h |
| Phase 3: Redirect Imports | 90 min | 2.5h |
| Phase 4: Delete Stubs | 30 min | 3.0h |
| Phase 5: Validate | 30 min | 3.5h |
| Buffer | 30 min | 4.0h |

**Checkpoints**:
- After Phase 2 (1h): Assess if ≥80% originals found → Continue or pivot
- After Phase 3 (2.5h): Validate ≥50 imports redirected → Continue or pause
- After Phase 4 (3h): Check error count → Must show net reduction
- After Phase 5 (3.5h): Final decision on Epic 2 vs further remediation

## Next Steps After Completion

**Immediate** (same session if time permits):
1. Commit Epic 1.5 Option C changes
2. Create PR with cascade analysis
3. Begin Epic 2 (TS7006) audit

**Short-term** (next session):
1. Execute Epic 2 (TS7006) - 4-6 hours
2. Fix top 20 TS2305 errors revealed by Option C - 2-3 hours
3. Update remediation strategy based on honest architecture

**Medium-term**:
1. Epic 3: AnalysisContext consolidation
2. Epic 4: Enum consolidation
3. Epic 5: Remaining type duplications
4. Phase 0: Test infrastructure (parallel stream)

**Long-term** (Phase 4 - Post-MVP):
1. Facade generation for 10-15 critical components
2. Remaining facade generation (as needed)
3. Complete god object refactoring (architectural purity)

---

## Commitment

**I am executing Epic 1.5 Option C (Remove Broken Stubs)** because:

1. **Cascade potential**: ⭐⭐⭐⭐⭐ (reveals real dependencies)
2. **Production readiness**: ⭐⭐⭐⭐ (honest architecture)
3. **Risk**: ⭐⭐⭐ (medium, but managed with batching)
4. **Time**: 3-4 hours (comparable to Epic 2, better long-term ROI)

**This is the bold choice that removes pretense and enables faster overall progress to production.**

Beginning Phase 1: Audit & Catalog now...

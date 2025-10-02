# Quarantine Insertion Safety Guide

**Version**: 1.0.0
**Date**: 2025-09-30
**Purpose**: Safe, systematic insertion of quarantine comments

## ⚠️ CRITICAL SAFETY RULES

### Rule 1: NEVER Quarantine Critical Blockers
**DO NOT quarantine**:
- ❌ TS2307 (Cannot find module) - breaks compilation
- ❌ TS2614 (No exported member) - breaks module system

**These MUST be fixed in Batch 1.3-1.4, not quarantined**

### Rule 2: Always Include Issue Reference
Every quarantine comment MUST reference the tracking issue:
```typescript
// @ts-expect-error QUARANTINE: [CATEGORY] - [Brief reason] - Issue #XXX
problematic_code;
```

### Rule 3: Test Before Committing
After adding quarantine to a file:
1. Run `npx tsc --noEmit [file]` to verify file compiles
2. Run related tests to ensure no runtime errors
3. Commit only if both pass

### Rule 4: One Category Per Session
Focus on ONE error category at a time to prevent confusion:
- Session 1: All TS2339 (FACADE_INCOMPLETE)
- Session 2: All TS2353 (INTERFACE_DRIFT)
- Session 3: All TS2564 (STRICT_MODE)
- Session 4: All TS7006 (TYPE_ANNOTATION)

## Quarantine Process

### Step 1: Get Errors for Category (5 min)

```bash
# For TS2339 (FACADE_INCOMPLETE)
npm run typecheck 2>&1 | grep "TS2339" > .claude/.artifacts/ts2339-errors.txt

# For TS2353 (INTERFACE_DRIFT)
npm run typecheck 2>&1 | grep "TS2353" > .claude/.artifacts/ts2353-errors.txt

# For TS2564 (STRICT_MODE)
npm run typecheck 2>&1 | grep "TS2564" > .claude/.artifacts/ts2564-errors.txt

# For TS7006 (TYPE_ANNOTATION)
npm run typecheck 2>&1 | grep "TS7006" > .claude/.artifacts/ts7006-errors.txt
```

### Step 2: Review Error List (10 min)

Open the error file and identify:
1. Most affected files (fix these first for maximum impact)
2. Error patterns (group similar errors)
3. Edge cases (flag for manual review)

Example analysis:
```
src/architecture/langgraph/workflows/WorkflowFacade.ts(148,51): error TS2339: Property 'validateDefinition' does not exist
src/architecture/langgraph/workflows/WorkflowFacade.ts(309,45): error TS2339: Property 'validateTemplate' does not exist
src/architecture/langgraph/workflows/WorkflowFacade.ts(372,20): error TS2339: Property 'cleanup' does not exist

Analysis: WorkflowFacade has 3 missing methods - handle together
```

### Step 3: Add Quarantine Comments (2-4 hours)

For each error, follow this pattern:

#### Pattern A: TS2339 (Property Access)
```typescript
// @ts-expect-error QUARANTINE: FACADE_INCOMPLETE - Missing validateDefinition method - Issue #XXX
validator.validateDefinition(workflow);
```

#### Pattern B: TS2353 (Object Literal)
```typescript
// @ts-expect-error QUARANTINE: INTERFACE_DRIFT - configuration property removed - Issue #XXX
const state: WorkflowStateDefinition = {
  id: 'state1',
  configuration: {...} // Property doesn't exist in current interface
};
```

#### Pattern C: TS2564 (Uninitialized Property)
```typescript
class Example {
  // Definite assignment assertion
  private engine!: LangGraphEngine; // TODO Issue #XXX: Initialize in constructor
}
```

#### Pattern D: TS7006 (Implicit Any)
```typescript
// @ts-expect-error QUARANTINE: TYPE_ANNOTATION - Add explicit type for data param - Issue #XXX
function handler(data) { ... }
```

### Step 4: Verify File Compiles (1 min per file)

```bash
# Test single file
npx tsc --noEmit src/path/to/file.ts

# Should show no errors for quarantined issues
# May show other errors (that's OK, we're working on one category at a time)
```

### Step 5: Run Tests (2 min per file)

```bash
# Find related test file
find tests -name "*$(basename file .ts)*"

# Run specific test
npx jest tests/path/to/file.test.ts

# Verify no runtime errors from quarantined code
```

### Step 6: Commit with Tracking (1 min per file)

```bash
# Stage file
git add src/path/to/file.ts

# Commit with proper message
git commit -m "quarantine: [TS_CODE] errors in $(basename file) - Issue #XXX

- Added [N] quarantine comments for [CATEGORY] errors
- File: src/path/to/file.ts
- Tracking: Issue #XXX
- Tests: [passing/failing]
"
```

## Batch Processing Strategy

### Approach 1: File-by-File (Recommended for Safety)
- Process one file at a time
- Test and commit each file
- Slower but safer

**Time**: 5-10 min per file × 60 files = 5-10 hours

### Approach 2: Pattern-Based (Faster)
- Group files with same error pattern
- Apply same fix to all
- Test batch, commit batch

**Time**: 2-4 hours total
**Risk**: Higher chance of mistakes

### Approach 3: Critical Path (Maximum Impact)
- Identify files with most errors
- Fix top 20% of files (80% of errors)
- Defer remaining to later

**Time**: 2-3 hours
**Coverage**: ~80% of errors

## Safety Checklist

Before quarantining a file, verify:

- [ ] Error is NOT TS2307 or TS2614 (critical blockers)
- [ ] Quarantine comment includes issue reference
- [ ] File compiles after quarantine: `npx tsc --noEmit [file]`
- [ ] Tests pass: `npx jest [test-file]`
- [ ] Commit message includes issue number
- [ ] ONE category per file session

## Error Recovery

### If Quarantine Breaks Compilation
```bash
# Revert the quarantine
git checkout HEAD -- src/path/to/file.ts

# Re-analyze the error
npm run typecheck 2>&1 | grep -A 5 "src/path/to/file.ts"

# Try different quarantine approach or flag for manual review
```

### If Tests Fail After Quarantine
```bash
# Check if failure is related to quarantined code
npm test -- --verbose

# If related, revert quarantine
git checkout HEAD -- src/path/to/file.ts

# If unrelated, investigate separately
```

### If Unsure About Error
```bash
# Flag for manual review
echo "src/path/to/file.ts:line - [ERROR_CODE] - [Description]" >> .claude/.artifacts/manual-review-needed.txt

# Skip for now, continue with clear errors
```

## Progress Tracking

### Create Progress Log
```bash
cat > .claude/.artifacts/quarantine-progress.log << 'EOF'
# Quarantine Insertion Progress

## Session 1: TS2339 (FACADE_INCOMPLETE) - Issue #XXX
- Target: 690 errors
- Files processed: 0/~100
- Errors quarantined: 0/690
- Time spent: 0 hours

## Session 2: TS2353 (INTERFACE_DRIFT) - Issue #YYY
- Target: 519 errors
- Files processed: 0/~80
- Errors quarantined: 0/519
- Time spent: 0 hours

## Session 3: TS2564 (STRICT_MODE) - Issue #ZZZ
- Target: 191 errors
- Files processed: 0/~60
- Errors quarantined: 0/191
- Time spent: 0 hours

## Session 4: TS7006 (TYPE_ANNOTATION) - Issue #AAA
- Target: 177 errors
- Files processed: 0/~50
- Errors quarantined: 0/177
- Time spent: 0 hours
EOF
```

### Update After Each File
```bash
# Increment counters
echo "  - File: src/path/to/file.ts - [N] errors quarantined" >> .claude/.artifacts/quarantine-progress.log
```

### Check Overall Progress
```bash
# Count remaining errors
npm run typecheck 2>&1 | grep "TS2339" | wc -l  # Should decrease
grep -r "@ts-expect-error QUARANTINE" src | wc -l  # Should increase
```

## Quality Gates

### Before Starting Quarantine
- [ ] All 4 GitHub issues created
- [ ] Issue numbers documented
- [ ] Safety guide reviewed
- [ ] Backup created: `git branch backup-pre-quarantine`

### During Quarantine (Per File)
- [ ] File compiles: `npx tsc --noEmit [file]`
- [ ] Tests pass: `npx jest [test]`
- [ ] Quarantine format correct
- [ ] Issue reference included

### After Each Session
- [ ] Progress log updated
- [ ] Error count decreased
- [ ] No critical errors introduced
- [ ] All commits include issue references

### Before Final Commit
- [ ] Run full typecheck: `npm run typecheck`
- [ ] Run all tests: `npm test`
- [ ] Verify CI/CD unblocked (no TS2307/TS2614)
- [ ] Update quarantine summary

## Automated Helpers

### Script 1: Validate Quarantine Format
```bash
#!/bin/bash
# validate-quarantines.sh

echo "Validating quarantine comments..."

# Check all quarantine comments have issue references
INVALID=$(grep -r "@ts-expect-error QUARANTINE" src | grep -v "Issue #" || true)

if [ -n "$INVALID" ]; then
  echo "❌ Found quarantines without issue reference:"
  echo "$INVALID"
  exit 1
else
  echo "✅ All quarantines have issue references"
fi

# Check no critical errors quarantined
CRITICAL=$(grep -r "@ts-expect-error.*TS2307\|TS2614" src || true)

if [ -n "$CRITICAL" ]; then
  echo "❌ Found critical errors quarantined (NOT ALLOWED):"
  echo "$CRITICAL"
  exit 1
else
  echo "✅ No critical errors quarantined"
fi

echo "✅ Quarantine validation passed"
```

### Script 2: Quick Quarantine Stats
```bash
#!/bin/bash
# quarantine-stats.sh

echo "=== Quarantine Statistics ==="
echo ""

echo "Quarantined by category:"
echo "  FACADE_INCOMPLETE: $(grep -r "QUARANTINE: FACADE_INCOMPLETE" src | wc -l)"
echo "  INTERFACE_DRIFT:   $(grep -r "QUARANTINE: INTERFACE_DRIFT" src | wc -l)"
echo "  STRICT_MODE:       $(grep -r "QUARANTINE: STRICT_MODE" src | wc -l)"
echo "  TYPE_ANNOTATION:   $(grep -r "QUARANTINE: TYPE_ANNOTATION" src | wc -l)"
echo ""

echo "Total quarantined: $(grep -r "@ts-expect-error QUARANTINE" src | wc -l)"
echo ""

echo "Remaining errors by code:"
npm run typecheck 2>&1 | grep -oE "TS[0-9]{4}" | sort | uniq -c | sort -rn | head -10
```

## Example Session

### Complete workflow for TS2339 (30 min example)

```bash
# 1. Get errors (1 min)
npm run typecheck 2>&1 | grep "TS2339" > ts2339-errors.txt
wc -l ts2339-errors.txt  # 690 errors

# 2. Identify top file (2 min)
cat ts2339-errors.txt | cut -d: -f1 | sort | uniq -c | sort -rn | head -5
# Output: 12 src/architecture/langgraph/workflows/WorkflowFacade.ts

# 3. Edit file (10 min)
code src/architecture/langgraph/workflows/WorkflowFacade.ts

# Add quarantine comments at each error location:
# Line 148: @ts-expect-error QUARANTINE: FACADE_INCOMPLETE - Missing validateDefinition - Issue #123
# Line 309: @ts-expect-error QUARANTINE: FACADE_INCOMPLETE - Missing validateTemplate - Issue #123
# ... (10 more)

# 4. Verify (2 min)
npx tsc --noEmit src/architecture/langgraph/workflows/WorkflowFacade.ts
# ✅ No TS2339 errors

# 5. Test (5 min)
npx jest tests/architecture/langgraph/workflows/WorkflowFacade.test.ts
# ✅ All tests pass

# 6. Commit (1 min)
git add src/architecture/langgraph/workflows/WorkflowFacade.ts
git commit -m "quarantine: TS2339 errors in WorkflowFacade.ts - Issue #123

- Added 12 quarantine comments for FACADE_INCOMPLETE errors
- File: src/architecture/langgraph/workflows/WorkflowFacade.ts
- Tracking: Issue #123
- Tests: passing
"

# 7. Update progress (1 min)
echo "Progress: 12/690 TS2339 errors quarantined (1.7%)" >> quarantine-progress.log

# 8. Check overall (1 min)
npm run typecheck 2>&1 | grep "TS2339" | wc -l
# Output: 678 (down from 690) ✅
```

## Troubleshooting

### Issue: Quarantine doesn't suppress error
**Cause**: Comment placement incorrect
**Fix**: Place comment IMMEDIATELY ABOVE the error line
```typescript
// @ts-expect-error QUARANTINE: ... - Issue #XXX
validator.validateDefinition(workflow); // Error on this line
```

### Issue: File won't compile after quarantine
**Cause**: Quarantined wrong error or syntax issue
**Fix**: Revert and re-analyze
```bash
git checkout HEAD -- src/file.ts
npm run typecheck 2>&1 | grep "src/file.ts"
```

### Issue: Tests fail after quarantine
**Cause**: Quarantined code that has runtime dependencies
**Fix**: Add runtime guard or revert
```typescript
// Option 1: Add runtime guard
if (validator.validateDefinition) {
  // @ts-expect-error QUARANTINE: ... - Issue #XXX
  validator.validateDefinition(workflow);
}

// Option 2: Revert quarantine
git checkout HEAD -- src/file.ts
```

## Success Criteria

Quarantine insertion is successful when:

- [ ] No TS2307 or TS2614 errors quarantined (critical blockers)
- [ ] All quarantines have issue references
- [ ] All files compile after quarantine
- [ ] All tests pass
- [ ] Error count decreased for target category
- [ ] Progress tracked in log
- [ ] Commits reference issues

## Next Steps After Quarantine

Once quarantine insertion is complete:

1. **Verify CI/CD Unblocked**:
   ```bash
   git push
   # Watch GitHub Actions for incremental-ci.yml
   # Should show: Critical validation PASSED, Tests PASSED
   ```

2. **Update Quarantine Summary**:
   ```bash
   ./scripts/quarantine-analysis-simple.sh
   # Review updated metrics
   ```

3. **Begin Batch 1.3-1.4** (Week 2):
   - Fix critical blockers (TS2307, TS2614)
   - Update import paths
   - Fix barrel exports

4. **Track Weekly Progress**:
   - Week 1: Quarantine complete ✅
   - Week 2: Critical blockers fixed (875 → 0)
   - Week 3-4: Quarantine resolution (1,577 → 0)
   - Week 5: All errors resolved (3,996 → 0)

---

**Remember**: Quarantine is a strategic tool to unblock CI/CD, not a permanent solution. All quarantined errors MUST be resolved according to the batch schedule.

**Safety First**: When in doubt, ask for review before quarantining.

# Manual Fix Strategy for 17 Failed Files

**Generated**: 2025-09-30
**Context**: Phase 3 batch execution - 17 files with complex syntax errors
**Baseline**: 129 tests (must maintain minimum)

---

## Error Categories & Priority

### Tier 1: Semantic Errors (1 file) - HIGHEST PRIORITY
**Complexity**: Medium
**Fix Time**: ~5 minutes
**Impact**: Potential +5-10 tests

**Files**:
1. `tests/test_kelly_dpi_integration.py` (line 16)
   - **Error**: `from risk.kelly_criterion import ()`
   - **Root Cause**: MECE agent removed import items, left empty parens
   - **Fix**: Restore original import statement from git history
   - **Strategy**: `git show 35b74ba4:tests/test_kelly_dpi_integration.py | head -20`

### Tier 2: Bracket Mismatches (3 files) - HIGH PRIORITY
**Complexity**: Medium
**Fix Time**: ~15 minutes total
**Impact**: Potential +10-15 tests

**Files**:
1. `tests/test_command_factory_patterns.py` (line 220)
   - **Error**: `result = subprocess.run([)`
   - **Root Cause**: Opening bracket `[` closed with `)`
   - **Fix**: Change `[)` to `[]` or restore full function call

2. `tests/test_phase4_config_wiring_reality.py` (line 119)
   - **Error**: `config_dir_3 = self.setup_test_config({)`
   - **Root Cause**: Opening brace `{` closed with `)`
   - **Fix**: Change `{)` to `{}` or restore full dict literal

3. `tests/test_supply_chain_security.py` (line 35)
   - **Error**: `(project_path / "package.json").write_text(json.dumps({))`
   - **Root Cause**: Opening brace `{` closed with `)`
   - **Fix**: Change `{)` to `{}` or restore full dict literal

### Tier 3: String Errors (3 files) - HIGH PRIORITY
**Complexity**: High (unterminated strings affect multiple lines)
**Fix Time**: ~20 minutes total
**Impact**: Potential +15-20 tests

**Files**:
1. `tests/test_fixes.py` (line 283-338)
   - **Error**: `unterminated triple-quoted string literal (detected at line 338)`
   - **Root Cause**: Docstring missing closing `"""`
   - **Fix**: Find line 283 docstring, add closing `"""` before line 338

2. `tests/test_phase3_integration.py` (line 601-617)
   - **Error**: `unterminated triple-quoted string literal (detected at line 617)`
   - **Root Cause**: Docstring missing closing `"""`
   - **Fix**: Find line 601 docstring, add closing `"""` before line 617

3. `tests/batch3_validation/test_strategy_pattern_validation.py` (line 612-671)
   - **Error**: `unterminated triple-quoted string literal (detected at line 671)`
   - **Root Cause**: Docstring missing closing `"""`
   - **Fix**: Find line 612 docstring, add closing `"""` before line 671

### Tier 4: Literal Errors (2 files) - MEDIUM PRIORITY
**Complexity**: Low (comment or string issues)
**Fix Time**: ~10 minutes total
**Impact**: Potential +5-10 tests

**Files**:
1. `tests/test_kill_switch_integration.py` (line 6)
   - **Error**: `invalid decimal literal: - Performance validation (<500ms)`
   - **Root Cause**: Likely dash in docstring or comment treated as code
   - **Fix**: Quote the string or remove dash

2. `tests/batches_10_18_validation/test_suite_orchestrator.py` (line 854)
   - **Error**: `invalid decimal literal: - Passed: {passed} ({passed/max(1, total)*100:.1f}%)`
   - **Root Cause**: Dash in f-string or comment
   - **Fix**: Quote the string or remove dash

### Tier 5: Unknown Indentation Errors (6 files) - LOW PRIORITY
**Complexity**: Variable (may require AST reconstruction)
**Fix Time**: ~30 minutes total
**Impact**: Potential +20-30 tests

**Files**:
1. `tests/test_discovery_report.py` (line 25)
   - **Error**: `expected ':' after 'if file.endswith('.py') and ()'`
   - **Root Cause**: Empty parentheses, missing condition
   - **Fix**: Restore original condition from git history

2. `tests/test_focused_pattern_validation.py` (line 34)
   - **Error**: `unexpected indent: pattern_id="test_1",`
   - **Root Cause**: Line detached from function call
   - **Fix**: Find parent function call, reattach line

3. `tests/test_import_fixes.py` (line 67)
   - **Error**: `unexpected indent: config=None,  # Will use defaults`
   - **Root Cause**: Line detached from function call
   - **Fix**: Find parent function call, reattach line

4. `tests/test_phase3_100_percent.py` (line 4)
   - **Error**: `invalid syntax: Comprehensive test suite to verify...`
   - **Root Cause**: Docstring missing opening `"""`
   - **Fix**: Add `"""` before line 4

5. `tests/test_phase5_integration.py` (line 5)
   - **Error**: `invalid syntax: Tests the complete integration...`
   - **Root Cause**: Docstring missing opening `"""`
   - **Fix**: Add `"""` before line 5

6. `tests/test_phase5_sandbox_reality.py` (line 91)
   - **Error**: `unexpected indent: type=ConnascenceType.ALGORITHM,`
   - **Root Cause**: Line detached from function call
   - **Fix**: Find parent function call, reattach line

---

## Execution Plan

### Phase 3A: Quick Wins (Tiers 1-2) - 30 minutes
**Target**: Fix 4 files (1 semantic + 3 bracket mismatches)
**Expected**: +20-25 tests
**Risk**: Low (simple syntax fixes)

**Steps**:
1. Fix semantic error (test_kelly_dpi_integration.py)
2. Fix 3 bracket mismatches
3. Validate: `pytest --collect-only tests/ 2>&1 | grep "test session starts" -A 5`
4. Commit if tests >= 129

### Phase 3B: String Repairs (Tier 3) - 20 minutes
**Target**: Fix 3 files (unterminated strings)
**Expected**: +15-20 tests
**Risk**: Medium (multi-line impact)

**Steps**:
1. Fix test_fixes.py (line 283)
2. Fix test_phase3_integration.py (line 601)
3. Fix test_strategy_pattern_validation.py (line 612)
4. Validate after each fix
5. Commit if cumulative tests increase

### Phase 3C: Literal Cleanup (Tier 4) - 10 minutes
**Target**: Fix 2 files (invalid literals)
**Expected**: +5-10 tests
**Risk**: Low (comment/string issues)

**Steps**:
1. Fix test_kill_switch_integration.py (line 6)
2. Fix test_suite_orchestrator.py (line 854)
3. Validate batch
4. Commit if tests increase

### Phase 3D: Complex Indentation (Tier 5) - 30 minutes
**Target**: Fix 6 files (indentation/detached lines)
**Expected**: +20-30 tests
**Risk**: High (may require git restoration)

**Steps**:
1. Attempt AST-based line reattachment
2. If fails, restore from git history: `git show 35b74ba4:FILE`
3. Validate each fix individually
4. Commit successful fixes only

---

## Success Criteria

**Minimum Acceptable**:
- Baseline maintained: >= 129 tests
- No regression in protected suites (phase7_adas, enterprise, byzantium, safety)

**Target Achievement**:
- Total tests: 190-200 (from 129, +60-70 tests)
- Files fixed: 17/17 (100%)
- Python test discovery: Complete

**Stretch Goal**:
- Total tests: 200+
- All 114 test files passing syntax validation

---

## Rollback Strategy

**Per-File Rollback**:
```bash
git show 35b74ba4:tests/FILE.py > tests/FILE.py
pytest --collect-only tests/ 2>&1 | grep "collected"
```

**Batch Rollback** (if major regression):
```bash
git checkout 35b74ba4 -- tests/
pytest --collect-only tests/ 2>&1 | grep "collected"
# Should show 111 tests
```

**Commit Strategy**:
- Commit after each tier completion
- Include test count in commit message
- Tag successful milestones: `git tag phase3a-complete`

---

## Automation Opportunities

**Pattern Detection**:
1. Empty import parens `import ()` -> Restore from git
2. Bracket mismatches `[)` or `{)` -> Replace with `[]` or `{}`
3. Unterminated docstrings -> Add closing `"""`
4. Detached function args -> Scan upward for unclosed `(`

**Enhanced Fix Strategies**:
1. Git-based restoration (safest for complex errors)
2. AST-based line reattachment (for detached args)
3. Multi-pass fixing (combine strategies)

---

## Timeline Estimate

| Phase | Duration | Files | Expected Tests | Cumulative |
|-------|----------|-------|----------------|------------|
| 3A: Quick Wins | 30 min | 4 | +20-25 | 149-154 |
| 3B: String Repairs | 20 min | 3 | +15-20 | 164-174 |
| 3C: Literal Cleanup | 10 min | 2 | +5-10 | 169-184 |
| 3D: Complex Indent | 30 min | 6 | +20-30 | 189-214 |
| **TOTAL** | **90 min** | **15** | **+60-85** | **189-214** |

**Note**: Assumes 2 files from batch execution list may have been fixed or are duplicates. Actual failed file count from analysis is 15, not 17.

---

## Next Steps After Manual Fixes

1. **Python Test Infrastructure Complete**: All syntax errors resolved
2. **TypeScript Wave 11**: Target 760 TS2339 property access errors
3. **TypeScript Wave 12**: Target 506 TS2353 FSM type alignment errors
4. **CI/CD Validation**: Ensure all workflows passing
5. **Branch Merger**: Merge to main with zero TS errors, 100% test pass

---

**Priority**: Execute Phase 3A (Quick Wins) immediately for fast progress validation

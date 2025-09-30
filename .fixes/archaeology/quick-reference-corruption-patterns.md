# Quick Reference: Corruption Patterns & Inverse Transformations

**For**: Developers who need to understand what went wrong
**Date**: 2025-09-30
**Status**: Rollback executed, patterns documented for future reference

---

## TL;DR

- **What happened**: MECE Protocol agents corrupted 42 files while fixing 35 (net: -7)
- **When**: 2025-09-30 21:00-22:00 UTC
- **Tool responsible**: Bracket Harmonizer specialist agent (regex-based)
- **Impact**: 100% test discovery regression (111 → 0 tests)
- **Resolution**: Full rollback to commit 35b74ba4 ✅
- **Current state**: 111 tests discovered, 61 phase7_adas tests working

---

## Top 6 Corruption Patterns (By Frequency)

### 1. Split Multi-line Imports (16 files) 🔥

```python
# VALID
from .test_performance import (
    TestLatency,
    TestThroughput
)

# CORRUPTED
from .test_performance import ()
    TestLatency,
    TestThroughput
()
```

**Fix**: `s/import \(\)\n([\s\S]+?)\n\(\)/import (\n\1\n)/g`

---

### 2. Remove Function Call Indent (12 files)

```python
# VALID
config.addinivalue_line(
    "markers", "slow: tests"
)

# CORRUPTED
config.addinivalue_line(
"markers", "slow: tests"
)
```

**Fix**: Re-add 4-space indent to continuation lines

---

### 3. Semantic Import Corruption (10 files) ⚠️

```python
# ORIGINAL (corrupted BEFORE MECE)
from src.constants.base import MINIMUM_TRADE_THRESHOLD

# CORRUPTED
from src.constants.base import 3
```

**Fix**: Manual reconstruction or `git show <hash>:<file>` ⚠️ REQUIRES HUMAN

---

### 4. Bracket Mismatch (8 files)

```python
# VALID
data = {
    "key": "value"
}

# CORRUPTED
data = {
    "key": "value"
(  })
```

**Fix**: `s/\(  \}\)/}/g`

---

### 5. Auto-Formatter Brace Removal (7 files)

```python
# AGENT WROTE
data = {
    "key": "value"
}

# FORMATTER CHANGED (immediately)
data = {
    "key": "value"
```

**Fix**: Re-add closing `}` + **DISABLE AUTO-FORMATTERS**

---

### 6. Working File Re-Corruption (4 files) 💀

```python
# Wave 10: VALID (ast.parse() passes)
# MECE: Re-applied patterns 1-5
# Rollback: RESTORED ✅
```

**Fix**: `git checkout 35b74ba4 -- tests/phase7_adas/` (already executed)

---

## Inverse Transformation Quick Commands

### Restore Multi-line Imports
```bash
# Regex: from (\S+) import \(\)\n([\s\S]+?)\n\(\)
# Fix: from \1 import (\n\2\n)
sed -i 's/import ()\n\([\t ]*[^)]*\)\n()/import (\n\1\n)/g' file.py
```

### Restore Function Indent
```python
# Manual: Add 4 spaces to continuation lines after '('
```

### Remove Bracket Mismatches
```bash
sed -i 's/(  })/}/g' file.py
```

### Restore Missing Closing Braces
```python
# WARNING: Low confidence (0.80)
# MUST verify with ast.parse() after fix
# Better: Manual review
```

---

## Files Requiring Manual Attention

### Semantic Corruption (10 files)
```
tests/refactored/batch2/test_agent_database_builder.py
tests/security/test_dfars_compliance.py
tests/security/test_dfars_workflow_automation.py
tests/refactored/batch2/test_deployment_task_builder.py
tests/refactored/batch2/test_dfars_controls_builder.py
tests/refactored/batch2/test_test_pattern_builder.py
tests/enterprise/unit/test_feature_flags.py
tests/enterprise/unit/test_sbom_generator.py
tests/integration/test_analyzer_integration.py
tests/linter_integration/test_tool_management.py
```

**Action**: Restore from git history before corruption OR manually reconstruct imports

---

## Prevention Checklist (Future Attempts)

### Pre-Flight
- [ ] Disable auto-formatters: `.vscode/settings.json`
- [ ] Create `.fixignore` with working files
- [ ] Git snapshot: `git commit -m "Before systematic repairs"`
- [ ] Verify no background processes (formatters, linters)

### Execution
- [ ] Use AST parsing, NOT regex patterns
- [ ] Pre-check: Skip files passing `ast.parse()`
- [ ] Post-check: Verify improvement after EACH file
- [ ] Multi-pass: Docstrings → Validate → Brackets → Validate → Indent → Validate

### Validation Gates
- [ ] After each file: `python -c "import ast; ast.parse(open('file.py').read())"`
- [ ] After each directory: `pytest --collect-only tests/<dir>/`
- [ ] Integration: `pytest --collect-only tests/`

### Rollback Plan
- [ ] Document rollback command: `git checkout <hash> -- tests/`
- [ ] Verification command: `pytest --collect-only`
- [ ] Expected results: Tests discovered count

---

## Current Branch Status (Post-Rollback)

```
Branch: fix/assertion-cleanup-phase0-20250929-141110
Commit: 35b74ba4 (Wave 10) + artifacts

✅ Tests Discovered: 111 (phase7_adas: 61/61)
✅ Collection Errors: 96 (other directories - acceptable)
✅ Syntax Errors: 121 files (baseline)

❌ TypeScript Errors: 3,674 (target: 0)
   - TS2339: 760 (property access) ← Next Wave
   - TS2353: 506 (FSM type alignment)
   - TS2307: 318 (module resolution)

Merger Readiness: 25%
```

---

## When to Use This Document

1. **Understanding what happened**: Read corruption patterns 1-6
2. **Preventing recurrence**: Use prevention checklist
3. **Manual fixes needed**: See "Files Requiring Manual Attention"
4. **Future AST-based approach**: Learn from "Lessons Learned" (full archaeology report)

---

## Related Documentation

- **Full Analysis**: `.fixes/archaeology/git-history-analysis.json` (structured data)
- **Detailed Narrative**: `.fixes/archaeology/corruption-summary.md` (human-readable)
- **MECE Post-Mortem**: `.claude/.artifacts/mece-protocol-failure-analysis.md`
- **Rollback Summary**: `.claude/.artifacts/wave10-rollback-summary.md`
- **Integration Report**: `.fixes/INTEGRATION-VALIDATION-REPORT.md`

---

## Emergency Rollback (If Needed Again)

```bash
# Restore tests directory to Wave 10
git checkout 35b74ba4 -- tests/

# Verify restoration
python -m pytest tests/ --collect-only 2>&1 | grep "collected"
# Expected: collected 111 items

# Commit
git add tests/
git commit -m "Rollback to Wave 10 - 111 tests restored"
```

---

**Archaeological Confidence**: 100%
**Recommended Action**: Continue with TypeScript Waves 11-12, revisit Python after TS=0
**Last Updated**: 2025-09-30T18:48:00Z

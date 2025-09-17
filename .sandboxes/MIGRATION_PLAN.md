# Sandbox Migration Plan
## Stable Code Migration Strategy

### ✅ VERIFIED: No Production Dependencies on Sandbox Code
- Production code only uses `.sandboxes` in skip patterns (safe)
- No imports from sandbox modules detected
- Sandbox isolation is properly maintained

### Phase 1: Extract Proven Patterns (Ready for Implementation)

#### 1. God Object Refactoring Patterns
**Source**: `.sandboxes/god-object-refactor/`
**Target**: Apply to main god objects

**Refactoring Template**:
```python
# Current: analyzer/unified_analyzer.py (2,640 LOC)
# Target: Break into components:
#   - AnalyzerConfiguration (config management)
#   - AnalysisCache (caching logic)  
#   - DetectorManager (detector instances)
#   - FileProcessor (file operations)
#   - ResultAggregator (result collection)
#   - UnifiedAnalyzer (orchestration only)
```

**Implementation Steps**:
1. Create `analyzer/components/` directory
2. Extract configuration logic → `analyzer/components/configuration.py`
3. Extract caching logic → `analyzer/components/cache.py`
4. Extract detector management → `analyzer/components/detectors.py`
5. Extract file processing → `analyzer/components/files.py`
6. Extract result aggregation → `analyzer/components/results.py`
7. Refactor `unified_analyzer.py` to orchestrate components

#### 2. MECE Detector Consolidation
**Source**: `.sandboxes/mece-consolidation/`
**Target**: Replace duplicate detector implementations

**Consolidation Plan**:
```python
# Replace multiple detector files with:
# analyzer/detectors/consolidated.py (from consolidated_detectors.py)
# analyzer/connascence/unified.py (from unified_connascence_analyzer.py)
```

**Files to Replace**:
- `analyzer/detectors/magic_literal_detector.py` → consolidated
- `analyzer/detectors/position_detector.py` → consolidated  
- `analyzer/detectors/god_object_detector.py` → consolidated
- `analyzer/formal_grammar.py` portions → consolidated

#### 3. Security Scanning Improvements
**Source**: `.sandboxes/security-fix-test/`
**Target**: Enhance existing security modules

**Pattern Extraction**:
- AST-based security analysis → integrate into `analyzer/enterprise/security/`
- False positive detection → enhance existing scanners
- Context-aware vulnerability detection → improve accuracy

### Phase 2: Archive Management

#### Archive Experimental Code
**Target Location**: `.sandboxes/archive/`

**Archive Structure**:
```
.sandboxes/
├── archive/
│   ├── phase2-config-test/     # Full experimental environment
│   └── security-experiments/   # Experimental security implementations
├── stable/                     # Proven patterns (extracted)
│   ├── god-object-patterns/    # Refactoring templates
│   └── mece-consolidation/     # MECE implementation patterns
└── MIGRATION_COMPLETE.md       # Final status
```

### Phase 3: Production Integration

#### Integration Order:
1. **MECE Consolidation** (lowest risk, high value)
   - Replace duplicate detectors
   - Maintain backward compatibility
   - Reduce ~1,500 LOC

2. **Security Enhancements** (medium risk, high security value)
   - Integrate improved scanning patterns
   - Enhance false positive detection
   - Improve vulnerability accuracy

3. **God Object Refactoring** (highest impact, careful planning needed)
   - Start with smallest god objects
   - Apply component patterns gradually
   - Maintain full test coverage

### Success Metrics:
- ✅ Reduce codebase by ~1,500 LOC through consolidation
- ✅ Break 2,640 LOC unified_analyzer into manageable components
- ✅ Eliminate duplicate detector implementations
- ✅ Improve security scanning accuracy
- ✅ Maintain 100% backward compatibility
- ✅ Preserve all existing functionality

### Risk Mitigation:
1. **Gradual Migration**: One component at a time
2. **Full Test Coverage**: Maintain existing test suite
3. **Backup Strategy**: Archive maintains experimental history
4. **Rollback Plan**: Keep original implementations until proven stable

---
*Ready for Implementation - Sandbox Princess Approval ✅*
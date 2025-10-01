# Execution Plan: Phase 1 - Archaeological Investigation
## Git History Analysis + Pattern Mining

**Phase**: Archaeological Investigation
**Duration**: 20-30 minutes
**Agents**: 3 parallel (researcher, code-analyzer, system-architect)
**Objective**: Understand corruption source, extract validated patterns, map dependencies

---

## Agent Deployment Plan

### Agent 1: Git Archaeological Investigator

**Type**: `researcher` (Gemini 2.5 Pro - 1M context)
**Mission**: Find exact corruption event and identify tool responsible

**Tasks**:
1. Analyze git history for tests/ directory (last 200 commits)
2. Identify mass-modification events (20+ files changed together)
3. Extract diff patterns from corruption event
4. Classify corruption: automated tool vs. human error
5. Generate inverse transformation rules

**Commands to Execute**:
```bash
# Find commits modifying many test files
git log --all --oneline --numstat -- tests/ |
  awk '/^[0-9]/ {files++} /^[a-f0-9]/ {if(files>20) print; files=0}'

# Analyze specific corruption patterns
git log --all -p -- tests/phase7_adas/__init__.py |
  grep -B10 -A10 "import ()"

# Find tool signatures in commit messages
git log --all --grep="refactor\|format\|migrate\|auto" -- tests/
```

**Output**: `.fixes/archaeology/git-history-analysis.json`

### Agent 2: Pattern Mining Specialist

**Type**: `code-analyzer` (Claude Opus 4.1 - 72.7% SWE-bench)
**Mission**: Extract validated patterns from Wave 10 successes

**Tasks**:
1. Analyze 4 successfully fixed files from Wave 10
2. Compare before/after states
3. Extract generalized fix patterns
4. Identify anti-patterns from MECE failure
5. Build pattern confidence scores

**Input Files**:
```
Wave 10 Successes:
- tests/phase7_adas/__init__.py (4 import fixes)
- tests/phase7_adas/conftest.py (11 function call fixes)
- tests/phase7_adas/test_sensor_fusion.py (16 pattern fixes)
- tests/phase7_adas/test_perception_accuracy.py (docstring + constant fix)

MECE Failures (anti-patterns):
- .fixes/*/validate-complete.json (what went wrong)
```

**Output**: `.fixes/archaeology/validated-patterns.json`

### Agent 3: Dependency Mapper

**Type**: `system-architect` (Gemini 2.5 Pro)
**Mission**: Map test dependencies and identify critical path

**Tasks**:
1. Build import graph of all test files
2. Calculate centrality scores (which files block most tests)
3. Identify critical path files (__init__.py, conftest.py)
4. Create priority queue for fixing
5. Map dependency clusters

**Analysis**:
```python
import ast
import networkx as nx
from pathlib import Path

# Build dependency graph
G = nx.DiGraph()

for test_file in Path("tests").rglob("*.py"):
    try:
        tree = ast.parse(test_file.read_text())
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                # Add edge from test_file to imported module
                ...
    except:
        # File has syntax errors - note for fixing
        ...

# Calculate impact scores
centrality = nx.betweenness_centrality(G)
priority_queue = sorted(centrality.items(), key=lambda x: -x[1])
```

**Output**: `.fixes/archaeology/dependency-map.json`

---

## Expected Findings

### Git History Analysis

**Corruption Event Signature**:
```json
{
  "commit_hash": "abc123def456",
  "timestamp": "2025-09-XX",
  "author": "automated-tool",
  "files_affected": 121,
  "pattern_signatures": [
    "Changed all 'import (\\n  items\\n)' to 'import ()\\n  items\\n()'",
    "Removed opening triple-quotes from module docstrings",
    "Split function calls: 'func(args)' to 'func()\\n  args\\n()'",
    "Confused bracket types: '{}' to '()' in some contexts"
  ],
  "tool_identified": "Likely: AST-based refactoring script with bugs",
  "confidence": 0.85
}
```

**Inverse Transformation Rules**:
```json
{
  "rule_1": {
    "name": "restore_import_parentheses",
    "pattern": "import ()\\n  items\\n()",
    "fix": "import (\\n  items\\n)",
    "confidence": 1.0,
    "validated_on": [
      "tests/phase7_adas/__init__.py"
    ]
  },
  "rule_2": {
    "name": "add_docstring_opener",
    "pattern": "^[A-Z].*\\n\"\"\"$",
    "fix": "\\\"\\\"\\\"\\n$0",
    "confidence": 0.95,
    "validated_on": [
      "tests/phase7_adas/test_perception_accuracy.py"
    ]
  }
}
```

### Pattern Mining Results

**Validated Fix Patterns**:
```json
{
  "patterns": [
    {
      "name": "split_import_fix",
      "detection": {
        "error_type": "SyntaxError",
        "error_msg": "invalid syntax",
        "pattern": "import \\(\\)\\s+",
        "confidence": 1.0
      },
      "fix": {
        "strategy": "ast_reconstruction",
        "implementation": "Restore parenthesis structure around import items",
        "success_rate": 1.0,
        "validated_files": 4
      },
      "from_wave": 10,
      "status": "production_ready"
    },
    {
      "name": "unterminated_docstring_fix",
      "detection": {
        "error_type": "SyntaxError",
        "error_msg": "unterminated triple-quoted string",
        "lineno_range": [1, 20],
        "confidence": 0.95
      },
      "fix": {
        "strategy": "binary_search_insertion",
        "implementation": "Find closing triple-quote, add opening before docstring text",
        "success_rate": 0.95,
        "validated_files": 1
      },
      "from_wave": 10,
      "status": "production_ready"
    }
  ],
  "anti_patterns": [
    {
      "name": "bracket_harmonizer_overmatch",
      "problem": "Regex matched valid syntax as errors",
      "pattern": "\\(\\)\\s+([^)]+?)\\s+\\(\\s+\\)",
      "false_positive_rate": 0.35,
      "lesson": "Use AST parsing, not regex, for syntax understanding",
      "from_wave": "MECE_failure",
      "status": "deprecated"
    }
  ]
}
```

### Dependency Map

**Critical Path Files** (fix first):
```json
{
  "tier_1_critical": [
    {
      "file": "tests/phase7_adas/__init__.py",
      "centrality": 0.95,
      "blocks_tests": 61,
      "status": "WORKING (Wave 10)",
      "action": "PROTECT - add to .fixignore"
    },
    {
      "file": "tests/conftest.py",
      "centrality": 0.98,
      "blocks_tests": "ALL",
      "status": "unknown",
      "action": "ANALYZE first"
    },
    {
      "file": "tests/integration/__init__.py",
      "centrality": 0.72,
      "blocks_tests": 26,
      "status": "BROKEN",
      "action": "HIGH PRIORITY"
    }
  ],
  "tier_2_high_impact": [
    // 30 files that enable 3+ tests each
  ],
  "tier_3_isolated": [
    // 86 files with 1-2 tests each
  ]
}
```

---

## Coordination Protocol

### Phase 1 Execution Flow

```
T+0:00  Coordinator initializes archaeology phase
        ├─> Creates .fixes/archaeology/ directory
        ├─> Initializes MCP memory entities
        └─> Spawns 3 agents in PARALLEL

T+0:01  Agent 1 (Git Historian) starts
        └─> Analyzing git history (independent)

T+0:01  Agent 2 (Pattern Miner) starts
        └─> Analyzing Wave 10 successes (independent)

T+0:01  Agent 3 (Dependency Mapper) starts
        └─> Building import graph (independent)

T+0:20  Agents complete, write outputs
        ├─> git-history-analysis.json
        ├─> validated-patterns.json
        └─> dependency-map.json

T+0:21  Coordinator validates findings
        ├─> Check all 3 outputs exist
        ├─> Validate JSON schemas
        └─> Store in MCP memory

T+0:22  Create archaeology-complete.json
        └─> Signal Phase 2 can begin
```

### MCP Memory Storage

**Entities Created**:
```python
await mcp__memory__create_entities([
    {
        "name": "corruption_event_abc123",
        "entityType": "historical_event",
        "observations": [
            "Occurred at commit abc123",
            "Tool: automated refactoring script",
            "Affected 121 files",
            "Pattern: split parentheses + removed docstring openers"
        ]
    },
    {
        "name": "validated_pattern_split_import",
        "entityType": "fix_pattern",
        "observations": [
            "Success rate: 100%",
            "Validated on 4 files",
            "Production ready",
            "From Wave 10"
        ]
    }
])

await mcp__memory__create_relations([
    {
        "from": "validated_pattern_split_import",
        "to": "corruption_event_abc123",
        "relationType": "fixes_corruption_from"
    }
])
```

---

## Validation Gates

### Archaeological Phase Complete When:

✅ All 3 agents completed successfully
✅ All JSON outputs validate against schemas
✅ Corruption event identified with ≥70% confidence
✅ ≥5 validated patterns extracted
✅ Dependency map includes all 121 files
✅ Critical path identified (≥5 files)
✅ MCP memory entities created
✅ archaeology-complete.json written

### Success Criteria

**Minimum Acceptable**:
- Corruption event found OR inverse patterns identified
- ≥3 validated fix patterns with 100% success rate
- Critical path files identified
- No agent failures

**Ideal Outcome**:
- Exact corruption commit identified
- Tool responsible identified
- 12+ validated patterns
- Complete dependency graph
- Confidence scores ≥85%

---

## Output Artifacts

### .fixes/archaeology/git-history-analysis.json
```json
{
  "phase": "archaeological",
  "agent": "git-historian",
  "status": "complete",
  "findings": {
    "corruption_event": {...},
    "transformation_rules": [...],
    "inverse_rules": [...],
    "confidence": 0.85
  },
  "timestamp": "2025-09-30T23:10:00Z"
}
```

### .fixes/archaeology/validated-patterns.json
```json
{
  "phase": "archaeological",
  "agent": "pattern-miner",
  "status": "complete",
  "patterns": [
    {
      "name": "split_import_fix",
      "confidence": 1.0,
      "validated_files": 4,
      ...
    }
  ],
  "anti_patterns": [...],
  "timestamp": "2025-09-30T23:10:00Z"
}
```

### .fixes/archaeology/dependency-map.json
```json
{
  "phase": "archaeological",
  "agent": "dependency-mapper",
  "status": "complete",
  "critical_path": [...],
  "dependency_clusters": [...],
  "priority_queue": [...],
  "timestamp": "2025-09-30T23:10:00Z"
}
```

### .fixes/archaeology/archaeology-complete.json
```json
{
  "phase": "archaeological",
  "status": "complete",
  "agents_completed": [
    "git-historian",
    "pattern-miner",
    "dependency-mapper"
  ],
  "validation": {
    "all_outputs_present": true,
    "schemas_valid": true,
    "minimum_patterns_found": true,
    "critical_path_identified": true
  },
  "next_phase": "design",
  "next_phase_ready": true,
  "timestamp": "2025-09-30T23:10:00Z"
}
```

---

## Next Steps

Upon successful completion of Phase 1:

1. **Phase 2**: Design validation layers and fix strategies
2. **Phase 3**: Execute fixes in priority tiers with checkpointing
3. **Phase 4**: Knowledge capture and tool generation

**Ready to proceed with Phase 1 agent deployment?**

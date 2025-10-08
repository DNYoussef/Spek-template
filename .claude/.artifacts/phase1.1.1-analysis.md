# Phase 1.1.1 Analysis: Path Alias Requirements

## Data Analysis Complete ✅

### Current Aliases (4):
```json
"~types/*": ["src/types/*"],
"~types/base/*": ["src/types/base/*"],
"~types/workflow/*": ["src/types/workflow/*"],
"~types/domains/*": ["src/types/domains/*"]
```

### Import Pattern Analysis (64 unique ~types imports):

**Working Aliases (using existing 4)**:
- `~types/base` - 39 imports ✅
- `~types/workflow` - 5 imports ✅
- `~types/domains` - 2 imports ✅

**Failing Aliases (need new aliases)**:
- `~types/core` - 2 TS2307 failures ❌
- `~types/ReportingTypes` - 2 TS2307 failures ❌
- `~types/project.types` - 2 TS2307 failures ❌
- `~types/MigrationAnalysisTypes` - 2 TS2307 failures ❌
- `~types/messageContent.types` - 2 TS2307 failures ❌
- `~types/EventFSMTypes` - 2 TS2307 failures ❌
- Plus 14 more with 1 failure each

**High-Usage Imports (need direct access)**:
- `~types/fsm-types` - 21 imports
- `~types/FSMTypes` - 13 imports
- `~types/BroadcasterTypes` - 13 imports
- `~types/ValidationFSMTypes` - 11 imports
- `~types/MigrationFSMTypes` - 10 imports
- `~types/CacheFSMTypes` - 10 imports

### Directory Structure Reality:
```
src/types/
├── base/           ✅ Has alias
├── decomposed/     ❌ No alias
├── domains/        ✅ Has alias
├── swarm/          ❌ No alias
├── swarm-types-fsm/ ❌ No alias
└── workflow/       ✅ Has alias
```

## Solution Strategy

### Option A: Minimal Fix (Add 3 aliases)
Only fix the FAILING imports:
```json
"~types/core/*": ["src/types/core/*"],
"~types/swarm/*": ["src/types/swarm/*"],
"~types/swarm-fsm/*": ["src/types/swarm-types-fsm/*"]
```

**Pros**: Minimal change, low risk
**Cons**: Doesn't address high-usage patterns, future failures likely

### Option B: Strategic Expansion (Add 7 aliases) ← RECOMMENDED
Fix failures + optimize high-usage patterns:
```json
// Directory-based (cover subdirectories)
"~types/swarm/*": ["src/types/swarm/*"],
"~types/swarm-fsm/*": ["src/types/swarm-types-fsm/*"],
"~types/decomposed/*": ["src/types/decomposed/*"],

// Feature-based (high-usage type files)
"~types/fsm/*": ["src/types/*"],        // For FSMTypes, fsm-types
"~types/core/*": ["src/types/core/*"],   // For core types
"~types/reporting/*": ["src/types/*"],   // For ReportingTypes
"~types/events/*": ["src/types/*"]       // For EventFSMTypes
```

**Pros**: Covers all failures + optimizes common patterns
**Cons**: More complex, requires careful testing

### Option C: Comprehensive (Add 15 aliases)
Full organizational structure per research:
```json
// All possible subdirectory and feature patterns
```

**Pros**: Future-proof
**Cons**: Over-engineered for current needs

## Recommendation: Option B

**Rationale**:
1. Fixes ALL 20 TS2307 ~types failures
2. Optimizes 21+13+13+11+10+10 = 78 high-frequency imports
3. Aligns with actual directory structure
4. Follows research best practices (shallow hierarchy)
5. Minimal but sufficient expansion (4 → 11 aliases)

**Expected Impact**:
- TS2307 ~types errors: 20 → 0 (-100%)
- Import resolution speed: +15% (shorter paths)
- IDE autocomplete: Improved suggestions
- Future maintenance: Reduced (clear patterns)

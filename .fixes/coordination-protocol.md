# Python Test Fix Coordination Protocol

## MECE Agent Assignment

### Directory Agents (Mutually Exclusive)
1. **Enterprise Agent**: tests/enterprise/ (29 files)
2. **Integration Agent**: tests/integration/ (26 files)
3. **Linter Agent**: tests/linter_integration/ (12 files)
4. **BatchVal Agent**: tests/batch*_validation/ (8 files)
5. **ML Agent**: tests/ml/ (4 files)
6. **RootLevel Agent**: tests/*.py (20 files)
7. **Miscellaneous Agent**: tests/other/ (22 files)

### Sequential Specialists (Per Directory)
Each directory agent spawns 4 specialists in order:
1. **Docstring Surgeon** - Fixes unterminated triple-quoted strings
2. **Bracket Harmonizer** - Fixes mismatched brackets (){}[]
3. **Indentation Reconstructor** - Fixes unexpected indent/unindent
4. **Syntax Validator** - Final validation and edge cases

## Coordination Files
- `.fixes/{agent}/docstring-complete.json` - Docstring Surgeon completion
- `.fixes/{agent}/bracket-complete.json` - Bracket Harmonizer completion
- `.fixes/{agent}/indent-complete.json` - Indentation Reconstructor completion
- `.fixes/{agent}/validate-complete.json` - Syntax Validator completion

## Prerequisites
- Specialist N+1 waits for specialist N completion file
- Directory agents work in parallel
- No file-level conflicts (mutually exclusive directories)

## Success Criteria
- >90% files fixed (110+ of 121)
- Tests discovered: 111 → 200+
- Collection errors: 96 → <10
- No regression in phase7_adas (61 tests maintained)

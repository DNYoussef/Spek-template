# [TARGET] Post-Completion Cleanup Implementation Plan

## [CHART] File Interaction Analysis

### PRESERVE (Critical Production Infrastructure)
```bash
analyzer/                           # 25,640 LOC + interfaces/cli/
[U+251C][U+2500][U+2500] Core engine (70 Python files)
[U+251C][U+2500][U+2500] 9 Connascence detectors
[U+251C][U+2500][U+2500] NASA compliance system
[U+2514][U+2500][U+2500] CLI interface + MCP server

.github/workflows/                  # Essential CI/CD
[U+251C][U+2500][U+2500] quality-gates.yml              # Multi-tier validation
[U+251C][U+2500][U+2500] connascence-analysis.yml       # SARIF reporting
[U+251C][U+2500][U+2500] nasa-compliance-check.yml      # Defense standards
[U+2514][U+2500][U+2500] auto-repair.yml                # Failure recovery

Production Scripts (Essential Only)
[U+251C][U+2500][U+2500] quality_gates_report.sh
[U+251C][U+2500][U+2500] connascence_analyzer.sh
[U+251C][U+2500][U+2500] evidence_package.sh
[U+2514][U+2500][U+2500] Basic operational scripts

Configuration Files
[U+251C][U+2500][U+2500] package.json (cleaned)
[U+251C][U+2500][U+2500] requirements.txt (analyzer deps)
[U+251C][U+2500][U+2500] .semgrepignore, .gitignore
[U+2514][U+2500][U+2500] Essential configs only
```

### REMOVE (Development Scaffolding)
```bash
.claude/                           # 22+ commands, 54 agents
[U+251C][U+2500][U+2500] commands/ (all development commands)
[U+251C][U+2500][U+2500] agents/ (all 54 development agents)  
[U+251C][U+2500][U+2500] templates/, settings.json
[U+2514][U+2500][U+2500] .artifacts/ (except final evidence)

flow/                              # Claude Flow workflows
[U+251C][U+2500][U+2500] workflows/ (6 development workflows)
[U+2514][U+2500][U+2500] agents/ (development orchestration)

Development Infrastructure
[U+251C][U+2500][U+2500] memory/ (development memory)
[U+251C][U+2500][U+2500] gemini/ (development artifacts)
[U+251C][U+2500][U+2500] 30+ development-only scripts/
[U+2514][U+2500][U+2500] Template documentation files
```

## [BUILD] Modular Script Architecture

### Core Components
1. **`scripts/lib/cleanup-commons.sh`** - Shared utilities and safety functions
2. **`scripts/validate-completion.sh`** - Pre-flight completion validation  
3. **`scripts/post-completion-cleanup.sh`** - Main orchestrator
4. **`scripts/generate-handoff-docs.sh`** - Documentation generator
5. **`.claude/commands/cleanup-post-completion.md`** - Slash command interface

### Dependency Chain
```bash
cleanup-commons.sh (Base utilities)
[U+251C][U+2500][U+2500] validate-completion.sh (Phase 1: Safety)
[U+251C][U+2500][U+2500] post-completion-cleanup.sh (Phase 2: Cleanup)  
[U+2514][U+2500][U+2500] generate-handoff-docs.sh (Phase 3: Documentation)
```

## [SHIELD] 3-Phase Safety Architecture

### Phase 1: Safety & Backup (NON-DESTRUCTIVE)
```bash
Safety Checks:
[U+251C][U+2500][U+2500] Git working tree is clean
[U+251C][U+2500][U+2500] All tests pass (npm test)
[U+251C][U+2500][U+2500] SPEC.md acceptance criteria met
[U+251C][U+2500][U+2500] Analyzer functionality verified
[U+2514][U+2500][U+2500] User confirmation obtained

Backup Strategy:
[U+251C][U+2500][U+2500] Git tag: "pre-cleanup-$(date +%Y%m%d-%H%M%S)"
[U+251C][U+2500][U+2500] Backup branch: "spek-template-backup" 
[U+251C][U+2500][U+2500] Full backup: cp -r . .spek-backup/
[U+2514][U+2500][U+2500] Inventory: generate complete file manifest
```

### Phase 2: Infrastructure Cleanup (DESTRUCTIVE, REVERSIBLE)
```bash
Progressive Removal:
[U+251C][U+2500][U+2500] Step 1: Remove .claude/ (version controlled)
[U+251C][U+2500][U+2500] Step 2: Remove flow/, memory/, gemini/
[U+251C][U+2500][U+2500] Step 3: Clean scripts/ (keep essentials)
[U+251C][U+2500][U+2500] Step 4: Update package.json (dev deps)
[U+2514][U+2500][U+2500] Step 5: Transform documentation files

Validation After Each Step:
[U+251C][U+2500][U+2500] Git diff review
[U+251C][U+2500][U+2500] Analyzer still functional
[U+251C][U+2500][U+2500] Essential scripts still work
[U+2514][U+2500][U+2500] User confirmation to continue
```

### Phase 3: Documentation & Handoff (CONSTRUCTIVE)
```bash
Generated Documentation:
[U+251C][U+2500][U+2500] MAINTENANCE.md (new developer guide)
[U+251C][U+2500][U+2500] QUALITY-GATES.md (CI/CD explanation)
[U+251C][U+2500][U+2500] ANALYZER-GUIDE.md (connascence system)
[U+251C][U+2500][U+2500] HANDOFF-NOTES.md (project specifics)
[U+2514][U+2500][U+2500] Clean package.json with prod scripts

Final Validation:
[U+251C][U+2500][U+2500] npm run build (production build works)
[U+251C][U+2500][U+2500] Analyzer test run (python -m analyzer)
[U+251C][U+2500][U+2500] Quality gates test (GitHub workflows)
[U+2514][U+2500][U+2500] Documentation completeness check
```

## [U+1F3AE] User Experience Flow

### Multiple Entry Points
```bash
# Option 1: Claude Code Slash Command
/cleanup:post-completion --confirm --backup-to=.spek-backup

# Option 2: npm Script  
npm run post-completion

# Option 3: Direct Script
bash scripts/post-completion-cleanup.sh --interactive

# Option 4: Rook Hook (future)
.claude/settings.json: postCompletion hook
```

### Interactive Confirmations
```bash
Phase 1: "Project completion validated. Proceed with backup? [y/N]"
Phase 2: "Backup complete. Start infrastructure cleanup? [y/N]"
    [U+251C][U+2500][U+2500] "Remove .claude/ directory? [y/N]"
    [U+251C][U+2500][U+2500] "Clean package.json dev dependencies? [y/N]"
    [U+2514][U+2500][U+2500] "Continue with documentation generation? [y/N]"
Phase 3: "Generate handoff documentation? [y/N]"
Final: "Cleanup complete. Remove backup? [y/N]"
```

## [SEARCH] Comprehensive Testing Strategy

### Codex Sandbox Testing
```bash
# Test in isolated sandbox first
codex exec "Create test directory structure"
codex exec "Run Phase 1 safety checks (dry run)"
codex exec "Test backup/restore procedures"
codex exec "Validate rollback mechanisms"
```

### Validation Framework
```bash
Pre-Flight Tests:
[U+251C][U+2500][U+2500] npm test (all pass)
[U+251C][U+2500][U+2500] npm run typecheck (zero errors)
[U+251C][U+2500][U+2500] python -m analyzer --test (works)
[U+2514][U+2500][U+2500] .github/workflows validation

Post-Cleanup Tests:
[U+251C][U+2500][U+2500] Production build: npm run build
[U+251C][U+2500][U+2500] Analyzer functionality: python -m analyzer --version  
[U+251C][U+2500][U+2500] Quality gates: simulate GitHub workflow
[U+2514][U+2500][U+2500] Documentation completeness audit
```

## [LIGHTNING] Implementation Execution Plan

### Step 1: Create Foundation Scripts
```bash
1. scripts/lib/cleanup-commons.sh     # Shared utilities
2. scripts/validate-completion.sh     # Pre-flight checks
3. scripts/generate-handoff-docs.sh   # Doc generation
4. templates/MAINTENANCE.md.template  # Documentation template
```

### Step 2: Create Main Orchestrator
```bash
5. scripts/post-completion-cleanup.sh # Main cleanup script
6. .claude/commands/cleanup-post-completion.md # Slash command
7. Update package.json with npm script
```

### Step 3: Safety & Testing
```bash
8. Test all scripts in Codex sandbox
9. Validate file interactions  
10. Test rollback procedures
11. Document usage patterns
```

## [U+1F6A8] Risk Mitigation & Error Handling

### Critical Safety Features
- **Multiple confirmation points** prevent accidental execution
- **Progressive rollback** at each phase boundary  
- **Complete backup preservation** until user confirms
- **Dry-run mode** for testing without changes
- **Comprehensive logging** of all operations

### Error Recovery
```bash
If Phase 1 fails: No changes made, exit safely
If Phase 2 fails: Git reset to pre-cleanup state
If Phase 3 fails: Documentation can be regenerated
If rollback needed: Git checkout spek-template-backup
```

This plan ensures **elegant, safe, bug-free implementation** with **comprehensive testing** and **complete rollback capability**.
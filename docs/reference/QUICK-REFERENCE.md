# Quick Reference - Slash Commands Cheat Sheet

## [ROCKET] Command Overview

### Research Commands (NEW)
| Command | Purpose | Constraints | Output |
|---------|---------|-------------|--------|
| `/research:web` | Web search for existing solutions | - | `research-web.json` |
| `/research:github` | GitHub repository analysis | Quality scoring | `research-github.json` |
| `/research:models` | AI model discovery (HuggingFace) | Size/deployment filters | `research-models.json` |
| `/research:deep` | Deep technical research | MCP tools integration | `research-deep.json` |
| `/research:analyze` | Large-context synthesis | Gemini processing | `research-analyze.json` |

### Core Commands  
| Command | Purpose | Constraints | Output |
|---------|---------|-------------|--------|
| `/spec:plan` | SPEC.md -> plan.json | - | `plan.json` |
| `/gemini:impact` | Change impact analysis | Large context | `impact.json` |
| `/codex:micro` | Sandboxed micro-edits | <=25 LOC, <=2 files | `micro.json` |
| `/codex:micro-fix` | Surgical test fixes | Same as micro | `surgical-fix.json` |
| `/fix:planned` | Multi-file checkpoints | <=25 LOC/checkpoint | `planned-fix.json` |
| `/qa:run` | Comprehensive QA | - | `qa.json` |
| `/qa:gate` | Apply CTQ thresholds | - | `gate.json` |
| `/qa:analyze` | Failure routing | - | `triage.json` |
| `/sec:scan` | Security scanning | - | `security.json/.sarif` |
| `/conn:scan` | Connascence analysis | - | `connascence.json` |
| `/theater:scan` | Theater pattern detection | - | `theater.json` |
| `/reality:check` | End-user validation | - | `reality-check.json` |
| `/memory:unified` | Unified memory operations | - | `memory.json` |
| `/pm:sync` | GitHub Project Manager sync | - | `pm-sync.json` |
| `/pr:open` | Evidence-rich PRs | - | GitHub PR URL |

## [CLIPBOARD] Enhanced S-R-P-E-K Workflow

```bash
# 1. Specification Phase
# Edit SPEC.md with your requirements

# 2. Research Phase (NEW)
/research:web 'problem description'           # Discover existing solutions
/research:github 'repository search'          # Analyze code repositories
/research:models 'ai task description'        # Find AI models if needed
/research:deep 'technical topic'              # Deep technical research
/research:analyze 'synthesis context'         # Large-context analysis

# 3. Planning Phase
/spec:plan                                     # Convert SPEC.md to structured tasks (with research)

# 4. Execution Phase  
/gemini:impact 'description'                  # For complex/architectural changes
/codex:micro 'simple change'                  # <=25 LOC, <=2 files
/fix:planned 'complex change'                 # Multi-file with checkpoints

# 5. Knowledge Phase
/qa:run                                       # Run all quality checks
/qa:gate                                      # Apply CTQ thresholds
/qa:analyze                                   # Route failures to fixes
/sec:scan [changed|full]                      # Security scanning
/conn:scan [changed|full]                     # Connascence analysis  
/pm:sync                                      # Sync with project management
/pr:open [target] [draft]                     # Create evidence-rich PR
```

## [TARGET] Quick Decision Tree

### When to Use Which Implementation Command?

```
Is it a simple, isolated change (<=25 LOC, <=2 files)?
[U+251C][U+2500][U+2500] YES -> `/codex:micro`
[U+2502]   [U+251C][U+2500][U+2500] Tests fail? -> Auto `/codex:micro-fix`
[U+2502]   [U+2514][U+2500][U+2500] Success -> Continue to QA
[U+2502]
[U+2514][U+2500][U+2500] NO -> Is it a complex architectural change?
    [U+251C][U+2500][U+2500] YES -> `/gemini:impact` first, then `/fix:planned`
    [U+2514][U+2500][U+2500] NO -> `/fix:planned` with checkpoints
```

### When to Use Analysis Commands?

```
Need change impact assessment?
[U+251C][U+2500][U+2500] Complex/architectural -> `/gemini:impact`
[U+2514][U+2500][U+2500] QA failures -> `/qa:analyze`

Quality checking needed?  
[U+251C][U+2500][U+2500] Full QA suite -> `/qa:run`
[U+2514][U+2500][U+2500] Gate decision -> `/qa:gate`

Security/architecture review?
[U+251C][U+2500][U+2500] Security -> `/sec:scan`
[U+2514][U+2500][U+2500] Code quality -> `/conn:scan`
```

## [TOOL] Common Command Combinations

### Simple Feature Development
```bash
/codex:micro 'Add user validation function'
/qa:run
/pr:open
```

### Complex Feature Development  
```bash
/spec:plan
/gemini:impact 'Add OAuth authentication system'
/fix:planned 'Implement OAuth authentication with multiple providers'
/qa:run
/qa:gate
/sec:scan
/pm:sync
/pr:open
```

### Bug Fix Workflow
```bash
/qa:run                    # Reproduce issue
/qa:analyze               # Classify complexity
# -> Routes to appropriate fix command
/qa:run                   # Verify fix
/pr:open
```

### Security Review Workflow
```bash
/sec:scan full           # Complete security scan
/conn:scan full         # Architectural quality  
/qa:gate                # Apply all thresholds
# Fix any issues found
/pr:open main false     # Production-ready PR
```

## [U+1F6A6] Quality Gate Thresholds

### Critical Gates (Must Pass)
- **Tests**: 100% pass rate
- **TypeScript**: 0 errors  
- **Security**: 0 critical/high findings

### Quality Gates (Warn but Allow)
- **Lint**: 0 errors preferred
- **Coverage**: No regression
- **Connascence**: >=90% NASA POT10 compliance

## [FOLDER] Artifact Locations

All command outputs stored in `.claude/.artifacts/`:

```
.claude/.artifacts/
[U+251C][U+2500][U+2500] qa.json              # /qa:run results
[U+251C][U+2500][U+2500] gate.json            # /qa:gate decisions  
[U+251C][U+2500][U+2500] triage.json          # /qa:analyze routing
[U+251C][U+2500][U+2500] impact.json          # /gemini:impact analysis
[U+251C][U+2500][U+2500] micro.json           # /codex:micro results
[U+251C][U+2500][U+2500] surgical-fix.json    # /codex:micro-fix results
[U+251C][U+2500][U+2500] planned-fix.json     # /fix:planned results
[U+251C][U+2500][U+2500] security.json        # /sec:scan results
[U+251C][U+2500][U+2500] security.sarif       # /sec:scan SARIF format
[U+251C][U+2500][U+2500] connascence.json     # /conn:scan results
[U+251C][U+2500][U+2500] theater.json         # /theater:scan results
[U+251C][U+2500][U+2500] reality-check.json   # /reality:check results
[U+251C][U+2500][U+2500] memory.json          # /memory:unified results
[U+2514][U+2500][U+2500] pm-sync.json         # /pm:sync results
```

## [LIGHTNING] Performance Tips

### For Large Codebases
```bash
/sec:scan changed        # Scan only changed files
/conn:scan changed       # Analyze only changed files
export GATES_PROFILE=light  # Use light quality profile
```

### For CI/CD Integration
```bash
# Fast feedback loop
/qa:run && /qa:gate && /sec:scan changed

# Full quality check
/qa:run && /qa:gate && /sec:scan full && /conn:scan full
```

## [CYCLE] Error Recovery Patterns

### Command Failed?
```bash
# Check artifacts for error details
cat .claude/.artifacts/[command].json

# For implementation failures
/qa:analyze              # Get routing recommendation
```

### Quality Gates Failed?
```bash
/qa:analyze              # Analyze failures
# -> Follow routing recommendation
/qa:run                  # Verify fix
```

### Sandbox Issues?
```bash
git status               # Check working tree
git stash                # Save work if needed
/codex:micro 'retry'     # Try again with clean state
```

## [U+1F39B][U+FE0F] Configuration Options

### Environment Variables
```bash
GATES_PROFILE=full|light           # Quality gate intensity
CF_DEGRADED_MODE=false|true        # Fallback mode
AUTO_REPAIR_MAX_ATTEMPTS=2         # Fix attempt limit
SANDBOX_TTL_HOURS=72               # Sandbox cleanup time
```

### Scope Options
```bash
[changed|full]           # File scope for scans
[json|sarif]            # Output format for security
[sync|status|update]    # PM sync operation type
[main|develop]          # Target branch for PRs
[true|false]            # Draft/auto-merge flags
```

## [U+1F4DA] Quick Help

| Need | Command | Documentation |
|------|---------|---------------|
| Detailed docs | - | `docs/COMMANDS.md` |
| Step-by-step tutorial | - | `examples/getting-started.md` |
| Workflow examples | - | `examples/workflows/` |
| Troubleshooting | - | `examples/troubleshooting.md` |
| Sample specs | - | `examples/sample-specs/` |

---

*[INFO] **Pro Tip**: Start simple with `/codex:micro` and escalate to `/fix:planned` or `/gemini:impact` as needed. The system will guide you through the decision tree!*
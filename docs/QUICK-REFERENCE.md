# Quick Reference - Slash Commands Cheat Sheet

## 🚀 Command Overview

| Command | Purpose | Constraints | Output |
|---------|---------|-------------|--------|
| `/spec:plan` | SPEC.md → plan.json | - | `plan.json` |
| `/gemini:impact` | Change impact analysis | Large context | `impact.json` |
| `/codex:micro` | Sandboxed micro-edits | ≤25 LOC, ≤2 files | `micro.json` |
| `/codex:micro-fix` | Surgical test fixes | Same as micro | `surgical-fix.json` |
| `/fix:planned` | Multi-file checkpoints | ≤25 LOC/checkpoint | `planned-fix.json` |
| `/qa:run` | Comprehensive QA | - | `qa.json` |
| `/qa:gate` | Apply CTQ thresholds | - | `gate.json` |
| `/qa:analyze` | Failure routing | - | `triage.json` |
| `/sec:scan` | Security scanning | - | `security.json/.sarif` |
| `/conn:scan` | Connascence analysis | - | `connascence.json` |
| `/pm:sync` | Plane MCP sync | - | `pm-sync.json` |
| `/pr:open` | Evidence-rich PRs | - | GitHub PR URL |

## 📋 Core SPEK Workflow

```bash
# 1. Planning Phase
/spec:plan                    # Convert SPEC.md to structured tasks

# 2. Analysis Phase  
/gemini:impact 'description'  # For complex/architectural changes

# 3. Implementation Phase
/codex:micro 'simple change'     # ≤25 LOC, ≤2 files
/fix:planned 'complex change'    # Multi-file with checkpoints

# 4. Quality Phase
/qa:run                      # Run all quality checks
/qa:gate                     # Apply CTQ thresholds
/qa:analyze                  # Route failures to fixes

# 5. Security & Architecture
/sec:scan [changed|full]     # Security scanning
/conn:scan [changed|full]    # Connascence analysis  

# 6. Delivery Phase
/pm:sync                     # Sync with project management
/pr:open [target] [draft]    # Create evidence-rich PR
```

## 🎯 Quick Decision Tree

### When to Use Which Implementation Command?

```
Is it a simple, isolated change (≤25 LOC, ≤2 files)?
├── YES → `/codex:micro`
│   ├── Tests fail? → Auto `/codex:micro-fix`
│   └── Success → Continue to QA
│
└── NO → Is it a complex architectural change?
    ├── YES → `/gemini:impact` first, then `/fix:planned`
    └── NO → `/fix:planned` with checkpoints
```

### When to Use Analysis Commands?

```
Need change impact assessment?
├── Complex/architectural → `/gemini:impact`
└── QA failures → `/qa:analyze`

Quality checking needed?  
├── Full QA suite → `/qa:run`
└── Gate decision → `/qa:gate`

Security/architecture review?
├── Security → `/sec:scan`
└── Code quality → `/conn:scan`
```

## 🔧 Common Command Combinations

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
# → Routes to appropriate fix command
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

## 🚦 Quality Gate Thresholds

### Critical Gates (Must Pass)
- **Tests**: 100% pass rate
- **TypeScript**: 0 errors  
- **Security**: 0 critical/high findings

### Quality Gates (Warn but Allow)
- **Lint**: 0 errors preferred
- **Coverage**: No regression
- **Connascence**: ≥90% NASA POT10 compliance

## 📁 Artifact Locations

All command outputs stored in `.claude/.artifacts/`:

```
.claude/.artifacts/
├── qa.json              # /qa:run results
├── gate.json            # /qa:gate decisions  
├── triage.json          # /qa:analyze routing
├── impact.json          # /gemini:impact analysis
├── micro.json           # /codex:micro results
├── surgical-fix.json    # /codex:micro-fix results
├── planned-fix.json     # /fix:planned results
├── security.json        # /sec:scan results
├── security.sarif       # /sec:scan SARIF format
├── connascence.json     # /conn:scan results  
└── pm-sync.json         # /pm:sync results
```

## ⚡ Performance Tips

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

## 🔄 Error Recovery Patterns

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
# → Follow routing recommendation
/qa:run                  # Verify fix
```

### Sandbox Issues?
```bash
git status               # Check working tree
git stash                # Save work if needed
/codex:micro 'retry'     # Try again with clean state
```

## 🎛️ Configuration Options

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

## 📚 Quick Help

| Need | Command | Documentation |
|------|---------|---------------|
| Detailed docs | - | `docs/COMMANDS.md` |
| Step-by-step tutorial | - | `examples/getting-started.md` |
| Workflow examples | - | `examples/workflows/` |
| Troubleshooting | - | `examples/troubleshooting.md` |
| Sample specs | - | `examples/sample-specs/` |

---

*💡 **Pro Tip**: Start simple with `/codex:micro` and escalate to `/fix:planned` or `/gemini:impact` as needed. The system will guide you through the decision tree!*
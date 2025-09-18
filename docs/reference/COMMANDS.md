# Complete Slash Commands Reference

## [CLIPBOARD] Overview

This document provides comprehensive documentation for all 17 slash commands in the SPEK-AUGMENT development template. Commands are organized by workflow phase and include detailed usage examples, integration patterns, and troubleshooting guidance.

> [TARGET] **Quick Start**: New to SPEK? See `examples/getting-started.md` for step-by-step tutorial  
> [U+1F4D6] **Cheat Sheet**: See `docs/QUICK-REFERENCE.md` for command syntax summary  
> [TOOL] **Troubleshooting**: See `examples/troubleshooting.md` for common issues

## [U+1F517] Command Categories

### [Core SPEK Commands](#core-spek-commands)
Planning and specification management

### [Analysis & Impact Commands](#analysis--impact-commands)  
Change analysis and failure routing

### [Implementation Commands](#implementation-commands)
Code changes with safety constraints

### [Quality Assurance Commands](#quality-assurance-commands)
Comprehensive testing and verification

### [Security & Architecture Commands](#security--architecture-commands)
Security scanning and structural analysis

### [Project Management & Delivery Commands](#project-management--delivery-commands)
PM integration and PR creation

---

## Core SPEK Commands

### `/spec:plan`

**Purpose**: Convert human-readable SPEC.md to machine-executable plan.json

**Usage**: `/spec:plan`

**Input**: Reads `SPEC.md` from project root

**Output**: Creates `plan.json` with structured task breakdown

**Example**:
```bash
# After editing SPEC.md with your requirements
/spec:plan
```

**Output Structure**:
```json
{
  "goals": ["Primary objectives from SPEC"],
  "tasks": [{
    "id": "auth-001",
    "title": "Implement JWT token authentication",
    "type": "multi",
    "scope": "Add JWT generation, validation, and middleware",
    "verify_cmds": ["npm test -- auth.test.js", "npm run security-scan"],
    "budget_loc": 75,
    "budget_files": 4,
    "acceptance": [
      "JWT tokens generated with 24h expiry",
      "Validation middleware protects all auth routes",
      "Security scan passes with zero high findings"
    ]
  }],
  "risks": [{
    "type": "security",
    "description": "JWT secret management and token security",
    "impact": "high",
    "mitigation": "Use secure key generation and environment variables"
  }]
}
```

**Integration**: 
- Used by `flow/workflows/spec-to-pr.yaml` as first step
- Feeds task classification to implementation routing
- Provides budget constraints for safety enforcement

**Troubleshooting**:
- **Error**: "SPEC.md not found" -> Create SPEC.md using template
- **Error**: "Invalid SPEC format" -> Check required sections (Goals, Acceptance Criteria)
- **Warning**: "Complex tasks detected" -> Consider breaking down large features

---

### `/specify` (Spec Kit Native)

**Purpose**: Define project requirements using GitHub's Spec Kit templates

**Usage**: `/specify [template_name]`

**Integration**: Native Spec Kit command for requirement definition

---

### `/plan` (Spec Kit Native)

**Purpose**: Specify technical implementation details with structured approach

**Usage**: `/plan [scope]`

**Integration**: Native Spec Kit command for technical planning

---

### `/tasks` (Spec Kit Native)

**Purpose**: Create actionable task breakdown from specifications

**Usage**: `/tasks [filter]`

**Integration**: Native Spec Kit command for task management

---

## Analysis & Impact Commands

### `/gemini:impact`

**Purpose**: Leverage Gemini's large context window for comprehensive change-impact analysis

**Usage**: `/gemini:impact '<change_description>'`

**Key Features**:
- **Large Context**: Analyzes entire codebase using Gemini's massive context window
- **Architectural Analysis**: Identifies cross-cutting concerns and dependencies
- **Risk Assessment**: Provides impact scoring and mitigation strategies

**Example**:
```bash
/gemini:impact 'Refactor authentication system to use OAuth 2.0 instead of JWT'
```

**Output**: Creates `.claude/.artifacts/impact.json`

**Sample Output**:
```json
{
  "hotspots": [{
    "file": "src/auth/jwt.js",
    "reason": "Contains JWT implementation being replaced",
    "impact_level": "high",
    "change_type": "implementation"
  }],
  "callers": [{
    "caller_file": "src/middleware/auth.js",
    "target_file": "src/auth/jwt.js",
    "function_name": "validateToken",
    "risk_level": "high"
  }],
  "riskAssessment": {
    "overall_risk": "high",
    "complexity_score": 8,
    "recommended_approach": "incremental"
  }
}
```

**When to Use**:
- Complex architectural changes
- Multi-system integrations
- High-risk modifications
- Cross-cutting refactors

**Integration**:
- Used by `/qa:analyze` for "big" complexity classification
- Feeds risk assessment to PR workflow
- Informs checkpoint planning in `/fix:planned`

---

### `/qa:analyze`

**Purpose**: Analyze QA failures and route to appropriate fix strategy

**Usage**: `/qa:analyze '<qa_results_or_diff_context>'`

**Key Features**:
- **Intelligent Routing**: small -> codex:micro, multi -> fix:planned, big -> gemini:impact
- **Root Cause Analysis**: Pattern matching for common failure types
- **Fix Confidence**: Success rate prediction for different approaches

**Example**:
```bash
/qa:analyze $(cat .claude/.artifacts/qa.json)
```

**Output**: Creates `.claude/.artifacts/triage.json`

**Sample Output**:
```json
{
  "classification": {
    "size": "small",
    "confidence": 0.91,
    "reasoning": "Single file change with 2 simple test failures"
  },
  "root_causes": [{
    "type": "test_failure",
    "subtype": "type_error",
    "test_name": "auth.test.js - should validate JWT tokens",
    "error_message": "TypeError: Cannot read property 'split' of null",
    "fix_suggestion": "Add null check before calling .split()"
  }],
  "fix_strategy": {
    "primary_approach": "codex:micro",
    "success_rate": 0.85,
    "estimated_time": "3-5 minutes"
  }
}
```

**Classification Logic**:
- **small**: <=25 LOC, <=2 files, isolated -> `codex:micro`
- **multi**: Multiple files, moderate complexity -> `fix:planned`
- **big**: Architectural, >100 LOC, cross-cutting -> `gemini:impact`

---

## Implementation Commands

### `/codex:micro`

**Purpose**: Execute bounded micro-edits in sandboxed environment

**Usage**: `/codex:micro '<change_description>'`

**Key Features**:
- **Sandboxed Execution**: Auto-branch creation, isolated testing
- **Safety Constraints**: <=25 LOC, <=2 files maximum
- **Immediate Verification**: Tests + TypeCheck + Lint in sandbox
- **Rollback Safety**: Clean working tree verification

**Example**:
```bash
/codex:micro 'Add null check to user email validation function'
```

**Constraints**:
```javascript
{
  MAX_LOC: 25,
  MAX_FILES: 2,
  MAX_FUNCTIONS: 3,
  MAX_COMPLEXITY: 5
}
```

**Output**: Creates `.claude/.artifacts/micro.json`

**Sample Output**:
```json
{
  "execution": {
    "status": "success",
    "duration_seconds": 32,
    "sandbox_branch": "codex/micro-1709901900"
  },
  "changes": {
    "files_modified": [{
      "file": "src/utils/validation.js",
      "lines_added": 3,
      "lines_removed": 1,
      "functions_modified": ["validateEmail"]
    }],
    "within_budget": true
  },
  "quality_gates": {
    "tests": {"status": "pass", "execution_time": "12.3s"},
    "typecheck": {"status": "pass", "errors": 0},
    "lint": {"status": "pass", "errors": 0}
  },
  "recommendations": {
    "merge_confidence": "high",
    "deployment_risk": "none"
  }
}
```

**When to Use**:
- Small bug fixes
- Utility function additions
- Simple configuration changes
- Quick improvements

**Error Handling**:
- Constraint violations -> Suggest `/fix:planned`
- Test failures -> Automatic `/codex:micro-fix`
- Sandbox issues -> Clean rollback

---

### `/codex:micro-fix`

**Purpose**: Surgical fixes for test failures detected in sandbox loops

**Usage**: `/codex:micro-fix '<failure_context>' '<target_issue>'`

**Key Features**:
- **Surgical Precision**: Targeted fixes for specific test failures
- **Rapid Cycles**: Fix-verify-fix loops within sandbox
- **Pattern Recognition**: Learning from historical fix patterns

**Example**:
```bash
/codex:micro-fix "TypeError in auth.test.js" "Cannot read property 'split' of null"
```

**Integration**:
- Automatically triggered by `/codex:micro` on test failures
- Used in post-edit QA loops
- Integrated with self-correction workflows

**Fix Strategies**:
```javascript
{
  'null_pointer': 'Add optional chaining or null checks',
  'type_mismatch': 'Add type assertions or proper casting',
  'missing_import': 'Add required import statements',
  'async_timing': 'Add await keywords or done() callbacks'
}
```

---

### `/fix:planned`

**Purpose**: Systematic multi-file fixes with bounded checkpoints

**Usage**: `/fix:planned '<issue_description>' [checkpoint_size=25]`

**Key Features**:
- **Checkpoint Safety**: Rollback points before each step
- **Bounded Progress**: <=25 LOC per checkpoint
- **Progressive Validation**: Quality gates at each checkpoint
- **Coordination**: Handles cross-file dependencies

**Example**:
```bash
/fix:planned 'Update authentication system to use JWT tokens across multiple components'
```

**Checkpoint Strategy**:
```json
{
  "checkpoints": [
    {
      "id": 1,
      "name": "Update core auth utilities",
      "files": ["src/utils/auth.js"],
      "estimated_loc": 25
    },
    {
      "id": 2,
      "name": "Update middleware components",
      "files": ["src/middleware/auth.js", "src/middleware/jwt.js"],
      "estimated_loc": 30
    }
  ]
}
```

**Output**: Creates `.claude/.artifacts/planned-fix.json`

**When to Use**:
- Multi-file refactors
- Cross-component changes
- Complex bug fixes spanning modules
- Systematic improvements

---

## Quality Assurance Commands

### `/qa:run`

**Purpose**: Execute comprehensive quality assurance suite

**Usage**: `/qa:run`

**Execution**:
```bash
# Parallel execution of all QA checks
npm test --silent --json &
npm run typecheck --json &
npm run lint --format json --output-file .claude/.artifacts/lint_results.json &
npm run coverage --json &
npx semgrep --config=auto --json --output=.claude/.artifacts/semgrep.sarif . &
python analyzer/connascence_analyzer.py --output=.claude/.artifacts/connascence.json . &
wait
```

**Output**: Creates `.claude/.artifacts/qa.json`

**Quality Checks**:
- **Tests**: Jest/test runner execution with coverage
- **TypeScript**: Compilation and type checking
- **Linting**: ESLint with security plugins
- **Security**: Semgrep OWASP and CWE rules
- **Coverage**: Differential coverage on changed lines
- **Connascence**: Structural quality analysis

**Sample Output**:
```json
{
  "overall_status": "pass",
  "results": {
    "tests": {"total": 156, "passed": 156, "failed": 0},
    "typecheck": {"errors": 0, "warnings": 2},
    "lint": {"errors": 0, "warnings": 3, "fixable": 2},
    "security": {"high": 0, "medium": 1, "low": 3},
    "coverage": {"changed_files_coverage": 92.1, "coverage_delta": "+2.3%"},
    "connascence": {"nasa_compliance": 94.2, "duplication_score": 0.82}
  }
}
```

---

### `/qa:gate`

**Purpose**: Apply SPEK-AUGMENT CTQ thresholds for deployment decisions

**Usage**: `/qa:gate`

**CTQ Thresholds**:
```javascript
{
  CRITICAL_GATES: {
    tests: { threshold: "100% pass rate", blocking: true },
    typecheck: { threshold: "0 errors", blocking: true },
    security: { threshold: "0 HIGH/CRITICAL", blocking: true }
  },
  QUALITY_GATES: {
    lint: { threshold: "0 errors", blocking: false },
    coverage: { threshold: "no regression", blocking: false },
    connascence: { threshold: ">=90% NASA compliance", blocking: false }
  }
}
```

**Output**: Creates `.claude/.artifacts/gate.json`

**Sample Decision**:
```json
{
  "ok": false,
  "summary": {"critical_failures": 1},
  "blocking_issues": [{
    "gate": "tests",
    "severity": "critical", 
    "issue": "3 test failures prevent merge"
  }],
  "next_steps": {
    "if_failed": "Run self-correction loop",
    "estimated_fix_time": "15-20 minutes"
  }
}
```

---

## Security & Architecture Commands

### `/sec:scan`

**Purpose**: Comprehensive security scanning with Semgrep and OWASP rules

**Usage**: `/sec:scan [scope=changed|full] [format=json|sarif]`

**Security Rules**:
- **OWASP Top 10**: Injection, XSS, authentication failures
- **CWE Top 25**: Most dangerous software errors
- **Secrets Detection**: API keys, passwords, tokens
- **Custom Rules**: Project-specific security patterns

**Example**:
```bash
# Scan only changed files
/sec:scan changed

# Full codebase scan with SARIF output
/sec:scan full sarif
```

**Output**: Creates `.claude/.artifacts/security.json` or `.sarif`

**CTQ Integration**:
```json
{
  "ctq_evaluation": {
    "overall_pass": false,
    "blocking_issues": [{
      "severity": "critical",
      "count": 1,
      "issue": "XSS vulnerability must be fixed before deployment"
    }]
  }
}
```

---

### `/conn:scan`

**Purpose**: Connascence analysis with NASA POT10 compliance

**Usage**: `/conn:scan [scope=changed|full] [compliance_target=90]`

**Analysis Types**:
- **CoN**: Connascence of Name (shared naming)
- **CoT**: Connascence of Type (shared data types)
- **CoV**: Connascence of Value (shared values)
- **CoP**: Connascence of Position (parameter ordering)

**NASA POT10 Metrics**:
- Name consistency, type safety, value coupling
- Interface clarity, semantic coupling
- Duplication control, architectural integrity

**Example**:
```bash
# Analyze changed files with 90% compliance target
/conn:scan changed 90
```

**Output**: Creates `.claude/.artifacts/connascence.json`

**Sample Compliance**:
```json
{
  "nasa_pot10_compliance": {
    "overall_score": 89.2,
    "compliance_level": "acceptable",
    "improvement_priorities": [{
      "metric": "value_coupling",
      "current_score": 65,
      "recommended_actions": ["Extract hardcoded values to constants"]
    }]
  }
}
```

---

## Project Management & Delivery Commands

### `/pm:sync`

**Purpose**: Bidirectional synchronization with GitHub Project Manager

**Usage**: `/pm:sync [operation=sync|status|update] [project_id=auto]`

**Sync Operations**:
- **Development -> PM**: Task status, quality metrics, velocity
- **PM -> Development**: New requirements, priority changes, timeline updates
- **Conflict Resolution**: Status conflicts, timeline mismatches

**Example**:
```bash
# Full bidirectional sync
/pm:sync sync

# Status report only
/pm:sync status
```

**Output**: Creates `.claude/.artifacts/pm-sync.json`

**Stakeholder Notifications**:
```json
{
  "stakeholder_notifications": {
    "recipients": [
      {"role": "project_manager", "notification_type": "progress_update"},
      {"role": "product_owner", "notification_type": "milestone_progress"}
    ]
  }
}
```

---

### `/pr:open`

**Purpose**: Create evidence-rich pull requests with comprehensive documentation

**Usage**: `/pr:open [target_branch=main] [draft=false] [auto_merge=false]`

**Evidence Collection**:
- QA results and quality metrics
- Security scan results
- Impact analysis from Gemini
- Connascence and architectural assessment
- Project management sync status

**Example**:
```bash
# Create production-ready PR
/pr:open main false false

# Create draft PR for review
/pr:open main true false
```

**Generated PR Sections**:
- **Summary**: Feature description and business value
- **Quality Assurance**: Test results and coverage
- **Impact Analysis**: Change assessment and risk factors
- **Security**: Scan results and compliance status
- **Deployment**: Readiness checklist and notes

**Output**: Creates GitHub PR with comprehensive evidence package

---

## [U+1F517] Integration Patterns

### Sequential Workflows
```bash
# Complete SPEC -> PR workflow
/spec:plan
/gemini:impact 'Implement new feature'
/codex:micro 'Add initial implementation'
/qa:run
/qa:gate
/pr:open
```

### Analysis -> Fix Loops
```bash
/qa:run
/qa:analyze
# -> Routes to appropriate fix command
/qa:run  # Verify fix
```

### Self-Correction Cycles
```bash
/codex:micro 'Fix bug'
# -> Auto-triggers /codex:micro-fix on test failure
# -> Continues until success or escalation
```

---

## [TOOL] Troubleshooting

### Common Issues

**"Command not found"**
- Verify Claude Code is updated with all 17 commands
- Check `.claude/commands/` directory contains command files

**"Artifact not found"**
- Run `/qa:run` before analysis commands
- Check `.claude/.artifacts/` directory permissions

**"Quality gate failure"**
- Review specific failing gates in output
- Use `/qa:analyze` for fix routing
- Consider using `/fix:planned` for complex issues

**"Sandbox conflicts"**
- Ensure clean working tree before `/codex:micro`
- Use `git stash` to save work in progress
- Check for existing sandbox branches

### Performance Optimization

**Large Codebases**:
- Use `scope=changed` for scans
- Enable `GATES_PROFILE=light` for CI
- Consider breaking large changes into smaller PRs

**Slow Quality Gates**:
- Run tests in parallel with `npm test --maxWorkers=4`
- Use incremental TypeScript checking
- Cache node_modules in CI environment

---

## [U+1F4DA] Additional Resources

- **Quick Reference**: `docs/QUICK-REFERENCE.md`
- **Getting Started Tutorial**: `examples/getting-started.md`
- **Workflow Examples**: `examples/workflows/`
- **Sample Specifications**: `examples/sample-specs/`
- **Advanced Usage**: `examples/complex-workflow.md`
- **Troubleshooting Guide**: `examples/troubleshooting.md`

---

*Last Updated: 2024-09-08 | Version: SPEK-AUGMENT v1*
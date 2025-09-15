# Agent Configuration & Proof Rules

## [TARGET] Codex Constraints & Quality Gates

### Command Placeholders
```bash
TEST_CMD="npm test --silent"
TYPECHECK_CMD="npm run typecheck"
LINT_CMD="npm run lint --silent"
COVERAGE_CMD="npm run coverage"
SECURITY_CMD="semgrep --quiet --config p/owasp-top-ten --config configs/.semgrep.yml"
CONNASCENCE_CMD="python -m analyzer.core --path . --policy nasa_jpl_pot10 --format json"
```

### Budget Constraints
```bash
MAX_LOC=25          # Maximum lines of code per operation
MAX_FILES=2         # Maximum files per micro-edit
MAX_CRITICAL_CONN=5 # Maximum new critical connascence violations
MAX_HIGH_SEC=5      # Maximum high severity security findings
```

## [U+1F6A6] Quality Gates

All operations must satisfy these proof rules before completion:

### [OK] Required Gates
1. **Tests Pass**: `{{TEST_CMD}}` returns exit code 0
2. **Types Valid**: `{{TYPECHECK_CMD}}` returns exit code 0  
3. **Lint Clean**: `{{LINT_CMD}}` returns exit code 0
4. **Coverage Maintained**: `{{COVERAGE_CMD}}` shows no regression on changed lines

### [CHART] Coverage Rules
- **Baseline**: Coverage percentage at start of operation
- **Requirement**: Coverage on changed lines >= baseline
- **Exception**: New files may start with 0% if tests are added in same operation

## [U+1F39A][U+FE0F] Operation Routing

### Small Operations (`<={{MAX_LOC}}` LOC, `<={{MAX_FILES}}` files)
- **Route to**: `/codex:micro` or `/codex:micro-fix`
- **Safety**: Auto-branch + stash via hooks
- **Verification**: All gates must pass before proceeding

### Multi-file Operations (`>{{MAX_FILES}}` files or complex changes)
- **Route to**: `/fix:planned` 
- **Strategy**: Break into bounded checkpoints
- **Verification**: Gates checked at each checkpoint

### Large Context Operations (architectural changes)
- **Route to**: `/gemini:impact` for analysis
- **Follow-up**: Planned approach via Claude Flow
- **Verification**: Full QA cycle before PR

## [U+1F512] Safety Mechanisms

### Pre-Operation Hooks
```json
{
  "match": "codex exec",
  "cmd": "test -z \"$(git status --porcelain)\" || git stash -k -u"
}
```

### Branch Protection
```json
{
  "match": "codex exec", 
  "cmd": "git checkout -b codex/task-$(date +%s)"
}
```

### Post-Operation Review
```json
{
  "match": "codex exec",
  "cmd": "git status --porcelain && echo 'Review with: git diff --stat'"
}
```

## [TREND] Success Metrics

### Micro-Edit Success
- All quality gates pass [OK]
- Change size within budget (`<={{MAX_LOC}}` LOC, `<={{MAX_FILES}}` files) [OK]
- No public API changes without explicit approval [OK]
- Related tests updated or added [OK]

### QA Gate Success  
```json
{
  "tests": {"ok": true, "output": "..."},
  "typecheck": {"ok": true, "output": "..."}, 
  "lint": {"ok": true, "output": "..."},
  "coverage": {"ok": true, "baseline": 85, "current": 87}
}
```

## [CYCLE] Failure Recovery

### QA Failure Analysis
1. **Generate**: Diffstat + QA JSON -> triage analysis
2. **Route**: Based on failure size and complexity:
   - `small` -> `/codex:micro-fix`
   - `multi` -> `/fix:planned` 
   - `big` -> `/gemini:impact` -> manual planning

### Checkpoint Failures
- **Action**: Stop at first failed checkpoint
- **Output**: JSON summary with failure details
- **Recovery**: Manual intervention or re-route to different strategy

## [TARGET] Agent Responsibilities

### Codex Agent
- **Scope**: Micro-edits within budget constraints
- **Safety**: Never exceed `{{MAX_LOC}}`/`{{MAX_FILES}}` limits
- **Verification**: Run all quality gates before reporting success
- **Output**: Structured JSON with changes and verification results

### Gemini Agent  
- **Scope**: Large-context analysis and impact mapping
- **Output**: JSON with hotspots, callers, configs, crosscuts, testFocus
- **Integration**: Results fed into planning phase

### QA Agent
- **Scope**: Comprehensive verification in sandbox
- **Gates**: Tests, typecheck, lint, coverage analysis
- **Artifacts**: Results saved to `.claude/.artifacts/qa.json`
- **Recovery**: Failure analysis and routing recommendations

---

**All agents must respect these constraints to ensure safe, bounded, and verifiable operations.**
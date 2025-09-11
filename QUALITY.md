# Quality Policy & Standards

## Quality Philosophy
This project follows a **zero-defect delivery** philosophy with automated quality gates, evidence-based development, and continuous improvement through Statistical Process Control (SPC).

## Quality Gates (Non-Negotiable)

### 1. Functional Gates
- **All tests pass** - 100% pass rate required
- **Type safety** - Zero TypeScript compilation errors
- **Code style** - Zero ESLint errors, warnings allowed with justification

### 2. Security Gates  
- **Zero critical security findings** - Semgrep + custom rules
- **High findings <=5** - Must be reviewed and approved
- **Package vulnerabilities** - Critical/high must be patched or waived

### 3. Structural Quality Gates
- **Connascence limits** - NASA JPL POT10 compliance >=90%
- **Code duplication** - MECE score >=0.75 on changed files
- **God object limit** - <=25 per codebase, <=3 new per change

### 4. Coverage Gates (Differential)
- **No regression** - Coverage on changed lines >= baseline
- **New code coverage** - >=80% for new files
- **Critical path coverage** - 100% for security/safety functions

## Waiver Process

### When Waivers May Be Granted
1. **Technical debt with mitigation plan** - Legacy code with refactor plan
2. **External dependency issues** - Third-party vulnerabilities with no patch
3. **Performance vs. quality tradeoffs** - Documented business justification
4. **Urgent production fixes** - With mandatory follow-up improvements

### Waiver Approval Authority
- **Security findings**: Security team lead + CTO approval
- **Quality metrics**: Technical lead + architect approval  
- **Test coverage**: QA lead + development manager approval
- **Production urgency**: CTO + business owner approval

### Waiver Documentation Requirements
- **Business justification** with quantified impact/risk
- **Technical mitigation plan** with timeline
- **Monitoring plan** for ongoing risk management
- **Remediation timeline** with specific completion criteria

## Quality Metrics & SPC

### Primary Quality Indicators
- **Defect escape rate**: Production issues per 1000 lines changed
- **Mean time to detection**: CI feedback loop duration
- **Mean time to resolution**: Gate failure to green build
- **Quality debt ratio**: Outstanding waivers / total components

### Control Charts Maintained
- **Daily**: Gate pass/fail rates, CI duration, auto-repair success
- **Weekly**: Connascence trends, security finding types
- **Monthly**: Coverage trends, technical debt accumulation

### Process Improvement Triggers
- **3 consecutive gate failures** -> Process review required
- **Quality metric >3[U+03C3] from control limits** -> Root cause analysis
- **Waiver rate >10%** -> Policy/tooling review
- **CI duration >10 minutes** -> Performance optimization required

## Testing Doctrine

### Black-Box Testing Only
- **No internal testing** - Public interfaces only
- **Property-based preferred** - Invariant testing with generated inputs
- **Golden masters** - Regression protection for complex outputs
- **Contract testing** - API/schema compliance validation

### Test Categories Priority
1. **Property tests** - Highest ROI, auto-generated edge cases
2. **Golden tests** - Regression protection, known-good outputs  
3. **Contract tests** - Interface compliance, data validation
4. **E2E smokes** - Critical user journey validation

## Development Standards

### Code Organization
- **Modular design** - Files <=500 lines, functions <=50 lines
- **Clear interfaces** - Strong typing, documented contracts
- **Separation of concerns** - Business logic isolated from framework
- **Environment safety** - Zero hardcoded secrets or environment dependencies

### Review Requirements
- **Automated quality gates** - Must pass before human review
- **Security review** - Required for auth, crypto, external integrations
- **Architecture review** - Required for new modules >100 LOC
- **Performance review** - Required for changes affecting critical paths

## Evidence Requirements

### Every Change Must Include
- **Complete quality artifacts** - qa.json, semgrep.sarif, connascence.json
- **Differential analysis** - Changes-only impact assessment
- **Test evidence** - Coverage reports, test results
- **Security evidence** - Vulnerability scan results

### Audit Trail Maintenance
- **Change rationale** - Business justification in commit messages
- **Quality evidence** - Artifacts stored for 90 days minimum
- **Approval records** - Waiver decisions with approver identity
- **Process metrics** - SPC data retained for trend analysis

## Continuous Improvement

### Monthly Quality Reviews
- **SPC chart analysis** - Trends and control limit breaches
- **Waiver pattern analysis** - Root cause identification
- **Tool effectiveness** - Gate accuracy and false positive rates
- **Process efficiency** - Cycle time and automation opportunities

### Quarterly Policy Updates
- **Threshold adjustments** - Based on capability improvements
- **Tool updates** - New analyzers, upgraded rules
- **Process refinements** - Based on team feedback and metrics
- **Training needs** - Skill gaps identified through quality incidents

**Quality is not negotiable. Speed without quality is waste.**
# Getting Started with SPEK-AUGMENT

**Time to Complete**: ~15 minutes  
**Prerequisites**: Node.js 18+, Git, Claude Code with latest commands

## 📋 What You'll Learn

By the end of this tutorial, you'll have:
- ✅ Initialized the SPEK-AUGMENT template
- ✅ Created your first specification (SPEC.md)
- ✅ Generated structured tasks with `/spec:plan`
- ✅ Implemented a simple change with `/codex:micro`
- ✅ Verified quality with comprehensive QA gates
- ✅ Created an evidence-rich pull request

## 🚀 Step 1: Environment Setup

### Verify Prerequisites

```bash
# Check Node.js version (18+ required)
node --version
# Should show v18.x.x or higher

# Check Git is installed
git --version

# Verify Claude Code has latest slash commands
# In Claude Code, type: /spec:plan
# Should show autocomplete/recognition
```

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for analysis tools
pip install -e ./analyzer
pip install semgrep pip-audit

# Verify installations
npm test --version
npx semgrep --version
python -m analyzer.connascence_analyzer --help
```

✅ **Checkpoint**: All dependencies installed without errors

## 📝 Step 2: Create Your First Specification

Let's implement a simple utility function to demonstrate the workflow.

### Edit SPEC.md

Replace the template SPEC.md with this example:

```markdown
# Email Validation Utility

## Problem Statement
The application needs a robust email validation function that handles edge cases and provides clear error messages for invalid emails.

## Goals
- [ ] Goal 1: Create `validateEmail()` function with comprehensive validation
- [ ] Goal 2: Handle common edge cases (empty, malformed, invalid domains)
- [ ] Goal 3: Return structured validation results with error messages

## Non-Goals
- Email deliverability checking (DNS/SMTP validation)
- Internationalized domain name support

## Acceptance Criteria
- [ ] Function accepts string input and returns validation object
- [ ] Validates basic email format using RFC 5322 guidelines  
- [ ] Handles edge cases: null, undefined, empty string, whitespace
- [ ] Returns `{valid: boolean, error?: string}` structure
- [ ] Includes comprehensive test suite with 100% coverage

## Risks & Mitigations
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Regex complexity | Medium | Low | Use well-tested email regex pattern |
| Performance impact | Low | Low | Simple validation, no external calls |

## Verification Commands
```bash
npm test -- validateEmail.test.js
npm run typecheck
npm run lint
npm run coverage
```

## Dependencies
- [ ] TypeScript configuration for strict typing
- [ ] Jest testing framework setup

## Timeline
- **Phase 1**: Specification and planning (15 min)
- **Phase 2**: Implementation and testing (30 min)
- **Phase 3**: Quality verification and PR (15 min)
```

✅ **Checkpoint**: SPEC.md created with clear requirements

## 🎯 Step 3: Generate Structured Tasks

Now let's convert our human-readable spec into machine-executable tasks.

### Run `/spec:plan`

In Claude Code:

```bash
/spec:plan
```

**Expected Output**: Creates `plan.json` with structured task breakdown:

```json
{
  "goals": [
    "Create validateEmail() function with comprehensive validation",
    "Handle common edge cases with clear error messages",
    "Ensure 100% test coverage and type safety"
  ],
  "tasks": [
    {
      "id": "email-001",
      "title": "Create email validation utility function",
      "type": "small",
      "scope": "Implement validateEmail function in src/utils/validation.js",
      "verify_cmds": ["npm test -- validateEmail.test.js", "npm run typecheck"],
      "budget_loc": 25,
      "budget_files": 2,
      "acceptance": [
        "Function validates basic email format",
        "Handles null/undefined/empty inputs gracefully",
        "Returns structured {valid, error} object"
      ]
    },
    {
      "id": "email-002", 
      "title": "Add comprehensive test suite",
      "type": "small",
      "scope": "Create test file with edge cases and 100% coverage",
      "verify_cmds": ["npm run coverage", "npm test"],
      "budget_loc": 20,
      "budget_files": 1,
      "acceptance": [
        "Test suite covers all edge cases",
        "100% code coverage achieved", 
        "All tests pass consistently"
      ]
    }
  ],
  "risks": [
    {
      "type": "technical",
      "description": "Email regex complexity and maintenance",
      "impact": "medium",
      "mitigation": "Use established RFC 5322 regex pattern"
    }
  ]
}
```

### Review the Generated Plan

**Key Observations**:
- ✅ Tasks classified as "small" (suitable for `/codex:micro`)
- ✅ Budget constraints: ≤25 LOC, ≤2 files per task
- ✅ Clear acceptance criteria for each task
- ✅ Verification commands specified

✅ **Checkpoint**: plan.json generated with appropriate task breakdown

## 🔧 Step 4: Implement with `/codex:micro`

Now let's implement the first task using Codex's sandboxing capabilities.

### Create the Validation Function

```bash
/codex:micro 'Create validateEmail function in src/utils/validation.js that validates email format, handles edge cases (null/undefined/empty), and returns {valid: boolean, error?: string} structure'
```

**What Happens**:
1. **Sandbox Creation**: Codex creates isolated branch `codex/micro-[timestamp]`
2. **Implementation**: Writes function within 25 LOC budget
3. **Immediate Testing**: Runs tests, typecheck, lint in sandbox
4. **Verification**: Confirms all quality gates pass

**Expected Files Created/Modified**:
```javascript
// src/utils/validation.js
export function validateEmail(email) {
  // Handle edge cases
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email must be a non-empty string' };
  }
  
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: 'Email cannot be empty or whitespace' };
  }
  
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}
```

**Codex Output** (micro.json):
```json
{
  "execution": {
    "status": "success",
    "duration_seconds": 28,
    "sandbox_branch": "codex/micro-1709901900"
  },
  "changes": {
    "files_modified": [{
      "file": "src/utils/validation.js",
      "lines_added": 18,
      "functions_modified": ["validateEmail"]
    }],
    "within_budget": true
  },
  "quality_gates": {
    "tests": {"status": "pass"},
    "typecheck": {"status": "pass"}, 
    "lint": {"status": "pass"}
  },
  "recommendations": {
    "merge_confidence": "high",
    "deployment_risk": "none"
  }
}
```

✅ **Checkpoint**: Function implemented and passing all quality gates

## 🧪 Step 5: Add Comprehensive Tests

Now implement the test suite for complete coverage.

```bash
/codex:micro 'Create comprehensive test suite in src/utils/__tests__/validation.test.js for validateEmail function covering all edge cases: null, undefined, empty string, whitespace, invalid formats, and valid emails'
```

**Expected Test File**:
```javascript
// src/utils/__tests__/validation.test.js
import { validateEmail } from '../validation.js';

describe('validateEmail', () => {
  // Edge cases
  test('handles null input', () => {
    expect(validateEmail(null)).toEqual({
      valid: false, 
      error: 'Email must be a non-empty string'
    });
  });
  
  test('handles undefined input', () => {
    expect(validateEmail(undefined)).toEqual({
      valid: false,
      error: 'Email must be a non-empty string'
    });
  });
  
  // ... more comprehensive tests
  
  test('validates correct email format', () => {
    expect(validateEmail('user@example.com')).toEqual({
      valid: true
    });
  });
});
```

✅ **Checkpoint**: Test suite created with comprehensive coverage

## 🔍 Step 6: Run Comprehensive Quality Assurance

Let's verify everything meets our quality standards.

### Execute Full QA Suite

```bash
/qa:run
```

**QA Process**:
1. **Tests**: Jest execution with coverage analysis
2. **TypeScript**: Compilation and type checking
3. **Linting**: ESLint with security plugins
4. **Coverage**: Differential coverage on changed files
5. **Security**: Semgrep scan for vulnerabilities
6. **Architecture**: Connascence analysis

**Expected Output** (qa.json):
```json
{
  "timestamp": "2024-09-08T10:30:00Z",
  "overall_status": "pass",
  "results": {
    "tests": {
      "total": 8,
      "passed": 8, 
      "failed": 0,
      "coverage": {
        "changed_files_coverage": 100,
        "coverage_delta": "+2.1%"
      }
    },
    "typecheck": {
      "errors": 0,
      "warnings": 0
    },
    "lint": {
      "errors": 0,
      "warnings": 0
    },
    "security": {
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "connascence": {
      "nasa_compliance": 95.2,
      "duplication_score": 0.95
    }
  },
  "summary": {
    "risk_assessment": "low",
    "deployment_ready": true
  }
}
```

### Apply Quality Gates

```bash
/qa:gate
```

**Gate Evaluation**:
```json
{
  "ok": true,
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0,
    "critical_failures": 0
  },
  "recommendations": [
    "Code quality excellent - ready for deployment"
  ],
  "next_steps": {
    "if_passed": "Proceed to PR creation"
  }
}
```

✅ **Checkpoint**: All quality gates passing, ready for PR

## 📤 Step 7: Create Evidence-Rich Pull Request

Now let's create a professional PR with complete evidence package.

```bash
/pr:open main false false
```

**Generated PR Content**:

```markdown
# feat: Add email validation utility with comprehensive edge case handling

## 📋 Summary

**Feature**: Email validation utility function
**Business Value**: Robust input validation for user email addresses
**Technical Approach**: Simple utility with comprehensive error handling
**Risk Level**: 🟢 low

## 🏗️ Changes

### Files Modified
- **src/utils/validation.js** - New validateEmail function (18 lines)
- **src/utils/__tests__/validation.test.js** - Comprehensive test suite (45 lines)

### Implementation Details
- RFC 5322 compliant email validation
- Graceful handling of null/undefined/empty inputs
- Structured return format: `{valid: boolean, error?: string}`
- 100% test coverage with edge case handling

## 🧪 Quality Assurance

### Test Results
- **Tests**: 8/8 passing ✅
- **Coverage**: +2.1% ✅
- **Type Check**: ✅ Pass (0 errors)
- **Linting**: ✅ Pass (0 errors)

### Risk Assessment: 🟢 low

**Quality Metrics**:
- Test Coverage: 100% on changed files
- NASA POT10 Compliance: 95.2%
- Security Scan: Clean (0 findings)
- Code Duplication Score: 0.95

## 🔒 Security Assessment

### Security Scan Results
- **Critical**: 0 ✅
- **High**: 0 ✅  
- **Medium**: 0 ✅

### ✅ No security issues found

## 📊 Impact Analysis

### Files Changed
- **src/utils/validation.js** (new file) - Isolated utility function
- **src/utils/__tests__/validation.test.js** (new file) - Test coverage

### Dependencies
*No external dependencies or breaking changes*

### Recommended Approach: standard

## 🚀 Deployment

### Deployment Readiness
- ✅ All quality gates passed
- ✅ No breaking changes
- ✅ No configuration changes required
- ✅ Self-contained utility function

**Deployment Notes**: None - function is self-contained and backward compatible

## ✅ Pre-merge Checklist

- [x] All tests pass
- [x] Code coverage maintained/improved
- [x] No TypeScript errors
- [x] Linting passes
- [x] Security scan clear
- [ ] Code review completed
- [x] Breaking changes documented (N/A)

### Manual Verification Required:
- [ ] Code review completed
- [ ] Documentation updated if needed
- [ ] Deployment plan reviewed (if applicable)

---

🤖 Generated with SPEK-AUGMENT v1
📊 Evidence Package: qa.json, security.json, connascence.json
```

**PR Results**:
```json
{
  "pr_details": {
    "url": "https://github.com/your-org/project/pull/42",
    "title": "feat: Add email validation utility with comprehensive edge case handling",
    "labels_applied": ["feature", "risk:low", "size:small", "ready-for-review"]
  },
  "evidence_summary": {
    "quality_metrics": {"overall_status": "pass"},
    "security_assessment": {"total_findings": 0},
    "deployment_readiness": {"all_gates_passed": true}
  }
}
```

✅ **Checkpoint**: Professional PR created with complete evidence package

## 🎉 Congratulations!

You've successfully completed your first SPEK-AUGMENT workflow! Here's what you accomplished:

### ✅ What You Built
- **Specification**: Clear, structured requirements in SPEC.md
- **Implementation**: Email validation utility with error handling
- **Tests**: Comprehensive test suite with 100% coverage
- **Quality**: All gates passing (tests, types, lint, security)
- **Documentation**: Evidence-rich PR ready for review

### 🎯 Key Learnings

1. **SPEK Workflow**: Specification → Planning → Implementation → Verification → Delivery
2. **Command Progression**: `/spec:plan` → `/codex:micro` → `/qa:run` → `/pr:open`
3. **Quality Gates**: Automated verification ensures consistent quality
4. **Evidence-Based PRs**: Complete audit trail for every change
5. **Safety Constraints**: Bounded operations prevent runaway changes

### 📈 Quality Metrics Achieved
- ✅ 100% test pass rate
- ✅ 100% test coverage on changed files
- ✅ Zero TypeScript errors
- ✅ Zero linting errors
- ✅ Zero security vulnerabilities
- ✅ 95.2% NASA POT10 compliance

## 🚀 Next Steps

Now that you understand the basics, explore more advanced workflows:

### Immediate Next Steps
1. **Review and merge your PR** - Get team feedback on the evidence package
2. **Try a bug fix** - Use the same workflow to fix an existing issue
3. **Explore `/qa:analyze`** - Learn intelligent failure routing

### Advanced Learning Path
1. **[Complex Workflow](complex-workflow.md)** - Multi-file changes with `/fix:planned`
2. **[Security Scanning](security-scanning.md)** - Deep-dive into OWASP compliance
3. **[Architecture Changes](workflows/architecture-migration.md)** - Large-scale refactoring

### Workflow Variations to Try
```bash
# Bug fix workflow
/qa:run                 # Identify issue
/qa:analyze            # Get fix routing
/codex:micro-fix       # Apply surgical fix

# Complex feature workflow  
/spec:plan             # Plan multi-task feature
/gemini:impact         # Assess architectural impact
/fix:planned           # Implement with checkpoints

# Security-first workflow
/sec:scan full         # Comprehensive security scan
/conn:scan             # Architecture quality check
/qa:gate              # Apply all quality thresholds
```

## 🔧 Troubleshooting

If you encountered any issues during this tutorial:

- **Command not found**: Update Claude Code to latest version with all 17 commands
- **Quality gate failures**: Run `/qa:analyze` for specific fix guidance
- **Sandbox conflicts**: Ensure clean working tree with `git status`
- **Performance issues**: Use `scope=changed` for large codebases

See [troubleshooting.md](troubleshooting.md) for comprehensive issue resolution.

## 💡 Pro Tips

1. **Start Small**: Always begin with `/codex:micro` - it will suggest escalation if needed
2. **Trust the Gates**: Quality gates prevent issues - don't skip them
3. **Use Analysis**: `/qa:analyze` provides intelligent routing - follow its recommendations  
4. **Evidence Matters**: Rich PRs with evidence packages improve review quality
5. **Iterate Safely**: Sandbox execution means you can experiment without risk

---

**Ready for more?** 🚀 Choose your next adventure:
- **Simple changes**: Continue with [Basic Workflow](basic-workflow.md)
- **Complex features**: Try [Complex Workflow](complex-workflow.md)
- **Team integration**: Explore [Project Management](project-management.md)

*Welcome to the future of AI-driven development!* ✨
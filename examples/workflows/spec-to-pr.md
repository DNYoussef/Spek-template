# Complete SPEC → PR Workflow

**Scenario**: Implement a complete feature from specification to pull request  
**Time**: 45-90 minutes  
**Complexity**: Intermediate  
**Commands Used**: `/spec:plan`, `/gemini:impact`, `/fix:planned`, `/qa:run`, `/qa:gate`, `/pr:open`

## 🎯 Workflow Overview

This workflow demonstrates the complete SPEK-AUGMENT cycle:

```mermaid
graph LR
    A[SPEC.md] --> B[/spec:plan]
    B --> C[/gemini:impact]
    C --> D[/fix:planned]
    D --> E[/qa:run]
    E --> F[/qa:gate]
    F --> G[/pr:open]
```

## 📋 Example: User Authentication System

Let's implement JWT token authentication with middleware integration.

### Step 1: Create Specification

**SPEC.md**:
```markdown
# JWT Authentication System

## Problem Statement
The application needs secure user authentication using JWT tokens with proper session management and middleware integration.

## Goals
- [ ] Implement JWT token generation and validation
- [ ] Create authentication middleware for route protection
- [ ] Add token refresh mechanism
- [ ] Ensure secure token storage practices

## Acceptance Criteria
- [ ] JWT tokens generated with configurable expiry
- [ ] Middleware validates tokens on protected routes
- [ ] Token refresh endpoint for seamless UX
- [ ] Security scan passes with zero high/critical findings
- [ ] 100% test coverage on auth functionality

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| JWT secret exposure | High | Environment variables only |
| Token replay attacks | Medium | Short expiry + refresh flow |
| Session hijacking | Medium | Secure HTTP-only cookies |
```

### Step 2: Generate Structured Plan

```bash
/spec:plan
```

**Generated plan.json**:
```json
{
  "goals": [
    "Implement JWT token generation and validation system",
    "Create secure middleware for route protection",
    "Add token refresh mechanism for seamless UX"
  ],
  "tasks": [
    {
      "id": "auth-001",
      "title": "Create JWT utilities and token management",
      "type": "multi",
      "scope": "JWT generation, validation, and refresh logic",
      "verify_cmds": ["npm test -- auth.test.js", "npm run security-scan"],
      "budget_loc": 75,
      "budget_files": 3
    },
    {
      "id": "auth-002", 
      "title": "Implement authentication middleware",
      "type": "multi",
      "scope": "Route protection and token validation middleware",
      "verify_cmds": ["npm test -- middleware.test.js"],
      "budget_loc": 50,
      "budget_files": 2
    },
    {
      "id": "auth-003",
      "title": "Add token refresh endpoint",
      "type": "small",
      "scope": "API endpoint for token renewal",
      "verify_cmds": ["npm test -- refresh.test.js"],
      "budget_loc": 25,
      "budget_files": 2
    }
  ]
}
```

### Step 3: Analyze Impact with Gemini

```bash
/gemini:impact 'Implement JWT authentication system with middleware integration across multiple API routes and user management components'
```

**Gemini Analysis** (impact.json):
```json
{
  "hotspots": [
    {
      "file": "src/middleware/auth.js",
      "reason": "Core authentication logic - high impact changes",
      "impact_level": "high",
      "change_type": "implementation"
    },
    {
      "file": "src/routes/api.js",
      "reason": "All API routes need middleware integration", 
      "impact_level": "high",
      "change_type": "interface"
    }
  ],
  "callers": [
    {
      "caller_file": "src/routes/user.js",
      "target_file": "src/middleware/auth.js",
      "function_name": "requireAuth",
      "risk_level": "medium"
    }
  ],
  "riskAssessment": {
    "overall_risk": "medium",
    "complexity_score": 7,
    "recommended_approach": "incremental",
    "coordination_complexity": "medium"
  }
}
```

**Key Insights**:
- Medium risk due to cross-cutting middleware changes
- Incremental approach recommended
- Multiple files affected but manageable scope

### Step 4: Implement with Planned Approach

```bash
/fix:planned 'Implement JWT authentication system with token generation, validation middleware, and refresh mechanism across multiple components'
```

**Execution Strategy**:

#### Checkpoint 1: Core JWT Utilities
**Files**: `src/utils/jwt.js`, `src/utils/auth.js`
**Budget**: 45 LOC

```javascript
// src/utils/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || '7d';

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

export function validateToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**Checkpoint Result**: ✅ Pass (tests pass, types check, lint clean)

#### Checkpoint 2: Authentication Middleware
**Files**: `src/middleware/auth.js`
**Budget**: 30 LOC

```javascript
// src/middleware/auth.js
import { validateToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = validateToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Checkpoint Result**: ✅ Pass (middleware tests pass)

#### Checkpoint 3: Token Refresh Endpoint
**Files**: `src/routes/auth.js`
**Budget**: 25 LOC

```javascript
// src/routes/auth.js
import { generateTokens, validateToken } from '../utils/jwt.js';

export async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  try {
    const decoded = validateToken(refreshToken);
    const newTokens = generateTokens({ userId: decoded.userId, email: decoded.email });
    
    res.json({ 
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}
```

**Final Checkpoint**: ✅ All checkpoints completed successfully

**planned-fix.json Summary**:
```json
{
  "execution_summary": {
    "overall_status": "success",
    "checkpoints_completed": 3,
    "checkpoints_failed": 0,
    "total_duration_seconds": 145,
    "total_loc_modified": 98
  },
  "quality_validation": {
    "final_test_run": {"status": "pass", "total": 24, "passed": 24, "failed": 0},
    "comprehensive_typecheck": {"status": "pass", "errors": 0},
    "full_lint_check": {"status": "pass", "errors": 0}
  }
}
```

### Step 5: Comprehensive Quality Assurance

```bash
/qa:run
```

**QA Results** (qa.json):
```json
{
  "overall_status": "pass",
  "results": {
    "tests": {
      "total": 24,
      "passed": 24,
      "failed": 0,
      "coverage": {"changed_files_coverage": 95.8, "coverage_delta": "+3.2%"}
    },
    "typecheck": {"errors": 0, "warnings": 1},
    "lint": {"errors": 0, "warnings": 2, "fixable": 2},
    "security": {"high": 0, "medium": 1, "low": 2},
    "connascence": {"nasa_compliance": 91.5, "duplication_score": 0.78}
  },
  "summary": {"risk_assessment": "low", "deployment_ready": true}
}
```

### Step 6: Apply Quality Gates

```bash
/qa:gate
```

**Gate Decision** (gate.json):
```json
{
  "ok": true,
  "summary": {"total": 6, "passed": 6, "failed": 0, "critical_failures": 0},
  "gates": {
    "tests": {"passed": true, "message": "✅ All tests pass"},
    "typecheck": {"passed": true, "message": "✅ TypeScript compilation clean"},
    "security": {"passed": true, "message": "✅ No critical security issues"},
    "coverage": {"passed": true, "message": "✅ Coverage improved"}
  },
  "recommendations": [
    "Code quality excellent - ready for deployment",
    "Consider addressing 1 medium security finding (non-blocking)",
    "Fix 2 auto-fixable linting warnings"
  ]
}
```

### Step 7: Create Evidence-Rich Pull Request

```bash
/pr:open main false false
```

**Generated PR**:

```markdown
# feat: Implement JWT authentication system with middleware integration

## 📋 Summary

**Feature**: Complete JWT authentication system
**Business Value**: Secure user authentication with token-based session management
**Technical Approach**: JWT utilities + middleware + refresh mechanism
**Risk Level**: 🟡 medium (cross-cutting middleware changes)

## 🏗️ Implementation Details

### Files Added/Modified
- **src/utils/jwt.js** - JWT generation and validation utilities (28 lines)
- **src/utils/auth.js** - Authentication helper functions (15 lines)
- **src/middleware/auth.js** - Route protection middleware (22 lines) 
- **src/routes/auth.js** - Token refresh endpoint (18 lines)
- **tests/** - Comprehensive test suite (95 lines)

### Key Features
- 🔐 JWT token generation with configurable expiry
- 🛡️ Authentication middleware for route protection
- 🔄 Token refresh mechanism for seamless UX
- ⚡ Environment-based configuration
- 🧪 100% test coverage on auth functionality

## 🧪 Quality Assurance

### Test Results
- **Tests**: 24/24 passing ✅
- **Coverage**: +3.2% improvement ✅ (95.8% on changed files)
- **Type Check**: ✅ Pass (0 errors, 1 warning)
- **Linting**: ✅ Pass (0 errors, 2 fixable warnings)

### Risk Assessment: 🟢 low (post-implementation)

**Quality Metrics**:
- NASA POT10 Compliance: 91.5% ✅
- Code Duplication Score: 0.78 ✅
- Security Compliance: 1 medium finding (non-blocking) ⚠️
- Performance Impact: Minimal (middleware overhead <1ms)

## 🎯 Impact Analysis

### Architectural Changes
- **Cross-cutting**: Authentication middleware affects all protected routes
- **Dependencies**: New JWT library dependency added
- **Configuration**: Requires JWT_SECRET environment variable
- **Breaking Changes**: None - additive functionality only

### Files Impacted
- **High Impact**: `src/middleware/auth.js` (new auth logic)
- **Medium Impact**: `src/routes/api.js` (middleware integration points)
- **Low Impact**: Utility files (isolated functionality)

### Risk Mitigation Applied
- ✅ Incremental implementation with checkpoints
- ✅ Comprehensive test coverage (100%)
- ✅ Environment-based secret management
- ✅ Token expiry and refresh mechanism

## 🔒 Security Assessment

### Security Scan Results
- **Critical**: 0 ✅
- **High**: 0 ✅
- **Medium**: 1 ⚠️ (JWT secret in development mode)
- **Low**: 2 ℹ️ (informational)

### Security Best Practices Applied
- 🔐 Environment-based secret management
- ⏰ Configurable token expiry
- 🍪 Secure HTTP-only cookie support ready
- 🛡️ Input validation on all auth endpoints
- 🔄 Token refresh mechanism prevents long-lived tokens

### Medium Security Finding
**Issue**: Development fallback secret detected  
**Impact**: Low (development only, documented in code)  
**Resolution**: Ensure JWT_SECRET is set in production environments

## 🚀 Deployment

### Configuration Required
```bash
# Environment Variables
JWT_SECRET=your-secure-secret-here
JWT_EXPIRY=24h
REFRESH_EXPIRY=7d
```

### Database Changes
- None required (stateless JWT implementation)

### Deployment Steps
1. Set environment variables
2. Deploy application
3. Verify `/auth/refresh` endpoint responds
4. Test protected routes with valid tokens

### Rollback Plan
- Remove authentication middleware from routes
- Revert to previous authentication method
- No data migration required

## ✅ Pre-merge Checklist

- [x] All tests pass (24/24)
- [x] Code coverage maintained/improved (+3.2%)
- [x] No TypeScript errors (0 errors)
- [x] Linting passes (0 errors, 2 fixable warnings)
- [x] Security scan acceptable (0 critical/high)
- [ ] Code review completed
- [x] Environment configuration documented
- [x] Deployment plan reviewed

### Manual Verification Required:
- [ ] Code review by security team (JWT implementation)
- [ ] Integration testing in staging environment
- [ ] Performance testing under load
- [ ] Environment variables configured in production

### Automated Checks Status
- ✅ CI/CD pipeline passes
- ✅ Security gates met
- ✅ Quality gates passed
- ✅ Integration tests pass

---

🤖 Generated with SPEK-AUGMENT v1  
📊 Evidence Package: qa.json, impact.json, planned-fix.json, security.json  
🔗 Workflow: SPEC → Planning → Impact Analysis → Implementation → QA → Gates → PR
```

## 📊 Workflow Results

### ✅ Success Metrics
- **Implementation Time**: 145 seconds (automated)
- **Quality Score**: 91.5% NASA POT10 compliance
- **Test Coverage**: 95.8% on changed files
- **Security Posture**: 0 critical/high findings
- **Code Quality**: 0 errors, minimal warnings

### 📈 Value Delivered
- **Feature Complete**: JWT authentication system fully implemented
- **Quality Assured**: All gates passed with comprehensive testing
- **Security Verified**: OWASP compliance with documented findings
- **Evidence Rich**: Complete audit trail for review and compliance
- **Deployment Ready**: Configuration documented, rollback plan provided

### 🎯 Lessons Learned

1. **Impact Analysis Value**: Gemini's analysis correctly identified risk level and approach
2. **Checkpoint Safety**: Planned approach with rollback points prevented issues
3. **Quality Gates**: Automated verification caught issues before PR creation
4. **Evidence Package**: Rich documentation improved review efficiency
5. **Risk Mitigation**: Incremental approach made complex changes manageable

## 🔄 Workflow Variations

### For Higher Risk Changes
```bash
/gemini:impact           # Always start with impact analysis
/fix:planned             # Use checkpointed approach
/sec:scan full           # Full security scan
/conn:scan full         # Complete architectural analysis
```

### For Simpler Changes
```bash
/spec:plan              # Still plan systematically
/codex:micro            # Use for small, isolated changes
/qa:run                 # Always verify quality
```

### For Security-Critical Changes
```bash
/spec:plan
/sec:scan full          # Security analysis first
/gemini:impact          # Understand security implications
/fix:planned            # Careful, checkpointed implementation
/sec:scan full          # Re-scan after implementation
/pr:open                # Evidence-rich security review
```

---

**Next Steps**: Try this workflow with your own feature specification, or explore [complex-workflow.md](../complex-workflow.md) for architectural changes.
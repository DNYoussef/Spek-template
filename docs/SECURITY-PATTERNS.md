# Security Patterns - Quick Reference

**CRITICAL**: Always validate and sanitize user input to prevent injection attacks.

---

## CWE-78: OS Command Injection Prevention

### ❌ DON'T
```bash
# VULNERABLE - Never use eval with user input
eval "result=$(cat $USER_FILE)"

# VULNERABLE - Shell metacharacters allow arbitrary commands
command="ls $USER_INPUT"
eval $command
```

### ✅ DO
```bash
# Safe: Validate input first
if [[ -f "$USER_FILE" && -r "$USER_FILE" ]]; then
  result=$(cat "$USER_FILE")
else
  echo "Error: Invalid file" >&2
  exit 1
fi

# Safe: Use whitelist pattern
if [[ ! "$USER_INPUT" =~ ^[a-zA-Z0-9/_.-]+$ ]]; then
  echo "Error: Invalid input format" >&2
  exit 1
fi
```

### JavaScript Pattern
```javascript
const { validateFilePath } = require('./tests/security/security-validators');

// Validate before using in commands
try {
  const safePath = validateFilePath(userInput);
  // Now safe to use safePath
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

---

## CWE-88: Argument Injection & Path Traversal

### ❌ DON'T
```python
# VULNERABLE - Path traversal possible
path = user_input
data = open(path).read()

# VULNERABLE - No directory containment
os.path.join('/base', user_path)  # Can escape with ../../../
```

### ✅ DO
```python
import os
from pathlib import Path

def safe_path(user_path, allowed_base):
    # Resolve to absolute path
    base = Path(allowed_base).resolve()
    requested = Path(user_path).resolve()

    # Check containment
    if not str(requested).startswith(str(base)):
        raise ValueError(f"Path must be within {allowed_base}")

    return requested

# Usage
try:
    safe_file = safe_path(user_input, '/allowed/directory')
    with open(safe_file) as f:
        data = f.read()
except ValueError as e:
    print(f"Security violation: {e}")
```

### JavaScript Pattern
```javascript
const { validatePath } = require('./tests/security/security-validators');

// Validate with directory restriction
try {
  const safePath = validatePath(userInput, '/allowed/base');
  // Now safe to use safePath
} catch (error) {
  console.error('Path validation failed:', error.message);
}
```

---

## CWE-917: Expression Language Injection

### ❌ DON'T
```python
# VULNERABLE - Arbitrary code execution
result = eval(user_expression)

# VULNERABLE - exec() is equally dangerous
exec(user_code)
```

### ✅ DO
```python
import ast
import json

def safe_eval(expression):
    # Option 1: JSON parsing (safest)
    try:
        return json.loads(expression)
    except json.JSONDecodeError:
        pass

    # Option 2: ast.literal_eval (literals only)
    try:
        return ast.literal_eval(expression)
    except (ValueError, SyntaxError) as e:
        raise ValueError(f"Invalid expression: {e}")

# Usage
try:
    result = safe_eval(user_input)
except ValueError as e:
    print(f"Invalid expression: {e}")
```

### JavaScript Pattern
```javascript
const { safeEval } = require('./tests/security/security-validators');

// Safe evaluation with restrictions
try {
  const result = safeEval(userExpression);
  console.log('Result:', result);
} catch (error) {
  console.error('Expression validation failed:', error.message);
}
```

---

## CWE-95: Code Injection Prevention

### ❌ DON'T
```javascript
// VULNERABLE - Dynamic require with user input
const module = require(user_provided_path);

// VULNERABLE - Function constructor
const fn = new Function(user_code);
```

### ✅ DO
```javascript
// Static whitelist of allowed modules
const ALLOWED_MODULES = {
  'gemini': './models/gemini',
  'gpt5': './models/gpt5',
  'claude': './models/claude'
};

function loadModel(modelName) {
  const sanitized = modelName.toLowerCase().trim();

  if (!ALLOWED_MODULES.hasOwnProperty(sanitized)) {
    const allowed = Object.keys(ALLOWED_MODULES).join(', ');
    throw new Error(`Unknown model. Allowed: ${allowed}`);
  }

  // Safe: static path from whitelist
  return require(ALLOWED_MODULES[sanitized]);
}

// Usage
try {
  const model = loadModel(userInput);
} catch (error) {
  console.error('Model loading failed:', error.message);
}
```

---

## Input Validation Checklist

### Before Processing User Input:

1. **Type Validation**
   ```javascript
   if (typeof input !== 'string') {
     throw new Error('Input must be a string');
   }
   ```

2. **Length Limits**
   ```javascript
   if (input.length > 4096) {
     throw new Error('Input exceeds maximum length');
   }
   ```

3. **Null Byte Prevention**
   ```javascript
   if (input.includes('\u0000') || input.includes('\x00')) {
     throw new Error('Null byte injection detected');
   }
   ```

4. **Whitelist Pattern**
   ```javascript
   const safePattern = /^[a-zA-Z0-9\/_.\-]+$/;
   if (!safePattern.test(input)) {
     throw new Error('Input contains unsafe characters');
   }
   ```

5. **Context-Specific Validation**
   - File paths: Check directory containment
   - Commands: Block shell metacharacters
   - Expressions: Use AST parsing
   - Modules: Whitelist allowed imports

---

## Pre-Commit Hook

### Automatic Security Validation

The pre-commit hook automatically checks for security issues:

```bash
# Runs automatically on every commit
git commit -m "feature: add new functionality"

# Hook checks:
# ✓ Dangerous code patterns
# ✓ Hardcoded secrets
# ✓ Semgrep security rules
# ✓ File permissions
```

### To Run Manually:
```bash
./.husky/pre-commit-security
```

### To Bypass (NOT RECOMMENDED):
```bash
git commit --no-verify
```

---

## Security Audit

### Run Comprehensive Security Scan:
```bash
./scripts/security-audit.sh
```

### Output:
- `.claude/.artifacts/security-audit-report.json`
- `.claude/.artifacts/semgrep-security.sarif`

### What It Checks:
- CWE-78: Command injection patterns
- CWE-88: Path traversal vulnerabilities
- CWE-917: Expression injection risks
- CWE-95: Code injection vectors
- Semgrep security rules
- Hardcoded secrets

---

## Security Testing

### Run Security Test Suite:
```bash
npm test -- tests/security/vulnerability-tests.test.js
```

### Test Coverage:
```bash
npm test -- tests/security/vulnerability-tests.test.js --coverage
```

### Expected Results:
- 22/22 tests passing
- 92%+ code coverage
- Zero security violations

---

## Common Attack Patterns to Block

### Shell Metacharacters:
```
; & | ` $ ( ) < > \n \r
```

### Path Traversal:
```
../../../etc/passwd
..\\..\\..\\windows\\system32
```

### Python Code Injection:
```python
__import__('os').system('rm -rf /')
exec('malicious code')
__builtins__['eval']('danger')
```

### JavaScript Code Injection:
```javascript
require('../../../evil/module')
new Function('malicious code')
eval('danger')
```

---

## Security Configuration

### Location: `tests/security/security-config.js`

```javascript
module.exports = {
  allowDynamicRequire: false,  // Block require(userInput)
  allowEval: false,             // Block eval(userInput)
  sanitizeInputs: true,         // Enable input sanitization
  maxInputLength: 4096,         // Prevent DoS via large inputs

  // Protection flags
  enablePathTraversalProtection: true,
  enableCommandInjectionProtection: true,
  enableCodeInjectionProtection: true
};
```

---

## Emergency Response

### If Security Issue Detected:

1. **Immediate**: Stop deployment
2. **Investigate**: Review `.claude/.artifacts/security-audit-report.json`
3. **Fix**: Apply security validators from this guide
4. **Test**: Run `npm test -- tests/security/`
5. **Verify**: Run `./scripts/security-audit.sh`
6. **Document**: Update this guide with new patterns

---

## References

- **CWE-78**: [OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- **CWE-88**: [Argument Injection](https://cwe.mitre.org/data/definitions/88.html)
- **CWE-917**: [Expression Language Injection](https://cwe.mitre.org/data/definitions/917.html)
- **CWE-95**: [Code Injection](https://cwe.mitre.org/data/definitions/95.html)
- **OWASP Top 10**: [2021 Edition](https://owasp.org/Top10/)

---

**Remember**: When in doubt, validate! Never trust user input.
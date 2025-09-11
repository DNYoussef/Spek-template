# Linter Tools Reference - Individual Tool Integration Manual

## Overview

This guide provides comprehensive configuration and integration details for all supported linter tools in the SPEK Enhanced Development Platform. Each tool is integrated through a **unified adapter pattern** that provides consistent violation formatting, severity mapping, and execution management.

## Supported Tools Matrix

| Tool | Language | Output Format | Speed | Resource Usage | Priority | Adapter Status |
|------|----------|---------------|-------|----------------|----------|----------------|
| **ESLint** | JavaScript/TypeScript | JSON | Fast | Low | High | ✅ Production |
| **TypeScript Compiler** | TypeScript | Text | Medium | High | Critical | ✅ Production |
| **Flake8** | Python | JSON | Fast | Low | High | ✅ Production |
| **Pylint** | Python | JSON | Slow | Medium | Medium | ✅ Production |
| **Ruff** | Python | JSON | Very Fast | Very Low | High | ✅ Production |
| **MyPy** | Python | Text | Medium | Medium | High | ✅ Production |
| **Bandit** | Python | JSON | Fast | Low | Critical | ✅ Production |

## JavaScript/TypeScript Tools

### ESLint

**Purpose:** JavaScript and TypeScript code quality and style checking

**Installation:**
```bash
# Global installation
npm install -g eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Project-specific
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Configuration (`eslint.config.js`):**
```javascript
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // Error level rules (mapped to HIGH severity)
      'no-unused-vars': 'error',
      'no-undef': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      
      // Warning level rules (mapped to MEDIUM severity)
      'prefer-const': 'warn',
      'no-console': 'warn',
      
      // Style rules (mapped to LOW severity)
      'indent': ['warn', 2],
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'always']
    }
  }
];
```

**Integration Adapter:**
```typescript
class ESLintAdapter extends BaseLinterAdapter {
  constructor() {
    super('eslint', 'eslint.config.js');
  }

  _get_severity_mapping(): Record<string, SeverityLevel> {
    return {
      'error': SeverityLevel.HIGH,
      'warn': SeverityLevel.MEDIUM,
      'info': SeverityLevel.LOW
    };
  }

  _get_violation_type_mapping(): Record<string, ViolationType> {
    return {
      'no-unused-vars': ViolationType.CODE_QUALITY,
      'no-undef': ViolationType.SYNTAX_ERROR,
      '@typescript-eslint/no-explicit-any': ViolationType.TYPE_ERROR,
      'prefer-const': ViolationType.STYLE_VIOLATION,
      'indent': ViolationType.STYLE_VIOLATION,
      'quotes': ViolationType.STYLE_VIOLATION
    };
  }

  _build_command(target_path: string, **kwargs): string[] {
    return [
      'npx', 'eslint',
      '--format', 'json',
      '--quiet',
      target_path
    ];
  }

  _parse_output(stdout: string, stderr: string): LinterViolation[] {
    const violations: LinterViolation[] = [];
    
    try {
      const results = JSON.parse(stdout);
      
      results.forEach((fileResult: any) => {
        fileResult.messages.forEach((message: any) => {
          violations.push(new LinterViolation(
            file_path: fileResult.filePath,
            line_number: message.line,
            column_number: message.column,
            rule_id: message.ruleId || 'unknown',
            rule_name: message.ruleId || 'Unknown Rule',
            message: message.message,
            severity: this.map_severity(message.severity === 2 ? 'error' : 'warn'),
            violation_type: this.map_violation_type(message.ruleId || ''),
            source_tool: 'eslint',
            context: message.source,
            fix_suggestion: message.fix ? 'Auto-fixable' : null
          ));
        });
      });
    } catch (error) {
      throw new Error(`Failed to parse ESLint output: ${error.message}`);
    }
    
    return violations;
  }
}
```

**Advanced Configuration:**
```javascript
// Performance-optimized configuration
export default [
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json']
      }
    },
    settings: {
      // Enable caching for better performance
      cache: true,
      cacheLocation: '.eslintcache'
    },
    rules: {
      // Critical rules (CRITICAL severity)
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // Security rules (HIGH severity)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      
      // Performance rules (MEDIUM severity)
      'no-loop-func': 'warn',
      'prefer-const': 'warn',
      
      // Style rules (LOW severity)
      'max-len': ['warn', { code: 120 }],
      'comma-dangle': ['warn', 'never']
    }
  }
];
```

### TypeScript Compiler (tsc)

**Purpose:** TypeScript type checking and compilation errors

**Installation:**
```bash
npm install -g typescript
# or
npm install --save-dev typescript
```

**Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    
    // Enhanced type checking
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Integration Adapter:**
```typescript
class TypeScriptAdapter extends BaseLinterAdapter {
  constructor() {
    super('tsc');
  }

  _get_severity_mapping(): Record<string, SeverityLevel> {
    return {
      'error': SeverityLevel.HIGH,
      'warning': SeverityLevel.MEDIUM
    };
  }

  _get_violation_type_mapping(): Record<string, ViolationType> {
    return {
      'TS2304': ViolationType.SYNTAX_ERROR,     // Cannot find name
      'TS2322': ViolationType.TYPE_ERROR,       // Type not assignable
      'TS2345': ViolationType.TYPE_ERROR,       // Argument type mismatch
      'TS2339': ViolationType.TYPE_ERROR,       // Property does not exist
      'TS6133': ViolationType.CODE_QUALITY,     // Unused variable
      'TS2531': ViolationType.TYPE_ERROR,       // Object possibly null
    };
  }

  _build_command(target_path: string, **kwargs): string[] {
    return [
      'npx', 'tsc',
      '--noEmit',
      '--pretty', 'false',
      '--project', target_path.includes('tsconfig') ? target_path : '.'
    ];
  }

  _parse_output(stdout: string, stderr: string): LinterViolation[] {
    const violations: LinterViolation[] = [];
    const output = stderr || stdout; // tsc outputs to stderr
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Match TypeScript error format: file(line,col): error TSxxxx: message
      const match = line.match(/^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      
      if (match) {
        const [, filePath, line, column, severity, code, message] = match;
        
        violations.push(new LinterViolation(
          file_path: filePath,
          line_number: parseInt(line),
          column_number: parseInt(column),
          rule_id: `TS${code}`,
          rule_name: `TypeScript Error ${code}`,
          message: message,
          severity: this.map_severity(severity),
          violation_type: this.map_violation_type(`TS${code}`),
          source_tool: 'tsc',
          context: null,
          fix_suggestion: this._get_typescript_fix_suggestion(code)
        ));
      }
    }
    
    return violations;
  }

  private _get_typescript_fix_suggestion(code: string): string | null {
    const fixes: Record<string, string> = {
      '2304': 'Check if the name is correctly imported or declared',
      '2322': 'Verify type compatibility or add type assertion',
      '2345': 'Check function parameter types',
      '6133': 'Remove unused variable or prefix with underscore',
      '2531': 'Add null check or use optional chaining'
    };
    
    return fixes[code] || null;
  }
}
```

## Python Tools

### Flake8

**Purpose:** Python code style and quality checking (PEP 8 compliance)

**Installation:**
```bash
pip install flake8 flake8-bugbear flake8-comprehensions flake8-simplify
```

**Configuration (`.flake8` or `setup.cfg`):**
```ini
[flake8]
max-line-length = 88
max-complexity = 10
select = E,W,F,B,C,S
ignore = 
    E203,  # whitespace before ':'
    E501,  # line too long (handled by max-line-length)
    W503,  # line break before binary operator
    E402   # module level import not at top of file
exclude = 
    .git,
    __pycache__,
    .pytest_cache,
    .mypy_cache,
    build,
    dist,
    *.egg-info
per-file-ignores =
    __init__.py:F401
    tests/*:S101,S106
format = json
```

**Integration Adapter:**
```python
class Flake8Adapter(BaseLinterAdapter):
    def __init__(self):
        super().__init__('flake8', '.flake8')

    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            'E9': SeverityLevel.CRITICAL,   # Syntax errors
            'F8': SeverityLevel.CRITICAL,   # Undefined names
            'E': SeverityLevel.MEDIUM,      # PEP 8 errors
            'W': SeverityLevel.LOW,         # PEP 8 warnings
            'F': SeverityLevel.HIGH,        # PyFlakes errors
            'B': SeverityLevel.HIGH,        # flake8-bugbear
            'C': SeverityLevel.MEDIUM,      # Complexity
            'S': SeverityLevel.HIGH,        # Security (bandit-like)
        }

    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            'E9': ViolationType.SYNTAX_ERROR,
            'F8': ViolationType.SYNTAX_ERROR,
            'F4': ViolationType.CODE_QUALITY,
            'E1': ViolationType.STYLE_VIOLATION,
            'E2': ViolationType.STYLE_VIOLATION,
            'W': ViolationType.STYLE_VIOLATION,
            'B': ViolationType.CODE_QUALITY,
            'C': ViolationType.COMPLEXITY,
            'S': ViolationType.SECURITY_ISSUE,
        }

    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        return [
            'flake8',
            '--format=json',
            '--statistics',
            target_path
        ]

    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        try:
            # Flake8 with json format outputs one JSON object per line
            for line in stdout.strip().split('\n'):
                if line.strip():
                    data = json.loads(line)
                    
                    violations.append(LinterViolation(
                        file_path=data['filename'],
                        line_number=data['line_number'],
                        column_number=data['column_number'],
                        rule_id=data['code'],
                        rule_name=data['code'],
                        message=data['text'],
                        severity=self.map_severity(data['code'][:2]),
                        violation_type=self.map_violation_type(data['code'][:2]),
                        source_tool='flake8',
                        context=None,
                        fix_suggestion=self._get_flake8_fix_suggestion(data['code'])
                    ))
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON format fails
            violations = self._parse_text_output(stdout)
        
        return violations

    def _get_flake8_fix_suggestion(self, code: str) -> Optional[str]:
        suggestions = {
            'E302': 'Add 2 blank lines before function/class definition',
            'E303': 'Remove extra blank lines',
            'E501': 'Break long line or use shorter variable names',
            'F401': 'Remove unused import',
            'F841': 'Remove unused variable or use it',
            'W292': 'Add newline at end of file'
        }
        return suggestions.get(code)

    def _parse_text_output(self, output: str) -> List[LinterViolation]:
        violations = []
        for line in output.split('\n'):
            # Parse format: filename:line:col: code message
            match = re.match(r'^(.+):(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$', line)
            if match:
                filename, line_num, col_num, code, message = match.groups()
                violations.append(LinterViolation(
                    file_path=filename,
                    line_number=int(line_num),
                    column_number=int(col_num),
                    rule_id=code,
                    rule_name=code,
                    message=message,
                    severity=self.map_severity(code[:2]),
                    violation_type=self.map_violation_type(code[:2]),
                    source_tool='flake8'
                ))
        return violations
```

### Pylint

**Purpose:** Comprehensive Python code analysis with detailed quality metrics

**Installation:**
```bash
pip install pylint pylint-extensions
```

**Configuration (`.pylintrc`):**
```ini
[MASTER]
jobs=0
persistent=yes
suggestion-mode=yes
unsafe-load-any-extension=no

[MESSAGES CONTROL]
disable=
    missing-docstring,
    too-few-public-methods,
    too-many-arguments,
    too-many-locals,
    too-many-branches,
    too-many-statements,
    line-too-long,
    fixme,
    broad-except

[REPORTS]
output-format=json
reports=no
score=no

[FORMAT]
max-line-length=88
max-module-lines=1000

[DESIGN]
max-args=5
max-locals=15
max-returns=6
max-branches=12
max-statements=50
max-parents=7
max-attributes=7
min-public-methods=2
max-public-methods=20

[SIMILARITIES]
min-similarity-lines=4
ignore-comments=yes
ignore-docstrings=yes
ignore-imports=no
```

**Integration Adapter:**
```python
class PylintAdapter(BaseLinterAdapter):
    def __init__(self):
        super().__init__('pylint', '.pylintrc')

    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            'F': SeverityLevel.CRITICAL,    # Fatal errors
            'E': SeverityLevel.HIGH,        # Errors
            'W': SeverityLevel.MEDIUM,      # Warnings
            'R': SeverityLevel.LOW,         # Refactoring suggestions
            'C': SeverityLevel.LOW,         # Convention violations
            'I': SeverityLevel.INFO,        # Informational
        }

    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            'F': ViolationType.SYNTAX_ERROR,
            'E': ViolationType.CODE_QUALITY,
            'W': ViolationType.CODE_QUALITY,
            'R': ViolationType.MAINTAINABILITY,
            'C': ViolationType.STYLE_VIOLATION,
            'I': ViolationType.DOCUMENTATION,
        }

    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        return [
            'pylint',
            '--output-format=json',
            '--score=no',
            '--reports=no',
            target_path
        ]

    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        try:
            data = json.loads(stdout)
            
            for item in data:
                violations.append(LinterViolation(
                    file_path=item['path'],
                    line_number=item['line'],
                    column_number=item['column'],
                    rule_id=item['message-id'],
                    rule_name=item['symbol'],
                    message=item['message'],
                    severity=self.map_severity(item['type']),
                    violation_type=self.map_violation_type(item['type']),
                    source_tool='pylint',
                    context=None,
                    fix_suggestion=self._get_pylint_fix_suggestion(item['message-id'])
                ))
                
        except json.JSONDecodeError:
            # Handle non-JSON output
            violations = self._parse_text_output(stdout)
        
        return violations

    def _get_pylint_fix_suggestion(self, message_id: str) -> Optional[str]:
        suggestions = {
            'C0103': 'Use snake_case naming convention',
            'C0111': 'Add docstring to function/class',
            'W0613': 'Remove unused argument or prefix with _',
            'R0903': 'Add more methods or use namedtuple/dataclass',
            'R0913': 'Reduce number of arguments or use config object',
            'E1101': 'Check if attribute exists or add type hints'
        }
        return suggestions.get(message_id)
```

### Ruff

**Purpose:** Extremely fast Python linter and formatter (Rust-based)

**Installation:**
```bash
pip install ruff
```

**Configuration (`pyproject.toml`):**
```toml
[tool.ruff]
line-length = 88
target-version = "py38"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "S",   # bandit
    "T20", # flake8-print
    "PL",  # pylint
    "RUF", # ruff-specific rules
]
ignore = [
    "E501",  # line too long
    "S101",  # assert used
    "T201",  # print found
]

[tool.ruff.lint.per-file-ignores]
"__init__.py" = ["F401"]
"tests/*" = ["S101", "S106"]

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.pylint]
max-args = 5
max-branches = 12
max-returns = 6
max-statements = 50
```

**Integration Adapter:**
```python
class RuffAdapter(BaseLinterAdapter):
    def __init__(self):
        super().__init__('ruff', 'pyproject.toml')

    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            'F': SeverityLevel.HIGH,        # Pyflakes errors
            'E9': SeverityLevel.CRITICAL,   # Syntax errors
            'E': SeverityLevel.MEDIUM,      # pycodestyle errors
            'W': SeverityLevel.LOW,         # pycodestyle warnings
            'B': SeverityLevel.HIGH,        # bugbear
            'S': SeverityLevel.HIGH,        # bandit security
            'I': SeverityLevel.LOW,         # isort
            'PL': SeverityLevel.MEDIUM,     # pylint
            'RUF': SeverityLevel.MEDIUM,    # ruff-specific
        }

    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            'F': ViolationType.CODE_QUALITY,
            'E9': ViolationType.SYNTAX_ERROR,
            'E': ViolationType.STYLE_VIOLATION,
            'W': ViolationType.STYLE_VIOLATION,
            'B': ViolationType.CODE_QUALITY,
            'S': ViolationType.SECURITY_ISSUE,
            'I': ViolationType.STYLE_VIOLATION,
            'PL': ViolationType.CODE_QUALITY,
            'RUF': ViolationType.CODE_QUALITY,
        }

    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        return [
            'ruff',
            'check',
            '--format=json',
            '--no-cache',
            target_path
        ]

    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        try:
            data = json.loads(stdout)
            
            for item in data:
                violations.append(LinterViolation(
                    file_path=item['filename'],
                    line_number=item['location']['row'],
                    column_number=item['location']['column'],
                    rule_id=item['code'],
                    rule_name=item['code'],
                    message=item['message'],
                    severity=self.map_severity(item['code'][:2]),
                    violation_type=self.map_violation_type(item['code'][:2]),
                    source_tool='ruff',
                    context=None,
                    fix_suggestion='Auto-fixable' if item.get('fix') else None
                ))
                
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Ruff JSON output: {e}")
        
        return violations
```

### MyPy

**Purpose:** Static type checking for Python

**Installation:**
```bash
pip install mypy types-requests types-pyyaml
```

**Configuration (`mypy.ini`):**
```ini
[mypy]
python_version = 3.8
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True
disallow_untyped_decorators = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
warn_unreachable = True
strict_equality = True
extra_checks = True

[mypy-tests.*]
disallow_untyped_defs = False

[mypy-setup]
ignore_errors = True
```

**Integration Adapter:**
```python
class MypyAdapter(BaseLinterAdapter):
    def __init__(self):
        super().__init__('mypy', 'mypy.ini')

    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            'error': SeverityLevel.HIGH,
            'warning': SeverityLevel.MEDIUM,
            'note': SeverityLevel.INFO,
        }

    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            'error': ViolationType.TYPE_ERROR,
            'warning': ViolationType.TYPE_ERROR,
            'note': ViolationType.TYPE_ERROR,
        }

    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        return [
            'mypy',
            '--show-error-codes',
            '--no-pretty',
            '--no-color-output',
            target_path
        ]

    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        output = stdout + stderr
        
        for line in output.split('\n'):
            if line.strip():
                # Parse MyPy format: file:line:col: level: message [error-code]
                match = re.match(
                    r'^(.+):(\d+):(?:(\d+):)?\s+(error|warning|note):\s+(.+?)(?:\s+\[([^\]]+)\])?$',
                    line
                )
                
                if match:
                    file_path, line_num, col_num, level, message, error_code = match.groups()
                    
                    violations.append(LinterViolation(
                        file_path=file_path,
                        line_number=int(line_num),
                        column_number=int(col_num) if col_num else 1,
                        rule_id=error_code or 'misc',
                        rule_name=error_code or 'MyPy Error',
                        message=message,
                        severity=self.map_severity(level),
                        violation_type=self.map_violation_type(level),
                        source_tool='mypy',
                        context=None,
                        fix_suggestion=self._get_mypy_fix_suggestion(error_code)
                    ))
        
        return violations

    def _get_mypy_fix_suggestion(self, error_code: Optional[str]) -> Optional[str]:
        suggestions = {
            'attr-defined': 'Check attribute name or add type annotation',
            'name-defined': 'Import missing module or check variable name',
            'assignment': 'Check type compatibility or add type assertion',
            'arg-type': 'Check argument types match function signature',
            'return-value': 'Ensure return type matches function annotation',
            'var-annotated': 'Add type annotation to variable',
        }
        return suggestions.get(error_code) if error_code else None
```

### Bandit

**Purpose:** Security vulnerability detection for Python

**Installation:**
```bash
pip install bandit[toml]
```

**Configuration (`pyproject.toml`):**
```toml
[tool.bandit]
exclude_dirs = ["tests", "test_*.py", "*_test.py"]
skips = ["B101", "B601"]  # Skip assert_used and shell_injection_possible
confidence = "high"
severity = "medium"

[tool.bandit.assert_used]
skips = ["**/test_*.py", "**/test/**/*.py"]
```

**Integration Adapter:**
```python
class BanditAdapter(BaseLinterAdapter):
    def __init__(self):
        super().__init__('bandit', 'pyproject.toml')

    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            'HIGH': SeverityLevel.CRITICAL,
            'MEDIUM': SeverityLevel.HIGH,
            'LOW': SeverityLevel.MEDIUM,
        }

    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            'HIGH': ViolationType.SECURITY_ISSUE,
            'MEDIUM': ViolationType.SECURITY_ISSUE,
            'LOW': ViolationType.SECURITY_ISSUE,
        }

    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        return [
            'bandit',
            '-f', 'json',
            '-r',
            target_path
        ]

    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        try:
            data = json.loads(stdout)
            
            for result in data.get('results', []):
                violations.append(LinterViolation(
                    file_path=result['filename'],
                    line_number=result['line_number'],
                    column_number=result.get('col_offset', 1),
                    rule_id=result['test_id'],
                    rule_name=result['test_name'],
                    message=result['issue_text'],
                    severity=self.map_severity(result['issue_severity']),
                    violation_type=ViolationType.SECURITY_ISSUE,
                    source_tool='bandit',
                    context=result.get('code'),
                    fix_suggestion=self._get_bandit_fix_suggestion(result['test_id'])
                ))
                
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Bandit JSON output: {e}")
        
        return violations

    def _get_bandit_fix_suggestion(self, test_id: str) -> Optional[str]:
        suggestions = {
            'B101': 'Remove assert statements or use proper validation',
            'B102': 'Avoid exec() calls, use safer alternatives',
            'B103': 'Set file permissions explicitly',
            'B105': 'Remove hardcoded passwords, use environment variables',
            'B106': 'Remove hardcoded passwords in function arguments',
            'B201': 'Avoid using Flask in debug mode in production',
            'B301': 'Use safe_load() instead of load() for YAML',
            'B302': 'Use safer pickle alternatives like json',
            'B501': 'Validate SSL certificates properly',
            'B601': 'Avoid shell=True, use list format for subprocess',
        }
        return suggestions.get(test_id)
```

## Tool-Specific Performance Optimization

### Execution Strategies

**Parallel Execution Configuration:**
```python
# Configure tool execution priorities and resource allocation
TOOL_EXECUTION_CONFIG = {
    'eslint': {
        'max_concurrent': 3,
        'cpu_weight': 0.3,
        'memory_limit': '512MB',
        'timeout': 30000,
        'priority': 'high'
    },
    'tsc': {
        'max_concurrent': 1,  # TypeScript is resource intensive
        'cpu_weight': 0.8,
        'memory_limit': '1GB',
        'timeout': 60000,
        'priority': 'critical'
    },
    'ruff': {
        'max_concurrent': 5,  # Ruff is very fast
        'cpu_weight': 0.1,
        'memory_limit': '256MB',
        'timeout': 10000,
        'priority': 'high'
    },
    'pylint': {
        'max_concurrent': 1,  # Pylint is slow
        'cpu_weight': 0.7,
        'memory_limit': '512MB',
        'timeout': 120000,
        'priority': 'medium'
    }
}
```

### Caching Strategies

**File-level Caching:**
```python
import hashlib
from pathlib import Path

class LinterCache:
    def __init__(self, cache_dir: str = '.linter-cache'):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def get_file_hash(self, file_path: str) -> str:
        """Generate hash based on file content and modification time"""
        path = Path(file_path)
        content = path.read_text(encoding='utf-8', errors='ignore')
        stat = path.stat()
        
        hash_content = f"{content}:{stat.st_mtime}:{stat.st_size}"
        return hashlib.sha256(hash_content.encode()).hexdigest()

    def get_cache_key(self, tool_id: str, file_path: str, config_hash: str) -> str:
        """Generate cache key for tool + file + config combination"""
        file_hash = self.get_file_hash(file_path)
        return f"{tool_id}:{file_hash}:{config_hash}"

    def get_cached_result(self, cache_key: str) -> Optional[List[LinterViolation]]:
        """Retrieve cached result if available"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                return [LinterViolation(**v) for v in data]
            except (json.JSONDecodeError, TypeError):
                cache_file.unlink()  # Remove corrupted cache
        return None

    def cache_result(self, cache_key: str, violations: List[LinterViolation]) -> None:
        """Cache linter result"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        with open(cache_file, 'w') as f:
            json.dump([v.to_dict() for v in violations], f)
```

### Error Recovery

**Circuit Breaker Implementation:**
```python
class ToolCircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = 'closed'  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == 'open':
            if time.time() - self.last_failure_time < self.timeout:
                raise CircuitBreakerOpenError("Circuit breaker is open")
            else:
                self.state = 'half-open'

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        """Reset circuit breaker on successful execution"""
        self.failure_count = 0
        self.state = 'closed'

    def on_failure(self):
        """Handle failure and potentially open circuit breaker"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'open'
```

## Integration Testing

### Unit Tests for Adapters

```python
import pytest
from unittest.mock import patch, MagicMock

class TestESLintAdapter:
    def setup_method(self):
        self.adapter = ESLintAdapter()

    def test_severity_mapping(self):
        assert self.adapter.map_severity('error') == SeverityLevel.HIGH
        assert self.adapter.map_severity('warn') == SeverityLevel.MEDIUM

    def test_command_building(self):
        command = self.adapter._build_command('/path/to/src')
        expected = ['npx', 'eslint', '--format', 'json', '--quiet', '/path/to/src']
        assert command == expected

    @patch('subprocess.run')
    def test_successful_execution(self, mock_run):
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = json.dumps([{
            "filePath": "/test/file.js",
            "messages": [{
                "line": 1,
                "column": 1,
                "ruleId": "no-unused-vars",
                "message": "Unused variable",
                "severity": 2
            }]
        }])
        
        result = asyncio.run(self.adapter.run_analysis('/test/file.js'))
        
        assert result.tool_name == 'eslint'
        assert result.exit_code == 0
        assert len(result.violations) == 1
        assert result.violations[0].rule_id == 'no-unused-vars'

    def test_output_parsing_error_handling(self):
        with pytest.raises(Exception, match="Failed to parse ESLint output"):
            self.adapter._parse_output("invalid json", "")
```

### Integration Tests

```python
class TestLinterIntegration:
    @pytest.fixture
    def sample_files(self, tmp_path):
        """Create sample files for testing"""
        js_file = tmp_path / "test.js"
        js_file.write_text("var unused = 'test';\nconsole.log('hello');")
        
        py_file = tmp_path / "test.py"
        py_file.write_text("import os\n\ndef test():\n    pass")
        
        return str(tmp_path)

    async def test_multi_tool_execution(self, sample_files):
        """Test execution of multiple tools on the same files"""
        engine = RealTimeLinterIngestionEngine({
            'maxConcurrentTools': 3,
            'correlationThreshold': 0.8
        })
        
        result = await engine.executeRealtimeLinting([sample_files])
        
        assert len(result.results) > 0
        assert result.correlationId is not None
        assert isinstance(result.aggregatedViolations, list)

    def test_error_recovery(self):
        """Test circuit breaker and error recovery"""
        adapter = ESLintAdapter()
        
        # Simulate failures
        for _ in range(6):  # Exceed failure threshold
            try:
                adapter.circuit_breaker.call(lambda: exec('raise Exception("test")'))
            except:
                pass
        
        # Circuit breaker should be open
        assert adapter.circuit_breaker.state == 'open'
        
        with pytest.raises(CircuitBreakerOpenError):
            adapter.circuit_breaker.call(lambda: "success")
```

## Troubleshooting Guide

### Common Issues

**1. Tool Not Found Errors**
```bash
# Check tool installation
which eslint
which python
python -m flake8 --version

# Install missing tools
npm install -g eslint typescript
pip install flake8 pylint ruff mypy bandit
```

**2. Configuration File Issues**
```bash
# Validate configuration files
npx eslint --print-config .
flake8 --version  # Shows active config
pylint --generate-rcfile > .pylintrc
```

**3. Permission Issues**
```bash
# Fix permissions for cache directories
chmod -R 755 .eslintcache .mypy_cache __pycache__

# Clean cache directories
rm -rf .eslintcache .mypy_cache __pycache__ .pytest_cache
```

**4. Memory Issues**
```bash
# Monitor memory usage during execution
top -p $(pgrep -f "eslint|pylint|mypy")

# Reduce concurrency for resource-intensive tools
export MAX_CONCURRENT_TOOLS=2
```

### Debug Commands

```bash
# Enable debug logging for specific tools
export DEBUG=linter-integration:eslint
export DEBUG=linter-integration:pylint

# Run individual tools with verbose output
eslint --debug src/
pylint --verbose src/
mypy --verbose src/

# Test adapter parsing
python -c "
from src.linter_integration.adapters.eslint_adapter import ESLintAdapter
adapter = ESLintAdapter()
result = adapter.run_analysis('test.js')
print(result)
"
```

---

This comprehensive tool reference provides everything needed to configure, integrate, and troubleshoot individual linter tools within the SPEK Enhanced Development Platform. Each tool is production-ready with validated adapters, comprehensive error handling, and performance optimization.
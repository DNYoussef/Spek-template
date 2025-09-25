# /sec:scan

## Purpose
Execute comprehensive security scanning using Semgrep with OWASP rules, CWE mapping, and SPEK-AUGMENT CTQ thresholds. Identifies security vulnerabilities, categorizes by severity, and provides actionable remediation guidance. Integrates with quality gates for security-first development.

## Usage
/sec:scan [scope=changed|full] [format=json|sarif]

## Implementation

### 1. Scan Scope Determination

#### Intelligent Scope Selection:
```bash
# Determine scan scope based on context and risk
determine_scan_scope() {
    local scope="$1"
    local git_status=$(git status --porcelain 2>/dev/null || echo "")
    
    if [[ "$scope" == "changed" ]] || [[ -n "$git_status" && "$CI_CHANGED_FILES_ONLY" == "true" ]]; then
        # Changed files only (for efficiency)
        git diff --name-only HEAD~1 HEAD | grep -E '\.(js|ts|jsx|tsx|py|java|go|rs|php|rb)$' > /tmp/scan_targets.txt
        echo "changed"
    elif [[ "$scope" == "full" ]] || [[ "$GATES_PROFILE" == "full" ]]; then
        # Full codebase scan
        find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \
               -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" \
               -o -name "*.php" -o -name "*.rb" | grep -v node_modules > /tmp/scan_targets.txt
        echo "full"
    else
        # Auto-determine based on change size
        local changed_files=$(git diff --name-only HEAD~1 HEAD | wc -l)
        if [[ $changed_files -le 10 ]]; then
            echo "changed"
        else
            echo "full"
        fi
    fi
}
```

#### Risk-Based Configuration:
```javascript
function determineSecurityProfile(scope, projectContext) {
  const profiles = {
    light: {
      rules: ['owasp-top10', 'security.critical'],
      timeout: 300,
      description: 'Critical security issues only'
    },
    
    standard: {
      rules: ['owasp-top10', 'security', 'cwe-top25'],
      timeout: 600,
      description: 'Comprehensive security analysis'
    },
    
    comprehensive: {
      rules: ['owasp-top10', 'security', 'cwe-top25', 'secrets', 'cryptography'],
      timeout: 1200,
      description: 'Full security audit with crypto and secrets'
    }
  };
  
  // Risk-based profile selection
  if (projectContext.hasAuthSystem || projectContext.hasPayments) {
    return profiles.comprehensive;
  } else if (scope === 'full' && projectContext.isProduction) {
    return profiles.standard;
  } else {
    return profiles.light;
  }
}
```

### 2. Semgrep Security Scanning

#### Multi-Rule Execution:
```bash
# Execute comprehensive Semgrep security scan
run_semgrep_security_scan() {
    local scope="$1"
    local profile="$2"
    local output_format="$3"
    local targets_file="/tmp/scan_targets.txt"
    
    echo "[U+1F512] Starting security scan (scope: $scope, profile: $profile)"
    
    # Create artifacts directory
    mkdir -p .claude/.artifacts
    
    # Base Semgrep command
    local base_cmd="semgrep --config=auto --timeout=600"
    
    # Add specific rule sets based on profile
    case "$profile" in
        "comprehensive")
            base_cmd="$base_cmd --config=p/owasp-top-ten --config=p/security-audit --config=p/secrets"
            ;;
        "standard")
            base_cmd="$base_cmd --config=p/owasp-top-ten --config=p/security-audit"
            ;;
        "light")
            base_cmd="$base_cmd --config=p/owasp-top-ten"
            ;;
    esac
    
    # Set output format
    if [[ "$output_format" == "sarif" ]]; then
        base_cmd="$base_cmd --sarif --output=.claude/.artifacts/security.sarif"
    else
        base_cmd="$base_cmd --json --output=.claude/.artifacts/security.json"
    fi
    
    # Execute scan
    if [[ -s "$targets_file" ]]; then
        # Scan specific files
        eval "$base_cmd $(cat $targets_file | tr '\n' ' ')"
    else
        # Scan entire project
        eval "$base_cmd ."
    fi
    
    local exit_code=$?
    echo "Security scan completed with exit code: $exit_code"
    return $exit_code
}
```

#### Enhanced Rule Configuration:
```json
{
  "semgrep_config": {
    "rules": {
      "critical": [
        "p/owasp-top-ten",
        "p/cwe-top-25"
      ],
      "high": [
        "p/security-audit",
        "p/secrets",
        "p/cryptography"
      ],
      "medium": [
        "p/javascript",
        "p/typescript", 
        "p/python"
      ]
    },
    "exclusions": [
      "test/**",
      "*.test.js",
      "*.spec.ts",
      "node_modules/**",
      "dist/**",
      ".git/**"
    ],
    "severity_mapping": {
      "ERROR": "critical",
      "WARNING": "high", 
      "INFO": "medium"
    }
  }
}
```

### 3. Result Processing and Analysis

#### Security Finding Classification:
```javascript
function processSecurityFindings(semgrepOutput) {
  const findings = semgrepOutput.results || [];
  
  const classified = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  };
  
  for (const finding of findings) {
    const classification = classifySecurityFinding(finding);
    classified[classification.severity].push({
      ...finding,
      cwe_id: extractCWE(finding.extra?.metadata?.cwe),
      owasp_category: extractOWASPCategory(finding.extra?.metadata?.owasp),
      remediation: generateRemediation(finding),
      risk_score: calculateRiskScore(finding),
      exploitability: assessExploitability(finding)
    });
  }
  
  return classified;
}

function classifySecurityFinding(finding) {
  const metadata = finding.extra?.metadata || {};
  const confidence = metadata.confidence || 'medium';
  const impact = metadata.impact || 'medium';
  
  // CWE-based severity mapping
  const cweId = extractCWE(metadata.cwe);
  if (CRITICAL_CWES.includes(cweId)) {
    return { severity: 'critical', confidence: 'high' };
  }
  
  // OWASP Top 10 mapping
  if (metadata.owasp && HIGH_RISK_OWASP.includes(metadata.owasp)) {
    return { severity: 'high', confidence };
  }
  
  // Rule-based classification
  if (finding.check_id.includes('security.audit.crypto') || 
      finding.check_id.includes('secrets')) {
    return { severity: 'high', confidence };
  }
  
  return { severity: impact, confidence };
}
```

#### CWE and OWASP Mapping:
```javascript
const SECURITY_MAPPINGS = {
  CRITICAL_CWES: [
    'CWE-89',   // SQL Injection
    'CWE-79',   // Cross-site Scripting
    'CWE-22',   // Path Traversal
    'CWE-78',   // OS Command Injection
    'CWE-94',   // Code Injection
    'CWE-611'   // XML External Entities
  ],
  
  HIGH_RISK_OWASP: [
    'A03:2021', // Injection
    'A07:2021', // Identification and Authentication Failures
    'A02:2021', // Cryptographic Failures
    'A05:2021', // Security Misconfiguration
    'A06:2021', // Vulnerable and Outdated Components
  ],
  
  REMEDIATION_TEMPLATES: {
    'sql-injection': {
      description: 'Use parameterized queries or ORM methods',
      example: 'Instead of: "SELECT * FROM users WHERE id = " + userId\nUse: "SELECT * FROM users WHERE id = ?"',
      references: ['https://owasp.org/www-community/attacks/SQL_Injection']
    },
    
    'xss': {
      description: 'Sanitize and escape user input before rendering',
      example: 'Use proper templating engines with auto-escaping enabled',
      references: ['https://owasp.org/www-community/attacks/xss/']
    },
    
    'secrets': {
      description: 'Move secrets to environment variables or secure vault',
      example: 'Replace hardcoded keys with process.env.API_KEY',
      references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure']
    }
  }
};
```

### 4. CTQ Threshold Application

#### SPEK-AUGMENT Security Gates:
```javascript
function applySecurityCTQThresholds(classifiedFindings) {
  const thresholds = {
    critical: { max: 0, blocking: true },
    high: { max: 0, blocking: true },
    medium: { max: 5, blocking: false },
    low: { max: 20, blocking: false },
    info: { max: 100, blocking: false }
  };
  
  const gateResults = {};
  let overallPass = true;
  let blockingIssues = [];
  
  for (const [severity, findings] of Object.entries(classifiedFindings)) {
    const threshold = thresholds[severity];
    const count = findings.length;
    const passed = count <= threshold.max;
    
    gateResults[severity] = {
      count,
      threshold: threshold.max,
      passed,
      blocking: threshold.blocking
    };
    
    if (!passed && threshold.blocking) {
      overallPass = false;
      blockingIssues.push({
        severity,
        count,
        threshold: threshold.max,
        findings: findings.slice(0, 3) // Show first 3 for context
      });
    }
  }
  
  return {
    overall_pass: overallPass,
    gate_results: gateResults,
    blocking_issues: blockingIssues,
    total_findings: Object.values(classifiedFindings).flat().length
  };
}
```

### 5. Comprehensive Security Report

Generate detailed security.json:

```json
{
  "timestamp": "2024-09-08T14:00:00Z",
  "scan_id": "sec-scan-1709904000",
  "scan_scope": "changed",
  "scan_profile": "standard",
  
  "execution": {
    "duration_seconds": 45,
    "semgrep_version": "1.45.0",
    "rules_used": ["p/owasp-top-ten", "p/security-audit"],
    "files_scanned": 23,
    "exit_code": 0
  },
  
  "findings": {
    "critical": [
      {
        "check_id": "javascript.express.security.audit.xss.mustache-escape.mustache-escape",
        "message": "Potential XSS vulnerability in template rendering",
        "file": "src/views/user-profile.js",
        "line": 34,
        "column": 15,
        "severity": "critical",
        "confidence": "high",
        "cwe_id": "CWE-79",
        "owasp_category": "A03:2021-Injection",
        "risk_score": 9.1,
        "exploitability": "high",
        "remediation": {
          "description": "Use proper HTML escaping for user-generated content",
          "suggestion": "Replace {{{user.name}}} with {{user.name}} for auto-escaping",
          "references": ["https://owasp.org/www-community/attacks/xss/"]
        }
      }
    ],
    
    "high": [
      {
        "check_id": "secrets.generic.secret.generic-api-key",
        "message": "Hardcoded API key detected",
        "file": "src/config/api.js",
        "line": 12,
        "severity": "high", 
        "confidence": "medium",
        "cwe_id": "CWE-798",
        "owasp_category": "A07:2021-Identification-Authentication-Failures",
        "risk_score": 7.8,
        "remediation": {
          "description": "Move API key to environment variable",
          "suggestion": "Replace 'sk-1234567890abcdef' with process.env.API_KEY",
          "references": ["https://12factor.net/config"]
        }
      }
    ],
    
    "medium": [
      {
        "check_id": "javascript.express.security.audit.express-cookie-session-no-httponly",
        "message": "Session cookie without HttpOnly flag",
        "file": "src/middleware/session.js", 
        "line": 18,
        "severity": "medium",
        "confidence": "high",
        "cwe_id": "CWE-1004",
        "owasp_category": "A05:2021-Security-Misconfiguration",
        "risk_score": 5.2,
        "remediation": {
          "description": "Add HttpOnly flag to prevent XSS cookie theft",
          "suggestion": "Add 'httpOnly: true' to cookie options"
        }
      }
    ],
    
    "low": [],
    "info": []
  },
  
  "summary": {
    "total_findings": 3,
    "by_severity": {
      "critical": 1,
      "high": 1, 
      "medium": 1,
      "low": 0,
      "info": 0
    },
    "by_category": {
      "injection": 1,
      "authentication": 1,
      "misconfiguration": 1
    },
    "by_cwe": {
      "CWE-79": 1,
      "CWE-798": 1,
      "CWE-1004": 1
    }
  },
  
  "ctq_evaluation": {
    "overall_pass": false,
    "gate_results": {
      "critical": {"count": 1, "threshold": 0, "passed": false, "blocking": true},
      "high": {"count": 1, "threshold": 0, "passed": false, "blocking": true},
      "medium": {"count": 1, "threshold": 5, "passed": true, "blocking": false}
    },
    "blocking_issues": [
      {
        "severity": "critical",
        "count": 1,
        "issue": "XSS vulnerability must be fixed before deployment"
      },
      {
        "severity": "high", 
        "count": 1,
        "issue": "Hardcoded secrets must be removed"
      }
    ]
  },
  
  "recommendations": {
    "immediate_actions": [
      "Fix XSS vulnerability in user-profile.js line 34",
      "Move API key to environment variable in api.js line 12"
    ],
    "security_improvements": [
      "Add HttpOnly flag to session cookies",
      "Implement Content Security Policy headers",
      "Add input validation middleware"
    ],
    "next_scan": "After fixing critical and high severity issues",
    "estimated_fix_time": "2-4 hours for critical issues"
  },
  
  "compliance": {
    "owasp_top10_coverage": {
      "A03_injection": "violations_found",
      "A07_auth_failures": "violations_found", 
      "A05_misconfiguration": "violations_found"
    },
    "cwe_top25_coverage": {
      "covered": ["CWE-79", "CWE-798", "CWE-1004"],
      "violations": 3
    }
  }
}
```

### 6. Integration with Fix Workflows

#### Auto-Fix Routing:
```javascript
function routeSecurityFixes(securityFindings) {
  const fixRouting = {
    auto_fixable: [],
    manual_review: [],
    escalation_needed: []
  };
  
  for (const [severity, findings] of Object.entries(securityFindings)) {
    for (const finding of findings) {
      const routing = determineFixRouting(finding);
      fixRouting[routing.category].push({
        finding,
        recommended_approach: routing.approach,
        estimated_effort: routing.effort
      });
    }
  }
  
  return fixRouting;
}

function determineFixRouting(finding) {
  // Simple fixes that can be automated
  if (finding.check_id.includes('secrets.generic') ||
      finding.check_id.includes('httponly') ||
      finding.check_id.includes('secure-flag')) {
    return {
      category: 'auto_fixable',
      approach: 'codex:micro',
      effort: 'low'
    };
  }
  
  // Complex security issues needing human review
  if (finding.cwe_id === 'CWE-79' || // XSS
      finding.cwe_id === 'CWE-89' || // SQL Injection
      finding.cwe_id === 'CWE-78') { // Command Injection
    return {
      category: 'manual_review',
      approach: 'security_expert_review',
      effort: 'high'
    };
  }
  
  // Medium complexity issues
  return {
    category: 'escalation_needed',
    approach: 'fix:planned',
    effort: 'medium'
  };
}
```

## Integration Points

### Used by:
- `/qa:run` command - As part of comprehensive QA suite
- `scripts/self_correct.sh` - For security-focused fix routing
- `flow/workflows/spec-to-pr.yaml` - For pre-deployment security validation
- CF v2 Alpha - For security pattern learning

### Produces:
- `security.json` - Comprehensive security analysis results
- `security.sarif` - SARIF format for tool integration
- CTQ threshold evaluation results
- Fix routing recommendations

### Consumes:
- Project source code files
- Semgrep rule configurations
- SPEK-AUGMENT CTQ threshold definitions
- Historical security finding patterns

## Examples

### Clean Security Scan:
```json
{
  "summary": {"total_findings": 0},
  "ctq_evaluation": {"overall_pass": true, "blocking_issues": []},
  "recommendations": {"immediate_actions": [], "next_scan": "Passed - continue development"}
}
```

### Critical Security Issues:
```json
{
  "summary": {"total_findings": 5, "by_severity": {"critical": 2, "high": 3}},
  "ctq_evaluation": {"overall_pass": false, "blocking_issues": [{"severity": "critical", "count": 2}]},
  "recommendations": {"immediate_actions": ["Fix SQL injection", "Remove hardcoded password"]}
}
```

### Changed Files Only Scan:
```json
{
  "scan_scope": "changed",
  "execution": {"files_scanned": 3, "duration_seconds": 8},
  "summary": {"total_findings": 1, "by_severity": {"medium": 1}}
}
```

## Error Handling

### Semgrep Execution Failures:
- Fallback to lighter rule sets on timeout
- Graceful handling of unsupported file types
- Clear error reporting for configuration issues
- Retry logic for transient failures

### Rule Configuration Issues:
- Validation of rule set availability
- Fallback to default OWASP rules
- Warning when custom rules fail to load
- Guidance for rule set troubleshooting

### Large Codebase Handling:
- Automatic scope reduction for performance
- Progress reporting for long scans
- Memory usage monitoring
- Intelligent file prioritization

## Performance Requirements

- Complete scan within 10 minutes for large codebases
- Efficient processing of changed files only
- Memory usage under 512MB during scan
- Progress indication for long-running scans

This command provides comprehensive security scanning with intelligent CTQ threshold application, enabling security-first development practices within the SPEK-AUGMENT framework.
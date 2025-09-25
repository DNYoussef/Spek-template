# /theater:scan Command - Performance Theater Detection

## Purpose
Specialized command for detecting completion theater patterns in code, tests, and quality infrastructure using pattern matching and evidence validation within the SPEK quality framework.

## Usage
```bash
/theater:scan [--scope <scope>] [--patterns <pattern-set>] [--quality-correlation] [--evidence-level <level>] [--output-format <format>]
```

## Implementation Strategy

### 1. Theater Pattern Detection Engine
Multi-layered pattern recognition leveraging existing SPEK quality infrastructure:

```yaml
theater_detection_layers:
  code_analysis:
    - Mock-heavy implementations claiming real functionality
    - Test files that print success without verification
    - Performance benchmarks with unrealistic data
    - Security implementations that don't secure
  
  quality_infrastructure_analysis:
    - Quality gate gaming and metric manipulation
    - Coverage theater hiding non-functional tests
    - Security theater with unresolved vulnerabilities
    - Architectural theater with fake refactoring
  
  completion_claims_analysis:
    - Claims without supporting evidence
    - "Done" without working functionality
    - Performance optimizations without measurements
    - Integration claims without integration tests
```

### 2. Integration with SPEK Quality Gates
Leverage existing quality infrastructure for theater detection:

```yaml
quality_gate_integration:
  connascence_analysis:
    theater_patterns:
      - God objects renamed but not refactored
      - Coupling "reduced" through measurement exclusions  
      - NASA compliance gaming through threshold manipulation
    detection_method: "Analyze connascence_full.json for suspicious improvements"
  
  security_scanning:
    theater_patterns:
      - Vulnerabilities marked "resolved" without code changes
      - Critical findings suppressed without mitigation
      - Security rules disabled for "performance"
    detection_method: "Cross-reference SARIF findings with git diff"
  
  test_coverage:
    theater_patterns:
      - High coverage with mock-only test suites
      - Test files that simulate rather than verify
      - Coverage exclusions hiding core functionality
    detection_method: "Analyze test content vs coverage claims"
  
  performance_monitoring:
    theater_patterns:
      - Benchmarks that don't measure real usage
      - Performance claims without supporting metrics
      - Load tests with unrealistic scenarios
    detection_method: "Validate performance claims against actual measurements"
```

### 3. Evidence-Based Theater Detection
```python
class TheaterPatternDetector:
    def __init__(self, quality_context, memory_bridge):
        self.quality_context = quality_context
        self.memory_bridge = memory_bridge
        self.pattern_library = self._load_theater_patterns()
    
    def scan_for_theater(self, scope="comprehensive"):
        """Execute multi-layered theater detection"""
        detection_results = {
            'code_theater': self._detect_code_theater(),
            'test_theater': self._detect_test_theater(), 
            'quality_theater': self._detect_quality_theater(),
            'completion_theater': self._detect_completion_theater()
        }
        
        # Cross-correlate findings with quality gate results
        correlated_findings = self._correlate_with_quality_gates(detection_results)
        
        # Generate evidence package
        evidence_package = self._compile_evidence(correlated_findings)
        
        return {
            'theater_findings': correlated_findings,
            'evidence_package': evidence_package,
            'confidence_scores': self._calculate_confidence_scores(correlated_findings)
        }
    
    def _detect_quality_theater(self):
        """Detect theater in quality infrastructure"""
        quality_artifacts = self.quality_context.get_artifacts()
        
        theater_findings = []
        
        # Analyze connascence theater
        if 'connascence_full.json' in quality_artifacts:
            connascence_theater = self._analyze_connascence_theater(
                quality_artifacts['connascence_full.json']
            )
            theater_findings.extend(connascence_theater)
        
        # Analyze security theater
        if 'semgrep.sarif' in quality_artifacts:
            security_theater = self._analyze_security_theater(
                quality_artifacts['semgrep.sarif']
            )
            theater_findings.extend(security_theater)
        
        # Analyze test coverage theater
        if 'coverage_reports' in quality_artifacts:
            coverage_theater = self._analyze_coverage_theater(
                quality_artifacts['coverage_reports']
            )
            theater_findings.extend(coverage_theater)
            
        return theater_findings
```

### 4. Pattern Library Integration
```yaml
theater_pattern_library:
  classic_patterns:
    success_printing:
      signature: 'console.log("[U+2713]")|print("PASS")|echo "SUCCESS"'
      context: "Test files or validation scripts"
      severity: "high"
      evidence_required: "Actual verification logic missing"
    
    mock_integration:
      signature: 'mock.*integration|stub.*service'
      context: "Integration test files" 
      severity: "medium"
      evidence_required: "Real service interaction missing"
    
    performance_theater:
      signature: 'benchmark.*static|load_test.*mock_data'
      context: "Performance testing"
      severity: "high" 
      evidence_required: "Realistic load scenarios missing"
  
  quality_infrastructure_patterns:
    connascence_gaming:
      signature: "Architectural improvements without coupling reduction"
      detection: "Compare coupling metrics before/after refactoring"
      severity: "critical"
    
    security_theater:
      signature: "Security findings marked resolved without fixes"
      detection: "Cross-reference SARIF with git diff"
      severity: "critical"
    
    coverage_gaming:
      signature: "High coverage with non-functional test content"
      detection: "Analyze test complexity vs coverage percentage"
      severity: "high"
```

## Command Implementation

### Core Execution Flow
```yaml
execution_phases:
  initialization:
    - Load theater pattern library from memory bridge
    - Initialize quality context with existing artifacts
    - Prepare detection engines for each theater type
  
  pattern_detection:
    - Scan codebase for classic theater patterns
    - Analyze quality artifacts for infrastructure theater
    - Cross-correlate findings with quality gate results
    - Generate confidence scores for each finding
  
  evidence_compilation:
    - Compile supporting evidence for each theater finding
    - Cross-reference with git history and quality trends
    - Generate actionable remediation recommendations
    - Update memory bridge with new theater patterns
```

### Quality Gate Correlation Logic
```python
def correlate_theater_with_quality_gates(theater_findings, quality_results):
    """Cross-reference theater findings with quality gate results"""
    
    correlations = []
    
    for finding in theater_findings:
        correlation = {
            'finding': finding,
            'quality_evidence': {},
            'contradiction_score': 0.0
        }
        
        # Check if theater finding contradicts quality gate results
        if finding['type'] == 'test_theater':
            test_results = quality_results.get('qa_json', {}).get('tests', {})
            if test_results.get('status') == 'pass' and finding['severity'] == 'high':
                correlation['contradiction_score'] = 0.9
                correlation['quality_evidence']['test_contradiction'] = {
                    'qa_claims': 'Tests passing',
                    'theater_evidence': finding['evidence'],
                    'conflict': 'Tests claim to pass but contain theater patterns'
                }
        
        elif finding['type'] == 'security_theater':
            security_results = quality_results.get('security_sarif', {})
            resolved_findings = security_results.get('resolved_count', 0)
            if resolved_findings > 0 and finding['severity'] == 'critical':
                correlation['contradiction_score'] = 0.95
                correlation['quality_evidence']['security_contradiction'] = {
                    'sarif_claims': f'{resolved_findings} vulnerabilities resolved',
                    'theater_evidence': finding['evidence'],
                    'conflict': 'Security claims resolution but theater patterns detected'
                }
        
        correlations.append(correlation)
    
    return correlations
```

## Output Specifications

### Theater Scan Report
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "command": "theater-scan",
  "scan_scope": "comprehensive",
  "scan_session": "theater-scan-20240908-121500",
  
  "theater_findings": [
    {
      "id": "theater-001",
      "type": "test_theater",
      "pattern": "success_printing",
      "file": "tests/integration_auth.js",
      "line": 45,
      "severity": "high",
      "confidence": 0.92,
      "evidence": {
        "code_snippet": "console.log('[U+2713] Auth integration test passed')",
        "context": "Function returns without actual API call",
        "git_history": "Added in commit abc123 claiming integration test"
      },
      "quality_contradiction": {
        "qa_json_claims": "Integration tests: 15 passing",
        "actual_integration": false,
        "contradiction_score": 0.89
      }
    },
    {
      "id": "theater-002", 
      "type": "quality_infrastructure_theater",
      "pattern": "connascence_gaming",
      "component": "auth.service",
      "severity": "critical",
      "confidence": 0.87,
      "evidence": {
        "claimed_improvement": "Reduced coupling from 0.85 to 0.45",
        "actual_analysis": "God object split into multiple god objects",
        "connascence_data": "Total connascence violations increased by 23%"
      },
      "quality_contradiction": {
        "connascence_report_claims": "Architectural health improved",
        "actual_coupling": "Coupling complexity increased",
        "contradiction_score": 0.94
      }
    },
    {
      "id": "theater-003",
      "type": "security_theater", 
      "pattern": "resolved_without_fix",
      "finding": "SQL injection vulnerability",
      "severity": "critical",
      "confidence": 0.96,
      "evidence": {
        "sarif_status": "RESOLVED",
        "git_analysis": "No code changes in vulnerable endpoint",
        "vulnerability_still_present": true
      },
      "quality_contradiction": {
        "security_claims": "Critical vulnerabilities resolved",
        "actual_status": "Vulnerabilities still exploitable",
        "contradiction_score": 0.98
      }
    }
  ],
  
  "theater_summary": {
    "total_patterns_detected": 8,
    "high_confidence_findings": 5,
    "quality_contradictions": 7,
    "critical_theater_count": 3,
    "average_confidence": 0.84
  },
  
  "quality_gate_analysis": {
    "theater_vs_quality_correlation": 0.89,
    "false_positive_quality_gates": 4,
    "quality_infrastructure_abuse": 3,
    "reliability_degradation": 0.23
  },
  
  "remediation_recommendations": [
    {
      "priority": "critical",
      "finding_id": "theater-003",
      "action": "Actually fix SQL injection vulnerability",
      "implementation": "Parameterize queries in auth/login endpoint",
      "validation": "Re-run security scan to confirm resolution"
    },
    {
      "priority": "high", 
      "finding_id": "theater-001",
      "action": "Replace theater test with real integration test",
      "implementation": "Make actual API call to auth service",
      "validation": "Verify test fails when service is down"
    },
    {
      "priority": "high",
      "finding_id": "theater-002", 
      "action": "Genuine coupling reduction in auth.service",
      "implementation": "Extract interfaces and apply dependency injection",
      "validation": "Connascence analysis shows actual improvement"
    }
  ],
  
  "memory_updates": {
    "new_patterns_learned": 2,
    "pattern_confidence_updates": 5,
    "quality_correlation_data": "Updated theater-quality contradiction patterns"
  }
}
```

## Integration Points

### SPEK Quality Framework Integration
```yaml
quality_integration:
  connascence_analyzer:
    - Analyze architectural theater in connascence reports
    - Detect god object renaming vs actual refactoring
    - Identify NASA compliance gaming patterns
  
  security_scanning:
    - Cross-reference SARIF findings with actual fixes
    - Detect suppressed vulnerabilities without mitigation
    - Identify security rule disabling without justification
  
  test_coverage:
    - Analyze test content quality vs coverage percentages
    - Detect mock-heavy tests claiming integration coverage
    - Identify coverage exclusions hiding core functionality
    
  performance_monitoring:
    - Validate performance claims against actual measurements
    - Detect benchmark theater with unrealistic scenarios
    - Identify load test theater with mock data
```

### Memory Bridge Pattern Learning
```bash
# Store detected theater patterns for future recognition
scripts/memory_bridge.sh store "intelligence/theater_patterns" "detected_$(date +%s)" "$theater_findings" '{"type": "theater_detection"}'

# Update pattern confidence based on validation results  
scripts/memory_bridge.sh store "models/theater" "pattern_confidence" "$confidence_updates" '{"type": "pattern_learning"}'

# Store quality contradiction patterns for improved detection
scripts/memory_bridge.sh store "intelligence/quality_contradictions" "correlations" "$quality_correlations" '{"type": "quality_theater"}'
```

## Success Metrics

### Theater Detection Effectiveness
- **Pattern Recognition Accuracy**: % of theater patterns correctly identified
- **False Positive Rate**: % of legitimate code incorrectly flagged as theater
- **Quality Contradiction Detection**: % of quality gate theater identified
- **Remediation Success Rate**: % of detected theater successfully eliminated

### SPEK Integration Success  
- **Quality Infrastructure Coverage**: % of quality gates monitored for theater
- **Pattern Learning Rate**: Improvement in detection accuracy over time
- **Quality Gate Reliability**: Improvement in quality gate trustworthiness
- **Development Velocity Impact**: Speed improvement from eliminating false completion

This theater-scan command provides surgical theater detection within your comprehensive SPEK quality framework, ensuring that your robust quality infrastructure remains theater-free and trustworthy.
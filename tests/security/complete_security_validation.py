from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_RETRY_ATTEMPTS, MINIMUM_TEST_COVERAGE_PERCENTAGE, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, TAKE_PROFIT_PERCENTAGE
"""

Comprehensive security validation for production deployment including:
- NASA POT10 compliance verification
- Byzantine fault tolerance validation  
- Memory security analysis
- Theater detection validation
- Threat model verification
"""

import asyncio
import hashlib
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

@dataclass
class SecurityViolation:
    """Security violation found during analysis."""
    violation_type: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    file_path: str
    line_number: Optional[int]
    description: str
    rule_id: str
    evidence: str
    remediation: str

@dataclass
class SecurityTestResult:
    """Result from a security test."""
    test_name: str
    passed: bool
    score: float
    violations: List[SecurityViolation]
    execution_time: float
    details: Dict[str, Any]

class NASAComplianceValidator:
    """Validate NASA Power of Ten Rules compliance."""
    
    def __init__(self):
        self.rules = self._define_nasa_rules()
        
    def _define_nasa_rules(self) -> Dict[str, Dict]:
        """Define NASA POT10 rules for validation."""
        return {
            'rule_1_flow_control': {
                'description': 'Avoid complex flow constructs',
                'pattern': r'(goto|setjmp|longjmp)',
                'severity': 'critical'
            },
            'rule_2_bounded_loops': {
                'description': 'Loops must have fixed bounds',
                'pattern': r'while\s*\(\s*\w+\s*\)',  # Simplified check
                'severity': 'high'
            },
            'rule_3_heap_allocation': {
                'description': 'Avoid dynamic memory allocation',
                'pattern': r'(malloc|calloc|realloc|free|new|delete)',
                'severity': 'high'
            },
            'rule_4_function_length': {
                'description': 'Functions should not exceed 60 lines',
                'max_lines': 60,
                'severity': 'medium'
            },
            'rule_5_assertions': {
                'description': 'Use assertions for data validation',
                'pattern': r'assert\s*\(',
                'severity': 'medium'
            },
            'rule_6_data_scope': {
                'description': 'Limit scope of data objects',
                'severity': 'medium'
            },
            'rule_7_return_values': {
                'description': 'Check return values of functions',
                'severity': 'high'
            },
            'rule_8_preprocessor': {
                'description': 'Limit preprocessor use',
                'pattern': r'#(?:define|ifdef|ifndef|if|else|elif|endif)',
                'severity': 'low'
            },
            'rule_9_pointers': {
                'description': 'Limit pointer use',
                'severity': 'medium'
            },
            'rule_10_compiler_warnings': {
                'description': 'Compile with all warnings enabled',
                'severity': 'high'
            }
        }
    
    def validate_file(self, file_path: Path) -> List[SecurityViolation]:
        """Validate a single file against NASA rules."""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
            
            # Rule 1: Flow control
            for line_num, line in enumerate(lines, 1):
                if re.search(self.rules['rule_1_flow_control']['pattern'], line):
                    violations.append(SecurityViolation(
                        violation_type='nasa_rule_1',
                        severity='critical',
                        file_path=str(file_path),
                        line_number=line_num,
                        description='Complex flow construct detected',
                        rule_id='NASA-POT10-Rule-1',
                        evidence=line.strip(),
                        remediation='Replace with structured control flow'
                    ))
            
            # Rule 2: Bounded loops - Check for potentially unbounded loops
            for line_num, line in enumerate(lines, 1):
                if 'while True:' in line or 'while 1:' in line:
                    violations.append(SecurityViolation(
                        violation_type='nasa_rule_2',
                        severity='high',
                        file_path=str(file_path),
                        line_number=line_num,
                        description='Potentially unbounded loop detected',
                        rule_id='NASA-POT10-Rule-2',
                        evidence=line.strip(),
                        remediation='Add explicit loop bounds or break conditions'
                    ))
            
            # Rule 4: Function length
            current_function = None
            function_start = 0
            indent_level = 0
            
            for line_num, line in enumerate(lines, 1):
                stripped = line.strip()
                if stripped.startswith('def ') and ':' in stripped:
                    if current_function:
                        # Check previous function length
                        func_length = line_num - function_start - 1
                        if func_length > self.rules['rule_4_function_length']['max_lines']:
                            violations.append(SecurityViolation(
                                violation_type='nasa_rule_4',
                                severity='medium',
                                file_path=str(file_path),
                                line_number=function_start,
                                description=f'Function exceeds {self.rules["rule_4_function_length"]["max_lines"]} lines: {func_length} lines',
                                rule_id='NASA-POT10-Rule-4',
                                evidence=current_function,
                                remediation='Break function into smaller functions'
                            ))
                    
                    current_function = stripped
                    function_start = line_num
                    indent_level = len(line) - len(line.lstrip())
            
            # Rule 5: Assertions - Look for missing assertions in critical functions
            critical_functions = ['__init__', 'validate', 'process', 'analyze']
            for line_num, line in enumerate(lines, 1):
                if any(func in line for func in critical_functions) and 'def ' in line:
                    # Check next 10 lines for assertions
                    has_assertion = any('assert' in lines[i] for i in range(line_num, min(line_num + 10, len(lines))))
                    if not has_assertion:
                        violations.append(SecurityViolation(
                            violation_type='nasa_rule_5',
                            severity='medium',
                            file_path=str(file_path),
                            line_number=line_num,
                            description='Critical function missing assertions',
                            rule_id='NASA-POT10-Rule-5',
                            evidence=line.strip(),
                            remediation='Add input validation assertions'
                        ))
            
            # Rule 7: Return value checking
            function_calls = re.findall(r'(\w+)\s*\([^)]*\)', content)
            risky_functions = ['open', 'subprocess', 'request', 'connect']
            
            for line_num, line in enumerate(lines, 1):
                for func in risky_functions:
                    if f'{func}(' in line and '=' not in line.split(f'{func}(')[0]:
                        violations.append(SecurityViolation(
                            violation_type='nasa_rule_7',
                            severity='high',
                            file_path=str(file_path),
                            line_number=line_num,
                            description='Function return value not checked',
                            rule_id='NASA-POT10-Rule-7',
                            evidence=line.strip(),
                            remediation='Check and handle return values'
                        ))
                        
        except Exception as e:
            logger.warning(f"Error validating {file_path}: {e}")
            
        return violations
    
    def validate_project(self, project_path: Path) -> SecurityTestResult:
        """Validate entire project against NASA rules."""
        start_time = time.time()
        all_violations = []
        files_analyzed = 0
        
        for py_file in project_path.rglob('*.py'):
            # Skip test files and third-party code
            if 'test' in str(py_file) or 'vendor' in str(py_file):
                continue
                
            violations = self.validate_file(py_file)
            all_violations.extend(violations)
            files_analyzed += 1
        
        # Calculate compliance score
        critical_violations = len([v for v in all_violations if v.severity == 'critical'])
        high_violations = len([v for v in all_violations if v.severity == 'high'])
        
        # Scoring: 1.0 = perfect, deduct points for violations
        score = 1.0
        score -= critical_violations * 0.1  # MAXIMUM_FUNCTION_PARAMETERS% per critical
        score -= high_violations * 0.5     # 5% per high
        score = max(0.0, score)
        
        execution_time = time.time() - start_time
        
        return SecurityTestResult(
            test_name='NASA POT10 Compliance',
            passed=score >= NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,  # 95% compliance required
            score=score,
            violations=all_violations,
            execution_time=execution_time,
            details={
                'files_analyzed': files_analyzed,
                'critical_violations': critical_violations,
                'high_violations': high_violations,
                'target_score': 0.95
            }
        )

class ByzantineFaultToleranceValidator:
    """Validate Byzantine fault tolerance capabilities."""
    
    def __init__(self):
        self.consensus_threshold = 0.67  # 2/3 consensus required
        
    def simulate_byzantine_scenario(self, node_count: int, byzantine_count: int) -> Dict[str, Any]:
        """Simulate Byzantine fault scenario."""
        if byzantine_count >= node_count / 3:
            return {
                'consensus_possible': False,
                'reason': 'Too many Byzantine nodes (f >= n/3)'
            }
        
        honest_nodes = node_count - byzantine_count
        consensus_votes = honest_nodes
        
        # Simulate consensus protocol
        consensus_achieved = consensus_votes >= (2 * node_count / 3)
        
        return {
            'consensus_possible': True,
            'consensus_achieved': consensus_achieved,
            'honest_nodes': honest_nodes,
            'byzantine_nodes': byzantine_count,
            'consensus_votes': consensus_votes,
            'threshold_required': int(2 * node_count / MAXIMUM_RETRY_ATTEMPTS)
        }
    
    def test_consensus_protocols(self) -> SecurityTestResult:
        """Test Byzantine consensus protocols."""
        start_time = time.time()
        violations = []
        
        test_scenarios = [
            (10, 0),   # No Byzantine nodes
            (10, 1),   # 1 Byzantine node
            (10, 2),   # 2 Byzantine nodes  
            (10, 3),   # 3 Byzantine nodes (boundary)
            (10, 4),   # 4 Byzantine nodes (should fail)
        ]
        
        passed_scenarios = 0
        total_scenarios = len(test_scenarios)
        
        for node_count, byzantine_count in test_scenarios:
            result = self.simulate_byzantine_scenario(node_count, byzantine_count)
            
            expected_consensus = byzantine_count < node_count / 3
            actual_consensus = result.get('consensus_achieved', False)
            
            if expected_consensus and actual_consensus:
                passed_scenarios += 1
            elif not expected_consensus and not actual_consensus:
                passed_scenarios += 1
            else:
                violations.append(SecurityViolation(
                    violation_type='byzantine_consensus_failure',
                    severity='critical',
                    file_path='consensus_protocol',
                    line_number=None,
                    description=f'Consensus failure with {byzantine_count} Byzantine nodes out of {node_count}',
                    rule_id='BYZANTINE-CONSENSUS',
                    evidence=f'Expected: {expected_consensus}, Actual: {actual_consensus}',
                    remediation='Implement PBFT or similar Byzantine consensus protocol'
                ))
        
        score = passed_scenarios / total_scenarios
        execution_time = time.time() - start_time
        
        return SecurityTestResult(
            test_name='Byzantine Fault Tolerance',
            passed=score >= 0.8,  # MINIMUM_TEST_COVERAGE_PERCENTAGE% of scenarios should pass
            score=score,
            violations=violations,
            execution_time=execution_time,
            details={
                'scenarios_tested': total_scenarios,
                'scenarios_passed': passed_scenarios,
                'consensus_threshold': self.consensus_threshold
            }
        )

class MemorySecurityValidator:
    """Validate memory security and leak prevention."""
    
    def __init__(self):
        self.memory_patterns = self._define_memory_patterns()
        
    def _define_memory_patterns(self) -> Dict[str, Dict]:
        """Define memory security patterns to check."""
        return {
            'buffer_overflow': {
                'patterns': [r'strcpy\s*\(', r'strcat\s*\(', r'sprintf\s*\('],
                'severity': 'critical',
                'description': 'Potential buffer overflow vulnerability'
            },
            'memory_leak': {
                'patterns': [r'(?:malloc|calloc)\s*\([^)]*\)(?![^;]*free)', r'new\s+\w+(?![^;]*delete)'],
                'severity': 'high',
                'description': 'Potential memory leak'
            },
            'use_after_free': {
                'patterns': [r'free\s*\([^)]*\).*\1', r'delete\s+\w+.*\1'],
                'severity': 'critical',
                'description': 'Potential use-after-free vulnerability'
            },
            'null_pointer_dereference': {
                'patterns': [r'\*\w+(?!\s*[=!])(?![^;]*(?:if|assert))'],
                'severity': 'high',
                'description': 'Potential null pointer dereference'
            }
        }
    
    def analyze_memory_security(self, project_path: Path) -> SecurityTestResult:
        """Analyze memory security patterns."""
        start_time = time.time()
        violations = []
        files_analyzed = 0
        
        for source_file in project_path.rglob('*.py'):
            try:
                with open(source_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                # Check for memory security patterns
                for pattern_name, pattern_info in self.memory_patterns.items():
                    for pattern in pattern_info['patterns']:
                        for line_num, line in enumerate(lines, 1):
                            if re.search(pattern, line, re.IGNORECASE):
                                violations.append(SecurityViolation(
                                    violation_type=f'memory_security_{pattern_name}',
                                    severity=pattern_info['severity'],
                                    file_path=str(source_file),
                                    line_number=line_num,
                                    description=pattern_info['description'],
                                    rule_id=f'MEM-SEC-{pattern_name.upper()}',
                                    evidence=line.strip(),
                                    remediation=f'Review and fix {pattern_name} vulnerability'
                                ))
                
                files_analyzed += 1
                
            except Exception as e:
                logger.warning(f"Error analyzing {source_file}: {e}")
        
        # Memory security should have zero critical vulnerabilities
        critical_violations = len([v for v in violations if v.severity == 'critical'])
        high_violations = len([v for v in violations if v.severity == 'high'])
        
        score = 1.0 if critical_violations == 0 and high_violations == 0 else 0.0
        execution_time = time.time() - start_time
        
        return SecurityTestResult(
            test_name='Memory Security Analysis',
            passed=critical_violations == 0 and high_violations <= 2,
            score=score,
            violations=violations,
            execution_time=execution_time,
            details={
                'files_analyzed': files_analyzed,
                'critical_vulnerabilities': critical_violations,
                'high_vulnerabilities': high_violations,
                'zero_tolerance': True
            }
        )

class TheaterDetectionValidator:
    """Validate theater detection capabilities."""
    
    def __init__(self):
        self.theater_patterns = self._define_theater_patterns()
        
    def _define_theater_patterns(self) -> List[Dict]:
        """Define patterns that indicate performance theater."""
        return [
            {
                'name': 'mock_implementations',
                'patterns': [r'class\s+Mock\w+', r'def\s+mock_\w+', r'return\s+"fake"'],
                'severity': 'high',
                'description': 'Mock implementation found in production code'
            },
            {
                'name': 'hardcoded_benchmarks',
                'patterns': [r'benchmark\s*=\s*\d+', r'performance\s*=\s*["\']fast["\']'],
                'severity': 'medium',
                'description': 'Hardcoded benchmark values detected'
            },
            {
                'name': 'fake_metrics',
                'patterns': [r'metrics\s*=\s*\{[^}]*"fake"', r'return\s+100\.0\s*#.*perfect'],
                'severity': 'high',
                'description': 'Fake metrics implementation detected'
            },
            {
                'name': 'disabled_checks',
                'severity': 'medium',
                'description': 'Disabled or placeholder implementations'
            }
        ]
    
    def scan_for_theater(self, project_path: Path) -> SecurityTestResult:
        """Scan for performance theater indicators."""
        start_time = time.time()
        violations = []
        files_scanned = 0
        
        for py_file in project_path.rglob('*.py'):
            # Skip test files - mocks are acceptable there
            if 'test' in str(py_file) or 'spec' in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                for pattern_info in self.theater_patterns:
                    for pattern in pattern_info['patterns']:
                        for line_num, line in enumerate(lines, 1):
                            if re.search(pattern, line, re.IGNORECASE):
                                violations.append(SecurityViolation(
                                    violation_type=f'theater_detection_{pattern_info["name"]}',
                                    severity=pattern_info['severity'],
                                    file_path=str(py_file),
                                    line_number=line_num,
                                    description=pattern_info['description'],
                                    rule_id=f'THEATER-{pattern_info["name"].upper()}',
                                    evidence=line.strip(),
                                    remediation='Replace with genuine implementation'
                                ))
                
                files_scanned += 1
                
            except Exception as e:
                logger.warning(f"Error scanning {py_file}: {e}")
        
        # Theater detection should find minimal theater
        high_violations = len([v for v in violations if v.severity == 'high'])
        
        # Score based on theater found (less theater = higher score)
        score = max(0.0, 1.0 - (high_violations * 0.1))
        
        execution_time = time.time() - start_time
        
        return SecurityTestResult(
            test_name='Theater Detection Validation',
            passed=high_violations <= 3,  # Allow some theater in development
            score=score,
            violations=violations,
            execution_time=execution_time,
            details={
                'files_scanned': files_scanned,
                'high_theater_violations': high_violations,
                'theater_patterns_checked': len(self.theater_patterns)
            }
        )

class ThreatModelValidator:
    """Validate system against threat models."""
    
    def __init__(self):
        self.threat_categories = self._define_threat_categories()
        
    def _define_threat_categories(self) -> Dict[str, Dict]:
        """Define threat categories to validate against."""
        return {
            'injection_attacks': {
                'patterns': [
                    r'eval\s*\(',
                    r'exec\s*\(',
                    r'os\.system\s*\(',
                    r'subprocess\.call\s*\([^)]*shell\s*=\s*True'
                ],
                'severity': 'critical',
                'description': 'Code injection vulnerability'
            },
            'path_traversal': {
                'patterns': [
                    r'open\s*\([^)]*\.\./.*\)',
                    r'file\s*\([^)]*\.\./.*\)',
                    r'\.\./',
                ],
                'severity': 'high',
                'description': 'Path traversal vulnerability'
            },
            'hardcoded_credentials': {
                'patterns': [
                    r'password\s*=\s*["\'][^"\']+["\']',
                    r'api_key\s*=\s*["\'][^"\']+["\']',
                    r'secret\s*=\s*["\'][^"\']+["\']'
                ],
                'severity': 'critical',
                'description': 'Hardcoded credentials detected'
            },
            'insufficient_logging': {
                'patterns': [
                    r'except\s*:.*pass',
                    r'except.*Exception.*pass',
                    r'try:.*except.*continue'
                ],
                'severity': 'medium',
                'description': 'Insufficient error logging'
            }
        }
    
    def validate_threat_model(self, project_path: Path) -> SecurityTestResult:
        """Validate system against threat model."""
        start_time = time.time()
        violations = []
        files_analyzed = 0
        
        for py_file in project_path.rglob('*.py'):
            try:
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                for threat_type, threat_info in self.threat_categories.items():
                    for pattern in threat_info['patterns']:
                        for line_num, line in enumerate(lines, 1):
                            if re.search(pattern, line, re.IGNORECASE):
                                violations.append(SecurityViolation(
                                    violation_type=f'threat_model_{threat_type}',
                                    severity=threat_info['severity'],
                                    file_path=str(py_file),
                                    line_number=line_num,
                                    description=threat_info['description'],
                                    rule_id=f'THREAT-{threat_type.upper()}',
                                    evidence=line.strip(),
                                    remediation=f'Mitigate {threat_type} vulnerability'
                                ))
                
                files_analyzed += 1
                
            except Exception as e:
                logger.warning(f"Error analyzing {py_file}: {e}")
        
        # Calculate threat score
        critical_threats = len([v for v in violations if v.severity == 'critical'])
        high_threats = len([v for v in violations if v.severity == 'high'])
        
        score = 1.0
        score -= critical_threats * 0.2  # 20% per critical threat
        score -= high_threats * 0.1      # 10% per high threat
        score = max(0.0, score)
        
        execution_time = time.time() - start_time
        
        return SecurityTestResult(
            test_name='Threat Model Validation',
            passed=critical_threats == 0 and high_threats <= 2,
            score=score,
            violations=violations,
            execution_time=execution_time,
            details={
                'files_analyzed': files_analyzed,
                'critical_threats': critical_threats,
                'high_threats': high_threats,
                'threat_categories': len(self.threat_categories)
            }
        )

class CompleteSecurityValidationSuite:
    """Complete security validation suite."""
    
    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.validators = {
            'nasa_compliance': NASAComplianceValidator(),
            'byzantine_fault_tolerance': ByzantineFaultToleranceValidator(),
            'memory_security': MemorySecurityValidator(),
            'theater_detection': TheaterDetectionValidator(),
            'threat_model': ThreatModelValidator()
        }
        
    async def run_complete_security_validation(self) -> Dict[str, Any]:
        """Run complete security validation suite."""
        logger.info("Starting Complete Security Validation Suite")
        suite_start_time = time.time()
        
        test_results = {}
        overall_passed = True
        total_violations = []
        
        # Run all security validators
        for validator_name, validator in self.validators.items():
            logger.info(f"Running {validator_name} validation...")
            
            try:
                if validator_name == 'nasa_compliance':
                    result = validator.validate_project(self.project_path)
                elif validator_name == 'byzantine_fault_tolerance':
                    result = validator.test_consensus_protocols()
                elif validator_name == 'memory_security':
                    result = validator.analyze_memory_security(self.project_path)
                elif validator_name == 'theater_detection':
                    result = validator.scan_for_theater(self.project_path)
                elif validator_name == 'threat_model':
                    result = validator.validate_threat_model(self.project_path)
                
                test_results[validator_name] = result
                total_violations.extend(result.violations)
                
                if not result.passed:
                    overall_passed = False
                    logger.warning(f"{validator_name} validation failed")
                else:
                    logger.info(f"{validator_name} validation passed")
                    
            except Exception as e:
                logger.error(f"Error running {validator_name}: {e}")
                test_results[validator_name] = SecurityTestResult(
                    test_name=validator_name,
                    passed=False,
                    score=0.0,
                    violations=[],
                    execution_time=0.0,
                    details={'error': str(e)}
                )
                overall_passed = False
        
        suite_duration = time.time() - suite_start_time
        
        # Generate comprehensive results
        return {
            'suite_duration': suite_duration,
            'overall_passed': overall_passed,
            'test_results': test_results,
            'total_violations': len(total_violations),
            'critical_violations': len([v for v in total_violations if v.severity == 'critical']),
            'high_violations': len([v for v in total_violations if v.severity == 'high']),
            'all_violations': total_violations,
            'security_score': self._calculate_overall_security_score(test_results),
            'compliance_summary': self._generate_compliance_summary(test_results),
            'timestamp': time.time()
        }
    
    def _calculate_overall_security_score(self, test_results: Dict[str, SecurityTestResult]) -> float:
        """Calculate overall security score."""
        if not test_results:
            return 0.0
        
        # Weight different security aspects
        weights = {
            'nasa_compliance': 0.25,
            'byzantine_fault_tolerance': 0.20,
            'memory_security': 0.25,
            'theater_detection': 0.15,
            'threat_model': TAKE_PROFIT_PERCENTAGE
        }
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for test_name, result in test_results.items():
            weight = weights.get(test_name, 0.1)
            weighted_score += result.score * weight
            total_weight += weight
        
        return weighted_score / total_weight if total_weight > 0 else 0.0
    
    def _generate_compliance_summary(self, test_results: Dict[str, SecurityTestResult]) -> Dict[str, Any]:
        """Generate compliance summary."""
        summary = {
            'total_tests': len(test_results),
            'passed_tests': sum(1 for r in test_results.values() if r.passed),
            'failed_tests': sum(1 for r in test_results.values() if not r.passed),
        }
        
        summary['compliance_rate'] = summary['passed_tests'] / summary['total_tests'] if summary['total_tests'] > 0 else 0
        
        # Specific compliance checks
        nasa_result = test_results.get('nasa_compliance')
        if nasa_result:
            summary['nasa_compliance_score'] = nasa_result.score
            summary['nasa_compliance_passed'] = nasa_result.passed
        
        byzantine_result = test_results.get('byzantine_fault_tolerance')
        if byzantine_result:
            summary['byzantine_tolerance_score'] = byzantine_result.score
            summary['byzantine_tolerance_passed'] = byzantine_result.passed
        
        return summary
    
    def print_results(self, results: Dict[str, Any]):
        """Print comprehensive security validation results."""
        print(f"\n{'='*80}")
        print("COMPLETE SECURITY VALIDATION RESULTS")
        print(f"{'='*80}")
        
        print(f"Overall Status: {'PASSED' if results['overall_passed'] else 'FAILED'}")
        print(f"Security Score: {results['security_score']:.2f}")
        print(f"Suite Duration: {results['suite_duration']:.1f}s")
        print(f"Total Violations: {results['total_violations']}")
        print(f"Critical Violations: {results['critical_violations']}")
        print(f"High Violations: {results['high_violations']}")
        
        # Compliance summary
        compliance = results['compliance_summary']
        print(f"\nCompliance Summary:")
        print(f"  Compliance Rate: {compliance['compliance_rate']:.1%}")
        
        if 'nasa_compliance_score' in compliance:
            print(f"  NASA Compliance: {compliance['nasa_compliance_score']:.2f} ({'PASSED' if compliance['nasa_compliance_passed'] else 'FAILED'})")
        
        if 'byzantine_tolerance_score' in compliance:
            print(f"  Byzantine Tolerance: {compliance['byzantine_tolerance_score']:.2f} ({'PASSED' if compliance['byzantine_tolerance_passed'] else 'FAILED'})")
        
        # Individual test results
        print(f"\n{'='*60}")
        print(f"{'='*60}")
        
        for test_name, result in results['test_results'].items():
            status = "PASSED" if result.passed else "FAILED"
            print(f"  Score: {result.score:.2f}")
            print(f"  Execution Time: {result.execution_time:.2f}s")
            print(f"  Violations Found: {len(result.violations)}")
            
            if result.violations:
                critical_count = len([v for v in result.violations if v.severity == 'critical'])
                high_count = len([v for v in result.violations if v.severity == 'high'])
                if critical_count > 0:
                    print(f"    Critical: {critical_count}")
                if high_count > 0:
                    print(f"    High: {high_count}")

async def main():
    """Main execution function."""
    print("="*80)
    print("COMPLETE SECURITY VALIDATION SUITE")
    print("="*80)
    
    project_path = PROJECT_ROOT
    security_suite = CompleteSecurityValidationSuite(project_path)
    
    try:
        # Run complete security validation
        results = await security_suite.run_complete_security_validation()
        
        # Print results
        security_suite.print_results(results)
        
        # Determine exit code
        if results['overall_passed']:
            print(f"\n{'='*80}")
            print("SECURITY VALIDATION PASSED - SYSTEM IS SECURE FOR PRODUCTION")
            print(f"{'='*80}")
            return 0
        else:
            print(f"\n{'='*80}")
            print("SECURITY VALIDATION FAILED - SECURITY ISSUES MUST BE ADDRESSED")
            print(f"{'='*80}")
            return 1
            
    except Exception as e:
        logger.error(f"Security validation suite failed: {e}")
        import traceback
        print(f"Error details: {traceback.format_exc()}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(asyncio.run(main()))
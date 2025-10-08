#!/usr/bin/env python3
"""
DFARS Compliance Detector

Concrete implementation of DFARS (Defense Federal Acquisition Regulation Supplement) 
compliance detection for the analyzer system.

This demonstrates real enterprise integration with specific, testable functionality.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from pathlib import Path
from typing import List, Dict, Any, Set
import ast
import re

# Import from parent modules
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from analyzer.detectors.base import DetectorBase
from analyzer.utils.types import ConnascenceViolation

class DFARSDetector(DetectorBase):
    """
    DFARS compliance detector for defense industry requirements.
    
    Implements DFARS 252.204-7012 - Safeguarding Covered Defense Information
    and other defense industry compliance requirements.
    """
    
    # DFARS violation patterns
    HARDCODED_SECRET_PATTERNS = [
        r'api_key\s*=\s*["\'][^"\']*["\']',
        r'password\s*=\s*["\'][^"\']*["\']',
        r'secret\s*=\s*["\'][^"\']*["\']',
        r'token\s*=\s*["\'][^"\']*["\']',
        r'key\s*=\s*["\']sk-[^"\']*["\']',  # API keys starting with sk-
    ]
    
    WEAK_CRYPTO_ALGORITHMS = [
        'md5', 'sha1', 'des', 'rc4'
    ]
    
    INSECURE_PROTOCOLS = [
        'http://', 'ftp://', 'telnet://'
    ]
    
    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize DFARS detector."""
        super().__init__(file_path, source_lines)
        self.enterprise_enabled = False
        self.enterprise_config = {}
        self.violation_patterns = self._initialize_patterns()
    
    def _initialize_patterns(self) -> Dict[str, Any]:
        """Initialize detection patterns for DFARS compliance."""
        return {
            'hardcoded_secrets': {
                'patterns': self.HARDCODED_SECRET_PATTERNS,
                'severity': 'high',
                'dfars_reference': 'DFARS 252.204-7012',
                'description': 'Hardcoded sensitive information detected'
            },
            'weak_cryptography': {
                'algorithms': self.WEAK_CRYPTO_ALGORITHMS,
                'severity': 'medium',
                'dfars_reference': 'DFARS 252.204-7012',
                'description': 'Weak cryptographic algorithm detected'
            },
            'insecure_transmission': {
                'protocols': self.INSECURE_PROTOCOLS,
                'severity': 'high',
                'dfars_reference': 'DFARS 252.204-7012',
                'description': 'Insecure data transmission protocol detected'
            }
        }
    
    def enable_enterprise_features(self, config: Dict[str, Any]) -> None:
        """Enable enterprise features with configuration."""
        self.enterprise_enabled = True
        self.enterprise_config = config
    
    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """
        Detect DFARS compliance violations in AST.
        
        Args:
            tree: AST tree to analyze
            
        Returns:
            List of DFARS compliance violations
        """
        if not self.enterprise_enabled:
            return []
        
        violations = []
        
        # Collect all source code for pattern matching
        source_code = '\n'.join(self.source_lines) if self.source_lines else ""
        
        # Detect hardcoded secrets
        violations.extend(self._detect_hardcoded_secrets(source_code))
        
        # Detect weak cryptography in AST
        violations.extend(self._detect_weak_cryptography(tree))
        
        # Detect insecure transmission protocols
        violations.extend(self._detect_insecure_transmission(source_code))
        
        return violations
    
    def _detect_hardcoded_secrets(self, source_code: str) -> List[ConnascenceViolation]:
        """Detect hardcoded secrets in source code."""
        violations = []
        pattern_info = self.violation_patterns['hardcoded_secrets']
        
        lines = source_code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for pattern in pattern_info['patterns']:
                if re.search(pattern, line, re.IGNORECASE):
                    violation = ConnascenceViolation(
                        violation_type='dfars_hardcoded_secrets',
                        line_number=line_num,
                        column_number=0,
                        description=f"{pattern_info['description']}: {pattern_info['dfars_reference']}",
                        severity=pattern_info['severity'],
                        file_path=self.file_path
                    )
                    violations.append(violation)
        
        return violations
    
    def _detect_weak_cryptography(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Detect weak cryptographic algorithms in AST."""
        violations = []
        pattern_info = self.violation_patterns['weak_cryptography']
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # Check function calls for weak crypto
                if isinstance(node.func, ast.Attribute):
                    func_name = node.func.attr.lower()
                    if func_name in pattern_info['algorithms']:
                        violation = ConnascenceViolation(
                            violation_type='dfars_weak_cryptography',
                            line_number=getattr(node, 'lineno', 0),
                            column_number=getattr(node, 'col_offset', 0),
                            description=f"{pattern_info['description']}: {func_name} - {pattern_info['dfars_reference']}",
                            severity=pattern_info['severity'],
                            file_path=self.file_path
                        )
                        violations.append(violation)
                elif isinstance(node.func, ast.Name):
                    func_name = node.func.id.lower()
                    if func_name in pattern_info['algorithms']:
                        violation = ConnascenceViolation(
                            violation_type='dfars_weak_cryptography',
                            line_number=getattr(node, 'lineno', 0),
                            column_number=getattr(node, 'col_offset', 0),
                            description=f"{pattern_info['description']}: {func_name} - {pattern_info['dfars_reference']}",
                            severity=pattern_info['severity'],
                            file_path=self.file_path
                        )
                        violations.append(violation)
        
        return violations
    
    def _detect_insecure_transmission(self, source_code: str) -> List[ConnascenceViolation]:
        """Detect insecure data transmission protocols."""
        violations = []
        pattern_info = self.violation_patterns['insecure_transmission']
        
        lines = source_code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for protocol in pattern_info['protocols']:
                if protocol in line.lower():
                    violation = ConnascenceViolation(
                        violation_type='dfars_insecure_transmission',
                        line_number=line_num,
                        column_number=line.lower().find(protocol),
                        description=f"{pattern_info['description']}: {protocol} - {pattern_info['dfars_reference']}",
                        severity=pattern_info['severity'],
                        file_path=self.file_path
                    )
                    violations.append(violation)
        
        return violations
    
    def analyze_from_data(self, collected_data: 'ASTNodeData') -> List[ConnascenceViolation]:
        """
        Analyze DFARS violations from pre-collected AST data.
        
        This method implements the two-phase analysis interface for
        integration with the unified visitor optimization.
        
        Args:
            collected_data: Pre-collected AST data from unified visitor
            
        Returns:
            List of detected DFARS violations
        """
        if not self.enterprise_enabled:
            return []
        
        violations = []
        
        # Analyze hardcoded secrets from collected data
        if hasattr(collected_data, 'dfars_markers'):
            for marker_node, marker_type in collected_data.dfars_markers:
                if marker_type == 'hardcoded_secret':
                    violation = ConnascenceViolation(
                        violation_type='dfars_hardcoded_secrets',
                        line_number=getattr(marker_node, 'lineno', 0),
                        column_number=getattr(marker_node, 'col_offset', 0),
                        description=f"Hardcoded secret detected: DFARS 252.204-7012",
                        severity='high',
                        file_path=self.file_path
                    )
                    violations.append(violation)
        
        # Analyze security patterns from collected data
        if hasattr(collected_data, 'security_patterns'):
            for pattern_node, pattern_type in collected_data.security_patterns:
                if pattern_type in ['weak_crypto', 'insecure_protocol']:
                    severity = 'high' if pattern_type == 'insecure_protocol' else 'medium'
                    violation = ConnascenceViolation(
                        violation_type=f'dfars_{pattern_type}',
                        line_number=getattr(pattern_node, 'lineno', 0),
                        column_number=getattr(pattern_node, 'col_offset', 0),
                        description=f"Security pattern violation: {pattern_type} - DFARS 252.204-7012",
                        severity=severity,
                        file_path=self.file_path
                    )
                    violations.append(violation)
        
        return violations
    
    def validate_compliance(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate DFARS compliance based on analysis results.
        
        This is the main integration point called by the core analyzer.
        
        Args:
            analysis_results: Results from standard analysis
            
        Returns:
            DFARS compliance validation results
        """
        dfars_violations = []
        
        # Extract DFARS-related violations from standard results
        if 'violations' in analysis_results:
            for violation in analysis_results['violations']:
                if hasattr(violation, 'violation_type') and violation.violation_type.startswith('dfars_'):
                    dfars_violations.append({
                        'type': violation.violation_type,
                        'line': violation.line_number,
                        'severity': violation.severity,
                        'message': violation.description,
                        'dfars_reference': 'DFARS 252.204-7012'
                    })
        
        # Calculate compliance score
        total_violations = len(dfars_violations)
        high_severity_violations = len([v for v in dfars_violations if v['severity'] == 'high'])
        
        # Compliance scoring (inverse of violation density)
        if total_violations == 0:
            compliance_score = 1.0
        else:
            # Penalize high-severity violations more heavily
            penalty = (high_severity_violations * 0.2) + (total_violations * 0.1)
            compliance_score = max(0.0, 1.0 - penalty)
        
        compliance_level = 'compliant' if compliance_score >= 0.8 else 'non_compliant'
        
        return {
            'compliance_level': compliance_level,
            'compliance_score': compliance_score,
            'violations': dfars_violations,
            'violation_summary': {
                'total': total_violations,
                'high_severity': high_severity_violations,
                'medium_severity': len([v for v in dfars_violations if v['severity'] == 'medium']),
                'low_severity': len([v for v in dfars_violations if v['severity'] == 'low'])
            },
            'recommendations': self._generate_recommendations(dfars_violations),
            'dfars_version': '252.204-7012',
            'analysis_timestamp': self._get_timestamp()
        }
    
    def _generate_recommendations(self, violations: List[Dict[str, Any]]) -> List[str]:
        """Generate compliance recommendations based on violations."""
        recommendations = []
        
        violation_types = set(v['type'] for v in violations)
        
        if 'dfars_hardcoded_secrets' in violation_types:
            recommendations.append("Use environment variables or secure vaults for sensitive configuration")
            recommendations.append("Implement proper secret management practices")
        
        if 'dfars_weak_cryptography' in violation_types:
            recommendations.append("Replace weak cryptographic algorithms with approved strong algorithms")
            recommendations.append("Use SHA-256 or stronger hash functions")
        
        if 'dfars_insecure_transmission' in violation_types:
            recommendations.append("Use HTTPS/TLS for all network communications")
            recommendations.append("Implement proper certificate validation")
        
        if not recommendations:
            recommendations.append("No specific recommendations - code appears DFARS compliant")
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """Get current timestamp for analysis."""
        from datetime import datetime
        return datetime.now().isoformat()

# Factory function for integration
def create_dfars_detector(file_path: str = "", source_lines: List[str] = None) -> DFARSDetector:
    """Create a DFARS detector instance."""
    return DFARSDetector(file_path, source_lines)

# Integration test function
def test_dfars_detector():
    """Test DFARS detector functionality."""
    test_code = '''
# DFARS compliance test
import hashlib
import requests

# Hardcoded secret - should be detected
api_key = "sk-1234567890abcdef"

# Weak cryptography - should be detected
def weak_hash(data):
    return hashlib.md5(data.encode()).hexdigest()

# Insecure transmission - should be detected
def send_data(data):
    response = requests.post("http://example.com/api", data=data)
    return response.status_code
'''

    # Create detector
    detector = DFARSDetector('test.py', test_code.split('\n'))
    detector.enable_enterprise_features({'level': 'basic'})

    # Parse and analyze
    import ast
    tree = ast.parse(test_code)
    violations = detector.detect_violations(tree)
    
    print(f"Detected {len(violations)} DFARS violations:")
    for violation in violations:
        print(f"  - {violation.violation_type}: {violation.description} (Line {violation.line_number})")
    
    # Test compliance validation
    analysis_results = {'violations': violations}
    compliance = detector.validate_compliance(analysis_results)
    
    print(f"\nDFARS Compliance Results:")
    print(f"  Level: {compliance['compliance_level']}")
    print(f"  Score: {compliance['compliance_score']:.2f}")
    print(f"  Total violations: {compliance['violation_summary']['total']}")

if __name__ == "__main__":
    test_dfars_detector()
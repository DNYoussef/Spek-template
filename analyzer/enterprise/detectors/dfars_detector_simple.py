from src.constants.base import MAXIMUM_RETRY_ATTEMPTS

A concrete, working implementation that demonstrates enterprise integration
without dependency issues.
"""

import ast
import re
from typing import List, Dict, Any
from pathlib import Path

class SimpleDFARSViolation:
    """Simple violation class for DFARS compliance issues."""
    
    def __init__(self, violation_type: str, line_number: int, description: str, severity: str):
        self.violation_type = violation_type
        self.line_number = line_number
        self.description = description
        self.severity = severity

class SimpleDFARSDetector:
    """
    Simplified DFARS compliance detector that works independently.
    
    Demonstrates the concrete implementation patterns for enterprise integration.
    """
    
    # DFARS violation patterns
    HARDCODED_SECRET_PATTERNS = [
        r'api_key\s*=\s*["\'][^"\']*["\']',
        r'password\s*=\s*["\'][^"\']*["\']',
        r'secret\s*=\s*["\'][^"\']*["\']',
        r'token\s*=\s*["\'][^"\']*["\']',
        r'key\s*=\s*["\']sk-[^"\']*["\']',
    ]
    
    WEAK_CRYPTO_ALGORITHMS = ['md5', 'sha1', 'des', 'rc4']
    INSECURE_PROTOCOLS = ['http://', 'ftp://', 'telnet://']
    
    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize simplified DFARS detector."""
        self.file_path = file_path
        self.source_lines = source_lines or []
        self.enterprise_enabled = False
        self.enterprise_config = {}
    
    def enable_enterprise_features(self, config: Dict[str, Any]) -> None:
        """Enable enterprise features with configuration."""
        self.enterprise_enabled = True
        self.enterprise_config = config
        print(f"Enterprise features enabled with config: {config}")
    
    def detect_violations(self, source_code: str) -> List[SimpleDFARSViolation]:
        """
        Detect DFARS compliance violations in source code.
        
        Args:
            source_code: Source code to analyze
            
        Returns:
            List of DFARS compliance violations
        """
        if not self.enterprise_enabled:
            return []
        
        violations = []
        
        # Detect hardcoded secrets
        violations.extend(self._detect_hardcoded_secrets(source_code))
        
        # Detect weak cryptography
        violations.extend(self._detect_weak_cryptography(source_code))
        
        # Detect insecure transmission protocols
        violations.extend(self._detect_insecure_transmission(source_code))
        
        return violations
    
    def _detect_hardcoded_secrets(self, source_code: str) -> List[SimpleDFARSViolation]:
        """Detect hardcoded secrets in source code."""
        violations = []
        
        lines = source_code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for pattern in self.HARDCODED_SECRET_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    violation = SimpleDFARSViolation(
                        violation_type='dfars_hardcoded_secrets',
                        line_number=line_num,
                        description=f"Hardcoded sensitive information detected: DFARS 252.204-7012",
                        severity='high'
                    )
                    violations.append(violation)
        
        return violations
    
    def _detect_weak_cryptography(self, source_code: str) -> List[SimpleDFARSViolation]:
        """Detect weak cryptographic algorithms in source code."""
        violations = []
        
        lines = source_code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for algorithm in self.WEAK_CRYPTO_ALGORITHMS:
                if algorithm in line.lower() and ('hashlib.' + algorithm or algorithm + '(') in line.lower():
                    violation = SimpleDFARSViolation(
                        violation_type='dfars_weak_cryptography',
                        line_number=line_num,
                        description=f"Weak cryptographic algorithm '{algorithm}' detected: DFARS 252.204-7012",
                        severity='medium'
                    )
                    violations.append(violation)
        
        return violations
    
    def _detect_insecure_transmission(self, source_code: str) -> List[SimpleDFARSViolation]:
        """Detect insecure data transmission protocols."""
        violations = []
        
        lines = source_code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for protocol in self.INSECURE_PROTOCOLS:
                if protocol in line.lower():
                    violation = SimpleDFARSViolation(
                        violation_type='dfars_insecure_transmission',
                        line_number=line_num,
                        description=f"Insecure transmission protocol '{protocol}' detected: DFARS 252.204-7012",
                        severity='high'
                    )
                    violations.append(violation)
        
        return violations
    
    def validate_compliance(self, violations: List[SimpleDFARSViolation]) -> Dict[str, Any]:
        """
        Validate DFARS compliance based on detected violations.
        
        This is the main integration point for enterprise analysis.
        
        Args:
            violations: List of detected DFARS violations
            
        Returns:
            DFARS compliance validation results
        """
        total_violations = len(violations)
        high_severity_violations = len([v for v in violations if v.severity == 'high'])
        medium_severity_violations = len([v for v in violations if v.severity == 'medium'])
        
        # Calculate compliance score (inverse of violation density)
        if total_violations == 0:
            compliance_score = 1.0
        else:
            # Penalize high-severity violations more heavily
            penalty = (high_severity_violations * 0.2) + (medium_severity_violations * 0.1)
            compliance_score = max(0.0, 1.0 - penalty)
        
        compliance_level = 'compliant' if compliance_score >= 0.8 else 'non_compliant'
        
        # Generate violation summary
        violation_summary = []
        for violation in violations:
            violation_summary.append({
                'type': violation.violation_type,
                'line': violation.line_number,
                'severity': violation.severity,
                'description': violation.description
            })
        
        return {
            'compliance_level': compliance_level,
            'compliance_score': compliance_score,
            'violations': violation_summary,
            'violation_summary': {
                'total': total_violations,
                'high_severity': high_severity_violations,
                'medium_severity': medium_severity_violations,
                'low_severity': 0  # Not implemented in this simple version
            },
            'recommendations': self._generate_recommendations(violations),
            'dfars_version': '252.204-7012',
            'analysis_timestamp': self._get_timestamp(),
            'analyzer_version': 'SimpleDFARSDetector-1.0'
        }
    
    def _generate_recommendations(self, violations: List[SimpleDFARSViolation]) -> List[str]:
        """Generate compliance recommendations based on violations."""
        recommendations = []
        
        violation_types = set(v.violation_type for v in violations)
        
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

def demonstrate_enterprise_dfars_integration():
    """
    Demonstrate concrete enterprise DFARS integration.
    
    This function shows exactly how enterprise features would integrate
    with the existing analyzer system.
    """
    print("=== Enterprise DFARS Integration Demonstration ===")
    
    # Test code with DFARS violations
    test_code = '''
# DFARS compliance test code
import hashlib
import requests

# VIOLATION 1: Hardcoded API key
api_key = "sk-1234567890abcdef"
database_password = "admin123"

# VIOLATION 2: Weak cryptographic algorithm
def weak_hash(data):
    return hashlib.md5(data.encode()).hexdigest()

# VIOLATION 3: Insecure transmission
def send_data(data):
    response = requests.post("http://example.com/api", data=data)
    return response.status_code

# COMPLIANT: Strong cryptography
def secure_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

# COMPLIANT: Secure transmission
def secure_send_data(data):
    response = requests.post("https://example.com/api", data=data)
    return response.status_code
'''
    
    print("Step 1: Initialize DFARS detector")
    detector = SimpleDFARSDetector('test_dfars.py', test_code.split('\n'))
    
    print("Step 2: Enable enterprise features")
    enterprise_config = {
        'level': 'basic',
        'dfars_version': '252.204-7012',
        'strict_mode': False
    }
    detector.enable_enterprise_features(enterprise_config)
    
    print("Step MAXIMUM_RETRY_ATTEMPTS: Detect DFARS violations")
    violations = detector.detect_violations(test_code)
    
    print(f"\nDetected {len(violations)} DFARS violations:")
    for i, violation in enumerate(violations, 1):
        print(f"  {i}. {violation.violation_type}")
        print(f"     Line: {violation.line_number}")
        print(f"     Severity: {violation.severity}")
        print(f"     Description: {violation.description}")
        print()
    
    print("Step 4: Validate compliance")
    compliance_results = detector.validate_compliance(violations)
    
    print("=== DFARS Compliance Results ===")
    print(f"Compliance Level: {compliance_results['compliance_level']}")
    print(f"Compliance Score: {compliance_results['compliance_score']:.2f}")
    print(f"Total Violations: {compliance_results['violation_summary']['total']}")
    print(f"High Severity: {compliance_results['violation_summary']['high_severity']}")
    print(f"Medium Severity: {compliance_results['violation_summary']['medium_severity']}")
    
    print("\nRecommendations:")
    for i, recommendation in enumerate(compliance_results['recommendations'], 1):
        print(f"  {i}. {recommendation}")
    
    print(f"\nAnalysis completed at: {compliance_results['analysis_timestamp']}")
    print(f"DFARS Version: {compliance_results['dfars_version']}")
    
    print("\n=== Integration Points Demonstrated ===")
    print("1. Enterprise detector instantiation and configuration")
    print("2. Violation detection using concrete patterns")
    print("3. Compliance validation with scoring")
    print("4. Recommendation generation")
    print("5. Result formatting for core analyzer integration")
    
    print("\n[SUCCESS] Enterprise DFARS integration demonstration completed")
    return compliance_results

if __name__ == "__main__":
    demonstrate_enterprise_dfars_integration()
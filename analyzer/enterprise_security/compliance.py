from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Security Compliance Checker
Validates code against security standards and regulations.
"""

from typing import List, Dict, Any, Optional
import json
import os
import re

from dataclasses import dataclass
from enum import Enum

from .scanner import SecurityVulnerability, VulnerabilityType, SecurityLevel

class SecurityStandard(Enum):
    """Security standards and regulations."""
    OWASP_TOP_10 = "owasp_top_10"
    NIST_CYBERSECURITY = "nist_cybersecurity"
    SOX_COMPLIANCE = "sox_compliance"
    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    GDPR = "gdpr"
    ISO_27001 = "iso_27001"

@dataclass
class ComplianceRule:
    """Represents a compliance rule."""
    rule_id: str
    standard: SecurityStandard
    title: str
    description: str
    severity: SecurityLevel
    check_function: str

@dataclass
class ComplianceViolation:
    """Represents a compliance violation."""
    rule: ComplianceRule
    file_path: str
    line_number: int
    description: str
    evidence: Dict[str, Any]
    recommendation: str

class ComplianceChecker:
    """Main compliance checking engine."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.rules = self._load_compliance_rules()

    def _load_compliance_rules(self) -> List[ComplianceRule]:
        """Load compliance rules for various standards."""
        rules = []

        # OWASP Top 10 rules
        rules.extend([
            ComplianceRule(
                rule_id="OWASP-A01",
                standard=SecurityStandard.OWASP_TOP_10,
                title="Broken Access Control",
                description="Check for proper access control implementation",
                severity=SecurityLevel.HIGH,
                check_function="check_access_control"
            ),
            ComplianceRule(
                rule_id="OWASP-A02",
                standard=SecurityStandard.OWASP_TOP_10,
                title="Cryptographic Failures",
                description="Check for proper cryptographic implementation",
                severity=SecurityLevel.HIGH,
                check_function="check_cryptographic_failures"
            ),
            ComplianceRule(
                rule_id="OWASP-A03",
                standard=SecurityStandard.OWASP_TOP_10,
                title="Injection",
                description="Check for injection vulnerabilities",
                severity=SecurityLevel.CRITICAL,
                check_function="check_injection_vulnerabilities"
            ),
            ComplianceRule(
                rule_id="OWASP-A04",
                standard=SecurityStandard.OWASP_TOP_10,
                title="Insecure Design",
                description="Check for insecure design patterns",
                severity=SecurityLevel.HIGH,
                check_function="check_insecure_design"
            ),
            ComplianceRule(
                rule_id="OWASP-A05",
                standard=SecurityStandard.OWASP_TOP_10,
                title="Security Misconfiguration",
                description="Check for security misconfigurations",
                severity=SecurityLevel.MEDIUM,
                check_function="check_security_misconfiguration"
            ),
        ])

        # PCI DSS rules
        rules.extend([
            ComplianceRule(
                rule_id="PCI-DSS-3.4",
                standard=SecurityStandard.PCI_DSS,
                title="Cardholder Data Protection",
                description="Check for proper cardholder data protection",
                severity=SecurityLevel.CRITICAL,
                check_function="check_cardholder_data_protection"
            ),
            ComplianceRule(
                rule_id="PCI-DSS-4.1",
                standard=SecurityStandard.PCI_DSS,
                title="Encryption in Transit",
                description="Check for proper encryption in transit",
                severity=SecurityLevel.HIGH,
                check_function="check_encryption_in_transit"
            ),
        ])

        return rules

    def check_access_control(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for broken access control patterns."""
        violations = []

        # Patterns indicating potential access control issues
        access_patterns = [
            r'@login_required\s*\n\s*def\s+admin_',  # Admin functions should have additional checks
            r'if\s+user\.is_authenticated\s*:',  # Basic auth check, might need role check
            r'request\.user\.is_superuser',  # Direct superuser checks
        ]

        dangerous_patterns = [
            r'disable_authentication',
            r'skip_authorization',
            r'bypass_security',
            r'no_auth_required',
        ]

        for pattern in dangerous_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A01"),
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential access control bypass detected",
                    evidence={"pattern": match.group()},
                    recommendation="Implement proper access control mechanisms"
                ))

        return violations

    def check_cryptographic_failures(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for cryptographic failures."""
        violations = []

        # Weak crypto patterns
        weak_patterns = [
            (r'hashlib\.md5', "MD5 is cryptographically broken"),
            (r'hashlib\.sha1', "SHA1 is deprecated for security use"),
            (r'DES\.new', "DES encryption is weak"),
            (r'RC4', "RC4 cipher is broken"),
            (r'ssl_version\s*=\s*ssl\.PROTOCOL_TLS', "Deprecated SSL protocol"),
        ]

        for pattern, description in weak_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A02"),
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Cryptographic failure: {description}",
                    evidence={"pattern": match.group()},
                    recommendation="Use strong cryptographic algorithms"
                ))

        return violations

    def check_injection_vulnerabilities(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for injection vulnerabilities."""
        violations = []

        # SQL injection patterns
        sql_patterns = [
            r'execute\s*\(\s*["\'].*\%.*["\']',
            r'cursor\.execute\s*\(\s*["\'].*\+.*["\']',
            r'query\s*=\s*["\'].*\%.*["\']',
        ]

        for pattern in sql_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A03"),
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential SQL injection vulnerability",
                    evidence={"pattern": match.group()},
                    recommendation="Use parameterized queries"
                ))

        # Command injection patterns
        command_patterns = [
            r'os\.system\s*\(',
            r'subprocess\.call\s*\(',
            r'eval\s*\(',
            r'exec\s*\(',
        ]

        for pattern in command_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A03"),
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential command injection vulnerability",
                    evidence={"pattern": match.group()},
                    recommendation="Validate input and avoid dynamic execution"
                ))

        return violations

    def check_insecure_design(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for insecure design patterns."""
        violations = []

        # Insecure design patterns
        design_patterns = [
            (r'password\s*=\s*["\'][^"\']{1, 7}["\']', "Weak password policy"),
            (r'session_timeout\s*=\s*0', "Infinite session timeout"),
            (r'debug\s*=\s*True', "Debug mode in production"),
            (r'SECRET_KEY\s*=\s*["\'][^"\']{1, 15}["\']', "Weak secret key"),
        ]

        for pattern, description in design_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A04"),
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Insecure design: {description}",
                    evidence={"pattern": match.group()},
                    recommendation="Follow secure design principles"
                ))

        return violations

    def check_security_misconfiguration(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for security misconfigurations."""
        violations = []

        # Security misconfiguration patterns
        config_patterns = [
            (r'ALLOWED_HOSTS\s*=\s*\[\s*\*\s*\]', "Wildcard in ALLOWED_HOSTS"),
            (r'CORS_ALLOW_ALL_ORIGINS\s*=\s*True', "CORS allows all origins"),
            (r'SSL_VERIFY\s*=\s*False', "SSL verification disabled"),
            (r'verify\s*=\s*False', "SSL verification disabled"),
        ]

        for pattern, description in config_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("OWASP-A05"),
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Security misconfiguration: {description}",
                    evidence={"pattern": match.group()},
                    recommendation="Review and secure configuration"
                ))

        return violations

    def check_cardholder_data_protection(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for PCI DSS cardholder data protection."""
        violations = []

        # Credit card patterns
        cc_patterns = [
            r'\b4[0-9]{12}(?:[0-9]{3})?\b',  # Visa
            r'\b5[1-5][0-9]{14}\b',  # MasterCard
            r'\b3[47][0-9]{13}\b',  # American Express
            r'\b6(?:11|5[0-9]{2})[0-9]{12}\b',  # Discover
        ]

        for pattern in cc_patterns:
            for match in re.finditer(pattern, content):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("PCI-DSS-3.4"),
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential unprotected cardholder data",
                    evidence={"pattern": "Credit card number pattern"},
                    recommendation="Encrypt and protect cardholder data"
                ))

        return violations

    def check_encryption_in_transit(self, file_path: str, content: str) -> List[ComplianceViolation]:
        """Check for proper encryption in transit."""
        violations = []

        # Unencrypted transmission patterns
        unencrypted_patterns = [
            r'http://',  # Unencrypted HTTP
            r'ftp://',  # Unencrypted FTP
            r'telnet://',  # Unencrypted Telnet
            r'smtp\s*=.*:25',  # Unencrypted SMTP
        ]

        for pattern in unencrypted_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(ComplianceViolation(
                    rule=self._get_rule("PCI-DSS-4.1"),
                    file_path=file_path,
                    line_number=line_num,
                    description="Unencrypted data transmission detected",
                    evidence={"pattern": match.group()},
                    recommendation="Use encrypted protocols (HTTPS, SFTP, etc.)"
                ))

        return violations

    def _get_rule(self, rule_id: str) -> ComplianceRule:
        """Get rule by ID."""
        for rule in self.rules:
            if rule.rule_id == rule_id:
                return rule
        return None

    def check_compliance(self, file_path: str, standards: List[SecurityStandard] = None) -> List[ComplianceViolation]:
        """Check compliance against specified standards."""
        if not path_exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return []

        all_violations = []

        # Filter rules by requested standards
        rules_to_check = self.rules
        if standards:
            rules_to_check = [rule for rule in self.rules if rule.standard in standards]

        for rule in rules_to_check:
            check_method = getattr(self, rule.check_function, None)
            if check_method:
                violations = check_method(file_path, content)
                all_violations.extend(violations)

        return all_violations

    def generate_compliance_report(self, violations: List[ComplianceViolation]) -> Dict[str, Any]:
        """Generate compliance report."""
        standard_counts = {}
        severity_counts = {s.value: 0 for s in SecurityLevel}

        for violation in violations:
            standard = violation.rule.standard.value
            standard_counts[standard] = standard_counts.get(standard, 0) + 1
            severity_counts[violation.rule.severity.value] += 1

        return {
            "summary": {
                "total_violations": len(violations),
                "standards_affected": len(standard_counts),
                "compliance_score": max(0, 100 - len(violations) * 5)
            },
            "standard_breakdown": standard_counts,
            "severity_breakdown": severity_counts,
            "violations": [
                {
                    "rule_id": v.rule.rule_id,
                    "standard": v.rule.standard.value,
                    "title": v.rule.title,
                    "severity": v.rule.severity.value,
                    "file": v.file_path,
                    "line": v.line_number,
                    "description": v.description,
                    "evidence": v.evidence,
                    "recommendation": v.recommendation
                }
                for v in violations
            ]
        }
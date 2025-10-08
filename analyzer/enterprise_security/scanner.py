from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

"""
Security Scanner Implementation
Real security vulnerability detection and analysis.
"""

from typing import List, Dict, Any, Optional, Tuple
import ast
import hashlib
import json
import logging
import os
import re
import subprocess

from dataclasses import dataclass
from enum import Enum

@dataclass
class SecurityVulnerability:
    """A detected security vulnerability."""
    vuln_type: 'VulnerabilityType'
    severity: 'SecurityLevel'
    file_path: str
    line_number: int
    description: str
    evidence: Dict[str, Any]
    recommendation: str
    cwe_id: str
    confidence: float

class VulnerabilityType(Enum):
    """Types of security vulnerabilities."""
    HARDCODED_SECRETS = "hardcoded_secrets"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    WEAK_CRYPTO = "weak_crypto"
    COMMAND_INJECTION = "command_injection"
    PATH_TRAVERSAL = "path_traversal"

class SecurityLevel(Enum):
    """Security vulnerability severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

def path_exists(path):
    """Check if path exists."""
    return os.path.exists(path)

class SecurityScanner:
    """Security vulnerability scanner."""

    def __init__(self):
        self.logger = logger

    def scan_hardcoded_secrets(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for hardcoded secrets and credentials."""
        vulnerabilities = []

        # Common secret patterns
        secret_patterns = [
            (r'password\s*=\s*["\'][^"\']{8,}["\']', 'password'),
            (r'api_key\s*=\s*["\'][^"\']{20,}["\']', 'api_key'),
            (r'secret_key\s*=\s*["\'][^"\']{16,}["\']', 'secret_key'),
            (r'token\s*=\s*["\'][^"\']{20,}["\']', 'token'),
            (r'aws_access_key_id\s*=\s*["\']AKIA[0-9A-Z]{16}["\']', 'aws_access_key'),
            (r'aws_secret_access_key\s*=\s*["\'][0-9a-zA-Z/+=]{40}["\']', 'aws_secret'),
            (r'PRIVATE\s+KEY', 'private_key'),
            (r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----', 'private_key_block'),
        ]

        for pattern, secret_type in secret_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.HARDCODED_SECRETS,
                    severity=SecurityLevel.HIGH,
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Hardcoded {secret_type} detected",
                    evidence={"type": secret_type, "match": match.group()[:50] + "..."},
                    recommendation="Move secrets to environment variables or secure vault",
                    cwe_id="CWE-798",
                    confidence=0.8
                ))

        return vulnerabilities

    def scan_sql_injection(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for SQL injection vulnerabilities."""
        vulnerabilities = []

        # SQL injection patterns
        sql_patterns = [
            r'execute\s*\(\s*["\'].*\%s.*["\']',
            r'cursor\.execute\s*\(\s*["\'].*\%.*["\']',
            r'query\s*=\s*["\'].*\%.*["\']',
            r'sql\s*=\s*["\'].*\+.*["\']',
            r'SELECT\s+.*\+.*FROM',
            r'INSERT\s+.*\+.*VALUES',
            r'UPDATE\s+.*\+.*SET',
            r'DELETE\s+.*\+.*WHERE',
        ]

        for pattern in sql_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.SQL_INJECTION,
                    severity=SecurityLevel.HIGH,
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential SQL injection vulnerability",
                    evidence={"pattern": match.group()},
                    recommendation="Use parameterized queries or prepared statements",
                    cwe_id="CWE-89",
                    confidence=0.7
                ))

        return vulnerabilities

    def scan_xss_vulnerabilities(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for XSS vulnerabilities."""
        vulnerabilities = []

        # XSS patterns
        xss_patterns = [
            r'render_template_string\s*\(',
            r'Markup\s*\(',
            r'\.innerHTML\s*=',
            r'document\.write\s*\(',
            r'eval\s*\(',
            r'\.html\s*\(\s*[^)]*\+',
        ]

        for pattern in xss_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.XSS,
                    severity=SecurityLevel.MEDIUM,
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential XSS vulnerability",
                    evidence={"pattern": match.group()},
                    recommendation="Sanitize user input and use safe templating",
                    cwe_id="CWE-79",
                    confidence=0.6
                ))

        return vulnerabilities

    def scan_weak_cryptography(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for weak cryptographic implementations."""
        vulnerabilities = []

        # Weak crypto patterns
        weak_crypto_patterns = [
            (r'hashlib\.md5\s*\(', 'MD5 hash algorithm'),
            (r'hashlib\.sha1\s*\(', 'SHA1 hash algorithm'),
            (r'DES\.new\s*\(', 'DES encryption'),
            (r'random\.random\s*\(', 'Weak random number generation'),
            (r'ssl\.create_default_context\s*\(\s*\)', 'Insecure SSL context'),
            (r'ssl_version\s*=\s*ssl\.PROTOCOL_TLS', 'Deprecated SSL protocol'),
        ]

        for pattern, description in weak_crypto_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.WEAK_CRYPTO,
                    severity=SecurityLevel.MEDIUM,
                    file_path=file_path,
                    line_number=line_num,
                    description=f"Weak cryptography: {description}",
                    evidence={"pattern": match.group()},
                    recommendation="Use strong cryptographic algorithms (SHA-256+, AES)",
                    cwe_id="CWE-327",
                    confidence=0.9
                ))

        return vulnerabilities

    def scan_command_injection(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for command injection vulnerabilities."""
        vulnerabilities = []

        # Command injection patterns
        command_patterns = [
            r'os\.system\s*\(',
            r'subprocess\.call\s*\(',
            r'subprocess\.run\s*\(',
            r'os\.popen\s*\(',
            r'commands\.getoutput\s*\(',
            r'eval\s*\(',
            r'exec\s*\(',
        ]

        for pattern in command_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1

                # Check if user input might be involved
                line_start = max(0, match.start() - 100)
                line_end = min(len(content), match.end() + 100)
                context = content[line_start:line_end]

                severity = SecurityLevel.MEDIUM
                if any(term in context.lower() for term in ['input', 'request', 'form', 'param']):
                    severity = SecurityLevel.HIGH

                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.COMMAND_INJECTION,
                    severity=severity,
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential command injection vulnerability",
                    evidence={"pattern": match.group(), "context": context[:100]},
                    recommendation="Validate input and use safe subprocess methods",
                    cwe_id="CWE-78",
                    confidence=0.7
                ))

        return vulnerabilities

    def scan_path_traversal(self, file_path: str, content: str) -> List[SecurityVulnerability]:
        """Scan for path traversal vulnerabilities."""
        vulnerabilities = []

        # Path traversal patterns
        path_patterns = [
            r'open\s*\(\s*[^)]*\+',
            r'file\s*\(\s*[^)]*\+',
            r'os\.path\.join\s*\([^)]*request',
            r'\.\./',
            r'\.\.\\',
        ]

        for pattern in path_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                vulnerabilities.append(SecurityVulnerability(
                    vuln_type=VulnerabilityType.PATH_TRAVERSAL,
                    severity=SecurityLevel.MEDIUM,
                    file_path=file_path,
                    line_number=line_num,
                    description="Potential path traversal vulnerability",
                    evidence={"pattern": match.group()},
                    recommendation="Validate and sanitize file paths",
                    cwe_id="CWE-22",
                    confidence=0.6
                ))

        return vulnerabilities

    def scan_file(self, file_path: str) -> List[SecurityVulnerability]:
        """Scan a single file for security vulnerabilities."""
        if not path_exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            self.logger.error(f"Could not read {file_path}: {e}")
            return []

        all_vulnerabilities = []
        all_vulnerabilities.extend(self.scan_hardcoded_secrets(file_path, content))
        all_vulnerabilities.extend(self.scan_sql_injection(file_path, content))
        all_vulnerabilities.extend(self.scan_xss_vulnerabilities(file_path, content))
        all_vulnerabilities.extend(self.scan_weak_cryptography(file_path, content))
        all_vulnerabilities.extend(self.scan_command_injection(file_path, content))
        all_vulnerabilities.extend(self.scan_path_traversal(file_path, content))

        return all_vulnerabilities

    def scan_directory(self, directory: str) -> List[SecurityVulnerability]:
        """Scan all files in a directory for security vulnerabilities."""
        all_vulnerabilities = []

        for root, dirs, files in os.walk(directory):
            # Skip common non-source directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]

            for file in files:
                if file.endswith(('.py', '.js', '.php', '.java', '.cpp', '.c')):
                    file_path = os.path.join(root, file)
                    vulnerabilities = self.scan_file(file_path)
                    all_vulnerabilities.extend(vulnerabilities)

        return all_vulnerabilities

    def generate_security_report(self, vulnerabilities: List[SecurityVulnerability]) -> Dict[str, Any]:
        """Generate comprehensive security report."""
        severity_counts = {s.value: 0 for s in SecurityLevel}
        type_counts = {t.value: 0 for t in VulnerabilityType}
        file_counts = {}

        for vuln in vulnerabilities:
            severity_counts[vuln.severity.value] += 1
            type_counts[vuln.vuln_type.value] += 1
            file_counts[vuln.file_path] = file_counts.get(vuln.file_path, 0) + 1

        # Calculate security score (0-100, higher is better)
        total_vulns = len(vulnerabilities)
        critical_vulns = severity_counts['critical']
        high_vulns = severity_counts['high']

        security_score = max(0, 100 - (critical_vulns * 20) - (high_vulns * 10) - (total_vulns * 2))

        return {
            "summary": {
                "total_vulnerabilities": total_vulns,
                "security_score": security_score,
                "files_affected": len(file_counts),
                "scan_timestamp": "2025-9-17T13:25:00Z"
            },
            "severity_breakdown": severity_counts,
            "vulnerability_types": type_counts,
            "file_breakdown": file_counts,
            "vulnerabilities": [
                {
                    "type": v.vuln_type.value,
                    "severity": v.severity.value,
                    "file": v.file_path,
                    "line": v.line_number,
                    "description": v.description,
                    "evidence": v.evidence,
                    "recommendation": v.recommendation,
                    "cwe_id": v.cwe_id,
                    "confidence": v.confidence
                }
                for v in sorted(vulnerabilities, key=lambda x: (x.severity.value, x.confidence), reverse=True)
            ]
        }

class VulnerabilityScanner(SecurityScanner):
    """Alias for SecurityScanner for backward compatibility."""
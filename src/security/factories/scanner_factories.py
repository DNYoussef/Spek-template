from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MINIMUM_TEST_COVERAGE_PERCENTAGE
"""

Factory pattern for creating security scanners and vulnerability detection tools.
Supports different scanner types for various security analysis needs.

Used for:
- Security vulnerability scanning (Batch 8)
- Compliance validation
- Threat detection and analysis
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, Union
from enum import Enum
import logging
from dataclasses import dataclass, asdict
import os
import re
import hashlib
import subprocess
import json
"""

from ...patterns.factory_base import Factory, FactoryRegistry
from ..enhanced_incident_response_system import SecurityIncident, IncidentType, IncidentSeverity
from ...patterns.command_base import Command, CommandResult
"""

logger = logging.getLogger(__name__)

class ScannerType(Enum):
    """Types of security scanners."""
    VULNERABILITY = "vulnerability"
    COMPLIANCE = "compliance"
    MALWARE = "malware"
    NETWORK = "network"
    CRYPTOGRAPHIC = "cryptographic"
    CODE_ANALYSIS = "code_analysis"
    DEPENDENCY = "dependency"
    CONFIGURATION = "configuration"

class SecurityLevel(Enum):
    """Security vulnerability severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class ScanResult:
    """Result of security scan operation."""
    scanner_type: ScannerType
    scan_id: str
    target: str
    vulnerabilities: List['SecurityVulnerability']
    scan_duration: float
    scan_timestamp: float
    metadata: Dict[str, Any]
    compliance_status: Optional[str] = None
    recommendations: List[str] = None

@dataclass
class SecurityVulnerability:
    """Security vulnerability detected during scan."""
    vuln_id: str
    vuln_type: str
    severity: SecurityLevel
    title: str
    description: str
    file_path: Optional[str]
    line_number: Optional[int]
    evidence: Dict[str, Any]
    recommendation: str
    cwe_id: Optional[str]
    cvss_score: Optional[float]
    confidence: float

class SecurityScanner(ABC):
    """Abstract base class for security scanners."""

    def __init__(self, scanner_name: str, scanner_type: ScannerType):
        self.scanner_name = scanner_name
        self.scanner_type = scanner_type
        self.scan_count = 0
        self.vulnerabilities_found = 0

    @abstractmethod
    def scan(self, target: str, options: Optional[Dict[str, Any]] = None) -> ScanResult:
        """Perform security scan on target."""

    @abstractmethod
    def get_supported_targets(self) -> List[str]:
        """Get list of supported target types."""

    def get_scanner_info(self) -> Dict[str, Any]:
        """Get scanner information and statistics."""
        return {
            "scanner_name": self.scanner_name,
            "scanner_type": self.scanner_type.value,
            "scans_performed": self.scan_count,
            "vulnerabilities_found": self.vulnerabilities_found,
            "supported_targets": self.get_supported_targets()
        }

class VulnerabilityScanner(SecurityScanner):
    """Scanner for detecting security vulnerabilities in code."""

    def __init__(self):
        super().__init__("VulnerabilityScanner", ScannerType.VULNERABILITY)
        self.secret_patterns = [
            (r'password\s*=\s*["\'][^"\']{8,}["\']', 'hardcoded_password'),
            (r'api_key\s*=\s*["\'][^"\']{20,}["\']', 'api_key'),
            (r'secret_key\s*=\s*["\'][^"\']{16,}["\']', 'secret_key'),
            (r'token\s*=\s*["\'][^"\']{20,}["\']', 'token'),
            (r'aws_access_key_id\s*=\s*["\']AKIA[0-9A-Z]{16}["\']', 'aws_access_key'),
            (r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----', 'private_key'),
        ]
        self.injection_patterns = [
            (r'execute\s*\(\s*["\'].*\%s.*["\']', 'sql_injection'),
            (r'os\.system\s*\(', 'command_injection'),
            (r'eval\s*\(', 'code_injection'),
            (r'innerHTML\s*=', 'xss_vulnerability'),
        ]

    def scan(self, target: str, options: Optional[Dict[str, Any]] = None) -> ScanResult:
        """Scan target for security vulnerabilities."""
        import time
        start_time = time.time()
        scan_id = f"vuln_scan_{int(start_time)}_{hash(target) & 0xfffff:05x}"
        vulnerabilities = []

        try:
            if os.path.isfile(target):
                vulnerabilities = self._scan_file(target)
            elif os.path.isdir(target):
                vulnerabilities = self._scan_directory(target)
            else:
                raise ValueError(f"Invalid target: {target}")

            self.scan_count += 1
            self.vulnerabilities_found += len(vulnerabilities)

            return ScanResult(
                scanner_type=self.scanner_type,
                scan_id=scan_id,
                target=target,
                vulnerabilities=vulnerabilities,
                scan_duration=time.time() - start_time,
                scan_timestamp=start_time,
                metadata={
                    "patterns_checked": len(self.secret_patterns) + len(self.injection_patterns),
                    "files_scanned": 1 if os.path.isfile(target) else self._count_files(target),
                    "scanner_version": "1.0.0"
                },
                recommendations=self._generate_recommendations(vulnerabilities)
            )

        except Exception as e:
            logger.error(f"Vulnerability scan failed for {target}: {e}")
            raise

    def _scan_file(self, file_path: str) -> List[SecurityVulnerability]:
        """Scan single file for vulnerabilities."""
        vulnerabilities = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Scan for hardcoded secrets
            for pattern, vuln_type in self.secret_patterns:
                for match in re.finditer(pattern, content, re.IGNORECASE):
                    line_num = content[:match.start()].count('\n') + 1
                    vulnerabilities.append(SecurityVulnerability(
                        vuln_id=f"{vuln_type}_{hashlib.sha256(f'{file_path}:{line_num}'.encode()).hexdigest()[:12]}",
                        vuln_type=vuln_type,
                        severity=SecurityLevel.HIGH,
                        title=f"Hardcoded {vuln_type.replace('_', ' ')} detected",
                        description=f"Hardcoded credentials found in {file_path} at line {line_num}",
                        file_path=file_path,
                        line_number=line_num,
                        evidence={"pattern": pattern, "match_text": match.group()[:50] + "..."},
                        recommendation="Move secrets to environment variables or secure vault",
                        cwe_id="CWE-798",
                        cvss_score=7.5,
                        confidence=0.9
                    ))

            # Scan for injection vulnerabilities
            for pattern, vuln_type in self.injection_patterns:
                for match in re.finditer(pattern, content, re.IGNORECASE):
                    line_num = content[:match.start()].count('\n') + 1
                    vulnerabilities.append(SecurityVulnerability(
                        vuln_id=f"{vuln_type}_{hashlib.sha256(f'{file_path}:{line_num}'.encode()).hexdigest()[:12]}",
                        vuln_type=vuln_type,
                        severity=SecurityLevel.HIGH,
                        title=f"{vuln_type.replace('_', ' ').title()} vulnerability",
                        description=f"Potential {vuln_type} found in {file_path} at line {line_num}",
                        file_path=file_path,
                        line_number=line_num,
                        evidence={"pattern": pattern, "match_text": match.group()},
                        recommendation=self._get_injection_recommendation(vuln_type),
                        cwe_id=self._get_cwe_for_injection(vuln_type),
                        cvss_score=8.1,
                        confidence=0.7
                    ))

        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {e}")

        return vulnerabilities

    def _scan_directory(self, directory: str) -> List[SecurityVulnerability]:
        """Scan directory for vulnerabilities."""
        all_vulnerabilities = []

        for root, dirs, files in os.walk(directory):
            # Skip common non-source directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]

            for file in files:
                if file.endswith(('.py', '.js', '.php', '.java', '.cpp', '.c', '.cs', '.rb', '.go')):
                    file_path = os.path.join(root, file)
                    vulnerabilities = self._scan_file(file_path)
                    all_vulnerabilities.extend(vulnerabilities)

        return all_vulnerabilities

    def _count_files(self, directory: str) -> int:
        """Count scannable files in directory."""
        count = 0
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]
            count += len([f for f in files if f.endswith(('.py', '.js', '.php', '.java', '.cpp', '.c', '.cs', '.rb', '.go'))])
        return count

    def _get_injection_recommendation(self, vuln_type: str) -> str:
        """Get recommendation for injection vulnerability type."""
        recommendations = {
            'sql_injection': "Use parameterized queries or prepared statements",
            'command_injection': "Validate input and use safe subprocess methods",
            'code_injection': "Avoid eval() and similar functions; validate all input",
            'xss_vulnerability': "Sanitize user input and use safe templating"
        }
        return recommendations.get(vuln_type, "Validate and sanitize all user input")

    def _get_cwe_for_injection(self, vuln_type: str) -> str:
        """Get CWE ID for injection vulnerability type."""
        cwe_mapping = {
            'sql_injection': "CWE-89",
            'command_injection': "CWE-78",
            'code_injection': "CWE-94",
            'xss_vulnerability': "CWE-79"
        }
        return cwe_mapping.get(vuln_type, "CWE-20")

    def _generate_recommendations(self, vulnerabilities: List[SecurityVulnerability]) -> List[str]:
        """Generate overall recommendations based on vulnerabilities found."""
        recommendations = []

        vuln_types = set(v.vuln_type for v in vulnerabilities)

        if any('secret' in vt or 'password' in vt or 'key' in vt for vt in vuln_types):
            recommendations.append("Implement secrets management solution")
            recommendations.append("Use environment variables for configuration")

        if any('injection' in vt for vt in vuln_types):
            recommendations.append("Implement input validation framework")
            recommendations.append("Use parameterized queries and safe APIs")

        high_severity_count = len([v for v in vulnerabilities if v.severity == SecurityLevel.HIGH])
        if high_severity_count > 10:
            recommendations.append("Consider comprehensive security code review")

        return recommendations

    def get_supported_targets(self) -> List[str]:
        """Get supported target types."""
        return ["file", "directory", "source_code"]

class ComplianceScanner(SecurityScanner):
    """Scanner for compliance validation (DFARS, NIST, etc.)."""

    def __init__(self):
        super().__init__("ComplianceScanner", ScannerType.COMPLIANCE)
        self.compliance_rules = {
            'dfars': [
                ('encryption_at_rest', 'Data must be encrypted at rest'),
                ('access_controls', 'Proper access controls must be implemented'),
                ('audit_logging', 'Comprehensive audit logging required'),
                ('incident_response', 'Incident response procedures must be documented'),
            ],
            'nist': [
                ('password_policy', 'Strong password policy required'),
                ('multi_factor_auth', 'Multi-factor authentication required'),
                ('security_training', 'Security awareness training required'),
                ('vulnerability_management', 'Regular vulnerability assessments required'),
            ]
        }

    def scan(self, target: str, options: Optional[Dict[str, Any]] = None) -> ScanResult:
        """Scan target for compliance violations."""
        import time
        start_time = time.time()
        scan_id = f"compliance_scan_{int(start_time)}_{hash(target) & 0xfffff:05x}"
        vulnerabilities = []
        compliance_framework = options.get('framework', 'dfars') if options else 'dfars'

        try:
            if os.path.isfile(target):
                vulnerabilities = self._scan_file_compliance(target, compliance_framework)
            elif os.path.isdir(target):
                vulnerabilities = self._scan_directory_compliance(target, compliance_framework)

            self.scan_count += 1
            self.vulnerabilities_found += len(vulnerabilities)

            # Calculate compliance score
            total_rules = len(self.compliance_rules.get(compliance_framework, []))
            compliance_violations = len(vulnerabilities)
            compliance_score = max(0, ((total_rules - compliance_violations) / total_rules) * MAXIMUM_FUNCTION_LENGTH_LINES)
            compliance_status = "PASS" if compliance_score >= MINIMUM_TEST_COVERAGE_PERCENTAGE else "FAIL"

            return ScanResult(
                scanner_type=self.scanner_type,
                scan_id=scan_id,
                target=target,
                vulnerabilities=vulnerabilities,
                scan_duration=time.time() - start_time,
                scan_timestamp=start_time,
                metadata={
                    "compliance_framework": compliance_framework,
                    "compliance_score": compliance_score,
                    "total_rules_checked": total_rules,
                    "scanner_version": "1.0.0"
                },
                compliance_status=compliance_status,
                recommendations=self._generate_compliance_recommendations(compliance_framework, vulnerabilities)
            )

        except Exception as e:
            logger.error(f"Compliance scan failed for {target}: {e}")
            raise

    def _scan_file_compliance(self, file_path: str, framework: str) -> List[SecurityVulnerability]:
        """Scan file for compliance violations."""
        vulnerabilities = []
        rules = self.compliance_rules.get(framework, [])

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            for rule_id, description in rules:
                violation = self._check_compliance_rule(file_path, content, rule_id, description)
                if violation:
                    vulnerabilities.append(violation)

        except Exception as e:
            logger.error(f"Error checking compliance for {file_path}: {e}")

        return vulnerabilities

    def _scan_directory_compliance(self, directory: str, framework: str) -> List[SecurityVulnerability]:
        """Scan directory for compliance violations."""
        all_vulnerabilities = []

        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                if file.endswith(('.py', '.js', '.json', '.yaml', '.yml', '.conf', '.config')):
                    file_path = os.path.join(root, file)
                    vulnerabilities = self._scan_file_compliance(file_path, framework)
                    all_vulnerabilities.extend(vulnerabilities)

        return all_vulnerabilities

    def _check_compliance_rule(self, file_path: str, content: str, rule_id: str, description: str) -> Optional[SecurityVulnerability]:
        """Check specific compliance rule against file content."""
        # Simple compliance checks (would be more sophisticated in production)
        violations = {
            'encryption_at_rest': r'password\s*=\s*["\'][^"\']*["\']',  # Unencrypted passwords
            'access_controls': r'chmod\s+777',  # Overly permissive file permissions
            'audit_logging': not re.search(r'log|audit|track', content, re.IGNORECASE),  # Missing logging
            'password_policy': r'password\s*=\s*["\'][^"\']{1, 7}["\']',  # Weak passwords
            'multi_factor_auth': not re.search(r'mfa|2fa|multi.factor|two.factor', content, re.IGNORECASE),
        }

        violation_detected = False
        evidence = {}

        if rule_id in ['audit_logging', 'multi_factor_auth']:
            # These are negative checks (absence of required features)
            violation_detected = violations[rule_id]
            evidence = {"type": "missing_feature", "description": f"No evidence of {rule_id} found"}
        else:
            # Pattern-based checks
            pattern = violations.get(rule_id)
            if pattern and re.search(pattern, content):
                violation_detected = True
                match = re.search(pattern, content)
                line_num = content[:match.start()].count('\n') + 1
                evidence = {"pattern": pattern, "line": line_num, "match": match.group()}

        if violation_detected:
            return SecurityVulnerability(
                vuln_id=f"compliance_{rule_id}_{hashlib.sha256(file_path.encode()).hexdigest()[:12]}",
                vuln_type=f"compliance_violation_{rule_id}",
                severity=SecurityLevel.HIGH,
                title=f"Compliance Violation: {rule_id}",
                description=f"Compliance rule violated: {description}",
                file_path=file_path,
                line_number=evidence.get("line"),
                evidence=evidence,
                recommendation=f"Implement {description}",
                cwe_id="CWE-710",  # Improper adherence to coding standards
                cvss_score=6.0,
                confidence=0.8
            )

        return None

    def _generate_compliance_recommendations(self, framework: str, vulnerabilities: List[SecurityVulnerability]) -> List[str]:
        """Generate compliance recommendations."""
        recommendations = [
            f"Review {framework.upper()} compliance requirements",
            "Implement security controls for identified violations",
            "Document compliance procedures and controls",
            "Regular compliance audits and assessments"
        ]

        violation_types = set(v.vuln_type for v in vulnerabilities)

        if any('encryption' in vt for vt in violation_types):
            recommendations.append("Implement encryption at rest and in transit")

        if any('access_controls' in vt for vt in violation_types):
            recommendations.append("Review and tighten access control policies")

        return recommendations

    def get_supported_targets(self) -> List[str]:
        """Get supported target types."""
        return ["file", "directory", "configuration", "policy_documents"]

class NetworkScanner(SecurityScanner):
    """Scanner for network security analysis."""

    def __init__(self):
        super().__init__("NetworkScanner", ScannerType.NETWORK)
        self.port_scan_tools = ["nmap", "netstat"]
        self.common_vulnerable_ports = [21, 23, 53, 135, 139, 445, 1433, 3389]

    def scan(self, target: str, options: Optional[Dict[str, Any]] = None) -> ScanResult:
        """Scan network target for security issues."""
        import time
        start_time = time.time()
        scan_id = f"network_scan_{int(start_time)}_{hash(target) & 0xfffff:05x}"
        vulnerabilities = []

        try:
            # Simulate network scanning (in production, would use actual tools)
            vulnerabilities = self._simulate_network_scan(target, options or {})

            self.scan_count += 1
            self.vulnerabilities_found += len(vulnerabilities)

            return ScanResult(
                scanner_type=self.scanner_type,
                scan_id=scan_id,
                target=target,
                vulnerabilities=vulnerabilities,
                scan_duration=time.time() - start_time,
                scan_timestamp=start_time,
                metadata={
                    "scan_type": "port_scan",
                    "tools_available": self.port_scan_tools,
                    "vulnerable_ports_checked": len(self.common_vulnerable_ports),
                    "scanner_version": "1.0.0"
                },
                recommendations=self._generate_network_recommendations(vulnerabilities)
            )

        except Exception as e:
            logger.error(f"Network scan failed for {target}: {e}")
            raise

    def _simulate_network_scan(self, target: str, options: Dict[str, Any]) -> List[SecurityVulnerability]:
        """Simulate network security scan."""
        vulnerabilities = []

        # Simulate finding open vulnerable ports
        for port in self.common_vulnerable_ports[:3]:  # Simulate finding 3 vulnerable ports
            vulnerabilities.append(SecurityVulnerability(
                vuln_id=f"open_port_{port}_{hashlib.sha256(f'{target}:{port}'.encode()).hexdigest()[:12]}",
                vuln_type="open_vulnerable_port",
                severity=SecurityLevel.MEDIUM,
                title=f"Vulnerable port {port} open",
                description=f"Port {port} is open and may be vulnerable to attacks",
                file_path=None,
                line_number=None,
                evidence={"port": port, "target": target, "service": self._get_service_name(port)},
                recommendation=f"Close port {port} if not needed, or secure the service",
                cwe_id="CWE-200",
                cvss_score=5.3,
                confidence=0.9
            ))

        return vulnerabilities

    def _get_service_name(self, port: int) -> str:
        """Get service name for port number."""
        services = {
            21: "FTP", 23: "Telnet", 53: "DNS", 135: "RPC",
            139: "NetBIOS", 445: "SMB", 1433: "SQL Server", 3389: "RDP"
        }
        return services.get(port, "Unknown")

    def _generate_network_recommendations(self, vulnerabilities: List[SecurityVulnerability]) -> List[str]:
        """Generate network security recommendations."""
        recommendations = [
            "Implement network segmentation",
            "Use firewall rules to restrict access",
            "Regular port scanning and monitoring",
            "Disable unnecessary services"
        ]

        open_ports = [v.evidence.get("port") for v in vulnerabilities if v.vuln_type == "open_vulnerable_port"]

        if 21 in open_ports or 23 in open_ports:
            recommendations.append("Replace FTP/Telnet with secure alternatives (SFTP/SSH)")

        if 3389 in open_ports:
            recommendations.append("Secure RDP access with VPN and strong authentication")

        return recommendations

    def get_supported_targets(self) -> List[str]:
        """Get supported target types."""
        return ["ip_address", "hostname", "network_range"]

class SecurityScannerFactory(Factory[SecurityScanner]):
    """Factory for creating security scanners."""

    def __init__(self):
        super().__init__("SecurityScannerFactory")

    def _get_base_product_type(self) -> Type:
        """Get base product type for security scanners."""
        return SecurityScanner

    def create_vulnerability_scanner(self, **kwargs) -> VulnerabilityScanner:
        """Create vulnerability scanner."""
        return VulnerabilityScanner()

    def create_compliance_scanner(self, **kwargs) -> ComplianceScanner:
        """Create compliance scanner."""
        return ComplianceScanner()

    def create_network_scanner(self, **kwargs) -> NetworkScanner:
        """Create network scanner."""
        return NetworkScanner()

    def create_scanner_by_type(self, scanner_type: ScannerType, **kwargs) -> SecurityScanner:
        """Create scanner by type enum."""
        scanner_mapping = {
            ScannerType.VULNERABILITY: self.create_vulnerability_scanner,
            ScannerType.COMPLIANCE: self.create_compliance_scanner,
            ScannerType.NETWORK: self.create_network_scanner,
        }

        creator = scanner_mapping.get(scanner_type)
        if not creator:
            raise ValueError(f"Unsupported scanner type: {scanner_type}")

        return creator(**kwargs)

class SecurityScanCommand(Command):
    """Command for executing security scans."""

    def __init__(self, scanner: SecurityScanner, target: str, options: Optional[Dict[str, Any]] = None):
        self.scanner = scanner
        self.target = target
        self.options = options or {}
        self.scan_result: Optional[ScanResult] = None

    def execute(self) -> CommandResult:
        """Execute security scan."""
        try:
            self.scan_result = self.scanner.scan(self.target, self.options)

            return CommandResult(
                success=True,
                data={
                    "scan_id": self.scan_result.scan_id,
                    "scanner_type": self.scan_result.scanner_type.value,
                    "target": self.scan_result.target,
                    "vulnerabilities_found": len(self.scan_result.vulnerabilities),
                    "scan_duration": self.scan_result.scan_duration,
                    "compliance_status": self.scan_result.compliance_status,
                    "recommendations": self.scan_result.recommendations
                },
                metadata={
                    "scan_metadata": self.scan_result.metadata,
                    "scanner_info": self.scanner.get_scanner_info(),
                    "vulnerabilities": [asdict(v) for v in self.scan_result.vulnerabilities]
                }
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Security scan failed: {str(e)}",
                data={"target": self.target, "scanner_type": self.scanner.scanner_type.value}
            )

    def undo(self) -> CommandResult:
        """Undo security scan (cleanup temporary files, etc.)."""
        try:
            # In production, might cleanup scan artifacts, temp files, etc.
            return CommandResult(
                success=True,
                data={"message": "Scan cleanup completed"}
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Scan cleanup failed: {str(e)}"
            )

    def validate(self) -> CommandResult:
        """Validate scan command parameters."""
        errors = []

        if not self.scanner:
            errors.append("Scanner instance required")

        if not self.target:
            errors.append("Scan target required")

        # Validate target based on scanner type
        if self.scanner and self.target:
            supported_targets = self.scanner.get_supported_targets()
            target_type = self._determine_target_type(self.target)

            if target_type not in supported_targets:
                errors.append(f"Target type '{target_type}' not supported by {self.scanner.scanner_name}")

        if errors:
            return CommandResult(success=False, error="; ".join(errors))

        return CommandResult(success=True, data={"validation": "passed"})

    def _determine_target_type(self, target: str) -> str:
        """Determine target type from target string."""
        if os.path.isfile(target):
            return "file"
        elif os.path.isdir(target):
            return "directory"
        elif re.match(r'^(\d+\.){3}\d+$', target):
            return "ip_address"
        elif re.match(r'^[a-zA-Z0-9.-]+$', target):
            return "hostname"
        else:
            return "unknown"

# Initialize factory and register scanners
def create_scanner_factory() -> SecurityScannerFactory:
    """Create and configure security scanner factory."""
    factory = SecurityScannerFactory()

    # Register scanner types
    factory.register_product("vulnerability", VulnerabilityScanner)
    factory.register_product("compliance", ComplianceScanner)
    factory.register_product("network", NetworkScanner)

    return factory

# Example usage and demonstration
if __name__ == "__main__":
    # Create factory
    scanner_factory = create_scanner_factory()

    # Create different types of scanners
    vuln_scanner = scanner_factory.create_product("vulnerability")
    compliance_scanner = scanner_factory.create_product("compliance")
    network_scanner = scanner_factory.create_product("network")

    print("Security Scanner Factory Demonstration")
    print("=" * 50)

    # Display scanner information
    for scanner in [vuln_scanner, compliance_scanner, network_scanner]:
        info = scanner.get_scanner_info()
        print(f"Scanner: {info['scanner_name']}")
        print(f"Type: {info['scanner_type']}")
        print(f"Supported Targets: {', '.join(info['supported_targets'])}")
        print()

    # Example scan commands
    current_dir = os.path.dirname(__file__)

    # Vulnerability scan command
    vuln_command = SecurityScanCommand(vuln_scanner, current_dir)
    print("Validating vulnerability scan...")
    validation = vuln_command.validate()
    print(f"Validation result: {validation.success}")

    if validation.success:
        print("Executing vulnerability scan...")
        result = vuln_command.execute()
        if result.success:
            print(f"Scan completed: {result.data['vulnerabilities_found']} vulnerabilities found")
        else:
            print(f"Scan failed: {result.error}")

    print("\nFactory and Command pattern demonstration completed.")
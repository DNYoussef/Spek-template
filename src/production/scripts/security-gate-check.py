from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES
"""

This script evaluates security scan results and makes gate decisions
for CI/CD pipeline progression based on compliance requirements.
"""

import json
import sys
import argparse
import logging
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from enum import Enum
"""

class Severity(Enum):
    """Security finding severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ComplianceLevel(Enum):
    """Compliance requirement levels"""
    DEFENSE_INDUSTRY = "defense-industry"
    FINANCIAL = "financial"
    STANDARD = "standard"

@dataclass
class SecurityFinding:
    """Represents a security finding from various scanners"""
    severity: Severity
    rule_id: str
    description: str
    file_path: str
    line_number: int
    scanner: str
    cwe_id: str = None
    cvss_score: float = 0.0

@dataclass
class GateThresholds:
    """Security gate thresholds for different compliance levels"""
    max_critical: int
    max_high: int
    max_medium: int
    max_dependencies_high: int
    max_dependencies_critical: int
    nasa_pot10_score_min: float

class SecurityGateChecker:
    """Main security gate checker for trading system"""

    # Compliance thresholds
    THRESHOLDS = {
        ComplianceLevel.DEFENSE_INDUSTRY: GateThresholds(
            max_critical=0,      # Zero tolerance for critical issues
            max_high=0,          # Zero tolerance for high issues
            max_medium=5,        # Maximum 5 medium issues
            max_dependencies_high=0,    # Zero high-severity dependencies
            max_dependencies_critical=0, # Zero critical dependencies
            nasa_pot10_score_min=95.0   # 95% NASA POT10 compliance
        ),
        ComplianceLevel.FINANCIAL: GateThresholds(
            max_critical=0,      # Zero tolerance for critical issues
            max_high=2,          # Maximum 2 high issues
            max_medium=10,       # Maximum 10 medium issues
            max_dependencies_high=2,    # Maximum 2 high-severity dependencies
            max_dependencies_critical=0, # Zero critical dependencies
            nasa_pot10_score_min=90.0   # 90% NASA POT10 compliance
        ),
        ComplianceLevel.STANDARD: GateThresholds(
            max_critical=1,      # Maximum 1 critical issue
            max_high=5,          # Maximum 5 high issues
            max_medium=20,       # Maximum 20 medium issues
            max_dependencies_high=5,    # Maximum 5 high-severity dependencies
            max_dependencies_critical=1, # Maximum 1 critical dependency
            nasa_pot10_score_min=80.0   # 80% NASA POT10 compliance
        )
    }

    # Trading system specific critical rules
    TRADING_CRITICAL_RULES = {
        'financial-sensitive-data-logging',
        'trading-position-size-validation',
        'risk-calculation-without-validation',
        'financial-transaction-without-audit',
        'trading-endpoint-without-auth',
        'unencrypted-sensitive-data-storage',
        'pot10-input-validation-missing',
        'pot10-missing-authentication',
        'pot10-missing-authorization',
        'pot10-command-injection-risk',
        'pot10-path-traversal-risk'
    }

def __init__(self, compliance_level: ComplianceLevel = ComplianceLevel.DEFENSE_INDUSTRY):
        self.compliance_level = compliance_level
        self.thresholds = self.THRESHOLDS[compliance_level]
        self.logger = self._setup_logging()

def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)

def parse_semgrep_results(self, results_file: str) -> List[SecurityFinding]:
        """Parse Semgrep SAST results"""
        findings = []

        try:
            with open(results_file, 'r') as f:
                data = json.load(f)

            for result in data.get('results', []):
                severity = self._map_semgrep_severity(result.get('extra', {}).get('severity', 'INFO'))

                finding = SecurityFinding(
                    severity=severity,
                    rule_id=result.get('check_id', 'unknown'),
                    description=result.get('extra', {}).get('message', 'No description'),
                    file_path=result.get('path', 'unknown'),
                    line_number=result.get('start', {}).get('line', 0),
                    scanner='semgrep',
                    cwe_id=result.get('extra', {}).get('metadata', {}).get('cwe', '')
                )

                findings.append(finding)

        except Exception as e:
            self.logger.error(f"Error parsing Semgrep results: {e}")

        return findings

def parse_dependency_audit(self, audit_file: str) -> List[SecurityFinding]:
        """Parse npm audit dependency results"""
        findings = []

        try:
            with open(audit_file, 'r') as f:
                data = json.load(f)

            for vuln_id, vuln_data in data.get('vulnerabilities', {}).items():
                severity = self._map_npm_severity(vuln_data.get('severity', 'info'))

                finding = SecurityFinding(
                    severity=severity,
                    rule_id=f"npm-{vuln_id}",
                    description=vuln_data.get('title', 'Dependency vulnerability'),
                    file_path='package.json',
                    line_number=0,
                    scanner='npm-audit',
                    cwe_id=vuln_data.get('cwe', ''),
                    cvss_score=float(vuln_data.get('cvss', {}).get('score', 0.0))
                )

                findings.append(finding)

        except Exception as e:
            self.logger.error(f"Error parsing dependency audit: {e}")

        return findings

def calculate_nasa_pot10_score(self, findings: List[SecurityFinding]) -> float:
        """Calculate NASA POT10 compliance score"""
        nasa_rules = [f for f in findings if f.rule_id.startswith('pot10-')]
        total_nasa_rules = 20  # Total POT10 rules

        if not nasa_rules:
            return 60.0  # No NASA POT10 issues found

        # Weight findings by severity
        severity_weights = {
            Severity.CRITICAL: 10,
            Severity.HIGH: 5,
            Severity.MEDIUM: 2,
            Severity.LOW: 1,
            Severity.INFO: 0
        }

        total_weight = sum(severity_weights[f.severity] for f in nasa_rules)
        max_possible_weight = total_nasa_rules * severity_weights[Severity.CRITICAL]

        score = max(0, 100 - (total_weight / max_possible_weight * 100))
        return round(score, 2)

def evaluate_trading_system_risks(self, findings: List[SecurityFinding]) -> Tuple[bool, List[str]]:
        """Evaluate trading system specific security risks"""
        critical_issues = []

        for finding in findings:
            if finding.rule_id in self.TRADING_CRITICAL_RULES:
                critical_issues.append(
                    f"TRADING CRITICAL: {finding.rule_id} in {finding.file_path}:{finding.line_number}"
                )

        # Trading system specific checks
        auth_issues = [f for f in findings if 'auth' in f.rule_id.lower()]
        if len(auth_issues) > 0:
            critical_issues.append(f"Authentication issues found: {len(auth_issues)} instances")

        encryption_issues = [f for f in findings if 'encrypt' in f.rule_id.lower()]
        if len(encryption_issues) > 0:
            critical_issues.append(f"Encryption issues found: {len(encryption_issues)} instances")

        return len(critical_issues) == 0, critical_issues

def check_security_gate(self,
                            sast_file: str,
                            compliance_file: str,
                            nasa_file: str,
                            deps_file: str) -> Tuple[bool, Dict[str, Any]]:
        """Main security gate check function"""

        self.logger.info(f"Starting security gate check with {self.compliance_level.value} compliance")

        # Parse all scan results
        sast_findings = self.parse_semgrep_results(sast_file)
        compliance_findings = self.parse_semgrep_results(compliance_file)
        nasa_findings = self.parse_semgrep_results(nasa_file)
        dependency_findings = self.parse_dependency_audit(deps_file)

        # Combine all findings
        all_findings = sast_findings + compliance_findings + nasa_findings + dependency_findings

        # Count findings by severity
        severity_counts = {
            Severity.CRITICAL: len([f for f in all_findings if f.severity == Severity.CRITICAL]),
            Severity.HIGH: len([f for f in all_findings if f.severity == Severity.HIGH]),
            Severity.MEDIUM: len([f for f in all_findings if f.severity == Severity.MEDIUM]),
            Severity.LOW: len([f for f in all_findings if f.severity == Severity.LOW])
        }

        dependency_critical = len([f for f in dependency_findings if f.severity == Severity.CRITICAL])
        dependency_high = len([f for f in dependency_findings if f.severity == Severity.HIGH])

        # Calculate NASA POT10 score
        nasa_pot10_score = self.calculate_nasa_pot10_score(nasa_findings)

        # Evaluate trading system specific risks
        trading_safe, trading_issues = self.evaluate_trading_system_risks(all_findings)

        # Gate decision logic
        gate_passed = True
        gate_issues = []

        # Check thresholds
        if severity_counts[Severity.CRITICAL] > self.thresholds.max_critical:
            gate_passed = False
            gate_issues.append(f"Critical issues: {severity_counts[Severity.CRITICAL]} > {self.thresholds.max_critical}")

        if severity_counts[Severity.HIGH] > self.thresholds.max_high:
            gate_passed = False
            gate_issues.append(f"High issues: {severity_counts[Severity.HIGH]} > {self.thresholds.max_high}")

        if severity_counts[Severity.MEDIUM] > self.thresholds.max_medium:
            gate_passed = False
            gate_issues.append(f"Medium issues: {severity_counts[Severity.MEDIUM]} > {self.thresholds.max_medium}")

        if dependency_critical > self.thresholds.max_dependencies_critical:
            gate_passed = False
            gate_issues.append(f"Critical dependencies: {dependency_critical} > {self.thresholds.max_dependencies_critical}")

        if dependency_high > self.thresholds.max_dependencies_high:
            gate_passed = False
            gate_issues.append(f"High severity dependencies: {dependency_high} > {self.thresholds.max_dependencies_high}")

        if nasa_pot10_score < self.thresholds.nasa_pot10_score_min:
            gate_passed = False
            gate_issues.append(f"NASA POT10 score: {nasa_pot10_score}% < {self.thresholds.nasa_pot10_score_min}%")

        if not trading_safe:
            gate_passed = False
            gate_issues.extend(trading_issues)

        # Prepare report
        report = {
            'gate_passed': gate_passed,
            'compliance_level': self.compliance_level.value,
            'severity_counts': {s.value: count for s, count in severity_counts.items()},
            'dependency_vulnerabilities': {
                'critical': dependency_critical,
                'high': dependency_high
            },
            'nasa_pot10_score': nasa_pot10_score,
            'trading_system_safe': trading_safe,
            'gate_issues': gate_issues,
            'total_findings': len(all_findings),
            'thresholds': {
                'max_critical': self.thresholds.max_critical,
                'max_high': self.thresholds.max_high,
                'max_medium': self.thresholds.max_medium,
                'max_dependencies_critical': self.thresholds.max_dependencies_critical,
                'max_dependencies_high': self.thresholds.max_dependencies_high,
                'nasa_pot10_score_min': self.thresholds.nasa_pot10_score_min
            }
        }

        return gate_passed, report

def _map_semgrep_severity(self, severity: str) -> Severity:
        """Map Semgrep severity to internal severity"""
        mapping = {
            'ERROR': Severity.HIGH,
            'WARNING': Severity.MEDIUM,
            'INFO': Severity.LOW
        }
        return mapping.get(severity.upper(), Severity.INFO)

def _map_npm_severity(self, severity: str) -> Severity:
        """Map npm audit severity to internal severity"""
        mapping = {
            'critical': Severity.CRITICAL,
            'high': Severity.HIGH,
            'moderate': Severity.MEDIUM,
            'low': Severity.LOW,
            'info': Severity.INFO
        }
        return mapping.get(severity.lower(), Severity.INFO)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='GaryTaleb Security Gate Checker')
    parser.add_argument('--sast', required=True, help='SAST results file (JSON)')
    parser.add_argument('--compliance', required=True, help='Compliance scan results file (JSON)')
    parser.add_argument('--nasa', required=True, help='NASA POT10 scan results file (JSON)')
    parser.add_argument('--deps', required=True, help='Dependency audit results file (JSON)')
    parser.add_argument('--compliance-level',
                        choices=['defense-industry', 'financial', 'standard'],
                        default='defense-industry',
                        help='Compliance level for gate thresholds')
    parser.add_argument('--output', help='Output report file (JSON)')

    args = parser.parse_args()

    # Map compliance level
    compliance_mapping = {
        'defense-industry': ComplianceLevel.DEFENSE_INDUSTRY,
        'financial': ComplianceLevel.FINANCIAL,
        'standard': ComplianceLevel.STANDARD
    }

    checker = SecurityGateChecker(compliance_mapping[args.compliance_level])

    try:
        gate_passed, report = checker.check_security_gate(
            args.sast, args.compliance, args.nasa, args.deps
        )

        # Output report
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(report, f, indent=2)
        else:
            print(json.dumps(report, indent=2))

        # Log results
        if gate_passed:
            checker.logger.info(" Security gate PASSED")
            print("\n SECURITY GATE PASSED")
            print(f"Compliance Level: {args.compliance_level}")
            print(f"NASA POT10 Score: {report['nasa_pot10_score']}%")
            print(f"Total Findings: {report['total_findings']}")
        else:
            checker.logger.error(" Security gate FAILED")
            print("\n SECURITY GATE FAILED")
            print(f"Compliance Level: {args.compliance_level}")
            print(f"NASA POT10 Score: {report['nasa_pot10_score']}%")
            print("Gate Issues:")
            for issue in report['gate_issues']:
                print(f"  - {issue}")

        # Exit with appropriate code
        sys.exit(0 if gate_passed else 1)

    except Exception as e:
        checker.logger.error(f"Security gate check failed: {e}")
        sys.exit(2)

if __name__ == '__main__':
    main()
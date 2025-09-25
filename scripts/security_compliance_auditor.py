#!/usr/bin/env python3
"""
Security Compliance Auditor
Phase 3: Continuous security compliance monitoring and NASA POT10 validation
Target: Maintain 95% NASA compliance and zero critical security findings
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import json
import os
import subprocess
import sys

from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FUNCTION_PARAMETERS, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD

class SecurityComplia, QUALITY_GATE_MINIMUM_PASS_RATE, TAKE_PROFIT_PERCENTAGEnceAuditor:
    """Continuous security compliance monitoring and auditing."""
    
def __init__(self):
        self.nasa_pot10_rules = {
            'rule_3': {'name': 'Assertions', 'weight': 0.2, 'min_score': 0.9},
            'rule_7': {'name': 'Memory Bounds', 'weight': 0.25, 'min_score': 0.95},
            'rule_8': {'name': 'Error Handling', 'weight': 0.2, 'min_score': QUALITY_GATE_MINIMUM_PASS_RATE},
            'rule_9': {'name': 'Loop Bounds', 'weight': TAKE_PROFIT_PERCENTAGE, 'min_score': 0.9},
            'rule_10': {'name': 'Function Size', 'weight': 0.2, 'min_score': 0.8}
        }
        
        self.security_thresholds = {
            'critical_findings_max': 0,        # Zero tolerance
            'high_findings_max': 3,           # Phase 3 limit
            'medium_findings_max': 10,        # Acceptable level
            'secrets_max': 0,                 # Zero tolerance
            'nasa_compliance_min': NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD,     # 92% minimum
            'vulnerability_age_max_days': 30  # Max age for unfixed vulnerabilities
        }
        
        self.audit_results = {
            'timestamp': datetime.now().isoformat(),
            'audit_type': 'security_compliance_continuous',
            'nasa_compliance': {},
            'security_findings': {},
            'vulnerability_analysis': {},
            'compliance_status': {},
            'alerts': [],
            'recommendations': [],
            'overall_compliance_score': 0.0
        }
    
def audit_nasa_pot10_compliance(self) -> Dict[str, Any]:
        """Audit NASA POT10 compliance across the codebase."""
        print("Auditing NASA POT10 compliance...")
        
        nasa_compliance = {
            'rule_scores': {},
            'overall_score': 0.0,
            'compliant': False,
            'violations': [],
            'rule_analysis': {}
        }
        
        # Analyze codebase for NASA POT10 compliance
        source_files = list(Path('.').glob('**/*.py')) + list(Path('.').glob('**/*.js')) + list(Path('.').glob('**/*.ts'))
        
        for rule_id, rule_info in self.nasa_pot10_rules.items():
            rule_score = self._analyze_nasa_rule(rule_id, rule_info, source_files)
            nasa_compliance['rule_scores'][rule_id] = rule_score
            nasa_compliance['rule_analysis'][rule_id] = rule_info
        
        # Calculate weighted overall score
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for rule_id, rule_info in self.nasa_pot10_rules.items():
            rule_score = nasa_compliance['rule_scores'].get(rule_id, {}).get('score', 0.0)
            weight = rule_info['weight']
            total_weighted_score += rule_score * weight
            total_weight += weight
        
        nasa_compliance['overall_score'] = total_weighted_score / total_weight if total_weight > 0 else 0.0
        nasa_compliance['compliant'] = nasa_compliance['overall_score'] >= self.security_thresholds['nasa_compliance_min']
        
        self.audit_results['nasa_compliance'] = nasa_compliance
        return nasa_compliance
    
def _analyze_nasa_rule(self, rule_id: str, rule_info: Dict[str, Any], source_files: List[Path]) -> Dict[str, Any]:
        """Analyze specific NASA POT10 rule compliance."""
        rule_analysis = {
            'rule_id': rule_id,
            'rule_name': rule_info['name'],
            'score': 0.0,
            'violations': [],
            'files_analyzed': 0,
            'compliant_files': 0
        }
        
        violations = []
        compliant_files = 0
        files_analyzed = 0
        
        for source_file in source_files:
            if not source_file.is_file() or source_file.suffix not in ['.py', '.js', '.ts']:
                continue
            
            try:
                with open(source_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                files_analyzed += 1
                file_violations = self._check_nasa_rule_in_file(rule_id, content, source_file)
                
                if not file_violations:
                    compliant_files += 1
                else:
                    violations.extend(file_violations)
                
            except Exception as e:
                print(f'Warning: Could not analyze {source_file}: {e}')
        
        rule_analysis['files_analyzed'] = files_analyzed
        rule_analysis['compliant_files'] = compliant_files
        rule_analysis['violations'] = violations[:20]  # Limit violations for output
        
        # Calculate compliance score
        if files_analyzed > 0:
            rule_analysis['score'] = compliant_files / files_analyzed
        else:
            rule_analysis['score'] = 1.0  # No files to analyze = compliant
        
        return rule_analysis
    
def _check_nasa_rule_in_file(self, rule_id: str, content: str, file_path: Path) -> List[Dict[str, Any]]:
        """Check specific NASA rule violations in a file."""
        violations = []
        lines = content.split('\\n')
        
        if rule_id == 'rule_3':  # Assertions
            # Check for proper assertion usage
            import_lines = [i for i, line in enumerate(lines) if 'assert' in line.lower()]
            function_lines = [i for i, line in enumerate(lines) if 'def ' in line or 'function ' in line]
            
            # Simple heuristic: functions should have assertions or error handling
            for func_line_num in function_lines:
                func_line = lines[func_line_num].strip()
                if len(func_line) > 100:  # Long function - should have assertions
                    # Look for assertions in next 20 lines
                    has_assertion = False
                    for check_line in range(func_line_num, min(len(lines), func_line_num + 20)):
                        if 'assert' in lines[check_line].lower() or 'raise' in lines[check_line].lower():
                            has_assertion = True
                            break
                    
                    if not has_assertion:
                        violations.append({
                            'rule': 'rule_3',
                            'file': str(file_path),
                            'line': func_line_num + 1,
                            'description': 'Function missing assertions or error handling',
                            'severity': 'medium'
                        })
        
        elif rule_id == 'rule_7':  # Memory bounds
            # Check for bounded memory operations
            memory_ops = ['malloc', 'new ', 'append', '.extend(', 'while ', 'for ']
            
            for i, line in enumerate(lines):
                line_lower = line.lower()
                if any(op in line_lower for op in memory_ops):
                    # Check if there's a bounds check nearby
                    has_bounds_check = False
                    check_range = range(max(0, i-3), min(len(lines), i+4))
                    
                    for check_line_num in check_range:
                        check_line = lines[check_line_num].lower()
                        if any(bound in check_line for bound in ['len(', 'size', 'limit', 'max_', 'bound']):
                            has_bounds_check = True
                            break
                    
                    if not has_bounds_check and 'while' in line_lower:
                        violations.append({
                            'rule': 'rule_7',
                            'file': str(file_path),
                            'line': i + 1,
                            'description': 'Potentially unbounded memory operation',
                            'severity': 'high'
                        })
        
        elif rule_id == 'rule_8':  # Error handling
            # Check for proper error handling
            try_blocks = [i for i, line in enumerate(lines) if line.strip().startswith('try:')]
            
            for try_line in try_blocks:
                # Look for corresponding except block
                has_except = False
                for check_line in range(try_line, min(len(lines), try_line + 50)):
                    if lines[check_line].strip().startswith('except'):
                        has_except = True
                        # Check if except block is not empty
                        except_content = lines[check_line + 1:check_line + 5]
                        if all(line.strip() in ['', 'pass'] for line in except_content):
                            violations.append({
                                'rule': 'rule_8',
                                'file': str(file_path),
                                'line': check_line + 1,
                                'description': 'Empty except block - improper error handling',
                                'severity': 'medium'
                            })
                        break
                
                if not has_except:
                    violations.append({
                        'rule': 'rule_8',
                        'file': str(file_path),
                        'line': try_line + 1,
                        'description': 'Try block without except clause',
                        'severity': 'high'
                    })
        
        elif rule_id == 'rule_9':  # Loop bounds
            # Check for bounded loops
            loop_lines = [i for i, line in enumerate(lines) if line.strip().startswith(('for ', 'while '))]
            
            for loop_line in loop_lines:
                line_content = lines[loop_line].lower()
                
                if line_content.strip().startswith('while '):
                    # Check for iteration counter or break condition
                    has_bounds = False
                    loop_body_start = loop_line + 1
                    
                    # Look for bounds in loop body (next 20 lines)
                    for check_line in range(loop_body_start, min(len(lines), loop_body_start + 20)):
                        check_content = lines[check_line].lower()
                        if any(bound in check_content for bound in ['break', 'return', 'continue', 'counter', 'i += ', 'i = i + ', 'limit']):
                            has_bounds = True
                            break
                        # Stop checking if we've left the loop (indentation check)
                        if lines[check_line].strip() and not lines[check_line].startswith(' ') and not lines[check_line].startswith('\\t'):
                            break
                    
                    if not has_bounds:
                        violations.append({
                            'rule': 'rule_9',
                            'file': str(file_path),
                            'line': loop_line + 1,
                            'description': 'While loop without clear termination bounds',
                            'severity': 'high'
                        })
        
        elif rule_id == 'rule_10':  # Function size
            # Check function size limits
            function_starts = []
            for i, line in enumerate(lines):
                if line.strip().startswith('def ') or (line.strip().startswith('function ') and file_path.suffix == '.js'):
                    function_starts.append(i)
            
            for i, func_start in enumerate(function_starts):
                # Find function end (next function or end of file)
                func_end = function_starts[i + 1] if i + 1 < len(function_starts) else len(lines)
                func_length = func_end - func_start
                
                # NASA POT10 recommends functions < 60 lines
                if func_length > 60:
                    violations.append({
                        'rule': 'rule_10',
                        'file': str(file_path),
                        'line': func_start + 1,
                        'description': f'Function too long: {func_length} lines (max 60 recommended)',
                        'severity': 'medium'
                    })
        
        return violations
    
def audit_security_findings(self) -> Dict[str, Any]:
        """Audit security findings from security pipeline."""
        print("Auditing security findings...")
        
        security_findings = {
            'sast_findings': {},
            'dependency_vulnerabilities': {},
            'secrets_detected': {},
            'summary': {
                'critical_count': 0,
                'high_count': 0,
                'medium_count': 0,
                'low_count': 0,
                'secrets_count': 0
            }
        }
        
        # Load security findings from artifacts
        security_artifacts = [
            '.claude/.artifacts/security/sast_analysis.json',
            '.claude/.artifacts/security/supply_chain_analysis.json',
            '.claude/.artifacts/security/secrets_analysis.json',
            '.claude/.artifacts/security/security_gates_report.json'
        ]
        
        for artifact_path in security_artifacts:
            artifact_file = Path(artifact_path)
            if artifact_file.exists():
                try:
                    with open(artifact_file, 'r') as f:
                        artifact_data = json.load(f)
                    
                    # Process SAST findings
                    if 'sast' in artifact_path:
                        findings_summary = artifact_data.get('findings_summary', {})
                        security_findings['sast_findings'] = {
                            'critical': findings_summary.get('critical', 0),
                            'high': findings_summary.get('high', 0),
                            'medium': findings_summary.get('medium', 0),
                            'low': findings_summary.get('low', 0),
                            'findings_detail': artifact_data.get('findings', {})
                        }
                        
                        security_findings['summary']['critical_count'] += findings_summary.get('critical', 0)
                        security_findings['summary']['high_count'] += findings_summary.get('high', 0)
                        security_findings['summary']['medium_count'] += findings_summary.get('medium', 0)
                        security_findings['summary']['low_count'] += findings_summary.get('low', 0)
                    
                    # Process dependency vulnerabilities
                    elif 'supply_chain' in artifact_path:
                        vuln_summary = artifact_data.get('vulnerability_summary', {})
                        security_findings['dependency_vulnerabilities'] = {
                            'critical': vuln_summary.get('critical', 0),
                            'high': vuln_summary.get('high', 0),
                            'medium': vuln_summary.get('medium', 0),
                            'low': vuln_summary.get('low', 0),
                            'vulnerabilities_detail': artifact_data.get('vulnerabilities', {})
                        }
                        
                        security_findings['summary']['critical_count'] += vuln_summary.get('critical', 0)
                        security_findings['summary']['high_count'] += vuln_summary.get('high', 0)
                        security_findings['summary']['medium_count'] += vuln_summary.get('medium', 0)
                        security_findings['summary']['low_count'] += vuln_summary.get('low', 0)
                    
                    # Process secrets detection
                    elif 'secrets' in artifact_path:
                        secrets_summary = artifact_data.get('secrets_summary', {})
                        secrets_count = secrets_summary.get('total_secrets_found', 0)
                        
                        security_findings['secrets_detected'] = {
                            'total_secrets': secrets_count,
                            'files_with_secrets': secrets_summary.get('files_with_secrets', 0),
                            'secret_types': secrets_summary.get('secret_types', [])
                        }
                        
                        security_findings['summary']['secrets_count'] = secrets_count
                        # Secrets are considered critical
                        security_findings['summary']['critical_count'] += secrets_count
                
                except Exception as e:
                    print(f'Warning: Could not load security artifact {artifact_path}: {e}')
        
        self.audit_results['security_findings'] = security_findings
        return security_findings
    
def analyze_vulnerability_trends(self) -> Dict[str, Any]:
        """Analyze vulnerability trends and aging."""
        print("Analyzing vulnerability trends...")
        
        vulnerability_analysis = {
            'trend_analysis': {},
            'aging_vulnerabilities': [],
            'risk_assessment': {},
            'improvement_tracking': {}
        }
        
        # Load historical security data if available
        monitoring_files = list(Path('.claude/.artifacts/monitoring').glob('*security*.json'))
        
        if monitoring_files:
            try:
                # Load most recent security report
                latest_report = max(monitoring_files, key=lambda x: x.stat().st_mtime)
                
                with open(latest_report, 'r') as f:
                    historical_data = json.load(f)
                
                # Analyze trends (simplified - would need more historical data)
                current_findings = self.audit_results.get('security_findings', {}).get('summary', {})
                
                vulnerability_analysis['trend_analysis'] = {
                    'current_critical': current_findings.get('critical_count', 0),
                    'current_high': current_findings.get('high_count', 0),
                    'current_secrets': current_findings.get('secrets_count', 0),
                    'trend_direction': 'stable',  # Would calculate from historical data
                    'data_points': len(monitoring_files)
                }
                
                # Risk assessment
                critical_count = current_findings.get('critical_count', 0)
                high_count = current_findings.get('high_count', 0)
                secrets_count = current_findings.get('secrets_count', 0)
                
                risk_score = (critical_count * MAXIMUM_FUNCTION_PARAMETERS) + (high_count * 5) + (secrets_count * 15)
                
                if risk_score == 0:
                    risk_level = 'very_low'
                elif risk_score <= 5:
                    risk_level = 'low'
                elif risk_score <= 15:
                    risk_level = 'medium'
                elif risk_score <= API_TIMEOUT_SECONDS:
                    risk_level = 'high'
                else:
                    risk_level = 'critical'
                
                vulnerability_analysis['risk_assessment'] = {
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'critical_findings': critical_count,
                    'high_findings': high_count,
                    'secrets_findings': secrets_count
                }
                
            except Exception as e:
                print(f'Warning: Could not analyze vulnerability trends: {e}')
        
        self.audit_results['vulnerability_analysis'] = vulnerability_analysis
        return vulnerability_analysis
    
def calculate_overall_compliance_score(self) -> float:
        """Calculate overall security compliance score."""
        nasa_score = self.audit_results.get('nasa_compliance', {}).get('overall_score', 0.0)
        
        # Security findings penalty
        security_summary = self.audit_results.get('security_findings', {}).get('summary', {})
        critical_count = security_summary.get('critical_count', 0)
        high_count = security_summary.get('high_count', 0)
        secrets_count = security_summary.get('secrets_count', 0)
        
        # Start with NASA compliance as base (60% weight)
        compliance_score = nasa_score * 0.6
        
        # Security findings impact (40% weight)
        security_penalty = 0.0
        
        # Critical findings - major penalty
        if critical_count > 0:
            security_penalty += min(0.4, critical_count * 0.1)  # Up to 40% penalty
        
        # High findings - moderate penalty
        if high_count > 0:
            security_penalty += min(0.2, high_count * 0.05)  # Up to 20% penalty
        
        # Secrets - severe penalty
        if secrets_count > 0:
            security_penalty += min(0.3, secrets_count * 0.15)  # Up to 30% penalty
        
        # Security component score (starts at 40%, minus penalties)
        security_component = max(0.0, 0.4 - security_penalty)
        
        overall_score = compliance_score + security_component
        
        self.audit_results['overall_compliance_score'] = overall_score
        return overall_score
    
def generate_compliance_alerts(self) -> List[Dict[str, Any]]:
        """Generate compliance alerts based on audit results."""
        alerts = []
        
        # NASA compliance alerts
        nasa_compliance = self.audit_results.get('nasa_compliance', {})
        if not nasa_compliance.get('compliant', False):
            alerts.append({
                'type': 'nasa_compliance_failure',
                'severity': 'high',
                'message': f'NASA POT10 compliance below threshold: {nasa_compliance.get("overall_score", 0):.1%}',
                'threshold': f'{self.security_thresholds["nasa_compliance_min"]:.1%}',
                'action': 'review_nasa_compliance_violations'
            })
        
        # Security findings alerts
        security_summary = self.audit_results.get('security_findings', {}).get('summary', {})
        
        if security_summary.get('critical_count', 0) > self.security_thresholds['critical_findings_max']:
            alerts.append({
                'type': 'critical_security_findings',
                'severity': 'critical',
                'message': f'Critical security findings detected: {security_summary["critical_count"]}',
                'threshold': f'Max allowed: {self.security_thresholds["critical_findings_max"]}',
                'action': 'immediate_security_remediation'
            })
        
        if security_summary.get('high_count', 0) > self.security_thresholds['high_findings_max']:
            alerts.append({
                'type': 'high_security_findings',
                'severity': 'high',
                'message': f'High security findings exceed threshold: {security_summary["high_count"]}',
                'threshold': f'Max allowed: {self.security_thresholds["high_findings_max"]}',
                'action': 'schedule_security_fixes'
            })
        
        if security_summary.get('secrets_count', 0) > self.security_thresholds['secrets_max']:
            alerts.append({
                'type': 'secrets_detected',
                'severity': 'critical',
                'message': f'Secrets detected in codebase: {security_summary["secrets_count"]}',
                'threshold': f'Max allowed: {self.security_thresholds["secrets_max"]}',
                'action': 'remove_secrets_immediately'
            })
        
        # Overall compliance alert
        overall_score = self.audit_results.get('overall_compliance_score', 0.0)
        if overall_score < 0.9:  # 90% overall compliance threshold
            severity = 'critical' if overall_score < 0.8 else 'high'
            alerts.append({
                'type': 'overall_compliance_low',
                'severity': severity,
                'message': f'Overall compliance score low: {overall_score:.1%}',
                'threshold': '90% minimum',
                'action': 'comprehensive_security_review'
            })
        
        self.audit_results['alerts'] = alerts
        return alerts
    
def generate_compliance_recommendations(self) -> List[str]:
        """Generate actionable compliance recommendations."""
        recommendations = []
        
        # NASA compliance recommendations
        nasa_compliance = self.audit_results.get('nasa_compliance', {})
        
        for rule_id, rule_score in nasa_compliance.get('rule_scores', {}).items():
            if rule_score.get('score', 1.0) < 0.9:  # Below 90% compliance
                rule_name = self.nasa_pot10_rules[rule_id]['name']
                recommendations.append(f'Improve NASA POT10 {rule_name} compliance - current score: {rule_score.get("score", 0):.1%}')
        
        # Security findings recommendations
        security_summary = self.audit_results.get('security_findings', {}).get('summary', {})
        
        if security_summary.get('critical_count', 0) > 0:
            recommendations.append('PRIORITY 1: Fix all critical security findings immediately')
        
        if security_summary.get('secrets_count', 0) > 0:
            recommendations.append('PRIORITY 1: Remove all secrets from codebase and rotate compromised credentials')
        
        if security_summary.get('high_count', 0) > 3:
            recommendations.append('Prioritize high-severity security findings - target <3 findings')
        
        # Proactive recommendations
        overall_score = self.audit_results.get('overall_compliance_score', 0.0)
        
        if overall_score >= 0.95:
            recommendations.append('Excellent compliance - maintain current security practices')
        elif overall_score >= 0.90:
            recommendations.append('Good compliance - focus on continuous improvement')
        else:
            recommendations.append('Compliance needs improvement - implement security hardening measures')
        
        # Process recommendations
        if not recommendations:
            recommendations.append('Security compliance monitoring healthy - continue regular audits')
        
        self.audit_results['recommendations'] = recommendations
        return recommendations
    
def run_security_compliance_audit(self) -> Dict[str, Any]:
        """Run complete security compliance audit."""
        print("Starting Security Compliance Audit")
        print("=" * 50)
        
        # Run NASA POT10 compliance audit
        nasa_compliance = self.audit_nasa_pot10_compliance()
        
        # Audit security findings
        security_findings = self.audit_security_findings()
        
        # Analyze vulnerability trends
        vulnerability_analysis = self.analyze_vulnerability_trends()
        
        # Calculate overall compliance score
        overall_score = self.calculate_overall_compliance_score()
        
        # Generate alerts
        alerts = self.generate_compliance_alerts()
        
        # Generate recommendations
        recommendations = self.generate_compliance_recommendations()
        
        # Determine compliance status
        compliance_status = {
            'nasa_compliant': nasa_compliance.get('compliant', False),
            'security_compliant': security_findings.get('summary', {}).get('critical_count', 0) == 0,
            'overall_compliant': overall_score >= 0.9,
            'compliance_level': 'excellent' if overall_score >= 0.95 else 'good' if overall_score >= 0.9 else 'needs_improvement'
        }
        
        self.audit_results['compliance_status'] = compliance_status
        
        return self.audit_results

def main():
    """Main security compliance audit execution."""
    print("Phase 3: Security Compliance Auditor")
    print("=" * 50)
    
    auditor = SecurityComplianceAuditor()
    results = auditor.run_security_compliance_audit()
    
    # Save results
    artifacts_dir = Path('.claude/.artifacts/monitoring')
    artifacts_dir.mkdir(exist_ok=True, parents=True)
    
    results_file = artifacts_dir / 'security_compliance_audit.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Print summary
    print("\n" + "=" * 50)
    print("SECURITY COMPLIANCE AUDIT SUMMARY")
    print("=" * 50)
    
    overall_score = results['overall_compliance_score']
    compliance_status = results['compliance_status']
    
    print(f"Overall Compliance Score: {overall_score:.1%}")
    print(f"NASA POT10 Compliant: {'YES' if compliance_status['nasa_compliant'] else 'NO'}")
    print(f"Security Compliant: {'YES' if compliance_status['security_compliant'] else 'NO'}")
    print(f"Compliance Level: {compliance_status['compliance_level'].upper()}")
    
    # Show security summary
    security_summary = results['security_findings']['summary']
    print(f"\\nSecurity Findings Summary:")
    print(f"  Critical: {security_summary['critical_count']}")
    print(f"  High: {security_summary['high_count']}")
    print(f"  Secrets: {security_summary['secrets_count']}")
    
    # Show NASA compliance
    nasa_score = results['nasa_compliance']['overall_score']
    print(f"\\nNASA POT10 Compliance: {nasa_score:.1%}")
    
    # Show alerts
    if results['alerts']:
        print(f"\\nActive Alerts: {len(results['alerts'])}")
        for alert in results['alerts'][:3]:
            print(f"  - {alert['severity'].upper()}: {alert['message']}")
    
    # Show recommendations
    if results['recommendations']:
        print(f"\\nTop Recommendations:")
        for i, rec in enumerate(results['recommendations'][:3], 1):
            print(f"  {i}. {rec}")
    
    print(f"\\nDetailed report saved to: {results_file}")
    
    # Exit with status based on compliance
    if not compliance_status['overall_compliant']:
        sys.exit(1)  # Non-compliant
    else:
        sys.exit(0)  # Compliant

if __name__ == '__main__':
    main()
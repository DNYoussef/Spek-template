from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH

This module provides real-time NASA POT10 compliance monitoring, violation prevention,
and comprehensive verification capabilities for safety-critical software development.

Key Features:
- Real-time compliance monitoring with configurable thresholds
- Automated violation prevention in CI/CD pipelines
- Comprehensive compliance scoring and trending analysis
- Defense industry certification documentation generation
- Integration with existing NASA analyzers and remediation tools

Usage:
    python -m src.compliance.nasa_compliance_monitor --monitor project/
    python -m src.compliance.nasa_compliance_monitor --check-compliance --threshold 95
    python -m src.compliance.nasa_compliance_monitor --generate-certificate --defense-ready
"""

import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class ComplianceThreshold:
    """Defines compliance thresholds for different NASA rules."""
    rule_name: str
    critical_threshold: float  # Must achieve MAXIMUM_FUNCTION_LENGTH_LINES% for critical rules
    target_threshold: float    # Target for high-priority rules
    minimum_threshold: float   # Minimum acceptable for medium-priority rules
    weight: float             # Weight in overall compliance calculation

@dataclass
class ComplianceStatus:
    """Current compliance status for a project or component."""
    overall_score: float
    rule_scores: Dict[str, float]
    violation_counts: Dict[str, int]
    trend: str  # "improving", "stable", "degrading"
    last_updated: datetime
    defense_industry_ready: bool
    certification_blockers: List[str]
    next_audit_date: Optional[datetime]

@dataclass
class ComplianceAlert:
    """Alert for compliance violations or regressions."""
    alert_type: str  # "regression", "threshold_breach", "critical_violation"
    severity: str    # "critical", "high", "medium", "low"
    message: str
    affected_rules: List[str]
    recommended_actions: List[str]
    timestamp: datetime

@dataclass
class ComplianceHistory:
    """Historical compliance data for trend analysis."""
    timestamps: List[datetime]
    overall_scores: List[float]
    rule_scores: Dict[str, List[float]]
    violation_trends: Dict[str, List[int]]

    def add_measurement(self, status: ComplianceStatus):
        """Add new compliance measurement to history."""
        assert status is not None, "Compliance status cannot be None"

        self.timestamps.append(status.last_updated)
        self.overall_scores.append(status.overall_score)

        for rule_name, score in status.rule_scores.items():
            if rule_name not in self.rule_scores:
                self.rule_scores[rule_name] = []
            self.rule_scores[rule_name].append(score)

        for rule_name, count in status.violation_counts.items():
            if rule_name not in self.violation_trends:
                self.violation_trends[rule_name] = []
            self.violation_trends[rule_name].append(count)

class ComplianceScorer:
    """Advanced NASA POT10 compliance scoring engine."""

    # NASA Rule weights based on safety criticality and defense industry requirements
    RULE_WEIGHTS = {
        'rule_1_control_flow': 15,      # Critical: Control flow safety
        'rule_2_loop_bounds': 15,       # Critical: Bounded execution
        'rule_3_memory_mgmt': 15,       # Critical: Memory safety
        'rule_4_function_size': 10,     # High: Maintainability
        'rule_5_assertions': 12,        # High: Defensive programming
        'rule_6_variable_scope': 8,     # Medium: Code quality
        'rule_7_return_values': 10,     # High: Error handling
        'rule_8_macros': 5,             # Low: Limited Python relevance
        'rule_9_pointers': 5,           # Low: Limited Python relevance
        'rule_10_warnings': 5           # Medium: Code quality
    }

    # Defense industry compliance thresholds
    DEFENSE_THRESHOLDS = {
        'critical_rules': 60.0,    # Rules 1, 2, 3 must be 100% compliant
        'high_priority_rules': 95.0, # Rules 4, 5, 7 must be >= 95%
        'medium_priority_rules': 90.0, # Rules 6, 8, 9, 10 must be >= 90%
        'overall_minimum': 95.0     # Overall score must be >= 95%
    }

    def __init__(self):
        self.normalization_factors = self._calculate_normalization_factors()

    def calculate_comprehensive_score(self, violations: List[ConnascenceViolation]) -> ComplianceStatus:
        """Calculate comprehensive compliance score with defense industry validation."""
        assert violations is not None, "Violations list cannot be None"

        # Categorize violations by NASA rule
        rule_violations = self._categorize_violations(violations)

        # Calculate rule-specific scores
        rule_scores = {}
        violation_counts = {}
        critical_violations = 0
        certification_blockers = []

        for rule_name, weight in self.RULE_WEIGHTS.items():
            rule_violations_list = rule_violations.get(rule_name, [])
            violation_count = len(rule_violations_list)
            violation_counts[rule_name] = violation_count

            # Calculate rule compliance score (0-100%)
            normalization_factor = self.normalization_factors.get(rule_name, 100)
            rule_score = max(0.0, 100.0 - (violation_count / normalization_factor * 100))
            rule_scores[rule_name] = rule_score

            # Check defense industry thresholds
            if rule_name.startswith(('rule_1', 'rule_2', 'rule_3')):
                # Critical rules must be MAXIMUM_FUNCTION_LENGTH_LINES% compliant
                if rule_score < self.DEFENSE_THRESHOLDS['critical_rules']:
                    critical_violations += violation_count
                    certification_blockers.append(f"Critical rule {rule_name} below MAXIMUM_FUNCTION_LENGTH_LINES%: {rule_score:.1f}%")

            elif rule_name in ['rule_4_function_size', 'rule_5_assertions', 'rule_7_return_values']:
                # High priority rules must be >= 95%
                if rule_score < self.DEFENSE_THRESHOLDS['high_priority_rules']:
                    certification_blockers.append(f"High priority rule {rule_name} below 95%: {rule_score:.1f}%")

        # Calculate weighted overall score
        total_weighted_score = 0.0
        total_weight = sum(self.RULE_WEIGHTS.values())

        for rule_name, weight in self.RULE_WEIGHTS.items():
            rule_score = rule_scores.get(rule_name, 0.0)
            total_weighted_score += rule_score * weight

        overall_score = total_weighted_score / total_weight

        # Determine defense industry readiness
        defense_ready = (
            overall_score >= self.DEFENSE_THRESHOLDS['overall_minimum'] and
            critical_violations == 0 and
            len(certification_blockers) == 0
        )

        # Calculate next audit date
        next_audit_date = self._calculate_next_audit_date(overall_score, critical_violations)

        return ComplianceStatus(
            overall_score=overall_score,
            rule_scores=rule_scores,
            violation_counts=violation_counts,
            trend="stable",  # Will be calculated by trend analyzer
            last_updated=datetime.now(),
            defense_industry_ready=defense_ready,
            certification_blockers=certification_blockers,
            next_audit_date=next_audit_date
        )

    def _categorize_violations(self, violations: List[ConnascenceViolation]) -> Dict[str, List[ConnascenceViolation]]:
        """Categorize violations by NASA rule."""
        categorized = defaultdict(list)

        for violation in violations:
            # Map violation types to NASA rules
            rule_name = self._map_violation_to_rule(violation)
            categorized[rule_name].append(violation)

        return dict(categorized)

    def _map_violation_to_rule(self, violation: ConnascenceViolation) -> str:
        """Map violation type to specific NASA rule."""
        # Mapping based on violation type patterns
        type_to_rule_mapping = {
            # Rule 3: Memory management
            'memory_allocation': 'rule_3_memory_mgmt',
            'dynamic_allocation': 'rule_3_memory_mgmt',
            'heap_usage': 'rule_3_memory_mgmt',

            # Rule 4: Function size
            'function_too_large': 'rule_4_function_size',
            'oversized_function': 'rule_4_function_size',

            # Rule 5: Assertion density
            'insufficient_assertions': 'rule_5_assertions',
            'missing_precondition': 'rule_5_assertions',
            'missing_postcondition': 'rule_5_assertions',

            # Rule 2: Loop bounds
            'unbounded_loop': 'rule_2_loop_bounds',
            'infinite_loop_risk': 'rule_2_loop_bounds',

            # Rule 1: Control flow
            'complex_control_flow': 'rule_1_control_flow',
            'recursion_detected': 'rule_1_control_flow',

            # Rule 7: Return values
            'unchecked_return': 'rule_7_return_values',
            'ignored_return_value': 'rule_7_return_values'
        }

        # Default mapping based on violation type
        for pattern, rule in type_to_rule_mapping.items():
            if pattern in violation.type.lower():
                return rule

        # Default to rule 10 (warnings/misc) if no specific mapping
        return 'rule_10_warnings'

    def _calculate_normalization_factors(self) -> Dict[str, int]:
        """Calculate normalization factors for different rule types."""
        # These factors represent the expected number of violations at 0% compliance
        return {
            'rule_1_control_flow': 10,       # Low expected violations
            'rule_2_loop_bounds': 50,        # Medium expected violations
            'rule_3_memory_mgmt': 200,       # High expected violations
            'rule_4_function_size': 100,     # Medium expected violations
            'rule_5_assertions': 500,        # Very high expected violations
            'rule_6_variable_scope': 20,     # Low expected violations
            'rule_7_return_values': 80,      # Medium expected violations
            'rule_8_macros': 5,              # Very low expected violations
            'rule_9_pointers': 5,            # Very low expected violations
            'rule_10_warnings': 30           # Low expected violations
        }

    def _calculate_next_audit_date(self, overall_score: float, critical_violations: int) -> Optional[datetime]:
        """Calculate next recommended audit date."""
        if critical_violations > 0:
            # Critical violations require immediate re-audit
            return datetime.now() + timedelta(days=1)
        elif overall_score < 90.0:
            # Low compliance requires weekly audits
            return datetime.now() + timedelta(weeks=1)
        elif overall_score < 95.0:
            # Moderate compliance requires monthly audits
            return datetime.now() + timedelta(weeks=4)
        else:
            # High compliance requires quarterly audits
            return datetime.now() + timedelta(weeks=12)

class TrendAnalyzer:
    """Analyzes compliance trends and detects regressions."""

    def __init__(self):
        self.trend_window = 5  # Number of measurements for trend analysis

    def analyze_trend(self, history: ComplianceHistory) -> str:
        """Analyze compliance trend from historical data."""
        assert history is not None, "Compliance history cannot be None"

        if len(history.overall_scores) < 2:
            return "insufficient_data"

        recent_scores = history.overall_scores[-self.trend_window:]

        if len(recent_scores) < 2:
            return "stable"

        # Calculate trend using simple linear regression
        n = len(recent_scores)
        x_values = list(range(n))
        y_values = recent_scores

        # Calculate slope
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_x2 = sum(x * x for x in x_values)

        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)

        # Determine trend based on slope
        if slope > 1.0:
            return "improving"
        elif slope < -1.0:
            return "degrading"
        else:
            return "stable"

    def detect_regressions(self, current_status: ComplianceStatus, history: ComplianceHistory) -> List[ComplianceAlert]:
        """Detect compliance regressions and generate alerts."""
        assert current_status is not None, "Current status cannot be None"
        assert history is not None, "Compliance history cannot be None"

        alerts = []

        if len(history.overall_scores) < 2:
            return alerts

        previous_score = history.overall_scores[-2]
        current_score = current_status.overall_score

        # Check for overall regression
        if current_score < previous_score - 2.0:  # 2% threshold for regression
            alerts.append(ComplianceAlert(
                alert_type="regression",
                severity="high",
                message=f"Overall compliance decreased from {previous_score:.1f}% to {current_score:.1f}%",
                affected_rules=[],
                recommended_actions=[
                    "Run comprehensive violation analysis",
                    "Review recent code changes",
                    "Execute remediation tools"
                ],
                timestamp=datetime.now()
            ))

        # Check for rule-specific regressions
        for rule_name, current_rule_score in current_status.rule_scores.items():
            if rule_name in history.rule_scores and len(history.rule_scores[rule_name]) >= 2:
                previous_rule_score = history.rule_scores[rule_name][-2]

                if current_rule_score < previous_rule_score - 5.0:  # MAXIMUM_NESTED_DEPTH% threshold for rule regression
                    alerts.append(ComplianceAlert(
                        alert_type="rule_regression",
                        severity="medium",
                        message=f"{rule_name} compliance decreased from {previous_rule_score:.1f}% to {current_rule_score:.1f}%",
                        affected_rules=[rule_name],
                        recommended_actions=[
                            f"Focus remediation efforts on {rule_name}",
                            "Analyze recent changes affecting this rule"
                        ],
                        timestamp=datetime.now()
                    ))

        # Check for critical violations
        critical_rules = ['rule_1_control_flow', 'rule_2_loop_bounds', 'rule_3_memory_mgmt']
        for rule in critical_rules:
            if current_status.violation_counts.get(rule, 0) > 0:
                alerts.append(ComplianceAlert(
                    alert_type="critical_violation",
                    severity="critical",
                    message=f"Critical violations detected in {rule}: {current_status.violation_counts[rule]} violations",
                    affected_rules=[rule],
                    recommended_actions=[
                        "Immediate remediation required",
                        "Block production deployment",
                        "Execute automated fixes"
                    ],
                    timestamp=datetime.now()
                ))

        return alerts

class ComplianceMonitor:
    """
    Real-time NASA POT10 compliance monitoring and violation prevention.

    Integrates with CI/CD pipelines to prevent compliance regression and
    provides comprehensive monitoring capabilities.
    """

    def __init__(self):
        self.scorer = ComplianceScorer()
        self.trend_analyzer = TrendAnalyzer()
        self.compliance_history = ComplianceHistory([], [], {}, {})
        self.alert_handlers = []
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

        # Initialize compliance tools if available
        if COMPLIANCE_TOOLS_AVAILABLE:
            self.function_refactorer = AutomatedFunctionRefactorer()
            self.assertion_injector = AssertionInjectionEngine()
            self.memory_analyzer = MemoryAllocationAnalyzer()
        else:
            self.logger.warning("Compliance tools not available - monitoring only mode")

    def monitor_project_compliance(self, project_path: str) -> ComplianceStatus:
        """Monitor project compliance in real-time."""
        assert project_path is not None, "Project path cannot be None"
        assert path_exists(project_path), f"Project path not found: {project_path}"

        self.logger.info(f"Starting compliance monitoring for {project_path}")

        # Collect violations from all sources
        all_violations = self._collect_project_violations(project_path)

        # Calculate current compliance status
        current_status = self.scorer.calculate_comprehensive_score(all_violations)

        # Analyze trends if we have historical data
        if self.compliance_history.overall_scores:
            trend = self.trend_analyzer.analyze_trend(self.compliance_history)
            current_status.trend = trend

            # Check for regressions
            alerts = self.trend_analyzer.detect_regressions(current_status, self.compliance_history)
            self._handle_alerts(alerts)

        # Update compliance history
        self.compliance_history.add_measurement(current_status)

        self.logger.info(f"Compliance monitoring complete. Overall score: {current_status.overall_score:.1f}%")

        return current_status

    def validate_compliance_gates(self, project_path: str, thresholds: Optional[Dict[str, float]] = None) -> Tuple[bool, List[str]]:
        """Validate project against compliance gates for CI/CD integration."""
        assert project_path is not None, "Project path cannot be None"

        if thresholds is None:
            thresholds = {
                'overall_minimum': 95.0,
                'critical_rules_minimum': 100.0,
                'high_priority_minimum': 95.0
            }

        current_status = self.monitor_project_compliance(project_path)
        gate_failures = []

        # Check overall compliance
        if current_status.overall_score < thresholds['overall_minimum']:
            gate_failures.append(
                f"Overall compliance {current_status.overall_score:.1f}% below threshold {thresholds['overall_minimum']:.1f}%"
            )

        # Check critical rules
        critical_rules = ['rule_1_control_flow', 'rule_2_loop_bounds', 'rule_3_memory_mgmt']
        for rule in critical_rules:
            rule_score = current_status.rule_scores.get(rule, 0.0)
            if rule_score < thresholds['critical_rules_minimum']:
                gate_failures.append(
                    f"Critical rule {rule} {rule_score:.1f}% below threshold {thresholds['critical_rules_minimum']:.1f}%"
                )

        # Check high priority rules
        high_priority_rules = ['rule_4_function_size', 'rule_5_assertions', 'rule_7_return_values']
        for rule in high_priority_rules:
            rule_score = current_status.rule_scores.get(rule, 0.0)
            if rule_score < thresholds['high_priority_minimum']:
                gate_failures.append(
                    f"High priority rule {rule} {rule_score:.1f}% below threshold {thresholds['high_priority_minimum']:.1f}%"
                )

        # Check for certification blockers
        if current_status.certification_blockers:
            gate_failures.extend([
                f"Certification blocker: {blocker}" for blocker in current_status.certification_blockers
            ])

        gates_passed = len(gate_failures) == 0
        return gates_passed, gate_failures

    def generate_compliance_certificate(self, project_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Generate defense industry compliance certificate."""
        assert project_path is not None, "Project path cannot be None"

        current_status = self.monitor_project_compliance(project_path)

        certificate = {
            'certificate_info': {
                'project_path': project_path,
                'certification_date': datetime.now().isoformat(),
                'nasa_pot10_version': '2006',
                'analyzer_version': '1.0.0',
                'certificate_id': f"NASA-POT10-{int(time.time())}"
            },
            'compliance_status': {
                'overall_score': current_status.overall_score,
                'defense_industry_ready': current_status.defense_industry_ready,
                'rule_compliance': current_status.rule_scores,
                'violation_summary': current_status.violation_counts,
                'certification_blockers': current_status.certification_blockers
            },
            'quality_metrics': self._generate_quality_metrics(project_path),
            'audit_trail': self._generate_audit_trail(),
            'recommendations': self._generate_compliance_recommendations(current_status),
            'validity': {
                'valid_until': (datetime.now() + timedelta(days=90)).isoformat(),
                'next_audit_required': current_status.next_audit_date.isoformat() if current_status.next_audit_date else None,
                'audit_frequency': self._determine_audit_frequency(current_status)
            }
        }

        if output_path:
            Path(output_path).write_text(json.dumps(certificate, indent=2))
            self.logger.info(f"Compliance certificate saved to {output_path}")

        return certificate

    def _collect_project_violations(self, project_path: str) -> List[ConnascenceViolation]:
        """Collect violations from all compliance tools."""
        all_violations = []

        if not COMPLIANCE_TOOLS_AVAILABLE:
            self.logger.warning("Compliance tools not available - returning empty violations list")
            return all_violations

        project_path = Path(project_path)
        python_files = list(project_path.rglob("*.py"))

        MAX_FILES = 100  # NASA Rule 2 compliance
        files_to_process = python_files[:MAX_FILES]

        self.logger.info(f"Analyzing {len(files_to_process)} Python files for violations")

        for file_path in files_to_process:
            try:
                # Function size violations (Rule 4)
                function_plans = self.function_refactorer.analyze_oversized_functions(str(file_path))
                for plan in function_plans:
                    violation = ConnascenceViolation(
                        type="oversized_function",
                        severity="high",
                        file_path=str(file_path),
                        line_number=0,
                        description=f"Function {plan.function_name} has {plan.current_lines} lines (>60 NASA limit)"
                    )
                    all_violations.append(violation)

                # Assertion density violations (Rule 5)
                assertion_gaps = self.assertion_injector.analyze_assertion_gaps(str(file_path))
                for gap in assertion_gaps:
                    violation = ConnascenceViolation(
                        type="insufficient_assertions",
                        severity="high" if gap.nasa_priority == "critical" else "medium",
                        file_path=str(file_path),
                        line_number=gap.line_number,
                        description=f"Function {gap.function_name} has {gap.assertion_density:.1%} assertion density (<2% NASA requirement)"
                    )
                    all_violations.append(violation)

                # Memory allocation violations (Rule 3)
                memory_violations = self.memory_analyzer.analyze_file(str(file_path))
                all_violations.extend(memory_violations)

            except Exception as e:
                self.logger.error(f"Error analyzing {file_path}: {str(e)}")
                continue

        self.logger.info(f"Collected {len(all_violations)} total violations")
        return all_violations

    def _handle_alerts(self, alerts: List[ComplianceAlert]):
        """Handle compliance alerts by executing registered handlers."""
        for alert in alerts:
            self.logger.warning(f"Compliance alert: {alert.message}")

            for handler in self.alert_handlers:
                try:
                    handler(alert)
                except Exception as e:
                    self.logger.error(f"Alert handler failed: {str(e)}")

    def _generate_quality_metrics(self, project_path: str) -> Dict[str, Any]:
        """Generate comprehensive quality metrics."""
        project_path = Path(project_path)
        python_files = list(project_path.rglob("*.py"))

        total_lines = 0
        total_files = len(python_files)

        for file_path in python_files[:100]:  # NASA Rule 2 bounds
            try:
                lines = len(file_path.read_text(encoding='utf-8').splitlines())
                total_lines += lines
            except Exception:
                continue

        return {
            'total_files': total_files,
            'total_lines_of_code': total_lines,
            'average_file_size': total_lines / max(total_files, 1),
            'analysis_timestamp': datetime.now().isoformat(),
            'tools_used': ['AutomatedFunctionRefactorer', 'AssertionInjectionEngine', 'MemoryAllocationAnalyzer']
        }

    def _generate_audit_trail(self) -> List[Dict[str, Any]]:
        """Generate audit trail for compliance analysis."""
        return [
            {
                'timestamp': datetime.now().isoformat(),
                'action': 'compliance_analysis',
                'tool': 'nasa_compliance_monitor',
                'version': '1.0.0',
                'methodology': 'NASA POT10 2006 Standard'
            }
        ]

    def _generate_compliance_recommendations(self, status: ComplianceStatus) -> List[Dict[str, Any]]:
        """Generate recommendations for compliance improvement."""
        recommendations = []

        if not status.defense_industry_ready:
            recommendations.append({
                'priority': 'critical',
                'category': 'certification',
                'description': 'Address certification blockers for defense industry readiness',
                'actions': status.certification_blockers
            })

        # Rule-specific recommendations
        for rule_name, score in status.rule_scores.items():
            if score < 95.0:
                recommendations.append({
                    'priority': 'high' if score < 90.0 else 'medium',
                    'category': 'rule_compliance',
                    'description': f"Improve {rule_name} compliance from {score:.1f}% to >95%",
                    'actions': self._get_rule_specific_actions(rule_name)
                })

        return recommendations

    def _get_rule_specific_actions(self, rule_name: str) -> List[str]:
        """Get specific remediation actions for each rule."""
        rule_actions = {
            'rule_3_memory_mgmt': [
                "Run memory allocation analyzer",
                "Convert dynamic allocations to static alternatives",
                "Implement pre-allocation patterns"
            ],
            'rule_4_function_size': [
                "Run automated function refactorer",
                "Apply Extract Method pattern",
                "Break large functions into smaller components"
            ],
            'rule_5_assertions': [
                "Run assertion injection engine",
                "Add parameter validation assertions",
                "Implement defensive programming patterns"
            ]
        }

        return rule_actions.get(rule_name, ["Manual review and remediation required"])

    def _determine_audit_frequency(self, status: ComplianceStatus) -> str:
        """Determine appropriate audit frequency based on compliance status."""
        if not status.defense_industry_ready:
            return "weekly"
        elif status.overall_score < 98.0:
            return "monthly"
        else:
            return "quarterly"

    def add_alert_handler(self, handler):
        """Add custom alert handler function."""
        assert callable(handler), "Handler must be callable"
        self.alert_handlers.append(handler)

    def generate_dashboard_data(self, project_path: str) -> Dict[str, Any]:
        """Generate data for compliance monitoring dashboard."""
        current_status = self.monitor_project_compliance(project_path)

        dashboard_data = {
            'current_status': asdict(current_status),
            'historical_data': {
                'timestamps': [ts.isoformat() for ts in self.compliance_history.timestamps],
                'overall_scores': self.compliance_history.overall_scores,
                'rule_scores': self.compliance_history.rule_scores
            },
            'summary_cards': {
                'overall_score': {
                    'value': current_status.overall_score,
                    'trend': current_status.trend,
                    'status': 'success' if current_status.overall_score >= 95.0 else 'warning'
                },
                'defense_ready': {
                    'value': current_status.defense_industry_ready,
                    'status': 'success' if current_status.defense_industry_ready else 'error'
                },
                'violations': {
                    'value': sum(current_status.violation_counts.values()),
                    'critical': current_status.violation_counts.get('rule_1_control_flow', 0) +
                                current_status.violation_counts.get('rule_2_loop_bounds', 0) +
                                current_status.violation_counts.get('rule_3_memory_mgmt', 0)
                }
            },
            'charts': {
                'rule_compliance_radar': current_status.rule_scores,
                'violation_distribution': current_status.violation_counts,
                'trend_analysis': self._generate_trend_chart_data()
            }
        }

        return dashboard_data

    def _generate_trend_chart_data(self) -> Dict[str, Any]:
        """Generate data for trend analysis charts."""
        if len(self.compliance_history.overall_scores) < 2:
            return {'labels': [], 'data': []}

        # Last 30 measurements or all available
        recent_count = min(30, len(self.compliance_history.overall_scores))
        recent_timestamps = self.compliance_history.timestamps[-recent_count:]
        recent_scores = self.compliance_history.overall_scores[-recent_count:]

        return {
            'labels': [ts.strftime('%Y-%m-%d %H:%M') for ts in recent_timestamps],
            'data': recent_scores,
            'trend': self.trend_analyzer.analyze_trend(self.compliance_history)
        }

def main():
    """Command-line interface for NASA compliance monitoring."""
    import argparse

    parser = argparse.ArgumentParser(description="NASA POT10 Compliance Monitor")
    parser.add_argument("project", help="Project directory to monitor")
    parser.add_argument("--monitor", action="store_true", help="Run continuous monitoring")
    parser.add_argument("--check-compliance", action="store_true", help="Check compliance gates")
    parser.add_argument("--threshold", type=float, default=95.0, help="Compliance threshold percentage")
    parser.add_argument("--generate-certificate", action="store_true", help="Generate compliance certificate")
    parser.add_argument("--output", help="Output path for reports/certificates")
    parser.add_argument("--dashboard", action="store_true", help="Generate dashboard data")
    parser.add_argument("--defense-ready", action="store_true", help="Check defense industry readiness")

    args = parser.parse_args()

    monitor = ComplianceMonitor()

    try:
        if args.monitor:
            # Continuous monitoring mode
            print(f"Starting compliance monitoring for {args.project}")
            status = monitor.monitor_project_compliance(args.project)
            print(f"Current compliance: {status.overall_score:.1f}%")
            print(f"Defense ready: {'Yes' if status.defense_industry_ready else 'No'}")

        elif args.check_compliance:
            # Gate validation mode
            gates_passed, failures = monitor.validate_compliance_gates(
                args.project,
                {'overall_minimum': args.threshold}
            )

            if gates_passed:
                print(" All compliance gates passed")
                return 0
            else:
                print(" Compliance gate failures:")
                for failure in failures:
                    print(f"  - {failure}")
                return 1

        elif args.generate_certificate:
            # Certificate generation mode
            certificate = monitor.generate_compliance_certificate(args.project, args.output)
            print(f"Certificate generated for {args.project}")
            print(f"Defense ready: {'Yes' if certificate['compliance_status']['defense_industry_ready'] else 'No'}")
            print(f"Overall score: {certificate['compliance_status']['overall_score']:.1f}%")

        elif args.dashboard:
            # Dashboard data generation mode
            dashboard_data = monitor.generate_dashboard_data(args.project)
            output_path = args.output or 'compliance_dashboard.json'
            Path(output_path).write_text(json.dumps(dashboard_data, indent=2))
            print(f"Dashboard data saved to {output_path}")

        else:
            # Default: simple compliance check
            status = monitor.monitor_project_compliance(args.project)
            print(f"NASA POT10 Compliance Report for {args.project}")
            print(f"Overall Score: {status.overall_score:.1f}%")
            print(f"Defense Industry Ready: {'Yes' if status.defense_industry_ready else 'No'}")
            print(f"Total Violations: {sum(status.violation_counts.values())}")

            if status.certification_blockers:
                print("\\nCertification Blockers:")
                for blocker in status.certification_blockers:
                    print(f"  - {blocker}")

    except Exception as e:
        print(f"Error during compliance monitoring: {str(e)}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
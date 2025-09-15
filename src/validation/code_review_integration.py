"""
Code Review Integration for Theater Detection
Integrates theater detection with code review processes and compliance workflows.
"""

import json
import subprocess
import tempfile
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import logging

from .enterprise_theater_detector import EnterpriseTheaterDetector, QualityMetrics
from .reality_validation_engine import RealityValidationEngine, CodeMetrics
from .defense_evidence_collector import DefenseEvidenceCollector
from .enterprise_detector_modules import EnterpriseDetectorOrchestrator

@dataclass
class ReviewCheckResult:
    """Result of code review theater detection check."""
    check_name: str
    passed: bool
    severity: str  # 'info', 'warning', 'error', 'critical'
    message: str
    details: Dict[str, Any]
    recommendations: List[str]
    evidence_links: List[str]

@dataclass
class CodeReviewReport:
    """Comprehensive code review report with theater detection."""
    pull_request_id: str
    commit_hash: str
    author: str
    timestamp: datetime
    theater_detected: bool
    overall_risk_level: str  # 'low', 'medium', 'high', 'critical'
    validation_passed: bool
    compliance_status: str  # 'compliant', 'non_compliant', 'needs_review'
    check_results: List[ReviewCheckResult]
    evidence_package_id: Optional[str]
    deployment_recommendation: str  # 'approve', 'conditional', 'block'
    reviewer_notes: str

class CodeReviewIntegration:
    """
    Integrates theater detection with code review processes.
    Provides automated quality gates and compliance validation.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._get_default_config()
        self.logger = self._setup_logging()

        # Initialize detection components
        self.theater_detector = EnterpriseTheaterDetector(config)
        self.validation_engine = RealityValidationEngine(config)
        self.evidence_collector = DefenseEvidenceCollector(config)
        self.detector_orchestrator = EnterpriseDetectorOrchestrator(config)

        # Quality gates configuration
        self.quality_gates = self.config.get('quality_gates', {})

    def _get_default_config(self) -> Dict:
        """Default configuration for code review integration."""
        return {
            'quality_gates': {
                'theater_detection_threshold': 0.7,
                'validation_confidence_threshold': 0.6,
                'evidence_requirement_threshold': 0.8,
                'compliance_score_threshold': 0.8,
                'max_theater_patterns': 2,
                'required_evidence_types': [
                    'code_change',
                    'metric_improvement',
                    'test_result'
                ]
            },
            'integration_settings': {
                'auto_block_high_theater': True,
                'require_manual_review_threshold': 0.5,
                'auto_approve_threshold': 0.9,
                'evidence_collection_enabled': True,
                'compliance_validation_enabled': True
            },
            'notification_settings': {
                'notify_on_theater_detection': True,
                'notify_on_validation_failure': True,
                'notify_on_compliance_issues': True,
                'notification_channels': ['github_comment', 'slack', 'email']
            },
            'review_policies': {
                'require_reviewer_for_theater': True,
                'auto_assign_security_reviewer': True,
                'escalate_compliance_issues': True,
                'block_deployment_on_critical': True
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for code review integration."""
        logger = logging.getLogger('CodeReviewIntegration')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [REVIEW] %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def analyze_pull_request(self,
                           pr_id: str,
                           commit_hash: str,
                           author: str,
                           base_branch: str = 'main') -> CodeReviewReport:
        """
        Analyze a pull request for theater patterns and quality issues.

        Args:
            pr_id: Pull request identifier
            commit_hash: Commit hash to analyze
            author: Author of the changes
            base_branch: Base branch for comparison

        Returns:
            CodeReviewReport with analysis results
        """

        self.logger.info(f"Starting theater detection analysis for PR {pr_id} by {author}")

        try:
            # Step 1: Extract changes and metrics
            change_data = self._extract_change_data(commit_hash, base_branch)
            metrics_data = self._extract_metrics_data(commit_hash, base_branch)

            # Step 2: Run theater detection pipeline
            detection_results = self._run_detection_pipeline(change_data, metrics_data)

            # Step 3: Run quality gate checks
            check_results = self._run_quality_gate_checks(detection_results, change_data, metrics_data)

            # Step 4: Collect evidence if enabled
            evidence_package_id = None
            if self.config['integration_settings']['evidence_collection_enabled']:
                evidence_package_id = self._collect_review_evidence(
                    detection_results, change_data, metrics_data, pr_id, commit_hash
                )

            # Step 5: Generate final assessment
            final_assessment = self._generate_final_assessment(
                detection_results, check_results, evidence_package_id
            )

            # Step 6: Create comprehensive report
            report = CodeReviewReport(
                pull_request_id=pr_id,
                commit_hash=commit_hash,
                author=author,
                timestamp=datetime.now(timezone.utc),
                theater_detected=final_assessment['theater_detected'],
                overall_risk_level=final_assessment['risk_level'],
                validation_passed=final_assessment['validation_passed'],
                compliance_status=final_assessment['compliance_status'],
                check_results=check_results,
                evidence_package_id=evidence_package_id,
                deployment_recommendation=final_assessment['deployment_recommendation'],
                reviewer_notes=final_assessment['reviewer_notes']
            )

            # Step 7: Send notifications if configured
            self._send_notifications(report)

            self.logger.info(f"Completed analysis for PR {pr_id}: "
                           f"Theater={report.theater_detected}, "
                           f"Risk={report.overall_risk_level}, "
                           f"Recommendation={report.deployment_recommendation}")

            return report

        except Exception as e:
            self.logger.error(f"Analysis failed for PR {pr_id}: {e}")
            return self._create_error_report(pr_id, commit_hash, author, str(e))

    def _extract_change_data(self, commit_hash: str, base_branch: str) -> Dict[str, Any]:
        """Extract code changes from git commit."""

        try:
            # Get diff for the commit
            diff_cmd = f"git diff {base_branch}..{commit_hash}"
            result = subprocess.run(
                diff_cmd.split(),
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )

            if result.returncode != 0:
                raise RuntimeError(f"Git diff failed: {result.stderr}")

            # Get list of changed files
            files_cmd = f"git diff --name-only {base_branch}..{commit_hash}"
            files_result = subprocess.run(
                files_cmd.split(),
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )

            changed_files = files_result.stdout.strip().split('\n') if files_result.stdout.strip() else []

            # Get detailed changes for each file
            files_changed = []
            for file_path in changed_files:
                if not file_path:
                    continue

                file_diff_cmd = f"git diff {base_branch}..{commit_hash} -- {file_path}"
                file_diff_result = subprocess.run(
                    file_diff_cmd.split(),
                    capture_output=True,
                    text=True,
                    cwd=os.getcwd()
                )

                if file_diff_result.returncode == 0:
                    # Count lines added/removed
                    diff_lines = file_diff_result.stdout.split('\n')
                    lines_added = len([line for line in diff_lines if line.startswith('+')])
                    lines_removed = len([line for line in diff_lines if line.startswith('-')])

                    files_changed.append({
                        'file_path': file_path,
                        'diff': file_diff_result.stdout,
                        'lines_added': lines_added,
                        'lines_removed': lines_removed,
                        'change_type': self._classify_file_change(file_path, file_diff_result.stdout)
                    })

            return {
                'files_changed': files_changed,
                'total_files': len(files_changed),
                'total_changes': sum(f['lines_added'] + f['lines_removed'] for f in files_changed),
                'commit_hash': commit_hash,
                'base_branch': base_branch
            }

        except Exception as e:
            self.logger.error(f"Failed to extract change data: {e}")
            return {
                'files_changed': [],
                'total_files': 0,
                'total_changes': 0,
                'commit_hash': commit_hash,
                'base_branch': base_branch,
                'error': str(e)
            }

    def _extract_metrics_data(self, commit_hash: str, base_branch: str) -> Dict[str, Any]:
        """Extract quality metrics for before/after comparison."""

        try:
            # This would typically integrate with existing metrics tools
            # For now, we'll provide a structure for metrics extraction

            # Run metrics analysis on current commit
            current_metrics = self._run_metrics_analysis(commit_hash)

            # Run metrics analysis on base branch
            base_metrics = self._run_metrics_analysis(base_branch)

            return {
                'current_metrics': current_metrics,
                'base_metrics': base_metrics,
                'metrics_available': True,
                'analysis_timestamp': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            self.logger.warning(f"Metrics extraction failed: {e}")
            return {
                'current_metrics': self._get_default_metrics(),
                'base_metrics': self._get_default_metrics(),
                'metrics_available': False,
                'error': str(e)
            }

    def _run_metrics_analysis(self, ref: str) -> Dict[str, Any]:
        """Run metrics analysis on a specific git reference."""

        # This is a placeholder for actual metrics integration
        # In practice, this would run tools like:
        # - pylint/flake8 for Python code quality
        # - pytest with coverage for test metrics
        # - bandit for security analysis
        # - radon for complexity analysis

        try:
            # Example: Run basic Python code analysis
            metrics = {
                'cyclomatic_complexity': 15.0,  # Would come from radon
                'maintainability_index': 70.0,   # Would come from radon
                'test_coverage': 0.75,           # Would come from pytest-cov
                'security_score': 85.0,          # Would come from bandit
                'code_quality_score': 80.0,      # Would come from pylint
                'performance_score': 75.0,       # Would come from performance tests
                'lines_of_code': 1000,          # Would come from cloc
                'technical_debt_ratio': 0.25     # Would come from SonarQube
            }

            return metrics

        except Exception as e:
            self.logger.warning(f"Metrics analysis failed for {ref}: {e}")
            return self._get_default_metrics()

    def _get_default_metrics(self) -> Dict[str, Any]:
        """Get default metrics when analysis fails."""
        return {
            'cyclomatic_complexity': 10.0,
            'maintainability_index': 70.0,
            'test_coverage': 0.7,
            'security_score': 80.0,
            'code_quality_score': 75.0,
            'performance_score': 70.0,
            'lines_of_code': 1000,
            'technical_debt_ratio': 0.3
        }

    def _classify_file_change(self, file_path: str, diff_content: str) -> str:
        """Classify the type of change in a file."""

        file_path_lower = file_path.lower()

        # Test files
        if any(indicator in file_path_lower for indicator in ['test_', '_test.', 'tests/', '/test/']):
            return 'test'

        # Documentation files
        if any(ext in file_path_lower for ext in ['.md', '.rst', '.txt', '.doc']):
            return 'documentation'

        # Configuration files
        if any(ext in file_path_lower for ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg']):
            return 'configuration'

        # Source code files
        if any(ext in file_path_lower for ext in ['.py', '.js', '.java', '.cpp', '.c', '.go', '.rs']):
            # Analyze diff content for more specific classification
            if 'class ' in diff_content or 'def ' in diff_content:
                return 'structural'
            elif '# ' in diff_content or '"""' in diff_content:
                return 'documentation_inline'
            else:
                return 'source_code'

        return 'other'

    def _run_detection_pipeline(self, change_data: Dict, metrics_data: Dict) -> Dict[str, Any]:
        """Run the complete theater detection pipeline."""

        results = {}

        try:
            # Convert metrics to required format
            if metrics_data.get('metrics_available', False):
                before_metrics = self._convert_to_quality_metrics(metrics_data['base_metrics'])
                after_metrics = self._convert_to_quality_metrics(metrics_data['current_metrics'])
            else:
                # Use default metrics if not available
                before_metrics = QualityMetrics(15.0, 0.7, 25, 70.0, 80.0, 65.0, 0.3)
                after_metrics = QualityMetrics(15.0, 0.7, 25, 70.0, 80.0, 65.0, 0.3)

            # 1. Theater pattern detection
            theater_patterns = self.theater_detector.analyze_change_set(
                before_metrics,
                after_metrics,
                change_data['files_changed'],
                'pr_analysis'
            )

            results['theater_patterns'] = theater_patterns
            results['theater_report'] = self.theater_detector.generate_theater_report(theater_patterns)

            # 2. Detector modules
            detector_results = self.detector_orchestrator.run_all_detectors(
                change_data,
                {
                    'complexity_before': before_metrics.cyclomatic_complexity,
                    'complexity_after': after_metrics.cyclomatic_complexity,
                    'coverage_before': before_metrics.code_coverage,
                    'coverage_after': after_metrics.code_coverage
                }
            )

            results['detector_results'] = detector_results

            # 3. Reality validation
            reality_before = self._convert_to_code_metrics(before_metrics)
            reality_after = self._convert_to_code_metrics(after_metrics)

            validation_result = self.validation_engine.validate_completion_claim(
                reality_before,
                reality_after,
                "Code review validation",
                change_data['files_changed'],
                ['code quality improvement']
            )

            results['validation_result'] = validation_result

            # 4. Overall assessment
            results['overall_theater_detected'] = (
                len(theater_patterns) > 0 or
                detector_results.get('overall_theater_detected', False) or
                not validation_result.is_genuine
            )

            results['overall_confidence'] = min(
                results['theater_report'].get('confidence', 0.5),
                detector_results.get('overall_confidence', 0.5),
                validation_result.confidence
            )

        except Exception as e:
            self.logger.error(f"Detection pipeline failed: {e}")
            results = {
                'theater_patterns': [],
                'theater_report': {'theater_detected': False, 'confidence': 0.0},
                'detector_results': {'overall_theater_detected': False, 'overall_confidence': 0.0},
                'validation_result': None,
                'overall_theater_detected': False,
                'overall_confidence': 0.0,
                'error': str(e)
            }

        return results

    def _run_quality_gate_checks(self,
                                detection_results: Dict,
                                change_data: Dict,
                                metrics_data: Dict) -> List[ReviewCheckResult]:
        """Run quality gate checks based on detection results."""

        checks = []

        # Check 1: Theater Detection Threshold
        theater_confidence = detection_results.get('overall_confidence', 0.0)
        theater_detected = detection_results.get('overall_theater_detected', False)
        theater_threshold = self.quality_gates['theater_detection_threshold']

        if theater_detected and theater_confidence >= theater_threshold:
            checks.append(ReviewCheckResult(
                check_name='theater_detection',
                passed=False,
                severity='error',
                message=f"Theater patterns detected with {theater_confidence:.1%} confidence",
                details={
                    'confidence': theater_confidence,
                    'patterns': len(detection_results.get('theater_patterns', [])),
                    'threshold': theater_threshold
                },
                recommendations=[
                    "Review changes for genuine improvements",
                    "Ensure metrics improvements are backed by substantial code changes",
                    "Consider refactoring approach for better quality"
                ],
                evidence_links=[]
            ))
        else:
            checks.append(ReviewCheckResult(
                check_name='theater_detection',
                passed=True,
                severity='info',
                message="No significant theater patterns detected",
                details={'confidence': theater_confidence},
                recommendations=[],
                evidence_links=[]
            ))

        # Check 2: Validation Confidence
        validation_result = detection_results.get('validation_result')
        validation_threshold = self.quality_gates['validation_confidence_threshold']

        if validation_result:
            if not validation_result.is_genuine or validation_result.confidence < validation_threshold:
                checks.append(ReviewCheckResult(
                    check_name='reality_validation',
                    passed=False,
                    severity='warning',
                    message=f"Reality validation failed or low confidence ({validation_result.confidence:.1%})",
                    details={
                        'is_genuine': validation_result.is_genuine,
                        'confidence': validation_result.confidence,
                        'threshold': validation_threshold,
                        'evidence_score': validation_result.evidence_score
                    },
                    recommendations=validation_result.recommendations,
                    evidence_links=[]
                ))
            else:
                checks.append(ReviewCheckResult(
                    check_name='reality_validation',
                    passed=True,
                    severity='info',
                    message=f"Reality validation passed with {validation_result.confidence:.1%} confidence",
                    details={'confidence': validation_result.confidence},
                    recommendations=[],
                    evidence_links=[]
                ))

        # Check 3: Change Quality Assessment
        files_changed = change_data.get('files_changed', [])
        total_changes = change_data.get('total_changes', 0)

        if total_changes == 0:
            checks.append(ReviewCheckResult(
                check_name='change_quality',
                passed=False,
                severity='warning',
                message="No code changes detected",
                details={'total_changes': total_changes},
                recommendations=["Verify that meaningful changes were made"],
                evidence_links=[]
            ))
        elif len(files_changed) > 20:
            checks.append(ReviewCheckResult(
                check_name='change_quality',
                passed=False,
                severity='warning',
                message=f"Large number of files changed ({len(files_changed)})",
                details={'files_changed': len(files_changed)},
                recommendations=["Consider breaking into smaller changes", "Ensure changes are focused"],
                evidence_links=[]
            ))
        else:
            checks.append(ReviewCheckResult(
                check_name='change_quality',
                passed=True,
                severity='info',
                message=f"Reasonable change scope ({len(files_changed)} files, {total_changes} lines)",
                details={'files_changed': len(files_changed), 'total_changes': total_changes},
                recommendations=[],
                evidence_links=[]
            ))

        # Check 4: Compliance Requirements
        if self.config['integration_settings']['compliance_validation_enabled']:
            compliance_check = self._check_compliance_requirements(change_data, metrics_data)
            checks.append(compliance_check)

        return checks

    def _check_compliance_requirements(self, change_data: Dict, metrics_data: Dict) -> ReviewCheckResult:
        """Check compliance requirements (NASA POT10, etc.)."""

        compliance_issues = []

        # Check for security-sensitive changes
        security_files = [
            f for f in change_data.get('files_changed', [])
            if any(keyword in f['file_path'].lower() for keyword in ['auth', 'security', 'password', 'token'])
        ]

        if security_files:
            compliance_issues.append("Security-sensitive files modified - requires security review")

        # Check for test coverage requirements
        test_files = [
            f for f in change_data.get('files_changed', [])
            if f.get('change_type') == 'test'
        ]

        source_files = [
            f for f in change_data.get('files_changed', [])
            if f.get('change_type') in ['source_code', 'structural']
        ]

        if source_files and not test_files:
            compliance_issues.append("Source code changes without corresponding test updates")

        # Check metrics thresholds
        if metrics_data.get('metrics_available', False):
            current_metrics = metrics_data['current_metrics']

            if current_metrics.get('test_coverage', 0) < 0.8:
                compliance_issues.append(f"Test coverage below 80%: {current_metrics.get('test_coverage', 0):.1%}")

            if current_metrics.get('security_score', 0) < 85:
                compliance_issues.append(f"Security score below 85: {current_metrics.get('security_score', 0)}")

        if compliance_issues:
            return ReviewCheckResult(
                check_name='compliance_requirements',
                passed=False,
                severity='error',
                message=f"Compliance issues detected: {len(compliance_issues)} issues",
                details={'issues': compliance_issues},
                recommendations=[
                    "Address all compliance issues before deployment",
                    "Ensure defense industry standards are met",
                    "Review security implications of changes"
                ],
                evidence_links=[]
            )
        else:
            return ReviewCheckResult(
                check_name='compliance_requirements',
                passed=True,
                severity='info',
                message="All compliance requirements met",
                details={'issues': []},
                recommendations=[],
                evidence_links=[]
            )

    def _collect_review_evidence(self,
                               detection_results: Dict,
                               change_data: Dict,
                               metrics_data: Dict,
                               pr_id: str,
                               commit_hash: str) -> Optional[str]:
        """Collect evidence for the code review."""

        try:
            evidence_items = []

            # Collect code change evidence
            change_evidence = self.evidence_collector.collect_code_change_evidence(
                {
                    'files': change_data['files_changed'],
                    'change_type': 'code_review',
                    'lines_changed': change_data['total_changes'],
                    'pr_id': pr_id
                },
                commit_hash,
                f'pr_{pr_id}'
            )
            evidence_items.append(change_evidence)

            # Collect metrics evidence if available
            if metrics_data.get('metrics_available', False):
                metric_evidence = self.evidence_collector.collect_metric_improvement_evidence(
                    metrics_data['base_metrics'],
                    metrics_data['current_metrics'],
                    {
                        'analysis_type': 'code_review',
                        'theater_detected': detection_results.get('overall_theater_detected', False),
                        'confidence': detection_results.get('overall_confidence', 0.0)
                    },
                    f'pr_{pr_id}'
                )
                evidence_items.append(metric_evidence)

            # Create audit package
            audit_package = self.evidence_collector.create_audit_package(
                evidence_items,
                f'Code Review PR {pr_id}',
                metrics_data.get('current_metrics', {}),
                {
                    'theater_detected': detection_results.get('overall_theater_detected', False),
                    'validation_passed': detection_results.get('validation_result', {}).get('is_genuine', False),
                    'pr_id': pr_id,
                    'commit_hash': commit_hash
                }
            )

            return audit_package.package_id

        except Exception as e:
            self.logger.error(f"Evidence collection failed: {e}")
            return None

    def _generate_final_assessment(self,
                                 detection_results: Dict,
                                 check_results: List[ReviewCheckResult],
                                 evidence_package_id: Optional[str]) -> Dict[str, Any]:
        """Generate final assessment and recommendations."""

        # Count failed checks by severity
        failed_critical = len([c for c in check_results if not c.passed and c.severity == 'critical'])
        failed_error = len([c for c in check_results if not c.passed and c.severity == 'error'])
        failed_warning = len([c for c in check_results if not c.passed and c.severity == 'warning'])

        # Determine risk level
        if failed_critical > 0:
            risk_level = 'critical'
        elif failed_error > 0:
            risk_level = 'high'
        elif failed_warning > 0:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Determine deployment recommendation
        if failed_critical > 0 or (failed_error > 0 and self.config['review_policies']['block_deployment_on_critical']):
            deployment_recommendation = 'block'
        elif failed_error > 0 or failed_warning > 1:
            deployment_recommendation = 'conditional'
        else:
            deployment_recommendation = 'approve'

        # Theater detection status
        theater_detected = detection_results.get('overall_theater_detected', False)

        # Validation status
        validation_result = detection_results.get('validation_result')
        validation_passed = validation_result.is_genuine if validation_result else False

        # Compliance status
        compliance_check = next((c for c in check_results if c.check_name == 'compliance_requirements'), None)
        if compliance_check:
            compliance_status = 'compliant' if compliance_check.passed else 'non_compliant'
        else:
            compliance_status = 'needs_review'

        # Generate reviewer notes
        reviewer_notes = self._generate_reviewer_notes(
            detection_results, check_results, risk_level, deployment_recommendation
        )

        return {
            'theater_detected': theater_detected,
            'risk_level': risk_level,
            'validation_passed': validation_passed,
            'compliance_status': compliance_status,
            'deployment_recommendation': deployment_recommendation,
            'reviewer_notes': reviewer_notes,
            'failed_checks': {
                'critical': failed_critical,
                'error': failed_error,
                'warning': failed_warning
            }
        }

    def _generate_reviewer_notes(self,
                               detection_results: Dict,
                               check_results: List[ReviewCheckResult],
                               risk_level: str,
                               deployment_recommendation: str) -> str:
        """Generate notes for human reviewers."""

        notes = []

        # Theater detection summary
        if detection_results.get('overall_theater_detected', False):
            confidence = detection_results.get('overall_confidence', 0.0)
            notes.append(f"THEATER DETECTED: {confidence:.1%} confidence")

            theater_patterns = detection_results.get('theater_patterns', [])
            if theater_patterns:
                pattern_types = [p.pattern_type for p in theater_patterns]
                notes.append(f"Patterns: {', '.join(set(pattern_types))}")

        # Failed checks summary
        failed_checks = [c for c in check_results if not c.passed]
        if failed_checks:
            notes.append(f"FAILED CHECKS: {len(failed_checks)} issues")
            for check in failed_checks:
                notes.append(f"- {check.check_name}: {check.message}")

        # Risk assessment
        notes.append(f"RISK LEVEL: {risk_level.upper()}")
        notes.append(f"DEPLOYMENT: {deployment_recommendation.upper()}")

        # Recommendations
        all_recommendations = []
        for check in failed_checks:
            all_recommendations.extend(check.recommendations)

        if all_recommendations:
            notes.append("RECOMMENDATIONS:")
            for rec in set(all_recommendations):
                notes.append(f"- {rec}")

        return '\n'.join(notes)

    def _send_notifications(self, report: CodeReviewReport):
        """Send notifications based on report results."""

        if not any(self.config['notification_settings'].get(key, False) for key in [
            'notify_on_theater_detection',
            'notify_on_validation_failure',
            'notify_on_compliance_issues'
        ]):
            return

        try:
            # Determine if notification should be sent
            should_notify = (
                (report.theater_detected and self.config['notification_settings']['notify_on_theater_detection']) or
                (not report.validation_passed and self.config['notification_settings']['notify_on_validation_failure']) or
                (report.compliance_status == 'non_compliant' and self.config['notification_settings']['notify_on_compliance_issues'])
            )

            if should_notify:
                notification_message = self._create_notification_message(report)

                # Send to configured channels
                for channel in self.config['notification_settings']['notification_channels']:
                    self._send_to_channel(channel, notification_message, report)

        except Exception as e:
            self.logger.error(f"Notification sending failed: {e}")

    def _create_notification_message(self, report: CodeReviewReport) -> str:
        """Create notification message for the report."""

        status_emoji = {
            'critical': '🚫',
            'high': '⚠️',
            'medium': '⚠️',
            'low': '✅'
        }

        emoji = status_emoji.get(report.overall_risk_level, '❓')

        message = f"{emoji} Code Review Alert - PR {report.pull_request_id}\n"
        message += f"Author: {report.author}\n"
        message += f"Risk Level: {report.overall_risk_level.upper()}\n"
        message += f"Deployment: {report.deployment_recommendation.upper()}\n"

        if report.theater_detected:
            message += "🎭 Theater patterns detected\n"

        if not report.validation_passed:
            message += "❌ Reality validation failed\n"

        if report.compliance_status == 'non_compliant':
            message += "⚠️ Compliance issues found\n"

        failed_checks = [c for c in report.check_results if not c.passed]
        if failed_checks:
            message += f"\nFailed Checks ({len(failed_checks)}):\n"
            for check in failed_checks:
                message += f"- {check.check_name}: {check.severity}\n"

        return message

    def _send_to_channel(self, channel: str, message: str, report: CodeReviewReport):
        """Send notification to specific channel."""

        if channel == 'github_comment':
            self._send_github_comment(report, message)
        elif channel == 'slack':
            self._send_slack_notification(message, report)
        elif channel == 'email':
            self._send_email_notification(message, report)

    def _send_github_comment(self, report: CodeReviewReport, message: str):
        """Send GitHub comment with review results."""
        # This would integrate with GitHub API
        self.logger.info(f"GitHub comment would be posted for PR {report.pull_request_id}")

    def _send_slack_notification(self, message: str, report: CodeReviewReport):
        """Send Slack notification."""
        # This would integrate with Slack API
        self.logger.info(f"Slack notification would be sent for PR {report.pull_request_id}")

    def _send_email_notification(self, message: str, report: CodeReviewReport):
        """Send email notification."""
        # This would integrate with email service
        self.logger.info(f"Email notification would be sent for PR {report.pull_request_id}")

    def _create_error_report(self, pr_id: str, commit_hash: str, author: str, error_message: str) -> CodeReviewReport:
        """Create error report when analysis fails."""

        return CodeReviewReport(
            pull_request_id=pr_id,
            commit_hash=commit_hash,
            author=author,
            timestamp=datetime.now(timezone.utc),
            theater_detected=False,
            overall_risk_level='medium',
            validation_passed=False,
            compliance_status='needs_review',
            check_results=[
                ReviewCheckResult(
                    check_name='analysis_error',
                    passed=False,
                    severity='error',
                    message=f"Analysis failed: {error_message}",
                    details={'error': error_message},
                    recommendations=["Manual review required", "Check system logs"],
                    evidence_links=[]
                )
            ],
            evidence_package_id=None,
            deployment_recommendation='conditional',
            reviewer_notes=f"ANALYSIS ERROR: {error_message}\nManual review required."
        )

    def _convert_to_quality_metrics(self, metrics_dict: Dict) -> QualityMetrics:
        """Convert metrics dictionary to QualityMetrics object."""
        return QualityMetrics(
            cyclomatic_complexity=metrics_dict.get('cyclomatic_complexity', 15.0),
            code_coverage=metrics_dict.get('test_coverage', 0.7),
            test_count=25,  # Default value
            performance_score=metrics_dict.get('performance_score', 70.0),
            security_score=metrics_dict.get('security_score', 80.0),
            maintainability_index=metrics_dict.get('maintainability_index', 70.0),
            technical_debt_ratio=metrics_dict.get('technical_debt_ratio', 0.3)
        )

    def _convert_to_code_metrics(self, quality_metrics: QualityMetrics) -> CodeMetrics:
        """Convert QualityMetrics to CodeMetrics for validation engine."""
        return CodeMetrics(
            lines_of_code=1000,
            cyclomatic_complexity=quality_metrics.cyclomatic_complexity,
            cognitive_complexity=quality_metrics.cyclomatic_complexity * 1.2,
            maintainability_index=quality_metrics.maintainability_index,
            halstead_metrics={},
            code_coverage=quality_metrics.code_coverage,
            test_coverage_quality=quality_metrics.code_coverage,
            performance_metrics={'score': quality_metrics.performance_score},
            security_score=quality_metrics.security_score,
            documentation_ratio=0.2
        )

    def get_review_summary(self, pr_id: str) -> Dict[str, Any]:
        """Get summary of review results for dashboard display."""
        # This would typically retrieve from database
        # For now, return placeholder structure

        return {
            'pr_id': pr_id,
            'status': 'completed',
            'theater_detected': False,
            'risk_level': 'low',
            'deployment_recommendation': 'approve',
            'evidence_package_id': None,
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
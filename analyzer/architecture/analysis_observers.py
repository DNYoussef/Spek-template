# SPDX-License-Identifier: MIT
"""
Analysis Observers - Observer Pattern Implementation
==================================================

Concrete observer implementations for analysis event handling.
NASA Power of Ten compliant with focused observer classes.
"""

from typing import Dict, List, Any
import logging
import json
from datetime import datetime

from .interfaces import AnalysisObserver, AnalysisResult, ConnascenceViolation

logger = logging.getLogger(__name__)


class LoggingObserver:
    """
    Observer that logs analysis events to structured logs.

    NASA Rule 4 Compliant: Focused logging functionality.
    """

    def __init__(self, log_level: str = 'INFO'):
        self.log_level = log_level
        self.observer_name = "StructuredLoggingObserver"

    def on_analysis_started(self, context: Dict[str, Any]) -> None:
        """Log analysis start event."""
        logger.info(f"Analysis started: {context.get('project_path', 'unknown')}")

    def on_file_analyzed(self, file_path: str, violations: List[ConnascenceViolation]) -> None:
        """Log file analysis completion."""
        violation_count = len(violations)
        critical_count = len([v for v in violations if v.severity == 'critical'])

        if critical_count > 0:
            logger.warning(f"File analyzed: {file_path} - {violation_count} violations ({critical_count} critical)")
        else:
            logger.info(f"File analyzed: {file_path} - {violation_count} violations")

    def on_analysis_completed(self, result: AnalysisResult) -> None:
        """Log analysis completion with summary."""
        total_violations = len(result.violations)
        nasa_score = result.nasa_compliance.get('score', 0.0)

        logger.info(f"Analysis completed: {total_violations} violations, NASA compliance: {nasa_score:.2f}")

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Log analysis errors."""
        logger.error(f"Analysis error in {context}: {str(error)}")


class MetricsCollector:
    """
    Observer that collects analysis metrics for performance monitoring.

    NASA Rule 4 Compliant: Focused metrics collection.
    """

    def __init__(self):
        self.observer_name = "PerformanceMetricsCollector"
        self.metrics = {
            'analyses_count': 0,
            'files_analyzed': 0,
            'total_violations': 0,
            'error_count': 0,
            'nasa_scores': [],
            'analysis_times': []
        }

    def on_analysis_started(self, context: Dict[str, Any]) -> None:
        """Track analysis start."""
        self.start_time = datetime.now()

    def on_file_analyzed(self, file_path: str, violations: List[ConnascenceViolation]) -> None:
        """Track file analysis metrics."""
        self.metrics['files_analyzed'] += 1
        self.metrics['total_violations'] += len(violations)

    def on_analysis_completed(self, result: AnalysisResult) -> None:
        """Track analysis completion metrics."""
        self.metrics['analyses_count'] += 1

        if hasattr(self, 'start_time'):
            duration = (datetime.now() - self.start_time).total_seconds()
            self.metrics['analysis_times'].append(duration)

        nasa_score = result.nasa_compliance.get('score', 0.0)
        self.metrics['nasa_scores'].append(nasa_score)

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Track error metrics."""
        self.metrics['error_count'] += 1

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary."""
        if not self.metrics['analyses_count']:
            return self.metrics

        avg_nasa_score = sum(self.metrics['nasa_scores']) / len(self.metrics['nasa_scores'])
        avg_analysis_time = sum(self.metrics['analysis_times']) / len(self.metrics['analysis_times'])

        return {
            **self.metrics,
            'average_nasa_score': round(avg_nasa_score, 3),
            'average_analysis_time_seconds': round(avg_analysis_time, 3),
            'error_rate': self.metrics['error_count'] / self.metrics['analyses_count']
        }


class FileReportObserver:
    """
    Observer that writes analysis results to files for audit trails.

    NASA Rule 4 Compliant: Focused file output functionality.
    """

    def __init__(self, output_directory: str = '.claude/.artifacts'):
        self.output_directory = output_directory
        self.observer_name = "AuditTrailFileObserver"

        # Ensure output directory exists
        from pathlib import Path
        Path(output_directory).mkdir(parents=True, exist_ok=True)

    def on_analysis_started(self, context: Dict[str, Any]) -> None:
        """Write analysis start audit log."""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'event': 'analysis_started',
            'timestamp': timestamp,
            'context': context
        }

        self._write_audit_log(log_entry)

    def on_file_analyzed(self, file_path: str, violations: List[ConnascenceViolation]) -> None:
        """Write file analysis results."""
        # For performance, only log files with critical violations
        critical_violations = [v for v in violations if v.severity == 'critical']
        if critical_violations:
            timestamp = datetime.now().isoformat()
            log_entry = {
                'event': 'critical_violations_found',
                'timestamp': timestamp,
                'file_path': file_path,
                'critical_violations': [v.to_dict() for v in critical_violations]
            }

            self._write_audit_log(log_entry)

    def on_analysis_completed(self, result: AnalysisResult) -> None:
        """Write comprehensive analysis report."""
        timestamp = datetime.now().isoformat()
        report_filename = f"analysis_report_{timestamp.replace(':', '-')}.json"

        report_data = {
            'timestamp': timestamp,
            'analysis_result': result.to_dict(),
            'audit_trail': True,
            'observer': self.observer_name
        }

        self._write_report_file(report_filename, report_data)

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Write error audit log."""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'event': 'analysis_error',
            'timestamp': timestamp,
            'error': str(error),
            'error_type': type(error).__name__,
            'context': context
        }

        self._write_audit_log(log_entry)

    def _write_audit_log(self, log_entry: Dict[str, Any]) -> None:
        """Write audit log entry."""
        try:
            from pathlib import Path
            audit_file = Path(self.output_directory) / 'audit_trail.jsonl'

            with open(audit_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')

        except Exception as e:
            logger.error(f"Audit log write failed: {e}")

    def _write_report_file(self, filename: str, report_data: Dict[str, Any]) -> None:
        """Write comprehensive report file."""
        try:
            from pathlib import Path
            report_file = Path(self.output_directory) / filename

            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)

        except Exception as e:
            logger.error(f"Report file write failed: {e}")


class RealTimeMonitor:
    """
    Observer for real-time monitoring and alerting.

    NASA Rule 4 Compliant: Focused monitoring functionality.
    """

    def __init__(self, alert_threshold: int = 5):
        self.observer_name = "RealTimeMonitor"
        self.alert_threshold = alert_threshold
        self.current_critical_count = 0

    def on_analysis_started(self, context: Dict[str, Any]) -> None:
        """Reset monitoring for new analysis."""
        self.current_critical_count = 0

    def on_file_analyzed(self, file_path: str, violations: List[ConnascenceViolation]) -> None:
        """Monitor for critical violations."""
        critical_violations = [v for v in violations if v.severity == 'critical']
        self.current_critical_count += len(critical_violations)

        # Alert if threshold exceeded
        if len(critical_violations) >= self.alert_threshold:
            self._send_alert(f"Critical violations threshold exceeded in {file_path}: {len(critical_violations)} found")

    def on_analysis_completed(self, result: AnalysisResult) -> None:
        """Monitor overall analysis results."""
        nasa_score = result.nasa_compliance.get('score', 1.0)

        if nasa_score < 0.90:
            self._send_alert(f"NASA compliance below 90%: {nasa_score:.2f}")

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Monitor for analysis errors."""
        self._send_alert(f"Analysis error: {str(error)}")

    def _send_alert(self, message: str) -> None:
        """Send alert (log for now, could integrate with monitoring systems)."""
        logger.warning(f"ALERT: {message}")
        # In production, would integrate with monitoring systems like Prometheus, Grafana, etc.
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ErrorManager - Extracted from UnifiedAnalyzer
Handles all error collection, processing, and reporting
Part of god object decomposition (Day 3)
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

class ErrorSeverity(Enum):
    """Error severity levels for analysis."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class AnalysisError:
    """Represents an error during analysis."""
    timestamp: datetime
    severity: ErrorSeverity
    component: str
    message: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    context: Dict[str, Any] = field(default_factory=dict)
    stack_trace: Optional[str] = None

class ErrorManager:
    """
    Manages error collection and reporting for the analyzer.

    Extracted from UnifiedAnalyzer god object (1, 634 LOC -> ~200 LOC component).
    Handles:
    - Error collection and categorization
    - Error severity assessment
    - Error reporting and formatting
    - Error recovery strategies
    """

    def __init__(self, max_errors: int = 1000, auto_recover: bool = True):
        """Initialize the error manager."""
        self.errors: List[AnalysisError] = []
        self.max_errors = max_errors
        self.auto_recover = auto_recover
        self.error_counts: Dict[str, int] = {
            severity.value: 0 for severity in ErrorSeverity
        }
        self.recovery_strategies: Dict[str, callable] = {}

    def add_error(self,
                    severity: ErrorSeverity,
                    component: str,
                    message: str,
                    **kwargs) -> None:
        """Add an error to the collection."""
        if len(self.errors) >= self.max_errors:
            self._rotate_errors()

        error = AnalysisError(
            timestamp=datetime.now(),
            severity=severity,
            component=component,
            message=message,
            **kwargs
        )

        self.errors.append(error)
        self.error_counts[severity.value] += 1

        # Log the error
        log_method = getattr(logger, severity.value, logger.error)
        log_method(f"[{component}] {message}")

        # Attempt recovery if enabled
        if self.auto_recover and severity == ErrorSeverity.CRITICAL:
            self._attempt_recovery(error)

    def _rotate_errors(self) -> None:
        """Rotate errors when max limit is reached."""
        # Keep only the most recent 80% of errors
        keep_count = int(self.max_errors * 0.8)
        self.errors = self.errors[-keep_count:]

    def _attempt_recovery(self, error: AnalysisError) -> bool:
        """Attempt to recover from a critical error."""
        if error.component in self.recovery_strategies:
            try:
                strategy = self.recovery_strategies[error.component]
                return strategy(error)
            except Exception as e:
                logger.error(f"Recovery failed for {error.component}: {e}")
        return False

    def register_recovery_strategy(self,
                                    component: str,
                                    strategy: callable) -> None:
        """Register a recovery strategy for a component."""
        self.recovery_strategies[component] = strategy

    def get_errors_by_severity(self,
                                severity: ErrorSeverity) -> List[AnalysisError]:
        """Get all errors of a specific severity."""
        return [e for e in self.errors if e.severity == severity]

    def get_errors_by_component(self, component: str) -> List[AnalysisError]:
        """Get all errors from a specific component."""
        return [e for e in self.errors if e.component == component]

    def has_critical_errors(self) -> bool:
        """Check if there are any critical errors."""
        return self.error_counts[ErrorSeverity.CRITICAL.value] > 0

    def clear_errors(self) -> None:
        """Clear all collected errors."""
        self.errors.clear()
        for key in self.error_counts:
            self.error_counts[key] = 0

    def generate_error_report(self) -> Dict[str, Any]:
        """Generate a comprehensive error report."""
        return {
            "total_errors": len(self.errors),
            "error_counts": self.error_counts.copy(),
            "critical_errors": [
                {
                    "timestamp": e.timestamp.isoformat(),
                    "component": e.component,
                    "message": e.message,
                    "file": e.file_path
                }
                for e in self.get_errors_by_severity(ErrorSeverity.CRITICAL)
            ],
            "components_with_errors": list(set(e.component for e in self.errors)),
            "recovery_attempted": sum(
                1 for e in self.errors
                if e.context.get("recovery_attempted", False)
            )
        }

    def format_errors_for_display(self, max_errors: int = 10) -> str:
        """Format errors for console display."""
        if not self.errors:
            return "No errors detected."

        lines = [f"Total errors: {len(self.errors)}"]
        lines.append(f"Severity breakdown: {self.error_counts}")
        lines.append("\nRecent errors:")

        for error in self.errors[-max_errors:]:
            lines.append(
                f"  [{error.severity.value.upper()}] "
                f"{error.component}: {error.message}"
            )
            if error.file_path:
                lines.append(f"    File: {error.file_path}:{error.line_number or 0}")

        return "\n".join(lines)
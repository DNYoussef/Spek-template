# SPDX-License-Identifier: MIT
"""
Connascence Analysis Interfaces
===============================

Core interfaces for the refactored connascence analysis system.
Implements defense industry compliant architecture with proper dependency injection.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Protocol, Union
from dataclasses import dataclass
from pathlib import Path
import ast


@dataclass
class ConnascenceViolation:
    """Standardized violation representation for all detectors."""
    type: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    file_path: str
    line_number: int
    column: int
    description: str
    nasa_rule: Optional[str] = None
    connascence_type: Optional[str] = None
    weight: float = 1.0
    fix_suggestion: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'type': self.type,
            'severity': self.severity,
            'file_path': self.file_path,
            'line_number': self.line_number,
            'column': self.column,
            'description': self.description,
            'nasa_rule': self.nasa_rule,
            'connascence_type': self.connascence_type,
            'weight': self.weight,
            'fix_suggestion': self.fix_suggestion
        }


@dataclass
class AnalysisResult:
    """Standardized analysis result container."""
    violations: List[ConnascenceViolation]
    metrics: Dict[str, Any]
    metadata: Dict[str, Any]
    nasa_compliance: Dict[str, Any]
    performance_stats: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'violations': [v.to_dict() for v in self.violations],
            'metrics': self.metrics,
            'metadata': self.metadata,
            'nasa_compliance': self.nasa_compliance,
            'performance_stats': self.performance_stats
        }


class ConnascenceDetectorInterface(ABC):
    """Interface for all connascence detectors following NASA Rule 3."""

    @abstractmethod
    def detect_violations(self, tree: ast.AST, file_path: str, source_lines: List[str]) -> List[ConnascenceViolation]:
        """Detect violations in AST tree."""
        pass

    @abstractmethod
    def get_detector_name(self) -> str:
        """Get unique detector name."""
        pass

    @abstractmethod
    def get_supported_connascence_types(self) -> List[str]:
        """Get list of supported connascence types."""
        pass


class ConnascenceClassifierInterface(ABC):
    """Interface for connascence type classification."""

    @abstractmethod
    def classify_violation(self, violation: ConnascenceViolation) -> ConnascenceViolation:
        """Classify and enhance violation with type information."""
        pass

    @abstractmethod
    def get_severity_mapping(self) -> Dict[str, str]:
        """Get connascence type to severity mapping."""
        pass


class ConnascenceMetricsInterface(ABC):
    """Interface for metrics calculation."""

    @abstractmethod
    def calculate_metrics(self, violations: List[ConnascenceViolation]) -> Dict[str, Any]:
        """Calculate comprehensive metrics from violations."""
        pass

    @abstractmethod
    def calculate_nasa_compliance(self, violations: List[ConnascenceViolation]) -> Dict[str, Any]:
        """Calculate NASA Power of Ten compliance score."""
        pass


class ConnascenceReporterInterface(ABC):
    """Interface for report generation."""

    @abstractmethod
    def generate_report(self, result: AnalysisResult, format_type: str = 'json') -> str:
        """Generate formatted report."""
        pass

    @abstractmethod
    def generate_dashboard_summary(self, result: AnalysisResult) -> Dict[str, Any]:
        """Generate dashboard summary."""
        pass


class ConnascenceFixerInterface(ABC):
    """Interface for automated fix suggestions."""

    @abstractmethod
    def generate_fix_suggestions(self, violations: List[ConnascenceViolation]) -> List[ConnascenceViolation]:
        """Generate automated fix suggestions for violations."""
        pass

    @abstractmethod
    def apply_fixes(self, file_path: str, fixes: List[Dict[str, Any]]) -> bool:
        """Apply automated fixes to file."""
        pass


class ConnascenceCacheInterface(ABC):
    """Interface for caching layer."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get cached value."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set cached value with optional TTL."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all cache entries."""
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        pass


class AnalysisObserver(Protocol):
    """Observer protocol for analysis events."""

    def on_analysis_started(self, context: Dict[str, Any]) -> None:
        """Called when analysis starts."""
        ...

    def on_file_analyzed(self, file_path: str, violations: List[ConnascenceViolation]) -> None:
        """Called when a file is analyzed."""
        ...

    def on_analysis_completed(self, result: AnalysisResult) -> None:
        """Called when analysis completes."""
        ...

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Called when an error occurs."""
        ...


class AnalysisStrategy(ABC):
    """Strategy interface for different analysis approaches."""

    @abstractmethod
    def analyze_project(self, project_path: Path, config: Dict[str, Any]) -> AnalysisResult:
        """Execute analysis strategy."""
        pass

    @abstractmethod
    def get_strategy_name(self) -> str:
        """Get strategy name."""
        pass


class ConnascenceOrchestratorInterface(ABC):
    """Main orchestrator interface - maximum 5 public methods per NASA Rule 4."""

    @abstractmethod
    def analyze_project(self, project_path: Union[str, Path],
                       config: Optional[Dict[str, Any]] = None) -> AnalysisResult:
        """Main analysis entry point."""
        pass

    @abstractmethod
    def analyze_file(self, file_path: Union[str, Path]) -> AnalysisResult:
        """Analyze single file."""
        pass

    @abstractmethod
    def add_observer(self, observer: AnalysisObserver) -> None:
        """Add analysis observer."""
        pass

    @abstractmethod
    def set_strategy(self, strategy: AnalysisStrategy) -> None:
        """Set analysis strategy."""
        pass

    @abstractmethod
    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and health metrics."""
        pass


# Configuration interfaces for dependency injection
class ConfigurationProvider(ABC):
    """Interface for configuration management."""

    @abstractmethod
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        pass

    @abstractmethod
    def get_detector_config(self, detector_name: str) -> Dict[str, Any]:
        """Get detector-specific configuration."""
        pass


class ErrorHandler(ABC):
    """Interface for error handling."""

    @abstractmethod
    def handle_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Handle analysis error."""
        pass

    @abstractmethod
    def create_error_violation(self, error: Exception, file_path: str) -> ConnascenceViolation:
        """Create violation from error."""
        pass
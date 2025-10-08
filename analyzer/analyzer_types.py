# SPDX-License-Identifier: MIT

"""
Shared Types Module
==================

Contains shared type definitions used across the analyzer system to avoid
circular import dependencies between core modules.

This module provides:
- Analysis result types
- Violation types
- Standard error types
- Configuration types
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from datetime import datetime
from typing import Any, Dict, List, Optional

from dataclasses import dataclass, asdict, field

# Error severity constants
ERROR_SEVERITY = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "INFO": "info"
}

# Error code mappings
ERROR_CODE_MAPPING = {
    "FILE_NOT_FOUND": "ALYZER_001",
    "PERMISSION_DENIED": "ALYZER_002",
    "SYNTAX_ERROR": "ALYZER_003",
    "ANALYSIS_FAILED": "ALYZER_004",
    "TIMEOUT_ERROR": "ALYZER_005",
    "MEMORY_ERROR": "ALYZER_006",
    "DEPENDENCY_MISSING": "ALYZER_007",
    "INTERNAL_ERROR": "ALYZER_999"
}

@dataclass
class StandardError:
    """Standardized error response format for all analyzer components."""

    code: str
    message: str
    severity: str = ERROR_SEVERITY["MEDIUM"]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    integration: str = "analyzer"
    error_id: str = ""
    context: Dict[str, Any] = field(default_factory=dict)
    correlation_id: Optional[str] = None
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    suggestions: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)

@dataclass
class UnifiedAnalysisResult:
    """Complete analysis result from all Phase 1-6 components."""

    # Core results
    connascence_violations: List[Dict[str, Any]]
    duplication_clusters: List[Dict[str, Any]]
    nasa_violations: List[Dict[str, Any]]

    # Summary metrics
    total_violations: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

    # Quality scores
    connascence_index: float
    nasa_compliance_score: float
    duplication_score: float
    overall_quality_score: float

    # Analysis metadata
    project_path: str
    policy_preset: str
    analysis_duration_ms: int
    files_analyzed: int
    timestamp: str

    # Recommendations
    priority_fixes: List[str]
    improvement_actions: List[str]

    # Error tracking
    errors: Optional[List[StandardError]] = None
    warnings: Optional[List[StandardError]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)

    def has_errors(self) -> bool:
        """Check if analysis has any errors."""
        return bool(self.errors)

    def has_critical_errors(self) -> bool:
        """Check if analysis has critical errors."""
        if not self.errors:
            return False
        return any(error.severity == ERROR_SEVERITY["CRITICAL"] for error in self.errors)

@dataclass
class AnalysisConfiguration:
    """Configuration options for analysis execution."""

    # Basic options
    target_path: str
    policy_preset: str = "standard"
    output_format: str = "json"
    output_path: Optional[str] = None

    # Analysis control
    include_duplications: bool = True
    include_nasa_rules: bool = True
    include_god_objects: bool = True
    # Configuration constants
    DEFAULT_DUPLICATION_THRESHOLD = 0.7
    DEFAULT_MAX_WORKERS = 4
    DEFAULT_MEMORY_LIMIT_MB = 1024

    duplication_threshold: float = DEFAULT_DUPLICATION_THRESHOLD

    # Performance options
    enable_caching: bool = True
    enable_streaming: bool = False
    max_workers: int = DEFAULT_MAX_WORKERS
    memory_limit_mb: int = DEFAULT_MEMORY_LIMIT_MB

    # Output options
    verbose: bool = False
    debug: bool = False
    fail_on_critical: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)

# Type aliases for backward compatibility
AnalysisResult = UnifiedAnalysisResult
Error = StandardError

__all__ = [
    "UnifiedAnalysisResult",
    "AnalysisResult",
    "StandardError",
    "Error",
    "AnalysisConfiguration",
    "ERROR_SEVERITY",
    "ERROR_CODE_MAPPING"
]
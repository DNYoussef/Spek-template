# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Connascence Safety Analyzer Contributors

"""
Analysis Interfaces for Decomposed UnifiedConnascenceAnalyzer

Defines abstract base classes and contracts for the six focused classes
that replace the god object UnifiedConnascenceAnalyzer.

NASA Power of Ten Compliance:
- Rule 4: All classes have clear interfaces (<500 LOC each)
- Rule 5: All parameters validated with assertions
- Rule 7: All return values checked
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Path, Tuple, Union
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Standardized analysis result structure."""
    violations: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    recommendations: Dict[str, Any]
    metadata: Dict[str, Any]
    errors: List[Any] = None
    warnings: List[Any] = None


@dataclass
class AnalysisContext:
    """Analysis execution context."""
    project_path: Path
    policy_preset: str
    analysis_mode: str
    config: Dict[str, Any]
    metadata: Dict[str, Any] = None


class IAnalysisOrchestrator(ABC):
    """
    Interface for analysis workflow orchestration.

    NASA Rule 4 Compliant: Focused responsibility for analysis coordination
    NASA Rule 5 Compliant: All parameters validated with assertions
    """

    @abstractmethod
    def analyze_project(
        self,
        project_path: Union[str, Path],
        policy_preset: str = "service-defaults"
    ) -> AnalysisResult:
        """
        Orchestrate complete project analysis.

        Args:
            project_path: Path to project for analysis
            policy_preset: Analysis policy configuration

        Returns:
            AnalysisResult: Complete analysis results

        Raises:
            AssertionError: If parameters are invalid
            ValueError: If analysis fails
        """
        pass

    @abstractmethod
    def analyze_project_batch(
        self,
        project_path: Path,
        policy_preset: str
    ) -> AnalysisResult:
        """Execute batch analysis mode."""
        pass

    @abstractmethod
    def analyze_project_streaming(
        self,
        project_path: Path,
        policy_preset: str
    ) -> AnalysisResult:
        """Execute streaming analysis mode."""
        pass

    @abstractmethod
    def analyze_project_hybrid(
        self,
        project_path: Path,
        policy_preset: str
    ) -> AnalysisResult:
        """Execute hybrid analysis mode."""
        pass

    @abstractmethod
    def start_streaming_analysis(
        self,
        directories: List[Union[str, Path]]
    ) -> None:
        """Start continuous streaming analysis."""
        pass

    @abstractmethod
    async def stop_streaming_analysis(self) -> None:
        """Stop streaming analysis gracefully."""
        pass

    @abstractmethod
    def get_streaming_stats(self) -> Dict[str, Any]:
        """Get current streaming analysis statistics."""
        pass


class IConnascenceAnalysisEngine(ABC):
    """
    Interface for core connascence detection and analysis.

    NASA Rule 4 Compliant: Focused on connascence detection only
    NASA Rule 5 Compliant: All parameters validated
    """

    @abstractmethod
    def run_ast_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Execute AST-based connascence analysis."""
        pass

    @abstractmethod
    def run_refactored_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Execute refactored analysis pipeline."""
        pass

    @abstractmethod
    def run_duplication_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Execute code duplication analysis."""
        pass

    @abstractmethod
    def run_smart_integration(
        self,
        project_path: Path,
        policy_preset: str,
        existing_violations: Dict = None
    ) -> Dict[str, Any]:
        """Execute smart integration analysis."""
        pass

    @abstractmethod
    def run_nasa_analysis(
        self,
        connascence_violations: List[Dict[str, Any]],
        phase_metadata: Dict = None,
        project_path: Path = None
    ) -> List[Dict[str, Any]]:
        """Execute NASA Power of Ten compliance analysis."""
        pass

    @abstractmethod
    def analyze_file(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """Analyze a single file for connascence violations."""
        pass

    @abstractmethod
    def check_nasa_compliance(
        self,
        violations: List,
        file_path: Path,
        warnings: List
    ) -> Tuple[List, float]:
        """Check NASA Power of Ten compliance for violations."""
        pass


class IMetricsCalculationService(ABC):
    """
    Interface for quality metrics calculation and scoring.

    NASA Rule 4 Compliant: Focused on metrics calculation only
    NASA Rule 5 Compliant: All calculations validated
    """

    @abstractmethod
    def calculate_analysis_metrics(
        self,
        violations: Dict,
        analysis_errors: List
    ) -> Dict[str, Any]:
        """Calculate comprehensive analysis metrics."""
        pass

    @abstractmethod
    def generate_analysis_recommendations(
        self,
        violations: Dict,
        analysis_warnings: List
    ) -> Dict[str, Any]:
        """Generate improvement recommendations based on analysis."""
        pass

    @abstractmethod
    def enhance_recommendations_with_metadata(
        self,
        violations: Dict,
        recommendations: Dict
    ) -> Dict[str, Any]:
        """Enhance recommendations with additional metadata."""
        pass

    @abstractmethod
    def integrate_smart_results(
        self,
        enhanced_recommendations: Dict,
        smart_results: Dict
    ) -> None:
        """Integrate smart analysis results into recommendations."""
        pass

    @abstractmethod
    def get_dashboard_summary(
        self,
        analysis_result: AnalysisResult
    ) -> Dict[str, Any]:
        """Generate dashboard summary from analysis results."""
        pass

    @abstractmethod
    def severity_to_weight(self, severity: str) -> float:
        """Convert severity level to numerical weight."""
        pass


class IAnalysisConfigurationManager(ABC):
    """
    Interface for configuration and system initialization.

    NASA Rule 4 Compliant: Focused on configuration management only
    NASA Rule 5 Compliant: All configurations validated
    """

    @abstractmethod
    def initialize_configuration_management(self, config_path: Optional[str]) -> None:
        """Initialize configuration management system."""
        pass

    @abstractmethod
    def initialize_detector_pools(self) -> None:
        """Initialize detector pools and architecture components."""
        pass

    @abstractmethod
    def initialize_core_analyzers(self) -> None:
        """Initialize core analysis components."""
        pass

    @abstractmethod
    def initialize_optional_components(self) -> None:
        """Initialize optional analysis components."""
        pass

    @abstractmethod
    def initialize_monitoring_system(self) -> None:
        """Initialize monitoring and alerting system."""
        pass

    @abstractmethod
    def log_initialization_completion(self) -> None:
        """Log successful initialization completion."""
        pass

    @abstractmethod
    def validate_architecture_extraction(self) -> Dict[str, bool]:
        """Validate that architecture components were extracted successfully."""
        pass

    @abstractmethod
    def get_component_status(self) -> Dict[str, bool]:
        """Get status of all initialized components."""
        pass


class IAnalysisCacheManager(ABC):
    """
    Interface for caching and performance optimization.

    NASA Rule 4 Compliant: Focused on cache management only
    NASA Rule 5 Compliant: All cache operations validated
    """

    @abstractmethod
    def initialize_cache_system(self) -> None:
        """Initialize cache system and statistics tracking."""
        pass

    @abstractmethod
    def get_cached_content_with_tracking(self, file_path: Path) -> Optional[str]:
        """Get cached file content with performance tracking."""
        pass

    @abstractmethod
    def get_cached_lines_with_tracking(self, file_path: Path) -> List[str]:
        """Get cached file lines with performance tracking."""
        pass

    @abstractmethod
    def get_cache_hit_rate(self) -> float:
        """Calculate current cache hit rate."""
        pass

    @abstractmethod
    def log_cache_performance(self) -> None:
        """Log cache performance statistics."""
        pass

    @abstractmethod
    def optimize_cache_for_future_runs(self) -> None:
        """Optimize cache configuration for future analysis runs."""
        pass

    @abstractmethod
    def periodic_cache_cleanup(self) -> int:
        """Perform periodic cache cleanup and return freed entries."""
        pass

    @abstractmethod
    def emergency_memory_cleanup(self) -> None:
        """Perform emergency memory cleanup when limits exceeded."""
        pass


class IFileAnalysisProcessor(ABC):
    """
    Interface for file processing and result building.

    NASA Rule 4 Compliant: Focused on file processing only
    NASA Rule 5 Compliant: All file operations validated
    """

    @abstractmethod
    def build_unified_result(
        self,
        violations: Dict,
        metrics: Dict,
        recommendations: Dict,
        metadata: Dict
    ) -> AnalysisResult:
        """Build unified analysis result from components."""
        pass

    @abstractmethod
    def build_result_with_aggregator(
        self,
        violations: Dict,
        metadata: Dict
    ) -> AnalysisResult:
        """Build result using aggregator pattern."""
        pass

    @abstractmethod
    def dict_to_unified_result(self, result_dict: Dict[str, Any]) -> AnalysisResult:
        """Convert dictionary to unified result structure."""
        pass

    @abstractmethod
    def build_file_analysis_result(
        self,
        file_path: Path,
        violations: List,
        nasa_violations: List,
        nasa_score: float,
        metadata: Dict
    ) -> Dict[str, Any]:
        """Build analysis result for single file."""
        pass

    @abstractmethod
    def get_empty_file_result(
        self,
        file_path: Path,
        errors: List
    ) -> Dict[str, Any]:
        """Generate empty result for files with errors."""
        pass

    @abstractmethod
    def violation_to_dict(self, violation) -> Dict[str, Any]:
        """Convert violation object to dictionary representation."""
        pass

    @abstractmethod
    def cluster_to_dict(self, cluster) -> Dict[str, Any]:
        """Convert cluster object to dictionary representation."""
        pass

    @abstractmethod
    def create_analysis_result_object(
        self,
        violations: Dict,
        metrics: Dict,
        recommendations: Dict,
        metadata: Dict,
        analysis_time: int
    ) -> AnalysisResult:
        """Create analysis result object with all components."""
        pass


class IDependencyContainer(ABC):
    """
    Interface for dependency injection container.

    NASA Rule 4 Compliant: Focused on dependency management only
    NASA Rule 5 Compliant: All dependencies validated
    """

    @abstractmethod
    def register_service(self, interface: type, implementation: type) -> None:
        """Register service implementation for interface."""
        pass

    @abstractmethod
    def register_singleton(self, interface: type, instance: Any) -> None:
        """Register singleton instance for interface."""
        pass

    @abstractmethod
    def resolve(self, interface: type) -> Any:
        """Resolve implementation for interface."""
        pass

    @abstractmethod
    def has_registration(self, interface: type) -> bool:
        """Check if interface has registered implementation."""
        pass


# Utility functions for NASA compliance

def validate_path_parameter(path: Union[str, Path], parameter_name: str) -> Path:
    """
    Validate path parameter according to NASA Rule 5.

    Args:
        path: Path to validate
        parameter_name: Name of parameter for error messages

    Returns:
        Path: Validated Path object

    Raises:
        AssertionError: If path is invalid
    """
    assert path is not None, f"{parameter_name} cannot be None"

    if isinstance(path, str):
        assert len(path.strip()) > 0, f"{parameter_name} cannot be empty string"
        path = Path(path)

    assert isinstance(path, Path), f"{parameter_name} must be string or Path object"
    return path


def validate_analysis_mode(analysis_mode: str) -> None:
    """
    Validate analysis mode parameter according to NASA Rule 5.

    Args:
        analysis_mode: Analysis mode to validate

    Raises:
        AssertionError: If analysis mode is invalid
    """
    valid_modes = ['batch', 'streaming', 'hybrid']
    assert analysis_mode in valid_modes, \
        f"Invalid analysis_mode: {analysis_mode}. Must be one of {valid_modes}"


def validate_policy_preset(policy_preset: str) -> None:
    """
    Validate policy preset parameter according to NASA Rule 5.

    Args:
        policy_preset: Policy preset to validate

    Raises:
        AssertionError: If policy preset is invalid
    """
    assert policy_preset is not None, "policy_preset cannot be None"
    assert isinstance(policy_preset, str), "policy_preset must be string"
    assert len(policy_preset.strip()) > 0, "policy_preset cannot be empty string"
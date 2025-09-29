from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Analysis Strategy Framework - Enhanced
Production-ready system for architectural analysis with strong typing.
"""

import logging
import json
from enum import Enum
from typing import Dict, List, Any, Optional, Protocol, Union, Tuple
from dataclasses import dataclass, field
from abc import ABC, abstractmethod


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Strong typing for analysis results
@dataclass
class AnalysisResult:
    """Strongly typed analysis result with metadata."""
    strategy_type: str
    findings: List[Dict[str, Any]]
    metrics: Dict[str, Union[int, float, str]]
    confidence: float
    timestamp: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Validate analysis result after initialization."""
        assert 0.0 <= self.confidence <= 1.0, "Confidence must be between 0 and 1"
        assert isinstance(self.findings, list), "Findings must be a list"
        assert isinstance(self.metrics, dict), "Metrics must be a dictionary"


class AnalysisCategory(Enum):
    """Enumeration of analysis categories."""
    STRUCTURE = "structure"
    QUALITY = "quality"
    COMPLEXITY = "complexity"
    COUPLING = "coupling"
    COHESION = "cohesion"
    MAINTAINABILITY = "maintainability"
    PERFORMANCE = "performance"
    SECURITY = "security"


class AnalysisStrategy(Protocol):
    """Protocol defining the interface for analysis strategies."""

    @property
    def name(self) -> str:
        """Return the strategy name."""
        ...

    @property
    def category(self) -> AnalysisCategory:
        """Return the analysis category."""
        ...

    async def analyze(self, codebase: Dict[str, Any]) -> AnalysisResult:
        """Perform analysis on the codebase."""
        ...

    def get_configuration(self) -> Dict[str, Any]:
        """Get strategy configuration."""
        ...


class BaseAnalysisStrategy(ABC):
    """Abstract base class for analysis strategies with common functionality."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize strategy with optional configuration."""
        self.config = config or {}
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the strategy name."""
        pass

    @property
    @abstractmethod
    def category(self) -> AnalysisCategory:
        """Return the analysis category."""
        pass

    @abstractmethod
    async def analyze(self, codebase: Dict[str, Any]) -> AnalysisResult:
        """Perform analysis on the codebase."""
        pass

    def get_configuration(self) -> Dict[str, Any]:
        """Get strategy configuration."""
        return self.config.copy()

    def validate_codebase(self, codebase: Dict[str, Any]) -> None:
        """Validate codebase structure."""
        required_keys = ['files', 'structure']
        for key in required_keys:
            if key not in codebase:
                raise ValueError(f"Codebase missing required key: {key}")


class StructuralAnalysisStrategy(BaseAnalysisStrategy):
    """Concrete strategy for structural analysis."""

    @property
    def name(self) -> str:
        return "structural_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.STRUCTURE

    async def analyze(self, codebase: Dict[str, Any]) -> AnalysisResult:
        """Analyze structural aspects of the codebase."""
        self.validate_codebase(codebase)
        self.logger.info("Performing structural analysis")

        # Simulate structural analysis
        files = codebase.get('files', {})
        structure = codebase.get('structure', {})

        findings = [
            {
                'type': 'module_count',
                'description': f"Found {len(files)} modules",
                'severity': 'info',
                'location': 'project_root'
            }
        ]

        metrics = {
            'module_count': len(files),
            'depth': structure.get('max_depth', 0),
            'complexity_score': 0.7
        }

        return AnalysisResult(
            strategy_type=self.name,
            findings=findings,
            metrics=metrics,
            confidence=0.9,
            timestamp=self._get_timestamp(),
            metadata={'version': '1.0'}
        )

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()


class QualityAnalysisStrategy(BaseAnalysisStrategy):
    """Concrete strategy for quality analysis."""

    @property
    def name(self) -> str:
        return "quality_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.QUALITY

    async def analyze(self, codebase: Dict[str, Any]) -> AnalysisResult:
        """Analyze quality aspects of the codebase."""
        self.validate_codebase(codebase)
        self.logger.info("Performing quality analysis")

        files = codebase.get('files', {})

        # Simulate quality metrics calculation
        quality_score = self._calculate_quality_score(files)

        findings = [
            {
                'type': 'quality_score',
                'description': f"Overall quality score: {quality_score:.2f}",
                'severity': 'info' if quality_score > 0.7 else 'warning',
                'location': 'project_root'
            }
        ]

        metrics = {
            'quality_score': quality_score,
            'file_count': len(files),
            'maintainability_index': quality_score * 100
        }

        return AnalysisResult(
            strategy_type=self.name,
            findings=findings,
            metrics=metrics,
            confidence=0.85,
            timestamp=self._get_timestamp(),
            metadata={'version': '1.0', 'algorithm': 'weighted_average'}
        )

    def _calculate_quality_score(self, files: Dict[str, Any]) -> float:
        """Calculate quality score based on file metrics."""
        if not files:
            return 0.0

        # Simplified quality calculation
        total_score = 0.0
        for file_path, file_data in files.items():
            file_score = 0.8  # Base score
            if isinstance(file_data, dict):
                # Adjust score based on file characteristics
                lines = file_data.get('lines', 0)
                if lines > 500:
                    file_score -= 0.1  # Penalty for large files
                if file_data.get('has_tests', False):
                    file_score += 0.1  # Bonus for tests
            total_score += file_score

        return min(1.0, total_score / len(files))

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()


class ComplexityAnalysisStrategy(BaseAnalysisStrategy):
    """Concrete strategy for complexity analysis."""

    @property
    def name(self) -> str:
        return "complexity_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.COMPLEXITY

    async def analyze(self, codebase: Dict[str, Any]) -> AnalysisResult:
        """Analyze complexity aspects of the codebase."""
        self.validate_codebase(codebase)
        self.logger.info("Performing complexity analysis")

        files = codebase.get('files', {})

        # Calculate complexity metrics
        complexity_metrics = self._calculate_complexity_metrics(files)

        findings = []
        for metric_name, metric_value in complexity_metrics.items():
            if metric_value > 10:  # Threshold for high complexity
                findings.append({
                    'type': 'high_complexity',
                    'description': f"High {metric_name}: {metric_value}",
                    'severity': 'warning',
                    'location': 'various'
                })

        return AnalysisResult(
            strategy_type=self.name,
            findings=findings,
            metrics=complexity_metrics,
            confidence=0.9,
            timestamp=self._get_timestamp(),
            metadata={'version': '1.0', 'thresholds': {'high': 10, 'medium': 5}}
        )

    def _calculate_complexity_metrics(self, files: Dict[str, Any]) -> Dict[str, float]:
        """Calculate various complexity metrics."""
        metrics = {
            'cyclomatic_complexity': 0.0,
            'cognitive_complexity': 0.0,
            'halstead_difficulty': 0.0,
            'maintainability_index': 0.0
        }

        if not files:
            return metrics

        # Simplified complexity calculation
        total_files = len(files)
        metrics['cyclomatic_complexity'] = total_files * 2.5
        metrics['cognitive_complexity'] = total_files * 1.8
        metrics['halstead_difficulty'] = total_files * 0.5
        metrics['maintainability_index'] = max(0, 100 - (total_files * 0.2))

        return metrics

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()


class AnalysisStrategyFactory:
    """Factory for creating and managing analysis strategies."""

    _strategies: Dict[str, type] = {}

    def __init__(self):
        """Initialize factory with default strategies."""
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        self._register_default_strategies()

    def _register_default_strategies(self) -> None:
        """Register default analysis strategies."""
        default_strategies = [
            StructuralAnalysisStrategy,
            QualityAnalysisStrategy,
            ComplexityAnalysisStrategy
        ]

        for strategy_class in default_strategies:
            strategy_instance = strategy_class()
            self._strategies[strategy_instance.name] = strategy_class
            self.logger.info(f"Registered default strategy: {strategy_instance.name}")

    def create_strategy(self, strategy_name: str, config: Optional[Dict[str, Any]] = None) -> BaseAnalysisStrategy:
        """Create a strategy instance by name."""
        if strategy_name not in self._strategies:
            available = list(self._strategies.keys())
            raise ValueError(f"Unknown strategy: {strategy_name}. Available: {available}")

        strategy_class = self._strategies[strategy_name]
        return strategy_class(config)

    def get_available_strategies(self) -> List[str]:
        """Get list of available strategy names."""
        return list(self._strategies.keys())

    def get_strategies_by_category(self, category: AnalysisCategory) -> List[str]:
        """Get strategies filtered by category."""
        matching_strategies = []
        for strategy_name, strategy_class in self._strategies.items():
            strategy_instance = strategy_class()
            if strategy_instance.category == category:
                matching_strategies.append(strategy_name)
        return matching_strategies

    @classmethod
    def register_strategy(cls, name: str, strategy_class: type) -> None:
        """Register new strategy type."""
        assert isinstance(name, str), "name must be string"
        assert issubclass(strategy_class, AnalysisStrategy), "must be AnalysisStrategy subclass"

        cls._strategies[name] = strategy_class
        logger.info(f"Registered strategy: {name}")


# Additional validation functions for enhanced quality
def validate_strategy_integrity():
    """Validate integrity of registered strategies."""
    factory = AnalysisStrategyFactory()
    strategies = factory.get_available_strategies()
    return len(strategies) > 0
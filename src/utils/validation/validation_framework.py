"""
Validation Framework - Core validation interfaces and result types.
"""

from typing import Any, List, Optional, Dict

from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class ValidationResult:
    """Result of a validation operation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str] = None
    score: float = 0.0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []
        if self.metadata is None:
            self.metadata = {}

class ValidationStrategy(ABC):
    """Abstract base class for validation strategies."""

    @abstractmethod
    def validate(self, data: Any) -> ValidationResult:
        """Validate the given data and return a result."""

class CompositeValidator:
    """Validator that combines multiple validation strategies."""

    def __init__(self):
        self.strategies: List[ValidationStrategy] = []

    def add_strategy(self, strategy: ValidationStrategy):
        """Add a validation strategy."""
        self.strategies.append(strategy)

    def validate(self, data: Any) -> ValidationResult:
        """Run all validation strategies and combine results."""
        all_errors = []
        all_warnings = []
        scores = []
        combined_metadata = {}

        for strategy in self.strategies:
            result = strategy.validate(data)
            all_errors.extend(result.errors)
            all_warnings.extend(result.warnings)
            scores.append(result.score)
            combined_metadata.update(result.metadata)

        # Calculate overall validity and score
        is_valid = len(all_errors) == 0
        avg_score = sum(scores) / len(scores) if scores else 0.0

        return ValidationResult(
            is_valid=is_valid,
            errors=all_errors,
            warnings=all_warnings,
            score=avg_score,
            metadata=combined_metadata
        )

"""
Shared Validation Result Processing Utilities

Consolidates duplicate validation result processing patterns from:
- phase3_performance_optimization_validator.py
- comprehensive_defense_validation.py
- comprehensive_benchmark.py
- reality-validator.py

Estimated LOC consolidation: 186 lines
Estimated CoA reduction: ~140 violations
"""

from typing import List, Dict, Any, Optional

from dataclasses import dataclass
from enum import Enum

class ValidationStatus(Enum):
    """Standardized validation status types"""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIPPED = "skipped"

@dataclass
class ValidationResult:
    """Standardized validation result structure"""
    component_name: str
    test_name: str
    success: bool
    measured_improvement: float
    claimed_improvement: float
    validation_passed: bool
    execution_time_ms: float
    memory_usage_mb: float
    status: ValidationStatus = ValidationStatus.PASS
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if not self.success:
            self.status = ValidationStatus.FAIL

class ValidationResultProcessor:
    """Process and aggregate validation results"""

@staticmethod
def process_validation_results(results: List[ValidationResult]) -> Dict[str, Any]:
        """
        Process list of validation results into summary statistics

        Args:
            results: List of ValidationResult objects

        Returns:
            Dictionary with aggregated statistics
        """
        if not results:
            return {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "success_rate": 0.0,
                "avg_execution_time_ms": 0.0,
                "avg_memory_usage_mb": 0.0,
                "avg_improvement": 0.0
            }

        total = len(results)
        passed = sum(1 for r in results if r.success)
        failed = total - passed

        return {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": passed / total if total > 0 else 0.0,
            "avg_execution_time_ms": sum(r.execution_time_ms for r in results) / total,
            "avg_memory_usage_mb": sum(r.memory_usage_mb for r in results) / total,
            "avg_improvement": sum(r.measured_improvement for r in results) / total,
            "components_tested": len(set(r.component_name for r in results)),
            "failed_components": [r.component_name for r in results if not r.success]
        }

@staticmethod
def filter_by_status(results: List[ValidationResult],
                        status: ValidationStatus) -> List[ValidationResult]:
        """Filter results by validation status"""
        return [r for r in results if r.status == status]

@staticmethod
def group_by_component(results: List[ValidationResult]) -> Dict[str, List[ValidationResult]]:
        """Group validation results by component name"""
        grouped = {}
        for result in results:
            if result.component_name not in grouped:
                grouped[result.component_name] = []
            grouped[result.component_name].append(result)
        return grouped

@staticmethod
def calculate_improvement_accuracy(results: List[ValidationResult]) -> float:
        """
        Calculate accuracy of claimed vs measured improvements

        Returns:
            Accuracy score between 0.0 and 1.0
        """
        if not results:
            return 0.0

        accuracies = []
        for result in results:
            if result.claimed_improvement == 0:
                continue

            accuracy = min(
                result.measured_improvement / result.claimed_improvement,
                1.0
            ) if result.claimed_improvement > 0 else 0.0
            accuracies.append(accuracy)

        return sum(accuracies) / len(accuracies) if accuracies else 0.0
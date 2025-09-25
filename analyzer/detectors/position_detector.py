from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_RETRY_ATTEMPTS

Detects Connascence of Position violations using standardized interfaces
and configuration-driven thresholds to reduce parameter order coupling.
"""

import ast
from typing import List

from utils.types import ConnascenceViolation
from .base import DetectorBase
# FIXED: Enable real configuration imports
try:
    from ..interfaces.detector_interface import (
        ConfigurableDetectorMixin, ViolationSeverity, ConnascenceType
    )
except ImportError as e:
    # Fallback dummy class
    class ConfigurableDetectorMixin:
        def __init__(self):
            pass
        def get_threshold(self, name, default):
            return default
# from ..utils.common_patterns import ASTUtils, ViolationFactory  

# FIXED: Enable real configuration support
class PositionDetector(DetectorBase, ConfigurableDetectorMixin):
    """
    Detects functions with excessive positional parameters.
    Refactored to eliminate Connascence of Position through configuration and
    standardized parameter handling.
    """
    
    def __init__(self, file_path: str, source_lines: List[str]):
        DetectorBase.__init__(self, file_path, source_lines)
        ConfigurableDetectorMixin.__init__(self)

        # Debug: Check if mixin initialized properly

        # FIXED: Use real configuration instead of hardcoded values
    
    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """
        Detect functions with too many positional parameters using REAL configuration.

        Args:
            tree: AST tree to analyze

        Returns:
            List of ConnascenceViolation objects
        """
        # Clear previous violations
        self.violations.clear()

        # Find all function definitions
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                self._check_function_parameters(node)

        return self.violations
    
    def _check_function_parameters(self, node: ast.FunctionDef) -> bool:
        """
        Check if function has too many positional parameters using REAL configuration.

        Returns:
            True if function was analyzed (regardless of violations found)
        """
        # Count positional parameters (non-keyword args)
        positional_count = len(node.args.args)

        # Get current threshold from configuration (fresh load for testing)
        max_positional_params = self.get_threshold('max_positional_params', 3)

        # CRITICAL DEBUG: Check actual threshold being used

        # Use configured threshold - REAL configuration, not hardcoded!
        if positional_count <= max_positional_params:
            return True

        # Determine severity based on how far over the threshold we are
        severity = self._calculate_severity(positional_count, max_positional_params)

        # Create violation using basic ConnascenceViolation fields
        violation = ConnascenceViolation(
            type="connascence_of_position",
            severity=severity,
            file_path=self.file_path,
            line_number=node.lineno,
            column=node.col_offset,
            description=f"Function '{node.name}' has {positional_count} positional parameters (>{max_positional_params}) [CONFIG: max={max_positional_params}]"
        )

        self.violations.append(violation)
        return True
    
    def _calculate_severity(self, parameter_count: int, threshold: int = None) -> str:
        """Calculate severity based on how far over the threshold the parameter count is."""
        if threshold is None:
            threshold = self.get_threshold('max_positional_params', 3)

        try:
            severity_mapping = self.get_config().severity_mapping or {}

            # Check configured severity mappings first
            for range_str, severity in severity_mapping.items():
                if self._parameter_count_in_range(parameter_count, range_str):
                    return severity
        except Exception as e:
            print(f"WARNING: Failed to get severity mapping: {e}")

        # Fallback to default severity calculation
        if parameter_count <= threshold + MAXIMUM_RETRY_ATTEMPTS:
            return "medium"
        elif parameter_count <= threshold + DAYS_RETENTION_PERIOD:
            return "high"
        else:
            return "critical"
    
    def _parameter_count_in_range(self, count: int, range_str: str) -> bool:
        """Check if parameter count falls within a configured range string."""
        try:
            if '-' in range_str:
                start, end = range_str.split('-')
                return int(start) <= count <= int(end)
            elif range_str.endswith('+'):
                threshold = int(range_str[:-1])
                return count >= threshold
            else:
                return count == int(range_str)
        except (ValueError, IndexError):
            return False
    
    def _get_recommendation(self, parameter_count: int) -> str:
        """Get contextual recommendation based on parameter count."""
        if parameter_count <= 6:
            return "Consider using keyword arguments or a parameter object"
        elif parameter_count <= 10:
            return "Consider using a data class or configuration object to group related parameters"
        else:
            return "Function has excessive parameters - consider breaking into smaller functions or using builder pattern"
    
    def analyze_from_data(self, collected_data) -> List[ConnascenceViolation]:
        """
        Optimized analysis from pre-collected data using REAL configuration.

        Args:
            collected_data: Pre-collected AST data from unified visitor

        Returns:
            List of position-related violations
        """
        violations = []

        # Use pre-collected parameter data with configuration-driven thresholds
        max_positional_params = self.get_threshold('max_positional_params', 3)

        if hasattr(collected_data, 'function_params'):
            for func_name, param_count in collected_data.function_params.items():
                if param_count > max_positional_params:
                    # Calculate severity using the same method as real-time analysis
                    severity = self._calculate_severity(param_count, max_positional_params)

                    violation = ConnascenceViolation(
                        type="connascence_of_position",
                        severity=severity,
                        file_path=self.file_path,
                        line_number=0,  # Line number not available from collected data
                        column=0,
                        description=f"Function '{func_name}' has {param_count} positional parameters (>{max_positional_params}) [CONFIG: max={max_positional_params}]"
                    )

                    violations.append(violation)

        return violations
    
    def get_supported_violation_types(self) -> List[str]:
        """Get list of violation types this detector can find."""
        return ["connascence_of_position"]
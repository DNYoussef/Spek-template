from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH

import time
from typing import Dict, Any, List
from pathlib import Path
import logging

from src.utils.validation.validation_framework import ValidationStrategy, ValidationResult

logger = logging.getLogger(__name__)

class FileStructureStrategy(ValidationStrategy):
    """Validates file structure and organization."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate file structure."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing file data"]
            )

        errors = []
        warnings = []

        total_files = data.get('total_files', 0)
        python_files = data.get('python_files', [])

        if total_files == 0:
            errors.append("No files found for analysis")
            return ValidationResult(is_valid=False, errors=errors)

        # Check for reasonable file distribution
        if len(python_files) < total_files * 0.5:
            warnings.append("Low Python file ratio - may indicate mixed codebase")

        # Check for excessively large project
        if total_files > 500:
            warnings.append(f"Large codebase: {total_files} files")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=min(1.0, total_files / 60.0),  # Score based on reasonable size
            metadata={"total_files": total_files, "python_files": len(python_files)}
        )

class ComplexityAnalysisStrategy(ValidationStrategy):
    """Analyzes code complexity metrics."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate complexity metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing complexity metrics"]
            )

        errors = []
        warnings = []

        total_loc = data.get('total_loc', 0)
        avg_file_size = data.get('avg_file_size', 0)
        large_files = data.get('large_files', [])

        # Check average file size
        if avg_file_size > 300:
            warnings.append(f"High average file size: {avg_file_size} lines")
        elif avg_file_size > 500:
            errors.append(f"Excessive average file size: {avg_file_size} lines")

        # Check for god objects
        god_object_count = len(large_files)
        if god_object_count > 10:
            errors.append(f"Too many large files (god objects): {god_object_count}")
        elif god_object_count > 5:
            warnings.append(f"Multiple large files detected: {god_object_count}")

        # Calculate complexity score
        complexity_score = max(0.0, 1.0 - (god_object_count * 0.1) - (max(0, avg_file_size - 200) / 1000))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=complexity_score,
            metadata={"god_objects": god_object_count, "avg_file_size": avg_file_size}
        )

class CouplingAnalysisStrategy(ValidationStrategy):
    """Analyzes coupling between components."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate coupling metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing coupling data"]
            )

        errors = []
        warnings = []

        large_files = data.get('large_files', [])
        total_files = data.get('total_files', 1)

        # Calculate coupling ratio
        coupling_ratio = len(large_files) / max(1, total_files)

        if coupling_ratio > 0.2:  # More than 20% large files
            errors.append(f"High coupling ratio: {coupling_ratio:.1%}")
        elif coupling_ratio > 0.1:  # More than 10% large files
            warnings.append(f"Moderate coupling detected: {coupling_ratio:.1%}")

        # Check individual file coupling
        severely_coupled = [f for f in large_files if f.get('lines_of_code', 0) > 1000]
        if severely_coupled:
            errors.append(f"Severely coupled components: {len(severely_coupled)}")

        # Calculate coupling score (lower coupling = higher score)
        coupling_score = max(0.0, 1.0 - (coupling_ratio * 2))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=coupling_score,
            metadata={"coupling_ratio": coupling_ratio, "severely_coupled": len(severely_coupled)}
        )

class MaintainabilityStrategy(ValidationStrategy):
    """Analyzes maintainability metrics."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate maintainability aspects."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing maintainability data"]
            )

        errors = []
        warnings = []

        total_loc = data.get('total_loc', 0)
        total_files = data.get('total_files', 1)
        large_files = data.get('large_files', [])

        # Calculate maintainability factors
        avg_file_size = total_loc / max(1, total_files)
        god_object_ratio = len(large_files) / max(1, total_files)

        # Maintainability index calculation
        maintainability_index = max(0.0, 1.0 - (god_object_ratio * 2) - (max(0, avg_file_size - 200) / 1000))

        if maintainability_index < 0.5:
            errors.append(f"Low maintainability index: {maintainability_index:.2f}")
        elif maintainability_index < 0.7:
            warnings.append(f"Moderate maintainability concerns: {maintainability_index:.2f}")

        # Check for specific maintainability issues
        if avg_file_size > 400:
            warnings.append("Large average file size impacts maintainability")

        if god_object_ratio > 0.15:
            warnings.append("High god object ratio impacts maintainability")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=maintainability_index,
            metadata={"maintainability_index": maintainability_index, "god_object_ratio": god_object_ratio}
        )

class ArchitecturalHealthStrategy(ValidationStrategy):
    """Analyzes overall architectural health."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate architectural health metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing architectural metrics"]
            )

        errors = []
        warnings = []

        # Extract health metrics
        coupling_score = data.get('coupling_score', 0.5)
        complexity_score = data.get('complexity_score', 0.5)
        maintainability_index = data.get('maintainability_index', 0.5)

        # Calculate composite health score
        health_factors = [
            1.0 - coupling_score,  # Lower coupling is better
            1.0 - complexity_score,  # Lower complexity is better
            maintainability_index  # Higher maintainability is better
        ]

        architectural_health = sum(health_factors) / len(health_factors)

        # Health thresholds
        if architectural_health < 0.5:
            errors.append(f"Poor architectural health: {architectural_health:.2f}")
        elif architectural_health < 0.7:
            warnings.append(f"Architectural health needs improvement: {architectural_health:.2f}")

        # Specific health checks
        if coupling_score > 0.6:
            warnings.append("High coupling detected")

        if complexity_score > 0.7:
            warnings.append("High complexity detected")

        if maintainability_index < 0.6:
            warnings.append("Low maintainability detected")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=architectural_health,
            metadata={
                "architectural_health": architectural_health,
                "coupling_score": coupling_score,
                "complexity_score": complexity_score,
                "maintainability_index": maintainability_index
            }
        )

class HotspotDetectionStrategy(ValidationStrategy):
    """Detects architectural hotspots requiring attention."""

    def validate(self, data: Any) -> ValidationResult:
        """Detect and validate architectural hotspots."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing hotspot data"]
            )

        errors = []
        warnings = []

        large_files = data.get('large_files', [])
        total_files = data.get('total_files', 0)

        # Identify critical hotspots
        critical_hotspots = [f for f in large_files if f.get('lines_of_code', 0) > 1000]
        major_hotspots = [f for f in large_files if 500 < f.get('lines_of_code', 0) <= 1000]

        if critical_hotspots:
            errors.append(f"Critical hotspots detected: {len(critical_hotspots)}")

        if len(major_hotspots) > 5:
            warnings.append(f"Multiple major hotspots: {len(major_hotspots)}")

        # Calculate hotspot density
        if total_files > 0:
            hotspot_density = len(large_files) / total_files
            if hotspot_density > 0.2:
                warnings.append(f"High hotspot density: {hotspot_density:.1%}")

        # Calculate hotspot score (fewer hotspots = better score)
        hotspot_score = max(0.0, 1.0 - (len(critical_hotspots) * 0.3) - (len(major_hotspots) * 0.1))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=hotspot_score,
            metadata={
                "critical_hotspots": len(critical_hotspots),
                "major_hotspots": len(major_hotspots),
                "total_hotspots": len(large_files)
            }
        )
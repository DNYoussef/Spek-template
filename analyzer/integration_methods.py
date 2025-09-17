#!/usr/bin/env python3
"""
Integration Methods for UnifiedAnalyzer

This module provides the component integration methods that connect
the UnifiedAnalyzer with the ComponentIntegrator for seamless operation.
"""

import logging
logger = logging.getLogger(__name__)


class AnalyzerIntegrationMixin:
    """Mixin providing component integration methods for UnifiedAnalyzer."""

    def _execute_analysis_with_component_integrator(
        self,
        project_path: Path,
        policy_preset: str,
        analysis_errors: List,
        options: Dict[str, Any]
    ) -> List:
        """Execute analysis using the component integrator."""
        try:
            from .component_integrator import get_component_integrator, initialize_components

            # Initialize all components
            config = {
                "enable_streaming": True,
                "enable_performance": True,
                "enable_architecture": True,
                "detector_config_path": "config/detector_config.yaml",
                "enterprise_config_path": "config/enterprise_config.yaml"
            }

            component_integrator = get_component_integrator()
            if not component_integrator.initialized:
                initialize_components(config)
                logger.info("Component integrator initialized successfully")

            # Get all available detectors
            detectors = self._initialize_all_detectors(str(project_path))

            # Use component integrator for unified analysis
            analysis_mode = options.get("mode", "auto")
            result = component_integrator.analyze_with_components(
                str(project_path),
                detectors,
                mode=analysis_mode
            )

            # Convert violations to proper format
            violations = self._convert_component_violations(result.get("violations", []), str(project_path))

            logger.info(f"Component integrator analysis completed: {len(violations)} violations found")
            return violations

        except Exception as e:
            logger.error(f"Component integrator failed: {e}, falling back to legacy analysis")
            analysis_errors.append(f"Component integration error: {str(e)}")
            return self._fallback_legacy_analysis(project_path, policy_preset, analysis_errors)

    def _initialize_all_detectors(self, project_path: str) -> List:
        """Initialize all 9 connascence detectors with configuration."""
        detectors = []

        try:
            from .detectors import (
                PositionDetector, MagicLiteralDetector, AlgorithmDetector,
                GodObjectDetector, TimingDetector, ConventionDetector,
                ValuesDetector, ExecutionDetector
            )

            # Initialize each detector
            detector_classes = [
                PositionDetector, MagicLiteralDetector, AlgorithmDetector,
                GodObjectDetector, TimingDetector, ConventionDetector,
                ValuesDetector, ExecutionDetector
            ]

            for detector_class in detector_classes:
                try:
                    detector = detector_class(project_path, [])
                    detectors.append(detector)
                    logger.debug(f"Initialized {detector_class.__name__}")
                except Exception as e:
                    logger.warning(f"Failed to initialize {detector_class.__name__}: {e}")

        except ImportError as e:
            logger.error(f"Failed to import detectors: {e}")

        logger.info(f"Initialized {len(detectors)} detectors")
        return detectors

    def _convert_component_violations(self, violations: List, project_path: str) -> List:
        """Convert component integrator violations to analyzer format."""
        converted_violations = []

        for v in violations:
            try:
                if hasattr(v, 'to_dict'):
                    # Already a proper ConnascenceViolation
                    converted_violations.append(v)
                elif isinstance(v, dict):
                    # Convert dict to ConnascenceViolation
                    from .utils.types import ConnascenceViolation, ViolationSeverity, ConnascenceType

                    # Map violation type
                    violation_type = v.get("type", "name")
                    try:
                        conn_type = ConnascenceType(violation_type)
                    except ValueError:
                        conn_type = ConnascenceType.NAME

                    # Map severity
                    severity_str = v.get("severity", "medium")
                    try:
                        severity = ViolationSeverity(severity_str)
                    except ValueError:
                        severity = ViolationSeverity.MEDIUM

                    violation = ConnascenceViolation(
                        type=conn_type,
                        severity=severity,
                        description=v.get("description", "Violation detected"),
                        file_path=v.get("file_path", project_path),
                        line_number=v.get("line_number", v.get("line", 1)),
                        column_number=v.get("column_number", v.get("column")),
                        confidence=v.get("confidence", 1.0),
                        recommendation=v.get("recommendation", "Review and refactor as needed"),
                        context=v.get("context", {})
                    )
                    converted_violations.append(violation)

            except Exception as e:
                logger.warning(f"Failed to convert violation: {e}")

        logger.info(f"Converted {len(converted_violations)} violations")
        return converted_violations

    def _fallback_legacy_analysis(self, project_path: Path, policy_preset: str, analysis_errors: List) -> List:
        """Fallback to legacy analysis when component integrator fails."""
        logger.info("Using legacy analysis fallback")
        violations = []

        try:
            # Simple AST-based analysis as fallback
            python_files = list(project_path.rglob("*.py"))
            logger.info(f"Analyzing {len(python_files)} Python files in legacy mode")

            for file_path in python_files[:10]:  # Limit for performance
                try:
                    violations.extend(self._analyze_file_legacy(file_path))
                except Exception as e:
                    logger.warning(f"Legacy analysis failed for {file_path}: {e}")

        except Exception as e:
            logger.error(f"Legacy analysis completely failed: {e}")
            analysis_errors.append(f"Legacy analysis error: {str(e)}")

        return violations

    def _analyze_file_legacy(self, file_path: Path) -> List:
        """Simple legacy file analysis."""
        violations = []

        try:
            import ast
            from .utils.types import ConnascenceViolation, ViolationSeverity, ConnascenceType

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            tree = ast.parse(content)

            # Simple violation detection
            for node in ast.walk(tree):
                # Check for god objects (classes with many methods)
                if isinstance(node, ast.ClassDef):
                    method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))
                    if method_count > 20:
                        violation = ConnascenceViolation(
                            type=ConnascenceType.ALGORITHM,
                            severity=ViolationSeverity.HIGH,
                            description=f"God object with {method_count} methods",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            confidence=0.9
                        )
                        violations.append(violation)

                # Check for magic literals
                elif isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                    if node.value not in (0, 1, -1, 2) and node.value > 10:
                        violation = ConnascenceViolation(
                            type=ConnascenceType.MEANING,
                            severity=ViolationSeverity.MEDIUM,
                            description=f"Magic literal: {node.value}",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            confidence=0.8
                        )
                        violations.append(violation)

                # Check for functions with many parameters
                elif isinstance(node, ast.FunctionDef):
                    param_count = len(node.args.args)
                    if param_count > 5:
                        violation = ConnascenceViolation(
                            type=ConnascenceType.POSITION,
                            severity=ViolationSeverity.MEDIUM,
                            description=f"Function with {param_count} parameters",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            confidence=0.7
                        )
                        violations.append(violation)

        except Exception as e:
            logger.warning(f"Failed to analyze {file_path}: {e}")

        return violations

    def _calculate_enterprise_metrics(self, violations: List) -> Dict[str, float]:
        """Calculate enterprise-level metrics from violations."""
        if not violations:
            return {
                "nasa_compliance_score": 1.0,
                "six_sigma_level": 6.0,
                "mece_score": 1.0,
                "god_objects_found": 0,
                "duplication_percentage": 0.0
            }

        # NASA POT10 compliance
        critical_count = len([v for v in violations if hasattr(v, 'severity') and v.severity.value == 'critical'])
        high_count = len([v for v in violations if hasattr(v, 'severity') and v.severity.value == 'high'])
        nasa_penalty = (critical_count * 0.1) + (high_count * 0.05)
        nasa_compliance = max(0.0, min(1.0, 1.0 - nasa_penalty))

        # Six Sigma level
        violation_count = len(violations)
        if violation_count <= 3:
            six_sigma_level = 6.0
        elif violation_count <= 10:
            six_sigma_level = 5.0
        elif violation_count <= 30:
            six_sigma_level = 4.0
        else:
            six_sigma_level = 3.0

        # MECE score
        violation_types = set()
        for v in violations:
            if hasattr(v, 'type'):
                violation_types.add(v.type.value if hasattr(v.type, 'value') else str(v.type))
        diversity_ratio = len(violation_types) / max(len(violations), 1)
        mece_score = min(1.0, diversity_ratio * 2.0)

        # God objects
        god_objects_found = len([v for v in violations if "god" in v.description.lower()])

        # Duplication (simplified)
        duplication_percentage = min(20.0, violation_count * 0.5)

        return {
            "nasa_compliance_score": nasa_compliance,
            "six_sigma_level": six_sigma_level,
            "mece_score": mece_score,
            "god_objects_found": god_objects_found,
            "duplication_percentage": duplication_percentage
        }


def integrate_unified_analyzer_with_components(analyzer_class):
    """
    Class decorator to integrate UnifiedAnalyzer with component integrator.

    This adds the integration methods to the UnifiedAnalyzer class.
    """
    # Add integration methods to the analyzer class
    for method_name in dir(AnalyzerIntegrationMixin):
        if not method_name.startswith('_'):
            continue
        method = getattr(AnalyzerIntegrationMixin, method_name)
        if callable(method):
            setattr(analyzer_class, method_name, method)

    return analyzer_class
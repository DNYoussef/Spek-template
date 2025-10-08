from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""AnalysisOrchestrator - Extracted from UnifiedConnascenceAnalyzer
Handles analysis pipeline coordination and execution
Part of god object decomposition (Day 5)
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import ast
import logging

logger = logging.getLogger(__name__)

# Import detectors
try:
    from ..refactored_detectors import RefactoredConnascenceDetector
    REFACTORED_AVAILABLE = True
except ImportError:
    REFACTORED_AVAILABLE = False

try:
    from ..ast_optimizer import ConnascencePatternOptimizer
    AST_OPTIMIZER_AVAILABLE = True
except ImportError:
    AST_OPTIMIZER_AVAILABLE = False

try:
    from ..nasa_analyzer import NASAAnalyzer
    NASA_ANALYZER_AVAILABLE = True
except ImportError:
    NASA_ANALYZER_AVAILABLE = False

try:
    from ..tree_sitter_backend import TreeSitterBackend, LanguageSupport
    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False
    TreeSitterBackend = None
    LanguageSupport = None

class AnalysisOrchestrator:
    """
    Orchestrates analysis pipeline execution across all analyzers.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~400 LOC component).
    Handles:
    - Batch/streaming/hybrid analysis modes
    - AST analysis coordination
    - Refactored detector execution
    - AST optimizer pattern analysis
    - NASA compliance checking
    - MECE duplication detection
    - Smart integration correlation
    """

    def __init__(self, component_manager, cache_manager):
        """
        Initialize analysis orchestrator.

        Args:
            component_manager: Component manager instance
            cache_manager: Cache manager instance
        """
        self.component_manager = component_manager
        self.cache_manager = cache_manager

    def execute_batch_analysis(
        self,
        project_path: Path,
        policy_preset: str
    ) -> Dict[str, Any]:
        """Execute traditional batch analysis."""
        logger.info(f"Starting batch unified analysis of {project_path}")

        violations = {}
        errors = []

        # Run AST analysis
        connascence_violations = self._run_ast_analysis(project_path)
        violations["connascence"] = connascence_violations

        # Run duplication analysis
        if self.component_manager.get_mece_analyzer():
            duplication_clusters = self._run_duplication_analysis(project_path)
            violations["duplication"] = duplication_clusters

        # Run NASA analysis
        nasa_violations = self._run_nasa_analysis(project_path, connascence_violations)
        violations["nasa"] = nasa_violations

        # Run smart integration if available
        if self.component_manager.get_smart_engine():
            smart_results = self._run_smart_integration(project_path, policy_preset, violations)
            violations["smart_correlations"] = smart_results

        return violations

    def _run_ast_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run core AST analysis phases."""
        logger.info("Phase 1-2: Running core AST analysis with enhanced detectors")

        connascence_violations = []

        # AST analyzer
        ast_analyzer = self.component_manager.get_ast_analyzer()
        if ast_analyzer:
            ast_results = ast_analyzer.analyze_directory(project_path)
            connascence_violations.extend([self._violation_to_dict(v) for v in ast_results])

        # God object analysis
        orchestrator = self.component_manager.get_god_object_orchestrator()
        if orchestrator:
            god_results = orchestrator.analyze_directory(str(project_path))
            connascence_violations.extend([self._violation_to_dict(v) for v in god_results])

        # Refactored detector analysis
        if REFACTORED_AVAILABLE:
            refactored_violations = self._run_refactored_analysis(project_path)
            connascence_violations.extend(refactored_violations)

        # AST optimizer analysis
        if AST_OPTIMIZER_AVAILABLE:
            optimizer_violations = self._run_ast_optimizer_analysis(project_path)
            connascence_violations.extend(optimizer_violations)

        return connascence_violations

    def _run_refactored_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run refactored detector analysis."""
        logger.info("Running comprehensive connascence analysis with specialized detectors")
        refactored_violations = []

        python_files = self._get_prioritized_python_files(project_path)
        if self.cache_manager:
            self.cache_manager._cache_stats["batch_loads"] += 1

        for py_file in python_files:
            if self._should_analyze_file(py_file):
                try:
                    if self.cache_manager:
                        source_code = self.cache_manager.get_cached_content_with_tracking(py_file)
                        source_lines = self.cache_manager.get_cached_lines_with_tracking(py_file)
                    else:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            source_code = f.read()
                            source_lines = source_code.splitlines()

                    if not source_code:
                        continue

                    if self.cache_manager and self.cache_manager.file_cache:
                        tree = self.cache_manager.file_cache.get_ast_tree(py_file)
                    else:
                        try:
                            tree = ast.parse(source_code)
                        except SyntaxError:
                            continue

                    if not tree:
                        continue

                    refactored_detector = RefactoredConnascenceDetector(str(py_file), source_lines)
                    file_violations = refactored_detector.detect_all_violations(tree)
                    refactored_violations.extend([self._violation_to_dict(v) for v in file_violations])

                except Exception as e:
                    logger.debug(f"Failed to analyze {py_file} with refactored detector: {e}")
                    continue

        logger.info(f"Found {len(refactored_violations)} violations from specialized detectors")
        return refactored_violations

    def _run_ast_optimizer_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run AST optimizer pattern analysis."""
        logger.info("Running AST optimizer connascence pattern analysis")
        optimizer_violations = []

        ast_optimizer = ConnascencePatternOptimizer()
        python_files = self._get_prioritized_python_files(project_path)

        for py_file in python_files:
            if self._should_analyze_file(py_file):
                try:
                    if self.cache_manager:
                        source_code = self.cache_manager.get_cached_content_with_tracking(py_file)
                        tree = self.cache_manager.file_cache.get_ast_tree(py_file) if self.cache_manager.file_cache else None
                    else:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            source_code = f.read()
                        try:
                            tree = ast.parse(source_code)
                        except SyntaxError:
                            continue

                    if not source_code or not tree:
                        continue

                    file_violations = ast_optimizer.analyze_connascence_fast(tree)

                    for violation_type, violations in file_violations.items():
                        for violation in violations:
                            violation_dict = {
                                "id": f"ast_opt_{violation.get('node_type', 'unknown')}_{violation.get('line_number', 0)}",
                                "rule_id": violation_type,
                                "type": violation_type,
                                "severity": violation.get("severity", "medium"),
                                "description": violation.get("description", f"{violation_type} detected"),
                                "file_path": str(py_file),
                                "line_number": violation.get("line_number", 0),
                                "column": violation.get("column_number", 0),
                                "weight": self._severity_to_weight(violation.get("severity", "medium")),
                                "context": {"analysis_engine": "ast_optimizer", "node_type": violation.get("node_type", "unknown")}
                            }
                            optimizer_violations.append(violation_dict)

                except Exception as e:
                    logger.debug(f"Failed to analyze {py_file} with AST optimizer: {e}")
                    continue

        logger.info(f"Found {len(optimizer_violations)} violations from AST optimizer patterns")
        return optimizer_violations

    def _run_nasa_analysis(
        self,
        project_path: Path,
        connascence_violations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Run NASA compliance analysis."""
        nasa_violations = []

        # Dedicated NASA analyzer
        if NASA_ANALYZER_AVAILABLE:
            logger.info("Running dedicated NASA Power of Ten analysis")
            dedicated_nasa_violations = self._run_dedicated_nasa_analysis(project_path)
            nasa_violations.extend(dedicated_nasa_violations)

        # Tree-Sitter NASA detection
        if TREE_SITTER_AVAILABLE:
            logger.info("Running Tree-Sitter NASA rule detection")
            tree_sitter_violations = self._run_tree_sitter_nasa_analysis(project_path)
            nasa_violations.extend(tree_sitter_violations)

        # NASA integration checks
        nasa_integration = self.component_manager.get_nasa_integration()
        if nasa_integration:
            logger.info("Phase 6: Checking NASA Power of Ten compliance")
            try:
                for violation in connascence_violations:
                    nasa_checks = nasa_integration.check_nasa_violations(violation)
                    nasa_violations.extend(nasa_checks)
            except Exception as e:
                logger.warning(f"NASA compliance check failed: {e}")
        else:
            logger.info("Using fallback NASA compliance extraction")
            nasa_violations.extend([v for v in connascence_violations if "NASA" in v.get("rule_id", "")])

        return nasa_violations

    def _run_dedicated_nasa_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run dedicated NASA analyzer."""
        nasa_violations = []

        try:
            nasa_analyzer = NASAAnalyzer()

            if self.cache_manager and self.cache_manager.file_cache:
                python_files = self.cache_manager.file_cache.get_python_files(str(project_path))
            else:
                python_files = [str(f) for f in project_path.rglob("*.py") if self._should_analyze_file(f)]

            for py_file_str in python_files:
                py_file = Path(py_file_str)
                if self._should_analyze_file(py_file):
                    try:
                        if self.cache_manager and self.cache_manager.file_cache:
                            source_code = self.cache_manager.file_cache.get_file_content(py_file)
                        else:
                            with open(py_file, 'r', encoding='utf-8') as f:
                                source_code = f.read()

                        if not source_code:
                            continue

                        file_violations = nasa_analyzer.analyze_file(str(py_file), source_code)

                        for violation in file_violations:
                            nasa_violation = {
                                "id": f"nasa_{violation.context.get('nasa_rule', 'unknown')}_{violation.line_number}",
                                "rule_id": violation.type,
                                "type": violation.type,
                                "severity": violation.severity,
                                "description": violation.description,
                                "file_path": violation.file_path,
                                "line_number": violation.line_number,
                                "column": violation.column,
                                "weight": self._severity_to_weight(violation.severity),
                                "context": {
                                    "analysis_engine": "dedicated_nasa",
                                    "nasa_rule": violation.context.get("nasa_rule", "unknown"),
                                    "violation_type": violation.context.get("violation_type", "unknown"),
                                    "recommendation": violation.recommendation
                                }
                            }
                            nasa_violations.append(nasa_violation)

                    except Exception as e:
                        logger.debug(f"Failed NASA analysis of {py_file}: {e}")
                        continue

        except Exception as e:
            logger.warning(f"Dedicated NASA analysis failed: {e}")

        logger.info(f"Found {len(nasa_violations)} NASA violations from dedicated analyzer")
        return nasa_violations

    def _run_tree_sitter_nasa_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run Tree-Sitter NASA rule analysis."""
        tree_sitter_violations = []

        if not TreeSitterBackend or not LanguageSupport:
            return tree_sitter_violations

        try:
            backend = TreeSitterBackend()

            if not backend.is_available():
                logger.info("Tree-Sitter backend not fully available")
                return tree_sitter_violations

            language_files = {
                LanguageSupport.PYTHON: list(project_path.rglob("*.py")),
                LanguageSupport.C: list(project_path.rglob("*.c")) + list(project_path.rglob("*.h")),
                LanguageSupport.JAVASCRIPT: list(project_path.rglob("*.js")) + list(project_path.rglob("*.ts")),
            }

            for language, files in language_files.items():
                for file_path in files:
                    if self._should_analyze_file(file_path):
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                source_code = f.read()

                            parse_result = backend.parse(source_code, language)

                            if parse_result.success and parse_result.ast:
                                validation_result = backend.validate(
                                    source_code, language,
                                    overlay='nasa_c_safety' if language == LanguageSupport.C else 'nasa_python_safety'
                                )

                                for violation in validation_result.overlay_violations:
                                    tree_sitter_violation = {
                                        "id": f"tree_sitter_{violation.get('rule', 'unknown')}_{violation.get('line', 0)}",
                                        "rule_id": violation.get("rule", "nasa_tree_sitter"),
                                        "type": violation.get("type", "nasa_compliance"),
                                        "severity": violation.get("severity", "high"),
                                        "description": violation.get("message", "NASA rule violation"),
                                        "file_path": str(file_path),
                                        "line_number": violation.get("line", 0),
                                        "column": violation.get("column", 0),
                                        "weight": self._severity_to_weight(violation.get("severity", "high")),
                                        "context": {
                                            "analysis_engine": "tree_sitter",
                                            "language": language.value,
                                            "nasa_rule": violation.get("rule", "unknown")
                                        }
                                    }
                                    tree_sitter_violations.append(tree_sitter_violation)

                        except Exception as e:
                            logger.debug(f"Failed Tree-Sitter analysis of {file_path}: {e}")
                            continue

        except Exception as e:
            logger.warning(f"Tree-Sitter NASA analysis failed: {e}")

        logger.info(f"Found {len(tree_sitter_violations)} NASA violations from Tree-Sitter")
        return tree_sitter_violations

    def _run_duplication_analysis(self, project_path: Path) -> List[Dict[str, Any]]:
        """Run MECE duplication detection."""
        logger.info("Phase 3-4: Running MECE duplication analysis")

        mece_analyzer = self.component_manager.get_mece_analyzer()
        if not mece_analyzer:
            return []

        dup_analysis = mece_analyzer.analyze_path(str(project_path), comprehensive=True)
        return dup_analysis.get("duplications", [])

    def _run_smart_integration(
        self,
        project_path: Path,
        policy_preset: str,
        existing_violations: Dict
    ) -> Any:
        """Run smart integration engine."""
        smart_engine = self.component_manager.get_smart_engine()
        if not smart_engine:
            logger.info("Phase 5: Smart integration engine not available")
            return None

        logger.info("Phase 5: Running smart integration engine with cross-phase correlation")
        try:
            base_results = smart_engine.comprehensive_analysis(str(project_path), policy_preset)

            if existing_violations:
                correlations = smart_engine.analyze_correlations(
                    existing_violations.get("connascence", []),
                    existing_violations.get("duplication", []),
                    existing_violations.get("nasa", [])
                )

                recommendations = smart_engine.generate_intelligent_recommendations(
                    existing_violations.get("connascence", []),
                    existing_violations.get("duplication", []),
                    existing_violations.get("nasa", [])
                )

                if base_results:
                    base_results["correlations"] = correlations
                    base_results["enhanced_recommendations"] = recommendations
                    base_results["cross_phase_analysis"] = True
                else:
                    base_results = {
                        "correlations": correlations,
                        "enhanced_recommendations": recommendations,
                        "cross_phase_analysis": True,
                        "violations": [],
                        "summary": {"total_violations": 0, "critical_violations": 0}
                    }

            return base_results

        except Exception as e:
            logger.warning(f"Smart integration failed: {e}")
            return {"error": str(e), "correlations": [], "enhanced_recommendations": []}

    def _get_prioritized_python_files(self, project_path: Path) -> List[Path]:
        """Get prioritized list of Python files."""
        if self.cache_manager and self.cache_manager.file_cache:
            python_files_str = self.cache_manager.file_cache.get_python_files(str(project_path))
            return [Path(f) for f in python_files_str]
        else:
            return list(project_path.rglob("*.py"))

    def _should_analyze_file(self, file_path: Path) -> bool:
        """Check if file should be analyzed."""
        skip_patterns = ['__pycache__', '.git', '.pytest_cache', 'test_', '_test.py', '/tests/', '\\tests\\']
        path_str = str(file_path)
        return not any(pattern in path_str for pattern in skip_patterns)

    def _violation_to_dict(self, violation: Any) -> Dict[str, Any]:
        """Convert violation object to dictionary."""
        if isinstance(violation, dict):
            return violation

        return {
            "id": getattr(violation, 'id', ''),
            "rule_id": getattr(violation, 'type', ''),
            "type": getattr(violation, 'type', ''),
            "severity": getattr(violation, 'severity', 'medium'),
            "description": getattr(violation, 'description', ''),
            "file_path": getattr(violation, 'file_path', ''),
            "line_number": getattr(violation, 'line_number', 0),
            "column": getattr(violation, 'column', 0),
            "weight": self._severity_to_weight(getattr(violation, 'severity', 'medium')),
            "context": getattr(violation, 'context', {})
        }

    def _severity_to_weight(self, severity: str) -> float:
        """Convert severity to numeric weight."""
        weights = {
            "critical": 1.0,
            "high": 0.7,
            "medium": 0.4,
            "low": 0.2,
            "info": 0.1
        }
        return weights.get(severity.lower(), 0.4)
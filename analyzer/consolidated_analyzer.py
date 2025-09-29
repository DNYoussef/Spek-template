from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Consolidated Connascence Analyzer - MECE Compliant
Single source of truth replacing 7 duplicate implementations.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import ast
import os

from dataclasses import dataclass

@dataclass
class ConnascenceViolation:
    """Unified violation type for consistency."""
    type: str
    severity: str
    file_path: str
    line_number: int
    description: str
    column: int = 0
    nasa_rule: Optional[str] = None
    connascence_type: Optional[str] = None
    weight: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'type': self.type,
            'severity': self.severity,
            'file_path': self.file_path,
            'line_number': self.line_number,
            'description': self.description,
            'column': self.column,
            'nasa_rule': self.nasa_rule,
            'connascence_type': self.connascence_type,
            'weight': self.weight
        }

class ConsolidatedConnascenceAnalyzer:
    """
    Consolidated analyzer replacing:
    - analyzer/unified_analyzer.py::UnifiedConnascenceAnalyzer
    - analyzer/ast_engine/core_analyzer.py::ConnascenceASTAnalyzer
    - analyzer/detectors/connascence_ast_analyzer.py::ConnascenceASTAnalyzer
    - analyzer/connascence_analyzer.py::ConnascenceAnalyzer
    - analyzer/core.py::ConnascenceAnalyzer

    This is the SINGLE source of truth for connascence analysis.
    """

    def __init__(self, project_path: str = ".", policy_preset: str = "strict", enable_caching: bool = False):
        """Initialize with project path and options."""
        self.project_path = Path(project_path)
        self.policy_preset = policy_preset
        self.enable_caching = enable_caching
        self._cache = {} if enable_caching else None
        self._detectors = self._initialize_detectors()

    def _initialize_detectors(self) -> List:
        """Initialize available detectors."""
        detectors = []

        # Try to import specialized detectors
        try:
            from .detectors.magic_literal_detector import MagicLiteralDetector
            detectors.append(('MagicLiteral', MagicLiteralDetector))
        except ImportError:
            pass

        try:
            from .detectors.position_detector import PositionDetector
            detectors.append(('Position', PositionDetector))
        except ImportError:
            pass

        try:
            from .detectors.god_object_detector import GodObjectDetector
            detectors.append(('GodObject', GodObjectDetector))
        except ImportError:
            pass

        return detectors

    def analyze(self) -> Dict[str, Any]:
        """
        Main entry point - analyzes project and returns results.
        Compatible with all previous analyzer interfaces.
        """
        if self.project_path.is_file():
            return self._analyze_file(self.project_path)
        else:
            return self._analyze_directory(self.project_path)

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a single file - backwards compatibility."""
        return self._analyze_file(Path(file_path))

    def analyze_directory(self, dir_path: str) -> Dict[str, Any]:
        """Analyze a directory - backwards compatibility."""
        return self._analyze_directory(Path(dir_path))

    def _analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Internal file analysis."""
        # Check cache
        if self._cache is not None:
            cache_key = str(file_path)
            if cache_key in self._cache:
                return self._cache[cache_key]

        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
                source_lines = source.splitlines()

            tree = ast.parse(source, filename=str(file_path))

            # Use specialized detectors if available
            if self._detectors:
                for name, detector_class in self._detectors:
                    try:
                        detector = detector_class(str(file_path), source_lines)
                        detector_violations = detector.detect_violations(tree)
                        violations.extend(detector_violations)
                    except:
                        pass

            # Always run basic detection as fallback
            basic_violations = self._detect_basic_violations(tree, str(file_path), source_lines)
            violations.extend(basic_violations)

            # Convert violations to dicts
            violation_dicts = []
            for v in violations:
                if isinstance(v, dict):
                    violation_dicts.append(v)
                elif hasattr(v, 'to_dict'):
                    violation_dicts.append(v.to_dict())
                else:
                    # Convert object to dict
                    violation_dicts.append({
                        'type': getattr(v, 'type', 'Unknown'),
                        'severity': getattr(v, 'severity', 'medium'),
                        'file_path': str(file_path),
                        'line_number': getattr(v, 'line_number', 0),
                        'description': getattr(v, 'description', str(v))
                    })

            result = {
                'file_path': str(file_path),
                'violations': violation_dicts,
                'total_violations': len(violation_dicts),
                'violations_by_type': self._count_by_type(violation_dicts),
                'files_analyzed': 1
            }

            # Cache result
            if self._cache is not None:
                self._cache[cache_key] = result

            return result

        except Exception as e:
            return {
                'file_path': str(file_path),
                'error': str(e),
                'violations': [],
                'total_violations': 0,
                'files_analyzed': 0
            }

    def _analyze_directory(self, dir_path: Path) -> Dict[str, Any]:
        """Internal directory analysis."""
        all_violations = []
        files_analyzed = 0
        errors = []

        # Find Python files
        py_files = list(dir_path.rglob("*.py"))

        for py_file in py_files:
            # Skip unwanted directories
            if any(skip in str(py_file) for skip in ['__pycache__', 'node_modules', '.git', '.sandboxes']):
                continue

            result = self._analyze_file(py_file)

            if 'error' in result:
                errors.append(result)
            else:
                all_violations.extend(result['violations'])
                files_analyzed += 1

        return {
            'project_path': str(dir_path),
            'files_analyzed': files_analyzed,
            'total_violations': len(all_violations),
            'violations': all_violations,
            'violations_by_type': self._count_by_type(all_violations),
            'errors': errors
        }

    def _detect_basic_violations(self, tree: ast.AST, file_path: str, source_lines: List[str]) -> List[Dict[str, Any]]:
        """Basic violation detection as fallback."""
        violations = []

        for node in ast.walk(tree):
            # Magic literals
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    if node.value not in (0, 1, -1, 2, 10, 100, 1000):
                        violations.append({
                            'type': 'Connascence of Meaning',
                            'severity': 'medium',
                            'file_path': file_path,
                            'line_number': getattr(node, 'lineno', 0),
                            'column': getattr(node, 'col_offset', 0),
                            'description': f'Magic literal {node.value} should be a named constant',
                            'nasa_rule': 'Rule 8',
                            'connascence_type': 'CoM',
                            'weight': 5.0
                        })

                elif isinstance(node.value, str) and len(node.value) > 1:
                    if any(char in node.value for char in ['/', '\\', ':', '.com', 'http']):
                        violations.append({
                            'type': 'Connascence of Value',
                            'severity': 'high',
                            'file_path': file_path,
                            'line_number': getattr(node, 'lineno', 0),
                            'column': getattr(node, 'col_offset', 0),
                            'description': f'Hardcoded path/URL should be configuration',
                            'nasa_rule': 'Rule 5',
                            'connascence_type': 'CoV',
                            'weight': 7.0
                        })

            # Long parameter lists
            elif isinstance(node, ast.FunctionDef):
                param_count = len(node.args.args)
                if param_count > 3:
                    violations.append({
                        'type': 'Connascence of Position',
                        'severity': 'high' if param_count > 5 else 'medium',
                        'file_path': file_path,
                        'line_number': getattr(node, 'lineno', 0),
                        'column': getattr(node, 'col_offset', 0),
                        'description': f"Function '{node.name}' has {param_count} parameters (max: 3)",
                        'nasa_rule': 'Rule 6',
                        'connascence_type': 'CoP',
                        'weight': 6.0 if param_count > 5 else 4.0
                    })

                # Check function length
                if hasattr(node, 'body') and len(node.body) > 60:
                    violations.append({
                        'type': 'God Object',
                        'severity': 'high',
                        'file_path': file_path,
                        'line_number': getattr(node, 'lineno', 0),
                        'column': getattr(node, 'col_offset', 0),
                        'description': f"Function '{node.name}' exceeds 60 lines",
                        'nasa_rule': 'Rule 4',
                        'weight': 8.0
                    })

            # Check class complexity
            elif isinstance(node, ast.ClassDef):
                methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]
                if len(methods) > 15:
                    violations.append({
                        'type': 'God Object',
                        'severity': 'critical',
                        'file_path': file_path,
                        'line_number': getattr(node, 'lineno', 0),
                        'column': getattr(node, 'col_offset', 0),
                        'description': f"Class '{node.name}' has {len(methods)} methods (max: 15)",
                        'nasa_rule': 'Rule 4',
                        'weight': 9.0
                    })

        return violations

    def _count_by_type(self, violations: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count violations by type."""
        counts = {}
        for v in violations:
            vtype = v.get('type', 'Unknown')
            counts[vtype] = counts.get(vtype, 0) + 1
        return counts

    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """
        Compatibility method for detector interface.
        Used when this analyzer is used as a detector.
        """
        violations = self._detect_basic_violations(tree, self.project_path.name, [])

        # Convert dicts to ConnascenceViolation objects
        violation_objects = []
        for v in violations:
            violation_objects.append(ConnascenceViolation(
                type=v['type'],
                severity=v['severity'],
                file_path=v['file_path'],
                line_number=v['line_number'],
                description=v['description'],
                column=v.get('column', 0),
                nasa_rule=v.get('nasa_rule'),
                connascence_type=v.get('connascence_type'),
                weight=v.get('weight', 1.0)
            ))

        return violation_objects

# Alias for backwards compatibility
UnifiedConnascenceAnalyzer = ConsolidatedConnascenceAnalyzer
ConnascenceAnalyzer = ConsolidatedConnascenceAnalyzer
ConnascenceASTAnalyzer = ConsolidatedConnascenceAnalyzer

def analyze_project(path: str = ".", **kwargs) -> Dict[str, Any]:
    """Convenience function for quick analysis."""
    analyzer = ConsolidatedConnascenceAnalyzer(path, **kwargs)
    return analyzer.analyze()
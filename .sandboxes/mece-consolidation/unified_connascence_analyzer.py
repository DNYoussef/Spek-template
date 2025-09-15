"""
Unified Connascence Analyzer - MECE Consolidation
Combines the best parts of all analyzer duplications into a single, clear implementation.
"""

import ast
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
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
    weight: float = 1.0


class UnifiedConnascenceAnalyzer:
    """
    Single source of truth for connascence analysis.
    Consolidates functionality from:
    - analyzer/unified_analyzer.py
    - analyzer/ast_engine/core_analyzer.py
    - analyzer/detectors/connascence_ast_analyzer.py
    """

    def __init__(self, project_path: str = ".", enable_caching: bool = False):
        """Initialize with minimal, clear parameters."""
        self.project_path = Path(project_path)
        self.enable_caching = enable_caching
        self._cache = {} if enable_caching else None

    def analyze(self) -> Dict[str, Any]:
        """
        Main entry point for analysis.
        Returns comprehensive results with violations and metrics.
        """
        if self.project_path.is_file():
            return self._analyze_file(self.project_path)
        else:
            return self._analyze_directory(self.project_path)

    def _analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a single Python file."""
        violations = []

        try:
            # Check cache first
            if self._cache is not None and str(file_path) in self._cache:
                return self._cache[str(file_path)]

            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
                tree = ast.parse(source, filename=str(file_path))

            # Detect violations
            violations = self._detect_violations(tree, str(file_path), source.splitlines())

            result = {
                'file_path': str(file_path),
                'violations': violations,
                'total_violations': len(violations),
                'violations_by_type': self._count_by_type(violations)
            }

            # Cache result
            if self._cache is not None:
                self._cache[str(file_path)] = result

            return result

        except Exception as e:
            return {
                'file_path': str(file_path),
                'error': str(e),
                'violations': [],
                'total_violations': 0
            }

    def _analyze_directory(self, dir_path: Path) -> Dict[str, Any]:
        """Analyze all Python files in a directory."""
        all_violations = []
        files_analyzed = 0
        errors = []

        # Find all Python files
        py_files = list(dir_path.rglob("*.py"))

        for py_file in py_files:
            # Skip test files and cache directories
            if any(skip in str(py_file) for skip in ['__pycache__', 'node_modules', '.git']):
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

    def _detect_violations(self, tree: ast.AST, file_path: str, source_lines: List[str]) -> List[Dict[str, Any]]:
        """
        Core violation detection logic.
        Consolidates detection from all analyzer versions.
        """
        violations = []

        for node in ast.walk(tree):
            # Magic literals (Connascence of Meaning)
            if isinstance(node, ast.Constant):
                violation = self._check_magic_literal(node, file_path)
                if violation:
                    violations.append(violation)

            # Long parameter lists (Connascence of Position)
            elif isinstance(node, ast.FunctionDef):
                violation = self._check_parameter_list(node, file_path)
                if violation:
                    violations.append(violation)

                # Also check for god objects
                violation = self._check_god_object(node, file_path)
                if violation:
                    violations.append(violation)

            # Type inconsistencies (Connascence of Type)
            elif isinstance(node, ast.Name):
                violation = self._check_type_consistency(node, file_path, tree)
                if violation:
                    violations.append(violation)

        return violations

    def _check_magic_literal(self, node: ast.Constant, file_path: str) -> Optional[Dict[str, Any]]:
        """Check for magic literals that should be constants."""
        if isinstance(node.value, (int, float)):
            # Allow common values
            if node.value in (0, 1, -1, 2, 10, 100, 1000, True, False, None):
                return None

            return {
                'type': 'Connascence of Meaning',
                'severity': 'medium',
                'file_path': file_path,
                'line_number': getattr(node, 'lineno', 0),
                'column': getattr(node, 'col_offset', 0),
                'description': f'Magic literal {node.value} should be a named constant',
                'nasa_rule': 'Rule 8',
                'weight': 5.0
            }

        elif isinstance(node.value, str) and len(node.value) > 1:
            # Check for hardcoded paths/URLs
            if any(char in node.value for char in ['/', '\\', ':', '.com', 'http']):
                return {
                    'type': 'Connascence of Value',
                    'severity': 'high',
                    'file_path': file_path,
                    'line_number': getattr(node, 'lineno', 0),
                    'column': getattr(node, 'col_offset', 0),
                    'description': f'Hardcoded string should be configuration',
                    'nasa_rule': 'Rule 5',
                    'weight': 7.0
                }

        return None

    def _check_parameter_list(self, node: ast.FunctionDef, file_path: str) -> Optional[Dict[str, Any]]:
        """Check for functions with too many parameters."""
        param_count = len(node.args.args)

        if param_count > 3:
            severity = 'high' if param_count > 5 else 'medium'
            return {
                'type': 'Connascence of Position',
                'severity': severity,
                'file_path': file_path,
                'line_number': getattr(node, 'lineno', 0),
                'column': getattr(node, 'col_offset', 0),
                'description': f"Function '{node.name}' has {param_count} parameters (max: 3)",
                'nasa_rule': 'Rule 6',
                'weight': 6.0 if param_count > 5 else 4.0
            }

        return None

    def _check_god_object(self, node: ast.FunctionDef, file_path: str) -> Optional[Dict[str, Any]]:
        """Check for god object anti-pattern in classes."""
        # This is simplified - in real implementation would check class methods
        if hasattr(node, 'body') and len(node.body) > 60:
            return {
                'type': 'God Object',
                'severity': 'high',
                'file_path': file_path,
                'line_number': getattr(node, 'lineno', 0),
                'column': getattr(node, 'col_offset', 0),
                'description': f"Function '{node.name}' is too long ({len(node.body)} lines)",
                'nasa_rule': 'Rule 4',
                'weight': 8.0
            }

        return None

    def _check_type_consistency(self, node: ast.Name, file_path: str, tree: ast.AST) -> Optional[Dict[str, Any]]:
        """Check for type inconsistencies (simplified)."""
        # This would need more complex analysis in production
        # For now, just a placeholder
        return None

    def _count_by_type(self, violations: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count violations by type."""
        counts = {}
        for v in violations:
            vtype = v.get('type', 'Unknown')
            counts[vtype] = counts.get(vtype, 0) + 1
        return counts


# Convenience function for backwards compatibility
def analyze_project(path: str = ".", enable_caching: bool = False) -> Dict[str, Any]:
    """Analyze a project and return results."""
    analyzer = UnifiedConnascenceAnalyzer(path, enable_caching)
    return analyzer.analyze()
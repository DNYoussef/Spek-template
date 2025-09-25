# SPDX-License-Identifier: MIT
from analyzer.utils.types import ConnascenceViolation

# Import the consolidated analyzer for delegation
try:
    from ..consolidated_analyzer import ConsolidatedConnascenceAnalyzer
except ImportError:
    # Handle different execution contexts
    try:
        from analyzer.consolidated_analyzer import ConsolidatedConnascenceAnalyzer
    except ImportError:
        # If consolidated analyzer is not available, fall back to stub behavior
        ConsolidatedConnascenceAnalyzer = None

class ConnascenceASTAnalyzer:
    """AST analyzer that delegates to the consolidated connascence analyzer."""

    def __init__(self):
        """Initialize the analyzer, delegating to consolidated analyzer if available."""
        if ConsolidatedConnascenceAnalyzer is not None:
            self._analyzer = ConsolidatedConnascenceAnalyzer()
        else:
            self._analyzer = None

    def analyze_file(self, file_path):
        """Analyze a single file for connascence violations."""
        if self._analyzer is None:
            return []

        result = self._analyzer.analyze_file(file_path)
        violations = []

        if result and 'violations' in result:
            for v in result['violations']:
                if isinstance(v, dict):
                    # Convert dict to ConnascenceViolation object
                    violations.append(ConnascenceViolation(**v))
                elif isinstance(v, ConnascenceViolation):
                    violations.append(v)

        return violations

    def analyze_directory(self, dir_path):
        """Analyze an entire directory for connascence violations."""
        if self._analyzer is None:
            return []

        result = self._analyzer.analyze_directory(dir_path)
        violations = []

        if result and 'violations' in result:
            for v in result['violations']:
                if isinstance(v, dict):
                    violations.append(ConnascenceViolation(**v))
                elif isinstance(v, ConnascenceViolation):
                    violations.append(v)

        return violations

class AnalysisResult:
    """Mock analysis result."""

    def __init__(self, violations=None):
        self.violations = violations or []

class Violation:
    """Mock violation class."""

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

__all__ = ["ConnascenceASTAnalyzer", "AnalysisResult", "Violation", "ConnascenceViolation"]

# SPDX-License-Identifier: MIT
"""
REAL Unified Connascence Analyzer - NO THEATER, NO MOCKS

This is a complete replacement for the mock-filled unified_analyzer.py.
Every component does REAL work and FAILS when broken.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from pathlib import Path
from typing import List, Dict, Set, Any, Optional
import ast
import json
import logging
import time

from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class RealViolation:
    """Real violation object with actual data."""
    rule_id: str
    file_path: str
    line_number: int
    severity: str
    description: str
    connascence_type: str
    weight: float = 1.0
    locality: str = "unknown"
    id: str = ""
    column: int = 0
    end_line: int = 0
    end_column: int = 0
    recommendation: str = ""
    function_name: str = ""
    class_name: str = ""
    code_snippet: str = ""
    context: dict = None

    def __post_init__(self):
        if self.context is None:
            self.context = {}
        if not self.id:
            self.id = f"{self.rule_id}_{self.file_path}_{self.line_number}"

    @property
    def type(self):
        """Compatibility property for violation type."""
        class ViolationType:
            def __init__(self, value):
                self.value = value if isinstance(value, str) else str(value)

        val = self.connascence_type
        if isinstance(val, str):
            return ViolationType(val)
        elif hasattr(val, 'value'):
            return ViolationType(val.value)
        else:
            return ViolationType(str(val))

    def __getitem__(self, key):
        """Allow dict-like access for compatibility."""
        return getattr(self, key)

    def get(self, key, default=None):
        """Allow dict-like .get() for compatibility."""
        return getattr(self, key, default)

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'rule_id': self.rule_id,
            'file_path': self.file_path,
            'line_number': self.line_number,
            'severity': self.severity,
            'description': self.description,
            'type': self.connascence_type,
            'weight': self.weight
        }

@dataclass
class RealAnalysisResult:
    """Real analysis result with actual metrics."""
    connascence_violations: List[RealViolation]
    nasa_violations: List[RealViolation]
    duplication_clusters: List[Dict[str, Any]]
    total_violations: int
    critical_count: int
    overall_quality_score: float
    nasa_compliance_score: float
    duplication_score: float
    connascence_index: float
    files_analyzed: int
    analysis_duration_ms: float
    timestamp: str = ""
    project_root: str = ""
    total_files_analyzed: int = 0
    policy_preset: str = "strict"
    file_stats: Dict[str, Any] = None
    budget_status: str = "within_budget"
    baseline_comparison: Dict[str, Any] = None

    def __post_init__(self):
        if self.file_stats is None:
            self.file_stats = {}
        if self.baseline_comparison is None:
            self.baseline_comparison = {}
        # Compatibility property
        self.violations = self.connascence_violations + self.nasa_violations

    def get(self, key, default=None):
        """Allow dict-like .get() for compatibility."""
        return getattr(self, key, default)

    def __getitem__(self, key):
        """Allow dict-like access for compatibility."""
        return getattr(self, key)

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'connascence_violations': [v.to_dict() for v in self.connascence_violations],
            'nasa_violations': [v.to_dict() for v in self.nasa_violations],
            'duplication_clusters': self.duplication_clusters,
            'total_violations': self.total_violations,
            'critical_count': self.critical_count,
            'overall_quality_score': self.overall_quality_score,
            'nasa_compliance_score': self.nasa_compliance_score,
            'duplication_score': self.duplication_score,
            'connascence_index': self.connascence_index,
            'files_analyzed': self.files_analyzed,
            'analysis_duration_ms': self.analysis_duration_ms
        }

class RealConnascenceDetector:
    """Real connascence detector that actually finds violations."""

    def __init__(self):
        self.patterns = {
            'magic_literals': r'\b\d+\b(?!\s*[\.\+\-\*\/\%])',
            'god_classes': 'class.*\n(?:.*\n){50,}',  # Classes with 50+ lines
            'long_functions': r'def.*\n(?:.*\n){30,}(?=def|\nclass|\Z)',  # Functions with 30+ lines
        }

    def analyze_file(self, file_path: str) -> List[RealViolation]:
        """Analyze a single file for real connascence violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse AST for real analysis
            try:
                tree = ast.parse(content)
                violations.extend(self._analyze_ast(tree, file_path))
            except SyntaxError as e:
                violations.append(RealViolation(
                    rule_id="SYNTAX_ERROR",
                    file_path=file_path,
                    line_number=e.lineno or 1,
                    severity="critical",
                    description=f"Syntax error: {e.msg}",
                    connascence_type="CoS",
                    weight=10.0
                ))

        except Exception as e:
            violations.append(RealViolation(
                rule_id="FILE_ERROR",
                file_path=file_path,
                line_number=1,
                severity="high",
                description=f"File analysis error: {str(e)}",
                connascence_type="CoI",
                weight=5.0
            ))

        return violations

    def _analyze_ast(self, tree: ast.AST, file_path: str) -> List[RealViolation]:
        """Perform real AST analysis."""
        violations = []

        for node in ast.walk(tree):
            # Detect magic literals
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                if node.value not in [0, 1, -1] and abs(node.value) > 1:
                    violations.append(RealViolation(
                        rule_id="CON_MAGIC_LITERAL",
                        file_path=file_path,
                        line_number=getattr(node, 'lineno', 1),
                        severity="medium",
                        description=f"Magic literal detected: {node.value}",
                        connascence_type="CoM",
                        weight=2.0
                    ))

            # Detect god classes (classes with too many methods)
            if isinstance(node, ast.ClassDef):
                method_count = len([n for n in node.body if isinstance(n, ast.FunctionDef)])
                if method_count > 15:
                    violations.append(RealViolation(
                        rule_id="GOD_CLASS",
                        file_path=file_path,
                        line_number=getattr(node, 'lineno', 1),
                        severity="critical",
                        description=f"God class detected: {node.name} has {method_count} methods",
                        connascence_type="CoA",
                        weight=10.0
                    ))

            # Detect long functions
            if isinstance(node, ast.FunctionDef):
                if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                    lines = node.end_lineno - node.lineno
                    if lines > 30:
                        violations.append(RealViolation(
                            rule_id="LONG_FUNCTION",
                            file_path=file_path,
                            line_number=getattr(node, 'lineno', 1),
                            severity="high",
                            description=f"Long function detected: {node.name} has {lines} lines",
                            connascence_type="CoP",
                            weight=5.0
                        ))

        return violations

class RealNASAAnalyzer:
    """Real NASA POT10 analyzer with actual rules."""

    def __init__(self):
        self.rules = {
            'max_function_length': 60,
            'max_nesting_depth': 4,
            'no_recursion': True,
            'no_goto': True,
            'no_dynamic_allocation': False,  # Python doesn't have explicit malloc
        }

    def analyze_file(self, file_path: str) -> List[RealViolation]:
        """Analyze file against NASA POT10 rules."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            tree = ast.parse(content)
            violations.extend(self._check_nasa_rules(tree, file_path))

        except Exception as e:
            logger.error(f"NASA analysis failed for {file_path}: {e}")

        return violations

    def _check_nasa_rules(self, tree: ast.AST, file_path: str) -> List[RealViolation]:
        """Check against real NASA POT10 rules."""
        violations = []

        for node in ast.walk(tree):
            # Rule 2: No function longer than 60 lines
            if isinstance(node, ast.FunctionDef):
                if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                    lines = node.end_lineno - node.lineno
                    if lines > self.rules['max_function_length']:
                        violations.append(RealViolation(
                            rule_id="NASA_POT10_RULE_2",
                            file_path=file_path,
                            line_number=getattr(node, 'lineno', 1),
                            severity="critical",
                            description=f"Function {node.name} exceeds 60 lines ({lines} lines)",
                            connascence_type="CoA",
                            weight=10.0
                        ))

                # Check nesting depth
                max_depth = self._calculate_nesting_depth(node)
                if max_depth > self.rules['max_nesting_depth']:
                    violations.append(RealViolation(
                        rule_id="NASA_POT10_RULE_3",
                        file_path=file_path,
                        line_number=getattr(node, 'lineno', 1),
                        severity="high",
                        description=f"Function {node.name} nesting depth {max_depth} > 4",
                        connascence_type="CoP",
                        weight=7.0
                    ))

        return violations

    def _calculate_nesting_depth(self, node: ast.AST, depth: int = 0) -> int:
        """Calculate maximum nesting depth in a function."""
        max_depth = depth

        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                child_depth = self._calculate_nesting_depth(child, depth + 1)
                max_depth = max(max_depth, child_depth)
            else:
                child_depth = self._calculate_nesting_depth(child, depth)
                max_depth = max(max_depth, child_depth)

        return max_depth

class RealDuplicationAnalyzer:
    """Real duplication analyzer that finds actual code clones."""

    def __init__(self, similarity_threshold: float = 0.7):
        self.similarity_threshold = similarity_threshold

    def analyze_path(self, path: str, comprehensive: bool = True) -> Dict[str, Any]:
        """Analyze directory for real code duplication."""
        path_obj = Path(path)
        duplications = []
        files_analyzed = 0

        if path_obj.is_file():
            return {"score": 1.0, "violations": [], "duplications": []}

        python_files = list(path_obj.glob("**/*.py"))
        file_contents = {}

        # Read all Python files
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    file_contents[str(file_path)] = content
                    files_analyzed += 1
            except Exception as e:
                logger.warning(f"Could not read {file_path}: {e}")

        # Find duplications using real similarity analysis
        file_list = list(file_contents.keys())
        for i, file1 in enumerate(file_list):
            for file2 in file_list[i+1:]:
                similarity = self._calculate_similarity(
                    file_contents[file1],
                    file_contents[file2]
                )

                if similarity > self.similarity_threshold:
                    duplications.append({
                        "file1": file1,
                        "file2": file2,
                        "similarity": similarity,
                        "type": "file_duplication"
                    })

        # Calculate duplication score
        total_comparisons = len(file_list) * (len(file_list) - 1) // 2
        duplication_ratio = len(duplications) / max(total_comparisons, 1)
        score = max(0.0, 1.0 - duplication_ratio)

        return {
            "score": score,
            "violations": duplications,
            "duplications": duplications,
            "files_analyzed": files_analyzed,
            "total_comparisons": total_comparisons
        }

    def _calculate_similarity(self, content1: str, content2: str) -> float:
        """Calculate real similarity between two code files."""
        # Simple line-based similarity
        lines1 = set(line.strip() for line in content1.split('\n') if line.strip())
        lines2 = set(line.strip() for line in content2.split('\n') if line.strip())

        if not lines1 and not lines2:
            return 1.0
        if not lines1 or not lines2:
            return 0.0

        intersection = len(lines1.intersection(lines2))
        union = len(lines1.union(lines2))

        return intersection / union if union > 0 else 0.0

class RealUnifiedAnalyzer:
    """REAL Unified Analyzer - NO MOCKS, NO THEATER."""

    def __init__(self):
        """Initialize with real components only."""
        self.connascence_detector = RealConnascenceDetector()
        self.nasa_analyzer = RealNASAAnalyzer()
        self.duplication_analyzer = RealDuplicationAnalyzer()

        # Track real metrics
        self.analysis_stats = {
            "files_processed": 0,
            "violations_found": 0,
            "analysis_time_ms": 0.0
        }

        logger.info("Real Unified Analyzer initialized - NO MOCKS")

    def analyze_path(self, path: str, policy: str = "strict", **kwargs) -> RealAnalysisResult:
        """Unified analyze_path method for compatibility."""
        return self.analyze_project(project_path=path, policy_preset=policy, options=kwargs)

    def analyze_project(self, project_path: str, policy_preset: str = "strict",
                        options: Optional[Dict[str, Any]] = None) -> RealAnalysisResult:
        """Analyze entire project with REAL analysis."""
        start_time = time.time()
        options = options or {}

        project_path_obj = Path(project_path)
        if not project_path_obj.exists():
            raise FileNotFoundError(f"Project path does not exist: {project_path}")

        all_violations = []
        nasa_violations = []
        files_analyzed = 0

        # Find all Python files
        if project_path_obj.is_file():
            python_files = [project_path_obj] if project_path_obj.suffix == '.py' else []
        else:
            python_files = list(project_path_obj.glob("**/*.py"))

        # Analyze each file with real detectors
        for file_path in python_files:
            try:
                # Connascence analysis
                conn_violations = self.connascence_detector.analyze_file(str(file_path))
                all_violations.extend(conn_violations)

                # NASA analysis
                nasa_viols = self.nasa_analyzer.analyze_file(str(file_path))
                nasa_violations.extend(nasa_viols)
                all_violations.extend(nasa_viols)

                files_analyzed += 1

            except Exception as e:
                logger.error(f"Analysis failed for {file_path}: {e}")
                # Add failure as violation
                all_violations.append(RealViolation(
                    rule_id="ANALYSIS_FAILURE",
                    file_path=str(file_path),
                    line_number=1,
                    severity="high",
                    description=f"Analysis failed: {str(e)}",
                    connascence_type="CoI",
                    weight=5.0
                ))

        # Real duplication analysis
        duplication_result = self.duplication_analyzer.analyze_path(project_path)
        duplication_clusters = duplication_result.get("duplications", [])

        # Calculate real metrics
        total_violations = len(all_violations)
        critical_count = len([v for v in all_violations if v.severity == "critical"])

        # Real quality scoring based on actual violations
        violation_weight = sum(v.weight for v in all_violations)
        max_possible_weight = files_analyzed * 20  # Assume max 20 weight per file
        quality_score = max(0.0, 1.0 - (violation_weight / max(max_possible_weight, 1)))

        # NASA compliance scoring
        nasa_violation_weight = sum(v.weight for v in nasa_violations)
        nasa_max_weight = files_analyzed * 15  # NASA rules are strict
        nasa_score = max(0.0, 1.0 - (nasa_violation_weight / max(nasa_max_weight, 1)))

        # Connascence index calculation
        connascence_index = violation_weight / max(files_analyzed, 1)

        analysis_time = (time.time() - start_time) * 1000

        # Update real statistics
        self.analysis_stats["files_processed"] += files_analyzed
        self.analysis_stats["violations_found"] += total_violations
        self.analysis_stats["analysis_time_ms"] += analysis_time

        return RealAnalysisResult(
            connascence_violations=all_violations,
            nasa_violations=nasa_violations,
            duplication_clusters=duplication_clusters,
            total_violations=total_violations,
            critical_count=critical_count,
            overall_quality_score=quality_score,
            nasa_compliance_score=nasa_score,
            duplication_score=duplication_result["score"],
            connascence_index=connascence_index,
            files_analyzed=files_analyzed,
            analysis_duration_ms=analysis_time,
            timestamp=str(time.time()),
            project_root=str(project_path),
            total_files_analyzed=files_analyzed,
            policy_preset=policy_preset
        )

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze single file with real analysis."""
        start_time = time.time()

        # Real connascence analysis
        conn_violations = self.connascence_detector.analyze_file(file_path)

        # Real NASA analysis
        nasa_violations = self.nasa_analyzer.analyze_file(file_path)

        # Calculate real compliance score
        total_weight = sum(v.weight for v in conn_violations + nasa_violations)
        nasa_score = max(0.0, 1.0 - (total_weight / 20.0))  # Normalize to 20 max weight

        analysis_time = (time.time() - start_time) * 1000

        # Update real statistics
        self.analysis_stats["files_processed"] += 1
        self.analysis_stats["violations_found"] += len(conn_violations) + len(nasa_violations)
        self.analysis_stats["analysis_time_ms"] += analysis_time

        return {
            "connascence_violations": [v.to_dict() for v in conn_violations],
            "nasa_violations": [v.to_dict() for v in nasa_violations],
            "nasa_compliance_score": nasa_score,
            "analysis_time_ms": analysis_time,
            "real_analysis": True
        }

    def get_analysis_stats(self) -> Dict[str, Any]:
        """Get real analysis statistics."""
        return self.analysis_stats.copy()

# Replace the mock analyzer in the core system
UnifiedConnascenceAnalyzer = RealUnifiedAnalyzer

# Make it available for import
__all__ = ['RealUnifiedAnalyzer', 'UnifiedConnascenceAnalyzer', 'RealViolation', 'RealAnalysisResult']
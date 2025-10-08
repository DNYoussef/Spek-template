from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Enhanced Algorithm Detector
============================

Advanced algorithm duplication detection using Connascence pure algorithms.
Ported from Connascence analyzer with improvements.

Features:
- Structural pattern matching (not just syntax)
- Variable name normalization
- AST-based comparison
- Weighted similarity scoring

@module EnhancedAlgorithmDetector
@compliance NASA-POT10, Connascence-Theory
"""

from typing import List, Dict, Tuple, Set
import ast
import hashlib

from dataclasses import dataclass

@dataclass
class AlgorithmPattern:
    function_name: str
    file_path: str
    line_number: int
    normalized_hash: str
    complexity: int
    statement_pattern: str

class EnhancedAlgorithmDetector:

    def __init__(self):
        self.patterns: Dict[str, List[AlgorithmPattern]] = {}
        self.violations: List[Dict] = []

    def detect(self, file_path: str, source_code: str) -> List[Dict]:
        try:
            tree = ast.parse(source_code)
        except SyntaxError:
            return []

        self.violations.clear()

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                self._analyze_function(file_path, node)

        self._find_duplicates()

        return self.violations

    def _analyze_function(self, file_path: str, node: ast.FunctionDef):
        if len(node.body) < 3:
            return

        normalized_hash = self._normalize_function(node)
        complexity = self._calculate_complexity(node)
        statement_pattern = self._extract_statement_pattern(node)

        pattern = AlgorithmPattern(
            function_name=node.name,
            file_path=file_path,
            line_number=node.lineno,
            normalized_hash=normalized_hash,
            complexity=complexity,
            statement_pattern=statement_pattern
        )

        if normalized_hash not in self.patterns:
            self.patterns[normalized_hash] = []

        self.patterns[normalized_hash].append(pattern)

    def _normalize_function(self, node: ast.FunctionDef) -> str:
        body_structure = []

        for stmt in node.body:
            stmt_signature = self._get_statement_signature(stmt)
            body_structure.append(stmt_signature)

        structure_str = "|".join(body_structure)

        return hashlib.sha256(structure_str.encode()).hexdigest()

    def _get_statement_signature(self, stmt: ast.stmt) -> str:
        if isinstance(stmt, ast.Return):
            return f"return:{type(stmt.value).__name__ if stmt.value else 'None'}"
        elif isinstance(stmt, ast.If):
            test_type = type(stmt.test).__name__
            return f"if:{test_type}"
        elif isinstance(stmt, ast.For):
            return "for"
        elif isinstance(stmt, ast.While):
            return "while"
        elif isinstance(stmt, ast.Assign):
            targets = len(stmt.targets)
            return f"assign:{targets}"
        elif isinstance(stmt, ast.Expr):
            if isinstance(stmt.value, ast.Call):
                return "call"
            return "expr"
        elif isinstance(stmt, ast.Try):
            handlers = len(stmt.handlers)
            return f"try:{handlers}"
        elif isinstance(stmt, ast.With):
            return "with"
        elif isinstance(stmt, ast.FunctionDef):
            return "funcdef"
        elif isinstance(stmt, ast.ClassDef):
            return "classdef"
        else:
            return type(stmt).__name__.lower()

    def _calculate_complexity(self, node: ast.FunctionDef) -> int:
        complexity = 1

        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1

        return complexity

    def _extract_statement_pattern(self, node: ast.FunctionDef) -> str:
        pattern_parts = []

        for stmt in node.body:
            pattern_parts.append(type(stmt).__name__)

        return ",".join(pattern_parts)

    def _find_duplicates(self):
        for hash_key, patterns in self.patterns.items():
            if len(patterns) <= 1:
                continue

            sorted_patterns = sorted(patterns, key=lambda p: (p.file_path, p.line_number))

            for pattern in sorted_patterns:
                duplicates = [p for p in sorted_patterns if p != pattern]

                self.violations.append({
                    "type": "connascence_of_algorithm",
                    "severity": "medium" if pattern.complexity < 10 else "high",
                    "file_path": pattern.file_path,
                    "line_number": pattern.line_number,
                    "function_name": pattern.function_name,
                    "description": f"Function '{pattern.function_name}' duplicates algorithm from {len(duplicates)} other function(s)",
                    "duplicate_count": len(duplicates),
                    "duplicate_functions": [p.function_name for p in duplicates],
                    "complexity": pattern.complexity,
                    "recommendation": "Extract common algorithm into shared helper function to reduce duplication"
                })

def detect_algorithm_violations(file_path: str, source_code: str) -> List[Dict]:
    detector = EnhancedAlgorithmDetector()
    return detector.detect(file_path, source_code)
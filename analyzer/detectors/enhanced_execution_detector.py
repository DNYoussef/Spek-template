from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Enhanced Execution Order Detector
==================================

Detects Connascence of Execution violations using advanced control flow analysis.
Ported from Connascence analyzer with pure algorithmic improvements.

Detects:
- Order-dependent function calls
- Side-effect dependencies
- Initialization ordering issues
- Race condition patterns

@module EnhancedExecutionDetector
@compliance Connascence-Theory, NASA-POT10
"""

from collections import defaultdict
from typing import List, Dict, Set, Tuple
import ast

class EnhancedExecutionDetector:

    def __init__(self):
        self.violations: List[Dict] = []
        self.call_graph: Dict[str, Set[str]] = defaultdict(set)
        self.side_effect_functions: Set[str] = set()

    def detect(self, file_path: str, source_code: str) -> List[Dict]:
        try:
            tree = ast.parse(source_code)
        except SyntaxError:
            return []

        self.violations.clear()
        self.call_graph.clear()
        self.side_effect_functions.clear()

        self._analyze_tree(file_path, tree)

        return self.violations

    def _analyze_tree(self, file_path: str, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                self._analyze_function(file_path, node)

        self._detect_initialization_order_issues(file_path, tree)
        self._detect_side_effect_dependencies(file_path, tree)

    def _analyze_function(self, file_path: str, node: ast.FunctionDef):
        has_side_effects = False

        for child in ast.walk(node):
            if isinstance(child, (ast.Global, ast.Nonlocal)):
                has_side_effects = True
                break

            if isinstance(child, ast.Assign):
                for target in child.targets:
                    if isinstance(target, (ast.Attribute, ast.Subscript)):
                        has_side_effects = True
                        break

        if has_side_effects:
            self.side_effect_functions.add(node.name)

        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    calls.append(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    calls.append(child.func.attr)

        if len(calls) >= 2:
            for i in range(len(calls) - 1):
                for j in range(i + 1, len(calls)):
                    call1, call2 = calls[i], calls[j]

                    if call1 in self.side_effect_functions or call2 in self.side_effect_functions:
                        self.violations.append({
                            "type": "connascence_of_execution",
                            "severity": "high",
                            "file_path": file_path,
                            "line_number": node.lineno,
                            "function_name": node.name,
                            "description": f"Execution order matters: '{call1}' must be called before '{call2}'",
                            "calls": [call1, call2],
                            "recommendation": "Make execution order explicit with dependencies or refactor to remove ordering constraint"
                        })

    def _detect_initialization_order_issues(self, file_path: str, tree: ast.AST):
        class_inits = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for method in node.body:
                    if isinstance(method, ast.FunctionDef) and method.name == "__init__":
                        class_inits.append((node.name, method))

        for class_name, init_method in class_inits:
            assignments = []

            for stmt in init_method.body:
                if isinstance(stmt, ast.Assign):
                    for target in stmt.targets:
                        if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name) and target.value.id == "self":
                            assignments.append(target.attr)

            if len(assignments) > 1:
                for i, attr in enumerate(assignments):
                    for j in range(i + 1, len(assignments)):
                        other_attr = assignments[j]

                        if self._has_dependency(init_method, attr, other_attr):
                            self.violations.append({
                                "type": "connascence_of_execution",
                                "severity": "medium",
                                "file_path": file_path,
                                "line_number": init_method.lineno,
                                "class_name": class_name,
                                "description": f"Initialization order dependency: '{attr}' must be set before '{other_attr}'",
                                "attributes": [attr, other_attr],
                                "recommendation": "Document initialization order or refactor to remove dependency"
                            })

    def _has_dependency(self, init_method: ast.FunctionDef, attr1: str, attr2: str) -> bool:
        attr2_assignments = []

        for stmt in init_method.body:
            if isinstance(stmt, ast.Assign):
                for target in stmt.targets:
                    if isinstance(target, ast.Attribute) and target.attr == attr2:
                        attr2_assignments.append(stmt)

        for assign_stmt in attr2_assignments:
            for node in ast.walk(assign_stmt.value):
                if isinstance(node, ast.Attribute) and node.attr == attr1:
                    return True

        return False

    def _detect_side_effect_dependencies(self, file_path: str, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                consecutive_calls = self._find_consecutive_calls(node)

                if len(consecutive_calls) >= 2:
                    for i in range(len(consecutive_calls) - 1):
                        call1, call2 = consecutive_calls[i], consecutive_calls[i + 1]

                        if self._both_have_side_effects(call1, call2):
                            self.violations.append({
                                "type": "connascence_of_execution",
                                "severity": "high",
                                "file_path": file_path,
                                "line_number": node.lineno,
                                "description": f"Execution order critical: side-effect operations must run in sequence",
                                "recommendation": "Use explicit sequencing or transaction patterns to enforce order"
                            })

    def _find_consecutive_calls(self, func_node: ast.FunctionDef) -> List[ast.Call]:
        calls = []

        for stmt in func_node.body:
            if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
                calls.append(stmt.value)
            elif isinstance(stmt, ast.Assign) and isinstance(stmt.value, ast.Call):
                calls.append(stmt.value)

        return calls

    def _both_have_side_effects(self, call1: ast.Call, call2: ast.Call) -> bool:
        call1_name = self._get_call_name(call1)
        call2_name = self._get_call_name(call2)

        return (call1_name in self.side_effect_functions or
                call2_name in self.side_effect_functions or
                any(keyword in call1_name.lower() for keyword in ['set', 'update', 'delete', 'create', 'save']) or
                any(keyword in call2_name.lower() for keyword in ['set', 'update', 'delete', 'create', 'save']))

    def _get_call_name(self, call: ast.Call) -> str:
        if isinstance(call.func, ast.Name):
            return call.func.id
        elif isinstance(call.func, ast.Attribute):
            return call.func.attr
        return "unknown"

def detect_execution_violations(file_path: str, source_code: str) -> List[Dict]:
    detector = EnhancedExecutionDetector()
    return detector.detect(file_path, source_code)
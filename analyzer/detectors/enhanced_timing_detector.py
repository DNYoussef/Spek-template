from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Enhanced Timing Detector
========================

Detects Connascence of Timing violations using advanced concurrency pattern analysis.
Ported from Connascence analyzer with race condition detection.

Detects:
- Race conditions in async code
- Shared state access without synchronization
- Thread-unsafe operations
- Timing-dependent code patterns

@module EnhancedTimingDetector
@compliance Connascence-Theory, Concurrency-Safety
"""

from typing import List, Dict, Set
import ast

class EnhancedTimingDetector:

    THREAD_UNSAFE_PATTERNS = {
        'dict', 'list', 'set', 'defaultdict', 'Counter'
    }

    SYNC_PRIMITIVES = {
        'Lock', 'RLock', 'Semaphore', 'Event', 'Condition', 'Barrier',
        'asyncio.Lock', 'threading.Lock', 'multiprocessing.Lock'
    }

    def __init__(self):
        self.violations: List[Dict] = []
        self.shared_state: Set[str] = set()
        self.async_functions: Set[str] = set()
        self.synchronized_sections: Set[int] = set()

    def detect(self, file_path: str, source_code: str) -> List[Dict]:
        try:
            tree = ast.parse(source_code)
        except SyntaxError:
            return []

        self.violations.clear()
        self.shared_state.clear()
        self.async_functions.clear()
        self.synchronized_sections.clear()

        self._identify_shared_state(tree)
        self._identify_async_functions(tree)
        self._identify_synchronized_sections(tree)

        self._detect_race_conditions(file_path, tree)
        self._detect_async_timing_issues(file_path, tree)

        return self.violations

    def _identify_shared_state(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for stmt in node.body:
                    if isinstance(stmt, ast.Assign):
                        for target in stmt.targets:
                            if isinstance(target, ast.Name):
                                self.shared_state.add(target.id)

            if isinstance(node, ast.Global):
                for name in node.names:
                    self.shared_state.add(name)

    def _identify_async_functions(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.AsyncFunctionDef):
                self.async_functions.add(node.name)

    def _identify_synchronized_sections(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.With):
                for item in node.items:
                    if isinstance(item.context_expr, ast.Call):
                        if isinstance(item.context_expr.func, ast.Name):
                            if item.context_expr.func.id in self.SYNC_PRIMITIVES:
                                self.synchronized_sections.add(node.lineno)
                        elif isinstance(item.context_expr.func, ast.Attribute):
                            full_name = f"{item.context_expr.func.value}.{item.context_expr.func.attr}"
                            if full_name in self.SYNC_PRIMITIVES:
                                self.synchronized_sections.add(node.lineno)

    def _detect_race_conditions(self, file_path: str, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self._check_function_for_races(file_path, node)

    def _check_function_for_races(self, file_path: str, func_node):
        accesses_shared_state = False
        is_synchronized = False

        for stmt in ast.walk(func_node):
            if isinstance(stmt, ast.Name) and stmt.id in self.shared_state:
                accesses_shared_state = True

        for line in range(func_node.lineno, func_node.end_lineno + 1 if func_node.end_lineno else func_node.lineno + 100):
            if line in self.synchronized_sections:
                is_synchronized = True
                break

        if accesses_shared_state and not is_synchronized:
            if isinstance(func_node, ast.AsyncFunctionDef) or func_node.name in self.async_functions:
                severity = "critical"
            else:
                severity = "high"

            self.violations.append({
                "type": "connascence_of_timing",
                "severity": severity,
                "file_path": file_path,
                "line_number": func_node.lineno,
                "function_name": func_node.name,
                "description": "Shared state accessed without synchronization - potential race condition",
                "recommendation": "Use locks, semaphores, or atomic operations to synchronize shared state access"
            })

    def _detect_async_timing_issues(self, file_path: str, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.AsyncFunctionDef):
                await_calls = []

                for child in ast.walk(node):
                    if isinstance(child, ast.Await):
                        await_calls.append(child)

                if len(await_calls) >= 2:
                    has_gather = False
                    for child in ast.walk(node):
                        if isinstance(child, ast.Call):
                            if isinstance(child.func, ast.Attribute) and child.func.attr == 'gather':
                                has_gather = True
                                break

                    if not has_gather:
                        self.violations.append({
                            "type": "connascence_of_timing",
                            "severity": "medium",
                            "file_path": file_path,
                            "line_number": node.lineno,
                            "function_name": node.name,
                            "description": f"Sequential await calls ({len(await_calls)}) may have timing dependencies",
                            "await_count": len(await_calls),
                            "recommendation": "Consider using asyncio.gather() for parallel execution if order-independent"
                        })

                for child in node.body:
                    if isinstance(child, ast.If):
                        if self._checks_async_result(child.test):
                            self.violations.append({
                                "type": "connascence_of_timing",
                                "severity": "high",
                                "file_path": file_path,
                                "line_number": child.lineno,
                                "description": "Conditional logic depends on async operation timing",
                                "recommendation": "Refactor to use explicit synchronization or state management"
                            })

    def _checks_async_result(self, test_node: ast.expr) -> bool:
        for node in ast.walk(test_node):
            if isinstance(node, ast.Name):
                if node.id in self.async_functions:
                    return True

        return False

def detect_timing_violations(file_path: str, source_code: str) -> List[Dict]:
    detector = EnhancedTimingDetector()
    return detector.detect(file_path, source_code)
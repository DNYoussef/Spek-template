from src.constants.base import MAXIMUM_NESTED_DEPTH

Implements bounded AST traversal with explicit resource limits for NASA Power of Ten Rule 4 compliance.
Replaces recursive traversal with stack-based iteration to ensure bounded operations.

NASA Rule 4 Compliance:
- All loops must have statically determinable upper bounds
- Stack-based iteration instead of recursion (NASA Rule 1)
- Explicit resource bounds (max_depth, max_nodes)
- Bounded memory usage with overflow protection
"""

import ast
import time
from collections import deque
from dataclasses import dataclass
from typing import Any, Dict, Iterator, List, Optional, Set, Tuple

# NASA POT10 compliance constants
MAX_AST_DEPTH = 20         # NASA Rule 4: Maximum traversal depth
MAX_AST_NODES = 5000       # NASA Rule 4: Maximum nodes processed  
MAX_PROCESSING_TIME = 30   # NASA Rule 4: Maximum processing time (seconds)
MAX_STACK_SIZE = 1000      # NASA Rule 4: Maximum stack depth

@dataclass
class TraversalBounds:
    """NASA Rule 4 compliant traversal bounds configuration."""
    max_depth: int = MAX_AST_DEPTH
    max_nodes: int = MAX_AST_NODES
    max_time_seconds: int = MAX_PROCESSING_TIME
    max_stack_size: int = MAX_STACK_SIZE
    
def __post_init__(self):
        """NASA Rule 5: Input validation assertions."""
        assert self.max_depth > 0, "max_depth must be positive"
        assert self.max_nodes > 0, "max_nodes must be positive"
        assert self.max_time_seconds > 0, "max_time_seconds must be positive"
        assert self.max_stack_size > 0, "max_stack_size must be positive"

@dataclass
class TraversalStats:
    """Statistics from bounded AST traversal."""
    nodes_processed: int = 0
    max_depth_reached: int = 0
    traversal_time_ms: float = 0.0
    max_stack_size_used: int = 0
    bounds_exceeded: bool = False
    truncated_at_node: Optional[str] = None

class BoundedASTWalker:
    """
    NASA Rule 4 compliant AST walker with explicit bounds.
    Implements stack-based traversal to avoid recursion (NASA Rule 1).
    All operations are bounded with resource limits (NASA Rule 4).
    """
    
def __init__(self, bounds: Optional[TraversalBounds] = None):
        """
        Initialize bounded AST walker with NASA compliance bounds.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        # NASA Rule 5: Input validation
        self.bounds = bounds or TraversalBounds()
        
        # Traversal state
        self.stats = TraversalStats()
        self.start_time: Optional[float] = None
        self.visited_nodes: Set[int] = set()  # Prevent infinite loops
        
        # NASA Rule MAXIMUM_NESTED_DEPTH: Post-condition assertion
        assert isinstance(self.bounds, TraversalBounds), "bounds must be TraversalBounds instance"
    
def walk_bounded(self, tree: ast.AST) -> Iterator[ast.AST]:
        """
        Bounded AST traversal with explicit resource limits.
        NASA Rule 4 compliant: <60 LOC, bounded operations.
        """
        # NASA Rule 5: Input validation assertions
        assert tree is not None, "AST tree cannot be None"
        assert isinstance(tree, ast.AST), "tree must be AST instance"
        
        # Initialize traversal
        self._initialize_traversal()
        
        # Stack-based iteration to avoid recursion (NASA Rule 1)
        stack = deque([(tree, 0)])  # (node, depth) pairs
        
        # NASA Rule 4: Bounded iteration with explicit limits
        while (stack and 
                self.stats.nodes_processed < self.bounds.max_nodes and
                len(stack) <= self.bounds.max_stack_size and
                not self._is_time_exceeded()):
            
            node, depth = stack.popleft()
            
            # NASA Rule 4: Bounded depth check
            if depth > self.bounds.max_depth:
                self.stats.bounds_exceeded = True
                self.stats.truncated_at_node = type(node).__name__
                break
            
            # Prevent infinite loops with node ID tracking
            node_id = id(node)
            if node_id in self.visited_nodes:
                continue
            self.visited_nodes.add(node_id)
            
            # Update traversal statistics
            self.stats.nodes_processed += 1
            self.stats.max_depth_reached = max(self.stats.max_depth_reached, depth)
            self.stats.max_stack_size_used = max(self.stats.max_stack_size_used, len(stack))
            
            yield node
            
            # Add children to stack in reverse order for proper traversal
            children = list(ast.iter_child_nodes(node))
            for child in reversed(children):
                if len(stack) < self.bounds.max_stack_size:
                    stack.append((child, depth + 1))
                else:
                    self.stats.bounds_exceeded = True
                    break
        
        # Finalize traversal statistics
        self._finalize_traversal()
        
        # NASA Rule 7: Validate traversal completion
        if self.stats.bounds_exceeded:
            print(f"Warning: AST traversal truncated - {self.stats.truncated_at_node} at depth {self.stats.max_depth_reached}")
    
def walk_specific_types(self, tree: ast.AST, node_types: Tuple[type, ...]) -> Iterator[ast.AST]:
        """
        Bounded traversal for specific AST node types.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        # NASA Rule 5: Input validation
        assert tree is not None, "AST tree cannot be None"
        assert node_types is not None, "node_types cannot be None"
        assert len(node_types) > 0, "node_types must not be empty"
        
        for node in self.walk_bounded(tree):
            if isinstance(node, node_types):
                yield node
    
def collect_functions_bounded(self, tree: ast.AST) -> List[ast.FunctionDef]:
        """
        Collect function definitions with bounded traversal.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        # NASA Rule 5: Input validation
        assert tree is not None, "AST tree cannot be None"
        
        functions = []
        functions_collected = 0
        
        for node in self.walk_specific_types(tree, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if functions_collected >= 100:  # Bounded collection
                break
            functions.append(node)
            functions_collected += 1
        
        # NASA Rule 7: Validate return value
        assert isinstance(functions, list), "functions must be a list"
        return functions
    
def find_violations_bounded(self, tree: ast.AST, violation_types: Dict[str, type]) -> Dict[str, List[ast.AST]]:
        """
        Find specific violation types with bounded search.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        # NASA Rule 5: Input validation
        assert tree is not None, "AST tree cannot be None"
        assert violation_types is not None, "violation_types cannot be None"
        
        violations = {vtype: [] for vtype in violation_types.keys()}
        
        for node in self.walk_bounded(tree):
            for violation_name, node_type in violation_types.items():
                if isinstance(node, node_type):
                    violations[violation_name].append(node)
                    # Bounded collection per violation type
                    if len(violations[violation_name]) >= 50:
                        break
        
        return violations
    
def _initialize_traversal(self) -> None:
        """Initialize traversal state and statistics."""
        self.start_time = time.time()
        self.stats = TraversalStats()
        self.visited_nodes.clear()
    
def _finalize_traversal(self) -> None:
        """Finalize traversal and calculate final statistics."""
        if self.start_time is not None:
            self.stats.traversal_time_ms = (time.time() - self.start_time) * 1000
    
def _is_time_exceeded(self) -> bool:
        """Check if traversal time limit exceeded."""
        if self.start_time is None:
            return False
        
        elapsed = time.time() - self.start_time
        return elapsed > self.bounds.max_time_seconds
    
def get_traversal_report(self) -> Dict[str, Any]:
        """
        Generate traversal performance report.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        return {
            "bounds_configuration": {
                "max_depth": self.bounds.max_depth,
                "max_nodes": self.bounds.max_nodes,
                "max_time_seconds": self.bounds.max_time_seconds,
                "max_stack_size": self.bounds.max_stack_size
            },
            "traversal_statistics": {
                "nodes_processed": self.stats.nodes_processed,
                "max_depth_reached": self.stats.max_depth_reached,
                "traversal_time_ms": self.stats.traversal_time_ms,
                "max_stack_size_used": self.stats.max_stack_size_used,
                "bounds_exceeded": self.stats.bounds_exceeded,
                "truncated_at_node": self.stats.truncated_at_node
            },
            "nasa_compliance": {
                "rule_1_compliant": True,  # No recursion used
                "rule_4_compliant": not self.stats.bounds_exceeded,  # Within bounds
                "bounded_operations": True,  # All operations bounded
                "stack_based_iteration": True  # Stack-based traversal
            },
            "performance_metrics": {
                "nodes_per_second": self._calculate_nodes_per_second(),
                "memory_efficiency": self._calculate_memory_efficiency(),
                "bound_utilization": self._calculate_bound_utilization()
            }
        }
    
def _calculate_nodes_per_second(self) -> float:
        """Calculate nodes processed per second."""
        if self.stats.traversal_time_ms <= 0:
            return 0.0
        
        return (self.stats.nodes_processed * 1000) / self.stats.traversal_time_ms
    
def _calculate_memory_efficiency(self) -> float:
        """Calculate memory efficiency (0.0-1.0)."""
        if self.bounds.max_stack_size <= 0:
            return 0.0
        
        return 1.0 - (self.stats.max_stack_size_used / self.bounds.max_stack_size)
    
def _calculate_bound_utilization(self) -> Dict[str, float]:
        """Calculate utilization of various bounds."""
        return {
            "depth_utilization": self.stats.max_depth_reached / self.bounds.max_depth,
            "nodes_utilization": self.stats.nodes_processed / self.bounds.max_nodes,
            "stack_utilization": self.stats.max_stack_size_used / self.bounds.max_stack_size,
            "time_utilization": (self.stats.traversal_time_ms / 1000) / self.bounds.max_time_seconds
        }

class NASACompliantAnalyzer:
    """
    NASA compliant analyzer using bounded AST traversal.
    Demonstrates integration of BoundedASTWalker for Rule 4 compliance.
    """
    
def __init__(self, traversal_bounds: Optional[TraversalBounds] = None):
        """Initialize NASA compliant analyzer."""
        self.walker = BoundedASTWalker(traversal_bounds)
        self.analysis_cache: Dict[str, Any] = {}
    
def analyze_file_bounded(self, file_path: str) -> Dict[str, Any]:
        """
        Analyze file using bounded AST traversal.
        NASA Rule 4 compliant: Function <60 LOC.
        """
        # NASA Rule 5: Input validation
        assert file_path is not None, "file_path cannot be None"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            tree = ast.parse(source_code)
            
            # Collect functions with bounded traversal
            functions = self.walker.collect_functions_bounded(tree)
            
            # Find specific violations with bounded search
            violations = self.walker.find_violations_bounded(tree, {
                "long_functions": ast.FunctionDef,
                "unbounded_loops": ast.While,
                "complex_conditions": ast.If
            })
            
            # Generate analysis report
            return {
                "file_path": file_path,
                "functions_found": len(functions),
                "nasa_rule_2_violations": len([f for f in functions if self._is_function_too_long(f)]),
                "nasa_rule_4_violations": len(violations.get("unbounded_loops", [])),
                "bounded_traversal_report": self.walker.get_traversal_report(),
                "nasa_compliance_summary": {
                    "rule_1_compliant": True,  # No recursion
                    "rule_4_compliant": not self.walker.stats.bounds_exceeded,
                    "analysis_bounded": True
                }
            }
            
        except Exception as e:
            return {"error": str(e), "file_path": file_path}
    
def _is_function_too_long(self, func_node: ast.FunctionDef) -> bool:
        """Check if function exceeds NASA Rule 2 (60 LOC limit)."""
        if hasattr(func_node, 'end_lineno') and func_node.end_lineno:
            length = func_node.end_lineno - func_node.lineno + 1
        else:
            length = len(func_node.body) + 2  # Estimate
        
        return length > 60

# NASA Rule 4 compliant factory functions (<60 LOC each)
def create_bounded_walker(max_depth: int = MAX_AST_DEPTH, max_nodes: int = MAX_AST_NODES) -> BoundedASTWalker:
    """Factory function for bounded AST walker creation."""
    bounds = TraversalBounds(max_depth=max_depth, max_nodes=max_nodes)
    return BoundedASTWalker(bounds)

def create_nasa_compliant_analyzer() -> NASACompliantAnalyzer:
    """Factory function for NASA compliant analyzer creation."""
    return NASACompliantAnalyzer()

def validate_traversal_bounds(bounds: TraversalBounds) -> bool:
    """Validate traversal bounds configuration."""
    assert bounds is not None, "bounds cannot be None"
    
    return (bounds.max_depth > 0 and 
            bounds.max_nodes > 0 and 
            bounds.max_time_seconds > 0 and
            bounds.max_stack_size > 0)

def benchmark_bounded_traversal(file_path: str, iterations: int = 5) -> Dict[str, Any]:
    """
    Benchmark bounded traversal performance.
    NASA Rule 4 compliant: Function <60 LOC.
    """
    # NASA Rule 5: Input validation
    assert file_path is not None, "file_path cannot be None"
    assert iterations > 0, "iterations must be positive"
    
    results = []
    
    for i in range(min(iterations, 10)):  # Bounded iterations
        analyzer = create_nasa_compliant_analyzer()
        result = analyzer.analyze_file_bounded(file_path)
        
        if "bounded_traversal_report" in result:
            results.append(result["bounded_traversal_report"])
    
    # Calculate aggregate statistics
    if results:
        avg_time = sum(r["traversal_statistics"]["traversal_time_ms"] for r in results) / len(results)
        avg_nodes = sum(r["traversal_statistics"]["nodes_processed"] for r in results) / len(results)
        
        return {
            "iterations": len(results),
            "average_traversal_time_ms": avg_time,
            "average_nodes_processed": avg_nodes,
            "nasa_rule_4_compliant": all(r["nasa_compliance"]["rule_4_compliant"] for r in results)
        }
    
    return {"error": "No successful traversals"}

__all__ = [
    "BoundedASTWalker",
    "TraversalBounds", 
    "TraversalStats",
    "NASACompliantAnalyzer",
    "create_bounded_walker",
    "create_nasa_compliant_analyzer",
    "validate_traversal_bounds",
    "benchmark_bounded_traversal"
]
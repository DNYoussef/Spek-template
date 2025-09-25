#!/usr/bin/env python3
"""
Service Extractor Utility - Phase 3 Remediation Tool

Extracts cohesive services from god objects based on:
- Method clustering by functionality
- Data dependencies
- Call graph analysis
- Single Responsibility Principle
"""

from collections import defaultdict, Counter
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any
import ast
import json
import os
import sys

from dataclasses import dataclass, field
import networkx as nx

@dataclass
class MethodInfo:
    """Information about a method/function."""
    name: str
    class_name: Optional[str]
    parameters: List[str]
    returns: Optional[str]
    calls: Set[str]  # Methods this one calls
    called_by: Set[str]  # Methods that call this one
    accesses: Set[str]  # Attributes accessed
    modifies: Set[str]  # Attributes modified
    complexity: int
    line_count: int
    start_line: int
    end_line: int

@dataclass
class ServiceCluster:
    """A cluster of related methods forming a service."""
    name: str
    methods: List[MethodInfo]
    shared_data: Set[str]
    external_calls: Set[str]
    cohesion_score: float
    coupling_score: float

class CallGraphAnalyzer(ast.NodeVisitor):
    """Analyzes method calls and data dependencies."""

    def __init__(self):
        self.current_class = None
        self.current_method = None
        self.methods = {}
        self.call_graph = defaultdict(set)
        self.data_access = defaultdict(set)
        self.data_modify = defaultdict(set)

    def visit_ClassDef(self, node):
        """Track class context."""
        old_class = self.current_class
        self.current_class = node.name
        self.generic_visit(node)
        self.current_class = old_class

    def visit_FunctionDef(self, node):
        """Analyze function/method definitions."""
        method_name = f"{self.current_class}.{node.name}" if self.current_class else node.name

        # Extract method info
        params = [arg.arg for arg in node.args.args]
        returns = self._get_return_type(node)
        complexity = self._calculate_complexity(node)
        line_count = (node.end_lineno or node.lineno) - node.lineno + 1

        self.methods[method_name] = MethodInfo(
            name=node.name,
            class_name=self.current_class,
            parameters=params,
            returns=returns,
            calls=set(),
            called_by=set(),
            accesses=set(),
            modifies=set(),
            complexity=complexity,
            line_count=line_count,
            start_line=node.lineno,
            end_line=node.end_lineno or node.lineno
        )

        # Analyze method body
        old_method = self.current_method
        self.current_method = method_name
        self.generic_visit(node)
        self.current_method = old_method

    def visit_Call(self, node):
        """Track method calls."""
        if self.current_method:
            if isinstance(node.func, ast.Name):
                called = node.func.id
                self.call_graph[self.current_method].add(called)
            elif isinstance(node.func, ast.Attribute):
                if isinstance(node.func.value, ast.Name) and node.func.value.id == 'self':
                    called = f"{self.current_class}.{node.func.attr}"
                    self.call_graph[self.current_method].add(called)
                else:
                    called = node.func.attr
                    self.call_graph[self.current_method].add(called)
        self.generic_visit(node)

    def visit_Attribute(self, node):
        """Track attribute access."""
        if self.current_method and isinstance(node.value, ast.Name):
            if node.value.id == 'self':
                attr = f"self.{node.attr}"
                self.data_access[self.current_method].add(attr)
        self.generic_visit(node)

    def visit_Assign(self, node):
        """Track attribute modifications."""
        if self.current_method:
            for target in node.targets:
                if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
                    if target.value.id == 'self':
                        attr = f"self.{target.attr}"
                        self.data_modify[self.current_method].add(attr)
        self.generic_visit(node)

    def _get_return_type(self, node) -> Optional[str]:
        """Extract return type annotation if present."""
        if node.returns:
            if isinstance(node.returns, ast.Name):
                return node.returns.id
            elif isinstance(node.returns, ast.Constant):
                return str(node.returns.value)
        return None

    def _calculate_complexity(self, node) -> int:
        """Calculate cyclomatic complexity."""
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        return complexity

class ServiceExtractor:
    """Main service extraction engine."""

    def __init__(self):
        self.analyzer = None
        self.graph = None

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a file to extract services."""
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        try:
            tree = ast.parse(source)
            self.analyzer = CallGraphAnalyzer()
            self.analyzer.visit(tree)

            # Build call graph
            self.graph = nx.DiGraph()
            for method, info in self.analyzer.methods.items():
                self.graph.add_node(method, **vars(info))

            for caller, callees in self.analyzer.call_graph.items():
                for callee in callees:
                    if callee in self.analyzer.methods:
                        self.graph.add_edge(caller, callee)
                        self.analyzer.methods[callee].called_by.add(caller)
                        self.analyzer.methods[caller].calls.add(callee)

            # Update data access info
            for method, accesses in self.analyzer.data_access.items():
                if method in self.analyzer.methods:
                    self.analyzer.methods[method].accesses = accesses

            for method, modifies in self.analyzer.data_modify.items():
                if method in self.analyzer.methods:
                    self.analyzer.methods[method].modifies = modifies

            return {
                'methods': self.analyzer.methods,
                'call_graph': dict(self.analyzer.call_graph),
                'data_dependencies': self._analyze_data_dependencies()
            }

        except SyntaxError as e:
            return {'error': str(e)}

    def _analyze_data_dependencies(self) -> Dict[str, Set[str]]:
        """Analyze which methods share data dependencies."""
        dependencies = defaultdict(set)

        for method, info in self.analyzer.methods.items():
            accessed_data = info.accesses | info.modifies
            for other_method, other_info in self.analyzer.methods.items():
                if method != other_method:
                    other_data = other_info.accesses | other_info.modifies
                    shared = accessed_data & other_data
                    if shared:
                        dependencies[method].add(other_method)

        return dict(dependencies)

    def extract_services(self, file_path: str, max_methods_per_service: int = 20) -> List[ServiceCluster]:
        """Extract cohesive services from a file."""
        analysis = self.analyze_file(file_path)
        if 'error' in analysis:
            return []

        # Cluster methods based on cohesion
        clusters = self._cluster_methods(analysis['methods'], analysis['data_dependencies'])

        # Create service clusters
        services = []
        for i, (cluster_name, methods) in enumerate(clusters.items()):
            service = self._create_service_cluster(cluster_name, methods)
            services.append(service)

        return services

    def _cluster_methods(self, methods: Dict[str, MethodInfo], dependencies: Dict[str, Set[str]]) -> Dict[str, List[MethodInfo]]:
        """Cluster methods into cohesive groups."""
        clusters = defaultdict(list)

        # Use community detection if graph is large enough
        if len(methods) > 10 and self.graph:
            try:
                import community
                communities = community.best_partition(self.graph.to_undirected())
                for method, community_id in communities.items():
                    cluster_name = f"service_{community_id}"
                    clusters[cluster_name].append(methods[method])
            except ImportError:
                # Fall back to simple clustering
                clusters = self._simple_clustering(methods, dependencies)
        else:
            clusters = self._simple_clustering(methods, dependencies)

        return dict(clusters)

    def _simple_clustering(self, methods: Dict[str, MethodInfo], dependencies: Dict[str, Set[str]]) -> Dict[str, List[MethodInfo]]:
        """Simple clustering based on method names and data sharing."""
        clusters = defaultdict(list)

        # Group by functionality based on name patterns
        patterns = {
            'validation': ['validate', 'check', 'verify', 'ensure'],
            'processing': ['process', 'handle', 'execute', 'run'],
            'data_access': ['get', 'fetch', 'load', 'read'],
            'data_mutation': ['set', 'save', 'store', 'write', 'update'],
            'transformation': ['convert', 'transform', 'parse', 'format'],
            'calculation': ['calculate', 'compute', 'aggregate', 'sum'],
            'initialization': ['__init__', 'setup', 'initialize', 'configure'],
            'utilities': ['util', 'helper', 'common', 'shared']
        }

        # Classify each method
        for method_name, method_info in methods.items():
            assigned = False
            method_lower = method_info.name.lower()

            for service, keywords in patterns.items():
                if any(keyword in method_lower for keyword in keywords):
                    clusters[service].append(method_info)
                    assigned = True
                    break

            if not assigned:
                # Group by data dependencies
                if method_name in dependencies and dependencies[method_name]:
                    # Find the cluster with most shared dependencies
                    best_cluster = None
                    max_shared = 0

                    for cluster_name, cluster_methods in clusters.items():
                        shared_count = sum(1 for m in cluster_methods if m.name in dependencies[method_name])
                        if shared_count > max_shared:
                            max_shared = shared_count
                            best_cluster = cluster_name

                    if best_cluster:
                        clusters[best_cluster].append(method_info)
                    else:
                        clusters['core'].append(method_info)
                else:
                    clusters['core'].append(method_info)

        return dict(clusters)

    def _create_service_cluster(self, name: str, methods: List[MethodInfo]) -> ServiceCluster:
        """Create a service cluster from a group of methods."""
        # Collect shared data
        shared_data = set()
        for method in methods:
            shared_data.update(method.accesses)
            shared_data.update(method.modifies)

        # Collect external calls
        external_calls = set()
        method_names = {m.name for m in methods}
        for method in methods:
            for call in method.calls:
                if call not in method_names:
                    external_calls.add(call)

        # Calculate cohesion (methods that work on same data)
        cohesion = self._calculate_cohesion(methods)

        # Calculate coupling (dependencies on external methods)
        coupling = len(external_calls) / max(len(methods), 1)

        return ServiceCluster(
            name=name,
            methods=methods,
            shared_data=shared_data,
            external_calls=external_calls,
            cohesion_score=cohesion,
            coupling_score=coupling
        )

    def _calculate_cohesion(self, methods: List[MethodInfo]) -> float:
        """Calculate cohesion score for a group of methods."""
        if len(methods) <= 1:
            return 1.0

        # Count methods that share data
        shared_count = 0
        total_pairs = 0

        for i, method1 in enumerate(methods):
            for method2 in methods[i+1:]:
                total_pairs += 1
                data1 = method1.accesses | method1.modifies
                data2 = method2.accesses | method2.modifies
                if data1 & data2:  # If they share any data
                    shared_count += 1

        return shared_count / total_pairs if total_pairs > 0 else 0.0

    def generate_service_module(self, service: ServiceCluster, original_file: str) -> str:
        """Generate Python code for a service module."""
        module_name = f"{Path(original_file).stem}_{service.name}"

        content = f'''"""
{service.name.replace('_', ' ').title()} Service Module
Extracted from {Path(original_file).name}

Cohesion Score: {service.cohesion_score:.2f}
Coupling Score: {service.coupling_score:.2f}
"""

from typing import Any, Dict, List, Optional

'''

        # Add class wrapper if methods are from a class
        if service.methods and service.methods[0].class_name:
            class_name = f"{service.name.title().replace('_', '')}Service"
            content += f"\nclass {class_name}:\n"
            content += f'    """Service class for {service.name} operations."""\n\n'

            # Add __init__ if needed
            if service.shared_data:
                content += "    def __init__(self):\n"
                for data in service.shared_data:
                    if data.startswith('self.'):
                        attr_name = data[5:]  # Remove 'self.'
                content += "\n"

            # Add methods
            for method in service.methods:
                content += f"    def {method.name}(self"
                if method.parameters and method.parameters[0] != 'self':
                    content += ", " + ", ".join(method.parameters[1:])
                content += "):\n"
                content += "        pass\n\n"
        else:
            # Module-level functions
            for method in service.methods:
                content += f"def {method.name}("
                content += ", ".join(method.parameters)
                content += "):\n"
                content += "    pass\n\n"

        return content

    def save_services(self, services: List[ServiceCluster], original_file: str, output_dir: str):
        """Save extracted services to disk."""
        os.makedirs(output_dir, exist_ok=True)

        for service in services:
            filename = f"{Path(original_file).stem}_{service.name}.py"
            filepath = os.path.join(output_dir, filename)

            content = self.generate_service_module(service, original_file)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"Created service module: {filepath}")
            print(f"  Methods: {len(service.methods)}")
            print(f"  Cohesion: {service.cohesion_score:.2f}")
            print(f"  Coupling: {service.coupling_score:.2f}")

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python service_extractor.py <file> [output_dir]")
        sys.exit(1)

    file_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'extracted_services'

    extractor = ServiceExtractor()
    services = extractor.extract_services(file_path)

    if services:
        print(f"Extracted {len(services)} services from {file_path}")
        extractor.save_services(services, file_path, output_dir)
    else:
        print(f"No services extracted from {file_path}")

if __name__ == "__main__":
    main()
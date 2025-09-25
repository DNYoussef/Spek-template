from src.constants.base import MAXIMUM_NESTED_DEPTH

Applies the Interface Segregation Principle (ISP) to break down large interfaces
into smaller, client-specific interfaces.

Features:
- Analyzes class interfaces and their usage patterns
- Identifies interface segregation opportunities
- Creates role-based interfaces
- Generates adapter/facade patterns for compatibility
"""

import ast
import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class InterfaceMethod:
    """Represents a method in an interface."""
    name: str
    parameters: List[str]
    return_type: Optional[str]
    is_abstract: bool
    docstring: Optional[str]
    used_by_clients: Set[str] = field(default_factory=set)

@dataclass
class ClientUsagePattern:
    """Tracks how a client uses an interface."""
    client_name: str
    interface_name: str
    methods_used: Set[str]
    frequency: Dict[str, int]  # method_name -> call count

@dataclass
class SegregatedInterface:
    """Represents a segregated interface based on client usage."""
    name: str
    original_interface: str
    methods: List[InterfaceMethod]
    clients: Set[str]
    purpose: str

class InterfaceAnalyzer(ast.NodeVisitor):
    """Analyzes interfaces and their usage patterns."""

    def __init__(self):
        self.interfaces = {}  # interface_name -> List[InterfaceMethod]
        self.implementations = defaultdict(set)  # interface -> implementations
        self.client_usage = defaultdict(lambda: defaultdict(set))  # client -> interface -> methods
        self.current_class = None
        self.current_function = None
        self.inheritance_map = {}  # class -> base_classes

    def visit_ClassDef(self, node):
        """Analyze class definitions for interfaces."""
        self.current_class = node.name

        # Check if it's an interface (ABC or Protocol)
        is_interface = self._is_interface(node)

        if is_interface:
            methods = []
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    method = InterfaceMethod(
                        name=item.name,
                        parameters=[arg.arg for arg in item.args.args[1:]],  # Skip 'self'
                        return_type=self._get_return_type(item),
                        is_abstract=self._is_abstract_method(item),
                        docstring=ast.get_docstring(item)
                    )
                    methods.append(method)
            self.interfaces[node.name] = methods

        # Track inheritance
        base_classes = [self._get_base_name(base) for base in node.bases]
        self.inheritance_map[node.name] = base_classes

        # Check if this class implements any interface
        for base in base_classes:
            if base in self.interfaces:
                self.implementations[base].add(node.name)

        self.generic_visit(node)
        self.current_class = None

    def visit_FunctionDef(self, node):
        """Track method calls within functions."""
        old_function = self.current_function
        self.current_function = node.name
        self.generic_visit(node)
        self.current_function = old_function

    def visit_Call(self, node):
        """Track interface method usage."""
        if self.current_function and isinstance(node.func, ast.Attribute):
            # Track which methods are being called
            method_name = node.func.attr
            if isinstance(node.func.value, ast.Name):
                obj_name = node.func.value.id
                # This is a simplified tracking - in practice would need type inference
                client = self.current_class or self.current_function
                self.client_usage[client][obj_name].add(method_name)

        self.generic_visit(node)

    def _is_interface(self, node) -> bool:
        """Check if a class is an interface (ABC or Protocol)."""
        # Check for ABC inheritance
        for base in node.bases:
            base_name = self._get_base_name(base)
            if base_name in ['ABC', 'Protocol', 'Interface']:
                return True

        # Check for abstract methods
        abstract_count = 0
        total_methods = 0
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                total_methods += 1
                if self._is_abstract_method(item):
                    abstract_count += 1

        # Consider it an interface if >50% methods are abstract
        return abstract_count > 0 and abstract_count >= total_methods * 0.5

    def _is_abstract_method(self, node) -> bool:
        """Check if a method is abstract."""
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Name) and decorator.id == 'abstractmethod':
                return True
            elif isinstance(decorator, ast.Attribute) and decorator.attr == 'abstractmethod':
                return True
        return False

    def _get_base_name(self, base) -> str:
        """Extract base class name."""
        if isinstance(base, ast.Name):
            return base.id
        elif isinstance(base, ast.Attribute):
            return base.attr
        return 'Unknown'

    def _get_return_type(self, node) -> Optional[str]:
        """Extract return type annotation."""
        if node.returns:
            if isinstance(node.returns, ast.Name):
                return node.returns.id
            elif isinstance(node.returns, ast.Constant):
                return str(node.returns.value)
        return None

class InterfaceSegregator:
    """Main interface segregation engine."""

    def __init__(self, min_methods_per_interface: int = 2, max_methods_per_interface: int = 7):
        self.min_methods = min_methods_per_interface
        self.max_methods = max_methods_per_interface
        self.analyzer = None

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a file for interface segregation opportunities."""
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        try:
            tree = ast.parse(source)
            self.analyzer = InterfaceAnalyzer()
            self.analyzer.visit(tree)

            return {
                'interfaces': self.analyzer.interfaces,
                'implementations': dict(self.analyzer.implementations),
                'client_usage': dict(self.analyzer.client_usage),
                'segregation_opportunities': self._identify_segregation_opportunities()
            }
        except SyntaxError as e:
            return {'error': str(e)}

    def _identify_segregation_opportunities(self) -> List[Dict[str, Any]]:
        """Identify interfaces that should be segregated."""
        opportunities = []

        for interface_name, methods in self.analyzer.interfaces.items():
            if len(methods) > self.max_methods:
                # Large interface - candidate for segregation
                opportunity = {
                    'interface': interface_name,
                    'method_count': len(methods),
                    'reason': 'Interface too large',
                    'suggested_splits': self._suggest_interface_splits(interface_name, methods)
                }
                opportunities.append(opportunity)

            # Check for low cohesion (methods not used together)
            usage_patterns = self._analyze_usage_patterns(interface_name)
            if usage_patterns:
                cohesion = self._calculate_interface_cohesion(usage_patterns)
                if cohesion < 0.5:  # Low cohesion threshold
                    opportunity = {
                        'interface': interface_name,
                        'cohesion': cohesion,
                        'reason': 'Low cohesion - methods not used together',
                        'usage_patterns': usage_patterns
                    }
                    opportunities.append(opportunity)

        return opportunities

    def _suggest_interface_splits(self, interface_name: str, methods: List[InterfaceMethod]) -> List[SegregatedInterface]:
        """Suggest how to split a large interface."""
        suggestions = []

        # Group methods by naming patterns
        method_groups = self._group_methods_by_pattern(methods)

        for group_name, group_methods in method_groups.items():
            if len(group_methods) >= self.min_methods:
                segregated = SegregatedInterface(
                    name=f"I{group_name.title()}{interface_name}",
                    original_interface=interface_name,
                    methods=group_methods,
                    clients=set(),  # Would be filled from usage analysis
                    purpose=f"{group_name.title()} operations from {interface_name}"
                )
                suggestions.append(segregated)

        # If no good grouping, split by size
        if not suggestions and len(methods) > self.max_methods:
            chunk_size = self.max_methods
            for i in range(0, len(methods), chunk_size):
                chunk = methods[i:i+chunk_size]
                segregated = SegregatedInterface(
                    name=f"{interface_name}Part{i//chunk_size + 1}",
                    original_interface=interface_name,
                    methods=chunk,
                    clients=set(),
                    purpose=f"Part {i//chunk_size + 1} of {interface_name}"
                )
                suggestions.append(segregated)

        return suggestions

    def _group_methods_by_pattern(self, methods: List[InterfaceMethod]) -> Dict[str, List[InterfaceMethod]]:
        """Group methods by naming patterns."""
        groups = defaultdict(list)

        patterns = {
            'query': ['get', 'fetch', 'find', 'search', 'list'],
            'command': ['set', 'update', 'delete', 'create', 'add', 'remove'],
            'validation': ['validate', 'check', 'verify', 'ensure'],
            'transformation': ['convert', 'transform', 'parse', 'format'],
            'lifecycle': ['init', 'start', 'stop', 'dispose', 'close'],
            'event': ['on_', 'handle_', 'trigger', 'emit']
        }

        for method in methods:
            assigned = False
            method_lower = method.name.lower()

            for group_name, keywords in patterns.items():
                if any(keyword in method_lower for keyword in keywords):
                    groups[group_name].append(method)
                    assigned = True
                    break

            if not assigned:
                groups['core'].append(method)

        return dict(groups)

    def _analyze_usage_patterns(self, interface_name: str) -> List[ClientUsagePattern]:
        """Analyze how clients use an interface."""
        patterns = []

        # This is simplified - in practice would need more sophisticated analysis
        for client, interfaces in self.analyzer.client_usage.items():
            for iface, methods in interfaces.items():
                if iface == interface_name or iface in self.analyzer.implementations.get(interface_name, set()):
                    pattern = ClientUsagePattern(
                        client_name=client,
                        interface_name=interface_name,
                        methods_used=methods,
                        frequency={}  # Would need dynamic analysis for real frequency
                    )
                    patterns.append(pattern)

        return patterns

    def _calculate_interface_cohesion(self, usage_patterns: List[ClientUsagePattern]) -> float:
        """Calculate cohesion score for an interface based on usage."""
        if not usage_patterns:
            return 1.0

        # Calculate how many methods are used together
        all_methods = set()
        for pattern in usage_patterns:
            all_methods.update(pattern.methods_used)

        if not all_methods:
            return 1.0

        # Calculate average percentage of methods used by each client
        usage_percentages = []
        for pattern in usage_patterns:
            percentage = len(pattern.methods_used) / len(all_methods)
            usage_percentages.append(percentage)

        return sum(usage_percentages) / len(usage_percentages) if usage_percentages else 0.0

    def generate_segregated_interface(self, segregated: SegregatedInterface) -> str:
        """Generate code for a segregated interface."""
        content = f'''"""
{segregated.purpose}

Segregated from: {segregated.original_interface}
"""

from abc import ABC, abstractmethod
from typing import Any, Optional

class {segregated.name}(ABC):
    """{segregated.purpose}"""

'''

        for method in segregated.methods:
            content += f"    @abstractmethod\n"
            content += f"    def {method.name}(self"

            if method.parameters:
                content += ", " + ", ".join(method.parameters)

            content += ")"

            if method.return_type:
                content += f" -> {method.return_type}"

            content += ":\n"

            if method.docstring:
                content += f'        """{method.docstring}"""\n'
            else:
                content += f'        """Abstract method {method.name}."""\n'

            content += "        pass\n\n"

        return content

    def generate_adapter(self, original_interface: str, segregated_interfaces: List[SegregatedInterface]) -> str:
        """Generate an adapter that implements segregated interfaces."""
        interface_names = [s.name for s in segregated_interfaces]

        content = f'''"""
Adapter for {original_interface} using segregated interfaces.
"""

from typing import Any

'''

        # Import segregated interfaces
        for interface in segregated_interfaces:
            content += f"from .{interface.name.lower()} import {interface.name}\n"

        content += f"\n\nclass {original_interface}Adapter("
        content += ", ".join(interface_names)
        content += "):\n"
        content += f'    """Adapter that combines segregated interfaces to match original {original_interface}."""\n\n'

        content += "    def __init__(self, implementation):\n"
        content += "        self.implementation = implementation\n\n"

        # Delegate all methods
        all_methods = []
        for interface in segregated_interfaces:
            all_methods.extend(interface.methods)

        for method in all_methods:
            content += f"    def {method.name}(self"
            if method.parameters:
                content += ", " + ", ".join(method.parameters)
            content += "):\n"
            content += f'        """Delegate to implementation."""\n'
            content += f"        return self.implementation.{method.name}("
            if method.parameters:
                content += ", ".join(method.parameters)
            content += ")\n\n"

        return content

    def apply_segregation(self, file_path: str, output_dir: str) -> List[str]:
        """Apply interface segregation to a file."""
        analysis = self.analyze_file(file_path)
        if 'error' in analysis:
            print(f"Error analyzing {file_path}: {analysis['error']}")
            return []

        created_files = []
        os.makedirs(output_dir, exist_ok=True)

        for opportunity in analysis.get('segregation_opportunities', []):
            interface_name = opportunity['interface']
            if 'suggested_splits' in opportunity:
                # Generate segregated interfaces
                for segregated in opportunity['suggested_splits']:
                    filename = f"{segregated.name.lower()}.py"
                    filepath = os.path.join(output_dir, filename)

                    content = self.generate_segregated_interface(segregated)

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

                    created_files.append(filepath)
                    print(f"Created segregated interface: {filepath}")

                # Generate adapter
                adapter_name = f"{interface_name.lower()}_adapter.py"
                adapter_path = os.path.join(output_dir, adapter_name)

                adapter_content = self.generate_adapter(interface_name, opportunity['suggested_splits'])

                with open(adapter_path, 'w', encoding='utf-8') as f:
                    f.write(adapter_content)

                created_files.append(adapter_path)
                print(f"Created adapter: {adapter_path}")

        return created_files

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python interface_segregator.py <file> [output_dir]")
        sys.exit(1)

    file_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'segregated_interfaces'

    segregator = InterfaceSegregator()
    created_files = segregator.apply_segregation(file_path, output_dir)

    if created_files:
        print(f"\nCreated {len(created_files)} files")
    else:
        print(f"\nNo interface segregation opportunities found")

if __name__ == "__main__":
    main()
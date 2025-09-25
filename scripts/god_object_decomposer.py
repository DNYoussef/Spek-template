#!/usr/bin/env python3
"""
God Object Decomposer - Phase 3 Remediation Tool

Automatically decomposes god objects (>500 LOC) into smaller, focused modules
using the Facade pattern and service extraction.

Features:
- Analyzes Python files for class and function boundaries
- Extracts services based on logical groupings
- Creates facade interfaces for backward compatibility
- Generates refactored module structure
"""

from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import ast
import json
import os
import re
import sys

from dataclasses import dataclass, field

@dataclass
class CodeSegment:
    """Represents a logical segment of code for extraction."""
    name: str
    type: str  # 'class', 'function', 'method', 'property'
    start_line: int
    end_line: int
    imports: List[str]
    dependencies: List[str]
    complexity: int
    content: str
    docstring: Optional[str] = None

@dataclass
class ServiceModule:
    """Represents an extracted service module."""
    name: str
    purpose: str
    segments: List[CodeSegment]
    imports: List[str]
    exports: List[str]
    file_path: str

class GodObjectAnalyzer(ast.NodeVisitor):
    """Analyzes Python files to identify logical segments for extraction."""

    def __init__(self, source_code: str):
        self.source_code = source_code
        self.lines = source_code.split('\n')
        self.segments = []
        self.imports = []
        self.current_class = None
        self.dependencies = defaultdict(list)

    def visit_Import(self, node):
        """Track import statements."""
        for alias in node.names:
            self.imports.append(f"import {alias.name}")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        """Track from...import statements."""
        module = node.module or ''
        for alias in node.names:
            self.imports.append(f"from {module} import {alias.name}")
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        """Analyze class definitions."""
        self.current_class = node.name
        segment = CodeSegment(
            name=node.name,
            type='class',
            start_line=node.lineno,
            end_line=node.end_lineno or node.lineno,
            imports=[],
            dependencies=[],
            complexity=self._calculate_complexity(node),
            content=self._extract_content(node),
            docstring=ast.get_docstring(node)
        )
        self.segments.append(segment)
        self.generic_visit(node)
        self.current_class = None

    def visit_FunctionDef(self, node):
        """Analyze function definitions."""
        parent = self.current_class or 'module'
        segment = CodeSegment(
            name=f"{parent}.{node.name}" if self.current_class else node.name,
            type='method' if self.current_class else 'function',
            start_line=node.lineno,
            end_line=node.end_lineno or node.lineno,
            imports=[],
            dependencies=self._extract_dependencies(node),
            complexity=self._calculate_complexity(node),
            content=self._extract_content(node),
            docstring=ast.get_docstring(node)
        )
        self.segments.append(segment)
        self.generic_visit(node)

    def _calculate_complexity(self, node) -> int:
        """Calculate cyclomatic complexity of a node."""
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        return complexity

    def _extract_content(self, node) -> str:
        """Extract source code content for a node."""
        start = node.lineno - 1
        end = node.end_lineno or node.lineno
        return '\n'.join(self.lines[start:end])

    def _extract_dependencies(self, node) -> List[str]:
        """Extract dependencies from a function/method."""
        deps = []
        for child in ast.walk(node):
            if isinstance(child, ast.Name):
                deps.append(child.id)
            elif isinstance(child, ast.Attribute):
                deps.append(f"{child.attr}")
        return list(set(deps))

class GodObjectDecomposer:
    """Main decomposer that orchestrates the refactoring process."""

    def __init__(self, max_lines_per_module: int = 250):
        self.max_lines = max_lines_per_module
        self.refactoring_stats = {
            'files_processed': 0,
            'god_objects_found': 0,
            'modules_created': 0,
            'lines_refactored': 0
        }

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a file for god object patterns."""
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        lines_count = len(source.split('\n'))
        if lines_count < 500:
            return {'is_god_object': False, 'lines': lines_count}

        try:
            tree = ast.parse(source)
            analyzer = GodObjectAnalyzer(source)
            analyzer.visit(tree)

            return {
                'is_god_object': True,
                'lines': lines_count,
                'segments': analyzer.segments,
                'imports': analyzer.imports,
                'complexity': sum(s.complexity for s in analyzer.segments)
            }
        except SyntaxError as e:
            return {'is_god_object': False, 'error': str(e)}

    def decompose(self, file_path: str, output_dir: str) -> List[ServiceModule]:
        """Decompose a god object into service modules."""
        analysis = self.analyze_file(file_path)
        if not analysis.get('is_god_object'):
            return []

        # Group segments by logical cohesion
        services = self._group_into_services(analysis['segments'])

        # Create service modules
        modules = []
        base_name = Path(file_path).stem

        for i, (service_name, segments) in enumerate(services.items()):
            module = ServiceModule(
                name=f"{base_name}_{service_name}",
                purpose=f"Extracted {service_name} service from {base_name}",
                segments=segments,
                imports=self._extract_required_imports(segments, analysis['imports']),
                exports=[s.name for s in segments if s.type in ('class', 'function')],
                file_path=os.path.join(output_dir, f"{base_name}_{service_name}.py")
            )
            modules.append(module)

        # Create facade module
        facade = self._create_facade(base_name, modules, output_dir)
        modules.append(facade)

        # Update statistics
        self.refactoring_stats['files_processed'] += 1
        self.refactoring_stats['god_objects_found'] += 1
        self.refactoring_stats['modules_created'] += len(modules)
        self.refactoring_stats['lines_refactored'] += analysis['lines']

        return modules

    def _group_into_services(self, segments: List[CodeSegment]) -> Dict[str, List[CodeSegment]]:
        """Group code segments into logical services."""
        services = defaultdict(list)

        # Simple grouping by name patterns and complexity
        for segment in segments:
            # Identify service category
            if 'validate' in segment.name.lower() or 'check' in segment.name.lower():
                service = 'validation'
            elif 'process' in segment.name.lower() or 'handle' in segment.name.lower():
                service = 'processing'
            elif 'save' in segment.name.lower() or 'load' in segment.name.lower():
                service = 'persistence'
            elif 'config' in segment.name.lower() or 'setting' in segment.name.lower():
                service = 'configuration'
            elif 'util' in segment.name.lower() or 'helper' in segment.name.lower():
                service = 'utilities'
            elif segment.type == 'class':
                service = 'core'
            else:
                service = 'operations'

            services[service].append(segment)

        return dict(services)

    def _extract_required_imports(self, segments: List[CodeSegment], all_imports: List[str]) -> List[str]:
        """Determine required imports for a service module."""
        # Simplified: return common imports
        required = [
            'import os',
            'import sys',
            'from typing import Dict, List, Optional, Any',
            'from dataclasses import dataclass'
        ]

        # Add specific imports based on dependencies
        deps = set()
        for segment in segments:
            deps.update(segment.dependencies)

        for imp in all_imports:
            for dep in deps:
                if dep in imp:
                    required.append(imp)
                    break

        return list(set(required))

    def _create_facade(self, base_name: str, modules: List[ServiceModule], output_dir: str) -> ServiceModule:
        """Create a facade module for backward compatibility."""
        facade_content = f'''"""
Facade module for {base_name} - maintains backward compatibility
while delegating to refactored service modules.
"""

'''

        # Add imports for all service modules
        for module in modules:
            module_name = Path(module.file_path).stem
            facade_content += f"from .{module_name} import *\n"

        facade_content += "\n# Re-export all public interfaces\n"
        facade_content += "__all__ = [\n"
        for module in modules:
            for export in module.exports:
                facade_content += f'    "{export}",\n'
        facade_content += "]\n"

        return ServiceModule(
            name=f"{base_name}_facade",
            purpose=f"Facade interface for refactored {base_name}",
            segments=[],
            imports=[],
            exports=[],
            file_path=os.path.join(output_dir, f"{base_name}.py")
        )

    def generate_module_file(self, module: ServiceModule) -> str:
        """Generate the Python code for a service module."""
        content = f'''"""
{module.purpose}

Automatically generated by God Object Decomposer
"""

'''
        # Add imports
        for imp in module.imports:
            content += f"{imp}\n"

        content += "\n\n"

        # Add code segments
        for segment in module.segments:
            if segment.docstring:
                content += f'"""{segment.docstring}"""\n'
            content += segment.content + "\n\n"

        return content

    def save_module(self, module: ServiceModule):
        """Save a module to disk."""
        os.makedirs(os.path.dirname(module.file_path), exist_ok=True)
        content = self.generate_module_file(module)

        with open(module.file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created module: {module.file_path}")

    def process_directory(self, directory: str, output_dir: str = None):
        """Process all Python files in a directory."""
        if output_dir is None:
            output_dir = os.path.join(directory, 'refactored')

        god_objects = []

        # Find all Python files
        for root, dirs, files in os.walk(directory):
            # Skip already refactored directories
            if 'refactored' in root:
                continue

            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)

                    # Check file size first
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = len(f.readlines())

                    if lines >= 500:
                        god_objects.append((file_path, lines))

        # Sort by size (largest first)
        god_objects.sort(key=lambda x: x[1], reverse=True)

        print(f"Found {len(god_objects)} god objects to refactor")

        # Process each god object
        for file_path, lines in god_objects[:10]:  # Start with top 10
            print(f"\nProcessing: {file_path} ({lines} lines)")

            try:
                modules = self.decompose(file_path, output_dir)

                for module in modules:
                    self.save_module(module)

                print(f"  Created {len(modules)} modules")

            except Exception as e:
                print(f"  Error: {e}")

        # Save statistics
        self.save_statistics(output_dir)

    def save_statistics(self, output_dir: str):
        """Save refactoring statistics."""
        stats_file = os.path.join(output_dir, 'refactoring_stats.json')

        with open(stats_file, 'w') as f:
            json.dump(self.refactoring_stats, f, indent=2)

        print(f"\nRefactoring Statistics:")
        print(f"  Files processed: {self.refactoring_stats['files_processed']}")
        print(f"  God objects found: {self.refactoring_stats['god_objects_found']}")
        print(f"  Modules created: {self.refactoring_stats['modules_created']}")
        print(f"  Lines refactored: {self.refactoring_stats['lines_refactored']}")

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python god_object_decomposer.py <directory> [output_dir]")
        sys.exit(1)

    directory = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    decomposer = GodObjectDecomposer()
    decomposer.process_directory(directory, output_dir)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Naming Standardization Analyzer for Phase 5 Day 9
Scans codebase for naming convention violations and creates standardization plan
"""

from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import ast
import hashlib
import json
import os
import re

from dataclasses import dataclass, asdict

@dataclass
class NamingViolation:
    """Represents a naming convention violation"""
    file_path: str
    line_number: int
    violation_type: str  # 'class', 'function', 'constant', 'variable'
    current_name: str
    suggested_name: str
    language: str  # 'python', 'javascript', 'typescript'
    context: str  # Additional context about the violation
    severity: str  # 'high', 'medium', 'low'

@dataclass
class RenamingMap:
    """Maps old names to new standardized names"""
    old_name: str
    new_name: str
    name_type: str
    language: str
    files_affected: List[str]
    backward_compatible: bool

class NamingStandardizationAnalyzer:
    """Analyzes codebase for naming convention violations"""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.violations: List[NamingViolation] = []
        self.renaming_map: List[RenamingMap] = []
        self.language_patterns = self._init_language_patterns()
        self.special_cases = self._init_special_cases()

    def _init_language_patterns(self) -> Dict:
        """Initialize regex patterns for different languages"""
        return {
            'python': {
                'class': re.compile(r'^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[\(:]'),
                'function': re.compile(r'^(?:\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\('),
                'constant': re.compile(r'^([A-Z][A-Z0-9_]*)\s*='),
                'camel_case': re.compile(r'^[a-z]+([A-Z][a-z]*)+$'),
                'snake_case': re.compile(r'^[a-z][a-z0-9_]*$'),
                'pascal_case': re.compile(r'^[A-Z][a-zA-Z0-9]*$'),
                'upper_snake': re.compile(r'^[A-Z][A-Z0-9_]*$')
            },
            'javascript': {
                'class': re.compile(r'^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[{]'),
                'function': re.compile(r'^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\('),
                'const': re.compile(r'^(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*='),
                'interface': re.compile(r'^(?:export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)'),
            }
        }

    def _init_special_cases(self) -> Dict:
        """Initialize special cases that should be preserved"""
        return {
            'nasa_terms': {'NASA', 'POT', 'DFARS', 'NIST', 'FIPS'},
            'common_abbreviations': {'API', 'HTTP', 'JSON', 'XML', 'URL', 'URI'},
            'third_party': {'jQuery', 'React', 'Angular', 'Vue'},
            'legacy_apis': set()  # To be populated during analysis
        }

    def analyze_codebase(self) -> Dict:
        """Main analysis method"""
        print("Starting naming standardization analysis...")

        # Scan Python files
        python_files = list(self.root_path.rglob("*.py"))
        print(f"Found {len(python_files)} Python files")

        for file_path in python_files:
            if self._should_skip_file(file_path):
                continue
            self._analyze_python_file(file_path)

        # Scan JavaScript/TypeScript files
        js_files = list(self.root_path.rglob("*.js")) + list(self.root_path.rglob("*.ts")) + list(self.root_path.rglob("*.tsx"))
        print(f"Found {len(js_files)} JavaScript/TypeScript files")

        for file_path in js_files:
            if self._should_skip_file(file_path):
                continue
            self._analyze_js_file(file_path)

        # Generate renaming map
        self._generate_renaming_map()

        # Create analysis report
        return self._create_report()

    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped during analysis"""
        skip_patterns = [
            '__pycache__', 'node_modules', '.git', 'dist', 'build',
            '--output-dir', '.pytest_cache', '.mypy_cache'
        ]

        for pattern in skip_patterns:
            if pattern in str(file_path):
                return True

        return False

    def _analyze_python_file(self, file_path: Path):
        """Analyze Python file for naming violations"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')

            # Analyze using AST for better accuracy
            try:
                tree = ast.parse(content)
                self._analyze_python_ast(tree, file_path, lines)
            except SyntaxError:
                # Fallback to regex analysis for files with syntax errors
                self._analyze_python_regex(lines, file_path)

        except (UnicodeDecodeError, IOError) as e:
            print(f"Warning: Could not read {file_path}: {e}")

    def _analyze_python_ast(self, tree: ast.AST, file_path: Path, lines: List[str]):
        """Analyze Python AST for naming violations"""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                self._check_python_class_name(node.name, file_path, node.lineno, lines)
            elif isinstance(node, ast.FunctionDef):
                self._check_python_function_name(node.name, file_path, node.lineno, lines)
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        self._check_python_constant_name(target.id, file_path, node.lineno, lines)

    def _analyze_python_regex(self, lines: List[str], file_path: Path):
        """Fallback regex analysis for Python files"""
        patterns = self.language_patterns['python']

        for i, line in enumerate(lines, 1):
            # Check class names
            class_match = patterns['class'].search(line)
            if class_match:
                self._check_python_class_name(class_match.group(1), file_path, i, lines)

            # Check function names
            func_match = patterns['function'].search(line)
            if func_match:
                self._check_python_function_name(func_match.group(1), file_path, i, lines)

            # Check constants
            const_match = patterns['constant'].search(line.strip())
            if const_match:
                self._check_python_constant_name(const_match.group(1), file_path, i, lines)

    def _check_python_class_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if Python class name follows PascalCase convention"""
        if not self.language_patterns['python']['pascal_case'].match(name):
            if name.startswith('_'):
                return  # Private classes can have different naming

            suggested_name = self._to_pascal_case(name)
            if suggested_name != name:
                violation = NamingViolation(
                    file_path=str(file_path),
                    line_number=line_num,
                    violation_type='class',
                    current_name=name,
                    suggested_name=suggested_name,
                    language='python',
                    context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                    severity=self._get_violation_severity(name, suggested_name)
                )
                self.violations.append(violation)

    def _check_python_function_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if Python function name follows snake_case convention"""
        if name.startswith('__') and name.endswith('__'):
            return  # Magic methods are exempt

        if self.language_patterns['python']['camel_case'].match(name):
            suggested_name = self._to_snake_case(name)
            violation = NamingViolation(
                file_path=str(file_path),
                line_number=line_num,
                violation_type='function',
                current_name=name,
                suggested_name=suggested_name,
                language='python',
                context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                severity=self._get_violation_severity(name, suggested_name)
            )
            self.violations.append(violation)

    def _check_python_constant_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if Python constant name follows UPPER_SNAKE_CASE convention"""
        # Only check variables that appear to be constants (all caps or mixed case)
        if name.isupper() or any(c.isupper() for c in name):
            if not self.language_patterns['python']['upper_snake'].match(name):
                suggested_name = self._to_upper_snake_case(name)
                if suggested_name != name:
                    violation = NamingViolation(
                        file_path=str(file_path),
                        line_number=line_num,
                        violation_type='constant',
                        current_name=name,
                        suggested_name=suggested_name,
                        language='python',
                        context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                        severity=self._get_violation_severity(name, suggested_name)
                    )
                    self.violations.append(violation)

    def _analyze_js_file(self, file_path: Path):
        """Analyze JavaScript/TypeScript file for naming violations"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')
            patterns = self.language_patterns['javascript']

            for i, line in enumerate(lines, 1):
                # Check class names
                class_match = patterns['class'].search(line)
                if class_match:
                    self._check_js_class_name(class_match.group(1), file_path, i, lines)

                # Check function names
                func_match = patterns['function'].search(line)
                if func_match:
                    self._check_js_function_name(func_match.group(1), file_path, i, lines)

                # Check interface names (TypeScript)
                if file_path.suffix in ['.ts', '.tsx']:
                    interface_match = patterns['interface'].search(line)
                    if interface_match:
                        self._check_js_interface_name(interface_match.group(1), file_path, i, lines)

        except (UnicodeDecodeError, IOError) as e:
            print(f"Warning: Could not read {file_path}: {e}")

    def _check_js_class_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if JavaScript class name follows PascalCase convention"""
        if not self.language_patterns['python']['pascal_case'].match(name):
            suggested_name = self._to_pascal_case(name)
            if suggested_name != name:
                violation = NamingViolation(
                    file_path=str(file_path),
                    line_number=line_num,
                    violation_type='class',
                    current_name=name,
                    suggested_name=suggested_name,
                    language='javascript',
                    context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                    severity=self._get_violation_severity(name, suggested_name)
                )
                self.violations.append(violation)

    def _check_js_function_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if JavaScript function name follows camelCase convention"""
        if name[0].isupper():  # Constructor functions should be PascalCase
            return

        if '_' in name and not name.isupper():  # Not a constant
            suggested_name = self._to_camel_case(name)
            violation = NamingViolation(
                file_path=str(file_path),
                line_number=line_num,
                violation_type='function',
                current_name=name,
                suggested_name=suggested_name,
                language='javascript',
                context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                severity=self._get_violation_severity(name, suggested_name)
            )
            self.violations.append(violation)

    def _check_js_interface_name(self, name: str, file_path: Path, line_num: int, lines: List[str]):
        """Check if TypeScript interface name follows naming convention"""
        # Allow both IPascalCase and PascalCase for interfaces
        if not (self.language_patterns['python']['pascal_case'].match(name) or
                (name.startswith('I') and self.language_patterns['python']['pascal_case'].match(name[1:]))):
            suggested_name = self._to_pascal_case(name)
            if suggested_name != name:
                violation = NamingViolation(
                    file_path=str(file_path),
                    line_number=line_num,
                    violation_type='interface',
                    current_name=name,
                    suggested_name=suggested_name,
                    language='typescript',
                    context=lines[line_num-1].strip() if line_num <= len(lines) else '',
                    severity=self._get_violation_severity(name, suggested_name)
                )
                self.violations.append(violation)

    def _to_pascal_case(self, name: str) -> str:
        """Convert name to PascalCase"""
        if '_' in name:
            words = name.split('_')
            return ''.join(word.capitalize() for word in words if word)
        elif name.islower():
            return name.capitalize()
        return name

    def _to_snake_case(self, name: str) -> str:
        """Convert camelCase to snake_case"""
        result = re.sub(r'([A-Z])', r'_\1', name).lower()
        return result.lstrip('_')

    def _to_camel_case(self, name: str) -> str:
        """Convert snake_case to camelCase"""
        if '_' not in name:
            return name

        words = name.split('_')
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:] if word)

    def _to_upper_snake_case(self, name: str) -> str:
        """Convert name to UPPER_SNAKE_CASE"""
        if '_' in name:
            return name.upper()

        # Convert camelCase to UPPER_SNAKE_CASE
        result = re.sub(r'([A-Z])', r'_\1', name).upper()
        return result.lstrip('_')

    def _get_violation_severity(self, current: str, suggested: str) -> str:
        """Determine severity of naming violation"""
        if current in self.special_cases['nasa_terms'] or current in self.special_cases['common_abbreviations']:
            return 'low'

        if len(current) <= 3:  # Short names might be intentional
            return 'low'

        if current.lower() == suggested.lower():  # Only case difference
            return 'medium'

        return 'high'

    def _generate_renaming_map(self):
        """Generate comprehensive renaming map from violations"""
        name_usage = defaultdict(list)

        # Group violations by name
        for violation in self.violations:
            name_usage[violation.current_name].append(violation)

        # Create renaming map entries
        for name, violations in name_usage.items():
            if not violations:
                continue

            # Use most common suggested name
            suggested_names = [v.suggested_name for v in violations]
            suggested_name = max(set(suggested_names), key=suggested_names.count)

            files_affected = list(set(v.file_path for v in violations))
            language = violations[0].language
            name_type = violations[0].violation_type

            # Determine if backward compatibility is needed
            backward_compatible = self._needs_backward_compatibility(name, files_affected)

            renaming = RenamingMap(
                old_name=name,
                new_name=suggested_name,
                name_type=name_type,
                language=language,
                files_affected=files_affected,
                backward_compatible=backward_compatible
            )

            self.renaming_map.append(renaming)

    def _needs_backward_compatibility(self, name: str, files: List[str]) -> bool:
        """Determine if renaming needs backward compatibility layer"""
        # Check if name appears to be part of public API
        public_indicators = ['api', 'interface', 'service', 'controller', 'facade']

        for indicator in public_indicators:
            if indicator in name.lower():
                return True

        # Check if used across many files (likely public)
        if len(files) > 5:
            return True

        return False

    def _create_report(self) -> Dict:
        """Create comprehensive analysis report"""
        violations_by_type = defaultdict(int)
        violations_by_language = defaultdict(int)
        violations_by_severity = defaultdict(int)

        for violation in self.violations:
            violations_by_type[violation.violation_type] += 1
            violations_by_language[violation.language] += 1
            violations_by_severity[violation.severity] += 1

        return {
            'summary': {
                'total_violations': len(self.violations),
                'total_renamings': len(self.renaming_map),
                'files_affected': len(set(v.file_path for v in self.violations)),
                'backward_compatible_items': len([r for r in self.renaming_map if r.backward_compatible])
            },
            'violations_by_type': dict(violations_by_type),
            'violations_by_language': dict(violations_by_language),
            'violations_by_severity': dict(violations_by_severity),
            'violations': [asdict(v) for v in self.violations],
            'renaming_map': [asdict(r) for r in self.renaming_map]
        }

    def save_report(self, output_path: str):
        """Save analysis report to JSON file"""
        report = self._create_report()

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"Naming standardization report saved to: {output_path}")
        return report

def main():
    """Main execution function"""
    analyzer = NamingStandardizationAnalyzer('.')
    report = analyzer.analyze_codebase()

    # Save report
    analyzer.save_report('docs/naming_standardization_report.json')

    # Print summary
    print("\n=== NAMING STANDARDIZATION ANALYSIS SUMMARY ===")
    print(f"Total violations found: {report['summary']['total_violations']}")
    print(f"Files affected: {report['summary']['files_affected']}")
    print(f"Renaming operations needed: {report['summary']['total_renamings']}")
    print(f"Backward compatible items: {report['summary']['backward_compatible_items']}")

    print("\nViolations by type:")
    for vtype, count in report['violations_by_type'].items():
        print(f"  {vtype}: {count}")

    print("\nViolations by language:")
    for lang, count in report['violations_by_language'].items():
        print(f"  {lang}: {count}")

    print("\nViolations by severity:")
    for severity, count in report['violations_by_severity'].items():
        print(f"  {severity}: {count}")

if __name__ == "__main__":
    main()
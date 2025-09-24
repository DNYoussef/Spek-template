# Architecture Enhancement Specification
## Assertion Injection & Refactoring Framework

**Document Version:** 1.0
**Target Implementation:** 5-6 weeks
**Status:** Design Phase
**Author:** System Architecture Team

---

## Executive Summary

This specification defines a comprehensive framework for automated assertion injection and systematic refactoring to address:

- **1,312+ Auto-fixable violations** (NASA POT10 Rule 4 - Assertion Requirements)
- **137 Rule 1 violations** (Function Complexity - McCabe > 15)
- **55 Rule 2 violations** (Control Flow Recursion)
- **24 God Object patterns** requiring decomposition
- **3 Circular dependencies** requiring architectural refactoring

**Current Baseline:**
- 3,250 functions across 580 classes
- 485 existing assertions (14.9% coverage)
- Multiple high-complexity functions (50-756 AST nodes)
- Significant technical debt in `analysis_orchestrator.py`, `component_integrator.py`, `comprehensive_analysis_engine.py`

**Target Goals:**
- 95%+ assertion coverage with production-safe contracts
- <50 AST nodes per function (Extract Method pattern)
- Zero circular dependencies
- <10 responsibilities per class (SRP compliance)
- Automated quality gates in CI/CD

---

## 1. Assertion Injection Framework

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Assertion Injection Pipeline              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────┐             │
│  │ AST Parser   │───→│ Violation    │             │
│  │ & Analyzer   │    │ Detector     │             │
│  └──────────────┘    └──────────────┘             │
│         │                    │                      │
│         ▼                    ▼                      │
│  ┌──────────────┐    ┌──────────────┐             │
│  │ Template     │    │ Smart        │             │
│  │ Matcher      │───→│ Injector     │             │
│  └──────────────┘    └──────────────┘             │
│                             │                       │
│                             ▼                       │
│                      ┌──────────────┐              │
│                      │ Validation   │              │
│                      │ & Dry-run    │              │
│                      └──────────────┘              │
│                             │                       │
│                             ▼                       │
│                      ┌──────────────┐              │
│                      │ Code Writer  │              │
│                      │ (AST-based)  │              │
│                      └──────────────┘              │
└─────────────────────────────────────────────────────┘
```

### 1.2 Production-Safe Assertion Libraries

#### Priority 1: icontract (Design-by-Contract)
**Why:** Pythonic, zero runtime overhead when disabled, supports inheritance

```python
from icontract import require, ensure, invariant, DBC

class EnhancedAnalyzer:
    @require(lambda path: path is not None and len(path) > 0, "Path must be non-empty")
    @require(lambda path: Path(path).exists(), "Path must exist")
    @ensure(lambda result: result is not None, "Result cannot be None")
    @ensure(lambda result: len(result.violations) >= 0, "Violations list valid")
    def analyze_file(self, path: str) -> AnalysisResult:
        # Implementation
        pass
```

**Advantages:**
- Explicit contract documentation
- Can be disabled in production (`icontract.set_enabled(False)`)
- Inheritance-aware (contracts propagate to subclasses)
- Rich error messages with lambda introspection

#### Priority 2: Pydantic (Data Validation)
**Why:** Runtime type checking, automatic validation, JSON schema generation

```python
from pydantic import BaseModel, Field, validator

class AnalysisConfig(BaseModel):
    target_path: str = Field(..., min_length=1, description="Analysis target")
    max_complexity: int = Field(15, ge=1, le=100, description="McCabe threshold")
    enable_nasa: bool = Field(True, description="Enable NASA POT10 checks")

    @validator('target_path')
    def path_must_exist(cls, v):
        if not Path(v).exists():
            raise ValueError(f'Path does not exist: {v}')
        return v
```

**Advantages:**
- Automatic type coercion
- JSON/dict serialization
- FastAPI integration for API contracts
- Rich validation rules

#### Priority 3: Beartype (Zero-Overhead Type Checking)
**Why:** O(1) runtime cost, decorator-based, PEP 484 compliant

```python
from beartype import beartype
from typing import List, Optional

@beartype
def detect_violations(
    files: List[str],
    threshold: int,
    config: Optional[AnalysisConfig] = None
) -> List[Violation]:
    # Implementation with automatic type checking
    pass
```

**Advantages:**
- Zero configuration
- Works with existing type hints
- Minimal runtime overhead
- Compatible with mypy/pyright

### 1.3 Automated Injection Strategy

#### Phase 1: AST-Based Analysis (Week 1)
```python
# File: analyzer/assertion_injector/ast_analyzer.py

import ast
from typing import List, Dict, Set
from dataclasses import dataclass

@dataclass
class InjectionPoint:
    function_name: str
    line_number: int
    assertion_type: str  # 'precondition', 'postcondition', 'invariant'
    template_id: str
    parameters: Dict[str, any]

class AssertionAnalyzer(ast.NodeVisitor):
    """Identifies optimal injection points for assertions."""

    def __init__(self):
        self.injection_points: List[InjectionPoint] = []
        self.current_function = None
        self.parameter_checks: Set[str] = set()

    def visit_FunctionDef(self, node: ast.FunctionDef):
        """Analyze function for assertion needs."""
        self.current_function = node.name

        # Detect missing parameter validation
        for arg in node.args.args:
            if not self._has_parameter_check(node, arg.arg):
                self.injection_points.append(InjectionPoint(
                    function_name=node.name,
                    line_number=node.lineno + 1,  # After def line
                    assertion_type='precondition',
                    template_id='param_not_none',
                    parameters={'param_name': arg.arg}
                ))

        # Detect missing return value validation
        if self._has_return_statement(node) and not self._has_return_check(node):
            self.injection_points.append(InjectionPoint(
                function_name=node.name,
                line_number=self._get_last_line(node),
                assertion_type='postcondition',
                template_id='result_not_none',
                parameters={'function_name': node.name}
            ))

        self.generic_visit(node)

    def _has_parameter_check(self, node: ast.FunctionDef, param: str) -> bool:
        """Check if parameter validation exists."""
        for child in ast.walk(node):
            if isinstance(child, ast.Assert):
                if param in ast.unparse(child.test):
                    return True
            # Check for if param is None: raise
            if isinstance(child, ast.If):
                test_str = ast.unparse(child.test)
                if param in test_str and 'None' in test_str:
                    return True
        return False
```

#### Phase 2: Template Library (Week 1-2)
```python
# File: analyzer/assertion_injector/templates.py

from typing import Dict, Callable
from dataclasses import dataclass

@dataclass
class AssertionTemplate:
    id: str
    description: str
    library: str  # 'icontract', 'pydantic', 'beartype'
    generator: Callable
    test_generator: Callable

class TemplateLibrary:
    """Production-safe assertion templates."""

    TEMPLATES = {
        'param_not_none': AssertionTemplate(
            id='param_not_none',
            description='Ensure parameter is not None',
            library='icontract',
            generator=lambda param: f"@require(lambda {param}: {param} is not None, '{param} cannot be None')",
            test_generator=lambda param: f"with pytest.raises(ViolationError): func({param}=None)"
        ),

        'param_type_check': AssertionTemplate(
            id='param_type_check',
            description='Validate parameter type',
            library='beartype',
            generator=lambda param, type_: f"@beartype  # {param}: {type_}",
            test_generator=lambda param, type_: f"with pytest.raises(BeartypeException): func({param}='wrong_type')"
        ),

        'list_not_empty': AssertionTemplate(
            id='list_not_empty',
            description='Ensure list parameter is not empty',
            library='icontract',
            generator=lambda param: f"@require(lambda {param}: len({param}) > 0, '{param} must not be empty')",
            test_generator=lambda param: f"with pytest.raises(ViolationError): func({param}=[])"
        ),

        'result_not_none': AssertionTemplate(
            id='result_not_none',
            description='Ensure return value is not None',
            library='icontract',
            generator=lambda: "@ensure(lambda result: result is not None, 'Result cannot be None')",
            test_generator=lambda: "assert func() is not None"
        ),

        'result_type': AssertionTemplate(
            id='result_type',
            description='Validate return type',
            library='beartype',
            generator=lambda type_: f"-> {type_}:  # beartype validated",
            test_generator=lambda type_: f"assert isinstance(func(), {type_})"
        ),

        'invariant_positive': AssertionTemplate(
            id='invariant_positive',
            description='Ensure value remains positive',
            library='icontract',
            generator=lambda attr: f"@invariant(lambda self: self.{attr} > 0, '{attr} must be positive')",
            test_generator=lambda attr: f"obj.{attr} = -1  # Should raise ViolationError"
        ),

        'path_exists': AssertionTemplate(
            id='path_exists',
            description='Validate file path exists',
            library='icontract',
            generator=lambda param: f"@require(lambda {param}: Path({param}).exists(), 'Path must exist: {{{param}}}')",
            test_generator=lambda param: f"with pytest.raises(ViolationError): func({param}='/nonexistent')"
        ),

        'dict_has_key': AssertionTemplate(
            id='dict_has_key',
            description='Ensure dictionary contains required key',
            library='icontract',
            generator=lambda param, key: f"@require(lambda {param}: '{key}' in {param}, 'Missing required key: {key}')",
            test_generator=lambda param, key: f"with pytest.raises(ViolationError): func({param}={{}})"
        ),
    }

    @classmethod
    def get_template(cls, template_id: str) -> AssertionTemplate:
        """Retrieve template by ID."""
        return cls.TEMPLATES.get(template_id)

    @classmethod
    def generate_assertion(cls, template_id: str, **params) -> str:
        """Generate assertion code from template."""
        template = cls.get_template(template_id)
        if not template:
            raise ValueError(f"Unknown template: {template_id}")
        return template.generator(**params)

    @classmethod
    def generate_test(cls, template_id: str, **params) -> str:
        """Generate test code for assertion."""
        template = cls.get_template(template_id)
        if not template:
            raise ValueError(f"Unknown template: {template_id}")
        return template.test_generator(**params)
```

#### Phase 3: Smart Injector (Week 2-3)
```python
# File: analyzer/assertion_injector/injector.py

import ast
import astor
from pathlib import Path
from typing import List, Optional

class SmartInjector:
    """Injects assertions while preserving code structure."""

    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.changes: List[Dict] = []

    def inject_assertions(
        self,
        file_path: str,
        injection_points: List[InjectionPoint]
    ) -> Dict:
        """
        Inject assertions at specified points.

        Returns:
            Dict with 'success', 'changes', 'original_code', 'new_code'
        """
        with open(file_path, 'r') as f:
            original_code = f.read()

        tree = ast.parse(original_code)
        transformer = AssertionTransformer(injection_points)
        new_tree = transformer.visit(tree)

        # Fix missing locations
        ast.fix_missing_locations(new_tree)

        # Generate new code
        new_code = astor.to_source(new_tree)

        # Add necessary imports
        new_code = self._add_imports(new_code, injection_points)

        result = {
            'success': True,
            'file_path': file_path,
            'changes': transformer.changes,
            'original_code': original_code,
            'new_code': new_code,
            'dry_run': self.dry_run
        }

        if not self.dry_run:
            # Write changes
            with open(file_path, 'w') as f:
                f.write(new_code)

        self.changes.append(result)
        return result

    def _add_imports(self, code: str, injection_points: List[InjectionPoint]) -> str:
        """Add required imports based on templates used."""
        libraries_used = set()
        for point in injection_points:
            template = TemplateLibrary.get_template(point.template_id)
            libraries_used.add(template.library)

        imports = []
        if 'icontract' in libraries_used:
            imports.append("from icontract import require, ensure, invariant")
        if 'beartype' in libraries_used:
            imports.append("from beartype import beartype")
        if 'pydantic' in libraries_used:
            imports.append("from pydantic import BaseModel, Field, validator")

        if imports:
            import_block = '\n'.join(imports) + '\n\n'
            return import_block + code
        return code

class AssertionTransformer(ast.NodeTransformer):
    """AST transformer that injects assertions."""

    def __init__(self, injection_points: List[InjectionPoint]):
        self.injection_points = injection_points
        self.changes: List[Dict] = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        """Inject assertions into function definitions."""
        # Find injection points for this function
        points = [p for p in self.injection_points if p.function_name == node.name]

        for point in points:
            assertion_code = TemplateLibrary.generate_assertion(
                point.template_id,
                **point.parameters
            )

            if point.assertion_type == 'precondition':
                # Add as decorator
                decorator = ast.parse(assertion_code).body[0].value
                node.decorator_list.insert(0, decorator)

                self.changes.append({
                    'type': 'precondition',
                    'function': node.name,
                    'line': point.line_number,
                    'code': assertion_code
                })

            elif point.assertion_type == 'postcondition':
                # Add as decorator
                decorator = ast.parse(assertion_code).body[0].value
                node.decorator_list.append(decorator)

                self.changes.append({
                    'type': 'postcondition',
                    'function': node.name,
                    'line': point.line_number,
                    'code': assertion_code
                })

        self.generic_visit(node)
        return node
```

### 1.4 Validation & Quality Gates

#### Dry-Run Mode
```python
# File: analyzer/assertion_injector/validator.py

class AssertionValidator:
    """Validates assertion injection safety."""

    def validate_injection(self, result: Dict) -> Dict:
        """
        Validate that injected assertions are safe.

        Checks:
        - Code still parses
        - No syntax errors
        - Imports resolve
        - Assertions are reachable
        """
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        # Parse check
        try:
            ast.parse(result['new_code'])
        except SyntaxError as e:
            validation_result['valid'] = False
            validation_result['errors'].append(f"Syntax error: {e}")
            return validation_result

        # Import check
        try:
            self._check_imports(result['new_code'])
        except ImportError as e:
            validation_result['warnings'].append(f"Import warning: {e}")

        # Reachability check
        unreachable = self._check_reachability(result['new_code'])
        if unreachable:
            validation_result['warnings'].extend([
                f"Unreachable assertion at line {line}" for line in unreachable
            ])

        return validation_result

    def _check_imports(self, code: str):
        """Verify all imports can be resolved."""
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                # Try to import (in isolated namespace)
                pass  # Implementation

    def _check_reachability(self, code: str) -> List[int]:
        """Check for unreachable assertions (e.g., after return)."""
        unreachable = []
        tree = ast.parse(code)

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                has_return = False
                for child in ast.walk(node):
                    if isinstance(child, ast.Return):
                        has_return = True
                    elif has_return and isinstance(child, ast.Assert):
                        unreachable.append(child.lineno)

        return unreachable
```

---

## 2. Complexity Reduction Framework

### 2.1 Extract Method Pattern

#### Automated Extraction Strategy
```python
# File: analyzer/refactoring/extract_method.py

from typing import List, Dict, Tuple
import ast

class MethodExtractor:
    """Automatically extract methods to reduce complexity."""

    def __init__(self, complexity_threshold: int = 50):
        self.threshold = complexity_threshold

    def analyze_function(self, node: ast.FunctionDef) -> List[Dict]:
        """
        Analyze function and suggest method extractions.

        Returns:
            List of extraction opportunities with:
            - target_lines: (start, end)
            - extracted_name: suggested method name
            - parameters: required parameters
            - returns: return values
            - complexity_reduction: estimated reduction
        """
        complexity = self._calculate_complexity(node)

        if complexity <= self.threshold:
            return []

        # Identify extractable blocks
        opportunities = []

        # 1. Extract loops
        for loop_node in self._find_loops(node):
            opportunities.append(self._create_loop_extraction(loop_node, node))

        # 2. Extract conditional blocks
        for if_node in self._find_complex_conditionals(node):
            opportunities.append(self._create_conditional_extraction(if_node, node))

        # 3. Extract try-except blocks
        for try_node in self._find_try_blocks(node):
            opportunities.append(self._create_exception_extraction(try_node, node))

        return opportunities

    def _create_loop_extraction(
        self,
        loop_node: ast.AST,
        parent: ast.FunctionDef
    ) -> Dict:
        """Create extraction plan for loop."""
        # Analyze loop dependencies
        loop_vars = self._get_loop_variables(loop_node)
        external_vars = self._get_external_variables(loop_node, parent)

        return {
            'type': 'loop_extraction',
            'target_lines': (loop_node.lineno, self._get_last_line(loop_node)),
            'extracted_name': f"_process_{loop_vars[0] if loop_vars else 'items'}",
            'parameters': list(external_vars),
            'returns': self._infer_return_values(loop_node),
            'complexity_reduction': self._calculate_complexity(loop_node)
        }

    def apply_extraction(
        self,
        file_path: str,
        extraction: Dict
    ) -> str:
        """Apply method extraction to file."""
        with open(file_path, 'r') as f:
            lines = f.readlines()

        # Extract target lines
        start, end = extraction['target_lines']
        extracted_lines = lines[start-1:end]

        # Generate new method
        new_method = self._generate_method(
            extraction['extracted_name'],
            extraction['parameters'],
            extracted_lines,
            extraction['returns']
        )

        # Replace with method call
        call_line = self._generate_method_call(
            extraction['extracted_name'],
            extraction['parameters'],
            extraction['returns']
        )

        # Reconstruct file
        new_lines = (
            lines[:start-1] +
            [call_line] +
            lines[end:] +
            ['\n'] +
            new_method
        )

        return ''.join(new_lines)

    def _generate_method(
        self,
        name: str,
        params: List[str],
        body_lines: List[str],
        returns: List[str]
    ) -> List[str]:
        """Generate extracted method code."""
        method_lines = []

        # Method signature
        param_str = ', '.join(params)
        return_annotation = f" -> {returns[0]}" if returns else ""
        method_lines.append(f"    def {name}(self, {param_str}){return_annotation}:\n")
        method_lines.append(f'        """{name.replace("_", " ").title()}."""\n')

        # Method body (indented)
        for line in body_lines:
            method_lines.append(f"    {line}")

        # Return statement
        if returns:
            method_lines.append(f"        return {', '.join(returns)}\n")

        return method_lines

    def _calculate_complexity(self, node: ast.AST) -> int:
        """Calculate McCabe complexity."""
        complexity = 1  # Base complexity

        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1

        return complexity
```

### 2.2 God Object Decomposition

Current god objects identified:
1. `ComprehensiveAnalysisEngine` (756 nodes in `initialize()`)
2. `ComponentIntegrator` (520-567 nodes in `initialize()`)
3. `AnalysisOrchestrator` (330 nodes in `_get_detector_class()`)
4. `ContextAnalyzer` (673 nodes in `_classify_class_context()`)

#### Decomposition Strategy
```python
# File: analyzer/refactoring/god_object_decomposition.py

from dataclasses import dataclass
from typing import List, Dict

@dataclass
class ResponsibilityCluster:
    """Represents a cohesive group of responsibilities."""
    name: str
    methods: List[str]
    attributes: List[str]
    dependencies: List[str]
    cohesion_score: float

class GodObjectDecomposer:
    """Decompose god objects into focused classes."""

    def analyze_class(self, class_node: ast.ClassDef) -> List[ResponsibilityCluster]:
        """
        Analyze class and identify responsibility clusters.

        Uses:
        - Method call graph analysis
        - Attribute usage patterns
        - Naming patterns (prefixes like _validate_, _process_)
        """
        methods = self._extract_methods(class_node)
        attributes = self._extract_attributes(class_node)

        # Build method-attribute usage matrix
        usage_matrix = self._build_usage_matrix(methods, attributes)

        # Cluster analysis
        clusters = self._cluster_responsibilities(usage_matrix, methods)

        return clusters

    def _cluster_responsibilities(
        self,
        usage_matrix: Dict,
        methods: List[ast.FunctionDef]
    ) -> List[ResponsibilityCluster]:
        """Cluster methods by responsibility using graph analysis."""
        clusters = []

        # Group by naming patterns first
        prefix_groups = self._group_by_prefix(methods)

        for prefix, method_group in prefix_groups.items():
            # Calculate cohesion
            shared_attrs = self._get_shared_attributes(method_group, usage_matrix)
            cohesion = len(shared_attrs) / max(len(method_group), 1)

            clusters.append(ResponsibilityCluster(
                name=f"{prefix.capitalize()}Handler",
                methods=[m.name for m in method_group],
                attributes=shared_attrs,
                dependencies=self._find_dependencies(method_group),
                cohesion_score=cohesion
            ))

        return clusters

    def generate_decomposition_plan(
        self,
        class_name: str,
        clusters: List[ResponsibilityCluster]
    ) -> Dict:
        """
        Generate step-by-step decomposition plan.

        Example for ComprehensiveAnalysisEngine:
        - SyntaxAnalyzer: _analyze_python_syntax, _analyze_javascript_syntax
        - PatternDetector: detect_patterns, _detect_*_patterns
        - ReportGenerator: generate_report, _generate_*_report
        - ComplianceValidator: validate_compliance, _validate_*
        - PerformanceOptimizer: optimize_performance, _optimize_*
        """
        plan = {
            'original_class': class_name,
            'new_classes': [],
            'facade_class': f"{class_name}Facade",
            'migration_steps': []
        }

        for cluster in clusters:
            # Create new class specification
            new_class = {
                'name': cluster.name,
                'methods': cluster.methods,
                'attributes': cluster.attributes,
                'dependencies': cluster.dependencies
            }
            plan['new_classes'].append(new_class)

            # Add migration step
            plan['migration_steps'].append({
                'step': len(plan['migration_steps']) + 1,
                'action': f"Extract {cluster.name}",
                'methods_moved': cluster.methods,
                'test_strategy': f"Verify {cluster.name} isolation"
            })

        # Add facade creation step
        plan['migration_steps'].append({
            'step': len(plan['migration_steps']) + 1,
            'action': f"Create {plan['facade_class']}",
            'purpose': "Maintain backward compatibility",
            'delegates_to': [nc['name'] for nc in plan['new_classes']]
        })

        return plan

    def _group_by_prefix(self, methods: List[ast.FunctionDef]) -> Dict[str, List]:
        """Group methods by common prefixes."""
        groups = {}
        for method in methods:
            # Extract prefix (e.g., _analyze, _generate, _validate)
            parts = method.name.split('_')
            prefix = parts[1] if len(parts) > 1 and parts[0] == '' else parts[0]

            if prefix not in groups:
                groups[prefix] = []
            groups[prefix].append(method)

        return groups
```

#### Example Decomposition: ComprehensiveAnalysisEngine

**Before (God Object):**
```python
class ComprehensiveAnalysisEngine:
    def __init__(self):  # 57 nodes
        # Massive initialization

    def analyze_syntax(self, code, lang):  # 243 nodes
        # Handles Python, JS, C, Generic

    def detect_patterns(self, code):  # 175 nodes
        # Multiple pattern types

    def generate_report(self, results, format):  # 156 nodes
        # JSON, HTML, MD, XML

    def validate_compliance(self, code, standard):  # 270 nodes
        # NASA POT10, MISRA, etc.

    def optimize_performance(self, code):  # 213 nodes
        # Multiple optimization strategies
```

**After (Decomposed):**
```python
# File: analyzer/engines/syntax_analyzer.py
class SyntaxAnalyzer:
    """Dedicated syntax analysis for multiple languages."""

    @beartype
    def analyze(self, code: str, language: str) -> SyntaxResult:
        analyzer = self._get_language_analyzer(language)
        return analyzer.analyze(code)

    def _get_language_analyzer(self, language: str):
        return self.analyzers.get(language, GenericAnalyzer())

# File: analyzer/engines/pattern_detector.py
class PatternDetector:
    """Focused pattern detection engine."""

    @require(lambda code: code is not None)
    @ensure(lambda result: result is not None)
    def detect_patterns(self, code: str) -> List[Pattern]:
        # Focused implementation
        pass

# File: analyzer/engines/report_generator.py
class ReportGenerator:
    """Multi-format report generation."""

    def generate(self, results: AnalysisResult, format: str) -> str:
        generator = self._get_generator(format)
        return generator.generate(results)

# File: analyzer/engines/compliance_validator.py
class ComplianceValidator:
    """Standards compliance validation."""

    def validate(self, code: str, standard: str) -> ComplianceResult:
        validator = self.validators[standard]
        return validator.validate(code)

# File: analyzer/engines/performance_optimizer.py
class PerformanceOptimizer:
    """Code performance optimization."""

    def optimize(self, code: str) -> OptimizationResult:
        # Focused optimization logic
        pass

# File: analyzer/comprehensive_analysis_engine.py (Facade)
class ComprehensiveAnalysisEngine:
    """Facade maintaining backward compatibility."""

    def __init__(self):
        self.syntax = SyntaxAnalyzer()
        self.patterns = PatternDetector()
        self.reports = ReportGenerator()
        self.compliance = ComplianceValidator()
        self.optimizer = PerformanceOptimizer()

    def analyze_syntax(self, code, lang):
        return self.syntax.analyze(code, lang)

    def detect_patterns(self, code):
        return self.patterns.detect_patterns(code)

    def generate_report(self, results, format):
        return self.reports.generate(results, format)

    def validate_compliance(self, code, standard):
        return self.compliance.validate(code, standard)

    def optimize_performance(self, code):
        return self.optimizer.optimize(code)
```

---

## 3. Dependency Breaking Strategy

### 3.1 Circular Dependency Analysis

**Current Issues:**
- 3 circular dependencies identified in architectural map
- Tight coupling between analyzer modules
- Import cycles causing initialization issues

#### Detection & Visualization
```python
# File: analyzer/refactoring/dependency_analyzer.py

import ast
from typing import Dict, List, Set, Tuple
from collections import defaultdict
import networkx as nx

class DependencyAnalyzer:
    """Analyze and break circular dependencies."""

    def __init__(self):
        self.dependency_graph = nx.DiGraph()
        self.imports: Dict[str, Set[str]] = defaultdict(set)

    def analyze_project(self, root_path: str) -> Dict:
        """
        Build dependency graph and identify cycles.

        Returns:
            {
                'cycles': List of circular dependency chains,
                'graph': NetworkX graph object,
                'metrics': {
                    'total_modules': int,
                    'total_edges': int,
                    'cycle_count': int,
                    'max_cycle_length': int
                }
            }
        """
        # Build graph
        for py_file in Path(root_path).rglob('*.py'):
            self._analyze_imports(py_file)

        # Detect cycles
        cycles = list(nx.simple_cycles(self.dependency_graph))

        return {
            'cycles': cycles,
            'graph': self.dependency_graph,
            'metrics': {
                'total_modules': self.dependency_graph.number_of_nodes(),
                'total_edges': self.dependency_graph.number_of_edges(),
                'cycle_count': len(cycles),
                'max_cycle_length': max([len(c) for c in cycles], default=0)
            }
        }

    def _analyze_imports(self, file_path: Path):
        """Extract import statements from file."""
        with open(file_path, 'r') as f:
            try:
                tree = ast.parse(f.read())
            except SyntaxError:
                return

        module_name = self._get_module_name(file_path)

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self.imports[module_name].add(alias.name)
                    self.dependency_graph.add_edge(module_name, alias.name)

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self.imports[module_name].add(node.module)
                    self.dependency_graph.add_edge(module_name, node.module)

    def suggest_break_strategies(self, cycle: List[str]) -> List[Dict]:
        """
        Suggest strategies to break a dependency cycle.

        Strategies:
        1. Dependency Injection
        2. Interface/ABC extraction
        3. Event-based decoupling
        4. Facade pattern
        5. Move common code to shared module
        """
        strategies = []

        # Analyze cycle to find weakest link
        weakest_link = self._find_weakest_dependency(cycle)

        # Strategy 1: Dependency Injection
        strategies.append({
            'strategy': 'Dependency Injection',
            'target_edge': weakest_link,
            'description': f"Inject {weakest_link[1]} into {weakest_link[0]} via constructor",
            'code_example': self._generate_di_example(weakest_link),
            'effort': 'Low',
            'risk': 'Low'
        })

        # Strategy 2: Interface Extraction
        common_interface = self._find_common_interface(cycle)
        if common_interface:
            strategies.append({
                'strategy': 'Interface Extraction',
                'target': common_interface,
                'description': f"Extract {common_interface} to ABC",
                'code_example': self._generate_interface_example(common_interface),
                'effort': 'Medium',
                'risk': 'Low'
            })

        return strategies

    def _find_weakest_dependency(self, cycle: List[str]) -> Tuple[str, str]:
        """
        Find the weakest dependency in cycle.

        Weakness factors:
        - Fewest import statements
        - Latest in initialization order
        - Least complex dependency
        """
        min_imports = float('inf')
        weakest = None

        for i in range(len(cycle)):
            from_module = cycle[i]
            to_module = cycle[(i + 1) % len(cycle)]

            # Count how many symbols are imported
            import_count = len(self._get_imported_symbols(from_module, to_module))

            if import_count < min_imports:
                min_imports = import_count
                weakest = (from_module, to_module)

        return weakest

    def _generate_di_example(self, edge: Tuple[str, str]) -> str:
        """Generate Dependency Injection code example."""
        from_module, to_module = edge

        return f"""
# Before (circular dependency):
# {from_module}.py
from {to_module} import TargetClass

class MyClass:
    def __init__(self):
        self.target = TargetClass()  # Direct dependency

# After (dependency injection):
# {from_module}.py
from typing import Protocol

class TargetProtocol(Protocol):
    '''Interface for target dependency.'''
    def required_method(self): ...

class MyClass:
    def __init__(self, target: TargetProtocol):
        self.target = target  # Injected dependency

# main.py (composition root)
from {from_module} import MyClass
from {to_module} import TargetClass

my_instance = MyClass(target=TargetClass())
"""
```

### 3.2 Interface/Adapter Pattern Implementation

```python
# File: analyzer/refactoring/interface_extractor.py

from abc import ABC, abstractmethod
from typing import List, Dict
import ast

class InterfaceExtractor:
    """Extract interfaces to break coupling."""

    def extract_interface(self, class_node: ast.ClassDef) -> str:
        """
        Generate ABC interface from concrete class.

        Extracts:
        - Public methods (not starting with _)
        - Method signatures
        - Docstrings
        """
        interface_code = []

        # Interface header
        interface_code.append(f"class {class_node.name}Protocol(Protocol):")
        interface_code.append(f'    """{class_node.name} interface."""\n')

        # Extract public methods
        for node in class_node.body:
            if isinstance(node, ast.FunctionDef) and not node.name.startswith('_'):
                # Method signature
                args = self._format_args(node.args)
                returns = self._format_returns(node.returns)

                interface_code.append(f"    def {node.name}({args}){returns}:")

                # Docstring
                docstring = ast.get_docstring(node)
                if docstring:
                    interface_code.append(f'        """{docstring}"""')

                interface_code.append("        ...\n")

        return '\n'.join(interface_code)

    def generate_adapter(
        self,
        interface_name: str,
        concrete_class: str
    ) -> str:
        """Generate adapter class for interface."""
        return f"""
from typing import Protocol
from {concrete_class} import {concrete_class.split('.')[-1]}

class {interface_name}Adapter:
    '''Adapter for {concrete_class}.'''

    def __init__(self, adaptee: {concrete_class.split('.')[-1]}):
        self._adaptee = adaptee

    def __getattr__(self, name):
        '''Delegate to adaptee.'''
        return getattr(self._adaptee, name)
"""
```

---

## 4. Quality Gate Integration

### 4.1 Pre-Commit Hooks

```bash
# File: .pre-commit-config.yaml

repos:
  - repo: local
    hooks:
      - id: assertion-coverage
        name: Assertion Coverage Check
        entry: python analyzer/quality_gates/assertion_coverage.py
        language: python
        pass_filenames: false
        always_run: true

      - id: complexity-check
        name: Complexity Threshold
        entry: python analyzer/quality_gates/complexity_check.py
        language: python
        args: ['--threshold=50']
        pass_filenames: false

      - id: god-object-check
        name: God Object Detection
        entry: python analyzer/quality_gates/god_object_check.py
        language: python
        args: ['--max-methods=20', '--max-loc=300']
        pass_filenames: false

      - id: circular-dependency-check
        name: Circular Dependency Check
        entry: python analyzer/quality_gates/circular_dep_check.py
        language: python
        pass_filenames: false
```

```python
# File: analyzer/quality_gates/assertion_coverage.py

import sys
from pathlib import Path
from assertion_injector.ast_analyzer import AssertionAnalyzer

def check_assertion_coverage(threshold: float = 0.95) -> bool:
    """
    Check if assertion coverage meets threshold.

    Returns:
        True if coverage >= threshold, False otherwise
    """
    total_functions = 0
    functions_with_assertions = 0

    analyzer = AssertionAnalyzer()

    for py_file in Path('analyzer').rglob('*.py'):
        with open(py_file) as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                total_functions += 1

                # Check for assertions (icontract decorators, asserts, validators)
                if analyzer.has_assertions(node):
                    functions_with_assertions += 1

    coverage = functions_with_assertions / total_functions if total_functions > 0 else 0

    print(f"Assertion Coverage: {coverage:.1%} ({functions_with_assertions}/{total_functions})")

    if coverage < threshold:
        print(f"ERROR: Coverage {coverage:.1%} below threshold {threshold:.1%}")
        return False

    return True

if __name__ == '__main__':
    if not check_assertion_coverage(threshold=0.95):
        sys.exit(1)
```

### 4.2 CI/CD Pipeline Integration

```yaml
# File: .github/workflows/quality-gates.yml

name: Quality Gates

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  assertion-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install icontract pydantic beartype
          pip install -r requirements.txt

      - name: Check Assertion Coverage
        run: python analyzer/quality_gates/assertion_coverage.py
        env:
          THRESHOLD: 0.95

  complexity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check Function Complexity
        run: python analyzer/quality_gates/complexity_check.py --threshold=50

      - name: Upload Complexity Report
        uses: actions/upload-artifact@v3
        with:
          name: complexity-report
          path: .claude/.artifacts/complexity-report.json

  architecture-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: God Object Check
        run: python analyzer/quality_gates/god_object_check.py

      - name: Circular Dependency Check
        run: python analyzer/quality_gates/circular_dep_check.py

      - name: Generate Architecture Report
        run: python analyzer/refactoring/dependency_analyzer.py --output-graph

      - name: Upload Architecture Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: architecture-analysis
          path: .claude/.artifacts/architecture/

  incremental-thresholds:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        week: [1, 2, 3, 4, 5, 6]
    steps:
      - uses: actions/checkout@v3

      - name: Week ${{ matrix.week }} Quality Check
        run: |
          python analyzer/quality_gates/incremental_validator.py \
            --week=${{ matrix.week }} \
            --config=quality-gates-config.yml
```

### 4.3 Incremental Quality Thresholds

```yaml
# File: quality-gates-config.yml

# Progressive quality improvements over 6 weeks
incremental_thresholds:
  week_1:
    assertion_coverage: 0.50  # 50% coverage
    max_complexity: 100
    max_god_objects: 24
    circular_dependencies: 3

  week_2:
    assertion_coverage: 0.65  # 65% coverage
    max_complexity: 80
    max_god_objects: 18
    circular_dependencies: 2

  week_3:
    assertion_coverage: 0.75  # 75% coverage
    max_complexity: 60
    max_god_objects: 12
    circular_dependencies: 1

  week_4:
    assertion_coverage: 0.85  # 85% coverage
    max_complexity: 50
    max_god_objects: 6
    circular_dependencies: 0

  week_5:
    assertion_coverage: 0.92  # 92% coverage
    max_complexity: 40
    max_god_objects: 3
    circular_dependencies: 0

  week_6:
    assertion_coverage: 0.95  # 95% coverage (target)
    max_complexity: 30
    max_god_objects: 0
    circular_dependencies: 0

enforcement:
  mode: "progressive"  # or "strict"
  auto_rollback: true
  notification:
    slack_webhook: "${SLACK_WEBHOOK_URL}"
    email: "dev-team@example.com"
```

---

## 5. Implementation Roadmap

### Week 1: Foundation & Analysis
**Deliverables:**
- [ ] AST-based assertion analyzer (`AssertionAnalyzer`)
- [ ] Template library with 10+ patterns (`TemplateLibrary`)
- [ ] Complexity analyzer with extraction suggestions (`MethodExtractor`)
- [ ] Dependency graph builder (`DependencyAnalyzer`)

**Tasks:**
1. Implement AST analyzers for violation detection
2. Create assertion template library
3. Build complexity detection with AST node counting
4. Generate dependency graphs with NetworkX

### Week 2: Injection & Refactoring Core
**Deliverables:**
- [ ] Smart assertion injector with dry-run mode (`SmartInjector`)
- [ ] Assertion validator for safety checks (`AssertionValidator`)
- [ ] Method extraction engine (`MethodExtractor.apply_extraction()`)
- [ ] God object decomposer (`GodObjectDecomposer`)

**Tasks:**
1. Implement AST transformation for assertion injection
2. Add import management and code formatting
3. Build method extraction with variable analysis
4. Create god object responsibility clustering

### Week 3: Dependency Breaking & Interfaces
**Deliverables:**
- [ ] Circular dependency breaker (`DependencyAnalyzer.suggest_break_strategies()`)
- [ ] Interface extractor (`InterfaceExtractor`)
- [ ] Adapter pattern generator
- [ ] Facade pattern implementation for decomposed classes

**Tasks:**
1. Implement cycle detection with weakest link analysis
2. Build interface/ABC extraction from concrete classes
3. Generate adapter classes for dependency injection
4. Create backward-compatible facades

### Week 4: Quality Gates & CI/CD
**Deliverables:**
- [ ] Pre-commit hooks for quality enforcement
- [ ] CI/CD pipeline with quality gates
- [ ] Incremental threshold validator
- [ ] Automated rollback mechanism

**Tasks:**
1. Configure pre-commit hooks for assertion/complexity/architecture checks
2. Build GitHub Actions workflow with parallel quality jobs
3. Implement progressive threshold validation
4. Add Slack/email notifications for failures

### Week 5: Integration & Testing
**Deliverables:**
- [ ] End-to-end assertion injection for 1,312 violations
- [ ] Refactored god objects (24 → 0)
- [ ] Broken circular dependencies (3 → 0)
- [ ] Comprehensive test suite

**Tasks:**
1. Run assertion injection across entire codebase
2. Apply god object decompositions with facades
3. Break all circular dependencies with DI/interfaces
4. Validate with 100% test coverage on refactored code

### Week 6: Documentation & Finalization
**Deliverables:**
- [ ] Refactoring playbook documentation
- [ ] Architecture decision records (ADRs)
- [ ] Team training materials
- [ ] Production deployment plan

**Tasks:**
1. Document all patterns and templates used
2. Write ADRs for major architectural decisions
3. Create training guides for team
4. Plan production rollout with feature flags

---

## 6. Code Templates & Examples

### 6.1 icontract Assertion Pattern

```python
from icontract import require, ensure, invariant
from pathlib import Path
from typing import List, Optional

class EnhancedFileAnalyzer:
    """File analyzer with comprehensive contracts."""

    @require(lambda file_path: file_path is not None, "file_path cannot be None")
    @require(lambda file_path: len(file_path) > 0, "file_path must be non-empty")
    @require(lambda file_path: Path(file_path).exists(), "File must exist: {file_path}")
    @require(lambda file_path: Path(file_path).suffix == '.py', "Must be Python file: {file_path}")
    @ensure(lambda result: result is not None, "Result cannot be None")
    @ensure(lambda result: len(result.violations) >= 0, "Violations must be non-negative")
    @ensure(lambda result: result.file_path == OLD.file_path, "File path must match input")
    def analyze_file(self, file_path: str, config: Optional[AnalysisConfig] = None) -> AnalysisResult:
        """
        Analyze Python file for violations.

        Args:
            file_path: Path to Python file
            config: Optional analysis configuration

        Returns:
            AnalysisResult with violations and metrics
        """
        # Implementation
        violations = self._detect_violations(file_path, config)

        return AnalysisResult(
            file_path=file_path,
            violations=violations,
            metrics=self._calculate_metrics(violations)
        )

    @require(lambda self: hasattr(self, 'analyzer'), "Analyzer must be initialized")
    @require(lambda violations: violations is not None, "Violations cannot be None")
    @require(lambda violations: all(v.severity in ['low', 'medium', 'high', 'critical'] for v in violations),
             "All violations must have valid severity")
    @ensure(lambda result: 'total_violations' in result, "Must include total_violations")
    @ensure(lambda result: result['total_violations'] == len(OLD.violations), "Count must match violations")
    def _calculate_metrics(self, violations: List[Violation]) -> Dict[str, any]:
        """Calculate analysis metrics with validation."""
        return {
            'total_violations': len(violations),
            'by_severity': self._count_by_severity(violations),
            'critical_count': sum(1 for v in violations if v.severity == 'critical')
        }
```

### 6.2 Pydantic Data Validation Pattern

```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional
from pathlib import Path

class AnalysisConfig(BaseModel):
    """Analysis configuration with automatic validation."""

    target_path: str = Field(
        ...,
        min_length=1,
        description="Path to analyze"
    )

    max_complexity: int = Field(
        15,
        ge=1,
        le=100,
        description="Maximum McCabe complexity threshold"
    )

    enable_nasa: bool = Field(
        True,
        description="Enable NASA POT10 compliance checks"
    )

    severity_levels: List[str] = Field(
        default=['low', 'medium', 'high', 'critical'],
        description="Enabled severity levels"
    )

    output_format: str = Field(
        'json',
        regex='^(json|html|markdown|xml)$',
        description="Output report format"
    )

    @validator('target_path')
    def path_must_exist(cls, v):
        """Validate path exists."""
        path = Path(v)
        if not path.exists():
            raise ValueError(f'Path does not exist: {v}')
        if not path.is_dir() and not path.suffix == '.py':
            raise ValueError(f'Must be directory or Python file: {v}')
        return str(path.absolute())

    @validator('severity_levels')
    def valid_severities(cls, v):
        """Validate severity levels."""
        valid = {'low', 'medium', 'high', 'critical'}
        if not set(v).issubset(valid):
            raise ValueError(f'Invalid severity levels. Must be subset of {valid}')
        return v

    @root_validator
    def validate_config_consistency(cls, values):
        """Validate overall configuration consistency."""
        if values.get('enable_nasa') and values.get('max_complexity', 0) > 15:
            raise ValueError('NASA POT10 requires max_complexity <= 15')
        return values

    class Config:
        validate_assignment = True  # Validate on attribute assignment
        extra = 'forbid'  # Reject extra fields
        json_schema_extra = {
            "example": {
                "target_path": "/path/to/code",
                "max_complexity": 15,
                "enable_nasa": True,
                "severity_levels": ["medium", "high", "critical"],
                "output_format": "json"
            }
        }
```

### 6.3 Beartype Type Checking Pattern

```python
from beartype import beartype
from typing import List, Dict, Optional, Union
from pathlib import Path

@beartype
def analyze_directory(
    directory_path: Union[str, Path],
    recursive: bool = True,
    file_extensions: List[str] = ['.py'],
    exclude_patterns: Optional[List[str]] = None
) -> Dict[str, List[Violation]]:
    """
    Analyze directory with automatic type validation.

    Args:
        directory_path: Path to directory
        recursive: Whether to analyze subdirectories
        file_extensions: File extensions to analyze
        exclude_patterns: Glob patterns to exclude

    Returns:
        Dictionary mapping file paths to violations
    """
    path = Path(directory_path) if isinstance(directory_path, str) else directory_path

    if not path.is_dir():
        raise ValueError(f"Not a directory: {path}")

    results: Dict[str, List[Violation]] = {}
    pattern = '**/*' if recursive else '*'

    for ext in file_extensions:
        for file_path in path.glob(f"{pattern}{ext}"):
            if not should_exclude(file_path, exclude_patterns or []):
                results[str(file_path)] = analyze_file_internal(file_path)

    return results

@beartype
def should_exclude(file_path: Path, patterns: List[str]) -> bool:
    """Check if file matches exclusion patterns."""
    from fnmatch import fnmatch

    for pattern in patterns:
        if fnmatch(str(file_path), pattern):
            return True
    return False

@beartype
def analyze_file_internal(file_path: Path) -> List[Violation]:
    """Analyze single file (type-checked)."""
    # Implementation
    return []
```

### 6.4 Combined Pattern (Best of All)

```python
from icontract import require, ensure
from pydantic import BaseModel, Field, validator
from beartype import beartype
from typing import List, Optional
from pathlib import Path

class AnalysisRequest(BaseModel):
    """Request model with Pydantic validation."""

    file_path: str = Field(..., min_length=1)
    config: Optional['AnalysisConfig'] = None

    @validator('file_path')
    def validate_path(cls, v):
        if not Path(v).exists():
            raise ValueError(f"File not found: {v}")
        return v

class ProductionAnalyzer:
    """
    Production-ready analyzer with triple protection:
    - icontract: Pre/postconditions
    - Pydantic: Data validation
    - Beartype: Type checking
    """

    @beartype  # Type checking
    @require(lambda request: request is not None, "Request cannot be None")
    @require(lambda request: request.file_path, "File path required")
    @ensure(lambda result: result is not None, "Result cannot be None")
    @ensure(lambda result: result.success or result.error, "Must have success or error")
    def analyze(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Execute analysis with comprehensive validation.

        Validation Layers:
        1. Beartype: Runtime type checking (O(1) cost)
        2. Pydantic: Data model validation (request object)
        3. icontract: Business logic contracts (pre/post conditions)
        """
        try:
            # Pydantic validates request structure
            file_path = Path(request.file_path)

            # Business logic
            violations = self._detect_violations(file_path, request.config)

            # Pydantic validates response
            return AnalysisResponse(
                success=True,
                file_path=str(file_path),
                violations=violations,
                metrics=self._calculate_metrics(violations)
            )

        except Exception as e:
            return AnalysisResponse(
                success=False,
                error=str(e)
            )

    @beartype
    @require(lambda self: self.initialized, "Analyzer must be initialized")
    @require(lambda file_path: file_path.exists(), "File must exist")
    @ensure(lambda result: isinstance(result, list), "Must return list")
    def _detect_violations(
        self,
        file_path: Path,
        config: Optional['AnalysisConfig']
    ) -> List[Violation]:
        """Internal violation detection with contracts."""
        # Implementation
        return []
```

---

## 7. Risk Mitigation & Rollback Strategy

### 7.1 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes from refactoring | Medium | High | Comprehensive test suite, feature flags, incremental rollout |
| Performance degradation from assertions | Low | Medium | Benchmark before/after, disable in production if needed |
| Incomplete assertion coverage | Low | Low | Automated coverage tracking, incremental thresholds |
| Team adoption resistance | Medium | Medium | Training, documentation, gradual introduction |
| Circular dependency break failures | Low | High | Dry-run validation, rollback scripts, dependency graph monitoring |

### 7.2 Automated Rollback Mechanism

```python
# File: analyzer/quality_gates/auto_rollback.py

import subprocess
from typing import Dict, List
import json

class AutoRollback:
    """Automatic rollback on quality regression."""

    def __init__(self, threshold_config: str = 'quality-gates-config.yml'):
        self.config = self._load_config(threshold_config)
        self.baseline = self._load_baseline()

    def check_quality_regression(self) -> Dict:
        """
        Check if current code regresses from baseline.

        Returns:
            {
                'regressed': bool,
                'metrics': Dict,
                'rollback_needed': bool,
                'rollback_sha': str or None
            }
        """
        current_metrics = self._measure_current_quality()

        regressions = []

        # Check each metric
        for metric, current_value in current_metrics.items():
            baseline_value = self.baseline.get(metric, 0)
            threshold = self.config['regression_thresholds'].get(metric, 0.1)

            if self._is_regression(metric, current_value, baseline_value, threshold):
                regressions.append({
                    'metric': metric,
                    'baseline': baseline_value,
                    'current': current_value,
                    'threshold': threshold
                })

        result = {
            'regressed': len(regressions) > 0,
            'regressions': regressions,
            'metrics': current_metrics,
            'rollback_needed': len(regressions) > 0 and self.config['auto_rollback'],
            'rollback_sha': self._get_last_good_commit() if len(regressions) > 0 else None
        }

        if result['rollback_needed']:
            self._execute_rollback(result['rollback_sha'])

        return result

    def _is_regression(
        self,
        metric: str,
        current: float,
        baseline: float,
        threshold: float
    ) -> bool:
        """Check if metric regressed beyond threshold."""
        # For coverage/quality metrics: lower is worse
        if metric in ['assertion_coverage', 'compliance_score']:
            return (baseline - current) > threshold

        # For violation counts: higher is worse
        if metric in ['max_complexity', 'god_objects', 'circular_deps']:
            return (current - baseline) > threshold

        return False

    def _execute_rollback(self, sha: str):
        """Execute git rollback to last good commit."""
        print(f"ROLLBACK: Reverting to {sha}")

        # Create rollback branch
        subprocess.run(['git', 'checkout', '-b', f'rollback-{sha}'])
        subprocess.run(['git', 'reset', '--hard', sha])

        # Push rollback branch
        subprocess.run(['git', 'push', 'origin', f'rollback-{sha}'])

        # Notify team
        self._send_notification(
            f"Quality regression detected. Rolled back to {sha}. "
            f"Review rollback-{sha} branch for details."
        )

    def _get_last_good_commit(self) -> str:
        """Find last commit that passed all quality gates."""
        result = subprocess.run(
            ['git', 'log', '--grep=QUALITY_GATE_PASSED', '-1', '--format=%H'],
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
```

### 7.3 Feature Flags for Gradual Rollout

```python
# File: analyzer/feature_flags.py

from enum import Enum
from typing import Dict
import os

class Feature(Enum):
    """Feature flags for gradual rollout."""
    ASSERTION_INJECTION = 'assertion_injection'
    GOD_OBJECT_REFACTOR = 'god_object_refactor'
    CIRCULAR_DEP_BREAK = 'circular_dep_break'
    ICONTRACT_VALIDATION = 'icontract_validation'
    PYDANTIC_MODELS = 'pydantic_models'
    BEARTYPE_CHECKING = 'beartype_checking'

class FeatureFlags:
    """Manage feature flags for safe rollout."""

    # Default flags (can be overridden by env vars)
    FLAGS: Dict[Feature, bool] = {
        Feature.ASSERTION_INJECTION: False,  # Week 2+
        Feature.GOD_OBJECT_REFACTOR: False,  # Week 3+
        Feature.CIRCULAR_DEP_BREAK: False,   # Week 3+
        Feature.ICONTRACT_VALIDATION: True,  # Week 1
        Feature.PYDANTIC_MODELS: True,       # Week 1
        Feature.BEARTYPE_CHECKING: True,     # Week 1
    }

    @classmethod
    def is_enabled(cls, feature: Feature) -> bool:
        """Check if feature is enabled."""
        # Check environment override
        env_var = f"FEATURE_{feature.value.upper()}"
        if env_var in os.environ:
            return os.environ[env_var].lower() in ('true', '1', 'yes')

        return cls.FLAGS.get(feature, False)

    @classmethod
    def enable(cls, feature: Feature):
        """Enable feature."""
        cls.FLAGS[feature] = True

    @classmethod
    def disable(cls, feature: Feature):
        """Disable feature."""
        cls.FLAGS[feature] = False

# Usage in code
def analyze_with_assertions(file_path: str):
    """Analyze with optional assertion injection."""

    if FeatureFlags.is_enabled(Feature.ASSERTION_INJECTION):
        # New: Inject assertions
        injector = SmartInjector()
        injector.inject_assertions(file_path, ...)
    else:
        # Legacy: Traditional analysis
        analyzer = LegacyAnalyzer()
        analyzer.analyze(file_path)
```

---

## 8. Success Metrics & Monitoring

### 8.1 Key Performance Indicators (KPIs)

| Metric | Baseline | Week 3 Target | Week 6 Target |
|--------|----------|---------------|---------------|
| Assertion Coverage | 14.9% (485/3250) | 75% | 95% |
| Avg Function Complexity | ~150 nodes | <60 nodes | <30 nodes |
| God Objects | 24 | 12 | 0 |
| Circular Dependencies | 3 | 1 | 0 |
| NASA POT10 Compliance | Variable | 85% | 95% |
| Test Coverage | Variable | 80% | 90% |

### 8.2 Monitoring Dashboard

```python
# File: analyzer/monitoring/metrics_dashboard.py

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List
import json

@dataclass
class QualityMetrics:
    """Quality metrics snapshot."""
    timestamp: datetime
    assertion_coverage: float
    avg_complexity: float
    god_objects: int
    circular_deps: int
    nasa_compliance: float
    test_coverage: float

class MetricsDashboard:
    """Real-time quality metrics dashboard."""

    def __init__(self):
        self.history: List[QualityMetrics] = []

    def record_metrics(self) -> QualityMetrics:
        """Record current metrics snapshot."""
        metrics = QualityMetrics(
            timestamp=datetime.now(),
            assertion_coverage=self._measure_assertion_coverage(),
            avg_complexity=self._measure_avg_complexity(),
            god_objects=self._count_god_objects(),
            circular_deps=self._count_circular_deps(),
            nasa_compliance=self._measure_nasa_compliance(),
            test_coverage=self._measure_test_coverage()
        )

        self.history.append(metrics)
        return metrics

    def generate_trend_report(self, days: int = 7) -> Dict:
        """Generate trend analysis for last N days."""
        recent = [m for m in self.history
                 if (datetime.now() - m.timestamp).days <= days]

        if not recent:
            return {'error': 'No data'}

        return {
            'period': f'Last {days} days',
            'data_points': len(recent),
            'trends': {
                'assertion_coverage': self._calculate_trend([m.assertion_coverage for m in recent]),
                'avg_complexity': self._calculate_trend([m.avg_complexity for m in recent]),
                'god_objects': self._calculate_trend([m.god_objects for m in recent]),
                'circular_deps': self._calculate_trend([m.circular_deps for m in recent]),
                'nasa_compliance': self._calculate_trend([m.nasa_compliance for m in recent]),
            },
            'current': recent[-1],
            'week_ago': recent[0] if len(recent) > 0 else None
        }

    def _calculate_trend(self, values: List[float]) -> Dict:
        """Calculate trend (improving/declining/stable)."""
        if len(values) < 2:
            return {'trend': 'unknown'}

        first, last = values[0], values[-1]
        change = last - first
        pct_change = (change / first * 100) if first != 0 else 0

        trend = 'stable'
        if abs(pct_change) > 5:
            trend = 'improving' if change < 0 else 'declining'  # Lower is better for most metrics

        return {
            'trend': trend,
            'change': change,
            'pct_change': pct_change,
            'first': first,
            'last': last
        }
```

---

## 9. Team Training & Documentation

### 9.1 Developer Onboarding Guide

**File: `docs/refactoring-playbook.md`**

```markdown
# Refactoring Playbook

## Quick Start

### Adding Assertions to Your Code

1. **icontract for Business Logic**
   ```python
   from icontract import require, ensure

   @require(lambda x: x > 0, "x must be positive")
   @ensure(lambda result: result > OLD.x, "result must exceed input")
   def calculate(x: int) -> int:
       return x * 2
   ```

2. **Pydantic for Data Models**
   ```python
   from pydantic import BaseModel, Field

   class Config(BaseModel):
       threshold: int = Field(ge=1, le=100)
   ```

3. **Beartype for Type Safety**
   ```python
   from beartype import beartype

   @beartype
   def process(items: List[str]) -> Dict[str, int]:
       ...
   ```

### Reducing Function Complexity

**Checklist:**
- [ ] Function has <50 AST nodes
- [ ] McCabe complexity <15
- [ ] Single responsibility
- [ ] Clear, descriptive name

**Extract Method Pattern:**
```python
# Before (complex)
def analyze(data):
    # 100 lines of code
    # Multiple responsibilities
    pass

# After (extracted)
def analyze(data):
    validated = self._validate_data(data)
    processed = self._process_data(validated)
    return self._generate_report(processed)

def _validate_data(self, data):
    # Focused validation logic
    pass

def _process_data(self, data):
    # Focused processing logic
    pass

def _generate_report(self, data):
    # Focused reporting logic
    pass
```

### Breaking Circular Dependencies

**Strategy 1: Dependency Injection**
```python
# Before (circular)
from module_b import ClassB

class ClassA:
    def __init__(self):
        self.b = ClassB()

# After (DI)
class ClassA:
    def __init__(self, b: 'ClassBProtocol'):
        self.b = b
```

**Strategy 2: Interface Extraction**
```python
from typing import Protocol

class ClassBProtocol(Protocol):
    def required_method(self) -> str: ...
```

## Quality Gates

### Pre-Commit Checks
- Assertion coverage ≥95%
- Function complexity ≤50 nodes
- Zero god objects
- Zero circular dependencies

### CI/CD Pipeline
- Automated quality gates on every PR
- Progressive thresholds (weekly improvements)
- Automatic rollback on regression

## Troubleshooting

### "Assertion coverage below threshold"
→ Run: `python analyzer/assertion_injector/auto_inject.py --file=<path> --dry-run`

### "Function too complex"
→ Run: `python analyzer/refactoring/extract_method.py --analyze=<function>`

### "Circular dependency detected"
→ Run: `python analyzer/refactoring/dependency_analyzer.py --visualize`
```

---

## 10. Conclusion & Next Steps

### 10.1 Summary

This architecture enhancement specification provides a **production-ready framework** for:

1. **Automated Assertion Injection**
   - 1,312 Rule 4 violations → 95% coverage
   - Triple protection: icontract + Pydantic + Beartype
   - Template library with 10+ patterns
   - Dry-run validation for safety

2. **Systematic Complexity Reduction**
   - 137 Rule 1 violations → Extract Method pattern
   - 24 god objects → 0 (decomposed into focused classes)
   - Average complexity: 150 nodes → 30 nodes

3. **Dependency Architecture Refactoring**
   - 3 circular dependencies → 0
   - Interface/Adapter patterns for loose coupling
   - Dependency injection for modularity

4. **Quality Gate Automation**
   - Pre-commit hooks for immediate feedback
   - CI/CD pipeline with progressive thresholds
   - Automatic rollback on regression

### 10.2 Implementation Priority

**Week 1-2 (Foundation):**
- AST analyzers and template library
- Assertion injector with dry-run mode
- Complexity detection and extraction suggestions

**Week 3-4 (Refactoring):**
- God object decomposition with facades
- Circular dependency breaking with DI/interfaces
- Quality gate integration

**Week 5-6 (Validation & Deployment):**
- End-to-end testing
- Team training
- Production rollout with feature flags

### 10.3 Expected Outcomes

**By Week 6:**
- ✅ 95% assertion coverage (from 14.9%)
- ✅ Zero god objects (from 24)
- ✅ Zero circular dependencies (from 3)
- ✅ 95% NASA POT10 compliance
- ✅ <30 avg function complexity (from ~150)
- ✅ Automated quality gates preventing regression

### 10.4 Contact & Support

**Implementation Team:**
- Architecture Lead: [Name]
- Refactoring Engineer: [Name]
- Quality Assurance: [Name]
- DevOps Engineer: [Name]

**Resources:**
- Refactoring Playbook: `docs/refactoring-playbook.md`
- Quality Gates Config: `quality-gates-config.yml`
- Training Materials: `docs/training/`

---

**Document Approval:**
- [ ] Architecture Review Board
- [ ] Technical Lead
- [ ] QA Lead
- [ ] DevOps Lead

**Next Review Date:** [6 weeks from start]
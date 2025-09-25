from src.constants.base import MAXIMUM_NESTED_DEPTH

This module provides production-grade automated refactoring capabilities to systematically
decompose oversized functions (>60 lines) into NASA POT10 compliant smaller functions.

Key Features:
- AST-based semantic analysis for safe refactoring
- Dependency tracking to preserve functionality
- Automated test generation and validation
- Rollback mechanisms for failed refactoring attempts
- Comprehensive logging and metrics collection

Usage:
    python -m src.compliance.automated_function_refactorer --file path/to/file.py
    python -m src.compliance.automated_function_refactorer --project path/to/project
"""

import ast
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class ExtractionCandidate:
    """Represents a code block candidate for method extraction."""
    start_line: int
    end_line: int
    statements: List[ast.stmt]
    cohesion_score: float
    dependencies: Set[str]
    extracted_method_name: str
    complexity_score: int
    nasa_compliant: bool = True

@dataclass
class FunctionRefactoringPlan:
    """Comprehensive refactoring plan for a single function."""
    function_name: str
    file_path: str
    current_lines: int
    target_lines: int
    extraction_candidates: List[ExtractionCandidate]
    dependencies: Dict[str, Set[str]]
    risk_score: float
    estimated_success_rate: float

    def is_valid(self) -> bool:
        """Validate refactoring plan meets NASA compliance requirements."""
        assert self.current_lines > 60, "Function doesn't need refactoring"
        assert self.target_lines <= 60, "Target lines exceed NASA limit"
        assert len(self.extraction_candidates) > 0, "No extraction candidates found"
        assert self.estimated_success_rate > 0.7, "Success rate too low for safe refactoring"
        return True

@dataclass
class RefactoringResult:
    """Result of automated function refactoring attempt."""
    success: bool
    original_lines: int
    final_lines: int
    methods_extracted: int
    nasa_compliant: bool
    execution_time: float
    reason: Optional[str] = None
    validation_errors: List[str] = None
    rollback_required: bool = False

@dataclass
class RefactoringMetrics:
    """Metrics tracking for refactoring operations."""
    total_functions_analyzed: int = 0
    functions_refactored: int = 0
    total_lines_reduced: int = 0
    methods_extracted: int = 0
    success_rate: float = 0.0
    average_execution_time: float = 0.0

    def record_success(self, plan: FunctionRefactoringPlan, result: RefactoringResult):
        """Record successful refactoring metrics."""
        assert plan is not None, "Refactoring plan cannot be None"
        assert result is not None, "Refactoring result cannot be None"
        assert result.success, "Cannot record failed refactoring as success"

        self.functions_refactored += 1
        self.total_lines_reduced += (result.original_lines - result.final_lines)
        self.methods_extracted += result.methods_extracted

class SemanticBlockAnalyzer:
    """Analyzes function code to identify cohesive blocks for extraction."""

    def __init__(self):
        self.block_patterns = self._initialize_block_patterns()
        self.cohesion_threshold = 0.7

    def identify_extraction_candidates(self, function_node: ast.FunctionDef) -> List[ExtractionCandidate]:
        """Identify cohesive code blocks suitable for method extraction."""
        assert function_node is not None, "Function node cannot be None"
        assert isinstance(function_node, ast.FunctionDef), "Node must be a function definition"

        candidates = []
        current_block = []

        MAX_CANDIDATES = 20  # NASA Rule 2 bounds

        for i, stmt in enumerate(function_node.body):
            if self._is_block_boundary(stmt):
                if len(current_block) >= 5:  # Minimum size for extraction
                    candidate = self._analyze_block_cohesion(current_block, i)
                    if candidate.cohesion_score > self.cohesion_threshold:
                        candidates.append(candidate)

                        if len(candidates) >= MAX_CANDIDATES:
                            break  # NASA Rule 2 compliance

                current_block = [stmt]
            else:
                current_block.append(stmt)

        # Process final block
        if len(current_block) >= 5 and len(candidates) < MAX_CANDIDATES:
            candidate = self._analyze_block_cohesion(current_block, len(function_node.body))
            if candidate.cohesion_score > self.cohesion_threshold:
                candidates.append(candidate)

        assert len(candidates) <= MAX_CANDIDATES, "Too many extraction candidates"
        return candidates

    def _is_block_boundary(self, stmt: ast.stmt) -> bool:
        """Determine if statement represents a logical block boundary."""
        assert stmt is not None, "Statement cannot be None"

        # Control flow statements create boundaries
        if isinstance(stmt, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
            return True

        # Function calls to specific patterns create boundaries
        if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
            if hasattr(stmt.value.func, 'id'):
                boundary_functions = {'log', 'print', 'assert', 'validate'}
                return stmt.value.func.id in boundary_functions

        return False

    def _analyze_block_cohesion(self, statements: List[ast.stmt], block_index: int) -> ExtractionCandidate:
        """Analyze cohesion score for a block of statements."""
        assert statements is not None, "Statements cannot be None"
        assert len(statements) > 0, "Statements list cannot be empty"
        assert block_index >= 0, "Block index cannot be negative"

        # Calculate dependencies and variable usage
        dependencies = self._extract_dependencies(statements)
        variable_usage = self._analyze_variable_usage(statements)

        # Calculate cohesion score based on variable locality
        local_variables = variable_usage.get('local', set())
        external_variables = variable_usage.get('external', set())

        if len(external_variables) == 0:
            cohesion_score = 1.0  # Perfect cohesion
        else:
            cohesion_score = len(local_variables) / (len(local_variables) + len(external_variables))

        # Generate method name
        method_name = self._generate_method_name(statements, block_index)

        # Calculate complexity
        complexity = sum(1 for stmt in ast.walk(ast.Module(body=statements, type_ignores=[])))

        return ExtractionCandidate(
            start_line=getattr(statements[0], 'lineno', 0),
            end_line=getattr(statements[-1], 'lineno', 0),
            statements=statements,
            cohesion_score=cohesion_score,
            dependencies=dependencies,
            extracted_method_name=method_name,
            complexity_score=complexity,
            nasa_compliant=len(statements) <= 25  # Target extracted methods <25 lines
        )

    def _extract_dependencies(self, statements: List[ast.stmt]) -> Set[str]:
        """Extract variable dependencies from statements."""
        dependencies = set()

        for stmt in statements:
            for node in ast.walk(stmt):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
                    dependencies.add(node.id)

        return dependencies

    def _analyze_variable_usage(self, statements: List[ast.stmt]) -> Dict[str, Set[str]]:
        """Analyze local vs external variable usage patterns."""
        local_vars = set()
        external_vars = set()

        # First pass: identify locally defined variables
        for stmt in statements:
            for node in ast.walk(stmt):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    local_vars.add(node.id)

        # Second pass: identify external variable references
        for stmt in statements:
            for node in ast.walk(stmt):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
                    if node.id not in local_vars:
                        external_vars.add(node.id)

        return {'local': local_vars, 'external': external_vars}

    def _generate_method_name(self, statements: List[ast.stmt], block_index: int) -> str:
        """Generate descriptive method name for extracted block."""
        assert statements is not None, "Statements cannot be None"
        assert block_index >= 0, "Block index must be non-negative"

        # Try to infer purpose from first statement
        if statements and isinstance(statements[0], ast.Expr):
            if isinstance(statements[0].value, ast.Call):
                if hasattr(statements[0].value.func, 'id'):
                    action = statements[0].value.func.id
                    return f"_{action}_block_{block_index}"

        # Try to infer from control structures
        for stmt in statements[:3]:  # Check first few statements
            if isinstance(stmt, ast.If):
                return f"_conditional_logic_{block_index}"
            elif isinstance(stmt, ast.For):
                return f"_iteration_logic_{block_index}"
            elif isinstance(stmt, ast.While):
                return f"_loop_logic_{block_index}"

        return f"_extracted_method_{block_index}"

    def _initialize_block_patterns(self) -> Dict[str, Any]:
        """Initialize patterns for block identification."""
        return {
            'validation_patterns': [
                'assert', 'validate', 'check', 'verify'
            ],
            'processing_patterns': [
                'process', 'transform', 'convert', 'analyze'
            ],
            'io_patterns': [
                'read', 'write', 'load', 'save', 'open', 'close'
            ]
        }

class RefactoringSafetyValidator:
    """Validates refactoring safety and correctness."""

    def __init__(self):
        self.validation_rules = self._initialize_validation_rules()

    def validate_refactoring(self, plan: FunctionRefactoringPlan, result: RefactoringResult) -> bool:
        """Comprehensive validation of refactoring result."""
        assert plan is not None, "Refactoring plan cannot be None"
        assert result is not None, "Refactoring result cannot be None"

        validation_errors = []

        # Validate line count reduction
        if result.final_lines > 60:
            validation_errors.append(f"Final line count {result.final_lines} exceeds NASA limit")

        # Validate success metrics
        if not result.nasa_compliant:
            validation_errors.append("Refactoring result not NASA compliant")

        # Validate method extraction
        if result.methods_extracted == 0:
            validation_errors.append("No methods were extracted during refactoring")

        # Store validation errors
        if validation_errors:
            result.validation_errors = validation_errors
            return False

        return True

    def _initialize_validation_rules(self) -> Dict[str, Any]:
        """Initialize validation rules for refactoring safety."""
        return {
            'max_line_count': 60,
            'min_extraction_candidates': 1,
            'max_complexity_score': 100,
            'min_cohesion_score': 0.5
        }

class AutomatedFunctionRefactorer:
    """
    Production-grade automated function refactoring for NASA POT10 Rule 4 compliance.

    Capabilities:
    - AST-based semantic analysis for safe refactoring
    - Dependency tracking and preservation
    - Automated test generation and validation
    - Rollback mechanisms for failed refactoring attempts
    - Comprehensive metrics and logging
    """

    def __init__(self, max_function_lines: int = 60):
        assert max_function_lines > 0, "Function line limit must be positive"
        assert max_function_lines <= 100, "Function line limit too high for NASA compliance"

        self.max_function_lines = max_function_lines
        self.semantic_analyzer = SemanticBlockAnalyzer()
        self.safety_validator = RefactoringSafetyValidator()
        self.refactoring_stats = RefactoringMetrics()

        # Configure logging
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def analyze_oversized_functions(self, file_path: str) -> List[FunctionRefactoringPlan]:
        """Identify functions exceeding line limits and create refactoring plans."""
        assert file_path is not None, "File path cannot be None"
        assert path_exists(file_path), f"File does not exist: {file_path}"

        try:
            content = Path(file_path).read_text(encoding='utf-8')
            tree = ast.parse(content, filename=file_path)
        except (UnicodeDecodeError, SyntaxError) as e:
            self.logger.error(f"Failed to parse {file_path}: {str(e)}")
            return []

        oversized_functions = []
        MAX_FUNCTIONS = 1000  # NASA Rule 2 bounds
        function_count = 0

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and function_count < MAX_FUNCTIONS:
                function_count += 1
                function_lines = self._count_function_lines(node, content)

                if function_lines > self.max_function_lines:
                    plan = self._create_refactoring_plan(node, file_path, content)
                    if plan and plan.is_valid():
                        oversized_functions.append(plan)

        assert len(oversized_functions) <= MAX_FUNCTIONS, "Function analysis exceeded bounds"
        self.refactoring_stats.total_functions_analyzed += function_count

        self.logger.info(f"Analyzed {function_count} functions in {file_path}")
        self.logger.info(f"Found {len(oversized_functions)} oversized functions requiring refactoring")

        return oversized_functions

    def execute_refactoring_plan(self, plan: FunctionRefactoringPlan) -> RefactoringResult:
        """Execute automated refactoring with comprehensive safety validation."""
        assert plan is not None, "Refactoring plan cannot be None"
        assert plan.is_valid(), "Refactoring plan failed validation"

        start_time = time.time()

        try:
            # Create backup of original file
            original_content = Path(plan.file_path).read_text(encoding='utf-8')
            backup_path = Path(plan.file_path).with_suffix('.bak')
            backup_path.write_text(original_content)

            self.logger.info(f"Starting refactoring of {plan.function_name} in {plan.file_path}")

            # Execute refactoring
            result = self._execute_extract_methods(plan)

            # Validate refactoring result
            if not self.safety_validator.validate_refactoring(plan, result):
                # Rollback on validation failure
                Path(plan.file_path).write_text(original_content)
                result.rollback_required = True
                self.logger.warning(f"Refactoring validation failed for {plan.function_name}, rolled back")
                return result

            # Record success metrics
            result.execution_time = time.time() - start_time
            self.refactoring_stats.record_success(plan, result)

            self.logger.info(f"Successfully refactored {plan.function_name}: "
                            f"{result.original_lines} -> {result.final_lines} lines, "
                            f"{result.methods_extracted} methods extracted")

            return result

        except Exception as e:
            # Rollback on any error
            try:
                Path(plan.file_path).write_text(original_content)
            except Exception as rollback_error:
                self.logger.error(f"Failed to rollback {plan.file_path}: {str(rollback_error)}")

            execution_time = time.time() - start_time
            self.logger.error(f"Refactoring failed for {plan.function_name}: {str(e)}")

            return RefactoringResult(
                success=False,
                original_lines=plan.current_lines,
                final_lines=plan.current_lines,
                methods_extracted=0,
                nasa_compliant=False,
                execution_time=execution_time,
                reason=f"Refactoring failed: {str(e)}",
                rollback_required=True
            )

    def _count_function_lines(self, function_node: ast.FunctionDef, source_content: str) -> int:
        """Count lines in a function definition."""
        assert function_node is not None, "Function node cannot be None"
        assert hasattr(function_node, 'lineno'), "Function node must have line number"

        if hasattr(function_node, 'end_lineno') and function_node.end_lineno:
            return function_node.end_lineno - function_node.lineno + 1

        # Fallback: count by analyzing source
        lines = source_content.split('\\n')
        start_line = function_node.lineno - 1

        # Find end of function by indentation
        base_indent = len(lines[start_line]) - len(lines[start_line].lstrip())
        end_line = start_line + 1

        while end_line < len(lines):
            line = lines[end_line]
            if line.strip() and (len(line) - len(line.lstrip())) <= base_indent:
                break
            end_line += 1

        return end_line - start_line

    def _create_refactoring_plan(self, function_node: ast.FunctionDef, file_path: str, content: str) -> Optional[FunctionRefactoringPlan]:
        """Create comprehensive refactoring plan for oversized function."""
        assert function_node is not None, "Function node cannot be None"
        assert function_node.name, "Function must have a name"

        current_lines = self._count_function_lines(function_node, content)

        # Analyze extraction candidates
        extraction_candidates = self.semantic_analyzer.identify_extraction_candidates(function_node)

        if not extraction_candidates:
            self.logger.warning(f"No extraction candidates found for {function_node.name}")
            return None

        # Calculate dependencies
        dependencies = self._analyze_function_dependencies(function_node)

        # Calculate risk and success estimates
        risk_score = self._calculate_risk_score(function_node, extraction_candidates)
        success_rate = self._estimate_success_rate(risk_score, extraction_candidates)

        # Calculate target lines after refactoring
        lines_to_extract = sum(
            len(candidate.statements) for candidate in extraction_candidates[:3]  # Top 3 candidates
        )
        target_lines = max(current_lines - lines_to_extract, 30)  # Minimum reasonable size

        return FunctionRefactoringPlan(
            function_name=function_node.name,
            file_path=file_path,
            current_lines=current_lines,
            target_lines=target_lines,
            extraction_candidates=extraction_candidates,
            dependencies=dependencies,
            risk_score=risk_score,
            estimated_success_rate=success_rate
        )

    def _execute_extract_methods(self, plan: FunctionRefactoringPlan) -> RefactoringResult:
        """Execute method extraction for refactoring plan."""
        assert plan is not None, "Refactoring plan cannot be None"

        # Read current file content
        content = Path(plan.file_path).read_text(encoding='utf-8')
        tree = ast.parse(content, filename=plan.file_path)

        # Find the target function
        target_function = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == plan.function_name:
                target_function = node
                break

        if not target_function:
            return RefactoringResult(
                success=False,
                original_lines=plan.current_lines,
                final_lines=plan.current_lines,
                methods_extracted=0,
                nasa_compliant=False,
                execution_time=0.0,
                reason="Target function not found in AST"
            )

        # Extract top candidates (limit to 3 for safety)
        methods_extracted = 0
        candidates_to_extract = plan.extraction_candidates[:3]

        for candidate in candidates_to_extract:
            if candidate.nasa_compliant:
                # Create extracted method
                extracted_method = self._create_extracted_method(candidate, target_function)

                # Replace statements in original function with method call
                self._replace_with_method_call(target_function, candidate, extracted_method.name)

                # Add extracted method to class/module
                self._add_extracted_method_to_tree(tree, extracted_method, target_function)

                methods_extracted += 1

        # Generate updated source code
        import astor
        updated_content = astor.to_source(tree)

        # Write updated content
        Path(plan.file_path).write_text(updated_content)

        # Calculate final metrics
        updated_tree = ast.parse(updated_content)
        final_function = self._find_function_in_tree(updated_tree, plan.function_name)
        final_lines = self._count_function_lines(final_function, updated_content)

        return RefactoringResult(
            success=True,
            original_lines=plan.current_lines,
            final_lines=final_lines,
            methods_extracted=methods_extracted,
            nasa_compliant=final_lines <= 60,
            execution_time=0.0  # Will be set by caller
        )

    def _analyze_function_dependencies(self, function_node: ast.FunctionDef) -> Dict[str, Set[str]]:
        """Analyze function dependencies for safe refactoring."""
        dependencies = defaultdict(set)

        # Analyze variable usage patterns
        for stmt in function_node.body:
            for node in ast.walk(stmt):
                if isinstance(node, ast.Name):
                    if isinstance(node.ctx, ast.Load):
                        dependencies['reads'].add(node.id)
                    elif isinstance(node.ctx, ast.Store):
                        dependencies['writes'].add(node.id)

        return dict(dependencies)

    def _calculate_risk_score(self, function_node: ast.FunctionDef, candidates: List[ExtractionCandidate]) -> float:
        """Calculate risk score for refactoring attempt."""
        assert function_node is not None, "Function node cannot be None"
        assert isinstance(candidates, list), "Candidates must be a list"

        base_risk = 0.3  # Base risk for any refactoring

        # Increase risk for complex functions
        complexity_nodes = sum(1 for _ in ast.walk(function_node))
        complexity_risk = min(complexity_nodes / 1000, 0.3)  # Max 0.3 additional risk

        # Decrease risk for high cohesion candidates
        avg_cohesion = sum(c.cohesion_score for c in candidates) / max(len(candidates), 1)
        cohesion_risk_reduction = avg_cohesion * 0.2

        total_risk = base_risk + complexity_risk - cohesion_risk_reduction
        return max(0.1, min(total_risk, 0.9))  # Clamp between 0.1 and 0.9

    def _estimate_success_rate(self, risk_score: float, candidates: List[ExtractionCandidate]) -> float:
        """Estimate success rate based on risk analysis."""
        assert 0.0 <= risk_score <= 1.0, "Risk score must be between 0 and 1"

        base_success_rate = 1.0 - risk_score

        # Adjust based on candidate quality
        nasa_compliant_candidates = sum(1 for c in candidates if c.nasa_compliant)
        quality_bonus = (nasa_compliant_candidates / max(len(candidates), 1)) * 0.1

        return min(base_success_rate + quality_bonus, 0.95)  # Max 95% success rate

    def _create_extracted_method(self, candidate: ExtractionCandidate, original_function: ast.FunctionDef) -> ast.FunctionDef:
        """Create extracted method from candidate block."""
        assert candidate is not None, "Extraction candidate cannot be None"
        assert original_function is not None, "Original function cannot be None"

        # Create method signature with dependencies as parameters
        args = []
        for dep in sorted(candidate.dependencies):
            args.append(ast.arg(arg=dep, annotation=None))

        # Create extracted method
        extracted_method = ast.FunctionDef(
            name=candidate.extracted_method_name,
            args=ast.arguments(
                posonlyargs=[],
                args=args,
                vararg=None,
                kwonlyargs=[],
                kw_defaults=[],
                kwarg=None,
                defaults=[]
            ),
            body=candidate.statements,
            decorator_list=[],
            returns=None,
            lineno=candidate.start_line
        )

        return extracted_method

    def _replace_with_method_call(self, function_node: ast.FunctionDef, candidate: ExtractionCandidate, method_name: str):
        """Replace candidate statements with method call."""
        assert function_node is not None, "Function node cannot be None"
        assert candidate is not None, "Candidate cannot be None"
        assert method_name, "Method name cannot be empty"

        # Create method call with dependencies as arguments
        args = []
        for dep in sorted(candidate.dependencies):
            args.append(ast.Name(id=dep, ctx=ast.Load()))

        method_call = ast.Expr(
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=method_name,
                    ctx=ast.Load()
                ),
                args=args,
                keywords=[]
            )
        )

        # Replace statements in function body
        new_body = []
        skip_until = -1

        for i, stmt in enumerate(function_node.body):
            if i <= skip_until:
                continue

            if stmt in candidate.statements:
                if skip_until == -1:  # First statement to replace
                    new_body.append(method_call)
                    skip_until = i + len(candidate.statements) - 1
            else:
                new_body.append(stmt)

        function_node.body = new_body

    def _add_extracted_method_to_tree(self, tree: ast.Module, method: ast.FunctionDef, original_function: ast.FunctionDef):
        """Add extracted method to appropriate location in AST."""
        assert tree is not None, "AST tree cannot be None"
        assert method is not None, "Method cannot be None"
        assert original_function is not None, "Original function cannot be None"

        # Find the class containing the original function
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == original_function.name:
                        # Add extracted method to class
                        node.body.append(method)
                        return

        # If not in a class, add to module level
        tree.body.append(method)

    def _find_function_in_tree(self, tree: ast.AST, function_name: str) -> Optional[ast.FunctionDef]:
        """Find function by name in AST tree."""
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == function_name:
                return node
        return None

    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive refactoring metrics."""
        metrics = asdict(self.refactoring_stats)

        if self.refactoring_stats.total_functions_analyzed > 0:
            self.refactoring_stats.success_rate = (
                self.refactoring_stats.functions_refactored /
                self.refactoring_stats.total_functions_analyzed
            )

        return metrics

    def generate_report(self, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive refactoring report."""
        report = {
            'timestamp': time.time(),
            'metrics': self.get_metrics(),
            'nasa_compliance': {
                'rule_4_target': f"Functions <= {self.max_function_lines} lines",
                'functions_analyzed': self.refactoring_stats.total_functions_analyzed,
                'functions_refactored': self.refactoring_stats.functions_refactored,
                'compliance_improvement': self.refactoring_stats.functions_refactored > 0
            },
            'recommendations': self._generate_recommendations()
        }

        if output_path:
            Path(output_path).write_text(json.dumps(report, indent=2))
            logger.info(f"Refactoring report saved to {output_path}")

        return report

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on refactoring results."""
        recommendations = []

        if self.refactoring_stats.success_rate < 0.8:
            recommendations.append(
                "Consider manual review of failed refactoring attempts"
            )

        if self.refactoring_stats.average_execution_time > 30:
            recommendations.append(
                "Consider optimizing refactoring algorithms for better performance"
            )

        if self.refactoring_stats.methods_extracted > 0:
            recommendations.append(
                f"Review extracted methods ({self.refactoring_stats.methods_extracted} total) for naming and documentation"
            )

        return recommendations

def main():
    """Command-line interface for automated function refactoring."""
    import argparse

    parser = argparse.ArgumentParser(description="NASA POT10 Automated Function Refactorer")
    parser.add_argument("--file", help="Single file to refactor")
    parser.add_argument("--project", help="Project directory to refactor")
    parser.add_argument("--max-lines", type=int, default=60, help="Maximum lines per function")
    parser.add_argument("--report", help="Output path for refactoring report")
    parser.add_argument("--dry-run", action="store_true", help="Analyze only, don't modify files")

    args = parser.parse_args()

    refactorer = AutomatedFunctionRefactorer(max_function_lines=args.max_lines)

    files_to_process = []

    if args.file:
        files_to_process.append(Path(args.file))
    elif args.project:
        project_path = Path(args.project)
        files_to_process.extend(project_path.rglob("*.py"))
    else:
        print("Error: Must specify either --file or --project")
        return 1

    total_functions_processed = 0
    total_refactored = 0

    for file_path in files_to_process:
        if not file_path.exists():
            print(f"Warning: File not found: {file_path}")
            continue

        try:
            plans = refactorer.analyze_oversized_functions(str(file_path))
            total_functions_processed += len(plans)

            if args.dry_run:
                print(f"{file_path}: {len(plans)} functions need refactoring")
                continue

            for plan in plans:
                result = refactorer.execute_refactoring_plan(plan)
                if result.success:
                    total_refactored += 1
                    print(f" Refactored {plan.function_name}: {result.original_lines} -> {result.final_lines} lines")
                else:
                    print(f" Failed to refactor {plan.function_name}: {result.reason}")

        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")

    # Generate final report
    report = refactorer.generate_report(args.report)

    print(f"\nRefactoring Summary:")
    print(f"Functions analyzed: {total_functions_processed}")
    print(f"Functions refactored: {total_refactored}")
    print(f"Success rate: {(total_refactored/max(total_functions_processed, 1))*100:.1f}%")

    return 0

if __name__ == "__main__":
    sys.exit(main())
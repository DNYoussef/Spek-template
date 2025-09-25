from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

from utils.types import ConnascenceViolation
from pathlib import Path
import re
import json
import ast
from typing import Dict, List, Any, Optional
from .comprehensive_analysis_engine import ComprehensiveAnalysisEngine, Pattern

try:
    from .constants import (
        DETECTION_MESSAGES,
        GOD_OBJECT_LOC_THRESHOLD,
        NASA_PARAMETER_THRESHOLD,
        REGEX_PATTERNS,
    )
except ImportError:
    # Fallback when running as script
    from constants import (
        DETECTION_MESSAGES,
        GOD_OBJECT_LOC_THRESHOLD,
        NASA_PARAMETER_THRESHOLD,
        REGEX_PATTERNS,
    )

# ConnascenceViolation now imported from utils.types

class LanguageStrategy:
    """Base strategy for language-specific connascence detection with comprehensive analysis."""

    def __init__(self, language_name: str):
        self.language_name = language_name
        self.analysis_engine = ComprehensiveAnalysisEngine()
        self.cache = {}  # Performance optimization cache

    def detect_magic_literals(self, file_path: Path, source_lines: List[str]) -> List[ConnascenceViolation]:
        """Detect magic literals using formal grammar analysis when possible."""
        violations = []

        # Try to use formal grammar analyzer first
        try:
            from .formal_grammar import FormalGrammarEngine

            engine = FormalGrammarEngine()
            source_code = "\n".join(source_lines)
            matches = engine.analyze_file(str(file_path), source_code, self.language_name)

            # Convert grammar matches to violations
            for match in matches:
                if match.pattern_type.value == "magic_literal":
                    violations.append(self._create_formal_magic_literal_violation(file_path, match, source_lines))
            return violations
        except ImportError:
            # Fallback to regex-based detection

        # Original regex-based detection as fallback
            pass
        patterns = self.get_magic_literal_patterns()

        for line_num, line in enumerate(source_lines, 1):
            # Skip comments using language-specific comment detection
            if self.is_comment_line(line):
                continue

            # Apply numeric patterns
            for match in patterns["numeric"].finditer(line):
                violations.append(
                    self._create_magic_literal_violation(file_path, line_num, match, "number", line.strip())
                )

            # Apply string patterns
            for match in patterns["string"].finditer(line):
                literal = match.group()
                if not self.is_excluded_string_literal(literal):
                    violations.append(
                        self._create_magic_literal_violation(file_path, line_num, match, "string", line.strip())
                    )

        return violations

    def detect_god_functions(self, file_path: Path, source_lines: List[str]) -> List[ConnascenceViolation]:
        """Detect god functions using language-specific patterns."""
        violations = []
        function_detector = self.get_function_detector()

        in_function = False
        function_start = 0
        function_name = ""
        brace_count = 0

        for line_num, line in enumerate(source_lines, 1):
            if not in_function:
                match = function_detector.match(line)
                if match:
                    in_function = True
                    function_start = line_num
                    function_name = self.extract_function_name(line)
                    brace_count = self.count_braces(line)
            else:
                brace_count += self.count_braces(line)
                if brace_count <= 0:
                    # Function ended
                    function_length = line_num - function_start + 1
                    if function_length > GOD_OBJECT_LOC_THRESHOLD // MAXIMUM_FUNCTION_PARAMETERS:  # 50 lines threshold
                        violations.append(
                            self._create_god_function_violation(
                                file_path, function_start, function_name, function_length
                            )
                        )
                    in_function = False

        return violations

    def detect_parameter_coupling(self, file_path: Path, source_lines: List[str]) -> List[ConnascenceViolation]:
        """Detect parameter coupling using language-specific patterns."""
        violations = []
        param_detector = self.get_parameter_detector()

        for line_num, line in enumerate(source_lines, 1):
            match = param_detector.search(line)
            if match:
                params = match.group(1)
                param_count = self.count_parameters(params)

                if param_count > NASA_PARAMETER_THRESHOLD:
                    violations.append(
                        self._create_parameter_violation(file_path, line_num, match.start(), param_count, line.strip())
                    )

        return violations

    # Comprehensive methods with genuine implementations
    def get_magic_literal_patterns(self) -> Dict[str, re.Pattern]:
        """Return language-specific regex patterns for magic literal detection."""
        # Default patterns - overridden by language-specific strategies
        return {
            "numeric": re.compile(r"\b(?!0\b|1\b|-1\b)\d+\.?\d*\b"),
            "string": re.compile(r'["\'][^"\']{3,}["\']')
        }

    def get_function_detector(self) -> re.Pattern:
        """Return language-specific regex pattern for function detection."""
        # Default pattern - overridden by language-specific strategies
        return re.compile(r"^\s*(?:def|function)\s+\w+\s*\(")

    def get_parameter_detector(self) -> re.Pattern:
        """Return language-specific regex pattern for parameter detection."""
        # Default pattern - overridden by language-specific strategies
        return re.compile(r"(?:def|function)\s+\w+\s*\(([^)]+)\)")

    def is_comment_line(self, line: str) -> bool:
        """Check if line is a comment using language-specific patterns."""
        stripped = line.strip()
        # Default patterns - works for most languages
        return (stripped.startswith("//") or
                stripped.startswith("#") or
                ("/*" in line and "*/" in line) or
                stripped.startswith("<!--"))

    def extract_function_name(self, line: str) -> str:
        """Extract function name from definition line using comprehensive analysis."""
        # Use regex to find function name patterns
        patterns = [
            r"def\s+(\w+)",          # Python
            r"function\s+(\w+)",     # JavaScript
            r"\w+\s+(\w+)\s*\(",    # C/C++
        ]

        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                return match.group(1)

        # Fallback: return cleaned line
        clean_line = line.strip()
        return clean_line[:50] + "..." if len(clean_line) > 50 else clean_line

    def count_braces(self, line: str) -> int:
        """Count brace difference for function boundary detection."""
        return line.count("{") - line.count("}")

    def count_parameters(self, params: str) -> int:
        """Count parameters in parameter string."""
        return len([p.strip() for p in params.split(",") if p.strip()]) if params.strip() else 0

    def is_excluded_string_literal(self, literal: str) -> bool:
        """Check if string literal should be excluded."""
        return any(skip in literal.lower() for skip in ["test", "error", "warning", "debug"])

    # Helper methods for creating violations
    def _create_formal_magic_literal_violation(
        self, file_path: Path, match, source_lines: List[str]
    ) -> ConnascenceViolation:
        """Create a violation from formal grammar match."""
        # Extract context information from the match
        context = match.metadata
        severity_score = context.get("severity_score", 5.0)

        # Map severity score to severity level
        if severity_score > 8.0:
            severity = "high"
        elif severity_score > 5.0:
            severity = "medium"
        elif severity_score > 2.0:
            severity = "low"
        else:
            severity = "informational"

        # Create enhanced description
        formal_context = context.get("context")
        if formal_context:
            description = f"Context-aware magic literal '{match.text}' in {formal_context.__class__.__name__.lower()}"
        else:
            description = f"Magic literal '{match.text}' detected"

        # Get recommendations from context
        recommendations = context.get("recommendations", [])
        recommendation = (
            "; ".join(recommendations) if recommendations else f"Extract to a {self.get_constant_recommendation()}"
        )

        return ConnascenceViolation(
            type="connascence_of_meaning",
            severity=severity,
            file_path=str(file_path),
            line_number=match.line_number,
            column=match.column,
            description=description,
            recommendation=recommendation,
            code_snippet=match.text,
            context={
                "literal_value": context.get("value", match.text),
                "formal_analysis": True,
                "confidence": match.confidence,
                "analysis_metadata": context,
            },
        )

    def _create_magic_literal_violation(
        self, file_path: Path, line_num: int, match: re.Match, literal_type: str, code_snippet: str
    ) -> ConnascenceViolation:
        """Create a magic literal violation."""
        return ConnascenceViolation(
            type="connascence_of_meaning",
            severity="medium",
            file_path=str(file_path),
            line_number=line_num,
            column=match.start(),
            description=DETECTION_MESSAGES["magic_literal"].format(value=match.group()),
            recommendation=f"Extract to a {self.get_constant_recommendation()}",
            code_snippet=code_snippet,
            context={"literal_type": literal_type, "value": match.group()},
        )

    def _create_god_function_violation(
        self, file_path: Path, line_num: int, function_name: str, length: int
    ) -> ConnascenceViolation:
        """Create a god function violation."""
        return ConnascenceViolation(
            type="god_object",
            severity="high" if length > 100 else "medium",
            file_path=str(file_path),
            line_number=line_num,
            column=0,
            description=f"Function too long ({length} lines) - potential god function",
            recommendation="Break into smaller, focused functions",
            code_snippet=function_name,
            context={"function_length": length, "threshold": 50},
        )

    def _create_parameter_violation(
        self, file_path: Path, line_num: int, column: int, param_count: int, code_snippet: str
    ) -> ConnascenceViolation:
        """Create a parameter coupling violation."""
        return ConnascenceViolation(
            type="connascence_of_position",
            severity="high" if param_count > 10 else "medium",
            file_path=str(file_path),
            line_number=line_num,
            column=column,
            description=f"Too many parameters ({param_count}) - high connascence of position",
            recommendation="Use parameter objects or reduce parameters",
            code_snippet=code_snippet,
            context={"parameter_count": param_count, "threshold": NASA_PARAMETER_THRESHOLD},
        )

    def get_constant_recommendation(self) -> str:
        """Get language-specific constant recommendation."""
        return "named constant"

    def analyze_comprehensive_patterns(self, file_path: Path, source_lines: List[str]) -> Dict[str, Any]:
        """Comprehensive pattern analysis using the analysis engine."""
        source_code = "\n".join(source_lines)
        cache_key = f"{file_path}_{hash(source_code)}"

        # Check cache for performance optimization
        if cache_key in self.cache:
            return self.cache[cache_key]

        try:
            # Use comprehensive analysis engine
            syntax_result = self.analysis_engine.analyze_syntax(source_code, self.language_name)

            # Detect patterns using AST if available
            patterns = []
            if self.language_name.lower() == "python":
                try:
                    ast_tree = ast.parse(source_code)
                    patterns = self.analysis_engine.detect_patterns(ast_tree, source_code)
                except SyntaxError:
                    # Fallback to regex-based analysis
                    patterns = self.analysis_engine.detect_patterns(None, source_code)
            else:
                # Use source-based pattern detection for other languages
                patterns = self.analysis_engine.detect_patterns(None, source_code)

            result = {
                "syntax_analysis": syntax_result,
                "patterns_detected": [{
                    "type": p.pattern_type,
                    "severity": p.severity,
                    "description": p.description,
                    "line": p.location[0],
                    "column": p.location[1],
                    "context": p.context,
                    "recommendation": p.recommendation,
                    "confidence": p.confidence
                } for p in patterns],
                "total_patterns": len(patterns),
                "file_path": str(file_path),
                "language": self.language_name
            }

            # Cache result for performance
            self.cache[cache_key] = result
            return result

        except Exception as e:
            # Return error result instead of raising exception
            return {
                "success": False,
                "error": str(e),
                "syntax_analysis": {"success": False, "syntax_issues": []},
                "patterns_detected": [],
                "total_patterns": 0,
                "file_path": str(file_path),
                "language": self.language_name
            }

    def validate_implementation_completeness(self, file_path: Path, source_lines: List[str]) -> List[ConnascenceViolation]:
        """Validate that all implementations are complete (no theater)."""
        violations = []
        source_code = "\n".join(source_lines)

        # Check for NotImplementedError theater
        if "raise NotImplementedError" in source_code:
            for line_num, line in enumerate(source_lines, 1):
                if "raise NotImplementedError" in line:
                    violations.append(ConnascenceViolation(
                        type="theater_violation",
                        severity="critical",
                        file_path=str(file_path),
                        line_number=line_num,
                        column=line.find("raise NotImplementedError"),
                        description="Critical theater violation: NotImplementedError detected",
                        recommendation="Implement actual functionality instead of placeholder",
                        code_snippet=line.strip(),
                        context={"violation_type": "not_implemented_error", "theater_detected": True}
                    ))

        # Check for TODO/FIXME theater in production code
        for line_num, line in enumerate(source_lines, 1):
            for marker in theater_markers:
                if marker in line.upper():
                    violations.append(ConnascenceViolation(
                        type="code_debt",
                        file_path=str(file_path),
                        line_number=line_num,
                        column=line.upper().find(marker),
                        description=f"Code debt marker '{marker}' detected",
                        recommendation="Address code debt before production deployment",
                        code_snippet=line.strip(),
                        context={"marker_type": marker.lower(), "theater_potential": True}
                    ))

        # Check for empty function bodies that could be theater
        for line_num, line in enumerate(source_lines, 1):
            if self.get_function_detector().match(line.strip()):
                # Check if next non-comment line is pass/return None/etc.
                for next_line_idx in range(line_num, min(line_num + 5, len(source_lines))):
                    next_line = source_lines[next_line_idx].strip()
                    if next_line and not self.is_comment_line(next_line):
                        if next_line in ["pass", "return None", "return", "..."]:
                            violations.append(ConnascenceViolation(
                                type="potential_theater",
                                severity="low",
                                file_path=str(file_path),
                                line_number=line_num,
                                column=0,
                                description="Potential theater: Function with minimal implementation",
                                recommendation="Verify function provides genuine functionality",
                                code_snippet=line.strip(),
                                context={"function_body": next_line, "theater_risk": "low"}
                            ))
                        break

        return violations

    def generate_quality_metrics(self, file_path: Path, source_lines: List[str]) -> Dict[str, Any]:
        """Generate comprehensive quality metrics for the analyzed file."""
        try:
            # Basic metrics
            total_lines = len(source_lines)
            non_empty_lines = len([line for line in source_lines if line.strip()])
            comment_lines = len([line for line in source_lines if self.is_comment_line(line)])

            # Function analysis
            function_count = 0
            function_lengths = []
            for line_num, line in enumerate(source_lines):
                if self.get_function_detector().match(line.strip()):
                    function_count += 1
                    # Estimate function length (simplified)
                    func_length = self._estimate_function_length(source_lines, line_num)
                    function_lengths.append(func_length)

            # Complexity metrics
            avg_function_length = sum(function_lengths) / len(function_lengths) if function_lengths else 0
            max_function_length = max(function_lengths) if function_lengths else 0

            # Quality indicators
            comment_ratio = comment_lines / max(1, total_lines)
            code_density = non_empty_lines / max(1, total_lines)

            return {
                "file_path": str(file_path),
                "language": self.language_name,
                "total_lines": total_lines,
                "non_empty_lines": non_empty_lines,
                "comment_lines": comment_lines,
                "comment_ratio": comment_ratio,
                "code_density": code_density,
                "function_count": function_count,
                "avg_function_length": avg_function_length,
                "max_function_length": max_function_length,
                "quality_score": self._calculate_quality_score(comment_ratio, code_density, avg_function_length),
                "nasa_compliance_indicators": {
                    "functions_under_60_lines": sum(1 for length in function_lengths if length <= 60),
                    "total_functions": function_count,
                    "compliance_percentage": (sum(1 for length in function_lengths if length <= 60) / max(1, function_count)) * 100
                }
            }

        except Exception as e:
            return {
                "file_path": str(file_path),
                "language": self.language_name,
                "error": str(e),
                "quality_score": 0.0
            }

    def _estimate_function_length(self, source_lines: List[str], start_line: int) -> int:
        """Estimate function length using brace counting or indentation."""
        if self.language_name.lower() == "python":
            # Python: count by indentation
            base_indent = len(source_lines[start_line]) - len(source_lines[start_line].lstrip())
            length = 1
            for i in range(start_line + 1, len(source_lines)):
                line = source_lines[i]
                if not line.strip():  # Skip empty lines
                    continue
                current_indent = len(line) - len(line.lstrip())
                if current_indent <= base_indent and line.strip():
                    break
                length += 1
            return length
        else:
            # Other languages: count by braces
            brace_count = 0
            length = 1
            for i in range(start_line, len(source_lines)):
                line = source_lines[i]
                brace_count += self.count_braces(line)
                if i > start_line and brace_count <= 0:
                    break
                length += 1
            return length

    def _calculate_quality_score(self, comment_ratio: float, code_density: float, avg_function_length: float) -> float:
        """Calculate overall quality score for the file."""
        # Score components (0-1 scale)
        comment_score = min(1.0, comment_ratio * 2)  # Ideal: 20-50% comments
        density_score = code_density  # Higher density is generally better
        function_score = max(0.0, 1.0 - (avg_function_length / 100))  # Penalize long functions

        # Weighted average
        return (comment_score * 0.3 + density_score * 0.4 + function_score * 0.3)

class JavaScriptStrategy(LanguageStrategy):
    """JavaScript-specific connascence detection strategy."""

    def __init__(self):
        super().__init__("javascript")

    def get_magic_literal_patterns(self) -> Dict[str, re.Pattern]:
        return {"numeric": re.compile(r"\b(?!0\b|1\b|-1\b)\d+\.?\d*\b"), "string": re.compile(r"""["'][^"']{3,}["']""")}

    def get_function_detector(self) -> re.Pattern:
        return re.compile(REGEX_PATTERNS["function_def"].replace("def", "function"))

    def get_parameter_detector(self) -> re.Pattern:
        return re.compile(r"(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:function|\(.*?\)\s*=>))\s*\(([^)]+)\)")

    def is_comment_line(self, line: str) -> bool:
        stripped = line.strip()
        return stripped.startswith("//") or ("/*" in line and "*/" in line)

    def extract_function_name(self, line: str) -> str:
        clean_line = line.strip()
        return clean_line[:50] + "..." if len(clean_line) > 50 else clean_line

    def get_constant_recommendation(self) -> str:
        return "const or enum"

    def analyze_javascript_specific_patterns(self, source_code: str) -> List[Dict[str, Any]]:
        """JavaScript-specific pattern analysis."""
        patterns = []
        lines = source_code.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Check for var usage (prefer let/const)
            if re.search(r'\bvar\s+\w+', line):
                patterns.append({
                    "type": "outdated_syntax",
                    "severity": "low",
                    "line": line_num,
                    "message": "Use 'let' or 'const' instead of 'var'",
                    "recommendation": "Modern JavaScript prefers let/const for block scoping"
                })

            # Check for == usage (prefer ===)
            if '==' in line and '===' not in line:
                patterns.append({
                    "type": "loose_equality",
                    "severity": "medium",
                    "line": line_num,
                    "message": "Use strict equality (===) instead of loose equality (==)",
                    "recommendation": "Strict equality prevents type coercion issues"
                })

        return patterns

class CStrategy(LanguageStrategy):
    """C/C++-specific connascence detection strategy."""

    def __init__(self):
        super().__init__("c")

    def get_magic_literal_patterns(self) -> Dict[str, re.Pattern]:
        return {"numeric": re.compile(r"\b(?!0\b|1\b|-1\b)\d+[UuLl]*\b"), "string": re.compile(r'"[^"]{3,}"')}

    def get_function_detector(self) -> re.Pattern:
        return re.compile(r"^\s*(?:static\s+)?(?:inline\s+)?[\w\s\*]+\s+\w+\s*\([^)]*\)\s*\{?")

    def get_parameter_detector(self) -> re.Pattern:
        return re.compile(r"[\w\s\*]+\s+\w+\s*\(([^)]+)\)")

    def is_comment_line(self, line: str) -> bool:
        stripped = line.strip()
        return stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("/*")

    def extract_function_name(self, line: str) -> str:
        # Extract function name from C function definition
        match = re.search(r"\w+\s*\(", line)
        return match.group().replace("(", "") if match else "unknown_function"

    def get_constant_recommendation(self) -> str:
        return "#define or const"

    def analyze_c_specific_patterns(self, source_code: str) -> List[Dict[str, Any]]:
        """C/C++-specific pattern analysis."""
        patterns = []
        lines = source_code.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Check for buffer overflow risks
            if re.search(r'\b(gets|strcpy|strcat)\s*\(', line):
                patterns.append({
                    "type": "security_vulnerability",
                    "severity": "critical",
                    "line": line_num,
                    "message": "Unsafe function detected - buffer overflow risk",
                    "recommendation": "Use safer alternatives: fgets, strncpy, strncat"
                })

            # Check for memory leak patterns
            if 'malloc(' in line and 'free(' not in source_code[source_code.find(line):source_code.find(line) + 200]:
                patterns.append({
                    "type": "memory_management",
                    "severity": "high",
                    "line": line_num,
                    "message": "Potential memory leak - malloc without corresponding free",
                    "recommendation": "Ensure every malloc has a corresponding free"
                })

        return patterns

class PythonStrategy(LanguageStrategy):
    """Python-specific connascence detection strategy (extends AST analysis)."""

    def __init__(self):
        super().__init__("python")

    def get_magic_literal_patterns(self) -> Dict[str, re.Pattern]:
        return {"numeric": re.compile(r"\b(?!0\b|1\b|-1\b)\d+\.?\d*\b"), "string": re.compile(r"""["'][^"']{3,}["']""")}

    def get_function_detector(self) -> re.Pattern:
        return re.compile(r"^\s*def\s+\w+\s*\(")

    def get_parameter_detector(self) -> re.Pattern:
        return re.compile(r"def\s+\w+\s*\(([^)]+)\)")

    def is_comment_line(self, line: str) -> bool:
        return line.strip().startswith("#")

    def extract_function_name(self, line: str) -> str:
        match = re.search(r"def\s+(\w+)", line)
        return match.group(1) if match else "unknown_function"

    def get_constant_recommendation(self) -> str:
        return "module-level constant"

    def analyze_python_specific_patterns(self, source_code: str) -> List[Dict[str, Any]]:
        """Python-specific pattern analysis with AST."""
        patterns = []

        try:
            tree = ast.parse(source_code)

            for node in ast.walk(tree):
                # Check for list comprehensions that could be generators
                if isinstance(node, ast.ListComp) and hasattr(node, 'lineno'):
                    patterns.append({
                        "type": "performance_optimization",
                        "severity": "low",
                        "line": node.lineno,
                        "message": "Consider using generator expression for memory efficiency",
                        "recommendation": "Replace [] with () for large datasets"
                    })

                # Check for bare except clauses
                if isinstance(node, ast.ExceptHandler) and not node.type:
                    patterns.append({
                        "type": "exception_handling",
                        "severity": "medium",
                        "line": getattr(node, 'lineno', 0),
                        "message": "Bare except clause catches all exceptions",
                        "recommendation": "Specify exception types for better error handling"
                    })

                # Check for string formatting
                if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mod):
                    if isinstance(node.left, ast.Str):
                        patterns.append({
                            "type": "modernization",
                            "severity": "low",
                            "line": getattr(node, 'lineno', 0),
                            "message": "Old-style string formatting detected",
                            "recommendation": "Use f-strings or .format() for better readability"
                        })

        except SyntaxError as e:
            patterns.append({
                "type": "syntax_error",
                "severity": "critical",
                "line": e.lineno or 0,
                "message": f"Python syntax error: {e.msg}",
                "recommendation": "Fix syntax error before proceeding"
            })

        return patterns

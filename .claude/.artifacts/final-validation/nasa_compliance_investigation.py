from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_RETRY_ATTEMPTS, QUALITY_GATE_MINIMUM_PASS_RATE, REGULATORY_FACTUALITY_REQUIREMENT
#!/usr/bin/env python3
"""
NASA Compliance Investigation
============================

Detailed investigation of NASA POT10 compliance issues to identify
specific violations causing the 85% score and recommend fixes.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import ast

class NASAComplianceInvestigator:
    """Investigate specific NASA POT10 compliance violations."""
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.artifacts_dir = self.project_root / ".claude" / ".artifacts"
        
        # NASA POT10 Rules
        self.nasa_rules = {
            "rule_1": {"name": "No function calls in expressions", "max_violations": 0},
            "rule_2": {"name": "No more than one level of pointer dereferencing", "max_violations": 0},
            "rule_3": {"name": "No assignment in conditional expressions", "max_violations": 0},
            "rule_4": {"name": "Function length <= 60 lines", "max_violations": 0},
            "rule_5": {"name": "Assertions for error conditions", "weight": 0.8},
            "rule_6": {"name": "Return value checking", "weight": 0.9},
            "rule_7": {"name": "Limit preprocessor use", "weight": 0.9},
            "rule_8": {"name": "Limit pointer use", "weight": 0.9},
            "rule_9": {"name": "No recursion", "max_violations": 0},
            "rule_10": {"name": "No dynamic memory allocation", "weight": 0.9}
        }
    
    def investigate_compliance_failures(self) -> Dict[str, Any]:
        """Investigate detailed NASA compliance failures."""
        investigation = {
            "timestamp": "2025-09-10T19:45:00Z",
            "current_score": QUALITY_GATE_MINIMUM_PASS_RATE,
            "target_score": 0.90,
            "gap_analysis": {},
            "specific_violations": {},
            "remediation_plan": {},
            "quick_fixes": []
        }
        
        # Analyze current violations
        self.analyze_function_lengths(investigation)
        self.analyze_complexity_violations(investigation)
        self.analyze_defensive_programming(investigation)
        self.generate_remediation_plan(investigation)
        
        return investigation
    
    def analyze_function_lengths(self, investigation: Dict[str, Any]) -> None:
        """Analyze function length violations (Rule 4)."""
        violations = []
        python_files = list(self.project_root.glob("**/*.py"))
        
        for file_path in python_files:
            if self.should_skip_file(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        # Calculate function length
                        func_lines = node.end_lineno - node.lineno + 1
                        if func_lines > 60:
                            violations.append({
                                "file": str(file_path.relative_to(self.project_root)),
                                "function": node.name,
                                "lines": func_lines,
                                "start_line": node.lineno,
                                "severity": "critical" if func_lines > 100 else "high"
                            })
                            
            except Exception as e:
                print(f"Error analyzing {file_path}: {e}")
        
        investigation["specific_violations"]["long_functions"] = violations
        investigation["gap_analysis"]["rule_4_violations"] = len(violations)
    
    def analyze_complexity_violations(self, investigation: Dict[str, Any]) -> None:
        """Analyze complexity-related violations."""
        complexity_issues = []
        
        # Check for nested structures (approximation of complexity)
        python_files = list(self.project_root.glob("**/*.py"))
        
        for file_path in python_files:
            if self.should_skip_file(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        complexity = self.calculate_complexity(node)
                        if complexity > 10:  # High complexity threshold
                            complexity_issues.append({
                                "file": str(file_path.relative_to(self.project_root)),
                                "function": node.name,
                                "complexity": complexity,
                                "start_line": node.lineno
                            })
                            
            except Exception as e:
                print(f"Error analyzing complexity in {file_path}: {e}")
        
        investigation["specific_violations"]["high_complexity"] = complexity_issues
        investigation["gap_analysis"]["complexity_violations"] = len(complexity_issues)
    
    def calculate_complexity(self, node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function."""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.With)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity
    
    def analyze_defensive_programming(self, investigation: Dict[str, Any]) -> None:
        """Analyze defensive programming violations (Rule 5)."""
        missing_assertions = []
        python_files = list(self.project_root.glob("**/*.py"))
        
        for file_path in python_files:
            if self.should_skip_file(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        has_assertions = any(
                            isinstance(child, ast.Assert) 
                            for child in ast.walk(node)
                        )
                        
                        # Check for parameter validation
                        has_param_validation = self.has_parameter_validation(node)
                        
                        if not has_assertions and not has_param_validation and len(node.args.args) > 0:
                            missing_assertions.append({
                                "file": str(file_path.relative_to(self.project_root)),
                                "function": node.name,
                                "parameters": len(node.args.args),
                                "start_line": node.lineno
                            })
                            
            except Exception as e:
                print(f"Error analyzing defensive programming in {file_path}: {e}")
        
        investigation["specific_violations"]["missing_assertions"] = missing_assertions
        investigation["gap_analysis"]["defensive_programming_violations"] = len(missing_assertions)
    
    def has_parameter_validation(self, node: ast.FunctionDef) -> bool:
        """Check if function has parameter validation."""
        for child in ast.walk(node):
            if isinstance(child, ast.If):
                # Look for parameter checks
                if isinstance(child.test, ast.Compare):
                    return True
            elif isinstance(child, ast.Raise):
                # Look for explicit raises
                return True
        return False
    
    def should_skip_file(self, file_path: Path) -> bool:
        """Determine if file should be skipped in analysis."""
        skip_patterns = [
            "__pycache__",
            ".git",
            "node_modules",
            "venv",
            ".env",
            "test_",
            "_test.py",
            "conftest.py"
        ]
        
        path_str = str(file_path)
        return any(pattern in path_str for pattern in skip_patterns)
    
    def generate_remediation_plan(self, investigation: Dict[str, Any]) -> None:
        """Generate specific remediation plan to reach 90% compliance."""
        violations = investigation["specific_violations"]
        
        # Calculate current impact
        total_functions = self.count_total_functions()
        current_violations = (
            len(violations.get("long_functions", [])) + 
            len(violations.get("high_complexity", [])) + 
            len(violations.get("missing_assertions", []))
        )
        
        # Calculate needed improvements
        current_score = 0.85
        target_score = REGULATORY_FACTUALITY_REQUIREMENT
        needed_improvement = target_score - current_score
        
        remediation = {
            "target_improvement": needed_improvement,
            "current_violations": current_violations,
            "total_functions": total_functions,
            "priority_fixes": [],
            "estimated_effort": "2-4 hours"
        }
        
        # Priority fixes
        if violations.get("long_functions"):
            for violation in violations["long_functions"][:3]:  # Top 3 critical
                remediation["priority_fixes"].append({
                    "type": "function_decomposition",
                    "file": violation["file"],
                    "function": violation["function"],
                    "current_lines": violation["lines"],
                    "target_lines": 60,
                    "estimated_effort": "30-60 minutes"
                })
        
        if violations.get("missing_assertions"):
            for violation in violations["missing_assertions"][:5]:  # Top 5
                remediation["priority_fixes"].append({
                    "type": "add_parameter_validation",
                    "file": violation["file"],
                    "function": violation["function"],
                    "parameters": violation["parameters"],
                    "estimated_effort": "10-15 minutes"
                })
        
        investigation["remediation_plan"] = remediation
        
        # Quick fixes that can be automated
        investigation["quick_fixes"] = [
            {
                "type": "add_assertions",
                "description": "Add parameter validation assertions to functions",
                "impact": "+MAXIMUM_RETRY_ATTEMPTS% compliance",
                "effort": "15 minutes",
                "automated": True
            },
            {
                "type": "split_long_functions", 
                "description": "Split functions > 60 lines into smaller functions",
                "impact": "+2% compliance",
                "effort": "API_TIMEOUT_SECONDS minutes",
                "automated": False
            },
            {
                "type": "add_docstrings",
                "description": "Add comprehensive docstrings with parameter validation",
                "impact": "+1% compliance", 
                "effort": "MAXIMUM_FUNCTION_PARAMETERS minutes",
                "automated": True
            }
        ]
    
    def count_total_functions(self) -> int:
        """Count total functions in the codebase."""
        total = 0
        python_files = list(self.project_root.glob("**/*.py"))
        
        for file_path in python_files:
            if self.should_skip_file(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        total += 1
                        
            except Exception as e:
                continue
        
        return total
    
    def save_investigation_results(self, investigation: Dict[str, Any]) -> None:
        """Save detailed investigation results."""
        output_file = self.artifacts_dir / "final-validation" / "nasa_compliance_investigation.json"
        output_file.parent.mkdir(exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(investigation, f, indent=2)
        
        # Create actionable report
        report_file = self.artifacts_dir / "final-validation" / "nasa_compliance_action_plan.md"
        with open(report_file, 'w') as f:
            f.write("# NASA POT10 Compliance Action Plan\n\n")
            f.write(f"**Current Score:** {investigation['current_score']:.1%}\n")
            f.write(f"**Target Score:** {investigation['target_score']:.1%}\n")
            f.write(f"**Gap:** {investigation['target_score'] - investigation['current_score']:.1%}\n\n")
            
            f.write("## Priority Fixes\n\n")
            for fix in investigation["remediation_plan"]["priority_fixes"]:
                f.write(f"- **{fix['type']}**: {fix['file']} - {fix['function']}\n")
                f.write(f"  - Effort: {fix['estimated_effort']}\n")
                if 'current_lines' in fix:
                    f.write(f"  - Current: {fix['current_lines']} lines, Target: {fix['target_lines']} lines\n")
                f.write("\n")
            
            f.write("## Quick Wins\n\n")
            for fix in investigation["quick_fixes"]:
                f.write(f"- **{fix['type']}**: {fix['description']}\n")
                f.write(f"  - Impact: {fix['impact']}\n")
                f.write(f"  - Effort: {fix['effort']}\n")
                f.write(f"  - Automated: {'Yes' if fix['automated'] else 'No'}\n\n")
        
        print(f"NASA compliance investigation saved to: {output_file}")
        print(f"Action plan saved to: {report_file}")


def main():
    """Main execution function."""
    project_root = Path.cwd()
    investigator = NASAComplianceInvestigator(project_root)
    investigation = investigator.investigate_compliance_failures()
    investigator.save_investigation_results(investigation)
    
    # Print summary
    print("\n=== NASA COMPLIANCE INVESTIGATION SUMMARY ===")
    print(f"Current Score: {investigation['current_score']:.1%}")
    print(f"Target Score: {investigation['target_score']:.1%}")
    print(f"Gap: {investigation['target_score'] - investigation['current_score']:.1%}")
    
    violations = investigation["specific_violations"]
    print(f"\nViolations Found:")
    print(f"- Long Functions (>60 lines): {len(violations.get('long_functions', []))}")
    print(f"- High Complexity Functions: {len(violations.get('high_complexity', []))}")
    print(f"- Missing Assertions: {len(violations.get('missing_assertions', []))}")
    
    print(f"\nQuick Fixes Available: {len(investigation['quick_fixes'])}")
    print(f"Estimated Total Effort: {investigation['remediation_plan']['estimated_effort']}")
    
    return investigation


if __name__ == "__main__":
    main()
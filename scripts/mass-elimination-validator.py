#!/usr/bin/env python3
"""
Mass Elimination Validator
Validates FSM decomposition and ensures NASA Rule 10 compliance
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple, Set
import re

class MassEliminationValidator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.src_path = self.base_path / "src"
        self.validation_results = {}

    def validate_elimination_results(self) -> Dict:
        """Validate all elimination results"""
        results = {
            "fsm_compliance": self.validate_fsm_compliance(),
            "nasa_rule10": self.validate_nasa_rule10(),
            "api_preservation": self.validate_api_preservation(),
            "test_coverage": self.validate_test_coverage(),
            "line_reduction": self.calculate_line_reduction(),
            "elimination_count": self.count_eliminations()
        }

        return results

    def validate_fsm_compliance(self) -> Dict:
        """Validate FSM structure compliance"""
        fsm_dirs = list(self.src_path.rglob("*-fsm"))
        compliance_results = {}

        for fsm_dir in fsm_dirs:
            component_name = fsm_dir.stem.replace('-fsm', '')
            compliance = {
                "has_core": (fsm_dir / f"{component_name}Core.ts").exists(),
                "has_facade": (fsm_dir / f"{component_name}Facade.ts").exists(),
                "has_state_machine": (fsm_dir / f"{component_name}StateMachine.ts").exists(),
                "has_types": (fsm_dir / f"{component_name}Types.ts").exists(),
                "component_count": len(list(fsm_dir.glob("*.ts"))),
                "total_lines": self.count_lines_in_directory(fsm_dir)
            }

            compliance["compliance_score"] = (
                compliance["has_core"] +
                compliance["has_facade"] +
                compliance["has_state_machine"] +
                compliance["has_types"]
            ) / 4.0

            compliance_results[component_name] = compliance

        return compliance_results

    def validate_nasa_rule10(self) -> Dict:
        """Validate NASA POT10 Rule compliance"""
        rule10_results = {}

        # Find all decomposed components
        fsm_dirs = list(self.src_path.rglob("*-fsm"))

        for fsm_dir in fsm_dirs:
            component_name = fsm_dir.stem.replace('-fsm', '')
            rule10_score = 0
            total_checks = 6

            # Check 1: File size compliance (<500 lines per file)
            oversized_files = []
            for ts_file in fsm_dir.glob("*.ts"):
                line_count = self.count_lines_in_file(ts_file)
                if line_count > 500:
                    oversized_files.append((str(ts_file), line_count))
                else:
                    rule10_score += 1

            # Check 2: Single responsibility per file
            if self.check_single_responsibility(fsm_dir):
                rule10_score += 1

            # Check 3: Clear separation of concerns
            if self.check_separation_of_concerns(fsm_dir):
                rule10_score += 1

            # Check 4: Interface segregation
            if self.check_interface_segregation(fsm_dir):
                rule10_score += 1

            # Check 5: Dependency inversion
            if self.check_dependency_inversion(fsm_dir):
                rule10_score += 1

            # Check 6: State isolation
            if self.check_state_isolation(fsm_dir):
                rule10_score += 1

            rule10_results[component_name] = {
                "score": rule10_score / total_checks,
                "oversized_files": oversized_files,
                "compliant": rule10_score >= 5
            }

        return rule10_results

    def validate_api_preservation(self) -> Dict:
        """Validate that original APIs are preserved through facades"""
        api_results = {}
        backup_files = list(self.src_path.rglob("*.ts.backup"))

        for backup_file in backup_files:
            original_name = backup_file.stem.replace('.ts', '')
            fsm_dir = backup_file.parent / f"{original_name}-fsm"
            facade_file = fsm_dir / f"{original_name}Facade.ts"

            if facade_file.exists():
                # Check if facade exports match original exports
                original_exports = self.extract_exports(backup_file)
                facade_exports = self.extract_exports(facade_file)

                api_results[original_name] = {
                    "facade_exists": True,
                    "exports_preserved": self.compare_exports(original_exports, facade_exports),
                    "original_exports": len(original_exports),
                    "facade_exports": len(facade_exports)
                }
            else:
                api_results[original_name] = {
                    "facade_exists": False,
                    "exports_preserved": False,
                    "original_exports": 0,
                    "facade_exports": 0
                }

        return api_results

    def validate_test_coverage(self) -> Dict:
        """Validate test coverage for decomposed components"""
        test_results = {}

        try:
            # Run jest coverage
            result = subprocess.run(
                ["npm", "run", "test:coverage"],
                cwd=self.base_path,
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                # Parse coverage output
                coverage_data = self.parse_coverage_output(result.stdout)
                test_results = {
                    "coverage_percentage": coverage_data.get("statements", 0),
                    "tests_passing": coverage_data.get("tests_passing", False),
                    "test_files": coverage_data.get("test_files", 0)
                }
            else:
                test_results = {
                    "error": "Test execution failed",
                    "stderr": result.stderr[:500]
                }

        except Exception as e:
            test_results = {
                "error": f"Coverage validation failed: {str(e)}"
            }

        return test_results

    def calculate_line_reduction(self) -> Dict:
        """Calculate line reduction from eliminations"""
        backup_files = list(self.src_path.rglob("*.ts.backup"))
        reduction_data = {}

        total_original_lines = 0
        total_decomposed_lines = 0

        for backup_file in backup_files:
            original_name = backup_file.stem.replace('.ts', '')
            original_lines = self.count_lines_in_file(backup_file)

            fsm_dir = backup_file.parent / f"{original_name}-fsm"
            decomposed_lines = self.count_lines_in_directory(fsm_dir) if fsm_dir.exists() else 0

            total_original_lines += original_lines
            total_decomposed_lines += decomposed_lines

            reduction_data[original_name] = {
                "original_lines": original_lines,
                "decomposed_lines": decomposed_lines,
                "reduction_percentage": ((original_lines - decomposed_lines) / original_lines * 100) if original_lines > 0 else 0
            }

        overall_reduction = ((total_original_lines - total_decomposed_lines) / total_original_lines * 100) if total_original_lines > 0 else 0

        return {
            "individual_reductions": reduction_data,
            "total_original_lines": total_original_lines,
            "total_decomposed_lines": total_decomposed_lines,
            "overall_reduction_percentage": overall_reduction
        }

    def count_eliminations(self) -> Dict:
        """Count successful eliminations"""
        backup_files = list(self.src_path.rglob("*.ts.backup"))
        fsm_dirs = list(self.src_path.rglob("*-fsm"))

        return {
            "eliminated_files": len(backup_files),
            "fsm_components_created": len(fsm_dirs),
            "successful_eliminations": len([
                f for f in backup_files
                if (f.parent / f"{f.stem.replace('.ts', '')}-fsm").exists()
            ])
        }

    def count_lines_in_file(self, file_path: Path) -> int:
        """Count lines in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return len(f.readlines())
        except Exception:
            return 0

    def count_lines_in_directory(self, dir_path: Path) -> int:
        """Count total lines in all TypeScript files in directory"""
        if not dir_path.exists():
            return 0

        total_lines = 0
        for ts_file in dir_path.glob("*.ts"):
            total_lines += self.count_lines_in_file(ts_file)

        return total_lines

    def check_single_responsibility(self, fsm_dir: Path) -> bool:
        """Check if components follow single responsibility principle"""
        # Each file should have only one primary class/interface
        for ts_file in fsm_dir.glob("*.ts"):
            try:
                with open(ts_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                class_count = len(re.findall(r'export class', content))
                if class_count > 1:
                    return False

            except Exception:
                continue

        return True

    def check_separation_of_concerns(self, fsm_dir: Path) -> bool:
        """Check if concerns are properly separated"""
        expected_files = ['Core.ts', 'Facade.ts', 'StateMachine.ts', 'Types.ts']
        actual_files = [f.name for f in fsm_dir.glob("*.ts")]

        # At least 3 of 4 expected separation patterns should exist
        matches = sum(1 for expected in expected_files if any(expected in actual for actual in actual_files))
        return matches >= 3

    def check_interface_segregation(self, fsm_dir: Path) -> bool:
        """Check if interfaces are properly segregated"""
        types_file = next((f for f in fsm_dir.glob("*Types.ts")), None)
        if not types_file:
            return False

        try:
            with open(types_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check for multiple small interfaces vs one large interface
            interface_count = len(re.findall(r'export interface', content))
            return interface_count >= 2

        except Exception:
            return False

    def check_dependency_inversion(self, fsm_dir: Path) -> bool:
        """Check if dependencies are properly inverted"""
        facade_file = next((f for f in fsm_dir.glob("*Facade.ts")), None)
        if not facade_file:
            return False

        try:
            with open(facade_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check for dependency injection patterns
            has_constructor_injection = 'constructor(' in content and 'private' in content
            has_interface_dependencies = 'import' in content and 'interface' in content

            return has_constructor_injection or has_interface_dependencies

        except Exception:
            return False

    def check_state_isolation(self, fsm_dir: Path) -> bool:
        """Check if state is properly isolated"""
        state_machine_file = next((f for f in fsm_dir.glob("*StateMachine.ts")), None)
        if not state_machine_file:
            return False

        try:
            with open(state_machine_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check for proper state encapsulation
            has_private_state = 'private' in content and 'state' in content
            has_state_interface = 'interface' in content and 'State' in content

            return has_private_state and has_state_interface

        except Exception:
            return False

    def extract_exports(self, file_path: Path) -> Set[str]:
        """Extract export names from a TypeScript file"""
        exports = set()

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find export statements
            export_patterns = [
                r'export class (\w+)',
                r'export interface (\w+)',
                r'export type (\w+)',
                r'export function (\w+)',
                r'export const (\w+)',
                r'export default (\w+)'
            ]

            for pattern in export_patterns:
                matches = re.findall(pattern, content)
                exports.update(matches)

        except Exception:
            pass

        return exports

    def compare_exports(self, original_exports: Set[str], facade_exports: Set[str]) -> bool:
        """Compare original exports with facade exports"""
        # Facade should preserve at least 80% of original exports
        if not original_exports:
            return True

        preserved_ratio = len(original_exports.intersection(facade_exports)) / len(original_exports)
        return preserved_ratio >= 0.8

    def parse_coverage_output(self, output: str) -> Dict:
        """Parse jest coverage output"""
        coverage_data = {}

        try:
            # Extract coverage percentage
            coverage_match = re.search(r'All files\s+\|\s+([0-9.]+)', output)
            if coverage_match:
                coverage_data["statements"] = float(coverage_match.group(1))

            # Check if tests are passing
            coverage_data["tests_passing"] = "Tests:" in output and "failed" not in output.lower()

            # Count test files
            test_file_matches = re.findall(r'\.test\.ts', output)
            coverage_data["test_files"] = len(test_file_matches)

        except Exception:
            pass

        return coverage_data

    def generate_validation_report(self, results: Dict) -> str:
        """Generate comprehensive validation report"""
        report_lines = [
            "# Mass Elimination Validation Report",
            "",
            "## Summary",
            f"- Eliminated files: {results['elimination_count']['eliminated_files']}",
            f"- FSM components created: {results['elimination_count']['fsm_components_created']}",
            f"- Success rate: {(results['elimination_count']['successful_eliminations'] / max(results['elimination_count']['eliminated_files'], 1)) * 100:.1f}%",
            "",
            "## FSM Compliance",
        ]

        for component, compliance in results["fsm_compliance"].items():
            report_lines.extend([
                f"### {component}",
                f"- Compliance score: {compliance['compliance_score']:.1f}",
                f"- Component count: {compliance['component_count']}",
                f"- Total lines: {compliance['total_lines']}",
                ""
            ])

        report_lines.extend([
            "## NASA Rule 10 Compliance",
            ""
        ])

        for component, rule10 in results["nasa_rule10"].items():
            report_lines.extend([
                f"### {component}",
                f"- Score: {rule10['score']:.1f}",
                f"- Compliant: {'Yes' if rule10['compliant'] else 'No'}",
                f"- Oversized files: {len(rule10['oversized_files'])}",
                ""
            ])

        report_lines.extend([
            "## Line Reduction",
            f"- Original lines: {results['line_reduction']['total_original_lines']}",
            f"- Decomposed lines: {results['line_reduction']['total_decomposed_lines']}",
            f"- Overall reduction: {results['line_reduction']['overall_reduction_percentage']:.1f}%",
            "",
            "## API Preservation",
        ])

        for component, api in results["api_preservation"].items():
            report_lines.extend([
                f"### {component}",
                f"- Facade exists: {'Yes' if api['facade_exists'] else 'No'}",
                f"- Exports preserved: {'Yes' if api['exports_preserved'] else 'No'}",
                ""
            ])

        return "\n".join(report_lines)

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()

    validator = MassEliminationValidator(base_path)

    print("SEARCH Validating mass elimination results...")
    results = validator.validate_elimination_results()

    # Generate and save report
    report_content = validator.generate_validation_report(results)
    report_file = Path(base_path) / "docs" / "MASS-ELIMINATION-VALIDATION.md"
    report_file.parent.mkdir(exist_ok=True)

    with open(report_file, 'w') as f:
        f.write(report_content)

    print(f"SUCCESS Validation complete. Report saved to: {report_file}")

    # Print summary
    print("\nCHART VALIDATION SUMMARY")
    print(f"Eliminated files: {results['elimination_count']['eliminated_files']}")
    print(f"Success rate: {(results['elimination_count']['successful_eliminations'] / max(results['elimination_count']['eliminated_files'], 1)) * 100:.1f}%")
    print(f"Line reduction: {results['line_reduction']['overall_reduction_percentage']:.1f}%")

if __name__ == "__main__":
    main()
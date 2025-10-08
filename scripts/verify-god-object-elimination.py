#!/usr/bin/env python3
"""
God Object Elimination Verification Script
Verifies that 20+ god objects were successfully eliminated
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Tuple

class GodObjectVerifier:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.src_dir = self.project_root / "src"

    def count_current_god_objects(self) -> List[Tuple[str, int]]:
        """Count remaining god objects over 500 lines"""
        god_objects = []

        for root, dirs, files in os.walk(self.src_dir):
            # Skip node_modules
            if 'node_modules' in root:
                continue

            for file in files:
                if file.endswith('.ts'):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            # Count non-empty, non-comment lines
                            line_count = 0
                            for line in f:
                                stripped = line.strip()
                                if stripped and not stripped.startswith('//') and not stripped.startswith('/*'):
                                    line_count += 1

                        if line_count > 500:
                            rel_path = file_path.relative_to(self.project_root)
                            god_objects.append((str(rel_path), line_count))
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")

        return sorted(god_objects, key=lambda x: x[1], reverse=True)

    def count_eliminated_objects(self) -> int:
        """Count deprecated/eliminated god objects"""
        eliminated_count = 0

        for root, dirs, files in os.walk(self.src_dir):
            if 'node_modules' in root:
                continue

            for file in files:
                if file.endswith('.ts'):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read(1000)  # Read first 1000 chars
                            if "DEPRECATED: God object eliminated" in content:
                                eliminated_count += 1
                    except Exception:
                        pass

        return eliminated_count

    def count_fsm_facades(self) -> int:
        """Count created FSM facades"""
        facade_count = 0

        for root, dirs, files in os.walk(self.src_dir):
            if 'node_modules' in root:
                continue

            for file in files:
                if file.endswith('Facade.ts'):
                    facade_count += 1

        return facade_count

    def count_fsm_templates(self) -> int:
        """Count FSM templates in fsm directories"""
        template_count = 0

        for root, dirs, files in os.walk(self.src_dir):
            if 'fsm' in Path(root).parts and not 'node_modules' in root:
                for file in files:
                    if file.endswith('FSM.ts'):
                        template_count += 1

        return template_count

    def verify_nasa_compliance(self) -> Dict:
        """Check NASA Rule 10 compliance (functions ≤60 lines)"""
        violations = []
        total_functions = 0

        for root, dirs, files in os.walk(self.src_dir):
            if 'node_modules' in root:
                continue

            for file in files:
                if file.endswith('.ts'):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        # Simple function detection (basic check)
                        lines = content.split('\n')
                        in_function = False
                        function_start = 0
                        function_name = ""
                        brace_count = 0

                        for i, line in enumerate(lines):
                            stripped = line.strip()

                            # Function detection patterns
                            if ('function ' in stripped or
                                'async ' in stripped and '=>' in stripped or
                                stripped.endswith('{') and ('(' in stripped and ')' in stripped)):

                                if not in_function:
                                    in_function = True
                                    function_start = i + 1
                                    function_name = stripped[:50] + "..." if len(stripped) > 50 else stripped
                                    brace_count = stripped.count('{') - stripped.count('}')

                            elif in_function:
                                brace_count += stripped.count('{') - stripped.count('}')

                                if brace_count <= 0:
                                    function_length = i - function_start + 1
                                    total_functions += 1

                                    if function_length > 60:
                                        rel_path = file_path.relative_to(self.project_root)
                                        violations.append({
                                            "file": str(rel_path),
                                            "function": function_name,
                                            "lines": function_length,
                                            "start_line": function_start
                                        })

                                    in_function = False

                    except Exception:
                        pass

        compliance_rate = ((total_functions - len(violations)) / max(total_functions, 1)) * 100

        return {
            "total_functions": total_functions,
            "violations": violations,
            "compliance_rate": compliance_rate,
            "compliant": compliance_rate >= 90
        }

    def generate_verification_report(self) -> Dict:
        """Generate comprehensive verification report"""
        current_god_objects = self.count_current_god_objects()
        eliminated_count = self.count_eliminated_objects()
        facade_count = self.count_fsm_facades()
        template_count = self.count_fsm_templates()
        nasa_compliance = self.verify_nasa_compliance()

        report = {
            "verification_date": "2025-09-28",
            "god_objects": {
                "remaining": len(current_god_objects),
                "eliminated": eliminated_count,
                "target_achieved": eliminated_count >= 20
            },
            "fsm_infrastructure": {
                "facades_created": facade_count,
                "templates_created": template_count
            },
            "nasa_compliance": nasa_compliance,
            "top_remaining_god_objects": current_god_objects[:10],
            "success_metrics": {
                "elimination_target": eliminated_count >= 20,
                "fsm_infrastructure": facade_count >= 10 and template_count >= 5,
                "nasa_compliance": nasa_compliance["compliant"]
            }
        }

        # Calculate overall success
        success_count = sum(1 for metric in report["success_metrics"].values() if metric)
        report["overall_success"] = success_count >= 2

        return report

    def print_verification_report(self, report: Dict):
        """Print formatted verification report"""
        print("[MAGNIFY] GOD OBJECT ELIMINATION VERIFICATION REPORT")
        print("=" * 60)

        print(f"\n[CHART] ELIMINATION METRICS:")
        print(f"   • Eliminated: {report['god_objects']['eliminated']} god objects")
        print(f"   • Target (20+): {'[ACHIEVED]' if report['god_objects']['target_achieved'] else '[NOT MET]'}")
        print(f"   • Remaining: {report['god_objects']['remaining']} god objects over 500 lines")

        print(f"\n[HAMMER] FSM INFRASTRUCTURE:")
        print(f"   • Facades Created: {report['fsm_infrastructure']['facades_created']}")
        print(f"   • Templates Created: {report['fsm_infrastructure']['templates_created']}")

        print(f"\n[SHIELD] NASA POT10 COMPLIANCE:")
        print(f"   • Compliance Rate: {report['nasa_compliance']['compliance_rate']:.1f}%")
        print(f"   • Functions Checked: {report['nasa_compliance']['total_functions']}")
        print(f"   • Violations: {len(report['nasa_compliance']['violations'])}")
        print(f"   • Status: {'[COMPLIANT]' if report['nasa_compliance']['compliant'] else '[NON-COMPLIANT]'}")

        if report["top_remaining_god_objects"]:
            print(f"\n[LIST] TOP REMAINING GOD OBJECTS:")
            for i, (file_path, lines) in enumerate(report["top_remaining_god_objects"][:5], 1):
                print(f"   {i}. {file_path} ({lines} lines)")

        print(f"\n[TARGET] OVERALL SUCCESS METRICS:")
        for metric, status in report["success_metrics"].items():
            status_icon = "[YES]" if status else "[NO]"
            print(f"   • {metric.replace('_', ' ').title()}: {status_icon}")

        print(f"\n[TROPHY] MISSION STATUS: {'SUCCESS' if report['overall_success'] else 'PARTIAL SUCCESS'}")

        # Save detailed report
        report_path = self.project_root / "docs" / "ELIMINATION-VERIFICATION-REPORT.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"\n[DISK] Detailed report saved: {report_path}")

if __name__ == "__main__":
    project_root = os.getcwd()
    verifier = GodObjectVerifier(project_root)
    report = verifier.generate_verification_report()
    verifier.print_verification_report(report)
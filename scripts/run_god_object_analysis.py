#!/usr/bin/env python3
"""
Standalone script to run God Object and Connascence analysis
"""

import json
import sys
import ast
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Add analyzer path
sys.path.insert(0, str(Path(__file__).parent.parent))

def analyze_god_objects(project_path: Path) -> Dict[str, Any]:
    """Analyze project for God Objects."""
    results = {
        "god_objects": [],
        "summary": {
            "total_god_objects": 0,
            "files_analyzed": 0,
            "critical_violations": 0
        }
    }

    METHOD_THRESHOLD = 18
    LOC_THRESHOLD = 700

    # Scan all Python files
    for py_file in project_path.rglob("*.py"):
        if "__pycache__" in str(py_file) or ".git" in str(py_file):
            continue

        results["summary"]["files_analyzed"] += 1

        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                source = f.read()
                tree = ast.parse(source)

            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    # Count methods
                    method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))

                    # Estimate lines
                    if hasattr(node, "end_lineno") and node.end_lineno:
                        loc = node.end_lineno - node.lineno
                    else:
                        loc = len(node.body) * 5

                    # Check if it's a God Object
                    if method_count > METHOD_THRESHOLD or loc > LOC_THRESHOLD:
                        god_object = {
                            "file": str(py_file.relative_to(project_path)),
                            "class_name": node.name,
                            "line_number": node.lineno,
                            "method_count": method_count,
                            "estimated_loc": loc,
                            "severity": "critical" if method_count > 25 or loc > 1000 else "high",
                            "violations": []
                        }

                        if method_count > METHOD_THRESHOLD:
                            god_object["violations"].append(f"Too many methods: {method_count} > {METHOD_THRESHOLD}")
                        if loc > LOC_THRESHOLD:
                            god_object["violations"].append(f"Too many lines: {loc} > {LOC_THRESHOLD}")

                        results["god_objects"].append(god_object)
                        results["summary"]["total_god_objects"] += 1
                        if god_object["severity"] == "critical":
                            results["summary"]["critical_violations"] += 1

        except Exception as e:
            print(f"Error analyzing {py_file}: {e}", file=sys.stderr)

    return results

def analyze_connascence(project_path: Path) -> Dict[str, Any]:
    """Analyze project for Connascence patterns."""
    results = {
        "connascence_violations": [],
        "by_type": {},
        "summary": {
            "total_violations": 0,
            "files_analyzed": 0,
            "critical_violations": 0
        }
    }

    connascence_types = [
        "name", "type", "meaning", "position", "algorithm",
        "execution", "timing", "values", "identity"
    ]

    for conn_type in connascence_types:
        results["by_type"][conn_type] = []

    # Scan all Python files
    for py_file in project_path.rglob("*.py"):
        if "__pycache__" in str(py_file) or ".git" in str(py_file):
            continue

        results["summary"]["files_analyzed"] += 1

        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                source = f.read()
                tree = ast.parse(source)

            # Analyze for various connascence types
            for node in ast.walk(tree):
                violations = []

                # Connascence of Name - duplicate names
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    violations.append({
                        "type": "name",
                        "node_type": node.__class__.__name__,
                        "name": node.name,
                        "line": node.lineno if hasattr(node, 'lineno') else 0
                    })

                # Connascence of Type - type dependencies
                if isinstance(node, ast.AnnAssign) and node.annotation:
                    violations.append({
                        "type": "type",
                        "node_type": "TypeAnnotation",
                        "line": node.lineno if hasattr(node, 'lineno') else 0
                    })

                # Connascence of Position - parameter order dependencies
                if isinstance(node, ast.Call) and len(node.args) > 3:
                    violations.append({
                        "type": "position",
                        "node_type": "FunctionCall",
                        "arg_count": len(node.args),
                        "line": node.lineno if hasattr(node, 'lineno') else 0,
                        "severity": "high" if len(node.args) > 5 else "medium"
                    })

                # Connascence of Algorithm - shared algorithms
                if isinstance(node, ast.Compare):
                    violations.append({
                        "type": "algorithm",
                        "node_type": "Comparison",
                        "line": node.lineno if hasattr(node, 'lineno') else 0
                    })

                # Connascence of Execution - order dependencies
                if isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                    violations.append({
                        "type": "execution",
                        "node_type": "Import",
                        "line": node.lineno if hasattr(node, 'lineno') else 0
                    })

                # Add violations to results
                for violation in violations:
                    violation["file"] = str(py_file.relative_to(project_path))
                    results["connascence_violations"].append(violation)
                    results["by_type"][violation["type"]].append(violation)
                    results["summary"]["total_violations"] += 1

                    if violation.get("severity") in ["high", "critical"]:
                        results["summary"]["critical_violations"] += 1

        except Exception as e:
            print(f"Error analyzing {py_file}: {e}", file=sys.stderr)

    return results

def main():
    """Main execution function."""
    project_path = Path.cwd()

    print("Starting comprehensive code analysis...")
    print(f"Project path: {project_path}")

    # Run God Object analysis
    print("\n[1/2] Analyzing God Objects...")
    god_object_results = analyze_god_objects(project_path)

    # Run Connascence analysis
    print("[2/2] Analyzing Connascence patterns...")
    connascence_results = analyze_connascence(project_path)

    # Combine results
    combined_results = {
        "timestamp": datetime.now().isoformat(),
        "project_path": str(project_path),
        "god_objects": god_object_results,
        "connascence": connascence_results,
        "overall_summary": {
            "total_files_analyzed": god_object_results["summary"]["files_analyzed"],
            "total_god_objects": god_object_results["summary"]["total_god_objects"],
            "total_connascence_violations": connascence_results["summary"]["total_violations"],
            "critical_issues": (
                god_object_results["summary"]["critical_violations"] +
                connascence_results["summary"]["critical_violations"]
            )
        }
    }

    # Create output directory
    output_dir = project_path / ".claude" / ".artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write God Objects JSON
    god_objects_file = output_dir / "god_object_analysis.json"
    with open(god_objects_file, 'w', encoding='utf-8') as f:
        json.dump(god_object_results, f, indent=2)
    print(f"\nGod Object analysis saved to: {god_objects_file}")

    # Write Connascence JSON
    connascence_file = output_dir / "connascence_analysis.json"
    with open(connascence_file, 'w', encoding='utf-8') as f:
        json.dump(connascence_results, f, indent=2)
    print(f"Connascence analysis saved to: {connascence_file}")

    # Write combined results
    combined_file = output_dir / "combined_analysis.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(combined_results, f, indent=2)
    print(f"Combined analysis saved to: {combined_file}")

    # Print summary
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    print(f"Files analyzed: {combined_results['overall_summary']['total_files_analyzed']}")
    print(f"God Objects found: {combined_results['overall_summary']['total_god_objects']}")
    print(f"Connascence violations: {combined_results['overall_summary']['total_connascence_violations']}")
    print(f"Critical issues: {combined_results['overall_summary']['critical_issues']}")

    if god_object_results["god_objects"]:
        print("\nTop God Objects:")
        for god_obj in god_object_results["god_objects"][:5]:
            print(f"  - {god_obj['file']}:{god_obj['class_name']} "
                  f"({god_obj['method_count']} methods, {god_obj['estimated_loc']} LOC)")

    print("\nConnascence Violations by Type:")
    for conn_type, violations in connascence_results["by_type"].items():
        if violations:
            print(f"  - {conn_type}: {len(violations)} violations")

    print("\n✓ Analysis complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
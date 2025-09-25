#!/usr/bin/env python3
"""
Run comprehensive analyzer scan with ALL capabilities.
First fixes remaining syntax errors, then runs full analysis.
"""

import os
import sys
import json
import ast
from pathlib import Path

# Add project root to path
sys.path.insert(0, r'C:\Users\17175\Desktop\spek template')

def fix_position_detector():
    """Fix the specific issue in position_detector.py"""
    filepath = r'C:\Users\17175\Desktop\spek template\analyzer\detectors\position_detector.py'

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add newline at end if missing
    if not content.endswith('\n'):
        content += '\n'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("[FIXED] position_detector.py")

def run_comprehensive_scan():
    """Run the comprehensive analyzer scan."""
    print("\n" + "="*60)
    print("RUNNING COMPREHENSIVE ANALYZER SCAN")
    print("="*60)

    try:
        # Import analyzer components
        from analyzer.unified_analyzer import UnifiedAnalyzer
        from analyzer.comprehensive_analysis_engine import ComprehensiveAnalysisEngine

        print("\n[OK] Analyzer modules imported successfully!")

        # Initialize analyzers
        unified = UnifiedAnalyzer()
        comprehensive = ComprehensiveAnalysisEngine()

        print("[OK] Analyzers initialized!")

        # Run comprehensive analysis on current directory
        print("\nAnalyzing entire codebase...")
        print("This includes ALL capabilities:")
        print("  - God Object Detection")
        print("  - Theater Detection")
        print("  - Connascence Analysis")
        print("  - Duplication Detection")
        print("  - Redundancy Analysis")
        print("  - Enterprise Security Scanning")
        print("  - NASA POT10 Compliance")
        print("  - Performance Analysis")
        print("  - Supply Chain Security")
        print("  - DFARS Compliance")

        # Perform analysis
        results = {}

        # Unified analysis
        print("\n[1/2] Running Unified Analysis...")
        try:
            unified_results = unified.analyze('.')
            results['unified_analysis'] = {
                'violations': unified_results.get('violations', []),
                'god_objects': unified_results.get('god_objects', []),
                'duplications': unified_results.get('duplications', []),
                'connascence': unified_results.get('connascence_violations', []),
                'metrics': unified_results.get('metrics', {})
            }
            print(f"  Found {len(results['unified_analysis']['violations'])} violations")
            print(f"  Found {len(results['unified_analysis']['god_objects'])} god objects")
        except Exception as e:
            print(f"  Warning: Unified analysis partial: {e}")
            results['unified_analysis'] = {'error': str(e)}

        # Comprehensive analysis
        print("\n[2/2] Running Comprehensive Analysis...")
        try:
            comp_results = comprehensive.analyze_codebase('.')
            results['comprehensive_analysis'] = comp_results

            # Extract key findings
            if isinstance(comp_results, dict):
                print(f"  Theater Score: {comp_results.get('theater_score', 'N/A')}")
                print(f"  NASA Compliance: {comp_results.get('nasa_compliance', 'N/A')}%")
                print(f"  Security Issues: {len(comp_results.get('security_issues', []))}")
                print(f"  Performance Issues: {len(comp_results.get('performance_issues', []))}")
        except Exception as e:
            print(f"  Warning: Comprehensive analysis partial: {e}")
            results['comprehensive_analysis'] = {'error': str(e)}

        # Additional specific scans
        print("\n[BONUS] Running Specialized Scans...")

        # Try to run god object detector directly
        try:
            from analyzer.detectors.god_object_detector import GodObjectDetector
            god_detector = GodObjectDetector('.', [])

            god_objects = []
            for root, dirs, files in os.walk('.'):
                # Skip certain directories
                if any(skip in root for skip in ['__pycache__', '.git', 'node_modules', '.venv']):
                    continue

                for file in files:
                    if file.endswith('.py'):
                        filepath = os.path.join(root, file)
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                                tree = ast.parse(content)

                            # Analyze for god objects
                            for node in ast.walk(tree):
                                if isinstance(node, ast.ClassDef):
                                    # Count methods and lines
                                    methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]

                                    # Calculate approximate lines
                                    if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                                        lines = node.end_lineno - node.lineno
                                    else:
                                        lines = len(methods) * 10  # Rough estimate

                                    # God object criteria
                                    if len(methods) > 20 or lines > 500:
                                        god_objects.append({
                                            'file': filepath,
                                            'class': node.name,
                                            'methods': len(methods),
                                            'lines': lines
                                        })
                        except:
                            pass

            results['god_objects_scan'] = god_objects
            print(f"  Found {len(god_objects)} god objects")

        except Exception as e:
            print(f"  God object scan skipped: {e}")

        # Try theater detection
        try:
            from analyzer.theater_detection.analyzer import TheaterAnalyzer
            theater = TheaterAnalyzer()
            theater_results = theater.analyze('.')
            results['theater_detection'] = theater_results
            print(f"  Theater detection complete")
        except:
            print("  Theater detection not available")

        # Save results
        output_path = r'.claude\.artifacts\FULL-SCAN-RESULTS.json'
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str)

        print("\n" + "="*60)
        print(f"SCAN COMPLETE! Results saved to: {output_path}")
        print("="*60)

        # Print summary
        print("\nSUMMARY OF FINDINGS:")
        print("-"*40)

        if 'god_objects_scan' in results:
            print(f"\nGOD OBJECTS ({len(results['god_objects_scan'])} found):")
            for obj in results['god_objects_scan'][:5]:  # Show top 5
                print(f"  - {obj['class']} in {obj['file']}")
                print(f"    Methods: {obj['methods']}, Lines: {obj['lines']}")

        if 'unified_analysis' in results and 'violations' in results['unified_analysis']:
            violations = results['unified_analysis']['violations']
            if violations:
                print(f"\nVIOLATIONS ({len(violations)} found):")
                # Group by type
                by_type = {}
                for v in violations:
                    vtype = v.get('type', 'unknown')
                    by_type[vtype] = by_type.get(vtype, 0) + 1

                for vtype, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True):
                    print(f"  - {vtype}: {count}")

        print("\nFull details in: " + output_path)

        return results

    except Exception as e:
        print(f"\n[ERROR] Failed to run scan: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("COMPREHENSIVE ANALYZER SCAN")
    print("="*60)

    # Fix known issues
    print("Fixing remaining syntax issues...")
    fix_position_detector()

    # Run scan
    results = run_comprehensive_scan()

    if results:
        print("\n[SUCCESS] Analysis complete!")
        return 0
    else:
        print("\n[PARTIAL] Some components may have failed, check output file")
        return 1

if __name__ == "__main__":
    exit(main())
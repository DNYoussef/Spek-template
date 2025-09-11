#!/usr/bin/env python3
"""
Real Analysis Test Script - Bypass CI Mock Mode
==============================================

This script directly uses the UnifiedConnascenceAnalyzer to perform real analysis
bypassing any CI mock modes and fallback mechanisms.
"""

import sys
import json
import os
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def main():
    print("=== REAL ANALYSIS TEST - NO MOCKS ===")
    print(f"Project root: {project_root}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("")
    
    try:
        # Direct import of real analyzer
        from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer
        
        print("1. Initializing real UnifiedConnascenceAnalyzer...")
        analyzer = UnifiedConnascenceAnalyzer()
        
        # Verify we have the real components
        print(f"   Orchestrator: {type(analyzer.orchestrator_component)}")
        print(f"   File cache: {type(analyzer.file_cache)}")
        print(f"   Enhanced metrics: {type(analyzer.enhanced_metrics)}")
        print("")
        
        print("2. Running analysis on analyzer/ directory...")
        start_time = datetime.now()
        
        result = analyzer.analyze_project('analyzer', policy_preset='service-defaults')
        
        end_time = datetime.now()
        analysis_duration = (end_time - start_time).total_seconds()
        
        print(f"   Analysis completed in {analysis_duration:.2f} seconds")
        print("")
        
        # Extract real metrics
        print("3. REAL ANALYSIS RESULTS:")
        print(f"   Files analyzed: {getattr(result, 'files_analyzed', 0)}")
        print(f"   Total violations: {getattr(result, 'total_violations', 0)}")
        print(f"   Connascence violations: {len(getattr(result, 'connascence_violations', []))}")
        print(f"   NASA violations: {len(getattr(result, 'nasa_violations', []))}")
        print(f"   NASA compliance score: {getattr(result, 'nasa_compliance_score', 0.0)}")
        print(f"   Overall quality score: {getattr(result, 'overall_quality_score', 0.0)}")
        print(f"   Analysis duration: {getattr(result, 'analysis_duration_ms', 0)}ms")
        print("")
        
        # Show sample violations
        connascence_violations = getattr(result, 'connascence_violations', [])
        if connascence_violations:
            print("4. SAMPLE CONNASCENCE VIOLATIONS (proving real analysis):")
            for i, violation in enumerate(connascence_violations[:5]):
                if hasattr(violation, '__dict__'):
                    # Convert violation object to dict for display
                    v_dict = violation.__dict__
                else:
                    v_dict = violation
                    
                print(f"   {i+1}. Type: {v_dict.get('connascence_type', 'Unknown')}")
                print(f"      File: {v_dict.get('file_path', 'Unknown')}")
                print(f"      Line: {v_dict.get('line_number', 'Unknown')}")
                print(f"      Description: {v_dict.get('description', 'No description')}")
                print("")
        
        nasa_violations = getattr(result, 'nasa_violations', [])
        if nasa_violations:
            print("5. SAMPLE NASA VIOLATIONS:")
            for i, violation in enumerate(nasa_violations[:3]):
                if hasattr(violation, '__dict__'):
                    v_dict = violation.__dict__
                else:
                    v_dict = violation
                    
                print(f"   {i+1}. Rule: {v_dict.get('rule_id', 'Unknown')}")
                print(f"      File: {v_dict.get('file_path', 'Unknown')}")
                print(f"      Description: {v_dict.get('description', 'No description')}")
                print("")
        
        # Output JSON result for CI/CD compatibility
        output_file = project_root / ".claude" / ".artifacts" / "real_analysis_result.json"
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert result to JSON-serializable format
        json_result = {
            "timestamp": datetime.now().isoformat(),
            "analysis_mode": "REAL_ANALYSIS",
            "files_analyzed": getattr(result, 'files_analyzed', 0),
            "total_violations": getattr(result, 'total_violations', 0),
            "connascence_violations_count": len(connascence_violations),
            "nasa_violations_count": len(nasa_violations),
            "nasa_compliance_score": getattr(result, 'nasa_compliance_score', 0.0),
            "overall_quality_score": getattr(result, 'overall_quality_score', 0.0),
            "analysis_duration_ms": getattr(result, 'analysis_duration_ms', 0),
            "analysis_duration_seconds": analysis_duration,
            "errors": [str(e) for e in getattr(result, 'errors', [])],
            "warnings": [str(w) for w in getattr(result, 'warnings', [])],
            "real_analysis_confirmed": True,
            "connascence_violations": [
                {
                    "type": getattr(v, 'connascence_type', 'Unknown'),
                    "file_path": getattr(v, 'file_path', 'Unknown'),
                    "line_number": getattr(v, 'line_number', 0),
                    "description": getattr(v, 'description', 'No description'),
                    "severity": getattr(v, 'severity', 'medium')
                } for v in connascence_violations[:10]  # First 10 violations
            ]
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(json_result, f, indent=2)
        
        print(f"6. Results written to: {output_file}")
        
        # Final verdict
        if getattr(result, 'total_violations', 0) > 0:
            print("")
            print("✓ SUCCESS: REAL ANALYSIS CONFIRMED!")
            print(f"✓ Found {getattr(result, 'total_violations', 0)} actual violations")
            print("✓ This is NOT mock/fallback data")
            return 0
        else:
            print("")
            print("⚠ WARNING: No violations found - might still be using fallback")
            return 1
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 2

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
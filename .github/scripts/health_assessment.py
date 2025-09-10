#!/usr/bin/env python3
"""Architecture health assessment script for GitHub Actions."""

import json
import sys

def assess_health():
    """Assess architecture health from analysis results."""
    try:
        with open(".claude/.artifacts/architecture_analysis.json", "r") as f:
            data = json.load(f)
        
        # Extract key metrics
        overview = data.get("system_overview", {})
        metrics = data.get("metrics", {})
        hotspots = data.get("architectural_hotspots", [])
        recommendations = data.get("recommendations", [])
        
        # Print summary
        print("\n=== Architecture Health Metrics ===")
        print(f"Architectural Health: {overview.get('architectural_health', 0):.2f}")
        print(f"Coupling Score: {overview.get('coupling_score', 0):.2f}")
        print(f"Complexity Score: {overview.get('complexity_score', 0):.2f}")
        print(f"Maintainability Index: {overview.get('maintainability_index', 0):.2f}")
        
        print(f"\nTotal Components: {metrics.get('total_components', 0)}")
        print(f"High Coupling Components: {metrics.get('high_coupling_components', 0)}")
        print(f"God Objects Detected: {metrics.get('god_objects_detected', 0)}")
        
        print(f"\nArchitectural Hotspots: {len(hotspots)}")
        for i, hotspot in enumerate(hotspots[:3]):
            print(f"  {i+1}. {hotspot.get('description', 'Unknown hotspot')}")
        
        print(f"\nRecommendations: {len(recommendations)}")
        for i, rec in enumerate(recommendations[:3]):
            print(f"  {i+1}. {rec}")
            
        # Check if this is fallback data
        if data.get("fallback"):
            print("\n[WARNING] Using fallback architecture data due to analysis failure")
            
    except Exception as e:
        print(f"[ERROR] Failed to load architecture analysis: {e}")
        sys.exit(1)

if __name__ == "__main__":
    assess_health()
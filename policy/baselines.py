# SPDX-License-Identifier: MIT
"""
Baseline Manager - Quality baseline tracking

Manages quality baselines for connascence analysis,
supporting snapshot creation, updates, and comparisons.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class BaselineSnapshot:
    """Quality baseline snapshot."""
    timestamp: datetime
    nasa_compliance_score: float
    god_object_count: int
    duplication_score: float
    critical_violations: int
    high_violations: int
    medium_violations: int
    low_violations: int
    total_lines: int
    message: Optional[str] = None
    git_hash: Optional[str] = None


class BaselineManager:
    """
    Manages quality baselines for tracking progress over time.
    
    Provides snapshot creation, comparison, and trend analysis
    for connascence analysis results.
    """
    
    def __init__(self, baseline_dir: Optional[Path] = None):
        """Initialize baseline manager."""
        self.baseline_dir = baseline_dir or Path(".claude/.artifacts/baselines")
        self.baseline_dir.mkdir(parents=True, exist_ok=True)
        self.current_baseline_path = self.baseline_dir / "current_baseline.json"
        
        logger.info(f"BaselineManager initialized with dir: {self.baseline_dir}")
    
    def create_snapshot(self, analysis_results: Dict[str, Any], 
                       message: Optional[str] = None) -> BaselineSnapshot:
        """Create a new baseline snapshot."""
        try:
            snapshot = BaselineSnapshot(
                timestamp=datetime.now(),
                nasa_compliance_score=analysis_results.get("nasa_compliance_score", 0.75),
                god_object_count=analysis_results.get("god_object_count", 0),
                duplication_score=analysis_results.get("duplication_score", 0.8),
                critical_violations=analysis_results.get("critical_violations", 0),
                high_violations=analysis_results.get("high_violations", 0),
                medium_violations=analysis_results.get("medium_violations", 0),
                low_violations=analysis_results.get("low_violations", 0),
                total_lines=analysis_results.get("total_lines", 0),
                message=message,
                git_hash=self._get_git_hash()
            )
            
            # Save snapshot
            snapshot_file = self.baseline_dir / f"snapshot_{snapshot.timestamp.strftime('%Y%m%d_%H%M%S')}.json"
            with open(snapshot_file, 'w') as f:
                json.dump(asdict(snapshot), f, indent=2, default=str)
            
            # Update current baseline
            with open(self.current_baseline_path, 'w') as f:
                json.dump(asdict(snapshot), f, indent=2, default=str)
            
            logger.info(f"Created baseline snapshot: {snapshot_file}")
            return snapshot
            
        except Exception as e:
            logger.error(f"Failed to create baseline snapshot: {e}")
            raise
    
    def get_current_baseline(self) -> Optional[BaselineSnapshot]:
        """Get the current baseline."""
        if not self.current_baseline_path.exists():
            return None
        
        try:
            with open(self.current_baseline_path) as f:
                data = json.load(f)
            
            # Convert timestamp string back to datetime
            if isinstance(data['timestamp'], str):
                data['timestamp'] = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            
            return BaselineSnapshot(**data)
            
        except Exception as e:
            logger.error(f"Failed to load current baseline: {e}")
            return None
    
    def compare_with_baseline(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Compare current results with baseline."""
        baseline = self.get_current_baseline()
        if not baseline:
            return {"status": "no_baseline", "message": "No baseline available for comparison"}
        
        comparison = {
            "nasa_compliance_change": analysis_results.get("nasa_compliance_score", 0.75) - baseline.nasa_compliance_score,
            "god_object_change": analysis_results.get("god_object_count", 0) - baseline.god_object_count,
            "duplication_change": analysis_results.get("duplication_score", 0.8) - baseline.duplication_score,
            "critical_violations_change": analysis_results.get("critical_violations", 0) - baseline.critical_violations,
            "high_violations_change": analysis_results.get("high_violations", 0) - baseline.high_violations
        }
        
        # Overall assessment
        improvements = sum(1 for change in comparison.values() if change > 0)
        regressions = sum(1 for change in comparison.values() if change < 0)
        
        if improvements > regressions:
            status = "improved"
        elif regressions > improvements:
            status = "degraded" 
        else:
            status = "stable"
        
        return {
            "status": status,
            "comparison": comparison,
            "baseline_timestamp": baseline.timestamp,
            "improvements": improvements,
            "regressions": regressions
        }
    
    def update_baseline(self, analysis_results: Dict[str, Any], 
                       force: bool = False, message: Optional[str] = None) -> bool:
        """Update existing baseline."""
        if not force:
            comparison = self.compare_with_baseline(analysis_results)
            if comparison["status"] == "degraded":
                logger.warning("Quality degraded - use --force to override")
                return False
        
        self.create_snapshot(analysis_results, message)
        logger.info("Baseline updated successfully")
        return True
    
    def list_baselines(self) -> List[Dict[str, Any]]:
        """List all available baselines."""
        baselines = []
        
        for baseline_file in self.baseline_dir.glob("snapshot_*.json"):
            try:
                with open(baseline_file) as f:
                    data = json.load(f)
                
                baselines.append({
                    "file": baseline_file.name,
                    "timestamp": data["timestamp"],
                    "nasa_score": data["nasa_compliance_score"],
                    "message": data.get("message", "")
                })
            except Exception as e:
                logger.warning(f"Failed to read baseline {baseline_file}: {e}")
        
        return sorted(baselines, key=lambda x: x["timestamp"], reverse=True)
    
    def _get_git_hash(self) -> Optional[str]:
        """Get current git hash if available."""
        try:
            import subprocess
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                cwd=Path.cwd()
            )
            return result.stdout.strip() if result.returncode == 0 else None
        except Exception:
            return None
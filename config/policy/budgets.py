# SPDX-License-Identifier: MIT
"""
Budget Tracker - Technical debt and violation budget management

Tracks violation budgets for pull requests and incremental
analysis to prevent quality regression.
"""

import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)


@dataclass 
class ViolationBudget:
    """Violation budget configuration."""
    critical_max: int = 0
    high_max: int = 5
    medium_max: int = 15
    low_max: int = 50
    nasa_compliance_min: float = 0.90
    god_object_max: int = 2
    duplication_threshold: float = 0.8


@dataclass
class BudgetSpent:
    """Budget spending tracking."""
    critical_used: int = 0
    high_used: int = 0
    medium_used: int = 0
    low_used: int = 0
    nasa_compliance_current: float = 1.0
    god_objects_current: int = 0
    duplication_current: float = 0.0


class BudgetTracker:
    """
    Tracks violation budgets for quality gate management.
    
    Helps enforce quality policies by tracking violations
    against defined budgets, particularly useful for PR analysis.
    """
    
    def __init__(self, budget_dir: Optional[Path] = None):
        """Initialize budget tracker."""
        self.budget_dir = budget_dir or Path(".claude/.artifacts/budgets")
        self.budget_dir.mkdir(parents=True, exist_ok=True)
        
        # Default budgets by policy
        self.policy_budgets = {
            "strict-core": ViolationBudget(
                critical_max=0,
                high_max=2,
                medium_max=5,
                low_max=20,
                nasa_compliance_min=0.95,
                god_object_max=1,
                duplication_threshold=0.9
            ),
            "service-defaults": ViolationBudget(
                critical_max=0,
                high_max=5,
                medium_max=15,
                low_max=50,
                nasa_compliance_min=0.90,
                god_object_max=2,
                duplication_threshold=0.8
            ),
            "experimental": ViolationBudget(
                critical_max=2,
                high_max=10,
                medium_max=30,
                low_max=100,
                nasa_compliance_min=0.75,
                god_object_max=5,
                duplication_threshold=0.7
            )
        }
        
        logger.info(f"BudgetTracker initialized with dir: {self.budget_dir}")
    
    def get_budget(self, policy: str = "service-defaults") -> ViolationBudget:
        """Get violation budget for policy."""
        return self.policy_budgets.get(policy, self.policy_budgets["service-defaults"])
    
    def set_budget(self, policy: str, budget: ViolationBudget) -> None:
        """Set custom budget for policy."""
        self.policy_budgets[policy] = budget
        logger.info(f"Custom budget set for policy: {policy}")
    
    def check_budget(self, analysis_results: Dict[str, Any], 
                    policy: str = "service-defaults") -> Dict[str, Any]:
        """Check if analysis results fit within budget."""
        budget = self.get_budget(policy)
        
        spent = BudgetSpent(
            critical_used=analysis_results.get("critical_violations", 0),
            high_used=analysis_results.get("high_violations", 0),
            medium_used=analysis_results.get("medium_violations", 0),
            low_used=analysis_results.get("low_violations", 0),
            nasa_compliance_current=analysis_results.get("nasa_compliance_score", 1.0),
            god_objects_current=analysis_results.get("god_object_count", 0),
            duplication_current=analysis_results.get("duplication_score", 0.0)
        )
        
        violations = []
        
        # Check violation budgets
        if spent.critical_used > budget.critical_max:
            violations.append(f"Critical violations: {spent.critical_used} > {budget.critical_max}")
        
        if spent.high_used > budget.high_max:
            violations.append(f"High violations: {spent.high_used} > {budget.high_max}")
        
        if spent.medium_used > budget.medium_max:
            violations.append(f"Medium violations: {spent.medium_used} > {budget.medium_max}")
        
        if spent.low_used > budget.low_max:
            violations.append(f"Low violations: {spent.low_used} > {budget.low_max}")
        
        # Check quality metrics
        if spent.nasa_compliance_current < budget.nasa_compliance_min:
            violations.append(f"NASA compliance: {spent.nasa_compliance_current:.3f} < {budget.nasa_compliance_min}")
        
        if spent.god_objects_current > budget.god_object_max:
            violations.append(f"God objects: {spent.god_objects_current} > {budget.god_object_max}")
        
        if spent.duplication_current > budget.duplication_threshold:
            violations.append(f"Duplication: {spent.duplication_current:.3f} > {budget.duplication_threshold}")
        
        # Calculate budget utilization
        utilization = {
            "critical": (spent.critical_used / max(budget.critical_max, 1)) * 100,
            "high": (spent.high_used / max(budget.high_max, 1)) * 100,
            "medium": (spent.medium_used / max(budget.medium_max, 1)) * 100,
            "low": (spent.low_used / max(budget.low_max, 1)) * 100
        }
        
        return {
            "budget_passed": len(violations) == 0,
            "violations": violations,
            "budget": asdict(budget),
            "spent": asdict(spent),
            "utilization": utilization,
            "overall_utilization": max(utilization.values()) if utilization.values() else 0
        }
    
    def track_pr_budget(self, pr_number: str, analysis_results: Dict[str, Any],
                       policy: str = "service-defaults") -> Dict[str, Any]:
        """Track budget for a specific PR."""
        budget_check = self.check_budget(analysis_results, policy)
        
        # Store PR budget tracking
        pr_file = self.budget_dir / f"pr_{pr_number}_budget.json"
        tracking_data = {
            "pr_number": pr_number,
            "timestamp": datetime.now().isoformat(),
            "policy": policy,
            "budget_check": budget_check,
            "analysis_results": analysis_results
        }
        
        with open(pr_file, 'w') as f:
            json.dump(tracking_data, f, indent=2, default=str)
        
        logger.info(f"PR budget tracked: {pr_file}")
        return budget_check
    
    def get_budget_trend(self, days: int = 30) -> Dict[str, Any]:
        """Get budget utilization trend over time."""
        cutoff_date = datetime.now() - timedelta(days=days)
        trend_data = []
        
        for budget_file in self.budget_dir.glob("pr_*_budget.json"):
            try:
                with open(budget_file) as f:
                    data = json.load(f)
                
                timestamp = datetime.fromisoformat(data["timestamp"])
                if timestamp >= cutoff_date:
                    trend_data.append({
                        "timestamp": timestamp,
                        "utilization": data["budget_check"]["overall_utilization"],
                        "passed": data["budget_check"]["budget_passed"]
                    })
            except Exception as e:
                logger.warning(f"Failed to read budget file {budget_file}: {e}")
        
        if not trend_data:
            return {"message": "No budget data available"}
        
        trend_data.sort(key=lambda x: x["timestamp"])
        
        return {
            "period_days": days,
            "total_prs": len(trend_data),
            "passed_prs": sum(1 for item in trend_data if item["passed"]),
            "avg_utilization": sum(item["utilization"] for item in trend_data) / len(trend_data),
            "max_utilization": max(item["utilization"] for item in trend_data),
            "trend": trend_data[-10:]  # Last 10 entries
        }
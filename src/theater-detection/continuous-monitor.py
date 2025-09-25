from src.constants.base import MAXIMUM_NESTED_DEPTH

Monitors for theater patterns across all categories with automated alerting
and stakeholder transparency reporting.
"""

import json
import time
import asyncio
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class MonitoringAlert:
    """Theater detection monitoring alert"""
    alert_type: str
    severity: str
    category: str
    message: str
    evidence: List[str]
    timestamp: datetime
    resolved: bool = False
    resolution_notes: Optional[str] = None

@dataclass
class StakeholderUpdate:
    """Stakeholder transparency update"""
    update_type: str  # "weekly", "milestone", "critical_alert"
    reality_score: float
    theater_patterns_count: int
    genuine_improvements: List[str]
    confidence_level: str
    summary: str
    recommendations: List[str]
    timestamp: datetime

class ContinuousTheaterMonitor:
    """
    Continuous monitoring system for theater detection and reality validation
    """
    
    def __init__(self, artifacts_dir: str = ".claude/.artifacts"):
        self.artifacts_dir = Path(artifacts_dir)
        self.monitoring_dir = self.artifacts_dir / "theater-detection" / "monitoring"
        self.monitoring_dir.mkdir(parents=True, exist_ok=True)
        
        self.theater_detector = TheaterDetector(artifacts_dir)
        self.monitoring_active = False
        self.alerts = []
        self.stakeholder_updates = []
        
        # Monitoring configuration
        self.config = {
            "monitoring_intervals": {
                "performance": 3600,  # 1 hour
                "quality": 600,       # 10 minutes  
                "security": 86400,    # 24 hours
                "compliance": 86400,  # 24 hours
                "architecture": 1800  # 30 minutes
            },
            "alert_thresholds": {
                "theater_patterns_detected": 3,
                "reality_validation_score_drop": 0.10,
                "critical_theater_patterns": 1,
                "stakeholder_confidence_drop": "medium"
            },
            "stakeholder_reporting": {
                "weekly_updates": True,
                "milestone_reports": True,
                "critical_alerts": True,
                "transparency_level": "high"
            }
        }
        
        # Load previous monitoring state
        self._load_monitoring_state()

    def start_monitoring(self):
        """Start continuous theater monitoring across all categories"""
        logger.info("Starting continuous theater monitoring system")
        self.monitoring_active = True
        
        # Start monitoring threads for each category
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            
            for category in ["performance", "quality", "security", "compliance", "architecture"]:
                future = executor.submit(self._monitor_category, category)
                futures.append(future)
            
            # Start stakeholder reporting thread
            reporting_future = executor.submit(self._stakeholder_reporting_loop)
            futures.append(reporting_future)
            
            # Wait for monitoring to complete (or be interrupted)
            try:
                for future in futures:
                    future.result()
            except KeyboardInterrupt:
                logger.info("Monitoring interrupted by user")
                self.stop_monitoring()
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                self.stop_monitoring()

    def stop_monitoring(self):
        """Stop continuous monitoring"""
        logger.info("Stopping continuous theater monitoring system")
        self.monitoring_active = False
        self._save_monitoring_state()

    def _monitor_category(self, category: str):
        """Monitor a specific category for theater patterns"""
        logger.info(f"Starting {category} theater monitoring")
        interval = self.config["monitoring_intervals"][category]
        
        while self.monitoring_active:
            try:
                # Load current metrics for the category
                current_metrics = self._collect_current_metrics(category)
                
                # Run theater detection for this category
                patterns = self._run_category_theater_detection(category, current_metrics)
                
                # Run reality validation
                reality_validation = self.theater_detector.validate_reality(category, current_metrics)
                
                # Process alerts
                self._process_category_alerts(category, patterns, reality_validation)
                
                # Update monitoring history
                self._update_monitoring_history(category, patterns, reality_validation)
                
                # Sleep until next monitoring cycle
                time.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error monitoring {category}: {e}")
                time.sleep(60)  # Shorter retry interval on error

    def _run_category_theater_detection(self, category: str, current_metrics: Dict) -> List[TheaterPattern]:
        """Run theater detection for a specific category"""
        if category == "performance":
            return self.theater_detector.detect_performance_theater(current_metrics)
        elif category == "quality":
            return self.theater_detector.detect_quality_theater(current_metrics)
        elif category == "security":
            return self.theater_detector.detect_security_theater(current_metrics)
        elif category == "compliance":
            return self.theater_detector.detect_compliance_theater(current_metrics)
        elif category == "architecture":
            return self.theater_detector.detect_architecture_theater(current_metrics)
        return []

    def _collect_current_metrics(self, category: str) -> Dict:
        """Collect current metrics for a category"""
        # In a real implementation, this would collect live metrics
        
        base_time = datetime.now()
        
        if category == "performance":
            # Simulate varying performance metrics
            variance = 0.1 * (base_time.second % 10) / 10  # 0-10% variance
            return {
                "execution_times": {
                    "test_suite": 45.2 * (1 + variance),
                    "analysis_pipeline": 23.1 * (1 - variance),
                    "compliance_check": 12, MAXIMUM_NESTED_DEPTH * (1 + variance/2)
                },
                "memory_usage": int(512 * (1 + variance)),
                "cache_performance": {
                    "hit_rate": min(0.95, 0.85 + variance),
                    "efficiency": min(0.98, 0.92 + variance)
                },
                "benchmark_results": {
                    "analysis_speed": 1.8 * (1 + variance),
                    "memory_efficiency": 1.4 * (1 - variance),
                    "cache_effectiveness": 2.1 * (1 + variance)
                }
            }
        
        elif category == "quality":
            # Simulate quality metric evolution
            coverage_trend = 0.87 + 0.01 * (base_time.day % 7) / 7
            return {
                "test_coverage": {
                    "line_coverage": coverage_trend,
                    "test_count": 156 + (base_time.day % 5),
                    "assertion_count": 423 + (base_time.hour % 20)
                },
                "complexity_metrics": {
                    "cyclomatic": max(3.0, 4.2 - 0.1 * (base_time.day % 10) / 10),
                    "cognitive": max(3.0, 3.8 - 0.05 * (base_time.day % 10) / 10),
                    "maintainability": min(0.85, 0.78 + 0.01 * (base_time.day % 10) / 10)
                },
                "lint_results": {
                    "error_count": max(0, 2 - (base_time.day % 3)),
                    "warning_count": max(5, 12 - (base_time.day % 8))
                },
                "duplication_metrics": {
                    "percentage": max(0.05, 0.08 - 0.003 * (base_time.day % 10) / 10)
                }
            }
        
        elif category == "security":
            # Simulate security improvements over time
            return {
                "security_scan": {
                    "total_findings": max(15, 23 - (base_time.day % 10)),
                    "critical_count": max(0, 1 - (base_time.day % 3)),
                    "high_count": max(1, 3 - (base_time.day % 5)),
                    "false_positive_rate": max(0.10, 0.15 - 0.005 * (base_time.day % 10))
                },
                "vulnerability_details": {
                    "vulnerabilities_eliminated": 12 + (base_time.day % 5),
                    "severity_downgrades": max(1, 3 - (base_time.day % 4))
                },
                "compliance_metrics": {
                    "overall_score": min(0.90, 0.82 + 0.008 * (base_time.day % 10)),
                    "security_controls_implemented": 8 + (base_time.day % 3)
                }
            }
        
        elif category == "compliance":
            # Simulate compliance improvements
            return {
                "nasa_compliance": {
                    "overall_score": min(0.98, 0.95 + 0.003 * (base_time.day % 10)),
                    "rules_improved": 3 + (base_time.day % 2),
                    "violations_eliminated": 13 + (base_time.day % 5)
                },
                "god_object_metrics": {
                    "count": max(20, 25 - (base_time.day % 6)),
                    "avg_complexity": max(3.5, 4.2 - 0.05 * (base_time.day % 15))
                },
                "bounded_operations": {
                    "compliance_rate": min(0.99, 0.98 + 0.001 * (base_time.day % 10)),
                    "exception_rate": max(0.01, 0.02 - 0.001 * (base_time.day % 10))
                }
            }
        
        elif category == "architecture":
            # Simulate architectural improvements
            return {
                "connascence_metrics": {
                    "total_violations": max(700, 850 - 10 * (base_time.day % 15)),
                    "coupling_score": max(0.35, 0.45 - 0.01 * (base_time.day % 10)),
                    "critical_violations": max(30, 45 - (base_time.day % 16))
                },
                "mece_metrics": {
                    "score": min(0.85, 0.78 + 0.005 * (base_time.day % 15)),
                    "duplications": max(8, 12 - (base_time.day % 5))
                },
                "consolidation_metrics": {
                    "file_count": max(60, 65 - (base_time.day % 6)),
                    "maintainability": min(0.80, 0.72 + 0.006 * (base_time.day % 14))
                }
            }
        
        return {}

    def _process_category_alerts(self, category: str, patterns: List[TheaterPattern], reality_validation: RealityValidationResult):
        """Process alerts for a category based on patterns and validation"""
        
        # Check for critical theater patterns
        critical_patterns = [p for p in patterns if p.severity == "critical"]
        if critical_patterns:
            alert = MonitoringAlert(
                alert_type="critical_theater_pattern",
                severity="critical",
                category=category,
                message=f"Critical theater patterns detected in {category}: {[p.pattern_type for p in critical_patterns]}",
                evidence=[p.evidence for p in critical_patterns],
                timestamp=datetime.now()
            )
            self.alerts.append(alert)
            logger.critical(f"CRITICAL THEATER ALERT: {alert.message}")
        
        # Check for reality validation score drop
        if reality_validation.validation_score < 0.60:
            alert = MonitoringAlert(
                alert_type="reality_score_drop",
                severity="high" if reality_validation.validation_score < 0.50 else "medium",
                category=category,
                message=f"Reality validation score dropped to {reality_validation.validation_score:.2f} in {category}",
                evidence=[f"Theater risk: {reality_validation.theater_risk:.2f}", f"Evidence quality: {reality_validation.evidence_quality:.2f}"],
                timestamp=datetime.now()
            )
            self.alerts.append(alert)
            logger.warning(f"REALITY VALIDATION ALERT: {alert.message}")
        
        # Check for high theater risk
        if reality_validation.theater_risk > 0.40:
            alert = MonitoringAlert(
                alert_type="high_theater_risk",
                severity="medium",
                category=category,
                message=f"High theater risk detected in {category}: {reality_validation.theater_risk:.2f}",
                evidence=reality_validation.validation_details.get("risk_factors", []),
                timestamp=datetime.now()
            )
            self.alerts.append(alert)
            logger.warning(f"HIGH THEATER RISK ALERT: {alert.message}")
        
        # Check for multiple theater patterns
        if len(patterns) >= self.config["alert_thresholds"]["theater_patterns_detected"]:
            alert = MonitoringAlert(
                alert_type="multiple_theater_patterns",
                severity="medium",
                category=category,
                message=f"Multiple theater patterns detected in {category}: {len(patterns)} patterns",
                evidence=[p.pattern_type for p in patterns],
                timestamp=datetime.now()
            )
            self.alerts.append(alert)
            logger.warning(f"MULTIPLE PATTERNS ALERT: {alert.message}")

    def _update_monitoring_history(self, category: str, patterns: List[TheaterPattern], reality_validation: RealityValidationResult):
        """Update monitoring history for trend analysis"""
        history_file = self.monitoring_dir / f"{category}_monitoring_history.json"
        
        # Load existing history
        history = []
        if history_file.exists():
            with open(history_file, 'r') as f:
                history = json.load(f)
        
        # Add current monitoring data
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "theater_patterns_count": len(patterns),
            "theater_patterns": [asdict(p) for p in patterns],
            "reality_validation": asdict(reality_validation),
            "category_health_score": self._calculate_category_health(patterns, reality_validation)
        }
        
        history.append(history_entry)
        
        # Keep only last 100 entries to manage file size
        history = history[-100:]
        
        # Save updated history
        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2, default=str)

    def _calculate_category_health(self, patterns: List[TheaterPattern], reality_validation: RealityValidationResult) -> float:
        """Calculate overall health score for a category"""
        # Base score from reality validation
        base_score = reality_validation.validation_score
        
        # Penalty for theater patterns
        pattern_penalty = 0
        for pattern in patterns:
            if pattern.severity == "critical":
                pattern_penalty += 0.20
            elif pattern.severity == "high":
                pattern_penalty += 0.10
            elif pattern.severity == "medium":
                pattern_penalty += 0.05
            else:
                pattern_penalty += 0.02
        
        # Theater risk penalty
        theater_risk_penalty = reality_validation.theater_risk * 0.30
        
        # Calculate final health score
        health_score = max(0.0, base_score - pattern_penalty - theater_risk_penalty)
        return round(health_score, 3)

    def _stakeholder_reporting_loop(self):
        """Stakeholder transparency reporting loop"""
        logger.info("Starting stakeholder reporting loop")
        
        last_weekly_report = datetime.now() - timedelta(days=8)  # Force initial report
        
        while self.monitoring_active:
            try:
                current_time = datetime.now()
                
                # Generate weekly reports
                if current_time - last_weekly_report >= timedelta(days=7):
                    self._generate_weekly_stakeholder_update()
                    last_weekly_report = current_time
                
                # Check for critical alerts requiring immediate stakeholder notification
                critical_alerts = [a for a in self.alerts if a.severity == "critical" and not a.resolved]
                if critical_alerts:
                    self._generate_critical_stakeholder_alert(critical_alerts)
                
                # Sleep for 1 hour before next check
                time.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in stakeholder reporting: {e}")
                time.sleep(300)  # 5 minute retry on error

    def _generate_weekly_stakeholder_update(self):
        """Generate weekly transparency update for stakeholders"""
        logger.info("Generating weekly stakeholder update")
        
        # Collect overall system health metrics
        categories = ["performance", "quality", "security", "compliance", "architecture"]
        category_validations = []
        
        for category in categories:
            # Get latest metrics and validate
            current_metrics = self._collect_current_metrics(category)
            validation = self.theater_detector.validate_reality(category, current_metrics)
            category_validations.append(validation)
        
        # Calculate overall reality score
        overall_reality_score = sum(v.validation_score for v in category_validations) / len(category_validations)
        
        # Count theater patterns in the last week
        week_ago = datetime.now() - timedelta(days=7)
        recent_alerts = [a for a in self.alerts if a.timestamp >= week_ago]
        theater_patterns_count = sum(1 for a in recent_alerts if "theater" in a.alert_type)
        
        # Identify genuine improvements
        genuine_improvements = [v.category for v in category_validations if v.genuine_improvement]
        
        # Determine confidence level
        if overall_reality_score >= 0.85 and theater_patterns_count <= 2:
            confidence = "high"
        elif overall_reality_score >= 0.70 and theater_patterns_count <= 5:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Generate summary
        summary = f"""
        Weekly Theater Detection & Reality Validation Report
        
        Overall Reality Score: {overall_reality_score:.2f}/1.00
        Theater Patterns Detected: {theater_patterns_count}
        Genuine Improvements: {len(genuine_improvements)} categories
        System Confidence: {confidence.upper()}
        
        The theater detection system has analyzed all quality improvement claims
        across performance, quality, security, compliance, and architecture.
        {'Strong evidence of genuine improvements with minimal theater detected.' if confidence == 'high' else 
        'Moderate confidence with some theater risks identified.' if confidence == 'medium' else
        'Significant theater risks detected requiring immediate attention.'}
        """
        
        # Generate recommendations
        recommendations = self._generate_stakeholder_recommendations(category_validations, recent_alerts)
        
        # Create stakeholder update
        update = StakeholderUpdate(
            update_type="weekly",
            reality_score=overall_reality_score,
            theater_patterns_count=theater_patterns_count,
            genuine_improvements=genuine_improvements,
            confidence_level=confidence,
            summary=summary.strip(),
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        
        self.stakeholder_updates.append(update)
        
        # Save update to file
        update_file = self.monitoring_dir / f"stakeholder_update_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(update_file, 'w') as f:
            json.dump(asdict(update), f, indent=2, default=str)
        
        logger.info(f"Weekly stakeholder update generated: {confidence} confidence, {overall_reality_score:.2f} reality score")

    def _generate_critical_stakeholder_alert(self, critical_alerts: List[MonitoringAlert]):
        """Generate immediate stakeholder alert for critical theater detection"""
        logger.critical("Generating critical stakeholder alert")
        
        alert_summary = f"""
        CRITICAL THEATER DETECTION ALERT
        
        {len(critical_alerts)} critical theater patterns have been detected that require immediate attention:
        
        """
        
        for alert in critical_alerts:
            alert_summary += f"""
        - Category: {alert.category.upper()}
        - Pattern: {alert.alert_type}
        - Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
        - Evidence: {'; '.join(alert.evidence) if isinstance(alert.evidence[0], str) else 'Multiple evidence items'}
        
        """
        
        alert_summary += """
        IMMEDIATE ACTION REQUIRED:
        1. Halt deployment pipeline until theater patterns are resolved
        2. Review improvement claims for genuine evidence
        3. Implement additional validation measures
        4. Schedule stakeholder review meeting within 24 hours
        """
        
        # Create critical update
        update = StakeholderUpdate(
            update_type="critical_alert",
            reality_score=0.0,  # Critical alert doesn't have overall score
            theater_patterns_count=len(critical_alerts),
            genuine_improvements=[],
            confidence_level="critical_alert",
            summary=alert_summary.strip(),
            recommendations=["Immediate halt and review required"],
            timestamp=datetime.now()
        )
        
        self.stakeholder_updates.append(update)
        
        # Save critical alert
        alert_file = self.monitoring_dir / f"CRITICAL_ALERT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(alert_file, 'w') as f:
            json.dump(asdict(update), f, indent=2, default=str)
        
        # Mark alerts as notified (but not resolved)
        for alert in critical_alerts:
            alert.resolution_notes = "Stakeholder notified - awaiting resolution"

    def _generate_stakeholder_recommendations(self, validations: List[RealityValidationResult], recent_alerts: List[MonitoringAlert]) -> List[str]:
        """Generate recommendations for stakeholders based on current state"""
        recommendations = []
        
        # Low reality scores
        low_reality_categories = [v.category for v in validations if v.validation_score < 0.70]
        if low_reality_categories:
            recommendations.append(f"Strengthen evidence validation for: {', '.join(low_reality_categories)}")
        
        # High theater risk
        high_risk_categories = [v.category for v in validations if v.theater_risk > 0.30]
        if high_risk_categories:
            recommendations.append(f"Implement additional theater detection for: {', '.join(high_risk_categories)}")
        
        # Frequent alerts
        alert_categories = {}
        for alert in recent_alerts:
            alert_categories[alert.category] = alert_categories.get(alert.category, 0) + 1
        
        frequent_alert_categories = [cat for cat, count in alert_categories.items() if count >= 3]
        if frequent_alert_categories:
            recommendations.append(f"Review methodology for frequently alerted categories: {', '.join(frequent_alert_categories)}")
        
        # General recommendations
        recommendations.extend([
            "Continue focus on genuine improvement impact over metric optimization",
            "Maintain baseline measurement discipline for all improvements",
            "Ensure comprehensive evidence collection for all quality claims"
        ])
        
        return recommendations[:5]  # Limit to top 5 recommendations

    def _load_monitoring_state(self):
        """Load previous monitoring state"""
        state_file = self.monitoring_dir / "monitoring_state.json"
        if state_file.exists():
            try:
                with open(state_file, 'r') as f:
                    state = json.load(f)
                
                # Restore alerts (convert timestamps back to datetime objects)
                for alert_data in state.get("alerts", []):
                    alert = MonitoringAlert(**alert_data)
                    alert.timestamp = datetime.fromisoformat(alert_data["timestamp"])
                    self.alerts.append(alert)
                
                # Restore stakeholder updates
                for update_data in state.get("stakeholder_updates", []):
                    update = StakeholderUpdate(**update_data)
                    update.timestamp = datetime.fromisoformat(update_data["timestamp"])
                    self.stakeholder_updates.append(update)
                
                logger.info(f"Loaded monitoring state: {len(self.alerts)} alerts, {len(self.stakeholder_updates)} updates")
            
            except Exception as e:
                logger.warning(f"Error loading monitoring state: {e}")

    def _save_monitoring_state(self):
        """Save current monitoring state"""
        state_file = self.monitoring_dir / "monitoring_state.json"
        
        state = {
            "alerts": [asdict(alert) for alert in self.alerts],
            "stakeholder_updates": [asdict(update) for update in self.stakeholder_updates],
            "last_save": datetime.now().isoformat()
        }
        
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2, default=str)
        
        logger.info("Monitoring state saved")

    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring system status"""
        recent_alerts = [a for a in self.alerts if a.timestamp >= datetime.now() - timedelta(hours=24)]
        
        return {
            "system_active": self.monitoring_active,
            "categories_monitored": 5,
            "alerts_last_24h": len(recent_alerts),
            "critical_alerts_unresolved": len([a for a in recent_alerts if a.severity == "critical" and not a.resolved]),
            "stakeholder_updates_generated": len(self.stakeholder_updates),
            "last_update": self.stakeholder_updates[-1].timestamp.isoformat() if self.stakeholder_updates else None,
            "monitoring_health": "healthy" if len(recent_alerts) <= 5 else "degraded" if len(recent_alerts) <= 10 else "critical"
        }

if __name__ == "__main__":
    # Initialize continuous monitoring system
    monitor = ContinuousTheaterMonitor()
    
    try:
        # Start monitoring
        monitor.start_monitoring()
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")
    except Exception as e:
        print(f"Monitoring error: {e}")
    finally:
        monitor.stop_monitoring()
        print("Monitoring system shutdown complete")
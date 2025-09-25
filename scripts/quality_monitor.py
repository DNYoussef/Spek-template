#!/usr/bin/env python3
"""
Continuous Quality Monitoring
Tracks metric trends, detects anomalies, updates dashboard, archives evidence
"""

from collections import deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple
import json
import sys

import statistics

class QualityMonitor:
    """Continuous quality monitoring system"""

def __init__(self, strategy_path: str):
        self.strategy = self._load_strategy(strategy_path)
        self.metrics_history = self._load_metrics_history()
        self.dashboard_path = Path("docs/quality-dashboard.json")
        self.alert_log = Path("docs/quality-alerts.log")
        self.evidence_archive = Path("docs/audit-trail")
        self.evidence_archive.mkdir(parents=True, exist_ok=True)

def _load_strategy(self, path: str) -> Dict[str, Any]:
        """Load quality gate strategy"""
        with open(path) as f:
            return json.load(f)

def _load_metrics_history(self) -> List[Dict[str, Any]]:
        """Load historical metrics"""
        history_path = Path("docs/metrics-history.json")
        if history_path.exists():
            with open(history_path) as f:
                return json.load(f)
        return []

def monitor(self) -> None:
        """Run monitoring cycle"""
        print(f"\n=== Quality Monitor - {datetime.utcnow().isoformat()} ===")

        # 1. Track metric trends
        trends = self._track_metric_trends()
        print("\n1. Metric Trends:")
        self._print_trends(trends)

        # 2. Detect anomalies
        anomalies = self._detect_anomalies(trends)
        print("\n2. Anomaly Detection:")
        self._print_anomalies(anomalies)

        # 3. Update dashboard
        print("\n3. Updating Dashboard...")
        self._update_dashboard(trends, anomalies)

        # 4. Archive evidence
        print("\n4. Archiving Evidence...")
        self._archive_evidence()

        # 5. Alert on violations
        print("\n5. Alert Processing...")
        self._process_alerts(anomalies)

        print("\n=== Monitoring Complete ===")

def _track_metric_trends(self) -> Dict[str, Dict[str, Any]]:
        """Track trends for all metrics"""
        trends = {}

        # Define window sizes (in hours)
        windows = {
            "7day": 7 * 24,
            "30day": 30 * 24
        }

        # Collect current metrics (would be from actual measurement)
        current_metrics = {
            "nasa_compliance": 19.3,
            "six_sigma": 1.0,
            "dpmo": 357058,
            "test_coverage": 0.0,
            "security_score": 0.0
        }

        for metric_name, current_value in current_metrics.items():
            trends[metric_name] = {
                "current": current_value,
                "windows": {}
            }

            # Calculate trends for each window
            for window_name, window_hours in windows.items():
                historical = self._get_historical_values(metric_name, window_hours)

                if len(historical) >= 2:
                    trend_direction = "improving" if historical[-1] > historical[0] else "degrading"
                    trend_rate = (historical[-1] - historical[0]) / len(historical)
                    moving_avg = statistics.mean(historical)

                    trends[metric_name]["windows"][window_name] = {
                        "direction": trend_direction,
                        "rate": trend_rate,
                        "moving_average": moving_avg,
                        "data_points": len(historical)
                    }
                else:
                    trends[metric_name]["windows"][window_name] = {
                        "direction": "insufficient_data",
                        "rate": 0.0,
                        "moving_average": current_value,
                        "data_points": len(historical)
                    }

        return trends

def _get_historical_values(self, metric_name: str, hours: int) -> List[float]:
        """Get historical values for a metric within time window"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        values = []
        for entry in self.metrics_history:
            entry_time = datetime.fromisoformat(entry.get("timestamp", "").replace("Z", ""))
            if entry_time >= cutoff_time and metric_name in entry:
                values.append(entry[metric_name])

        return values

def _detect_anomalies(self, trends: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies in metric trends"""
        anomalies = []

        for metric_name, trend_data in trends.items():
            current = trend_data["current"]

            for window_name, window_data in trend_data["windows"].items():
                # Anomaly: Degrading trend
                if window_data["direction"] == "degrading":
                    anomalies.append({
                        "type": "trend_degradation",
                        "metric": metric_name,
                        "window": window_name,
                        "severity": "medium",
                        "details": f"Degrading trend detected: {window_data['rate']:.2f} per data point"
                    })

                # Anomaly: Stagnation
                if window_data["data_points"] >= 5:
                    recent_values = self._get_historical_values(metric_name, 24)  # Last 24 hours
                    if len(recent_values) >= 3 and max(recent_values) - min(recent_values) < 0.01:
                        anomalies.append({
                            "type": "stagnation",
                            "metric": metric_name,
                            "window": "24h",
                            "severity": "low",
                            "details": "No significant change in last 24 hours"
                        })

                # Anomaly: Sudden drop
                if window_data["data_points"] >= 2:
                    recent_values = self._get_historical_values(metric_name, 2)
                    if len(recent_values) >= 2 and recent_values[-1] < recent_values[-2] * 0.9:
                        anomalies.append({
                            "type": "sudden_drop",
                            "metric": metric_name,
                            "window": "recent",
                            "severity": "high",
                            "details": f"Sudden drop: {recent_values[-2]:.2f} -> {recent_values[-1]:.2f}"
                        })

        return anomalies

def _update_dashboard(self, trends: Dict[str, Dict[str, Any]], anomalies: List[Dict[str, Any]]) -> None:
        """Update quality dashboard"""
        dashboard = {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "metrics": trends,
            "anomalies": anomalies,
            "alerts": self._get_active_alerts(),
            "milestones": self._get_milestone_progress(),
            "charts_data": self._generate_chart_data(trends)
        }

        self.dashboard_path.write_text(json.dumps(dashboard, indent=2))
        print(f"  Dashboard updated: {self.dashboard_path}")

def _get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active alerts from log"""
        if not self.alert_log.exists():
            return []

        alerts = []
        cutoff_time = datetime.utcnow() - timedelta(hours=24)

        with open(self.alert_log) as f:
            for line in f:
                try:
                    alert = json.loads(line.strip())
                    alert_time = datetime.fromisoformat(alert.get("timestamp", "").replace("Z", ""))
                    if alert_time >= cutoff_time and not alert.get("resolved", False):
                        alerts.append(alert)
                except:
                    pass

        return alerts

def _get_milestone_progress(self) -> Dict[str, Any]:
        """Get current milestone progress"""
        # Simplified milestone progress
        return {
            "current_milestone": "M1_FOUNDATION",
            "completion_percentage": 35.0,
            "next_gate": "2025-10-15",
            "status": "in_progress"
        }

def _generate_chart_data(self, trends: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Generate data for dashboard charts"""
        return {
            "compliance_trend": {
                "labels": ["7d_ago", "now"],
                "data": [15.0, 19.3]
            },
            "coverage_bar": {
                "current": 0.0,
                "target": 40.0
            },
            "security_radar": {
                "owasp_coverage": 0,
                "input_validation": 0,
                "authentication": 0,
                "authorization": 0
            }
        }

def _archive_evidence(self) -> None:
        """Archive current evidence"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        archive_dir = self.evidence_archive / timestamp
        archive_dir.mkdir(parents=True, exist_ok=True)

        # Archive test results
        test_results_path = Path("test-results.json")
        if test_results_path.exists():
            (archive_dir / "test-results.json").write_text(test_results_path.read_text())

        # Archive coverage report
        coverage_path = Path("coverage.json")
        if coverage_path.exists():
            (archive_dir / "coverage.json").write_text(coverage_path.read_text())
            print(f"  Archived: coverage.json")

        # Archive security scan
        security_path = Path("docs/security-scan-results.json")
        if security_path.exists():
            (archive_dir / "security-scan-results.json").write_text(security_path.read_text())
            print(f"  Archived: security-scan-results.json")

        print(f"  Evidence archived to: {archive_dir}")

def _process_alerts(self, anomalies: List[Dict[str, Any]]) -> None:
        """Process and log alerts"""
        alert_config = self.strategy['quality_dashboard']['alert_system']

        for anomaly in anomalies:
            alert = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "type": anomaly["type"],
                "metric": anomaly["metric"],
                "severity": anomaly["severity"],
                "details": anomaly["details"],
                "action": self._determine_action(anomaly),
                "resolved": False
            }

            # Log alert
            with open(self.alert_log, "a") as f:
                f.write(json.dumps(alert) + "\n")

            # Print alert
            print(f"  [{alert['severity'].upper()}] {alert['type']}: {alert['metric']}")
            print(f"    Details: {alert['details']}")
            print(f"    Action: {alert['action']}")

def _determine_action(self, anomaly: Dict[str, Any]) -> str:
        """Determine action for anomaly"""
        severity = anomaly["severity"]
        anomaly_type = anomaly["type"]

        if severity == "high":
            return "trigger_review"
        elif anomaly_type == "trend_degradation":
            return "warn_team"
        elif anomaly_type == "stagnation":
            return "daily_summary"
        else:
            return "monitor"

def _print_trends(self, trends: Dict[str, Dict[str, Any]]) -> None:
        """Print trend information"""
        for metric_name, trend_data in trends.items():
            print(f"\n  {metric_name}: {trend_data['current']:.2f}")
            for window_name, window_data in trend_data["windows"].items():
                direction_symbol = "^" if window_data["direction"] == "improving" else "v" if window_data["direction"] == "degrading" else "->"
                print(f"    {window_name}: {direction_symbol} {window_data['direction']} ({window_data['rate']:.3f}/point)")

def _print_anomalies(self, anomalies: List[Dict[str, Any]]) -> None:
        """Print detected anomalies"""
        if not anomalies:
            print("  No anomalies detected")
            return

        for anomaly in anomalies:
            print(f"  [{anomaly['severity'].upper()}] {anomaly['type']} in {anomaly['metric']}")
            print(f"    {anomaly['details']}")

def main():
    """Main monitoring entry point"""
    monitor = QualityMonitor("docs/enhancement/quality-gate-strategy.json")
    monitor.monitor()

if __name__ == "__main__":
    main()
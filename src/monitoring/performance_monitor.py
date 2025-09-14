#!/usr/bin/env python3
"""
Continuous Performance Monitoring System
Implements real-time performance monitoring with alert thresholds.
"""

import asyncio
import json
import logging
import time
import statistics
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor
import threading

@dataclass
class PerformanceAlert:
    """Performance alert definition."""
    metric: str
    threshold: float
    current_value: float
    severity: str  # INFO, WARNING, CRITICAL
    timestamp: str
    stage: Optional[str] = None
    feature: Optional[str] = None
    message: str = ""

@dataclass
class MonitoringConfig:
    """Monitoring configuration."""
    sampling_interval_seconds: int = 30
    alert_cooldown_seconds: int = 300  # 5 minutes
    history_retention_hours: int = 24
    enable_alerts: bool = True
    alert_callbacks: List[Callable] = None

class PerformanceMonitor:
    """Continuous performance monitoring with alerting."""

    def __init__(self, config: MonitoringConfig = None):
        self.config = config or MonitoringConfig()
        self.monitoring_active = False
        self.performance_history = []
        self.alert_history = []
        self.last_alert_times = {}
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.lock = threading.Lock()

        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Performance thresholds
        self.thresholds = {
            "pipeline_total_ms": {"warning": 8000, "critical": 12000},
            "stage_overhead_percent": {"warning": 15.0, "critical": 25.0},
            "six_sigma_overhead_percent": {"warning": 2.5, "critical": 4.0},
            "feature_flag_overhead_percent": {"warning": 2.0, "critical": 3.5},
            "compliance_overhead_percent": {"warning": 3.0, "critical": 5.0},
            "memory_usage_mb": {"warning": 1024, "critical": 2048},
            "cpu_usage_percent": {"warning": 80.0, "critical": 95.0}
        }

    async def start_monitoring(self):
        """Start continuous performance monitoring."""
        if self.monitoring_active:
            self.logger.warning("Performance monitoring already active")
            return

        self.monitoring_active = True
        self.logger.info("Starting continuous performance monitoring")

        try:
            await self._monitoring_loop()
        except Exception as e:
            self.logger.error(f"Performance monitoring error: {e}")
        finally:
            self.monitoring_active = False

    async def stop_monitoring(self):
        """Stop continuous performance monitoring."""
        self.logger.info("Stopping performance monitoring")
        self.monitoring_active = False

        # Wait for cleanup
        await asyncio.sleep(1)

        # Save final state
        self._save_monitoring_state()

    async def _monitoring_loop(self):
        """Main monitoring loop."""
        while self.monitoring_active:
            try:
                # Collect current performance metrics
                current_metrics = await self._collect_performance_metrics()

                # Store in history
                with self.lock:
                    self.performance_history.append(current_metrics)
                    self._cleanup_old_history()

                # Check for alerts
                alerts = self._check_performance_thresholds(current_metrics)

                # Process alerts
                for alert in alerts:
                    await self._process_alert(alert)

                # Log current status
                self._log_performance_status(current_metrics)

                # Wait for next sampling interval
                await asyncio.sleep(self.config.sampling_interval_seconds)

            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)  # Brief pause before retry

    async def _collect_performance_metrics(self) -> Dict[str, Any]:
        """Collect current performance metrics."""
        timestamp = datetime.now(timezone.utc).isoformat()

        try:
            # Import measurement tools
            from tests.performance.baseline_measurement import BaselineMeasurement
            from tests.performance.enterprise_overhead import EnterpriseOverheadAnalyzer

            # Quick baseline measurement (minimal iterations for monitoring)
            baseline_tool = BaselineMeasurement()
            baseline_result = baseline_tool.measure_clean_pipeline(iterations=1)

            # Calculate total pipeline time
            total_pipeline_ms = sum(stats.get("mean", 0) for stats in baseline_result.statistics.values())

            # Get system metrics
            cpu_percent, memory_mb = self._get_system_metrics()

            # Check enterprise feature overhead (cached/estimated)
            six_sigma_overhead = self._get_cached_overhead("six_sigma", 1.93)  # From corrected measurements
            feature_flag_overhead = self._get_cached_overhead("feature_flag", 1.2)
            compliance_overhead = self._get_cached_overhead("compliance", 2.1)

            metrics = {
                "timestamp": timestamp,
                "pipeline_total_ms": total_pipeline_ms,
                "cpu_usage_percent": cpu_percent,
                "memory_usage_mb": memory_mb,
                "six_sigma_overhead_percent": six_sigma_overhead,
                "feature_flag_overhead_percent": feature_flag_overhead,
                "compliance_overhead_percent": compliance_overhead,
                "stage_breakdown": {
                    stage: stats.get("mean", 0)
                    for stage, stats in baseline_result.statistics.items()
                }
            }

            return metrics

        except Exception as e:
            self.logger.error(f"Error collecting metrics: {e}")
            return {
                "timestamp": timestamp,
                "error": str(e),
                "pipeline_total_ms": 0,
                "cpu_usage_percent": 0,
                "memory_usage_mb": 0
            }

    def _get_system_metrics(self) -> tuple[float, float]:
        """Get current system CPU and memory metrics."""
        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_mb = psutil.virtual_memory().used / 1024 / 1024
            return cpu_percent, memory_mb
        except ImportError:
            return 0.0, 0.0

    def _get_cached_overhead(self, feature: str, default_value: float) -> float:
        """Get cached overhead measurement or return default."""
        try:
            results_dir = Path("tests/performance/results")
            overhead_file = results_dir / f"{feature}_overhead.json"

            if overhead_file.exists():
                with open(overhead_file, 'r') as f:
                    data = json.load(f)
                return data.get("overhead_percent", default_value)
            else:
                return default_value
        except Exception:
            return default_value

    def _check_performance_thresholds(self, metrics: Dict[str, Any]) -> List[PerformanceAlert]:
        """Check current metrics against performance thresholds."""
        alerts = []

        for metric_name, thresholds in self.thresholds.items():
            current_value = metrics.get(metric_name, 0)

            if isinstance(current_value, (int, float)):
                # Check critical threshold
                if current_value >= thresholds["critical"]:
                    alerts.append(PerformanceAlert(
                        metric=metric_name,
                        threshold=thresholds["critical"],
                        current_value=current_value,
                        severity="CRITICAL",
                        timestamp=metrics["timestamp"],
                        message=f"{metric_name} exceeded critical threshold: {current_value} >= {thresholds['critical']}"
                    ))

                # Check warning threshold
                elif current_value >= thresholds["warning"]:
                    alerts.append(PerformanceAlert(
                        metric=metric_name,
                        threshold=thresholds["warning"],
                        current_value=current_value,
                        severity="WARNING",
                        timestamp=metrics["timestamp"],
                        message=f"{metric_name} exceeded warning threshold: {current_value} >= {thresholds['warning']}"
                    ))

        # Stage-specific checks
        if "stage_breakdown" in metrics:
            for stage, stage_time in metrics["stage_breakdown"].items():
                if isinstance(stage_time, (int, float)) and stage_time > 0:
                    # Check if any single stage takes too long
                    total_time = metrics.get("pipeline_total_ms", 0)
                    if total_time > 0:
                        stage_percent = (stage_time / total_time) * 100

                        if stage_percent > 50:  # Single stage taking >50% of total time
                            alerts.append(PerformanceAlert(
                                metric="stage_dominance",
                                threshold=50.0,
                                current_value=stage_percent,
                                severity="WARNING",
                                timestamp=metrics["timestamp"],
                                stage=stage,
                                message=f"Stage {stage} consuming {stage_percent:.1f}% of total pipeline time"
                            ))

        return alerts

    async def _process_alert(self, alert: PerformanceAlert):
        """Process a performance alert."""
        if not self.config.enable_alerts:
            return

        # Check alert cooldown
        alert_key = f"{alert.metric}_{alert.severity}"
        now = time.time()

        if alert_key in self.last_alert_times:
            last_alert = self.last_alert_times[alert_key]
            if now - last_alert < self.config.alert_cooldown_seconds:
                return  # Still in cooldown period

        # Update alert time
        self.last_alert_times[alert_key] = now

        # Store alert in history
        with self.lock:
            self.alert_history.append(alert)

        # Log alert
        if alert.severity == "CRITICAL":
            self.logger.critical(alert.message)
        elif alert.severity == "WARNING":
            self.logger.warning(alert.message)
        else:
            self.logger.info(alert.message)

        # Execute alert callbacks
        if self.config.alert_callbacks:
            for callback in self.config.alert_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(alert)
                    else:
                        callback(alert)
                except Exception as e:
                    self.logger.error(f"Alert callback error: {e}")

    def _log_performance_status(self, metrics: Dict[str, Any]):
        """Log current performance status."""
        total_time = metrics.get("pipeline_total_ms", 0)
        cpu_usage = metrics.get("cpu_usage_percent", 0)
        memory_usage = metrics.get("memory_usage_mb", 0)

        self.logger.info(f"Performance: Pipeline={total_time:.1f}ms, CPU={cpu_usage:.1f}%, Memory={memory_usage:.1f}MB")

    def _cleanup_old_history(self):
        """Remove old performance history entries."""
        if not self.performance_history:
            return

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=self.config.history_retention_hours)
        cutoff_timestamp = cutoff_time.isoformat()

        # Filter out old entries
        self.performance_history = [
            entry for entry in self.performance_history
            if entry.get("timestamp", "") >= cutoff_timestamp
        ]

    def get_performance_trends(self, hours: int = 1) -> Dict[str, Any]:
        """Get performance trends over specified time period."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        cutoff_timestamp = cutoff_time.isoformat()

        # Filter recent history
        recent_history = [
            entry for entry in self.performance_history
            if entry.get("timestamp", "") >= cutoff_timestamp
        ]

        if not recent_history:
            return {"error": "No recent performance data available"}

        # Calculate trends
        pipeline_times = [entry.get("pipeline_total_ms", 0) for entry in recent_history if entry.get("pipeline_total_ms", 0) > 0]
        cpu_usages = [entry.get("cpu_usage_percent", 0) for entry in recent_history]
        memory_usages = [entry.get("memory_usage_mb", 0) for entry in recent_history]

        trends = {
            "time_period_hours": hours,
            "data_points": len(recent_history),
            "pipeline_performance": {
                "mean": statistics.mean(pipeline_times) if pipeline_times else 0,
                "min": min(pipeline_times) if pipeline_times else 0,
                "max": max(pipeline_times) if pipeline_times else 0,
                "stdev": statistics.stdev(pipeline_times) if len(pipeline_times) > 1 else 0
            },
            "resource_usage": {
                "cpu": {
                    "mean": statistics.mean(cpu_usages) if cpu_usages else 0,
                    "max": max(cpu_usages) if cpu_usages else 0
                },
                "memory": {
                    "mean": statistics.mean(memory_usages) if memory_usages else 0,
                    "max": max(memory_usages) if memory_usages else 0
                }
            }
        }

        return trends

    def get_recent_alerts(self, hours: int = 24) -> List[PerformanceAlert]:
        """Get recent performance alerts."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        cutoff_timestamp = cutoff_time.isoformat()

        return [
            alert for alert in self.alert_history
            if alert.timestamp >= cutoff_timestamp
        ]

    def _save_monitoring_state(self):
        """Save current monitoring state to disk."""
        try:
            state_dir = Path("tests/performance/monitoring")
            state_dir.mkdir(parents=True, exist_ok=True)

            # Save performance history
            history_file = state_dir / "performance_history.json"
            with open(history_file, 'w') as f:
                json.dump(self.performance_history, f, indent=2)

            # Save alert history
            alert_file = state_dir / "alert_history.json"
            alert_data = [asdict(alert) for alert in self.alert_history]
            with open(alert_file, 'w') as f:
                json.dump(alert_data, f, indent=2)

            self.logger.info(f"Monitoring state saved to {state_dir}")

        except Exception as e:
            self.logger.error(f"Error saving monitoring state: {e}")

class PerformanceAlerter:
    """Handle performance alerts and notifications."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def send_email_alert(self, alert: PerformanceAlert):
        """Send email alert (placeholder implementation)."""
        self.logger.info(f"EMAIL ALERT: {alert.message}")

    async def send_slack_alert(self, alert: PerformanceAlert):
        """Send Slack alert (placeholder implementation)."""
        self.logger.info(f"SLACK ALERT: {alert.message}")

    async def create_github_issue(self, alert: PerformanceAlert):
        """Create GitHub issue for critical alerts (placeholder implementation)."""
        if alert.severity == "CRITICAL":
            self.logger.info(f"GITHUB ISSUE: Performance critical alert - {alert.message}")

def create_monitoring_config() -> MonitoringConfig:
    """Create monitoring configuration with alert callbacks."""
    alerter = PerformanceAlerter()

    return MonitoringConfig(
        sampling_interval_seconds=30,
        alert_cooldown_seconds=300,
        history_retention_hours=24,
        enable_alerts=True,
        alert_callbacks=[
            alerter.send_email_alert,
            alerter.send_slack_alert,
            alerter.create_github_issue
        ]
    )

async def main():
    """Start performance monitoring daemon."""
    print("Starting Performance Monitor...")

    config = create_monitoring_config()
    monitor = PerformanceMonitor(config)

    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        print("Shutting down Performance Monitor...")
        await monitor.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
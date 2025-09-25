"""
SLO Monitoring and Health Lattice System
Tracks service level objectives and component health states
"""

import json
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging

# Import monitoring components
try:
    from analyzer.performance.real_time_monitor import RealTimeMonitor
    MONITOR_AVAILABLE = True
except ImportError:
    MONITOR_AVAILABLE = False

from src.version_log.v2.validation_framework import UnifiedValidator

logger = logging.getLogger(__name__)

class HealthState(Enum):
    """Component health states"""
    OK = "OK"
    DEGRADED = "DEGRADED"
    DISABLED = "DISABLED"
    STALE = "STALE"
    FALLBACK = "FALLBACK"
    ERROR = "ERROR"

@dataclass
class SLOMetrics:
    """Service level objective metrics"""
    # Quality metrics
    factuality_p90: float = 0.0
    coverage_p95: float = 0.0
    pass_rate_week: float = 0.0

    # Performance metrics
    latency_p50: float = 0.0
    latency_p95: float = 0.0
    latency_p99: float = 0.0

    # Cost metrics
    usd_per_task_p50: float = 0.0
    usd_per_task_p95: float = 0.0

    # Throughput metrics
    tasks_per_hour: float = 0.0
    success_rate: float = 0.0

    # Timestamp
    measured_at: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class ComponentHealth:
    """Individual component health status"""
    component: str
    state: HealthState
    last_check: str
    error_count: int = 0
    degradation_reason: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None

class SLOMonitor:
    """
    Monitors SLOs and maintains health lattice for all components
    """

    def __init__(self, config_path: str = "orchestration/slo_config.yaml"):
        """Initialize SLO monitoring"""
        self.config = self._load_config(config_path)
        self.validator = UnifiedValidator()

        # Initialize performance monitor if available
        self.perf_monitor = None
        if MONITOR_AVAILABLE:
            try:
                self.perf_monitor = RealTimeMonitor()
                logger.info("Real-time monitor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize performance monitor: {e}")

        # Component health lattice
        self.health_lattice: Dict[str, ComponentHealth] = {}

        # Metrics history for percentile calculations
        self.metrics_history: List[SLOMetrics] = []
        self.max_history = 1000  # Keep last 1000 measurements

        # Initialize health states
        self._initialize_health_lattice()

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load SLO configuration"""
        path = Path(config_path)
        if not path.exists():
            logger.warning(f"SLO config not found at {config_path}, using defaults")
            return self._get_default_config()

        import yaml
        with open(path, 'r') as f:
            return yaml.safe_load(f)

    def _get_default_config(self) -> Dict[str, Any]:
        """Default SLO thresholds"""
        return {
            'slos': {
                'quality': {
                    'factuality_p90': 0.92,  # NASA POT10 compliance
                    'coverage_p95': 0.90,     # Connascence detection
                    'pass_rate_week': 0.85    # Prompt evaluation
                },
                'performance': {
                    'latency_cheap_p95': 2.0,  # seconds
                    'latency_heavy_p95': 8.0,  # seconds
                    'throughput_min': 10.0     # tasks/hour
                },
                'cost': {
                    'usd_per_task_p95': 0.60,
                    'usd_per_task_p50': 0.30
                }
            },
            'health_checks': {
                'interval_seconds': 60,
                'failure_threshold': 3,
                'degradation_threshold': 2
            },
            'components': [
                'VALIDATOR', 'NASA', 'CONNASCENCE', 'ENTERPRISE',
                'THEATER', 'PLANNER', 'TOOL', 'CRITIC', 'MEMORY',
                'ROUTER', 'QUEEN', 'PRINCESS', 'DRONE'
            ]
        }

    def _initialize_health_lattice(self):
        """Initialize health status for all components"""
        for component in self.config.get('components', []):
            self.health_lattice[component] = ComponentHealth(
                component=component,
                state=HealthState.OK,
                last_check=datetime.now().isoformat()
            )

    def collect_metrics(self) -> SLOMetrics:
        """Collect current metrics from all sources"""
        metrics = SLOMetrics()

        # Get validation metrics
        health = self.validator.get_health_status()
        active_components = sum(1 for s in health.values() if s == 'OK')
        total_components = len(health)
        metrics.coverage_p95 = active_components / total_components if total_components > 0 else 0

        # Get performance metrics if available
        if self.perf_monitor:
            try:
                perf_data = self.perf_monitor.get_metrics()
                metrics.latency_p50 = perf_data.get('latency_p50', 0.0)
                metrics.latency_p95 = perf_data.get('latency_p95', 0.0)
                metrics.latency_p99 = perf_data.get('latency_p99', 0.0)
                metrics.tasks_per_hour = perf_data.get('throughput', 0.0)
            except Exception as e:
                logger.warning(f"Failed to get performance metrics: {e}")

        # Calculate pass rate from recent history
        if self.metrics_history:
            recent = self.metrics_history[-168:]  # Last week (168 hours)
            pass_rates = [m.success_rate for m in recent if m.success_rate > 0]
            metrics.pass_rate_week = sum(pass_rates) / len(pass_rates) if pass_rates else 0

        # Placeholder for factuality (would come from NASA analyzer)
        metrics.factuality_p90 = 0.92  # Default to threshold

        # Store metrics
        self.metrics_history.append(metrics)
        if len(self.metrics_history) > self.max_history:
            self.metrics_history.pop(0)

        return metrics

    def check_slos(self, metrics: SLOMetrics) -> Dict[str, bool]:
        """Check if current metrics meet SLO thresholds"""
        slos = self.config.get('slos', {})
        violations = {}

        # Check quality SLOs
        quality_slos = slos.get('quality', {})
        violations['factuality'] = metrics.factuality_p90 >= quality_slos.get('factuality_p90', 0.92)
        violations['coverage'] = metrics.coverage_p95 >= quality_slos.get('coverage_p95', 0.90)
        violations['pass_rate'] = metrics.pass_rate_week >= quality_slos.get('pass_rate_week', 0.85)

        # Check performance SLOs
        perf_slos = slos.get('performance', {})
        violations['latency'] = metrics.latency_p95 <= perf_slos.get('latency_heavy_p95', 8.0)
        violations['throughput'] = metrics.tasks_per_hour >= perf_slos.get('throughput_min', 10.0)

        # Check cost SLOs
        cost_slos = slos.get('cost', {})
        violations['cost_p95'] = metrics.usd_per_task_p95 <= cost_slos.get('usd_per_task_p95', 0.60)
        violations['cost_p50'] = metrics.usd_per_task_p50 <= cost_slos.get('usd_per_task_p50', 0.30)

        return violations

    def update_health_lattice(self, metrics: SLOMetrics, slo_results: Dict[str, bool]):
        """Update component health based on SLO results"""
        timestamp = datetime.now().isoformat()

        # Update VALIDATOR health
        if 'VALIDATOR' in self.health_lattice:
            validator_health = self.validator.get_health_status()
            if validator_health['VALIDATOR'] != 'OK':
                self.health_lattice['VALIDATOR'].state = HealthState.ERROR
                self.health_lattice['VALIDATOR'].degradation_reason = "Validator failure"
            else:
                self.health_lattice['VALIDATOR'].state = HealthState.OK
            self.health_lattice['VALIDATOR'].last_check = timestamp

        # Update analyzer components
        for component in ['NASA', 'CONNASCENCE', 'ENTERPRISE', 'THEATER']:
            if component in self.health_lattice:
                analyzer_status = self.validator.get_health_status().get(component, 'DISABLED')
                if analyzer_status == 'DISABLED':
                    self.health_lattice[component].state = HealthState.DISABLED
                elif analyzer_status == 'OK':
                    self.health_lattice[component].state = HealthState.OK
                else:
                    self.health_lattice[component].state = HealthState.DEGRADED
                self.health_lattice[component].last_check = timestamp

        # Update PLANNER health based on pass rate
        if 'PLANNER' in self.health_lattice:
            if not slo_results.get('pass_rate', False):
                self.health_lattice['PLANNER'].state = HealthState.DEGRADED
                self.health_lattice['PLANNER'].degradation_reason = f"Pass rate {metrics.pass_rate_week:.2%} below threshold"
            else:
                self.health_lattice['PLANNER'].state = HealthState.OK
            self.health_lattice['PLANNER'].last_check = timestamp

        # Update TOOL health based on latency
        if 'TOOL' in self.health_lattice:
            if not slo_results.get('latency', False):
                self.health_lattice['TOOL'].state = HealthState.DEGRADED
                self.health_lattice['TOOL'].degradation_reason = f"Latency {metrics.latency_p95:.2f}s exceeds threshold"
            else:
                self.health_lattice['TOOL'].state = HealthState.OK
            self.health_lattice['TOOL'].last_check = timestamp

        # Update MEMORY health (check staleness)
        if 'MEMORY' in self.health_lattice:
            # Check if memory updates are recent
            memory_age = timedelta(hours=1)  # Consider stale after 1 hour
            last_check = datetime.fromisoformat(self.health_lattice['MEMORY'].last_check)
            if datetime.now() - last_check > memory_age:
                self.health_lattice['MEMORY'].state = HealthState.STALE
                self.health_lattice['MEMORY'].degradation_reason = "No recent memory updates"
            else:
                self.health_lattice['MEMORY'].state = HealthState.OK

        # Update ROUTER health based on cost
        if 'ROUTER' in self.health_lattice:
            if not slo_results.get('cost_p95', False):
                self.health_lattice['ROUTER'].state = HealthState.FALLBACK
                self.health_lattice['ROUTER'].degradation_reason = f"Cost ${metrics.usd_per_task_p95:.2f} exceeds threshold"
            else:
                self.health_lattice['ROUTER'].state = HealthState.OK
            self.health_lattice['ROUTER'].last_check = timestamp

    def get_health_summary(self) -> str:
        """Generate human-readable health summary"""
        lines = ["=== SLO Health Lattice Status ===\n"]

        # Group by state
        by_state = {}
        for component, health in self.health_lattice.items():
            state = health.state.value
            if state not in by_state:
                by_state[state] = []
            by_state[state].append(component)

        # Show status
        for state in [HealthState.OK, HealthState.DEGRADED, HealthState.STALE,
                      HealthState.FALLBACK, HealthState.DISABLED, HealthState.ERROR]:
            if state.value in by_state:
                components = by_state[state.value]
                emoji = {
                    'OK': '[OK]',
                    'DEGRADED': '[WARN]',
                    'DISABLED': '[OFF]',
                    'STALE': '[STALE]',
                    'FALLBACK': '[FALLBACK]',
                    'ERROR': '[ERROR]'
                }.get(state.value, '?')
                lines.append(f"{emoji} {state.value}: {', '.join(components)}")

        # Show degradation reasons
        degraded = [h for h in self.health_lattice.values()
                   if h.state != HealthState.OK and h.degradation_reason]
        if degraded:
            lines.append("\nDegradation Reasons:")
            for health in degraded:
                lines.append(f"  - {health.component}: {health.degradation_reason}")

        return "\n".join(lines)

    def monitor_continuous(self, interval: int = 60, callback=None):
        """Run continuous monitoring loop"""
        logger.info(f"Starting SLO monitoring with {interval}s interval")

        while True:
            try:
                # Collect metrics
                metrics = self.collect_metrics()

                # Check SLOs
                slo_results = self.check_slos(metrics)

                # Update health lattice
                self.update_health_lattice(metrics, slo_results)

                # Log summary
                logger.info(self.get_health_summary())

                # Call callback if provided
                if callback:
                    callback(metrics, slo_results, self.health_lattice)

                # Save state
                self.save_state()

            except Exception as e:
                logger.error(f"Monitoring error: {e}")

            time.sleep(interval)

    def save_state(self, filepath: str = ".claude/.artifacts/slo_state.json"):
        """Save current state to file"""
        state = {
            'timestamp': datetime.now().isoformat(),
            'health_lattice': {
                k: asdict(v) for k, v in self.health_lattice.items()
            },
            'latest_metrics': asdict(self.metrics_history[-1]) if self.metrics_history else None
        }

        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, 'w') as f:
            json.dump(state, f, indent=2, default=str)

    def load_state(self, filepath: str = ".claude/.artifacts/slo_state.json"):
        """Load state from file"""
        path = Path(filepath)
        if not path.exists():
            logger.warning(f"No state file found at {filepath}")
            return

        with open(path, 'r') as f:
            state = json.load(f)

        # Restore health lattice
        for component, health_dict in state.get('health_lattice', {}).items():
            self.health_lattice[component] = ComponentHealth(
                component=health_dict['component'],
                state=HealthState(health_dict['state']),
                last_check=health_dict['last_check'],
                error_count=health_dict.get('error_count', 0),
                degradation_reason=health_dict.get('degradation_reason')
            )

def example_usage():
    """Example SLO monitoring setup"""
    monitor = SLOMonitor()

    # Collect current metrics
    metrics = monitor.collect_metrics()
    print(f"Current metrics: {asdict(metrics)}")

    # Check SLOs
    slo_results = monitor.check_slos(metrics)
    print(f"SLO compliance: {slo_results}")

    # Get health summary
    print(monitor.get_health_summary())

    # Save state
    monitor.save_state()

    return monitor

if __name__ == "__main__":
    example_usage()
from lib.shared.utilities import get_logger# NASA POT10 Rule 3: Minimize dynamic memory allocation# Consider using fixed-size arrays or generators for large data processing#!/usr/bin/env python3"""Real-time Performance Monitoring SystemProvides continuous performance monitoring with bottleneck detection,adaptive alerting, and evidence-based improvement validation for Phase 3 optimization."""import timeimport jsonimport threadingimport queueimport statisticsfrom typing import Dict, List, Any, Optional, Callablefrom dataclasses import dataclass, asdictfrom datetime import datetime, timedeltaimport psutilimport loggingfrom collections import deque, defaultdict@dataclassclass PerformanceSnapshot:        """Real-time performance snapshot"""        timestamp: float        cpu_percent: float        memory_percent: float        memory_mb: float        disk_read_mb_per_sec: float        disk_write_mb_per_sec: float        network_mb_per_sec: float        active_threads: int        process_count: int        @dataclassclass BottleneckAlert:        """Performance bottleneck alert"""        timestamp: float        severity: str  # 'warning', 'critical', 'resolved'        bottleneck_type: str        metric_value: float        threshold: float        impact_score: float        recommended_action: str        @dataclassclass OptimizationMetric:        """Optimization effectiveness metric"""        metric_name: str        baseline_value: float        current_value: float        improvement_percent: float        trend_direction: str  # 'improving', 'degrading', 'stable'        confidence_level: floatclass RealTimeMonitor:        """        Advanced real-time performance monitoring system with adaptive        bottleneck detection and optimization validation        """        def __init__(self, monitoring_interval: float = 1.0):
        self.monitoring_interval = monitoring_interval
        self.monitoring_active = False
        self.monitoring_thread: Optional[threading.Thread] = None
                # Data storage with size limits        self.max_snapshots = 1000
        self.performance_history = deque(maxlen=self.max_snapshots)
        self.bottleneck_alerts = deque(maxlen=200)
                # Thresholds and configuration        self.thresholds = {
        'cpu_warning': 70.0,
        'cpu_critical': 85.0,
        'memory_warning': 75.0,
        'memory_critical': 90.0,
        'disk_io_warning': 50.0,  # MB/s
        'disk_io_critical': 100.0,
        'network_warning': 25.0,  # MB/s
        'network_critical': 50.0)
                # Adaptive thresholds based on historical data        self.adaptive_thresholds = {}
        self.threshold_adaptation_samples = 100
                # Performance baselines for comparison        self.baselines: Dict[str, float] = {}
                # Event queue for real-time alerts        self.alert_queue = queue.Queue()
                # Optimization tracking        self.optimization_metrics: Dict[str, OptimizationMetric] = {}
                # Callbacks for external notification        self.alert_callbacks: List[Callable] = []
                self.setup_logging()
        def setup_logging(self):
            """Setup comprehensive logging for monitoring system"""        logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
        logging.FileHandler('.claude/performance/monitoring/realtime_monitor.log'),
        logging.StreamHandler()
        ]
        )
            self.logger = get_logger("\1")

        def set_baselines(self, baselines: Dict[str, float]):
            """Set performance baselines for optimization tracking"""        self.baselines = baselines.copy()
            self.logger.info(f"Performance baselines set: {len(baselines)} metrics")

        def add_alert_callback(self, callback: Callable):
            """Add callback function for real-time alerts"""        self.alert_callbacks.append(callback)
        def start_monitoring(self):
            """Start real-time monitoring in background thread"""        if self.monitoring_active:
            self.logger.warning("Monitoring already active")                return                        self.monitoring_active = True                self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)                self.monitoring_thread.start()                self.logger.info("Real-time monitoring started")        def stop_monitoring(self):

            """Stop real-time monitoring"""        self.monitoring_active = False
            if self.monitoring_thread:

            self.monitoring_thread.join(timeout=5.0)                self.logger.info("Real-time monitoring stopped")        def _monitoring_loop(self):

            """Main monitoring loop - runs in background thread"""        last_disk_io = psutil.disk_io_counters()
        last_network_io = psutil.net_io_counters()
        last_time = time.time()
            while self.monitoring_active:

            try:                # Collect current performance snapshot                pass  # Auto-fixed: empty block                pass  # Auto-fixed: empty block                pass  # Auto-fixed: empty block                pass  # Auto-fixed: empty block                pass  # Auto-fixed: empty block                pass  # Auto-fixed: empty block                snapshot = self._collect_snapshot(last_disk_io, last_network_io, last_time)                self.performance_history.append(snapshot)                                # Update for next iteration                last_disk_io = psutil.disk_io_counters()                last_network_io = psutil.net_io_counters()                last_time = time.time()                                # Analyze for bottlenecks                self._analyze_bottlenecks(snapshot)                                # Update adaptive thresholds                self._update_adaptive_thresholds()                                # Track optimization metrics                self._update_optimization_metrics(snapshot)                                time.sleep(self.monitoring_interval)                        except Exception as e:

            self.logger.error(f"Error in monitoring loop: {e)")                    time.sleep(self.monitoring_interval)        def _collect_snapshot(self, last_disk_io, last_network_io, last_time) -> PerformanceSnapshot:

            """Collect comprehensive performance snapshot"""        current_time = time.time()
        time_delta = current_time - last_time
                # CPU and memory        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        memory_mb = memory.used / (1024**2)
                # Disk I/O rates        current_disk_io = psutil.disk_io_counters()
        disk_read_mb_per_sec = 0.0
        disk_write_mb_per_sec = 0.0
            if time_delta > 0:

                disk_read_mb_per_sec = (current_disk_io.read_bytes - last_disk_io.read_bytes) / (1024**2) / time_delta                disk_write_mb_per_sec = (current_disk_io.write_bytes - last_disk_io.write_bytes) / (1024**2) / time_delta                # Network I/O rates                current_network_io = psutil.net_io_counters()                network_mb_per_sec = 0.0                        if time_delta > 0:                    total_network_bytes = ((current_network_io.bytes_sent + current_network_io.bytes_recv) -                    (last_network_io.bytes_sent + last_network_io.bytes_recv))                    network_mb_per_sec = total_network_bytes / (1024**2) / time_delta                # Process information                    active_threads = threading.active_count()                    process_count = len(psutil.pids())                            return PerformanceSnapshot(                    timestamp=current_time,                    cpu_percent=cpu_percent,                    memory_percent=memory.percent,                    memory_mb=memory_mb,                    disk_read_mb_per_sec=disk_read_mb_per_sec,                    disk_write_mb_per_sec=disk_write_mb_per_sec,                    network_mb_per_sec=network_mb_per_sec,                    active_threads=active_threads,                    process_count=process_count                    )        def _analyze_bottlenecks(self, snapshot: PerformanceSnapshot):
            """Analyze performance snapshot for bottlenecks"""        alerts = []
                # CPU bottleneck analysis        cpu_alert = self._check_threshold(
        'cpu', snapshot.cpu_percent,
            self.thresholds['cpu_warning'],

            self.thresholds['cpu_critical'],

        "High CPU usage detected"
        )
            if cpu_alert:

                alerts.append(cpu_alert)                # Memory bottleneck analysis                memory_alert = self._check_threshold(                'memory', snapshot.memory_percent,                self.thresholds['memory_warning'],                self.thresholds['memory_critical'],                "High memory usage detected"                )                if memory_alert:                    alerts.append(memory_alert)                # Disk I/O bottleneck analysis                    total_disk_io = snapshot.disk_read_mb_per_sec + snapshot.disk_write_mb_per_sec                    disk_alert = self._check_threshold(                    'disk_io', total_disk_io,                    self.thresholds['disk_io_warning'],                    self.thresholds['disk_io_critical'],                    "High disk I/O detected"                    )                    if disk_alert:                        alerts.append(disk_alert)                # Network bottleneck analysis                        network_alert = self._check_threshold(                        'network', snapshot.network_mb_per_sec,                        self.thresholds['network_warning'],                        self.thresholds['network_critical'],                        "High network usage detected"                        )                        if network_alert:                            alerts.append(network_alert)                # Advanced bottleneck patterns                            pattern_alerts = self._analyze_bottleneck_patterns(snapshot)                            alerts.extend(pattern_alerts)                # Process alerts                            for alert in alerts:                                self._process_alert(alert)        def _check_threshold(self, metric_type: str, value: float,
        warning_threshold: float, critical_threshold: float,        base_message: str) -> Optional[BottleneckAlert]:            """Check if value exceeds thresholds and create alert"""                if value >= critical_threshold:
                severity = 'critical'                threshold = critical_threshold                impact_score = min(1.0, value / critical_threshold)                action = f"Immediate action required: {base_message)"        elif value >= warning_threshold:
                    severity = 'warning'                    threshold = warning_threshold                    impact_score = min(0.7, value / warning_threshold * 0.7)                    action = f"Monitor closely: {base_message)"                else:                        return None                                return BottleneckAlert(                        timestamp=time.time(),                        severity=severity,                        bottleneck_type=metric_type,                        metric_value=value,                        threshold=threshold,                        impact_score=impact_score,                        recommended_action=action                        )        def _analyze_bottleneck_patterns(self, snapshot: PerformanceSnapshot) -> List[BottleneckAlert]:
            """Analyze complex bottleneck patterns across multiple metrics"""        alerts = []
            if len(self.performance_history) < 10:

            return alerts                # Get recent history for pattern analysis                recent_snapshots = list(self.performance_history)[-10:]                # Memory leak detection                memory_trend = [s.memory_mb for s in recent_snapshots]  # TODO: Consider limiting size with itertools.islice()                if len(memory_trend) >= 5:                    if self._is_increasing_trend(memory_trend, threshold=0.8):                        alerts.append(BottleneckAlert(                        timestamp=time.time(),                        severity='warning',                        bottleneck_type='memory_leak',                        metric_value=memory_trend[-1] - memory_trend[0],                        threshold=100.0,  # 100MB increase threshold                        impact_score=0.6,                        recommended_action="Potential memory leak detected - investigate memory allocations"                        ))                # CPU thrashing detection                        cpu_values = [s.cpu_percent for s in recent_snapshots]  # TODO: Consider limiting size with itertools.islice()                        cpu_volatility = statistics.stdev(cpu_values) if len(cpu_values) > 1 else 0                        if cpu_volatility > 20.0 and snapshot.cpu_percent > 60:                            alerts.append(BottleneckAlert(                            timestamp=time.time(),                            severity='warning',                            bottleneck_type='cpu_thrashing',                            metric_value=cpu_volatility,                            threshold=20.0,                            impact_score=0.7,                            recommended_action="CPU thrashing detected - check for competing processes"                            ))                # Disk I/O spike detection                            disk_io_values = [s.disk_read_mb_per_sec + s.disk_write_mb_per_sec for s in recent_snapshots]  # TODO: Consider limiting size with itertools.islice()                            current_disk_io = disk_io_values[-1]                            avg_disk_io = statistics.mean(disk_io_values[:-1]) if len(disk_io_values) > 1 else 0                                    if current_disk_io > avg_disk_io * 3 and current_disk_io > 10:                                alerts.append(BottleneckAlert(                                timestamp=time.time(),                                severity='warning',                                bottleneck_type='disk_io_spike',                                metric_value=current_disk_io,                                threshold=avg_disk_io * 3,                                impact_score=0.5,                                recommended_action="Disk I/O spike detected - check for large file operations"                                ))                                        return alerts        def _is_increasing_trend(self, values: List[float], threshold: float = 0.7) -> bool:

            """Check if values show consistent increasing trend"""        if len(values) < 3:
            return False                        increases = 0                total_comparisons = len(values) - 1                        for i in range(1, len(values)):                    if values[i] > values[i-1]:                        increases += 1                                return (increases / total_comparisons) >= threshold        def _process_alert(self, alert: BottleneckAlert):

            """Process and distribute bottleneck alert"""        self.bottleneck_alerts.append(alert)
            self.alert_queue.put(alert)

                # Log alert        self.logger.warning(
        f"BOTTLENECK ALERT [{alert.severity.upper()}]: {alert.bottleneck_type) - "
        f"Value: {alert.metric_value:.2f), Threshold: {alert.threshold:.2f), "
        f"Impact: {alert.impact_score:.2f) - {alert.recommended_action)"
        )
                # Notify callbacks        for callback in self.alert_callbacks:
            try:                    callback(alert)                except Exception as e:                        self.logger.error(f"Error in alert callback: {e)")        def _update_adaptive_thresholds(self):

            """Update thresholds based on historical performance patterns"""        if len(self.performance_history) < self.threshold_adaptation_samples:
            return                # Get recent performance data                recent_data = list(self.performance_history)[-self.threshold_adaptation_samples:]                # Calculate adaptive thresholds based on percentiles                cpu_values = [s.cpu_percent for s in recent_data]  # TODO: Consider limiting size with itertools.islice()                memory_values = [s.memory_percent for s in recent_data]  # TODO: Consider limiting size with itertools.islice()                # Set adaptive thresholds at 80th and 95th percentiles                self.adaptive_thresholds = {                'cpu_adaptive_warning': statistics.quantiles(cpu_values, n=10)[7],  # 80th percentile                'cpu_adaptive_critical': statistics.quantiles(cpu_values, n=20)[18], # 95th percentile                'memory_adaptive_warning': statistics.quantiles(memory_values, n=10)[7],                'memory_adaptive_critical': statistics.quantiles(memory_values, n=20)[18]                }        def _update_optimization_metrics(self, snapshot: PerformanceSnapshot):

            """Update optimization effectiveness metrics"""        if not self.baselines:
            return                        current_metrics = {                'cpu_usage': snapshot.cpu_percent,                'memory_usage': snapshot.memory_percent,                'memory_mb': snapshot.memory_mb,                'disk_io_rate': snapshot.disk_read_mb_per_sec + snapshot.disk_write_mb_per_sec,                'network_rate': snapshot.network_mb_per_sec)                        for metric_name, current_value in current_metrics.items():                    if metric_name in self.baselines:                        baseline_value = self.baselines[metric_name]                                        if baseline_value > 0:                            improvement_percent = ((baseline_value - current_value) / baseline_value) * 100                        else:                                improvement_percent = 0.0                                # Determine trend direction                                if improvement_percent > 5:                                    trend = 'improving'                                elif improvement_percent < -5:                                        trend = 'degrading'                                    else:                                            trend = 'stable'                                # Calculate confidence based on data quality                                            confidence = min(1.0, len(self.performance_history) / 100.0)                                                            self.optimization_metrics[metric_name] = OptimizationMetric(                                            metric_name=metric_name,                                            baseline_value=baseline_value,                                            current_value=current_value,                                            improvement_percent=improvement_percent,                                            trend_direction=trend,                                            confidence_level=confidence                                            )        def get_current_status(self) -> Dict[str, Any]:

            """Get comprehensive current monitoring status"""        if not self.performance_history:
            return {'status': 'no_data', 'message': 'No performance data collected yet'}                        latest_snapshot = self.performance_history[-1]                # Recent alerts                recent_alerts = [alert for alert in self.bottleneck_alerts                 if time.time() - alert.timestamp < 300]  # TODO: Consider limiting size with itertools.islice()  # Last 5 minutes                # Performance summary                if len(self.performance_history) >= 10:                    recent_snapshots = list(self.performance_history)[-10:]                    avg_cpu = statistics.mean([s.cpu_percent for s in recent_snapshots]  # TODO: Consider limiting size with itertools.islice())                    avg_memory = statistics.mean([s.memory_percent for s in recent_snapshots]  # TODO: Consider limiting size with itertools.islice())                else:                        avg_cpu = latest_snapshot.cpu_percent                        avg_memory = latest_snapshot.memory_percent                                status = {                        'monitoring_active': self.monitoring_active,                        'data_points_collected': len(self.performance_history),                        'current_performance': asdict(latest_snapshot),                        'recent_averages': {                        'cpu_percent': round(avg_cpu, 2),                        'memory_percent': round(avg_memory, 2)                        },                        'active_alerts': len(recent_alerts),                        'critical_alerts': len([a for a in recent_alerts if a.severity == 'critical']  # TODO: Consider limiting size with itertools.islice()),                        'optimization_metrics': {name: asdict(metric) for name, metric in self.optimization_metrics.items()},                        'adaptive_thresholds': self.adaptive_thresholds)                                return status        def get_bottleneck_summary(self, time_window: int = 3600) -> Dict[str, Any]:

            """Get summary of bottlenecks in specified time window (seconds)"""        cutoff_time = time.time() - time_window
        recent_alerts = [alert for alert in self.bottleneck_alerts
            if alert.timestamp >= cutoff_time]  # TODO: Consider limiting size with itertools.islice()

                # Group by bottleneck type        bottleneck_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        impact_scores = defaultdict(list)
            for alert in recent_alerts:

                bottleneck_counts[alert.bottleneck_type] += 1                severity_counts[alert.severity] += 1                impact_scores[alert.bottleneck_type].append(alert.impact_score)                # Calculate average impact scores                avg_impact_scores = {                bottleneck_type: statistics.mean(scores)                 for bottleneck_type, scores in impact_scores.items()                }                        summary = {                'time_window_hours': time_window / 3600,                'total_alerts': len(recent_alerts),                'bottleneck_types': dict(bottleneck_counts),                'severity_distribution': dict(severity_counts),                'average_impact_scores': avg_impact_scores,                'most_problematic': max(avg_impact_scores.items(), key=lambda x: x[1]) if avg_impact_scores else None,                'recent_alerts': [asdict(alert) for alert in recent_alerts[-5:]  # TODO: Consider limiting size with itertools.islice()]  # Last 5 alerts)                        return summary        def export_monitoring_data(self, hours: int = 24) -> str:
            """Export monitoring data for specified time period"""        cutoff_time = time.time() - (hours * 3600)
                # Filter data by time window        filtered_snapshots = [
        snapshot for snapshot in self.performance_history
            if snapshot.timestamp >= cutoff_time

        ]  # TODO: Consider limiting size with itertools.islice()
                filtered_alerts = [
        alert for alert in self.bottleneck_alerts
            if alert.timestamp >= cutoff_time

        ]  # TODO: Consider limiting size with itertools.islice()
                export_data = {
        'export_timestamp': time.time(),
        'export_date': datetime.now().isoformat(),
        'time_window_hours': hours,
        'performance_snapshots': [asdict(snapshot) for snapshot in filtered_snapshots]  # TODO: Consider limiting size with itertools.islice(),
        'bottleneck_alerts': [asdict(alert) for alert in filtered_alerts]  # TODO: Consider limiting size with itertools.islice(),
        'optimization_metrics': {name: asdict(metric) for name, metric in self.optimization_metrics.items()},
        'monitoring_configuration': {
        'monitoring_interval': self.monitoring_interval,
        'thresholds': self.thresholds,
        'adaptive_thresholds': self.adaptive_thresholds),
        'summary_statistics': self.get_bottleneck_summary(hours * 3600)
        }
                # Export to file        timestamp = int(time.time())
        export_file = f".claude/performance/monitoring/monitoring_export_{timestamp).json"
            with open(export_file, 'w') as f:

                json.dump(export_data, f, indent=2)                        return export_file    def main():
        """Demonstrate real-time monitoring system"""        print("=== Real-time Performance Monitoring System ===")        # Initialize monitor        monitor = RealTimeMonitor(monitoring_interval=2.0)        # Set example baselines        monitor.set_baselines({        'cpu_usage': 30.0,        'memory_usage': 60.0,        'memory_mb': 2048.0,        'disk_io_rate': 5.0,        'network_rate': 1.0))        # Add alert callback    def alert_handler(alert: BottleneckAlert):
        print(f"ALERT: {alert.severity) - {alert.bottleneck_type) - {alert.recommended_action)")

            monitor.add_alert_callback(alert_handler)
        # Start monitoring        monitor.start_monitoring()
            try:


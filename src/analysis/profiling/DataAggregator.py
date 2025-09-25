"""
DataAggregator - Extracted from result_aggregation_profiler
Handles data collection and aggregation
Part of god object decomposition (Day 4)
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Set
import json
import logging

from dataclasses import dataclass, field
import statistics

logger = logging.getLogger(__name__)

@dataclass
class DataPoint:
    """Individual data point."""
    timestamp: datetime
    metric_name: str
    value: float
    tags: Dict[str, str]
    metadata: Dict[str, Any]

@dataclass
class AggregationResult:
    """Result of data aggregation."""
    metric_name: str
    count: int
    sum: float
    mean: float
    median: float
    min: float
    max: float
    std_dev: float
    percentiles: Dict[int, float]
    time_range: Tuple[datetime, datetime]

@dataclass
class TimeSeries:
    """Time series data structure."""
    name: str
    data_points: List[DataPoint]
    resolution: str  # second, minute, hour, day
    aggregation_method: str  # sum, avg, min, max, count

class DataAggregator:
    """
    Handles data collection and aggregation.

    Extracted from result_aggregation_profiler (1, 16 LOC -> ~250 LOC component).
    Handles:
    - Data collection from multiple sources
    - Time-based aggregation
    - Statistical calculations
    - Data normalization
    - Result caching
    """

def __init__(self):
        """Initialize data aggregator."""
        self.data_points: List[DataPoint] = []
        self.time_series: Dict[str, TimeSeries] = {}
        self.aggregation_cache: Dict[str, AggregationResult] = {}
        self.data_sources: Dict[str, Any] = {}

def add_data_point(self,
                        metric_name: str,
                        value: float,
                        tags: Optional[Dict[str, str]] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add single data point."""
        data_point = DataPoint(
            timestamp=datetime.now(),
            metric_name=metric_name,
            value=value,
            tags=tags or {},
            metadata=metadata or {}
        )

        self.data_points.append(data_point)

        # Add to time series if exists
        if metric_name in self.time_series:
            self.time_series[metric_name].data_points.append(data_point)

        # Clear cache for this metric
        self._clear_cache(metric_name)

def bulk_add_data(self, data_points: List[Dict[str, Any]]) -> int:
        """Add multiple data points in bulk."""
        added = 0

        for point in data_points:
            try:
                self.add_data_point(
                    metric_name=point.get('metric', 'unknown'),
                    value=float(point.get('value', 0)),
                    tags=point.get('tags', {}),
                    metadata=point.get('metadata', {})
                )
                added += 1
            except (ValueError, KeyError) as e:
                logger.warning(f"Failed to add data point: {e}")

        return added

def aggregate_metric(self,
                        metric_name: str,
                        start_time: Optional[datetime] = None,
                        end_time: Optional[datetime] = None) -> Optional[AggregationResult]:
        """Aggregate data for specific metric."""
        # Check cache
        cache_key = f"{metric_name}:{start_time}:{end_time}"
        if cache_key in self.aggregation_cache:
            return self.aggregation_cache[cache_key]

        # Filter data points
        points = self._filter_data_points(metric_name, start_time, end_time)

        if not points:
            return None

        values = [p.value for p in points]

        # Calculate statistics
        result = AggregationResult(
            metric_name=metric_name,
            count=len(values),
            sum=sum(values),
            mean=statistics.mean(values),
            median=statistics.median(values),
            min=min(values),
            max=max(values),
            std_dev=statistics.stdev(values) if len(values) > 1 else 0,
            percentiles=self._calculate_percentiles(values),
            time_range=(
                min(p.timestamp for p in points),
                max(p.timestamp for p in points)
            )
        )

        # Cache result
        self.aggregation_cache[cache_key] = result
        return result

def _filter_data_points(self,
                            metric_name: str,
                            start_time: Optional[datetime],
                            end_time: Optional[datetime]) -> List[DataPoint]:
        """Filter data points by metric and time range."""
        points = [p for p in self.data_points if p.metric_name == metric_name]

        if start_time:
            points = [p for p in points if p.timestamp >= start_time]

        if end_time:
            points = [p for p in points if p.timestamp <= end_time]

        return points

def _calculate_percentiles(self, values: List[float]) -> Dict[int, float]:
        """Calculate standard percentiles."""
        if not values:
            return {}

        sorted_values = sorted(values)
        n = len(sorted_values)

        percentiles = {}
        for p in [25, 50, 75, 90, 95, 99]:
            index = int(n * p / 100)
            if index < n:
                percentiles[p] = sorted_values[index]
            else:
                percentiles[p] = sorted_values[-1]

        return percentiles

def create_time_series(self,
                            name: str,
                            resolution: str = 'minute',
                            aggregation_method: str = 'avg') -> TimeSeries:
        """Create new time series for tracking."""
        ts = TimeSeries(
            name=name,
            data_points=[],
            resolution=resolution,
            aggregation_method=aggregation_method
        )

        self.time_series[name] = ts
        return ts

def aggregate_time_series(self,
                            series_name: str,
                            window: timedelta) -> List[Dict[str, Any]]:
        """Aggregate time series data over specified window."""
        if series_name not in self.time_series:
            return []

        series = self.time_series[series_name]
        if not series.data_points:
            return []

        # Group by time windows
        buckets = defaultdict(list)
        start_time = min(p.timestamp for p in series.data_points)
        end_time = max(p.timestamp for p in series.data_points)

        current = start_time
        while current <= end_time:
            bucket_end = current + window

            # Find points in this bucket
            bucket_points = [
                p for p in series.data_points
                if current <= p.timestamp < bucket_end
            ]

            if bucket_points:
                values = [p.value for p in bucket_points]

                # Apply aggregation method
                if series.aggregation_method == 'sum':
                    agg_value = sum(values)
                elif series.aggregation_method == 'min':
                    agg_value = min(values)
                elif series.aggregation_method == 'max':
                    agg_value = max(values)
                elif series.aggregation_method == 'count':
                    agg_value = len(values)
                else:  # avg
                    agg_value = statistics.mean(values)

                buckets[current] = {
                    'timestamp': current.isoformat(),
                    'value': agg_value,
                    'count': len(values)
                }

            current = bucket_end

        return list(buckets.values())

def correlate_metrics(self,
                        metric1: str,
                        metric2: str) -> float:
        """Calculate correlation between two metrics."""
        points1 = self._filter_data_points(metric1, None, None)
        points2 = self._filter_data_points(metric2, None, None)

        if not points1 or not points2:
            return 0.0

        # Align by timestamp (simplified)
        values1 = [p.value for p in points1[:min(len(points1), len(points2))]]
        values2 = [p.value for p in points2[:min(len(points1), len(points2))]]

        if len(values1) < 2:
            return 0.0

        # Calculate Pearson correlation coefficient
        mean1 = statistics.mean(values1)
        mean2 = statistics.mean(values2)

        numerator = sum((v1 - mean1) * (v2 - mean2) for v1, v2 in zip(values1, values2))
        denominator1 = sum((v - mean1) ** 2 for v in values1)
        denominator2 = sum((v - mean2) ** 2 for v in values2)

        if denominator1 == 0 or denominator2 == 0:
            return 0.0

        return numerator / (denominator1 * denominator2) ** 0.5

def group_by_tags(self,
                    metric_name: str,
                    tag_key: str) -> Dict[str, List[DataPoint]]:
        """Group data points by tag value."""
        points = self._filter_data_points(metric_name, None, None)
        groups = defaultdict(list)

        for point in points:
            tag_value = point.tags.get(tag_key, 'untagged')
            groups[tag_value].append(point)

        return dict(groups)

def detect_anomalies(self,
                        metric_name: str,
                        threshold_std: float = 3.0) -> List[DataPoint]:
        """Detect anomalies using standard deviation method."""
        aggregation = self.aggregate_metric(metric_name)
        if not aggregation or aggregation.count < 10:
            return []

        anomalies = []
        points = self._filter_data_points(metric_name, None, None)

        for point in points:
            z_score = abs(point.value - aggregation.mean) / aggregation.std_dev if aggregation.std_dev > 0 else 0
            if z_score > threshold_std:
                anomalies.append(point)

        return anomalies

def get_trending_metrics(self, window: timedelta = timedelta(hours=1)) -> List[str]:
        """Get metrics with increasing trend."""
        trending = []
        now = datetime.now()

        for metric_name in set(p.metric_name for p in self.data_points):
            recent = self._filter_data_points(metric_name, now - window, now)
            older = self._filter_data_points(metric_name, now - (window * 2), now - window)

            if recent and older:
                recent_avg = statistics.mean([p.value for p in recent])
                older_avg = statistics.mean([p.value for p in older])

                if recent_avg > older_avg * 1.1:  # 10% increase
                    trending.append(metric_name)

        return trending

def _clear_cache(self, metric_name: Optional[str] = None) -> None:
        """Clear aggregation cache."""
        if metric_name:
            # Clear only specific metric
            keys_to_remove = [k for k in self.aggregation_cache if k.startswith(f"{metric_name}:")]
            for key in keys_to_remove:
                del self.aggregation_cache[key]
        else:
            # Clear all
            self.aggregation_cache.clear()

def export_data(self, format: str = 'json') -> Any:
        """Export aggregated data."""
        if format == 'json':
            return {
                'data_points': len(self.data_points),
                'metrics': list(set(p.metric_name for p in self.data_points)),
                'time_series': list(self.time_series.keys()),
                'aggregations': {
                    k: {
                        'count': v.count,
                        'mean': v.mean,
                        'min': v.min,
                        'max': v.max
                    }
                    for k, v in self.aggregation_cache.items()
                }
            }
        return None
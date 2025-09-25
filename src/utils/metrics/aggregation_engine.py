"""
Metric Aggregation Engine

Consolidates metric aggregation patterns found across 25+ files.
Provides standardized metric collection and aggregation.
"""

from collections import defaultdict
from typing import Dict, List, Any, Optional, Callable

from dataclasses import dataclass, field
import statistics

@dataclass
class MetricData:
    """Container for metric data."""
    name: str
    value: float
    unit: str = ""
    tags: Dict[str, str] = field(default_factory=dict)
    timestamp: Optional[float] = None

class AggregationEngine:
    """Engine for aggregating metrics across multiple sources."""

def __init__(self):
        """Initialize aggregation engine."""
        self._metrics: Dict[str, List[MetricData]] = defaultdict(list)
        self._aggregators: Dict[str, Callable] = {
            'sum': sum,
            'mean': statistics.mean,
            'median': statistics.median,
            'min': min,
            'max': max,
            'count': len
        }

def add_metric(self, metric: MetricData) -> None:
        """Add a metric to the engine."""
        if not isinstance(metric, MetricData):
            raise TypeError("Must provide MetricData instance")

        self._metrics[metric.name].append(metric)

def aggregate(
        self,
        metric_name: str,
        method: str = 'mean'
    ) -> Optional[float]:
        """
        Aggregate metrics by name using specified method.

        Args:
            metric_name: Name of metric to aggregate
            method: Aggregation method (sum, mean, median, min, max, count)

        Returns:
            Aggregated value or None if no metrics found
        """
        if metric_name not in self._metrics:
            return None

        metrics = self._metrics[metric_name]
        if not metrics:
            return None

        values = [m.value for m in metrics]

        aggregator = self._aggregators.get(method)
        if not aggregator:
            raise ValueError(f"Unknown aggregation method: {method}")

        try:
            return aggregator(values)
        except Exception as e:
            print(f"Aggregation error for {metric_name}: {e}")
            return None

def aggregate_by_tags(
        self,
        metric_name: str,
        tag_key: str,
        method: str = 'mean'
    ) -> Dict[str, float]:
        """Aggregate metrics grouped by tag value."""
        if metric_name not in self._metrics:
            return {}

        grouped: Dict[str, List[float]] = defaultdict(list)

        for metric in self._metrics[metric_name]:
            tag_value = metric.tags.get(tag_key, 'unknown')
            grouped[tag_value].append(metric.value)

        result = {}
        aggregator = self._aggregators.get(method, statistics.mean)

        for tag_value, values in grouped.items():
            try:
                result[tag_value] = aggregator(values)
            except Exception:
                result[tag_value] = 0.0

        return result

def get_summary(self, metric_name: str) -> Dict[str, Any]:
        """Get comprehensive summary of a metric."""
        if metric_name not in self._metrics:
            return {}

        metrics = self._metrics[metric_name]
        if not metrics:
            return {}

        values = [m.value for m in metrics]

        return {
            'count': len(values),
            'sum': sum(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'min': min(values),
            'max': max(values),
            'stdev': statistics.stdev(values) if len(values) > 1 else 0
        }

def clear(self) -> None:
        """Clear all metrics."""
        self._metrics.clear()

def export_all(self) -> Dict[str, List[Dict[str, Any]]]:
        """Export all metrics as dictionary."""
        return {
            name: [
                {
                    'value': m.value,
                    'unit': m.unit,
                    'tags': m.tags,
                    'timestamp': m.timestamp
                }
                for m in metrics
            ]
            for name, metrics in self._metrics.items()
        }
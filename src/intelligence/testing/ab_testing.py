from src.constants.base import MINIMUM_TRADE_THRESHOLD

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Union, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class TestStatus(Enum):
    """Status of an A/B test."""
    PLANNED = "planned"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    TERMINATED = "terminated"

class SignificanceLevel(Enum):
    """Statistical significance levels."""
    LOW = 0.1      # 90% confidence
    MEDIUM = 0.5  # 95% confidence  
    HIGH = 0.1    # 99% confidence

@dataclass
class TestVariant:
    """A variant in an A/B test."""
    name: str
    model_name: str
    model_version: str
    allocation: float  # Percentage of traffic (0.0 to 1.0)
    description: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class TestMetrics:
    """Metrics collected during A/B test."""
    # Trading performance metrics
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 1.0
    
    # Risk metrics
    volatility: float = 0.0
    var_95: float = 0.0
    expected_shortfall: float = 0.0
    
    # Operational metrics
    total_trades: int = 0
    avg_trade_duration: float = 0.0
    hit_rate: float = 0.0
    
    # Custom metrics
    custom_metrics: Dict[str, float] = field(default_factory=dict)

@dataclass
class TestResult:
    """Results of statistical comparison."""
    variant_a: str
    variant_b: str
    metric: str
    a_mean: float
    b_mean: float
    difference: float
    confidence_interval: Tuple[float, float]
    p_value: float
    is_significant: bool
    effect_size: float
    test_statistic: float
    test_method: str

@dataclass
class ABTest:
    """A/B test configuration and state."""
    test_id: str
    name: str
    description: str
    variants: List[TestVariant]
    primary_metric: str
    secondary_metrics: List[str]
    
    # Test parameters
    significance_level: float = MINIMUM_TRADE_THRESHOLD
    minimum_sample_size: int = 1000
    test_duration_days: int = 7
    
    # State
    status: TestStatus = TestStatus.PLANNED
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Results tracking
    variant_metrics: Dict[str, TestMetrics] = field(default_factory=dict)
    variant_samples: Dict[str, List[float]] = field(default_factory=dict)
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = "system"
    tags: List[str] = field(default_factory=list)

class ABTestFramework:
    """Comprehensive A/B testing framework for trading models."""
    
    def __init__(self, results_path: str = "./ab_test_results"):
        self.results_path = Path(results_path)
        self.results_path.mkdir(parents=True, exist_ok=True)
        
        self.active_tests: Dict[str, ABTest] = {}
        self.completed_tests: Dict[str, ABTest] = {}
        
        # Statistical testing configuration
        self.min_effect_size = MINIMUM_TRADE_THRESHOLD  # Minimum meaningful effect size
        self.power = 0.8  # Statistical power
        
    def create_test(
        self,
        test_id: str,
        name: str,
        description: str,
        variants: List[TestVariant],
        primary_metric: str = "sharpe_ratio",
        secondary_metrics: List[str] = None,
        **kwargs
    ) -> ABTest:
        """Create a new A/B test."""
        
        # Validate variants
        self._validate_variants(variants)
        
        # Default secondary metrics
        if secondary_metrics is None:
            secondary_metrics = ["total_return", "max_drawdown", "win_rate"]
        
        # Create test
        test = ABTest(
            test_id=test_id,
            name=name,
            description=description,
            variants=variants,
            primary_metric=primary_metric,
            secondary_metrics=secondary_metrics,
            **kwargs
        )
        
        # Initialize variant tracking
        for variant in variants:
            test.variant_metrics[variant.name] = TestMetrics()
            test.variant_samples[variant.name] = []
        
        # Store test
        self.active_tests[test_id] = test
        
        logger.info(f"Created A/B test: {test_id}")
        return test
    
    def _validate_variants(self, variants: List[TestVariant]):
        """Validate test variants."""
        if len(variants) < 2:
            raise ValueError("At least 2 variants required for A/B test")
        
        total_allocation = sum(v.allocation for v in variants)
        if not (0.99 <= total_allocation <= 1.1):  # Allow small floating point errors
            raise ValueError(f"Variant allocations must sum to 1.0, got {total_allocation}")
        
        variant_names = [v.name for v in variants]
        if len(set(variant_names)) != len(variant_names):
            raise ValueError("Variant names must be unique")
    
    def start_test(self, test_id: str):
        """Start an A/B test."""
        if test_id not in self.active_tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.active_tests[test_id]
        if test.status != TestStatus.PLANNED:
            raise ValueError(f"Test {test_id} cannot be started (status: {test.status.value})")
        
        test.status = TestStatus.RUNNING
        test.start_date = datetime.now()
        test.end_date = test.start_date + timedelta(days=test.test_duration_days)
        
        logger.info(f"Started A/B test: {test_id}")
    
    def record_result(
        self,
        test_id: str,
        variant_name: str,
        metrics: Dict[str, float]
    ):
        """Record results for a variant."""
        if test_id not in self.active_tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.active_tests[test_id]
        if test.status != TestStatus.RUNNING:
            logger.warning(f"Recording result for non-running test {test_id}")
        
        if variant_name not in test.variant_metrics:
            raise ValueError(f"Variant {variant_name} not found in test {test_id}")
        
        # Update metrics
        variant_metrics = test.variant_metrics[variant_name]
        
        # Update standard metrics
        for metric_name, value in metrics.items():
            if hasattr(variant_metrics, metric_name):
                # For cumulative metrics, we might need to update differently
                if metric_name in ['total_trades']:
                    setattr(variant_metrics, metric_name, 
                            getattr(variant_metrics, metric_name) + value)
                else:
                    setattr(variant_metrics, metric_name, value)
            else:
                # Store as custom metric
                variant_metrics.custom_metrics[metric_name] = value
        
        # Store sample for the primary metric
        primary_value = metrics.get(test.primary_metric)
        if primary_value is not None:
            test.variant_samples[variant_name].append(primary_value)
    
    def analyze_test(self, test_id: str) -> Dict[str, TestResult]:
        """Analyze A/B test results."""
        if test_id not in self.active_tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.active_tests[test_id]
        results = {}
        
        # Compare all pairs of variants
        variants = list(test.variants)
        for i in range(len(variants)):
            for j in range(i + 1, len(variants)):
                variant_a = variants[i]
                variant_b = variants[j]
                
                # Test primary metric
                result = self._compare_variants(
                    test, variant_a.name, variant_b.name, test.primary_metric
                )
                results[f"{variant_a.name}_vs_{variant_b.name}_{test.primary_metric}"] = result
                
                # Test secondary metrics
                for metric in test.secondary_metrics:
                    result = self._compare_variants(
                        test, variant_a.name, variant_b.name, metric
                    )
                    results[f"{variant_a.name}_vs_{variant_b.name}_{metric}"] = result
        
        return results
    
    def _compare_variants(
        self,
        test: ABTest,
        variant_a_name: str,
        variant_b_name: str,
        metric: str
    ) -> TestResult:
        """Compare two variants on a specific metric."""
        
        # Get metric values
        def get_metric_values(variant_name: str) -> List[float]:
            if metric == test.primary_metric:
                return test.variant_samples[variant_name]
            else:
                # For other metrics, we need to extract from recorded metrics
                variant_metrics = test.variant_metrics[variant_name]
                if hasattr(variant_metrics, metric):
                    value = getattr(variant_metrics, metric)
                    return [value] if value is not None else []
                elif metric in variant_metrics.custom_metrics:
                    value = variant_metrics.custom_metrics[metric]
                    return [value] if value is not None else []
                return []
        
        samples_a = get_metric_values(variant_a_name)
        samples_b = get_metric_values(variant_b_name)
        
        if len(samples_a) == 0 or len(samples_b) == 0:
            return TestResult(
                variant_a=variant_a_name,
                variant_b=variant_b_name,
                metric=metric,
                a_mean=0.0,
                b_mean=0.0,
                difference=0.0,
                confidence_interval=(0.0, 0.0),
                p_value=1.0,
                is_significant=False,
                effect_size=0.0,
                test_statistic=0.0,
                test_method="insufficient_data"
            )
        
        # Calculate statistics
        mean_a = np.mean(samples_a)
        mean_b = np.mean(samples_b)
        difference = mean_b - mean_a
        
        # Perform statistical test
        if len(samples_a) > 1 and len(samples_b) > 1:
            # Use Welch's t-test for unequal variances
            t_stat, p_value = stats.ttest_ind(
                samples_a, samples_b, equal_var=False
            )
            test_method = "welch_t_test"
        else:
            # Insufficient data for proper test
            t_stat = 0.0
            p_value = 1.0
            test_method = "insufficient_samples"
        
        # Calculate effect size (Cohen's d)
        if len(samples_a) > 1 and len(samples_b) > 1:
            pooled_std = np.sqrt(
                ((len(samples_a) - 1) * np.var(samples_a, ddof=1) + 
                (len(samples_b) - 1) * np.var(samples_b, ddof=1)) / 
                (len(samples_a) + len(samples_b) - 2)
            )
            effect_size = difference / pooled_std if pooled_std > 0 else 0.0
        else:
            effect_size = 0.0
        
        # Calculate confidence interval
        if len(samples_a) > 1 and len(samples_b) > 1:
            se_diff = np.sqrt(
                np.var(samples_a, ddof=1) / len(samples_a) + 
                np.var(samples_b, ddof=1) / len(samples_b)
            )
            df = len(samples_a) + len(samples_b) - 2
            t_critical = stats.t.ppf(1 - test.significance_level / 2, df)
            margin = t_critical * se_diff
            confidence_interval = (difference - margin, difference + margin)
        else:
            confidence_interval = (difference, difference)
        
        # Determine significance
        is_significant = p_value < test.significance_level
        
        return TestResult(
            variant_a=variant_a_name,
            variant_b=variant_b_name,
            metric=metric,
            a_mean=mean_a,
            b_mean=mean_b,
            difference=difference,
            confidence_interval=confidence_interval,
            p_value=p_value,
            is_significant=is_significant,
            effect_size=effect_size,
            test_statistic=t_stat,
            test_method=test_method
        )
    
    def check_early_stopping(self, test_id: str) -> Dict[str, Any]:
        """Check if test can be stopped early due to significant results."""
        if test_id not in self.active_tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.active_tests[test_id]
        
        # Check minimum sample size
        min_samples_met = all(
            len(samples) >= test.minimum_sample_size
            for samples in test.variant_samples.values()
        )
        
        if not min_samples_met:
            return {
                "can_stop": False,
                "reason": "minimum_sample_size_not_met",
                "sample_sizes": {name: len(samples) 
                                for name, samples in test.variant_samples.items()}
            }
        
        # Analyze current results
        results = self.analyze_test(test_id)
        
        # Check if primary metric shows significant results
        primary_results = [
            result for key, result in results.items()
            if test.primary_metric in key
        ]
        
        significant_results = [r for r in primary_results if r.is_significant]
        
        if significant_results:
            return {
                "can_stop": True,
                "reason": "significant_results_detected",
                "significant_comparisons": len(significant_results),
                "total_comparisons": len(primary_results)
            }
        
        # Check if test duration elapsed
        if test.end_date and datetime.now() >= test.end_date:
            return {
                "can_stop": True,
                "reason": "test_duration_elapsed"
            }
        
        return {
            "can_stop": False,
            "reason": "no_significant_results_yet"
        }
    
    def stop_test(self, test_id: str, reason: str = "manual"):
        """Stop an A/B test."""
        if test_id not in self.active_tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.active_tests[test_id]
        test.status = TestStatus.COMPLETED
        test.end_date = datetime.now()
        
        # Move to completed tests
        self.completed_tests[test_id] = test
        del self.active_tests[test_id]
        
        # Save results
        self._save_test_results(test)
        
        logger.info(f"Stopped A/B test: {test_id} (reason: {reason})")
    
    def _save_test_results(self, test: ABTest):
        """Save test results to disk."""
        results_file = self.results_path / f"{test.test_id}_results.json"
        
        # Analyze final results
        final_results = self.analyze_test(test.test_id) if test.test_id in self.active_tests else {}
        
        # Prepare data for serialization
        test_data = {
            "test_id": test.test_id,
            "name": test.name,
            "description": test.description,
            "status": test.status.value,
            "start_date": test.start_date.isoformat() if test.start_date else None,
            "end_date": test.end_date.isoformat() if test.end_date else None,
            "duration_days": test.test_duration_days,
            "primary_metric": test.primary_metric,
            "secondary_metrics": test.secondary_metrics,
            "significance_level": test.significance_level,
            "variants": [
                {
                    "name": v.name,
                    "model_name": v.model_name,
                    "model_version": v.model_version,
                    "allocation": v.allocation,
                    "description": v.description
                } for v in test.variants
            ],
            "variant_metrics": {
                name: {
                    "total_return": metrics.total_return,
                    "sharpe_ratio": metrics.sharpe_ratio,
                    "max_drawdown": metrics.max_drawdown,
                    "win_rate": metrics.win_rate,
                    "profit_factor": metrics.profit_factor,
                    "volatility": metrics.volatility,
                    "total_trades": metrics.total_trades,
                    "custom_metrics": metrics.custom_metrics
                }
                for name, metrics in test.variant_metrics.items()
            },
            "sample_sizes": {
                name: len(samples)
                for name, samples in test.variant_samples.items()
            },
            "statistical_results": {
                key: {
                    "variant_a": result.variant_a,
                    "variant_b": result.variant_b,
                    "metric": result.metric,
                    "a_mean": result.a_mean,
                    "b_mean": result.b_mean,
                    "difference": result.difference,
                    "confidence_interval": result.confidence_interval,
                    "p_value": result.p_value,
                    "is_significant": result.is_significant,
                    "effect_size": result.effect_size,
                    "test_method": result.test_method
                }
                for key, result in final_results.items()
            }
        }
        
        with open(results_file, 'w') as f:
            json.dump(test_data, f, indent=2)
        
        logger.info(f"Saved test results: {results_file}")
    
    def generate_report(self, test_id: str) -> str:
        """Generate a comprehensive test report."""
        test = self.active_tests.get(test_id) or self.completed_tests.get(test_id)
        if not test:
            raise ValueError(f"Test {test_id} not found")
        
        # Analyze results
        if test_id in self.active_tests:
            results = self.analyze_test(test_id)
        else:
            # Load results from file
            results_file = self.results_path / f"{test_id}_results.json"
            if results_file.exists():
                with open(results_file, 'r') as f:
                    saved_data = json.load(f)
                results = saved_data.get('statistical_results', {})
            else:
                results = {}
        
        # Generate report
        report = f"""
# A/B Test Report: {test.name}

## Test Overview
- **Test ID**: {test.test_id}
- **Status**: {test.status.value}
- **Duration**: {test.test_duration_days} days
- **Primary Metric**: {test.primary_metric}
- **Significance Level**: {test.significance_level}
- **Start Date**: {test.start_date}
- **End Date**: {test.end_date}

## Variants
"""
        
        for variant in test.variants:
            report += f"""
### {variant.name}
- **Model**: {variant.model_name} v{variant.model_version}
- **Traffic Allocation**: {variant.allocation:.1%}
- **Description**: {variant.description}
"""
        
        report += "\n## Results Summary\n"
        
        # Add variant performance
        for name, metrics in test.variant_metrics.items():
            report += f"""
### {name} Performance
- **Total Return**: {metrics.total_return:.2%}
- **Sharpe Ratio**: {metrics.sharpe_ratio:.2f}
- **Max Drawdown**: {metrics.max_drawdown:.2%}
- **Win Rate**: {metrics.win_rate:.1%}
- **Total Trades**: {metrics.total_trades}
"""
        
        # Add statistical comparisons
        report += "\n## Statistical Analysis\n"
        
        for key, result in results.items():
            if isinstance(result, dict):
                # Handle loaded results
                report += f"""
### {result['variant_a']} vs {result['variant_b']} ({result['metric']})
- **Difference**: {result['difference']:.4f}
- **P-value**: {result['p_value']:.4f}
- **Significant**: {'Yes' if result['is_significant'] else 'No'}
- **Effect Size**: {result['effect_size']:.3f}
"""
            else:
                # Handle TestResult objects
                report += f"""
### {result.variant_a} vs {result.variant_b} ({result.metric})
- **Difference**: {result.difference:.4f}
- **P-value**: {result.p_value:.4f}
- **Significant**: {'Yes' if result.is_significant else 'No'}
- **Effect Size**: {result.effect_size:.3f}
"""
        
        return report
    
    def list_tests(self, status: Optional[TestStatus] = None) -> List[str]:
        """List all tests, optionally filtered by status."""
        all_tests = {**self.active_tests, **self.completed_tests}
        
        if status:
            return [test_id for test_id, test in all_tests.items() 
                    if test.status == status]
        
        return list(all_tests.keys())

# Example usage and testing
def test_ab_framework():
    """Test the A/B testing framework."""
    print("=" * 50)
    
    # Create framework
    framework = ABTestFramework()
    
    # Create test variants
    variants = [
        TestVariant(
            name="champion",
            model_name="gary_taleb",
            model_version="v1.0",
            allocation=0.7,
            description="Current production model"
        ),
        TestVariant(
            name="challenger",
            model_name="gary_taleb_v2",
            model_version="v2.0",
            allocation=0.3,
            description="New improved model"
        )
    ]
    
    # Create A/B test
    test = framework.create_test(
        test_id="model_comparison_001",
        name="GaryTaleb v1 vs v2",
        description="Compare current model with new version",
        variants=variants,
        primary_metric="sharpe_ratio",
        test_duration_days=7,
        minimum_sample_size=100
    )
    
    # Start test
    framework.start_test(test.test_id)
    
    # Simulate recording results
    np.random.seed(42)
    
    for i in range(150):
        # Champion results (slightly lower performance)
        champion_metrics = {
            "sharpe_ratio": np.random.normal(1.5, 0.3),
            "total_return": np.random.normal(0.15, 0.5),
            "max_drawdown": abs(np.random.normal(0.8, 0.2)),
            "win_rate": np.random.beta(6, 4)  # ~60% win rate
        }
        
        framework.record_result(test.test_id, "champion", champion_metrics)
        
        # Challenger results (slightly better performance)
        if i < 100:  # Challenger gets less data due to allocation
            challenger_metrics = {
                "sharpe_ratio": np.random.normal(1.8, 0.3),
                "total_return": np.random.normal(0.18, 0.5),
                "max_drawdown": abs(np.random.normal(0.6, 0.2)),
                "win_rate": np.random.beta(7, 3)  # ~70% win rate
            }
            
            framework.record_result(test.test_id, "challenger", challenger_metrics)
    
    print("Recorded sample results")
    
    # Analyze results
    results = framework.analyze_test(test.test_id)
    
    print(f"\nAnalysis Results:")
    for key, result in results.items():
        print(f"{key}:")
        print(f"  Difference: {result.difference:.4f}")
        print(f"  P-value: {result.p_value:.4f}")
        print(f"  Significant: {result.is_significant}")
        print(f"  Effect size: {result.effect_size:.3f}")
    
    # Check early stopping
    early_stop = framework.check_early_stopping(test.test_id)
    print(f"\nEarly stopping check: {early_stop}")
    
    # Generate report
    report = framework.generate_report(test.test_id)
    print(f"\nGenerated report (first 500 chars):")
    print(report[:500] + "..." if len(report) > 500 else report)
    
    # Stop test
    framework.stop_test(test.test_id, reason="test_completed")

if __name__ == "__main__":
    test_ab_framework()
from src.constants.base import MAXIMUM_NESTED_DEPTH

Main analysis executor using strategy pattern to eliminate god object.
NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import time
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime

from .analysis_strategy import (
    AnalysisContext, AnalysisResult, AnalysisStrategyFactory, AnalysisStrategy
)

logger = logging.getLogger(__name__)

class AnalysisExecutor:
    """
    Main analysis executor using strategy pattern.
    Replaces ComprehensiveAnalysisEngine god object with focused responsibility.

    Methods: 12 (under 18 limit)
    """

def __init__(self, config_manager=None):
        """Initialize analysis executor."""
        assert config_manager is not None, "config_manager cannot be None"

        self.config = config_manager
        self.strategy_factory = AnalysisStrategyFactory()
        self.active_strategies = {}
        self.execution_history = []

def execute_comprehensive_analysis(self, target_path: Path,
                                    strategies: List[str] = None) -> Dict[str, Any]:
        """
        Execute comprehensive analysis using multiple strategies.
        NASA Rule 4: Main orchestration under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(target_path, Path), "target_path must be Path object"
        assert target_path.exists(), f"Target path does not exist: {target_path}"

        if strategies is None:
            strategies = ["syntax", "patterns", "compliance"]

        start_time = time.time()
        strategy_results = {}
        overall_violations = []
        overall_metrics = {}

        try:
            # Execute each strategy
            for strategy_name in strategies:
                result = self._execute_strategy(strategy_name, target_path)
                strategy_results[strategy_name] = result

                if result.success:
                    overall_violations.extend(result.violations)
                    overall_metrics.update(result.metrics)

            # Aggregate results
            aggregated_result = self._aggregate_strategy_results(strategy_results)
            execution_time = time.time() - start_time

            # Build comprehensive result
            comprehensive_result = {
                "success": True,
                "target_path": str(target_path),
                "strategies_executed": strategies,
                "strategy_results": strategy_results,
                "aggregated_violations": overall_violations,
                "aggregated_metrics": overall_metrics,
                "overall_score": aggregated_result.get("overall_score", 0.0),
                "execution_time": execution_time,
                "timestamp": datetime.now().isoformat(),
                "recommendations": aggregated_result.get("recommendations", [])
            }

            self._record_execution(comprehensive_result)
            return comprehensive_result

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Comprehensive analysis failed: {e}")

            error_result = {
                "success": False,
                "error": str(e),
                "execution_time": execution_time,
                "timestamp": datetime.now().isoformat()
            }
            self._record_execution(error_result)
            return error_result

def execute_single_strategy(self, strategy_name: str, target_path: Path) -> AnalysisResult:
        """
        Execute single analysis strategy.
        NASA Rule 4: Single strategy execution under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(strategy_name, str), "strategy_name must be string"
        assert isinstance(target_path, Path), "target_path must be Path object"
        assert target_path.exists(), f"Target path does not exist: {target_path}"

        return self._execute_strategy(strategy_name, target_path)

def get_available_strategies(self) -> List[str]:
        """Get list of available analysis strategies."""
        return self.strategy_factory.get_available_strategies()

def register_custom_strategy(self, name: str, strategy_class: type):
        """Register custom analysis strategy."""
        assert isinstance(name, str), "name must be string"
        assert strategy_class is not None, "strategy_class cannot be None"

        self.strategy_factory.register_strategy(name, strategy_class)
        logger.info(f"Registered custom strategy: {name}")

def get_execution_history(self) -> List[Dict]:
        """Get analysis execution history."""
        return self.execution_history.copy()

def clear_execution_history(self):
        """Clear execution history."""
        self.execution_history.clear()
        logger.info("Execution history cleared")

def validate_target(self, target_path: Path) -> Dict[str, Any]:
        """
        Validate analysis target.
        NASA Rule 4: Validation logic under 60 lines.
        """
        assert isinstance(target_path, Path), "target_path must be Path object"

        validation_result = {
            "valid": False,
            "errors": [],
            "warnings": [],
            "metadata": {}
        }

        try:
            if not target_path.exists():
                validation_result["errors"].append("Target path does not exist")
                return validation_result

            if target_path.is_file():
                validation_result["metadata"]["type"] = "file"
                validation_result["metadata"]["size"] = target_path.stat().st_size
            elif target_path.is_dir():
                validation_result["metadata"]["type"] = "directory"
                python_files = list(target_path.rglob("*.py"))
                validation_result["metadata"]["python_files"] = len(python_files)

                if len(python_files) == 0:
                    validation_result["warnings"].append("No Python files found in directory")

            validation_result["valid"] = len(validation_result["errors"]) == 0
            return validation_result

        except Exception as e:
            validation_result["errors"].append(f"Validation failed: {str(e)}")
            return validation_result

def _execute_strategy(self, strategy_name: str, target_path: Path) -> AnalysisResult:
        """Execute individual strategy."""
        try:
            strategy = self.strategy_factory.create_strategy(strategy_name)
            context = AnalysisContext(
                target_path=str(target_path),
                language="python",  # Default, could be detected
                options=self.config.get_strategy_options(strategy_name),
                metadata={"executor": "AnalysisExecutor", "version": "1.0.0"}
            )

            result = strategy.execute(context)
            self.active_strategies[strategy_name] = strategy

            logger.info(f"Strategy {strategy_name} executed: {result.success}")
            return result

        except Exception as e:
            logger.error(f"Strategy {strategy_name} failed: {e}")
            return AnalysisResult(
                success=False,
                data={},
                violations=[],
                metrics={},
                recommendations=[],
                execution_time=0.0,
                error_message=str(e)
            )

def _aggregate_strategy_results(self, strategy_results: Dict[str, AnalysisResult]) -> Dict[str, Any]:
        """Aggregate results from multiple strategies."""
        all_violations = []
        all_metrics = {}
        all_recommendations = []
        successful_strategies = 0

        for strategy_name, result in strategy_results.items():
            if result.success:
                successful_strategies += 1
                all_violations.extend(result.violations)
                all_recommendations.extend(result.recommendations)

                # Prefix metrics with strategy name to avoid conflicts
                for metric_name, value in result.metrics.items():
                    prefixed_name = f"{strategy_name}_{metric_name}"
                    all_metrics[prefixed_name] = value

        # Calculate overall score
        total_strategies = len(strategy_results)
        success_rate = successful_strategies / max(total_strategies, 1)
        violation_penalty = min(0.5, len(all_violations) * 0.01)
        overall_score = max(0.0, success_rate - violation_penalty)

        return {
            "overall_score": overall_score,
            "total_violations": len(all_violations),
            "successful_strategies": successful_strategies,
            "total_strategies": total_strategies,
            "recommendations": list(set(all_recommendations))  # Remove duplicates
        }

def _record_execution(self, result: Dict[str, Any]):
        """Record execution in history."""
        execution_record = {
            "timestamp": datetime.now().isoformat(),
            "success": result.get("success", False),
            "execution_time": result.get("execution_time", 0.0),
            "strategies": result.get("strategies_executed", []),
            "violations_count": len(result.get("aggregated_violations", [])),
            "overall_score": result.get("overall_score", 0.0)
        }

        self.execution_history.append(execution_record)

        # Keep only last 100 executions
        if len(self.execution_history) > 100:
            self.execution_history = self.execution_history[-100:]

def get_strategy_performance(self) -> Dict[str, Dict]:
        """Get performance metrics for each strategy."""
        performance = {}

        for execution in self.execution_history:
            for strategy in execution.get("strategies", []):
                if strategy not in performance:
                    performance[strategy] = {
                        "executions": 0,
                        "successes": 0,
                        "total_time": 0.0,
                        "avg_time": 0.0
                    }

                performance[strategy]["executions"] += 1
                if execution["success"]:
                    performance[strategy]["successes"] += 1
                performance[strategy]["total_time"] += execution["execution_time"]

        # Calculate averages
        for strategy_name, stats in performance.items():
            if stats["executions"] > 0:
                stats["avg_time"] = stats["total_time"] / stats["executions"]
                stats["success_rate"] = stats["successes"] / stats["executions"]

        return performance

def create_analysis_executor(config_manager=None) -> AnalysisExecutor:
    """Factory function to create analysis executor."""
    return AnalysisExecutor(config_manager)
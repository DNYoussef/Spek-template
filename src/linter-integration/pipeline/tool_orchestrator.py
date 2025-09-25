from lib.shared.utilities import get_logger

import asyncio
import json
import logging
import time
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from pathlib import Path
import subprocess

from ..adapters.base_adapter import LinterResult, LinterViolation, SeverityLevel

@dataclass
class PipelineConfig:
    """Configuration for linter pipeline execution"""
    enabled_tools: List[str]
    parallel_execution: bool = True
    timeout_seconds: int = 300
    fail_fast: bool = False
    output_format: str = "json"
    severity_filter: Optional[List[str]] = None
    target_paths: List[str] = None
    
class ToolOrchestrator:
    """
    Orchestrates execution of multiple linter tools in parallel or sequential mode.
    Aggregates and correlates results across all tools.
    """
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.adapters: Dict[str, Any] = {}
        self.logger = self._setup_logging()
        self.execution_stats = {
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "average_execution_time": 0.0
        }
        
    def _setup_logging(self) -> logging.Logger:
        logger = get_logger("\1")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        return logger
        
    def register_adapter(self, tool_name: str, adapter_instance: Any) -> None:
        """Register a linter adapter with the orchestrator"""
        self.adapters[tool_name] = adapter_instance
        self.logger.info(f"Registered adapter for {tool_name}")
        
    async def validate_tools(self) -> Dict[str, bool]:
        """Validate that all configured tools are available"""
        validation_results = {}
        
        for tool_name in self.config.enabled_tools:
            if tool_name in self.adapters:
                is_available = self.adapters[tool_name].validate_tool_availability()
                validation_results[tool_name] = is_available
                
                if not is_available:
                    self.logger.warning(f"Tool {tool_name} is not available")
            else:
                validation_results[tool_name] = False
                self.logger.error(f"No adapter registered for {tool_name}")
                
        return validation_results
        
    async def run_pipeline(self, target_paths: List[str]) -> Dict[str, Any]:
        """
        Execute the complete linter pipeline on target paths.
        
        Args:
            target_paths: List of file/directory paths to analyze
            
        Returns:
            Aggregated results from all linters
        """
        pipeline_start = time.time()
        self.logger.info(f"Starting pipeline execution for {len(target_paths)} targets")
        
        # Validate tools first
        validation_results = await self.validate_tools()
        available_tools = [tool for tool, available in validation_results.items() if available]
        
        if not available_tools:
            return {
                "error": "No available tools for pipeline execution",
                "validation_results": validation_results
            }
            
        # Execute linters
        if self.config.parallel_execution:
            results = await self._run_parallel(target_paths, available_tools)
        else:
            results = await self._run_sequential(target_paths, available_tools)
            
        # Aggregate and correlate results
        aggregated_results = self._aggregate_results(results)
        
        # Update execution statistics
        pipeline_time = time.time() - pipeline_start
        self._update_execution_stats(pipeline_time, len(available_tools))
        
        return {
            "pipeline_execution_time": pipeline_time,
            "tools_executed": available_tools,
            "validation_results": validation_results,
            "aggregated_results": aggregated_results,
            "execution_stats": self.execution_stats
        }
        
    async def _run_parallel(self, target_paths: List[str], tools: List[str]) -> Dict[str, LinterResult]:
        """Execute linters in parallel"""
        self.logger.info(f"Running {len(tools)} tools in parallel")
        
        tasks = []
        for tool_name in tools:
            for target_path in target_paths:
                task = self._run_single_tool(tool_name, target_path)
                tasks.append((tool_name, target_path, task))
                
        # Execute all tasks concurrently
        results = {}
        try:
            completed_tasks = await asyncio.gather(*[task for _, _, task in tasks], return_exceptions=True)
            
            for i, (tool_name, target_path, _) in enumerate(tasks):
                key = f"{tool_name}:{target_path}"
                if isinstance(completed_tasks[i], Exception):
                    self.logger.error(f"Error running {tool_name} on {target_path}: {completed_tasks[i]}")
                    results[key] = None
                else:
                    results[key] = completed_tasks[i]
                    
        except Exception as e:
            self.logger.error(f"Error in parallel execution: {e}")
            
        return results
        
    async def _run_sequential(self, target_paths: List[str], tools: List[str]) -> Dict[str, LinterResult]:
        """Execute linters sequentially"""
        self.logger.info(f"Running {len(tools)} tools sequentially")
        
        results = {}
        for tool_name in tools:
            for target_path in target_paths:
                key = f"{tool_name}:{target_path}"
                try:
                    result = await self._run_single_tool(tool_name, target_path)
                    results[key] = result
                    
                    if self.config.fail_fast and result.exit_code != 0:
                        self.logger.warning(f"Fail-fast triggered by {tool_name}")
                        break
                        
                except Exception as e:
                    self.logger.error(f"Error running {tool_name} on {target_path}: {e}")
                    results[key] = None
                    
                    if self.config.fail_fast:
                        break
                        
        return results
        
    async def _run_single_tool(self, tool_name: str, target_path: str) -> LinterResult:
        """Run a single linter tool on a target path"""
        adapter = self.adapters[tool_name]
        
        try:
            result = await asyncio.wait_for(
                adapter.run_analysis(target_path),
                timeout=self.config.timeout_seconds
            )
            
            # Apply severity filtering if configured
            if self.config.severity_filter:
                filtered_violations = [
                    v for v in result.violations 
                    if v.severity.value in self.config.severity_filter
                ]
                result.violations = filtered_violations
                result.total_violations = len(filtered_violations)
                result.violations_by_severity = adapter._count_violations_by_severity(filtered_violations)
                
            return result
            
        except asyncio.TimeoutError:
            self.logger.error(f"Timeout running {tool_name} on {target_path}")
            raise
            
    def _aggregate_results(self, results: Dict[str, LinterResult]) -> Dict[str, Any]:
        """Aggregate results from all linter executions"""
        aggregated = {
            "total_violations": 0,
            "violations_by_tool": {},
            "violations_by_severity": {severity.value: 0 for severity in SeverityLevel},
            "violations_by_type": {},
            "files_analyzed": set(),
            "tools_summary": {},
            "cross_tool_correlations": []
        }
        
        valid_results = {k: v for k, v in results.items() if v is not None}
        
        for key, result in valid_results.items():
            tool_name = key.split(':')[0]
            
            # Aggregate violations
            aggregated["total_violations"] += result.total_violations
            
            # Track violations by tool
            if tool_name not in aggregated["violations_by_tool"]:
                aggregated["violations_by_tool"][tool_name] = 0
            aggregated["violations_by_tool"][tool_name] += result.total_violations
            
            # Aggregate severity counts
            for severity, count in result.violations_by_severity.items():
                aggregated["violations_by_severity"][severity] += count
                
            # Track analyzed files
            for violation in result.violations:
                aggregated["files_analyzed"].add(violation.file_path)
                
            # Tool summary
            aggregated["tools_summary"][tool_name] = {
                "execution_time": result.execution_time,
                "exit_code": result.exit_code,
                "violations": result.total_violations,
                "files_analyzed": result.files_analyzed
            }
            
        # Convert sets to counts
        aggregated["files_analyzed"] = len(aggregated["files_analyzed"])
        
        # Find cross-tool correlations
        aggregated["cross_tool_correlations"] = self._find_correlations(valid_results)
        
        return aggregated
        
    def _find_correlations(self, results: Dict[str, LinterResult]) -> List[Dict[str, Any]]:
        """Find correlations between violations across different tools"""
        correlations = []
        
        # Group violations by file and line
        violations_by_location = {}
        for key, result in results.items():
            tool_name = key.split(':')[0]
            for violation in result.violations:
                location_key = f"{violation.file_path}:{violation.line_number}"
                if location_key not in violations_by_location:
                    violations_by_location[location_key] = []
                violations_by_location[location_key].append((tool_name, violation))
                
        # Find locations with multiple tool violations
        for location, tool_violations in violations_by_location.items():
            if len(tool_violations) > 1:
                tools = [tool for tool, _ in tool_violations]
                violations = [v for _, v in tool_violations]
                
                correlation = {
                    "location": location,
                    "tools": tools,
                    "violation_count": len(violations),
                    "severities": [v.severity.value for v in violations],
                    "messages": [v.message for v in violations]
                }
                correlations.append(correlation)
                
        return correlations
        
    def _update_execution_stats(self, execution_time: float, tools_count: int) -> None:
        """Update execution statistics"""
        self.execution_stats["total_runs"] += 1
        
        if tools_count > 0:
            self.execution_stats["successful_runs"] += 1
        else:
            self.execution_stats["failed_runs"] += 1
            
        # Update rolling average execution time
        total_runs = self.execution_stats["total_runs"]
        current_avg = self.execution_stats["average_execution_time"]
        self.execution_stats["average_execution_time"] = (
            (current_avg * (total_runs - 1) + execution_time) / total_runs
        )
        
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and statistics"""
        return {
            "config": asdict(self.config),
            "registered_adapters": list(self.adapters.keys()),
            "execution_stats": self.execution_stats,
            "pipeline_health": self._calculate_pipeline_health()
        }
        
    def _calculate_pipeline_health(self) -> float:
        """Calculate overall pipeline health score"""
        if self.execution_stats["total_runs"] == 0:
            return 1.0
            
        success_rate = (
            self.execution_stats["successful_runs"] / 
            self.execution_stats["total_runs"]
        )
        
        # Factor in tool availability
        available_tools = len([
            tool for tool in self.config.enabled_tools 
            if tool in self.adapters and self.adapters[tool].validate_tool_availability()
        ])
        tool_availability = available_tools / len(self.config.enabled_tools) if self.config.enabled_tools else 0
        
        return (success_rate * 0.7) + (tool_availability * 0.3)
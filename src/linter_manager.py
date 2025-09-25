"""Async execution manager for concurrent linting operations."""

from lib.shared.utilities import get_logger
import asyncio

class LinterManager:
    """Manages concurrent execution of multiple linter tools."""
    
    def __init__(self, config: Optional[LinterSuiteConfig] = None, config_file: Optional[str] = None):
        self.config_manager = LinterConfigManager(config_file)
        self.suite_config = config or self.config_manager.suite_config
        
        self._adapters = {}
        self._initialize_adapters()
        
        # Execution statistics
        self._execution_stats = {
            'total_runs': 0,
            'successful_runs': 0,
            'failed_runs': 0,
            'total_execution_time': 0.0,
            'avg_execution_time': 0.0,
            'tool_stats': {}
        }
        
        # Thread safety
        self._stats_lock = threading.Lock()
    
    def _initialize_adapters(self) -> None:
        """Initialize all enabled linter adapters."""
        adapter_classes = {
            'flake8': Flake8Adapter,
            'pylint': PylintAdapter,
            'ruff': RuffAdapter,
            'mypy': MypyAdapter,
            'bandit': BanditAdapter
        }
        
        for tool_name in self.suite_config.enabled_tools:
            if tool_name in adapter_classes:
                tool_config = self.config_manager.get_tool_config(tool_name)
                adapter_class = adapter_classes[tool_name]
                
                try:
                    adapter = adapter_class(tool_config)
                    if adapter.validate_config():
                        self._adapters[tool_name] = adapter
                        logger.info(f"Initialized {tool_name} adapter")
                    else:
                        logger.warning(f"Failed to validate {tool_name} configuration")
                except Exception as e:
                    logger.error(f"Failed to initialize {tool_name} adapter: {e}")
            else:
                logger.warning(f"Unknown tool: {tool_name}")
    
    async def run_all_linters(self, target_paths: List[str]) -> Dict[str, LinterResult]:
        """Run all enabled linters on the specified paths."""
        start_time = time.time()
        
        # Filter target paths
        filtered_paths = self._filter_paths(target_paths)
        if not filtered_paths:
            logger.warning("No valid Python files found in target paths")
            return {}
        
        logger.info(f"Running {len(self._adapters)} linters on {len(filtered_paths)} files")
        
        # Execute linters
        if self.suite_config.concurrent_execution:
            results = await self._run_concurrent(filtered_paths)
        else:
            results = await self._run_sequential(filtered_paths)
        
        # Update statistics
        execution_time = time.time() - start_time
        self._update_stats(results, execution_time)
        
        # Filter results by severity
        filtered_results = self._filter_results_by_severity(results)
        
        logger.info(f"Linting completed in {execution_time:.2f}s")
        self._log_summary(filtered_results)
        
        return filtered_results
    
    async def _run_concurrent(self, target_paths: List[str]) -> Dict[str, LinterResult]:
        """Run linters concurrently."""
        semaphore = asyncio.Semaphore(self.suite_config.max_workers)
        
        async def run_with_semaphore(tool_name: str, adapter) -> tuple[str, LinterResult]:
            async with semaphore:
                logger.debug(f"Starting {tool_name} execution")
                result = await adapter.run_linter(target_paths)
                logger.debug(f"Completed {tool_name} execution")
                return tool_name, result
        
        # Create tasks for all adapters
        tasks = [
            run_with_semaphore(tool_name, adapter)
            for tool_name, adapter in self._adapters.items()
        ]
        
        # Wait for all tasks to complete
        results = {}
        completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)
        
        for task_result in completed_tasks:
            if isinstance(task_result, Exception):
                logger.error(f"Linter task failed: {task_result}")
            else:
                tool_name, result = task_result
                results[tool_name] = result
        
        return results
    
    async def _run_sequential(self, target_paths: List[str]) -> Dict[str, LinterResult]:
        """Run linters sequentially."""
        results = {}
        
        for tool_name, adapter in self._adapters.items():
            logger.info(f"Running {tool_name}...")
            result = await adapter.run_linter(target_paths)
            results[tool_name] = result
        
        return results
    
    def _filter_paths(self, target_paths: List[str]) -> List[str]:
        """Filter target paths based on include/exclude patterns."""
        filtered_paths = []
        
        for path_str in target_paths:
            path = Path(path_str)
            
            if path.is_file():
                if self._should_include_file(path):
                    filtered_paths.append(str(path))
            elif path.is_dir():
                # Find Python files in directory
                for py_file in path.rglob('*.py'):
                    if self._should_include_file(py_file):
                        filtered_paths.append(str(py_file))
        
        return filtered_paths
    
    def _should_include_file(self, file_path: Path) -> bool:
        """Check if a file should be included based on patterns."""
        file_str = str(file_path)
        
        # Check exclude patterns first
        for pattern in self.suite_config.exclude_patterns:
            if file_path.match(pattern):
                return False
        
        # Check include patterns
        for pattern in self.suite_config.include_patterns:
            if file_path.match(pattern):
                return True
        
        return False
    
    def _filter_results_by_severity(self, results: Dict[str, LinterResult]) -> Dict[str, LinterResult]:
        """Filter violations by minimum severity level."""
        if self.suite_config.min_severity == StandardSeverity.INFO:
            return results  # No filtering needed
        
        severity_order = [
            StandardSeverity.INFO,
            StandardSeverity.NOTE,
            StandardSeverity.WARNING,
            StandardSeverity.ERROR,
            StandardSeverity.FATAL
        ]
        
        min_level = severity_order.index(self.suite_config.min_severity)
        
        filtered_results = {}
        for tool_name, result in results.items():
            filtered_violations = [
                violation for violation in result.violations
                if severity_order.index(violation.severity) >= min_level
            ]
            
            filtered_result = LinterResult(
                tool=result.tool,
                exit_code=result.exit_code,
                violations=filtered_violations,
                execution_time=result.execution_time,
                files_analyzed=result.files_analyzed,
                config_used=result.config_used,
                version=result.version,
                error_output=result.error_output
            )
            
            filtered_results[tool_name] = filtered_result
        
        return filtered_results
    
    def _update_stats(self, results: Dict[str, LinterResult], execution_time: float) -> None:
        """Update execution statistics."""
        with self._stats_lock:
            self._execution_stats['total_runs'] += 1
            self._execution_stats['total_execution_time'] += execution_time
            self._execution_stats['avg_execution_time'] = (
                self._execution_stats['total_execution_time'] / 
                self._execution_stats['total_runs']
            )
            
            successful = all(result.exit_code == 0 for result in results.values())
            if successful:
                self._execution_stats['successful_runs'] += 1
            else:
                self._execution_stats['failed_runs'] += 1
            
            # Update per-tool statistics
            for tool_name, result in results.items():
                if tool_name not in self._execution_stats['tool_stats']:
                    self._execution_stats['tool_stats'][tool_name] = {
                        'runs': 0,
                        'total_violations': 0,
                        'total_time': 0.0,
                        'avg_time': 0.0,
                        'avg_violations': 0.0
                    }
                
                tool_stats = self._execution_stats['tool_stats'][tool_name]
                tool_stats['runs'] += 1
                tool_stats['total_violations'] += len(result.violations)
                tool_stats['total_time'] += result.execution_time
                tool_stats['avg_time'] = tool_stats['total_time'] / tool_stats['runs']
                tool_stats['avg_violations'] = tool_stats['total_violations'] / tool_stats['runs']
    
    def _log_summary(self, results: Dict[str, LinterResult]) -> None:
        """Log a summary of linting results."""
        total_violations = sum(len(result.violations) for result in results.values())
        
        if total_violations == 0:
            logger.info("No violations found")
            return
        
        logger.info(f"Found {total_violations} violations across {len(results)} tools:")
        
        for tool_name, result in results.items():
            violation_count = len(result.violations)
            if violation_count > 0:
                severity_counts = result.violation_count_by_severity
                severity_summary = ", ".join([
                    f"{severity.value}: {count}"
                    for severity, count in severity_counts.items()
                    if count > 0
                ])
                logger.info(f"  {tool_name}: {violation_count} violations ({severity_summary})")
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics."""
        with self._stats_lock:
            return self._execution_stats.copy()
    
    def get_enabled_tools(self) -> List[str]:
        """Get list of enabled and available tools."""
        return list(self._adapters.keys())
    
    def get_tool_versions(self) -> Dict[str, Optional[str]]:
        """Get versions of all enabled tools."""
        versions = {}
        
        async def get_versions():
            for tool_name, adapter in self._adapters.items():
                versions[tool_name] = await adapter.get_version()
        
        # Run in event loop or create new one
        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(get_versions())
        except RuntimeError:
            asyncio.run(get_versions())
        
        return versions
    
    def export_results(self, results: Dict[str, LinterResult], output_file: str, format: str = 'json') -> None:
        """Export results to file in specified format."""
        output_path = Path(output_file)
        
        if format.lower() == 'json':
            self._export_json(results, output_path)
        elif format.lower() == 'junit':
            self._export_junit(results, output_path)
        elif format.lower() == 'text':
            self._export_text(results, output_path)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def _export_json(self, results: Dict[str, LinterResult], output_path: Path) -> None:
        """Export results as JSON."""
        import json
        
        export_data = {
            'summary': {
                'total_tools': len(results),
                'total_violations': sum(len(result.violations) for result in results.values()),
                'tools': list(results.keys())
            },
            'results': {
                tool_name: result.to_dict()
                for tool_name, result in results.items()
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        logger.info(f"Results exported to {output_path}")
    
    def _export_junit(self, results: Dict[str, LinterResult], output_path: Path) -> None:
        """Export results as JUnit XML."""
        # This would require xml.etree.ElementTree or similar
        logger.warning("JUnit export not implemented yet")
    
    def _export_text(self, results: Dict[str, LinterResult], output_path: Path) -> None:
        """Export results as plain text."""
        with open(output_path, 'w') as f:
            f.write("Linter Results Summary\n")
            f.write("=" * 50 + "\n\n")
            
            for tool_name, result in results.items():
                f.write(f"{tool_name.upper()} ({len(result.violations)} violations)\n")
                f.write("-" * 30 + "\n")
                
                for violation in result.violations:
                    f.write(f"{violation.file_path}:{violation.position.line}")
                    if violation.position.column:
                        f.write(f":{violation.position.column}")
                    f.write(f" [{violation.severity.value}] {violation.rule_id}: {violation.message}\n")
                
                f.write("\n")
        
        logger.info(f"Results exported to {output_path}")

async def main():
    """Example usage of the LinterManager."""
    # Initialize manager with default configuration
    manager = LinterManager()
    
    # Run all linters on current directory
    results = await manager.run_all_linters(['.'])
    
    # Export results
    if results:
        manager.export_results(results, 'lint_results.json', 'json')
    
    # Print statistics
    stats = manager.get_execution_stats()
    print(f"Execution stats: {stats}")

if __name__ == "__main__":
    asyncio.run(main())
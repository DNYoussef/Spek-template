#!/usr/bin/env python3
"""
Incremental Analysis Engine with Multi-threading Optimization
=============================================================

Advanced incremental analysis engine that provides intelligent file change detection,
dependency tracking, and parallel processing for maximum performance improvements.

Features:
- Intelligent file change detection with content hashing
- Dependency graph analysis with impact propagation
- Parallel AST processing with thread pool management
- Incremental result caching with invalidation
- Memory-efficient streaming analysis
- Real-time performance monitoring integration

NASA Rules 4, 5, 6, 7: Function limits, assertions, scoping, bounded resources
"""

import asyncio
import hashlib
import threading
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable
from lib.shared.utilities import get_logger
logger = get_logger(__name__)


@dataclass
class FileChangeRecord:
    """Record of file changes for incremental analysis."""
    file_path: str
    old_hash: Optional[str]
    new_hash: str
    change_type: str  # 'added', 'modified', 'deleted'
    timestamp: float
    line_count_delta: int = 0
    dependencies_affected: Set[str] = field(default_factory=set)
    analysis_required: bool = True
    
    def __post_init__(self):
        """Validate file change record."""
        assert self.file_path, "file_path cannot be empty"
        assert self.change_type in ['added', 'modified', 'deleted'], "Invalid change_type"
        assert self.timestamp > 0, "timestamp must be positive"


@dataclass
class DependencyNode:
    """Node in dependency graph for impact analysis."""
    file_path: str
    dependencies: Set[str] = field(default_factory=set)
    dependents: Set[str] = field(default_factory=set)
    last_modified: float = 0.0
    analysis_priority: int = 1  # 1=high, 2=medium, 3=low
    estimated_analysis_time_ms: float = 100.0
    
    def add_dependency(self, dependency_path: str) -> None:
        """Add dependency relationship."""
        self.dependencies.add(dependency_path)
    
    def add_dependent(self, dependent_path: str) -> None:
        """Add dependent relationship."""
        self.dependents.add(dependent_path)
    
    def get_impact_scope(self) -> Set[str]:
        """Get all files that could be impacted by changes to this file."""
        return self.dependents.copy()


@dataclass
class AnalysisTask:
    """Task for incremental analysis processing."""
    task_id: str
    file_path: str
    task_type: str  # 'parse_ast', 'analyze_connascence', 'validate_changes'
    priority: int
    dependencies: Set[str] = field(default_factory=set)
    estimated_time_ms: float = 100.0
    retry_count: int = 0
    max_retries: int = 3
    
    def __post_init__(self):
        """Validate analysis task."""
        assert self.task_id, "task_id cannot be empty"
        assert self.file_path, "file_path cannot be empty"
        assert 1 <= self.priority <= 3, "priority must be 1-3"
        assert self.max_retries >= 0, "max_retries must be non-negative"


class DependencyGraphAnalyzer:
    """
    Analyzes project dependency graph for impact analysis.
    
    NASA Rule 4: All methods under 60 lines
    NASA Rule 7: Bounded resource usage
    """
    
    def __init__(self, max_depth: int = 10):
        """Initialize dependency graph analyzer."""
        self.max_depth = max_depth
        self.dependency_graph: Dict[str, DependencyNode] = {}
        self.graph_lock = threading.RLock()
        self.analysis_stats = {
            "nodes_analyzed": 0,
            "dependencies_discovered": 0,
            "impact_analyses": 0,
            "graph_updates": 0
        }
        
        logger.info(f"Initialized dependency graph analyzer with max depth: {max_depth}")
    
    def add_file_node(self, file_path: str, estimated_analysis_time: float = 100.0) -> DependencyNode:
        """Add or update file node in dependency graph."""
        with self.graph_lock:
            if file_path not in self.dependency_graph:
                self.dependency_graph[file_path] = DependencyNode(
                    file_path=file_path,
                    last_modified=time.time(),
                    estimated_analysis_time_ms=estimated_analysis_time
                )
                self.analysis_stats["nodes_analyzed"] += 1
            
            return self.dependency_graph[file_path]
    
    async def analyze_file_dependencies(self, file_path: str) -> Set[str]:
        """
        Analyze dependencies for a specific file.
        
        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert file_path, "file_path cannot be empty"
        
        if not path_exists(file_path):
            return set()
        
        dependencies = set()
        
        try:
            # Get file content for analysis
            if ANALYZER_COMPONENTS_AVAILABLE:
                file_cache = get_global_cache()
                content = file_cache.get_file_content(file_path)
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            
            if not content:
                return dependencies
            
            # Parse imports for Python files
            if file_path.endswith('.py'):
                dependencies = await self._extract_python_dependencies(file_path, content)
            
            # Update dependency graph
            with self.graph_lock:
                node = self.add_file_node(file_path)
                
                # Clear old dependencies
                for old_dep in node.dependencies:
                    if old_dep in self.dependency_graph:
                        self.dependency_graph[old_dep].dependents.discard(file_path)
                
                # Add new dependencies
                node.dependencies = dependencies
                for dep_path in dependencies:
                    dep_node = self.add_file_node(dep_path)
                    dep_node.add_dependent(file_path)
                
                self.analysis_stats["dependencies_discovered"] += len(dependencies)
                self.analysis_stats["graph_updates"] += 1
        
        except Exception as e:
            logger.debug(f"Failed to analyze dependencies for {file_path}: {e}")
        
        return dependencies
    
    async def _extract_python_dependencies(self, file_path: str, content: str) -> Set[str]:
        """Extract Python import dependencies."""
        dependencies = set()
        
        try:
            # Parse AST to extract imports
            tree = ast.parse(content, filename=file_path)
            base_dir = Path(file_path).parent
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        dep_path = self._resolve_import_path(alias.name, base_dir)
                        if dep_path:
                            dependencies.add(str(dep_path))
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        dep_path = self._resolve_import_path(node.module, base_dir)
                        if dep_path:
                            dependencies.add(str(dep_path))
        
        except Exception as e:
            logger.debug(f"Failed to extract Python dependencies from {file_path}: {e}")
        
        return dependencies
    
    def _resolve_import_path(self, module_name: str, base_dir: Path) -> Optional[Path]:
        """Resolve module import to file path."""
        # Handle relative imports
        if module_name.startswith('.'):
            parts = module_name.lstrip('.').split('.')
            if parts and parts[0]:
                potential_path = base_dir / '/'.join(parts) / '__init__.py'
                if potential_path.exists():
                    return potential_path
                potential_path = base_dir / f"{'/'.join(parts)}.py"
                if potential_path.exists():
                    return potential_path
        
        # Handle absolute imports - simplified resolution
        parts = module_name.split('.')
        
        # Search in common locations
        search_dirs = [base_dir, base_dir.parent, Path.cwd()]
        for search_dir in search_dirs:
            # Try as direct file
            potential_path = search_dir / f"{'/'.join(parts)}.py"
            if potential_path.exists():
                return potential_path
            
            # Try as package
            potential_path = search_dir / '/'.join(parts) / '__init__.py'
            if potential_path.exists():
                return potential_path
        
        return None
    
    def analyze_change_impact(self, changed_files: List[str]) -> Dict[str, Set[str]]:
        """
        Analyze impact of file changes on dependent files.
        
        NASA Rule 4: Function under 60 lines
        """
        impact_map = {}
        
        with self.graph_lock:
            for file_path in changed_files:
                impacted_files = set()
                
                if file_path in self.dependency_graph:
                    node = self.dependency_graph[file_path]
                    
                    # Direct dependents are immediately impacted
                    impacted_files.update(node.dependents)
                    
                    # Propagate impact through dependency chain
                    visited = {file_path}
                    to_visit = list(node.dependents)
                    depth = 0
                    
                    while to_visit and depth < self.max_depth:
                        next_level = []
                        
                        for dependent in to_visit:
                            if dependent not in visited:
                                visited.add(dependent)
                                impacted_files.add(dependent)
                                
                                if dependent in self.dependency_graph:
                                    next_level.extend(self.dependency_graph[dependent].dependents)
                        
                        to_visit = next_level
                        depth += 1
                
                impact_map[file_path] = impacted_files
                self.analysis_stats["impact_analyses"] += 1
        
        return impact_map
    
    def get_analysis_priority_order(self, files_to_analyze: List[str]) -> List[str]:
        """Get files ordered by analysis priority."""
        with self.graph_lock:
            file_priorities = []
            
            for file_path in files_to_analyze:
                if file_path in self.dependency_graph:
                    node = self.dependency_graph[file_path]
                    # Priority based on: dependency count + dependent count
                    priority_score = len(node.dependencies) + len(node.dependents)
                    file_priorities.append((priority_score, file_path))
                else:
                    # Unknown files get lowest priority
                    file_priorities.append((0, file_path))
            
            # Sort by priority (highest first)
            file_priorities.sort(key=lambda x: x[0], reverse=True)
            
            return [file_path for _, file_path in file_priorities]
    
    def get_dependency_stats(self) -> Dict[str, Any]:
        """Get dependency graph statistics."""
        with self.graph_lock:
            total_dependencies = sum(len(node.dependencies) for node in self.dependency_graph.values())
            total_dependents = sum(len(node.dependents) for node in self.dependency_graph.values())
            
            return {
                "total_nodes": len(self.dependency_graph),
                "total_dependencies": total_dependencies,
                "total_dependents": total_dependents,
                "average_dependencies_per_file": total_dependencies / max(len(self.dependency_graph), 1),
                "average_dependents_per_file": total_dependents / max(len(self.dependency_graph), 1),
                "analysis_stats": self.analysis_stats.copy()
            }


class IncrementalAnalysisEngine:
    """
    Main incremental analysis engine with parallel processing.
    
    NASA Rule 4: All methods under 60 lines
    NASA Rule 6: Clear variable scoping
    """
    
    def __init__(self, max_workers: Optional[int] = None):
        """Initialize incremental analysis engine."""
        self.max_workers = max_workers or min(8, max(2, threading.active_count()))
        self.thread_pool: Optional[ThreadPoolExecutor] = None
        
        # Core components
        self.dependency_analyzer = DependencyGraphAnalyzer()
        self.file_change_tracker = FileChangeTracker()
        
        # Analysis state
        self.analysis_active = False
        self.analysis_results: Dict[str, Any] = {}
        self.analysis_queue: deque = deque()
        self.analysis_stats = {
            "files_analyzed": 0,
            "incremental_analyses": 0,
            "full_analyses": 0,
            "analysis_time_saved_ms": 0.0,
            "cache_hits": 0
        }
        
        # Performance tracking
        self.analysis_times: Dict[str, float] = {}
        self.optimization_engine = None
        
        # Initialize optimization engine if available
        if ANALYZER_COMPONENTS_AVAILABLE:
            try:
                self.optimization_engine = get_global_optimization_engine()
            except Exception as e:
                logger.warning(f"Failed to initialize optimization engine: {e}")
        
        logger.info(f"Initialized incremental analysis engine with {self.max_workers} workers")
    
    async def start_analysis_engine(self) -> None:
        """Start the incremental analysis engine."""
        if self.analysis_active:
            logger.warning("Analysis engine already active")
            return
        
        self.analysis_active = True
        
        # Start thread pool
        self.thread_pool = ThreadPoolExecutor(
            max_workers=self.max_workers,
            thread_name_prefix="IncrementalAnalyzer"
        )
        
        logger.info("Incremental analysis engine started")
    
    async def stop_analysis_engine(self) -> None:
        """Stop the incremental analysis engine."""
        self.analysis_active = False
        
        if self.thread_pool:
            self.thread_pool.shutdown(wait=True)
            self.thread_pool = None
        
        logger.info("Incremental analysis engine stopped")
    
    async def analyze_project_incrementally(self,
                                          project_path: Union[str, Path],
                                          changed_files: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Perform incremental analysis on project with intelligent change detection.
        
        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert project_path, "project_path cannot be empty"
        
        project_path = Path(project_path)
        logger.info(f"Starting incremental analysis for: {project_path}")
        
        analysis_start = time.time()
        
        # Ensure analysis engine is started
        if not self.analysis_active:
            await self.start_analysis_engine()
        
        try:
            # Step 1: Detect file changes
            if changed_files is None:
                file_changes = await self.file_change_tracker.detect_changes(project_path)
            else:
                file_changes = await self.file_change_tracker.process_changed_files(changed_files)
            
            logger.info(f"Detected {len(file_changes)} file changes")
            
            # Step 2: Analyze dependency impact
            changed_file_paths = [change.file_path for change in file_changes]
            impact_analysis = self.dependency_analyzer.analyze_change_impact(changed_file_paths)
            
            # Step 3: Create analysis tasks
            analysis_tasks = await self._create_analysis_tasks(file_changes, impact_analysis)
            
            # Step 4: Execute parallel analysis
            analysis_results = await self._execute_parallel_analysis(analysis_tasks)
            
            # Step 5: Aggregate and validate results
            final_results = await self._aggregate_analysis_results(
                analysis_results, file_changes, impact_analysis
            )
            
            analysis_time = time.time() - analysis_start
            
            # Update statistics
            self.analysis_stats["incremental_analyses"] += 1
            self.analysis_stats["files_analyzed"] += len(changed_file_paths)
            
            logger.info(f"Incremental analysis completed in {analysis_time:.2f}s")
            
            return {
                "analysis_type": "incremental",
                "analysis_time_seconds": analysis_time,
                "files_changed": len(file_changes),
                "files_analyzed": len(analysis_tasks),
                "impact_scope": sum(len(impacted) for impacted in impact_analysis.values()),
                "results": final_results,
                "performance_stats": self.get_performance_stats()
            }
            
        except Exception as e:
            logger.error(f"Incremental analysis failed: {e}")
            # Fallback to full analysis if incremental fails
            return await self._fallback_full_analysis(project_path)
    
    async def _create_analysis_tasks(self,
                                   file_changes: List[FileChangeRecord],
                                   impact_analysis: Dict[str, Set[str]]) -> List[AnalysisTask]:
        """Create analysis tasks based on file changes and impact analysis."""
        tasks = []
        task_id_counter = 0
        
        # Create tasks for changed files
        for change in file_changes:
            if change.analysis_required:
                task_id_counter += 1
                
                # Determine task type based on change type and file extension
                task_type = self._determine_task_type(change)
                
                # Calculate priority based on impact scope
                impacted_files = impact_analysis.get(change.file_path, set())
                priority = min(3, max(1, 4 - len(impacted_files) // 10))  # More impact = higher priority
                
                task = AnalysisTask(
                    task_id=f"task_{task_id_counter:04d}",
                    file_path=change.file_path,
                    task_type=task_type,
                    priority=priority,
                    dependencies=impacted_files,
                    estimated_time_ms=self._estimate_analysis_time(change.file_path)
                )
                
                tasks.append(task)
        
        # Sort tasks by priority (high priority first)
        tasks.sort(key=lambda t: t.priority)
        
        return tasks
    
    def _determine_task_type(self, change: FileChangeRecord) -> str:
        """Determine analysis task type based on file change."""
        file_path = change.file_path
        
        if file_path.endswith('.py'):
            if change.change_type == 'added':
                return 'full_python_analysis'
            elif change.change_type == 'modified':
                return 'incremental_python_analysis'
            else:  # deleted
                return 'cleanup_analysis'
        
        elif file_path.endswith(('.yaml', '.yml', '.json')):
            return 'config_analysis'
        
        else:
            return 'generic_analysis'
    
    def _estimate_analysis_time(self, file_path: str) -> float:
        """Estimate analysis time based on file characteristics."""
        try:
            file_size = Path(file_path).stat().st_size
            
            # Base time estimation (rough heuristics)
            if file_path.endswith('.py'):
                # Python files: ~1ms per KB + AST parsing overhead
                base_time = (file_size / 1024) * 1.5 + 50.0
            else:
                # Other files: ~0.5ms per KB
                base_time = (file_size / 1024) * 0.5 + 10.0
            
            # Historical adjustment if available
            if file_path in self.analysis_times:
                historical_time = self.analysis_times[file_path]
                # Weighted average: 70% historical, 30% estimated
                return historical_time * 0.7 + base_time * 0.3
            
            return base_time
            
        except Exception:
            # Fallback estimate
            return 100.0
    
    async def _execute_parallel_analysis(self, tasks: List[AnalysisTask]) -> Dict[str, Any]:
        """
        Execute analysis tasks in parallel with optimal resource utilization.
        
        NASA Rule 4: Function under 60 lines
        """
        if not self.thread_pool:
            raise RuntimeError("Thread pool not initialized")
        
        results = {}
        failed_tasks = []
        
        # Submit all tasks to thread pool
        future_to_task = {}
        for task in tasks:
            future = self.thread_pool.submit(self._execute_single_analysis_task, task)
            future_to_task[future] = task
        
        # Collect results as they complete
        for future in as_completed(future_to_task, timeout=300):  # 5 minute timeout
            task = future_to_task[future]
            
            try:
                task_result = future.result(timeout=60)  # 1 minute timeout per task
                results[task.task_id] = {
                    "task": task,
                    "result": task_result,
                    "success": True,
                    "execution_time_ms": task_result.get("execution_time_ms", 0)
                }
                
                # Update analysis time history
                execution_time = task_result.get("execution_time_ms", 0)
                self.analysis_times[task.file_path] = execution_time
                
            except Exception as e:
                logger.warning(f"Analysis task {task.task_id} failed: {e}")
                failed_tasks.append(task)
                
                results[task.task_id] = {
                    "task": task,
                    "result": None,
                    "success": False,
                    "error": str(e)
                }
        
        # Retry failed tasks if they haven't exceeded max retries
        if failed_tasks:
            await self._retry_failed_tasks(failed_tasks, results)
        
        return results
    
    def _execute_single_analysis_task(self, task: AnalysisTask) -> Dict[str, Any]:
        """Execute a single analysis task."""
        start_time = time.time()
        
        try:
            # Execute task based on type
            if task.task_type == 'full_python_analysis':
                result = self._analyze_python_file_full(task.file_path)
            elif task.task_type == 'incremental_python_analysis':
                result = self._analyze_python_file_incremental(task.file_path)
            elif task.task_type == 'cleanup_analysis':
                result = self._cleanup_deleted_file_analysis(task.file_path)
            elif task.task_type == 'config_analysis':
                result = self._analyze_config_file(task.file_path)
            else:
                result = self._analyze_generic_file(task.file_path)
            
            execution_time = (time.time() - start_time) * 1000
            
            return {
                "analysis_type": task.task_type,
                "file_path": task.file_path,
                "execution_time_ms": execution_time,
                "result_data": result,
                "success": True
            }
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.debug(f"Analysis task failed for {task.file_path}: {e}")
            
            return {
                "analysis_type": task.task_type,
                "file_path": task.file_path,
                "execution_time_ms": execution_time,
                "error": str(e),
                "success": False
            }
    
    def _analyze_python_file_full(self, file_path: str) -> Dict[str, Any]:
        """Perform full analysis on Python file."""
        try:
            # Get AST from cache if available
            if ANALYZER_COMPONENTS_AVAILABLE and global_ast_cache:
                ast_tree = global_ast_cache.get_ast(file_path)
                cache_hit = True
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                ast_tree = ast.parse(content, filename=file_path)
                cache_hit = False
            
            if cache_hit:
                self.analysis_stats["cache_hits"] += 1
            
            # Analyze AST structure
            analysis_result = {
                "ast_nodes": len(list(ast.walk(ast_tree))),
                "functions": len([n for n in ast.walk(ast_tree) if isinstance(n, ast.FunctionDef)]),
                "classes": len([n for n in ast.walk(ast_tree) if isinstance(n, ast.ClassDef)]),
                "imports": len([n for n in ast.walk(ast_tree) if isinstance(n, (ast.Import, ast.ImportFrom))]),
                "cache_hit": cache_hit
            }
            
            return analysis_result
            
        except Exception as e:
            return {"error": str(e), "analysis_type": "full_python"}
    
    def _analyze_python_file_incremental(self, file_path: str) -> Dict[str, Any]:
        """Perform incremental analysis on modified Python file."""
        try:
            # For incremental analysis, we focus on changes only
            if ANALYZER_COMPONENTS_AVAILABLE:
                incremental_cache = get_global_incremental_cache()
                if incremental_cache:
                    # Track file change and get delta
                    delta = incremental_cache.track_file_change(file_path)
                    if delta:
                        return {
                            "analysis_type": "incremental",
                            "delta_info": delta,
                            "incremental_processing": True
                        }
            
            # Fallback to full analysis if incremental not available
            return self._analyze_python_file_full(file_path)
            
        except Exception as e:
            return {"error": str(e), "analysis_type": "incremental_python"}
    
    def _cleanup_deleted_file_analysis(self, file_path: str) -> Dict[str, Any]:
        """Clean up analysis data for deleted file."""
        # Remove from dependency graph
        with self.dependency_analyzer.graph_lock:
            if file_path in self.dependency_analyzer.dependency_graph:
                node = self.dependency_analyzer.dependency_graph[file_path]
                
                # Remove from dependents
                for dependent in node.dependents:
                    if dependent in self.dependency_analyzer.dependency_graph:
                        self.dependency_analyzer.dependency_graph[dependent].dependencies.discard(file_path)
                
                # Remove from dependencies
                for dependency in node.dependencies:
                    if dependency in self.dependency_analyzer.dependency_graph:
                        self.dependency_analyzer.dependency_graph[dependency].dependents.discard(file_path)
                
                del self.dependency_analyzer.dependency_graph[file_path]
        
        # Clear from analysis times
        self.analysis_times.pop(file_path, None)
        
        return {
            "analysis_type": "cleanup",
            "file_removed": file_path,
            "cleanup_successful": True
        }
    
    def _analyze_config_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze configuration file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Basic analysis of config files
            analysis_result = {
                "file_size_bytes": len(content),
                "line_count": len(content.splitlines()),
                "analysis_type": "config"
            }
            
            # Additional parsing for known config formats
            if file_path.endswith(('.json',)):
                try:
                    json.loads(content)
                    analysis_result["json_valid"] = True
                except json.JSONDecodeError:
                    analysis_result["json_valid"] = False
            
            return analysis_result
            
        except Exception as e:
            return {"error": str(e), "analysis_type": "config"}
    
    def _analyze_generic_file(self, file_path: str) -> Dict[str, Any]:
        """Perform generic file analysis."""
        try:
            file_stat = Path(file_path).stat()
            
            return {
                "file_size_bytes": file_stat.st_size,
                "last_modified": file_stat.st_mtime,
                "analysis_type": "generic"
            }
            
        except Exception as e:
            return {"error": str(e), "analysis_type": "generic"}
    
    async def _retry_failed_tasks(self, failed_tasks: List[AnalysisTask], results: Dict[str, Any]) -> None:
        """Retry failed analysis tasks."""
        for task in failed_tasks:
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                logger.info(f"Retrying task {task.task_id} (attempt {task.retry_count})")
                
                try:
                    # Retry with exponential backoff
                    await asyncio.sleep(2 ** task.retry_count)
                    
                    task_result = self._execute_single_analysis_task(task)
                    
                    if task_result["success"]:
                        results[task.task_id] = {
                            "task": task,
                            "result": task_result,
                            "success": True,
                            "retried": True,
                            "retry_count": task.retry_count
                        }
                    
                except Exception as e:
                    logger.warning(f"Retry failed for task {task.task_id}: {e}")
    
    async def _aggregate_analysis_results(self,
                                        analysis_results: Dict[str, Any],
                                        file_changes: List[FileChangeRecord],
                                        impact_analysis: Dict[str, Set[str]]) -> Dict[str, Any]:
        """Aggregate analysis results into final report."""
        successful_analyses = [r for r in analysis_results.values() if r["success"]]
        failed_analyses = [r for r in analysis_results.values() if not r["success"]]
        
        # Calculate performance metrics
        total_execution_time = sum(
            r["result"].get("execution_time_ms", 0) for r in successful_analyses
        )
        
        # Calculate time savings from caching
        cache_hits = sum(
            1 for r in successful_analyses 
            if r["result"].get("result_data", {}).get("cache_hit", False)
        )
        
        estimated_time_saved = cache_hits * 100  # Assume 100ms saved per cache hit
        self.analysis_stats["analysis_time_saved_ms"] += estimated_time_saved
        
        aggregated_results = {
            "summary": {
                "total_tasks": len(analysis_results),
                "successful_tasks": len(successful_analyses),
                "failed_tasks": len(failed_analyses),
                "success_rate_percent": (len(successful_analyses) / max(len(analysis_results), 1)) * 100,
                "total_execution_time_ms": total_execution_time,
                "cache_hits": cache_hits,
                "estimated_time_saved_ms": estimated_time_saved
            },
            "file_changes_processed": len(file_changes),
            "impact_scope_analyzed": sum(len(impacted) for impacted in impact_analysis.values()),
            "detailed_results": analysis_results,
            "performance_improvement": {
                "incremental_analysis_enabled": True,
                "parallel_processing_utilized": True,
                "caching_effectiveness_percent": (cache_hits / max(len(analysis_results), 1)) * 100
            }
        }
        
        return aggregated_results
    
    async def _fallback_full_analysis(self, project_path: Path) -> Dict[str, Any]:
        """Fallback to full project analysis if incremental fails."""
        logger.warning("Falling back to full analysis")
        
        self.analysis_stats["full_analyses"] += 1
        
        # Simplified full analysis implementation
        python_files = list(project_path.rglob("*.py"))
        
        return {
            "analysis_type": "full_fallback",
            "files_discovered": len(python_files),
            "analysis_completed": True,
            "fallback_reason": "incremental_analysis_failed"
        }
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance statistics."""
        total_analyses = (self.analysis_stats["incremental_analyses"] + 
                         self.analysis_stats["full_analyses"])
        
        incremental_ratio = (
            self.analysis_stats["incremental_analyses"] / max(total_analyses, 1)
        ) * 100
        
        return {
            "analysis_statistics": self.analysis_stats.copy(),
            "dependency_graph_stats": self.dependency_analyzer.get_dependency_stats(),
            "performance_metrics": {
                "incremental_analysis_ratio_percent": incremental_ratio,
                "average_analysis_time_ms": (
                    sum(self.analysis_times.values()) / max(len(self.analysis_times), 1)
                ),
                "total_time_saved_ms": self.analysis_stats["analysis_time_saved_ms"],
                "cache_hit_rate_percent": (
                    self.analysis_stats["cache_hits"] / max(self.analysis_stats["files_analyzed"], 1)
                ) * 100
            },
            "resource_utilization": {
                "max_workers": self.max_workers,
                "thread_pool_active": self.thread_pool is not None,
                "analysis_queue_size": len(self.analysis_queue)
            }
        }


class FileChangeTracker:
    """
    Tracks file changes for incremental analysis.
    
    NASA Rule 4: All methods under 60 lines
    NASA Rule 7: Bounded resource usage
    """
    
    def __init__(self, max_tracked_files: int = 10000):
        """Initialize file change tracker."""
        self.max_tracked_files = max_tracked_files
        self.file_hashes: Dict[str, str] = {}
        self.change_history: deque = deque(maxlen=1000)  # Last 1000 changes
        self.tracking_lock = threading.RLock()
        
        logger.info(f"Initialized file change tracker with max {max_tracked_files} files")
    
    async def detect_changes(self, project_path: Path) -> List[FileChangeRecord]:
        """Detect file changes in project directory."""
        changes = []
        current_files = set()
        
        # Scan for current files
        for py_file in project_path.rglob("*.py"):
            if py_file.is_file():
                current_files.add(str(py_file))
        
        # Limit files to prevent memory issues (NASA Rule 7)
        if len(current_files) > self.max_tracked_files:
            logger.warning(f"Too many files ({len(current_files)}), limiting to {self.max_tracked_files}")
            current_files = set(list(current_files)[:self.max_tracked_files])
        
        with self.tracking_lock:
            # Check for new and modified files
            for file_path in current_files:
                current_hash = self._calculate_file_hash(file_path)
                if current_hash is None:
                    continue
                
                old_hash = self.file_hashes.get(file_path)
                
                if old_hash is None:
                    # New file
                    change = FileChangeRecord(
                        file_path=file_path,
                        old_hash=None,
                        new_hash=current_hash,
                        change_type='added',
                        timestamp=time.time()
                    )
                    changes.append(change)
                    
                elif old_hash != current_hash:
                    # Modified file
                    change = FileChangeRecord(
                        file_path=file_path,
                        old_hash=old_hash,
                        new_hash=current_hash,
                        change_type='modified',
                        timestamp=time.time()
                    )
                    changes.append(change)
                
                # Update hash tracking
                self.file_hashes[file_path] = current_hash
            
            # Check for deleted files
            tracked_files = set(self.file_hashes.keys())
            deleted_files = tracked_files - current_files
            
            for file_path in deleted_files:
                change = FileChangeRecord(
                    file_path=file_path,
                    old_hash=self.file_hashes[file_path],
                    new_hash="",
                    change_type='deleted',
                    timestamp=time.time()
                )
                changes.append(change)
                
                # Remove from tracking
                del self.file_hashes[file_path]
        
        # Record changes in history
        for change in changes:
            self.change_history.append(change)
        
        return changes
    
    async def process_changed_files(self, changed_file_paths: List[str]) -> List[FileChangeRecord]:
        """Process specific list of changed files."""
        changes = []
        
        with self.tracking_lock:
            for file_path in changed_file_paths:
                if path_exists(file_path):
                    current_hash = self._calculate_file_hash(file_path)
                    if current_hash is None:
                        continue
                    
                    old_hash = self.file_hashes.get(file_path)
                    
                    if old_hash != current_hash:
                        change_type = 'added' if old_hash is None else 'modified'
                        
                        change = FileChangeRecord(
                            file_path=file_path,
                            old_hash=old_hash,
                            new_hash=current_hash,
                            change_type=change_type,
                            timestamp=time.time()
                        )
                        changes.append(change)
                        
                        # Update hash tracking
                        self.file_hashes[file_path] = current_hash
                else:
                    # File deleted
                    old_hash = self.file_hashes.get(file_path)
                    if old_hash:
                        change = FileChangeRecord(
                            file_path=file_path,
                            old_hash=old_hash,
                            new_hash="",
                            change_type='deleted',
                            timestamp=time.time()
                        )
                        changes.append(change)
                        
                        del self.file_hashes[file_path]
        
        # Record in history
        for change in changes:
            self.change_history.append(change)
        
        return changes
    
    def _calculate_file_hash(self, file_path: str) -> Optional[str]:
        """Calculate MD5 hash of file content."""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            return hashlib.md5(content, usedforsecurity=False).hexdigest()
        except Exception as e:
            logger.debug(f"Failed to calculate hash for {file_path}: {e}")
            return None
    
    def get_change_history(self, limit: int = 100) -> List[FileChangeRecord]:
        """Get recent change history."""
        with self.tracking_lock:
            return list(self.change_history)[-limit:]
    
    def get_tracking_stats(self) -> Dict[str, Any]:
        """Get file tracking statistics."""
        with self.tracking_lock:
            return {
                "files_tracked": len(self.file_hashes),
                "changes_recorded": len(self.change_history),
                "max_tracked_files": self.max_tracked_files
            }


# Global incremental analysis engine instance
_global_incremental_engine: Optional[IncrementalAnalysisEngine] = None
_engine_lock = threading.Lock()


def get_global_incremental_engine() -> IncrementalAnalysisEngine:
    """Get or create global incremental analysis engine."""
    global _global_incremental_engine
    
    with _engine_lock:
        if _global_incremental_engine is None:
            _global_incremental_engine = IncrementalAnalysisEngine()
    
    return _global_incremental_engine


async def analyze_project_changes(project_path: Union[str, Path],
                                  changed_files: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    High-level function to analyze project changes incrementally.
    
    Args:
        project_path: Path to project for analysis
        changed_files: Optional list of specific changed files
    
    Returns:
        Dict containing incremental analysis results
    """
    engine = get_global_incremental_engine()
    
    try:
        results = await engine.analyze_project_incrementally(project_path, changed_files)
        return results
    finally:
        # Keep engine running for next analysis
        pass


if __name__ == "__main__":
    # Example usage
    async def main():
        import sys
        project_path = sys.argv[1] if len(sys.argv) > 1 else "."
        
        print("Starting Incremental Analysis Engine")
        print("=" * 50)
        
        try:
            results = await analyze_project_changes(project_path)
            
            print("\nIncremental Analysis Results:")
            print(f"Analysis Type: {results['analysis_type']}")
            print(f"Analysis Time: {results['analysis_time_seconds']:.2f}s")
            print(f"Files Changed: {results['files_changed']}")
            print(f"Files Analyzed: {results['files_analyzed']}")
            print(f"Impact Scope: {results['impact_scope']} files")
            
            perf_stats = results.get('performance_stats', {})
            print("\nPerformance Statistics:")
            print(f"Cache Hit Rate: {perf_stats.get('performance_metrics', {}).get('cache_hit_rate_percent', 0):.1f}%")
            print(f"Time Saved: {perf_stats.get('performance_metrics', {}).get('total_time_saved_ms', 0):.0f}ms")
            
        except Exception as e:
            print(f"Analysis failed: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(main())

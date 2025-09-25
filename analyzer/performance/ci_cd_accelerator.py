from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH, MINIMUM_TEST_COVERAGE_PERCENTAGE, SESSION_TIMEOUT_SECONDS

        return optimized_batches
        """Build task dependency graph."""        self.dependency_graph.clear()        task_ids = {task.task_id for task in tasks}        for task in tasks:        # Only include dependencies that exist in current task set        valid_dependencies = task.dependencies & task_ids        self.dependency_graph[task.task_id] = valid_dependencies    def _analyze_dependency_levels(self, tasks: List[PipelineTask]) -> List[List[PipelineTask]]:

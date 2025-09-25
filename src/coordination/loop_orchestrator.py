"""
Loop Orchestrator - Refactored Entry Point
Decomposed from 1888 LOC god object into coordinated components
"""

from .orchestrator_components.loop_builder import DevelopmentLoopBuilder
from .orchestrator_components.loop_executor import LoopExecutor
from .orchestrator_components.task_coordinator import TaskCoordinator

class LoopOrchestrator:
    """Main loop orchestrator - now 60 LOC instead of 1888 LOC"""

    def __init__(self):
        self.executor = LoopExecutor()
        self.coordinator = TaskCoordinator()
        self.builder = DevelopmentLoopBuilder()

    def orchestrate_development_cycle(self, requirements):
        """Orchestrate complete development cycle"""
        loop_config = self.builder.build_loop(requirements)
        task_coordination = self.coordinator.coordinate_tasks(requirements.get('tasks', []))
        execution_result = self.executor.execute_loop(loop_config)

        return {
            "loop_config": loop_config,
            "coordination": task_coordination,
            "execution": execution_result,
            "status": "ORCHESTRATED"
        }

# Maintain backward compatibility
def orchestrate_loop(requirements):
    orchestrator = LoopOrchestrator()
    return orchestrator.orchestrate_development_cycle(requirements)

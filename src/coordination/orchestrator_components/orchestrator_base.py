"""Loop Orchestrator Base Classes"""
from abc import ABC, abstractmethod

class OrchestratorBase(ABC):
    """Base orchestrator interface"""

    @abstractmethod
    def execute_loop(self, loop_config):
        pass

class LoopBuilder(ABC):
    """Builder for loop configurations"""

    @abstractmethod
    def build_loop(self, specifications):
        pass

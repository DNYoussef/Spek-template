from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ComponentManager - Extracted from UnifiedConnascenceAnalyzer
Handles initialization of optional analysis components
Part of god object decomposition (Day 5)
"""

from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Import optional components with fallbacks
try:
    from ..smart_integration_engine import SmartIntegrationEngine
except ImportError:
    SmartIntegrationEngine = None

try:
    from ..failure_detection import FailureDetectionSystem
except ImportError:
    FailureDetectionSystem = None

try:
    from ..nasa_integration import NASAPowerOfTenIntegration
except ImportError:
    NASAPowerOfTenIntegration = None

try:
    from ..policy_manager import PolicyManager
except ImportError:
    PolicyManager = None

try:
    from ..budget_tracker import BudgetTracker
except ImportError:
    BudgetTracker = None

try:
    from ..connascence_ast_analyzer import ConnascenceASTAnalyzer
except ImportError:
    ConnascenceASTAnalyzer = None

try:
    from ..god_object_analyzer import GodObjectOrchestrator
except ImportError:
    GodObjectOrchestrator = None

try:
    from ..mece_analyzer import MECEAnalyzer
except ImportError:
    MECEAnalyzer = None

class ComponentManager:
    """
    Manages initialization of optional analysis components.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~200 LOC component).
    Handles:
    - Core analyzer initialization
    - Optional component setup with fallbacks
    - Component status tracking
    - Graceful degradation when components unavailable
    """

    def __init__(self):
        """Initialize component manager."""
        # Core analyzers
        self.ast_analyzer = None
        self.god_object_orchestrator = None
        self.mece_analyzer = None

        # Optional components
        self.smart_engine = None
        self.failure_detector = None
        self.nasa_integration = None
        self.policy_manager = None
        self.budget_tracker = None

        # Initialize components
        self._initialize_core_analyzers()
        self._initialize_optional_components()

    def _initialize_core_analyzers(self) -> None:
        """Initialize core analyzers with fallbacks."""
        try:
            if ConnascenceASTAnalyzer:
                self.ast_analyzer = ConnascenceASTAnalyzer()

            if GodObjectOrchestrator:
                self.god_object_orchestrator = GodObjectOrchestrator()
            else:
                # Minimal fallback
                class MinimalGodObjectOrchestrator:
                    def analyze(self, *args, **kwargs): return []
                    def orchestrate_analysis(self, *args, **kwargs): return []
                    def analyze_directory(self, *args, **kwargs): return []
                self.god_object_orchestrator = MinimalGodObjectOrchestrator()

            if MECEAnalyzer:
                self.mece_analyzer = MECEAnalyzer()

        except Exception as e:
            logger.error(f"Core analyzer initialization failed: {e}")
            raise

    def _initialize_optional_components(self) -> None:
        """Initialize optional components with fallbacks."""
        # Smart integration engine
        if SmartIntegrationEngine:
            try:
                self.smart_engine = SmartIntegrationEngine()
            except Exception as e:
                logger.warning(f"Smart engine initialization failed: {e}")
                self.smart_engine = None

        # Failure detection system
        if FailureDetectionSystem:
            try:
                self.failure_detector = FailureDetectionSystem()
            except Exception as e:
                logger.warning(f"Failure detector initialization failed: {e}")
                self.failure_detector = None

        # NASA integration
        if NASAPowerOfTenIntegration:
            try:
                self.nasa_integration = NASAPowerOfTenIntegration()
            except Exception as e:
                logger.warning(f"NASA integration initialization failed: {e}")
                self.nasa_integration = None

        # Policy manager
        if PolicyManager:
            try:
                self.policy_manager = PolicyManager()
            except Exception as e:
                logger.warning(f"Policy manager initialization failed: {e}")
                self.policy_manager = None

        # Budget tracker
        if BudgetTracker:
            try:
                self.budget_tracker = BudgetTracker()
            except Exception as e:
                logger.warning(f"Budget tracker initialization failed: {e}")
                self.budget_tracker = None

    def get_component_status(self) -> dict:
        """Get status of all components."""
        return {
            "core_components": True,
            "ast_analyzer": self.ast_analyzer is not None,
            "god_object_orchestrator": self.god_object_orchestrator is not None,
            "mece_analyzer": self.mece_analyzer is not None,
            "smart_engine": self.smart_engine is not None,
            "failure_detector": self.failure_detector is not None,
            "nasa_integration": self.nasa_integration is not None,
            "policy_manager": self.policy_manager is not None,
            "budget_tracker": self.budget_tracker is not None,
        }

    def get_loaded_components(self) -> list:
        """Get list of loaded component names."""
        components = ["AST Analyzer", "Orchestrator", "MECE Analyzer"]

        if self.smart_engine:
            components.append("Smart Engine")
        if self.failure_detector:
            components.append("Failure Detector")
        if self.nasa_integration:
            components.append("NASA Integration")
        if self.policy_manager:
            components.append("Policy Manager")
        if self.budget_tracker:
            components.append("Budget Tracker")

        return components

    def get_ast_analyzer(self):
        """Get AST analyzer instance."""
        return self.ast_analyzer

    def get_god_object_orchestrator(self):
        """Get god object orchestrator instance."""
        return self.god_object_orchestrator

    def get_mece_analyzer(self):
        """Get MECE analyzer instance."""
        return self.mece_analyzer

    def get_smart_engine(self) -> Optional[object]:
        """Get smart integration engine instance."""
        return self.smart_engine

    def get_failure_detector(self) -> Optional[object]:
        """Get failure detection system instance."""
        return self.failure_detector

    def get_nasa_integration(self) -> Optional[object]:
        """Get NASA integration instance."""
        return self.nasa_integration

    def get_policy_manager(self) -> Optional[object]:
        """Get policy manager instance."""
        return self.policy_manager

    def get_budget_tracker(self) -> Optional[object]:
        """Get budget tracker instance."""
        return self.budget_tracker
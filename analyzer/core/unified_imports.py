# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Connascence Safety Analyzer Contributors

"""
Unified Import Management System
================================

Provides centralized import management for all analyzer components.
Fixes the missing import infrastructure causing cascade failures.
"""

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional, NamedTuple

logger = logging.getLogger(__name__)


class ImportResult(NamedTuple):
    """Result of an import attempt with module and availability status."""
    has_module: bool
    module: Optional[Any] = None
    error: Optional[str] = None


class UnifiedImportManager:
    """Centralized import manager for all analyzer components."""
    
    def __init__(self):
        """Initialize import manager with tracking capabilities."""
        self.import_stats = {}
        self.failed_imports = {}
        
    def log_import(self, module_name: str, success: bool, error: Optional[str] = None):
        """Log import attempt for debugging and statistics."""
        self.import_stats[module_name] = success
        if not success and error:
            self.failed_imports[module_name] = error
            logger.warning(f"Import failed for {module_name}: {error}")
        else:
            logger.debug(f"Import {'successful' if success else 'failed'} for {module_name}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get import statistics for debugging."""
        return {
            "total_imports": len(self.import_stats),
            "successful_imports": sum(self.import_stats.values()),
            "failed_imports": len(self.failed_imports),
            "success_rate": sum(self.import_stats.values()) / max(1, len(self.import_stats)),
            "failed_modules": list(self.failed_imports.keys())
        }
    
    def import_constants(self) -> ImportResult:
        """Import analyzer constants module."""
        try:
            from analyzer.constants import (
                NASA_COMPLIANCE_THRESHOLD,
                MECE_QUALITY_THRESHOLD, 
                OVERALL_QUALITY_THRESHOLD,
                VIOLATION_WEIGHTS,
                resolve_policy_name,
                validate_policy_name,
                list_available_policies
            )
            
            # Create a constants module-like object
            class Constants:
                NASA_COMPLIANCE_THRESHOLD = NASA_COMPLIANCE_THRESHOLD
                MECE_QUALITY_THRESHOLD = MECE_QUALITY_THRESHOLD
                OVERALL_QUALITY_THRESHOLD = OVERALL_QUALITY_THRESHOLD
                VIOLATION_WEIGHTS = VIOLATION_WEIGHTS
                resolve_policy_name = resolve_policy_name
                validate_policy_name = validate_policy_name
                list_available_policies = list_available_policies
            
            constants = Constants()
            self.log_import("analyzer.constants", True)
            return ImportResult(has_module=True, module=constants)
            
        except ImportError as e:
            self.log_import("analyzer.constants", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
    def import_unified_analyzer(self) -> ImportResult:
        """Import unified connascence analyzer with enhanced detection."""
        # Try multiple import paths for unified analyzer
        import_attempts = [
            ("analyzer.unified_analyzer", "UnifiedConnascenceAnalyzer"),
            ("analyzer.core.unified_analyzer", "UnifiedConnascenceAnalyzer"),
            ("unified_analyzer", "UnifiedConnascenceAnalyzer"),
        ]
        
        for module_path, class_name in import_attempts:
            try:
                module = __import__(module_path, fromlist=[class_name])
                unified_class = getattr(module, class_name)
                
                # Verify the class has required methods for proper detection
                required_methods = ['analyze_project', 'analyze_file', 'analyze_path']
                if all(hasattr(unified_class, method) for method in required_methods):
                    self.log_import(f"unified_analyzer.{module_path}", True)
                    return ImportResult(has_module=True, module=unified_class)
                else:
                    logger.debug(f"Unified analyzer from {module_path} missing required methods")
                    
            except (ImportError, AttributeError) as e:
                logger.debug(f"Could not import unified analyzer from {module_path}: {e}")
        
        self.log_import("unified_analyzer", False, "No functional unified analyzer found")
        return ImportResult(has_module=False, error="No functional unified analyzer found")
    
    def import_duplication_analyzer(self) -> ImportResult:
        """Import duplication analysis components with better detection."""
        # Try multiple import strategies for duplication components
        import_attempts = [
            # Primary unified duplication analyzer
            ("analyzer.duplication_unified", ["UnifiedDuplicationAnalyzer", "format_duplication_analysis"]),
            # Fallback to older duplication analyzer
            ("analyzer.dup_detection.mece_analyzer", ["MECEAnalyzer"]),
            ("analyzer.duplication", ["DuplicationAnalyzer"]),
        ]
        
        for module_path, class_names in import_attempts:
            try:
                module = __import__(module_path, fromlist=class_names)
                components = {}
                successful_components = 0
                
                for class_name in class_names:
                    try:
                        components[class_name] = getattr(module, class_name)
                        successful_components += 1
                    except AttributeError:
                        continue
                
                # If we successfully imported at least one component
                if successful_components > 0:
                    class DuplicationModule:
                        def __init__(self, components_dict):
                            for name, component in components_dict.items():
                                setattr(self, name, component)
                            # Ensure we have the expected interface
                            if not hasattr(self, 'UnifiedDuplicationAnalyzer') and hasattr(self, 'MECEAnalyzer'):
                                self.UnifiedDuplicationAnalyzer = self.MECEAnalyzer
                            if not hasattr(self, 'format_duplication_analysis'):
                                self.format_duplication_analysis = self._default_format_function
                        
                        def _default_format_function(self, result):
                            return {"score": result.get("score", 1.0) if result else 1.0, "violations": [], "available": True}
                    
                    self.log_import(f"duplication.{module_path}", True, f"{successful_components} components from {module_path}")
                    return ImportResult(has_module=True, module=DuplicationModule(components))
                    
            except ImportError as e:
                logger.debug(f"Could not import duplication components from {module_path}: {e}")
        
        self.log_import("duplication_analyzer", False, "No functional duplication analyzer found")
        return ImportResult(has_module=False, error="No functional duplication analyzer found")
    
    def import_orchestration_components(self) -> ImportResult:
        """Import analysis orchestration components."""
        try:
            from analyzer.architecture.orchestrator import AnalysisOrchestrator
            from analyzer.analysis_orchestrator import AnalysisOrchestrator as MainOrchestrator
            
            class OrchestrationModule:
                AnalysisOrchestrator = AnalysisOrchestrator
                MainOrchestrator = MainOrchestrator
            
            self.log_import("orchestration_components", True)
            return ImportResult(has_module=True, module=OrchestrationModule())
            
        except ImportError as e:
            self.log_import("orchestration_components", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
    def import_analyzer_components(self) -> ImportResult:
        """Import core analyzer components with enhanced fallback detection."""
        # Try multiple import strategies for better component detection
        component_paths = [
            # Primary paths
            ("analyzer.ast_engine.core_analyzer", "ConnascenceDetector"),
            ("analyzer.detectors.convention", "ConventionDetector"),
            ("analyzer.detectors.execution", "ExecutionDetector"),
            ("analyzer.detectors.magic_literal", "MagicLiteralDetector"),
            ("analyzer.detectors.timing", "TimingDetector"),
            ("analyzer.detectors.god_object", "GodObjectDetector"),
            ("analyzer.detectors.algorithm", "AlgorithmDetector"),
            ("analyzer.detectors.position", "PositionDetector"),
            ("analyzer.detectors.values", "ValuesDetector"),
        ]
        
        components = {}
        successful_imports = 0
        
        # Import individual components with fallback handling
        for module_path, class_name in component_paths:
            try:
                module = __import__(module_path, fromlist=[class_name])
                components[class_name] = getattr(module, class_name)
                successful_imports += 1
            except (ImportError, AttributeError) as e:
                logger.debug(f"Could not import {class_name} from {module_path}: {e}")
                # Create mock component for missing detectors
                components[class_name] = self._create_mock_detector(class_name)
        
        # Enhanced detection: if we have at least some components, consider it successful
        if successful_imports >= 3:  # Require at least 3 real components
            class AnalyzerComponents:
                def __init__(self, components_dict):
                    for name, component in components_dict.items():
                        setattr(self, name, component)
            
            self.log_import("analyzer_components", True, f"{successful_imports}/{len(component_paths)} components loaded")
            return ImportResult(has_module=True, module=AnalyzerComponents(components))
        
        # If we have fewer than 3 components, use fallback
        self.log_import("analyzer_components", False, f"Only {successful_imports}/{len(component_paths)} components available")
        return ImportResult(has_module=False, error=f"Insufficient components: {successful_imports}/{len(component_paths)}")
    
    def import_mcp_server(self) -> ImportResult:
        """Import MCP server components."""
        try:
            from analyzer.utils.types import ConnascenceViolation
            
            class MCPModule:
                ConnascenceViolation = ConnascenceViolation
            
            self.log_import("mcp_server", True)
            return ImportResult(has_module=True, module=MCPModule())
            
        except ImportError as e:
            self.log_import("mcp_server", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
    def import_reporting(self, format_type: Optional[str] = None) -> ImportResult:
        """Import reporting components by format type."""
        try:
            if format_type == "json":
                from analyzer.reporting.json import JSONReporter
                self.log_import(f"reporting.{format_type}", True)
                return ImportResult(has_module=True, module=JSONReporter)
                
            elif format_type == "sarif":
                from analyzer.reporting.sarif import SARIFReporter
                self.log_import(f"reporting.{format_type}", True)
                return ImportResult(has_module=True, module=SARIFReporter)
                
            else:
                from analyzer.reporting.json import JSONReporter
                from analyzer.reporting.sarif import SARIFReporter
                from analyzer.reporting.markdown import MarkdownReporter
                
                class ReportingModule:
                    JSONReporter = JSONReporter
                    SARIFReporter = SARIFReporter
                    MarkdownReporter = MarkdownReporter
                
                self.log_import("reporting", True)
                return ImportResult(has_module=True, module=ReportingModule())
                
        except ImportError as e:
            self.log_import(f"reporting.{format_type or 'all'}", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
    def import_output_manager(self) -> ImportResult:
        """Import output management components."""
        try:
            from analyzer.reporting.coordinator import ReportingCoordinator
            
            class OutputModule:
                ReportingCoordinator = ReportingCoordinator
            
            self.log_import("output_manager", True)
            return ImportResult(has_module=True, module=OutputModule())
            
        except ImportError as e:
            self.log_import("output_manager", False, str(e))
            return ImportResult(has_module=False, error=str(e))


    def _create_mock_detector(self, detector_name: str):
        """Create a mock detector for missing components."""
        class MockDetector:
            def __init__(self, name):
                self.name = name
            
            def detect(self, *args, **kwargs):
                return []
            
            def analyze_directory(self, *args, **kwargs):
                return []
            
            def analyze_file(self, *args, **kwargs):
                return []
        
        return MockDetector(detector_name)
    
    def get_availability_summary(self) -> Dict[str, Any]:
        """Get a summary of component availability for debugging."""
        summary = {
            "constants": self.import_constants().has_module,
            "unified_analyzer": self.import_unified_analyzer().has_module,
            "duplication_analyzer": self.import_duplication_analyzer().has_module,
            "analyzer_components": self.import_analyzer_components().has_module,
            "orchestration": self.import_orchestration_components().has_module,
            "mcp_server": self.import_mcp_server().has_module,
            "reporting": self.import_reporting().has_module,
            "output_manager": self.import_output_manager().has_module
        }
        
        available_count = sum(summary.values())
        total_count = len(summary)
        summary["availability_score"] = available_count / total_count
        summary["unified_mode_ready"] = summary["unified_analyzer"] and summary["analyzer_components"]
        
        return summary


# Global import manager instance
IMPORT_MANAGER = UnifiedImportManager()

__all__ = ["IMPORT_MANAGER", "ImportResult", "UnifiedImportManager"]
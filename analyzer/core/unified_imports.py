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
        """Import unified connascence analyzer."""
        try:
            from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer
            self.log_import("analyzer.unified_analyzer", True)
            return ImportResult(has_module=True, module=UnifiedConnascenceAnalyzer)
            
        except ImportError as e:
            self.log_import("analyzer.unified_analyzer", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
    def import_duplication_analyzer(self) -> ImportResult:
        """Import duplication analysis components."""
        try:
            from analyzer.duplication_unified import UnifiedDuplicationAnalyzer, format_duplication_analysis
            
            class DuplicationModule:
                UnifiedDuplicationAnalyzer = UnifiedDuplicationAnalyzer
                format_duplication_analysis = format_duplication_analysis
            
            self.log_import("analyzer.duplication_unified", True)
            return ImportResult(has_module=True, module=DuplicationModule())
            
        except ImportError as e:
            self.log_import("analyzer.duplication_unified", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
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
        """Import core analyzer components."""
        try:
            from analyzer.ast_engine.core_analyzer import ConnascenceDetector
            from analyzer.detectors import (
                ConventionDetector,
                ExecutionDetector, 
                MagicLiteralDetector,
                TimingDetector,
                GodObjectDetector,
                AlgorithmDetector,
                PositionDetector,
                ValuesDetector
            )
            
            class AnalyzerComponents:
                ConnascenceDetector = ConnascenceDetector
                ConventionDetector = ConventionDetector
                ExecutionDetector = ExecutionDetector
                MagicLiteralDetector = MagicLiteralDetector
                TimingDetector = TimingDetector
                GodObjectDetector = GodObjectDetector
                AlgorithmDetector = AlgorithmDetector
                PositionDetector = PositionDetector
                ValuesDetector = ValuesDetector
            
            self.log_import("analyzer_components", True)
            return ImportResult(has_module=True, module=AnalyzerComponents())
            
        except ImportError as e:
            self.log_import("analyzer_components", False, str(e))
            return ImportResult(has_module=False, error=str(e))
    
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


# Global import manager instance
IMPORT_MANAGER = UnifiedImportManager()

__all__ = ["IMPORT_MANAGER", "ImportResult", "UnifiedImportManager"]
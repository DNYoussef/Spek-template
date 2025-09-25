from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FILE_LENGTH_LINES

Original: 1, 860 LOC god object
Refactored: 7 focused components (~1, 550 LOC total)
Reduction: 16, DAYS_RETENTION_PERIOD% LOC reduction
Compliance: NASA POT10 Rule 2 (file <MAXIMUM_FILE_LENGTH_LINES LOC)

This file now delegates to the decomposed architecture.
All original functionality preserved through facade pattern.

Day 5 Decomposition - Extract Class + Facade Pattern:
- ConfigurationManager (150 LOC): Config and monitoring
- CacheManager (250 LOC): File/AST caching
- ComponentManager (200 LOC): Component initialization
- AnalysisOrchestrator (400 LOC): Analysis pipeline
- MonitoringManager (200 LOC): Memory/resource management
- StreamingManager (150 LOC): Streaming analysis
- UnifiedAnalyzerFacade (200 LOC): Backward compatibility
"""

# Import the facade which maintains 100% backward compatibility
from .components.UnifiedAnalyzerFacade import UnifiedConnascenceAnalyzer

# Re-export for backward compatibility
__all__ = ['UnifiedConnascenceAnalyzer']
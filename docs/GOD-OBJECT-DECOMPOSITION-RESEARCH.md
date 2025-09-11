# God Object Decomposition Strategies for Analyzer System

## Executive Summary

Analysis of the codebase reveals 30+ god objects with the largest being:

1. **UnifiedConnascenceAnalyzer** (2,323 LOC) - Central orchestrator with multiple responsibilities
2. **ConnascenceDetector** (977 LOC) - AST visitor with detection and analysis responsibilities  
3. **ConnascenceAnalyzer** (781 LOC) - Analysis coordination and reporting
4. **ContextAnalyzer** (603 LOC) - Context classification and domain analysis

**Goal**: Reduce god objects to <=20 while maintaining functionality and improving maintainability.

---

## Primary Target Analysis

### 1. UnifiedConnascenceAnalyzer (2,323 LOC)

**Current Responsibilities** (violates SRP):
- Analysis orchestration
- Component initialization
- Streaming coordination
- Batch processing
- Report generation
- Error handling
- Cache management
- Configuration management
- Performance monitoring
- Resource management

**Decomposition Strategy - Command Pattern + Pipeline Architecture**:

```python
# Core orchestrator (reduced to ~200 LOC)
class AnalysisOrchestrator:
    def __init__(self, config_manager: ConfigManager, component_factory: ComponentFactory):
        self.config = config_manager
        self.factory = component_factory
        self.pipeline = AnalysisPipeline()
    
    def analyze_project(self, path: Path, mode: str) -> AnalysisResult:
        pipeline = self._build_pipeline(mode)
        return pipeline.execute(path)

# Specialized analysis modes (150-200 LOC each)
class BatchAnalysisMode:
    """Handles batch processing logic"""
    def execute(self, context: AnalysisContext) -> BatchResult: ...

class StreamingAnalysisMode:
    """Handles streaming/incremental processing"""
    def execute(self, context: AnalysisContext) -> StreamResult: ...

class HybridAnalysisMode:
    """Combines batch + streaming approaches"""
    def execute(self, context: AnalysisContext) -> HybridResult: ...

# Pipeline pattern for analysis phases
class AnalysisPipeline:
    def __init__(self):
        self.phases: List[AnalysisPhase] = []
    
    def add_phase(self, phase: AnalysisPhase) -> 'AnalysisPipeline':
        self.phases.append(phase)
        return self
    
    def execute(self, context: AnalysisContext) -> PipelineResult:
        for phase in self.phases:
            context = phase.execute(context)
        return context.result

# Individual analysis phases (100-150 LOC each)
class ASTAnalysisPhase(AnalysisPhase):
    """Phase 1-2: Core AST analysis"""
    def execute(self, context: AnalysisContext) -> AnalysisContext: ...

class DuplicationPhase(AnalysisPhase):  
    """Phase 3-4: MECE duplication analysis"""
    def execute(self, context: AnalysisContext) -> AnalysisContext: ...

class NASACompliancePhase(AnalysisPhase):
    """Phase 5: NASA Power of Ten compliance"""
    def execute(self, context: AnalysisContext) -> AnalysisContext: ...

class IntegrationPhase(AnalysisPhase):
    """Phase 6: Smart integration and correlation"""
    def execute(self, context: AnalysisContext) -> AnalysisContext: ...
```

**Expected Reduction**: 2,323 -> 1,200 LOC total (8 focused classes, ~150 LOC average)

### 2. ConnascenceDetector (977 LOC)

**Current Responsibilities** (violates SRP):
- AST traversal
- Multiple violation type detection
- Context analysis
- Result aggregation
- Error handling
- Legacy compatibility

**Decomposition Strategy - Visitor Pattern Specialization**:

```python
# Base visitor coordinator (reduced to ~150 LOC)
class ConnascenceDetectorCoordinator(ast.NodeVisitor):
    def __init__(self, file_path: str, source_lines: List[str]):
        self.visitors = self._create_specialized_visitors(file_path, source_lines)
        self.aggregator = ViolationAggregator()
    
    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        for visitor in self.visitors:
            self.visit(tree)  # Delegates to specialized visitors
            self.aggregator.merge_violations(visitor.get_violations())
        return self.aggregator.get_consolidated_violations()

# Specialized visitors (100-150 LOC each)
class NameConnascenceVisitor(ast.NodeVisitor):
    """Detects Name and Type connascence violations"""
    def visit_Name(self, node): ...
    def visit_FunctionDef(self, node): ...
    def visit_ClassDef(self, node): ...

class PositionConnascenceVisitor(ast.NodeVisitor):
    """Detects Position connascence in function calls"""
    def visit_Call(self, node): ...
    def visit_FunctionDef(self, node): ...

class MagicValueVisitor(ast.NodeVisitor):
    """Detects Meaning connascence (magic literals)"""
    def visit_Constant(self, node): ...
    def _analyze_context(self, node): ...

class AlgorithmVisitor(ast.NodeVisitor):
    """Detects Algorithm connascence (duplicated logic)"""
    def visit_FunctionDef(self, node): ...
    def _normalize_algorithm(self, node): ...

class ExecutionConnascenceVisitor(ast.NodeVisitor):
    """Detects dynamic execution patterns"""
    def visit_Call(self, node): ...
    def visit_If(self, node): ...

# Result aggregation (100 LOC)
class ViolationAggregator:
    """Aggregates and deduplicates violations from multiple visitors"""
    def merge_violations(self, violations: List[ConnascenceViolation]): ...
    def deduplicate(self): ...
    def prioritize_by_severity(self): ...
```

**Expected Reduction**: 977 -> 900 LOC total (7 focused classes, ~130 LOC average)

### 3. ConnascenceAnalyzer (781 LOC)

**Current Responsibilities** (violates SRP):
- File discovery and processing
- Analysis coordination
- Result formatting
- Performance optimization
- Caching integration
- Error handling

**Decomposition Strategy - Service Layer Architecture**:

```python
# Main analyzer service (reduced to ~200 LOC)
class ConnascenceAnalyzerService:
    def __init__(self, config: AnalysisConfig):
        self.file_service = FileDiscoveryService(config)
        self.detector_service = DetectorService(config)
        self.result_service = ResultProcessingService(config)
        self.cache_service = CacheService(config) if config.use_cache else None
    
    def analyze_file(self, file_path: Path) -> List[ConnascenceViolation]:
        if self.cache_service and self.cache_service.is_cached(file_path):
            return self.cache_service.get_cached_result(file_path)
        
        result = self.detector_service.detect_violations(file_path)
        if self.cache_service:
            self.cache_service.cache_result(file_path, result)
        return result

# Specialized services (100-150 LOC each)
class FileDiscoveryService:
    """Handles file discovery, filtering, and validation"""
    def discover_python_files(self, path: Path) -> List[Path]: ...
    def should_exclude_file(self, file_path: Path) -> bool: ...

class DetectorService:
    """Coordinates detection using factory pattern"""
    def __init__(self, config: AnalysisConfig):
        self.factory = DetectorFactory(config)
    
    def detect_violations(self, file_path: Path) -> List[ConnascenceViolation]:
        detector = self.factory.create_detector(file_path)
        return detector.detect_violations()

class ResultProcessingService:
    """Handles result aggregation, filtering, and formatting"""
    def aggregate_results(self, results: List[List[ConnascenceViolation]]) -> AnalysisResult: ...
    def filter_by_severity(self, violations: List[ConnascenceViolation], min_severity: str): ...

class CacheService:
    """Handles caching logic with optimization features"""
    def is_cached(self, file_path: Path) -> bool: ...
    def get_cached_result(self, file_path: Path) -> List[ConnascenceViolation]: ...
    def cache_result(self, file_path: Path, result: List[ConnascenceViolation]): ...
```

**Expected Reduction**: 781 -> 650 LOC total (5 focused classes, ~130 LOC average)

---

## Decomposition Patterns by Responsibility

### 1. Single Responsibility Principle Application

**Pattern: Extract Service Classes**

Current god objects mix multiple concerns:
- Configuration management + analysis logic
- AST traversal + violation detection + reporting
- File I/O + caching + result processing

**Solution**: Create focused service classes

```python
# Configuration responsibility
class AnalysisConfigManager:
    """Manages configuration loading, validation, and policy resolution"""
    def load_config(self, path: Path) -> AnalysisConfig: ...
    def resolve_policy(self, policy_name: str) -> PolicyConfig: ...

# File handling responsibility  
class SourceFileManager:
    """Manages source file discovery, reading, and preprocessing"""
    def discover_files(self, path: Path, patterns: List[str]) -> List[Path]: ...
    def read_source_with_cache(self, file_path: Path) -> SourceFile: ...

# Analysis coordination responsibility
class AnalysisCoordinator:
    """Coordinates analysis phases without performing analysis itself"""
    def coordinate_analysis(self, files: List[Path], config: AnalysisConfig) -> AnalysisResult: ...
```

### 2. Visitor Pattern Decomposition

**Pattern: Specialized Visitors with Composition**

Instead of one large visitor handling all AST node types:

```python
# Visitor composition coordinator
class CompositeASTVisitor:
    def __init__(self, visitors: List[SpecializedVisitor]):
        self.visitors = visitors
    
    def visit_tree(self, tree: ast.AST) -> CombinedResult:
        results = []
        for visitor in self.visitors:
            visitor.visit(tree)
            results.append(visitor.get_result())
        return self._combine_results(results)

# Specialized visitors for specific responsibilities
class ClassStructureVisitor(ast.NodeVisitor):
    """Only handles class-related analysis"""
    def visit_ClassDef(self, node): ...
    def visit_FunctionDef(self, node): ...  # Only methods

class ImportAnalysisVisitor(ast.NodeVisitor):
    """Only handles import-related connascence"""
    def visit_Import(self, node): ...
    def visit_ImportFrom(self, node): ...

class LiteralAnalysisVisitor(ast.NodeVisitor):
    """Only handles magic literals and constants"""
    def visit_Constant(self, node): ...
    def visit_Num(self, node): ...  # Backward compatibility
```

### 3. Factory Pattern Splitting

**Pattern: Specialized Factory Hierarchies**

Current factory methods are embedded in god objects:

```python
# Abstract factory for detector creation
class DetectorFactory(ABC):
    @abstractmethod
    def create_connascence_detector(self, file_context: FileContext) -> ConnascenceDetector: ...
    @abstractmethod  
    def create_duplication_detector(self, file_context: FileContext) -> DuplicationDetector: ...

# Concrete factories for different contexts
class StandardDetectorFactory(DetectorFactory):
    """Factory for standard analysis context"""
    def create_connascence_detector(self, file_context: FileContext) -> StandardConnascenceDetector: ...

class PerformanceOptimizedFactory(DetectorFactory):
    """Factory with detector pooling and caching"""
    def create_connascence_detector(self, file_context: FileContext) -> PooledConnascenceDetector: ...

class StreamingAnalysisFactory(DetectorFactory):  
    """Factory for incremental/streaming analysis"""
    def create_connascence_detector(self, file_context: FileContext) -> IncrementalConnascenceDetector: ...
```

### 4. Interface Segregation Strategies

**Pattern: Client-Specific Interfaces**

Replace fat interfaces with focused ones:

```python
# Current: Fat interface
class ConnascenceAnalyzer:  # Used by CLI, API, IDE plugins, CI/CD
    def analyze_project(self): ...
    def analyze_file(self): ...
    def get_metrics(self): ...
    def generate_report(self): ...
    def configure_thresholds(self): ...
    def stream_analysis(self): ...

# Solution: Client-specific interfaces
class CLIAnalyzer(Protocol):
    """Interface for command-line usage"""
    def analyze_project_cli(self, args: CLIArgs) -> CLIResult: ...
    def generate_cli_report(self, result: AnalysisResult) -> str: ...

class APIAnalyzer(Protocol):
    """Interface for REST API usage"""
    def analyze_project_api(self, request: APIRequest) -> APIResponse: ...
    def get_analysis_status(self, job_id: str) -> JobStatus: ...

class IDEAnalyzer(Protocol):
    """Interface for IDE integration"""
    def analyze_file_incremental(self, file_path: Path, changes: List[Change]) -> List[Diagnostic]: ...
    def get_quick_fixes(self, violation: Violation) -> List[QuickFix]: ...

# Adapter pattern for backward compatibility
class UnifiedAnalyzerAdapter:
    """Maintains backward compatibility while delegating to specialized implementations"""
    def __init__(self):
        self.cli_analyzer = CLIAnalyzerImpl()
        self.api_analyzer = APIAnalyzerImpl()
        self.ide_analyzer = IDEAnalyzerImpl()
    
    def analyze_project(self, **kwargs):
        # Route to appropriate implementation based on context
        if 'cli_args' in kwargs:
            return self.cli_analyzer.analyze_project_cli(kwargs['cli_args'])
        # ... other routing logic
```

### 5. Orchestrator Decomposition

**Pattern: Pipeline + Command + Mediator**

Transform monolithic orchestrators into composable pipelines:

```python
# Command pattern for individual operations
class AnalysisCommand(ABC):
    @abstractmethod
    def execute(self, context: AnalysisContext) -> CommandResult: ...

class ConnascenceAnalysisCommand(AnalysisCommand):
    def execute(self, context: AnalysisContext) -> CommandResult:
        # Focused on just connascence analysis
        ...

class DuplicationAnalysisCommand(AnalysisCommand):
    def execute(self, context: AnalysisContext) -> CommandResult:
        # Focused on just duplication detection
        ...

# Pipeline orchestrator (minimal coordination logic)
class AnalysisPipeline:
    def __init__(self):
        self.commands: List[AnalysisCommand] = []
    
    def add_command(self, command: AnalysisCommand) -> 'AnalysisPipeline':
        self.commands.append(command)
        return self
    
    def execute(self, initial_context: AnalysisContext) -> PipelineResult:
        context = initial_context
        for command in self.commands:
            result = command.execute(context)
            context = context.with_result(result)
        return context.final_result

# Mediator for command coordination
class AnalysisMediator:
    """Handles complex coordination between commands without tight coupling"""
    def coordinate_parallel_analysis(self, commands: List[AnalysisCommand], context: AnalysisContext): ...
    def handle_command_dependencies(self, command: AnalysisCommand, prerequisites: List[CommandResult]): ...
```

### 6. Context-Aware Decomposition

**Pattern: Domain-Specific Analyzers**

Your ContextAnalyzer already has good domain classification. Leverage this for specialized analyzers:

```python
# Domain-specific analyzer implementations
class ConfigClassAnalyzer:
    """Specialized analysis for configuration classes (higher LOC tolerance)"""
    def __init__(self):
        self.threshold_adjuster = ConfigContextThresholds()
        self.pattern_detector = ConfigPatternDetector()
    
    def analyze_class(self, class_node: ast.ClassDef, context: ClassAnalysis) -> ConfigAnalysisResult:
        # Apply config-specific rules and thresholds
        adjusted_thresholds = self.threshold_adjuster.get_thresholds(context)
        patterns = self.pattern_detector.detect_config_patterns(class_node)
        return ConfigAnalysisResult(patterns, adjusted_thresholds)

class APIControllerAnalyzer:
    """Specialized analysis for API controllers (method count tolerance)"""
    def analyze_class(self, class_node: ast.ClassDef, context: ClassAnalysis) -> ControllerAnalysisResult: ...

class DataModelAnalyzer:
    """Specialized analysis for data models (stricter cohesion requirements)"""
    def analyze_class(self, class_node: ast.ClassDef, context: ClassAnalysis) -> ModelAnalysisResult: ...

# Context-driven analyzer factory
class ContextAwareAnalyzerFactory:
    def create_analyzer(self, context: ClassContext) -> ContextSpecificAnalyzer:
        analyzers = {
            ClassContext.CONFIG: ConfigClassAnalyzer(),
            ClassContext.API_CONTROLLER: APIControllerAnalyzer(),
            ClassContext.DATA_MODEL: DataModelAnalyzer(),
            ClassContext.BUSINESS_LOGIC: BusinessLogicAnalyzer(),
            ClassContext.UTILITY: UtilityAnalyzer()
        }
        return analyzers.get(context, DefaultAnalyzer())
```

---

## Step-by-Step Refactoring Approach

### Phase 1: Extract Service Layers (Weeks 1-2)

1. **Extract Configuration Management**
   ```python
   # From UnifiedConnascenceAnalyzer
   class AnalysisConfigurationService:
       def load_configuration(self, config_path: Optional[str]) -> AnalysisConfig: ...
       def resolve_policy_preset(self, preset: str) -> PolicyConfig: ...
       def validate_configuration(self, config: AnalysisConfig) -> ValidationResult: ...
   ```

2. **Extract File Processing Services**  
   ```python
   class FileProcessingService:
       def discover_source_files(self, path: Path, exclusions: List[str]) -> List[Path]: ...
       def prepare_file_context(self, file_path: Path) -> FileContext: ...
       def batch_process_files(self, files: List[Path]) -> BatchResult: ...
   ```

3. **Extract Result Management**
   ```python
   class ResultManagementService:
       def aggregate_violations(self, results: List[AnalysisResult]) -> AggregatedResult: ...
       def calculate_metrics(self, violations: List[ConnascenceViolation]) -> QualityMetrics: ...
       def generate_recommendations(self, analysis: AggregatedResult) -> List[Recommendation]: ...
   ```

### Phase 2: Decompose AST Visitors (Weeks 3-4)

1. **Split ConnascenceDetector by Violation Type**
   ```python
   # Extract specialized visitors
   class StaticConnascenceVisitor(ast.NodeVisitor):
       """Handles Name, Type, Meaning, Position violations"""
       def visit_Name(self, node): ...
       def visit_FunctionDef(self, node): ...
       
   class DynamicConnascenceVisitor(ast.NodeVisitor):
       """Handles Execution, Timing, Values, Identity violations"""  
       def visit_Call(self, node): ...
       def visit_If(self, node): ...
   ```

2. **Create Visitor Composition Framework**
   ```python
   class ConnascenceVisitorCoordinator:
       def __init__(self, file_path: str, source_lines: List[str]):
           self.static_visitor = StaticConnascenceVisitor(file_path, source_lines)
           self.dynamic_visitor = DynamicConnascenceVisitor(file_path, source_lines)
           self.algorithm_visitor = AlgorithmConnascenceVisitor(file_path, source_lines)
       
       def analyze_tree(self, tree: ast.AST) -> List[ConnascenceViolation]:
           # Coordinate multiple visitors
           all_violations = []
           for visitor in [self.static_visitor, self.dynamic_visitor, self.algorithm_visitor]:
               visitor.visit(tree)
               all_violations.extend(visitor.get_violations())
           return self._deduplicate_violations(all_violations)
   ```

### Phase 3: Implement Pipeline Architecture (Weeks 5-6)

1. **Create Analysis Pipeline**
   ```python
   class AnalysisPipeline:
       def __init__(self, config: AnalysisConfig):
           self.phases = self._build_phases(config)
       
       def _build_phases(self, config: AnalysisConfig) -> List[AnalysisPhase]:
           phases = [
               ConnascenceAnalysisPhase(config.connascence_config),
               DuplicationAnalysisPhase(config.duplication_config),
               NASACompliancePhase(config.nasa_config),
               IntegrationPhase(config.integration_config)
           ]
           return [phase for phase in phases if phase.is_enabled()]
       
       def execute(self, context: AnalysisContext) -> PipelineResult:
           for phase in self.phases:
               context = phase.process(context)
           return context.result
   ```

2. **Implement Specialized Analysis Modes**
   ```python
   class BatchAnalysisMode:
       def execute(self, project_path: Path, config: AnalysisConfig) -> BatchResult:
           pipeline = AnalysisPipeline(config)
           context = AnalysisContext.from_project(project_path)
           return pipeline.execute(context)
           
   class StreamingAnalysisMode:
       def __init__(self, config: AnalysisConfig):
           self.incremental_cache = IncrementalCache(config.cache_config)
           self.file_watcher = FileWatcher(config.watch_config)
           
       def start_streaming(self, project_path: Path) -> StreamSession:
           # Implement incremental analysis with file watching
           ...
   ```

### Phase 4: Context-Aware Specialization (Weeks 7-8)

1. **Implement Domain-Specific Analyzers**
   ```python
   class DomainAnalyzerRegistry:
       def __init__(self):
           self._analyzers = {
               ClassContext.CONFIG: ConfigurationClassAnalyzer(),
               ClassContext.API_CONTROLLER: APIControllerAnalyzer(),
               ClassContext.DATA_MODEL: DataModelAnalyzer(),
               ClassContext.BUSINESS_LOGIC: BusinessLogicAnalyzer(),
               ClassContext.UTILITY: UtilityClassAnalyzer()
           }
       
       def get_analyzer(self, context: ClassContext) -> DomainSpecificAnalyzer:
           return self._analyzers.get(context, DefaultClassAnalyzer())
   ```

2. **Integrate Context-Aware Thresholds**
   ```python
   class ContextualThresholdManager:
       def get_god_object_threshold(self, context: ClassContext) -> int:
           thresholds = {
               ClassContext.CONFIG: 800,  # Config classes can be larger
               ClassContext.API_CONTROLLER: 600,  # Controllers have many endpoints
               ClassContext.DATA_MODEL: 400,  # Models should be focused
               ClassContext.BUSINESS_LOGIC: 500,  # Business logic moderate complexity
               ClassContext.UTILITY: 300  # Utilities should be small and focused
           }
           return thresholds.get(context, 400)  # Default threshold
   ```

---

## Expected Impact Assessment

### Quantitative Improvements

**Before Refactoring**:
- 30+ god objects (>400 LOC each)
- Largest class: 2,323 LOC
- Average god object size: ~650 LOC
- Total god object LOC: ~19,500

**After Refactoring** (Target):
- <=20 god objects (>400 LOC each)  
- Largest class: ~800 LOC (context-appropriate)
- Average class size: ~200 LOC
- 60+ focused classes replacing god objects
- Total LOC: Similar (~20,000) but better distributed

### Qualitative Improvements

1. **Single Responsibility Adherence**
   - Each class has one clear purpose
   - Easier to understand and modify
   - Reduced cognitive load

2. **Improved Testability**
   - Smaller, focused classes easier to unit test
   - Better test coverage possible
   - More precise test failure diagnosis

3. **Enhanced Maintainability**
   - Changes isolated to specific responsibilities
   - Reduced ripple effects from modifications
   - Easier to add new features

4. **Better Performance Characteristics**
   - Smaller objects with focused memory usage
   - More opportunities for caching and optimization
   - Potential for parallel processing of specialized components

### Maintainability Benefits

1. **Reduced Connascence**
   - Lower coupling between responsibilities
   - Clearer dependency relationships
   - Easier to modify individual components

2. **Improved Cohesion**  
   - Related functionality grouped appropriately
   - Clearer component boundaries
   - More predictable behavior

3. **Enhanced Extensibility**
   - Easier to add new analysis types
   - Plugin architecture possibilities
   - Better support for customization

---

## Implementation Priority Matrix

### High Priority (Immediate Impact)
1. **UnifiedConnascenceAnalyzer** - Extract service layers and pipeline architecture
2. **ConnascenceDetector** - Split into specialized visitors
3. **ConnascenceAnalyzer** - Service layer decomposition

### Medium Priority (Architectural Improvement)
4. **Core.py analysis logic** - Extract configuration and orchestration
5. **Context-aware analyzers** - Domain-specific specialization
6. **Factory pattern refinement** - Specialized factory hierarchies

### Low Priority (Quality of Life)
7. **Interface segregation** - Client-specific interfaces
8. **Performance optimizations** - Detector pooling and caching
9. **Legacy compatibility** - Adapter pattern implementation

---

## Risk Mitigation Strategies

### 1. Backward Compatibility
- Implement adapter pattern to maintain existing APIs
- Gradual migration approach with parallel implementations  
- Comprehensive regression testing

### 2. Performance Impact
- Benchmark before/after decomposition
- Monitor object creation overhead
- Optimize hot paths and frequently used components

### 3. Complexity Management
- Clear documentation of new component relationships
- Architectural decision records (ADRs)
- Team training on new patterns

### 4. Testing Strategy
- Unit tests for individual components
- Integration tests for component interactions
- End-to-end tests for full analysis workflows

---

## Success Metrics

### Quantitative Targets
- [ ] Reduce god objects from 30+ to <=20
- [ ] Largest class size <=800 LOC (context-appropriate)
- [ ] Average class size ~200 LOC
- [ ] Test coverage >=90% for new components
- [ ] Performance regression <=10%

### Qualitative Indicators
- [ ] Improved code review velocity
- [ ] Reduced bug introduction rate
- [ ] Faster feature development cycle
- [ ] Better team onboarding experience
- [ ] Higher developer satisfaction scores

This comprehensive decomposition strategy provides a systematic approach to reducing god objects in your analyzer system while maintaining functionality and improving long-term maintainability. The context-aware approach leverages your existing domain classification to ensure appropriate thresholds and analysis strategies for different types of code components.
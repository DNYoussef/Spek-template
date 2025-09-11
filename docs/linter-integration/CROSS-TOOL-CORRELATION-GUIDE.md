# Cross-Tool Correlation Guide
## Advanced Violation Pattern Detection and Mapping

### Overview

This guide provides comprehensive instructions for correlating violations across multiple linter tools and connascence analysis. The correlation system identifies overlapping concerns, eliminates duplicates, and provides unified severity assessment for production code quality analysis.

---

## 1. Correlation Architecture

### 1.1 Correlation Engine Design

```python
class CrossToolCorrelator:
    """
    Advanced correlation engine for multi-tool violation analysis.
    """
    
    def __init__(self, config: CorrelationConfig):
        self.config = config
        self.pattern_matcher = ViolationPatternMatcher()
        self.similarity_calculator = SimilarityCalculator()
        self.deduplicator = ViolationDeduplicator()
        
    def correlate_violations(self, violations: List[UnifiedViolation]) -> CorrelationResult:
        """
        Correlate violations across multiple tools.
        
        Process:
        1. Group violations by location and pattern
        2. Calculate similarity scores
        3. Identify correlation clusters
        4. Apply consolidation rules
        5. Generate correlation metrics
        """
        
        # Group by location proximity
        location_groups = self._group_by_location(violations)
        
        # Calculate pattern similarity
        correlation_clusters = []
        for group in location_groups:
            clusters = self._find_pattern_clusters(group)
            correlation_clusters.extend(clusters)
        
        # Apply consolidation rules
        consolidated = self._consolidate_clusters(correlation_clusters)
        
        # Generate correlation metrics
        metrics = self._calculate_correlation_metrics(consolidated)
        
        return CorrelationResult(
            consolidated_violations=consolidated,
            correlation_metrics=metrics,
            duplicate_count=len(violations) - len(consolidated),
            tool_coverage=self._calculate_tool_coverage(violations)
        )
```

### 1.2 Pattern Matching Framework

```python
class ViolationPatternMatcher:
    """
    Pattern matching for identifying related violations across tools.
    """
    
    PATTERN_TYPES = {
        'MAGIC_LITERALS': {
            'patterns': [
                'magic number',
                'hardcoded value', 
                'literal value',
                'constant value'
            ],
            'tools': ['connascence', 'pylint', 'flake8', 'ruff'],
            'confidence': 0.9
        },
        'TYPE_SAFETY': {
            'patterns': [
                'type error',
                'undefined variable',
                'incompatible type',
                'missing annotation'
            ],
            'tools': ['mypy', 'pylint', 'connascence'],
            'confidence': 0.95
        },
        'SECURITY_ISSUES': {
            'patterns': [
                'sql injection',
                'insecure random',
                'hardcoded password',
                'unsafe yaml'
            ],
            'tools': ['bandit', 'ruff', 'connascence'],
            'confidence': 1.0
        },
        'CODE_COMPLEXITY': {
            'patterns': [
                'too complex',
                'too many branches',
                'cyclomatic complexity',
                'cognitive complexity'
            ],
            'tools': ['pylint', 'ruff', 'connascence'],
            'confidence': 0.8
        },
        'NAMING_CONVENTIONS': {
            'patterns': [
                'invalid name',
                'naming convention',
                'snake_case',
                'camelCase'
            ],
            'tools': ['pylint', 'flake8', 'connascence'],
            'confidence': 0.7
        },
        'DEAD_CODE': {
            'patterns': [
                'unused variable',
                'unused import',
                'unreachable code',
                'dead code'
            ],
            'tools': ['pylint', 'flake8', 'ruff'],
            'confidence': 0.85
        }
    }
    
    def find_pattern_type(self, violation: UnifiedViolation) -> Optional[PatternMatch]:
        """Identify the pattern type for a violation."""
        
        description_lower = violation.description.lower()
        
        for pattern_type, config in self.PATTERN_TYPES.items():
            for pattern in config['patterns']:
                if pattern in description_lower:
                    return PatternMatch(
                        pattern_type=pattern_type,
                        confidence=config['confidence'],
                        matching_pattern=pattern,
                        expected_tools=config['tools']
                    )
        
        return None
```

---

## 2. Similarity Calculation Algorithms

### 2.1 Location-Based Similarity

```python
def calculate_location_similarity(v1: UnifiedViolation, v2: UnifiedViolation) -> float:
    """
    Calculate similarity based on code location.
    
    Factors:
    - Same file: +0.4
    - Same function: +0.3
    - Same line: +0.2
    - Adjacent lines: +0.1
    """
    
    if not (v1.location and v2.location):
        return 0.0
    
    similarity = 0.0
    
    # File similarity
    if v1.location.file == v2.location.file:
        similarity += 0.4
        
        # Function similarity
        if v1.location.function == v2.location.function:
            similarity += 0.3
            
            # Line similarity
            if v1.location.line == v2.location.line:
                similarity += 0.2
            elif abs(v1.location.line - v2.location.line) <= 5:
                similarity += 0.1
    
    return min(similarity, 1.0)
```

### 2.2 Semantic Similarity

```python
def calculate_semantic_similarity(v1: UnifiedViolation, v2: UnifiedViolation) -> float:
    """
    Calculate semantic similarity using NLP techniques.
    
    Uses:
    - TF-IDF vectorization
    - Cosine similarity
    - Domain-specific keyword weights
    """
    
    # Preprocess descriptions
    desc1 = preprocess_description(v1.description)
    desc2 = preprocess_description(v2.description)
    
    # Calculate TF-IDF similarity
    tfidf_similarity = calculate_tfidf_similarity(desc1, desc2)
    
    # Apply domain-specific weights
    domain_weight = get_domain_weight(v1.pattern_type, v2.pattern_type)
    
    # Calculate keyword overlap
    keyword_overlap = calculate_keyword_overlap(desc1, desc2)
    
    return (tfidf_similarity * 0.6 + 
            keyword_overlap * 0.3 + 
            domain_weight * 0.1)
```

### 2.3 Tool Confidence Weighting

```python
def calculate_tool_confidence_weight(violations: List[UnifiedViolation]) -> float:
    """
    Calculate confidence weight based on tool consensus.
    
    Higher confidence when:
    - Multiple tools agree
    - High-confidence tools involved
    - Consistent severity assessment
    """
    
    tool_count = len(set(v.source_tool for v in violations))
    avg_confidence = sum(v.confidence for v in violations) / len(violations)
    
    # Tool consensus bonus
    consensus_bonus = min(tool_count * 0.1, 0.5)
    
    # Confidence penalty for single-tool violations
    single_tool_penalty = 0.2 if tool_count == 1 else 0.0
    
    return min(avg_confidence + consensus_bonus - single_tool_penalty, 1.0)
```

---

## 3. Correlation Patterns and Examples

### 3.1 Magic Literal Correlation Pattern

```python
# Example: Magic number detected by multiple tools
correlations = [
    UnifiedViolation(
        tool='connascence',
        severity='HIGH',
        description='Connascence of Meaning: Magic number 42 used without constant',
        location=Location('src/main.py', line=15)
    ),
    UnifiedViolation(
        tool='pylint',
        severity='W0511',
        description='Used builtin function id. Using id is discouraged',
        location=Location('src/main.py', line=15)
    ),
    UnifiedViolation(
        tool='ruff',
        severity='PLR2004',
        description='Magic value used in comparison, consider replacing with a constant variable',
        location=Location('src/main.py', line=15)
    )
]

# Correlation result
consolidated = CorrelatedViolation(
    pattern_type='MAGIC_LITERALS',
    unified_severity='HIGH',
    confidence=0.92,
    contributing_tools=['connascence', 'pylint', 'ruff'],
    primary_violation=correlations[0],
    supporting_violations=correlations[1:],
    correlation_score=0.88
)
```

### 3.2 Type Safety Correlation Pattern

```python
# Example: Type error detected across type checkers
correlations = [
    UnifiedViolation(
        tool='mypy',
        severity='error',
        description='Incompatible return value type (got "str", expected "int")',
        location=Location('src/utils.py', line=42)
    ),
    UnifiedViolation(
        tool='connascence',
        severity='HIGH',
        description='Connascence of Type: Inconsistent return types',
        location=Location('src/utils.py', line=42)
    ),
    UnifiedViolation(
        tool='pylint',
        severity='E1136',
        description='Value is unsubscriptable',
        location=Location('src/utils.py', line=43)
    )
]
```

### 3.3 Security Issue Correlation Pattern

```python
# Example: Security vulnerability detected by multiple scanners
correlations = [
    UnifiedViolation(
        tool='bandit',
        severity='HIGH',
        description='Use of insecure MD5 hash function',
        location=Location('src/auth.py', line=28)
    ),
    UnifiedViolation(
        tool='connascence',
        severity='CRITICAL',
        description='Connascence of Execution: Insecure cryptographic algorithm',
        location=Location('src/auth.py', line=28)
    ),
    UnifiedViolation(
        tool='ruff',
        severity='S324',
        description='Insecure hash function md5',
        location=Location('src/auth.py', line=28)
    )
]
```

---

## 4. Deduplication Strategies

### 4.1 Exact Duplicate Detection

```python
class ExactDuplicateDetector:
    """Detect exact duplicates based on location and description."""
    
    def find_duplicates(self, violations: List[UnifiedViolation]) -> List[DuplicateGroup]:
        """Find exact duplicates using location and normalized description."""
        
        duplicates = defaultdict(list)
        
        for violation in violations:
            key = self._generate_duplicate_key(violation)
            duplicates[key].append(violation)
        
        return [DuplicateGroup(violations=group) 
                for group in duplicates.values() 
                if len(group) > 1]
    
    def _generate_duplicate_key(self, violation: UnifiedViolation) -> str:
        """Generate key for duplicate detection."""
        return f"{violation.location.file}:{violation.location.line}:{self._normalize_description(violation.description)}"
    
    def _normalize_description(self, description: str) -> str:
        """Normalize description for comparison."""
        # Remove tool-specific prefixes
        normalized = re.sub(r'^[A-Z]\d+:', '', description)
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        # Convert to lowercase
        return normalized.lower()
```

### 4.2 Fuzzy Duplicate Detection

```python
class FuzzyDuplicateDetector:
    """Detect similar violations that may be duplicates."""
    
    def __init__(self, similarity_threshold: float = 0.8):
        self.similarity_threshold = similarity_threshold
        
    def find_fuzzy_duplicates(self, violations: List[UnifiedViolation]) -> List[DuplicateGroup]:
        """Find similar violations using fuzzy matching."""
        
        groups = []
        processed = set()
        
        for i, violation in enumerate(violations):
            if i in processed:
                continue
                
            group = [violation]
            processed.add(i)
            
            for j, other_violation in enumerate(violations[i+1:], i+1):
                if j in processed:
                    continue
                    
                similarity = self._calculate_similarity(violation, other_violation)
                if similarity >= self.similarity_threshold:
                    group.append(other_violation)
                    processed.add(j)
            
            if len(group) > 1:
                groups.append(DuplicateGroup(violations=group, similarity=similarity))
        
        return groups
    
    def _calculate_similarity(self, v1: UnifiedViolation, v2: UnifiedViolation) -> float:
        """Calculate overall similarity between two violations."""
        
        location_sim = calculate_location_similarity(v1, v2)
        semantic_sim = calculate_semantic_similarity(v1, v2)
        pattern_sim = self._calculate_pattern_similarity(v1, v2)
        
        return (location_sim * 0.4 + 
                semantic_sim * 0.4 + 
                pattern_sim * 0.2)
```

---

## 5. Consolidation Rules

### 5.1 Priority-Based Consolidation

```python
class PriorityConsolidator:
    """Consolidate correlated violations based on priority rules."""
    
    TOOL_PRIORITY = {
        'bandit': 10,      # Security scanner - highest priority
        'mypy': 9,         # Type checker - very high priority
        'connascence': 8,  # Architectural analysis - high priority
        'pylint': 7,       # Comprehensive linter - medium-high priority
        'ruff': 6,         # Fast linter - medium priority
        'flake8': 5,       # Style checker - medium-low priority
        'eslint': 4        # JavaScript linter - context dependent
    }
    
    def consolidate(self, correlation_cluster: CorrelationCluster) -> ConsolidatedViolation:
        """Consolidate a cluster of correlated violations."""
        
        violations = correlation_cluster.violations
        
        # Select primary violation based on priority
        primary = self._select_primary_violation(violations)
        
        # Calculate consolidated severity
        consolidated_severity = self._calculate_consolidated_severity(violations)
        
        # Generate unified description
        unified_description = self._generate_unified_description(violations)
        
        # Calculate confidence score
        confidence = calculate_tool_confidence_weight(violations)
        
        return ConsolidatedViolation(
            id=f"consolidated_{primary.id}",
            primary_violation=primary,
            supporting_violations=[v for v in violations if v != primary],
            severity=consolidated_severity,
            description=unified_description,
            confidence=confidence,
            correlation_score=correlation_cluster.similarity,
            tools_involved=[v.source_tool for v in violations]
        )
    
    def _select_primary_violation(self, violations: List[UnifiedViolation]) -> UnifiedViolation:
        """Select the primary violation based on tool priority and severity."""
        
        def priority_score(violation):
            tool_priority = self.TOOL_PRIORITY.get(violation.source_tool, 1)
            severity_weight = get_severity_weight(violation.severity)
            return tool_priority * severity_weight
        
        return max(violations, key=priority_score)
```

### 5.2 Consensus-Based Consolidation

```python
class ConsensusConsolidator:
    """Consolidate violations based on tool consensus."""
    
    def consolidate(self, correlation_cluster: CorrelationCluster) -> ConsolidatedViolation:
        """Consolidate using weighted consensus approach."""
        
        violations = correlation_cluster.violations
        
        # Calculate consensus severity
        consensus_severity = self._calculate_consensus_severity(violations)
        
        # Generate consensus description
        consensus_description = self._generate_consensus_description(violations)
        
        # Calculate consensus confidence
        confidence = self._calculate_consensus_confidence(violations)
        
        return ConsolidatedViolation(
            id=f"consensus_{hash(str(violations))}",
            consensus_severity=consensus_severity,
            description=consensus_description,
            confidence=confidence,
            participating_violations=violations,
            consensus_method='weighted_average'
        )
    
    def _calculate_consensus_severity(self, violations: List[UnifiedViolation]) -> str:
        """Calculate severity using weighted consensus."""
        
        severity_weights = {'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFO': 0}
        reverse_weights = {v: k for k, v in severity_weights.items()}
        
        weighted_sum = 0
        total_weight = 0
        
        for violation in violations:
            tool_weight = self._get_tool_weight(violation.source_tool)
            severity_value = severity_weights.get(violation.severity, 1)
            confidence_weight = violation.confidence
            
            weight = tool_weight * confidence_weight
            weighted_sum += severity_value * weight
            total_weight += weight
        
        if total_weight == 0:
            return 'MEDIUM'
        
        consensus_value = round(weighted_sum / total_weight)
        return reverse_weights.get(consensus_value, 'MEDIUM')
```

---

## 6. Correlation Metrics and Reporting

### 6.1 Correlation Quality Metrics

```python
class CorrelationMetrics:
    """Calculate quality metrics for correlation analysis."""
    
    def calculate_metrics(self, original_violations: List[UnifiedViolation], 
                         correlated_result: CorrelationResult) -> CorrelationQualityReport:
        """Calculate comprehensive correlation quality metrics."""
        
        return CorrelationQualityReport(
            # Reduction metrics
            original_count=len(original_violations),
            consolidated_count=len(correlated_result.consolidated_violations),
            reduction_percentage=self._calculate_reduction_percentage(original_violations, correlated_result),
            
            # Quality metrics
            correlation_accuracy=self._calculate_correlation_accuracy(correlated_result),
            false_positive_rate=self._estimate_false_positive_rate(correlated_result),
            coverage_completeness=self._calculate_coverage_completeness(original_violations, correlated_result),
            
            # Tool consensus metrics
            multi_tool_violations=self._count_multi_tool_violations(correlated_result),
            single_tool_violations=self._count_single_tool_violations(correlated_result),
            consensus_strength=self._calculate_consensus_strength(correlated_result),
            
            # Pattern distribution
            pattern_distribution=self._analyze_pattern_distribution(correlated_result),
            tool_coverage=self._analyze_tool_coverage(original_violations, correlated_result)
        )
    
    def _calculate_correlation_accuracy(self, result: CorrelationResult) -> float:
        """Estimate correlation accuracy based on confidence scores."""
        
        if not result.consolidated_violations:
            return 0.0
        
        total_confidence = sum(v.confidence for v in result.consolidated_violations)
        return total_confidence / len(result.consolidated_violations)
    
    def _calculate_consensus_strength(self, result: CorrelationResult) -> float:
        """Calculate strength of tool consensus."""
        
        multi_tool_count = sum(1 for v in result.consolidated_violations 
                              if len(v.tools_involved) > 1)
        
        if not result.consolidated_violations:
            return 0.0
        
        return multi_tool_count / len(result.consolidated_violations)
```

### 6.2 Correlation Report Generation

```python
def generate_correlation_report(metrics: CorrelationQualityReport, 
                              result: CorrelationResult) -> str:
    """Generate comprehensive correlation analysis report."""
    
    report = f"""
# Cross-Tool Correlation Analysis Report

## Summary
- **Original Violations**: {metrics.original_count}
- **Consolidated Violations**: {metrics.consolidated_count}  
- **Reduction**: {metrics.reduction_percentage:.1f}%
- **Correlation Accuracy**: {metrics.correlation_accuracy:.2f}
- **Consensus Strength**: {metrics.consensus_strength:.2f}

## Tool Coverage Analysis
{_format_tool_coverage(metrics.tool_coverage)}

## Pattern Distribution
{_format_pattern_distribution(metrics.pattern_distribution)}

## High-Confidence Correlations
{_format_high_confidence_correlations(result)}

## Recommendations
{_generate_correlation_recommendations(metrics, result)}
"""
    
    return report

def _format_high_confidence_correlations(result: CorrelationResult) -> str:
    """Format high-confidence correlation details."""
    
    high_confidence = [v for v in result.consolidated_violations 
                      if v.confidence >= 0.8]
    
    if not high_confidence:
        return "No high-confidence correlations found."
    
    formatted = []
    for violation in high_confidence:
        formatted.append(f"""
### {violation.pattern_type} - Confidence: {violation.confidence:.2f}
- **Location**: {violation.location}
- **Severity**: {violation.severity}
- **Tools**: {', '.join(violation.tools_involved)}
- **Description**: {violation.description}
""")
    
    return '\n'.join(formatted)
```

---

## 7. Performance Optimization

### 7.1 Clustering Optimization

```python
class OptimizedCorrelationEngine:
    """Performance-optimized correlation engine for large violation sets."""
    
    def __init__(self, config: CorrelationConfig):
        self.config = config
        self.spatial_index = SpatialIndex()  # For location-based clustering
        self.text_index = TextIndex()        # For semantic similarity
        
    def correlate_violations_optimized(self, violations: List[UnifiedViolation]) -> CorrelationResult:
        """Optimized correlation using spatial and text indexing."""
        
        # Build spatial index for location-based clustering
        self.spatial_index.build_index(violations)
        
        # Build text index for semantic similarity
        self.text_index.build_index([v.description for v in violations])
        
        # Use spatial clustering to reduce search space
        spatial_clusters = self.spatial_index.find_clusters(proximity_threshold=10)
        
        correlation_clusters = []
        for cluster in spatial_clusters:
            # Apply semantic clustering within spatial clusters
            semantic_clusters = self._cluster_semantically(cluster)
            correlation_clusters.extend(semantic_clusters)
        
        # Consolidate clusters
        consolidated = self._consolidate_clusters(correlation_clusters)
        
        return CorrelationResult(
            consolidated_violations=consolidated,
            processing_time=time.time() - start_time,
            optimization_stats=self._get_optimization_stats()
        )
```

### 7.2 Caching Strategy

```python
class CorrelationCache:
    """Intelligent caching for correlation results."""
    
    def __init__(self):
        self.similarity_cache = LRUCache(maxsize=10000)
        self.pattern_cache = LRUCache(maxsize=5000)
        self.consolidation_cache = LRUCache(maxsize=1000)
    
    def get_cached_similarity(self, v1: UnifiedViolation, v2: UnifiedViolation) -> Optional[float]:
        """Get cached similarity score."""
        key = self._generate_similarity_key(v1, v2)
        return self.similarity_cache.get(key)
    
    def cache_similarity(self, v1: UnifiedViolation, v2: UnifiedViolation, similarity: float):
        """Cache similarity score."""
        key = self._generate_similarity_key(v1, v2)
        self.similarity_cache[key] = similarity
    
    def _generate_similarity_key(self, v1: UnifiedViolation, v2: UnifiedViolation) -> str:
        """Generate cache key for similarity calculation."""
        # Sort to ensure consistent key regardless of order
        ids = sorted([v1.id, v2.id])
        return f"sim_{ids[0]}_{ids[1]}"
```

---

## 8. Integration Examples

### 8.1 CI/CD Pipeline Integration

```python
# GitHub Actions workflow integration
def integrate_with_github_actions():
    """Example integration with GitHub Actions CI/CD pipeline."""
    
    # Read violations from multiple tool outputs
    violations = []
    
    # Load flake8 results
    if os.path.exists('flake8-results.json'):
        violations.extend(parse_flake8_results('flake8-results.json'))
    
    # Load pylint results
    if os.path.exists('pylint-results.json'):
        violations.extend(parse_pylint_results('pylint-results.json'))
    
    # Load bandit results
    if os.path.exists('bandit-results.json'):
        violations.extend(parse_bandit_results('bandit-results.json'))
    
    # Load connascence analysis results
    if os.path.exists('connascence-results.json'):
        violations.extend(parse_connascence_results('connascence-results.json'))
    
    # Perform correlation analysis
    correlator = CrossToolCorrelator(CorrelationConfig())
    result = correlator.correlate_violations(violations)
    
    # Generate consolidated report
    report = generate_correlation_report(result.metrics, result)
    
    # Save consolidated results
    with open('consolidated-violations.json', 'w') as f:
        json.dump(result.to_dict(), f, indent=2)
    
    # Create GitHub comment with summary
    create_github_comment(report)
    
    # Fail build if critical violations found
    critical_violations = [v for v in result.consolidated_violations 
                          if v.severity == 'CRITICAL']
    
    if critical_violations:
        print(f"BUILD FAILED: {len(critical_violations)} critical violations found")
        sys.exit(1)
```

### 8.2 IDE Integration

```python
# VS Code extension integration
class VSCodeCorrelationProvider:
    """Provide correlation analysis for VS Code editor."""
    
    def __init__(self):
        self.correlator = CrossToolCorrelator(CorrelationConfig())
        self.violation_cache = {}
    
    def analyze_file(self, file_path: str) -> List[ConsolidatedViolation]:
        """Analyze a single file and return consolidated violations."""
        
        # Collect violations from all configured tools
        violations = []
        
        # Run tools in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(run_flake8, file_path): 'flake8',
                executor.submit(run_pylint, file_path): 'pylint',
                executor.submit(run_mypy, file_path): 'mypy',
                executor.submit(run_bandit, file_path): 'bandit'
            }
            
            for future in as_completed(futures):
                tool = futures[future]
                try:
                    tool_violations = future.result()
                    violations.extend(tool_violations)
                except Exception as e:
                    print(f"Error running {tool}: {e}")
        
        # Correlate violations
        result = self.correlator.correlate_violations(violations)
        
        return result.consolidated_violations
    
    def get_hover_info(self, violation: ConsolidatedViolation) -> str:
        """Generate hover information for correlated violation."""
        
        info = f"""
**{violation.severity}**: {violation.description}

**Tools detecting this issue:**
{chr(10).join(f"- {tool}" for tool in violation.tools_involved)}

**Confidence**: {violation.confidence:.2f}
**Correlation Score**: {violation.correlation_score:.2f}

**Recommendations:**
{chr(10).join(f"- {rec}" for rec in violation.recommendations)}
"""
        return info
```

---

## Conclusion

The Cross-Tool Correlation Guide provides a comprehensive framework for identifying, analyzing, and consolidating violations across multiple linter tools and connascence analysis. By implementing intelligent pattern matching, similarity calculation, and consolidation strategies, teams can achieve:

- **Reduced Noise**: Eliminate duplicate violations and false positives
- **Increased Confidence**: Leverage multi-tool consensus for higher accuracy
- **Better Insights**: Understand relationships between different types of violations
- **Improved Efficiency**: Focus on genuine issues rather than tool-specific artifacts

This correlation system serves as a critical component of the unified severity mapping architecture, enabling production-ready code quality analysis with industry-standard compliance.
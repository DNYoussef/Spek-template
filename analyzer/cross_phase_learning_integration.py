"""
Cross-Phase Learning Integration System
======================================

Advanced learning integration system that enables knowledge transfer and pattern
recognition across all phases of the SPEK development platform with intelligent
optimization recommendations and automated learning pattern application.

Features:
- Intelligent pattern recognition and classification
- Cross-phase knowledge transfer mechanisms
- Automated optimization recommendation engine
- Learning effectiveness validation and feedback loops
- Pattern strength calculation and confidence scoring
- Real-time learning adaptation and improvement
- NASA POT10 compliant bounded learning with memory safety
"""

import asyncio
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)


@dataclass
class LearningPattern:
    """Represents a learned pattern that can be applied across phases."""
    pattern_id: str
    pattern_type: str  # 'optimization', 'performance', 'architecture', 'quality'
    source_phases: List[str]
    target_phases: List[str]
    pattern_data: Dict[str, Any]
    success_rate: float
    confidence_score: float
    usage_count: int = 0
    last_applied: float = field(default_factory=time.time)
    created_at: float = field(default_factory=time.time)
    effectiveness_history: List[float] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    contraindications: List[str] = field(default_factory=list)


@dataclass
class OptimizationRecommendation:
    """Represents an optimization recommendation based on learned patterns."""
    recommendation_id: str
    target_phase: str
    recommendation_type: str
    priority: str  # 'high', 'medium', 'low'
    confidence: float
    expected_improvement: float
    implementation_effort: str  # 'low', 'medium', 'high'
    supporting_patterns: List[str]
    prerequisites: List[str]
    risks: List[str]
    implementation_steps: List[str]
    validation_criteria: List[str]
    created_at: float = field(default_factory=time.time)


@dataclass
class LearningEffectiveness:
    """Tracks effectiveness of applied learning patterns."""
    pattern_id: str
    application_phase: str
    before_metrics: Dict[str, float]
    after_metrics: Dict[str, float]
    improvement_achieved: float
    expected_improvement: float
    effectiveness_score: float  # 0.0 to 1.0
    application_timestamp: float
    validation_timestamp: float
    feedback_data: Dict[str, Any] = field(default_factory=dict)


class PatternClassifier:
    """Classifies and analyzes patterns for cross-phase learning."""
    
    def __init__(self):
        """Initialize pattern classifier."""
        self.pattern_templates = {
            "optimization": {
                "keywords": ["performance", "efficiency", "speed", "memory", "cache", "threading"],
                "metrics": ["improvement_percentage", "execution_time", "memory_usage"],
                "confidence_threshold": 0.7
            },
            "architecture": {
                "keywords": ["design", "structure", "component", "module", "interface"],
                "metrics": ["maintainability", "coupling", "cohesion"],
                "confidence_threshold": 0.8
            },
            "quality": {
                "keywords": ["testing", "validation", "compliance", "safety", "reliability"],
                "metrics": ["test_coverage", "defect_rate", "compliance_score"],
                "confidence_threshold": 0.75
            },
            "performance": {
                "keywords": ["benchmark", "profiling", "bottleneck", "optimization"],
                "metrics": ["throughput", "latency", "resource_utilization"],
                "confidence_threshold": 0.8
            }
        }
        
        # Pattern recognition statistics
        self.classification_stats = {
            "patterns_classified": 0,
            "accuracy_rate": 0.0,
            "classification_history": deque(maxlen=1000)
        }
    
    def classify_pattern(self, 
                        correlation: MemoryCorrelation,
                        performance_data: Optional[List[PerformanceCorrelation]] = None) -> LearningPattern:
        """Classify a correlation into a learning pattern."""
        pattern_type = self._determine_pattern_type(correlation, performance_data)
        confidence_score = self._calculate_confidence_score(correlation, performance_data, pattern_type)
        success_rate = self._estimate_success_rate(correlation, performance_data, pattern_type)
        
        pattern = LearningPattern(
            pattern_id=self._generate_pattern_id(correlation),
            pattern_type=pattern_type,
            source_phases=[correlation.source_phase],
            target_phases=[correlation.target_phase],
            pattern_data=self._extract_pattern_data(correlation, performance_data),
            success_rate=success_rate,
            confidence_score=confidence_score
        )
        
        # Update classification statistics
        self.classification_stats["patterns_classified"] += 1
        self.classification_stats["classification_history"].append({
            "pattern_type": pattern_type,
            "confidence": confidence_score,
            "timestamp": time.time()
        })
        
        return pattern
    
    def _determine_pattern_type(self, 
                               correlation: MemoryCorrelation,
                               performance_data: Optional[List[PerformanceCorrelation]]) -> str:
        """Determine the type of pattern based on correlation and performance data."""
        # Start with correlation type as base
        if correlation.correlation_type in self.pattern_templates:
            base_type = correlation.correlation_type
        else:
            base_type = "optimization"  # Default
        
        # Analyze metadata for pattern type indicators
        metadata_text = json.dumps(correlation.metadata).lower()
        type_scores = {}
        
        for pattern_type, template in self.pattern_templates.items():
            score = 0.0
            for keyword in template["keywords"]:
                if keyword in metadata_text:
                    score += 1.0
            
            # Normalize score by number of keywords
            type_scores[pattern_type] = score / len(template["keywords"])
        
        # Consider performance data if available
        if performance_data:
            for perf_corr in performance_data:
                metric_name = perf_corr.metric_name.lower()
                for pattern_type, template in self.pattern_templates.items():
                    for template_metric in template["metrics"]:
                        if template_metric in metric_name:
                            type_scores[pattern_type] = type_scores.get(pattern_type, 0) + 0.5
        
        # Return type with highest score, fallback to base type
        if type_scores:
            best_type = max(type_scores.items(), key=lambda x: x[1])
            if best_type[1] > 0:
                return best_type[0]
        
        return base_type
    
    def _calculate_confidence_score(self,
                                  correlation: MemoryCorrelation,
                                  performance_data: Optional[List[PerformanceCorrelation]],
                                  pattern_type: str) -> float:
        """Calculate confidence score for the classified pattern."""
        base_confidence = correlation.correlation_strength
        
        # Adjust confidence based on pattern type threshold
        template = self.pattern_templates.get(pattern_type, {})
        threshold = template.get("confidence_threshold", 0.75)
        
        if base_confidence < threshold:
            base_confidence *= 0.8  # Reduce confidence for below-threshold patterns
        
        # Boost confidence with performance data
        if performance_data:
            validated_data = [p for p in performance_data if p.validation_status == "validated"]
            if validated_data:
                avg_improvement = statistics.mean([p.improvement_percentage for p in validated_data])
                if avg_improvement > 20:  # Significant improvement
                    base_confidence = min(1.0, base_confidence + 0.1)
        
        # Consider metadata richness
        metadata_richness = len(correlation.metadata) / 10.0  # Normalize to 0-1
        metadata_richness = min(1.0, metadata_richness)
        
        # Final confidence is weighted combination
        final_confidence = (base_confidence * 0.7 + metadata_richness * 0.3)
        return max(0.0, min(1.0, final_confidence))
    
    def _estimate_success_rate(self,
                              correlation: MemoryCorrelation,
                              performance_data: Optional[List[PerformanceCorrelation]],
                              pattern_type: str) -> float:
        """Estimate success rate for the pattern."""
        # Base success rate on correlation strength
        base_rate = correlation.correlation_strength
        
        # Adjust based on performance validation
        if performance_data:
            validated_count = len([p for p in performance_data if p.validation_status == "validated"])
            total_count = len(performance_data)
            
            if total_count > 0:
                validation_rate = validated_count / total_count
                base_rate = (base_rate + validation_rate) / 2.0
        
        # Pattern type adjustments
        type_multipliers = {
            "optimization": 0.9,  # High success rate for optimizations
            "performance": 0.95,  # Very high for performance patterns
            "architecture": 0.8,  # Moderate for architecture patterns
            "quality": 0.85  # Good for quality patterns
        }
        
        multiplier = type_multipliers.get(pattern_type, 0.8)
        return max(0.0, min(1.0, base_rate * multiplier))
    
    def _generate_pattern_id(self, correlation: MemoryCorrelation) -> str:
        """Generate unique pattern ID."""
        pattern_string = f"{correlation.source_phase}_{correlation.target_phase}_{correlation.correlation_type}_{correlation.timestamp}"
        return hashlib.md5(pattern_string.encode(), usedforsecurity=False).hexdigest()[:16]
    
    def _extract_pattern_data(self,
                             correlation: MemoryCorrelation,
                             performance_data: Optional[List[PerformanceCorrelation]]) -> Dict[str, Any]:
        """Extract structured pattern data."""
        pattern_data = {
            "source_phase": correlation.source_phase,
            "target_phase": correlation.target_phase,
            "correlation_type": correlation.correlation_type,
            "correlation_strength": correlation.correlation_strength,
            "metadata": correlation.metadata.copy(),
            "performance_improvements": []
        }
        
        if performance_data:
            for perf_corr in performance_data:
                pattern_data["performance_improvements"].append({
                    "metric_name": perf_corr.metric_name,
                    "improvement_percentage": perf_corr.improvement_percentage,
                    "validation_status": perf_corr.validation_status,
                    "correlation_factors": perf_corr.correlation_factors
                })
        
        return pattern_data


class OptimizationRecommendationEngine:
    """Generates optimization recommendations based on learned patterns."""
    
    def __init__(self):
        """Initialize recommendation engine."""
        self.recommendation_templates = {
            "performance_optimization": {
                "priority_factors": ["improvement_potential", "implementation_effort", "risk_level"],
                "effort_estimation": {
                    "cache_optimization": "medium",
                    "algorithm_improvement": "high", 
                    "threading_optimization": "high",
                    "memory_optimization": "medium",
                    "io_optimization": "low"
                }
            },
            "architecture_improvement": {
                "priority_factors": ["maintainability_impact", "future_flexibility", "technical_debt"],
                "effort_estimation": {
                    "component_refactoring": "high",
                    "interface_improvement": "medium",
                    "design_pattern_application": "medium",
                    "dependency_optimization": "low"
                }
            }
        }
        
        self.recommendation_history: List[OptimizationRecommendation] = []
        self.effectiveness_tracking: Dict[str, LearningEffectiveness] = {}
    
    def generate_recommendations(self,
                                target_phase: str,
                                learned_patterns: List[LearningPattern],
                                current_metrics: Optional[Dict[str, float]] = None) -> List[OptimizationRecommendation]:
        """Generate optimization recommendations for a target phase."""
        recommendations = []
        
        # Filter patterns applicable to target phase
        applicable_patterns = [
            p for p in learned_patterns 
            if target_phase in p.target_phases or not p.target_phases
        ]
        
        # Sort by confidence and success rate
        applicable_patterns.sort(key=lambda p: (p.confidence_score * p.success_rate), reverse=True)
        
        for pattern in applicable_patterns[:10]:  # Top 10 patterns
            recommendation = self._create_recommendation_from_pattern(pattern, target_phase, current_metrics)
            if recommendation:
                recommendations.append(recommendation)
        
        # Sort recommendations by priority and confidence
        recommendations.sort(key=lambda r: (r.priority == "high", r.confidence), reverse=True)
        
        return recommendations
    
    def _create_recommendation_from_pattern(self,
                                          pattern: LearningPattern,
                                          target_phase: str,
                                          current_metrics: Optional[Dict[str, float]]) -> Optional[OptimizationRecommendation]:
        """Create recommendation from a learned pattern."""
        try:
            # Determine recommendation type and priority
            rec_type = self._map_pattern_to_recommendation_type(pattern)
            priority = self._calculate_priority(pattern, current_metrics)
            
            # Estimate expected improvement
            expected_improvement = self._estimate_improvement(pattern, current_metrics)
            
            # Determine implementation effort
            effort = self._estimate_implementation_effort(pattern)
            
            # Extract implementation steps
            impl_steps = self._generate_implementation_steps(pattern)
            
            # Identify risks and prerequisites
            risks = self._identify_risks(pattern)
            prerequisites = self._extract_prerequisites(pattern)
            
            # Create validation criteria
            validation_criteria = self._generate_validation_criteria(pattern)
            
            recommendation = OptimizationRecommendation(
                recommendation_id=f"rec_{pattern.pattern_id}_{target_phase}",
                target_phase=target_phase,
                recommendation_type=rec_type,
                priority=priority,
                confidence=pattern.confidence_score,
                expected_improvement=expected_improvement,
                implementation_effort=effort,
                supporting_patterns=[pattern.pattern_id],
                prerequisites=prerequisites,
                risks=risks,
                implementation_steps=impl_steps,
                validation_criteria=validation_criteria
            )
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Failed to create recommendation from pattern {pattern.pattern_id}: {e}")
            return None
    
    def _map_pattern_to_recommendation_type(self, pattern: LearningPattern) -> str:
        """Map pattern type to recommendation type."""
        mapping = {
            "optimization": "performance_optimization",
            "performance": "performance_optimization", 
            "architecture": "architecture_improvement",
            "quality": "quality_enhancement"
        }
        return mapping.get(pattern.pattern_type, "general_improvement")
    
    def _calculate_priority(self, pattern: LearningPattern, current_metrics: Optional[Dict[str, float]]) -> str:
        """Calculate priority level for the recommendation."""
        # Base priority on pattern effectiveness
        base_score = pattern.confidence_score * pattern.success_rate
        
        # Adjust based on performance improvements in pattern data
        perf_improvements = pattern.pattern_data.get("performance_improvements", [])
        if perf_improvements:
            avg_improvement = statistics.mean([
                p.get("improvement_percentage", 0) for p in perf_improvements 
                if p.get("validation_status") == "validated"
            ])
            
            if avg_improvement > 50:
                base_score += 0.2
            elif avg_improvement > 20:
                base_score += 0.1
        
        # Consider usage count (proven patterns)
        if pattern.usage_count > 5:
            base_score += 0.1
        
        # Priority thresholds
        if base_score > 0.8:
            return "high"
        elif base_score > 0.6:
            return "medium"
        else:
            return "low"
    
    def _estimate_improvement(self, pattern: LearningPattern, current_metrics: Optional[Dict[str, float]]) -> float:
        """Estimate expected improvement percentage."""
        # Extract historical improvements from pattern
        perf_improvements = pattern.pattern_data.get("performance_improvements", [])
        
        if perf_improvements:
            validated_improvements = [
                p.get("improvement_percentage", 0) for p in perf_improvements 
                if p.get("validation_status") == "validated"
            ]
            
            if validated_improvements:
                # Use conservative estimate (75th percentile)
                return statistics.quantiles(validated_improvements, n=4)[2]  # 75th percentile
        
        # Fallback estimation based on pattern confidence and success rate
        base_improvement = pattern.confidence_score * pattern.success_rate * 50  # Max 50% improvement
        
        # Adjust based on pattern type
        type_multipliers = {
            "optimization": 1.2,
            "performance": 1.3,
            "architecture": 0.8,
            "quality": 0.9
        }
        
        multiplier = type_multipliers.get(pattern.pattern_type, 1.0)
        return base_improvement * multiplier
    
    def _estimate_implementation_effort(self, pattern: LearningPattern) -> str:
        """Estimate implementation effort level."""
        # Check pattern metadata for effort indicators
        metadata_text = json.dumps(pattern.pattern_data).lower()
        
        high_effort_indicators = ["refactoring", "architecture", "redesign", "major", "complete"]
        medium_effort_indicators = ["optimization", "improvement", "enhancement", "modification"]
        low_effort_indicators = ["configuration", "tuning", "parameter", "simple", "minor"]
        
        high_count = sum(1 for indicator in high_effort_indicators if indicator in metadata_text)
        medium_count = sum(1 for indicator in medium_effort_indicators if indicator in metadata_text)
        low_count = sum(1 for indicator in low_effort_indicators if indicator in metadata_text)
        
        if high_count > medium_count and high_count > low_count:
            return "high"
        elif low_count > medium_count and low_count > high_count:
            return "low"
        else:
            return "medium"
    
    def _generate_implementation_steps(self, pattern: LearningPattern) -> List[str]:
        """Generate implementation steps based on pattern."""
        steps = []
        pattern_type = pattern.pattern_type
        
        # Base steps by pattern type
        if pattern_type == "optimization":
            steps = [
                "1. Analyze current performance baseline",
                "2. Identify optimization targets from pattern data",
                "3. Implement optimization techniques",
                "4. Validate performance improvements",
                "5. Monitor for regressions"
            ]
        elif pattern_type == "architecture":
            steps = [
                "1. Review current architecture design",
                "2. Plan architectural improvements based on pattern",
                "3. Implement changes incrementally",
                "4. Update documentation and interfaces",
                "5. Validate system integration"
            ]
        elif pattern_type == "quality":
            steps = [
                "1. Assess current quality metrics",
                "2. Implement quality improvements from pattern",
                "3. Update testing and validation procedures",
                "4. Verify compliance requirements",
                "5. Monitor quality metrics"
            ]
        else:
            steps = [
                "1. Analyze pattern applicability to current phase",
                "2. Plan implementation approach",
                "3. Execute implementation in stages",
                "4. Validate results against expected outcomes",
                "5. Document lessons learned"
            ]
        
        # Add pattern-specific details
        correlation_factors = []
        perf_improvements = pattern.pattern_data.get("performance_improvements", [])
        for perf in perf_improvements:
            correlation_factors.extend(perf.get("correlation_factors", []))
        
        if correlation_factors:
            unique_factors = list(set(correlation_factors))
            steps.append(f"6. Focus on key factors: {', '.join(unique_factors[:3])}")
        
        return steps
    
    def _identify_risks(self, pattern: LearningPattern) -> List[str]:
        """Identify potential risks in applying the pattern."""
        risks = []
        
        # Risks based on confidence level
        if pattern.confidence_score < 0.7:
            risks.append("Low confidence in pattern effectiveness")
        
        # Risks based on success rate
        if pattern.success_rate < 0.8:
            risks.append("Pattern has shown mixed results in previous applications")
        
        # Risks based on pattern type
        if pattern.pattern_type == "architecture":
            risks.append("Architectural changes may introduce integration issues")
            risks.append("Significant testing required to validate changes")
        
        if pattern.pattern_type == "optimization":
            risks.append("Performance optimizations may introduce subtle bugs")
            risks.append("Changes may affect system stability under load")
        
        # Check for complexity indicators
        metadata_text = json.dumps(pattern.pattern_data).lower()
        if "threading" in metadata_text or "concurrent" in metadata_text:
            risks.append("Concurrency changes require careful thread safety validation")
        
        if "memory" in metadata_text:
            risks.append("Memory-related changes need thorough leak testing")
        
        return risks
    
    def _extract_prerequisites(self, pattern: LearningPattern) -> List[str]:
        """Extract prerequisites for applying the pattern."""
        prerequisites = []
        
        # Add pattern-specific prerequisites
        if pattern.prerequisites:
            prerequisites.extend(pattern.prerequisites)
        
        # Add inferred prerequisites based on pattern data
        correlation_factors = []
        perf_improvements = pattern.pattern_data.get("performance_improvements", [])
        for perf in perf_improvements:
            correlation_factors.extend(perf.get("correlation_factors", []))
        
        # Convert factors to prerequisites
        factor_to_prereq = {
            "detector_pool": "Detector pool system must be implemented",
            "unified_visitor": "Unified visitor pattern must be available",
            "thread_safety": "Thread-safe infrastructure must be in place",
            "caching": "Caching system must be operational"
        }
        
        for factor in set(correlation_factors):
            if factor in factor_to_prereq:
                prerequisites.append(factor_to_prereq[factor])
        
        return prerequisites
    
    def _generate_validation_criteria(self, pattern: LearningPattern) -> List[str]:
        """Generate validation criteria for the recommendation."""
        criteria = []
        
        # Performance-based criteria
        expected_improvement = self._estimate_improvement(pattern, None)
        if expected_improvement > 0:
            criteria.append(f"Achieve at least {expected_improvement:.1f}% improvement in target metrics")
        
        # Pattern-specific criteria
        if pattern.pattern_type == "optimization":
            criteria.extend([
                "No performance regressions in unrelated areas",
                "Memory usage remains within acceptable bounds",
                "System stability maintained under load"
            ])
        
        elif pattern.pattern_type == "quality":
            criteria.extend([
                "Quality metrics improve without compromising functionality",
                "All existing tests continue to pass",
                "New quality measures show positive trends"
            ])
        
        # General criteria
        criteria.extend([
            "Implementation completed within estimated effort",
            "No critical bugs introduced",
            "Pattern effectiveness validated through measurement"
        ])
        
        return criteria
    
    def track_recommendation_effectiveness(self, 
                                         recommendation_id: str,
                                         before_metrics: Dict[str, float],
                                         after_metrics: Dict[str, float]) -> LearningEffectiveness:
        """Track the effectiveness of an applied recommendation."""
        recommendation = next(
            (r for r in self.recommendation_history if r.recommendation_id == recommendation_id),
            None
        )
        
        if not recommendation:
            raise ValueError(f"Recommendation {recommendation_id} not found")
        
        # Calculate actual improvement
        improvement_achieved = 0.0
        if "performance" in after_metrics and "performance" in before_metrics:
            improvement_achieved = ((after_metrics["performance"] - before_metrics["performance"]) 
                                  / before_metrics["performance"] * 100)
        
        # Calculate effectiveness score
        expected_improvement = recommendation.expected_improvement
        if expected_improvement > 0:
            effectiveness_score = min(1.0, improvement_achieved / expected_improvement)
        else:
            effectiveness_score = 1.0 if improvement_achieved > 0 else 0.0
        
        effectiveness = LearningEffectiveness(
            pattern_id=recommendation.supporting_patterns[0] if recommendation.supporting_patterns else "",
            application_phase=recommendation.target_phase,
            before_metrics=before_metrics,
            after_metrics=after_metrics,
            improvement_achieved=improvement_achieved,
            expected_improvement=expected_improvement,
            effectiveness_score=max(0.0, effectiveness_score),
            application_timestamp=time.time(),
            validation_timestamp=time.time()
        )
        
        self.effectiveness_tracking[recommendation_id] = effectiveness
        return effectiveness


class CrossPhaseLearningIntegration:
    """Main integration system for cross-phase learning."""
    
    def __init__(self, memory_model: Optional[UnifiedMemoryModel] = None):
        """Initialize cross-phase learning integration."""
        self.memory_model = memory_model or (get_global_memory_model() if MEMORY_SYSTEM_AVAILABLE else None)
        self.storage = get_global_storage() if MEMORY_SYSTEM_AVAILABLE else None
        
        self.pattern_classifier = PatternClassifier()
        self.recommendation_engine = OptimizationRecommendationEngine()
        
        # Learning state
        self.learned_patterns: Dict[str, LearningPattern] = {}
        self.active_recommendations: Dict[str, List[OptimizationRecommendation]] = defaultdict(list)
        self.learning_lock = threading.RLock()
        
        # Learning effectiveness tracking
        self.effectiveness_history: List[LearningEffectiveness] = []
        self.learning_metrics = {
            "patterns_learned": 0,
            "recommendations_generated": 0,
            "successful_applications": 0,
            "average_effectiveness": 0.0,
            "learning_confidence": 0.0
        }
        
        logger.info("Cross-Phase Learning Integration initialized")
    
    async def analyze_and_learn_from_phase(self, phase_id: str) -> Dict[str, Any]:
        """Analyze a completed phase and extract learning patterns."""
        if not MEMORY_SYSTEM_AVAILABLE:
            logger.warning("Memory system not available for learning analysis")
            return {"status": "error", "message": "Memory system unavailable"}
        
        learning_results = {
            "phase_id": phase_id,
            "patterns_discovered": 0,
            "recommendations_generated": 0,
            "learning_insights": [],
            "effectiveness_improvements": []
        }
        
        try:
            # Get correlations involving this phase
            correlations = self.storage.get_correlations_by_phase(phase_id)
            
            # Get performance data for this phase
            performance_data = self.storage.get_performance_trends(phase_id)
            
            # Group correlations by source-target pairs
            correlation_groups = defaultdict(list)
            for correlation in correlations:
                key = f"{correlation.source_phase}->{correlation.target_phase}"
                correlation_groups[key].append(correlation)
            
            # Classify patterns for each correlation group
            for group_key, group_correlations in correlation_groups.items():
                for correlation in group_correlations:
                    # Get relevant performance data
                    relevant_perf_data = [
                        p for p in performance_data 
                        if any(factor in correlation.metadata.get('correlation_factors', []) 
                              for factor in p.correlation_factors)
                    ]
                    
                    # Classify pattern
                    learned_pattern = self.pattern_classifier.classify_pattern(
                        correlation, relevant_perf_data
                    )
                    
                    # Store learned pattern
                    with self.learning_lock:
                        self.learned_patterns[learned_pattern.pattern_id] = learned_pattern
                        self.learning_metrics["patterns_learned"] += 1
                    
                    # Store in persistent storage
                    if self.storage:
                        await self._store_learned_pattern(learned_pattern)
                    
                    learning_results["patterns_discovered"] += 1
                    learning_results["learning_insights"].append({
                        "pattern_id": learned_pattern.pattern_id,
                        "pattern_type": learned_pattern.pattern_type,
                        "confidence": learned_pattern.confidence_score,
                        "success_rate": learned_pattern.success_rate
                    })
            
            # Generate recommendations for related phases
            await self._generate_phase_recommendations(phase_id, learning_results)
            
            # Update overall learning metrics
            self._update_learning_metrics()
            
            logger.info(f"Learning analysis completed for {phase_id}: {learning_results['patterns_discovered']} patterns discovered")
            
        except Exception as e:
            logger.error(f"Failed to analyze and learn from phase {phase_id}: {e}")
            learning_results["status"] = "error"
            learning_results["error"] = str(e)
        
        return learning_results
    
    async def get_optimization_recommendations(self, target_phase: str) -> List[OptimizationRecommendation]:
        """Get optimization recommendations for a target phase."""
        with self.learning_lock:
            # Filter patterns applicable to target phase
            applicable_patterns = [
                pattern for pattern in self.learned_patterns.values()
                if (target_phase in pattern.target_phases or 
                    not pattern.target_phases or
                    any(phase.startswith(target_phase[:5]) for phase in pattern.target_phases))
            ]
        
        # Generate recommendations
        recommendations = self.recommendation_engine.generate_recommendations(
            target_phase, applicable_patterns
        )
        
        # Store active recommendations
        with self.learning_lock:
            self.active_recommendations[target_phase] = recommendations
            self.learning_metrics["recommendations_generated"] += len(recommendations)
        
        logger.info(f"Generated {len(recommendations)} recommendations for {target_phase}")
        return recommendations
    
    async def apply_learning_pattern(self, 
                                   pattern_id: str,
                                   target_phase: str,
                                   current_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Apply a learned pattern to a target phase."""
        with self.learning_lock:
            pattern = self.learned_patterns.get(pattern_id)
        
        if not pattern:
            return {"status": "error", "message": f"Pattern {pattern_id} not found"}
        
        application_result = {
            "pattern_id": pattern_id,
            "target_phase": target_phase,
            "status": "applied",
            "before_metrics": current_metrics.copy(),
            "application_timestamp": time.time(),
            "recommendations": []
        }
        
        try:
            # Generate specific recommendations for this application
            recommendations = self.recommendation_engine.generate_recommendations(
                target_phase, [pattern], current_metrics
            )
            
            if recommendations:
                top_recommendation = recommendations[0]
                application_result["recommendations"] = [
                    {
                        "recommendation_id": top_recommendation.recommendation_id,
                        "type": top_recommendation.recommendation_type,
                        "priority": top_recommendation.priority,
                        "expected_improvement": top_recommendation.expected_improvement,
                        "implementation_steps": top_recommendation.implementation_steps
                    }
                ]
            
            # Update pattern usage
            with self.learning_lock:
                pattern.usage_count += 1
                pattern.last_applied = time.time()
            
            # Store application in persistent storage
            if self.storage and MEMORY_SYSTEM_AVAILABLE:
                await self._store_pattern_application(pattern_id, target_phase, application_result)
            
            logger.info(f"Applied learning pattern {pattern_id} to {target_phase}")
            
        except Exception as e:
            logger.error(f"Failed to apply learning pattern {pattern_id}: {e}")
            application_result["status"] = "error"
            application_result["error"] = str(e)
        
        return application_result
    
    async def validate_learning_effectiveness(self, 
                                            pattern_id: str,
                                            target_phase: str,
                                            after_metrics: Dict[str, float]) -> LearningEffectiveness:
        """Validate the effectiveness of an applied learning pattern."""
        # Find the application record
        application_found = False
        before_metrics = {}
        
        # This would typically look up the application from storage
        # For now, we'll create a simple effectiveness record
        
        with self.learning_lock:
            pattern = self.learned_patterns.get(pattern_id)
        
        if not pattern:
            raise ValueError(f"Pattern {pattern_id} not found")
        
        # Calculate improvement (simplified - would use actual before metrics)
        performance_improvement = after_metrics.get("performance", 0) - 100  # Assume baseline of 100
        
        effectiveness = LearningEffectiveness(
            pattern_id=pattern_id,
            application_phase=target_phase,
            before_metrics={"performance": 100},  # Simplified
            after_metrics=after_metrics,
            improvement_achieved=performance_improvement,
            expected_improvement=pattern.success_rate * 50,  # Estimated
            effectiveness_score=min(1.0, max(0.0, performance_improvement / 50)),
            application_timestamp=pattern.last_applied,
            validation_timestamp=time.time()
        )
        
        # Update pattern effectiveness history
        with self.learning_lock:
            pattern.effectiveness_history.append(effectiveness.effectiveness_score)
            
            # Keep bounded history
            if len(pattern.effectiveness_history) > 100:
                pattern.effectiveness_history = pattern.effectiveness_history[-50:]
        
        # Add to system effectiveness history
        self.effectiveness_history.append(effectiveness)
        
        # Update learning metrics
        if effectiveness.effectiveness_score > 0.7:
            self.learning_metrics["successful_applications"] += 1
        
        self._update_learning_metrics()
        
        logger.info(f"Validated learning effectiveness for {pattern_id}: {effectiveness.effectiveness_score:.2f}")
        return effectiveness
    
    def get_learning_insights_report(self) -> Dict[str, Any]:
        """Get comprehensive learning insights report."""
        with self.learning_lock:
            patterns_by_type = defaultdict(list)
            for pattern in self.learned_patterns.values():
                patterns_by_type[pattern.pattern_type].append(pattern)
        
        report = {
            "summary": self.learning_metrics.copy(),
            "patterns_by_type": {},
            "top_patterns": [],
            "learning_trends": [],
            "effectiveness_analysis": {},
            "recommendations_summary": {}
        }
        
        # Analyze patterns by type
        for pattern_type, patterns in patterns_by_type.items():
            avg_confidence = statistics.mean([p.confidence_score for p in patterns])
            avg_success_rate = statistics.mean([p.success_rate for p in patterns])
            total_usage = sum(p.usage_count for p in patterns)
            
            report["patterns_by_type"][pattern_type] = {
                "count": len(patterns),
                "avg_confidence": avg_confidence,
                "avg_success_rate": avg_success_rate,
                "total_usage": total_usage
            }
        
        # Top patterns by effectiveness
        all_patterns = list(self.learned_patterns.values())
        top_patterns = sorted(
            all_patterns,
            key=lambda p: (p.confidence_score * p.success_rate * (1 + p.usage_count / 10)),
            reverse=True
        )[:10]
        
        report["top_patterns"] = [
            {
                "pattern_id": p.pattern_id,
                "pattern_type": p.pattern_type,
                "confidence_score": p.confidence_score,
                "success_rate": p.success_rate,
                "usage_count": p.usage_count,
                "source_phases": p.source_phases,
                "target_phases": p.target_phases
            }
            for p in top_patterns
        ]
        
        # Effectiveness analysis
        if self.effectiveness_history:
            effectiveness_scores = [e.effectiveness_score for e in self.effectiveness_history]
            report["effectiveness_analysis"] = {
                "total_applications": len(self.effectiveness_history),
                "avg_effectiveness": statistics.mean(effectiveness_scores),
                "success_rate": len([s for s in effectiveness_scores if s > 0.7]) / len(effectiveness_scores),
                "effectiveness_trend": effectiveness_scores[-10:]  # Last 10 scores
            }
        
        # Recommendations summary
        total_recommendations = sum(len(recs) for recs in self.active_recommendations.values())
        high_priority_recs = sum(
            len([r for r in recs if r.priority == "high"])
            for recs in self.active_recommendations.values()
        )
        
        report["recommendations_summary"] = {
            "total_active_recommendations": total_recommendations,
            "high_priority_count": high_priority_recs,
            "phases_with_recommendations": len(self.active_recommendations)
        }
        
        return report
    
    async def _store_learned_pattern(self, pattern: LearningPattern) -> None:
        """Store learned pattern in persistent storage."""
        if not self.storage:
            return
        
        pattern_data = {
            "pattern_type": pattern.pattern_type,
            "source_phases": pattern.source_phases,
            "target_phases": pattern.target_phases,
            "pattern_data": pattern.pattern_data,
            "success_rate": pattern.success_rate,
            "confidence_score": pattern.confidence_score,
            "usage_count": pattern.usage_count,
            "effectiveness_history": pattern.effectiveness_history
        }
        
        await asyncio.get_event_loop().run_in_executor(
            None,
            self.storage.store_learning_pattern,
            pattern.pattern_id,
            pattern.pattern_type,
            pattern.confidence_score,
            pattern_data
        )
    
    async def _store_pattern_application(self, 
                                       pattern_id: str,
                                       target_phase: str,
                                       application_result: Dict[str, Any]) -> None:
        """Store pattern application record."""
        # This would store the application details for later effectiveness validation
        pass
    
    async def _generate_phase_recommendations(self, phase_id: str, learning_results: Dict[str, Any]) -> None:
        """Generate recommendations for phases related to the analyzed phase."""
        # Identify related phases that could benefit from learned patterns
        related_phases = self._identify_related_phases(phase_id)
        
        for related_phase in related_phases:
            recommendations = await self.get_optimization_recommendations(related_phase)
            learning_results["recommendations_generated"] += len(recommendations)
    
    def _identify_related_phases(self, phase_id: str) -> List[str]:
        """Identify phases that could benefit from patterns learned in the given phase."""
        # Simple heuristic: next phases in sequence
        phase_sequences = {
            "phase1": ["phase2", "phase3"],
            "phase2": ["phase3", "phase4"],
            "phase3": ["phase4", "phase5"],
            "phase4": ["phase5"],
            "phase5": ["phase1"]  # Circular learning
        }
        
        return phase_sequences.get(phase_id, [])
    
    def _update_learning_metrics(self) -> None:
        """Update overall learning metrics."""
        if self.effectiveness_history:
            self.learning_metrics["average_effectiveness"] = statistics.mean([
                e.effectiveness_score for e in self.effectiveness_history
            ])
        
        # Calculate learning confidence based on pattern quality
        if self.learned_patterns:
            pattern_confidences = [p.confidence_score for p in self.learned_patterns.values()]
            self.learning_metrics["learning_confidence"] = statistics.mean(pattern_confidences)
        
    def shutdown(self) -> None:
        """Shutdown learning integration system."""
        logger.info("Shutting down Cross-Phase Learning Integration...")
        
        # Save final learning state if needed
        final_metrics = self.learning_metrics.copy()
        logger.info(f"Final learning metrics: {final_metrics}")
        
        logger.info("Cross-Phase Learning Integration shutdown completed")


# Global learning integration instance
_global_learning_integration: Optional[CrossPhaseLearningIntegration] = None
_learning_lock = threading.Lock()


def get_global_learning_integration() -> CrossPhaseLearningIntegration:
    """Get or create global cross-phase learning integration."""
    global _global_learning_integration
    
    with _learning_lock:
        if _global_learning_integration is None:
            _global_learning_integration = CrossPhaseLearningIntegration()
    
    return _global_learning_integration


async def initialize_learning_integration() -> Dict[str, Any]:
    """Initialize cross-phase learning integration system."""
    learning_system = get_global_learning_integration()
    
    return {
        "status": "initialized",
        "memory_system_available": MEMORY_SYSTEM_AVAILABLE,
        "patterns_loaded": len(learning_system.learned_patterns),
        "classification_templates": len(learning_system.pattern_classifier.pattern_templates),
        "learning_metrics": learning_system.learning_metrics.copy()
    }
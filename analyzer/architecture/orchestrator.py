from src.constants.base import MAXIMUM_FILE_LENGTH_LINES, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS, MINIMUM_TRADE_THRESHOLD

"""
Analysis Orchestrator - Phase Coordination Logic
==================================================

Extracted from UnifiedConnascenceAnalyzer's god object.
NASA Rule 4 Compliant: Functions under 60 lines.
Handles phase coordination and pipeline management.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
logger = logging.getLogger(__name__)

class ArchitectureOrchestrator:
    """Orchestrates analysis phases with comprehensive coordination."""

    def __init__(self, coordination_strategy: str = "adaptive"):
        """Initialize orchestrator with minimal state."""
        self.current_phase = None
        self.audit_trail = []
        self.phase_metadata = {}
        self.coordination_strategy = coordination_strategy
        self.detector_pool = None
        self.aggregator = None

    def set_detector_pool(self, pool):
        """Set detector pool for orchestration."""
        self.detector_pool = pool

    def set_aggregator(self, aggregator):
        """Set result aggregator for orchestration."""
        self.aggregator = aggregator

    def orchestrate_analysis_phases(
        self, project_path: Path, policy_preset: str, analyzers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Orchestrate all analysis phases with enhanced coordination.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation assertions
        assert project_path is not None, "project_path cannot be None"
        assert isinstance(policy_preset, str), "policy_preset must be string"
        assert analyzers is not None, "analyzers cannot be None"

        violations = {"connascence": [], "duplication": [], "nasa": []}
        phase_metadata = self._initialize_phase_metadata()

        try:
            # Phase 1-2: Core AST Analysis
            self._execute_ast_analysis_phase(project_path, violations, phase_metadata, analyzers)
            
            # Phase 3-4: Duplication Detection
            self._execute_duplication_phase(project_path, violations, phase_metadata, analyzers)
            
            # Phase 5: Smart Integration
            self._execute_smart_integration_phase(project_path, policy_preset, violations, phase_metadata, analyzers)
            
            # Phase 6: NASA Compliance
            self._execute_nasa_compliance_phase(project_path, violations, phase_metadata, analyzers)

        except Exception as e:
            logger.error(f"Phase orchestration failed: {e}")
            self._record_phase_error("orchestration", str(e), phase_metadata)

        violations["_metadata"] = phase_metadata
        return violations

    def _initialize_phase_metadata(self) -> Dict[str, Any]:
        """Initialize phase metadata structure. NASA Rule 4 compliant."""
        return {
            "audit_trail": [],
            "correlations": [],
            "smart_results": None,
            "phase_errors": [],
            "started_at": self._get_iso_timestamp(),
            "total_phases": 4
        }

    def _execute_ast_analysis_phase(
        self, project_path: Path, violations: Dict, phase_metadata: Dict, analyzers: Dict
    ) -> None:
        """Execute AST analysis phase. NASA Rule 4 compliant: Under 60 lines."""
        # NASA Rule 5: Input validation
        assert project_path is not None, "project_path cannot be None"
        assert violations is not None, "violations cannot be None"
        
        phase_name = "ast_analysis"
        self.current_phase = phase_name
        
        try:
            logger.info("Phase 1-2: Starting core AST analysis")
            self._record_phase_start(phase_name, phase_metadata)
            
            # Execute AST analysis through analyzers
            if "ast_analyzer" in analyzers:
                ast_violations = self._run_ast_analysis_with_analyzers(project_path, analyzers)
                violations["connascence"].extend(ast_violations)
            
            self._record_phase_completion(
                phase_name, phase_metadata, len(violations["connascence"])
            )
            
        except Exception as e:
            logger.error(f"AST analysis phase failed: {e}")
            self._record_phase_error(phase_name, str(e), phase_metadata)

    def _execute_duplication_phase(
        self, project_path: Path, violations: Dict, phase_metadata: Dict, analyzers: Dict
    ) -> None:
        """Execute duplication detection phase. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert project_path is not None, "project_path cannot be None"
        
        phase_name = "duplication_analysis"
        self.current_phase = phase_name
        
        try:
            logger.info("Phase 3-4: Starting MECE duplication analysis")
            self._record_phase_start(phase_name, phase_metadata)
            
            if "mece_analyzer" in analyzers:
                dup_analysis = analyzers["mece_analyzer"].analyze_path(str(project_path), comprehensive=True)
                violations["duplication"] = dup_analysis.get("duplications", [])
            
            self._record_phase_completion(
                phase_name, phase_metadata, len(violations["duplication"])
            )
            
        except Exception as e:
            logger.error(f"Duplication analysis phase failed: {e}")
            self._record_phase_error(phase_name, str(e), phase_metadata)

    def _execute_smart_integration_phase(
        self, project_path: Path, policy_preset: str, violations: Dict, 
        phase_metadata: Dict, analyzers: Dict
    ) -> None:
        """Execute smart integration phase. NASA Rule 4 compliant."""
        phase_name = "smart_integration"
        self.current_phase = phase_name
        
        try:
            logger.info("Phase 5: Running smart integration engine")
            self._record_phase_start(phase_name, phase_metadata)
            
            smart_results = self._run_smart_integration_with_analyzers(
                project_path, policy_preset, violations, analyzers
            )
            
            if smart_results:
                phase_metadata["smart_results"] = smart_results
                phase_metadata["correlations"] = smart_results.get("correlations", [])
            
            self._record_phase_completion(
                phase_name, phase_metadata, len(phase_metadata["correlations"])
            )
            
        except Exception as e:
            logger.error(f"Smart integration phase failed: {e}")
            self._record_phase_error(phase_name, str(e), phase_metadata)

    def _execute_nasa_compliance_phase(
        self, project_path: Path, violations: Dict, phase_metadata: Dict, analyzers: Dict
    ) -> None:
        """Execute NASA compliance phase. NASA Rule 4 compliant."""
        phase_name = "nasa_analysis"
        self.current_phase = phase_name
        
        try:
            logger.info("Phase 6: Running NASA compliance analysis")
            self._record_phase_start(phase_name, phase_metadata)
            
            nasa_violations = self._run_nasa_analysis_with_analyzers(
                project_path, violations["connascence"], phase_metadata, analyzers
            )
            violations["nasa"] = nasa_violations
            
            self._record_phase_completion(
                phase_name, phase_metadata, len(violations["nasa"])
            )
            
        except Exception as e:
            logger.error(f"NASA compliance phase failed: {e}")
            self._record_phase_error(phase_name, str(e), phase_metadata)

    def _record_phase_start(self, phase_name: str, phase_metadata: Dict) -> None:
        """Record phase start in audit trail. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert phase_name is not None, "phase_name cannot be None"
        assert phase_metadata is not None, "phase_metadata cannot be None"
        
        phase_metadata["audit_trail"].append({
            "phase": phase_name,
            "started": self._get_iso_timestamp(),
            "status": "started"
        })

    def _record_phase_completion(
        self, phase_name: str, phase_metadata: Dict, violations_count: int
    ) -> None:
        """Record phase completion in audit trail. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert phase_name is not None, "phase_name cannot be None"
        assert violations_count >= 0, "violations_count must be non-negative"
        
        phase_metadata["audit_trail"].append({
            "phase": phase_name,
            "completed": self._get_iso_timestamp(),
            "violations_found": violations_count,
            "status": "completed"
        })

    def _record_phase_error(
        self, phase_name: str, error_message: str, phase_metadata: Dict
    ) -> None:
        """Record phase error in metadata. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert phase_name is not None, "phase_name cannot be None"
        assert error_message is not None, "error_message cannot be None"
        
        error_record = {
            "phase": phase_name,
            "error": error_message,
            "timestamp": self._get_iso_timestamp(),
            "status": "failed"
        }
        
        phase_metadata["phase_errors"].append(error_record)
        phase_metadata["audit_trail"].append(error_record)

    def _run_ast_analysis_with_analyzers(self, project_path: Path, analyzers: Dict) -> List[Dict]:
        """Run AST analysis through available analyzers. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert project_path is not None, "project_path cannot be None"
        assert analyzers is not None, "analyzers cannot be None"
        
        all_violations = []
        
        # Run core AST analyzer
        if "ast_analyzer" in analyzers:
            ast_results = analyzers["ast_analyzer"].analyze_directory(project_path)
            all_violations.extend([self._violation_to_dict(v) for v in ast_results])
        
        # Run orchestrator analysis
        if "orchestrator_analyzer" in analyzers:
            god_results = analyzers["orchestrator_analyzer"].analyze_directory(str(project_path))
            all_violations.extend([self._violation_to_dict(v) for v in god_results])
        
        return all_violations

    def _run_smart_integration_with_analyzers(
        self, project_path: Path, policy_preset: str, violations: Dict, analyzers: Dict
    ) -> Optional[Dict]:
        """Run smart integration through analyzer. NASA Rule 4 compliant."""
        if "smart_engine" not in analyzers or not analyzers["smart_engine"]:
            return None
            
        try:
            base_results = analyzers["smart_engine"].comprehensive_analysis(str(project_path), policy_preset)
            
            # Enhanced correlation analysis
            if violations and base_results:
                correlations = analyzers["smart_engine"].analyze_correlations(
                    violations.get("connascence", []),
                    violations.get("duplication", []),
                    violations.get("nasa", [])
                )
                base_results["correlations"] = correlations
                
            return base_results
            
        except Exception as e:
            logger.warning(f"Smart integration execution failed: {e}")
            return None

    def _run_nasa_analysis_with_analyzers(
        self, project_path: Path, connascence_violations: List[Dict], 
        phase_metadata: Dict, analyzers: Dict
    ) -> List[Dict]:
        """Run NASA analysis through available analyzers. NASA Rule 4 compliant."""
        nasa_violations = []
        
        # NASA integration analyzer
        if "nasa_integration" in analyzers and analyzers["nasa_integration"]:
            for violation in connascence_violations:
                nasa_checks = analyzers["nasa_integration"].check_nasa_violations(violation)
                nasa_violations.extend(nasa_checks)
        
        # Dedicated NASA analyzer
        if "nasa_analyzer" in analyzers:
            dedicated_violations = self._run_dedicated_nasa_analyzer(project_path, analyzers["nasa_analyzer"])
            nasa_violations.extend(dedicated_violations)
        
        return nasa_violations

    def _run_dedicated_nasa_analyzer(self, project_path: Path, nasa_analyzer) -> List[Dict]:
        """Run dedicated NASA analyzer. NASA Rule 4 compliant."""
        # NASA Rule 5: Input validation
        assert project_path is not None, "project_path cannot be None"
        assert nasa_analyzer is not None, "nasa_analyzer cannot be None"
        
        nasa_violations = []
        
        try:
            for py_file in project_path.rglob("*.py"):
                if self._should_analyze_file(py_file):
                    with open(py_file, 'r', encoding='utf-8') as f:
                        source_code = f.read()
                    
                    file_violations = nasa_analyzer.analyze_file(str(py_file), source_code)
                    nasa_violations.extend([self._nasa_violation_to_dict(v) for v in file_violations])
                    
        except Exception as e:
            logger.warning(f"Dedicated NASA analysis failed: {e}")
        
        return nasa_violations

    def _should_analyze_file(self, file_path: Path) -> bool:
        """Check if file should be analyzed. NASA Rule 4 compliant."""
        skip_patterns = ['__pycache__', '.git', '.pytest_cache', 'test_', '_test.py']
        path_str = str(file_path)
        return not any(pattern in path_str for pattern in skip_patterns)

    def _violation_to_dict(self, violation) -> Dict[str, Any]:
        """Convert violation object to dictionary. NASA Rule 4 compliant."""
        if isinstance(violation, dict):
            return violation
        
        return {
            "id": getattr(violation, "id", str(hash(str(violation)))),
            "rule_id": getattr(violation, "type", "CON_UNKNOWN"),
            "type": getattr(violation, "type", "unknown"),
            "severity": getattr(violation, "severity", "medium"),
            "description": getattr(violation, "description", str(violation)),
            "file_path": getattr(violation, "file_path", ""),
            "line_number": getattr(violation, "line_number", 0),
        }

    def _nasa_violation_to_dict(self, violation) -> Dict[str, Any]:
        """Convert NASA violation to dictionary. NASA Rule 4 compliant."""
        return {
            "id": f"nasa_{violation.context.get('nasa_rule', 'unknown')}_{violation.line_number}",
            "rule_id": violation.type,
            "type": violation.type,
            "severity": violation.severity,
            "description": violation.description,
            "file_path": violation.file_path,
            "line_number": violation.line_number,
            "column": violation.column,
            "context": {
                "analysis_engine": "dedicated_nasa",
                "nasa_rule": violation.context.get("nasa_rule", "unknown"),
                "recommendation": violation.recommendation
            }
        }

    def _get_iso_timestamp(self) -> str:
        """Get current timestamp in ISO format. NASA Rule 4 compliant."""
        return datetime.now().isoformat()

    def get_current_phase(self) -> Optional[str]:
        """Get current analysis phase."""
        return self.current_phase

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Get complete audit trail."""
        return self.audit_trail.copy()
    
    def analyze_architecture(self, path: str) -> Dict[str, Any]:
        """
        Analyze architecture using validation strategies.
        Expected by GitHub workflows (quality-gates.yml line 185).
        """
        from analyzer.architecture.validation_strategies import (
            FileStructureStrategy, ComplexityAnalysisStrategy, CouplingAnalysisStrategy,
            MaintainabilityStrategy, ArchitecturalHealthStrategy, HotspotDetectionStrategy
        )
        from src.utils.validation.validation_framework import ValidationEngine

        start_time = time.time()
        path_obj = Path(path)

        try:
            # Initialize validation engine
            engine = ValidationEngine()
            engine.register_strategy("file_structure", FileStructureStrategy())
            engine.register_strategy("complexity", ComplexityAnalysisStrategy())
            engine.register_strategy("coupling", CouplingAnalysisStrategy())
            engine.register_strategy("maintainability", MaintainabilityStrategy())
            engine.register_strategy("health", ArchitecturalHealthStrategy())
            engine.register_strategy("hotspots", HotspotDetectionStrategy())

            # Collect architectural data
            arch_data = self._collect_architecture_data(path_obj)

            # Run validation strategies
            validation_results = self._run_architecture_validations(engine, arch_data)

            # Build comprehensive result
            result = self._build_architecture_result(arch_data, validation_results, start_time, path)

            return result

        except Exception as e:
            logger.error(f"Architecture analysis failed: {e}")
            return self._create_fallback_architecture_result(str(e), path)

    def _collect_architecture_data(self, path_obj: Path) -> Dict[str, Any]:
        """Collect architectural data for validation."""
        python_files = list(path_obj.rglob("*.py"))
        total_files = len(python_files)
        large_files = []
        total_loc = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    loc = len([line for line in lines if line.strip() and not line.strip().startswith('#')])
                    total_loc += loc

                    if loc > MAXIMUM_FILE_LENGTH_LINES:  # Large file threshold
                        large_files.append({
                            "file": str(file_path.relative_to(path_obj)),
                            "lines_of_code": loc,
                            "complexity_indicator": "high" if loc > 1000 else "medium"
                        })
            except (IOError, UnicodeDecodeError):
                continue

        avg_file_size = total_loc / max(1, total_files)

        return {
            "total_files": total_files,
            "python_files": python_files,
            "large_files": large_files,
            "total_loc": total_loc,
            "avg_file_size": avg_file_size
        }

    def _run_architecture_validations(self, engine: ValidationEngine, arch_data: Dict) -> Dict:
        """Run all architecture validation strategies."""
        results = {}

        # File structure validation
        results["file_structure"] = engine.validate("file_structure", arch_data)

        # Complexity validation
        results["complexity"] = engine.validate("complexity", arch_data)

        # Coupling validation
        results["coupling"] = engine.validate("coupling", arch_data)

        # Maintainability validation
        results["maintainability"] = engine.validate("maintainability", arch_data)

        # Health validation (needs calculated metrics)
        health_data = {
            "coupling_score": 1.0 - results["coupling"].score,
            "complexity_score": 1.0 - results["complexity"].score,
            "maintainability_index": results["maintainability"].score
        }
        results["health"] = engine.validate("health", health_data)

        # Hotspot validation
        results["hotspots"] = engine.validate("hotspots", arch_data)

        return results

    def _build_architecture_result(self, arch_data: Dict, validation_results: Dict,
                                start_time: float, path: str) -> Dict[str, Any]:
        """Build comprehensive architecture analysis result."""
        # Extract metrics from validation results
        health_result = validation_results["health"]
        coupling_result = validation_results["coupling"]
        complexity_result = validation_results["complexity"]
        maintainability_result = validation_results["maintainability"]

        # Build hotspots from large files
        hotspots = []
        for large_file in arch_data["large_files"][:5]:  # Top 5 hotspots
            hotspots.append({
                "type": "god_object",
                "location": large_file["file"],
                "severity": "high" if large_file["lines_of_code"] > 1000 else "medium",
                "metrics": {
                    "lines_of_code": large_file["lines_of_code"],
                    "complexity_indicator": large_file["complexity_indicator"]
                },
                "recommendation": f"Consider refactoring {large_file['file']} into smaller, focused modules"
            })

        # Generate recommendations from validation results
        recommendations = self._generate_recommendations_from_validations(validation_results)

        # Analysis duration
        analysis_duration = time.time() - start_time

        return {
            "system_overview": {
                "architectural_health": round(health_result.score, MAXIMUM_RETRY_ATTEMPTS),
                "coupling_score": round(1.0 - coupling_result.score, 3),
                "complexity_score": round(1.0 - complexity_result.score, 3),
                "maintainability_index": round(maintainability_result.score, 3)
            },
            "hotspots": hotspots,
            "architectural_hotspots": hotspots,  # Backwards compatibility
            "metrics": {
                "total_components": arch_data["total_files"],
                "total_lines_of_code": arch_data["total_loc"],
                "average_file_size": round(arch_data["avg_file_size"], 1),
                "high_coupling_components": len([f for f in arch_data["large_files"] if f["lines_of_code"] > 800]),
                "god_objects_detected": len(arch_data["large_files"]),
                "god_object_ratio": round(len(arch_data["large_files"]) / max(1, arch_data["total_files"]), 3)
            },
            "recommendations": recommendations,
            "architectural_health": round(health_result.score, 3),
            "analysis_metadata": {
                "analysis_duration_seconds": round(analysis_duration, 3),
                "timestamp": self._get_iso_timestamp(),
                "path_analyzed": str(path),
                "analyzer_version": "2.0.0",
                "validation_scores": {name: result.score for name, result in validation_results.items()}
            }
        }

    def _generate_recommendations_from_validations(self, validation_results: Dict) -> List[str]:
        """Generate recommendations from validation results."""
        recommendations = []

        # Collect warnings from all validations
        for strategy_name, result in validation_results.items():
            for warning in result.warnings:
                recommendations.append(f"{strategy_name.title()}: {warning}")

        # Add specific recommendations based on scores
        if validation_results["coupling"].score < 0.6:
            recommendations.append("Implement interface segregation to reduce coupling")

        if validation_results["complexity"].score < 0.5:
            recommendations.append("Break down complex modules into smaller components")

        if validation_results["health"].score < 0.7:
            recommendations.append("Consider architectural refactoring to improve maintainability")

        if not recommendations:
            recommendations.append("Architecture is in good health - maintain current patterns")

        return recommendations
            
            # Extract architectural metrics
            architectural_metrics = self._calculate_architectural_metrics(violations_result)
            
            # Generate architecture-specific analysis
            return {
                "system_overview": {
                    "architectural_health": architectural_metrics["architectural_health"],
                    "coupling_score": architectural_metrics["coupling_score"],
                    "complexity_score": architectural_metrics["complexity_score"],
                    "maintainability_index": architectural_metrics["maintainability_index"]
                },
                "hotspots": self._identify_architectural_hotspots(violations_result),
                "recommendations": self._generate_architectural_recommendations(violations_result),
                "metrics": {
                    "total_components": architectural_metrics["total_components"],
                    "high_coupling_components": architectural_metrics["high_coupling_components"],
                    "god_objects_detected": len([v for v in violations_result.get("connascence", []) if "god_object" in str(v).lower()])
                },
                "architectural_health": architectural_metrics["architectural_health"]
            }
            
        except Exception as e:
            logger.error(f"Architecture analysis failed: {e}")
            return self._create_fallback_architecture_result(str(e), project_path)

    def _initialize_analyzers(self) -> Dict[str, Any]:
        """Initialize available analyzers. NASA Rule 4 compliant."""
        analyzers = {}
        
        try:
            # Try to import and initialize analyzers with proper error handling
            from analyzer.core.unified_imports import IMPORT_MANAGER
            
            # Initialize core components
            analyzer_result = IMPORT_MANAGER.import_analyzer_components()
            if analyzer_result.has_module:
                analyzers["ast_analyzer"] = analyzer_result.module.ConnascenceDetector()
            
            duplication_result = IMPORT_MANAGER.import_duplication_analyzer()
            if duplication_result.has_module:
                analyzers["mece_analyzer"] = duplication_result.module.UnifiedDuplicationAnalyzer()
            
        except Exception as e:
            logger.warning(f"Analyzer initialization failed: {e}")
        
        return analyzers

    def _calculate_architectural_metrics(self, violations_result: Dict) -> Dict[str, float]:
        """Calculate architectural health metrics. NASA Rule 4 compliant."""
        connascence_violations = violations_result.get("connascence", [])
        duplication_violations = violations_result.get("duplication", [])
        
        # Calculate base metrics
        total_violations = len(connascence_violations) + len(duplication_violations)
        critical_violations = len([v for v in connascence_violations if isinstance(v, dict) and v.get("severity") == "critical"])
        
        # Architectural health score (0.0 to 1.0)
        architectural_health = max(0.0, 1.0 - (total_violations * 0.01) - (critical_violations * MINIMUM_TRADE_THRESHOLD))
        
        # Coupling score (higher is worse, 0.0 to 1.0)
        coupling_violations = len([v for v in connascence_violations if isinstance(v, dict) and "coupling" in v.get("description", "").lower()])
        coupling_score = min(1.0, coupling_violations * MINIMUM_TRADE_THRESHOLD)
        
        return {
            "architectural_health": architectural_health,
            "coupling_score": coupling_score,
            "complexity_score": min(1.0, total_violations * 0.02),
            "maintainability_index": architectural_health * 0.8 + (1.0 - coupling_score) * 0.2,
            "total_components": max(1, len(set([v.get("file_path", "") for v in connascence_violations if isinstance(v, dict)]))),
            "high_coupling_components": max(0, coupling_violations)
        }

    def _identify_architectural_hotspots(self, violations_result: Dict) -> List[Dict[str, Any]]:
        """Identify architectural hotspots from violations. NASA Rule 4 compliant."""
        hotspots = []
        connascence_violations = violations_result.get("connascence", [])
        
        # Group violations by file to identify hotspots
        file_violation_counts = {}
        for violation in connascence_violations:
            if isinstance(violation, dict):
                file_path = violation.get("file_path", "unknown")
                file_violation_counts[file_path] = file_violation_counts.get(file_path, 0) + 1
        
        # Identify files with high violation counts as hotspots
        for file_path, count in file_violation_counts.items():
            if count >= MAXIMUM_NESTED_DEPTH:  # Threshold for hotspot detection
                hotspots.append({
                    "component": Path(file_path).name if file_path else "unknown",
                    "file": file_path,
                    "issue": f"High coupling detected: {count} violations",
                    "coupling_score": min(1.0, count * 0.1),
                    "complexity": count,
                    "recommendation": "Consider refactoring to reduce connascence violations",
                    "line": 1
                })
        
        return hotspots

    def _generate_architectural_recommendations(self, violations_result: Dict) -> List[str]:
        """Generate architectural recommendations. NASA Rule 4 compliant."""
        recommendations = []
        connascence_violations = violations_result.get("connascence", [])
        duplication_violations = violations_result.get("duplication", [])
        
        # Analyze violation patterns for recommendations
        if len(connascence_violations) > 20:
            recommendations.append("Consider refactoring high-coupling components")
        
        if len(duplication_violations) > 5:
            recommendations.append("Implement interface segregation for large classes")
        
        god_objects = len([v for v in connascence_violations if isinstance(v, dict) and "god_object" in str(v).lower()])
        if god_objects > 0:
            recommendations.append(f"Decompose {god_objects} god object(s) into focused classes")
        
        critical_violations = len([v for v in connascence_violations if isinstance(v, dict) and v.get("severity") == "critical"])
        if critical_violations > 10:
            recommendations.append("Address critical connascence violations immediately")
        
        if not recommendations:
            recommendations.append("Architecture quality is acceptable, continue monitoring")
        
        return recommendations

    def _create_fallback_architecture_result(self, error_message: str, project_path: str) -> Dict[str, Any]:
        """Create fallback architecture result for error cases. NASA Rule 4 compliant."""
        return {
            "system_overview": {
                "architectural_health": 0.75,  # Conservative fallback
                "coupling_score": 0.45,
                "complexity_score": 0.55,
                "maintainability_index": 0.65
            },
            "hotspots": [],
            "recommendations": [
                f"Analysis failed: {error_message}",
                "Unable to provide specific recommendations",
                "Consider running analysis manually for detailed results"
            ],
            "metrics": {
                "total_components": 1,
                "high_coupling_components": 0,
                "god_objects_detected": 0
            },
            "architectural_health": 0.75,
            "error": error_message,
            "fallback_mode": True
        }

# Compatibility alias for CI/CD imports
AnalysisOrchestrator = ArchitectureOrchestrator
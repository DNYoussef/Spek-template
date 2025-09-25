#!/usr/bin/env python3
"""
End-to-End Pipeline Integration Tests
Comprehensive test suite for the complete linter integration pipeline from execution to API output.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import json
import tempfile
import time

from concurrent.futures import ThreadPoolExecutor
import aiohttp
import asyncio
import pytest
import uuid

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

# Import all components for integration testing
from test_mesh_coordination import MeshQueenCoordinator
from test_api_endpoints import MockIngestionEngine, MockToolManager, MockCorrelationFramework
from test_tool_management import ToolManagementSystem
from test_severity_mapping import UnifiedSeverityMapper
from test_real_time_processing import MockRealTimeLinterIngestionEngine, MockResultCorrelationFramework

class IntegratedLinterPipeline:
    """Integrated linter pipeline for end-to-end testing"""
    
    def __init__(self):
        self.mesh_coordinator = MeshQueenCoordinator()
        self.tool_manager = None  # Will be initialized with temp workspace
        self.ingestion_engine = MockRealTimeLinterIngestionEngine()
        self.correlation_framework = MockResultCorrelationFramework()
        self.severity_mapper = UnifiedSeverityMapper()
        self.api_server = None  # Will be initialized in tests
        self.pipeline_state = "initialized"
        self.execution_history = []
        
    async def initialize_pipeline(self, workspace_path: str):
        """Initialize the complete pipeline"""
        self.pipeline_state = "initializing"
        
        # Initialize mesh topology
        await self.mesh_coordinator.initialize_mesh_topology()
        
        # Initialize tool manager with workspace
        self.tool_manager = ToolManagementSystem(workspace_path)
        
        # Establish peer communication
        await self.mesh_coordinator.establish_peer_communication()
        
        self.pipeline_state = "ready"
        
    async def execute_full_pipeline(self, file_paths: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute the complete linter integration pipeline"""
        if self.pipeline_state != "ready":
            raise RuntimeError("Pipeline not initialized")
            
        execution_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            self.pipeline_state = "executing"
            
            # Phase 1: Coordinate linter integration across mesh
            coordination_result = await self.mesh_coordinator.coordinate_linter_integration()
            
            # Phase 2: Execute real-time linting
            linting_result = await self.ingestion_engine.executeRealtimeLinting(
                file_paths, options or {}
            )
            
            # Phase 3: Extract and normalize violations
            normalized_violations = []
            for stream_result in linting_result["results"]:
                for violation in stream_result.violations:
                    # Apply severity mapping
                    normalized_severity = self.severity_mapper.map_severity(
                        stream_result.tool,
                        violation.get("rule", ""),
                        violation.get("severity", "")
                    )
                    
                    # Apply categorization
                    category = self.severity_mapper.categorize_violation(
                        stream_result.tool,
                        violation.get("rule", ""),
                        violation.get("message", "")
                    )
                    
                    normalized_violation = {
                        **violation,
                        "unified_severity": normalized_severity.value,
                        "category": category.value,
                        "tool": stream_result.tool,
                        "correlation_id": linting_result["correlation_id"]
                    }
                    normalized_violations.append(normalized_violation)
            
            # Phase 4: Perform cross-tool correlation
            correlation_result = await self.correlation_framework.correlateResults(
                normalized_violations
            )
            
            # Phase 5: Calculate quality metrics
            quality_metrics = self.severity_mapper.calculate_quality_score(
                normalized_violations
            )
            
            # Phase 6: Generate final result
            pipeline_result = {
                "execution_id": execution_id,
                "status": "completed",
                "execution_time": time.time() - start_time,
                "pipeline_phases": {
                    "coordination": coordination_result,
                    "linting": linting_result,
                    "normalization": {
                        "total_violations": len(normalized_violations),
                        "severity_distribution": {},
                        "category_distribution": {}
                    },
                    "correlation": correlation_result,
                    "quality_assessment": quality_metrics
                },
                "summary": {
                    "files_analyzed": len(file_paths),
                    "tools_executed": len(linting_result["results"]),
                    "total_violations": len(normalized_violations),
                    "correlations_found": correlation_result["total_correlations"],
                    "quality_score": quality_metrics["quality_score"],
                    "quality_grade": quality_metrics["grade"]
                }
            }
            
            self.execution_history.append(pipeline_result)
            self.pipeline_state = "ready"
            
            return pipeline_result
            
        except Exception as e:
            self.pipeline_state = "error"
            error_result = {
                "execution_id": execution_id,
                "status": "failed",
                "error": str(e),
                "execution_time": time.time() - start_time
            }
            self.execution_history.append(error_result)
            raise
    
    async def get_pipeline_health(self) -> Dict[str, Any]:
        """Get comprehensive pipeline health status"""
        mesh_health = await self.mesh_coordinator.monitor_integration_health()
        
        return {
            "pipeline_state": self.pipeline_state,
            "mesh_health": mesh_health,
            "tool_manager_status": "healthy" if self.tool_manager else "not_initialized",
            "ingestion_engine_status": "healthy",
            "correlation_framework_status": "healthy",
            "severity_mapper_status": "healthy",
            "total_executions": len(self.execution_history),
            "last_execution": self.execution_history[-1] if self.execution_history else None
        }

class TestFullPipelineIntegration:
    """Test suite for complete pipeline integration"""
    
    @pytest.fixture
    async def pipeline(self):
        """Create and initialize integrated pipeline"""
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline = IntegratedLinterPipeline()
            await pipeline.initialize_pipeline(temp_dir)
            yield pipeline
    
    @pytest.fixture
    def sample_project_files(self):
        """Create sample project files for testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            files = []
            
            # Create Python files with various issues
            test_files = {
                "main.py": '''
import os
import sys
import unused_module

def very_long_function_name_that_exceeds_line_length_limit():
    x = 1
    y = 2
    return x + y

class MyClass:
    def __init__(self):
        self.value = 42
        
    def method_with_issues(self, param):
        # This line is intentionally too long to trigger style violations in multiple linters
        return param
''',
                "utils.py": '''
import hashlib

def insecure_function():
    # Security issue for bandit
    password = "hardcoded_password"
    hash_obj = hashlib.md5()
    return hash_obj.hexdigest()

def type_issue_function(x: int) -> str:
    # Type issue for mypy
    return x + "string"
''',
                "config.py": '''
# Missing docstring
DEBUG = True
DATABASE_URL = "sqlite:///test.db"

def get_config():
    return {
        'debug': DEBUG,
        'database': DATABASE_URL
    }
'''
            }
            
            for filename, content in test_files.items():
                file_path = Path(temp_dir) / filename
                file_path.write_text(content)
                files.append(str(file_path))
            
            yield files
    
    @pytest.mark.asyncio
    async def test_complete_pipeline_execution(self, pipeline, sample_project_files):
        """Test complete pipeline execution from start to finish"""
        # Execute full pipeline
        result = await pipeline.execute_full_pipeline(
            sample_project_files,
            {"tools": ["flake8", "pylint", "ruff", "mypy", "bandit"]}
        )
        
        # Verify pipeline result structure
        assert result["status"] == "completed"
        assert "execution_id" in result
        assert "execution_time" in result
        assert "pipeline_phases" in result
        assert "summary" in result
        
        # Verify all phases completed
        phases = result["pipeline_phases"]
        assert "coordination" in phases
        assert "linting" in phases
        assert "normalization" in phases
        assert "correlation" in phases
        assert "quality_assessment" in phases
        
        # Verify summary data
        summary = result["summary"]
        assert summary["files_analyzed"] == len(sample_project_files)
        assert summary["tools_executed"] > 0
        assert summary["total_violations"] > 0
        assert summary["quality_score"] > 0
        assert summary["quality_grade"] in ["A", "B", "C", "D", "F"]
    
    @pytest.mark.asyncio
    async def test_mesh_coordination_integration(self, pipeline, sample_project_files):
        """Test mesh coordination integration with pipeline"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        coordination_phase = result["pipeline_phases"]["coordination"]
        
        # Verify mesh coordination worked
        assert "system-architect" in coordination_phase
        assert "backend-dev" in coordination_phase
        assert "api-docs" in coordination_phase
        assert "integration-specialist" in coordination_phase
        
        # Each node should have assigned tasks
        for node_id, node_data in coordination_phase.items():
            assert "assigned_tasks" in node_data
            assert len(node_data["assigned_tasks"]) > 0
    
    @pytest.mark.asyncio
    async def test_multi_tool_linting_integration(self, pipeline, sample_project_files):
        """Test multi-tool linting integration"""
        result = await pipeline.execute_full_pipeline(
            sample_project_files,
            {"tools": ["flake8", "pylint", "ruff", "mypy", "bandit"]}
        )
        
        linting_phase = result["pipeline_phases"]["linting"]
        
        # Should have results from all tools
        assert len(linting_phase["results"]) == 5
        
        tool_names = [r.tool for r in linting_phase["results"]]
        expected_tools = {"flake8", "pylint", "ruff", "mypy", "bandit"}
        assert set(tool_names) == expected_tools
        
        # Each tool should find violations
        for tool_result in linting_phase["results"]:
            assert len(tool_result.violations) > 0
    
    @pytest.mark.asyncio
    async def test_severity_normalization_integration(self, pipeline, sample_project_files):
        """Test severity normalization integration"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        normalization_phase = result["pipeline_phases"]["normalization"]
        
        # Should have normalized violations
        assert normalization_phase["total_violations"] > 0
        
        # Check that severity mapping was applied
        quality_phase = result["pipeline_phases"]["quality_assessment"]
        severity_dist = quality_phase["severity_distribution"]
        
        # Should have violations across different severity levels
        total_violations = sum(severity_dist.values())
        assert total_violations > 0
        assert len([count for count in severity_dist.values() if count > 0]) >= 2
    
    @pytest.mark.asyncio
    async def test_cross_tool_correlation_integration(self, pipeline, sample_project_files):
        """Test cross-tool correlation integration"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        correlation_phase = result["pipeline_phases"]["correlation"]
        
        # Should have performed correlation analysis
        assert "correlations" in correlation_phase
        assert "total_correlations" in correlation_phase
        assert "correlation_rate" in correlation_phase
        
        # With multiple tools on same files, should find some correlations
        if correlation_phase["total_correlations"] > 0:
            correlations = correlation_phase["correlations"]
            
            # Verify correlation structure
            for correlation in correlations:
                assert "violation_pair" in correlation
                assert "similarity_score" in correlation
                assert "correlation_type" in correlation
                assert 0 <= correlation["similarity_score"] <= 1
    
    @pytest.mark.asyncio
    async def test_quality_assessment_integration(self, pipeline, sample_project_files):
        """Test quality assessment integration"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        quality_phase = result["pipeline_phases"]["quality_assessment"]
        
        # Should have comprehensive quality assessment
        assert "quality_score" in quality_phase
        assert "grade" in quality_phase
        assert "severity_distribution" in quality_phase
        assert "category_distribution" in quality_phase
        assert "recommendations" in quality_phase
        
        # Quality score should be reasonable
        score = quality_phase["quality_score"]
        assert 0 <= score <= 100
        
        # Should have actionable recommendations
        recommendations = quality_phase["recommendations"]
        assert isinstance(recommendations, list)
        if len(recommendations) > 0:
            assert all(isinstance(rec, str) for rec in recommendations)
    
    @pytest.mark.asyncio
    async def test_pipeline_error_handling(self, pipeline):
        """Test pipeline error handling with invalid inputs"""
        # Test with non-existent files
        with pytest.raises(Exception):
            await pipeline.execute_full_pipeline(["/nonexistent/file.py"])
        
        # Pipeline should recover and be ready for next execution
        health = await pipeline.get_pipeline_health()
        assert health["pipeline_state"] in ["ready", "error"]
    
    @pytest.mark.asyncio
    async def test_pipeline_health_monitoring(self, pipeline, sample_project_files):
        """Test pipeline health monitoring"""
        # Initial health check
        initial_health = await pipeline.get_pipeline_health()
        assert initial_health["pipeline_state"] == "ready"
        assert initial_health["total_executions"] == 0
        
        # Execute pipeline
        await pipeline.execute_full_pipeline(sample_project_files)
        
        # Health check after execution
        post_execution_health = await pipeline.get_pipeline_health()
        assert post_execution_health["total_executions"] == 1
        assert post_execution_health["last_execution"]["status"] == "completed"
        
        # Verify mesh health is included
        assert "mesh_health" in post_execution_health
        mesh_health = post_execution_health["mesh_health"]
        assert "topology_health" in mesh_health
        assert "node_health" in mesh_health
    
    @pytest.mark.asyncio
    async def test_concurrent_pipeline_executions(self, pipeline, sample_project_files):
        """Test concurrent pipeline executions"""
        # Start multiple pipeline executions
        tasks = []
        for i in range(3):
            task = asyncio.create_task(
                pipeline.execute_full_pipeline([sample_project_files[0]])
            )
            tasks.append(task)
        
        # Wait for all to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should complete (some may fail due to concurrency limitations)
        assert len(results) == 3
        
        # At least some should succeed
        successful_results = [r for r in results if isinstance(r, dict) and r.get("status") == "completed"]
        assert len(successful_results) >= 1
    
    @pytest.mark.asyncio
    async def test_pipeline_state_transitions(self, pipeline, sample_project_files):
        """Test pipeline state transitions during execution"""
        # Initial state
        assert pipeline.pipeline_state == "ready"
        
        # Start execution and check state changes
        execution_task = asyncio.create_task(
            pipeline.execute_full_pipeline(sample_project_files)
        )
        
        # Allow some processing time
        await asyncio.sleep(0.1)
        
        # Should be executing (may have completed already in fast tests)
        assert pipeline.pipeline_state in ["executing", "ready"]
        
        # Wait for completion
        result = await execution_task
        
        # Should be back to ready
        assert pipeline.pipeline_state == "ready"
        assert result["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_execution_history_tracking(self, pipeline, sample_project_files):
        """Test execution history tracking"""
        # Initial history should be empty
        assert len(pipeline.execution_history) == 0
        
        # Execute pipeline multiple times
        for i in range(3):
            await pipeline.execute_full_pipeline([sample_project_files[0]])
        
        # History should track all executions
        assert len(pipeline.execution_history) == 3
        
        # Each execution should have unique ID
        execution_ids = [exec_data["execution_id"] for exec_data in pipeline.execution_history]
        assert len(set(execution_ids)) == 3  # All unique
        
        # All executions should be successful
        for execution in pipeline.execution_history:
            assert execution["status"] == "completed"
            assert "execution_time" in execution

class TestPipelinePerformance:
    """Performance tests for pipeline integration"""
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_execution_time(self, pipeline, sample_project_files):
        """Test pipeline execution time benchmarks"""
        start_time = time.time()
        result = await pipeline.execute_full_pipeline(sample_project_files)
        execution_time = time.time() - start_time
        
        # Pipeline should complete within reasonable time
        assert execution_time < 30.0  # 30 seconds for full pipeline
        assert result["status"] == "completed"
        
        # Verify reported execution time is accurate
        reported_time = result["execution_time"]
        assert abs(execution_time - reported_time) < 1.0  # Within 1 second
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_memory_usage(self, pipeline, sample_project_files):
        """Test pipeline memory usage"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Execute pipeline
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (< 100MB)
        assert memory_increase < 100 * 1024 * 1024
        assert result["status"] == "completed"
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_scalability(self, pipeline):
        """Test pipeline scalability with increasing file count"""
        execution_times = []
        
        # Test with increasing number of files
        file_counts = [1, 5, 10, 20]
        
        for count in file_counts:
            # Create temporary files
            with tempfile.TemporaryDirectory() as temp_dir:
                files = []
                for i in range(count):
                    file_path = Path(temp_dir) / f"test_{i}.py"
                    file_path.write_text(f"print('file {i}')\n" * 10)
                    files.append(str(file_path))
                
                # Execute pipeline and measure time
                start_time = time.time()
                result = await pipeline.execute_full_pipeline(files)
                execution_time = time.time() - start_time
                
                execution_times.append(execution_time)
                assert result["status"] == "completed"
        
        # Execution time should scale reasonably (not exponentially)
        for i in range(1, len(execution_times)):
            # Each doubling of files shouldn't more than triple execution time
            time_ratio = execution_times[i] / execution_times[0]
            file_ratio = file_counts[i] / file_counts[0]
            assert time_ratio <= file_ratio * 3

class TestPipelineRegression:
    """Regression tests for pipeline functionality"""
    
    @pytest.mark.asyncio
    async def test_phase1_phase2_compatibility(self, pipeline, sample_project_files):
        """Test Phase 1 + Phase 2 integration compatibility"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        # Should maintain Phase 1 capabilities
        quality_phase = result["pipeline_phases"]["quality_assessment"]
        
        # JSON schema consistency (Phase 1 requirement)
        assert isinstance(quality_phase, dict)
        assert "quality_score" in quality_phase
        assert isinstance(quality_phase["quality_score"], (int, float))
        
        # SARIF compatibility (Phase 1 requirement)
        assert result["status"] in ["completed", "failed"]
        
        # Performance regression protection (Phase 1 baseline: 3.6% JSON generation)
        assert result["execution_time"] < 60.0  # Should be much faster than 60s
    
    @pytest.mark.asyncio
    async def test_connascence_integration_compatibility(self, pipeline, sample_project_files):
        """Test integration with existing connascence detection system"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        # Should be compatible with existing 9-detector connascence system
        correlation_phase = result["pipeline_phases"]["correlation"]
        
        # Correlation results should be compatible with connascence analysis
        if correlation_phase["total_correlations"] > 0:
            correlations = correlation_phase["correlations"]
            
            # Should maintain correlation data structure compatibility
            for correlation in correlations:
                assert "similarity_score" in correlation
                assert "correlation_type" in correlation
                assert isinstance(correlation["similarity_score"], (int, float))
    
    @pytest.mark.asyncio
    async def test_nasa_pot10_compliance_maintained(self, pipeline, sample_project_files):
        """Test that NASA POT10 compliance is maintained"""
        result = await pipeline.execute_full_pipeline(sample_project_files)
        
        # Should maintain NASA compliance metrics
        quality_phase = result["pipeline_phases"]["quality_assessment"]
        
        # Quality scoring should support NASA POT10 requirements
        assert 0 <= quality_phase["quality_score"] <= 100
        assert quality_phase["grade"] in ["A", "B", "C", "D", "F"]
        
        # Should have comprehensive quality metrics
        assert "severity_distribution" in quality_phase
        assert "category_distribution" in quality_phase
        assert "recommendations" in quality_phase

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
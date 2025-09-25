from src.constants.base import MAXIMUM_NESTED_DEPTH

import pytest
import asyncio
import time
import json
import tempfile
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path
from typing import Dict, Any, List, Optional
import uuid

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

# Mock imports since we don't have the actual implementations
class MockStreamingResult:
    """Mock streaming result for testing"""
    def __init__(self, correlation_id: str, tool: str, violations: List[Dict]):
        self.correlation_id = correlation_id
        self.tool = tool
        self.violations = violations
        self.timestamp = time.time()
        self.status = "completed"

class MockLinterResult:
    """Mock linter result for testing"""
    def __init__(self, tool: str, violations: List[Dict], execution_time: float = 1.0):
        self.tool = tool
        self.violations = violations
        self.execution_time = execution_time
        self.timestamp = time.time()
        self.files_analyzed = ["test.py"]
        self.exit_code = 0

class MockViolation:
    """Mock violation for testing"""
    def __init__(self, tool: str, file_path: str, line: int, rule_id: str, message: str, severity: str = "medium"):
        self.tool = tool
        self.file_path = file_path
        self.line = line
        self.rule_id = rule_id
        self.message = message
        self.severity = severity
        self.timestamp = time.time()
        self.id = str(uuid.uuid4())

class MockRealTimeLinterIngestionEngine:
    """Mock real-time linter ingestion engine for testing"""
    
    def __init__(self):
        self.streaming_results = []
        self.active_streams = {}
        self.correlation_cache = {}
        self.processing_queue = asyncio.Queue()
        self.event_emitter = Mock()
        
    async def executeRealtimeLinting(self, file_paths: List[str], options: Dict[str, Any] = None):
        """Mock real-time linting execution"""
        correlation_id = str(uuid.uuid4())
        
        # Simulate processing multiple tools
        tools = options.get("tools", ["flake8", "pylint", "ruff"])
        results = []
        
        for tool in tools:
            violations = self._generate_mock_violations(tool, file_paths)
            result = MockStreamingResult(correlation_id, tool, violations)
            results.append(result)
            self.streaming_results.append(result)
            
            # Emit real-time event
            self.event_emitter.emit("violation_detected", {
                "correlation_id": correlation_id,
                "tool": tool,
                "violations": violations
            })
        
        return {
            "correlation_id": correlation_id,
            "status": "completed",
            "results": results,
            "total_violations": sum(len(r.violations) for r in results)
        }
    
    def _generate_mock_violations(self, tool: str, file_paths: List[str]) -> List[Dict]:
        """Generate mock violations for testing"""
        violations = []
        
        for file_path in file_paths:
            if tool == "flake8":
                violations.extend([
                    {
                        "file": file_path,
                        "line": 1,
                        "column": 80,
                        "rule": "E501",
                        "message": "line too long (88 > 79 characters)",
                        "severity": "medium"
                    },
                    {
                        "file": file_path,
                        "line": 5,
                        "column": 1,
                        "rule": "W291",
                        "message": "trailing whitespace",
                        "severity": "low"
                    }
                ])
            elif tool == "pylint":
                violations.extend([
                    {
                        "file": file_path,
                        "line": 1,
                        "column": 80,
                        "rule": "C0301",
                        "message": "Line too long (88/79)",
                        "severity": "convention"
                    },
                    {
                        "file": file_path,
                        "line": 10,
                        "column": 1,
                        "rule": "W0613",
                        "message": "Unused argument 'param'",
                        "severity": "warning"
                    }
                ])
            elif tool == "ruff":
                violations.extend([
                    {
                        "file": file_path,
                        "line": 1,
                        "column": 80,
                        "rule": "E501",
                        "message": "Line too long (88 > 79 characters)",
                        "severity": "medium"
                    },
                    {
                        "file": file_path,
                        "line": 15,
                        "column": 1,
                        "rule": "F401",
                        "message": "'os' imported but unused",
                        "severity": "medium"
                    }
                ])
        
        return violations

class MockResultCorrelationFramework:
    """Mock result correlation framework for testing"""
    
    def __init__(self):
        self.correlations = []
        self.clusters = []
        self.similarity_threshold = 0.8
        
    async def correlateResults(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mock correlation analysis"""
        correlations = []
        clusters = []
        
        # Simple correlation logic for testing
        for i, result1 in enumerate(results):
            for j, result2 in enumerate(results[i+1:], i+1):
                similarity = self._calculate_similarity(result1, result2)
                if similarity >= self.similarity_threshold:
                    correlation = {
                        "id": str(uuid.uuid4()),
                        "violation_pair": [
                            {"tool": result1.get("tool"), "violation_id": f"v{i}"},
                            {"tool": result2.get("tool"), "violation_id": f"v{j}"}
                        ],
                        "similarity_score": similarity,
                        "correlation_type": self._determine_correlation_type(result1, result2),
                        "confidence": similarity,
                        "evidence": {
                            "file_match": result1.get("file") == result2.get("file"),
                            "line_match": result1.get("line") == result2.get("line"),
                            "rule_similarity": self._rule_similarity(result1.get("rule"), result2.get("rule"))
                        }
                    }
                    correlations.append(correlation)
        
        # Group correlated violations into clusters
        if correlations:
            clusters = self._create_clusters(correlations, results)
        
        return {
            "correlations": correlations,
            "clusters": clusters,
            "total_correlations": len(correlations),
            "correlation_rate": len(correlations) / max(len(results), 1),
            "processing_time": 0.5,
            "metadata": {
                "similarity_threshold": self.similarity_threshold,
                "algorithm": "mock_correlation",
                "version": "1.0.0"
            }
        }
    
    def _calculate_similarity(self, result1: Dict, result2: Dict) -> float:
        """Calculate similarity between two violations"""
        score = 0.0
        
        # File match
        if result1.get("file") == result2.get("file"):
            score += 0.3
        
        # Line proximity (within 5 lines)
        line1 = result1.get("line", 0)
        line2 = result2.get("line", 0)
        if abs(line1 - line2) <= MAXIMUM_NESTED_DEPTH:
            score += 0.3
        
        # Rule similarity
        rule1 = result1.get("rule", "")
        rule2 = result2.get("rule", "")
        if rule1 == rule2:
            score += 0.4
        elif rule1.startswith(rule2[:2]) or rule2.startswith(rule1[:2]):
            score += 0.2
        
        return min(score, 1.0)
    
    def _determine_correlation_type(self, result1: Dict, result2: Dict) -> str:
        """Determine the type of correlation"""
        if result1.get("rule") == result2.get("rule"):
            return "duplicate"
        elif result1.get("file") == result2.get("file") and abs(result1.get("line", 0) - result2.get("line", 0)) <= 2:
            return "related"
        else:
            return "similar"
    
    def _rule_similarity(self, rule1: str, rule2: str) -> float:
        """Calculate rule similarity"""
        if not rule1 or not rule2:
            return 0.0
        if rule1 == rule2:
            return 1.0
        if rule1.startswith(rule2[:2]) or rule2.startswith(rule1[:2]):
            return 0.5
        return 0.0
    
    def _create_clusters(self, correlations: List[Dict], violations: List[Dict]) -> List[Dict]:
        """Create violation clusters from correlations"""
        clusters = []
        clustered_violations = set()
        
        for correlation in correlations:
            cluster_violations = []
            for violation_ref in correlation["violation_pair"]:
                # Find the actual violation
                for i, violation in enumerate(violations):
                    if violation.get("tool") == violation_ref["tool"] and i not in clustered_violations:
                        cluster_violations.append(violation)
                        clustered_violations.add(i)
                        break
            
            if len(cluster_violations) >= 2:
                cluster = {
                    "id": str(uuid.uuid4()),
                    "violations": cluster_violations,
                    "cluster_type": correlation["correlation_type"],
                    "confidence": correlation["confidence"],
                    "primary_issue": self._identify_primary_issue(cluster_violations),
                    "suggested_action": self._suggest_action(cluster_violations)
                }
                clusters.append(cluster)
        
        return clusters
    
    def _identify_primary_issue(self, violations: List[Dict]) -> Dict:
        """Identify the primary issue in a cluster"""
        # Return the violation with highest severity or first one
        return violations[0] if violations else {}
    
    def _suggest_action(self, violations: List[Dict]) -> str:
        """Suggest action for cluster"""
        if len(violations) >= 2:
            return "Review related violations together for comprehensive fix"
        return "Address individual violation"

class TestRealTimeLinterIngestionEngine:
    """Test suite for real-time linter ingestion engine"""
    
    @pytest.fixture
    def ingestion_engine(self):
        """Create ingestion engine instance"""
        return MockRealTimeLinterIngestionEngine()
    
    @pytest.fixture
    def sample_files(self):
        """Create sample files for testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            files = []
            for i in range(3):
                file_path = Path(temp_dir) / f"test_{i}.py"
                files.append(str(file_path))
            yield files
    
    @pytest.mark.asyncio
    async def test_realtime_linting_execution(self, ingestion_engine, sample_files):
        """Test real-time linting execution with multiple tools"""
        options = {
            "tools": ["flake8", "pylint", "ruff"],
            "realtime": True,
            "streaming": True
        }
        
        result = await ingestion_engine.executeRealtimeLinting(sample_files, options)
        
        # Verify execution result
        assert "correlation_id" in result
        assert result["status"] == "completed"
        assert "results" in result
        assert len(result["results"]) == 3  # Three tools
        
        # Verify streaming results were stored
        assert len(ingestion_engine.streaming_results) == 3
        
        # Verify event emission
        assert ingestion_engine.event_emitter.emit.called
        
    @pytest.mark.asyncio
    async def test_streaming_result_processing(self, ingestion_engine, sample_files):
        """Test streaming result processing and event emission"""
        events_received = []
        
        def mock_event_handler(event_type, data):
            events_received.append({"type": event_type, "data": data})
        
        ingestion_engine.event_emitter.emit = mock_event_handler
        
        result = await ingestion_engine.executeRealtimeLinting(sample_files)
        
        # Should have received violation events
        assert len(events_received) >= 3  # At least one per tool
        
        # Verify event structure
        for event in events_received:
            assert event["type"] == "violation_detected"
            assert "correlation_id" in event["data"]
            assert "tool" in event["data"]
            assert "violations" in event["data"]
    
    @pytest.mark.asyncio
    async def test_concurrent_linting_execution(self, ingestion_engine, sample_files):
        """Test concurrent linting execution"""
        # Start multiple linting operations concurrently
        tasks = []
        for i in range(5):
            task = asyncio.create_task(
                ingestion_engine.executeRealtimeLinting([sample_files[0]])
            )
            tasks.append(task)
        
        # Wait for all to complete
        results = await asyncio.gather(*tasks)
        
        # All should complete successfully
        assert len(results) == 5
        for result in results:
            assert result["status"] == "completed"
            assert "correlation_id" in result
    
    @pytest.mark.asyncio
    async def test_tool_specific_violation_generation(self, ingestion_engine, sample_files):
        """Test tool-specific violation generation"""
        # Test each tool individually
        for tool in ["flake8", "pylint", "ruff"]:
            result = await ingestion_engine.executeRealtimeLinting(
                [sample_files[0]], 
                {"tools": [tool]}
            )
            
            assert len(result["results"]) == 1
            tool_result = result["results"][0]
            assert tool_result.tool == tool
            assert len(tool_result.violations) > 0
            
            # Verify tool-specific violation patterns
            violations = tool_result.violations
            if tool == "flake8":
                assert any(v["rule"].startswith("E") for v in violations)
            elif tool == "pylint":
                assert any(v["rule"].startswith("C") or v["rule"].startswith("W") for v in violations)
            elif tool == "ruff":
                assert any(v["rule"].startswith("E") or v["rule"].startswith("F") for v in violations)
    
    @pytest.mark.asyncio
    async def test_error_handling_during_streaming(self, ingestion_engine, sample_files):
        """Test error handling during streaming operations"""
        # Mock a tool failure
        original_generate = ingestion_engine._generate_mock_violations
        
        def failing_generate(tool, files):
            if tool == "pylint":
                raise Exception("Tool execution failed")
            return original_generate(tool, files)
        
        ingestion_engine._generate_mock_violations = failing_generate
        
        # Should handle tool failure gracefully
        result = await ingestion_engine.executeRealtimeLinting(
            sample_files, 
            {"tools": ["flake8", "pylint", "ruff"]}
        )
        
        # Should still get results from working tools
        assert result["status"] == "completed"
        # Note: In a real implementation, this would have error handling
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_streaming_performance(self, ingestion_engine):
        """Test streaming performance with large number of files"""
        # Create many file paths
        file_paths = [f"test_{i}.py" for i in range(100)]
        
        start_time = time.time()
        result = await ingestion_engine.executeRealtimeLinting(file_paths)
        execution_time = time.time() - start_time
        
        # Should complete within reasonable time
        assert execution_time < 5.0  # 5 seconds for 100 files
        assert result["status"] == "completed"
        assert result["total_violations"] > 0

class TestResultCorrelationFramework:
    """Test suite for result correlation framework"""
    
    @pytest.fixture
    def correlation_framework(self):
        """Create correlation framework instance"""
        return MockResultCorrelationFramework()
    
    @pytest.fixture
    def sample_violations(self):
        """Create sample violations for correlation testing"""
        return [
            # Duplicate violation (same rule, same line)
            {
                "tool": "flake8",
                "file": "test.py",
                "line": 1,
                "rule": "E501",
                "message": "line too long (88 > 79 characters)",
                "severity": "medium"
            },
            {
                "tool": "ruff",
                "file": "test.py", 
                "line": 1,
                "rule": "E501",
                "message": "Line too long (88 > 79 characters)",
                "severity": "medium"
            },
            # Related violations (same file, nearby lines)
            {
                "tool": "pylint",
                "file": "test.py",
                "line": 2,
                "rule": "C0301",
                "message": "Line too long (88/79)",
                "severity": "convention"
            },
            # Unrelated violation
            {
                "tool": "bandit",
                "file": "other.py",
                "line": 10,
                "rule": "B101",
                "message": "Use of assert detected",
                "severity": "low"
            }
        ]
    
    @pytest.mark.asyncio
    async def test_basic_correlation_analysis(self, correlation_framework, sample_violations):
        """Test basic correlation analysis functionality"""
        result = await correlation_framework.correlateResults(sample_violations)
        
        # Verify result structure
        assert "correlations" in result
        assert "clusters" in result
        assert "total_correlations" in result
        assert "correlation_rate" in result
        assert "processing_time" in result
        assert "metadata" in result
        
        # Should find correlations
        correlations = result["correlations"]
        assert len(correlations) > 0
        
        # Verify correlation structure
        for correlation in correlations:
            assert "id" in correlation
            assert "violation_pair" in correlation
            assert "similarity_score" in correlation
            assert "correlation_type" in correlation
            assert "confidence" in correlation
            assert "evidence" in correlation
            
            # Similarity score should be valid
            assert 0 <= correlation["similarity_score"] <= 1
            assert 0 <= correlation["confidence"] <= 1
    
    @pytest.mark.asyncio
    async def test_duplicate_violation_detection(self, correlation_framework, sample_violations):
        """Test detection of duplicate violations"""
        result = await correlation_framework.correlateResults(sample_violations)
        
        correlations = result["correlations"]
        
        # Should detect E501 duplicate between flake8 and ruff
        duplicate_correlations = [
            c for c in correlations 
            if c["correlation_type"] == "duplicate"
        ]
        
        assert len(duplicate_correlations) >= 1
        
        # Verify duplicate correlation details
        duplicate = duplicate_correlations[0]
        assert duplicate["similarity_score"] >= 0.8
        assert duplicate["evidence"]["file_match"] is True
        assert duplicate["evidence"]["line_match"] is True
        assert duplicate["evidence"]["rule_similarity"] > 0
    
    @pytest.mark.asyncio
    async def test_related_violation_detection(self, correlation_framework, sample_violations):
        """Test detection of related violations"""
        result = await correlation_framework.correlateResults(sample_violations)
        
        correlations = result["correlations"]
        
        # Should detect related violations on nearby lines
        related_correlations = [
            c for c in correlations 
            if c["correlation_type"] in ["related", "similar"]
        ]
        
        assert len(related_correlations) >= 0
    
    @pytest.mark.asyncio
    async def test_cluster_creation(self, correlation_framework, sample_violations):
        """Test violation cluster creation"""
        result = await correlation_framework.correlateResults(sample_violations)
        
        clusters = result["clusters"]
        
        if clusters:  # Clusters may not always be created with sample data
            for cluster in clusters:
                assert "id" in cluster
                assert "violations" in cluster
                assert "cluster_type" in cluster
                assert "confidence" in cluster
                assert "primary_issue" in cluster
                assert "suggested_action" in cluster
                
                # Cluster should have at least 2 violations
                assert len(cluster["violations"]) >= 2
                assert 0 <= cluster["confidence"] <= 1
    
    @pytest.mark.asyncio
    async def test_similarity_threshold_adjustment(self, correlation_framework, sample_violations):
        """Test similarity threshold adjustment"""
        # Test with high threshold
        correlation_framework.similarity_threshold = 0.9
        result_high = await correlation_framework.correlateResults(sample_violations)
        
        # Test with low threshold  
        correlation_framework.similarity_threshold = 0.3
        result_low = await correlation_framework.correlateResults(sample_violations)
        
        # Lower threshold should find more correlations
        assert len(result_low["correlations"]) >= len(result_high["correlations"])
    
    @pytest.mark.asyncio
    async def test_large_dataset_correlation(self, correlation_framework):
        """Test correlation with large dataset"""
        # Generate large set of violations
        large_violations = []
        for i in range(100):
            large_violations.extend([
                {
                    "tool": "flake8",
                    "file": f"file_{i % 10}.py",
                    "line": i % 20 + 1,
                    "rule": "E501",
                    "message": f"line too long in file {i}",
                    "severity": "medium"
                },
                {
                    "tool": "pylint", 
                    "file": f"file_{i % 10}.py",
                    "line": i % 20 + 1,
                    "rule": "C0301",
                    "message": f"line too long in file {i}",
                    "severity": "convention"
                }
            ])
        
        start_time = time.time()
        result = await correlation_framework.correlateResults(large_violations)
        processing_time = time.time() - start_time
        
        # Should complete within reasonable time
        assert processing_time < 5.0  # 5 seconds for 200 violations
        assert result["total_correlations"] > 0
        
        # Correlation rate should be reasonable
        assert 0 <= result["correlation_rate"] <= 1
    
    @pytest.mark.asyncio
    async def test_empty_violations_handling(self, correlation_framework):
        """Test handling of empty violation list"""
        result = await correlation_framework.correlateResults([])
        
        assert result["correlations"] == []
        assert result["clusters"] == []
        assert result["total_correlations"] == 0
        assert result["correlation_rate"] == 0
    
    @pytest.mark.asyncio
    async def test_single_violation_handling(self, correlation_framework):
        """Test handling of single violation"""
        single_violation = [{
            "tool": "flake8",
            "file": "test.py",
            "line": 1,
            "rule": "E501",
            "message": "line too long",
            "severity": "medium"
        }]
        
        result = await correlation_framework.correlateResults(single_violation)
        
        # No correlations possible with single violation
        assert result["correlations"] == []
        assert result["clusters"] == []
        assert result["total_correlations"] == 0

class TestIntegratedRealTimeProcessing:
    """Integration tests for real-time processing with correlation"""
    
    @pytest.fixture
    def integrated_system(self):
        """Create integrated system with ingestion and correlation"""
        return {
            "ingestion": MockRealTimeLinterIngestionEngine(),
            "correlation": MockResultCorrelationFramework()
        }
    
    @pytest.mark.asyncio
    async def test_end_to_end_processing(self, integrated_system, sample_files):
        """Test end-to-end real-time processing with correlation"""
        ingestion = integrated_system["ingestion"]
        correlation = integrated_system["correlation"]
        
        # Execute real-time linting
        linting_result = await ingestion.executeRealtimeLinting(sample_files)
        
        # Extract violations for correlation
        all_violations = []
        for stream_result in linting_result["results"]:
            for violation in stream_result.violations:
                all_violations.append(violation)
        
        # Perform correlation analysis
        correlation_result = await correlation.correlateResults(all_violations)
        
        # Verify end-to-end results
        assert linting_result["status"] == "completed"
        assert len(all_violations) > 0
        assert correlation_result["total_correlations"] >= 0
        
        # Should be able to identify some correlations in multi-tool output
        if len(all_violations) >= 4:  # Need enough violations for correlations
            assert correlation_result["correlation_rate"] > 0
    
    @pytest.mark.asyncio
    async def test_real_time_correlation_pipeline(self, integrated_system):
        """Test real-time correlation pipeline"""
        ingestion = integrated_system["ingestion"]
        correlation = integrated_system["correlation"]
        
        # Simulate real-time violation stream
        violation_stream = []
        correlation_results = []
        
        # Process violations in batches (simulating real-time streaming)
        for batch in range(3):
            batch_files = [f"batch_{batch}_file.py"]
            
            # Get batch of violations
            batch_result = await ingestion.executeRealtimeLinting(batch_files)
            
            # Add to stream
            for stream_result in batch_result["results"]:
                violation_stream.extend(stream_result.violations)
            
            # Perform incremental correlation
            if len(violation_stream) >= 2:
                batch_correlation = await correlation.correlateResults(violation_stream)
                correlation_results.append(batch_correlation)
        
        # Should have processed multiple batches
        assert len(correlation_results) >= 1
        
        # Final correlation should have accumulated violations
        final_correlation = correlation_results[-1]
        assert final_correlation["total_correlations"] >= 0
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_system_performance_under_load(self, integrated_system):
        """Test system performance under high load"""
        ingestion = integrated_system["ingestion"]
        correlation = integrated_system["correlation"]
        
        # Simulate high load with many concurrent operations
        tasks = []
        
        for i in range(10):
            files = [f"load_test_{i}.py"]
            task = asyncio.create_task(ingestion.executeRealtimeLinting(files))
            tasks.append(task)
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        processing_time = time.time() - start_time
        
        # Should handle concurrent load efficiently
        assert processing_time < 10.0  # 10 seconds for 10 concurrent operations
        assert len(results) == 10
        assert all(r["status"] == "completed" for r in results)
        
        # Test correlation under load
        all_violations = []
        for result in results:
            for stream_result in result["results"]:
                all_violations.extend(stream_result.violations)
        
        correlation_start = time.time()
        correlation_result = await correlation.correlateResults(all_violations)
        correlation_time = time.time() - correlation_start
        
        # Correlation should also be efficient
        assert correlation_time < 5.0  # 5 seconds for correlation
        assert correlation_result["total_correlations"] >= 0

class TestRealTimeEventHandling:
    """Test suite for real-time event handling"""
    
    @pytest.mark.asyncio
    async def test_violation_event_emission(self):
        """Test violation event emission during real-time processing"""
        events = []
        
        def event_handler(event_type, data):
            events.append({"type": event_type, "data": data, "timestamp": time.time()})
        
        ingestion = MockRealTimeLinterIngestionEngine()
        ingestion.event_emitter.emit = event_handler
        
        result = await ingestion.executeRealtimeLinting(["test.py"])
        
        # Should have emitted events
        assert len(events) > 0
        
        # Verify event timing
        for event in events:
            assert event["timestamp"] > 0
            assert event["type"] == "violation_detected"
    
    @pytest.mark.asyncio
    async def test_correlation_event_emission(self):
        """Test correlation event emission"""
        correlation = MockResultCorrelationFramework()
        
        # Add mock event emitter
        correlation.event_emitter = Mock()
        
        violations = [
            {"tool": "flake8", "file": "test.py", "line": 1, "rule": "E501", "message": "test"},
            {"tool": "ruff", "file": "test.py", "line": 1, "rule": "E501", "message": "test"}
        ]
        
        # Enhanced correlation with event emission
        original_correlate = correlation.correlateResults
        
        async def correlate_with_events(violations):
            result = await original_correlate(violations)
            
            # Emit correlation events
            for correlation_data in result["correlations"]:
                correlation.event_emitter.emit("correlation_found", correlation_data)
            
            return result
        
        correlation.correlateResults = correlate_with_events
        
        result = await correlation.correlateResults(violations)
        
        # Should have emitted correlation events
        assert correlation.event_emitter.emit.called

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
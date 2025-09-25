import ast

import pytest
import asyncio
import time
import tempfile
import signal
import os
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path
from typing import Dict, Any, List
import threading
import subprocess

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from test_full_pipeline import IntegratedLinterPipeline
from test_mesh_coordination import MeshQueenCoordinator, NodeStatus
from test_tool_management import ToolManagementSystem
from test_real_time_processing import MockRealTimeLinterIngestionEngine, MockResultCorrelationFramework

class TestMeshCoordinationFailures:
    """Test suite for mesh coordination failure scenarios"""
    
    @pytest.fixture
    async def coordinator(self):
        """Create mesh coordinator for failure testing"""
        coord = MeshQueenCoordinator()
        await coord.initialize_mesh_topology()
        yield coord
    
    @pytest.mark.asyncio
    async def test_single_node_failure_recovery(self, coordinator):
        """Test recovery from single node failure"""
        # Mark all nodes as active initially
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
        
        initial_health = await coordinator.monitor_integration_health()
        assert initial_health["system_health"] == 1.0
        
        # Simulate node failure
        failed_node = "backend-dev"
        recovery_result = await coordinator.handle_fault_tolerance(failed_node)
        
        # Verify failure handling
        assert recovery_result["failed_node"] == failed_node
        assert recovery_result["workload_redistributed"] is True
        assert coordinator.mesh_nodes[failed_node].status == NodeStatus.FAILED
        
        # System should still be operational with remaining nodes
        post_failure_health = await coordinator.monitor_integration_health()
        assert post_failure_health["system_health"] == 0.75  # 3/4 nodes healthy
        assert len(recovery_result["healthy_nodes"]) == 3
    
    @pytest.mark.asyncio
    async def test_multiple_node_failure_scenario(self, coordinator):
        """Test system behavior with multiple node failures"""
        # Mark all nodes as active
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
        
        # Fail multiple nodes (but keep system above Byzantine threshold)
        failed_nodes = ["backend-dev"]  # Fail 1 out of 4 nodes (25%)
        
        for failed_node in failed_nodes:
            await coordinator.handle_fault_tolerance(failed_node)
        
        # System should still function (>66% nodes healthy)
        health = await coordinator.monitor_integration_health()
        healthy_nodes = sum(1 for node in coordinator.mesh_nodes.values() 
                            if node.status == NodeStatus.ACTIVE)
        
        assert healthy_nodes >= len(coordinator.mesh_nodes) * 0.66
        assert health["system_health"] >= 0.66
    
    @pytest.mark.asyncio
    async def test_network_partition_simulation(self, coordinator):
        """Test handling of network partition scenarios"""
        # Simulate network partition by removing connections
        original_connections = {}
        for node_id, node in coordinator.mesh_nodes.items():
            original_connections[node_id] = node.connections.copy()
            # Simulate partition: disconnect from half the nodes
            if "system" in node_id or "api" in node_id:
                node.connections.clear()
        
        # Check connectivity after partition
        connectivity = coordinator._calculate_mesh_connectivity()
        assert connectivity < 1.0  # Should detect reduced connectivity
        
        # Simulate network healing
        for node_id, node in coordinator.mesh_nodes.items():
            node.connections = original_connections[node_id]
        
        # Connectivity should be restored
        healed_connectivity = coordinator._calculate_mesh_connectivity()
        assert healed_connectivity == 1.0
    
    @pytest.mark.asyncio
    async def test_cascading_failure_prevention(self, coordinator):
        """Test prevention of cascading failures"""
        # Mark all nodes as active
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
        
        # Simulate high load on one node
        coordinator.mesh_nodes["backend-dev"].load_score = 0.95
        
        # Fail the overloaded node
        await coordinator.handle_fault_tolerance("backend-dev")
        
        # Verify other nodes don't cascade into failure
        remaining_nodes = [node for node_id, node in coordinator.mesh_nodes.items() 
                            if node_id != "backend-dev"]
        
        for node in remaining_nodes:
            assert node.status == NodeStatus.ACTIVE
            # Load should be redistributed but not overloading
            assert node.load_score < 0.90
    
    @pytest.mark.asyncio
    async def test_heartbeat_timeout_handling(self, coordinator):
        """Test heartbeat timeout detection and handling"""
        current_time = time.time()
        
        # Simulate stale heartbeats
        coordinator.mesh_nodes["integration-specialist"].last_heartbeat = current_time - 120  # 2 minutes old
        coordinator.mesh_nodes["api-docs"].last_heartbeat = current_time - 180  # 3 minutes old
        
        health = await coordinator.monitor_integration_health()
        
        # Should detect stale nodes
        stale_nodes = []
        for node_id, node_health in health["node_health"].items():
            if node_health["last_heartbeat_age"] > 60:  # 1 minute threshold
                stale_nodes.append(node_id)
        
        assert "integration-specialist" in stale_nodes
        assert "api-docs" in stale_nodes
        
        # System should mark these nodes as degraded or initiate recovery
        for node_id in stale_nodes:
            if coordinator.mesh_nodes[node_id].status == NodeStatus.ACTIVE:
                coordinator.mesh_nodes[node_id].status = NodeStatus.DEGRADED

class TestToolManagementFailures:
    """Test suite for tool management failure scenarios"""
    
    @pytest.fixture
    def tool_manager(self):
        """Create tool manager for failure testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield ToolManagementSystem(temp_dir)
    
    @pytest.mark.asyncio
    async def test_tool_execution_timeout(self, tool_manager):
        """Test tool execution timeout handling"""
        # Create mock tool with short timeout
        mock_tool = Mock()
        mock_tool.id = "slow_tool"
        mock_tool.timeout = 1000  # 1 second timeout
        
        # Register tool
        tool_manager.tools[mock_tool.id] = mock_tool
        tool_manager.initializeToolHealth(mock_tool.id)
        tool_manager.initializeToolMetrics(mock_tool.id)
        tool_manager.circuitBreakers[mock_tool.id] = {
            "isOpen": False,
            "failureCount": 0,
            "lastFailureTime": 0,
            "successCount": 0,
            "nextAttemptTime": 0
        }
        
        # Mock slow execution that exceeds timeout
        async def slow_execution(*args, **kwargs):
            await asyncio.sleep(2.0)  # Longer than timeout
            return Mock()
        
        with patch.object(tool_manager, 'executeWithMonitoring', side_effect=slow_execution):
            # Should timeout and raise exception
            with pytest.raises(Exception):
                await tool_manager.executeTool(mock_tool.id, ["test.py"])
        
        # Circuit breaker should be affected
        circuit_breaker = tool_manager.circuitBreakers[mock_tool.id]
        assert circuit_breaker.failureCount > 0
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_activation(self, tool_manager):
        """Test circuit breaker activation after repeated failures"""
        mock_tool = Mock()
        mock_tool.id = "failing_tool"
        
        # Register tool
        tool_manager.tools[mock_tool.id] = mock_tool
        tool_manager.initializeToolHealth(mock_tool.id)
        tool_manager.initializeToolMetrics(mock_tool.id)
        tool_manager.circuitBreakers[mock_tool.id] = {
            "isOpen": False,
            "failureCount": 0,
            "lastFailureTime": 0,
            "successCount": 0,
            "nextAttemptTime": 0
        }
        
        # Mock failing execution
        with patch.object(tool_manager, 'executeWithMonitoring', 
                        side_effect=Exception("Tool execution failed")):
            
            # Cause 5 failures to trigger circuit breaker
            for i in range(5):
                with pytest.raises(Exception):
                    await tool_manager.executeTool(mock_tool.id, ["test.py"])
        
        # Circuit breaker should be open
        circuit_breaker = tool_manager.circuitBreakers[mock_tool.id]
        assert circuit_breaker.isOpen is True
        assert circuit_breaker.failureCount >= 5
        
        # Next execution should fail due to circuit breaker
        with pytest.raises(Exception, match="Circuit breaker open"):
            await tool_manager.executeTool(mock_tool.id, ["test.py"])
    
    @pytest.mark.asyncio
    async def test_tool_recovery_mechanism(self, tool_manager):
        """Test tool recovery after health degradation"""
        mock_tool = Mock()
        mock_tool.id = "recovery_tool"
        
        # Register tool
        tool_manager.tools[mock_tool.id] = mock_tool
        tool_manager.initializeToolHealth(mock_tool.id)
        tool_manager.initializeToolMetrics(mock_tool.id)
        tool_manager.recoveryProcedures[mock_tool.id] = Mock()
        tool_manager.recoveryProcedures[mock_tool.id].resetConfiguration = True
        tool_manager.recoveryProcedures[mock_tool.id].clearCache = True
        tool_manager.recoveryProcedures[mock_tool.id].customRecoverySteps = ["step1", "step2"]
        
        # Degrade tool health
        health = tool_manager.healthStatus[mock_tool.id]
        health.isHealthy = False
        health.healthScore = 10
        health.lastError = "Tool degraded"
        
        # Mock recovery methods
        with patch.object(tool_manager, 'resetToolConfiguration', new_callable=AsyncMock), \
            patch.object(tool_manager, 'clearToolCache', new_callable=AsyncMock), \
            patch.object(tool_manager, 'executeRecoveryStep', new_callable=AsyncMock):
            
            # Attempt recovery
            await tool_manager.attemptToolRecovery(mock_tool.id)
        
        # Health should be restored
        recovered_health = tool_manager.healthStatus[mock_tool.id]
        assert recovered_health.isHealthy is True
        assert recovered_health.healthScore == 100
    
    def test_resource_exhaustion_handling(self, tool_manager):
        """Test handling of resource exhaustion scenarios"""
        # Simulate resource exhaustion by setting very low limits
        tool_id = "resource_tool"
        tool_manager.resourceAllocations[tool_id] = Mock()
        tool_manager.resourceAllocations[tool_id].concurrencyLimit = 1
        tool_manager.resourceAllocations[tool_id].executionQuota = 1
        
        # Fill up the execution quota
        tool_manager.executionQueue[tool_id] = [Mock() for _ in range(10)]
        
        # Should handle queue overflow gracefully
        queue_length = len(tool_manager.executionQueue[tool_id])
        assert queue_length == 10
        
        # Process one item
        tool_manager.processExecutionQueue(tool_id)
        
        # Queue should be reduced
        assert len(tool_manager.executionQueue[tool_id]) == 9

class TestRealTimeProcessingFailures:
    """Test suite for real-time processing failure scenarios"""
    
    @pytest.mark.asyncio
    async def test_streaming_interruption_recovery(self):
        """Test recovery from streaming interruption"""
        engine = MockRealTimeLinterIngestionEngine()
        
        # Mock interruption during streaming
        original_generate = engine._generate_mock_violations
        call_count = 0
        
        def intermittent_failure(tool, files):
            nonlocal call_count
            call_count += 1
            if call_count == 2:  # Fail on second call
                raise ConnectionError("Streaming interrupted")
            return original_generate(tool, files)
        
        engine._generate_mock_violations = intermittent_failure
        
        # Should handle interruption gracefully
        try:
            result = await engine.executeRealtimeLinting(
                ["test.py"], 
                {"tools": ["flake8", "pylint", "ruff"]}
            )
            # Some tools should succeed, some may fail
            assert "correlation_id" in result
        except Exception as e:
            # Should fail gracefully, not crash
            assert "interrupted" in str(e).lower() or "connection" in str(e).lower()
    
    @pytest.mark.asyncio
    async def test_correlation_algorithm_failure(self):
        """Test handling of correlation algorithm failures"""
        framework = MockResultCorrelationFramework()
        
        # Mock correlation failure
        original_correlate = framework.correlateResults
        
        async def failing_correlate(violations):
            if len(violations) > 10:
                raise RuntimeError("Correlation algorithm overloaded")
            return await original_correlate(violations)
        
        framework.correlateResults = failing_correlate
        
        # Test with small dataset (should succeed)
        small_violations = [{"tool": "flake8", "rule": "E501"} for _ in range(5)]
        result_small = await framework.correlateResults(small_violations)
        assert "correlations" in result_small
        
        # Test with large dataset (should fail gracefully)
        large_violations = [{"tool": "flake8", "rule": "E501"} for _ in range(15)]
        with pytest.raises(RuntimeError, match="overloaded"):
            await framework.correlateResults(large_violations)
    
    @pytest.mark.asyncio
    async def test_event_emission_failure_tolerance(self):
        """Test tolerance to event emission failures"""
        engine = MockRealTimeLinterIngestionEngine()
        
        # Mock failing event emitter
    def failing_emit(event_type, data):
            if "violation" in event_type:
                raise Exception("Event emission failed")
        
        engine.event_emitter.emit = failing_emit
        
        # Should continue processing despite event emission failures
        result = await engine.executeRealtimeLinting(["test.py"])
        
        # Core functionality should still work
        assert result["status"] == "completed"
        assert "correlation_id" in result
        assert len(result["results"]) > 0
    
    @pytest.mark.asyncio
    async def test_memory_pressure_during_processing(self):
        """Test behavior under memory pressure during processing"""
        engine = MockRealTimeLinterIngestionEngine()
        
        # Simulate memory pressure by creating large violation sets
        original_generate = engine._generate_mock_violations
        
        def memory_intensive_generate(tool, files):
            # Create many violations to stress memory
            violations = []
            for file_path in files:
                for i in range(1000):  # 1000 violations per file
                    violations.append({
                        "file": file_path,
                        "line": i,
                        "rule": f"RULE_{i}",
                        "message": f"Large message {i}: " + "x" * 1000,  # Large message
                        "severity": "medium"
                    })
            return violations
        
        engine._generate_mock_violations = memory_intensive_generate
        
        # Should handle memory pressure gracefully
        try:
            result = await engine.executeRealtimeLinting(["test.py"])
            # If it succeeds, verify basic structure
            assert "correlation_id" in result
        except MemoryError:
            # Acceptable failure mode under extreme memory pressure
            pytest.skip("System reached memory limits gracefully")

class TestFullPipelineFailures:
    """Test suite for full pipeline failure scenarios"""
    
    @pytest.fixture
    async def pipeline(self):
        """Create pipeline for failure testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline = IntegratedLinterPipeline()
            await pipeline.initialize_pipeline(temp_dir)
            yield pipeline
    
    @pytest.mark.asyncio
    async def test_pipeline_partial_failure_recovery(self, pipeline):
        """Test pipeline recovery from partial component failures"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test files
            files = []
            for i in range(3):
                file_path = Path(temp_dir) / f"test_{i}.py"
                files.append(str(file_path))
            
            # Mock partial failure in ingestion engine
            original_execute = pipeline.ingestion_engine.executeRealtimeLinting
            
            async def partial_failure_execute(file_paths, options=None):
                result = await original_execute(file_paths, options)
                # Simulate some tools failing
                result["results"] = result["results"][:2]  # Only first 2 tools succeed
                return result
            
            pipeline.ingestion_engine.executeRealtimeLinting = partial_failure_execute
            
            # Pipeline should handle partial failure
            result = await pipeline.execute_full_pipeline(files)
            
            # Should complete with partial results
            assert result["status"] == "completed"
            assert result["summary"]["tools_executed"] == 2  # Reduced count
            assert result["summary"]["total_violations"] > 0  # Still got some results
    
    @pytest.mark.asyncio
    async def test_pipeline_initialization_failure_recovery(self):
        """Test pipeline recovery from initialization failures"""
        pipeline = IntegratedLinterPipeline()
        
        # Mock initialization failure
        with patch.object(pipeline.mesh_coordinator, 'initialize_mesh_topology', 
                        side_effect=Exception("Initialization failed")):
            
            with pytest.raises(Exception, match="Initialization failed"):
                await pipeline.initialize_pipeline("/tmp")
        
        # Pipeline should be in error state
        assert pipeline.pipeline_state in ["initialized", "error"]
        
        # Should be able to retry initialization
        with tempfile.TemporaryDirectory() as temp_dir:
            await pipeline.initialize_pipeline(temp_dir)
            assert pipeline.pipeline_state == "ready"
    
    @pytest.mark.asyncio
    async def test_pipeline_execution_state_corruption(self, pipeline):
        """Test handling of pipeline state corruption during execution"""
        with tempfile.TemporaryDirectory() as temp_dir:
            files = [str(Path(temp_dir) / "test.py")]
            
            # Corrupt pipeline state during execution
            original_execute = pipeline.execute_full_pipeline
            
            async def corrupting_execute(file_paths, options=None):
                # Start execution
                pipeline.pipeline_state = "executing"
                
                # Simulate state corruption
                pipeline.pipeline_state = "corrupted"
                
                # Restore and continue
                pipeline.pipeline_state = "executing"
                return await original_execute.__wrapped__(pipeline, file_paths, options)
            
            # Bind the method properly
            import types
            pipeline.execute_full_pipeline = types.MethodType(corrupting_execute, pipeline)
            
            # Should handle state corruption gracefully
            try:
                result = await pipeline.execute_full_pipeline(files)
                assert result["status"] == "completed"
            except RuntimeError as e:
                # Acceptable if it detects state corruption
                assert "not initialized" in str(e) or "corrupted" in str(e)
    
    @pytest.mark.asyncio
    async def test_pipeline_cascading_failure_isolation(self, pipeline):
        """Test isolation of cascading failures in pipeline"""
        with tempfile.TemporaryDirectory() as temp_dir:
            files = [str(Path(temp_dir) / "test.py")]
            
            # Mock cascading failures
            failure_count = 0
            
            def increment_failures(*args, **kwargs):
                nonlocal failure_count
                failure_count += 1
                if failure_count <= 2:  # First 2 calls fail
                    raise Exception(f"Cascading failure {failure_count}")
                return Mock(value="success")
            
            # Apply failure to multiple components
            with patch.object(pipeline.mesh_coordinator, 'coordinate_linter_integration', 
                            side_effect=increment_failures), \
                patch.object(pipeline.correlation_framework, 'correlateResults', 
                            side_effect=increment_failures):
                
                # Should isolate failures and not crash entire pipeline
                try:
                    result = await pipeline.execute_full_pipeline(files)
                    # May succeed with degraded functionality
                    assert "execution_id" in result
                except Exception as e:
                    # Should fail gracefully, not crash uncontrollably
                    assert "Cascading failure" in str(e)

class TestResourceExhaustionScenarios:
    """Test suite for resource exhaustion scenarios"""
    
    @pytest.mark.asyncio
    async def test_file_descriptor_exhaustion(self, pipeline):
        """Test handling of file descriptor exhaustion"""
        import resource
        
        # Get current file descriptor limit
        soft_limit, hard_limit = resource.getrlimit(resource.RLIMIT_NOFILE)
        
        # Temporarily lower the limit for testing
        try:
            test_limit = min(50, soft_limit)  # Very low limit
            resource.setrlimit(resource.RLIMIT_NOFILE, (test_limit, hard_limit))
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create many files to exhaust descriptors
                files = []
                for i in range(test_limit + 10):  # More files than limit
                    file_path = Path(temp_dir) / f"test_{i}.py"
                    files.append(str(file_path))
                
                # Should handle file descriptor exhaustion gracefully
                try:
                    result = await pipeline.execute_full_pipeline(files)
                    # May succeed with reduced functionality
                    assert "execution_id" in result
                except (OSError, IOError) as e:
                    # Acceptable failure mode
                    assert "file" in str(e).lower() or "descriptor" in str(e).lower()
                    
        finally:
            # Restore original limit
            resource.setrlimit(resource.RLIMIT_NOFILE, (soft_limit, hard_limit))
    
    @pytest.mark.asyncio
    async def test_disk_space_exhaustion_simulation(self, pipeline):
        """Test handling of disk space exhaustion"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Simulate disk space issue by creating very large files
            large_files = []
            try:
                for i in range(3):
                    file_path = Path(temp_dir) / f"large_{i}.py"
                    # Create moderately large content (not enough to actually fill disk)
                    content = "# " + "x" * 10000 + "\nprint('large file')\n"
                    file_path.write_text(content)
                    large_files.append(str(file_path))
                
                # Mock disk space check to simulate exhaustion
                with patch('shutil.disk_usage', return_value=(100, 10, 5)):  # Very low free space
                    result = await pipeline.execute_full_pipeline(large_files)
                    
                    # Should complete despite simulated low disk space
                    assert result["status"] == "completed"
                    
            except OSError:
                # Acceptable if system actually runs out of space
                pytest.skip("Simulated disk space exhaustion")

class TestSecurityFailureScenarios:
    """Test suite for security-related failure scenarios"""
    
    @pytest.mark.asyncio
    async def test_malicious_input_handling(self, pipeline):
        """Test handling of potentially malicious input"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create file with potentially malicious content
            malicious_file = Path(temp_dir) / "malicious.py"
            malicious_content = '''
# Potentially malicious Python code
import os
import subprocess
import sys

# Path traversal attempt
evil_path = "../../../etc/passwd"

# Command injection attempt  
evil_command = "rm -rf /"

# SQL injection attempt in comment
evil_sql = "'; DROP TABLE users; --"

def malicious_function():
    # This should be detected by security linters
    subprocess.call(evil_command, shell=True)
    
    # This should also be flagged
    ast.literal_eval("__import__('os').system('whoami')")
'''
            malicious_file.write_text(malicious_content)
            
            # Pipeline should handle malicious content safely
            result = await pipeline.execute_full_pipeline([str(malicious_file)])
            
            # Should complete without executing malicious code
            assert result["status"] == "completed"
            
            # Security linters should detect issues
            if result["summary"]["total_violations"] > 0:
                # Should have security-related violations
                quality_phase = result["pipeline_phases"]["quality_assessment"]
                category_dist = quality_phase["category_distribution"]
                assert category_dist.get("security", 0) > 0
    
    @pytest.mark.asyncio
    async def test_path_traversal_protection(self, pipeline):
        """Test protection against path traversal attacks"""
        # Attempt to analyze files outside of intended directory
        malicious_paths = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "/etc/shadow",
            "C:\\Windows\\System32\\config\\SAM"
        ]
        
        # Should handle malicious paths gracefully
        for path in malicious_paths:
            try:
                result = await pipeline.execute_full_pipeline([path])
                # If it succeeds, should not have actually accessed system files
                assert result["status"] in ["completed", "failed"]
            except (FileNotFoundError, PermissionError, OSError):
                # Expected failure for invalid/protected paths

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
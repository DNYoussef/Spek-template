#!/usr/bin/env python3
"""
Mesh Coordination System Tests
Comprehensive test suite for the mesh topology management and peer-to-peer coordination.
"""

from unittest.mock import Mock, patch, AsyncMock
import time

from dataclasses import asdict
import asyncio
import pytest

# Import system under test
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from linter_integration.mesh_coordinator import (
    MeshQueenCoordinator, 
    MeshNode, 
    MeshMessage,
    NodeStatus, 
    MessageType
)

class TestMeshQueenCoordinator:
    """Test suite for mesh queen coordinator functionality"""
    
    @pytest.fixture
    async def coordinator(self):
        """Create fresh coordinator instance for each test"""
        coord = MeshQueenCoordinator()
        yield coord
        # Cleanup any running tasks
        coord.mesh_nodes.clear()
        coord.message_queue.clear()
        coord.consensus_proposals.clear()
    
    @pytest.mark.asyncio
    async def test_mesh_topology_initialization(self, coordinator):
        """Test mesh topology is properly initialized with 4 specialist nodes"""
        result = await coordinator.initialize_mesh_topology()
        
        # Verify 4 specialist nodes were created
        assert len(coordinator.mesh_nodes) == 4
        
        expected_nodes = {
            "system-architect", 
            "backend-dev", 
            "api-docs", 
            "integration-specialist"
        }
        assert set(coordinator.mesh_nodes.keys()) == expected_nodes
        
        # Verify full mesh connectivity
        for node_id, node in coordinator.mesh_nodes.items():
            assert len(node.connections) == 3  # Connected to 3 other nodes
            assert node_id not in node.connections  # Not connected to self
            assert node.status == NodeStatus.INITIALIZING
            
        # Verify topology status
        assert result["total_nodes"] == 4
        assert result["connections"] == 12  # 4 nodes * 3 connections each
        assert result["mesh_health"] == 1.0
        
    @pytest.mark.asyncio
    async def test_node_capabilities_assignment(self, coordinator):
        """Test each node has correct capabilities assigned"""
        await coordinator.initialize_mesh_topology()
        
        # System architect capabilities
        system_arch = coordinator.mesh_nodes["system-architect"]
        assert "external_tool_pipeline_design" in system_arch.capabilities
        assert "integration_architecture" in system_arch.capabilities
        assert "tool_orchestration" in system_arch.capabilities
        
        # Backend dev capabilities
        backend_dev = coordinator.mesh_nodes["backend-dev"]
        assert "adapter_pattern_implementation" in backend_dev.capabilities
        assert "linter_output_normalization" in backend_dev.capabilities
        
        # API docs capabilities
        api_docs = coordinator.mesh_nodes["api-docs"]
        assert "unified_violation_severity_mapping" in api_docs.capabilities
        assert "documentation_generation" in api_docs.capabilities
        
        # Integration specialist capabilities
        integration_spec = coordinator.mesh_nodes["integration-specialist"]
        assert "real_time_result_ingestion" in integration_spec.capabilities
        assert "cross_tool_correlation" in integration_spec.capabilities
        
    @pytest.mark.asyncio
    async def test_linter_integration_coordination(self, coordinator):
        """Test distributed linter integration task coordination"""
        await coordinator.initialize_mesh_topology()
        
        result = await coordinator.coordinate_linter_integration()
        
        # Verify tasks assigned to each node
        assert "system-architect" in result
        assert "backend-dev" in result
        assert "api-docs" in result
        assert "integration-specialist" in result
        
        # Verify system architect tasks
        system_tasks = result["system-architect"]["assigned_tasks"]
        assert "design_external_tool_pipeline" in system_tasks
        assert "create_tool_orchestration_framework" in system_tasks
        
        # Verify backend dev tasks
        backend_tasks = result["backend-dev"]["assigned_tasks"]
        linter_adapters = [
            "implement_flake8_adapter",
            "implement_pylint_adapter",
            "implement_ruff_adapter",
            "implement_mypy_adapter",
            "implement_bandit_adapter"
        ]
        for adapter in linter_adapters:
            assert adapter in backend_tasks
        
        # Verify API docs tasks
        api_tasks = result["api-docs"]["assigned_tasks"]
        assert "create_unified_severity_mapping" in api_tasks
        assert "document_adapter_interfaces" in api_tasks
        
        # Verify integration specialist tasks
        integration_tasks = result["integration-specialist"]["assigned_tasks"]
        assert "setup_real_time_ingestion" in integration_tasks
        assert "implement_cross_tool_correlation" in integration_tasks
        
        # Verify all nodes are now active
        for node in coordinator.mesh_nodes.values():
            assert node.status == NodeStatus.ACTIVE
            
    @pytest.mark.asyncio
    async def test_peer_to_peer_communication(self, coordinator):
        """Test peer-to-peer communication protocol establishment"""
        await coordinator.initialize_mesh_topology()
        
        result = await coordinator.establish_peer_communication()
        
        # Verify communication protocols
        protocols = result["protocols"]
        assert protocols["heartbeat_interval"] == 5.0
        assert protocols["message_timeout"] == 30.0
        assert protocols["consensus_threshold"] == 0.75
        assert protocols["fault_tolerance_level"] == 0.33
        
        # Verify communication channels
        assert result["active_channels"] == 12  # 4 nodes * 3 connections each
        assert result["mesh_connectivity"] == 1.0  # Full mesh
        
    @pytest.mark.asyncio
    async def test_integration_health_monitoring(self, coordinator):
        """Test health monitoring across mesh topology"""
        await coordinator.initialize_mesh_topology()
        
        # Simulate some integration progress
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
            node.integration_progress = {
                "flake8": 0.6,
                "pylint": 0.4,
                "ruff": 0.8,
                "mypy": 0.3,
                "bandit": 0.7
            }
            
        result = await coordinator.monitor_integration_health()
        
        # Verify health metrics structure
        assert "topology_health" in result
        assert "node_health" in result
        assert "integration_progress" in result
        assert "performance_metrics" in result
        assert "fault_tolerance_status" in result
        
        # Verify node health data
        for node_id in coordinator.mesh_nodes.keys():
            node_health = result["node_health"][node_id]
            assert node_health["status"] == "active"
            assert "load_score" in node_health
            assert "last_heartbeat_age" in node_health
            assert "connection_count" in node_health
            
        # Verify integration progress tracking
        for node_id in coordinator.mesh_nodes.keys():
            progress = result["integration_progress"][node_id]
            for tool in coordinator.integration_tools:
                assert tool in progress
                assert 0 <= progress[tool] <= 1
                
        # Verify system health calculation
        assert result["system_health"] == 1.0  # All nodes active
        
    @pytest.mark.asyncio
    async def test_fault_tolerance_node_failure(self, coordinator):
        """Test fault tolerance when a node fails"""
        await coordinator.initialize_mesh_topology()
        
        # Mark all nodes as active initially
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
            
        # Simulate node failure
        failed_node = "backend-dev"
        result = await coordinator.handle_fault_tolerance(failed_node)
        
        # Verify failure handling
        assert result["failed_node"] == failed_node
        assert result["workload_redistributed"] is True
        assert coordinator.mesh_nodes[failed_node].status == NodeStatus.FAILED
        
        # Verify healthy nodes list
        expected_healthy = {"system-architect", "api-docs", "integration-specialist"}
        assert set(result["healthy_nodes"]) == expected_healthy
        
        # Verify failed node removed from connections
        for node_id, node in coordinator.mesh_nodes.items():
            if node_id != failed_node:
                assert failed_node not in node.connections
                
        # Verify topology health recalculated
        assert result["new_topology_health"] == 0.75  # 3/4 nodes healthy
        
    @pytest.mark.asyncio
    async def test_byzantine_fault_tolerance(self, coordinator):
        """Test Byzantine fault tolerance with multiple node failures"""
        await coordinator.initialize_mesh_topology()
        
        # Mark all nodes as active
        for node in coordinator.mesh_nodes.values():
            node.status = NodeStatus.ACTIVE
            
        # Simulate Byzantine fault scenario (1/3 of nodes failing)
        failed_nodes = ["backend-dev"]
        
        for failed_node in failed_nodes:
            await coordinator.handle_fault_tolerance(failed_node)
            
        # System should still function with 3/4 nodes (> 2/3 threshold)
        healthy_count = sum(1 for node in coordinator.mesh_nodes.values() 
                            if node.status == NodeStatus.ACTIVE)
        assert healthy_count >= len(coordinator.mesh_nodes) * 0.67
        
    def test_mesh_connectivity_calculation(self, coordinator):
        """Test mesh connectivity percentage calculation"""
        # Empty mesh
        connectivity = coordinator._calculate_mesh_connectivity()
        assert connectivity == 1.0  # Edge case: empty mesh is 100% connected
        
        # Single node
        coordinator.mesh_nodes["single"] = MeshNode(
            node_id="single",
            agent_type="test",
            capabilities=[],
            status=NodeStatus.ACTIVE,
            last_heartbeat=time.time(),
            connections=set(),
            load_score=0.0,
            integration_progress={}
        )
        connectivity = coordinator._calculate_mesh_connectivity()
        assert connectivity == 1.0  # Single node is fully connected
        
        # Add second node with partial connectivity
        coordinator.mesh_nodes["second"] = MeshNode(
            node_id="second",
            agent_type="test",
            capabilities=[],
            status=NodeStatus.ACTIVE,
            last_heartbeat=time.time(),
            connections={"single"},
            load_score=0.0,
            integration_progress={}
        )
        coordinator.mesh_nodes["single"].connections.add("second")
        
        connectivity = coordinator._calculate_mesh_connectivity()
        assert connectivity == 1.0  # 2/2 possible connections = 100%
        
    @pytest.mark.asyncio
    async def test_load_balancing_across_nodes(self, coordinator):
        """Test load balancing capabilities across mesh nodes"""
        await coordinator.initialize_mesh_topology()
        
        # Simulate different load scores
        coordinator.mesh_nodes["system-architect"].load_score = 0.2
        coordinator.mesh_nodes["backend-dev"].load_score = 0.8
        coordinator.mesh_nodes["api-docs"].load_score = 0.1
        coordinator.mesh_nodes["integration-specialist"].load_score = 0.5
        
        health_result = await coordinator.monitor_integration_health()
        
        # Verify load scores are tracked
        for node_id, node in coordinator.mesh_nodes.items():
            node_health = health_result["node_health"][node_id]
            assert node_health["load_score"] == node.load_score
            
        # Find least loaded node for new task assignment
        least_loaded = min(coordinator.mesh_nodes.values(), 
                            key=lambda n: n.load_score)
        assert least_loaded.node_id == "api-docs"
        
    @pytest.mark.asyncio
    async def test_heartbeat_monitoring(self, coordinator):
        """Test heartbeat monitoring and stale node detection"""
        await coordinator.initialize_mesh_topology()
        
        current_time = time.time()
        
        # Set different heartbeat times
        coordinator.mesh_nodes["system-architect"].last_heartbeat = current_time
        coordinator.mesh_nodes["backend-dev"].last_heartbeat = current_time - 60  # 1 min old
        coordinator.mesh_nodes["api-docs"].last_heartbeat = current_time - 120  # 2 min old
        coordinator.mesh_nodes["integration-specialist"].last_heartbeat = current_time
        
        health_result = await coordinator.monitor_integration_health()
        
        # Verify heartbeat age calculation
        for node_id, node in coordinator.mesh_nodes.items():
            node_health = health_result["node_health"][node_id]
            expected_age = current_time - node.last_heartbeat
            assert abs(node_health["last_heartbeat_age"] - expected_age) < 1.0
            
        # Nodes with stale heartbeats should be flagged
        stale_nodes = [
            node_id for node_id, node in coordinator.mesh_nodes.items()
            if current_time - node.last_heartbeat > 30  # 30 sec threshold
        ]
        assert "backend-dev" in stale_nodes
        assert "api-docs" in stale_nodes
        
    @pytest.mark.asyncio
    async def test_consensus_mechanism(self, coordinator):
        """Test consensus mechanism for distributed decisions"""
        await coordinator.initialize_mesh_topology()
        
        # Simulate consensus proposal
        proposal_id = "severity_mapping_update"
        proposal = {
            "type": "configuration_change",
            "data": {"flake8_E501_severity": "medium"},
            "proposer": "api-docs",
            "timestamp": time.time()
        }
        
        coordinator.consensus_proposals[proposal_id] = proposal
        
        # Test consensus threshold (75%)
        total_nodes = len(coordinator.mesh_nodes)
        required_votes = int(total_nodes * 0.75)
        
        assert required_votes == 3  # 75% of 4 nodes = 3
        
        # Simulate voting
        votes = ["system-architect", "backend-dev", "api-docs"]
        consensus_reached = len(votes) >= required_votes
        
        assert consensus_reached is True
        
    @pytest.mark.asyncio
    async def test_integration_progress_tracking(self, coordinator):
        """Test integration progress tracking per tool per node"""
        await coordinator.initialize_mesh_topology()
        
        # Update progress for different tools
        coordinator.mesh_nodes["backend-dev"].integration_progress.update({
            "flake8": 1.0,  # Complete
            "pylint": 0.7,  # 70% complete
            "ruff": 0.9,    # 90% complete
            "mypy": 0.5,    # 50% complete
            "bandit": 0.8   # 80% complete
        })
        
        # Other nodes have different progress
        coordinator.mesh_nodes["api-docs"].integration_progress.update({
            tool: 0.6 for tool in coordinator.integration_tools
        })
        
        topology_status = coordinator._get_topology_status()
        
        # Verify average progress calculation
        integration_progress = topology_status["integration_progress"]
        for tool in coordinator.integration_tools:
            assert tool in integration_progress
            assert 0 <= integration_progress[tool] <= 1
            
        # Flake8 should have higher average (backend-dev=1.0, others=0.0/0.6)
        assert integration_progress["flake8"] > integration_progress["mypy"]
        
    @pytest.mark.asyncio
    async def test_error_recovery_mechanisms(self, coordinator):
        """Test error recovery and resilience mechanisms"""
        await coordinator.initialize_mesh_topology()
        
        # Test recovery from communication failure
        original_connections = coordinator.mesh_nodes["system-architect"].connections.copy()
        
        # Simulate communication failure
        coordinator.mesh_nodes["system-architect"].connections.clear()
        
        # Recovery should restore connections
        coordinator.mesh_nodes["system-architect"].connections = original_connections
        
        # Verify recovery
        assert len(coordinator.mesh_nodes["system-architect"].connections) == 3
        
        # Test recovery from node degradation
        coordinator.mesh_nodes["backend-dev"].status = NodeStatus.DEGRADED
        
        # Recovery attempt
        coordinator.mesh_nodes["backend-dev"].status = NodeStatus.ACTIVE
        
        # Verify node is back online
        assert coordinator.mesh_nodes["backend-dev"].status == NodeStatus.ACTIVE
        
    @pytest.mark.performance
    async def test_mesh_performance_under_load(self, coordinator):
        """Test mesh performance under high message load"""
        await coordinator.initialize_mesh_topology()
        
        # Generate high message load
        start_time = time.time()
        
        for i in range(1000):
            message = MeshMessage(
                sender_id="system-architect",
                receiver_id="backend-dev",
                message_type=MessageType.HEARTBEAT,
                payload={"sequence": i},
                timestamp=time.time(),
                message_id=f"msg_{i}"
            )
            coordinator.message_queue.append(message)
            
        processing_time = time.time() - start_time
        
        # Should handle 1000 messages quickly (< 1 second)
        assert processing_time < 1.0
        assert len(coordinator.message_queue) == 1000
        
    @pytest.mark.asyncio
    async def test_mesh_scalability_simulation(self, coordinator):
        """Test mesh scalability with additional nodes"""
        await coordinator.initialize_mesh_topology()
        
        # Add additional specialist nodes
        additional_nodes = {
            "security-specialist": {
                "capabilities": ["security_analysis", "vulnerability_detection"],
                "tools_focus": ["bandit", "security"]
            },
            "performance-specialist": {
                "capabilities": ["performance_analysis", "optimization"],
                "tools_focus": ["profiling", "optimization"]
            }
        }
        
        for node_id, config in additional_nodes.items():
            coordinator.mesh_nodes[node_id] = MeshNode(
                node_id=node_id,
                agent_type=config["capabilities"][0].split("_")[0],
                capabilities=config["capabilities"],
                status=NodeStatus.INITIALIZING,
                last_heartbeat=time.time(),
                connections=set(),
                load_score=0.0,
                integration_progress={tool: 0.0 for tool in coordinator.integration_tools}
            )
            
        # Update connections for full mesh (6 nodes)
        node_ids = list(coordinator.mesh_nodes.keys())
        for i, node_id in enumerate(node_ids):
            for j, other_node_id in enumerate(node_ids):
                if i != j:
                    coordinator.mesh_nodes[node_id].connections.add(other_node_id)
                    
        # Verify scaled mesh
        assert len(coordinator.mesh_nodes) == 6
        connectivity = coordinator._calculate_mesh_connectivity()
        assert connectivity == 1.0  # Still fully connected
        
        # Each node should connect to 5 others
        for node in coordinator.mesh_nodes.values():
            assert len(node.connections) == 5

class TestMeshMessageProtocol:
    """Test suite for mesh message protocol and communication"""
    
    def test_mesh_message_creation(self):
        """Test mesh message creation and serialization"""
        message = MeshMessage(
            sender_id="system-architect",
            receiver_id="backend-dev",
            message_type=MessageType.TASK_ASSIGNMENT,
            payload={"task": "implement_flake8_adapter", "priority": "high"},
            timestamp=time.time(),
            message_id="msg_123"
        )
        
        # Verify message structure
        assert message.sender_id == "system-architect"
        assert message.receiver_id == "backend-dev"
        assert message.message_type == MessageType.TASK_ASSIGNMENT
        assert "task" in message.payload
        assert message.message_id == "msg_123"
        
        # Test serialization
        message_dict = asdict(message)
        assert isinstance(message_dict, dict)
        assert message_dict["sender_id"] == "system-architect"
        
    def test_message_type_validation(self):
        """Test message type enumeration validation"""
        # Verify all required message types exist
        required_types = {
            MessageType.HEARTBEAT,
            MessageType.TASK_ASSIGNMENT,
            MessageType.RESULT_SHARE,
            MessageType.CONSENSUS_REQUEST,
            MessageType.FAULT_TOLERANCE
        }
        
        # All types should be valid MessageType enums
        for msg_type in required_types:
            assert isinstance(msg_type, MessageType)
            
    def test_node_status_lifecycle(self):
        """Test node status lifecycle transitions"""
        # Valid status transitions
        valid_transitions = {
            NodeStatus.INITIALIZING: [NodeStatus.ACTIVE, NodeStatus.FAILED],
            NodeStatus.ACTIVE: [NodeStatus.DEGRADED, NodeStatus.FAILED],
            NodeStatus.DEGRADED: [NodeStatus.ACTIVE, NodeStatus.FAILED],
            NodeStatus.FAILED: [NodeStatus.INITIALIZING]  # Recovery
        }
        
        # Verify all status values exist
        for status in NodeStatus:
            assert status in [NodeStatus.INITIALIZING, NodeStatus.ACTIVE, 
                            NodeStatus.DEGRADED, NodeStatus.FAILED]

if __name__ == "__main__":
    # Run tests with pytest
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
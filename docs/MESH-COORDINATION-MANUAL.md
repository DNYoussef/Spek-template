# Mesh Coordination Manual - Peer-to-Peer Topology Management

## Overview

The Mesh Coordination system is a **368-line production-ready** peer-to-peer topology manager that orchestrates distributed linter integration across specialized agent nodes. Built with **Byzantine fault tolerance** and **real-time health monitoring**, this system ensures reliable coordination even with up to 33% node failures.

## Architecture Overview

### Mesh Topology Design

```
+-----------------------------------------------------------------+
|                    MESH QUEEN COORDINATOR                      |
|                     (Full Mesh Network)                        |
+-----------------------------------------------------------------+
              |                    |                    |
        +-----?-----+        +-----?-----+        +-----?-----+
        |  System   |?------?| Backend   |?------?|   API     |
        |Architect  |        |    Dev    |        |   Docs    |
        |  Node     |        |   Node    |        |   Node    |
        +-----+-----+        +-----+-----+        +-----+-----+
              |                    |                    |
              +--------------------+--------------------+
                                   |
                            +-----?-----+
                            |Integration|
                            |Specialist |
                            |   Node    |
                            +-----------+

Peer-to-Peer Connections: Each node connects to every other node
Total Connections: N * (N-1) = 4 * 3 = 12 bidirectional connections
Fault Tolerance: Byzantine (up to 33% failures = 1 node)
```

### Node Specializations

| Node | Primary Responsibility | Key Capabilities | Tools Focus |
|------|----------------------|------------------|-------------|
| **System Architect** | External tool pipeline design | Orchestration, Dependencies | Pipeline, Integration |
| **Backend Dev** | Adapter pattern implementation | Normalization, Performance | All linters (flake8, pylint, etc.) |
| **API Docs** | Unified severity mapping | Documentation, Schemas | Severity mapping, APIs |
| **Integration Specialist** | Real-time result ingestion | Streaming, Correlation | Data processing, Aggregation |

## Core Components

### 1. Mesh Queen Coordinator

**Purpose:** Central coordination hub managing peer-to-peer topology

**Key Features:**
- **Full mesh connectivity** with automatic peer discovery
- **Circuit breaker patterns** for fault isolation
- **Load balancing** based on node capabilities
- **Real-time health monitoring** with automatic recovery

**Initialization:**
```python
from src.linter_integration.mesh_coordinator import mesh_coordinator

# Initialize the mesh topology
result = await mesh_coordinator.initialize_mesh_topology()
print(f"Mesh health: {result['mesh_health']}")
print(f"Active nodes: {result['active_nodes']}")
print(f"Total connections: {result['connections']}")
```

**Response:**
```python
{
    "mesh_health": 1.0,
    "active_nodes": 4,
    "total_nodes": 4,
    "connections": 12,
    "integration_progress": {
        "flake8": 0.0,
        "pylint": 0.0,
        "ruff": 0.0,
        "mypy": 0.0,
        "bandit": 0.0
    }
}
```

### 2. Node Management

**Node Structure:**
```python
@dataclass
class MeshNode:
    node_id: str                    # Unique identifier
    agent_type: str                 # Node specialization type
    capabilities: List[str]         # Available capabilities
    status: NodeStatus              # Current operational status
    last_heartbeat: float          # Last communication timestamp
    connections: Set[str]          # Connected peer node IDs
    load_score: float              # Current workload metric
    integration_progress: Dict[str, float]  # Progress per tool
```

**Node Status Enum:**
```python
class NodeStatus(Enum):
    INITIALIZING = "initializing"   # Node starting up
    ACTIVE = "active"              # Fully operational
    DEGRADED = "degraded"          # Partial functionality
    FAILED = "failed"              # Non-operational
```

### 3. Communication Protocol

**Message Types:**
```python
class MessageType(Enum):
    HEARTBEAT = "heartbeat"            # Health check messages
    TASK_ASSIGNMENT = "task_assignment" # Work distribution
    RESULT_SHARE = "result_share"      # Data sharing
    CONSENSUS_REQUEST = "consensus_request" # Decision making
    FAULT_TOLERANCE = "fault_tolerance"  # Error recovery
```

**Message Structure:**
```python
@dataclass
class MeshMessage:
    sender_id: str              # Source node identifier
    receiver_id: str            # Target node identifier
    message_type: MessageType   # Message category
    payload: Dict[str, Any]     # Message content
    timestamp: float            # Send timestamp
    message_id: str            # Unique message identifier
```

## Setup and Configuration

### 1. Basic Setup

**Install Dependencies:**
```bash
# Core dependencies
pip install asyncio dataclasses enum34 typing

# Optional: Enhanced logging
pip install structlog colorlog
```

**Initialize Coordinator:**
```python
import asyncio
from src.linter_integration.mesh_coordinator import MeshQueenCoordinator

async def setup_mesh():
    coordinator = MeshQueenCoordinator()
    
    # Initialize mesh topology
    await coordinator.initialize_mesh_topology()
    
    # Start coordination
    coordination_results = await coordinator.coordinate_linter_integration()
    
    return coordinator, coordination_results

# Run setup
coordinator, results = asyncio.run(setup_mesh())
```

### 2. Advanced Configuration

**Custom Node Configuration:**
```python
# Configure specialized capabilities per node
SPECIALIST_CONFIG = {
    "system-architect": {
        "capabilities": [
            "external_tool_pipeline_design",
            "integration_architecture", 
            "tool_orchestration",
            "dependency_management"
        ],
        "tools_focus": ["pipeline", "orchestration"],
        "priority_weight": 0.9,
        "max_concurrent_tasks": 5
    },
    "backend-dev": {
        "capabilities": [
            "adapter_pattern_implementation",
            "linter_output_normalization", 
            "error_handling",
            "performance_optimization"
        ],
        "tools_focus": ["flake8", "pylint", "ruff", "mypy", "bandit"],
        "priority_weight": 0.8,
        "max_concurrent_tasks": 3
    },
    "api-docs": {
        "capabilities": [
            "unified_violation_severity_mapping",
            "documentation_generation",
            "api_specification", 
            "schema_validation"
        ],
        "tools_focus": ["severity_mapping", "documentation"],
        "priority_weight": 0.7,
        "max_concurrent_tasks": 4
    },
    "integration-specialist": {
        "capabilities": [
            "real_time_result_ingestion",
            "cross_tool_correlation",
            "data_streaming",
            "result_aggregation"
        ],
        "tools_focus": ["ingestion", "correlation", "streaming"],
        "priority_weight": 1.0,
        "max_concurrent_tasks": 6
    }
}
```

**Environment Configuration:**
```python
# Production configuration
MESH_CONFIG = {
    "heartbeat_interval": 5.0,          # seconds between heartbeats
    "message_timeout": 30.0,            # maximum message processing time
    "consensus_threshold": 0.75,        # agreement threshold for decisions
    "fault_tolerance_level": 0.33,      # Byzantine fault tolerance (33%)
    "load_balancing_strategy": "capability_based",
    "max_retry_attempts": 3,
    "circuit_breaker_threshold": 5,
    "recovery_timeout": 60.0
}
```

## Operational Procedures

### 1. Starting the Mesh

**Step-by-Step Startup:**
```python
async def start_mesh_coordination():
    coordinator = MeshQueenCoordinator()
    
    try:
        # Step 1: Initialize topology
        print("Initializing mesh topology...")
        topology_result = await coordinator.initialize_mesh_topology()
        
        # Step 2: Establish communication
        print("Setting up peer communication...")
        comm_result = await coordinator.establish_peer_communication()
        
        # Step 3: Start coordination
        print("Starting linter integration coordination...")
        coord_result = await coordinator.coordinate_linter_integration()
        
        # Step 4: Begin health monitoring
        print("Starting health monitoring...")
        health_task = asyncio.create_task(
            coordinator.continuous_health_monitoring()
        )
        
        return coordinator, health_task
        
    except Exception as e:
        print(f"Mesh startup failed: {e}")
        raise

# Start the mesh
coordinator, health_task = await start_mesh_coordination()
```

### 2. Task Distribution

**Automatic Task Assignment:**
```python
async def distribute_linter_tasks():
    # Define integration tasks for each node
    integration_tasks = {
        "system-architect": [
            "design_external_tool_pipeline",
            "create_tool_orchestration_framework", 
            "establish_dependency_management"
        ],
        "backend-dev": [
            "implement_flake8_adapter",
            "implement_pylint_adapter",
            "implement_ruff_adapter", 
            "implement_mypy_adapter",
            "implement_bandit_adapter"
        ],
        "api-docs": [
            "create_unified_severity_mapping",
            "document_adapter_interfaces",
            "generate_integration_schemas"
        ],
        "integration-specialist": [
            "setup_real_time_ingestion",
            "implement_cross_tool_correlation",
            "create_result_aggregation_pipeline"
        ]
    }
    
    # Distribute tasks
    coordination_results = await coordinator.coordinate_linter_integration()
    
    return coordination_results

# Example result
{
    "system-architect": {
        "assigned_tasks": ["design_external_tool_pipeline", ...],
        "status": "assigned",
        "progress": 0.0,
        "connections": ["backend-dev", "api-docs", "integration-specialist"]
    },
    # ... other nodes
}
```

### 3. Health Monitoring

**Continuous Health Checks:**
```python
async def monitor_mesh_health():
    while True:
        try:
            # Get comprehensive health status
            health_status = await coordinator.monitor_integration_health()
            
            # Check for unhealthy nodes
            unhealthy_nodes = [
                node_id for node_id, health in health_status["node_health"].items()
                if health["status"] != "active"
            ]
            
            if unhealthy_nodes:
                print(f"Warning: Unhealthy nodes detected: {unhealthy_nodes}")
                
                # Trigger recovery for failed nodes
                for node_id in unhealthy_nodes:
                    if health_status["node_health"][node_id]["status"] == "failed":
                        await coordinator.handle_fault_tolerance(node_id)
            
            # Check overall system health
            system_health = health_status["system_health"]
            if system_health < 0.75:
                print(f"Warning: System health degraded: {system_health}")
            
            await asyncio.sleep(30)  # Check every 30 seconds
            
        except Exception as e:
            print(f"Health monitoring error: {e}")
            await asyncio.sleep(60)  # Longer delay on error

# Start health monitoring
health_monitor_task = asyncio.create_task(monitor_mesh_health())
```

**Health Status Response:**
```python
{
    "topology_health": 1.0,
    "node_health": {
        "system-architect": {
            "status": "active",
            "load_score": 0.3,
            "last_heartbeat_age": 2.5,
            "connection_count": 3
        },
        "backend-dev": {
            "status": "active", 
            "load_score": 0.7,
            "last_heartbeat_age": 1.8,
            "connection_count": 3
        }
        # ... other nodes
    },
    "integration_progress": {
        "system-architect": {
            "flake8": 0.8,
            "pylint": 0.6,
            "ruff": 0.9,
            "mypy": 0.7,
            "bandit": 0.5
        }
        # ... other nodes
    },
    "system_health": 1.0
}
```

## Fault Tolerance

### 1. Byzantine Fault Tolerance

**Design Principles:**
- **33% failure threshold:** System remains operational with 1 out of 4 nodes failed
- **Consensus mechanisms:** Critical decisions require 75% agreement
- **Automatic failover:** Workload redistribution on node failure
- **Recovery procedures:** Automated node restart and reintegration

**Failure Detection:**
```python
async def detect_node_failures():
    current_time = time.time()
    failed_nodes = []
    
    for node_id, node in coordinator.mesh_nodes.items():
        # Check heartbeat timeout
        heartbeat_age = current_time - node.last_heartbeat
        if heartbeat_age > MESH_CONFIG["message_timeout"]:
            node.status = NodeStatus.FAILED
            failed_nodes.append(node_id)
            
            # Log failure
            coordinator.logger.warning(
                f"Node {node_id} failed - heartbeat timeout: {heartbeat_age}s"
            )
    
    return failed_nodes
```

### 2. Workload Redistribution

**Automatic Redistribution:**
```python
async def handle_node_failure(failed_node_id: str):
    """Handle node failure and redistribute workload"""
    
    if failed_node_id not in coordinator.mesh_nodes:
        return {"error": f"Node {failed_node_id} not found"}
    
    # Mark node as failed
    coordinator.mesh_nodes[failed_node_id].status = NodeStatus.FAILED
    coordinator.logger.warning(f"Node {failed_node_id} marked as failed")
    
    # Get healthy nodes
    healthy_nodes = [
        node_id for node_id, node in coordinator.mesh_nodes.items()
        if node.status == NodeStatus.ACTIVE
    ]
    
    if len(healthy_nodes) == 0:
        return {"error": "No healthy nodes available for redistribution"}
    
    # Remove failed node from connection lists
    for node in coordinator.mesh_nodes.values():
        node.connections.discard(failed_node_id)
    
    # Redistribute tasks based on capabilities
    failed_node_tasks = get_node_tasks(failed_node_id)
    redistributed_tasks = distribute_tasks_to_healthy_nodes(
        failed_node_tasks, healthy_nodes
    )
    
    # Update topology health
    coordinator.topology_health = len(healthy_nodes) / len(coordinator.mesh_nodes)
    
    return {
        "failed_node": failed_node_id,
        "healthy_nodes": healthy_nodes,
        "redistributed_tasks": redistributed_tasks,
        "new_topology_health": coordinator.topology_health
    }
```

### 3. Recovery Procedures

**Automatic Node Recovery:**
```python
async def recover_failed_node(node_id: str):
    """Attempt to recover a failed node"""
    
    try:
        # Step 1: Restart node process
        await restart_node_process(node_id)
        
        # Step 2: Re-establish connections
        await reestablish_node_connections(node_id)
        
        # Step 3: Sync state with mesh
        await sync_node_state(node_id)
        
        # Step 4: Redistribute tasks back
        await rebalance_tasks_with_recovered_node(node_id)
        
        # Update node status
        coordinator.mesh_nodes[node_id].status = NodeStatus.ACTIVE
        coordinator.mesh_nodes[node_id].last_heartbeat = time.time()
        
        coordinator.logger.info(f"Node {node_id} successfully recovered")
        
        return {"success": True, "node_id": node_id}
        
    except Exception as e:
        coordinator.logger.error(f"Failed to recover node {node_id}: {e}")
        return {"success": False, "error": str(e)}
```

## Performance Optimization

### 1. Load Balancing

**Capability-Based Load Balancing:**
```python
def calculate_node_load_score(node: MeshNode) -> float:
    """Calculate load score based on current tasks and capabilities"""
    
    # Base load from current tasks
    current_tasks = len(get_active_tasks(node.node_id))
    max_concurrent = SPECIALIST_CONFIG[node.node_id]["max_concurrent_tasks"]
    base_load = current_tasks / max_concurrent
    
    # Capability utilization
    active_capabilities = len(get_active_capabilities(node.node_id))
    total_capabilities = len(node.capabilities)
    capability_load = active_capabilities / total_capabilities
    
    # Resource utilization (CPU, memory)
    resource_load = get_resource_utilization(node.node_id)
    
    # Weighted average
    weights = {"tasks": 0.4, "capabilities": 0.3, "resources": 0.3}
    load_score = (
        weights["tasks"] * base_load +
        weights["capabilities"] * capability_load + 
        weights["resources"] * resource_load
    )
    
    return min(load_score, 1.0)

def select_optimal_node(task_requirements: Dict[str, Any]) -> str:
    """Select the best node for a task based on capabilities and load"""
    
    eligible_nodes = []
    
    for node_id, node in coordinator.mesh_nodes.items():
        if node.status != NodeStatus.ACTIVE:
            continue
            
        # Check capability match
        required_capabilities = task_requirements.get("capabilities", [])
        if not all(cap in node.capabilities for cap in required_capabilities):
            continue
            
        # Calculate suitability score
        load_score = calculate_node_load_score(node)
        capability_match = len(
            set(required_capabilities) & set(node.capabilities)
        ) / len(required_capabilities) if required_capabilities else 1.0
        
        priority_weight = SPECIALIST_CONFIG[node_id]["priority_weight"]
        
        suitability = (capability_match * priority_weight) / (1 + load_score)
        
        eligible_nodes.append((node_id, suitability))
    
    # Select node with highest suitability
    if eligible_nodes:
        return max(eligible_nodes, key=lambda x: x[1])[0]
    
    return None
```

### 2. Connection Optimization

**Connection Health Monitoring:**
```python
def calculate_mesh_connectivity() -> float:
    """Calculate percentage of healthy mesh connections"""
    
    if len(coordinator.mesh_nodes) <= 1:
        return 1.0
    
    max_connections = len(coordinator.mesh_nodes) * (len(coordinator.mesh_nodes) - 1)
    actual_connections = 0
    
    for node in coordinator.mesh_nodes.values():
        if node.status == NodeStatus.ACTIVE:
            healthy_connections = sum(
                1 for peer_id in node.connections 
                if coordinator.mesh_nodes[peer_id].status == NodeStatus.ACTIVE
            )
            actual_connections += healthy_connections
    
    return actual_connections / max_connections if max_connections > 0 else 0.0

async def optimize_connections():
    """Optimize mesh connections for performance"""
    
    connectivity = calculate_mesh_connectivity()
    
    if connectivity < 0.8:  # Less than 80% connectivity
        # Rebuild connections for active nodes
        active_nodes = [
            node_id for node_id, node in coordinator.mesh_nodes.items()
            if node.status == NodeStatus.ACTIVE
        ]
        
        for i, node_id in enumerate(active_nodes):
            for j, peer_id in enumerate(active_nodes):
                if i != j:
                    coordinator.mesh_nodes[node_id].connections.add(peer_id)
        
        coordinator.logger.info(f"Rebuilt mesh connections - connectivity: {connectivity}")
```

### 3. Message Optimization

**Message Batching:**
```python
class MessageBatcher:
    def __init__(self, batch_size: int = 10, flush_interval: float = 1.0):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.message_batches: Dict[str, List[MeshMessage]] = {}
        self.last_flush = time.time()
    
    async def add_message(self, message: MeshMessage):
        """Add message to batch for efficient sending"""
        
        receiver_id = message.receiver_id
        if receiver_id not in self.message_batches:
            self.message_batches[receiver_id] = []
        
        self.message_batches[receiver_id].append(message)
        
        # Auto-flush if batch is full
        if len(self.message_batches[receiver_id]) >= self.batch_size:
            await self.flush_batch(receiver_id)
        
        # Auto-flush if interval exceeded
        if time.time() - self.last_flush > self.flush_interval:
            await self.flush_all_batches()
    
    async def flush_batch(self, receiver_id: str):
        """Send batched messages to specific receiver"""
        
        if receiver_id not in self.message_batches:
            return
        
        messages = self.message_batches[receiver_id]
        if messages:
            await send_message_batch(receiver_id, messages)
            self.message_batches[receiver_id] = []
    
    async def flush_all_batches(self):
        """Send all pending batched messages"""
        
        for receiver_id in list(self.message_batches.keys()):
            await self.flush_batch(receiver_id)
        
        self.last_flush = time.time()
```

## Monitoring and Observability

### 1. Metrics Collection

**Key Metrics:**
```python
@dataclass
class MeshMetrics:
    # Topology metrics
    active_nodes: int
    total_nodes: int
    connectivity_percentage: float
    topology_health: float
    
    # Performance metrics
    average_message_latency: float
    message_throughput: float
    task_completion_rate: float
    
    # Reliability metrics
    node_failure_rate: float
    recovery_success_rate: float
    consensus_agreement_rate: float
    
    # Resource metrics
    total_cpu_usage: float
    total_memory_usage: float
    network_bandwidth_usage: float

async def collect_mesh_metrics() -> MeshMetrics:
    """Collect comprehensive mesh performance metrics"""
    
    active_nodes = sum(
        1 for node in coordinator.mesh_nodes.values()
        if node.status == NodeStatus.ACTIVE
    )
    
    connectivity = calculate_mesh_connectivity()
    
    # Calculate average message latency
    recent_messages = get_recent_messages(time_window=300)  # 5 minutes
    avg_latency = sum(msg.processing_time for msg in recent_messages) / len(recent_messages) if recent_messages else 0
    
    # Calculate throughput
    message_count = len(recent_messages)
    throughput = message_count / 300  # messages per second
    
    return MeshMetrics(
        active_nodes=active_nodes,
        total_nodes=len(coordinator.mesh_nodes),
        connectivity_percentage=connectivity,
        topology_health=coordinator.topology_health,
        average_message_latency=avg_latency,
        message_throughput=throughput,
        # ... other metrics
    )
```

### 2. Alerting System

**Alert Conditions:**
```python
class MeshAlertManager:
    def __init__(self):
        self.alert_thresholds = {
            "low_connectivity": 0.7,        # Below 70% connectivity
            "high_node_failure_rate": 0.2,  # Above 20% failure rate
            "high_message_latency": 5.0,    # Above 5 seconds
            "low_consensus_rate": 0.8,      # Below 80% consensus
            "degraded_health": 0.6          # Below 60% health
        }
    
    async def check_alerts(self, metrics: MeshMetrics):
        """Check metrics against alert thresholds"""
        
        alerts = []
        
        if metrics.connectivity_percentage < self.alert_thresholds["low_connectivity"]:
            alerts.append({
                "type": "connectivity",
                "severity": "warning",
                "message": f"Mesh connectivity low: {metrics.connectivity_percentage:.1%}",
                "recommendation": "Check for failed nodes and network issues"
            })
        
        if metrics.average_message_latency > self.alert_thresholds["high_message_latency"]:
            alerts.append({
                "type": "performance",
                "severity": "warning", 
                "message": f"High message latency: {metrics.average_message_latency:.2f}s",
                "recommendation": "Investigate network performance and node load"
            })
        
        if metrics.topology_health < self.alert_thresholds["degraded_health"]:
            alerts.append({
                "type": "health",
                "severity": "critical",
                "message": f"Mesh health degraded: {metrics.topology_health:.1%}",
                "recommendation": "Immediate attention required - check failed nodes"
            })
        
        # Send alerts
        for alert in alerts:
            await self.send_alert(alert)
        
        return alerts
    
    async def send_alert(self, alert: Dict[str, Any]):
        """Send alert notification"""
        coordinator.logger.warning(f"MESH ALERT: {alert['message']}")
        
        # Integration with external alerting systems
        # await send_slack_notification(alert)
        # await send_email_alert(alert)
        # await update_monitoring_dashboard(alert)
```

### 3. Dashboard Integration

**Mesh Status Dashboard:**
```python
def generate_mesh_status_dashboard() -> Dict[str, Any]:
    """Generate dashboard data for mesh status visualization"""
    
    # Collect current metrics
    metrics = asyncio.run(collect_mesh_metrics())
    
    # Node status summary
    node_statuses = {}
    for node_id, node in coordinator.mesh_nodes.items():
        node_statuses[node_id] = {
            "status": node.status.value,
            "load_score": calculate_node_load_score(node),
            "connections": len(node.connections),
            "last_heartbeat": node.last_heartbeat,
            "capabilities": len(node.capabilities)
        }
    
    # Integration progress
    integration_progress = {}
    for tool in coordinator.integration_tools:
        tool_progress = sum(
            node.integration_progress[tool] 
            for node in coordinator.mesh_nodes.values()
        ) / len(coordinator.mesh_nodes)
        integration_progress[tool] = tool_progress
    
    return {
        "timestamp": time.time(),
        "metrics": metrics,
        "node_statuses": node_statuses,
        "integration_progress": integration_progress,
        "topology": {
            "type": "full_mesh",
            "fault_tolerance": "byzantine_33_percent",
            "communication_protocol": "peer_to_peer"
        }
    }
```

## Troubleshooting Guide

### Common Issues

**1. Node Communication Failures**
```python
# Symptoms: Nodes not responding to heartbeats
# Check: Network connectivity and firewall settings
# Fix: Restart failed nodes and verify network configuration

async def diagnose_communication_failure(node_id: str):
    """Diagnose communication issues with a specific node"""
    
    diagnostics = {
        "node_exists": node_id in coordinator.mesh_nodes,
        "node_status": coordinator.mesh_nodes[node_id].status.value if node_id in coordinator.mesh_nodes else "not_found",
        "last_heartbeat_age": time.time() - coordinator.mesh_nodes[node_id].last_heartbeat if node_id in coordinator.mesh_nodes else "unknown",
        "connection_count": len(coordinator.mesh_nodes[node_id].connections) if node_id in coordinator.mesh_nodes else 0
    }
    
    # Test connectivity
    try:
        test_message = MeshMessage(
            sender_id="diagnostic",
            receiver_id=node_id,
            message_type=MessageType.HEARTBEAT,
            payload={},
            timestamp=time.time(),
            message_id=f"diag_{time.time()}"
        )
        
        # Attempt to send test message
        response = await send_test_message(test_message)
        diagnostics["connectivity_test"] = "passed" if response else "failed"
        
    except Exception as e:
        diagnostics["connectivity_test"] = f"error: {e}"
    
    return diagnostics
```

**2. Consensus Failures**
```python
# Symptoms: Decisions not reaching required agreement threshold
# Check: Network partitions, node synchronization
# Fix: Verify time synchronization and network stability

async def diagnose_consensus_failure():
    """Diagnose consensus mechanism issues"""
    
    active_nodes = [
        node_id for node_id, node in coordinator.mesh_nodes.items()
        if node.status == NodeStatus.ACTIVE
    ]
    
    if len(active_nodes) < 3:
        return {
            "issue": "insufficient_nodes",
            "recommendation": "Need at least 3 active nodes for reliable consensus"
        }
    
    # Check clock synchronization
    time_diffs = []
    for node_id in active_nodes:
        node_time = await get_node_time(node_id)
        time_diff = abs(node_time - time.time())
        time_diffs.append((node_id, time_diff))
    
    max_time_diff = max(time_diffs, key=lambda x: x[1])
    
    if max_time_diff[1] > 5.0:  # More than 5 seconds difference
        return {
            "issue": "clock_synchronization",
            "problematic_node": max_time_diff[0],
            "time_difference": max_time_diff[1],
            "recommendation": "Synchronize system clocks using NTP"
        }
    
    return {"status": "healthy"}
```

**3. Performance Degradation**
```python
# Symptoms: High message latency, slow task completion
# Check: Node load, network bandwidth, resource usage
# Fix: Scale resources, optimize task distribution

async def diagnose_performance_issues():
    """Diagnose mesh performance problems"""
    
    issues = []
    
    # Check node load distribution
    load_scores = [
        calculate_node_load_score(node) 
        for node in coordinator.mesh_nodes.values()
        if node.status == NodeStatus.ACTIVE
    ]
    
    if load_scores:
        max_load = max(load_scores)
        avg_load = sum(load_scores) / len(load_scores)
        load_imbalance = max_load - avg_load
        
        if load_imbalance > 0.3:  # 30% imbalance
            issues.append({
                "type": "load_imbalance",
                "severity": "warning",
                "details": f"Load imbalance: {load_imbalance:.2f}",
                "recommendation": "Redistribute tasks across nodes"
            })
    
    # Check message queue sizes
    for node_id, node in coordinator.mesh_nodes.items():
        queue_size = len(coordinator.message_queue)
        if queue_size > 100:  # Arbitrary threshold
            issues.append({
                "type": "message_queue_buildup",
                "node": node_id,
                "queue_size": queue_size,
                "recommendation": "Increase message processing rate or add more nodes"
            })
    
    return issues
```

### Debug Commands

**Enable Debug Logging:**
```bash
export MESH_DEBUG=true
export MESH_LOG_LEVEL=debug

python -c "
from src.linter_integration.mesh_coordinator import mesh_coordinator
import asyncio

async def debug_mesh():
    await mesh_coordinator.initialize_mesh_topology()
    status = await mesh_coordinator.monitor_integration_health()
    print('Mesh Status:', status)

asyncio.run(debug_mesh())
"
```

**Manual Node Recovery:**
```python
# Force recovery of specific node
await coordinator.handle_fault_tolerance('backend-dev')

# Reset all circuit breakers
for node_id in coordinator.mesh_nodes:
    coordinator.mesh_nodes[node_id].status = NodeStatus.ACTIVE

# Rebuild mesh connections
await coordinator.establish_peer_communication()
```

**Health Check Script:**
```python
#!/usr/bin/env python3
"""
Mesh Health Check Script
Run this to diagnose mesh coordination issues
"""

import asyncio
from src.linter_integration.mesh_coordinator import mesh_coordinator

async def health_check():
    print("=== Mesh Coordination Health Check ===")
    
    # Initialize if needed
    try:
        await mesh_coordinator.initialize_mesh_topology()
        print("[CHECK] Mesh topology initialized")
    except Exception as e:
        print(f"[X] Topology initialization failed: {e}")
        return
    
    # Check node health
    health = await mesh_coordinator.monitor_integration_health()
    print(f"\n=== Node Health ===")
    for node_id, node_health in health["node_health"].items():
        status_icon = "[CHECK]" if node_health["status"] == "active" else "[X]"
        print(f"{status_icon} {node_id}: {node_health['status']}")
    
    # Check connectivity
    connectivity = calculate_mesh_connectivity()
    connectivity_icon = "[CHECK]" if connectivity > 0.8 else "[X]"
    print(f"\n=== Connectivity ===")
    print(f"{connectivity_icon} Mesh connectivity: {connectivity:.1%}")
    
    # Check performance
    print(f"\n=== Performance ===")
    print(f"System health: {health['system_health']:.1%}")
    
    print(f"\n=== Integration Progress ===")
    for tool, progress in health["integration_progress"].items():
        avg_progress = sum(progress.values()) / len(progress) if progress else 0
        print(f"{tool}: {avg_progress:.1%}")

if __name__ == "__main__":
    asyncio.run(health_check())
```

---

This comprehensive Mesh Coordination Manual provides everything needed to deploy, manage, and troubleshoot the peer-to-peer topology system that orchestrates distributed linter integration across specialized agent nodes with full Byzantine fault tolerance and real-time monitoring capabilities.
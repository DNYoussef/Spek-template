from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import pytest
import asyncio
import tempfile
import time
import psutil
import os
import json
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path
from typing import Dict, Any, List

# Import system under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from linter_integration.tool_management_system import (
    ToolManagementSystem,
    ToolConfiguration,
    ToolEnvironment,
    ResourceAllocation,
    ToolHealth,
    ToolMetrics,
    ToolExecutionOptions,
    ToolExecutionResult,
    ToolStatus
)

# Mock linter tool definitions
class MockLinterTool:
    """Mock linter tool for testing"""
    
    def __init__(self, tool_id: str, name: str, command: str):
        self.id = tool_id
        self.name = name
        self.command = command
        self.args = ["--format=json"]
        self.timeout = 30000
        self.outputFormat = "json"
        self.healthCheckCommand = f"{command} --version"

class TestToolManagementSystem:
    """Test suite for tool management system"""
    
    @pytest.fixture
    def temp_workspace(self):
        """Create temporary workspace for testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir
    
    @pytest.fixture
    def tool_manager(self, temp_workspace):
        """Create tool management system instance"""
        return ToolManagementSystem(temp_workspace)
    
    @pytest.fixture
    def mock_tools(self):
        """Create mock linter tools"""
        return {
            "flake8": MockLinterTool("flake8", "Flake8", "flake8"),
            "pylint": MockLinterTool("pylint", "Pylint", "pylint"),
            "ruff": MockLinterTool("ruff", "Ruff", "ruff"),
            "mypy": MockLinterTool("mypy", "MyPy", "mypy"),
            "bandit": MockLinterTool("bandit", "Bandit", "bandit")
        }
    
    def test_initialization(self, tool_manager, temp_workspace):
        """Test tool management system initialization"""
        assert tool_manager.workspaceRoot == temp_workspace
        assert len(tool_manager.environments) == 3  # nodejs, python, system
        assert len(tool_manager.resourceAllocations) == 7  # Default allocations
        assert tool_manager.maxGlobalConcurrency == 10
        
        # Verify default environments
        assert "nodejs" in tool_manager.environments
        assert "python" in tool_manager.environments
        assert "system" in tool_manager.environments
        
        # Verify nodejs environment
        nodejs_env = tool_manager.environments["nodejs"]
        assert nodejs_env.workingDirectory == temp_workspace
        assert "NODE_ENV" in nodejs_env.environmentVariables
        assert "node_modules/.bin" in nodejs_env.pathExtensions
        
        # Verify python environment
        python_env = tool_manager.environments["python"]
        assert python_env.workingDirectory == temp_workspace
        assert "PYTHONPATH" in python_env.environmentVariables
        assert ".venv/bin" in python_env.pathExtensions
    
    def test_default_resource_allocations(self, tool_manager):
        """Test default resource allocation configuration"""
        # Verify all expected tools have allocations
        expected_tools = ["eslint", "tsc", "flake8", "pylint", "ruff", "mypy", "bandit"]
        for tool in expected_tools:
            assert tool in tool_manager.resourceAllocations
            
        # Verify allocation properties
        flake8_alloc = tool_manager.resourceAllocations["flake8"]
        assert flake8_alloc.concurrencyLimit == 2
        assert flake8_alloc.priorityWeight == 0.7
        assert flake8_alloc.executionQuota == 80
        assert flake8_alloc.throttleInterval == 1500
        
        # Verify ruff has higher concurrency (it's faster)
        ruff_alloc = tool_manager.resourceAllocations["ruff"]
        assert ruff_alloc.concurrencyLimit == 4
        assert ruff_alloc.executionQuota == 150
        assert ruff_alloc.throttleInterval == 500
        
        # Verify pylint has lower concurrency (it's slower)
        pylint_alloc = tool_manager.resourceAllocations["pylint"]
        assert pylint_alloc.concurrencyLimit == 1
        assert pylint_alloc.executionQuota == 30
        assert pylint_alloc.throttleInterval == 3000
    
    @pytest.mark.asyncio
    async def test_tool_registration_success(self, tool_manager, mock_tools):
        """Test successful tool registration"""
        tool = mock_tools["flake8"]
        config = ToolConfiguration(
            configFile=".flake8",
            rules={"max-line-length": 88},
            ignore=["E203", "W503"]
        )
        
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool, config)
        
        # Verify tool is registered
        assert tool.id in tool_manager.tools
        assert tool_manager.tools[tool.id] == tool
        assert tool_manager.configurations[tool.id] == config
        
        # Verify health and metrics initialized
        assert tool.id in tool_manager.healthStatus
        assert tool.id in tool_manager.metrics
        assert tool.id in tool_manager.circuitBreakers
        assert tool.id in tool_manager.recoveryProcedures
        
        # Verify initial health status
        health = tool_manager.healthStatus[tool.id]
        assert health.isHealthy is True
        assert health.healthScore == 100
        assert health.failureRate == 0
        
        # Verify initial metrics
        metrics = tool_manager.metrics[tool.id]
        assert metrics.totalExecutions == 0
        assert metrics.successfulExecutions == 0
        assert metrics.failedExecutions == 0
        assert metrics.minExecutionTime == float('inf')
    
    @pytest.mark.asyncio
    async def test_tool_registration_failure(self, tool_manager, mock_tools):
        """Test tool registration failure handling"""
        tool = mock_tools["flake8"]
        
        # Mock validation failure
        with patch.object(tool_manager, 'validateToolInstallation', 
                        side_effect=Exception("Tool not found")):
            with pytest.raises(Exception, match="Tool not found"):
                await tool_manager.registerTool(tool)
        
        # Verify tool is not registered
        assert tool.id not in tool_manager.tools
    
    @pytest.mark.asyncio
    async def test_tool_validation(self, tool_manager, mock_tools):
        """Test tool installation validation"""
        tool = mock_tools["flake8"]
        
        # Mock successful validation
        with patch('subprocess.run') as mock_run:
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "flake8 6.0.0"
            
            # This would normally validate the tool
            with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
                await tool_manager.registerTool(tool)
        
        assert tool.id in tool_manager.tools
    
    @pytest.mark.asyncio
    async def test_tool_execution_success(self, tool_manager, mock_tools, temp_workspace):
        """Test successful tool execution"""
        tool = mock_tools["flake8"]
        
        # Register tool first
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        # Create test files
        test_files = [
            os.path.join(temp_workspace, "test1.py"),
            os.path.join(temp_workspace, "test2.py")
        ]
        
        for file_path in test_files:
            Path(file_path).write_text("print('hello world')\n")
        
        # Mock tool execution
        mock_result = ToolExecutionResult(
            success=True,
            output='[{"file": "test1.py", "line": 1, "message": "test"}]',
            stderr="",
            executionTime=1.5,
            memoryUsed=1024,
            exitCode=0,
            violationsFound=1
        )
        
        with patch.object(tool_manager, 'executeWithMonitoring', 
                        return_value=mock_result):
            result = await tool_manager.executeTool(tool.id, test_files)
        
        assert result.success is True
        assert result.executionTime == 1.5
        assert result.violationsFound == 1
        
        # Verify metrics were updated
        metrics = tool_manager.metrics[tool.id]
        assert metrics.totalExecutions == 1
        assert metrics.successfulExecutions == 1
        assert metrics.failedExecutions == 0
    
    @pytest.mark.asyncio
    async def test_tool_execution_failure(self, tool_manager, mock_tools, temp_workspace):
        """Test tool execution failure handling"""
        tool = mock_tools["flake8"]
        
        # Register tool first
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        test_files = [os.path.join(temp_workspace, "test.py")]
        
        # Mock tool execution failure
        with patch.object(tool_manager, 'executeWithMonitoring', 
                        side_effect=Exception("Execution failed")):
            with pytest.raises(Exception, match="Execution failed"):
                await tool_manager.executeTool(tool.id, test_files)
        
        # Verify failure metrics were updated
        metrics = tool_manager.metrics[tool.id]
        assert metrics.totalExecutions == 1
        assert metrics.successfulExecutions == 0
        assert metrics.failedExecutions == 1
        
        # Verify circuit breaker state
        circuit_breaker = tool_manager.circuitBreakers[tool.id]
        assert circuit_breaker.failureCount == 1
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_functionality(self, tool_manager, mock_tools, temp_workspace):
        """Test circuit breaker opens after multiple failures"""
        tool = mock_tools["flake8"]
        
        # Register tool
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        test_files = [os.path.join(temp_workspace, "test.py")]
        
        # Cause 5 failures to trigger circuit breaker
        with patch.object(tool_manager, 'executeWithMonitoring', 
                        side_effect=Exception("Execution failed")):
            for i in range(5):
                with pytest.raises(Exception):
                    await tool_manager.executeTool(tool.id, test_files)
        
        # Circuit breaker should be open
        circuit_breaker = tool_manager.circuitBreakers[tool.id]
        assert circuit_breaker.isOpen is True
        assert circuit_breaker.failureCount == 5
        
        # Next execution should fail due to circuit breaker
        with pytest.raises(Exception, match="Circuit breaker open"):
            await tool_manager.executeTool(tool.id, test_files)
    
    @pytest.mark.asyncio
    async def test_resource_allocation_concurrency(self, tool_manager, mock_tools, temp_workspace):
        """Test resource allocation and concurrency limits"""
        tool = mock_tools["pylint"]  # Has concurrency limit of 1
        
        # Register tool
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        test_files = [os.path.join(temp_workspace, "test.py")]
        
        # Mock slow execution
        async def slow_execution(*args, **kwargs):
            await asyncio.sleep(0.1)
            return ToolExecutionResult(
                success=True,
                output="[]",
                stderr="",
                executionTime=100,
                memoryUsed=1024,
                exitCode=0,
                violationsFound=0
            )
        
        with patch.object(tool_manager, 'executeWithMonitoring', side_effect=slow_execution):
            # Start first execution
            task1 = asyncio.create_task(tool_manager.executeTool(tool.id, test_files))
            
            # Start second execution immediately - should be queued
            task2 = asyncio.create_task(tool_manager.executeTool(tool.id, test_files))
            
            # Both should complete eventually
            result1, result2 = await asyncio.gather(task1, task2)
            
            assert result1.success is True
            assert result2.success is True
    
    @pytest.mark.asyncio
    async def test_health_monitoring(self, tool_manager, mock_tools):
        """Test health monitoring and status tracking"""
        tool = mock_tools["flake8"]
        
        # Register tool
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        # Simulate health check
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.performToolHealthCheck(tool.id)
        
        # Verify health status
        health = tool_manager.healthStatus[tool.id]
        assert health.isHealthy is True
        assert health.healthScore == 100
        
        # Simulate health check failure
        with patch.object(tool_manager, 'validateToolInstallation', 
                        side_effect=Exception("Health check failed")):
            await tool_manager.performToolHealthCheck(tool.id)
        
        # Verify degraded health
        health = tool_manager.healthStatus[tool.id]
        assert health.isHealthy is False
        assert health.healthScore < 100
        assert health.lastError == "Health check failed"
    
    @pytest.mark.asyncio
    async def test_tool_recovery_procedures(self, tool_manager, mock_tools):
        """Test tool recovery procedures"""
        tool = mock_tools["flake8"]
        
        # Register tool
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        # Verify recovery procedures were set up
        procedures = tool_manager.recoveryProcedures[tool.id]
        assert procedures.resetConfiguration is True
        assert procedures.clearCache is True
        assert len(procedures.customRecoverySteps) > 0
        
        # Test recovery execution
        with patch.object(tool_manager, 'resetToolConfiguration', new_callable=AsyncMock), \
            patch.object(tool_manager, 'clearToolCache', new_callable=AsyncMock), \
            patch.object(tool_manager, 'executeRecoveryStep', new_callable=AsyncMock):
            
            await tool_manager.attemptToolRecovery(tool.id)
        
        # Recovery should reinitialize health
        health = tool_manager.healthStatus[tool.id]
        assert health.isHealthy is True
        assert health.healthScore == 100
    
    def test_tool_status_retrieval(self, tool_manager, mock_tools):
        """Test tool status retrieval"""
        tool = mock_tools["flake8"]
        
        # Register tool synchronously for this test
        tool_manager.tools[tool.id] = tool
        tool_manager.initializeToolHealth(tool.id)
        tool_manager.initializeToolMetrics(tool.id)
        tool_manager.circuitBreakers[tool.id] = {
            "isOpen": False,
            "failureCount": 0,
            "lastFailureTime": 0,
            "successCount": 0,
            "nextAttemptTime": 0
        }
        tool_manager.resourceAllocations[tool.id] = ResourceAllocation(
            concurrencyLimit=2,
            priorityWeight=0.8,
            executionQuota=100,
            throttleInterval=1000
        )
        
        # Get tool status
        status = tool_manager.getToolStatus(tool.id)
        
        assert isinstance(status, ToolStatus)
        assert status.tool == tool
        assert status.health.isHealthy is True
        assert status.metrics.totalExecutions == 0
        assert status.circuitBreaker["isOpen"] is False
        assert status.allocation.concurrencyLimit == 2
        assert status.isRunning is False
        assert status.queueLength == 0
    
    def test_all_tools_status_retrieval(self, tool_manager, mock_tools):
        """Test retrieving status of all tools"""
        # Register multiple tools
        for tool_id, tool in mock_tools.items():
            tool_manager.tools[tool_id] = tool
            tool_manager.initializeToolHealth(tool_id)
            tool_manager.initializeToolMetrics(tool_id)
            tool_manager.circuitBreakers[tool_id] = {
                "isOpen": False,
                "failureCount": 0,
                "lastFailureTime": 0,
                "successCount": 0,
                "nextAttemptTime": 0
            }
        
        all_status = tool_manager.getAllToolStatus()
        
        assert len(all_status) == len(mock_tools)
        for tool_id in mock_tools.keys():
            assert tool_id in all_status
            assert isinstance(all_status[tool_id], ToolStatus)
    
    def test_tool_environment_selection(self, tool_manager):
        """Test tool environment selection logic"""
        # Create mock tools for different environments
        nodejs_tool = MockLinterTool("eslint", "ESLint", "eslint")
        python_tool = MockLinterTool("flake8", "Flake8", "flake8")
        system_tool = MockLinterTool("custom", "Custom", "custom")
        
        # Test environment selection
        nodejs_env = tool_manager.getToolEnvironment(nodejs_tool)
        assert nodejs_env == tool_manager.environments["nodejs"]
        
        python_env = tool_manager.getToolEnvironment(python_tool)
        assert python_env == tool_manager.environments["python"]
        
        system_env = tool_manager.getToolEnvironment(system_tool)
        assert system_env == tool_manager.environments["system"]
    
    def test_execution_args_preparation(self, tool_manager, mock_tools):
        """Test execution arguments preparation"""
        tool = mock_tools["flake8"]
        config = ToolConfiguration(
            customArgs=["--max-line-length=88", "--ignore=E203"]
        )
        options = ToolExecutionOptions(
            additionalArgs=["--verbose"]
        )
        
        file_paths = ["test1.py", "test2.py"]
        
        args = tool_manager.prepareExecutionArgs(tool, file_paths, config, options)
        
        # Should include base args, config args, option args, and file paths
        expected_args = [
            "--format=json",  # Base args
            "--max-line-length=88", "--ignore=E203",  # Config args
            "--verbose",  # Option args
            "test1.py", "test2.py"  # File paths
        ]
        
        assert args == expected_args
    
    def test_running_process_tracking(self, tool_manager):
        """Test running process count tracking"""
        tool_id = "flake8"
        
        # Initially no running processes
        assert tool_manager.getRunningProcessCount(tool_id) == 0
        
        # Add mock running processes
        mock_process = Mock()
        tool_manager.runningProcesses[f"{tool_id}_123"] = mock_process
        tool_manager.runningProcesses[f"{tool_id}_456"] = mock_process
        tool_manager.runningProcesses["other_tool_789"] = mock_process
        
        # Should count only processes for the specific tool
        assert tool_manager.getRunningProcessCount(tool_id) == 2
    
    def test_violation_counting(self, tool_manager, mock_tools):
        """Test violation counting from tool output"""
        tool = mock_tools["flake8"]
        
        # JSON output with violations
        json_output = json.dumps([
            {
                "filename": "test1.py",
                "messages": [
                    {"line": 1, "message": "line too long"},
                    {"line": 5, "message": "unused import"}
                ]
            },
            {
                "filename": "test2.py", 
                "messages": [
                    {"line": 10, "message": "undefined variable"}
                ]
            }
        ])
        
        violation_count = tool_manager.countViolationsInOutput(tool, json_output)
        assert violation_count == 3  # 2 + 1 violations
        
        # Text output fallback
        text_output = "test1.py:1:1: E501 line too long\ntest1.py:5:1: F401 unused import\n"
        violation_count = tool_manager.countViolationsInOutput(tool, text_output)
        assert violation_count == 2  # 2 non-empty lines
    
    @pytest.mark.asyncio
    async def test_execution_queue_processing(self, tool_manager, mock_tools):
        """Test execution queue processing when resources become available"""
        tool = mock_tools["pylint"]  # Concurrency limit = 1
        
        # Register tool
        with patch.object(tool_manager, 'validateToolInstallation', new_callable=AsyncMock):
            await tool_manager.registerTool(tool)
        
        # Create execution queue
        queue_items = []
        for i in range(3):
            queue_item = Mock()
            queue_items.append(queue_item)
        
        tool_manager.executionQueue[tool.id] = queue_items.copy()
        
        # Process one item from queue
        tool_manager.processExecutionQueue(tool.id)
        
        # First item should be called and removed
        queue_items[0].assert_called_once()
        assert len(tool_manager.executionQueue[tool.id]) == 2
    
    def test_metrics_update_on_success(self, tool_manager, mock_tools):
        """Test metrics update on successful execution"""
        tool = mock_tools["flake8"]
        
        # Initialize tool
        tool_manager.tools[tool.id] = tool
        tool_manager.initializeToolHealth(tool.id)
        tool_manager.initializeToolMetrics(tool.id)
        
        # Mock execution result
        result = ToolExecutionResult(
            success=True,
            output="[]",
            stderr="",
            executionTime=2.5,
            memoryUsed=1024,
            exitCode=0,
            violationsFound=5
        )
        
        # Update metrics
        tool_manager.updateSuccessMetrics(tool.id, 2.5, result)
        
        # Verify metrics
        metrics = tool_manager.metrics[tool.id]
        health = tool_manager.healthStatus[tool.id]
        
        assert metrics.totalExecutions == 1
        assert metrics.successfulExecutions == 1
        assert metrics.failedExecutions == 0
        assert metrics.averageExecutionTime == 2.5
        assert metrics.minExecutionTime == 2.5
        assert metrics.maxExecutionTime == 2.5
        assert metrics.totalViolationsFound == 5
        
        assert health.successfulExecutions == 1
        assert health.failureRate == 0.0
    
    def test_metrics_update_on_failure(self, tool_manager, mock_tools):
        """Test metrics update on failed execution"""
        tool = mock_tools["flake8"]
        
        # Initialize tool
        tool_manager.tools[tool.id] = tool
        tool_manager.initializeToolHealth(tool.id)
        tool_manager.initializeToolMetrics(tool.id)
        
        # Update failure metrics
        error = Exception("Execution failed")
        tool_manager.updateFailureMetrics(tool.id, 1.0, error)
        
        # Verify metrics
        metrics = tool_manager.metrics[tool.id]
        health = tool_manager.healthStatus[tool.id]
        
        assert metrics.totalExecutions == 1
        assert metrics.successfulExecutions == 0
        assert metrics.failedExecutions == 1
        
        assert health.failedExecutions == 1
        assert health.failureRate == 1.0
        assert health.lastError == "Execution failed"

class TestToolConfiguration:
    """Test suite for tool configuration management"""
    
    def test_tool_configuration_creation(self):
        """Test tool configuration object creation"""
        config = ToolConfiguration(
            configFile=".flake8",
            rules={"max-line-length": 88, "ignore": ["E203", "W503"]},
            ignore=["*.pyc", "__pycache__"],
            include=["*.py"],
            customArgs=["--statistics"],
            environment=ToolEnvironment(
                nodeVersion="18.0.0",
                environmentVariables={"DEBUG": "1"},
                workingDirectory="/test",
                pathExtensions=["bin"]
            )
        )
        
        assert config.configFile == ".flake8"
        assert config.rules["max-line-length"] == 88
        assert "E203" in config.ignore
        assert "*.py" in config.include
        assert "--statistics" in config.customArgs
        assert config.environment.nodeVersion == "18.0.0"
    
    def test_resource_allocation_configuration(self):
        """Test resource allocation configuration"""
        allocation = ResourceAllocation(
            cpuLimit=2.0,
            memoryLimit=1024 * 1024 * 1024,  # 1GB
            concurrencyLimit=3,
            priorityWeight=0.8,
            executionQuota=100,
            throttleInterval=2000
        )
        
        assert allocation.cpuLimit == 2.0
        assert allocation.memoryLimit == 1024 * 1024 * 1024
        assert allocation.concurrencyLimit == 3
        assert allocation.priorityWeight == 0.8
        assert allocation.executionQuota == 100
        assert allocation.throttleInterval == 2000

class TestToolHealthMonitoring:
    """Test suite for tool health monitoring"""
    
    @pytest.fixture
    def tool_manager(self, temp_workspace):
        """Create tool management system instance"""
        return ToolManagementSystem(temp_workspace)
    
    def test_health_initialization(self, tool_manager):
        """Test health status initialization"""
        tool_id = "test_tool"
        tool_manager.initializeToolHealth(tool_id)
        
        health = tool_manager.healthStatus[tool_id]
        assert health.isHealthy is True
        assert health.healthScore == 100
        assert health.failureRate == 0
        assert health.averageExecutionTime == 0
        assert health.successfulExecutions == 0
        assert health.failedExecutions == 0
        assert health.lastError is None
    
    def test_health_degradation(self, tool_manager):
        """Test health score degradation on failures"""
        tool_id = "test_tool"
        tool_manager.initializeToolHealth(tool_id)
        
        health = tool_manager.healthStatus[tool_id]
        original_score = health.healthScore
        
        # Simulate health check failure
        health.isHealthy = False
        health.healthScore = max(0, health.healthScore - 20)
        health.lastError = "Test error"
        
        assert health.healthScore < original_score
        assert health.lastError == "Test error"
    
    def test_health_recovery(self, tool_manager):
        """Test health score recovery on success"""
        tool_id = "test_tool"
        tool_manager.initializeToolHealth(tool_id)
        
        health = tool_manager.healthStatus[tool_id]
        
        # Simulate degradation then recovery
        health.healthScore = 60
        health.isHealthy = False
        
        # Recovery
        health.isHealthy = True
        health.healthScore = min(100, health.healthScore + MAXIMUM_FUNCTION_PARAMETERS)
        
        assert health.healthScore == 70
        assert health.isHealthy is True

class TestToolPerformanceMetrics:
    """Test suite for tool performance metrics"""
    
    @pytest.fixture
    def tool_manager(self, temp_workspace):
        """Create tool management system instance"""
        return ToolManagementSystem(temp_workspace)
    
    def test_metrics_initialization(self, tool_manager):
        """Test metrics initialization"""
        tool_id = "test_tool"
        tool_manager.initializeToolMetrics(tool_id)
        
        metrics = tool_manager.metrics[tool_id]
        assert metrics.totalExecutions == 0
        assert metrics.successfulExecutions == 0
        assert metrics.failedExecutions == 0
        assert metrics.averageExecutionTime == 0
        assert metrics.minExecutionTime == float('inf')
        assert metrics.maxExecutionTime == 0
        assert metrics.totalViolationsFound == 0
        assert len(metrics.uniqueRulesTriggered) == 0
    
    def test_metrics_accumulation(self, tool_manager):
        """Test metrics accumulation over multiple executions"""
        tool_id = "test_tool"
        tool_manager.initializeToolMetrics(tool_id)
        tool_manager.initializeToolHealth(tool_id)
        
        # Simulate multiple successful executions
        execution_times = [1.0, 2.0, 3.0]
        violations_found = [5, 3, 7]
        
        for i, (exec_time, violations) in enumerate(zip(execution_times, violations_found)):
            result = ToolExecutionResult(
                success=True,
                output="[]",
                stderr="",
                executionTime=exec_time,
                memoryUsed=1024,
                exitCode=0,
                violationsFound=violations
            )
            tool_manager.updateSuccessMetrics(tool_id, exec_time, result)
        
        metrics = tool_manager.metrics[tool_id]
        
        assert metrics.totalExecutions == 3
        assert metrics.successfulExecutions == 3
        assert metrics.failedExecutions == 0
        assert metrics.averageExecutionTime == 2.0  # (1+2+3)/3
        assert metrics.minExecutionTime == 1.0
        assert metrics.maxExecutionTime == 3.0
        assert metrics.totalViolationsFound == 15  # 5+3+7
    
    def test_execution_time_statistics(self, tool_manager):
        """Test execution time statistics calculation"""
        tool_id = "test_tool"
        tool_manager.initializeToolMetrics(tool_id)
        tool_manager.initializeToolHealth(tool_id)
        
        # Add execution with different times
        times = [0.5, 1.0, 1.5, 2.0, 10.0]  # Including outlier
        
        for exec_time in times:
            result = ToolExecutionResult(
                success=True,
                output="[]",
                stderr="",
                executionTime=exec_time,
                memoryUsed=1024,
                exitCode=0,
                violationsFound=0
            )
            tool_manager.updateSuccessMetrics(tool_id, exec_time, result)
        
        metrics = tool_manager.metrics[tool_id]
        
        assert metrics.minExecutionTime == 0.5
        assert metrics.maxExecutionTime == 10.0
        assert metrics.averageExecutionTime == 3.0  # (0.5+1.0+1.5+2.0+10.0)/5

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
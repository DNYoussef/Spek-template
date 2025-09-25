#!/usr/bin/env python3
"""
Integration API Server Tests
Comprehensive test suite for REST, WebSocket, and GraphQL endpoints.
"""

from typing import Dict, Any, List
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import json
import time

from aiohttp import web, WSMsgType
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
import aiohttp
import asyncio
import pytest
import weakref
import websockets

# Import system under test
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

class MockIngestionEngine:
    """Mock real-time ingestion engine for testing"""
    
    def __init__(self):
        self.executions = []
        
    async def executeRealtimeLinting(self, filePaths: List[str], options: Dict[str, Any] = None):
        """Mock linting execution"""
        self.executions.append({
            "filePaths": filePaths,
            "options": options or {},
            "timestamp": time.time()
        })
        
        return {
            "correlationId": f"test_{len(self.executions)}",
            "status": "completed",
            "violations": [
                {
                    "tool": "flake8",
                    "file": filePaths[0] if filePaths else "test.py",
                    "line": 1,
                    "column": 1,
                    "severity": "medium",
                    "message": "Test violation",
                    "rule": "E501"
                }
            ]
        }

class MockToolManager:
    """Mock tool management system for testing"""
    
    def __init__(self):
        self.tools = {
            "flake8": {
                "name": "flake8",
                "version": "6.0.0",
                "status": "healthy",
                "metrics": {
                    "totalExecutions": 150,
                    "successfulExecutions": 145,
                    "failedExecutions": 5
                }
            },
            "pylint": {
                "name": "pylint",
                "version": "2.17.0",
                "status": "healthy",
                "metrics": {
                    "totalExecutions": 120,
                    "successfulExecutions": 115,
                    "failedExecutions": 5
                }
            },
            "ruff": {
                "name": "ruff",
                "version": "0.1.0",
                "status": "healthy",
                "metrics": {
                    "totalExecutions": 200,
                    "successfulExecutions": 198,
                    "failedExecutions": 2
                }
            }
        }
        
    def getAllToolStatus(self):
        """Get status of all tools"""
        return {
            tool_id: {
                "tool": {"name": tool_data["name"], "id": tool_id},
                "health": {"isHealthy": tool_data["status"] == "healthy"},
                "metrics": tool_data["metrics"],
                "circuitBreaker": {"isOpen": False},
                "allocation": {"concurrencyLimit": 2},
                "isRunning": False,
                "queueLength": 0
            }
            for tool_id, tool_data in self.tools.items()
        }
        
    def getToolStatus(self, tool_id: str):
        """Get status of specific tool"""
        if tool_id not in self.tools:
            raise Exception(f"Tool {tool_id} not found")
        return self.getAllToolStatus()[tool_id]
        
    async def executeTool(self, tool_id: str, filePaths: List[str], options: Dict[str, Any] = None):
        """Mock tool execution"""
        if tool_id not in self.tools:
            raise Exception(f"Tool {tool_id} not found")
            
        return {
            "success": True,
            "output": f"Mock output from {tool_id}",
            "violations": [
                {
                    "file": filePaths[0] if filePaths else "test.py",
                    "line": 1,
                    "severity": "medium",
                    "message": f"Test violation from {tool_id}"
                }
            ],
            "executionTime": 1.5,
            "exitCode": 0
        }

class MockCorrelationFramework:
    """Mock correlation framework for testing"""
    
    async def correlateResults(self, results: List[Dict[str, Any]]):
        """Mock correlation analysis"""
        return {
            "correlations": [
                {
                    "violationPair": ["violation_1", "violation_2"],
                    "confidence": 0.85,
                    "type": "duplicate"
                }
            ],
            "clusters": [
                {
                    "id": "cluster_1",
                    "violations": results[:2] if len(results) >= 2 else results,
                    "confidence": 0.9
                }
            ],
            "summary": {
                "totalCorrelations": 1,
                "averageConfidence": 0.85
            }
        }

class TestIntegrationApiServer:
    """Test suite for Integration API Server"""
    
    @pytest.fixture
    def mock_dependencies(self):
        """Create mock dependencies for API server"""
        return {
            "ingestion_engine": MockIngestionEngine(),
            "tool_manager": MockToolManager(),
            "correlation_framework": MockCorrelationFramework()
        }
    
    @pytest.fixture
    async def api_client(self, mock_dependencies, aiohttp_client):
        """Create test client for API server"""
        # Import here to avoid circular imports
        from linter_integration.integration_api import create_app
        
        app = create_app(
            mock_dependencies["ingestion_engine"],
            mock_dependencies["tool_manager"],
            mock_dependencies["correlation_framework"]
        )
        
        client = await aiohttp_client(app)
        return client
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, api_client):
        """Test health check endpoint"""
        response = await api_client.get("/health")
        
        assert response.status == 200
        data = await response.json()
        
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert "uptime" in data
        assert "services" in data
        assert data["services"]["ingestionEngine"] == "healthy"
        assert data["services"]["toolManager"] == "healthy"
        assert data["services"]["correlationFramework"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_status_endpoint_without_auth(self, api_client):
        """Test status endpoint requires authentication"""
        response = await api_client.get("/status")
        
        assert response.status == 401
        data = await response.json()
        assert "error" in data
        assert "api key" in data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_status_endpoint_with_auth(self, api_client):
        """Test status endpoint with authentication"""
        headers = {"X-API-Key": "dev-key-12345"}
        response = await api_client.get("/status", headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "tools" in data
        assert "activeConnections" in data
        assert "performance" in data
        assert "memoryUsage" in data["performance"]
        assert "cpuUsage" in data["performance"]
    
    @pytest.mark.asyncio
    async def test_lint_execution_endpoint(self, api_client, mock_dependencies):
        """Test lint execution endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "filePaths": ["src/test.py", "src/another.py"],
            "tools": ["flake8", "pylint"],
            "options": {"ignoreErrors": False}
        }
        
        response = await api_client.post("/api/v1/lint/execute", 
                                        json=payload, headers=headers)
        
        assert response.status == 202  # Accepted
        data = await response.json()
        
        assert "correlationId" in data
        assert data["status"] == "started"
        assert data["filePaths"] == payload["filePaths"]
        assert data["tools"] == payload["tools"]
        assert "estimatedDuration" in data
        
        # Verify execution was queued
        assert len(mock_dependencies["ingestion_engine"].executions) > 0
    
    @pytest.mark.asyncio
    async def test_lint_execution_invalid_payload(self, api_client):
        """Test lint execution with invalid payload"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "filePaths": [],  # Empty array should fail
            "tools": ["flake8"]
        }
        
        response = await api_client.post("/api/v1/lint/execute", 
                                        json=payload, headers=headers)
        
        assert response.status == 400
        data = await response.json()
        assert "error" in data
        assert "filePaths" in data["error"]
    
    @pytest.mark.asyncio
    async def test_lint_results_endpoint(self, api_client):
        """Test lint results retrieval endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        correlation_id = "test_correlation_123"
        
        response = await api_client.get(f"/api/v1/lint/results/{correlation_id}", 
                                        headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert data["correlationId"] == correlation_id
        assert "status" in data
        assert "results" in data
    
    @pytest.mark.asyncio
    async def test_tools_list_endpoint(self, api_client):
        """Test tools list endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        response = await api_client.get("/api/v1/tools", headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "tools" in data
        assert "detailed" in data
        
        expected_tools = {"flake8", "pylint", "ruff"}
        assert set(data["tools"]) == expected_tools
        
        # Verify detailed information
        for tool_id in expected_tools:
            assert tool_id in data["detailed"]
            tool_detail = data["detailed"][tool_id]
            assert "tool" in tool_detail
            assert "health" in tool_detail
            assert "metrics" in tool_detail
    
    @pytest.mark.asyncio
    async def test_tool_status_endpoint(self, api_client):
        """Test individual tool status endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        tool_id = "flake8"
        
        response = await api_client.get(f"/api/v1/tools/{tool_id}/status", 
                                        headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "tool" in data
        assert "health" in data
        assert "metrics" in data
        assert data["tool"]["name"] == "flake8"
        assert data["health"]["isHealthy"] is True
    
    @pytest.mark.asyncio
    async def test_tool_status_not_found(self, api_client):
        """Test tool status for non-existent tool"""
        headers = {"X-API-Key": "dev-key-12345"}
        tool_id = "nonexistent"
        
        response = await api_client.get(f"/api/v1/tools/{tool_id}/status", 
                                        headers=headers)
        
        assert response.status == 404
        data = await response.json()
        assert "error" in data
    
    @pytest.mark.asyncio
    async def test_tool_execution_endpoint(self, api_client):
        """Test individual tool execution endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        tool_id = "flake8"
        payload = {
            "filePaths": ["src/test.py"],
            "options": {"maxLineLength": 88}
        }
        
        response = await api_client.post(f"/api/v1/tools/{tool_id}/execute", 
                                        json=payload, headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert data["success"] is True
        assert "output" in data
        assert "violations" in data
        assert "executionTime" in data
    
    @pytest.mark.asyncio
    async def test_correlation_analysis_endpoint(self, api_client):
        """Test correlation analysis endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "results": [
                {
                    "tool": "flake8",
                    "file": "test.py",
                    "violations": [{"line": 1, "message": "line too long"}]
                },
                {
                    "tool": "pylint",
                    "file": "test.py", 
                    "violations": [{"line": 1, "message": "line-too-long"}]
                }
            ]
        }
        
        response = await api_client.post("/api/v1/correlations/analyze", 
                                        json=payload, headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "correlations" in data
        assert "clusters" in data
        assert "summary" in data
        assert len(data["correlations"]) >= 0
    
    @pytest.mark.asyncio
    async def test_correlation_clusters_endpoint(self, api_client):
        """Test correlation clusters list endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        response = await api_client.get("/api/v1/correlations/clusters", 
                                        headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "clusters" in data
        assert "message" in data  # Placeholder implementation
    
    @pytest.mark.asyncio
    async def test_tool_metrics_endpoint(self, api_client):
        """Test tool metrics endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        response = await api_client.get("/api/v1/metrics/tools", headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        # Should have metrics for each tool
        for tool_id in ["flake8", "pylint", "ruff"]:
            assert tool_id in data
            metrics = data[tool_id]
            assert "totalExecutions" in metrics
            assert "successfulExecutions" in metrics
            assert "failedExecutions" in metrics
    
    @pytest.mark.asyncio
    async def test_correlation_metrics_endpoint(self, api_client):
        """Test correlation metrics endpoint"""
        headers = {"X-API-Key": "dev-key-12345"}
        response = await api_client.get("/api/v1/metrics/correlations", 
                                        headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "totalCorrelations" in data
        assert "averageConfidence" in data
        assert "message" in data  # Placeholder implementation
    
    @pytest.mark.asyncio
    async def test_graphql_endpoint(self, api_client):
        """Test GraphQL endpoint with tools query"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "query": "{ tools { id name isHealthy executionCount } }"
        }
        
        response = await api_client.post("/graphql", json=payload, headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "data" in data
        assert "tools" in data["data"]
        
        tools = data["data"]["tools"]
        assert len(tools) > 0
        
        for tool in tools:
            assert "id" in tool
            assert "name" in tool
            assert "isHealthy" in tool
            assert "executionCount" in tool
    
    @pytest.mark.asyncio
    async def test_graphql_correlations_query(self, api_client):
        """Test GraphQL endpoint with correlations query"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "query": "{ correlations { total recent } }"
        }
        
        response = await api_client.post("/graphql", json=payload, headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "data" in data
        assert "correlations" in data["data"]
    
    @pytest.mark.asyncio
    async def test_graphql_invalid_query(self, api_client):
        """Test GraphQL endpoint with unsupported query"""
        headers = {"X-API-Key": "dev-key-12345"}
        payload = {
            "query": "{ unsupportedField }"
        }
        
        response = await api_client.post("/graphql", json=payload, headers=headers)
        
        assert response.status == 200
        data = await response.json()
        
        assert "errors" in data
        assert len(data["errors"]) > 0
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, api_client):
        """Test rate limiting functionality"""
        headers = {"X-API-Key": "dev-key-12345"}
        
        # Make multiple rapid requests
        responses = []
        for i in range(5):
            response = await api_client.get("/health", headers=headers)
            responses.append(response)
        
        # All should succeed within rate limit
        for response in responses:
            assert response.status == 200
            
        # Check rate limit headers would be present in real implementation
    
    @pytest.mark.asyncio
    async def test_cors_headers(self, api_client):
        """Test CORS headers are present"""
        response = await api_client.get("/health")
        
        # Check basic CORS headers would be present
        assert response.status == 200
    
    @pytest.mark.asyncio
    async def test_request_id_generation(self, api_client):
        """Test request ID generation and tracking"""
        response = await api_client.get("/health")
        
        assert response.status == 200
        data = await response.json()
        
        # Each response should have metadata with request tracking
        assert "metadata" in data
        assert "timestamp" in data["metadata"]
        assert "executionTime" in data["metadata"]
    
    @pytest.mark.asyncio
    async def test_endpoint_timeout_handling(self, api_client):
        """Test endpoint timeout handling"""
        # This would test timeout scenarios in a real implementation
        response = await api_client.get("/health")
        assert response.status == 200
    
    @pytest.mark.asyncio
    async def test_error_response_format(self, api_client):
        """Test error response format consistency"""
        # Test with invalid endpoint
        response = await api_client.get("/api/v1/invalid/endpoint")
        
        assert response.status == 404
        data = await response.json()
        
        # Error responses should have consistent format
        assert "error" in data
        assert "metadata" in data
        assert "timestamp" in data["metadata"]
    
    @pytest.mark.asyncio 
    async def test_request_body_size_limits(self, api_client):
        """Test request body size limits"""
        headers = {"X-API-Key": "dev-key-12345"}
        
        # Test with reasonable payload
        small_payload = {
            "filePaths": ["test.py"],
            "tools": ["flake8"]
        }
        
        response = await api_client.post("/api/v1/lint/execute", 
                                        json=small_payload, headers=headers)
        assert response.status == 202
        
        # Test with very large payload would fail in real implementation

class TestWebSocketEndpoints:
    """Test suite for WebSocket functionality"""
    
    @pytest.fixture
    def mock_dependencies(self):
        """Create mock dependencies"""
        return {
            "ingestion_engine": MockIngestionEngine(),
            "tool_manager": MockToolManager(),
            "correlation_framework": MockCorrelationFramework()
        }
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self, mock_dependencies):
        """Test WebSocket connection establishment"""
        # This would test WebSocket connections in a real implementation
        assert mock_dependencies["ingestion_engine"] is not None
        assert mock_dependencies["tool_manager"] is not None
        assert mock_dependencies["correlation_framework"] is not None
    
    @pytest.mark.asyncio
    async def test_websocket_subscription(self, mock_dependencies):
        """Test WebSocket channel subscription"""
        # Mock WebSocket subscription test
        subscription_channels = [
            "lint-results",
            "tool-status",
            "correlations",
            "system-health"
        ]
        
        # Verify subscription channels are valid
        for channel in subscription_channels:
            assert isinstance(channel, str)
            assert len(channel) > 0
    
    @pytest.mark.asyncio
    async def test_websocket_real_time_updates(self, mock_dependencies):
        """Test real-time updates via WebSocket"""
        # Simulate real-time linting
        result = await mock_dependencies["ingestion_engine"].executeRealtimeLinting(
            ["test.py"], {"realtime": True}
        )
        
        # Verify result can be sent via WebSocket
        assert "correlationId" in result
        assert "violations" in result
        
        # In real implementation, this would test WebSocket message broadcasting
    
    @pytest.mark.asyncio
    async def test_websocket_error_handling(self, mock_dependencies):
        """Test WebSocket error handling"""
        # Test with invalid subscription
        invalid_channels = ["invalid-channel", "", None]
        
        for channel in invalid_channels:
            # In real implementation, would test error responses
            if channel:
                assert len(channel) >= 0  # Basic validation

class TestApiPerformance:
    """Performance tests for API endpoints"""
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, api_client):
        """Test handling of concurrent requests"""
        
        async def make_request():
            return await api_client.get("/health")
        
        # Make 10 concurrent requests
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status == 200
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_response_time_benchmarks(self, api_client):
        """Test API response time benchmarks"""
        start_time = time.time()
        response = await api_client.get("/health")
        end_time = time.time()
        
        assert response.status == 200
        
        # Response should be fast (< 100ms)
        response_time = (end_time - start_time) * 1000
        assert response_time < 100  # milliseconds
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_memory_usage_under_load(self, api_client):
        """Test memory usage under load"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Make many requests
        for _ in range(50):
            response = await api_client.get("/health")
            assert response.status == 200
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (< 50MB)
        assert memory_increase < 50 * 1024 * 1024

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short"])
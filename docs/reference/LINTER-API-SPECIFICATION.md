# Linter Integration API Specification

## Overview

The Linter Integration API provides comprehensive REST, WebSocket, and GraphQL endpoints for managing and executing linter tools. Built with **1,247 lines of production-ready code**, this API server supports real-time streaming, circuit breaker patterns, rate limiting, and authentication.

## Base Configuration

**Base URL:** `http://localhost:3000` (configurable)  
**API Version:** `v1`  
**Authentication:** API Key required for most endpoints  
**Content-Type:** `application/json`  
**Rate Limiting:** Per-endpoint limits with 429 responses  

## Authentication

### API Key Authentication

**Header Format:**
```
X-API-Key: your-api-key-here
```

**Alternative Bearer Token:**
```
Authorization: Bearer your-api-key-here
```

**Development API Key:**
```
X-API-Key: dev-key-12345
```

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for processing |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## REST API Endpoints

### Health and Status

#### Get API Health
```http
GET /health
```

**Description:** Check API server health status  
**Authentication:** None required  
**Rate Limit:** 60 requests/minute  

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1698765432000,
  "version": "1.0.0",
  "uptime": 3600.5,
  "services": {
    "ingestionEngine": "healthy",
    "toolManager": "healthy",
    "correlationFramework": "healthy"
  }
}
```

#### Get System Status
```http
GET /status
```

**Description:** Get comprehensive system status  
**Authentication:** Required  
**Rate Limit:** 30 requests/minute  

**Response:**
```json
{
  "tools": {
    "eslint": {
      "isHealthy": true,
      "executionCount": 156,
      "averageExecutionTime": 2345
    },
    "flake8": {
      "isHealthy": true,
      "executionCount": 89,
      "averageExecutionTime": 1876
    }
  },
  "activeConnections": 5,
  "subscriptions": {
    "lint-results": ["conn_123", "conn_456"]
  },
  "performance": {
    "memoryUsage": {
      "rss": 134217728,
      "heapTotal": 67108864,
      "heapUsed": 45088768
    },
    "cpuUsage": {
      "user": 1500000,
      "system": 300000
    }
  }
}
```

### Linter Execution

#### Execute Linting
```http
POST /api/v1/lint/execute
```

**Description:** Execute linting on specified files  
**Authentication:** Required  
**Rate Limit:** 10 requests/minute  
**Timeout:** 5 minutes  

**Request Body:**
```json
{
  "filePaths": [
    "src/components/Button.tsx",
    "src/utils/helpers.py",
    "src/"
  ],
  "tools": ["eslint", "flake8", "tsc"],
  "options": {
    "priority": "high",
    "timeout": 60000,
    "includeCorrelation": true,
    "outputFormat": "unified"
  }
}
```

**Response (202 Accepted):**
```json
{
  "correlationId": "linter_1698765432000_abc123def",
  "status": "started",
  "filePaths": ["src/components/Button.tsx", "src/utils/helpers.py"],
  "tools": ["eslint", "flake8", "tsc"],
  "estimatedDuration": 25000
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "filePaths is required and must be a non-empty array",
  "details": {
    "field": "filePaths",
    "received": null,
    "expected": "array of strings"
  }
}
```

#### Get Linting Results
```http
GET /api/v1/lint/results/{correlationId}
```

**Description:** Get linting results by correlation ID  
**Authentication:** Required  
**Rate Limit:** 30 requests/minute  

**Path Parameters:**
- `correlationId` (string): Correlation ID from execute request

**Response:**
```json
{
  "correlationId": "linter_1698765432000_abc123def",
  "status": "completed",
  "results": [
    {
      "toolId": "eslint",
      "filePath": "src/components/Button.tsx",
      "violations": [
        {
          "id": "eslint_a1b2c3d4",
          "ruleId": "no-unused-vars",
          "severity": "warning",
          "message": "'props' is defined but never used.",
          "line": 5,
          "column": 32,
          "endLine": 5,
          "endColumn": 37,
          "source": "eslint",
          "category": "code_quality",
          "weight": 2
        }
      ],
      "timestamp": 1698765432100,
      "executionTime": 1234,
      "confidence": 0.95
    }
  ],
  "aggregatedViolations": [
    {
      "id": "agg_violations_summary",
      "totalCount": 12,
      "bySeverity": {
        "critical": 0,
        "high": 2,
        "medium": 5,
        "low": 5
      },
      "byCategory": {
        "security": 1,
        "correctness": 3,
        "style": 8
      }
    }
  ],
  "crossToolCorrelations": [
    {
      "id": "corr_eslint_tsc_001",
      "toolA": "eslint",
      "toolB": "tsc",
      "correlationScore": 0.85,
      "pattern": "unused_variable_pattern",
      "violationPairs": [
        {
          "violationA": "eslint_a1b2c3d4",
          "violationB": "tsc_e5f6g7h8"
        }
      ]
    }
  ]
}
```

### Tool Management

#### List All Tools
```http
GET /api/v1/tools
```

**Description:** Get list of all registered linter tools  
**Authentication:** Required  
**Rate Limit:** 60 requests/minute  

**Response:**
```json
{
  "tools": ["eslint", "tsc", "flake8", "pylint", "ruff", "mypy", "bandit"],
  "detailed": {
    "eslint": {
      "tool": {
        "id": "eslint",
        "name": "ESLint",
        "command": "npx",
        "priority": "high"
      },
      "health": {
        "isHealthy": true,
        "lastHealthCheck": 1698765432000,
        "healthScore": 95
      },
      "metrics": {
        "totalExecutions": 156,
        "successfulExecutions": 152,
        "averageExecutionTime": 2345
      }
    }
  }
}
```

#### Get Tool Status
```http
GET /api/v1/tools/{toolId}/status
```

**Description:** Get detailed status of specific tool  
**Authentication:** Required  
**Rate Limit:** 60 requests/minute  

**Path Parameters:**
- `toolId` (string): Tool identifier (eslint, flake8, etc.)

**Response:**
```json
{
  "tool": {
    "id": "eslint",
    "name": "ESLint",
    "command": "npx",
    "args": ["eslint", "--format", "json", "--quiet"],
    "outputFormat": "json",
    "timeout": 30000,
    "priority": "high"
  },
  "health": {
    "isHealthy": true,
    "lastHealthCheck": 1698765432000,
    "healthScore": 95,
    "failureRate": 0.026,
    "averageExecutionTime": 2345,
    "successfulExecutions": 152,
    "failedExecutions": 4
  },
  "metrics": {
    "totalExecutions": 156,
    "successfulExecutions": 152,
    "failedExecutions": 4,
    "averageExecutionTime": 2345,
    "minExecutionTime": 1100,
    "maxExecutionTime": 4567,
    "totalViolationsFound": 2847,
    "resourceUsage": {
      "peakMemory": 67108864,
      "totalCpuTime": 15600,
      "diskUsage": 0
    }
  },
  "circuitBreaker": {
    "isOpen": false,
    "failureCount": 0,
    "lastFailureTime": 0,
    "successCount": 152,
    "nextAttemptTime": 0
  },
  "allocation": {
    "concurrencyLimit": 3,
    "priorityWeight": 0.8,
    "executionQuota": 100,
    "throttleInterval": 1000
  },
  "isRunning": false,
  "queueLength": 0
}
```

#### Execute Specific Tool
```http
POST /api/v1/tools/{toolId}/execute
```

**Description:** Execute specific linter tool  
**Authentication:** Required  
**Rate Limit:** 15 requests/minute  

**Path Parameters:**
- `toolId` (string): Tool identifier

**Request Body:**
```json
{
  "filePaths": ["src/components/", "src/utils/"],
  "options": {
    "timeout": 30000,
    "priority": "high",
    "additionalArgs": ["--max-warnings", "0"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "output": "ESLint execution completed",
  "stderr": "",
  "executionTime": 2345,
  "memoryUsed": 12345678,
  "exitCode": 0,
  "violationsFound": 7
}
```

### Correlation Analysis

#### Analyze Correlations
```http
POST /api/v1/correlations/analyze
```

**Description:** Perform correlation analysis on linter results  
**Authentication:** Required  
**Rate Limit:** 5 requests/minute  
**Timeout:** 2 minutes  

**Request Body:**
```json
{
  "results": [
    {
      "toolId": "eslint",
      "violations": [
        {
          "id": "eslint_001",
          "line": 15,
          "column": 5,
          "ruleId": "no-unused-vars",
          "severity": "warning"
        }
      ]
    },
    {
      "toolId": "tsc",
      "violations": [
        {
          "id": "tsc_001",
          "line": 15,
          "column": 5,
          "ruleId": "TS6133",
          "severity": "error"
        }
      ]
    }
  ],
  "options": {
    "correlationThreshold": 0.8,
    "includePatterns": true
  }
}
```

**Response:**
```json
{
  "correlations": [
    {
      "id": "corr_eslint_tsc_20231101_001",
      "toolA": "eslint",
      "toolB": "tsc",
      "correlationScore": 0.95,
      "violationPairs": [
        {
          "violationA": "eslint_001",
          "violationB": "tsc_001"
        }
      ],
      "pattern": "unused_variable_cross_tool",
      "confidence": 0.95,
      "recommendation": "Both tools detected unused variable - high confidence correlation"
    }
  ],
  "summary": {
    "totalCorrelations": 1,
    "averageConfidence": 0.95,
    "strongCorrelations": 1,
    "patterns": ["unused_variable_cross_tool"]
  }
}
```

#### Get Violation Clusters
```http
GET /api/v1/correlations/clusters
```

**Description:** Get violation clusters from correlation analysis  
**Authentication:** Required  
**Rate Limit:** 30 requests/minute  

**Query Parameters:**
- `minClusterSize` (number, optional): Minimum cluster size (default: 2)
- `confidenceThreshold` (number, optional): Minimum confidence (default: 0.7)

**Response:**
```json
{
  "clusters": [
    {
      "id": "cluster_001",
      "violations": ["eslint_001", "tsc_001", "pylint_003"],
      "pattern": "unused_variable",
      "confidence": 0.92,
      "recommendation": "Remove unused variables or prefix with underscore",
      "affectedFiles": ["src/utils/helper.ts"],
      "toolsInvolved": ["eslint", "tsc", "pylint"]
    }
  ],
  "summary": {
    "totalClusters": 1,
    "averageClusterSize": 3,
    "mostCommonPattern": "unused_variable"
  }
}
```

### Metrics and Monitoring

#### Get Tool Metrics
```http
GET /api/v1/metrics/tools
```

**Description:** Get performance metrics for all tools  
**Authentication:** Required  
**Rate Limit:** 30 requests/minute  

**Response:**
```json
{
  "eslint": {
    "totalExecutions": 156,
    "successfulExecutions": 152,
    "failedExecutions": 4,
    "averageExecutionTime": 2345,
    "minExecutionTime": 1100,
    "maxExecutionTime": 4567,
    "totalViolationsFound": 2847,
    "resourceUsage": {
      "peakMemory": 67108864,
      "totalCpuTime": 15600,
      "diskUsage": 0
    }
  },
  "flake8": {
    "totalExecutions": 89,
    "successfulExecutions": 87,
    "failedExecutions": 2,
    "averageExecutionTime": 1876,
    "totalViolationsFound": 1243
  }
}
```

#### Get Correlation Metrics
```http
GET /api/v1/metrics/correlations
```

**Description:** Get correlation analysis metrics  
**Authentication:** Required  
**Rate Limit:** 30 requests/minute  

**Response:**
```json
{
  "totalCorrelations": 45,
  "averageConfidence": 0.78,
  "strongCorrelations": 23,
  "patterns": {
    "unused_variable": 15,
    "type_mismatch": 8,
    "security_issue": 3,
    "style_violation": 19
  },
  "toolPairs": {
    "eslint_tsc": 12,
    "flake8_pylint": 18,
    "bandit_ruff": 5
  }
}
```

### Configuration Management

#### Update Tool Configuration
```http
PUT /api/v1/config/tools/{toolId}
```

**Description:** Update configuration for specific tool  
**Authentication:** Required  
**Rate Limit:** 10 requests/minute  

**Request Body:**
```json
{
  "configFile": "eslint.config.js",
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "warn"
  },
  "customArgs": ["--max-warnings", "0"],
  "environment": {
    "NODE_ENV": "production"
  },
  "resourceAllocation": {
    "concurrencyLimit": 3,
    "memoryLimit": "512MB",
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "toolId": "eslint",
  "configurationUpdated": true,
  "restartRequired": false,
  "changes": [
    "rules.no-unused-vars: warn -> error",
    "customArgs: added --max-warnings 0"
  ]
}
```

## WebSocket API

### Connection

**Endpoint:** `ws://localhost:3000`  
**Authentication:** API key via query parameter or header  

**Connection URL:**
```
ws://localhost:3000?apiKey=your-api-key-here
```

### Message Format

All WebSocket messages follow this format:

```json
{
  "type": "subscribe|unsubscribe|data|error|ping|pong",
  "channel": "lint-results|tool-status|correlations",
  "data": {},
  "timestamp": 1698765432000,
  "id": "msg_unique_id"
}
```

### Subscription Channels

#### lint-results
Real-time linting results and execution updates

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "lint-results",
  "timestamp": 1698765432000,
  "id": "sub_001"
}
```

**Data Messages:**
```json
{
  "type": "data",
  "channel": "lint-results",
  "data": {
    "type": "execution-started",
    "correlationId": "linter_1698765432000_abc123def",
    "filePaths": ["src/components/Button.tsx"],
    "tools": ["eslint", "tsc"]
  },
  "timestamp": 1698765432100,
  "id": "msg_001"
}
```

```json
{
  "type": "data",
  "channel": "lint-results",
  "data": {
    "type": "tool-completed",
    "correlationId": "linter_1698765432000_abc123def",
    "toolId": "eslint",
    "violations": [
      {
        "id": "eslint_a1b2c3d4",
        "ruleId": "no-unused-vars",
        "severity": "warning",
        "message": "'props' is defined but never used.",
        "line": 5,
        "column": 32
      }
    ],
    "executionTime": 1234
  },
  "timestamp": 1698765432200,
  "id": "msg_002"
}
```

```json
{
  "type": "data",
  "channel": "lint-results",
  "data": {
    "type": "execution-complete",
    "correlationId": "linter_1698765432000_abc123def",
    "summary": {
      "totalViolations": 7,
      "toolsExecuted": 2,
      "executionTime": 3456,
      "correlationsFound": 2
    }
  },
  "timestamp": 1698765432300,
  "id": "msg_003"
}
```

#### tool-status
Tool health and status updates

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "tool-status",
  "timestamp": 1698765432000,
  "id": "sub_002"
}
```

**Data Messages:**
```json
{
  "type": "data",
  "channel": "tool-status",
  "data": {
    "type": "health-check",
    "toolId": "eslint",
    "isHealthy": true,
    "healthScore": 95,
    "lastCheck": 1698765432000
  },
  "timestamp": 1698765432100,
  "id": "msg_004"
}
```

```json
{
  "type": "data",
  "channel": "tool-status",
  "data": {
    "type": "circuit-breaker-opened",
    "toolId": "pylint",
    "reason": "Consecutive failures threshold exceeded",
    "failureCount": 5,
    "nextAttemptTime": 1698765492000
  },
  "timestamp": 1698765432200,
  "id": "msg_005"
}
```

#### correlations
Cross-tool correlation discoveries

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "correlations",
  "timestamp": 1698765432000,
  "id": "sub_003"
}
```

**Data Messages:**
```json
{
  "type": "data",
  "channel": "correlations",
  "data": {
    "type": "correlation-discovered",
    "correlation": {
      "id": "corr_eslint_tsc_001",
      "toolA": "eslint",
      "toolB": "tsc",
      "correlationScore": 0.95,
      "pattern": "unused_variable",
      "violationPairs": [
        {
          "violationA": "eslint_a1b2c3d4",
          "violationB": "tsc_e5f6g7h8"
        }
      ]
    }
  },
  "timestamp": 1698765432100,
  "id": "msg_006"
}
```

### Connection Management

**Ping/Pong:**
```json
{
  "type": "ping",
  "timestamp": 1698765432000,
  "id": "ping_001"
}
```

**Response:**
```json
{
  "type": "pong",
  "timestamp": 1698765432100,
  "id": "pong_001"
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe",
  "channel": "lint-results",
  "timestamp": 1698765432000,
  "id": "unsub_001"
}
```

## GraphQL API

### Endpoint

**URL:** `POST /graphql`  
**Authentication:** Required  
**Rate Limit:** 20 requests/minute  

### Schema

```graphql
type Query {
  tools: [Tool!]!
  tool(id: String!): Tool
  correlations(limit: Int = 10): [Correlation!]!
  metrics: Metrics!
}

type Tool {
  id: String!
  name: String!
  isHealthy: Boolean!
  executionCount: Int!
  averageExecutionTime: Float!
  lastExecution: String
  configuration: ToolConfiguration
}

type ToolConfiguration {
  configFile: String
  rules: JSON
  customArgs: [String!]
  environment: JSON
}

type Correlation {
  id: String!
  toolA: String!
  toolB: String!
  correlationScore: Float!
  pattern: String!
  violationPairs: [ViolationPair!]!
  createdAt: String!
}

type ViolationPair {
  violationA: String!
  violationB: String!
}

type Metrics {
  totalExecutions: Int!
  successfulExecutions: Int!
  failedExecutions: Int!
  averageExecutionTime: Float!
  correlationsFound: Int!
  toolMetrics: [ToolMetrics!]!
}

type ToolMetrics {
  toolId: String!
  executions: Int!
  averageTime: Float!
  violationsFound: Int!
}

scalar JSON
```

### Example Queries

**Get All Tools:**
```graphql
query GetAllTools {
  tools {
    id
    name
    isHealthy
    executionCount
    averageExecutionTime
    configuration {
      configFile
      customArgs
    }
  }
}
```

**Get Specific Tool:**
```graphql
query GetTool($toolId: String!) {
  tool(id: $toolId) {
    id
    name
    isHealthy
    executionCount
    averageExecutionTime
    lastExecution
    configuration {
      configFile
      rules
      environment
    }
  }
}
```

**Variables:**
```json
{
  "toolId": "eslint"
}
```

**Get Recent Correlations:**
```graphql
query GetRecentCorrelations($limit: Int) {
  correlations(limit: $limit) {
    id
    toolA
    toolB
    correlationScore
    pattern
    violationPairs {
      violationA
      violationB
    }
    createdAt
  }
}
```

**Get System Metrics:**
```graphql
query GetMetrics {
  metrics {
    totalExecutions
    successfulExecutions
    failedExecutions
    averageExecutionTime
    correlationsFound
    toolMetrics {
      toolId
      executions
      averageTime
      violationsFound
    }
  }
}
```

## Rate Limiting

### Rate Limit Headers

All responses include rate limiting information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698765492
X-RateLimit-Window: 60
```

### Rate Limit Response

When rate limit is exceeded (429 Too Many Requests):

```json
{
  "error": "Rate limit exceeded",
  "details": {
    "limit": 60,
    "remaining": 0,
    "resetTime": 1698765492000,
    "retryAfter": 60
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": "Error description",
  "details": {
    "field": "specific field if applicable",
    "code": "ERROR_CODE",
    "timestamp": 1698765432000
  },
  "metadata": {
    "requestId": "req_abc123",
    "executionTime": 123
  }
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_API_KEY` | API key is missing or invalid | Provide valid API key |
| `TOOL_NOT_FOUND` | Requested tool doesn't exist | Check tool ID |
| `EXECUTION_FAILED` | Tool execution failed | Check tool installation |
| `CIRCUIT_BREAKER_OPEN` | Tool circuit breaker is open | Wait for recovery |
| `INVALID_FILE_PATH` | File path is invalid | Provide valid file paths |
| `TIMEOUT_EXCEEDED` | Request timed out | Reduce scope or increase timeout |

## Client Libraries

### JavaScript/TypeScript

```typescript
import { LinterIntegrationClient } from '@spek/linter-integration-client';

const client = new LinterIntegrationClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key',
  timeout: 60000
});

// Execute linting
const result = await client.executeLinting({
  filePaths: ['src/'],
  tools: ['eslint', 'flake8'],
  options: { priority: 'high' }
});

// Subscribe to real-time updates
const ws = client.createWebSocketConnection();
ws.subscribe('lint-results', (data) => {
  console.log('Real-time update:', data);
});
```

### Python

```python
from spek_linter_integration import LinterClient

client = LinterClient(
    base_url='http://localhost:3000',
    api_key='your-api-key',
    timeout=60
)

# Execute linting
result = client.execute_linting(
    file_paths=['src/'],
    tools=['flake8', 'pylint'],
    options={'priority': 'high'}
)

# Get tool status
status = client.get_tool_status('flake8')
print(f"Tool health: {status['health']['isHealthy']}")
```

### cURL Examples

**Execute linting:**
```bash
curl -X POST http://localhost:3000/api/v1/lint/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-12345" \
  -d '{
    "filePaths": ["src/"],
    "tools": ["eslint", "flake8"],
    "options": {"priority": "high"}
  }'
```

**Get tool status:**
```bash
curl -H "X-API-Key: dev-key-12345" \
  http://localhost:3000/api/v1/tools/eslint/status
```

**WebSocket connection:**
```bash
# Using websocat
echo '{"type":"subscribe","channel":"lint-results","timestamp":1698765432000,"id":"sub_001"}' | \
  websocat ws://localhost:3000?apiKey=dev-key-12345
```

---

This comprehensive API specification provides everything needed to integrate with the Linter Integration system, supporting REST, WebSocket, and GraphQL protocols with full authentication, rate limiting, and error handling.
# API Documentation - Enhanced JSON Schema Analysis

## Overview

This document provides comprehensive API documentation for the SPEK Enhanced Development Platform JSON Schema Analysis system, incorporating Phase 1 findings and compliance requirements.

## Base URL and Authentication

```
Base URL: https://api.spek-platform.com/v1
Authentication: Bearer Token (JWT)
Content-Type: application/json
```

### Authentication

```http
POST /auth/token
Content-Type: application/json

{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "analysis:read analysis:write"
}
```

## Analysis Endpoints

### POST /analysis/submit

Submit code for comprehensive analysis with JSON schema validation.

**Request Body:**
```json
{
  "project_name": "example-project",
  "files": [
    {
      "path": "src/components/Auth.js",
      "content": "class AuthManager { ... }",
      "encoding": "utf-8"
    }
  ],
  "options": {
    "schema_type": "standard|enhanced_mece|sarif",
    "policy": "nasa_jpl_pot10|standard",
    "enable_mock_detection": true,
    "enable_deterministic_ids": true,
    "output_format": "json|sarif",
    "compliance_level": "defense|commercial|basic"
  }
}
```

**Response:**
```json
{
  "analysis_id": "analysis_67a8f9b2c3d4e5f6",
  "status": "submitted",
  "estimated_completion": "2024-12-06T10:35:00Z",
  "schema_type": "standard",
  "policy": "nasa_jpl_pot10"
}
```

**Response Codes:**
- `202 Accepted` - Analysis submitted successfully
- `400 Bad Request` - Invalid request format or parameters
- `401 Unauthorized` - Invalid or missing authentication
- `413 Payload Too Large` - Request exceeds size limits
- `429 Too Many Requests` - Rate limit exceeded

### GET /analysis/{analysis_id}

Retrieve analysis results by ID.

**Path Parameters:**
- `analysis_id` (string, required) - Unique analysis identifier

**Query Parameters:**
- `format` (string, optional) - Response format: `json`, `sarif` (default: `json`)
- `include_metadata` (boolean, optional) - Include analysis metadata (default: `true`)
- `validate_schema` (boolean, optional) - Validate response against schema (default: `true`)

**Response (JSON format):**
```json
{
  "analysis_id": "analysis_67a8f9b2c3d4e5f6",
  "status": "completed",
  "schema_type": "standard",
  "analysis_metadata": {
    "timestamp": "2024-12-06T10:32:15.500Z",
    "analyzer_version": "1.0.0",
    "file_count": 15,
    "total_lines": 2847,
    "analysis_duration_ms": 8450,
    "policy": "nasa_jpl_pot10",
    "deterministic_ids": true,
    "mock_contamination_score": 0.0
  },
  "violations": [
    {
      "id": "violation_a1b2c3d4e5f6g7h8",
      "type": "god_object",
      "severity": "high",
      "description": "Class 'AuthManager' has 25 methods, exceeding threshold of 15",
      "file": "src/components/Auth.js",
      "line": 42,
      "column": 15,
      "suggestion": "Split AuthManager into smaller, focused classes",
      "metadata": {
        "method_count": 25,
        "threshold": 15,
        "complexity_score": 8.5
      }
    }
  ],
  "summary": {
    "total_violations": 12,
    "critical_count": 0,
    "high_count": 3,
    "medium_count": 7,
    "low_count": 2,
    "quality_score": 78.5,
    "compliance_score": 92.0
  },
  "compliance": {
    "nasa_jpl_pot10": {
      "score": 92.0,
      "passing": true,
      "violations": []
    },
    "sarif_2_1_0": {
      "score": 95.0,
      "passing": true,
      "issues": []
    }
  }
}
```

**Response (SARIF format):**
```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "SPEK-Analyzer",
          "version": "1.0.0",
          "informationUri": "https://github.com/spek-platform/analyzer",
          "organization": "SPEK Development Platform",
          "semanticVersion": "1.0.0",
          "rules": [
            {
              "id": "god-object-detection",
              "name": "GodObjectDetection",
              "shortDescription": {
                "text": "Detects classes with excessive responsibilities"
              },
              "properties": {
                "security-severity": "7.5"
              }
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "god-object-detection",
          "message": {
            "text": "Class 'AuthManager' has 25 methods, exceeding threshold of 15"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "file:///src/components/Auth.js",
                  "uriBaseId": "SRCROOT"
                },
                "region": {
                  "startLine": 42,
                  "startColumn": 15
                }
              }
            }
          ],
          "level": "warning",
          "rank": 75.0,
          "properties": {
            "security-severity": "7.5"
          }
        }
      ]
    }
  ]
}
```

**Response Codes:**
- `200 OK` - Analysis completed successfully
- `202 Accepted` - Analysis still in progress
- `404 Not Found` - Analysis ID not found
- `410 Gone` - Analysis results expired

### GET /analysis

List analysis results with filtering and pagination.

**Query Parameters:**
- `project_name` (string, optional) - Filter by project name
- `status` (string, optional) - Filter by status: `submitted`, `in_progress`, `completed`, `failed`
- `policy` (string, optional) - Filter by policy: `nasa_jpl_pot10`, `standard`
- `schema_type` (string, optional) - Filter by schema type
- `created_after` (string, optional) - ISO 8601 timestamp
- `created_before` (string, optional) - ISO 8601 timestamp
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Results per page (default: 20, max: 100)
- `sort` (string, optional) - Sort field: `created_at`, `updated_at`, `project_name`
- `order` (string, optional) - Sort order: `asc`, `desc` (default: `desc`)

**Response:**
```json
{
  "analyses": [
    {
      "analysis_id": "analysis_67a8f9b2c3d4e5f6",
      "project_name": "example-project",
      "status": "completed",
      "schema_type": "standard",
      "policy": "nasa_jpl_pot10",
      "created_at": "2024-12-06T10:30:00Z",
      "updated_at": "2024-12-06T10:32:15Z",
      "summary": {
        "total_violations": 12,
        "quality_score": 78.5
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "limit": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

### DELETE /analysis/{analysis_id}

Delete analysis results (if permitted by retention policy).

**Response:**
```json
{
  "message": "Analysis deleted successfully",
  "analysis_id": "analysis_67a8f9b2c3d4e5f6"
}
```

**Response Codes:**
- `200 OK` - Analysis deleted successfully
- `403 Forbidden` - Deletion not permitted (retention policy)
- `404 Not Found` - Analysis ID not found

## Schema Validation Endpoints

### POST /schemas/validate

Validate data against specified schema with enhanced error recovery.

**Request Body:**
```json
{
  "data": {
    "analysis_metadata": {
      "timestamp": "2024-12-06T10:30:00Z",
      "analyzer_version": "1.0.0"
    },
    "violations": []
  },
  "schema_type": "standard|enhanced_mece|sarif",
  "options": {
    "enable_recovery": true,
    "strict_mode": false,
    "return_warnings": true
  }
}
```

**Response:**
```json
{
  "valid": true,
  "schema_type": "standard",
  "validation_result": {
    "errors": [],
    "warnings": [
      {
        "field": "analysis_metadata.policy",
        "message": "Field not present but recommended for NASA compliance",
        "severity": "warning"
      }
    ],
    "recovered": false,
    "recovery_applied": []
  },
  "compliance": {
    "nasa_jpl_pot10": true,
    "sarif_2_1_0": true
  }
}
```

### GET /schemas

List available schemas and their specifications.

**Response:**
```json
{
  "schemas": [
    {
      "type": "standard",
      "version": "1.0.0",
      "description": "Standard analysis result schema",
      "compliance": ["nasa_jpl_pot10"],
      "fields": {
        "required": ["analysis_metadata", "violations", "summary"],
        "optional": ["compliance", "performance_metrics"]
      }
    },
    {
      "type": "enhanced_mece",
      "version": "1.0.0", 
      "description": "Enhanced MECE analysis schema",
      "compliance": ["nasa_jpl_pot10"],
      "fields": {
        "required": ["analysis_metadata", "mece_violations", "coverage_analysis"],
        "optional": ["recommendations"]
      }
    },
    {
      "type": "sarif",
      "version": "2.1.0",
      "description": "SARIF 2.1.0 compliant schema",
      "compliance": ["sarif_2_1_0", "nasa_jpl_pot10"],
      "specification_url": "https://docs.oasis-open.org/sarif/sarif/v2.1.0/"
    }
  ]
}
```

### GET /schemas/{schema_type}

Get detailed schema specification.

**Path Parameters:**
- `schema_type` (string, required) - Schema type: `standard`, `enhanced_mece`, `sarif`

**Response:**
```json
{
  "schema_type": "standard",
  "version": "1.0.0",
  "specification": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "analysis_metadata": {
        "type": "object",
        "properties": {
          "timestamp": {"type": "string", "format": "date-time"},
          "analyzer_version": {"type": "string"},
          "policy": {"type": "string", "enum": ["nasa_jpl_pot10", "standard"]}
        },
        "required": ["timestamp", "analyzer_version", "policy"]
      }
    }
  },
  "examples": [
    {
      "name": "basic_analysis",
      "description": "Basic analysis result example",
      "data": { /* example data */ }
    }
  ]
}
```

## Mock Data Detection Endpoints

### POST /detection/mock-data

Analyze data for mock/placeholder content contamination.

**Request Body:**
```json
{
  "data": { /* analysis data to check */ },
  "options": {
    "strict_mode": true,
    "custom_patterns": ["custom_pattern1", "custom_pattern2"],
    "exclude_fields": ["metadata.debug_info"]
  }
}
```

**Response:**
```json
{
  "authenticity_score": 0.15,
  "is_authentic": false,
  "contamination_level": "HIGH",
  "mock_patterns_detected": [
    {
      "path": "violations[0].description",
      "value": "This is a mock violation for testing purposes",
      "pattern_matched": "mock",
      "confidence": 0.95
    },
    {
      "path": "analysis_metadata.timestamp",
      "value": "2023-01-01T00:00:00Z",
      "pattern_matched": "placeholder_date",
      "confidence": 0.85
    }
  ],
  "recommendations": [
    "Replace placeholder timestamps with actual analysis timestamps",
    "Remove test/mock violation descriptions",
    "Use authentic file paths instead of examples"
  ]
}
```

### GET /detection/patterns

Get list of mock data detection patterns.

**Response:**
```json
{
  "patterns": [
    {
      "category": "placeholder_text",
      "patterns": ["lorem", "ipsum", "placeholder", "example"],
      "description": "Common placeholder text patterns"
    },
    {
      "category": "mock_ids",
      "patterns": ["^test_", "^mock_", "^example_"],
      "description": "Mock identifier patterns"
    },
    {
      "category": "placeholder_dates",
      "patterns": ["^2023-01-01", "^1970-01-01", "^2000-01-01"],
      "description": "Common placeholder date patterns"
    }
  ]
}
```

## Compliance Endpoints

### GET /compliance/nasa-jpl-pot10

Check NASA JPL POT10 compliance status.

**Query Parameters:**
- `analysis_id` (string, optional) - Check specific analysis
- `data` (object, optional) - Check provided data directly

**Response:**
```json
{
  "compliant": true,
  "score": 92.0,
  "requirements": {
    "policy_field_consistency": {
      "status": "PASS",
      "score": 100.0,
      "details": "All policy fields use 'nasa_jpl_pot10'"
    },
    "security_severity_scores": {
      "status": "PASS", 
      "score": 95.0,
      "details": "All security findings include numerical severity scores"
    },
    "deterministic_violation_ids": {
      "status": "PASS",
      "score": 100.0,
      "details": "All violation IDs are deterministically generated"
    },
    "data_authenticity": {
      "status": "FAIL",
      "score": 65.0,
      "details": "15% mock data contamination detected"
    }
  },
  "violations": [
    {
      "requirement": "data_authenticity",
      "severity": "MEDIUM",
      "description": "Mock data contamination exceeds 10% threshold",
      "remediation": "Remove all placeholder/mock data from analysis results"
    }
  ]
}
```

### GET /compliance/sarif

Check SARIF 2.1.0 compliance status.

**Response:**
```json
{
  "compliant": true,
  "score": 95.0,
  "version": "2.1.0",
  "validation_results": {
    "schema_validation": {
      "valid": true,
      "errors": []
    },
    "required_fields": {
      "present": ["$schema", "version", "runs"],
      "missing": []
    },
    "tool_driver": {
      "complete": true,
      "missing_fields": []
    },
    "security_severity": {
      "present": true,
      "coverage": 100.0
    }
  }
}
```

## Performance Monitoring Endpoints

### GET /performance/metrics

Get current performance metrics.

**Query Parameters:**
- `timeframe` (string, optional) - Time period: `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `component` (string, optional) - Filter by component: `analysis`, `sarif`, `validation`

**Response:**
```json
{
  "timeframe": "24h",
  "metrics": {
    "analysis": {
      "avg_duration_ms": 8450,
      "avg_memory_usage_mb": 64.5,
      "throughput_per_hour": 425,
      "success_rate": 98.5
    },
    "sarif_generation": {
      "avg_duration_ms": 2150,
      "overhead_factor": 5.8,
      "memory_overhead_mb": 15.2,
      "compression_ratio": 0.65
    },
    "schema_validation": {
      "avg_duration_ms": 145,
      "success_rate": 99.2,
      "recovery_rate": 87.5
    }
  },
  "alerts": [
    {
      "component": "sarif_generation",
      "metric": "overhead_factor",
      "value": 5.8,
      "threshold": 6.0,
      "status": "WARNING"
    }
  ]
}
```

### GET /performance/benchmarks

Get performance benchmark results.

**Response:**
```json
{
  "benchmarks": {
    "file_processing": {
      "10_files": {"duration_ms": 850, "throughput_fps": 11.76},
      "100_files": {"duration_ms": 4200, "throughput_fps": 23.81},
      "1000_files": {"duration_ms": 28500, "throughput_fps": 35.09}
    },
    "memory_usage": {
      "small_project": {"peak_mb": 32, "avg_mb": 18},
      "medium_project": {"peak_mb": 128, "avg_mb": 64},
      "large_project": {"peak_mb": 256, "avg_mb": 145}
    },
    "scalability": {
      "optimal_batch_size": 100,
      "max_concurrent_analyses": 8,
      "memory_efficiency_score": 87.5
    }
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Schema validation failed",
    "details": {
      "schema_type": "standard",
      "validation_errors": [
        {
          "field": "analysis_metadata.policy",
          "message": "Field is required for NASA compliance",
          "value": null
        }
      ]
    },
    "request_id": "req_67a8f9b2c3d4e5f6",
    "timestamp": "2024-12-06T10:35:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_FAILED` | 400 | Request validation failed |
| `SCHEMA_INVALID` | 400 | Invalid schema format |
| `MOCK_DATA_DETECTED` | 400 | Mock data contamination detected |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `PAYLOAD_TOO_LARGE` | 413 | Request exceeds size limits |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Rate Limiting

API requests are rate limited per client:

```
- 1000 requests per hour for analysis endpoints
- 5000 requests per hour for validation endpoints  
- 10000 requests per hour for read-only endpoints
```

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1701861600
```

## Webhook Integration

### Webhook Configuration

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/spek",
  "events": ["analysis.completed", "compliance.failed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `analysis.submitted` | Analysis submitted | `{analysis_id, status, project_name}` |
| `analysis.completed` | Analysis completed | `{analysis_id, status, summary, compliance}` |
| `analysis.failed` | Analysis failed | `{analysis_id, error, details}` |
| `compliance.failed` | Compliance check failed | `{analysis_id, violations, score}` |
| `mock_data.detected` | Mock data detected | `{analysis_id, contamination_level, patterns}` |

### Webhook Payload Example

```json
{
  "event": "analysis.completed",
  "timestamp": "2024-12-06T10:32:15.500Z",
  "data": {
    "analysis_id": "analysis_67a8f9b2c3d4e5f6",
    "project_name": "example-project",
    "status": "completed",
    "summary": {
      "total_violations": 12,
      "quality_score": 78.5
    },
    "compliance": {
      "nasa_jpl_pot10": true,
      "sarif_2_1_0": true
    }
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const SPEKClient = require('@spek-platform/sdk');

const client = new SPEKClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.spek-platform.com/v1'
});

// Submit analysis
const analysis = await client.analysis.submit({
  project_name: 'my-project',
  files: [
    {
      path: 'src/main.js',
      content: fs.readFileSync('src/main.js', 'utf8')
    }
  ],
  options: {
    schema_type: 'standard',
    policy: 'nasa_jpl_pot10',
    enable_mock_detection: true
  }
});

// Get results
const results = await client.analysis.get(analysis.analysis_id);

// Validate schema
const validation = await client.schemas.validate({
  data: results,
  schema_type: 'standard'
});
```

### Python

```python
from spek_platform import SPEKClient

client = SPEKClient(
    api_key='your_api_key',
    base_url='https://api.spek-platform.com/v1'
)

# Submit analysis
analysis = client.analysis.submit(
    project_name='my-project',
    files=[
        {
            'path': 'src/main.py',
            'content': open('src/main.py').read()
        }
    ],
    options={
        'schema_type': 'standard',
        'policy': 'nasa_jpl_pot10',
        'enable_mock_detection': True
    }
)

# Get results
results = client.analysis.get(analysis['analysis_id'])

# Check compliance
compliance = client.compliance.nasa_jpl_pot10(
    analysis_id=analysis['analysis_id']
)
```

## Testing and Development

### Test API Endpoints

```
Base URL: https://api-test.spek-platform.com/v1
```

### Mock Data for Testing

Test endpoints provide mock data for development:

```http
GET /test/mock-analysis
GET /test/mock-violations
GET /test/mock-sarif
```

### API Playground

Interactive API documentation and testing:
```
https://api.spek-platform.com/playground
```

## Support and Resources

- **API Status**: https://status.spek-platform.com
- **Documentation**: https://docs.spek-platform.com/api
- **SDK Repository**: https://github.com/spek-platform/sdk
- **Support**: support@spek-platform.com
- **Rate Limit Increases**: Contact support for enterprise limits

## Changelog

### v1.0.0 (2024-12-06)
- Initial API release
- Phase 1 compliance integration
- Mock data detection endpoints
- SARIF 2.1.0 support
- NASA JPL POT10 compliance
- Enhanced error recovery
- Performance monitoring endpoints
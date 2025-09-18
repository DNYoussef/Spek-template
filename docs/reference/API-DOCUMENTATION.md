# API Documentation - SPEK Development Platform

## Overview

This document provides API documentation for the SPEK Enhanced Development Platform's **local Flask API server**, designed for defense industry compliance and NASA POT10 quality analysis.

**⚠️ IMPORTANT**: This is a local development API, not a cloud service.

## Base Configuration

```
Base URL: http://localhost:8000 (configurable)
API Version: Local development
Authentication: None required for local development
Content-Type: application/json
```

## Available Endpoints

### GET /api/health

Health check endpoint for API server status.

**Description:** Check API server health and readiness
**Authentication:** None required
**Rate Limit:** Unlimited

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-17T10:30:00Z",
  "version": "1.0.0",
  "defense_ready": true
}
```

---

### GET|POST /api/dfars/compliance

DFARS (Defense Federal Acquisition Regulation Supplement) compliance validation.

**GET Request - Get Compliance Status:**
```http
GET /api/dfars/compliance
```

**Response:**
```json
{
  "compliance_status": "compliant|non_compliant|under_review",
  "last_validation": "2025-09-17T10:30:00Z",
  "dfars_version": "2025.1",
  "violations": []
}
```

**POST Request - Run Compliance Validation:**
```http
POST /api/dfars/compliance
Content-Type: application/json

{
  "project_path": "/path/to/project",
  "validation_level": "basic|full|comprehensive"
}
```

**Response:**
```json
{
  "compliance_result": "passed|failed|warning",
  "validation_id": "dfars_val_20250917_001",
  "violations": [],
  "recommendations": [],
  "timestamp": "2025-09-17T10:30:00Z"
}
```

---

### GET|POST|PUT|DELETE /api/security/access

Access control management for security policies.

**GET Request - Get Access Status:**
```http
GET /api/security/access
```

**Response:**
```json
{
  "access_rules": [],
  "active_policies": [],
  "last_updated": "2025-09-17T10:30:00Z"
}
```

**POST Request - Create Access Rule:**
```http
POST /api/security/access
Content-Type: application/json

{
  "rule_name": "example_rule",
  "access_level": "read|write|admin",
  "resources": ["/api/*"],
  "conditions": {}
}
```

---

### GET|POST /api/audit/trail

Audit trail management for compliance tracking.

**GET Request - Get Audit Trail:**
```http
GET /api/audit/trail?limit=100&offset=0
```

**Response:**
```json
{
  "audit_trail": [
    {
      "entry_id": "audit_001",
      "timestamp": "2025-09-17T10:30:00Z",
      "action": "compliance_check",
      "user": "system",
      "details": "DFARS compliance validation completed"
    }
  ],
  "total_entries": 1,
  "pagination": {
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}
```

**POST Request - Add Audit Entry:**
```http
POST /api/audit/trail
Content-Type: application/json

{
  "action": "manual_audit",
  "details": "Security review completed",
  "metadata": {}
}
```

---

### POST /api/nasa/pot10/analyze

NASA POT10 quality analysis for defense industry compliance.

**Request:**
```http
POST /api/nasa/pot10/analyze
Content-Type: application/json

{
  "project_path": "/path/to/project",
  "analysis_options": {
    "include_metrics": true,
    "compliance_level": "defense",
    "output_format": "json"
  }
}
```

**Response:**
```json
{
  "analysis_id": "nasa_pot10_analysis_001",
  "compliance_score": 92.0,
  "passing": true,
  "violations": [],
  "recommendations": [
    "Consider improving test coverage in module X",
    "Reduce cyclomatic complexity in function Y"
  ],
  "nasa_pot10_metrics": {
    "quality_score": 92.0,
    "maintainability_index": 85.5,
    "code_coverage": 78.3
  }
}
```

---

### GET /api/defense/certification

Defense certification status for DFARS compliance.

**Request:**
```http
GET /api/defense/certification
```

**Response:**
```json
{
  "certification_status": "active|expired|pending",
  "certification_level": "defense_contractor",
  "expiry_date": "2026-01-01T00:00:00Z",
  "compliance_frameworks": [
    "DFARS",
    "NASA_POT10",
    "NIST_800-53"
  ],
  "last_audit": "2025-09-01T00:00:00Z"
}
```

---

## Implementation Details

### Server Configuration

The API server is implemented in `src/api_server.py` using Flask framework:

```python
from flask import Flask, request, jsonify
from src.security.dfars_compliance_engine import DFARSComplianceEngine
from src.security.dfars_access_control import DFARSAccessControl
from src.security.audit_trail_manager import AuditTrailManager
from analyzer.enterprise.nasa_pot10_analyzer import NASAPOT10Analyzer

app = Flask(__name__)

# Initialize security components
dfars_engine = DFARSComplianceEngine()
access_control = DFARSAccessControl()
audit_manager = AuditTrailManager()
nasa_analyzer = NASAPOT10Analyzer()
```

### Starting the Server

```bash
# Development mode (not recommended for production)
python src/api_server.py

# Server runs on http://localhost:8000 by default
```

### Security Components

The API integrates with several defense industry security components:

- **DFARSComplianceEngine**: DFARS regulation compliance validation
- **DFARSAccessControl**: Access control rule management
- **AuditTrailManager**: Compliance audit trail tracking
- **NASAPOT10Analyzer**: NASA POT10 quality analysis

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error description",
  "timestamp": "2025-09-17T10:30:00Z",
  "endpoint": "/api/endpoint"
}
```

---

## Usage Examples

### cURL Examples

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

**DFARS Compliance Check:**
```bash
curl http://localhost:8000/api/dfars/compliance
```

**NASA POT10 Analysis:**
```bash
curl -X POST http://localhost:8000/api/nasa/pot10/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "project_path": "/path/to/project",
    "analysis_options": {
      "include_metrics": true,
      "compliance_level": "defense"
    }
  }'
```

---

## Integration Notes

This API is designed for:
- Defense industry projects requiring DFARS compliance
- NASA POT10 quality analysis integration
- Local development and testing environments
- Integration with SPEK development platform

**Note**: This is a local development API. For production deployment, additional security measures, authentication, and configuration management should be implemented.

---

*Last Updated: September 17, 2025*
*Based on actual implementation in src/api_server.py*

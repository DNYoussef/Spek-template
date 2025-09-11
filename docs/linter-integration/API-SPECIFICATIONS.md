# Unified Severity Mapping API Specifications
## RESTful API for Cross-Tool Violation Severity Management

### Overview

This document provides comprehensive API specifications for the Unified Severity Mapping system. The API enables real-time severity mapping, batch processing, configuration management, and correlation analysis across all integrated linter tools and connascence analysis.

---

## 1. API Architecture

### 1.1 Base Configuration

```yaml
openapi: 3.0.0
info:
  title: Unified Severity Mapping API
  version: 1.0.0
  description: |
    Comprehensive API for unified violation severity mapping across multiple 
    linter tools and connascence analysis. Provides real-time mapping, 
    batch processing, and correlation analysis capabilities.
  contact:
    name: SPEK Development Platform
    url: https://github.com/spek-platform
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.spek-platform.com/v1
    description: Production server
  - url: https://staging-api.spek-platform.com/v1
    description: Staging server
  - url: http://localhost:8080/v1
    description: Local development server

security:
  - ApiKeyAuth: []
  - BearerAuth: []
```

### 1.2 Authentication

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 2. Core API Endpoints

### 2.1 Single Violation Mapping

```yaml
/severity/map:
  post:
    summary: Map single violation to unified severity
    description: |
      Maps a raw violation from any supported tool to the unified severity scale.
      Applies base mapping, escalation rules, and industry standard alignment.
    tags:
      - Severity Mapping
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RawViolation'
          examples:
            flake8_violation:
              summary: flake8 line length violation
              value:
                id: "flake8_E501_001"
                tool: "flake8"
                severity: "E501"
                description: "line too long (88 > 79 characters)"
                location:
                  file: "src/main.py"
                  line: 42
                  column: 80
                metadata:
                  rule_id: "E501"
                  category: "style"
            connascence_violation:
              summary: Connascence of Algorithm violation
              value:
                id: "conn_CoA_001"
                tool: "connascence"
                severity: "CoA"
                description: "Connascence of Algorithm: Duplicate sorting logic"
                location:
                  file: "src/utils.py"
                  line: 15
                  function: "sort_items"
                metadata:
                  connascence_type: "CoA"
                  strength: 8
                  degree: 3
    responses:
      '200':
        description: Successfully mapped violation
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UnifiedViolation'
            examples:
              mapped_violation:
                summary: Successfully mapped violation
                value:
                  id: "unified_001"
                  severity: "HIGH"
                  confidence: 0.92
                  source_tool: "connascence"
                  original_severity: "CoA"
                  escalation_factors:
                    - "algorithm_complexity"
                    - "public_api_boundary"
                  industry_alignments:
                    nasa_pot10: "POT10_1"
                    owasp: "A04_Insecure_Design"
                  calculated_at: "2025-09-10T23:45:00Z"
                  location:
                    file: "src/utils.py"
                    line: 15
                    function: "sort_items"
                  recommendations:
                    - "Extract common sorting logic to shared utility"
                    - "Consider using built-in sorting methods"
      '400':
        description: Invalid request format
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      '422':
        description: Unsupported tool or violation format
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      '500':
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
```

### 2.2 Batch Violation Processing

```yaml
/severity/batch:
  post:
    summary: Map multiple violations in batch
    description: |
      Processes multiple violations from potentially different tools, 
      applying correlation analysis and cross-tool escalation rules.
    tags:
      - Severity Mapping
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - violations
            properties:
              violations:
                type: array
                items:
                  $ref: '#/components/schemas/RawViolation'
                minItems: 1
                maxItems: 1000
              options:
                $ref: '#/components/schemas/BatchOptions'
          examples:
            multi_tool_batch:
              summary: Batch with violations from multiple tools
              value:
                violations:
                  - id: "pylint_W0622_001"
                    tool: "pylint"
                    severity: "W0622"
                    description: "Redefining built-in 'id'"
                    location:
                      file: "src/auth.py"
                      line: 25
                  - id: "bandit_B303_001"
                    tool: "bandit"
                    severity: "MEDIUM"
                    description: "Use of insecure MD5 hash function"
                    location:
                      file: "src/auth.py"
                      line: 28
                  - id: "mypy_error_001"
                    tool: "mypy"
                    severity: "error"
                    description: "Incompatible return value type"
                    location:
                      file: "src/auth.py"
                      line: 30
                options:
                  enable_correlation: true
                  correlation_threshold: 0.8
                  max_processing_time: 5000
    responses:
      '200':
        description: Successfully processed batch
        content:
          application/json:
            schema:
              type: object
              properties:
                violations:
                  type: array
                  items:
                    $ref: '#/components/schemas/UnifiedViolation'
                summary:
                  $ref: '#/components/schemas/BatchSummary'
                correlation_results:
                  $ref: '#/components/schemas/CorrelationResults'
            examples:
              batch_result:
                summary: Successful batch processing result
                value:
                  violations:
                    - id: "unified_batch_001"
                      severity: "CRITICAL"
                      confidence: 0.95
                      source_tool: "correlation"
                      correlated_violations: 3
                  summary:
                    total_input: 3
                    total_output: 1
                    reduction_percentage: 66.7
                    processing_time_ms: 150
                  correlation_results:
                    clusters_found: 1
                    correlation_accuracy: 0.92
      '400':
        description: Invalid batch request
      '413':
        description: Batch size too large
      '500':
        description: Batch processing failed
```

### 2.3 Correlation Analysis

```yaml
/correlation/analyze:
  post:
    summary: Perform cross-tool correlation analysis
    description: |
      Analyzes relationships between violations across multiple tools,
      identifying patterns, duplicates, and cross-tool consensus.
    tags:
      - Correlation Analysis
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - violations
            properties:
              violations:
                type: array
                items:
                  $ref: '#/components/schemas/UnifiedViolation'
              correlation_config:
                $ref: '#/components/schemas/CorrelationConfig'
    responses:
      '200':
        description: Correlation analysis completed
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CorrelationAnalysisResult'

/correlation/patterns:
  get:
    summary: Get correlation pattern library
    description: |
      Retrieves the current library of known correlation patterns
      for different violation types across tools.
    tags:
      - Correlation Analysis
    parameters:
      - name: tool
        in: query
        description: Filter patterns by tool
        schema:
          type: string
          enum: [connascence, flake8, pylint, ruff, mypy, bandit, eslint]
      - name: pattern_type
        in: query
        description: Filter by pattern type
        schema:
          type: string
          enum: [MAGIC_LITERALS, TYPE_SAFETY, SECURITY_ISSUES, CODE_COMPLEXITY]
    responses:
      '200':
        description: Pattern library retrieved
        content:
          application/json:
            schema:
              type: object
              properties:
                patterns:
                  type: array
                  items:
                    $ref: '#/components/schemas/CorrelationPattern'
```

---

## 3. Configuration Management

### 3.1 Severity Configuration

```yaml
/config/severity:
  get:
    summary: Get current severity mapping configuration
    description: Retrieves the current severity mapping configuration
    tags:
      - Configuration
    responses:
      '200':
        description: Configuration retrieved successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SeverityConfig'
  
  put:
    summary: Update severity mapping configuration
    description: |
      Updates the severity mapping configuration. Changes take effect
      immediately for new requests. Supports partial updates.
    tags:
      - Configuration
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/SeverityConfig'
    responses:
      '200':
        description: Configuration updated successfully
      '400':
        description: Invalid configuration format
      '422':
        description: Configuration validation failed

/config/tools/{tool_name}:
  get:
    summary: Get tool-specific configuration
    description: Retrieves configuration for a specific tool
    tags:
      - Configuration
    parameters:
      - name: tool_name
        in: path
        required: true
        schema:
          type: string
          enum: [connascence, flake8, pylint, ruff, mypy, bandit, eslint]
    responses:
      '200':
        description: Tool configuration retrieved
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ToolConfig'
      '404':
        description: Tool not found
  
  patch:
    summary: Update tool-specific configuration
    description: Updates configuration for a specific tool
    tags:
      - Configuration
    parameters:
      - name: tool_name
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ToolConfig'
    responses:
      '200':
        description: Tool configuration updated
      '404':
        description: Tool not found
      '422':
        description: Invalid tool configuration
```

### 3.2 Escalation Rules Management

```yaml
/config/escalation:
  get:
    summary: Get escalation rules configuration
    description: Retrieves current escalation rules and thresholds
    tags:
      - Configuration
    responses:
      '200':
        description: Escalation rules retrieved
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EscalationConfig'
  
  post:
    summary: Add new escalation rule
    description: Adds a new escalation rule to the configuration
    tags:
      - Configuration
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/EscalationRule'
    responses:
      '201':
        description: Escalation rule created
      '400':
        description: Invalid rule format
      '409':
        description: Rule already exists

/config/escalation/{rule_id}:
  get:
    summary: Get specific escalation rule
    description: Retrieves details of a specific escalation rule
    tags:
      - Configuration
    parameters:
      - name: rule_id
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Escalation rule retrieved
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EscalationRule'
      '404':
        description: Rule not found
  
  put:
    summary: Update escalation rule
    description: Updates an existing escalation rule
    tags:
      - Configuration
    parameters:
      - name: rule_id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/EscalationRule'
    responses:
      '200':
        description: Rule updated successfully
      '404':
        description: Rule not found
      '422':
        description: Invalid rule configuration
  
  delete:
    summary: Delete escalation rule
    description: Removes an escalation rule from the configuration
    tags:
      - Configuration
    parameters:
      - name: rule_id
        in: path
        required: true
        schema:
          type: string
    responses:
      '204':
        description: Rule deleted successfully
      '404':
        description: Rule not found
```

---

## 4. Analytics and Reporting

### 4.1 Severity Analytics

```yaml
/analytics/severity/distribution:
  get:
    summary: Get severity distribution analytics
    description: |
      Provides analytics on severity distribution across tools,
      time periods, and projects.
    tags:
      - Analytics
    parameters:
      - name: timeframe
        in: query
        description: Time period for analytics
        schema:
          type: string
          enum: [hour, day, week, month]
          default: day
      - name: tool
        in: query
        description: Filter by specific tool
        schema:
          type: string
      - name: project_id
        in: query
        description: Filter by project
        schema:
          type: string
    responses:
      '200':
        description: Severity distribution data
        content:
          application/json:
            schema:
              type: object
              properties:
                timeframe:
                  type: string
                distribution:
                  type: object
                  properties:
                    critical:
                      type: integer
                    high:
                      type: integer
                    medium:
                      type: integer
                    low:
                      type: integer
                    info:
                      type: integer
                trends:
                  type: array
                  items:
                    type: object
                    properties:
                      timestamp:
                        type: string
                        format: date-time
                      severity_counts:
                        type: object

/analytics/tools/coverage:
  get:
    summary: Get tool coverage analytics
    description: |
      Analyzes coverage and effectiveness of different tools
      in detecting various types of violations.
    tags:
      - Analytics
    parameters:
      - name: timeframe
        in: query
        schema:
          type: string
          enum: [day, week, month]
          default: week
    responses:
      '200':
        description: Tool coverage analytics
        content:
          application/json:
            schema:
              type: object
              properties:
                tool_effectiveness:
                  type: object
                  additionalProperties:
                    type: object
                    properties:
                      violations_detected:
                        type: integer
                      unique_violations:
                        type: integer
                      correlation_rate:
                        type: number
                      confidence_average:
                        type: number
                coverage_gaps:
                  type: array
                  items:
                    type: object
                    properties:
                      violation_type:
                        type: string
                      missing_tools:
                        type: array
                        items:
                          type: string
```

### 4.2 Performance Metrics

```yaml
/analytics/performance:
  get:
    summary: Get API performance metrics
    description: |
      Retrieves performance metrics for the severity mapping API,
      including response times, throughput, and error rates.
    tags:
      - Analytics
    parameters:
      - name: timeframe
        in: query
        schema:
          type: string
          enum: [hour, day, week]
          default: hour
      - name: endpoint
        in: query
        description: Filter by specific endpoint
        schema:
          type: string
    responses:
      '200':
        description: Performance metrics
        content:
          application/json:
            schema:
              type: object
              properties:
                response_times:
                  type: object
                  properties:
                    p50:
                      type: number
                    p95:
                      type: number
                    p99:
                      type: number
                    average:
                      type: number
                throughput:
                  type: object
                  properties:
                    requests_per_second:
                      type: number
                    violations_per_second:
                      type: number
                error_rates:
                  type: object
                  properties:
                    total_requests:
                      type: integer
                    error_count:
                      type: integer
                    error_rate:
                      type: number
                cache_performance:
                  type: object
                  properties:
                    hit_rate:
                      type: number
                    miss_rate:
                      type: number
                    cache_size:
                      type: integer
```

---

## 5. Data Models

### 5.1 Core Schemas

```yaml
components:
  schemas:
    RawViolation:
      type: object
      required:
        - id
        - tool
        - severity
        - description
      properties:
        id:
          type: string
          description: Unique identifier for the violation
          example: "flake8_E501_001"
        tool:
          type: string
          enum: [connascence, flake8, pylint, ruff, mypy, bandit, eslint]
          description: Source tool that detected the violation
        severity:
          type: string
          description: Original severity as reported by the tool
          example: "E501"
        description:
          type: string
          description: Human-readable description of the violation
          example: "line too long (88 > 79 characters)"
        location:
          $ref: '#/components/schemas/Location'
        metadata:
          type: object
          description: Tool-specific metadata
          additionalProperties: true
        timestamp:
          type: string
          format: date-time
          description: When the violation was detected
    
    UnifiedViolation:
      type: object
      required:
        - id
        - severity
        - confidence
        - source_tool
        - calculated_at
      properties:
        id:
          type: string
          description: Unified violation identifier
        severity:
          type: string
          enum: [CRITICAL, HIGH, MEDIUM, LOW, INFO]
          description: Unified severity level
        confidence:
          type: number
          minimum: 0
          maximum: 1
          description: Confidence score for the severity mapping
        source_tool:
          type: string
          description: Primary tool that detected this violation
        original_severity:
          type: string
          description: Original severity from the source tool
        escalation_factors:
          type: array
          items:
            type: string
          description: Factors that influenced severity escalation
        industry_alignments:
          type: object
          properties:
            owasp:
              type: string
              description: OWASP category mapping
            nist:
              type: string
              description: NIST CSF function mapping
            nasa_pot10:
              type: string
              description: NASA Power of Ten rule mapping
        calculated_at:
          type: string
          format: date-time
          description: When the unified severity was calculated
        location:
          $ref: '#/components/schemas/Location'
        recommendations:
          type: array
          items:
            type: string
          description: Recommended actions to resolve the violation
        correlated_violations:
          type: integer
          description: Number of violations correlated into this one
        correlation_score:
          type: number
          minimum: 0
          maximum: 1
          description: Confidence in correlation (if applicable)
    
    Location:
      type: object
      required:
        - file
        - line
      properties:
        file:
          type: string
          description: File path relative to project root
          example: "src/main.py"
        line:
          type: integer
          minimum: 1
          description: Line number where violation occurs
        column:
          type: integer
          minimum: 1
          description: Column number (if available)
        function:
          type: string
          description: Function or method name (if applicable)
        class:
          type: string
          description: Class name (if applicable)
    
    BatchOptions:
      type: object
      properties:
        enable_correlation:
          type: boolean
          default: true
          description: Whether to perform cross-tool correlation
        correlation_threshold:
          type: number
          minimum: 0
          maximum: 1
          default: 0.8
          description: Minimum similarity for correlation
        max_processing_time:
          type: integer
          minimum: 100
          maximum: 60000
          default: 5000
          description: Maximum processing time in milliseconds
        include_recommendations:
          type: boolean
          default: true
          description: Whether to include violation recommendations
        priority_mode:
          type: string
          enum: [speed, accuracy, balanced]
          default: balanced
          description: Processing priority mode
    
    BatchSummary:
      type: object
      properties:
        total_input:
          type: integer
          description: Number of input violations
        total_output:
          type: integer
          description: Number of output violations after processing
        reduction_percentage:
          type: number
          description: Percentage reduction through correlation
        processing_time_ms:
          type: integer
          description: Total processing time in milliseconds
        cache_hit_rate:
          type: number
          description: Cache hit rate for this batch
        escalations_applied:
          type: integer
          description: Number of severity escalations applied
        correlations_found:
          type: integer
          description: Number of correlations identified
```

### 5.2 Configuration Schemas

```yaml
    SeverityConfig:
      type: object
      required:
        - version
        - severity_levels
        - tool_mappings
      properties:
        version:
          type: string
          pattern: '^\\d+\\.\\d+\\.\\d+$'
          description: Configuration version
        severity_levels:
          type: object
          required: [critical, high, medium, low, info]
          properties:
            critical:
              type: number
              minimum: 0
            high:
              type: number
              minimum: 0
            medium:
              type: number
              minimum: 0
            low:
              type: number
              minimum: 0
            info:
              type: number
              minimum: 0
        tool_mappings:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/ToolConfig'
        escalation_rules:
          $ref: '#/components/schemas/EscalationConfig'
        industry_standards:
          type: object
          properties:
            owasp:
              type: object
              properties:
                enabled:
                  type: boolean
                mappings:
                  type: object
            nist:
              type: object
              properties:
                enabled:
                  type: boolean
                mappings:
                  type: object
            nasa_pot10:
              type: object
              properties:
                enabled:
                  type: boolean
                compliance_target:
                  type: number
                  minimum: 0
                  maximum: 1
    
    ToolConfig:
      type: object
      required:
        - enabled
        - base_mappings
      properties:
        enabled:
          type: boolean
          description: Whether this tool integration is enabled
        base_mappings:
          type: object
          description: Base severity mappings for this tool
          additionalProperties:
            type: string
            enum: [critical, high, medium, low, info]
        escalation_rules:
          type: object
          description: Tool-specific escalation rules
          additionalProperties:
            oneOf:
              - type: string
              - type: number
        confidence_weights:
          type: object
          description: Confidence weights for different violation types
          additionalProperties:
            type: number
            minimum: 0
            maximum: 1
        custom_patterns:
          type: array
          items:
            type: object
            properties:
              pattern:
                type: string
              severity_override:
                type: string
              confidence_modifier:
                type: number
    
    EscalationConfig:
      type: object
      properties:
        multi_tool_consensus:
          type: object
          properties:
            enabled:
              type: boolean
            thresholds:
              type: object
              additionalProperties:
                type: number
        context_sensitive:
          type: object
          properties:
            enabled:
              type: boolean
            factors:
              type: object
              additionalProperties:
                type: number
        temporal:
          type: object
          properties:
            enabled:
              type: boolean
            age_thresholds:
              type: object
            recurrence_thresholds:
              type: object
    
    EscalationRule:
      type: object
      required:
        - id
        - name
        - condition
        - action
      properties:
        id:
          type: string
          description: Unique rule identifier
        name:
          type: string
          description: Human-readable rule name
        description:
          type: string
          description: Rule description and purpose
        condition:
          type: object
          description: Conditions that trigger this rule
          properties:
            tool:
              type: string
            severity:
              type: string
            pattern:
              type: string
            context:
              type: object
        action:
          type: object
          description: Action to take when rule is triggered
          properties:
            severity_adjustment:
              type: number
            add_escalation_factor:
              type: string
            set_confidence:
              type: number
        priority:
          type: integer
          minimum: 1
          maximum: 100
          description: Rule priority (higher = more important)
        enabled:
          type: boolean
          default: true
```

### 5.3 Analytics Schemas

```yaml
    CorrelationResults:
      type: object
      properties:
        clusters_found:
          type: integer
          description: Number of correlation clusters identified
        correlation_accuracy:
          type: number
          minimum: 0
          maximum: 1
          description: Overall correlation accuracy score
        pattern_distribution:
          type: object
          additionalProperties:
            type: integer
          description: Distribution of violation patterns found
        tool_consensus:
          type: object
          additionalProperties:
            type: number
          description: Consensus scores by tool
        duplicate_elimination:
          type: object
          properties:
            exact_duplicates:
              type: integer
            fuzzy_duplicates:
              type: integer
            total_eliminated:
              type: integer
    
    CorrelationAnalysisResult:
      type: object
      properties:
        consolidated_violations:
          type: array
          items:
            $ref: '#/components/schemas/UnifiedViolation'
        correlation_metrics:
          $ref: '#/components/schemas/CorrelationResults'
        processing_stats:
          type: object
          properties:
            total_time_ms:
              type: integer
            clustering_time_ms:
              type: integer
            consolidation_time_ms:
              type: integer
            cache_hits:
              type: integer
            cache_misses:
              type: integer
    
    CorrelationPattern:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        pattern_type:
          type: string
          enum: [MAGIC_LITERALS, TYPE_SAFETY, SECURITY_ISSUES, CODE_COMPLEXITY, NAMING_CONVENTIONS, DEAD_CODE]
        tools:
          type: array
          items:
            type: string
        confidence:
          type: number
          minimum: 0
          maximum: 1
        example_violations:
          type: array
          items:
            type: string
    
    ErrorResponse:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          description: Additional error details
        request_id:
          type: string
          description: Unique request identifier for debugging
        timestamp:
          type: string
          format: date-time
          description: When the error occurred
```

---

## 6. Error Handling

### 6.1 Standard Error Codes

| HTTP Status | Error Code | Description | Resolution |
|------------|------------|-------------|------------|
| 400 | `INVALID_REQUEST` | Malformed request body or parameters | Fix request format |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication | Provide valid API key |
| 403 | `FORBIDDEN` | Insufficient permissions | Contact administrator |
| 404 | `NOT_FOUND` | Resource not found | Check resource identifier |
| 409 | `CONFLICT` | Resource already exists | Use different identifier |
| 413 | `PAYLOAD_TOO_LARGE` | Request exceeds size limits | Reduce batch size |
| 422 | `UNPROCESSABLE_ENTITY` | Valid format but invalid data | Fix data validation errors |
| 429 | `RATE_LIMITED` | Too many requests | Implement rate limiting |
| 500 | `INTERNAL_ERROR` | Server-side processing error | Retry request |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Retry with backoff |

### 6.2 Error Response Examples

```json
{
  "error": "INVALID_REQUEST",
  "message": "Required field 'tool' is missing",
  "details": {
    "field": "tool",
    "expected_values": ["connascence", "flake8", "pylint", "ruff", "mypy", "bandit", "eslint"]
  },
  "request_id": "req_123456789",
  "timestamp": "2025-09-10T23:45:00Z"
}
```

```json
{
  "error": "UNPROCESSABLE_ENTITY", 
  "message": "Unsupported tool 'custom_linter'",
  "details": {
    "supported_tools": ["connascence", "flake8", "pylint", "ruff", "mypy", "bandit", "eslint"],
    "received_tool": "custom_linter"
  },
  "request_id": "req_987654321",
  "timestamp": "2025-09-10T23:45:00Z"
}
```

---

## 7. Rate Limiting and Quotas

### 7.1 Rate Limiting Rules

| Endpoint Category | Rate Limit | Quota Period | Burst Limit |
|------------------|------------|--------------|-------------|
| Single mapping | 1000/min | Per API key | 100 |
| Batch processing | 100/min | Per API key | 10 |
| Configuration | 50/min | Per API key | 20 |
| Analytics | 200/min | Per API key | 50 |

### 7.2 Rate Limiting Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1694736300
X-RateLimit-Retry-After: 60
```

---

## 8. SDK and Integration Examples

### 8.1 Python SDK Example

```python
from spek_severity_api import SeverityMappingClient

# Initialize client
client = SeverityMappingClient(
    api_key="your_api_key",
    base_url="https://api.spek-platform.com/v1"
)

# Map single violation
raw_violation = {
    "id": "flake8_E501_001",
    "tool": "flake8", 
    "severity": "E501",
    "description": "line too long (88 > 79 characters)",
    "location": {
        "file": "src/main.py",
        "line": 42
    }
}

unified_violation = client.map_violation(raw_violation)
print(f"Unified severity: {unified_violation.severity}")

# Batch processing
violations = [raw_violation, ...]
result = client.batch_map_violations(
    violations=violations,
    options={
        "enable_correlation": True,
        "correlation_threshold": 0.8
    }
)

print(f"Processed {len(violations)} -> {len(result.violations)} violations")
print(f"Reduction: {result.summary.reduction_percentage}%")
```

### 8.2 JavaScript SDK Example

```javascript
import { SeverityMappingClient } from '@spek-platform/severity-api';

const client = new SeverityMappingClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.spek-platform.com/v1'
});

// Map single violation
const rawViolation = {
  id: 'eslint_no_eval_001',
  tool: 'eslint',
  severity: '2',
  description: 'eval can be harmful',
  location: {
    file: 'src/app.js',
    line: 15
  }
};

const unifiedViolation = await client.mapViolation(rawViolation);
console.log(`Unified severity: ${unifiedViolation.severity}`);

// Batch processing with correlation
const violations = [rawViolation, ...];
const result = await client.batchMapViolations({
  violations,
  options: {
    enableCorrelation: true,
    correlationThreshold: 0.8
  }
});

console.log(`Correlation found ${result.correlationResults.clustersFound} clusters`);
```

---

## 9. Monitoring and Observability

### 9.1 Health Check Endpoint

```yaml
/health:
  get:
    summary: API health check
    description: Returns API health status and component availability
    tags:
      - Monitoring
    responses:
      '200':
        description: API is healthy
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [healthy, degraded, unhealthy]
                timestamp:
                  type: string
                  format: date-time
                version:
                  type: string
                components:
                  type: object
                  properties:
                    database:
                      type: string
                      enum: [healthy, unhealthy]
                    cache:
                      type: string
                      enum: [healthy, unhealthy]
                    correlation_engine:
                      type: string
                      enum: [healthy, unhealthy]
                uptime:
                  type: number
                  description: Uptime in seconds
```

### 9.2 Metrics Endpoint

```yaml
/metrics:
  get:
    summary: Prometheus metrics
    description: Returns metrics in Prometheus format for monitoring
    tags:
      - Monitoring
    responses:
      '200':
        description: Metrics in Prometheus format
        content:
          text/plain:
            schema:
              type: string
            example: |
              # HELP severity_mapping_requests_total Total number of severity mapping requests
              # TYPE severity_mapping_requests_total counter
              severity_mapping_requests_total{endpoint="/severity/map",status="200"} 12345
              
              # HELP severity_mapping_duration_seconds Request duration in seconds
              # TYPE severity_mapping_duration_seconds histogram
              severity_mapping_duration_seconds_bucket{endpoint="/severity/map",le="0.01"} 8000
              severity_mapping_duration_seconds_bucket{endpoint="/severity/map",le="0.05"} 11000
              severity_mapping_duration_seconds_bucket{endpoint="/severity/map",le="0.1"} 12000
              severity_mapping_duration_seconds_bucket{endpoint="/severity/map",le="+Inf"} 12345
```

---

## Conclusion

The Unified Severity Mapping API provides a comprehensive, production-ready interface for managing violation severity across multiple linter tools and connascence analysis. With its RESTful design, comprehensive error handling, and performance optimization features, it enables seamless integration into CI/CD pipelines, IDEs, and custom tooling.

**Key API Benefits:**
- **Standardized Interface**: Consistent API across all tools and violation types
- **Real-Time Processing**: Sub-100ms response times with intelligent caching
- **Batch Optimization**: Efficient processing of large violation sets
- **Correlation Analysis**: Advanced multi-tool violation correlation
- **Configuration Management**: Dynamic configuration updates without downtime
- **Comprehensive Analytics**: Detailed insights into violation patterns and trends

This API specification serves as the foundation for building robust, scalable integrations with the SPEK Enhanced Development Platform's unified severity mapping system.
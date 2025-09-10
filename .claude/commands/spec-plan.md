# /spec:plan

## Purpose
Convert SPEC.md to structured plan.json for workflow orchestration. This is the critical first step that enables all automated workflows by transforming human-readable specifications into machine-executable task structures.

## Usage
/spec:plan

## Implementation

### 1. Input Validation
- Verify SPEC.md exists in project root
- Check for required sections (Overview, Requirements, Acceptance Criteria)
- Validate SPEC format follows template structure

### 2. Core Processing Logic
1. **Parse SPEC.md sections**:
   - Extract feature overview and goals
   - Parse functional and non-functional requirements  
   - Identify acceptance criteria and success metrics
   - Analyze complexity indicators and dependencies

2. **Task Generation**:
   - Break down requirements into implementable tasks
   - Classify tasks by complexity (small/multi/big)
   - Assign budget constraints (LOC limits, file counts)
   - Generate verification commands for each task

3. **Risk Assessment**:
   - Identify technical risks and dependencies
   - Flag security, performance, or architectural concerns
   - Suggest mitigation strategies

### 3. Output Generation
Generate structured plan.json:
```json
{
  "goals": [
    "Primary goal extracted from SPEC overview",
    "Secondary goals from requirements"
  ],
  "tasks": [
    {
      "id": "task-001",
      "title": "Descriptive task name",
      "type": "small|multi|big",
      "scope": "Detailed scope description",
      "verify_cmds": ["npm test", "npm run typecheck"],
      "budget_loc": 25,
      "budget_files": 2,
      "acceptance": [
        "Specific acceptance criteria",
        "Measurable success metrics"
      ]
    }
  ],
  "risks": [
    {
      "type": "technical|security|performance|dependency",
      "description": "Risk description",
      "impact": "high|medium|low", 
      "mitigation": "Suggested mitigation approach"
    }
  ],
  "metadata": {
    "spec_version": "1.0.0",
    "generated_at": "ISO timestamp",
    "complexity_score": "1-10 scale",
    "estimated_effort": "hours estimation"
  }
}
```

### 4. Task Complexity Classification
- **small**: <=25 LOC, <=2 files, isolated changes
- **multi**: Multi-file changes, moderate complexity, clear boundaries
- **big**: Architectural changes, cross-cutting concerns, high impact

### 5. Budget Assignment Rules
- **small tasks**: 25 LOC, 2 files max
- **multi tasks**: 100 LOC, 5 files max  
- **big tasks**: No fixed limits (require architecture phase)

## Integration Points

### Used by:
- `flow/workflows/spec-to-pr.yaml` (first step)
- `flow/workflows/after-edit.yaml` (for reanalysis)
- `scripts/self_correct.sh` (for task context)

### Produces:
- `plan.json` - Machine-readable task structure
- Task classifications for routing decisions
- Budget constraints for safety enforcement

### Consumes:
- `SPEC.md` - Human-readable project specification
- Template context from project structure
- Historical complexity data (if available)

## Examples

### Example SPEC.md Input:
```markdown
# User Authentication System

## Overview
Implement secure user authentication with JWT tokens, password hashing, and session management.

## Requirements
- User registration and login endpoints
- JWT token generation and validation
- Password hashing with bcrypt
- Session management and logout
- Rate limiting for auth endpoints

## Acceptance Criteria
- All endpoints return proper HTTP status codes
- Passwords are never stored in plaintext
- JWT tokens expire after 24 hours
- Rate limiting prevents brute force attacks
- Integration tests cover all auth flows
```

### Example plan.json Output:
```json
{
  "goals": [
    "Implement secure user authentication system",
    "Ensure security best practices for password and session management"
  ],
  "tasks": [
    {
      "id": "auth-001", 
      "title": "Create user registration endpoint",
      "type": "small",
      "scope": "POST /api/register endpoint with password hashing",
      "verify_cmds": ["npm test -- auth.test.js", "npm run security-scan"],
      "budget_loc": 25,
      "budget_files": 2,
      "acceptance": [
        "Endpoint returns 201 on successful registration",
        "Passwords are hashed with bcrypt before storage",
        "Proper validation for email and password format"
      ]
    },
    {
      "id": "auth-002",
      "title": "Implement JWT token management", 
      "type": "multi",
      "scope": "Token generation, validation, and refresh logic",
      "verify_cmds": ["npm test -- token.test.js", "npm run lint"],
      "budget_loc": 75,
      "budget_files": 4,
      "acceptance": [
        "Tokens expire after 24 hours",
        "Token validation middleware works correctly", 
        "Refresh token mechanism functions properly"
      ]
    },
    {
      "id": "auth-003",
      "title": "Add rate limiting for auth endpoints",
      "type": "big", 
      "scope": "Cross-cutting rate limiting with Redis/memory store",
      "verify_cmds": ["npm test -- rate-limit.test.js", "npm run integration-test"],
      "budget_loc": 0,
      "budget_files": 0,
      "acceptance": [
        "Rate limiting prevents brute force attacks",
        "Proper error responses for rate limit exceeded",
        "Rate limits configurable per endpoint"
      ]
    }
  ],
  "risks": [
    {
      "type": "security",
      "description": "Password storage and JWT token security",
      "impact": "high",
      "mitigation": "Use bcrypt for passwords, secure JWT signing keys"
    },
    {
      "type": "dependency",
      "description": "Rate limiting requires Redis or memory store",
      "impact": "medium", 
      "mitigation": "Provide fallback to in-memory rate limiting"
    }
  ],
  "metadata": {
    "spec_version": "1.0.0",
    "generated_at": "2024-09-08T12:00:00Z",
    "complexity_score": 7,
    "estimated_effort": "16-24 hours"
  }
}
```

## Error Handling

### Common Errors:
1. **Missing SPEC.md**: Provide clear guidance on creating specification
2. **Invalid SPEC format**: Show template and highlight missing sections
3. **Ambiguous requirements**: Request clarification on specific items
4. **Complexity analysis failure**: Default to "multi" classification with warning

### Recovery Strategies:
- Partial parsing: Generate plan from available sections
- Template assistance: Offer to create missing SPEC sections
- Iterative refinement: Allow plan updates based on feedback

## Quality Standards

### Output Validation:
- JSON schema validation for plan.json structure
- Task ID uniqueness and format consistency
- Budget constraint reasonableness checks
- Acceptance criteria completeness validation

### Performance Requirements:
- Parse and generate plan within 30 seconds
- Handle SPEC files up to 10MB
- Graceful degradation for complex specifications
- Memory usage under 100MB during processing

This command is the foundation of the entire SPEK automation system, transforming human intent into machine-executable workflows.
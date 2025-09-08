# /gemini:impact

## Purpose
Leverage Gemini's large context window to generate comprehensive change-impact maps for complex modifications. Analyzes architectural dependencies, cross-cutting concerns, and downstream effects to guide safe implementation strategies. Critical for understanding blast radius before making significant changes.

## Usage
/gemini:impact '<target_change_description>'

## Implementation

### 1. Input Validation
- Verify target change description is sufficiently detailed
- Check that project has sufficient codebase for meaningful analysis
- Ensure Gemini CLI is available and configured
- Validate current working directory contains analyzable code

### 2. Large-Context Analysis via Gemini CLI

#### Context Preparation:
```bash
# Gather comprehensive codebase context
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" | head -100 > /tmp/source_files.txt

# Include critical configuration files
find . -name "package.json" -o -name "tsconfig.json" -o -name "*.config.js" -o -name "*.yaml" -o -name "*.yml" >> /tmp/source_files.txt

# Add test files for impact understanding
find . -path "*/test*" -name "*.js" -o -path "*/test*" -name "*.ts" >> /tmp/source_files.txt
```

#### Gemini CLI Execution:
```bash
# Execute impact analysis with large context window
gemini -p "Analyze the impact of the following change: ${TARGET_CHANGE}

Based on the codebase context, create a comprehensive change-impact map. 

Output ONLY a JSON object with this exact structure:
{
  \"hotspots\": [
    {
      \"file\": \"path/to/file.js\",
      \"reason\": \"Why this file is impacted\",
      \"impact_level\": \"high|medium|low\",
      \"change_type\": \"interface|implementation|config|test\"
    }
  ],
  \"callers\": [
    {
      \"caller_file\": \"path/to/caller.js\",
      \"target_file\": \"path/to/target.js\", 
      \"function_name\": \"functionName\",
      \"call_pattern\": \"direct|indirect|dynamic\",
      \"risk_level\": \"high|medium|low\"
    }
  ],
  \"configs\": [
    {
      \"config_file\": \"path/to/config.json\",
      \"affected_keys\": [\"key1\", \"key2\"],
      \"change_required\": \"Description of config change needed\"
    }
  ],
  \"crosscuts\": [
    {
      \"concern\": \"logging|auth|validation|error_handling\",
      \"affected_files\": [\"file1.js\", \"file2.js\"],
      \"coordination_required\": \"Description of cross-cutting coordination needed\"
    }
  ],
  \"testFocus\": [
    {
      \"test_file\": \"path/to/test.js\",
      \"test_category\": \"unit|integration|e2e\",
      \"priority\": \"critical|high|medium|low\",
      \"reason\": \"Why this test area needs focus\"
    }
  ],
  \"riskAssessment\": {
    \"overall_risk\": \"high|medium|low\",
    \"complexity_score\": 1-10,
    \"coordination_complexity\": \"high|medium|low\",
    \"rollback_difficulty\": \"high|medium|low\",
    \"recommended_approach\": \"big_bang|incremental|feature_flag\"
  }
}" $(cat /tmp/source_files.txt | head -50)
```

### 3. Output Processing and Validation

#### JSON Structure Validation:
```javascript
function validateImpactMap(impactJson) {
  const requiredFields = ['hotspots', 'callers', 'configs', 'crosscuts', 'testFocus', 'riskAssessment'];
  
  for (const field of requiredFields) {
    if (!impactJson[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate hotspots structure
  for (const hotspot of impactJson.hotspots) {
    if (!hotspot.file || !hotspot.reason || !['high', 'medium', 'low'].includes(hotspot.impact_level)) {
      throw new Error('Invalid hotspot structure');
    }
  }
  
  // Validate risk assessment
  const risk = impactJson.riskAssessment;
  if (!['high', 'medium', 'low'].includes(risk.overall_risk) || 
      risk.complexity_score < 1 || risk.complexity_score > 10) {
    throw new Error('Invalid risk assessment');
  }
  
  return true;
}
```

#### File Existence Cross-Check:
```javascript
function crossCheckFiles(impactMap) {
  const allFiles = [
    ...impactMap.hotspots.map(h => h.file),
    ...impactMap.callers.map(c => c.caller_file),
    ...impactMap.callers.map(c => c.target_file),
    ...impactMap.configs.map(c => c.config_file),
    ...impactMap.testFocus.map(t => t.test_file)
  ];
  
  const missingFiles = allFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.warn(`Warning: Referenced files not found: ${missingFiles.join(', ')}`);
  }
  
  return {
    total_references: allFiles.length,
    missing_files: missingFiles.length,
    accuracy_score: ((allFiles.length - missingFiles.length) / allFiles.length * 100).toFixed(1)
  };
}
```

### 4. Enhanced Analysis Output

Generate comprehensive impact.json:

```json
{
  "timestamp": "2024-09-08T12:30:00Z",
  "target_change": "Implement user authentication system with JWT tokens",
  "analysis_method": "gemini_large_context",
  "context_size_files": 47,
  
  "hotspots": [
    {
      "file": "src/api/auth.js",
      "reason": "Primary implementation file for JWT authentication logic",
      "impact_level": "high",
      "change_type": "implementation",
      "estimated_loc": 85,
      "complexity_factors": ["token_generation", "validation_middleware", "refresh_logic"]
    },
    {
      "file": "src/middleware/auth.js", 
      "reason": "Existing auth middleware needs JWT integration",
      "impact_level": "high",
      "change_type": "interface",
      "estimated_loc": 25,
      "complexity_factors": ["backward_compatibility", "error_handling"]
    },
    {
      "file": "src/config/database.js",
      "reason": "User session storage modifications required", 
      "impact_level": "medium",
      "change_type": "config",
      "estimated_loc": 15,
      "complexity_factors": ["schema_migration", "indexing"]
    }
  ],
  
  "callers": [
    {
      "caller_file": "src/routes/api.js",
      "target_file": "src/middleware/auth.js",
      "function_name": "requireAuth",
      "call_pattern": "direct",
      "risk_level": "high",
      "usage_count": 12,
      "migration_required": true
    },
    {
      "caller_file": "src/components/LoginForm.jsx",
      "target_file": "src/api/auth.js", 
      "function_name": "login",
      "call_pattern": "direct",
      "risk_level": "medium",
      "usage_count": 3,
      "migration_required": true
    }
  ],
  
  "configs": [
    {
      "config_file": "package.json",
      "affected_keys": ["dependencies"],
      "change_required": "Add jsonwebtoken, bcrypt dependencies"
    },
    {
      "config_file": "src/config/env.js",
      "affected_keys": ["JWT_SECRET", "JWT_EXPIRY"],
      "change_required": "Add JWT configuration variables"
    }
  ],
  
  "crosscuts": [
    {
      "concern": "error_handling",
      "affected_files": ["src/api/auth.js", "src/middleware/auth.js", "src/routes/api.js"],
      "coordination_required": "Consistent JWT error responses across all auth endpoints"
    },
    {
      "concern": "logging",
      "affected_files": ["src/api/auth.js", "src/middleware/auth.js"],
      "coordination_required": "Security event logging for auth failures and token issues"
    }
  ],
  
  "testFocus": [
    {
      "test_file": "tests/api/auth.test.js",
      "test_category": "unit",
      "priority": "critical",
      "reason": "Core JWT functionality validation",
      "test_scenarios": ["token_generation", "token_validation", "token_expiry", "refresh_flow"]
    },
    {
      "test_file": "tests/integration/auth-flow.test.js", 
      "test_category": "integration",
      "priority": "high",
      "reason": "End-to-end authentication workflow testing",
      "test_scenarios": ["login_flow", "protected_routes", "token_refresh"]
    },
    {
      "test_file": "tests/security/auth-security.test.js",
      "test_category": "security",
      "priority": "critical", 
      "reason": "Security vulnerability testing",
      "test_scenarios": ["token_tampering", "replay_attacks", "timing_attacks"]
    }
  ],
  
  "riskAssessment": {
    "overall_risk": "high",
    "complexity_score": 8,
    "coordination_complexity": "high",
    "rollback_difficulty": "medium",
    "recommended_approach": "incremental",
    "risk_factors": [
      "Security-critical functionality",
      "Cross-cutting middleware changes", 
      "Database schema modifications",
      "Multiple API endpoint impacts"
    ],
    "mitigation_strategies": [
      "Implement behind feature flag",
      "Comprehensive security testing",
      "Gradual rollout with monitoring",
      "Maintain backward compatibility initially"
    ]
  },
  
  "implementationGuidance": {
    "suggested_sequence": [
      "1. Add dependencies and configuration",
      "2. Implement core JWT utilities (generation/validation)",
      "3. Update auth middleware with backward compatibility",
      "4. Modify API endpoints incrementally", 
      "5. Update frontend integration",
      "6. Comprehensive testing and security validation"
    ],
    "checkpoint_tests": [
      "JWT utilities unit tests pass",
      "Existing auth still works (backward compatibility)",
      "New JWT flow works for test user",
      "Security scan passes",
      "Integration tests pass"
    ],
    "estimated_effort": "32-48 hours",
    "team_coordination": [
      "Backend developer for JWT implementation",
      "Frontend developer for UI integration", 
      "DevOps for environment configuration",
      "Security reviewer for validation"
    ]
  }
}
```

### 5. Integration with SPEK Workflow

#### Task Planning Enhancement:
```javascript
function enhanceTasksWithImpactMap(planJson, impactMap) {
  return planJson.tasks.map(task => ({
    ...task,
    impact_hotspots: impactMap.hotspots.filter(h => 
      task.scope.toLowerCase().includes(h.file.split('/').pop().toLowerCase())
    ),
    risk_level: impactMap.riskAssessment.overall_risk,
    coordination_required: impactMap.crosscuts.length > 0,
    recommended_approach: impactMap.riskAssessment.recommended_approach
  }));
}
```

#### Quality Gate Adjustment:
```javascript
function adjustQualityGatesForRisk(impactMap) {
  const riskLevel = impactMap.riskAssessment.overall_risk;
  
  if (riskLevel === 'high') {
    return {
      additional_gates: ['security_scan', 'integration_test', 'load_test'],
      coverage_threshold: 95, // Increased from standard 80%
      review_required: ['security_expert', 'architecture_expert'],
      deployment_strategy: 'blue_green_with_canary'
    };
  }
  
  return null; // Use standard gates
}
```

## Integration Points

### Used by:
- `scripts/self_correct.sh` - For understanding change complexity
- `flow/workflows/spec-to-pr.yaml` - For risk-based planning
- `/fix:planned` command - For multi-file coordination
- CF v2 Alpha neural training - For impact prediction models

### Produces:
- `impact.json` - Comprehensive change-impact analysis
- Risk assessment and mitigation strategies
- Implementation sequence recommendations
- Test focus area identification

### Consumes:
- Codebase files (up to Gemini's context window limit)
- Target change description
- Project configuration files
- Existing test suite structure

## Examples

### Simple Feature Addition:
```json
{
  "overall_risk": "low",
  "complexity_score": 3,
  "hotspots": [{"file": "src/utils/helpers.js", "impact_level": "low"}],
  "recommended_approach": "big_bang"
}
```

### Complex Architectural Change:
```json
{
  "overall_risk": "high", 
  "complexity_score": 9,
  "crosscuts": [{"concern": "auth", "affected_files": 15}],
  "recommended_approach": "incremental",
  "estimated_effort": "80-120 hours"
}
```

### Cross-System Integration:
```json
{
  "coordination_complexity": "high",
  "configs": [{"config_file": "docker-compose.yml"}, {"config_file": "k8s/deployment.yaml"}],
  "rollback_difficulty": "high",
  "mitigation_strategies": ["feature_flag", "database_migration_rollback"]
}
```

## Error Handling

### Gemini CLI Failures:
- Timeout handling for large context analysis
- Fallback to smaller context windows if needed
- Graceful degradation to heuristic analysis
- Clear error messages for configuration issues

### Context Window Limits:
- Intelligent file prioritization (modified files first)
- Incremental analysis for very large codebases
- Warning when context is truncated
- Suggestion to focus on specific subsystems

### Invalid JSON Output:
- JSON parsing validation with helpful error messages
- Retry logic with refined prompts
- Fallback to structured text parsing
- Manual intervention guidance

## Performance Requirements

- Complete analysis within 5 minutes for large codebases
- Handle context windows up to Gemini's current limits
- Memory efficient file processing
- Progress indication for long-running analysis

This command leverages Gemini's massive context window to provide architectural-level impact analysis that would be impossible with smaller models, enabling confident large-scale changes.
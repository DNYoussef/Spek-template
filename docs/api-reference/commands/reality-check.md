# /reality:check Command - End-User Functionality Validation

## Purpose
Validate that claimed functionality actually works for end users by executing real user journeys, deployment paths, and integration scenarios within the SPEK quality framework.

## Usage
```bash
/reality:check [--scope <scope>] [--user-journey <journey>] [--deployment-validation] [--integration-tests] [--evidence-package]
```

## Implementation Strategy

### 1. End-User Journey Validation
Execute actual user workflows to verify claimed functionality:

```yaml
user_journey_validation:
  fresh_environment:
    - Clean machine deployment simulation
    - Dependency resolution testing
    - Configuration validation from scratch
    - Service startup verification
  
  core_workflows:
    - Tutorial step-by-step execution
    - Main feature functionality testing
    - User interaction flow validation
    - Error recovery scenario testing
  
  integration_scenarios:
    - Cross-service communication testing
    - Data persistence validation
    - API consistency verification  
    - Performance under real load
```

### 2. SPEK Quality Framework Integration
Leverage existing quality infrastructure for reality validation:

```yaml
quality_framework_integration:
  quality_gate_correlation:
    - Cross-reference user journey results with qa.json
    - Validate integration claims against connascence analysis
    - Verify security claims with actual penetration testing
    - Confirm performance claims with real usage metrics
  
  artifact_evidence:
    - Use existing quality artifacts as baseline truth
    - Compare reality testing results with quality gate claims
    - Identify gaps between quality metrics and user experience
    - Generate evidence package linking quality to usability
```

### 3. Reality Validation Engine
```python
class RealityValidator:
    def __init__(self, quality_context, deployment_context):
        self.quality_context = quality_context
        self.deployment_context = deployment_context
        self.validation_scenarios = self._load_scenarios()
    
    def execute_reality_check(self, scope="comprehensive"):
        """Execute comprehensive reality validation"""
        
        validation_results = {
            'deployment_reality': self._validate_deployment(),
            'functional_reality': self._validate_functionality(),
            'integration_reality': self._validate_integration(),
            'performance_reality': self._validate_performance(),
            'user_experience_reality': self._validate_user_experience()
        }
        
        # Cross-correlate with quality gate results
        quality_correlation = self._correlate_with_quality_gates(validation_results)
        
        # Generate reality vs claims analysis
        claims_analysis = self._analyze_reality_vs_claims(validation_results, quality_correlation)
        
        return {
            'validation_results': validation_results,
            'quality_correlation': quality_correlation,
            'reality_vs_claims': claims_analysis,
            'overall_reality_score': self._calculate_reality_score(validation_results)
        }
    
    def _validate_deployment(self):
        """Test actual deployment scenarios"""
        deployment_tests = [
            self._test_clean_environment_setup(),
            self._test_dependency_installation(), 
            self._test_configuration_validity(),
            self._test_service_startup(),
            self._test_connectivity()
        ]
        
        return {
            'tests_executed': len(deployment_tests),
            'success_count': sum(1 for test in deployment_tests if test['success']),
            'failure_details': [test for test in deployment_tests if not test['success']],
            'deployment_readiness_score': self._calculate_deployment_score(deployment_tests)
        }
    
    def _validate_functionality(self):
        """Test core functionality claims"""
        feature_tests = []
        
        # Load claimed features from quality context
        claimed_features = self._extract_feature_claims()
        
        for feature in claimed_features:
            test_result = self._execute_feature_test(feature)
            feature_tests.append({
                'feature': feature['name'],
                'claimed_status': feature['status'],
                'actual_functionality': test_result,
                'reality_match': test_result['success'] == (feature['status'] == 'complete')
            })
        
        return {
            'features_tested': len(feature_tests),
            'reality_matches': sum(1 for test in feature_tests if test['reality_match']),
            'functionality_gap': [test for test in feature_tests if not test['reality_match']],
            'functional_reality_score': self._calculate_functional_score(feature_tests)
        }
```

### 4. User Journey Execution
```yaml
user_journey_scenarios:
  new_user_onboarding:
    steps:
      - "Download/clone repository"
      - "Follow README installation instructions"
      - "Complete getting started tutorial"  
      - "Execute first user workflow"
    validation:
      - "Each step completes without errors"
      - "Instructions are accurate and complete"
      - "Dependencies are available and installable"
      - "User can achieve intended outcome"
  
  core_functionality_flow:
    steps:
      - "User authentication/login"
      - "Main feature usage"
      - "Data input/processing" 
      - "Output generation/export"
    validation:
      - "Authentication works as documented"
      - "Features perform as claimed"
      - "Data processing produces expected results"
      - "Output formats are usable"
  
  integration_workflows:
    steps:
      - "Multi-service interaction"
      - "Data persistence validation"
      - "API integration testing"
      - "Error handling verification" 
    validation:
      - "Services communicate correctly"
      - "Data persists across sessions"
      - "APIs respond consistently" 
      - "Errors are handled gracefully"
```

## Command Implementation

### Core Execution Flow
```yaml
execution_phases:
  environment_preparation:
    - Initialize clean test environment
    - Load deployment configuration
    - Prepare user journey test scenarios
    - Initialize quality context for correlation
  
  reality_validation:
    - Execute deployment reality tests
    - Run functional reality validation  
    - Test integration reality scenarios
    - Validate user experience claims
  
  quality_correlation:
    - Cross-reference results with quality gates
    - Analyze gaps between quality metrics and reality
    - Generate reality vs claims analysis
    - Identify false positive quality gates
  
  evidence_compilation:
    - Compile comprehensive reality evidence package
    - Generate actionable recommendations
    - Update memory bridge with reality patterns
    - Create detailed reality validation report
```

### Deployment Reality Testing
```python
def test_deployment_reality():
    """Test actual deployment scenarios in clean environment"""
    
    deployment_results = {
        'clean_install': False,
        'dependency_resolution': False,
        'configuration_validity': False,
        'service_startup': False,
        'basic_functionality': False
    }
    
    try:
        # Test clean environment setup
        if execute_clean_setup():
            deployment_results['clean_install'] = True
            
            # Test dependency installation
            if install_dependencies():
                deployment_results['dependency_resolution'] = True
                
                # Test configuration
                if validate_configuration():
                    deployment_results['configuration_validity'] = True
                    
                    # Test service startup
                    if start_services():
                        deployment_results['service_startup'] = True
                        
                        # Test basic functionality
                        if test_basic_features():
                            deployment_results['basic_functionality'] = True
    
    except Exception as e:
        deployment_results['error'] = str(e)
    
    return {
        'deployment_success_rate': calculate_success_rate(deployment_results),
        'blocking_issues': identify_blocking_issues(deployment_results),
        'deployment_evidence': compile_deployment_evidence(deployment_results)
    }
```

## Output Specifications

### Reality Check Report
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "command": "reality-check", 
  "validation_scope": "comprehensive",
  "session": "reality-check-20240908-121500",
  
  "deployment_reality": {
    "clean_environment_success": false,
    "blocking_issue": "Missing dependency: python-dev package",
    "setup_success_rate": 0.60,
    "deployment_evidence": {
      "setup_logs": "Installation failed at step 3",
      "missing_dependencies": ["python-dev", "build-essential"],
      "configuration_errors": 2
    }
  },
  
  "functional_reality": {
    "claimed_features_tested": 8,
    "actually_working_features": 5,
    "functionality_gap": [
      {
        "feature": "Password reset",
        "claimed": "complete",
        "reality": "endpoint returns 500 error",
        "user_impact": "Users cannot recover forgotten passwords"
      },
      {
        "feature": "Data export", 
        "claimed": "CSV and JSON formats supported",
        "reality": "CSV export corrupts special characters",
        "user_impact": "Data integrity issues in exports"
      }
    ],
    "functional_reality_score": 0.62
  },
  
  "user_journey_validation": {
    "new_user_onboarding": {
      "success": false,
      "failure_point": "Tutorial step 3",
      "issue": "Command 'npm run setup' not found",
      "time_to_failure": "4 minutes"
    },
    "core_workflow_execution": {
      "success": true,
      "completion_time": "12 minutes",
      "user_friction_points": 2,
      "overall_experience": "acceptable_with_workarounds"
    }
  },
  
  "integration_reality": {
    "api_consistency": "good",
    "cross_service_communication": "partial_failure",
    "data_persistence": "working",
    "error_handling": "inadequate",
    "integration_evidence": {
      "failed_endpoints": ["/api/auth/reset", "/api/export/csv"],
      "timeout_services": ["notification-service"],
      "data_consistency_issues": 1
    }
  },
  
  "quality_vs_reality_correlation": {
    "quality_gates_claiming_success": 8,
    "reality_validating_success": 5,
    "false_positive_rate": 0.375,
    "quality_reality_gap": [
      {
        "quality_claim": "All integration tests passing",
        "reality": "Password reset integration broken", 
        "explanation": "Tests mock the failing service"
      },
      {
        "quality_claim": "100% API endpoint coverage",
        "reality": "CSV export endpoint corrupts data",
        "explanation": "Tests don't validate actual data integrity"
      }
    ]
  },
  
  "overall_reality_assessment": {
    "reality_score": 0.64,
    "deployment_readiness": "not_ready",
    "user_experience_quality": "poor_to_fair",
    "production_readiness": "blocked",
    "critical_blockers": [
      "Tutorial installation fails - users cannot get started",
      "Password reset broken - security functionality incomplete", 
      "Data export corrupts content - data integrity compromised"
    ]
  },
  
  "recommendations": [
    {
      "priority": "critical",
      "issue": "Tutorial installation failure", 
      "action": "Fix npm run setup command and update README",
      "validation": "Fresh user can complete tutorial end-to-end"
    },
    {
      "priority": "critical",
      "issue": "Password reset endpoint failure",
      "action": "Debug and fix /api/auth/reset endpoint",
      "validation": "Password reset flow works in browser"
    },
    {
      "priority": "high", 
      "issue": "CSV export data corruption",
      "action": "Fix character encoding in CSV export",
      "validation": "Export preserves special characters correctly"
    }
  ],
  
  "evidence_package": {
    "deployment_logs": ".claude/.artifacts/deployment_test.log",
    "user_journey_recordings": ".claude/.artifacts/user_journey_evidence/",
    "api_test_results": ".claude/.artifacts/api_validation.json",
    "functional_test_evidence": ".claude/.artifacts/functional_validation/",
    "quality_correlation_analysis": ".claude/.artifacts/quality_vs_reality.json"
  }
}
```

## Integration Points

### SPEK Quality Framework Integration
```yaml
quality_integration:
  qa_correlation:
    - Cross-reference user journey results with qa.json
    - Identify tests claiming success but reality failing
    - Validate coverage claims against actual functionality
  
  connascence_correlation:
    - Test architectural claims with real integration scenarios
    - Validate coupling improvements with cross-service testing
    - Verify god object refactoring with actual usage patterns
  
  security_correlation: 
    - Test security claims with actual vulnerability exploitation
    - Validate resolved findings with penetration testing
    - Verify security configurations with real attack scenarios
  
  performance_correlation:
    - Test performance claims with realistic load scenarios
    - Validate optimization claims with actual usage patterns
    - Verify scalability claims with progressive load testing
```

### Memory Bridge Integration
```bash
# Store reality validation patterns for future correlation
scripts/memory_bridge.sh store "intelligence/reality" "validation_patterns" "$reality_results" '{"type": "reality_validation"}'

# Store quality vs reality correlation data for gap analysis
scripts/memory_bridge.sh store "intelligence/quality_gaps" "correlations" "$quality_correlation" '{"type": "reality_correlation"}'

# Update reality validation models with new findings
scripts/memory_bridge.sh store "models/reality" "validation_confidence" "$confidence_data" '{"type": "reality_learning"}'
```

## Success Metrics

### Reality Validation Effectiveness
- **Reality Match Rate**: % of quality claims that match actual user experience
- **User Journey Success Rate**: % of user workflows that complete successfully  
- **Deployment Reality Score**: % of deployment claims that work in clean environments
- **Integration Reality Score**: % of integration claims that work end-to-end

### Quality vs Reality Correlation
- **False Positive Detection**: % of quality gates claiming success but reality failing
- **Quality Gap Identification**: Quality metrics gaps impacting user experience
- **Reality-Based Quality Improvement**: Quality gate enhancements based on reality testing
- **User Experience Prediction**: Ability to predict UX issues from quality metrics

This reality-check command ensures that your SPEK quality framework is grounded in actual user experience, preventing the gap between quality metrics and real-world usability.
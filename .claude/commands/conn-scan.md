# /conn:scan

## Purpose
Execute connascence analysis to assess structural coupling and code quality using NASA POT10 compliance metrics. Identifies high-connascence areas, duplication patterns, and architectural debt to guide refactoring priorities and maintain clean architecture principles.

## Usage
/conn:scan [scope=changed|full] [compliance_target=90]

## Implementation

### 1. Connascence Analysis Framework

#### Core Connascence Types Detection:
```python
# Python-based connascence analyzer implementation
class ConnascenceAnalyzer:
    def __init__(self, target_directory='.', scope='full'):
        self.target_directory = target_directory
        self.scope = scope
        self.connascence_types = {
            'CoN': 'Connascence of Name',        # Shared naming
            'CoT': 'Connascence of Type',        # Shared data types
            'CoV': 'Connascence of Value',       # Shared values/constants
            'CoP': 'Connascence of Position',    # Parameter ordering
            'CoM': 'Connascence of Meaning',     # Implicit agreements
            'CoA': 'Connascence of Algorithm',   # Shared algorithms
            'CoTi': 'Connascence of Timing',     # Temporal dependencies
            'CoI': 'Connascence of Identity'     # Shared identity/reference
        }
    
    def analyze_project(self):
        """Main analysis entry point"""
        files = self._discover_source_files()
        
        results = {
            'connascence_by_type': {},
            'connascence_by_file': {},
            'high_connascence_areas': [],
            'duplication_analysis': {},
            'nasa_pot10_score': 0,
            'architectural_debt': {}
        }
        
        # Analyze each connascence type
        for conn_type, description in self.connascence_types.items():
            results['connascence_by_type'][conn_type] = self._analyze_connascence_type(
                files, conn_type
            )
        
        # Calculate metrics
        results['nasa_pot10_score'] = self._calculate_nasa_pot10_score(results)
        results['duplication_analysis'] = self._analyze_duplication(files)
        results['architectural_debt'] = self._calculate_architectural_debt(results)
        
        return results

    def _analyze_connascence_type(self, files, conn_type):
        """Analyze specific connascence type across files"""
        if conn_type == 'CoN':
            return self._analyze_name_connascence(files)
        elif conn_type == 'CoT':
            return self._analyze_type_connascence(files)
        elif conn_type == 'CoV':
            return self._analyze_value_connascence(files)
        # ... other types
```

#### Name Connascence (CoN) Analysis:
```python
def _analyze_name_connascence(self, files):
    """Detect shared naming dependencies"""
    name_usage = {}
    connascence_instances = []
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract function names, variables, imports
            names = self._extract_names(content, file_path)
            
            for name in names:
                if name not in name_usage:
                    name_usage[name] = []
                name_usage[name].append({
                    'file': file_path,
                    'line': names[name]['line'],
                    'context': names[name]['context']
                })
        
        except Exception as e:
            continue
    
    # Find high-connascence names (used in multiple files)
    for name, usages in name_usage.items():
        if len(usages) > 2:  # Used in more than 2 files
            connascence_instances.append({
                'name': name,
                'usage_count': len(usages),
                'files': [u['file'] for u in usages],
                'severity': self._classify_name_connascence_severity(name, usages),
                'recommendations': self._generate_name_connascence_fixes(name, usages)
            })
    
    return {
        'instances': connascence_instances,
        'total_high_connascence_names': len([i for i in connascence_instances if i['severity'] == 'high']),
        'average_coupling': sum([i['usage_count'] for i in connascence_instances]) / max(len(connascence_instances), 1)
    }
```

#### Duplication Analysis:
```python
def _analyze_duplication(self, files):
    """Detect code duplication patterns"""
    duplication_results = {
        'exact_duplicates': [],
        'similar_blocks': [],
        'duplication_score': 0,
        'hotspot_files': []
    }
    
    # Use AST-based similarity detection
    for i, file1 in enumerate(files):
        for j, file2 in enumerate(files[i+1:], i+1):
            similarity = self._calculate_file_similarity(file1, file2)
            
            if similarity > 0.8:  # High similarity threshold
                duplication_results['exact_duplicates'].append({
                    'file1': file1,
                    'file2': file2,
                    'similarity_score': similarity,
                    'estimated_duplicate_lines': self._estimate_duplicate_lines(file1, file2)
                })
    
    # Calculate overall duplication score
    total_lines = sum([self._count_lines(f) for f in files])
    duplicate_lines = sum([d['estimated_duplicate_lines'] for d in duplication_results['exact_duplicates']])
    
    duplication_results['duplication_score'] = max(0, (total_lines - duplicate_lines) / total_lines)
    
    return duplication_results
```

### 2. NASA POT10 Compliance Calculation

#### POT10 Metrics Framework:
```python
def _calculate_nasa_pot10_score(self, analysis_results):
    """Calculate NASA Program On a Tear (POT10) compliance score"""
    
    # POT10 focuses on 10 key quality metrics
    metrics = {
        'name_consistency': 0,      # CoN management
        'type_safety': 0,           # CoT management  
        'value_coupling': 0,        # CoV management
        'interface_clarity': 0,     # CoP management
        'semantic_coupling': 0,     # CoM management
        'algorithmic_coupling': 0,  # CoA management
        'temporal_coupling': 0,     # CoTi management
        'identity_coupling': 0,     # CoI management
        'duplication_control': 0,   # Overall duplication
        'architectural_integrity': 0 # Overall structure
    }
    
    # Calculate each metric (0-100 scale)
    conn_results = analysis_results['connascence_by_type']
    
    # Name consistency (inverse of high CoN instances)
    high_con_names = conn_results.get('CoN', {}).get('total_high_connascence_names', 0)
    metrics['name_consistency'] = max(0, 100 - (high_con_names * 10))
    
    # Type safety (inverse of CoT violations)
    type_violations = len(conn_results.get('CoT', {}).get('instances', []))
    metrics['type_safety'] = max(0, 100 - (type_violations * 15))
    
    # Duplication control
    duplication_score = analysis_results['duplication_analysis']['duplication_score']
    metrics['duplication_control'] = duplication_score * 100
    
    # Calculate weighted POT10 score
    weights = {
        'name_consistency': 0.15,
        'type_safety': 0.15,
        'value_coupling': 0.10,
        'interface_clarity': 0.10,
        'semantic_coupling': 0.10,
        'algorithmic_coupling': 0.05,
        'temporal_coupling': 0.05,
        'identity_coupling': 0.05,
        'duplication_control': 0.15,
        'architectural_integrity': 0.10
    }
    
    weighted_score = sum(metrics[metric] * weights[metric] for metric in metrics)
    
    return {
        'overall_score': round(weighted_score, 1),
        'individual_metrics': metrics,
        'compliance_level': _classify_pot10_compliance(weighted_score),
        'improvement_priorities': _identify_pot10_priorities(metrics)
    }

def _classify_pot10_compliance(score):
    """Classify POT10 compliance level"""
    if score >= 95:
        return 'excellent'
    elif score >= 90:
        return 'good'
    elif score >= 80:
        return 'acceptable'
    elif score >= 70:
        return 'needs_improvement'
    else:
        return 'critical'
```

### 3. Architectural Debt Assessment

#### Debt Calculation and Prioritization:
```python
def _calculate_architectural_debt(self, analysis_results):
    """Calculate technical debt based on connascence analysis"""
    
    debt_factors = {
        'high_connascence_modules': [],
        'duplication_debt': 0,
        'coupling_debt': 0,
        'complexity_debt': 0,
        'total_debt_hours': 0
    }
    
    # Identify high-connascence modules
    for conn_type, data in analysis_results['connascence_by_type'].items():
        for instance in data.get('instances', []):
            if instance['severity'] == 'high':
                debt_factors['high_connascence_modules'].append({
                    'type': conn_type,
                    'description': instance.get('description', ''),
                    'files': instance['files'],
                    'estimated_fix_hours': _estimate_connascence_fix_time(instance)
                })
    
    # Calculate duplication debt
    duplication_score = analysis_results['duplication_analysis']['duplication_score']
    if duplication_score < 0.8:  # Below acceptable threshold
        debt_factors['duplication_debt'] = (0.8 - duplication_score) * 40  # Hours
    
    # Calculate coupling debt
    total_coupling_instances = sum(
        len(data.get('instances', []))
        for data in analysis_results['connascence_by_type'].values()
    )
    debt_factors['coupling_debt'] = total_coupling_instances * 2  # 2 hours per instance
    
    # Total debt calculation
    debt_factors['total_debt_hours'] = (
        debt_factors['duplication_debt'] +
        debt_factors['coupling_debt'] +
        sum(module['estimated_fix_hours'] for module in debt_factors['high_connascence_modules'])
    )
    
    return debt_factors
```

### 4. Executable Analysis Script

#### Command Line Interface:
```bash
#!/bin/bash
# Connascence scan execution script

run_connascence_analysis() {
    local scope="$1"
    local compliance_target="${2:-90}"
    local output_dir=".claude/.artifacts"
    
    echo "🔗 Starting connascence analysis (scope: $scope, target: $compliance_target%)"
    
    # Create output directory
    mkdir -p "$output_dir"
    
    # Determine scan scope
    if [[ "$scope" == "changed" ]]; then
        # Analyze only changed files
        local changed_files=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(js|ts|jsx|tsx|py|java|go|rs)$' | tr '\n' ' ')
        if [[ -n "$changed_files" ]]; then
            python3 analyzer/connascence_analyzer.py --scope changed --files "$changed_files" --output "$output_dir/connascence.json"
        else
            echo "No changed files to analyze"
            return 0
        fi
    else
        # Full project analysis
        python3 analyzer/connascence_analyzer.py --scope full --target . --output "$output_dir/connascence.json"
    fi
    
    # Check exit code
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        echo "✅ Connascence analysis completed successfully"
        
        # Generate summary report
        python3 analyzer/generate_connascence_report.py --input "$output_dir/connascence.json" --compliance-target "$compliance_target"
    else
        echo "❌ Connascence analysis failed with exit code: $exit_code"
    fi
    
    return $exit_code
}
```

### 5. Comprehensive Analysis Results

Generate detailed connascence.json:

```json
{
  "timestamp": "2024-09-08T14:15:00Z",
  "scan_id": "conn-scan-1709904900",
  "scan_scope": "full",
  "compliance_target": 90,
  
  "execution": {
    "duration_seconds": 67,
    "analyzer_version": "2.1.0",
    "files_analyzed": 145,
    "total_lines_analyzed": 15847
  },
  
  "connascence_by_type": {
    "CoN": {
      "instances": [
        {
          "name": "validateUser",
          "usage_count": 5,
          "files": ["src/auth.js", "src/middleware/auth.js", "src/routes/user.js", "tests/auth.test.js", "tests/integration/login.test.js"],
          "severity": "medium",
          "recommendations": ["Consider extracting to shared utility module", "Document interface contract"]
        },
        {
          "name": "API_BASE_URL", 
          "usage_count": 8,
          "files": ["src/config/api.js", "src/services/user.js", "src/services/auth.js"],
          "severity": "low",
          "recommendations": ["Good use of named constant - no action needed"]
        }
      ],
      "total_high_connascence_names": 1,
      "average_coupling": 6.5
    },
    
    "CoT": {
      "instances": [
        {
          "type_name": "UserProfile",
          "usage_count": 4,
          "files": ["src/types/user.ts", "src/components/Profile.tsx", "src/services/user.ts"],
          "severity": "low",
          "recommendations": ["Well-defined type interface - good practice"]
        }
      ],
      "total_high_connascence_types": 0,
      "average_coupling": 4.0
    },
    
    "CoV": {
      "instances": [
        {
          "value": "admin",
          "usage_count": 6,
          "files": ["src/auth.js", "src/middleware/rbac.js", "src/routes/admin.js"],
          "severity": "high", 
          "recommendations": ["Extract to enum or constants file", "Consider role-based system instead of hardcoded strings"]
        }
      ],
      "total_high_connascence_values": 1,
      "average_coupling": 6.0
    }
  },
  
  "duplication_analysis": {
    "exact_duplicates": [
      {
        "file1": "src/utils/validation.js",
        "file2": "src/utils/validation-helpers.js", 
        "similarity_score": 0.85,
        "estimated_duplicate_lines": 23
      }
    ],
    "similar_blocks": [
      {
        "files": ["src/services/user.js", "src/services/auth.js"],
        "similarity_score": 0.72,
        "duplicate_function": "handleApiError",
        "lines": 15
      }
    ],
    "duplication_score": 0.76,
    "hotspot_files": [
      {"file": "src/utils/validation.js", "duplication_percentage": 45}
    ]
  },
  
  "nasa_pot10_compliance": {
    "overall_score": 82.4,
    "compliance_level": "acceptable",
    "individual_metrics": {
      "name_consistency": 85,
      "type_safety": 90,
      "value_coupling": 65,
      "interface_clarity": 88,
      "semantic_coupling": 82,
      "algorithmic_coupling": 90,
      "temporal_coupling": 95,
      "identity_coupling": 87,
      "duplication_control": 76,
      "architectural_integrity": 85
    },
    "improvement_priorities": [
      {
        "metric": "value_coupling",
        "current_score": 65,
        "target_improvement": "+20 points",
        "recommended_actions": ["Extract hardcoded values to constants", "Implement configuration management"]
      },
      {
        "metric": "duplication_control", 
        "current_score": 76,
        "target_improvement": "+14 points",
        "recommended_actions": ["Refactor duplicate validation functions", "Extract common utilities"]
      }
    ]
  },
  
  "architectural_debt": {
    "high_connascence_modules": [
      {
        "type": "CoV",
        "description": "Hardcoded role strings across authentication system",
        "files": ["src/auth.js", "src/middleware/rbac.js", "src/routes/admin.js"],
        "estimated_fix_hours": 4
      }
    ],
    "duplication_debt": 9.6,
    "coupling_debt": 14,
    "total_debt_hours": 27.6,
    "debt_categories": {
      "high_priority": 4,
      "medium_priority": 14,
      "low_priority": 9.6
    }
  },
  
  "recommendations": {
    "immediate_actions": [
      "Extract hardcoded 'admin' role to constants file",
      "Refactor duplicate validation functions into shared utility",
      "Create enum for user roles instead of string literals"
    ],
    "architectural_improvements": [
      "Implement role-based access control (RBAC) system",
      "Create shared validation utility library",
      "Establish naming conventions for cross-module interfaces"
    ],
    "refactoring_priorities": [
      {
        "priority": "high",
        "area": "Authentication system value coupling", 
        "effort": "4 hours",
        "impact": "Reduces coupling, improves maintainability"
      },
      {
        "priority": "medium",
        "area": "Validation function duplication",
        "effort": "6 hours", 
        "impact": "Reduces code duplication by 45%"
      }
    ],
    "next_analysis": "After addressing high-priority connascence issues",
    "target_compliance": "Aim for 90% POT10 compliance"
  },
  
  "trend_analysis": {
    "compared_to_previous": {
      "pot10_score_change": "+2.4",
      "duplication_score_change": "-0.05",
      "high_connascence_change": "+1"
    },
    "compliance_trajectory": "improving",
    "estimated_time_to_target": "2-3 development cycles"
  }
}
```

### 6. Integration with Quality Gates

#### CTQ Threshold Evaluation:
```javascript
function evaluateConnascenceCTQ(connascenceResults, complianceTarget = 90) {
  const thresholds = {
    nasa_pot10_score: { min: complianceTarget, critical: true },
    duplication_score: { min: 0.75, critical: false },
    high_connascence_modules: { max: 3, critical: false },
    total_debt_hours: { max: 40, critical: false }
  };
  
  const evaluation = {
    overall_pass: true,
    gate_results: {},
    blocking_issues: [],
    warnings: []
  };
  
  // Evaluate NASA POT10 compliance
  const pot10Score = connascenceResults.nasa_pot10_compliance.overall_score;
  evaluation.gate_results.pot10_compliance = {
    score: pot10Score,
    threshold: complianceTarget,
    passed: pot10Score >= complianceTarget,
    critical: true
  };
  
  if (pot10Score < complianceTarget) {
    evaluation.overall_pass = false;
    evaluation.blocking_issues.push({
      type: 'pot10_compliance',
      current: pot10Score,
      required: complianceTarget,
      gap: complianceTarget - pot10Score
    });
  }
  
  // Evaluate duplication score
  const dupScore = connascenceResults.duplication_analysis.duplication_score;
  evaluation.gate_results.duplication = {
    score: dupScore,
    threshold: thresholds.duplication_score.min,
    passed: dupScore >= thresholds.duplication_score.min,
    critical: false
  };
  
  if (dupScore < thresholds.duplication_score.min) {
    evaluation.warnings.push({
      type: 'duplication_warning',
      message: `Duplication score ${dupScore} below recommended ${thresholds.duplication_score.min}`
    });
  }
  
  return evaluation;
}
```

## Integration Points

### Used by:
- `/qa:run` command - As part of comprehensive quality analysis
- `scripts/self_correct.sh` - For architectural debt guidance
- `flow/workflows/spec-to-pr.yaml` - For code quality validation
- CF v2 Alpha - For architectural pattern learning

### Produces:
- `connascence.json` - Comprehensive connascence analysis
- NASA POT10 compliance metrics
- Architectural debt assessment
- Refactoring priority recommendations

### Consumes:
- Project source code files
- Historical connascence data for trend analysis
- NASA POT10 compliance target configurations
- Code structure and dependency information

## Examples

### High Compliance Result:
```json
{
  "nasa_pot10_compliance": {"overall_score": 94.2, "compliance_level": "excellent"},
  "architectural_debt": {"total_debt_hours": 12.3},
  "recommendations": {"immediate_actions": [], "next_analysis": "Maintaining excellent quality"}
}
```

### Quality Issues Detected:
```json
{
  "nasa_pot10_compliance": {"overall_score": 73.8, "compliance_level": "needs_improvement"},
  "architectural_debt": {"total_debt_hours": 45.2, "high_priority": 18},
  "recommendations": {"immediate_actions": ["Fix high coupling in auth system", "Reduce code duplication"]}
}
```

### Changed Files Analysis:
```json
{
  "scan_scope": "changed",
  "execution": {"files_analyzed": 5, "duration_seconds": 12},
  "impact_on_compliance": {"score_change": "-1.2", "new_debt_hours": 3.5}
}
```

## Error Handling

### Analysis Execution Failures:
- Graceful handling of unsupported file types
- Recovery from parsing errors in individual files
- Progress indication for large codebase analysis
- Fallback metrics when full analysis fails

### Compliance Calculation Issues:
- Default scoring when metrics cannot be calculated
- Warning when insufficient data for trend analysis
- Validation of compliance target reasonableness
- Clear reporting of analysis limitations

## Performance Requirements

- Complete analysis within 5 minutes for large codebases
- Efficient processing of changed files only mode
- Memory usage under 256MB during analysis
- Incremental analysis capabilities for CI/CD integration

This command provides comprehensive connascence analysis aligned with NASA POT10 quality standards, enabling architectural quality assessment and technical debt management within the SPEK-AUGMENT framework.
# Analysis Result Format Specification

This document specifies the format for all analysis results returned by the GitHub hooks infrastructure, ensuring compatibility with quality gates and CI/CD pipelines.

## Architecture Analysis Result

The `analyze_architecture()` method returns a JSON-serializable dictionary with the following structure:

```json
{
  "system_overview": {
    "architectural_health": 0.75,
    "coupling_score": 0.45,
    "complexity_score": 0.55,
    "maintainability_index": 0.65
  },
  "hotspots": [
    {
      "component": "UserController",
      "file": "src/controllers/UserController.py",
      "issue": "High coupling detected: 8 violations",
      "coupling_score": 0.8,
      "complexity": 8,
      "recommendation": "Consider refactoring to reduce connascence violations",
      "line": 1
    }
  ],
  "recommendations": [
    "Consider refactoring high-coupling components",
    "Implement interface segregation for large classes"
  ],
  "metrics": {
    "total_components": 45,
    "high_coupling_components": 3,
    "god_objects_detected": 2
  },
  "architectural_health": 0.75
}
```

### Field Specifications

#### system_overview
- **architectural_health**: `float` (0.0-1.0) - Overall architectural quality score
- **coupling_score**: `float` (0.0-1.0) - Coupling level (higher is worse)
- **complexity_score**: `float` (0.0-1.0) - System complexity level
- **maintainability_index**: `float` (0.0-1.0) - Composite maintainability score

#### hotspots
Array of architectural hotspot objects:
- **component**: `string` - Name of the component
- **file**: `string` - File path of the component
- **issue**: `string` - Description of the issue
- **coupling_score**: `float` (0.0-1.0) - Coupling level for this component
- **complexity**: `number` - Complexity metric (typically violation count)
- **recommendation**: `string` - Specific recommendation for this hotspot
- **line**: `number` - Line number where the issue occurs

#### recommendations
Array of `string` recommendations for improving the architecture.

#### metrics
- **total_components**: `number` - Total number of components analyzed
- **high_coupling_components**: `number` - Number of components with high coupling
- **god_objects_detected**: `number` - Number of god objects found

#### architectural_health
Duplicate of `system_overview.architectural_health` for backward compatibility.

## Error Handling

In case of errors, the result includes additional fields:

```json
{
  "system_overview": {
    "architectural_health": 0.75,
    "coupling_score": 0.45,
    "complexity_score": 0.55,
    "maintainability_index": 0.65
  },
  "hotspots": [],
  "recommendations": [
    "Analysis failed: Path does not exist",
    "Unable to provide specific recommendations",
    "Consider running analysis manually for detailed results"
  ],
  "metrics": {
    "total_components": 1,
    "high_coupling_components": 0,
    "god_objects_detected": 0
  },
  "architectural_health": 0.75,
  "error": "Path does not exist",
  "fallback_mode": true
}
```

### Error Fields
- **error**: `string` - Description of the error that occurred
- **fallback_mode**: `boolean` - Indicates if fallback values were used

## GitHub Workflow Integration

The GitHub workflow expects this exact format when calling:

```python
from analyzer.architecture.orchestrator import ArchitectureOrchestrator

arch_orchestrator = ArchitectureOrchestrator()
arch_result = arch_orchestrator.analyze_architecture('.')
```

### Quality Gates Integration

The result is used by quality gates as follows:

```python
# Extract architectural metrics
arch_overview = architecture.get('system_overview', {})
architecture_health = arch_overview.get('architectural_health', 0.0)
coupling_score = arch_overview.get('coupling_score', 1.0)
complexity_score = arch_overview.get('complexity_score', 0.0)
maintainability_index = arch_overview.get('maintainability_index', 0.0)
hotspot_count = len(architecture.get('hotspots', []))

# Apply quality gates
quality_gates = {
    'architecture_health': architecture_health >= 0.75,
    'coupling_quality': coupling_score <= 0.5,
    'architecture_hotspots': hotspot_count <= 5,
    'maintainability': maintainability_index >= 0.70
}
```

### SARIF Integration

Architecture hotspots are converted to SARIF findings:

```python
for hotspot in architecture.get('hotspots', []):
    result = {
        "ruleId": "ARCH_HOTSPOT",
        "level": "warning",
        "message": {
            "text": f"Architecture hotspot: {hotspot.get('component', 'Unknown')} - {hotspot.get('issue', 'High coupling detected')}",
            "markdown": f"**Architecture Hotspot**: `{hotspot.get('component', 'Unknown')}` - {hotspot.get('issue', 'High coupling detected')}"
        },
        "locations": [{
            "physicalLocation": {
                "artifactLocation": {"uri": hotspot.get('file', 'unknown')},
                "region": {"startLine": hotspot.get('line', 1)}
            }
        }],
        "properties": {
            "coupling_score": hotspot.get('coupling_score', 0),
            "complexity": hotspot.get('complexity', 0),
            "recommendation": hotspot.get('recommendation', 'Consider refactoring')
        }
    }
```

## Validation

All analysis results must:

1. Be JSON-serializable using `json.dumps(result, default=str)`
2. Contain all required top-level keys: `system_overview`, `hotspots`, `recommendations`, `metrics`, `architectural_health`
3. Have numeric values in appropriate ranges (0.0-1.0 for scores)
4. Include meaningful recommendations even in error cases

## Implementation Notes

- The analysis gracefully handles missing components by using fallback values
- Results are cached for 5 minutes to improve performance
- All exceptions are caught and converted to fallback results
- The system prioritizes stability over completeness (better to return partial results than crash)

## Example Usage

```python
# Basic usage
orchestrator = ArchitectureOrchestrator()
result = orchestrator.analyze_architecture('.')

# Validation
assert isinstance(result, dict)
assert 'system_overview' in result
assert 'architectural_health' in result['system_overview']

# JSON serialization for CI/CD
import json
json_output = json.dumps(result, indent=2, default=str)
```

This format ensures consistent integration with GitHub workflows, quality gates, and SARIF reporting systems.
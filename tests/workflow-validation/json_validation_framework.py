#!/usr/bin/env python3
"""
JSON Output Structure Validation Framework

Validates the expected JSON output structure from all GitHub workflows
to ensure consistent artifacts, proper schema compliance, and cross-workflow compatibility.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import json
import re

from dataclasses import dataclass
import jsonschema

@dataclass
class JsonSchema:
    """JSON schema definition for workflow artifacts"""
    name: str
    schema: Dict[str, Any]
    required_fields: List[str]
    optional_fields: List[str]
    description: str

class JsonValidationFramework:
    """Framework for validating JSON outputs from GitHub workflows"""
    
    def __init__(self, repo_root: str):
        self.repo_root = Path(repo_root)
        self.artifacts_dir = self.repo_root / '.claude' / '.artifacts'
        self.schemas = self.define_schemas()
        
    def define_schemas(self) -> Dict[str, JsonSchema]:
        """Define expected JSON schemas for each workflow output"""
        schemas = {}
        
        # Architecture Analysis Schema
        schemas['architecture_analysis'] = JsonSchema(
            name="architecture_analysis.json",
            schema={
                "type": "object",
                "required": ["timestamp", "system_overview", "metrics"],
                "properties": {
                    "timestamp": {"type": "string", "format": "date-time"},
                    "system_overview": {
                        "type": "object",
                        "required": ["architectural_health", "coupling_score", "complexity_score"],
                        "properties": {
                            "architectural_health": {"type": "number", "minimum": 0, "maximum": 1},
                            "coupling_score": {"type": "number", "minimum": 0, "maximum": 1},
                            "complexity_score": {"type": "number", "minimum": 0, "maximum": 1},
                            "maintainability_index": {"type": "number", "minimum": 0}
                        }
                    },
                    "metrics": {
                        "type": "object",
                        "required": ["total_components"],
                        "properties": {
                            "total_components": {"type": "integer", "minimum": 0},
                            "high_coupling_components": {"type": "integer", "minimum": 0},
                            "god_objects_detected": {"type": "integer", "minimum": 0}
                        }
                    },
                    "architectural_hotspots": {"type": "array"},
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "fallback": {"type": "boolean"}
                }
            },
            required_fields=["timestamp", "system_overview", "metrics"],
            optional_fields=["architectural_hotspots", "recommendations", "fallback"],
            description="Architecture analysis results with health metrics and hotspots"
        )
        
        # Connascence Analysis Schema
        schemas['connascence_full'] = JsonSchema(
            name="connascence_full.json",
            schema={
                "type": "object",
                "required": ["violations", "summary", "nasa_compliance"],
                "properties": {
                    "violations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["type", "severity", "description"],
                            "properties": {
                                "type": {"type": "string", "enum": ["CoA", "CoC", "CoE", "CoT", "CoM", "CoP", "CoV", "CoI", "CoN"]},
                                "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                                "description": {"type": "string"},
                                "file_path": {"type": "string"},
                                "line_number": {"type": "integer", "minimum": 1}
                            }
                        }
                    },
                    "summary": {
                        "type": "object",
                        "required": ["total_violations", "overall_quality_score"],
                        "properties": {
                            "total_violations": {"type": "integer", "minimum": 0},
                            "critical_violations": {"type": "integer", "minimum": 0},
                            "high_violations": {"type": "integer", "minimum": 0},
                            "overall_quality_score": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    },
                    "nasa_compliance": {
                        "type": "object",
                        "required": ["score"],
                        "properties": {
                            "score": {"type": "number", "minimum": 0, "maximum": 1},
                            "violations": {"type": "array"},
                            "reason": {"type": "string"}
                        }
                    },
                    "god_objects": {"type": "array"},
                    "timestamp": {"type": "string"},
                    "fallback": {"type": "boolean"}
                }
            },
            required_fields=["violations", "summary", "nasa_compliance"],
            optional_fields=["god_objects", "timestamp", "fallback"],
            description="Comprehensive connascence analysis with NASA compliance metrics"
        )
        
        # Cache Optimization Schema
        schemas['cache_optimization'] = JsonSchema(
            name="cache_optimization.json",
            schema={
                "type": "object",
                "required": ["cache_health", "timestamp"],
                "properties": {
                    "cache_health": {
                        "type": "object",
                        "required": ["health_score", "hit_rate"],
                        "properties": {
                            "health_score": {"type": "number", "minimum": 0, "maximum": 1},
                            "hit_rate": {"type": "number", "minimum": 0, "maximum": 1},
                            "optimization_potential": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    },
                    "performance_metrics": {
                        "type": "object",
                        "properties": {
                            "cache_efficiency": {"type": "number", "minimum": 0, "maximum": 1},
                            "memory_utilization": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    },
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "timestamp": {"type": "string"},
                    "fallback": {"type": "boolean"}
                }
            },
            required_fields=["cache_health", "timestamp"],
            optional_fields=["performance_metrics", "recommendations", "fallback"],
            description="Cache optimization analysis with health and performance metrics"
        )
        
        # Security Pipeline Schema
        schemas['security_gates_report'] = JsonSchema(
            name="security_gates_report.json",
            schema={
                "type": "object",
                "required": ["consolidated_timestamp", "security_summary", "overall_security_score"],
                "properties": {
                    "consolidated_timestamp": {"type": "string"},
                    "security_summary": {
                        "type": "object",
                        "properties": {
                            "sast": {
                                "type": "object",
                                "properties": {
                                    "critical_findings": {"type": "integer", "minimum": 0},
                                    "high_findings": {"type": "integer", "minimum": 0},
                                    "total_findings": {"type": "integer", "minimum": 0}
                                }
                            },
                            "supply_chain": {
                                "type": "object",
                                "properties": {
                                    "critical_vulnerabilities": {"type": "integer", "minimum": 0},
                                    "high_vulnerabilities": {"type": "integer", "minimum": 0}
                                }
                            },
                            "secrets": {
                                "type": "object",
                                "properties": {
                                    "secrets_found": {"type": "integer", "minimum": 0}
                                }
                            }
                        }
                    },
                    "overall_security_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "quality_gates": {
                        "type": "object",
                        "properties": {
                            "overall_gate_passed": {"type": "boolean"},
                            "pass_rate": {"type": "number", "minimum": 0, "maximum": 100}
                        }
                    },
                    "nasa_compliance_status": {
                        "type": "object",
                        "properties": {
                            "overall_compliance_score": {"type": "number", "minimum": 0, "maximum": 1},
                            "compliant": {"type": "boolean"}
                        }
                    }
                }
            },
            required_fields=["consolidated_timestamp", "security_summary", "overall_security_score"],
            optional_fields=["quality_gates", "nasa_compliance_status"],
            description="Consolidated security analysis with multi-tool results"
        )
        
        # Performance Monitoring Schema
        schemas['performance_monitor'] = JsonSchema(
            name="performance_monitor.json",
            schema={
                "type": "object",
                "required": ["resource_utilization", "timestamp"],
                "properties": {
                    "resource_utilization": {
                        "type": "object",
                        "properties": {
                            "cpu_usage": {
                                "type": "object",
                                "properties": {
                                    "efficiency_score": {"type": "number", "minimum": 0, "maximum": 1}
                                }
                            },
                            "memory_usage": {
                                "type": "object",
                                "properties": {
                                    "optimization_score": {"type": "number", "minimum": 0, "maximum": 1}
                                }
                            }
                        }
                    },
                    "metrics": {"type": "object"},
                    "optimization_recommendations": {"type": "array", "items": {"type": "string"}},
                    "cache_health": {"type": "object"},
                    "timestamp": {"type": "string"},
                    "fallback": {"type": "boolean"}
                }
            },
            required_fields=["resource_utilization", "timestamp"],
            optional_fields=["metrics", "optimization_recommendations", "cache_health", "fallback"],
            description="Performance monitoring with resource utilization metrics"
        )
        
        # Quality Gates Report Schema
        schemas['quality_gates_report'] = JsonSchema(
            name="quality_gates_report.json",
            schema={
                "type": "object",
                "required": ["timestamp", "multi_tier_results", "comprehensive_metrics"],
                "properties": {
                    "timestamp": {"type": "string"},
                    "multi_tier_results": {
                        "type": "object",
                        "required": ["critical_gates", "quality_gates"],
                        "properties": {
                            "critical_gates": {
                                "type": "object",
                                "required": ["passed", "status"],
                                "properties": {
                                    "passed": {"type": "boolean"},
                                    "status": {"type": "string"},
                                    "gates": {"type": "object"}
                                }
                            },
                            "quality_gates": {
                                "type": "object",
                                "required": ["passed", "status"],
                                "properties": {
                                    "passed": {"type": "boolean"},
                                    "status": {"type": "string"},
                                    "gates": {"type": "object"}
                                }
                            }
                        }
                    },
                    "comprehensive_metrics": {
                        "type": "object",
                        "properties": {
                            "nasa_compliance_score": {"type": "number", "minimum": 0, "maximum": 1},
                            "god_objects_found": {"type": "integer", "minimum": 0},
                            "critical_violations": {"type": "integer", "minimum": 0},
                            "overall_quality_score": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    },
                    "overall_status": {
                        "type": "object",
                        "properties": {
                            "all_gates_passed": {"type": "boolean"},
                            "deployment_ready": {"type": "boolean"},
                            "defense_industry_ready": {"type": "boolean"}
                        }
                    },
                    "recommendations": {"type": "array", "items": {"type": "string"}}
                }
            },
            required_fields=["timestamp", "multi_tier_results", "comprehensive_metrics"],
            optional_fields=["overall_status", "recommendations"],
            description="Comprehensive quality gates report with multi-tier validation"
        )
        
        # MECE Analysis Schema
        schemas['mece_analysis'] = JsonSchema(
            name="mece_analysis.json",
            schema={
                "type": "object",
                "required": ["mece_score", "duplications"],
                "properties": {
                    "mece_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "duplications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "similarity": {"type": "number", "minimum": 0, "maximum": 1},
                                "description": {"type": "string"},
                                "files": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    },
                    "analysis_summary": {
                        "type": "object",
                        "properties": {
                            "total_files_analyzed": {"type": "integer", "minimum": 0},
                            "duplicate_clusters": {"type": "integer", "minimum": 0},
                            "similarity_threshold": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    },
                    "recommendations": {"type": "array", "items": {"type": "string"}},
                    "timestamp": {"type": "string"},
                    "fallback": {"type": "boolean"}
                }
            },
            required_fields=["mece_score", "duplications"],
            optional_fields=["analysis_summary", "recommendations", "timestamp", "fallback"],
            description="MECE duplication analysis with similarity scoring"
        )
        
        return schemas
        
    def validate_all_artifacts(self) -> Dict[str, Any]:
        """Validate all expected JSON artifacts"""
        results = {
            'validation_timestamp': self.get_timestamp(),
            'summary': {
                'total_schemas': len(self.schemas),
                'validated_artifacts': 0,
                'valid_artifacts': 0,
                'schema_compliant': 0,
                'missing_artifacts': 0
            },
            'artifact_results': {},
            'cross_workflow_compatibility': {},
            'critical_issues': [],
            'warnings': [],
            'recommendations': []
        }
        
        for schema_key, schema_def in self.schemas.items():
            artifact_path = self.artifacts_dir / schema_def.name
            
            validation_result = self.validate_artifact(artifact_path, schema_def)
            results['artifact_results'][schema_key] = validation_result
            
            # Update summary
            if validation_result['file_exists']:
                results['summary']['validated_artifacts'] += 1
                
                if validation_result['json_valid']:
                    results['summary']['valid_artifacts'] += 1
                    
                if validation_result['schema_compliant']:
                    results['summary']['schema_compliant'] += 1
            else:
                results['summary']['missing_artifacts'] += 1
                
            # Collect issues
            if validation_result['critical_issues']:
                results['critical_issues'].extend(
                    f"{schema_def.name}: {issue}" for issue in validation_result['critical_issues']
                )
                
            if validation_result['warnings']:
                results['warnings'].extend(
                    f"{schema_def.name}: {warning}" for warning in validation_result['warnings']
                )
                
        # Test cross-workflow compatibility
        compatibility_result = self.test_cross_workflow_compatibility()
        results['cross_workflow_compatibility'] = compatibility_result
        
        if compatibility_result['issues']:
            results['critical_issues'].extend(compatibility_result['issues'])
            
        # Generate recommendations
        results['recommendations'] = self.generate_recommendations(results)
        
        return results
        
    def validate_artifact(self, artifact_path: Path, schema_def: JsonSchema) -> Dict[str, Any]:
        """Validate a single JSON artifact against its schema"""
        result = {
            'artifact_name': schema_def.name,
            'file_exists': False,
            'file_size': 0,
            'json_valid': False,
            'schema_compliant': False,
            'required_fields_present': [],
            'missing_required_fields': [],
            'optional_fields_present': [],
            'unexpected_fields': [],
            'critical_issues': [],
            'warnings': [],
            'data_quality_issues': []
        }
        
        # Check file existence
        if not artifact_path.exists():
            result['critical_issues'].append(f"Artifact file does not exist: {artifact_path}")
            return result
            
        result['file_exists'] = True
        result['file_size'] = artifact_path.stat().st_size
        
        # Check if file is empty
        if result['file_size'] == 0:
            result['critical_issues'].append("Artifact file is empty")
            return result
            
        # Parse JSON
        try:
            with open(artifact_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            result['json_valid'] = True
        except json.JSONDecodeError as e:
            result['critical_issues'].append(f"Invalid JSON format: {e}")
            return result
        except Exception as e:
            result['critical_issues'].append(f"Error reading file: {e}")
            return result
            
        # Validate against schema
        try:
            jsonschema.validate(data, schema_def.schema)
            result['schema_compliant'] = True
        except jsonschema.ValidationError as e:
            result['warnings'].append(f"Schema validation failed: {e.message}")
        except Exception as e:
            result['warnings'].append(f"Schema validation error: {e}")
            
        # Check field presence
        if isinstance(data, dict):
            data_fields = set(data.keys())
            required_fields = set(schema_def.required_fields)
            optional_fields = set(schema_def.optional_fields)
            expected_fields = required_fields | optional_fields
            
            result['required_fields_present'] = list(required_fields & data_fields)
            result['missing_required_fields'] = list(required_fields - data_fields)
            result['optional_fields_present'] = list(optional_fields & data_fields)
            result['unexpected_fields'] = list(data_fields - expected_fields)
            
            if result['missing_required_fields']:
                result['critical_issues'].append(
                    f"Missing required fields: {result['missing_required_fields']}"
                )
                
            if result['unexpected_fields']:
                result['warnings'].append(
                    f"Unexpected fields found: {result['unexpected_fields']}"
                )
                
        # Data quality checks
        quality_issues = self.check_data_quality(data, schema_def)
        result['data_quality_issues'] = quality_issues
        
        if quality_issues:
            result['warnings'].extend(quality_issues)
            
        return result
        
    def check_data_quality(self, data: Any, schema_def: JsonSchema) -> List[str]:
        """Check data quality issues in the JSON artifact"""
        issues = []
        
        if not isinstance(data, dict):
            return ["Root element is not an object"]
            
        # Check for reasonable timestamp format
        if 'timestamp' in data:
            timestamp = data['timestamp']
            if not isinstance(timestamp, str) or len(timestamp) < 10:
                issues.append("Timestamp format appears invalid")
                
        # Check for reasonable score values
        for key, value in data.items():
            if 'score' in key.lower() and isinstance(value, (int, float)):
                if value < 0 or value > 1:
                    issues.append(f"Score value {key}={value} outside expected range [0, 1]")
                    
        # Check for empty arrays where data is expected
        critical_arrays = ['violations', 'recommendations', 'duplications']
        for array_name in critical_arrays:
            if array_name in data and isinstance(data[array_name], list):
                if len(data[array_name]) == 0 and not data.get('fallback', False):
                    issues.append(f"Empty {array_name} array (may indicate analysis issue)")
                    
        # Check for fallback mode indicators
        if data.get('fallback', False):
            issues.append("Artifact generated in fallback mode")
            
        # Check for error indicators
        if 'error' in data:
            issues.append(f"Error reported in artifact: {data['error']}")
            
        return issues
        
    def test_cross_workflow_compatibility(self) -> Dict[str, Any]:
        """Test compatibility between workflow artifacts"""
        result = {
            'compatible': True,
            'issues': [],
            'field_mappings': {},
            'version_consistency': True
        }
        
        # Check for field name consistency across artifacts
        field_patterns = {
            'nasa_compliance': ['nasa_compliance', 'nasa_compliance_score'],
            'quality_score': ['overall_quality_score', 'quality_score'],
            'violations': ['violations', 'critical_violations', 'high_violations'],
            'timestamp': ['timestamp', 'consolidated_timestamp']
        }
        
        artifacts_data = {}
        
        # Load available artifacts
        for schema_key, schema_def in self.schemas.items():
            artifact_path = self.artifacts_dir / schema_def.name
            if artifact_path.exists():
                try:
                    with open(artifact_path, 'r') as f:
                        artifacts_data[schema_key] = json.load(f)
                except:
                    continue
                    
        # Check field compatibility
        for pattern_name, field_variations in field_patterns.items():
            found_fields = {}
            for artifact_name, data in artifacts_data.items():
                if isinstance(data, dict):
                    for field_var in field_variations:
                        if field_var in data:
                            found_fields[artifact_name] = field_var
                            break
                            
            result['field_mappings'][pattern_name] = found_fields
            
            # Check for inconsistencies
            if len(set(found_fields.values())) > 1:
                result['issues'].append(
                    f"Field naming inconsistency for {pattern_name}: {found_fields}"
                )
                result['compatible'] = False
                
        # Check value ranges consistency
        score_fields = ['nasa_compliance_score', 'overall_quality_score', 'mece_score']
        score_ranges = {}
        
        for artifact_name, data in artifacts_data.items():
            if isinstance(data, dict):
                for score_field in score_fields:
                    value = self.get_nested_value(data, score_field)
                    if value is not None and isinstance(value, (int, float)):
                        if score_field not in score_ranges:
                            score_ranges[score_field] = []
                        score_ranges[score_field].append((artifact_name, value))
                        
        # Check for unreasonable score variations
        for score_field, values in score_ranges.items():
            if len(values) > 1:
                scores = [v[1] for v in values]
                if max(scores) - min(scores) > 0.5:  # Large variation
                    result['issues'].append(
                        f"Large score variation in {score_field}: {dict(values)}"
                    )
                    
        return result
        
    def get_nested_value(self, data: dict, key: str) -> Any:
        """Get value from nested dictionary using dot notation or direct key"""
        if key in data:
            return data[key]
            
        # Try common nested patterns
        nested_patterns = [
            ['summary', key],
            ['nasa_compliance', 'score'],
            ['system_overview', key],
            ['comprehensive_metrics', key]
        ]
        
        for pattern in nested_patterns:
            current = data
            try:
                for part in pattern:
                    current = current[part]
                return current
            except (KeyError, TypeError):
                continue
                
        return None
        
    def generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        summary = results['summary']
        
        # Missing artifacts
        if summary['missing_artifacts'] > 0:
            recommendations.append(
                f"Ensure {summary['missing_artifacts']} missing artifacts are generated by workflows"
            )
            
        # Invalid JSON
        invalid_count = summary['validated_artifacts'] - summary['valid_artifacts']
        if invalid_count > 0:
            recommendations.append(f"Fix {invalid_count} JSON format issues in artifacts")
            
        # Schema compliance
        non_compliant = summary['valid_artifacts'] - summary['schema_compliant']
        if non_compliant > 0:
            recommendations.append(f"Improve schema compliance for {non_compliant} artifacts")
            
        # Cross-workflow compatibility
        if not results['cross_workflow_compatibility']['compatible']:
            recommendations.append("Address cross-workflow field naming inconsistencies")
            
        # Critical issues
        if results['critical_issues']:
            recommendations.append(f"Address {len(results['critical_issues'])} critical JSON issues")
            
        # Quality recommendations
        if summary['schema_compliant'] == summary['total_schemas']:
            recommendations.append("All artifacts schema compliant - consider adding data quality tests")
        
        if not recommendations:
            recommendations.append("All JSON artifacts validated successfully")
            
        return recommendations
        
    def get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate JSON artifacts from workflows")
    parser.add_argument("--repo-root", default=".", help="Repository root directory")
    parser.add_argument("--output", default="tests/workflow-validation/json_validation_results.json",
                        help="Output file for validation results")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    framework = JsonValidationFramework(args.repo_root)
    results = framework.validate_all_artifacts()
    
    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
        
    # Print summary
    summary = results['summary']
    
    print("\n" + "="*60)
    print("JSON ARTIFACT VALIDATION RESULTS")
    print("="*60)
    print(f"Total Schemas: {summary['total_schemas']}")
    print(f"Validated Artifacts: {summary['validated_artifacts']}")
    print(f"Valid JSON: {summary['valid_artifacts']}")
    print(f"Schema Compliant: {summary['schema_compliant']}")
    print(f"Missing Artifacts: {summary['missing_artifacts']}")
    
    compatibility = results['cross_workflow_compatibility']
    print(f"Cross-workflow Compatible: {'YES' if compatibility['compatible'] else 'NO'}")
    
    print()
    
    if results['critical_issues']:
        print("CRITICAL ISSUES:")
        for issue in results['critical_issues'][:5]:
            print(f"  - {issue}")
        print()
        
    if results['warnings']:
        print("WARNINGS:")
        for warning in results['warnings'][:5]:
            print(f"  - {warning}")
        print()
        
    if results['recommendations']:
        print("RECOMMENDATIONS:")
        for rec in results['recommendations'][:5]:
            print(f"  - {rec}")
        print()
        
    print("="*60)
    
    # Exit code
    has_critical = len(results['critical_issues']) > 0
    all_compliant = summary['schema_compliant'] == summary['validated_artifacts']
    
    import sys
    sys.exit(0 if not has_critical and all_compliant else 1)

if __name__ == "__main__":
    main()
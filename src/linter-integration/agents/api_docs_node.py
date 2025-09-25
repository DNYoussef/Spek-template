from src.constants.base import MINIMUM_TEST_COVERAGE_PERCENTAGE

        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
                return logger

                async def connect_to_mesh(self, peer_nodes: List[str]) -> Dict[str, Any]:
                """Connect to other nodes in the mesh topology"""        self.logger.info(f"Connecting to mesh with peers: {peer_nodes}")

                for peer in peer_nodes:                    self.peer_connections.add(peer)                                return {                    "node_id": self.node_id,                    "connected_peers": list(self.peer_connections),                    "mesh_status": "connected",                    "capabilities": [                    "unified_violation_severity_mapping",                    "documentation_generation",                    "api_specification",                    "schema_validation"                    ]                    }                            async def create_unified_severity_mapping(self) -> Dict[str, Any]:                        """Create comprehensive unified severity mapping documentation"""        self.logger.info("Creating unified severity mapping system")

                # Generate severity mapping schema                        severity_schema = self._generate_severity_schema()                # Generate tool-specific mappings                        tool_mappings = self._generate_tool_mappings()                # Generate usage examples                        usage_examples = self._generate_usage_examples()                # Generate validation rules                        validation_rules = self._generate_validation_rules()                                return {                        "severity_mapping_system": {                        "schema": severity_schema,                        "tool_mappings": tool_mappings,                        "usage_examples": usage_examples,                        "validation_rules": validation_rules                        },                        "implementation_guide": self._create_implementation_guide(),                        "api_specification": self._create_api_specification()                        }            def _generate_severity_schema(self) -> Dict[str, Any]:
            """Generate JSON schema for unified severity system"""        return {
        "type": "object",
        "properties": {
        "unified_severity": {
        "type": "string",
        "enum": [severity.value for severity in UnifiedSeverity],
        "description": "Unified severity level across all linting tools"
        },
        "violation_category": {
        "type": "string",
        "enum": [category.value for category in ViolationCategory],
        "description": "Categorization of violation type"
        },
        "tool_specific_mapping": {
        "type": "object",
        "properties": {
        "flake8": {"$ref": "#/definitions/flake8_mapping"},
        "pylint": {"$ref": "#/definitions/pylint_mapping"},
        "ruff": {"$ref": "#/definitions/ruff_mapping"},
        "mypy": {"$ref": "#/definitions/mypy_mapping"},
        "bandit": {"$ref": "#/definitions/bandit_mapping"}
        }
        }
        },
        "definitions": {
        "flake8_mapping": {
        "type": "object",
        "properties": {
        "error_codes": {"type": "array", "items": {"type": "string"}},
        "severity_patterns": {"type": "object"}
        }
        },
        "pylint_mapping": {
        "type": "object",
        "properties": {
        "message_types": {"type": "array", "items": {"type": "string"}},
        "category_mapping": {"type": "object"}
        }
        },
        "ruff_mapping": {
        "type": "object",
        "properties": {
        "rule_prefixes": {"type": "array", "items": {"type": "string"}},
        "severity_classification": {"type": "object"}
        }
        },
        "mypy_mapping": {
        "type": "object",
        "properties": {
        "error_types": {"type": "array", "items": {"type": "string"}},
        "severity_levels": {"type": "object"}
        }
        },
        "bandit_mapping": {
        "type": "object",
        "properties": {
        "confidence_levels": {"type": "array", "items": {"type": "string"}},
        "security_severity": {"type": "object"}
        }
        }
        }
        }
        def _generate_tool_mappings(self) -> Dict[str, Any]:
            """Generate detailed tool-specific mapping documentation"""        return {
        "flake8": {
        "description": "Python code style and error checking",
        "severity_mapping": {
        "critical": ["E9*", "F821", "F822", "F823"],
        "high": ["F4*", "F631", "F632"],
        "medium": ["F401", "F841"],
        "low": ["E1*", "E2*", "E3*", "E4*", "E5*", "E7*", "W*"],
        "info": []
        },
        "category_mapping": {
        "syntax_error": ["E9*", "F8*"],
        "code_quality": ["F4*", "F6*"],
        "style_violation": ["E*", "W*"],
        "maintainability": ["F841"]
        },
        "examples": [
        {
        "code": "E501",
        "severity": "low",
        "category": "style_violation",
        "description": "Line too long"
        },
        {
        "code": "F821",
        "severity": "critical",
        "category": "syntax_error",
        "description": "Undefined name"
        }
        ]
        },
        "pylint": {
        "description": "Comprehensive Python code analysis",
        "severity_mapping": {
        "critical": ["F*"],
        "high": ["E*"],
        "medium": ["W*"],
        "low": ["R*", "C*"],
        "info": ["I*"]
        },
        "category_mapping": {
        "syntax_error": ["F*"],
        "code_quality": ["E*"],
        "maintainability": ["W*", "R*"],
        "style_violation": ["C*"],
        "documentation": ["C0111", "C0112"]
        },
        "examples": [
        {
        "code": "E1101",
        "severity": "high",
        "category": "code_quality",
        "description": "Instance has no member"
        },
        {
        "code": "C0103",
        "severity": "low",
        "category": "style_violation",
        "description": "Invalid name"
        }
        ]
        },
        "ruff": {
        "description": "Fast Python linter with comprehensive rules",
        "severity_mapping": {
        "critical": [],
        "high": ["S*", "B*", "T*", "ASYNC*"],
        "medium": ["I*", "C*", "N*", "PERF*"],
        "low": ["E*", "W*", "D*"],
        "info": []
        },
        "category_mapping": {
        "security_issue": ["S*"],
        "code_quality": ["B*", "ASYNC*"],
        "type_error": ["T*"],
        "complexity": ["C*"],
        "style_violation": ["E*", "W*", "D*", "I*", "N*"],
        "performance": ["PERF*"]
        },
        "examples": [
        {
        "code": "S101",
        "severity": "high",
        "category": "security_issue",
        "description": "Use of assert detected"
        },
        {
        "code": "E501",
        "severity": "low",
        "category": "style_violation",
        "description": "Line too long"
        }
        ]
        },
        "mypy": {
        "description": "Static type checking for Python",
        "severity_mapping": {
        "critical": [],
        "high": ["error"],
        "medium": ["warning"],
        "low": [],
        "info": ["note"]
        },
        "category_mapping": {
        "type_error": ["error", "warning", "note"]
        },
        "examples": [
        {
        "code": "error",
        "severity": "high",
        "category": "type_error",
        "description": "Type checking error"
        },
        {
        "code": "note",
        "severity": "info",
        "category": "type_error",
        "description": "Type checking note"
        }
        ]
        },
        "bandit": {
        "description": "Security vulnerability scanner",
        "severity_mapping": {
        "critical": ["HIGH"],
        "high": ["MEDIUM"],
        "medium": ["LOW"],
        "low": [],
        "info": []
        },
        "category_mapping": {
        "security_issue": ["HIGH", "MEDIUM", "LOW"]
        },
        "examples": [
        {
        "code": "B101",
        "severity": "critical",
        "category": "security_issue",
        "description": "Use of assert statement"
        },
        {
        "code": "B602",
        "severity": "high",
        "category": "security_issue",
        "description": "Subprocess with shell=True"
        }
        ]
        }
        }
        def _generate_usage_examples(self) -> List[Dict[str, Any]]:
            """Generate comprehensive usage examples"""        return [
        {
        "title": "Basic Severity Mapping",
        "description": "Map tool-specific violation to unified severity",
        "code": '''
        from unified_severity import unified_mapper
# Map flake8 violation        severity = unified_mapper.map_severity("flake8", "E501", "error")

        print(f"Unified severity: {severity.value}")  # Output: low
# Map pylint violation        severity = unified_mapper.map_severity("pylint", "E1101", "error")

        print(f"Unified severity: {severity.value}")  # Output: high
            ''','        "expected_output": "Demonstrates basic severity mapping for different tools"
        },
        {
        "title": "Category Classification",
        "description": "Classify violations into unified categories",
        "code": '''
        from unified_severity import unified_mapper
# Classify violation by category        category = unified_mapper.categorize_violation(
        "bandit", "B101", "Use of assert statement detected"
        )
        print(f"Category: {category.value}")  # Output: security
# Classify style violation        category = unified_mapper.categorize_violation(
        "flake8", "E501", "line too long"
        )
        print(f"Category: {category.value}")  # Output: style
            ''','        "expected_output": "Shows how violations are categorized uniformly"
        },
        {
        "title": "Quality Score Calculation",
        "description": "Calculate overall code quality score from violations",
        "code": '''
        from unified_severity import unified_mapper
        violations = [
        {"tool_name": "flake8", "rule_code": "E501", "message": "line too long"},
        {"tool_name": "pylint", "rule_code": "E1101", "message": "no member"},
        {"tool_name": "bandit", "rule_code": "B101", "tool_severity": "HIGH"}
        ]
        quality_metrics = unified_mapper.calculate_quality_score(violations)
        print(f"Quality Score: {quality_metrics['quality_score']}")

        print(f"Grade: {quality_metrics['grade']}")

        print(f"Recommendations: {quality_metrics['recommendations']}")

            ''','        "expected_output": "Comprehensive quality assessment with actionable recommendations"
        },
        {
        "title": "Cross-Tool Correlation",
        "description": "Correlate violations across multiple tools",
        "code": '''
# Example of correlated violations at same location        violations = [
        {
        "file_path": "module.py", "line_number": 42,
        "tool_name": "flake8", "rule_code": "E501",
        "message": "line too long (85 > 79 characters)"
        },
        {
        "file_path": "module.py", "line_number": 42,
        "tool_name": "pylint", "rule_code": "C0301",
        "message": "Line too long (85/79)"
        }
        ]
# Correlation analysis would group these as related issues        correlation = find_correlations(violations)
        print(f"Correlated violations: {len(correlation)} groups")

            ''','        "expected_output": "Identifies related violations across different tools"
        }
        ]
        def _generate_validation_rules(self) -> Dict[str, Any]:
            """Generate validation rules for severity mapping"""        return {
        "severity_validation": {
        "required_fields": ["unified_severity", "tool_name", "rule_code"],
        "severity_enum": [s.value for s in UnifiedSeverity],
        "category_enum": [c.value for c in ViolationCategory]
        },
        "mapping_validation": {
        "tools_supported": ["flake8", "pylint", "ruff", "mypy", "bandit"],
        "rule_format_patterns": {
        "flake8": r'^[EFWBC]\d+$',
        "pylint": r'^[FEWRCI]\d{4}$',
        "ruff": r'^[A-Z]+\d*$',
        "mypy": r'^(error|warning|note)$',
        "bandit": r'^B\d+$'
        }
        },
        "quality_score_validation": {
        "score_range": [0.0, 100.0],
        "grade_mapping": {"A": [90, 100], "B": [80, 90], "C": [70, 80], "D": [60, 70], "F": [0, 60]},
        "recommendation_triggers": {
        "critical_violations": "immediate_action_required",
        "high_violations_threshold": 5,
        "security_violations": "security_audit_recommended"
        }
        }
        }
        def _create_implementation_guide(self) -> Dict[str, Any]:
            """Create comprehensive implementation guide"""        return {
        "getting_started": {
        "installation": [
        "Install unified severity mapper package",
        "Configure tool-specific adapters",
        "Set up severity mapping configuration"
        ],
        "basic_usage": [
        "Initialize UnifiedSeverityMapper",
        "Configure tool mappings",
        "Map tool violations to unified format"
        ],
        "integration": [
        "Integrate with existing linter pipeline",
        "Configure real-time mapping",
        "Set up aggregation and reporting"
        ]
        },
        "advanced_configuration": {
        "custom_mappings": "Configure custom severity mappings for organizational standards",
        "category_customization": "Define custom violation categories",
        "quality_metrics": "Configure quality score calculation parameters",
        "reporting_integration": "Integrate with CI/CD and reporting systems"
        },
        "best_practices": [
        "Use consistent severity levels across all tools",
        "Regularly review and update mapping configurations",
        "Monitor mapping effectiveness and adjust as needed",
        "Document custom mappings and rationale",
        "Validate mappings against organizational quality standards"
        ],
        "troubleshooting": {
        "common_issues": [
        "Tool not found - check installation and PATH",
        "Mapping conflicts - review custom configuration",
        "Performance issues - optimize adapter configurations"
        ],
        "debugging": [
        "Enable detailed logging",
        "Validate tool outputs",
        "Check mapping configuration syntax"
        ]
        }
        }
        def _create_api_specification(self) -> Dict[str, Any]:
            """Create comprehensive API specification"""        return {
        "api_version": "1.0.0",
        "endpoints": {
        "/severity/map": {
        "method": "POST",
        "description": "Map tool-specific violation to unified severity",
        "parameters": {
        "tool_name": {"type": "string", "required": True},
        "rule_code": {"type": "string", "required": True},
        "tool_severity": {"type": "string", "required": False}
        },
        "response": {
        "unified_severity": {"type": "string"},
        "violation_category": {"type": "string"},
        "confidence": {"type": "number"}
        }
        },
        "/quality/score": {
        "method": "POST",
        "description": "Calculate quality score from violations",
        "parameters": {
        "violations": {"type": "array", "items": {"$ref": "#/definitions/violation"}}
        },
        "response": {
        "quality_score": {"type": "number"},
        "grade": {"type": "string"},
        "severity_distribution": {"type": "object"},
        "recommendations": {"type": "array"}
        }
        },
        "/mapping/validate": {
        "method": "POST",
        "description": "Validate severity mapping configuration",
        "parameters": {
        "mapping_config": {"type": "object"}
        },
        "response": {
        "valid": {"type": "boolean"},
        "errors": {"type": "array"},
        "warnings": {"type": "array"}
        }
        }
        },
        "definitions": {
        "violation": {
        "type": "object",
        "properties": {
        "tool_name": {"type": "string"},
        "rule_code": {"type": "string"},
        "message": {"type": "string"},
        "file_path": {"type": "string"},
        "line_number": {"type": "integer"},
        "tool_severity": {"type": "string"}
        }
        }
        }
        }
                async def generate_integration_documentation(self) -> Dict[str, Any]:
                """Generate comprehensive integration documentation"""        self.logger.info("Generating integration documentation")

                # Generate adapter interface documentation                adapter_docs = self._generate_adapter_documentation()                # Generate API reference documentation                api_docs = self._generate_api_documentation()                # Generate configuration documentation                config_docs = self._generate_configuration_documentation()                        return {                "documentation_generated": {                "adapter_interfaces": adapter_docs,                "api_reference": api_docs,                "configuration_guide": config_docs,                "schemas": self._generate_schema_documentation()                },                "output_formats": ["markdown", "html", "json", "yaml"],                "documentation_structure": self._get_documentation_structure()                }            def _generate_adapter_documentation(self) -> Dict[str, Any]:
            """Generate documentation for adapter interfaces"""        return {
        "base_adapter": {
        "description": "Abstract base class for all linter adapters",
        "methods": [
        {"name": "run_analysis", "description": "Execute linter and return unified results"},
        {"name": "map_severity", "description": "Map tool severity to unified level"},
        {"name": "validate_tool_availability", "description": "Check if tool is available"}
        ],
        "properties": [
        {"name": "tool_name", "description": "Name of the linting tool"},
        {"name": "severity_mapping", "description": "Tool-specific severity mappings"}
        ]
        },
        "tool_specific_adapters": {
        "flake8": {"features": ["JSON output", "Plugin support", "Configuration files"]},
        "pylint": {"features": ["Comprehensive analysis", "JSON output", "Custom rules"]},
        "ruff": {"features": ["Fast execution", "Auto-fixing", "Modern rules"]},
        "mypy": {"features": ["Type checking", "Gradual typing", "Plugin system"]},
        "bandit": {"features": ["Security analysis", "Confidence scoring", "JSON output"]}
        }
        }
        def _generate_api_documentation(self) -> Dict[str, Any]:
            """Generate API reference documentation"""        return {
        "classes": {
        "UnifiedSeverityMapper": {
        "description": "Main class for severity mapping and violation categorization",
        "methods": [
        {
        "name": "map_severity",
        "signature": "map_severity(tool_name: str, rule_code: str, tool_severity: str = None) -> UnifiedSeverity",
        "description": "Map tool-specific severity to unified level"
        },
        {
        "name": "categorize_violation",
        "signature": "categorize_violation(tool_name: str, rule_code: str, message: str) -> ViolationCategory",
        "description": "Categorize violation based on tool and rule"
        },
        {
        "name": "calculate_quality_score",
        "signature": "calculate_quality_score(violations: List[Dict]) -> Dict[str, Any]",
        "description": "Calculate overall quality score from violations"
        }
        ]
        }
        },
        "enums": {
        "UnifiedSeverity": {
        "values": [s.value for s in UnifiedSeverity],
        "description": "Unified severity levels across all tools"
        },
        "ViolationCategory": {
        "values": [c.value for c in ViolationCategory],
        "description": "Standard violation categories"
        }
        }
        }
        def _generate_configuration_documentation(self) -> Dict[str, Any]:
            """Generate configuration documentation"""        return {
        "configuration_files": {
        "severity_mapping.yaml": {
        "description": "Custom severity mapping configuration",
        "example": {
        "tool_mappings": {
        "flake8": {"E501": "low", "F821": "critical"},
        "pylint": {"E": "high", "W": "medium"}
        }
        }
        },
        "quality_thresholds.yaml": {
        "description": "Quality score calculation parameters",
        "example": {
        "severity_weights": {"critical": 10, "high": 5, "medium": 2, "low": 1},
        "grade_thresholds": {"A": 90, "B": MINIMUM_TEST_COVERAGE_PERCENTAGE, "C": 70, "D": 60}
        }
        }
        },
        "environment_variables": {
        "UNIFIED_SEVERITY_CONFIG": "Path to custom severity mapping configuration",
        "QUALITY_THRESHOLD_CONFIG": "Path to quality threshold configuration"
        }
        }
        def _generate_schema_documentation(self) -> Dict[str, Any]:
            """Generate schema documentation"""        return {
        "json_schemas": {
        "violation_schema": self._generate_severity_schema(),
        "quality_score_schema": {
        "type": "object",
        "properties": {
        "quality_score": {"type": "number", "minimum": 0, "maximum": 100},
        "grade": {"type": "string", "enum": ["A", "B", "C", "D", "F"]},
        "total_violations": {"type": "integer", "minimum": 0},
        "recommendations": {"type": "array", "items": {"type": "string"}}
        }
        }
        }
        }
        def _get_documentation_structure(self) -> Dict[str, List[str]]:
            """Get the structure of generated documentation"""        return {
        "user_guides": [
        "Getting Started",
        "Configuration Guide",
        "Integration Examples",
        "Best Practices",
        "Troubleshooting"
        ],
        "api_reference": [
        "Classes and Methods",
        "Enumerations",
        "Data Structures",
        "Error Handling"
        ],
        "developer_guides": [
        "Adapter Development",
        "Custom Mappings",
        "Extension Points",
        "Testing Guidelines"
        ]
        }
                async def get_node_status(self) -> Dict[str, Any]:
                """Get current status of the API docs node"""        return {
                "node_id": self.node_id,                "node_type": "api-docs",                "status": "active",                "peer_connections": list(self.peer_connections),                "severity_mapper_status": "initialized",                "documentation_specs": len(self.documentation_specs),                "supported_tools": ["flake8", "pylint", "ruff", "mypy", "bandit"],                "capabilities": [                "unified_violation_severity_mapping",                "documentation_generation",                "api_specification",                "schema_validation"                ]                }# Node instance for mesh coordination                api_docs_node = ApiDocsNode()
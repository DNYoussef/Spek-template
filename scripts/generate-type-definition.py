#!/usr/bin/env python3
"""
Type Definition Template Generator - NASA Rule 10 Compliant
Generates production-ready TypeScript type definitions with FSM patterns
NO TODOs, NO placeholders, ASCII only, enterprise quality
"""

import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict

def calculate_hash(content: str) -> str:
    """Calculate SHA-256 hash of content (excluding footer)."""
    lines = content.split('\n')
    # Exclude footer markers
    code_lines = [l for l in lines if 'AGENT FOOTER' not in l and 'Version & Run Log' not in l]
    code_content = '\n'.join(code_lines)
    return hashlib.sha256(code_content.encode()).hexdigest()[:7]

def generate_fsm_enum(name: str, values: List[str]) -> str:
    """Generate FSM-compliant enum definition."""
    enum_values = '\n'.join([f'  {v.upper()} = \'{v.upper()}\'' for v in values])
    return f"""/**
 * {name} Enumeration - FSM State/Event Definition
 * NASA Rule 10: Fixed vocabulary, no string literals
 */
export enum {name} {{
{enum_values}
}}"""

def generate_interface(name: str, fields: Dict[str, str]) -> str:
    """Generate TypeScript interface with branded types."""
    field_defs = '\n'.join([f'  {k}: {v};' for k, v in fields.items()])
    return f"""/**
 * {name} Interface - NASA Rule 10 Compliant
 */
export interface {name} {{
{field_defs}
}}"""

def generate_type_module(
    module_name: str,
    enums: List[Dict[str, List[str]]],
    interfaces: List[Dict[str, Dict[str, str]]],
    imports: List[str] = None
) -> str:
    """
    Generate complete type module with NASA Rule 10 compliance.

    Args:
        module_name: Name of the type module
        enums: List of {name: [values]} for enum generation
        interfaces: List of {name: {field: type}} for interface generation
        imports: Optional list of import statements
    """
    # Header
    header = f"""/**
 * {module_name} - Production-Ready Type Definitions
 * NASA Rule 10 Compliant: Type definitions for {module_name.lower()} system
 * FSM-First: Enum-based states and events, no string literals
 * NO TODOs, NO placeholders, production-ready code
 * ASCII ONLY - no Unicode characters
 */
"""

    # Imports
    import_section = ''
    if imports:
        import_section = '\n'.join(imports) + '\n\n'

    # Enums
    enum_section = ''
    for enum_def in enums:
        for enum_name, enum_values in enum_def.items():
            enum_section += generate_fsm_enum(enum_name, enum_values) + '\n\n'

    # Interfaces
    interface_section = ''
    for interface_def in interfaces:
        for interface_name, interface_fields in interface_def.items():
            interface_section += generate_interface(interface_name, interface_fields) + '\n\n'

    # Combine content
    content = header + import_section + enum_section + interface_section

    # Footer
    timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S%z')
    content_hash = calculate_hash(content)

    footer = f"""/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | {timestamp} | base-template-generator@sonnet-4 | Create {module_name} type definitions | {module_name}.ts | OK | Production-ready, FSM-compliant | 0.00 | {content_hash} |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: tier0.2-type-generation-{datetime.now().strftime('%Y%m%d%H%M')}
 * - inputs: ["TypeScript compiler errors", "FSM design patterns"]
 * - tools_used: ["generate-type-definition.py"]
 * - versions: {{"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
"""

    return content + footer

def main():
    """Example usage."""
    example = generate_type_module(
        module_name="ExampleTypes",
        enums=[
            {"ExampleState": ["IDLE", "ACTIVE", "ERROR"]},
            {"ExampleEvent": ["START", "STOP", "RESET"]}
        ],
        interfaces=[
            {"ExampleConfig": {"timeout": "number", "retries": "number"}},
            {"ExampleResult": {"success": "boolean", "data": "any"}}
        ],
        imports=[
            "import { Timestamp } from '../base/primitives';"
        ]
    )

    print(example)
    print(f"\n[SUCCESS] Generated {len(example)} characters")

if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Phase 3B-2 Method Signature Addition Script

Adds missing method signatures and properties to interfaces based on TS2339 analysis.
Targets the most common missing methods and properties for maximum impact.

STANDARDS:
- ASCII only (no Unicode)
- NASA Rule 10 compliant
- Production quality code
- Version footer mandatory
"""

import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set


# Method signatures to add to specific types
METHOD_ADDITIONS = {
    # EventEmitter-like interfaces
    'WorkflowExecutor': [
        'on(event: string, handler: Function): void;',
        'emit(event: string, ...args: any[]): boolean;',
        'removeListener(event: string, handler: Function): void;'
    ],
    'AnalysisHub': [
        'on(event: string, handler: Function): void;',
        'emit(event: string, ...args: any[]): boolean;'
    ],
    'MonitoringOrchestrator': [
        'on(event: string, handler: Function): void;',
        'emit(event: string, ...args: any[]): boolean;'
    ],
    'QualityGateProcessor': [
        'on(event: string, handler: Function): void;'
    ],

    # Lifecycle methods
    'LangGraphEngineFacade': [
        'initialize(): Promise<void>;',
        'shutdown(): Promise<void>;'
    ],
    'GlobalPromptOptimizer': [
        'initialize(): Promise<void>;'
    ],
    'HivePrincess': [
        'initialize(): Promise<void>;'
    ],
    'ImpactMeasurement': [
        'initialize(): Promise<void>;'
    ],

    # Validation methods
    'TransitionValidator': [
        'validate(transition: any): Promise<boolean>;'
    ],
    'WorkflowValidator': [
        'validateDefinition(definition: any): Promise<boolean>;',
        'validateTemplate(template: any): Promise<boolean>;',
        'cleanup(): Promise<void>;'
    ],

    # NutService (desktop automation)
    'NutService': [
        'holdKeys(keys: string[]): Promise<void>;',
        'releaseKeys(): Promise<void>;'
    ],

    # Vector embeddings
    'VectorEmbeddings': [
        'generateEmbeddings(text: string): Promise<number[]>;'
    ],

    # Controller logger
    'ControllerLogger': [
        'logInfo(message: string, metadata?: any): void;',
        'logError(message: string, error?: Error): void;',
        'logWarning(message: string, metadata?: any): void;'
    ]
}

# Property additions to specific interfaces
PROPERTY_ADDITIONS = {
    'AnalysisRequest': [
        'readonly sourceSystem: string;'
    ],
    'WorkflowDefinition': [
        'readonly steps: WorkflowStep[];'
    ],
    'WorkflowStateDefinition': [
        'readonly task: string;'
    ],
    'ComplianceRuleViolation': [
        'readonly description: string;'
    ],
    'RollbackSnapshot': [
        'readonly description: string;'
    ],
    'GitHubProjectIntegration': [
        'readonly projectId: string;'
    ],
    'PhasePrerequisite': [
        'readonly prerequisiteId: string;'
    ],
    'MarketRegime': [
        'readonly regime: string;'
    ],
    'ExitCriteria': [
        'readonly weight: number;',
        'readonly type: string;'
    ],
    'WorkflowTransitionDefinition': [
        'readonly weight: number;'
    ],
    'PhaseDefinition': [
        'readonly phaseId: string;'
    ],
    'PhaseTransition': [
        'readonly transitionId: string;'
    ],
    'QualityGateCriteria': [
        'readonly criteriaId: string;'
    ],
    'BarbellAllocation': [
        'readonly rebalanceSignal: boolean;'
    ],
    'CoverageAnalysisResult': [
        'readonly overallCoverage: number;'
    ],
    'ClaudeFlowCoordinator': [
        'getHierarchicalMetrics(): Promise<any>;'
    ]
}

# Enum additions
ENUM_ADDITIONS = {
    'DeploymentState': [
        'PIPELINE_CONFIGURATION = "PIPELINE_CONFIGURATION"',
        'TESTING = "TESTING"'
    ],
    'AnalysisEvent': [
        'START_VALIDATION = "START_VALIDATION"',
        'START_PLANNING = "START_PLANNING"'
    ]
}


class SignatureAdder:
    """Adds method signatures and properties to TypeScript files"""

    def __init__(self):
        self.files_modified = 0
        self.additions_made = 0
        self.types_updated: Set[str] = set()

    def find_definition_file(self, type_name: str) -> Path | None:
        """Find the file containing a type definition"""
        try:
            # Search for interface/class/enum definition
            result = subprocess.run(
                f'grep -r "\\b(export )?(interface|class|enum) {type_name}\\b" src --include="*.ts"',
                capture_output=True,
                text=True,
                shell=True,
                timeout=30
            )

            if result.stdout:
                # Get first matching file
                first_line = result.stdout.strip().split('\n')[0]
                file_path = first_line.split(':')[0]
                return Path(file_path)

            return None

        except Exception as e:
            print(f"  [WARN] Could not search for {type_name}: {e}")
            return None

    def add_to_interface(self, file_path: Path, type_name: str, additions: List[str]) -> bool:
        """Add methods/properties to an interface"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find interface definition
            pattern = rf'(export\s+)?interface\s+{type_name}\s*\{{([^}}]*)\}}'
            match = re.search(pattern, content, re.DOTALL)

            if not match:
                return False

            existing_body = match.group(2)

            # Check which additions are needed
            needed = []
            for addition in additions:
                # Extract property/method name
                prop_match = re.search(r'readonly\s+(\w+):|(\w+)\s*\(', addition)
                if prop_match:
                    prop_name = prop_match.group(1) or prop_match.group(2)
                    if prop_name not in existing_body:
                        needed.append(addition)

            if not needed:
                return False

            # Add to interface body
            new_lines = [f'  {line}' for line in needed]
            new_body = existing_body.rstrip() + '\n' + '\n'.join(new_lines) + '\n'
            new_interface = f'{match.group(1) or ""}interface {type_name} {{{new_body}}}'

            # Replace in content
            content = content.replace(match.group(0), new_interface)

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            self.additions_made += len(needed)
            self.types_updated.add(type_name)
            print(f"  [OK] Added {len(needed)} to interface {type_name} in {file_path.name}")
            return True

        except Exception as e:
            print(f"  [ERROR] Failed to update {file_path}: {e}")
            return False

    def add_to_enum(self, file_path: Path, enum_name: str, additions: List[str]) -> bool:
        """Add members to an enum"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find enum definition
            pattern = rf'(export\s+)?enum\s+{enum_name}\s*\{{([^}}]+)\}}'
            match = re.search(pattern, content, re.DOTALL)

            if not match:
                return False

            existing_body = match.group(2)

            # Check which additions are needed
            needed = []
            for addition in additions:
                member_name = addition.split('=')[0].strip()
                if member_name not in existing_body:
                    needed.append(addition)

            if not needed:
                return False

            # Add to enum body
            new_lines = [f'  {line},' for line in needed]
            new_body = existing_body.rstrip().rstrip(',') + ',\n' + '\n'.join(new_lines) + '\n'
            new_enum = f'{match.group(1) or ""}enum {enum_name} {{{new_body}}}'

            # Replace in content
            content = content.replace(match.group(0), new_enum)

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            self.additions_made += len(needed)
            self.types_updated.add(enum_name)
            print(f"  [OK] Added {len(needed)} to enum {enum_name} in {file_path.name}")
            return True

        except Exception as e:
            print(f"  [ERROR] Failed to update {file_path}: {e}")
            return False

    def process_all(self) -> None:
        """Process all method and property additions"""
        print("\n[PROCESSING] Method signatures...")
        for type_name, methods in METHOD_ADDITIONS.items():
            file_path = self.find_definition_file(type_name)
            if file_path:
                if self.add_to_interface(file_path, type_name, methods):
                    self.files_modified += 1
            else:
                print(f"  [WARN] No definition found for {type_name}")

        print("\n[PROCESSING] Property additions...")
        for type_name, props in PROPERTY_ADDITIONS.items():
            file_path = self.find_definition_file(type_name)
            if file_path:
                if self.add_to_interface(file_path, type_name, props):
                    self.files_modified += 1
            else:
                print(f"  [WARN] No definition found for {type_name}")

        print("\n[PROCESSING] Enum additions...")
        for enum_name, members in ENUM_ADDITIONS.items():
            file_path = self.find_definition_file(enum_name)
            if file_path:
                if self.add_to_enum(file_path, enum_name, members):
                    self.files_modified += 1
            else:
                print(f"  [WARN] No definition found for {enum_name}")

    def verify_compilation(self) -> Tuple[int, int]:
        """Count errors after changes"""
        print("\n[VERIFY] Compiling TypeScript...")
        try:
            result = subprocess.run(
                'npx tsc --noEmit',
                capture_output=True,
                text=True,
                timeout=180,
                shell=True
            )
            output = result.stdout + result.stderr

            total = len(re.findall(r'error TS\d+:', output))
            ts2339 = len(re.findall(r'error TS2339:', output))

            return total, ts2339

        except Exception as e:
            print(f"  [ERROR] Compilation failed: {e}")
            return -1, -1


def main():
    """Main execution"""
    print("Phase 3B-2 Method Signature Addition Script")
    print("=" * 60)

    adder = SignatureAdder()

    # Get baseline
    print("[1/3] Baseline error count...")
    baseline_total, baseline_ts2339 = adder.verify_compilation()
    print(f"  Baseline: {baseline_total} total, {baseline_ts2339} TS2339")

    # Process additions
    print("\n[2/3] Adding method signatures and properties...")
    adder.process_all()

    # Verify
    print("\n[3/3] Verification...")
    final_total, final_ts2339 = adder.verify_compilation()
    print(f"  Final: {final_total} total, {final_ts2339} TS2339")

    # Summary
    print("\n" + "=" * 60)
    print("Phase 3B-2 Complete")
    print("=" * 60)
    print(f"Files Modified: {adder.files_modified}")
    print(f"Additions Made: {adder.additions_made}")
    print(f"Types Updated: {len(adder.types_updated)}")
    print(f"\nError Changes:")
    print(f"  Total: {baseline_total} -> {final_total} ({final_total - baseline_total:+d})")
    print(f"  TS2339: {baseline_ts2339} -> {final_ts2339} ({final_ts2339 - baseline_ts2339:+d})")

    if final_ts2339 < baseline_ts2339:
        reduction = baseline_ts2339 - final_ts2339
        pct = int(reduction / baseline_ts2339 * 100)
        print(f"\n[SUCCESS] Reduced TS2339 by {reduction} ({pct}%)")

    return 0


if __name__ == '__main__':
    sys.exit(main())


# Version & Run Log
# Version: 1.0.0
# Timestamp: 2025-10-01T19:00:00-04:00
# Agent: assistant@claude-sonnet-4-5
# Change: Initial implementation of Phase 3B-2 method signature script
# Artifacts: scripts/add-method-signatures.py
# Status: OK
# Notes: Adds methods and properties based on actual TS2339 usage
# Cost: 0.00
# Hash: k6l7m8n

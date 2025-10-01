#!/usr/bin/env python3
"""
Phase 3B Property Analyzer - Extract and rank missing property errors

Analyzes TS2339 errors to identify top missing properties across the codebase.
Generates actionable report for systematic property addition.

STANDARDS:
- ASCII only (no Unicode)
- NASA Rule 10 compliant
- Production quality code
- Version footer mandatory
"""

import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Set


class PropertyAnalyzer:
    """Analyzes TypeScript compilation errors for missing properties"""

    def __init__(self):
        self.property_errors: Dict[str, List[Tuple[str, int]]] = defaultdict(list)
        self.type_errors: Dict[str, Set[str]] = defaultdict(set)
        self.total_ts2339 = 0

    def compile_typescript(self) -> str:
        """Run TypeScript compiler and capture errors"""
        print("[1/5] Compiling TypeScript to extract TS2339 errors...")
        try:
            result = subprocess.run(
                'npx tsc --noEmit',
                capture_output=True,
                text=True,
                timeout=180,
                shell=True
            )
            return result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            print("  [ERROR] TypeScript compilation timed out after 3 minutes")
            sys.exit(1)
        except Exception as e:
            print(f"  [ERROR] Failed to run TypeScript compiler: {e}")
            sys.exit(1)

    def parse_ts2339_errors(self, output: str) -> None:
        """Extract TS2339 property errors from compiler output"""
        print("[2/5] Parsing TS2339 'Property does not exist' errors...")

        # Pattern: file.ts(line,col): error TS2339: Property 'name' does not exist on type 'Type'.
        pattern = r"([^(]+)\((\d+),\d+\): error TS2339: Property '(\w+)' does not exist on type '([^']+)'"

        for match in re.finditer(pattern, output):
            file_path = match.group(1).strip()
            line_num = int(match.group(2))
            property_name = match.group(3)
            type_name = match.group(4)

            self.property_errors[property_name].append((file_path, line_num))
            self.type_errors[property_name].add(type_name)
            self.total_ts2339 += 1

        print(f"  [OK] Found {self.total_ts2339} TS2339 errors")
        print(f"  [OK] Identified {len(self.property_errors)} unique missing properties")

    def rank_properties(self) -> List[Tuple[str, int, Set[str], List[Tuple[str, int]]]]:
        """Rank properties by frequency (highest impact first)"""
        print("[3/5] Ranking properties by occurrence count...")

        ranked = [
            (prop, len(locs), types, locs)
            for prop, locs in self.property_errors.items()
            for types in [self.type_errors[prop]]
        ]

        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked

    def generate_report(self, ranked: List[Tuple[str, int, Set[str], List[Tuple[str, int]]]]) -> str:
        """Generate detailed analysis report"""
        print("[4/5] Generating analysis report...")

        report = [
            "# Phase 3B: Missing Property Analysis",
            "",
            f"**Total TS2339 Errors**: {self.total_ts2339}",
            f"**Unique Missing Properties**: {len(self.property_errors)}",
            "",
            "## Top 50 Missing Properties (Ranked by Impact)",
            "",
            "| Rank | Property Name | Occurrences | Affected Types | Sample Files |",
            "|-----:|---------------|------------:|----------------|--------------|"
        ]

        for rank, (prop, count, types, locations) in enumerate(ranked[:50], 1):
            types_str = ', '.join(sorted(types)[:3])
            if len(types) > 3:
                types_str += f" (+{len(types) - 3} more)"

            sample_files = list(set([Path(loc[0]).name for loc in locations[:3]]))
            files_str = ', '.join(sample_files)

            report.append(f"| {rank} | `{prop}` | {count} | {types_str} | {files_str} |")

        # Category analysis
        report.extend([
            "",
            "## Property Categories",
            ""
        ])

        categories = self._categorize_properties(ranked)
        for category, props in categories.items():
            total_count = sum(p[1] for p in props)
            report.append(f"### {category} ({total_count} errors, {len(props)} properties)")
            report.append("")
            for prop, count, _, _ in props[:10]:
                report.append(f"- `{prop}`: {count} occurrences")
            if len(props) > 10:
                report.append(f"- ... and {len(props) - 10} more")
            report.append("")

        # Implementation strategy
        report.extend([
            "## Implementation Strategy",
            "",
            "### Phase 3B-1: Core Properties (Top 20)",
            f"**Target**: {sum(p[1] for p in ranked[:20])} errors (~{int(sum(p[1] for p in ranked[:20]) / self.total_ts2339 * 100)}% of total)",
            "**Approach**: Add to core interfaces with proper types",
            "",
            "Properties to implement:",
            ""
        ])

        for rank, (prop, count, types, _) in enumerate(ranked[:20], 1):
            report.append(f"{rank}. `{prop}` ({count} errors) - Types: {', '.join(list(types)[:2])}")

        report.extend([
            "",
            "### Phase 3B-2: Facade Getters (Rank 21-50)",
            f"**Target**: {sum(p[1] for p in ranked[20:50])} errors",
            "**Approach**: Add stub getters returning default values",
            "",
            "### Phase 3B-3: Remaining Properties (Rank 51+)",
            f"**Target**: {sum(p[1] for p in ranked[50:])} errors",
            "**Approach**: Batch addition with type inference",
            ""
        ])

        return '\n'.join(report)

    def _categorize_properties(self, ranked: List[Tuple[str, int, Set[str], List[Tuple[str, int]]]]) -> Dict[str, List]:
        """Categorize properties by naming patterns"""
        categories = {
            'Analysis Results': [],
            'Configuration': [],
            'State Management': [],
            'Metrics & Stats': [],
            'Validation': [],
            'Relationships': [],
            'Timestamps': [],
            'Other': []
        }

        for prop, count, types, locs in ranked:
            prop_lower = prop.lower()

            if any(x in prop_lower for x in ['analysis', 'result', 'report', 'plan']):
                categories['Analysis Results'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['config', 'option', 'setting']):
                categories['Configuration'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['state', 'status', 'phase', 'mode']):
                categories['State Management'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['count', 'total', 'metric', 'score']):
                categories['Metrics & Stats'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['valid', 'check', 'verify']):
                categories['Validation'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['parent', 'child', 'dependency']):
                categories['Relationships'].append((prop, count, types, locs))
            elif any(x in prop_lower for x in ['time', 'date', 'timestamp']):
                categories['Timestamps'].append((prop, count, types, locs))
            else:
                categories['Other'].append((prop, count, types, locs))

        return {k: v for k, v in categories.items() if v}

    def save_report(self, report: str, output_path: Path) -> None:
        """Save report to file"""
        print(f"[5/5] Saving report to {output_path}...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"  [OK] Report saved ({len(report)} bytes)")


def main():
    """Main execution"""
    print("Phase 3B Property Analyzer")
    print("=" * 60)

    analyzer = PropertyAnalyzer()

    # Step 1-2: Compile and parse
    output = analyzer.compile_typescript()
    analyzer.parse_ts2339_errors(output)

    if analyzer.total_ts2339 == 0:
        print("\n[SUCCESS] No TS2339 errors found!")
        return 0

    # Step 3-4: Rank and report
    ranked = analyzer.rank_properties()
    report = analyzer.generate_report(ranked)

    # Step 5: Save
    output_path = Path('.claude/.artifacts/phase3b-property-analysis.md')
    analyzer.save_report(report, output_path)

    print("\n" + "=" * 60)
    print("Analysis Complete")
    print("=" * 60)
    print(f"Total TS2339 Errors: {analyzer.total_ts2339}")
    print(f"Unique Properties: {len(analyzer.property_errors)}")
    print(f"Top 20 Properties: {sum(p[1] for p in ranked[:20])} errors")
    print(f"Report: {output_path}")
    print("\nNext: Run property addition script to fix top 20 properties")

    return 0


if __name__ == '__main__':
    sys.exit(main())


# Version & Run Log
# Version: 1.0.0
# Timestamp: 2025-10-01T18:15:00-04:00
# Agent: assistant@claude-sonnet-4-5
# Change: Initial implementation of Phase 3B property analyzer
# Artifacts: scripts/analyze-missing-properties.py
# Status: OK
# Notes: Analyzes TS2339 errors, ranks by impact, generates actionable report
# Cost: 0.00
# Hash: a1b2c3d

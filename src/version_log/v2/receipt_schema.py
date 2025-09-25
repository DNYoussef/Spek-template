"""
Receipt Schema v2.0 - Enhanced with Ops Kit Specification
Tracks every agent interaction with full audit trail
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import json

from dataclasses import dataclass, field, asdict
import uuid

@dataclass
class ModelInfo:
    """Model used in the turn"""
    name: str
    version: Optional[str] = None
    platform: Optional[str] = None

@dataclass
class CostInfo:
    """Cost tracking for the turn"""
    usd: float
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cache_hits: int = 0
    cache_misses: int = 0

@dataclass
class Mutation:
    """Document/artifact mutation record"""
    type: str  # PRD, Task, InterviewScore, etc
    id: str
    version: int
    operation: str = "update"  # create, update, delete

@dataclass
class Receipt:
    """
    Non-negotiable per-turn receipt
    Must be emitted, stored, and surfaced for every agent interaction
    """
    turn_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "OK"  # OK | PARTIAL | BLOCKED
    reason_if_blocked: Optional[str] = None
    mutations: List[Mutation] = field(default_factory=list)
    models: List[ModelInfo] = field(default_factory=list)
    tools_used: List[str] = field(default_factory=list)
    inputs: List[str] = field(default_factory=list)
    cost: Optional[CostInfo] = None
    ts: str = field(default_factory=lambda: datetime.now().astimezone().isoformat())

    # Extended metadata
    run_id: Optional[str] = None
    versions: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    coverage_score: Optional[float] = None
    confidence_score: Optional[float] = None

    def to_json(self) -> str:
        """Convert to JSON string"""
        data = asdict(self)
        # Handle nested dataclasses
        if self.cost:
            data['cost'] = asdict(self.cost)
        data['models'] = [asdict(m) for m in self.models]
        data['mutations'] = [asdict(m) for m in self.mutations]
        return json.dumps(data, indent=2)

    def to_footer_receipt(self) -> str:
        """Convert to footer receipt format"""
        lines = [
            "### Receipt",
            f"- `status`: {self.status}",
            f"- `reason_if_blocked`: {self.reason_if_blocked or '--'}",
            f"- `run_id`: {self.run_id or self.turn_id[:8]}",
            f"- `inputs`: {json.dumps(self.inputs)}",
            f"- `tools_used`: {json.dumps(self.tools_used)}",
            f"- `versions`: {json.dumps(self.versions)}"
        ]
        if self.warnings:
            lines.append(f"- `warnings`: {json.dumps(self.warnings)}")
        return "\n".join(lines)

    def validate(self) -> List[str]:
        """Validate receipt completeness"""
        issues = []

        if self.status not in ["OK", "PARTIAL", "BLOCKED"]:
            issues.append(f"Invalid status: {self.status}")

        if self.status == "BLOCKED" and not self.reason_if_blocked:
            issues.append("BLOCKED status requires reason_if_blocked")

        if not self.models:
            issues.append("At least one model must be specified")

        if self.cost and self.cost.usd < 0:
            issues.append("Cost cannot be negative")

        return issues

@dataclass
class FooterRow:
    """Single row in the Version & Run Log table"""
    version: str
    timestamp: str
    agent_model: str
    change_summary: str
    artifacts_changed: List[str]
    status: str
    warnings_notes: str
    cost_usd: float
    content_hash: str

    def to_table_row(self) -> str:
        """Format as markdown table row"""
        artifacts = ", ".join(self.artifacts_changed) if self.artifacts_changed else "--"
        return (
            f"| {self.version} | {self.timestamp} | {self.agent_model} | "
            f"{self.change_summary[:80]} | {artifacts} | {self.status} | "
            f"{self.warnings_notes} | {self.cost_usd:.2f} | {self.content_hash} |"
        )

class FooterMarkers:
    """Footer boundary markers for different file types"""

    UNIVERSAL_BEGIN = "AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE"
    UNIVERSAL_END = "AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE"

    MARKERS = {
        'html': {
            'open': '<!-- [SECURE]',
            'close': '-->',
            'begin': f'<!-- [SECURE] {UNIVERSAL_BEGIN} -->',
            'end': f'<!-- [SECURE] {UNIVERSAL_END} -->'
        },
        'python': {
            'open': '# =====',
            'close': '# =====',
            'begin': f'# ===== {UNIVERSAL_BEGIN} =====',
            'end': f'# ===== {UNIVERSAL_END} ====='
        },
        'js': {
            'open': '/*',
            'close': '*/',
            'begin': f'/* {UNIVERSAL_BEGIN} */',
            'end': f'/* {UNIVERSAL_END} */'
        },
        'sql': {
            'open': '--',
            'close': '',
            'begin': f'-- {UNIVERSAL_BEGIN}',
            'end': f'-- {UNIVERSAL_END}'
        }
    }

    @classmethod
    def get_markers(cls, file_extension: str) -> Dict[str, str]:
        """Get appropriate markers for file type"""
        ext_map = {
            '.md': 'html',
            '.html': 'html',
            '.xml': 'html',
            '.py': 'python',
            '.pyw': 'python',
            '.js': 'js',
            '.ts': 'js',
            '.jsx': 'js',
            '.tsx': 'js',
            '.java': 'js',
            '.c': 'js',
            '.cpp': 'js',
            '.h': 'js',
            '.go': 'js',
            '.sql': 'sql',
            '.yaml': 'python',
            '.yml': 'python',
            '.sh': 'python',
            '.bash': 'python',
            '.zsh': 'python',
            '.tf': 'python',
            '.rb': 'python',
            '.r': 'python'
        }

        style = ext_map.get(file_extension.lower(), 'python')
        return cls.MARKERS.get(style, cls.MARKERS['python'])
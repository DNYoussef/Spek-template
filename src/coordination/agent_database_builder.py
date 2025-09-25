"""Agent Database Builder - Builder Pattern Implementation"""

from typing import Dict, List, Any

from dataclasses import dataclass, field
from threading import Lock

@dataclass(frozen=True)
class AgentConfig:
    """Immutable agent configuration."""
    agent_type: str
    specialties: List[str]
    complexity_rating: str
    parallel_capable: bool
    skill_areas: List[str]
    mcp_servers: List[str] = field(default_factory=list)

class AgentConfigBuilder:
    """Builder for agent configurations."""

    def __init__(self, agent_type: str):
        self._agent_type = agent_type
        self._specialties: List[str] = []
        self._complexity = "medium"
        self._parallel = True
        self._skills: List[str] = []

    def with_specialties(self, *specialties: str) -> 'AgentConfigBuilder':
        """Add agent specialties."""
        self._specialties.extend(specialties)
        return self

    def with_complexity(self, rating: str) -> 'AgentConfigBuilder':
        """Set complexity rating."""
        self._complexity = rating
        return self

    def parallel_capable(self, capable: bool = True) -> 'AgentConfigBuilder':
        """Set parallel execution capability."""
        self._parallel = capable
        return self

    def with_skills(self, *skills: str) -> 'AgentConfigBuilder':
        """Add skill areas."""
        self._skills.extend(skills)
        return self

    def build(self) -> AgentConfig:
        """Build agent configuration."""
        if not self._specialties:
            raise ValueError("At least one specialty required")
        if not self._skills:
            raise ValueError("At least one skill area required")

        return AgentConfig(
            agent_type=self._agent_type,
            specialties=self._specialties,
            complexity_rating=self._complexity,
            parallel_capable=self._parallel,
            skill_areas=self._skills
        )

@dataclass
class MCPCompatibility:
    """MCP server compatibility configuration."""
    agent_type: str
    mcp_servers: List[str]

class MCPCompatibilityBuilder:
    """Builder for MCP compatibility."""

    def __init__(self, agent_type: str):
        self._agent_type = agent_type
        self._mcp_servers: List[str] = ["memory", "sequential-thinking"]

    def with_mcp_servers(self, *servers: str) -> 'MCPCompatibilityBuilder':
        """Add MCP servers."""
        self._mcp_servers.extend(servers)
        return self

    def build(self) -> MCPCompatibility:
        """Build MCP compatibility."""
        return MCPCompatibility(
            agent_type=self._agent_type,
            mcp_servers=list(set(self._mcp_servers))  # Remove duplicates
        )

def _initialize_agent_database() -> Dict[str, AgentConfig]:
    """Initialize agent database using builder."""
    agents = {}

    # Core development agent
    agents["coder"] = (
        AgentConfigBuilder("development")
        .with_specialties("code_implementation", "bug_fixes", "feature_development")
        .with_complexity("medium")
        .parallel_capable(True)
        .with_skills("javascript", "python", "typescript", "general_coding")
        .build()
    )

    # Quality agent
    agents["reviewer"] = (
        AgentConfigBuilder("quality")
        .with_specialties("code_review", "quality_assessment", "best_practices")
        .with_complexity("high")
        .parallel_capable(True)
        .with_skills("code_quality", "security_review", "architecture_review")
        .build()
    )

    return agents

def _initialize_mcp_compatibility() -> Dict[str, MCPCompatibility]:
    """Initialize MCP compatibility using builder."""
    compatibility = {}

    # Development agents
    compatibility["development"] = (
        MCPCompatibilityBuilder("development")
        .with_mcp_servers("context7", "ref")
        .build()
    )

    # Quality agents
    compatibility["quality"] = (
        MCPCompatibilityBuilder("quality")
        .with_mcp_servers("ref")
        .build()
    )

    return compatibility
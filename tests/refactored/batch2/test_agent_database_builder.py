"""Tests for Agent Database Builder"""

from src.coordination.agent_database_builder import (
import pytest

class TestAgentConfigBuilder:
    """Test AgentConfigBuilder class."""

    def test_builder_creates_valid_agent(self):
        """Test builder creates valid agent configuration."""
        agent = (
            AgentConfigBuilder("development")
            .with_specialties("coding", "testing")
            .with_complexity("high")
            .parallel_capable(True)
            .with_skills("python", "javascript")
            .build()
        )

        assert agent.agent_type == "development"
        assert len(agent.specialties) == 2
        assert agent.complexity_rating == "high"
        assert agent.parallel_capable is True

    def test_builder_validates_specialties(self):
        """Test builder validates specialties."""
        builder = AgentConfigBuilder("test")

        with pytest.raises(ValueError, match="At least one specialty required"):
            builder.with_skills("skill1").build()

    def test_builder_validates_skills(self):
        """Test builder validates skills."""
        builder = AgentConfigBuilder("test")

        with pytest.raises(ValueError, match="At least one skill area required"):
            builder.with_specialties("spec1").build()

    def test_initialize_agent_database(self):
        """Test _initialize_agent_database returns valid dict."""
        agents = _initialize_agent_database()

        assert isinstance(agents, dict)
        assert len(agents) >= 2
        assert "coder" in agents
        assert "reviewer" in agents

    def test_agents_have_correct_structure(self):
        """Test agents have correct structure."""
        agents = _initialize_agent_database()

        for name, config in agents.items():
            assert isinstance(config, AgentConfig)
            assert config.agent_type
            assert len(config.specialties) > 0
            assert len(config.skill_areas) > 0
            assert config.complexity_rating in ["low", "medium", "high"]

class TestMCPCompatibilityBuilder:
    """Test MCPCompatibilityBuilder class."""

    def test_builder_creates_compatibility(self):
        """Test builder creates MCP compatibility."""
        compat = (
            MCPCompatibilityBuilder("development")
            .with_mcp_servers("context7", "ref")
            .build()
        )

        assert compat.agent_type == "development"
        assert "memory" in compat.mcp_servers  # Default
        assert "context7" in compat.mcp_servers

    def test_builder_removes_duplicates(self):
        """Test builder removes duplicate MCP servers."""
        compat = (
            MCPCompatibilityBuilder("test")
            .with_mcp_servers("memory", "memory", "ref")
            .build()
        )

        assert compat.mcp_servers.count("memory") == 1

    def test_initialize_mcp_compatibility(self):
        """Test _initialize_mcp_compatibility returns valid dict."""
        compat = _initialize_mcp_compatibility()

        assert isinstance(compat, dict)
        assert "development" in compat
        assert "quality" in compat

    def test_all_compat_have_base_servers(self):
        """Test all compatibility configs have base MCP servers."""
        compat = _initialize_mcp_compatibility()

        for agent_type, config in compat.items():
            assert "memory" in config.mcp_servers
            assert "sequential-thinking" in config.mcp_servers

class TestAgentIntegration:
    """Test agent database integration."""

    def test_coder_agent_configuration(self):
        """Test coder agent has correct configuration."""
        agents = _initialize_agent_database()
        coder = agents["coder"]

        assert coder.agent_type == "development"
        assert coder.parallel_capable is True
        assert "python" in coder.skill_areas

    def test_reviewer_agent_configuration(self):
        """Test reviewer agent has correct configuration."""
        agents = _initialize_agent_database()
        reviewer = agents["reviewer"]

        assert reviewer.agent_type == "quality"
        assert reviewer.complexity_rating == "high"
        assert "code_review" in reviewer.specialties
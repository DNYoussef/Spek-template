"""
Integrations package for the connascence analyzer.
Provides integration capabilities with external tools and services.
"""

# Import Phase 1 implementations
try:
    from .github_bridge import GitHubBridge, GitHubConfig, integrate_with_workflow
    tool_coordinator = None  # Placeholder for tool_coordinator
except ImportError:
    GitHubBridge = None
    GitHubConfig = None
    integrate_with_workflow = None
    tool_coordinator = None

__version__ = "2.0.0"
__all__ = ["GitHubBridge", "GitHubConfig", "integrate_with_workflow", "tool_coordinator"]
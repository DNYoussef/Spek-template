"""
Integrations package for the connascence analyzer.
Provides integration capabilities with external tools and services.
"""

# Import Phase 1 implementations
try:
    from .github_bridge import GitHubBridge, GitHubConfig, integrate_with_workflow
    GITHUB_BRIDGE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: GitHub bridge import failed: {e}")
    GITHUB_BRIDGE_AVAILABLE = False

__version__ = "2.0.0"
__all__ = ["GitHubBridge", "GitHubConfig", "integrate_with_workflow", "tool_coordinator"]
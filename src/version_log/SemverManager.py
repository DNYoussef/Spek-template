"""
SemverManager Module - Intelligent semantic versioning management
Handles version bumping based on change types and maintains version history
"""

from typing import Optional, Tuple, Dict, Any
import re

from enum import Enum

class ChangeType(Enum):
    """Types of changes that affect versioning"""
    NO_CHANGE = "no_change"      # No material change (idempotent)
    PATCH = "patch"               # Bug fixes, minor content changes
    MINOR = "minor"               # New features, schema changes
    MAJOR = "major"               # Breaking changes

class SemverManager:
    """Manages semantic versioning for tracked files"""

    def __init__(self):
        """Initialize the semver manager"""
        self.version_pattern = re.compile(r'^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$')
        self.initial_version = "1.0.0"

    def parse_version(self, version: str) -> Optional[Tuple[int, int, int, Optional[str]]]:
        """
        Parse a semantic version string

        Args:
            version: Version string (e.g., "1.2.3" or "1.2.3-beta")

        Returns:
            Tuple of (major, minor, patch, prerelease) or None if invalid
        """
        match = self.version_pattern.match(version)
        if match:
            major, minor, patch = map(int, match.groups()[:3])
            prerelease = match.group(4)
            return (major, minor, patch, prerelease)
        return None

    def format_version(self, major: int, minor: int, patch: int, prerelease: Optional[str] = None) -> str:
        """
        Format version components into string

        Args:
            major: Major version number
            minor: Minor version number
            patch: Patch version number
            prerelease: Optional prerelease identifier

        Returns:
            Formatted version string
        """
        version = f"{major}.{minor}.{patch}"
        if prerelease:
            version += f"-{prerelease}"
        return version

    def bump_version(self, current_version: str, change_type: ChangeType) -> str:
        """
        Bump version based on change type

        Args:
            current_version: Current version string
            change_type: Type of change being made

        Returns:
            New version string
        """
        # Parse current version or use initial if invalid
        parsed = self.parse_version(current_version)
        if not parsed:
            parsed = self.parse_version(self.initial_version)
            if not parsed:
                return self.initial_version

        major, minor, patch, prerelease = parsed

        # Apply version bump based on change type
        if change_type == ChangeType.NO_CHANGE:
            # No version change for idempotent operations
            pass  # Explicitly handle NO_CHANGE case
        elif change_type == ChangeType.PATCH:
            patch += 1
        elif change_type == ChangeType.MINOR:
            minor += 1
            patch = 0  # Reset patch on minor bump
        elif change_type == ChangeType.MAJOR:
            major += 1
            minor = 0  # Reset minor on major bump
            patch = 0  # Reset patch on major bump

        # Clear prerelease on any bump
        if change_type != ChangeType.NO_CHANGE:
            prerelease = None

        return self.format_version(major, minor, patch, prerelease)

    def detect_change_type(self, old_content: str, new_content: str, metadata: Dict[str, Any] = None) -> ChangeType:
        """
        Intelligently detect the type of change made

        Args:
            old_content: Previous content
            new_content: New content
            metadata: Optional metadata about the change

        Returns:
            Detected change type
        """
        # If content identical, no change
        if old_content == new_content:
            return ChangeType.NO_CHANGE

        # Check metadata hints if provided
        if metadata:
            if metadata.get('breaking_change', False):
                return ChangeType.MAJOR
            if metadata.get('new_feature', False):
                return ChangeType.MINOR
            if metadata.get('schema_change', False):
                return ChangeType.MINOR

        # Analyze content changes
        old_lines = set(old_content.splitlines())
        new_lines = set(new_content.splitlines())

        added_lines = new_lines - old_lines
        removed_lines = old_lines - new_lines

        # Heuristics for change detection
        if self._has_breaking_changes(added_lines, removed_lines):
            return ChangeType.MAJOR
        elif self._has_schema_changes(added_lines, removed_lines):
            return ChangeType.MINOR
        elif self._has_feature_additions(added_lines):
            return ChangeType.MINOR
        else:
            return ChangeType.PATCH

    def _has_breaking_changes(self, added: set, removed: set) -> bool:
        """
        Check for breaking changes in content

        Args:
            added: Set of added lines
            removed: Set of removed lines

        Returns:
            True if breaking changes detected
        """
        breaking_patterns = [
            r'class\s+\w+',           # Class definition changes
            r'def\s+\w+\([^)]*\)',    # Function signature changes
            r'interface\s+\w+',        # Interface changes
            r'type\s+\w+',            # Type definition changes
            r'export\s+',             # Export changes
            r'import\s+',             # Import structure changes
        ]

        # Check if any critical patterns were removed
        for line in removed:
            for pattern in breaking_patterns:
                if re.search(pattern, line):
                    return True

        return False

    def _has_schema_changes(self, added: set, removed: set) -> bool:
        """
        Check for schema or structure changes

        Args:
            added: Set of added lines
            removed: Set of removed lines

        Returns:
            True if schema changes detected
        """
        schema_patterns = [
            r'"[^"]+"\s*:',           # JSON schema fields
            r'\w+\s*:.*,?$',         # Object properties
            r'CREATE TABLE',          # Database schema
            r'ALTER TABLE',           # Schema modifications
            r'struct\s+\w+',         # Struct definitions
        ]

        for line in added.union(removed):
            for pattern in schema_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    return True

        return False

    def _has_feature_additions(self, added: set) -> bool:
        """
        Check for new feature additions

        Args:
            added: Set of added lines

        Returns:
            True if new features detected
        """
        feature_patterns = [
            r'def\s+\w+',            # New functions
            r'class\s+\w+',          # New classes
            r'async\s+\w+',          # New async functions
            r'export\s+function',     # New exported functions
            r'public\s+\w+',         # New public methods
        ]

        for line in added:
            for pattern in feature_patterns:
                if re.search(pattern, line):
                    return True

        # If significant additions but no clear features, still minor
        return len(added) > 20

    def compare_versions(self, version1: str, version2: str) -> int:
        """
        Compare two version strings

        Args:
            version1: First version
            version2: Second version

        Returns:
            -1 if version1 < version2, 0 if equal, 1 if version1 > version2
        """
        v1 = self.parse_version(version1)
        v2 = self.parse_version(version2)

        if not v1 or not v2:
            return 0

        # Compare major, minor, patch
        for i in range(3):
            if v1[i] < v2[i]:
                return -1
            elif v1[i] > v2[i]:
                return 1

        # Versions are equal in numbers
        return 0

    def get_next_version(self, current_version: str, content_hash: str, previous_hash: str) -> Tuple[str, ChangeType]:
        """
        Determine next version based on content changes

        Args:
            current_version: Current version string
            content_hash: New content hash
            previous_hash: Previous content hash

        Returns:
            Tuple of (new_version, change_type)
        """
        # If hashes match, no change needed
        if content_hash == previous_hash:
            return (current_version, ChangeType.NO_CHANGE)

        # Default to patch change for content modifications
        change_type = ChangeType.PATCH
        new_version = self.bump_version(current_version, change_type)

        return (new_version, change_type)
"""
ContentHasher Module - Deterministic content hashing for version tracking
Provides consistent SHA-256 based hashing with 7-character representation
"""

from typing import Optional
import hashlib
import re

class ContentHasher:
    """Deterministic content hasher for file versioning"""

    # Footer markers for different file types
    FOOTER_MARKERS = {
        'default': {
            'begin': 'AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
            'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE'
        },
        'html_comment': {
            'begin': '<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->',
            'end': '<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->'
        },
        'python_comment': {
            'begin': '# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====',
            'end': '# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE ====='
        },
        'js_comment': {
            'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */',
            'end': '/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */'
        }
    }

    def __init__(self):
        """Initialize the content hasher"""
        self.hash_length = 7  # Use 7 characters for hash representation

    def compute_hash(self, content: str, exclude_footer: bool = True) -> str:
        """
        Compute deterministic hash of content

        Args:
            content: File content to hash
            exclude_footer: Whether to exclude footer from hash calculation

        Returns:
            7-character hash string
        """
        if exclude_footer:
            content = self.strip_footer(content)

        # Normalize content for consistent hashing
        normalized = self.normalize_content(content)

        # Compute SHA-256 hash
        hash_obj = hashlib.sha256(normalized.encode('utf-8'))
        full_hash = hash_obj.hexdigest()

        # Return first 7 characters
        return full_hash[:self.hash_length]

    def strip_footer(self, content: str) -> str:
        """
        Remove footer section from content

        Args:
            content: Full file content

        Returns:
            Content without footer section
        """
        # Try different marker patterns
        for marker_type, markers in self.FOOTER_MARKERS.items():
            begin_idx = content.find(markers['begin'])
            if begin_idx == -1:
                continue

            # Find the actual start of the footer comment
            actual_start = begin_idx

            # Check for hash comment (Python, Shell, YAML, etc.)
            if marker_type == 'python_comment' or '# =====' in markers['begin']:
                # For hash comments, go back to start of line
                actual_start = content.rfind('\n', 0, begin_idx)
                if actual_start == -1:
                    actual_start = 0
            elif marker_type == 'html_comment' or '<!--' in markers['begin']:
                actual_start = content.rfind('<!--', 0, begin_idx)
                if actual_start == -1:
                    actual_start = begin_idx
            elif marker_type == 'js_comment' or '/*' in markers['begin']:
                actual_start = content.rfind('/*', 0, begin_idx)
                if actual_start == -1:
                    actual_start = begin_idx

            # Return content before footer
            return content[:actual_start].rstrip()

        # If no footer found, return original content
        return content

    def normalize_content(self, content: str) -> str:
        """
        Normalize content for consistent hashing

        Args:
            content: Content to normalize

        Returns:
            Normalized content
        """
        # Convert line endings to Unix style
        normalized = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove trailing whitespace from each line
        lines = normalized.split('\n')
        lines = [line.rstrip() for line in lines]

        # Remove trailing empty lines
        while lines and not lines[-1]:
            lines.pop()

        # Rejoin with consistent line endings
        return '\n'.join(lines)

    def verify_hash(self, content: str, expected_hash: str) -> bool:
        """
        Verify content matches expected hash

        Args:
            content: Content to verify
            expected_hash: Expected hash value

        Returns:
            True if hash matches, False otherwise
        """
        actual_hash = self.compute_hash(content)
        return actual_hash == expected_hash

    def find_footer_bounds(self, content: str) -> Optional[tuple[int, int]]:
        """
        Find the start and end positions of footer in content

        Args:
            content: File content

        Returns:
            Tuple of (start, end) positions, or None if not found
        """
        for marker_type, markers in self.FOOTER_MARKERS.items():
            begin_idx = content.find(markers['begin'])
            if begin_idx == -1:
                continue

            end_idx = content.find(markers['end'], begin_idx)
            if end_idx == -1:
                continue

            # Find actual boundaries including comment markers
            actual_start = content.rfind('<!--', 0, begin_idx)
            if actual_start == -1:
                actual_start = content.rfind('#', 0, begin_idx)
            if actual_start == -1:
                actual_start = content.rfind('/*', 0, begin_idx)
            if actual_start == -1:
                actual_start = begin_idx

            actual_end = content.find('-->', end_idx)
            if actual_end == -1:
                actual_end = content.find('\n', end_idx)
            if actual_end == -1:
                actual_end = content.find('*/', end_idx)
            if actual_end == -1:
                actual_end = end_idx + len(markers['end'])
            else:
                actual_end += 3  # Include closing marker

            return (actual_start, actual_end)

        return None

    def extract_footer(self, content: str) -> Optional[str]:
        """
        Extract footer section from content

        Args:
            content: File content

        Returns:
            Footer content or None if not found
        """
        bounds = self.find_footer_bounds(content)
        if bounds:
            return content[bounds[0]:bounds[1]]
        return None
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

from src.version_log import ContentHasher

hasher = ContentHasher()

content = "This is test content\nWith multiple lines\n"
content_with_footer = content + """
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:3 | test@Model | Test | -- | OK | -- | 0.00 | abcdefg |
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->"""

print("Original content:")
print(repr(content))
print("\nContent with footer:")
print(repr(content_with_footer))
print("\nStripped content:")
stripped = hasher.strip_footer(content_with_footer)
print(repr(stripped))
print("\nExpected:")
print(repr(content.rstrip()))
print("\nMatch:", stripped == content.rstrip())
#!/usr/bin/env python3
"""
Pre-commit Footer Verifier v2.0
Fast guard validation for Version & Run Log footers
"""

import subprocess
import pathlib
import re
import sys
import hashlib
from typing import Tuple, Optional

BEGIN = "AGENT FOOTER BEGIN"
END = "AGENT FOOTER END"

def norm(s: str) -> str:
    """Normalize content for hashing"""
    return s.replace("\r\n", "\n").rstrip()

def shash(s: str) -> str:
    """Compute 7-char SHA256 hash"""
    return hashlib.sha256(norm(s).encode()).hexdigest()[:7]

def split_content(txt: str) -> Tuple[str, Optional[str]]:
    """Split content into body and footer"""
    if BEGIN not in txt or END not in txt:
        return txt, None

    # Find markers
    patterns = [
        (r"<!--.*?" + BEGIN + r".*?-->", r"<!--.*?" + END + r".*?-->"),
        (r"#.*?" + BEGIN + r".*", r"#.*?" + END + r".*"),
        (r"/\*.*?" + BEGIN + r".*?\*/", r"/\*.*?" + END + r".*?\*/"),
        (r"--.*?" + BEGIN + r".*", r"--.*?" + END + r".*")
    ]

    for begin_pat, end_pat in patterns:
        begin_match = re.search(begin_pat, txt, re.DOTALL)
        if begin_match:
            end_match = re.search(end_pat, txt[begin_match.start():], re.DOTALL)
            if end_match:
                footer_start = begin_match.start()
                footer_end = begin_match.start() + end_match.end()
                body = txt[:footer_start].rstrip()
                footer = txt[footer_start:footer_end]
                return body, footer

    return txt, None

def check(path: str) -> int:
    """Check single file for valid footer"""
    try:
        txt = pathlib.Path(path).read_text(encoding="utf-8")
    except Exception as e:
        print(f"[ERROR] Cannot read {path}: {e}")
        return 1

    body, footer = split_content(txt)

    if not footer:
        # Some files may not need footers (e.g., config files)
        # Only fail if file has agent-generated patterns
        agent_patterns = [
            "Agent/Model",
            "Change Summary",
            "Content Hash",
            "TK CONFIRM"
        ]
        if any(pattern in txt for pattern in agent_patterns):
            print(f"[FAIL] Agent-modified file missing footer: {path}")
            return 1
        return 0

    # Extract rows from footer
    rows = []
    for line in footer.splitlines():
        line = line.strip()
        if line.startswith("|") and "Version" not in line and "---" not in line:
            rows.append(line)

    if not rows:
        print(f"[FAIL] Footer has no data rows: {path}")
        return 1

    # Parse last row for hash validation
    last_row = rows[-1]
    cells = [c.strip() for c in last_row.split("|")[1:-1]]

    if len(cells) < 9:
        print(f"[FAIL] Malformed footer row: {path}")
        return 1

    table_hash = cells[8]  # Content Hash column
    real_hash = shash(body)

    if table_hash != real_hash:
        print(f"[FAIL] Hash mismatch in {path}: table={table_hash} real={real_hash}")
        return 1

    # Check row count
    if len(rows) > 20:
        print(f"[FAIL] Too many footer rows ({len(rows)} > 20): {path}")
        return 1

    # Check for required receipt fields
    if "### Receipt" not in footer:
        print(f"[FAIL] Missing receipt section: {path}")
        return 1

    receipt_required = ["status:", "run_id:", "inputs:", "tools_used:"]
    for field in receipt_required:
        if field not in footer:
            print(f"[FAIL] Missing receipt field '{field}': {path}")
            return 1

    # Validate status value
    status_match = re.search(r"`status`:\s*(\w+)", footer)
    if status_match:
        status = status_match.group(1)
        if status not in ["OK", "PARTIAL", "BLOCKED"]:
            print(f"[FAIL] Invalid status '{status}': {path}")
            return 1
    else:
        print(f"[FAIL] Cannot parse status: {path}")
        return 1

    # Check for TK CONFIRM in OK status
    if "TK CONFIRM" in txt and status == "OK":
        print(f"[FAIL] File has 'TK CONFIRM' but status is OK: {path}")
        return 1

    return 0

def main():
    """Check all staged files"""
    # File extensions that should have footers if agent-modified
    checkable_exts = (
        ".md", ".py", ".ts", ".js", ".jsx", ".tsx",
        ".go", ".java", ".c", ".cpp", ".h", ".hpp",
        ".yaml", ".yml", ".sql", ".tf", ".rb", ".rs"
    )

    try:
        # Get staged files
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            check=True
        )
        files = result.stdout.strip().split("\n") if result.stdout.strip() else []
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Git command failed: {e}")
        return 1

    if not files:
        return 0

    fail_count = 0
    checked_count = 0

    for f in files:
        if not f or not any(f.endswith(ext) for ext in checkable_exts):
            continue

        if not pathlib.Path(f).exists():
            continue

        checked_count += 1
        result = check(f)
        if result != 0:
            fail_count += 1

    if checked_count > 0:
        if fail_count == 0:
            print(f"[OK] Footer validation passed for {checked_count} file(s)")
        else:
            print(f"[FAIL] Footer validation failed for {fail_count}/{checked_count} file(s)")

    return 1 if fail_count > 0 else 0

if __name__ == "__main__":
    sys.exit(main())
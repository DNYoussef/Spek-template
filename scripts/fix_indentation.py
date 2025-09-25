#!/usr/bin/env python3
"""Fix indentation issues in theater-detector.py"""
import re

filepath = "src/theater-detection/theater-detector.py"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for i, line in enumerate(lines):
    # Check if current line starts with 'patterns.append' or similar and previous line was an if
    if i > 0:
        prev_line = lines[i-1].strip()
        curr_line = line.rstrip()

        # If previous line is an if statement and current line is patterns.append
        if prev_line.endswith(':') and 'if ' in prev_line:
            # Check if current line needs more indentation
            if curr_line.lstrip().startswith('patterns.append('):
                # Get current indentation
                curr_indent = len(curr_line) - len(curr_line.lstrip())
                prev_indent = len(lines[i-1]) - len(lines[i-1].lstrip())

                # Should be indented 4 spaces more than the if statement
                if curr_indent <= prev_indent:
                    # Add 4 spaces
                    fixed_lines.append('    ' + curr_line + '\n')
                    continue

    fixed_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print(f"Fixed indentation in {filepath}")
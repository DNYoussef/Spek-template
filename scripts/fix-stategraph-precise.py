#!/usr/bin/env python3
"""
Wave 5: Precise StateGraphFacade embedded declaration fixes
"""
import re

file_path = 'src/architecture/langgraph/StateGraphFacade.ts'

print('Fixing StateGraphFacade embedded declarations with Python...')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Fix 1: Line 151 - embedded declaration after assignment
content = re.sub(
    r'(this\._currentNodeId\s*=\s*targetNodeId;)const result:',
    r'\1\n      const result:',
    content
)

# Fix 2: Line 160 - embedded declaration after catch
content = re.sub(
    r'(\} catch \(error\) \{)const result:',
    r'\1\n      const result:',
    content
)

if content != original:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  ✓ Fixed embedded declarations')
else:
    print('  - No changes needed')

print('Done!')
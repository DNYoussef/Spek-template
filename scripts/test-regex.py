#!/usr/bin/env python3
import subprocess
import re

result = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True, timeout=120, shell=True)
output = result.stderr + result.stdout

# Test sample line
sample = '''src/architecture/langgraph/testing/FSMValidationSuite.ts(11,3): error TS2724: '"./types/ValidationFSM.types"' has no exported member named 'ValidationResult'. Did you mean 'FSMValidationResult'?'''

patterns = {
    'p1': r"""Module '([^']+)' has no exported member '(\w+)'""",
    'p2': r"""'([^']+)' has no exported member named '(\w+)'""",
}

for name, pattern in patterns.items():
    matches = re.findall(pattern, sample)
    print(f'{name}: {len(matches)} matches')
    if matches:
        print(f'  Sample: {matches}')

# Now test on full output
for name, pattern in patterns.items():
    matches = re.findall(pattern, output)
    print(f'\n{name} on full output: {len(matches)} matches')
    if matches:
        print(f'  First 3: {matches[:3]}')

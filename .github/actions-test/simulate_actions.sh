#!/bin/bash
# Simulate GitHub Actions environment
export CI=true
export GITHUB_ACTIONS=true
export GITHUB_WORKSPACE=/c/Users/17175/Desktop/spek\ template
export RUNNER_OS=Linux

# Test workflow commands
cd ../../analyzer
echo 'Testing NASA analysis...'
python core.py --path .. --policy nasa_jpl_pot10 --format json --output ../test_nasa.json

echo 'Testing data extraction...'
NASA_SCORE=$(python -c "import json; data=json.load(open('../test_nasa.json')); print(data.get('nasa_compliance', {}).get('score', 0.0))")
echo "NASA Score: $NASA_SCORE"

TOTAL_VIOLATIONS=$(python -c "import json; data=json.load(open('../test_nasa.json')); print(len(data.get('violations', [])))")
echo "Total Violations: $TOTAL_VIOLATIONS"

echo 'GitHub Actions simulation completed successfully'


#!/bin/bash
# Script to comment out imports for missing files
# Phase 1.1.2: Missing File Resolution

# Get all TS2307 errors
npx tsc --noEmit 2>&1 | grep "TS2307" | while read line; do
  file=$(echo "$line" | cut -d'(' -f1)
  linenum=$(echo "$line" | cut -d'(' -f2 | cut -d',' -f1)
  missing_module=$(echo "$line" | sed "s/.*Cannot find module '\([^']*\)'.*/\1/")
  
  echo "File: $file | Line: $linenum | Missing: $missing_module"
done > .missing-imports-log.txt

echo "Analysis complete. Found $(wc -l < .missing-imports-log.txt) import errors."
echo "Results in .missing-imports-log.txt"

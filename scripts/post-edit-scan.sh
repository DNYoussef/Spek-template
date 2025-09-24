#!/bin/bash
# Post-Edit Validation Script
# Automatically scan file after editing to prevent regressions

FILE=$1

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/post-edit-scan.sh <file-path>"
  exit 1
fi

echo "Scanning: $FILE"

# Run analysis using Python wrapper
python scripts/analyze-file.py "$FILE"
exit $?
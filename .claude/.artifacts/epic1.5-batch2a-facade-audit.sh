#!/bin/bash
# Epic 1.5 Batch 2A: Audit facade import errors and create fix mapping

echo "=== FACADE IMPORT ERROR ANALYSIS ===" > .claude/.artifacts/epic1.5-facade-audit.txt
echo "" >> .claude/.artifacts/epic1.5-facade-audit.txt

# Get all facade import errors
npx tsc --noEmit 2>&1 | grep "TS2307.*Facade'" | while read -r line; do
  # Extract file path and missing module
  file=$(echo "$line" | grep -oE "src/[^(]+")
  module=$(echo "$line" | grep -oE "Cannot find module '[^']+'" | sed "s/Cannot find module '//" | sed "s/'//")
  
  # Extract just the facade name
  facade_name=$(basename "$module" | sed 's/^.\///')
  
  # Find actual facade location
  actual_location=$(find src -name "${facade_name}.ts" 2>/dev/null | head -1)
  
  if [ -n "$actual_location" ]; then
    echo "FILE: $file" >> .claude/.artifacts/epic1.5-facade-audit.txt
    echo "  IMPORT: $module" >> .claude/.artifacts/epic1.5-facade-audit.txt
    echo "  ACTUAL: $actual_location" >> .claude/.artifacts/epic1.5-facade-audit.txt
    echo "" >> .claude/.artifacts/epic1.5-facade-audit.txt
  fi
done

wc -l .claude/.artifacts/epic1.5-facade-audit.txt

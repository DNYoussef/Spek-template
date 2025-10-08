#!/bin/bash
# Phase 1.3: Scan for Missing Facade Files
# Identifies broken facade chains where export points to non-existent file

echo "=== Phase 1.3: Missing Facade Scan ==="
echo ""

missing_count=0
found_count=0
declare -A missing_facades

# Find all files that export from a Facade
while IFS= read -r file; do
  # Extract the facade path from export statement
  facade_paths=$(grep "export \* from.*Facade" "$file" | sed "s/.*from ['\"]\\([^'\"]*\\)['\"].*/\\1/")

  for facade_rel in $facade_paths; do
    # Get directory of current file
    file_dir=$(dirname "$file")

    # Resolve relative path
    if [[ "$facade_rel" == ./* ]] || [[ "$facade_rel" == ../* ]]; then
      # Relative path - resolve it
      facade_full="$file_dir/$facade_rel"

      # Normalize path (remove ..)
      facade_full=$(cd "$file_dir" && cd "$(dirname "$facade_rel")" 2>/dev/null && pwd)/$(basename "$facade_rel")

      # Try with .ts extension
      if [ ! -f "${facade_full}.ts" ]; then
        echo "❌ MISSING: $file"
        echo "   Expects: ${facade_full}.ts"
        echo "   Pattern: export * from '$facade_rel'"
        echo ""
        missing_count=$((missing_count + 1))
        missing_facades["${facade_full}.ts"]=1
      else
        found_count=$((found_count + 1))
      fi
    fi
  done
done < <(grep -r "export \* from.*Facade" src/ --include="*.ts" -l)

echo "=== SUMMARY ==="
echo "Found facades: $found_count"
echo "Missing facades: $missing_count"
echo ""
echo "=== UNIQUE MISSING FACADE PATHS ==="
for facade in "${!missing_facades[@]}"; do
  echo "$facade"
done | sort

echo ""
echo "=== NEXT STEP ==="
echo "Run: .phase1.3-prioritize-facades.sh"

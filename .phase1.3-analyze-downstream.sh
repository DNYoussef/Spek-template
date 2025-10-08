#!/bin/bash
# Phase 1.3: Analyze Downstream Import Impact
# For each file with broken facade export, count how many files import FROM it

echo "=== Phase 1.3: Downstream Import Analysis ==="
echo ""

declare -A file_impact

# Get list of files with broken facade exports
broken_files=$(grep -r "export \* from.*Facade" src/ --include="*.ts" -l | while read file; do
  # Check if the facade it references exists
  facade_refs=$(grep "export \* from.*Facade" "$file" | sed "s/.*from ['\"]\\([^'\"]*\\)['\"].*/\\1/")

  for facade_rel in $facade_refs; do
    file_dir=$(dirname "$file")
    if [[ "$facade_rel" == ./* ]] || [[ "$facade_rel" == ../* ]]; then
      facade_full="$file_dir/$facade_rel"
      if [ ! -f "${facade_full}.ts" ] && [ ! -d "$facade_full" ]; then
        echo "$file"
        break
      fi
    fi
  done
done | sort -u)

echo "Analyzing downstream impact for broken facade exporters..."
echo ""

# For each broken file, count how many files import from it
while IFS= read -r broken_file; do
  if [ -n "$broken_file" ]; then
    # Convert absolute path to relative import pattern
    rel_path=$(echo "$broken_file" | sed 's|^src/||' | sed 's|\.ts$||')

    # Count files that import from this broken file
    count=$(grep -r "import.*from.*$rel_path" src/ --include="*.ts" | wc -l)

    if [ $count -gt 0 ]; then
      file_impact["$broken_file"]=$count
    fi
  fi
done <<< "$broken_files"

echo "=== TOP 30 HIGHEST DOWNSTREAM IMPACT ==="
echo "Rank | Imports | File Path"
echo "-----|---------|----------"

rank=1
for file in "${!file_impact[@]}"; do
  echo "${file_impact[$file]} $file"
done | sort -rn | head -30 | while read count filepath; do
  printf "%4d | %7d | %s\n" $rank $count "$filepath"
  rank=$((rank + 1))
done

echo ""
echo "=== BATCH 1 TARGETS (Top 20) ==="
rank=1
for file in "${!file_impact[@]}"; do
  echo "${file_impact[$file]} $file"
done | sort -rn | head -20 | while read count filepath; do
  # Extract just the filename base
  base=$(basename "$filepath" .ts)
  facade_name="${base}Facade"
  echo "$rank. $facade_name (from $filepath, fixes $count imports)"
  rank=$((rank + 1))
done

echo ""
echo "Total files with broken facade exports: $(echo "$broken_files" | wc -l)"
echo "Files with downstream impact: ${#file_impact[@]}"

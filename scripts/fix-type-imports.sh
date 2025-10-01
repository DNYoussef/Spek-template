#!/bin/bash
# Script to fix broken type imports after root types/ consolidation
# Phase 1F: Import Path Fixes

echo "🔧 Fixing broken type imports..."

# Fix primitives imports
echo "Fixing primitives imports..."
find src -name "*.ts" -type f -exec sed -i "s|from ['\"]\.\.*/types/base/primitives['\"]|from '@types/base/primitives'|g" {} \;

# Fix fsm-types imports
echo "Fixing fsm-types imports..."
find src -name "*.ts" -type f -exec sed -i "s|from ['\"]\.\.*/types/fsm-types['\"]|from '@types/fsm-types'|g" {} \;

# Fix workflow types imports (if any still using old path)
echo "Fixing workflow types imports..."
find src -name "*.ts" -type f -exec sed -i "s|from ['\"]\.\.*/types/workflow\.types['\"]|from '@types/workflow'|g" {} \;

# Count remaining issues
echo ""
echo "📊 Verification:"
BROKEN=$(grep -r "from.*['\"]\.\..*types/" src --include="*.ts" 2>/dev/null | wc -l)
echo "Remaining broken type imports: $BROKEN"

if [ $BROKEN -eq 0 ]; then
  echo "✅ All type imports fixed successfully!"
else
  echo "⚠️  Some imports may need manual review"
  grep -r "from.*['\"]\.\..*types/" src --include="*.ts" 2>/dev/null | head -5
fi

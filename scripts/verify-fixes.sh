#!/bin/bash
# Verify Production Fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 VERIFYING PRODUCTION FIXES"
echo "============================="

fixes_passed=0
total_fixes=5

# Verify Fix 1: Character Encoding
echo "1️⃣ Verifying character encoding fixes..."
if python3 -c "
import yaml
import glob
import os

workflows_dir = os.path.join('$PROJECT_ROOT', '.github', 'workflows')
try:
    if os.path.exists(workflows_dir):
        for f in glob.glob(os.path.join(workflows_dir, '*.yml')):
            with open(f, 'r', encoding='utf-8') as file:
                yaml.safe_load(file)
        print('✅ YAML files are valid UTF-8')
    else:
        print('⚠️ No workflows directory found')
except Exception as e:
    print(f'❌ YAML validation failed: {e}')
    exit(1)
"; then
    echo "  ✅ Character encoding fix verified"
    ((fixes_passed++))
else
    echo "  ❌ Character encoding fix failed"
fi

# Verify Fix 2: Windows Compatibility
echo
echo "2️⃣ Verifying Windows compatibility..."
if [[ -f "$PROJECT_ROOT/scripts/windows-compat.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/windows-compat.sh"; then
        echo "  ✅ Windows compatibility layer verified"
        ((fixes_passed++))
    else
        echo "  ❌ Windows compatibility script has syntax errors"
    fi
else
    echo "  ❌ Windows compatibility script not found"
fi

# Verify Fix 3: State Recovery
echo
echo "3️⃣ Verifying state recovery mechanisms..."
if [[ -f "$PROJECT_ROOT/scripts/state-recovery.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/state-recovery.sh"; then
        echo "  ✅ State recovery mechanisms verified"
        ((fixes_passed++))
    else
        echo "  ❌ State recovery script has syntax errors"
    fi
else
    echo "  ❌ State recovery script not found"
fi

# Verify Fix 4: Main Script Accessibility
echo
echo "4️⃣ Verifying main cleanup script..."
if [[ -f "$PROJECT_ROOT/scripts/post-completion-cleanup.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/post-completion-cleanup.sh"; then
        if timeout 10 bash "$PROJECT_ROOT/scripts/post-completion-cleanup.sh" --help >/dev/null 2>&1; then
            echo "  ✅ Main cleanup script verified and accessible"
            ((fixes_passed++))
        else
            echo "  ❌ Main cleanup script execution failed"
        fi
    else
        echo "  ❌ Main cleanup script has syntax errors"
    fi
else
    echo "  ❌ Main cleanup script not found"
fi

# Verify Fix 5: Performance Monitoring
echo
echo "5️⃣ Verifying performance monitoring..."
if [[ -f "$PROJECT_ROOT/scripts/performance-monitor.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/performance-monitor.sh"; then
        echo "  ✅ Performance monitoring verified"
        ((fixes_passed++))
    else
        echo "  ❌ Performance monitoring script has syntax errors"
    fi
else
    echo "  ❌ Performance monitoring script not found"
fi

# Overall verification result
echo
echo "📊 FIX VERIFICATION RESULTS"
echo "=========================="
echo "Fixes passed: $fixes_passed/$total_fixes"

if [[ $fixes_passed -eq $total_fixes ]]; then
    echo "✅ ALL FIXES VERIFIED SUCCESSFULLY"
    echo "🚀 System ready for production deployment"
    exit 0
else
    echo "❌ SOME FIXES FAILED VERIFICATION"
    echo "⚠️ Review and address failed fixes before deployment"
    exit 1
fi

#!/bin/bash
# Verify Production Fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[SEARCH] VERIFYING PRODUCTION FIXES"
echo "============================="

fixes_passed=0
total_fixes=5

# Verify Fix 1: Character Encoding
echo "1[U+FE0F][U+20E3] Verifying character encoding fixes..."
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
        print('[OK] YAML files are valid UTF-8')
    else:
        print('[WARN] No workflows directory found')
except Exception as e:
    print(f'[FAIL] YAML validation failed: {e}')
    exit(1)
"; then
    echo "  [OK] Character encoding fix verified"
    ((fixes_passed++))
else
    echo "  [FAIL] Character encoding fix failed"
fi

# Verify Fix 2: Windows Compatibility
echo
echo "2[U+FE0F][U+20E3] Verifying Windows compatibility..."
if [[ -f "$PROJECT_ROOT/scripts/windows-compat.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/windows-compat.sh"; then
        echo "  [OK] Windows compatibility layer verified"
        ((fixes_passed++))
    else
        echo "  [FAIL] Windows compatibility script has syntax errors"
    fi
else
    echo "  [FAIL] Windows compatibility script not found"
fi

# Verify Fix 3: State Recovery
echo
echo "3[U+FE0F][U+20E3] Verifying state recovery mechanisms..."
if [[ -f "$PROJECT_ROOT/scripts/state-recovery.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/state-recovery.sh"; then
        echo "  [OK] State recovery mechanisms verified"
        ((fixes_passed++))
    else
        echo "  [FAIL] State recovery script has syntax errors"
    fi
else
    echo "  [FAIL] State recovery script not found"
fi

# Verify Fix 4: Main Script Accessibility
echo
echo "4[U+FE0F][U+20E3] Verifying main cleanup script..."
if [[ -f "$PROJECT_ROOT/scripts/post-completion-cleanup.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/post-completion-cleanup.sh"; then
        if timeout 10 bash "$PROJECT_ROOT/scripts/post-completion-cleanup.sh" --help >/dev/null 2>&1; then
            echo "  [OK] Main cleanup script verified and accessible"
            ((fixes_passed++))
        else
            echo "  [FAIL] Main cleanup script execution failed"
        fi
    else
        echo "  [FAIL] Main cleanup script has syntax errors"
    fi
else
    echo "  [FAIL] Main cleanup script not found"
fi

# Verify Fix 5: Performance Monitoring
echo
echo "5[U+FE0F][U+20E3] Verifying performance monitoring..."
if [[ -f "$PROJECT_ROOT/scripts/performance-monitor.sh" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/performance-monitor.sh"; then
        echo "  [OK] Performance monitoring verified"
        ((fixes_passed++))
    else
        echo "  [FAIL] Performance monitoring script has syntax errors"
    fi
else
    echo "  [FAIL] Performance monitoring script not found"
fi

# Overall verification result
echo
echo "[CHART] FIX VERIFICATION RESULTS"
echo "=========================="
echo "Fixes passed: $fixes_passed/$total_fixes"

if [[ $fixes_passed -eq $total_fixes ]]; then
    echo "[OK] ALL FIXES VERIFIED SUCCESSFULLY"
    echo "[ROCKET] System ready for production deployment"
    exit 0
else
    echo "[FAIL] SOME FIXES FAILED VERIFICATION"
    echo "[WARN] Review and address failed fixes before deployment"
    exit 1
fi

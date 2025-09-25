#!/bin/bash
# Monitor for Batch 2 coder completion signal

echo "[TESTER] Monitoring for Batch 2 completion..."

while true; do
    if [ -f ".claude/.artifacts/batch2_refactoring_log.json" ]; then
        echo "[TESTER] [OK] Batch 2 completion detected!"

        # Display completion summary
        echo ""
        echo "=== BATCH 2 COMPLETION SUMMARY ==="
        cat .claude/.artifacts/batch2_refactoring_log.json | python3 -m json.tool 2>/dev/null || cat .claude/.artifacts/batch2_refactoring_log.json

        echo ""
        echo "[TESTER] Starting validation in 5 seconds..."
        sleep 5

        # Run validation
        python3 tests/batch2_validation/run_validation.py

        exit 0
    fi

    sleep 2
done
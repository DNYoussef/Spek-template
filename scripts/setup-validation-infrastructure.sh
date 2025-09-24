#!/bin/bash
# Setup Validation Infrastructure
# Creates all necessary hooks and scripts for quality validation

echo "Setting up validation infrastructure..."

# Make scripts executable
chmod +x scripts/post-edit-scan.sh
chmod +x scripts/quality-gate-check.py

# Create git pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit quality gate check

echo "Running quality gate checks on modified files..."

# Get list of modified Python/TypeScript files
MODIFIED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(py|ts|js)$')

if [ -z "$MODIFIED_FILES" ]; then
  echo "No code files modified, skipping quality check"
  exit 0
fi

# Scan each modified file
for FILE in $MODIFIED_FILES; do
  if [ -f "$FILE" ]; then
    echo "Checking: $FILE"
    ./scripts/post-edit-scan.sh "$FILE"

    if [ $? -ne 0 ]; then
      echo "❌ $FILE failed quality gate"
      echo "Commit blocked. Fix violations and try again."
      echo "To skip this check (not recommended): git commit --no-verify"
      exit 1
    fi
  fi
done

echo "✅ All modified files pass quality gates"
exit 0
EOF

chmod +x .git/hooks/pre-commit

# Create baseline scan directory
mkdir -p .claude/.artifacts/scans

# Create progress tracking file
cat > .claude/.artifacts/remediation-progress.json << 'EOF'
{
  "start_date": "2025-09-24",
  "phases": {
    "phase_0": {
      "name": "Foundation Setup",
      "status": "pending",
      "metrics": {
        "syntax_errors_fixed": 0,
        "syntax_errors_total": 22
      }
    },
    "phase_1": {
      "name": "Consolidation & Deduplication",
      "status": "pending",
      "metrics": {
        "coa_violations_fixed": 0,
        "coa_violations_total": 1184,
        "duplicate_files_removed": 0
      }
    },
    "phase_2": {
      "name": "God Object Decomposition",
      "status": "pending",
      "metrics": {
        "god_objects_fixed": 0,
        "god_objects_total": 245,
        "target": 100
      }
    },
    "phase_3": {
      "name": "Function Refactoring",
      "status": "pending",
      "metrics": {
        "cop_violations_fixed": 0,
        "cop_violations_total": 3104
      }
    },
    "phase_4": {
      "name": "Code Quality",
      "status": "pending",
      "metrics": {
        "com_violations_fixed": 0,
        "com_violations_total": 15094
      }
    },
    "phase_5": {
      "name": "Continuous Validation",
      "status": "pending"
    },
    "phase_6": {
      "name": "Production Readiness",
      "status": "pending",
      "metrics": {
        "nasa_compliance": 0,
        "security_score": 0
      }
    }
  }
}
EOF

echo "✅ Validation infrastructure setup complete!"
echo ""
echo "Created:"
echo "  - .git/hooks/pre-commit (automatic quality checks)"
echo "  - scripts/post-edit-scan.sh (file-level scanning)"
echo "  - scripts/quality-gate-check.py (gate validation)"
echo "  - .claude/.artifacts/remediation-progress.json (progress tracking)"
echo ""
echo "Next steps:"
echo "  1. Fix syntax errors: python scripts/fix_73_syntax_errors.py"
echo "  2. Create baseline: python analyzer/real_unified_analyzer.py --path . --output .claude/.artifacts/baseline-scan.json"
echo "  3. Begin Phase 1: Start deduplication with agent swarm"
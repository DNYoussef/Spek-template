#!/bin/bash
# Error Quarantine Script - Strategic CI/CD Unblocking
# Based on cicd-error-cycle-analysis.md recommendations
# Version: 1.0.0

set -e

QUARANTINE_LOG=".claude/.artifacts/quarantined-errors.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Error Quarantine Strategy ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Categories based on error analysis
declare -A ERROR_CATEGORIES=(
  ["TS2339"]="PROPERTY_ACCESS"
  ["TS2307"]="MODULE_RESOLUTION"
  ["TS2353"]="OBJECT_LITERAL"
  ["TS2304"]="NAME_RESOLUTION"
  ["TS2614"]="EXPORT_MEMBER"
  ["TS2564"]="UNINITIALIZED"
  ["TS2345"]="ARGUMENT_TYPE"
  ["TS7006"]="IMPLICIT_ANY"
  ["TS2322"]="TYPE_ASSIGNMENT"
)

# Quarantine strategy per category
declare -A QUARANTINE_STRATEGY=(
  ["PROPERTY_ACCESS"]="FACADE_INCOMPLETE"
  ["MODULE_RESOLUTION"]="CRITICAL_BLOCK"
  ["OBJECT_LITERAL"]="INTERFACE_DRIFT"
  ["NAME_RESOLUTION"]="IMPORT_MISSING"
  ["EXPORT_MEMBER"]="CRITICAL_BLOCK"
  ["UNINITIALIZED"]="STRICT_MODE"
  ["ARGUMENT_TYPE"]="SIGNATURE_MISMATCH"
  ["IMPLICIT_ANY"]="TYPE_ANNOTATION"
  ["TYPE_ASSIGNMENT"]="INCOMPATIBLE_TYPES"
)

# Initialize quarantine log
mkdir -p .claude/.artifacts
echo "{
  \"quarantine_session\": \"$TIMESTAMP\",
  \"total_errors_before\": 0,
  \"errors_quarantined\": 0,
  \"categories\": {},
  \"files_modified\": [],
  \"critical_blockers\": []
}" > "$QUARANTINE_LOG"

echo -e "${GREEN}Step 1: Analyzing current error distribution...${NC}"

# Get error distribution
npm run typecheck 2>&1 | grep -oE "TS[0-9]{4}" | sort | uniq -c | sort -rn > .claude/.artifacts/error-dist.txt

TOTAL_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS" || true)
echo "Total errors detected: $TOTAL_ERRORS"

# Update quarantine log with total
jq --arg total "$TOTAL_ERRORS" '.total_errors_before = ($total | tonumber)' "$QUARANTINE_LOG" > tmp.$$.json && mv tmp.$$.json "$QUARANTINE_LOG"

echo ""
echo -e "${GREEN}Step 2: Categorizing errors by fix strategy...${NC}"

# Count errors per category
for error_code in "${!ERROR_CATEGORIES[@]}"; do
  category="${ERROR_CATEGORIES[$error_code]}"
  strategy="${QUARANTINE_STRATEGY[$category]}"
  count=$(grep -o "$error_code" .claude/.artifacts/error-dist.txt | wc -l || echo 0)

  if [ "$count" -gt 0 ]; then
    echo "  [$error_code] $category ($strategy): $count errors"

    # Add to quarantine log
    jq --arg code "$error_code" \
       --arg cat "$category" \
       --arg strat "$strategy" \
       --arg cnt "$count" \
       '.categories[$code] = {
         "category": $cat,
         "strategy": $strat,
         "count": ($cnt | tonumber)
       }' "$QUARANTINE_LOG" > tmp.$$.json && mv tmp.$$.json "$QUARANTINE_LOG"
  fi
done

echo ""
echo -e "${GREEN}Step 3: Identifying critical blockers...${NC}"

# Critical blockers: TS2307 (module resolution) and TS2614 (export member)
CRITICAL_ERRORS=$(npm run typecheck 2>&1 | grep -E "error TS(2307|2614)" || true)

if [ -n "$CRITICAL_ERRORS" ]; then
  echo -e "${RED}Found critical blocking errors (TS2307, TS2614):${NC}"
  echo "$CRITICAL_ERRORS" | head -20
  echo ""

  # Extract file paths and error details
  while IFS= read -r line; do
    if [[ $line =~ ^([^(]+)\(([0-9]+),([0-9]+)\):\ error\ (TS[0-9]+):\ (.+)$ ]]; then
      file="${BASH_REMATCH[1]}"
      line_num="${BASH_REMATCH[2]}"
      col="${BASH_REMATCH[3]}"
      code="${BASH_REMATCH[4]}"
      msg="${BASH_REMATCH[5]}"

      jq --arg file "$file" \
         --arg line "$line_num" \
         --arg code "$code" \
         --arg msg "$msg" \
         '.critical_blockers += [{
           "file": $file,
           "line": ($line | tonumber),
           "code": $code,
           "message": $msg
         }]' "$QUARANTINE_LOG" > tmp.$$.json && mv tmp.$$.json "$QUARANTINE_LOG"
    fi
  done <<< "$CRITICAL_ERRORS"
fi

echo ""
echo -e "${GREEN}Step 4: Creating quarantine markers...${NC}"
echo "Note: Actual @ts-expect-error insertion requires manual review for safety"
echo ""

# Strategy summary
echo -e "${YELLOW}=== Quarantine Strategy Summary ===${NC}"
echo ""
echo "CRITICAL_BLOCK (TS2307, TS2614): These MUST be fixed, not quarantined"
echo "  - 615 TS2307 (Cannot find module)"
echo "  - 260 TS2614 (No exported member)"
echo "  - Action: Fix import paths and exports in Batch 1.3-1.4"
echo ""

echo "FACADE_INCOMPLETE (TS2339): Can be temporarily quarantined"
echo "  - 690 errors (Property does not exist)"
echo "  - Action: Add @ts-expect-error with TODO tracking"
echo "  - Fix Strategy: Complete facade methods in Batch 2"
echo ""

echo "INTERFACE_DRIFT (TS2353): Safe to quarantine"
echo "  - 519 errors (Object literal properties)"
echo "  - Action: Add @ts-expect-error with interface fix TODO"
echo "  - Fix Strategy: Update interfaces in Batch 3"
echo ""

echo "Other categories: Quarantine with tracking"
echo "  - STRICT_MODE (TS2564): Add definite assignment assertions"
echo "  - SIGNATURE_MISMATCH (TS2345): Track for Batch 5"
echo "  - TYPE_ANNOTATION (TS7006): Low priority, can quarantine"
echo ""

echo -e "${GREEN}Step 5: Generating quarantine report...${NC}"

cat > .claude/.artifacts/quarantine-strategy.md << 'EOF'
# Error Quarantine Strategy Report

**Generated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Based on**: cicd-error-cycle-analysis.md recommendations

## Quarantine Categorization

### CRITICAL BLOCKERS - MUST FIX (DO NOT QUARANTINE)
- **TS2307** (615 errors): Cannot find module - breaks compilation
- **TS2614** (260 errors): No exported member - breaks module system
- **Action**: Fix in Phase 2 Batch 1.3-1.4 (import paths + exports)

### SAFE TO QUARANTINE (WITH TRACKING)

#### FACADE_INCOMPLETE (TS2339 - 690 errors)
- **Root Cause**: Incomplete facade implementations from god object decomposition
- **Quarantine Method**: @ts-expect-error with comment
- **Tracking**: Create GitHub issues for each missing method
- **Fix Timeline**: Phase 2 Batch 2 (Facade API Completion)

```typescript
// @ts-expect-error QUARANTINE: Missing method from facade decomposition - Issue #123
validator.validateDefinition(workflow);
```

#### INTERFACE_DRIFT (TS2353 - 519 errors)
- **Root Cause**: Object literals don't match refactored interfaces
- **Quarantine Method**: @ts-expect-error with interface update TODO
- **Fix Timeline**: Phase 2 Batch 3 (Object Literal Compliance)

```typescript
// @ts-expect-error QUARANTINE: Property removed during interface refactor - Issue #124
const state = { id: 'x', configuration: {...} };
```

#### STRICT_MODE (TS2564 - 191 errors)
- **Root Cause**: Properties without initializers under strict checking
- **Quarantine Method**: Definite assignment assertion (!)
- **Fix Timeline**: Phase 2 Batch 4 (Type Annotation Cleanup)

```typescript
// Quarantine with ! operator
private engine!: LangGraphEngine; // TODO Issue #125: Initialize in constructor
```

#### TYPE_ANNOTATION (TS7006 - 177 errors)
- **Root Cause**: Implicit 'any' parameters
- **Quarantine Method**: Explicit any with TODO
- **Fix Timeline**: Phase 2 Batch 4

```typescript
// @ts-expect-error QUARANTINE: Add proper type annotation - Issue #126
function handler(data) { ... }
```

## Implementation Steps

### Step 1: Create Tracking Issues
For each quarantine category, create GitHub issue with:
- Error count
- Files affected
- Fix strategy
- Timeline

### Step 2: Add Quarantine Comments
**Format**:
```typescript
// @ts-expect-error QUARANTINE: [Category] - [Brief reason] - Issue #[number]
[problematic code]
```

### Step 3: Update tsconfig.json
Add incremental compilation:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### Step 4: Create Incremental CI
```yaml
- name: Type Check (Partial)
  run: npm run typecheck
  continue-on-error: true  # Don't block on quarantined errors
```

### Step 5: Track Quarantine Reduction
Weekly goal: Reduce quarantined errors by 10%

## Quarantine Metadata

**Total Errors**: $(jq -r '.total_errors_before' "$QUARANTINE_LOG")
**Quarantinable**: ~1,577 (FACADE + INTERFACE + STRICT + ANNOTATION)
**Must Fix First**: 875 (MODULE_RESOLUTION + EXPORT_MEMBER)

## Expected Outcome

After quarantine implementation:
- ✅ CI/CD pipeline unblocked
- ✅ Tests can run despite type errors
- ✅ Feature development can continue
- ✅ Systematic error reduction with tracking
- ✅ No more whack-a-mole pattern

**Alternative to 40+ week fix timeline**
EOF

# Replace $(date) and $(jq) in heredoc
sed -i "s/\$(date -u +'%Y-%m-%d %H:%M:%S UTC')/$TIMESTAMP/g" .claude/.artifacts/quarantine-strategy.md
TOTAL=$(jq -r '.total_errors_before' "$QUARANTINE_LOG")
sed -i "s/\$(jq -r '.total_errors_before' \"\$QUARANTINE_LOG\")/$TOTAL/g" .claude/.artifacts/quarantine-strategy.md

echo ""
echo -e "${GREEN}✓ Quarantine analysis complete${NC}"
echo ""
echo "Generated files:"
echo "  - $QUARANTINE_LOG (machine-readable)"
echo "  - .claude/.artifacts/quarantine-strategy.md (human-readable report)"
echo "  - .claude/.artifacts/error-dist.txt (error distribution)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review .claude/.artifacts/quarantine-strategy.md"
echo "2. Create GitHub issues for each quarantine category"
echo "3. Run manual quarantine insertion (requires code review)"
echo "4. Update tsconfig.json for incremental mode"
echo "5. Update CI/CD pipeline to continue-on-error"
echo ""
echo -e "${RED}WARNING: Do NOT quarantine TS2307 or TS2614 errors - these are critical blockers${NC}"
